---
read_when:
    - Vuoi recuperare un URL ed estrarne il contenuto leggibile
    - È necessario configurare web_fetch o il relativo fallback Firecrawl
    - Vuoi comprendere i limiti di web_fetch e la memorizzazione nella cache
sidebarTitle: Web Fetch
summary: strumento web_fetch -- recupero HTTP con estrazione di contenuti leggibili
title: Recupero web
x-i18n:
    generated_at: "2026-05-04T07:10:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

Lo strumento `web_fetch` esegue un semplice HTTP GET ed estrae contenuto leggibile
(da HTML a markdown o testo). **Non** esegue JavaScript.

Per siti con molto JS o pagine protette da login, usa invece il
[Browser Web](/it/tools/browser).

## Avvio rapido

`web_fetch` è **abilitato per impostazione predefinita**: non serve alcuna configurazione. L’agente può
chiamarlo immediatamente:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parametri dello strumento

<ParamField path="url" type="string" required>
URL da recuperare. Solo `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Formato di output dopo l’estrazione del contenuto principale.
</ParamField>

<ParamField path="maxChars" type="number">
Tronca l’output a questo numero di caratteri.
</ParamField>

## Come funziona

<Steps>
  <Step title="Recupero">
    Invia un HTTP GET con uno User-Agent simile a Chrome e intestazione
    `Accept-Language`. Blocca nomi host privati/interni e ricontrolla i reindirizzamenti.
  </Step>
  <Step title="Estrazione">
    Esegue Readability (estrazione del contenuto principale) sulla risposta HTML.
  </Step>
  <Step title="Fallback (facoltativo)">
    Se Readability non riesce e Firecrawl è configurato, riprova tramite l’API
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

Se l’estrazione Readability non riesce, `web_fetch` può passare a
[Firecrawl](/it/tools/firecrawl) per l’aggiramento dei bot e un’estrazione migliore:

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
  Se Firecrawl è abilitato e il suo SecretRef non è risolto senza fallback env
  `FIRECRAWL_API_KEY`, l’avvio del gateway fallisce immediatamente.
</Note>

<Note>
  Le sovrascritture di `baseUrl` di Firecrawl sono bloccate: il traffico ospitato usa
  `https://api.firecrawl.dev`; le sovrascritture self-hosted devono puntare a endpoint privati o
  interni, e `http://` è accettato solo per quei target privati.
</Note>

Comportamento di runtime corrente:

- `tools.web.fetch.provider` seleziona esplicitamente il provider di fallback per il recupero.
- Se `provider` viene omesso, OpenClaw rileva automaticamente il primo provider web-fetch pronto
  dalle credenziali disponibili. `web_fetch` non in sandbox può usare
  plugin installati che dichiarano `contracts.webFetchProviders` e registrano un
  provider corrispondente a runtime. Oggi il provider in bundle è Firecrawl.
- Le chiamate `web_fetch` in sandbox restano limitate ai provider in bundle.
- Se Readability è disabilitato, `web_fetch` passa direttamente al fallback
  del provider selezionato. Se nessun provider è disponibile, fallisce in modo chiuso.

## Proxy Env attendibile

Se la tua distribuzione richiede che `web_fetch` passi attraverso un proxy
HTTP(S) in uscita attendibile, imposta `tools.web.fetch.useTrustedEnvProxy: true`.

In questa modalità, OpenClaw applica comunque i controlli SSRF basati sul nome host prima di inviare
la richiesta, ma lascia che sia il proxy a risolvere il DNS invece di eseguire il pinning DNS locale.
Abilitalo solo quando il proxy è controllato dall’operatore e applica una policy
in uscita dopo la risoluzione DNS.

<Note>
  Se non è configurata alcuna variabile env proxy HTTP(S), oppure l’host di destinazione è escluso da
  `NO_PROXY`, `web_fetch` ricade sul normale percorso rigoroso con pinning DNS
  locale.
</Note>

## Limiti e sicurezza

- `maxChars` è limitato a `tools.web.fetch.maxCharsCap`
- Il corpo della risposta è limitato a `maxResponseBytes` prima del parsing; le risposte
  troppo grandi vengono troncate con un avviso
- I nomi host privati/interni vengono bloccati
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sono opt-in limitati
  per stack proxy fake-IP attendibili; lasciali non impostati salvo che il tuo proxy possieda
  quegli intervalli sintetici e applichi una propria policy di destinazione
- I reindirizzamenti vengono controllati e limitati da `maxRedirects`
- `useTrustedEnvProxy` è un opt-in esplicito e dovrebbe essere abilitato solo per
  proxy controllati dall’operatore che applicano comunque una policy in uscita dopo la risoluzione DNS
- `web_fetch` funziona al meglio: alcuni siti richiedono il [Browser Web](/it/tools/browser)

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

- [Ricerca Web](/it/tools/web): cerca nel web con più provider
- [Browser Web](/it/tools/browser): automazione completa del browser per siti con molto JS
- [Firecrawl](/it/tools/firecrawl): strumenti di ricerca e scrape Firecrawl
