"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  Home,
  ListChecks,
  UserPlus,
} from "lucide-react";

const items = [
  {
    href: "/admin",
    label: "Início",
    icon: Home,
    exact: true,
  },
  {
    href: "/admin/submissoes",
    label: "Submissões",
    icon: ClipboardCheck,
    exact: false,
  },
  {
    href: "/admin/avaliacoes",
    label: "Avaliações",
    icon: FileCheck2,
    exact: false,
  },
  {
    href: "/admin/avaliadores",
    label: "Avaliadores",
    icon: UserPlus,
    exact: false,
  },
  {
    href: "/admin/criterios",
    label: "Critérios",
    icon: ListChecks,
    exact: false,
  },
  {
    href: "/admin/resultados",
    label: "Resultados",
    icon: BarChart3,
    exact: false,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-[#d9e8ef] bg-white lg:block">
      <div className="border-b border-[#d9e8ef] px-6 py-5">
        <Link
          href="/admin"
          className="flex items-center gap-3"
        >
          <img
            src="/campgo-logo.png"
            alt="Logo CAMPGO"
            className="size-14 rounded-full object-contain drop-shadow-sm"
          />

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b7a]">
              CAMPGO
            </p>

            <p className="text-sm font-semibold leading-5 text-[#102a3d]">
              Jornada Acadêmica
            </p>

            <p className="text-xs text-[#5f7d90]">
              Painel administrativo
            </p>
          </div>
        </Link>
      </div>

      <div className="p-4">
        <div className="mb-4 rounded-2xl bg-[#eef7fa] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#245b7a]">
            Administração
          </p>

          <p className="mt-1 text-sm leading-5 text-[#5f7d90]">
            Gerencie submissões, avaliações e resultados da Jornada.
          </p>
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;

            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "flex items-center gap-3 rounded-2xl bg-[#245b7a] px-4 py-3 text-sm font-medium text-white shadow-sm transition"
                    : "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#5f7d90] transition hover:bg-[#eef7fa] hover:text-[#245b7a]"
                }
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}