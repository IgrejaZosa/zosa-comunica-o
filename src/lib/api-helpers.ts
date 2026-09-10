import { NextResponse } from "next/server";
import { getProfileAtual } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export async function exigirPerfil() {
  const profile = await getProfileAtual();
  if (!profile) {
    return { profile: null, erro: NextResponse.json({ erro: "Não autenticado." }, { status: 401 }) };
  }
  return { profile: profile as Profile, erro: null };
}

export function erroJson(mensagem: string, status = 400) {
  return NextResponse.json({ erro: mensagem }, { status });
}
