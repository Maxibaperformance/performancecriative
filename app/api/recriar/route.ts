import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  obterAnalise,
  obterMarca,
  lerArquivoPublicoBase64,
  salvarUploadDataUrl,
  baixarImagemParaUploads,
  salvarImagemCriativo,
  salvarRecriacao,
} from "@/lib/store";
import { gerarConteudoRecriacao, gerarConteudoVariacoes } from "@/lib/ai";
import {
  gerarImagemCriativo,
  imagemHabilitada,
  type ReferenciaVisual,
} from "@/lib/geminiImage";
import { lerProduto } from "@/lib/scrape";
import { FORMATOS, FORMATOS_PADRAO, CANAIS } from "@/lib/types";
import type {
  Marca,
  ProdutoInfo,
  ModoRecriacao,
  FormatoCriativo,
  Canal,
  OpcoesRecriacao,
  ImagemFormato,
  Recriacao,
} from "@/lib/types";
import type { ConteudoRecriacao } from "@/lib/prompts";

// Variações em lote → muitas chamadas paralelas. 180s pra acomodar 3-5 variações.
export const maxDuration = 180;

const MAX_VARIACOES = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const analiseId: string = body.analiseId;
    const modo: ModoRecriacao = body.modo === "inspirar" ? "inspirar" : "clonar";
    const canal: Canal = (body.canal as Canal) in CANAIS ? body.canal : "meta";
    const formato: FormatoCriativo =
      body.formato ?? CANAIS[canal].formatoSugerido;
    const objetivo: string = body.objetivo || "Vendas";
    const cupom: string | undefined = body.cupom?.trim() || undefined;
    const ajustes: string | undefined = body.ajustes?.trim() || undefined;
    const quantidadeVariacoes = Math.max(
      1,
      Math.min(MAX_VARIACOES, Number(body.quantidadeVariacoes) || 1)
    );
    const opcoes: OpcoesRecriacao = {
      modo,
      formato,
      canal,
      objetivo,
      cupom,
      ajustes,
    };

    const analise = await obterAnalise(analiseId);
    if (!analise) {
      return NextResponse.json({ erro: "Análise não encontrada" }, { status: 404 });
    }

    const marcaId = body.marcaId || analise.marcaId;
    if (!marcaId) {
      return NextResponse.json(
        {
          erro: "Selecione uma marca antes de recriar — o contexto da marca é necessário pra ancorar paleta, linha de produtos e proibições.",
        },
        { status: 400 }
      );
    }
    const marca = await obterMarca(marcaId);
    if (!marca) {
      return NextResponse.json({ erro: "Marca não encontrada" }, { status: 404 });
    }

    // 1) Resolve produto (URL automática + manual).
    const produto = await resolverProduto(body.produto ?? {});

    // 2) IA: gera 1 ou N conteúdos.
    const conteudos: ConteudoRecriacao[] =
      quantidadeVariacoes === 1
        ? [await gerarConteudoRecriacao(analise, produto, opcoes, marca)]
        : (await gerarConteudoVariacoes(
            analise,
            produto,
            opcoes,
            marca,
            quantidadeVariacoes
          )).variacoes.slice(0, quantidadeVariacoes);

    // 3) Referências comuns a todas as variações.
    const referencias = imagemHabilitada()
      ? await montarReferencias(modo, analise.imagemRefUrl, produto, marca)
      : [];

    // 4) Pra CADA conteúdo, gera 2 imagens em paralelo (todas em paralelo entre si).
    const grupoVariacao = quantidadeVariacoes > 1 ? randomUUID() : undefined;
    const recriacoes: Recriacao[] = [];

    // Lança todas as gerações de imagem em paralelo.
    const trabalhos = conteudos.map((conteudo, idx) =>
      gerarImagensParaConteudo(conteudo, referencias, modo, marca)
        .then(async (imagens) => {
          const recriacao = await salvarRecriacao({
            analiseId,
            marcaId: marca.id,
            marcaNome: marca.nome,
            modo,
            formato,
            canal,
            objetivo,
            cupom,
            ajustes,
            grupoVariacao,
            variacaoRotulo: quantidadeVariacoes > 1
              ? String.fromCharCode(65 + idx)
              : undefined,
            variacaoDimensao: conteudo.variacaoDimensao,
            produto,
            imagens,
            imagemUrl: imagens[0]?.url,
            direcaoVisual: conteudo.direcaoVisual,
            copy: conteudo.copy,
            briefDesigner: conteudo.briefDesigner,
            mensagemDisparo: conteudo.mensagemDisparo || undefined,
          });
          recriacoes.push(recriacao);
        })
    );
    await Promise.all(trabalhos);

    // Mantém ordem alfabética das variações (A, B, C...).
    recriacoes.sort((a, b) =>
      (a.variacaoRotulo ?? "").localeCompare(b.variacaoRotulo ?? "")
    );

    if (quantidadeVariacoes === 1) {
      return NextResponse.json(recriacoes[0]);
    }
    return NextResponse.json({ grupoVariacao, variacoes: recriacoes });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Erro ao recriar" },
      { status: 500 }
    );
  }
}

async function resolverProduto(entrada: {
  url?: string;
  titulo?: string;
  descricao?: string;
  imagemDataUrl?: string;
}): Promise<ProdutoInfo> {
  let produto: ProdutoInfo = {
    url: entrada.url || undefined,
    titulo: entrada.titulo || "",
    descricao: entrada.descricao || "",
    imagemUrl: undefined,
  };

  if (entrada.url) {
    const lido = await lerProduto(entrada.url);
    produto = {
      url: entrada.url,
      titulo: entrada.titulo || lido.titulo,
      descricao: entrada.descricao || lido.descricao,
      imagemUrl: lido.imagemUrl,
    };
  }

  if (entrada.imagemDataUrl) {
    produto.imagemUrl = await salvarUploadDataUrl(entrada.imagemDataUrl);
  } else if (produto.imagemUrl) {
    produto.imagemUrl =
      (await baixarImagemParaUploads(produto.imagemUrl)) ?? produto.imagemUrl;
  }
  return produto;
}

async function montarReferencias(
  modo: ModoRecriacao,
  imagemRefUrl: string,
  produto: ProdutoInfo,
  marca: Marca
): Promise<ReferenciaVisual[]> {
  const referencias: ReferenciaVisual[] = [];

  if (modo === "clonar") {
    const ref = await lerArquivoPublicoBase64(imagemRefUrl);
    if (ref) referencias.push({ ...ref, papel: "original" });
  }

  if (produto.imagemUrl?.startsWith("/")) {
    const prod = await lerArquivoPublicoBase64(produto.imagemUrl);
    if (prod) referencias.push({ ...prod, papel: "produto" });
  }

  if (marca.referencias?.length) {
    for (const ref of marca.referencias.slice(0, 3)) {
      const arq = await lerArquivoPublicoBase64(ref.url);
      if (arq) referencias.push({ ...arq, papel: "estilo" });
    }
  }
  return referencias;
}

async function gerarImagensParaConteudo(
  conteudo: ConteudoRecriacao,
  referencias: ReferenciaVisual[],
  modo: ModoRecriacao,
  marca: Marca
): Promise<ImagemFormato[]> {
  const imagens: ImagemFormato[] = [];
  if (!imagemHabilitada()) return imagens;
  const resultados = await Promise.all(
    FORMATOS_PADRAO.map((f) =>
      gerarImagemCriativo(
        conteudo.promptImagem,
        FORMATOS[f].ratio,
        referencias,
        modo,
        marca
      )
    )
  );
  for (let i = 0; i < FORMATOS_PADRAO.length; i++) {
    const r = resultados[i];
    if (r) {
      const url = await salvarImagemCriativo(r.base64, r.mimeType);
      imagens.push({ formato: FORMATOS_PADRAO[i], url });
    }
  }
  return imagens;
}
