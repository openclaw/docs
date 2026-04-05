---
read_when:
    - Vuoi capire quali funzionalità possono chiamare API a pagamento
    - Hai bisogno di verificare chiavi, costi e visibilità dell'utilizzo
    - Stai spiegando il reporting dei costi in /status o /usage
summary: Verificare cosa può generare costi, quali chiavi vengono usate e come visualizzare l'utilizzo
title: Utilizzo API e costi
x-i18n:
    generated_at: "2026-04-05T14:03:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71789950fe54dcdcd3e34c8ad6e3143f749cdfff5bbc2f14be4b85aaa467b14c
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Utilizzo API e costi

Questo documento elenca le **funzionalità che possono invocare chiavi API** e dove compaiono i relativi costi. Si concentra sulle
funzionalità di OpenClaw che possono generare utilizzo del provider o chiamate API a pagamento.

## Dove compaiono i costi (chat + CLI)

**Snapshot dei costi per sessione**

- `/status` mostra il modello corrente della sessione, l'utilizzo del contesto e i token dell'ultima risposta.
- Se il modello usa **autenticazione con chiave API**, `/status` mostra anche il **costo stimato** dell'ultima risposta.
- Se i metadati della sessione live sono scarsi, `/status` può recuperare contatori di token/cache
  e l'etichetta del modello runtime attivo dall'ultima voce di utilizzo del transcript.
  I valori live esistenti diversi da zero hanno comunque la precedenza e i totali del transcript di dimensione prompt
  possono prevalere quando i totali memorizzati mancano o sono inferiori.

**Piè di pagina dei costi per messaggio**

- `/usage full` aggiunge un piè di pagina di utilizzo a ogni risposta, incluso il **costo stimato** (solo con chiave API).
- `/usage tokens` mostra solo i token; i flussi OAuth/token in stile abbonamento e i flussi CLI nascondono il costo in dollari.
- Nota su Gemini CLI: quando la CLI restituisce output JSON, OpenClaw legge l'utilizzo da
  `stats`, normalizza `stats.cached` in `cacheRead` e ricava i token di input da
  `stats.input_tokens - stats.cached` quando necessario.

Nota su Anthropic: la documentazione pubblica di Claude Code di Anthropic include ancora l'uso diretto del terminale Claude
nei limiti del piano Claude. Separatamente, Anthropic ha comunicato agli utenti di OpenClaw che a partire dal **4 aprile 2026 alle 12:00 PT / 20:00 BST**, il
percorso di login Claude di **OpenClaw** viene conteggiato come utilizzo di harness di terze parti e
richiede **Extra Usage** fatturato separatamente dall'abbonamento. Anthropic
non espone una stima in dollari per messaggio che OpenClaw possa mostrare in
`/usage full`.

**Finestre di utilizzo della CLI (quote del provider)**

- `openclaw status --usage` e `openclaw channels list` mostrano le **finestre di utilizzo**
  del provider (snapshot di quota, non costi per messaggio).
- L'output leggibile dall'utente è normalizzato in `X% left` per tutti i provider.
- Provider attuali con finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.
- Nota su MiniMax: i suoi campi raw `usage_percent` / `usagePercent` indicano la quota rimanente,
  quindi OpenClaw li inverte prima della visualizzazione. I campi basati sul conteggio mantengono comunque la precedenza
  quando presenti. Se il provider restituisce `model_remains`, OpenClaw preferisce la voce del modello di chat,
  ricava l'etichetta della finestra dai timestamp quando necessario e
  include il nome del modello nell'etichetta del piano.
- L'autenticazione di utilizzo per quelle finestre di quota proviene da hook specifici del provider quando
  disponibili; altrimenti OpenClaw ricade sulle credenziali OAuth/chiave API
  corrispondenti da profili auth, env o configurazione.

Vedi [Token use & costs](/reference/token-use) per dettagli ed esempi.

## Come vengono rilevate le chiavi

OpenClaw può rilevare le credenziali da:

- **Profili auth** (per agente, memorizzati in `auth-profiles.json`).
- **Variabili d'ambiente** (ad esempio `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configurazione** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) che possono esportare chiavi nell'env del processo della skill.

## Funzionalità che possono consumare chiavi

### 1) Risposte del modello core (chat + strumenti)

Ogni risposta o chiamata di strumento usa il **provider del modello corrente** (OpenAI, Anthropic, ecc.). Questa è la
fonte principale di utilizzo e costo.

Questo include anche provider ospitati in stile abbonamento che continuano a fatturare al di fuori
della UI locale di OpenClaw, come **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** e
il percorso di login Claude di Anthropic per OpenClaw con **Extra Usage** abilitato.

Vedi [Models](/providers/models) per la configurazione dei prezzi e [Token use & costs](/reference/token-use) per la visualizzazione.

### 2) Comprensione dei media (audio/immagine/video)

I media in ingresso possono essere riassunti/trascritti prima dell'esecuzione della risposta. Questo usa API di modello/provider.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Immagine: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.A.I.
- Video: Google / Qwen / Moonshot.

Vedi [Media understanding](/nodes/media-understanding).

### 3) Generazione di immagini e video

Anche le capacità condivise di generazione possono consumare chiavi del provider:

- Generazione immagini: OpenAI / Google / fal / MiniMax
- Generazione video: Qwen

La generazione di immagini può dedurre un provider predefinito supportato da autenticazione quando
`agents.defaults.imageGenerationModel` non è impostato. La generazione video al momento
richiede un `agents.defaults.videoGenerationModel` esplicito come
`qwen/wan2.6-t2v`.

Vedi [Image generation](/tools/image-generation), [Qwen Cloud](/providers/qwen)
e [Models](/concepts/models).

### 4) Embedding della memoria + ricerca semantica

La ricerca semantica nella memoria usa **API di embedding** quando configurata per provider remoti:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "ollama"` → embedding Ollama (locale/self-hosted; in genere senza fatturazione API ospitata)
- Fallback facoltativo a un provider remoto se gli embedding locali falliscono

Puoi mantenerla locale con `memorySearch.provider = "local"` (nessun utilizzo API).

Vedi [Memory](/concepts/memory).

### 5) Strumento di ricerca web

`web_search` può comportare costi di utilizzo a seconda del provider:

- **Brave Search API**: `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` o `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: senza chiave per impostazione predefinita, ma richiede un host Ollama raggiungibile più `ollama signin`; può anche riutilizzare la normale autenticazione bearer del provider Ollama quando l'host la richiede
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback senza chiave (nessuna fatturazione API, ma non ufficiale e basato su HTML)
- **SearXNG**: `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (senza chiave/self-hosted; nessuna fatturazione API ospitata)

I percorsi provider legacy `tools.web.search.*` continuano a essere caricati tramite lo shim di compatibilità temporaneo, ma non sono più la superficie di configurazione consigliata.

**Credito gratuito Brave Search:** ogni piano Brave include 5 $/mese di credito gratuito rinnovabile.
Il piano Search costa 5 $ per 1.000 richieste, quindi il credito copre
1.000 richieste/mese senza costi. Imposta il tuo limite di utilizzo nel dashboard Brave
per evitare addebiti imprevisti.

Vedi [Web tools](/tools/web).

### 5) Strumento di web fetch (Firecrawl)

`web_fetch` può chiamare **Firecrawl** quando è presente una chiave API:

- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webFetch.apiKey`

Se Firecrawl non è configurato, lo strumento ricade su fetch diretto + readability (nessuna API a pagamento).

Vedi [Web tools](/tools/web).

### 6) Snapshot di utilizzo del provider (status/health)

Alcuni comandi di stato chiamano gli **endpoint di utilizzo del provider** per visualizzare finestre di quota o integrità dell'autenticazione.
Di solito si tratta di chiamate a basso volume, ma colpiscono comunque le API del provider:

- `openclaw status --usage`
- `openclaw models status --json`

Vedi [Models CLI](/cli/models).

### 7) Riepilogo di protezione della compaction

La protezione della compaction può riassumere la cronologia della sessione usando il **modello corrente**, che
invoca API del provider quando viene eseguita.

Vedi [Session management + compaction](/reference/session-management-compaction).

### 8) Scansione / probe dei modelli

`openclaw models scan` può sondare i modelli OpenRouter e usa `OPENROUTER_API_KEY` quando
il probing è abilitato.

Vedi [Models CLI](/cli/models).

### 9) Talk (speech)

La modalità Talk può invocare **ElevenLabs** quando configurata:

- `ELEVENLABS_API_KEY` o `talk.providers.elevenlabs.apiKey`

Vedi [Talk mode](/nodes/talk).

### 10) Skills (API di terze parti)

Le Skills possono memorizzare `apiKey` in `skills.entries.<name>.apiKey`. Se una skill usa quella chiave per API esterne,
può generare costi in base al provider della skill.

Vedi [Skills](/tools/skills).
