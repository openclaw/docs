---
read_when:
    - Vuoi l'estrazione web supportata da Firecrawl
    - Ti serve una chiave API Firecrawl
    - Vuoi Firecrawl come provider `web_search`
    - Vuoi l'estrazione anti-bot per `web_fetch`
summary: Ricerca Firecrawl, scraping e fallback di web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-04-24T09:05:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 15
---

OpenClaw può usare **Firecrawl** in tre modi:

- come provider `web_search`
- come strumenti espliciti del Plugin: `firecrawl_search` e `firecrawl_scrape`
- come estrattore fallback per `web_fetch`

È un servizio hosted di estrazione/ricerca che supporta aggiramento dei bot e caching,
utile per siti pesanti in JS o pagine che bloccano le semplici fetch HTTP.

## Ottieni una chiave API

1. Crea un account Firecrawl e genera una chiave API.
2. Memorizzala nella configurazione oppure imposta `FIRECRAWL_API_KEY` nell'ambiente del gateway.

## Configura la ricerca Firecrawl

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

Note:

- Scegliere Firecrawl durante l'onboarding o con `openclaw configure --section web` abilita automaticamente il Plugin Firecrawl incluso.
- `web_search` con Firecrawl supporta `query` e `count`.
- Per controlli specifici di Firecrawl come `sources`, `categories` o scraping dei risultati, usa `firecrawl_search`.
- Gli override di `baseUrl` devono restare su `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` è il fallback env condiviso per i base URL di ricerca e scraping Firecrawl.

## Configura lo scraping Firecrawl + fallback di `web_fetch`

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

Note:

- I tentativi fallback di Firecrawl vengono eseguiti solo quando è disponibile una chiave API (`plugins.entries.firecrawl.config.webFetch.apiKey` oppure `FIRECRAWL_API_KEY`).
- `maxAgeMs` controlla quanto vecchi possono essere i risultati in cache (ms). Il valore predefinito è 2 giorni.
- La configurazione legacy `tools.web.fetch.firecrawl.*` viene migrata automaticamente da `openclaw doctor --fix`.
- Gli override di scraping/base URL Firecrawl sono limitati a `https://api.firecrawl.dev`.

`firecrawl_scrape` riusa le stesse impostazioni e variabili env di `plugins.entries.firecrawl.config.webFetch.*`.

## Strumenti del Plugin Firecrawl

### `firecrawl_search`

Usalo quando vuoi controlli di ricerca specifici di Firecrawl invece del generico `web_search`.

Parametri principali:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Usalo per pagine pesanti in JS o protette da bot dove `web_fetch` semplice è debole.

Parametri principali:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / aggiramento dei bot

Firecrawl espone un parametro **proxy mode** per aggirare i bot (`basic`, `stealth` o `auto`).
OpenClaw usa sempre `proxy: "auto"` più `storeInCache: true` per le richieste Firecrawl.
Se `proxy` viene omesso, Firecrawl usa per impostazione predefinita `auto`. `auto` ritenta con proxy stealth se un tentativo basic fallisce, il che può consumare più crediti
rispetto allo scraping solo basic.

## Come `web_fetch` usa Firecrawl

Ordine di estrazione di `web_fetch`:

1. Readability (locale)
2. Firecrawl (se selezionato o auto-rilevato come fallback attivo di web-fetch)
3. Pulizia HTML di base (ultimo fallback)

La manopola di selezione è `tools.web.fetch.provider`. Se la ometti, OpenClaw
rileva automaticamente il primo provider web-fetch pronto dalle credenziali disponibili.
Oggi il provider incluso è Firecrawl.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e auto-rilevamento
- [Web Fetch](/it/tools/web-fetch) -- strumento web_fetch con fallback Firecrawl
- [Tavily](/it/tools/tavily) -- strumenti di ricerca + estrazione
