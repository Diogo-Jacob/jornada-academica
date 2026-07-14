import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ClipboardCheck,
  Eye,
  FileText,
  Search,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type SubmissoesAdminPageProps = {
  searchParams: Promise<{
    busca?: string;
    status?: string;
  }>;
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function SubmissoesAdminPage({
  searchParams,
}: SubmissoesAdminPageProps) {
  const filters = await searchParams;

  const search = filters.busca?.trim() ?? "";
  const statusFilter = filters.status?.trim() ?? "";

  const { profile, supabase } =
    await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/login");
  }

  let query = supabase
    .from("submissions")
    .select(`
      id,
      title,
      protocol,
      status,
      created_at,
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
    .neq("status", "draft")
    .order("updated_at", {
      ascending: false,
    });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,protocol.ilike.%${search}%`
    );
  }

  const {
    data: submissions,
    error,
  } = await query;

  if (error) {
    console.error(
      "Erro ao carregar submissões administrativas:",
      error
    );
  }

  const total = submissions?.length ?? 0;

  const submittedCount =
    submissions?.filter(
      (submission) =>
        submission.status === "submitted"
    ).length ?? 0;

  const reviewingCount =
    submissions?.filter((submission) =>
      [
        "under_document_review",
        "correction_requested",
        "resubmitted",
      ].includes(submission.status)
    ).length ?? 0;

  const approvedCount =
    submissions?.filter((submission) =>
      [
        "approved_for_evaluation",
        "under_evaluation",
        "one_evaluation_completed",
        "evaluations_completed",
        "third_evaluator_required",
        "evaluator_replacement_required",
        "selected_oral",
        "selected_banner",
      ].includes(submission.status)
    ).length ?? 0;

  const actionNeededCount =
    submissions?.filter((submission) =>
      [
        "third_evaluator_required",
        "evaluator_replacement_required",
        "correction_requested",
      ].includes(submission.status)
    ).length ?? 0;

  return (
    <div className="space-y-8">
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
              Submissões
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Consulte os trabalhos enviados, acompanhe a conferência
              documental e encaminhe submissões aprovadas para avaliação
              científica.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-medium text-white/70">
              Resumo da listagem
            </p>

            <div className="mt-5 grid gap-4">
              <HeroMetric
                label="Total listado"
                value={total}
              />

              <HeroMetric
                label="Em conferência"
                value={reviewingCount}
              />

              <HeroMetric
                label="Ação necessária"
                value={actionNeededCount}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total listado"
          value={total}
          description="Trabalhos conforme os filtros atuais."
        />

        <MetricCard
          label="Aguardando conferência"
          value={submittedCount}
          description="Submissões recebidas e ainda não analisadas."
        />

        <MetricCard
          label="Em conferência"
          value={reviewingCount}
          description="Trabalhos em análise ou aguardando correção."
        />

        <MetricCard
          label="Encaminhados à avaliação"
          value={approvedCount}
          description="Aprovados ou já em etapa de avaliação."
        />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <div className="border-b border-[#d9e8ef] bg-[#f7fbfd] p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#102a3d]">
            <Search className="size-5 text-[#245b7a]" />
            Filtros
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
            Busque por título, protocolo ou filtre pelo status da submissão.
          </p>
        </div>

        <div className="p-6">
          <form
            method="GET"
            className="grid gap-4 md:grid-cols-[1fr_280px_auto]"
          >
            <Input
              name="busca"
              defaultValue={search}
              placeholder="Buscar por título ou protocolo"
              className="h-11 border-[#d9e8ef] bg-white focus-visible:ring-[#245b7a]/20"
            />

            <select
              name="status"
              defaultValue={statusFilter}
              className="flex h-11 w-full rounded-md border border-[#d9e8ef] bg-white px-3 py-2 text-sm text-[#102a3d] outline-none transition focus:border-[#245b7a] focus:ring-4 focus:ring-[#245b7a]/10"
            >
              <option value="">
                Todos os status
              </option>

              <option value="submitted">
                Submetido
              </option>

              <option value="under_document_review">
                Em conferência documental
              </option>

              <option value="correction_requested">
                Correção solicitada
              </option>

              <option value="resubmitted">
                Reenviado para conferência
              </option>

              <option value="approved_for_evaluation">
                Aprovado para avaliação
              </option>

              <option value="under_evaluation">
                Em avaliação
              </option>

              <option value="one_evaluation_completed">
                Uma avaliação concluída
              </option>

              <option value="third_evaluator_required">
                Necessita terceiro avaliador
              </option>

              <option value="evaluator_replacement_required">
                Substituição de avaliador necessária
              </option>

              <option value="evaluations_completed">
                Avaliações concluídas
              </option>
            </select>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-[#245b7a] hover:bg-[#173f59]"
              >
                Filtrar
              </Button>

              <Button
                variant="outline"
                asChild
                className="border-[#b9d4df] text-[#245b7a] hover:bg-[#eef7fa]"
              >
                <Link href="/admin/submissoes">
                  Limpar
                </Link>
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#d9e8ef] bg-[#f7fbfd] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b7a]">
              Trabalhos
            </p>

            <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#102a3d]">
              <ClipboardCheck className="size-6 text-[#245b7a]" />
              Trabalhos submetidos
            </h2>
          </div>

          <p className="text-sm text-[#5f7d90]">
            {total} trabalho(s) listado(s)
          </p>
        </div>

        <div className="p-6">
          {!submissions?.length ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] px-6 py-14 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
                <FileText className="size-7" />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-[#102a3d]">
                Nenhuma submissão encontrada
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#5f7d90]">
                Não há trabalhos correspondentes aos filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => {
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
                    author.author_role ===
                      "responsible" ||
                    author.display_order === 1
                );

                return (
                  <div
                    key={submission.id}
                    className="group rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#b9d4df] hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                              submission.status
                            )}`}
                          >
                            {formatStatus(
                              submission.status
                            )}
                          </span>

                          {submission.protocol && (
                            <span className="rounded-full bg-white px-3 py-1 text-xs text-[#5f7d90]">
                              {submission.protocol}
                            </span>
                          )}

                          <span className="rounded-full bg-white px-3 py-1 text-xs text-[#5f7d90]">
                            Atualizado em{" "}
                            {formatDate(
                              submission.updated_at
                            )}
                          </span>
                        </div>

                        <h2 className="mt-3 line-clamp-2 font-semibold text-[#102a3d]">
                          {submission.title}
                        </h2>

                        <p className="mt-2 text-sm text-[#5f7d90]">
                          {category?.name ??
                            "Categoria não informada"}
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