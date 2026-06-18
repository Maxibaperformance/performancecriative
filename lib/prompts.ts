// Prompts e parsers compartilhados entre os provedores de IA (Claude e Gemini).
// Fonte única — assim os dois provedores geram exatamente o mesmo formato.
import type {
  Marca,
  BriefingInput,
  CopyGerada,
  BriefingEstruturado,
  Analise,
  CriterioNota,
  ProdutoInfo,
  OpcoesRecriacao,
} from "./types";
import { FORMATOS, CANAIS } from "./types";
import {
  RUBRICA,
  NOTA_MAXIMA,
  labelDaNota,
  FUNIL,
  NIVEIS,
  ANGULOS,
} from "./taxonomia";

export type AnaliseIA = Omit<
  Analise,
  | "id"
  | "codigo"
  | "imagemRefUrl"
  | "videoRefUrl"
  | "tipoMidia"
  | "validado"
  | "criadoEm"
>;

export interface ConteudoRecriacao {
  copy: CopyGerada;
  briefDesigner: string;
  direcaoVisual: string; // rica, pro designer/brief
  promptImagem: string; // ENXUTO, puramente visual, pro Gemini Image
  mensagemDisparo: string; // texto pronto do disparo (vazio se canal ≠ whatsapp)
  /** Dimensão alterada nesta variação (preenchida só quando N>1). */
  variacaoDimensao?: string;
}

export interface ConteudoVariacoes {
  /** N variações da mesma recriação, cada uma com uma dimensão alterada. */
  variacoes: ConteudoRecriacao[];
}

export interface ConteudoTextual {
  copy: CopyGerada;
  briefingEstruturado: BriefingEstruturado;
  direcaoVisual: string;
}

export function limparJson(texto: string): string {
  const m = texto.match(/\{[\s\S]*\}/);
  return (m ? m[0] : texto).trim();
}

function contextoMarca(marca: Marca): string {
  const partes: string[] = [
    "CONTEXTO DA MARCA (siga rigorosamente):",
    `- Marca: ${marca.nome}`,
    `- Produto principal: ${marca.produto}`,
    `- Descrição: ${marca.descricao}`,
    `- Tom de voz: ${marca.tomDeVoz}`,
    `- Público-alvo: ${marca.publicoAlvo}`,
    `- Identidade visual: ${marca.identidadeVisual}`,
    `- Diferenciais: ${marca.diferenciais}`,
  ];
  if (marca.dores) partes.push(`- DORES do público:\n${marca.dores}`);
  if (marca.desejos) partes.push(`- DESEJOS do público:\n${marca.desejos}`);
  if (marca.linhaProdutos)
    partes.push(`- Linha completa de produtos: ${marca.linhaProdutos}`);
  if (marca.paletaCores)
    partes.push(`- PALETA DE CORES da marca: ${marca.paletaCores}`);
  if (marca.proibicoes)
    partes.push(`- PROIBIÇÕES (NUNCA fazer):\n${marca.proibicoes}`);
  return partes.join("\n");
}

function rubricaTexto(): string {
  return RUBRICA.map(
    (c) => `- ${c.chave} (máx ${c.max}): ${c.label}. ${c.descricao}`
  ).join("\n");
}

// ---------- Análise ----------

function detalheFunil(): string {
  return (Object.keys(FUNIL) as Array<keyof typeof FUNIL>)
    .map((k) => {
      const f = FUNIL[k];
      return `
[${k}] ${f.label.toUpperCase()} — ${f.descricao}
  Sinais que CONFIRMAM "${k}":
${f.sinais.map((s) => `    • ${s}`).join("\n")}
  Se o criativo tem ${f.evitar.join(", ")} → NÃO é ${k}.`;
    })
    .join("\n");
}

export function promptAnalise(marca?: Marca | null): string {
  const ctx = marca
    ? `\nA marca de destino é "${marca.nome}". Considere o público: ${marca.publicoAlvo || "—"}.`
    : "";

  return `
Você é um estrategista de performance sênior (Meta Ads). Analise a IMAGEM de anúncio estático fornecida.${ctx}

═══════════════════════════════════════════
CLASSIFICAÇÃO DE FUNIL — SEJA ASSERTIVO
═══════════════════════════════════════════
Use SEMPRE estes critérios detalhados. NÃO classifique tudo como "fundo" por padrão. A maioria dos criativos não é fundo — fundo é especificamente DECISÃO DE COMPRA, com preço/oferta visível.
${detalheFunil()}

REGRA DE DESEMPATE: liste mentalmente os sinais que você vê na imagem. Se 2+ sinais batem com "topo" → topo. Se 2+ batem com "meio" → meio. Só classifique como "fundo" se houver evidência clara de OFERTA/PREÇO/CTA DE COMPRA na imagem. Justifique no campo "funilJustificativa" QUAIS sinais visuais te levaram à classificação.

═══════════════════════════════════════════
NÍVEL DE CONSCIÊNCIA (Schwartz) — escolha um
═══════════════════════════════════════════
${Object.keys(NIVEIS).map((k) => `- ${k}: ${NIVEIS[k as keyof typeof NIVEIS]}`).join("\n")}

ÂNGULOS — escolha um ou mais de:
${Object.entries(ANGULOS).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

═══════════════════════════════════════════
RUBRICA DE PERFORMANCE (pontue de 0 ao máximo de cada item)
═══════════════════════════════════════════
${rubricaTexto()}

Responda APENAS com JSON válido (sem markdown, sem texto antes ou depois), neste formato:
{
  "textoExtraido": {
    "headline": "headline lido na imagem",
    "body": "texto/body lido",
    "cta": "CTA lido",
    "traducao": "se estiver em outro idioma, tradução PT-BR; senão string vazia"
  },
  "funil": "topo|meio|fundo",
  "funilJustificativa": "1 frase: quais sinais VISÍVEIS te levaram a essa etapa do funil",
  "nivelConsciencia": "N1|N2|N3|N4|N5",
  "angulos": ["dor"],
  "analise": {
    "objetivo": "qual o objetivo do criativo",
    "anguloPrincipal": "o ângulo dominante e por quê",
    "pontoForte": "o que está bom",
    "melhoria": "o que melhoraria a performance",
    "resumo": "1-2 frases resumindo o criativo (como um parecer)"
  },
  "criterios": [
    ${RUBRICA.map((c) => `{ "chave": "${c.chave}", "nota": 0, "comentario": "curto" }`).join(",\n    ")}
  ]
}

Escreva tudo em português brasileiro.`.trim();
}

export function montarAnaliseIA(rawText: string): AnaliseIA {
  let raw: {
    textoExtraido: AnaliseIA["textoExtraido"];
    funil: AnaliseIA["funil"];
    funilJustificativa?: string;
    nivelConsciencia: AnaliseIA["nivelConsciencia"];
    angulos: AnaliseIA["angulos"];
    analise: AnaliseIA["analise"];
    criterios: { chave: string; nota: number; comentario: string }[];
  };
  try {
    raw = JSON.parse(limparJson(rawText));
  } catch {
    throw new Error("Não consegui interpretar a análise (JSON inválido).");
  }

  const scoreBreakdown: CriterioNota[] = RUBRICA.map((c) => {
    const achado = raw.criterios?.find((x) => x.chave === c.chave);
    const nota = Math.max(0, Math.min(c.max, Math.round(achado?.nota ?? 0)));
    return {
      chave: c.chave,
      label: c.label,
      max: c.max,
      nota,
      comentario: achado?.comentario ?? "",
    };
  });

  const score = Math.min(
    NOTA_MAXIMA,
    scoreBreakdown.reduce((s, c) => s + c.nota, 0)
  );

  return {
    textoExtraido: raw.textoExtraido,
    funil: raw.funil,
    funilJustificativa: raw.funilJustificativa,
    nivelConsciencia: raw.nivelConsciencia,
    angulos: raw.angulos ?? [],
    analise: raw.analise,
    scoreBreakdown,
    score,
    scoreLabel: labelDaNota(score),
  };
}

// ---------- Recriação ----------

export function promptRecriacao(
  analise: Analise,
  produto: ProdutoInfo,
  opcoes: OpcoesRecriacao,
  marca?: Marca | null
): string {
  const { modo, formato, canal, objetivo, cupom, ajustes } = opcoes;
  const fmt = FORMATOS[formato];
  const canalInfo = CANAIS[canal];

  const instrucaoModo =
    modo === "clonar"
      ? "CLONE a estrutura, composição e layout do criativo de referência, trocando produto, marca e copy pelos do meu produto."
      : "INSPIRE-SE no ângulo, conceito e nível de consciência da referência, mas proponha uma arte NOVA na identidade da minha marca.";

  const ctxMarca = marca
    ? `\nMARCA: ${marca.nome}. Tom de voz: ${marca.tomDeVoz || "—"}. Identidade visual: ${marca.identidadeVisual || "—"}. Público: ${marca.publicoAlvo || "—"}.`
    : "";

  const blocoCupom = cupom
    ? `\nCUPOM/OFERTA (destaque na copy E na arte): ${cupom}`
    : "";
  const blocoAjustes = ajustes
    ? `\nAJUSTES PEDIDOS (aplique fielmente, deixe o criativo mais intencional): ${ajustes}`
    : "";
  const ehWhatsapp = canal === "whatsapp";

  return `
Você é diretor de criação de performance. Vou recriar um anúncio de referência aplicando o MEU produto. O resultado serve para DOIS fins: (1) um criativo rápido pronto pra usar e (2) uma referência clara pro designer entender o que extraímos e o que queremos.

REFERÊNCIA ANALISADA:
- Funil: ${FUNIL[analise.funil].label} | Nível de consciência: ${analise.nivelConsciencia} (${NIVEIS[analise.nivelConsciencia]})
- Ângulos: ${analise.angulos.map((a) => ANGULOS[a]).join(", ")}
- Headline ref: ${analise.textoExtraido.headline}
- Body ref: ${analise.textoExtraido.body}
- Conceito: ${analise.analise.anguloPrincipal}

MEU PRODUTO:
- Título: ${produto.titulo || "—"}
- Descrição: ${produto.descricao || "—"}${ctxMarca}

DESTINO E INTENÇÃO:
- Canal: ${canalInfo.label} — ${canalInfo.guia}
- Objetivo: ${objetivo}${blocoCupom}${blocoAjustes}

MODO: ${instrucaoModo}
Mantenha o mesmo nível de consciência (${analise.nivelConsciencia}) e ângulo da referência, mas adapte a copy e o visual ao canal e ao objetivo acima.
Formato final: ${fmt.label} (${fmt.ratio}).

Responda APENAS com JSON válido (sem markdown, sem texto antes ou depois):
{
  "copy": {
    "headline": "...", "textoPrimario": "...", "descricao": "...", "cta": "...",
    "variacoes": [ { "headline": "...", "textoPrimario": "..." } ]
  },
  "briefDesigner": "Briefing objetivo pro designer executar a arte, em tópicos. INCLUA: canal de destino, objetivo, formato, ${cupom ? "cupom/oferta a destacar, " : ""}o que manter da referência, onde entra o produto, hierarquia visual, cores, qual headline vai na arte${ajustes ? ", e os ajustes pedidos" : ""}, e a intenção de performance.",
  "direcaoVisual": "Descrição visual rica e detalhada PARA O DESIGNER LER E EXECUTAR: cenário, produto em destaque, estilo, cores (identidade da marca), composição, hierarquia, e onde deixar espaço para texto.",
  "promptImagem": "ENXUTO E VISUAL — máx 100 palavras. Frase descritiva direta pra gerador de imagem por IA. SOMENTE elementos visíveis (cenário, produto, modelo, iluminação, composição). OBRIGATÓRIO citar a PALETA DE CORES da marca acima (use os hex/nomes literais — ex: 'fundo creme #F4E8D5, acento castanho dourado #8B5A3C'). CITAR o produto pelo nome real da linha (use a Linha de Produtos da marca${cupom ? ", e incluir selo do cupom" : ""}). RESPEITAR as PROIBIÇÕES da marca (não usar nada listado lá). NÃO mencione canal, objetivo, performance. NÃO inclua texto/headline na arte além do essencial. Tom: descrição de fotografia/ilustração, não de estratégia.",
  "mensagemDisparo": "${ehWhatsapp ? "Texto pronto da mensagem de disparo no WhatsApp: pessoal e direto, com a oferta/cupom e 1 CTA claro (responder/clicar)." : "string vazia (canal não é WhatsApp)"}"
}

Tudo em português brasileiro.`.trim();
}

export function parseConteudoRecriacao(rawText: string): ConteudoRecriacao {
  try {
    return JSON.parse(limparJson(rawText)) as ConteudoRecriacao;
  } catch {
    throw new Error("Não consegui interpretar a recriação (JSON inválido).");
  }
}

const DIMENSOES_VARIACAO = [
  "CENÁRIO/BACKGROUND — mude o ambiente (estúdio clean, casa real, externo natural, etc) mantendo produto e oferta",
  "MODELO/PESSOA — mude quem aparece (gênero, idade, expressão) mantendo produto e oferta",
  "ÂNGULO DO HOOK — mude qual aspecto da DOR a copy ataca (use uma dor diferente da mesma persona)",
  "HIERARQUIA VISUAL — mude o que é o herói da arte (produto em destaque vs benefício em texto vs antes/depois)",
  "ÊNFASE NA OFERTA — alterne entre cupom em destaque grande vs cupom discreto com benefício em foco",
];

export function promptRecriacaoVariacoes(
  analise: Analise,
  produto: ProdutoInfo,
  opcoes: OpcoesRecriacao,
  marca: Marca | null | undefined,
  quantidade: number
): string {
  const base = promptRecriacao(analise, produto, opcoes, marca);
  const dims = DIMENSOES_VARIACAO.slice(0, quantidade)
    .map((d, i) => `Variação ${String.fromCharCode(65 + i)}: ${d}`)
    .join("\n");

  const itemSchema = `{
    "variacaoDimensao": "qual dimensão você alterou nesta variação (1 frase curta, ex: 'Cenário: externo natural' )",
    "copy": { "headline": "...", "textoPrimario": "...", "descricao": "...", "cta": "...", "variacoes": [] },
    "briefDesigner": "briefing pro designer (igual ao do prompt único)",
    "direcaoVisual": "descrição visual rica pro designer/IA",
    "promptImagem": "ENXUTO E VISUAL, máx 100 palavras, com paleta da marca",
    "mensagemDisparo": "se canal WhatsApp, mensagem pronta; senão string vazia"
  }`;

  return `${base}

═══════════════════════════════════════════
GERE ${quantidade} VARIAÇÕES DIFERENTES — cada uma alterando UMA dimensão
═══════════════════════════════════════════
Você precisa gerar ${quantidade} versões distintas pra testar A/B/C... Cada variação muda APENAS UMA dimensão da lista abaixo, mantendo o resto consistente (marca, produto, paleta, oferta básica):

${dims}

REGRAS:
- Variações DEVEM ser visivelmente diferentes — não façam apenas mudanças cosméticas
- Cada variação mantém o nível de consciência (${analise.nivelConsciencia}) e a marca
- A oferta/cupom (se houver) aparece em TODAS, mas a ênfase pode variar conforme a dimensão
- Em "ÂNGULO DO HOOK", cada variação ataca uma dor DIFERENTE da persona (busca a dor que ressoa mais)

Responda APENAS com JSON válido neste formato exato (sem markdown):
{
  "variacoes": [
    ${itemSchema},
    ${itemSchema}${quantidade > 2 ? `,\n    ${itemSchema}` : ""}${quantidade > 3 ? `,\n    ${itemSchema}` : ""}${quantidade > 4 ? `,\n    ${itemSchema}` : ""}
  ]
}

São EXATAMENTE ${quantidade} itens no array variacoes. Tudo em português brasileiro.`;
}

export function parseConteudoVariacoes(rawText: string): ConteudoVariacoes {
  try {
    return JSON.parse(limparJson(rawText)) as ConteudoVariacoes;
  } catch {
    throw new Error("Não consegui interpretar as variações (JSON inválido).");
  }
}

// ---------- Criar do zero ----------

export function promptConteudoTextual(
  marca: Marca,
  briefing: BriefingInput
): string {
  const formato = FORMATOS[briefing.formato];
  const dor = briefing.dorQueResolve?.trim();
  const persona = briefing.persona?.trim();

  return `
Você é um diretor de criação sênior de performance (Meta Ads / Instagram / Facebook).

${contextoMarca(marca)}

BRIEFING DESTE CRIATIVO:
- Objetivo: ${briefing.objetivo}
- Oferta / promoção: ${briefing.oferta}
- Ângulo / gancho: ${briefing.angulo}
${dor ? `- DOR específica que o produto resolve: ${dor}` : "- Dor: (não informada — derive da descrição do produto)"}
${persona ? `- PERSONA / avatar específico deste criativo: ${persona}` : "- Persona: usar o público-alvo da marca acima"}
- Formato principal: ${formato.label} (${formato.ratio})
- Direcionamento visual extra: ${briefing.instrucoesImagem || "nenhum"}

IMPORTANTE: a copy precisa ATACAR A DOR (não falar do produto antes de a dor doer). A persona precisa se ver no criativo (nome, idade, contexto, momento de vida quando informado).

Responda APENAS com JSON válido (sem markdown, sem texto antes ou depois):
{
  "copy": {
    "headline": "título curto e forte, conectado à dor",
    "textoPrimario": "texto persuasivo: 1ª linha = gancho da DOR; meio = como o produto resolve; fim = CTA",
    "descricao": "linha de descrição curta",
    "cta": "chamada para ação curta",
    "variacoes": [ { "headline": "var A", "textoPrimario": "var A" } ]
  },
  "briefingEstruturado": {
    "conceito": "ideia central em 1 frase",
    "publico": "para quem é (use a persona se foi dada)",
    "mensagemPrincipal": "o que precisa ficar claro",
    "elementosVisuais": ["elemento 1", "elemento 2"],
    "tom": "tom da comunicação",
    "observacoes": "dica de execução pro designer"
  },
  "direcaoVisual": "descrição visual rica e detalhada pro designer/IA executar. OBRIGATÓRIO: cite a PALETA de cores da marca (hex/nomes literais) e cite o produto pelo nome real da linha. RESPEITE as proibições."
}

Tudo em português brasileiro, no tom de voz da marca.`.trim();
}

export function parseConteudoTextual(rawText: string): ConteudoTextual {
  try {
    return JSON.parse(limparJson(rawText)) as ConteudoTextual;
  } catch {
    throw new Error("Não consegui interpretar o conteúdo (JSON inválido).");
  }
}
