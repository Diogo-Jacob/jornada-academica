"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/services/email/send-email";
import { resultsAvailableEmail } from "@/services/email/templates/results-available";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const ACTION_TIMEOUT_MS = 30_000;
const STATUS_UPDATE_TIMEOUT_MS = 15_000;
const EMAIL_TIMEOUT_MS = 15_000;

type FinalResultStatus =
  | "selected_oral"
  | "selected_banner"
  | "not_selected";

async function withTimeout<T>(
  action: () => Promise<T>,
  timeoutMessage: string,
  timeoutMs = ACTION_TIMEOUT_MS
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

function redirectWithMessage(
  type: "erro" | "sucesso",
  message: string
): never {
  redirect(
    `/admin/resultados?${type}=${encodeURIComponent(message)}`
  );
}

async function ensureAdmin() {
  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/acesso-negado");
  }

  return {
    profile,
    supabase,
  };
}

function isValidFinalResultStatus(
  status: string
): status is FinalResultStatus {
  return [
    "selected_oral",
    "selected_banner",
    "not_selected",
  ].includes(status);
}

function getFinalResultLabel(status: FinalResultStatus) {
  const labels: Record<FinalResultStatus, string> = {
    selected_oral: "Selecionado para apresentação oral",
    selected_banner: "Selecionado para banner",
    not_selected: "Não selecionado",
  };

  return labels[status];
}

function getResultLabel(status: string) {
  const labels: Record<string, string> = {
    selected_oral: "Selecionado para apresentação oral",
    selected_banner: "Selecionado para apresentação em banner",
  };

  return labels[status] ?? "Selecionado";
}

async function ensureResultsNoticeCanBeSent(
  supabase: Awaited<ReturnType<typeof ensureAdmin>>["supabase"]
) {
  const { data: currentEvent, error: currentEventError } =
    await supabase
      .from("events")
      .select(`
        id,
        name,
        status,
        submission_ends_at,
        results_publish_at
      `)
      .eq("status", "published")
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (currentEventError) {
    console.error("Erro ao validar data de publicação dos resultados:", {
      message: currentEventError.message,
      details: currentEventError.details,
      hint: currentEventError.hint,
      code: currentEventError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível validar a data de publicação dos resultados."
    );
  }

  if (!currentEvent) {
    redirectWithMessage(
      "erro",
      "Nenhum evento publicado foi encontrado para validar o envio dos resultados."
    );
  }

  const resultsReleaseDate = currentEvent.results_publish_at
    ? new Date(currentEvent.results_publish_at)
    : currentEvent.submission_ends_at
      ? new Date(currentEvent.submission_ends_at)
      : null;

  if (!resultsReleaseDate) {
    redirectWithMessage(
      "erro",
      "Configure a data de publicação dos resultados antes de enviar o aviso."
    );
  }

  const hasResultsReleaseDatePassed =
    new Date() >= resultsReleaseDate;

  if (!hasResultsReleaseDatePassed) {
    redirectWithMessage(
      "erro",
      "O aviso de resultados só pode ser enviado após a data de publicação dos resultados."
    );
  }
}
export async function setFinalResult(formData: FormData) {
  const submissionId = String(
    formData.get("submissionId") ?? ""
  ).trim();

  const finalStatus = String(
    formData.get("finalStatus") ?? ""
  ).trim();

  if (!submissionId) {
    redirectWithMessage(
      "erro",
      "Não foi possível identificar o trabalho."
    );
  }

  if (!isValidFinalResultStatus(finalStatus)) {
    redirectWithMessage(
      "erro",
      "O resultado final selecionado é inválido."
    );
  }

  const { supabase } = await ensureAdmin();

  const { data: submission, error: submissionError } =
    await supabase
      .from("submissions")
      .select("id, title, status")
      .eq("id", submissionId)
      .maybeSingle();

  if (submissionError) {
    console.error("Erro ao localizar submissão:", {
      submissionId,
      message: submissionError.message,
      details: submissionError.details,
      hint: submissionError.hint,
      code: submissionError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível localizar o trabalho."
    );
  }

  if (!submission) {
    redirectWithMessage(
      "erro",
      "O trabalho selecionado não foi encontrado."
    );
  }

  const allowedStatuses = [
    "evaluations_completed",
    "pending_confirmation",
    "result_confirmed",
    "selected_oral",
    "selected_banner",
    "not_selected",
  ];

  if (!allowedStatuses.includes(submission.status)) {
    redirectWithMessage(
      "erro",
      "O resultado final só pode ser definido após a conclusão das avaliações."
    );
  }

  const {
    data: updatedSubmission,
    error: updateError,
  } = await withTimeout(
    async () =>
      await supabase
        .from("submissions")
        .update({
          status: finalStatus,
        })
        .eq("id", submissionId)
        .in("status", allowedStatuses)
        .select("id, status")
        .maybeSingle(),
    "A tentativa de definir o resultado final demorou mais que o esperado.",
    STATUS_UPDATE_TIMEOUT_MS
  );

  if (updateError) {
    console.error("Erro ao definir resultado final:", {
      submissionId,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
      code: updateError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível definir o resultado final."
    );
  }

  if (!updatedSubmission) {
    redirectWithMessage(
      "erro",
      "O resultado não pôde ser definido porque o trabalho já foi alterado. Atualize a página e tente novamente."
    );
  }

  revalidatePath("/admin/resultados");
  revalidatePath("/admin/avaliacoes");
  revalidatePath("/admin/submissoes");
  revalidatePath(`/admin/submissoes/${submissionId}`);
  revalidatePath("/aluno");
  revalidatePath("/aluno/trabalhos");
  revalidatePath(`/aluno/trabalhos/${submissionId}`);

  redirectWithMessage(
    "sucesso",
    `Resultado definido como "${getFinalResultLabel(finalStatus)}".`
  );
}

export async function sendResultsAvailableEmails() {
  const { supabase } = await ensureAdmin();

  await ensureResultsNoticeCanBeSent(supabase);

  const { data: submissions, error: submissionsError } =
    await supabase
      .from("submissions")
      .select(`
        id,
        title,
        protocol,
        status,
        updated_at,

        submission_authors (
          id,
          full_name,
          email,
          author_role,
          display_order
        )
      `)
      .in("status", [
        "selected_oral",
        "selected_banner",
      ])
      .order("updated_at", {
        ascending: true,
      })
      .limit(40);

  if (submissionsError) {
    console.error("Erro ao carregar trabalhos selecionados:", {
      message: submissionsError.message,
      details: submissionsError.details,
      hint: submissionsError.hint,
      code: submissionsError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível carregar os trabalhos selecionados."
    );
  }

  if (!submissions?.length) {
    redirectWithMessage(
      "erro",
      "Nenhum trabalho selecionado para apresentação oral ou banner foi encontrado."
    );
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const submission of submissions) {
    const authors = [
      ...(submission.submission_authors ?? []),
    ].sort(
      (firstAuthor, secondAuthor) =>
        firstAuthor.display_order -
        secondAuthor.display_order
    );

    for (const author of authors) {
      if (!author.email) {
        continue;
      }

      try {
        const emailResult = await withTimeout(
          async () =>
            await sendEmail({
              to: author.email,
              subject: `Trabalho selecionado - ${
                submission.protocol ?? submission.title
              }`,
              html: resultsAvailableEmail({
                authorName:
                  author.full_name ?? "Autor(a)",
                title: submission.title,
                protocol: submission.protocol,
                resultLabel: getResultLabel(submission.status),
              }),
            }),
          "O envio do e-mail de resultado demorou mais que o esperado.",
          EMAIL_TIMEOUT_MS
        );

        if (emailResult.success) {
          sentCount += 1;
        } else {
          failedCount += 1;

          console.error(
            "E-mail de resultado não enviado:",
            {
              authorEmail: author.email,
              submissionId: submission.id,
              emailResult,
            }
          );
        }
      } catch (emailError) {
        failedCount += 1;

        console.error(
          "E-mail de resultado falhou ou demorou demais:",
          {
            authorEmail: author.email,
            submissionId: submission.id,
            message:
              emailError instanceof Error
                ? emailError.message
                : "Erro desconhecido",
            error: emailError,
          }
        );
      }
    }
  }

  revalidatePath("/admin/resultados");

  if (sentCount === 0) {
    redirectWithMessage(
      "erro",
      "Nenhum e-mail foi enviado. Confira os autores cadastrados e a configuração de e-mail."
    );
  }

  if (failedCount > 0) {
    redirectWithMessage(
      "sucesso",
      `${sentCount} e-mail(s) enviados para trabalhos selecionados. ${failedCount} envio(s) apresentaram erro e foram registrados no terminal.`
    );
  }

  redirectWithMessage(
    "sucesso",
    `${sentCount} e-mail(s) enviados com sucesso para os trabalhos selecionados.`
  );
}