"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/services/email/send-email";
import { correctionRequestedEmail } from "@/services/email/templates/correction-requested";
import { submissionApprovedEmail } from "@/services/email/templates/submission-approved";
import { getCurrentUser } from "@/lib/auth/get-current-user";

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
    redirect("/login");
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

  const { error } = await supabase
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
    ]);

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

  const { error } = await supabase
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
    );

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

  const responsibleAuthor =
    await getResponsibleAuthorForEmail({
      supabase,
      submissionId,
    });

  if (
    responsibleAuthor?.email &&
    submission.title
  ) {
    const emailResult = await sendEmail({
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
    });

    if (!emailResult.success) {
      console.error(
        "E-mail de correção documental não enviado:",
        emailResult
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

  const { error } = await supabase
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
    );

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

  const responsibleAuthor =
    await getResponsibleAuthorForEmail({
      supabase,
      submissionId,
    });

  if (
    responsibleAuthor?.email &&
    submission.title
  ) {
    const emailResult = await sendEmail({
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
    });

    if (!emailResult.success) {
      console.error(
        "E-mail de aprovação documental não enviado:",
        emailResult
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