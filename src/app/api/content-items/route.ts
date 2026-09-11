import { NextRequest, NextResponse } from "next/server";
import { exigirPerfil, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import { calcularSprintId } from "@/lib/sprints-server";

export async function POST(request: NextRequest) {
  const { profile, erro } = await exigirPerfil();
  if (erro) return erro;

  const body = await request.json();
  if (!body.ideia || !body.account_id || !body.tipo) {
    return erroJson("Preencha conta, tipo e ideia.");
  }

  const dataPlanejada = body.data_planejada ?? null;
  const sprintId = await calcularSprintId(dataPlanejada);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("content_items")
    .insert({
      account_id: body.account_id,
      tipo: body.tipo,
      data_planejada: dataPlanejada,
      evento_motivo: body.evento_motivo ?? null,
      ideia: body.ideia,
      referencias: body.referencias ?? null,
      observacoes: body.observacoes ?? null,
      responsavel_filmagem_id: body.responsavel_filmagem_id ?? null,
      responsavel_gravacao_id: body.responsavel_gravacao_id ?? null,
      responsavel_edicao_id: body.responsavel_edicao_id ?? null,
      responsavel_postagem_id: body.responsavel_postagem_id ?? null,
      estagio: body.estagio ?? "backlog",
      sprint_id: sprintId,
      ordem: body.ordem ?? 0,
      created_by: profile!.id,
    })
    .select("*")
    .single();

  if (error) return erroJson(error.message, 500);
  return NextResponse.json(data);
}
