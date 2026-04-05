---
read_when:
    - Vuoi un'estrazione web supportata da Firecrawl
    - Hai bisogno di una chiave API Firecrawl
    - Vuoi Firecrawl come provider `web_search`
    - Vuoi un'estrazione anti-bot per `web_fetch`
summary: Ricerca, scraping e fallback `web_fetch` con Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-04-05T14:06:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f17fc4b8e81e1bfe25f510b0a64ab0d50c4cc95bcf88d6ba7c62cece26162e
    source_path: tools/firecrawl.md
    workflow: 15
---

# Firecrawl

OpenClaw può usare **Firecrawl** in tre modi:

- come provider `web_search`
- come strumenti del plugin espliciti: `firecrawl_search` e `firecrawl_scrape`
- come estrattore di fallback per `web_fetch`

È un servizio ospitato di estrazione/ricerca che supporta l'elusione dei bot e la cache,
utile per siti ricchi di JS o pagine che bloccano i normali fetch HTTP.

## Ottenere una chiave API

1. Crea un account Firecrawl e genera una chiave API.
2. Memorizzala nella configurazione oppure imposta `FIRECRAWL_API_KEY` nell'ambiente del gateway.

## Configurare la ricerca Firecrawl

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

- Selezionare Firecrawl durante l'onboarding o con `openclaw configure --section web` abilita automaticamente il plugin Firecrawl incluso.
- `web_search` con Firecrawl supporta `query` e `count`.
- Per controlli specifici di Firecrawl come `sources`, `categories` o lo scraping dei risultati, usa `firecrawl_search`.
- Gli override di `baseUrl` devono rimanere su `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` è il fallback env condiviso per gli URL base di ricerca e scraping Firecrawl.

## Configurare lo scraping Firecrawl + fallback `web_fetch`

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

- I tentativi di fallback Firecrawl vengono eseguiti solo quando è disponibile una chiave API (`plugins.entries.firecrawl.config.webFetch.apiKey` o `FIRECRAWL_API_KEY`).
- `maxAgeMs` controlla quanto vecchi possono essere i risultati in cache (ms). Il valore predefinito è 2 giorni.
- La configurazione legacy `tools.web.fetch.firecrawl.*` viene migrata automaticamente da `openclaw doctor --fix`.
- Gli override degli URL base di scraping/base Firecrawl sono limitati a `https://api.firecrawl.dev`.

`firecrawl_scrape` riutilizza le stesse impostazioni `plugins.entries.firecrawl.config.webFetch.*` e le stesse variabili env.

## Strumenti del plugin Firecrawl

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

Usalo per pagine ricche di JS o protette da bot dove il normale `web_fetch` è debole.

Parametri principali:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / elusione dei bot

Firecrawl espone un parametro **proxy mode** per l'elusione dei bot (`basic`, `stealth` o `auto`).
OpenClaw usa sempre `proxy: "auto"` insieme a `storeInCache: true` per le richieste Firecrawl.
Se `proxy` viene omesso, Firecrawl usa `auto` per impostazione predefinita. `auto` riprova con proxy stealth se un tentativo basic fallisce, il che può consumare più crediti
rispetto allo scraping solo basic.

## Come `web_fetch` usa Firecrawl

Ordine di estrazione di `web_fetch`:

1. Readability (locale)
2. Firecrawl (se selezionato o rilevato automaticamente come fallback web-fetch attivo)
3. Pulizia HTML di base (ultimo fallback)

La leva di selezione è `tools.web.fetch.provider`. Se la ometti, OpenClaw
rileva automaticamente il primo provider web-fetch pronto dalle credenziali disponibili.
Attualmente il provider incluso è Firecrawl.

## Correlati

- [Panoramica Web Search](/tools/web) -- tutti i provider e il rilevamento automatico
- [Web Fetch](/tools/web-fetch) -- strumento `web_fetch` con fallback Firecrawl
- [Tavily](/tools/tavily) -- strumenti di ricerca + estrazione
