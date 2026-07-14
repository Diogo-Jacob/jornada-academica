import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type AvaliadorLayoutProps = {
  children: React.ReactNode;
};

export default async function AvaliadorLayout({
  children,
}: AvaliadorLayoutProps) {
  const { profile } = await getCurrentUser();

  if (!profile.is_active || profile.role !== "evaluator") {
    redirect("/acesso-negado");
  }

  return children;
}