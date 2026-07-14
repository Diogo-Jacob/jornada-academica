import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#f7fbfd] text-[#102a3d]">
      <section className="grid min-h-screen lg:grid-cols-[0.9fr_1fr]">
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
            <div className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
              Plataforma científica
            </div>

            <h1 className="text-4xl font-bold tracking-tight">
              Submissões, avaliações e resultados em um só lugar.
            </h1>

            <p className="mt-5 text-lg leading-8 text-white/75">
              Acesse sua área para acompanhar trabalhos científicos da Jornada
              Acadêmica de Medicina, seja como aluno, avaliador ou administrador.
            </p>
          </div>

          <div className="relative rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm leading-6 text-white/75">
              Ambiente restrito aos participantes autorizados da Jornada
              Acadêmica de Medicina.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-xl">
            <div className="mb-6 flex justify-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[#d9e8ef] bg-white px-4 py-2 text-sm font-medium text-[#245b7a] shadow-sm transition hover:bg-[#eef7fa]"
              >
                <ArrowLeft className="size-4" />
                Voltar para página do evento
              </Link>
            </div>

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

            {children}

            <p className="mt-6 text-center text-xs leading-5 text-[#5f7d90]">
              © 2026 CAMPGO — Jornada Acadêmica de Medicina.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}