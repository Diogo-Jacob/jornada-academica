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
  )
    .trim()
    .replace(/\s+/g, " ");

  if (fullName.length < 3) {
    redirectWithMessage(
      "erro",
      "Informe um nome completo válido."
    );
  }

  if (fullName.length > 150) {
    redirectWithMessage(
      "erro",
      "O nome completo deve possuir no máximo 150 caracteres."
    );
  }

  const { profile, supabase } = await getCurrentUser();

  if (!profile.is_active || profile.role !== "student") {
    redirect("/acesso-negado");
  }

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Erro ao atualizar nome do perfil:", {
      userId: profile.id,
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

  if (!updatedProfile) {
    redirectWithMessage(
      "erro",
      "Não foi possível confirmar a atualização do perfil. Atualize a página e tente novamente."
    );
  }

  revalidatePath("/aluno");
  revalidatePath("/aluno/perfil");

  redirectWithMessage(
    "sucesso",
    "Nome atualizado com sucesso."
  );
}