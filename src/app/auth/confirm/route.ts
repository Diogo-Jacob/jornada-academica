import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") ?? "/login";

  const origin = requestUrl.origin;

  if (tokenHash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(
        `${origin}${next}?sucesso=${encodeURIComponent(
          "E-mail confirmado com sucesso. Agora você já pode acessar sua conta."
        )}`
      );
    }

    console.error("Erro ao confirmar e-mail:", {
      message: error.message,
      status: error.status,
      name: error.name,
    });
  }

  return NextResponse.redirect(
    `${origin}/login?erro=${encodeURIComponent(
      "Link de confirmação inválido ou expirado. Solicite um novo cadastro ou um novo link."
    )}`
  );
}