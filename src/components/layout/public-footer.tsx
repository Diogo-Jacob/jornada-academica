export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p className="font-medium text-foreground">
          Jornada Acadêmica de Medicina
        </p>

        <p>
          Plataforma de organização, submissão e avaliação de trabalhos
          científicos.
        </p>

        <p>
          © {new Date().getFullYear()} CAMPGO — Centro Acadêmico de Medicina.
        </p>
      </div>
    </footer>
  );
}