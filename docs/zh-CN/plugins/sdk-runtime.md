---
read_when:
    - 你需要从插件调用核心辅助工具（TTS、STT、图像生成、Web 搜索、子智能体、节点）
    - 你想了解 `api.runtime` 暴露了哪些内容
    - 你正在从插件代码访问配置、智能体或媒体辅助工具
sidebarTitle: Runtime Helpers
summary: api.runtime —— 提供给插件的注入式运行时辅助工具
title: 插件运行时辅助工具
x-i18n:
    generated_at: "2026-04-25T05:55:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9f1a56faf33ac18ea7e4b14f70d6f3a73c8b88481aeb0ee77035a17a03f15ce
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

提供给每个插件在注册期间注入的 `api.runtime` 对象参考。请使用这些辅助工具，而不是直接导入宿主内部实现。

<Tip>
  **想看操作演示？** 请参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins) 或 [提供商插件](/zh-CN/plugins/sdk-provider-plugins) 的分步指南，这些指南会在上下文中展示这些辅助工具的使用方式。
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 运行时命名空间

### `api.runtime.agent`

智能体身份、目录和会话管理。

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

`runEmbeddedAgent(...)` 是从插件代码启动普通 OpenClaw 智能体轮次的中立辅助工具。它使用与渠道触发回复相同的 provider/模型解析和 agent-harness 选择。

`runEmbeddedPiAgent(...)` 仍保留为兼容性别名。

**会话存储辅助工具**位于 `api.runtime.agent.session` 下：

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

默认模型和 provider 常量：

```typescript
const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
```

### `api.runtime.subagent`

启动并管理后台子智能体运行。

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
  模型覆盖（`provider`/`model`）需要操作员在配置中通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
  不受信任的插件仍然可以运行子智能体，但覆盖请求会被拒绝。
</Warning>

### `api.runtime.nodes`

列出已连接节点，并从 Gateway 网关加载的插件代码或插件 CLI 命令中调用节点主机命令。当插件在已配对设备上拥有本地工作时，请使用此功能，例如在另一台 Mac 上的浏览器或音频桥接。

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

在 Gateway 网关内部，此运行时是进程内的。在插件 CLI 命令中，它会通过 RPC 调用已配置的 Gateway 网关，因此像 `openclaw googlemeet recover-tab` 这样的命令可以从终端检查已配对节点。节点命令仍然会经过正常的 Gateway 网关节点配对、命令允许列表和节点本地命令处理。

### `api.runtime.taskFlow`

将 Task Flow 运行时绑定到现有 OpenClaw 会话键或受信任工具上下文，然后在无需每次调用都传入所有者的情况下创建和管理 Task Flows。

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

当你已经从自己的绑定层获得受信任的 OpenClaw 会话键时，请使用 `bindSession({ sessionKey, requesterOrigin })`。不要从原始用户输入进行绑定。

### `api.runtime.tts`

文本转语音合成。

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

使用核心 `messages.tts` 配置和 provider 选择。返回 PCM 音频缓冲区 + 采样率。

### `api.runtime.mediaUnderstanding`

图像、音频和视频分析。

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

当没有生成输出时（例如跳过输入），返回 `{ text: undefined }`。

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` 仍保留为 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的兼容性别名。
</Info>

### `api.runtime.imageGeneration`

图像生成。

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Web 搜索。

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

底层媒体辅助工具。

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

配置加载和写入。

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

系统级辅助工具。

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

事件订阅。

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

日志记录。

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

模型和 provider 认证解析。

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

状态目录解析。

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Memory 工具工厂和 CLI。

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

渠道特定运行时辅助工具（在加载渠道插件时可用）。

`api.runtime.channel.mentions` 是供使用运行时注入的内置渠道插件共享的入站 mention 策略能力面：

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

可用的 mention 辅助工具：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` 有意不暴露旧版的 `resolveMentionGating*` 兼容辅助工具。请优先使用规范化的 `{ facts, policy }` 路径。

## 存储运行时引用

使用 `createPluginRuntimeStore` 来存储运行时引用，以便在 `register` 回调之外使用：

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

优先使用 `pluginId` 作为 runtime-store 标识。更底层的 `key` 形式适用于少见情况，即某个插件有意需要多个运行时槽位。

## 其他顶层 `api` 字段

除了 `api.runtime` 之外，API 对象还提供：

| 字段 | 类型 | 说明 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id` | `string` | 插件 id |
| `api.name` | `string` | 插件显示名称 |
| `api.config` | `OpenClawConfig` | 当前配置快照（可用时为活动中的内存运行时快照） |
| `api.pluginConfig` | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专用配置 |
| `api.logger` | `PluginLogger` | 作用域日志记录器（`debug`、`info`、`warn`、`error`） |
| `api.registrationMode` | `PluginRegistrationMode` | 当前加载模式；`"setup-runtime"` 是完整入口启动/设置前的轻量预启动/设置窗口 |
| `api.resolvePath(input)` | `(string) => string` | 解析相对于插件根目录的路径 |

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) — 子路径参考
- [插件入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 选项
- [插件架构内部机制](/zh-CN/plugins/architecture) — 能力模型和注册表
