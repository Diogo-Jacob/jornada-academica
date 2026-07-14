"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MAX_PDF_SIZE = 5 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";
const STORAGE_BUCKET = "submission-files";

function redirectWithError(message: string): never {
  redirect(
    `/aluno/trabalhos/novo?erro=${encodeURIComponent(message)}`
  );
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
    ethicsAnswer !== "no"
  ) {
    redirectWithError(
      "Informe se o trabalho necessita de aprovação do Comitê de Ética em Pesquisa."
    );
  }

  if (
    !Number.isInteger(totalAuthors) ||
    totalAuthors < 2 ||
    totalAuthors > 10
  ) {
    redirectWithError(
      "O trabalho deve possuir entre 2 e 10 autores, incluindo o autor responsável e o orientador."
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

  const requiresEthicsApproval =
    ethicsAnswer === "yes";

  let ethicsApprovalFile: File | null = null;

  if (requiresEthicsApproval) {
    if (
      !(ethicsApprovalFileValue instanceof File) ||
      ethicsApprovalFileValue.size === 0
    ) {
      redirectWithError(
        "Anexe o parecer consubstanciado de aprovação do Comitê de Ética em Pesquisa."
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

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userId)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "student" ||
    !profile.is_active
  ) {
    redirectWithError(
      "Seu perfil não possui permissão para criar submissões."
    );
  }

  const {
    data: event,
    error: eventError,
  } = await supabase
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
    .maybeSingle();

  if (eventError || !event) {
    redirectWithError(
      "Nenhuma edição disponível para submissão foi encontrada."
    );
  }

  validateSubmissionPeriod(event);

  const {
    data: category,
    error: categoryError,
  } = await supabase
    .from("submission_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("event_id", event.id)
    .eq("is_active", true)
    .maybeSingle();

  if (categoryError || !category) {
    redirectWithError(
      "A categoria selecionada não é válida."
    );
  }

  const acceptedAt = new Date().toISOString();

  const {
    data: submission,
    error: submissionError,
  } = await supabase
    .from("submissions")
    .insert({
      event_id: event.id,
      owner_user_id: userId,
      category_id: category.id,
      title,
      status: "draft",
      requires_ethics_approval:
        requiresEthicsApproval,
      ethics_answered_at: acceptedAt,
      total_authors: totalAuthors,
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    console.error("Erro ao criar submissão:", {
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
      await supabase
        .from("submission_declarations")
        .insert({
          submission_id: submissionId,
          accepted_general_terms: true,
          accepted_ethics_terms: true,
          general_terms_accepted_at: acceptedAt,
          ethics_terms_accepted_at: acceptedAt,
          accepted_by: userId,
        });

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

      uploadedEthicsPath =
        `${submissionId}/ethics_approval/${fileId}.pdf`;

      const { error: uploadError } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(
            uploadedEthicsPath,
            ethicsApprovalFile,
            {
              contentType: PDF_MIME_TYPE,
              upsert: false,
            }
          );

      if (uploadError) {
        throw new Error(
          `Falha ao enviar o parecer do CEP: ${uploadError.message}`
        );
      }

      const { error: fileRecordError } =
        await supabase
          .from("submission_files")
          .insert({
            submission_id: submissionId,
            file_type: "ethics_approval",
            storage_path: uploadedEthicsPath,
            original_filename:
              ethicsApprovalFile.name,
            mime_type: PDF_MIME_TYPE,
            size_bytes: ethicsApprovalFile.size,
            version_number: 1,
            is_current: true,
            uploaded_by: userId,
          });

      if (fileRecordError) {
        throw new Error(
          `Falha ao registrar o parecer do CEP: ${fileRecordError.message}`
        );
      }

      const {
        data: savedFile,
        error: confirmationError,
      } = await supabase
        .from("submission_files")
        .select("id")
        .eq("submission_id", submissionId)
        .eq("file_type", "ethics_approval")
        .eq("is_current", true)
        .maybeSingle();

      if (confirmationError || !savedFile) {
        throw new Error(
          "O parecer foi enviado, mas não pôde ser confirmado no banco de dados."
        );
      }
    }
  } catch (error) {
    console.error(
      "Erro ao concluir o rascunho:",
      error
    );

    if (uploadedEthicsPath) {
      const { error: cleanupStorageError } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([uploadedEthicsPath]);

      if (cleanupStorageError) {
        console.error(
          "Erro ao limpar arquivo incompleto:",
          cleanupStorageError
        );
      }
    }

    const { error: cleanupDatabaseError } =
      await supabase
        .from("submissions")
        .delete()
        .eq("id", submissionId)
        .eq("owner_user_id", userId)
        .eq("status", "draft");

    if (cleanupDatabaseError) {
      console.error(
        "Erro ao excluir rascunho incompleto:",
        cleanupDatabaseError
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