import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type UserRole = "student" | "evaluator" | "admin" | "super_admin";

type CurrentProfile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
};

export async function getCurrentUser() {
  noStore();

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      `/login?erro=${encodeURIComponent(
        "Sua sessão expirou. Faça login novamente."
      )}`
    );
  }

  const adminSupabase = createAdminClient();

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("id", user.id)
    .maybeSingle<CurrentProfile>();

  if (profileError) {
    console.error("Erro ao buscar perfil do usuário logado:", {
      userId: user.id,
      email: user.email,
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code,
    });

    redirect(
      `/acesso-negado?erro=${encodeURIComponent(
        "Não foi possível carregar seu perfil. Tente atualizar a página."
      )}`
    );
  }

  if (!profile) {
    console.error("Usuário autenticado sem perfil em public.profiles:", {
      userId: user.id,
      email: user.email,
    });

    redirect(
      `/acesso-negado?erro=${encodeURIComponent(
        "Seu usuário está autenticado, mas não possui perfil cadastrado no sistema."
      )}`
    );
  }

  if (!profile.is_active) {
    redirect(
      `/login?erro=${encodeURIComponent(
        "Este usuário está inativo. Entre em contato com a organização."
      )}`
    );
  }

  return {
    supabase,
    profile,
    user,
  };
}