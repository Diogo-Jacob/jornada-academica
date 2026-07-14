import Link from "next/link";
import {
  Lock,
  Mail,
  Stethoscope,
} from "lucide-react";
import { signIn } from "./actions";
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

type LoginPageProps = {
  searchParams: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
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
            Acessar plataforma
          </CardTitle>

          <CardDescription className="mt-2 leading-6 text-[#5f7d90]">
            Entre com seu e-mail e senha para acompanhar submissões, avaliações
            e resultados da Jornada Acadêmica de Medicina.
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
          action={signIn}
          className="space-y-5"
        >
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
            <div className="flex items-center justify-between gap-4">
              <Label
                htmlFor="password"
                className="text-[#102a3d]"
              >
                Senha
              </Label>

              <Link
                href="/auth/esqueci-senha"
                className="text-sm font-medium text-[#245b7a] underline-offset-4 hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7d90]" />

              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Digite sua senha"
                autoComplete="current-password"
                className="h-11 border-[#d9e8ef] bg-white pl-9 focus-visible:ring-[#245b7a]/20"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-[#245b7a] hover:bg-[#173f59]"
          >
            Entrar
          </Button>

          <p className="text-center text-sm text-[#5f7d90]">
            Ainda não possui uma conta?{" "}
            <Link
              href="/cadastro"
              className="font-medium text-[#245b7a] underline-offset-4 hover:underline"
            >
              Realizar cadastro
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}