---
read_when:
    - Você precisa chamar helpers centrais a partir de um Plugin (TTS, STT, geração de imagem, web search, subagente, Nodes)
    - Você quer entender o que `api.runtime` expõe
    - Você está acessando helpers de config, agente ou mídia a partir do código do Plugin
sidebarTitle: Runtime Helpers
summary: api.runtime — os helpers de runtime injetados disponíveis para Plugins
title: Helpers de runtime de Plugin
x-i18n:
    generated_at: "2026-04-24T06:04:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2327bdabc0dc1e05000ff83e507007fadff2698cceaae0d4a3e7bc4885440c55
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Referência do objeto `api.runtime` injetado em todo Plugin durante o
registro. Use esses helpers em vez de importar diretamente internos do host.

<Tip>
  **Procurando um passo a passo?** Consulte [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins)
  ou [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins) para guias passo a passo
  que mostram esses helpers em contexto.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Namespaces de runtime

### `api.runtime.agent`

Identidade do agente, diretórios e gerenciamento de sessão.

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

`runEmbeddedAgent(...)` é o helper neutro para iniciar um turno normal de
agente do OpenClaw a partir do código do Plugin. Ele usa a mesma resolução de
provedor/modelo e a mesma seleção de harness de agente das respostas acionadas por canal.

`runEmbeddedPiAgent(...)` continua como um alias de compatibilidade.

**Helpers de armazenamento de sessão** ficam em `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Constantes de modelo e provedor padrão:

```typescript
const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
```

### `api.runtime.subagent`

Inicie e gerencie execuções de subagente em segundo plano.

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
  Substituições de modelo (`provider`/`model`) exigem opt-in do operador via
  `plugins.entries.<id>.subagent.allowModelOverride: true` na configuração.
  Plugins não confiáveis ainda podem executar subagentes, mas solicitações de substituição são rejeitadas.
</Warning>

### `api.runtime.nodes`

Liste Nodes conectados e invoque um comando hospedado no Node a partir de código de Plugin carregado pelo Gateway.
Use isso quando um Plugin controla trabalho local em um dispositivo pareado, por exemplo um
navegador ou bridge de áudio em outro Mac.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Esse runtime só está disponível dentro do Gateway. Comandos de Node ainda passam
pelo pairing normal de Node do Gateway, allowlists de comando e tratamento local de comando no Node.

### `api.runtime.taskFlow`

Associe um runtime de TaskFlow a uma chave de sessão existente do OpenClaw ou a um contexto confiável de ferramenta e então crie e gerencie TaskFlows sem passar um proprietário em cada chamada.

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

Use `bindSession({ sessionKey, requesterOrigin })` quando você já tiver uma
chave de sessão confiável do OpenClaw da sua própria camada de binding. Não faça bind a partir de entrada bruta do usuário.

### `api.runtime.tts`

Síntese de texto para fala.

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

Usa a configuração central `messages.tts` e a seleção de provedor. Retorna buffer
de áudio PCM + taxa de amostragem.

### `api.runtime.mediaUnderstanding`

Análise de imagem, áudio e vídeo.

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

Retorna `{ text: undefined }` quando nenhuma saída é produzida (por exemplo, entrada ignorada).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` continua como um alias de compatibilidade
  para `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Geração de imagem.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Web search.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Utilitários de mídia de baixo nível.

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

Carregamento e gravação de configuração.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Utilitários de nível de sistema.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Assinaturas de eventos.

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

Resolução de autenticação de modelo e provedor.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Resolução de diretório de estado.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Factories de ferramentas de memory e CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Helpers de runtime específicos de canal (disponíveis quando um Plugin de canal está carregado).

`api.runtime.channel.mentions` é a superfície compartilhada de política de menção de entrada para
Plugins de canal incluídos que usam injeção de runtime:

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

Helpers de menção disponíveis:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` intencionalmente não expõe os helpers legados de compatibilidade
`resolveMentionGating*`. Prefira o caminho normalizado
`{ facts, policy }`.

## Armazenando referências de runtime

Use `createPluginRuntimeStore` para armazenar a referência de runtime para uso fora
do callback `register`:

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

Prefira `pluginId` para a identidade do runtime-store. A forma de nível inferior `key` é
para casos incomuns em que um Plugin intencionalmente precisa de mais de um slot de runtime.

## Outros campos de `api` de nível superior

Além de `api.runtime`, o objeto da API também fornece:

| Campo                    | Tipo                      | Descrição                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID do Plugin                                                                                |
| `api.name`               | `string`                  | Nome de exibição do Plugin                                                                  |
| `api.config`             | `OpenClawConfig`          | Snapshot atual da configuração (snapshot ativo em memória do runtime quando disponível)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do Plugin em `plugins.entries.<id>.config`                          |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo atual de carregamento; `"setup-runtime"` é a janela leve de inicialização/setup antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve um caminho relativo à raiz do Plugin                                                |

## Relacionado

- [SDK Overview](/pt-BR/plugins/sdk-overview) -- referência de subpaths
- [SDK Entry Points](/pt-BR/plugins/sdk-entrypoints) -- opções de `definePluginEntry`
- [Internos de Plugin](/pt-BR/plugins/architecture) -- modelo de capacidade e registro
