"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  Home,
  ListChecks,
  Loader2,
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

function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending}
      className="w-full disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Saindo...
        </>
      ) : (
        <>
          <LogOut className="size-4" />
          Sair da conta
        </>
      )}
    </Button>
  );
}

export function AdminMobileMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setIsOpen((current) => !current)}
        className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isOpen}
        aria-controls="admin-mobile-menu"
      >
        {isOpen ? (
          <X className="size-5" />
        ) : (
          <Menu className="size-5" />
        )}
      </Button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-[#102a3d]/20"
            onClick={closeMenu}
          />

          <div
            id="admin-mobile-menu"
            className="fixed inset-x-4 top-24 z-50 overflow-hidden rounded-[1.75rem] border border-[#d9e8ef] bg-white shadow-xl shadow-[#102a3d]/10"
          >
            <div className="border-b border-[#d9e8ef] bg-[#f7fbfd] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#245b7a]">
                Administração
              </p>

              <p className="mt-1 text-sm leading-6 text-[#5f7d90]">
                Acesse submissões, avaliações, critérios, avaliadores e
                resultados.
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
                    aria-current={isActive ? "page" : undefined}
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
                <SignOutButton />
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}