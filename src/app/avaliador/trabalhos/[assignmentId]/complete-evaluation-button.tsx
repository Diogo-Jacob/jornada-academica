"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompleteEvaluationButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-green-700 hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Concluindo avaliação...
        </>
      ) : (
        <>
          <CheckCircle2 />
          Concluir avaliação
        </>
      )}
    </Button>
  );
}