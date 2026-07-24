"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LogIn,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PublicSiteHeaderProps = {
  editalDisponivel: boolean;
  editalUrl: string;
};

const navItems = [
  {
    href: "#evento",
    label: "O evento",
  },
  {
    href: "#comissao",
    label: "Comissão",
  },
  {
    href: "#cronograma",
    label: "Cronograma",
  },
  {
    href: "#palestrantes",
    label: "Palestrantes",
  },
  {
    href: "#local",
    label: "Local",
  },
  {
    href: "#edital",
    label: "Edital",
  },
  {
    href: "#patrocinadores",
    label: "Apoiadores",
  },
];

export function PublicSiteHeader({
  editalDisponivel,
  editalUrl,
}: PublicSiteHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 40);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header
      className={
        isScrolled
          ? "fixed left-0 right-0 top-0 z-50 border-b border-[#d9e8ef]/80 bg-white/90 shadow-sm backdrop-blur-xl transition-all duration-300"
          : "fixed left-0 right-0 top-0 z-50 border-b border-[#d9e8ef] bg-white/95 backdrop-blur transition-all duration-300"
      }
    >
      <div
        className={
          isScrolled
            ? "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 transition-all duration-300 sm:px-6 lg:px-8"
            : "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 transition-all duration-300 sm:px-6 lg:px-8"
        }
      >
        <Link
          href="/"
          onClick={closeMenu}
          className="flex min-w-0 items-center gap-3"
        >
          <img
            src="/campgo-logo.png"
            alt="Logo CAMPGO"
            className={
              isScrolled
                ? "size-12 shrink-0 rounded-full object-contain drop-shadow-sm transition-all duration-300 sm:size-14"
                : "size-14 shrink-0 rounded-full object-contain drop-shadow-md transition-all duration-300 sm:size-20"
            }
          />

          <div className="min-w-0">
            <p
              className={
                isScrolled
                  ? "text-sm font-bold uppercase tracking-[0.28em] text-[#245b7a] transition-all duration-300 sm:text-base"
                  : "text-base font-bold uppercase tracking-[0.35em] text-[#245b7a] transition-all duration-300 sm:text-lg"
              }
            >
              CAMPGO
            </p>

            <p
              className={
                isScrolled
                  ? "hidden text-xs font-medium text-[#102a3d] transition-all duration-300 sm:block"
                  : "truncate text-xs font-medium text-[#102a3d] transition-all duration-300 sm:text-sm"
              }
            >
              Jornada Acadêmica de Medicina
            </p>
          </div>
        </Link>

        <nav
          className={
            isScrolled
              ? "hidden items-center gap-5 text-xs font-medium text-[#24485e] transition-all duration-300 lg:flex"
              : "hidden items-center gap-6 text-sm font-medium text-[#24485e] transition-all duration-300 lg:flex"
          }
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[#245b7a]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            asChild
            size={isScrolled ? "sm" : "default"}
            className="bg-[#245b7a] transition-all duration-300 hover:bg-[#173f59]"
          >
            <Link href="/login">
              <LogIn className="size-4" />
              Entrar
            </Link>
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa] lg:hidden"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMenuOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-x-4 top-24 z-50 overflow-hidden rounded-[1.75rem] border border-[#d9e8ef] bg-white shadow-xl shadow-[#102a3d]/10 lg:hidden">
          <div className="border-b border-[#d9e8ef] bg-[#f7fbfd] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#245b7a]">
              Navegação
            </p>

            <p className="mt-1 text-sm leading-6 text-[#5f7d90]">
              Acesse as informações principais da Jornada Acadêmica de Medicina.
            </p>
          </div>

          <nav className="space-y-1 p-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-[#245b7a] transition hover:bg-[#eef7fa]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="border-t border-[#d9e8ef] bg-[#f7fbfd] p-4">
            <Button
              asChild
              className="w-full bg-[#245b7a] hover:bg-[#173f59]"
            >
              <Link
                href="/login"
                onClick={closeMenu}
              >
                <LogIn className="size-4" />
                Entrar
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}