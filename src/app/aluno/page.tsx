import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FileText,
  PlusCircle,
  Presentation,
  Stethoscope,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type Submission = {
  id: string;
  title: string;
  protocol: string | null;
  status: string;
  updated_at: string;
  submission_categories:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  events:
    | {
        submission_ends_at: string | null;
      }
    | {
        submission_ends_at: string | null;
      }[]
    | null;
};

function getCategoryName(submission: Submission) {
  const categoryValue = submission.submission_categories;

  const category = Array.isArray(categoryValue)
    ? categoryValue[0]
    : categoryValue;

  return category?.name ?? "Sem categoria";
}

function getEvent(submission: Submission) {
  const eventValue = submission.events;

  if (Array.isArray(eventValue)) {
    return eventValue[0] ?? null;
  }

  return eventValue;
}

function canShowFinalResult(submission: Submission) {
  const event = getEvent(submission);

  if (!event?.submission_ends_at) {
    return false;
  }

  return new Date() >= new Date(event.submission_ends_at);
}

function formatStudentStatus(
  status: string,
  canShowResult: boolean
) {
  if (
    !canShowResult &&
    [
      "selected_oral",
      "selected_banner",
      "not_selected",
    ].includes(status)
  ) {
    return "Avaliações concluídas";
  }

  const labels: Record<string, string> = {
    draft: "Rascunho",
    submitted: "Submetido",
    under_document_review: "Em conferência documental",
    correction_requested: "Correção solicitada",
    resubmitted: "Reenviado para conferência",
    approved_for_evaluation: "Aprovado para avaliação",
    under_evaluation: "Em avaliação",
    one_evaluation_completed: "Em avaliação",
    evaluations_completed: "Avaliações concluídas",
    third_evaluator_required: "Em avaliação",
    evaluator_replacement_required: "Em avaliação",
    pending_confirmation: "Avaliações concluídas",
    result_confirmed: "Resultado confirmado",
    selected_oral: "Selecionado para apresentação oral",
    selected_banner: "Selecionado para banner",
    not_selected: "Não selecionado",
  };

  return labels[status] ?? "Em avaliação";
}

function getStudentStatusClass(
  status: string,
  canShowResult: boolean
) {
  if (
    !canShowResult &&
    [
      "selected_oral",
      "selected_banner",
      "not_selected",
    ].includes(status)
  ) {
    return "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]";
  }

  const classes: Record<string, string> = {
    draft:
      "border-slate-300 bg-slate-50 text-slate-700",
    submitted:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    under_document_review:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    correction_requested:
      "border-amber-300 bg-amber-50 text-amber-800",
    resubmitted:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    approved_for_evaluation:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    under_evaluation:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    one_evaluation_completed:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    third_evaluator_required:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    evaluator_replacement_required:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    evaluations_completed:
      "border-green-300 bg-green-50 text-green-800",
    pending_confirmation:
      "border-green-300 bg-green-50 text-green-800",
    result_confirmed:
      "border-green-300 bg-green-50 text-green-800",
    selected_oral:
      "border-green-300 bg-green-50 text-green-800",
    selected_banner:
      "border-green-300 bg-green-50 text-green-800",
    not_selected:
      "border-red-300 bg-red-50 text-red-800",
  };

  return (
    classes[status] ??
    "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]"
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

export default async function AlunoPage() {
  const { profile, supabase } = await getCurrentUser();

  const { data: submissionsData, error: submissionsError } =
    await supabase
      .from("submissions")
      .select(`
        id,
        title,
        protocol,
        status,
        updated_at,

        submission_categories (
          name
        ),

        events (
          submission_ends_at
        )
      `)
      .eq("owner_user_id", profile.id)
      .order("updated_at", {
        ascending: false,
      });

  if (submissionsError) {
    console.error("Erro ao carregar trabalhos do aluno:", {
      userId: profile.id,
      message: submissionsError.message,
      details: submissionsError.details,
      hint: submissionsError.hint,
      code: submissionsError.code,
    });
  }

  const submissions =
    (submissionsData ?? []) as Submission[];

  const sentSubmissions = submissions.filter(
    (submission) => submission.status !== "draft"
  );

  const inEvaluationSubmissions = submissions.filter(
    (submission) =>
      [
        "approved_for_evaluation",
        "under_evaluation",
        "one_evaluation_completed",
        "evaluations_completed",
        "third_evaluator_required",
        "evaluator_replacement_required",
        "pending_confirmation",
        "result_confirmed",
        "selected_oral",
        "selected_banner",
        "not_selected",
      ].includes(submission.status)
  );

  const correctionSubmissions = submissions.filter(
    (submission) =>
      submission.status === "correction_requested"
  );

  const availableResults = submissions.filter(
    (submission) =>
      canShowFinalResult(submission) &&
      [
        "selected_oral",
        "selected_banner",
        "not_selected",
      ].includes(submission.status)
  );

  const latestSubmissions = submissions.slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#102a3d] p-8 text-white shadow-sm lg:p-10">
        <div className="absolute right-[-120px] top-[-120px] size-80 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] size-96 rounded-full bg-[#245b7a]/60 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
              <Stethoscope className="size-4" />
              Painel do aluno
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Olá, {profile.full_name}
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Acompanhe seus trabalhos científicos, confira pendências de
              correção e consulte os resultados da Jornada Acadêmica de
              Medicina.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="bg-white text-[#102a3d] hover:bg-[#e9f4f8]"
              >
                <Link href="/aluno/trabalhos/novo">
                  <PlusCircle className="size-4" />
                  Criar nova submissão
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/aluno/trabalhos">
                  Ver meus trabalhos
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-medium text-white/70">
              Resumo da sua participação
            </p>

            <div className="mt-5 grid gap-4">
              <HeroMetric
                label="Trabalhos cadastrados"
                value={submissions.length}
              />

              <HeroMetric
                label="Correções pendentes"
                value={correctionSubmissions.length}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<FileText className="size-5" />}
          title="Trabalhos enviados"
          value={sentSubmissions.length}
          description="Submissões que já saíram do rascunho."
        />

        <MetricCard
          icon={<ClipboardCheck className="size-5" />}
          title="Em avaliação"
          value={inEvaluationSubmissions.length}
          description="Trabalhos em análise pela comissão ou pareceristas."
        />

        <MetricCard
          icon={<Trophy className="size-5" />}
          title="Resultados disponíveis"
          value={availableResults.length}
          description="Resultados finais já liberados para consulta."
        />
      </section>

      {correctionSubmissions.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-amber-900">
                Você possui trabalho aguardando correção
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Revise as orientações da comissão científica, faça os ajustes
                necessários e reenvie dentro do prazo.
              </p>
            </div>

            <Button
              asChild
              className="bg-amber-700 hover:bg-amber-800"
            >
              <Link href="/aluno/trabalhos">
                Ver pendências
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#d9e8ef] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b7a]">
              Trabalhos científicos
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#102a3d]">
              Suas submissões recentes
            </h2>
          </div>

          {submissions.length > 0 && (
            <Button
              asChild
              className="bg-[#245b7a] hover:bg-[#173f59]"
            >
              <Link href="/aluno/trabalhos">
                Ver todos
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>

        <div className="p-6">
          {!submissions.length ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] px-6 py-14 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
                <FileText className="size-7" />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-[#102a3d]">
                Nenhum trabalho cadastrado
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#4a6678]">
                Quando as submissões estiverem abertas, você poderá cadastrar
                seus trabalhos científicos pela plataforma.
              </p>

              <Button
                className="mt-6 bg-[#245b7a] hover:bg-[#173f59]"
                asChild
              >
                <Link href="/aluno/trabalhos/novo">
                  <PlusCircle className="size-4" />
                  Criar nova submissão
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {latestSubmissions.map((submission) => {
                const showFinalResult =
                  canShowFinalResult(submission);

                return (
                  <div
                    key={submission.id}
                    className="group rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#b9d4df] hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getStudentStatusClass(
                              submission.status,
                              showFinalResult
                            )}`}
                          >
                            {formatStudentStatus(
                              submission.status,
                              showFinalResult
                            )}
                          </span>

                          {submission.protocol && (
                            <span className="rounded-full bg-white px-3 py-1 text-xs text-[#5f7d90]">
                              Protocolo: {submission.protocol}
                            </span>
                          )}
                        </div>

                        <p className="mt-3 line-clamp-2 font-semibold text-[#102a3d]">
                          {submission.title}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#5f7d90]">
                          <span>
                            {getCategoryName(submission)}
                          </span>

                          <span>
                            Atualizado em {formatDate(submission.updated_at)}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
                      >
                        <Link
                          href={`/aluno/trabalhos/${submission.id}`}
                        >
                          Abrir
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <InfoPanel
          icon={<Presentation className="size-5" />}
          title="Acompanhe o processo"
          description="Após a submissão, a comissão fará a conferência documental. Se houver pendência, você receberá orientação para correção."
        />

        <InfoPanel
          icon={<BarChart3 className="size-5" />}
          title="Resultados"
          description="Os resultados ficam disponíveis na plataforma após o encerramento do prazo previsto e a conclusão das avaliações."
        />
      </section>
    </div>
  );
}

type HeroMetricProps = {
  label: string;
  value: number;
};

function HeroMetric({
  label,
  value,
}: HeroMetricProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
      <span className="text-sm text-white/70">
        {label}
      </span>

      <span className="text-2xl font-bold">
        {value}
      </span>
    </div>
  );
}

type MetricCardProps = {
  icon: ReactNode;
  title: string;
  value: number;
  description: string;
};

function MetricCard({
  icon,
  title,
  value,
  description,
}: MetricCardProps) {
  return (
    <Card className="overflow-hidden border-[#d9e8ef] bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#5f7d90]">
              {title}
            </p>

            <p className="mt-3 text-4xl font-bold text-[#102a3d]">
              {value}
            </p>
          </div>

          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]">
            {icon}
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#5f7d90]">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

type InfoPanelProps = {
  icon: ReactNode;
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