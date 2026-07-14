import { Loader2, Stethoscope } from "lucide-react";

export default function AvaliadorLoading() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#102a3d] p-8 text-white shadow-sm lg:p-10">
        <div className="absolute right-[-120px] top-[-120px] size-80 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] size-96 rounded-full bg-[#245b7a]/60 blur-3xl" />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
            <Stethoscope className="size-4" />
            Área do avaliador
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Carregando avaliações
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-white/75">
            Aguarde enquanto buscamos seus trabalhos atribuídos.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </section>

      <section className="rounded-[2rem] border border-[#d9e8ef] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-[#245b7a]">
          <Loader2 className="size-5 animate-spin" />

          <p className="font-medium">
            Carregando área do avaliador...
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-[#d9e8ef]" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#d9e8ef]" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#d9e8ef]" />
        </div>
      </section>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-3xl border border-[#d9e8ef] bg-white p-6 shadow-sm">
      <div className="h-10 w-10 animate-pulse rounded-2xl bg-[#eef7fa]" />
      <div className="mt-5 h-4 w-24 animate-pulse rounded-full bg-[#d9e8ef]" />
      <div className="mt-3 h-7 w-16 animate-pulse rounded-full bg-[#d9e8ef]" />
    </div>
  );
}