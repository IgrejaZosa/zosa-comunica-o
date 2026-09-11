import { NextRequest, NextResponse } from "next/server";
import { exigirPerfil, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirPerfil();
  if (erro) return erro;

  const { id } = await params;
  const body = await request.json();
  const patch: Record<string, unknown> = {};
  if ("nome" in body) {
    const nome = (body.nome ?? "").trim();
    if (!nome) return erroJson("Dê um nome ao projeto.");
    patch.nome = nome;
  }
  if ("descricao" in body) patch.descricao = body.descricao || null;
  if (Object.keys(patch).length === 0) return erroJson("Nada para atualizar.");

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("projetos").update(patch).eq("id", id).select("*").single();

  if (error) {
    if (error.code === "23505") return erroJson("Já existe um projeto com esse nome.");
    return erroJson(error.message, 500);
  }
  return NextResponse.json(data);
}
