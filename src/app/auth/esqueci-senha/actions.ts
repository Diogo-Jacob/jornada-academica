"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function redirectWithMessage({
  type,
  message,
}: {
  type: "erro" | "sucesso";
  message: string;
}): never {
  redirect(
    `/auth/esqueci-senha?${type}=${encodeURIComponent(message)}`
  );
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    redirectWithMessage({
      type: "erro",
      message: "Informe um e-mail válido.",
    });
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  const protocol =
    process.env.NODE_ENV === "development"
      ? "http"
      : "https";

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${protocol}://${host}`;

  const redirectTo = `${baseUrl}/auth/callback?next=/auth/redefinir-senha`;

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    {
      redirectTo,
    }
  );

  if (error) {
    console.error("Erro ao solicitar recuperação de senha:", {
      message: error.message,
      status: error.status,
      name: error.name,
    });

    if (error.status === 429) {
      redirectWithMessage({
        type: "erro",
        message:
          "Muitas tentativas em sequência. Aguarde alguns minutos antes de solicitar um novo link.",
      });
    }

    if (
      error.message
        .toLowerCase()
        .includes("email rate limit")
    ) {
      redirectWithMessage({
        type: "erro",
        message:
          "O limite de envio de e-mails foi atingido temporariamente. Aguarde alguns minutos e tente novamente.",
      });
    }

    redirectWithMessage({
      type: "erro",
      message: `Não foi possível enviar o e-mail de recuperação. Detalhe: ${error.message}`,
    });
  }

  redirectWithMessage({
    type: "sucesso",
    message:
      "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Use apenas o e-mail mais recente recebido.",
  });
}