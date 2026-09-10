import { NextRequest, NextResponse } from "next/server";
import { erroJson } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

const UM_ANO = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (!body.usuario_id) return erroJson("Informe a pessoa.");

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", body.usuario_id)
    .maybeSingle();
  if (error) return erroJson(error.message, 500);
  if (!data) return erroJson("Pessoa não encontrada.", 404);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("zosa_usuario_id", body.usuario_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UM_ANO,
  });
  return res;
}
