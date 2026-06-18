import { listarAnalises, listarRecriacoes } from "@/lib/store";
import { FUNIL, NIVEIS, ANGULOS, NOTA_MAXIMA } from "@/lib/taxonomia";
import { FORMATOS } from "@/lib/types";

export const dynamic = "force-dynamic";

const corLabel: Record<string, string> = {
  ALTO: "var(--ok)",
  MÉDIO: "#e0a83e",
  BAIXO: "var(--danger)",
};

export default async function HistoricoPage() {
  const [analises, recriacoes] = await Promise.all([
    listarAnalises(),
    listarRecriacoes(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold mb-1">Histórico</h1>
      <p className="text-[var(--fg-muted)] mb-8">
        Análises de referência e criativos recriados.
      </p>

      <h2 className="font-semibold mb-4">Análises ({analises.length})</h2>
      {analises.length === 0 ? (
        <div className="card p-8 text-center text-[var(--fg-dim)] mb-10">
          Nenhuma análise ainda. Vá em Analisar para começar.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {analises.map((a) => (
            <div key={a.id} className="card overflow-hidden flex flex-col">
              <div className="flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.imagemRefUrl}
                  alt={a.codigo}
                  className="w-28 h-36 object-cover shrink-0"
                />
                <div className="p-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs">{a.codigo}</span>
                    <span
                      className="font-bold"
                      style={{ color: corLabel[a.scoreLabel] }}
                    >
                      {a.score}
                      <span className="text-[10px] text-[var(--fg-dim)]">
                        /{NOTA_MAXIMA}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Tag cor={FUNIL[a.funil].cor}>{FUNIL[a.funil].label}</Tag>
                    <Tag cor="#c44bff">{a.nivelConsciencia}</Tag>
                    {a.angulos.slice(0, 2).map((g) => (
                      <Tag key={g} cor="#ff5c7c">
                        {ANGULOS[g]}
                      </Tag>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--fg-muted)] mt-2 line-clamp-3">
                    {a.textoExtraido.headline}
                  </p>
                  {a.validado && (
                    <span
                      className="text-[10px] font-semibold mt-2 inline-block"
                      style={{
                        color: a.validado === "sim" ? "var(--ok)" : "var(--danger)",
                      }}
                    >
                      {a.validado === "sim" ? "✓ Validado" : "✕ Não validado"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {recriacoes.length > 0 && (
        <>
          <h2 className="font-semibold mb-4">Recriações ({recriacoes.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recriacoes.map((r) => (
              <div key={r.id} className="card overflow-hidden flex flex-col">
                {r.imagemUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.imagemUrl}
                    alt={r.copy.headline}
                    className="w-full object-cover"
                    style={{ aspectRatio: FORMATOS[r.formato].aspect }}
                  />
                ) : (
                  <div
                    className="bg-[var(--bg-elev)] grid place-items-center text-3xl text-[var(--fg-dim)]"
                    style={{ aspectRatio: FORMATOS[r.formato].aspect }}
                  >
                    🎨
                  </div>
                )}
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <span className="chip self-start">
                    {r.modo === "clonar" ? "Clone" : "Inspirado"}
                  </span>
                  <p className="text-sm font-medium line-clamp-2">
                    {r.copy.headline}
                  </p>
                  <p className="text-xs text-[var(--fg-muted)] line-clamp-3">
                    {r.direcaoVisual}
                  </p>
                  {r.imagemUrl && (
                    <a
                      href={r.imagemUrl}
                      download
                      className="btn btn-ghost text-xs mt-auto"
                    >
                      ⬇ Baixar
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Tag({ children, cor }: { children: React.ReactNode; cor: string }) {
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
      style={{ color: cor, borderColor: cor, background: `${cor}1a` }}
    >
      {children}
    </span>
  );
}
