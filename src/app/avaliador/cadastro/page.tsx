import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { registerEvaluator } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";

type AvaliadorCadastroPageProps = {
  searchParams: Promise<{
    erro?: string;
  }>;
};

export default async function AvaliadorCadastroPage({
  searchParams,
}: AvaliadorCadastroPageProps) {
  const messages = await searchParams;

  return (
    <main className="campgo-grid-bg min-h-screen text-white">
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl">
          <div className="mb-6 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur transition hover:bg-white/15"
            >
              <ArrowLeft className="size-4" />
              Voltar para página do evento
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
                <ClipboardCheck className="size-7" />
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#6fb6cf]">
                Comissão Científica
              </p>

              <h1 className="font-display mt-3 text-4xl font-bold leading-tight text-white">
                Cadastro de avaliador
              </h1>

              <p className="mt-3 text-base leading-7 text-[#b9d4df]">
                Espaço exclusivo para professores convidados pela Comissão
                Científica para avaliação dos trabalhos submetidos à Jornada
                Acadêmica de Medicina.
              </p>
            </div>

            <div className="p-7">
              {messages.erro && (
                <div className="mb-5 rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
                  {messages.erro}
                </div>
              )}

              <div className="mb-5 rounded-3xl border border-white/10 bg-[#07162a]/60 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 size-5 shrink-0 text-[#6fb6cf]" />

                  <div>
                    <p className="font-semibold text-white">
                      Formulário exclusivo para avaliadores convidados
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#b9d4df]">
                      Utilize este cadastro apenas se você recebeu o código da
                      Comissão Científica da Jornada Acadêmica de Medicina.
                    </p>
                  </div>
                </div>
              </div>

              <form
                action={registerEvaluator}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="fullName"
                    className="text-sm font-bold uppercase tracking-[0.16em] text-[#8fb7cc]"
                  >
                    Nome completo
                  </label>

                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6fb6cf]" />

                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Digite seu nome completo"
                      autoComplete="name"
                      className="h-12 border-white/10 bg-[#07162a]/80 pl-10 text-base text-white placeholder:text-[#8fb7cc]/70 focus-visible:ring-[#6fb6cf]/30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-bold uppercase tracking-[0.16em] text-[#8fb7cc]"
                  >
                    E-mail
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
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-bold uppercase tracking-[0.16em] text-[#8fb7cc]"
                    >
                      Senha
                    </label>

                    <PasswordInput
                      id="password"
                      name="password"
                      placeholder="Mínimo de 6 caracteres"
                      autoComplete="new-password"
                      className="h-12 border-white/10 bg-[#07162a]/80 text-base text-white placeholder:text-[#8fb7cc]/70 focus-visible:ring-[#6fb6cf]/30"
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="passwordConfirmation"
                      className="text-sm font-bold uppercase tracking-[0.16em] text-[#8fb7cc]"
                    >
                      Confirmar senha
                    </label>

                    <PasswordInput
                      id="passwordConfirmation"
                      name="passwordConfirmation"
                      placeholder="Repita sua senha"
                      autoComplete="new-password"
                      className="h-12 border-white/10 bg-[#07162a]/80 text-base text-white placeholder:text-[#8fb7cc]/70 focus-visible:ring-[#6fb6cf]/30"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="registrationCode"
                      className="text-sm font-bold uppercase tracking-[0.16em] text-[#8fb7cc]"
                    >
                      Código de cadastro
                    </label>

                    <div className="relative">
                      <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6fb6cf]" />

                      <Input
                        id="registrationCode"
                        name="registrationCode"
                        type="text"
                        placeholder="Informe o código recebido"
                        className="h-12 border-white/10 bg-[#07162a]/80 pl-10 text-base text-white placeholder:text-[#8fb7cc]/70 focus-visible:ring-[#6fb6cf]/30"
                        required
                      />
                    </div>

                    <p className="text-sm leading-6 text-[#b9d4df]">
                      Este código é fornecido pela Comissão Científica aos
                      avaliadores convidados.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#6fb6cf] text-base font-bold text-[#07162a] shadow-lg shadow-[#6fb6cf]/20 hover:bg-[#8cc9dc]"
                  size="lg"
                >
                  Criar conta de avaliador
                </Button>

                <div className="border-t border-white/10 pt-6 text-center text-sm text-[#b9d4df]">
                  Já possui uma conta?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-[#6fb6cf] underline-offset-4 hover:underline"
                  >
                    Entrar na plataforma
                  </Link>
                </div>
              </form>
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