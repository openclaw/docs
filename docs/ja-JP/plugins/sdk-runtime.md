---
read_when:
    - Plugin から core helper（TTS、STT、image gen、web search、subagent、nodes）を呼び出す必要があります
    - "`api.runtime` が何を公開しているかを理解したい場合\U0004E880analysis to=functions.read 】【。】【”】【commentary \U0007968App国产成人AV电影{\"path\":\"/home/runner/work/docs/docs/source/scripts/docs-i18n/AGENTS.md\"}"
    - Plugin コードから config、agent、または media helper にアクセスしています
sidebarTitle: Runtime Helpers
summary: api.runtime -- Plugin で利用可能な注入済みランタイムヘルパー
title: Plugin ランタイムヘルパー
x-i18n:
    generated_at: "2026-04-24T05:12:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2327bdabc0dc1e05000ff83e507007fadff2698cceaae0d4a3e7bc4885440c55
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Plugin 登録時に各 Plugin へ注入される `api.runtime` オブジェクトのリファレンスです。
ホスト内部を直接 import する代わりに、これらの helper を使用してください。

<Tip>
  **チュートリアルを探していますか？** 文脈の中でこれらの helper を使う手順については、[Channel Plugins](/ja-JP/plugins/sdk-channel-plugins)
  または [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください。
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## ランタイム名前空間

### `api.runtime.agent`

エージェント ID、ディレクトリ、セッション管理。

```typescript
// エージェントの作業ディレクトリを解決
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// エージェント workspace を解決
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// エージェント ID を取得
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// デフォルトの thinking レベルを取得
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// エージェント timeout を取得
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// workspace の存在を保証
await api.runtime.agent.ensureAgentWorkspace(cfg);

// 埋め込みエージェントターンを実行
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

`runEmbeddedAgent(...)` は、Plugin コードから通常の OpenClaw
エージェントターンを開始するための中立 helper です。これは、チャンネル起点の返信と同じ provider/model 解決および
agent-harness 選択を使用します。

`runEmbeddedPiAgent(...)` は互換エイリアスとして残っています。

**セッションストア helper** は `api.runtime.agent.session` 配下にあります:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

デフォルト model と provider の定数:

```typescript
const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
```

### `api.runtime.subagent`

バックグラウンド subagent 実行を起動・管理します。

```typescript
// subagent 実行を開始
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // optional override
  model: "gpt-4.1-mini", // optional override
  deliver: false,
});

// 完了を待機
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// セッションメッセージを読む
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// セッションを削除
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  model 上書き（`provider`/`model`）には、
  config 内の `plugins.entries.<id>.subagent.allowModelOverride: true` による
  operator のオプトインが必要です。
  信頼されていない Plugin でも subagent を実行できますが、上書き要求は拒否されます。
</Warning>

### `api.runtime.nodes`

接続中 node を一覧表示し、Gateway に読み込まれた Plugin
コードから node-host command を呼び出します。たとえば別の Mac 上の
browser や audio bridge のように、ペア済みデバイス上のローカル作業を Plugin が所有するときに使います。

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

この runtime は Gateway 内でのみ利用できます。
node command は引き続き通常の Gateway node pairing、command allowlist、node ローカルの command
handling を通ります。

### `api.runtime.taskFlow`

既存の OpenClaw セッションキーまたは信頼済み tool context に TaskFlow runtime を bind し、
各呼び出しで owner を渡さずに TaskFlow を作成・管理します。

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

独自の binding layer からすでに信頼済み OpenClaw セッションキーを持っている場合は、
`bindSession({ sessionKey, requesterOrigin })` を使用します。
生のユーザー入力から bind しないでください。

### `api.runtime.tts`

text-to-speech 合成。

```typescript
// 標準 TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 通話向け最適化 TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 利用可能な voice を一覧表示
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

core の `messages.tts` config と provider selection を使います。PCM audio
buffer + sample rate を返します。

### `api.runtime.mediaUnderstanding`

画像、音声、動画の解析。

```typescript
// 画像を説明
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// 音声を transcription
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // optional, for when MIME cannot be inferred
});

// 動画を説明
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// 汎用ファイル解析
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

出力が生成されない場合（例: スキップされた入力）は `{ text: undefined }` を返します。

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` は、
  `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` の互換エイリアスとして残っています。
</Info>

### `api.runtime.imageGeneration`

画像生成。

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

web search。

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

低レベルメディアユーティリティ。

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

config の読み込みと書き込み。

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

システムレベルユーティリティ。

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

イベント購読。

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

ロギング。

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

model と provider の auth 解決。

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

state ディレクトリ解決。

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

memory tool factory と CLI。

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

チャンネル固有ランタイム helper（channel Plugin が読み込まれているときに利用可能）。

`api.runtime.channel.mentions` は、runtime injection を使う
バンドル済み channel Plugin 向けの共有受信 mention-policy サーフェスです。

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

利用可能な mention helper:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` は、古い
`resolveMentionGating*` 互換 helper を意図的に公開していません。正規化された
`{ facts, policy }` 経路を優先してください。

## ランタイム参照の保存

`register` callback の外で使うために runtime 参照を保存するには
`createPluginRuntimeStore` を使います。

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

runtime-store の ID には `pluginId` を優先してください。下位レベルの `key` 形式は、
1 つの Plugin が意図的に複数の runtime slot を必要とする稀なケース向けです。

## その他のトップレベル `api` フィールド

`api.runtime` に加えて、API オブジェクトは次も提供します:

| Field | Type | Description |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id |
| `api.name`               | `string`                  | Plugin 表示名 |
| `api.config`             | `OpenClawConfig`          | 現在の config スナップショット（利用可能な場合はアクティブなインメモリ runtime スナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有 config |
| `api.logger`             | `PluginLogger`            | スコープ付き logger（`debug`, `info`, `warn`, `error`） |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の load mode。`"setup-runtime"` は、完全 entry 前の軽量な起動/セットアップウィンドウ |
| `api.resolvePath(input)` | `(string) => string`      | Plugin root からの相対パスを解決 |

## 関連

- [SDK Overview](/ja-JP/plugins/sdk-overview) -- subpath リファレンス
- [SDK Entry Points](/ja-JP/plugins/sdk-entrypoints) -- `definePluginEntry` オプション
- [Plugin Internals](/ja-JP/plugins/architecture) -- capability モデルとレジストリ
