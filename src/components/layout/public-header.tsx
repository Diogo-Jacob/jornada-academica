import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Jornada Acadêmica
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Início
          </Link>

          <Link
            href="/programacao"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Programação
          </Link>

          <Link
            href="/documentos"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Documentos
          </Link>

          <Link
            href="/local"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Local
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>

          <Button asChild>
            <Link href="/cadastro">Cadastrar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}