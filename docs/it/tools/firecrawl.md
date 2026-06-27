---
read_when:
    - Vuoi l'estrazione web basata su Firecrawl
    - Vuoi Firecrawl web_fetch senza chiave
    - Hai bisogno di una chiave API Firecrawl per la ricerca o per limiti più elevati
    - Vuoi Firecrawl come provider web_search
    - Vuoi l’estrazione anti-bot per web_fetch
summary: Ricerca, scraping e fallback web_fetch di Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:20:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw può usare **Firecrawl** in tre modi:

- come provider `web_search`
- come strumenti Plugin espliciti: `firecrawl_search` e `firecrawl_scrape`
- come estrattore di fallback per `web_fetch`

È un servizio hosted di estrazione/ricerca che supporta l’elusione dei bot e la cache,
utile con siti ricchi di JS o pagine che bloccano i semplici fetch HTTP.

## Installare il Plugin

Installa il Plugin ufficiale, poi riavvia il Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch senza chiave e chiavi API

Il fallback hosted Firecrawl `web_fetch` selezionato esplicitamente supporta l’accesso
starter senza una chiave API. Aggiungi `FIRECRAWL_API_KEY` nell’ambiente del Gateway
oppure configuralo quando hai bisogno di limiti più alti. Firecrawl `web_search` e
`firecrawl_scrape` richiedono una chiave API.

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

- Scegliere Firecrawl durante l’onboarding o `openclaw configure --section web` abilita automaticamente il Plugin Firecrawl installato.
- `web_search` con Firecrawl supporta `query` e `count`.
- Per controlli specifici di Firecrawl come `sources`, `categories` o scraping dei risultati, usa `firecrawl_search`.
- `baseUrl` usa per impostazione predefinita Firecrawl hosted su `https://api.firecrawl.dev`. Gli override self-hosted sono consentiti solo per endpoint privati/interni; HTTP è accettato solo per quei target privati.
- `FIRECRAWL_BASE_URL` è il fallback env condiviso per gli URL di base di ricerca e scrape Firecrawl.

## Configurare il fallback Firecrawl per web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- Il fallback Firecrawl `web_fetch` selezionato esplicitamente funziona senza una chiave API. Quando configurato, OpenClaw invia `plugins.entries.firecrawl.config.webFetch.apiKey` o `FIRECRAWL_API_KEY` per limiti più alti.
- Scegliere Firecrawl durante l’onboarding o `openclaw configure --section web` abilita il Plugin e seleziona Firecrawl per `web_fetch`, a meno che non sia già configurato un altro provider di fetch.
- `firecrawl_scrape` richiede una chiave API.
- `maxAgeMs` controlla quanto possono essere vecchi i risultati in cache (ms). Il valore predefinito è 2 giorni.
- La configurazione legacy `tools.web.fetch.firecrawl.*` viene migrata automaticamente da `openclaw doctor --fix`.
- Gli override degli URL di scrape/base Firecrawl seguono la stessa regola hosted/privato della ricerca: il traffico pubblico hosted usa `https://api.firecrawl.dev`; gli override self-hosted devono risolversi in endpoint privati/interni.
- `firecrawl_scrape` rifiuta URL target ovviamente privati, loopback, metadata e non HTTP(S) prima di inoltrarli a Firecrawl, rispettando il contratto di sicurezza dei target di `web_fetch` per le chiamate esplicite di scrape Firecrawl.

`firecrawl_scrape` riutilizza le stesse impostazioni e variabili env `plugins.entries.firecrawl.config.webFetch.*`, inclusa la chiave API richiesta.

### Firecrawl self-hosted

Imposta `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` o `FIRECRAWL_BASE_URL`
quando esegui Firecrawl autonomamente. OpenClaw accetta `http://` solo per target loopback,
di rete privata, `.local`, `.internal` o `.localhost`. Gli host personalizzati pubblici
vengono rifiutati per evitare che le chiavi API Firecrawl vengano inviate per errore a endpoint arbitrari.

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

Usalo per pagine ricche di JS o protette da bot, dove il semplice `web_fetch` è debole.

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

Firecrawl espone un parametro **proxy mode** per l’elusione dei bot (`basic`, `stealth` o `auto`).
OpenClaw usa sempre `proxy: "auto"` più `storeInCache: true` per le richieste Firecrawl.
Se proxy viene omesso, Firecrawl usa `auto` per impostazione predefinita. `auto` riprova con proxy stealth se un tentativo basic fallisce, il che può usare più crediti
rispetto allo scraping solo basic.

## Come `web_fetch` usa Firecrawl

Ordine di estrazione di `web_fetch`:

1. Readability (locale)
2. Firecrawl (quando selezionato o rilevato automaticamente dalle credenziali configurate)
3. Pulizia HTML di base (ultimo fallback)

Il controllo di selezione è `tools.web.fetch.provider`. Se lo ometti, OpenClaw
rileva automaticamente il primo provider web-fetch pronto dalle credenziali disponibili.
Il Plugin ufficiale Firecrawl fornisce quel fallback.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e rilevamento automatico
- [Web Fetch](/it/tools/web-fetch) -- strumento web_fetch con fallback Firecrawl
- [Tavily](/it/tools/tavily) -- strumenti di ricerca + estrazione
