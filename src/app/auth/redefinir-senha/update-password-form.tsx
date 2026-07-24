"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingSession, setIsPreparingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const supabase = useMemo(() => {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    return createBrowserClient(
      supabaseUrl,
      supabaseKey
    );
  }, []);

  useEffect(() => {
    async function prepareRecoverySession() {
      setErrorMessage("");

      if (!supabase) {
        setIsPreparingSession(false);
        setHasRecoverySession(false);
        setErrorMessage(
          "As variáveis públicas do Supabase não foram configuradas. Confira o arquivo .env.local e reinicie o servidor."
        );
        return;
      }

      const currentUrl = new URL(window.location.href);
      const tokenHash = currentUrl.searchParams.get("token_hash");
      const type = currentUrl.searchParams.get("type");

      const hashParams = new URLSearchParams(
        window.location.hash.replace("#", "")
      );

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (tokenHash && type === "recovery") {
        const { error: verifyError } =
          await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

        if (verifyError) {
          console.error("Erro ao validar token de recuperação:", {
            message: verifyError.message,
            status: verifyError.status,
            name: verifyError.name,
          });

          setIsPreparingSession(false);
          setHasRecoverySession(false);
          setErrorMessage(
            "Link de recuperação inválido ou expirado. Solicite um novo link de recuperação de senha."
          );
          return;
        }

        window.history.replaceState(
          {},
          document.title,
          "/auth/redefinir-senha"
        );
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

        if (sessionError) {
          console.error("Erro ao criar sessão de recuperação:", {
            message: sessionError.message,
            status: sessionError.status,
            name: sessionError.name,
          });

          setIsPreparingSession(false);
          setHasRecoverySession(false);
          setErrorMessage(
            "Não foi possível validar a sessão de recuperação. Solicite um novo link e tente novamente."
          );
          return;
        }

        window.history.replaceState(
          {},
          document.title,
          "/auth/redefinir-senha"
        );
      }

      const { data, error } =
        await supabase.auth.getSession();

      setIsPreparingSession(false);

      if (error) {
        console.error("Erro ao verificar sessão de recuperação:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });

        setHasRecoverySession(false);
        setErrorMessage(
          "Não foi possível validar a sessão de recuperação. Solicite um novo link e tente novamente."
        );
        return;
      }

      if (!data.session) {
        setHasRecoverySession(false);
        setErrorMessage(
          "Link de recuperação inválido ou expirado. Solicite um novo link de recuperação de senha."
        );
        return;
      }

      setHasRecoverySession(true);
    }

    prepareRecoverySession();
  }, [supabase]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!supabase) {
      setErrorMessage(
        "As variáveis públicas do Supabase não foram configuradas. Confira o arquivo .env.local e reinicie o servidor."
      );
      return;
    }

    if (!hasRecoverySession) {
      setErrorMessage(
        "A sessão de recuperação não está ativa. Solicite um novo link de recuperação de senha."
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "A senha deve possuir pelo menos 6 caracteres."
      );
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage(
        "As senhas informadas não são iguais."
      );
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Erro ao redefinir senha:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });

      setErrorMessage(
        "Não foi possível redefinir a senha. Solicite um novo link de recuperação e tente novamente."
      );
      return;
    }

    await supabase.auth.signOut();

    setPassword("");
    setPasswordConfirmation("");
    setSuccessMessage(
      "Senha redefinida com sucesso. Você já pode acessar a plataforma."
    );
  }

  if (isPreparingSession) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#07162a]/60 p-4 text-sm text-[#b9d4df]">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin text-[#6fb6cf]" />

          <p>
            Validando link de recuperação...
          </p>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-green-300/30 bg-green-500/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-200" />

            <p className="text-sm leading-6 text-green-100">
              {successMessage}
            </p>
          </div>
        </div>

        <Button
          asChild
          className="h-12 w-full rounded-xl bg-[#6fb6cf] text-base font-bold text-[#07162a] shadow-lg shadow-[#6fb6cf]/20 hover:bg-[#8cc9dc]"
        >
          <Link href="/login">
            Ir para o login
          </Link>
        </Button>
      </div>
    );
  }

  if (!hasRecoverySession) {
    return (
      <div className="space-y-5">
        {errorMessage && (
          <div className="rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
            {errorMessage}
          </div>
        )}

        <Button
          asChild
          className="h-12 w-full rounded-xl bg-[#6fb6cf] text-base font-bold text-[#07162a] shadow-lg shadow-[#6fb6cf]/20 hover:bg-[#8cc9dc]"
        >
          <Link href="/auth/esqueci-senha">
            <RefreshCw className="size-4" />
            Solicitar novo link
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {errorMessage && (
        <div className="rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
          {errorMessage}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-bold uppercase tracking-[0.16em] text-[#8fb7cc]"
        >
          Nova senha
        </label>

        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6fb6cf]" />

          <Input
            id="password"
            type="password"
            placeholder="Mínimo de 6 caracteres"
            className="h-12 border-white/10 bg-[#07162a]/80 pl-10 text-base text-white placeholder:text-[#8fb7cc]/70 focus-visible:ring-[#6fb6cf]/30"
            minLength={6}
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="passwordConfirmation"
          className="text-sm font-bold uppercase tracking-[0.16em] text-[#8fb7cc]"
        >
          Confirmar nova senha
        </label>

        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6fb6cf]" />

          <Input
            id="passwordConfirmation"
            type="password"
            placeholder="Repita a nova senha"
            className="h-12 border-white/10 bg-[#07162a]/80 pl-10 text-base text-white placeholder:text-[#8fb7cc]/70 focus-visible:ring-[#6fb6cf]/30"
            minLength={6}
            value={passwordConfirmation}
            onChange={(event) =>
              setPasswordConfirmation(event.target.value)
            }
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-xl bg-[#6fb6cf] text-base font-bold text-[#07162a] shadow-lg shadow-[#6fb6cf]/20 hover:bg-[#8cc9dc]"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Redefinindo...
          </>
        ) : (
          "Redefinir senha"
        )}
      </Button>
    </form>
  );
}