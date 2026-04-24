---
read_when:
    - Vuoi abilitare o configurare web_search
    - Vuoi abilitare o configurare x_search
    - Devi scegliere un provider di ricerca
    - Vuoi capire il rilevamento automatico e il fallback del provider
sidebarTitle: Web Search
summary: web_search, x_search e web_fetch -- cerca nel web, cerca nei post di X o recupera il contenuto di una pagina
title: Ricerca web
x-i18n:
    generated_at: "2026-04-24T09:08:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2713e8b13cf0f3c6bba38bee50c24771b914a5cd235ca521bed434a6ddbe2305
    source_path: tools/web.md
    workflow: 15
---

Lo strumento `web_search` cerca nel web usando il provider configurato e
restituisce i risultati. I risultati vengono memorizzati in cache per query per 15 minuti (configurabile).

OpenClaw include anche `x_search` per i post di X (ex Twitter) e
`web_fetch` per il recupero leggero di URL. In questa fase, `web_fetch` resta
locale mentre `web_search` e `x_search` possono usare xAI Responses sotto il cofano.

<Info>
  `web_search` è uno strumento HTTP leggero, non automazione del browser. Per
  siti con molto JS o login, usa il [Browser web](/it/tools/browser). Per
  recuperare un URL specifico, usa [Web Fetch](/it/tools/web-fetch).
</Info>

## Avvio rapido

<Steps>
  <Step title="Scegli un provider">
    Scegli un provider e completa qualsiasi configurazione richiesta. Alcuni provider sono
    senza chiave, mentre altri usano chiavi API. Vedi le pagine dei provider qui sotto per
    i dettagli.
  </Step>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    ```
    Questo memorizza il provider e qualsiasi credenziale necessaria. Puoi anche impostare una variabile env
    (ad esempio `BRAVE_API_KEY`) e saltare questo passaggio per i provider
    supportati da API.
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

## Scegliere un provider

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/it/tools/brave-search">
    Risultati strutturati con snippet. Supporta la modalità `llm-context`, filtri paese/lingua. Tier gratuito disponibile.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/it/tools/duckduckgo-search">
    Fallback senza chiave. Nessuna chiave API necessaria. Integrazione non ufficiale basata su HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/it/tools/exa-search">
    Ricerca neurale + per parole chiave con estrazione del contenuto (highlight, testo, riepiloghi).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/it/tools/firecrawl">
    Risultati strutturati. Si abbina al meglio con `firecrawl_search` e `firecrawl_scrape` per estrazioni approfondite.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/it/tools/gemini-search">
    Risposte sintetizzate dall'IA con citazioni tramite grounding di Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/it/tools/grok-search">
    Risposte sintetizzate dall'IA con citazioni tramite grounding web xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/it/tools/kimi-search">
    Risposte sintetizzate dall'IA con citazioni tramite ricerca web Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/it/tools/minimax-search">
    Risultati strutturati tramite l'API di ricerca MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/it/tools/ollama-search">
    Ricerca senza chiave tramite l'host Ollama configurato. Richiede `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/it/tools/perplexity-search">
    Risultati strutturati con controlli di estrazione del contenuto e filtro dei domini.
  </Card>
  <Card title="SearXNG" icon="server" href="/it/tools/searxng-search">
    Meta-ricerca self-hosted. Nessuna chiave API necessaria. Aggrega Google, Bing, DuckDuckGo e altro.
  </Card>
  <Card title="Tavily" icon="globe" href="/it/tools/tavily">
    Risultati strutturati con profondità di ricerca, filtro per argomento e `tavily_extract` per l'estrazione di URL.
  </Card>
</CardGroup>

### Confronto tra provider

| Provider                                  | Stile dei risultati         | Filtri                                           | Chiave API                                                                       |
| ----------------------------------------- | --------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/it/tools/brave-search)              | Snippet strutturati         | Paese, lingua, tempo, modalità `llm-context`     | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/it/tools/duckduckgo-search)    | Snippet strutturati         | --                                               | Nessuna (senza chiave)                                                           |
| [Exa](/it/tools/exa-search)                  | Strutturati + estratti      | Modalità neurale/parole chiave, data, estrazione contenuto | `EXA_API_KEY`                                                            |
| [Firecrawl](/it/tools/firecrawl)             | Snippet strutturati         | Tramite lo strumento `firecrawl_search`          | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/it/tools/gemini-search)            | Sintetizzati dall'IA + citazioni | --                                          | `GEMINI_API_KEY`                                                                 |
| [Grok](/it/tools/grok-search)                | Sintetizzati dall'IA + citazioni | --                                          | `XAI_API_KEY`                                                                    |
| [Kimi](/it/tools/kimi-search)                | Sintetizzati dall'IA + citazioni | --                                          | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/it/tools/minimax-search)   | Snippet strutturati         | Regione (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/it/tools/ollama-search) | Snippet strutturati         | --                                               | Nessuna per impostazione predefinita; `ollama signin` richiesto, può riutilizzare bearer auth del provider Ollama |
| [Perplexity](/it/tools/perplexity-search)    | Snippet strutturati         | Paese, lingua, tempo, domini, limiti contenuto   | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/it/tools/searxng-search)          | Snippet strutturati         | Categorie, lingua                                | Nessuna (self-hosted)                                                            |
| [Tavily](/it/tools/tavily)                   | Snippet strutturati         | Tramite lo strumento `tavily_search`             | `TAVILY_API_KEY`                                                                 |

## Rilevamento automatico

## Ricerca web nativa OpenAI

I modelli diretti OpenAI Responses usano automaticamente lo strumento `web_search` ospitato da OpenAI quando la ricerca web di OpenClaw è abilitata e non è fissato alcun provider gestito. Questo è un comportamento di proprietà del provider nel Plugin OpenAI incluso e si applica solo al traffico nativo OpenAI API, non agli URL base proxy compatibili OpenAI o ai percorsi Azure. Imposta `tools.web.search.provider` su un altro provider come `brave` per mantenere lo strumento gestito `web_search` per i modelli OpenAI, oppure imposta `tools.web.search.enabled: false` per disabilitare sia la ricerca gestita sia la ricerca OpenAI nativa.

## Ricerca web nativa Codex

I modelli compatibili con Codex possono facoltativamente usare lo strumento `web_search` nativo del provider Responses invece della funzione gestita `web_search` di OpenClaw.

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

Se la ricerca Codex nativa è abilitata ma il modello corrente non è compatibile con Codex, OpenClaw mantiene il normale comportamento gestito di `web_search`.

## Configurare la ricerca web

Gli elenchi dei provider nella documentazione e nei flussi di configurazione sono in ordine alfabetico. Il rilevamento automatico mantiene un ordine di precedenza separato.

Se non è impostato alcun `provider`, OpenClaw controlla i provider in questo ordine e usa il
primo pronto:

Prima i provider supportati da API:

1. **Brave** -- `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey` (ordine 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey` (ordine 15)
3. **Gemini** -- `GEMINI_API_KEY` o `plugins.entries.google.config.webSearch.apiKey` (ordine 20)
4. **Grok** -- `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` (ordine 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey` (ordine 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey` (ordine 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey` (ordine 60)
8. **Exa** -- `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey` (ordine 65)
9. **Tavily** -- `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey` (ordine 70)

Poi i fallback senza chiave:

10. **DuckDuckGo** -- fallback HTML senza chiave, senza account o chiave API (ordine 100)
11. **Ollama Web Search** -- fallback senza chiave tramite l'host Ollama configurato; richiede che Ollama sia raggiungibile e con accesso effettuato tramite `ollama signin` e può riutilizzare bearer auth del provider Ollama se l'host lo richiede (ordine 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (ordine 200)

Se non viene rilevato alcun provider, viene usato il fallback a Brave (riceverai un errore di chiave mancante
che ti inviterà a configurarne una).

<Note>
  Tutti i campi chiave dei provider supportano oggetti SecretRef. Gli SecretRef con ambito Plugin
  sotto `plugins.entries.<plugin>.config.webSearch.apiKey` vengono risolti per i provider inclusi
  Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity e Tavily
  sia quando il provider viene scelto esplicitamente tramite `tools.web.search.provider` sia
  quando viene selezionato tramite rilevamento automatico. In modalità di rilevamento automatico, OpenClaw risolve solo la
  chiave del provider selezionato -- gli SecretRef non selezionati restano inattivi, così puoi
  mantenere più provider configurati senza pagare il costo di risoluzione per
  quelli che non stai usando.
</Note>

## Configurazione

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // predefinito: true
        provider: "brave", // oppure ometti per il rilevamento automatico
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La configurazione specifica del provider (chiavi API, URL base, modalità) si trova sotto
`plugins.entries.<plugin>.config.webSearch.*`. Vedi le pagine dei provider per
esempi.

La selezione del provider di fallback di `web_fetch` è separata:

- sceglilo con `tools.web.fetch.provider`
- oppure ometti quel campo e lascia che OpenClaw rilevi automaticamente il primo provider web-fetch pronto dalle credenziali disponibili
- oggi il provider web-fetch incluso è Firecrawl, configurato sotto
  `plugins.entries.firecrawl.config.webFetch.*`

Quando scegli **Kimi** durante `openclaw onboard` oppure
`openclaw configure --section web`, OpenClaw può anche chiederti:

- la regione API Moonshot (`https://api.moonshot.ai/v1` oppure `https://api.moonshot.cn/v1`)
- il modello di ricerca web Kimi predefinito (predefinito `kimi-k2.6`)

Per `x_search`, configura `plugins.entries.xai.config.xSearch.*`. Usa lo
stesso fallback `XAI_API_KEY` della ricerca web Grok.
La configurazione legacy `tools.web.x_search.*` viene migrata automaticamente da `openclaw doctor --fix`.
Quando scegli Grok durante `openclaw onboard` oppure `openclaw configure --section web`,
OpenClaw può anche offrire la configurazione facoltativa di `x_search` con la stessa chiave.
Questo è un passaggio di follow-up separato all'interno del percorso Grok, non una scelta separata di alto livello
del provider di ricerca web. Se scegli un altro provider, OpenClaw non
mostra il prompt `x_search`.

### Memorizzare chiavi API

<Tabs>
  <Tab title="File di configurazione">
    Esegui `openclaw configure --section web` oppure imposta direttamente la chiave:

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
    Imposta la variabile env del provider nell'ambiente del processo Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Per un'installazione gateway, inseriscila in `~/.openclaw/.env`.
    Vedi [Variabili env](/it/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametri dello strumento

| Parametro              | Descrizione                                           |
| ---------------------- | ----------------------------------------------------- |
| `query`                | Query di ricerca (obbligatoria)                       |
| `count`                | Risultati da restituire (1-10, predefinito: 5)        |
| `country`              | Codice paese ISO di 2 lettere (es. "US", "DE")       |
| `language`             | Codice lingua ISO 639-1 (es. "en", "de")             |
| `search_lang`          | Codice lingua di ricerca (solo Brave)                 |
| `freshness`            | Filtro temporale: `day`, `week`, `month` o `year`     |
| `date_after`           | Risultati dopo questa data (YYYY-MM-DD)               |
| `date_before`          | Risultati prima di questa data (YYYY-MM-DD)           |
| `ui_lang`              | Codice lingua dell'interfaccia (solo Brave)           |
| `domain_filter`        | Array di allowlist/denylist di domini (solo Perplexity) |
| `max_tokens`           | Budget totale del contenuto, predefinito 25000 (solo Perplexity) |
| `max_tokens_per_page`  | Limite di token per pagina, predefinito 2048 (solo Perplexity) |

<Warning>
  Non tutti i parametri funzionano con tutti i provider. La modalità Brave `llm-context`
  rifiuta `ui_lang`, `freshness`, `date_after` e `date_before`.
  Gemini, Grok e Kimi restituiscono una risposta sintetizzata singola con citazioni. Accettano
  `count` per compatibilità con lo strumento condiviso, ma questo non cambia la
  forma della risposta grounded.
  Perplexity si comporta allo stesso modo quando usi il percorso di compatibilità
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` o `OPENROUTER_API_KEY`).
  SearXNG accetta `http://` solo per host trusted private-network o loopback;
  gli endpoint pubblici SearXNG devono usare `https://`.
  Firecrawl e Tavily supportano solo `query` e `count` tramite `web_search`
  -- usa i loro strumenti dedicati per le opzioni avanzate.
</Warning>

## x_search

`x_search` interroga i post di X (ex Twitter) usando xAI e restituisce
risposte sintetizzate dall'IA con citazioni. Accetta query in linguaggio naturale e
filtri strutturati facoltativi. OpenClaw abilita lo strumento `x_search` xAI integrato solo sulla richiesta che serve questa chiamata allo strumento.

<Note>
  xAI documenta `x_search` come supporto a ricerca per parole chiave, ricerca semantica, ricerca utente
  e recupero di thread. Per statistiche di engagement per singolo post come repost, risposte, bookmark o visualizzazioni, preferisci una ricerca mirata per l'URL esatto del post
  o per lo status ID. Le ricerche ampie per parole chiave possono trovare il post giusto ma restituire metadati per-post meno completi. Un buon pattern è: trova prima il post, poi
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
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // facoltativo se XAI_API_KEY è impostato
          },
        },
      },
    },
  },
}
```

### Parametri di x_search

| Parametro                    | Descrizione                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Query di ricerca (obbligatoria)                        |
| `allowed_x_handles`          | Limita i risultati a handle X specifici                |
| `excluded_x_handles`         | Esclude handle X specifici                             |
| `from_date`                  | Includi solo post in o dopo questa data (YYYY-MM-DD)   |
| `to_date`                    | Includi solo post in o prima di questa data (YYYY-MM-DD) |
| `enable_image_understanding` | Permette a xAI di analizzare le immagini allegate ai post corrispondenti |
| `enable_video_understanding` | Permette a xAI di analizzare i video allegati ai post corrispondenti |

### Esempio di x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statistiche per singolo post: usa l'URL esatto dello status o lo status ID quando possibile
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Esempi

```javascript
// Ricerca di base
await web_search({ query: "OpenClaw plugin SDK" });

// Ricerca specifica per la Germania
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Risultati recenti (ultima settimana)
await web_search({ query: "AI developments", freshness: "week" });

// Intervallo di date
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtro di dominio (solo Perplexity)
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
    // oppure: allow: ["group:web"]  (include web_search, x_search e web_fetch)
  },
}
```

## Correlati

- [Web Fetch](/it/tools/web-fetch) -- recupera un URL ed estrae contenuto leggibile
- [Browser web](/it/tools/browser) -- automazione completa del browser per siti con molto JS
- [Grok Search](/it/tools/grok-search) -- Grok come provider `web_search`
- [Ollama Web Search](/it/tools/ollama-search) -- ricerca web senza chiave tramite il tuo host Ollama
