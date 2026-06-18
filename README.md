# Performance Criativa

Sistema de **engenharia reversa de criativos**: você sobe um anúncio estático de
referência → o sistema **lê e disseca** (texto, funil, nível de consciência,
ângulo, nota 0–100) → e **recria com o seu produto**, entregando **direção visual +
brief + copy** prontos pro designer (e a **imagem**, se o Gemini estiver ativo).

## Arquitetura híbrida

| Etapa | Modelo |
|---|---|
| Ler / analisar o criativo de referência (visão) | **Claude** (`claude-opus-4-8`) |
| Copy + briefing + direção visual | **Claude** |
| Gerar a IMAGEM do criativo (opcional) | **Gemini** (`gemini-3.1-flash-image`) |

> A Anthropic não gera imagens — por isso a imagem fica com o Gemini, como um
> plugue opcional. Sem a chave do Gemini, você ainda recebe análise + copy + brief
> + direção visual (o briefing pronto pro designer).

## Como funciona

```
SUBIR ANÚNCIO DE REFERÊNCIA      ANÁLISE (Claude)              RECRIAR COM SEU PRODUTO
(Biblioteca de Anúncios)    →    texto extraído, funil,   →   URL do produto + marca
                                 nível, ângulo, nota 0-100      ↓
                                 validar / reclassificar       copy + brief + direção visual
                                                                + imagem (se Gemini ativo)
```

## Rodando localmente

1. Instale as dependências (já feito): `npm install`

2. Configure as chaves:
   ```bash
   cp .env.local.example .env.local
   ```
   - `ANTHROPIC_API_KEY` (**obrigatória**) — https://console.anthropic.com/settings/keys
   - `GEMINI_API_KEY` (**opcional**, pra gerar imagem) — https://aistudio.google.com/apikey

3. Rode: `npm run dev` → http://localhost:3000

## Fluxo de uso

1. **Marcas** → cadastre o contexto (DNA) de cada marca.
2. **Analisar** → suba o anúncio de referência, veja a análise completa, valide/reclassifique.
3. **Recriar** (no mesmo card) → cole a URL do seu produto, escolha clonar/inspirar → recebe copy + brief + direção visual (+ imagem se o Gemini estiver ativo).
4. **Histórico** → todas as análises e recriações.

## Estrutura

```
app/
  analisar/             Fluxo principal: análise → recriação
  estudio/              Criar do zero (copy + brief)
  marcas/               Contexto por marca
  historico/            Análises + recriações
  api/{analisar,analises,recriar,gerar,marcas,criativos}
lib/
  anthropic.ts          Claude: análise (visão) + copy/brief/direção visual
  geminiImage.ts        Gemini: geração de imagem (opcional)
  taxonomia.ts          Rubrica de performance + taxonomia (calibre aqui)
  scrape.ts             Leitura de produto por URL
  store.ts              Camada de dados local (trocar por DB depois)
  types.ts / config.ts
```

## Próximos passos (produto de equipe)

- Trocar `lib/store.ts` por banco (Supabase/Postgres) + storage de imagens.
- Autenticação e separação por cliente/marca.
- Deploy: o filesystem local não persiste na Vercel — migrar storage antes.
