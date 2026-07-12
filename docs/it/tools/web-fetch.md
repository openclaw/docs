---
read_when:
    - Vuoi recuperare un URL ed estrarne contenuti leggibili
    - Devi configurare web_fetch o il relativo fallback Firecrawl
    - Vuoi comprendere i limiti e la memorizzazione nella cache di web_fetch
sidebarTitle: Web Fetch
summary: strumento web_fetch -- recupero HTTP con estrazione di contenuti leggibili
title: Recupero web
x-i18n:
    generated_at: "2026-07-12T07:39:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` esegue una semplice richiesta HTTP GET ed estrae il contenuto leggibile (da HTML a
markdown o testo). **Non** esegue JavaScript. Per i siti che fanno ampio uso di JS o
le pagine protette da accesso, usa invece il [browser web](/it/tools/browser).

## Avvio rapido

Abilitato per impostazione predefinita, non richiede configurazione:

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
Tronca l'output a questo numero di caratteri. Limitato a `tools.web.fetch.maxCharsCap`.
</ParamField>

## Funzionamento

<Steps>
  <Step title="Recupero">
    Invia una richiesta HTTP GET con uno User-Agent simile a quello di Chrome e
    l'header `Accept-Language`. Blocca i nomi host privati/interni e verifica nuovamente i reindirizzamenti.
  </Step>
  <Step title="Estrazione">
    Esegue Readability (estrazione del contenuto principale) sulla risposta HTML.
  </Step>
  <Step title="Ripiego (facoltativo)">
    Se Readability non riesce e un fornitore di recupero è disponibile, riprova tramite
    tale fornitore (ad esempio la modalità di aggiramento dei bot di Firecrawl).
  </Step>
  <Step title="Cache">
    I risultati vengono memorizzati nella cache per 15 minuti (configurabili) per ridurre i
    recuperi ripetuti dello stesso URL.
  </Step>
</Steps>

## Aggiornamenti sull'avanzamento

`web_fetch` emette una riga pubblica di avanzamento solo se il recupero è ancora in sospeso
dopo cinque secondi:

```text
Recupero del contenuto della pagina...
```

I risultati rapidi dalla cache e le risposte di rete veloci terminano prima che scatti il timer, quindi
non mostrano mai una riga di avanzamento. L'annullamento della chiamata azzera il timer. La
riga di avanzamento rappresenta solo lo stato dell'interfaccia del canale e non contiene mai il contenuto recuperato dalla pagina.

## Configurazione

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // predefinito: true
        provider: "firecrawl", // facoltativo; omettere per il rilevamento automatico
        maxChars: 20000, // caratteri di output predefiniti; limitati da maxCharsCap
        maxCharsCap: 20000, // limite massimo invalicabile per il parametro maxChars
        maxResponseBytes: 750000, // dimensione massima del download prima del troncamento (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // consente a un proxy di ambiente HTTP(S) attendibile di risolvere il DNS
        readability: true, // usa l'estrazione Readability
        userAgent: "Mozilla/5.0 ...", // sovrascrive lo User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // adesione esplicita per proxy con IP fittizi attendibili che usano 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // adesione esplicita per proxy con IP fittizi attendibili che usano fc00::/7
        },
      },
    },
  },
}
```

## Ripiego su Firecrawl

Se l'estrazione con Readability non riesce, `web_fetch` può ricorrere a
[Firecrawl](/it/tools/firecrawl) per aggirare i bot e migliorare l'estrazione:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // facoltativo; omettere per il rilevamento automatico dalle credenziali disponibili
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // facoltativo; omettere per l'accesso iniziale senza chiave
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // durata della cache (2 giorni)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` è facoltativo e supporta gli oggetti SecretRef.
La configurazione legacy `tools.web.fetch.firecrawl.*` viene migrata automaticamente a
`plugins.entries.firecrawl.config.webFetch` tramite `openclaw doctor --fix`.

<Note>
  Se configuri un SecretRef per la chiave API di Firecrawl e questo non viene risolto né è disponibile
  il ripiego sulla variabile di ambiente `FIRECRAWL_API_KEY`, l'avvio del Gateway termina immediatamente con un errore.
</Note>

<Note>
  Le sostituzioni di `baseUrl` di Firecrawl sono soggette a restrizioni: il traffico ospitato usa
  `https://api.firecrawl.dev`; le sostituzioni self-hosted devono puntare a endpoint privati o
  interni e `http://` è accettato solo per tali destinazioni private.
</Note>

Comportamento attuale in fase di esecuzione:

- `tools.web.fetch.provider` seleziona esplicitamente il fornitore di ripiego per il recupero.
- Se `provider` viene omesso, OpenClaw rileva automaticamente il primo fornitore di recupero web
  pronto in base alle credenziali configurate. `web_fetch` senza sandbox può usare
  i plugin installati che dichiarano `contracts.webFetchProviders` e registrano un
  fornitore corrispondente in fase di esecuzione. Attualmente, il plugin ufficiale Firecrawl fornisce questo
  ripiego.
- Le chiamate `web_fetch` nella sandbox consentono i fornitori inclusi, oltre ai fornitori installati
  la cui provenienza ufficiale da npm o ClawHub è verificata. Attualmente ciò consente il
  plugin ufficiale Firecrawl; i plugin di recupero esterni di terze parti restano esclusi.
- Se Readability è disabilitato, `web_fetch` passa direttamente al ripiego sul
  fornitore selezionato. Se non è disponibile alcun fornitore, termina in modo sicuro con un errore.

## Proxy di ambiente attendibile

Se la distribuzione richiede che `web_fetch` usi un proxy HTTP(S)
in uscita attendibile, imposta `tools.web.fetch.useTrustedEnvProxy: true`.

In questa modalità, OpenClaw applica comunque i controlli SSRF basati sul nome host prima di inviare
la richiesta, ma consente al proxy di risolvere il DNS anziché eseguire il
blocco locale del DNS. Abilita questa opzione solo quando il proxy è controllato dall'operatore e applica
i criteri per il traffico in uscita dopo la risoluzione DNS.

<Note>
  Se non è configurata alcuna variabile di ambiente per il proxy HTTP(S), o se l'host di destinazione è escluso da
  `NO_PROXY`, `web_fetch` torna al normale percorso rigoroso con
  blocco locale del DNS.
</Note>

## Limiti e sicurezza

- `maxChars` è limitato a `tools.web.fetch.maxCharsCap` (valore predefinito `20000`)
- Il corpo della risposta è limitato a `maxResponseBytes` (valore predefinito `750000`, compreso tra
  32000 e 10000000) prima dell'analisi; le risposte sovradimensionate vengono troncate con un avviso
- I nomi host privati/interni vengono bloccati
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sono adesioni esplicite limitate
  per stack proxy attendibili con IP fittizi; lasciali non impostati a meno che il proxy non gestisca
  tali intervalli sintetici e applichi propri criteri di destinazione
- I reindirizzamenti vengono verificati e limitati da `maxRedirects` (valore predefinito `3`)
- `useTrustedEnvProxy` richiede un'adesione esplicita e deve essere abilitato solo per
  proxy controllati dall'operatore che continuano ad applicare i criteri per il traffico in uscita dopo la risoluzione
  DNS
- `web_fetch` opera al meglio delle proprie possibilità: alcuni siti richiedono il [browser web](/it/tools/browser)

## Profili degli strumenti

Se usi profili degli strumenti o elenchi di elementi consentiti, aggiungi `web_fetch` o `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // oppure: allow: ["group:web"]  (include web_fetch, web_search e x_search)
  },
}
```

## Contenuti correlati

- [Ricerca web](/it/tools/web) -- cerca sul web con più fornitori
- [Browser web](/it/tools/browser) -- automazione completa del browser per siti che fanno ampio uso di JS
- [Firecrawl](/it/tools/firecrawl) -- strumenti Firecrawl per la ricerca e l'estrazione dei dati
