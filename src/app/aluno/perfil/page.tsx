import {
  LogOut,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { signOut } from "../actions";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function Page() {
  const { profile } = await getCurrentUser();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#102a3d] p-8 text-white shadow-sm lg:p-10">
        <div className="absolute right-[-120px] top-[-120px] size-80 rounded-full bg-[#6fb6cf]/30 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] size-96 rounded-full bg-[#245b7a]/60 blur-3xl" />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
            <Stethoscope className="size-4" />
            Área do aluno
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Meu perfil
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-white/75">
            Consulte seus dados de acesso vinculados à plataforma da Jornada
            Acadêmica de Medicina.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] border border-[#d9e8ef] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-[#eef7fa] text-[#245b7a]">
            <UserRound className="size-10" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-[#102a3d]">
            {profile.full_name}
          </h2>

          <p className="mt-1 text-sm text-[#5f7d90]">
            Aluno
          </p>

          <div className="mt-6 rounded-3xl border border-[#d9e8ef] bg-[#f7fbfd] p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#245b7a]">
              Conta
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
              Estes dados são utilizados para identificar sua autoria,
              submissões e acompanhamento do processo científico.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <ProfileInfoCard
            icon={<UserRound className="size-5" />}
            label="Nome completo"
            value={profile.full_name}
          />

          <ProfileInfoCard
            icon={<Mail className="size-5" />}
            label="E-mail"
            value={profile.email}
          />

          <ProfileInfoCard
            icon={<ShieldCheck className="size-5" />}
            label="Tipo de acesso"
            value="Aluno"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[#d9e8ef] bg-[#eef7fa] p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#245b7a]">
            <ShieldCheck className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold text-[#102a3d]">
              Segurança da conta
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#5f7d90]">
              Caso precise alterar seus dados cadastrais ou tenha dificuldades
              de acesso, entre em contato com a organização da Jornada
              Acadêmica de Medicina.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-red-900">
              Sair da plataforma
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-700">
              Encerre sua sessão neste dispositivo.
            </p>
          </div>

          <form action={signOut}>
            <Button
              type="submit"
              variant="destructive"
            >
              <LogOut className="size-4" />
              Sair da conta
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}

type ProfileInfoCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | null;
};

function ProfileInfoCard({
  icon,
  label,
  value,
}: ProfileInfoCardProps) {
  return (
    <div className="rounded-3xl border border-[#d9e8ef] bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef7fa] text-[#245b7a]">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-[#5f7d90]">
            {label}
          </p>

          <p className="mt-1 break-all font-semibold text-[#102a3d]">
            {value ?? "Não informado"}
          </p>
        </div>
      </div>
    </div>
  );
}