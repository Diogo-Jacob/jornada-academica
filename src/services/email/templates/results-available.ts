import { safeText } from "./utils";

type ResultsAvailableEmailInput = {
  authorName: string;
  title: string;
  protocol: string | null;
  resultLabel: string;
};

export function resultsAvailableEmail({
  authorName,
  title,
  protocol,
  resultLabel,
}: ResultsAvailableEmailInput) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">
          Resultado da avaliação científica
        </h1>

        <p style="margin: 0 0 20px;">
          Olá, ${safeText(authorName)}.
        </p>

        <p>
          Temos a satisfação de informar que o trabalho abaixo foi selecionado
          para apresentação na Jornada Acadêmica de Medicina.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;">
            <strong>Trabalho:</strong><br />
            ${safeText(title)}
          </p>

          <p style="margin: 0 0 8px;">
            <strong>Protocolo:</strong><br />
            ${safeText(protocol, "Protocolo não informado")}
          </p>

          <p style="margin: 0;">
            <strong>Modalidade de apresentação:</strong><br />
            ${safeText(resultLabel)}
          </p>
        </div>
        
        <p>
          Apenas os trabalhos selecionados para apresentação oral ou banner
          recebem este aviso por e-mail.
        </p>

        <p style="margin-top: 24px;">
          Atenciosamente,<br />
          <strong>Comissão Científica da Jornada Acadêmica de Medicina</strong>
        </p>
      </div>
    </div>
  `;
}