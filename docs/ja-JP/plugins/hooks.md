---
read_when:
    - before_tool_call、before_agent_reply、message フック、またはライフサイクルフックを必要とするプラグインを構築している
    - Plugin からのツール呼び出しをブロック、書き換え、または承認必須にする必要がある
    - 内部フックと Plugin フックのどちらを使うかを判断しています
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、Gateway のライフサイクルイベントを捕捉する'
title: Plugin フック
x-i18n:
    generated_at: "2026-05-02T05:01:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin フックは、OpenClaw プラグイン向けのプロセス内拡張ポイントです。プラグインがエージェント実行、ツール呼び出し、メッセージフロー、セッションライフサイクル、サブエージェントルーティング、インストール、または Gateway 起動を検査または変更する必要がある場合に使用します。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` などのコマンドおよび Gateway イベント向けに、オペレーターがインストールする小さな `HOOK.md` スクリプトが必要な場合は、代わりに [internal hooks](/ja-JP/automation/hooks) を使用します。

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

フックハンドラーは、`priority` の降順で逐次実行されます。同じ優先度のフックは登録順を維持します。

`api.on(name, handler, opts?)` は以下を受け取ります。

- `priority` — ハンドラーの順序付け（高いほど先に実行）。
- `timeoutMs` — フックごとの任意の予算。設定すると、フックランナーは予算が経過した後にそのハンドラーを中止し、低速なセットアップや recall 作業が呼び出し元の構成済みモデルタイムアウトを消費するのを許さずに、次のハンドラーへ進みます。省略すると、フックランナーが汎用的に適用する既定の観測/判断タイムアウトを使用します。

各フックは、そのハンドラーを登録したプラグインの解決済み設定である `event.context.pluginConfig` を受け取ります。現在のプラグインオプションを必要とするフック判断に使用してください。OpenClaw は、他のプラグインから見える共有イベントオブジェクトを変更せずに、ハンドラーごとにこれを注入します。

## フックカタログ

フックは、拡張対象のサーフェスごとにグループ化されています。**太字**の名前は判断結果（ブロック、キャンセル、上書き、または承認要求）を受け取ります。それ以外はすべて観測専用です。

**エージェントターン**

- `before_model_resolve` — セッションメッセージが読み込まれる前に provider またはモデルを上書き
- `agent_turn_prepare` — キュー済みのプラグインターン注入を消費し、プロンプトフックの前に同一ターンのコンテキストを追加
- `before_prompt_build` — モデル呼び出しの前に動的コンテキストまたはシステムプロンプトテキストを追加
- `before_agent_start` — 互換性専用の結合フェーズ。上記 2 つのフックを優先
- **`before_agent_reply`** — 合成返信または無音でモデルターンを短絡
- **`before_agent_finalize`** — 自然な最終回答を検査し、もう 1 回のモデルパスを要求
- `agent_end` — 最終メッセージ、成功状態、実行時間を観測
- `heartbeat_prompt_contribution` — バックグラウンドモニターおよびライフサイクルプラグイン向けに Heartbeat 専用コンテキストを追加

**会話観測**

- `model_call_started` / `model_call_ended` — プロンプトまたは応答内容を含まずに、サニタイズ済みの provider/モデル呼び出しメタデータ、タイミング、結果、境界付きリクエスト ID ハッシュを観測
- `llm_input` — provider 入力（システムプロンプト、プロンプト、履歴）を観測
- `llm_output` — provider 出力を観測

**ツール**

- **`before_tool_call`** — ツールパラメーターを書き換え、実行をブロックし、または承認を要求
- `after_tool_call` — ツール結果、エラー、所要時間を観測
- **`tool_result_persist`** — ツール結果から生成されるアシスタントメッセージを書き換え
- **`before_message_write`** — 進行中のメッセージ書き込みを検査またはブロック（まれ）

**メッセージと配信**

- **`inbound_claim`** — エージェントルーティングの前に受信メッセージを要求（合成返信）
- `message_received` — 受信コンテンツ、送信者、スレッド、メタデータを観測
- **`message_sending`** — 送信コンテンツを書き換え、または配信をキャンセル
- `message_sent` — 送信配信の成功または失敗を観測
- **`before_dispatch`** — チャネル引き渡しの前に送信ディスパッチを検査または書き換え
- **`reply_dispatch`** — 最終返信ディスパッチパイプラインに参加

**セッションと Compaction**

- `session_start` / `session_end` — セッションライフサイクル境界を追跡
- `before_compaction` / `after_compaction` — Compaction サイクルを観測または注釈付け
- `before_reset` — セッションリセットイベント（`/reset`、プログラムによるリセット）を観測

**サブエージェント**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — サブエージェントルーティングと完了配信を調整

**ライフサイクル**

- `gateway_start` / `gateway_stop` — Gateway とともにプラグイン所有サービスを開始または停止
- `cron_changed` — Gateway 所有の Cron ライフサイクル変更（追加、更新、削除、開始、完了、スケジュール済み）を観測
- **`before_install`** — Skill またはプラグインのインストールスキャンを検査し、任意でブロック

## ツール呼び出しポリシー

`before_tool_call` は以下を受け取ります。

- `event.toolName`
- `event.params`
- 任意の `event.runId`
- 任意の `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（cron 駆動の実行で設定）、診断用の `ctx.trace` などのコンテキストフィールド

返却できる内容は以下です。

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
- `requireApproval` はエージェント実行を一時停止し、プラグイン承認を通じてユーザーに確認します。`/approve` コマンドは exec とプラグイン承認の両方を承認できます。
- 高優先度のフックが承認を要求した後でも、低優先度の `block: true` がブロックできます。
- `onResolution` は解決済みの承認判断（`allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled`）を受け取ります。

ホストレベルのポリシーを必要とする同梱プラグインは、`api.registerTrustedToolPolicy(...)` で信頼済みツールポリシーを登録できます。これらは通常の `before_tool_call` フックおよび外部プラグインの判断より前に実行されます。ワークスペースポリシー、予算強制、予約済みワークフロー安全性など、ホストから信頼されるゲートにのみ使用してください。外部プラグインは通常の `before_tool_call` フックを使用する必要があります。

### ツール結果の永続化

ツール結果には、UI レンダリング、診断、メディアルーティング、またはプラグイン所有メタデータ向けの構造化 `details` を含めることができます。`details` はプロンプト内容ではなく、ランタイムメタデータとして扱ってください。

- OpenClaw は provider 再生と Compaction 入力の前に `toolResult.details` を取り除くため、メタデータがモデルコンテキストになることはありません。
- 永続化されたセッションエントリは、境界付きの `details` のみを保持します。過大な details はコンパクトな要約と `persistedDetailsTruncated: true` に置き換えられます。
- `tool_result_persist` と `before_message_write` は、最終的な永続化上限の前に実行されます。フックはそれでも返却する `details` を小さく保ち、プロンプトに関係するテキストを `details` のみに置くことを避ける必要があります。モデルから見えるツール出力は `content` に置いてください。

## プロンプトとモデルフック

新しいプラグインでは、フェーズ固有のフックを使用します。

- `before_model_resolve`: 現在のプロンプトと添付ファイルメタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在のプロンプト、準備済みセッションメッセージ、このセッション向けに取り出された exactly-once キュー済み注入を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在のプロンプトとセッションメッセージを受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: Heartbeat ターンでのみ実行され、`prependContext` または `appendContext` を返します。これは、ユーザーが開始したターンを変更せずに現在の状態を要約する必要があるバックグラウンドモニター向けです。

`before_agent_start` は互換性のために残っています。プラグインがレガシーな結合フェーズに依存しないように、上記の明示的なフックを優先してください。

OpenClaw がアクティブな実行を識別できる場合、`before_agent_start` と `agent_end` には `event.runId` が含まれます。同じ値は `ctx.runId` でも利用できます。Cron 駆動の実行では `ctx.jobId`（発生元の cron ジョブ ID）も公開されるため、プラグインフックはメトリクス、副作用、または状態を特定のスケジュール済みジョブにスコープできます。

チャネル発の実行では、`ctx.messageProvider` は `discord` や `telegram` などの provider サーフェスであり、`ctx.channelId` は OpenClaw がセッションキーまたは配信メタデータから導出できる場合の会話ターゲット識別子です。

`agent_end` は観測フックであり、ターン後に fire-and-forget で実行されます。フックランナーは 30 秒のタイムアウトを適用するため、詰まったプラグインや embedding エンドポイントがフックの promise を永久に保留したままにすることはできません。タイムアウトはログに記録され、OpenClaw は継続します。プラグインが独自の中止シグナルも使用しない限り、プラグイン所有のネットワーク作業はキャンセルされません。

生のプロンプト、履歴、応答、ヘッダー、リクエスト本文、または provider リクエスト ID を受け取るべきでない provider 呼び出しテレメトリには、`model_call_started` と `model_call_ended` を使用します。これらのフックには、`runId`、`callId`、`provider`、`model`、任意の `api`/`transport`、終端の `durationMs`/`outcome`、OpenClaw が境界付き provider リクエスト ID ハッシュを導出できる場合の `upstreamRequestIdHash` などの安定したメタデータが含まれます。

`before_agent_finalize` は、ハーネスが自然な最終アシスタント回答を受け入れようとしている場合にのみ実行されます。これは `/stop` キャンセルパスではなく、ユーザーがターンを中止した場合には実行されません。最終化の前にもう 1 回のモデルパスをハーネスに要求するには `{ action: "revise", reason }` を返し、最終化を強制するには `{ action: "finalize", reason? }` を返し、継続するには結果を省略します。Codex ネイティブの `Stop` フックは、OpenClaw の `before_agent_finalize` 判断としてこのフックに中継されます。

`llm_input`、`llm_output`、`before_agent_finalize`、または `agent_end` を必要とする非同梱プラグインは、以下を設定する必要があります。

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

ワークフロープラグインは、`api.registerSessionExtension(...)` で小さな JSON 互換セッション状態を永続化し、Gateway の `sessions.pluginPatch` メソッドを通じて更新できます。セッション行は、登録済み拡張状態を `pluginExtensions` を通じて投影するため、Control UI や他のクライアントはプラグイン内部を知ることなく、プラグイン所有の状態をレンダリングできます。

プラグインが永続的なコンテキストを次のモデルターンに exactly once で届ける必要がある場合は、`api.enqueueNextTurnInjection(...)` を使用します。OpenClaw はプロンプトフックの前にキュー済み注入を取り出し、期限切れの注入を破棄し、プラグインごとに `idempotencyKey` で重複排除します。これは、次のターンでモデルに見えるべきだが永続的なシステムプロンプトテキストになるべきではない、承認再開、ポリシー要約、バックグラウンドモニター差分、コマンド継続に適したシームです。

クリーンアップセマンティクスは契約の一部です。セッション拡張クリーンアップとランタイムライフサイクルクリーンアップのコールバックは、`reset`、`delete`、`disable`、または `restart` を受け取ります。ホストは、reset/delete/disable では所有プラグインの永続セッション拡張状態と保留中の次ターン注入を削除します。restart では永続セッション状態を維持しつつ、クリーンアップコールバックによってプラグインは古いランタイム世代のスケジューラージョブ、実行コンテキスト、その他の帯域外リソースを解放できます。

## メッセージフック

チャネルレベルのルーティングと配信ポリシーには、メッセージフックを使用します。

- `message_received`: 受信コンテンツ、送信者、`threadId`、`messageId`、
  `senderId`、任意の実行/セッション相関、およびメタデータを監視します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を監視します。

音声のみの TTS 返信では、チャネルペイロードに表示可能なテキスト/キャプションがない場合でも、
`content` に非表示の読み上げトランスクリプトが含まれることがあります。その
`content` を書き換えても、フックから見えるトランスクリプトだけが更新されます。メディアキャプションとしては
レンダリングされません。

メッセージフックのコンテキストは、利用可能な場合に安定した相関フィールドを公開します:
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、および `ctx.callDepth`。従来のメタデータを読む前に、
これらの第一級フィールドを優先してください。

チャネル固有のメタデータを使う前に、型付きの `threadId` および `replyToId` フィールドを優先してください。

判定ルール:

- `cancel: true` を指定した `message_sending` は終端です。
- `cancel: false` を指定した `message_sending` は判定なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、低優先度のフックへ引き続き渡されます。

## インストールフック

`before_install` は、Skills とプラグインのインストールに対する組み込みスキャンの後に実行されます。
追加の検出結果を返すか、インストールを停止するために `{ block: true, blockReason }` を返します。

`block: true` は終端です。`block: false` は判定なしとして扱われます。

## Gateway ライフサイクル

Gateway が所有する状態を必要とするプラグインサービスには `gateway_start` を使用します。コンテキストは
cron の検査と更新のために `ctx.config`、`ctx.workspaceDir`、および `ctx.getCron?.()` を公開します。
長時間実行されるリソースをクリーンアップするには `gateway_stop` を使用します。

プラグイン所有のランタイムサービスでは、内部の `gateway:startup` フックに依存しないでください。

`cron_changed` は、Gateway 所有の cron ライフサイクルイベントで発火し、`added`、`updated`、`removed`、`started`、`finished`、
および `scheduled` の理由を含む型付きイベントペイロードを持ちます。このイベントは、
`PluginHookGatewayCronJob` スナップショット（存在する場合は `state.nextRunAtMs`、`state.lastRunStatus`、および
`state.lastError` を含む）に加えて、`not-requested` | `delivered` | `not-delivered` | `unknown` の
`PluginHookGatewayCronDeliveryStatus` を運びます。削除イベントにも削除されたジョブのスナップショットが含まれるため、
外部スケジューラは状態を突き合わせることができます。外部ウェイクスケジューラを同期する場合は、ランタイムコンテキストの
`ctx.getCron?.()` と `ctx.config` を使用し、期限チェックと実行の信頼できる情報源は OpenClaw のままにしてください。

## 今後の非推奨化

いくつかのフック関連サーフェスは非推奨ですが、まだサポートされています。次のメジャーリリースまでに移行してください:

- `inbound_claim` および `message_received` ハンドラ内の **プレーンテキストチャネルエンベロープ**。
  フラットなエンベロープテキストを解析する代わりに、`BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。参照:
  [プレーンテキストチャネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** は互換性のために残っています。新しいプラグインは、結合されたフェーズの代わりに
  `before_model_resolve` と `before_prompt_build` を使用してください。
- **`before_tool_call` の `onResolution`** は現在、自由形式の `string` ではなく、型付きの
  `PluginApprovalResolution` union（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`）を使用します。

完全な一覧（メモリケイパビリティ登録、プロバイダー思考プロファイル、外部認証プロバイダー、
プロバイダー検出型、タスクランタイムアクセサ、および `command-auth` → `command-status` のリネーム）については、
[Plugin SDK 移行 → アクティブな非推奨化](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK 移行](/ja-JP/plugins/sdk-migration) — アクティブな非推奨化と削除タイムライン
- [プラグインの構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [プラグインエントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部フック](/ja-JP/automation/hooks)
- [プラグインアーキテクチャ内部](/ja-JP/plugins/architecture-internals)
