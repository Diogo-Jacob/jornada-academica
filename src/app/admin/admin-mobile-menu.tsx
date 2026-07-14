"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  Home,
  ListChecks,
  LogOut,
  Menu,
  UserPlus,
  X,
} from "lucide-react";
import { signOutAdmin } from "./actions";
import { Button } from "@/components/ui/button";

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

export function AdminMobileMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setIsOpen((current) => !current)}
        className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isOpen ? (
          <X className="size-5" />
        ) : (
          <Menu className="size-5" />
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-x-4 top-24 z-50 overflow-hidden rounded-[1.75rem] border border-[#d9e8ef] bg-white shadow-xl shadow-[#102a3d]/10">
          <div className="border-b border-[#d9e8ef] bg-[#f7fbfd] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#245b7a]">
              Administração
            </p>

            <p className="mt-1 text-sm leading-6 text-[#5f7d90]">
              Acesse submissões, avaliações, critérios, avaliadores e resultados.
            </p>
          </div>

          <nav className="space-y-1 p-3">
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
                  onClick={closeMenu}
                  className={
                    isActive
                      ? "flex items-center gap-3 rounded-2xl bg-[#245b7a] px-4 py-3 text-sm font-medium text-white"
                      : "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#245b7a] transition hover:bg-[#eef7fa]"
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[#d9e8ef] bg-[#f7fbfd] p-4">
            <form action={signOutAdmin}>
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
              >
                <LogOut className="size-4" />
                Sair da conta
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}