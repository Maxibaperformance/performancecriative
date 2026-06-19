import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verificarToken } from "@/lib/auth";

// Protege TUDO (páginas + API). Sem cookie de sessão válido:
//  - páginas → redireciona pra /login
//  - /api/*  → 401 JSON
// Allowlist: /login e /api/auth/login (pra conseguir autenticar).

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rota de autenticação precisa ficar aberta.
  if (pathname === "/api/auth/login") return NextResponse.next();

  const secret = process.env.AUTH_SECRET ?? "";
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const autenticado = await verificarToken(token, secret);

  if (autenticado) {
    // Já logado tentando ver /login → manda pra home.
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Não autenticado.
  if (pathname === "/login") return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const url = new URL("/login", req.url);
  return NextResponse.redirect(url);
}

export const config = {
  // Aplica a tudo, menos assets estáticos do Next e o favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
