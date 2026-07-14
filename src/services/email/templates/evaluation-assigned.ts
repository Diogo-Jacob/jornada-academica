type EvaluationAssignedEmailInput = {
  evaluatorName: string;
  title: string;
  assignmentType: "initial" | "replacement" | "third";
  assignedAt: string;
};

export function evaluationAssignedEmail({
  evaluatorName,
  title,
  assignmentType,
  assignedAt,
}: EvaluationAssignedEmailInput) {
  const titleByType = {
    initial: "Novo trabalho atribuído para avaliação",
    replacement: "Novo trabalho atribuído como substituição",
    third: "Trabalho atribuído como terceira avaliação",
  };

  const descriptionByType = {
    initial:
      "Um novo trabalho foi atribuído a você para avaliação científica.",
    replacement:
      "Um trabalho foi atribuído a você como substituição de avaliador.",
    third:
      "Um trabalho foi atribuído a você para realização de terceira avaliação.",
  };

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">
          ${titleByType[assignmentType]}
        </h1>

        <p style="margin: 0 0 20px;">
          Olá, ${evaluatorName}.
        </p>

        <p>
          ${descriptionByType[assignmentType]}
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;">
            <strong>Trabalho:</strong><br />
            ${title}
          </p>

          <p style="margin: 0;">
            <strong>Data da atribuição:</strong><br />
            ${assignedAt}
          </p>
        </div>

        <p>
          Acesse o painel do avaliador na plataforma para visualizar o trabalho
          anonimizado e iniciar a avaliação.
        </p>

        <p>
          Caso não seja possível realizar a avaliação, utilize a opção de recusa
          disponível no próprio painel, para que a Comissão Científica possa
          providenciar a substituição.
        </p>

        <p style="margin-top: 24px;">
          Atenciosamente,<br />
          <strong>Comissão Científica da Jornada Acadêmica de Medicina</strong>
        </p>
      </div>
    </div>
  `;
}