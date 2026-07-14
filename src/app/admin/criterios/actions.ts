"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

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
    redirect("/login");
  }

  return {
    profile,
    supabase,
  };
}

async function getCurrentEventId() {
  const { supabase } = await ensureAdmin();

  const { data: event, error } = await supabase
    .from("events")
    .select("id")
    .eq("is_public", true)
    .order("year", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

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

  return event.id;
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
  const eventId = await getCurrentEventId();

  const {
    data: lastCriterion,
    error: lastCriterionError,
  } = await supabase
    .from("evaluation_criteria")
    .select("display_order")
    .eq("event_id", eventId)
    .order("display_order", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

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

  const { error } = await supabase
    .from("evaluation_criteria")
    .insert({
      event_id: eventId,
      name,
      description: description || null,
      max_score: maxScore,
      display_order: nextDisplayOrder,
      is_active: true,
    });

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

  revalidatePath("/admin/criterios");

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

  if (!criterionId) {
    redirectWithMessage(
      "erro",
      "Não foi possível identificar o critério."
    );
  }

  validateCriterionFields({
    name,
    maxScore,
  });

  const { supabase } = await ensureAdmin();

  const { error } = await supabase
    .from("evaluation_criteria")
    .update({
      name,
      description: description || null,
      max_score: maxScore,
    })
    .eq("id", criterionId);

  if (error) {
    console.error("Erro ao editar critério:", {
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

  revalidatePath("/admin/criterios");

  redirectWithMessage(
    "sucesso",
    "Critério atualizado com sucesso."
  );
}

export async function deleteCriterion(formData: FormData) {
  const criterionId = String(
    formData.get("criterionId") ?? ""
  ).trim();

  if (!criterionId) {
    redirectWithMessage(
      "erro",
      "Não foi possível identificar o critério."
    );
  }

  const { supabase } = await ensureAdmin();

  const { data: criterion, error: criterionError } =
    await supabase
      .from("evaluation_criteria")
      .select("id, name")
      .eq("id", criterionId)
      .maybeSingle();

  if (criterionError) {
    console.error("Erro ao localizar critério:", {
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

  const { error } = await supabase
    .from("evaluation_criteria")
    .delete()
    .eq("id", criterionId);

  if (error) {
    console.error("Erro ao excluir critério:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    if (
      error.code === "23503" ||
      error.message.toLowerCase().includes("foreign key")
    ) {
      redirectWithMessage(
        "erro",
        "Este critério já possui avaliações vinculadas e não pode ser excluído."
      );
    }

    redirectWithMessage(
      "erro",
      `Não foi possível excluir o critério: ${error.message}`
    );
  }

  revalidatePath("/admin/criterios");

  redirectWithMessage(
    "sucesso",
    `Critério "${criterion.name}" excluído com sucesso.`
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

  const { supabase } = await ensureAdmin();

  for (const [index, criterionId] of orderedCriterionIds.entries()) {
    const { error } = await supabase
      .from("evaluation_criteria")
      .update({
        display_order: index + 1,
      })
      .eq("id", criterionId);

    if (error) {
      console.error("Erro ao reordenar critério:", {
        criterionId,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      redirectWithMessage(
        "erro",
        "Não foi possível salvar a nova ordem dos critérios."
      );
    }
  }

  revalidatePath("/admin/criterios");

  redirectWithMessage(
    "sucesso",
    "Ordem dos critérios atualizada com sucesso."
  );
}