import { NextRequest, NextResponse } from "next/server";
import { obterMarca, excluirMarca } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const marca = await obterMarca(id);
  if (!marca) {
    return NextResponse.json({ erro: "Marca não encontrada" }, { status: 404 });
  }
  return NextResponse.json(marca);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await excluirMarca(id);
  return NextResponse.json({ ok: true });
}
