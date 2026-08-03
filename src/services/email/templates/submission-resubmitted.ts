import { safeText } from "./utils";

type SubmissionResubmittedEmailInput = {
  studentName: string;
  title: string;
  protocol: string | null;
  resubmittedAt: string;
};

export function submissionResubmittedEmail({
  studentName,
  title,
  protocol,
  resubmittedAt,
}: SubmissionResubmittedEmailInput) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">
          Trabalho reenviado com sucesso
        </h1>

        <p style="margin: 0 0 20px;">
          Olá, ${safeText(studentName)}.
        </p>

        <p>
          Recebemos o reenvio do seu trabalho após a solicitação de correções
          documentais.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;">
            <strong>Título:</strong><br />
            ${safeText(title)}
          </p>

          <p style="margin: 0 0 8px;">
            <strong>Protocolo:</strong><br />
            ${safeText(protocol, "Protocolo não informado")}
          </p>

          <p style="margin: 0;">
            <strong>Data e horário do reenvio:</strong><br />
            ${safeText(resubmittedAt)}
          </p>
        </div>

        <p>
          A documentação será analisada novamente pela Comissão Científica.
          Caso ainda haja alguma pendência, novas orientações poderão ser
          enviadas pela plataforma.
        </p>

        <p style="margin-top: 24px;">
          Atenciosamente,<br />
          <strong>Comissão Científica da Jornada Acadêmica de Medicina</strong>
        </p>
      </div>
    </div>
  `;
}