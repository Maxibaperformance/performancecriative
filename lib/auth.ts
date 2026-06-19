// Sessão por senha única — token assinado HMAC-SHA256.
// Usa Web Crypto (globalThis.crypto.subtle) pra funcionar TANTO no Edge
// (middleware) QUANTO no Node (route handlers). NÃO importar nada Node-only aqui.

export const SESSION_COOKIE = "pc_session";

const TTL_PADRAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const enc = new TextEncoder();

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return hex(sig);
}

/** Comparação de tempo constante (evita timing attack). */
function igualSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Token = "<expira_ms>.<hmac(expira_ms)>". */
export async function criarToken(
  secret: string,
  ttlMs: number = TTL_PADRAO_MS
): Promise<string> {
  const exp = String(Date.now() + ttlMs);
  const sig = await hmac(secret, exp);
  return `${exp}.${sig}`;
}

export async function verificarToken(
  token: string | undefined | null,
  secret: string
): Promise<boolean> {
  if (!token || !secret) return false;
  const ponto = token.indexOf(".");
  if (ponto <= 0) return false;
  const exp = token.slice(0, ponto);
  const sig = token.slice(ponto + 1);
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || Date.now() > expMs) return false;
  const esperado = await hmac(secret, exp);
  return igualSeguro(sig, esperado);
}

/** Confere a senha em tempo (quase) constante. */
export async function senhaConfere(
  entrada: string,
  real: string,
  secret: string
): Promise<boolean> {
  // HMAC dos dois lados evita vazar o tamanho da senha real.
  const [a, b] = await Promise.all([hmac(secret, entrada), hmac(secret, real)]);
  return igualSeguro(a, b);
}
