import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  RotateCcw,
} from "lucide-react";
import {
  resubmitCorrectedSubmission,
} from "./correction-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type CorrectionPanelProps = {
  submissionId: string;
};

type SingleEventData = {
  submission_starts_at: string | null;
  submission_ends_at: string | null;
  correction_ends_at: string | null;
};

type EventData =
  | SingleEventData
  | SingleEventData[]
  | null;

type CorrectionSubmission = {
  id: string;
  status: string;
  protocol: string | null;
  document_review_notes: string | null;
  document_reviewed_at: string | null;
  events: EventData;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

function formatOptionalDate(date: string | null) {
  if (!date) {
    return "Não informado";
  }

  return formatDate(date);
}

function getEvent(eventValue: EventData) {
  if (Array.isArray(eventValue)) {
    return eventValue[0] ?? null;
  }

  return eventValue;
}

function getCorrectionPeriodStatus(eventValue: EventData) {
  const event = getEvent(eventValue);

  if (!event) {
    return {
      isOpen: false,
      title: "Prazo de correção não localizado",
      description:
        "Não foi possível verificar o prazo de reenvio da correção.",
    };
  }

  const now = new Date();

  if (event.submission_starts_at) {
    const submissionStartDate = new Date(
      event.submission_starts_at
    );

    if (
      !Number.isNaN(submissionStartDate.getTime()) &&
      now < submissionStartDate
    ) {
      return {
        isOpen: false,
        title: "O período de submissões ainda não iniciou",
        description: `O reenvio de correções estará disponível a partir de ${formatOptionalDate(
          event.submission_starts_at
        )}.`,
      };
    }
  }

  const correctionDeadlineValue =
    event.correction_ends_at ??
    event.submission_ends_at;

  if (!correctionDeadlineValue) {
    return {
      isOpen: false,
      title: "Prazo de correção não configurado",
      description:
        "O prazo para reenvio de correções documentais ainda não foi configurado.",
    };
  }

  const correctionDeadline = new Date(
    correctionDeadlineValue
  );

  if (Number.isNaN(correctionDeadline.getTime())) {
    return {
      isOpen: false,
      title: "Prazo de correção inválido",
      description:
        "O prazo para reenvio de correções documentais está inválido.",
    };
  }

  if (now > correctionDeadline) {
    return {
      isOpen: false,
      title: "O prazo de correções documentais foi encerrado",
      description: `O prazo para reenviar correções encerrou em ${formatOptionalDate(
        correctionDeadlineValue
      )}.`,
    };
  }

  return {
    isOpen: true,
    title: "Reenvio de correção disponível",
    description: `Você pode reenviar o trabalho corrigido até ${formatOptionalDate(
      correctionDeadlineValue
    )}.`,
  };
}

async function getCorrectionSubmission(
  submissionId: string
): Promise<CorrectionSubmission | null> {
  const { profile, supabase } =
    await getCurrentUser();

  const {
    data: submission,
    error,
  } = await supabase
    .from("submissions")
    .select(`
      id,
      status,
      protocol,
      document_review_notes,
      document_reviewed_at,

      events (
        submission_starts_at,
        submission_ends_at,
        correction_ends_at
      )
    `)
    .eq("id", submissionId)
    .eq("owner_user_id", profile.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao carregar orientação de correção:",
      {
        submissionId,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    return null;
  }

  return submission as CorrectionSubmission | null;
}

export async function CorrectionNoticePanel({
  submissionId,
}: CorrectionPanelProps) {
  const submission =
    await getCorrectionSubmission(submissionId);

  if (!submission) {
    return null;
  }

  if (submission.status === "resubmitted") {
    return (
      <Card className="overflow-hidden rounded-[2rem] border-blue-200 bg-blue-50 shadow-sm">
        <CardHeader className="border-b border-blue-100 bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-950">
            <CheckCircle2 className="size-5 text-blue-700" />
            Trabalho corrigido reenviado
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <p className="text-sm leading-6 text-blue-900">
            As correções foram reenviadas e o trabalho está aguardando uma nova
            conferência documental pela Comissão Científica.
          </p>

          {submission.protocol && (
            <p className="mt-3 text-sm font-medium text-blue-950">
              Protocolo: {submission.protocol}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (submission.status !== "correction_requested") {
    return null;
  }

  return (
    <Card
      id="correcao-section"
      className="scroll-mt-28 overflow-hidden rounded-[2rem] border-amber-200 bg-amber-50 shadow-sm"
    >
      <CardHeader className="border-b border-amber-100 bg-amber-50">
        <CardTitle className="flex items-center gap-2 text-amber-950">
          <AlertTriangle className="size-5 text-amber-700" />
          Correções solicitadas
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <div className="rounded-3xl border border-amber-200 bg-white p-5">
          <p className="font-medium text-[#102a3d]">
            Orientações da Comissão Científica
          </p>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#4a6678]">
            {submission.document_review_notes ||
              "A Comissão solicitou alterações neste trabalho. Revise os autores e os documentos enviados."}
          </p>

          {submission.document_reviewed_at && (
            <p className="mt-4 text-xs text-[#5f7d90]">
              Solicitação registrada em{" "}
              {formatDate(
                submission.document_reviewed_at
              )}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-[#d9e8ef] bg-white p-5">
          <p className="font-medium text-[#102a3d]">
            Como realizar a correção
          </p>

          <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
            Altere os autores ou substitua os documentos necessários nos
            formulários desta página. Depois de conferir todas as informações,
            confirme o reenvio no final da página.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export async function CorrectionConfirmationPanel({
  submissionId,
}: CorrectionPanelProps) {
  const submission =
    await getCorrectionSubmission(submissionId);

  if (
    !submission ||
    submission.status !== "correction_requested"
  ) {
    return null;
  }

  const correctionPeriod =
    getCorrectionPeriodStatus(
      submission.events
    );

  return (
    <Card
      id="confirmacao-correcao-section"
      className="scroll-mt-28 overflow-hidden rounded-[2rem] border-amber-200 bg-white shadow-sm"
    >
      <CardHeader className="border-b border-[#d9e8ef] bg-[#f7fbfd]">
        <CardTitle className="flex items-center gap-2 text-[#102a3d]">
          <RotateCcw className="size-5 text-[#245b7a]" />
          Confirmação de correção
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div
          className={
            correctionPeriod.isOpen
              ? "rounded-3xl border border-green-200 bg-green-50 p-5"
              : "rounded-3xl border border-red-200 bg-red-50 p-5"
          }
        >
          <p
            className={
              correctionPeriod.isOpen
                ? "flex items-center gap-2 font-medium text-green-900"
                : "flex items-center gap-2 font-medium text-red-900"
            }
          >
            {correctionPeriod.isOpen ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Lock className="size-4" />
            )}

            {correctionPeriod.title}
          </p>

          <p
            className={
              correctionPeriod.isOpen
                ? "mt-2 text-sm leading-6 text-green-800"
                : "mt-2 text-sm leading-6 text-red-800"
            }
          >
            {correctionPeriod.description}
          </p>
        </div>

        {correctionPeriod.isOpen ? (
          <form
            action={resubmitCorrectedSubmission}
            className="space-y-5"
          >
            <input
              type="hidden"
              name="submissionId"
              value={submission.id}
            />

            <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-5 transition-colors hover:bg-[#eef7fa]">
              <input
                type="checkbox"
                name="confirmResubmission"
                className="mt-1 size-4 shrink-0 accent-[#245b7a]"
                required
              />

              <span className="text-sm leading-6 text-[#4a6678]">
                Confirmo que revisei as orientações da Comissão Científica e
                realizei as correções necessárias no trabalho.
              </span>
            </label>

            <div className="flex flex-col gap-3 border-t border-[#d9e8ef] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[#5f7d90]">
                Após o reenvio, o trabalho voltará para nova conferência
                documental.
              </p>

              <Button
                type="submit"
                size="lg"
                className="bg-[#245b7a] hover:bg-[#173f59]"
              >
                <RotateCcw className="size-4" />
                Reenviar trabalho corrigido
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#d9e8ef] bg-[#f7fbfd] p-5 text-sm leading-6 text-[#5f7d90]">
            O botão de reenvio foi bloqueado porque o prazo de correções
            documentais não está aberto.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/*
 * Mantido para compatibilidade caso algum arquivo antigo ainda importe CorrectionPanel.
 */
export async function CorrectionPanel({
  submissionId,
}: CorrectionPanelProps) {
  return (
    <>
      <CorrectionNoticePanel
        submissionId={submissionId}
      />

      <CorrectionConfirmationPanel
        submissionId={submissionId}
      />
    </>
  );
}