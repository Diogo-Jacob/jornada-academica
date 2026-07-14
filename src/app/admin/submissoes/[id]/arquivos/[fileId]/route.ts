import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const STORAGE_BUCKET = "submission-files";

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
    `/admin/submissoes/${submissionId}`,
    request.url
  );

  url.searchParams.set("erro", message);

  return NextResponse.redirect(url);
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

  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: file,
    error: fileError,
  } = await supabase
    .from("submission_files")
    .select(`
      id,
      submission_id,
      file_type,
      storage_path,
      original_filename,
      mime_type,
      is_current
    `)
    .eq("id", fileId)
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (fileError) {
    console.error("Erro ao buscar arquivo administrativo:", {
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

  const {
    data: submission,
    error: submissionError,
  } = await supabase
    .from("submissions")
    .select("id")
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError || !submission) {
    console.error("Erro ao validar submissão administrativa:", {
      message: submissionError?.message,
      details: submissionError?.details,
      hint: submissionError?.hint,
      code: submissionError?.code,
    });

    return redirectWithError(
      request,
      submissionId,
      "Submissão não localizada."
    );
  }

  const storagePaths = normalizeStoragePath(file.storage_path);

  for (const storagePath of storagePaths) {
    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60, {
        download:
          file.original_filename ||
          "arquivo-submissao",
      });

    if (signedUrlData?.signedUrl && !signedUrlError) {
      return NextResponse.redirect(
        signedUrlData.signedUrl
      );
    }

    console.error("Falha ao gerar URL administrativa:", {
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
}