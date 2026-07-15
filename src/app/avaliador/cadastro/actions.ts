"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

function redirectWithError(message: string): never {
  redirect(
    `/avaliador/cadastro?erro=${encodeURIComponent(message)}`
  );
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

  const { data: createdUser, error: createUserError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "evaluator",
      },
    });

  if (createUserError || !createdUser.user) {
    console.error("Erro ao criar usuário avaliador:", {
      message: createUserError?.message,
      status: createUserError?.status,
      name: createUserError?.name,
    });

    redirectWithError(
      "Não foi possível criar sua conta. Tente novamente."
    );
  }

  const { error: profileError } = await adminSupabase
    .from("profiles")
    .upsert(
      {
        id: createdUser.user.id,
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
      createdUser.user.id
    );

    redirectWithError(
      "A conta foi criada, mas não foi possível registrar o perfil de avaliador."
    );
  }

  redirect(
    `/login?sucesso=${encodeURIComponent(
      "Cadastro de avaliador criado com sucesso. Entre com seu e-mail e senha para acessar o painel."
    )}`
  );
}