import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ClipboardCheck,
  Eye,
  FileSearch,
  LogOut,
  Stethoscope,
} from "lucide-react";
import { signOutEvaluator } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { CreatorCredit } from "@/components/creator-credit";
import { formatDateTimeBR } from "@/lib/formatters/date";

type Assignment = {
  id: string;
  status: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  submission_id: string;
};

type Submission = {
  id: string;
  title: string;
  protocol: string | null;
  status: string;
  submission_categories:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

function formatAssignmentStatus(status: string) {
  const labels: Record<string, string> = {
    assigned: "Atribuído",
    in_progress: "Em andamento",
    completed: "Concluído",
    declined: "Recusado",
    cancelled: "Cancelado",
  };

  return labels[status] ?? status;
}

function getAssignmentStatusClass(status: string) {
  const classes: Record<string, string> = {
    assigned:
      "border-red-300 bg-red-50 text-red-800",
    in_progress:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    completed:
      "border-green-300 bg-green-50 text-green-800",
    declined:
      "border-slate-300 bg-slate-50 text-slate-700",
    cancelled:
      "border-slate-300 bg-slate-50 text-slate-700",
  };

  return (
    classes[status] ??
    "border-[#d9e8ef] bg-white text-[#102a3d]"
  );
}

export default async function AvaliadorPage() {
  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    profile.role !== "evaluator"
  ) {
    redirect("/acesso-negado");
  }

  const { data: assignmentsData, error: assignmentsError } =
    await supabase
      .from("evaluation_assignments")
      .select(`
        id,
        status,
        assigned_at,
        started_at,
        completed_at,
        submission_id
      `)
      .eq("evaluator_id", profile.id)
      .in("status", [
        "assigned",
        "in_progress",
        "completed",
        "declined",
        "cancelled",
      ])
      .order("assigned_at", {
        ascending: false,
      });

  if (assignmentsError) {
    console.error(
      "Erro ao carregar atribuições do avaliador:",
      {
        message: assignmentsError.message,
        details: assignmentsError.details,
        hint: assignmentsError.hint,
        code: assignmentsError.code,
      }
    );
  }

  const assignments =
    (assignmentsData ?? []) as Assignment[];

  const submissionIds = assignments.map(
    (assignment) => assignment.submission_id
  );

  let submissions: Submission[] = [];

  if (submissionIds.length > 0) {
    const { data: submissionsData, error: submissionsError } =
      await supabase
        .from("submissions")
        .select(`
          id,
          title,
          protocol,
          status,

          submission_categories (
            name
          )
        `)
        .in("id", submissionIds);

    if (submissionsError) {
      console.error(
        "Erro ao carregar submissões atribuídas:",
        {
          message: submissionsError.message,
          details: submissionsError.details,
          hint: submissionsError.hint,
          code: submissionsError.code,
        }
      );
    }

    submissions = (submissionsData ?? []) as Submission[];
  }

  const submissionMap = new Map(
    submissions.map((submission) => [
      submission.id,
      submission,
    ])
  );

  const total = assignments.length;

  const pending = assignments.filter(
    (assignment) => assignment.status === "assigned"
  ).length;

  const inProgress = assignments.filter(
    (assignment) => assignment.status === "in_progress"
  ).length;

  const completed = assignments.filter(
    (assignment) => assignment.status === "completed"
  ).length;

  return (
    <div className="min-h-screen bg-[#f7fbfd] text-[#102a3d]">
      <header className="sticky top-0 z-40 border-b border-[#d9e8ef] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/avaliador"
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

              <p className="text-sm font-semibold text-[#102a3d]">
                Jornada Acadêmica de Medicina
              </p>

              <p className="hidden text-xs text-[#5f7d90] sm:block">
                Área do avaliador
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[#102a3d]">
                {profile.full_name}
              </p>

              <p className="text-xs text-[#5f7d90]">
                Avaliador
              </p>
            </div>

            <form action={signOutEvaluator}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
              >
                <LogOut className="size-4" />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#102a3d] p-8 text-white shadow-sm lg:p-10">
          <div className="absolute right-[-120px] top-[-120px] size-80 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] size-96 rounded-full bg-[#245b7a]/60 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
                <Stethoscope className="size-4" />
                Painel do avaliador
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Minhas avaliações
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-white/75">
                Consulte os trabalhos atribuídos, acesse os arquivos
                e registre sua avaliação científica conforme os
                critérios da Comissão Científica.
              </p>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-medium text-white/70">
                Resumo das avaliações
              </p>

              <div className="mt-5 grid gap-4">
                <HeroMetric
                  label="Total atribuído"
                  value={total}
                />

                <HeroMetric
                  label="Pendentes"
                  value={pending}
                />

                <HeroMetric
                  label="Concluídas"
                  value={completed}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total atribuído"
            value={total}
            description="Todos os trabalhos distribuídos para você."
          />

          <SummaryCard
            label="Pendentes"
            value={pending}
            description="Avaliações ainda não iniciadas."
          />

          <SummaryCard
            label="Em andamento"
            value={inProgress}
            description="Avaliações iniciadas e ainda não concluídas."
          />

          <SummaryCard
            label="Concluídas"
            value={completed}
            description="Avaliações finalizadas e registradas."
          />
        </section>

        <section className="rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#d9e8ef] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b7a]">
                Avaliações
              </p>

              <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#102a3d]">
                <ClipboardCheck className="size-6 text-[#245b7a]" />
                Trabalhos atribuídos
              </h2>
            </div>
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="p-6">
              {!assignments.length ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] px-6 py-14 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
                    <FileSearch className="size-7" />
                  </div>

                  <h2 className="mt-5 text-xl font-semibold text-[#102a3d]">
                    Nenhuma avaliação atribuída
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-[#5f7d90]">
                    Quando a Comissão Científica distribuir trabalhos para
                    você, eles aparecerão nesta página.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const submission =
                      submissionMap.get(assignment.submission_id);

                    const categoryValue =
                      submission?.submission_categories;

                    const category = Array.isArray(categoryValue)
                      ? categoryValue[0]
                      : categoryValue;

                    return (
                      <div
                        key={assignment.id}
                        className="group rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#b9d4df] hover:bg-white hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-medium ${getAssignmentStatusClass(
                                  assignment.status
                                )}`}
                              >
                                {formatAssignmentStatus(
                                  assignment.status
                                )}
                              </span>

                              {submission?.protocol && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs text-[#5f7d90]">
                                  {submission.protocol}
                                </span>
                              )}

                              <span className="rounded-full bg-white px-3 py-1 text-xs text-[#5f7d90]">
                                Atribuído em{" "}
                                {formatDateTimeBR(assignment.assigned_at)}
                              </span>
                            </div>

                            <h2 className="mt-3 line-clamp-2 font-semibold text-[#102a3d]">
                              {submission?.title ??
                                "Trabalho não localizado"}
                            </h2>

                            <p className="mt-2 text-sm text-[#5f7d90]">
                              {category?.name ??
                                "Categoria não informada"}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            asChild
                            className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
                          >
                            <Link
                              href={`/avaliador/trabalhos/${assignment.id}`}
                            >
                              <Eye />
                              Abrir avaliação
                              <ArrowRight />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-[#d9e8ef] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-center text-xs text-[#5f7d90] sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between md:text-left">
          <p>
            © 2026 CAMPGO — Jornada Acadêmica de Medicina.
          </p>

          <p>
            Área restrita do avaliador.
          </p>
        </div>

        <div className="border-t border-[#eef7fa] px-4 py-3 text-center text-[11px] leading-5 text-[#5f7d90]/75">
          <CreatorCredit />
        </div>
      </footer>
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

type SummaryCardProps = {
  label: string;
  value: number;
  description: string;
};

function SummaryCard({
  label,
  value,
  description,
}: SummaryCardProps) {
  return (
    <div className="rounded-3xl border border-[#d9e8ef] bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-[#5f7d90]">
        {label}
      </p>

      <p className="mt-3 text-4xl font-bold text-[#102a3d]">
        {value}
      </p>

      <p className="mt-3 text-sm leading-6 text-[#5f7d90]">
        {description}
      </p>
    </div>
  );
}