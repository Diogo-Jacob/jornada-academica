import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const STORAGE_BUCKET = "submission-files";
const SIGNED_URL_DURATION_SECONDS = 60;

type EvaluatorDownloadRouteProps = {
  params: Promise<{
    assignmentId: string;
    fileId: string;
  }>;
};

function redirectWithError(
  request: Request,
  assignmentId: string,
  message: string
) {
  const destination = new URL(
    assignmentId
      ? `/avaliador/trabalhos/${assignmentId}`
      : "/avaliador",
    request.url
  );

  destination.searchParams.set("erro", message);

  return NextResponse.redirect(destination, {
    status: 303,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function normalizeStoragePath(storagePath: string) {
  let normalizedPath = storagePath.trim();

  while (normalizedPath.startsWith("/")) {
    normalizedPath = normalizedPath.slice(1);
  }

  const bucketPrefix = `${STORAGE_BUCKET}/`;

  if (normalizedPath.startsWith(bucketPrefix)) {
    normalizedPath = normalizedPath.slice(bucketPrefix.length);
  }

  return normalizedPath;
}

async function createDownloadSignedUrl({
  supabase,
  storagePath,
  filename,
}: {
  supabase: Awaited<ReturnType<typeof getCurrentUser>>["supabase"];
  storagePath: string;
  filename: string;
}) {
  const directPath = storagePath.trim();
  const normalizedPath = normalizeStoragePath(storagePath);

  const pathsToTry = Array.from(
    new Set([directPath, normalizedPath])
  ).filter(Boolean);

  for (const path of pathsToTry) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(
        path,
        SIGNED_URL_DURATION_SECONDS,
        {
          download: filename,
        }
      );

    if (!error && data?.signedUrl) {
      return {
        signedUrl: data.signedUrl,
        usedPath: path,
      };
    }

    console.error("Tentativa de download do avaliador falhou:", {
      bucket: STORAGE_BUCKET,
      attemptedPath: path,
      originalPath: storagePath,
      message: error?.message,
      status: error?.status,
      statusCode: error?.statusCode,
    });
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: EvaluatorDownloadRouteProps
) {
  const { assignmentId, fileId } = await params;

  if (!assignmentId || !fileId) {
    return redirectWithError(
      request,
      assignmentId,
      "Não foi possível identificar o arquivo."
    );
  }

  try {
    const { profile, supabase } = await getCurrentUser();

    if (
      !profile.is_active ||
      profile.role !== "evaluator"
    ) {
      return redirectWithError(
        request,
        assignmentId,
        "Você não possui permissão para acessar este arquivo."
      );
    }

    const { data: assignment, error: assignmentError } =
      await supabase
        .from("evaluation_assignments")
        .select(`
          id,
          submission_id
        `)
        .eq("id", assignmentId)
        .eq("evaluator_id", profile.id)
        .in("status", [
          "assigned",
          "in_progress",
          "completed",
        ])
        .maybeSingle();

    if (assignmentError || !assignment) {
      console.error("Erro ao localizar avaliação para download:", {
        assignmentId,
        evaluatorId: profile.id,
        message: assignmentError?.message,
        details: assignmentError?.details,
        hint: assignmentError?.hint,
        code: assignmentError?.code,
      });

      return redirectWithError(
        request,
        assignmentId,
        "A avaliação não foi encontrada."
      );
    }

    const { data: file, error: fileError } =
      await supabase
        .from("submission_files")
        .select(`
          id,
          submission_id,
          storage_path,
          original_filename
        `)
        .eq("id", fileId)
        .eq("submission_id", assignment.submission_id)
        .eq("file_type", "anonymous")
        .eq("is_current", true)
        .maybeSingle();

    if (fileError || !file) {
      console.error("Erro ao localizar arquivo anonimizado:", {
        assignmentId,
        evaluatorId: profile.id,
        fileId,
        submissionId: assignment.submission_id,
        message: fileError?.message,
        details: fileError?.details,
        hint: fileError?.hint,
        code: fileError?.code,
      });

      return redirectWithError(
        request,
        assignmentId,
        "O arquivo anonimizado não foi encontrado."
      );
    }

    const signedUrlResult =
      await createDownloadSignedUrl({
        supabase,
        storagePath: file.storage_path,
        filename:
          file.original_filename || "trabalho-anonimizado.pdf",
      });

    if (!signedUrlResult?.signedUrl) {
      return redirectWithError(
        request,
        assignmentId,
        "Não foi possível preparar o download. O arquivo pode não existir mais no Storage."
      );
    }

    return NextResponse.redirect(
      signedUrlResult.signedUrl,
      {
        status: 302,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro inesperado no download do avaliador:",
      {
        assignmentId,
        fileId,
        error,
      }
    );

    return redirectWithError(
      request,
      assignmentId,
      "Não foi possível baixar o arquivo."
    );
  }
}