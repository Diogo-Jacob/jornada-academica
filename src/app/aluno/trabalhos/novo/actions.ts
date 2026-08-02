"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const MAX_PDF_SIZE = 5 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";
const STORAGE_BUCKET = "submission-files";

const MIN_TOTAL_AUTHORS = 2;
const MAX_TOTAL_AUTHORS = 7;

const DATABASE_TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 45_000;

function redirectWithError(message: string): never {
  redirect(
    `/aluno/trabalhos/novo?erro=${encodeURIComponent(message)}`
  );
}

async function withTimeout<T>(
  action: () => Promise<T>,
  timeoutMessage: string,
  timeoutMs = DATABASE_TIMEOUT_MS
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

async function validatePdfFile(
  file: File
): Promise<string | null> {
  if (file.size === 0) {
    return "Selecione o parecer consubstanciado de aprovação do CEP.";
  }

  if (file.size > MAX_PDF_SIZE) {
    return "O parecer do CEP deve possuir no máximo 5 MB.";
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "O parecer do CEP deve estar no formato PDF.";
  }

  if (file.type && file.type !== PDF_MIME_TYPE) {
    return "O arquivo selecionado não possui um formato PDF válido.";
  }

  const firstBytes = new Uint8Array(
    await file.slice(0, 5).arrayBuffer()
  );

  const signature = String.fromCharCode(...firstBytes);

  if (signature !== "%PDF-") {
    return "O conteúdo do arquivo não corresponde a um PDF válido.";
  }

  return null;
}

function validateSubmissionPeriod(event: {
  submission_starts_at: string | null;
  submission_ends_at: string | null;
}) {
  const now = new Date();

  if (
    event.submission_starts_at &&
    now < new Date(event.submission_starts_at)
  ) {
    redirectWithError(
      "O período de submissões ainda não começou."
    );
  }

  if (
    event.submission_ends_at &&
    now > new Date(event.submission_ends_at)
  ) {
    redirectWithError(
      "O período de submissões foi encerrado."
    );
  }
}

function normalizeText(value: string | null | undefined) {
  return (
    value
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") ?? ""
  );
}

export async function createSubmission(formData: FormData) {
  const title = String(
    formData.get("title") ?? ""
  ).trim();

  const categoryId = String(
    formData.get("categoryId") ?? ""
  ).trim();

  const ethicsAnswer = String(
    formData.get("requiresEthicsApproval") ?? ""
  ).trim();

  const forcedRequiresEthicsApproval = String(
    formData.get("forcedRequiresEthicsApproval") ?? ""
  ).trim();

  const totalAuthors = Number(
    formData.get("totalAuthors")
  );

  const acceptedGeneralTerms =
    formData.get("acceptedGeneralTerms") === "on";

  const acceptedEthicsTerms =
    formData.get("acceptedEthicsTerms") === "on";

  const ethicsApprovalFileValue =
    formData.get("ethicsApprovalFile");

  if (title.length < 3) {
    redirectWithError(
      "O título deve possuir pelo menos 3 caracteres."
    );
  }

  if (title.length > 300) {
    redirectWithError(
      "O título deve possuir no máximo 300 caracteres."
    );
  }

  if (!categoryId) {
    redirectWithError("Selecione uma categoria.");
  }

  if (
    ethicsAnswer !== "yes" &&
    ethicsAnswer !== "no" &&
    forcedRequiresEthicsApproval !== "yes"
  ) {
    redirectWithError(
      "Informe se o trabalho necessita de aprovação do Comitê de Ética em Pesquisa."
    );
  }

  if (
    !Number.isInteger(totalAuthors) ||
    totalAuthors < MIN_TOTAL_AUTHORS ||
    totalAuthors > MAX_TOTAL_AUTHORS
  ) {
    redirectWithError(
      "O trabalho deve possuir entre 2 e 7 autores, incluindo o autor responsável e o orientador."
    );
  }

  if (!acceptedGeneralTerms) {
    redirectWithError(
      "É necessário aceitar a declaração geral de ciência e concordância com o edital."
    );
  }

  if (!acceptedEthicsTerms) {
    redirectWithError(
      "É necessário aceitar a declaração referente aos aspectos éticos da pesquisa."
    );
  }

  const { profile, supabase } = await getCurrentUser();

  if (profile.role !== "student") {
    redirectWithError(
      "Seu perfil não possui permissão para criar submissões."
    );
  }

  const {
    data: event,
    error: eventError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("events")
        .select(`
          id,
          status,
          submission_starts_at,
          submission_ends_at
        `)
        .in("status", [
          "published",
          "submissions_open",
        ])
        .eq("is_public", true)
        .order("year", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle(),
    "A consulta da edição disponível demorou mais que o esperado."
  );

  if (eventError || !event) {
    console.error("Erro ao buscar evento para criação de submissão:", {
      message: eventError?.message,
      details: eventError?.details,
      hint: eventError?.hint,
      code: eventError?.code,
    });

    redirectWithError(
      "Nenhuma edição disponível para submissão foi encontrada."
    );
  }

  validateSubmissionPeriod(event);

  const {
    data: category,
    error: categoryError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("submission_categories")
        .select("id, name")
        .eq("id", categoryId)
        .eq("event_id", event.id)
        .eq("is_active", true)
        .maybeSingle(),
    "A validação da categoria demorou mais que o esperado."
  );

  if (categoryError || !category) {
    console.error("Erro ao validar categoria de submissão:", {
      categoryId,
      eventId: event.id,
      message: categoryError?.message,
      details: categoryError?.details,
      hint: categoryError?.hint,
      code: categoryError?.code,
    });

    redirectWithError(
      "A categoria selecionada não é válida."
    );
  }

  const normalizedCategoryName = normalizeText(category.name);

  const isCaseReport =
    normalizedCategoryName.includes("relato de caso");

  const requiresEthicsApproval =
    isCaseReport ||
    ethicsAnswer === "yes" ||
    forcedRequiresEthicsApproval === "yes";

  let ethicsApprovalFile: File | null = null;

  if (requiresEthicsApproval) {
    if (
      !(ethicsApprovalFileValue instanceof File) ||
      ethicsApprovalFileValue.size === 0
    ) {
      redirectWithError(
        isCaseReport
          ? "Para trabalhos da categoria Relato de caso, é obrigatório anexar o parecer consubstanciado de aprovação do Comitê de Ética em Pesquisa."
          : "Anexe o parecer consubstanciado de aprovação do Comitê de Ética em Pesquisa."
      );
    }

    const fileError = await validatePdfFile(
      ethicsApprovalFileValue
    );

    if (fileError) {
      redirectWithError(fileError);
    }

    ethicsApprovalFile = ethicsApprovalFileValue;
  }

  const acceptedAt = new Date().toISOString();

  const {
    data: submission,
    error: submissionError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("submissions")
        .insert({
          event_id: event.id,
          owner_user_id: profile.id,
          category_id: category.id,
          title,
          status: "draft",
          requires_ethics_approval:
            requiresEthicsApproval,
          ethics_answered_at: acceptedAt,
          total_authors: totalAuthors,
        })
        .select("id")
        .maybeSingle(),
    "A criação do rascunho demorou mais que o esperado."
  );

  if (submissionError || !submission) {
    console.error("Erro ao criar submissão:", {
      userId: profile.id,
      eventId: event.id,
      categoryId: category.id,
      message: submissionError?.message,
      details: submissionError?.details,
      hint: submissionError?.hint,
      code: submissionError?.code,
    });

    redirectWithError(
      "Não foi possível criar o rascunho. Tente novamente."
    );
  }

  const submissionId = submission.id;
  let uploadedEthicsPath: string | null = null;

  try {
    const { error: declarationsError } =
      await withTimeout(
        async () =>
          await supabase
            .from("submission_declarations")
            .insert({
              submission_id: submissionId,
              accepted_general_terms: true,
              accepted_ethics_terms: true,
              general_terms_accepted_at: acceptedAt,
              ethics_terms_accepted_at: acceptedAt,
              accepted_by: profile.id,
            }),
        "O registro das declarações demorou mais que o esperado."
      );

    if (declarationsError) {
      throw new Error(
        `Falha ao registrar declarações: ${declarationsError.message}`
      );
    }

    if (
      requiresEthicsApproval &&
      ethicsApprovalFile
    ) {
      const fileId = crypto.randomUUID();

      const ethicsStoragePath =
        `${submissionId}/ethics_approval/${fileId}.pdf`;

      uploadedEthicsPath = ethicsStoragePath;

      const { error: uploadError } =
        await withTimeout(
          async () =>
            await supabase.storage
              .from(STORAGE_BUCKET)
              .upload(
                ethicsStoragePath,
                ethicsApprovalFile,
                {
                  contentType: PDF_MIME_TYPE,
                  upsert: false,
                }
              ),
          "O envio do parecer do CEP demorou mais que o esperado. Verifique sua conexão e tente novamente.",
          UPLOAD_TIMEOUT_MS
        );

      if (uploadError) {
        throw new Error(
          `Falha ao enviar o parecer do CEP: ${uploadError.message}`
        );
      }

      const { data: savedFile, error: fileRecordError } =
        await withTimeout(
          async () =>
            await supabase
              .from("submission_files")
              .insert({
                submission_id: submissionId,
                file_type: "ethics_approval",
                storage_path: ethicsStoragePath,
                original_filename:
                  ethicsApprovalFile.name,
                mime_type: PDF_MIME_TYPE,
                size_bytes: ethicsApprovalFile.size,
                version_number: 1,
                is_current: true,
                uploaded_by: profile.id,
              })
              .select("id")
              .maybeSingle(),
          "O registro do parecer do CEP demorou mais que o esperado."
        );

      if (fileRecordError || !savedFile) {
        throw new Error(
          fileRecordError
            ? `Falha ao registrar o parecer do CEP: ${fileRecordError.message}`
            : "O parecer foi enviado, mas não pôde ser confirmado no banco de dados."
        );
      }
    }
  } catch (error) {
    console.error(
      "Erro ao concluir o rascunho:",
      {
        submissionId,
        userId: profile.id,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
        error,
      }
    );

    if (uploadedEthicsPath) {
      const { error: cleanupStorageError } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([uploadedEthicsPath]);

      if (cleanupStorageError) {
        console.error(
          "Erro ao limpar arquivo incompleto:",
          {
            submissionId,
            uploadedEthicsPath,
            message: cleanupStorageError.message,
            status: cleanupStorageError.status,
            statusCode: cleanupStorageError.statusCode,
          }
        );
      }
    }

    const { error: cleanupDatabaseError } =
      await supabase
        .from("submissions")
        .delete()
        .eq("id", submissionId)
        .eq("owner_user_id", profile.id)
        .eq("status", "draft");

    if (cleanupDatabaseError) {
      console.error(
        "Erro ao excluir rascunho incompleto:",
        {
          submissionId,
          userId: profile.id,
          message: cleanupDatabaseError.message,
          details: cleanupDatabaseError.details,
          hint: cleanupDatabaseError.hint,
          code: cleanupDatabaseError.code,
        }
      );
    }

    redirectWithError(
      error instanceof Error
        ? error.message
        : "Não foi possível concluir a criação do rascunho."
    );
  }

  revalidatePath("/aluno");
  revalidatePath("/aluno/trabalhos");
  revalidatePath(
    `/aluno/trabalhos/${submissionId}`
  );

  redirect(`/aluno/trabalhos/${submissionId}`);
}