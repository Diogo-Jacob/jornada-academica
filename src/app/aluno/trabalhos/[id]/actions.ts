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

const ACTION_TIMEOUT_MS = 45_000;
const DATABASE_TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 45_000;
const EMAIL_TIMEOUT_MS = 15_000;

type SupabaseClient = Awaited<
  ReturnType<typeof getCurrentUser>
>["supabase"];

type SubmissionFileType =
  | "identified"
  | "anonymous"
  | "ethics_approval"
  | "advisor_declaration";

type FileReplacementRecord = {
  storagePath: string;
  newFileId: string;
  previousFileId: string | null;
};

type AuthorForEmail = {
  full_name: string | null;
  email: string | null;
  author_role: string;
  display_order: number;
};

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
    `/aluno/trabalhos/${submissionId}?${type}=${encodeURIComponent(
      message
    )}${hash}`
  );
}

async function withTimeout<T>(
  action: () => Promise<T>,
  timeoutMessage: string,
  timeoutMs = ACTION_TIMEOUT_MS
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      action(),
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function sendEmailSafely({
  email,
  context,
}: {
  email: Parameters<typeof sendEmail>[0];
  context: Record<string, unknown>;
}) {
  try {
    const emailResult = await withTimeout(
      async () => await sendEmail(email),
      "O envio do e-mail demorou mais que o esperado.",
      EMAIL_TIMEOUT_MS
    );

    if (!emailResult.success) {
      console.error("E-mail não enviado:", {
        ...context,
        emailResult,
      });
    }
  } catch (error) {
    console.error("E-mail falhou ou demorou demais:", {
      ...context,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });
  }
}

async function validateEditableSubmission(
  submissionId: string
) {
  const { profile, supabase } =
    await getCurrentUser();

  const { data: submission, error } =
    await withTimeout(
      async () =>
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
          .maybeSingle(),
      "A validação do trabalho demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

  if (error || !submission) {
    console.error("Erro ao validar trabalho editável:", {
      submissionId,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });

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
  supabase: SupabaseClient;
  submissionId: string;
  submissionStatus: string;
}) {
  if (submissionStatus !== "correction_requested") {
    return;
  }

  try {
    const { error } = await withTimeout(
      async () =>
        await supabase
          .from("submissions")
          .update({
            correction_updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId)
          .eq("status", "correction_requested"),
      "O registro da atualização da correção demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

    if (error) {
      console.error(
        "Erro ao registrar alteração da correção:",
        {
          submissionId,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
      );
    }
  } catch (error) {
    console.error(
      "Falha ou demora ao registrar alteração da correção:",
      {
        submissionId,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
        error,
      }
    );
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

function formatDateTimeBR(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

async function replaceCurrentFile({
  supabase,
  profileId,
  submissionId,
  fileType,
  file,
  extension,
  contentType,
}: {
  supabase: SupabaseClient;
  profileId: string;
  submissionId: string;
  fileType: SubmissionFileType;
  file: File;
  extension: "pdf" | "docx";
  contentType: string;
}): Promise<FileReplacementRecord> {
  const fileId = crypto.randomUUID();

  const storagePath =
    `${submissionId}/${fileType}/${fileId}.${extension}`;

  const { error: uploadError } = await withTimeout(
    async () =>
      await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          contentType,
          upsert: false,
        }),
    "O envio do arquivo demorou mais que o esperado. Verifique sua conexão e tente novamente.",
    UPLOAD_TIMEOUT_MS
  );

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: previousFile,
    error: previousFileError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("submission_files")
        .select(`
          id,
          version_number
        `)
        .eq("submission_id", submissionId)
        .eq("file_type", fileType)
        .eq("is_current", true)
        .maybeSingle(),
    "A consulta do arquivo anterior demorou mais que o esperado.",
    DATABASE_TIMEOUT_MS
  );

  if (previousFileError) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    throw previousFileError;
  }

  const nextVersion =
    (previousFile?.version_number ?? 0) + 1;

  if (previousFile) {
    const { error: updatePreviousError } =
      await withTimeout(
        async () =>
          await supabase
            .from("submission_files")
            .update({
              is_current: false,
            })
            .eq("id", previousFile.id),
        "A substituição do arquivo anterior demorou mais que o esperado.",
        DATABASE_TIMEOUT_MS
      );

    if (updatePreviousError) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath]);

      throw updatePreviousError;
    }
  }

  const { data: newFile, error: recordError } =
    await withTimeout(
      async () =>
        await supabase
          .from("submission_files")
          .insert({
            submission_id: submissionId,
            file_type: fileType,
            storage_path: storagePath,
            original_filename: file.name,
            mime_type: contentType,
            size_bytes: file.size,
            version_number: nextVersion,
            is_current: true,
            uploaded_by: profileId,
          })
          .select("id")
          .maybeSingle(),
      "O registro do arquivo demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

  if (recordError || !newFile) {
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

    if (recordError) {
      throw recordError;
    }

    throw new Error(
      "Não foi possível registrar o arquivo enviado."
    );
  }

  return {
    storagePath,
    newFileId: newFile.id,
    previousFileId: previousFile?.id ?? null,
  };
}

async function rollbackFileReplacement({
  supabase,
  replacement,
}: {
  supabase: SupabaseClient;
  replacement: FileReplacementRecord;
}) {
  try {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([replacement.storagePath]);

    await supabase
      .from("submission_files")
      .delete()
      .eq("id", replacement.newFileId);

    if (replacement.previousFileId) {
      await supabase
        .from("submission_files")
        .update({
          is_current: true,
        })
        .eq("id", replacement.previousFileId);
    }
  } catch (error) {
    console.error("Erro ao desfazer substituição de arquivo:", {
      replacement,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });
  }
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
  } = await withTimeout(
    async () =>
      await supabase
        .from("submissions")
        .select(`
          id,
          title
        `)
        .eq("id", submissionId)
        .maybeSingle(),
    "A consulta dos dados do trabalho demorou mais que o esperado.",
    DATABASE_TIMEOUT_MS
  );

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
  } = await withTimeout(
    async () =>
      await supabase
        .from("submission_authors")
        .select(`
          id,
          full_name,
          email,
          email_normalized
        `)
        .eq("submission_id", submissionId)
        .eq("author_role", "responsible")
        .maybeSingle(),
    "A consulta do autor responsável demorou mais que o esperado.",
    DATABASE_TIMEOUT_MS
  );

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

  const responsibleEmail =
    responsibleAuthor.email_normalized ??
    responsibleAuthor.email?.toLowerCase() ??
    "";

  const normalizedEmails = new Set<string>();

  if (responsibleEmail) {
    normalizedEmails.add(responsibleEmail);
  }

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
        `Informe o nome completo do ${position}º autor.`,
        "autores-section"
      );
    }

    if (
      !email ||
      !email.includes("@")
    ) {
      redirectWithMessage(
        submissionId,
        "erro",
        `Informe um e-mail válido para o ${position}º autor.`,
        "autores-section"
      );
    }

    if (normalizedEmails.has(email)) {
      redirectWithMessage(
        submissionId,
        "erro",
        `O e-mail informado para o ${position}º autor já está sendo utilizado neste trabalho.`,
        "autores-section"
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
  } = await withTimeout(
    async () =>
      await supabase
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
        .neq("author_role", "responsible"),
    "A preparação da atualização dos autores demorou mais que o esperado.",
    DATABASE_TIMEOUT_MS
  );

  if (previousAuthorsError) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível preparar a atualização dos autores.",
      "autores-section"
    );
  }

  const { error: deleteError } =
    await withTimeout(
      async () =>
        await supabase
          .from("submission_authors")
          .delete()
          .eq("submission_id", submissionId)
          .neq("author_role", "responsible"),
      "A atualização dos autores demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

  if (deleteError) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível atualizar os autores.",
      "autores-section"
    );
  }

  const { error: insertError } =
    await withTimeout(
      async () =>
        await supabase
          .from("submission_authors")
          .insert(authorsToInsert),
      "O salvamento dos autores demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

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
        "Existem autores duplicados ou posições de autoria repetidas.",
        "autores-section"
      );
    }

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível salvar a composição da autoria.",
      "autores-section"
    );
  }

  const savedAt = formatDateTimeBR();

  await Promise.all(
    authorsToInsert.map((author) =>
      sendEmailSafely({
        email: {
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
        },
        context: {
          type: "authorship_composition_saved",
          authorEmail: author.email,
          submissionId,
        },
      })
    )
  );

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
      "Selecione o parecer consubstanciado de aprovação do CEP.",
      "aspectos-eticos-section"
    );
  }

  const validationError =
    await validatePdfFile(fileValue);

  if (validationError) {
    redirectWithMessage(
      submissionId,
      "erro",
      `Parecer do CEP: ${validationError}`,
      "aspectos-eticos-section"
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
      "Este trabalho foi declarado como dispensado de aprovação pelo CEP.",
      "aspectos-eticos-section"
    );
  }

  try {
    await replaceCurrentFile({
      supabase,
      profileId: profile.id,
      submissionId,
      fileType: "ethics_approval",
      file: fileValue,
      extension: "pdf",
      contentType: PDF_MIME_TYPE,
    });
  } catch (error) {
    console.error("Erro ao enviar parecer do CEP:", {
      submissionId,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível enviar o parecer do CEP.",
      "aspectos-eticos-section"
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
      "Selecione a declaração do orientador.",
      "declaracao-orientador-section"
    );
  }

  const validationError =
    await validatePdfFile(fileValue);

  if (validationError) {
    redirectWithMessage(
      submissionId,
      "erro",
      `Declaração do orientador: ${validationError}`,
      "declaracao-orientador-section"
    );
  }

  const { profile, supabase, submission } =
    await validateEditableSubmission(
      submissionId
    );

  try {
    await replaceCurrentFile({
      supabase,
      profileId: profile.id,
      submissionId,
      fileType: "advisor_declaration",
      file: fileValue,
      extension: "pdf",
      contentType: PDF_MIME_TYPE,
    });
  } catch (error) {
    console.error("Erro ao enviar declaração do orientador:", {
      submissionId,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível enviar a declaração do orientador.",
      "declaracao-orientador-section"
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
      "Selecione as duas versões do trabalho.",
      "arquivos-trabalho-section"
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
      `Versão identificada: ${identifiedError}`,
      "arquivos-trabalho-section"
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
      `Versão anonimizada: ${anonymousError}`,
      "arquivos-trabalho-section"
    );
  }

  const { profile, supabase, submission } =
    await validateEditableSubmission(
      submissionId
    );

  const completedReplacements: FileReplacementRecord[] = [];

  try {
    const identifiedReplacement =
      await replaceCurrentFile({
        supabase,
        profileId: profile.id,
        submissionId,
        fileType: "identified",
        file: identifiedFileValue,
        extension: "docx",
        contentType: DOCX_MIME_TYPE,
      });

    completedReplacements.push(identifiedReplacement);

    const anonymousReplacement =
      await replaceCurrentFile({
        supabase,
        profileId: profile.id,
        submissionId,
        fileType: "anonymous",
        file: anonymousFileValue,
        extension: "docx",
        contentType: DOCX_MIME_TYPE,
      });

    completedReplacements.push(anonymousReplacement);
  } catch (error) {
    console.error("Erro ao enviar arquivos:", {
      submissionId,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    await Promise.all(
      completedReplacements
        .reverse()
        .map((replacement) =>
          rollbackFileReplacement({
            supabase,
            replacement,
          })
        )
    );

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
    await withTimeout(
      async () =>
        await supabase
          .from("events")
          .select(`
            year,
            submission_starts_at,
            submission_ends_at
          `)
          .eq("id", submission.event_id)
          .single(),
      "A consulta do evento demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

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
    await withTimeout(
      async () =>
        await supabase
          .from("submission_authors")
          .select(`
            id,
            full_name,
            email,
            author_role,
            display_order
          `)
          .eq("submission_id", submissionId),
      "A verificação dos autores demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

  if (authorsError) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível verificar os autores.",
      "autores-section"
    );
  }

  if (
    !authors ||
    authors.length !== totalAuthors
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      `Preencha e salve todos os ${totalAuthors} autores antes de submeter o trabalho.`,
      "autores-section"
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
      "O autor responsável não foi identificado corretamente.",
      "autores-section"
    );
  }

  if (!advisor) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O orientador deve ocupar a última posição da autoria.",
      "autores-section"
    );
  }

  const { data: files, error: filesError } =
    await withTimeout(
      async () =>
        await supabase
          .from("submission_files")
          .select(`
            id,
            file_type
          `)
          .eq("submission_id", submissionId)
          .eq("is_current", true),
      "A verificação dos documentos demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

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
      "Envie a versão identificada do trabalho.",
      "arquivos-trabalho-section"
    );
  }

  if (!fileTypes.has("anonymous")) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Envie a versão anonimizada do trabalho.",
      "arquivos-trabalho-section"
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
      "Envie a declaração do orientador.",
      "declaracao-orientador-section"
    );
  }

  if (
    submission.requires_ethics_approval &&
    !fileTypes.has("ethics_approval")
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Envie o parecer consubstanciado de aprovação do CEP.",
      "aspectos-eticos-section"
    );
  }

  const {
    data: declarations,
    error: declarationsError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("submission_declarations")
        .select(`
          id,
          accepted_general_terms,
          accepted_ethics_terms
        `)
        .eq("submission_id", submissionId)
        .maybeSingle(),
    "A verificação das declarações obrigatórias demorou mais que o esperado.",
    DATABASE_TIMEOUT_MS
  );

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
    await withTimeout(
      async () =>
        await supabase
          .from("submission_declarations")
          .update({
            accepted_originality_terms: true,
            originality_terms_accepted_at:
              acceptedAt,
            accepted_by: profile.id,
          })
          .eq("submission_id", submissionId),
      "O registro da declaração de ineditismo demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

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

  const {
    data: submittedRow,
    error: submitError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("submissions")
        .update(updatePayload)
        .eq("id", submissionId)
        .eq("owner_user_id", profile.id)
        .in("status", [
          "draft",
          "correction_requested",
        ])
        .select("id, status, title, protocol")
        .maybeSingle(),
    "A finalização da submissão demorou mais que o esperado.",
    DATABASE_TIMEOUT_MS
  );

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

  if (!submittedRow) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O trabalho não pôde ser finalizado porque já foi alterado. Atualize a página e tente novamente."
    );
  }

  const responsibleAuthorEmail =
    responsibleAuthor.email ?? profile.email;

  const responsibleAuthorName =
    responsibleAuthor.full_name ?? profile.full_name;

  const submittedAt = formatDateTimeBR();

  if (isCorrectionResubmission) {
    await sendEmailSafely({
      email: {
        to: responsibleAuthorEmail,
        subject: `Reenvio de trabalho recebido - ${
          submittedRow.protocol ?? submittedRow.title
        }`,
        html: submissionResubmittedEmail({
          studentName: responsibleAuthorName ?? "Aluno(a)",
          title: submittedRow.title,
          protocol: submittedRow.protocol,
          resubmittedAt: submittedAt,
        }),
      },
      context: {
        type: "submission_resubmitted",
        submissionId,
        authorEmail: responsibleAuthorEmail,
      },
    });
  } else {
    const authorsSortedByOrder = [
      ...(authors as AuthorForEmail[]),
    ].sort(
      (firstAuthor, secondAuthor) =>
        firstAuthor.display_order -
        secondAuthor.display_order
    );

    await Promise.all(
      authorsSortedByOrder.map((author) => {
        if (!author.email) {
          return Promise.resolve();
        }

        return sendEmailSafely({
          email: {
            to: author.email,
            subject: `Comprovante de submissão - ${
              submittedRow.protocol ??
              protocol ??
              "Protocolo não informado"
            }`,
            html: submissionConfirmationEmail({
              studentName:
                author.full_name ?? "Autor(a)",
              title: submittedRow.title,
              protocol:
                submittedRow.protocol ??
                protocol ??
                "Protocolo não informado",
              submittedAt,
            }),
          },
          context: {
            type: "submission_confirmation",
            submissionId,
            authorEmail: author.email,
          },
        });
      })
    );
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
          submittedRow.protocol ??
          protocol
        }`
  );
}