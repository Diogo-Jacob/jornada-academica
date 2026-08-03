import { safeText } from "./utils";

type EvaluationDeclinedAdminEmailInput = {
  adminName: string;
  evaluatorName: string;
  evaluatorEmail: string | null;
  title: string;
  declinedAt: string;
};

export function evaluationDeclinedAdminEmail({
  adminName,
  evaluatorName,
  evaluatorEmail,
  title,
  declinedAt,
}: EvaluationDeclinedAdminEmailInput) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">
          Avaliação recusada
        </h1>

        <p style="margin: 0 0 20px;">
          Olá, ${adminName}.
        </p>

        <p>
          Um avaliador recusou uma avaliação atribuída. A submissão foi marcada
          como aguardando substituição de avaliador.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;">
            <strong>Trabalho:</strong><br />
            ${safeText(title)}
          </p>

          <p style="margin: 0 0 8px;">
            <strong>Avaliador que recusou:</strong><br />
            ${evaluatorName}
            ${evaluatorEmail ? `<br />${evaluatorEmail}` : ""}
          </p>

          <p style="margin: 0;">
            <strong>Data da recusa:</strong><br />
            ${declinedAt}
          </p>
        </div>

        <p>
          Acesse o painel administrativo, vá até a área de avaliações e indique
          um avaliador substituto para que o processo possa continuar.
        </p>

        <p style="margin-top: 24px;">
          Atenciosamente,<br />
          <strong>Sistema da Jornada Acadêmica de Medicina</strong>
        </p>
      </div>
    </div>
  `;
}