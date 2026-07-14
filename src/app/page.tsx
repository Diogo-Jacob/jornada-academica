import Link from "next/link";
import { PublicSiteHeader } from "@/components/public-site-header";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import {
  ArrowRight,
  Download,
  CalendarDays,
  FileText,
  MapPin,
  Presentation,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const editalDisponivel = false;

const editalUrl = "/edital-jornada-academica-medicina.pdf";

const eventLocationName =
  "Universidade da Região de Joinville — UNIVILLE";

const eventAddress =
  "Joinville, Santa Catarina";

const eventMapEmbedUrl = "";

const sponsors = [
  "Patrocinador ouro",
  "Patrocinador prata",
  "Apoiador institucional",
  "Apoiador científico",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7fbfd] text-[#102a3d]">
      <PublicSiteHeader
        editalDisponivel={editalDisponivel}
        editalUrl={editalUrl}
      />

      <RevealOnScroll>
        <section className="relative overflow-hidden bg-[#102a3d] pt-24 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(116,190,210,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(36,91,122,0.8),_transparent_35%)]" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90">
                <Stethoscope className="size-4" />
                Jornada Acadêmica de Medicina
              </div>

              <h1 className="max-w-4xl animate-[fadeUp_0.8s_ease-out] text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Ciência, formação médica e protagonismo acadêmico.
              </h1>

              <p className="mt-6 max-w-3xl animate-[fadeUp_1s_ease-out] text-lg leading-8 text-white/75">
                Um evento dedicado à produção científica, à troca de experiências
                e ao fortalecimento da formação médica, reunindo estudantes,
                orientadores, avaliadores e profissionais da área da saúde.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="rounded-xl bg-white px-6 text-[#102a3d] shadow-sm hover:bg-[#eef7fa]"
                >
                  <Link href="/cadastro">
                    Cadastrar aluno
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-white/30 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/login">
                    Entrar
                  </Link>
                </Button>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                O edital oficial será disponibilizado nesta página assim que a
                organização finalizar as orientações de submissão e avaliação.
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-lg animate-[floatSoft_5s_ease-in-out_infinite] rounded-[2rem] border border-white/15 bg-white/10 p-10 shadow-2xl backdrop-blur">
                <div className="absolute -right-8 -top-8 size-28 rounded-full bg-[#6fb6cf]/40 blur-2xl" />

                <div className="space-y-5">
                  <HeroInfo
                    icon={<CalendarDays className="size-5" />}
                    title="Evento acadêmico"
                    description="Programação científica, integração e vivências voltadas à formação médica."
                  />

                  <HeroInfo
                    icon={<FileText className="size-5" />}
                    title="Trabalhos científicos"
                    description="Submissão online, conferência documental e avaliação padronizada."
                  />

                  <HeroInfo
                    icon={<Users className="size-5" />}
                    title="Comunidade médica"
                    description="Participação de alunos, docentes, orientadores, avaliadores e instituições parceiras."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="evento"
          className="mx-auto max-w-7xl px-6 py-20 lg:px-8"
        >
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#245b7a]">
                O evento
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#102a3d] sm:text-4xl">
                Um espaço para aproximar estudantes da pesquisa, da prática e da
                vida acadêmica.
              </h2>
            </div>

            <div className="space-y-5 text-lg leading-8 text-[#4a6678]">
              <p>
                A Jornada Acadêmica de Medicina foi pensada para estimular a
                participação estudantil na produção científica e promover
                momentos de aprendizado, apresentação de trabalhos e integração
                entre diferentes etapas da formação médica.
              </p>

              <p>
                A plataforma oficial centraliza o cadastro dos participantes, o
                envio dos trabalhos, a conferência documental, a avaliação
                científica e a divulgação dos resultados, contribuindo para um
                processo mais organizado, seguro e transparente.
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="submissoes"
          className="border-y border-[#d9e8ef] bg-white"
        >
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#245b7a]">
                Trabalhos científicos
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#102a3d] sm:text-4xl">
                Submissão online, conferência documental e avaliação científica.
              </h2>

              <p className="mt-5 text-lg leading-8 text-[#4a6678]">
                Os trabalhos submetidos serão analisados conforme as normas do
                edital, passando por conferência documental e avaliação por
                pareceristas, com critérios previamente definidos pela Comissão
                Científica.
              </p>
            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-3">
              <TextBlock
                icon={<FileText className="size-6" />}
                title="Modalidades aceitas"
                description="Serão aceitos trabalhos científicos nas modalidades previstas em edital, incluindo estudos originais, revisões, relatos de caso e relatos de experiência."
              />

              <TextBlock
                icon={<ShieldCheck className="size-6" />}
                title="Aspectos éticos"
                description="Quando aplicável, os autores deverão informar a aprovação ética e anexar os documentos obrigatórios durante o processo de submissão."
              />

              <TextBlock
                icon={<Presentation className="size-6" />}
                title="Apresentação dos trabalhos"
                description="Os trabalhos aprovados poderão ser selecionados para apresentação oral ou apresentação em formato de banner, conforme classificação final."
              />
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="programacao"
          className="mx-auto max-w-7xl px-6 py-20 lg:px-8"
        >
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#245b7a]">
                Programação
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#102a3d] sm:text-4xl">
                Uma programação voltada ao conhecimento, à integração e ao
                protagonismo estudantil.
              </h2>

              <p className="mt-5 text-lg leading-8 text-[#4a6678]">
                A programação completa, com datas, horários, palestras,
                apresentações e demais atividades, será divulgada nos canais
                oficiais da organização.
              </p>
            </div>

            <div className="space-y-6">
              <TimelineItem
                number="01"
                title="Cadastro e submissão"
                description="O aluno realiza o cadastro na plataforma, informa os autores, preenche os dados do trabalho e envia os documentos necessários."
              />

              <TimelineItem
                number="02"
                title="Conferência documental"
                description="A Comissão Científica verifica se os arquivos, declarações e documentos éticos atendem às exigências do edital."
              />

              <TimelineItem
                number="03"
                title="Avaliação científica"
                description="Os trabalhos aprovados na etapa documental são encaminhados aos avaliadores, que utilizam critérios padronizados de análise."
              />

              <TimelineItem
                number="04"
                title="Resultados e apresentações"
                description="Após a finalização das avaliações, os resultados são disponibilizados na plataforma, com a classificação para apresentação oral ou banner."
              />
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="edital"
          className="scroll-mt-28 bg-[#f7fbfd] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden rounded-[2rem] border border-[#d9e8ef] bg-white shadow-sm">
              <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="relative overflow-hidden bg-[#102a3d] p-8 text-white lg:p-10">
                  <div className="absolute right-[-120px] top-[-120px] size-80 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
                  <div className="absolute bottom-[-160px] left-[-120px] size-96 rounded-full bg-[#245b7a]/60 blur-3xl" />

                  <div className="relative">
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/70">
                      Edital
                    </p>

                    <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                      Edital de submissão dos trabalhos científicos
                    </h2>

                    <p className="mt-4 leading-7 text-white/75">
                      O edital reunirá as regras de participação, prazos,
                      modalidades aceitas, critérios de avaliação, orientações de
                      submissão e informações sobre a apresentação dos trabalhos.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-center p-8 lg:p-10">
                  {editalDisponivel ? (
                    <>
                      <div className="mb-5 w-fit rounded-full border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-800">
                        Edital disponível
                      </div>

                      <h3 className="text-2xl font-bold text-[#102a3d]">
                        Consulte o edital oficial
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-[#5f7d90]">
                        Antes de realizar a submissão, leia atentamente o edital
                        para conferir as regras, documentos obrigatórios e etapas
                        do processo avaliativo.
                      </p>

                      <Button
                        asChild
                        className="mt-6 w-fit bg-[#245b7a] hover:bg-[#173f59]"
                      >
                        <Link href={editalUrl} target="_blank">
                          <Download className="size-4" />
                          Baixar edital
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="mb-5 w-fit rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
                        Em breve
                      </div>

                      <h3 className="text-2xl font-bold text-[#102a3d]">
                        O edital será publicado em breve
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-[#5f7d90]">
                        A Comissão Científica está finalizando as orientações
                        oficiais. Assim que o documento estiver disponível, ele
                        poderá ser consultado e baixado nesta seção.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="local"
          className="border-y border-[#d9e8ef] bg-[#eef7fa]"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#245b7a]">
                Local do evento
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#102a3d] sm:text-4xl">
                Um encontro presencial para fortalecer a comunidade acadêmica.
              </h2>

              <div className="mt-8 space-y-5 rounded-3xl border border-[#c7dce6] bg-white p-7 shadow-sm">
                <div className="flex items-start gap-4">
                  <MapPin className="mt-1 size-6 shrink-0 text-[#245b7a]" />

                  <div>
                    <p className="font-semibold text-[#102a3d]">
                      {eventLocationName}
                    </p>

                    <p className="mt-1 text-[#4a6678]">
                      {eventAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CalendarDays className="mt-1 size-6 shrink-0 text-[#245b7a]" />

                  <div>
                    <p className="font-semibold text-[#102a3d]">
                      Data e horários
                    </p>

                    <p className="mt-1 text-[#4a6678]">
                      As informações completas serão divulgadas no edital
                      oficial e nos canais de comunicação da organização.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[#c7dce6] bg-white shadow-sm">
              {eventMapEmbedUrl ? (
                <iframe
                  src={eventMapEmbedUrl}
                  className="h-[420px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex h-[420px] flex-col items-center justify-center p-8 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
                    <MapPin className="size-7" />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold text-[#102a3d]">
                    Mapa em breve
                  </h3>

                  <p className="mt-3 max-w-md leading-7 text-[#4a6678]">
                    O mapa será incorporado assim que o link oficial de
                    localização for definido pela organização do evento.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="patrocinadores"
          className="mx-auto max-w-7xl px-6 py-20 lg:px-8"
        >
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#245b7a]">
              Patrocinadores e apoiadores
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#102a3d] sm:text-4xl">
              Instituições que apoiam a formação médica.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#4a6678]">
              Este espaço será destinado às marcas, instituições e parceiros que
              contribuem para a realização da Jornada Acadêmica de Medicina.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sponsors.map((sponsor, index) => (
              <RevealOnScroll
                key={sponsor}
                delay={index * 100}
              >
                <div className="group flex h-36 items-center justify-center rounded-3xl border border-dashed border-[#b9d4df] bg-white/80 text-center text-sm font-medium text-[#5f7d90] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#245b7a] hover:bg-[#eef7fa] hover:shadow-md">
                  <span className="transition duration-300 group-hover:text-[#245b7a]">
                    {sponsor}
                  </span>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>
      </RevealOnScroll>

      <footer className="border-t border-[#d9e8ef] bg-[#102a3d] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/campgo-logo.png"
                alt="Logo CAMPGO"
                className="size-24 rounded-full object-contain sm:size-28"
              />

              <div>
                <p className="font-bold">
                  CAMPGO
                </p>

                <p className="text-sm text-white/60">
                  Centro Acadêmico de Medicina
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
              Plataforma oficial da Jornada Acadêmica de Medicina para cadastro,
              submissão, avaliação e divulgação dos trabalhos científicos.
            </p>
          </div>

          <div>
            <p className="font-semibold">
              Navegação
            </p>

            <div className="mt-4 space-y-3 text-sm text-white/65">
              <a href="#evento" className="block hover:text-white">
                O evento
              </a>

              <a href="#submissoes" className="block hover:text-white">
                Trabalhos
              </a>

              <a href="#programacao" className="block hover:text-white">
                Programação
              </a>

              <a href="#edital" className="block hover:text-white">
                Edital
              </a>

              <a href="#local" className="block hover:text-white">
                Local
              </a>

              <a href="#patrocinadores" className="block hover:text-white">
                Patrocinadores
              </a>
            </div>
          </div>

          <div>
            <p className="font-semibold">
              Acesso à plataforma
            </p>

            <p className="mt-4 text-sm leading-6 text-white/65">
              Área destinada a alunos, avaliadores e administradores vinculados
              ao processo científico da Jornada.
            </p>

            <Button
              asChild
              className="mt-5 bg-white text-[#102a3d] hover:bg-[#e9f4f8]"
            >
              <Link href="/login">
                Entrar
              </Link>
            </Button>
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/50">
          © 2026 CAMPGO — Jornada Acadêmica de Medicina. Todos os direitos
          reservados.
        </div>
      </footer>
    </main>
  );
}

type HeroInfoProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function HeroInfo({
  icon,
  title,
  description,
}: HeroInfoProps) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/10 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
        {icon}
      </div>

      <div>
        <p className="font-semibold">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-white/65">
          {description}
        </p>
      </div>
    </div>
  );
}

type TextBlockProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function TextBlock({
  icon,
  title,
  description,
}: TextBlockProps) {
  return (
    <div className="border-l-4 border-[#245b7a] pl-5">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]">
        {icon}
      </div>

      <h3 className="text-xl font-semibold text-[#102a3d]">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-[#4a6678]">
        {description}
      </p>
    </div>
  );
}

type TimelineItemProps = {
  number: string;
  title: string;
  description: string;
};

function TimelineItem({
  number,
  title,
  description,
}: TimelineItemProps) {
  return (
    <div className="relative grid gap-5 rounded-3xl border border-[#d9e8ef] bg-white p-6 shadow-sm sm:grid-cols-[90px_1fr]">
      <div className="text-4xl font-bold text-[#8fb7cc]">
        {number}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-[#102a3d]">
          {title}
        </h3>

        <p className="mt-2 leading-7 text-[#4a6678]">
          {description}
        </p>
      </div>
    </div>
  );
}