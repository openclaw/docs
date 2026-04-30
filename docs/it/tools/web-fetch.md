---
read_when:
    - Vuoi recuperare un URL ed estrarre contenuto leggibile
    - È necessario configurare web_fetch o il relativo meccanismo di riserva Firecrawl
    - Vuoi comprendere i limiti e la memorizzazione nella cache di web_fetch
sidebarTitle: Web Fetch
summary: strumento web_fetch -- recupero HTTP con estrazione di contenuto leggibile
title: Recupero dal web
x-i18n:
    generated_at: "2026-04-30T09:19:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

Lo strumento `web_fetch` esegue una semplice richiesta HTTP GET ed estrae contenuto leggibile
(da HTML a markdown o testo). **Non** esegue JavaScript.

Per siti molto basati su JS o pagine protette da login, usa invece il
[Browser web](/it/tools/browser).

## Avvio rapido

`web_fetch` è **abilitato per impostazione predefinita** -- non è necessaria alcuna configurazione. L'agente può
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
  <Step title="Fetch">
    Invia una richiesta HTTP GET con uno User-Agent simile a Chrome e un header
    `Accept-Language`. Blocca hostname privati/interni e ricontrolla i reindirizzamenti.
  </Step>
  <Step title="Extract">
    Esegue Readability (estrazione del contenuto principale) sulla risposta HTML.
  </Step>
  <Step title="Fallback (optional)">
    Se Readability non riesce e Firecrawl è configurato, riprova tramite l'API
    Firecrawl con modalità di aggiramento dei bot.
  </Step>
  <Step title="Cache">
    I risultati vengono memorizzati nella cache per 15 minuti (configurabile) per ridurre i recuperi
    ripetuti dello stesso URL.
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

Se l'estrazione Readability non riesce, `web_fetch` può ripiegare su
[Firecrawl](/it/tools/firecrawl) per aggirare i bot e ottenere un'estrazione migliore:

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
  Se Firecrawl è abilitato e il suo SecretRef non viene risolto senza fallback
  dell'env `FIRECRAWL_API_KEY`, l'avvio del gateway fallisce rapidamente.
</Note>

<Note>
  Gli override di `baseUrl` di Firecrawl sono bloccati: devono usare `https://` e
  l'host ufficiale di Firecrawl (`api.firecrawl.dev`).
</Note>

Comportamento runtime attuale:

- `tools.web.fetch.provider` seleziona esplicitamente il provider di fallback per il recupero.
- Se `provider` viene omesso, OpenClaw rileva automaticamente il primo provider web-fetch
  pronto dalle credenziali disponibili. Oggi il provider incluso è Firecrawl.
- Se Readability è disabilitato, `web_fetch` passa direttamente al fallback del
  provider selezionato. Se non è disponibile alcun provider, fallisce in modo chiuso.

## Limiti e sicurezza

- `maxChars` è limitato a `tools.web.fetch.maxCharsCap`
- Il corpo della risposta è limitato a `maxResponseBytes` prima del parsing; le risposte
  sovradimensionate vengono troncate con un avviso
- Gli hostname privati/interni sono bloccati
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sono opt-in ristretti
  per stack proxy fake-IP attendibili; lasciali non impostati a meno che il tuo proxy possieda
  quegli intervalli sintetici e applichi la propria policy di destinazione
- I reindirizzamenti vengono controllati e limitati da `maxRedirects`
- `web_fetch` è best-effort -- alcuni siti richiedono il [Browser web](/it/tools/browser)

## Profili degli strumenti

Se usi profili degli strumenti o liste di elementi consentiti, aggiungi `web_fetch` o `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Correlati

- [Ricerca web](/it/tools/web) -- cerca sul web con più provider
- [Browser web](/it/tools/browser) -- automazione completa del browser per siti molto basati su JS
- [Firecrawl](/it/tools/firecrawl) -- strumenti Firecrawl per ricerca e scraping
