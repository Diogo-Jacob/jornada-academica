import { redirect } from "next/navigation";
import {
  ClipboardCheck,
  PlusCircle,
  Scale,
  Stethoscope,
} from "lucide-react";
import { CriteriaBoard } from "./criteria-board";
import { CreateCriterionForm } from "./create-criterion-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type AdminCriteriosPageProps = {
  searchParams: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

type ScoreOption = {
  id: string;
  label: string;
  percentage: number;
  display_order: number;
  is_active: boolean;
};

type Criterion = {
  id: string;
  name: string;
  description: string | null;
  max_score: number;
  display_order: number;
  is_active: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function AdminCriteriosPage({
  searchParams,
}: AdminCriteriosPageProps) {
  const messages = await searchParams;

  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/acesso-negado");
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, name, year")
    .eq("is_public", true)
    .order("year", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (eventError) {
    console.error("Erro ao carregar evento:", {
      message: eventError.message,
      details: eventError.details,
      hint: eventError.hint,
      code: eventError.code,
    });
  }

  const { data: criteria, error: criteriaError } = event
    ? await supabase
        .from("evaluation_criteria")
        .select(`
          id,
          name,
          description,
          max_score,
          display_order,
          is_active
        `)
        .eq("event_id", event.id)
        .order("display_order", {
          ascending: true,
        })
    : {
        data: null,
        error: null,
      };

  if (criteriaError) {
    console.error("Erro ao carregar critérios:", {
      message: criteriaError.message,
      details: criteriaError.details,
      hint: criteriaError.hint,
      code: criteriaError.code,
    });
  }

  const { data: scoreOptions, error: scoreOptionsError } =
    await supabase
      .from("evaluation_score_options")
      .select(`
        id,
        label,
        percentage,
        display_order,
        is_active
      `)
      .eq("is_active", true)
      .order("display_order", {
        ascending: true,
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

  const allCriteriaList = (criteria ?? []) as Criterion[];

  const activeCriteriaList = allCriteriaList.filter(
    (criterion) => criterion.is_active
  );

  const scoreOptionList =
    (scoreOptions ?? []) as ScoreOption[];

  const totalMaxScore = activeCriteriaList.reduce(
    (total, criterion) =>
      total + Number(criterion.max_score),
    0
  );

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
              Critérios de avaliação
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Cadastre os critérios científicos, defina a pontuação máxima de
              cada item e organize a ordem do formulário usado pelos
              avaliadores.
            </p>

            {event && (
              <p className="mt-4 w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80">
                Evento atual:{" "}
                <strong className="text-white">
                  {event.name} — {event.year}
                </strong>
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-medium text-white/70">
              Resumo dos critérios
            </p>

            <div className="mt-5 grid gap-4">
              <HeroMetric
                label="Critérios cadastrados"
                value={allCriteriaList.length}
              />

              <HeroMetric
                label="Critérios ativos"
                value={activeCriteriaList.length}
              />

              <HeroMetric
                label="Pontuação máxima"
                value={formatNumber(totalMaxScore)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Critérios cadastrados"
          value={allCriteriaList.length}
          description="Total de critérios já cadastrados para o evento."
        />

        <MetricCard
          label="Critérios ativos"
          value={activeCriteriaList.length}
          description="Critérios disponíveis para os avaliadores."
        />

        <MetricCard
          label="Pontuação máxima total"
          value={formatNumber(totalMaxScore)}
          description="Soma da pontuação máxima dos critérios ativos."
        />
      </section>

      {!event && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="text-center text-sm leading-6 text-red-700">
            Nenhum evento público foi localizado. Crie ou publique um evento
            antes de cadastrar critérios.
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <div className="border-b border-[#d9e8ef] bg-[#f7fbfd] p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#102a3d]">
            <Scale className="size-5 text-[#245b7a]" />
            Escala padrão de respostas
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
            Estas opções são aplicadas automaticamente a todos os critérios de
            avaliação.
          </p>
        </div>

        <div className="p-6">
          {!scoreOptionList.length ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
              Nenhuma opção padrão foi encontrada. Execute o SQL de
              configuração da escala.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {scoreOptionList.map((option) => (
                <div
                  key={option.id}
                  className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5"
                >
                  <span className="rounded-full border border-[#b9d4df] bg-white px-3 py-1 text-xs font-medium text-[#245b7a]">
                    {formatNumber(Number(option.percentage))}%
                  </span>

                  <p className="mt-4 font-semibold text-[#102a3d]">
                    {option.label}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#5f7d90]">
                    Aplicado automaticamente a todos os critérios.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {event && (
        <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
          <div className="border-b border-[#d9e8ef] bg-[#f7fbfd] p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#102a3d]">
              <PlusCircle className="size-5 text-[#245b7a]" />
              Novo critério
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
              Cadastre um novo item que será exibido no formulário do avaliador.
            </p>
          </div>

          <div className="p-6">
            <CreateCriterionForm />
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b7a]">
            Organização
          </p>

          <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#102a3d]">
            <ClipboardCheck className="size-6 text-[#245b7a]" />
            Critérios cadastrados
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
            Organize a ordem dos critérios e revise a pontuação de cada item.
          </p>
        </div>

        <CriteriaBoard
          criteria={activeCriteriaList}
          scoreOptions={scoreOptionList}
        />
      </section>
    </div>
  );
}

type HeroMetricProps = {
  label: string;
  value: number | string;
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
  value: number | string;
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