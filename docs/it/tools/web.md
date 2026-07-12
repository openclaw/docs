---
read_when:
    - Vuoi abilitare o configurare web_search
    - Vuoi abilitare o configurare x_search
    - Devi scegliere un provider di ricerca
    - Vuoi comprendere il rilevamento automatico e la selezione del provider
sidebarTitle: Web Search
summary: web_search, x_search e web_fetch -- cerca nel web, cerca nei post di X o recupera il contenuto delle pagine
title: Ricerca sul web
x-i18n:
    generated_at: "2026-07-12T07:36:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` cerca sul web con il provider configurato e restituisce
risultati normalizzati, memorizzati nella cache per query per 15 minuti (configurabile). OpenClaw
include anche `x_search` per i post su X (precedentemente Twitter) e `web_fetch` per il
recupero leggero di URL. `web_fetch` viene sempre eseguito localmente; `web_search` viene instradato
tramite xAI Responses quando Grok è il provider, mentre `x_search` usa sempre
xAI Responses.

<Info>
  `web_search` è uno strumento HTTP leggero, non un sistema di automazione del browser. Per
  siti che fanno ampio uso di JS o richiedono l'accesso, usa il [browser web](/it/tools/browser). Per
  recuperare un URL specifico, usa [Web Fetch](/it/tools/web-fetch).
</Info>

## Avvio rapido

<Steps>
  <Step title="Scegli un provider">
    Scegli un provider e completa l'eventuale configurazione richiesta. Alcuni provider
    non richiedono chiavi, mentre altri necessitano di una chiave API. Consulta le pagine dei provider riportate di seguito per
    i dettagli.
  </Step>
  <Step title="Configura">
    ```bash
    openclaw configure --section web
    ```
    Questo comando memorizza il provider e le eventuali credenziali necessarie. Per i provider
    basati su API, puoi invece impostare la variabile di ambiente del provider (ad esempio
    `BRAVE_API_KEY`) e saltare questo passaggio.
  </Step>
  <Step title="Usalo">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Per i post su X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Scelta di un provider

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/it/tools/brave-search">
    Risultati strutturati con estratti. Supporta la modalità `llm-context` e i filtri per paese e lingua. È disponibile un piano gratuito.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/it/plugins/codex-harness">
    Risposte sintetizzate dall'IA e basate su fonti tramite il tuo account del server dell'app Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/it/tools/duckduckgo-search">
    Provider senza chiave. Non è necessaria alcuna chiave API. Integrazione non ufficiale basata su HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/it/tools/exa-search">
    Ricerca neurale e per parole chiave con estrazione dei contenuti (parti evidenziate, testo e riepiloghi).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/it/tools/firecrawl">
    Risultati strutturati. Offre i risultati migliori in abbinamento a `firecrawl_search` e `firecrawl_scrape` per un'estrazione approfondita.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/it/tools/gemini-search">
    Risposte sintetizzate dall'IA con citazioni tramite l'ancoraggio a Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/it/tools/grok-search">
    Risposte sintetizzate dall'IA con citazioni tramite l'ancoraggio web di xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/it/tools/kimi-search">
    Risposte sintetizzate dall'IA con citazioni tramite la ricerca web di Moonshot; i fallback alla chat non ancorata generano esplicitamente un errore.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/it/tools/minimax-search">
    Risultati strutturati tramite l'API di ricerca del piano MiniMax Token.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/it/tools/ollama-search">
    Ricerca tramite un host Ollama locale con accesso effettuato oppure tramite l'API Ollama ospitata.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/it/tools/parallel-search">
    API Parallel Search a pagamento (`PARALLEL_API_KEY`); limiti di frequenza più elevati e ottimizzazione degli obiettivi.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/it/tools/parallel-search">
    Opzione senza chiave da attivare esplicitamente. Search MCP gratuito di Parallel, con estratti densi ottimizzati per gli LLM e senza chiave API.
  </Card>
  <Card title="Perplexity" icon="search" href="/it/tools/perplexity-search">
    Risultati strutturati con controlli per l'estrazione dei contenuti e filtri per dominio.
  </Card>
  <Card title="SearXNG" icon="server" href="/it/tools/searxng-search">
    Metamotore di ricerca ospitato autonomamente. Non è necessaria alcuna chiave API. Aggrega Google, Bing, DuckDuckGo e altri servizi.
  </Card>
  <Card title="Tavily" icon="globe" href="/it/tools/tavily">
    Risultati strutturati con profondità di ricerca, filtri per argomento e `tavily_extract` per l'estrazione dagli URL.
  </Card>
</CardGroup>

### Confronto tra provider

| Provider                                         | Stile dei risultati                                               | Filtri                                                   | Chiave API                                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [Brave](/it/tools/brave-search)                     | Estratti strutturati                                               | Paese, lingua, periodo, modalità `llm-context`            | `BRAVE_API_KEY`                                                                                              |
| [Codex Hosted Search](/it/plugins/codex-harness)    | Sintesi tramite IA + URL delle fonti                               | Domini, dimensione del contesto, posizione dell'utente   | Nessuna; usa l'accesso Codex/OpenAI                                                                           |
| [DuckDuckGo](/it/tools/duckduckgo-search)           | Estratti strutturati                                               | --                                                       | Nessuna (senza chiave)                                                                                        |
| [Exa](/it/tools/exa-search)                         | Risultati strutturati + contenuti estratti                         | Modalità neurale/per parole chiave, data, estrazione dei contenuti | `EXA_API_KEY`                                                                                       |
| [Firecrawl](/it/tools/firecrawl)                    | Estratti strutturati                                               | Tramite lo strumento `firecrawl_search`                  | `FIRECRAWL_API_KEY`                                                                                           |
| [Gemini](/it/tools/gemini-search)                   | Sintesi tramite IA + citazioni                                     | --                                                       | `GEMINI_API_KEY`                                                                                              |
| [Grok](/it/tools/grok-search)                       | Sintesi tramite IA + citazioni                                     | --                                                       | OAuth xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey`                                      |
| [Kimi](/it/tools/kimi-search)                       | Sintesi tramite IA + citazioni; errore in caso di fallback alla chat non ancorata | --                                      | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                                          |
| [MiniMax Search](/it/tools/minimax-search)          | Estratti strutturati                                               | Regione (`global` / `cn`)                                | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`                                   |
| [Ollama Web Search](/it/tools/ollama-search)        | Estratti strutturati                                               | --                                                       | Nessuna per gli host locali con accesso effettuato; `OLLAMA_API_KEY` per la ricerca diretta su `https://ollama.com` |
| [Parallel](/it/tools/parallel-search)               | Estratti densi classificati per il contesto degli LLM             | --                                                       | `PARALLEL_API_KEY` (a pagamento)                                                                              |
| [Parallel Search (Free)](/it/tools/parallel-search) | Estratti densi classificati per il contesto degli LLM             | --                                                       | Nessuna (Search MCP gratuito)                                                                                 |
| [Perplexity](/it/tools/perplexity-search)           | Estratti strutturati                                               | Paese, lingua, periodo, domini, limiti dei contenuti      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                                                  |
| [SearXNG](/it/tools/searxng-search)                 | Estratti strutturati                                               | Categorie, lingua                                        | Nessuna (ospitato autonomamente)                                                                              |
| [Tavily](/it/tools/tavily)                          | Estratti strutturati                                               | Tramite lo strumento `tavily_search`                     | `TAVILY_API_KEY`                                                                                              |

## Rilevamento automatico

Gli elenchi dei provider nella documentazione e nei flussi di configurazione sono in ordine alfabetico. Il rilevamento automatico usa un
ordine di precedenza separato e fisso e seleziona un provider che richiede una
credenziale (`requiresCredential !== false`) solo quando ne trova uno configurato. Se
non è impostato alcun `provider`, OpenClaw controlla i provider nell'ordine seguente e usa il
primo pronto:

Prima i provider basati su API:

1. **Brave** -- `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey` (ordine 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey` (ordine 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` o `models.providers.google.apiKey` (ordine 20)
4. **Grok** -- OAuth xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` (ordine 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey` (ordine 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey` (ordine 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey` (ordine 60)
8. **Exa** -- `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey`; il valore facoltativo `plugins.entries.exa.config.webSearch.baseUrl` sostituisce l'endpoint Exa (ordine 65)
9. **Tavily** -- `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey` (ordine 70)
10. **Parallel** -- API Parallel Search a pagamento tramite `PARALLEL_API_KEY` o `plugins.entries.parallel.config.webSearch.apiKey`; il valore facoltativo `plugins.entries.parallel.config.webSearch.baseUrl` sostituisce l'endpoint (ordine 75)

Successivamente, i provider con endpoint configurato:

11. **SearXNG** -- `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (ordine 200)

I provider senza chiave, come **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** e **Codex Hosted Search**, non prevalgono mai nel rilevamento automatico,
anche se dispongono di un valore di ordinamento interno. Vengono usati solo quando li
selezioni esplicitamente con `tools.web.search.provider` o tramite
`openclaw configure --section web`. OpenClaw non invia le query gestite di
`web_search` a un provider senza chiave solo perché non è configurato alcun provider
basato su API.

I modelli OpenAI Responses costituiscono un'eccezione: quando `tools.web.search.provider`
non è impostato, usano la ricerca web nativa di OpenAI anziché i provider gestiti
sopra elencati (vedi sotto). Imposta `tools.web.search.provider` su
`parallel-free` (o su un altro provider) per instradarli invece attraverso il percorso gestito.

<Note>
  Tutti i campi delle chiavi dei provider supportano oggetti SecretRef. I SecretRef con ambito Plugin
  in `plugins.entries.<plugin>.config.webSearch.apiKey` vengono risolti per i
  provider di ricerca web basati su API installati, tra cui Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity e Tavily,
  sia quando il provider viene scelto esplicitamente tramite `tools.web.search.provider`, sia
  quando viene selezionato mediante il rilevamento automatico. In modalità di rilevamento automatico, OpenClaw risolve solo la
  chiave del provider selezionato: i SecretRef non selezionati rimangono inattivi, quindi puoi
  mantenere configurati più provider senza sostenere il costo di risoluzione per quelli
  che non utilizzi.
</Note>

## Ricerca web nativa di OpenAI

I modelli OpenAI Responses diretti (`api: "openai-responses"`, provider `openai`,
senza URL di base oppure con un URL di base ufficiale dell'API OpenAI) usano
automaticamente lo strumento `web_search` ospitato da OpenAI quando la ricerca
web di OpenClaw è abilitata e non è stato selezionato esplicitamente alcun
provider gestito. Questo comportamento appartiene al provider nel plugin
OpenAI incluso e non si applica agli URL di base di proxy compatibili con
OpenAI né alle route Azure. Imposta `tools.web.search.provider` su un altro
provider, come `brave`, per mantenere lo strumento `web_search` gestito per i
modelli OpenAI, oppure imposta `tools.web.search.enabled: false` per
disabilitare sia la ricerca gestita sia quella nativa di OpenAI.

## Ricerca web nativa di Codex

Il runtime app-server di Codex usa automaticamente lo strumento `web_search`
ospitato da Codex quando la ricerca web è abilitata e non è selezionato alcun
provider gestito. La ricerca nativa ospitata e lo strumento dinamico
`web_search` gestito da OpenClaw si escludono a vicenda, quindi la ricerca
gestita non può aggirare le restrizioni sui domini della ricerca nativa.
OpenClaw usa lo strumento gestito quando la ricerca ospitata non è disponibile,
è disabilitata esplicitamente oppure viene sostituita da un provider gestito
selezionato. OpenClaw mantiene disabilitata l'estensione autonoma `web.run` di
Codex (`features.standalone_web_search: false`) perché il traffico app-server
di produzione rifiuta il namespace `web` definito dall'utente.

- Configura la ricerca nativa in `tools.web.search.openaiCodex`
- Imposta `tools.web.search.provider: "codex"` per predisporre Codex Hosted
  Search come provider `web_search` gestito per qualsiasi modello padre. Ogni
  chiamata esegue un turno effimero e limitato dell'app-server di Codex e non
  riesce se Codex non emette un elemento `webSearch` ospitato.
- `mode: "cached"` è la preferenza predefinita, ma Codex la risolve in accesso
  esterno in tempo reale per i turni app-server senza restrizioni; imposta
  `"live"` per richiedere esplicitamente l'accesso in tempo reale
- Imposta `tools.web.search.provider` su un provider gestito, come `brave`, per
  usare invece `web_search` gestito da OpenClaw
- Imposta `tools.web.search.openaiCodex.enabled: false` per rinunciare alla
  ricerca ospitata da Codex; gli altri provider gestiti rimangono disponibili
- Limitando la superficie degli strumenti nativi di Codex, anche `web_search`
  gestito rimane disponibile
- Quando è impostato `allowedDomains`, il fallback gestito automatico si
  interrompe in modo sicuro se la ricerca ospitata non è disponibile, in modo
  che l'elenco di domini consentiti nativo non possa essere aggirato
- Le esecuzioni basate soltanto sull'LLM con gli strumenti disabilitati
  disabilitano sia la ricerca nativa sia quella gestita
- `tools.web.search.enabled: false` disabilita sia la ricerca gestita sia quella
  nativa

Le modifiche persistenti ai criteri di ricerca effettivi di Codex avviano un
nuovo thread associato, affinché un thread app-server già caricato non possa
mantenere un accesso obsoleto alla ricerca ospitata. Le restrizioni transitorie
per singolo turno usano un thread temporaneo con restrizioni e conservano
l'associazione esistente per la successiva ripresa.

Anche il traffico OpenAI ChatGPT Responses diretto può usare lo strumento
`web_search` ospitato da OpenAI. Questo percorso separato rimane facoltativo
tramite `tools.web.search.openaiCodex.enabled: true` e si applica soltanto ai
modelli `openai/*` idonei che usano `api: "openai-chatgpt-responses"`.

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

Per i runtime e i provider che non supportano la ricerca nativa di Codex,
Codex può usare il fallback `web_search` gestito tramite il namespace dinamico
degli strumenti di OpenClaw. Usa un provider gestito esplicito quando ti
servono i controlli di rete specifici del provider di OpenClaw anziché la
ricerca ospitata da Codex.

La selezione di `provider: "codex"` abilita il plugin `codex` incluso e usa le
stesse restrizioni `tools.web.search.openaiCodex` mostrate sopra. Autentica
prima l'app-server di Codex con `openclaw models auth login --provider openai`.
L'agente padre può usare qualsiasi modello o runtime; soltanto il worker di
ricerca limitato viene eseguito tramite Codex.

## Sicurezza della rete

Le chiamate HTTP dei provider `web_search` gestiti usano il percorso di
recupero protetto di OpenClaw, limitato al nome host del provider corrente.
Soltanto per tale nome host, OpenClaw consente le risposte DNS fake-IP di
Surge, Clash e sing-box negli intervalli `198.18.0.0/15` e `fc00::/7`. Le altre
destinazioni private, local loopback, link-local e di metadati rimangono
bloccate. Codex Hosted Search costituisce l'eccezione: il suo worker limitato
delega l'accesso alla rete allo strumento `web_search` ospitato dall'app-server
di Codex.

Questa autorizzazione automatica non si applica agli URL `web_fetch` arbitrari.
Per `web_fetch`, abilita esplicitamente
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` e
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` soltanto quando il tuo
proxy attendibile gestisce tali intervalli sintetici.

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

La configurazione specifica del provider (chiavi API, URL di base, modalità) si
trova in `plugins.entries.<plugin>.config.webSearch.*`. Gemini può inoltre
riutilizzare `models.providers.google.apiKey` e
`models.providers.google.baseUrl` come fallback con priorità inferiore, dopo
la propria configurazione dedicata alla ricerca web e `GEMINI_API_KEY`. Per
alcuni esempi, consulta le pagine dei provider.
Grok può inoltre riutilizzare un profilo di autenticazione OAuth xAI ottenuto
con `openclaw models auth login --provider xai --method oauth`; la
configurazione tramite chiave API rimane il fallback.

`tools.web.search.provider` viene convalidato rispetto agli ID dei provider di
ricerca web dichiarati dai manifest dei plugin inclusi e installati. Un errore
di battitura come `"brvae"` causa il fallimento della convalida della
configurazione anziché ricorrere silenziosamente al rilevamento automatico. Se
per un provider configurato rimangono soltanto dati obsoleti del plugin, come
un blocco `plugins.entries.<plugin>` residuo dopo la disinstallazione di un
plugin di terze parti, OpenClaw mantiene resiliente l'avvio e segnala un
avviso, così puoi reinstallare il plugin oppure eseguire
`openclaw doctor --fix` per ripulire la configurazione obsoleta.

La selezione del provider di fallback per `web_fetch` è separata:

- sceglilo con `tools.web.fetch.provider`
- oppure ometti questo campo e lascia che OpenClaw rilevi automaticamente il
  primo provider di recupero web pronto in base alle credenziali configurate
- `web_fetch` senza sandbox può usare i provider dei plugin installati che
  dichiarano `contracts.webFetchProviders`; i recuperi nella sandbox
  consentono i provider inclusi e le installazioni verificate dei plugin
  ufficiali, ma escludono i plugin esterni di terze parti
- il plugin ufficiale Firecrawl è attualmente l'unico contributore
  `webFetchProviders` incluso ed è configurato in
  `plugins.entries.firecrawl.config.webFetch.*`

Quando scegli **Kimi** durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw può anche richiedere:

- la regione dell'API Moonshot (`https://api.moonshot.ai/v1` oppure `https://api.moonshot.cn/v1`)
- il modello predefinito di ricerca web di Kimi (il valore predefinito è `kimi-k2.6`)

Per `x_search`, configura `plugins.entries.xai.config.xSearch.*`. Usa lo stesso
profilo di autenticazione xAI della chat oppure la credenziale
`XAI_API_KEY`/di ricerca web del plugin usata dalla ricerca web di Grok.
La configurazione precedente `tools.web.x_search.*` viene migrata
automaticamente da `openclaw doctor --fix`.
Quando scegli Grok durante `openclaw onboard` o
`openclaw configure --section web`, OpenClaw offre anche la configurazione
facoltativa di `x_search` con la stessa credenziale, subito dopo il
completamento della configurazione di Grok. Si tratta di un passaggio
successivo separato all'interno del percorso di Grok, non di una scelta
separata del provider di ricerca web di primo livello. Se scegli un altro
provider, OpenClaw non mostra la richiesta relativa a `x_search`.

### Archiviazione delle chiavi API

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
  <Tab title="Variabile di ambiente">
    Imposta la variabile di ambiente del provider nell'ambiente del processo Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Per un'installazione del Gateway, inseriscila in `~/.openclaw/.env`.
    Consulta [Variabili di ambiente](/it/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametri dello strumento

| Parametro             | Descrizione                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | Query di ricerca (obbligatoria)                                    |
| `count`               | Risultati da restituire (1-10, valore predefinito: 5)              |
| `country`             | Codice paese ISO di 2 lettere (ad es. "US", "DE")                  |
| `language`            | Codice lingua ISO 639-1 (ad es. "en", "de")                        |
| `search_lang`         | Codice della lingua di ricerca (solo Brave)                        |
| `freshness`           | Filtro temporale: `day`, `week`, `month` oppure `year`             |
| `date_after`          | Risultati successivi a questa data (YYYY-MM-DD)                     |
| `date_before`         | Risultati precedenti a questa data (YYYY-MM-DD)                     |
| `ui_lang`             | Codice della lingua dell'interfaccia (solo Brave)                  |
| `domain_filter`       | Array di domini consentiti/negati (solo Perplexity)                |
| `max_tokens`          | Budget totale di token per i contenuti, solo API Perplexity Search nativa |
| `max_tokens_per_page` | Limite di token estratti per pagina, solo API Perplexity Search nativa |

<Warning>
  Non tutti i parametri funzionano con tutti i provider. La modalità
  `llm-context` di Brave rifiuta `ui_lang`; `date_before` richiede inoltre
  `date_after`, perché gli intervalli di aggiornamento personalizzati di Brave
  richiedono sia la data iniziale sia quella finale.
  Gemini, Grok e Kimi restituiscono un'unica risposta sintetizzata con
  citazioni. Accettano `count` per la compatibilità con lo strumento condiviso,
  ma questo parametro non modifica la struttura della risposta basata sulle
  fonti. Gemini tratta l'aggiornamento `day` come un'indicazione di recenza; i
  valori di aggiornamento più ampi e le date esplicite impostano gli intervalli
  temporali delle fonti di Google Search.
  Perplexity si comporta nello stesso modo quando usi il percorso di
  compatibilità Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` oppure `OPENROUTER_API_KEY`); tale percorso elimina inoltre il
  supporto per `max_tokens` e `max_tokens_per_page`.
  SearXNG accetta `http://` soltanto per host attendibili di reti private o
  local loopback; gli endpoint SearXNG pubblici devono usare `https://`.
  Firecrawl e Tavily supportano soltanto `query` e `count` tramite `web_search`
  -- usa i rispettivi strumenti dedicati per le opzioni avanzate.
</Warning>

## x_search

`x_search` interroga i post su X (precedentemente Twitter) tramite xAI e
restituisce risposte sintetizzate dall'IA con citazioni. Accetta query in
linguaggio naturale e filtri strutturati facoltativi. OpenClaw costruisce lo
strumento `x_search` integrato di xAI per ogni richiesta, invece di mantenerlo
registrato in modo permanente, quindi è attivo soltanto durante il turno che
lo invoca effettivamente.

<Warning>
  `x_search` viene eseguito sui server di xAI. xAI addebita 5 USD ogni 1.000
  chiamate allo strumento, oltre ai token di input e output del modello.
</Warning>

<Note>
  La documentazione di xAI indica che `x_search` supporta la ricerca per parole
  chiave, la ricerca semantica, la ricerca di utenti e il recupero dei thread.
  Per le statistiche di interazione dei singoli post, come ripubblicazioni,
  risposte, segnalibri o visualizzazioni, preferisci una ricerca mirata
  dell'URL esatto del post o dell'ID di stato. Le ricerche generiche per parole
  chiave possono individuare il post corretto, ma restituire metadati meno
  completi per il singolo post. Un buon approccio consiste nell'individuare
  prima il post e poi eseguire una seconda query `x_search` incentrata su quel
  post specifico.
</Note>

### Configurazione di x_search

Se `enabled` viene omesso, `x_search` viene esposto solo quando il provider del
modello attivo è `xai` e le credenziali xAI vengono risolte. Per un modello attivo
con un provider noto diverso da xAI, imposta `plugins.entries.xai.config.xSearch.enabled`
su `true` per abilitare esplicitamente l'uso tra provider diversi. Se il provider
del modello attivo è mancante o non risolto, lo strumento rimane nascosto. Imposta
`enabled` su `false` per disabilitarlo per tutti i provider. Le credenziali xAI
sono sempre obbligatorie.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // obbligatorio per un provider di modelli noto diverso da xAI
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // facoltativo, sostituisce webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // facoltativo se è configurato un profilo di autenticazione xAI o XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // URL di base condiviso facoltativo per xAI Responses
          },
        },
      },
    },
  },
}
```

`x_search` invia una richiesta POST a `<baseUrl>/responses` quando è impostato
`plugins.entries.xai.config.xSearch.baseUrl`. Se questo campo viene omesso,
utilizza come ripiego `plugins.entries.xai.config.webSearch.baseUrl`, quindi il
valore precedente `tools.web.search.grok.baseUrl` e infine l'endpoint pubblico
di xAI (`https://api.x.ai/v1`).

### Parametri di x_search

| Parametro                    | Descrizione                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `query`                      | Query di ricerca (obbligatoria)                                 |
| `allowed_x_handles`          | Limita i risultati a un massimo di 20 handle X                  |
| `excluded_x_handles`         | Esclude un massimo di 20 handle X                               |
| `from_date`                  | Include solo i post pubblicati in questa data o successivamente (YYYY-MM-DD) |
| `to_date`                    | Include solo i post pubblicati in questa data o precedentemente (YYYY-MM-DD) |
| `enable_image_understanding` | Consente a xAI di esaminare le immagini allegate ai post corrispondenti |
| `enable_video_understanding` | Consente a xAI di esaminare i video allegati ai post corrispondenti |

`allowed_x_handles` ed `excluded_x_handles` si escludono a vicenda.

### Esempio di x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statistiche per post: quando possibile, usa l'URL esatto dello stato o il relativo ID
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

// Filtro per dominio (solo Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Profili degli strumenti

Se utilizzi profili degli strumenti o elenchi di elementi consentiti, aggiungi `web_search`, `x_search` o `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // oppure: allow: ["group:web"]  (include web_search, x_search e web_fetch)
  },
}
```

## Contenuti correlati

- [Recupero web](/it/tools/web-fetch) -- recupera un URL e ne estrae il contenuto leggibile
- [Browser web](/it/tools/browser) -- automazione completa del browser per siti che fanno ampio uso di JS
- [Ricerca Grok](/it/tools/grok-search) -- Grok come provider di `web_search`
- [Ricerca web Ollama](/it/tools/ollama-search) -- ricerca web senza chiave tramite il tuo host Ollama
