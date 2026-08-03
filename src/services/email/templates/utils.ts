export function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function safeText(
  value: string | null | undefined,
  fallback = "Não informado"
) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return fallback;
  }

  return escapeHtml(normalizedValue);
}