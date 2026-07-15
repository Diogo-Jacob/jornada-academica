"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type VersionResponse = {
  version: string;
};

export function AppVersionWatcher() {
  const currentVersionRef = useRef<string | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);

  async function checkVersion() {
    try {
      const response = await fetch("/api/version", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as VersionResponse;

      if (!data.version) {
        return;
      }

      if (!currentVersionRef.current) {
        currentVersionRef.current = data.version;
        return;
      }

      if (currentVersionRef.current !== data.version) {
        setHasNewVersion(true);
      }
    } catch {
      // Se falhar a verificação, não interrompe o uso do sistema.
    }
  }

  useEffect(() => {
    checkVersion();

    const interval = window.setInterval(() => {
      checkVersion();
    }, 60_000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    }

    window.addEventListener("focus", checkVersion);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkVersion);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  if (!hasNewVersion) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[9999] mx-auto max-w-xl rounded-3xl border border-[#b9d4df] bg-white p-4 shadow-2xl shadow-[#102a3d]/15">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-[#102a3d]">
            Nova versão disponível
          </p>

          <p className="mt-1 text-sm leading-6 text-[#5f7d90]">
            Atualize a página para continuar usando a plataforma sem
            instabilidades.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-[#245b7a] hover:bg-[#173f59]"
        >
          <RefreshCw className="size-4" />
          Atualizar
        </Button>
      </div>
    </div>
  );
}