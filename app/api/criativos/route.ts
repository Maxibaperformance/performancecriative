import { NextRequest, NextResponse } from "next/server";
import { listarCriativos } from "@/lib/store";

export async function GET(req: NextRequest) {
  const marcaId = req.nextUrl.searchParams.get("marcaId") ?? undefined;
  const criativos = await listarCriativos(marcaId);
  return NextResponse.json(criativos);
}
