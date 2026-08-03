"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/services/email/send-email";
import { submissionResubmittedEmail } from "@/services/email/templates/submission-resubmitted";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const DATABASE_TIMEOUT_MS = 20_000;
const EMAIL_TIMEOUT_MS = 15_000;

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

async function sendEmailSafely({
  to,
  subject,
  html,
  context,
}: {
  to: string;
  subject: string;
  html: string;
  context: Record<string, unknown>;
}) {
  try {
    const emailResult = await withTimeout(
      async () =>
        await sendEmail({
          to,
          subject,
          html,
        }),
      "O envio do e-mail de reenvio demorou mais que o esperado.",
      EMAIL_TIMEOUT_MS
    );

    if (!emailResult.success) {
      console.error("Comprovante de reenvio não enviado:", {
        ...context,
        emailResult,
      });
    }
  } catch (error) {
    console.error("Comprovante de reenvio falhou ou demorou demais:", {
      ...context,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });
  }
}

function validateCorrectionPeriod(
  submissionId: string,
  event: {
    submission_starts_at: string | null;
    submission_ends_at: string | null;
    correction_ends_at: string | null;
  }
) {
  const now = new Date();

  if (event.submission_starts_at) {
    const submissionStartDate = new Date(
      event.submission_starts_at
    );

    if (
      !Number.isNaN(submissionStartDate.getTime()) &&
      now < submissionStartDate
    ) {
      redirectWithMessage(
        submissionId,
        "erro",
        "O período de submissões ainda não iniciou. Não é possível reenviar correções neste momento.",
        "correcao-section"
      );
    }
  }

  const correctionDeadlineValue =
    event.correction_ends_at ??
    event.submission_ends_at;

  if (!correctionDeadlineValue) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O prazo para envio de correções documentais ainda não foi configurado.",
      "correcao-section"
    );
  }

  const correctionDeadline = new Date(
    correctionDeadlineValue
  );

  if (Number.isNaN(correctionDeadline.getTime())) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O prazo para envio de correções documentais está inválido.",
      "correcao-section"
    );
  }

  if (now > correctionDeadline) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O prazo para envio de correções documentais foi encerrado.",
      "correcao-section"
    );
  }
}

function formatDateTimeBR(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
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
      "Confirme que as correções solicitadas foram realizadas.",
      "correcao-section"
    );
  }

  const { profile, supabase } =
    await getCurrentUser();

  const {
    data: submission,
    error: submissionError,
  } = await withTimeout(
    async () =>
      await supabase
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
        .maybeSingle(),
    "A consulta do trabalho demorou mais que o esperado."
  );

  if (submissionError) {
    console.error(
      "Erro ao consultar submissão para reenvio:",
      {
        submissionId,
        message: submissionError.message,
        details: submissionError.details,
        hint: submissionError.hint,
        code: submissionError.code,
      }
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

  if (submission.status !== "correction_requested") {
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
      "Não foi possível identificar a data da solicitação de correção.",
      "correcao-section"
    );
  }

  if (!submission.correction_updated_at) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Realize ao menos uma alteração no trabalho antes de reenviar a correção.",
      "correcao-section"
    );
  }

  if (
    new Date(submission.correction_updated_at) <=
    new Date(submission.document_reviewed_at)
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Realize ao menos uma alteração após a solicitação de correção antes de reenviar o trabalho.",
      "correcao-section"
    );
  }

  const { data: event, error: eventError } =
    await withTimeout(
      async () =>
        await supabase
          .from("events")
          .select(`
            submission_starts_at,
            submission_ends_at,
            correction_ends_at
          `)
          .eq("id", submission.event_id)
          .maybeSingle(),
      "A verificação do prazo de correções demorou mais que o esperado."
    );

  if (eventError || !event) {
    console.error("Erro ao verificar prazo de correções:", {
      submissionId,
      message: eventError?.message,
      details: eventError?.details,
      hint: eventError?.hint,
      code: eventError?.code,
    });

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível verificar o prazo para reenvio das correções.",
      "correcao-section"
    );
  }

  validateCorrectionPeriod(
    submissionId,
    event
  );

  const {
    data: authors,
    error: authorsError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("submission_authors")
        .select(`
          id,
          author_role,
          display_order,
          full_name,
          email
        `)
        .eq("submission_id", submissionId),
    "A verificação dos autores demorou mais que o esperado."
  );

  if (authorsError) {
    console.error("Erro ao verificar autores:", {
      submissionId,
      message: authorsError.message,
      details: authorsError.details,
      hint: authorsError.hint,
      code: authorsError.code,
    });

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível verificar os autores.",
      "autores-section"
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
      `Preencha e salve todos os ${totalAuthors} autores antes do reenvio.`,
      "autores-section"
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
      "O autor responsável não foi identificado corretamente.",
      "autores-section"
    );
  }

  if (!advisor) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O orientador precisa ocupar a última posição da autoria.",
      "autores-section"
    );
  }

  const {
    data: files,
    error: filesError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("submission_files")
        .select(`
          id,
          file_type
        `)
        .eq("submission_id", submissionId)
        .eq("is_current", true),
    "A verificação dos documentos demorou mais que o esperado."
  );

  if (filesError) {
    console.error("Erro ao verificar arquivos:", {
      submissionId,
      message: filesError.message,
      details: filesError.details,
      hint: filesError.hint,
      code: filesError.code,
    });

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
      "Envie a versão identificada corrigida.",
      "arquivos-trabalho-section"
    );
  }

  if (!fileTypes.has("anonymous")) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Envie a versão anonimizada corrigida.",
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
      "A declaração do orientador não foi localizada.",
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
      "O parecer de aprovação do CEP não foi localizado.",
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
          accepted_general_terms,
          accepted_ethics_terms,
          accepted_originality_terms
        `)
        .eq("submission_id", submissionId)
        .maybeSingle(),
    "A verificação das declarações obrigatórias demorou mais que o esperado."
  );

  if (
    declarationsError ||
    !declarations
  ) {
    console.error("Erro ao verificar declarações:", {
      submissionId,
      message: declarationsError?.message,
      details: declarationsError?.details,
      hint: declarationsError?.hint,
      code: declarationsError?.code,
    });

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

  const {
    data: updatedSubmission,
    error: updateError,
  } = await withTimeout(
    async () =>
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
        )
        .select("id, title, protocol, status")
        .maybeSingle(),
    "O reenvio do trabalho corrigido demorou mais que o esperado."
  );

  if (updateError) {
    console.error(
      "Erro completo ao reenviar trabalho:",
      {
        submissionId,
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

  if (!updatedSubmission) {
    redirectWithMessage(
      submissionId,
      "erro",
      "O trabalho não pôde ser reenviado porque já foi alterado. Atualize a página e tente novamente."
    );
  }

  const resubmittedAt = formatDateTimeBR();

  const responsibleAuthorEmail =
    responsibleAuthor.email ?? profile.email;

  const responsibleAuthorName =
    responsibleAuthor.full_name ?? profile.full_name;

  if (
    responsibleAuthorEmail &&
    updatedSubmission.title
  ) {
    await sendEmailSafely({
      to: responsibleAuthorEmail,
      subject: `Reenvio de trabalho recebido - ${
        updatedSubmission.protocol ?? updatedSubmission.title
      }`,
      html: submissionResubmittedEmail({
        studentName:
          responsibleAuthorName ?? "Aluno(a)",
        title: updatedSubmission.title,
        protocol: updatedSubmission.protocol,
        resubmittedAt,
      }),
      context: {
        type: "submission_resubmitted_from_correction_panel",
        submissionId,
        authorEmail: responsibleAuthorEmail,
      },
    });
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