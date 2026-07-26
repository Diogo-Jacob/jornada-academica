"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function redirectWithError(message: string): never {
  redirect(`/login?erro=${encodeURIComponent(message)}`);
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirectWithError("Informe o e-mail e a senha para entrar.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Erro real do Supabase no login:", {
      message: error.message,
      status: error.status,
      name: error.name,
    });

    if (
      error.message.toLowerCase().includes("invalid login credentials")
    ) {
      redirectWithError("E-mail ou senha incorretos.");
    }

    if (
      error.message.toLowerCase().includes("email not confirmed")
    ) {
      redirectWithError(
        "Este e-mail ainda não foi confirmado. Verifique sua caixa de entrada, spam ou lixo eletrônico e clique no link de confirmação enviado pela Jornada Acadêmica de Medicina."
      );
    }

    redirectWithError(`Erro ao entrar: ${error.message}`);
  }

  const user = data.user;

  if (!user) {
    redirectWithError("Não foi possível localizar o usuário autenticado.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Erro ao buscar perfil depois do login:", {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code,
    });

    await supabase.auth.signOut();

    redirectWithError(
      "Login realizado, mas não foi possível localizar o perfil do usuário."
    );
  }

  if (!profile) {
    console.error("Usuário autenticado sem perfil em public.profiles:", {
      userId: user.id,
      email: user.email,
    });

    await supabase.auth.signOut();

    redirectWithError(
      "Usuário autenticado, mas sem perfil cadastrado no sistema."
    );
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();

    redirectWithError("Este usuário está inativo.");
  }

  if (profile.role === "admin" || profile.role === "super_admin") {
    redirect("/admin");
  }

  if (profile.role === "evaluator") {
    redirect("/avaliador");
  }

  if (profile.role === "student") {
    redirect("/aluno");
  }

  await supabase.auth.signOut();

  redirectWithError(
    `Perfil de usuário não reconhecido: ${profile.role}`
  );
}