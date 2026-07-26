"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

function redirectWithMessage(
  type: "erro" | "sucesso",
  message: string
): never {
  redirect(
    `/aluno/perfil?${type}=${encodeURIComponent(message)}`
  );
}

export async function updateProfileName(formData: FormData) {
  const fullName = String(
    formData.get("fullName") ?? ""
  ).trim();

  if (fullName.length < 3) {
    redirectWithMessage(
      "erro",
      "Informe um nome completo válido."
    );
  }

  const { profile, supabase } = await getCurrentUser();

  if (!profile.is_active || profile.role !== "student") {
    redirect("/acesso-negado");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) {
    console.error("Erro ao atualizar nome do perfil:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível atualizar seu nome. Tente novamente."
    );
  }

  revalidatePath("/aluno/perfil");

  redirectWithMessage(
    "sucesso",
    "Nome atualizado com sucesso."
  );
}