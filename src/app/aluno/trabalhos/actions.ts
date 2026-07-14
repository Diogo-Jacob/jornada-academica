"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const STORAGE_BUCKET = "submission-files";

function redirectWithMessage(
  type: "erro" | "sucesso",
  message: string
): never {
  redirect(
    `/aluno/trabalhos?${type}=${encodeURIComponent(message)}`
  );
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
    await supabase
      .from("submissions")
      .select("id, status")
      .eq("id", submissionId)
      .eq("owner_user_id", profile.id)
      .maybeSingle();

  if (submissionError) {
    console.error(
      "Erro ao consultar rascunho:",
      submissionError
    );

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
    await supabase
      .from("submission_files")
      .select("storage_path")
      .eq("submission_id", submissionId);

  if (filesError) {
    console.error(
      "Erro ao consultar arquivos do rascunho:",
      filesError
    );

    redirectWithMessage(
      "erro",
      "Não foi possível preparar a exclusão do rascunho."
    );
  }

  const storagePaths =
    storedFiles?.map((file) => file.storage_path) ?? [];

  if (storagePaths.length > 0) {
    const { error: storageError } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(storagePaths);

    if (storageError) {
      console.error(
        "Erro ao excluir arquivos do Storage:",
        storageError
      );

      redirectWithMessage(
        "erro",
        "Não foi possível excluir os arquivos vinculados ao rascunho."
      );
    }
  }

  const { error: deleteError } = await supabase
    .from("submissions")
    .delete()
    .eq("id", submissionId)
    .eq("owner_user_id", profile.id)
    .eq("status", "draft");

  if (deleteError) {
    console.error(
      "Erro ao excluir rascunho:",
      deleteError
    );

    redirectWithMessage(
      "erro",
      "Não foi possível excluir o rascunho."
    );
  }

  revalidatePath("/aluno");
  revalidatePath("/aluno/trabalhos");

  redirectWithMessage(
    "sucesso",
    "Rascunho excluído com sucesso."
  );
}