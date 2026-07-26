"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

function redirectWithError(message: string): never {
  redirect(`/cadastro?erro=${encodeURIComponent(message)}`);
}

function redirectWithSuccess(message: string): never {
  redirect(`/cadastro?sucesso=${encodeURIComponent(message)}`);
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
    return "O sistema atingiu temporariamente o limite de envio de e-mails. Para o cadastro de aluno, tente novamente em alguns minutos ou contate a organização.";
  }

  if (
    normalizedMessage.includes("password") ||
    normalizedMessage.includes("weak")
  ) {
    return "A senha informada não atende aos critérios mínimos de segurança.";
  }

  return `Não foi possível criar a conta. Detalhe: ${message}`;
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  const passwordConfirmation = String(
    formData.get("passwordConfirmation") ?? ""
  );

  if (fullName.length < 3) {
    redirectWithError("Informe seu nome completo.");
  }

  if (!email || !email.includes("@")) {
    redirectWithError("Informe um endereço de e-mail válido.");
  }

  if (password.length < 8) {
    redirectWithError("A senha deve possuir pelo menos 8 caracteres.");
  }

  if (password !== passwordConfirmation) {
    redirectWithError("As senhas informadas não são iguais.");
  }
  
  const adminSupabase = createAdminClient();

  const { data: existingUsers, error: listUsersError } =
    await adminSupabase.auth.admin.listUsers();

  if (listUsersError) {
    console.error("Erro ao consultar usuários existentes:", {
      message: listUsersError.message,
      status: listUsersError.status,
      name: listUsersError.name,
    });

    redirectWithError(
      "Não foi possível verificar se o e-mail já possui cadastro. Tente novamente."
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

  const { data: createdUser, error: createUserError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "student",
      },
    });

  if (createUserError || !createdUser.user) {
    console.error("Erro ao criar conta de aluno:", {
      message: createUserError?.message,
      status: createUserError?.status,
      name: createUserError?.name,
    });

    redirectWithError(
      getFriendlyAuthError(
        createUserError?.message ??
          "Erro desconhecido ao criar usuário."
      )
    );
  }

  const { error: profileError } = await adminSupabase
    .from("profiles")
    .upsert(
      {
        id: createdUser.user.id,
        full_name: fullName,
        email,
        role: "student",
        is_active: true,
      },
      {
        onConflict: "id",
      }
    );

  if (profileError) {
    console.error("Erro ao criar perfil do aluno:", {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code,
    });

    await adminSupabase.auth.admin.deleteUser(
      createdUser.user.id
    );

    redirectWithError(
      "A conta foi criada, mas não foi possível registrar o perfil do aluno. Tente novamente."
    );
  }

  redirectWithSuccess(
    "Cadastro realizado com sucesso. Você já pode entrar na plataforma com seu e-mail e senha."
  );
}