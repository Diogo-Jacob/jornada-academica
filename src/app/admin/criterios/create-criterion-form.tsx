"use client";

import { useState } from "react";
import { Minus, Plus, PlusCircle } from "lucide-react";
import { createCriterion } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        className="h-11 rounded-none text-[#245b7a] hover:bg-[#eef7fa] hover:text-[#173f59]"
        onClick={() => changeByStep(1)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

export function CreateCriterionForm() {
  return (
    <form
      action={createCriterion}
      className="space-y-5"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_200px_auto]">
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="text-[#102a3d]"
          >
            Nome do critério
          </Label>

          <Input
            id="name"
            name="name"
            required
            minLength={3}
            placeholder="Exemplo: Originalidade e relevância científica"
            className="h-11 border-[#d9e8ef] bg-white focus-visible:ring-[#245b7a]/20"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="maxScore"
            className="text-[#102a3d]"
          >
            Pontuação máxima
          </Label>

          <DecimalScoreInput
            id="maxScore"
            name="maxScore"
            defaultValue={2}
          />

          <p className="text-xs leading-5 text-[#5f7d90]">
            Use os botões para alterar de 1 em 1 ponto.
          </p>
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            className="h-11 w-full bg-[#245b7a] hover:bg-[#173f59]"
          >
            <PlusCircle className="size-4" />
            Criar critério
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="description"
          className="text-[#102a3d]"
        >
          Descrição, opcional
        </Label>

        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Descreva o que o avaliador deve considerar neste critério."
          className="flex min-h-28 w-full rounded-xl border border-[#d9e8ef] bg-white px-3 py-2 text-sm text-[#102a3d] outline-none transition placeholder:text-[#8aa1af] focus:border-[#245b7a] focus:ring-4 focus:ring-[#245b7a]/10"
        />

        <p className="text-xs leading-5 text-[#5f7d90]">
          A descrição ajuda o avaliador a interpretar o critério de forma mais
          padronizada.
        </p>
      </div>
    </form>
  );
}