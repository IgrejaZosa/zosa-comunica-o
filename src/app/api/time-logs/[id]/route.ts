import { NextRequest, NextResponse } from "next/server";
import { exigirPerfil, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

function calcularDuracaoMinutos(inicio: string, fim: string): number {
  return Math.max(0, Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 60000));
}

/** Para um timer em andamento (ou corrige um lancamento existente). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirPerfil();
  if (erro) return erro;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = createServiceClient();

  const { data: atual, error: erroBusca } = await supabase
    .from("time_logs")
    .select("inicio")
    .eq("id", id)
    .single();
  if (erroBusca || !atual) return erroJson("Apontamento não encontrado.", 404);

  const fim = body.fim ?? new Date().toISOString();
  const patch: Record<string, unknown> = {
    fim,
    duracao_minutos: calcularDuracaoMinutos(atual.inicio, fim),
  };
  if (body.observ !== undefined) patch.observ = body.observ;
  if (body.etapa !== undefined) patch.etapa = body.etapa;

  const { data, error } = await supabase
    .from("time_logs")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return erroJson(error.message, 500);
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirPerfil();
  if (erro) return erro;

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("time_logs").delete().eq("id", id);
  if (error) return erroJson(error.message, 500);
  return NextResponse.json({ ok: true });
}
