"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const STORAGE_BUCKET = "submission-files";
const DATABASE_TIMEOUT_MS = 20_000;
const STORAGE_TIMEOUT_MS = 20_000;

function redirectWithMessage(
  type: "erro" | "sucesso",
  message: string
): never {
  redirect(
    `/aluno/trabalhos?${type}=${encodeURIComponent(message)}`
  );
}

async function withTimeout<T>(
  action: () => Promise<T>,
  timeoutMessage: string,
  timeoutMs = DATABASE_TIMEOUT_MS
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      action(),
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function normalizeStoragePaths(storagePaths: string[]) {
  const candidates = new Set<string>();

  for (const storagePath of storagePaths) {
    const decodedPath = decodeURIComponent(storagePath);

    candidates.add(storagePath);
    candidates.add(decodedPath);

    candidates.add(storagePath.replace(/^\/+/, ""));
    candidates.add(decodedPath.replace(/^\/+/, ""));

    candidates.add(storagePath.replace(`${STORAGE_BUCKET}/`, ""));
    candidates.add(decodedPath.replace(`${STORAGE_BUCKET}/`, ""));

    candidates.add(
      storagePath
        .replace(/^\/+/, "")
        .replace(`${STORAGE_BUCKET}/`, "")
    );

    candidates.add(
      decodedPath
        .replace(/^\/+/, "")
        .replace(`${STORAGE_BUCKET}/`, "")
    );
  }

  return Array.from(candidates).filter(Boolean);
}

export async function deleteDraft(formData: FormData) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  if (!submissionId) {
    redirectWithMessage(
      "erro",
      "Não foi possível identificar o rascunho."
    );
  }

  const { profile, supabase } = await getCurrentUser();

  const { data: submission, error: submissionError } =
    await withTimeout(
      async () =>
        await supabase
          .from("submissions")
          .select("id, status")
          .eq("id", submissionId)
          .eq("owner_user_id", profile.id)
          .maybeSingle(),
      "A consulta do rascunho demorou mais que o esperado."
    );

  if (submissionError) {
    console.error("Erro ao consultar rascunho:", {
      submissionId,
      userId: profile.id,
      message: submissionError.message,
      details: submissionError.details,
      hint: submissionError.hint,
      code: submissionError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível consultar o rascunho."
    );
  }

  if (!submission) {
    redirectWithMessage(
      "erro",
      "O rascunho não foi encontrado."
    );
  }

  if (submission.status !== "draft") {
    redirectWithMessage(
      "erro",
      "Somente trabalhos em rascunho podem ser excluídos."
    );
  }

  const { data: storedFiles, error: filesError } =
    await withTimeout(
      async () =>
        await supabase
          .from("submission_files")
          .select("storage_path")
          .eq("submission_id", submissionId),
      "A consulta dos arquivos do rascunho demorou mais que o esperado."
    );

  if (filesError) {
    console.error("Erro ao consultar arquivos do rascunho:", {
      submissionId,
      userId: profile.id,
      message: filesError.message,
      details: filesError.details,
      hint: filesError.hint,
      code: filesError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível preparar a exclusão do rascunho."
    );
  }

  const storagePaths = normalizeStoragePaths(
    storedFiles?.map((file) => file.storage_path) ?? []
  );

  const { data: deletedSubmission, error: deleteError } =
    await withTimeout(
      async () =>
        await supabase
          .from("submissions")
          .delete()
          .eq("id", submissionId)
          .eq("owner_user_id", profile.id)
          .eq("status", "draft")
          .select("id")
          .maybeSingle(),
      "A exclusão do rascunho demorou mais que o esperado."
    );

  if (deleteError) {
    console.error("Erro ao excluir rascunho:", {
      submissionId,
      userId: profile.id,
      message: deleteError.message,
      details: deleteError.details,
      hint: deleteError.hint,
      code: deleteError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível excluir o rascunho."
    );
  }

  if (!deletedSubmission) {
    redirectWithMessage(
      "erro",
      "O rascunho não pôde ser excluído porque já foi alterado. Atualize a página e tente novamente."
    );
  }

  if (storagePaths.length > 0) {
    try {
      const { error: storageError } = await withTimeout(
        async () =>
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove(storagePaths),
        "A limpeza dos arquivos do rascunho demorou mais que o esperado.",
        STORAGE_TIMEOUT_MS
      );

      if (storageError) {
        console.error("Rascunho excluído, mas houve erro ao limpar Storage:", {
          submissionId,
          userId: profile.id,
          storagePaths,
          message: storageError.message,
          status: storageError.status,
          statusCode: storageError.statusCode,
        });
      }
    } catch (storageError) {
      console.error("Rascunho excluído, mas a limpeza do Storage falhou:", {
        submissionId,
        userId: profile.id,
        storagePaths,
        message:
          storageError instanceof Error
            ? storageError.message
            : "Erro desconhecido",
        error: storageError,
      });
    }
  }

  revalidatePath("/aluno");
  revalidatePath("/aluno/trabalhos");

  redirectWithMessage(
    "sucesso",
    "Rascunho excluído com sucesso."
  );
}