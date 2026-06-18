// Seeds das marcas padrão. Servem como ponto de partida — você edita depois.
// O objetivo é ter um esqueleto razoável pra IA já ter contexto na primeira geração.
import type { Marca } from "./types";

export type MarcaSeed = Omit<
  Marca,
  "id" | "criadoEm" | "atualizadoEm" | "referencias"
>;

export const MARCAS_SEED: MarcaSeed[] = [
  {
    nome: "Dry Skin",
    produto: "DryWhite — gel clareador e fortalecedor de gengivas",
    descricao:
      "Linha de cuidado oral focada em clareamento dental seguro e saúde gengival. Posicionamento premium acessível, fórmula avançada de uso diário.",
    tomDeVoz:
      "Próximo, confiante e direto. Fala como uma amiga que entende do assunto — sem jargão técnico, sem promessas absurdas. Reforça segurança e resultado real.",
    publicoAlvo:
      "Adultos 25–45 que se importam com a aparência do sorriso e com saúde gengival. Compram online, valorizam reviews e antes/depois. Sensíveis a preço, mas pagam por qualidade comprovada.",
    identidadeVisual:
      "Estética clean, médica-premium. Branco off, azul-claro suave, dourado pálido como acento. Embalagens minimalistas. Tipografia sans-serif moderna. Iluminação clara, fundo neutro.",
    diferenciais:
      "Fórmula sem peróxido agressivo. Fortalece a gengiva ao clarear. Resultado visível em até 7 dias. Produto vendido direto, sem intermediários.",
    dores:
      "• Dentes amarelados que tiram a vontade de sorrir em fotos\n• Gengiva sensível, sangrando ao escovar\n• Mau hálito que afasta no relacionamento e no trabalho\n• Já tentaram clareamento e a gengiva piorou\n• Vergonha de mostrar os dentes em situações sociais",
    desejos:
      "• Sorriso branco natural, sem 'cara de TV'\n• Confiança pra sorrir aberto em fotos e reuniões\n• Resultado em casa, sem precisar ir ao dentista\n• Algo que não machuque a gengiva\n• Sentir-se cuidando da saúde, não só da estética",
    paletaCores:
      "Primária: #E8F4F8 (azul-claro lavado). Secundária: #FFFFFF e #F5F1EA (off-white). Acento: #B8956A (dourado pálido) e #2C5F7C (azul-petróleo). NUNCA usar amarelo neon, vermelho saturado ou roxo.",
    linhaProdutos:
      "DryWhite (gel clareador 50ml), DryWhite Powder (pó clareador 50g), DryWhite Rinse (enxaguante 250ml), Kit Clareamento Profissional (gel + pó + escova + estojo).",
    proibicoes:
      "• Nunca mostrar dentes com aparência artificial ou Photoshop exagerado\n• Nunca usar paleta neon, fluor ou cores saturadas berrantes\n• Não usar imagens médicas chocantes (sangue, ferida)\n• Não prometer 'clareamento instantâneo' ou '10 tons em 1 dia'\n• Não competir por preço de fundo de mercado — posicionamento premium",
  },
  {
    nome: "Nouê",
    produto: "Nouê Castanho Dourado — cobertura de fios brancos sem amônia",
    descricao:
      "Linha de coloração capilar focada em mulheres 35+ que querem cobrir os brancos com naturalidade. Sem amônia, sem agredir o fio. Resultado profissional em casa.",
    tomDeVoz:
      "Acolhedor, validador, sem julgamento. Fala como uma amiga que passou pelo mesmo. Celebra a beleza madura sem esconder a realidade. Direta, mas com afeto.",
    publicoAlvo:
      "Mulheres 35–55 com fios brancos em fase de mudança de cabelo. Buscam praticidade (resultado em casa) sem abrir mão da qualidade salão. Valorizam ingredientes que não agridem.",
    identidadeVisual:
      "Estética warm, editorial, cinematográfica. Tons terrosos: castanho dourado, caramelo, cobre, off-white quente. Fotografia natural com luz dourada (golden hour). Modelos reais, sorriso genuíno, antes/depois.",
    diferenciais:
      "Sem amônia. Cobre 100% dos brancos. Até 10 lavagens. 90% natural. Aplicação simples em 30 minutos. Aroma agradável (não tem cheiro de tinta).",
    dores:
      "• Brancos surgindo aos 30+ — sentimento de envelhecer rápido demais\n• Cabelo ressecado e quebradiço por colorações antigas com amônia\n• Salão custa caro e demora — não dá pra ir toda semana\n• Coloração de farmácia comum dá cor 'falsa' e estraga o fio\n• Vergonha do espelho na hora de se arrumar pra sair",
    desejos:
      "• Voltar a se reconhecer no espelho\n• Cabelo natural, brilhante, com vida\n• Receber elogios genuínos ('que cabelo lindo!')\n• Fazer em casa, no seu tempo, sem depender de salão\n• Sentir-se bonita E saudável ao mesmo tempo",
    paletaCores:
      "Primária: #8B5A3C (castanho dourado). Secundária: #F4E8D5 (creme quente). Acento: #C9A77E (caramelo) e #2D1810 (marrom escuro). NUNCA usar tons frios (azul, prata, cinza saturado).",
    linhaProdutos:
      "Nouê Castanho Dourado, Nouê Loiro Mel, Nouê Acaju, Nouê Preto Natural, Nouê Máscara de Tratamento (uso entre colorações), Nouê Shampoo Pós-Coloração.",
    proibicoes:
      "• Nunca mostrar mulher infeliz com a idade ou 'antes' depressivo demais\n• Nunca usar paleta fria ou cinza saturado\n• Não chamar a cliente de 'vovó', 'senhora' ou marcar a idade negativamente\n• Não prometer 'cabelo de 20 anos' — celebrar a beleza madura\n• Não usar fotos genéricas de banco de imagens — sempre real, natural",
  },
];
