import { NextRequest, NextResponse } from "next/server";
import { erroJson } from "@/lib/api-helpers";

const UM_ANO = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  if (!process.env.APP_ACCESS_PASSWORD) {
    return erroJson("APP_ACCESS_PASSWORD não configurada no servidor.", 500);
  }
  if (body.senha !== process.env.APP_ACCESS_PASSWORD) {
    return erroJson("Senha incorreta.", 401);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("zosa_acesso", "ok", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UM_ANO,
  });
  return res;
}
