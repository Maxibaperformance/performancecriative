// Seletor de provedor de inteligência.
// Prefere Claude (Anthropic) quando há ANTHROPIC_API_KEY; senão usa Gemini.
// Assim o sistema roda com qualquer uma das duas chaves.
import * as anthropic from "./anthropic";
import * as gemini from "./geminiText";
import type {
  Marca,
  BriefingInput,
  ProdutoInfo,
  OpcoesRecriacao,
  Analise,
} from "./types";

function provider() {
  if (process.env.ANTHROPIC_API_KEY) return anthropic;
  if (process.env.GEMINI_API_KEY) return gemini;
  throw new Error(
    "Configure ANTHROPIC_API_KEY (recomendado) ou GEMINI_API_KEY no .env.local."
  );
}

/** Qual provedor está ativo (pra exibir na UI, se quiser). */
export function provedorAtivo(): "claude" | "gemini" | null {
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

export function analisarCriativo(
  imagem: { base64: string; mimeType: string },
  marca?: Marca | null
) {
  return provider().analisarCriativo(imagem, marca);
}

export function gerarConteudoRecriacao(
  analise: Analise,
  produto: ProdutoInfo,
  opcoes: OpcoesRecriacao,
  marca?: Marca | null
) {
  return provider().gerarConteudoRecriacao(analise, produto, opcoes, marca);
}

export function gerarConteudoVariacoes(
  analise: Analise,
  produto: ProdutoInfo,
  opcoes: OpcoesRecriacao,
  marca: Marca | null | undefined,
  quantidade: number
) {
  return provider().gerarConteudoVariacoes(analise, produto, opcoes, marca, quantidade);
}

export function gerarConteudoTextual(marca: Marca, briefing: BriefingInput) {
  return provider().gerarConteudoTextual(marca, briefing);
}
