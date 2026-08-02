import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  LinkIcon,
  Stethoscope,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { CopyInviteLinkButton } from "./copy-invite-link-button";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type AdminAvaliadoresPageProps = {
  searchParams: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

type Evaluator = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
};

export default async function AdminAvaliadoresPage({
  searchParams,
}: AdminAvaliadoresPageProps) {
  const messages = await searchParams;

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol =
    process.env.NODE_ENV === "development"
      ? "http"
      : "https";

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (host ? `${protocol}://${host}` : "");

  const evaluatorRegisterLink =
    `${baseUrl}/avaliador/cadastro`;

  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/acess-negado");
  }

  const {
    data: evaluatorsData,
    error: evaluatorsError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      is_active
    `)
    .eq("role", "evaluator")
    .order("full_name", {
      ascending: true,
    });

  if (evaluatorsError) {
    console.error("Erro ao carregar avaliadores:", {
      message: evaluatorsError.message,
      details: evaluatorsError.details,
      hint: evaluatorsError.hint,
      code: evaluatorsError.code,
    });
  }

  const evaluators =
    (evaluatorsData ?? []) as Evaluator[];

  const activeEvaluators = evaluators.filter(
    (evaluator) => evaluator.is_active
  ).length;

  const inactiveEvaluators = evaluators.filter(
    (evaluator) => !evaluator.is_active
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
              Avaliadores
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Compartilhe o formulário permanente de cadastro com os
              professores avaliadores e acompanhe os perfis cadastrados na
              plataforma.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-medium text-white/70">
              Resumo dos avaliadores
            </p>

            <div className="mt-5 grid gap-4">
              <HeroMetric
                label="Avaliadores ativos"
                value={activeEvaluators}
              />

              <HeroMetric
                label="Avaliadores inativos"
                value={inactiveEvaluators}
              />

              <HeroMetric
                label="Total cadastrado"
                value={evaluators.length}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Avaliadores ativos"
          value={activeEvaluators}
          description="Professores disponíveis para receber avaliações."
        />

        <MetricCard
          label="Avaliadores inativos"
          value={inactiveEvaluators}
          description="Cadastros existentes, mas sem acesso ativo."
        />

        <MetricCard
          label="Total cadastrado"
          value={evaluators.length}
          description="Quantidade geral de avaliadores registrados."
        />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <div className="border-b border-[#d9e8ef] bg-[#f7fbfd] p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#102a3d]">
            <LinkIcon className="size-5 text-[#245b7a]" />
            Link permanente de cadastro
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
            Envie este link aos professores convidados para que eles realizem o
            cadastro como avaliadores.
          </p>
        </div>

        <div className="p-6">
          <div className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
            <p className="font-semibold text-[#102a3d]">
              Formulário exclusivo para avaliadores
            </p>

            <p className="mt-2 break-all rounded-2xl bg-white p-4 text-sm leading-6 text-[#5f7d90]">
              {evaluatorRegisterLink}
            </p>

            <div className="mt-4">
              <CopyInviteLinkButton
                link={evaluatorRegisterLink}
              />
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#5f7d90]">
            Copie este link e envie manualmente por e-mail ou WhatsApp aos
            professores convidados para atuar como avaliadores.
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#d9e8ef] bg-[#f7fbfd] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b7a]">
              Cadastros
            </p>

            <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#102a3d]">
              <UserCheck className="size-6 text-[#245b7a]" />
              Avaliadores cadastrados
            </h2>
          </div>

          <p className="text-sm text-[#5f7d90]">
            {evaluators.length} avaliador(es)
          </p>
        </div>

        <div className="p-6">
          {!evaluators.length ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] px-6 py-14 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
                <UserPlus className="size-7" />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-[#102a3d]">
                Nenhum avaliador cadastrado
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#5f7d90]">
                Quando um professor preencher o formulário de cadastro, ele
                aparecerá nesta lista.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluators.map((evaluator) => (
                <div
                  key={evaluator.id}
                  className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#102a3d]">
                        {evaluator.full_name}
                      </p>

                      <p className="mt-1 break-all text-sm text-[#5f7d90]">
                        {evaluator.email}
                      </p>
                    </div>

                    <span
                      className={
                        evaluator.is_active
                          ? "w-fit rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-800"
                          : "w-fit rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                      }
                    >
                      {evaluator.is_active
                        ? "Ativo"
                        : "Inativo"}
                    </span>
                  </div>
                </div>
              ))}
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