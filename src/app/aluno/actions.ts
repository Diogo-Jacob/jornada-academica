"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Erro ao sair da conta do aluno:", {
      message: error.message,
      name: error.name,
      status: error.status,
    });
  }

  redirect("/login");
}