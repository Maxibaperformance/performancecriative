"use client";

import { useState } from "react";

export default function LoginPage() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      const data = await res.json().catch(() => ({}));
      setErro(data.erro || "Senha incorreta.");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white font-bold text-lg">
            P
          </span>
          <span className="font-semibold text-lg">
            Performance <span className="gradient-text">Criativa</span>
          </span>
        </div>

        <form onSubmit={entrar} className="card p-6">
          <h1 className="font-semibold mb-1">Acesso restrito</h1>
          <p className="text-sm text-[var(--fg-muted)] mb-5">
            Digite a senha para entrar no sistema.
          </p>

          <label className="label">Senha</label>
          <input
            type="password"
            className="input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            autoFocus
            autoComplete="current-password"
          />

          {erro && (
            <p className="text-sm text-[var(--danger)] mt-3">{erro}</p>
          )}

          <button
            type="submit"
            disabled={carregando || !senha}
            className="btn btn-primary w-full mt-5"
          >
            {carregando ? <span className="spinner" /> : null}
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
