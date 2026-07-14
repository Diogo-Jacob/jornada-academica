"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Invitation = {
  id: string;
  professor_name: string;
  email: string;
  status: string;
  expires_at: string;
};

function redirectWithError(
  token: string,
  message: string
): never {
  redirect(
    `/avaliador/convite/${token}?erro=${encodeURIComponent(
      message
    )}`
  );
}

export async function acceptEvaluatorInvitation(
  formData: FormData
) {
  const token = String(
    formData.get("token") ?? ""
  ).trim();

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

  if (!token) {
    redirect("/login");
  }

  if (fullName.length < 3) {
    redirectWithError(
      token,
      "Informe seu nome completo."
    );
  }

  if (!email || !email.includes("@")) {
    redirectWithError(
      token,
      "Informe um e-mail válido."
    );
  }

  if (password.length < 6) {
    redirectWithError(
      token,
      "A senha deve possuir pelo menos 6 caracteres."
    );
  }

  if (password !== passwordConfirmation) {
    redirectWithError(
      token,
      "As senhas informadas não são iguais."
    );
  }

  const supabase = await createClient();

  const { data, error: invitationError } =
    await supabase
      .rpc("get_evaluator_invitation_by_token", {
        invitation_token: token,
      })
      .maybeSingle();

  const invitation = data as Invitation | null;

  if (invitationError || !invitation) {
    redirectWithError(
      token,
      "Convite não encontrado."
    );
  }

  if (invitation.status !== "pending") {
    redirectWithError(
      token,
      "Este convite não está disponível para cadastro."
    );
  }

  if (
    new Date(invitation.expires_at) < new Date()
  ) {
    redirectWithError(
      token,
      "Este convite expirou."
    );
  }

  if (
    invitation.email.trim().toLowerCase() !== email
  ) {
    redirectWithError(
      token,
      "O e-mail informado não corresponde ao e-mail convidado."
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
      token,
      "Não foi possível verificar se o e-mail já possui cadastro."
    );
  }

  const existingUser = existingUsers.users.find(
    (user) => user.email?.toLowerCase() === email
  );

  if (existingUser) {
    redirectWithError(
      token,
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
      token,
      "Não foi possível criar sua conta. Tente novamente."
    );
  }

  const { error: acceptError } = await supabase.rpc(
    "accept_evaluator_invitation",
    {
      invitation_token: token,
      evaluator_user_id: createdUser.user.id,
      evaluator_full_name: fullName,
      evaluator_email: email,
    }
  );

  if (acceptError) {
    console.error("Erro ao aceitar convite:", {
      message: acceptError.message,
      details: acceptError.details,
      hint: acceptError.hint,
      code: acceptError.code,
    });

    await adminSupabase.auth.admin.deleteUser(
      createdUser.user.id
    );

    redirectWithError(
      token,
      acceptError.message ||
        "Não foi possível concluir o cadastro."
    );
  }

  redirect(
    `/login?sucesso=${encodeURIComponent(
      "Cadastro de avaliador criado com sucesso. Entre com seu e-mail e senha para acessar o painel."
    )}`
  );
}