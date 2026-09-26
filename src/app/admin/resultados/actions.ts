"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/services/email/send-email";
import { resultsAvailableEmail } from "@/services/email/templates/results-available";
import { resultNotSelectedEmail } from "@/services/email/templates/result-not-selected";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const ACTION_TIMEOUT_MS = 30_000;
const STATUS_UPDATE_TIMEOUT_MS = 15_000;
const EMAIL_TIMEOUT_MS = 15_000;
const RESULTS_EMAIL_BATCH_SIZE = 5;

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
        results_publish_at
      `)
      .eq("status", "published")
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (currentEventError) {
    console.error(
      "Erro ao validar data de publicação dos resultados:",
      {
        message: currentEventError.message,
        details: currentEventError.details,
        hint: currentEventError.hint,
        code: currentEventError.code,
      }
    );

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

  if (!currentEvent.results_publish_at) {
    redirectWithMessage(
      "erro",
      "Configure a data de publicação dos resultados antes de enviar o aviso."
    );
  }

  const resultsReleaseDate =
    new Date(currentEvent.results_publish_at);

  if (Number.isNaN(resultsReleaseDate.getTime())) {
    redirectWithMessage(
      "erro",
      "A data de publicação dos resultados está inválida."
    );
  }

  if (new Date() < resultsReleaseDate) {
    redirectWithMessage(
      "erro",
      "O aviso de resultados só pode ser enviado após a data de publicação dos resultados."
    );
  }

  return currentEvent;
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
      .select("id, title, status, results_notified_at")
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

  if (submission.results_notified_at) {
  redirectWithMessage(
    "erro",
    "Este resultado já foi comunicado ao autor responsável e não pode mais ser alterado por esta tela."
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
        .is("results_notified_at", null)
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
      "O resultado não pôde ser alterado. O trabalho pode ter sido modificado ou o resultado já pode ter sido comunicado ao autor. Atualize a página e tente novamente."
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

async function sendSingleResultEmail({
  supabase,
  submission,
}: {
  supabase: Awaited<ReturnType<typeof ensureAdmin>>["supabase"];
  submission: {
    id: string;
    title: string;
    protocol: string | null;
    status: string;
    submission_authors:
      | {
          id: string;
          full_name: string;
          email: string;
          author_role: string;
          display_order: number;
        }[]
      | null;
  };
}) {
  const authors = [
    ...(submission.submission_authors ?? []),
  ].sort(
    (firstAuthor, secondAuthor) =>
      firstAuthor.display_order -
      secondAuthor.display_order
  );

  const responsibleAuthor =
    authors.find(
      (author) =>
        author.author_role === "responsible"
    ) ?? null;

  if (!responsibleAuthor?.email) {
    console.error(
      "Trabalho com resultado definido sem e-mail do autor responsável:",
      {
        submissionId: submission.id,
        protocol: submission.protocol,
        title: submission.title,
      }
    );

    return {
      success: false,
      submissionId: submission.id,
    };
  }

  try {
    const isSelected = [
      "selected_oral",
      "selected_banner",
    ].includes(submission.status);

    const emailSubject = isSelected
      ? `Trabalho selecionado - ${
          submission.protocol ?? submission.title
        }`
      : `Resultado da avaliação - ${
          submission.protocol ?? submission.title
        }`;

    const emailHtml = isSelected
      ? resultsAvailableEmail({
          authorName:
            responsibleAuthor.full_name ??
            "Autor(a)",
          title: submission.title,
          protocol: submission.protocol,
          resultLabel: getResultLabel(
            submission.status
          ),
        })
      : resultNotSelectedEmail({
          authorName:
            responsibleAuthor.full_name ??
            "Autor(a)",
          title: submission.title,
          protocol: submission.protocol,
        });

    const emailResult = await withTimeout(
      async () =>
        await sendEmail({
          to: responsibleAuthor.email,
          subject: emailSubject,
          html: emailHtml,
        }),
      "O envio do e-mail de resultado demorou mais que o esperado.",
      EMAIL_TIMEOUT_MS
    );

    if (!emailResult.success) {
      console.error(
        "E-mail de resultado não enviado:",
        {
          authorEmail:
            responsibleAuthor.email,
          submissionId: submission.id,
          emailResult,
        }
      );

      return {
        success: false,
        submissionId: submission.id,
      };
    }

    const { error: notifiedAtError } =
      await supabase
        .from("submissions")
        .update({
          results_notified_at:
            new Date().toISOString(),
        })
        .eq("id", submission.id)
        .is("results_notified_at", null);

    if (notifiedAtError) {
      console.error(
        "E-mail enviado, mas não foi possível registrar o envio do resultado:",
        {
          submissionId: submission.id,
          authorEmail:
            responsibleAuthor.email,
          message: notifiedAtError.message,
          details: notifiedAtError.details,
          hint: notifiedAtError.hint,
          code: notifiedAtError.code,
        }
      );

      return {
        success: false,
        submissionId: submission.id,
      };
    }

    return {
      success: true,
      submissionId: submission.id,
    };
  } catch (emailError) {
    console.error(
      "E-mail de resultado falhou ou demorou demais:",
      {
        authorEmail:
          responsibleAuthor.email,
        submissionId: submission.id,
        message:
          emailError instanceof Error
            ? emailError.message
            : "Erro desconhecido",
        error: emailError,
      }
    );

    return {
      success: false,
      submissionId: submission.id,
    };
  }
}

export async function sendResultsAvailableEmails() {
  const { supabase } = await ensureAdmin();

  const currentEvent =
    await ensureResultsNoticeCanBeSent(supabase);

  const {
    data: lockAcquired,
    error: lockError,
  } = await supabase.rpc(
    "claim_results_email_dispatch",
    {
      target_event_id: currentEvent.id,
    }
  );

  if (lockError) {
    console.error(
      "Erro ao bloquear o disparo de resultados:",
      {
        message: lockError.message,
        details: lockError.details,
        hint: lockError.hint,
        code: lockError.code,
      }
    );

    redirectWithMessage(
      "erro",
      "Não foi possível iniciar o envio dos resultados."
    );
  }

  if (!lockAcquired) {
    redirectWithMessage(
      "erro",
      "Já existe um envio de resultados em andamento. Aguarde a conclusão antes de tentar novamente."
    );
  }

  try {
    const {
      data: submissions,
      error: submissionsError,
    } = await supabase
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
      .eq("event_id", currentEvent.id)
      .is("results_notified_at", null)
      .in("status", [
        "selected_oral",
        "selected_banner",
        "not_selected",
      ])
      .order("updated_at", {
        ascending: true,
      });

    if (submissionsError) {
      console.error(
        "Erro ao carregar trabalhos com resultado definido:",
        {
          message: submissionsError.message,
          details: submissionsError.details,
          hint: submissionsError.hint,
          code: submissionsError.code,
        }
      );

      redirectWithMessage(
        "erro",
        "Não foi possível carregar os trabalhos com resultado definido."
      );
    }

    if (!submissions?.length) {
      redirectWithMessage(
        "erro",
        "Não há resultados pendentes de notificação. Os trabalhos com resultado definido já foram notificados ou ainda não possuem resultado final."
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    for (
      let index = 0;
      index < submissions.length;
      index += RESULTS_EMAIL_BATCH_SIZE
    ) {
      const batch = submissions.slice(
        index,
        index + RESULTS_EMAIL_BATCH_SIZE
      );

      const batchResults = await Promise.all(
        batch.map((submission) =>
          sendSingleResultEmail({
            supabase,
            submission,
          })
        )
      );

      for (const result of batchResults) {
        if (result.success) {
          sentCount += 1;
        } else {
          failedCount += 1;
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
        `${sentCount} e-mail(s) de resultado enviados. ${failedCount} envio(s) apresentaram erro e foram registrados no terminal.`
      );
    }

    redirectWithMessage(
      "sucesso",
      `${sentCount} e-mail(s) de resultado enviados com sucesso.`
    );
  } finally {
    const releaseLockResult =
      await supabase.rpc(
        "release_results_email_dispatch",
        {
          target_event_id: currentEvent.id,
        }
      );

    const releaseError = releaseLockResult.error;

    if (releaseError !== null) {
      console.error(
        "Erro ao liberar bloqueio do envio de resultados:",
        {
          eventId: currentEvent.id,
          message: releaseError?.message ?? "Erro desconhecido",
          details: releaseError?.details ?? null,
          hint: releaseError?.hint ?? null,
          code: releaseError?.code ?? null,
        }
      );
    }
  }
}