import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const STORAGE_BUCKET = "submission-files";
const SIGNED_URL_DURATION_SECONDS = 60;

type DownloadFileRouteProps = {
  params: Promise<{
    id: string;
    fileId: string;
  }>;
};

function redirectWithError(
  request: Request,
  submissionId: string,
  message: string
) {
  const destination = new URL(
    submissionId
      ? `/aluno/trabalhos/${submissionId}`
      : "/aluno/trabalhos",
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

function normalizeStoragePaths(storagePath: string) {
  const decodedPath = decodeURIComponent(storagePath);

  const candidates = new Set<string>();

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

  return Array.from(candidates).filter(Boolean);
}

export async function GET(
  request: Request,
  { params }: DownloadFileRouteProps
) {
  const {
    id: submissionId,
    fileId,
  } = await params;

  if (!submissionId || !fileId) {
    return redirectWithError(
      request,
      submissionId,
      "Não foi possível identificar o arquivo."
    );
  }

  try {
    const { profile, supabase } =
      await getCurrentUser();

    if (!profile.is_active) {
      return redirectWithError(
        request,
        submissionId,
        "Seu usuário está inativo. Entre em contato com a organização."
      );
    }

    const {
      data: submission,
      error: submissionError,
    } = await supabase
      .from("submissions")
      .select("id")
      .eq("id", submissionId)
      .eq("owner_user_id", profile.id)
      .maybeSingle();

    if (submissionError) {
      console.error("Erro ao verificar submissão para download:", {
        submissionId,
        fileId,
        userId: profile.id,
        message: submissionError.message,
        details: submissionError.details,
        hint: submissionError.hint,
        code: submissionError.code,
      });

      return redirectWithError(
        request,
        submissionId,
        "Não foi possível verificar o trabalho."
      );
    }

    if (!submission) {
      return redirectWithError(
        request,
        submissionId,
        "Você não possui permissão para acessar este arquivo."
      );
    }

    const {
      data: file,
      error: fileError,
    } = await supabase
      .from("submission_files")
      .select(`
        id,
        submission_id,
        storage_path,
        original_filename,
        is_current
      `)
      .eq("id", fileId)
      .eq("submission_id", submissionId)
      .eq("is_current", true)
      .maybeSingle();

    if (fileError) {
      console.error("Erro ao consultar arquivo do aluno:", {
        submissionId,
        fileId,
        userId: profile.id,
        message: fileError.message,
        details: fileError.details,
        hint: fileError.hint,
        code: fileError.code,
      });

      return redirectWithError(
        request,
        submissionId,
        "Não foi possível consultar o arquivo."
      );
    }

    if (!file) {
      return redirectWithError(
        request,
        submissionId,
        "O arquivo não foi encontrado ou não é mais a versão atual."
      );
    }

    const storagePaths = normalizeStoragePaths(
      file.storage_path
    );

    for (const storagePath of storagePaths) {
      const {
        data,
        error: signedUrlError,
      } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(
          storagePath,
          SIGNED_URL_DURATION_SECONDS,
          {
            download:
              file.original_filename ||
              "arquivo-submissao",
          }
        );

      if (data?.signedUrl && !signedUrlError) {
        return NextResponse.redirect(data.signedUrl, {
          status: 302,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        });
      }

      console.error("Tentativa de URL assinada falhou:", {
        submissionId,
        fileId,
        userId: profile.id,
        storagePath,
        originalStoragePath: file.storage_path,
        message: signedUrlError?.message,
        status: signedUrlError?.status,
        statusCode: signedUrlError?.statusCode,
      });
    }

    return redirectWithError(
      request,
      submissionId,
      "Não foi possível preparar o download. O arquivo pode não existir mais no Storage."
    );
  } catch (error) {
    console.error("Erro inesperado no download do aluno:", {
      submissionId,
      fileId,
      error,
    });

    return redirectWithError(
      request,
      submissionId,
      "Não foi possível baixar o arquivo."
    );
  }
}