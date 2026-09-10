import { NextResponse, type NextRequest } from "next/server";

const COOKIE_ACESSO = "zosa_acesso";
const COOKIE_USUARIO = "zosa_usuario_id";

const LIVRES_SEMPRE = ["/entrar", "/api/acesso"];
const LIVRES_POS_SENHA = ["/quem-e-voce", "/api/quem-sou-eu"];

/** Este app não tem login por e-mail: uma senha única (compartilhada por
 * WhatsApp) libera o acesso, e depois cada pessoa escolhe seu nome numa
 * telinha simples ("Quem é você?") pra aparecer como responsável/quem
 * apontou tempo. Ver src/lib/auth.ts. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (LIVRES_SEMPRE.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const temAcesso = request.cookies.get(COOKIE_ACESSO)?.value === "ok";
  if (!temAcesso) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    return NextResponse.redirect(url);
  }

  if (LIVRES_POS_SENHA.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const temUsuario = !!request.cookies.get(COOKIE_USUARIO)?.value;
  if (!temUsuario) {
    const url = request.nextUrl.clone();
    url.pathname = "/quem-e-voce";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg)$).*)"],
};
