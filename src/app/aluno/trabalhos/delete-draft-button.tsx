"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteDraftButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      variant="destructive"
      disabled={pending}
      className="disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Excluindo...
        </>
      ) : (
        <>
          <Trash2 />
          Excluir
        </>
      )}
    </Button>
  );
}