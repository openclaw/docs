---
read_when:
    - Vous devez appeler des helpers du cœur depuis un Plugin (TTS, STT, génération d’image, recherche web, sous-agent, nodes)
    - Vous voulez comprendre ce que `api.runtime` expose
    - Vous accédez à des helpers de configuration, d'agent ou de média depuis le code du plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- les helpers d’exécution injectés disponibles pour les plugins
title: Helpers d’exécution de Plugin
x-i18n:
    generated_at: "2026-04-25T13:54:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9f1a56faf33ac18ea7e4b14f70d6f3a73c8b88481aeb0ee77035a17a03f15ce
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Référence pour l’objet `api.runtime` injecté dans chaque plugin pendant
l’enregistrement. Utilisez ces helpers au lieu d’importer directement les internes de l’hôte.

<Tip>
  **Vous cherchez un guide pas à pas ?** Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  ou [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour des guides étape par étape
  qui montrent ces helpers dans leur contexte.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Espaces de noms du runtime

### `api.runtime.agent`

Identité de l’agent, répertoires et gestion de session.

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

`runEmbeddedAgent(...)` est le helper neutre pour démarrer un tour normal
d’agent OpenClaw depuis du code de plugin. Il utilise la même résolution de fournisseur/modèle et
la même sélection de harnais d’agent que les réponses déclenchées par un canal.

`runEmbeddedPiAgent(...)` reste un alias de compatibilité.

Les **helpers du magasin de sessions** se trouvent sous `api.runtime.agent.session` :

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Constantes de modèle et de fournisseur par défaut :

```typescript
const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
```

### `api.runtime.subagent`

Lancez et gérez des exécutions de sous-agent en arrière-plan.

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
  Les surcharges de modèle (`provider`/`model`) nécessitent une activation explicite de l’opérateur via
  `plugins.entries.<id>.subagent.allowModelOverride: true` dans la config.
  Les plugins non fiables peuvent toujours exécuter des sous-agents, mais les demandes de surcharge sont rejetées.
</Warning>

### `api.runtime.nodes`

Listez les nœuds connectés et invoquez une commande hébergée sur un nœud depuis du code de plugin chargé par Gateway
ou depuis des commandes CLI de plugin. Utilisez cela lorsqu’un plugin gère un travail local sur un appareil appairé,
par exemple un pont navigateur ou audio sur un autre Mac.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Dans Gateway, ce runtime s’exécute dans le même processus. Dans les commandes CLI de plugin, il appelle
la Gateway configurée via RPC, afin que des commandes comme `openclaw googlemeet
recover-tab` puissent inspecter les nœuds appairés depuis le terminal. Les commandes de nœud passent toujours
par l’appairage normal des nœuds Gateway, les listes d’autorisation de commandes et la gestion locale des commandes sur le nœud.

### `api.runtime.taskFlow`

Liez un runtime TaskFlow à une clé de session OpenClaw existante ou à un contexte d’outil approuvé,
puis créez et gérez des TaskFlow sans passer de propriétaire à chaque appel.

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

Utilisez `bindSession({ sessionKey, requesterOrigin })` lorsque vous disposez déjà d’une
clé de session OpenClaw approuvée provenant de votre propre couche de liaison. N’effectuez pas de liaison à partir d’une entrée utilisateur brute.

### `api.runtime.tts`

Synthèse vocale.

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

Utilise la configuration principale `messages.tts` et la sélection du fournisseur. Retourne un
tampon audio PCM + fréquence d’échantillonnage.

### `api.runtime.mediaUnderstanding`

Analyse d’images, d’audio et de vidéo.

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

Retourne `{ text: undefined }` lorsqu’aucune sortie n’est produite (par ex. entrée ignorée).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité
  pour `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Génération d’images.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Recherche web.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Utilitaires multimédias de bas niveau.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
  scale: 6, // 1-12
  marginModules: 4, // 0-16
});
const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
const tmpRoot = resolvePreferredOpenClawTmpDir();
const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
  tmpRoot,
  dirPrefix: "my-plugin-qr-",
  fileName: "qr.png",
});
```

### `api.runtime.config`

Chargement et écriture de la configuration.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Utilitaires au niveau système.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Abonnements aux événements.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Journalisation.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Résolution de l’authentification des modèles et des fournisseurs.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Résolution du répertoire d’état.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Fabriques d’outils de mémoire et CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Helpers de runtime spécifiques au canal (disponibles lorsqu’un plugin de canal est chargé).

`api.runtime.channel.mentions` est la surface partagée de stratégie de mentions entrantes pour
les plugins de canal fournis qui utilisent l’injection de runtime :

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

Helpers de mention disponibles :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` n’expose intentionnellement pas les anciens
helpers de compatibilité `resolveMentionGating*`. Préférez le chemin normalisé
`{ facts, policy }`.

## Stockage des références de runtime

Utilisez `createPluginRuntimeStore` pour stocker la référence de runtime à utiliser en dehors
du callback `register` :

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

Préférez `pluginId` pour l’identité du runtime-store. La forme `key` de plus bas niveau est
réservée aux cas peu courants où un plugin a intentionnellement besoin de plus d’un emplacement de runtime.

## Autres champs `api` de niveau supérieur

Au-delà de `api.runtime`, l’objet API fournit également :

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID du plugin                                                                                |
| `api.name`               | `string`                  | Nom d’affichage du plugin                                                                   |
| `api.config`             | `OpenClawConfig`          | Instantané actuel de la config (instantané du runtime en mémoire actif lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Config spécifique au plugin depuis `plugins.entries.<id>.config`                            |
| `api.logger`             | `PluginLogger`            | Logger à portée limitée (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant le chargement complet de l’entrée |
| `api.resolvePath(input)` | `(string) => string`      | Résout un chemin relatif à la racine du plugin                                              |

## Liens connexes

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence de sous-chemin
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) — options de `definePluginEntry`
- [Internes des plugins](/fr/plugins/architecture) — modèle de capacités et registre
