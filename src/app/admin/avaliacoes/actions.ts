"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/services/email/send-email";
import { evaluationAssignedEmail } from "@/services/email/templates/evaluation-assigned";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const ACTION_TIMEOUT_MS = 30_000;
const STATUS_UPDATE_TIMEOUT_MS = 15_000;
const EMAIL_TIMEOUT_MS = 15_000;

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
    redirect("/acesso-negado");
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
  const evaluatorEmail = evaluator.email;

  if (!evaluatorEmail) {
    console.error(
      "E-mail do avaliador não encontrado. Notificação não enviada."
    );

    return;
  }

  try {
    const emailResult = await withTimeout(
      async () =>
        await sendEmail({
          to: evaluatorEmail,
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
        }),
      "O envio do e-mail de atribuição demorou mais que o esperado.",
      EMAIL_TIMEOUT_MS
    );

    if (!emailResult.success) {
      console.error(
        "E-mail de atribuição de avaliação não enviado:",
        emailResult
      );
    }
  } catch (error) {
    console.error(
      "A avaliação foi atribuída, mas o envio do e-mail falhou ou demorou demais:",
      {
        evaluatorEmail,
        assignmentType,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
        error,
      }
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
    console.error(
      "Erro ao verificar se avaliador já foi atribuído:",
      {
        submissionId,
        evaluatorId,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

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
      {
        submissionId,
        message: submissionError.message,
        details: submissionError.details,
        hint: submissionError.hint,
        code: submissionError.code,
      }
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

  const { data: existingAssignments, error: existingAssignmentsError } =
    await supabase
      .from("evaluation_assignments")
      .select("id")
      .eq("submission_id", submissionId);

  if (existingAssignmentsError) {
    console.error(
      "Erro ao consultar atribuições existentes:",
      {
        submissionId,
        message: existingAssignmentsError.message,
        details: existingAssignmentsError.details,
        hint: existingAssignmentsError.hint,
        code: existingAssignmentsError.code,
      }
    );

    redirectWithMessage(
      "erro",
      "Não foi possível verificar se esta submissão já possui avaliadores."
    );
  }

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
      {
        submissionId,
        message: evaluatorsError.message,
        details: evaluatorsError.details,
        hint: evaluatorsError.hint,
        code: evaluatorsError.code,
      }
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
      submissionId,
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

  const {
    data: updatedSubmission,
    error: updateSubmissionError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("submissions")
        .update({
          status: "under_evaluation",
        })
        .eq("id", submissionId)
        .in("status", [
          "approved_for_evaluation",
          "under_evaluation",
        ])
        .select("id, status")
        .maybeSingle(),
    "A tentativa de atualizar o status da submissão demorou mais que o esperado.",
    STATUS_UPDATE_TIMEOUT_MS
  );

  if (updateSubmissionError) {
    console.error(
      "Erro ao atualizar status da submissão:",
      {
        submissionId,
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

  let successMessage =
    "Avaliadores atribuídos com sucesso. O trabalho foi encaminhado para avaliação científica.";

  if (!updatedSubmission) {
    const {
      data: currentSubmission,
      error: currentSubmissionError,
    } = await supabase
      .from("submissions")
      .select("id, status")
      .eq("id", submissionId)
      .maybeSingle();

    if (currentSubmissionError) {
      console.error(
        "Avaliadores atribuídos, mas não foi possível consultar o status atual:",
        {
          submissionId,
          message: currentSubmissionError.message,
          details: currentSubmissionError.details,
          hint: currentSubmissionError.hint,
          code: currentSubmissionError.code,
        }
      );

      successMessage =
        "Avaliadores atribuídos com sucesso. Atualize a página para conferir o status atual da submissão.";
    } else if (currentSubmission?.status === "under_evaluation") {
      successMessage =
        "Avaliadores atribuídos com sucesso. O trabalho foi encaminhado para avaliação científica.";
    } else {
      successMessage =
        "Avaliadores atribuídos com sucesso. Atualize a página para conferir o status atual da submissão.";
    }
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
    successMessage
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
    console.error(
      "Erro ao consultar submissão para substituição:",
      {
        submissionId,
        message: submissionError?.message,
        details: submissionError?.details,
        hint: submissionError?.hint,
        code: submissionError?.code,
      }
    );

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
    console.error(
      "Erro ao localizar avaliação recusada:",
      {
        submissionId,
        declinedAssignmentId,
        message: declinedAssignmentError?.message,
        details: declinedAssignmentError?.details,
        hint: declinedAssignmentError?.hint,
        code: declinedAssignmentError?.code,
      }
    );

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
        submissionId,
        evaluatorId,
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

  const {
    data: cancelledDeclinedAssignment,
    error: cancelDeclinedError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("evaluation_assignments")
        .update({
          status: "cancelled",
        })
        .eq("id", declinedAssignmentId)
        .eq("status", "declined")
        .select("id, status")
        .maybeSingle(),
    "A tentativa de finalizar a avaliação recusada demorou mais que o esperado.",
    STATUS_UPDATE_TIMEOUT_MS
  );

  if (cancelDeclinedError) {
    console.error(
      "Erro ao finalizar avaliação recusada:",
      {
        submissionId,
        declinedAssignmentId,
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

  if (!cancelledDeclinedAssignment) {
    redirectWithMessage(
      "erro",
      "O substituto foi atribuído, mas a avaliação recusada já havia sido alterada. Atualize a página."
    );
  }

  const {
    data: updatedSubmission,
    error: updateSubmissionError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("submissions")
        .update({
          status: "under_evaluation",
        })
        .eq("id", submissionId)
        .eq("status", "evaluator_replacement_required")
        .select("id, status")
        .maybeSingle(),
    "A tentativa de atualizar o status da submissão demorou mais que o esperado.",
    STATUS_UPDATE_TIMEOUT_MS
  );

  if (updateSubmissionError) {
    console.error(
      "Erro ao atualizar submissão após substituição:",
      {
        submissionId,
        message: updateSubmissionError.message,
        details: updateSubmissionError.details,
        hint: updateSubmissionError.hint,
        code: updateSubmissionError.code,
      }
    );

    redirectWithMessage(
      "erro",
      "O substituto foi atribuído, mas não foi possível atualizar o status da submissão."
    );
  }

  if (!updatedSubmission) {
    redirectWithMessage(
      "erro",
      "O substituto foi atribuído, mas o status da submissão já havia sido alterado. Atualize a página."
    );
  }

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
    console.error(
      "Erro ao consultar submissão para terceiro avaliador:",
      {
        submissionId,
        message: submissionError?.message,
        details: submissionError?.details,
        hint: submissionError?.hint,
        code: submissionError?.code,
      }
    );

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
        submissionId,
        evaluatorId,
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

  const {
    data: updatedSubmission,
    error: updateSubmissionError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("submissions")
        .update({
          status: "under_evaluation",
        })
        .eq("id", submissionId)
        .eq("status", "third_evaluator_required")
        .select("id, status")
        .maybeSingle(),
    "A tentativa de atualizar o status da submissão demorou mais que o esperado.",
    STATUS_UPDATE_TIMEOUT_MS
  );

  if (updateSubmissionError) {
    console.error(
      "Erro ao atualizar submissão após terceiro avaliador:",
      {
        submissionId,
        message: updateSubmissionError.message,
        details: updateSubmissionError.details,
        hint: updateSubmissionError.hint,
        code: updateSubmissionError.code,
      }
    );

    redirectWithMessage(
      "erro",
      "O terceiro avaliador foi atribuído, mas não foi possível atualizar o status da submissão."
    );
  }

  if (!updatedSubmission) {
    redirectWithMessage(
      "erro",
      "O terceiro avaliador foi atribuído, mas o status da submissão já havia sido alterado. Atualize a página."
    );
  }

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