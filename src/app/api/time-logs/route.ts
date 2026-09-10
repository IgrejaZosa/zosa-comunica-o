import { NextRequest, NextResponse } from "next/server";
import { exigirPerfil, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

function calcularDuracaoMinutos(inicio: string, fim: string): number {
  return Math.max(0, Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 60000));
}

/** Cria um apontamento de tempo. Sem `fim`: inicia um timer em andamento
 * (pare depois com PATCH /api/time-logs/[id]). Com `fim`: lancamento
 * manual, ja com a duracao calculada. */
export async function POST(request: NextRequest) {
  const { profile, erro } = await exigirPerfil();
  if (erro) return erro;

  const body = await request.json();
  if (!body.content_item_id || !body.etapa) {
    return erroJson("Informe o item de conteúdo e a etapa.");
  }

  const inicio = body.inicio ?? new Date().toISOString();
  const fim = body.fim ?? null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("time_logs")
    .insert({
      content_item_id: body.content_item_id,
      user_id: profile!.id,
      etapa: body.etapa,
      inicio,
      fim,
      duracao_minutos: fim ? calcularDuracaoMinutos(inicio, fim) : null,
      observ: body.observ ?? null,
    })
    .select("*")
    .single();

  if (error) return erroJson(error.message, 500);
  return NextResponse.json(data);
}
