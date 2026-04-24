---
read_when:
    - OpenClaw における Pi SDK 統合設計を理解する შემთხვევაში
    - Pi 向けのエージェントセッションライフサイクル、tooling、またはプロバイダー配線を変更する ক্ষেত্রে
summary: OpenClaw の埋め込み Pi エージェント統合とセッションライフサイクルのアーキテクチャ
title: Pi 統合アーキテクチャ
x-i18n:
    generated_at: "2026-04-24T05:07:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c0c490cad121a65d557a72887ea619a7d0cff34a62220752214185c9148dc0b
    source_path: pi.md
    workflow: 15
---

このドキュメントでは、OpenClaw が [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) と、その兄弟パッケージ（`pi-ai`、`pi-agent-core`、`pi-tui`）をどのように統合して AI エージェント機能を実現しているかを説明します。

## 概要

OpenClaw は、メッセージング Gateway アーキテクチャに AI コーディングエージェントを埋め込むために pi SDK を使います。pi をサブプロセスとして起動したり RPC モードを使ったりするのではなく、OpenClaw は `createAgentSession()` を通じて pi の `AgentSession` を直接 import して生成します。この埋め込みアプローチにより、次が可能になります。

- セッションライフサイクルとイベント処理の完全な制御
- カスタム tool 注入（メッセージング、sandbox、チャネル固有アクション）
- チャネル/コンテキストごとのシステムプロンプトカスタマイズ
- 分岐/Compaction をサポートするセッション永続化
- フェイルオーバー付きのマルチアカウント auth profile ローテーション
- プロバイダー非依存のモデル切り替え

## パッケージ依存関係

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| パッケージ        | 目的                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | 中核 LLM 抽象化: `Model`、`streamSimple`、メッセージ型、プロバイダー API                               |
| `pi-agent-core`   | エージェントループ、tool 実行、`AgentMessage` 型                                                        |
| `pi-coding-agent` | 高レベル SDK: `createAgentSession`、`SessionManager`、`AuthStorage`、`ModelRegistry`、組み込み tools |
| `pi-tui`          | ターミナル UI コンポーネント（OpenClaw のローカル TUI モードで使用）                                   |

## ファイル構成

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ からの再エクスポート
├── pi-embedded-runner/
│   ├── run.ts                     # メインエントリー: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # セッション設定を含む単一試行ロジック
│   │   ├── params.ts              # RunEmbeddedPiAgentParams 型
│   │   ├── payloads.ts            # 実行結果から応答ペイロードを構築
│   │   ├── images.ts              # vision モデル画像注入
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # 中断エラー検出
│   ├── cache-ttl.ts               # コンテキスト pruning 用のキャッシュ TTL 追跡
│   ├── compact.ts                 # 手動/自動 Compaction ロジック
│   ├── extensions.ts              # 埋め込み実行用の pi extension 読み込み
│   ├── extra-params.ts            # プロバイダー固有の stream パラメーター
│   ├── google.ts                  # Google/Gemini のターン順序修正
│   ├── history.ts                 # 履歴制限（DM vs グループ）
│   ├── lanes.ts                   # セッション/グローバルコマンドレーン
│   ├── logger.ts                  # サブシステム logger
│   ├── model.ts                   # ModelRegistry 経由のモデル解決
│   ├── runs.ts                    # アクティブ実行追跡、中断、キュー
│   ├── sandbox-info.ts            # システムプロンプト用 sandbox 情報
│   ├── session-manager-cache.ts   # SessionManager インスタンスキャッシュ
│   ├── session-manager-init.ts    # セッションファイル初期化
│   ├── system-prompt.ts           # システムプロンプトビルダー
│   ├── tool-split.ts              # tool を builtIn と custom に分割
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel マッピング、エラー説明
├── pi-embedded-subscribe.ts       # セッションイベント購読/dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # イベントハンドラーファクトリー
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # ストリーミングブロック返信の分割
├── pi-embedded-messaging.ts       # Messaging tool の送信追跡
├── pi-embedded-helpers.ts         # エラー分類、ターン検証
├── pi-embedded-helpers/           # ヘルパーモジュール
├── pi-embedded-utils.ts           # 整形ユーティリティ
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # tools 用 AbortSignal ラップ
├── pi-tools.policy.ts             # tool allowlist/denylist ポリシー
├── pi-tools.read.ts               # Read tool カスタマイズ
├── pi-tools.schema.ts             # tool schema 正規化
├── pi-tools.types.ts              # AnyAgentTool 型エイリアス
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition アダプター
├── pi-settings.ts                 # 設定上書き
├── pi-hooks/                      # カスタム pi フック
│   ├── compaction-safeguard.ts    # Safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # キャッシュ TTL コンテキスト pruning extension
│   └── context-pruning/
├── model-auth.ts                  # Auth profile 解決
├── auth-profiles.ts               # Profile ストア、cooldown、failover
├── model-selection.ts             # デフォルトモデル解決
├── models-config.ts               # models.json 生成
├── model-catalog.ts               # モデルカタログキャッシュ
├── context-window-guard.ts        # コンテキストウィンドウ検証
├── failover-error.ts              # FailoverError クラス
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # システムプロンプトパラメーター解決
├── system-prompt-report.ts        # デバッグレポート生成
├── tool-summaries.ts              # tool 説明サマリー
├── tool-policy.ts                 # tool ポリシー解決
├── transcript-policy.ts           # トランスクリプト検証ポリシー
├── skills.ts                      # Skill スナップショット/プロンプト構築
├── skills/                        # Skill サブシステム
├── sandbox.ts                     # sandbox コンテキスト解決
├── sandbox/                       # sandbox サブシステム
├── channel-tools.ts               # チャネル固有 tool 注入
├── openclaw-tools.ts              # OpenClaw 固有 tools
├── bash-tools.ts                  # exec/process tools
├── apply-patch.ts                 # apply_patch tool（OpenAI）
├── tools/                         # 個別 tool 実装
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

チャネル固有のメッセージアクションランタイムは、現在 `src/agents/tools` 配下ではなく、Plugin が所有する extension
ディレクトリにあります。たとえば:

- Discord Plugin の action runtime ファイル
- Slack Plugin の action runtime ファイル
- Telegram Plugin の action runtime ファイル
- WhatsApp Plugin の action runtime ファイル

## 中核統合フロー

### 1. 埋め込みエージェントの実行

メインエントリーポイントは `pi-embedded-runner/run.ts` の `runEmbeddedPiAgent()` です。

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

`runEmbeddedAttempt()`（`runEmbeddedPiAgent()` から呼ばれる）内では、pi SDK が使われます。

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

`subscribeEmbeddedPiSession()` は、pi の `AgentSession` イベントを購読します。

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

- `message_start` / `message_end` / `message_update`（ストリーミングテキスト/Thinking）
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. プロンプト送信

セットアップ後、セッションにプロンプトが送られます。

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK は、LLM への送信、tool call の実行、応答のストリーミングを含む完全なエージェントループを処理します。

画像注入は prompt ローカルです。OpenClaw は現在の prompt から画像参照を読み込み、
そのターンに対してのみ `images` 経由で渡します。古い履歴ターンを再走査して
画像ペイロードを再注入することはありません。

## Tool アーキテクチャ

### Tool パイプライン

1. **ベース tools**: pi の `codingTools`（read, bash, edit, write）
2. **カスタム置き換え**: OpenClaw は bash を `exec`/`process` に置き換え、read/edit/write を sandbox 向けにカスタマイズ
3. **OpenClaw tools**: messaging, browser, canvas, sessions, Cron, Gateway など
4. **チャネル tools**: Discord/Telegram/Slack/WhatsApp 固有の action tools
5. **ポリシーフィルタリング**: tools は profile、プロバイダー、エージェント、グループ、sandbox ポリシーでフィルタされる
6. **Schema 正規化**: schema は Gemini/OpenAI の癖に合わせてクリーニングされる
7. **AbortSignal ラップ**: tools は abort signal を尊重するようラップされる

### Tool Definition アダプター

pi-agent-core の `AgentTool` は、pi-coding-agent の `ToolDefinition` とは異なる `execute` シグネチャを持ちます。`pi-tool-definition-adapter.ts` 内のアダプターがこれを橋渡しします。

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent のシグネチャは pi-agent-core と異なる
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Tool 分割戦略

`splitSdkTools()` は、すべての tools を `customTools` 経由で渡します。

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // 空。すべて上書きする
    customTools: toToolDefinitions(options.tools),
  };
}
```

これにより、OpenClaw のポリシーフィルタリング、sandbox 統合、拡張 toolset が、プロバイダーをまたいで一貫して維持されます。

## システムプロンプト構築

システムプロンプトは `buildAgentSystemPrompt()`（`system-prompt.ts`）で構築されます。Tooling、Tool Call Style、安全ガードレール、OpenClaw CLI リファレンス、Skills、Docs、Workspace、Sandbox、Messaging、Reply Tags、Voice、Silent Replies、Heartbeats、Runtime metadata に加え、有効な場合は Memory と Reactions、さらに任意の context ファイルと追加システムプロンプト内容を含む完全なプロンプトを組み立てます。セクションは、サブエージェントで使われる最小プロンプトモード向けに切り詰められます。

プロンプトはセッション作成後に `applySystemPromptOverrideToSession()` 経由で適用されます。

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## セッション管理

### セッションファイル

セッションは tree 構造（`id`/`parentId` リンク）を持つ JSONL ファイルです。pi の `SessionManager` が永続化を処理します。

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw はこれを `guardSessionManager()` でラップし、tool result の安全性を追加します。

### セッションキャッシュ

`session-manager-cache.ts` は、ファイル解析の繰り返しを避けるために SessionManager インスタンスをキャッシュします。

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 履歴制限

`limitHistoryTurns()` は、チャネル種別（DM vs グループ）に応じて会話履歴を削減します。

### Compaction

自動 Compaction はコンテキストオーバーフロー時に発動します。一般的なオーバーフローシグネチャには
`request_too_large`、`context length exceeded`、`input exceeds the
maximum number of tokens`、`input token count exceeds the maximum number of
input tokens`、`input is too long for the model`、`ollama error: context
length exceeded` があります。`compactEmbeddedPiSessionDirect()` は手動
Compaction を処理します。

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 認証とモデル解決

### Auth profile

OpenClaw は、プロバイダーごとに複数の API キーを持つ auth profile ストアを維持します。

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

profile は、cooldown 追跡付きで失敗時にローテーションします。

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

// pi の ModelRegistry と AuthStorage を使用
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

設定されている場合、`FailoverError` がモデルフォールバックを発動します。

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

## Pi extension

OpenClaw は、特化した動作のためにカスタム pi extension を読み込みます。

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` は、適応的トークン予算と tool failure および file operation サマリーを含む Compaction ガードレールを追加します。

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-hooks/context-pruning.ts` は、キャッシュ TTL ベースの context pruning を実装します。

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

### ブロック分割

`EmbeddedBlockChunker` は、ストリーミングテキストを離散的な返信ブロックに管理します。

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final タグ除去

ストリーミング出力は、`<think>`/`<thinking>` ブロックを取り除き、`<final>` 内容を抽出するよう処理されます。

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> の内容を除去
  // enforceFinalTag が有効なら、<final>...</final> の内容だけを返す
};
```

### 返信 directive

`[[media:url]]`、`[[voice]]`、`[[reply:id]]` のような返信 directive は解析・抽出されます。

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## エラー処理

### エラー分類

`pi-embedded-helpers.ts` は、適切な処理のためにエラーを分類します。

```typescript
isContextOverflowError(errorText)     // コンテキストが大きすぎる
isCompactionFailureError(errorText)   // Compaction に失敗
isAuthAssistantError(lastAssistant)   // Auth 失敗
isRateLimitAssistantError(...)        // レート制限
isFailoverAssistantError(...)         // Failover すべき
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking level フォールバック

thinking level がサポートされていない場合、フォールバックします。

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

## Sandbox 統合

sandbox mode が有効な場合、tools とパスは制約されます。

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // sandbox 化された read/edit/write tools を使う
  // Exec は container 内で実行
  // Browser は bridge URL を使う
}
```

## プロバイダー固有処理

### Anthropic

- refusal magic string の除去
- 連続 role に対するターン検証
- 厳格な upstream Pi tool パラメーター検証

### Google/Gemini

- Plugin 所有の tool schema サニタイズ

### OpenAI

- Codex モデル用の `apply_patch` tool
- thinking level のダウングレード処理

## TUI 統合

OpenClaw には、pi-tui コンポーネントを直接使うローカル TUI モードもあります。

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

これにより、pi のネイティブモードに近い対話型ターミナル体験が提供されます。

## Pi CLI との主な違い

| 観点             | Pi CLI                  | OpenClaw Embedded                                                                                 |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| 起動方法         | `pi` コマンド / RPC     | `createAgentSession()` 経由の SDK                                                                 |
| Tools            | デフォルト coding tools | カスタム OpenClaw tool スイート                                                                   |
| システムプロンプト | AGENTS.md + prompts     | チャネル/コンテキストごとの動的生成                                                               |
| セッション保存   | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`（または `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`） |
| Auth             | 単一認証情報            | ローテーション付きマルチ profile                                                                  |
| Extensions       | ディスクから読み込み    | プログラム的 + ディスクパス                                                                       |
| イベント処理     | TUI レンダリング        | コールバックベース（`onBlockReply` など）                                                         |

## 今後の考慮事項

将来的に見直しうる領域:

1. **Tool シグネチャ整合**: 現在は pi-agent-core と pi-coding-agent のシグネチャ差をアダプトしている
2. **Session manager ラップ**: `guardSessionManager` は安全性を加えるが複雑さも増す
3. **Extension 読み込み**: pi の `ResourceLoader` をより直接使える可能性がある
4. **ストリーミングハンドラーの複雑化**: `subscribeEmbeddedPiSession` が大きくなってきている
5. **プロバイダー固有の癖**: 多くのプロバイダー固有コードパスがあり、pi 側で処理できる可能性がある

## テスト

Pi 統合のカバレッジは次のスイートにまたがります。

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts`（`OPENCLAW_LIVE_TEST=1` を有効化）

現在の実行コマンドについては、[Pi Development Workflow](/ja-JP/pi-dev) を参照してください。

## 関連

- [Pi development workflow](/ja-JP/pi-dev)
- [Install overview](/ja-JP/install)
