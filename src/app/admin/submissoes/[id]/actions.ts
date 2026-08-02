"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/services/email/send-email";
import { correctionRequestedEmail } from "@/services/email/templates/correction-requested";
import { submissionApprovedEmail } from "@/services/email/templates/submission-approved";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const ACTION_TIMEOUT_MS = 30_000;

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

function redirectWithMessage(
  submissionId: string,
  type: "erro" | "sucesso",
  message: string
): never {
  redirect(
    `/admin/submissoes/${submissionId}?${type}=${encodeURIComponent(
      message
    )}`
  );
}

async function getAdminSubmission(
  submissionId: string
) {
  const { profile, supabase } =
    await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(
      profile.role
    )
  ) {
    redirect("/acesso-negado");
  }

  const {
    data: submission,
    error,
  } = await supabase
    .from("submissions")
    .select(`
      id,
      title,
      protocol,
      status,
      owner_user_id
    `)
    .eq("id", submissionId)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao consultar submissão:",
      error
    );

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível consultar a submissão."
    );
  }

  if (!submission) {
    redirectWithMessage(
      submissionId,
      "erro",
      "A submissão não foi encontrada."
    );
  }

  return {
    profile,
    supabase,
    submission,
  };
}

async function getResponsibleAuthorForEmail({
  supabase,
  submissionId,
}: {
  supabase: Awaited<ReturnType<typeof getCurrentUser>>["supabase"];
  submissionId: string;
}) {
  const { data, error } = await supabase
    .from("submission_authors")
    .select(`
      full_name,
      email,
      author_role,
      display_order
    `)
    .eq("submission_id", submissionId)
    .eq("author_role", "responsible")
    .eq("display_order", 1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar autor responsável para e-mail:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  return data;
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

export async function startDocumentReview(
  formData: FormData
) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  if (!submissionId) {
    redirect("/admin/submissoes");
  }

  const {
    profile,
    supabase,
    submission,
  } = await getAdminSubmission(submissionId);

  if (
    ![
      "submitted",
      "resubmitted",
    ].includes(submission.status)
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Esta submissão não pode iniciar uma nova conferência documental."
    );
  }

  const reviewedAt =
    new Date().toISOString();

  let result;

  try {
    result = await withTimeout(
      async () =>
        await supabase
          .from("submissions")
          .update({
            status: "under_document_review",
            document_reviewed_by: profile.id,
            document_reviewed_at: reviewedAt,
            document_review_notes: null,
          })
          .eq("id", submissionId)
          .in("status", [
            "submitted",
            "resubmitted",
          ])
          .select("id, status")
          .maybeSingle(),
      "A tentativa de iniciar a conferência documental demorou mais que o esperado.",
      15_000
    );
  } catch (error) {
    console.error("Timeout ao iniciar conferência documental:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    redirectWithMessage(
      submissionId,
      "erro",
      "A tentativa de iniciar a conferência documental demorou mais que o esperado. Atualize a página e tente novamente."
    );
  }

  const error = result.error;

  if (error) {
    console.error(
      "Erro ao iniciar conferência:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível iniciar a conferência documental."
    );
  }

  if (!result.data) {
    redirectWithMessage(
      submissionId,
      "erro",
      "A conferência não pôde ser iniciada porque a submissão já foi alterada. Atualize a página e tente novamente."
    );
  }

  revalidatePath("/admin/submissoes");
  revalidatePath(
    `/admin/submissoes/${submissionId}`
  );
  revalidatePath("/aluno");
  revalidatePath("/aluno/trabalhos");
  revalidatePath(
    `/aluno/trabalhos/${submissionId}`
  );

  redirectWithMessage(
    submissionId,
    "sucesso",
    "Conferência documental iniciada."
  );
}

export async function requestCorrections(
  formData: FormData
) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  const notes = String(
    formData.get("notes") ?? ""
  ).trim();

  if (!submissionId) {
    redirect("/admin/submissoes");
  }

  if (notes.length < 10) {
    redirectWithMessage(
      submissionId,
      "erro",
      "Descreva as correções necessárias com pelo menos 10 caracteres."
    );
  }

  if (notes.length > 3000) {
    redirectWithMessage(
      submissionId,
      "erro",
      "A orientação de correção deve possuir no máximo 3.000 caracteres."
    );
  }

  const {
    profile,
    supabase,
    submission,
  } = await getAdminSubmission(submissionId);

  if (
    submission.status !==
    "under_document_review"
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "A submissão precisa estar em conferência documental para receber uma solicitação de correção."
    );
  }

  const reviewedAt =
    new Date().toISOString();

  let result;

  try {
    result = await withTimeout(
      async () =>
        await supabase
          .from("submissions")
          .update({
            status: "correction_requested",
            document_review_notes: notes,
            document_reviewed_by: profile.id,
            document_reviewed_at: reviewedAt,
          })
          .eq("id", submissionId)
          .eq(
            "status",
            "under_document_review"
          )
          .select("id, status")
          .maybeSingle(),
      "A tentativa de solicitar correções demorou mais que o esperado.",
      15_000
    );
  } catch (error) {
    console.error("Timeout ao solicitar correções:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    redirectWithMessage(
      submissionId,
      "erro",
      "A tentativa de solicitar correções demorou mais que o esperado. Atualize a página e tente novamente."
    );
  }

  const error = result.error;

  if (error) {
    console.error(
      "Erro ao solicitar correções:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível solicitar as correções."
    );
  }

  if (!result.data) {
    redirectWithMessage(
      submissionId,
      "erro",
      "As correções não puderam ser solicitadas porque a submissão já foi alterada. Atualize a página e tente novamente."
    );
  }

  const responsibleAuthor =
    await getResponsibleAuthorForEmail({
      supabase,
      submissionId,
    });

  if (
    responsibleAuthor?.email &&
    submission.title
  ) {
    try {
      const emailResult = await withTimeout(
        async () =>
          await sendEmail({
            to: responsibleAuthor.email,
            subject: `Correções solicitadas - ${submission.protocol ?? submission.title}`,
            html: correctionRequestedEmail({
              studentName:
                responsibleAuthor.full_name ?? "Aluno(a)",
              title: submission.title,
              protocol: submission.protocol,
              notes,
              reviewedAt: formatDateTime(reviewedAt),
            }),
          }),
        "O envio do e-mail de correção demorou mais que o esperado.",
        15_000
      );

      if (!emailResult.success) {
        console.error(
          "E-mail de correção documental não enviado:",
          emailResult
        );
      }
    } catch (emailError) {
      console.error(
        "Correção solicitada, mas o envio do e-mail falhou ou demorou demais:",
        {
          submissionId,
          message:
            emailError instanceof Error
              ? emailError.message
              : "Erro desconhecido",
          error: emailError,
        }
      );
    }
  }

  revalidatePath("/admin/submissoes");
  revalidatePath(
    `/admin/submissoes/${submissionId}`
  );
  revalidatePath("/aluno");
  revalidatePath("/aluno/trabalhos");
  revalidatePath(
    `/aluno/trabalhos/${submissionId}`
  );

  redirectWithMessage(
    submissionId,
    "sucesso",
    "Correções solicitadas ao aluno."
  );
}

export async function approveForEvaluation(
  formData: FormData
) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  const notes = String(
    formData.get("approvalNotes") ?? ""
  ).trim();

  if (!submissionId) {
    redirect("/admin/submissoes");
  }

  if (notes.length > 3000) {
    redirectWithMessage(
      submissionId,
      "erro",
      "A observação deve possuir no máximo 3.000 caracteres."
    );
  }

  const {
    profile,
    supabase,
    submission,
  } = await getAdminSubmission(submissionId);

  if (
    submission.status !==
    "under_document_review"
  ) {
    redirectWithMessage(
      submissionId,
      "erro",
      "A submissão precisa estar em conferência documental para ser aprovada."
    );
  }

  const reviewedAt =
    new Date().toISOString();

  let result;

  try {
    result = await withTimeout(
      async () =>
        await supabase
          .from("submissions")
          .update({
            status:
              "approved_for_evaluation",
            document_review_notes:
              notes || null,
            document_reviewed_by:
              profile.id,
            document_reviewed_at:
              reviewedAt,
          })
          .eq("id", submissionId)
          .eq(
            "status",
            "under_document_review"
          )
          .select("id, status")
          .maybeSingle(),
      "A tentativa de aprovar a submissão demorou mais que o esperado.",
      15_000
    );
  } catch (error) {
    console.error("Timeout ao aprovar submissão:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    redirectWithMessage(
      submissionId,
      "erro",
      "A tentativa de aprovar a submissão demorou mais que o esperado. Atualize a página e tente novamente."
    );
  }

  const error = result.error;

  if (error) {
    console.error(
      "Erro ao aprovar submissão:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    redirectWithMessage(
      submissionId,
      "erro",
      "Não foi possível aprovar a submissão para avaliação."
    );
  }

  if (!result.data) {
    redirectWithMessage(
      submissionId,
      "erro",
      "A submissão não pôde ser aprovada porque ela já foi alterada. Atualize a página e tente novamente."
    );
  }

  const responsibleAuthor =
    await getResponsibleAuthorForEmail({
      supabase,
      submissionId,
    });

  if (
    responsibleAuthor?.email &&
    submission.title
  ) {
    try {
      const emailResult = await withTimeout(
        async () =>
          await sendEmail({
            to: responsibleAuthor.email,
            subject: `Trabalho aprovado para avaliação científica - ${
              submission.protocol ?? submission.title
            }`,
            html: submissionApprovedEmail({
              studentName:
                responsibleAuthor.full_name ?? "Aluno(a)",
              title: submission.title,
              protocol: submission.protocol,
              approvedAt: formatDateTime(reviewedAt),
            }),
          }),
        "O envio do e-mail de aprovação demorou mais que o esperado.",
        15_000
      );

      if (!emailResult.success) {
        console.error(
          "E-mail de aprovação documental não enviado:",
          emailResult
        );
      }
    } catch (emailError) {
      console.error(
        "Submissão aprovada, mas o envio do e-mail falhou ou demorou demais:",
        {
          submissionId,
          message:
            emailError instanceof Error
              ? emailError.message
              : "Erro desconhecido",
          error: emailError,
        }
      );
    }
  }

  revalidatePath("/admin/submissoes");
  revalidatePath(
    `/admin/submissoes/${submissionId}`
  );
  revalidatePath("/aluno");
  revalidatePath("/aluno/trabalhos");
  revalidatePath(
    `/aluno/trabalhos/${submissionId}`
  );

  redirectWithMessage(
    submissionId,
    "sucesso",
    "Submissão aprovada para avaliação científica."
  );
}