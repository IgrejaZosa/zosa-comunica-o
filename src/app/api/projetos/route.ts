import { NextRequest, NextResponse } from "next/server";
import { exigirPerfil, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { erro } = await exigirPerfil();
  if (erro) return erro;

  const body = await request.json();
  const nome = (body.nome ?? "").trim();
  if (!nome) return erroJson("Dê um nome ao projeto.");

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("projetos")
    .insert({ nome, descricao: body.descricao || null })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return erroJson("Já existe um projeto com esse nome.");
    return erroJson(error.message, 500);
  }
  return NextResponse.json(data);
}
