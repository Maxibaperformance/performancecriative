"use client";

import { useState } from "react";
import type {
  Analise,
  Marca,
  Recriacao,
  ModoRecriacao,
  FormatoCriativo,
  Canal,
} from "@/lib/types";
import { FORMATOS, CANAIS } from "@/lib/types";

const OBJETIVOS = [
  "Vendas",
  "Leads",
  "Tráfego",
  "Conversas (WhatsApp)",
  "Reconhecimento",
  "Engajamento",
];

export function PainelRecriacao({
  analise,
  marcas,
}: {
  analise: Analise;
  marcas: Marca[];
}) {
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState<ModoRecriacao>("clonar");
  const [canal, setCanal] = useState<Canal>("meta");
  const [formato, setFormato] = useState<FormatoCriativo>(
    CANAIS.meta.formatoSugerido
  );
  const [objetivo, setObjetivo] = useState("Vendas");
  const [cupom, setCupom] = useState("");
  const [ajustes, setAjustes] = useState("");
  const [quantidadeVariacoes, setQuantidadeVariacoes] = useState<1 | 3 | 5>(1);
  const [marcaId, setMarcaId] = useState(analise.marcaId ?? "");
  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imgDataUrl, setImgDataUrl] = useState<string>("");

  // Troca de canal já sugere o formato ideal (usuário pode mudar depois).
  function escolherCanal(c: Canal) {
    setCanal(c);
    setFormato(CANAIS[c].formatoSugerido);
  }

  const [recriando, setRecriando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<Recriacao | null>(null);
  /** Quando quantidadeVariacoes > 1, vem um array em vez de um único resultado. */
  const [resultadoVariacoes, setResultadoVariacoes] = useState<Recriacao[] | null>(
    null
  );

  async function onImg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await new Promise<string>((r) => {
      const fr = new FileReader();
      fr.onload = () => r(fr.result as string);
      fr.readAsDataURL(file);
    });
    setImgDataUrl(dataUrl);
  }

  async function recriar() {
    setRecriando(true);
    setErro("");
    setResultado(null);
    setResultadoVariacoes(null);
    try {
      const res = await fetch("/api/recriar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analiseId: analise.id,
          marcaId: marcaId || undefined,
          modo,
          canal,
          formato,
          objetivo,
          cupom,
          ajustes,
          quantidadeVariacoes,
          produto: { url, titulo, descricao, imagemDataUrl: imgDataUrl || undefined },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Falha ao recriar");
      // Backend devolve {variacoes: Recriacao[]} quando N>1, ou Recriacao avulsa.
      if (Array.isArray(data.variacoes)) {
        setResultadoVariacoes(data.variacoes);
      } else {
        setResultado(data);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setRecriando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="btn w-full text-white"
        style={{ background: "var(--ok)", color: "#06281f" }}
      >
        🎨 Recriar com o meu produto
      </button>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4">🎨 Recriar com o meu produto</h3>

      <div className="mb-4">
        <label className="label">Canal de destino</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(CANAIS) as Canal[]).map((c) => (
            <button
              key={c}
              onClick={() => escolherCanal(c)}
              className={`btn text-xs ${canal === c ? "btn-primary" : "btn-ghost"}`}
            >
              {CANAIS[c].label.replace(/\s*\(.*\)/, "")}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--fg-dim)] mt-2">{CANAIS[canal].guia}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Objetivo</label>
          <select
            className="select"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
          >
            {OBJETIVOS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Modo</label>
          <div className="flex gap-2">
            <ModoBtn ativo={modo === "clonar"} onClick={() => setModo("clonar")}>
              Clonar layout
            </ModoBtn>
            <ModoBtn ativo={modo === "inspirar"} onClick={() => setModo("inspirar")}>
              Inspirar
            </ModoBtn>
          </div>
        </div>
        <div>
          <label className="label">
            Formato principal{" "}
            <span className="text-[var(--fg-dim)] font-normal">
              (sempre geramos Feed 1:1 + Story 9:16)
            </span>
          </label>
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
        </div>
      </div>

      <div className="mt-4">
        <label className="label">
          Marca <span style={{ color: "var(--danger)" }}>*</span>{" "}
          <span className="text-[var(--fg-dim)] font-normal">
            (obrigatória — ancora paleta, produtos e proibições)
          </span>
        </label>
        {marcas.length > 0 ? (
          <select
            className="select"
            value={marcaId}
            onChange={(e) => setMarcaId(e.target.value)}
            style={
              !marcaId ? { borderColor: "var(--danger)" } : undefined
            }
          >
            <option value="">— Selecione uma marca —</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-[var(--fg-dim)] p-3 border border-dashed border-[var(--border)] rounded-lg">
            Nenhuma marca cadastrada. Vá em{" "}
            <a href="/marcas" className="text-[var(--accent)] underline">
              Marcas
            </a>{" "}
            e clique em <strong>Importar marcas padrão</strong>.
          </div>
        )}
      </div>

      <div className="mt-4">
        <label className="label">URL do produto</label>
        <input
          className="input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://sualoja.com/produto (leio título, descrição e imagem)"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="label">Título do produto (opcional)</label>
          <input
            className="input"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Complementa/sobrepõe o da URL"
          />
        </div>
        <div>
          <label className="label">Imagem do produto (opcional)</label>
          <label className="btn btn-ghost w-full cursor-pointer">
            {imgDataUrl ? "Imagem selecionada ✓" : "Enviar imagem"}
            <input type="file" accept="image/*" className="hidden" onChange={onImg} />
          </label>
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Descrição extra (opcional)</label>
        <textarea
          className="textarea"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Detalhes do produto, oferta, observações..."
        />
      </div>

      <div className="mt-4">
        <label className="label">🎟️ Cupom / oferta (opcional)</label>
        <input
          className="input"
          value={cupom}
          onChange={(e) => setCupom(e.target.value)}
          placeholder="Ex: DRY10 — 10% OFF na primeira compra (entra na copy e na arte)"
        />
      </div>

      <div className="mt-4">
        <label className="label">✏️ Ajustes / alterações (opcional)</label>
        <textarea
          className="textarea"
          value={ajustes}
          onChange={(e) => setAjustes(e.target.value)}
          placeholder="O que mudar pra ficar mais intencional: trocar o fundo, dar mais destaque ao rosto, antes/depois mais forte..."
        />
      </div>

      <div className="mt-5">
        <label className="label">
          🔁 Variações pra testar A/B/C{" "}
          <span className="text-[var(--fg-dim)] font-normal">
            (cada variação muda 1 dimensão: cenário, hook, hierarquia, etc)
          </span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([1, 3, 5] as const).map((n) => (
            <button
              key={n}
              onClick={() => setQuantidadeVariacoes(n)}
              className={`btn text-xs ${
                quantidadeVariacoes === n ? "btn-primary" : "btn-ghost"
              }`}
            >
              {n === 1 ? "1 (única)" : `${n} variações`}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={recriar}
        disabled={recriando || !marcaId}
        className="btn btn-primary w-full mt-4"
        title={!marcaId ? "Selecione uma marca primeiro" : undefined}
      >
        {recriando ? <span className="spinner" /> : "✦"}
        {recriando
          ? quantidadeVariacoes > 1
            ? `Gerando ${quantidadeVariacoes} variações (paralelo)...`
            : "Recriando criativo..."
          : !marcaId
          ? "Selecione uma marca"
          : quantidadeVariacoes > 1
          ? `Gerar ${quantidadeVariacoes} variações`
          : "Gerar recriação"}
      </button>
      {erro && <p className="text-sm text-[var(--danger)] mt-3">{erro}</p>}

      {resultado && <Resultado r={resultado} formato={formato} />}
      {resultadoVariacoes && (
        <ResultadoVariacoes variacoes={resultadoVariacoes} />
      )}
    </div>
  );
}

function Resultado({ r, formato }: { r: Recriacao; formato: FormatoCriativo }) {
  // Compat: histórico antigo só tem imagemUrl.
  const imagens =
    r.imagens && r.imagens.length > 0
      ? r.imagens
      : r.imagemUrl
      ? [{ formato, url: r.imagemUrl }]
      : [];

  return (
    <div className="mt-6 pt-6 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col gap-4">
        {imagens.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {imagens.map((img) => (
              <div key={img.url} className="card overflow-hidden h-fit">
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
                    alt={r.copy.headline}
                    className="w-full h-full object-contain"
                  />
                </div>
                <a href={img.url} download className="btn btn-ghost text-xs m-2">
                  ⬇ Baixar
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="card grid place-items-center text-center p-6 text-[var(--fg-dim)] text-sm aspect-square">
            <div>
              🎨 Direção visual pronta abaixo.
              <br />
              Configure a chave do Gemini pra gerar a imagem automaticamente.
            </div>
          </div>
        )}

        <div>
          <div className="label">Direção visual (pro designer / IA)</div>
          <p className="text-sm whitespace-pre-wrap">{r.direcaoVisual}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="chip">{CANAIS[r.canal]?.label ?? r.canal}</span>
          <span className="chip">{r.objetivo}</span>
          {r.cupom && (
            <span className="chip" style={{ color: "#e0a83e" }}>
              🎟️ {r.cupom}
            </span>
          )}
        </div>
        <div>
          <div className="label">Brief pro designer</div>
          <p className="text-sm whitespace-pre-wrap">{r.briefDesigner}</p>
        </div>
        {r.mensagemDisparo && (
          <div className="pt-4 border-t border-[var(--border)]">
            <div className="label">💬 Mensagem de disparo (WhatsApp)</div>
            <p className="text-sm whitespace-pre-wrap bg-[var(--bg-elev)] rounded-lg p-3">
              {r.mensagemDisparo}
            </p>
          </div>
        )}
        <div className="pt-4 border-t border-[var(--border)]">
          <div className="label">Copy</div>
          <p className="text-sm font-semibold">{r.copy.headline}</p>
          <p className="text-sm text-[var(--fg-muted)] whitespace-pre-wrap mt-1">
            {r.copy.textoPrimario}
          </p>
          <p className="text-sm mt-2">
            <span className="text-[var(--fg-dim)]">CTA: </span>
            {r.copy.cta}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultadoVariacoes({ variacoes }: { variacoes: Recriacao[] }) {
  return (
    <div className="mt-6 pt-6 border-t border-[var(--border)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold">
            🔁 {variacoes.length} variações geradas
          </h4>
          <p className="text-xs text-[var(--fg-dim)] mt-1">
            Suba todas no Meta como conjunto A/B — algoritmo otimiza pela
            vencedora.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {variacoes.map((v) => (
          <div key={v.id} className="card overflow-hidden flex flex-col">
            <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-elev)]/40">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: "var(--accent)", color: "white" }}
                >
                  Variação {v.variacaoRotulo ?? "?"}
                </span>
                {v.imagens?.[0] && (
                  <a
                    href={v.imagens[0].url}
                    download
                    className="btn btn-ghost !py-1 !px-2 text-[10px]"
                  >
                    ⬇
                  </a>
                )}
              </div>
              {v.variacaoDimensao && (
                <p className="text-[11px] text-[var(--fg-muted)] mt-1">
                  {v.variacaoDimensao}
                </p>
              )}
            </div>

            {/* Mostra Feed (1:1) como capa; story disponível em download */}
            {v.imagens?.length ? (
              <div className="grid grid-cols-2 gap-1 p-2">
                {v.imagens.map((img) => (
                  <a
                    key={img.url}
                    href={img.url}
                    download
                    className="relative bg-black/30 block"
                    style={{ aspectRatio: FORMATOS[img.formato].aspect }}
                    title={`Baixar ${FORMATOS[img.formato].label}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={v.copy.headline}
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">
                      {FORMATOS[img.formato].ratio}
                    </span>
                  </a>
                ))}
              </div>
            ) : null}

            <div className="p-3 flex flex-col gap-1.5 flex-1">
              <p className="text-sm font-semibold line-clamp-2">
                {v.copy.headline}
              </p>
              <p className="text-xs text-[var(--fg-muted)] line-clamp-3">
                {v.copy.textoPrimario}
              </p>
              <p className="text-xs mt-auto">
                <span className="text-[var(--fg-dim)]">CTA: </span>
                {v.copy.cta}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModoBtn({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn flex-1 text-xs ${ativo ? "btn-primary" : "btn-ghost"}`}
    >
      {children}
    </button>
  );
}
