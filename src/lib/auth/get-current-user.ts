import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;

  if (error || !userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("id", userId)
    .single();

  if (profileError || !profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?erro=Sua sessão ou perfil não é válido.");
  }

  return {
    supabase,
    profile,
  };
}