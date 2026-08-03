import { safeText } from "./utils";

type SubmissionConfirmationEmailInput = {
  studentName: string;
  title: string;
  protocol: string;
  submittedAt: string;
};

export function submissionConfirmationEmail({
  studentName,
  title,
  protocol,
  submittedAt,
}: SubmissionConfirmationEmailInput) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">
          Submissão recebida
        </h1>

        <p style="margin: 0 0 20px;">
          Olá, ${safeText(studentName)}.
        </p>

        <p>
          Recebemos a submissão do seu trabalho científico na plataforma da
          Jornada Acadêmica de Medicina.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;">
            <strong>Título:</strong><br />
            ${safeText(title)}
          </p>

          <p style="margin: 0 0 8px;">
            <strong>Protocolo:</strong><br />
            ${safeText(protocol)}
          </p>

          <p style="margin: 0;">
            <strong>Data e horário da submissão:</strong><br />
            ${safeText(submittedAt)}
          </p>
        </div>

        <p>
          Este e-mail serve como comprovante de recebimento da submissão.
          A documentação será analisada pela Comissão Científica, e novas
          orientações poderão ser enviadas pela plataforma.
        </p>

        <p style="margin-top: 24px;">
          Atenciosamente,<br />
          <strong>Comissão Científica da Jornada Acadêmica de Medicina</strong>
        </p>
      </div>
    </div>
  `;
}