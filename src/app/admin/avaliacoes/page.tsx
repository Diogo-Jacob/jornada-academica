import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Eye,
  Send,
  Stethoscope,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  assignEvaluators,
  assignReplacementEvaluator,
  assignThirdEvaluator,
} from "./actions";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type AdminAvaliacoesPageProps = {
  searchParams: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

type Evaluator = {
  id: string;
  full_name: string;
  email: string;
  activeAssignmentsCount?: number;
};

type Assignment = {
  id: string;
  submission_id: string;
  evaluator_id: string;
  status: string;
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

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    approved_for_evaluation: "Aprovado para avaliação",
    under_evaluation: "Em avaliação",
    one_evaluation_completed: "Uma avaliação concluída",
    evaluations_completed: "Avaliações concluídas",
    third_evaluator_required: "Necessita terceiro avaliador",
    evaluator_replacement_required:
      "Substituição de avaliador necessária",
  };

  return labels[status] ?? status;
}

function getSubmissionStatusClass(status: string) {
  const classes: Record<string, string> = {
    approved_for_evaluation:
      "border-slate-300 bg-slate-50 text-slate-700",
    under_evaluation:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    one_evaluation_completed:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    evaluations_completed:
      "border-green-300 bg-green-50 text-green-800",
    third_evaluator_required:
      "border-amber-300 bg-amber-50 text-amber-800",
    evaluator_replacement_required:
      "border-red-300 bg-red-50 text-red-800",
  };

  return (
    classes[status] ??
    "border-[#d9e8ef] bg-white text-[#102a3d]"
  );
}

function formatAssignmentStatus(status: string) {
  const labels: Record<string, string> = {
    assigned: "Atribuído",
    in_progress: "Em andamento",
    completed: "Concluída",
    declined: "Recusada",
    cancelled: "Cancelada",
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
      "border-red-300 bg-red-50 text-red-800",
    cancelled:
      "border-slate-300 bg-slate-50 text-slate-700",
  };

  return (
    classes[status] ??
    "border-[#d9e8ef] bg-white text-[#102a3d]"
  );
}

export default async function AdminAvaliacoesPage({
  searchParams,
}: AdminAvaliacoesPageProps) {
  const messages = await searchParams;

  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/acesso-negado");
  }

  const { data: submissions, error: submissionsError } =
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
        "approved_for_evaluation",
        "under_evaluation",
        "one_evaluation_completed",
        "evaluations_completed",
        "third_evaluator_required",
        "evaluator_replacement_required",
      ])
      .order("updated_at", {
        ascending: false,
      });

  if (submissionsError) {
    console.error(
      "Erro ao carregar submissões para avaliação:",
      submissionsError
    );
  }

  const submissionList =
    (submissions ?? []) as Submission[];

  const submissionIds = Array.from(
    new Set(
      submissionList.map(
        (submission) => submission.id
      )
    )
  );

  const { data: evaluators, error: evaluatorsError } =
    await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "evaluator")
      .eq("is_active", true)
      .order("full_name", {
        ascending: true,
      });

  if (evaluatorsError) {
    console.error(
      "Erro ao carregar avaliadores:",
      evaluatorsError
    );
  }

  const evaluatorList = (evaluators ?? []) as Evaluator[];

  const evaluatorIds = evaluatorList.map(
    (evaluator) => evaluator.id
  );

  const evaluatorActiveAssignmentsCount = new Map<
    string,
    number
  >();

  if (evaluatorIds.length > 0) {
    const {
      data: evaluatorAssignments,
      error: evaluatorAssignmentsError,
    } = await supabase
      .from("evaluation_assignments")
      .select("id, evaluator_id, status")
      .in("evaluator_id", evaluatorIds)
      .in("status", [
        "assigned",
        "in_progress",
        "completed",
      ]);

    if (evaluatorAssignmentsError) {
      console.error(
        "Erro ao carregar contagem de trabalhos dos avaliadores:",
        evaluatorAssignmentsError
      );
    }

    for (const assignment of evaluatorAssignments ?? []) {
      const currentCount =
        evaluatorActiveAssignmentsCount.get(
          assignment.evaluator_id
        ) ?? 0;

      evaluatorActiveAssignmentsCount.set(
        assignment.evaluator_id,
        currentCount + 1
      );
    }
  }

  const evaluatorListWithCounts = evaluatorList
    .map((evaluator) => ({
      ...evaluator,
      activeAssignmentsCount:
        evaluatorActiveAssignmentsCount.get(evaluator.id) ?? 0,
    }))
    .sort((firstEvaluator, secondEvaluator) => {
      const countDifference =
        (firstEvaluator.activeAssignmentsCount ?? 0) -
        (secondEvaluator.activeAssignmentsCount ?? 0);

      if (countDifference !== 0) {
        return countDifference;
      }

      return firstEvaluator.full_name.localeCompare(
        secondEvaluator.full_name,
        "pt-BR"
      );
    });

  let assignmentList: Assignment[] = [];

  if (submissionIds.length > 0) {
    const { data: assignments, error: assignmentsError } =
      await supabase
        .from("evaluation_assignments")
        .select(`
          id,
          submission_id,
          evaluator_id,
          status
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
      console.error(
        "Erro ao carregar atribuições:",
        assignmentsError
      );
    }

    assignmentList = (assignments ?? []) as Assignment[];
  }

  const evaluatorMap = new Map(
    evaluatorListWithCounts.map((evaluator) => [
      evaluator.id,
      evaluator,
    ])
  );

  const assignmentsBySubmission = new Map<
    string,
    Assignment[]
  >();

  for (const assignment of assignmentList) {
    const current =
      assignmentsBySubmission.get(assignment.submission_id) ?? [];

    current.push(assignment);

    assignmentsBySubmission.set(
      assignment.submission_id,
      current
    );
  }

  const pendingDistribution =
    submissionList.filter(
      (submission) =>
        submission.status === "approved_for_evaluation"
    ).length;

  const inEvaluation =
    submissionList.filter(
      (submission) =>
        submission.status === "under_evaluation" ||
        submission.status === "one_evaluation_completed"
    ).length;

  const needsAction =
    submissionList.filter((submission) =>
      [
        "third_evaluator_required",
        "evaluator_replacement_required",
      ].includes(submission.status)
    ).length;

  const completed =
    submissionList.filter(
      (submission) =>
        submission.status === "evaluations_completed"
    ).length;

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
              Distribuição das avaliações
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Encaminhe cada trabalho aprovado para professores avaliadores,
              acompanhe o andamento das avaliações e resolva recusas ou
              divergências.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-medium text-white/70">
              Resumo da avaliação
            </p>

            <div className="mt-5 grid gap-4">
              <HeroMetric
                label="Aguardando distribuição"
                value={pendingDistribution}
              />

              <HeroMetric
                label="Em avaliação"
                value={inEvaluation}
              />

              <HeroMetric
                label="Ação necessária"
                value={needsAction}
              />
            </div>
          </div>
        </div>
      </section>

      {needsAction > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700">
              <AlertTriangle className="size-5" />
            </div>

            <div>
              <p className="font-semibold text-amber-900">
                Existem avaliações que precisam de intervenção
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Há trabalhos aguardando terceiro avaliador ou substituição de
                avaliador recusado.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Aguardando distribuição"
          value={pendingDistribution}
          description="Trabalhos aprovados e ainda sem avaliadores."
        />

        <MetricCard
          label="Em avaliação"
          value={inEvaluation}
          description="Trabalhos com avaliação em andamento."
        />

        <MetricCard
          label="Ação necessária"
          value={needsAction}
          description="Terceiro avaliador ou substituição."
          warning={needsAction > 0}
        />

        <MetricCard
          label="Concluídas"
          value={completed}
          description="Trabalhos com avaliações finalizadas."
        />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <div className="border-b border-[#d9e8ef] bg-[#f7fbfd] p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#102a3d]">
            <UserCheck className="size-5 text-[#245b7a]" />
            Avaliadores disponíveis
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
            Lista de professores avaliadores ativos no sistema.
          </p>
        </div>

        <div className="p-6">
          {!evaluatorList.length ? (
            <div className="rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] p-8 text-center">
              <p className="font-semibold text-[#102a3d]">
                Nenhum avaliador ativo encontrado
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
                Cadastre avaliadores antes de distribuir os trabalhos.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {evaluatorListWithCounts.map((evaluator) => {
                const activeAssignmentsCount =
                  evaluator.activeAssignmentsCount ?? 0;

                return (
                  <div
                    key={evaluator.id}
                    className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5 transition hover:border-[#b9d4df] hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#102a3d]">
                          {evaluator.full_name}
                        </p>

                        <p className="mt-1 break-all text-sm text-[#5f7d90]">
                          {evaluator.email}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-[#b9d4df] bg-[#eef7fa] px-3 py-1 text-xs font-semibold text-[#245b7a]">
                        {activeAssignmentsCount}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#d9e8ef] bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#5f7d90]">
                        Trabalhos atribuídos
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#102a3d]">
                        {activeAssignmentsCount === 1
                          ? "1 trabalho atribuído"
                          : `${activeAssignmentsCount} trabalhos atribuídos`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#d9e8ef] bg-[#f7fbfd] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b7a]">
              Avaliações
            </p>

            <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#102a3d]">
              <ClipboardList className="size-6 text-[#245b7a]" />
              Trabalhos para avaliação
            </h2>
          </div>

          <p className="text-sm text-[#5f7d90]">
            {submissionList.length} trabalho(s)
          </p>
        </div>

        <div className="p-6">
          {!submissionList.length ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] px-6 py-14 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
                <Users className="size-7" />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-[#102a3d]">
                Nenhum trabalho disponível
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#5f7d90]">
                Ainda não há trabalhos aprovados para avaliação científica.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissionList.map((submission) => {
                const category = Array.isArray(
                  submission.submission_categories
                )
                  ? submission.submission_categories[0]
                  : submission.submission_categories;

                const authors = [
                  ...(submission.submission_authors ?? []),
                ].sort(
                  (firstAuthor, secondAuthor) =>
                    firstAuthor.display_order -
                    secondAuthor.display_order
                );

                const responsibleAuthor = authors.find(
                  (author) =>
                    author.author_role === "responsible" ||
                    author.display_order === 1
                );

                const submissionAssignments =
                  assignmentsBySubmission.get(submission.id) ?? [];

                const activeOrHistoricEvaluatorIds =
                  new Set(
                    submissionAssignments.map(
                      (assignment) =>
                        assignment.evaluator_id
                    )
                  );

                const availableNewEvaluators =
                  evaluatorListWithCounts.filter(
                    (evaluator) =>
                      !activeOrHistoricEvaluatorIds.has(
                        evaluator.id
                      )
                  );

                const declinedAssignments =
                  submissionAssignments.filter(
                    (assignment) =>
                      assignment.status === "declined"
                  );

                const alreadyAssigned =
                  submissionAssignments.length > 0;

                const needsReplacement =
                  submission.status ===
                  "evaluator_replacement_required";

                const needsThirdEvaluator =
                  submission.status ===
                  "third_evaluator_required";

                return (
                  <div
                    key={submission.id}
                    className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getSubmissionStatusClass(
                              submission.status
                            )}`}
                          >
                            {formatStatus(submission.status)}
                          </span>

                          {submission.protocol && (
                            <span className="rounded-full bg-white px-3 py-1 text-xs text-[#5f7d90]">
                              {submission.protocol}
                            </span>
                          )}
                        </div>

                        <h2 className="mt-3 line-clamp-2 font-semibold text-[#102a3d]">
                          {submission.title}
                        </h2>

                        <p className="mt-2 text-sm text-[#5f7d90]">
                          {category?.name ?? "Categoria não informada"}
                        </p>

                        <p className="mt-2 text-sm text-[#5f7d90]">
                          Autor responsável:{" "}
                          <span className="font-medium text-[#102a3d]">
                            {responsibleAuthor?.full_name ??
                              "Não identificado"}
                          </span>
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        asChild
                        className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
                      >
                        <Link
                          href={`/admin/submissoes/${submission.id}`}
                        >
                          <Eye />
                          Abrir submissão
                          <ArrowRight />
                        </Link>
                      </Button>
                    </div>

                    {alreadyAssigned && (
                      <div className="mt-5 rounded-3xl border border-[#d9e8ef] bg-white p-5">
                        <p className="font-semibold text-[#102a3d]">
                          Avaliadores atribuídos
                        </p>

                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {submissionAssignments.map((assignment) => {
                            const evaluator =
                              evaluatorMap.get(
                                assignment.evaluator_id
                              );

                            return (
                              <div
                                key={assignment.id}
                                className="rounded-2xl border border-[#d9e8ef] bg-[#f7fbfd] p-4"
                              >
                                <p className="font-semibold text-[#102a3d]">
                                  {evaluator?.full_name ??
                                    "Avaliador não localizado"}
                                </p>

                                <p className="mt-1 break-all text-sm text-[#5f7d90]">
                                  {evaluator?.email ??
                                    assignment.evaluator_id}
                                </p>

                                <span
                                  className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getAssignmentStatusClass(
                                    assignment.status
                                  )}`}
                                >
                                  {formatAssignmentStatus(
                                    assignment.status
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {needsReplacement && (
                      <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 size-5 text-red-700" />

                          <div>
                            <p className="font-semibold text-red-900">
                              Substituição de avaliador necessária
                            </p>

                            <p className="mt-1 text-sm leading-6 text-red-800">
                              Um avaliador recusou este trabalho. Selecione um
                              novo avaliador para substituir a atribuição
                              recusada.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-4">
                          {declinedAssignments.map((assignment) => {
                            const declinedEvaluator =
                              evaluatorMap.get(
                                assignment.evaluator_id
                              );

                            return (
                              <form
                                key={assignment.id}
                                action={assignReplacementEvaluator}
                                className="rounded-3xl border border-red-200 bg-white p-5"
                              >
                                <input
                                  type="hidden"
                                  name="submissionId"
                                  value={submission.id}
                                />

                                <input
                                  type="hidden"
                                  name="declinedAssignmentId"
                                  value={assignment.id}
                                />

                                <p className="text-sm text-[#4a6678]">
                                  Avaliador que recusou:{" "}
                                  <strong className="text-[#102a3d]">
                                    {declinedEvaluator?.full_name ??
                                      assignment.evaluator_id}
                                  </strong>
                                </p>

                                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                                  <SelectField
                                    id={`replacementEvaluatorId-${assignment.id}`}
                                    name="replacementEvaluatorId"
                                    label="Novo avaliador"
                                    options={availableNewEvaluators}
                                  />

                                  <Button
                                    type="submit"
                                    className="bg-[#245b7a] hover:bg-[#173f59]"
                                    disabled={
                                      !availableNewEvaluators.length
                                    }
                                  >
                                    <UserPlus className="size-4" />
                                    Atribuir substituto
                                  </Button>
                                </div>

                                {!availableNewEvaluators.length && (
                                  <p className="mt-3 text-sm text-red-700">
                                    Não há avaliadores disponíveis para
                                    substituição.
                                  </p>
                                )}
                              </form>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {needsThirdEvaluator && (
                      <form
                        action={assignThirdEvaluator}
                        className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5"
                      >
                        <input
                          type="hidden"
                          name="submissionId"
                          value={submission.id}
                        />

                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 size-5 text-amber-700" />

                          <div>
                            <p className="font-semibold text-amber-900">
                              Necessita terceiro avaliador
                            </p>

                            <p className="mt-1 text-sm leading-6 text-amber-800">
                              Houve divergência igual ou superior a 2,0 pontos
                              entre as duas avaliações. Selecione um terceiro
                              avaliador para desempate técnico.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                          <SelectField
                            id={`thirdEvaluatorId-${submission.id}`}
                            name="thirdEvaluatorId"
                            label="Terceiro avaliador"
                            options={availableNewEvaluators}
                          />

                          <Button
                            type="submit"
                            className="bg-amber-700 hover:bg-amber-800"
                            disabled={
                              !availableNewEvaluators.length
                            }
                          >
                            <UserPlus className="size-4" />
                            Atribuir terceiro avaliador
                          </Button>
                        </div>

                        {!availableNewEvaluators.length && (
                          <p className="mt-3 text-sm text-red-700">
                            Não há avaliadores disponíveis para terceiro
                            parecer.
                          </p>
                        )}
                      </form>
                    )}

                    {!alreadyAssigned &&
                      submission.status ===
                        "approved_for_evaluation" && (
                        <form
                          action={assignEvaluators}
                          className="mt-5 rounded-3xl border border-[#d9e8ef] bg-white p-5"
                        >
                          <input
                            type="hidden"
                            name="submissionId"
                            value={submission.id}
                          />

                          <div>
                            <p className="font-semibold text-[#102a3d]">
                              Selecionar avaliadores
                            </p>

                            <p className="mt-1 text-sm leading-6 text-[#5f7d90]">
                              Escolha dois avaliadores diferentes para este
                              trabalho.
                            </p>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <SelectField
                              id={`evaluatorOneId-${submission.id}`}
                              name="evaluatorOneId"
                              label="Primeiro avaliador"
                              options={evaluatorListWithCounts}
                            />

                            <SelectField
                              id={`evaluatorTwoId-${submission.id}`}
                              name="evaluatorTwoId"
                              label="Segundo avaliador"
                              options={evaluatorListWithCounts}
                            />
                          </div>

                          <div className="mt-4 flex justify-end">
                            <Button
                              type="submit"
                              className="bg-[#245b7a] hover:bg-[#173f59]"
                              disabled={evaluatorListWithCounts.length < 2}
                            >
                              <Send className="size-4" />
                              Distribuir para avaliação
                            </Button>
                          </div>

                          {evaluatorListWithCounts.length < 2 && (
                            <p className="mt-3 text-sm text-red-700">
                              É necessário ter pelo menos dois avaliadores
                              ativos.
                            </p>
                          )}
                        </form>
                      )}
                  </div>
                );
              })}
            </div>
          )}
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
  warning?: boolean;
};

function MetricCard({
  label,
  value,
  description,
  warning = false,
}: MetricCardProps) {
  return (
    <div
      className={
        warning
          ? "rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm"
          : "rounded-3xl border border-[#d9e8ef] bg-white p-6 shadow-sm"
      }
    >
      <p
        className={
          warning
            ? "text-sm font-medium text-amber-800"
            : "text-sm font-medium text-[#5f7d90]"
        }
      >
        {label}
      </p>

      <p
        className={
          warning
            ? "mt-3 text-4xl font-bold text-amber-900"
            : "mt-3 text-4xl font-bold text-[#102a3d]"
        }
      >
        {value}
      </p>

      <p
        className={
          warning
            ? "mt-3 text-sm leading-6 text-amber-800"
            : "mt-3 text-sm leading-6 text-[#5f7d90]"
        }
      >
        {description}
      </p>
    </div>
  );
}

type SelectFieldProps = {
  id: string;
  name: string;
  label: string;
  options: Evaluator[];
};

function SelectField({
  id,
  name,
  label,
  options,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-[#102a3d]"
      >
        {label}
      </label>

      <select
        id={id}
        name={name}
        defaultValue=""
        required
        className="flex h-11 w-full rounded-md border border-[#d9e8ef] bg-white px-3 py-2 text-sm text-[#102a3d] outline-none transition focus:border-[#245b7a] focus:ring-4 focus:ring-[#245b7a]/10"
      >
        <option value="" disabled>
          Selecione
        </option>

        {options.map((evaluator) => {
          const activeAssignmentsCount =
            evaluator.activeAssignmentsCount ?? 0;

          return (
            <option
              key={evaluator.id}
              value={evaluator.id}
            >
              {evaluator.full_name} — {activeAssignmentsCount} atribuído(s)
            </option>
          );
        })}
      </select>
    </div>
  );
}