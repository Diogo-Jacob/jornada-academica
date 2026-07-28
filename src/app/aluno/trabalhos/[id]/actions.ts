"use server";

import { submissionResubmittedEmail } from "@/services/email/templates/submission-resubmitted";
import { authorshipCompositionSavedEmail } from "@/services/email/templates/authorship-composition-saved";
import { sendEmail } from "@/services/email/send-email";
import { submissionConfirmationEmail } from "@/services/email/templates/submission-confirmation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const STORAGE_BUCKET = "submission-files";

const MAX_DOCX_SIZE = 2 * 1024 * 1024;
const MAX_PDF_SIZE = 5 * 1024 * 1024;

const MIN_TOTAL_AUTHORS = 2;
const MAX_TOTAL_AUTHORS = 7;

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const PDF_MIME_TYPE = "application/pdf";

const UPLOAD_TIMEOUT_MS = 45_000;

function redirectWithMessage(
  submissionId: string,
  type: "erro" | "sucesso",
  message: string,
  anchor?: string
): never {
  const hash = anchor
    ? `#${anchor.replace(/^#/, "")}`
    : "";

  redirect(
    `/aluno/trabalhos/${submissionId}?${type}=${encodeURIComponent(message)}${hash}`
  );
}

async function validateEditableSubmission(
  submissionId: string
) {
  const { profile, supabase } =
    await getCurrentUser();

  const { data: submission, error } =
    await supabase
      .from("submissions")
      .select(`
        id,
        status,
        total_authors,
        owner_user_id,
        event_id,
        requires_ethics_approval
      `)
      .eq("id", submissionId)
      .eq("owner_user_id", profile.id)
      .maybeSingle();

  if (error || !submission) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O trabalho não foi encontrado."
    );
  }

  if (
    submission.status !== "draft" &&
    submission.status !== "correction_requested"
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Este trabalho não pode mais ser alterado."
    );
  }

  return {
    profile,
    supabase,
    submission,
  };
}

async function markCorrectionUpdatedIfNeeded({
  supabase,
  submissionId,
  submissionStatus,
}: {
  supabase: Awaited<ReturnType<typeof getCurrentUser>>["supabase"];
  submissionId: string;
  submissionStatus: string;
}) {
  if (submissionStatus !== "correction_requested") {
    return;
  }

  const { error } = await supabase
    .from("submissions")
    .update({
      correction_updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("status", "correction_requested");

  if (error) {
    console.error("Erro ao registrar alteração da correção:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
}

function validateSubmissionPeriodForFinalSubmit(
  submissionId: string,
  event: {
    submission_starts_at: string | null;
    submission_ends_at: string | null;
  }
) {
  const now = new Date();

  if (
    event.submission_starts_at &&
    now < new Date(event.submission_starts_at)
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O período de submissões ainda não começou. O envio definitivo não está disponível."
    );
  }

  if (
    event.submission_ends_at &&
    now > new Date(event.submission_ends_at)
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O período de submissões foi encerrado. Não é mais possível submeter o trabalho definitivamente."
    );
  }
}

async function validateDocxFile(
  file: File
): Promise<string | null> {
  if (file.size === 0) {
    return "Selecione o arquivo.";
  }

  if (file.size > MAX_DOCX_SIZE) {
    return "O arquivo deve possuir no máximo 2 MB.";
  }

  if (!file.name.toLowerCase().endsWith(".docx")) {
    return "O arquivo deve estar no formato DOCX.";
  }

  const acceptedMimeTypes = [
    DOCX_MIME_TYPE,
    "application/octet-stream",
    "application/zip",
  ];

  if (
    file.type &&
    !acceptedMimeTypes.includes(file.type)
  ) {
    return "O tipo do arquivo enviado não é válido.";
  }

  const firstBytes = new Uint8Array(
    await file.slice(0, 2).arrayBuffer()
  );

  if (
    firstBytes[0] !== 0x50 ||
    firstBytes[1] !== 0x4b
  ) {
    return "O conteúdo do arquivo não corresponde a um DOCX válido.";
  }

  return null;
}

async function validatePdfFile(
  file: File
): Promise<string | null> {
  if (file.size === 0) {
    return "Selecione o arquivo PDF.";
  }

  if (file.size > MAX_PDF_SIZE) {
    return "O arquivo PDF deve possuir no máximo 5 MB.";
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "O arquivo deve estar no formato PDF.";
  }

  if (file.type && file.type !== PDF_MIME_TYPE) {
    return "O tipo do arquivo enviado não é válido.";
  }

  const firstBytes = new Uint8Array(
    await file.slice(0, 5).arrayBuffer()
  );

  const signature =
    String.fromCharCode(...firstBytes);

  if (signature !== "%PDF-") {
    return "O conteúdo do arquivo não corresponde a um PDF válido.";
  }

  return null;
}

/* =========================================================
   AUTORES
========================================================= */

export async function saveAuthorComposition(
  formData: FormData
) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  if (!submissionId) {
    redirect("/aluno/trabalhos");
  }

  const { supabase, submission } =
    await validateEditableSubmission(
      submissionId
    );

  const totalAuthors =
    submission.total_authors;

  if (
  !totalAuthors ||
  totalAuthors < MIN_TOTAL_AUTHORS ||
  totalAuthors > MAX_TOTAL_AUTHORS
) {
  redirectWithMessage(
    submissionId,
    "erro",
    "A quantidade total de autores deve estar entre 2 e 7, incluindo o autor responsável e o orientador.",
    "autores-section"
  );
}

  const {
    data: submissionDetails,
    error: submissionDetailsError,
  } = await supabase
    .from("submissions")
    .select(`
      id,
      title
    `)
    .eq("id", submissionId)
    .maybeSingle();

  if (
    submissionDetailsError ||
    !submissionDetails
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível consultar os dados do trabalho."
    );
  }

  const {
    data: responsibleAuthor,
    error: responsibleError,
  } = await supabase
    .from("submission_authors")
    .select(`
      id,
      full_name,
      email,
      email_normalized
    `)
    .eq("submission_id", submissionId)
    .eq("author_role", "responsible")
    .maybeSingle();

  if (
    responsibleError ||
    !responsibleAuthor
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O autor responsável não foi localizado."
    );
  }

  const normalizedEmails = new Set<string>([
    responsibleAuthor.email_normalized,
  ]);

  const authorsToInsert: Array<{
    submission_id: string;
    full_name: string;
    email: string;
    is_responsible: boolean;
    author_role: "coauthor" | "advisor";
    display_order: number;
  }> = [];

  for (
    let position = 2;
    position <= totalAuthors;
    position += 1
  ) {
    const fullName = String(
      formData.get(
        `author_${position}_name`
      ) ?? ""
    ).trim();

    const email = String(
      formData.get(
        `author_${position}_email`
      ) ?? ""
    )
      .trim()
      .toLowerCase();

    const isAdvisor =
      position === totalAuthors;

    const role = isAdvisor
      ? "advisor"
      : "coauthor";

    if (fullName.length < 3) {
      redirectWithMessage(
        submissionId,
        "erro",
        `Informe o nome completo do ${position}º autor.`
      );
    }

    if (
      !email ||
      !email.includes("@")
    ) {
      redirectWithMessage(
        submissionId,
        "erro",
        `Informe um e-mail válido para o ${position}º autor.`
      );
    }

    if (normalizedEmails.has(email)) {
      redirectWithMessage(
        submissionId,
        "erro",
        `O e-mail informado para o ${position}º autor já está sendo utilizado neste trabalho.`
      );
    }

    normalizedEmails.add(email);

    authorsToInsert.push({
      submission_id: submissionId,
      full_name: fullName,
      email,
      is_responsible: false,
      author_role: role,
      display_order: position,
    });
  }

  const {
    data: previousAuthors,
    error: previousAuthorsError,
  } = await supabase
    .from("submission_authors")
    .select(`
      user_id,
      full_name,
      email,
      is_responsible,
      author_role,
      display_order
    `)
    .eq("submission_id", submissionId)
    .neq("author_role", "responsible");

  if (previousAuthorsError) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível preparar a atualização dos autores."
    );
  }

  const { error: deleteError } =
    await supabase
      .from("submission_authors")
      .delete()
      .eq("submission_id", submissionId)
      .neq("author_role", "responsible");

  if (deleteError) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível atualizar os autores."
    );
  }

  const { error: insertError } =
    await supabase
      .from("submission_authors")
      .insert(authorsToInsert);

  if (insertError) {
    console.error(
      "Erro ao inserir autores:",
      insertError
    );

    if (previousAuthors?.length) {
      await supabase
        .from("submission_authors")
        .insert(
          previousAuthors.map(
            (author) => ({
              submission_id:
                submissionId,
              user_id:
                author.user_id,
              full_name:
                author.full_name,
              email:
                author.email,
              is_responsible:
                author.is_responsible,
              author_role:
                author.author_role,
              display_order:
                author.display_order,
            })
          )
        );
    }

    const message =
      insertError.message.toLowerCase();

    if (
      message.includes("duplicate") ||
      message.includes("unique")
    ) {
      redirectWithMessage(
        submissionId,
        "erro",
        "Existem autores duplicados ou posições de autoria repetidas."
      );
    }

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível salvar a composição da autoria."
    );
  }

  const savedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  for (const author of authorsToInsert) {
    const emailResult = await sendEmail({
      to: author.email,
      subject: `Confirmação de autoria - ${submissionDetails.title}`,
      html: authorshipCompositionSavedEmail({
        authorName: author.full_name,
        responsibleAuthorName:
          responsibleAuthor.full_name ??
          "Autor responsável",
        title: submissionDetails.title,
        role: author.author_role,
        savedAt,
      }),
    });

    if (!emailResult.success) {
      console.error(
        "E-mail de confirmação de autoria não enviado:",
        {
          authorEmail: author.email,
          emailResult,
        }
      );
    }
  }

  await markCorrectionUpdatedIfNeeded({
    supabase,
    submissionId,
    submissionStatus: submission.status,
  });

  revalidatePath(
    `/aluno/trabalhos/${submissionId}`
  );

  redirectWithMessage(
    submissionId,
    "sucesso",
    "Composição da autoria salva com sucesso.",
    "autores-section"
  );
}

/* =========================================================
   PARECER DO CEP
========================================================= */

export async function uploadEthicsApproval(
  formData: FormData
) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  const fileValue =
    formData.get("ethicsApprovalFile");

  if (!submissionId) {
    redirect("/aluno/trabalhos");
  }

  if (
    !(fileValue instanceof File) ||
    fileValue.size === 0
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Selecione o parecer consubstanciado de aprovação do CEP."
    );
  }

  const validationError =
    await validatePdfFile(fileValue);

  if (validationError) {
    redirectWithMessage(
      submissionId,
      "erro",
      `Parecer do CEP: ${validationError}`
    );
  }

  const { profile, supabase, submission } =
    await validateEditableSubmission(
      submissionId
    );

  if (!submission.requires_ethics_approval) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Este trabalho foi declarado como dispensado de aprovação pelo CEP."
    );
  }

  const fileId = crypto.randomUUID();

  const storagePath =
    `${submissionId}/ethics_approval/${fileId}.pdf`;

  const { error: uploadError } =
    await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(
        storagePath,
        fileValue,
        {
          contentType: PDF_MIME_TYPE,
          upsert: false,
        }
      );

  if (uploadError) {
    console.error(
      "Erro no upload do parecer do CEP:",
      uploadError
    );

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível enviar o parecer do CEP."
    );
  }

  const {
    data: previousFile,
    error: previousFileError,
  } = await supabase
    .from("submission_files")
    .select(`
      id,
      version_number
    `)
    .eq("submission_id", submissionId)
    .eq(
      "file_type",
      "ethics_approval"
    )
    .eq("is_current", true)
    .maybeSingle();

  if (previousFileError) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível consultar o parecer do CEP anterior."
    );
  }

  const nextVersion =
    (previousFile?.version_number ?? 0) + 1;

  if (previousFile) {
    const { error: updatePreviousError } =
      await supabase
        .from("submission_files")
        .update({
          is_current: false,
        })
        .eq("id", previousFile.id);

    if (updatePreviousError) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath]);

      redirectWithMessage(
        submissionId,
        "erro",
        "Não foi possível substituir o parecer do CEP anterior."
      );
    }
  }

  const { error: recordError } =
    await supabase
      .from("submission_files")
      .insert({
        submission_id: submissionId,
        file_type:
          "ethics_approval",
        storage_path: storagePath,
        original_filename:
          fileValue.name,
        mime_type: PDF_MIME_TYPE,
        size_bytes: fileValue.size,
        version_number: nextVersion,
        is_current: true,
        uploaded_by: profile.id,
      });

  if (recordError) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (previousFile) {
      await supabase
        .from("submission_files")
        .update({
          is_current: true,
        })
        .eq("id", previousFile.id);
    }

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível registrar o parecer do CEP."
    );
  }

  revalidatePath(
    `/aluno/trabalhos/${submissionId}`
  );

  redirectWithMessage(
    submissionId,
    "sucesso",
    "Parecer do CEP enviado com sucesso.",
    "aspectos-eticos-section"
  );
}

/* =========================================================
   DECLARAÇÃO DO ORIENTADOR
========================================================= */

export async function uploadAdvisorDeclaration(
  formData: FormData
) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  const fileValue =
    formData.get("advisorDeclarationFile");

  if (!submissionId) {
    redirect("/aluno/trabalhos");
  }

  if (
    !(fileValue instanceof File) ||
    fileValue.size === 0
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Selecione a declaração do orientador."
    );
  }

  const validationError =
    await validatePdfFile(fileValue);

  if (validationError) {
    redirectWithMessage(
      submissionId,
      "erro",
      `Declaração do orientador: ${validationError}`
    );
  }

  const { profile, supabase, submission } =
    await validateEditableSubmission(
      submissionId
    );

  const fileId = crypto.randomUUID();

  const storagePath =
    `${submissionId}/advisor_declaration/${fileId}.pdf`;

  const { error: uploadError } =
    await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(
        storagePath,
        fileValue,
        {
          contentType: PDF_MIME_TYPE,
          upsert: false,
        }
      );

  if (uploadError) {
    console.error(
      "Erro no upload da declaração:",
      uploadError
    );

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível enviar a declaração do orientador."
    );
  }

  const {
    data: previousFile,
    error: previousFileError,
  } = await supabase
    .from("submission_files")
    .select(`
      id,
      version_number
    `)
    .eq("submission_id", submissionId)
    .eq(
      "file_type",
      "advisor_declaration"
    )
    .eq("is_current", true)
    .maybeSingle();

  if (previousFileError) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível consultar a declaração anterior."
    );
  }

  const nextVersion =
    (previousFile?.version_number ?? 0) + 1;

  if (previousFile) {
    const { error: updatePreviousError } =
      await supabase
        .from("submission_files")
        .update({
          is_current: false,
        })
        .eq("id", previousFile.id);

    if (updatePreviousError) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath]);

      redirectWithMessage(
        submissionId,
        "erro",
        "Não foi possível substituir a declaração anterior."
      );
    }
  }

  const { error: recordError } =
    await supabase
      .from("submission_files")
      .insert({
        submission_id: submissionId,
        file_type:
          "advisor_declaration",
        storage_path: storagePath,
        original_filename:
          fileValue.name,
        mime_type: PDF_MIME_TYPE,
        size_bytes: fileValue.size,
        version_number: nextVersion,
        is_current: true,
        uploaded_by: profile.id,
      });

  if (recordError) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (previousFile) {
      await supabase
        .from("submission_files")
        .update({
          is_current: true,
        })
        .eq("id", previousFile.id);
    }

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível registrar a declaração do orientador."
    );
  }

  await markCorrectionUpdatedIfNeeded({
    supabase,
    submissionId,
    submissionStatus: submission.status,
  });

  revalidatePath(
    `/aluno/trabalhos/${submissionId}`
  );

  redirectWithMessage(
    submissionId,
    "sucesso",
    "Declaração do orientador enviada com sucesso.",
    "declaracao-orientador-section"
  );
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMessage: string,
  timeoutMs = UPLOAD_TIMEOUT_MS
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      promise,
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/* =========================================================
   ARQUIVOS DOCX
========================================================= */

export async function uploadSubmissionFiles(
  formData: FormData
) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  const identifiedFileValue =
    formData.get("identifiedFile");

  const anonymousFileValue =
    formData.get("anonymousFile");

  if (!submissionId) {
    redirect("/aluno/trabalhos");
  }

  if (
    !(identifiedFileValue instanceof File) ||
    !(anonymousFileValue instanceof File)
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Selecione as duas versões do trabalho."
    );
  }

  const identifiedError =
    await validateDocxFile(
      identifiedFileValue
    );

  if (identifiedError) {
    redirectWithMessage(
      submissionId,
      "erro",
      `Versão identificada: ${identifiedError}`
    );
  }

  const anonymousError =
    await validateDocxFile(
      anonymousFileValue
    );

  if (anonymousError) {
    redirectWithMessage(
      submissionId,
      "erro",
      `Versão anonimizada: ${anonymousError}`
    );
  }

  const { profile, supabase, submission } =
    await validateEditableSubmission(
      submissionId
    );

  const files = [
    {
      type: "identified" as const,
      file: identifiedFileValue,
    },
    {
      type: "anonymous" as const,
      file: anonymousFileValue,
    },
  ];

  const uploadedPaths: string[] = [];
  let uploadFailure = false;

  try {
    for (const item of files) {
      const fileId = crypto.randomUUID();

      const storagePath =
        `${submissionId}/${item.type}/${fileId}.docx`;

      const { error: uploadError } =
        await withTimeout(
          supabase.storage
            .from(STORAGE_BUCKET)
            .upload(
              storagePath,
              item.file,
              {
                contentType: DOCX_MIME_TYPE,
                upsert: false,
              }
            ),
          "O envio dos arquivos demorou mais que o esperado. Verifique sua conexão e tente novamente."
        );

      if (uploadError) {
        throw uploadError;
      }

      uploadedPaths.push(storagePath);

      const {
        data: previousFile,
        error: previousFileError,
      } = await supabase
        .from("submission_files")
        .select(`
          id,
          version_number
        `)
        .eq(
          "submission_id",
          submissionId
        )
        .eq("file_type", item.type)
        .eq("is_current", true)
        .maybeSingle();

      if (previousFileError) {
        throw previousFileError;
      }

      const nextVersion =
        (previousFile?.version_number ??
          0) + 1;

      if (previousFile) {
        const {
          error: previousUpdateError,
        } = await supabase
          .from("submission_files")
          .update({
            is_current: false,
          })
          .eq("id", previousFile.id);

        if (previousUpdateError) {
          throw previousUpdateError;
        }
      }

      const { error: databaseError } =
        await supabase
          .from("submission_files")
          .insert({
            submission_id:
              submissionId,
            file_type: item.type,
            storage_path:
              storagePath,
            original_filename:
              item.file.name,
            mime_type:
              DOCX_MIME_TYPE,
            size_bytes:
              item.file.size,
            version_number:
              nextVersion,
            is_current: true,
            uploaded_by:
              profile.id,
          });

      if (databaseError) {
        throw databaseError;
      }
    }
  } catch (error) {
    uploadFailure = true;

    console.error("Erro ao enviar arquivos:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    if (uploadedPaths.length > 0) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(uploadedPaths);
    }
  }

  if (uploadFailure) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível enviar os arquivos. Verifique sua conexão, confirme se os arquivos possuem no máximo 2 MB cada e tente novamente.",
      "arquivos-trabalho-section"
    );
  }

  await markCorrectionUpdatedIfNeeded({
    supabase,
    submissionId,
    submissionStatus: submission.status,
  });

  revalidatePath(
    `/aluno/trabalhos/${submissionId}`
  );

  redirectWithMessage(
    submissionId,
    "sucesso",
    "Os dois arquivos foram enviados com sucesso.",
    "arquivos-trabalho-section"
  );
}

/* =========================================================
   ENVIO DEFINITIVO
========================================================= */

export async function submitSubmission(
  formData: FormData
) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  const acceptedOriginalityTerms =
    formData.get(
      "acceptedOriginalityTerms"
    ) === "on";

  if (!submissionId) {
    redirect("/aluno/trabalhos");
  }

  if (!acceptedOriginalityTerms) {
    redirectWithMessage(
      submissionId,
      "erro",
      "É necessário aceitar a declaração de ineditismo antes de submeter o trabalho."
    );
  }

  const {
    profile,
    supabase,
    submission,
  } = await validateEditableSubmission(
    submissionId
  );

  const isCorrectionResubmission =
    submission.status === "correction_requested";

  const nextStatus = isCorrectionResubmission
    ? "resubmitted"
    : "submitted";

  const { data: event, error: eventError } =
    await supabase
      .from("events")
      .select(`
        year,
        submission_starts_at,
        submission_ends_at
      `)
      .eq("id", submission.event_id)
      .single();

  if (eventError || !event) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível identificar a edição da Jornada."
    );
  }

  validateSubmissionPeriodForFinalSubmit(
    submissionId,
    event
  );

  const totalAuthors =
    submission.total_authors;

  if (!totalAuthors) {
    redirectWithMessage(
      submissionId,
      "erro",
      "A quantidade total de autores não foi informada."
    );
  }

  if (
    totalAuthors < MIN_TOTAL_AUTHORS ||
    totalAuthors > MAX_TOTAL_AUTHORS
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O trabalho deve possuir entre 2 e 7 autores, incluindo o autor responsável e o orientador.",
      "autores-section"
    );
  }

  const { data: authors, error: authorsError } =
    await supabase
      .from("submission_authors")
      .select(`
        id,
        full_name,
        email,
        author_role,
        display_order
      `)
      .eq("submission_id", submissionId);

  if (authorsError) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível verificar os autores."
    );
  }

  if (
    !authors ||
    authors.length !== totalAuthors
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      `Preencha e salve todos os ${totalAuthors} autores antes de submeter o trabalho.`
    );
  }

  const responsibleAuthor = authors.find(
    (author) =>
      author.author_role === "responsible" &&
      author.display_order === 1
  );

  const advisor = authors.find(
    (author) =>
      author.author_role === "advisor" &&
      author.display_order === totalAuthors
  );

  if (!responsibleAuthor) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O autor responsável não foi identificado corretamente."
    );
  }

  if (!advisor) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O orientador deve ocupar a última posição da autoria."
    );
  }

  const { data: files, error: filesError } =
    await supabase
      .from("submission_files")
      .select(`
        id,
        file_type
      `)
      .eq("submission_id", submissionId)
      .eq("is_current", true);

  if (filesError) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível verificar os documentos da submissão."
    );
  }

  const fileTypes = new Set(
    files?.map((file) => file.file_type) ?? []
  );

  if (!fileTypes.has("identified")) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Envie a versão identificada do trabalho."
    );
  }

  if (!fileTypes.has("anonymous")) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Envie a versão anonimizada do trabalho."
    );
  }

  if (
    !fileTypes.has(
      "advisor_declaration"
    )
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Envie a declaração do orientador."
    );
  }

  if (
    submission.requires_ethics_approval &&
    !fileTypes.has("ethics_approval")
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Envie o parecer consubstanciado de aprovação do CEP."
    );
  }

  const {
    data: declarations,
    error: declarationsError,
  } = await supabase
    .from("submission_declarations")
    .select(`
      id,
      accepted_general_terms,
      accepted_ethics_terms
    `)
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (
    declarationsError ||
    !declarations
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "As declarações obrigatórias não foram encontradas."
    );
  }

  if (
    !declarations.accepted_general_terms ||
    !declarations.accepted_ethics_terms
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "As declarações gerais e éticas precisam estar aceitas."
    );
  }

  const acceptedAt =
    new Date().toISOString();

  const { error: originalityError } =
    await supabase
      .from("submission_declarations")
      .update({
        accepted_originality_terms: true,
        originality_terms_accepted_at:
          acceptedAt,
        accepted_by: profile.id,
      })
      .eq("submission_id", submissionId);

  if (originalityError) {
    console.error(
      "Erro ao registrar ineditismo:",
      originalityError
    );

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível registrar a declaração de ineditismo."
    );
  }

  const protocol =
    submission.status === "correction_requested"
      ? null
      : `JAM-${event.year}-${crypto.randomUUID()
          .replaceAll("-", "")
          .slice(0, 8)
          .toUpperCase()}`;

  const updatePayload = isCorrectionResubmission
    ? {
        status: nextStatus,
      }
    : {
        status: nextStatus,
        protocol,
      };

  const { error: submitError } =
    await supabase
      .from("submissions")
      .update(updatePayload)
      .eq("id", submissionId)
      .eq("owner_user_id", profile.id)
      .in("status", [
        "draft",
        "correction_requested",
      ]);

  if (submitError) {
    console.error("Erro completo ao submeter trabalho:", {
      message: submitError.message,
      details: submitError.details,
      hint: submitError.hint,
      code: submitError.code,
    });

    const errorMessage =
      submitError.message?.toLowerCase() ?? "";

    if (
      errorMessage.includes("limite") ||
      errorMessage.includes("participações")
    ) {
      redirectWithMessage(
        submissionId,
        "erro",
        "Um dos autores já atingiu o limite de cinco participações submetidas nesta edição."
      );
    }

    if (
      errorMessage.includes("invalid input value for enum") ||
      errorMessage.includes("submitted") ||
      errorMessage.includes("resubmitted")
    ) {
      redirectWithMessage(
        submissionId,
        "erro",
        "O status da submissão ainda não está configurado corretamente no banco de dados."
      );
    }

    if (
      errorMessage.includes("duplicate") ||
      errorMessage.includes("unique")
    ) {
      redirectWithMessage(
        submissionId,
        "erro",
        "Não foi possível gerar um protocolo exclusivo. Tente novamente."
      );
    }

    if (
      errorMessage.includes("row-level security") ||
      errorMessage.includes("policy")
    ) {
      redirectWithMessage(
        submissionId,
        "erro",
        "A política de segurança do banco não permitiu finalizar a submissão."
      );
    }

    redirectWithMessage(
      submissionId,
      "erro",
      `Não foi possível finalizar a submissão: ${submitError.message}`
    );
  }

  const {
    data: submittedSubmission,
    error: submittedSubmissionError,
  } = await supabase
    .from("submissions")
    .select(`
      title,
      protocol
    `)
    .eq("id", submissionId)
    .maybeSingle();

  if (submittedSubmissionError) {
    console.error("Erro ao buscar dados para e-mail:", {
      message: submittedSubmissionError.message,
      details: submittedSubmissionError.details,
      hint: submittedSubmissionError.hint,
      code: submittedSubmissionError.code,
    });
  }

  const responsibleAuthorEmail =
  responsibleAuthor.email ?? profile.email;

const responsibleAuthorName =
  responsibleAuthor.full_name ?? profile.full_name;

const submittedAt = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
}).format(new Date());

if (submittedSubmission?.title) {
  if (isCorrectionResubmission) {
    const emailResult = await sendEmail({
      to: responsibleAuthorEmail,
      subject: `Reenvio de trabalho recebido - ${
        submittedSubmission.protocol ?? submittedSubmission.title
      }`,
      html: submissionResubmittedEmail({
        studentName: responsibleAuthorName ?? "Aluno(a)",
        title: submittedSubmission.title,
        protocol: submittedSubmission.protocol,
        resubmittedAt: submittedAt,
      }),
    });

    if (!emailResult.success) {
      console.error(
        "Comprovante de reenvio não enviado:",
        emailResult
      );
    }
  } else {
    const authorsSortedByOrder = [...authors].sort(
      (firstAuthor, secondAuthor) =>
        firstAuthor.display_order -
        secondAuthor.display_order
    );

    for (const author of authorsSortedByOrder) {
      if (!author.email) {
        continue;
      }

      const emailResult = await sendEmail({
        to: author.email,
        subject: `Comprovante de submissão - ${
          submittedSubmission.protocol ?? protocol
        }`,
        html: submissionConfirmationEmail({
          studentName: author.full_name ?? "Autor(a)",
          title: submittedSubmission.title,
          protocol:
            submittedSubmission.protocol ??
            protocol ??
            "Protocolo não informado",
          submittedAt,
        }),
      });

      if (!emailResult.success) {
        console.error(
          "Comprovante de submissão não enviado para autor:",
          {
            authorEmail: author.email,
            authorName: author.full_name,
            emailResult,
          }
        );
      }
    }
  }
}

  revalidatePath("/aluno");
  revalidatePath("/aluno/trabalhos");
  revalidatePath(
    `/aluno/trabalhos/${submissionId}`
  );

  redirectWithMessage(
    submissionId,
    "sucesso",
    isCorrectionResubmission
      ? "Trabalho reenviado com sucesso para nova conferência documental."
      : `Trabalho submetido com sucesso. Protocolo: ${
          submittedSubmission?.protocol ??
          protocol
        }`
  );
}
