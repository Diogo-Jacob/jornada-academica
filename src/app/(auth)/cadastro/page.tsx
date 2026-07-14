import Link from "next/link";
import {
  CheckCircle2,
  Lock,
  Mail,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { signUp } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
      <div className="h-2 bg-[#245b7a]" />

      <CardHeader className="space-y-4 border-b border-[#d9e8ef] bg-[#f7fbfd]">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]">
          <Stethoscope className="size-7" />
        </div>

        <div>
          <CardTitle className="text-2xl text-[#102a3d]">
            Cadastro de aluno
          </CardTitle>

          <CardDescription className="mt-2 leading-6 text-[#5f7d90]">
            Crie sua conta para realizar a submissão de trabalhos científicos na
            Jornada Acadêmica de Medicina.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {params.erro && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            {params.erro}
          </div>
        )}

        {params.sucesso && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
            {params.sucesso}
          </div>
        )}

        <form
          action={signUp}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label
              htmlFor="fullName"
              className="text-[#102a3d]"
            >
              Nome completo
            </Label>

            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7d90]" />

              <Input
                id="fullName"
                name="fullName"
                placeholder="Digite seu nome completo"
                autoComplete="name"
                className="h-11 border-[#d9e8ef] bg-white pl-9 focus-visible:ring-[#245b7a]/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-[#102a3d]"
            >
              E-mail
            </Label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7d90]" />

              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                className="h-11 border-[#d9e8ef] bg-white pl-9 focus-visible:ring-[#245b7a]/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-[#102a3d]"
            >
              Senha
            </Label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7d90]" />

              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Crie uma senha"
                autoComplete="new-password"
                className="h-11 border-[#d9e8ef] bg-white pl-9 focus-visible:ring-[#245b7a]/20"
                required
              />
            </div>

            <p className="text-xs leading-5 text-[#5f7d90]">
              Use uma senha com pelo menos 8 caracteres.
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="passwordConfirmation"
              className="text-[#102a3d]"
            >
              Confirmar senha
            </Label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7d90]" />

              <Input
                id="passwordConfirmation"
                name="passwordConfirmation"
                type="password"
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
                className="h-11 border-[#d9e8ef] bg-white pl-9 focus-visible:ring-[#245b7a]/20"
                required
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-[#d9e8ef] bg-[#eef7fa] p-4 text-sm text-[#5f7d90]">
            <input
              type="checkbox"
              name="acceptTerms"
              className="mt-1 size-4 accent-[#245b7a]"
              required
            />

            <span className="leading-6">
              Declaro que li e aceito os termos de uso, a política de
              privacidade e o regulamento da Jornada.
            </span>
          </label>

          <Button
            type="submit"
            className="h-11 w-full bg-[#245b7a] hover:bg-[#173f59]"
          >
            <CheckCircle2 />
            Criar conta
          </Button>

          <p className="text-center text-sm text-[#5f7d90]">
            Já possui uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-[#245b7a] underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}