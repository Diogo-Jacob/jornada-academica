"use client";

import { useFormStatus } from "react-dom";
import { Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StartEvaluationButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-[#245b7a] hover:bg-[#173f59] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Iniciando...
        </>
      ) : (
        <>
          <PlayCircle />
          Iniciar avaliação
        </>
      )}
    </Button>
  );
}