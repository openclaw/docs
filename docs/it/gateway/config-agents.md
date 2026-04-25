---
read_when:
    - Ottimizzazione dei valori predefiniti dell'agente (modelli, Thinking, area di lavoro, Heartbeat, contenuti multimediali, Skills)
    - Configurazione dell'instradamento multi-agente e dei binding
    - Regolazione del comportamento della sessione, della consegna dei messaggi e della modalità talk
summary: Valori predefiniti dell'agente, instradamento multi-agente, sessione, messaggi e configurazione talk
title: Configurazione — agenti
x-i18n:
    generated_at: "2026-04-25T18:19:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb090bad584cab0d22bc4788652f0fd6d7f2931be1fe40d3907f8ef2123a433b
    source_path: gateway/config-agents.md
    workflow: 15
---

Chiavi di configurazione con ambito agente sotto `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Per canali, strumenti, runtime del gateway e altre
chiavi di primo livello, vedi [Riferimento configurazione](/it/gateway/configuration-reference).

## Valori predefiniti dell'agente

### `agents.defaults.workspace`

Predefinito: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Radice opzionale del repository mostrata nella riga Runtime del prompt di sistema. Se non è impostata, OpenClaw la rileva automaticamente risalendo dalla workspace.

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
      { id: "writer" }, // eredita github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce i valori predefiniti
      { id: "locked-down", skills: [] }, // nessuna Skills
    ],
  },
}
```

- Ometti `agents.defaults.skills` per Skills senza restrizioni per impostazione predefinita.
- Ometti `agents.list[].skills` per ereditare i valori predefiniti.
- Imposta `agents.list[].skills: []` per non avere Skills.
- Un elenco `agents.list[].skills` non vuoto è l'insieme finale per quell'agente; non
  viene unito ai valori predefiniti.

### `agents.defaults.skipBootstrap`

Disabilita la creazione automatica dei file bootstrap della workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controlla quando i file bootstrap della workspace vengono inseriti nel prompt di sistema. Predefinito: `"always"`.

- `"continuation-skip"`: i turni di continuazione sicuri (dopo una risposta completata dell'assistente) saltano il reinserimento del bootstrap della workspace, riducendo la dimensione del prompt. Le esecuzioni Heartbeat e i tentativi successivi alla Compaction ricostruiscono comunque il contesto.
- `"never"`: disabilita l'inserimento del bootstrap della workspace e dei file di contesto a ogni turno. Usalo solo per agenti che gestiscono completamente il proprio ciclo di vita del prompt (motori di contesto personalizzati, runtime nativi che costruiscono il proprio contesto o flussi di lavoro specializzati senza bootstrap). Anche i turni Heartbeat e di recupero dalla Compaction saltano l'inserimento.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Numero massimo di caratteri per file bootstrap della workspace prima del troncamento. Predefinito: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Numero massimo totale di caratteri inseriti in tutti i file bootstrap della workspace. Predefinito: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controlla il testo di avviso visibile all'agente quando il contesto bootstrap viene troncato.
Predefinito: `"once"`.

- `"off"`: non inserire mai il testo di avviso nel prompt di sistema.
- `"once"`: inserisci l'avviso una volta per ogni firma di troncamento univoca (consigliato).
- `"always"`: inserisci l'avviso a ogni esecuzione quando esiste un troncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mappa di proprietà del budget di contesto

OpenClaw ha più budget di prompt/contesto ad alto volume, ed essi sono
intenzionalmente suddivisi per sottosistema invece di confluire tutti in un'unica manopola generica.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale inserimento del bootstrap della workspace.
- `agents.defaults.startupContext.*`:
  preludio di avvio one-shot per `/new` e `/reset`, inclusi i recenti file
  quotidiani `memory/*.md`.
- `skills.limits.*`:
  elenco compatto di Skills inserito nel prompt di sistema.
- `agents.defaults.contextLimits.*`:
  estratti runtime delimitati e blocchi gestiti dal runtime inseriti.
- `memory.qmd.limits.*`:
  dimensionamento di snippet e inserimento della ricerca nella memoria indicizzata.

Usa l'override corrispondente per singolo agente solo quando un agente richiede
un budget diverso:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controlla il preludio di avvio del primo turno inserito nelle esecuzioni `/new` e `/reset` senza altri contenuti.

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

Valori predefiniti condivisi per le superfici di contesto runtime delimitate.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: limite predefinito degli estratti `memory_get` prima che vengano aggiunti
  metadati di troncamento e avviso di continuazione.
- `memoryGetDefaultLines`: finestra di righe predefinita di `memory_get` quando `lines` è
  omesso.
- `toolResultMaxChars`: limite dei risultati degli strumenti in tempo reale usato per risultati persistiti e
  recupero da overflow.
- `postCompactionMaxChars`: limite dell'estratto di AGENTS.md usato durante l'inserimento di aggiornamento post-Compaction.

#### `agents.list[].contextLimits`

Override per singolo agente dei controlli condivisi `contextLimits`. I campi omessi ereditano
da `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Limite globale per l'elenco compatto di Skills inserito nel prompt di sistema. Questo
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

Override per singolo agente del budget del prompt delle Skills.

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

Valori più bassi di solito riducono l'uso di token di visione e la dimensione del payload delle richieste nelle esecuzioni ricche di screenshot.
Valori più alti preservano più dettagli visivi.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso orario per il contesto del prompt di sistema (non per i timestamp dei messaggi). Usa il fuso orario dell'host come fallback.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato ora nel prompt di sistema. Predefinito: `auto` (preferenza del sistema operativo).

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
      embeddedHarness: {
        runtime: "pi", // pi | auto | ID harness registrato, ad esempio codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - Usato anche come instradamento di fallback quando il modello selezionato/predefinito non può accettare input immagine.
- `imageGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione immagini e da qualsiasi futura superficie di strumenti/Plugin che generi immagini.
  - Valori tipici: `google/gemini-3.1-flash-image-preview` per la generazione nativa di immagini Gemini, `fal/fal-ai/flux/dev` per fal, oppure `openai/gpt-image-2` per OpenAI Images.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione del provider corrispondente (ad esempio `GEMINI_API_KEY` o `GOOGLE_API_KEY` per `google/*`, `OPENAI_API_KEY` o OAuth OpenAI Codex per `openai/gpt-image-2`, `FAL_KEY` per `fal/*`).
  - Se omesso, `image_generate` può comunque dedurre un provider predefinito supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione immagini registrati in ordine di ID provider.
- `musicGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione musicale e dallo strumento integrato `music_generate`.
  - Valori tipici: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oppure `minimax/music-2.6`.
  - Se omesso, `music_generate` può comunque dedurre un provider predefinito supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione musicale registrati in ordine di ID provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/la chiave API del provider corrispondente.
- `videoGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione video e dallo strumento integrato `video_generate`.
  - Valori tipici: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oppure `qwen/wan2.7-r2v`.
  - Se omesso, `video_generate` può comunque dedurre un provider predefinito supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione video registrati in ordine di ID provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/la chiave API del provider corrispondente.
  - Il provider incluso di generazione video Qwen supporta fino a 1 video di output, 1 immagine di input, 4 video di input, durata di 10 secondi e opzioni a livello provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dallo strumento `pdf` per l'instradamento del modello.
  - Se omesso, lo strumento PDF usa come fallback `imageModel`, poi il modello di sessione/predefinito risolto.
- `pdfMaxBytesMb`: limite predefinito di dimensione PDF per lo strumento `pdf` quando `maxBytesMb` non viene passato al momento della chiamata.
- `pdfMaxPages`: numero massimo predefinito di pagine considerate dalla modalità di fallback di estrazione nello strumento `pdf`.
- `verboseDefault`: livello verbose predefinito per gli agenti. Valori: `"off"`, `"on"`, `"full"`. Predefinito: `"off"`.
- `elevatedDefault`: livello predefinito di output elevato per gli agenti. Valori: `"off"`, `"on"`, `"ask"`, `"full"`. Predefinito: `"on"`.
- `model.primary`: formato `provider/model` (ad es. `openai/gpt-5.5` per accesso con chiave API oppure `openai-codex/gpt-5.5` per OAuth Codex). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca di provider configurato per quell'esatto ID modello, e solo dopo usa come fallback il provider predefinito configurato (comportamento di compatibilità deprecato, quindi preferisci `provider/model` esplicito). Se quel provider non espone più il modello predefinito configurato, OpenClaw usa come fallback il primo provider/modello configurato invece di mostrare un predefinito obsoleto di un provider rimosso.
- `models`: il catalogo modelli configurato e la allowlist per `/model`. Ogni voce può includere `alias` (scorciatoia) e `params` (specifici del provider, ad esempio `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `extra_body`/`extraBody`).
  - Modifiche sicure: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci. `config set` rifiuta sostituzioni che rimuoverebbero voci esistenti della allowlist, a meno che non passi `--replace`.
  - I flussi di configurazione/onboarding con ambito provider uniscono i modelli del provider selezionato in questa mappa e preservano i provider non correlati già configurati.
  - Per i modelli OpenAI Responses diretti, la Compaction lato server è abilitata automaticamente. Usa `params.responsesServerCompaction: false` per smettere di inserire `context_management`, oppure `params.responsesCompactThreshold` per sovrascrivere la soglia. Vedi [Compaction lato server OpenAI](/it/providers/openai#server-side-compaction-responses-api).
- `params`: parametri provider predefiniti globali applicati a tutti i modelli. Impostati in `agents.defaults.params` (ad es. `{ cacheRetention: "long" }`).
- Precedenza di unione di `params` (configurazione): `agents.defaults.params` (base globale) è sovrascritto da `agents.defaults.models["provider/model"].params` (per modello), poi `agents.list[].params` (ID agente corrispondente) sovrascrive per chiave. Vedi [Caching del prompt](/it/reference/prompt-caching) per i dettagli.
- `params.extra_body`/`params.extraBody`: JSON avanzato pass-through unito nei corpi richiesta `api: "openai-completions"` per proxy compatibili OpenAI. Se collide con chiavi di richiesta generate, il corpo extra prevale; i percorsi completions non nativi continuano comunque a rimuovere dopo le chiavi OpenAI-only `store`.
- `embeddedHarness`: criterio predefinito del runtime agente incorporato di basso livello. Il runtime omesso usa OpenClaw Pi come predefinito. Usa `runtime: "pi"` per forzare l'harness PI integrato, `runtime: "auto"` per lasciare che gli harness dei Plugin registrati rivendichino i modelli supportati, oppure un ID harness registrato come `runtime: "codex"`. Imposta `fallback: "none"` per disabilitare il fallback automatico a PI. I runtime di Plugin espliciti come `codex` falliscono in modalità chiusa per impostazione predefinita a meno che tu non imposti `fallback: "pi"` nello stesso ambito di override. Mantieni i riferimenti ai modelli canonici come `provider/model`; seleziona Codex, Claude CLI, Gemini CLI e altri backend di esecuzione tramite configurazione del runtime invece dei prefissi legacy del provider runtime. Vedi [Runtime degli agenti](/it/concepts/agent-runtimes) per capire in cosa questo differisce dalla selezione provider/modello.
- I writer di configurazione che modificano questi campi (ad esempio `/models set`, `/models set-image` e i comandi add/remove dei fallback) salvano la forma canonica a oggetto e preservano gli elenchi di fallback esistenti quando possibile.
- `maxConcurrent`: numero massimo di esecuzioni parallele di agenti tra le sessioni (ogni sessione resta comunque serializzata). Predefinito: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` controlla quale esecutore di basso livello esegue i turni dell'agente incorporato.
La maggior parte delle distribuzioni dovrebbe mantenere il runtime OpenClaw Pi predefinito.
Usalo quando un Plugin attendibile fornisce un harness nativo, come l'harness
incluso del server app Codex. Per il modello mentale, vedi
[Runtime degli agenti](/it/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` oppure un ID harness di Plugin registrato. Il Plugin Codex incluso registra `codex`.
- `fallback`: `"pi"` oppure `"none"`. In `runtime: "auto"`, il fallback omesso usa `"pi"` come predefinito così le vecchie configurazioni possono continuare a usare PI quando nessun harness di Plugin prende in carico un'esecuzione. Nella modalità runtime di Plugin esplicita, come `runtime: "codex"`, il fallback omesso usa `"none"` come predefinito così un harness mancante fallisce invece di usare silenziosamente PI. Gli override di runtime non ereditano il fallback da un ambito più ampio; imposta `fallback: "pi"` insieme al runtime esplicito quando vuoi intenzionalmente quel fallback di compatibilità. I fallimenti dell'harness del Plugin selezionato emergono sempre direttamente.
- Override d'ambiente: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` sovrascrive `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` sovrascrive il fallback per quel processo.
- Per distribuzioni solo Codex, imposta `model: "openai/gpt-5.5"` e `embeddedHarness.runtime: "codex"`. Puoi anche impostare esplicitamente `embeddedHarness.fallback: "none"` per chiarezza; è il valore predefinito per i runtime di Plugin espliciti.
- La scelta dell'harness viene fissata per ID sessione dopo la prima esecuzione incorporata. Le modifiche a configurazione/ambiente influenzano le sessioni nuove o reimpostate, non una trascrizione esistente. Le sessioni legacy con cronologia di transcript ma senza un pin registrato sono trattate come fissate a PI. `/status` riporta il runtime effettivo, ad esempio `Runtime: OpenClaw Pi Default` oppure `Runtime: OpenAI Codex`.
- Questo controlla solo l'harness chat incorporato. Generazione di contenuti multimediali, visione, PDF, musica, video e TTS continuano a usare le rispettive impostazioni provider/modello.

**Scorciatoie alias integrate** (si applicano solo quando il modello è in `agents.defaults.models`):

| Alias               | Modello                                   |
| ------------------- | ----------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`               |
| `sonnet`            | `anthropic/claude-sonnet-4-6`             |
| `gpt`               | `openai/gpt-5.5` o `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                     |
| `gpt-nano`          | `openai/gpt-5.4-nano`                     |
| `gemini`            | `google/gemini-3.1-pro-preview`           |
| `gemini-flash`      | `google/gemini-3-flash-preview`           |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`    |

I tuoi alias configurati hanno sempre la precedenza su quelli predefiniti.

I modelli Z.AI GLM-4.x abilitano automaticamente la modalità thinking a meno che tu non imposti `--thinking off` o definisca direttamente `agents.defaults.models["zai/<model>"].params.thinking`.
I modelli Z.AI abilitano `tool_stream` per impostazione predefinita per lo streaming delle chiamate agli strumenti. Imposta `agents.defaults.models["zai/<model>"].params.tool_stream` su `false` per disabilitarlo.
I modelli Anthropic Claude 4.6 usano `adaptive` thinking come predefinito quando non è impostato alcun livello di thinking esplicito.

### `agents.defaults.cliBackends`

Backend CLI opzionali per esecuzioni di fallback solo testo (senza chiamate agli strumenti). Utili come backup quando i provider API falliscono.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Oppure usa systemPromptFileArg quando la CLI accetta un flag per file prompt.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- I backend CLI sono orientati prima di tutto al testo; gli strumenti sono sempre disabilitati.
- Sessioni supportate quando `sessionArg` è impostato.
- Pass-through delle immagini supportato quando `imageArg` accetta percorsi di file.

### `agents.defaults.systemPromptOverride`

Sostituisci l'intero prompt di sistema assemblato da OpenClaw con una stringa fissa. Impostalo a livello predefinito (`agents.defaults.systemPromptOverride`) o per agente (`agents.list[].systemPromptOverride`). I valori per agente hanno la precedenza; un valore vuoto o composto solo da spazi viene ignorato. Utile per esperimenti controllati sul prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Overlay del prompt indipendenti dal provider applicati per famiglia di modelli. Gli ID modello della famiglia GPT-5 ricevono il contratto di comportamento condiviso tra provider; `personality` controlla solo il livello di stile di interazione amichevole.

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
- `"off"` disabilita solo il livello amichevole; il contratto di comportamento GPT-5 etichettato resta abilitato.
- Il legacy `plugins.entries.openai.config.personality` viene ancora letto quando questa impostazione condivisa non è impostata.

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
        includeSystemPromptSection: true, // predefinito: true; false omette la sezione Heartbeat dal prompt di sistema
        lightContext: false, // predefinito: false; true mantiene solo HEARTBEAT.md tra i file bootstrap della workspace
        isolatedSession: false, // predefinito: false; true esegue ogni heartbeat in una sessione nuova (nessuna cronologia della conversazione)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (predefinito) | block
        target: "none", // predefinito: none | opzioni: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: stringa di durata (ms/s/m/h). Predefinito: `30m` (autenticazione con chiave API) oppure `1h` (autenticazione OAuth). Imposta `0m` per disabilitare.
- `includeSystemPromptSection`: quando è false, omette la sezione Heartbeat dal prompt di sistema e salta l'inserimento di `HEARTBEAT.md` nel contesto bootstrap. Predefinito: `true`.
- `suppressToolErrorWarnings`: quando è true, sopprime i payload di avviso di errore degli strumenti durante le esecuzioni Heartbeat.
- `timeoutSeconds`: tempo massimo in secondi consentito per un turno agente Heartbeat prima che venga interrotto. Lascialo non impostato per usare `agents.defaults.timeoutSeconds`.
- `directPolicy`: criterio di consegna diretta/DM. `allow` (predefinito) consente la consegna verso destinazioni dirette. `block` sopprime la consegna verso destinazioni dirette ed emette `reason=dm-blocked`.
- `lightContext`: quando è true, le esecuzioni Heartbeat usano un contesto bootstrap leggero e mantengono solo `HEARTBEAT.md` tra i file bootstrap della workspace.
- `isolatedSession`: quando è true, ogni Heartbeat viene eseguito in una sessione nuova senza cronologia della conversazione precedente. Stesso schema di isolamento di Cron `sessionTarget: "isolated"`. Riduce il costo in token per Heartbeat da ~100K a ~2-5K token.
- Per agente: imposta `agents.list[].heartbeat`. Quando un agente definisce `heartbeat`, **solo quegli agenti** eseguono Heartbeat.
- Gli Heartbeat eseguono turni completi dell'agente: intervalli più brevi consumano più token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id di un Plugin provider di Compaction registrato (opzionale)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // usato quando identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disabilita il reinserimento
        model: "openrouter/anthropic/claude-sonnet-4-6", // override opzionale del modello solo per Compaction
        notifyUser: true, // invia brevi avvisi quando la Compaction inizia e termina (predefinito: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` oppure `safeguard` (riassunto a blocchi per cronologie lunghe). Vedi [Compaction](/it/concepts/compaction).
- `provider`: id di un Plugin provider di Compaction registrato. Quando è impostato, viene chiamato `summarize()` del provider invece del riassunto LLM integrato. In caso di errore usa il fallback integrato. L'impostazione di un provider forza `mode: "safeguard"`. Vedi [Compaction](/it/concepts/compaction).
- `timeoutSeconds`: numero massimo di secondi consentiti per una singola operazione di Compaction prima che OpenClaw la interrompa. Predefinito: `900`.
- `keepRecentTokens`: budget del punto di taglio Pi per mantenere verbatim la coda più recente del transcript. Il comando manuale `/compact` lo rispetta quando è esplicitamente impostato; altrimenti la Compaction manuale è un checkpoint rigido.
- `identifierPolicy`: `strict` (predefinito), `off` oppure `custom`. `strict` antepone una guida integrata per la conservazione di identificatori opachi durante il riassunto di Compaction.
- `identifierInstructions`: testo opzionale personalizzato per la conservazione degli identificatori usato quando `identifierPolicy=custom`.
- `qualityGuard`: controlli di nuovo tentativo su output malformato per i riepiloghi safeguard. Abilitato per impostazione predefinita in modalità safeguard; imposta `enabled: false` per saltare l'audit.
- `postCompactionSections`: nomi opzionali di sezioni H2/H3 di AGENTS.md da reinserire dopo la Compaction. Predefinito: `["Session Startup", "Red Lines"]`; imposta `[]` per disabilitare il reinserimento. Quando non è impostato o è impostato esplicitamente a quella coppia predefinita, sono accettate anche le vecchie intestazioni `Every Session`/`Safety` come fallback legacy.
- `model`: override opzionale `provider/model-id` solo per il riassunto di Compaction. Usalo quando la sessione principale deve mantenere un modello ma i riepiloghi di Compaction devono essere eseguiti con un altro; quando non è impostato, la Compaction usa il modello primario della sessione.
- `notifyUser`: quando `true`, invia brevi avvisi all'utente quando la Compaction inizia e quando termina (ad esempio, "Compacting context..." e "Compaction complete"). Disabilitato per impostazione predefinita per mantenere silenziosa la Compaction.
- `memoryFlush`: turno agentico silenzioso prima della Compaction automatica per memorizzare ricordi persistenti. Saltato quando la workspace è in sola lettura.

### `agents.defaults.contextPruning`

Elimina **vecchi risultati degli strumenti** dal contesto in memoria prima di inviarlo all'LLM. **Non** modifica la cronologia della sessione sul disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // durata (ms/s/m/h), unità predefinita: minuti
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

<Accordion title="Comportamento della modalità cache-ttl">

- `mode: "cache-ttl"` abilita i passaggi di potatura.
- `ttl` controlla con quale frequenza la potatura può essere eseguita di nuovo (dopo l'ultimo tocco della cache).
- La potatura prima riduce in modo soft i risultati degli strumenti sovradimensionati, poi svuota in modo hard i risultati degli strumenti più vecchi se necessario.

**Soft-trim** mantiene l'inizio + la fine e inserisce `...` nel mezzo.

**Hard-clear** sostituisce l'intero risultato dello strumento con il segnaposto.

Note:

- I blocchi immagine non vengono mai ridotti/svuotati.
- I rapporti sono basati sui caratteri (approssimativi), non su conteggi esatti di token.
- Se esistono meno di `keepLastAssistants` messaggi dell'assistente, la potatura viene saltata.

</Accordion>

Vedi [Potatura della sessione](/it/concepts/session-pruning) per i dettagli del comportamento.

### Streaming a blocchi

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (usa minMs/maxMs)
    },
  },
}
```

- I canali non Telegram richiedono `*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
- Override per canale: `channels.<channel>.blockStreamingCoalesce` (e varianti per account). Signal/Slack/Discord/Google Chat usano come predefinito `minChars: 1500`.
- `humanDelay`: pausa casuale tra le risposte a blocchi. `natural` = 800–2500ms. Override per agente: `agents.list[].humanDelay`.

Vedi [Streaming](/it/concepts/streaming) per i dettagli su comportamento e chunking.

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

Sandboxing opzionale per l'agente incorporato. Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa.

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
          // Sono supportati anche SecretRef / contenuti inline:
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

<Accordion title="Dettagli del sandbox">

**Backend:**

- `docker`: runtime Docker locale (predefinito)
- `ssh`: runtime remoto generico basato su SSH
- `openshell`: runtime OpenShell

Quando è selezionato `backend: "openshell"`, le impostazioni specifiche del runtime vengono spostate in
`plugins.entries.openshell.config`.

**Configurazione del backend SSH:**

- `target`: destinazione SSH nel formato `user@host[:port]`
- `command`: comando del client SSH (predefinito: `ssh`)
- `workspaceRoot`: radice remota assoluta usata per le workspace per ambito
- `identityFile` / `certificateFile` / `knownHostsFile`: file locali esistenti passati a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenuti inline o SecretRef che OpenClaw materializza in file temporanei al runtime
- `strictHostKeyChecking` / `updateHostKeys`: controlli dei criteri host-key di OpenSSH

**Precedenza dell'autenticazione SSH:**

- `identityData` ha la precedenza su `identityFile`
- `certificateData` ha la precedenza su `certificateFile`
- `knownHostsData` ha la precedenza su `knownHostsFile`
- I valori `*Data` supportati da SecretRef vengono risolti dallo snapshot attivo del runtime dei segreti prima che inizi la sessione sandbox

**Comportamento del backend SSH:**

- inizializza la workspace remota una volta dopo la creazione o ricreazione
- poi mantiene canonica la workspace SSH remota
- instrada `exec`, gli strumenti per i file e i percorsi dei contenuti multimediali tramite SSH
- non sincronizza automaticamente le modifiche remote di nuovo verso l'host
- non supporta container browser in sandbox

**Accesso alla workspace:**

- `none`: workspace sandbox per ambito sotto `~/.openclaw/sandboxes`
- `ro`: workspace sandbox in `/workspace`, workspace dell'agente montata in sola lettura in `/agent`
- `rw`: workspace dell'agente montata in lettura/scrittura in `/workspace`

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
          policy: "strict", // ID criterio OpenShell opzionale
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

- `mirror`: inizializza il remoto dal locale prima di exec, sincronizza indietro dopo exec; la workspace locale resta canonica
- `remote`: inizializza il remoto una volta quando il sandbox viene creato, poi mantiene canonica la workspace remota

In modalità `remote`, le modifiche locali sull'host effettuate fuori da OpenClaw non vengono sincronizzate automaticamente nel sandbox dopo il passaggio di inizializzazione.
Il trasporto avviene tramite SSH nel sandbox OpenShell, ma il Plugin gestisce il ciclo di vita del sandbox e l'eventuale sincronizzazione mirror.

**`setupCommand`** viene eseguito una volta dopo la creazione del container (tramite `sh -lc`). Richiede uscita di rete, root scrivibile, utente root.

**I container usano come predefinito `network: "none"`** — imposta `"bridge"` (o una rete bridge personalizzata) se l'agente ha bisogno di accesso in uscita.
`"host"` è bloccato. `"container:<id>"` è bloccato per impostazione predefinita a meno che tu non imposti esplicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Gli allegati in ingresso** vengono preparati in `media/inbound/*` nella workspace attiva.

**`docker.binds`** monta directory host aggiuntive; i bind globali e per agente vengono uniti.

**Browser in sandbox** (`sandbox.browser.enabled`): Chromium + CDP in un container. L'URL noVNC viene inserito nel prompt di sistema. Non richiede `browser.enabled` in `openclaw.json`.
L'accesso osservatore noVNC usa l'autenticazione VNC come predefinita e OpenClaw emette un URL con token a breve durata (invece di esporre la password nell'URL condiviso).

- `allowHostControl: false` (predefinito) blocca le sessioni in sandbox dal puntare al browser host.
- `network` usa come predefinito `openclaw-sandbox-browser` (rete bridge dedicata). Imposta `bridge` solo quando desideri esplicitamente una connettività bridge globale.
- `cdpSourceRange` limita facoltativamente l'ingresso CDP al bordo del container a un intervallo CIDR (ad esempio `172.21.0.1/32`).
- `sandbox.browser.binds` monta directory host aggiuntive solo nel container del browser sandbox. Quando è impostato (incluso `[]`), sostituisce `docker.binds` per il container del browser.
- I valori predefiniti di avvio sono definiti in `scripts/sandbox-browser-entrypoint.sh` e regolati per host container:
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` riabilita le estensioni se il tuo flusso di lavoro
    ne dipende.
  - `--renderer-process-limit=2` può essere modificato con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; imposta `0` per usare il
    limite di processi predefinito di Chromium.
  - più `--no-sandbox` quando `noSandbox` è abilitato.
  - I valori predefiniti sono la baseline dell'immagine container; usa un'immagine browser personalizzata con un entrypoint personalizzato per modificare i valori predefiniti del container.

</Accordion>

Il sandboxing del browser e `sandbox.docker.binds` sono solo per Docker.

Crea le immagini:

```bash
scripts/sandbox-setup.sh           # immagine sandbox principale
scripts/sandbox-browser-setup.sh   # immagine browser opzionale
```

### `agents.list` (override per agente)

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
        model: "anthropic/claude-opus-4-6", // oppure { primary, fallbacks }
        thinkingDefault: "high", // override per agente del livello thinking
        reasoningDefault: "on", // override per agente della visibilità del reasoning
        fastModeDefault: false, // override per agente della modalità veloce
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // sovrascrive per chiave i params di defaults.models corrispondenti
        skills: ["docs-search"], // sostituisce agents.defaults.skills quando impostato
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

- `id`: ID agente stabile (obbligatorio).
- `default`: quando ne sono impostati più di uno, vince il primo (viene registrato un avviso). Se non ne è impostato nessuno, la prima voce della lista è quella predefinita.
- `model`: la forma stringa sovrascrive solo `primary`; la forma oggetto `{ primary, fallbacks }` sovrascrive entrambi (`[]` disabilita i fallback globali). I job Cron che sovrascrivono solo `primary` ereditano comunque i fallback predefiniti a meno che tu non imposti `fallbacks: []`.
- `params`: params di stream per agente uniti sopra la voce modello selezionata in `agents.defaults.models`. Usalo per override specifici dell'agente come `cacheRetention`, `temperature` o `maxTokens` senza duplicare l'intero catalogo modelli.
- `skills`: allowlist opzionale di Skills per agente. Se omessa, l'agente eredita `agents.defaults.skills` quando impostato; un elenco esplicito sostituisce i valori predefiniti invece di unirli e `[]` significa nessuna Skills.
- `thinkingDefault`: override opzionale per agente del livello thinking predefinito (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sovrascrive `agents.defaults.thinkingDefault` per questo agente quando non è impostato alcun override per messaggio o sessione. Il profilo provider/modello selezionato controlla quali valori sono validi; per Google Gemini, `adaptive` mantiene il thinking dinamico gestito dal provider (`thinkingLevel` omesso su Gemini 3/3.1, `thinkingBudget: -1` su Gemini 2.5).
- `reasoningDefault`: override opzionale per agente della visibilità predefinita del reasoning (`on | off | stream`). Si applica quando non è impostato alcun override del reasoning per messaggio o sessione.
- `fastModeDefault`: predefinito opzionale per agente per la modalità veloce (`true | false`). Si applica quando non è impostato alcun override della modalità veloce per messaggio o sessione.
- `embeddedHarness`: override opzionale per agente del criterio di harness di basso livello. Usa `{ runtime: "codex" }` per rendere un agente solo Codex mentre gli altri agenti mantengono il fallback PI predefinito in modalità `auto`.
- `runtime`: descrittore opzionale del runtime per agente. Usa `type: "acp"` con i valori predefiniti `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando l'agente deve usare come predefinite le sessioni harness ACP.
- `identity.avatar`: percorso relativo alla workspace, URL `http(s)` oppure URI `data:`.
- `identity` deriva i valori predefiniti: `ackReaction` da `emoji`, `mentionPatterns` da `name`/`emoji`.
- `subagents.allowAgents`: allowlist di ID agente per `sessions_spawn` (`["*"]` = qualsiasi; predefinito: solo lo stesso agente).
- Guardia di ereditarietà sandbox: se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta destinazioni che verrebbero eseguite fuori sandbox.
- `subagents.requireAgentId`: quando è true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo; predefinito: false).

---

## Instradamento multi-agente

Esegui più agenti isolati dentro un unico Gateway. Vedi [Multi-Agent](/it/concepts/multi-agent).

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

- `type` (opzionale): `route` per l'instradamento normale (il tipo mancante usa route come predefinito), `acp` per binding di conversazione ACP persistenti.
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

Per le voci `type: "acp"`, OpenClaw risolve in base all'identità esatta della conversazione (`match.channel` + account + `match.peer.id`) e non usa l'ordine dei livelli di binding route sopra.

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

<Accordion title="Strumenti + workspace in sola lettura">

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
    parentForkMaxTokens: 100000, // salta il fork del thread padre sopra questo conteggio di token (0 disabilita)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // durata oppure false
      maxDiskBytes: "500mb", // budget rigido opzionale
      highWaterBytes: "400mb", // obiettivo di pulizia opzionale
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // auto-unfocus predefinito per inattività in ore (`0` disabilita)
      maxAgeHours: 0, // età massima rigida predefinita in ore (`0` disabilita)
    },
    mainKey: "main", // legacy (il runtime usa sempre "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Dettagli dei campi della sessione">

- **`scope`**: strategia base di raggruppamento delle sessioni per i contesti di chat di gruppo.
  - `per-sender` (predefinito): ogni mittente ottiene una sessione isolata all'interno di un contesto di canale.
  - `global`: tutti i partecipanti in un contesto di canale condividono una singola sessione (usare solo quando è previsto un contesto condiviso).
- **`dmScope`**: come vengono raggruppati i DM.
  - `main`: tutti i DM condividono la sessione principale.
  - `per-peer`: isolamento per ID mittente tra canali.
  - `per-channel-peer`: isolamento per canale + mittente (consigliato per inbox multiutente).
  - `per-account-channel-peer`: isolamento per account + canale + mittente (consigliato per multi-account).
- **`identityLinks`**: mappa gli ID canonici ai peer con prefisso provider per la condivisione delle sessioni tra canali.
- **`reset`**: criterio di reset principale. `daily` esegue il reset a `atHour` nell'ora locale; `idle` esegue il reset dopo `idleMinutes`. Quando entrambi sono configurati, vince quello che scade per primo.
- **`resetByType`**: override per tipo (`direct`, `group`, `thread`). Il legacy `dm` è accettato come alias di `direct`.
- **`parentForkMaxTokens`**: numero massimo di `totalTokens` consentito alla sessione padre quando si crea una sessione thread forkata (predefinito `100000`).
  - Se `totalTokens` del padre è superiore a questo valore, OpenClaw avvia una nuova sessione thread invece di ereditare la cronologia del transcript del padre.
  - Imposta `0` per disabilitare questa protezione e consentire sempre il fork dal padre.
- **`mainKey`**: campo legacy. Il runtime usa sempre `"main"` per il bucket principale della chat diretta.
- **`agentToAgent.maxPingPongTurns`**: numero massimo di turni di risposta reciproca tra agenti durante gli scambi agent-to-agent (intero, intervallo: `0`–`5`). `0` disabilita la catena ping-pong.
- **`sendPolicy`**: corrisponde per `channel`, `chatType` (`direct|group|channel`, con alias legacy `dm`), `keyPrefix` oppure `rawKeyPrefix`. Vince il primo deny.
- **`maintenance`**: controlli di pulizia + retention dell'archivio sessioni.
  - `mode`: `warn` emette solo avvisi; `enforce` applica la pulizia.
  - `pruneAfter`: soglia di età per le voci obsolete (predefinito `30d`).
  - `maxEntries`: numero massimo di voci in `sessions.json` (predefinito `500`).
  - `rotateBytes`: ruota `sessions.json` quando supera questa dimensione (predefinito `10mb`).
  - `resetArchiveRetention`: retention per gli archivi di transcript `*.reset.<timestamp>`. Predefinita a `pruneAfter`; imposta `false` per disabilitare.
  - `maxDiskBytes`: budget disco opzionale per la directory delle sessioni. In modalità `warn` registra avvisi; in modalità `enforce` rimuove prima gli artefatti/le sessioni più vecchi.
  - `highWaterBytes`: obiettivo opzionale dopo la pulizia del budget. Predefinito all'`80%` di `maxDiskBytes`.
- **`threadBindings`**: valori predefiniti globali per le funzionalità di sessione legate ai thread.
  - `enabled`: interruttore predefinito principale (i provider possono fare override; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus predefinito per inattività in ore (`0` disabilita; i provider possono fare override)
  - `maxAgeHours`: età massima rigida predefinita in ore (`0` disabilita; i provider possono fare override)

</Accordion>

---

## Messaggi

```json5
{
  messages: {
    responsePrefix: "🦞", // oppure "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
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

### Prefisso di risposta

Override per canale/account: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Risoluzione (vince il più specifico): account → canale → globale. `""` disabilita e interrompe la cascata. `"auto"` deriva `[{identity.name}]`.

**Variabili del template:**

| Variabile         | Descrizione            | Esempio                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nome breve del modello | `claude-opus-4-6`           |
| `{modelFull}`     | Identificatore completo del modello | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome del provider      | `anthropic`                 |
| `{thinkingLevel}` | Livello thinking corrente | `high`, `low`, `off`        |
| `{identity.name}` | Nome dell'identità dell'agente | (uguale a `"auto"`)          |

Le variabili non fanno distinzione tra maiuscole e minuscole. `{think}` è un alias per `{thinkingLevel}`.

### Reazione di ack

- Usa come predefinito `identity.emoji` dell'agente attivo, altrimenti `"👀"`. Imposta `""` per disabilitare.
- Override per canale: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordine di risoluzione: account → canale → `messages.ackReaction` → fallback identity.
- Ambito: `group-mentions` (predefinito), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: rimuove l'ack dopo la risposta su Slack, Discord e Telegram.
- `messages.statusReactions.enabled`: abilita le reazioni di stato del ciclo di vita su Slack, Discord e Telegram.
  Su Slack e Discord, se non impostato mantiene abilitate le reazioni di stato quando le reazioni ack sono attive.
  Su Telegram, impostalo esplicitamente su `true` per abilitare le reazioni di stato del ciclo di vita.

### Debounce in ingresso

Raggruppa in un singolo turno agente i messaggi rapidi di solo testo provenienti dallo stesso mittente. Contenuti multimediali/allegati causano flush immediato. I comandi di controllo bypassano il debounce.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
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
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` controlla la modalità auto-TTS predefinita: `off`, `always`, `inbound` oppure `tagged`. `/tts on|off` può sovrascrivere le preferenze locali e `/tts status` mostra lo stato effettivo.
- `summaryModel` sovrascrive `agents.defaults.model.primary` per il riepilogo automatico.
- `modelOverrides` è abilitato per impostazione predefinita; `modelOverrides.allowProvider` usa come predefinito `false` (opt-in).
- Le chiavi API usano come fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- I provider vocali inclusi sono gestiti dai Plugin. Se `plugins.allow` è impostato, includi ogni Plugin provider TTS che vuoi usare, ad esempio `microsoft` per Edge TTS. L'ID provider legacy `edge` è accettato come alias di `microsoft`.
- `providers.openai.baseUrl` sovrascrive l'endpoint OpenAI TTS. L'ordine di risoluzione è configurazione, poi `OPENAI_TTS_BASE_URL`, poi `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` punta a un endpoint non OpenAI, OpenClaw lo tratta come un server TTS compatibile con OpenAI e rende più flessibile la validazione di modello/voce.

---

## Talk

Valori predefiniti per la modalità Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
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
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` deve corrispondere a una chiave in `talk.providers` quando sono configurati più provider Talk.
- Le chiavi Talk legacy flat (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sono solo per compatibilità e vengono migrate automaticamente in `talk.providers.<provider>`.
- Gli ID voce usano come fallback `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` accetta stringhe in chiaro o oggetti SecretRef.
- Il fallback `ELEVENLABS_API_KEY` si applica solo quando non è configurata alcuna chiave API Talk.
- `providers.*.voiceAliases` consente alle direttive Talk di usare nomi amichevoli.
- `providers.mlx.modelId` seleziona il repository Hugging Face usato dall'helper MLX locale macOS. Se omesso, macOS usa `mlx-community/Soprano-80M-bf16`.
- La riproduzione MLX su macOS viene eseguita tramite l'helper incluso `openclaw-mlx-tts`, se presente, oppure tramite un eseguibile su `PATH`; `OPENCLAW_MLX_TTS_BIN` sovrascrive il percorso dell'helper per lo sviluppo.
- `silenceTimeoutMs` controlla quanto a lungo la modalità Talk attende dopo il silenzio dell'utente prima di inviare il transcript. Se non impostato, mantiene la finestra di pausa predefinita della piattaforma (`700 ms su macOS e Android, 900 ms su iOS`).

---

## Correlati

- [Riferimento configurazione](/it/gateway/configuration-reference) — tutte le altre chiavi di configurazione
- [Configurazione](/it/gateway/configuration) — attività comuni e configurazione rapida
- [Esempi di configurazione](/it/gateway/configuration-examples)
