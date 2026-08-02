"use client";

import type { MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmDeclineButton() {
  const { pending } = useFormStatus();

  function handleClick(
    event: MouseEvent<HTMLButtonElement>
  ) {
    if (pending) {
      event.preventDefault();
      return;
    }

    const confirmed = window.confirm(
      "Tem certeza que deseja recusar esta avaliação? Após confirmar, a Comissão Científica precisará selecionar outro avaliador para este trabalho."
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending}
      onClick={handleClick}
      className="disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Recusando avaliação...
        </>
      ) : (
        <>
          <XCircle className="size-4" />
          Recusar avaliação
        </>
      )}
    </Button>
  );
}