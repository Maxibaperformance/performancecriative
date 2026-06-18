"use client";

import { useEffect, useState } from "react";
import type { Marca, Criativo, FormatoCriativo } from "@/lib/types";
import { FORMATOS } from "@/lib/types";

export default function EstudioPage() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [marcaId, setMarcaId] = useState("");
  const [objetivo, setObjetivo] = useState("Vendas");
  const [oferta, setOferta] = useState("");
  const [angulo, setAngulo] = useState("");
  const [dorQueResolve, setDorQueResolve] = useState("");
  const [persona, setPersona] = useState("");
  const [formato, setFormato] = useState<FormatoCriativo>("feed-quadrado");
  const [instrucoesImagem, setInstrucoesImagem] = useState("");
  const [usarReferencias, setUsarReferencias] = useState<string[]>([]);

  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<Criativo | null>(null);

  useEffect(() => {
    fetch("/api/marcas")
      .then((r) => r.json())
      .then((m: Marca[]) => {
        setMarcas(m);
        if (m[0]) setMarcaId(m[0].id);
      });
  }, []);

  const marca = marcas.find((m) => m.id === marcaId);

  function toggleRef(id: string) {
    setUsarReferencias((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  async function gerar() {
    if (!marcaId) return;
    setGerando(true);
    setErro("");
    setResultado(null);
    try {
      const res = await fetch("/api/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marcaId,
          objetivo,
          oferta,
          angulo,
          dorQueResolve,
          persona,
          formato,
          instrucoesImagem,
          usarReferencias,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Falha ao gerar");
      setResultado(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setGerando(false);
    }
  }

  if (marcas.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-20 text-center">
        <h1 className="text-2xl font-bold mb-3">Estúdio</h1>
        <p className="text-[var(--fg-muted)] mb-6">
          Cadastre uma marca primeiro para gerar criativos com contexto.
        </p>
        <a href="/marcas" className="btn btn-primary">
          Cadastrar marca
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold mb-1">Estúdio</h1>
      <p className="text-[var(--fg-muted)] mb-8">
        Briefing rápido → criativo completo (imagem + copy).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
        {/* Briefing */}
        <div className="card p-6 h-fit">
          <Field label="Marca">
            <select
              className="select"
              value={marcaId}
              onChange={(e) => {
                setMarcaId(e.target.value);
                setUsarReferencias([]);
              }}
            >
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Objetivo">
              <select
                className="select"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
              >
                {["Vendas", "Reconhecimento", "Leads", "Tráfego", "Engajamento"].map(
                  (o) => (
                    <option key={o}>{o}</option>
                  )
                )}
              </select>
            </Field>
            <Field label="Formato (sempre geramos Feed 1:1 + Story 9:16)">
              <select
                className="select"
                value={formato}
                onChange={(e) => setFormato(e.target.value as FormatoCriativo)}
              >
                {Object.entries(FORMATOS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label} ({v.ratio})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Oferta / promoção">
            <input
              className="input"
              value={oferta}
              onChange={(e) => setOferta(e.target.value)}
              placeholder="Ex: 30% OFF no primeiro pedido"
            />
          </Field>

          <Field label="Ângulo / gancho">
            <textarea
              className="textarea"
              value={angulo}
              onChange={(e) => setAngulo(e.target.value)}
              placeholder="Ex: prova social, antes e depois, dor específica..."
            />
          </Field>

          <Field label="🎯 Dor que o produto resolve">
            <textarea
              className="textarea"
              value={dorQueResolve}
              onChange={(e) => setDorQueResolve(e.target.value)}
              placeholder="Ex: gengiva sangrando ao escovar, mau hálito que afasta as pessoas, vergonha de sorrir em fotos..."
            />
          </Field>

          <Field label="👤 Persona / avatar específico">
            <textarea
              className="textarea"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="Ex: Marina, 32, mãe recente, dorme pouco e quer se sentir bem consigo de novo. Compra pelo Instagram. Sensível a preço, mas valoriza qualidade."
            />
          </Field>

          <Field label="Direcionamento visual (opcional)">
            <textarea
              className="textarea"
              value={instrucoesImagem}
              onChange={(e) => setInstrucoesImagem(e.target.value)}
              placeholder="Ex: produto em fundo claro, modelo sorrindo, mood clean..."
            />
          </Field>

          {marca && marca.referencias.length > 0 && (
            <Field label="Usar referências como base visual">
              <div className="flex flex-wrap gap-3">
                {marca.referencias.map((r) => {
                  const sel = usarReferencias.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRef(r.id)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        sel
                          ? "border-[var(--accent)]"
                          : "border-[var(--border)] opacity-70"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.url}
                        alt={r.nome}
                        className="w-full h-full object-cover"
                      />
                      {sel && (
                        <span className="absolute inset-0 grid place-items-center bg-[var(--accent)]/30 text-white font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          <button
            onClick={gerar}
            disabled={gerando}
            className="btn btn-primary w-full mt-6"
          >
            {gerando ? <span className="spinner" /> : "✦"}
            {gerando ? "Gerando criativo..." : "Gerar criativo"}
          </button>
          {erro && (
            <p className="text-sm text-[var(--danger)] mt-3">{erro}</p>
          )}
        </div>

        {/* Resultado */}
        <div>
          {gerando && <Skeleton />}
          {!gerando && !resultado && (
            <div className="card p-10 text-center text-[var(--fg-dim)] h-full grid place-items-center">
              <div>
                <div className="text-4xl mb-3">✦</div>
                O criativo gerado vai aparecer aqui.
              </div>
            </div>
          )}
          {resultado && <Resultado c={resultado} />}
        </div>
      </div>
    </div>
  );
}

function Resultado({ c }: { c: Criativo }) {
  // Compat: histórico antigo só tem imagemUrl + briefing.formato.
  const imagens =
    c.imagens && c.imagens.length > 0
      ? c.imagens
      : c.imagemUrl
      ? [{ formato: c.briefing.formato, url: c.imagemUrl }]
      : [];

  return (
    <div className="flex flex-col gap-5">
      {imagens.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {imagens.map((img) => (
            <div key={img.url} className="card overflow-hidden">
              <div className="text-[10px] font-semibold text-[var(--fg-dim)] px-3 pt-2">
                {FORMATOS[img.formato].label} ({FORMATOS[img.formato].ratio})
              </div>
              <div
                className="bg-black/30"
                style={{ aspectRatio: FORMATOS[img.formato].aspect }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={c.copy.headline}
                  className="w-full h-full object-contain"
                />
              </div>
              <a href={img.url} download className="btn btn-ghost text-xs m-2">
                ⬇ Baixar
              </a>
            </div>
          ))}
        </div>
      ) : null}

      <div className="card p-5">
        <h3 className="font-semibold mb-3">
          <span className="chip">Direção visual</span>
        </h3>
        <p className="text-sm whitespace-pre-wrap">{c.direcaoVisual}</p>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="chip">Copy</span>
        </h3>
        <Linha titulo="Headline" texto={c.copy.headline} />
        <Linha titulo="Texto primário" texto={c.copy.textoPrimario} />
        <Linha titulo="Descrição" texto={c.copy.descricao} />
        <Linha titulo="CTA" texto={c.copy.cta} />
        {c.copy.variacoes?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <div className="label">Variações</div>
            {c.copy.variacoes.map((v, i) => (
              <div key={i} className="text-sm mb-3">
                <div className="font-medium">{v.headline}</div>
                <div className="text-[var(--fg-muted)]">{v.textoPrimario}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-3">
          <span className="chip">Briefing</span>
        </h3>
        <Linha titulo="Conceito" texto={c.briefingEstruturado.conceito} />
        <Linha titulo="Mensagem principal" texto={c.briefingEstruturado.mensagemPrincipal} />
        <Linha titulo="Público" texto={c.briefingEstruturado.publico} />
        <Linha titulo="Tom" texto={c.briefingEstruturado.tom} />
        {c.briefingEstruturado.elementosVisuais?.length > 0 && (
          <div className="mb-3">
            <div className="label">Elementos visuais</div>
            <div className="flex flex-wrap gap-2">
              {c.briefingEstruturado.elementosVisuais.map((e, i) => (
                <span key={i} className="chip">
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}
        <Linha titulo="Observações" texto={c.briefingEstruturado.observacoes} />
      </div>
    </div>
  );
}

function Linha({ titulo, texto }: { titulo: string; texto: string }) {
  if (!texto) return null;
  return (
    <div className="mb-3">
      <div className="label">{titulo}</div>
      <p className="text-sm whitespace-pre-wrap">{texto}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="card p-6 flex flex-col gap-4 animate-pulse">
      <div className="w-full aspect-square rounded-xl bg-[var(--bg-elev)]" />
      <div className="h-4 w-2/3 rounded bg-[var(--bg-elev)]" />
      <div className="h-4 w-full rounded bg-[var(--bg-elev)]" />
      <div className="h-4 w-1/2 rounded bg-[var(--bg-elev)]" />
      <p className="text-center text-sm text-[var(--fg-muted)]">
        Criando copy e gerando a imagem do criativo...
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
