import Link from "next/link";
import { StartEvaluationButton } from "./evaluation-action-buttons";
import { ConfirmDeclineButton } from "./confirm-decline-button";
import {
  ArrowLeft,
  Download,
  FileSearch,
  PlayCircle,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { EvaluationForm } from "./evaluation-form";
import {
  declineEvaluation,
  startEvaluation,
} from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { formatDateTimeBR } from "@/lib/formatters/date";
import { CreatorCredit } from "@/components/creator-credit";

type AvaliadorTrabalhoPageProps = {
  params: Promise<{
    assignmentId: string;
  }>;

  searchParams: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

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
  event_id: string;
  title: string;
  protocol: string | null;
  submission_categories:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

type SubmissionFile = {
  id: string;
  original_filename: string;
  size_bytes: number;
  version_number: number;
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

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(
      size /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

export default async function AvaliadorTrabalhoPage({
  params,
  searchParams,
}: AvaliadorTrabalhoPageProps) {
  const { assignmentId } = await params;
  const messages = await searchParams;

  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    profile.role !== "evaluator"
  ) {
    redirect("/acesso-negado");
  }

  const { data: assignmentData, error: assignmentError } =
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
      .eq("id", assignmentId)
      .eq("evaluator_id", profile.id)
      .maybeSingle();

  if (assignmentError) {
    console.error("Erro ao carregar avaliação:", {
      message: assignmentError.message,
      details: assignmentError.details,
      hint: assignmentError.hint,
      code: assignmentError.code,
    });
  }

  if (!assignmentData) {
    notFound();
  }

  const assignment = assignmentData as Assignment;

  const { data: submissionData, error: submissionError } =
    await supabase
      .from("submissions")
      .select(`
        id,
        event_id,
        title,
        protocol,

        submission_categories (
          name
        )
      `)
      .eq("id", assignment.submission_id)
      .maybeSingle();

  if (submissionError) {
    console.error(
      "Erro ao carregar submissão atribuída:",
      {
        message: submissionError.message,
        details: submissionError.details,
        hint: submissionError.hint,
        code: submissionError.code,
      }
    );
  }

  if (!submissionData) {
    notFound();
  }

  const submission = submissionData as Submission;

  const categoryValue =
    submission.submission_categories;

  const category = Array.isArray(categoryValue)
    ? categoryValue[0]
    : categoryValue;

  const { data: anonymousFileData, error: filesError } =
    await supabase
      .from("submission_files")
      .select(`
        id,
        original_filename,
        size_bytes,
        version_number
      `)
      .eq("submission_id", submission.id)
      .eq("file_type", "anonymous")
      .eq("is_current", true)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (filesError) {
    console.error(
      "Erro ao carregar arquivo anonimizado:",
      {
        message: filesError.message,
        details: filesError.details,
        hint: filesError.hint,
        code: filesError.code,
      }
    );
  }

  const anonymousFile = anonymousFileData;

  const canStart = assignment.status === "assigned";

  const canDecline = assignment.status === "assigned";

  const canShowEvaluationForm = [
    "in_progress",
    "completed",
  ].includes(assignment.status);

  let criteria: {
    id: string;
    name: string;
    description: string | null;
    max_score: number;
    display_order: number;
  }[] = [];

  let scoreOptions: {
    id: string;
    label: string;
    percentage: number;
  }[] = [];

  let responses: {
    criterion_id: string;
    score_option_id: string;
    score: number;
  }[] = [];

  if (canShowEvaluationForm) {
    const {
      data: criteriaData,
      error: criteriaError,
    } = await supabase
      .from("evaluation_criteria")
      .select(`
        id,
        name,
        description,
        max_score,
        display_order
      `)
      .eq("event_id", submission.event_id)
      .eq("is_active", true)
      .order("display_order", {
        ascending: true,
      });

    if (criteriaError) {
      console.error(
        "Erro ao carregar critérios da avaliação:",
        {
          message: criteriaError.message,
          details: criteriaError.details,
          hint: criteriaError.hint,
          code: criteriaError.code,
        }
      );
    }

    criteria = criteriaData ?? [];

    const {
      data: scoreOptionsData,
      error: scoreOptionsError,
    } = await supabase
      .from("evaluation_score_options")
      .select(`
        id,
        label,
        percentage
      `)
      .eq("is_active", true)
      .order("percentage", {
        ascending: false,
      });

    if (scoreOptionsError) {
      console.error(
        "Erro ao carregar opções de pontuação:",
        {
          message: scoreOptionsError.message,
          details: scoreOptionsError.details,
          hint: scoreOptionsError.hint,
          code: scoreOptionsError.code,
        }
      );
    }

    scoreOptions = scoreOptionsData ?? [];

    const {
      data: responsesData,
      error: responsesError,
    } = await supabase
      .from("evaluation_responses")
      .select(`
        criterion_id,
        score_option_id,
        score
      `)
      .eq("assignment_id", assignment.id);

    if (responsesError) {
      console.error(
        "Erro ao carregar respostas existentes:",
        {
          message: responsesError.message,
          details: responsesError.details,
          hint: responsesError.hint,
          code: responsesError.code,
        }
      );
    }

    responses = responsesData ?? [];
  }

  function getDownloadUrl(fileId: string) {
    return `/avaliador/trabalhos/${assignmentId}/arquivos/${fileId}`;
  }

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

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-[#102a3d]">
              {profile.full_name}
            </p>

            <p className="text-xs text-[#5f7d90]">
              Avaliador
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="-ml-3 text-[#245b7a] hover:bg-[#eef7fa] hover:text-[#173f59]"
          asChild
        >
          <Link href="/avaliador">
            <ArrowLeft />
            Voltar para minhas avaliações
          </Link>
        </Button>

        {(messages.erro || messages.sucesso) && (
          <section className="space-y-3">
            {messages.erro && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {messages.erro}
              </div>
            )}

            {messages.sucesso && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
                {messages.sucesso}
              </div>
            )}
          </section>
        )}

        <section className="relative overflow-hidden rounded-[2rem] bg-[#102a3d] p-8 text-white shadow-sm lg:p-10">
          <div className="absolute right-[-120px] top-[-120px] size-80 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] size-96 rounded-full bg-[#245b7a]/60 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
                <Stethoscope className="size-4" />
                Avaliação científica
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${getAssignmentStatusClass(
                  assignment.status
                )}`}
              >
                {formatAssignmentStatus(
                  assignment.status
                )}
              </span>

              {submission.protocol && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/75">
                  {submission.protocol}
                </span>
              )}
            </div>

            <h1 className="mt-6 max-w-5xl text-3xl font-bold tracking-tight sm:text-4xl">
              {submission.title}
            </h1>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <HeroInfo
                label="Categoria"
                value={category?.name ?? "Não informada"}
              />

              <HeroInfo
                label="Atribuído em"
                value={formatDateTimeBR(assignment.assigned_at)}
              />

              <HeroInfo
                label="Documento"
                value={anonymousFile ? "Disponível" : "Pendente"}
              />
            </div>
          </div>
        </section>

        {assignment.status === "declined" && (
          <Card className="overflow-hidden rounded-[2rem] border-slate-300 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <XCircle className="size-5" />
                Avaliação recusada
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <p className="text-sm leading-6 text-slate-600">
                Você recusou esta avaliação. A Comissão Científica selecionará
                outro avaliador para este trabalho.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
          <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
            <CardTitle className="flex items-center gap-2 text-[#102a3d]">
              <FileSearch className="size-5 text-[#245b7a]" />
              Documento para avaliação
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {!anonymousFile ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
                <p className="font-semibold text-red-700">
                  Versão anonimizada não localizada
                </p>

                <p className="mt-2 text-sm leading-6 text-red-700/80">
                  Entre em contato com a Comissão Científica para verificar o
                  arquivo deste trabalho.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#102a3d]">
                      Trabalho
                    </p>

                    <p className="mt-1 break-all text-sm text-[#5f7d90]">
                      {anonymousFile.original_filename}
                    </p>

                    <p className="mt-1 text-xs text-[#5f7d90]">
                      {formatFileSize(
                        anonymousFile.size_bytes
                      )}
                      {" · "}
                      Versão{" "}
                      {anonymousFile.version_number}
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-800">
                    Disponível
                  </span>
                </div>

                <a
                  href={getDownloadUrl(anonymousFile.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#b9d4df] bg-white px-3 text-sm font-medium text-[#245b7a] transition-colors hover:bg-[#eef7fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b7a]/30"
                >
                  <Download className="size-4" />
                  Baixar Trabalho
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {canStart && (
          <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
            <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
              <CardTitle className="flex items-center gap-2 text-[#102a3d]">
                <PlayCircle className="size-5 text-[#245b7a]" />
                Avaliação científica
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 p-6">
              <div className="rounded-3xl border border-[#d9e8ef] bg-[#eef7fa] p-5">
                <p className="font-semibold text-[#102a3d]">
                  Antes de iniciar
                </p>

                <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
                  Ao iniciar, esta avaliação ficará marcada como em andamento e
                  o formulário de critérios será liberado. Caso exista algum
                  impedimento para avaliar este trabalho, recuse antes de
                  iniciar.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <form action={startEvaluation}>
                  <input
                    type="hidden"
                    name="assignmentId"
                    value={assignment.id}
                  />

                  <StartEvaluationButton />
                </form>

                {canDecline && (
                  <form action={declineEvaluation}>
                    <input
                      type="hidden"
                      name="assignmentId"
                      value={assignment.id}
                    />

                    <ConfirmDeclineButton />
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {canShowEvaluationForm && (
          <div className="rounded-[2rem] border border-[#d9e8ef] bg-white p-6 shadow-sm">
            <EvaluationForm
              assignmentId={assignment.id}
              assignmentStatus={assignment.status}
              criteria={criteria}
              scoreOptions={scoreOptions}
              responses={responses}
            />
          </div>
        )}
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

type HeroInfoProps = {
  label: string;
  value: string;
};

function HeroInfo({
  label,
  value,
}: HeroInfoProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-sm text-white/65">
        {label}
      </p>

      <p className="mt-2 line-clamp-2 text-lg font-bold text-white">
        {value}
      </p>
    </div>
  );
}