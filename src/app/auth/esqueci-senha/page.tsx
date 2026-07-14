import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Send,
  Stethoscope,
} from "lucide-react";
import { requestPasswordReset } from "./actions";
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
    <main className="min-h-screen bg-[#f7fbfd] text-[#102a3d]">
      <section className="grid min-h-screen lg:grid-cols-[0.9fr_1fr]">
        <div className="relative hidden overflow-hidden bg-[#102a3d] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute right-[-140px] top-[-140px] size-96 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
          <div className="absolute bottom-[-180px] left-[-140px] size-[28rem] rounded-full bg-[#245b7a]/60 blur-3xl" />

          <Link
            href="/"
            className="relative inline-flex items-center gap-3"
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

          <div className="relative max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
              <Stethoscope className="size-4" />
              Recuperação de acesso
            </div>

            <h1 className="text-4xl font-bold tracking-tight">
              Vamos te ajudar a recuperar sua senha.
            </h1>

            <p className="mt-5 text-lg leading-8 text-white/75">
              Informe o e-mail cadastrado para receber as instruções de
              redefinição de senha da plataforma.
            </p>
          </div>

          <div className="relative rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm leading-6 text-white/75">
              Por segurança, o link de recuperação deve ser utilizado apenas
              pelo titular da conta.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#245b7a] underline-offset-4 hover:underline"
              >
                <ArrowLeft className="size-4" />
                Voltar para o login
              </Link>
            </div>

            <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
              <div className="h-2 bg-[#245b7a]" />

              <CardHeader className="space-y-4 border-b border-[#d9e8ef] bg-[#f7fbfd] text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]">
                  <Stethoscope className="size-7" />
                </div>

                <div>
                  <CardTitle className="text-2xl text-[#102a3d]">
                    Recuperar senha
                  </CardTitle>

                  <CardDescription className="mt-2 leading-6 text-[#5f7d90]">
                    Informe seu e-mail para receber as instruções de recuperação
                    de acesso à plataforma.
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
                  action={requestPasswordReset}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-[#102a3d]"
                    >
                      E-mail cadastrado
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

                    <p className="text-xs leading-5 text-[#5f7d90]">
                      Enviaremos um link para redefinição da senha, caso o
                      e-mail esteja cadastrado na plataforma.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full bg-[#245b7a] hover:bg-[#173f59]"
                  >
                    <Send />
                    Enviar link de recuperação
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}