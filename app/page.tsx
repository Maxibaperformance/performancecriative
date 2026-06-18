import Link from "next/link";
import { listarMarcas, listarAnalises, listarRecriacoes } from "@/lib/store";
import { FUNIL } from "@/lib/taxonomia";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [marcas, analises, recriacoes] = await Promise.all([
    listarMarcas(),
    listarAnalises(),
    listarRecriacoes(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Performance Criativa</span>
        </h1>
        <p className="text-[var(--fg-muted)] mt-2 max-w-2xl">
          Suba um anúncio de referência → o sistema lê, classifica e pontua →
          recria com o seu produto, pronto pro designer.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Análises" value={analises.length} />
        <Stat label="Recriações" value={recriacoes.length} />
        <Stat label="Marcas" value={marcas.length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <Link
          href="/inspiracoes"
          className="card p-6 hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-2xl mb-3">🔍</div>
          <h2 className="font-semibold text-lg mb-1">Inspirações</h2>
          <p className="text-sm text-[var(--fg-muted)]">
            Biblioteca de referências criativas — suba em lote, analise e recrie.
          </p>
        </Link>
        <Link
          href="/marcas"
          className="card p-6 hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-2xl mb-3 text-[var(--accent)]">◆</div>
          <h2 className="font-semibold text-lg mb-1">Gerenciar Marcas</h2>
          <p className="text-sm text-[var(--fg-muted)]">
            Contexto por marca: produto, tom de voz, público e referências.
          </p>
        </Link>
      </div>

      {analises.length > 0 ? (
        <section>
          <h2 className="font-semibold text-lg mb-4">Análises recentes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {analises.slice(0, 8).map((a) => (
              <Link
                key={a.id}
                href="/historico"
                className="card overflow-hidden hover:border-[var(--accent)] transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.imagemRefUrl}
                  alt={a.codigo}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[var(--fg-dim)]">
                      {a.codigo}
                    </span>
                    <span className="text-sm font-bold">{a.score}</span>
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: FUNIL[a.funil].cor }}
                  >
                    {FUNIL[a.funil].label} · {a.nivelConsciencia}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-[var(--fg-muted)] mb-4">
            Comece subindo um anúncio de referência para analisar.
          </p>
          <Link href="/inspiracoes" className="btn btn-primary">
            Analisar primeiro criativo
          </Link>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-[var(--fg-muted)] mt-1">{label}</div>
    </div>
  );
}
