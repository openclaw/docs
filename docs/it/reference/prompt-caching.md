---
read_when:
    - Vuoi ridurre i costi dei token del prompt con il mantenimento della cache
    - Hai bisogno di un comportamento della cache per agente in configurazioni multi-agente
    - Stai ottimizzando insieme heartbeat e potatura cache-ttl
summary: Opzioni della cache dei prompt, ordine di unione, comportamento del provider e modelli di ottimizzazione
title: Cache dei prompt
x-i18n:
    generated_at: "2026-04-05T14:05:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13d5f3153b6593ae22cd04a6c2540e074cf15df9f1990fc5b7184fe803f4a1bd
    source_path: reference/prompt-caching.md
    workflow: 15
---

# Cache dei prompt

La cache dei prompt significa che il provider del modello può riutilizzare prefissi di prompt invariati (di solito istruzioni di sistema/sviluppatore e altro contesto stabile) tra i vari turni invece di rielaborarli ogni volta. OpenClaw normalizza l'utilizzo del provider in `cacheRead` e `cacheWrite` quando l'API upstream espone direttamente questi contatori.

Le superfici di stato possono anche recuperare i contatori della cache dal log di
utilizzo della trascrizione più recente quando lo snapshot della sessione live
non li include, così `/status` può continuare a mostrare una riga della cache
dopo una perdita parziale dei metadati della sessione. I valori live esistenti
della cache diversi da zero continuano comunque ad avere la precedenza sui
valori di fallback della trascrizione.

Perché è importante: costo dei token inferiore, risposte più veloci e prestazioni più prevedibili per sessioni di lunga durata. Senza cache, i prompt ripetuti pagano il costo completo del prompt a ogni turno anche quando la maggior parte dell'input non è cambiata.

Questa pagina copre tutte le opzioni relative alla cache che influenzano il riutilizzo del prompt e il costo dei token.

Riferimenti dei provider:

- Cache dei prompt Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache dei prompt OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API e ID richiesta OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID richiesta ed errori Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Opzioni principali

### `cacheRetention` (predefinito globale, per modello e per agente)

Imposta il mantenimento della cache come predefinito globale per tutti i modelli:

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

Sovrascrittura per agente:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Ordine di unione della configurazione:

1. `agents.defaults.params` (predefinito globale — si applica a tutti i modelli)
2. `agents.defaults.models["provider/model"].params` (sovrascrittura per modello)
3. `agents.list[].params` (id agente corrispondente; sovrascrive per chiave)

### `contextPruning.mode: "cache-ttl"`

Elimina il vecchio contesto dei risultati degli strumenti dopo le finestre TTL della cache, così le richieste dopo periodi di inattività non rimettono in cache cronologie troppo grandi.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulta [Potatura della sessione](/it/concepts/session-pruning) per il comportamento completo.

### Heartbeat keep-warm

Heartbeat può mantenere calde le finestre della cache e ridurre le scritture ripetute in cache dopo intervalli di inattività.

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
- Con i profili di autenticazione tramite chiave API Anthropic, OpenClaw inizializza `cacheRetention: "short"` per i riferimenti ai modelli Anthropic quando non è impostato.
- Le risposte native Anthropic Messages espongono sia `cache_read_input_tokens` sia `cache_creation_input_tokens`, quindi OpenClaw può mostrare sia `cacheRead` sia `cacheWrite`.
- Per le richieste Anthropic native, `cacheRetention: "short"` corrisponde alla cache effimera predefinita di 5 minuti, mentre `cacheRetention: "long"` passa al TTL di 1 ora solo sugli host diretti `api.anthropic.com`.

### OpenAI (API diretta)

- La cache dei prompt è automatica sui modelli recenti supportati. OpenClaw non ha bisogno di inserire marcatori di cache a livello di blocco.
- OpenClaw usa `prompt_cache_key` per mantenere stabile il routing della cache tra i turni e usa `prompt_cache_retention: "24h"` solo quando `cacheRetention: "long"` è selezionato sugli host OpenAI diretti.
- Le risposte OpenAI espongono i token del prompt memorizzati nella cache tramite `usage.prompt_tokens_details.cached_tokens` (oppure `input_tokens_details.cached_tokens` negli eventi Responses API). OpenClaw li mappa in `cacheRead`.
- OpenAI non espone un contatore separato per i token scritti in cache, quindi `cacheWrite` resta `0` nei percorsi OpenAI anche quando il provider sta riscaldando una cache.
- OpenAI restituisce utili header di tracciamento e limitazione della frequenza come `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`, ma la contabilizzazione dei cache hit dovrebbe provenire dal payload di utilizzo, non dagli header.
- In pratica, OpenAI spesso si comporta come una cache del prefisso iniziale invece che come il riutilizzo dello storico completo in stile Anthropic. I turni con testo stabile e prefisso lungo possono assestarsi vicino a un plateau di `4864` token memorizzati nella cache nelle attuali sonde live, mentre le trascrizioni ricche di strumenti o in stile MCP spesso si assestano vicino a `4608` token memorizzati nella cache anche in caso di ripetizioni esatte.

### Anthropic Vertex

- I modelli Anthropic su Vertex AI (`anthropic-vertex/*`) supportano `cacheRetention` allo stesso modo di Anthropic diretto.
- `cacheRetention: "long"` corrisponde al vero TTL di 1 ora della cache dei prompt sugli endpoint Vertex AI.
- Il mantenimento predefinito della cache per `anthropic-vertex` corrisponde ai predefiniti diretti di Anthropic.
- Le richieste Vertex vengono instradate tramite una definizione della cache consapevole dei confini, così il riutilizzo della cache resta allineato a ciò che i provider ricevono realmente.

### Amazon Bedrock

- I riferimenti ai modelli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) supportano il pass-through esplicito di `cacheRetention`.
- I modelli Bedrock non Anthropic sono forzati a `cacheRetention: "none"` in fase di esecuzione.

### Modelli Anthropic su OpenRouter

Per i riferimenti ai modelli `openrouter/anthropic/*`, OpenClaw inserisce
`cache_control` di Anthropic nei blocchi del prompt di sistema/sviluppatore per
migliorare il riutilizzo della cache del prompt solo quando la richiesta è
ancora destinata a un percorso OpenRouter verificato (`openrouter` sul suo
endpoint predefinito, oppure qualsiasi provider/base URL che si risolva in
`openrouter.ai`).

Se reindirizzi il modello verso un URL proxy arbitrario compatibile con OpenAI,
OpenClaw smette di inserire questi marcatori di cache Anthropic specifici di OpenRouter.

### Altri provider

Se il provider non supporta questa modalità di cache, `cacheRetention` non ha alcun effetto.

### API diretta Google Gemini

- Il trasporto Gemini diretto (`api: "google-generative-ai"`) riporta i cache hit
  tramite l'upstream `cachedContentTokenCount`; OpenClaw lo mappa in `cacheRead`.
- Quando `cacheRetention` è impostato su un modello Gemini diretto, OpenClaw
  crea, riutilizza e aggiorna automaticamente le risorse `cachedContents` per i prompt di sistema
  nelle esecuzioni Google AI Studio. Questo significa che non devi più pre-creare manualmente
  un handle di contenuto in cache.
- Puoi comunque passare un handle Gemini cached-content preesistente come
  `params.cachedContent` (oppure il legacy `params.cached_content`) sul modello
  configurato.
- Questo è separato dalla cache del prefisso dei prompt di Anthropic/OpenAI. Per Gemini,
  OpenClaw gestisce una risorsa nativa del provider `cachedContents` invece di
  inserire marcatori di cache nella richiesta.

### Utilizzo JSON della CLI Gemini

- L'output JSON della CLI Gemini può anche mostrare i cache hit tramite `stats.cached`;
  OpenClaw lo mappa in `cacheRead`.
- Se la CLI omette un valore diretto `stats.input`, OpenClaw ricava i token di input
  da `stats.input_tokens - stats.cached`.
- Questa è solo una normalizzazione dell'utilizzo. Non significa che OpenClaw stia creando
  marcatori di cache del prompt in stile Anthropic/OpenAI per la CLI Gemini.

## Confine della cache del prompt di sistema

OpenClaw divide il prompt di sistema in un **prefisso stabile** e un **suffisso
volatile** separati da un confine interno del prefisso della cache. Il contenuto
sopra il confine (definizioni degli strumenti, metadati delle Skills, file del workspace e altro
contesto relativamente statico) è ordinato in modo da restare identico byte per byte tra i turni.
Il contenuto sotto il confine (per esempio `HEARTBEAT.md`, timestamp di runtime e
altri metadati per turno) può cambiare senza invalidare il prefisso
memorizzato nella cache.

Scelte di progettazione chiave:

- I file stabili del contesto del progetto del workspace sono ordinati prima di `HEARTBEAT.md`, così
  le variazioni di heartbeat non invalidano il prefisso stabile.
- Il confine viene applicato alla definizione della cache per le famiglie Anthropic, OpenAI, Google e per il trasporto CLI, così tutti i provider supportati beneficiano della stessa stabilità del prefisso.
- Le richieste Codex Responses e Anthropic Vertex vengono instradate tramite
  una definizione della cache consapevole dei confini, così il riutilizzo della cache resta allineato a ciò che i provider ricevono realmente.
- Le impronte del prompt di sistema sono normalizzate (spaziatura, terminazioni di riga,
  contesto aggiunto dagli hook, ordinamento delle capacità di runtime) così i
  prompt semanticamente invariati condividono KV/cache tra i turni.

Se vedi picchi imprevisti di `cacheWrite` dopo una modifica della configurazione o del workspace,
controlla se la modifica cade sopra o sotto il confine della cache. Spostare
contenuti volatili sotto il confine (o stabilizzarli) spesso risolve il
problema.

## Protezioni di stabilità della cache in OpenClaw

OpenClaw mantiene inoltre deterministiche diverse forme di payload sensibili alla cache prima
che la richiesta raggiunga il provider:

- I cataloghi degli strumenti Bundle MCP sono ordinati in modo deterministico prima della
  registrazione degli strumenti, così le variazioni nell'ordine di `listTools()` non alterano il blocco degli strumenti e
  non invalidano i prefissi della cache del prompt.
- Le sessioni legacy con blocchi immagine persistiti mantengono intatti i **3 turni completati più recenti**;
  i blocchi immagine più vecchi già elaborati possono essere
  sostituiti con un marcatore, così i follow-up ricchi di immagini non continuano a reinviare grandi
  payload obsoleti.

## Modelli di ottimizzazione

### Traffico misto (predefinito consigliato)

Mantieni una base di lunga durata sul tuo agente principale e disabilita la cache sugli agenti notificatori a raffica:

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

### Base orientata al costo

- Imposta la base con `cacheRetention: "short"`.
- Abilita `contextPruning.mode: "cache-ttl"`.
- Mantieni heartbeat sotto il tuo TTL solo per gli agenti che traggono beneficio da cache calde.

## Diagnostica della cache

OpenClaw espone una diagnostica dedicata del tracciamento della cache per le esecuzioni di agenti incorporati.

Per la diagnostica normale rivolta agli utenti, `/status` e altri riepiloghi di utilizzo possono usare
l'ultima voce di utilizzo della trascrizione come sorgente di fallback per `cacheRead` /
`cacheWrite` quando la voce della sessione live non contiene questi contatori.

## Test di regressione live

OpenClaw mantiene un unico gate combinato di regressione live della cache per prefissi ripetuti, turni con strumenti, turni con immagini, trascrizioni di strumenti in stile MCP e un controllo Anthropic senza cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Esegui il gate live ristretto con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Il file baseline memorizza i numeri live osservati più di recente insieme alle soglie di regressione specifiche del provider usate dal test.
Il runner usa inoltre ID di sessione e namespace dei prompt nuovi per ogni esecuzione, così lo stato della cache precedente non contamina il campione di regressione corrente.

Questi test intenzionalmente non usano criteri di successo identici per tutti i provider.

### Aspettative live Anthropic

- Aspettati scritture di riscaldamento esplicite tramite `cacheWrite`.
- Aspettati un riutilizzo quasi completo dello storico sui turni ripetuti perché il controllo della cache Anthropic fa avanzare il punto di interruzione della cache lungo la conversazione.
- Le attuali asserzioni live usano ancora soglie elevate di hit rate per i percorsi stabili, con strumenti e con immagini.

### Aspettative live OpenAI

- Aspettati solo `cacheRead`. `cacheWrite` resta `0`.
- Considera il riutilizzo della cache nei turni ripetuti come un plateau specifico del provider, non come il riutilizzo dello storico completo in movimento in stile Anthropic.
- Le attuali asserzioni live usano controlli conservativi delle soglie minime derivati dal comportamento live osservato su `gpt-5.4-mini`:
  - prefisso stabile: `cacheRead >= 4608`, hit rate `>= 0.90`
  - trascrizione con strumenti: `cacheRead >= 4096`, hit rate `>= 0.85`
  - trascrizione con immagini: `cacheRead >= 3840`, hit rate `>= 0.82`
  - trascrizione in stile MCP: `cacheRead >= 4096`, hit rate `>= 0.85`

La verifica live combinata più recente del 2026-04-04 ha prodotto:

- prefisso stabile: `cacheRead=4864`, hit rate `0.966`
- trascrizione con strumenti: `cacheRead=4608`, hit rate `0.896`
- trascrizione con immagini: `cacheRead=4864`, hit rate `0.954`
- trascrizione in stile MCP: `cacheRead=4608`, hit rate `0.891`

Il tempo locale recente di esecuzione complessivo per il gate combinato era di circa `88s`.

Perché le asserzioni sono diverse:

- Anthropic espone punti di interruzione espliciti della cache e riutilizzo mobile dello storico della conversazione.
- La cache dei prompt OpenAI è ancora sensibile al prefisso esatto, ma il prefisso riutilizzabile effettivo nel traffico live Responses può stabilizzarsi prima del prompt completo.
- Per questo motivo, confrontare Anthropic e OpenAI con un'unica soglia percentuale trasversale ai provider crea falsi regressi.

### Config `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # facoltativo
    includeMessages: false # predefinito true
    includePrompt: false # predefinito true
    includeSystem: false # predefinito true
```

Predefiniti:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Variabili d'ambiente (debug occasionale)

- `OPENCLAW_CACHE_TRACE=1` abilita il tracciamento della cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` sovrascrive il percorso di output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` attiva/disattiva l'acquisizione del payload completo dei messaggi.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` attiva/disattiva l'acquisizione del testo del prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` attiva/disattiva l'acquisizione del prompt di sistema.

### Cosa controllare

- Gli eventi del tracciamento della cache sono in JSONL e includono snapshot in fasi come `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- L'impatto dei token della cache per turno è visibile nelle normali superfici di utilizzo tramite `cacheRead` e `cacheWrite` (per esempio `/usage full` e i riepiloghi di utilizzo della sessione).
- Per Anthropic, aspettati sia `cacheRead` sia `cacheWrite` quando la cache è attiva.
- Per OpenAI, aspettati `cacheRead` sui cache hit e `cacheWrite` pari a `0`; OpenAI non pubblica un campo separato per i token scritti in cache.
- Se hai bisogno del tracciamento delle richieste, registra separatamente gli ID richiesta e gli header di rate limit dalle metriche della cache. L'attuale output del tracciamento della cache di OpenClaw è focalizzato sulla forma del prompt/sessione e sull'utilizzo normalizzato dei token, piuttosto che sugli header grezzi delle risposte del provider.

## Risoluzione rapida dei problemi

- `cacheWrite` alto nella maggior parte dei turni: controlla input volatili del prompt di sistema e verifica che modello/provider supporti le tue impostazioni della cache.
- `cacheWrite` alto su Anthropic: spesso significa che il punto di interruzione della cache cade su contenuti che cambiano a ogni richiesta.
- `cacheRead` basso su OpenAI: verifica che il prefisso stabile sia all'inizio, che il prefisso ripetuto sia di almeno 1024 token e che lo stesso `prompt_cache_key` venga riutilizzato per i turni che dovrebbero condividere una cache.
- Nessun effetto da `cacheRetention`: conferma che la chiave del modello corrisponda a `agents.defaults.models["provider/model"]`.
- Richieste Bedrock Nova/Mistral con impostazioni della cache: è previsto il forzamento in fase di esecuzione a `none`.

Documentazione correlata:

- [Anthropic](/it/providers/anthropic)
- [Uso dei token e costi](/it/reference/token-use)
- [Potatura della sessione](/it/concepts/session-pruning)
- [Riferimento della configurazione del Gateway](/it/gateway/configuration-reference)
