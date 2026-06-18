import { NextRequest, NextResponse } from "next/server";
import {
  salvarUploadDataUrl,
  salvarAnalise,
  obterMarca,
  salvarVideoDataUrl,
} from "@/lib/store";
import { analisarCriativo } from "@/lib/ai";
import type { TipoMidia } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imagemDataUrl, marcaId, videoDataUrl } = body;
    const tipoMidia: TipoMidia = body.tipoMidia ?? "imagem";

    if (!imagemDataUrl) {
      return NextResponse.json(
        { erro: "Envie pelo menos um frame da imagem." },
        { status: 400 }
      );
    }

    const match = String(imagemDataUrl).match(
      /^data:(image\/[a-zA-Z+]+);base64,(.+)$/
    );
    if (!match) {
      return NextResponse.json({ erro: "Imagem inválida." }, { status: 400 });
    }
    const [, mimeType, base64] = match;

    // Salva o frame (sempre) e o vídeo (se for vídeo).
    const imagemRefUrl = await salvarUploadDataUrl(imagemDataUrl);
    const videoRefUrl =
      tipoMidia !== "imagem" && videoDataUrl
        ? await salvarVideoDataUrl(videoDataUrl)
        : undefined;

    const marca = marcaId ? await obterMarca(marcaId) : null;
    const ia = await analisarCriativo({ base64, mimeType }, marca);

    const analise = await salvarAnalise({
      marcaId: marcaId || undefined,
      tipoMidia,
      imagemRefUrl,
      videoRefUrl,
      validado: null,
      ...ia,
    });

    return NextResponse.json(analise);
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Erro ao analisar" },
      { status: 500 }
    );
  }
}
