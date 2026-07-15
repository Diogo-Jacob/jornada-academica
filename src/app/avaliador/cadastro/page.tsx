import Link from "next/link";
import {
  ClipboardCheck,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { registerEvaluator } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <main className="min-h-screen bg-[#f7fbfd] text-[#102a3d]">
      <section className="grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
        <div className="relative hidden overflow-hidden bg-[#102a3d] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute right-[-140px] top-[-140px] size-96 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
          <div className="absolute bottom-[-180px] left-[-140px] size-[28rem] rounded-full bg-[#245b7a]/60 blur-3xl" />

          <div className="relative">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <img
                src="/campgo-logo.png"
                alt="Logo CAMPGO"
                className="size-20 rounded-full object-contain drop-shadow-sm"
              />

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/80">
                  CAMPGO
                </p>

                <p className="text-lg font-semibold">
                  Jornada Acadêmica de Medicina
                </p>
              </div>
            </Link>
          </div>

          <div className="relative max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
              <Stethoscope className="size-4" />
              Comissão Científica
            </div>

            <h1 className="text-4xl font-bold tracking-tight">
              Cadastro de avaliador
            </h1>

            <p className="mt-5 text-lg leading-8 text-white/75">
              Espaço exclusivo para professores convidados pela Comissão
              Científica para avaliação dos trabalhos submetidos à Jornada
              Acadêmica de Medicina.
            </p>
          </div>

          <div className="relative rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-5 shrink-0 text-white/80" />

              <p className="text-sm leading-6 text-white/75">
                O cadastro deve ser realizado apenas por avaliadores convidados.
                Após criar sua conta, você poderá acessar os trabalhos
                atribuídos pela comissão.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-xl">
            <div className="mb-8 text-center lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-3"
              >
                <img
                  src="/campgo-logo.png"
                  alt="Logo CAMPGO"
                  className="size-16 rounded-full object-contain drop-shadow-sm"
                />

                <div className="text-left">
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b7a]">
                    CAMPGO
                  </p>

                  <p className="text-sm font-semibold text-[#102a3d]">
                    Jornada Acadêmica de Medicina
                  </p>
                </div>
              </Link>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
              <div className="border-b border-[#d9e8ef] bg-[#f7fbfd] p-6 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]">
                  <ClipboardCheck className="size-7" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-[#102a3d]">
                  Cadastro de avaliador
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
                  Jornada Acadêmica de Medicina — Comissão Científica
                </p>
              </div>

              <div className="p-6">
                {messages.erro && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                    {messages.erro}
                  </div>
                )}

                <div className="mb-5 rounded-3xl border border-[#d9e8ef] bg-[#eef7fa] p-5">
                  <p className="font-semibold text-[#102a3d]">
                    Formulário exclusivo para professores avaliadores
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
                    Utilize este cadastro apenas se você foi convidado pela
                    Comissão Científica da Jornada Acadêmica.
                  </p>
                </div>

                <form
                  action={registerEvaluator}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="fullName"
                      className="text-sm font-medium text-[#102a3d]"
                    >
                      Nome completo
                    </label>

                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7d90]" />

                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Digite seu nome completo"
                        className="h-11 border-[#d9e8ef] bg-white pl-9 focus-visible:ring-[#245b7a]/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-[#102a3d]"
                    >
                      E-mail
                    </label>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7d90]" />

                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        className="h-11 border-[#d9e8ef] bg-white pl-9 focus-visible:ring-[#245b7a]/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium text-[#102a3d]"
                      >
                        Senha
                      </label>

                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7d90]" />

                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Mínimo de 6 caracteres"
                          className="h-11 border-[#d9e8ef] bg-white pl-9 focus-visible:ring-[#245b7a]/20"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="passwordConfirmation"
                        className="text-sm font-medium text-[#102a3d]"
                      >
                        Confirmar senha
                      </label>

                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7d90]" />

                        <Input
                          id="passwordConfirmation"
                          name="passwordConfirmation"
                          type="password"
                          placeholder="Repita sua senha"
                          className="h-11 border-[#d9e8ef] bg-white pl-9 focus-visible:ring-[#245b7a]/20"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
                    <div className="space-y-2">
                      <label
                        htmlFor="registrationCode"
                        className="text-sm font-medium text-[#102a3d]"
                      >
                        Código de cadastro
                      </label>

                      <div className="relative">
                        <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7d90]" />

                        <Input
                          id="registrationCode"
                          name="registrationCode"
                          type="text"
                          placeholder="Informe o código recebido"
                          className="h-11 border-[#d9e8ef] bg-white pl-9 focus-visible:ring-[#245b7a]/20"
                          required
                        />
                      </div>

                      <p className="text-xs leading-5 text-[#5f7d90]">
                        Este código é fornecido pela Comissão Científica aos
                        avaliadores convidados.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full bg-[#245b7a] hover:bg-[#173f59]"
                    size="lg"
                  >
                    Criar conta de avaliador
                  </Button>

                  <div className="text-center text-sm text-[#5f7d90]">
                    Já possui uma conta?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-[#245b7a] underline-offset-4 hover:underline"
                    >
                      Entrar na plataforma
                    </Link>
                  </div>
                </form>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-[#5f7d90]">
              © 2026 CAMPGO — Jornada Acadêmica de Medicina.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}