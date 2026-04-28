---
read_when:
    - Você quer extração web com backend Firecrawl
    - Você precisa de uma chave de API do Firecrawl
    - Você quer o Firecrawl como provider de `web_search`
    - Você quer extração anti-bot para `web_fetch`
summary: Busca, scrape e fallback de `web_fetch` do Firecrawl
title: Firecrawl
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T06:16:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 15
---

O OpenClaw pode usar o **Firecrawl** de três formas:

- como provider de `web_search`
- como tools explícitas do plugin: `firecrawl_search` e `firecrawl_scrape`
- como extrator de fallback para `web_fetch`

É um serviço hospedado de extração/busca que oferece suporte a contorno de bot e cache,
o que ajuda com sites pesados em JS ou páginas que bloqueiam buscas HTTP simples.

## Obter uma chave de API

1. Crie uma conta no Firecrawl e gere uma chave de API.
2. Armazene-a na configuração ou defina `FIRECRAWL_API_KEY` no ambiente do gateway.

## Configurar busca Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Observações:

- Escolher Firecrawl no onboarding ou em `openclaw configure --section web` habilita automaticamente o plugin integrado Firecrawl.
- `web_search` com Firecrawl oferece suporte a `query` e `count`.
- Para controles específicos do Firecrawl, como `sources`, `categories` ou scrape de resultados, use `firecrawl_search`.
- Substituições de `baseUrl` devem permanecer em `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` é o fallback compartilhado de env para URLs base de busca e scrape do Firecrawl.

## Configurar scrape do Firecrawl + fallback de web_fetch

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Observações:

- Tentativas de fallback do Firecrawl só são executadas quando uma chave de API está disponível (`plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY`).
- `maxAgeMs` controla a idade máxima permitida para resultados em cache (ms). O padrão é 2 dias.
- Configuração legada `tools.web.fetch.firecrawl.*` é migrada automaticamente por `openclaw doctor --fix`.
- Substituições de scrape/base URL do Firecrawl são restritas a `https://api.firecrawl.dev`.

`firecrawl_scrape` reutiliza as mesmas configurações e variáveis de ambiente `plugins.entries.firecrawl.config.webFetch.*`.

## Tools do plugin Firecrawl

### `firecrawl_search`

Use isto quando quiser controles de busca específicos do Firecrawl em vez de `web_search` genérico.

Parâmetros principais:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Use isto para páginas pesadas em JS ou protegidas contra bots, onde `web_fetch` simples é fraco.

Parâmetros principais:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / contorno de bot

O Firecrawl expõe um parâmetro de **modo proxy** para contorno de bot (`basic`, `stealth` ou `auto`).
O OpenClaw sempre usa `proxy: "auto"` mais `storeInCache: true` para requisições Firecrawl.
Se `proxy` for omitido, o Firecrawl usa `auto` por padrão. `auto` tenta novamente com proxies stealth se uma tentativa básica falhar, o que pode usar mais créditos
do que scrape somente básico.

## Como `web_fetch` usa o Firecrawl

Ordem de extração do `web_fetch`:

1. Readability (local)
2. Firecrawl (se selecionado ou detectado automaticamente como o fallback ativo de web-fetch)
3. Limpeza básica de HTML (último fallback)

O controle de seleção é `tools.web.fetch.provider`. Se você o omitir, o OpenClaw
detecta automaticamente o primeiro provider de web-fetch pronto a partir das credenciais disponíveis.
Hoje o provider integrado é o Firecrawl.

## Relacionado

- [Visão geral do Web Search](/pt-BR/tools/web) -- todos os providers e detecção automática
- [Web Fetch](/pt-BR/tools/web-fetch) -- tool `web_fetch` com fallback do Firecrawl
- [Tavily](/pt-BR/tools/tavily) -- tools de busca + extração
