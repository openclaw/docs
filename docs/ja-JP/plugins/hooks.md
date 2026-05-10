---
read_when:
    - before_tool_call、before_agent_reply、メッセージフック、またはライフサイクルフックを必要とする Plugin を構築している
    - Plugin からのツール呼び出しは、ブロック、書き換え、または承認必須にする必要があります
    - 内部フックとPluginフックのどちらを使うかを決めています
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、Gateway のライフサイクルイベントをインターセプトする'
title: Plugin フック
x-i18n:
    generated_at: "2026-05-10T19:43:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebdbb743441dfa9eba3d476171c1c8e9d9628d2669aeea0806ede19bafd61f62
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin フックは、OpenClaw Plugin のインプロセス拡張ポイントです。Plugin がエージェント実行、ツール呼び出し、メッセージフロー、セッションライフサイクル、サブエージェントルーティング、インストール、または Gateway 起動を検査または変更する必要がある場合に使用します。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` などのコマンドおよび Gateway イベント向けに、オペレーターがインストールする小さな `HOOK.md` スクリプトが必要な場合は、代わりに [internal hooks](/ja-JP/automation/hooks) を使用します。

## クイックスタート

Plugin エントリから `api.on(...)` を使って型付き Plugin フックを登録します。

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

フックハンドラーは `priority` の降順で順番に実行されます。同じ優先度のフックは登録順を維持します。

`api.on(name, handler, opts?)` は次を受け付けます。

- `priority` - ハンドラーの順序（高いほど先に実行）。
- `timeoutMs` - 任意のフックごとの予算。設定すると、フックランナーは予算が経過した後にそのハンドラーを中断し、次のハンドラーへ進みます。これにより、遅いセットアップやリコール処理が呼び出し元に設定されたモデルタイムアウトを消費し続けることを防ぎます。省略すると、フックランナーが汎用的に適用するデフォルトの観測/判断タイムアウトを使用します。

オペレーターは、Plugin コードをパッチせずにフック予算を設定することもできます。

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

`hooks.timeouts.<hookName>` は `hooks.timeoutMs` を上書きし、これは Plugin 作者が指定した `api.on(..., { timeoutMs })` の値を上書きします。設定する各値は、600000 ミリ秒以下の正の整数である必要があります。1 つの Plugin があらゆる場所で長い予算を得ないように、遅いことが分かっているフックにはフックごとの上書きを優先してください。

各フックは、そのハンドラーを登録した Plugin の解決済み設定である `event.context.pluginConfig` を受け取ります。現在の Plugin オプションを必要とするフック判断に使用します。OpenClaw は、他の Plugin が見る共有イベントオブジェクトを変更せずに、ハンドラーごとにこれを注入します。

## フックカタログ

フックは、拡張する対象の面ごとにグループ化されています。**太字**の名前は判断結果（ブロック、キャンセル、上書き、または承認要求）を受け付けます。それ以外はすべて観測専用です。

**エージェントターン**

- `before_model_resolve` - セッションメッセージの読み込み前にプロバイダーまたはモデルを上書きする
- `agent_turn_prepare` - キューに入った Plugin ターン注入を消費し、プロンプトフック前に同一ターンのコンテキストを追加する
- `before_prompt_build` - モデル呼び出し前に動的コンテキストまたはシステムプロンプトテキストを追加する
- `before_agent_start` - 互換性専用の結合フェーズ。上記 2 つのフックを優先する
- **`before_agent_run`** - モデル送信前に最終プロンプトとセッションメッセージを検査し、任意で実行をブロックする
- **`before_agent_reply`** - 合成返信または沈黙でモデルターンを短絡する
- **`before_agent_finalize`** - 自然な最終回答を検査し、もう 1 回のモデルパスを要求する
- `agent_end` - 最終メッセージ、成功状態、実行時間を観測する
- `heartbeat_prompt_contribution` - バックグラウンドモニターおよびライフサイクル Plugin 向けに Heartbeat 専用コンテキストを追加する

**会話の観測**

- `model_call_started` / `model_call_ended` - プロンプトや応答内容なしで、サニタイズされたプロバイダー/モデル呼び出しメタデータ、タイミング、結果、境界付きのリクエスト ID ハッシュを観測する
- `llm_input` - プロバイダー入力（システムプロンプト、プロンプト、履歴）を観測する
- `llm_output` - プロバイダー出力を観測する

**ツール**

- **`before_tool_call`** - ツールパラメーターを書き換える、実行をブロックする、または承認を要求する
- `after_tool_call` - ツール結果、エラー、時間を観測する
- **`tool_result_persist`** - ツール結果から生成されるアシスタントメッセージを書き換える
- **`before_message_write`** - 進行中のメッセージ書き込みを検査またはブロックする（まれ）

**メッセージと配信**

- **`inbound_claim`** - エージェントルーティング前に受信メッセージを要求する（合成返信）
- `message_received` - 受信内容、送信者、スレッド、メタデータを観測する
- **`message_sending`** - 送信内容を書き換える、または配信をキャンセルする
- `message_sent` - 送信配信の成功または失敗を観測する
- **`before_dispatch`** - チャンネル引き渡し前に送信ディスパッチを検査または書き換える
- **`reply_dispatch`** - 最終返信ディスパッチパイプラインに参加する

**セッションと Compaction**

- `session_start` / `session_end` - セッションライフサイクル境界を追跡する
- `before_compaction` / `after_compaction` - Compaction サイクルを観測または注釈する
- `before_reset` - セッションリセットイベント（`/reset`、プログラムによるリセット）を観測する

**サブエージェント**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - サブエージェントのルーティングと完了配信を調整する

**ライフサイクル**

- `gateway_start` / `gateway_stop` - Gateway とともに Plugin 所有のサービスを開始または停止する
- `cron_changed` - Gateway 所有の Cron ライフサイクル変更（追加、更新、削除、開始、完了、スケジュール）を観測する
- **`before_install`** - Skills または Plugin インストールスキャンを検査し、任意でブロックする

## ツール呼び出しポリシー

`before_tool_call` は次を受け取ります。

- `event.toolName`
- `event.params`
- 任意の `event.derivedPaths`。`apply_patch` などのよく知られたツールエンベロープについて、ホストから導出された対象パスのベストエフォートなヒントを含みます。存在する場合、これらのパスは不完全なことや、ツールが実際に触れる内容を過大近似することがあります（たとえば、不正形式または部分的な入力の場合）
- 任意の `event.runId`
- 任意の `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（Cron 駆動の実行で設定）、診断用 `ctx.trace` などのコンテキストフィールド

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

- `block: true` は終端であり、低優先度のハンドラーをスキップします。
- `block: false` は判断なしとして扱われます。
- `params` は実行用のツールパラメーターを書き換えます。
- `requireApproval` はエージェント実行を一時停止し、Plugin 承認を通じてユーザーに確認します。`/approve` コマンドは exec 承認と Plugin 承認の両方を承認できます。
- 高優先度のフックが承認を要求した後でも、低優先度の `block: true` がブロックできます。
- `onResolution` は、解決された承認判断（`allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled`）を受け取ります。

ホストレベルのポリシーを必要とするバンドル済み Plugin は、`api.registerTrustedToolPolicy(...)` で信頼済みツールポリシーを登録できます。これらは通常の `before_tool_call` フックおよび外部 Plugin の判断より前に実行されます。ワークスペースポリシー、予算適用、予約済みワークフローの安全性など、ホストが信頼するゲートにのみ使用してください。外部 Plugin は通常の `before_tool_call` フックを使用するべきです。

### ツール結果の永続化

ツール結果には、UI レンダリング、診断、メディアルーティング、または Plugin 所有メタデータ向けの構造化された `details` を含めることができます。`details` はプロンプト内容ではなく、ランタイムメタデータとして扱ってください。

- OpenClaw は、メタデータがモデルコンテキストにならないように、プロバイダー再生および Compaction 入力の前に `toolResult.details` を取り除きます。
- 永続化されたセッションエントリは、境界付きの `details` のみを保持します。大きすぎる details はコンパクトな要約と `persistedDetailsTruncated: true` に置き換えられます。
- `tool_result_persist` と `before_message_write` は最終的な永続化上限の前に実行されます。それでもフックは、返す `details` を小さく保ち、プロンプトに関連するテキストを `details` のみに置くことを避けるべきです。モデルから見えるツール出力は `content` に入れてください。

## プロンプトとモデルフック

新しい Plugin にはフェーズ固有のフックを使用します。

- `before_model_resolve`: 現在のプロンプトと添付メタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在のプロンプト、準備済みセッションメッセージ、このセッション向けにドレインされた exactly-once のキュー済み注入を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在のプロンプトとセッションメッセージを受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: Heartbeat ターンでのみ実行され、`prependContext` または `appendContext` を返します。ユーザー起点のターンを変更せずに現在の状態を要約する必要があるバックグラウンドモニター向けです。

`before_agent_start` は互換性のために残っています。Plugin がレガシーな結合フェーズに依存しないように、上記の明示的なフックを優先してください。

`before_agent_run` は、プロンプト構築後、かつプロンプトローカルの画像読み込みや `llm_input` 観測を含むあらゆるモデル入力の前に実行されます。現在のユーザー入力を `prompt` として受け取り、読み込まれたセッション履歴を `messages` に、アクティブなシステムプロンプトも受け取ります。モデルがプロンプトを読めるようになる前に実行を停止するには、`{ outcome: "block", reason, message? }` を返します。`reason` は内部用で、`message` はユーザー向けの置換です。サポートされる結果は `pass` と `block` のみです。サポートされていない判断形状はフェイルクローズします。

実行がブロックされると、OpenClaw は `message.content` 内の置換テキストと、ブロックした Plugin ID やタイムスタンプなどの非機密ブロックメタデータのみを保存します。元のユーザーテキストは、トランスクリプトや将来のコンテキストには保持されません。内部ブロック理由は機密として扱われ、トランスクリプト、履歴、ブロードキャスト、ログ、診断ペイロードから除外されます。可観測性では、ブロッカー ID、結果、タイムスタンプ、安全なカテゴリなどのサニタイズ済みフィールドを使用するべきです。

`before_agent_start` と `agent_end` には、OpenClaw がアクティブな実行を識別できる場合に `event.runId` が含まれます。同じ値は `ctx.runId` でも利用できます。Cron 駆動の実行では、`ctx.jobId`（発生元の Cron ジョブ ID）も公開されるため、Plugin フックはメトリクス、副作用、または状態を特定のスケジュール済みジョブにスコープできます。

チャンネル由来の実行では、`ctx.messageProvider` は `discord` や `telegram` などのプロバイダー面であり、`ctx.channelId` は OpenClaw がセッションキーまたは配信メタデータから導出できる場合の会話対象識別子です。

`agent_end` は観測フックであり、ターン後に fire-and-forget で実行されます。フックランナーは 30 秒のタイムアウトを適用するため、停止した Plugin や埋め込みエンドポイントがフック Promise を永遠に保留したままにすることはできません。タイムアウトはログに記録され、OpenClaw は継続します。ただし、Plugin が独自の中止シグナルも使用していない限り、Plugin 所有のネットワーク処理はキャンセルされません。

生のプロンプト、履歴、応答、ヘッダー、リクエスト本文、またはプロバイダーリクエスト ID を受け取るべきでないプロバイダー呼び出しテレメトリには、`model_call_started` と `model_call_ended` を使用します。これらのフックには、`runId`、`callId`、`provider`、`model`、任意の `api`/`transport`、終端の `durationMs`/`outcome`、OpenClaw が境界付きのプロバイダーリクエスト ID ハッシュを導出できる場合の `upstreamRequestIdHash` などの安定したメタデータが含まれます。

`before_agent_finalize` は、ハーネスが自然な最終アシスタント回答を受け入れようとしている場合にのみ実行されます。これは `/stop` のキャンセルパスではなく、ユーザーがターンを中止した場合には実行されません。確定前にもう 1 回モデルパスを行うようハーネスに依頼するには `{ action: "revise", reason }` を返し、確定を強制するには `{ action:
"finalize", reason? }` を返します。続行するには結果を省略します。Codex ネイティブの `Stop` フックは、このフックに OpenClaw の
`before_agent_finalize` 判断として中継されます。

`action: "revise"` を返す場合、Plugin は `retry` メタデータを含めることで、追加のモデルパスを境界付きかつ再実行しても安全なものにできます。

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` は、ハーネスに送信される修正理由に追加されます。
`idempotencyKey` により、ホストは同等の確定判断をまたいで同じ Plugin リクエストのリトライ回数を数えられます。また、`maxAttempts` は、自然な最終回答で続行する前にホストが許可する追加パスの回数に上限を設けます。

生の会話フック（`before_model_resolve`、
`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、
`agent_end`、または `before_agent_run`）を必要とする非バンドル Plugin は、次を設定する必要があります。

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

プロンプトを変更するフックと永続的な次ターン注入は、Plugin ごとに
`plugins.entries.<id>.hooks.allowPromptInjection=false` で無効化できます。

### セッション拡張と次ターン注入

ワークフロー Plugin は、`api.registerSessionExtension(...)` を使って小さな JSON 互換のセッション状態を永続化し、Gateway の
`sessions.pluginPatch` メソッドを通じて更新できます。セッション行は、登録された拡張状態を
`pluginExtensions` を通じて投影し、Control UI や他のクライアントが Plugin の内部を知らなくても Plugin 所有のステータスをレンダリングできるようにします。

Plugin が、次のモデルターンに正確に 1 回だけ到達する永続的なコンテキストを必要とする場合は、`api.enqueueNextTurnInjection(...)` を使用します。OpenClaw は、プロンプトフックの前にキューに入った注入を排出し、期限切れの注入を破棄し、Plugin ごとに `idempotencyKey` で重複排除します。これは、承認の再開、ポリシー要約、バックグラウンド監視の差分、コマンド継続など、次のターンでモデルに見えるべきだが永続的なシステムプロンプトテキストにはすべきでないものに適した継ぎ目です。

クリーンアップのセマンティクスは契約の一部です。セッション拡張のクリーンアップとランタイムライフサイクルのクリーンアップコールバックは、`reset`、`delete`、`disable`、または
`restart` を受け取ります。ホストは、reset/delete/disable の場合に、所有 Plugin の永続セッション拡張状態と保留中の次ターン注入を削除します。restart では永続セッション状態を保持しつつ、クリーンアップコールバックにより Plugin は古いランタイム世代のスケジューラージョブ、実行コンテキスト、その他のアウトオブバンドリソースを解放できます。

## メッセージフック

チャネルレベルのルーティングと配信ポリシーには、メッセージフックを使用します。

- `message_received`: 受信コンテンツ、送信者、`threadId`、`messageId`、
  `senderId`、任意の実行/セッション相関、メタデータを観察します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を観察します。

音声のみの TTS 返信では、チャネルペイロードに表示されるテキスト/キャプションがない場合でも、`content` に非表示の読み上げトランスクリプトが含まれることがあります。その
`content` を書き換えると、フックから見えるトランスクリプトのみが更新されます。メディアキャプションとしてはレンダリングされません。

メッセージフックコンテキストは、利用可能な場合に安定した相関フィールドを公開します。
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、`ctx.callDepth` です。レガシーメタデータを読む前に、これらのファーストクラスフィールドを優先してください。

チャネル固有のメタデータを使用する前に、型付きの `threadId` と `replyToId` フィールドを優先してください。

判断ルール:

- `cancel: true` を伴う `message_sending` は終端です。
- `cancel: false` を伴う `message_sending` は、判断なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、より低い優先度のフックへ続行されます。
- `message_sending` は、キャンセル時に `cancelReason` と境界付きの `metadata` を返せます。新しいメッセージライフサイクル API は、これを理由 `cancelled_by_message_sending_hook` の抑制された配信結果として公開します。レガシーの直接配信は、互換性のために空の結果配列を返し続けます。
- `message_sent` は観察専用です。ハンドラーの失敗はログに記録され、配信結果は変更されません。

## インストールフック

`before_install` は、Skill と Plugin のインストールに対する組み込みスキャンの後に実行されます。追加の検出結果、またはインストールを停止するための `{ block: true, blockReason }` を返します。

`block: true` は終端です。`block: false` は判断なしとして扱われます。

## Gateway ライフサイクル

Gateway 所有の状態を必要とする Plugin サービスには `gateway_start` を使用します。コンテキストは、cron の検査と更新用に `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を公開します。長時間実行されるリソースをクリーンアップするには `gateway_stop` を使用します。

Plugin 所有のランタイムサービスで内部の `gateway:startup` フックに依存しないでください。

`cron_changed` は、Gateway 所有の cron ライフサイクルイベントに対して、`added`、`updated`、`removed`、`started`、`finished`、
`scheduled` の理由をカバーする型付きイベントペイロードで発火します。このイベントは、`PluginHookGatewayCronJob` スナップショット（存在する場合は `state.nextRunAtMs`、`state.lastRunStatus`、`state.lastError` を含む）に加え、`not-requested` | `delivered` | `not-delivered` | `unknown` の `PluginHookGatewayCronDeliveryStatus` を運びます。削除イベントでも削除されたジョブのスナップショットを運ぶため、外部スケジューラーは状態を照合できます。外部のウェイクスケジューラーを同期する場合は、ランタイムコンテキストの `ctx.getCron?.()` と `ctx.config` を使用し、期限チェックと実行については OpenClaw を信頼できる唯一の情報源にしてください。

## 今後の非推奨

フック周辺の一部サーフェスは非推奨ですが、引き続きサポートされています。次のメジャーリリース前に移行してください。

- `inbound_claim` および `message_received` ハンドラー内の **プレーンテキストのチャネルエンベロープ**。フラットなエンベロープテキストを解析するのではなく、`BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。詳しくは
  [プレーンテキストのチャネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。
- **`before_agent_start`** は互換性のために残っています。新しい Plugin は、結合されたフェーズの代わりに
  `before_model_resolve` と `before_prompt_build` を使用してください。
- **`before_tool_call` の `onResolution`** は、自由形式の `string` ではなく、型付きの
  `PluginApprovalResolution` ユニオン（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`）を使用するようになりました。

完全なリスト（メモリ機能登録、プロバイダー思考プロファイル、外部認証プロバイダー、プロバイダー検出型、タスクランタイムアクセサー、`command-auth` → `command-status` の名前変更）については、
[Plugin SDK 移行 → アクティブな非推奨](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK 移行](/ja-JP/plugins/sdk-migration) - アクティブな非推奨と削除タイムライン
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部フック](/ja-JP/automation/hooks)
- [Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)
