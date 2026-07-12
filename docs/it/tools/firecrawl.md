---
read_when:
    - Vuoi l'estrazione web basata su Firecrawl
    - Vuoi usare `web_fetch` di Firecrawl senza chiavi
    - Hai bisogno di una chiave API Firecrawl per la ricerca o per limiti più elevati
    - Vuoi usare Firecrawl come provider di web_search
    - Vuoi l'estrazione con protezione anti-bot per web_fetch
summary: Ricerca e scraping con Firecrawl e fallback di web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T07:37:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw può usare **Firecrawl** in tre modi:

- come provider di `web_search`
- come strumenti Plugin espliciti: `firecrawl_search` e `firecrawl_scrape`
- come estrattore di riserva per `web_fetch`

È un servizio ospitato di estrazione e ricerca che supporta l'aggiramento dei bot e la memorizzazione nella cache, risultando utile con siti che fanno largo uso di JavaScript o pagine che bloccano le normali richieste HTTP.

## Installare il Plugin

Installa il Plugin ufficiale, quindi riavvia il Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch senza chiave e chiavi API

Il fallback `web_fetch` ospitato di Firecrawl selezionato esplicitamente offre un accesso iniziale senza chiave API. Aggiungi `FIRECRAWL_API_KEY` nell'ambiente del Gateway o configuralo quando hai bisogno di limiti più elevati. `web_search` e `firecrawl_scrape` di Firecrawl richiedono una chiave API.

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

- La scelta di Firecrawl durante la configurazione iniziale o tramite `openclaw configure --section web` abilita automaticamente il Plugin Firecrawl installato.
- `web_search` con Firecrawl supporta `query` e `count`.
- Per controlli specifici di Firecrawl come `sources`, `categories` o l'estrazione dei risultati, usa `firecrawl_search`.
- Il valore predefinito di `baseUrl` è il servizio Firecrawl ospitato all'indirizzo `https://api.firecrawl.dev`. Le sostituzioni con servizi self-hosted sono consentite solo per endpoint privati/interni; HTTP è accettato solo per tali destinazioni private.
- `FIRECRAWL_BASE_URL` è il valore di riserva condiviso dell'ambiente per gli URL di base di ricerca ed estrazione di Firecrawl.
- Le richieste di ricerca Firecrawl hanno un timeout predefinito di 30 secondi; il parametro `timeoutSeconds` di `firecrawl_search` lo sostituisce per ogni chiamata.

## Configurare il fallback web_fetch di Firecrawl

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

- Il fallback `web_fetch` di Firecrawl selezionato esplicitamente funziona senza una chiave API. Se configurata, OpenClaw invia `plugins.entries.firecrawl.config.webFetch.apiKey` o `FIRECRAWL_API_KEY` per ottenere limiti più elevati.
- La scelta di Firecrawl durante la configurazione iniziale o tramite `openclaw configure --section web` abilita il Plugin e seleziona Firecrawl per `web_fetch`, a meno che non sia già configurato un altro provider di recupero.
- `firecrawl_scrape` richiede una chiave API.
- `maxAgeMs` controlla l'età massima consentita per i risultati nella cache (ms). Il valore predefinito è 172.800.000 ms (2 giorni).
- Il valore predefinito di `onlyMainContent` è `true`; quello di `timeoutSeconds` è 60.
- La configurazione legacy `tools.web.fetch.firecrawl.*` e `tools.web.search.firecrawl.*` viene migrata automaticamente da `openclaw doctor --fix`.
- Le sostituzioni dell'URL di base e di estrazione di Firecrawl seguono la stessa regola ospitato/privato della ricerca: il traffico pubblico ospitato usa `https://api.firecrawl.dev`; le sostituzioni self-hosted devono risolversi in endpoint privati/interni.
- `firecrawl_scrape` rifiuta URL di destinazione palesemente privati, di loopback, di metadati e non HTTP(S) prima di inoltrarli a Firecrawl, rispettando il contratto di sicurezza delle destinazioni di `web_fetch` per le chiamate esplicite di estrazione Firecrawl.

`firecrawl_scrape` riutilizza le stesse impostazioni e variabili di ambiente `plugins.entries.firecrawl.config.webFetch.*`, inclusa la chiave API obbligatoria.

### Firecrawl self-hosted

Imposta `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` o `FIRECRAWL_BASE_URL` quando esegui autonomamente Firecrawl. OpenClaw accetta `http://` solo per destinazioni di loopback, reti private, `.local`, `.internal` o `.localhost`. Gli host pubblici personalizzati vengono rifiutati per evitare che le chiavi API di Firecrawl siano inviate accidentalmente a endpoint arbitrari.

## Strumenti del Plugin Firecrawl

### `firecrawl_search`

Usalo quando vuoi controlli di ricerca specifici di Firecrawl anziché il generico `web_search`.

Parametri:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Usalo per pagine che fanno largo uso di JavaScript o sono protette dai bot, per le quali il normale `web_fetch` è poco efficace.

Parametri:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Modalità invisibile / aggiramento dei bot

`firecrawl_scrape` e il fallback Firecrawl di `web_fetch` usano per impostazione predefinita `proxy: "auto"` insieme a `storeInCache: true`, a meno che il chiamante non sostituisca tali parametri. `firecrawl_search` e il provider Firecrawl di `web_search` non dispongono dei controlli `proxy`/`storeInCache`; la modalità proxy invisibile si applica solo alle richieste di estrazione/recupero.

La modalità `proxy` di Firecrawl controlla l'aggiramento dei bot (`basic`, `stealth` o `auto`). `auto` riprova con proxy invisibili se un tentativo di base non riesce, il che può utilizzare più crediti rispetto all'estrazione esclusivamente di base.

## Come `web_fetch` usa Firecrawl

Ordine di estrazione di `web_fetch`:

1. Readability (locale)
2. Provider di recupero configurato, come Firecrawl (quando selezionato o rilevato automaticamente dalle credenziali configurate)
3. Pulizia HTML di base (ultimo fallback)

L'opzione di selezione è `tools.web.fetch.provider`. Se la ometti, OpenClaw rileva automaticamente il primo provider di recupero web pronto in base alle credenziali disponibili. Il Plugin Firecrawl ufficiale fornisce tale fallback.

## Argomenti correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Recupero web](/it/tools/web-fetch) -- strumento web_fetch con fallback Firecrawl
- [Tavily](/it/tools/tavily) -- strumenti di ricerca ed estrazione
