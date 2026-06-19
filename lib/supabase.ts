// Cliente Supabase server-side (service_role — ignora RLS).
// Usar SÓ em rotas API e na camada `lib/store.ts`. Nunca expor no cliente.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Avisamos no boot, mas não derrubamos — a UI consegue renderizar páginas
  // estáticas mesmo sem credenciais. As rotas que dependem disso vão falhar
  // com mensagem clara.
  console.warn(
    "[supabase] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes. Configure .env.local."
  );
}

export const supabase = createClient(url ?? "", serviceKey ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Buckets do Storage. */
export const BUCKETS = {
  uploads: "uploads",
  criativos: "criativos",
} as const;

/**
 * Resolve a URL pública de um path de bucket. Aceita tanto path puro
 * (`abc.png`) quanto URL completa (passa direto).
 */
export function urlPublica(bucket: string, path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
