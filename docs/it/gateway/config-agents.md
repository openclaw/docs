---
read_when:
    - Ottimizzare i valori predefiniti degli agenti (modelli, ragionamento, workspace, Heartbeat, media, Skills)
    - Configurazione di instradamento e associazioni multi-agente
    - Regolazione del comportamento di sessione, recapito dei messaggi e modalità di conversazione
summary: Valori predefiniti degli agenti, instradamento multi-agente, sessione, messaggi e configurazione della conversazione
title: Configurazione — agenti
x-i18n:
    generated_at: "2026-06-27T17:30:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

Configurazione delle chiavi con ambito agente sotto `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Per canali, strumenti, runtime del Gateway e altre
chiavi di primo livello, consulta [Riferimento configurazione](/it/gateway/configuration-reference).

## Impostazioni predefinite degli agenti

### `agents.defaults.workspace`

Predefinito: `OPENCLAW_WORKSPACE_DIR` quando impostata, altrimenti `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Un valore esplicito di `agents.defaults.workspace` ha precedenza su
`OPENCLAW_WORKSPACE_DIR`. Usa la variabile d'ambiente per puntare gli agenti predefiniti
a un workspace montato quando non vuoi scrivere quel percorso nella configurazione.

### `agents.defaults.repoRoot`

Root del repository opzionale mostrata nella riga Runtime del prompt di sistema. Se non impostata, OpenClaw la rileva automaticamente risalendo dal workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist predefinita opzionale di skill per gli agenti che non impostano
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // eredita github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce i valori predefiniti
      { id: "locked-down", skills: [] }, // nessuna skill
    ],
  },
}
```

- Ometti `agents.defaults.skills` per avere skill senza restrizioni per impostazione predefinita.
- Ometti `agents.list[].skills` per ereditare i valori predefiniti.
- Imposta `agents.list[].skills: []` per nessuna skill.
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

Salta la creazione dei file opzionali selezionati del workspace continuando a scrivere i file di bootstrap richiesti. Valori validi: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

- `"continuation-skip"`: i turni di continuazione sicuri (dopo una risposta completata dell'assistente) saltano la reiniezione del bootstrap del workspace, riducendo la dimensione del prompt. Le esecuzioni Heartbeat e i tentativi successivi alla Compaction ricostruiscono comunque il contesto.
- `"never"`: disabilita il bootstrap del workspace e l'iniezione dei file di contesto a ogni turno. Usalo solo per agenti che possiedono completamente il ciclo di vita del proprio prompt (motori di contesto personalizzati, runtime nativi che costruiscono il proprio contesto o workflow specializzati senza bootstrap). Anche i turni Heartbeat e di recupero dalla Compaction saltano l'iniezione.

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

Usa gli override del profilo di bootstrap per agente quando un agente richiede un comportamento
di iniezione del prompt diverso dai valori predefiniti condivisi. I campi omessi ereditano da
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

- `"off"`: non iniettare mai il testo dell'avviso di troncamento nel prompt di sistema.
- `"once"`: inietta un avviso conciso una volta per ogni firma di troncamento univoca.
- `"always"`: inietta un avviso conciso a ogni esecuzione quando esiste un troncamento (consigliato).

I conteggi dettagliati grezzi/iniettati e i campi di ottimizzazione della configurazione restano nella diagnostica, come
report di contesto/stato e log; il contesto utente/runtime ordinario di WebChat riceve solo
l'avviso conciso di recupero.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mappa di proprietà dei budget di contesto

OpenClaw ha più budget di prompt/contesto ad alto volume, e sono
intenzionalmente suddivisi per sottosistema invece di passare tutti attraverso una sola
manopola generica.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale iniezione del bootstrap del workspace.
- `agents.defaults.startupContext.*`:
  preambolo una tantum di reset/avvio dell'esecuzione del modello, inclusi i file
  `memory/*.md` giornalieri recenti. I comandi di chat semplici `/new` e `/reset`
  vengono confermati senza invocare il modello.
- `skills.limits.*`:
  l'elenco compatto delle skill iniettato nel prompt di sistema.
- `agents.defaults.contextLimits.*`:
  estratti runtime limitati e blocchi iniettati di proprietà del runtime.
- `memory.qmd.limits.*`:
  dimensionamento dello snippet di ricerca in memoria indicizzata e dell'iniezione.

Usa l'override per agente corrispondente solo quando un agente richiede un
budget diverso:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controlla il preambolo di avvio del primo turno iniettato nelle esecuzioni del modello di reset/avvio.
I comandi di chat semplici `/new` e `/reset` confermano il reset senza invocare
il modello, quindi non caricano questo preambolo.

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

Valori predefiniti condivisi per le superfici di contesto runtime limitate.

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

- `memoryGetMaxChars`: limite predefinito dell'estratto `memory_get` prima che vengano aggiunti
  i metadati di troncamento e l'avviso di continuazione.
- `memoryGetDefaultLines`: finestra di righe predefinita di `memory_get` quando `lines` è
  omesso.
- `toolResultMaxChars`: limite avanzato per i risultati degli strumenti live usato per i risultati
  persistiti e il recupero da overflow. Lascialo non impostato per il limite automatico del contesto del modello:
  `16000` caratteri sotto 100K token, `32000` caratteri a 100K+ token e `64000`
  caratteri a 200K+ token. Valori espliciti fino a `1000000` sono accettati per
  modelli a contesto lungo, ma il limite effettivo resta comunque limitato a circa il 30% della
  finestra di contesto del modello. `openclaw doctor --deep` stampa il limite effettivo,
  e doctor avvisa solo quando un override esplicito è obsoleto o non ha effetto.
- `postCompactionMaxChars`: limite dell'estratto di AGENTS.md usato durante l'iniezione
  di aggiornamento post-Compaction.

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
          toolResultMaxChars: 8000, // limite avanzato per questo agente
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Limite globale per l'elenco compatto delle skill iniettato nel prompt di sistema. Questo
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

Override per agente per il budget del prompt delle skill.

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

Dimensione massima in pixel del lato più lungo dell'immagine nei blocchi immagine di transcript/strumenti prima delle chiamate al provider.
Predefinito: `1200`.

Valori più bassi di solito riducono l'uso di token di visione e la dimensione del payload della richiesta per esecuzioni ricche di screenshot.
Valori più alti preservano più dettagli visivi.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferenza di compressione/dettaglio dello strumento immagine per immagini caricate da percorsi file, URL e riferimenti multimediali.
Predefinito: `auto`.

OpenClaw adatta la scala di ridimensionamento al modello immagine selezionato. Per esempio, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL e i modelli di visione Llama 4 ospitati possono usare immagini più grandi rispetto ai percorsi di visione ad alto dettaglio più vecchi/predefiniti, mentre i turni con più immagini vengono compressi più aggressivamente in modalità `auto` per controllare costo in token e latenza.

Valori:

- `auto`: adatta ai limiti del modello e al numero di immagini.
- `efficient`: preferisce immagini più piccole per un minore uso di token e byte.
- `balanced`: usa la scala standard intermedia.
- `high`: preserva più dettaglio per screenshot, diagrammi e immagini di documenti.

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
      params: { cacheRetention: "long" }, // parametri provider predefiniti globali
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
  - La forma oggetto imposta il primario più i modelli di failover ordinati.
- `imageModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dal percorso dello strumento `image` come configurazione del modello di visione.
  - Usato anche come routing di fallback quando il modello selezionato/predefinito non può accettare input di immagini.
  - Preferisci riferimenti espliciti `provider/model`. Gli ID semplici sono accettati per compatibilità; se un ID semplice corrisponde in modo univoco a una voce configurata con supporto immagini in `models.providers.*.models`, OpenClaw lo qualifica con quel provider. Le corrispondenze configurate ambigue richiedono un prefisso provider esplicito.
- `imageGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione immagini e da qualsiasi futura superficie di strumento/Plugin che genera immagini.
  - Valori tipici: `google/gemini-3.1-flash-image-preview` per la generazione immagini nativa di Gemini, `fal/fal-ai/flux/dev` per fal, `openai/gpt-image-2` per OpenAI Images oppure `openai/gpt-image-1.5` per output PNG/WebP OpenAI con sfondo trasparente.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione del provider corrispondente (per esempio `GEMINI_API_KEY` o `GOOGLE_API_KEY` per `google/*`, `OPENAI_API_KEY` o OpenAI Codex OAuth per `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` per `fal/*`).
  - Se omesso, `image_generate` può comunque inferire un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione immagini registrati in ordine di ID provider.
- `musicGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione musicale e dallo strumento integrato `music_generate`.
  - Valori tipici: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oppure `minimax/music-2.6`.
  - Se omesso, `music_generate` può comunque inferire un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione musicale registrati in ordine di ID provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/chiave API del provider corrispondente.
- `videoGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione video e dallo strumento integrato `video_generate`.
  - Valori tipici: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oppure `qwen/wan2.7-r2v`.
  - Se omesso, `video_generate` può comunque inferire un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione video registrati in ordine di ID provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/chiave API del provider corrispondente.
  - Il Plugin ufficiale di generazione video Qwen supporta fino a 1 video di output, 1 immagine di input, 4 video di input, durata di 10 secondi e opzioni a livello di provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dallo strumento `pdf` per il routing del modello.
  - Se omesso, lo strumento PDF esegue il fallback a `imageModel`, poi al modello risolto di sessione/predefinito.
- `pdfMaxBytesMb`: limite di dimensione PDF predefinito per lo strumento `pdf` quando `maxBytesMb` non viene passato al momento della chiamata.
- `pdfMaxPages`: numero massimo predefinito di pagine considerate dalla modalità di fallback di estrazione nello strumento `pdf`.
- `verboseDefault`: livello verbose predefinito per gli agenti. Valori: `"off"`, `"on"`, `"full"`. Predefinito: `"off"`.
- `toolProgressDetail`: modalità di dettaglio per i riepiloghi degli strumenti `/verbose` e le righe strumento delle bozze di avanzamento. Valori: `"explain"` (predefinito, etichette umane compatte) oppure `"raw"` (aggiunge comando/dettaglio grezzo quando disponibile). `agents.list[].toolProgressDetail` per agente sovrascrive questo valore predefinito.
- `reasoningDefault`: visibilità del ragionamento predefinita per gli agenti. Valori: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` per agente sovrascrive questo valore predefinito. I valori predefiniti di ragionamento configurati vengono applicati solo per proprietari, mittenti autorizzati o contesti Gateway operator-admin quando non è impostata alcuna sovrascrittura del ragionamento per messaggio o sessione.
- `elevatedDefault`: livello predefinito di output elevato per gli agenti. Valori: `"off"`, `"on"`, `"ask"`, `"full"`. Predefinito: `"on"`.
- `model.primary`: formato `provider/model` (ad es. `openai/gpt-5.5` per chiave API OpenAI o accesso Codex OAuth). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca tra provider configurati per quell'esatto ID modello, e solo dopo esegue il fallback al provider predefinito configurato (comportamento di compatibilità deprecato, quindi preferisci `provider/model` esplicito). Se quel provider non espone più il modello predefinito configurato, OpenClaw esegue il fallback al primo provider/modello configurato invece di mostrare un valore predefinito obsoleto di un provider rimosso.
- `models`: il catalogo modelli configurato e allowlist per `/model`. Ogni voce può includere `alias` (scorciatoia) e `params` (specifici del provider, per esempio `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, routing OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Usa voci `provider/*` come `"openai/*": {}` o `"vllm/*": {}` per mostrare tutti i modelli rilevati per i provider selezionati senza elencare manualmente ogni ID modello.
  - Aggiungi `agentRuntime` a una voce `provider/*` quando ogni modello rilevato dinamicamente per quel provider deve usare lo stesso runtime. La policy di runtime esatta `provider/model` ha comunque precedenza sul wildcard.
  - Modifiche sicure: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci. `config set` rifiuta sostituzioni che rimuoverebbero voci allowlist esistenti a meno che tu non passi `--replace`.
  - I flussi di configurazione/onboarding con ambito provider uniscono i modelli del provider selezionato in questa mappa e preservano i provider non correlati già configurati.
  - Per i modelli OpenAI Responses diretti, la Compaction lato server è abilitata automaticamente. Usa `params.responsesServerCompaction: false` per interrompere l'iniezione di `context_management`, oppure `params.responsesCompactThreshold` per sovrascrivere la soglia. Consulta [Compaction lato server OpenAI](/it/providers/openai#server-side-compaction-responses-api).
- `params`: parametri globali predefiniti del provider applicati a tutti i modelli. Impostati in `agents.defaults.params` (ad es. `{ cacheRetention: "long" }`).
- Precedenza di merge di `params` (configurazione): `agents.defaults.params` (base globale) viene sovrascritto da `agents.defaults.models["provider/model"].params` (per modello), poi `agents.list[].params` (ID agente corrispondente) sovrascrive per chiave. Consulta [Prompt Caching](/it/reference/prompt-caching) per i dettagli.
- `models.providers.openrouter.params.provider`: policy di routing provider predefinita a livello OpenRouter. OpenClaw la inoltra all'oggetto `provider` della richiesta OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` per modello e i parametri dell'agente sovrascrivono per chiave. Consulta [routing provider OpenRouter](/it/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avanzato pass-through unito ai body delle richieste `api: "openai-completions"` per proxy compatibili con OpenAI. Se collide con chiavi di richiesta generate, il body extra prevale; le route completions non native rimuovono comunque `store` solo OpenAI dopo.
- `params.chat_template_kwargs`: argomenti chat-template compatibili con vLLM/OpenAI uniti ai body di richiesta di primo livello `api: "openai-completions"`. Per `vllm/nemotron-3-*` con thinking disattivato, il Plugin vLLM incluso invia automaticamente `enable_thinking: false` e `force_nonempty_content: true`; `chat_template_kwargs` espliciti sovrascrivono i valori predefiniti generati, ed `extra_body.chat_template_kwargs` mantiene comunque la precedenza finale. I modelli di thinking vLLM Qwen e Nemotron configurati espongono scelte binarie `/think` (`off`, `on`) invece della scala di effort multi-livello.
- `compat.thinkingFormat`: stile del payload di thinking compatibile con OpenAI. Usa `"together"` per `reasoning.enabled` in stile Together, `"qwen"` per `enable_thinking` di primo livello in stile Qwen, oppure `"qwen-chat-template"` per `chat_template_kwargs.enable_thinking` su backend della famiglia Qwen che supportano kwargs chat-template a livello richiesta, come vLLM. OpenClaw mappa il thinking disabilitato a `false` e il thinking abilitato a `true`, e i modelli vLLM Qwen configurati espongono scelte binarie `/think` per questi formati.
- `compat.supportedReasoningEfforts`: elenco per modello degli effort di ragionamento compatibili con OpenAI. Includi `"xhigh"` per endpoint personalizzati che lo accettano davvero; OpenClaw espone quindi `/think xhigh` nei menu comandi, nelle righe sessione Gateway, nella validazione patch sessione, nella validazione CLI agente e nella validazione `llm-task` per quel provider/modello configurato. Usa `compat.reasoningEffortMap` quando il backend richiede un valore specifico del provider per un livello canonico.
- `params.preserveThinking`: opt-in solo Z.AI per il thinking preservato. Quando abilitato e il thinking è attivo, OpenClaw invia `thinking.clear_thinking: false` e riproduce il precedente `reasoning_content`; consulta [thinking Z.AI e thinking preservato](/it/providers/zai#thinking-and-preserved-thinking).
- `localService`: gestore di processo opzionale a livello provider per server di modelli locali/self-hosted. Quando il modello selezionato appartiene a quel provider, OpenClaw sonda `healthUrl` (o `baseUrl + "/models"`), avvia `command` con `args` se l'endpoint non è disponibile, attende fino a `readyTimeoutMs`, poi invia la richiesta del modello. `command` deve essere un percorso assoluto. `idleStopMs: 0` mantiene il processo attivo finché OpenClaw non esce; un valore positivo arresta il processo avviato da OpenClaw dopo quel numero di millisecondi di inattività. Consulta [Servizi di modelli locali](/it/gateway/local-model-services).
- La policy di runtime appartiene a provider o modelli, non ad `agents.defaults`. Usa `models.providers.<provider>.agentRuntime` per regole a livello provider oppure `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` per regole specifiche del modello. I modelli agente OpenAI sul provider OpenAI ufficiale selezionano Codex per impostazione predefinita.
- Gli scrittori di configurazione che mutano questi campi (per esempio `/models set`, `/models set-image` e i comandi di aggiunta/rimozione fallback) salvano la forma oggetto canonica e preservano le liste fallback esistenti quando possibile.
- `maxConcurrent`: numero massimo di esecuzioni agente parallele tra sessioni (ogni sessione resta comunque serializzata). Predefinito: 4.

### Policy di runtime

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

- `id`: `"auto"`, `"openclaw"`, un id di harness plugin registrato o un alias backend CLI supportato. Il plugin Codex incluso registra `codex`; il plugin Anthropic incluso fornisce il backend CLI `claude-cli`.
- `id: "auto"` consente agli harness plugin registrati di rivendicare i turni supportati e usa OpenClaw quando nessun harness corrisponde. Un runtime plugin esplicito come `id: "codex"` richiede quell'harness e fallisce in modo chiuso se non è disponibile o fallisce.
- `id: "pi"` è accettato solo come alias deprecato di `openclaw` per preservare le configurazioni distribuite dalla v2026.5.22 e precedenti. Le nuove configurazioni dovrebbero usare `openclaw`.
- La precedenza del runtime è prima la policy esatta del modello (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` o `models.providers.<provider>.models[]`), poi `agents.list[]` / `agents.defaults.models["provider/*"]`, poi la policy a livello di provider in `models.providers.<provider>.agentRuntime`.
- Le chiavi runtime dell'intero agente sono legacy. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, i pin runtime di sessione e `OPENCLAW_AGENT_RUNTIME` vengono ignorati dalla selezione del runtime. Esegui `openclaw doctor --fix` per rimuovere i valori obsoleti.
- I modelli agente OpenAI usano l'harness Codex per impostazione predefinita; provider/modello `agentRuntime.id: "codex"` rimane valido quando vuoi renderlo esplicito.
- Per le distribuzioni Claude CLI, preferisci `model: "anthropic/claude-opus-4-8"` più `agentRuntime.id: "claude-cli"` con ambito modello. I riferimenti modello legacy `claude-cli/claude-opus-4-7` funzionano ancora per compatibilità, ma le nuove configurazioni dovrebbero mantenere canonica la selezione provider/modello e inserire il backend di esecuzione nella policy runtime provider/modello.
- Questo controlla solo l'esecuzione dei turni agente testuali. Generazione di media, visione, PDF, musica, video e TTS usano ancora le rispettive impostazioni provider/modello.

**Scorciatoie alias integrate** (si applicano solo quando il modello è in `agents.defaults.models`):

| Alias               | Modello                         |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Gli alias configurati da te hanno sempre la precedenza sui valori predefiniti.

I modelli Z.AI GLM-4.x abilitano automaticamente la modalità di ragionamento a meno che tu non imposti `--thinking off` o definisca personalmente `agents.defaults.models["zai/<model>"].params.thinking`.
I modelli Z.AI abilitano `tool_stream` per impostazione predefinita per lo streaming delle chiamate agli strumenti. Imposta `agents.defaults.models["zai/<model>"].params.tool_stream` su `false` per disabilitarlo.
Anthropic Claude Opus 4.8 mantiene il ragionamento disattivato per impostazione predefinita in OpenClaw; quando il ragionamento adattivo è abilitato esplicitamente, il valore predefinito dello sforzo gestito dal provider Anthropic è `high`. I modelli Claude 4.6 usano `adaptive` per impostazione predefinita quando non è impostato alcun livello di ragionamento esplicito.

### `agents.defaults.cliBackends`

Backend CLI opzionali per esecuzioni di fallback solo testuali (senza chiamate agli strumenti). Utili come backup quando i provider API falliscono.

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

- I backend CLI sono orientati al testo; gli strumenti sono sempre disabilitati.
- Le sessioni sono supportate quando `sessionArg` è impostato.
- Il pass-through delle immagini è supportato quando `imageArg` accetta percorsi di file.
- `reseedFromRawTranscriptWhenUncompacted: true` consente a un backend di recuperare sessioni sicure
  invalidate da una coda delimitata della trascrizione OpenClaw grezza prima che
  esista il primo riepilogo di Compaction. Le modifiche al profilo di autenticazione o all'epoca delle credenziali
  continuano comunque a non eseguire mai raw-reseed.

### `agents.defaults.promptOverlays`

Overlay prompt indipendenti dal provider applicati per famiglia di modelli alle superfici prompt assemblate da OpenClaw. Gli id modello della famiglia GPT-5 ricevono il contratto di comportamento condiviso tra le route OpenClaw/provider; `personality` controlla solo il livello di stile di interazione amichevole. Le route native del server app Codex mantengono le istruzioni base/modello gestite da Codex invece di questo overlay GPT-5 di OpenClaw, e OpenClaw disabilita la personality integrata di Codex per i thread nativi.

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
- `"off"` disabilita solo il livello amichevole; il contratto di comportamento GPT-5 etichettato rimane abilitato.
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
- `includeSystemPromptSection`: quando è false, omette la sezione Heartbeat dal prompt di sistema e salta l'iniezione di `HEARTBEAT.md` nel contesto bootstrap. Predefinito: `true`.
- `suppressToolErrorWarnings`: quando è true, sopprime i payload di avviso per errori degli strumenti durante le esecuzioni Heartbeat.
- `timeoutSeconds`: tempo massimo in secondi consentito per un turno agente Heartbeat prima che venga interrotto. Lascialo non impostato per usare `agents.defaults.timeoutSeconds` quando è impostato, altrimenti la cadenza Heartbeat limitata a 600 secondi.
- `directPolicy`: policy di consegna diretta/DM. `allow` (predefinito) consente la consegna a destinazione diretta. `block` sopprime la consegna a destinazione diretta ed emette `reason=dm-blocked`.
- `lightContext`: quando è true, le esecuzioni Heartbeat usano un contesto bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file bootstrap del workspace.
- `isolatedSession`: quando è true, ogni Heartbeat viene eseguito in una sessione nuova senza cronologia di conversazione precedente. Stesso schema di isolamento del cron `sessionTarget: "isolated"`. Riduce il costo in token per Heartbeat da circa 100K a circa 2-5K token.
- `skipWhenBusy`: quando è true, le esecuzioni Heartbeat vengono rinviate sulle lane occupate extra di quell'agente: il proprio subagente con chiave di sessione o il lavoro di comando annidato. Le lane Cron rinviano sempre gli Heartbeat, anche senza questo flag.
- Per agente: imposta `agents.list[].heartbeat`. Quando un agente definisce `heartbeat`, **solo quegli agenti** eseguono Heartbeat.
- Gli Heartbeat eseguono turni agente completi: intervalli più brevi consumano più token.

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

- `mode`: `default` o `safeguard` (riepilogo a blocchi per cronologie lunghe). Vedi [Compaction](/it/concepts/compaction).
- `provider`: ID di un plugin provider di compaction registrato. Quando impostato, viene chiamato `summarize()` del provider invece del riepilogo LLM integrato. In caso di errore torna al comportamento integrato. Impostare un provider forza `mode: "safeguard"`. Vedi [Compaction](/it/concepts/compaction).
- `timeoutSeconds`: numero massimo di secondi consentiti per una singola operazione di compaction prima che OpenClaw la interrompa. Predefinito: `180`.
- `keepRecentTokens`: budget del punto di taglio dell'agente per mantenere letterale la coda piu recente della trascrizione. `/compact` manuale lo rispetta quando impostato esplicitamente; altrimenti la compaction manuale e un checkpoint rigido.
- `identifierPolicy`: `strict` (predefinito), `off` o `custom`. `strict` antepone indicazioni integrate per la conservazione di identificatori opachi durante il riepilogo di compaction.
- `identifierInstructions`: testo personalizzato opzionale per la conservazione degli identificatori, usato quando `identifierPolicy=custom`.
- `qualityGuard`: controlli con nuovo tentativo su output malformato per i riepiloghi safeguard. Abilitato per impostazione predefinita in modalita safeguard; imposta `enabled: false` per saltare l'audit.
- `midTurnPrecheck`: controllo opzionale della pressione del tool loop. Quando `enabled: true`, OpenClaw controlla la pressione del contesto dopo l'aggiunta dei risultati degli strumenti e prima della successiva chiamata al modello. Se il contesto non rientra piu nei limiti, interrompe il tentativo corrente prima di inviare il prompt e riusa il percorso di recupero del precheck esistente per troncare i risultati degli strumenti oppure eseguire la compaction e riprovare. Funziona con entrambe le modalita di compaction `default` e `safeguard`. Predefinito: disabilitato.
- `postCompactionSections`: nomi opzionali di sezioni H2/H3 di AGENTS.md da reiniettare dopo la compaction. La reiniezione e disabilitata quando non impostato o impostato su `[]`. Impostare esplicitamente `["Session Startup", "Red Lines"]` abilita quella coppia e conserva il fallback legacy `Every Session`/`Safety`. Abilitalo solo quando il contesto extra vale il rischio di duplicare indicazioni di progetto gia catturate nel riepilogo di compaction.
- `model`: `provider/model-id` opzionale o alias semplice da `agents.defaults.models` solo per il riepilogo di compaction. Gli alias semplici vengono risolti prima dell'invio; gli ID modello letterali configurati mantengono la precedenza in caso di collisioni. Usalo quando la sessione principale deve mantenere un modello ma i riepiloghi di compaction devono essere eseguiti su un altro; quando non impostato, la compaction usa il modello primario della sessione.
- `maxActiveTranscriptBytes`: soglia opzionale in byte (`number` o stringhe come `"20mb"`) che attiva la normale compaction locale prima di un'esecuzione quando il JSONL attivo supera la soglia. Richiede `truncateAfterCompaction` affinche una compaction riuscita possa ruotare verso una trascrizione successiva piu piccola. Disabilitato quando non impostato o `0`.
- `notifyUser`: quando `true`, invia brevi avvisi all'utente quando la compaction inizia e quando si completa (per esempio, "Compacting context..." e "Compaction complete"). Disabilitato per impostazione predefinita per mantenere silenziosa la compaction.
- `memoryFlush`: turno agentico silenzioso prima della compaction automatica per archiviare memorie durevoli. Imposta `model` su un provider/modello esatto come `ollama/qwen3:8b` quando questo turno di manutenzione deve rimanere su un modello locale; l'override non eredita la catena di fallback della sessione attiva. Saltato quando il workspace e in sola lettura.

### `agents.defaults.runRetries`

Limiti delle iterazioni di nuovo tentativo del ciclo di esecuzione esterno per il runtime agente integrato, per evitare loop di esecuzione infiniti durante il recupero da errori. Nota che questa impostazione al momento si applica solo al runtime agente integrato, non ai runtime ACP o CLI.

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

- `base`: numero base di iterazioni di nuovo tentativo per il ciclo di esecuzione esterno. Predefinito: `24`.
- `perProfile`: iterazioni aggiuntive di nuovo tentativo concesse per ogni candidato profilo di fallback. Predefinito: `8`.
- `min`: limite minimo assoluto per le iterazioni di nuovo tentativo. Predefinito: `32`.
- `max`: limite massimo assoluto per le iterazioni di nuovo tentativo, per impedire esecuzioni incontrollate. Predefinito: `160`.

### `agents.defaults.contextPruning`

Pota i **vecchi risultati degli strumenti** dal contesto in memoria prima dell'invio all'LLM. **Non** modifica la cronologia della sessione su disco.

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
- `ttl` controlla ogni quanto la potatura puo essere eseguita di nuovo (dopo l'ultimo tocco della cache).
- La potatura prima accorcia in modo leggero i risultati degli strumenti sovradimensionati, poi svuota completamente i risultati piu vecchi se necessario.
- `softTrimRatio` e `hardClearRatio` accettano valori da `0.0` a `1.0`; la validazione della configurazione rifiuta valori fuori da quell'intervallo.

**Taglio leggero** mantiene inizio + fine e inserisce `...` nel mezzo.

**Svuotamento completo** sostituisce l'intero risultato dello strumento con il placeholder.

Note:

- I blocchi immagine non vengono mai accorciati/svuotati.
- I rapporti sono basati sui caratteri (approssimativi), non su conteggi esatti di token.
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
- Override per canale: `channels.<channel>.blockStreamingCoalesce` (e varianti per account). Signal/Slack/Discord/Google Chat usano per impostazione predefinita `minChars: 1500`.
- `humanDelay`: pausa casuale tra risposte a blocchi. `natural` = 800-2500 ms. Override per agente: `agents.list[].humanDelay`.

Vedi [Streaming](/it/concepts/streaming) per i dettagli sul comportamento e sulla suddivisione in blocchi.

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

Sandboxing opzionale per l'agente integrato. Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa.

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
- `workspaceRoot`: radice remota assoluta usata per workspace per ambito
- `identityFile` / `certificateFile` / `knownHostsFile`: file locali esistenti passati a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenuti inline o SecretRef che OpenClaw materializza in file temporanei a runtime
- `strictHostKeyChecking` / `updateHostKeys`: controlli della policy delle chiavi host di OpenSSH

**Precedenza dell'autenticazione SSH:**

- `identityData` prevale su `identityFile`
- `certificateData` prevale su `certificateFile`
- `knownHostsData` prevale su `knownHostsFile`
- I valori `*Data` basati su SecretRef vengono risolti dallo snapshot del runtime dei segreti attivo prima dell'avvio della sessione sandbox

**Comportamento del backend SSH:**

- inizializza il workspace remoto una volta dopo la creazione o la ricreazione
- poi mantiene canonico il workspace SSH remoto
- instrada `exec`, strumenti file e percorsi media tramite SSH
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

**Configurazione del plugin OpenShell:**

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
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modalità OpenShell:**

- `mirror`: inizializza il remoto dal locale prima dell'esecuzione, sincronizza indietro dopo l'esecuzione; il workspace locale rimane canonico
- `remote`: inizializza il remoto una volta quando viene creata la sandbox, poi mantieni il workspace remoto canonico

In modalità `remote`, le modifiche host-locali effettuate fuori da OpenClaw non vengono sincronizzate automaticamente nella sandbox dopo il passaggio di inizializzazione.
Il trasporto è SSH nella sandbox OpenShell, ma il plugin gestisce il ciclo di vita della sandbox e la sincronizzazione mirror opzionale.

**`setupCommand`** viene eseguito una volta dopo la creazione del container (tramite `sh -lc`). Richiede uscita di rete, root scrivibile, utente root.

**I container hanno per impostazione predefinita `network: "none"`**: impostala su `"bridge"` (o su una rete bridge personalizzata) se l'agente necessita di accesso in uscita.
`"host"` è bloccato. `"container:<id>"` è bloccato per impostazione predefinita, a meno che tu non imposti esplicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (intervento di emergenza).
I turni app-server di Codex in una sandbox OpenClaw attiva usano questa stessa impostazione di uscita per il loro accesso di rete nativo in modalità codice.

**Gli allegati in ingresso** vengono predisposti in `media/inbound/*` nel workspace attivo.

**`docker.binds`** monta directory host aggiuntive; i bind globali e per agente vengono uniti.

**Browser in sandbox** (`sandbox.browser.enabled`): Chromium + CDP in un container. URL noVNC iniettato nel prompt di sistema. Non richiede `browser.enabled` in `openclaw.json`.
L'accesso osservatore noVNC usa l'autenticazione VNC per impostazione predefinita e OpenClaw emette un URL token di breve durata (invece di esporre la password nell'URL condiviso).

- `allowHostControl: false` (predefinito) impedisce alle sessioni in sandbox di puntare al browser host.
- `network` usa per impostazione predefinita `openclaw-sandbox-browser` (rete bridge dedicata). Impostala su `bridge` solo quando vuoi esplicitamente connettività bridge globale.
- `cdpSourceRange` limita facoltativamente l'ingresso CDP al bordo del container a un intervallo CIDR (ad esempio `172.21.0.1/32`).
- `sandbox.browser.binds` monta directory host aggiuntive solo nel container del browser in sandbox. Quando è impostato (incluso `[]`), sostituisce `docker.binds` per il container del browser.
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
    ne dipende.
  - `--renderer-process-limit=2` può essere modificato con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; imposta `0` per usare il limite
    di processi predefinito di Chromium.
  - più `--no-sandbox` quando `noSandbox` è abilitato.
  - I valori predefiniti sono la baseline dell'immagine container; usa un'immagine browser personalizzata con un
    entrypoint personalizzato per modificare i valori predefiniti del container.

</Accordion>

Il sandboxing del browser e `sandbox.docker.binds` sono solo Docker.

Compila le immagini (da un checkout sorgente):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Per installazioni npm senza checkout sorgente, consulta [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup) per i comandi `docker build` inline.

### `agents.list` (override per agente)

Usa `agents.list[].tts` per assegnare a un agente il proprio provider TTS, voce, modello,
stile o modalità auto-TTS. Il blocco dell'agente viene unito in profondità sopra
`messages.tts`, quindi le credenziali condivise possono rimanere in un solo punto mentre i singoli
agenti sovrascrivono solo i campi voce o provider necessari. L'override dell'agente attivo
si applica alle risposte vocali automatiche, a `/tts audio`, a `/tts status` e
allo strumento agente `tts`. Consulta [Sintesi vocale](/it/tools/tts#per-agent-voice-overrides)
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
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
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

- `id`: id agente stabile (obbligatorio).
- `default`: quando ne sono impostati più di uno, vince il primo (avviso registrato). Se nessuno è impostato, la prima voce dell'elenco è quella predefinita.
- `model`: la forma stringa imposta un primario rigoroso per agente senza fallback del modello; anche la forma oggetto `{ primary }` è rigorosa, a meno che tu non aggiunga `fallbacks`. Usa `{ primary, fallbacks: [...] }` per abilitare il fallback per quell'agente, oppure `{ primary, fallbacks: [] }` per rendere esplicito il comportamento rigoroso. I job Cron che sovrascrivono solo `primary` ereditano comunque i fallback predefiniti, a meno che tu non imposti `fallbacks: []`.
- `params`: parametri di stream per agente uniti sopra la voce del modello selezionata in `agents.defaults.models`. Usalo per override specifici dell'agente come `cacheRetention`, `temperature` o `maxTokens` senza duplicare l'intero catalogo dei modelli.
- `tts`: override opzionali di sintesi vocale per agente. Il blocco viene unito in profondità sopra `messages.tts`, quindi mantieni le credenziali provider condivise e la policy di fallback in `messages.tts` e imposta qui solo valori specifici della persona, come provider, voce, modello, stile o modalità automatica.
- `skills`: allowlist opzionale di skill per agente. Se omessa, l'agente eredita `agents.defaults.skills` quando è impostato; un elenco esplicito sostituisce i valori predefiniti invece di unirli, e `[]` significa nessuna skill.
- `thinkingDefault`: livello di pensiero predefinito opzionale per agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sovrascrive `agents.defaults.thinkingDefault` per questo agente quando non è impostato alcun override per messaggio o sessione. Il profilo provider/modello selezionato controlla quali valori sono validi; per Google Gemini, `adaptive` mantiene il pensiero dinamico gestito dal provider (`thinkingLevel` omesso su Gemini 3/3.1, `thinkingBudget: -1` su Gemini 2.5).
- `reasoningDefault`: visibilità del reasoning predefinita opzionale per agente (`on | off | stream`). Sovrascrive `agents.defaults.reasoningDefault` per questo agente quando non è impostato alcun override di reasoning per messaggio o sessione.
- `fastModeDefault`: valore predefinito opzionale per la modalità rapida (`"auto" | true | false`). Si applica quando non è impostato alcun override di modalità rapida per messaggio o sessione.
- `models`: override opzionali del catalogo modelli/runtime per agente, indicizzati per id completi `provider/model`. Usa `models["provider/model"].agentRuntime` per eccezioni runtime per agente.
- `runtime`: descrittore runtime opzionale per agente. Usa `type: "acp"` con i valori predefiniti `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando l'agente deve usare per impostazione predefinita sessioni harness ACP.
- `identity.avatar`: percorso relativo al workspace, URL `http(s)` o URI `data:`.
- I file immagine `identity.avatar` locali relativi al workspace sono limitati a 2 MB. Gli URL `http(s)` e gli URI `data:` non vengono controllati con il limite locale di dimensione file.
- `identity` deriva valori predefiniti: `ackReaction` da `emoji`, `mentionPatterns` da `name`/`emoji`.
- `subagents.allowAgents`: allowlist di id agente configurati per target espliciti `sessions_spawn.agentId` (`["*"]` = qualsiasi target configurato; predefinito: solo lo stesso agente). Includi l'id del richiedente quando le chiamate `agentId` indirizzate a sé stesse devono essere consentite. Le voci obsolete la cui configurazione agente è stata eliminata vengono rifiutate da `sessions_spawn` e omesse da `agents_list`; esegui `openclaw doctor --fix` per ripulirle, oppure aggiungi una voce minima `agents.list[]` se quel target deve rimanere generabile ereditando i valori predefiniti.
- Guardia di ereditarietà della sandbox: se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta target che verrebbero eseguiti senza sandbox.
- `subagents.requireAgentId`: quando true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo; predefinito: false).

---

## Routing multi-agente

Esegui più agenti isolati dentro un solo Gateway. Consulta [Multi-Agent](/it/concepts/multi-agent).

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

### Campi di corrispondenza del binding

- `type` (opzionale): `route` per il routing normale (il tipo mancante usa route per impostazione predefinita), `acp` per binding di conversazione ACP persistenti.
- `match.channel` (obbligatorio)
- `match.accountId` (opzionale; `*` = qualsiasi account; omesso = account predefinito)
- `match.peer` (opzionale; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opzionale; specifico del canale)
- `acp` (opzionale; solo per `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordine di corrispondenza deterministico:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (esatto, senza peer/guild/team)
5. `match.accountId: "*"` (a livello di canale)
6. Agente predefinito

All'interno di ogni livello, vince la prima voce `bindings` corrispondente.

Per le voci `type: "acp"`, OpenClaw risolve per identità di conversazione esatta (`match.channel` + account + `match.peer.id`) e non usa l'ordine a livelli dei binding di route sopra.

### Profili di accesso per agente

<Accordion title="Full access (no sandbox)">

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

<Accordion title="Read-only tools + workspace">

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

Vedi [Sandbox multi-agente e strumenti](/it/tools/multi-agent-sandbox-tools) per i dettagli sulla precedenza.

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
  - `global`: tutti i partecipanti in un contesto di canale condividono una singola sessione (usare solo quando è previsto un contesto condiviso).
- **`dmScope`**: come vengono raggruppati i DM.
  - `main`: tutti i DM condividono la sessione principale.
  - `per-peer`: isola per id mittente tra i canali.
  - `per-channel-peer`: isola per canale + mittente (consigliato per caselle di posta multiutente).
  - `per-account-channel-peer`: isola per account + canale + mittente (consigliato per più account).
- **`identityLinks`**: mappa gli id canonici ai peer con prefisso del provider per la condivisione della sessione tra canali. I comandi dock come `/dock_discord` usano la stessa mappa per cambiare la route di risposta della sessione attiva verso un altro peer di canale collegato; vedi [Docking dei canali](/it/concepts/channel-docking).
- **`reset`**: criterio di ripristino principale. `daily` ripristina all'ora locale `atHour`; `idle` ripristina dopo `idleMinutes`. Quando entrambi sono configurati, vince quello che scade per primo. La freschezza del ripristino giornaliero usa `sessionStartedAt` della riga della sessione; la freschezza del ripristino per inattività usa `lastInteractionAt`. Le scritture di eventi in background/sistema come Heartbeat, risvegli Cron, notifiche exec e bookkeeping del Gateway possono aggiornare `updatedAt`, ma non mantengono fresche le sessioni giornaliere/per inattività.
- **`resetByType`**: override per tipo (`direct`, `group`, `thread`). Il valore legacy `dm` è accettato come alias di `direct`.
- **`mainKey`**: campo legacy. Il runtime usa sempre `"main"` per il bucket principale delle chat dirette.
- **`agentToAgent.maxPingPongTurns`**: numero massimo di turni di risposta tra agenti durante gli scambi da agente ad agente (intero, intervallo: `0`-`20`, predefinito: `5`). `0` disabilita il concatenamento ping-pong.
- **`sendPolicy`**: corrispondenza per `channel`, `chatType` (`direct|group|channel`, con alias legacy `dm`), `keyPrefix` o `rawKeyPrefix`. Il primo deny vince.
- **`maintenance`**: controlli di pulizia + conservazione dello store delle sessioni.
  - `mode`: `enforce` applica la pulizia ed è il valore predefinito; `warn` emette solo avvisi.
  - `pruneAfter`: soglia di età per le voci obsolete (predefinito `30d`).
  - `maxEntries`: numero massimo di voci in `sessions.json` (predefinito `500`). Il runtime scrive la pulizia in batch con un piccolo buffer high-water per limiti di dimensioni di produzione; `openclaw sessions cleanup --enforce` applica il limite immediatamente.
  - Le sessioni probe di breve durata per model-run del Gateway usano una conservazione fissa di `24h`, ma la pulizia è vincolata alla pressione: rimuove le righe probe obsolete di model-run strict solo quando viene raggiunta la pressione di manutenzione/limite delle voci di sessione. Sono idonee solo le chiavi probe esplicite strict che corrispondono a `agent:*:explicit:model-run-<uuid>`; le normali sessioni dirette, di gruppo, thread, Cron, hook, Heartbeat, ACP e sub-agent non ereditano questa conservazione di 24h. Quando la pulizia model-run viene eseguita, viene eseguita prima della pulizia più ampia delle voci obsolete `pruneAfter` e del limite `maxEntries`.
  - `rotateBytes`: deprecato e ignorato; `openclaw doctor --fix` lo rimuove dalle configurazioni più vecchie.
  - `resetArchiveRetention`: conservazione per gli archivi di trascrizione `*.reset.<timestamp>`. Il valore predefinito è `pruneAfter`; impostare `false` per disabilitare.
  - `maxDiskBytes`: budget disco facoltativo della directory delle sessioni. In modalità `warn` registra avvisi; in modalità `enforce` rimuove prima gli artefatti/sessioni più vecchi.
  - `highWaterBytes`: target facoltativo dopo la pulizia del budget. Il valore predefinito è `80%` di `maxDiskBytes`.
- **`threadBindings`**: impostazioni predefinite globali per le funzionalità di sessione vincolate ai thread.
  - `enabled`: interruttore predefinito principale (i provider possono eseguire l'override; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus predefinito per inattività in ore (`0` disabilita; i provider possono eseguire l'override)
  - `maxAgeHours`: età massima rigida predefinita in ore (`0` disabilita; i provider possono eseguire l'override)
  - `spawnSessions`: gate predefinito per creare sessioni di lavoro vincolate ai thread da `sessions_spawn` e dagli spawn di thread ACP. Il valore predefinito è `true` quando i thread binding sono abilitati; provider/account possono eseguire l'override.
  - `defaultSpawnContext`: contesto subagent nativo predefinito per gli spawn vincolati ai thread (`"fork"` o `"isolated"`). Il valore predefinito è `"fork"`.

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

| Variabile         | Descrizione             | Esempio                     |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Nome breve del modello  | `claude-opus-4-6`           |
| `{modelFull}`     | Identificatore completo del modello | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome del provider       | `anthropic`                 |
| `{thinkingLevel}` | Livello di thinking corrente | `high`, `low`, `off`        |
| `{identity.name}` | Nome dell'identità dell'agente | (uguale a `"auto"`)          |

Le variabili non distinguono tra maiuscole e minuscole. `{think}` è un alias di `{thinkingLevel}`.

### Reazione di conferma

- Il valore predefinito è `identity.emoji` dell'agente attivo, altrimenti `"👀"`. Impostare `""` per disabilitare.
- Override per canale: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordine di risoluzione: account → canale → `messages.ackReaction` → fallback dell'identità.
- Ambito: `group-mentions` (predefinito), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: rimuove la conferma dopo la risposta sui canali che supportano le reazioni, come Slack, Discord, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: abilita le reazioni di stato del ciclo di vita su Slack, Discord, Telegram e WhatsApp.
  Su Slack e Discord, se non impostato mantiene abilitate le reazioni di stato quando le reazioni di conferma sono attive.
  Su Telegram e WhatsApp, impostarlo esplicitamente a `true` per abilitare le reazioni di stato del ciclo di vita.
- `messages.statusReactions.emojis`: esegue l'override delle chiavi emoji del ciclo di vita:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` e `stallHard`.
  Telegram consente solo un set fisso di reazioni, quindi gli emoji configurati non supportati fanno fallback
  alla variante di stato supportata più vicina per quella chat.

### Debounce in ingresso

Raggruppa i messaggi rapidi solo testo dallo stesso mittente in un singolo turno dell'agente. Media/allegati vengono inviati immediatamente. I comandi di controllo bypassano il debounce.

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

- `auto` controlla la modalità auto-TTS predefinita: `off`, `always`, `inbound` o `tagged`. `/tts on|off` può sovrascrivere le preferenze locali, e `/tts status` mostra lo stato effettivo.
- `summaryModel` sovrascrive `agents.defaults.model.primary` per il riepilogo automatico.
- `modelOverrides` è abilitato per impostazione predefinita; `modelOverrides.allowProvider` ha come valore predefinito `false` (opt-in).
- Le chiavi API usano come fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- I provider vocali inclusi sono di proprietà dei Plugin. Se `plugins.allow` è impostato, includi ogni Plugin provider TTS che vuoi usare, per esempio `microsoft` per Edge TTS. L'id provider legacy `edge` è accettato come alias di `microsoft`.
- `providers.openai.baseUrl` sovrascrive l'endpoint TTS di OpenAI. L'ordine di risoluzione è configurazione, poi `OPENAI_TTS_BASE_URL`, poi `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` punta a un endpoint non OpenAI, OpenClaw lo tratta come un server TTS compatibile con OpenAI e allenta la convalida di modello/voce.

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

- `talk.provider` deve corrispondere a una chiave in `talk.providers` quando sono configurati più provider Conversazione.
- Le vecchie chiavi piatte di Conversazione (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sono solo per compatibilità. Esegui `openclaw doctor --fix` per riscrivere la configurazione persistita in `talk.providers.<provider>`.
- Gli ID voce usano come fallback `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` accetta stringhe in testo semplice o oggetti SecretRef.
- Il fallback `ELEVENLABS_API_KEY` si applica solo quando non è configurata alcuna chiave API per Conversazione.
- `providers.*.voiceAliases` consente alle direttive di Conversazione di usare nomi descrittivi.
- `providers.mlx.modelId` seleziona il repository Hugging Face usato dall'helper MLX locale di macOS. Se omesso, macOS usa `mlx-community/Soprano-80M-bf16`.
- La riproduzione MLX su macOS passa attraverso l'helper `openclaw-mlx-tts` incluso quando presente, oppure un eseguibile su `PATH`; `OPENCLAW_MLX_TTS_BIN` sovrascrive il percorso dell'helper per lo sviluppo.
- `consultThinkingLevel` controlla il livello di ragionamento per l'esecuzione completa dell'agente OpenClaw dietro alle chiamate `openclaw_agent_consult` in tempo reale della Conversazione dell'interfaccia di controllo. Lascialo non impostato per preservare il normale comportamento di sessione/modello.
- `consultFastMode` imposta una sovrascrittura monouso della modalità rapida per le consultazioni in tempo reale di Conversazione dell'interfaccia di controllo senza modificare la normale impostazione della modalità rapida della sessione.
- `speechLocale` imposta l'id locale BCP 47 usato dal riconoscimento vocale Conversazione su iOS/macOS. Lascialo non impostato per usare il valore predefinito del dispositivo.
- `silenceTimeoutMs` controlla per quanto tempo la modalità Conversazione attende dopo il silenzio dell'utente prima di inviare la trascrizione. Non impostato mantiene la finestra di pausa predefinita della piattaforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` aggiunge istruzioni di sistema rivolte al provider al prompt in tempo reale integrato di OpenClaw, così lo stile della voce può essere configurato senza perdere la guida predefinita di `openclaw_agent_consult`.
- `realtime.consultRouting` controlla il fallback di inoltro del Gateway quando il provider in tempo reale produce una trascrizione utente finale senza `openclaw_agent_consult`: `provider-direct` preserva le risposte dirette del provider, mentre `force-agent-consult` instrada la richiesta finalizzata attraverso OpenClaw.

---

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference) — tutte le altre chiavi di configurazione
- [Configurazione](/it/gateway/configuration) — attività comuni e configurazione rapida
- [Esempi di configurazione](/it/gateway/configuration-examples)
