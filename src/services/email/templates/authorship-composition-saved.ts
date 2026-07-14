type AuthorshipCompositionSavedEmailInput = {
  authorName: string;
  responsibleAuthorName: string;
  title: string;
  role: "coauthor" | "advisor";
  savedAt: string;
};

export function authorshipCompositionSavedEmail({
  authorName,
  responsibleAuthorName,
  title,
  role,
  savedAt,
}: AuthorshipCompositionSavedEmailInput) {
  const roleLabel =
    role === "advisor"
      ? "orientador(a)"
      : "coautor(a)";

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">
          Confirmação de inclusão na autoria
        </h1>

        <p style="margin: 0 0 20px;">
          Olá, ${authorName}.
        </p>

        <p>
          Você foi incluído(a) como <strong>${roleLabel}</strong> em um trabalho
          cadastrado na plataforma da Jornada Acadêmica de Medicina.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px;">
            <strong>Título do trabalho:</strong><br />
            ${title}
          </p>

          <p style="margin: 0 0 8px;">
            <strong>Autor responsável:</strong><br />
            ${responsibleAuthorName}
          </p>

          <p style="margin: 0;">
            <strong>Data do registro da autoria:</strong><br />
            ${savedAt}
          </p>
        </div>

        <p>
          Este e-mail informa apenas que seu nome foi registrado na composição
          da autoria. O comprovante de submissão definitiva será enviado quando
          o trabalho for finalizado e submetido na plataforma.
        </p>

        <p style="margin-top: 24px;">
          Atenciosamente,<br />
          <strong>Comissão Científica da Jornada Acadêmica de Medicina</strong>
        </p>
      </div>
    </div>
  `;
}