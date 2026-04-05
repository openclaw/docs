---
read_when:
    - Vuoi recuperare un URL ed estrarre contenuti leggibili
    - Hai bisogno di configurare `web_fetch` o il suo fallback Firecrawl
    - Vuoi comprendere i limiti e la cache di `web_fetch`
sidebarTitle: Web Fetch
summary: Strumento web_fetch -- recupero HTTP con estrazione di contenuti leggibili
title: Web Fetch
x-i18n:
    generated_at: "2026-04-05T14:07:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60c933a25d0f4511dc1683985988e115b836244c5eac4c6667b67c8eb15401e0
    source_path: tools/web-fetch.md
    workflow: 15
---

# Web Fetch

Lo strumento `web_fetch` esegue una semplice richiesta HTTP GET ed estrae contenuti leggibili
(da HTML a markdown o testo). **Non** esegue JavaScript.

Per siti ricchi di JS o pagine protette da login, usa invece
[Web Browser](/tools/browser).

## Guida rapida

`web_fetch` è **abilitato per impostazione predefinita** -- non è necessaria alcuna configurazione. L'agente può
chiamarlo immediatamente:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parametri dello strumento

| Parametro     | Tipo     | Descrizione                                      |
| ------------- | -------- | ------------------------------------------------ |
| `url`         | `string` | URL da recuperare (obbligatorio, solo http/https) |
| `extractMode` | `string` | `"markdown"` (predefinito) o `"text"`            |
| `maxChars`    | `number` | Tronca l'output a questo numero di caratteri     |

## Come funziona

<Steps>
  <Step title="Recupero">
    Invia una richiesta HTTP GET con uno User-Agent simile a Chrome e l'header `Accept-Language`.
    Blocca hostname privati/interni e ricontrolla i redirect.
  </Step>
  <Step title="Estrazione">
    Esegue Readability (estrazione del contenuto principale) sulla risposta HTML.
  </Step>
  <Step title="Fallback (facoltativo)">
    Se Readability fallisce e Firecrawl è configurato, riprova tramite l'API
    Firecrawl con modalità di aggiramento dei bot.
  </Step>
  <Step title="Cache">
    I risultati vengono memorizzati in cache per 15 minuti (configurabile) per ridurre
    i recuperi ripetuti dello stesso URL.
  </Step>
</Steps>

## Configurazione

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
      },
    },
  },
}
```

## Fallback Firecrawl

Se l'estrazione con Readability fallisce, `web_fetch` può usare come fallback
[Firecrawl](/tools/firecrawl) per l'aggiramento dei bot e una migliore estrazione:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` supporta oggetti SecretRef.
La configurazione legacy `tools.web.fetch.firecrawl.*` viene migrata automaticamente da `openclaw doctor --fix`.

<Note>
  Se Firecrawl è abilitato e il suo SecretRef non è risolto senza
  fallback della variabile d'ambiente `FIRECRAWL_API_KEY`, l'avvio del gateway fallisce rapidamente.
</Note>

<Note>
  Le sovrascritture di `baseUrl` per Firecrawl sono rigidamente limitate: devono usare `https://` e
  l'host ufficiale di Firecrawl (`api.firecrawl.dev`).
</Note>

Comportamento attuale a runtime:

- `tools.web.fetch.provider` seleziona esplicitamente il provider di fallback per il recupero.
- Se `provider` viene omesso, OpenClaw rileva automaticamente il primo provider
  `web_fetch` pronto dalle credenziali disponibili. Attualmente il provider incluso è Firecrawl.
- Se Readability è disabilitato, `web_fetch` passa direttamente al fallback
  del provider selezionato. Se nessun provider è disponibile, fallisce in modo sicuro.

## Limiti e sicurezza

- `maxChars` è limitato a `tools.web.fetch.maxCharsCap`
- Il corpo della risposta è limitato a `maxResponseBytes` prima del parsing; le risposte
  troppo grandi vengono troncate con un avviso
- Gli hostname privati/interni sono bloccati
- I redirect vengono controllati e limitati da `maxRedirects`
- `web_fetch` è best-effort -- alcuni siti richiedono [Web Browser](/tools/browser)

## Profili degli strumenti

Se usi profili degli strumenti o allowlist, aggiungi `web_fetch` o `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Correlati

- [Web Search](/tools/web) -- cerca nel web con più provider
- [Web Browser](/tools/browser) -- automazione completa del browser per siti ricchi di JS
- [Firecrawl](/tools/firecrawl) -- strumenti Firecrawl per ricerca e scraping
