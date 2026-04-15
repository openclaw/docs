---
read_when:
    - Devi chiamare gli helper del core da un Plugin (TTS, STT, generazione di immagini, ricerca sul web, subagent)
    - Vuoi capire cosa espone `api.runtime`
    - Stai accedendo agli helper di configurazione, agente o media dal codice del Plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- gli helper di runtime iniettati disponibili ai plugin
title: Helper di Runtime del Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77a6e9cd48c84affa17dce684bbd0e072c8b63485e4a5d569f3793a4ea4f9c8
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Helper di Runtime del Plugin

Riferimento per l’oggetto `api.runtime` iniettato in ogni Plugin durante la
registrazione. Usa questi helper invece di importare direttamente gli interni dell’host.

<Tip>
  **Cerchi una guida pratica?** Vedi [Plugin di Canale](/it/plugins/sdk-channel-plugins)
  o [Plugin Provider](/it/plugins/sdk-provider-plugins) per guide passo passo
  che mostrano questi helper nel loro contesto.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Namespace di runtime

### `api.runtime.agent`

Identità dell’agente, directory e gestione della sessione.

```typescript
// Resolve the agent's working directory
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Resolve agent workspace
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Get agent identity
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Get default thinking level
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Get agent timeout
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Ensure workspace exists
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Run an embedded agent turn
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` è l’helper neutrale per avviare un normale turno agente di OpenClaw
dal codice del Plugin. Usa la stessa risoluzione di provider/modello e
la stessa selezione dell’agent harness delle risposte attivate da un canale.

`runEmbeddedPiAgent(...)` resta come alias di compatibilità.

**Gli helper del session store** si trovano in `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Costanti predefinite di modello e provider:

```typescript
const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
```

### `api.runtime.subagent`

Avvia e gestisce esecuzioni di subagent in background.

```typescript
// Start a subagent run
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // optional override
  model: "gpt-4.1-mini", // optional override
  deliver: false,
});

// Wait for completion
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Read session messages
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Delete a session
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Gli override del modello (`provider`/`model`) richiedono l’opt-in dell’operatore tramite
  `plugins.entries.<id>.subagent.allowModelOverride: true` nella configurazione.
  I plugin non attendibili possono comunque eseguire subagent, ma le richieste di override vengono rifiutate.
</Warning>

### `api.runtime.taskFlow`

Associa un runtime di TaskFlow a una chiave di sessione OpenClaw esistente o a un contesto
di tool attendibile, quindi crea e gestisce TaskFlow senza passare un owner a ogni chiamata.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Review new pull requests",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Review PR #123",
  status: "running",
  startedAt: Date.now(),
});

const waiting = taskFlow.setWaiting({
  flowId: created.flowId,
  expectedRevision: created.revision,
  currentStep: "await-human-reply",
  waitJson: { kind: "reply", channel: "telegram" },
});
```

Usa `bindSession({ sessionKey, requesterOrigin })` quando hai già una
chiave di sessione OpenClaw attendibile dal tuo livello di binding. Non effettuare il bind da input utente grezzo.

### `api.runtime.tts`

Sintesi text-to-speech.

```typescript
// Standard TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Telephony-optimized TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// List available voices
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Usa la configurazione core `messages.tts` e la selezione del provider. Restituisce
buffer audio PCM + sample rate.

### `api.runtime.mediaUnderstanding`

Analisi di immagini, audio e video.

```typescript
// Describe an image
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Transcribe audio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // optional, for when MIME cannot be inferred
});

// Describe a video
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Generic file analysis
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Restituisce `{ text: undefined }` quando non viene prodotto alcun output (ad esempio, input saltato).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` resta come alias di compatibilità
  per `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Generazione di immagini.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Ricerca sul web.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Utility multimediali di basso livello.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

Caricamento e scrittura della configurazione.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Utility a livello di sistema.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Sottoscrizioni agli eventi.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Logging.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Risoluzione dell’autenticazione di modelli e provider.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Risoluzione della directory di stato.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Factory di tool di memoria e CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Helper di runtime specifici del canale (disponibili quando viene caricato un Plugin di canale).

`api.runtime.channel.mentions` è la superficie condivisa per la policy delle menzioni in ingresso per
i plugin di canale bundled che usano l’iniezione del runtime:

```typescript
const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
  facts: {
    canDetectMention: true,
    wasMentioned: mentionMatch.matched,
    implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
      "reply_to_bot",
      isReplyToBot,
    ),
  },
  policy: {
    isGroup,
    requireMention,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});
```

Helper per le menzioni disponibili:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` intenzionalmente non espone i vecchi
helper di compatibilità `resolveMentionGating*`. Preferisci il percorso normalizzato
`{ facts, policy }`.

## Memorizzazione dei riferimenti al runtime

Usa `createPluginRuntimeStore` per memorizzare il riferimento al runtime da usare al di fuori
della callback `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// In your entry point
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// In other files
export function getRuntime() {
  return store.getRuntime(); // throws if not initialized
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // returns null if not initialized
}
```

Preferisci `pluginId` per l’identità del runtime-store. La forma di livello inferiore `key` è
per casi non comuni in cui un Plugin ha intenzionalmente bisogno di più di uno slot di runtime.

## Altri campi `api` di primo livello

Oltre a `api.runtime`, l’oggetto API fornisce anche:

| Campo                    | Tipo                      | Descrizione                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del Plugin                                                                               |
| `api.name`               | `string`                  | Nome visualizzato del Plugin                                                                |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot del runtime attivo in memoria quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del Plugin da `plugins.entries.<id>.config`                        |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup prima dell’entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Risolve un percorso relativo alla radice del Plugin                                         |

## Correlati

- [Panoramica dell’SDK](/it/plugins/sdk-overview) -- riferimento dei sottopercorsi
- [Punti di ingresso dell’SDK](/it/plugins/sdk-entrypoints) -- opzioni di `definePluginEntry`
- [Interni del Plugin](/it/plugins/architecture) -- modello di capacità e registro
