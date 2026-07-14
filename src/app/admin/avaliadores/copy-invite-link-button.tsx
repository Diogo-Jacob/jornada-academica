"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyInviteLinkButtonProps = {
  link: string;
};

export function CopyInviteLinkButton({
  link,
}: CopyInviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={
        copied
          ? "border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
          : "border-[#b9d4df] bg-white text-[#245b7a] hover:bg-[#eef7fa]"
      }
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Link copiado
        </>
      ) : (
        <>
          <Copy className="size-4" />
          Copiar link
        </>
      )}
    </Button>
  );
}