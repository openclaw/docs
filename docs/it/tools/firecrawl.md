---
read_when:
    - Vuoi l'estrazione web supportata da Firecrawl
    - Hai bisogno di una chiave API Firecrawl
    - Vuoi Firecrawl come provider web_search
    - Vuoi l'estrazione anti-bot per web_fetch
summary: Fallback di Firecrawl per ricerca, scraping e web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T08:35:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw può usare **Firecrawl** in tre modi:

- come provider `web_search`
- come strumenti Plugin espliciti: `firecrawl_search` e `firecrawl_scrape`
- come estrattore di fallback per `web_fetch`

È un servizio ospitato di estrazione/ricerca che supporta l'aggiramento dei bot e la cache,
utile con siti ricchi di JS o pagine che bloccano i recuperi HTTP semplici.

## Ottieni una chiave API

1. Crea un account Firecrawl e genera una chiave API.
2. Salvala nella configurazione oppure imposta `FIRECRAWL_API_KEY` nell'ambiente del gateway.

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
- `baseUrl` usa come predefinito Firecrawl ospitato su `https://api.firecrawl.dev`. Gli override self-hosted sono consentiti solo per endpoint privati/interni; HTTP è accettato solo per quei target privati.
- `FIRECRAWL_BASE_URL` è il fallback env condiviso per gli URL di base di ricerca e scrape Firecrawl.

## Configura scrape Firecrawl + fallback web_fetch

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
- `maxAgeMs` controlla quanto possono essere vecchi i risultati in cache (ms). Il valore predefinito è 2 giorni.
- La configurazione legacy `tools.web.fetch.firecrawl.*` viene migrata automaticamente da `openclaw doctor --fix`.
- Gli override dell'URL di scrape/base Firecrawl seguono la stessa regola hosted/privata della ricerca: il traffico pubblico ospitato usa `https://api.firecrawl.dev`; gli override self-hosted devono risolversi in endpoint privati/interni.
- `firecrawl_scrape` rifiuta URL di target evidentemente privati, loopback, metadata e non HTTP(S) prima di inoltrarli a Firecrawl, rispettando il contratto di sicurezza dei target di `web_fetch` per le chiamate esplicite di scrape Firecrawl.

`firecrawl_scrape` riutilizza le stesse impostazioni `plugins.entries.firecrawl.config.webFetch.*` e le stesse variabili env.

### Firecrawl self-hosted

Imposta `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` o `FIRECRAWL_BASE_URL`
quando esegui Firecrawl autonomamente. OpenClaw accetta `http://` solo per target loopback,
su rete privata, `.local`, `.internal` o `.localhost`. Gli host pubblici personalizzati
vengono rifiutati in modo che le chiavi API Firecrawl non vengano inviate per errore a endpoint arbitrari.

## Strumenti Plugin Firecrawl

### `firecrawl_search`

Usalo quando vuoi controlli di ricerca specifici di Firecrawl invece di `web_search` generico.

Parametri principali:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Usalo per pagine ricche di JS o protette da bot dove `web_fetch` semplice è debole.

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

Firecrawl espone un parametro **proxy mode** per l'aggiramento dei bot (`basic`, `stealth` o `auto`).
OpenClaw usa sempre `proxy: "auto"` più `storeInCache: true` per le richieste Firecrawl.
Se proxy viene omesso, Firecrawl usa `auto` per impostazione predefinita. `auto` ritenta con proxy stealth se un tentativo basic fallisce, il che può usare più crediti
rispetto allo scraping solo basic.

## Come `web_fetch` usa Firecrawl

Ordine di estrazione di `web_fetch`:

1. Readability (locale)
2. Firecrawl (se selezionato o rilevato automaticamente come fallback web-fetch attivo)
3. Pulizia HTML di base (ultimo fallback)

Il selettore è `tools.web.fetch.provider`. Se lo ometti, OpenClaw
rileva automaticamente il primo provider web-fetch pronto tra le credenziali disponibili.
Oggi il provider incluso è Firecrawl.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e rilevamento automatico
- [Web Fetch](/it/tools/web-fetch) -- strumento web_fetch con fallback Firecrawl
- [Tavily](/it/tools/tavily) -- strumenti di ricerca + estrazione
