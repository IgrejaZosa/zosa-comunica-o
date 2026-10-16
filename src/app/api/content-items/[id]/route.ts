import { NextRequest, NextResponse } from "next/server";
import { exigirPerfil, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import { calcularSprintId } from "@/lib/sprints-server";

const CAMPOS_PERMITIDOS = [
  "account_id",
  "tipo",
  "data_planejada",
  "projeto_id",
  "ideia",
  "referencias",
  "observacoes",
  "responsavel_gravacao_id",
  "responsavel_edicao_id",
  "responsavel_postagem_id",
  "estagio",
  "motivo_cancelamento",
  "ordem",
] as const;

const MOTIVOS_VALIDOS = new Set(["perdeu_prazo", "descartado"]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirPerfil();
  if (erro) return erro;

  const { id } = await params;
  const body = await request.json();
  const patch: Record<string, unknown> = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (campo in body) patch[campo] = body[campo];
  }
  if (Object.keys(patch).length === 0) return erroJson("Nada para atualizar.");

  if (patch.motivo_cancelamento != null && !MOTIVOS_VALIDOS.has(patch.motivo_cancelamento as string)) {
    return erroJson("Motivo de exclusão inválido.");
  }
  // o motivo só faz sentido em item cancelado: ao sair desse estágio, limpa
  if ("estagio" in patch && patch.estagio !== "cancelado") patch.motivo_cancelamento = null;

  // sprint_id nunca é enviado pelo cliente - deriva sempre da data
  // planejada, pra sprint_id nunca ficar fora de sincronia com a data.
  if ("data_planejada" in patch) {
    patch.sprint_id = await calcularSprintId(patch.data_planejada as string | null);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("content_items")
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
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) return erroJson(error.message, 500);
  return NextResponse.json({ ok: true });
}
