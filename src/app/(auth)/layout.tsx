import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <main className="campgo-grid-bg min-h-screen text-[#102a3d]">
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-xl">
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

          {children}

          <p className="mt-6 text-center text-xs leading-5 text-white/55">
            © 2026 CAMPGO — Jornada Acadêmica de Medicina.
          </p>
        </div>
      </div>
    </main>
  );
}