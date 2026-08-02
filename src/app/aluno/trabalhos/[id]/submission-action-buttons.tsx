"use client";

import { useFormStatus } from "react-dom";
import {
  Loader2,
  Save,
  Send,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function SaveAuthorsButton() {
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
          Salvando autores...
        </>
      ) : (
        <>
          <Save className="size-4" />
          Salvar autores
        </>
      )}
    </Button>
  );
}

export function UploadFileButton({
  sentLabel,
  pendingLabel,
  outline = false,
  fullWidth = false,
}: {
  sentLabel: string;
  pendingLabel: string;
  outline?: boolean;
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={outline ? "outline" : "default"}
      disabled={pending}
      className={
        outline
          ? `${fullWidth ? "w-full" : ""} border-[#b9d4df] text-[#245b7a] hover:bg-[#eef7fa] disabled:cursor-not-allowed disabled:opacity-70`
          : `${fullWidth ? "w-full" : ""} bg-[#245b7a] hover:bg-[#173f59] disabled:cursor-not-allowed disabled:opacity-70`
      }
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          <Upload className="size-4" />
          {sentLabel}
        </>
      )}
    </Button>
  );
}

export function SubmitSubmissionButton() {
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
          Submetendo trabalho...
        </>
      ) : (
        <>
          <Send className="size-4" />
          Submeter trabalho definitivamente
        </>
      )}
    </Button>
  );
}