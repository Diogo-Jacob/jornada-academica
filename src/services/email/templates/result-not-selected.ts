import { safeText } from "./utils";

type ResultNotSelectedEmailInput = {
  authorName: string;
  title: string;
  protocol: string | null;
};

export function resultNotSelectedEmail({
  authorName,
  title,
  protocol,
}: ResultNotSelectedEmailInput) {
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
          Informamos que o trabalho abaixo foi avaliado pela Comissão Científica
          da Jornada Acadêmica de Medicina, porém não ficou entre os trabalhos
          selecionados para apresentação nesta edição.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;">
            <strong>Trabalho:</strong><br />
            ${safeText(title)}
          </p>

          <p style="margin: 0;">
            <strong>Protocolo:</strong><br />
            ${safeText(protocol, "Protocolo não informado")}
          </p>
        </div>

        <p>
          Agradecemos pela submissão e pelo interesse em contribuir com a produção
          científica do evento.
        </p>

        <p>
          Reforçamos que a não seleção para apresentação não diminui a importância
          da iniciativa acadêmica e do envolvimento dos autores na pesquisa.
        </p>

        <p style="margin-top: 24px;">
          Atenciosamente,<br />
          <strong>Comissão Científica da Jornada Acadêmica de Medicina</strong>
        </p>
      </div>
    </div>
  `;
}