"use client";

import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmDeclineButton() {
  function handleClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
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
      onClick={handleClick}
    >
      <XCircle />
      Recusar avaliação
    </Button>
  );
}