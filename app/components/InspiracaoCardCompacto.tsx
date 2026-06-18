"use client";

import { useState } from "react";
import type { Analise, Marca } from "@/lib/types";
import { TIPOS_MIDIA } from "@/lib/types";
import { FUNIL, NIVEIS, ANGULOS, NOTA_MAXIMA } from "@/lib/taxonomia";
import { AnaliseCard } from "./AnaliseCard";
import { PainelRecriacao } from "./PainelRecriacao";

const corLabel: Record<string, string> = {
  ALTO: "var(--ok)",
  MÉDIO: "#e0a83e",
  BAIXO: "var(--danger)",
};

/** Card resumido pra biblioteca. Clique pra expandir detalhes + recriação. */
export function InspiracaoCardCompacto({
  analise,
  marcas,
  onUpdate,
}: {
  analise: Analise;
  marcas: Marca[];
  onUpdate: (a: Analise) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const tipo = TIPOS_MIDIA[analise.tipoMidia ?? "imagem"];

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[110px_1fr] gap-3">
        {/* Thumbnail compacto */}
        <button
          onClick={() => setAberto((v) => !v)}
          className="bg-black/30 relative grid place-items-center min-h-[160px] cursor-zoom-in"
          aria-label="Expandir detalhes"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={analise.imagemRefUrl}
            alt={analise.codigo}
            className="w-full h-full object-cover"
          />
          {analise.tipoMidia !== "imagem" && (
            <span className="absolute top-1 left-1 chip !text-[10px] !px-1.5 !py-0.5">
              {tipo.icone}
            </span>
          )}
        </button>

        {/* Resumo */}
        <div className="py-3 pr-3 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-mono text-xs">{analise.codigo}</span>
            <div className="flex items-baseline gap-1">
              <span
                className="text-xl font-bold leading-none"
                style={{ color: corLabel[analise.scoreLabel] }}
              >
                {analise.score}
              </span>
              <span className="text-[10px] text-[var(--fg-dim)]">
                /{NOTA_MAXIMA}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            <MiniBadge cor={FUNIL[analise.funil].cor}>
              {FUNIL[analise.funil].label}
            </MiniBadge>
            <MiniBadge cor="#c44bff">{analise.nivelConsciencia}</MiniBadge>
            {analise.angulos.slice(0, 2).map((a) => (
              <MiniBadge key={a} cor="#ff5c7c">
                {ANGULOS[a]}
              </MiniBadge>
            ))}
            {analise.angulos.length > 2 && (
              <MiniBadge cor="#6b6b7b">
                +{analise.angulos.length - 2}
              </MiniBadge>
            )}
          </div>

          {analise.funilJustificativa && (
            <p className="text-[11px] text-[var(--fg-dim)] mb-1.5 italic line-clamp-2">
              {analise.funilJustificativa}
            </p>
          )}

          <p className="text-sm font-medium line-clamp-1">
            {analise.textoExtraido.headline}
          </p>
          <p className="text-xs text-[var(--fg-muted)] line-clamp-2 mt-0.5">
            {analise.analise.resumo}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setAberto((v) => !v)}
              className="btn btn-ghost !py-1 !px-2 text-xs"
            >
              {aberto ? "▲ Recolher" : "▼ Ver detalhes"}
            </button>
            {analise.validado === "sim" && (
              <span className="text-[10px] font-semibold" style={{ color: "var(--ok)" }}>
                ✓ Validado
              </span>
            )}
            {analise.validado === "nao" && (
              <span
                className="text-[10px] font-semibold"
                style={{ color: "var(--danger)" }}
              >
                ✕ Não validado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {aberto && (
        <div className="border-t border-[var(--border)] p-4 bg-[var(--bg-elev)]/30 flex flex-col gap-4">
          <AnaliseCard analise={analise} onUpdate={onUpdate} />
          <PainelRecriacao analise={analise} marcas={marcas} />
        </div>
      )}
    </div>
  );
}

function MiniBadge({
  children,
  cor,
}: {
  children: React.ReactNode;
  cor: string;
}) {
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
      style={{ color: cor, borderColor: cor, background: `${cor}1a` }}
    >
      {children}
    </span>
  );
}
