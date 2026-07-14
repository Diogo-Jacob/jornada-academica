import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { AdminMobileMenu } from "./admin-mobile-menu";
import { AdminSidebar } from "./admin-sidebar";
import { signOutAdmin } from "./actions";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  const { profile } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/acesso-negado");
  }

  const roleLabel =
    profile.role === "super_admin"
      ? "Super administrador"
      : "Administrador";

  return (
    <div className="min-h-screen bg-[#f7fbfd] text-[#102a3d]">
      <header className="sticky top-0 z-40 border-b border-[#d9e8ef] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-3"
          >
            <img
              src="/campgo-logo.png"
              alt="Logo CAMPGO"
              className="size-12 shrink-0 rounded-full object-contain drop-shadow-sm sm:size-14 lg:hidden"
            />

            <div className="min-w-0 lg:hidden">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#245b7a]">
                CAMPGO
              </p>

              <p className="truncate text-sm font-semibold text-[#102a3d]">
                Painel administrativo
              </p>
            </div>
          </Link>

          <div className="hidden lg:block">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b7a]">
              Jornada Acadêmica de Medicina
            </p>

            <p className="mt-1 text-sm text-[#5f7d90]">
              Painel administrativo da Comissão Científica
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[#102a3d]">
                {profile.full_name}
              </p>

              <p className="text-xs text-[#5f7d90]">
                {roleLabel}
              </p>
            </div>

            <AdminMobileMenu />

            <form action={signOutAdmin}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="hidden border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa] sm:inline-flex"
              >
                <LogOut className="size-4" />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[288px_1fr] lg:px-8">
        <AdminSidebar />

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
            Área restrita administrativa.
          </p>
        </div>
      </footer>
    </div>
  );
}