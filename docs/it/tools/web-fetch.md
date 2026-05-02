---
read_when:
    - Vuoi recuperare un URL ed estrarre contenuti leggibili
    - È necessario configurare web_fetch o il suo fallback Firecrawl
    - Vuoi capire i limiti e la memorizzazione nella cache di web_fetch
sidebarTitle: Web Fetch
summary: strumento web_fetch -- recupero HTTP con estrazione del contenuto leggibile
title: Recupero web
x-i18n:
    generated_at: "2026-05-02T08:37:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

Lo strumento `web_fetch` esegue una semplice HTTP GET ed estrae contenuto leggibile
(da HTML a markdown o testo). **Non** esegue JavaScript.

Per siti molto dipendenti da JS o pagine protette da login, usa invece il
[Browser Web](/it/tools/browser).

## Avvio rapido

`web_fetch` è **abilitato per impostazione predefinita** -- non serve alcuna configurazione. L'agente può
chiamarlo immediatamente:

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
    Invia una HTTP GET con uno User-Agent simile a Chrome e l'header
    `Accept-Language`. Blocca nomi host privati/interni e ricontrolla i redirect.
  </Step>
  <Step title="Estrazione">
    Esegue Readability (estrazione del contenuto principale) sulla risposta HTML.
  </Step>
  <Step title="Fallback (opzionale)">
    Se Readability fallisce e Firecrawl è configurato, ritenta tramite la
    Firecrawl API con modalità di elusione dei bot.
  </Step>
  <Step title="Cache">
    I risultati vengono memorizzati nella cache per 15 minuti (configurabile) per ridurre i
    recuperi ripetuti dello stesso URL.
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
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Fallback Firecrawl

Se l'estrazione Readability fallisce, `web_fetch` può ricorrere a
[Firecrawl](/it/tools/firecrawl) per l'elusione dei bot e un'estrazione migliore:

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
  Se Firecrawl è abilitato e il suo SecretRef non è risolto senza fallback dell'env
  `FIRECRAWL_API_KEY`, l'avvio del Gateway fallisce subito.
</Note>

<Note>
  Gli override di `baseUrl` di Firecrawl sono bloccati: il traffico hosted usa
  `https://api.firecrawl.dev`; gli override self-hosted devono puntare a endpoint privati o
  interni, e `http://` è accettato solo per tali destinazioni private.
</Note>

Comportamento runtime attuale:

- `tools.web.fetch.provider` seleziona esplicitamente il provider di fallback per il recupero.
- Se `provider` viene omesso, OpenClaw rileva automaticamente il primo provider web-fetch
  pronto tra le credenziali disponibili. `web_fetch` non in sandbox può usare
  Plugin installati che dichiarano `contracts.webFetchProviders` e registrano un
  provider corrispondente a runtime. Oggi il provider incluso è Firecrawl.
- Le chiamate `web_fetch` in sandbox restano limitate ai provider inclusi.
- Se Readability è disabilitato, `web_fetch` passa direttamente al fallback del
  provider selezionato. Se non è disponibile alcun provider, fallisce in modo chiuso.

## Limiti e sicurezza

- `maxChars` è limitato a `tools.web.fetch.maxCharsCap`
- Il corpo della risposta è limitato a `maxResponseBytes` prima del parsing; le risposte
  troppo grandi vengono troncate con un avviso
- I nomi host privati/interni sono bloccati
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sono opt-in ristretti
  per stack proxy fake-IP attendibili; lasciali non impostati salvo che il tuo proxy possieda
  tali intervalli sintetici e applichi la propria policy di destinazione
- I redirect vengono controllati e limitati da `maxRedirects`
- `web_fetch` è best-effort -- alcuni siti richiedono il [Browser Web](/it/tools/browser)

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

- [Ricerca Web](/it/tools/web) -- cerca nel web con più provider
- [Browser Web](/it/tools/browser) -- automazione completa del browser per siti molto dipendenti da JS
- [Firecrawl](/it/tools/firecrawl) -- strumenti di ricerca e scraping di Firecrawl
