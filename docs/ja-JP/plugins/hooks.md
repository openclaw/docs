---
read_when:
    - before_tool_call、before_agent_reply、メッセージフック、またはライフサイクルフックが必要なPluginを構築している
    - Plugin からのツール呼び出しをブロック、書き換え、または承認を必須にする必要がある
    - 内部フックと Plugin フックのどちらを使うかを決める
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、Gateway のライフサイクルイベントをインターセプトする'
title: Plugin フック
x-i18n:
    generated_at: "2026-05-11T20:34:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin フックは、OpenClaw plugins のインプロセス拡張ポイントです。plugin がエージェント実行、ツール呼び出し、メッセージフロー、セッションライフサイクル、サブエージェントルーティング、インストール、または Gateway 起動を検査または変更する必要がある場合に使用します。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` などのコマンドおよび Gateway イベント向けに、オペレーターがインストールする小さな `HOOK.md` スクリプトが必要な場合は、代わりに [内部フック](/ja-JP/automation/hooks) を使用します。

## クイックスタート

plugin エントリから `api.on(...)` で型付き plugin フックを登録します。

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

フックハンドラーは `priority` の降順で順次実行されます。同じ優先度のフックは登録順を保ちます。

`api.on(name, handler, opts?)` は以下を受け取ります。

- `priority` - ハンドラーの順序（高いほど先に実行）。
- `timeoutMs` - フックごとの任意の予算。設定すると、フックランナーは予算経過後にそのハンドラーを中断し、次のハンドラーへ進みます。遅いセットアップやリコール処理が呼び出し元に設定されたモデルタイムアウトを消費し続けることを防ぎます。省略すると、フックランナーが汎用的に適用するデフォルトの観測/判断タイムアウトを使用します。

オペレーターは plugin コードにパッチを当てずにフック予算を設定することもできます。

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

`hooks.timeouts.<hookName>` は `hooks.timeoutMs` を上書きし、`hooks.timeoutMs` は plugin が作成した `api.on(..., { timeoutMs })` 値を上書きします。設定値はそれぞれ、600000 ミリ秒以下の正の整数である必要があります。低速であることが分かっているフックにはフック単位の上書きを優先し、1 つの plugin があらゆる場所で長い予算を得ないようにします。

各フックは `event.context.pluginConfig` を受け取ります。これは、そのハンドラーを登録した plugin の解決済み設定です。現在の plugin オプションを必要とするフック判断に使用します。OpenClaw は、他の plugins が見る共有イベントオブジェクトを変更せずに、ハンドラーごとにこれを注入します。

## フックカタログ

フックは拡張するサーフェスごとにグループ化されています。**太字**の名前は判断結果（ブロック、キャンセル、上書き、または承認要求）を受け取ります。それ以外はすべて観測専用です。

**エージェントターン**

- `before_model_resolve` - セッションメッセージが読み込まれる前にプロバイダーまたはモデルを上書きします
- `agent_turn_prepare` - キュー済みの plugin ターン注入を消費し、プロンプトフックの前に同一ターンのコンテキストを追加します
- `before_prompt_build` - モデル呼び出しの前に動的コンテキストまたはシステムプロンプトテキストを追加します
- `before_agent_start` - 互換性専用の結合フェーズです。上記 2 つのフックを優先してください
- **`before_agent_run`** - モデル送信前に最終プロンプトとセッションメッセージを検査し、必要に応じて実行をブロックします
- **`before_agent_reply`** - 合成返信または沈黙でモデルターンを短絡します
- **`before_agent_finalize`** - 自然な最終回答を検査し、もう 1 回のモデルパスを要求します
- `agent_end` - 最終メッセージ、成功状態、実行時間を観測します
- `heartbeat_prompt_contribution` - バックグラウンドモニターおよびライフサイクル plugins 向けに、Heartbeat 専用コンテキストを追加します

**会話の観測**

- `model_call_started` / `model_call_ended` - プロンプトやレスポンス内容なしで、サニタイズされたプロバイダー/モデル呼び出しメタデータ、タイミング、結果、境界付きリクエスト ID ハッシュを観測します
- `llm_input` - プロバイダー入力（システムプロンプト、プロンプト、履歴）を観測します
- `llm_output` - プロバイダー出力を観測します

**ツール**

- **`before_tool_call`** - ツールパラメーターを書き換え、実行をブロックし、または承認を要求します
- `after_tool_call` - ツール結果、エラー、所要時間を観測します
- **`tool_result_persist`** - ツール結果から生成されたアシスタントメッセージを書き換えます
- **`before_message_write`** - 進行中のメッセージ書き込みを検査またはブロックします（まれ）

**メッセージと配信**

- **`inbound_claim`** - エージェントルーティング前に受信メッセージを要求します（合成返信）
- `message_received` - 受信内容、送信者、スレッド、メタデータを観測します
- **`message_sending`** - 送信内容を書き換える、または配信をキャンセルします
- `message_sent` - 送信配信の成功または失敗を観測します
- **`before_dispatch`** - チャネル引き渡し前に送信ディスパッチを検査または書き換えます
- **`reply_dispatch`** - 最終返信ディスパッチパイプラインに参加します

**セッションと Compaction**

- `session_start` / `session_end` - セッションライフサイクル境界を追跡します。イベントの `reason` は、`new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart`、または `unknown` のいずれかです。`shutdown` と `restart` の値は、セッションがまだアクティブな状態でプロセスが停止または再起動された場合に、gateway シャットダウンファイナライザーから発火します。これにより、メモリやトランスクリプトストアなどの下流 plugins は、再起動をまたいで開いた状態のまま残るはずだったゴースト行を確定できます。低速な plugin が SIGTERM/SIGINT をブロックできないよう、ファイナライザーには境界があります。
- `before_compaction` / `after_compaction` - Compaction サイクルを観測または注釈付けします
- `before_reset` - セッションリセットイベント（`/reset`、プログラムによるリセット）を観測します

**サブエージェント**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - サブエージェントルーティングと完了配信を調整します

**ライフサイクル**

- `gateway_start` / `gateway_stop` - Gateway とともに plugin 所有サービスを開始または停止します
- `cron_changed` - gateway 所有の Cron ライフサイクル変更（追加、更新、削除、開始、終了、スケジュール）を観測します
- **`before_install`** - skill または plugin のインストールスキャンを検査し、必要に応じてブロックします

## ツール呼び出しポリシー

`before_tool_call` は以下を受け取ります。

- `event.toolName`
- `event.params`
- 任意の `event.derivedPaths`。`apply_patch` などのよく知られたツールエンベロープについて、ホストがベストエフォートで導出した対象パスのヒントを含みます。存在する場合、これらのパスは不完全な場合や、ツールが実際に触れる範囲を過大に近似している場合があります（たとえば、不正な形式または部分的な入力の場合）
- 任意の `event.runId`
- 任意の `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（Cron 駆動の実行で設定）、診断用の `ctx.trace` などのコンテキストフィールド

以下を返すことができます。

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
- `requireApproval` はエージェント実行を一時停止し、plugin 承認を通じてユーザーに確認します。`/approve` コマンドは exec と plugin 承認の両方を承認できます。
- 高優先度のフックが承認を要求した後でも、低優先度の `block: true` は引き続きブロックできます。
- `onResolution` は解決済みの承認判断（`allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled`）を受け取ります。

ホストレベルのポリシーが必要なバンドル plugins は、`api.registerTrustedToolPolicy(...)` で信頼済みツールポリシーを登録できます。これらは通常の `before_tool_call` フックより前、また外部 plugin の判断より前に実行されます。ワークスペースポリシー、予算強制、予約済みワークフロー安全性など、ホストが信頼するゲートにのみ使用します。外部 plugins は通常の `before_tool_call` フックを使用してください。

### ツール結果の永続化

ツール結果には、UI レンダリング、診断、メディアルーティング、または plugin 所有メタデータ向けの構造化された `details` を含めることができます。`details` はプロンプト内容ではなくランタイムメタデータとして扱います。

- OpenClaw は、メタデータがモデルコンテキストにならないように、プロバイダー再生および Compaction 入力の前に `toolResult.details` を取り除きます。
- 永続化されたセッションエントリは、境界付きの `details` のみを保持します。大きすぎる details はコンパクトな要約と `persistedDetailsTruncated: true` に置き換えられます。
- `tool_result_persist` と `before_message_write` は最終的な永続化上限の前に実行されます。それでもフックは、返す `details` を小さく保ち、プロンプトに関連するテキストを `details` だけに置かないようにするべきです。モデルから見えるツール出力は `content` に入れてください。

## プロンプトとモデルフック

新しい plugins にはフェーズ固有のフックを使用します。

- `before_model_resolve`: 現在のプロンプトと添付メタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在のプロンプト、準備済みセッションメッセージ、このセッションについてドレインされた exactly-once のキュー済み注入を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在のプロンプトとセッションメッセージを受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: Heartbeat ターンでのみ実行され、`prependContext` または `appendContext` を返します。ユーザー起点のターンを変更せずに現在状態を要約する必要があるバックグラウンドモニター向けです。

`before_agent_start` は互換性のために残っています。plugin がレガシーな結合フェーズに依存しないよう、上記の明示的なフックを優先してください。

`before_agent_run` は、プロンプト構築後、かつプロンプトローカル画像読み込みや `llm_input` 観測を含むあらゆるモデル入力の前に実行されます。現在のユーザー入力を `prompt` として受け取り、読み込まれたセッション履歴を `messages` として、アクティブなシステムプロンプトも受け取ります。モデルがプロンプトを読める前に実行を停止するには、`{ outcome: "block", reason, message? }` を返します。`reason` は内部用で、`message` はユーザー向けの置換です。サポートされる結果は `pass` と `block` のみです。サポートされない判断形状はフェイルクローズします。

実行がブロックされると、OpenClaw は `message.content` に置換テキストのみを保存し、ブロックした plugin ID やタイムスタンプなどの非機微なブロックメタデータを加えます。元のユーザーテキストはトランスクリプトや将来のコンテキストに保持されません。内部ブロック理由は機微情報として扱われ、トランスクリプト、履歴、ブロードキャスト、ログ、診断ペイロードから除外されます。可観測性には、ブロッカー ID、結果、タイムスタンプ、安全なカテゴリなどのサニタイズ済みフィールドを使用するべきです。

`before_agent_start` と `agent_end` は、OpenClaw がアクティブな実行を識別できる場合に `event.runId` を含みます。同じ値は `ctx.runId` でも利用できます。Cron 駆動の実行では `ctx.jobId`（元の Cron ジョブ ID）も公開されるため、plugin フックはメトリクス、副作用、状態を特定のスケジュール済みジョブにスコープできます。

チャネル由来の実行では、`ctx.messageProvider` は `discord` や `telegram` などのプロバイダーサーフェスであり、`ctx.channelId` は OpenClaw がセッションキーまたは配信メタデータから導出できる場合の会話ターゲット識別子です。

`agent_end` は観測フックであり、ターン後に fire-and-forget で実行されます。フックランナーは 30 秒のタイムアウトを適用するため、停止した plugin や埋め込みエンドポイントがフック promise を永遠に保留状態にすることはできません。タイムアウトはログ記録され、OpenClaw は続行します。plugin も独自の abort signal を使用していない限り、plugin 所有のネットワーク処理はキャンセルされません。

生のプロンプト、履歴、レスポンス、ヘッダー、リクエスト
ボディ、プロバイダーのリクエスト ID を受け取るべきでないプロバイダー呼び出しテレメトリには、
`model_call_started` と `model_call_ended` を使用します。これらのフックには、
`runId`、`callId`、`provider`、`model`、任意の `api`/`transport`、終端の
`durationMs`/`outcome`、および OpenClaw が境界付きのプロバイダーリクエスト ID ハッシュを導出できる場合の
`upstreamRequestIdHash` など、安定したメタデータが含まれます。

`before_agent_finalize` は、ハーネスが自然な最終アシスタント回答を受け入れようとしている場合にのみ実行されます。
これは `/stop` のキャンセルパスではなく、ユーザーがターンを中断した場合には
実行されません。確定前にもう 1 回モデルパスを実行するようハーネスに求めるには
`{ action: "revise", reason }` を返し、確定を強制するには `{ action:
"finalize", reason? }` を返し、続行するには結果を省略します。
Codex ネイティブの `Stop` フックは、OpenClaw の
`before_agent_finalize` 判定としてこのフックに中継されます。

`action: "revise"` を返す場合、Plugin は追加のモデルパスを境界付きかつリプレイセーフにするために
`retry` メタデータを含めることができます。

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` はハーネスに送られる修正理由に追加されます。
`idempotencyKey` により、ホストは同等の確定判定をまたいで同じ Plugin リクエストの再試行を数えられます。
`maxAttempts` は、自然な最終回答で続行する前にホストが許可する追加パス数の上限を設定します。

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

ワークフロー Plugin は、`api.registerSessionExtension(...)` を使用して小さな JSON 互換のセッション状態を永続化し、
Gateway の `sessions.pluginPatch` メソッドを通じて更新できます。セッション行は、登録された拡張状態を
`pluginExtensions` を通じて投影し、Control UI や他のクライアントが Plugin 内部を知ることなく
Plugin 所有のステータスをレンダリングできるようにします。

Plugin が永続的なコンテキストを次のモデルターンに正確に 1 回到達させる必要がある場合は、
`api.enqueueNextTurnInjection(...)` を使用します。OpenClaw はプロンプトフックの前にキュー済み注入を排出し、
期限切れの注入を破棄し、Plugin ごとに `idempotencyKey` で重複排除します。
これは、承認の再開、ポリシー要約、バックグラウンド監視の差分、次ターンでモデルに見える必要があるが
永続的なシステムプロンプトテキストにすべきでないコマンド継続のための適切な継ぎ目です。

クリーンアップのセマンティクスは契約の一部です。セッション拡張のクリーンアップと
ランタイムライフサイクルのクリーンアップコールバックは、`reset`、`delete`、`disable`、または
`restart` を受け取ります。ホストは reset/delete/disable に対して、所有 Plugin の永続セッション拡張状態と
保留中の次ターン注入を削除します。restart では永続セッション状態を保持しつつ、クリーンアップコールバックにより
Plugin は古いランタイム世代のスケジューラジョブ、実行コンテキスト、その他の帯域外リソースを解放できます。

## メッセージフック

チャネルレベルのルーティングと配信ポリシーには、メッセージフックを使用します。

- `message_received`: 受信コンテンツ、送信者、`threadId`、`messageId`、
  `senderId`、任意の実行/セッション相関、およびメタデータを監視します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を監視します。

音声のみの TTS 返信では、チャネルペイロードに表示テキスト/キャプションがない場合でも、`content` に非表示の読み上げトランスクリプトが含まれることがあります。
その `content` を書き換えても、フックから見えるトランスクリプトだけが更新されます。メディアキャプションとしてはレンダリングされません。

メッセージフックのコンテキストは、利用可能な場合に安定した相関フィールドを公開します。
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、および `ctx.callDepth` です。
レガシーメタデータを読む前に、これらのファーストクラスフィールドを優先してください。

チャネル固有のメタデータを使用する前に、型付きの `threadId` と `replyToId` フィールドを優先してください。

判定ルール:

- `cancel: true` を伴う `message_sending` は終端です。
- `cancel: false` を伴う `message_sending` は、判定なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、低優先度のフックへ続きます。
- `message_sending` は、キャンセルとともに `cancelReason` と境界付きの `metadata` を返せます。
  新しいメッセージライフサイクル API は、これを理由 `cancelled_by_message_sending_hook` の抑止された配信結果として公開します。
  レガシーの直接配信は、互換性のため空の結果配列を返し続けます。
- `message_sent` は監視専用です。ハンドラーの失敗はログに記録され、配信結果は変更されません。

## インストールフック

`before_install` は、Skills と Plugin のインストールに対する組み込みスキャンの後に実行されます。
追加の検出結果、またはインストールを停止するための `{ block: true, blockReason }` を返します。

`block: true` は終端です。`block: false` は判定なしとして扱われます。

## Gateway ライフサイクル

Gateway 所有の状態を必要とする Plugin サービスには、`gateway_start` を使用します。
コンテキストは、cron の検査と更新のために `ctx.config`、`ctx.workspaceDir`、および `ctx.getCron?.()` を公開します。
長時間実行されるリソースをクリーンアップするには、`gateway_stop` を使用します。

Plugin 所有のランタイムサービスに対して、内部の `gateway:startup` フックに依存しないでください。

`cron_changed` は、gateway 所有の cron ライフサイクルイベントに対して発火し、
`added`、`updated`、`removed`、`started`、`finished`、
および `scheduled` の理由をカバーする型付きイベントペイロードを持ちます。イベントは
`PluginHookGatewayCronJob` スナップショット（存在する場合は `state.nextRunAtMs`、`state.lastRunStatus`、および
`state.lastError` を含む）と、`not-requested` | `delivered` | `not-delivered` | `unknown` の
`PluginHookGatewayCronDeliveryStatus` を保持します。削除イベントでも削除されたジョブスナップショットを保持するため、
外部スケジューラは状態を整合できます。外部ウェイクスケジューラを同期する際は、ランタイムコンテキストの
`ctx.getCron?.()` と `ctx.config` を使用し、期限チェックと実行の信頼できる情報源は OpenClaw にしてください。

## 今後の非推奨

いくつかのフック隣接サーフェスは非推奨ですが、引き続きサポートされています。次のメジャーリリース前に移行してください。

- `inbound_claim` および `message_received` ハンドラーの **平文チャネルエンベロープ**。
  フラットなエンベロープテキストを解析する代わりに、`BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。
  [平文チャネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。
- **`before_agent_start`** は互換性のために残っています。新しい Plugin は、結合されたフェーズの代わりに
  `before_model_resolve` と `before_prompt_build` を使用してください。
- **`before_tool_call` の `onResolution`** は、自由形式の `string` ではなく、型付きの
  `PluginApprovalResolution` ユニオン（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`）を使用するようになりました。

完全な一覧（メモリ機能登録、プロバイダーの thinking プロファイル、外部認証プロバイダー、プロバイダー発見型、
タスクランタイムアクセサ、および `command-auth` → `command-status` の名称変更）については、
[Plugin SDK 移行 → アクティブな非推奨](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK 移行](/ja-JP/plugins/sdk-migration) - アクティブな非推奨と削除タイムライン
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部フック](/ja-JP/automation/hooks)
- [Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)
