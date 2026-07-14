import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  MessageSquareWarning,
  PlayCircle,
  ShieldCheck,
  Star,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";
import {
  approveForEvaluation,
  requestCorrections,
  startDocumentReview,
} from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type AdminSubmissionPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

type EvaluationAssignment = {
  id: string;
  status: string;
  evaluator_id: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
};

type EvaluatorProfile = {
  id: string;
  full_name: string;
  email: string;
};

type EvaluationResponse = {
  id: string;
  assignment_id: string;
  criterion_id: string;
  score_option_id: string;
  score: number;
  evaluation_criteria:
    | {
        id: string;
        name: string;
        max_score: number;
        display_order: number;
      }
    | {
        id: string;
        name: string;
        max_score: number;
        display_order: number;
      }[]
    | null;
  evaluation_score_options:
    | {
        id: string;
        label: string;
        percentage: number;
      }
    | {
        id: string;
        label: string;
        percentage: number;
      }[]
    | null;
};

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    submitted: "Submetido",
    under_document_review: "Em conferência documental",
    correction_requested: "Correção solicitada",
    resubmitted: "Reenviado para conferência",
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
    draft:
      "border-slate-300 bg-slate-50 text-slate-700",
    submitted:
      "border-slate-300 bg-slate-50 text-slate-700",
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
    evaluations_completed:
      "border-green-300 bg-green-50 text-green-800",
    third_evaluator_required:
      "border-amber-300 bg-amber-50 text-amber-800",
    evaluator_replacement_required:
      "border-red-300 bg-red-50 text-red-800",
    pending_confirmation:
      "border-amber-300 bg-amber-50 text-amber-800",
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
    "border-[#d9e8ef] bg-white text-[#102a3d]"
  );
}

function formatAssignmentStatus(status: string) {
  const labels: Record<string, string> = {
    assigned: "Atribuída",
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

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(
      size /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(new Date(date));
}

function formatScore(score: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(score);
}

function getRelationItem<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function AdminSubmissionPage({
  params,
  searchParams,
}: AdminSubmissionPageProps) {
  const { id } = await params;
  const messages = await searchParams;

  const { profile, supabase } =
    await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(
      profile.role
    )
  ) {
    redirect("/login");
  }

  const {
    data: submission,
    error,
  } = await supabase
    .from("submissions")
    .select(`
      id,
      title,
      protocol,
      status,
      total_authors,
      requires_ethics_approval,
      created_at,
      updated_at,
      document_review_notes,
      document_reviewed_at,
      document_reviewed_by,

      submission_categories (
        name
      ),

      submission_authors (
        id,
        full_name,
        email,
        author_role,
        display_order
      ),

      submission_files (
        id,
        file_type,
        original_filename,
        mime_type,
        size_bytes,
        version_number,
        is_current,
        created_at
      ),

      submission_declarations (
        accepted_general_terms,
        accepted_ethics_terms,
        accepted_originality_terms,
        general_terms_accepted_at,
        ethics_terms_accepted_at,
        originality_terms_accepted_at
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao carregar submissão administrativa:",
      error
    );
  }

  if (!submission) {
    notFound();
  }

  const {
    data: evaluationAssignmentsData,
    error: evaluationAssignmentsError,
  } = await supabase
    .from("evaluation_assignments")
    .select(`
      id,
      status,
      evaluator_id,
      assigned_at,
      started_at,
      completed_at
    `)
    .eq("submission_id", id)
    .order("assigned_at", {
      ascending: true,
    });

  if (evaluationAssignmentsError) {
    console.error("Erro ao carregar avaliações científicas:", {
      message: evaluationAssignmentsError.message,
      details: evaluationAssignmentsError.details,
      hint: evaluationAssignmentsError.hint,
      code: evaluationAssignmentsError.code,
    });
  }

  const evaluationAssignments =
    (evaluationAssignmentsData ?? []) as EvaluationAssignment[];

  const assignmentIds = evaluationAssignments.map(
    (assignment) => assignment.id
  );

  const evaluatorIds = [
    ...new Set(
      evaluationAssignments.map(
        (assignment) => assignment.evaluator_id
      )
    ),
  ];

  let evaluatorProfiles: EvaluatorProfile[] = [];

  if (evaluatorIds.length > 0) {
    const {
      data: evaluatorProfilesData,
      error: evaluatorProfilesError,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email
      `)
      .in("id", evaluatorIds);

    if (evaluatorProfilesError) {
      console.error("Erro ao carregar perfis dos avaliadores:", {
        message: evaluatorProfilesError.message,
        details: evaluatorProfilesError.details,
        hint: evaluatorProfilesError.hint,
        code: evaluatorProfilesError.code,
      });
    }

    evaluatorProfiles =
      (evaluatorProfilesData ?? []) as EvaluatorProfile[];
  }

  let evaluationResponses: EvaluationResponse[] = [];

  if (assignmentIds.length > 0) {
    const {
      data: evaluationResponsesData,
      error: evaluationResponsesError,
    } = await supabase
      .from("evaluation_responses")
      .select(`
        id,
        assignment_id,
        criterion_id,
        score_option_id,
        score,

        evaluation_criteria (
          id,
          name,
          max_score,
          display_order
        ),

        evaluation_score_options (
          id,
          label,
          percentage
        )
      `)
      .in("assignment_id", assignmentIds);

    if (evaluationResponsesError) {
      console.error("Erro ao carregar respostas das avaliações:", {
        message: evaluationResponsesError.message,
        details: evaluationResponsesError.details,
        hint: evaluationResponsesError.hint,
        code: evaluationResponsesError.code,
      });
    }

    evaluationResponses =
      (evaluationResponsesData ?? []) as EvaluationResponse[];
  }

  const evaluatorProfileMap = new Map(
    evaluatorProfiles.map((evaluator) => [
      evaluator.id,
      evaluator,
    ])
  );

  const responsesByAssignment = new Map<
    string,
    EvaluationResponse[]
  >();

  for (const response of evaluationResponses) {
    const current =
      responsesByAssignment.get(response.assignment_id) ?? [];

    current.push(response);

    responsesByAssignment.set(
      response.assignment_id,
      current
    );
  }

  const category = Array.isArray(
    submission.submission_categories
  )
    ? submission.submission_categories[0]
    : submission.submission_categories;

  const authors = [
    ...(submission.submission_authors ??
      []),
  ].sort(
    (firstAuthor, secondAuthor) =>
      firstAuthor.display_order -
      secondAuthor.display_order
  );

  const currentFiles = [
    ...(submission.submission_files ??
      []),
  ].filter((file) => file.is_current);

  const identifiedFile =
    currentFiles.find(
      (file) =>
        file.file_type === "identified"
    );

  const anonymousFile =
    currentFiles.find(
      (file) =>
        file.file_type === "anonymous"
    );

  const ethicsFile =
    currentFiles.find(
      (file) =>
        file.file_type ===
        "ethics_approval"
    );

  const advisorDeclaration =
    currentFiles.find(
      (file) =>
        file.file_type ===
        "advisor_declaration"
    );

  const declarationsValue =
    submission.submission_declarations;

  const declarations = Array.isArray(
    declarationsValue
  )
    ? declarationsValue[0]
    : declarationsValue;

  function getDownloadUrl(
    fileId: string
  ) {
    return `/admin/submissoes/${id}/arquivos/${fileId}`;
  }

  const mayStartReview = [
    "submitted",
    "resubmitted",
  ].includes(submission.status);

  const isUnderReview =
    submission.status ===
    "under_document_review";

  const documentChecklist = [
    Boolean(identifiedFile),
    Boolean(anonymousFile),
    Boolean(advisorDeclaration),
    submission.requires_ethics_approval
      ? Boolean(ethicsFile)
      : true,
    Boolean(
      declarations?.accepted_general_terms
    ),
    Boolean(
      declarations?.accepted_ethics_terms
    ),
    Boolean(
      declarations?.accepted_originality_terms
    ),
  ];

  const allDocumentsPresent =
    documentChecklist.every(Boolean);

  const completedAssignments = evaluationAssignments.filter(
    (assignment) => assignment.status === "completed"
  ).length;

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        className="-ml-3 text-[#245b7a] hover:bg-[#eef7fa] hover:text-[#173f59]"
        asChild
      >
        <Link href="/admin/submissoes">
          <ArrowLeft />
          Voltar para submissões
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
              Submissão científica
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                submission.status
              )}`}
            >
              {formatStatus(
                submission.status
              )}
            </span>

            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/75">
              {submission.protocol ??
                "Protocolo não gerado"}
            </span>
          </div>

          <h1 className="mt-6 max-w-5xl text-3xl font-bold tracking-tight sm:text-4xl">
            {submission.title}
          </h1>

          <p className="mt-4 max-w-3xl leading-7 text-white/75">
            Categoria:{" "}
            <span className="font-medium text-white">
              {category?.name ??
                "Não informada"}
            </span>
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <HeroInfo
              label="Autores"
              value={authors.length}
            />

            <HeroInfo
              label="Arquivos atuais"
              value={currentFiles.length}
            />

            <HeroInfo
              label="Avaliações"
              value={evaluationAssignments.length}
            />

            <HeroInfo
              label="Concluídas"
              value={completedAssignments}
            />
          </div>
        </div>
      </section>

      <Card
        id="conferencia-documental"
        className="scroll-mt-28 overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm"
      >
        <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
          <CardTitle className="flex items-center gap-2 text-[#102a3d]">
            <FileCheck2 className="size-5 text-[#245b7a]" />
            Conferência documental
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div
            className={
              allDocumentsPresent
                ? "rounded-3xl border border-green-200 bg-green-50 p-5"
                : "rounded-3xl border border-red-200 bg-red-50 p-5"
            }
          >
            <p
              className={
                allDocumentsPresent
                  ? "font-semibold text-green-900"
                  : "font-semibold text-red-800"
              }
            >
              {allDocumentsPresent
                ? "Documentação obrigatória localizada"
                : "Existem pendências documentais"}
            </p>

            <p
              className={
                allDocumentsPresent
                  ? "mt-2 text-sm leading-6 text-green-800"
                  : "mt-2 text-sm leading-6 text-red-700"
              }
            >
              {allDocumentsPresent
                ? "Os arquivos e termos obrigatórios estão registrados no sistema."
                : "Confira os documentos e declarações pendentes antes de aprovar o trabalho."}
            </p>
          </div>

          {mayStartReview && (
            <div className="rounded-3xl border border-[#d9e8ef] bg-[#eef7fa] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-[#5f7d90]">
                  Após conferir autores, arquivos e declarações, inicie a
                  conferência documental.
                </p>

                <form
                  action={
                    startDocumentReview
                  }
                >
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="bg-[#245b7a] hover:bg-[#173f59]"
                  >
                    <PlayCircle />
                    Iniciar conferência documental
                  </Button>
                </form>
              </div>
            </div>
          )}

          {!mayStartReview &&
            !isUnderReview && (
              <p className="text-sm leading-6 text-[#5f7d90]">
                Situação atual:{" "}
                <strong className="text-[#102a3d]">
                  {formatStatus(
                    submission.status
                  )}
                </strong>
                .
              </p>
            )}
        </CardContent>
      </Card>

      {evaluationAssignments.length > 0 && (
        <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
          <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
            <CardTitle className="flex items-center gap-2 text-[#102a3d]">
              <Star className="size-5 text-[#245b7a]" />
              Avaliações científicas
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            {evaluationAssignments.map((assignment) => {
              const evaluator =
                evaluatorProfileMap.get(assignment.evaluator_id);

              const responses = [
                ...(responsesByAssignment.get(assignment.id) ?? []),
              ].sort((firstResponse, secondResponse) => {
                const firstCriterion = getRelationItem(
                  firstResponse.evaluation_criteria
                );

                const secondCriterion = getRelationItem(
                  secondResponse.evaluation_criteria
                );

                return (
                  Number(firstCriterion?.display_order ?? 0) -
                  Number(secondCriterion?.display_order ?? 0)
                );
              });

              const totalScore = responses.reduce(
                (total, response) =>
                  total + Number(response.score),
                0
              );

              return (
                <EvaluationAssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  evaluator={evaluator}
                  responses={responses}
                  totalScore={totalScore}
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
        <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
          <CardTitle className="flex items-center gap-2 text-[#102a3d]">
            <Users className="size-5 text-[#245b7a]" />
            Autores do trabalho
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 p-6">
          {authors.map((author) => (
            <div
              key={author.id}
              className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]">
                  <UserRound className="size-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#102a3d]">
                      {author.full_name}
                    </p>

                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[#245b7a]">
                      {
                        author.display_order
                      }
                      º autor
                    </span>

                    {author.author_role ===
                      "responsible" && (
                      <span className="rounded-full border border-[#b9d4df] bg-white px-3 py-1 text-xs text-[#5f7d90]">
                        Autor responsável
                      </span>
                    )}

                    {author.author_role ===
                      "advisor" && (
                      <span className="rounded-full border border-[#b9d4df] bg-white px-3 py-1 text-xs text-[#5f7d90]">
                        Orientador
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-[#5f7d90]">
                    {author.email}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
          <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
            <CardTitle className="flex items-center gap-2 text-[#102a3d]">
              <FileText className="size-5 text-[#245b7a]" />
              Arquivos do trabalho
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            <DocumentCard
              title="Versão identificada"
              file={identifiedFile}
              downloadUrl={
                identifiedFile
                  ? getDownloadUrl(
                      identifiedFile.id
                    )
                  : null
              }
            />

            <DocumentCard
              title="Versão anonimizada"
              file={anonymousFile}
              downloadUrl={
                anonymousFile
                  ? getDownloadUrl(
                      anonymousFile.id
                    )
                  : null
              }
            />

            <DocumentCard
              title="Declaração do orientador"
              file={advisorDeclaration}
              downloadUrl={
                advisorDeclaration
                  ? getDownloadUrl(
                      advisorDeclaration.id
                    )
                  : null
              }
            />

            {submission.requires_ethics_approval && (
              <DocumentCard
                title="Parecer consubstanciado do CEP"
                file={ethicsFile}
                downloadUrl={
                  ethicsFile
                    ? getDownloadUrl(
                        ethicsFile.id
                      )
                    : null
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
            <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
              <CardTitle className="flex items-center gap-2 text-[#102a3d]">
                <FileCheck2 className="size-5 text-[#245b7a]" />
                Aspectos éticos
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-6">
              <InfoBox
                title="Necessidade de aprovação pelo CEP"
                description={
                  submission.requires_ethics_approval
                    ? "O autor declarou que o trabalho necessita de aprovação do Comitê de Ética em Pesquisa."
                    : "O autor declarou que o trabalho não necessita de aprovação do Comitê de Ética em Pesquisa."
                }
              />

              {submission.requires_ethics_approval && (
                <InfoBox
                  title="Documento comprobatório"
                  description={
                    ethicsFile
                      ? "Parecer consubstanciado enviado."
                      : "Parecer consubstanciado pendente."
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
            <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
              <CardTitle className="flex items-center gap-2 text-[#102a3d]">
                <ShieldCheck className="size-5 text-[#245b7a]" />
                Declarações aceitas
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 p-6">
              <DeclarationItem
                label="Ciência e concordância com o edital"
                accepted={
                  declarations
                    ?.accepted_general_terms ??
                  false
                }
              />

              <DeclarationItem
                label="Responsabilidade pelos aspectos éticos"
                accepted={
                  declarations
                    ?.accepted_ethics_terms ??
                  false
                }
              />

              <DeclarationItem
                label="Declaração de ineditismo"
                accepted={
                  declarations
                    ?.accepted_originality_terms ??
                  false
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {isUnderReview && (
        <Card
          id="decisao-conferencia"
          className="scroll-mt-28 overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm"
        >
          <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
            <CardTitle className="flex items-center gap-2 text-[#102a3d]">
              <CheckCircle2 className="size-5 text-[#245b7a]" />
              Decisão da conferência documental
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 p-6">
            <div
              className={
                allDocumentsPresent
                  ? "rounded-3xl border border-green-200 bg-green-50 p-5"
                  : "rounded-3xl border border-red-200 bg-red-50 p-5"
              }
            >
              <p
                className={
                  allDocumentsPresent
                    ? "font-semibold text-green-900"
                    : "font-semibold text-red-800"
                }
              >
                {allDocumentsPresent
                  ? "Documentação obrigatória localizada"
                  : "Existem pendências documentais"}
              </p>

              <p
                className={
                  allDocumentsPresent
                    ? "mt-2 text-sm leading-6 text-green-800"
                    : "mt-2 text-sm leading-6 text-red-700"
                }
              >
                {allDocumentsPresent
                  ? "Após conferir autores, arquivos e declarações, escolha se o trabalho será aprovado para avaliação científica ou se deverá retornar ao aluno para correções."
                  : "Confira os documentos e declarações pendentes. A aprovação ficará bloqueada até que toda a documentação obrigatória esteja localizada."}
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <form
                action={requestCorrections}
                className="space-y-4 rounded-3xl border border-red-200 bg-red-50 p-5"
              >
                <input
                  type="hidden"
                  name="submissionId"
                  value={submission.id}
                />

                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-red-900">
                    <MessageSquareWarning className="size-5" />
                    Solicitar correções
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-red-800">
                    Informe de forma objetiva o que o aluno deverá corrigir.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">
                    Orientações para correção
                  </Label>

                  <textarea
                    id="notes"
                    name="notes"
                    minLength={10}
                    maxLength={3000}
                    rows={7}
                    required
                    placeholder="Exemplo: substituir a versão anonimizada, pois o arquivo contém identificação dos autores..."
                    className="flex min-h-32 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  />
                </div>

                <Button
                  type="submit"
                  variant="destructive"
                  className="w-full"
                >
                  Solicitar correções ao aluno
                </Button>
              </form>

              <form
                action={approveForEvaluation}
                className="space-y-4 rounded-3xl border border-green-200 bg-green-50 p-5"
              >
                <input
                  type="hidden"
                  name="submissionId"
                  value={submission.id}
                />

                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-green-900">
                    <CheckCircle2 className="size-5" />
                    Aprovar documentação
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-green-800">
                    Encaminhe o trabalho para a etapa de avaliação científica.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approvalNotes">
                    Observação, opcional
                  </Label>

                  <textarea
                    id="approvalNotes"
                    name="approvalNotes"
                    maxLength={3000}
                    rows={7}
                    placeholder="Registre uma observação interna, caso necessário."
                    className="flex min-h-32 w-full rounded-xl border border-green-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-800"
                  disabled={!allDocumentsPresent}
                >
                  Aprovar para avaliação científica
                </Button>

                {!allDocumentsPresent && (
                  <p className="text-xs leading-5 text-red-700">
                    A aprovação está bloqueada porque existem documentos ou
                    declarações pendentes.
                  </p>
                )}
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {submission.document_review_notes && (
        <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
          <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
            <CardTitle className="text-[#102a3d]">
              Observação da conferência
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <p className="whitespace-pre-wrap text-sm leading-6 text-[#4a6678]">
              {
                submission.document_review_notes
              }
            </p>

            {submission.document_reviewed_at && (
              <p className="mt-4 text-xs text-[#5f7d90]">
                Registrada em{" "}
                {formatDate(
                  submission.document_reviewed_at
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type HeroInfoProps = {
  label: string;
  value: number;
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

      <p className="mt-2 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

type InfoBoxProps = {
  title: string;
  description: string;
};

function InfoBox({
  title,
  description,
}: InfoBoxProps) {
  return (
    <div className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
      <p className="font-semibold text-[#102a3d]">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
        {description}
      </p>
    </div>
  );
}

type EvaluationAssignmentCardProps = {
  assignment: EvaluationAssignment;
  evaluator: EvaluatorProfile | undefined;
  responses: EvaluationResponse[];
  totalScore: number;
};

function EvaluationAssignmentCard({
  assignment,
  evaluator,
  responses,
  totalScore,
}: EvaluationAssignmentCardProps) {
  return (
    <div className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getAssignmentStatusClass(
                assignment.status
              )}`}
            >
              {formatAssignmentStatus(assignment.status)}
            </span>

            {assignment.completed_at && (
              <span className="rounded-full bg-white px-3 py-1 text-xs text-[#5f7d90]">
                Concluída em{" "}
                {formatDate(assignment.completed_at)}
              </span>
            )}
          </div>

          <p className="mt-3 font-semibold text-[#102a3d]">
            {evaluator?.full_name ??
              "Avaliador não localizado"}
          </p>

          <p className="mt-1 text-sm text-[#5f7d90]">
            {evaluator?.email ??
              assignment.evaluator_id}
          </p>
        </div>

        <div className="rounded-2xl border border-[#d9e8ef] bg-white p-4 lg:min-w-44">
          <p className="text-xs text-[#5f7d90]">
            Nota total
          </p>

          <p className="mt-1 text-2xl font-bold text-[#102a3d]">
            {responses.length
              ? formatScore(totalScore)
              : "—"}
          </p>
        </div>
      </div>

      {!responses.length ? (
        <div className="mt-4 rounded-3xl border border-dashed border-[#b9d4df] bg-white p-4">
          <p className="text-sm text-[#5f7d90]">
            Ainda não há respostas registradas para esta avaliação.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-3xl border border-[#d9e8ef] bg-white">
          <div className="grid grid-cols-12 bg-[#eef7fa] px-4 py-3 text-xs font-medium text-[#5f7d90]">
            <div className="col-span-12 md:col-span-5">
              Critério
            </div>

            <div className="col-span-12 mt-2 md:col-span-4 md:mt-0">
              Opção selecionada
            </div>

            <div className="col-span-12 mt-2 md:col-span-3 md:mt-0 md:text-right">
              Pontuação
            </div>
          </div>

          <div className="divide-y divide-[#d9e8ef]">
            {responses.map((response) => {
              const criterion = getRelationItem(
                response.evaluation_criteria
              );

              const option = getRelationItem(
                response.evaluation_score_options
              );

              const maxScore = Number(
                criterion?.max_score ?? 0
              );

              return (
                <div
                  key={response.id}
                  className="grid grid-cols-12 px-4 py-4 text-sm"
                >
                  <div className="col-span-12 md:col-span-5">
                    <p className="font-medium text-[#102a3d]">
                      {criterion?.name ??
                        "Critério não localizado"}
                    </p>
                  </div>

                  <div className="col-span-12 mt-2 text-[#5f7d90] md:col-span-4 md:mt-0">
                    {option?.label ??
                      "Opção não localizada"}
                  </div>

                  <div className="col-span-12 mt-2 md:col-span-3 md:mt-0 md:text-right">
                    <span className="font-medium text-[#102a3d]">
                      {formatScore(
                        Number(response.score)
                      )}
                    </span>

                    {maxScore > 0 && (
                      <span className="text-[#5f7d90]">
                        {" "}
                        / {formatScore(maxScore)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type DocumentCardProps = {
  title: string;

  file:
    | {
        id: string;
        original_filename: string;
        size_bytes: number;
        version_number: number;
      }
    | null
    | undefined;

  downloadUrl: string | null;
};

function DocumentCard({
  title,
  file,
  downloadUrl,
}: DocumentCardProps) {
  return (
    <div className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-[#102a3d]">
            {title}
          </p>

          {file ? (
            <>
              <p className="mt-1 break-all text-sm text-[#5f7d90]">
                {file.original_filename}
              </p>

              <p className="mt-1 text-xs text-[#5f7d90]">
                {formatFileSize(
                  file.size_bytes
                )}
                {" · "}
                Versão{" "}
                {file.version_number}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-red-700">
              Documento pendente.
            </p>
          )}
        </div>

        <span
          className={
            file
              ? "w-fit rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-800"
              : "w-fit rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
          }
        >
          {file ? "Enviado" : "Pendente"}
        </span>
      </div>

      {file && downloadUrl && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
          asChild
        >
          <Link href={downloadUrl}>
            <Download />
            Baixar arquivo
          </Link>
        </Button>
      )}
    </div>
  );
}

type DeclarationItemProps = {
  label: string;
  accepted: boolean;
};

function DeclarationItem({
  label,
  accepted,
}: DeclarationItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
      <p className="text-sm leading-6 text-[#4a6678]">
        {label}
      </p>

      <span
        className={
          accepted
            ? "shrink-0 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-800"
            : "shrink-0 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-800"
        }
      >
        {accepted
          ? "Aceita"
          : "Pendente"}
      </span>
    </div>
  );
}