---
read_when:
    - Vuoi recuperare un URL ed estrarre contenuti leggibili
    - È necessario configurare web_fetch o il relativo fallback Firecrawl
    - Vuoi comprendere i limiti e la memorizzazione nella cache di web_fetch
sidebarTitle: Web Fetch
summary: strumento web_fetch -- recupero HTTP con estrazione di contenuti leggibili
title: Recupero dal web
x-i18n:
    generated_at: "2026-05-06T18:02:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

Lo strumento `web_fetch` esegue un semplice HTTP GET ed estrae contenuto leggibile
(da HTML a markdown o testo). **Non** esegue JavaScript.

Per siti con uso intensivo di JS o pagine protette da login, usa invece il
[Web Browser](/it/tools/browser).

## Avvio rapido

`web_fetch` è **abilitato per impostazione predefinita**: non serve alcuna configurazione. L'agente può
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
  <Step title="Fetch">
    Invia un HTTP GET con uno User-Agent simile a Chrome e un'intestazione
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

Se l'estrazione Readability non riesce, `web_fetch` può passare in fallback a
[Firecrawl](/it/tools/firecrawl) per l'aggiramento dei bot e una migliore estrazione:

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
  Se Firecrawl è abilitato e il relativo SecretRef non viene risolto senza un fallback env
  `FIRECRAWL_API_KEY`, l'avvio del gateway fallisce rapidamente.
</Note>

<Note>
  Gli override di `baseUrl` di Firecrawl sono vincolati: il traffico hosted usa
  `https://api.firecrawl.dev`; gli override self-hosted devono puntare a endpoint privati o
  interni, e `http://` è accettato solo per questi target privati.
</Note>

Comportamento runtime attuale:

- `tools.web.fetch.provider` seleziona esplicitamente il provider di fallback del recupero.
- Se `provider` viene omesso, OpenClaw rileva automaticamente il primo provider web-fetch pronto
  dalle credenziali disponibili. `web_fetch` non in sandbox può usare
  Plugin installati che dichiarano `contracts.webFetchProviders` e registrano un
  provider corrispondente a runtime. Oggi il provider incluso è Firecrawl.
- Le chiamate `web_fetch` in sandbox restano limitate ai provider inclusi.
- Se Readability è disabilitato, `web_fetch` passa direttamente al fallback del
  provider selezionato. Se non è disponibile alcun provider, fallisce in modo chiuso.

## Proxy env attendibile

Se il tuo deployment richiede che `web_fetch` passi attraverso un proxy outbound
HTTP(S) attendibile, imposta `tools.web.fetch.useTrustedEnvProxy: true`.

In questa modalità, OpenClaw applica comunque i controlli SSRF basati su hostname prima di inviare
la richiesta, ma lascia che sia il proxy a risolvere il DNS invece di effettuare il pinning DNS
locale. Abilitalo solo quando il proxy è controllato dall'operatore e applica
la policy outbound dopo la risoluzione DNS.

<Note>
  Se non è configurata alcuna variabile env proxy HTTP(S), o l'host target è escluso da
  `NO_PROXY`, `web_fetch` torna al normale percorso rigoroso con pinning DNS
  locale.
</Note>

## Limiti e sicurezza

- `maxChars` viene limitato a `tools.web.fetch.maxCharsCap`
- Il corpo della risposta è limitato a `maxResponseBytes` prima del parsing; le risposte
  troppo grandi vengono troncate con un avviso
- Gli hostname privati/interni vengono bloccati
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sono opt-in limitati
  per stack di proxy fake-IP attendibili; lasciali non impostati a meno che il tuo proxy possieda
  quegli intervalli sintetici e applichi la propria policy di destinazione
- I reindirizzamenti vengono controllati e limitati da `maxRedirects`
- `useTrustedEnvProxy` è un opt-in esplicito e deve essere abilitato solo per
  proxy controllati dall'operatore che applicano comunque la policy outbound dopo la risoluzione
  DNS
- `web_fetch` è best-effort: alcuni siti richiedono il [Web Browser](/it/tools/browser)

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

- [Web Search](/it/tools/web): cerca nel web con più provider
- [Web Browser](/it/tools/browser): automazione completa del browser per siti con uso intensivo di JS
- [Firecrawl](/it/tools/firecrawl): strumenti di ricerca e scraping Firecrawl
