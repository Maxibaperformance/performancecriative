// Camada de dados — Supabase (Postgres + Storage).
// MESMA interface da versão anterior (filesystem local) — o resto do app
// não precisa mudar nada. Trocar de banco no futuro = reimplementar só aqui.
import { randomUUID } from "node:crypto";
import { supabase, BUCKETS, urlPublica } from "./supabase";
import type {
  Marca,
  Criativo,
  ReferenciaImagem,
  Analise,
  Recriacao,
} from "./types";

const ext: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const videoExt: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

function nowIso() {
  return new Date().toISOString();
}

// ============================================================
//  Mappers camelCase <-> snake_case
// ============================================================

// Marca
type MarcaRow = {
  id: string;
  nome: string;
  produto: string;
  descricao: string;
  tom_de_voz: string;
  publico_alvo: string;
  identidade_visual: string;
  diferenciais: string;
  dores: string;
  desejos: string;
  paleta_cores: string;
  linha_produtos: string;
  proibicoes: string;
  referencias: ReferenciaImagem[];
  criado_em: string;
  atualizado_em: string;
};

function marcaFromRow(r: MarcaRow): Marca {
  return {
    id: r.id,
    nome: r.nome,
    produto: r.produto,
    descricao: r.descricao,
    tomDeVoz: r.tom_de_voz,
    publicoAlvo: r.publico_alvo,
    identidadeVisual: r.identidade_visual,
    diferenciais: r.diferenciais,
    dores: r.dores,
    desejos: r.desejos,
    paletaCores: r.paleta_cores,
    linhaProdutos: r.linha_produtos,
    proibicoes: r.proibicoes,
    referencias: r.referencias ?? [],
    criadoEm: r.criado_em,
    atualizadoEm: r.atualizado_em,
  };
}
function marcaToRow(m: Partial<Marca>): Partial<MarcaRow> {
  const row: Partial<MarcaRow> = {};
  if (m.id !== undefined) row.id = m.id;
  if (m.nome !== undefined) row.nome = m.nome;
  if (m.produto !== undefined) row.produto = m.produto;
  if (m.descricao !== undefined) row.descricao = m.descricao;
  if (m.tomDeVoz !== undefined) row.tom_de_voz = m.tomDeVoz;
  if (m.publicoAlvo !== undefined) row.publico_alvo = m.publicoAlvo;
  if (m.identidadeVisual !== undefined) row.identidade_visual = m.identidadeVisual;
  if (m.diferenciais !== undefined) row.diferenciais = m.diferenciais;
  if (m.dores !== undefined) row.dores = m.dores;
  if (m.desejos !== undefined) row.desejos = m.desejos;
  if (m.paletaCores !== undefined) row.paleta_cores = m.paletaCores;
  if (m.linhaProdutos !== undefined) row.linha_produtos = m.linhaProdutos;
  if (m.proibicoes !== undefined) row.proibicoes = m.proibicoes;
  if (m.referencias !== undefined) row.referencias = m.referencias;
  return row;
}

// Analise
type AnaliseRow = {
  id: string;
  codigo: string;
  marca_id: string | null;
  tipo_midia: Analise["tipoMidia"];
  imagem_ref_url: string;
  video_ref_url: string | null;
  texto_extraido: Analise["textoExtraido"];
  funil: Analise["funil"];
  funil_justificativa: string | null;
  nivel_consciencia: Analise["nivelConsciencia"];
  angulos: Analise["angulos"];
  analise: Analise["analise"];
  score: number;
  score_label: Analise["scoreLabel"];
  score_breakdown: Analise["scoreBreakdown"];
  validado: "sim" | "nao" | null;
  criado_em: string;
};

function analiseFromRow(r: AnaliseRow): Analise {
  return {
    id: r.id,
    codigo: r.codigo,
    marcaId: r.marca_id ?? undefined,
    tipoMidia: r.tipo_midia,
    imagemRefUrl: r.imagem_ref_url,
    videoRefUrl: r.video_ref_url ?? undefined,
    textoExtraido: r.texto_extraido,
    funil: r.funil,
    funilJustificativa: r.funil_justificativa ?? undefined,
    nivelConsciencia: r.nivel_consciencia,
    angulos: r.angulos ?? [],
    analise: r.analise,
    score: r.score,
    scoreLabel: r.score_label,
    scoreBreakdown: r.score_breakdown ?? [],
    validado: r.validado,
    criadoEm: r.criado_em,
  };
}
function analiseToRow(a: Partial<Analise>): Partial<AnaliseRow> {
  const row: Partial<AnaliseRow> = {};
  if (a.id !== undefined) row.id = a.id;
  if (a.codigo !== undefined) row.codigo = a.codigo;
  if (a.marcaId !== undefined) row.marca_id = a.marcaId ?? null;
  if (a.tipoMidia !== undefined) row.tipo_midia = a.tipoMidia;
  if (a.imagemRefUrl !== undefined) row.imagem_ref_url = a.imagemRefUrl;
  if (a.videoRefUrl !== undefined) row.video_ref_url = a.videoRefUrl ?? null;
  if (a.textoExtraido !== undefined) row.texto_extraido = a.textoExtraido;
  if (a.funil !== undefined) row.funil = a.funil;
  if (a.funilJustificativa !== undefined)
    row.funil_justificativa = a.funilJustificativa ?? null;
  if (a.nivelConsciencia !== undefined) row.nivel_consciencia = a.nivelConsciencia;
  if (a.angulos !== undefined) row.angulos = a.angulos;
  if (a.analise !== undefined) row.analise = a.analise;
  if (a.score !== undefined) row.score = a.score;
  if (a.scoreLabel !== undefined) row.score_label = a.scoreLabel;
  if (a.scoreBreakdown !== undefined) row.score_breakdown = a.scoreBreakdown;
  if (a.validado !== undefined) row.validado = a.validado;
  return row;
}

// Recriacao
type RecriacaoRow = {
  id: string;
  analise_id: string;
  marca_id: string | null;
  marca_nome: string | null;
  modo: Recriacao["modo"];
  formato: Recriacao["formato"];
  canal: Recriacao["canal"];
  objetivo: string;
  cupom: string | null;
  ajustes: string | null;
  grupo_variacao: string | null;
  variacao_rotulo: string | null;
  variacao_dimensao: string | null;
  produto: Recriacao["produto"];
  imagens: Recriacao["imagens"];
  imagem_url: string | null;
  direcao_visual: string;
  copy: Recriacao["copy"];
  brief_designer: string;
  mensagem_disparo: string | null;
  criado_em: string;
};

function recriacaoFromRow(r: RecriacaoRow): Recriacao {
  return {
    id: r.id,
    analiseId: r.analise_id,
    marcaId: r.marca_id ?? undefined,
    marcaNome: r.marca_nome ?? undefined,
    modo: r.modo,
    formato: r.formato,
    canal: r.canal,
    objetivo: r.objetivo,
    cupom: r.cupom ?? undefined,
    ajustes: r.ajustes ?? undefined,
    grupoVariacao: r.grupo_variacao ?? undefined,
    variacaoRotulo: r.variacao_rotulo ?? undefined,
    variacaoDimensao: r.variacao_dimensao ?? undefined,
    produto: r.produto,
    imagens: r.imagens ?? [],
    imagemUrl: r.imagem_url ?? undefined,
    direcaoVisual: r.direcao_visual,
    copy: r.copy,
    briefDesigner: r.brief_designer,
    mensagemDisparo: r.mensagem_disparo ?? undefined,
    criadoEm: r.criado_em,
  };
}
function recriacaoToRow(c: Omit<Recriacao, "id" | "criadoEm">): Partial<RecriacaoRow> {
  return {
    analise_id: c.analiseId,
    marca_id: c.marcaId ?? null,
    marca_nome: c.marcaNome ?? null,
    modo: c.modo,
    formato: c.formato,
    canal: c.canal,
    objetivo: c.objetivo,
    cupom: c.cupom ?? null,
    ajustes: c.ajustes ?? null,
    grupo_variacao: c.grupoVariacao ?? null,
    variacao_rotulo: c.variacaoRotulo ?? null,
    variacao_dimensao: c.variacaoDimensao ?? null,
    produto: c.produto,
    imagens: c.imagens,
    imagem_url: c.imagemUrl ?? null,
    direcao_visual: c.direcaoVisual,
    copy: c.copy,
    brief_designer: c.briefDesigner,
    mensagem_disparo: c.mensagemDisparo ?? null,
  };
}

// Criativo
type CriativoRow = {
  id: string;
  marca_id: string | null;
  marca_nome: string | null;
  briefing: Criativo["briefing"];
  copy: Criativo["copy"];
  briefing_estruturado: Criativo["briefingEstruturado"];
  direcao_visual: string;
  imagens: Criativo["imagens"];
  imagem_url: string | null;
  criado_em: string;
};

function criativoFromRow(r: CriativoRow): Criativo {
  return {
    id: r.id,
    marcaId: r.marca_id ?? "",
    marcaNome: r.marca_nome ?? "",
    briefing: r.briefing,
    copy: r.copy,
    briefingEstruturado: r.briefing_estruturado,
    direcaoVisual: r.direcao_visual,
    imagens: r.imagens ?? [],
    imagemUrl: r.imagem_url ?? undefined,
    criadoEm: r.criado_em,
  };
}

// ============================================================
//  Storage (uploads + criativos)
// ============================================================

async function uploadBuffer(
  bucket: string,
  buf: Buffer,
  mimeType: string,
  extension?: string
): Promise<string> {
  const id = randomUUID();
  const e = extension ?? ext[mimeType] ?? videoExt[mimeType] ?? "bin";
  const filePath = `${id}.${e}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buf, { contentType: mimeType, upsert: false });
  if (error) throw new Error(`Falha no upload (${bucket}): ${error.message}`);
  return urlPublica(bucket, filePath);
}

async function uploadDataUrl(
  bucket: string,
  dataUrl: string,
  pattern: RegExp,
  fallbackMime = "image/png"
): Promise<string> {
  const match = dataUrl.match(pattern);
  if (!match) throw new Error("Arquivo inválido");
  const [, mimeType, base64] = match;
  return uploadBuffer(bucket, Buffer.from(base64, "base64"), mimeType || fallbackMime);
}

export async function salvarUploadDataUrl(dataUrl: string): Promise<string> {
  return uploadDataUrl(BUCKETS.uploads, dataUrl, /^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
}

export async function salvarVideoDataUrl(dataUrl: string): Promise<string> {
  return uploadDataUrl(BUCKETS.uploads, dataUrl, /^data:(video\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
}

/** Salva imagem gerada (base64 + mimeType) no bucket de criativos. */
export async function salvarImagemCriativo(
  base64: string,
  mimeType: string
): Promise<string> {
  return uploadBuffer(BUCKETS.criativos, Buffer.from(base64, "base64"), mimeType);
}

/** Baixa uma imagem por URL externa e salva no bucket uploads. */
export async function baixarImagemParaUploads(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mimeType = res.headers.get("content-type")?.split(";")[0] ?? "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    return await uploadBuffer(BUCKETS.uploads, buf, mimeType);
  } catch {
    return null;
  }
}

/** Salva referência de marca (logo, produto, etc) com metadata. */
export async function salvarReferencia(
  dataUrl: string,
  nome: string,
  tipo: ReferenciaImagem["tipo"]
): Promise<ReferenciaImagem> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) throw new Error("Imagem inválida");
  const [, mimeType, base64] = match;
  const url = await uploadBuffer(BUCKETS.uploads, Buffer.from(base64, "base64"), mimeType);
  return { id: randomUUID(), nome, tipo, url, mimeType };
}

/**
 * Lê um arquivo do Storage (ou qualquer URL) e devolve em base64
 * — usado pra mandar referências como inline data ao Gemini.
 */
export async function lerArquivoPublicoBase64(
  url: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mimeType = res.headers.get("content-type")?.split(";")[0] ?? "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    return { base64: buf.toString("base64"), mimeType };
  } catch {
    return null;
  }
}

// ============================================================
//  Marcas
// ============================================================

export async function listarMarcas(): Promise<Marca[]> {
  const { data, error } = await supabase
    .from("marcas")
    .select("*")
    .order("atualizado_em", { ascending: false });
  if (error) throw new Error(`Listar marcas: ${error.message}`);
  return (data as MarcaRow[]).map(marcaFromRow);
}

export async function obterMarca(id: string): Promise<Marca | null> {
  const { data, error } = await supabase
    .from("marcas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Obter marca: ${error.message}`);
  return data ? marcaFromRow(data as MarcaRow) : null;
}

export async function salvarMarca(
  input: Omit<Marca, "id" | "criadoEm" | "atualizadoEm"> & { id?: string }
): Promise<Marca> {
  if (input.id) {
    const { data, error } = await supabase
      .from("marcas")
      .update(marcaToRow(input))
      .eq("id", input.id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`Atualizar marca: ${error.message}`);
    if (!data) throw new Error("Marca não encontrada");
    return marcaFromRow(data as MarcaRow);
  }

  const { data, error } = await supabase
    .from("marcas")
    .insert(marcaToRow(input))
    .select()
    .single();
  if (error) throw new Error(`Criar marca: ${error.message}`);
  return marcaFromRow(data as MarcaRow);
}

export async function excluirMarca(id: string): Promise<void> {
  const { error } = await supabase.from("marcas").delete().eq("id", id);
  if (error) throw new Error(`Excluir marca: ${error.message}`);
}

// ============================================================
//  Análises
// ============================================================

const MESES = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

export async function listarAnalises(): Promise<Analise[]> {
  const { data, error } = await supabase
    .from("analises")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Listar análises: ${error.message}`);
  return (data as AnaliseRow[]).map(analiseFromRow);
}

export async function obterAnalise(id: string): Promise<Analise | null> {
  const { data, error } = await supabase
    .from("analises")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Obter análise: ${error.message}`);
  return data ? analiseFromRow(data as AnaliseRow) : null;
}

export async function salvarAnalise(
  input: Omit<Analise, "id" | "codigo" | "criadoEm">
): Promise<Analise> {
  // Sequencial REF-MES-NN — conta o total existente.
  const { count, error: countErr } = await supabase
    .from("analises")
    .select("id", { count: "exact", head: true });
  if (countErr) throw new Error(`Contar análises: ${countErr.message}`);
  const agora = new Date();
  const seq = String((count ?? 0) + 1).padStart(2, "0");
  const codigo = `REF-${MESES[agora.getMonth()]}-${seq}`;

  const row = {
    ...analiseToRow(input),
    codigo,
    criado_em: nowIso(),
  };

  const { data, error } = await supabase
    .from("analises")
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`Criar análise: ${error.message}`);
  return analiseFromRow(data as AnaliseRow);
}

export async function atualizarAnalise(
  id: string,
  patch: Partial<Analise>
): Promise<Analise | null> {
  const { data, error } = await supabase
    .from("analises")
    .update(analiseToRow(patch))
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Atualizar análise: ${error.message}`);
  return data ? analiseFromRow(data as AnaliseRow) : null;
}

// ============================================================
//  Recriações
// ============================================================

export async function listarRecriacoes(analiseId?: string): Promise<Recriacao[]> {
  let q = supabase
    .from("recriacoes")
    .select("*")
    .order("criado_em", { ascending: false });
  if (analiseId) q = q.eq("analise_id", analiseId);
  const { data, error } = await q;
  if (error) throw new Error(`Listar recriações: ${error.message}`);
  return (data as RecriacaoRow[]).map(recriacaoFromRow);
}

export async function salvarRecriacao(
  c: Omit<Recriacao, "id" | "criadoEm">
): Promise<Recriacao> {
  const row = { ...recriacaoToRow(c), criado_em: nowIso() };
  const { data, error } = await supabase
    .from("recriacoes")
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`Criar recriação: ${error.message}`);
  return recriacaoFromRow(data as RecriacaoRow);
}

// ============================================================
//  Criativos (criar do zero)
// ============================================================

export async function listarCriativos(marcaId?: string): Promise<Criativo[]> {
  let q = supabase
    .from("criativos")
    .select("*")
    .order("criado_em", { ascending: false });
  if (marcaId) q = q.eq("marca_id", marcaId);
  const { data, error } = await q;
  if (error) throw new Error(`Listar criativos: ${error.message}`);
  return (data as CriativoRow[]).map(criativoFromRow);
}

export async function salvarCriativo(
  c: Omit<Criativo, "id" | "criadoEm">
): Promise<Criativo> {
  const row = {
    marca_id: c.marcaId || null,
    marca_nome: c.marcaNome || null,
    briefing: c.briefing,
    copy: c.copy,
    briefing_estruturado: c.briefingEstruturado,
    direcao_visual: c.direcaoVisual,
    imagens: c.imagens,
    imagem_url: c.imagemUrl ?? null,
    criado_em: nowIso(),
  };
  const { data, error } = await supabase
    .from("criativos")
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`Criar criativo: ${error.message}`);
  return criativoFromRow(data as CriativoRow);
}
