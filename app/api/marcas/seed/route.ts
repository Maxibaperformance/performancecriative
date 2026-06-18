import { NextResponse } from "next/server";
import { listarMarcas, salvarMarca } from "@/lib/store";
import { MARCAS_SEED } from "@/lib/marcas-seed";

/**
 * Importa as marcas padrão (Dry Skin + Nouê). Só cria as que ainda não existem
 * pelo nome — quem já tem a marca cadastrada não é afetado.
 */
export async function POST() {
  const atuais = await listarMarcas();
  const nomesExistentes = new Set(
    atuais.map((m) => m.nome.trim().toLowerCase())
  );
  const criadas: string[] = [];
  for (const seed of MARCAS_SEED) {
    if (nomesExistentes.has(seed.nome.trim().toLowerCase())) continue;
    await salvarMarca({ ...seed, referencias: [] });
    criadas.push(seed.nome);
  }
  return NextResponse.json({ criadas });
}
