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

type EventData =
  | {
      submission_starts_at: string | null;
      submission_ends_at: string | null;
    }
  | {
      submission_starts_at: string | null;
      submission_ends_at: string | null;
    }[]
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
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(new Date(date));
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
      title: "Período de submissões não localizado",
      description:
        "Não foi possível verificar o prazo de reenvio da correção.",
    };
  }

  const now = new Date();

  if (
    event.submission_starts_at &&
    now < new Date(event.submission_starts_at)
  ) {
    return {
      isOpen: false,
      title:
        "O período de submissões ainda não iniciou",
      description: `O reenvio de correções estará disponível a partir de ${formatOptionalDate(
        event.submission_starts_at
      )}.`,
    };
  }

  if (
    event.submission_ends_at &&
    now > new Date(event.submission_ends_at)
  ) {
    return {
      isOpen: false,
      title:
        "O período de submissões foi encerrado",
      description: `O prazo para reenviar correções encerrou em ${formatOptionalDate(
        event.submission_ends_at
      )}.`,
    };
  }

  return {
    isOpen: true,
    title: "Reenvio de correção disponível",
    description: event.submission_ends_at
      ? `Você pode reenviar o trabalho corrigido até ${formatOptionalDate(
          event.submission_ends_at
        )}.`
      : "Você pode reenviar o trabalho corrigido enquanto o período de submissões estiver aberto.",
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
        submission_ends_at
      )
    `)
    .eq("id", submissionId)
    .eq("owner_user_id", profile.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao carregar orientação de correção:",
      error
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

  if (
    submission.status ===
    "resubmitted"
  ) {
    return (
      <Card className="border-blue-600/30 bg-blue-600/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5" />
            Trabalho corrigido reenviado
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            As correções foram reenviadas e o
            trabalho está aguardando uma nova
            conferência documental pela Comissão
            Científica.
          </p>

          {submission.protocol && (
            <p className="mt-3 text-sm font-medium">
              Protocolo:{" "}
              {submission.protocol}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (
    submission.status !==
    "correction_requested"
  ) {
    return null;
  }

  return (
    <Card className="border-amber-600/40 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-5" />
          Correções solicitadas
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-lg border border-amber-600/30 bg-background p-4">
          <p className="font-medium">
            Orientações da Comissão Científica
          </p>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
            {submission.document_review_notes ||
              "A Comissão solicitou alterações neste trabalho. Revise os autores e os documentos enviados."}
          </p>

          {submission.document_reviewed_at && (
            <p className="mt-4 text-xs text-muted-foreground">
              Solicitação registrada em{" "}
              {formatDate(
                submission.document_reviewed_at
              )}
            </p>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <p className="font-medium">
            Como realizar a correção
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Altere os autores ou substitua os
            documentos necessários nos formulários
            desta página. Depois de conferir todas
            as informações, confirme o reenvio no
            final da página.
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
    <Card className="border-amber-600/40 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="size-5" />
          Confirmação de correção
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div
          className={
            correctionPeriod.isOpen
              ? "rounded-lg border border-green-600/30 bg-green-600/5 p-4"
              : "rounded-lg border border-destructive/30 bg-destructive/10 p-4"
          }
        >
          <p className="flex items-center gap-2 font-medium">
            {correctionPeriod.isOpen ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Lock className="size-4" />
            )}

            {correctionPeriod.title}
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {correctionPeriod.description}
          </p>
        </div>

        {correctionPeriod.isOpen ? (
          <form
            action={
              resubmitCorrectedSubmission
            }
            className="space-y-5"
          >
            <input
              type="hidden"
              name="submissionId"
              value={submission.id}
            />

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-4">
              <input
                type="checkbox"
                name="confirmResubmission"
                className="mt-1 size-4 shrink-0"
                required
              />

              <span className="text-sm leading-6">
                Confirmo que revisei as orientações
                da Comissão Científica e realizei as
                correções necessárias no trabalho.
              </span>
            </label>

            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Após o reenvio, o trabalho voltará para nova conferência documental.
              </p>

              <Button
                type="submit"
                size="lg"
              >
                <RotateCcw />
                Reenviar trabalho corrigido
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            O botão de reenvio foi bloqueado porque
            o prazo de submissões não está aberto.
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
