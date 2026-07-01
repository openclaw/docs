---
read_when:
    - Vuoi ridurre i costi in token dei prompt con la conservazione della cache
    - Serve un comportamento della cache per agente nelle configurazioni multi-agente
    - Stai configurando insieme il pruning di heartbeat e cache-ttl
summary: Manopole di cache dei prompt, ordine di merge, comportamento del provider e pattern di ottimizzazione
title: Caching dei prompt
x-i18n:
    generated_at: "2026-07-01T08:09:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

La cache dei prompt significa che il provider del modello può riutilizzare prefissi di prompt invariati (di solito istruzioni system/developer e altro contesto stabile) tra i turni invece di rielaborarli ogni volta. OpenClaw normalizza l'uso del provider in `cacheRead` e `cacheWrite` quando l'API upstream espone direttamente questi contatori.

Le superfici di stato possono anche recuperare i contatori della cache dal log di
utilizzo della trascrizione più recente quando mancano dallo snapshot della sessione live, così `/status` può continuare a
mostrare una riga della cache dopo una perdita parziale dei metadati della sessione. I valori live
non zero esistenti della cache hanno comunque la precedenza sui valori di fallback della trascrizione.

Perché è importante: costo dei token più basso, risposte più rapide e prestazioni più prevedibili per sessioni di lunga durata. Senza cache, i prompt ripetuti pagano l'intero costo del prompt a ogni turno anche quando la maggior parte dell'input non è cambiata.

Le sezioni seguenti coprono ogni manopola relativa alla cache che influisce sul riutilizzo dei prompt e sul costo dei token.

Riferimenti dei provider:

- Cache dei prompt Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache dei prompt OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API e ID richiesta OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID richiesta ed errori Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Manopole principali

### `cacheRetention` (predefinito globale, modello e per-agent)

Imposta la conservazione della cache come predefinito globale per tutti i modelli:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Sovrascrivi per modello:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Sovrascrittura per-agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Ordine di merge della configurazione:

1. `agents.defaults.params` (predefinito globale — si applica a tutti i modelli)
2. `agents.defaults.models["provider/model"].params` (sovrascrittura per modello)
3. `agents.list[].params` (id agent corrispondente; sovrascrive per chiave)

### `contextPruning.mode: "cache-ttl"`

Elimina il vecchio contesto dei risultati degli strumenti dopo le finestre TTL della cache, così le richieste dopo periodi di inattività non rimettono in cache cronologie sovradimensionate.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Vedi [Potatura della sessione](/it/concepts/session-pruning) per il comportamento completo.

### Heartbeat keep-warm

Heartbeat può mantenere calde le finestre di cache e ridurre le riscritture ripetute della cache dopo intervalli di inattività.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per-agent è supportato in `agents.list[].heartbeat`.

## Comportamento dei provider

### Anthropic (API diretta)

- `cacheRetention` è supportato.
- Con i profili di autenticazione Anthropic basati su chiave API, OpenClaw inizializza `cacheRetention: "short"` per i riferimenti ai modelli Anthropic quando non è impostato.
- Le risposte native Messages di Anthropic espongono sia `cache_read_input_tokens` sia `cache_creation_input_tokens`, quindi OpenClaw può mostrare sia `cacheRead` sia `cacheWrite`.
- Per le richieste native Anthropic, `cacheRetention: "short"` corrisponde alla cache effimera predefinita di 5 minuti, mentre `cacheRetention: "long"` passa al TTL di 1 ora solo sugli host diretti `api.anthropic.com`.

### OpenAI (API diretta)

- La cache dei prompt è automatica sui modelli recenti supportati. OpenClaw non deve iniettare marcatori di cache a livello di blocco.
- OpenClaw usa `prompt_cache_key` per mantenere stabile il routing della cache tra i turni. Gli host OpenAI diretti usano `prompt_cache_retention: "24h"` quando è selezionato `cacheRetention: "long"`.
- I provider Completions compatibili con OpenAI ricevono `prompt_cache_key` solo quando la configurazione del loro modello imposta esplicitamente `compat.supportsPromptCacheKey: true`. L'inoltro della conservazione lunga è una capacità separata: `cacheRetention: "long"` esplicito invia `prompt_cache_retention: "24h"` solo quando anche quella voce compat supporta la conservazione lunga della cache. Provider come Mistral possono abilitare le chiavi di cache impostando al tempo stesso `compat.supportsLongCacheRetention: false` per sopprimere il campo di conservazione lunga. `cacheRetention: "none"` sopprime entrambi i campi.
- Le risposte OpenAI espongono i token del prompt in cache tramite `usage.prompt_tokens_details.cached_tokens` (o `input_tokens_details.cached_tokens` sugli eventi Responses API). OpenClaw lo mappa a `cacheRead`.
- L'utilizzo GPT-5.6 Responses può anche esporre `input_tokens_details.cache_write_tokens`. OpenClaw lo mappa a `cacheWrite` e lo prezza alla tariffa cache-write del modello; le Responses che omettono il campo mantengono `cacheWrite` a `0`.
- OpenAI restituisce header utili per tracciamento e limiti di frequenza come `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`, ma il conteggio degli hit della cache deve provenire dal payload di utilizzo, non dagli header.
- In pratica, OpenAI spesso si comporta come una cache del prefisso iniziale anziché come riutilizzo dell'intera cronologia in movimento in stile Anthropic. Turni di testo con prefisso lungo stabile possono arrivare vicino a un plateau di `4864` token in cache nelle sonde live attuali, mentre trascrizioni ricche di strumenti o in stile MCP spesso si stabilizzano vicino a `4608` token in cache anche su ripetizioni esatte.

### Anthropic Vertex

- I modelli Anthropic su Vertex AI (`anthropic-vertex/*`) supportano `cacheRetention` nello stesso modo dell'Anthropic diretto.
- `cacheRetention: "long"` corrisponde al vero TTL di 1 ora della cache dei prompt sugli endpoint Vertex AI.
- La conservazione predefinita della cache per `anthropic-vertex` corrisponde ai predefiniti dell'Anthropic diretto.
- Le richieste Vertex sono instradate tramite shaping della cache consapevole dei confini, così il riutilizzo della cache resta allineato con ciò che i provider ricevono effettivamente.

### Amazon Bedrock

- I riferimenti ai modelli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) supportano il pass-through esplicito di `cacheRetention`.
- I modelli Bedrock non Anthropic vengono forzati a `cacheRetention: "none"` a runtime.

### Modelli OpenRouter

Per i riferimenti ai modelli `openrouter/anthropic/*`, OpenClaw inietta
`cache_control` sui blocchi di prompt system/developer per migliorare il riutilizzo
della cache dei prompt solo quando la richiesta sta ancora puntando a una route
OpenRouter verificata (`openrouter` sul suo endpoint predefinito, o qualsiasi
provider/base URL che risolve a `openrouter.ai`).

Per i riferimenti ai modelli `openrouter/deepseek/*`, `openrouter/moonshot*/*` e `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` è consentito perché OpenRouter
gestisce automaticamente la cache dei prompt lato provider. OpenClaw non inietta
marcatori Anthropic `cache_control` in queste richieste.

La costruzione della cache DeepSeek è best-effort e può richiedere alcuni secondi. Un
follow-up immediato può ancora mostrare `cached_tokens: 0`; verifica con una richiesta
ripetuta con lo stesso prefisso dopo una breve attesa e usa `usage.prompt_tokens_details.cached_tokens`
come segnale di hit della cache.

Se ripunti il modello a un URL proxy arbitrario compatibile con OpenAI, OpenClaw
smette di iniettare quei marcatori di cache Anthropic specifici di OpenRouter.

### Altri provider

Se il provider non supporta questa modalità di cache, `cacheRetention` non ha effetto.

### API diretta Google Gemini

- Il trasporto Gemini diretto (`api: "google-generative-ai"`) riporta gli hit della cache
  tramite `cachedContentTokenCount` upstream; OpenClaw lo mappa a `cacheRead`.
- Quando `cacheRetention` è impostato su un modello Gemini diretto, OpenClaw crea,
  riutilizza e aggiorna automaticamente le risorse `cachedContents` per i prompt system
  nelle esecuzioni Google AI Studio. Questo significa che non devi più pre-creare manualmente
  un handle cached-content.
- Puoi comunque passare un handle cached-content Gemini preesistente come
  `params.cachedContent` (o il legacy `params.cached_content`) sul modello configurato.
- Questo è separato dalla cache dei prefissi di prompt Anthropic/OpenAI. Per Gemini,
  OpenClaw gestisce una risorsa `cachedContents` nativa del provider invece di
  iniettare marcatori di cache nella richiesta.

### Uso di Gemini CLI

- L'output Gemini CLI `stream-json` può esporre hit della cache tramite `stats.cached`;
  OpenClaw lo mappa a `cacheRead`. Le sovrascritture legacy `--output-format json` usano
  la stessa normalizzazione dell'utilizzo.
- Se la CLI omette un valore diretto `stats.input`, OpenClaw deriva i token di input
  da `stats.input_tokens - stats.cached`.
- Questa è solo normalizzazione dell'utilizzo. Non significa che OpenClaw stia creando
  marcatori di cache dei prompt in stile Anthropic/OpenAI per Gemini CLI.

## Confine della cache del prompt system

OpenClaw divide il prompt system in un **prefisso stabile** e un **suffisso volatile**
separati da un confine interno del prefisso di cache. Il contenuto sopra il
confine (definizioni degli strumenti, metadati delle Skills, file dell'area di lavoro e altro
contesto relativamente statico) è ordinato in modo da restare identico byte per byte tra i turni.
Il contenuto sotto il confine (per esempio `HEARTBEAT.md`, timestamp di runtime e
altri metadati per-turno) può cambiare senza invalidare il prefisso
in cache.

Scelte di progettazione chiave:

- I file stabili di contesto del progetto nell'area di lavoro sono ordinati prima di `HEARTBEAT.md`, così
  il churn di Heartbeat non invalida il prefisso stabile.
- Il confine è applicato allo shaping dei trasporti delle famiglie Anthropic, OpenAI, Google e
  CLI, così tutti i provider supportati beneficiano della stessa stabilità del prefisso.
- Le richieste Codex Responses e Anthropic Vertex sono instradate tramite
  shaping della cache consapevole dei confini, così il riutilizzo della cache resta allineato con ciò che i provider
  ricevono effettivamente.
- Le fingerprint dei prompt system sono normalizzate (spazi, terminatori di riga,
  contesto aggiunto dagli hook, ordinamento delle capacità di runtime) così i prompt
  semanticamente invariati condividono KV/cache tra i turni.

Se vedi picchi inattesi di `cacheWrite` dopo una modifica alla configurazione o all'area di lavoro,
controlla se la modifica finisce sopra o sotto il confine della cache. Spostare
il contenuto volatile sotto il confine (o stabilizzarlo) spesso risolve il
problema.

## Guardie di stabilità della cache di OpenClaw

OpenClaw mantiene anche deterministiche diverse forme di payload sensibili alla cache prima
che la richiesta raggiunga il provider:

- I cataloghi degli strumenti Bundle MCP sono ordinati deterministicamente prima della
  registrazione degli strumenti, così le modifiche all'ordine di `listTools()` non fanno churn del blocco strumenti e
  non invalidano i prefissi della cache dei prompt.
- Le sessioni legacy con blocchi immagine persistiti mantengono intatti i **3 turni completati
  più recenti**; i blocchi immagine più vecchi già elaborati possono essere
  sostituiti con un marcatore, così i follow-up ricchi di immagini non continuano a reinviare grandi
  payload obsoleti.

## Pattern di ottimizzazione

### Traffico misto (predefinito consigliato)

Mantieni una baseline di lunga durata sul tuo agent principale, disabilita la cache sugli agent di notifica bursty:

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

### Baseline orientata al costo

- Imposta la baseline `cacheRetention: "short"`.
- Abilita `contextPruning.mode: "cache-ttl"`.
- Mantieni Heartbeat sotto il tuo TTL solo per gli agent che beneficiano di cache calde.

## Diagnostica della cache

OpenClaw espone diagnostica dedicata cache-trace per le esecuzioni embedded degli agent.

Per la diagnostica normale rivolta all'utente, `/status` e altri riepiloghi di utilizzo possono usare
l'ultima voce di utilizzo della trascrizione come sorgente di fallback per `cacheRead` /
`cacheWrite` quando la voce della sessione live non ha quei contatori.

## Test di regressione live

OpenClaw mantiene un unico gate combinato di regressione live della cache per prefissi ripetuti, turni con strumenti, turni con immagini, trascrizioni di strumenti in stile MCP e un controllo Anthropic senza cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Esegui il gate live ristretto con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Il file baseline memorizza i numeri live osservati più recenti più le soglie minime di regressione specifiche del provider usate dal test.
Il runner usa anche ID sessione e namespace dei prompt nuovi per ogni esecuzione, così lo stato precedente della cache non contamina il campione di regressione corrente.

Questi test intenzionalmente non usano criteri di successo identici tra provider.

### Aspettative live di Anthropic

- Aspettati scritture di warmup esplicite tramite `cacheWrite`.
- Aspettati il riuso quasi completo della cronologia nei turni ripetuti, perché il controllo cache di Anthropic fa avanzare il breakpoint della cache lungo la conversazione.
- Le asserzioni live correnti usano ancora soglie di hit rate elevate per i percorsi stabile, strumento e immagine.

### Aspettative live di OpenAI

- Aspettati solo `cacheRead`. `cacheWrite` resta `0`.
- Tratta il riuso della cache nei turni ripetuti come un plateau specifico del provider, non come riuso mobile dell'intera cronologia in stile Anthropic.
- Le asserzioni live correnti usano controlli di soglia conservativi derivati dal comportamento live osservato su `gpt-5.4-mini`:
  - prefisso stabile: `cacheRead >= 4608`, hit rate `>= 0.90`
  - trascrizione strumento: `cacheRead >= 4096`, hit rate `>= 0.85`
  - trascrizione immagine: `cacheRead >= 3840`, hit rate `>= 0.82`
  - trascrizione in stile MCP: `cacheRead >= 4096`, hit rate `>= 0.85`

La nuova verifica live combinata del 2026-04-04 è arrivata a:

- prefisso stabile: `cacheRead=4864`, hit rate `0.966`
- trascrizione strumento: `cacheRead=4608`, hit rate `0.896`
- trascrizione immagine: `cacheRead=4864`, hit rate `0.954`
- trascrizione in stile MCP: `cacheRead=4608`, hit rate `0.891`

Il tempo recente locale di wall-clock per il gate combinato era di circa `88s`.

Perché le asserzioni differiscono:

- Anthropic espone breakpoint cache espliciti e riuso mobile della cronologia della conversazione.
- La cache dei prompt di OpenAI è ancora sensibile al prefisso esatto, ma il prefisso effettivamente riutilizzabile nel traffico live di Responses può raggiungere un plateau prima del prompt completo.
- Per questo, confrontare Anthropic e OpenAI con una singola soglia percentuale trasversale ai provider crea false regressioni.

### Configurazione di `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Predefiniti:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Toggle env (debug occasionale)

- `OPENCLAW_CACHE_TRACE=1` abilita il tracciamento della cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` sovrascrive il percorso di output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` attiva o disattiva la cattura completa del payload dei messaggi.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` attiva o disattiva la cattura del testo del prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` attiva o disattiva la cattura del prompt di sistema.

### Cosa ispezionare

- Gli eventi di trace della cache sono JSONL e includono snapshot a fasi come `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- L'impatto dei token cache per turno è visibile nelle normali superfici d'uso tramite `cacheRead` e `cacheWrite` (per esempio `/usage full` e i riepiloghi di uso della sessione).
- Per Anthropic, aspettati sia `cacheRead` sia `cacheWrite` quando la cache è attiva.
- Per OpenAI, aspettati `cacheRead` sui cache hit. GPT-5.6 Responses può anche riportare `cacheWrite` mentre i segmenti del prompt vengono scritti; altri payload Responses che omettono il contatore di scrittura lo mantengono a `0`.
- Se ti serve il tracciamento delle richieste, registra gli ID richiesta e gli header di rate limit separatamente dalle metriche cache. L'output cache-trace corrente di OpenClaw si concentra sulla forma di prompt/sessione e sull'uso normalizzato dei token, invece che sugli header grezzi di risposta del provider.

## Risoluzione rapida dei problemi

- `cacheWrite` alto nella maggior parte dei turni: controlla input volatili del prompt di sistema e verifica che modello/provider supporti le tue impostazioni cache.
- `cacheWrite` alto su Anthropic: spesso significa che il breakpoint della cache sta finendo su contenuto che cambia a ogni richiesta.
- `cacheRead` basso su OpenAI: verifica che il prefisso stabile sia all'inizio, che il prefisso ripetuto sia di almeno 1024 token e che lo stesso `prompt_cache_key` venga riutilizzato per turni che dovrebbero condividere una cache.
- Nessun effetto da `cacheRetention`: conferma che la chiave del modello corrisponda a `agents.defaults.models["provider/model"]`.
- Richieste Bedrock Nova/Mistral con impostazioni cache: forza runtime prevista a `none`.

Documenti correlati:

- [Anthropic](/it/providers/anthropic)
- [Uso e costi dei token](/it/reference/token-use)
- [Sfoltimento della sessione](/it/concepts/session-pruning)
- [Riferimento della configurazione del Gateway](/it/gateway/configuration-reference)

## Correlati

- [Uso e costi dei token](/it/reference/token-use)
- [Uso e costi dell'API](/it/reference/api-usage-costs)
