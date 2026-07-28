"use server";

import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

function redirectWithError(message: string): never {
  redirect(
    `/avaliador/cadastro?erro=${encodeURIComponent(message)}`
  );
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://www.ixjornadaacademica.com.br"
  );
}

function createPublicAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não foi configurada.");
  }

  if (!supabaseKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY não foi configurada."
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function getFriendlyAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("user already registered") ||
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already exists")
  ) {
    return "Já existe uma conta cadastrada com este e-mail.";
  }

  if (
    normalizedMessage.includes("email rate limit") ||
    normalizedMessage.includes("rate limit")
  ) {
    return "O sistema atingiu temporariamente o limite de envio de e-mails. Tente novamente em alguns minutos ou contate a organização.";
  }

  if (
    normalizedMessage.includes("password") ||
    normalizedMessage.includes("weak")
  ) {
    return "A senha informada não atende aos critérios mínimos de segurança.";
  }

  return `Não foi possível criar sua conta. Detalhe: ${message}`;
}

export async function registerEvaluator(formData: FormData) {
  const fullName = String(
    formData.get("fullName") ?? ""
  ).trim();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") ?? ""
  );

  const passwordConfirmation = String(
    formData.get("passwordConfirmation") ?? ""
  );

  const registrationCode = String(
    formData.get("registrationCode") ?? ""
  ).trim();

  const expectedCode =
    process.env.EVALUATOR_REGISTRATION_CODE;

  if (!expectedCode) {
    redirectWithError(
      "O código de cadastro de avaliadores não foi configurado. Entre em contato com a organização."
    );
  }

  if (registrationCode !== expectedCode) {
    redirectWithError(
      "Código de cadastro inválido. Confira o código recebido pela organização."
    );
  }

  if (fullName.length < 3) {
    redirectWithError("Informe seu nome completo.");
  }

  if (!email || !email.includes("@")) {
    redirectWithError("Informe um e-mail válido.");
  }

  if (password.length < 6) {
    redirectWithError(
      "A senha deve possuir pelo menos 6 caracteres."
    );
  }

  if (password !== passwordConfirmation) {
    redirectWithError(
      "As senhas informadas não são iguais."
    );
  }

  const adminSupabase = createAdminClient();

  const { data: existingUsers, error: listUsersError } =
    await adminSupabase.auth.admin.listUsers();

  if (listUsersError) {
    console.error("Erro ao consultar usuários Auth:", {
      message: listUsersError.message,
      status: listUsersError.status,
      name: listUsersError.name,
    });

    redirectWithError(
      "Não foi possível verificar se o e-mail já possui cadastro."
    );
  }

  const existingUser = existingUsers.users.find(
    (user) => user.email?.toLowerCase() === email
  );

  if (existingUser) {
    redirectWithError(
      "Já existe uma conta cadastrada com este e-mail."
    );
  }

  const publicSupabase = createPublicAuthClient();

  const emailRedirectTo = `${getSiteUrl()}/auth/confirm?next=/login`;

  const { data: signUpData, error: signUpError } =
    await publicSupabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName,
          role: "evaluator",
        },
      },
    });

  if (signUpError || !signUpData.user) {
    console.error("Erro ao criar usuário avaliador:", {
      message: signUpError?.message,
      status: signUpError?.status,
      name: signUpError?.name,
    });

    redirectWithError(
      getFriendlyAuthError(
        signUpError?.message ??
          "Erro desconhecido ao criar usuário avaliador."
      )
    );
  }

  const { error: profileError } = await adminSupabase
    .from("profiles")
    .upsert(
      {
        id: signUpData.user.id,
        full_name: fullName,
        email,
        role: "evaluator",
        is_active: true,
      },
      {
        onConflict: "id",
      }
    );

  if (profileError) {
    console.error("Erro ao criar perfil de avaliador:", {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code,
    });

    await adminSupabase.auth.admin.deleteUser(
      signUpData.user.id
    );

    redirectWithError(
      "A conta foi criada, mas não foi possível registrar o perfil de avaliador."
    );
  }

  redirect(
    `/login?sucesso=${encodeURIComponent(
      "Cadastro de avaliador realizado. Enviamos um link de confirmação para seu e-mail. Confirme sua conta antes de acessar o painel do avaliador."
    )}`
  );
}