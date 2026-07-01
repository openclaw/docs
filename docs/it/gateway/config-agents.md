---
read_when:
    - Ottimizzazione delle impostazioni predefinite degli agenti (modelli, ragionamento, area di lavoro, Heartbeat, media, Skills)
    - Configurazione del routing e delle associazioni multi-agente
    - Configurazione del comportamento della sessione, della consegna dei messaggi e della modalità conversazione
summary: Impostazioni predefinite degli agenti, instradamento multi-agente, sessione, messaggi e configurazione della conversazione
title: Configurazione — agenti
x-i18n:
    generated_at: "2026-07-01T13:04:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

Chiavi di configurazione con ambito agente in `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Per canali, strumenti, runtime del gateway e altre
chiavi di primo livello, vedere [Riferimento della configurazione](/it/gateway/configuration-reference).

## Valori predefiniti degli agenti

### `agents.defaults.workspace`

Predefinito: `OPENCLAW_WORKSPACE_DIR` quando impostata, altrimenti `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Un valore esplicito di `agents.defaults.workspace` ha la precedenza su
`OPENCLAW_WORKSPACE_DIR`. Usa la variabile d'ambiente per indirizzare gli agenti
predefiniti a un workspace montato quando non vuoi scrivere quel percorso nella configurazione.

### `agents.defaults.repoRoot`

Root del repository opzionale mostrata nella riga Runtime del prompt di sistema. Se non impostata, OpenClaw la rileva automaticamente risalendo dal workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist predefinita opzionale di Skills per gli agenti che non impostano
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Ometti `agents.defaults.skills` per Skills senza restrizioni per impostazione predefinita.
- Ometti `agents.list[].skills` per ereditare i valori predefiniti.
- Imposta `agents.list[].skills: []` per non avere Skills.
- Un elenco non vuoto `agents.list[].skills` è l'insieme finale per quell'agente; non
  viene unito ai valori predefiniti.

### `agents.defaults.skipBootstrap`

Disabilita la creazione automatica dei file di bootstrap del workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Salta la creazione di file opzionali selezionati del workspace pur continuando a scrivere i file di bootstrap richiesti. Valori validi: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

Controlla quando i file di bootstrap del workspace vengono iniettati nel prompt di sistema. Predefinito: `"always"`.

- `"continuation-skip"`: i turni di continuazione sicuri (dopo una risposta completata dell'assistente) saltano la reiniezione del bootstrap del workspace, riducendo la dimensione del prompt. Le esecuzioni Heartbeat e i nuovi tentativi post-Compaction ricostruiscono comunque il contesto.
- `"never"`: disabilita il bootstrap del workspace e l'iniezione dei file di contesto a ogni turno. Usalo solo per agenti che gestiscono completamente il proprio ciclo di vita del prompt (motori di contesto personalizzati, runtime nativi che costruiscono il proprio contesto o workflow specializzati senza bootstrap). Anche i turni di Heartbeat e di recupero da Compaction saltano l'iniezione.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Override per agente: `agents.list[].contextInjection`. I valori omessi ereditano
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Numero massimo di caratteri per file di bootstrap del workspace prima del troncamento. Predefinito: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Override per agente: `agents.list[].bootstrapMaxChars`. I valori omessi ereditano
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Numero massimo totale di caratteri iniettati tra tutti i file di bootstrap del workspace. Predefinito: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Override per agente: `agents.list[].bootstrapTotalMaxChars`. I valori omessi
ereditano `agents.defaults.bootstrapTotalMaxChars`.

### Override del profilo di bootstrap per agente

Usa gli override del profilo di bootstrap per agente quando un agente ha bisogno di un comportamento di
iniezione del prompt diverso dai valori predefiniti condivisi. I campi omessi ereditano da
`agents.defaults`.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controlla l'avviso visibile all'agente nel prompt di sistema quando il contesto di bootstrap viene troncato.
Predefinito: `"always"`.

- `"off"`: non iniettare mai testo di avviso di troncamento nel prompt di sistema.
- `"once"`: inietta un avviso conciso una volta per ogni firma di troncamento univoca.
- `"always"`: inietta un avviso conciso a ogni esecuzione quando esiste un troncamento (consigliato).

I conteggi dettagliati grezzi/iniettati e i campi di regolazione della configurazione restano nella diagnostica, come report di contesto/stato e log; il contesto utente/runtime WebChat di routine riceve solo l'avviso conciso di recupero.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mappa della proprietà dei budget di contesto

OpenClaw ha diversi budget di prompt/contesto ad alto volume, e sono
intenzionalmente suddivisi per sottosistema invece di passare tutti attraverso una singola
manopola generica.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale iniezione del bootstrap del workspace.
- `agents.defaults.startupContext.*`:
  preludio una tantum di esecuzione del modello per reset/avvio, inclusi i file
  `memory/*.md` giornalieri recenti. I comandi chat semplici `/new` e `/reset`
  confermano il reset senza invocare il modello.
- `skills.limits.*`:
  l'elenco compatto di Skills iniettato nel prompt di sistema.
- `agents.defaults.contextLimits.*`:
  estratti runtime limitati e blocchi iniettati di proprietà del runtime.
- `memory.qmd.limits.*`:
  dimensionamento degli snippet di ricerca memoria indicizzata e dell'iniezione.

Usa l'override per agente corrispondente solo quando un agente ha bisogno di un
budget diverso:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controlla il preludio di avvio del primo turno iniettato nelle esecuzioni del modello per reset/avvio.
I comandi chat semplici `/new` e `/reset` confermano il reset senza invocare
il modello, quindi non caricano questo preludio.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Valori predefiniti condivisi per superfici di contesto runtime limitate.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: limite predefinito dell'estratto `memory_get` prima che vengano aggiunti i
  metadati di troncamento e l'avviso di continuazione.
- `memoryGetDefaultLines`: finestra di righe predefinita di `memory_get` quando `lines` è
  omesso.
- `toolResultMaxChars`: limite avanzato dei risultati degli strumenti live usato per i risultati
  persistiti e il recupero da overflow. Lascialo non impostato per il limite automatico del contesto del modello:
  `16000` caratteri sotto 100K token, `32000` caratteri a 100K+ token e `64000`
  caratteri a 200K+ token. I valori espliciti fino a `1000000` sono accettati per
  modelli con contesto lungo, ma il limite effettivo resta comunque limitato a circa il 30%
  della finestra di contesto del modello. `openclaw doctor --deep` stampa il limite effettivo,
  e doctor avvisa solo quando un override esplicito è obsoleto o non ha effetto.
- `postCompactionMaxChars`: limite dell'estratto di AGENTS.md usato durante l'iniezione di aggiornamento
  post-Compaction.

#### `agents.list[].contextLimits`

Override per agente per le manopole condivise `contextLimits`. I campi omessi ereditano
da `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Limite globale per l'elenco compatto di Skills iniettato nel prompt di sistema. Questo
non influisce sulla lettura dei file `SKILL.md` su richiesta.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Override per agente per il budget del prompt delle Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Dimensione massima in pixel per il lato più lungo dell'immagine nei blocchi immagine di transcript/strumenti prima delle chiamate al provider.
Predefinito: `1200`.

Valori inferiori di solito riducono l'uso di token visivi e la dimensione del payload della richiesta per esecuzioni ricche di screenshot.
Valori superiori preservano più dettagli visivi.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferenza di compressione/dettaglio dello strumento immagini per immagini caricate da percorsi file, URL e riferimenti multimediali.
Predefinito: `auto`.

OpenClaw adatta la scala di ridimensionamento al modello di immagine selezionato. Per esempio, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL e i modelli vision Llama 4 ospitati possono usare immagini più grandi rispetto ai percorsi vision ad alto dettaglio più vecchi/predefiniti, mentre i turni multi-immagine vengono compressi più aggressivamente in modalità `auto` per controllare il costo in token e latenza.

Valori:

- `auto`: adatta ai limiti del modello e al conteggio delle immagini.
- `efficient`: preferisce immagini più piccole per ridurre l'uso di token e byte.
- `balanced`: usa la scala intermedia standard.
- `high`: preserva più dettagli per screenshot, diagrammi e immagini di documenti.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Fuso orario per il contesto del prompt di sistema (non per i timestamp dei messaggi). Ripiega sul fuso orario dell'host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato dell'ora nel prompt di sistema. Predefinito: `auto` (preferenza del sistema operativo).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - La forma stringa imposta solo il modello primario.
  - La forma oggetto imposta il primario più i modelli di ripiego ordinati.
- `imageModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dal percorso dello strumento `image` come configurazione del modello di visione.
  - Usato anche come instradamento di ripiego quando il modello selezionato/predefinito non può accettare input di immagini.
  - Preferisci riferimenti `provider/model` espliciti. Gli ID senza prefisso sono accettati per compatibilità; se un ID senza prefisso corrisponde univocamente a una voce configurata con supporto immagini in `models.providers.*.models`, OpenClaw lo qualifica con quel provider. Le corrispondenze configurate ambigue richiedono un prefisso provider esplicito.
- `imageGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione immagini e da qualsiasi superficie futura di strumento/Plugin che genera immagini.
  - Valori tipici: `google/gemini-3.1-flash-image-preview` per la generazione immagini nativa Gemini, `fal/fal-ai/flux/dev` per fal, `openai/gpt-image-2` per OpenAI Images, oppure `openai/gpt-image-1.5` per output OpenAI PNG/WebP con sfondo trasparente.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione del provider corrispondente (per esempio `GEMINI_API_KEY` o `GOOGLE_API_KEY` per `google/*`, `OPENAI_API_KEY` o OpenAI Codex OAuth per `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` per `fal/*`).
  - Se omesso, `image_generate` può comunque dedurre un provider predefinito basato su autenticazione. Prova prima il provider predefinito corrente, poi i provider di generazione immagini registrati rimanenti in ordine di ID provider.
- `musicGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione musicale e dallo strumento integrato `music_generate`.
  - Valori tipici: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Se omesso, `music_generate` può comunque dedurre un provider predefinito basato su autenticazione. Prova prima il provider predefinito corrente, poi i provider di generazione musicale registrati rimanenti in ordine di ID provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/la chiave API del provider corrispondente.
- `videoGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione video e dallo strumento integrato `video_generate`.
  - Valori tipici: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Se omesso, `video_generate` può comunque dedurre un provider predefinito basato su autenticazione. Prova prima il provider predefinito corrente, poi i provider di generazione video registrati rimanenti in ordine di ID provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/la chiave API del provider corrispondente.
  - Il Plugin ufficiale di generazione video Qwen supporta fino a 1 video di output, 1 immagine di input, 4 video di input, durata di 10 secondi e opzioni a livello di provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dallo strumento `pdf` per l'instradamento del modello.
  - Se omesso, lo strumento PDF ripiega su `imageModel`, poi sul modello risolto della sessione/predefinito.
- `pdfMaxBytesMb`: limite predefinito della dimensione PDF per lo strumento `pdf` quando `maxBytesMb` non viene passato al momento della chiamata.
- `pdfMaxPages`: numero massimo predefinito di pagine considerate dalla modalità di ripiego dell'estrazione nello strumento `pdf`.
- `verboseDefault`: livello dettagliato predefinito per gli agenti. Valori: `"off"`, `"on"`, `"full"`. Predefinito: `"off"`.
- `toolProgressDetail`: modalità di dettaglio per i riepiloghi strumenti di `/verbose` e le righe strumento nelle bozze di avanzamento. Valori: `"explain"` (predefinito, etichette umane compatte) o `"raw"` (aggiunge comando/dettaglio grezzo quando disponibile). `agents.list[].toolProgressDetail` per agente sovrascrive questo valore predefinito.
- `reasoningDefault`: visibilità predefinita del ragionamento per gli agenti. Valori: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` per agente sovrascrive questo valore predefinito. I valori predefiniti di ragionamento configurati vengono applicati solo per proprietari, mittenti autorizzati o contesti Gateway amministratore-operatore quando non è impostata alcuna sovrascrittura di ragionamento per messaggio o sessione.
- `elevatedDefault`: livello predefinito di output elevato per gli agenti. Valori: `"off"`, `"on"`, `"ask"`, `"full"`. Predefinito: `"on"`.
- `model.primary`: formato `provider/model` (ad es. `openai/gpt-5.5` per accesso tramite chiave API OpenAI o Codex OAuth). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca di provider configurato per quell'ID modello esatto, e solo dopo ripiega sul provider predefinito configurato (comportamento di compatibilità deprecato, quindi preferisci `provider/model` esplicito). Se quel provider non espone più il modello predefinito configurato, OpenClaw ripiega sul primo provider/modello configurato invece di mostrare un valore predefinito obsoleto di un provider rimosso.
- `models`: il catalogo modelli configurato e l'elenco consentiti per `/model`. Ogni voce può includere `alias` (scorciatoia) e `params` (specifici del provider, per esempio `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, instradamento OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Usa voci `provider/*` come `"openai/*": {}` o `"vllm/*": {}` per mostrare tutti i modelli rilevati per i provider selezionati senza elencare manualmente ogni ID modello.
  - Aggiungi `agentRuntime` a una voce `provider/*` quando ogni modello rilevato dinamicamente per quel provider deve usare lo stesso runtime. Il criterio runtime esatto `provider/model` prevale comunque sul carattere jolly.
  - Modifiche sicure: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci. `config set` rifiuta sostituzioni che rimuoverebbero voci esistenti dall'elenco consentiti, salvo che tu passi `--replace`.
  - I flussi di configurazione/onboarding con ambito provider uniscono i modelli del provider selezionato in questa mappa e preservano i provider non correlati già configurati.
  - Per i modelli OpenAI Responses diretti, la Compaction lato server è abilitata automaticamente. Usa `params.responsesServerCompaction: false` per interrompere l'iniezione di `context_management`, oppure `params.responsesCompactThreshold` per sovrascrivere la soglia. Vedi [Compaction lato server OpenAI](/it/providers/openai#server-side-compaction-responses-api).
- `params`: parametri provider predefiniti globali applicati a tutti i modelli. Impostati in `agents.defaults.params` (ad es. `{ cacheRetention: "long" }`).
- Precedenza di unione di `params` (configurazione): `agents.defaults.params` (base globale) viene sovrascritto da `agents.defaults.models["provider/model"].params` (per modello), poi `agents.list[].params` (ID agente corrispondente) sovrascrive per chiave. Vedi [Caching dei prompt](/it/reference/prompt-caching) per i dettagli.
- `models.providers.openrouter.params.provider`: criterio predefinito di instradamento provider per tutto OpenRouter. OpenClaw lo inoltra all'oggetto `provider` della richiesta OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` per modello e i parametri agente sovrascrivono per chiave. Vedi [Instradamento provider OpenRouter](/it/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avanzato pass-through unito ai corpi richiesta `api: "openai-completions"` per proxy compatibili con OpenAI. Se entra in conflitto con chiavi richiesta generate, il corpo extra prevale; le rotte completions non native rimuovono comunque dopo `store` specifico di OpenAI.
- `params.chat_template_kwargs`: argomenti del modello di chat compatibili con vLLM/OpenAI uniti ai corpi richiesta di primo livello `api: "openai-completions"`. Per `vllm/nemotron-3-*` con ragionamento disattivato, il Plugin vLLM incluso invia automaticamente `enable_thinking: false` e `force_nonempty_content: true`; `chat_template_kwargs` esplicito sovrascrive i valori predefiniti generati, ed `extra_body.chat_template_kwargs` ha comunque la precedenza finale. I modelli di ragionamento vLLM Qwen e Nemotron configurati espongono scelte binarie `/think` (`off`, `on`) invece della scala di sforzo multilivello.
- `compat.thinkingFormat`: stile payload di ragionamento compatibile con OpenAI. Usa `"together"` per `reasoning.enabled` in stile Together, `"qwen"` per `enable_thinking` di primo livello in stile Qwen, oppure `"qwen-chat-template"` per `chat_template_kwargs.enable_thinking` su backend della famiglia Qwen che supportano kwargs del modello di chat a livello di richiesta, come vLLM. OpenClaw mappa il ragionamento disabilitato a `false` e il ragionamento abilitato a `true`, e i modelli vLLM Qwen configurati espongono scelte binarie `/think` per questi formati.
- `compat.supportedReasoningEfforts`: elenco per modello dello sforzo di ragionamento compatibile con OpenAI. Includi `"xhigh"` per endpoint personalizzati che lo accettano davvero; OpenClaw espone quindi `/think xhigh` nei menu dei comandi, nelle righe di sessione Gateway, nella validazione patch di sessione, nella validazione CLI agente e nella validazione `llm-task` per quel provider/modello configurato. Usa `compat.reasoningEffortMap` quando il backend vuole un valore specifico del provider per un livello canonico.
- `params.preserveThinking`: adesione esplicita solo Z.AI per ragionamento preservato. Quando abilitato e il ragionamento è attivo, OpenClaw invia `thinking.clear_thinking: false` e riproduce il precedente `reasoning_content`; vedi [ragionamento e ragionamento preservato Z.AI](/it/providers/zai#thinking-and-preserved-thinking).
- `localService`: gestore di processo opzionale a livello di provider per server di modelli locali/self-hosted. Quando il modello selezionato appartiene a quel provider, OpenClaw verifica `healthUrl` (o `baseUrl + "/models"`), avvia `command` con `args` se l'endpoint non risponde, attende fino a `readyTimeoutMs`, poi invia la richiesta del modello. `command` deve essere un percorso assoluto. `idleStopMs: 0` mantiene vivo il processo finché OpenClaw non termina; un valore positivo arresta il processo generato da OpenClaw dopo quel numero di millisecondi di inattività. Vedi [Servizi modello locali](/it/gateway/local-model-services).
- Il criterio runtime appartiene ai provider o ai modelli, non ad `agents.defaults`. Usa `models.providers.<provider>.agentRuntime` per regole a livello di provider oppure `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` per regole specifiche del modello. I modelli agente OpenAI sul provider OpenAI ufficiale selezionano Codex per impostazione predefinita.
- Gli autori di configurazione che modificano questi campi (per esempio `/models set`, `/models set-image` e i comandi di aggiunta/rimozione di ripiego) salvano la forma oggetto canonica e preservano gli elenchi di ripiego esistenti quando possibile.
- `maxConcurrent`: numero massimo di esecuzioni agente parallele tra sessioni (ogni sessione resta comunque serializzata). Predefinito: 4.

### Criterio runtime

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, un id di harness Plugin registrato oppure un alias di backend CLI supportato. Il Plugin Codex incluso registra `codex`; il Plugin Anthropic incluso fornisce il backend CLI `claude-cli`.
- `id: "auto"` consente agli harness Plugin registrati di rivendicare i turni supportati e usa OpenClaw quando nessun harness corrisponde. Un runtime Plugin esplicito come `id: "codex"` richiede quell'harness e fallisce in modo chiuso se non è disponibile o non riesce.
- `id: "pi"` è accettato solo come alias deprecato per `openclaw` per preservare le configurazioni distribuite da v2026.5.22 e precedenti. La nuova configurazione dovrebbe usare `openclaw`.
- La precedenza del runtime è prima la policy del modello esatta (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` o `models.providers.<provider>.models[]`), poi `agents.list[]` / `agents.defaults.models["provider/*"]`, quindi la policy a livello di provider in `models.providers.<provider>.agentRuntime`.
- Le chiavi runtime dell'intero agente sono legacy. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, i pin runtime di sessione e `OPENCLAW_AGENT_RUNTIME` sono ignorati dalla selezione del runtime. Esegui `openclaw doctor --fix` per rimuovere i valori obsoleti.
- I modelli agente OpenAI usano l'harness Codex per impostazione predefinita; provider/model `agentRuntime.id: "codex"` resta valido quando vuoi renderlo esplicito.
- Per le distribuzioni Claude CLI, preferisci `model: "anthropic/claude-opus-4-8"` più `agentRuntime.id: "claude-cli"` con ambito modello. I riferimenti modello legacy `claude-cli/claude-opus-4-7` funzionano ancora per compatibilità, ma la nuova configurazione dovrebbe mantenere canonica la selezione provider/model e inserire il backend di esecuzione nella policy runtime provider/model.
- Questo controlla solo l'esecuzione dei turni agente testuali. Generazione media, visione, PDF, musica, video e TTS usano ancora le rispettive impostazioni provider/model.

**Abbreviazioni alias integrate** (si applicano solo quando il modello è in `agents.defaults.models`):

| Alias               | Modello                         |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

I tuoi alias configurati prevalgono sempre sui valori predefiniti.

I modelli Z.AI GLM-4.x abilitano automaticamente la modalità di ragionamento a meno che tu non imposti `--thinking off` o definisca personalmente `agents.defaults.models["zai/<model>"].params.thinking`.
I modelli Z.AI abilitano `tool_stream` per impostazione predefinita per lo streaming delle chiamate agli strumenti. Imposta `agents.defaults.models["zai/<model>"].params.tool_stream` su `false` per disabilitarlo.
Anthropic Claude Opus 4.8 mantiene il ragionamento disattivato per impostazione predefinita in OpenClaw; quando il ragionamento adattivo è abilitato esplicitamente, il valore predefinito dello sforzo gestito dal provider Anthropic è `high`. I modelli Claude 4.6 usano `adaptive` per impostazione predefinita quando non è impostato un livello di ragionamento esplicito.

### `agents.defaults.cliBackends`

Backend CLI opzionali per esecuzioni fallback solo testo (senza chiamate agli strumenti). Utili come backup quando i provider API falliscono.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- I backend CLI sono orientati prima al testo; gli strumenti sono sempre disabilitati.
- Le sessioni sono supportate quando `sessionArg` è impostato.
- Il pass-through delle immagini è supportato quando `imageArg` accetta percorsi di file.
- `reseedFromRawTranscriptWhenUncompacted: true` consente a un backend di recuperare sessioni invalidate sicure
  da una coda delimitata della trascrizione OpenClaw grezza prima che esista il
  primo riepilogo di Compaction. Le modifiche al profilo di autenticazione o all'epoca delle credenziali
  non eseguono comunque mai il reseed grezzo.

### `agents.defaults.promptOverlays`

Overlay dei prompt indipendenti dal provider applicati per famiglia di modelli sulle superfici di prompt assemblate da OpenClaw. Gli id modello della famiglia GPT-5 ricevono il contratto di comportamento condiviso tra le route OpenClaw/provider; `personality` controlla solo il livello di stile di interazione amichevole. Le route app-server native Codex mantengono le istruzioni base/modello gestite da Codex invece di questo overlay GPT-5 di OpenClaw, e OpenClaw disabilita la personalità integrata di Codex per i thread nativi.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (predefinito) e `"on"` abilitano il livello di stile di interazione amichevole.
- `"off"` disabilita solo il livello amichevole; il contratto di comportamento GPT-5 taggato resta abilitato.
- Il valore legacy `plugins.entries.openai.config.personality` viene ancora letto quando questa impostazione condivisa non è impostata.

### `agents.defaults.heartbeat`

Esecuzioni Heartbeat periodiche.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: stringa di durata (ms/s/m/h). Predefinito: `30m` (autenticazione con chiave API) o `1h` (autenticazione OAuth). Imposta su `0m` per disabilitare.
- `includeSystemPromptSection`: quando è false, omette la sezione Heartbeat dal prompt di sistema e salta l'iniezione di `HEARTBEAT.md` nel contesto di bootstrap. Predefinito: `true`.
- `suppressToolErrorWarnings`: quando è true, sopprime i payload di avviso di errore degli strumenti durante le esecuzioni heartbeat.
- `timeoutSeconds`: tempo massimo in secondi consentito per un turno agente heartbeat prima che venga interrotto. Lascia non impostato per usare `agents.defaults.timeoutSeconds` quando impostato, altrimenti la cadenza heartbeat limitata a 600 secondi.
- `directPolicy`: policy di consegna diretta/DM. `allow` (predefinito) consente la consegna a target diretti. `block` sopprime la consegna a target diretti ed emette `reason=dm-blocked`.
- `lightContext`: quando è true, le esecuzioni heartbeat usano un contesto di bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file di bootstrap del workspace.
- `isolatedSession`: quando è true, ogni heartbeat viene eseguito in una sessione nuova senza cronologia di conversazione precedente. Stesso schema di isolamento di cron `sessionTarget: "isolated"`. Riduce il costo in token per heartbeat da circa 100K a circa 2-5K token.
- `skipWhenBusy`: quando è true, le esecuzioni heartbeat vengono rinviate sulle corsie occupate aggiuntive di quell'agente: il suo subagent con chiave di sessione o lavoro di comando annidato. Le corsie Cron rinviano sempre gli heartbeat, anche senza questo flag.
- Per agente: imposta `agents.list[].heartbeat`. Quando un agente definisce `heartbeat`, **solo quegli agenti** eseguono heartbeat.
- Gli heartbeat eseguono turni agente completi: intervalli più brevi consumano più token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (riassunto a blocchi per cronologie lunghe). Vedi [Compaction](/it/concepts/compaction).
- `provider`: id di un Plugin provider di Compaction registrato. Quando impostato, viene chiamato `summarize()` del provider invece del riassunto LLM integrato. In caso di errore ripiega su quello integrato. L'impostazione di un provider forza `mode: "safeguard"`. Vedi [Compaction](/it/concepts/compaction).
- `timeoutSeconds`: numero massimo di secondi consentiti per una singola operazione di Compaction prima che OpenClaw la interrompa. Predefinito: `180`.
- `keepRecentTokens`: budget del punto di taglio dell'agente per conservare letteralmente la coda piu recente della trascrizione. `/compact` manuale lo rispetta quando e impostato esplicitamente; altrimenti la Compaction manuale e un checkpoint rigido.
- `identifierPolicy`: `strict` (predefinito), `off` o `custom`. `strict` antepone indicazioni integrate per la conservazione degli identificatori opachi durante il riassunto di Compaction.
- `identifierInstructions`: testo personalizzato opzionale per la conservazione degli identificatori usato quando `identifierPolicy=custom`.
- `qualityGuard`: controlli con nuovo tentativo in caso di output malformato per i riassunti safeguard. Abilitato per impostazione predefinita in modalita safeguard; imposta `enabled: false` per saltare l'audit.
- `midTurnPrecheck`: controllo opzionale della pressione del ciclo strumenti. Quando `enabled: true`, OpenClaw controlla la pressione del contesto dopo l'aggiunta dei risultati degli strumenti e prima della chiamata successiva al modello. Se il contesto non rientra piu nei limiti, interrompe il tentativo corrente prima di inviare il prompt e riusa il percorso di recupero del precheck esistente per troncare i risultati degli strumenti o compattare e riprovare. Funziona con entrambe le modalita di Compaction `default` e `safeguard`. Predefinito: disabilitato.
- `postCompactionSections`: nomi di sezioni H2/H3 opzionali di AGENTS.md da reiniettare dopo la Compaction. La reiniezione e disabilitata quando non e impostato o quando e impostato su `[]`. L'impostazione esplicita di `["Session Startup", "Red Lines"]` abilita quella coppia e preserva il fallback legacy `Every Session`/`Safety`. Abilitalo solo quando il contesto aggiuntivo vale il rischio di duplicare indicazioni di progetto gia catturate nel riassunto di Compaction.
- `model`: `provider/model-id` opzionale o alias semplice da `agents.defaults.models` solo per il riassunto di Compaction. Gli alias semplici vengono risolti prima dell'invio; gli ID modello letterali configurati mantengono la precedenza in caso di collisioni. Usalo quando la sessione principale deve mantenere un modello, ma i riassunti di Compaction devono essere eseguiti su un altro; quando non e impostato, la Compaction usa il modello primario della sessione.
- `maxActiveTranscriptBytes`: soglia opzionale in byte (`number` o stringhe come `"20mb"`) che attiva la normale Compaction locale prima di un'esecuzione quando il JSONL attivo supera la soglia. Richiede `truncateAfterCompaction` affinche una Compaction riuscita possa ruotare verso una trascrizione successiva piu piccola. Disabilitato quando non e impostato o e `0`.
- `notifyUser`: quando `true`, invia brevi avvisi all'utente quando la Compaction inizia e quando viene completata (ad esempio, "Compacting context..." e "Compaction complete"). Disabilitato per impostazione predefinita per mantenere silenziosa la Compaction.
- `memoryFlush`: turno agentico silenzioso prima della Compaction automatica per archiviare memorie durevoli. Imposta `model` su un provider/modello esatto come `ollama/qwen3:8b` quando questo turno di manutenzione deve restare su un modello locale; l'override non eredita la catena di fallback della sessione attiva. Saltato quando il workspace e in sola lettura.

### `agents.defaults.runRetries`

Limiti delle iterazioni di nuovo tentativo del ciclo di esecuzione esterno per il runtime dell'agente incorporato, per prevenire cicli di esecuzione infiniti durante il recupero da errori. Nota che al momento questa impostazione si applica solo al runtime dell'agente incorporato, non ai runtime ACP o CLI.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: numero base di iterazioni di nuovo tentativo dell'esecuzione per il ciclo di esecuzione esterno. Predefinito: `24`.
- `perProfile`: iterazioni aggiuntive di nuovo tentativo dell'esecuzione concesse per ciascun candidato profilo di fallback. Predefinito: `8`.
- `min`: limite assoluto minimo per le iterazioni di nuovo tentativo dell'esecuzione. Predefinito: `32`.
- `max`: limite assoluto massimo per le iterazioni di nuovo tentativo dell'esecuzione per prevenire esecuzioni fuori controllo. Predefinito: `160`.

### `agents.defaults.contextPruning`

Potatura dei **vecchi risultati degli strumenti** dal contesto in memoria prima dell'invio all'LLM. **Non** modifica la cronologia della sessione su disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` abilita i passaggi di potatura.
- `ttl` controlla con quale frequenza la potatura puo essere eseguita di nuovo (dopo l'ultimo tocco della cache).
- La potatura prima accorcia in modo leggero i risultati degli strumenti troppo grandi, poi, se necessario, svuota completamente i risultati degli strumenti piu vecchi.
- `softTrimRatio` e `hardClearRatio` accettano valori da `0.0` a `1.0`; la validazione della configurazione rifiuta valori fuori da quell'intervallo.

**Accorciamento leggero** conserva inizio + fine e inserisce `...` al centro.

**Svuotamento completo** sostituisce l'intero risultato dello strumento con il placeholder.

Note:

- I blocchi immagine non vengono mai accorciati/svuotati.
- I rapporti sono basati sui caratteri (approssimativi), non su conteggi esatti dei token.
- Se esistono meno di `keepLastAssistants` messaggi dell'assistente, la potatura viene saltata.

</Accordion>

Vedi [Potatura della sessione](/it/concepts/session-pruning) per i dettagli sul comportamento.

### Streaming a blocchi

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- I canali non Telegram richiedono `*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
- Override dei canali: `channels.<channel>.blockStreamingCoalesce` (e varianti per account). Signal/Slack/Discord/Google Chat usano per impostazione predefinita `minChars: 1500`.
- `humanDelay`: pausa casuale tra risposte a blocchi. `natural` = 800-2500 ms. Override per agente: `agents.list[].humanDelay`.

Vedi [Streaming](/it/concepts/streaming) per i dettagli su comportamento e suddivisione in blocchi.

### Indicatori di digitazione

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Predefiniti: `instant` per chat dirette/menzioni, `message` per chat di gruppo senza menzione.
- Override per sessione: `session.typingMode`, `session.typingIntervalSeconds`.

Vedi [Indicatori di digitazione](/it/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandbox opzionale per l'agente incorporato. Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox details">

**Backend:**

- `docker`: runtime Docker locale (predefinito)
- `ssh`: runtime remoto generico basato su SSH
- `openshell`: runtime OpenShell

Quando viene selezionato `backend: "openshell"`, le impostazioni specifiche del runtime si spostano in
`plugins.entries.openshell.config`.

**Configurazione del backend SSH:**

- `target`: destinazione SSH nel formato `user@host[:port]`
- `command`: comando client SSH (predefinito: `ssh`)
- `workspaceRoot`: radice remota assoluta usata per i workspace per ambito
- `identityFile` / `certificateFile` / `knownHostsFile`: file locali esistenti passati a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenuti inline o SecretRefs che OpenClaw materializza in file temporanei a runtime
- `strictHostKeyChecking` / `updateHostKeys`: manopole della policy delle chiavi host OpenSSH

**Precedenza dell'autenticazione SSH:**

- `identityData` prevale su `identityFile`
- `certificateData` prevale su `certificateFile`
- `knownHostsData` prevale su `knownHostsFile`
- I valori `*Data` basati su SecretRef vengono risolti dallo snapshot attivo del runtime dei segreti prima dell'avvio della sessione sandbox

**Comportamento del backend SSH:**

- inizializza il workspace remoto una volta dopo la creazione o la ricreazione
- poi mantiene canonico il workspace SSH remoto
- instrada `exec`, gli strumenti file e i percorsi multimediali tramite SSH
- non sincronizza automaticamente le modifiche remote verso l'host
- non supporta container browser sandbox

**Accesso al workspace:**

- `none`: workspace sandbox per ambito sotto `~/.openclaw/sandboxes`
- `ro`: workspace sandbox in `/workspace`, workspace dell'agente montato in sola lettura in `/agent`
- `rw`: workspace dell'agente montato in lettura/scrittura in `/workspace`

**Ambito:**

- `session`: container + workspace per sessione
- `agent`: un container + workspace per agente (predefinito)
- `shared`: container e workspace condivisi (nessun isolamento tra sessioni)

**Configurazione del Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opzionale
          gatewayEndpoint: "https://lab.example", // opzionale
          policy: "strict", // id policy OpenShell opzionale
          providers: ["openai"], // opzionale
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modalità OpenShell:**

- `mirror`: inizializza il remoto dal locale prima dell'esecuzione, sincronizza di nuovo dopo l'esecuzione; il workspace locale resta canonico
- `remote`: inizializza il remoto una volta quando viene creata la sandbox, poi mantiene canonico il workspace remoto

In modalità `remote`, le modifiche host-locali fatte fuori da OpenClaw non vengono sincronizzate automaticamente nella sandbox dopo il passaggio di inizializzazione.
Il trasporto è SSH nella sandbox OpenShell, ma il Plugin possiede il ciclo di vita della sandbox e la sincronizzazione mirror opzionale.

**`setupCommand`** viene eseguito una volta dopo la creazione del container (tramite `sh -lc`). Richiede uscita di rete, root scrivibile, utente root.

**I container hanno come impostazione predefinita `network: "none"`** — imposta `"bridge"` (o una rete bridge personalizzata) se l'agent necessita di accesso in uscita.
`"host"` è bloccato. `"container:<id>"` è bloccato per impostazione predefinita, a meno che non imposti esplicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).
I turni dell'app-server Codex in una sandbox OpenClaw attiva usano questa stessa impostazione di uscita per il loro accesso di rete nativo in modalità codice.

**Gli allegati in ingresso** vengono preparati in `media/inbound/*` nel workspace attivo.

**`docker.binds`** monta directory host aggiuntive; i bind globali e per-agent vengono uniti.

**Browser in sandbox** (`sandbox.browser.enabled`): Chromium + CDP in un container. URL noVNC iniettato nel prompt di sistema. Non richiede `browser.enabled` in `openclaw.json`.
L'accesso osservatore noVNC usa l'autenticazione VNC per impostazione predefinita e OpenClaw emette un URL token di breve durata (invece di esporre la password nell'URL condiviso).

- `allowHostControl: false` (predefinito) impedisce alle sessioni in sandbox di prendere di mira il browser host.
- `network` è predefinito a `openclaw-sandbox-browser` (rete bridge dedicata). Imposta `bridge` solo quando vuoi esplicitamente connettività bridge globale.
- `cdpSourceRange` limita opzionalmente l'ingresso CDP al bordo del container a un intervallo CIDR (per esempio `172.21.0.1/32`).
- `sandbox.browser.binds` monta directory host aggiuntive solo nel container del browser in sandbox. Quando impostato (incluso `[]`), sostituisce `docker.binds` per il container del browser.
- I valori predefiniti di avvio sono definiti in `scripts/sandbox-browser-entrypoint.sh` e ottimizzati per host container:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (abilitato per impostazione predefinita)
  - `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu` sono
    abilitati per impostazione predefinita e possono essere disabilitati con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se l'uso di WebGL/3D lo richiede.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` riabilita le estensioni se il tuo workflow
    dipende da esse.
  - `--renderer-process-limit=2` può essere modificato con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; imposta `0` per usare il limite
    di processi predefinito di Chromium.
  - più `--no-sandbox` quando `noSandbox` è abilitato.
  - I valori predefiniti sono la baseline dell'immagine container; usa un'immagine browser personalizzata con un
    entrypoint personalizzato per modificare i valori predefiniti del container.

</Accordion>

Il sandboxing del browser e `sandbox.docker.binds` sono solo Docker.

Crea immagini (da un checkout sorgente):

```bash
scripts/sandbox-setup.sh           # immagine sandbox principale
scripts/sandbox-browser-setup.sh   # immagine browser opzionale
```

Per installazioni npm senza un checkout sorgente, consulta [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup) per comandi `docker build` inline.

### `agents.list` (override per-agent)

Usa `agents.list[].tts` per assegnare a un agent il proprio provider TTS, voce, modello,
stile o modalità auto-TTS. Il blocco dell'agent fa un deep-merge sopra
`messages.tts`, così le credenziali condivise possono restare in un unico punto mentre i singoli
agent sovrascrivono solo i campi voce o provider di cui hanno bisogno. L'override dell'agent attivo
si applica alle risposte vocali automatiche, a `/tts audio`, `/tts status` e
allo strumento agent `tts`. Consulta [Sintesi vocale](/it/tools/tts#per-agent-voice-overrides)
per esempi di provider e precedenza.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // override del livello di thinking per-agent
        reasoningDefault: "on", // override della visibilità del reasoning per-agent
        fastModeDefault: false, // override della modalità rapida per-agent
        params: { cacheRetention: "none" }, // sovrascrive i parametri defaults.models corrispondenti per chiave
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // sostituisce agents.defaults.skills quando impostato
        identity: {
          name: "Samantha",
          theme: "bradipo disponibile",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: id agent stabile (obbligatorio).
- `default`: quando ne sono impostati più di uno, vince il primo (warning registrato). Se nessuno è impostato, la prima voce dell'elenco è predefinita.
- `model`: la forma stringa imposta una primary per-agent rigorosa senza fallback di modello; anche la forma oggetto `{ primary }` è rigorosa a meno che tu non aggiunga `fallbacks`. Usa `{ primary, fallbacks: [...] }` per abilitare il fallback per quell'agent, oppure `{ primary, fallbacks: [] }` per rendere esplicito il comportamento rigoroso. I job Cron che sovrascrivono solo `primary` ereditano comunque i fallback predefiniti a meno che non imposti `fallbacks: []`.
- `params`: parametri stream per-agent uniti sopra la voce modello selezionata in `agents.defaults.models`. Usalo per override specifici dell'agent come `cacheRetention`, `temperature` o `maxTokens` senza duplicare l'intero catalogo modelli.
- `tts`: override text-to-speech opzionali per-agent. Il blocco fa un deep-merge sopra `messages.tts`, quindi mantieni credenziali provider condivise e policy di fallback in `messages.tts` e imposta qui solo valori specifici della persona, come provider, voce, modello, stile o modalità automatica.
- `skills`: allowlist skill opzionale per-agent. Se omessa, l'agent eredita `agents.defaults.skills` quando impostato; un elenco esplicito sostituisce i valori predefiniti invece di unirli, e `[]` significa nessuna skill.
- `thinkingDefault`: livello di thinking predefinito opzionale per-agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sovrascrive `agents.defaults.thinkingDefault` per questo agent quando non è impostato alcun override per messaggio o sessione. Il profilo provider/modello selezionato controlla quali valori sono validi; per Google Gemini, `adaptive` mantiene il thinking dinamico posseduto dal provider (`thinkingLevel` omesso su Gemini 3/3.1, `thinkingBudget: -1` su Gemini 2.5).
- `reasoningDefault`: visibilità del reasoning predefinita opzionale per-agent (`on | off | stream`). Sovrascrive `agents.defaults.reasoningDefault` per questo agent quando non è impostato alcun override di reasoning per messaggio o sessione.
- `fastModeDefault`: valore predefinito opzionale per-agent per la modalità rapida (`"auto" | true | false`). Si applica quando non è impostato alcun override della modalità rapida per messaggio o sessione.
- `models`: override opzionali del catalogo modelli/runtime per-agent indicizzati da id completi `provider/model`. Usa `models["provider/model"].agentRuntime` per eccezioni runtime per-agent.
- `runtime`: descrittore runtime opzionale per-agent. Usa `type: "acp"` con i valori predefiniti `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando l'agent deve usare per impostazione predefinita sessioni harness ACP.
- `identity.avatar`: percorso relativo al workspace, URL `http(s)` o URI `data:`.
- I file immagine locali relativi al workspace `identity.avatar` sono limitati a 2 MB. Gli URL `http(s)` e gli URI `data:` non vengono controllati con il limite di dimensione file locale.
- `identity` deriva valori predefiniti: `ackReaction` da `emoji`, `mentionPatterns` da `name`/`emoji`.
- `subagents.allowAgents`: allowlist di id agent configurati per target espliciti `sessions_spawn.agentId` (`["*"]` = qualsiasi target configurato; predefinito: solo lo stesso agent). Includi l'id del richiedente quando devono essere consentite chiamate `agentId` che puntano a sé stesse. Le voci obsolete la cui configurazione agent è stata eliminata vengono rifiutate da `sessions_spawn` e omesse da `agents_list`; esegui `openclaw doctor --fix` per ripulirle, oppure aggiungi una voce minima `agents.list[]` se quel target deve restare avviabile ereditando i valori predefiniti.
- Guardia di ereditarietà sandbox: se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta target che verrebbero eseguiti senza sandbox.
- `subagents.requireAgentId`: quando true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo; predefinito: false).

---

## Routing multi-agent

Esegui più agent isolati dentro un solo Gateway. Consulta [Multi-Agent](/it/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Campi di corrispondenza binding

- `type` (opzionale): `route` per il routing normale (il tipo mancante è predefinito a route), `acp` per binding di conversazioni ACP persistenti.
- `match.channel` (obbligatorio)
- `match.accountId` (opzionale; `*` = qualsiasi account; omesso = account predefinito)
- `match.peer` (opzionale; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opzionale; specifico del canale)
- `acp` (opzionale; solo per `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordine di corrispondenza deterministico:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (esatto, nessun peer/guild/team)
5. `match.accountId: "*"` (a livello di canale)
6. Agent predefinito

Dentro ciascun livello, vince la prima voce `bindings` corrispondente.

Per le voci `type: "acp"`, OpenClaw risolve per identità conversazione esatta (`match.channel` + account + `match.peer.id`) e non usa l'ordine dei livelli di binding route sopra.

### Profili di accesso per-agent

<Accordion title="Accesso completo (nessuna sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Strumenti in sola lettura + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Nessun accesso al filesystem (solo messaggistica)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Vedi [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) per i dettagli sulla precedenza.

---

## Sessione

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (default) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Dettagli dei campi della sessione">

- **`scope`**: strategia di raggruppamento di base delle sessioni per i contesti di chat di gruppo.
  - `per-sender` (predefinito): ogni mittente ottiene una sessione isolata all'interno di un contesto di canale.
  - `global`: tutti i partecipanti in un contesto di canale condividono una singola sessione (da usare solo quando è previsto un contesto condiviso).
- **`dmScope`**: come vengono raggruppati i DM.
  - `main`: tutti i DM condividono la sessione principale.
  - `per-peer`: isola per ID del mittente tra i canali.
  - `per-channel-peer`: isola per canale + mittente (consigliato per caselle di posta multiutente).
  - `per-account-channel-peer`: isola per account + canale + mittente (consigliato per multi-account).
- **`identityLinks`**: mappa gli ID canonici ai peer con prefisso del provider per la condivisione della sessione tra canali. I comandi dock come `/dock_discord` usano la stessa mappa per spostare il percorso di risposta della sessione attiva a un altro peer di canale collegato; vedi [Docking dei canali](/it/concepts/channel-docking).
- **`reset`**: criterio di reimpostazione principale. `daily` reimposta all'ora locale `atHour`; `idle` reimposta dopo `idleMinutes`. Quando entrambi sono configurati, vince quello che scade per primo. La freschezza della reimpostazione giornaliera usa `sessionStartedAt` della riga di sessione; la freschezza della reimpostazione per inattività usa `lastInteractionAt`. Le scritture in background/eventi di sistema come Heartbeat, risvegli Cron, notifiche exec e contabilità del Gateway possono aggiornare `updatedAt`, ma non mantengono fresche le sessioni giornaliere/per inattività.
- **`resetByType`**: override per tipo (`direct`, `group`, `thread`). `dm` legacy accettato come alias di `direct`.
- **`mainKey`**: campo legacy. Il runtime usa sempre `"main"` per il bucket principale delle chat dirette.
- **`agentToAgent.maxPingPongTurns`**: numero massimo di turni di risposta tra agenti durante gli scambi agente-agente (intero, intervallo: `0`-`20`, predefinito: `5`). `0` disabilita il concatenamento ping-pong.
- **`sendPolicy`**: corrispondenza per `channel`, `chatType` (`direct|group|channel`, con alias legacy `dm`), `keyPrefix` o `rawKeyPrefix`. La prima negazione vince.
- **`maintenance`**: controlli di pulizia e conservazione dell'archivio sessioni.
  - `mode`: `enforce` applica la pulizia ed è il valore predefinito; `warn` emette solo avvisi.
  - `pruneAfter`: soglia di età per voci obsolete (predefinito `30d`).
  - `maxEntries`: numero massimo di voci in `sessions.json` (predefinito `500`). Il runtime scrive la pulizia batch con un piccolo buffer high-water per limiti di dimensioni produttive; `openclaw sessions cleanup --enforce` applica immediatamente il limite.
  - Le sessioni probe di breve durata per esecuzioni modello del Gateway usano una conservazione fissa di `24h`, ma la pulizia è regolata dalla pressione: rimuove le righe probe obsolete di esecuzione modello strict solo quando viene raggiunta la pressione di manutenzione/limite delle voci di sessione. Sono idonee solo le chiavi probe esplicite strict che corrispondono a `agent:*:explicit:model-run-<uuid>`; le normali sessioni dirette, di gruppo, di thread, Cron, hook, Heartbeat, ACP e sottoagente non ereditano questa conservazione di 24 ore. Quando la pulizia delle esecuzioni modello viene eseguita, avviene prima della più ampia pulizia delle voci obsolete `pruneAfter` e del limite `maxEntries`.
  - `rotateBytes`: deprecato e ignorato; `openclaw doctor --fix` lo rimuove dalle configurazioni più vecchie.
  - `resetArchiveRetention`: conservazione per gli archivi di trascrizione `*.reset.<timestamp>`. Valore predefinito uguale a `pruneAfter`; imposta `false` per disabilitare.
  - `maxDiskBytes`: budget disco opzionale della directory delle sessioni. In modalità `warn` registra avvisi; in modalità `enforce` rimuove prima artefatti/sessioni più vecchi.
  - `highWaterBytes`: obiettivo opzionale dopo la pulizia del budget. Valore predefinito pari all'`80%` di `maxDiskBytes`.
- **`threadBindings`**: valori predefiniti globali per le funzionalità di sessione vincolate ai thread.
  - `enabled`: interruttore predefinito principale (i provider possono sovrascriverlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus predefinito per inattività in ore (`0` disabilita; i provider possono sovrascrivere)
  - `maxAgeHours`: età massima rigida predefinita in ore (`0` disabilita; i provider possono sovrascrivere)
  - `spawnSessions`: gate predefinito per creare sessioni di lavoro vincolate ai thread da `sessions_spawn` e spawn di thread ACP. Il valore predefinito è `true` quando i binding dei thread sono abilitati; provider/account possono sovrascriverlo.
  - `defaultSpawnContext`: contesto nativo predefinito del sottoagente per spawn vincolati ai thread (`"fork"` o `"isolated"`). Valore predefinito: `"fork"`.

</Accordion>

---

## Messaggi

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefisso di risposta

Override per canale/account: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Risoluzione (vince il più specifico): account → canale → globale. `""` disabilita e interrompe la cascata. `"auto"` deriva `[{identity.name}]`.

**Variabili del template:**

| Variabile         | Descrizione              | Esempio                     |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | Nome breve del modello   | `claude-opus-4-6`           |
| `{modelFull}`     | Identificatore completo del modello | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome del provider        | `anthropic`                 |
| `{thinkingLevel}` | Livello di ragionamento corrente | `high`, `low`, `off`        |
| `{identity.name}` | Nome dell'identità dell'agente | (uguale a `"auto"`)         |

Le variabili non fanno distinzione tra maiuscole e minuscole. `{think}` è un alias di `{thinkingLevel}`.

### Reazione di conferma

- Valore predefinito: `identity.emoji` dell'agente attivo, altrimenti `"👀"`. Imposta `""` per disabilitare.
- Override per canale: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordine di risoluzione: account → canale → `messages.ackReaction` → fallback dell'identità.
- Ambito: `group-mentions` (predefinito), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: rimuove la conferma dopo la risposta sui canali che supportano le reazioni, come Slack, Discord, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: abilita le reazioni di stato del ciclo di vita su Slack, Discord, Telegram e WhatsApp.
  Su Slack e Discord, se non impostato, mantiene abilitate le reazioni di stato quando le reazioni di conferma sono attive.
  Su Telegram e WhatsApp, impostalo esplicitamente su `true` per abilitare le reazioni di stato del ciclo di vita.
- `messages.statusReactions.emojis`: sovrascrive le chiavi emoji del ciclo di vita:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` e `stallHard`.
  Telegram consente solo un insieme fisso di reazioni, quindi le emoji configurate non supportate ricadono
  sulla variante di stato supportata più vicina per quella chat.

### Debounce in ingresso

Raggruppa messaggi rapidi di solo testo dallo stesso mittente in un unico turno dell'agente. Media/allegati vengono inviati immediatamente. I comandi di controllo bypassano il debounce.

### TTS (sintesi vocale)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` controlla la modalità auto-TTS predefinita: `off`, `always`, `inbound` o `tagged`. `/tts on|off` può sovrascrivere le preferenze locali e `/tts status` mostra lo stato effettivo.
- `summaryModel` sovrascrive `agents.defaults.model.primary` per il riepilogo automatico.
- `modelOverrides` è abilitato per impostazione predefinita; `modelOverrides.allowProvider` ha valore predefinito `false` (opt-in).
- Le chiavi API usano come fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- I provider vocali inclusi sono di proprietà del plugin. Se `plugins.allow` è impostato, includi ogni plugin provider TTS che vuoi usare, ad esempio `microsoft` per Edge TTS. L'id provider legacy `edge` è accettato come alias di `microsoft`.
- `providers.openai.baseUrl` sovrascrive l'endpoint TTS di OpenAI. L'ordine di risoluzione è configurazione, poi `OPENAI_TTS_BASE_URL`, poi `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` punta a un endpoint non OpenAI, OpenClaw lo considera un server TTS compatibile con OpenAI e allenta la validazione di modello/voce.

---

## Conversazione

Valori predefiniti per la modalità Conversazione (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` deve corrispondere a una chiave in `talk.providers` quando sono configurati più provider Talk.
- Le chiavi Talk piatte legacy (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) servono solo per compatibilità. Esegui `openclaw doctor --fix` per riscrivere la configurazione persistente in `talk.providers.<provider>`.
- Gli ID voce usano come fallback `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` accetta stringhe in chiaro o oggetti SecretRef.
- Il fallback `ELEVENLABS_API_KEY` si applica solo quando non è configurata alcuna chiave API Talk.
- `providers.*.voiceAliases` consente alle direttive Talk di usare nomi descrittivi.
- `providers.mlx.modelId` seleziona il repository Hugging Face usato dall'helper MLX locale di macOS. Se omesso, macOS usa `mlx-community/Soprano-80M-bf16`.
- La riproduzione MLX su macOS passa dall'helper incluso `openclaw-mlx-tts` quando presente, oppure da un eseguibile su `PATH`; `OPENCLAW_MLX_TTS_BIN` sovrascrive il percorso dell'helper per lo sviluppo.
- `consultThinkingLevel` controlla il livello di ragionamento per l'esecuzione completa dell'agente OpenClaw dietro le chiamate `openclaw_agent_consult` realtime Talk della Control UI. Lascialo non impostato per preservare il normale comportamento della sessione/modello.
- `consultFastMode` imposta una sovrascrittura fast-mode una tantum per le consultazioni realtime Talk della Control UI senza modificare la normale impostazione fast-mode della sessione.
- `speechLocale` imposta l'id locale BCP 47 usato dal riconoscimento vocale Talk di iOS/macOS. Lascialo non impostato per usare il valore predefinito del dispositivo.
- `silenceTimeoutMs` controlla per quanto tempo la modalità Talk attende dopo il silenzio dell'utente prima di inviare la trascrizione. Se non impostato, mantiene la finestra di pausa predefinita della piattaforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` aggiunge istruzioni di sistema rivolte al provider al prompt realtime integrato di OpenClaw, così lo stile vocale può essere configurato senza perdere le indicazioni predefinite di `openclaw_agent_consult`.
- `realtime.consultRouting` controlla il fallback del relay Gateway quando il provider realtime produce una trascrizione utente finale senza `openclaw_agent_consult`: `provider-direct` preserva le risposte dirette del provider, mentre `force-agent-consult` instrada la richiesta finalizzata tramite OpenClaw.

---

## Correlati

- [Riferimento di configurazione](/it/gateway/configuration-reference) — tutte le altre chiavi di configurazione
- [Configurazione](/it/gateway/configuration) — attività comuni e configurazione rapida
- [Esempi di configurazione](/it/gateway/configuration-examples)
