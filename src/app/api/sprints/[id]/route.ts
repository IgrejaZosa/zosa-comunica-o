import { NextRequest, NextResponse } from "next/server";
import { exigirPerfil, erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirPerfil();
  if (erro) return erro;

  const { id } = await params;
  const body = await request.json();
  if (typeof body.meta !== "string") return erroJson("Informe a meta da sprint.");

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sprints")
    .update({ meta: body.meta })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return erroJson(error.message, 500);
  return NextResponse.json(data);
}
