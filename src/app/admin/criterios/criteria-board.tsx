"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  ClipboardList,
  GripVertical,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import {
  deleteCriterion,
  updateCriteriaOrder,
  updateCriterion,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ScoreOption = {
  id: string;
  label: string;
  percentage: number;
  display_order: number;
  is_active: boolean;
};

export type Criterion = {
  id: string;
  name: string;
  description: string | null;
  max_score: number;
  display_order: number;
  is_active: boolean;
};

type CriteriaBoardProps = {
  criteria: Criterion[];
  scoreOptions: ScoreOption[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatScoreInput(value: number) {
  return Number(value).toFixed(2);
}

function normalizeScoreInput(value: string) {
  const normalizedValue = value
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const firstDotIndex = normalizedValue.indexOf(".");

  if (firstDotIndex === -1) {
    return normalizedValue;
  }

  return (
    normalizedValue.slice(0, firstDotIndex + 1) +
    normalizedValue
      .slice(firstDotIndex + 1)
      .replace(/\./g, "")
  );
}

function calculateScore(
  maxScore: number,
  percentage: number
) {
  return (maxScore * percentage) / 100;
}

function DecimalScoreInput({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue: number;
}) {
  const [value, setValue] = useState(
    formatScoreInput(defaultValue)
  );

  function changeByStep(step: number) {
    const currentValue = Number(
      value.replace(",", ".")
    );

    const safeCurrentValue = Number.isNaN(currentValue)
      ? 0
      : currentValue;

    const nextValue = Math.min(
      100,
      Math.max(0.01, safeCurrentValue + step)
    );

    setValue(formatScoreInput(nextValue));
  }

  return (
    <div className="flex h-11 overflow-hidden rounded-xl border border-[#d9e8ef] bg-white transition focus-within:border-[#245b7a] focus-within:ring-4 focus-within:ring-[#245b7a]/10">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Diminuir pontuação máxima"
        className="h-11 rounded-none text-[#245b7a] hover:bg-[#eef7fa] hover:text-[#173f59]"
        onClick={() => changeByStep(-1)}
      >
        <Minus className="size-4" />
      </Button>

      <input
        id={id}
        name={name}
        value={value}
        onChange={(event) =>
          setValue(
            normalizeScoreInput(event.target.value)
          )
        }
        onBlur={() => {
          const numericValue = Number(
            value.replace(",", ".")
          );

          if (Number.isNaN(numericValue)) {
            setValue("0.01");
            return;
          }

          const safeValue = Math.min(
            100,
            Math.max(0.01, numericValue)
          );

          setValue(formatScoreInput(safeValue));
        }}
        inputMode="decimal"
        required
        className="h-11 w-full min-w-0 border-x border-[#d9e8ef] bg-transparent px-3 text-center text-sm font-semibold text-[#102a3d] outline-none"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Aumentar pontuação máxima"
        className="h-11 rounded-none text-[#245b7a] hover:bg-[#eef7fa] hover:text-[#173f59]"
        onClick={() => changeByStep(1)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

function SaveOrderButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Salvando ordem...
        </>
      ) : (
        <>
          <Save className="size-4" />
          Salvar ordem atual
        </>
      )}
    </Button>
  );
}

function SaveCriterionButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full bg-[#245b7a] hover:bg-[#173f59] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Salvando...
        </>
      ) : (
        "Salvar alterações"
      )}
    </Button>
  );
}

function ConfirmCriterionStatusButton({
  isActive,
}: {
  isActive: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={isActive ? "destructive" : "outline"}
      disabled={pending}
      className={
        isActive
          ? "disabled:cursor-not-allowed disabled:opacity-70"
          : "border-green-300 bg-green-50 text-green-800 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-70"
      }
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {isActive ? "Desativando..." : "Ativando..."}
        </>
      ) : isActive ? (
        "Confirmar desativação"
      ) : (
        "Confirmar ativação"
      )}
    </Button>
  );
}

export function CriteriaBoard({
  criteria,
  scoreOptions,
}: CriteriaBoardProps) {
  const [orderedCriteria, setOrderedCriteria] =
    useState<Criterion[]>(criteria);

  const [draggedCriterionId, setDraggedCriterionId] =
    useState<string | null>(null);

  const [editingCriterionId, setEditingCriterionId] =
    useState<string | null>(null);

  const [
    confirmingDeletionCriterionId,
    setConfirmingDeletionCriterionId,
  ] = useState<string | null>(null);

  useEffect(() => {
    setOrderedCriteria(criteria);
  }, [criteria]);

  const orderedCriterionIds = useMemo(
    () =>
      JSON.stringify(
        orderedCriteria.map((criterion) => criterion.id)
      ),
    [orderedCriteria]
  );

  function moveCriterion(
    draggedId: string,
    targetId: string
  ) {
    if (draggedId === targetId) {
      return;
    }

    setOrderedCriteria((currentCriteria) => {
      const draggedIndex = currentCriteria.findIndex(
        (criterion) => criterion.id === draggedId
      );

      const targetIndex = currentCriteria.findIndex(
        (criterion) => criterion.id === targetId
      );

      if (draggedIndex === -1 || targetIndex === -1) {
        return currentCriteria;
      }

      const updatedCriteria = [...currentCriteria];
      const [draggedCriterion] = updatedCriteria.splice(
        draggedIndex,
        1
      );

      updatedCriteria.splice(
        targetIndex,
        0,
        draggedCriterion
      );

      return updatedCriteria;
    });
  }

  if (!orderedCriteria.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#b9d4df] bg-[#f7fbfd] px-6 py-14 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
          <Settings2 className="size-7" />
        </div>

        <h2 className="mt-5 text-xl font-semibold text-[#102a3d]">
          Nenhum critério cadastrado
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-[#5f7d90]">
          Cadastre o primeiro critério para montar o formulário de avaliação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-[#102a3d]">
            <ClipboardList className="size-5 text-[#245b7a]" />
            Lista de critérios
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
            Arraste os critérios para alterar a ordem e clique em salvar ao
            finalizar.
          </p>
        </div>

        <form action={updateCriteriaOrder}>
          <input
            type="hidden"
            name="orderedCriterionIds"
            value={orderedCriterionIds}
          />

          <SaveOrderButton />
        </form>
      </div>

      <div className="space-y-5">
        {orderedCriteria.map((criterion, index) => {
          const isEditing =
            editingCriterionId === criterion.id;

          const isConfirmingDeletion =
            confirmingDeletionCriterionId === criterion.id;

          const canDrag =
            !isEditing && !isConfirmingDeletion;

          return (
            <div
              key={criterion.id}
              draggable={canDrag}
              onDragStart={() => {
                if (canDrag) {
                  setDraggedCriterionId(criterion.id);
                }
              }}
              onDragEnd={() =>
                setDraggedCriterionId(null)
              }
              onDragOver={(event) => {
                event.preventDefault();

                if (draggedCriterionId && canDrag) {
                  moveCriterion(
                    draggedCriterionId,
                    criterion.id
                  );
                }
              }}
              className={
                draggedCriterionId === criterion.id
                  ? "overflow-hidden rounded-[1.75rem] border border-[#b9d4df] bg-white opacity-50 shadow-sm"
                  : "overflow-hidden rounded-[1.75rem] border border-[#d9e8ef] bg-white shadow-sm transition duration-300 hover:border-[#b9d4df]"
              }
            >
              <div className="flex flex-col gap-5 border-b border-[#d9e8ef] bg-[#f7fbfd] p-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <button
                    type="button"
                    title="Arraste para alterar a ordem"
                    disabled={!canDrag}
                    className="mt-1 h-fit cursor-grab rounded-2xl border border-[#d9e8ef] bg-white p-2 text-[#5f7d90] transition hover:bg-[#eef7fa] hover:text-[#245b7a] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <GripVertical className="size-5" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#b9d4df] bg-white px-3 py-1 text-xs font-medium text-[#245b7a]">
                        Ordem {index + 1}
                      </span>

                      <span className="rounded-full border border-[#b9d4df] bg-white px-3 py-1 text-xs font-medium text-[#5f7d90]">
                        Máximo:{" "}
                        {formatNumber(
                          Number(criterion.max_score)
                        )}{" "}
                        ponto(s)
                      </span>

                      <span
                        className={
                          criterion.is_active
                            ? "inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-800"
                            : "inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                        }
                      >
                        <CheckCircle2 className="size-3" />
                        {criterion.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <h2 className="mt-3 text-lg font-bold text-[#102a3d]">
                      {criterion.name}
                    </h2>

                    {criterion.description && (
                      <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
                        {criterion.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
                    onClick={() => {
                      setEditingCriterionId(
                        isEditing ? null : criterion.id
                      );

                      setConfirmingDeletionCriterionId(null);
                    }}
                  >
                    {isEditing
                      ? "Fechar edição"
                      : "Editar"}
                  </Button>

                  <Button
                    type="button"
                    variant={criterion.is_active ? "destructive" : "outline"}
                    className={
                      criterion.is_active
                        ? ""
                        : "border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
                    }
                    onClick={() => {
                      setConfirmingDeletionCriterionId(
                        isConfirmingDeletion
                          ? null
                          : criterion.id
                      );

                      setEditingCriterionId(null);
                    }}
                  >
                    {criterion.is_active ? (
                      <Trash2 className="size-4" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}

                    {criterion.is_active ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </div>

              <div className="p-5">
                <div className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
                  <p className="text-sm font-semibold text-[#102a3d]">
                    Pontuação gerada automaticamente para este critério
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#5f7d90]">
                    A nota de cada alternativa é calculada com base na pontuação
                    máxima do critério.
                  </p>

                  {!scoreOptions.length ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                      Nenhuma opção de pontuação ativa foi encontrada.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                      {scoreOptions.map((option) => (
                        <div
                          key={option.id}
                          className="rounded-2xl border border-[#d9e8ef] bg-white p-4"
                        >
                          <p className="text-xs leading-5 text-[#5f7d90]">
                            {option.label}
                          </p>

                          <p className="mt-2 font-semibold text-[#102a3d]">
                            {formatNumber(
                              calculateScore(
                                Number(criterion.max_score),
                                Number(option.percentage)
                              )
                            )}{" "}
                            ponto(s)
                          </p>

                          <p className="mt-1 text-xs text-[#5f7d90]">
                            {formatNumber(
                              Number(option.percentage)
                            )}
                            %
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="border-t border-[#d9e8ef] bg-[#eef7fa] p-5">
                  <form
                    action={updateCriterion}
                    className="space-y-5"
                  >
                    <input
                      type="hidden"
                      name="criterionId"
                      value={criterion.id}
                    />

                    <div className="grid gap-4 lg:grid-cols-[1fr_200px_auto]">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`edit-name-${criterion.id}`}
                          className="text-[#102a3d]"
                        >
                          Nome do critério
                        </Label>

                        <Input
                          id={`edit-name-${criterion.id}`}
                          name="name"
                          required
                          minLength={3}
                          defaultValue={criterion.name}
                          className="h-11 border-[#d9e8ef] bg-white focus-visible:ring-[#245b7a]/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`edit-max-score-${criterion.id}`}
                          className="text-[#102a3d]"
                        >
                          Pontuação máxima
                        </Label>

                        <DecimalScoreInput
                          id={`edit-max-score-${criterion.id}`}
                          name="maxScore"
                          defaultValue={Number(
                            criterion.max_score
                          )}
                        />

                        <p className="text-xs leading-5 text-[#5f7d90]">
                          Use os botões para alterar de 1 em 1 ponto.
                        </p>
                      </div>

                      <div className="flex items-end">
                        <SaveCriterionButton />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`edit-description-${criterion.id}`}
                        className="text-[#102a3d]"
                      >
                        Descrição, opcional
                      </Label>

                      <textarea
                        id={`edit-description-${criterion.id}`}
                        name="description"
                        rows={3}
                        defaultValue={
                          criterion.description ?? ""
                        }
                        placeholder="Descreva o que o avaliador deve considerar neste critério."
                        className="flex min-h-28 w-full rounded-xl border border-[#d9e8ef] bg-white px-3 py-2 text-sm text-[#102a3d] outline-none transition placeholder:text-[#8aa1af] focus:border-[#245b7a] focus:ring-4 focus:ring-[#245b7a]/10"
                      />
                    </div>
                  </form>
                </div>
              )}

              {isConfirmingDeletion && (
                <div className="border-t border-red-200 bg-red-50 p-5">
                  <div className="rounded-3xl border border-red-200 bg-white p-5">
                    <h3 className="font-semibold text-red-800">
                      {criterion.is_active
                        ? "Confirmar desativação"
                        : "Confirmar ativação"}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
                      Tem certeza que deseja{" "}
                      {criterion.is_active ? "desativar" : "ativar"} o critério{" "}
                      <strong className="text-[#102a3d]">
                        {criterion.name}
                      </strong>
                      ?
                      {criterion.is_active
                        ? " Ele deixará de aparecer para os avaliadores, mas o histórico de avaliações anteriores será preservado."
                        : " Ele voltará a aparecer no formulário dos avaliadores."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <form action={deleteCriterion}>
                        <input
                          type="hidden"
                          name="criterionId"
                          value={criterion.id}
                        />

                        <ConfirmCriterionStatusButton
                          isActive={criterion.is_active}
                        />
                      </form>

                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
                        onClick={() =>
                          setConfirmingDeletionCriterionId(null)
                        }
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="rounded-3xl border border-[#d9e8ef] bg-white p-5 text-sm leading-6 text-[#5f7d90]">
        Para alterar a ordem, arraste os critérios usando o ícone à esquerda e
        depois clique em{" "}
        <strong className="text-[#102a3d]">
          Salvar ordem atual
        </strong>
        .
      </p>
    </div>
  );
}