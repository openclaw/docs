---
read_when:
    - Vuoi abilitare o configurare web_search
    - Si desidera abilitare o configurare x_search
    - Devi scegliere un provider di ricerca
    - Vuoi comprendere il rilevamento automatico e la selezione del provider
sidebarTitle: Web Search
summary: web_search, x_search e web_fetch -- cerca sul web, cerca post su X oppure recupera il contenuto della pagina
title: Ricerca web
x-i18n:
    generated_at: "2026-06-27T18:25:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

Lo strumento `web_search` cerca nel web usando il provider configurato e
restituisce risultati. I risultati vengono memorizzati nella cache per query per 15 minuti (configurabile).

OpenClaw include anche `x_search` per i post di X (precedentemente Twitter) e
`web_fetch` per il recupero leggero di URL. In questa fase, `web_fetch` resta
locale mentre `web_search` e `x_search` possono usare xAI Responses sotto il cofano.

<Info>
  `web_search` è uno strumento HTTP leggero, non automazione del browser. Per
  siti ricchi di JS o accessi con login, usa [Web Browser](/it/tools/browser). Per
  recuperare un URL specifico, usa [Web Fetch](/it/tools/web-fetch).
</Info>

## Avvio rapido

<Steps>
  <Step title="Choose a provider">
    Scegli un provider e completa qualsiasi configurazione richiesta. Alcuni provider sono
    senza chiave, mentre altri usano chiavi API. Consulta le pagine dei provider qui sotto per
    i dettagli.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Questo salva il provider e qualsiasi credenziale necessaria. Puoi anche impostare una variabile
    d'ambiente (per esempio `BRAVE_API_KEY`) e saltare questo passaggio per i provider
    basati su API.
  </Step>
  <Step title="Use it">
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
    Risultati strutturati con frammenti. Supporta la modalità `llm-context` e filtri per paese/lingua. Piano gratuito disponibile.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/it/plugins/codex-harness">
    Risposte fondate sintetizzate dall'AI tramite il tuo account app-server Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/it/tools/duckduckgo-search">
    Provider senza chiave. Nessuna chiave API necessaria. Integrazione non ufficiale basata su HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/it/tools/exa-search">
    Ricerca neurale + per parole chiave con estrazione dei contenuti (evidenziazioni, testo, riepiloghi).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/it/tools/firecrawl">
    Risultati strutturati. Ideale in abbinamento a `firecrawl_search` e `firecrawl_scrape` per l'estrazione approfondita.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/it/tools/gemini-search">
    Risposte sintetizzate dall'AI con citazioni tramite grounding di Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/it/tools/grok-search">
    Risposte sintetizzate dall'AI con citazioni tramite grounding web di xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/it/tools/kimi-search">
    Risposte sintetizzate dall'AI con citazioni tramite ricerca web Moonshot; i fallback di chat senza grounding falliscono esplicitamente.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/it/tools/minimax-search">
    Risultati strutturati tramite l'API di ricerca MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/it/tools/ollama-search">
    Ricerca tramite un host Ollama locale con accesso effettuato o l'API Ollama ospitata.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/it/tools/parallel-search">
    API Parallel Search a pagamento (`PARALLEL_API_KEY`); limiti di frequenza più elevati e ottimizzazione degli obiettivi.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/it/tools/parallel-search">
    Attivazione senza chiave. Search MCP gratuito di Parallel, con estratti densi ottimizzati per LLM e nessuna chiave API.
  </Card>
  <Card title="Perplexity" icon="search" href="/it/tools/perplexity-search">
    Risultati strutturati con controlli di estrazione dei contenuti e filtro per dominio.
  </Card>
  <Card title="SearXNG" icon="server" href="/it/tools/searxng-search">
    Meta-ricerca self-hosted. Nessuna chiave API necessaria. Aggrega Google, Bing, DuckDuckGo e altro.
  </Card>
  <Card title="Tavily" icon="globe" href="/it/tools/tavily">
    Risultati strutturati con profondità di ricerca, filtro per argomento e `tavily_extract` per l'estrazione da URL.
  </Card>
</CardGroup>

### Confronto dei provider

| Provider                                         | Stile dei risultati                                           | Filtri                                           | Chiave API                                                                               |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/it/tools/brave-search)                     | Frammenti strutturati                                         | Paese, lingua, tempo, modalità `llm-context`     | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/it/plugins/codex-harness)    | Sintesi AI + URL delle fonti                                  | Domini, dimensione del contesto, posizione utente | Nessuna; usa l'accesso Codex/OpenAI                                                     |
| [DuckDuckGo](/it/tools/duckduckgo-search)           | Frammenti strutturati                                         | --                                               | Nessuna (senza chiave)                                                                  |
| [Exa](/it/tools/exa-search)                         | Strutturati + estratti                                        | Modalità neurale/parole chiave, data, estrazione dei contenuti | `EXA_API_KEY`                                                                           |
| [Firecrawl](/it/tools/firecrawl)                    | Frammenti strutturati                                         | Tramite lo strumento `firecrawl_search`          | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/it/tools/gemini-search)                   | Sintesi AI + citazioni                                        | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/it/tools/grok-search)                       | Sintesi AI + citazioni                                        | --                                               | xAI OAuth, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey`                |
| [Kimi](/it/tools/kimi-search)                       | Sintesi AI + citazioni; fallisce sui fallback di chat senza grounding | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/it/tools/minimax-search)          | Frammenti strutturati                                         | Regione (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/it/tools/ollama-search)        | Frammenti strutturati                                         | --                                               | Nessuna per host locali con accesso effettuato; `OLLAMA_API_KEY` per ricerca diretta su `https://ollama.com` |
| [Parallel](/it/tools/parallel-search)               | Estratti densi classificati per il contesto LLM               | --                                               | `PARALLEL_API_KEY` (a pagamento)                                                        |
| [Parallel Search (Free)](/it/tools/parallel-search) | Estratti densi classificati per il contesto LLM               | --                                               | Nessuna (Search MCP gratuito)                                                           |
| [Perplexity](/it/tools/perplexity-search)           | Frammenti strutturati                                         | Paese, lingua, tempo, domini, limiti di contenuto | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/it/tools/searxng-search)                 | Frammenti strutturati                                         | Categorie, lingua                                | Nessuna (self-hosted)                                                                   |
| [Tavily](/it/tools/tavily)                          | Frammenti strutturati                                         | Tramite lo strumento `tavily_search`             | `TAVILY_API_KEY`                                                                        |

## Rilevamento automatico

## Ricerca web nativa OpenAI

I modelli OpenAI Responses diretti usano automaticamente lo strumento `web_search` ospitato da OpenAI quando la ricerca web di OpenClaw è abilitata e non è fissato alcun provider gestito. Questo è un comportamento di proprietà del provider nel Plugin OpenAI incluso e si applica solo al traffico API OpenAI nativo, non agli URL base proxy compatibili con OpenAI o alle route Azure. Imposta `tools.web.search.provider` su un altro provider come `brave` per mantenere lo strumento `web_search` gestito per i modelli OpenAI, oppure imposta `tools.web.search.enabled: false` per disabilitare sia la ricerca gestita sia la ricerca OpenAI nativa.

## Ricerca web nativa Codex

Il runtime app-server Codex usa automaticamente lo strumento `web_search` ospitato da Codex
quando la ricerca web è abilitata e non è selezionato alcun provider gestito. La ricerca
ospitata nativa e lo strumento dinamico `web_search` gestito da OpenClaw sono mutuamente esclusivi,
quindi la ricerca gestita non può aggirare le restrizioni native sui domini. OpenClaw usa lo
strumento gestito quando la ricerca ospitata non è disponibile, è disabilitata esplicitamente o
viene sostituita da un provider gestito selezionato. OpenClaw mantiene disabilitata l'estensione
`web.run` autonoma di Codex perché il traffico app-server di produzione rifiuta il suo
namespace `web` definito dall'utente.

- Configura la ricerca nativa in `tools.web.search.openaiCodex`
- Imposta `tools.web.search.provider: "codex"` per predisporre Codex Hosted Search come
  provider `web_search` gestito per qualsiasi modello padre. Ogni chiamata esegue un
  turno app-server Codex effimero e limitato e fallisce se Codex non emette un elemento
  `webSearch` ospitato.
- `mode: "cached"` è la preferenza predefinita, ma Codex la risolve in accesso esterno
  live per turni app-server senza restrizioni; imposta `"live"` per richiedere
  esplicitamente l'accesso live
- Imposta `tools.web.search.provider` su un provider gestito come `brave` per usare
  invece il `web_search` gestito da OpenClaw
- Imposta `tools.web.search.openaiCodex.enabled: false` per rinunciare alla ricerca
  ospitata da Codex; gli altri provider gestiti restano disponibili
- Limitare la superficie dello strumento nativo Codex mantiene disponibile anche il `web_search`
  gestito
- Quando `allowedDomains` è impostato, il fallback gestito automatico fallisce in modo chiuso se
  la ricerca ospitata non è disponibile, così l'elenco consentito nativo non può essere aggirato
- Le esecuzioni solo LLM con strumenti disabilitati disabilitano sia la ricerca nativa sia quella gestita
- `tools.web.search.enabled: false` disabilita sia la ricerca gestita sia quella nativa

Le modifiche persistenti effettive alla policy di ricerca Codex avviano un nuovo thread vincolato così
un thread app-server già caricato non può mantenere accesso obsoleto alla ricerca ospitata.
Le restrizioni transitorie per turno usano un thread temporaneo ristretto e preservano
il binding esistente per una ripresa successiva.

Anche il traffico OpenAI ChatGPT Responses diretto può usare lo strumento
`web_search` ospitato da OpenAI. Quel percorso separato resta opt-in tramite
`tools.web.search.openaiCodex.enabled: true` e si applica solo ai modelli
`openai/*` idonei che usano `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
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

Per runtime e provider che non supportano la ricerca nativa Codex, Codex può
usare il fallback `web_search` gestito tramite il namespace degli strumenti dinamici di OpenClaw.
Usa un provider gestito esplicito quando hai bisogno dei controlli di rete specifici
del provider di OpenClaw invece della ricerca ospitata da Codex.

Selezionare `provider: "codex"` abilita il plugin `codex` incluso e usa le
stesse restrizioni `tools.web.search.openaiCodex` mostrate sopra. Autentica prima
l'app-server Codex con `openclaw models auth login --provider openai`.
L'agente padre può usare qualsiasi modello o runtime; solo il worker di ricerca
delimitato passa tramite Codex.

## Sicurezza della rete

Le chiamate al provider HTTP gestito `web_search` usano il percorso fetch protetto di OpenClaw. Per
gli host API di provider attendibili, OpenClaw consente le risposte DNS fake-IP
di Surge, Clash e sing-box in `198.18.0.0/15` e `fc00::/7` solo per quel nome host del provider.
Le altre destinazioni private, loopback, link-local e di metadati rimangono bloccate.
Codex Hosted Search è l'eccezione: il suo worker delimitato delega l'accesso alla rete
allo strumento `web_search` ospitato dell'app-server Codex.

Questa autorizzazione automatica non si applica agli URL arbitrari di `web_fetch`. Per
`web_fetch`, abilita esplicitamente `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` solo quando il tuo
proxy attendibile possiede quegli intervalli sintetici.

## Configurare la ricerca web

Gli elenchi dei provider nella documentazione e nei flussi di configurazione sono alfabetici. Il rilevamento automatico mantiene un
ordine di precedenza separato.

Se non è impostato alcun `provider`, OpenClaw controlla i provider in questo ordine e usa il
primo che è pronto:

Prima i provider supportati da API:

1. **Brave** -- `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey` (ordine 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey` (ordine 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` o `models.providers.google.apiKey` (ordine 20)
4. **Grok** -- OAuth xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` (ordine 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey` (ordine 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey` (ordine 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey` (ordine 60)
8. **Exa** -- `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` opzionale sovrascrive l'endpoint Exa (ordine 65)
9. **Tavily** -- `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey` (ordine 70)
10. **Parallel** -- API Parallel Search a pagamento tramite `PARALLEL_API_KEY` o `plugins.entries.parallel.config.webSearch.apiKey`; `plugins.entries.parallel.config.webSearch.baseUrl` opzionale sovrascrive l'endpoint (ordine 75)

Poi i provider con endpoint configurato:

11. **SearXNG** -- `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (ordine 200)

I provider senza chiave come **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** e **Codex Hosted Search** sono disponibili solo quando li
selezioni esplicitamente con `tools.web.search.provider` o tramite
`openclaw configure --section web`. OpenClaw non invia query gestite
`web_search` a un provider senza chiave solo perché non è configurato alcun provider
supportato da API.

I modelli OpenAI Responses sono un'eccezione: mentre `tools.web.search.provider` non è
impostato, usano la ricerca web nativa di OpenAI invece dei provider gestiti
sopra. Imposta `tools.web.search.provider` su `parallel-free` (o su un altro provider)
per instradarli attraverso il percorso gestito.

<Note>
  Tutti i campi chiave dei provider supportano oggetti SecretRef. Le SecretRef con ambito di plugin
  sotto `plugins.entries.<plugin>.config.webSearch.apiKey` vengono risolte per i
  provider di ricerca web supportati da API installati, inclusi Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity e Tavily,
  sia che il provider venga scelto esplicitamente tramite `tools.web.search.provider` sia
  selezionato tramite rilevamento automatico. In modalità rilevamento automatico, OpenClaw risolve solo la
  chiave del provider selezionato -- le SecretRef non selezionate restano inattive, quindi puoi
  mantenere più provider configurati senza pagare il costo di risoluzione per
  quelli che non stai usando.
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

La configurazione specifica del provider (chiavi API, URL di base, modalità) si trova sotto
`plugins.entries.<plugin>.config.webSearch.*`. Gemini può anche riutilizzare
`models.providers.google.apiKey` e `models.providers.google.baseUrl` come fallback a priorità inferiore
dopo la sua configurazione dedicata per la ricerca web e `GEMINI_API_KEY`. Consulta le
pagine dei provider per esempi.
Grok può anche riutilizzare un profilo di autenticazione OAuth xAI da `openclaw models auth login
--provider xai --method oauth`; la configurazione con chiave API resta il fallback.

`tools.web.search.provider` viene convalidato rispetto agli id dei provider di ricerca web
dichiarati dai manifest dei plugin inclusi e installati. Un refuso come `"brvae"`
fa fallire la convalida della configurazione invece di ricadere silenziosamente sul rilevamento automatico. Se un
provider configurato ha solo evidenza di plugin obsoleta, come un blocco
`plugins.entries.<plugin>` rimasto dopo la disinstallazione di un plugin di terze parti,
OpenClaw mantiene l'avvio resiliente e segnala un avviso così puoi reinstallare il
plugin o eseguire `openclaw doctor --fix` per ripulire la configurazione obsoleta.

La selezione del provider di fallback di `web_fetch` è separata:

- sceglilo con `tools.web.fetch.provider`
- oppure ometti quel campo e lascia che OpenClaw rilevi automaticamente il primo provider web-fetch
  pronto dalle credenziali configurate
- `web_fetch` non in sandbox può usare provider di plugin installati che dichiarano
  `contracts.webFetchProviders`; i fetch in sandbox consentono provider inclusi e
  installazioni verificate di plugin ufficiali, ma escludono plugin esterni di terze parti
- il plugin ufficiale Firecrawl fornisce il fallback web-fetch, configurato sotto
  `plugins.entries.firecrawl.config.webFetch.*`

Quando scegli **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw può anche chiedere:

- la regione API Moonshot (`https://api.moonshot.ai/v1` o `https://api.moonshot.cn/v1`)
- il modello di ricerca web Kimi predefinito (predefinito: `kimi-k2.6`)

Per `x_search`, configura `plugins.entries.xai.config.xSearch.*`. Usa lo
stesso profilo di autenticazione xAI della chat, oppure la credenziale
`XAI_API_KEY` / del plugin web-search usata dalla ricerca web Grok.
La configurazione legacy `tools.web.x_search.*` viene migrata automaticamente da `openclaw doctor --fix`.
Quando scegli Grok durante `openclaw onboard` o `openclaw configure --section web`,
OpenClaw può anche offrire la configurazione opzionale di `x_search` con la stessa credenziale.
Questo è un passaggio di follow-up separato all'interno del percorso Grok, non una scelta separata di
provider di ricerca web di primo livello. Se scegli un altro provider, OpenClaw non
mostra il prompt `x_search`.

### Archiviare le chiavi API

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
    Consulta [Variabili d'ambiente](/it/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametri dello strumento

| Parametro             | Descrizione                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | Query di ricerca (obbligatoria)                       |
| `count`               | Risultati da restituire (1-10, predefinito: 5)        |
| `country`             | Codice paese ISO a 2 lettere (ad es. "US", "DE")     |
| `language`            | Codice lingua ISO 639-1 (ad es. "en", "de")          |
| `search_lang`         | Codice lingua di ricerca (solo Brave)                 |
| `freshness`           | Filtro temporale: `day`, `week`, `month` o `year`     |
| `date_after`          | Risultati dopo questa data (YYYY-MM-DD)               |
| `date_before`         | Risultati prima di questa data (YYYY-MM-DD)           |
| `ui_lang`             | Codice lingua dell'interfaccia (solo Brave)           |
| `domain_filter`       | Array allowlist/denylist di domini (solo Perplexity)  |
| `max_tokens`          | Budget totale dei contenuti, predefinito 25000 (solo Perplexity) |
| `max_tokens_per_page` | Limite di token per pagina, predefinito 2048 (solo Perplexity) |

<Warning>
  Non tutti i parametri funzionano con tutti i provider. La modalità Brave `llm-context`
  rifiuta `ui_lang`; `date_before` richiede anche `date_after` perché gli intervalli
  di freschezza personalizzati di Brave richiedono sia data di inizio sia data di fine.
  Gemini, Grok e Kimi restituiscono una risposta sintetizzata con citazioni. Accettano
  `count` per compatibilità con lo strumento condiviso, ma non cambia la forma della
  risposta fondata. Gemini tratta la freschezza `day` come un suggerimento di recenza; valori
  di freschezza più ampi e date esplicite impostano gli intervalli temporali di grounding di Google Search.
  Perplexity si comporta allo stesso modo quando usi il percorso di compatibilità
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` o `OPENROUTER_API_KEY`).
  SearXNG accetta `http://` solo per host attendibili di rete privata o loopback;
  gli endpoint SearXNG pubblici devono usare `https://`.
  Firecrawl e Tavily supportano solo `query` e `count` tramite `web_search`
  -- usa i loro strumenti dedicati per le opzioni avanzate.
</Warning>

## x_search

`x_search` interroga i post di X (in precedenza Twitter) usando xAI e restituisce
risposte sintetizzate dall'AI con citazioni. Accetta query in linguaggio naturale e
filtri strutturati opzionali. OpenClaw abilita lo strumento integrato xAI `x_search`
solo sulla richiesta che serve questa chiamata allo strumento.

<Note>
  xAI documenta `x_search` come compatibile con ricerca per parole chiave, ricerca semantica, ricerca utenti
  e recupero di thread. Per statistiche di engagement per singolo post come repost,
  risposte, segnalibri o visualizzazioni, preferisci una ricerca mirata per l'URL esatto del post
  o l'ID stato. Le ricerche ampie per parole chiave possono trovare il post giusto ma restituire metadati
  per singolo post meno completi. Un buon schema è: individua prima il post, poi
  esegui una seconda query `x_search` focalizzata su quel post esatto.
</Note>

### Configurazione x_search

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
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` invia richieste POST a `<baseUrl>/responses` quando
`plugins.entries.xai.config.xSearch.baseUrl` è impostato. Se quel campo viene omesso,
ricade su `plugins.entries.xai.config.webSearch.baseUrl`, poi sul
legacy `tools.web.search.grok.baseUrl` e infine sull'endpoint xAI pubblico.

### Parametri x_search

| Parametro                    | Descrizione                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Query di ricerca (obbligatoria)                       |
| `allowed_x_handles`          | Limita i risultati a handle X specifici               |
| `excluded_x_handles`         | Escludi handle X specifici                            |
| `from_date`                  | Includi solo post in questa data o successivi (YYYY-MM-DD) |
| `to_date`                    | Includi solo post in questa data o precedenti (YYYY-MM-DD) |
| `enable_image_understanding` | Consenti a xAI di ispezionare le immagini allegate ai post corrispondenti |
| `enable_video_understanding` | Consenti a xAI di ispezionare i video allegati ai post corrispondenti |

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

- [Recupero Web](/it/tools/web-fetch) -- recupera un URL ed estrae contenuto leggibile
- [Browser Web](/it/tools/browser) -- automazione completa del browser per siti con uso intensivo di JS
- [Ricerca Grok](/it/tools/grok-search) -- Grok come provider di `web_search`
- [Ricerca Web Ollama](/it/tools/ollama-search) -- ricerca web senza chiavi tramite il tuo host Ollama
