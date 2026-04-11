---
read_when:
    - Você precisa chamar auxiliares do núcleo a partir de um plugin (TTS, STT, geração de imagem, busca na web, subagent)
    - Você quer entender o que `api.runtime` expõe
    - Você está acessando auxiliares de configuração, agente ou mídia a partir do código do plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- os auxiliares de runtime injetados disponíveis para plugins
title: Auxiliares de runtime de plugin
x-i18n:
    generated_at: "2026-04-11T02:46:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf8a6ecd970300f784b8aca20eed40ba12c83107abd27385bfdc3347d2544be
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Auxiliares de runtime de plugin

Referência para o objeto `api.runtime` injetado em todo plugin durante o
registro. Use estes auxiliares em vez de importar diretamente internos do host.

<Tip>
  **Está procurando um guia passo a passo?** Consulte [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins)
  ou [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins) para guias passo a passo
  que mostram esses auxiliares em contexto.
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
// Resolver o diretório de trabalho do agente
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Resolver o workspace do agente
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Obter a identidade do agente
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Obter o nível de thinking padrão
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Obter o tempo limite do agente
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Garantir que o workspace exista
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Executar um turno de agente embutido
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Resuma as alterações mais recentes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` é o auxiliar neutro para iniciar um turno normal de
agente OpenClaw a partir do código do plugin. Ele usa a mesma resolução de
provedor/modelo e a mesma seleção de harness de agente que respostas acionadas por canal.

`runEmbeddedPiAgent(...)` continua disponível como alias de compatibilidade.

**Os auxiliares do armazenamento de sessão** ficam em `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Constantes padrão de modelo e provedor:

```typescript
const model = api.runtime.agent.defaults.model; // por exemplo "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // por exemplo "anthropic"
```

### `api.runtime.subagent`

Inicie e gerencie execuções de subagent em segundo plano.

```typescript
// Iniciar uma execução de subagent
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expanda esta consulta em buscas de acompanhamento mais focadas.",
  provider: "openai", // substituição opcional
  model: "gpt-4.1-mini", // substituição opcional
  deliver: false,
});

// Aguardar a conclusão
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Ler mensagens da sessão
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Excluir uma sessão
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Substituições de modelo (`provider`/`model`) exigem ativação pelo operador via
  `plugins.entries.<id>.subagent.allowModelOverride: true` na configuração.
  Plugins não confiáveis ainda podem executar subagentes, mas solicitações de substituição são rejeitadas.
</Warning>

### `api.runtime.taskFlow`

Vincule um runtime de Task Flow a uma chave de sessão OpenClaw existente ou a um
contexto de ferramenta confiável e, em seguida, crie e gerencie Task Flows sem passar um proprietário em cada chamada.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Revisar novos pull requests",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Revisar PR #123",
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
chave de sessão OpenClaw confiável da sua própria camada de vínculo. Não vincule a partir de entrada bruta do
usuário.

### `api.runtime.tts`

Síntese de texto para fala.

```typescript
// TTS padrão
const clip = await api.runtime.tts.textToSpeech({
  text: "Olá do OpenClaw",
  cfg: api.config,
});

// TTS otimizado para telefonia
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Olá do OpenClaw",
  cfg: api.config,
});

// Listar vozes disponíveis
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
// Descrever uma imagem
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Transcrever áudio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // opcional, para quando o MIME não puder ser inferido
});

// Descrever um vídeo
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Análise genérica de arquivo
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Retorna `{ text: undefined }` quando nenhuma saída é produzida (por exemplo, entrada ignorada).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` continua disponível como alias de compatibilidade
  para `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Geração de imagem.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "Um robô pintando um pôr do sol",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Busca na web.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "SDK de plugins do OpenClaw", count: 5 },
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
```

### `api.runtime.config`

Carregamento e gravação de configuração.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Utilitários em nível de sistema.

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

Logs.

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

Resolução do diretório de estado.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Fábricas de ferramentas de memória e CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Auxiliares de runtime específicos de canal (disponíveis quando um plugin de canal é carregado).

`api.runtime.channel.mentions` é a superfície compartilhada de política de menções de entrada para
plugins de canal incluídos que usam injeção de runtime:

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

Auxiliares de menção disponíveis:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` intencionalmente não expõe os auxiliares legados de compatibilidade
`resolveMentionGating*`. Prefira o caminho normalizado
`{ facts, policy }`.

## Armazenando referências de runtime

Use `createPluginRuntimeStore` para armazenar a referência de runtime para uso fora
do callback `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("runtime de my-plugin não inicializado");

// No seu ponto de entrada
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Exemplo",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// Em outros arquivos
export function getRuntime() {
  return store.getRuntime(); // lança erro se não estiver inicializado
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // retorna null se não estiver inicializado
}
```

## Outros campos de nível superior de `api`

Além de `api.runtime`, o objeto API também fornece:

| Campo                    | Tipo                      | Descrição                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID do plugin                                                                                |
| `api.name`               | `string`                  | Nome de exibição do plugin                                                                  |
| `api.config`             | `OpenClawConfig`          | Snapshot atual da configuração (snapshot ativo em memória do runtime quando disponível)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do plugin em `plugins.entries.<id>.config`                          |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve um caminho relativo à raiz do plugin                                                |

## Relacionado

- [SDK Overview](/pt-BR/plugins/sdk-overview) -- referência de subcaminhos
- [SDK Entry Points](/pt-BR/plugins/sdk-entrypoints) -- opções de `definePluginEntry`
- [Plugin Internals](/pt-BR/plugins/architecture) -- modelo de capacidades e registro
