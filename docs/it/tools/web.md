---
read_when:
    - Vuoi abilitare o configurare web_search
    - Vuoi abilitare o configurare x_search
    - È necessario scegliere un provider di ricerca
    - Vuoi comprendere il rilevamento automatico e il fallback del provider
sidebarTitle: Web Search
summary: web_search, x_search e web_fetch -- cerca sul web, cerca i post su X o recupera il contenuto della pagina
title: Ricerca web
x-i18n:
    generated_at: "2026-05-02T08:37:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: faa333a522a6690e92e8bd00c6096c84b386a97cbfeb508654929a409b39b8ef
    source_path: tools/web.md
    workflow: 16
---

Lo strumento `web_search` cerca nel web usando il provider configurato e
restituisce risultati. I risultati vengono memorizzati nella cache per query per 15 minuti (configurabile).

OpenClaw include anche `x_search` per i post di X (in precedenza Twitter) e
`web_fetch` per recuperi URL leggeri. In questa fase, `web_fetch` rimane
locale mentre `web_search` e `x_search` possono usare xAI Responses internamente.

<Info>
  `web_search` è uno strumento HTTP leggero, non automazione del browser. Per
  siti con molto JS o login, usa il [Browser Web](/it/tools/browser). Per
  recuperare un URL specifico, usa [Web Fetch](/it/tools/web-fetch).
</Info>

## Avvio rapido

<Steps>
  <Step title="Scegli un provider">
    Scegli un provider e completa qualsiasi configurazione richiesta. Alcuni provider sono
    senza chiave, mentre altri usano chiavi API. Consulta le pagine dei provider qui sotto per
    i dettagli.
  </Step>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    ```
    Questo memorizza il provider e qualsiasi credenziale necessaria. Puoi anche impostare una variabile
    di ambiente (per esempio `BRAVE_API_KEY`) e saltare questo passaggio per i provider
    basati su API.
  </Step>
  <Step title="Usalo">
    L'agente ora può chiamare `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Per i post di X, usa:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Scelta di un provider

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/it/tools/brave-search">
    Risultati strutturati con frammenti. Supporta la modalità `llm-context`, filtri per paese/lingua. Piano gratuito disponibile.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/it/tools/duckduckgo-search">
    Fallback senza chiave. Nessuna chiave API necessaria. Integrazione non ufficiale basata su HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/it/tools/exa-search">
    Ricerca neurale + per parole chiave con estrazione dei contenuti (evidenziazioni, testo, riepiloghi).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/it/tools/firecrawl">
    Risultati strutturati. Ideale insieme a `firecrawl_search` e `firecrawl_scrape` per l'estrazione approfondita.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/it/tools/gemini-search">
    Risposte sintetizzate dall'IA con citazioni tramite grounding di Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/it/tools/grok-search">
    Risposte sintetizzate dall'IA con citazioni tramite web grounding di xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/it/tools/kimi-search">
    Risposte sintetizzate dall'IA con citazioni tramite ricerca web Moonshot; i fallback a chat senza grounding falliscono esplicitamente.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/it/tools/minimax-search">
    Risultati strutturati tramite l'API di ricerca MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/it/tools/ollama-search">
    Ricerca tramite un host Ollama locale con accesso effettuato o l'API Ollama ospitata.
  </Card>
  <Card title="Perplexity" icon="search" href="/it/tools/perplexity-search">
    Risultati strutturati con controlli di estrazione dei contenuti e filtro per domini.
  </Card>
  <Card title="SearXNG" icon="server" href="/it/tools/searxng-search">
    Metaricerca self-hosted. Nessuna chiave API necessaria. Aggrega Google, Bing, DuckDuckGo e altro.
  </Card>
  <Card title="Tavily" icon="globe" href="/it/tools/tavily">
    Risultati strutturati con profondità di ricerca, filtro per argomento e `tavily_extract` per l'estrazione di URL.
  </Card>
</CardGroup>

### Confronto tra provider

| Provider                                  | Stile dei risultati                                          | Filtri                                          | Chiave API                                                                              |
| ----------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| [Brave](/it/tools/brave-search)              | Frammenti strutturati                                        | Paese, lingua, tempo, modalità `llm-context`    | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/it/tools/duckduckgo-search)    | Frammenti strutturati                                        | --                                              | Nessuna (senza chiave)                                                                  |
| [Exa](/it/tools/exa-search)                  | Strutturati + estratti                                       | Modalità neurale/parole chiave, data, estrazione dei contenuti | `EXA_API_KEY`                                                                           |
| [Firecrawl](/it/tools/firecrawl)             | Frammenti strutturati                                        | Tramite lo strumento `firecrawl_search`         | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/it/tools/gemini-search)            | Sintetizzati dall'IA + citazioni                             | --                                              | `GEMINI_API_KEY`                                                                        |
| [Grok](/it/tools/grok-search)                | Sintetizzati dall'IA + citazioni                             | --                                              | `XAI_API_KEY`                                                                           |
| [Kimi](/it/tools/kimi-search)                | Sintetizzati dall'IA + citazioni; fallisce sui fallback a chat senza grounding | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/it/tools/minimax-search)   | Frammenti strutturati                                        | Regione (`global` / `cn`)                       | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/it/tools/ollama-search) | Frammenti strutturati                                        | --                                              | Nessuna per host locali con accesso effettuato; `OLLAMA_API_KEY` per la ricerca diretta su `https://ollama.com` |
| [Perplexity](/it/tools/perplexity-search)    | Frammenti strutturati                                        | Paese, lingua, tempo, domini, limiti dei contenuti | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/it/tools/searxng-search)          | Frammenti strutturati                                        | Categorie, lingua                               | Nessuna (self-hosted)                                                                   |
| [Tavily](/it/tools/tavily)                   | Frammenti strutturati                                        | Tramite lo strumento `tavily_search`            | `TAVILY_API_KEY`                                                                        |

## Rilevamento automatico

## Ricerca web OpenAI nativa

I modelli OpenAI Responses diretti usano automaticamente lo strumento `web_search` ospitato da OpenAI quando la ricerca web di OpenClaw è abilitata e non è fissato alcun provider gestito. Questo è un comportamento di proprietà del provider nel Plugin OpenAI incluso e si applica solo al traffico API OpenAI nativo, non agli URL base di proxy compatibili con OpenAI o alle route Azure. Imposta `tools.web.search.provider` su un altro provider come `brave` per mantenere lo strumento `web_search` gestito per i modelli OpenAI, oppure imposta `tools.web.search.enabled: false` per disabilitare sia la ricerca gestita sia la ricerca OpenAI nativa.

## Ricerca web Codex nativa

I modelli compatibili con Codex possono facoltativamente usare lo strumento `web_search` Responses nativo del provider invece della funzione `web_search` gestita da OpenClaw.

- Configuralo sotto `tools.web.search.openaiCodex`
- Si attiva solo per modelli compatibili con Codex (`openai-codex/*` o provider che usano `api: "openai-codex-responses"`)
- `web_search` gestito continua ad applicarsi ai modelli non Codex
- `mode: "cached"` è l'impostazione predefinita e consigliata
- `tools.web.search.enabled: false` disabilita sia la ricerca gestita sia quella nativa

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Se la ricerca Codex nativa è abilitata ma il modello corrente non è compatibile con Codex, OpenClaw mantiene il normale comportamento `web_search` gestito.

## Configurazione della ricerca web

Gli elenchi di provider nella documentazione e nei flussi di configurazione sono in ordine alfabetico. Il rilevamento automatico mantiene un
ordine di precedenza separato.

Se non è impostato alcun `provider`, OpenClaw controlla i provider in questo ordine e usa il
primo pronto:

Prima i provider basati su API:

1. **Brave** -- `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey` (ordine 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey` (ordine 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` o `models.providers.google.apiKey` (ordine 20)
4. **Grok** -- `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` (ordine 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey` (ordine 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey` (ordine 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey` (ordine 60)
8. **Exa** -- `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` facoltativo sovrascrive l'endpoint Exa (ordine 65)
9. **Tavily** -- `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey` (ordine 70)

Fallback senza chiave dopo questi:

10. **DuckDuckGo** -- fallback HTML senza chiave, senza account o chiave API (ordine 100)
11. **Ollama Web Search** -- fallback senza chiave tramite l'host Ollama locale configurato quando è raggiungibile e con accesso effettuato tramite `ollama signin`; può riutilizzare l'autenticazione bearer del provider Ollama quando l'host la richiede e può chiamare la ricerca diretta su `https://ollama.com` quando configurato con `OLLAMA_API_KEY` (ordine 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (ordine 200)

Se non viene rilevato alcun provider, viene usato come fallback Brave (riceverai un errore di chiave mancante
che ti chiederà di configurarne una).

<Note>
  Tutti i campi chiave dei provider supportano oggetti SecretRef. Le SecretRef con ambito Plugin
  sotto `plugins.entries.<plugin>.config.webSearch.apiKey` vengono risolte per i
  provider di ricerca web inclusi basati su API, inclusi Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity e Tavily,
  sia quando il provider viene scelto esplicitamente tramite `tools.web.search.provider` sia
  quando viene selezionato tramite rilevamento automatico. In modalità di rilevamento automatico, OpenClaw risolve solo la
  chiave del provider selezionato -- le SecretRef non selezionate restano inattive, così puoi
  mantenere configurati più provider senza pagare il costo di risoluzione per
  quelli che non usi.
</Note>

## Configurazione

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La configurazione specifica del provider (chiavi API, URL base, modalità) si trova sotto
`plugins.entries.<plugin>.config.webSearch.*`. Gemini può anche riutilizzare
`models.providers.google.apiKey` e `models.providers.google.baseUrl` come fallback a priorità inferiore
dopo la sua configurazione dedicata per la ricerca web e `GEMINI_API_KEY`. Consulta le
pagine dei provider per esempi.

`tools.web.search.provider` viene convalidato rispetto agli id dei provider di ricerca web
dichiarati dai manifest dei plugin inclusi e installati. Un refuso come `"brvae"`
fa fallire la convalida della configurazione invece di ricadere silenziosamente sul rilevamento automatico. Se un
provider configurato ha solo prove di plugin obsolete, come un blocco residuo
`plugins.entries.<plugin>` dopo la disinstallazione di un plugin di terze parti,
OpenClaw mantiene resiliente l'avvio e segnala un avviso, così puoi reinstallare il
plugin o eseguire `openclaw doctor --fix` per ripulire la configurazione obsoleta.

La selezione del provider di fallback per `web_fetch` è separata:

- sceglilo con `tools.web.fetch.provider`
- oppure ometti quel campo e lascia che OpenClaw rilevi automaticamente il primo provider web-fetch
  pronto dalle credenziali disponibili
- `web_fetch` non in sandbox può usare provider di plugin installati che dichiarano
  `contracts.webFetchProviders`; i fetch in sandbox restano limitati ai provider inclusi
- oggi il provider web-fetch incluso è Firecrawl, configurato sotto
  `plugins.entries.firecrawl.config.webFetch.*`

Quando scegli **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw può anche chiedere:

- la regione API di Moonshot (`https://api.moonshot.ai/v1` o `https://api.moonshot.cn/v1`)
- il modello predefinito di ricerca web Kimi (valore predefinito: `kimi-k2.6`)

Per `x_search`, configura `plugins.entries.xai.config.xSearch.*`. Usa lo
stesso fallback `XAI_API_KEY` della ricerca web Grok.
La configurazione legacy `tools.web.x_search.*` viene migrata automaticamente da `openclaw doctor --fix`.
Quando scegli Grok durante `openclaw onboard` o `openclaw configure --section web`,
OpenClaw può anche offrire la configurazione opzionale di `x_search` con la stessa chiave.
Questo è un passaggio successivo separato all'interno del percorso Grok, non una scelta separata di provider
di ricerca web di primo livello. Se scegli un altro provider, OpenClaw non
mostra il prompt `x_search`.

### Archiviazione delle chiavi API

<Tabs>
  <Tab title="File di configurazione">
    Esegui `openclaw configure --section web` o imposta direttamente la chiave:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Variabile d'ambiente">
    Imposta la variabile d'ambiente del provider nell'ambiente del processo Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Per un'installazione del gateway, inseriscila in `~/.openclaw/.env`.
    Vedi [Variabili d'ambiente](/it/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametri dello strumento

| Parametro             | Descrizione                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | Query di ricerca (obbligatoria)                               |
| `count`               | Risultati da restituire (1-10, valore predefinito: 5)                  |
| `country`             | Codice paese ISO a 2 lettere (ad es. "US", "DE")           |
| `language`            | Codice lingua ISO 639-1 (ad es. "en", "de")             |
| `search_lang`         | Codice della lingua di ricerca (solo Brave)                     |
| `freshness`           | Filtro temporale: `day`, `week`, `month` o `year`        |
| `date_after`          | Risultati dopo questa data (YYYY-MM-DD)                  |
| `date_before`         | Risultati prima di questa data (YYYY-MM-DD)                 |
| `ui_lang`             | Codice lingua dell'interfaccia utente (solo Brave)                         |
| `domain_filter`       | Array allowlist/denylist di domini (solo Perplexity)     |
| `max_tokens`          | Budget totale dei contenuti, valore predefinito 25000 (solo Perplexity) |
| `max_tokens_per_page` | Limite di token per pagina, valore predefinito 2048 (solo Perplexity)  |

<Warning>
  Non tutti i parametri funzionano con tutti i provider. La modalità `llm-context` di Brave
  rifiuta `ui_lang`; `date_before` richiede anche `date_after` perché gli intervalli personalizzati
  di freshness di Brave richiedono sia la data di inizio sia quella di fine.
  Gemini, Grok e Kimi restituiscono una risposta sintetizzata con citazioni. Accettano
  `count` per compatibilità con lo strumento condiviso, ma non modifica la forma
  della risposta con grounding. Gemini supporta `freshness`, `date_after` e
  `date_before` convertendoli in intervalli temporali di grounding di Google Search.
  Perplexity si comporta nello stesso modo quando usi il percorso di compatibilità
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` o `OPENROUTER_API_KEY`).
  SearXNG accetta `http://` solo per host di rete privata attendibili o local loopback;
  gli endpoint SearXNG pubblici devono usare `https://`.
  Firecrawl e Tavily supportano solo `query` e `count` tramite `web_search`
  -- usa i loro strumenti dedicati per le opzioni avanzate.
</Warning>

## x_search

`x_search` interroga i post di X (in precedenza Twitter) usando xAI e restituisce
risposte sintetizzate dall'AI con citazioni. Accetta query in linguaggio naturale e
filtri strutturati opzionali. OpenClaw abilita lo strumento integrato `x_search` di xAI
solo sulla richiesta che serve questa chiamata allo strumento.

<Note>
  xAI documenta `x_search` come supporto per ricerca per parole chiave, ricerca semantica, ricerca utenti
  e recupero di thread. Per statistiche di engagement per singolo post come repost,
  risposte, segnalibri o visualizzazioni, preferisci una ricerca mirata per l'URL esatto del post
  o l'ID di stato. Le ricerche ampie per parole chiave possono trovare il post giusto ma restituire metadati
  meno completi per singolo post. Un buon schema è: individua prima il post, poi
  esegui una seconda query `x_search` focalizzata su quel post esatto.
</Note>

### Configurazione di x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` invia le richieste POST a `<baseUrl>/responses` quando
`plugins.entries.xai.config.xSearch.baseUrl` è impostato. Se quel campo viene omesso,
ripiega su `plugins.entries.xai.config.webSearch.baseUrl`, poi sul
legacy `tools.web.search.grok.baseUrl` e infine sull'endpoint pubblico xAI.

### Parametri di x_search

| Parametro                    | Descrizione                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Query di ricerca (obbligatoria)                                |
| `allowed_x_handles`          | Limita i risultati a specifici handle X                 |
| `excluded_x_handles`         | Esclude specifici handle X                             |
| `from_date`                  | Include solo i post in questa data o successivi (YYYY-MM-DD)  |
| `to_date`                    | Include solo i post in questa data o precedenti (YYYY-MM-DD) |
| `enable_image_understanding` | Consente a xAI di ispezionare le immagini allegate ai post corrispondenti      |
| `enable_video_understanding` | Consente a xAI di ispezionare i video allegati ai post corrispondenti      |

### Esempio di x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Esempi

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Profili degli strumenti

Se usi profili degli strumenti o allowlist, aggiungi `web_search`, `x_search` o `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Correlati

- [Web Fetch](/it/tools/web-fetch) -- recupera un URL ed estrae contenuto leggibile
- [Browser web](/it/tools/browser) -- automazione completa del browser per siti ricchi di JS
- [Ricerca Grok](/it/tools/grok-search) -- Grok come provider `web_search`
- [Ricerca web Ollama](/it/tools/ollama-search) -- ricerca web senza chiave tramite il tuo host Ollama
