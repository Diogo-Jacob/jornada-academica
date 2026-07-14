import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  const next =
    requestUrl.searchParams.get("next") ?? "/aluno";

  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(
        `${origin}${next}`
      );
    }

    console.error(
      "Erro ao trocar código de autenticação:",
      {
        message: error.message,
        status: error.status,
        name: error.name,
      }
    );
  }

  return NextResponse.redirect(
    `${origin}/login?erro=${encodeURIComponent(
      "Não foi possível validar o link de acesso. Solicite um novo link."
    )}`
  );
}