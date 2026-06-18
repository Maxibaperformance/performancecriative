import { NextRequest, NextResponse } from "next/server";
import { listarMarcas, salvarMarca, salvarReferencia } from "@/lib/store";
import type { ReferenciaImagem } from "@/lib/types";

export async function GET() {
  const marcas = await listarMarcas();
  return NextResponse.json(marcas);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Novas referências chegam como data URLs; persistimos em /public/uploads.
    const novasReferencias: ReferenciaImagem[] = [];
    for (const ref of body.novasReferencias ?? []) {
      novasReferencias.push(
        await salvarReferencia(ref.dataUrl, ref.nome, ref.tipo)
      );
    }

    const referencias: ReferenciaImagem[] = [
      ...(body.referencias ?? []),
      ...novasReferencias,
    ];

    const marca = await salvarMarca({
      id: body.id,
      nome: body.nome,
      produto: body.produto ?? "",
      descricao: body.descricao ?? "",
      tomDeVoz: body.tomDeVoz ?? "",
      publicoAlvo: body.publicoAlvo ?? "",
      identidadeVisual: body.identidadeVisual ?? "",
      diferenciais: body.diferenciais ?? "",
      dores: body.dores ?? "",
      desejos: body.desejos ?? "",
      paletaCores: body.paletaCores ?? "",
      linhaProdutos: body.linhaProdutos ?? "",
      proibicoes: body.proibicoes ?? "",
      referencias,
    });

    return NextResponse.json(marca);
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Erro ao salvar marca" },
      { status: 400 }
    );
  }
}
