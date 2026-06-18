"use client";

import { useEffect, useRef, useState } from "react";
import type { Analise, Marca, Funil, TipoMidia } from "@/lib/types";
import { TIPOS_MIDIA } from "@/lib/types";
import { FUNIL } from "@/lib/taxonomia";
import { InspiracaoCardCompacto } from "../components/InspiracaoCardCompacto";

type StatusFiltro = "todos" | "novos" | "validados" | "nao";
type UploadItem = {
  id: string;
  nome: string;
  tipo: TipoMidia;
  status: "pendente" | "analisando" | "pronto" | "erro";
  erro?: string;
};

const PARALELO = 2;

/**
 * Extrai o primeiro frame de um vídeo via <video> + <canvas>.
 * Retorna data URL de imagem (jpeg) que vai pro Gemini analisar.
 */
function extrairFrameVideo(file: File): Promise<{ frame: string; video: string }> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.src = fr.result as string;
      const cleanup = () => video.remove();
      video.onloadeddata = () => {
        // Pula um pouquinho pra evitar frame preto inicial.
        video.currentTime = Math.min(0.5, (video.duration || 1) / 4);
      };
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("canvas indisponível");
          ctx.drawImage(video, 0, 0);
          const frame = canvas.toDataURL("image/jpeg", 0.85);
          cleanup();
          resolve({ frame, video: fr.result as string });
        } catch (e) {
          cleanup();
          reject(e);
        }
      };
      video.onerror = () => {
        cleanup();
        reject(new Error("falha ao ler vídeo"));
      };
    };
    fr.onerror = () => reject(new Error("falha ao abrir arquivo"));
    fr.readAsDataURL(file);
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("leitura falhou"));
    fr.readAsDataURL(file);
  });
}

export default function InspiracoesPage() {
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [marcaUpload, setMarcaUpload] = useState("");
  const [tipoUpload, setTipoUpload] = useState<TipoMidia>("imagem");

  const [abaTipo, setAbaTipo] = useState<"todos" | TipoMidia>("todos");
  const [status, setStatus] = useState<StatusFiltro>("todos");
  const [funilFiltro, setFunilFiltro] = useState<"todos" | Funil>("todos");
  const [busca, setBusca] = useState("");

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    const r = await fetch("/api/analises");
    setAnalises(await r.json());
  }

  useEffect(() => {
    carregar();
    fetch("/api/marcas")
      .then((r) => r.json())
      .then(setMarcas);
  }, []);

  async function processarArquivos(files: File[]) {
    if (!files.length) return;
    const novos: UploadItem[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name}`,
      nome: f.name,
      tipo: tipoUpload,
      status: "pendente",
    }));
    setUploads((p) => [...novos, ...p]);

    const fila = files.map((f, i) => ({
      file: f,
      id: novos[i].id,
      tipo: novos[i].tipo,
    }));

    async function worker() {
      while (fila.length) {
        const item = fila.shift();
        if (!item) return;
        setUploads((p) =>
          p.map((u) => (u.id === item.id ? { ...u, status: "analisando" } : u))
        );
        try {
          let imagemDataUrl: string;
          let videoDataUrl: string | undefined;

          if (item.tipo === "imagem") {
            imagemDataUrl = await fileToDataUrl(item.file);
          } else {
            // Pra vídeo: extrai o primeiro frame e manda como imagem pra IA.
            const { frame, video } = await extrairFrameVideo(item.file);
            imagemDataUrl = frame;
            videoDataUrl = video;
          }

          const res = await fetch("/api/analisar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imagemDataUrl,
              videoDataUrl,
              tipoMidia: item.tipo,
              marcaId: marcaUpload || undefined,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.erro || "falha na análise");
          setUploads((p) =>
            p.map((u) => (u.id === item.id ? { ...u, status: "pronto" } : u))
          );
          await carregar();
        } catch (e) {
          setUploads((p) =>
            p.map((u) =>
              u.id === item.id
                ? {
                    ...u,
                    status: "erro",
                    erro: e instanceof Error ? e.message : "erro",
                  }
                : u
            )
          );
        }
      }
    }

    await Promise.all(Array.from({ length: PARALELO }, worker));

    setTimeout(() => {
      setUploads((p) => p.filter((u) => u.status !== "pronto"));
    }, 4000);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.type.startsWith("image/") ||
        f.type.startsWith("video/")
    );
    processarArquivos(files);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    processarArquivos(files);
    e.target.value = "";
  }

  // Aplica filtros.
  const filtradas = analises.filter((a) => {
    const tipoMidia = a.tipoMidia ?? "imagem";
    if (abaTipo !== "todos" && tipoMidia !== abaTipo) return false;
    if (status === "novos" && a.validado !== null) return false;
    if (status === "validados" && a.validado !== "sim") return false;
    if (status === "nao" && a.validado !== "nao") return false;
    if (funilFiltro !== "todos" && a.funil !== funilFiltro) return false;
    if (busca) {
      const q = busca.toLowerCase();
      const blob = `${a.codigo} ${a.textoExtraido.headline} ${a.textoExtraido.body} ${a.analise.resumo}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });

  const total = analises.length;
  const totalPorTipo = (t: TipoMidia) =>
    analises.filter((a) => (a.tipoMidia ?? "imagem") === t).length;
  const totalNovos = analises.filter((a) => a.validado === null).length;
  const totalValidados = analises.filter((a) => a.validado === "sim").length;
  const totalNao = analises.filter((a) => a.validado === "nao").length;

  const aceitar =
    tipoUpload === "imagem" ? "image/*" : "video/*";

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Inspirações</h1>
          <p className="text-[var(--fg-muted)]">
            Biblioteca de referências criativas — Biblioteca de Anúncios do Meta,
            Instagram, prints de concorrência. Arraste para analisar em lote.
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-primary"
        >
          + Nova inspiração
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={aceitar}
          multiple
          className="hidden"
          onChange={onPick}
        />
      </header>

      {/* Abas de tipo de mídia */}
      <div className="flex items-center gap-1 mb-4 border-b border-[var(--border)]">
        <AbaTipo
          ativo={abaTipo === "todos"}
          onClick={() => setAbaTipo("todos")}
        >
          Todos ({total})
        </AbaTipo>
        {(Object.keys(TIPOS_MIDIA) as TipoMidia[]).map((t) => (
          <AbaTipo
            key={t}
            ativo={abaTipo === t}
            onClick={() => setAbaTipo(t)}
          >
            {TIPOS_MIDIA[t].icone} {TIPOS_MIDIA[t].label} ({totalPorTipo(t)})
          </AbaTipo>
        ))}
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="card border-2 border-dashed border-[var(--border)] py-5 px-5 mb-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-4 items-center"
      >
        <div>
          <div className="text-sm">
            <span className="text-[var(--accent)]">⬆</span> Arraste{" "}
            {tipoUpload === "imagem" ? "imagens" : "vídeos"} aqui — análise
            automática
          </div>
          <div className="text-xs text-[var(--fg-dim)] mt-1">
            Processa {PARALELO} em paralelo. Vídeos: análise do primeiro frame.
          </div>
        </div>

        {/* Seletor de tipo do upload */}
        <div className="flex items-center gap-1">
          {(Object.keys(TIPOS_MIDIA) as TipoMidia[]).map((t) => (
            <button
              key={t}
              onClick={() => setTipoUpload(t)}
              className={`btn !py-1.5 !px-3 text-xs ${
                tipoUpload === t ? "btn-primary" : "btn-ghost"
              }`}
              title={`Próximo upload: ${TIPOS_MIDIA[t].label}`}
            >
              {TIPOS_MIDIA[t].icone}{" "}
              <span className="hidden sm:inline">{TIPOS_MIDIA[t].label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--fg-dim)]">Marca:</label>
          <select
            className="select !py-1.5 !w-auto text-xs"
            value={marcaUpload}
            onChange={(e) => setMarcaUpload(e.target.value)}
          >
            <option value="">Nenhuma</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila de upload */}
      {uploads.length > 0 && (
        <div className="card p-4 mb-5">
          <div className="text-xs text-[var(--fg-dim)] mb-2">
            Fila ({uploads.filter((u) => u.status !== "pronto").length} pendentes)
          </div>
          <div className="flex flex-wrap gap-2">
            {uploads.map((u) => (
              <span
                key={u.id}
                className="chip"
                style={{
                  color:
                    u.status === "pronto"
                      ? "var(--ok)"
                      : u.status === "erro"
                      ? "var(--danger)"
                      : "#b8a6ff",
                }}
                title={u.erro || u.nome}
              >
                {u.status === "analisando" && (
                  <span className="spinner !w-3 !h-3 !border-[1.5px]" />
                )}
                {u.status === "pronto" && "✓ "}
                {u.status === "erro" && "✕ "}
                {TIPOS_MIDIA[u.tipo].icone}{" "}
                {u.nome.length > 24 ? u.nome.slice(0, 22) + "…" : u.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtros secundários */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <FiltroChip
          ativo={status === "todos"}
          onClick={() => setStatus("todos")}
        >
          Todos
        </FiltroChip>
        <FiltroChip
          ativo={status === "novos"}
          onClick={() => setStatus("novos")}
        >
          Novos ({totalNovos})
        </FiltroChip>
        <FiltroChip
          ativo={status === "validados"}
          onClick={() => setStatus("validados")}
        >
          ✓ Validados ({totalValidados})
        </FiltroChip>
        <FiltroChip
          ativo={status === "nao"}
          onClick={() => setStatus("nao")}
        >
          ✕ Não validados ({totalNao})
        </FiltroChip>

        <div className="h-5 w-px bg-[var(--border)] mx-2" />

        <FiltroChip
          ativo={funilFiltro === "todos"}
          onClick={() => setFunilFiltro("todos")}
        >
          Todos funis
        </FiltroChip>
        {(Object.keys(FUNIL) as Funil[]).map((f) => (
          <FiltroChip
            key={f}
            ativo={funilFiltro === f}
            onClick={() => setFunilFiltro(f)}
          >
            {FUNIL[f].label}
          </FiltroChip>
        ))}

        <div className="ml-auto">
          <input
            className="input !py-1.5 text-sm"
            placeholder="🔍 Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Grid compacta */}
      {filtradas.length === 0 ? (
        <div className="card p-12 text-center text-[var(--fg-dim)]">
          {total === 0
            ? "Suba os primeiros anúncios de referência arrastando aqui em cima."
            : "Nenhuma inspiração bate com esses filtros."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtradas.map((a) => (
            <InspiracaoCardCompacto
              key={a.id}
              analise={a}
              marcas={marcas}
              onUpdate={(novo) =>
                setAnalises((prev) => prev.map((x) => (x.id === a.id ? novo : x)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AbaTipo({
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
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
        ativo
          ? "border-[var(--accent)] text-[var(--fg)]"
          : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]"
      }`}
    >
      {children}
    </button>
  );
}

function FiltroChip({
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
      className="chip cursor-pointer transition-colors"
      style={
        ativo
          ? {
              background: "var(--accent)",
              color: "white",
              borderColor: "var(--accent)",
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}
