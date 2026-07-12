---
read_when:
    - Vuoi ridurre i costi dei token del prompt mantenendo la cache
    - È necessario un comportamento della cache specifico per ogni agente nelle configurazioni multi-agente
    - Stai configurando insieme Heartbeat e la rimozione basata sul TTL della cache
summary: Parametri della cache dei prompt, ordine di unione, comportamento del provider e modelli di ottimizzazione
title: Caching del prompt
x-i18n:
    generated_at: "2026-07-12T07:28:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

La cache dei prompt consente a un provider di modelli di riutilizzare tra i turni un prefisso del prompt invariato (istruzioni di sistema/sviluppatore, definizioni degli strumenti, altro contesto stabile), anziché rielaborarlo a ogni richiesta. Questo riduce il costo in token e la latenza nelle sessioni di lunga durata con contesto ripetuto.

OpenClaw normalizza l'utilizzo dei provider in `cacheRead` e `cacheWrite` quando l'API upstream espone tali contatori. I riepiloghi dell'utilizzo (`/status` e simili) ricorrono all'ultima voce di utilizzo della trascrizione quando l'istantanea della sessione attiva non contiene i contatori della cache; un valore attivo diverso da zero ha sempre la precedenza sul valore di ripiego.

Riferimenti dei provider:

- [Cache dei prompt di Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Cache dei prompt di OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Impostazioni principali

### `cacheRetention`

Valori: `"none" | "short" | "long"`. Configurabile come valore predefinito globale, per modello e per agente.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # sostituisce il valore predefinito globale per questo modello
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # sostituisce entrambi i valori predefiniti per questo agente
```

Ordine di unione (l'ultimo ha la precedenza):

1. `agents.defaults.params` - valore predefinito globale per tutti i modelli
2. `agents.defaults.models["provider/model"].params` - sostituzione per modello
3. `agents.list[].params` - sostituzione per agente, associata tramite l'ID dell'agente

Fonte: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Elimina dal contesto i vecchi risultati degli strumenti dopo la scadenza della finestra TTL della cache, evitando che una richiesta successiva a un periodo di inattività rimetta in cache una cronologia sovradimensionata.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Per il comportamento completo, consulta [Potatura delle sessioni](/it/concepts/session-pruning).

### Mantenimento della cache tramite Heartbeat

Heartbeat può mantenere attive le finestre della cache e ridurre le scritture ripetute nella cache dopo intervalli di inattività. È configurabile globalmente (`agents.defaults.heartbeat`) o per agente (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportamento dei provider

### Anthropic (API diretta e Vertex AI)

- `cacheRetention` è supportato per i provider `anthropic` e `anthropic-vertex` e per i modelli Claude su `amazon-bedrock` e sugli endpoint personalizzati compatibili con `anthropic-messages` quando `cacheRetention` è impostato esplicitamente.
- Quando non è impostato, OpenClaw inizializza `cacheRetention: "short"` per Anthropic diretto (solo per i provider `anthropic` e `anthropic-vertex`; gli altri percorsi della famiglia Anthropic richiedono un valore esplicito).
- Le risposte native di Anthropic Messages espongono `cache_read_input_tokens` e `cache_creation_input_tokens`, associati rispettivamente a `cacheRead` e `cacheWrite`.
- `cacheRetention: "short"` corrisponde alla cache effimera predefinita di 5 minuti. `cacheRetention: "long"` richiede il TTL di 1 ora (`cache_control: { type: "ephemeral", ttl: "1h" }`) quando è impostato esplicitamente. Una conservazione lunga implicita o determinata dall'ambiente (`OPENCLAW_CACHE_RETENTION=long` senza un valore `cacheRetention` esplicito) passa al TTL di 1 ora solo sugli host `api.anthropic.com` o Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); gli altri host mantengono la cache di 5 minuti.

Fonte: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API diretta)

- La cache dei prompt è automatica sui modelli recenti supportati; OpenClaw non inserisce marcatori di cache a livello di blocco.
- OpenClaw invia `prompt_cache_key` per mantenere stabile l'instradamento della cache tra i turni. Gli host diretti `api.openai.com` lo ricevono automaticamente. I proxy compatibili con OpenAI (oMLX, llama.cpp, endpoint personalizzati) devono impostare `compat.supportsPromptCacheKey: true` nella configurazione del modello per abilitarlo: questa funzionalità non viene mai rilevata automaticamente per un proxy.
- `prompt_cache_retention: "24h"` viene aggiunto solo quando è selezionato `cacheRetention: "long"` e l'endpoint risolto supporta sia la chiave della cache sia la conservazione lunga (`compat.supportsLongCacheRetention`, `true` per impostazione predefinita; i profili di compatibilità Together AI e Cloudflare la disabilitano). `cacheRetention: "none"` elimina entrambi i campi.
- I riscontri positivi della cache vengono esposti tramite `usage.prompt_tokens_details.cached_tokens` (Chat Completions) o `input_tokens_details.cached_tokens` (Responses API), associati a `cacheRead`.
- I payload della Responses API possono anche esporre `input_tokens_details.cache_write_tokens`, associato a `cacheWrite` e tariffato secondo il costo di scrittura nella cache del modello; i payload di Responses che omettono il campo mantengono `cacheWrite` a `0`. La Chat Completions API di OpenAI non documenta né emette un contatore `cache_write_tokens`, ma OpenClaw legge comunque `prompt_tokens_details.cache_write_tokens` in quel contesto per i proxy compatibili con OpenRouter e in stile DeepSeek che segnalano separatamente il numero di scritture.
- In pratica, OpenAI si comporta più come una cache del prefisso iniziale che come il riutilizzo progressivo dell'intera cronologia di Anthropic; consulta [Aspettative operative di OpenAI](#openai-live-expectations) più avanti.

### Amazon Bedrock

- I riferimenti ai modelli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, inclusi i prefissi dei profili di inferenza di sistema AWS `us.`/`eu.`/`global.anthropic.claude*`) supportano il passaggio esplicito di `cacheRetention`.
- I modelli Bedrock non Anthropic (ad esempio `amazon.nova-*`) non applicano alcuna conservazione della cache in fase di esecuzione, indipendentemente dall'eventuale valore `cacheRetention` configurato.
- Anche gli ARN opachi dei profili di inferenza delle applicazioni Bedrock (ID dei profili che non contengono `claude`) non applicano alcuna conservazione della cache, a meno che `cacheRetention` non sia impostato esplicitamente, poiché la famiglia del modello non può essere dedotta dal solo ARN.

### OpenRouter

Per i riferimenti ai modelli `openrouter/anthropic/*`, OpenClaw inserisce marcatori Anthropic `cache_control` nei blocchi del prompt di sistema/sviluppatore, ma solo quando la richiesta è ancora destinata a un percorso OpenRouter verificato (`openrouter` sul relativo endpoint predefinito oppure qualsiasi provider/URL di base che si risolva in `openrouter.ai`). Reindirizzando il modello a un URL proxy arbitrario compatibile con OpenAI, questo inserimento viene interrotto.

`contextPruning.mode: "cache-ttl"` è consentito per i riferimenti ai modelli `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` e `openrouter/zai/*`, perché questi percorsi gestiscono la cache dei prompt sul lato del provider senza richiedere i marcatori inseriti da OpenClaw.

Fonte: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

La costruzione della cache DeepSeek su OpenRouter avviene secondo il principio del massimo impegno e può richiedere alcuni secondi; una richiesta immediatamente successiva potrebbe ancora mostrare `cached_tokens: 0`. Verifica con una richiesta ripetuta con lo stesso prefisso dopo un breve intervallo, usando `usage.prompt_tokens_details.cached_tokens` come indicatore del riscontro positivo della cache.

### Google Gemini (API diretta)

- Il trasporto diretto di Gemini (`api: "google-generative-ai"`) segnala i riscontri positivi della cache tramite il valore upstream `cachedContentTokenCount`, associato a `cacheRead`.
- Famiglie di modelli idonee: `gemini-2.5*` e `gemini-3*` (sono escluse le varianti Live/anteprima che non corrispondono a tali prefissi, ad esempio `gemini-live-2.5-flash-preview`).
- Quando `cacheRetention` è impostato su un modello idoneo, OpenClaw crea, riutilizza e aggiorna automaticamente una risorsa `cachedContents` per il prompt di sistema; non è necessario alcun handle manuale per i contenuti memorizzati nella cache. Il TTL è `300s` per `cacheRetention: "short"` e `3600s` per `"long"`.
- È comunque possibile passare un handle preesistente per i contenuti memorizzati nella cache di Gemini tramite `params.cachedContent` (o il precedente `params.cached_content`); un handle esplicito ignora completamente il percorso di gestione automatica della cache.
- Questa modalità è distinta dalla cache dei prefissi dei prompt di Anthropic/OpenAI: per Gemini, OpenClaw gestisce una risorsa `cachedContents` nativa del provider anziché inserire marcatori di cache inline.

Fonte: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Provider basati su harness CLI (Claude Code, Gemini CLI)

I backend CLI che emettono eventi di utilizzo JSONL (`jsonlDialect: "claude-stream-json"` o `"gemini-stream-json"`) passano attraverso un parser di utilizzo condiviso che riconosce diverse varianti dei nomi dei campi, incluso un semplice contatore `cached` associato a `cacheRead`. Quando il payload JSON della CLI omette un campo diretto per i token di input, OpenClaw lo calcola come `input_tokens - cached`. Questa è solo una normalizzazione dell'utilizzo: non crea marcatori della cache dei prompt in stile Anthropic/OpenAI per questi modelli gestiti tramite CLI.

Fonte: `src/agents/cli-output.ts` (`toCliUsage`).

### Altri provider

Se un provider non supporta nessuna delle modalità di cache descritte sopra, `cacheRetention` non produce alcun effetto.

## Limite della cache del prompt di sistema

OpenClaw divide il prompt di sistema in un **prefisso stabile** e un **suffisso variabile** in corrispondenza di un limite interno del prefisso della cache. I contenuti sopra il limite (definizioni degli strumenti, metadati delle Skills, file dell'area di lavoro) vengono ordinati in modo da restare identici a livello di byte tra i turni. I contenuti sotto il limite (ad esempio `HEARTBEAT.md`, timestamp di esecuzione e altri metadati specifici del turno) possono cambiare senza invalidare il prefisso memorizzato nella cache.

Scelte progettuali principali:

- I file stabili del contesto di progetto dell'area di lavoro vengono ordinati prima di `HEARTBEAT.md`, così le variazioni di Heartbeat non invalidano il prefisso stabile.
- Il limite si applica alla strutturazione dei trasporti della famiglia Anthropic, della famiglia OpenAI, di Google e della CLI, così tutti i provider supportati beneficiano della stessa stabilità del prefisso.
- Le richieste Codex Responses e Anthropic Vertex vengono instradate attraverso una strutturazione della cache consapevole del limite, affinché il riutilizzo della cache rimanga allineato con ciò che i provider ricevono effettivamente.
- Le impronte digitali dei prompt di sistema vengono normalizzate (spaziatura, terminazioni di riga, contesto aggiunto dagli hook, ordinamento delle funzionalità di esecuzione), così i prompt semanticamente invariati condividono la cache tra i turni.

Se si osservano picchi imprevisti di `cacheWrite` dopo una modifica alla configurazione o all'area di lavoro, verificare se la modifica ricade sopra o sotto il limite della cache. Spostare i contenuti variabili sotto il limite, oppure stabilizzarli, in genere risolve il problema.

## Protezioni di OpenClaw per la stabilità della cache

- I cataloghi degli strumenti MCP inclusi vengono ordinati in modo deterministico (prima per nome del server, poi per nome dello strumento) prima della registrazione degli strumenti, così le variazioni nell'ordine di `listTools()` non modificano continuamente il blocco degli strumenti né invalidano i prefissi della cache dei prompt.
- Le sessioni precedenti con blocchi immagine persistenti mantengono intatti i **3 turni completati più recenti** (conteggiando tutti i turni completati, non solo quelli contenenti immagini). I blocchi immagine meno recenti e già elaborati vengono sostituiti con un marcatore testuale, così le richieste successive ricche di immagini non continuano a reinviare payload obsoleti di grandi dimensioni.

## Modelli di configurazione

### Traffico misto (impostazione predefinita consigliata)

Mantieni una base di lunga durata per l'agente principale e disabilita la cache per gli agenti di notifica con attività intermittente:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Configurazione di base orientata ai costi

- Imposta il valore di base `cacheRetention: "short"`.
- Abilita `contextPruning.mode: "cache-ttl"`.
- Mantieni Heartbeat al di sotto del TTL solo per gli agenti che traggono vantaggio da cache già attive.

## Test di regressione operativi

OpenClaw esegue un unico controllo di regressione operativo combinato della cache che copre prefissi ripetuti, turni con strumenti, turni con immagini, trascrizioni di strumenti in stile MCP e un controllo Anthropic senza cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Eseguilo con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Il file di riferimento memorizza gli ultimi valori operativi osservati insieme alle soglie minime di regressione specifiche del provider verificate dal test. Ogni esecuzione usa ID di sessione e spazi dei nomi dei prompt nuovi e specifici dell'esecuzione, così lo stato della cache precedente non contamina il campione corrente. Anthropic e OpenAI applicano criteri diversi: il mancato raggiungimento di una soglia minima Anthropic costituisce una regressione bloccante (il test non riesce), mentre il mancato raggiungimento di una soglia minima OpenAI è solo oggetto di monitoraggio (viene registrato come avviso e non causa il fallimento dell'esecuzione). Non condividono un'unica soglia comune tra provider.

### Aspettative operative di Anthropic

- Sono previste scritture esplicite di riscaldamento tramite `cacheWrite`.
- È previsto il riutilizzo di quasi tutta la cronologia nei turni ripetuti, perché il controllo della cache di Anthropic fa avanzare il punto di interruzione della cache nel corso della conversazione.
- Le soglie minime di riferimento per i percorsi stabili, degli strumenti, delle immagini e in stile MCP sono criteri rigidi di rilevamento delle regressioni.

### Aspettative per OpenAI in produzione

- È previsto solo `cacheRead`; `cacheWrite` rimane `0` con Chat Completions.
- Il riutilizzo della cache nei turni ripetuti va considerato come un plateau specifico del provider, non come il riutilizzo mobile dell'intera cronologia in stile Anthropic.
- Le soglie minime sono solo di monitoraggio (un mancato raggiungimento viene registrato come avviso, non come errore del test) e derivano dal comportamento osservato in produzione su `gpt-5.4-mini`:

| Scenario                 | Soglia minima `cacheRead` | Soglia minima del tasso di hit |
| ------------------------ | ------------------------: | -----------------------------: |
| Prefisso stabile         |                     4.608 |                           0,90 |
| Trascrizione strumenti   |                     4.096 |                           0,85 |
| Trascrizione immagini    |                     3.840 |                           0,82 |
| Trascrizione in stile MCP |                    4.096 |                           0,85 |

I valori di riferimento osservati più di recente (da `live-cache-regression-baseline.ts`) sono risultati: prefisso stabile `cacheRead=4864`, tasso di hit `0.966`; trascrizione strumenti `cacheRead=4608`, tasso di hit `0.896`; trascrizione immagini `cacheRead=4864`, tasso di hit `0.954`; trascrizione in stile MCP `cacheRead=4608`, tasso di hit `0.891`.

Motivo per cui le asserzioni differiscono: Anthropic espone punti di interruzione della cache espliciti e il riutilizzo mobile della cronologia della conversazione, mentre il prefisso effettivamente riutilizzabile da OpenAI nel traffico in produzione può raggiungere un plateau prima del prompt completo. Confrontare i due provider rispetto a un'unica soglia percentuale trasversale produce falsi rilevamenti di regressione.

## Configurazione di `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # facoltativo
    includeMessages: false # valore predefinito true
    includePrompt: false # valore predefinito true
    includeSystem: false # valore predefinito true
```

Valori predefiniti:

| Chiave            | Valore predefinito                           |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Variabili di ambiente (debug occasionale)

| Variabile                            | Effetto                                          |
| ------------------------------------ | ----------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Abilita il tracciamento della cache             |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Sovrascrive il percorso di output               |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Attiva o disattiva l'acquisizione del payload completo dei messaggi |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Attiva o disattiva l'acquisizione del testo del prompt |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Attiva o disattiva l'acquisizione del prompt di sistema |

### Cosa esaminare

- Gli eventi di tracciamento della cache sono in formato JSONL, con snapshot per fase come `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- L'impatto dei token della cache per turno è visibile nelle normali superfici di utilizzo: `cacheRead` e `cacheWrite` compaiono in `/usage tokens`, `/status`, nei riepiloghi di utilizzo delle sessioni e nei layout personalizzati di `messages.usageTemplate`.
- Per Anthropic, quando la memorizzazione nella cache è attiva, sono previsti sia `cacheRead` sia `cacheWrite`.
- Per OpenAI, è previsto `cacheRead` in caso di hit della cache; `cacheWrite` viene valorizzato solo nei payload della Responses API che lo includono (vedere [OpenAI](#openai-direct-api) sopra).
- OpenAI restituisce inoltre intestazioni di tracciamento e di limite di frequenza, come `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`; usarle per tracciare le richieste, ma la contabilizzazione degli hit della cache deve comunque provenire dal payload di utilizzo, non dalle intestazioni.

## Risoluzione rapida dei problemi

- **`cacheWrite` elevato nella maggior parte dei turni**: verificare la presenza di input variabili nel prompt di sistema; verificare che il modello/provider supporti le impostazioni della cache.
- **`cacheWrite` elevato su Anthropic**: spesso significa che il punto di interruzione della cache si trova su contenuti che cambiano a ogni richiesta.
- **`cacheRead` basso su OpenAI**: verificare che il prefisso stabile sia all'inizio, che il prefisso ripetuto contenga almeno 1024 token e che lo stesso `prompt_cache_key` venga riutilizzato per i turni che devono condividere una cache.
- **Nessun effetto da `cacheRetention`**: verificare che la chiave del modello corrisponda a `agents.defaults.models["provider/model"]`.
- **Richieste Bedrock Nova con impostazioni della cache**: comportamento previsto; in fase di esecuzione, per queste richieste non viene applicata alcuna conservazione della cache.

Documentazione correlata:

- [Anthropic](/it/providers/anthropic)
- [Utilizzo dei token e costi](/it/reference/token-use)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Riferimento per la configurazione del Gateway](/it/gateway/configuration-reference)

## Contenuti correlati

- [Utilizzo dei token e costi](/it/reference/token-use)
- [Utilizzo delle API e costi](/it/reference/api-usage-costs)
