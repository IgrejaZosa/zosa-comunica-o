import { NextRequest, NextResponse } from "next/server";
import { exigirPerfil, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirPerfil();
  if (erro) return erro;

  const { id } = await params;
  const body = await request.json();

  const payload: Record<string, string> = {};
  if (typeof body.meta === "string") payload.meta = body.meta;
  if (body.data_inicio !== undefined || body.data_fim !== undefined) {
    if (typeof body.data_inicio !== "string" || typeof body.data_fim !== "string") {
      return erroJson("Informe início e fim do período.");
    }
    if (body.data_fim <= body.data_inicio) {
      return erroJson("O fim do período precisa ser depois do início.");
    }
    payload.data_inicio = body.data_inicio;
    payload.data_fim = body.data_fim;
  }
  if (Object.keys(payload).length === 0) return erroJson("Nada para atualizar.");

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sprints")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return erroJson(error.message, 500);
  return NextResponse.json(data);
}
