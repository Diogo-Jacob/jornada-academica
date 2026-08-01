"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/services/email/send-email";
import { evaluationDeclinedAdminEmail } from "@/services/email/templates/evaluation-declined-admin";
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
  assignmentId: string,
  type: "erro" | "sucesso",
  message: string
): never {
  redirect(
    `/avaliador/trabalhos/${assignmentId}?${type}=${encodeURIComponent(
      message
    )}`
  );
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

async function getEvaluatorAssignment(
  assignmentId: string
) {
  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    profile.role !== "evaluator"
  ) {
    redirect("/acesso-negado");
  }

  const { data: assignment, error: assignmentError } =
    await supabase
      .from("evaluation_assignments")
      .select(`
        id,
        status,
        submission_id,
        evaluator_id
      `)
      .eq("id", assignmentId)
      .eq("evaluator_id", profile.id)
      .maybeSingle();

  if (assignmentError) {
    console.error("Erro ao consultar avaliação:", {
      message: assignmentError.message,
      details: assignmentError.details,
      hint: assignmentError.hint,
      code: assignmentError.code,
    });

    redirectWithMessage(
      assignmentId,
      "erro",
      "Não foi possível consultar a avaliação."
    );
  }

  if (!assignment) {
    redirectWithMessage(
      assignmentId,
      "erro",
      "A avaliação não foi encontrada."
    );
  }

  const { data: submission, error: submissionError } =
    await supabase
      .from("submissions")
      .select(`
        id,
        event_id,
        status
      `)
      .eq("id", assignment.submission_id)
      .maybeSingle();

  if (submissionError) {
    console.error(
      "Erro ao consultar submissão da avaliação:",
      {
        message: submissionError.message,
        details: submissionError.details,
        hint: submissionError.hint,
        code: submissionError.code,
      }
    );

    redirectWithMessage(
      assignmentId,
      "erro",
      "Não foi possível consultar o trabalho vinculado à avaliação."
    );
  }

  if (!submission) {
    redirectWithMessage(
      assignmentId,
      "erro",
      "O trabalho vinculado à avaliação não foi encontrado."
    );
  }

  return {
    profile,
    supabase,
    assignment,
    submission,
  };
}

async function notifyAdminsAboutEvaluationDecline({
  submissionId,
  evaluatorName,
  evaluatorEmail,
  declinedAt,
}: {
  submissionId: string;
  evaluatorName: string;
  evaluatorEmail: string | null;
  declinedAt: string;
}) {
  const adminSupabase = createAdminClient();

  const {
    data: submission,
    error: submissionError,
  } = await adminSupabase
    .from("submissions")
    .select(`
      id,
      title
    `)
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError || !submission) {
    console.error(
      "Não foi possível buscar dados da submissão para notificar admins:",
      {
        message: submissionError?.message,
        details: submissionError?.details,
        hint: submissionError?.hint,
        code: submissionError?.code,
      }
    );

    return;
  }

  const {
    data: admins,
    error: adminsError,
  } = await adminSupabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      role,
      is_active
    `)
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true);

  if (adminsError) {
    console.error(
      "Não foi possível buscar admins para notificação:",
      {
        message: adminsError.message,
        details: adminsError.details,
        hint: adminsError.hint,
        code: adminsError.code,
      }
    );

    return;
  }

  if (!admins?.length) {
    console.error(
      "Nenhum admin ativo encontrado para receber notificação de recusa."
    );

    return;
  }

  for (const admin of admins) {
    if (!admin.email) {
      continue;
    }

    const emailResult = await sendEmail({
      to: admin.email,
      subject:
        "Avaliação recusada - substituição necessária",
      html: evaluationDeclinedAdminEmail({
        adminName:
          admin.full_name ?? "Administrador(a)",
        evaluatorName,
        evaluatorEmail,
        title: submission.title,
        declinedAt: formatDateTime(declinedAt),
      }),
    });

    if (!emailResult.success) {
      console.error(
        "E-mail para admin sobre recusa de avaliação não enviado:",
        emailResult
      );
    }
  }
}

export async function startEvaluation(
  formData: FormData
) {
  const assignmentId = String(
    formData.get("assignmentId") ?? ""
  ).trim();

  if (!assignmentId) {
    redirect("/avaliador");
  }

  const { profile, supabase, assignment } =
    await getEvaluatorAssignment(assignmentId);

  if (assignment.status === "in_progress") {
    redirectWithMessage(
      assignmentId,
      "sucesso",
      "Avaliação já estava em andamento."
    );
  }

  if (assignment.status === "completed") {
    redirectWithMessage(
      assignmentId,
      "erro",
      "Esta avaliação já foi concluída."
    );
  }

  if (assignment.status !== "assigned") {
    redirectWithMessage(
      assignmentId,
      "erro",
      "Esta avaliação não está mais pendente. Atualize a página para continuar."
    );
  }

  let result;

  try {
    result = await withTimeout(
      async () =>
        await supabase
          .from("evaluation_assignments")
          .update({
            status: "in_progress",
            started_at: new Date().toISOString(),
          })
          .eq("id", assignmentId)
          .eq("evaluator_id", profile.id)
          .eq("status", "assigned")
          .select("id, status")
          .maybeSingle(),
      "A tentativa de iniciar a avaliação demorou mais que o esperado.",
      15_000
    );
  } catch (error) {
    console.error("Timeout ao iniciar avaliação:", {
      assignmentId,
      evaluatorId: profile.id,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    redirectWithMessage(
      assignmentId,
      "erro",
      "A tentativa de iniciar a avaliação demorou mais que o esperado. Atualize a página e tente novamente."
    );
  }

  if (result.error) {
    console.error("Erro ao iniciar avaliação:", {
      assignmentId,
      evaluatorId: profile.id,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
      code: result.error.code,
    });

    redirectWithMessage(
      assignmentId,
      "erro",
      "Não foi possível iniciar a avaliação."
    );
  }

  if (!result.data) {
    redirectWithMessage(
      assignmentId,
      "erro",
      "A avaliação não pôde ser iniciada porque ela já foi alterada. Atualize a página e tente novamente."
    );
  }

  redirectWithMessage(
    assignmentId,
    "sucesso",
    "Avaliação iniciada com sucesso."
  );
}

export async function declineEvaluation(
  formData: FormData
) {
  const assignmentId = String(
    formData.get("assignmentId") ?? ""
  ).trim();

  if (!assignmentId) {
    redirect("/avaliador");
  }

  const { profile, supabase, assignment, submission } =
    await getEvaluatorAssignment(assignmentId);

  if (assignment.status !== "assigned") {
    redirectWithMessage(
      assignmentId,
      "erro",
      "Somente avaliações ainda não iniciadas podem ser recusadas."
    );
  }

  const declinedAt = new Date().toISOString();

  let result;

  try {
    result = await withTimeout(
      async () =>
        await supabase
          .from("evaluation_assignments")
          .update({
            status: "declined",
          })
          .eq("id", assignmentId)
          .eq("evaluator_id", profile.id)
          .eq("status", "assigned"),
      "A tentativa de recusar a avaliação demorou mais que o esperado."
    );
  } catch (error) {
    console.error("Timeout ao recusar avaliação:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    redirectWithMessage(
      assignmentId,
      "erro",
      "A tentativa de recusar a avaliação demorou mais que o esperado. Atualize a página e tente novamente."
    );
  }

  if (result.error) {
    console.error("Erro ao recusar avaliação:", {
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
      code: result.error.code,
    });

    redirectWithMessage(
      assignmentId,
      "erro",
      "Não foi possível recusar esta avaliação."
    );
  }

  const adminSupabase = createAdminClient();

  const { error: submissionUpdateError } =
    await adminSupabase
      .from("submissions")
      .update({
        status:
          "evaluator_replacement_required",
      })
      .eq("id", submission.id)
      .in("status", [
        "under_evaluation",
        "one_evaluation_completed",
      ]);

  if (submissionUpdateError) {
    console.error(
      "Avaliação recusada, mas não foi possível marcar a submissão como aguardando substituição:",
      {
        message:
          submissionUpdateError.message,
        details:
          submissionUpdateError.details,
        hint: submissionUpdateError.hint,
        code: submissionUpdateError.code,
      }
    );
  }

  await notifyAdminsAboutEvaluationDecline({
    submissionId: submission.id,
    evaluatorName:
      profile.full_name ?? "Avaliador(a)",
    evaluatorEmail: profile.email ?? null,
    declinedAt,
  });

  revalidatePath("/avaliador");
  revalidatePath(`/avaliador/trabalhos/${assignmentId}`);
  revalidatePath("/admin/avaliacoes");
  revalidatePath("/admin/submissoes");
  revalidatePath(`/admin/submissoes/${submission.id}`);

  redirectWithMessage(
    assignmentId,
    "sucesso",
    "Avaliação recusada. A Comissão Científica selecionará outro avaliador."
  );
}

export async function completeEvaluation(
  formData: FormData
) {
  const assignmentId = String(
    formData.get("assignmentId") ?? ""
  ).trim();

  if (!assignmentId) {
    redirect("/avaliador");
  }

  const { profile, supabase, assignment, submission } =
    await getEvaluatorAssignment(assignmentId);

  if (assignment.status !== "in_progress") {
    redirectWithMessage(
      assignmentId,
      "erro",
      "A avaliação precisa estar em andamento para ser concluída."
    );
  }

  const { data: criteria, error: criteriaError } =
    await supabase
      .from("evaluation_criteria")
      .select(`
        id,
        name,
        max_score,
        display_order,
        is_active
      `)
      .eq("event_id", submission.event_id)
      .eq("is_active", true)
      .order("display_order", {
        ascending: true,
      });

  if (criteriaError) {
    console.error("Erro ao buscar critérios:", {
      message: criteriaError.message,
      details: criteriaError.details,
      hint: criteriaError.hint,
      code: criteriaError.code,
    });

    redirectWithMessage(
      assignmentId,
      "erro",
      "Não foi possível carregar os critérios da avaliação."
    );
  }

  if (!criteria?.length) {
    redirectWithMessage(
      assignmentId,
      "erro",
      "Nenhum critério ativo foi localizado para esta avaliação."
    );
  }

  const { data: scoreOptions, error: scoreOptionsError } =
    await supabase
      .from("evaluation_score_options")
      .select(`
        id,
        label,
        percentage,
        is_active
      `)
      .eq("is_active", true);

  if (scoreOptionsError) {
    console.error(
      "Erro ao buscar opções de pontuação:",
      {
        message: scoreOptionsError.message,
        details: scoreOptionsError.details,
        hint: scoreOptionsError.hint,
        code: scoreOptionsError.code,
      }
    );

    redirectWithMessage(
      assignmentId,
      "erro",
      "Não foi possível carregar as opções de pontuação."
    );
  }

  if (!scoreOptions?.length) {
    redirectWithMessage(
      assignmentId,
      "erro",
      "Nenhuma opção de pontuação ativa foi localizada."
    );
  }

  const scoreOptionMap = new Map(
    scoreOptions.map((option) => [
      option.id,
      option,
    ])
  );

  const responses = criteria.map((criterion) => {
    const selectedOptionId = String(
      formData.get(`criterion_${criterion.id}`) ?? ""
    ).trim();

    if (!selectedOptionId) {
      redirectWithMessage(
        assignmentId,
        "erro",
        `Ainda falta responder o critério: ${criterion.name}.`
      );
    }

    const selectedOption =
      scoreOptionMap.get(selectedOptionId);

    if (!selectedOption) {
      redirectWithMessage(
        assignmentId,
        "erro",
        `A opção selecionada para o critério "${criterion.name}" não é válida.`
      );
    }

    const score =
      (Number(criterion.max_score) *
        Number(selectedOption.percentage)) /
      100;

    return {
      assignment_id: assignmentId,
      criterion_id: criterion.id,
      score_option_id: selectedOption.id,
      score,
    };
  });

  let upsertResult;

  try {
    upsertResult = await withTimeout(
      async () =>
        await supabase
          .from("evaluation_responses")
          .upsert(responses, {
            onConflict: "assignment_id,criterion_id",
          }),
      "A tentativa de salvar as respostas demorou mais que o esperado."
    );
  } catch (error) {
    console.error("Timeout ao salvar respostas:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    redirectWithMessage(
      assignmentId,
      "erro",
      "A tentativa de salvar as respostas demorou mais que o esperado. Atualize a página e tente novamente."
    );
  }

  if (upsertResult.error) {
    console.error("Erro ao salvar respostas:", {
      message: upsertResult.error.message,
      details: upsertResult.error.details,
      hint: upsertResult.error.hint,
      code: upsertResult.error.code,
    });

    redirectWithMessage(
      assignmentId,
      "erro",
      "Não foi possível salvar as respostas da avaliação."
    );
  }

  let updateResult;

  try {
    updateResult = await withTimeout(
      async () =>
        await supabase
          .from("evaluation_assignments")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", assignmentId)
          .eq("evaluator_id", profile.id)
          .eq("status", "in_progress"),
      "A tentativa de concluir a avaliação demorou mais que o esperado."
    );
  } catch (error) {
    console.error("Timeout ao concluir avaliação:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    redirectWithMessage(
      assignmentId,
      "erro",
      "A tentativa de concluir a avaliação demorou mais que o esperado. Atualize a página e tente novamente."
    );
  }

  if (updateResult.error) {
    console.error("Erro ao concluir avaliação:", {
      message: updateResult.error.message,
      details: updateResult.error.details,
      hint: updateResult.error.hint,
      code: updateResult.error.code,
    });

    redirectWithMessage(
      assignmentId,
      "erro",
      "As respostas foram salvas, mas não foi possível concluir a avaliação."
    );
  }

  revalidatePath("/avaliador");
  revalidatePath(`/avaliador/trabalhos/${assignmentId}`);
  revalidatePath("/admin/avaliacoes");
  revalidatePath("/admin/submissoes");
  revalidatePath(`/admin/submissoes/${submission.id}`);
  revalidatePath("/admin/resultados");

  redirectWithMessage(
    assignmentId,
    "sucesso",
    "Avaliação concluída com sucesso."
  );
}