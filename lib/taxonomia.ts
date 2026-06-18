// Taxonomia de classificação e rubrica de performance.
// Fonte única da verdade — usada no prompt do Gemini e na UI. Edite aqui pra
// calibrar a "lógica de performance".

export type Funil = "topo" | "meio" | "fundo";
export type NivelConsciencia = "N1" | "N2" | "N3" | "N4" | "N5";
export type Angulo =
  | "dor"
  | "quebra-objecao"
  | "prova-social"
  | "beneficio"
  | "autoridade"
  | "antes-depois"
  | "escassez-oferta"
  | "educativo";

interface InfoFunil {
  label: string;
  cor: string;
  /** Resumo do que define essa etapa do funil. */
  descricao: string;
  /** Sinais VISÍVEIS no criativo que indicam essa etapa. */
  sinais: string[];
  /** O que NÃO deve aparecer (sinal contrário). */
  evitar: string[];
}

export const FUNIL: Record<Funil, InfoFunil> = {
  topo: {
    label: "Topo",
    cor: "#7c5cff",
    descricao:
      "DESCOBERTA / Conscientização. Público ainda NÃO sabe que tem o problema, ou nunca ouviu falar da marca. Foco em GERAR ATENÇÃO e expor o problema/dor de forma identificável. Não vende, não fala da marca específica como solução.",
    sinais: [
      "Não há preço, oferta, cupom ou desconto",
      "Sem CTA de compra direto (no máximo 'saiba mais' / 'descubra')",
      "Pergunta retórica que faz pensar (ex: 'você sabia que...?')",
      "Foco no PROBLEMA/DOR, sem apresentar uma solução específica",
      "Linguagem ampla, identificável, educativa",
      "Sem logo da marca em destaque (ou muito sutil)",
      "Pode ter dado / estatística surpreendente para chocar",
    ],
    evitar: ["preço", "oferta", "cupom", "compre", "antes/depois com produto"],
  },
  meio: {
    label: "Meio",
    cor: "#c44bff",
    descricao:
      "CONSIDERAÇÃO. Público JÁ SABE da dor e está pesquisando soluções. Apresenta a CATEGORIA do produto, o mecanismo (como funciona), prova social, autoridade, comparação. Ainda não força a venda — convence racionalmente.",
    sinais: [
      "Explica COMO funciona ou o mecanismo do produto",
      "Comparação com alternativas / categorias",
      "Depoimento / review de cliente",
      "Selo de autoridade (médico, especialista, prêmio)",
      "Demonstração de uso, ingredientes, tecnologia",
      "CTA do tipo 'saiba mais', 'descubra', 'baixe o e-book'",
      "Educativo sobre a SOLUÇÃO (não só sobre o problema)",
    ],
    evitar: ["desconto agressivo", "escassez forte", "urgência", "'compre agora'"],
  },
  fundo: {
    label: "Fundo",
    cor: "#2dd4a7",
    descricao:
      "DECISÃO / Conversão. Público QUER COMPRAR e está escolhendo de quem. Oferta direta, preço, desconto, cupom, urgência, escassez, garantia, CTA explícito de compra. Foco em REMOVER ÚLTIMAS OBJEÇÕES e fechar.",
    sinais: [
      "Preço, desconto ou cupom em destaque visível",
      "Urgência / escassez ('últimas unidades', 'só hoje', timer)",
      "CTA direto: 'Compre agora', 'Garanta o seu', 'Resgate'",
      "Antes/depois COM o produto específico",
      "Garantia, frete grátis, parcelamento, satisfação",
      "Foco na MARCA/produto específico (logo em destaque)",
      "Selos: 'mais vendido', 'aprovado', '5 estrelas'",
    ],
    evitar: ["abordagem educativa sem oferta", "produto genérico sem marca"],
  },
};

export const NIVEIS: Record<NivelConsciencia, string> = {
  N1: "Inconsciente",
  N2: "Consciente do problema",
  N3: "Consciente da solução",
  N4: "Consciente do produto",
  N5: "Mais consciente",
};

export const ANGULOS: Record<Angulo, string> = {
  dor: "Dor",
  "quebra-objecao": "Quebra de objeção",
  "prova-social": "Prova social",
  beneficio: "Benefício / Desejo",
  autoridade: "Autoridade",
  "antes-depois": "Antes / Depois",
  "escassez-oferta": "Escassez / Oferta",
  educativo: "Educativo / Mecanismo",
};

// ---------- Rubrica de performance (nota 0–100) ----------

export interface CriterioRubrica {
  chave: string;
  label: string;
  max: number;
  descricao: string;
}

export const RUBRICA: CriterioRubrica[] = [
  {
    chave: "hook",
    label: "Hook / Scroll-stop",
    max: 25,
    descricao: "A imagem para o scroll? Contraste, rosto, tensão visual, curiosidade.",
  },
  {
    chave: "clareza",
    label: "Clareza da mensagem",
    max: 20,
    descricao: "Dá pra entender o benefício/oferta em menos de 3 segundos?",
  },
  {
    chave: "anguloFunil",
    label: "Ângulo + fit de funil",
    max: 20,
    descricao: "O ângulo está certo para o nível de consciência e etapa de funil?",
  },
  {
    chave: "copyCta",
    label: "Copy & CTA",
    max: 15,
    descricao: "Headline forte e CTA explícito.",
  },
  {
    chave: "visual",
    label: "Qualidade visual / marca",
    max: 10,
    descricao: "Hierarquia, legibilidade e identidade visual.",
  },
  {
    chave: "escala",
    label: "Potencial de escala",
    max: 10,
    descricao: "Amplo o suficiente para escalar audiência.",
  },
];

export const NOTA_MAXIMA = RUBRICA.reduce((s, c) => s + c.max, 0); // 100

export type ScoreLabel = "BAIXO" | "MÉDIO" | "ALTO";

export function labelDaNota(nota: number): ScoreLabel {
  if (nota >= 75) return "ALTO";
  if (nota >= 50) return "MÉDIO";
  return "BAIXO";
}
