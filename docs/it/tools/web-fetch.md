---
read_when:
    - Vuoi recuperare un URL ed estrarre contenuto leggibile
    - Ti serve configurare `web_fetch` o il suo fallback Firecrawl
    - Vuoi capire i limiti e la cache di `web_fetch`
sidebarTitle: Web Fetch
summary: Strumento `web_fetch` -- recupero HTTP con estrazione di contenuto leggibile
title: Recupero web
x-i18n:
    generated_at: "2026-04-24T09:08:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

Lo strumento `web_fetch` esegue un semplice HTTP GET ed estrae contenuto leggibile
(da HTML a markdown o testo). **Non** esegue JavaScript.

Per siti pesanti in JS o pagine protette da login, usa invece il
[Web Browser](/it/tools/browser).

## Avvio rapido

`web_fetch` è **abilitato per impostazione predefinita** -- non serve alcuna configurazione. L'agente può
chiamarlo subito:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parametri dello strumento

<ParamField path="url" type="string" required>
URL da recuperare. Solo `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Formato di output dopo l'estrazione del contenuto principale.
</ParamField>

<ParamField path="maxChars" type="number">
Tronca l'output a questo numero di caratteri.
</ParamField>

## Come funziona

<Steps>
  <Step title="Recupero">
    Invia un HTTP GET con uno User-Agent simile a Chrome e header `Accept-Language`.
    Blocca hostname privati/interni e ricontrolla i redirect.
  </Step>
  <Step title="Estrazione">
    Esegue Readability (estrazione del contenuto principale) sulla risposta HTML.
  </Step>
  <Step title="Fallback (facoltativo)">
    Se Readability fallisce e Firecrawl è configurato, riprova tramite la
    API Firecrawl con modalità di aggiramento bot.
  </Step>
  <Step title="Cache">
    I risultati vengono messi in cache per 15 minuti (configurabile) per ridurre
    recuperi ripetuti dello stesso URL.
  </Step>
</Steps>

## Configurazione

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // predefinito: true
        provider: "firecrawl", // facoltativo; ometti per auto-rilevamento
        maxChars: 50000, // massimo caratteri in output
        maxCharsCap: 50000, // limite rigido per il parametro maxChars
        maxResponseBytes: 2000000, // dimensione massima download prima del troncamento
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // usa estrazione Readability
        userAgent: "Mozilla/5.0 ...", // override dello User-Agent
      },
    },
  },
}
```

## Fallback Firecrawl

Se l'estrazione Readability fallisce, `web_fetch` può fare fallback a
[Firecrawl](/it/tools/firecrawl) per aggiramento bot e migliore estrazione:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // facoltativo; ometti per auto-rilevamento dalle credenziali disponibili
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // facoltativo se FIRECRAWL_API_KEY è impostata
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // durata cache (1 giorno)
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
  Se Firecrawl è abilitato e il suo SecretRef non viene risolto senza
  fallback env `FIRECRAWL_API_KEY`, l'avvio del gateway fallisce immediatamente.
</Note>

<Note>
  Gli override `baseUrl` di Firecrawl sono bloccati: devono usare `https://` e
  l'host ufficiale Firecrawl (`api.firecrawl.dev`).
</Note>

Comportamento runtime attuale:

- `tools.web.fetch.provider` seleziona esplicitamente il provider di fallback per il fetch.
- Se `provider` è omesso, OpenClaw auto-rileva il primo provider web-fetch pronto
  dalle credenziali disponibili. Oggi il provider integrato è Firecrawl.
- Se Readability è disabilitato, `web_fetch` salta direttamente al fallback del
  provider selezionato. Se nessun provider è disponibile, fallisce in modo chiuso.

## Limiti e sicurezza

- `maxChars` viene limitato a `tools.web.fetch.maxCharsCap`
- Il body della risposta è limitato a `maxResponseBytes` prima del parsing; le risposte
  troppo grandi vengono troncate con un avviso
- Gli hostname privati/interni vengono bloccati
- I redirect vengono controllati e limitati da `maxRedirects`
- `web_fetch` è best-effort -- alcuni siti richiedono il [Web Browser](/it/tools/browser)

## Profili strumento

Se usi profili strumento o allowlist, aggiungi `web_fetch` o `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // oppure: allow: ["group:web"]  (include web_fetch, web_search e x_search)
  },
}
```

## Correlati

- [Web Search](/it/tools/web) -- ricerca sul web con più provider
- [Web Browser](/it/tools/browser) -- automazione completa del browser per siti pesanti in JS
- [Firecrawl](/it/tools/firecrawl) -- strumenti Firecrawl di ricerca e scraping
