// Camada de dados local (MVP): JSON em /data e imagens em /public.
// Isolada de propósito — trocar por Supabase/Postgres depois é só reimplementar
// estas funções, sem mexer no resto do app.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  Marca,
  Criativo,
  ReferenciaImagem,
  Analise,
  Recriacao,
} from "./types";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const MARCAS_FILE = path.join(DATA_DIR, "marcas.json");
const CRIATIVOS_FILE = path.join(DATA_DIR, "criativos.json");
const ANALISES_FILE = path.join(DATA_DIR, "analises.json");
const RECRIACOES_FILE = path.join(DATA_DIR, "recriacoes.json");

const PUBLIC_DIR = path.join(ROOT, "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const CRIATIVOS_DIR = path.join(PUBLIC_DIR, "criativos");

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(CRIATIVOS_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await ensureDirs();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

const ext: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

// ---------- Marcas ----------

export async function listarMarcas(): Promise<Marca[]> {
  const marcas = await readJson<Marca[]>(MARCAS_FILE, []);
  return marcas.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
}

export async function obterMarca(id: string): Promise<Marca | null> {
  const marcas = await readJson<Marca[]>(MARCAS_FILE, []);
  return marcas.find((m) => m.id === id) ?? null;
}

export async function salvarMarca(
  input: Omit<Marca, "id" | "criadoEm" | "atualizadoEm"> & { id?: string }
): Promise<Marca> {
  const marcas = await readJson<Marca[]>(MARCAS_FILE, []);
  const agora = new Date().toISOString();

  if (input.id) {
    const idx = marcas.findIndex((m) => m.id === input.id);
    if (idx === -1) throw new Error("Marca não encontrada");
    marcas[idx] = { ...marcas[idx], ...input, id: input.id, atualizadoEm: agora };
    await writeJson(MARCAS_FILE, marcas);
    return marcas[idx];
  }

  const nova: Marca = {
    ...input,
    id: randomUUID(),
    criadoEm: agora,
    atualizadoEm: agora,
  };
  marcas.push(nova);
  await writeJson(MARCAS_FILE, marcas);
  return nova;
}

export async function excluirMarca(id: string): Promise<void> {
  const marcas = await readJson<Marca[]>(MARCAS_FILE, []);
  await writeJson(
    MARCAS_FILE,
    marcas.filter((m) => m.id !== id)
  );
}

/** Salva uma imagem de referência (base64 data URL) em /public/uploads. */
export async function salvarReferencia(
  dataUrl: string,
  nome: string,
  tipo: ReferenciaImagem["tipo"]
): Promise<ReferenciaImagem> {
  await ensureDirs();
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) throw new Error("Imagem inválida");
  const [, mimeType, base64] = match;
  const id = randomUUID();
  const fileName = `${id}.${ext[mimeType] ?? "png"}`;
  await fs.writeFile(path.join(UPLOADS_DIR, fileName), Buffer.from(base64, "base64"));
  return { id, nome, tipo, url: `/uploads/${fileName}`, mimeType };
}

// ---------- Criativos (histórico) ----------

export async function listarCriativos(marcaId?: string): Promise<Criativo[]> {
  const criativos = await readJson<Criativo[]>(CRIATIVOS_FILE, []);
  const filtrados = marcaId
    ? criativos.filter((c) => c.marcaId === marcaId)
    : criativos;
  return filtrados.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/** Salva os bytes da imagem gerada em /public/criativos e retorna a URL. */
export async function salvarImagemCriativo(
  base64: string,
  mimeType: string
): Promise<string> {
  await ensureDirs();
  const id = randomUUID();
  const fileName = `${id}.${ext[mimeType] ?? "png"}`;
  await fs.writeFile(path.join(CRIATIVOS_DIR, fileName), Buffer.from(base64, "base64"));
  return `/criativos/${fileName}`;
}

export async function salvarCriativo(
  c: Omit<Criativo, "id" | "criadoEm">
): Promise<Criativo> {
  const criativos = await readJson<Criativo[]>(CRIATIVOS_FILE, []);
  const novo: Criativo = { ...c, id: randomUUID(), criadoEm: new Date().toISOString() };
  criativos.push(novo);
  await writeJson(CRIATIVOS_FILE, criativos);
  return novo;
}

// ---------- Upload genérico (data URL -> /public/uploads) ----------

export async function salvarUploadDataUrl(dataUrl: string): Promise<string> {
  await ensureDirs();
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) throw new Error("Imagem inválida");
  const [, mimeType, base64] = match;
  const id = randomUUID();
  const fileName = `${id}.${ext[mimeType] ?? "png"}`;
  await fs.writeFile(path.join(UPLOADS_DIR, fileName), Buffer.from(base64, "base64"));
  return `/uploads/${fileName}`;
}

const videoExt: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export async function salvarVideoDataUrl(dataUrl: string): Promise<string> {
  await ensureDirs();
  const match = dataUrl.match(/^data:(video\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) throw new Error("Vídeo inválido");
  const [, mimeType, base64] = match;
  const id = randomUUID();
  const fileName = `${id}.${videoExt[mimeType] ?? "mp4"}`;
  await fs.writeFile(path.join(UPLOADS_DIR, fileName), Buffer.from(base64, "base64"));
  return `/uploads/${fileName}`;
}

/** Baixa uma imagem por URL e salva em /public/uploads. Retorna url local ou null. */
export async function baixarImagemParaUploads(url: string): Promise<string | null> {
  try {
    await ensureDirs();
    const res = await fetch(url);
    if (!res.ok) return null;
    const mimeType = res.headers.get("content-type")?.split(";")[0] ?? "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    const id = randomUUID();
    const fileName = `${id}.${ext[mimeType] ?? "jpg"}`;
    await fs.writeFile(path.join(UPLOADS_DIR, fileName), buf);
    return `/uploads/${fileName}`;
  } catch {
    return null;
  }
}

// ---------- Análises ----------

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export async function listarAnalises(): Promise<Analise[]> {
  const a = await readJson<Analise[]>(ANALISES_FILE, []);
  return a.sort((x, y) => y.criadoEm.localeCompare(x.criadoEm));
}

export async function obterAnalise(id: string): Promise<Analise | null> {
  const a = await readJson<Analise[]>(ANALISES_FILE, []);
  return a.find((x) => x.id === id) ?? null;
}

export async function salvarAnalise(
  input: Omit<Analise, "id" | "codigo" | "criadoEm">
): Promise<Analise> {
  const analises = await readJson<Analise[]>(ANALISES_FILE, []);
  const agora = new Date();
  const seq = String(analises.length + 1).padStart(2, "0");
  const nova: Analise = {
    ...input,
    id: randomUUID(),
    codigo: `REF-${MESES[agora.getMonth()]}-${seq}`,
    criadoEm: agora.toISOString(),
  };
  analises.push(nova);
  await writeJson(ANALISES_FILE, analises);
  return nova;
}

export async function atualizarAnalise(
  id: string,
  patch: Partial<Analise>
): Promise<Analise | null> {
  const analises = await readJson<Analise[]>(ANALISES_FILE, []);
  const idx = analises.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  analises[idx] = { ...analises[idx], ...patch, id };
  await writeJson(ANALISES_FILE, analises);
  return analises[idx];
}

// ---------- Recriações ----------

export async function listarRecriacoes(analiseId?: string): Promise<Recriacao[]> {
  const r = await readJson<Recriacao[]>(RECRIACOES_FILE, []);
  const f = analiseId ? r.filter((x) => x.analiseId === analiseId) : r;
  return f.sort((x, y) => y.criadoEm.localeCompare(x.criadoEm));
}

export async function salvarRecriacao(
  c: Omit<Recriacao, "id" | "criadoEm">
): Promise<Recriacao> {
  const recriacoes = await readJson<Recriacao[]>(RECRIACOES_FILE, []);
  const novo: Recriacao = { ...c, id: randomUUID(), criadoEm: new Date().toISOString() };
  recriacoes.push(novo);
  await writeJson(RECRIACOES_FILE, recriacoes);
  return novo;
}

/** Lê um arquivo de /public e devolve em base64 (pra mandar como referência ao Gemini). */
export async function lerArquivoPublicoBase64(
  url: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const rel = url.replace(/^\//, "");
    const full = path.join(PUBLIC_DIR, rel);
    const buf = await fs.readFile(full);
    const e = path.extname(full).slice(1).toLowerCase();
    const mimeType =
      e === "jpg" || e === "jpeg"
        ? "image/jpeg"
        : e === "webp"
        ? "image/webp"
        : "image/png";
    return { base64: buf.toString("base64"), mimeType };
  } catch {
    return null;
  }
}
