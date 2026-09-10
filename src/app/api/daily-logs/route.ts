import { NextRequest, NextResponse } from "next/server";
import { exigirPerfil, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

/** Cria ou atualiza o daily do usuario logado para uma data (padrao: hoje). */
export async function POST(request: NextRequest) {
  const { profile, erro } = await exigirPerfil();
  if (erro) return erro;

  const body = await request.json();
  const data = body.data ?? new Date().toISOString().slice(0, 10);

  const supabase = createServiceClient();
  const { data: registro, error } = await supabase
    .from("daily_logs")
    .upsert(
      {
        user_id: profile!.id,
        data,
        fiz_ontem: body.fiz_ontem ?? null,
        farei_hoje: body.farei_hoje ?? null,
        impedimentos: body.impedimentos ?? null,
      },
      { onConflict: "user_id,data" }
    )
    .select("*")
    .single();

  if (error) return erroJson(error.message, 500);
  return NextResponse.json(registro);
}
