type CorrectionRequestedEmailInput = {
  studentName: string;
  title: string;
  protocol: string | null;
  notes: string;
  reviewedAt: string;
};

export function correctionRequestedEmail({
  studentName,
  title,
  protocol,
  notes,
  reviewedAt,
}: CorrectionRequestedEmailInput) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">
          Correções solicitadas
        </h1>

        <p style="margin: 0 0 20px;">
          Olá, ${studentName}.
        </p>

        <p>
          A Comissão Científica analisou a documentação da sua submissão e
          solicitou correções antes do encaminhamento para avaliação científica.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;">
            <strong>Título:</strong><br />
            ${title}
          </p>

          <p style="margin: 0 0 8px;">
            <strong>Protocolo:</strong><br />
            ${protocol ?? "Protocolo não informado"}
          </p>

          <p style="margin: 0;">
            <strong>Data da análise:</strong><br />
            ${reviewedAt}
          </p>
        </div>

        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;">
            <strong>Orientações para correção:</strong>
          </p>

          <p style="white-space: pre-wrap; margin: 0;">
            ${notes}
          </p>
        </div>

        <p>
          Acesse a plataforma para realizar os ajustes solicitados e reenviar
          o trabalho dentro do prazo previsto.
        </p>

        <p style="margin-top: 24px;">
          Atenciosamente,<br />
          <strong>Comissão Científica da Jornada Acadêmica de Medicina</strong>
        </p>
      </div>
    </div>
  `;
}