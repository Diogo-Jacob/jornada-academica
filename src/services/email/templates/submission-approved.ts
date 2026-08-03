import { safeText } from "./utils";

type SubmissionApprovedEmailInput = {
  studentName: string;
  title: string;
  protocol: string | null;
  approvedAt: string;
};

export function submissionApprovedEmail({
  studentName,
  title,
  protocol,
  approvedAt,
}: SubmissionApprovedEmailInput) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">
          Trabalho aprovado para avaliação científica
        </h1>

        <p style="margin: 0 0 20px;">
          Olá, ${safeText(studentName)}.
        </p>

        <p>
          A documentação do seu trabalho foi conferida pela Comissão Científica
          e a submissão foi aprovada para seguir para a etapa de avaliação científica.
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
            <strong>Data da aprovação documental:</strong><br />
            ${safeText(approvedAt)}
          </p>
        </div>

        <p>
          A partir de agora, o trabalho seguirá para avaliação dos pareceristas.
          O resultado final será disponibilizado na plataforma conforme o cronograma do evento.
        </p>

        <p style="margin-top: 24px;">
          Atenciosamente,<br />
          <strong>Comissão Científica da Jornada Acadêmica de Medicina</strong>
        </p>
      </div>
    </div>
  `;
}