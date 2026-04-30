---
read_when:
    - OpenClaw における Pi SDK 統合設計を理解する
    - Pi 用のエージェントセッションライフサイクル、ツール機構、またはプロバイダー連携の変更
summary: OpenClaw の組み込み Pi エージェント統合とセッションライフサイクルのアーキテクチャ
title: Pi 連携アーキテクチャ
x-i18n:
    generated_at: "2026-04-30T05:22:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b155cd5296875f2f187c68c6929c48aba27cef047f0caad74f560bcde5533e5
    source_path: pi.md
    workflow: 16
---

OpenClaw は [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) とその兄弟パッケージ（`pi-ai`、`pi-agent-core`、`pi-tui`）を統合し、AIエージェント機能を実現します。

## 概要

OpenClaw は pi SDK を使って、AIコーディングエージェントをメッセージングGatewayアーキテクチャに組み込みます。pi をサブプロセスとして起動したり RPC モードを使ったりする代わりに、OpenClaw は `createAgentSession()` を介して pi の `AgentSession` を直接インポートしてインスタンス化します。この組み込み方式により、次が可能になります。

- セッションライフサイクルとイベント処理の完全な制御
- カスタムツール注入（メッセージング、サンドボックス、チャネル固有アクション）
- チャネル/コンテキストごとのシステムプロンプトのカスタマイズ
- 分岐/Compaction サポート付きのセッション永続化
- フェイルオーバー付きの複数アカウント認証プロファイルローテーション
- プロバイダー非依存のモデル切り替え

## パッケージ依存関係

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| パッケージ        | 目的                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | コアLLM抽象化: `Model`、`streamSimple`、メッセージ型、プロバイダーAPI                                 |
| `pi-agent-core`   | エージェントループ、ツール実行、`AgentMessage` 型                                                       |
| `pi-coding-agent` | 高レベルSDK: `createAgentSession`、`SessionManager`、`AuthStorage`、`ModelRegistry`、組み込みツール |
| `pi-tui`          | ターミナルUIコンポーネント（OpenClaw のローカル TUI モードで使用）                                     |

## ファイル構造

```
src/agents/
├── pi-embedded-runner.ts          # Re-exports from pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Main entry: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Single attempt logic with session setup
│   │   ├── params.ts              # RunEmbeddedPiAgentParams type
│   │   ├── payloads.ts            # Build response payloads from run results
│   │   ├── images.ts              # Vision model image injection
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort error detection
│   ├── cache-ttl.ts               # Cache TTL tracking for context pruning
│   ├── compact.ts                 # Manual/auto compaction logic
│   ├── extensions.ts              # Load pi extensions for embedded runs
│   ├── extra-params.ts            # Provider-specific stream params
│   ├── google.ts                  # Google/Gemini turn ordering fixes
│   ├── history.ts                 # History limiting (DM vs group)
│   ├── lanes.ts                   # Session/global command lanes
│   ├── logger.ts                  # Subsystem logger
│   ├── model.ts                   # Model resolution via ModelRegistry
│   ├── runs.ts                    # Active run tracking, abort, queue
│   ├── sandbox-info.ts            # Sandbox info for system prompt
│   ├── session-manager-cache.ts   # SessionManager instance caching
│   ├── session-manager-init.ts    # Session file initialization
│   ├── system-prompt.ts           # System prompt builder
│   ├── tool-split.ts              # Split tools into builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel mapping, error description
├── pi-embedded-subscribe.ts       # Session event subscription/dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Event handler factory
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Streaming block reply chunking
├── pi-embedded-messaging.ts       # Messaging tool sent tracking
├── pi-embedded-helpers.ts         # Error classification, turn validation
├── pi-embedded-helpers/           # Helper modules
├── pi-embedded-utils.ts           # Formatting utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal wrapping for tools
├── pi-tools.policy.ts             # Tool allowlist/denylist policy
├── pi-tools.read.ts               # Read tool customizations
├── pi-tools.schema.ts             # Tool schema normalization
├── pi-tools.types.ts              # AnyAgentTool type alias
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition adapter
├── pi-settings.ts                 # Settings overrides
├── pi-hooks/                      # Custom pi hooks
│   ├── compaction-safeguard.ts    # Safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # Auth profile resolution
├── auth-profiles.ts               # Profile store, cooldown, failover
├── model-selection.ts             # Default model resolution
├── models-config.ts               # models.json generation
├── model-catalog.ts               # Model catalog cache
├── context-window-guard.ts        # Context window validation
├── failover-error.ts              # FailoverError class
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # System prompt parameter resolution
├── system-prompt-report.ts        # Debug report generation
├── tool-summaries.ts              # Tool description summaries
├── tool-policy.ts                 # Tool policy resolution
├── transcript-policy.ts           # Transcript validation policy
├── skills.ts                      # Skill snapshot/prompt building
├── skills/                        # Skill subsystem
├── sandbox.ts                     # Sandbox context resolution
├── sandbox/                       # Sandbox subsystem
├── channel-tools.ts               # Channel-specific tool injection
├── openclaw-tools.ts              # OpenClaw-specific tools
├── bash-tools.ts                  # exec/process tools
├── apply-patch.ts                 # apply_patch tool (OpenAI)
├── tools/                         # Individual tool implementations
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

チャネル固有のメッセージアクションランタイムは、`src/agents/tools` 配下ではなく、Plugin が所有する extension ディレクトリ内に配置されるようになりました。例:

- Discord Plugin アクションランタイムファイル
- Slack Plugin アクションランタイムファイル
- Telegram Plugin アクションランタイムファイル
- WhatsApp Plugin アクションランタイムファイル

## コア統合フロー

### 1. 組み込みエージェントの実行

主なエントリーポイントは `pi-embedded-runner/run.ts` の `runEmbeddedPiAgent()` です。

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. セッション作成

`runEmbeddedPiAgent()` から呼び出される `runEmbeddedAttempt()` 内で、pi SDK が使用されます。

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. イベント購読

`subscribeEmbeddedPiSession()` は pi の `AgentSession` イベントを購読します。

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

処理されるイベントには次が含まれます。

- `message_start` / `message_end` / `message_update`（ストリーミングテキスト/思考）
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. プロンプト送信

セットアップ後、セッションにプロンプトを送信します。

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK は、LLM への送信、ツール呼び出しの実行、レスポンスのストリーミングを含む完全なエージェントループを処理します。

画像注入はプロンプトローカルです。OpenClaw は現在のプロンプトから画像参照を読み込み、そのターンに限って `images` 経由で渡します。古い履歴ターンを再スキャンして画像ペイロードを再注入することはありません。

## ツールアーキテクチャ

### ツールパイプライン

1. **ベースツール**: pi の `codingTools`（read、bash、edit、write）
2. **カスタム置換**: OpenClaw は bash を `exec`/`process` に置き換え、read/edit/write をサンドボックス向けにカスタマイズします
3. **OpenClaw ツール**: メッセージング、ブラウザー、canvas、セッション、cron、gateway など
4. **チャネルツール**: Discord/Telegram/Slack/WhatsApp 固有のアクションツール
5. **ポリシーフィルタリング**: プロファイル、プロバイダー、エージェント、グループ、サンドボックスポリシーによってツールをフィルタリングします
6. **スキーマ正規化**: Gemini/OpenAI の癖に合わせてスキーマを整理します
7. **AbortSignal ラップ**: abort signal を尊重するようツールをラップします

### ツール定義アダプター

pi-agent-core の `AgentTool` は、pi-coding-agent の `ToolDefinition` とは異なる `execute` シグネチャを持ちます。`pi-tool-definition-adapter.ts` のアダプターがこれを橋渡しします。

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### ツール分割戦略

`splitSdkTools()` はすべてのツールを `customTools` 経由で渡します。

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

これにより、OpenClaw のポリシーフィルタリング、サンドボックス統合、拡張ツールセットがプロバイダー間で一貫したままになります。

## システムプロンプトの構築

システムプロンプトは `buildAgentSystemPrompt()` (`system-prompt.ts`) で構築されます。Tooling、Tool Call Style、Safety guardrails、OpenClaw CLI リファレンス、Skills、Docs、Workspace、Sandbox、Messaging、Reply Tags、Voice、Silent Replies、Heartbeats、Runtime metadata、さらに有効な場合は Memory と Reactions、任意のコンテキストファイルと追加のシステムプロンプト内容を含むセクションで、完全なプロンプトを組み立てます。サブエージェントで使われる最小プロンプトモードでは、セクションがトリムされます。

プロンプトはセッション作成後に `applySystemPromptOverrideToSession()` を介して適用されます。

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## セッション管理

### セッションファイル

セッションはツリー構造（id/parentId によるリンク）を持つ JSONL ファイルです。Pi の `SessionManager` が永続化を処理します。

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw はツール結果の安全性のために、これを `guardSessionManager()` でラップします。

### セッションキャッシュ

`session-manager-cache.ts` は SessionManager インスタンスをキャッシュし、ファイル解析の繰り返しを回避します。

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 履歴制限

`limitHistoryTurns()` はチャンネル種別（DM とグループ）に基づいて会話履歴をトリムします。

### Compaction

コンテキストオーバーフロー時に自動 Compaction がトリガーされます。一般的なオーバーフローシグネチャには、`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded` が含まれます。`compactEmbeddedPiSessionDirect()` は手動 Compaction を処理します。

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 認証とモデル解決

### 認証プロファイル

OpenClaw はプロバイダーごとに複数の API キーを持つ認証プロファイルストアを管理します。

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

プロファイルはクールダウン追跡付きで、失敗時にローテーションされます。

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### モデル解決

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### フェイルオーバー

`FailoverError` は、設定されている場合にモデルフォールバックをトリガーします。

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Pi 拡張

OpenClaw は特殊な動作のためにカスタム pi 拡張を読み込みます。

### Compaction セーフガード

`src/agents/pi-hooks/compaction-safeguard.ts` は、適応的なトークン予算に加えて、ツール失敗とファイル操作の要約を含むガードレールを Compaction に追加します。

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### コンテキストプルーニング

`src/agents/pi-hooks/context-pruning.ts` はキャッシュ TTL ベースのコンテキストプルーニングを実装します。

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## ストリーミングとブロック返信

### ブロックチャンク化

`EmbeddedBlockChunker` はストリーミングテキストを個別の返信ブロックに管理します。

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final タグの除去

ストリーミング出力は、`<think>`/`<thinking>` ブロックを除去し、`<final>` の内容を抽出するよう処理されます。

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### 返信ディレクティブ

`[[media:url]]`、`[[voice]]`、`[[reply:id]]` のような返信ディレクティブは解析され、抽出されます。

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## エラー処理

### エラー分類

`pi-embedded-helpers.ts` は適切な処理のためにエラーを分類します。

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking レベルのフォールバック

Thinking レベルがサポートされていない場合、フォールバックします。

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## サンドボックス統合

サンドボックスモードが有効な場合、ツールとパスは制約されます。

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## プロバイダー固有の処理

### Anthropic

- 拒否マジック文字列のスクラブ
- 連続ロールのターン検証
- 厳密なアップストリーム Pi ツールパラメーター検証

### Google/Gemini

- Plugin 所有のツールスキーマサニタイズ

### OpenAI

- Codex モデル向けの `apply_patch` ツール
- Thinking レベルのダウングレード処理

## TUI 統合

OpenClaw には、pi-tui コンポーネントを直接使用するローカル TUI モードもあります。

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

これにより、pi のネイティブモードに似たインタラクティブなターミナル体験が提供されます。

## Pi CLI との主な違い

| 観点            | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| 呼び出し        | `pi` コマンド / RPC     | `createAgentSession()` 経由の SDK                                                              |
| ツール          | デフォルトのコーディングツール | カスタム OpenClaw ツールスイート                                                               |
| システムプロンプト | AGENTS.md + プロンプト  | チャンネル/コンテキストごとの動的な内容                                                        |
| セッション保存  | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`（または `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`） |
| 認証            | 単一の認証情報          | ローテーション付きマルチプロファイル                                                           |
| 拡張            | ディスクから読み込み    | プログラム経由 + ディスクパス                                                                  |
| イベント処理    | TUI レンダリング        | コールバックベース（onBlockReply など）                                                        |

## 今後の検討事項

再作業の可能性がある領域:

1. **ツールシグネチャの整合**: 現在 pi-agent-core と pi-coding-agent のシグネチャ間を適応している
2. **セッションマネージャーのラップ**: `guardSessionManager` は安全性を追加するが、複雑さも増やす
3. **拡張読み込み**: pi の `ResourceLoader` をより直接的に使用できる可能性がある
4. **ストリーミングハンドラーの複雑さ**: `subscribeEmbeddedPiSession` が大きくなっている
5. **プロバイダーの癖**: pi が処理できる可能性のあるプロバイダー固有のコードパスが多い

## テスト

Pi 統合のカバレッジは以下のスイートにまたがります。

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

ライブ/オプトイン:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts`（`OPENCLAW_LIVE_TEST=1` で有効化）

現在の実行コマンドについては、[Pi 開発ワークフロー](/ja-JP/pi-dev) を参照してください。

## 関連

- [Pi 開発ワークフロー](/ja-JP/pi-dev)
- [インストール概要](/ja-JP/install)
