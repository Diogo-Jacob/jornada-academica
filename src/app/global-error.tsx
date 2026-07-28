"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Home,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type GlobalErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function GlobalErrorPage({
  error,
  reset,
}: GlobalErrorPageProps) {
  console.error("Erro global capturado:", error);

  return (
    <html lang="pt-BR">
      <body>
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
                  <AlertTriangle className="size-8" />
                </div>

                <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                  Algo não saiu como esperado
                </h1>

                <p className="mt-4 max-w-2xl leading-7 text-white/75">
                  Ocorreu uma falha inesperada ao carregar a plataforma. Você
                  pode tentar novamente ou retornar para a página inicial do
                  evento.
                </p>
              </div>
            </div>

            <div className="space-y-6 p-8 sm:p-10">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm leading-6 text-amber-800">
                  Se o erro persistir, entre em contato com a organização da
                  Jornada Acadêmica de Medicina e informe em qual página o
                  problema ocorreu.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={reset}
                  className="bg-[#245b7a] hover:bg-[#173f59]"
                >
                  <RefreshCw className="size-4" />
                  Tentar novamente
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
                >
                  <Link href="/">
                    <Home className="size-4" />
                    Página do evento
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}