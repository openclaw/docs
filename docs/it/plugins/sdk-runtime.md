---
read_when:
    - Devi chiamare helper del core da un plugin (TTS, STT, generazione immagini, ricerca web, subagent)
    - Vuoi capire cosa espone api.runtime
    - Stai accedendo ad helper di configurazione, agente o media dal codice del plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- gli helper runtime iniettati disponibili ai plugin
title: Helper runtime dei plugin
x-i18n:
    generated_at: "2026-04-07T08:15:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: acb9e56678e9ed08d0998dfafd7cd1982b592be5bc34d9e2d2c1f70274f8f248
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Helper runtime dei plugin

Riferimento per l'oggetto `api.runtime` iniettato in ogni plugin durante la
registrazione. Usa questi helper invece di importare direttamente gli interni dell'host.

<Tip>
  **Cerchi una procedura guidata?** Vedi [Channel Plugins](/it/plugins/sdk-channel-plugins)
  o [Provider Plugins](/it/plugins/sdk-provider-plugins) per guide passo passo
  che mostrano questi helper nel loro contesto.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Namespace runtime

### `api.runtime.agent`

Identità dell'agente, directory e gestione delle sessioni.

```typescript
// Risolve la directory di lavoro dell'agente
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Risolve il workspace dell'agente
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Ottiene l'identità dell'agente
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Ottiene il livello di thinking predefinito
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Ottiene il timeout dell'agente
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Si assicura che il workspace esista
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Esegue un agente Pi incorporato
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedPiAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Riassumi le modifiche più recenti",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

Gli **helper del session store** si trovano sotto `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Costanti del provider e del modello predefiniti:

```typescript
const model = api.runtime.agent.defaults.model; // ad es. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // ad es. "anthropic"
```

### `api.runtime.subagent`

Avvia e gestisce esecuzioni subagent in background.

```typescript
// Avvia un'esecuzione subagent
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Espandi questa query in ricerche di follow-up mirate.",
  provider: "openai", // override facoltativo
  model: "gpt-4.1-mini", // override facoltativo
  deliver: false,
});

// Attende il completamento
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Legge i messaggi della sessione
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Elimina una sessione
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Gli override del modello (`provider`/`model`) richiedono l'opt-in
  dell'operatore tramite `plugins.entries.<id>.subagent.allowModelOverride: true` nella
  configurazione. I plugin non attendibili possono comunque eseguire subagent, ma le richieste di override vengono rifiutate.
</Warning>

### `api.runtime.taskFlow`

Associa un runtime Task Flow a una chiave di sessione OpenClaw esistente o a un
contesto di strumento attendibile, quindi crea e gestisce Task Flow senza passare un owner a ogni chiamata.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Esaminare le nuove pull request",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Esamina la PR #123",
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
chiave di sessione OpenClaw attendibile dal tuo layer di binding. Non effettuare il bind da input utente grezzo.

### `api.runtime.tts`

Sintesi text-to-speech.

```typescript
// TTS standard
const clip = await api.runtime.tts.textToSpeech({
  text: "Ciao da OpenClaw",
  cfg: api.config,
});

// TTS ottimizzato per telefonia
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Ciao da OpenClaw",
  cfg: api.config,
});

// Elenca le voci disponibili
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Usa la configurazione core `messages.tts` e la selezione del provider. Restituisce un
buffer audio PCM + sample rate.

### `api.runtime.mediaUnderstanding`

Analisi di immagini, audio e video.

```typescript
// Descrive un'immagine
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Trascrive audio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // facoltativo, quando il MIME non può essere dedotto
});

// Descrive un video
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Analisi generica di file
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Restituisce `{ text: undefined }` quando non viene prodotto alcun output (ad es. input saltato).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` resta come alias di compatibilità
  per `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Generazione di immagini.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "Un robot che dipinge un tramonto",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Ricerca web.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Utilità multimediali di basso livello.

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

Utilità a livello di sistema.

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

Risoluzione dell'autenticazione di modello e provider.

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

Factory degli strumenti memory e CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Helper runtime specifici del canale (disponibili quando viene caricato un plugin canale).

`api.runtime.channel.mentions` è la superficie condivisa della policy di menzione inbound per
i plugin canale inclusi che usano l'iniezione runtime:

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

## Memorizzazione di riferimenti runtime

Usa `createPluginRuntimeStore` per memorizzare il riferimento runtime da usare al di fuori
della callback `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("runtime my-plugin non inizializzato");

// Nel tuo entry point
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// In altri file
export function getRuntime() {
  return store.getRuntime(); // lancia se non inizializzato
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // restituisce null se non inizializzato
}
```

## Altri campi `api` di livello superiore

Oltre a `api.runtime`, l'oggetto API fornisce anche:

| Campo                    | Tipo                      | Descrizione                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del plugin                                                                               |
| `api.name`               | `string`                  | Nome visualizzato del plugin                                                                |
| `api.config`             | `OpenClawConfig`          | Snapshot corrente della configurazione (snapshot runtime attivo in memoria quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del plugin da `plugins.entries.<id>.config`                        |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/configurazione iniziale prima dell'entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Risolve un percorso relativo alla root del plugin                                           |

## Correlati

- [SDK Overview](/it/plugins/sdk-overview) -- riferimento ai sotto-percorsi
- [SDK Entry Points](/it/plugins/sdk-entrypoints) -- opzioni di `definePluginEntry`
- [Plugin Internals](/it/plugins/architecture) -- modello di capability e registro
