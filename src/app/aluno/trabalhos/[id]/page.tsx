import Link from "next/link";
import {
  CorrectionConfirmationPanel,
  CorrectionNoticePanel,
} from "./correction-panel";
import { FinalResultCard } from "../final-result-card";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileCheck2,
  FileText,
  Send,
  ShieldCheck,
  Stethoscope,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import {
  saveAuthorComposition,
  submitSubmission,
  uploadAdvisorDeclaration,
  uploadEthicsApproval,
  uploadSubmissionFiles,
} from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type TrabalhoPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

function getOrdinal(position: number) {
  return `${position}º`;
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    submitted: "Submetido",
    under_document_review: "Em conferência documental",
    correction_requested: "Correção solicitada",
    resubmitted: "Reenviado",
    approved_for_evaluation: "Aprovado para avaliação",
    under_evaluation: "Em avaliação",
    one_evaluation_completed: "Em avaliação",
    evaluations_completed: "Avaliações concluídas",
    third_evaluator_required: "Em avaliação",
    evaluator_replacement_required: "Em avaliação",
    pending_confirmation: "Avaliações concluídas",
    result_confirmed: "Resultado confirmado",
    selected_oral: "Selecionado para apresentação oral",
    selected_banner: "Selecionado para apresentação em banner",
    not_selected: "Não selecionado",
  };

  return labels[status] ?? status;
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    draft:
      "border-slate-300 bg-slate-50 text-slate-700",
    submitted:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    under_document_review:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    correction_requested:
      "border-amber-300 bg-amber-50 text-amber-800",
    resubmitted:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    approved_for_evaluation:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    under_evaluation:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    one_evaluation_completed:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    third_evaluator_required:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    evaluator_replacement_required:
      "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]",
    evaluations_completed:
      "border-green-300 bg-green-50 text-green-800",
    pending_confirmation:
      "border-green-300 bg-green-50 text-green-800",
    result_confirmed:
      "border-green-300 bg-green-50 text-green-800",
    selected_oral:
      "border-green-300 bg-green-50 text-green-800",
    selected_banner:
      "border-green-300 bg-green-50 text-green-800",
    not_selected:
      "border-red-300 bg-red-50 text-red-800",
  };

  return (
    classes[status] ??
    "border-[#b9d4df] bg-[#eef7fa] text-[#245b7a]"
  );
}

export default async function TrabalhoPage({
  params,
  searchParams,
}: TrabalhoPageProps) {
  const { id } = await params;
  const messages = await searchParams;

  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const { data: submission, error } = await supabase
    .from("submissions")
    .select(`
      id,
      title,
      protocol,
      status,
      created_at,
      total_authors,
      requires_ethics_approval,

      submission_categories (
        name
      ),

      submission_authors (
        id,
        full_name,
        email,
        is_responsible,
        author_role,
        display_order
      ),

      submission_files (
        id,
        file_type,
        original_filename,
        size_bytes,
        version_number,
        is_current,
        created_at
      ),

      events(
        submission_ends_at
      )
    `)
    .eq("id", id)
    .eq("owner_user_id", profile.id)
    .single();

  if (error || !submission) {
    notFound();
  }

  const category = Array.isArray(
    submission.submission_categories
  )
    ? submission.submission_categories[0]
    : submission.submission_categories;

  const authors = [
    ...(submission.submission_authors ?? []),
  ].sort(
    (firstAuthor, secondAuthor) =>
      firstAuthor.display_order -
      secondAuthor.display_order
  );

  const responsibleAuthor = authors.find(
    (author) =>
      author.author_role === "responsible"
  );

  const authorsByPosition = new Map(
    authors.map((author) => [
      author.display_order,
      author,
    ])
  );

  const currentFiles = (
    submission.submission_files ?? []
  ).filter((file) => file.is_current);

  const identifiedFile = currentFiles.find(
    (file) => file.file_type === "identified"
  );

  const anonymousFile = currentFiles.find(
    (file) => file.file_type === "anonymous"
  );

  const ethicsFile = currentFiles.find(
    (file) => file.file_type === "ethics_approval"
  );

  const advisorDeclaration = currentFiles.find(
    (file) =>
      file.file_type === "advisor_declaration"
  );

  const isDraft = submission.status === "draft";

  const isCorrectionRequested =
    submission.status === "correction_requested";

  const canEdit =
    isDraft || isCorrectionRequested;

  const totalAuthors =
    submission.total_authors ?? 2;

  const authorPositions = Array.from(
    {
      length: Math.max(totalAuthors - 1, 1),
    },
    (_, index) => index + 2
  );

  function getDownloadUrl(fileId: string) {
    return `/aluno/trabalhos/${id}/arquivos/${fileId}`;
  }

  const eventValue = submission.events;

  const event = Array.isArray(eventValue)
    ? eventValue[0]
    : eventValue;

  const canShowFinalResult =
    Boolean(event?.submission_ends_at) &&
    new Date() >= new Date(event.submission_ends_at);

  const displayedStatus =
    !canShowFinalResult &&
    ["selected_oral", "selected_banner"].includes(submission.status)
      ? "evaluations_completed"
      : submission.status;

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        className="-ml-3 text-[#245b7a] hover:bg-[#eef7fa] hover:text-[#173f59]"
        asChild
      >
        <Link href="/aluno/trabalhos">
          <ArrowLeft />
          Voltar para meus trabalhos
        </Link>
      </Button>

      {(messages.erro || messages.sucesso) && (
        <section className="space-y-3">
          {messages.erro && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
              {messages.erro}
            </div>
          )}

          {messages.sucesso && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
              {messages.sucesso}
            </div>
          )}
        </section>
      )}

      <CorrectionNoticePanel
        submissionId={submission.id}
      />

      <section className="relative overflow-hidden rounded-[2rem] bg-[#102a3d] p-8 text-white shadow-sm lg:p-10">
        <div className="absolute right-[-120px] top-[-120px] size-80 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] size-96 rounded-full bg-[#245b7a]/60 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
              <Stethoscope className="size-4" />
              Trabalho científico
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                displayedStatus
              )}`}
            >
              {formatStatus(displayedStatus)}
            </span>

            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/75">
              {submission.protocol ??
                "Protocolo ainda não gerado"}
            </span>
          </div>

          <h1 className="mt-6 max-w-5xl text-3xl font-bold tracking-tight sm:text-4xl">
            {submission.title}
          </h1>

          <p className="mt-4 max-w-3xl leading-7 text-white/75">
            Categoria:{" "}
            <span className="font-medium text-white">
              {category?.name ?? "Não informada"}
            </span>
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <HeroInfo
              label="Autores previstos"
              value={totalAuthors}
            />

            <HeroInfo
              label="Arquivo identificado"
              value={identifiedFile ? "Enviado" : "Pendente"}
            />

            <HeroInfo
              label="Arquivo anonimizado"
              value={anonymousFile ? "Enviado" : "Pendente"}
            />
          </div>
        </div>
      </section>

      <FinalResultCard
        status={submission.status}
        canShowResult={canShowFinalResult}
      />

      <Card
        id="autores-section"
        className="scroll-mt-28 overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm"
      >
        <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
          <CardTitle className="flex items-center gap-2 text-[#102a3d]">
            <Users className="size-5 text-[#245b7a]" />
            Composição da autoria
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="rounded-3xl border border-[#d9e8ef] bg-[#eef7fa] p-5">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#245b7a]">
                <UserRound className="size-5" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#102a3d]">
                    {responsibleAuthor?.full_name ??
                      profile.full_name}
                  </p>

                  <span className="rounded-full bg-white px-3 py-1 text-xs text-[#245b7a]">
                    1º autor
                  </span>

                  <span className="rounded-full bg-white px-3 py-1 text-xs text-[#245b7a]">
                    Autor responsável
                  </span>
                </div>

                <p className="mt-1 text-sm text-[#5f7d90]">
                  {responsibleAuthor?.email ??
                    profile.email}
                </p>
              </div>
            </div>
          </div>

          {canEdit ? (
            <form
              action={saveAuthorComposition}
              className="space-y-5"
            >
              <input
                type="hidden"
                name="submissionId"
                value={submission.id}
              />

              {authorPositions.map((position) => {
                const author =
                  authorsByPosition.get(position);

                const isAdvisor =
                  position === totalAuthors;

                return (
                  <div
                    key={position}
                    className="rounded-3xl border border-[#d9e8ef] bg-white p-5 shadow-sm"
                  >
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#eef7fa] px-3 py-1 text-xs font-medium text-[#245b7a]">
                        {getOrdinal(position)} autor
                      </span>

                      <h3 className="font-semibold text-[#102a3d]">
                        {isAdvisor
                          ? "Orientador"
                          : `${position}º autor`}
                      </h3>

                      {isAdvisor && (
                        <span className="rounded-full border border-[#b9d4df] px-3 py-1 text-xs text-[#5f7d90]">
                          Último autor
                        </span>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`author_${position}_name`}
                        >
                          Nome completo
                        </Label>

                        <Input
                          id={`author_${position}_name`}
                          name={`author_${position}_name`}
                          defaultValue={
                            author?.full_name ?? ""
                          }
                          placeholder={
                            isAdvisor
                              ? "Nome completo do orientador"
                              : `Nome completo do ${position}º autor`
                          }
                          className="border-[#d9e8ef] focus-visible:ring-[#245b7a]/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`author_${position}_email`}
                        >
                          E-mail
                        </Label>

                        <Input
                          id={`author_${position}_email`}
                          name={`author_${position}_email`}
                          type="email"
                          defaultValue={
                            author?.email ?? ""
                          }
                          placeholder={
                            isAdvisor
                              ? "orientador@exemplo.com"
                              : "autor@exemplo.com"
                          }
                          className="border-[#d9e8ef] focus-visible:ring-[#245b7a]/20"
                          required
                        />
                      </div>
                    </div>

                    {isAdvisor && (
                      <p className="mt-4 text-sm leading-6 text-[#5f7d90]">
                        O orientador será obrigatoriamente
                        o último autor do trabalho.
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#245b7a] hover:bg-[#173f59]"
                >
                  Salvar autores
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {authors
                .filter(
                  (author) =>
                    author.author_role !==
                    "responsible"
                )
                .map((author) => (
                  <div
                    key={author.id}
                    className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#102a3d]">
                        {author.full_name}
                      </p>

                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[#245b7a]">
                        {author.display_order}º autor
                      </span>

                      {author.author_role ===
                        "advisor" && (
                        <span className="rounded-full border border-[#b9d4df] px-3 py-1 text-xs text-[#5f7d90]">
                          Orientador
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-[#5f7d90]">
                      {author.email}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card
            id="aspectos-eticos-section"
            className="scroll-mt-28 overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm"
          >
            <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
              <CardTitle className="flex items-center gap-2 text-[#102a3d]">
                <FileCheck2 className="size-5 text-[#245b7a]" />
                Aspectos éticos
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-6">
              <InfoBox
                title="Aprovação do CEP"
                description={
                  submission.requires_ethics_approval
                    ? "O trabalho necessita de aprovação do Comitê de Ética em Pesquisa."
                    : "O trabalho foi declarado como dispensado de aprovação pelo Comitê de Ética em Pesquisa."
                }
              />

              {submission.requires_ethics_approval && (
                <div className="rounded-3xl border border-[#d9e8ef] bg-white p-5">
                  <FileStatus
                    title="Parecer consubstanciado"
                    filename={ethicsFile?.original_filename}
                    size={
                      ethicsFile
                        ? formatFileSize(
                            ethicsFile.size_bytes
                          )
                        : null
                    }
                    version={
                      ethicsFile?.version_number ?? null
                    }
                    isSent={Boolean(ethicsFile)}
                    missingText="Documento ainda não enviado."
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    {ethicsFile && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-[#b9d4df] text-[#245b7a] hover:bg-[#eef7fa]"
                      >
                        <Link
                          href={getDownloadUrl(
                            ethicsFile.id
                          )}
                        >
                          <Download />
                          Baixar parecer do CEP
                        </Link>
                      </Button>
                    )}
                  </div>

                  {canEdit && (
                    <UploadFormWrapper>
                      <form
                        action={uploadEthicsApproval}
                        className="space-y-4"
                      >
                        <input
                          type="hidden"
                          name="submissionId"
                          value={submission.id}
                        />

                        <div className="space-y-2">
                          <Label htmlFor="ethicsApprovalFile">
                            {ethicsFile
                              ? "Substituir parecer do CEP"
                              : "Enviar parecer do CEP"}
                          </Label>

                          <Input
                            id="ethicsApprovalFile"
                            name="ethicsApprovalFile"
                            type="file"
                            accept=".pdf,application/pdf"
                            className="border-[#d9e8ef]"
                            required
                          />

                          <p className="text-xs leading-5 text-[#5f7d90]">
                            Envie o parecer consubstanciado em PDF, com no máximo 5 MB.
                          </p>
                        </div>

                        <Button
                          type="submit"
                          variant="outline"
                          className="border-[#b9d4df] text-[#245b7a] hover:bg-[#eef7fa]"
                        >
                          <Upload />
                          {ethicsFile
                            ? "Substituir parecer do CEP"
                            : "Enviar parecer do CEP"}
                        </Button>
                      </form>
                    </UploadFormWrapper>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            id="declaracao-orientador-section"
            className="scroll-mt-28 overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm"
          >
            <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
              <CardTitle className="flex items-center gap-2 text-[#102a3d]">
                <ShieldCheck className="size-5 text-[#245b7a]" />
                Declaração do orientador
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-6">
              <div className="rounded-3xl border border-[#d9e8ef] bg-white p-5">
                <FileStatus
                  title={
                    advisorDeclaration
                      ? advisorDeclaration.original_filename
                      : "Documento pendente"
                  }
                  filename={undefined}
                  size={
                    advisorDeclaration
                      ? formatFileSize(
                          advisorDeclaration.size_bytes
                        )
                      : null
                  }
                  version={
                    advisorDeclaration?.version_number ??
                    null
                  }
                  isSent={Boolean(advisorDeclaration)}
                  missingText="Anexe a declaração assinada pelo orientador."
                />

                {advisorDeclaration && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-[#b9d4df] text-[#245b7a] hover:bg-[#eef7fa]"
                    asChild
                  >
                    <Link
                      href={getDownloadUrl(
                        advisorDeclaration.id
                      )}
                    >
                      <Download />
                      Baixar declaração
                    </Link>
                  </Button>
                )}
              </div>

              {canEdit && (
                <UploadFormWrapper>
                  <form
                    action={uploadAdvisorDeclaration}
                    className="space-y-4"
                  >
                    <input
                      type="hidden"
                      name="submissionId"
                      value={submission.id}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="advisorDeclarationFile">
                        Declaração em PDF
                      </Label>

                      <Input
                        id="advisorDeclarationFile"
                        name="advisorDeclarationFile"
                        type="file"
                        accept=".pdf,application/pdf"
                        className="border-[#d9e8ef]"
                        required
                      />

                      <p className="text-xs leading-5 text-[#5f7d90]">
                        Formato PDF, com no máximo 5 MB.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full border-[#b9d4df] text-[#245b7a] hover:bg-[#eef7fa]"
                    >
                      <Upload />
                      {advisorDeclaration
                        ? "Substituir declaração"
                        : "Enviar declaração"}
                    </Button>
                  </form>
                </UploadFormWrapper>
              )}
            </CardContent>
          </Card>
        </div>

        <Card
          id="arquivos-trabalho-section"
          className="scroll-mt-28 overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm"
        >
          <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
            <CardTitle className="flex items-center gap-2 text-[#102a3d]">
              <FileText className="size-5 text-[#245b7a]" />
              Arquivos do trabalho
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 p-6">
            <div className="rounded-3xl border border-[#d9e8ef] bg-white p-5">
              <FileStatus
                title="Versão identificada"
                filename={identifiedFile?.original_filename}
                size={
                  identifiedFile
                    ? formatFileSize(
                        identifiedFile.size_bytes
                      )
                    : null
                }
                version={
                  identifiedFile?.version_number ?? null
                }
                isSent={Boolean(identifiedFile)}
                missingText="Nenhum arquivo enviado."
              />

              {identifiedFile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-[#b9d4df] text-[#245b7a] hover:bg-[#eef7fa]"
                  asChild
                >
                  <Link
                    href={getDownloadUrl(
                      identifiedFile.id
                    )}
                  >
                    <Download />
                    Baixar versão identificada
                  </Link>
                </Button>
              )}
            </div>

            <div className="rounded-3xl border border-[#d9e8ef] bg-white p-5">
              <FileStatus
                title="Versão anonimizada"
                filename={anonymousFile?.original_filename}
                size={
                  anonymousFile
                    ? formatFileSize(
                        anonymousFile.size_bytes
                      )
                    : null
                }
                version={
                  anonymousFile?.version_number ?? null
                }
                isSent={Boolean(anonymousFile)}
                missingText="Nenhum arquivo enviado."
              />

              {anonymousFile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-[#b9d4df] text-[#245b7a] hover:bg-[#eef7fa]"
                  asChild
                >
                  <Link
                    href={getDownloadUrl(
                      anonymousFile.id
                    )}
                  >
                    <Download />
                    Baixar versão anonimizada
                  </Link>
                </Button>
              )}
            </div>

            {canEdit && (
              <UploadFormWrapper>
                <form
                  action={uploadSubmissionFiles}
                  className="space-y-5"
                >
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
                  />

                  <div>
                    <h3 className="font-semibold text-[#102a3d]">
                      {identifiedFile || anonymousFile
                        ? "Substituir arquivos"
                        : "Enviar arquivos"}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[#5f7d90]">
                      Envie as duas versões em formato
                      DOCX, com no máximo 2 MB cada.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="identifiedFile">
                      Versão identificada
                    </Label>

                    <Input
                      id="identifiedFile"
                      name="identifiedFile"
                      type="file"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="border-[#d9e8ef]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anonymousFile">
                      Versão anonimizada
                    </Label>

                    <Input
                      id="anonymousFile"
                      name="anonymousFile"
                      type="file"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="border-[#d9e8ef]"
                      required
                    />

                    <p className="text-xs leading-5 text-[#5f7d90]">
                      Confira se esta versão não contém
                      nomes, e-mails, orientador ou outras
                      identificações.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#245b7a] hover:bg-[#173f59]"
                  >
                    <Upload />
                    {identifiedFile || anonymousFile
                      ? "Substituir os dois arquivos"
                      : "Enviar os dois arquivos"}
                  </Button>
                </form>
              </UploadFormWrapper>
            )}
          </CardContent>
        </Card>
      </div>

      <CorrectionConfirmationPanel
        submissionId={submission.id}
      />

      {isDraft && (
        <Card className="overflow-hidden rounded-[2rem] border-[#b9d4df] bg-white shadow-sm">
          <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
            <CardTitle className="flex items-center gap-2 text-[#102a3d]">
              <Send className="size-5 text-[#245b7a]" />
              Revisão e envio definitivo
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 p-6">
            <div className="rounded-3xl border border-[#d9e8ef] bg-[#eef7fa] p-5">
              <p className="font-medium text-[#102a3d]">
                Antes de submeter
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
                Confira a categoria, a ordem dos
                autores, os documentos enviados e as
                informações éticas. Após o envio
                definitivo, o trabalho não poderá ser
                alterado, exceto quando a Comissão
                Científica solicitar correções.
              </p>
            </div>

            <form
              action={submitSubmission}
              className="space-y-5"
            >
              <input
                type="hidden"
                name="submissionId"
                value={submission.id}
              />

              <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-[#d9e8ef] bg-white p-5 transition-colors hover:bg-[#f7fbfd]">
                <input
                  type="checkbox"
                  name="acceptedOriginalityTerms"
                  className="mt-1 size-4 shrink-0 accent-[#245b7a]"
                  required
                />

                <span className="text-sm leading-6 text-[#4a6678]">
                  Declaro que o trabalho submetido é
                  inédito e que não foi previamente
                  publicado, integral ou parcialmente,
                  em periódicos científicos, anais de
                  eventos, congressos, simpósios,
                  jornadas ou quaisquer outras formas
                  de divulgação científica, estando
                  ciente de que o descumprimento desta
                  exigência implicará a
                  desclassificação do trabalho e seu
                  não encaminhamento para avaliação
                  pela Comissão Científica.
                </span>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-[#5f7d90]">
                  O protocolo será gerado
                  automaticamente após o envio.
                </p>

                <Button
                  type="submit"
                  size="lg"
                  className="bg-[#245b7a] hover:bg-[#173f59]"
                >
                  <Send />
                  Submeter trabalho definitivamente
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!canEdit && submission.protocol && (
        <Card className="overflow-hidden rounded-[2rem] border-[#d9e8ef] bg-white shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#102a3d]">
                Trabalho submetido
              </p>

              <p className="mt-1 text-sm text-[#5f7d90]">
                Protocolo: {submission.protocol}
              </p>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1 text-sm font-medium ${getStatusClass(
                displayedStatus
              )}`}
            >
              {formatStatus(displayedStatus)}
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type HeroInfoProps = {
  label: string;
  value: number | string;
};

function HeroInfo({
  label,
  value,
}: HeroInfoProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-sm text-white/65">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

type InfoBoxProps = {
  title: string;
  description: string;
};

function InfoBox({
  title,
  description,
}: InfoBoxProps) {
  return (
    <div className="rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
      <p className="font-medium text-[#102a3d]">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
        {description}
      </p>
    </div>
  );
}

type FileStatusProps = {
  title: string;
  filename?: string;
  size: string | null;
  version: number | null;
  isSent: boolean;
  missingText: string;
};

function FileStatus({
  title,
  filename,
  size,
  version,
  isSent,
  missingText,
}: FileStatusProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="break-all font-medium text-[#102a3d]">
          {title}
        </p>

        {filename && (
          <p className="mt-1 break-all text-sm text-[#5f7d90]">
            {filename}
          </p>
        )}

        {isSent ? (
          <p className="mt-1 text-xs text-[#5f7d90]">
            {size}
            {" · "}
            Versão {version}
          </p>
        ) : (
          <p className="mt-1 text-sm text-red-700">
            {missingText}
          </p>
        )}
      </div>

      <span
        className={
          isSent
            ? "w-fit rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-800"
            : "w-fit rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
        }
      >
        {isSent ? "Enviado" : "Pendente"}
      </span>
    </div>
  );
}

type UploadFormWrapperProps = {
  children: React.ReactNode;
};

function UploadFormWrapper({
  children,
}: UploadFormWrapperProps) {
  return (
    <div className="mt-5 rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5">
      {children}
    </div>
  );
}