"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Home,
  Menu,
  PlusCircle,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
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

export function AlunoMobileMenu() {
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
              Navegação
            </p>

            <p className="mt-1 text-sm leading-6 text-[#5f7d90]">
              Acesse suas submissões e informações do perfil.
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
        </div>
      )}
    </div>
  );
}