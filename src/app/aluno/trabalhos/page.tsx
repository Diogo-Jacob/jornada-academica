import Link from "next/link";
import { FinalResultCard } from "./final-result-card";
import {
  ArrowRight,
  FileText,
  PlusCircle,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { deleteDraft } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type TrabalhosPageProps = {
  searchParams: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

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

function getEvent(submission: Submission) {
  const eventValue = submission.events;

  if (Array.isArray(eventValue)) {
    return eventValue[0] ?? null;
  }

  return eventValue;
}

function getCategoryName(submission: Submission) {
  const categoryValue = submission.submission_categories;

  const category = Array.isArray(categoryValue)
    ? categoryValue[0]
    : categoryValue;

  return category?.name ?? "Sem categoria";
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
    ["selected_oral", "selected_banner"].includes(status)
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
    ["selected_oral", "selected_banner"].includes(status)
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
  }).format(new Date(date));
}

export default async function TrabalhosPage({
  searchParams,
}: TrabalhosPageProps) {
  const messages = await searchParams;

  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const { data: submissions, error } = await supabase
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

  if (error) {
    console.error("Erro ao carregar trabalhos:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  const submissionList =
    (submissions ?? []) as Submission[];

  const draftCount = submissionList.filter(
    (submission) => submission.status === "draft"
  ).length;

  const correctionCount = submissionList.filter(
    (submission) =>
      submission.status === "correction_requested"
  ).length;

  const sentCount = submissionList.filter(
    (submission) => submission.status !== "draft"
  ).length;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#102a3d] p-8 text-white shadow-sm lg:p-10">
        <div className="absolute right-[-120px] top-[-120px] size-80 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] size-96 rounded-full bg-[#245b7a]/60 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
              <Stethoscope className="size-4" />
              Painel do aluno
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Meus trabalhos
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Consulte, acompanhe e gerencie suas submissões científicas da
              Jornada Acadêmica de Medicina.
            </p>
          </div>

          <Button
            asChild
            className="w-full bg-white text-[#102a3d] hover:bg-[#e9f4f8] sm:w-auto"
          >
            <Link href="/aluno/trabalhos/novo">
              <PlusCircle />
              Nova submissão
            </Link>
          </Button>
        </div>
      </section>

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

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Total de trabalhos"
          value={submissionList.length}
          description="Todos os rascunhos e submissões."
        />

        <SummaryCard
          label="Enviados"
          value={sentCount}
          description="Trabalhos já submetidos."
        />

        <SummaryCard
          label="Correções pendentes"
          value={correctionCount}
          description="Aguardando ajuste do aluno."
        />
      </section>

      <section className="rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#d9e8ef] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b7a]">
              Submissões
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#102a3d]">
              Trabalhos cadastrados
            </h2>
          </div>

          {submissionList.length > 0 && (
            <Button
              asChild
              className="bg-[#245b7a] hover:bg-[#173f59]"
            >
              <Link href="/aluno/trabalhos/novo">
                <PlusCircle />
                Criar nova submissão
              </Link>
            </Button>
          )}
        </div>

        <Card className="border-0 shadow-none">
          <CardContent className="p-6">
            {!submissionList.length ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] px-6 py-14 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
                  <FileText className="size-7" />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-[#102a3d]">
                  Nenhum trabalho cadastrado
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-[#4a6678]">
                  Crie um novo rascunho para começar sua submissão científica.
                </p>

                <Button
                  className="mt-6 bg-[#245b7a] hover:bg-[#173f59]"
                  asChild
                >
                  <Link href="/aluno/trabalhos/novo">
                    <PlusCircle />
                    Criar nova submissão
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {submissionList.map((submission) => {
                  const showFinalResult =
                    canShowFinalResult(submission);

                  return (
                    <div
                      key={submission.id}
                      className="group rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#b9d4df] hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
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

                            <span className="rounded-full bg-white px-3 py-1 text-xs text-[#5f7d90]">
                              Atualizado em {formatDate(submission.updated_at)}
                            </span>
                          </div>

                          <p className="mt-3 line-clamp-2 font-semibold text-[#102a3d]">
                            {submission.title}
                          </p>

                          <p className="mt-2 text-sm text-[#5f7d90]">
                            {getCategoryName(submission)}
                          </p>

                          <div className="mt-3">
                            <FinalResultCard
                              status={submission.status}
                              compact
                              canShowResult={showFinalResult}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
                          >
                            <Link
                              href={`/aluno/trabalhos/${submission.id}`}
                            >
                              Abrir
                              <ArrowRight />
                            </Link>
                          </Button>

                          {submission.status === "draft" && (
                            <form action={deleteDraft}>
                              <input
                                type="hidden"
                                name="submissionId"
                                value={submission.id}
                              />

                              <Button
                                type="submit"
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 />
                                Excluir
                              </Button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {draftCount > 0 && (
        <section className="rounded-3xl border border-[#d9e8ef] bg-[#eef7fa] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-[#102a3d]">
                Você possui rascunho salvo
              </p>

              <p className="mt-1 text-sm leading-6 text-[#4a6678]">
                Revise os dados, complete os documentos obrigatórios e finalize
                a submissão dentro do prazo do edital.
              </p>
            </div>

            <Button
              asChild
              className="bg-[#245b7a] hover:bg-[#173f59]"
            >
              <Link href="/aluno/trabalhos">
                Continuar depois
              </Link>
            </Button>
          </div>
        </section>
      )}
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