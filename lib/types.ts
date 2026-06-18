// Tipos centrais do sistema de performance criativa.
import type {
  Funil,
  NivelConsciencia,
  Angulo,
  ScoreLabel,
} from "./taxonomia";

export type { Funil, NivelConsciencia, Angulo, ScoreLabel };

/** Imagem de referência vinculada a uma marca (logo, foto de produto, criativo vencedor...). */
export interface ReferenciaImagem {
  id: string;
  nome: string;
  tipo: "logo" | "produto" | "criativo" | "outro";
  /** Caminho público servível, ex: /uploads/abc.png */
  url: string;
  mimeType: string;
}

/** O "DNA criativo" de uma marca — o CONTEXTO que guia toda geração. */
export interface Marca {
  id: string;
  nome: string;
  produto: string;
  descricao: string;
  tomDeVoz: string;
  publicoAlvo: string;
  identidadeVisual: string; // cores, estilo visual, fontes (descritivo)
  diferenciais: string;
  /** Dores concretas do público — a IA usa pra atacar na copy. */
  dores: string;
  /** Desejos / transformação que o público busca. */
  desejos: string;
  /** Paleta específica em hex/nomes — ancora a geração de imagem. */
  paletaCores: string;
  /** Linha completa de produtos da marca. */
  linhaProdutos: string;
  /** O que NUNCA deve aparecer (estética, palavras, claims). */
  proibicoes: string;
  referencias: ReferenciaImagem[];
  criadoEm: string;
  atualizadoEm: string;
}

export type FormatoCriativo =
  | "feed-quadrado" // 1:1
  | "story" // 9:16
  | "feed-retrato" // 4:5
  | "paisagem"; // 16:9

/** Sempre que o sistema gera imagens, gera estes 2 formatos. */
export const FORMATOS_PADRAO: FormatoCriativo[] = ["feed-quadrado", "story"];

export const FORMATOS: Record<
  FormatoCriativo,
  { label: string; aspect: string; ratio: string }
> = {
  "feed-quadrado": { label: "Feed Quadrado", aspect: "1 / 1", ratio: "1:1" },
  story: { label: "Story / Reels", aspect: "9 / 16", ratio: "9:16" },
  "feed-retrato": { label: "Feed Retrato", aspect: "4 / 5", ratio: "4:5" },
  paisagem: { label: "Paisagem", aspect: "16 / 9", ratio: "16:9" },
};

/** Canal de destino do criativo recriado — ajusta formato e estilo da copy. */
export type Canal = "meta" | "google" | "tiktok" | "whatsapp";

export const CANAIS: Record<
  Canal,
  { label: string; formatoSugerido: FormatoCriativo; guia: string }
> = {
  meta: {
    label: "Meta Ads (Feed/Stories)",
    formatoSugerido: "feed-retrato",
    guia: "Anúncio pago no Instagram/Facebook. Scroll-stopper, gancho forte na 1ª linha, CTA claro.",
  },
  google: {
    label: "Google Ads",
    formatoSugerido: "paisagem",
    guia: "Display/PMax. Headline curta e direta, benefício imediato, pouco texto na arte.",
  },
  tiktok: {
    label: "TikTok Ads",
    formatoSugerido: "story",
    guia: "Vertical 9:16, estética nativa/UGC, casual e autêntica, texto grande e legível no mobile.",
  },
  whatsapp: {
    label: "Disparo WhatsApp",
    formatoSugerido: "feed-quadrado",
    guia: "Imagem + mensagem de disparo. Tom pessoal e direto, oferta clara, 1 CTA (responder/clicar). Gere também o texto da mensagem de disparo.",
  },
};

/** O briefing rápido que o usuário preenche no Estúdio. */
export interface BriefingInput {
  marcaId: string;
  objetivo: string; // vendas, reconhecimento, leads...
  oferta: string; // promoção / oferta principal
  angulo: string; // gancho / ângulo criativo
  dorQueResolve: string; // dor concreta que o produto resolve
  persona: string; // avatar/persona específica deste criativo
  formato: FormatoCriativo; // formato "principal" — sempre geramos também o complementar
  instrucoesImagem: string; // direcionamento visual extra
  usarReferencias: string[]; // ids de referências usadas como base visual
}

export interface CopyGerada {
  headline: string;
  textoPrimario: string;
  descricao: string;
  cta: string;
  variacoes: { headline: string; textoPrimario: string }[];
}

export interface BriefingEstruturado {
  conceito: string;
  publico: string;
  mensagemPrincipal: string;
  elementosVisuais: string[];
  tom: string;
  observacoes: string;
}

/** Um criativo "criado do zero" e salvo no histórico (copy + briefing + direção visual). */
export interface ImagemFormato {
  formato: FormatoCriativo;
  url: string;
}

export interface Criativo {
  id: string;
  marcaId: string;
  marcaNome: string;
  briefing: BriefingInput;
  copy: CopyGerada;
  briefingEstruturado: BriefingEstruturado;
  direcaoVisual: string; // direção visual pro designer
  /** Galeria com os 2 formatos (feed-quadrado + story). Vazia se Gemini off. */
  imagens: ImagemFormato[];
  /** @deprecated mantido pra retrocompatibilidade do histórico antigo. */
  imagemUrl?: string;
  criadoEm: string;
}

// ---------- Análise de criativo de referência ----------

export interface TextoExtraido {
  headline: string;
  body: string;
  cta: string;
  /** Tradução para PT-BR quando o original estiver em outro idioma. */
  traducao?: string;
}

export interface CriterioNota {
  chave: string;
  label: string;
  nota: number;
  max: number;
  comentario: string;
}

export interface AnaliseEstruturada {
  objetivo: string;
  anguloPrincipal: string;
  pontoForte: string;
  melhoria: string;
  resumo: string;
}

export type TipoMidia = "imagem" | "dr-video" | "ugc-video";

export const TIPOS_MIDIA: Record<TipoMidia, { label: string; icone: string }> = {
  imagem: { label: "Imagem", icone: "🖼️" },
  "dr-video": { label: "DR Video", icone: "🎬" },
  "ugc-video": { label: "UGC Video", icone: "📱" },
};

/** Resultado da leitura de um anúncio estático de referência. */
export interface Analise {
  id: string;
  codigo: string; // ex: INS-JUN-44 (gerado)
  marcaId?: string;
  tipoMidia: TipoMidia;
  imagemRefUrl: string; // referência (imagem ou thumbnail/frame de vídeo)
  videoRefUrl?: string; // vídeo original (quando tipoMidia != imagem)
  textoExtraido: TextoExtraido;
  funil: Funil;
  funilJustificativa?: string; // por que o modelo escolheu essa etapa
  nivelConsciencia: NivelConsciencia;
  angulos: Angulo[];
  analise: AnaliseEstruturada;
  score: number; // 0-100
  scoreLabel: ScoreLabel;
  scoreBreakdown: CriterioNota[];
  validado: "sim" | "nao" | null;
  criadoEm: string;
}

// ---------- Recriação a partir de uma análise ----------

export type ModoRecriacao = "clonar" | "inspirar";

/** Tudo que define COMO recriar (destino, objetivo, oferta e ajustes). */
export interface OpcoesRecriacao {
  modo: ModoRecriacao;
  formato: FormatoCriativo;
  canal: Canal;
  objetivo: string;
  cupom?: string; // ex: "DRY10 — 10% OFF"
  ajustes?: string; // o que mudar pra ficar mais intencional
}

export interface ProdutoInfo {
  url?: string;
  titulo: string;
  descricao: string;
  imagemUrl?: string; // imagem do produto (scrape ou upload)
}

export interface Recriacao {
  id: string;
  analiseId: string;
  marcaId?: string;
  marcaNome?: string;
  modo: ModoRecriacao;
  formato: FormatoCriativo;
  canal: Canal;
  objetivo: string;
  cupom?: string;
  ajustes?: string;
  /** Agrupa variações geradas no mesmo turno (todas têm o mesmo id). */
  grupoVariacao?: string;
  /** Rótulo A/B/C... pra identificar a variação no grupo. */
  variacaoRotulo?: string;
  /** Dimensão alterada nesta variação (ex: "Cenário", "Headline focado em dor"). */
  variacaoDimensao?: string;
  produto: ProdutoInfo;
  /** Galeria com os 2 formatos (feed-quadrado + story). Vazia se Gemini off. */
  imagens: ImagemFormato[];
  /** @deprecated mantido pra retrocompatibilidade do histórico antigo. */
  imagemUrl?: string;
  direcaoVisual: string; // direção visual pro designer / geração de imagem
  copy: CopyGerada;
  briefDesigner: string; // instruções pro designer executar
  mensagemDisparo?: string; // texto do disparo (quando canal = whatsapp)
  criadoEm: string;
}
