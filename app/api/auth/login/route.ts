import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, criarToken, senhaConfere } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const senha = (await req.json().catch(() => ({})))?.senha;
  const real = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!real || !secret) {
    return NextResponse.json(
      { erro: "Autenticação não configurada (defina APP_PASSWORD e AUTH_SECRET)." },
      { status: 500 }
    );
  }
  if (typeof senha !== "string" || !(await senhaConfere(senha, real, secret))) {
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  const token = await criarToken(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
