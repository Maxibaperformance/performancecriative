// Provedor de inteligência: Claude (visão + texto).
import Anthropic from "@anthropic-ai/sdk";
import { AI } from "./config";
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

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada.");
  return new Anthropic({ apiKey });
}

function textoDa(resp: Anthropic.Message): string {
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function normalizarMedia(mime: string): MediaType {
  if (mime.includes("png")) return "image/png";
  if (mime.includes("webp")) return "image/webp";
  if (mime.includes("gif")) return "image/gif";
  return "image/jpeg";
}

export async function analisarCriativo(
  imagem: { base64: string; mimeType: string },
  marca?: Marca | null
): Promise<AnaliseIA> {
  const resp = await client().messages.create({
    model: AI.model,
    max_tokens: 6000,
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: promptAnalise(marca) },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: normalizarMedia(imagem.mimeType),
              data: imagem.base64,
            },
          },
        ],
      },
    ],
  });
  return montarAnaliseIA(textoDa(resp));
}

export async function gerarConteudoRecriacao(
  analise: Analise,
  produto: ProdutoInfo,
  opcoes: OpcoesRecriacao,
  marca?: Marca | null
): Promise<ConteudoRecriacao> {
  const resp = await client().messages.create({
    model: AI.model,
    max_tokens: 6000,
    thinking: { type: "adaptive" },
    messages: [
      { role: "user", content: promptRecriacao(analise, produto, opcoes, marca) },
    ],
  });
  return parseConteudoRecriacao(textoDa(resp));
}

export async function gerarConteudoVariacoes(
  analise: Analise,
  produto: ProdutoInfo,
  opcoes: OpcoesRecriacao,
  marca: Marca | null | undefined,
  quantidade: number
): Promise<ConteudoVariacoes> {
  const resp = await client().messages.create({
    model: AI.model,
    max_tokens: 12000,
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: promptRecriacaoVariacoes(analise, produto, opcoes, marca, quantidade),
      },
    ],
  });
  return parseConteudoVariacoes(textoDa(resp));
}

export async function gerarConteudoTextual(
  marca: Marca,
  briefing: BriefingInput
): Promise<ConteudoTextual> {
  const resp = await client().messages.create({
    model: AI.model,
    max_tokens: 6000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: promptConteudoTextual(marca, briefing) }],
  });
  return parseConteudoTextual(textoDa(resp));
}
