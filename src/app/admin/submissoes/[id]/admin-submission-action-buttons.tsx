"use client";

import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  Loader2,
  MessageSquareWarning,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function StartDocumentReviewButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="bg-[#245b7a] hover:bg-[#173f59] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Iniciando conferência...
        </>
      ) : (
        <>
          <PlayCircle className="size-4" />
          Iniciar conferência documental
        </>
      )}
    </Button>
  );
}

export function RequestCorrectionsButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending}
      className="w-full disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Solicitando correções...
        </>
      ) : (
        <>
          <MessageSquareWarning className="size-4" />
          Solicitar correções ao aluno
        </>
      )}
    </Button>
  );
}

export function ApproveForEvaluationButton({
  disabled,
}: {
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className="w-full bg-green-700 hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Aprovando documentação...
        </>
      ) : (
        <>
          <CheckCircle2 className="size-4" />
          Aprovar para avaliação científica
        </>
      )}
    </Button>
  );
}