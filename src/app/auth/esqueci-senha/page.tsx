import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Send,
  Stethoscope,
} from "lucide-react";
import { requestPasswordReset } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RecuperarSenhaPageProps = {
  searchParams: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

export default async function RecuperarSenhaPage({
  searchParams,
}: RecuperarSenhaPageProps) {
  const params = await searchParams;

  return (
    <main className="campgo-grid-bg min-h-screen text-white">
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur transition hover:bg-white/15"
            >
              <ArrowLeft className="size-4" />
              Voltar para o login
            </Link>
          </div>

          <div className="mb-8 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-3 backdrop-blur"
            >
              <img
                src="/campgo-logo.png"
                alt="Logo CAMPGO"
                className="size-14 rounded-full object-contain drop-shadow-sm"
              />

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#d9e8ef]">
                  CAMPGO
                </p>

                <p className="text-sm font-semibold text-white">
                  Jornada Acadêmica de Medicina
                </p>
              </div>
            </Link>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#102a3d]/85 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="border-b border-white/10 bg-white/[0.04] p-7">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[#245b7a] text-[#d9e8ef]">
                <Stethoscope className="size-7" />
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#6fb6cf]">
                Recuperação de acesso
              </p>

              <h1 className="font-display mt-3 text-4xl font-bold leading-tight text-white">
                Recuperar senha
              </h1>

              <p className="mt-3 text-base leading-7 text-[#b9d4df]">
                Informe o e-mail cadastrado para receber as instruções de
                redefinição de senha da plataforma.
              </p>
            </div>

            <div className="p-7">
              {params.erro && (
                <div className="mb-5 rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
                  {params.erro}
                </div>
              )}

              {params.sucesso && (
                <div className="mb-5 rounded-2xl border border-green-300/30 bg-green-500/10 p-4 text-sm leading-6 text-green-100">
                  {params.sucesso}
                </div>
              )}

              <form
                action={requestPasswordReset}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-bold uppercase tracking-[0.16em] text-[#8fb7cc]"
                  >
                    E-mail cadastrado
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6fb6cf]" />

                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      autoComplete="email"
                      className="h-12 border-white/10 bg-[#07162a]/80 pl-10 text-base text-white placeholder:text-[#8fb7cc]/70 focus-visible:ring-[#6fb6cf]/30"
                      required
                    />
                  </div>

                  <p className="rounded-2xl border border-white/10 bg-[#07162a]/60 p-4 text-sm leading-6 text-[#b9d4df]">
                    Enviaremos um link para redefinição da senha, caso o e-mail
                    esteja cadastrado na plataforma.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#6fb6cf] text-base font-bold text-[#07162a] shadow-lg shadow-[#6fb6cf]/20 hover:bg-[#8cc9dc]"
                >
                  <Send className="size-4" />
                  Enviar link de recuperação
                </Button>
              </form>

              <div className="mt-7 border-t border-white/10 pt-6 text-center">
                <p className="text-sm text-[#b9d4df]">
                  Lembrou sua senha?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-[#6fb6cf] underline-offset-4 hover:underline"
                  >
                    Entrar na plataforma
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-white/55">
            © 2026 CAMPGO — Jornada Acadêmica de Medicina.
          </p>
        </div>
      </div>
    </main>
  );
}