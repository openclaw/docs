---
read_when:
    - Si desidera l'estrazione web basata su Firecrawl
    - Si desidera Firecrawl Search senza chiave (gratuito) o web_fetch senza chiave
    - È necessaria una chiave API Firecrawl per la ricerca o per limiti più elevati
    - Si vuole usare Firecrawl come provider di web_search
    - Si desidera l’estrazione con protezione anti-bot per web_fetch
summary: Ricerca e scraping con Firecrawl e fallback di `web_fetch`
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T15:08:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw può usare **Firecrawl** in tre modi:

- come provider `web_search`
- come strumenti espliciti del plugin: `firecrawl_search` e `firecrawl_scrape`
- come estrattore di fallback per `web_fetch`

È un servizio ospitato di estrazione e ricerca che supporta l'aggiramento dei bot e la memorizzazione nella cache, utile per i siti che fanno largo uso di JS o per le pagine che bloccano le normali richieste HTTP.

## Installare il plugin

Installare il plugin ufficiale, quindi riavviare il Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Accesso senza chiave e chiavi API

Firecrawl registra due provider `web_search`:

- **Firecrawl Search** (`firecrawl`) — usa l'API `/v2/search` ospitata con la propria
  chiave; viene rilevato automaticamente quando è presente una chiave.
- **Firecrawl Search (Free)** (`firecrawl-free`) — usa il livello iniziale ospitato
  senza chiave; non è richiesta alcuna chiave API. È disponibile **solo previa adesione** e non viene mai selezionato automaticamente, poiché
  la selezione invia le query di ricerca al livello gratuito di Firecrawl.

Anche il fallback `web_fetch` di Firecrawl selezionato esplicitamente non richiede una chiave. Gli strumenti espliciti `firecrawl_search` e `firecrawl_scrape` richiedono una chiave API. Aggiungere
`FIRECRAWL_API_KEY` all'ambiente del Gateway o configurarlo per ottenere limiti più elevati.

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

- La scelta di Firecrawl durante l'onboarding o in `openclaw configure --section web` abilita automaticamente il plugin Firecrawl installato.
- Scegliere **Firecrawl Search (Free)** durante l'onboarding (oppure impostare `provider: "firecrawl-free"`) per l'esecuzione senza chiave API. Il provider **Firecrawl Search** con chiave invia `plugins.entries.firecrawl.config.webSearch.apiKey` o `FIRECRAWL_API_KEY`.
- `web_search` con Firecrawl supporta `query` e `count`.
- Per i controlli specifici di Firecrawl, come `sources`, `categories` o lo scraping dei risultati, usare `firecrawl_search`.
- `baseUrl` usa per impostazione predefinita Firecrawl ospitato all'indirizzo `https://api.firecrawl.dev`. Le sostituzioni self-hosted sono consentite solo per endpoint privati/interni; HTTP è accettato solo per tali destinazioni private.
- `FIRECRAWL_BASE_URL` è il fallback condiviso delle variabili di ambiente per gli URL di base della ricerca e dello scraping di Firecrawl.
- Le richieste di ricerca Firecrawl hanno per impostazione predefinita un timeout di 30 secondi; il parametro `timeoutSeconds` di `firecrawl_search` lo sostituisce per ogni chiamata.

## Configurare il fallback web_fetch di Firecrawl

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // la selezione esplicita abilita il fallback senza chiave
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

- Il fallback `web_fetch` di Firecrawl selezionato esplicitamente funziona senza una chiave API. Quando è configurato, OpenClaw invia `plugins.entries.firecrawl.config.webFetch.apiKey` o `FIRECRAWL_API_KEY` per ottenere limiti più elevati.
- La scelta di Firecrawl durante l'onboarding o in `openclaw configure --section web` abilita il plugin e seleziona Firecrawl per `web_fetch`, a meno che non sia già configurato un altro provider di recupero.
- `firecrawl_scrape` richiede una chiave API.
- `maxAgeMs` controlla l'età massima consentita per i risultati memorizzati nella cache (ms). Il valore predefinito è 172.800.000 ms (2 giorni).
- `onlyMainContent` usa per impostazione predefinita `true`; il valore predefinito di `timeoutSeconds` è 60.
- La configurazione legacy `tools.web.fetch.firecrawl.*` e `tools.web.search.firecrawl.*` viene migrata automaticamente da `openclaw doctor --fix`.
- Le sostituzioni degli URL di scraping/base di Firecrawl seguono la stessa regola ospitato/privato della ricerca: il traffico pubblico ospitato usa `https://api.firecrawl.dev`; le sostituzioni self-hosted devono risolversi in endpoint privati/interni.
- `firecrawl_scrape` rifiuta gli URL di destinazione palesemente privati, di loopback, di metadati e non HTTP(S) prima di inoltrarli a Firecrawl, in conformità al contratto di sicurezza delle destinazioni di `web_fetch` per le chiamate esplicite di scraping Firecrawl.

`firecrawl_scrape` riutilizza le stesse impostazioni e variabili di ambiente di `plugins.entries.firecrawl.config.webFetch.*`, inclusa la chiave API obbligatoria.

### Firecrawl self-hosted

Impostare `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` o `FIRECRAWL_BASE_URL` quando si esegue autonomamente Firecrawl. OpenClaw accetta `http://` solo per destinazioni di loopback, reti private, `.local`, `.internal` o `.localhost`. Gli host pubblici personalizzati vengono rifiutati per evitare che le chiavi API Firecrawl vengano inviate accidentalmente a endpoint arbitrari.

## Strumenti del plugin Firecrawl

### `firecrawl_search`

Usarlo quando sono necessari controlli di ricerca specifici di Firecrawl anziché il generico `web_search`. Richiede una chiave API.

Parametri:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (solo nomi host; si escludono a vicenda)
- `tbs` (filtro temporale, ad esempio `qdr:d`, `qdr:w`, `sbd:1`)
- `location` e `country` (targeting geografico)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Usarlo per pagine che fanno largo uso di JS o protette contro i bot, per le quali il semplice `web_fetch` risulta inefficace.

Parametri:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Modalità stealth / aggiramento dei bot

`firecrawl_scrape` e il fallback Firecrawl di `web_fetch` usano per impostazione predefinita `proxy: "auto"` insieme a `storeInCache: true`, a meno che il chiamante non sostituisca tali parametri. `firecrawl_search` e il provider Firecrawl di `web_search` non dispongono di controlli `proxy`/`storeInCache`; la modalità proxy stealth si applica solo alle richieste di scraping/recupero.

La modalità `proxy` di Firecrawl controlla l'aggiramento dei bot (`basic`, `stealth` o `auto`). `auto` riprova con proxy stealth se un tentativo di base non riesce, il che può consumare più crediti rispetto allo scraping esclusivamente di base.

## Come `web_fetch` usa Firecrawl

Ordine di estrazione di `web_fetch`:

1. Readability (locale)
2. Provider di recupero configurato, ad esempio Firecrawl (se selezionato o rilevato automaticamente dalle credenziali configurate)
3. Pulizia HTML di base (ultimo fallback)

Il controllo di selezione è `tools.web.fetch.provider`. Se viene omesso, OpenClaw rileva automaticamente il primo provider di recupero web pronto in base alle credenziali disponibili. Il plugin ufficiale Firecrawl fornisce tale fallback.

## Argomenti correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Recupero web](/it/tools/web-fetch) -- strumento web_fetch con fallback Firecrawl
- [Tavily](/it/tools/tavily) -- strumenti di ricerca ed estrazione
