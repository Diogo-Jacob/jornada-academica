"use client";

import { useFormStatus } from "react-dom";
import {
  Loader2,
  LogOut,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function SaveProfileButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 shrink-0 bg-[#245b7a] hover:bg-[#173f59] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Salvando...
        </>
      ) : (
        <>
          <Save className="size-4" />
          Salvar
        </>
      )}
    </Button>
  );
}

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending}
      className="disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Saindo...
        </>
      ) : (
        <>
          <LogOut className="size-4" />
          Sair da conta
        </>
      )}
    </Button>
  );
}