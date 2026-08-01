"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  ArrowRight,
  FileCheck2,
  Loader2,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import { createSubmission } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_TOTAL_AUTHORS = 2;
const MAX_TOTAL_AUTHORS = 7;

type Category = {
  id: string;
  name: string;
  description: string | null;
};

type SubmissionInitialFormProps = {
  categories: Category[];
};

export function SubmissionInitialForm({
  categories,
}: SubmissionInitialFormProps) {
  const [categoryId, setCategoryId] =
    useState("");

  const [ethicsAnswer, setEthicsAnswer] =
    useState("");

  const [totalAuthors, setTotalAuthors] =
    useState("2");

  const [
    acceptedGeneralTerms,
    setAcceptedGeneralTerms,
  ] = useState(false);

  const [
    acceptedEthicsTerms,
    setAcceptedEthicsTerms,
  ] = useState(false);

  const selectedCategory = categories.find(
    (category) => category.id === categoryId
  );

  const isCaseReport =
    selectedCategory?.name
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes("relato de caso") ?? false;

  const effectiveEthicsAnswer = isCaseReport
    ? "yes"
    : ethicsAnswer;

  const totalAuthorsNumber =
    Number(totalAuthors) || 2;

  const coauthorCount =
    Math.max(totalAuthorsNumber - 2, 0);

  const canSubmit =
    categories.length > 0 &&
    Boolean(categoryId) &&
    Boolean(effectiveEthicsAnswer) &&
    acceptedGeneralTerms &&
    acceptedEthicsTerms;

  return (
    <form
      action={createSubmission}
      className="space-y-8"
    >
      <input
        type="hidden"
        name="forcedRequiresEthicsApproval"
        value={isCaseReport ? "yes" : ""}
      />
      <section className="space-y-5">
        <SectionHeader
          icon={<FileCheck2 className="size-5" />}
          title="Identificação do trabalho"
          description="Informe os dados iniciais para criar o rascunho da submissão."
        />

        <div className="space-y-2">
          <Label
            htmlFor="title"
            className="text-[#102a3d]"
          >
            Título do trabalho
          </Label>

          <Input
            id="title"
            name="title"
            placeholder="Digite o título completo do trabalho"
            maxLength={300}
            className="h-11 border-[#d9e8ef] bg-white focus-visible:ring-[#245b7a]/20"
            required
          />

          <p className="text-xs text-[#5f7d90]">
            Máximo de 300 caracteres.
          </p>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="categoryId"
            className="text-[#102a3d]"
          >
            Categoria
          </Label>

          <select
            id="categoryId"
            name="categoryId"
            value={categoryId}
            onChange={(event) => {
              const nextCategoryId = event.target.value;
              const nextCategory = categories.find(
                (category) => category.id === nextCategoryId
              );

              const nextIsCaseReport =
                nextCategory?.name
                  ?.toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .includes("relato de caso") ?? false;

              setCategoryId(nextCategoryId);

              if (nextIsCaseReport) {
                setEthicsAnswer("yes");
              }
            }}
            className="flex h-11 w-full rounded-md border border-[#d9e8ef] bg-white px-3 py-2 text-sm text-[#102a3d] outline-none transition focus:border-[#245b7a] focus:ring-4 focus:ring-[#245b7a]/10"
            required
          >
            <option value="" disabled>
              Selecione uma categoria
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>

          {selectedCategory?.description && (
            <p className="rounded-2xl border border-[#d9e8ef] bg-[#eef7fa] p-4 text-sm leading-6 text-[#5f7d90]">
              {selectedCategory.description}
            </p>
          )}
        </div>
      </section>

      <SectionDivider />

      <section className="space-y-5">
        <SectionHeader
          icon={<FileCheck2 className="size-5" />}
          title="Aspectos éticos"
          description="Informe se o estudo necessita de aprovação pelo Comitê de Ética em Pesquisa."
        />

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-[#102a3d]">
            Este trabalho necessita de aprovação do Comitê de Ética em Pesquisa
            (CEP)?
          </legend>

          <OptionBox
            name="requiresEthicsApproval"
            value="yes"
            checked={effectiveEthicsAnswer=== "yes"}
            onChange={(value) => setEthicsAnswer(value)}
            title="Sim, necessita de aprovação do CEP"
            description="Será obrigatório anexar o parecer consubstanciado de aprovação."
          />

          <OptionBox
            name="requiresEthicsApproval"
            value="no"
            checked={effectiveEthicsAnswer === "no"}
            onChange={(value) => {
              if (isCaseReport) {
                return;
              }

              setEthicsAnswer(value);
            }}
            disabled={isCaseReport}
            title="Não necessita de aprovação do CEP"
            description="Declaro que, conforme a natureza do estudo e as disposições do edital, a apreciação pelo CEP não é aplicável."
          />
        </fieldset>

        {isCaseReport && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Para trabalhos da categoria <strong>Relato de caso</strong>, o parecer
            consubstanciado de aprovação do CEP é obrigatório.
          </div>
        )}

        {effectiveEthicsAnswer === "yes" && (
          <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Documento obrigatório
                </p>

                <p className="mt-1 leading-6 text-amber-800">
                  Anexe exclusivamente o parecer consubstanciado de aprovação
                  emitido pelo Comitê de Ética em Pesquisa. O CAAE isoladamente
                  não será aceito.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="ethicsApprovalFile"
                className="text-amber-950"
              >
                Parecer consubstanciado do CEP
              </Label>

              <Input
                id="ethicsApprovalFile"
                name="ethicsApprovalFile"
                type="file"
                accept=".pdf,application/pdf"
                className="border-amber-200 bg-white"
                required={effectiveEthicsAnswer === "yes"}
              />

              <p className="text-xs text-amber-800">
                Formato PDF, com no máximo 5 MB.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-800">
              <Upload className="size-4" />
              O arquivo será armazenado de forma privada e vinculado ao
              rascunho.
            </div>
          </div>
        )}
      </section>

      <SectionDivider />

      <section className="space-y-5">
        <SectionHeader
          icon={<Users className="size-5" />}
          title="Composição da autoria"
          description="O autor responsável será preenchido automaticamente com os dados da sua conta."
        />

        <div className="space-y-2">
          <Label
            htmlFor="totalAuthors"
            className="text-[#102a3d]"
          >
            Quantidade total de autores
          </Label>

          <select
            id="totalAuthors"
            name="totalAuthors"
            value={totalAuthors}
            onChange={(event) =>
              setTotalAuthors(event.target.value)
            }
            className="flex h-11 w-full rounded-md border border-[#d9e8ef] bg-white px-3 py-2 text-sm text-[#102a3d] outline-none transition focus:border-[#245b7a] focus:ring-4 focus:ring-[#245b7a]/10"
            required
          >
            {Array.from(
              {
                length:
                  MAX_TOTAL_AUTHORS - MIN_TOTAL_AUTHORS + 1,
              },
              (_, index) => index + MIN_TOTAL_AUTHORS
            ).map((amount) => (
              <option
                key={amount}
                value={amount}
              >
                {amount} autores
              </option>
            ))}
          </select>
          <p className="text-xs leading-5 text-[#5f7d90]">
            O trabalho pode possuir no máximo 7 autores no total,
            incluindo o autor responsável e o orientador.
          </p>
        </div>

        <div className="rounded-3xl border border-[#d9e8ef] bg-[#eef7fa] p-5">
          <p className="font-semibold text-[#102a3d]">
            Organização prevista
          </p>

          <div className="mt-4 grid gap-3 text-sm text-[#5f7d90] sm:grid-cols-3">
            <AuthorPreview
              title="1º autor"
              description="Autor responsável"
            />

            <AuthorPreview
              title={`${coauthorCount}`}
              description={
                coauthorCount === 1
                  ? "Coautor intermediário"
                  : "Coautores intermediários"
              }
            />

            <AuthorPreview
              title={`${totalAuthorsNumber}º autor`}
              description="Orientador"
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-[#5f7d90]">
            O último autor será obrigatoriamente o orientador e deverá anexar
            uma declaração em PDF.
          </p>
        </div>
      </section>

      <SectionDivider />

      <section className="space-y-5">
        <SectionHeader
          icon={<ShieldCheck className="size-5" />}
          title="Declarações obrigatórias"
          description="Leia atentamente e marque as duas declarações para continuar."
        />

        <TermsBox
          name="acceptedGeneralTerms"
          checked={acceptedGeneralTerms}
          onChange={setAcceptedGeneralTerms}
        >
          Declaro estar ciente e de acordo com todas as disposições previstas
          neste edital, assumindo inteira responsabilidade pelo cumprimento das
          normas estabelecidas e pela autenticidade das informações prestadas.
        </TermsBox>

        <TermsBox
          name="acceptedEthicsTerms"
          checked={acceptedEthicsTerms}
          onChange={setAcceptedEthicsTerms}
        >
          Declaro estar ciente e de acordo com as disposições deste edital
          referentes aos aspectos éticos da pesquisa, comprometendo-me a
          apresentar parecer consubstanciado de aprovação emitido pelo Comitê
          de Ética em Pesquisa (CEP), quando aplicável, reconhecendo que a
          apresentação apenas do Certificado de Apresentação para Apreciação
          Ética (CAAE) não atende às exigências deste edital, sob pena de
          desclassificação do trabalho e não encaminhamento para avaliação pela
          Comissão Científica.
        </TermsBox>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-[#d9e8ef] pt-6 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          asChild
          className="border-[#b9d4df] text-[#245b7a] hover:bg-[#eef7fa]"
        >
          <Link href="/aluno/trabalhos">
            Cancelar
          </Link>
        </Button>

        <CreateSubmissionButton canSubmit={canSubmit} />
      </div>
    </form>
  );
}

type SectionHeaderProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function SectionHeader({
  icon,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="flex gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]">
        {icon}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#102a3d]">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-[#5f7d90]">
          {description}
        </p>
      </div>
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t border-[#d9e8ef]" />;
}

type OptionBoxProps = {
  name: string;
  value: string;
  checked: boolean;
  title: string;
  description: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function OptionBox({
  name,
  value,
  checked,
  title,
  description,
  onChange,
  disabled = false,
}: OptionBoxProps) {
  return (
    <label
      className={
        checked
          ? `flex items-start gap-3 rounded-3xl border border-[#245b7a] bg-[#eef7fa] p-5 transition duration-300 ${
              disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer"
            }`
          : `flex items-start gap-3 rounded-3xl border border-[#d9e8ef] bg-white p-5 transition duration-300 hover:border-[#b9d4df] hover:bg-[#f7fbfd] ${
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`
      }
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        className="mt-1 size-4 accent-[#245b7a] disabled:cursor-not-allowed"
        required
      />

      <span>
        <span className="block font-semibold text-[#102a3d]">
          {title}
        </span>

        <span className="mt-1 block text-sm leading-6 text-[#5f7d90]">
          {description}
        </span>
      </span>
    </label>
  );
}

type AuthorPreviewProps = {
  title: string;
  description: string;
};

function AuthorPreview({
  title,
  description,
}: AuthorPreviewProps) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <span className="block font-semibold text-[#102a3d]">
        {title}
      </span>

      <span className="mt-1 block text-sm leading-5 text-[#5f7d90]">
        {description}
      </span>
    </div>
  );
}

type TermsBoxProps = {
  name: string;
  checked: boolean;
  children: React.ReactNode;
  onChange: (checked: boolean) => void;
};

function TermsBox({
  name,
  checked,
  children,
  onChange,
}: TermsBoxProps) {
  return (
    <label
      className={
        checked
          ? "flex cursor-pointer items-start gap-3 rounded-3xl border border-[#245b7a] bg-[#eef7fa] p-5 transition duration-300"
          : "flex cursor-pointer items-start gap-3 rounded-3xl border border-[#d9e8ef] bg-white p-5 transition duration-300 hover:border-[#b9d4df] hover:bg-[#f7fbfd]"
      }
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 size-4 shrink-0 accent-[#245b7a]"
        required
      />

      <span className="text-sm leading-6 text-[#4a6678]">
        {children}
      </span>
    </label>
  );
}

function CreateSubmissionButton({
  canSubmit,
}: {
  canSubmit: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={!canSubmit || pending}
      className="bg-[#245b7a] hover:bg-[#173f59] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Criando rascunho...
        </>
      ) : (
        <>
          Criar rascunho e continuar
          <ArrowRight />
        </>
      )}
    </Button>
  );
}
