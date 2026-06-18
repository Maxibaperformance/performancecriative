"use client";

import { useState } from "react";
import type { Analise, Funil, NivelConsciencia, Angulo } from "@/lib/types";
import { FUNIL, NIVEIS, ANGULOS, NOTA_MAXIMA } from "@/lib/taxonomia";

const corLabel: Record<string, string> = {
  ALTO: "var(--ok)",
  MÉDIO: "#e0a83e",
  BAIXO: "var(--danger)",
};

export function AnaliseCard({
  analise,
  onUpdate,
}: {
  analise: Analise;
  onUpdate: (a: Analise) => void;
}) {
  const [reclass, setReclass] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function patch(body: Partial<Analise>) {
    setSalvando(true);
    try {
      const res = await fetch(`/api/analises/${analise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onUpdate(await res.json());
    } finally {
      setSalvando(false);
    }
  }

  const t = analise.textoExtraido;

  return (
    <div className="card overflow-hidden">
      {/* topo: imagem + nota */}
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
        <div className="bg-black/40 grid place-items-center p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={analise.imagemRefUrl}
            alt="referência"
            className="max-h-64 w-auto object-contain rounded-lg"
          />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="font-mono font-semibold">{analise.codigo}</span>
            <div className="flex items-center gap-2">
              <span
                className="text-3xl font-bold"
                style={{ color: corLabel[analise.scoreLabel] }}
              >
                {analise.score}
              </span>
              <span className="text-xs text-[var(--fg-dim)]">/{NOTA_MAXIMA}</span>
              <span
                className="chip"
                style={{ color: corLabel[analise.scoreLabel] }}
              >
                {analise.scoreLabel}
              </span>
            </div>
          </div>

          {/* badges de classificação */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge cor={FUNIL[analise.funil].cor}>{FUNIL[analise.funil].label}</Badge>
            <Badge cor="#c44bff">
              {analise.nivelConsciencia} · {NIVEIS[analise.nivelConsciencia]}
            </Badge>
            {analise.angulos.map((a) => (
              <Badge key={a} cor="#ff5c7c">
                {ANGULOS[a]}
              </Badge>
            ))}
            <button
              onClick={() => setReclass((v) => !v)}
              className="chip cursor-pointer hover:border-[var(--accent)]"
            >
              ✎ Reclassificar
            </button>
          </div>

          <p className="text-sm text-[var(--fg-muted)]">{analise.analise.resumo}</p>
        </div>
      </div>

      {reclass && (
        <Reclassificador
          analise={analise}
          salvando={salvando}
          onSalvar={async (p) => {
            await patch(p);
            setReclass(false);
          }}
        />
      )}

      {/* corpo */}
      <div className="border-t border-[var(--border)] p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <Bloco titulo="📝 Texto extraído">
          <Linha rotulo="Headline" texto={t.headline} />
          <Linha rotulo="Body" texto={t.body} />
          <Linha rotulo="CTA" texto={t.cta} />
          {t.traducao && <Linha rotulo="Tradução" texto={t.traducao} />}
        </Bloco>

        <Bloco titulo="📊 Análise (funil + ângulos)">
          <Linha rotulo="Objetivo" texto={analise.analise.objetivo} />
          <Linha rotulo="Ângulo principal" texto={analise.analise.anguloPrincipal} />
          <Linha rotulo="Ponto forte" texto={analise.analise.pontoForte} />
          <Linha rotulo="Melhoria" texto={analise.analise.melhoria} />
        </Bloco>
      </div>

      {/* breakdown da nota */}
      <div className="border-t border-[var(--border)] p-5">
        <div className="label mb-3">Como a nota foi calculada</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {analise.scoreBreakdown.map((c) => (
            <div key={c.chave}>
              <div className="flex items-center justify-between text-sm">
                <span>{c.label}</span>
                <span className="text-[var(--fg-muted)]">
                  {c.nota}/{c.max}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg-elev)] mt-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
                  style={{ width: `${(c.nota / c.max) * 100}%` }}
                />
              </div>
              {c.comentario && (
                <div className="text-xs text-[var(--fg-dim)] mt-1">{c.comentario}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* validação */}
      <div className="border-t border-[var(--border)] p-4 flex gap-3">
        <button
          onClick={() => patch({ validado: "sim" })}
          disabled={salvando}
          className={`btn flex-1 ${
            analise.validado === "sim" ? "btn-primary" : "btn-ghost"
          }`}
          style={
            analise.validado === "sim"
              ? { background: "var(--ok)", color: "#06281f" }
              : undefined
          }
        >
          ✓ {analise.validado === "sim" ? "Validado" : "Marcar como Validado"}
        </button>
        <button
          onClick={() => patch({ validado: "nao" })}
          disabled={salvando}
          className={`btn flex-1 ${
            analise.validado === "nao" ? "btn-danger" : "btn-ghost"
          }`}
        >
          ✕ {analise.validado === "nao" ? "Não validado" : "Marcar como Não Validado"}
        </button>
      </div>
    </div>
  );
}

function Reclassificador({
  analise,
  salvando,
  onSalvar,
}: {
  analise: Analise;
  salvando: boolean;
  onSalvar: (p: Partial<Analise>) => void;
}) {
  const [funil, setFunil] = useState<Funil>(analise.funil);
  const [nivel, setNivel] = useState<NivelConsciencia>(analise.nivelConsciencia);
  const [angulos, setAngulos] = useState<Angulo[]>(analise.angulos);

  function toggle(a: Angulo) {
    setAngulos((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));
  }

  return (
    <div className="border-t border-[var(--border)] p-5 bg-[var(--bg-elev)]/40">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Funil</label>
          <select
            className="select"
            value={funil}
            onChange={(e) => setFunil(e.target.value as Funil)}
          >
            {Object.entries(FUNIL).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Nível de consciência</label>
          <select
            className="select"
            value={nivel}
            onChange={(e) => setNivel(e.target.value as NivelConsciencia)}
          >
            {Object.entries(NIVEIS).map(([k, v]) => (
              <option key={k} value={k}>
                {k} · {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label className="label">Ângulos</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ANGULOS).map(([k, v]) => {
            const sel = angulos.includes(k as Angulo);
            return (
              <button
                key={k}
                onClick={() => toggle(k as Angulo)}
                className={`chip cursor-pointer ${
                  sel ? "!bg-[var(--accent)] !text-white" : ""
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>
      <button
        onClick={() => onSalvar({ funil, nivelConsciencia: nivel, angulos })}
        disabled={salvando}
        className="btn btn-primary mt-4"
      >
        {salvando ? <span className="spinner" /> : null} Salvar classificação
      </button>
    </div>
  );
}

function Badge({ children, cor }: { children: React.ReactNode; cor: string }) {
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full border"
      style={{ color: cor, borderColor: cor, background: `${cor}1a` }}
    >
      {children}
    </span>
  );
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-semibold text-sm mb-2">{titulo}</div>
      {children}
    </div>
  );
}

function Linha({ rotulo, texto }: { rotulo: string; texto: string }) {
  if (!texto) return null;
  return (
    <div className="mb-2 text-sm">
      <span className="text-[var(--fg-dim)]">{rotulo}: </span>
      <span className="whitespace-pre-wrap">{texto}</span>
    </div>
  );
}
