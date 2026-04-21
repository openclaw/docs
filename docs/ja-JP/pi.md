---
read_when:
    - OpenClawにおけるPi SDK統合設計を理解すること
    - Pi向けのエージェントセッションライフサイクル、tooling、またはprovider wiringを変更すること
summary: OpenClawの組み込みPiエージェント統合とセッションライフサイクルのアーキテクチャ
title: Pi統合アーキテクチャ
x-i18n:
    generated_at: "2026-04-21T04:48:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ece62eb1459e8a861610c8502f2b3bf5172500207df5e78f4abe7a2a416a47fc
    source_path: pi.md
    workflow: 15
---

# Pi統合アーキテクチャ

このドキュメントでは、OpenClawが[pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent)およびその兄弟package（`pi-ai`、`pi-agent-core`、`pi-tui`）とどのように統合され、AIエージェント機能を実現しているかを説明します。

## 概要

OpenClawは、pi SDKを使ってAIコーディングエージェントをメッセージングgatewayアーキテクチャに組み込んでいます。piをsubprocessとして起動したりRPC modeを使ったりする代わりに、OpenClawは`createAgentSession()`経由でpiの`AgentSession`を直接importしてインスタンス化します。この組み込みアプローチにより、次が実現されます。

- セッションライフサイクルとイベント処理の完全な制御
- カスタムtool注入（メッセージング、sandbox、チャネル固有アクション）
- channel/contextごとのsystem promptカスタマイズ
- 分岐/Compaction対応のセッション永続化
- failover付きmulti-account auth profileローテーション
- providerに依存しないモデル切り替え

## Package dependencies

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Package           | 目的                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | コアLLM抽象化: `Model`、`streamSimple`、message types、provider APIs                                   |
| `pi-agent-core`   | エージェントループ、tool実行、`AgentMessage` types                                                     |
| `pi-coding-agent` | 高水準SDK: `createAgentSession`、`SessionManager`、`AuthStorage`、`ModelRegistry`、組み込みtools      |
| `pi-tui`          | ターミナルUIコンポーネント（OpenClawのローカルTUI modeで使用）                                        |

## ファイル構成

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/からの再export
├── pi-embedded-runner/
│   ├── run.ts                     # メインエントリ: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # セッションセットアップを含む単一試行ロジック
│   │   ├── params.ts              # RunEmbeddedPiAgentParams type
│   │   ├── payloads.ts            # 実行結果から応答payloadsを構築
│   │   ├── images.ts              # Vision model用の画像注入
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort error検出
│   ├── cache-ttl.ts               # context pruning用のCache TTL追跡
│   ├── compact.ts                 # 手動/自動Compactionロジック
│   ├── extensions.ts              # 組み込み実行向けpi extensionsを読み込み
│   ├── extra-params.ts            # provider固有のstream params
│   ├── google.ts                  # Google/Geminiのturn順序修正
│   ├── history.ts                 # 履歴制限（DM vs group）
│   ├── lanes.ts                   # session/global command lanes
│   ├── logger.ts                  # サブシステムlogger
│   ├── model.ts                   # ModelRegistry経由のモデル解決
│   ├── runs.ts                    # アクティブ実行の追跡、中断、キュー
│   ├── sandbox-info.ts            # system prompt用のsandbox情報
│   ├── session-manager-cache.ts   # SessionManagerインスタンスのキャッシュ
│   ├── session-manager-init.ts    # セッションファイル初期化
│   ├── system-prompt.ts           # system promptビルダー
│   ├── tool-split.ts              # toolsをbuiltInとcustomに分割
│   ├── types.ts                   # EmbeddedPiAgentMeta、EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevelマッピング、error説明
├── pi-embedded-subscribe.ts       # セッションイベント購読/ディスパッチ
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # イベントハンドラーファクトリ
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # ストリーミングblock replyのチャンク化
├── pi-embedded-messaging.ts       # メッセージングtoolの送信追跡
├── pi-embedded-helpers.ts         # error分類、turn検証
├── pi-embedded-helpers/           # ヘルパーモジュール
├── pi-embedded-utils.ts           # フォーマットユーティリティ
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # tools向けAbortSignalラップ
├── pi-tools.policy.ts             # tool allowlist/denylist policy
├── pi-tools.read.ts               # read toolカスタマイズ
├── pi-tools.schema.ts             # tool schema正規化
├── pi-tools.types.ts              # AnyAgentTool type alias
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinitionアダプター
├── pi-settings.ts                 # 設定override
├── pi-hooks/                      # カスタムpi hooks
│   ├── compaction-safeguard.ts    # safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # auth profile解決
├── auth-profiles.ts               # profile store、cooldown、failover
├── model-selection.ts             # デフォルトモデル解決
├── models-config.ts               # models.json生成
├── model-catalog.ts               # model catalogキャッシュ
├── context-window-guard.ts        # context window検証
├── failover-error.ts              # FailoverError class
├── defaults.ts                    # DEFAULT_PROVIDER、DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # system promptパラメータ解決
├── system-prompt-report.ts        # デバッグレポート生成
├── tool-summaries.ts              # tool説明サマリー
├── tool-policy.ts                 # tool policy解決
├── transcript-policy.ts           # transcript検証policy
├── skills.ts                      # Skill snapshot/prompt構築
├── skills/                        # Skillサブシステム
├── sandbox.ts                     # sandbox context解決
├── sandbox/                       # sandboxサブシステム
├── channel-tools.ts               # チャネル固有tool注入
├── openclaw-tools.ts              # OpenClaw固有tools
├── bash-tools.ts                  # exec/process tools
├── apply-patch.ts                 # apply_patch tool（OpenAI）
├── tools/                         # 個別tool実装
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

チャネル固有のmessage action runtimeは現在、`src/agents/tools`配下ではなく、
plugin所有のextensionディレクトリ内にあります。たとえば:

- Discord plugin action runtime files
- Slack plugin action runtime file
- Telegram plugin action runtime file
- WhatsApp plugin action runtime file

## コア統合フロー

### 1. 組み込みエージェントの実行

メインエントリポイントは`pi-embedded-runner/run.ts`内の`runEmbeddedPiAgent()`です。

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

`runEmbeddedAttempt()`（`runEmbeddedPiAgent()`から呼び出される）の内部では、pi SDKが使われます。

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

`subscribeEmbeddedPiSession()`は、piの`AgentSession`イベントを購読します。

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

- `message_start` / `message_end` / `message_update`（ストリーミングtext/thinking）
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. プロンプト処理

セットアップ後、セッションにpromptを送ります。

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDKが完全なエージェントループを処理します。LLMへの送信、tool callの実行、応答のストリーミングを行います。

画像注入はpromptローカルです。OpenClawは現在のpromptからimage refsを読み込み、
そのturnに対してのみ`images`経由で渡します。古い履歴turnを再スキャンして
image payloadsを再注入することはありません。

## Toolアーキテクチャ

### Toolパイプライン

1. **ベースTools**: piの`codingTools`（read、bash、edit、write）
2. **カスタム置換**: OpenClawはbashを`exec`/`process`に置き換え、sandbox向けにread/edit/writeをカスタマイズ
3. **OpenClaw Tools**: メッセージング、browser、canvas、sessions、Cron、gatewayなど
4. **チャネルTools**: Discord/Telegram/Slack/WhatsApp固有のaction tools
5. **Policy filtering**: profile、provider、agent、group、sandbox policyによってtoolsをフィルタ
6. **Schema正規化**: Gemini/OpenAIの癖に合わせてschemaをクリーンアップ
7. **AbortSignalラップ**: toolsをAbortSignalに従うようにラップ

### Tool definitionアダプター

pi-agent-coreの`AgentTool`は、pi-coding-agentの`ToolDefinition`とは異なる`execute`シグネチャを持ちます。`pi-tool-definition-adapter.ts`内のアダプターがこれを橋渡しします。

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agentのシグネチャはpi-agent-coreと異なる
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Tool分割戦略

`splitSdkTools()`は、すべてのtoolsを`customTools`経由で渡します。

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // 空。すべてoverrideする
    customTools: toToolDefinitions(options.tools),
  };
}
```

これにより、OpenClawのpolicy filtering、sandbox統合、拡張toolセットがprovider間で一貫したまま保たれます。

## System promptの構築

system promptは`buildAgentSystemPrompt()`（`system-prompt.ts`）で構築されます。Tooling、Tool Call Style、Safety guardrails、OpenClaw CLI reference、Skills、Docs、Workspace、Sandbox、Messaging、Reply Tags、Voice、Silent Replies、Heartbeats、Runtime metadataに加え、有効な場合はMemoryとReactions、さらに任意のcontext filesや追加system prompt contentを含む完全なpromptを組み立てます。subagentsで使われる最小prompt modeでは、各sectionはトリミングされます。

promptは、セッション作成後に`applySystemPromptOverrideToSession()`経由で適用されます。

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## セッション管理

### セッションファイル

セッションはツリー構造（`id`/`parentId`リンク）を持つJSONLファイルです。Piの`SessionManager`が永続化を処理します。

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClawは、tool resultの安全性のためにこれを`guardSessionManager()`でラップします。

### セッションキャッシュ

`session-manager-cache.ts`は、ファイルの繰り返し解析を避けるためにSessionManagerインスタンスをキャッシュします。

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 履歴制限

`limitHistoryTurns()`は、チャネル種別（DMとgroup）に基づいて会話履歴をトリミングします。

### Compaction

自動Compactionは、context overflow時に発動します。一般的なoverflowシグネチャには
`request_too_large`、`context length exceeded`、`input exceeds the
maximum number of tokens`、`input token count exceeds the maximum number of
input tokens`、`input is too long for the model`、`ollama error: context
length exceeded`が含まれます。`compactEmbeddedPiSessionDirect()`が手動
Compactionを処理します。

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 認証とモデル解決

### Auth profiles

OpenClawは、providerごとに複数のAPI keyを持つauth profile storeを維持します。

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

profilesは、cooldown追跡付きで失敗時にローテーションされます。

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

// piのModelRegistryとAuthStorageを使用
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError`は、設定されている場合にモデルfallbackをトリガーします。

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

## Pi extensions

OpenClawは、特化した動作のためにカスタムPi extensionsを読み込みます。

### Compaction safeguard

`src/agents/pi-hooks/compaction-safeguard.ts`は、適応的なtoken budgetingに加えてtool failureやfile operation summariesを含むguardrailsをCompactionに追加します。

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context pruning

`src/agents/pi-hooks/context-pruning.ts`は、Cache TTLベースのcontext pruningを実装します。

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

## ストリーミングとblock replies

### Block chunking

`EmbeddedBlockChunker`は、ストリーミングtextを離散的なreply blockへ分割して管理します。

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final tagの除去

ストリーミング出力は、`<think>`/`<thinking>`ブロックを除去し、`<final>`内容を抽出するよう処理されます。

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> contentを除去
  // enforceFinalTagが有効なら、<final>...</final> contentのみ返す
};
```

### Reply directives

`[[media:url]]`、`[[voice]]`、`[[reply:id]]`のようなreply directivesは解析され、抽出されます。

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## エラーハンドリング

### エラー分類

`pi-embedded-helpers.ts`は、適切に処理するためにerrorを分類します。

```typescript
isContextOverflowError(errorText)     // Contextが大きすぎる
isCompactionFailureError(errorText)   // Compaction失敗
isAuthAssistantError(lastAssistant)   // 認証失敗
isRateLimitAssistantError(...)        // レート制限
isFailoverAssistantError(...)         // failoverすべき
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking level fallback

thinking levelがサポートされていない場合はfallbackします。

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

## Sandbox統合

sandbox modeが有効な場合、toolsとpathsは制約されます。

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // sandbox化されたread/edit/write toolsを使用
  // Execはコンテナ内で実行
  // Browserはbridge URLを使用
}
```

## Provider固有の処理

### Anthropic

- refusal magic stringの除去
- 連続するroleに対するturn検証
- upstream Piの厳密なtool parameter検証

### Google/Gemini

- plugin所有のtool schemaサニタイズ

### OpenAI

- Codexモデル向けの`apply_patch` tool
- thinking levelのダウングレード処理

## TUI統合

OpenClawには、pi-tuiコンポーネントを直接使うローカルTUI modeもあります。

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

これにより、piネイティブmodeに似た対話型ターミナル体験が提供されます。

## Pi CLIとの主な違い

| Aspect          | Pi CLI                  | OpenClaw Embedded                                                                                 |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Invocation      | `pi`コマンド / RPC      | `createAgentSession()`経由のSDK                                                                   |
| Tools           | デフォルトcoding tools  | カスタムOpenClaw tool suite                                                                       |
| System prompt   | AGENTS.md + prompts     | channel/contextごとに動的                                                                         |
| Session storage | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`（または`$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`） |
| Auth            | 単一credential          | ローテーション付きmulti-profile                                                                   |
| Extensions      | ディスクから読み込み    | プログラム的 + ディスクpath                                                                       |
| Event handling  | TUIレンダリング         | コールバックベース（`onBlockReply`など）                                                          |

## 今後の検討事項

再設計の可能性がある領域:

1. **Toolシグネチャの整合**: 現在はpi-agent-coreとpi-coding-agentのシグネチャ差を適応している
2. **Session managerラップ**: `guardSessionManager`は安全性を追加するが複雑さも増す
3. **Extension読み込み**: piの`ResourceLoader`をより直接使える可能性がある
4. **Streaming handlerの複雑さ**: `subscribeEmbeddedPiSession`は大きくなってきている
5. **Providerの癖**: pi側で扱える可能性のあるprovider固有コードパスが多い

## テスト

Pi統合のカバレッジは次のsuiteにまたがっています。

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

live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts`（`OPENCLAW_LIVE_TEST=1`を有効化）

現在の実行コマンドについては、[Pi Development Workflow](/ja-JP/pi-dev)を参照してください。
