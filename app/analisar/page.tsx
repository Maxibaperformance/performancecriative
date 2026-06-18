"use client";

import { useEffect, useState } from "react";
import type { Analise, Marca } from "@/lib/types";
import { AnaliseCard } from "../components/AnaliseCard";
import { PainelRecriacao } from "../components/PainelRecriacao";

export default function AnalisarPage() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [marcaId, setMarcaId] = useState("");
  const [imagemDataUrl, setImagemDataUrl] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [erro, setErro] = useState("");
  const [analise, setAnalise] = useState<Analise | null>(null);

  useEffect(() => {
    fetch("/api/marcas")
      .then((r) => r.json())
      .then(setMarcas);
  }, []);

  async function onArquivo(file: File) {
    const dataUrl = await new Promise<string>((r) => {
      const fr = new FileReader();
      fr.onload = () => r(fr.result as string);
      fr.readAsDataURL(file);
    });
    setImagemDataUrl(dataUrl);
    setAnalise(null);
  }

  async function analisar() {
    if (!imagemDataUrl) return;
    setAnalisando(true);
    setErro("");
    try {
      const res = await fetch("/api/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagemDataUrl, marcaId: marcaId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Falha ao analisar");
      setAnalise(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setAnalisando(false);
    }
  }

  function novo() {
    setImagemDataUrl("");
    setAnalise(null);
    setErro("");
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold mb-1">Analisar criativo</h1>
      <p className="text-[var(--fg-muted)] mb-8">
        Suba um anúncio estático de referência (ex: da Biblioteca de Anúncios). O
        sistema lê, classifica, pontua — e recria com o seu produto.
      </p>

      {!analise && (
        <div className="card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_240px] gap-6">
            {/* dropzone */}
            <label
              className="relative border-2 border-dashed border-[var(--border)] rounded-xl min-h-56 grid place-items-center cursor-pointer hover:border-[var(--accent)] transition-colors overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) onArquivo(f);
              }}
            >
              {imagemDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagemDataUrl}
                  alt="prévia"
                  className="max-h-72 w-auto object-contain p-3"
                />
              ) : (
                <div className="text-center text-[var(--fg-dim)] px-4">
                  <div className="text-3xl mb-2">⬆</div>
                  Arraste a imagem aqui ou clique para enviar
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onArquivo(e.target.files[0])}
              />
            </label>

            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Marca de destino (opcional)</label>
                <select
                  className="select"
                  value={marcaId}
                  onChange={(e) => setMarcaId(e.target.value)}
                >
                  <option value="">Nenhuma</option>
                  {marcas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={analisar}
                disabled={!imagemDataUrl || analisando}
                className="btn btn-primary"
              >
                {analisando ? <span className="spinner" /> : "🔍"}
                {analisando ? "Analisando..." : "Analisar criativo"}
              </button>
              {imagemDataUrl && (
                <button onClick={novo} className="btn btn-ghost text-xs">
                  Trocar imagem
                </button>
              )}
              {erro && <p className="text-sm text-[var(--danger)]">{erro}</p>}
            </div>
          </div>
        </div>
      )}

      {analise && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-end">
            <button onClick={novo} className="btn btn-ghost text-sm">
              + Analisar outro
            </button>
          </div>
          <AnaliseCard analise={analise} onUpdate={setAnalise} />
          <PainelRecriacao analise={analise} marcas={marcas} />
        </div>
      )}
    </div>
  );
}
