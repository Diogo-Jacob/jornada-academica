import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { UpdatePasswordForm } from "./update-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPasswordPage() {
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
              Segurança da conta
            </div>

            <h1 className="text-4xl font-bold tracking-tight">
              Crie uma nova senha para sua conta.
            </h1>

            <p className="mt-5 text-lg leading-8 text-white/75">
              Após redefinir a senha, você poderá acessar novamente a plataforma
              com suas novas credenciais.
            </p>
          </div>

          <div className="relative rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm leading-6 text-white/75">
              Use uma senha segura e não compartilhe suas credenciais de acesso.
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
                  <KeyRound className="size-7" />
                </div>

                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#b9d4df] bg-white px-3 py-1 text-xs font-medium text-[#245b7a]">
                    <Stethoscope className="size-3.5" />
                    Jornada Acadêmica de Medicina
                  </div>

                  <CardTitle className="text-2xl text-[#102a3d]">
                    Redefinir senha
                  </CardTitle>

                  <CardDescription className="mt-2 leading-6 text-[#5f7d90]">
                    Crie uma nova senha para acessar sua área na plataforma.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <UpdatePasswordForm />

                <div className="mt-6 rounded-2xl border border-[#d9e8ef] bg-[#eef7fa] p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#245b7a]" />

                    <p className="text-sm leading-6 text-[#5f7d90]">
                      Por segurança, após redefinir a senha, você precisará
                      acessar novamente a plataforma com suas novas credenciais.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}