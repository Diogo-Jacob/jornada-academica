"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

function redirectWithMessage(
  type: "erro" | "sucesso",
  message: string
): never {
  redirect(
    `/admin/avaliadores?${type}=${encodeURIComponent(message)}`
  );
}

function createInviteToken() {
  return `${crypto.randomUUID()}-${crypto
    .randomUUID()
    .replaceAll("-", "")}`;
}

export async function createEvaluatorInvitation(
  formData: FormData
) {
  const professorName = String(
    formData.get("professorName") ?? ""
  ).trim();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (professorName.length < 3) {
    redirectWithMessage(
      "erro",
      "Informe o nome completo do professor."
    );
  }

  if (!email || !email.includes("@")) {
    redirectWithMessage(
      "erro",
      "Informe um e-mail válido."
    );
  }

  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/login");
  }

  const token = createInviteToken();

  const { error } = await supabase
    .from("evaluator_invitations")
    .insert({
      token,
      professor_name: professorName,
      email,
      invited_by: profile.id,
      status: "pending",
    });

  if (error) {
    console.error("Erro ao criar convite de avaliador:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível criar o convite."
    );
  }

  revalidatePath("/admin/avaliadores");

  redirectWithMessage(
    "sucesso",
    "Convite criado com sucesso. Copie o link e envie manualmente ao professor."
  );
}

export async function cancelEvaluatorInvitation(
  formData: FormData
) {
  const invitationId = String(
    formData.get("invitationId") ?? ""
  ).trim();

  if (!invitationId) {
    redirectWithMessage(
      "erro",
      "Não foi possível identificar o convite."
    );
  }

  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("evaluator_invitations")
    .update({
      status: "cancelled",
    })
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) {
    console.error("Erro ao cancelar convite:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível cancelar o convite."
    );
  }

  revalidatePath("/admin/avaliadores");

  redirectWithMessage(
    "sucesso",
    "Convite cancelado com sucesso."
  );
}