---
read_when:
    - Ottimizzazione delle impostazioni predefinite dell'agente (modelli, ragionamento, workspace, Heartbeat, media, Skills)
    - Configurazione dell'instradamento multi-agente e delle associazioni
    - Regolazione della sessione, del recapito dei messaggi e del comportamento della modalità conversazione
summary: Impostazioni predefinite degli agenti, routing multi-agente, configurazione di sessione, messaggi e conversazione
title: Configurazione — agenti
x-i18n:
    generated_at: "2026-05-02T08:22:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559bb427555768c91720bac10ee60bf2ba5a081117b741a02c140b14267ce1bf
    source_path: gateway/config-agents.md
    workflow: 16
---

Chiavi di configurazione con ambito agente sotto `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Per canali, strumenti, runtime del Gateway e altre
chiavi di primo livello, vedi [Riferimento della configurazione](/it/gateway/configuration-reference).

## Valori predefiniti degli agenti

### `agents.defaults.workspace`

Predefinito: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Radice del repository opzionale mostrata nella riga Runtime del prompt di sistema. Se non impostata, OpenClaw la rileva automaticamente risalendo dal workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista consentita di skill predefinita opzionale per gli agenti che non impostano
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

- Ometti `agents.defaults.skills` per avere skill senza restrizioni per impostazione predefinita.
- Ometti `agents.list[].skills` per ereditare i valori predefiniti.
- Imposta `agents.list[].skills: []` per non avere skill.
- Una lista `agents.list[].skills` non vuota è l'insieme finale per quell'agente; non
  viene unita ai valori predefiniti.

### `agents.defaults.skipBootstrap`

Disabilita la creazione automatica dei file di bootstrap del workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Salta la creazione di file opzionali selezionati del workspace continuando comunque a scrivere i file di bootstrap richiesti. Valori validi: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

Controlla quando i file di bootstrap del workspace vengono inseriti nel prompt di sistema. Predefinito: `"always"`.

- `"continuation-skip"`: i turni di continuazione sicuri (dopo una risposta dell'assistente completata) saltano il reinserimento del bootstrap del workspace, riducendo la dimensione del prompt. Le esecuzioni Heartbeat e i nuovi tentativi post-Compaction ricostruiscono comunque il contesto.
- `"never"`: disabilita il bootstrap del workspace e l'inserimento dei file di contesto a ogni turno. Usalo solo per agenti che possiedono completamente il ciclo di vita del proprio prompt (motori di contesto personalizzati, runtime nativi che costruiscono il proprio contesto o workflow specializzati senza bootstrap). Anche i turni Heartbeat e di recupero da Compaction saltano l'inserimento.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Numero massimo di caratteri per file di bootstrap del workspace prima del troncamento. Predefinito: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Numero massimo totale di caratteri inseriti in tutti i file di bootstrap del workspace. Predefinito: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controlla il testo di avviso visibile all'agente quando il contesto di bootstrap viene troncato.
Predefinito: `"once"`.

- `"off"`: non inserire mai testo di avviso nel prompt di sistema.
- `"once"`: inserisci l'avviso una volta per ogni firma di troncamento univoca (consigliato).
- `"always"`: inserisci l'avviso a ogni esecuzione quando esiste un troncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mappa della proprietà dei budget di contesto

OpenClaw ha più budget di prompt/contesto ad alto volume, e sono
intenzionalmente separati per sottosistema invece di passare tutti attraverso una manopola
generica.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  inserimento normale del bootstrap del workspace.
- `agents.defaults.startupContext.*`:
  preludio una tantum per l'esecuzione del modello al reset/avvio, inclusi i file
  `memory/*.md` giornalieri recenti. I comandi chat semplici `/new` e `/reset`
  vengono confermati senza invocare il modello.
- `skills.limits.*`:
  la lista compatta delle skill inserita nel prompt di sistema.
- `agents.defaults.contextLimits.*`:
  estratti runtime limitati e blocchi inseriti di proprietà del runtime.
- `memory.qmd.limits.*`:
  dimensionamento dello snippet di ricerca memoria indicizzato e dell'inserimento.

Usa l'override per agente corrispondente solo quando un agente necessita di un
budget diverso:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controlla il preludio di avvio del primo turno inserito nelle esecuzioni del modello al reset/avvio.
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
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: limite predefinito dell'estratto `memory_get` prima che
  vengano aggiunti i metadati di troncamento e l'avviso di continuazione.
- `memoryGetDefaultLines`: finestra di righe predefinita di `memory_get` quando `lines` viene
  omesso.
- `toolResultMaxChars`: limite dei risultati degli strumenti live usato per risultati persistiti e
  recupero da overflow.
- `postCompactionMaxChars`: limite dell'estratto AGENTS.md usato durante l'inserimento
  di aggiornamento post-Compaction.

#### `agents.list[].contextLimits`

Override per agente per le manopole `contextLimits` condivise. I campi omessi ereditano
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

Limite globale per la lista compatta delle skill inserita nel prompt di sistema. Questo
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

Dimensione massima in pixel per il lato più lungo dell'immagine nei blocchi immagine di trascrizione/strumento prima delle chiamate al provider.
Predefinito: `1200`.

Valori più bassi di solito riducono l'uso dei token visivi e la dimensione del payload delle richieste per esecuzioni con molti screenshot.
Valori più alti preservano più dettaglio visivo.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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

- `model`: accetta una stringa (`"provider/model"`) o un oggetto (`{ primary, fallbacks }`).
  - La forma stringa imposta solo il modello principale.
  - La forma oggetto imposta il principale più i modelli di failover ordinati.
- `imageModel`: accetta una stringa (`"provider/model"`) o un oggetto (`{ primary, fallbacks }`).
  - Usato dal percorso dello strumento `image` come configurazione del modello di visione.
  - Usato anche come routing di fallback quando il modello selezionato/predefinito non può accettare input immagine.
  - Preferisci riferimenti `provider/model` espliciti. Gli ID semplici sono accettati per compatibilità; se un ID semplice corrisponde in modo univoco a una voce configurata con supporto immagini in `models.providers.*.models`, OpenClaw lo qualifica per quel provider. Le corrispondenze configurate ambigue richiedono un prefisso provider esplicito.
- `imageGenerationModel`: accetta una stringa (`"provider/model"`) o un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione immagini e da qualsiasi superficie futura di strumento/plugin che generi immagini.
  - Valori tipici: `google/gemini-3.1-flash-image-preview` per la generazione immagini nativa di Gemini, `fal/fal-ai/flux/dev` per fal, `openai/gpt-image-2` per OpenAI Images, oppure `openai/gpt-image-1.5` per output OpenAI PNG/WebP con sfondo trasparente.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione del provider corrispondente (per esempio `GEMINI_API_KEY` o `GOOGLE_API_KEY` per `google/*`, `OPENAI_API_KEY` o OpenAI Codex OAuth per `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` per `fal/*`).
  - Se omesso, `image_generate` può comunque dedurre un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione immagini registrati in ordine di ID provider.
- `musicGenerationModel`: accetta una stringa (`"provider/model"`) o un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione musica e dallo strumento integrato `music_generate`.
  - Valori tipici: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Se omesso, `music_generate` può comunque dedurre un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione musica registrati in ordine di ID provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/chiave API del provider corrispondente.
- `videoGenerationModel`: accetta una stringa (`"provider/model"`) o un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione video e dallo strumento integrato `video_generate`.
  - Valori tipici: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Se omesso, `video_generate` può comunque dedurre un provider predefinito supportato da autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione video registrati in ordine di ID provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/chiave API del provider corrispondente.
  - Il provider integrato di generazione video Qwen supporta fino a 1 video di output, 1 immagine di input, 4 video di input, durata di 10 secondi e opzioni a livello di provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: accetta una stringa (`"provider/model"`) o un oggetto (`{ primary, fallbacks }`).
  - Usato dallo strumento `pdf` per il routing del modello.
  - Se omesso, lo strumento PDF fa fallback su `imageModel`, poi sul modello risolto della sessione/predefinito.
- `pdfMaxBytesMb`: limite predefinito di dimensione PDF per lo strumento `pdf` quando `maxBytesMb` non viene passato al momento della chiamata.
- `pdfMaxPages`: numero massimo predefinito di pagine considerate dalla modalità di fallback dell'estrazione nello strumento `pdf`.
- `verboseDefault`: livello verboso predefinito per gli agenti. Valori: `"off"`, `"on"`, `"full"`. Predefinito: `"off"`.
- `reasoningDefault`: visibilità predefinita del ragionamento per gli agenti. Valori: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` per agente sovrascrive questo valore predefinito. I valori predefiniti di ragionamento configurati sono applicati solo per proprietari, mittenti autorizzati o contesti Gateway di amministratore operatore quando non è impostata una sovrascrittura del ragionamento per messaggio o sessione.
- `elevatedDefault`: livello predefinito di output elevato per gli agenti. Valori: `"off"`, `"on"`, `"ask"`, `"full"`. Predefinito: `"on"`.
- `model.primary`: formato `provider/model` (ad es. `openai/gpt-5.5` per accesso con chiave API o `openai-codex/gpt-5.5` per Codex OAuth). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca del provider configurato per quell'ID modello esatto, e solo dopo fa fallback sul provider predefinito configurato (comportamento di compatibilità deprecato, quindi preferisci `provider/model` esplicito). Se quel provider non espone più il modello predefinito configurato, OpenClaw fa fallback sul primo provider/modello configurato invece di mostrare un valore predefinito obsoleto di un provider rimosso.
- `models`: catalogo dei modelli configurato e allowlist per `/model`. Ogni voce può includere `alias` (scorciatoia) e `params` (specifici del provider, per esempio `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Modifiche sicure: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci. `config set` rifiuta sostituzioni che rimuoverebbero voci allowlist esistenti, a meno che non passi `--replace`.
  - I flussi di configurazione/onboarding con ambito provider uniscono i modelli del provider selezionati in questa mappa e preservano i provider non correlati già configurati.
  - Per modelli OpenAI Responses diretti, la Compaction lato server è abilitata automaticamente. Usa `params.responsesServerCompaction: false` per interrompere l'iniezione di `context_management`, oppure `params.responsesCompactThreshold` per sovrascrivere la soglia. Vedi [Compaction lato server OpenAI](/it/providers/openai#server-side-compaction-responses-api).
- `params`: parametri globali predefiniti del provider applicati a tutti i modelli. Impostati in `agents.defaults.params` (ad es. `{ cacheRetention: "long" }`).
- Precedenza di merge di `params` (configurazione): `agents.defaults.params` (base globale) è sovrascritto da `agents.defaults.models["provider/model"].params` (per modello), poi `agents.list[].params` (ID agente corrispondente) sovrascrive per chiave. Vedi [Prompt Caching](/it/reference/prompt-caching) per i dettagli.
- `params.extra_body`/`params.extraBody`: JSON avanzato pass-through unito nei body delle richieste `api: "openai-completions"` per proxy compatibili con OpenAI. Se entra in conflitto con chiavi di richiesta generate, il body extra prevale; le route completions non native rimuovono comunque dopo `store` specifico di OpenAI.
- `params.chat_template_kwargs`: argomenti chat-template compatibili con vLLM/OpenAI uniti nei body di richiesta di primo livello `api: "openai-completions"`. Per `vllm/nemotron-3-*` con thinking disattivato, il Plugin vLLM integrato invia automaticamente `enable_thinking: false` e `force_nonempty_content: true`; `chat_template_kwargs` espliciti sovrascrivono i valori predefiniti generati, e `extra_body.chat_template_kwargs` mantiene comunque la precedenza finale. Per i controlli thinking di vLLM Qwen, imposta `params.qwenThinkingFormat` a `"chat-template"` o `"top-level"` su quella voce di modello.
- `compat.supportedReasoningEfforts`: elenco di effort di ragionamento compatibili con OpenAI per modello. Includi `"xhigh"` per endpoint personalizzati che lo accettano davvero; OpenClaw espone quindi `/think xhigh` nei menu dei comandi, nelle righe di sessione Gateway, nella validazione delle patch di sessione, nella validazione CLI degli agenti e nella validazione `llm-task` per quel provider/modello configurato. Usa `compat.reasoningEffortMap` quando il backend vuole un valore specifico del provider per un livello canonico.
- `params.preserveThinking`: opt-in solo Z.AI per thinking preservato. Quando abilitato e thinking è attivo, OpenClaw invia `thinking.clear_thinking: false` e riproduce il precedente `reasoning_content`; vedi [thinking e thinking preservato Z.AI](/it/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: criterio predefinito del runtime agente di basso livello. L'ID omesso usa come predefinito OpenClaw Pi. Usa `id: "pi"` per forzare l'harness PI integrato, `id: "auto"` per lasciare che gli harness Plugin registrati rivendichino i modelli supportati, un ID harness registrato come `id: "codex"`, oppure un alias backend CLI supportato come `id: "claude-cli"`. Imposta `fallback: "none"` per disabilitare il fallback PI automatico. I runtime Plugin espliciti come `codex` falliscono in modo chiuso per impostazione predefinita, a meno che non imposti `fallback: "pi"` nello stesso ambito di sovrascrittura. Mantieni canonici i riferimenti ai modelli come `provider/model`; seleziona Codex, Claude CLI, Gemini CLI e altri backend di esecuzione tramite configurazione runtime invece dei prefissi provider runtime legacy. Vedi [Runtime agenti](/it/concepts/agent-runtimes) per capire in cosa differisce dalla selezione provider/modello.
- Gli scrittori di configurazione che modificano questi campi (per esempio `/models set`, `/models set-image` e comandi di aggiunta/rimozione fallback) salvano la forma oggetto canonica e preservano gli elenchi di fallback esistenti quando possibile.
- `maxConcurrent`: numero massimo di esecuzioni agente parallele tra sessioni (ogni sessione resta comunque serializzata). Predefinito: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` controlla quale esecutore di basso livello esegue i turni agente. La maggior parte delle distribuzioni dovrebbe mantenere il runtime OpenClaw Pi predefinito. Usalo quando un Plugin attendibile fornisce un harness nativo, come l'harness app-server Codex integrato, oppure quando vuoi un backend CLI supportato come Claude CLI. Per il modello mentale, vedi [Runtime agenti](/it/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, un ID harness Plugin registrato o un alias backend CLI supportato. Il Plugin Codex integrato registra `codex`; il Plugin Anthropic integrato fornisce il backend CLI `claude-cli`.
- `fallback`: `"pi"` o `"none"`. In `id: "auto"`, il fallback omesso usa come predefinito `"pi"` così le vecchie configurazioni possono continuare a usare PI quando nessun harness Plugin rivendica un'esecuzione. In modalità runtime Plugin esplicita, come `id: "codex"`, il fallback omesso usa come predefinito `"none"` così un harness mancante fallisce invece di usare silenziosamente PI. Le sovrascritture runtime non ereditano il fallback da un ambito più ampio; imposta `fallback: "pi"` insieme al runtime esplicito quando vuoi intenzionalmente quel fallback di compatibilità. Gli errori dell'harness Plugin selezionato vengono sempre mostrati direttamente.
- Sovrascritture di ambiente: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` sovrascrive `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` sovrascrive il fallback per quel processo.
- Per distribuzioni solo Codex, imposta `model: "openai/gpt-5.5"` e `agentRuntime.id: "codex"`. Puoi anche impostare esplicitamente `agentRuntime.fallback: "none"` per leggibilità; è il valore predefinito per runtime Plugin espliciti.
- Per distribuzioni Claude CLI, preferisci `model: "anthropic/claude-opus-4-7"` più `agentRuntime.id: "claude-cli"`. I riferimenti modello legacy `claude-cli/claude-opus-4-7` funzionano ancora per compatibilità, ma la nuova configurazione dovrebbe mantenere canonica la selezione provider/modello e mettere il backend di esecuzione in `agentRuntime.id`.
- Le chiavi di criterio runtime meno recenti vengono riscritte in `agentRuntime` da `openclaw doctor --fix`.
- La scelta dell'harness è fissata per ID sessione dopo la prima esecuzione embedded. Le modifiche config/env influenzano le sessioni nuove o reimpostate, non una trascrizione esistente. Le sessioni legacy con cronologia trascrizione ma senza pin registrato sono trattate come vincolate a PI. `/status` segnala il runtime effettivo, per esempio `Runtime: OpenClaw Pi Default` o `Runtime: OpenAI Codex`.
- Questo controlla solo l'esecuzione dei turni agente testuali. Generazione media, visione, PDF, musica, video e TTS usano comunque le loro impostazioni provider/modello.

**Abbreviazioni di alias integrate** (si applicano solo quando il modello è in `agents.defaults.models`):

| Alias               | Modello                                    |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` o `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Gli alias configurati hanno sempre la precedenza sui valori predefiniti.

I modelli Z.AI GLM-4.x abilitano automaticamente la modalità di ragionamento a meno che tu non imposti `--thinking off` o non definisca personalmente `agents.defaults.models["zai/<model>"].params.thinking`.
I modelli Z.AI abilitano `tool_stream` per impostazione predefinita per lo streaming delle chiamate agli strumenti. Imposta `agents.defaults.models["zai/<model>"].params.tool_stream` su `false` per disabilitarlo.
I modelli Anthropic Claude 4.6 usano per impostazione predefinita il ragionamento `adaptive` quando non è impostato alcun livello di ragionamento esplicito.

### `agents.defaults.cliBackends`

Backend CLI opzionali per esecuzioni di fallback solo testo (senza chiamate agli strumenti). Utili come backup quando i provider API non riescono.

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

### `agents.defaults.systemPromptOverride`

Sostituisce l'intero prompt di sistema assemblato da OpenClaw con una stringa fissa. Impostalo al livello predefinito (`agents.defaults.systemPromptOverride`) o per agente (`agents.list[].systemPromptOverride`). I valori per agente hanno la precedenza; un valore vuoto o composto solo da spazi viene ignorato. Utile per esperimenti controllati sui prompt.

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

Overlay dei prompt indipendenti dal provider applicati per famiglia di modelli. Gli ID dei modelli della famiglia GPT-5 ricevono il contratto di comportamento condiviso tra provider; `personality` controlla solo il livello dello stile di interazione amichevole.

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

- `"friendly"` (predefinito) e `"on"` abilitano il livello dello stile di interazione amichevole.
- `"off"` disabilita solo il livello amichevole; il contratto di comportamento GPT-5 con tag rimane abilitato.
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
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
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
- `suppressToolErrorWarnings`: quando è true, sopprime i payload di avviso per errori degli strumenti durante le esecuzioni Heartbeat.
- `timeoutSeconds`: tempo massimo in secondi consentito per un turno dell'agente Heartbeat prima che venga interrotto. Lascia non impostato per usare `agents.defaults.timeoutSeconds`.
- `directPolicy`: criterio di consegna diretta/DM. `allow` (predefinito) consente la consegna a destinazione diretta. `block` sopprime la consegna a destinazione diretta ed emette `reason=dm-blocked`.
- `lightContext`: quando è true, le esecuzioni Heartbeat usano un contesto di bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file di bootstrap dell'area di lavoro.
- `isolatedSession`: quando è true, ogni Heartbeat viene eseguito in una sessione nuova senza cronologia di conversazione precedente. Stesso schema di isolamento di cron `sessionTarget: "isolated"`. Riduce il costo in token per Heartbeat da circa 100K a circa 2-5K token.
- `skipWhenBusy`: quando è true, le esecuzioni Heartbeat vengono rinviate su ulteriori corsie occupate: lavoro di subagenti o comandi annidati. Le corsie Cron rinviano sempre gli Heartbeat, anche senza questo flag.
- Per agente: imposta `agents.list[].heartbeat`. Quando un agente definisce `heartbeat`, **solo quegli agenti** eseguono Heartbeat.
- Gli Heartbeat eseguono turni completi dell'agente: intervalli più brevi consumano più token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
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
- `provider`: ID di un provider Plugin di compaction registrato. Quando è impostato, viene chiamato `summarize()` del provider invece del riepilogo LLM integrato. In caso di errore, torna al riepilogo integrato. Impostare un provider forza `mode: "safeguard"`. Vedi [Compaction](/it/concepts/compaction).
- `timeoutSeconds`: numero massimo di secondi consentiti per una singola operazione di compaction prima che OpenClaw la interrompa. Predefinito: `900`.
- `keepRecentTokens`: budget del punto di taglio Pi per mantenere alla lettera la coda più recente della trascrizione. `/compact` manuale lo rispetta quando impostato esplicitamente; altrimenti la compaction manuale è un checkpoint rigido.
- `identifierPolicy`: `strict` (predefinito), `off` o `custom`. `strict` antepone indicazioni integrate per la conservazione degli identificatori opachi durante il riepilogo della compaction.
- `identifierInstructions`: testo personalizzato opzionale per la conservazione degli identificatori usato quando `identifierPolicy=custom`.
- `qualityGuard`: controlli con nuovo tentativo su output malformato per i riepiloghi safeguard. Abilitato per impostazione predefinita in modalità safeguard; imposta `enabled: false` per saltare l'audit.
- `midTurnPrecheck`: controllo opzionale della pressione del ciclo strumenti Pi. Quando `enabled: true`, OpenClaw controlla la pressione del contesto dopo l'aggiunta dei risultati degli strumenti e prima della successiva chiamata al modello. Se il contesto non rientra più nei limiti, interrompe il tentativo corrente prima di inviare il prompt e riutilizza il percorso di recupero precheck esistente per troncare i risultati degli strumenti o eseguire la compaction e riprovare. Funziona con entrambe le modalità di compaction `default` e `safeguard`. Predefinito: disabilitato.
- `postCompactionSections`: nomi opzionali di sezioni H2/H3 di AGENTS.md da reiniettare dopo la compaction. Per impostazione predefinita usa `["Session Startup", "Red Lines"]`; imposta `[]` per disabilitare la reiniezione. Quando non impostato o impostato esplicitamente su quella coppia predefinita, anche le intestazioni precedenti `Every Session`/`Safety` sono accettate come fallback legacy.
- `model`: override opzionale `provider/model-id` solo per il riepilogo della compaction. Usalo quando la sessione principale deve mantenere un modello ma i riepiloghi di compaction devono essere eseguiti su un altro; quando non è impostato, la compaction usa il modello principale della sessione.
- `maxActiveTranscriptBytes`: soglia opzionale in byte (`number` o stringhe come `"20mb"`) che attiva la normale compaction locale prima di un'esecuzione quando il JSONL attivo supera la soglia. Richiede `truncateAfterCompaction` affinché una compaction riuscita possa ruotare a una trascrizione successiva più piccola. Disabilitato quando non impostato o `0`.
- `notifyUser`: quando è `true`, invia brevi avvisi all'utente quando la compaction inizia e quando si completa (ad esempio, "Compacting context..." e "Compaction complete"). Disabilitato per impostazione predefinita per mantenere silenziosa la compaction.
- `memoryFlush`: turno agentico silenzioso prima della compaction automatica per archiviare memorie durevoli. Imposta `model` su un provider/modello esatto come `ollama/qwen3:8b` quando questo turno di manutenzione deve restare su un modello locale; l'override non eredita la catena di fallback della sessione attiva. Saltato quando l'area di lavoro è in sola lettura.

### `agents.defaults.contextPruning`

Rimuove i **vecchi risultati degli strumenti** dal contesto in memoria prima dell'invio all'LLM. **Non** modifica la cronologia della sessione su disco.

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

<Accordion title="comportamento della modalità cache-ttl">

- `mode: "cache-ttl"` abilita i passaggi di potatura.
- `ttl` controlla quanto spesso la potatura può essere eseguita di nuovo (dopo l'ultimo accesso alla cache).
- La potatura prima tronca parzialmente i risultati degli strumenti sovradimensionati, poi, se necessario, cancella completamente i risultati degli strumenti più vecchi.

**Troncamento parziale** mantiene inizio + fine e inserisce `...` al centro.

**Cancellazione completa** sostituisce l'intero risultato dello strumento con il segnaposto.

Note:

- I blocchi immagine non vengono mai troncati/cancellati.
- I rapporti sono basati sui caratteri (approssimativi), non su conteggi esatti dei token.
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
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- I canali non Telegram richiedono `*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
- Override dei canali: `channels.<channel>.blockStreamingCoalesce` (e varianti per account). Signal/Slack/Discord/Google Chat usano per impostazione predefinita `minChars: 1500`.
- `humanDelay`: pausa casuale tra le risposte a blocchi. `natural` = 800–2500 ms. Override per agente: `agents.list[].humanDelay`.

Consulta [Streaming](/it/concepts/streaming) per i dettagli su comportamento e suddivisione in blocchi.

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

- Valori predefiniti: `instant` per chat dirette/menzioni, `message` per chat di gruppo senza menzione.
- Override per sessione: `session.typingMode`, `session.typingIntervalSeconds`.

Consulta [Indicatori di digitazione](/it/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing facoltativo per l'agente incorporato. Consulta [Sandboxing](/it/gateway/sandboxing) per la guida completa.

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

Quando viene selezionato `backend: "openshell"`, le impostazioni specifiche del runtime passano a
`plugins.entries.openshell.config`.

**Configurazione del backend SSH:**

- `target`: destinazione SSH nel formato `user@host[:port]`
- `command`: comando del client SSH (predefinito: `ssh`)
- `workspaceRoot`: radice remota assoluta usata per gli spazi di lavoro per ambito
- `identityFile` / `certificateFile` / `knownHostsFile`: file locali esistenti passati a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenuti inline o SecretRefs che OpenClaw materializza in file temporanei a runtime
- `strictHostKeyChecking` / `updateHostKeys`: opzioni della policy delle chiavi host di OpenSSH

**Precedenza dell'autenticazione SSH:**

- `identityData` prevale su `identityFile`
- `certificateData` prevale su `certificateFile`
- `knownHostsData` prevale su `knownHostsFile`
- I valori `*Data` basati su SecretRef vengono risolti dallo snapshot del runtime dei segreti attivi prima dell'avvio della sessione sandbox

**Comportamento del backend SSH:**

- inizializza lo spazio di lavoro remoto una volta dopo la creazione o ricreazione
- poi mantiene canonico lo spazio di lavoro SSH remoto
- instrada `exec`, strumenti file e percorsi multimediali tramite SSH
- non sincronizza automaticamente le modifiche remote verso l'host
- non supporta i container del browser sandbox

**Accesso allo spazio di lavoro:**

- `none`: spazio di lavoro sandbox per ambito sotto `~/.openclaw/sandboxes`
- `ro`: spazio di lavoro sandbox in `/workspace`, spazio di lavoro dell'agente montato in sola lettura in `/agent`
- `rw`: spazio di lavoro dell'agente montato in lettura/scrittura in `/workspace`

**Ambito:**

- `session`: container + spazio di lavoro per sessione
- `agent`: un container + spazio di lavoro per agente (predefinito)
- `shared`: container e spazio di lavoro condivisi (nessun isolamento tra sessioni)

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

- `mirror`: inizializza il remoto dal locale prima di exec, sincronizza indietro dopo exec; lo spazio di lavoro locale resta canonico
- `remote`: inizializza il remoto una volta quando la sandbox viene creata, poi mantiene canonico lo spazio di lavoro remoto

In modalità `remote`, le modifiche locali all'host effettuate fuori da OpenClaw non vengono sincronizzate automaticamente nella sandbox dopo la fase di inizializzazione.
Il trasporto è SSH verso la sandbox OpenShell, ma il Plugin gestisce il ciclo di vita della sandbox e la sincronizzazione mirror facoltativa.

**`setupCommand`** viene eseguito una volta dopo la creazione del container (tramite `sh -lc`). Richiede uscita di rete, radice scrivibile, utente root.

**Per impostazione predefinita i container usano `network: "none"`** — impostalo su `"bridge"` (o su una rete bridge personalizzata) se l'agente necessita di accesso in uscita.
`"host"` è bloccato. `"container:<id>"` è bloccato per impostazione predefinita a meno che tu non imposti esplicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Gli allegati in ingresso** vengono predisposti in `media/inbound/*` nello spazio di lavoro attivo.

**`docker.binds`** monta directory host aggiuntive; i bind globali e per agente vengono uniti.

**Browser sandbox** (`sandbox.browser.enabled`): Chromium + CDP in un container. URL noVNC iniettato nel prompt di sistema. Non richiede `browser.enabled` in `openclaw.json`.
L'accesso osservatore noVNC usa l'autenticazione VNC per impostazione predefinita e OpenClaw emette un URL con token a breve durata (invece di esporre la password nell'URL condiviso).

- `allowHostControl: false` (predefinito) impedisce alle sessioni sandbox di indirizzarsi al browser host.
- `network` usa per impostazione predefinita `openclaw-sandbox-browser` (rete bridge dedicata). Imposta `bridge` solo quando vuoi esplicitamente la connettività bridge globale.
- `cdpSourceRange` limita facoltativamente l'ingresso CDP al bordo del container a un intervallo CIDR (per esempio `172.21.0.1/32`).
- `sandbox.browser.binds` monta directory host aggiuntive solo nel container del browser sandbox. Quando impostato (incluso `[]`), sostituisce `docker.binds` per il container del browser.
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` riabilita le estensioni se il tuo flusso di lavoro
    ne dipende.
  - `--renderer-process-limit=2` può essere modificato con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; imposta `0` per usare il
    limite di processi predefinito di Chromium.
  - più `--no-sandbox` quando `noSandbox` è abilitato.
  - I valori predefiniti sono la baseline dell'immagine container; usa un'immagine browser personalizzata con un
    entrypoint personalizzato per modificare i valori predefiniti del container.

</Accordion>

Il sandboxing del browser e `sandbox.docker.binds` sono disponibili solo con Docker.

Crea le immagini (da un checkout sorgente):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Per installazioni npm senza checkout sorgente, consulta [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup) per i comandi `docker build` inline.

### `agents.list` (override per agente)

Usa `agents.list[].tts` per assegnare a un agente il proprio provider TTS, voce, modello,
stile o modalità TTS automatica. Il blocco dell'agente viene unito in profondità sopra
`messages.tts` globale, quindi le credenziali condivise possono restare in un unico punto mentre i singoli
agenti sovrascrivono solo i campi voce o provider di cui hanno bisogno. L'override dell'agente attivo
si applica alle risposte vocali automatiche, a `/tts audio`, `/tts status` e
allo strumento agente `tts`. Consulta [Text-to-speech](/it/tools/tts#per-agent-voice-overrides)
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
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
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

- `id`: id stabile dell'agente (obbligatorio).
- `default`: quando ne sono impostati più di uno, prevale il primo (viene registrato un avviso). Se nessuno è impostato, la prima voce dell'elenco è quella predefinita.
- `model`: la forma stringa imposta un primario rigoroso per agente senza fallback del modello; anche la forma oggetto `{ primary }` è rigorosa, a meno che tu non aggiunga `fallbacks`. Usa `{ primary, fallbacks: [...] }` per abilitare il fallback per quell'agente, oppure `{ primary, fallbacks: [] }` per rendere esplicito il comportamento rigoroso. I job Cron che sovrascrivono solo `primary` ereditano comunque i fallback predefiniti, a meno che tu non imposti `fallbacks: []`.
- `params`: parametri di stream per agente uniti sopra la voce del modello selezionata in `agents.defaults.models`. Usalo per override specifici dell'agente come `cacheRetention`, `temperature` o `maxTokens` senza duplicare l'intero catalogo dei modelli.
- `tts`: override facoltativi di sintesi vocale per agente. Il blocco viene unito in profondità sopra `messages.tts`, quindi mantieni le credenziali del provider condivise e la policy di fallback in `messages.tts` e imposta qui solo i valori specifici della persona, come provider, voce, modello, stile o modalità automatica.
- `skills`: allowlist facoltativa delle skill per agente. Se omesso, l'agente eredita `agents.defaults.skills` quando è impostato; un elenco esplicito sostituisce i valori predefiniti invece di unirli, e `[]` significa nessuna skill.
- `thinkingDefault`: livello di pensiero predefinito facoltativo per agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sovrascrive `agents.defaults.thinkingDefault` per questo agente quando non è impostato alcun override per messaggio o sessione. Il profilo provider/modello selezionato controlla quali valori sono validi; per Google Gemini, `adaptive` mantiene il pensiero dinamico gestito dal provider (`thinkingLevel` omesso su Gemini 3/3.1, `thinkingBudget: -1` su Gemini 2.5).
- `reasoningDefault`: visibilità del reasoning predefinita facoltativa per agente (`on | off | stream`). Sovrascrive `agents.defaults.reasoningDefault` per questo agente quando non è impostato alcun override del reasoning per messaggio o sessione.
- `fastModeDefault`: valore predefinito facoltativo per agente per la modalità rapida (`true | false`). Si applica quando non è impostato alcun override della modalità rapida per messaggio o sessione.
- `agentRuntime`: override facoltativo della policy di runtime di basso livello per agente. Usa `{ id: "codex" }` per rendere un agente solo Codex mentre gli altri agenti mantengono il fallback PI predefinito in modalità `auto`.
- `runtime`: descrittore di runtime facoltativo per agente. Usa `type: "acp"` con i valori predefiniti di `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando l'agente deve usare come impostazione predefinita sessioni dell'harness ACP.
- `identity.avatar`: percorso relativo al workspace, URL `http(s)` o URI `data:`.
- `identity` deriva i valori predefiniti: `ackReaction` da `emoji`, `mentionPatterns` da `name`/`emoji`.
- `subagents.allowAgents`: allowlist di id agente per target espliciti `sessions_spawn.agentId` (`["*"]` = qualsiasi; predefinito: solo lo stesso agente). Includi l'id del richiedente quando devono essere consentite chiamate `agentId` indirizzate a sé stesse.
- Protezione di ereditarietà della sandbox: se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta i target che verrebbero eseguiti senza sandbox.
- `subagents.requireAgentId`: quando è true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo; predefinito: false).

---

## Routing multi-agente

Esegui più agenti isolati all'interno di un Gateway. Vedi [Multi-Agent](/it/concepts/multi-agent).

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

- `type` (facoltativo): `route` per il routing normale (il tipo mancante usa route come predefinito), `acp` per binding di conversazioni ACP persistenti.
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
5. `match.accountId: "*"` (a livello di canale)
6. Agente predefinito

All'interno di ciascun livello, prevale la prima voce `bindings` corrispondente.

Per le voci `type: "acp"`, OpenClaw risolve in base all'identità esatta della conversazione (`match.channel` + account + `match.peer.id`) e non usa l'ordine dei livelli di binding di route sopra indicato.

### Profili di accesso per agente

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

Vedi [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) per i dettagli di precedenza.

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
      mode: "warn", // warn | enforce
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

- **`scope`**: strategia di raggruppamento della sessione di base per i contesti di chat di gruppo.
  - `per-sender` (predefinito): ogni mittente ottiene una sessione isolata all'interno di un contesto di canale.
  - `global`: tutti i partecipanti in un contesto di canale condividono una singola sessione (usa solo quando si intende un contesto condiviso).
- **`dmScope`**: come vengono raggruppati i DM.
  - `main`: tutti i DM condividono la sessione principale.
  - `per-peer`: isola per id mittente tra i canali.
  - `per-channel-peer`: isola per canale + mittente (consigliato per caselle di posta multiutente).
  - `per-account-channel-peer`: isola per account + canale + mittente (consigliato per più account).
- **`identityLinks`**: associa id canonici a peer con prefisso del provider per la condivisione delle sessioni tra canali. Comandi di dock come `/dock_discord` usano la stessa mappa per spostare la route di risposta della sessione attiva verso un altro peer di canale collegato; vedi [Docking dei canali](/it/concepts/channel-docking).
- **`reset`**: criterio di reset principale. `daily` esegue il reset all'ora locale `atHour`; `idle` esegue il reset dopo `idleMinutes`. Quando sono configurati entrambi, vince quello che scade per primo. La freschezza del reset giornaliero usa `sessionStartedAt` della riga della sessione; la freschezza del reset per inattività usa `lastInteractionAt`. Scritture in background/eventi di sistema come Heartbeat, risvegli Cron, notifiche exec e contabilità del Gateway possono aggiornare `updatedAt`, ma non mantengono fresche le sessioni giornaliere/per inattività.
- **`resetByType`**: override per tipo (`direct`, `group`, `thread`). `dm` legacy accettato come alias di `direct`.
- **`mainKey`**: campo legacy. Il runtime usa sempre `"main"` per il bucket principale della chat diretta.
- **`agentToAgent.maxPingPongTurns`**: numero massimo di turni di risposta tra agenti durante scambi agente-agente (intero, intervallo: `0`–`5`). `0` disabilita il concatenamento ping-pong.
- **`sendPolicy`**: corrisponde per `channel`, `chatType` (`direct|group|channel`, con alias legacy `dm`), `keyPrefix` o `rawKeyPrefix`. Il primo diniego vince.
- **`maintenance`**: pulizia dello store delle sessioni + controlli di retention.
  - `mode`: `warn` emette solo avvisi; `enforce` applica la pulizia.
  - `pruneAfter`: soglia di età per voci obsolete (predefinito `30d`).
  - `maxEntries`: numero massimo di voci in `sessions.json` (predefinito `500`). Il runtime scrive la pulizia batch con un piccolo buffer high-water per limiti di dimensioni di produzione; `openclaw sessions cleanup --enforce` applica il limite immediatamente.
  - `rotateBytes`: deprecato e ignorato; `openclaw doctor --fix` lo rimuove dalle configurazioni più vecchie.
  - `resetArchiveRetention`: retention per archivi di trascrizioni `*.reset.<timestamp>`. Predefinita a `pruneAfter`; imposta `false` per disabilitarla.
  - `maxDiskBytes`: budget disco opzionale per la directory delle sessioni. In modalità `warn` registra avvisi; in modalità `enforce` rimuove prima gli artefatti/sessioni più vecchi.
  - `highWaterBytes`: obiettivo opzionale dopo la pulizia del budget. Predefinito all'`80%` di `maxDiskBytes`.
- **`threadBindings`**: impostazioni predefinite globali per le funzionalità di sessione legate ai thread.
  - `enabled`: interruttore predefinito principale (i provider possono sovrascriverlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus predefinito per inattività in ore (`0` disabilita; i provider possono sovrascriverlo)
  - `maxAgeHours`: età massima rigida predefinita in ore (`0` disabilita; i provider possono sovrascriverla)
  - `spawnSessions`: gate predefinito per creare sessioni di lavoro legate ai thread da `sessions_spawn` e spawn di thread ACP. Predefinito a `true` quando i binding dei thread sono abilitati; provider/account possono sovrascriverlo.
  - `defaultSpawnContext`: contesto subagent nativo predefinito per gli spawn legati ai thread (`"fork"` o `"isolated"`). Predefinito a `"fork"`.

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
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
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

### Prefisso della risposta

Override per canale/account: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Risoluzione (vince il più specifico): account → canale → globale. `""` disabilita e interrompe la cascata. `"auto"` deriva `[{identity.name}]`.

**Variabili del template:**

| Variabile         | Descrizione                 | Esempio                     |
| ----------------- | --------------------------- | --------------------------- |
| `{model}`         | Nome modello breve          | `claude-opus-4-6`           |
| `{modelFull}`     | Identificatore modello completo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome provider               | `anthropic`                 |
| `{thinkingLevel}` | Livello di ragionamento corrente | `high`, `low`, `off`        |
| `{identity.name}` | Nome identità dell'agente   | (uguale a `"auto"`)         |

Le variabili non distinguono tra maiuscole e minuscole. `{think}` è un alias di `{thinkingLevel}`.

### Reazione di conferma

- Predefinita a `identity.emoji` dell'agente attivo, altrimenti `"👀"`. Imposta `""` per disabilitare.
- Override per canale: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordine di risoluzione: account → canale → `messages.ackReaction` → fallback identità.
- Ambito: `group-mentions` (predefinito), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: rimuove la conferma dopo la risposta sui canali che supportano le reazioni, come Slack, Discord, Telegram, WhatsApp e BlueBubbles.
- `messages.statusReactions.enabled`: abilita le reazioni di stato del ciclo di vita su Slack, Discord e Telegram.
  Su Slack e Discord, non impostato mantiene abilitate le reazioni di stato quando le reazioni di conferma sono attive.
  Su Telegram, impostalo esplicitamente a `true` per abilitare le reazioni di stato del ciclo di vita.

### Debounce in ingresso

Raggruppa messaggi rapidi di solo testo dallo stesso mittente in un unico turno dell'agente. Media/allegati vengono inviati immediatamente. I comandi di controllo bypassano il debounce.

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

- `auto` controlla la modalità auto-TTS predefinita: `off`, `always`, `inbound` o `tagged`. `/tts on|off` può sovrascrivere le preferenze locali, e `/tts status` mostra lo stato effettivo.
- `summaryModel` sovrascrive `agents.defaults.model.primary` per il riepilogo automatico.
- `modelOverrides` è abilitato per impostazione predefinita; `modelOverrides.allowProvider` è predefinito a `false` (opt-in).
- Le chiavi API usano come fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- I provider vocali inclusi sono di proprietà dei Plugin. Se `plugins.allow` è impostato, includi ogni Plugin provider TTS che vuoi usare, per esempio `microsoft` per Edge TTS. L'id provider legacy `edge` è accettato come alias di `microsoft`.
- `providers.openai.baseUrl` sovrascrive l'endpoint TTS di OpenAI. L'ordine di risoluzione è configurazione, poi `OPENAI_TTS_BASE_URL`, poi `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` punta a un endpoint non OpenAI, OpenClaw lo tratta come server TTS compatibile con OpenAI e allenta la validazione di modello/voce.

---

## Talk

Impostazioni predefinite per la modalità Talk (macOS/iOS/Android).

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` deve corrispondere a una chiave in `talk.providers` quando sono configurati più provider Talk.
- Le chiavi Talk piatte legacy (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sono solo di compatibilità e vengono migrate automaticamente in `talk.providers.<provider>`.
- Gli ID voce usano come fallback `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` accetta stringhe in chiaro o oggetti SecretRef.
- Il fallback `ELEVENLABS_API_KEY` si applica solo quando non è configurata alcuna chiave API Talk.
- `providers.*.voiceAliases` consente alle direttive Talk di usare nomi descrittivi.
- `providers.mlx.modelId` seleziona il repository Hugging Face usato dall'helper MLX locale di macOS. Se omesso, macOS usa `mlx-community/Soprano-80M-bf16`.
- La riproduzione MLX su macOS passa attraverso l'helper incluso `openclaw-mlx-tts` quando presente, oppure un eseguibile su `PATH`; `OPENCLAW_MLX_TTS_BIN` sovrascrive il percorso dell'helper per lo sviluppo.
- `speechLocale` imposta l'id locale BCP 47 usato dal riconoscimento vocale Talk di iOS/macOS. Lascialo non impostato per usare l'impostazione predefinita del dispositivo.
- `silenceTimeoutMs` controlla quanto a lungo la modalità Talk attende dopo il silenzio dell'utente prima di inviare la trascrizione. Non impostato mantiene la finestra di pausa predefinita della piattaforma (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Correlati

- [Riferimento configurazione](/it/gateway/configuration-reference) — tutte le altre chiavi di configurazione
- [Configurazione](/it/gateway/configuration) — attività comuni e configurazione rapida
- [Esempi di configurazione](/it/gateway/configuration-examples)
