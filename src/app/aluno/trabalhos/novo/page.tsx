import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  Lock,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { SubmissionInitialForm } from "./submission-initial-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type NovaSubmissaoPageProps = {
  searchParams: Promise<{
    erro?: string;
  }>;
};

type Event = {
  id: string;
  name: string;
  year: number;
  status: string;
  submission_starts_at: string | null;
  submission_ends_at: string | null;
};

function formatDateTime(date: string | null) {
  if (!date) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function getSubmissionPeriodStatus(event: Event | null) {
  if (!event) {
    return {
      isOpen: false,
      title: "Submissões indisponíveis",
      description:
        "Não existe uma edição pública disponível para novas submissões.",
    };
  }

  const now = new Date();

  if (
    event.submission_starts_at &&
    now < new Date(event.submission_starts_at)
  ) {
    return {
      isOpen: false,
      title: "O período de submissões ainda não iniciou",
      description: `As submissões estarão disponíveis a partir de ${formatDateTime(
        event.submission_starts_at
      )}.`,
    };
  }

  if (
    event.submission_ends_at &&
    now > new Date(event.submission_ends_at)
  ) {
    return {
      isOpen: false,
      title: "O período de submissões foi encerrado",
      description: `O prazo para novas submissões encerrou em ${formatDateTime(
        event.submission_ends_at
      )}.`,
    };
  }

  return {
    isOpen: true,
    title: "Submissões abertas",
    description: event.submission_ends_at
      ? `Você pode criar uma nova submissão até ${formatDateTime(
          event.submission_ends_at
        )}.`
      : "Você pode criar uma nova submissão para esta edição.",
  };
}

export default async function NovaSubmissaoPage({
  searchParams,
}: NovaSubmissaoPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(`
      id,
      name,
      year,
      status,
      submission_starts_at,
      submission_ends_at
    `)
    .in("status", [
      "published",
      "submissions_open",
    ])
    .eq("is_public", true)
    .order("year", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  const currentEvent = event as Event | null;

  const submissionPeriod =
    getSubmissionPeriodStatus(currentEvent);

  const { data: categories } =
    currentEvent && submissionPeriod.isOpen
      ? await supabase
          .from("submission_categories")
          .select("id, name, description")
          .eq("event_id", currentEvent.id)
          .eq("is_active", true)
          .order("display_order", {
            ascending: true,
          })
      : { data: [] };

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        className="-ml-3 text-[#245b7a] hover:bg-[#eef7fa] hover:text-[#173f59]"
        asChild
      >
        <Link href="/aluno/trabalhos">
          <ArrowLeft />
          Voltar para meus trabalhos
        </Link>
      </Button>

      <section className="relative overflow-hidden rounded-[2rem] bg-[#102a3d] p-8 text-white shadow-sm lg:p-10">
        <div className="absolute right-[-120px] top-[-120px] size-80 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] size-96 rounded-full bg-[#245b7a]/60 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
              <Stethoscope className="size-4" />
              Nova submissão
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dados iniciais do trabalho
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Crie o rascunho inicial da submissão, informe a categoria do
              trabalho, os aspectos éticos e a composição de autoria.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-medium text-white/70">
              Situação do período
            </p>

            <p className="mt-3 text-2xl font-bold">
              {submissionPeriod.title}
            </p>

            <p className="mt-3 text-sm leading-6 text-white/70">
              {submissionPeriod.description}
            </p>
          </div>
        </div>
      </section>

      {params.erro && (
        <div className="max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {params.erro}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <InfoPanel
          icon={<FileText className="size-5" />}
          title="Rascunho inicial"
          description="Nesta etapa, você cria a submissão para depois anexar autores e arquivos obrigatórios."
        />

        <InfoPanel
          icon={<ShieldCheck className="size-5" />}
          title="Aspectos éticos"
          description="Informe se o trabalho necessita de aprovação do Comitê de Ética em Pesquisa."
        />

        <InfoPanel
          icon={<ClipboardList className="size-5" />}
          title="Etapas seguintes"
          description="Após criar o rascunho, você poderá preencher autoria, arquivos e realizar o envio definitivo."
        />
      </section>

      <Card className="max-w-4xl overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
        <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
          <CardTitle className="flex items-center gap-2 text-[#102a3d]">
            <ClipboardList className="size-5 text-[#245b7a]" />
            Informações da submissão
          </CardTitle>

          <CardDescription className="text-[#5f7d90]">
            {currentEvent
              ? `${currentEvent.name} — ${currentEvent.year}`
              : "Nenhuma edição disponível no momento."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {currentEvent && (
            <div className="rounded-3xl border border-[#d9e8ef] bg-[#eef7fa] p-5">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#245b7a]">
                  <CalendarDays className="size-5" />
                </div>

                <div>
                  <p className="font-semibold text-[#102a3d]">
                    Período de submissões
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
                    Início:{" "}
                    {formatDateTime(
                      currentEvent.submission_starts_at
                    )}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#5f7d90]">
                    Encerramento:{" "}
                    {formatDateTime(
                      currentEvent.submission_ends_at
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!submissionPeriod.isOpen ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] px-6 py-14 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
                <Lock className="size-7" />
              </div>

              <p className="mt-5 text-xl font-semibold text-[#102a3d]">
                {submissionPeriod.title}
              </p>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#5f7d90]">
                {submissionPeriod.description}
              </p>
            </div>
          ) : !categories?.length ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] px-6 py-14 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
                <ClipboardList className="size-7" />
              </div>

              <p className="mt-5 text-xl font-semibold text-[#102a3d]">
                Categorias indisponíveis
              </p>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#5f7d90]">
                Nenhuma categoria ativa foi cadastrada para esta edição.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-[#d9e8ef] bg-white p-5">
              <SubmissionInitialForm
                categories={categories}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type InfoPanelProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function InfoPanel({
  icon,
  title,
  description,
}: InfoPanelProps) {
  return (
    <div className="rounded-3xl border border-[#d9e8ef] bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]">
          {icon}
        </div>

        <div>
          <h3 className="font-semibold text-[#102a3d]">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}