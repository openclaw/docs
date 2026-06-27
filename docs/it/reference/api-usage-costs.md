---
read_when:
    - Vuoi capire quali funzionalità possono chiamare API a pagamento
    - Devi verificare chiavi, costi e visibilità dell'utilizzo
    - Stai spiegando il reporting dei costi di /status o /usage
summary: Verifica cosa può spendere denaro, quali chiavi vengono usate e come visualizzare l'utilizzo
title: Utilizzo dell’API e costi
x-i18n:
    generated_at: "2026-06-27T18:12:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Questo documento elenca le **funzionalità che possono invocare chiavi API** e dove compaiono i relativi costi. Si concentra sulle funzionalità di
OpenClaw che possono generare utilizzo del provider o chiamate API a pagamento.

## Dove compaiono i costi (chat + CLI)

**Snapshot dei costi per sessione**

- `/status` mostra il modello della sessione corrente, l'utilizzo del contesto e i token dell'ultima risposta.
- Se OpenClaw dispone di metadati di utilizzo e prezzi locali per il modello attivo,
  `/status` mostra anche il **costo stimato** dell'ultima risposta. Questo può includere
  provider senza chiave API con prezzo esplicito, come i modelli Bedrock `aws-sdk`.
- Se i metadati della sessione live sono scarsi, `/status` può recuperare i contatori
  di token/cache e l'etichetta del modello runtime attivo dall'ultima voce di utilizzo
  della trascrizione. I valori live non nulli esistenti hanno comunque la precedenza, e
  i totali della trascrizione dimensionati sul prompt possono prevalere quando i totali
  archiviati mancano o sono inferiori.

**Footer dei costi per messaggio**

- `/usage full` aggiunge un footer di utilizzo a ogni risposta, incluso il **costo stimato**
  quando è configurato un prezzo locale per il modello attivo e sono disponibili metadati
  di utilizzo.
- `/usage tokens` mostra solo i token; i flussi OAuth/token in stile abbonamento e CLI
  continuano a mostrare solo i token, a meno che quel runtime fornisca metadati di utilizzo
  compatibili e sia configurato un prezzo locale esplicito.
- Nota su Gemini CLI: l'output predefinito `stream-json` e gli override JSON legacy
  leggono entrambi l'utilizzo da `stats`, normalizzano `stats.cached` in `cacheRead` e
  derivano i token di input da `stats.input_tokens - stats.cached` quando necessario.

Nota su Anthropic: lo staff di Anthropic ci ha comunicato che l'uso di Claude CLI in stile
OpenClaw è di nuovo consentito, quindi OpenClaw considera il riutilizzo di Claude CLI e
l'uso di `claude -p` autorizzati per questa integrazione, a meno che Anthropic pubblichi
una nuova policy. Anthropic continua a non esporre una stima in dollari per messaggio che
OpenClaw possa mostrare in `/usage full`.

**Finestre di utilizzo CLI (quote dei provider)**

- `openclaw status --usage` e `openclaw channels list` mostrano le **finestre di utilizzo**
  dei provider (snapshot delle quote, non costi per messaggio).
- L'output leggibile è normalizzato in `X% left` tra i provider.
- Provider attuali per le finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.
- Nota su MiniMax: i suoi campi raw `usage_percent` / `usagePercent` indicano la quota
  rimanente, quindi OpenClaw li inverte prima della visualizzazione. I campi basati sul
  conteggio hanno comunque la precedenza quando presenti. Se il provider restituisce
  `model_remains`, OpenClaw preferisce la voce del modello chat, deriva l'etichetta della
  finestra dai timestamp quando necessario e include il nome del modello nell'etichetta del piano.
- L'autenticazione di utilizzo per quelle finestre di quota proviene da hook specifici
  del provider quando disponibili; in caso contrario OpenClaw ripiega sulle credenziali
  OAuth/chiave API corrispondenti da profili di autenticazione, env o config.

Vedi [Uso dei token e costi](/it/reference/token-use) per dettagli ed esempi.

## Come vengono scoperte le chiavi

OpenClaw può recuperare le credenziali da:

- **Profili di autenticazione** (per agent, archiviati in `auth-profiles.json`).
- **Variabili d'ambiente** (ad es. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) che possono esportare chiavi nell'env del processo della skill.

## Funzionalità che possono spendere chiavi

### 1) Risposte del modello core (chat + strumenti)

Ogni risposta o chiamata a uno strumento usa il **provider del modello corrente** (OpenAI, Anthropic, ecc.). Questa è la
fonte principale di utilizzo e costo.

Questo include anche provider ospitati in stile abbonamento che fatturano comunque fuori
dall'interfaccia locale di OpenClaw, come **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** e
il percorso OpenClaw con login Claude di Anthropic con **Extra Usage** abilitato.

Vedi [Modelli](/it/providers/models) per la configurazione dei prezzi e [Uso dei token e costi](/it/reference/token-use) per la visualizzazione.

### 2) Comprensione dei media (audio/immagine/video)

I media in ingresso possono essere riassunti/trascritti prima dell'esecuzione della risposta. Questo usa API di modelli/provider.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Immagine: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Vedi [Comprensione dei media](/it/nodes/media-understanding).

### 3) Generazione di immagini e video

Anche le funzionalità di generazione condivise possono spendere chiavi dei provider:

- Generazione di immagini: OpenAI / Google / DeepInfra / fal / MiniMax
- Generazione di video: DeepInfra / Qwen

La generazione di immagini può inferire un provider predefinito supportato dall'autenticazione quando
`agents.defaults.imageGenerationModel` non è impostato. La generazione di video attualmente
richiede un `agents.defaults.videoGenerationModel` esplicito, come
`qwen/wan2.6-t2v`.

Vedi [Generazione di immagini](/it/tools/image-generation), [Qwen Cloud](/it/providers/qwen)
e [Modelli](/it/concepts/models).

### 4) Embedding della memoria + ricerca semantica

La ricerca semantica nella memoria usa **API di embedding** quando configurata per provider remoti:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "deepinfra"` → embedding DeepInfra
- `memorySearch.provider = "lmstudio"` → embedding LM Studio (locale/self-hosted)
- `memorySearch.provider = "ollama"` → embedding Ollama (locale/self-hosted; in genere senza fatturazione API ospitata)
- Fallback facoltativo a un provider remoto se gli embedding locali falliscono

Puoi mantenerla locale con `memorySearch.provider = "local"` (nessun utilizzo API).

Vedi [Memoria](/it/concepts/memory).

### 5) Strumento di ricerca web

`web_search` può comportare addebiti di utilizzo a seconda del provider:

- **Brave Search API**: `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` o `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: profilo OAuth xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: senza chiave per un host Ollama locale raggiungibile con accesso effettuato; la ricerca diretta su `https://ollama.com` usa `OLLAMA_API_KEY`, e gli host protetti da autenticazione possono riutilizzare la normale autenticazione bearer del provider Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: provider senza chiave quando selezionato esplicitamente (nessuna fatturazione API, ma non ufficiale e basato su HTML)
- **SearXNG**: `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (senza chiave/self-hosted; nessuna fatturazione API ospitata)

I percorsi provider legacy `tools.web.search.*` vengono ancora caricati tramite lo shim temporaneo di compatibilità, ma non sono più la superficie di configurazione consigliata.

**Credito gratuito di Brave Search:** Ogni piano Brave include \$5/mese di credito
gratuito rinnovabile. Il piano Search costa \$5 per 1.000 richieste, quindi il credito copre
1.000 richieste/mese senza costi. Imposta il tuo limite di utilizzo nella dashboard Brave
per evitare addebiti imprevisti.

Vedi [Strumenti web](/it/tools/web).

### 5) Strumento di recupero web (Firecrawl)

`web_fetch` può chiamare **Firecrawl** con accesso iniziale senza chiave. Aggiungi una chiave API
per limiti più elevati:

- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webFetch.apiKey`

Se Firecrawl non è configurato, lo strumento ripiega sul fetch diretto più il plugin `web-readability` incluso (nessuna API a pagamento). Disabilita `plugins.entries.web-readability.enabled` per saltare l'estrazione locale Readability.

Vedi [Strumenti web](/it/tools/web).

### 6) Snapshot di utilizzo dei provider (stato/salute)

Alcuni comandi di stato chiamano **endpoint di utilizzo dei provider** per mostrare finestre di quota o salute dell'autenticazione.
Sono in genere chiamate a basso volume, ma raggiungono comunque le API dei provider:

- `openclaw status --usage`
- `openclaw models status --json`

Vedi [CLI dei modelli](/it/cli/models).

### 7) Riepilogo di salvaguardia di Compaction

La salvaguardia di Compaction può riassumere la cronologia della sessione usando il **modello corrente**, il che
invoca le API del provider quando viene eseguita.

Vedi [Gestione della sessione + Compaction](/it/reference/session-management-compaction).

### 8) Scansione / probe dei modelli

`openclaw models scan` può sondare i modelli OpenRouter e usa `OPENROUTER_API_KEY` quando
il probing è abilitato.

Vedi [CLI dei modelli](/it/cli/models).

### 9) Talk (voce)

La modalità Talk può invocare **ElevenLabs** quando configurata:

- `ELEVENLABS_API_KEY` o `talk.providers.elevenlabs.apiKey`

Vedi [Modalità Talk](/it/nodes/talk).

### 10) Skills (API di terze parti)

Le Skills possono archiviare `apiKey` in `skills.entries.<name>.apiKey`. Se una skill usa quella chiave per API
esterne, può generare costi secondo il provider della skill.

Vedi [Skills](/it/tools/skills).

## Correlati

- [Uso dei token e costi](/it/reference/token-use)
- [Caching dei prompt](/it/reference/prompt-caching)
- [Monitoraggio dell'utilizzo](/it/concepts/usage-tracking)
