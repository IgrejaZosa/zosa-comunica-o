import { NextResponse } from "next/server";
import { exigirPerfil, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import { sprintVigente } from "@/lib/sprint";

/** Retorna a sprint da semana atual, criando-a se ainda nao existir. */
export async function GET() {
  const { erro } = await exigirPerfil();
  if (erro) return erro;

  const { data_inicio, data_fim } = sprintVigente();
  const supabase = createServiceClient();

  const { data: existente, error: erroBusca } = await supabase
    .from("sprints")
    .select("*")
    .eq("data_inicio", data_inicio)
    .maybeSingle();
  if (erroBusca) return erroJson(erroBusca.message, 500);
  if (existente) return NextResponse.json(existente);

  const { data: nova, error: erroInsert } = await supabase
    .from("sprints")
    .insert({ data_inicio, data_fim })
    .select("*")
    .single();
  if (erroInsert) return erroJson(erroInsert.message, 500);
  return NextResponse.json(nova);
}
