---
read_when:
    - Vuoi capire quali funzionalità possono chiamare API a pagamento
    - Hai bisogno di verificare chiavi, costi e visibilità dell'utilizzo
    - Stai spiegando il reporting di /status o /usage cost
summary: Verificare cosa può spendere denaro, quali chiavi vengono usate e come visualizzare l'utilizzo
title: Utilizzo API e costi
x-i18n:
    generated_at: "2026-04-24T08:59:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Utilizzo API e costi

Questa documentazione elenca le **funzionalità che possono invocare chiavi API** e dove i loro costi compaiono. Si concentra sulle funzionalità di OpenClaw che possono generare utilizzo del provider o chiamate API a pagamento.

## Dove compaiono i costi (chat + CLI)

**Snapshot dei costi per sessione**

- `/status` mostra il modello della sessione corrente, l'utilizzo del contesto e i token dell'ultima risposta.
- Se il modello usa **autenticazione con chiave API**, `/status` mostra anche il **costo stimato** dell'ultima risposta.
- Se i metadati live della sessione sono scarsi, `/status` può recuperare i contatori
  token/cache e l'etichetta del modello runtime attivo dall'ultima voce di utilizzo della trascrizione.
  I valori live esistenti e non zero mantengono comunque la precedenza, e i totali della trascrizione orientati alla dimensione del prompt possono prevalere quando i totali memorizzati mancano o sono inferiori.

**Footer del costo per messaggio**

- `/usage full` aggiunge un footer di utilizzo a ogni risposta, incluso il **costo stimato** (solo chiave API).
- `/usage tokens` mostra solo i token; i flussi OAuth/token in stile abbonamento e CLI nascondono il costo in dollari.
- Nota Gemini CLI: quando la CLI restituisce output JSON, OpenClaw legge l'utilizzo da
  `stats`, normalizza `stats.cached` in `cacheRead` e deriva i token di input da
  `stats.input_tokens - stats.cached` quando necessario.

Nota Anthropic: il personale Anthropic ci ha detto che l'uso di Claude CLI in stile OpenClaw è
di nuovo consentito, quindi OpenClaw tratta il riuso di Claude CLI e l'uso di `claude -p` come approvati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy.
Anthropic continua però a non esporre una stima in dollari per messaggio che OpenClaw possa
mostrare in `/usage full`.

**Finestre di utilizzo CLI (quote del provider)**

- `openclaw status --usage` e `openclaw channels list` mostrano le **finestre di utilizzo**
  del provider (snapshot di quota, non costi per messaggio).
- L'output leggibile è normalizzato in `X% left` tra i provider.
- Provider attuali per le finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.
- Nota MiniMax: i suoi campi raw `usage_percent` / `usagePercent` indicano quota
  rimanente, quindi OpenClaw li inverte prima della visualizzazione. I campi basati su conteggio hanno comunque la priorità
  quando presenti. Se il provider restituisce `model_remains`, OpenClaw preferisce la
  voce del modello chat, deriva l'etichetta della finestra dai timestamp quando necessario e
  include il nome del modello nell'etichetta del piano.
- L'autenticazione di utilizzo per quelle finestre di quota proviene da hook specifici del provider quando
  disponibili; altrimenti OpenClaw ripiega sulle credenziali OAuth/chiave API corrispondenti
  da profili auth, env o configurazione.

Consulta [Uso dei token e costi](/it/reference/token-use) per dettagli ed esempi.

## Come vengono individuate le chiavi

OpenClaw può rilevare le credenziali da:

- **Profili auth** (per agente, memorizzati in `auth-profiles.json`).
- **Variabili d'ambiente** (es. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configurazione** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) che possono esportare chiavi nell'ambiente del processo della Skill.

## Funzionalità che possono spendere chiavi

### 1) Risposte core del modello (chat + strumenti)

Ogni risposta o chiamata di strumento usa il **provider del modello corrente** (OpenAI, Anthropic, ecc.). Questa è la fonte primaria di utilizzo e costo.

Questo include anche provider ospitati in stile abbonamento che fatturano comunque fuori
dalla UI locale di OpenClaw, come **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** e il percorso Claude-login di OpenClaw di Anthropic con **Extra Usage** abilitato.

Consulta [Modelli](/it/providers/models) per la configurazione dei prezzi e [Uso dei token e costi](/it/reference/token-use) per la visualizzazione.

### 2) Media understanding (audio/immagine/video)

I media in ingresso possono essere riassunti/trascritti prima dell'esecuzione della risposta. Questo usa API di modelli/provider.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Immagine: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Consulta [Media understanding](/it/nodes/media-understanding).

### 3) Generazione di immagini e video

Anche le capacità condivise di generazione possono spendere chiavi provider:

- Generazione immagini: OpenAI / Google / fal / MiniMax
- Generazione video: Qwen

La generazione di immagini può dedurre un provider predefinito supportato da auth quando
`agents.defaults.imageGenerationModel` non è impostato. La generazione video attualmente
richiede un `agents.defaults.videoGenerationModel` esplicito come
`qwen/wan2.6-t2v`.

Consulta [Generazione di immagini](/it/tools/image-generation), [Qwen Cloud](/it/providers/qwen)
e [Modelli](/it/concepts/models).

### 4) Embedding della memoria + ricerca semantica

La ricerca semantica della memoria usa **API di embedding** quando configurata per provider remoti:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "lmstudio"` → embedding LM Studio (locale/self-hosted)
- `memorySearch.provider = "ollama"` → embedding Ollama (locale/self-hosted; in genere senza fatturazione API ospitata)
- Fallback facoltativo a un provider remoto se gli embedding locali falliscono

Puoi mantenerlo locale con `memorySearch.provider = "local"` (nessun utilizzo API).

Consulta [Memory](/it/concepts/memory).

### 5) Strumento di ricerca web

`web_search` può generare costi di utilizzo a seconda del provider:

- **Brave Search API**: `BRAVE_API_KEY` oppure `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` oppure `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` oppure `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` oppure `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` oppure `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` oppure `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` oppure `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: senza chiave per impostazione predefinita, ma richiede un host Ollama raggiungibile più `ollama signin`; può anche riusare il normale bearer auth del provider Ollama quando l'host lo richiede
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` oppure `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` oppure `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback senza chiave (nessuna fatturazione API, ma non ufficiale e basato su HTML)
- **SearXNG**: `SEARXNG_BASE_URL` oppure `plugins.entries.searxng.config.webSearch.baseUrl` (senza chiave/self-hosted; nessuna fatturazione API ospitata)

I vecchi percorsi provider `tools.web.search.*` vengono ancora caricati tramite lo shim di compatibilità temporaneo, ma non sono più la superficie di configurazione consigliata.

**Credito gratuito Brave Search:** ogni piano Brave include \$5/mese di credito
gratuito rinnovabile. Il piano Search costa \$5 per 1.000 richieste, quindi il credito copre
1.000 richieste/mese senza costi. Imposta il tuo limite di utilizzo nella dashboard Brave
per evitare addebiti imprevisti.

Consulta [Strumenti web](/it/tools/web).

### 5) Strumento web fetch (Firecrawl)

`web_fetch` può chiamare **Firecrawl** quando è presente una chiave API:

- `FIRECRAWL_API_KEY` oppure `plugins.entries.firecrawl.config.webFetch.apiKey`

Se Firecrawl non è configurato, lo strumento ripiega su fetch diretto + readability (nessuna API a pagamento).

Consulta [Strumenti web](/it/tools/web).

### 6) Snapshot di utilizzo del provider (status/health)

Alcuni comandi di stato chiamano gli **endpoint di utilizzo dei provider** per visualizzare finestre di quota o stato auth.
In genere si tratta di chiamate a basso volume ma che colpiscono comunque API del provider:

- `openclaw status --usage`
- `openclaw models status --json`

Consulta [CLI Models](/it/cli/models).

### 7) Riepilogo di salvaguardia della Compaction

La salvaguardia della compattazione può riassumere la cronologia della sessione usando il **modello corrente**, il che
invoca API del provider quando viene eseguita.

Consulta [Gestione della sessione + compattazione](/it/reference/session-management-compaction).

### 8) Scansione / probe del modello

`openclaw models scan` può sondare i modelli OpenRouter e usa `OPENROUTER_API_KEY` quando
il probing è abilitato.

Consulta [CLI Models](/it/cli/models).

### 9) Talk (speech)

La modalità Talk può invocare **ElevenLabs** quando configurata:

- `ELEVENLABS_API_KEY` oppure `talk.providers.elevenlabs.apiKey`

Consulta [Modalità Talk](/it/nodes/talk).

### 10) Skills (API di terze parti)

Le Skills possono memorizzare `apiKey` in `skills.entries.<name>.apiKey`. Se una Skill usa quella chiave per API esterne,
può generare costi in base al provider della Skill.

Consulta [Skills](/it/tools/skills).

## Correlati

- [Uso dei token e costi](/it/reference/token-use)
- [Caching del prompt](/it/reference/prompt-caching)
- [Monitoraggio dell'utilizzo](/it/concepts/usage-tracking)
