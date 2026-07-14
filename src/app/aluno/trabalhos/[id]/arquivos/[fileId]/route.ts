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
    `/aluno/trabalhos/${submissionId}`,
    request.url
  );

  destination.searchParams.set("erro", message);

  return NextResponse.redirect(destination);
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
      console.error(
        "Erro ao verificar submissão:",
        submissionError
      );

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
      console.error(
        "Erro ao consultar arquivo:",
        fileError
      );

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

    const {
      data,
      error: signedUrlError,
    } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(
        file.storage_path,
        SIGNED_URL_DURATION_SECONDS,
        {
          download: file.original_filename,
        }
      );

    if (
      signedUrlError ||
      !data?.signedUrl
    ) {
      console.error(
        "Erro ao gerar URL assinada:",
        signedUrlError
      );

      return redirectWithError(
        request,
        submissionId,
        "Não foi possível preparar o download."
      );
    }

    return NextResponse.redirect(
      data.signedUrl
    );
  } catch (error) {
    console.error(
      "Erro inesperado no download:",
      error
    );

    return redirectWithError(
      request,
      submissionId,
      "Não foi possível baixar o arquivo."
    );
  }
}