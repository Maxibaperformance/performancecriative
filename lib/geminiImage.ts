// Geração de imagem via Gemini. OPCIONAL.
// Filosofia: o Gemini Image gera melhor com prompts CURTOS, CONCRETOS e VISUAIS.
// Por isso recebe `promptImagem` (enxuto, gerado separadamente da direção visual
// rica do brief). Quando há referências de imagem, elas têm peso explícito.
import { GoogleGenAI } from "@google/genai";
import { GEMINI } from "./config";
import type { ModoRecriacao, Marca } from "./types";

export function imagemHabilitada(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export interface ImagemGerada {
  base64: string;
  mimeType: string;
}

export interface ReferenciaVisual {
  base64: string;
  mimeType: string;
  papel: "original" | "produto" | "estilo";
}

/** Monta a instrução textual final, separando por tipo de referência. */
function montarInstrucao(
  promptImagem: string,
  ratio: string,
  modo: ModoRecriacao | undefined,
  refs: ReferenciaVisual[],
  marca?: Marca | null
): string {
  const original = refs.find((r) => r.papel === "original");
  const produto = refs.find((r) => r.papel === "produto");
  const estilos = refs.filter((r) => r.papel === "estilo");

  const linhas: string[] = [];

  // Âncora explícita de marca — paleta + linha + proibições.
  if (marca) {
    const ancora: string[] = [`MARCA: ${marca.nome}.`];
    if (marca.paletaCores) ancora.push(`PALETA OBRIGATÓRIA: ${marca.paletaCores}`);
    if (marca.linhaProdutos)
      ancora.push(`LINHA DE PRODUTOS: ${marca.linhaProdutos}`);
    if (marca.proibicoes) ancora.push(`NUNCA: ${marca.proibicoes}`);
    linhas.push(ancora.join(" "));
  }

  if (modo === "clonar" && original) {
    linhas.push(
      "MODO: CLONE EXATO. A primeira imagem é o anúncio ORIGINAL. Recrie fielmente: MESMA estrutura, composição, layout, hierarquia e estilo visual. Substitua APENAS o produto/marca pelo da MARCA acima. NÃO mude o estilo. NÃO invente elementos."
    );
  } else if (estilos.length || produto) {
    linhas.push(
      "MODO: INSPIRAR-SE. Use as referências como guia ESTÉTICO (paleta, estilo fotográfico, mood). Crie composição nova fiel à identidade visual da MARCA."
    );
  }

  if (produto) {
    linhas.push(
      "PRODUTO: uma imagem fornecida é o produto real — mantenha aparência IDÊNTICA (formato, rótulo, embalagem). É o herói da arte."
    );
  }

  if (estilos.length) {
    linhas.push(
      `ESTILO DA MARCA: ${estilos.length} imagem(ns) de referência mostram o estilo visual. Siga paleta, tipografia e tom delas.`
    );
  }

  return [
    promptImagem,
    "",
    `Formato: ${ratio}. Qualidade fotográfica profissional, pronta para anúncio.`,
    ...linhas,
  ].join("\n");
}

export async function gerarImagemCriativo(
  promptImagem: string,
  ratio: string,
  referencias: ReferenciaVisual[],
  modo?: ModoRecriacao,
  marca?: Marca | null
): Promise<ImagemGerada | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const instrucao = montarInstrucao(promptImagem, ratio, modo, referencias, marca);

  // ORDEM IMPORTA: original primeiro (mais peso), depois produto, depois estilos.
  const ordenadas = [
    ...referencias.filter((r) => r.papel === "original"),
    ...referencias.filter((r) => r.papel === "produto"),
    ...referencias.filter((r) => r.papel === "estilo"),
  ];

  const contents: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: instrucao }];
  for (const ref of ordenadas) {
    contents.push({ inlineData: { mimeType: ref.mimeType, data: ref.base64 } });
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI.imageModel,
      contents,
    });
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType ?? "image/png",
        };
      }
    }
  } catch (e) {
    console.error("Falha ao gerar imagem:", e);
  }
  return null;
}
