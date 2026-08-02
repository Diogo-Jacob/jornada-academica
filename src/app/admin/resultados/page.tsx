import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sendResultsAvailableEmails } from "./actions";
import {
  ArrowRight,
  BarChart3,
  Download,
  Eye,
  FileCheck2,
  Megaphone,
  Presentation,
  Stethoscope,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  submission_authors:
    | {
        id: string;
        full_name: string;
        email: string;
        author_role: string;
        display_order: number;
      }[]
    | null;
};

type Assignment = {
  id: string;
  submission_id: string;
  evaluator_id: string;
  status: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
};

type EvaluationResponse = {
  assignment_id: string;
  criterion_id: string;
  score_option_id: string;
  score: number;
};

type AssignmentScore = {
  assignment: Assignment;
  score: number;
};

type OfficialScoreResult = {
  average: number | null;
  completedEvaluations: number;
  consideredScores: AssignmentScore[];
  allScores: AssignmentScore[];
  usedClosestPair: boolean;
};

type AutomaticResult =
  | "oral"
  | "banner"
  | "not_selected"
  | "pending";

type RankedSubmission = {
  submission: Submission;
  assignments: Assignment[];
  officialScore: OfficialScoreResult;
  rank: number | null;
  automaticResult: AutomaticResult;
};

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    approved_for_evaluation: "Aprovado para avaliação",
    under_evaluation: "Em avaliação",
    one_evaluation_completed: "Uma avaliação concluída",
    evaluations_completed: "Avaliações concluídas",
    third_evaluator_required: "Necessita terceiro avaliador",
    evaluator_replacement_required:
      "Substituição de avaliador necessária",
    pending_confirmation: "Aguardando confirmação",
    result_confirmed: "Resultado confirmado",
    selected_oral: "Selecionado para apresentação oral",
    selected_banner: "Selecionado para banner",
    not_selected: "Não selecionado",
  };

  return labels[status] ?? status;
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    under_evaluation:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    one_evaluation_completed:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    evaluations_completed:
      "border-green-300 bg-green-50 text-green-800",
    pending_confirmation:
      "border-amber-300 bg-amber-50 text-amber-800",
    result_confirmed:
      "border-green-300 bg-green-50 text-green-800",
    selected_oral:
      "border-green-300 bg-green-50 text-green-800",
    selected_banner:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    not_selected:
      "border-red-300 bg-red-50 text-red-800",
  };

  return (
    classes[status] ??
    "border-[#d9e8ef] bg-white text-[#102a3d]"
  );
}

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

function getSettingsDate(
  settings: Record<string, unknown> | null,
  possibleKeys: string[]
) {
  if (!settings) {
    return null;
  }

  for (const key of possibleKeys) {
    const value = settings[key];

    if (typeof value === "string" && value.trim()) {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

function getSubmissionEndDate(
  settings: Record<string, unknown> | null
) {
  return getSettingsDate(settings, [
    "submission_end",
    "submission_end_at",
    "submissions_end",
    "submissions_end_at",
    "submission_period_end",
    "submission_period_end_at",
    "submission_deadline",
    "end_date",
  ]);
}

function getCategoryName(submission: Submission) {
  const categoryValue = submission.submission_categories;

  const category = Array.isArray(categoryValue)
    ? categoryValue[0]
    : categoryValue;

  return category?.name ?? "Categoria não informada";
}

function getResponsibleAuthor(submission: Submission) {
  const authors = [
    ...(submission.submission_authors ?? []),
  ].sort(
    (firstAuthor, secondAuthor) =>
      firstAuthor.display_order -
      secondAuthor.display_order
  );

  return (
    authors.find(
      (author) =>
        author.author_role === "responsible" ||
        author.display_order === 1
    ) ?? null
  );
}

function getAssignmentScore({
  assignmentId,
  responses,
}: {
  assignmentId: string;
  responses: EvaluationResponse[];
}) {
  const assignmentResponses = responses.filter(
    (response) => response.assignment_id === assignmentId
  );

  if (!assignmentResponses.length) {
    return null;
  }

  return assignmentResponses.reduce(
    (total, response) => total + Number(response.score),
    0
  );
}

function getOfficialScoreResult({
  assignments,
  responses,
}: {
  assignments: Assignment[];
  responses: EvaluationResponse[];
}): OfficialScoreResult {
  const completedScores = assignments
    .filter((assignment) => assignment.status === "completed")
    .map((assignment) => {
      const score = getAssignmentScore({
        assignmentId: assignment.id,
        responses,
      });

      if (score === null) {
        return null;
      }

      return {
        assignment,
        score,
      };
    })
    .filter(
      (item): item is AssignmentScore =>
        item !== null && !Number.isNaN(item.score)
    );

  if (completedScores.length < 2) {
    return {
      average: null,
      completedEvaluations: completedScores.length,
      consideredScores: [],
      allScores: completedScores,
      usedClosestPair: false,
    };
  }

  if (completedScores.length === 2) {
    const average =
      completedScores.reduce(
        (total, item) => total + item.score,
        0
      ) / completedScores.length;

    return {
      average,
      completedEvaluations: completedScores.length,
      consideredScores: completedScores,
      allScores: completedScores,
      usedClosestPair: false,
    };
  }

  const pairs: {
    first: AssignmentScore;
    second: AssignmentScore;
    difference: number;
    average: number;
  }[] = [];

  for (
    let firstIndex = 0;
    firstIndex < completedScores.length;
    firstIndex++
  ) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < completedScores.length;
      secondIndex++
    ) {
      const first = completedScores[firstIndex];
      const second = completedScores[secondIndex];

      const difference = Math.abs(first.score - second.score);
      const average = (first.score + second.score) / 2;

      pairs.push({
        first,
        second,
        difference,
        average,
      });
    }
  }

  const selectedPair = pairs.sort((firstPair, secondPair) => {
    const differenceComparison =
      firstPair.difference - secondPair.difference;

    if (differenceComparison !== 0) {
      return differenceComparison;
    }

    const averageComparison =
      secondPair.average - firstPair.average;

    if (averageComparison !== 0) {
      return averageComparison;
    }

    return firstPair.first.assignment.assigned_at.localeCompare(
      secondPair.first.assignment.assigned_at
    );
  })[0];

  return {
    average: selectedPair.average,
    completedEvaluations: completedScores.length,
    consideredScores: [
      selectedPair.first,
      selectedPair.second,
    ],
    allScores: completedScores,
    usedClosestPair: true,
  };
}

function getAutomaticResultLabel(result: AutomaticResult) {
  if (result === "oral") {
    return "Apresentação oral";
  }

  if (result === "banner") {
    return "Banner";
  }

  if (result === "not_selected") {
    return "Não selecionado";
  }

  return "Aguardando conclusão";
}

function getAutomaticResultClassName(result: AutomaticResult) {
  if (result === "oral") {
    return "border-green-300 bg-green-50 text-green-800";
  }

  if (result === "banner") {
    return "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]";
  }

  if (result === "not_selected") {
    return "border-red-300 bg-red-50 text-red-800";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function buildRankedSubmissions({
  submissions,
  assignments,
  responses,
}: {
  submissions: Submission[];
  assignments: Assignment[];
  responses: EvaluationResponse[];
}): RankedSubmission[] {
  const baseRows: RankedSubmission[] = submissions.map(
    (submission) => {
      const submissionAssignments = assignments
        .filter(
          (assignment) =>
            assignment.submission_id === submission.id
        )
        .sort((firstAssignment, secondAssignment) =>
          firstAssignment.assigned_at.localeCompare(
            secondAssignment.assigned_at
          )
        );

      const officialScore = getOfficialScoreResult({
        assignments: submissionAssignments,
        responses,
      });

      return {
        submission,
        assignments: submissionAssignments,
        officialScore,
        rank: null,
        automaticResult: "pending",
      };
    }
  );

  const completedRows = baseRows
    .filter((row) => row.officialScore.average !== null)
    .sort((firstRow, secondRow) => {
      const averageDiff =
        Number(secondRow.officialScore.average) -
        Number(firstRow.officialScore.average);

      if (averageDiff !== 0) {
        return averageDiff;
      }

      return firstRow.submission.title.localeCompare(
        secondRow.submission.title
      );
    });

  const rankedCompletedRows: RankedSubmission[] =
    completedRows.map((row, index) => ({
      ...row,
      rank: index + 1,
      automaticResult:
        index < 5
          ? "oral"
          : index < 40
            ? "banner"
            : "not_selected",
    }));

  const rankedMap = new Map(
    rankedCompletedRows.map((row) => [
      row.submission.id,
      row,
    ])
  );

  return baseRows
    .map((row) => rankedMap.get(row.submission.id) ?? row)
    .sort((firstRow, secondRow) => {
      if (firstRow.rank && secondRow.rank) {
        return firstRow.rank - secondRow.rank;
      }

      if (firstRow.rank && !secondRow.rank) {
        return -1;
      }

      if (!firstRow.rank && secondRow.rank) {
        return 1;
      }

      return secondRow.submission.updated_at.localeCompare(
        firstRow.submission.updated_at
      );
    });
}

function ResultBadge({
  result,
}: {
  result: AutomaticResult;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getAutomaticResultClassName(
        result
      )}`}
    >
      {getAutomaticResultLabel(result)}
    </span>
  );
}

type AdminResultadosPageProps = {
  searchParams: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

export default async function AdminResultadosPage({
  searchParams,
}: AdminResultadosPageProps) {
  const messages = await searchParams;
  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/acesso-negado");
  }

  const { data: eventSettingsData, error: eventSettingsError } =
    await supabase
      .from("event_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

  const shouldIgnoreEventSettingsError =
    eventSettingsError &&
    (eventSettingsError.code === "42P01" ||
      eventSettingsError.code === "PGRST116" ||
      eventSettingsError.code === "42501");

  if (
    eventSettingsError &&
    !shouldIgnoreEventSettingsError
  ) {
    console.warn("Aviso ao carregar configurações do evento:", {
      message: eventSettingsError.message,
      details: eventSettingsError.details,
      hint: eventSettingsError.hint,
      code: eventSettingsError.code,
    });
  }

  const eventSettings = eventSettingsError
    ? null
    : ((eventSettingsData ?? null) as Record<
        string,
        unknown
      > | null);

  const submissionEndDate =
    getSubmissionEndDate(eventSettings);

  const hasSubmissionPeriodEnded = submissionEndDate
    ? new Date() > submissionEndDate
    : false;

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

        submission_authors (
          id,
          full_name,
          email,
          author_role,
          display_order
        )
      `)
      .in("status", [
        "under_evaluation",
        "one_evaluation_completed",
        "evaluations_completed",
        "pending_confirmation",
        "result_confirmed",
        "selected_oral",
        "selected_banner",
        "not_selected",
      ])
      .order("updated_at", {
        ascending: false,
      });

  if (submissionsError) {
    console.error(
      "Erro ao carregar submissões para resultados:",
      {
        message: submissionsError.message,
        details: submissionsError.details,
        hint: submissionsError.hint,
        code: submissionsError.code,
      }
    );
  }

  const submissions = (submissionsData ?? []) as Submission[];

  const submissionIds = Array.from(
    new Set(
      submissions.map((submission) => submission.id)
    )
  );

  let assignments: Assignment[] = [];

  if (submissionIds.length > 0) {
    const { data: assignmentsData, error: assignmentsError } =
      await supabase
        .from("evaluation_assignments")
        .select(`
          id,
          submission_id,
          evaluator_id,
          status,
          assigned_at,
          started_at,
          completed_at
        `)
        .in("submission_id", submissionIds)
        .in("status", [
          "assigned",
          "in_progress",
          "completed",
          "declined",
          "cancelled",
        ]);

    if (assignmentsError) {
      console.error("Erro ao carregar atribuições:", {
        message: assignmentsError.message,
        details: assignmentsError.details,
        hint: assignmentsError.hint,
        code: assignmentsError.code,
      });
    }

    assignments = (assignmentsData ?? []) as Assignment[];
  }

  const evaluatorIds = Array.from(
    new Set(
      assignments.map(
        (assignment) => assignment.evaluator_id
      )
    )
  );

  let evaluators: Profile[] = [];

  if (evaluatorIds.length > 0) {
    const { data: evaluatorsData, error: evaluatorsError } =
      await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email
        `)
        .in("id", evaluatorIds);

    if (evaluatorsError) {
      console.error("Erro ao carregar avaliadores:", {
        message: evaluatorsError.message,
        details: evaluatorsError.details,
        hint: evaluatorsError.hint,
        code: evaluatorsError.code,
      });
    }

    evaluators = (evaluatorsData ?? []) as Profile[];
  }

  const assignmentIds = Array.from(
    new Set(assignments.map((assignment) => assignment.id))
  );

  let responses: EvaluationResponse[] = [];

  if (assignmentIds.length > 0) {
    const { data: responsesData, error: responsesError } =
      await supabase
        .from("evaluation_responses")
        .select(`
          assignment_id,
          criterion_id,
          score_option_id,
          score
        `)
        .in("assignment_id", assignmentIds);

    if (responsesError) {
      console.error(
        "Erro ao carregar respostas das avaliações:",
        {
          message: responsesError.message,
          details: responsesError.details,
          hint: responsesError.hint,
          code: responsesError.code,
        }
      );
    }

    responses = (responsesData ?? []) as EvaluationResponse[];
  }

  const evaluatorMap = new Map(
    evaluators.map((evaluator) => [
      evaluator.id,
      evaluator,
    ])
  );

  const rankedSubmissions = buildRankedSubmissions({
    submissions,
    assignments,
    responses,
  });

  const completedRows = rankedSubmissions.filter(
    (row) => row.officialScore.average !== null
  );

  const oralRows = rankedSubmissions.filter(
    (row) => row.automaticResult === "oral"
  );

  const bannerRows = rankedSubmissions.filter(
    (row) => row.automaticResult === "banner"
  );

  const notSelectedRows = rankedSubmissions.filter(
    (row) => row.automaticResult === "not_selected"
  );

  const pendingRows = rankedSubmissions.filter(
    (row) => row.automaticResult === "pending"
  );

  const thirdEvaluatorRows = completedRows.filter(
    (row) => row.officialScore.usedClosestPair
  );

  const canSendResultsNotice =
    hasSubmissionPeriodEnded && completedRows.length > 0;

  const resultsNoticeDisabledMessage = !submissionEndDate
    ? "Configure a data de encerramento das submissões antes de liberar o aviso de resultados."
    : !hasSubmissionPeriodEnded
      ? `O envio do aviso ficará disponível após o encerramento das submissões: ${formatDate(
          submissionEndDate.toISOString()
        )}.`
      : completedRows.length === 0
        ? "Nenhum resultado com média oficial calculada foi encontrado."
        : null;

  const bestResult = completedRows[0] ?? null;

  return (
    <div className="space-y-8">
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

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
              <Stethoscope className="size-4" />
              Painel administrativo
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Resultados e classificação
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Consulte o ranking calculado pela média oficial. Quando há
              terceiro avaliador, a média final usa as duas notas mais
              próximas.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link href="/admin/resultados/exportar">
                  <Download className="size-4" />
                  Exportar ranking Excel
                </Link>
              </Button>

              <div className="space-y-2">
                <form action={sendResultsAvailableEmails}>
                  <Button
                    type="submit"
                    disabled={!canSendResultsNotice}
                    title={resultsNoticeDisabledMessage ?? undefined}
                    className="bg-white text-[#102a3d] hover:bg-[#eef7fa] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Megaphone className="size-4" />
                    Enviar aviso de resultados
                  </Button>
                </form>

                {resultsNoticeDisabledMessage && (
                  <p className="max-w-md text-xs leading-5 text-white/65">
                    {resultsNoticeDisabledMessage}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-medium text-white/70">
              Resumo dos resultados
            </p>

            <div className="mt-5 grid gap-4">
              <HeroMetric
                label="Trabalhos avaliados"
                value={completedRows.length}
              />

              <HeroMetric
                label="Apresentação oral"
                value={oralRows.length}
              />

              <HeroMetric
                label="Banner"
                value={bannerRows.length}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Trabalhos avaliados"
          value={completedRows.length}
          description="Com média oficial calculada."
        />

        <MetricCard
          label="Apresentação oral"
          value={oralRows.length}
          description="Limite automático: 5 trabalhos."
        />

        <MetricCard
          label="Banner"
          value={bannerRows.length}
          description="Trabalhos classificados do 6º ao 40º lugar."
        />

        <MetricCard
          label="Não selecionados"
          value={notSelectedRows.length}
          description="Trabalhos avaliados fora das 40 primeiras posições."
        />

        <MetricCard
          label="Terceiro avaliador"
          value={thirdEvaluatorRows.length}
          description="Média pelas 2 notas mais próximas."
        />

        <MetricCard
          label="Pendentes"
          value={pendingRows.length}
          description="Ainda sem média oficial concluída."
        />
      </section>

      {bestResult && (
        <section className="rounded-[2rem] border border-green-200 bg-green-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-green-700">
                <Trophy className="size-5" />
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-800">
                  Maior média até o momento
                </p>

                <h2 className="mt-2 text-xl font-bold text-green-950">
                  {bestResult.submission.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-green-800">
                  {bestResult.rank}º lugar · Média oficial:{" "}
                  <strong>
                    {formatNumber(
                      bestResult.officialScore.average
                    )}
                  </strong>{" "}
                  · Resultado:{" "}
                  <strong>
                    {getAutomaticResultLabel(
                      bestResult.automaticResult
                    )}
                  </strong>
                </p>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="border-green-300 bg-white text-green-800 hover:bg-green-100"
            >
              <Link
                href={`/admin/submissoes/${bestResult.submission.id}`}
              >
                <Eye className="size-4" />
                Abrir submissão
              </Link>
            </Button>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <SectionHeader
          icon={<Presentation className="size-6 text-[#245b7a]" />}
          eyebrow="Top 5"
          title="Apresentação oral"
          description="Os 5 trabalhos com maiores médias finais oficiais."
        />

        <div className="p-6">
          {!oralRows.length ? (
            <EmptyState text="Nenhum trabalho classificado para apresentação oral até o momento." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {oralRows.map((row) => (
                <div
                  key={row.submission.id}
                  className="rounded-3xl border border-green-200 bg-green-50 p-5"
                >
                  <span className="rounded-full border border-green-300 bg-white px-3 py-1 text-xs font-medium text-green-800">
                    {row.rank}º lugar
                  </span>

                  <p className="mt-4 line-clamp-3 font-semibold text-green-950">
                    {row.submission.title}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-green-800">
                    Média oficial:{" "}
                    <strong>
                      {formatNumber(row.officialScore.average)}
                    </strong>
                  </p>

                  {row.officialScore.usedClosestPair && (
                    <p className="mt-1 text-xs leading-5 text-green-800">
                      Consideradas as 2 notas mais próximas.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <SectionHeader
          icon={<Megaphone className="size-6 text-[#245b7a]" />}
          eyebrow="Classificação"
          title="Banner"
          description="Trabalhos classificados do 6º ao 40º lugar."
        />

        <div className="p-6">
          {!bannerRows.length ? (
            <EmptyState text="Nenhum trabalho classificado para banner até o momento." />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-[#d9e8ef]">
              <table className="w-full min-w-[800px] border-collapse text-sm">
                <thead className="bg-[#eef7fa] text-[#5f7d90]">
                  <tr className="border-b border-[#d9e8ef] text-left">
                    <th className="px-4 py-3 font-medium">
                      Classificação
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Trabalho
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Categoria
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Média oficial
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#d9e8ef]">
                  {bannerRows.map((row) => (
                    <tr
                      key={row.submission.id}
                      className="align-top"
                    >
                      <td className="px-4 py-4">
                        <span className="rounded-full border border-[#b9d4df] bg-[#eef7fa] px-3 py-1 text-xs font-medium text-[#245b7a]">
                          {row.rank}º
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#102a3d]">
                          {row.submission.title}
                        </p>

                        {row.submission.protocol && (
                          <p className="mt-1 text-xs text-[#5f7d90]">
                            {row.submission.protocol}
                          </p>
                        )}

                        {row.officialScore.usedClosestPair && (
                          <p className="mt-1 text-xs text-[#5f7d90]">
                            Terceiro avaliador: média pelas 2 notas mais
                            próximas.
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 text-[#4a6678]">
                        {getCategoryName(row.submission)}
                      </td>

                      <td className="px-4 py-4 font-semibold text-[#102a3d]">
                        {formatNumber(row.officialScore.average)}
                      </td>

                      <td className="px-4 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
                        >
                          <Link
                            href={`/admin/submissoes/${row.submission.id}`}
                          >
                            Abrir
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <SectionHeader
          icon={<BarChart3 className="size-6 text-[#245b7a]" />}
          eyebrow="Ranking"
          title="Ranking geral"
          description="Visão completa das médias, notas recebidas e resultado automático."
        />

        <div className="p-6">
          {!rankedSubmissions.length ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] px-6 py-14 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
                <FileCheck2 className="size-7" />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-[#102a3d]">
                Nenhum resultado disponível
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#5f7d90]">
                Quando as avaliações forem concluídas, o ranking aparecerá
                aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-[#d9e8ef]">
              <table className="w-full min-w-[1550px] border-collapse text-sm">
                <thead className="bg-[#eef7fa] text-[#5f7d90]">
                  <tr className="border-b border-[#d9e8ef] text-left">
                    <th className="px-4 py-3 font-medium">
                      Classificação
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Trabalho
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Categoria
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Avaliações concluídas
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Notas recebidas
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Notas consideradas
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Média oficial
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Resultado automático
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#d9e8ef]">
                  {rankedSubmissions.map((row) => {
                    const responsibleAuthor =
                      getResponsibleAuthor(row.submission);

                    const allScoresText =
                      row.officialScore.allScores.length
                        ? row.officialScore.allScores
                            .map((assignmentScore, index) => {
                              const evaluator =
                                evaluatorMap.get(
                                  assignmentScore.assignment
                                    .evaluator_id
                                );

                              return `${index + 1}. ${
                                evaluator?.full_name ??
                                "Avaliador não localizado"
                              }: ${formatNumber(
                                assignmentScore.score
                              )}`;
                            })
                            .join(" | ")
                        : "—";

                    const consideredScoresText =
                      row.officialScore.consideredScores.length
                        ? row.officialScore.consideredScores
                            .map((assignmentScore) => {
                              const evaluator =
                                evaluatorMap.get(
                                  assignmentScore.assignment
                                    .evaluator_id
                                );

                              return `${
                                evaluator?.full_name ??
                                "Avaliador não localizado"
                              }: ${formatNumber(
                                assignmentScore.score
                              )}`;
                            })
                            .join(" | ")
                        : "—";

                    return (
                      <tr
                        key={row.submission.id}
                        className="align-top"
                      >
                        <td className="px-4 py-4">
                          {row.rank ? (
                            <span className="rounded-full border border-[#b9d4df] bg-[#eef7fa] px-3 py-1 text-xs font-medium text-[#245b7a]">
                              {row.rank}º
                            </span>
                          ) : (
                            <span className="text-[#5f7d90]">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-[300px]">
                            <p className="font-semibold text-[#102a3d]">
                              {row.submission.title}
                            </p>

                            {row.submission.protocol && (
                              <p className="mt-1 text-xs text-[#5f7d90]">
                                {row.submission.protocol}
                              </p>
                            )}

                            {responsibleAuthor && (
                              <p className="mt-2 text-xs text-[#5f7d90]">
                                Autor responsável:{" "}
                                {responsibleAuthor.full_name}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-[#4a6678]">
                          {getCategoryName(row.submission)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                              row.submission.status
                            )}`}
                          >
                            {formatStatus(row.submission.status)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-[#102a3d]">
                          {row.officialScore.completedEvaluations}
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-[320px] text-xs leading-6 text-[#5f7d90]">
                            {allScoresText}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-[320px] text-xs leading-6 text-[#4a6678]">
                            {consideredScoresText}

                            {row.officialScore.usedClosestPair && (
                              <p className="mt-1 text-[#5f7d90]">
                                Regra aplicada: 2 notas mais próximas.
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="text-lg font-bold text-[#102a3d]">
                            {formatNumber(
                              row.officialScore.average
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <ResultBadge
                            result={row.automaticResult}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
                          >
                            <Link
                              href={`/admin/submissoes/${row.submission.id}`}
                            >
                              <Eye className="size-4" />
                              Abrir
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#d9e8ef] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]">
            <Users className="size-5" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#102a3d]">
              Regra de classificação
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
              A classificação é automática: os 5 trabalhos com maiores
              médias finais são classificados para apresentação oral. Os
              trabalhos classificados da 6ª à 40ª posição são selecionados
              para apresentação em banner. Os demais trabalhos avaliados
              ficam como não selecionados. Quando há apenas duas avaliações
              concluídas, a nota final corresponde à média das duas notas.
              Quando há terceiro avaliador, a nota final corresponde à
              média aritmética das duas notas mais próximas entre si. Em
              caso de empate entre pares igualmente próximos, considera-se
              o par com maior média.
            </p>
          </div>
        </div>
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
  label: string;
  value: number;
  description: string;
};

function MetricCard({
  label,
  value,
  description,
}: MetricCardProps) {
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

type SectionHeaderProps = {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="border-b border-[#d9e8ef] bg-[#f7fbfd] p-6">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b7a]">
        {eyebrow}
      </p>

      <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#102a3d]">
        {icon}
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] p-8 text-center">
      <p className="text-sm leading-6 text-[#5f7d90]">
        {text}
      </p>
    </div>
  );
}