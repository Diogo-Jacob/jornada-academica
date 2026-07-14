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
          Resultados disponíveis
        </h1>

        <p style="margin: 0 0 20px;">
          Olá, ${authorName}.
        </p>

        <p>
          O prazo de submissões e avaliação dos trabalhos da Jornada Acadêmica
          de Medicina foi encerrado.
        </p>

        <p>
          Os resultados dos trabalhos submetidos já estão disponíveis na
          plataforma. Acesse sua área do aluno para conferir a situação do
          trabalho e as orientações da Comissão Científica.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;">
            <strong>Trabalho:</strong><br />
            ${title}
          </p>

          <p style="margin: 0 0 8px;">
            <strong>Protocolo:</strong><br />
            ${protocol ?? "Protocolo não informado"}
          </p>

          <p style="margin: 0;">
            <strong>Resultado:</strong><br />
            ${resultLabel}
          </p>
        </div>

        <p>
          Para visualizar mais detalhes, acesse a plataforma com seu login e
          consulte a área de trabalhos submetidos.
        </p>

        <p style="margin-top: 24px;">
          Atenciosamente,<br />
          <strong>Comissão Científica da Jornada Acadêmica de Medicina</strong>
        </p>
      </div>
    </div>
  `;
}