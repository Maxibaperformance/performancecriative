import { NextRequest, NextResponse } from "next/server";
import { obterAnalise, atualizarAnalise } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const a = await obterAnalise(id);
  if (!a) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  return NextResponse.json(a);
}

// Reclassificar (funil/nível/ângulos) ou validar (validado: sim|nao).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patch = await req.json();
  const atualizada = await atualizarAnalise(id, patch);
  if (!atualizada)
    return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  return NextResponse.json(atualizada);
}
