"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "◧" },
  { href: "/inspiracoes", label: "Inspirações", icon: "✧" },
  { href: "/analisar", label: "Análise rápida", icon: "🔍" },
  { href: "/estudio", label: "Criar do zero", icon: "✦" },
  { href: "/marcas", label: "Marcas", icon: "◆" },
  { href: "/historico", label: "Histórico", icon: "▤" },
];

export function Sidebar() {
  const pathname = usePathname();

  // Login não tem navbar.
  if (pathname === "/login") return null;

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="w-60 shrink-0 border-r border-[var(--border)] bg-[var(--bg-elev)]/60 backdrop-blur px-4 py-6 flex flex-col gap-8 sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-2.5 px-2">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white font-bold text-lg">
          P
        </span>
        <span className="font-semibold leading-tight">
          Performance
          <br />
          <span className="text-[var(--fg-muted)] text-xs font-normal">
            Criativa
          </span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {links.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--fg)] border border-[var(--border)]"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-card)]"
              }`}
            >
              <span className="text-[var(--accent)] w-4 text-center">
                {l.icon}
              </span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={sair}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-card)] transition-colors"
        >
          <span className="w-4 text-center">⏻</span>
          Sair
        </button>
        <div className="text-xs text-[var(--fg-dim)] px-2 leading-relaxed">
          Análise: Claude
          <br />
          Imagem: Gemini (opcional)
        </div>
      </div>
    </aside>
  );
}
