import { Resend } from "resend";
import { safeText } from "./templates/utils";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY não configurada. E-mail não enviado."
    );

    return {
      success: false,
      skipped: true,
      error: "RESEND_API_KEY não configurada.",
    };
  }

  if (!from) {
    console.warn(
      "EMAIL_FROM não configurada. E-mail não enviado."
    );

    return {
      success: false,
      skipped: true,
      error: "EMAIL_FROM não configurada.",
    };
  }

  const originalRecipients = Array.isArray(to) ? to : [to];

  const testEmail = process.env.RESEND_TEST_EMAIL;

  const recipients = testEmail
    ? [testEmail]
    : originalRecipients;

  const testModeNotice = testEmail
    ? `
      <div style="margin-bottom: 24px; padding: 12px; border: 1px solid #f59e0b; background: #fffbeb; border-radius: 8px; color: #92400e;">
        <strong>Modo de teste:</strong><br />
        Este e-mail seria enviado originalmente para:
        ${safeText(originalRecipients.join(", "))}
      </div>
    `
    : "";

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: recipients,
    subject: testEmail
      ? `[TESTE] ${subject}`
      : subject,
    html: `${testModeNotice}${html}`,
  });

  if (error) {
    console.error("Erro ao enviar e-mail:", error);

    return {
      success: false,
      skipped: false,
      error,
    };
  }

  return {
    success: true,
    skipped: false,
    data,
  };
}