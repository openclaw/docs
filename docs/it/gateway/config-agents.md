---
read_when:
    - Ottimizzazione delle impostazioni predefinite dell'agente (modelli, ragionamento, area di lavoro, Heartbeat, contenuti multimediali, Skills)
    - Configurazione dell'instradamento e delle associazioni multi-agente
    - Regolazione del comportamento delle sessioni, della consegna dei messaggi e della modalità conversazione
summary: Impostazioni predefinite degli agenti, instradamento multi-agente e configurazione di sessioni, messaggi e conversazioni
title: Configurazione — agenti
x-i18n:
    generated_at: "2026-07-16T14:11:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

Chiavi di configurazione con ambito agente in `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Per canali, strumenti, runtime del Gateway e altre
chiavi di primo livello, consultare il [riferimento della configurazione](/it/gateway/configuration-reference).

## Valori predefiniti degli agenti

### `agents.defaults.workspace`

Valore predefinito: `OPENCLAW_WORKSPACE_DIR` quando impostato, altrimenti `~/.openclaw/workspace` (oppure `~/.openclaw/workspace-<profile>` quando `OPENCLAW_PROFILE` è impostato su un profilo non predefinito).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Un valore `agents.defaults.workspace` esplicito ha la precedenza su
`OPENCLAW_WORKSPACE_DIR`. Usare la variabile di ambiente per indirizzare gli agenti predefiniti
a uno spazio di lavoro montato quando non si desidera scrivere tale percorso nella configurazione.

### `agents.defaults.repoRoot`

Radice facoltativa del repository mostrata nella riga Runtime del prompt di sistema. Se non impostata, OpenClaw la rileva automaticamente risalendo dallo spazio di lavoro.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist predefinita facoltativa delle Skills per gli agenti che non impostano
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

- Omettere `agents.defaults.skills` per consentire per impostazione predefinita Skills senza restrizioni.
- Omettere `agents.list[].skills` per ereditare i valori predefiniti.
- Impostare `agents.list[].skills: []` per non consentire alcuna skill.
- Un elenco `agents.list[].skills` non vuoto costituisce l'insieme definitivo per tale agente;
  non viene unito ai valori predefiniti.

### `agents.defaults.skipBootstrap`

Disabilita la creazione automatica dei file di bootstrap dello spazio di lavoro (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Ignora la creazione di determinati file facoltativi dello spazio di lavoro, continuando comunque a scrivere i file di bootstrap obbligatori (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Valori validi: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

Controlla quando i file di bootstrap dello spazio di lavoro vengono inseriti nel prompt di sistema. Valore predefinito: `"always"`.

- `"continuation-skip"`: nei turni di continuazione sicuri (dopo una risposta completata dell'assistente) viene omesso il reinserimento del bootstrap dello spazio di lavoro, riducendo le dimensioni del prompt. Le esecuzioni Heartbeat e i nuovi tentativi successivi alla Compaction ricostruiscono comunque il contesto.
- `"never"`: disabilita l'inserimento del bootstrap dello spazio di lavoro e dei file di contesto a ogni turno. Usare questa opzione solo per gli agenti che gestiscono integralmente il proprio ciclo di vita del prompt (motori di contesto personalizzati, runtime nativi che costruiscono il proprio contesto o flussi di lavoro specializzati senza bootstrap). Anche i turni Heartbeat e di ripristino dalla Compaction omettono l'inserimento.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Override per agente: `agents.list[].contextInjection`. I valori omessi ereditano
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Numero massimo di caratteri per ciascun file di bootstrap dello spazio di lavoro prima del troncamento. Valore predefinito: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Override per agente: `agents.list[].bootstrapMaxChars`. I valori omessi ereditano
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Numero totale massimo di caratteri inseriti da tutti i file di bootstrap dello spazio di lavoro. Valore predefinito: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Override per agente: `agents.list[].bootstrapTotalMaxChars`. I valori omessi
ereditano `agents.defaults.bootstrapTotalMaxChars`.

### Override del profilo di bootstrap per agente

Usare gli override del profilo di bootstrap per agente quando un agente richiede un comportamento di inserimento nel prompt
diverso dai valori predefiniti condivisi. I campi omessi ereditano da
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

Controlla l'avviso nel prompt di sistema visibile all'agente quando il contesto di bootstrap viene troncato.
Valore predefinito: `"always"`.

- `"off"`: non inserire mai il testo dell'avviso di troncamento nel prompt di sistema.
- `"once"`: inserire un avviso conciso una volta per ogni firma di troncamento univoca.
- `"always"`: inserire un avviso conciso a ogni esecuzione quando è presente un troncamento (consigliato).

I conteggi grezzi/inseriti dettagliati e i campi per l'ottimizzazione della configurazione rimangono nella diagnostica, ad esempio nei
report di contesto/stato e nei log; il normale contesto utente/runtime di WebChat riceve soltanto
l'avviso conciso di ripristino.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mappa della titolarità dei budget di contesto

OpenClaw dispone di più budget ad alto volume per prompt/contesto, intenzionalmente
suddivisi per sottosistema anziché gestiti tutti tramite un'unica opzione
generica.

| Budget                                                         | Include                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Normale inserimento del bootstrap dello spazio di lavoro                                                                                                                            |
| `agents.defaults.startupContext.*`                             | Preambolo una tantum per l'esecuzione del modello all'avvio o dopo il ripristino, inclusi i file `memory/*.md` giornalieri recenti. I semplici comandi di chat `/new` e `/reset` vengono confermati senza richiamare il modello |
| `skills.limits.*`                                              | L'elenco compatto delle Skills inserito nel prompt di sistema                                                                                                         |
| `agents.defaults.contextLimits.*`                              | Estratti limitati del runtime e blocchi inseriti di proprietà del runtime                                                                                                      |
| `memory.qmd.limits.*`                                          | Dimensionamento degli estratti indicizzati della ricerca in memoria e del relativo inserimento                                                                                                              |

Override corrispondenti per agente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controlla il preambolo di avvio del primo turno inserito nelle esecuzioni del modello all'avvio o dopo il ripristino.
I semplici comandi di chat `/new` e `/reset` confermano il ripristino senza richiamare
il modello, pertanto non caricano questo preambolo.

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

Valori predefiniti condivisi per le superfici di contesto del runtime con dimensioni limitate.

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

- `memoryGetMaxChars`: limite predefinito dell'estratto `memory_get` prima dell'aggiunta
  dei metadati di troncamento e dell'avviso di continuazione.
- `memoryGetDefaultLines`: intervallo predefinito di righe `memory_get` quando `lines` viene
  omesso.
- `toolResultMaxChars`: limite avanzato dei risultati live degli strumenti, utilizzato per i risultati
  persistenti e il ripristino in caso di superamento. Lasciare non impostato per il limite automatico del contesto del modello:
  `16000` caratteri sotto i 100K token, `32000` caratteri con almeno 100K token e `64000`
  caratteri con almeno 200K token. Per i modelli con contesto esteso sono accettati valori espliciti fino a `1000000`,
  ma il limite effettivo resta comunque circoscritto a circa il 30% della
  finestra di contesto del modello. `openclaw doctor --deep` mostra il limite effettivo
  e doctor genera un avviso solo quando un override esplicito è obsoleto o non produce effetti.
- `postCompactionMaxChars`: limite dell'estratto di AGENTS.md utilizzato durante l'inserimento
  di aggiornamento successivo alla Compaction.

#### `agents.list[].contextLimits`

Override per agente delle opzioni condivise `contextLimits`. I campi omessi ereditano
da `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
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

Limite globale per l'elenco compatto delle Skills inserito nel prompt di sistema. Ciò
non influisce sulla lettura su richiesta dei file `SKILL.md`.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Override per agente del budget del prompt delle Skills.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Dimensione massima in pixel del lato più lungo delle immagini nei blocchi immagine di trascrizioni/strumenti prima delle chiamate al provider.
Valore predefinito: `1200`.

Valori inferiori generalmente riducono l'uso dei token di visione e le dimensioni del payload delle richieste per le esecuzioni con molte schermate.
Valori superiori preservano più dettagli visivi.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferenza di compressione/dettaglio dello strumento immagini per le immagini caricate da percorsi di file, URL e riferimenti multimediali.
Valore predefinito: `auto`.

OpenClaw adatta la sequenza di ridimensionamento al modello di immagini selezionato. Ad esempio, Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL e i modelli di visione Llama 4 ospitati possono usare immagini più grandi rispetto ai percorsi di visione più datati/predefiniti ad alto dettaglio, mentre i turni con più immagini vengono compressi più aggressivamente in modalità `auto` per controllare il costo in termini di token e latenza.

Valori:

- `auto`: adattamento ai limiti del modello e al numero di immagini.
- `efficient`: preferenza per immagini più piccole per ridurre l'uso di token e byte.
- `balanced`: uso della sequenza intermedia standard.
- `high`: conservazione di maggiori dettagli per schermate, diagrammi e immagini di documenti.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Fuso orario per il contesto del prompt di sistema (non per i timestamp dei messaggi). In assenza di un valore, viene usato il fuso orario dell'host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato dell'ora nel prompt di sistema. Valore predefinito: `auto` (preferenza del sistema operativo).

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
      utilityModel: "openai/gpt-5.4-mini",
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
      params: { cacheRetention: "long" }, // parametri globali predefiniti del provider
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - La forma stringa imposta solo il modello principale.
  - La forma oggetto imposta il modello principale e i modelli di failover ordinati.
- `utilityModel`: riferimento o alias `provider/model` facoltativo per brevi attività interne. Attualmente viene utilizzato per i titoli generati delle sessioni della Control UI, i titoli degli argomenti dei messaggi diretti di Telegram, i titoli automatici dei thread di Discord e la [narrazione delle bozze di avanzamento](/it/concepts/progress-drafts#narrated-status). Quando non è impostato, OpenClaw ricava il modello piccolo predefinito dichiarato dal provider principale, se disponibile (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); in caso contrario, le attività relative ai titoli utilizzano il modello principale dell'agente, mentre la narrazione rimane disattivata. Impostare `utilityModel: ""` per disabilitare completamente l'instradamento delle attività di utilità. `agents.list[].utilityModel` sostituisce il valore predefinito (un valore vuoto specifico per agente lo disabilita per tale agente) e un override del modello specifico per l'operazione ha la precedenza su entrambi. Le attività di utilità effettuano chiamate separate al modello e inviano contenuti specifici dell'attività al provider del modello selezionato. La generazione dei titoli della dashboard invia al massimo i primi 1.000 caratteri del primo messaggio che non sia un comando; la narrazione invia la richiesta in ingresso insieme a riepiloghi compatti e oscurati degli strumenti. Scegliere un provider conforme ai propri requisiti di costo e trattamento dei dati.
- `imageModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Viene utilizzato dal percorso dello strumento `image` come configurazione del modello di visione quando il modello attivo non può accettare immagini. I modelli con visione nativa ricevono invece direttamente i byte delle immagini caricate.
  - Viene utilizzato anche come instradamento di fallback quando il modello selezionato o predefinito non può accettare immagini in input.
  - Preferire riferimenti `provider/model` espliciti. Gli ID senza qualificatore sono accettati per compatibilità; se un ID senza qualificatore corrisponde in modo univoco a una voce configurata in grado di elaborare immagini in `models.providers.*.models`, OpenClaw lo qualifica con tale provider. Le corrispondenze configurate ambigue richiedono un prefisso del provider esplicito.
- `imageGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Viene utilizzato dalla funzionalità condivisa di generazione di immagini e da qualsiasi futura superficie di strumenti o Plugin che generi immagini.
  - Valori tipici: `google/gemini-3.1-flash-image-preview` per la generazione nativa di immagini Gemini, `fal/fal-ai/flux/dev` per fal, `openai/gpt-image-2` per OpenAI Images oppure `openai/gpt-image-1.5` per l'output OpenAI PNG/WebP con sfondo trasparente.
  - Se si seleziona direttamente un provider/modello, configurare anche l'autenticazione del provider corrispondente (ad esempio `GEMINI_API_KEY` o `GOOGLE_API_KEY` per `google/*`, `OPENAI_API_KEY` o OpenAI Codex OAuth per `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` per `fal/*`).
  - Se omesso, `image_generate` può comunque determinare un provider predefinito dotato di autenticazione. Prova prima il provider predefinito corrente, quindi i restanti provider registrati per la generazione di immagini in ordine di ID del provider.
- `musicGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Viene utilizzato dalla funzionalità condivisa di generazione musicale e dallo strumento integrato `music_generate`.
  - Valori tipici: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oppure `minimax/music-2.6`.
  - Se omesso, `music_generate` può comunque determinare un provider predefinito dotato di autenticazione. Prova prima il provider predefinito corrente, quindi i restanti provider registrati per la generazione musicale in ordine di ID del provider.
  - Se si seleziona direttamente un provider/modello, configurare anche l'autenticazione o la chiave API del provider corrispondente.
- `videoGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Viene utilizzato dalla funzionalità condivisa di generazione video e dallo strumento integrato `video_generate`.
  - Valori tipici: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oppure `qwen/wan2.7-r2v`.
  - Se omesso, `video_generate` può comunque determinare un provider predefinito dotato di autenticazione. Prova prima il provider predefinito corrente, quindi i restanti provider registrati per la generazione video in ordine di ID del provider.
  - Se si seleziona direttamente un provider/modello, configurare anche l'autenticazione o la chiave API del provider corrispondente.
  - Il Plugin ufficiale di Qwen per la generazione video supporta fino a 1 video di output, 1 immagine di input, 4 video di input, una durata di 10 secondi e le opzioni a livello di provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Viene utilizzato dallo strumento `pdf` per l'instradamento del modello.
  - Se omesso, lo strumento PDF utilizza come fallback `imageModel`, quindi il modello risolto per la sessione o quello predefinito.
- `pdfMaxBytesMb`: limite predefinito per le dimensioni dei PDF dello strumento `pdf` quando `maxBytesMb` non viene passato al momento della chiamata.
- `pdfMaxPages`: numero massimo predefinito di pagine considerate dalla modalità di fallback per l'estrazione nello strumento `pdf`.
- `verboseDefault`: livello di verbosità predefinito per gli agenti. Valori: `"off"`, `"on"`, `"full"`. Valore predefinito: `"off"`.
- `toolProgressDetail`: modalità di dettaglio per i riepiloghi dello strumento `/verbose` e le righe degli strumenti nelle bozze di avanzamento. Valori: `"explain"` (predefinito, etichette sintetiche e leggibili) oppure `"raw"` (aggiunge il comando o il dettaglio non elaborato, quando disponibile). Il valore `agents.list[].toolProgressDetail` specifico per agente sostituisce questa impostazione predefinita.
- `reasoningDefault`: visibilità predefinita del ragionamento per gli agenti. Valori: `"off"`, `"on"`, `"stream"`. Il valore `agents.list[].reasoningDefault` specifico per agente sostituisce questa impostazione predefinita. Le impostazioni predefinite del ragionamento configurate vengono applicate solo per proprietari, mittenti autorizzati o contesti Gateway di amministratori operatori, quando non è impostato alcun override del ragionamento per messaggio o sessione.
- `elevatedDefault`: livello predefinito dell'output con privilegi elevati per gli agenti. Valori: `"off"`, `"on"`, `"ask"`, `"full"`. Valore predefinito: `"on"`.
- `model.primary`: formato `provider/model` (ad esempio `openai/gpt-5.6-sol` per l'accesso OAuth di Codex). Se si omette il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca tra i provider configurati per l'ID esatto del modello e solo successivamente utilizza come fallback il provider predefinito configurato (comportamento di compatibilità deprecato; preferire quindi `provider/model` esplicito). Se tale provider non espone più il modello predefinito configurato, OpenClaw utilizza come fallback il primo provider/modello configurato anziché segnalare un valore predefinito obsoleto relativo a un provider rimosso.
- `models`: il catalogo dei modelli configurato e l'elenco consentito per `/model`. Ogni voce può includere `alias` (scorciatoia) e `params` (specifico del provider, ad esempio `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, instradamento `provider` di OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Utilizzare voci `provider/*` come `"openai/*": {}` o `"vllm/*": {}` per mostrare tutti i modelli rilevati per i provider selezionati senza elencare manualmente ogni ID di modello.
  - Aggiungere `agentRuntime` a una voce `provider/*` quando tutti i modelli rilevati dinamicamente per tale provider devono utilizzare lo stesso runtime. La politica di runtime `provider/model` esatta mantiene comunque la precedenza sul carattere jolly.
  - Modifiche sicure: utilizzare `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci. `config set` rifiuta le sostituzioni che rimuoverebbero voci esistenti dall'elenco consentito, a meno che non venga passato `--replace`.
  - I flussi di configurazione/onboarding circoscritti al provider uniscono in questa mappa i modelli del provider selezionato e conservano i provider non correlati già configurati.
  - Per i modelli OpenAI Responses diretti, la Compaction lato server viene abilitata automaticamente. Utilizzare `params.responsesServerCompaction: false` per interrompere l'inserimento di `context_management` oppure `params.responsesCompactThreshold` per sostituire la soglia. Consultare [Compaction lato server di OpenAI](/it/providers/openai#advanced-configuration).
- `params`: parametri globali predefiniti del provider applicati a tutti i modelli. Impostare in `agents.defaults.params` (ad esempio `{ cacheRetention: "long" }`).
- Precedenza di unione di `params` (configurazione): `agents.defaults.params` (base globale) viene sostituito da `agents.defaults.models["provider/model"].params` (per modello), quindi `agents.list[].params` (ID agente corrispondente) sostituisce i valori per chiave. Per i dettagli, consultare [Caching dei prompt](/it/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: politica predefinita di instradamento dei provider valida per l'intero OpenRouter. OpenClaw la inoltra all'oggetto `provider` della richiesta di OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` per modello e i parametri dell'agente sostituiscono i valori per chiave. Consultare [Instradamento dei provider di OpenRouter](/it/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avanzato inoltrato senza modifiche e unito nei corpi delle richieste `api: "openai-completions"` per proxy compatibili con OpenAI. In caso di conflitto con le chiavi di richiesta generate, prevale il corpo aggiuntivo; le route di completamento non native rimuovono comunque in seguito `store`, specifico di OpenAI.
- `params.chat_template_kwargs`: argomenti dei template di chat compatibili con vLLM/OpenAI uniti nei corpi delle richieste `api: "openai-completions"` di primo livello. Per `vllm/nemotron-3-*` con il ragionamento disattivato, il Plugin vLLM incluso invia automaticamente `enable_thinking: false` e `force_nonempty_content: true`; i valori `chat_template_kwargs` espliciti sostituiscono le impostazioni predefinite generate e `extra_body.chat_template_kwargs` mantiene la precedenza finale. I modelli di ragionamento Qwen e Nemotron configurati per vLLM espongono scelte binarie `/think` (`off`, `on`) anziché la scala di intensità multilivello.
- `compat.thinkingFormat`: stile del payload di ragionamento compatibile con OpenAI. Utilizzare `"together"` per `reasoning.enabled` in stile Together, `"qwen"` per `enable_thinking` di primo livello in stile Qwen oppure `"qwen-chat-template"` per `chat_template_kwargs.enable_thinking` sui backend della famiglia Qwen che supportano argomenti del template di chat a livello di richiesta, come vLLM. OpenClaw associa il ragionamento disabilitato a `false` e quello abilitato a `true`; i modelli Qwen configurati per vLLM espongono scelte binarie `/think` per questi formati.
- `compat.supportedReasoningEfforts`: elenco per modello dei livelli di intensità del ragionamento compatibili con OpenAI. Includere `"xhigh"` per gli endpoint personalizzati che lo accettano effettivamente; OpenClaw espone quindi `/think xhigh` nei menu dei comandi, nelle righe delle sessioni del Gateway, nella convalida delle patch delle sessioni, nella convalida della CLI dell'agente e nella convalida di `llm-task` per quel provider/modello configurato. Utilizzare `compat.reasoningEffortMap` quando il backend richiede un valore specifico del provider per un livello canonico.
- `params.preserveThinking`: opzione di consenso esplicito, riservata a Z.AI, per conservare il ragionamento. Quando è abilitata e il ragionamento è attivo, OpenClaw invia `thinking.clear_thinking: false` e riproduce i precedenti `reasoning_content`; consultare [Ragionamento e conservazione del ragionamento di Z.AI](/it/providers/zai#advanced-configuration).
- `localService`: gestore di processi facoltativo a livello di provider per server di modelli locali/self-hosted. Quando il modello selezionato appartiene a tale provider, OpenClaw verifica `healthUrl` (o `baseUrl + "/models"`), avvia `command` con `args` se l'endpoint non è disponibile, attende fino a `readyTimeoutMs`, quindi invia la richiesta al modello. `command` deve essere un percorso assoluto. `idleStopMs: 0` mantiene attivo il processo fino alla chiusura di OpenClaw; un valore positivo arresta il processo avviato da OpenClaw dopo il numero specificato di millisecondi di inattività. Consultare [Servizi di modelli locali](/it/gateway/local-model-services).
- I criteri di runtime devono essere definiti nei provider o nei modelli, non in `agents.defaults`. Usare `models.providers.<provider>.agentRuntime` per le regole applicabili all'intero provider oppure `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` per le regole specifiche del modello. Il solo prefisso del provider/modello non seleziona mai un harness. Se il runtime non è impostato o è `auto`, OpenAI può selezionare implicitamente Codex solo per una route HTTPS ufficiale esatta Platform Responses o ChatGPT Responses, senza alcuna sostituzione definita nella richiesta. Consultare [runtime dell'agente implicito di OpenAI](/it/providers/openai#implicit-agent-runtime).
- Gli strumenti di scrittura della configurazione che modificano questi campi (ad esempio `/models set`, `/models set-image` e i comandi per aggiungere/rimuovere fallback) salvano la forma canonica dell'oggetto e, ove possibile, mantengono gli elenchi di fallback esistenti.
- `maxConcurrent`: numero massimo di esecuzioni parallele di agenti tra le sessioni (ogni sessione rimane comunque serializzata). Valore predefinito: `4`.

### Criteri di runtime

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, un id di harness di Plugin registrato o un alias di backend CLI supportato. Il Plugin Codex incluso registra `codex`; il Plugin Anthropic incluso fornisce il backend CLI `claude-cli`.
- `id: "auto"` consente agli harness di Plugin registrati di gestire le route effettive che dichiarano o soddisfano in altro modo il relativo contratto di supporto e usa OpenClaw quando nessun harness corrisponde. Un runtime di Plugin esplicito come `id: "codex"` richiede tale harness e una route effettiva compatibile; in caso di indisponibilità di uno dei due o di errore di esecuzione, genera un errore senza ripiego.
- `id: "pi"` è accettato solo come alias deprecato di `openclaw` per preservare le configurazioni distribuite con v2026.5.22 e versioni precedenti. Le nuove configurazioni devono usare `openclaw`.
- La precedenza del runtime applica prima i criteri del modello esatto (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` o `models.providers.<provider>.models[]`), quindi `agents.list[]` / `agents.defaults.models["provider/*"]` e infine i criteri a livello di provider in `models.providers.<provider>.agentRuntime`.
- Le chiavi di runtime per l'intero agente sono obsolete. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, i vincoli del runtime di sessione e `OPENCLAW_AGENT_RUNTIME` vengono ignorati dalla selezione del runtime. Eseguire `openclaw doctor --fix` per rimuovere i valori obsoleti.
- Le route HTTPS ufficiali OpenAI Responses/ChatGPT esatte e idonee, prive di sostituzioni esplicite nella richiesta, possono usare implicitamente l'harness Codex. Il valore `agentRuntime.id: "codex"` del provider/modello rende Codex un requisito senza ripiego in caso di errore, ma non rende compatibile una route incompatibile.
- Per le distribuzioni Claude CLI, preferire `model: "anthropic/claude-opus-4-8"` insieme a `agentRuntime.id: "claude-cli"` con ambito di modello. I riferimenti `claude-cli/<model>` obsoleti continuano a funzionare per compatibilità, ma le nuove configurazioni devono mantenere canonica la selezione di provider/modello e specificare il backend di esecuzione nei criteri di runtime del provider/modello.
- Questa impostazione controlla solo l'esecuzione dei turni testuali dell'agente. La generazione multimediale, la visione, i PDF, la musica, i video e il TTS continuano a usare le rispettive impostazioni di provider/modello.

**Abbreviazioni degli alias integrate** (si applicano solo quando il modello è in `agents.defaults.models`):

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

Gli alias configurati hanno sempre la precedenza sui valori predefiniti.

I modelli Z.AI GLM-4.x abilitano automaticamente la modalità di ragionamento, a meno che non venga impostato `--thinking off` o definito direttamente `agents.defaults.models["zai/<model>"].params.thinking`.
I modelli Z.AI abilitano `tool_stream` per impostazione predefinita per lo streaming delle chiamate agli strumenti. Impostare `agents.defaults.models["zai/<model>"].params.tool_stream` su `false` per disabilitarlo.
In OpenClaw, Anthropic Claude Opus 4.8 mantiene il ragionamento disattivato per impostazione predefinita; quando il ragionamento adattivo viene abilitato esplicitamente, il valore predefinito dell'impegno gestito dal provider Anthropic è `high`. I modelli Claude 4.6 usano per impostazione predefinita `adaptive` quando non è impostato esplicitamente alcun livello di ragionamento.

### `agents.defaults.cliBackends`

Backend CLI facoltativi per esecuzioni di ripiego esclusivamente testuali (senza chiamate agli strumenti). Utili come riserva quando i provider API non funzionano.

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
          // In alternativa, usare systemPromptFileArg quando la CLI accetta un flag per il file del prompt.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- I backend CLI sono progettati principalmente per il testo; gli strumenti sono sempre disabilitati.
- Le sessioni sono supportate quando è impostato `sessionArg`.
- Il pass-through delle immagini è supportato quando `imageArg` accetta percorsi di file.
- `reseedFromRawTranscriptWhenUncompacted: true` consente a un backend di recuperare in modo sicuro
  le sessioni invalidate da una parte finale limitata della trascrizione OpenClaw non elaborata prima che
  sia disponibile il primo riepilogo di Compaction. Le modifiche al profilo di autenticazione o all'epoca delle credenziali
  non eseguono comunque mai un nuovo seeding dai dati non elaborati.

### `agents.defaults.promptOverlays`

Sovrapposizioni del prompt indipendenti dal provider, applicate in base alla famiglia del modello sulle superfici del prompt assemblate da OpenClaw. Gli id dei modelli della famiglia GPT-5 ricevono il contratto di comportamento condiviso su tutte le route OpenClaw/provider; `personality` controlla solo il livello dello stile di interazione cordiale. Le route native dell'app-server Codex mantengono le istruzioni di base e del modello gestite da Codex anziché questa sovrapposizione GPT-5 di OpenClaw, e OpenClaw disabilita la personalità integrata di Codex per i thread nativi.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // cordiale | attiva | disattiva
        },
      },
    },
  },
}
```

- `"friendly"` (valore predefinito) e `"on"` abilitano il livello dello stile di interazione cordiale.
- `"off"` disabilita solo il livello cordiale; il contratto di comportamento GPT-5 contrassegnato rimane abilitato.
- Il valore obsoleto `plugins.entries.openai.config.personality` viene ancora letto quando questa impostazione condivisa non è definita.

### `agents.defaults.heartbeat`

Esecuzioni periodiche di Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disabilita
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // valore predefinito: true; false omette la sezione Heartbeat dal prompt di sistema
        lightContext: false, // valore predefinito: false; true mantiene solo HEARTBEAT.md dai file di bootstrap dello spazio di lavoro
        isolatedSession: false, // valore predefinito: false; true esegue ogni Heartbeat in una nuova sessione (senza cronologia della conversazione)
        skipWhenBusy: false, // valore predefinito: false; true attende anche le corsie del sottoagente/annidate di questo agente
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (valore predefinito) | block
        target: "none", // valore predefinito: none | opzioni: last | whatsapp | telegram | discord | ...
        prompt: "Leggi HEARTBEAT.md se esiste...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: stringa di durata (ms/s/m/h). Valore predefinito: `30m` (autenticazione tramite chiave API) o `1h` (autenticazione OAuth). Impostare su `0m` per disabilitare.
- `includeSystemPromptSection`: quando è false, omette la sezione Heartbeat dal prompt di sistema e non inserisce `HEARTBEAT.md` nel contesto di bootstrap. Valore predefinito: `true`.
- `suppressToolErrorWarnings`: quando è true, elimina i payload degli avvisi di errore degli strumenti durante le esecuzioni di Heartbeat.
- `timeoutSeconds`: tempo massimo in secondi consentito per un turno dell'agente Heartbeat prima dell'interruzione. Lasciare non impostato per usare `agents.defaults.timeoutSeconds`, se definito; in caso contrario viene usata la cadenza di Heartbeat, con un limite massimo di 600 secondi.
- `directPolicy`: criterio di consegna diretta/DM. `allow` (valore predefinito) consente la consegna a destinazioni dirette. `block` impedisce la consegna a destinazioni dirette ed emette `reason=dm-blocked`.
- `lightContext`: quando è true, le esecuzioni di Heartbeat usano un contesto di bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file di bootstrap dello spazio di lavoro.
- `isolatedSession`: quando è true, ogni Heartbeat viene eseguito in una nuova sessione senza la cronologia delle conversazioni precedenti. Usa lo stesso modello di isolamento di Cron `sessionTarget: "isolated"`. Riduce il costo in token per Heartbeat da ~100K a ~2-5K token.
- `skipWhenBusy`: quando è true, le esecuzioni di Heartbeat vengono rinviate se le corsie aggiuntive dell'agente sono occupate: il lavoro del relativo sottoagente associato alla chiave di sessione o dei comandi annidati. Le corsie Cron rinviano sempre gli Heartbeat, anche senza questo flag.
- Per agente: impostare `agents.list[].heartbeat`. Quando un agente qualsiasi definisce `heartbeat`, **solo tali agenti** eseguono gli Heartbeat.
- Gli Heartbeat eseguono turni completi dell'agente: intervalli più brevi consumano più token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id di un Plugin provider di Compaction registrato (facoltativo)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Conserva esattamente gli ID di distribuzione, gli ID dei ticket e le coppie host:porta.", // usato quando identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // controllo facoltativo della pressione del ciclo degli strumenti
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // abilita il reinserimento delle sezioni di AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // sostituzione facoltativa del modello solo per la Compaction
        truncateAfterCompaction: true, // passa a un file JSONL successivo più piccolo dopo la Compaction
        maxActiveTranscriptBytes: "20mb", // attivatore facoltativo della Compaction locale preliminare
        notifyUser: true, // notifiche all'avvio/completamento della Compaction e in caso di degradazione dello svuotamento della memoria (valore predefinito: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // sostituzione facoltativa del modello solo per lo svuotamento della memoria
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "La sessione si avvicina alla Compaction. Memorizza ora i ricordi persistenti.",
          prompt: "Scrivi eventuali note durature in memory/YYYY-MM-DD.md; se non c'è nulla da memorizzare, rispondi con l'esatto token silenzioso NO_REPLY.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (riepilogo suddiviso in blocchi per cronologie lunghe). Vedere [Compaction](/it/concepts/compaction).
- `provider`: ID di un Plugin provider di Compaction registrato. Quando è impostato, viene chiamato `summarize()` del provider anziché il riepilogo LLM integrato. In caso di errore, viene usato quello integrato. L'impostazione di un provider forza `mode: "safeguard"`. Vedere [Compaction](/it/concepts/compaction).
- `timeoutSeconds`: numero massimo di secondi consentito per una singola operazione di Compaction prima che OpenClaw la interrompa. Valore predefinito: `180`.
- `reserveTokens`: margine di token mantenuto disponibile per l'output del modello e i futuri risultati degli strumenti dopo la Compaction. Quando la finestra di contesto del modello è nota, OpenClaw limita la riserva effettiva affinché non consumi il budget del prompt.
- `reserveTokensFloor`: riserva minima applicata dal runtime incorporato. Impostare `0` per disabilitare il limite minimo. Il limite minimo resta soggetto al limite massimo della finestra di contesto attiva.
- `keepRecentTokens`: budget del punto di taglio dell'agente per mantenere testualmente la parte finale più recente della trascrizione. Il comando manuale `/compact` rispetta questo valore quando è impostato esplicitamente; in caso contrario, la Compaction manuale costituisce un checkpoint rigido.
- `recentTurnsPreserve`: numero di turni utente/assistente più recenti mantenuti testualmente al di fuori del riepilogo di salvaguardia. Valore predefinito: `3`.
- `maxHistoryShare`: frazione massima del budget di contesto totale consentita per la cronologia conservata dopo la Compaction (intervallo `0.1`-`0.9`).
- `identifierPolicy`: `strict` (valore predefinito), `off` o `custom`. `strict` antepone indicazioni integrate per la conservazione degli identificatori opachi durante il riepilogo della Compaction.
- `identifierInstructions`: testo personalizzato facoltativo per la conservazione degli identificatori, usato quando `identifierPolicy=custom`.
- `qualityGuard`: controlli di nuovo tentativo in caso di output non valido per i riepiloghi di salvaguardia. Abilitati per impostazione predefinita in modalità salvaguardia; impostare `enabled: false` per ignorare la verifica.
- `midTurnPrecheck`: controllo facoltativo della pressione del ciclo degli strumenti. Quando `enabled: true`, OpenClaw controlla la pressione del contesto dopo l'aggiunta dei risultati degli strumenti e prima della chiamata successiva al modello. Se il contesto non è più contenibile, interrompe il tentativo corrente prima di inviare il prompt e riutilizza il percorso di ripristino del controllo preliminare esistente per troncare i risultati degli strumenti oppure eseguire la Compaction e riprovare. Funziona con entrambe le modalità di Compaction `default` e `safeguard`. Valore predefinito: disabilitato.
- `postIndexSync`: modalità di reindicizzazione della memoria di sessione dopo la Compaction. Valore predefinito: `"async"`. Usare `"await"` per la massima attualità, `"async"` per una latenza di Compaction inferiore oppure `"off"` solo quando la sincronizzazione della memoria di sessione viene gestita altrove.
- `postCompactionSections`: nomi facoltativi di sezioni H2/H3 di AGENTS.md da reinserire dopo la Compaction. Il reinserimento è disabilitato quando il valore non è impostato o è impostato su `[]`. L'impostazione esplicita di `["Session Startup", "Red Lines"]` abilita tale coppia e mantiene il fallback precedente `Every Session`/`Safety`. Abilitare questa opzione solo quando il contesto aggiuntivo giustifica il rischio di duplicare le indicazioni del progetto già incluse nel riepilogo della Compaction.
- `model`: `provider/model-id` facoltativo o alias semplice da `agents.defaults.models`, usato esclusivamente per il riepilogo della Compaction. Gli alias semplici vengono risolti prima dell'invio; in caso di collisione, gli ID modello letterali configurati mantengono la precedenza. Usare questa opzione quando la sessione principale deve mantenere un modello, ma i riepiloghi della Compaction devono essere eseguiti su un altro; se non impostata, la Compaction usa il modello principale della sessione.
- `truncateAfterCompaction`: ruota la trascrizione della sessione attiva dopo la Compaction, in modo che i turni futuri carichino solo il riepilogo e la parte finale non riepilogata, mentre la trascrizione completa precedente resta archiviata. Impedisce la crescita illimitata della trascrizione attiva nelle sessioni di lunga durata. Valore predefinito: `false`.
- `maxActiveTranscriptBytes`: soglia facoltativa in byte (`number` o stringhe come `"20mb"`) che attiva la normale Compaction locale prima di un'esecuzione quando la cronologia della trascrizione supera la soglia. Richiede `truncateAfterCompaction`, affinché una Compaction riuscita possa passare a una trascrizione successiva più piccola. Disabilitata quando non impostata o quando è `0`.
- `notifyUser`: quando `true`, invia all'utente brevi notifiche sulla manutenzione del contesto: quando la Compaction inizia e termina (ad esempio, "Compattazione del contesto in corso..." e "Compattazione completata") e quando lo svuotamento della memoria precedente alla Compaction esaurisce le risorse, per cui la risposta prosegue in uno stato degradato (ad esempio, "La manutenzione della memoria è temporaneamente non riuscita; la risposta prosegue."). Disabilitato per impostazione predefinita per non mostrare queste notifiche.
- `memoryFlush`: turno agentico silenzioso prima della Compaction automatica per archiviare memorie persistenti. Impostare `model` su un provider/modello esatto, ad esempio `ollama/qwen3:8b`, quando questo turno di manutenzione deve rimanere su un modello locale; la sostituzione non eredita la catena di fallback della sessione attiva. `forceFlushTranscriptBytes` forza lo svuotamento quando la dimensione della trascrizione raggiunge la soglia, anche se i contatori dei token non sono aggiornati. Viene ignorato quando lo spazio di lavoro è di sola lettura.

### `agents.defaults.runRetries`

Limiti delle iterazioni dei nuovi tentativi del ciclo di esecuzione esterno per il runtime dell'agente incorporato, volti a impedire cicli di esecuzione infiniti durante il ripristino da errori. Questa impostazione si applica solo al runtime dell'agente incorporato, non ai runtime ACP o CLI.

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
        runRetries: { max: 50 }, // sostituzioni facoltative per agente
      },
    ],
  },
}
```

- `base`: numero base di iterazioni dei nuovi tentativi di esecuzione per il ciclo di esecuzione esterno. Valore predefinito: `24`.
- `perProfile`: iterazioni aggiuntive dei nuovi tentativi di esecuzione concesse per ciascun candidato del profilo di fallback. Valore predefinito: `8`.
- `min`: limite assoluto minimo per le iterazioni dei nuovi tentativi di esecuzione. Valore predefinito: `32`.
- `max`: limite assoluto massimo per le iterazioni dei nuovi tentativi di esecuzione, volto a impedire esecuzioni incontrollate. Valore predefinito: `160`.

### `agents.defaults.contextPruning`

Rimuove i **vecchi risultati degli strumenti** dal contesto in memoria prima dell'invio all'LLM. **Non** modifica la cronologia della sessione su disco. Disabilitato per impostazione predefinita; impostare `mode: "cache-ttl"` per abilitarlo.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (predefinito) | cache-ttl
        ttl: "1h", // durata (ms/s/m/h), unità predefinita: minuti; valore predefinito: 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Contenuto del vecchio risultato dello strumento cancellato]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamento della modalità cache-ttl">

- `mode: "cache-ttl"` abilita i passaggi di eliminazione.
- `ttl` determina la frequenza con cui l'eliminazione può essere eseguita di nuovo (dopo l'ultimo aggiornamento della cache). Valore predefinito: `5m`.
- L'eliminazione prima tronca parzialmente i risultati degli strumenti troppo grandi, quindi, se necessario, cancella completamente quelli meno recenti.
- `softTrimRatio` e `hardClearRatio` accettano valori da `0.0` a `1.0`; la convalida della configurazione rifiuta i valori esterni a tale intervallo.

Il **troncamento parziale** mantiene l'inizio e la fine e inserisce `...` al centro.

La **cancellazione completa** sostituisce l'intero risultato dello strumento con il segnaposto.

Note:

- I blocchi di immagini non vengono mai troncati o cancellati.
- I rapporti sono basati sui caratteri (in modo approssimativo), non sul conteggio esatto dei token.
- Se sono presenti meno di `keepLastAssistants` messaggi dell'assistente, l'eliminazione viene ignorata.

</Accordion>

Per i dettagli sul comportamento, vedere [Eliminazione della sessione](/it/concepts/session-pruning).

### Streaming a blocchi

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (predefinito) | natural | custom (usa minMs/maxMs)
    },
  },
}
```

- I canali diversi da Telegram richiedono `*.streaming.block.enabled: true` esplicito per abilitare le risposte a blocchi. QQ Bot costituisce un'eccezione: non dispone di chiavi `streaming.block` e trasmette le risposte a blocchi, a meno che `channels.qqbot.streaming.mode` non sia `"off"`.
- Sostituzioni per canale: `channels.<channel>.streaming.block.coalesce` (e varianti per account). Discord, Google Chat, Mattermost, MS Teams, Signal e Slack usano per impostazione predefinita `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: limite preferito dei blocchi (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: pausa casuale tra le risposte a blocchi. Valore predefinito: `off`. `natural` = 800-2500ms. `custom` usa `minMs`/`maxMs` (per ogni limite non impostato, viene usato l'intervallo naturale). Sostituzione per agente: `agents.list[].humanDelay`.

Per i dettagli sul comportamento e sulla suddivisione in blocchi, vedere [Streaming](/it/concepts/streaming).

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

- Valori predefiniti: `instant` per chat dirette/menzioni, `message` per chat di gruppo senza menzioni.
- Valore predefinito di `typingIntervalSeconds`: `6`.
- Sostituzioni per sessione: `session.typingMode`, `session.typingIntervalSeconds`.

Vedere [Indicatori di digitazione](/it/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Esecuzione facoltativa in sandbox per l'agente incorporato. Per la guida completa, vedere [Esecuzione in sandbox](/it/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (default) | non-main | all
        backend: "docker", // docker (default) | ssh | openshell
        scope: "agent", // session | agent (default) | shared
        workspaceAccess: "none", // none (default) | ro | rw
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
          gpus: "all",
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

I valori predefiniti mostrati sopra (`off`/`docker`/`agent`/`none`/immagine `bookworm-slim`/rete `none`/ecc.) sono i valori predefiniti effettivi di OpenClaw, non semplici valori illustrativi.

<Accordion title="Dettagli della sandbox">

**Backend:**

- `docker`: runtime Docker locale (predefinito)
- `ssh`: runtime remoto generico basato su SSH
- `openshell`: runtime OpenShell

Quando si seleziona `backend: "openshell"`, le impostazioni specifiche del runtime vengono spostate in
`plugins.entries.openshell.config`.

**Configurazione del backend SSH:**

- `target`: destinazione SSH nel formato `user@host[:port]`
- `command`: comando del client SSH (predefinito: `ssh`)
- `workspaceRoot`: radice remota assoluta usata per gli spazi di lavoro di ciascun ambito (predefinita: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: file locali esistenti passati a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenuti incorporati o SecretRef che OpenClaw materializza in file temporanei durante il runtime
- `strictHostKeyChecking` / `updateHostKeys`: opzioni dei criteri per le chiavi host di OpenSSH (entrambe con valore predefinito `true`)

**Precedenza dell'autenticazione SSH:**

- `identityData` ha la precedenza su `identityFile`
- `certificateData` ha la precedenza su `certificateFile`
- `knownHostsData` ha la precedenza su `knownHostsFile`
- I valori `*Data` basati su SecretRef vengono risolti dall'istantanea attiva del runtime dei segreti prima dell'avvio della sessione sandbox

**Comportamento del backend SSH:**

- inizializza lo spazio di lavoro remoto una volta dopo la creazione o la ricreazione
- quindi mantiene canonico lo spazio di lavoro SSH remoto
- instrada `exec`, gli strumenti per i file e i percorsi multimediali tramite SSH
- non sincronizza automaticamente con l'host le modifiche remote
- non supporta i container del browser della sandbox

**Accesso allo spazio di lavoro:**

- `none`: spazio di lavoro della sandbox per ciascun ambito in `~/.openclaw/sandboxes` (predefinito)
- `ro`: spazio di lavoro della sandbox in `/workspace`, spazio di lavoro dell'agente montato in sola lettura in `/agent`
- `rw`: spazio di lavoro dell'agente montato in lettura/scrittura in `/workspace`

**Ambito:**

- `session`: container e spazio di lavoro per ogni sessione
- `agent`: un container e uno spazio di lavoro per ogni agente (predefinito)
- `shared`: container e spazio di lavoro condivisi (nessun isolamento tra sessioni)

**Configurazione del plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (default) | remote
          command: "openshell",
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

- `mirror`: inizializza l'ambiente remoto da quello locale prima dell'esecuzione e lo sincronizza al termine; lo spazio di lavoro locale rimane canonico
- `remote`: inizializza l'ambiente remoto una volta alla creazione della sandbox, quindi mantiene canonico lo spazio di lavoro remoto

In modalità `remote`, le modifiche locali sull'host effettuate al di fuori di OpenClaw non vengono sincronizzate automaticamente nella sandbox dopo la fase di inizializzazione.
Il trasporto avviene tramite SSH nella sandbox OpenShell, ma il plugin gestisce il ciclo di vita della sandbox e la sincronizzazione speculare facoltativa.

**`setupCommand`** viene eseguito una sola volta dopo la creazione del container (tramite `sh -lc`). Richiede accesso di rete in uscita, radice scrivibile e utente root.

**Per impostazione predefinita, i container usano `network: "none"`** — impostare `"bridge"` (o una rete bridge personalizzata) se l'agente necessita di accesso in uscita.
`"host"` è bloccato. `"container:<id>"` è bloccato per impostazione predefinita, a meno che non si imposti esplicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (misura di emergenza).
I turni del server applicativo Codex in una sandbox OpenClaw attiva usano la stessa impostazione per l'accesso di rete nativo in modalità codice.

**Gli allegati in ingresso** vengono predisposti in `media/inbound/*` nello spazio di lavoro attivo.

**`docker.binds`** monta directory host aggiuntive; i mount globali e quelli per agente vengono uniti.

**Browser nella sandbox** (`sandbox.browser.enabled`, valore predefinito `false`): Chromium + CDP in un container. L'URL noVNC viene inserito nel prompt di sistema. Non richiede `browser.enabled` in `openclaw.json`.
L'accesso di osservazione noVNC usa per impostazione predefinita l'autenticazione VNC e OpenClaw emette un URL con token di breve durata, invece di esporre la password nell'URL condiviso.

- `allowHostControl: false` (predefinito) impedisce alle sessioni nella sandbox di indirizzarsi al browser dell'host.
- `network` usa per impostazione predefinita `openclaw-sandbox-browser` (rete bridge dedicata). Impostare `bridge` solo quando si desidera esplicitamente la connettività bridge globale. Anche `"host"` è bloccato in questo caso.
- `cdpSourceRange` limita facoltativamente l'ingresso CDP sul perimetro del container a un intervallo CIDR (ad esempio `172.21.0.1/32`).
- `sandbox.browser.binds` monta directory host aggiuntive esclusivamente nel container del browser della sandbox. Quando è impostato (incluso `[]`), sostituisce `docker.binds` per il container del browser.
- Chromium nel container del browser della sandbox viene sempre avviato con `--no-sandbox --disable-setuid-sandbox` (i container non dispongono delle primitive del kernel necessarie alla sandbox di Chrome); non esiste un'opzione di configurazione per modificarlo.
- I valori predefiniti di avvio sono definiti in `scripts/sandbox-browser-entrypoint.sh` e ottimizzati per gli host dei container:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu` e `--disable-software-rasterizer` sono
    abilitati per impostazione predefinita e possono essere disabilitati con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se l'uso di WebGL/3D lo richiede.
  - `--disable-extensions` (abilitato per impostazione predefinita); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    riabilita le estensioni se il flusso di lavoro dipende da esse.
  - `--renderer-process-limit=2` per impostazione predefinita; modificare con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, impostare `0` per usare il
    limite di processi predefinito di Chromium.
  - `--headless=new` solo quando `headless` è abilitato.
  - I valori predefiniti costituiscono la configurazione di base dell'immagine del container; per modificare i valori predefiniti del container, usare un'immagine del browser personalizzata con un
    punto di ingresso personalizzato.

</Accordion>

L'esecuzione del browser nella sandbox e `sandbox.docker.binds` sono disponibili solo con Docker.

Creare le immagini (da un checkout del codice sorgente):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Per le installazioni npm senza un checkout del codice sorgente, consultare [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup) per i comandi `docker build` incorporati.

### `agents.list` (override per agente)

Usare `agents.list[].tts` per assegnare a un agente un provider TTS, una voce, un modello,
uno stile o una modalità TTS automatica specifici. Il blocco dell'agente viene unito in profondità alla configurazione globale
`messages.tts`, consentendo di mantenere le credenziali condivise in un'unica posizione mentre i singoli
agenti sostituiscono solo i campi relativi alla voce o al provider necessari. L'override dell'agente attivo
si applica alle risposte vocali automatiche, a `/tts audio`, `/tts status` e
allo strumento agente `tts`. Consultare [Sintesi vocale](/it/tools/tts#per-agent-voice-overrides)
per esempi di provider e regole di precedenza.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Agente principale",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // oppure { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // sostituzione del livello di elaborazione per agente
        reasoningDefault: "on", // sostituzione della visibilità del ragionamento per agente
        fastModeDefault: false, // sostituzione della modalità rapida per agente
        params: { cacheRetention: "none" }, // sostituisce per chiave i parametri corrispondenti di defaults.models
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // se impostato, sostituisce agents.defaults.skills
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
            mode: "persistent", // persistent | oneshot
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

- `id`: ID stabile dell'agente (obbligatorio).
- `default`: se ne sono impostati più di uno, prevale il primo (viene registrato un avviso). Se non ne è impostato alcuno, la prima voce dell'elenco è quella predefinita.
- `model`: la forma stringa imposta un modello primario rigoroso per agente senza fallback del modello; anche la forma oggetto `{ primary }` è rigorosa, a meno che non venga aggiunto `fallbacks`. Usare `{ primary, fallbacks: [...] }` per abilitare il fallback per tale agente oppure `{ primary, fallbacks: [] }` per rendere esplicito il comportamento rigoroso. I processi Cron che sostituiscono solo `primary` continuano a ereditare i fallback predefiniti, a meno che non venga impostato `fallbacks: []`.
- `utilityModel`: sostituzione facoltativa per agente per attività interne brevi, come i titoli generati di sessioni e thread. In assenza di un valore, usa `agents.defaults.utilityModel`, quindi il modello piccolo predefinito dichiarato dal provider primario e infine il modello primario di questo agente. Una stringa vuota disabilita l'instradamento delle attività di utilità per questo agente.
- `params`: parametri del flusso per agente uniti alla voce del modello selezionata in `agents.defaults.models`. Usare questa opzione per sostituzioni specifiche dell'agente, come `cacheRetention`, `temperature` o `maxTokens`, senza duplicare l'intero catalogo dei modelli.
- `tts`: sostituzioni facoltative della sintesi vocale per agente. Il blocco viene unito in profondità a `messages.tts`; mantenere quindi le credenziali condivise dei provider e la politica di fallback in `messages.tts` e impostare qui soltanto i valori specifici della persona, come provider, voce, modello, stile o modalità automatica.
- `skills`: elenco consentito facoltativo delle Skills per agente. Se omesso, l'agente eredita `agents.defaults.skills`, se impostato; un elenco esplicito sostituisce i valori predefiniti anziché unirli e `[]` indica che non è consentita alcuna Skills.
- `thinkingDefault`: livello di elaborazione predefinito facoltativo per agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sostituisce `agents.defaults.thinkingDefault` per questo agente quando non è impostata alcuna sostituzione per messaggio o sessione. Il profilo del provider/modello selezionato determina quali valori sono validi; per Google Gemini, `adaptive` mantiene l'elaborazione dinamica gestita dal provider (`thinkingLevel` omesso in Gemini 3/3.1, `thinkingBudget: -1` in Gemini 2.5).
- `reasoningDefault`: visibilità predefinita facoltativa del ragionamento per agente (`on | off | stream`). Sostituisce `agents.defaults.reasoningDefault` per questo agente quando non è impostata alcuna sostituzione del ragionamento per messaggio o sessione.
- `fastModeDefault`: valore predefinito facoltativo della modalità rapida per agente (`"auto" | true | false`). Si applica quando non è impostata alcuna sostituzione della modalità rapida per messaggio o sessione.
- `models`: sostituzioni facoltative del catalogo dei modelli/runtime per agente, indicizzate tramite gli ID `provider/model` completi. Usare `models["provider/model"].agentRuntime` per le eccezioni del runtime per agente.
- `runtime`: descrittore facoltativo del runtime per agente. Usare `type: "acp"` con i valori predefiniti di `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando l'agente deve usare per impostazione predefinita sessioni dell'harness ACP.
- `identity.avatar`: percorso relativo all'area di lavoro, URL `http(s)` o URI `data:`.
- I file di immagine `identity.avatar` locali relativi all'area di lavoro sono limitati a 2 MB. Gli URL `http(s)` e gli URI `data:` non vengono verificati rispetto al limite di dimensione dei file locali.
- `identity` deriva i valori predefiniti: `ackReaction` da `emoji`, `mentionPatterns` da `name`/`emoji`.
- `subagents.allowAgents`: elenco consentito degli ID degli agenti configurati per destinazioni `sessions_spawn.agentId` esplicite (`["*"]` = qualsiasi destinazione configurata; valore predefinito: solo lo stesso agente). Includere l'ID del richiedente quando devono essere consentite le chiamate `agentId` indirizzate a se stesso. Le voci obsolete la cui configurazione dell'agente è stata eliminata vengono rifiutate da `sessions_spawn` e omesse da `agents_list`; eseguire `openclaw doctor --fix` per rimuoverle oppure aggiungere una voce `agents.list[]` minima se tale destinazione deve rimanere avviabile ereditando i valori predefiniti.
- Protezione dell'ereditarietà della sandbox: se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta le destinazioni che verrebbero eseguite senza sandbox.
- `subagents.requireAgentId`: quando è true, blocca le chiamate `sessions_spawn` che omettono `agentId` (impone la selezione esplicita del profilo; valore predefinito: false).
- `subagents.maxConcurrent`: numero massimo di esecuzioni simultanee di agenti figli nell'esecuzione dei sottoagenti. Valore predefinito: `8`.
- `subagents.maxChildrenPerAgent`: numero massimo di figli attivi che una singola sessione agente può avviare. Valore predefinito: `5`.
- `subagents.maxSpawnDepth`: profondità massima di annidamento per l'avvio dei sottoagenti (`1`-`5`). Valore predefinito: `1` (nessun annidamento).
- `subagents.archiveAfterMinutes`: tempo trascorso il quale lo stato dei sottoagenti completati viene archiviato. Valore predefinito: `60`.

---

## Instradamento multi-agente

Eseguire più agenti isolati all'interno di un unico Gateway. Consultare [Multi-agente](/it/concepts/multi-agent).

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

### Campi di corrispondenza delle associazioni

- `type` (facoltativo): `route` per l'instradamento normale (se il tipo è assente, il valore predefinito è route), `acp` per associazioni persistenti delle conversazioni ACP.
- `match.channel` (obbligatorio)
- `match.accountId` (facoltativo; `*` = qualsiasi account; omesso = account predefinito)
- `match.peer` (facoltativo; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (facoltativo; specifico del canale)
- `acp` (facoltativo; solo per `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordine di corrispondenza deterministico:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (esatto, senza peer/guild/team)
5. `match.accountId: "*"` (intero canale)
6. Agente predefinito

All'interno di ciascun livello, prevale la prima voce `bindings` corrispondente.

Per le voci `type: "acp"`, OpenClaw esegue la risoluzione in base all'identità esatta della conversazione (`match.channel` + account + `match.peer.id`) e non usa l'ordine dei livelli delle associazioni di instradamento indicato sopra.

### Profili di accesso per agente

<Accordion title="Accesso completo (senza sandbox)">

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

<Accordion title="Strumenti di sola lettura + area di lavoro">

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

<Accordion title="Nessun accesso al file system (solo messaggistica)">

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

Consultare [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) per i dettagli sulla precedenza.

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (predefinito) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // durata oppure false
      maxDiskBytes: "500mb", // limite rigido facoltativo
      highWaterBytes: "400mb", // obiettivo di pulizia facoltativo
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // disattivazione automatica predefinita dopo inattività, in ore (`0` la disabilita)
      maxAgeHours: 0, // età massima rigida predefinita in ore (`0` la disabilita)
    },
    mainKey: "main", // precedente (il runtime usa sempre "main")
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
  - `per-sender` (predefinito): ogni mittente dispone di una sessione isolata all'interno di un contesto di canale.
  - `global`: tutti i partecipanti a un contesto di canale condividono un'unica sessione (utilizzare solo quando è previsto un contesto condiviso).
- **`dmScope`**: modalità di raggruppamento dei messaggi diretti.
  - `main`: tutti i messaggi diretti condividono la sessione principale.
  - `per-peer`: isolamento per ID mittente tra i vari canali.
  - `per-channel-peer`: isolamento per canale + mittente (consigliato per le caselle di posta multiutente).
  - `per-account-channel-peer`: isolamento per account + canale + mittente (consigliato per configurazioni multi-account).
- **`identityLinks`**: associa gli ID canonici ai peer con prefisso del provider per condividere le sessioni tra canali. I comandi di aggancio come `/dock_discord` utilizzano la stessa mappa per trasferire il percorso di risposta della sessione attiva a un altro peer di canale collegato; vedere [Aggancio dei canali](/it/concepts/channel-docking).
- **`reset`**: criterio di reimpostazione principale. `daily` esegue la reimpostazione alle `atHour` ora locale; `idle` esegue la reimpostazione dopo `idleMinutes`. Quando sono configurati entrambi, prevale quello che scade per primo. La validità della reimpostazione giornaliera utilizza `sessionStartedAt` della riga della sessione; la validità della reimpostazione per inattività utilizza `lastInteractionAt`. Le scritture di eventi in background/di sistema, come Heartbeat, riattivazioni Cron, notifiche di esecuzione e operazioni amministrative del Gateway, possono aggiornare `updatedAt`, ma non mantengono valide le sessioni giornaliere/per inattività.
- **`resetByType`**: sostituzioni specifiche per tipo (`direct`, `group`, `thread`). Il valore legacy `dm` è accettato come alias di `direct`.
- **`resetByChannel`**: sostituzioni della reimpostazione per canale, indicizzate per ID provider/canale. Quando il canale della sessione dispone di una voce corrispondente, questa prevale completamente su `resetByType`/`reset` per quella sessione. Utilizzare solo quando un canale richiede un comportamento di reimpostazione diverso dal criterio a livello di tipo.
- **`mainKey`**: campo legacy. Il runtime utilizza sempre `"main"` per il contenitore principale delle chat dirette.
- **`agentToAgent.maxPingPongTurns`**: numero massimo di turni di risposta tra agenti durante gli scambi da agente ad agente (numero intero, intervallo: `0`-`20`, valore predefinito: `5`). `0` disabilita il concatenamento ping-pong.
- **`sendPolicy`**: corrispondenza per `channel`, `chatType` (`direct|group|channel`, con l'alias legacy `dm`), `keyPrefix` o `rawKeyPrefix`. Prevale il primo divieto.
- **`maintenance`**: controlli di pulizia e conservazione dell'archivio delle sessioni.
  - `mode`: `enforce` applica la pulizia ed è il valore predefinito; `warn` emette solo avvisi.
  - `pruneAfter`: soglia di età per le voci obsolete (valore predefinito `30d`).
  - `maxEntries`: numero massimo di voci di sessione SQLite (valore predefinito `500`). Le scritture del runtime eseguono la pulizia in batch con un piccolo margine superiore per limiti adatti alla produzione; `openclaw sessions cleanup --enforce` applica immediatamente il limite.
  - Le sessioni di verifica dell'esecuzione del modello del Gateway di breve durata utilizzano una conservazione fissa di `24h`, ma la pulizia è subordinata alla pressione: rimuove le righe obsolete delle verifiche rigorose dell'esecuzione del modello solo quando viene raggiunta la pressione dovuta alla manutenzione/al limite delle voci di sessione. Sono ammesse solo le chiavi di verifica esplicite e rigorose corrispondenti a `agent:*:explicit:model-run-<uuid>`; le normali sessioni dirette, di gruppo, di thread, Cron, hook, Heartbeat, ACP e dei sottoagenti non ereditano questa conservazione di 24h. Quando viene eseguita, la pulizia dell'esecuzione del modello avviene prima della pulizia più generale delle voci obsolete `pruneAfter` e del limite `maxEntries`.
  - Il valore legacy `rotateBytes` viene rifiutato dallo schema attuale; `openclaw doctor --fix` lo rimuove dalle configurazioni meno recenti.
  - `resetArchiveRetention`: conservazione basata sull'età per gli archivi delle trascrizioni reimpostate/eliminate. Per impostazione predefinita, gli archivi rimangono fino all'eliminazione dovuta al budget del disco; impostare una durata per abilitare l'eliminazione in base al tempo trascorso oppure `false` per disabilitarla esplicitamente.
  - `maxDiskBytes`: budget del disco facoltativo per la directory delle sessioni. In modalità `warn` registra avvisi; in modalità `enforce` rimuove prima gli artefatti/le sessioni meno recenti.
  - `highWaterBytes`: obiettivo facoltativo dopo la pulizia del budget. Il valore predefinito è `80%` di `maxDiskBytes`.
- **`writeLock`**: controlli del blocco di scrittura delle trascrizioni delle sessioni. Modificare solo quando operazioni legittime di preparazione delle trascrizioni, pulizia, Compaction o mirroring rimangono in conflitto più a lungo rispetto ai criteri predefiniti.
  - `acquireTimeoutMs`: millisecondi di attesa durante l'acquisizione di un blocco prima di segnalare la sessione come occupata. Valore predefinito: `60000`; sostituzione tramite variabile d'ambiente `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: millisecondi dopo i quali un blocco esistente viene considerato obsoleto e recuperato. Valore predefinito: `1800000`; sostituzione tramite variabile d'ambiente `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: millisecondi durante i quali un blocco mantenuto nel processo può rimanere attivo prima che il watchdog lo rilasci. Valore predefinito: `300000`; sostituzione tramite variabile d'ambiente `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: valori predefiniti globali per le funzionalità delle sessioni associate ai thread.
  - `enabled`: interruttore principale predefinito (i provider possono sostituirlo; Discord utilizza `channels.discord.threadBindings.enabled`)
  - `idleHours`: disattivazione automatica predefinita dello stato attivo dopo un periodo di inattività, in ore (`0` la disabilita; i provider possono sostituirla)
  - `maxAgeHours`: età massima assoluta predefinita in ore (`0` la disabilita; i provider possono sostituirla)
  - `spawnSessions`: controllo predefinito per la creazione di sessioni di lavoro associate ai thread da `sessions_spawn` e dalle generazioni di thread ACP. Il valore predefinito è `true` quando le associazioni ai thread sono abilitate; i provider/account possono sostituirlo.
  - `defaultSpawnContext`: contesto nativo predefinito del sottoagente per le generazioni associate ai thread (`"fork"` o `"isolated"`). Il valore predefinito è `"fork"`.

</Accordion>

---

## Messaggi

```json5
{
  messages: {
    responsePrefix: "🦞", // oppure "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (predefinito) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (predefinito)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disabilita
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefisso della risposta

Sostituzioni per canale/account: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Risoluzione (prevale il valore più specifico): account → canale → globale. `""` disabilita e interrompe la propagazione. `"auto"` deriva `[{identity.name}]`.

**Variabili del modello:**

| Variabile          | Descrizione            | Esempio                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nome breve del modello       | `claude-opus-4-6`           |
| `{modelFull}`     | Identificatore completo del modello  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome del provider          | `anthropic`                 |
| `{thinkingLevel}` | Livello di ragionamento attuale | `high`, `low`, `off`        |
| `{identity.name}` | Nome dell'identità dell'agente    | (uguale a `"auto"`)          |

Le variabili non distinguono tra maiuscole e minuscole. `{think}` è un alias di `{thinkingLevel}`.

### Reazione di conferma

- Il valore predefinito è `identity.emoji` dell'agente attivo oppure, in sua assenza, `"👀"`. Impostare `""` per disabilitare.
- Sostituzioni per canale: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordine di risoluzione: account → canale → `messages.ackReaction` → identità di riserva.
- Ambito: `group-mentions` (predefinito), `group-all`, `direct`, `all` oppure `off`/`none` (disabilita completamente le reazioni di conferma).
- `removeAckAfterReply`: rimuove la conferma dopo la risposta sui canali che supportano le reazioni, come Slack, Discord, Signal, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: abilita le reazioni di stato del ciclo di vita su Slack, Discord, Signal, Telegram e WhatsApp.
  Su Discord, se non è impostato, mantiene abilitate le reazioni di stato quando sono attive le reazioni di conferma.
  Su Slack, Signal, Telegram e WhatsApp, impostarlo esplicitamente su `true` per abilitare le reazioni di stato del ciclo di vita.
  Per impostazione predefinita, Slack utilizza lo stato nativo del thread dell'assistente e messaggi di caricamento a rotazione per indicare l'avanzamento, mantenendo statica la reazione di conferma configurata.
- `messages.statusReactions.emojis`: sostituisce le chiavi emoji del ciclo di vita:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` e `stallHard`.
  Telegram consente solo un insieme fisso di reazioni, quindi le emoji configurate non supportate vengono sostituite
  con la variante di stato supportata più simile per quella chat.

### Coda

- `mode`: strategia di accodamento per i messaggi in entrata che arrivano mentre è attiva l'esecuzione di una sessione. Valore predefinito: `"steer"`.
  - `steer`: inserisce il nuovo prompt nell'esecuzione attiva.
  - `followup`: esegue il nuovo prompt al termine dell'esecuzione attiva.
  - `collect`: raggruppa i messaggi compatibili e li esegue insieme in seguito.
  - `interrupt`: interrompe l'esecuzione attiva prima di avviare il prompt più recente.
- `debounceMs`: ritardo prima dell'invio di un messaggio accodato/reindirizzato. Valore predefinito: `500`.
- `cap`: numero massimo di messaggi accodati prima dell'applicazione del criterio di eliminazione. Valore predefinito: `20`.
- `drop`: strategia adottata quando viene superato il limite. `"summarize"` (predefinito) elimina le voci meno recenti ma conserva riepiloghi compatti; `"old"` elimina le voci meno recenti senza riepiloghi; `"new"` rifiuta l'elemento più recente.
- `byChannel`: sostituzioni di `mode` per canale, indicizzate per ID provider.
- `debounceMsByChannel`: sostituzioni di `debounceMs` per canale, indicizzate per ID provider.

### Debounce in entrata

Raggruppa i messaggi rapidi contenenti solo testo provenienti dallo stesso mittente in un unico turno dell'agente. I contenuti multimediali/gli allegati causano l'invio immediato. I comandi di controllo ignorano il debounce. Valore predefinito di `debounceMs`: `2000`.

### Altre chiavi dei messaggi

- `messages.messagePrefix`: testo prefisso aggiunto ai messaggi utente in entrata prima che raggiungano il runtime dell'agente. Utilizzare con moderazione per gli indicatori di contesto del canale.
- `messages.visibleReplies`: controlla le risposte visibili alla fonte nelle conversazioni dirette, di gruppo e di canale (`"message_tool"` richiede `message(action=send)` per produrre un output visibile; `"automatic"` pubblica le normali risposte come in precedenza).
- `messages.usageTemplate` / `messages.responseUsage`: modello personalizzato del piè di pagina `/usage` e modalità predefinita di utilizzo per risposta (`off | tokens | full`, oltre all'alias legacy `on` per `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: trigger delle menzioni nei messaggi di gruppo e dimensionamento della finestra della cronologia.
- `messages.suppressToolErrors`: quando è `true`, nasconde gli avvisi di errore dello strumento `⚠️` mostrati all'utente (l'agente continua a vedere gli errori nel contesto e può riprovare). Valore predefinito: `false`.

### TTS (sintesi vocale)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (default) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` controlla la modalità TTS automatica predefinita: `off`, `always`, `inbound` o `tagged`. `/tts on|off` può sostituire le preferenze locali e `/tts status` mostra lo stato effettivo.
- `summaryModel` sostituisce `agents.defaults.model.primary` per il riepilogo automatico.
- `modelOverrides` è abilitato per impostazione predefinita (`enabled !== false`); `modelOverrides.allowProvider` richiede l'attivazione esplicita.
- Le chiavi API utilizzano come fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- I provider vocali inclusi sono di proprietà dei Plugin. Se `plugins.allow` è impostato, includere ogni Plugin del provider TTS che si desidera utilizzare, ad esempio `microsoft` per Edge TTS. L'ID provider precedente `edge` è accettato come alias di `microsoft`.
- `providers.openai.baseUrl` sostituisce l'endpoint TTS di OpenAI. L'ordine di risoluzione è: configurazione, quindi `OPENAI_TTS_BASE_URL`, infine `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` punta a un endpoint non OpenAI, OpenClaw lo considera un server TTS compatibile con OpenAI e applica una convalida meno restrittiva del modello e della voce.

---

## Conversazione

Impostazioni predefinite per la modalità Conversazione (macOS/iOS/Android e l'interfaccia di controllo nel browser).

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Parla con cordialità e mantieni brevi le risposte.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` deve corrispondere a una chiave in `talk.providers` quando sono configurati più provider per la modalità Conversazione.
- Le precedenti chiavi non annidate della modalità Conversazione (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sono mantenute solo per compatibilità. Eseguire `openclaw doctor --fix` per riscrivere la configurazione persistente in `talk.providers.<provider>`.
- Gli ID vocali utilizzano come fallback `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID` (comportamento del client Conversazione per macOS).
- `providers.*.apiKey` accetta stringhe di testo normale o oggetti SecretRef.
- Il fallback `ELEVENLABS_API_KEY` si applica solo quando non è configurata alcuna chiave API per la modalità Conversazione.
- `providers.*.voiceAliases` consente alle direttive della modalità Conversazione di utilizzare nomi descrittivi.
- `providers.mlx.modelId` seleziona il repository Hugging Face utilizzato dall'helper MLX locale di macOS. Se omesso, macOS utilizza `mlx-community/Soprano-80M-bf16`.
- La riproduzione MLX su macOS utilizza l'helper incluso `openclaw-mlx-tts`, se presente, oppure un eseguibile disponibile in `PATH`; `OPENCLAW_MLX_TTS_BIN` sostituisce il percorso dell'helper per lo sviluppo.
- `consultThinkingLevel` controlla il livello di ragionamento dell'esecuzione completa dell'agente OpenClaw sottostante alle chiamate `openclaw_agent_consult` in tempo reale della modalità Conversazione dell'interfaccia di controllo. Lasciare non impostato per mantenere il normale comportamento della sessione e del modello.
- `consultFastMode` imposta una sostituzione temporanea e valida una sola volta della modalità rapida per le consultazioni in tempo reale della modalità Conversazione dell'interfaccia di controllo, senza modificare la normale impostazione della modalità rapida della sessione.
- `speechLocale` imposta l'ID delle impostazioni locali BCP 47 utilizzato dal riconoscimento vocale della modalità Conversazione su iOS/macOS. Lasciare non impostato per utilizzare il valore predefinito del dispositivo.
- `silenceTimeoutMs` controlla per quanto tempo la modalità Conversazione attende dopo il silenzio dell'utente prima di inviare la trascrizione. Se non impostato, mantiene l'intervallo di pausa predefinito della piattaforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` aggiunge istruzioni di sistema destinate al provider al prompt in tempo reale integrato di OpenClaw, consentendo di configurare lo stile vocale senza perdere le indicazioni predefinite di `openclaw_agent_consult`.
- `realtime.vadThreshold` imposta la soglia di rilevamento dell'attività vocale del provider da `0` (sensibilità massima) a `1` (sensibilità minima). Se non impostato, mantiene il valore predefinito del provider.
- `realtime.silenceDurationMs` imposta l'intervallo di silenzio, espresso come numero intero positivo, prima che il provider confermi un turno utente in tempo reale. Se non impostato, mantiene il valore predefinito del provider.
- `realtime.prefixPaddingMs` imposta la quantità di audio, espressa come numero intero non negativo, conservata prima dell'inizio del parlato rilevato. Se non impostato, mantiene il valore predefinito del provider.
- `realtime.reasoningEffort` imposta il livello di ragionamento specifico del provider per le sessioni in tempo reale. Se non impostato, mantiene il valore predefinito del provider.
- `realtime.consultRouting`: `"provider-direct"` (impostazione predefinita) mantiene le risposte dirette del provider quando il provider in tempo reale produce una trascrizione utente finale senza `openclaw_agent_consult`. `"force-agent-consult"` instrada invece la richiesta finalizzata attraverso OpenClaw.

---

## Contenuti correlati

- [Riferimento per la configurazione](/it/gateway/configuration-reference) — tutte le altre chiavi di configurazione
- [Configurazione](/it/gateway/configuration) — attività comuni e configurazione rapida
- [Esempi di configurazione](/it/gateway/configuration-examples)
