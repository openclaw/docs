---
read_when:
    - Vuoi ridurre i costi dei token del prompt con la conservazione della cache
    - Hai bisogno di comportamento della cache per agente nelle configurazioni multi-agente
    - Stai ottimizzando insieme Heartbeat e pruning del cache-ttl
summary: Manopole della cache dei prompt, ordine di merge, comportamento del provider e pattern di ottimizzazione
title: Cache dei prompt
x-i18n:
    generated_at: "2026-04-24T09:00:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

La cache dei prompt significa che il provider del modello può riutilizzare prefissi di prompt invariati (di solito istruzioni di sistema/developer e altro contesto stabile) tra i turni invece di rielaborarli ogni volta. OpenClaw normalizza l’utilizzo del provider in `cacheRead` e `cacheWrite` quando l’API upstream espone direttamente quei contatori.

Le superfici di stato possono anche recuperare i contatori della cache dal log di utilizzo più recente della trascrizione quando lo snapshot della sessione live non li contiene, così `/status` può continuare a mostrare una riga di cache dopo una perdita parziale dei metadati di sessione. I valori di cache live esistenti e non nulli continuano comunque ad avere precedenza sui valori di fallback della trascrizione.

Perché è importante: costo token più basso, risposte più rapide e prestazioni più prevedibili per sessioni di lunga durata. Senza caching, i prompt ripetuti pagano il costo completo del prompt a ogni turno anche quando la maggior parte dell’input non cambia.

Questa pagina copre tutte le manopole relative alla cache che influenzano il riuso dei prompt e il costo dei token.

Riferimenti provider:

- Prompt caching Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Prompt caching OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Intestazioni API OpenAI e request ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Request ID ed errori Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Manopole principali

### `cacheRetention` (predefinito globale, modello e per-agente)

Imposta la conservazione della cache come predefinito globale per tutti i modelli:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Override per modello:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Override per agente:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Ordine di merge della configurazione:

1. `agents.defaults.params` (predefinito globale — si applica a tutti i modelli)
2. `agents.defaults.models["provider/model"].params` (override per modello)
3. `agents.list[].params` (ID agente corrispondente; sostituisce per chiave)

### `contextPruning.mode: "cache-ttl"`

Esegue il pruning del vecchio contesto dei risultati degli strumenti dopo le finestre TTL della cache, così le richieste post-idle non ricreano in cache cronologie troppo grandi.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Vedi [Session Pruning](/it/concepts/session-pruning) per il comportamento completo.

### Heartbeat keep-warm

Heartbeat può mantenere calde le finestre di cache e ridurre le scritture di cache ripetute dopo periodi di inattività.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agente è supportato in `agents.list[].heartbeat`.

## Comportamento del provider

### Anthropic (API diretta)

- `cacheRetention` è supportato.
- Con profili di autenticazione a chiave API Anthropic, OpenClaw inizializza `cacheRetention: "short"` per i riferimenti modello Anthropic quando non è impostato.
- Le risposte native Anthropic Messages espongono sia `cache_read_input_tokens` sia `cache_creation_input_tokens`, così OpenClaw può mostrare sia `cacheRead` sia `cacheWrite`.
- Per richieste Anthropic native, `cacheRetention: "short"` corrisponde alla cache ephemeral predefinita di 5 minuti, e `cacheRetention: "long"` passa al TTL di 1 ora solo su host diretti `api.anthropic.com`.

### OpenAI (API diretta)

- Il prompt caching è automatico sui modelli recenti supportati. OpenClaw non ha bisogno di iniettare marker di cache a livello di blocco.
- OpenClaw usa `prompt_cache_key` per mantenere stabile l’instradamento della cache tra i turni e usa `prompt_cache_retention: "24h"` solo quando `cacheRetention: "long"` è selezionato su host OpenAI diretti.
- Le risposte OpenAI espongono i token di prompt in cache tramite `usage.prompt_tokens_details.cached_tokens` (oppure `input_tokens_details.cached_tokens` sugli eventi Responses API). OpenClaw li mappa a `cacheRead`.
- OpenAI non espone un contatore separato di token scritti in cache, quindi `cacheWrite` resta `0` sui percorsi OpenAI anche quando il provider sta scaldando una cache.
- OpenAI restituisce utili intestazioni di tracing e rate-limit come `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`, ma la contabilizzazione dei cache-hit dovrebbe provenire dal payload di utilizzo, non dalle intestazioni.
- Nella pratica, OpenAI spesso si comporta più come una cache del prefisso iniziale che come il riuso mobile della cronologia completa in stile Anthropic. I turni di testo stabili con prefisso lungo possono assestarsi vicino a un plateau di `4864` token in cache nelle sonde live attuali, mentre trascrizioni pesanti di strumenti o in stile MCP spesso si assestano vicino a `4608` token in cache anche su ripetizioni esatte.

### Anthropic Vertex

- I riferimenti modello Anthropic su Vertex AI (`anthropic-vertex/*`) supportano `cacheRetention` allo stesso modo di Anthropic diretto.
- `cacheRetention: "long"` corrisponde al vero TTL di prompt-cache di 1 ora sugli endpoint Vertex AI.
- La retention della cache predefinita per `anthropic-vertex` corrisponde ai valori predefiniti di Anthropic diretto.
- Le richieste Vertex vengono instradate attraverso cache shaping consapevole dei boundary così il riuso della cache resta allineato a ciò che i provider ricevono realmente.

### Amazon Bedrock

- I riferimenti modello Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) supportano il pass-through esplicito di `cacheRetention`.
- I modelli Bedrock non Anthropic vengono forzati a `cacheRetention: "none"` a runtime.

### Modelli Anthropic OpenRouter

Per i riferimenti modello `openrouter/anthropic/*`, OpenClaw inietta
`cache_control` Anthropic sui blocchi di prompt di sistema/developer per migliorare il riuso della prompt-cache solo quando la richiesta punta ancora a una route OpenRouter verificata
(`openrouter` sul suo endpoint predefinito, oppure qualsiasi provider/base URL che si risolva in `openrouter.ai`).

Se ripunti il modello a un proxy URL OpenAI-compatible arbitrario, OpenClaw
smette di iniettare quei marker di cache specifici di OpenRouter Anthropic.

### Altri provider

Se il provider non supporta questa modalità di cache, `cacheRetention` non ha effetto.

### Google Gemini API diretta

- Il trasporto Gemini diretto (`api: "google-generative-ai"`) segnala i cache hit
  tramite l’upstream `cachedContentTokenCount`; OpenClaw lo mappa a `cacheRead`.
- Quando `cacheRetention` è impostato su un modello Gemini diretto, OpenClaw automaticamente
  crea, riutilizza e aggiorna risorse `cachedContents` per i prompt di sistema
  nelle esecuzioni Google AI Studio. Questo significa che non devi più precreare manualmente un handle cached-content.
- Puoi comunque passare un handle Gemini cached-content già esistente
  come `params.cachedContent` (oppure il legacy `params.cached_content`) sul modello
  configurato.
- Questo è separato dal prompt-prefix caching Anthropic/OpenAI. Per Gemini,
  OpenClaw gestisce una risorsa `cachedContents` nativa del provider invece di
  iniettare marker di cache nella richiesta.

### Utilizzo JSON Gemini CLI

- L’output JSON di Gemini CLI può anch’esso esporre cache hit tramite `stats.cached`;
  OpenClaw lo mappa a `cacheRead`.
- Se la CLI omette un valore diretto `stats.input`, OpenClaw deriva i token input
  da `stats.input_tokens - stats.cached`.
- Questa è solo normalizzazione dell’utilizzo. Non significa che OpenClaw stia creando
  marker di prompt-cache in stile Anthropic/OpenAI per Gemini CLI.

## Boundary di cache del prompt di sistema

OpenClaw divide il prompt di sistema in un **prefisso stabile** e un **suffisso volatile**
separati da un boundary interno di cache-prefix. Il contenuto sopra il
boundary (definizioni di strumenti, metadati Skills, file del workspace e altro
contesto relativamente statico) è ordinato in modo da restare identico byte per byte tra i turni.
Il contenuto sotto il boundary (per esempio `HEARTBEAT.md`, timestamp runtime e
altri metadati per-turno) può cambiare senza invalidare il prefisso
in cache.

Scelte progettuali chiave:

- I file stabili di contesto progetto del workspace sono ordinati prima di `HEARTBEAT.md` così
  il churn di Heartbeat non rompe il prefisso stabile.
- Il boundary viene applicato su shaping di trasporto Anthropic-family, OpenAI-family, Google e
  CLI così tutti i provider supportati beneficiano della stessa stabilità del prefisso.
- Le richieste Codex Responses e Anthropic Vertex vengono instradate tramite
  cache shaping consapevole dei boundary così il riuso della cache resta allineato a ciò che i provider ricevono realmente.
- Le impronte del prompt di sistema vengono normalizzate (whitespace, ending di riga,
  contesto aggiunto dagli hook, ordinamento delle capability runtime) così prompt semanticamente invariati condividono KV/cache tra i turni.

Se vedi picchi inattesi di `cacheWrite` dopo una modifica di configurazione o workspace,
controlla se il cambiamento cade sopra o sotto il boundary di cache. Spostare
il contenuto volatile sotto il boundary (oppure stabilizzarlo) spesso risolve il
problema.

## Protezioni di stabilità della cache in OpenClaw

OpenClaw mantiene anche deterministiche diverse forme di payload sensibili alla cache prima
che la richiesta raggiunga il provider:

- I cataloghi degli strumenti MCP inclusi vengono ordinati deterministicamente prima della registrazione
  degli strumenti, così i cambiamenti di ordine di `listTools()` non alterano il blocco strumenti e
  non rompono i prefissi della prompt-cache.
- Le sessioni legacy con blocchi immagine persistiti mantengono intatti i **3 turni completati più recenti**;
  i blocchi immagine già elaborati più vecchi possono essere
  sostituiti con un marker così i follow-up ricchi di immagini non continuano a reinviare
  grandi payload obsoleti.

## Pattern di ottimizzazione

### Traffico misto (predefinito consigliato)

Mantieni una baseline di lunga durata sul tuo agente principale, disabilita il caching sugli agenti notificatori bursty:

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

- Imposta una baseline `cacheRetention: "short"`.
- Abilita `contextPruning.mode: "cache-ttl"`.
- Mantieni Heartbeat sotto il tuo TTL solo per gli agenti che beneficiano di cache calde.

## Diagnostica della cache

OpenClaw espone una diagnostica dedicata di cache-trace per le esecuzioni di agenti embedded.

Per la diagnostica normale rivolta all’utente, `/status` e altri riepiloghi di utilizzo possono usare
l’ultima voce di utilizzo della trascrizione come sorgente di fallback per `cacheRead` /
`cacheWrite` quando la voce della sessione live non ha questi contatori.

## Test di regressione live

OpenClaw mantiene un unico gate di regressione live della cache combinato per prefissi ripetuti, turni strumento, turni immagine, trascrizioni di strumenti in stile MCP e un controllo Anthropic senza cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Esegui il gate live ristretto con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Il file baseline memorizza i numeri live osservati più recenti più le soglie di regressione specifiche del provider usate dal test.
Il runner usa anche ID sessione freschi per ogni esecuzione e namespace prompt così lo stato di cache precedente non inquina il campione di regressione corrente.

Questi test intenzionalmente non usano criteri di successo identici tra provider.

### Aspettative live Anthropic

- Aspettati scritture di warmup esplicite tramite `cacheWrite`.
- Aspettati riuso quasi completo della cronologia nei turni ripetuti perché il cache control Anthropic fa avanzare il punto di interruzione della cache lungo la conversazione.
- Le asserzioni live attuali usano ancora soglie di hit-rate elevate per percorsi stabili, di strumenti e di immagini.

### Aspettative live OpenAI

- Aspettati solo `cacheRead`. `cacheWrite` resta `0`.
- Tratta il riuso di cache nei turni ripetuti come un plateau specifico del provider, non come il riuso mobile dell’intera cronologia in stile Anthropic.
- Le asserzioni live attuali usano controlli di soglia conservativi derivati dal comportamento live osservato su `gpt-5.4-mini`:
  - prefisso stabile: `cacheRead >= 4608`, hit rate `>= 0.90`
  - trascrizione strumento: `cacheRead >= 4096`, hit rate `>= 0.85`
  - trascrizione immagine: `cacheRead >= 3840`, hit rate `>= 0.82`
  - trascrizione in stile MCP: `cacheRead >= 4096`, hit rate `>= 0.85`

La verifica live combinata più recente del 2026-04-04 ha prodotto:

- prefisso stabile: `cacheRead=4864`, hit rate `0.966`
- trascrizione strumento: `cacheRead=4608`, hit rate `0.896`
- trascrizione immagine: `cacheRead=4864`, hit rate `0.954`
- trascrizione in stile MCP: `cacheRead=4608`, hit rate `0.891`

Il tempo wall-clock locale recente per il gate combinato è stato di circa `88s`.

Perché le asserzioni differiscono:

- Anthropic espone punti di interruzione della cache espliciti e riuso mobile della cronologia della conversazione.
- Il prompt caching OpenAI è ancora sensibile al prefisso esatto, ma il prefisso effettivamente riutilizzabile nel traffico live Responses può assestarsi prima del prompt completo.
- Per questo, confrontare Anthropic e OpenAI con una singola soglia percentuale cross-provider crea false regressioni.

### Config `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # opzionale
    includeMessages: false # predefinito true
    includePrompt: false # predefinito true
    includeSystem: false # predefinito true
```

Valori predefiniti:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Toggle env (debug una tantum)

- `OPENCLAW_CACHE_TRACE=1` abilita il cache tracing.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` sostituisce il percorso di output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` abilita/disabilita la cattura del payload completo dei messaggi.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` abilita/disabilita la cattura del testo del prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` abilita/disabilita la cattura del prompt di sistema.

### Cosa ispezionare

- Gli eventi di cache trace sono JSONL e includono snapshot a fasi come `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- L’impatto per-turno dei token di cache è visibile nelle normali superfici di utilizzo tramite `cacheRead` e `cacheWrite` (per esempio `/usage full` e riepiloghi di utilizzo della sessione).
- Per Anthropic, aspettati sia `cacheRead` sia `cacheWrite` quando il caching è attivo.
- Per OpenAI, aspettati `cacheRead` sui cache hit e `cacheWrite` che resta `0`; OpenAI non pubblica un campo separato per i token di scrittura della cache.
- Se hai bisogno del tracing delle richieste, registra separatamente request ID e intestazioni di rate-limit dalle metriche di cache. L’output attuale di cache-trace di OpenClaw è focalizzato sulla forma prompt/sessione e sull’uso normalizzato dei token, non sulle intestazioni grezze delle risposte del provider.

## Risoluzione rapida dei problemi

- `cacheWrite` alta nella maggior parte dei turni: controlla input volatili del prompt di sistema e verifica che modello/provider supportino le tue impostazioni di cache.
- `cacheWrite` alta su Anthropic: spesso significa che il punto di interruzione della cache cade su contenuto che cambia a ogni richiesta.
- `cacheRead` bassa su OpenAI: verifica che il prefisso stabile sia all’inizio, che il prefisso ripetuto sia di almeno 1024 token e che lo stesso `prompt_cache_key` venga riutilizzato per i turni che dovrebbero condividere una cache.
- Nessun effetto da `cacheRetention`: conferma che la chiave del modello corrisponda a `agents.defaults.models["provider/model"]`.
- Richieste Bedrock Nova/Mistral con impostazioni di cache: previsto il force runtime a `none`.

Documentazione correlata:

- [Anthropic](/it/providers/anthropic)
- [Uso dei token e costi](/it/reference/token-use)
- [Session Pruning](/it/concepts/session-pruning)
- [Riferimento della configurazione del Gateway](/it/gateway/configuration-reference)

## Correlati

- [Uso dei token e costi](/it/reference/token-use)
- [Uso API e costi](/it/reference/api-usage-costs)
