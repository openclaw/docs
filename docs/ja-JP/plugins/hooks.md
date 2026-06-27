---
read_when:
    - before_tool_call、before_agent_reply、message hooks、または lifecycle hooks が必要な Plugin を構築している
    - Plugin からのツール呼び出しをブロック、書き換え、または承認必須にする必要があります
    - 内部フックとPluginフックのどちらを使うかを判断している
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、Gateway のライフサイクルイベントをインターセプトする'
title: Plugin フック
x-i18n:
    generated_at: "2026-06-27T12:16:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin フックは、OpenClaw プラグインのインプロセス拡張ポイントです。プラグインがエージェント実行、ツール呼び出し、メッセージフロー、セッションライフサイクル、サブエージェントルーティング、インストール、または Gateway 起動を検査または変更する必要がある場合に使用します。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` などのコマンドや Gateway イベント用に、オペレーターがインストールする小さな `HOOK.md` スクリプトが必要な場合は、代わりに [内部フック](/ja-JP/automation/hooks) を使用します。

## クイックスタート

プラグインエントリから `api.on(...)` で型付き Plugin フックを登録します。

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

- `priority` - ハンドラーの順序付け（大きいほど先に実行）。
- `timeoutMs` - 任意のフックごとの予算。設定すると、フックランナーは予算が経過した後にそのハンドラーを中止し、次のハンドラーに進みます。遅いセットアップやリコール処理が、呼び出し元に設定されたモデルタイムアウトを消費しないようにするためです。省略すると、フックランナーが汎用的に適用するデフォルトの観測/判断タイムアウトが使用されます。

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

`hooks.timeouts.<hookName>` は `hooks.timeoutMs` を上書きし、`hooks.timeoutMs` はプラグイン作成者が指定した `api.on(..., { timeoutMs })` の値を上書きします。設定する各値は、600000 ミリ秒以下の正の整数でなければなりません。1 つのプラグインにあらゆる場所で長い予算を与えないよう、既知の遅いフックにはフックごとの上書きを優先します。

各フックは、そのハンドラーを登録したプラグインの解決済み設定である `event.context.pluginConfig` を受け取ります。現在のプラグインオプションを必要とするフック判断に使用します。OpenClaw は、他のプラグインから見える共有イベントオブジェクトを変更せず、ハンドラーごとにこれを注入します。

## フックカタログ

フックは、拡張するサーフェスごとにグループ化されています。**太字** の名前は判断結果（ブロック、キャンセル、上書き、または承認要求）を受け取ります。それ以外はすべて観測のみです。

**エージェントターン**

- `before_model_resolve` - セッションメッセージの読み込み前にプロバイダーまたはモデルを上書きする
- `agent_turn_prepare` - キューに入ったプラグインのターン注入を消費し、プロンプトフックの前に同一ターンのコンテキストを追加する
- `before_prompt_build` - モデル呼び出しの前に動的コンテキストまたはシステムプロンプトテキストを追加する
- `before_agent_start` - 互換性のみの統合フェーズ。上記 2 つのフックを優先する
- **`before_agent_run`** - モデル送信前に最終プロンプトとセッションメッセージを検査し、任意で実行をブロックする
- **`before_agent_reply`** - 合成返信または無応答でモデルターンを短絡する
- **`before_agent_finalize`** - 通常の最終回答を検査し、モデルパスをもう 1 回要求する
- `agent_end` - 最終メッセージ、成功状態、実行時間を観測する
- `heartbeat_prompt_contribution` - バックグラウンドモニターおよびライフサイクルプラグイン向けに Heartbeat 専用コンテキストを追加する

**会話の観測**

- `model_call_started` / `model_call_ended` - プロンプトや応答内容なしで、サニタイズ済みのプロバイダー/モデル呼び出しメタデータ、タイミング、結果、境界付きリクエスト ID ハッシュを観測する
- `llm_input` - プロバイダー入力（システムプロンプト、プロンプト、履歴）を観測する
- `llm_output` - プロバイダー出力、使用量、利用可能な場合は解決済みの `contextTokenBudget` を観測する

**ツール**

- **`before_tool_call`** - ツールパラメーターを書き換える、実行をブロックする、または承認を要求する
- `after_tool_call` - ツール結果、エラー、実行時間を観測する
- `resolve_exec_env` - プラグイン所有の環境変数を `exec` に提供する
- **`tool_result_persist`** - ツール結果から生成されたアシスタントメッセージを書き換える
- **`before_message_write`** - 進行中のメッセージ書き込みを検査またはブロックする（まれ）

**メッセージと配信**

- **`inbound_claim`** - エージェントルーティング前に受信メッセージを引き受ける（合成返信）
- `message_received` — 受信内容、送信者、スレッド、メタデータを観測する
- **`message_sending`** — 送信内容を書き換える、または配信をキャンセルする
- **`reply_payload_sending`** — 配信前に正規化済み返信ペイロードを変更またはキャンセルする
- `message_sent` — 送信配信の成功または失敗を観測する
- **`before_dispatch`** - チャンネル引き渡し前に送信ディスパッチを検査または書き換える
- **`reply_dispatch`** - 最終返信ディスパッチパイプラインに参加する

**セッションと Compaction**

- `session_start` / `session_end` - セッションライフサイクル境界を追跡します。イベントの `reason` は `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart`、または `unknown` のいずれかです。`shutdown` と `restart` の値は、セッションがまだアクティブな間にプロセスが停止または再起動された場合、gateway シャットダウンファイナライザーから発火します。そのため、メモリやトランスクリプトストアなどの下流プラグインは、再起動をまたいで開いた状態のまま残ってしまうゴースト行を確定できます。ファイナライザーには境界があるため、遅いプラグインが SIGTERM/SIGINT をブロックすることはありません。
- `before_compaction` / `after_compaction` - Compaction サイクルを観測または注釈付けする
- `before_reset` - セッションリセットイベント（`/reset`、プログラムによるリセット）を観測する

**サブエージェント**

- `subagent_spawned` / `subagent_ended` - サブエージェントの起動と完了を観測します。
- `subagent_delivery_target` - コアセッションバインディングがルートを投影できない場合の完了配信用互換フック。
- `subagent_spawning` - 非推奨の互換フック。現在、コアは `subagent_spawned` が発火する前に、チャンネルのセッションバインディングアダプターを通じて `thread: true` サブエージェントバインディングを準備します。
- OpenClaw が起動前に子セッションのネイティブモデルを解決している場合、`subagent_spawned` には `resolvedModel` と `resolvedProvider` が含まれます。
- `subagent_ended` は `targetSessionKey`（ID — これは `subagent_spawned.childSessionKey` と一致します）、`targetKind`（`"subagent"` または `"acp"`）、`reason`、任意の `outcome`（`"ok"`、`"error"`、`"timeout"`、`"killed"`、`"reset"`、または `"deleted"`）、任意の `error`、`runId`、`endedAt`、`accountId`、`sendFarewell` を運びます。`agentId` または `childSessionKey` は含まれ**ません**。対応する `subagent_spawned` イベントとの関連付けには `targetSessionKey` を使用します。

**ライフサイクル**

- `gateway_start` / `gateway_stop` - Gateway とともにプラグイン所有サービスを開始または停止する
- `deactivate` - `gateway_stop` の非推奨の互換エイリアス。新しいプラグインでは `gateway_stop` を使用する
- `cron_changed` - gateway 所有の Cron ライフサイクル変更（追加、更新、削除、開始、完了、スケジュール）を観測する
- **`before_install`** - 読み込み済みプラグインランタイムからステージング済みの Skills またはプラグインインストール素材を検査する

## ランタイムフックのデバッグ

プラグインがエージェントターンのプロバイダーまたはモデルを切り替える必要がある場合は、`before_model_resolve` を使用します。これはモデル解決の前に実行されます。`llm_output` は、モデル試行がアシスタント出力を生成した後にのみ実行されます。

有効なセッションモデルを証明するには、ランタイム登録を検査してから、`openclaw sessions` または Gateway のセッション/ステータスサーフェスを使用します。プロバイダーペイロードをデバッグする場合は、`--raw-stream` と `--raw-stream-path <path>` を指定して Gateway を起動します。これらのフラグは、生のモデルストリームイベントを jsonl ファイルに書き込みます。

## ツール呼び出しポリシー

`before_tool_call` は以下を受け取ります。

- `event.toolName`
- `event.params`
- 任意の `event.toolKind` と `event.toolInputKind`。意図的に名前を共有するツールに対する、ホスト権威の判別子です。たとえば、外側のコードモード `exec` 呼び出しでは `toolKind: "code_mode_exec"` を使用し、入力言語が既知の場合は `toolInputKind: "javascript" | "typescript"` を含めます
- 任意の `event.derivedPaths`。`apply_patch` などのよく知られたツールエンベロープについて、ホストがベストエフォートで導出した対象パスのヒントを含みます。存在する場合、これらのパスは不完全な可能性があり、またはツールが実際に触れる内容を過大近似する可能性があります（たとえば、不正または部分的な入力の場合）
- 任意の `event.runId`
- 任意の `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（Cron 駆動の実行で設定）、`ctx.toolKind`、`ctx.toolInputKind`、診断用の `ctx.trace` などのコンテキストフィールド

これは以下を返せます。

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

型付きライフサイクルフックのフックガード動作:

- `block: true` は終端であり、低優先度のハンドラーをスキップします。
- `block: false` は判断なしとして扱われます。
- `params` は実行用のツールパラメーターを書き換えます。
- `requireApproval` はエージェント実行を一時停止し、プラグイン承認を通じてユーザーに確認します。`/approve` コマンドは exec とプラグイン承認の両方を承認できます。Codex app-server レポートモードのネイティブ `PreToolUse` リレーでは、これは対応する app-server 承認リクエストに延期されます。[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#hook-boundaries) を参照してください。
- 高優先度フックが承認を要求した後でも、低優先度の `block: true` は引き続きブロックできます。
- `onResolution` は解決済みの承認判断（`allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled`）を受け取ります。

承認ルーティング、判断動作、および任意ツールや exec 承認ではなく `requireApproval` を使用するタイミングについては、[Plugin 権限リクエスト](/ja-JP/plugins/plugin-permission-requests) を参照してください。

ホストレベルのポリシーが必要なプラグインは、`api.registerTrustedToolPolicy(...)` で信頼済みツールポリシーを登録できます。これらは通常の `before_tool_call` フックより前、かつ通常のフック判断より前に実行されます。バンドル済みの信頼済みポリシーが最初に実行され、インストール済みプラグインの信頼済みポリシーが次にプラグイン読み込み順で実行され、通常の `before_tool_call` フックはその後に実行されます。バンドル済みプラグインは既存の信頼済みポリシーパスを維持します。インストール済みプラグインは明示的に有効化され、`contracts.trustedToolPolicies` で各ポリシー ID を宣言する必要があります。宣言されていない ID は登録前に拒否されます。ポリシー ID は登録元プラグインにスコープされるため、異なるプラグインは同じローカル ID を再利用できます。この階層は、ワークスペースポリシー、予算強制、予約済みワークフロー安全性など、ホストから信頼されるゲートにのみ使用します。

### Exec 環境フック

`resolve_exec_env` により、プラグインはベース exec 環境が構築された後、コマンドが実行される前に、`exec` ツール呼び出しへ環境変数を提供できます。これは以下を受け取ります。

- `event.sessionKey`
- `event.toolName`。現在は常に `"exec"`
- `event.host`。`"gateway"`、`"sandbox"`、または `"node"` のいずれか
- `ctx.agentId`、`ctx.sessionKey`、`ctx.messageProvider`、`ctx.channelId` などのコンテキストフィールド

exec 環境にマージするには `Record<string, string>` を返します。ハンドラーは優先度順に実行され、同じキーについては後のフック結果が前のフック結果を上書きします。

フック出力は、マージされる前にホスト exec 環境キー ポリシーでフィルタリングされます。無効なキー、`PATH`、および `LD_*`、`DYLD_*`、`NODE_OPTIONS`、プロキシ変数、TLS オーバーライド変数などの危険なホスト上書きキーは削除されます。フィルタリングされた Plugin env は Gateway の承認/監査メタデータに含められ、node-host 実行リクエストへ転送されます。

### ツール結果の永続化

ツール結果には、UI レンダリング、診断、メディア ルーティング、または Plugin 所有のメタデータ用の構造化された `details` を含めることができます。`details` はプロンプト コンテンツではなく、ランタイム メタデータとして扱ってください。

- OpenClaw は、メタデータがモデル コンテキストにならないように、プロバイダー再生および Compaction 入力の前に `toolResult.details` を取り除きます。
- 永続化されたセッション エントリは、上限内の `details` のみを保持します。大きすぎる details はコンパクトな要約と `persistedDetailsTruncated: true` に置き換えられます。
- `tool_result_persist` と `before_message_write` は、最終的な永続化上限の前に実行されます。それでもフックは返す `details` を小さく保ち、プロンプトに関連するテキストを `details` のみに置くことを避ける必要があります。モデルに見えるツール出力は `content` に入れてください。

## プロンプトとモデル フック

新しい Plugin にはフェーズ固有のフックを使用してください。

- `before_model_resolve`: 現在のプロンプトと添付ファイル メタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在のプロンプト、準備済みのセッション メッセージ、およびこのセッション用に排出された厳密に一度だけのキュー済み注入を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在のプロンプトとセッション メッセージを受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: Heartbeat ターンでのみ実行され、`prependContext` または `appendContext` を返します。ユーザー起点のターンを変更せずに現在の状態を要約する必要があるバックグラウンド モニター向けです。

`before_agent_start` は互換性のために残っています。Plugin がレガシーな結合フェーズに依存しないように、上記の明示的なフックを優先してください。

`before_agent_run` は、プロンプト構築後、モデル入力の前に実行されます。これにはプロンプト ローカルな画像読み込みと `llm_input` 観測も含まれます。現在のユーザー入力を `prompt` として受け取り、読み込まれたセッション履歴を `messages` として、アクティブなシステム プロンプトも受け取ります。モデルがプロンプトを読めるようになる前に実行を停止するには、`{ outcome: "block", reason, message? }` を返します。`reason` は内部用です。`message` はユーザー向けの置換です。サポートされる結果は `pass` と `block` のみです。サポートされない判定形状はフェイルクローズします。

実行がブロックされると、OpenClaw は置換テキストのみを `message.content` に保存し、ブロックした Plugin ID やタイムスタンプなどの非機微なブロック メタデータを併せて保存します。元のユーザー テキストは transcript や将来のコンテキストには保持されません。内部ブロック理由は機微情報として扱われ、transcript、履歴、ブロードキャスト、ログ、診断ペイロードから除外されます。可観測性には、blocker ID、outcome、timestamp、安全なカテゴリなどのサニタイズ済みフィールドを使用してください。

`before_agent_start` と `agent_end` には、OpenClaw がアクティブな実行を識別できる場合に `event.runId` が含まれます。同じ値は `ctx.runId` でも利用できます。Cron 駆動の実行では `ctx.jobId`（発信元の cron ジョブ ID）も公開されるため、Plugin フックはメトリクス、副作用、状態を特定のスケジュール済みジョブにスコープできます。

チャネル起点の実行では、`ctx.channel` と `ctx.messageProvider` は `discord` や `telegram` などのプロバイダー サーフェスを識別し、`ctx.channelId` は OpenClaw がセッション キーまたは配信メタデータから導出できる場合の会話ターゲット識別子です。

送信者 ID が利用可能な場合、エージェント フック コンテキストには次も含まれます。

- `ctx.senderId` — チャネル スコープの送信者 ID（例: Feishu `open_id`、Discord ユーザー ID）。既知の送信者メタデータを持つユーザー メッセージから実行が発生した場合に設定されます。
- `ctx.chatId` — トランスポート ネイティブの会話識別子（例: Feishu `chat_id`、Telegram `chat_id`）。発信元チャネルがネイティブの会話 ID を提供する場合に設定されます。
- `ctx.channelContext.sender.id` — `ctx.senderId` と同じ送信者 ID で、Plugin がチャネル固有フィールドで拡張できるチャネル所有オブジェクト配下にあります。
- `ctx.channelContext.chat.id` — `ctx.chatId` と同じ会話 ID で、Plugin がチャネル固有フィールドで拡張できるチャネル所有オブジェクト配下にあります。

コアはネストされた `id` フィールドのみを定義します。inbound ヘルパーを通じてより豊富な送信者またはチャット メタデータを渡すチャネル Plugin は、`openclaw/plugin-sdk/channel-inbound` から `PluginHookChannelSenderContext` または `PluginHookChannelChatContext` を拡張できます。

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

チャネル Plugin は inbound SDK ヘルパーを通じてこれらのフィールドを渡します。

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

これらのフィールドは任意であり、システム起点の実行（heartbeat、cron、exec-event）には存在しません。

`ctx.senderExternalId` は、古い Plugin 向けの非推奨のソース互換性フィールドとして残っています。コアはこれを設定しません。新しいチャネル固有の送信者 ID は、モジュール拡張を通じて `ctx.channelContext.sender` 配下に置くべきです。

`agent_end` は観測フックです。Gateway と永続 harness パスはターン後に fire-and-forget で実行します。一方、短命な one-shot CLI パスは、信頼済み Plugin が terminal 可観測性をフラッシュしたり状態をキャプチャしたりできるように、プロセス クリーンアップ前にフック promise を待ちます。フック runner は 30 秒のタイムアウトを適用するため、停止した Plugin や埋め込みエンドポイントがフック promise を永久に pending のままにすることはできません。タイムアウトはログに記録され、OpenClaw は続行します。Plugin も独自の abort signal を使用していない限り、Plugin 所有のネットワーク作業はキャンセルされません。

生プロンプト、履歴、応答、ヘッダー、リクエスト本文、またはプロバイダー リクエスト ID を受け取るべきではないプロバイダー呼び出しテレメトリには、`model_call_started` と `model_call_ended` を使用してください。これらのフックには、`runId`、`callId`、`provider`、`model`、任意の `api`/`transport`、終端の `durationMs`/`outcome`、および OpenClaw が上限付きのプロバイダー リクエスト ID ハッシュを導出できる場合は `upstreamRequestIdHash` などの安定したメタデータが含まれます。ランタイムがコンテキスト ウィンドウ メタデータを解決済みの場合、フック イベントとコンテキストには、モデル/config/エージェント上限後の有効なトークン予算である `contextTokenBudget` に加え、より低い上限が適用された場合は `contextWindowSource` と `contextWindowReferenceTokens` も含まれます。

`before_agent_finalize` は、harness が自然な最終 assistant 回答を受け入れようとしている場合にのみ実行されます。これは `/stop` キャンセル パスではなく、ユーザーがターンを中止した場合には実行されません。finalization の前に harness にもう 1 回モデル パスを依頼するには `{ action: "revise", reason }` を返し、finalization を強制するには `{ action:
"finalize", reason? }` を返します。続行するには結果を省略します。Codex ネイティブの `Stop` フックは、このフックに OpenClaw の `before_agent_finalize` 判定として中継されます。

`action: "revise"` を返す場合、Plugin は追加のモデル パスを上限付きかつ再生安全にするために `retry` メタデータを含めることができます。

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` は harness に送信される修正理由に追加されます。`idempotencyKey` により、ホストは同等の finalize 判定全体で同じ Plugin リクエストに対する retry をカウントできます。`maxAttempts` は、自然な最終回答で続行する前にホストが許可する追加パス数を制限します。

生の会話フック（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`、または `before_agent_run`）が必要な非バンドル Plugin は、次を設定する必要があります。

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

ワークフロー Plugin は、`api.registerSessionExtension(...)` で小さな JSON 互換のセッション状態を永続化し、Gateway の `sessions.pluginPatch` メソッドで更新できます。セッション行は登録済み拡張状態を `pluginExtensions` 経由で射影し、Control UI や他のクライアントが Plugin 内部を知らずに Plugin 所有のステータスをレンダリングできるようにします。

Plugin が次のモデル ターンへ厳密に一度だけ到達させる必要がある永続コンテキストには、`api.enqueueNextTurnInjection(...)` を使用してください。OpenClaw はプロンプト フックの前にキュー済み注入を排出し、期限切れの注入を削除し、Plugin ごとに `idempotencyKey` で重複排除します。これは、承認再開、ポリシー要約、バックグラウンド モニターの差分、次のターンでモデルに見えるべきだが永続的なシステム プロンプト テキストになるべきではないコマンド継続に適した seam です。

クリーンアップ セマンティクスは契約の一部です。セッション拡張クリーンアップとランタイム ライフサイクル クリーンアップ コールバックは、`reset`、`delete`、`disable`、または `restart` を受け取ります。ホストは reset/delete/disable では所有 Plugin の永続セッション拡張状態と保留中の次ターン注入を削除します。restart では永続セッション状態を保持しつつ、クリーンアップ コールバックにより Plugin が古いランタイム世代のスケジューラー ジョブ、実行コンテキスト、その他の帯域外リソースを解放できます。

## メッセージ フック

チャネル レベルのルーティングと配信ポリシーにはメッセージ フックを使用してください。

- `message_received`: inbound コンテンツ、送信者、`threadId`、`messageId`、`senderId`、任意の実行/セッション相関、およびメタデータを観測します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `reply_payload_sending`: 正規化された `ReplyPayload` オブジェクト（`presentation`、`delivery`、メディア参照、テキストを含む）を書き換えるか、`{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を観測します。

音声のみの TTS 返信では、チャネル ペイロードに表示可能なテキスト/キャプションがない場合でも、`content` に非表示の読み上げ transcript が含まれることがあります。その `content` を書き換えると、フックから見える transcript のみが更新されます。メディア キャプションとしてはレンダリングされません。

`reply_payload_sending` イベントには、ベストエフォートのライブなターンごとのモデル/使用量/コンテキスト スナップショットである `usageState` が含まれる場合があります。永続配信、復元された再生、正確な実行相関がない返信では省略されます。

メッセージ フック コンテキストは、利用可能な場合に安定した相関フィールドを公開します: `ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、`ctx.callDepth`。inbound と `before_dispatch` のコンテキストは、チャネルが可視性フィルタ済みの引用メッセージ データを持つ場合、返信メタデータも公開します: `replyToId`、`replyToIdFull`、`replyToBody`、`replyToSender`、`replyToIsQuote`。レガシー メタデータを読む前に、これらの第一級フィールドを優先してください。

チャネル固有メタデータを使用する前に、型付きの `threadId` と `replyToId` フィールドを優先してください。

判定ルール:

- `cancel: true` の `message_sending` は終端です。
- `cancel: false` の `message_sending` は決定なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、
  低優先度のフックへ続行されます。
- `reply_payload_sending` は、ペイロードの正規化後、チャネル配信前に実行されます。
  これには、発信元チャネルへルーティングし直される返信も含まれます。ハンドラーは
  順番に実行され、各ハンドラーは高優先度のハンドラーが生成した最新のペイロードを
  参照します。
- `reply_payload_sending` のペイロードは、`trustedLocalMedia` などのランタイム信頼マーカーを公開しません。
  プラグインはペイロードの形状を編集できますが、ローカル
  メディアの信頼を付与することはできません。
- `message_sending` は、キャンセル時に `cancelReason` と制限付きの `metadata` を返せます。
  新しいメッセージライフサイクル API は、これを理由
  `cancelled_by_message_sending_hook` の抑制された配信結果として公開します。互換性のため、
  レガシーの直接
  配信は空の結果配列を返し続けます。
- `message_sent` は観測専用です。ハンドラーの失敗はログに記録されますが、
  配信結果は変更しません。

## インストールフック

オペレーター所有の許可/ブロック判断には `security.installPolicy` を使用します。この
ポリシーは OpenClaw 設定から実行され、CLI のインストールおよび更新パスを対象にし、
有効化されているが利用できない場合はフェイルクローズします。

`before_install` はプラグインランタイムのライフサイクルフックです。これは
Gateway によって支えられるインストールフローなど、プラグインフックが
すでに読み込まれている OpenClaw プロセスでのみ、`security.installPolicy` の後に
実行されます。プラグイン所有の観測、警告、互換性チェックに有用ですが、
インストールに対する主要なエンタープライズまたはホストのセキュリティ境界ではありません。
互換性のため、`builtinScan` フィールドはイベントペイロードに残りますが、OpenClaw はもはや
インストール時の組み込み危険コードブロックを実行しないため、空の `ok`
結果になります。そのプロセスでインストールを止めるには、追加の検出結果または
`{ block: true, blockReason }` を返します。

`block: true` は終端です。`block: false` は決定なしとして扱われます。
ハンドラーの失敗は、インストールをフェイルクローズでブロックします。

## Gateway ライフサイクル

Gateway 所有の状態が必要なプラグインサービスには `gateway_start` を使用します。
コンテキストは、cron の検査と更新のために `ctx.config`、`ctx.workspaceDir`、および
`ctx.getCron?.()` を公開します。長時間実行される
リソースのクリーンアップには `gateway_stop` を使用します。

プラグイン所有のランタイムサービスに、内部の `gateway:startup` フックへ依存しないでください。

`cron_changed` は、`added`、`updated`、`removed`、`started`、`finished`、
および `scheduled` の理由を網羅する型付きイベントペイロードとともに、Gateway 所有の Cron
ライフサイクルイベントで発火します。このイベントは、`PluginHookGatewayCronJob`
スナップショット（存在する場合は `state.nextRunAtMs`、`state.lastRunStatus`、および
`state.lastError` を含む）に加えて、`not-requested` | `delivered` | `not-delivered` | `unknown`
の `PluginHookGatewayCronDeliveryStatus` を運びます。削除イベントでも、
外部スケジューラーが状態を照合できるように、削除されたジョブのスナップショットを保持します。
外部ウェイクスケジューラーを同期するときは、ランタイム
コンテキストの `ctx.getCron?.()` と `ctx.config` を使用し、期限チェックと実行の
信頼できる情報源として OpenClaw を維持してください。

## 今後の非推奨化

フック周辺のいくつかのサーフェスは非推奨ですが、引き続きサポートされています。次の
メジャーリリース前に移行してください。

- **プレーンテキストのチャネルエンベロープ**（`inbound_claim` および `message_received`
  ハンドラー内）。フラットなエンベロープテキストを解析する代わりに、
  `BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。詳細は
  [プレーンテキストのチャネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。
- **`before_agent_start`** は互換性のために残っています。新しいプラグインは、結合された
  フェーズの代わりに `before_model_resolve` と `before_prompt_build` を使用してください。
- **`subagent_spawning`** は古いプラグインとの互換性のために残っていますが、
  新しいプラグインはここからスレッドルーティングを返さないでください。コアは、
  `subagent_spawned` が発火する前に、チャネルのセッションバインディングアダプターを通じて
  `thread: true` のサブエージェントバインディングを準備します。
- **`deactivate`** は、2026-08-16 以降まで非推奨のクリーンアップ互換エイリアスとして残ります。
  新しいプラグインは `gateway_stop` を使用してください。
- **`before_tool_call` の `onResolution`** は、自由形式の `string` ではなく、型付きの
  `PluginApprovalResolution` ユニオン（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`）を使用するようになりました。

完全な一覧（メモリ機能登録、プロバイダーの thinking
プロファイル、外部認証プロバイダー、プロバイダー検出型、タスクランタイム
アクセサー、`command-auth` → `command-status` の名称変更）については、
[Plugin SDK 移行 → 有効な非推奨項目](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK 移行](/ja-JP/plugins/sdk-migration) - 有効な非推奨項目と削除タイムライン
- [プラグインの構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [プラグインエントリーポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部フック](/ja-JP/automation/hooks)
- [プラグインアーキテクチャ内部](/ja-JP/plugins/architecture-internals)
