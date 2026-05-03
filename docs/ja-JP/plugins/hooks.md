---
read_when:
    - before_tool_call、before_agent_reply、メッセージフック、またはライフサイクルフックを必要とする Plugin を構築している
    - Plugin からのツール呼び出しをブロック、書き換え、または承認必須にする必要があります
    - 内部フックと Plugin フックのどちらにするかを判断している
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、Gateway のライフサイクルイベントをインターセプトする'
title: Plugin フック
x-i18n:
    generated_at: "2026-05-03T21:36:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin フックは、OpenClaw プラグイン向けのインプロセス拡張ポイントです。プラグインがエージェントの実行、ツール呼び出し、メッセージフロー、セッションライフサイクル、サブエージェントのルーティング、インストール、または Gateway 起動を検査または変更する必要がある場合に使用します。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` などのコマンドおよび Gateway イベント向けに、オペレーターがインストールする小さな `HOOK.md` スクリプトが必要な場合は、代わりに [内部フック](/ja-JP/automation/hooks) を使用してください。

## クイックスタート

プラグインエントリから `api.on(...)` で型付きプラグインフックを登録します。

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

フックハンドラーは、`priority` の降順で順次実行されます。同じ優先度のフックは登録順を維持します。

`api.on(name, handler, opts?)` は次を受け付けます。

- `priority` — ハンドラーの順序付け（高いほど先に実行）。
- `timeoutMs` — 任意のフック単位の予算。設定した場合、フックランナーは予算が経過した時点でそのハンドラーを中断し、次のハンドラーに進みます。これにより、遅いセットアップやリコール処理が呼び出し元の設定済みモデルタイムアウトを消費し続けることを防ぎます。省略すると、フックランナーが汎用的に適用するデフォルトの観測/判断タイムアウトを使用します。

オペレーターは、プラグインコードにパッチを当てずにフック予算を設定することもできます。

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

`hooks.timeouts.<hookName>` は `hooks.timeoutMs` を上書きし、`hooks.timeoutMs` はプラグイン作成側の `api.on(..., { timeoutMs })` 値を上書きします。設定値はそれぞれ、600000 ミリ秒以下の正の整数である必要があります。既知の遅いフックにはフック単位の上書きを優先し、1 つのプラグインがあらゆる場所で長い予算を得ないようにしてください。

各フックは、そのハンドラーを登録したプラグインの解決済み設定である `event.context.pluginConfig` を受け取ります。現在のプラグインオプションを必要とするフック判断に使用してください。OpenClaw は、他のプラグインから見える共有イベントオブジェクトを変更せず、ハンドラーごとにこれを注入します。

## フックカタログ

フックは拡張するサーフェスごとに分類されています。**太字**の名前は判断結果（ブロック、キャンセル、上書き、または承認要求）を受け付けます。それ以外はすべて観測専用です。

**エージェントターン**

- `before_model_resolve` — セッションメッセージの読み込み前にプロバイダーまたはモデルを上書きする
- `agent_turn_prepare` — キュー済みのプラグインターン注入を消費し、プロンプトフック前に同一ターンのコンテキストを追加する
- `before_prompt_build` — モデル呼び出し前に動的コンテキストまたはシステムプロンプトテキストを追加する
- `before_agent_start` — 互換性専用の結合フェーズ。上記 2 つのフックを優先してください
- **`before_agent_reply`** — 合成返信または沈黙でモデルターンを短絡する
- **`before_agent_finalize`** — 自然な最終回答を検査し、もう 1 回のモデルパスを要求する
- `agent_end` — 最終メッセージ、成功状態、実行時間を観測する
- `heartbeat_prompt_contribution` — バックグラウンドモニターおよびライフサイクルプラグイン向けに Heartbeat 専用コンテキストを追加する

**会話の観測**

- `model_call_started` / `model_call_ended` — プロンプトや応答内容なしで、サニタイズ済みのプロバイダー/モデル呼び出しメタデータ、タイミング、結果、境界付きリクエスト ID ハッシュを観測する
- `llm_input` — プロバイダー入力（システムプロンプト、プロンプト、履歴）を観測する
- `llm_output` — プロバイダー出力を観測する

**ツール**

- **`before_tool_call`** — ツールパラメーターを書き換える、実行をブロックする、または承認を要求する
- `after_tool_call` — ツール結果、エラー、実行時間を観測する
- **`tool_result_persist`** — ツール結果から生成されるアシスタントメッセージを書き換える
- **`before_message_write`** — 進行中のメッセージ書き込みを検査またはブロックする（まれ）

**メッセージと配信**

- **`inbound_claim`** — エージェントルーティング前に受信メッセージを要求する（合成返信）
- `message_received` — 受信内容、送信者、スレッド、メタデータを観測する
- **`message_sending`** — 送信内容を書き換える、または配信をキャンセルする
- `message_sent` — 送信配信の成功または失敗を観測する
- **`before_dispatch`** — チャンネルへの引き渡し前に送信ディスパッチを検査または書き換える
- **`reply_dispatch`** — 最終返信ディスパッチパイプラインに参加する

**セッションと Compaction**

- `session_start` / `session_end` — セッションライフサイクルの境界を追跡する
- `before_compaction` / `after_compaction` — Compaction サイクルを観測または注釈する
- `before_reset` — セッションリセットイベント（`/reset`、プログラムによるリセット）を観測する

**サブエージェント**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — サブエージェントのルーティングと完了配信を調整する

**ライフサイクル**

- `gateway_start` / `gateway_stop` — Gateway とともにプラグイン所有サービスを開始または停止する
- `cron_changed` — Gateway 所有の Cron ライフサイクル変更（追加、更新、削除、開始、終了、スケジュール）を観測する
- **`before_install`** — Skills またはプラグインのインストールスキャンを検査し、必要に応じてブロックする

## ツール呼び出しポリシー

`before_tool_call` は次を受け取ります。

- `event.toolName`
- `event.params`
- 任意の `event.runId`
- 任意の `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（Cron 駆動の実行で設定）、診断用の `ctx.trace` などのコンテキストフィールド

次を返すことができます。

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

- `block: true` は終端であり、低い優先度のハンドラーをスキップします。
- `block: false` は判断なしとして扱われます。
- `params` は実行用のツールパラメーターを書き換えます。
- `requireApproval` はエージェント実行を一時停止し、プラグイン承認を通じてユーザーに確認します。`/approve` コマンドは exec とプラグイン承認の両方を承認できます。
- 低い優先度の `block: true` は、高い優先度のフックが承認を要求した後でもブロックできます。
- `onResolution` は解決済みの承認判断、つまり `allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled` を受け取ります。

ホストレベルのポリシーを必要とする同梱プラグインは、`api.registerTrustedToolPolicy(...)` で信頼済みツールポリシーを登録できます。これらは通常の `before_tool_call` フックおよび外部プラグインの判断より前に実行されます。ワークスペースポリシー、予算の強制、予約済みワークフローの安全性など、ホストに信頼されたゲートにのみ使用してください。外部プラグインは通常の `before_tool_call` フックを使用するべきです。

### ツール結果の永続化

ツール結果には、UI レンダリング、診断、メディアルーティング、またはプラグイン所有メタデータ向けの構造化された `details` を含めることができます。`details` はプロンプト内容ではなく、ランタイムメタデータとして扱ってください。

- OpenClaw は、プロバイダー再生および Compaction 入力の前に `toolResult.details` を取り除き、メタデータがモデルコンテキストにならないようにします。
- 永続化されたセッションエントリには、境界付きの `details` のみが保持されます。過大な詳細はコンパクトな要約と `persistedDetailsTruncated: true` に置き換えられます。
- `tool_result_persist` と `before_message_write` は、最終的な永続化上限の前に実行されます。それでもフックは返す `details` を小さく保ち、プロンプト関連のテキストを `details` のみに置くことを避けるべきです。モデルに見えるツール出力は `content` に入れてください。

## プロンプトとモデルフック

新しいプラグインにはフェーズ固有のフックを使用してください。

- `before_model_resolve`: 現在のプロンプトと添付メタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在のプロンプト、準備済みセッションメッセージ、このセッション向けにドレインされた正確に一度だけのキュー済み注入を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在のプロンプトとセッションメッセージを受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: Heartbeat ターンでのみ実行され、`prependContext` または `appendContext` を返します。ユーザー開始ターンを変更せずに現在の状態を要約する必要があるバックグラウンドモニターを対象としています。

`before_agent_start` は互換性のために残っています。プラグインがレガシーな結合フェーズに依存しないよう、上記の明示的なフックを優先してください。

`before_agent_start` と `agent_end` は、OpenClaw がアクティブな実行を識別できる場合に `event.runId` を含みます。同じ値は `ctx.runId` でも利用できます。Cron 駆動の実行では、プラグインフックが特定のスケジュール済みジョブにメトリクス、副作用、または状態をスコープできるよう、`ctx.jobId`（元の Cron ジョブ ID）も公開されます。

チャンネル由来の実行では、`ctx.messageProvider` は `discord` や `telegram` などのプロバイダーサーフェスであり、`ctx.channelId` は OpenClaw がセッションキーまたは配信メタデータから導出できる場合の会話ターゲット識別子です。

`agent_end` は観測フックであり、ターン後に fire-and-forget で実行されます。フックランナーは 30 秒のタイムアウトを適用し、詰まったプラグインや埋め込みエンドポイントによってフック Promise が永遠に保留されないようにします。タイムアウトはログに記録され、OpenClaw は継続します。プラグインも独自の中断シグナルを使用していない限り、プラグイン所有のネットワーク処理はキャンセルされません。

生のプロンプト、履歴、応答、ヘッダー、リクエスト本文、またはプロバイダーリクエスト ID を受け取るべきではないプロバイダー呼び出しテレメトリには、`model_call_started` と `model_call_ended` を使用してください。これらのフックには、`runId`、`callId`、`provider`、`model`、任意の `api`/`transport`、終端の `durationMs`/`outcome`、および OpenClaw が境界付きプロバイダーリクエスト ID ハッシュを導出できる場合の `upstreamRequestIdHash` などの安定したメタデータが含まれます。

`before_agent_finalize` は、ハーネスが自然な最終アシスタント回答を受け入れようとしている場合にのみ実行されます。これは `/stop` のキャンセルパスではなく、ユーザーがターンを中止した場合には実行されません。最終化前にもう 1 回のモデルパスをハーネスに要求するには `{ action: "revise", reason }` を返し、最終化を強制するには `{ action: "finalize", reason? }` を返し、継続するには結果を省略します。Codex ネイティブの `Stop` フックは、OpenClaw の `before_agent_finalize` 判断としてこのフックに中継されます。

同梱されていないプラグインが `llm_input`、`llm_output`、`before_agent_finalize`、または `agent_end` を必要とする場合は、次を設定する必要があります。

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

プロンプトを変更するフックと永続的な次ターン注入は、プラグインごとに `plugins.entries.<id>.hooks.allowPromptInjection=false` で無効化できます。

### セッション拡張と次ターン注入

ワークフロープラグインは、`api.registerSessionExtension(...)` で小さな JSON 互換のセッション状態を永続化し、Gateway の `sessions.pluginPatch` メソッドを通じて更新できます。セッション行は登録済み拡張状態を `pluginExtensions` を通じて投影し、Control UI や他のクライアントがプラグイン内部を知ることなくプラグイン所有ステータスをレンダリングできるようにします。

OpenClaw は、Plugin が永続的なコンテキストを次のモデルターンに正確に1回届ける必要がある場合に `api.enqueueNextTurnInjection(...)` を使用します。OpenClaw はプロンプトフックの前にキュー済みの注入を排出し、期限切れの注入を破棄し、Plugin ごとに `idempotencyKey` で重複排除します。これは、承認の再開、ポリシー要約、バックグラウンドモニターの差分、次のターンでモデルに見えるべきだが永続的なシステムプロンプト文にはすべきでないコマンド継続に適した継ぎ目です。

クリーンアップのセマンティクスは契約の一部です。セッション拡張のクリーンアップとランタイムライフサイクルのクリーンアップコールバックは、`reset`、`delete`、`disable`、または `restart` を受け取ります。ホストは reset/delete/disable に対して、所有元 Plugin の永続セッション拡張状態と保留中の次ターン注入を削除します。restart では永続セッション状態を維持しつつ、クリーンアップコールバックによって Plugin が古いランタイム世代のスケジューラージョブ、実行コンテキスト、その他の帯域外リソースを解放できます。

## メッセージフック

チャネルレベルのルーティングと配信ポリシーにはメッセージフックを使用します。

- `message_received`: 受信コンテンツ、送信者、`threadId`、`messageId`、`senderId`、任意の実行/セッション相関、およびメタデータを監視します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を監視します。

音声のみの TTS 返信では、チャネルペイロードに表示可能なテキスト/キャプションがない場合でも、`content` に隠れた読み上げトランスクリプトが含まれることがあります。その `content` を書き換えると、フックから見えるトランスクリプトだけが更新されます。メディアキャプションとしては表示されません。

メッセージフックコンテキストは、利用可能な場合に安定した相関フィールドを公開します。`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、`ctx.callDepth` です。レガシーメタデータを読む前に、これらの第一級フィールドを優先してください。

チャネル固有のメタデータを使用する前に、型付きの `threadId` と `replyToId` フィールドを優先してください。

判定ルール:

- `cancel: true` を伴う `message_sending` は終端です。
- `cancel: false` を伴う `message_sending` は判定なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、優先度の低いフックへ続きます。

## インストールフック

`before_install` は、Skills と Plugin のインストールに対する組み込みスキャンの後に実行されます。追加の検出結果、またはインストールを停止するための `{ block: true, blockReason }` を返します。

`block: true` は終端です。`block: false` は判定なしとして扱われます。

## Gateway ライフサイクル

Gateway が所有する状態を必要とする Plugin サービスには `gateway_start` を使用します。コンテキストは、cron の検査と更新のために `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を公開します。長時間実行されるリソースのクリーンアップには `gateway_stop` を使用します。

Plugin が所有するランタイムサービスで、内部の `gateway:startup` フックに依存しないでください。

`cron_changed` は、Gateway が所有する cron ライフサイクルイベントに対して発火し、`added`、`updated`、`removed`、`started`、`finished`、`scheduled` の理由を網羅する型付きイベントペイロードを持ちます。このイベントは、`PluginHookGatewayCronJob` スナップショット（存在する場合は `state.nextRunAtMs`、`state.lastRunStatus`、`state.lastError` を含む）に加え、`not-requested` | `delivered` | `not-delivered` | `unknown` の `PluginHookGatewayCronDeliveryStatus` を運びます。削除イベントにも削除済みジョブのスナップショットが含まれるため、外部スケジューラーは状態を照合できます。外部の起床スケジューラーを同期する際は、ランタイムコンテキストの `ctx.getCron?.()` と `ctx.config` を使用し、期限チェックと実行の信頼できる情報源として OpenClaw を維持してください。

## 今後の非推奨化

いくつかのフック周辺サーフェスは非推奨ですが、まだサポートされています。次のメジャーリリース前に移行してください。

- `inbound_claim` および `message_received` ハンドラーの **プレーンテキストチャネルエンベロープ**。フラットなエンベロープテキストを解析する代わりに、`BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。[プレーンテキストチャネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。
- **`before_agent_start`** は互換性のために残っています。新しい Plugin は、統合フェーズの代わりに `before_model_resolve` と `before_prompt_build` を使用してください。
- **`before_tool_call` の `onResolution`** は、自由形式の `string` ではなく、型付きの `PluginApprovalResolution` ユニオン（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`）を使用するようになりました。

完全な一覧（メモリ機能登録、プロバイダー thinking プロファイル、外部認証プロバイダー、プロバイダー検出型、タスクランタイムアクセサー、`command-auth` → `command-status` の名称変更）については、[Plugin SDK 移行 → アクティブな非推奨項目](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK 移行](/ja-JP/plugins/sdk-migration) — アクティブな非推奨項目と削除予定
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部フック](/ja-JP/automation/hooks)
- [Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)
