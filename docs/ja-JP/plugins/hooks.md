---
read_when:
    - before_tool_call、before_agent_reply、メッセージフック、またはライフサイクルフックが必要なPluginを構築している
    - Pluginからのツール呼び出しをブロック、書き換え、または承認必須にする必要がある
    - 内部フックとPlugin フックのどちらを使うか判断している
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、Gateway のライフサイクルイベントをインターセプトする'
title: Plugin フック
x-i18n:
    generated_at: "2026-05-04T18:23:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37c7273036463c87e478db5678822b676c89447caee65f2f3f47a45194d1e37b
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin フックは、OpenClaw Plugin のインプロセス拡張ポイントです。Plugin がエージェント実行、ツール呼び出し、メッセージフロー、セッションライフサイクル、サブエージェントのルーティング、インストール、または Gateway 起動を検査または変更する必要がある場合に使用します。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` などのコマンドおよび Gateway イベント用に、オペレーターがインストールする小さな `HOOK.md` スクリプトが必要な場合は、代わりに [内部フック](/ja-JP/automation/hooks) を使用してください。

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

`api.on(name, handler, opts?)` は次を受け取ります。

- `priority` — ハンドラーの順序付け（高いものが先に実行されます）。
- `timeoutMs` — 任意のフックごとの予算。設定した場合、フックランナーはその予算が経過した時点でそのハンドラーを中止し、次のハンドラーへ続行します。遅いセットアップやリコール処理が、呼び出し元で設定されたモデルタイムアウトを消費しないようにします。省略すると、フックランナーが汎用的に適用するデフォルトの観測/判断タイムアウトを使用します。

オペレーターは Plugin コードにパッチを当てずにフック予算を設定することもできます。

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

`hooks.timeouts.<hookName>` は `hooks.timeoutMs` を上書きし、これは Plugin 作成者が指定した `api.on(..., { timeoutMs })` の値を上書きします。設定値はいずれも 600000 ミリ秒以下の正の整数である必要があります。1 つの Plugin があらゆる場所で長い予算を得ないよう、既知の遅いフックにはフックごとの上書きを優先してください。

各フックは、そのハンドラーを登録した Plugin の解決済み設定である `event.context.pluginConfig` を受け取ります。現在の Plugin オプションを必要とするフック判断に使用してください。OpenClaw は、他の Plugin が見る共有イベントオブジェクトを変更せずに、ハンドラーごとにこれを注入します。

## フックカタログ

フックは拡張する対象ごとにグループ化されています。**太字**の名前は判断結果（ブロック、キャンセル、上書き、または承認要求）を受け取れます。それ以外はすべて観測のみです。

**エージェントターン**

- `before_model_resolve` — セッションメッセージの読み込み前にプロバイダーまたはモデルを上書きします
- `agent_turn_prepare` — キューに入った Plugin ターン注入を消費し、プロンプトフックの前に同一ターンのコンテキストを追加します
- `before_prompt_build` — モデル呼び出しの前に動的コンテキストまたはシステムプロンプトテキストを追加します
- `before_agent_start` — 互換性のみの結合フェーズです。上の 2 つのフックを優先してください
- **`before_agent_reply`** — 合成返信または無音でモデルターンをショートサーキットします
- **`before_agent_finalize`** — 自然な最終回答を検査し、もう 1 回モデルパスを要求します
- `agent_end` — 最終メッセージ、成功状態、実行時間を観測します
- `heartbeat_prompt_contribution` — バックグラウンド監視およびライフサイクル Plugin 向けに Heartbeat 専用コンテキストを追加します

**会話の観測**

- `model_call_started` / `model_call_ended` — プロンプトや応答内容なしで、サニタイズ済みのプロバイダー/モデル呼び出しメタデータ、タイミング、結果、境界付きリクエスト ID ハッシュを観測します
- `llm_input` — プロバイダー入力（システムプロンプト、プロンプト、履歴）を観測します
- `llm_output` — プロバイダー出力を観測します

**ツール**

- **`before_tool_call`** — ツールパラメーターを書き換える、実行をブロックする、または承認を要求します
- `after_tool_call` — ツール結果、エラー、実行時間を観測します
- **`tool_result_persist`** — ツール結果から生成されたアシスタントメッセージを書き換えます
- **`before_message_write`** — 進行中のメッセージ書き込みを検査またはブロックします（まれ）

**メッセージと配信**

- **`inbound_claim`** — エージェントルーティング前に受信メッセージを引き受けます（合成返信）
- `message_received` — 受信コンテンツ、送信者、スレッド、メタデータを観測します
- **`message_sending`** — 送信コンテンツを書き換える、または配信をキャンセルします
- `message_sent` — 送信配信の成功または失敗を観測します
- **`before_dispatch`** — チャンネル引き渡し前に送信ディスパッチを検査または書き換えます
- **`reply_dispatch`** — 最終返信ディスパッチパイプラインに参加します

**セッションと Compaction**

- `session_start` / `session_end` — セッションライフサイクルの境界を追跡します
- `before_compaction` / `after_compaction` — Compaction サイクルを観測または注釈付けします
- `before_reset` — セッションリセットイベント（`/reset`、プログラムからのリセット）を観測します

**サブエージェント**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — サブエージェントのルーティングと完了配信を調整します

**ライフサイクル**

- `gateway_start` / `gateway_stop` — Gateway とともに Plugin 所有のサービスを開始または停止します
- `cron_changed` — Gateway 所有の cron ライフサイクル変更（追加、更新、削除、開始、完了、スケジュール）を観測します
- **`before_install`** — Skill または Plugin のインストールスキャンを検査し、任意でブロックします

## ツール呼び出しポリシー

`before_tool_call` は次を受け取ります。

- `event.toolName`
- `event.params`
- 任意の `event.runId`
- 任意の `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（cron 駆動の実行で設定）、診断用の `ctx.trace` などのコンテキストフィールド

次を返せます。

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

- `block: true` は終端であり、低優先度のハンドラーをスキップします。
- `block: false` は判断なしとして扱われます。
- `params` は実行用のツールパラメーターを書き換えます。
- `requireApproval` はエージェント実行を一時停止し、Plugin 承認を通じてユーザーに確認します。`/approve` コマンドは exec 承認と Plugin 承認の両方を承認できます。
- 高優先度のフックが承認を要求した後でも、低優先度の `block: true` は引き続きブロックできます。
- `onResolution` は解決済みの承認判断（`allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled`）を受け取ります。

ホストレベルのポリシーを必要とするバンドル Plugin は、`api.registerTrustedToolPolicy(...)` で信頼済みツールポリシーを登録できます。これらは通常の `before_tool_call` フックおよび外部 Plugin の判断より前に実行されます。ワークスペースポリシー、予算の強制、予約済みワークフローの安全性など、ホストが信頼するゲートにのみ使用してください。外部 Plugin は通常の `before_tool_call` フックを使用してください。

### ツール結果の永続化

ツール結果には、UI レンダリング、診断、メディアルーティング、または Plugin 所有メタデータ用の構造化された `details` を含めることができます。`details` はプロンプト内容ではなく、ランタイムメタデータとして扱ってください。

- OpenClaw は、メタデータがモデルコンテキストにならないように、プロバイダー再生および Compaction 入力の前に `toolResult.details` を取り除きます。
- 永続化されたセッションエントリは、境界付きの `details` のみを保持します。大きすぎる詳細は、コンパクトな要約と `persistedDetailsTruncated: true` に置き換えられます。
- `tool_result_persist` と `before_message_write` は、最終的な永続化上限の前に実行されます。それでもフックは、返す `details` を小さく保ち、プロンプトに関連するテキストを `details` のみに置かないようにしてください。モデルに見えるツール出力は `content` に入れてください。

## プロンプトとモデルのフック

新しい Plugin ではフェーズ固有のフックを使用してください。

- `before_model_resolve`: 現在のプロンプトと添付ファイルメタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在のプロンプト、準備済みセッションメッセージ、このセッションのために取り出された一度限りのキュー済み注入を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在のプロンプトとセッションメッセージを受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: Heartbeat ターンでのみ実行され、`prependContext` または `appendContext` を返します。ユーザー起点のターンを変更せずに現在の状態を要約する必要があるバックグラウンド監視向けです。

`before_agent_start` は互換性のために残っています。Plugin が従来の結合フェーズに依存しないよう、上記の明示的なフックを優先してください。

`before_agent_start` と `agent_end` には、OpenClaw がアクティブな実行を識別できる場合に `event.runId` が含まれます。同じ値は `ctx.runId` でも利用できます。cron 駆動の実行では `ctx.jobId`（元の cron ジョブ ID）も公開されるため、Plugin フックはメトリクス、副作用、または状態を特定のスケジュール済みジョブにスコープできます。

チャンネル起点の実行では、`ctx.messageProvider` は `discord` や `telegram` などのプロバイダー面を表し、`ctx.channelId` は OpenClaw がセッションキーまたは配信メタデータから導出できる場合の会話ターゲット識別子です。

`agent_end` は観測フックであり、ターン後に fire-and-forget で実行されます。フックランナーは 30 秒のタイムアウトを適用するため、停止した Plugin や埋め込みエンドポイントがフック Promise を永遠に保留したままにすることはできません。タイムアウトはログに記録され、OpenClaw は続行します。Plugin が自身の中止シグナルも使用していない限り、Plugin 所有のネットワーク処理はキャンセルされません。

生のプロンプト、履歴、応答、ヘッダー、リクエスト本文、またはプロバイダーリクエスト ID を受け取るべきでないプロバイダー呼び出しテレメトリには、`model_call_started` と `model_call_ended` を使用してください。これらのフックには、`runId`、`callId`、`provider`、`model`、任意の `api`/`transport`、終端時の `durationMs`/`outcome`、OpenClaw が境界付きプロバイダーリクエスト ID ハッシュを導出できる場合の `upstreamRequestIdHash` などの安定したメタデータが含まれます。

`before_agent_finalize` は、ハーネスが自然な最終アシスタント回答を受け入れようとしている場合にのみ実行されます。これは `/stop` キャンセル経路ではなく、ユーザーがターンを中断した場合は実行されません。確定前にもう 1 回モデルパスをハーネスに要求するには `{ action: "revise", reason }` を返し、確定を強制するには `{ action: "finalize", reason? }` を返します。続行する場合は結果を省略します。Codex ネイティブの `Stop` フックは、OpenClaw の `before_agent_finalize` 判断としてこのフックへ中継されます。

`action: "revise"` を返す場合、Plugin は追加のモデルパスを境界付きかつ再生安全にするため、`retry` メタデータを含めることができます。

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` はハーネスへ送信される修正理由に追加されます。`idempotencyKey` により、ホストは同等の確定判断にまたがって同じ Plugin 要求のリトライを数えられます。`maxAttempts` は、自然な最終回答で続行する前にホストが許可する追加パスの回数を制限します。

バンドルされていない Plugin が `llm_input`、`llm_output`、`before_agent_finalize`、または `agent_end` を必要とする場合は、次を設定する必要があります。

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

プロンプトを変更するフックと永続的な次ターン注入は、Plugin ごとに `plugins.entries.<id>.hooks.allowPromptInjection=false` で無効化できます。

### セッション拡張と次ターン注入

ワークフロー Plugin は、`api.registerSessionExtension(...)` を使用して小さな JSON 互換のセッション状態を永続化し、Gateway の `sessions.pluginPatch` メソッドを通じて更新できます。セッション行は、登録済みの拡張状態を `pluginExtensions` を通じて投影し、Control UI や他のクライアントが Plugin の内部を知ることなく Plugin 所有のステータスをレンダリングできるようにします。

Plugin が耐久性のあるコンテキストを次のモデルターンに正確に 1 回届ける必要がある場合は、`api.enqueueNextTurnInjection(...)` を使用します。OpenClaw はプロンプトフックの前にキュー済みの注入を排出し、期限切れの注入を破棄し、Plugin ごとに `idempotencyKey` で重複排除します。これは、承認の再開、ポリシー要約、バックグラウンドモニターの差分、次のターンでモデルに見えるべきだが永続的なシステムプロンプトテキストにはなるべきではないコマンド継続に適した境界です。

クリーンアップのセマンティクスはコントラクトの一部です。セッション拡張のクリーンアップとランタイムライフサイクルのクリーンアップコールバックは、`reset`、`delete`、`disable`、または `restart` を受け取ります。ホストは reset/delete/disable に対して、所有する Plugin の永続セッション拡張状態と保留中の次ターン注入を削除します。restart では耐久性のあるセッション状態を保持しつつ、クリーンアップコールバックにより Plugin が古いランタイム世代のスケジューラージョブ、実行コンテキスト、その他の帯域外リソースを解放できます。

## メッセージフック

チャンネルレベルのルーティングと配信ポリシーにはメッセージフックを使用します。

- `message_received`: 受信コンテンツ、送信者、`threadId`、`messageId`、`senderId`、任意の実行/セッション相関、メタデータを監視します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を監視します。

音声のみの TTS 応答では、チャンネルペイロードに表示されるテキスト/キャプションがない場合でも、`content` に非表示の発話トランスクリプトが含まれることがあります。その `content` を書き換えると、フックから見えるトランスクリプトのみが更新されます。メディアキャプションとしてはレンダリングされません。

メッセージフックのコンテキストは、利用可能な場合に安定した相関フィールドを公開します: `ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、`ctx.callDepth`。レガシーメタデータを読む前に、まずこれらのファーストクラスフィールドを優先してください。

チャンネル固有のメタデータを使用する前に、型付けされた `threadId` と `replyToId` フィールドを優先してください。

判定ルール:

- `cancel: true` を伴う `message_sending` は終端です。
- `cancel: false` を伴う `message_sending` は判定なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、より低い優先度のフックへ継続します。

## インストールフック

`before_install` は、Skills と Plugin のインストールに対する組み込みスキャンの後に実行されます。追加の検出結果、またはインストールを停止するための `{ block: true, blockReason }` を返します。

`block: true` は終端です。`block: false` は判定なしとして扱われます。

## Gateway ライフサイクル

Gateway が所有する状態を必要とする Plugin サービスには `gateway_start` を使用します。コンテキストは、cron の検査と更新のために `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を公開します。長時間実行されるリソースのクリーンアップには `gateway_stop` を使用します。

Plugin 所有のランタイムサービスに対して、内部の `gateway:startup` フックに依存しないでください。

`cron_changed` は、Gateway が所有する cron ライフサイクルイベントに対して発火し、`added`、`updated`、`removed`、`started`、`finished`、`scheduled` の理由をカバーする型付きイベントペイロードを伴います。このイベントは、`PluginHookGatewayCronJob` スナップショット（存在する場合は `state.nextRunAtMs`、`state.lastRunStatus`、`state.lastError` を含む）に加えて、`not-requested` | `delivered` | `not-delivered` | `unknown` の `PluginHookGatewayCronDeliveryStatus` を運びます。削除イベントでも、外部スケジューラーが状態を突き合わせられるように、削除されたジョブのスナップショットを保持します。外部のウェイクスケジューラーを同期する際は、ランタイムコンテキストの `ctx.getCron?.()` と `ctx.config` を使用し、期限チェックと実行については OpenClaw を信頼できる情報源として維持してください。

## 今後の非推奨化

いくつかのフック隣接サーフェスは非推奨ですが、引き続きサポートされています。次のメジャーリリースまでに移行してください。

- `inbound_claim` と `message_received` ハンドラーにおける **プレーンテキストチャンネルエンベロープ**。フラットなエンベロープテキストを解析する代わりに、`BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。[プレーンテキストチャンネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。
- **`before_agent_start`** は互換性のために残っています。新しい Plugin は、結合されたフェーズの代わりに `before_model_resolve` と `before_prompt_build` を使用してください。
- **`before_tool_call` の `onResolution`** は現在、自由形式の `string` ではなく、型付けされた `PluginApprovalResolution` ユニオン（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`）を使用します。

完全な一覧（メモリ機能登録、プロバイダー思考プロファイル、外部認証プロバイダー、プロバイダー検出型、タスクランタイムアクセサー、`command-auth` → `command-status` のリネーム）については、[Plugin SDK 移行 → 有効な非推奨項目](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK 移行](/ja-JP/plugins/sdk-migration) — 有効な非推奨項目と削除タイムライン
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部フック](/ja-JP/automation/hooks)
- [Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)
