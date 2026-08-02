import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const STORAGE_BUCKET = "submission-files";
const SIGNED_URL_DURATION_SECONDS = 60;

type AdminDownloadRouteProps = {
  params: Promise<{
    id: string;
    fileId: string;
  }>;
};

function redirectWithError(
  request: NextRequest,
  submissionId: string,
  message: string
) {
  const url = new URL(
    submissionId
      ? `/admin/submissoes/${submissionId}`
      : "/admin/submissoes",
    request.url
  );

  url.searchParams.set("erro", message);

  return NextResponse.redirect(url, {
    status: 303,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function normalizeStoragePath(path: string) {
  const decodedPath = decodeURIComponent(path);

  const candidates = new Set<string>();

  candidates.add(path);
  candidates.add(decodedPath);

  candidates.add(path.replace(/^\/+/, ""));
  candidates.add(decodedPath.replace(/^\/+/, ""));

  candidates.add(path.replace(`${STORAGE_BUCKET}/`, ""));
  candidates.add(decodedPath.replace(`${STORAGE_BUCKET}/`, ""));

  candidates.add(
    path
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
  request: NextRequest,
  { params }: AdminDownloadRouteProps
) {
  const { id: submissionId, fileId } = await params;

  if (!submissionId || !fileId) {
    return redirectWithError(
      request,
      submissionId,
      "Não foi possível identificar o arquivo."
    );
  }

  try {
    const { profile, supabase } = await getCurrentUser();

    if (
      !profile.is_active ||
      !["admin", "super_admin"].includes(profile.role)
    ) {
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
        original_filename
      `)
      .eq("id", fileId)
      .eq("submission_id", submissionId)
      .maybeSingle();

    if (fileError) {
      console.error("Erro ao buscar arquivo administrativo:", {
        submissionId,
        fileId,
        message: fileError.message,
        details: fileError.details,
        hint: fileError.hint,
        code: fileError.code,
      });

      return redirectWithError(
        request,
        submissionId,
        "Não foi possível localizar o arquivo."
      );
    }

    if (!file) {
      return redirectWithError(
        request,
        submissionId,
        "Arquivo não localizado."
      );
    }

    const storagePaths = normalizeStoragePath(file.storage_path);

    for (const storagePath of storagePaths) {
      const {
        data: signedUrlData,
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

      if (signedUrlData?.signedUrl && !signedUrlError) {
        return NextResponse.redirect(
          signedUrlData.signedUrl,
          {
            status: 302,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          }
        );
      }

      console.error("Falha ao gerar URL administrativa:", {
        submissionId,
        fileId,
        storagePath,
        message: signedUrlError?.message,
        status: signedUrlError?.status,
        statusCode: signedUrlError?.statusCode,
      });
    }

    return redirectWithError(
      request,
      submissionId,
      "Não foi possível preparar o download."
    );
  } catch (error) {
    console.error("Erro inesperado no download administrativo:", {
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