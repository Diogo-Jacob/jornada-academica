import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border bg-background px-4 py-2 text-sm font-medium">
              Jornada Acadêmica de Medicina 2026
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Conhecimento, pesquisa e inovação em um único evento
              </h1>

              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Acompanhe a programação, consulte informações do evento e
                participe do processo de submissão e avaliação de trabalhos
                científicos.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/cadastro">
                  Realizar cadastro
                  <ArrowRight />
                </Link>
              </Button>

              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Acessar plataforma</Link>
              </Button>
            </div>

            <div className="flex flex-col gap-4 pt-3 text-sm text-muted-foreground sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5" />
                <span>Data a definir</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="size-5" />
                <span>Univille — Joinville/SC</span>
              </div>
            </div>
          </div>

          <div className="flex min-h-[360px] items-center justify-center rounded-3xl border bg-background p-8 shadow-sm">
            <div className="max-w-sm space-y-4 text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                JAM
              </div>

              <h2 className="text-2xl font-semibold">
                Jornada Acadêmica de Medicina
              </h2>

              <p className="text-muted-foreground">
                Em breve, todas as informações da edição de 2026 estarão
                disponíveis nesta plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Plataforma do evento
          </p>

          <h2 className="text-3xl font-bold tracking-tight">
            Tudo o que você precisa em um só lugar
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border p-6">
            <h3 className="mb-2 text-lg font-semibold">Programação</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Consulte palestras, atividades, horários e informações
              importantes da Jornada.
            </p>
          </article>

          <article className="rounded-2xl border p-6">
            <h3 className="mb-2 text-lg font-semibold">
              Submissão de trabalhos
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Envie trabalhos científicos e acompanhe todas as etapas da
              submissão.
            </p>
          </article>

          <article className="rounded-2xl border p-6">
            <h3 className="mb-2 text-lg font-semibold">
              Avaliação científica
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Processo organizado, anônimo e realizado por dois professores
              avaliadores.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}