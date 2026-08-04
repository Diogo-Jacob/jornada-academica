import Link from "next/link";
import { PublicSiteHeader } from "@/components/public-site-header";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import {
  ArrowRight,
  Download,
  MapPin,
  Mic2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorCredit } from "@/components/creator-credit";

const editalDisponivel = true;

const editalUrl = "/Edital_IX_Jornada_Academica_2026.pdf";

const eventLocationName =
  "Universidade da Região de Joinville — UNIVILLE";

const eventAddress =
  "Rua Paulo Malschitzki, nº 10 — Zona Industrial Norte, Joinville/SC";

const eventMapEmbedUrl =
  "https://www.google.com/maps?q=UNIVILLE%20Rua%20Paulo%20Malschitzki%2010%20Zona%20Industrial%20Norte%20Joinville%20SC&output=embed";

const speakers = [
  {
    name: "Palestrante em breve",
    theme: "Tema a confirmar",
  },
  {
    name: "Palestrante em breve",
    theme: "Tema a confirmar",
  },
  {
    name: "Palestrante em breve",
    theme: "Tema a confirmar",
  },
];

const scheduleItems = [
  {
    time: "Em breve",
    title: "Credenciamento e abertura oficial",
    description:
      "Recepção dos participantes e abertura da Jornada pela Comissão Organizadora.",
    type: "Cerimônia",
  },
  {
    time: "Em breve",
    title: "Palestra de abertura",
    description:
      "Atividade inicial com tema e palestrante a serem divulgados em breve.",
    type: "Palestra",
  },
  {
    time: "Em breve",
    title: "Atividades acadêmicas",
    description:
      "Momentos formativos voltados à integração, atualização e vivência médica.",
    type: "Atividade",
  },
  {
    time: "Em breve",
    title: "Apresentações científicas",
    description:
      "Espaço destinado à apresentação dos trabalhos aprovados pela Comissão Científica.",
    type: "Apresentação",
  },
  {
    time: "Em breve",
    title: "Encerramento",
    description:
      "Finalização das atividades e orientações finais da Jornada.",
    type: "Cerimônia",
  },
];

const commissionMembers = [
  {
    name: "Em Breve",
    image: "/campgo-logo.png",
  },
  {
    name: "Em Breve",
    image: "/campgo-logo.png",
  },
  {
    name: "Em Breve",
    image: "/campgo-logo.png",
  },
  {
    name: "Em Breve",
    image: "/campgo-logo.png",
  },
  {
    name: "Em Breve",
    image: "/campgo-logo.png",
  },
  {
    name: "Em Breve",
    image: "/campgo-logo.png",
  },
  {
    name: "Em Breve",
    image: "/campgo-logo.png",
  },
];

const dateScheduleItems = [
  {
    event: "Publicação do edital",
    date: "04/08",
  },
  {
    event: "Abertura do período de submissão de trabalhos",
    date: "04/08",
  },
  {
    event: "Encerramento do período de submissão de trabalhos",
    date: "22/08",
  },
  {
    event:
      "Encerramento do envio de correções de documentos obrigatórios",
    date: "24/08",
  },
  {
    event:
      "Divulgação dos resultados dos trabalhos aprovados",
    date: "28/09",
  },
  {
    event:
      "Exposição e avaliação oral dos pôsteres",
    date: "05 e 06/10",
  },
  {
    event:
      "Apresentação oral dos 5 trabalhos selecionados",
    date: "06/10",
  },
];

const sponsors = [
  {
    name: "UNIVILLE",
    role: "Apoiadora institucional",
    image: "/logo-univille.png",
  },
  {
    name: "Sociedade Joinvilense de Medicina",
    role: "Apoiadora científica",
    image: "/logo-sjm.png",
  },
  {
    name: "Medway",
    role: "Apoiadora",
    image: "/logo-medway.png",
  },
  {
    name: "CAMPGO",
    role: "Organização",
    image: "/campgo-logo.png",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7fbfd] text-[#102a3d]">
      <PublicSiteHeader
        editalDisponivel={editalDisponivel}
        editalUrl={editalUrl}
      />

      <RevealOnScroll>
        <section className="relative min-h-screen overflow-hidden bg-[#07162a] pt-24 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:72px_72px]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(36,91,122,0.58),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(111,182,207,0.25),_transparent_35%)]" />

          <div className="absolute left-1/2 top-32 size-[34rem] -translate-x-1/2 rounded-full bg-[#245b7a]/25 blur-3xl" />

          <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center lg:px-8">
            <div className="mb-8 flex items-center gap-4 text-[#6fb6cf]">
              <span className="h-px w-16 bg-[#6fb6cf]/70" />

              <p className="text-sm font-bold uppercase tracking-[0.45em]">
                IX edição · 2026
              </p>

              <span className="h-px w-16 bg-[#6fb6cf]/70" />
            </div>

            <h1 className="font-display max-w-5xl text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Jornada Acadêmica
              <span className="block text-[#6fb6cf]">
                de Medicina
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#b9d4df] sm:text-xl">
              Ciência, formação médica e protagonismo acadêmico em uma jornada de
              integração, conhecimento e produção científica.
            </p>

            <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="h-12 rounded-xl bg-[#6fb6cf] px-6 text-base font-bold text-[#07162a] shadow-lg shadow-[#6fb6cf]/20 hover:bg-[#8cc9dc]"
              >
                <Link href="/cadastro">
                  Cadastrar aluno
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 rounded-xl border-[#6fb6cf]/60 bg-transparent px-6 text-base font-bold text-[#d9e8ef] hover:bg-[#6fb6cf]/10 hover:text-white"
              >
                <Link href="/login">
                  Entrar
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="evento"
          className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
        >
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#245b7a]">
                O que é o evento
              </p>

              <h2 className="font-display mt-3 text-4xl font-bold leading-tight tracking-tight text-[#102a3d] sm:text-5xl">
                Jornada Acadêmica de Medicina
              </h2>

              <div className="mt-7 space-y-5 text-xl leading-9 text-[#4a6678]">
                <p>
                  A Jornada Acadêmica de Medicina é um evento voltado à integração,
                  ao aprendizado e à valorização da produção científica durante a
                  formação médica.
                </p>

                <p>
                  A iniciativa reúne estudantes, professores, orientadores,
                  avaliadores e profissionais da saúde em um espaço dedicado à troca de
                  experiências, à comunicação científica e ao protagonismo acadêmico.
                </p>

                <p>
                  A programação contempla atividades científicas, momentos formativos e
                  apresentação de trabalhos, fortalecendo a relação entre ensino,
                  pesquisa, extensão e prática médica.
                </p>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute inset-0 rounded-full bg-[#6fb6cf]/20 blur-3xl" />

              <div className="relative w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-[#d9e8ef] bg-white shadow-sm">
                <img
                  src="/logo-ix-jornada.jpg"
                  alt="Logo da IX Jornada Acadêmica de Medicina"
                  className="h-full min-h-[430px] w-full object-contain p-8"
                />
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="comissao"
          className="border-y border-[#d9e8ef] bg-[#102a3d]"
        >
          <div className="mx-auto max-w-7xl px-6 py-24 text-white lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <div className="mb-6 flex items-center gap-4 text-[#6fb6cf]">
                  <span className="h-px w-10 bg-[#6fb6cf]" />

                  <p className="text-sm font-bold uppercase tracking-[0.35em]">
                    Mensagem da Comissão
                  </p>
                </div>

                <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Uma palavra da
                  <span className="block text-[#6fb6cf]">
                    Comissão Científica
                  </span>
                </h2>
              </div>

              <div className="relative">
                <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-[#6fb6cf]/10 blur-xl" />

                <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/10 backdrop-blur sm:p-10">
                  <div className="mb-6 text-7xl font-bold leading-none text-[#6fb6cf]/30">
                    “
                  </div>

                  <div className="space-y-6 text-lg leading-8 text-[#d9e8ef] sm:text-xl sm:leading-9">
                    <p className="italic text-white/90">
                      É com grande satisfação que apresentamos a Jornada Acadêmica de
                      Medicina, um evento construído para fortalecer a formação médica, a
                      produção científica e a integração entre estudantes, docentes,
                      avaliadores e profissionais da saúde.
                    </p>

                    <p>
                      Nesta edição, reafirmamos nosso compromisso com uma experiência
                      acadêmica organizada, ética e formativa, valorizando o protagonismo
                      estudantil e incentivando a participação ativa na construção do
                      conhecimento científico.
                    </p>

                    <p>
                      Convidamos todos os participantes a vivenciarem este momento com
                      dedicação, curiosidade e espírito colaborativo, contribuindo para uma
                      Jornada marcada pelo aprendizado, pela troca de experiências e pelo
                      crescimento coletivo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#6fb6cf]">
                  Comissão Científica
                </p>

                <h3 className="font-display mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
                  Conheça os integrantes responsáveis pela organização.
                </h3>
              </div>

              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {commissionMembers.map((member, index) => (
                  <RevealOnScroll
                    key={`${member.name}-${index}`}
                    delay={index * 80}
                  >
                    <div className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/10 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#6fb6cf]/50 hover:bg-white/[0.09]">
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#07162a]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(111,182,207,0.22),_transparent_45%)]" />

                        <img
                          src={member.image}
                          alt={`Foto de ${member.name}`}
                          className="relative h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />

                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07162a]/90 to-transparent" />
                      </div>

                      <div className="p-5 text-center">
                        <h4 className="text-lg font-bold text-white">
                          {member.name}
                        </h4>
                      </div>
                    </div>
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="cronograma"
          className="campgo-section-dark px-6 py-24 text-white lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 max-w-3xl">
              <div className="mb-6 flex items-center gap-4 text-[#6fb6cf]">
                <span className="h-px w-10 bg-[#6fb6cf]" />

                <p className="text-sm font-bold uppercase tracking-[0.35em]">
                  Programação
                </p>
              </div>

              <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Cronograma
                <span className="block text-[#6fb6cf]">
                  da Jornada
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#b9d4df]">
                Acompanhe as principais datas da IX Jornada Acadêmica de Medicina, desde a abertura das submissões até as apresentações
                dos trabalhos selecionados.
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/10 backdrop-blur">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#6fb6cf]">
                  Etapas oficiais
                </p>

                <h3 className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                  Datas importantes
                  <span className="block text-[#6fb6cf]">
                    para submissão e apresentação
                  </span>
                </h3>

                <p className="mt-5 text-base leading-7 text-[#b9d4df]">
                  Este cronograma reúne os principais prazos previstos em edital.
                  Fique atento às datas de submissão, envio de correções,
                  divulgação dos resultados e apresentações durante o evento.
                </p>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/10 backdrop-blur">
                <div className="border-b border-white/10 bg-white/[0.03] p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#6fb6cf]">
                    Cronograma de datas
                  </p>

                  <p className="mt-2 text-base leading-7 text-[#b9d4df]">
                    Confira os prazos principais para participação e acompanhamento
                    dos trabalhos científicos.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03]">
                        <th className="px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#6fb6cf]">
                          Evento
                        </th>

                        <th className="w-36 px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.22em] text-[#6fb6cf]">
                          Data
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/10">
                      {dateScheduleItems.map((item) => (
                        <tr
                          key={`${item.event}-${item.date}`}
                          className="transition hover:bg-white/[0.03]"
                        >
                          <td className="px-6 py-5 text-base font-medium leading-7 text-white">
                            {item.event}
                          </td>

                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex rounded-full border border-[#6fb6cf]/30 bg-[#6fb6cf]/10 px-4 py-2 text-sm font-bold text-[#9ed8eb]">
                              {item.date}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-20 grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/10 backdrop-blur">
                <div className="border-b border-white/10 bg-white/[0.03] p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#6fb6cf]">
                    Cronograma de horários
                  </p>

                  <p className="mt-2 text-base leading-7 text-[#b9d4df]">
                    Programação prevista para os dias do evento.
                  </p>
                </div>

                <div className="divide-y divide-white/10">
                  {scheduleItems.map((item) => (
                    <ScheduleRow
                      key={item.title}
                      time={item.time}
                      title={item.title}
                      description={item.description}
                      type={item.type}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/10 backdrop-blur">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#6fb6cf]">
                  Durante o evento
                </p>

                <h3 className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                  Atividades,
                  <span className="block text-[#6fb6cf]">
                    apresentações e avaliação
                  </span>
                </h3>

                <p className="mt-5 text-base leading-7 text-[#b9d4df]">
                  Além das atividades acadêmicas da Jornada, os trabalhos aprovados
                  participarão da exposição em pôster e da avaliação oral conforme
                  as orientações da Comissão Científica.
                </p>

              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="local"
          className="border-y border-[#d9e8ef] bg-[#eef7fa] px-6 py-24 text-[#102a3d] lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-12">
              <div className="mb-6 flex items-center gap-4 text-[#245b7a]">
                <span className="h-px w-10 bg-[#245b7a]" />

                <p className="text-sm font-bold uppercase tracking-[0.35em]">
                  Local do evento
                </p>
              </div>

              <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Onde a Jornada
                <span className="block text-[#245b7a]">
                  acontece
                </span>
              </h2>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-[#4a6678]">
                A Jornada será realizada no Centro de Convenções da UNIVILLE, localizado
                ao final do campus, em Joinville. O espaço foi escolhido por oferecer uma
                estrutura adequada para receber estudantes, professores, avaliadores e
                convidados.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
              <div className="overflow-hidden rounded-[2rem] border border-[#c7dce6] bg-white shadow-sm">
                <div className="relative flex items-center justify-center border-b border-[#d9e8ef] bg-[#f7fbfd] p-8">
                  <div className="absolute right-[-80px] top-[-80px] size-56 rounded-full bg-[#6fb6cf]/20 blur-3xl" />
                  <div className="absolute bottom-[-100px] left-[-80px] size-64 rounded-full bg-[#245b7a]/10 blur-3xl" />

                  <img
                    src="/logo-univille.png"
                    alt="Logo UNIVILLE"
                    className="relative max-h-28 w-auto object-contain"
                  />
                </div>

                <div className="p-7">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]">
                      <MapPin className="size-6" />
                    </div>

                    <div>
                      <p className="text-xl font-bold text-[#102a3d]">
                        {eventLocationName}
                      </p>

                      <p className="mt-3 text-lg leading-8 text-[#4a6678]">
                        {eventAddress}
                      </p>

                      <p className="mt-5 rounded-2xl border border-[#d9e8ef] bg-[#f7fbfd] p-4 text-base leading-7 text-[#5f7d90]">
                        O evento acontecerá no Centro de Convenções da UNIVILLE, em um espaço preparado para atividades acadêmicas, formação e
                        troca de experiências.
                    </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-[#c7dce6] bg-white shadow-sm">
                <iframe
                  src={eventMapEmbedUrl}
                  className="h-[460px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa da UNIVILLE"
                />
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="palestrantes"
          className="border-y border-[#d9e8ef] bg-[#eef7fa]"
        >
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#245b7a]">
                Palestrantes
              </p>

              <h2 className="font-display mt-3 text-4xl font-bold leading-tight tracking-tight text-[#102a3d] sm:text-5xl">
                Convidados serão divulgados em breve.
              </h2>

              <p className="mt-5 text-xl leading-9 text-[#4a6678]">
                A programação contará com palestrantes convidados e temas
                relevantes para a formação médica. As informações oficiais serão
                atualizadas nesta seção.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {speakers.map((speaker, index) => (
                <RevealOnScroll
                  key={`${speaker.name}-${index}`}
                  delay={index * 100}
                >
                  <div className="group rounded-[2rem] border border-[#d9e8ef] bg-white p-7 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-[#eef7fa] text-[#245b7a] transition group-hover:bg-[#245b7a] group-hover:text-white">
                      <Mic2 className="size-7" />
                    </div>

                    <h3 className="font-display mt-6 text-2xl font-semibold text-[#102a3d]">
                      {speaker.name}
                    </h3>

                    <p className="mt-2 text-base text-[#5f7d90]">
                      {speaker.theme}
                    </p>

                    <p className="mt-5 rounded-full border border-[#d9e8ef] bg-[#f7fbfd] px-4 py-2 text-sm font-semibold text-[#245b7a]">
                      Divulgação em breve
                    </p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="edital"
          className="campgo-section-dark border-t border-white/10 px-6 py-24 text-white lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-10">
              <div className="mb-6 flex items-center gap-4 text-[#6fb6cf]">
                <span className="h-px w-10 bg-[#6fb6cf]" />

                <p className="text-sm font-bold uppercase tracking-[0.35em]">
                  Documento oficial
                </p>
              </div>

              <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Edital da
                <span className="block text-[#6fb6cf]">
                  Jornada
                </span>
              </h2>
            </div>

            <div className="max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/10 backdrop-blur sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#245b7a] text-[#d9e8ef]">
                  <Download className="size-7" />
                </div>

                <div className="flex-1">
                  <div className="mb-4 w-fit rounded-lg border border-[#6fb6cf]/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#6fb6cf]">
                    {editalDisponivel ? "Disponível" : "Em breve"}
                  </div>

                  <h3 className="font-display text-3xl font-bold text-white">
                    Edital oficial da Jornada Acadêmica de Medicina
                  </h3>

                  {editalDisponivel && (
                    <Button
                      asChild
                      className="mt-6 h-12 bg-[#6fb6cf] px-6 text-base font-bold text-[#07162a] hover:bg-[#8cc9dc]"
                    >
                      <Link
                        href={editalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="size-4" />
                        Baixar edital
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section
          id="patrocinadores"
          className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
        >
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#245b7a]">
              Patrocinadores e apoiadores
            </p>

            <h2 className="font-display mt-3 text-4xl font-bold leading-tight tracking-tight text-[#102a3d] sm:text-5xl">
              Instituições que apoiam a realização da Jornada.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-xl leading-9 text-[#4a6678]">
              A Jornada Acadêmica de Medicina conta com o apoio de instituições parceiras
              que contribuem para a formação médica, a produção científica e a integração
              acadêmica.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sponsors.map((sponsor, index) => (
              <RevealOnScroll
                key={sponsor.name}
                delay={index * 100}
              >
                <div className="group flex h-full min-h-[340px] flex-col rounded-[2rem] border border-[#d9e8ef] bg-white p-7 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#245b7a] hover:shadow-md">
                  <div className="flex h-40 w-full items-center justify-center rounded-3xl bg-[#f7fbfd] p-6">
                    <img
                      src={sponsor.image}
                      alt={`Logo ${sponsor.name}`}
                      className="max-h-24 max-w-[88%] object-contain"
                    />
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-center">
                    <h3 className="mt-6 min-h-[56px] text-xl font-bold leading-tight text-[#102a3d]">
                      {sponsor.name}
                    </h3>

                    <p className="mt-2 text-base text-[#5f7d90]">
                      {sponsor.role}
                    </p>
                  </div>
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
                <p className="text-lg font-bold">
                  CAMPGO
                </p>

                <p className="text-sm text-white/60">
                  Centro Acadêmico de Medicina
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-md text-base leading-7 text-white/65">
              Plataforma oficial da Jornada Acadêmica de Medicina para cadastro,
              organização, comunicação e acompanhamento das atividades do evento.
            </p>
          </div>

          <div>
            <p className="text-lg font-semibold">
              Navegação
            </p>

            <div className="mt-4 space-y-3 text-base text-white/65">
              <a href="#evento" className="block hover:text-white">
                O evento
              </a>

              <a href="#comissao" className="block hover:text-white">
                Comissão
              </a>

              <a href="#cronograma" className="block hover:text-white">
                Cronograma
              </a>

              <a href="#local" className="block hover:text-white">
                Local
              </a>

              <a href="#palestrantes" className="block hover:text-white">
                Palestrantes
              </a>

              <a href="#edital" className="block hover:text-white">
                Edital
              </a>

              <a href="#patrocinadores" className="block hover:text-white">
                Apoiadores
              </a>
            </div>
          </div>

          <div>
            <p className="text-lg font-semibold">
              Acesso à plataforma
            </p>

            <p className="mt-4 text-base leading-7 text-white/65">
              Área destinada a alunos, avaliadores e administradores vinculados à
              Jornada Acadêmica de Medicina.
            </p>

            <Button
              asChild
              className="mt-5 h-12 bg-white px-6 text-base text-[#102a3d] hover:bg-[#e9f4f8]"
            >
              <Link href="/login">
                Entrar
              </Link>
            </Button>
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-5 text-center text-sm text-white/50">
          <p>
            © 2026 CAMPGO — Jornada Acadêmica de Medicina. Todos os direitos
            reservados.
          </p>

          <p className="mt-2 text-xs text-white/40">
            <CreatorCredit />
          </p>
        </div>
      </footer>
    </main>
  );
}

type ScheduleRowProps = {
  time: string;
  title: string;
  description: string;
  type: string;
};

function ScheduleRow({
  time,
  title,
  description,
  type,
}: ScheduleRowProps) {
  return (
    <div className="grid gap-4 p-5 transition hover:bg-white/[0.03] sm:grid-cols-[120px_1fr_auto] sm:items-center sm:p-6">
      <p className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-[#6fb6cf]">
        {time}
      </p>

      <div>
        <h4 className="text-lg font-bold text-white">
          {title}
        </h4>

        <p className="mt-1 text-sm leading-6 text-[#8fb7cc]">
          {description}
        </p>
      </div>

      <span className="w-fit rounded-lg border border-[#6fb6cf]/40 px-3 py-1 text-xs font-bold text-[#6fb6cf]">
        {type}
      </span>
    </div>
  );
}