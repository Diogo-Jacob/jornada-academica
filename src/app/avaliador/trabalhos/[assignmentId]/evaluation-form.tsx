import { ClipboardCheck } from "lucide-react";
import { completeEvaluation } from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompleteEvaluationButton } from "./complete-evaluation-button";

type Criterion = {
  id: string;
  name: string;
  description: string | null;
  max_score: number;
  display_order: number;
};

type ScoreOption = {
  id: string;
  label: string;
  percentage: number;
};

type Response = {
  criterion_id: string;
  score_option_id: string;
  score: number;
  observation: string | null;
};

type EvaluationFormProps = {
  assignmentId: string;
  assignmentStatus: string;
  criteria: Criterion[];
  scoreOptions: ScoreOption[];
  responses: Response[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function calculateScore(
  maxScore: number,
  percentage: number
) {
  return (Number(maxScore) * Number(percentage)) / 100;
}

export function EvaluationForm({
  assignmentId,
  assignmentStatus,
  criteria,
  scoreOptions,
  responses,
}: EvaluationFormProps) {
  const responseMap = new Map(
    responses.map((response) => [
      response.criterion_id,
      response,
    ])
  );

  const totalMaxScore = criteria.reduce(
    (total, criterion) =>
      total + Number(criterion.max_score),
    0
  );

  const totalCurrentScore = responses.reduce(
    (total, response) =>
      total + Number(response.score),
    0
  );

  const canEdit =
    assignmentStatus === "in_progress";

  const isCompleted =
    assignmentStatus === "completed";

  if (!criteria.length) {
    return (
      <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
        <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
          <CardTitle className="flex items-center gap-2 text-[#102a3d]">
            <ClipboardCheck className="size-5 text-[#245b7a]" />
            Formulário de avaliação
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
            Nenhum critério ativo foi localizado. Entre em contato com a
            Comissão Científica.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scoreOptions.length) {
    return (
      <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
        <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
          <CardTitle className="flex items-center gap-2 text-[#102a3d]">
            <ClipboardCheck className="size-5 text-[#245b7a]" />
            Formulário de avaliação
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
            Nenhuma opção de pontuação ativa foi localizada. Entre em contato
            com a Comissão Científica.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
      <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
        <CardTitle className="flex items-center gap-2 text-[#102a3d]">
          <ClipboardCheck className="size-5 text-[#245b7a]" />
          Formulário de avaliação
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryBox
            label="Pontuação máxima"
            value={formatNumber(totalMaxScore)}
          />

          <SummaryBox
            label="Pontuação final"
            value={
              isCompleted
                ? formatNumber(totalCurrentScore)
                : "Ao concluir"
            }
          />

          <SummaryBox
            label="Situação"
            value={isCompleted ? "Concluída" : "Em andamento"}
          />
        </div>

        {isCompleted && (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-sm leading-6 text-green-800">
            Esta avaliação já foi concluída. As respostas ficam registradas
            para consulta.
          </div>
        )}

        {canEdit && (
          <div className="rounded-3xl border border-[#d9e8ef] bg-[#eef7fa] p-5">
            <p className="font-semibold text-[#102a3d]">
              Orientação ao avaliador
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
               Selecione uma opção para cada critério e registre uma justificativa
               breve para a nota atribuída. A pontuação será calculada automaticamente
               de acordo com o peso máximo de cada item.
            </p>
          </div>
        )}

        <form
          action={completeEvaluation}
          className="space-y-5"
        >
          <input
            type="hidden"
            name="assignmentId"
            value={assignmentId}
          />

          {criteria.map((criterion, index) => {
            const currentResponse =
              responseMap.get(criterion.id);

            return (
              <div
                key={criterion.id}
                className="rounded-[1.75rem] border border-[#d9e8ef] bg-[#f7fbfd] p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#245b7a]">
                      Critério {index + 1}
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-[#102a3d]">
                      {criterion.name}
                    </h3>

                    {criterion.description && (
                      <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
                        {criterion.description}
                      </p>
                    )}
                  </div>

                  <span className="w-fit shrink-0 rounded-full border border-[#b9d4df] bg-white px-3 py-1 text-xs font-medium text-[#245b7a]">
                    Máximo:{" "}
                    {formatNumber(
                      Number(criterion.max_score)
                    )}{" "}
                    ponto(s)
                  </span>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-5">
                  {scoreOptions.map((option) => {
                    const calculatedScore =
                      calculateScore(
                        Number(criterion.max_score),
                        Number(option.percentage)
                      );

                    const optionId = `${criterion.id}-${option.id}`;

                    const isChecked =
                      currentResponse?.score_option_id ===
                      option.id;

                    return (
                      <label
                        key={option.id}
                        htmlFor={optionId}
                        className={
                          isChecked
                            ? "cursor-pointer rounded-3xl border border-[#245b7a] bg-white p-4 shadow-sm transition duration-300"
                            : canEdit
                              ? "cursor-pointer rounded-3xl border border-[#d9e8ef] bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#b9d4df] hover:bg-[#eef7fa]"
                              : "cursor-not-allowed rounded-3xl border border-[#d9e8ef] bg-white/70 p-4 opacity-80"
                        }
                      >
                        <input
                          id={optionId}
                          type="radio"
                          name={`criterion_${criterion.id}`}
                          value={option.id}
                          defaultChecked={isChecked}
                          required
                          disabled={!canEdit}
                          className="mb-3 size-4 accent-[#245b7a]"
                        />

                        <p className="font-semibold text-[#102a3d]">
                          {option.label}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#5f7d90]">
                          {formatNumber(
                            Number(option.percentage)
                          )}
                          % do critério
                        </p>

                        <p className="mt-3 text-sm font-semibold text-[#245b7a]">
                          {formatNumber(calculatedScore)} ponto(s)
                        </p>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <label
                    htmlFor={`observation_${criterion.id}`}
                    className="text-sm font-semibold text-[#102a3d]"
                  >
                    Justificativa da nota
                  </label>

                  <textarea
                    id={`observation_${criterion.id}`}
                    name={`observation_${criterion.id}`}
                    defaultValue={currentResponse?.observation ?? ""}
                    required
                    disabled={!canEdit}
                    placeholder="Justifique brevemente a nota atribuída a este critério."
                    className={
                      canEdit
                        ? "mt-2 min-h-28 w-full rounded-2xl border border-[#d9e8ef] bg-white px-4 py-3 text-sm leading-6 text-[#102a3d] outline-none transition placeholder:text-[#8aa5b5] focus:border-[#245b7a] focus:ring-4 focus:ring-[#245b7a]/10"
                        : "mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#d9e8ef] bg-white/70 px-4 py-3 text-sm leading-6 text-[#4a6678] outline-none"
                    }
                  />

                  <p className="mt-2 text-xs leading-5 text-[#5f7d90]">
                    Este campo será utilizado pela Comissão Científica para compreender a
                    justificativa da pontuação atribuída.
                  </p>
                </div>
              </div>
            );
          })}

          {canEdit && (
            <div className="rounded-[1.75rem] border border-green-200 bg-green-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-green-900">
                    Concluir avaliação
                  </p>

                  <p className="mt-1 text-sm leading-6 text-green-800">
                    Ao concluir, as respostas serão salvas automaticamente e a
                    avaliação ficará bloqueada para edição.
                  </p>
                </div>

                <CompleteEvaluationButton />
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

type SummaryBoxProps = {
  label: string;
  value: string;
};

function SummaryBox({
  label,
  value,
}: SummaryBoxProps) {
  return (
    <div className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
      <p className="text-sm font-medium text-[#5f7d90]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-[#102a3d]">
        {value}
      </p>
    </div>
  );
}