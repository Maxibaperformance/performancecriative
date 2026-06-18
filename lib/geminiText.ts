// Provedor de inteligência: Gemini (visão + texto). Usado quando não há
// ANTHROPIC_API_KEY — permite rodar o sistema só com a chave do Gemini.
import { GoogleGenAI } from "@google/genai";
import { GEMINI } from "./config";
import type { Marca, BriefingInput, ProdutoInfo, OpcoesRecriacao, Analise } from "./types";
import {
  promptAnalise,
  montarAnaliseIA,
  promptRecriacao,
  parseConteudoRecriacao,
  promptRecriacaoVariacoes,
  parseConteudoVariacoes,
  promptConteudoTextual,
  parseConteudoTextual,
  type AnaliseIA,
  type ConteudoRecriacao,
  type ConteudoVariacoes,
  type ConteudoTextual,
} from "./prompts";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");
  return new GoogleGenAI({ apiKey });
}

async function gerarTexto(prompt: string): Promise<string> {
  const resp = await client().models.generateContent({
    model: GEMINI.textModel,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  return resp.text ?? "";
}

export async function analisarCriativo(
  imagem: { base64: string; mimeType: string },
  marca?: Marca | null
): Promise<AnaliseIA> {
  const resp = await client().models.generateContent({
    model: GEMINI.textModel,
    contents: [
      { text: promptAnalise(marca) },
      { inlineData: { mimeType: imagem.mimeType, data: imagem.base64 } },
    ],
    config: { responseMimeType: "application/json" },
  });
  return montarAnaliseIA(resp.text ?? "");
}

export async function gerarConteudoRecriacao(
  analise: Analise,
  produto: ProdutoInfo,
  opcoes: OpcoesRecriacao,
  marca?: Marca | null
): Promise<ConteudoRecriacao> {
  return parseConteudoRecriacao(
    await gerarTexto(promptRecriacao(analise, produto, opcoes, marca))
  );
}

export async function gerarConteudoVariacoes(
  analise: Analise,
  produto: ProdutoInfo,
  opcoes: OpcoesRecriacao,
  marca: Marca | null | undefined,
  quantidade: number
): Promise<ConteudoVariacoes> {
  return parseConteudoVariacoes(
    await gerarTexto(
      promptRecriacaoVariacoes(analise, produto, opcoes, marca, quantidade)
    )
  );
}

export async function gerarConteudoTextual(
  marca: Marca,
  briefing: BriefingInput
): Promise<ConteudoTextual> {
  return parseConteudoTextual(
    await gerarTexto(promptConteudoTextual(marca, briefing))
  );
}
