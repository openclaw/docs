---
read_when:
    - before_tool_call、before_agent_reply、メッセージフック、またはライフサイクルフックが必要な Plugin を構築している場合
    - Plugin からのツール呼び出しをブロック、書き換え、または承認必須にする必要があります
    - 内部フックとPlugin フックのどちらを使うかを判断している
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、Gateway のライフサイクルイベントをインターセプトする'
title: Plugin フック
x-i18n:
    generated_at: "2026-04-30T05:25:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin フックは、OpenClaw Plugin のインプロセス拡張ポイントです。Plugin がエージェント実行、ツール呼び出し、メッセージフロー、セッションライフサイクル、サブエージェントのルーティング、インストール、または Gateway 起動を検査または変更する必要がある場合に使用します。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` などのコマンドや Gateway イベントに対して、オペレーターがインストールする小さな `HOOK.md` スクリプトが必要な場合は、代わりに [内部フック](/ja-JP/automation/hooks) を使用します。

## クイックスタート

Plugin エントリから `api.on(...)` を使って、型付き Plugin フックを登録します。

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

`api.on(name, handler, opts?)` は以下を受け取ります。

- `priority` — ハンドラーの順序付け（高いほど先に実行）。
- `timeoutMs` — 任意のフック単位の予算。設定すると、フックランナーは予算が経過した後にそのハンドラーを中止し、次のハンドラーに進みます。遅いセットアップやリコール処理が、呼び出し元に設定されたモデルタイムアウトを消費しないようにするためです。省略すると、フックランナーが汎用的に適用する既定の監視/判断タイムアウトを使用します。

各フックは、そのハンドラーを登録した Plugin の解決済み設定である `event.context.pluginConfig` を受け取ります。現在の Plugin オプションを必要とするフック判断に使用します。OpenClaw は、他の Plugin が見る共有イベントオブジェクトを変更せずに、ハンドラーごとにこれを注入します。

## フックカタログ

フックは、拡張する対象面ごとにグループ化されています。**太字**の名前は判断結果（ブロック、キャンセル、上書き、または承認要求）を受け取ります。それ以外はすべて監視のみです。

**エージェントターン**

- `before_model_resolve` — セッションメッセージの読み込み前にプロバイダーまたはモデルを上書きします
- `agent_turn_prepare` — キュー済みの Plugin ターン注入を消費し、プロンプトフックの前に同一ターンのコンテキストを追加します
- `before_prompt_build` — モデル呼び出し前に動的コンテキストまたはシステムプロンプトテキストを追加します
- `before_agent_start` — 互換性専用の統合フェーズです。上の 2 つのフックを優先してください
- **`before_agent_reply`** — 合成返信または沈黙でモデルターンを短絡します
- **`before_agent_finalize`** — 自然な最終回答を検査し、もう 1 回モデルパスを要求します
- `agent_end` — 最終メッセージ、成功状態、実行時間を監視します
- `heartbeat_prompt_contribution` — バックグラウンドモニターとライフサイクル Plugin のために、Heartbeat 専用コンテキストを追加します

**会話の監視**

- `model_call_started` / `model_call_ended` — プロンプトやレスポンス本文なしで、サニタイズ済みのプロバイダー/モデル呼び出しメタデータ、タイミング、結果、境界付きリクエスト ID ハッシュを監視します
- `llm_input` — プロバイダー入力（システムプロンプト、プロンプト、履歴）を監視します
- `llm_output` — プロバイダー出力を監視します

**ツール**

- **`before_tool_call`** — ツールパラメーターを書き換え、実行をブロックし、または承認を要求します
- `after_tool_call` — ツール結果、エラー、実行時間を監視します
- **`tool_result_persist`** — ツール結果から生成されるアシスタントメッセージを書き換えます
- **`before_message_write`** — 進行中のメッセージ書き込みを検査またはブロックします（まれ）

**メッセージと配信**

- **`inbound_claim`** — エージェントのルーティング前に受信メッセージを要求します（合成返信）
- `message_received` — 受信コンテンツ、送信者、スレッド、メタデータを監視します
- **`message_sending`** — 送信コンテンツを書き換えるか、配信をキャンセルします
- `message_sent` — 送信配信の成功または失敗を監視します
- **`before_dispatch`** — チャネルへの引き渡し前に送信ディスパッチを検査または書き換えます
- **`reply_dispatch`** — 最終返信ディスパッチパイプラインに参加します

**セッションと Compaction**

- `session_start` / `session_end` — セッションライフサイクルの境界を追跡します
- `before_compaction` / `after_compaction` — Compaction サイクルを監視または注釈します
- `before_reset` — セッションリセットイベント（`/reset`、プログラムによるリセット）を監視します

**サブエージェント**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — サブエージェントのルーティングと完了配信を調整します

**ライフサイクル**

- `gateway_start` / `gateway_stop` — Gateway とともに、Plugin 所有のサービスを開始または停止します
- `cron_changed` — Gateway 所有の Cron ライフサイクル変更（追加、更新、削除、開始、完了、スケジュール）を監視します
- **`before_install`** — Skills または Plugin のインストールスキャンを検査し、必要に応じてブロックします

## ツール呼び出しポリシー

`before_tool_call` は以下を受け取ります。

- `event.toolName`
- `event.params`
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
- `params` は、実行用のツールパラメーターを書き換えます。
- `requireApproval` はエージェント実行を一時停止し、Plugin 承認を通じてユーザーに確認します。`/approve` コマンドは exec と Plugin 承認の両方を承認できます。
- 高優先度のフックが承認を要求した後でも、低優先度の `block: true` はブロックできます。
- `onResolution` は解決済みの承認判断（`allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled`）を受け取ります。

ホストレベルのポリシーを必要とする同梱 Plugin は、`api.registerTrustedToolPolicy(...)` で信頼済みツールポリシーを登録できます。これらは通常の `before_tool_call` フックより前、外部 Plugin の判断より前に実行されます。ワークスペースポリシー、予算強制、予約済みワークフローの安全性など、ホストが信頼するゲートにのみ使用します。外部 Plugin は通常の `before_tool_call` フックを使用してください。

### ツール結果の永続化

ツール結果には、UI レンダリング、診断、メディアルーティング、または Plugin 所有メタデータ用の構造化された `details` を含めることができます。`details` はプロンプトコンテンツではなく、ランタイムメタデータとして扱います。

- OpenClaw は、メタデータがモデルコンテキストにならないように、プロバイダーの再生と Compaction 入力の前に `toolResult.details` を取り除きます。
- 永続化されたセッションエントリは、境界付きの `details` のみを保持します。大きすぎる details は、コンパクトな要約と `persistedDetailsTruncated: true` に置き換えられます。
- `tool_result_persist` と `before_message_write` は、最終的な永続化上限の前に実行されます。それでもフックは、返す `details` を小さく保ち、プロンプトに関係するテキストを `details` のみに置くことを避けるべきです。モデルから見えるツール出力は `content` に入れてください。

## プロンプトとモデルのフック

新しい Plugin には、フェーズ固有のフックを使用します。

- `before_model_resolve`: 現在のプロンプトと添付メタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在のプロンプト、準備済みセッションメッセージ、このセッションのために排出された一度だけのキュー済み注入を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在のプロンプトとセッションメッセージを受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: Heartbeat ターンでのみ実行され、`prependContext` または `appendContext` を返します。ユーザーが開始したターンを変更せずに現在状態を要約する必要があるバックグラウンドモニター向けです。

`before_agent_start` は互換性のために残っています。Plugin がレガシーな統合フェーズに依存しないように、上の明示的なフックを優先してください。

`before_agent_start` と `agent_end` には、OpenClaw がアクティブな実行を識別できる場合に `event.runId` が含まれます。同じ値は `ctx.runId` でも利用できます。Cron 駆動の実行では `ctx.jobId`（元の Cron ジョブ ID）も公開されるため、Plugin フックはメトリクス、副作用、または状態を特定のスケジュール済みジョブにスコープできます。

`agent_end` は監視フックであり、ターン後に fire-and-forget で実行されます。Plugin や埋め込みエンドポイントが固まってフックの Promise を永久に保留にしないように、フックランナーは 30 秒のタイムアウトを適用します。タイムアウトはログに記録され、OpenClaw は続行します。Plugin が独自の abort signal も使用していない限り、Plugin 所有のネットワーク処理はキャンセルされません。

生のプロンプト、履歴、レスポンス、ヘッダー、リクエスト本文、またはプロバイダーのリクエスト ID を受け取るべきではないプロバイダー呼び出しテレメトリには、`model_call_started` と `model_call_ended` を使用します。これらのフックには、`runId`、`callId`、`provider`、`model`、任意の `api`/`transport`、終端の `durationMs`/`outcome`、OpenClaw が境界付きプロバイダーリクエスト ID ハッシュを導出できる場合の `upstreamRequestIdHash` などの安定したメタデータが含まれます。

`before_agent_finalize` は、ハーネスが自然な最終アシスタント回答を受け入れようとしている場合にのみ実行されます。これは `/stop` キャンセルパスではなく、ユーザーがターンを中止した場合には実行されません。最終化前にもう 1 回モデルパスを求めるには `{ action: "revise", reason }` を返し、最終化を強制するには `{ action: "finalize", reason? }` を返します。結果を省略すると続行します。Codex ネイティブの `Stop` フックは、OpenClaw の `before_agent_finalize` 判断としてこのフックに中継されます。

`llm_input`、`llm_output`、`before_agent_finalize`、または `agent_end` を必要とする非同梱 Plugin は、以下を設定する必要があります。

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

ワークフロー Plugin は、`api.registerSessionExtension(...)` で小さな JSON 互換セッション状態を永続化し、Gateway の `sessions.pluginPatch` メソッドを通じて更新できます。セッション行は登録済み拡張状態を `pluginExtensions` を通じて投影し、Control UI やその他のクライアントが Plugin 内部を知らずに Plugin 所有の状態をレンダリングできるようにします。

Plugin が、次のモデルターンへ一度だけ到達する永続的コンテキストを必要とする場合は、`api.enqueueNextTurnInjection(...)` を使用します。OpenClaw はプロンプトフックの前にキュー済み注入を排出し、期限切れの注入を破棄し、Plugin ごとに `idempotencyKey` で重複排除します。これは、承認の再開、ポリシー要約、バックグラウンドモニターの差分、次のターンでモデルに見えるべきだが恒久的なシステムプロンプトテキストになるべきではないコマンド継続に適した継ぎ目です。

クリーンアップのセマンティクスは契約の一部です。セッション拡張のクリーンアップとランタイムライフサイクルのクリーンアップコールバックは、`reset`、`delete`、`disable`、または `restart` を受け取ります。ホストは reset/delete/disable に対して、所有 Plugin の永続的なセッション拡張状態と保留中の次ターン注入を削除します。restart では永続的なセッション状態を維持しつつ、クリーンアップコールバックによって Plugin が古いランタイム世代のスケジューラージョブ、実行コンテキスト、その他の帯域外リソースを解放できます。

## メッセージフック

チャネルレベルのルーティングと配信ポリシーには、メッセージフックを使用します。

- `message_received`: 受信コンテンツ、送信者、`threadId`、`messageId`、`senderId`、任意の実行/セッション相関、メタデータを監視します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を監視します。

音声のみの TTS 返信では、チャネルペイロードに表示可能なテキストやキャプションがない場合でも、`content` に非表示の音声文字起こしが含まれることがあります。その `content` を書き換えても、フックから見える文字起こしだけが更新されます。メディアキャプションとしては表示されません。

メッセージフックコンテキストは、利用可能な場合に安定した相関フィールドを公開します:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, and `ctx.callDepth`。従来のメタデータを読む前に、これらの第一級フィールドを優先してください。

チャネル固有のメタデータを使う前に、型付きの `threadId` と `replyToId` フィールドを優先してください。

判断ルール:

- `message_sending` で `cancel: true` の場合は終端です。
- `message_sending` で `cancel: false` の場合は判断なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、優先度の低いフックへ引き続き渡されます。

## インストールフック

`before_install` は、Skills と Plugin のインストールに対する組み込みスキャンの後に実行されます。追加の検出結果、またはインストールを停止する `{ block: true, blockReason }` を返します。

`block: true` は終端です。`block: false` は判断なしとして扱われます。

## Gateway ライフサイクル

Gateway が所有する状態を必要とする Plugin サービスには `gateway_start` を使用します。コンテキストは、Cron の検査と更新のために `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を公開します。長時間実行されるリソースをクリーンアップするには `gateway_stop` を使用します。

Plugin が所有するランタイムサービスで内部の `gateway:startup` フックに依存しないでください。

`cron_changed` は、Gateway が所有する Cron ライフサイクルイベントに対して発火し、`added`、`updated`、`removed`、`started`、`finished`、`scheduled` の理由を網羅する型付きイベントペイロードを伴います。このイベントには、`PluginHookGatewayCronJob` スナップショット（存在する場合は `state.nextRunAtMs`、`state.lastRunStatus`、`state.lastError` を含む）と、`not-requested` | `delivered` | `not-delivered` | `unknown` の `PluginHookGatewayCronDeliveryStatus` が含まれます。削除イベントでも、外部スケジューラが状態を照合できるよう、削除されたジョブのスナップショットを引き続き含みます。外部のウェイクスケジューラを同期するときは、ランタイムコンテキストの `ctx.getCron?.()` と `ctx.config` を使用し、期限チェックと実行については OpenClaw を信頼できる情報源として維持してください。

## 今後の非推奨

フックに隣接するいくつかのサーフェスは非推奨ですが、まだサポートされています。次のメジャーリリースまでに移行してください:

- `inbound_claim` と `message_received` ハンドラの **平文チャネルエンベロープ**。平坦なエンベロープテキストを解析する代わりに、`BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。詳しくは [平文チャネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。
- **`before_agent_start`** は互換性のために残っています。新しい Plugin は、結合されたフェーズの代わりに `before_model_resolve` と `before_prompt_build` を使用してください。
- **`before_tool_call` の `onResolution`** は、自由形式の `string` ではなく、型付きの `PluginApprovalResolution` union（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`）を使用するようになりました。

完全な一覧（メモリ機能登録、プロバイダ thinking プロファイル、外部認証プロバイダ、プロバイダ検出型、タスクランタイムアクセサ、`command-auth` → `command-status` の名前変更）については、[Plugin SDK 移行 → 有効な非推奨](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK 移行](/ja-JP/plugins/sdk-migration) — 有効な非推奨と削除タイムライン
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部フック](/ja-JP/automation/hooks)
- [Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)
