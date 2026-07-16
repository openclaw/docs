---
read_when:
    - Si vogliono ridurre i costi dei token dei prompt tramite la conservazione della cache
    - È necessario un comportamento della cache per singolo agente nelle configurazioni multi-agente
    - Si stanno configurando insieme Heartbeat e la rimozione basata sul TTL della cache
summary: Parametri della cache dei prompt, ordine di unione, comportamento del provider e modelli di ottimizzazione
title: Caching dei prompt
x-i18n:
    generated_at: "2026-07-16T14:56:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a5aefc4d4139c31461b81f164b9efa9a4c1c48d03146049cf447b9dfd6ea99
    source_path: reference/prompt-caching.md
    workflow: 16
---

La memorizzazione nella cache dei prompt consente a un provider di modelli di riutilizzare un prefisso del prompt invariato (istruzioni di sistema/sviluppatore, definizioni degli strumenti, altro contesto stabile) nei vari turni, anziché rielaborarlo a ogni richiesta. Ciò riduce il costo in token e la latenza nelle sessioni di lunga durata con contesto ripetuto.

OpenClaw normalizza l'utilizzo del provider in `cacheRead` e `cacheWrite` ovunque l'API upstream esponga tali contatori. I riepiloghi dell'utilizzo (`/status` e simili) ricorrono all'ultima voce di utilizzo della trascrizione quando l'istantanea della sessione attiva non contiene i contatori della cache; un valore attivo diverso da zero ha sempre la precedenza sul valore di ripiego.

Riferimenti dei provider:

- [Memorizzazione nella cache dei prompt di Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Memorizzazione nella cache dei prompt di OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Parametri principali

### `cacheRetention`

Valori: `"none" | "short" | "long"`. Configurabile come impostazione predefinita globale, per modello e per agente.
`"standard"` non è un alias; usare `"short"` per la finestra della cache predefinita del provider. I valori non validi vengono ignorati con un avviso.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # sostituisce l'impostazione predefinita globale per questo modello
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # sostituisce entrambe le impostazioni predefinite per questo agente
```

Ordine di unione (l'ultimo ha la precedenza):

1. `agents.defaults.params` - impostazione predefinita globale per tutti i modelli
2. `agents.defaults.models["provider/model"].params` - sostituzione per modello
3. `agents.list[].params` - sostituzione per agente, con corrispondenza in base all'id dell'agente

Fonte: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Rimuove dal contesto i risultati obsoleti degli strumenti dopo la scadenza della finestra TTL della cache, in modo che una richiesta successiva a un periodo di inattività non rimemorizzi nella cache una cronologia sovradimensionata.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consultare [Eliminazione delle sessioni](/it/concepts/session-pruning) per il comportamento completo.

### Mantenimento attivo tramite Heartbeat

Heartbeat può mantenere attive le finestre della cache e ridurre le scritture ripetute nella cache dopo periodi di inattività. È configurabile a livello globale (`agents.defaults.heartbeat`) o per singolo agente (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportamento dei provider

### Anthropic (API diretta e Vertex AI)

- `cacheRetention` è supportato per i provider `anthropic` e `anthropic-vertex`, nonché per i modelli Claude su `amazon-bedrock` e sugli endpoint personalizzati compatibili con `anthropic-messages` quando `cacheRetention` è impostato esplicitamente.
- Quando non è impostato, OpenClaw inizializza `cacheRetention: "short"` per Anthropic diretto (solo i provider `anthropic` e `anthropic-vertex`; gli altri percorsi della famiglia Anthropic richiedono un valore esplicito).
- Le risposte native di Anthropic Messages espongono `cache_read_input_tokens` e `cache_creation_input_tokens`, associati rispettivamente a `cacheRead` e `cacheWrite`.
- `cacheRetention: "short"` corrisponde alla cache temporanea predefinita di 5 minuti. Se impostato esplicitamente, `cacheRetention: "long"` richiede il TTL di 1 ora (`cache_control: { type: "ephemeral", ttl: "1h" }`). Una conservazione prolungata implicita o determinata dall'ambiente (`OPENCLAW_CACHE_RETENTION=long` senza un valore `cacheRetention` esplicito) passa al TTL di 1 ora solo sugli host `api.anthropic.com` o Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); gli altri host mantengono la cache di 5 minuti.

Fonte: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API diretta)

- La memorizzazione nella cache dei prompt è automatica sui modelli recenti supportati; OpenClaw non inserisce marcatori di cache a livello di blocco.
- OpenClaw invia `prompt_cache_key` per mantenere stabile l'instradamento della cache tra i turni. Gli host `api.openai.com` diretti lo ricevono automaticamente. I proxy compatibili con OpenAI (oMLX, llama.cpp, endpoint personalizzati) devono specificare `compat.supportsPromptCacheKey: true` nella configurazione del modello per abilitarlo: questa impostazione non viene mai rilevata automaticamente per un proxy.
- `prompt_cache_retention: "24h"` viene aggiunto solo quando è selezionato `cacheRetention: "long"` e l'endpoint risolto supporta sia la chiave della cache sia la conservazione prolungata (`compat.supportsLongCacheRetention`, valore predefinito true; i profili di compatibilità Together AI e Cloudflare la disabilitano). `cacheRetention: "none"` elimina entrambi i campi.
- I riscontri nella cache vengono esposti tramite `usage.prompt_tokens_details.cached_tokens` (Chat Completions) o `input_tokens_details.cached_tokens` (Responses API) e associati a `cacheRead`.
- I payload della Responses API possono esporre anche `input_tokens_details.cache_write_tokens`, associato a `cacheWrite` e addebitato alla tariffa di scrittura nella cache del modello; per i payload di Responses che omettono il campo, `cacheWrite` rimane impostato su `0`. L'API Chat Completions di OpenAI non documenta né emette un contatore `cache_write_tokens`, ma OpenClaw continua a leggere `prompt_tokens_details.cache_write_tokens` in tale posizione per i proxy compatibili con OpenRouter e quelli in stile DeepSeek che segnalano separatamente il numero di scritture.
- In pratica, OpenAI si comporta più come una cache del prefisso iniziale che come il riutilizzo dinamico dell'intera cronologia di Anthropic; consultare più avanti le [aspettative per OpenAI in uso reale](#openai-live-expectations).

### Amazon Bedrock

- I riferimenti ai modelli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, inclusi i prefissi dei profili di inferenza di sistema AWS `us.`/`eu.`/`global.anthropic.claude*`) supportano il passaggio esplicito di `cacheRetention`.
- I modelli Bedrock non Anthropic (ad esempio `amazon.nova-*`) vengono risolti in fase di esecuzione senza conservazione della cache, indipendentemente da qualsiasi valore `cacheRetention` configurato.
- Anche gli ARN opachi dei profili di inferenza delle applicazioni Bedrock (ID dei profili che non contengono `claude`) vengono risolti senza conservazione della cache, a meno che `cacheRetention` non sia impostato esplicitamente, poiché la famiglia del modello non può essere dedotta dal solo ARN.

### OpenRouter

Per i riferimenti ai modelli `openrouter/anthropic/*`, OpenClaw inserisce marcatori Anthropic `cache_control` nei blocchi dei prompt di sistema/sviluppatore, ma solo quando la richiesta è ancora indirizzata a un percorso OpenRouter verificato (`openrouter` sul relativo endpoint predefinito oppure qualsiasi provider/URL di base che si risolva in `openrouter.ai`). Reindirizzando il modello a un URL proxy arbitrario compatibile con OpenAI, tale inserimento viene interrotto.

`contextPruning.mode: "cache-ttl"` è consentito per i riferimenti ai modelli `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` e `openrouter/zai/*`, perché queste route gestiscono la memorizzazione nella cache del prompt lato provider senza richiedere i marcatori inseriti da OpenClaw.

Fonte: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

La creazione della cache di DeepSeek su OpenRouter avviene secondo il principio del massimo sforzo e può richiedere alcuni secondi; una richiesta immediatamente successiva potrebbe ancora mostrare `cached_tokens: 0`. Verificare con una richiesta ripetuta avente lo stesso prefisso dopo un breve intervallo, utilizzando `usage.prompt_tokens_details.cached_tokens` come segnale di riscontro nella cache.

### Google Gemini (API diretta)

- Il trasporto Gemini diretto (`api: "google-generative-ai"`) segnala i riscontri nella cache tramite `cachedContentTokenCount` a monte, mappato a `cacheRead`.
- Famiglie di modelli idonee: `gemini-2.5*` e `gemini-3*` (sono escluse le varianti Live/anteprima che non corrispondono a tale prefisso, ad esempio `gemini-live-2.5-flash-preview`).
- Quando `cacheRetention` è impostato su un modello idoneo, OpenClaw crea, riutilizza e aggiorna automaticamente una risorsa `cachedContents` per il prompt di sistema: non è necessario alcun handle manuale per il contenuto memorizzato nella cache. Il TTL è `300s` per `cacheRetention: "short"` e `3600s` per `"long"`.
- È comunque possibile passare un handle preesistente per il contenuto memorizzato nella cache di Gemini come `params.cachedContent` (o il precedente `params.cached_content`); un handle esplicito ignora completamente il percorso di gestione automatica della cache.
- Questo meccanismo è distinto dalla memorizzazione nella cache del prefisso del prompt di Anthropic/OpenAI: per Gemini, OpenClaw gestisce una risorsa `cachedContents` nativa del provider anziché inserire marcatori della cache inline.

Fonte: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Provider con harness CLI (Claude Code, Gemini CLI)

I backend CLI che emettono eventi di utilizzo JSONL (`jsonlDialect: "claude-stream-json"` o `"gemini-stream-json"`) passano attraverso un parser condiviso dell'utilizzo che riconosce diverse varianti dei nomi dei campi, incluso un semplice contatore `cached` mappato a `cacheRead`. Quando il payload JSON della CLI omette un campo diretto per i token di input, OpenClaw lo calcola come `input_tokens - cached`. Si tratta esclusivamente di normalizzazione dell'utilizzo: non crea marcatori della cache del prompt in stile Anthropic/OpenAI per questi modelli gestiti tramite CLI.

Fonte: `src/agents/cli-output.ts` (`toCliUsage`).

### Altri provider

Se un provider non supporta nessuna delle modalità di cache indicate sopra, `cacheRetention` non ha effetto.

## Confine della cache del prompt di sistema

OpenClaw suddivide il prompt di sistema in un **prefisso stabile** e un **suffisso volatile** in corrispondenza di un confine interno del prefisso della cache. Il contenuto sopra il confine (definizioni degli strumenti, metadati delle Skills, file dell'area di lavoro) viene ordinato in modo da rimanere identico byte per byte tra i vari turni. Il contenuto sotto il confine (ad esempio `HEARTBEAT.md`, timestamp di runtime e altri metadati specifici del turno) può cambiare senza invalidare il prefisso memorizzato nella cache.

Scelte progettuali principali:

- I file stabili del contesto di progetto nell'area di lavoro sono ordinati prima di `HEARTBEAT.md`, affinché le variazioni dell'Heartbeat non invalidino il prefisso stabile.
- Il confine si applica alla strutturazione del trasporto per le famiglie Anthropic e OpenAI, Google e CLI, consentendo a tutti i provider supportati di beneficiare della stessa stabilità del prefisso.
- Le richieste Codex Responses e Anthropic Vertex vengono instradate attraverso una strutturazione della cache consapevole del confine, affinché il riutilizzo della cache rimanga allineato con ciò che i provider ricevono effettivamente.
- Le impronte digitali del prompt di sistema vengono normalizzate (spaziatura, terminatori di riga, contesto aggiunto dagli hook, ordinamento delle funzionalità di runtime), affinché i prompt semanticamente invariati condividano la cache tra i vari turni.

Se si osservano picchi imprevisti di `cacheWrite` dopo una modifica alla configurazione o all'area di lavoro, verificare se la modifica si trova sopra o sotto il confine della cache. Lo spostamento del contenuto volatile sotto il confine, o la sua stabilizzazione, risolve generalmente il problema.

## Protezioni di OpenClaw per la stabilità della cache

- I cataloghi degli strumenti MCP inclusi vengono ordinati in modo deterministico (prima per nome del server, quindi per nome dello strumento) prima della registrazione degli strumenti, affinché le modifiche all'ordine di `listTools()` non alterino continuamente il blocco degli strumenti invalidando i prefissi della cache del prompt.
- Le sessioni precedenti con blocchi immagine persistenti mantengono intatti i **3 turni completati più recenti** (conteggiando tutti i turni completati, non solo quelli contenenti immagini). I blocchi immagine meno recenti e già elaborati vengono sostituiti con un marcatore di testo, affinché le richieste successive con molte immagini non continuino a reinviare payload obsoleti di grandi dimensioni.

## Schemi di ottimizzazione

### Traffico misto (impostazione predefinita consigliata)

Mantenere una configurazione di base persistente sull'agente principale e disabilitare la memorizzazione nella cache sugli agenti di notifica con traffico intermittente:

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

- Impostare il valore di base `cacheRetention: "short"`.
- Abilitare `contextPruning.mode: "cache-ttl"`.
- Mantenere l'intervallo dell'Heartbeat inferiore al TTL solo per gli agenti che beneficiano di cache già attive.

## Test di regressione live

OpenClaw esegue un unico controllo combinato di regressione live della cache che copre prefissi ripetuti, turni con strumenti, turni con immagini, trascrizioni degli strumenti in stile MCP e un controllo Anthropic senza cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Eseguirlo con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Il file di baseline memorizza i numeri live osservati più di recente insieme ai valori minimi di regressione specifici del provider rispetto ai quali viene eseguito il test. Ogni esecuzione utilizza ID di sessione e namespace dei prompt nuovi e specifici per l'esecuzione, in modo che lo stato precedente della cache non contamini il campione corrente. Anthropic e OpenAI applicano criteri diversi: il mancato raggiungimento di un valore minimo Anthropic costituisce una regressione bloccante (il test non riesce), mentre il mancato raggiungimento di un valore minimo OpenAI viene solo monitorato (registrato come avviso, senza causare il fallimento dell'esecuzione). Non condividono un'unica soglia valida per entrambi i provider.

### Aspettative live per Anthropic

- Sono previste scritture esplicite di riscaldamento tramite `cacheWrite`.
- È previsto un riutilizzo quasi completo della cronologia nei turni ripetuti, perché il controllo della cache di Anthropic fa avanzare il punto di interruzione della cache nel corso della conversazione.
- I valori minimi di baseline per i percorsi stabile, con strumenti, con immagini e in stile MCP sono criteri bloccanti per le regressioni.

### Aspettative live per OpenAI

- È previsto solo `cacheRead`; `cacheWrite` rimane `0` con Chat Completions.
- Il riutilizzo della cache nei turni ripetuti va considerato come un plateau specifico del provider, non come il riutilizzo progressivo dell'intera cronologia tipico di Anthropic.
- I valori minimi servono solo per il monitoraggio (il mancato raggiungimento viene registrato come avviso, non come errore del test) e derivano dal comportamento live osservato su `gpt-5.4-mini`:

| Scenario                   | Valore minimo di `cacheRead` | Valore minimo del tasso di hit |
| -------------------------- | ----------------------------------: | -----------------------------: |
| Prefisso stabile           |                               4,608 |                           0.90 |
| Trascrizione con strumenti |                               4,096 |                           0.85 |
| Trascrizione con immagini  |                               3,840 |                           0.82 |
| Trascrizione in stile MCP  |                               4,096 |                           0.85 |

I numeri di baseline osservati più di recente (da `live-cache-regression-baseline.ts`) sono risultati: prefisso stabile `cacheRead=4864`, tasso di hit `0.966`; trascrizione con strumenti `cacheRead=4608`, tasso di hit `0.896`; trascrizione con immagini `cacheRead=4864`, tasso di hit `0.954`; trascrizione in stile MCP `cacheRead=4608`, tasso di hit `0.891`.

Motivo della differenza tra le asserzioni: Anthropic espone punti di interruzione della cache espliciti e il riutilizzo progressivo della cronologia della conversazione, mentre il prefisso effettivamente riutilizzabile da OpenAI nel traffico live può raggiungere un plateau prima di includere l'intero prompt. Confrontare i due provider rispetto a un'unica soglia percentuale valida per entrambi produce false regressioni.

## Configurazione di `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # facoltativo
    includeMessages: false # valore predefinito: true
    includePrompt: false # valore predefinito: true
    includeSystem: false # valore predefinito: true
```

Valori predefiniti:

| Chiave            | Valore predefinito                           |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Variabili di ambiente (debug occasionale)

| Variabile                            | Effetto                                        |
| ------------------------------------ | ---------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Abilita il tracciamento della cache            |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Sostituisce il percorso di output              |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Attiva o disattiva l'acquisizione completa del payload dei messaggi |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Attiva o disattiva l'acquisizione del testo del prompt |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Attiva o disattiva l'acquisizione del prompt di sistema |

### Elementi da esaminare

- Gli eventi di tracciamento della cache sono in formato JSONL, con snapshot per fasi come `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- L'impatto dei token della cache per turno è visibile nelle normali superfici di utilizzo: `cacheRead` e `cacheWrite` compaiono in `/usage tokens`, `/status`, nei riepiloghi di utilizzo delle sessioni e nei layout personalizzati di `messages.usageTemplate`.
- Per Anthropic, quando la cache è attiva sono previsti sia `cacheRead` sia `cacheWrite`.
- Per OpenAI, in caso di hit della cache è previsto `cacheRead`; `cacheWrite` viene valorizzato solo nei payload dell'API Responses che lo includono (consultare [OpenAI](#openai-direct-api) sopra).
- OpenAI restituisce inoltre intestazioni di tracciamento e di limitazione della frequenza, come `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`; utilizzarle per tracciare le richieste, ma il conteggio degli hit della cache deve comunque provenire dal payload di utilizzo, non dalle intestazioni.

## Risoluzione rapida dei problemi

- **Valore elevato di `cacheWrite` nella maggior parte dei turni**: verificare la presenza di input variabili nel prompt di sistema e che il modello/provider supporti le impostazioni della cache.
- **Valore elevato di `cacheWrite` su Anthropic**: spesso indica che il punto di interruzione della cache si trova in contenuti che cambiano a ogni richiesta.
- **Valore basso di `cacheRead` su OpenAI**: verificare che il prefisso stabile si trovi all'inizio, che il prefisso ripetuto contenga almeno 1024 token e che lo stesso `prompt_cache_key` venga riutilizzato per i turni che devono condividere una cache.
- **Nessun effetto da `cacheRetention`**: verificare che la chiave del modello corrisponda a `agents.defaults.models["provider/model"]`.
- **Richieste Bedrock Nova con impostazioni della cache**: comportamento previsto; durante l'esecuzione vengono risolte senza conservazione della cache.

Documentazione correlata:

- [Anthropic](/it/providers/anthropic)
- [Utilizzo e costi dei token](/it/reference/token-use)
- [Sfoltimento delle sessioni](/it/concepts/session-pruning)
- [Riferimento per la configurazione del Gateway](/it/gateway/configuration-reference)

## Contenuti correlati

- [Utilizzo e costi dei token](/it/reference/token-use)
- [Utilizzo e costi delle API](/it/reference/api-usage-costs)
