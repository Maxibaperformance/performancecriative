"use client";

import { useEffect, useState } from "react";
import type { Marca, ReferenciaImagem } from "@/lib/types";

type FormState = {
  id?: string;
  nome: string;
  produto: string;
  descricao: string;
  tomDeVoz: string;
  publicoAlvo: string;
  identidadeVisual: string;
  diferenciais: string;
  dores: string;
  desejos: string;
  paletaCores: string;
  linhaProdutos: string;
  proibicoes: string;
  referencias: ReferenciaImagem[];
};

type NovaRef = { nome: string; tipo: ReferenciaImagem["tipo"]; dataUrl: string };

const vazio: FormState = {
  nome: "",
  produto: "",
  descricao: "",
  tomDeVoz: "",
  publicoAlvo: "",
  identidadeVisual: "",
  diferenciais: "",
  dores: "",
  desejos: "",
  paletaCores: "",
  linhaProdutos: "",
  proibicoes: "",
  referencias: [],
};

export default function MarcasPage() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [form, setForm] = useState<FormState>(vazio);
  const [novasRefs, setNovasRefs] = useState<NovaRef[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [importando, setImportando] = useState(false);

  async function importarPadrao() {
    setImportando(true);
    try {
      const res = await fetch("/api/marcas/seed", { method: "POST" });
      const data = await res.json();
      if (data.criadas?.length) {
        alert(`Marcas criadas: ${data.criadas.join(", ")}. Edite pra ajustar contexto.`);
      } else {
        alert("Todas as marcas padrão já estão cadastradas.");
      }
      await carregar();
    } finally {
      setImportando(false);
    }
  }

  async function carregar() {
    const res = await fetch("/api/marcas");
    setMarcas(await res.json());
  }
  useEffect(() => {
    carregar();
  }, []);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });
      setNovasRefs((prev) => [
        ...prev,
        { nome: file.name, tipo: "produto", dataUrl },
      ]);
    }
    e.target.value = "";
  }

  async function salvar() {
    if (!form.nome.trim()) return;
    setSalvando(true);
    try {
      await fetch("/api/marcas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, novasReferencias: novasRefs }),
      });
      resetar();
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  function editar(m: Marca) {
    setForm({ ...m });
    setNovasRefs([]);
    setEditando(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetar() {
    setForm(vazio);
    setNovasRefs([]);
    setEditando(false);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta marca?")) return;
    await fetch(`/api/marcas/${id}`, { method: "DELETE" });
    await carregar();
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <h1 className="text-2xl font-bold mb-1">Marcas</h1>
        <button
          onClick={importarPadrao}
          disabled={importando}
          className="btn btn-ghost text-sm"
          title="Cria Dry Skin e Nouê com placeholders editáveis"
        >
          {importando ? <span className="spinner" /> : "📥"} Importar marcas padrão
        </button>
      </div>
      <p className="text-[var(--fg-muted)] mb-8">
        O contexto aqui guia toda a geração de criativos. Quanto mais rico, melhor.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
        {/* Formulário */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">
              {editando ? "Editar marca" : "Nova marca"}
            </h2>
            {editando && (
              <button onClick={resetar} className="text-sm text-[var(--fg-muted)]">
                + Nova
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome da marca *">
              <input
                className="input"
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Ex: New Hair"
              />
            </Field>
            <Field label="Produto principal">
              <input
                className="input"
                value={form.produto}
                onChange={(e) => set("produto", e.target.value)}
                placeholder="Ex: Suplemento para cabelo"
              />
            </Field>
          </div>

          <Field label="Descrição do produto/marca">
            <textarea
              className="textarea"
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              placeholder="O que é, para que serve, principais benefícios..."
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tom de voz">
              <textarea
                className="textarea"
                value={form.tomDeVoz}
                onChange={(e) => set("tomDeVoz", e.target.value)}
                placeholder="Ex: próximo, confiante, sem jargão..."
              />
            </Field>
            <Field label="Público-alvo">
              <textarea
                className="textarea"
                value={form.publicoAlvo}
                onChange={(e) => set("publicoAlvo", e.target.value)}
                placeholder="Quem é, dores, desejos..."
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Identidade visual">
              <textarea
                className="textarea"
                value={form.identidadeVisual}
                onChange={(e) => set("identidadeVisual", e.target.value)}
                placeholder="Cores, estilo, fontes, mood..."
              />
            </Field>
            <Field label="Diferenciais">
              <textarea
                className="textarea"
                value={form.diferenciais}
                onChange={(e) => set("diferenciais", e.target.value)}
                placeholder="Por que escolher esta marca..."
              />
            </Field>
          </div>

          {/* Seção: contexto rico que ANCORA a IA */}
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <div className="text-xs font-semibold text-[var(--accent)] mb-3 uppercase tracking-wider">
              🎯 DNA da marca (ancora a IA)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Dores do público">
                <textarea
                  className="textarea"
                  value={form.dores}
                  onChange={(e) => set("dores", e.target.value)}
                  placeholder="Liste em tópicos: o que dói no público hoje. Ex: vergonha de sorrir, gengiva sangrando..."
                />
              </Field>
              <Field label="Desejos / transformação">
                <textarea
                  className="textarea"
                  value={form.desejos}
                  onChange={(e) => set("desejos", e.target.value)}
                  placeholder="Liste em tópicos: o que o público quer alcançar. Ex: sorriso natural, confiança..."
                />
              </Field>
            </div>

            <Field label="🎨 Paleta de cores (com hex, se possível)">
              <textarea
                className="textarea"
                value={form.paletaCores}
                onChange={(e) => set("paletaCores", e.target.value)}
                placeholder="Ex: Primária #E8F4F8 (azul-claro). Acento #B8956A (dourado). NUNCA usar amarelo neon."
              />
            </Field>

            <Field label="📦 Linha de produtos">
              <textarea
                className="textarea"
                value={form.linhaProdutos}
                onChange={(e) => set("linhaProdutos", e.target.value)}
                placeholder="Liste todos os produtos da marca pra IA escolher o certo. Ex: DryWhite, DryWhite Powder, Kit Completo..."
              />
            </Field>

            <Field label="🚫 Proibições (o que NUNCA aparecer)">
              <textarea
                className="textarea"
                value={form.proibicoes}
                onChange={(e) => set("proibicoes", e.target.value)}
                placeholder="Estética, palavras, claims que a marca não usa. Ex: nunca paleta neon, nunca prometer resultado instantâneo..."
              />
            </Field>
          </div>

          <Field label="Referências visuais (logo, produto, criativos vencedores)">
            <div className="flex flex-wrap gap-3">
              {form.referencias.map((r) => (
                <Thumb key={r.id} src={r.url} nome={r.nome} />
              ))}
              {novasRefs.map((r, i) => (
                <Thumb key={`n${i}`} src={r.dataUrl} nome={r.nome} novo />
              ))}
              <label className="w-20 h-20 rounded-lg border border-dashed border-[var(--border)] grid place-items-center cursor-pointer hover:border-[var(--accent)] text-2xl text-[var(--fg-dim)]">
                +
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onUpload}
                />
              </label>
            </div>
          </Field>

          <button
            onClick={salvar}
            disabled={salvando || !form.nome.trim()}
            className="btn btn-primary mt-5 w-full"
          >
            {salvando ? <span className="spinner" /> : null}
            {editando ? "Salvar alterações" : "Criar marca"}
          </button>
        </div>

        {/* Lista */}
        <div>
          <h2 className="font-semibold mb-4">Suas marcas ({marcas.length})</h2>
          <div className="flex flex-col gap-3">
            {marcas.length === 0 && (
              <p className="text-sm text-[var(--fg-dim)]">
                Nenhuma marca cadastrada ainda.
              </p>
            )}
            {marcas.map((m) => (
              <div key={m.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{m.nome}</div>
                    <div className="text-sm text-[var(--fg-muted)] truncate">
                      {m.produto || "—"}
                    </div>
                    <div className="text-xs text-[var(--fg-dim)] mt-1">
                      {m.referencias.length} referência(s)
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => editar(m)}
                      className="btn btn-ghost px-3 py-1.5 text-xs"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => excluir(m.id)}
                      className="btn btn-danger px-3 py-1.5 text-xs"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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

function Thumb({
  src,
  nome,
  novo,
}: {
  src: string;
  nome: string;
  novo?: boolean;
}) {
  return (
    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--border)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={nome} className="w-full h-full object-cover" />
      {novo && (
        <span className="absolute top-1 right-1 chip !px-1.5 !py-0.5 text-[10px]">
          novo
        </span>
      )}
    </div>
  );
}
