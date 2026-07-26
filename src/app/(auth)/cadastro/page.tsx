import Link from "next/link";
import {
  CheckCircle2,
  Mail,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { signUp } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";

type CadastroPageProps = {
  searchParams: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

export default async function CadastroPage({
  searchParams,
}: CadastroPageProps) {
  const params = await searchParams;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#102a3d]/85 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="border-b border-white/10 bg-white/[0.04] p-7">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[#245b7a] text-[#d9e8ef]">
          <Stethoscope className="size-7" />
        </div>

        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#6fb6cf]">
          Cadastro de aluno
        </p>

        <h1 className="font-display mt-3 text-4xl font-bold leading-tight text-white">
          Crie sua conta
        </h1>

        <p className="mt-3 text-base leading-7 text-[#b9d4df]">
          Faça seu cadastro para acessar a plataforma e realizar a submissão de
          trabalhos científicos na Jornada Acadêmica de Medicina.
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
          action={signUp}
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
                placeholder="Crie uma senha"
                autoComplete="new-password"
                className="h-12 border-white/10 bg-[#07162a]/80 text-base text-white placeholder:text-[#8fb7cc]/70 focus-visible:ring-[#6fb6cf]/30"
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
                placeholder="Repita a senha"
                autoComplete="new-password"
                className="h-12 border-white/10 bg-[#07162a]/80 text-base text-white placeholder:text-[#8fb7cc]/70 focus-visible:ring-[#6fb6cf]/30"
                required
              />
            </div>
          </div>

          <p className="rounded-2xl border border-white/10 bg-[#07162a]/60 p-4 text-sm leading-6 text-[#b9d4df]">
            Use uma senha segura. Recomendamos pelo menos 8 caracteres.
          </p>
          
          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-[#6fb6cf] text-base font-bold text-[#07162a] shadow-lg shadow-[#6fb6cf]/20 hover:bg-[#8cc9dc]"
          >
            <CheckCircle2 className="size-4" />
            Criar conta
          </Button>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-[#b9d4df]">
              Já possui uma conta?{" "}
              <Link
                href="/login"
                className="font-bold text-[#6fb6cf] underline-offset-4 hover:underline"
              >
                Entrar
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}