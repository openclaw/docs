---
read_when:
    - before_tool_call、before_agent_reply、メッセージフック、またはライフサイクルフックが必要なPluginを構築している
    - Plugin からのツール呼び出しをブロック、書き換え、または承認必須にする必要がある
    - 内部フックとPlugin フックのどちらを使うか決める
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、Gateway のライフサイクルイベントをインターセプトする'
title: Plugin フック
x-i18n:
    generated_at: "2026-05-06T05:13:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin フックは、OpenClaw Plugin のインプロセス拡張ポイントです。Plugin がエージェント実行、ツール呼び出し、メッセージフロー、セッションライフサイクル、サブエージェントのルーティング、インストール、または Gateway 起動を検査または変更する必要がある場合に使用します。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` などのコマンドや Gateway イベント向けに、運用者がインストールする小さな `HOOK.md` スクリプトが必要な場合は、代わりに [内部フック](/ja-JP/automation/hooks) を使用します。

## クイックスタート

Plugin エントリから `api.on(...)` で型付き Plugin フックを登録します。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

フックハンドラーは `priority` の降順で順次実行されます。同じ優先度のフックは登録順を維持します。

`api.on(name, handler, opts?)` は次を受け付けます。

- `priority` - ハンドラーの順序付け（高いほど先に実行）。
- `timeoutMs` - 任意のフックごとの予算。設定すると、フックランナーは、その予算が経過した後にそのハンドラーを中断し、遅いセットアップやリコール処理が呼び出し元に設定されたモデルタイムアウトを消費するのを許さず、次のハンドラーへ進みます。省略すると、フックランナーが汎用的に適用するデフォルトの観測/判断タイムアウトを使用します。

運用者は、Plugin コードにパッチを当てずにフック予算を設定することもできます。

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` は `hooks.timeoutMs` を上書きし、これは Plugin 作成者が指定した `api.on(..., { timeoutMs })` 値を上書きします。設定される各値は、600000 ミリ秒以下の正の整数でなければなりません。既知の遅いフックにはフックごとの上書きを優先し、1 つの Plugin がすべての場所で長い予算を得ないようにします。

各フックは `event.context.pluginConfig`、つまりそのハンドラーを登録した Plugin の解決済み設定を受け取ります。現在の Plugin オプションが必要なフック判断に使用します。OpenClaw は、他の Plugin から見える共有イベントオブジェクトを変更せずに、ハンドラーごとにこれを注入します。

## フックカタログ

フックは拡張する対象ごとにグループ化されています。**太字**の名前は判断結果（ブロック、キャンセル、上書き、または承認要求）を受け付けます。それ以外はすべて観測専用です。

**エージェントターン**

- `before_model_resolve` - セッションメッセージを読み込む前にプロバイダーまたはモデルを上書き
- `agent_turn_prepare` - キューに入った Plugin ターン注入を消費し、プロンプトフックの前に同一ターンのコンテキストを追加
- `before_prompt_build` - モデル呼び出しの前に動的コンテキストまたはシステムプロンプトテキストを追加
- `before_agent_start` - 互換性のみの結合フェーズ。上の 2 つのフックを優先
- **`before_agent_reply`** - 合成返信または沈黙でモデルターンを短絡
- **`before_agent_finalize`** - 自然な最終回答を検査し、もう 1 回のモデルパスを要求
- `agent_end` - 最終メッセージ、成功状態、実行時間を観測
- `heartbeat_prompt_contribution` - バックグラウンドモニターおよびライフサイクル Plugin 向けに Heartbeat 専用コンテキストを追加

**会話の観測**

- `model_call_started` / `model_call_ended` - プロンプトやレスポンス内容なしで、サニタイズ済みのプロバイダー/モデル呼び出しメタデータ、タイミング、結果、境界付きリクエスト ID ハッシュを観測
- `llm_input` - プロバイダー入力（システムプロンプト、プロンプト、履歴）を観測
- `llm_output` - プロバイダー出力を観測

**ツール**

- **`before_tool_call`** - ツールパラメーターを書き換え、実行をブロックし、または承認を要求
- `after_tool_call` - ツール結果、エラー、実行時間を観測
- **`tool_result_persist`** - ツール結果から生成されたアシスタントメッセージを書き換え
- **`before_message_write`** - 進行中のメッセージ書き込みを検査またはブロック（まれ）

**メッセージと配信**

- **`inbound_claim`** - エージェントルーティング前に受信メッセージを引き受け（合成返信）
- `message_received` - 受信内容、送信者、スレッド、メタデータを観測
- **`message_sending`** - 送信内容を書き換え、または配信をキャンセル
- `message_sent` - 送信配信の成功または失敗を観測
- **`before_dispatch`** - チャネル引き渡し前に送信ディスパッチを検査または書き換え
- **`reply_dispatch`** - 最終返信ディスパッチパイプラインに参加

**セッションと Compaction**

- `session_start` / `session_end` - セッションライフサイクル境界を追跡
- `before_compaction` / `after_compaction` - Compaction サイクルを観測または注釈付け
- `before_reset` - セッションリセットイベント（`/reset`、プログラムによるリセット）を観測

**サブエージェント**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - サブエージェントのルーティングと完了配信を調整

**ライフサイクル**

- `gateway_start` / `gateway_stop` - Gateway とともに Plugin 所有サービスを開始または停止
- `cron_changed` - Gateway 所有の Cron ライフサイクル変更（追加、更新、削除、開始、完了、スケジュール済み）を観測
- **`before_install`** - Skills または Plugin のインストールスキャンを検査し、任意でブロック

## ツール呼び出しポリシー

`before_tool_call` は次を受け取ります。

- `event.toolName`
- `event.params`
- 任意の `event.runId`
- 任意の `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（Cron 駆動の実行で設定）、診断用 `ctx.trace` などのコンテキストフィールド

これは次を返せます。

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

ルール:

- `block: true` は終端であり、優先度の低いハンドラーをスキップします。
- `block: false` は判断なしとして扱われます。
- `params` は実行用のツールパラメーターを書き換えます。
- `requireApproval` はエージェント実行を一時停止し、Plugin 承認を通じてユーザーに確認します。`/approve` コマンドは exec と Plugin 承認の両方を承認できます。
- 優先度の高いフックが承認を要求した後でも、優先度の低い `block: true` はブロックできます。
- `onResolution` は解決済みの承認判断、つまり `allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled` を受け取ります。

ホストレベルのポリシーが必要な同梱 Plugin は、`api.registerTrustedToolPolicy(...)` で信頼済みツールポリシーを登録できます。これらは通常の `before_tool_call` フックより前、外部 Plugin の判断より前に実行されます。ワークスペースポリシー、予算適用、予約済みワークフローの安全性など、ホストが信頼するゲートにのみ使用します。外部 Plugin は通常の `before_tool_call` フックを使用する必要があります。

### ツール結果の永続化

ツール結果には、UI レンダリング、診断、メディアルーティング、または Plugin 所有メタデータ向けの構造化された `details` を含めることができます。`details` はプロンプト内容ではなくランタイムメタデータとして扱います。

- OpenClaw は、メタデータがモデルコンテキストにならないように、プロバイダー再生と Compaction 入力の前に `toolResult.details` を除去します。
- 永続化されたセッションエントリは、境界付きの `details` のみを保持します。大きすぎる details はコンパクトな要約と `persistedDetailsTruncated: true` に置き換えられます。
- `tool_result_persist` と `before_message_write` は最終的な永続化上限の前に実行されます。それでもフックは返される `details` を小さく保ち、プロンプトに関連するテキストを `details` だけに置かないようにする必要があります。モデルに見えるツール出力は `content` に置きます。

## プロンプトとモデルのフック

新しい Plugin にはフェーズ固有のフックを使用します。

- `before_model_resolve`: 現在のプロンプトと添付メタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在のプロンプト、準備済みセッションメッセージ、このセッションのために取り出された正確に 1 回限りのキュー済み注入を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在のプロンプトとセッションメッセージを受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: Heartbeat ターンでのみ実行され、`prependContext` または `appendContext` を返します。ユーザー開始ターンを変更せずに現在の状態を要約する必要があるバックグラウンドモニター向けです。

`before_agent_start` は互換性のために残っています。Plugin が従来の結合フェーズに依存しないように、上の明示的なフックを優先します。

OpenClaw がアクティブな実行を識別できる場合、`before_agent_start` と `agent_end` には `event.runId` が含まれます。同じ値は `ctx.runId` でも利用できます。Cron 駆動の実行は `ctx.jobId`（元の Cron ジョブ ID）も公開するため、Plugin フックはメトリクス、副作用、または状態を特定のスケジュール済みジョブにスコープできます。

チャネル由来の実行では、`ctx.messageProvider` は `discord` や `telegram` などのプロバイダーサーフェスであり、`ctx.channelId` は OpenClaw がセッションキーまたは配信メタデータから導出できる場合の会話ターゲット識別子です。

`agent_end` は観測フックであり、ターン後に fire-and-forget で実行されます。フックランナーは、詰まった Plugin や埋め込みエンドポイントがフック Promise を永遠に保留のままにできないよう、30 秒のタイムアウトを適用します。タイムアウトはログに記録され、OpenClaw は継続します。Plugin が独自の abort signal も使用していない限り、Plugin 所有のネットワーク処理はキャンセルされません。

生のプロンプト、履歴、レスポンス、ヘッダー、リクエスト本文、またはプロバイダーリクエスト ID を受け取るべきでないプロバイダー呼び出しテレメトリには、`model_call_started` と `model_call_ended` を使用します。これらのフックには、`runId`、`callId`、`provider`、`model`、任意の `api`/`transport`、終端の `durationMs`/`outcome`、OpenClaw が境界付きプロバイダーリクエスト ID ハッシュを導出できる場合の `upstreamRequestIdHash` などの安定したメタデータが含まれます。

`before_agent_finalize` は、ハーネスが自然な最終アシスタント回答を受け入れようとしている場合にのみ実行されます。これは `/stop` キャンセルパスではなく、ユーザーがターンを中断したときには実行されません。最終化前にもう 1 回モデルパスを要求するには `{ action: "revise", reason }` を返し、最終化を強制するには `{ action:
"finalize", reason? }` を返し、継続するには結果を省略します。Codex ネイティブの `Stop` フックは、OpenClaw の `before_agent_finalize` 判断として中継されます。

`action: "revise"` を返す場合、Plugin は追加のモデルパスを境界付きかつ再生安全にするために `retry` メタデータを含めることができます。

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` はハーネスに送信される修正理由に追加されます。`idempotencyKey` により、ホストは同等の finalize 判断をまたいで同じ Plugin 要求のリトライを数えられます。また、`maxAttempts` は自然な最終回答を続行する前にホストが許可する追加パス数を制限します。

`llm_input`、`llm_output`、`before_agent_finalize`、または `agent_end` が必要な非同梱 Plugin は、次を設定する必要があります。

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

プロンプトを変更するフックと永続的な次ターン注入は、Plugin ごとに `plugins.entries.<id>.hooks.allowPromptInjection=false` で無効にできます。

### セッション拡張と次ターン注入

ワークフロー Plugin は、`api.registerSessionExtension(...)` を使用して小さな JSON 互換のセッション状態を永続化し、Gateway の `sessions.pluginPatch` メソッドを通じて更新できます。セッション行は登録済みの拡張状態を `pluginExtensions` を通じて投影し、Control UI や他のクライアントが Plugin の内部を知らずに Plugin 所有のステータスをレンダリングできるようにします。

Plugin が次のモデルターンへ永続的なコンテキストをちょうど一度だけ届ける必要がある場合は、`api.enqueueNextTurnInjection(...)` を使用します。OpenClaw はプロンプトフックの前にキュー済みの注入をドレインし、期限切れの注入を破棄し、Plugin ごとに `idempotencyKey` で重複排除します。これは、承認の再開、ポリシー概要、バックグラウンドモニターの差分、次のターンでモデルから見える必要はあるが永続的なシステムプロンプトテキストにはすべきでないコマンド継続に適した継ぎ目です。

クリーンアップのセマンティクスは契約の一部です。セッション拡張のクリーンアップとランタイムライフサイクルのクリーンアップコールバックは、`reset`、`delete`、`disable`、または `restart` を受け取ります。ホストは reset/delete/disable では所有元 Plugin の永続セッション拡張状態と保留中の次ターン注入を削除します。restart では永続セッション状態を保持しつつ、クリーンアップコールバックにより Plugin が古いランタイム世代のスケジューラージョブ、実行コンテキスト、その他の帯域外リソースを解放できます。

## メッセージフック

チャネルレベルのルーティングと配信ポリシーにはメッセージフックを使用します。

- `message_received`: 受信コンテンツ、送信者、`threadId`、`messageId`、`senderId`、任意の実行/セッション相関、およびメタデータを監視します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を監視します。

音声のみの TTS 返信では、チャネルペイロードに表示可能なテキスト/キャプションがない場合でも、`content` に非表示の読み上げトランスクリプトが含まれることがあります。その `content` を書き換えると、フックから見えるトランスクリプトのみが更新されます。メディアキャプションとしてはレンダリングされません。

メッセージフックのコンテキストは、利用可能な場合に安定した相関フィールドを公開します: `ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、`ctx.callDepth`。従来のメタデータを読む前に、まずこれらのファーストクラスフィールドを優先してください。

チャネル固有のメタデータを使用する前に、型付きの `threadId` と `replyToId` フィールドを優先してください。

判定ルール:

- `cancel: true` を伴う `message_sending` は終端です。
- `cancel: false` を伴う `message_sending` は判定なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、低優先度のフックへ引き続き渡されます。

## インストールフック

`before_install` は、Skill と Plugin のインストールに対する組み込みスキャンの後に実行されます。インストールを停止するには、追加の検出結果または `{ block: true, blockReason }` を返します。

`block: true` は終端です。`block: false` は判定なしとして扱われます。

## Gateway ライフサイクル

Gateway 所有の状態を必要とする Plugin サービスには `gateway_start` を使用します。コンテキストは cron の検査と更新のために `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を公開します。長時間実行されるリソースのクリーンアップには `gateway_stop` を使用します。

Plugin 所有のランタイムサービスでは、内部の `gateway:startup` フックに依存しないでください。

`cron_changed` は、Gateway 所有の cron ライフサイクルイベントに対して発火し、`added`、`updated`、`removed`、`started`、`finished`、`scheduled` の理由をカバーする型付きイベントペイロードを伴います。このイベントは、`PluginHookGatewayCronJob` スナップショット（存在する場合は `state.nextRunAtMs`、`state.lastRunStatus`、`state.lastError` を含む）に加えて、`not-requested` | `delivered` | `not-delivered` | `unknown` の `PluginHookGatewayCronDeliveryStatus` を運びます。削除イベントでも削除済みジョブのスナップショットを運ぶため、外部スケジューラーは状態を照合できます。外部のウェイクスケジューラーを同期する際は、ランタイムコンテキストの `ctx.getCron?.()` と `ctx.config` を使用し、期限チェックと実行の信頼できる情報源として OpenClaw を維持してください。

## 今後の非推奨化

フック周辺のいくつかのサーフェスは非推奨ですが、引き続きサポートされています。次のメジャーリリース前に移行してください。

- `inbound_claim` および `message_received` ハンドラー内の **平文チャネルエンベロープ**。フラットなエンベロープテキストを解析する代わりに、`BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。[平文チャネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。
- **`before_agent_start`** は互換性のために残っています。新しい Plugin は、結合されたフェーズの代わりに `before_model_resolve` と `before_prompt_build` を使用してください。
- **`before_tool_call` の `onResolution`** は、自由形式の `string` ではなく、型付きの `PluginApprovalResolution` ユニオン（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`）を使用するようになりました。

完全な一覧（メモリ機能登録、プロバイダー思考プロファイル、外部認証プロバイダー、プロバイダー検出型、タスクランタイムアクセサー、および `command-auth` → `command-status` のリネーム）については、[Plugin SDK 移行 → アクティブな非推奨項目](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK 移行](/ja-JP/plugins/sdk-migration) - アクティブな非推奨項目と削除タイムライン
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部フック](/ja-JP/automation/hooks)
- [Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)
