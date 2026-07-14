"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/services/email/send-email";
import { evaluationAssignedEmail } from "@/services/email/templates/evaluation-assigned";
import { getCurrentUser } from "@/lib/auth/get-current-user";

function redirectWithMessage(
  type: "erro" | "sucesso",
  message: string
): never {
  redirect(
    `/admin/avaliacoes?${type}=${encodeURIComponent(message)}`
  );
}

async function getAdminContext() {
  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/login");
  }

  return {
    profile,
    supabase,
  };
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

async function sendEvaluationAssignedEmail({
  evaluator,
  submissionTitle,
  assignmentType,
  assignedAt,
}: {
  evaluator: {
    full_name: string | null;
    email: string | null;
  };
  submissionTitle: string;
  assignmentType: "initial" | "replacement" | "third";
  assignedAt: string;
}) {
  if (!evaluator.email) {
    console.error(
      "E-mail do avaliador não encontrado. Notificação não enviada."
    );

    return;
  }

  const emailResult = await sendEmail({
    to: evaluator.email,
    subject:
      assignmentType === "third"
        ? "Terceira avaliação atribuída"
        : assignmentType === "replacement"
          ? "Avaliação atribuída como substituição"
          : "Novo trabalho atribuído para avaliação",
    html: evaluationAssignedEmail({
      evaluatorName:
        evaluator.full_name ?? "Avaliador(a)",
      title: submissionTitle,
      assignmentType,
      assignedAt: formatDateTime(assignedAt),
    }),
  });

  if (!emailResult.success) {
    console.error(
      "E-mail de atribuição de avaliação não enviado:",
      emailResult
    );
  }
}

async function validateEvaluator({
  evaluatorId,
  supabase,
}: {
  evaluatorId: string;
  supabase: Awaited<ReturnType<typeof getCurrentUser>>["supabase"];
}) {
  const { data: evaluator, error } = await supabase
    .from("profiles")
    .select("id, role, is_active, full_name, email")
    .eq("id", evaluatorId)
    .maybeSingle();

  if (error || !evaluator) {
    redirectWithMessage(
      "erro",
      "O avaliador selecionado não foi encontrado."
    );
  }

  if (
    evaluator.role !== "evaluator" ||
    !evaluator.is_active
  ) {
    redirectWithMessage(
      "erro",
      "O usuário selecionado não possui perfil de avaliador ativo."
    );
  }

  return evaluator;
}

async function validateEvaluatorNotAlreadyAssigned({
  submissionId,
  evaluatorId,
  supabase,
}: {
  submissionId: string;
  evaluatorId: string;
  supabase: Awaited<ReturnType<typeof getCurrentUser>>["supabase"];
}) {
  const { data: existingAssignment, error } =
    await supabase
      .from("evaluation_assignments")
      .select("id, status")
      .eq("submission_id", submissionId)
      .eq("evaluator_id", evaluatorId)
      .maybeSingle();

  if (error) {
    redirectWithMessage(
      "erro",
      "Não foi possível verificar se o avaliador já foi atribuído a este trabalho."
    );
  }

  if (existingAssignment) {
    redirectWithMessage(
      "erro",
      "Este avaliador já possui ou já possuiu atribuição para este trabalho. Selecione outro avaliador."
    );
  }
}

export async function assignEvaluators(formData: FormData) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  const evaluatorOneId = String(
    formData.get("evaluatorOneId") ?? ""
  ).trim();

  const evaluatorTwoId = String(
    formData.get("evaluatorTwoId") ?? ""
  ).trim();

  if (!submissionId) {
    redirectWithMessage(
      "erro",
      "Não foi possível identificar a submissão."
    );
  }

  if (!evaluatorOneId || !evaluatorTwoId) {
    redirectWithMessage(
      "erro",
      "Selecione dois avaliadores para o trabalho."
    );
  }

  if (evaluatorOneId === evaluatorTwoId) {
    redirectWithMessage(
      "erro",
      "Os dois avaliadores precisam ser diferentes."
    );
  }

  const { profile, supabase } = await getAdminContext();

  const { data: submission, error: submissionError } =
    await supabase
      .from("submissions")
      .select("id, title, status")
      .eq("id", submissionId)
      .maybeSingle();

  if (submissionError) {
    console.error(
      "Erro ao consultar submissão:",
      submissionError
    );

    redirectWithMessage(
      "erro",
      "Não foi possível consultar a submissão."
    );
  }

  if (!submission) {
    redirectWithMessage(
      "erro",
      "A submissão não foi encontrada."
    );
  }

  if (submission.status !== "approved_for_evaluation") {
    redirectWithMessage(
      "erro",
      "A submissão precisa estar aprovada para avaliação antes da distribuição."
    );
  }

  const { data: existingAssignments } =
    await supabase
      .from("evaluation_assignments")
      .select("id")
      .eq("submission_id", submissionId);

  if (existingAssignments?.length) {
    redirectWithMessage(
      "erro",
      "Esta submissão já possui avaliadores atribuídos."
    );
  }

  const { data: evaluators, error: evaluatorsError } =
    await supabase
      .from("profiles")
      .select("id, role, is_active, full_name, email")
      .in("id", [evaluatorOneId, evaluatorTwoId]);

  if (evaluatorsError) {
    console.error(
      "Erro ao consultar avaliadores:",
      evaluatorsError
    );

    redirectWithMessage(
      "erro",
      "Não foi possível validar os avaliadores selecionados."
    );
  }

  if (!evaluators || evaluators.length !== 2) {
    redirectWithMessage(
      "erro",
      "Um dos avaliadores selecionados não foi encontrado."
    );
  }

  const invalidEvaluator = evaluators.find(
    (evaluator) =>
      evaluator.role !== "evaluator" || !evaluator.is_active
  );

  if (invalidEvaluator) {
    redirectWithMessage(
      "erro",
      "Um dos usuários selecionados não possui perfil de avaliador ativo."
    );
  }

  const assignedAt = new Date().toISOString();

  const { error: assignmentError } = await supabase
    .from("evaluation_assignments")
    .insert([
      {
        submission_id: submissionId,
        evaluator_id: evaluatorOneId,
        assigned_by: profile.id,
        status: "assigned",
      },
      {
        submission_id: submissionId,
        evaluator_id: evaluatorTwoId,
        assigned_by: profile.id,
        status: "assigned",
      },
    ]);

  if (assignmentError) {
    console.error("Erro ao atribuir avaliadores:", {
      message: assignmentError.message,
      details: assignmentError.details,
      hint: assignmentError.hint,
      code: assignmentError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível atribuir os avaliadores."
    );
  }

  const { error: updateSubmissionError } = await supabase
    .from("submissions")
    .update({
      status: "under_evaluation",
    })
    .eq("id", submissionId)
    .eq("status", "approved_for_evaluation");

  if (updateSubmissionError) {
    console.error(
      "Erro ao atualizar status da submissão:",
      {
        message: updateSubmissionError.message,
        details: updateSubmissionError.details,
        hint: updateSubmissionError.hint,
        code: updateSubmissionError.code,
      }
    );

    redirectWithMessage(
      "erro",
      "Os avaliadores foram atribuídos, mas não foi possível atualizar o status da submissão."
    );
  }

  for (const evaluator of evaluators) {
    await sendEvaluationAssignedEmail({
      evaluator,
      submissionTitle: submission.title,
      assignmentType: "initial",
      assignedAt,
    });
  }

  revalidatePath("/admin/avaliacoes");
  revalidatePath("/admin/submissoes");
  revalidatePath(`/admin/submissoes/${submissionId}`);

  redirectWithMessage(
    "sucesso",
    "Avaliadores atribuídos com sucesso. O trabalho foi encaminhado para avaliação científica."
  );
}

export async function assignReplacementEvaluator(
  formData: FormData
) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  const declinedAssignmentId = String(
    formData.get("declinedAssignmentId") ?? ""
  ).trim();

  const evaluatorId = String(
    formData.get("replacementEvaluatorId") ?? ""
  ).trim();

  if (
    !submissionId ||
    !declinedAssignmentId ||
    !evaluatorId
  ) {
    redirectWithMessage(
      "erro",
      "Não foi possível identificar o trabalho, a avaliação recusada ou o novo avaliador."
    );
  }

  const { profile, supabase } = await getAdminContext();

  const { data: submission, error: submissionError } =
    await supabase
      .from("submissions")
      .select("id, title, status")
      .eq("id", submissionId)
      .maybeSingle();

  if (submissionError || !submission) {
    redirectWithMessage(
      "erro",
      "A submissão não foi encontrada."
    );
  }

  if (
    submission.status !==
    "evaluator_replacement_required"
  ) {
    redirectWithMessage(
      "erro",
      "Esta submissão não está aguardando substituição de avaliador."
    );
  }

  const {
    data: declinedAssignment,
    error: declinedAssignmentError,
  } = await supabase
    .from("evaluation_assignments")
    .select("id, submission_id, evaluator_id, status")
    .eq("id", declinedAssignmentId)
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (
    declinedAssignmentError ||
    !declinedAssignment
  ) {
    redirectWithMessage(
      "erro",
      "A avaliação recusada não foi localizada."
    );
  }

  if (
    declinedAssignment.status !== "declined"
  ) {
    redirectWithMessage(
      "erro",
      "A avaliação selecionada não está marcada como recusada."
    );
  }

  if (
    declinedAssignment.evaluator_id === evaluatorId
  ) {
    redirectWithMessage(
      "erro",
      "Selecione um avaliador diferente daquele que recusou."
    );
  }

  const evaluator = await validateEvaluator({
    evaluatorId,
    supabase,
  });

  await validateEvaluatorNotAlreadyAssigned({
    submissionId,
    evaluatorId,
    supabase,
  });

  const assignedAt = new Date().toISOString();

  const { error: insertError } = await supabase
    .from("evaluation_assignments")
    .insert({
      submission_id: submissionId,
      evaluator_id: evaluatorId,
      assigned_by: profile.id,
      status: "assigned",
    });

  if (insertError) {
    console.error(
      "Erro ao atribuir avaliador substituto:",
      {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      }
    );

    redirectWithMessage(
      "erro",
      "Não foi possível atribuir o avaliador substituto."
    );
  }

  const { error: cancelDeclinedError } =
    await supabase
      .from("evaluation_assignments")
      .update({
        status: "cancelled",
      })
      .eq("id", declinedAssignmentId)
      .eq("status", "declined");

  if (cancelDeclinedError) {
    console.error(
      "Erro ao finalizar avaliação recusada:",
      {
        message: cancelDeclinedError.message,
        details: cancelDeclinedError.details,
        hint: cancelDeclinedError.hint,
        code: cancelDeclinedError.code,
      }
    );

    redirectWithMessage(
      "erro",
      "O substituto foi atribuído, mas não foi possível finalizar o registro da recusa."
    );
  }

  await supabase
    .from("submissions")
    .update({
      status: "under_evaluation",
    })
    .eq("id", submissionId)
    .eq("status", "evaluator_replacement_required");

  await sendEvaluationAssignedEmail({
    evaluator,
    submissionTitle: submission.title,
    assignmentType: "replacement",
    assignedAt,
  });

  revalidatePath("/admin/avaliacoes");
  revalidatePath("/admin/submissoes");
  revalidatePath(`/admin/submissoes/${submissionId}`);

  redirectWithMessage(
    "sucesso",
    "Avaliador substituto atribuído com sucesso."
  );
}

export async function assignThirdEvaluator(
  formData: FormData
) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  const evaluatorId = String(
    formData.get("thirdEvaluatorId") ?? ""
  ).trim();

  if (!submissionId || !evaluatorId) {
    redirectWithMessage(
      "erro",
      "Não foi possível identificar o trabalho ou o terceiro avaliador."
    );
  }

  const { profile, supabase } = await getAdminContext();

  const { data: submission, error: submissionError } =
    await supabase
      .from("submissions")
      .select("id, title, status")
      .eq("id", submissionId)
      .maybeSingle();

  if (submissionError || !submission) {
    redirectWithMessage(
      "erro",
      "A submissão não foi encontrada."
    );
  }

  if (
    submission.status !==
    "third_evaluator_required"
  ) {
    redirectWithMessage(
      "erro",
      "Esta submissão não está aguardando terceiro avaliador."
    );
  }

  const evaluator = await validateEvaluator({
    evaluatorId,
    supabase,
  });

  await validateEvaluatorNotAlreadyAssigned({
    submissionId,
    evaluatorId,
    supabase,
  });

  const assignedAt = new Date().toISOString();

  const { error: insertError } = await supabase
    .from("evaluation_assignments")
    .insert({
      submission_id: submissionId,
      evaluator_id: evaluatorId,
      assigned_by: profile.id,
      status: "assigned",
    });

  if (insertError) {
    console.error(
      "Erro ao atribuir terceiro avaliador:",
      {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      }
    );

    redirectWithMessage(
      "erro",
      "Não foi possível atribuir o terceiro avaliador."
    );
  }

  await supabase
    .from("submissions")
    .update({
      status: "under_evaluation",
    })
    .eq("id", submissionId)
    .eq("status", "third_evaluator_required");

  await sendEvaluationAssignedEmail({
    evaluator,
    submissionTitle: submission.title,
    assignmentType: "third",
    assignedAt,
  });

  revalidatePath("/admin/avaliacoes");
  revalidatePath("/admin/submissoes");
  revalidatePath(`/admin/submissoes/${submissionId}`);

  redirectWithMessage(
    "sucesso",
    "Terceiro avaliador atribuído com sucesso."
  );
}