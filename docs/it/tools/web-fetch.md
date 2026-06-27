---
read_when:
    - Vuoi recuperare un URL ed estrarre contenuti leggibili
    - Devi configurare web_fetch o il suo fallback Firecrawl
    - Vuoi capire i limiti e la memorizzazione nella cache di web_fetch
sidebarTitle: Web Fetch
summary: web_fetch tool -- recupero HTTP con estrazione di contenuto leggibile
title: Recupero web
x-i18n:
    generated_at: "2026-06-27T18:25:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

Lo strumento `web_fetch` esegue un semplice HTTP GET ed estrae contenuto leggibile
(da HTML a markdown o testo). **Non** esegue JavaScript.

Per siti con molto JS o pagine protette da login, usa invece il
[Browser web](/it/tools/browser).

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
  <Step title="Fetch">
    Invia un HTTP GET con un User-Agent simile a Chrome e un'intestazione
    `Accept-Language`. Blocca nomi host privati/interni e ricontrolla i reindirizzamenti.
  </Step>
  <Step title="Extract">
    Esegue Readability (estrazione del contenuto principale) sulla risposta HTML.
  </Step>
  <Step title="Fallback (optional)">
    Se Readability non riesce e Firecrawl è selezionato, riprova tramite l'API
    Firecrawl con modalità di aggiramento dei bot.
  </Step>
  <Step title="Cache">
    I risultati vengono memorizzati nella cache per 15 minuti (configurabile) per ridurre i recuperi
    ripetuti dello stesso URL.
  </Step>
</Steps>

## Aggiornamenti di avanzamento

`web_fetch` emette una riga di avanzamento pubblica solo quando il recupero è ancora in sospeso
dopo cinque secondi:

```text
Fetching page content...
```

Gli hit rapidi della cache e le risposte di rete veloci terminano prima che il timer scatti, quindi
non mostrano una riga di avanzamento. Se la chiamata viene annullata, il timer viene cancellato.
Quando il recupero alla fine si completa, l'agente riceve il normale risultato dello strumento;
la riga di avanzamento è solo stato dell'interfaccia del canale e non contiene mai il contenuto
recuperato dalla pagina.

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

## Alternativa Firecrawl

Se l'estrazione Readability non riesce, `web_fetch` può ricorrere a
[Firecrawl](/it/tools/firecrawl) per l'aggiramento dei bot e un'estrazione migliore:

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` è opzionale e supporta oggetti SecretRef.
La configurazione legacy `tools.web.fetch.firecrawl.*` viene migrata automaticamente da `openclaw doctor --fix`.

<Note>
  Se configuri un SecretRef per la chiave API di Firecrawl e non viene risolto senza un'alternativa
  dall'ambiente `FIRECRAWL_API_KEY`, l'avvio del gateway fallisce rapidamente.
</Note>

<Note>
  Gli override di `baseUrl` di Firecrawl sono vincolati: il traffico ospitato usa
  `https://api.firecrawl.dev`; gli override self-hosted devono puntare a endpoint privati o
  interni, e `http://` è accettato solo per quei target privati.
</Note>

Comportamento runtime attuale:

- `tools.web.fetch.provider` seleziona esplicitamente il fornitore alternativo di recupero.
- Se `provider` viene omesso, OpenClaw rileva automaticamente il primo fornitore di web-fetch
  pronto dalle credenziali configurate. `web_fetch` non sandboxed può usare Plugin
  installati che dichiarano `contracts.webFetchProviders` e registrano un
  fornitore corrispondente a runtime. Il Plugin ufficiale Firecrawl fornisce questa
  alternativa.
- Le chiamate `web_fetch` sandboxed consentono fornitori inclusi più fornitori installati
  la cui provenienza npm ufficiale o ClawHub è verificata. Oggi ciò consente il
  Plugin ufficiale Firecrawl; i Plugin esterni di recupero di terze parti restano esclusi.
- Se Readability è disabilitato, `web_fetch` passa direttamente all'alternativa del
  fornitore selezionato. Se non è disponibile alcun fornitore, fallisce in modo chiuso.

## Proxy env attendibile

Se la tua distribuzione richiede che `web_fetch` passi tramite un proxy
HTTP(S) in uscita attendibile, imposta `tools.web.fetch.useTrustedEnvProxy: true`.

In questa modalità, OpenClaw applica comunque i controlli SSRF basati sul nome host prima di inviare
la richiesta, ma lascia che sia il proxy a risolvere il DNS invece di eseguire il pinning DNS
locale. Abilitalo solo quando il proxy è controllato dall'operatore e applica
la policy in uscita dopo la risoluzione DNS.

<Note>
  Se non è configurata alcuna variabile di ambiente del proxy HTTP(S), o l'host di destinazione è escluso da
  `NO_PROXY`, `web_fetch` torna al normale percorso rigoroso con pinning DNS
  locale.
</Note>

## Limiti e sicurezza

- `maxChars` è limitato a `tools.web.fetch.maxCharsCap`
- Il corpo della risposta è limitato a `maxResponseBytes` prima dell'analisi; le risposte
  troppo grandi vengono troncate con un avviso
- I nomi host privati/interni sono bloccati
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sono opt-in circoscritti
  per stack di proxy fake-IP attendibili; lasciali non impostati a meno che il tuo proxy possieda
  quegli intervalli sintetici e applichi la propria policy di destinazione
- I reindirizzamenti vengono controllati e limitati da `maxRedirects`
- `useTrustedEnvProxy` è un opt-in esplicito e dovrebbe essere abilitato solo per
  proxy controllati dall'operatore che applicano comunque la policy in uscita dopo la risoluzione
  DNS
- `web_fetch` è best-effort -- alcuni siti richiedono il [Browser web](/it/tools/browser)

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

- [Ricerca web](/it/tools/web) -- cerca nel web con più fornitori
- [Browser web](/it/tools/browser) -- automazione completa del browser per siti con molto JS
- [Firecrawl](/it/tools/firecrawl) -- strumenti di ricerca e scraping Firecrawl
