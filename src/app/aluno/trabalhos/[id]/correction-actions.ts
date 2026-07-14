"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/services/email/send-email";
import { submissionResubmittedEmail } from "@/services/email/templates/submission-resubmitted";
import { getCurrentUser } from "@/lib/auth/get-current-user";

function redirectWithMessage(
  submissionId: string,
  type: "erro" | "sucesso",
  message: string
): never {
  redirect(
    `/aluno/trabalhos/${submissionId}?${type}=${encodeURIComponent(
      message
    )}`
  );
}

function validateCorrectionPeriod(
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
      "O período de submissões ainda não iniciou. Não é possível reenviar correções neste momento."
    );
  }

  if (
    event.submission_ends_at &&
    now > new Date(event.submission_ends_at)
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O período de submissões foi encerrado. Não é mais possível reenviar o trabalho corrigido."
    );
  }
}

export async function resubmitCorrectedSubmission(
  formData: FormData
) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  const confirmation =
    formData.get("confirmResubmission") === "on";

  if (!submissionId) {
    redirect("/aluno/trabalhos");
  }

  if (!confirmation) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Confirme que as correções solicitadas foram realizadas."
    );
  }

  const { profile, supabase } =
    await getCurrentUser();

  const {
    data: submission,
    error: submissionError,
  } = await supabase
    .from("submissions")
    .select(`
      id,
      title,
      protocol,
      status,
      total_authors,
      requires_ethics_approval,
      owner_user_id,
      event_id,
      document_reviewed_at,
      correction_updated_at
    `)
    .eq("id", submissionId)
    .eq("owner_user_id", profile.id)
    .maybeSingle();

  if (submissionError) {
    console.error(
      "Erro ao consultar submissão para reenvio:",
      submissionError
    );

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível verificar o trabalho."
    );
  }

  if (!submission) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O trabalho não foi encontrado."
    );
  }

  if (
    submission.status !==
    "correction_requested"
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Este trabalho não está aguardando correções."
    );
  }
  
  if (!submission.document_reviewed_at) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível identificar a data da solicitação de correção."
    );
  }

  if (!submission.correction_updated_at) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Realize ao menos uma alteração no trabalho antes de reenviar a correção."
    );
  }

  if (
    new Date(submission.correction_updated_at) <=
    new Date(submission.document_reviewed_at)
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Realize ao menos uma alteração após a solicitação de correção antes de reenviar o trabalho."
    );
  }
  const { data: event, error: eventError } =
    await supabase
      .from("events")
      .select(`
        submission_starts_at,
        submission_ends_at
      `)
      .eq("id", submission.event_id)
      .maybeSingle();

  if (eventError || !event) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível verificar o período de submissões."
    );
  }

  validateCorrectionPeriod(
    submissionId,
    event
  );

  const {
    data: authors,
    error: authorsError,
  } = await supabase
    .from("submission_authors")
    .select(`
      id,
      author_role,
      display_order,
      full_name,
      email
    `)
    .eq("submission_id", submissionId);

  if (authorsError) {
    console.error(
      "Erro ao verificar autores:",
      authorsError
    );

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível verificar os autores."
    );
  }

  const totalAuthors =
    submission.total_authors ?? 0;

  if (
    !authors ||
    authors.length !== totalAuthors
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      `Preencha e salve todos os ${totalAuthors} autores antes do reenvio.`
    );
  }

  const responsibleAuthor =
    authors.find(
      (author) =>
        author.author_role ===
          "responsible" &&
        author.display_order === 1
    );

  const advisor =
    authors.find(
      (author) =>
        author.author_role ===
          "advisor" &&
        author.display_order ===
          totalAuthors
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
      "O orientador precisa ocupar a última posição da autoria."
    );
  }

  const {
    data: files,
    error: filesError,
  } = await supabase
    .from("submission_files")
    .select(`
      id,
      file_type
    `)
    .eq("submission_id", submissionId)
    .eq("is_current", true);

  if (filesError) {
    console.error(
      "Erro ao verificar arquivos:",
      filesError
    );

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível verificar os documentos enviados."
    );
  }

  const fileTypes = new Set(
    files?.map((file) => file.file_type) ??
      []
  );

  if (!fileTypes.has("identified")) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Envie a versão identificada corrigida."
    );
  }

  if (!fileTypes.has("anonymous")) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Envie a versão anonimizada corrigida."
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
      "A declaração do orientador não foi localizada."
    );
  }

  if (
    submission.requires_ethics_approval &&
    !fileTypes.has("ethics_approval")
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O parecer de aprovação do CEP não foi localizado."
    );
  }

  const {
    data: declarations,
    error: declarationsError,
  } = await supabase
    .from("submission_declarations")
    .select(`
      accepted_general_terms,
      accepted_ethics_terms,
      accepted_originality_terms
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
    !declarations.accepted_ethics_terms ||
    !declarations.accepted_originality_terms
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Existem declarações obrigatórias pendentes."
    );
  }

  const { error: updateError } =
    await supabase
      .from("submissions")
      .update({
        status: "resubmitted",
      })
      .eq("id", submissionId)
      .eq("owner_user_id", profile.id)
      .eq(
        "status",
        "correction_requested"
      );

  if (updateError) {
    console.error(
      "Erro completo ao reenviar trabalho:",
      {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      }
    );

    const message =
      updateError.message.toLowerCase();

    if (
      message.includes(
        "row-level security"
      ) ||
      message.includes("policy")
    ) {
      redirectWithMessage(
        submissionId,
        "erro",
        "A política de segurança não permitiu reenviar o trabalho."
      );
    }

    redirectWithMessage(
      submissionId,
      "erro",
      `Não foi possível reenviar o trabalho: ${updateError.message}`
    );
  }

  const resubmittedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const responsibleAuthorEmail =
    responsibleAuthor.email ?? profile.email;

  const responsibleAuthorName =
    responsibleAuthor.full_name ?? profile.full_name;

  if (
    responsibleAuthorEmail &&
    submission.title
  ) {
    const emailResult = await sendEmail({
      to: responsibleAuthorEmail,
      subject: `Reenvio de trabalho recebido - ${
        submission.protocol ?? submission.title
      }`,
      html: submissionResubmittedEmail({
        studentName:
          responsibleAuthorName ?? "Aluno(a)",
        title: submission.title,
        protocol: submission.protocol,
        resubmittedAt,
      }),
    });

    if (!emailResult.success) {
      console.error(
        "Comprovante de reenvio não enviado:",
        emailResult
      );
    }
  }

  revalidatePath("/aluno");
  revalidatePath("/aluno/trabalhos");
  revalidatePath(
    `/aluno/trabalhos/${submissionId}`
  );

  revalidatePath("/admin/submissoes");
  revalidatePath(
    `/admin/submissoes/${submissionId}`
  );

  redirectWithMessage(
    submissionId,
    "sucesso",
    "Trabalho corrigido reenviado com sucesso. Ele aguardará uma nova conferência documental."
  );
}