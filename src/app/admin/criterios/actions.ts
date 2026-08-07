"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const ACTION_TIMEOUT_MS = 30_000;
const DATABASE_TIMEOUT_MS = 15_000;

type EnsureAdminResult = Awaited<ReturnType<typeof ensureAdmin>>;

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
    `/admin/criterios?${type}=${encodeURIComponent(message)}`
  );
}

async function ensureAdmin() {
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

async function getCurrentEventId(
  supabase: EnsureAdminResult["supabase"]
) {
  const { data: event, error } = await withTimeout(
    async () =>
      await supabase
        .from("events")
        .select("id")
        .eq("is_public", true)
        .order("year", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle(),
    "A busca pelo evento atual demorou mais que o esperado.",
    DATABASE_TIMEOUT_MS
  );

  if (error) {
    console.error("Erro ao buscar evento:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível localizar o evento da Jornada."
    );
  }

  if (!event) {
    redirectWithMessage(
      "erro",
      "Nenhum evento público foi localizado para vincular o critério."
    );
  }

  return event.id as string;
}

function parseDecimalValue(value: string) {
  return Number(value.trim().replace(",", "."));
}

function validateCriterionFields({
  name,
  maxScore,
}: {
  name: string;
  maxScore: number;
}) {
  if (name.length < 3) {
    redirectWithMessage(
      "erro",
      "O nome do critério deve possuir pelo menos 3 caracteres."
    );
  }

  if (
    Number.isNaN(maxScore) ||
    maxScore <= 0 ||
    maxScore > 100
  ) {
    redirectWithMessage(
      "erro",
      "A pontuação máxima do critério deve ser maior que 0 e menor ou igual a 100."
    );
  }
}

function validateCriterionId(criterionId: string) {
  if (!criterionId) {
    redirectWithMessage(
      "erro",
      "Não foi possível identificar o critério."
    );
  }
}

export async function createCriterion(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const maxScoreValue = String(
    formData.get("maxScore") ?? ""
  );

  const maxScore = parseDecimalValue(maxScoreValue);

  validateCriterionFields({
    name,
    maxScore,
  });

  const { supabase } = await ensureAdmin();
  const eventId = await getCurrentEventId(supabase);

  const {
    data: lastCriterion,
    error: lastCriterionError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("evaluation_criteria")
        .select("display_order")
        .eq("event_id", eventId)
        .order("display_order", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle(),
    "A busca pela ordem dos critérios demorou mais que o esperado.",
    DATABASE_TIMEOUT_MS
  );

  if (lastCriterionError) {
    console.error("Erro ao buscar última ordem:", {
      message: lastCriterionError.message,
      details: lastCriterionError.details,
      hint: lastCriterionError.hint,
      code: lastCriterionError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível definir a ordem automática do critério."
    );
  }

  const nextDisplayOrder =
    Number(lastCriterion?.display_order ?? 0) + 1;

  const { data: createdCriterion, error } =
    await withTimeout(
      async () =>
        await supabase
          .from("evaluation_criteria")
          .insert({
            event_id: eventId,
            name,
            description: description || null,
            max_score: maxScore,
            display_order: nextDisplayOrder,
            is_active: true,
          })
          .select("id")
          .maybeSingle(),
      "A criação do critério demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

  if (error) {
    console.error("Erro ao criar critério:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    redirectWithMessage(
      "erro",
      `Não foi possível criar o critério: ${error.message}`
    );
  }

  if (!createdCriterion) {
    redirectWithMessage(
      "erro",
      "O critério não pôde ser criado. Atualize a página e tente novamente."
    );
  }

  revalidatePath("/admin/criterios");
  revalidatePath("/avaliador");

  redirectWithMessage(
    "sucesso",
    "Critério criado com sucesso."
  );
}

export async function updateCriterion(formData: FormData) {
  const criterionId = String(
    formData.get("criterionId") ?? ""
  ).trim();

  const name = String(formData.get("name") ?? "").trim();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const maxScoreValue = String(
    formData.get("maxScore") ?? ""
  );

  const maxScore = parseDecimalValue(maxScoreValue);

  validateCriterionId(criterionId);

  validateCriterionFields({
    name,
    maxScore,
  });

  const { supabase } = await ensureAdmin();
  const eventId = await getCurrentEventId(supabase);

  const { data: updatedCriterion, error } =
    await withTimeout(
      async () =>
        await supabase
          .from("evaluation_criteria")
          .update({
            name,
            description: description || null,
            max_score: maxScore,
          })
          .eq("id", criterionId)
          .eq("event_id", eventId)
          .select("id")
          .maybeSingle(),
      "A edição do critério demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

  if (error) {
    console.error("Erro ao editar critério:", {
      criterionId,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    redirectWithMessage(
      "erro",
      `Não foi possível editar o critério: ${error.message}`
    );
  }

  if (!updatedCriterion) {
    redirectWithMessage(
      "erro",
      "O critério selecionado não foi encontrado ou não está ativo."
    );
  }

  revalidatePath("/admin/criterios");
  revalidatePath("/avaliador");

  redirectWithMessage(
    "sucesso",
    "Critério atualizado com sucesso."
  );
}

export async function deleteCriterion(formData: FormData) {
  const criterionId = String(
    formData.get("criterionId") ?? ""
  ).trim();

  validateCriterionId(criterionId);

  const { supabase } = await ensureAdmin();
  const eventId = await getCurrentEventId(supabase);

  const { data: criterion, error: criterionError } =
    await withTimeout(
      async () =>
        await supabase
          .from("evaluation_criteria")
          .select("id, name, is_active")
          .eq("id", criterionId)
          .eq("event_id", eventId)
          .maybeSingle(),
      "A busca pelo critério demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

  if (criterionError) {
    console.error("Erro ao localizar critério:", {
      criterionId,
      message: criterionError.message,
      details: criterionError.details,
      hint: criterionError.hint,
      code: criterionError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível localizar o critério."
    );
  }

  if (!criterion) {
    redirectWithMessage(
      "erro",
      "O critério selecionado não foi encontrado."
    );
  }

  const nextStatus = !criterion.is_active;

  const { data: updatedCriterion, error } =
    await withTimeout(
      async () =>
        await supabase
          .from("evaluation_criteria")
          .update({
            is_active: nextStatus,
          })
          .eq("id", criterionId)
          .eq("event_id", eventId)
          .select("id")
          .maybeSingle(),
      nextStatus
        ? "A ativação do critério demorou mais que o esperado."
        : "A desativação do critério demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

  if (error) {
    console.error(
      nextStatus
        ? "Erro ao ativar critério:"
        : "Erro ao desativar critério:",
      {
        criterionId,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    redirectWithMessage(
      "erro",
      nextStatus
        ? `Não foi possível ativar o critério: ${error.message}`
        : `Não foi possível desativar o critério: ${error.message}`
    );
  }

  if (!updatedCriterion) {
    redirectWithMessage(
      "erro",
      "O critério não pôde ser atualizado porque já foi alterado. Atualize a página e tente novamente."
    );
  }

  revalidatePath("/admin/criterios");
  revalidatePath("/avaliador");

  redirectWithMessage(
    "sucesso",
    nextStatus
      ? `Critério "${criterion.name}" ativado com sucesso.`
      : `Critério "${criterion.name}" desativado com sucesso.`
  );
}

export async function updateCriteriaOrder(formData: FormData) {
  const orderedCriterionIdsValue = String(
    formData.get("orderedCriterionIds") ?? ""
  ).trim();

  if (!orderedCriterionIdsValue) {
    redirectWithMessage(
      "erro",
      "Não foi possível identificar a nova ordem dos critérios."
    );
  }

  let orderedCriterionIds: string[] = [];

  try {
    const parsed = JSON.parse(orderedCriterionIdsValue);

    if (!Array.isArray(parsed)) {
      throw new Error("Valor inválido.");
    }

    orderedCriterionIds = parsed
      .map((id) => String(id).trim())
      .filter(Boolean);
  } catch {
    redirectWithMessage(
      "erro",
      "A nova ordem dos critérios está em formato inválido."
    );
  }

  if (!orderedCriterionIds.length) {
    redirectWithMessage(
      "erro",
      "Nenhum critério foi enviado para reordenação."
    );
  }

  const uniqueCriterionIds = Array.from(
    new Set(orderedCriterionIds)
  );

  if (uniqueCriterionIds.length !== orderedCriterionIds.length) {
    redirectWithMessage(
      "erro",
      "A lista de critérios possui itens duplicados. Atualize a página e tente novamente."
    );
  }

  const { supabase } = await ensureAdmin();
  const eventId = await getCurrentEventId(supabase);

  const { data: existingCriteria, error: existingCriteriaError } =
    await withTimeout(
      async () =>
        await supabase
          .from("evaluation_criteria")
          .select("id")
          .eq("event_id", eventId)
          .in("id", orderedCriterionIds),
      "A validação dos critérios demorou mais que o esperado.",
      DATABASE_TIMEOUT_MS
    );

  if (existingCriteriaError) {
    console.error("Erro ao validar critérios para reordenação:", {
      message: existingCriteriaError.message,
      details: existingCriteriaError.details,
      hint: existingCriteriaError.hint,
      code: existingCriteriaError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível validar os critérios enviados."
    );
  }

  if ((existingCriteria ?? []).length !== orderedCriterionIds.length) {
    redirectWithMessage(
      "erro",
      "Um ou mais critérios enviados não foram encontrados ou não estão ativos."
    );
  }

  const reorderResults = await withTimeout(
    async () =>
      await Promise.all(
        orderedCriterionIds.map((criterionId, index) =>
          supabase
            .from("evaluation_criteria")
            .update({
              display_order: index + 1,
            })
            .eq("id", criterionId)
            .eq("event_id", eventId)
            .select("id")
            .maybeSingle()
        )
      ),
    "A reordenação dos critérios demorou mais que o esperado.",
    DATABASE_TIMEOUT_MS
  );

  const failedResult = reorderResults.find(
    (result) => result.error || !result.data
  );

  if (failedResult?.error) {
    console.error("Erro ao reordenar critério:", {
      message: failedResult.error.message,
      details: failedResult.error.details,
      hint: failedResult.error.hint,
      code: failedResult.error.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível salvar a nova ordem dos critérios."
    );
  }

  if (failedResult && !failedResult.data) {
    redirectWithMessage(
      "erro",
      "Um critério não pôde ser reordenado porque já foi alterado. Atualize a página e tente novamente."
    );
  }

  revalidatePath("/admin/criterios");
  revalidatePath("/avaliador");

  redirectWithMessage(
    "sucesso",
    "Ordem dos critérios atualizada com sucesso."
  );
}