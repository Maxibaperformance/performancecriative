import { NextRequest, NextResponse } from "next/server";
import {
  obterMarca,
  lerArquivoPublicoBase64,
  salvarImagemCriativo,
  salvarCriativo,
} from "@/lib/store";
import { gerarConteudoTextual } from "@/lib/ai";
import { gerarImagemCriativo, imagemHabilitada } from "@/lib/geminiImage";
import { FORMATOS, FORMATOS_PADRAO } from "@/lib/types";
import type { BriefingInput, ImagemFormato } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const briefing = (await req.json()) as BriefingInput;

    const marca = await obterMarca(briefing.marcaId);
    if (!marca) {
      return NextResponse.json({ erro: "Marca não encontrada" }, { status: 404 });
    }

    // 1) Claude: copy + briefing estruturado + direção visual.
    const conteudo = await gerarConteudoTextual(marca, briefing);

    // 2) Gemini (opcional): gera 2 formatos em PARALELO (1:1 Feed + 9:16 Story).
    const imagens: ImagemFormato[] = [];
    if (imagemHabilitada()) {
      const refsSelecionadas = marca.referencias.filter((r) =>
        (briefing.usarReferencias ?? []).includes(r.id)
      );
      const referencias: import("@/lib/geminiImage").ReferenciaVisual[] = [];
      for (const ref of refsSelecionadas) {
        const arq = await lerArquivoPublicoBase64(ref.url);
        if (arq) referencias.push({ ...arq, papel: "estilo" });
      }
      // SEMPRE Feed (1:1) e Story (9:16), independente do formato escolhido no briefing.
      const formatosGerar = FORMATOS_PADRAO;
      const resultados = await Promise.all(
        formatosGerar.map((f) =>
          gerarImagemCriativo(
            conteudo.direcaoVisual,
            FORMATOS[f].ratio,
            referencias,
            undefined,
            marca
          )
        )
      );
      for (let i = 0; i < formatosGerar.length; i++) {
        const r = resultados[i];
        if (r) {
          const url = await salvarImagemCriativo(r.base64, r.mimeType);
          imagens.push({ formato: formatosGerar[i], url });
        }
      }
    }

    // 3) Persiste.
    const criativo = await salvarCriativo({
      marcaId: marca.id,
      marcaNome: marca.nome,
      briefing,
      copy: conteudo.copy,
      briefingEstruturado: conteudo.briefingEstruturado,
      direcaoVisual: conteudo.direcaoVisual,
      imagens,
      imagemUrl: imagens[0]?.url,
    });

    return NextResponse.json(criativo);
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Erro ao gerar criativo" },
      { status: 500 }
    );
  }
}
