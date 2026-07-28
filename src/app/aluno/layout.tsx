import Link from "next/link";
import { ReactNode } from "react";
import {
  FileText,
  Home,
  PlusCircle,
  UserRound,
} from "lucide-react";
import { redirect } from "next/navigation";
import { AlunoMobileMenu } from "./aluno-mobile-menu";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { CreatorCredit } from "@/components/creator-credit";

type AlunoLayoutProps = {
  children: ReactNode;
};

const navItems = [
  {
    href: "/aluno",
    label: "Início",
    icon: Home,
    exact: true,
  },
  {
    href: "/aluno/trabalhos",
    label: "Meus trabalhos",
    icon: FileText,
    exact: false,
  },
  {
    href: "/aluno/trabalhos/novo",
    label: "Nova submissão",
    icon: PlusCircle,
    exact: true,
  },
  {
    href: "/aluno/perfil",
    label: "Meu perfil",
    icon: UserRound,
    exact: true,
  },
];

export default async function AlunoLayout({
  children,
}: AlunoLayoutProps) {
  const { profile } = await getCurrentUser();

  if (!profile.is_active || profile.role !== "student") {
    redirect("/acesso-negado");
  }

  return (
    <div className="min-h-screen bg-[#f7fbfd] text-[#102a3d]">
      <header className="sticky top-0 z-40 border-b border-[#d9e8ef] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/aluno"
            className="flex min-w-0 items-center gap-3"
          >
            <img
              src="/campgo-logo.png"
              alt="Logo CAMPGO"
              className="size-12 shrink-0 rounded-full object-contain drop-shadow-sm sm:size-14"
            />

            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#245b7a] sm:text-base">
                CAMPGO
              </p>

              <p className="truncate text-sm font-semibold text-[#102a3d] sm:text-base">
                Jornada Acadêmica de Medicina
              </p>
            </div>
          </Link>

          <AlunoMobileMenu />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[288px_1fr] lg:px-8">
        <aside className="hidden h-fit rounded-[2rem] border border-[#d9e8ef] bg-white p-4 shadow-sm lg:block">
          <div className="mb-4 rounded-3xl bg-[#eef7fa] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#245b7a]">
              Navegação
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
              Acompanhe suas submissões e pendências.
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#245b7a] transition hover:bg-[#eef7fa]"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          {children}
        </section>
      </main>

      <footer className="border-t border-[#d9e8ef] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-center text-xs text-[#5f7d90] sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between md:text-left">
          <p>
            © 2026 CAMPGO — Jornada Acadêmica de Medicina.
          </p>

          <p>
            Área do aluno.
          </p>
        </div>

        <div className="border-t border-[#eef7fa] px-4 py-3 text-center text-[11px] leading-5 text-[#5f7d90]/75">
          <CreatorCredit />
        </div>
      </footer>
    </div>
  );
}