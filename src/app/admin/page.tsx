import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FileText,
  Settings2,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type SubmissionStatusCount = {
  status: string;
};

function countByStatus(
  submissions: SubmissionStatusCount[],
  statuses: string[]
) {
  return submissions.filter((submission) =>
    statuses.includes(submission.status)
  ).length;
}

export default async function AdminPage() {
  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/acesso-negado");
  }

  const { data: submissionsData, error: submissionsError } =
    await supabase
      .from("submissions")
      .select("status");

  if (submissionsError) {
    console.error("Erro ao carregar resumo de submissões:", {
      message: submissionsError.message,
      details: submissionsError.details,
      hint: submissionsError.hint,
      code: submissionsError.code,
    });
  }

  const submissions =
    (submissionsData ?? []) as SubmissionStatusCount[];

  const totalSubmissions = submissions.length;

  const pendingDocumentReview = countByStatus(submissions, [
    "submitted",
    "resubmitted",
    "under_document_review",
  ]);

  const approvedForEvaluation = countByStatus(submissions, [
    "approved_for_evaluation",
  ]);

  const underEvaluation = countByStatus(submissions, [
    "under_evaluation",
    "one_evaluation_completed",
    "evaluations_completed",
    "third_evaluator_required",
    "evaluator_replacement_required",
  ]);

  const needsAdminAction = countByStatus(submissions, [
    "third_evaluator_required",
    "evaluator_replacement_required",
  ]);

  const selectedOral = countByStatus(submissions, [
    "selected_oral",
  ]);

  const selectedBanner = countByStatus(submissions, [
    "selected_banner",
  ]);

  const notSelected = countByStatus(submissions, [
    "not_selected",
  ]);

  const finalResults =
    selectedOral + selectedBanner + notSelected;

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
              Olá, Administrador da Jornada
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Acompanhe submissões, análise documental, distribuição de
              avaliações, critérios científicos, avaliadores e classificação dos
              trabalhos.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-medium text-white/70">
              Resumo geral
            </p>

            <div className="mt-5 grid gap-4">
              <HeroMetric
                label="Total de trabalhos"
                value={totalSubmissions}
              />

              <HeroMetric
                label="Em análise documental"
                value={pendingDocumentReview}
              />

              <HeroMetric
                label="Ação necessária"
                value={needsAdminAction}
              />
            </div>
          </div>
        </div>
      </section>

      {needsAdminAction > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

            <Button
              asChild
              className="bg-amber-700 hover:bg-amber-800"
            >
              <Link href="/admin/avaliacoes">
                Resolver pendências
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total de trabalhos"
          value={totalSubmissions}
          description="Submissões cadastradas na plataforma."
        />

        <MetricCard
          label="Análise documental"
          value={pendingDocumentReview}
          description="Trabalhos aguardando conferência."
        />

        <MetricCard
          label="Em avaliação"
          value={underEvaluation}
          description={`${approvedForEvaluation} pronto(s) para distribuir.`}
        />

        <MetricCard
          label="Ação necessária"
          value={needsAdminAction}
          description="Terceiro avaliador ou substituição."
          warning={needsAdminAction > 0}
        />

        <MetricCard
          label="Resultado definido"
          value={finalResults}
          description={`${selectedOral} oral, ${selectedBanner} banner e ${notSelected} não selecionado(s).`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AdminActionCard
          icon={<FileText className="size-5" />}
          title="Submissões"
          description="Acesse os trabalhos enviados pelos alunos, confira documentos, aprove para avaliação ou solicite correções."
          href="/admin/submissoes"
          buttonLabel="Ver submissões"
        />

        <AdminActionCard
          icon={<ClipboardCheck className="size-5" />}
          title="Avaliações"
          description="Distribua trabalhos aprovados para avaliadores, acompanhe o andamento das avaliações, selecione substitutos e indique terceiro avaliador quando necessário."
          href="/admin/avaliacoes"
          buttonLabel="Distribuir avaliações"
          warning={needsAdminAction > 0}
        />

        <AdminActionCard
          icon={<UserPlus className="size-5" />}
          title="Avaliadores"
          description="Consulte os professores avaliadores cadastrados e copie o link permanente do formulário de cadastro exclusivo."
          href="/admin/avaliadores"
          buttonLabel="Gerenciar avaliadores"
        />

        <AdminActionCard
          icon={<Settings2 className="size-5" />}
          title="Critérios"
          description="Configure os critérios científicos, pontuação máxima e ordem do formulário usado pelos avaliadores."
          href="/admin/criterios"
          buttonLabel="Gerenciar critérios"
        />

        <div className="lg:col-span-2">
          <AdminActionCard
            icon={<BarChart3 className="size-5" />}
            title="Resultados"
            description="Consulte o ranking geral, médias finais e a classificação automática para apresentação oral, banner e não selecionados."
            href="/admin/resultados"
            buttonLabel="Ver resultados"
          />
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

type AdminActionCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  warning?: boolean;
};

function AdminActionCard({
  icon,
  title,
  description,
  href,
  buttonLabel,
  warning = false,
}: AdminActionCardProps) {
  return (
    <div
      className={
        warning
          ? "rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm"
          : "rounded-[2rem] border border-[#d9e8ef] bg-white p-6 shadow-sm"
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={
            warning
              ? "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700"
              : "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]"
          }
        >
          {icon}
        </div>

        <div>
          <h2
            className={
              warning
                ? "text-xl font-bold text-amber-900"
                : "text-xl font-bold text-[#102a3d]"
            }
          >
            {title}
          </h2>

          <p
            className={
              warning
                ? "mt-2 text-sm leading-6 text-amber-800"
                : "mt-2 text-sm leading-6 text-[#5f7d90]"
            }
          >
            {description}
          </p>
        </div>
      </div>

      <Button
        asChild
        className={
          warning
            ? "mt-6 w-full bg-amber-700 hover:bg-amber-800"
            : "mt-6 w-full bg-[#245b7a] hover:bg-[#173f59]"
        }
      >
        <Link href={href}>
          {buttonLabel}
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}