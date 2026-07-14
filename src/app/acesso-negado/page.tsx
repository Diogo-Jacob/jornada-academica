import Link from "next/link";
import {
  Home,
  LogIn,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcessoNegadoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fbfd] px-4 py-10 text-[#102a3d]">
      <section className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <div className="relative overflow-hidden bg-[#102a3d] p-8 text-white sm:p-10">
          <div className="absolute right-[-120px] top-[-120px] size-80 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] size-96 rounded-full bg-[#245b7a]/60 blur-3xl" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
              <Stethoscope className="size-4" />
              Jornada Acadêmica de Medicina
            </div>

            <div className="flex size-16 items-center justify-center rounded-3xl bg-white/10 text-white">
              <ShieldAlert className="size-8" />
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Acesso não permitido
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Sua conta está autenticada, mas não possui permissão para acessar
              esta área da plataforma.
            </p>
          </div>
        </div>

        <div className="space-y-6 p-8 sm:p-10">
          <div className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
            <p className="text-sm leading-6 text-[#5f7d90]">
              Isso pode acontecer quando um aluno tenta acessar uma área
              administrativa, quando um avaliador tenta acessar a área do aluno
              ou quando uma conta ainda não possui o perfil correto configurado.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="bg-[#245b7a] hover:bg-[#173f59]"
            >
              <Link href="/">
                <Home className="size-4" />
                Página do evento
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
            >
              <Link href="/login">
                <LogIn className="size-4" />
                Entrar com outra conta
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}