---
read_when:
    - Vuoi ridurre i costi dei token dei prompt con la conservazione della cache
    - Serve un comportamento della cache per agente nelle configurazioni multi-agente
    - Stai regolando insieme Heartbeat e la pulizia di cache-ttl
summary: Manopole della cache dei prompt, ordine di merge, comportamento dei provider e schemi di ottimizzazione
title: Cache dei prompt
x-i18n:
    generated_at: "2026-06-27T18:13:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

La cache dei prompt significa che il provider del modello può riutilizzare prefissi di prompt invariati (di solito istruzioni system/developer e altro contesto stabile) tra i turni invece di rielaborarli ogni volta. OpenClaw normalizza l’utilizzo del provider in `cacheRead` e `cacheWrite` quando l’API upstream espone direttamente quei contatori.

Le superfici di stato possono anche recuperare i contatori della cache dal log di
utilizzo della trascrizione più recente quando mancano nello snapshot della sessione live, così `/status` può continuare a
mostrare una riga della cache dopo una perdita parziale dei metadati di sessione. I valori live non nulli esistenti della
cache hanno comunque precedenza sui valori di fallback della trascrizione.

Perché è importante: costo dei token inferiore, risposte più rapide e prestazioni più prevedibili per sessioni di lunga durata. Senza cache, i prompt ripetuti pagano l’intero costo del prompt a ogni turno anche quando la maggior parte dell’input non è cambiata.

Le sezioni seguenti coprono ogni parametro relativo alla cache che influisce sul riutilizzo del prompt e sul costo dei token.

Riferimenti dei provider:

- Cache dei prompt Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache dei prompt OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header dell’API OpenAI e ID richiesta: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID richiesta ed errori Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Controlli principali

### `cacheRetention` (predefinito globale, modello e per agente)

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
3. `agents.list[].params` (ID agente corrispondente; override per chiave)

### `contextPruning.mode: "cache-ttl"`

Riduce il contesto dei vecchi risultati degli strumenti dopo le finestre TTL della cache, così le richieste dopo periodi di inattività non rimettono in cache una cronologia sovradimensionata.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Vedi [Potatura della sessione](/it/concepts/session-pruning) per il comportamento completo.

### Mantenimento della cache calda con Heartbeat

Heartbeat può mantenere calde le finestre della cache e ridurre scritture ripetute in cache dopo intervalli di inattività.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agente è supportato in `agents.list[].heartbeat`.

## Comportamento dei provider

### Anthropic (API diretta)

- `cacheRetention` è supportato.
- Con i profili di autenticazione tramite chiave API Anthropic, OpenClaw imposta `cacheRetention: "short"` per i riferimenti ai modelli Anthropic quando non è configurato.
- Le risposte native Messages di Anthropic espongono sia `cache_read_input_tokens` sia `cache_creation_input_tokens`, quindi OpenClaw può mostrare sia `cacheRead` sia `cacheWrite`.
- Per le richieste native Anthropic, `cacheRetention: "short"` corrisponde alla cache effimera predefinita di 5 minuti, e `cacheRetention: "long"` passa al TTL di 1 ora solo sugli host diretti `api.anthropic.com`.

### OpenAI (API diretta)

- La cache dei prompt è automatica sui modelli recenti supportati. OpenClaw non deve iniettare marcatori di cache a livello di blocco.
- OpenClaw usa `prompt_cache_key` per mantenere stabile il routing della cache tra i turni. Gli host OpenAI diretti usano `prompt_cache_retention: "24h"` quando è selezionato `cacheRetention: "long"`.
- I provider Completions compatibili con OpenAI ricevono `prompt_cache_key` solo quando la loro configurazione del modello imposta esplicitamente `compat.supportsPromptCacheKey: true`. L’inoltro della conservazione lunga è una capacità separata: `cacheRetention: "long"` esplicito invia `prompt_cache_retention: "24h"` solo quando quella voce compat supporta anche la conservazione lunga della cache. Provider come Mistral possono aderire alle chiavi cache impostando al contempo `compat.supportsLongCacheRetention: false` per sopprimere il campo di conservazione lunga. `cacheRetention: "none"` sopprime entrambi i campi.
- Le risposte OpenAI espongono i token del prompt dalla cache tramite `usage.prompt_tokens_details.cached_tokens` (o `input_tokens_details.cached_tokens` negli eventi dell’API Responses). OpenClaw lo mappa a `cacheRead`.
- OpenAI non espone un contatore separato dei token di scrittura cache, quindi `cacheWrite` resta `0` sui percorsi OpenAI anche quando il provider sta preparando una cache.
- OpenAI restituisce header utili per tracciamento e limiti di frequenza, come `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`, ma la contabilizzazione dei riscontri cache deve provenire dal payload di utilizzo, non dagli header.
- In pratica, OpenAI spesso si comporta come una cache del prefisso iniziale invece che come riutilizzo della cronologia completa mobile in stile Anthropic. I turni con testo a prefisso lungo stabile possono attestarsi vicino a un plateau di `4864` token dalla cache nei probe live attuali, mentre le trascrizioni ricche di strumenti o in stile MCP spesso si attestano vicino a `4608` token dalla cache anche su ripetizioni esatte.

### Anthropic Vertex

- I modelli Anthropic su Vertex AI (`anthropic-vertex/*`) supportano `cacheRetention` nello stesso modo dell’API Anthropic diretta.
- `cacheRetention: "long"` corrisponde al vero TTL di 1 ora della cache dei prompt sugli endpoint Vertex AI.
- La conservazione della cache predefinita per `anthropic-vertex` corrisponde ai predefiniti di Anthropic diretto.
- Le richieste Vertex sono instradate tramite modellazione della cache consapevole dei confini, così il riutilizzo della cache resta allineato a ciò che i provider ricevono effettivamente.

### Amazon Bedrock

- I riferimenti ai modelli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) supportano il pass-through esplicito di `cacheRetention`.
- I modelli Bedrock non Anthropic sono forzati a `cacheRetention: "none"` a runtime.

### Modelli OpenRouter

Per i riferimenti modello `openrouter/anthropic/*`, OpenClaw inietta
`cache_control` nei blocchi di prompt system/developer per migliorare il
riutilizzo della cache dei prompt solo quando la richiesta sta ancora puntando a una route OpenRouter verificata
(`openrouter` sul suo endpoint predefinito, oppure qualunque provider/URL di base che si risolve
in `openrouter.ai`).

Per i riferimenti modello `openrouter/deepseek/*`, `openrouter/moonshot*/*` e `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` è consentito perché OpenRouter
gestisce automaticamente la cache dei prompt lato provider. OpenClaw non inietta
marcatori Anthropic `cache_control` in quelle richieste.

La costruzione della cache DeepSeek è best effort e può richiedere alcuni secondi. Un
follow-up immediato può ancora mostrare `cached_tokens: 0`; verifica con una richiesta ripetuta
con lo stesso prefisso dopo un breve ritardo e usa `usage.prompt_tokens_details.cached_tokens`
come segnale di riscontro cache.

Se reindirizzi il modello a un URL proxy compatibile con OpenAI arbitrario, OpenClaw
smette di iniettare quei marcatori di cache Anthropic specifici di OpenRouter.

### Altri provider

Se il provider non supporta questa modalità di cache, `cacheRetention` non ha effetto.

### API diretta Google Gemini

- Il trasporto Gemini diretto (`api: "google-generative-ai"`) segnala i riscontri cache
  tramite `cachedContentTokenCount` upstream; OpenClaw lo mappa a `cacheRead`.
- Quando `cacheRetention` è impostato su un modello Gemini diretto, OpenClaw crea,
  riusa e aggiorna automaticamente risorse `cachedContents` per i prompt system
  nelle esecuzioni Google AI Studio. Questo significa che non è più necessario pre-creare manualmente
  un handle di contenuto cache.
- Puoi comunque passare un handle Gemini cached-content preesistente come
  `params.cachedContent` (o legacy `params.cached_content`) sul modello configurato.
- Questo è separato dalla cache dei prefissi prompt Anthropic/OpenAI. Per Gemini,
  OpenClaw gestisce una risorsa provider-native `cachedContents` invece di
  iniettare marcatori di cache nella richiesta.

### Uso della CLI Gemini

- L’output Gemini CLI `stream-json` può esporre riscontri cache tramite `stats.cached`;
  OpenClaw lo mappa a `cacheRead`. Gli override legacy `--output-format json` usano
  la stessa normalizzazione dell’utilizzo.
- Se la CLI omette un valore diretto `stats.input`, OpenClaw deriva i token di input
  da `stats.input_tokens - stats.cached`.
- Questa è solo normalizzazione dell’utilizzo. Non significa che OpenClaw stia creando
  marcatori di cache dei prompt in stile Anthropic/OpenAI per Gemini CLI.

## Confine della cache del prompt system

OpenClaw divide il prompt system in un **prefisso stabile** e un **suffisso volatile**
separati da un confine interno del prefisso cache. Il contenuto sopra il
confine (definizioni degli strumenti, metadati Skills, file del workspace e altro
contesto relativamente statico) è ordinato in modo che resti identico byte per byte tra i turni.
Il contenuto sotto il confine (per esempio `HEARTBEAT.md`, timestamp runtime e
altri metadati per turno) può cambiare senza invalidare il prefisso
in cache.

Scelte progettuali chiave:

- I file stabili del contesto progetto del workspace sono ordinati prima di `HEARTBEAT.md`, così
  la variabilità di heartbeat non invalida il prefisso stabile.
- Il confine è applicato alla modellazione dei trasporti delle famiglie Anthropic, OpenAI, Google e
  CLI, così tutti i provider supportati beneficiano della stessa stabilità del prefisso.
- Le richieste Codex Responses e Anthropic Vertex sono instradate tramite
  modellazione della cache consapevole dei confini, così il riutilizzo della cache resta allineato a ciò che i provider
  ricevono effettivamente.
- Le fingerprint dei prompt system sono normalizzate (spazi, terminatori di riga,
  contesto aggiunto dagli hook, ordinamento delle capacità runtime) così prompt semanticamente invariati
  condividono KV/cache tra i turni.

Se vedi picchi inattesi di `cacheWrite` dopo una modifica di configurazione o del workspace,
controlla se la modifica finisce sopra o sotto il confine della cache. Spostare
il contenuto volatile sotto il confine (o stabilizzarlo) spesso risolve il
problema.

## Guardie di stabilità della cache OpenClaw

OpenClaw mantiene deterministiche anche diverse forme di payload sensibili alla cache prima che
la richiesta raggiunga il provider:

- I cataloghi degli strumenti MCP del bundle sono ordinati deterministicamente prima della registrazione degli strumenti,
  così modifiche all’ordine di `listTools()` non alterano il blocco degli strumenti e
  non invalidano i prefissi della cache dei prompt.
- Le sessioni legacy con blocchi immagine persistiti mantengono intatti i **3 turni completati più recenti**;
  i blocchi immagine più vecchi già elaborati possono essere sostituiti
  con un marcatore, così i follow-up ricchi di immagini non continuano a reinviare grandi
  payload obsoleti.

## Schemi di tuning

### Traffico misto (predefinito consigliato)

Mantieni una baseline longeva sul tuo agente principale, disabilita la cache sugli agenti notificatori a raffica:

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
- Mantieni Heartbeat sotto il tuo TTL solo per gli agenti che beneficiano di cache calde.

## Diagnostica della cache

OpenClaw espone diagnostiche dedicate di traccia cache per le esecuzioni agent incorporate.

Per le normali diagnostiche visibili all’utente, `/status` e altri riepiloghi di utilizzo possono usare
l’ultima voce di utilizzo della trascrizione come fonte di fallback per `cacheRead` /
`cacheWrite` quando la voce della sessione live non ha quei contatori.

## Test di regressione live

OpenClaw mantiene un unico gate combinato di regressione cache live per prefissi ripetuti, turni con strumenti, turni con immagini, trascrizioni di strumenti in stile MCP e un controllo Anthropic senza cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Esegui il gate live ristretto con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Il file baseline memorizza i numeri live osservati più recenti più le soglie di regressione specifiche del provider usate dal test.
Il runner usa anche ID sessione e namespace dei prompt nuovi per ogni esecuzione, così lo stato cache precedente non contamina il campione di regressione corrente.

Questi test intenzionalmente non usano criteri di successo identici tra provider.

### Aspettative live di Anthropic

- Aspettati scritture di warmup esplicite tramite `cacheWrite`.
- Aspettati un riutilizzo quasi completo della cronologia nei turni ripetuti perché il controllo della cache di Anthropic fa avanzare il breakpoint della cache lungo la conversazione.
- Le asserzioni live attuali usano ancora soglie di hit rate elevate per i percorsi stabili, con strumenti e con immagini.

### Aspettative live di OpenAI

- Aspettati solo `cacheRead`. `cacheWrite` rimane `0`.
- Considera il riutilizzo della cache nei turni ripetuti come un plateau specifico del provider, non come un riutilizzo mobile dell'intera cronologia in stile Anthropic.
- Le asserzioni live attuali usano controlli di soglia minima conservativi derivati dal comportamento live osservato su `gpt-5.4-mini`:
  - prefisso stabile: `cacheRead >= 4608`, hit rate `>= 0.90`
  - trascrizione degli strumenti: `cacheRead >= 4096`, hit rate `>= 0.85`
  - trascrizione delle immagini: `cacheRead >= 3840`, hit rate `>= 0.82`
  - trascrizione in stile MCP: `cacheRead >= 4096`, hit rate `>= 0.85`

La verifica live combinata più recente del 2026-04-04 ha ottenuto:

- prefisso stabile: `cacheRead=4864`, hit rate `0.966`
- trascrizione degli strumenti: `cacheRead=4608`, hit rate `0.896`
- trascrizione delle immagini: `cacheRead=4864`, hit rate `0.954`
- trascrizione in stile MCP: `cacheRead=4608`, hit rate `0.891`

Il tempo wall-clock locale recente per il gate combinato è stato di circa `88s`.

Perché le asserzioni differiscono:

- Anthropic espone breakpoint della cache espliciti e il riutilizzo mobile della cronologia della conversazione.
- La cache dei prompt di OpenAI è ancora sensibile al prefisso esatto, ma il prefisso effettivamente riutilizzabile nel traffico live Responses può raggiungere un plateau prima del prompt completo.
- Per questo, confrontare Anthropic e OpenAI con una singola soglia percentuale cross-provider crea regressioni false.

### Configurazione `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Valori predefiniti:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Attivazioni/disattivazioni env (debug una tantum)

- `OPENCLAW_CACHE_TRACE=1` abilita il tracciamento della cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` sovrascrive il percorso di output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` attiva o disattiva la cattura del payload completo dei messaggi.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` attiva o disattiva la cattura del testo del prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` attiva o disattiva la cattura del prompt di sistema.

### Cosa ispezionare

- Gli eventi di trace della cache sono JSONL e includono snapshot a fasi come `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- L'impatto per turno dei token della cache è visibile nelle normali superfici d'uso tramite `cacheRead` e `cacheWrite` (per esempio `/usage full` e i riepiloghi di utilizzo della sessione).
- Per Anthropic, aspettati sia `cacheRead` sia `cacheWrite` quando la cache è attiva.
- Per OpenAI, aspettati `cacheRead` in caso di cache hit e che `cacheWrite` rimanga `0`; OpenAI non pubblica un campo separato per i token di scrittura nella cache.
- Se ti serve il tracciamento delle richieste, registra gli ID richiesta e le intestazioni di rate limit separatamente dalle metriche della cache. L'output attuale di cache-trace di OpenClaw è focalizzato sulla forma di prompt/sessione e sull'uso normalizzato dei token, non sulle intestazioni grezze delle risposte del provider.

## Risoluzione rapida dei problemi

- `cacheWrite` elevato nella maggior parte dei turni: controlla input volatili del prompt di sistema e verifica che il modello/provider supporti le tue impostazioni di cache.
- `cacheWrite` elevato su Anthropic: spesso significa che il breakpoint della cache sta finendo su contenuti che cambiano a ogni richiesta.
- `cacheRead` basso su OpenAI: verifica che il prefisso stabile sia all'inizio, che il prefisso ripetuto sia di almeno 1024 token e che lo stesso `prompt_cache_key` venga riutilizzato per i turni che dovrebbero condividere una cache.
- Nessun effetto da `cacheRetention`: conferma che la chiave del modello corrisponda a `agents.defaults.models["provider/model"]`.
- Richieste Bedrock Nova/Mistral con impostazioni di cache: forzatura runtime prevista a `none`.

Documentazione correlata:

- [Anthropic](/it/providers/anthropic)
- [Uso dei token e costi](/it/reference/token-use)
- [Potatura della sessione](/it/concepts/session-pruning)
- [Riferimento alla configurazione del Gateway](/it/gateway/configuration-reference)

## Correlati

- [Uso dei token e costi](/it/reference/token-use)
- [Utilizzo dell'API e costi](/it/reference/api-usage-costs)
