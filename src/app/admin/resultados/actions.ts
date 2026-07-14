"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/services/email/send-email";
import { resultsAvailableEmail } from "@/services/email/templates/results-available";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type FinalResultStatus =
  | "selected_oral"
  | "selected_banner"
  | "not_selected";

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
    redirect("/login");
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
    selected_banner: "Selecionado para banner",
    not_selected: "Não selecionado",
    result_confirmed: "Resultado confirmado",
  };

  return labels[status] ?? "Resultado disponível";
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

  const { error: updateError } = await supabase
    .from("submissions")
    .update({
      status: finalStatus,
    })
    .eq("id", submissionId);

  if (updateError) {
    console.error("Erro ao definir resultado final:", {
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

  revalidatePath("/admin/resultados");
  revalidatePath("/admin/avaliacoes");
  revalidatePath("/admin/submissoes");
  revalidatePath(`/admin/submissoes/${submissionId}`);

  redirectWithMessage(
    "sucesso",
    `Resultado definido como "${getFinalResultLabel(finalStatus)}".`
  );
}

export async function sendResultsAvailableEmails() {
  const { supabase } = await ensureAdmin();

  const { data: submissions, error: submissionsError } =
    await supabase
      .from("submissions")
      .select(`
        id,
        title,
        protocol,
        status,

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
        "not_selected",
        "result_confirmed",
      ]);

  if (submissionsError) {
    console.error("Erro ao carregar trabalhos com resultado:", {
      message: submissionsError.message,
      details: submissionsError.details,
      hint: submissionsError.hint,
      code: submissionsError.code,
    });

    redirectWithMessage(
      "erro",
      "Não foi possível carregar os trabalhos com resultado disponível."
    );
  }

  if (!submissions?.length) {
    redirectWithMessage(
      "erro",
      "Nenhum trabalho com resultado final disponível foi encontrado."
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

      const emailResult = await sendEmail({
        to: author.email,
        subject: `Resultados disponíveis - ${submission.protocol ?? submission.title}`,
        html: resultsAvailableEmail({
          authorName: author.full_name ?? "Autor(a)",
          title: submission.title,
          protocol: submission.protocol,
          resultLabel: getResultLabel(submission.status),
        }),
      });

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
    }
  }

  revalidatePath("/admin/resultados");

  if (sentCount === 0) {
    redirectWithMessage(
      "erro",
      "Nenhum e-mail de resultado foi enviado. Confira os autores cadastrados e a configuração de e-mail."
    );
  }

  if (failedCount > 0) {
    redirectWithMessage(
      "sucesso",
      `${sentCount} e-mail(s) enviados. ${failedCount} envio(s) apresentaram erro e foram registrados no terminal.`
    );
  }

  redirectWithMessage(
    "sucesso",
    `${sentCount} e-mail(s) de aviso de resultado enviados com sucesso.`
  );
}