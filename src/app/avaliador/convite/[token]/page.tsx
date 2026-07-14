import Link from "next/link";
import {
  ClipboardCheck,
  Lock,
  Mail,
  UserRound,
} from "lucide-react";
import { acceptEvaluatorInvitation } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";

type AvaliadorConvitePageProps = {
  params: Promise<{
    token: string;
  }>;

  searchParams: Promise<{
    erro?: string;
  }>;
};

type Invitation = {
  id: string;
  professor_name: string;
  email: string;
  status: string;
  expires_at: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function AvaliadorConvitePage({
  params,
  searchParams,
}: AvaliadorConvitePageProps) {
  const { token } = await params;
  const messages = await searchParams;

  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_evaluator_invitation_by_token", {
      invitation_token: token,
    })
    .maybeSingle();

  const invitation = data as Invitation | null;

  const isAvailable =
    !!invitation &&
    invitation.status === "pending" &&
    new Date(invitation.expires_at) >= new Date();

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ClipboardCheck className="size-7" />
          </div>

          <CardTitle className="text-2xl">
            Cadastro de avaliador
          </CardTitle>

          <CardDescription>
            Jornada Acadêmica de Medicina — Comissão Científica
          </CardDescription>
        </CardHeader>

        <CardContent>
          {messages.erro && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {messages.erro}
            </div>
          )}

          {error || !invitation ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">
                Convite não encontrado
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Verifique se o link foi copiado corretamente ou solicite um novo convite à organização.
              </p>

              <Button
                className="mt-6"
                variant="outline"
                asChild
              >
                <Link href="/login">
                  Voltar ao login
                </Link>
              </Button>
            </div>
          ) : !isAvailable ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">
                Convite indisponível
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Este convite já foi utilizado, cancelado ou expirou em{" "}
                {formatDate(invitation.expires_at)}.
              </p>

              <Button
                className="mt-6"
                variant="outline"
                asChild
              >
                <Link href="/login">
                  Voltar ao login
                </Link>
              </Button>
            </div>
          ) : (
            <form
              action={acceptEvaluatorInvitation}
              className="space-y-5"
            >
              <input
                type="hidden"
                name="token"
                value={token}
              />

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Convite para:
                </p>

                <p className="mt-1 font-medium">
                  {invitation.professor_name}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {invitation.email}
                </p>

                <p className="mt-3 text-xs text-muted-foreground">
                  Expira em {formatDate(invitation.expires_at)}
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="fullName"
                  className="text-sm font-medium"
                >
                  Nome completo
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={invitation.professor_name}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium"
                >
                  E-mail
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={invitation.email}
                    className="pl-9"
                    required
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Use o mesmo e-mail que recebeu o convite.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium"
                  >
                    Senha
                  </label>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="password"
                      name="password"
                      type="password"
                      className="pl-9"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="passwordConfirmation"
                    className="text-sm font-medium"
                  >
                    Confirmar senha
                  </label>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="passwordConfirmation"
                      name="passwordConfirmation"
                      type="password"
                      className="pl-9"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
              >
                Criar conta de avaliador
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}