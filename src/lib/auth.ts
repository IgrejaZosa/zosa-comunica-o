import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const COOKIE_ACESSO = "zosa_acesso";
export const COOKIE_USUARIO = "zosa_usuario_id";

/** Retorna a pessoa escolhida em "Quem é você?" (cookie zosa_usuario_id),
 * ou null se ainda não escolheu. Não é uma sessão de login de verdade —
 * é só a identidade usada para atribuir criação/postagem/tempo. */
export async function getProfileAtual(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const usuarioId = cookieStore.get(COOKIE_USUARIO)?.value;
  if (!usuarioId) return null;

  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", usuarioId).single();

  return (data as Profile) ?? null;
}
