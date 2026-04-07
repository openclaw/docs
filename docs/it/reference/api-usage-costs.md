---
read_when:
    - Vuoi capire quali funzionalità possono chiamare API a pagamento
    - Devi verificare chiavi, costi e visibilità dell'utilizzo
    - Stai spiegando la reportistica dei costi di /status o /usage
summary: Verifica cosa può comportare spese, quali chiavi vengono usate e come visualizzare l'utilizzo
title: Utilizzo API e costi
x-i18n:
    generated_at: "2026-04-07T08:17:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab6eefcde9ac014df6cdda7aaa77ef48f16936ab12eaa883d9fe69425a31a2dd
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Utilizzo API e costi

Questa documentazione elenca le **funzionalità che possono invocare chiavi API** e dove compaiono i relativi costi. Si concentra sulle
funzionalità di OpenClaw che possono generare utilizzo del provider o chiamate API a pagamento.

## Dove compaiono i costi (chat + CLI)

**Snapshot dei costi per sessione**

- `/status` mostra il modello corrente della sessione, l'utilizzo del contesto e i token dell'ultima risposta.
- Se il modello usa **autenticazione con chiave API**, `/status` mostra anche il **costo stimato** dell'ultima risposta.
- Se i metadati live della sessione sono scarsi, `/status` può recuperare i contatori di
  token/cache e l'etichetta del modello runtime attivo dall'ultima voce di utilizzo
  della trascrizione. I valori live non nulli esistenti hanno comunque la precedenza, e i totali
  della trascrizione dimensionati sul prompt possono prevalere quando i totali memorizzati mancano o sono inferiori.

**Footer dei costi per messaggio**

- `/usage full` aggiunge un footer di utilizzo a ogni risposta, incluso il **costo stimato** (solo con chiave API).
- `/usage tokens` mostra solo i token; i flussi CLI e i flussi OAuth/token in stile abbonamento nascondono il costo in dollari.
- Nota su Gemini CLI: quando la CLI restituisce output JSON, OpenClaw legge l'utilizzo da
  `stats`, normalizza `stats.cached` in `cacheRead` e ricava i token di input da
  `stats.input_tokens - stats.cached` quando necessario.

Nota su Anthropic: il personale Anthropic ci ha detto che l'uso di Claude CLI in stile OpenClaw è
di nuovo consentito, quindi OpenClaw considera il riutilizzo di Claude CLI e l'uso di `claude -p`
come autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy.
Anthropic continua comunque a non esporre una stima in dollari per messaggio che OpenClaw possa
mostrare in `/usage full`.

**Finestre di utilizzo CLI (quote provider)**

- `openclaw status --usage` e `openclaw channels list` mostrano le **finestre di utilizzo** del provider
  (snapshot delle quote, non costi per messaggio).
- L'output leggibile è normalizzato in `X% left` per tutti i provider.
- Provider attuali con finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.
- Nota su MiniMax: i suoi campi grezzi `usage_percent` / `usagePercent` indicano la
  quota residua, quindi OpenClaw li inverte prima della visualizzazione. I campi basati sul conteggio
  hanno comunque la precedenza quando presenti. Se il provider restituisce `model_remains`, OpenClaw preferisce la voce del modello chat, ricava l'etichetta della finestra dai timestamp quando necessario e
  include il nome del modello nell'etichetta del piano.
- L'autenticazione di utilizzo per quelle finestre di quota proviene da hook specifici del provider quando
  disponibili; altrimenti OpenClaw usa come fallback le credenziali OAuth/chiave API corrispondenti da profili auth, env o configurazione.

Vedi [Token use & costs](/it/reference/token-use) per dettagli ed esempi.

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

Ogni risposta o chiamata a uno strumento usa il **provider del modello corrente** (OpenAI, Anthropic, ecc.). Questa è la
fonte principale di utilizzo e costo.

Questo include anche provider ospitati in stile abbonamento che continuano comunque a fatturare al di fuori della
UI locale di OpenClaw, come **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** e
il percorso Claude-login di Anthropic in OpenClaw con **Extra Usage** abilitato.

Vedi [Models](/it/providers/models) per la configurazione dei prezzi e [Token use & costs](/it/reference/token-use) per la visualizzazione.

### 2) Comprensione dei media (audio/immagine/video)

I media in ingresso possono essere riepilogati/trascritti prima dell'esecuzione della risposta. Questo usa API di modelli/provider.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Immagine: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Vedi [Media understanding](/it/nodes/media-understanding).

### 3) Generazione di immagini e video

Anche le capacità condivise di generazione possono consumare chiavi dei provider:

- Generazione di immagini: OpenAI / Google / fal / MiniMax
- Generazione video: Qwen

La generazione di immagini può dedurre un provider predefinito supportato da autenticazione quando
`agents.defaults.imageGenerationModel` non è impostato. La generazione video al momento
richiede un `agents.defaults.videoGenerationModel` esplicito come
`qwen/wan2.6-t2v`.

Vedi [Image generation](/it/tools/image-generation), [Qwen Cloud](/it/providers/qwen),
e [Models](/it/concepts/models).

### 4) Embedding della memoria + ricerca semantica

La ricerca semantica nella memoria usa **API di embedding** quando è configurata per provider remoti:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "ollama"` → embedding Ollama (locale/self-hosted; in genere senza fatturazione API ospitata)
- Fallback facoltativo a un provider remoto se gli embedding locali falliscono

Puoi mantenerla locale con `memorySearch.provider = "local"` (nessun utilizzo API).

Vedi [Memory](/it/concepts/memory).

### 5) Strumento di ricerca web

`web_search` può comportare costi di utilizzo a seconda del provider:

- **Brave Search API**: `BRAVE_API_KEY` oppure `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` oppure `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` oppure `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` oppure `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` oppure `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` oppure `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` oppure `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: senza chiave per impostazione predefinita, ma richiede un host Ollama raggiungibile più `ollama signin`; può anche riutilizzare la normale autenticazione bearer del provider Ollama quando l'host la richiede
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` oppure `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` oppure `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback senza chiave (nessuna fatturazione API, ma non ufficiale e basato su HTML)
- **SearXNG**: `SEARXNG_BASE_URL` oppure `plugins.entries.searxng.config.webSearch.baseUrl` (senza chiave/self-hosted; nessuna fatturazione API ospitata)

I percorsi legacy del provider `tools.web.search.*` vengono ancora caricati tramite lo shim temporaneo di compatibilità, ma non sono più la superficie di configurazione consigliata.

**Credito gratuito Brave Search:** ogni piano Brave include \$5/mese di credito
gratuito rinnovabile. Il piano Search costa \$5 ogni 1.000 richieste, quindi il credito copre
1.000 richieste/mese senza costi. Imposta il tuo limite di utilizzo nella dashboard Brave
per evitare addebiti imprevisti.

Vedi [Web tools](/it/tools/web).

### 5) Strumento di web fetch (Firecrawl)

`web_fetch` può chiamare **Firecrawl** quando è presente una chiave API:

- `FIRECRAWL_API_KEY` oppure `plugins.entries.firecrawl.config.webFetch.apiKey`

Se Firecrawl non è configurato, lo strumento usa come fallback fetch diretto + readability (nessuna API a pagamento).

Vedi [Web tools](/it/tools/web).

### 6) Snapshot di utilizzo del provider (status/health)

Alcuni comandi di stato chiamano **endpoint di utilizzo del provider** per mostrare finestre di quota o stato auth.
Di solito sono chiamate a basso volume, ma colpiscono comunque le API del provider:

- `openclaw status --usage`
- `openclaw models status --json`

Vedi [Models CLI](/cli/models).

### 7) Riepilogo di salvaguardia della compattazione

La salvaguardia della compattazione può riepilogare la cronologia della sessione usando il **modello corrente**, il che
invoca API del provider quando viene eseguita.

Vedi [Session management + compaction](/it/reference/session-management-compaction).

### 8) Scansione / probe dei modelli

`openclaw models scan` può eseguire probe sui modelli OpenRouter e usa `OPENROUTER_API_KEY` quando
il probing è abilitato.

Vedi [Models CLI](/cli/models).

### 9) Talk (voce)

La modalità Talk può invocare **ElevenLabs** quando configurata:

- `ELEVENLABS_API_KEY` oppure `talk.providers.elevenlabs.apiKey`

Vedi [Talk mode](/it/nodes/talk).

### 10) Skills (API di terze parti)

Le Skills possono memorizzare `apiKey` in `skills.entries.<name>.apiKey`. Se una skill usa quella chiave per API esterne,
può generare costi secondo il provider della skill.

Vedi [Skills](/it/tools/skills).
