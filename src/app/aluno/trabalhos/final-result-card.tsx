import type { ComponentType } from "react";
import {
  Megaphone,
  Presentation,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

type FinalResultCardProps = {
  status: string;
  compact?: boolean;
  canShowResult?: boolean;
};

type FinalResult = {
  title: string;
  description: string;
  icon: ComponentType<{
    className?: string;
  }>;
  className: string;
};

function getFinalResult(status: string) {
  const results: Record<string, FinalResult> = {
    selected_oral: {
      title: "Selecionado para apresentação oral",
      description:
        "Parabéns! Seu trabalho foi selecionado para apresentação oral.",
      icon: Presentation,
      className:
        "border-green-300 bg-green-50 text-green-900",
    },
    selected_banner: {
      title: "Selecionado para banner",
      description:
        "Parabéns! Seu trabalho foi selecionado para apresentação em banner.",
      icon: Megaphone,
      className:
        "border-blue-300 bg-blue-50 text-blue-900",
    },
    not_selected: {
      title: "Não selecionado",
      description:
        "Seu trabalho foi avaliado, mas não ficou entre os selecionados para apresentação oral ou banner.",
      icon: XCircle,
      className:
        "border-red-300 bg-red-50 text-red-900",
    },
  };

  return results[status] ?? null;
}

export function FinalResultCard({
  status,
  compact = false,
  canShowResult = false,
}: FinalResultCardProps) {
  const result = getFinalResult(status);

  if (!result || !canShowResult) {
    return null;
  }

  const Icon = result.icon;

  if (compact) {
    return (
      <div
        className={`mt-3 rounded-2xl border p-3 text-sm ${result.className}`}
      >
        <div className="flex items-center gap-2 font-medium">
          <Icon className="size-4" />
          {result.title}
        </div>
      </div>
    );
  }

  return (
    <Card
      className={`overflow-hidden rounded-[2rem] shadow-sm ${result.className}`}
    >
      <CardContent className="p-5">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/70">
            <Icon className="size-5" />
          </div>

          <div>
            <p className="font-semibold">
              Resultado final
            </p>

            <h2 className="mt-1 text-xl font-bold">
              {result.title}
            </h2>

            <p className="mt-2 text-sm leading-6">
              {result.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}