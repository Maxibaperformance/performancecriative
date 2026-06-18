// Leitura best-effort de uma página de produto: pega título, descrição e imagem
// principal via OpenGraph / meta tags. Não depende de bibliotecas externas.
import type { ProdutoInfo } from "./types";

function meta(html: string, ...names: string[]): string | undefined {
  for (const name of names) {
    // property="og:title" content="..."  (em qualquer ordem)
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`,
      "i"
    );
    const tag = html.match(re)?.[0];
    if (tag) {
      const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
      if (content) return decodeEntities(content.trim());
    }
  }
  return undefined;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function absolutizar(src: string | undefined, base: string): string | undefined {
  if (!src) return undefined;
  try {
    return new URL(src, base).toString();
  } catch {
    return undefined;
  }
}

export async function lerProduto(url: string): Promise<ProdutoInfo> {
  let html = "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    html = await res.text();
  } catch {
    return { url, titulo: "", descricao: "" };
  }

  const titulo =
    meta(html, "og:title", "twitter:title") ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    "";

  const descricao =
    meta(html, "og:description", "twitter:description", "description") || "";

  const imagem = absolutizar(
    meta(html, "og:image", "og:image:url", "twitter:image"),
    url
  );

  return {
    url,
    titulo: decodeEntities(titulo),
    descricao,
    imagemUrl: imagem,
  };
}
