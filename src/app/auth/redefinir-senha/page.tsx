import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { UpdatePasswordForm } from "./update-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="campgo-grid-bg min-h-screen text-white">
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur transition hover:bg-white/15"
            >
              <ArrowLeft className="size-4" />
              Voltar para o login
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

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#102a3d]/85 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="border-b border-white/10 bg-white/[0.04] p-7">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[#245b7a] text-[#d9e8ef]">
                <KeyRound className="size-7" />
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#6fb6cf]">
                Segurança da conta
              </p>

              <h1 className="font-display mt-3 text-4xl font-bold leading-tight text-white">
                Redefinir senha
              </h1>

              <p className="mt-3 text-base leading-7 text-[#b9d4df]">
                Crie uma nova senha para acessar novamente sua área na
                plataforma da Jornada Acadêmica de Medicina.
              </p>
            </div>

            <div className="p-7">
              <UpdatePasswordForm />

              <div className="mt-6 rounded-2xl border border-white/10 bg-[#07162a]/60 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#6fb6cf]" />

                  <p className="text-sm leading-6 text-[#b9d4df]">
                    Por segurança, após redefinir a senha, você precisará
                    acessar novamente a plataforma com suas novas credenciais.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-white/55">
            © 2026 CAMPGO — Jornada Acadêmica de Medicina.
          </p>
        </div>
      </div>
    </main>
  );
}