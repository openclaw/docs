---
read_when:
    - before_tool_call、before_agent_reply、メッセージフック、またはライフサイクルフックを必要とするPluginを構築している場合
    - Pluginからのツール呼び出しをブロック、書き換え、または承認必須にする必要がある
    - 内部フックとプラグインフックのどちらを使用するか判断しています
    - OpenClaw の Cron ウェイクを外部ホストのスケジューラに投影しています
summary: Plugin フック：エージェント、ツール、メッセージ、セッション、Gateway のライフサイクルイベントをインターセプトする
title: Plugin フック
x-i18n:
    generated_at: "2026-07-12T14:41:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hooks は、OpenClaw plugins 向けのプロセス内拡張ポイントです。エージェント実行、ツール呼び出し、メッセージフロー、セッションのライフサイクル、サブエージェントのルーティング、インストール、または Gateway の起動を検査または変更できます。

代わりに、`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` などのコマンドおよび Gateway イベントに反応する、オペレーターがインストールする小規模な `HOOK.md` スクリプトには、[内部 hooks](/ja-JP/automation/hooks)を使用してください。

## クイックスタート

Plugin のエントリから `api.on(...)` を使用して、型付き hooks を登録します。

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
            title: "Web 検索を実行",
            description: `検索クエリを許可: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

判断や変更を返せるハンドラーは、`priority` の降順で逐次実行されます。同じ優先度のハンドラーでは登録順が維持されます。監視専用のハンドラーは並列で実行され、実行後に完了を待たない監視ディスパッチは後続イベントと重なる可能性があります。監視の副作用の順序付けに優先度を使用しないでください。

`api.on(name, handler, opts?)` は以下を受け付けます。

| オプション    | 効果                                                                                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | 実行順序。値が大きいほど先に実行されます。                                                                                                                                                                |
| `timeoutMs` | フックごとの待機時間上限。期限が切れると、OpenClaw はそのハンドラーの待機を終了して次に進みます。ハンドラーやその副作用はキャンセルされません。省略すると、ランナーのフックごとのデフォルトタイムアウトが使用されます。 |

運用者は、Plugin コードにパッチを適用せずにフックの時間上限を設定できます。

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

`hooks.timeouts.<hookName>` は `hooks.timeoutMs` を上書きし、さらにこれは
Plugin 側で指定された `api.on(..., { timeoutMs })` の値を上書きします。各値には、
600000 ms 以下の正の整数を指定する必要があります。1 つの Plugin にすべての箇所で
長い時間枠を与えないよう、処理が遅いと分かっているフックにはフックごとの上書きを使用してください。

タイムアウトしたハンドラーの Promise は、フックコールバックがキャンセルシグナルを受け取らないため、実行を継続します。その Plugin の処理がまだ進行中でも、フックのディスパッチは Gateway の受付枠を解放できます。長時間実行される処理を担う Plugin は、独自のキャンセルおよびシャットダウンのライフサイクルを提供する必要があります。

送信内容を変更するアウトバウンドフック `message_sending` と `reply_payload_sending` では、ハンドラーごとにデフォルトで 15 秒が設定されます。いずれかがタイムアウトすると、OpenClaw は Plugin のエラーをログに記録し、シリアル化された配信レーンが完了できるよう、最新のペイロードで処理を続行します。配信前に意図的に時間のかかる処理を行う Plugin には、フックごとにより長い時間枠を設定してください。

`createReplyDispatcher` を使用するチャネル Plugin でも、`beforeDeliverOptions: { timeoutMs }` を使用してステージごとにより長い正の時間枠を宣言できます。また、`dispatcher.appendBeforeDeliver(handler, { timeoutMs })` で処理を追加する際にも指定できます。所有者が時間枠を宣言しない場合、これらのコールバックには同じデフォルトの 15 秒が適用されるため、停止したコールバックがシリアル化された配信レーンを占有し続けることはありません。

各フックは、そのハンドラーを登録した Plugin 用に解決された設定である `event.context.pluginConfig` を受け取ります。OpenClaw は、他の Plugin が参照する共有イベントオブジェクトを変更せず、ハンドラーごとにこの設定を注入します。

## Hook カタログ

Hook は、拡張するサーフェスごとにグループ化されています。**太字**の名前は判断結果
（ブロック、キャンセル、上書き、または承認要求）を受け付け、それ以外は
監視専用です。

**エージェントターン**

| Hook                            | 目的                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `before_model_resolve`          | セッションメッセージを読み込む前にプロバイダーまたはモデルを上書きする                           |
| `agent_turn_prepare`            | キューに入った Plugin のターン注入を消費し、プロンプト Hook の前に同一ターンのコンテキストを追加する |
| `before_prompt_build`           | モデル呼び出しの前に動的コンテキストまたはシステムプロンプトのテキストを追加する                   |
| `before_agent_start`            | 互換性専用の統合フェーズ。上記 2 つの Hook を優先する                                             |
| **`before_agent_run`**          | モデルへの送信前に最終プロンプトとセッションメッセージを検査する。実行をブロックできる             |
| **`before_agent_reply`**        | 合成応答または無応答によりモデルターンを短絡する                                                   |
| **`before_agent_finalize`**     | 自然な最終回答を検査し、モデルにもう一度処理を要求する                                             |
| `agent_end`                     | 最終メッセージ、成功状態、実行時間を監視する                                                       |
| `heartbeat_prompt_contribution` | バックグラウンド監視およびライフサイクル Plugin 向けに Heartbeat 専用コンテキストを追加する         |

**会話の監視**

| Hook                                      | 目的                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | サニタイズ済みのプロバイダー／モデル呼び出しメタデータ：タイミング、結果、長さを制限したリクエスト ID のハッシュ。プロンプトまたは応答の内容は含まれない。 |
| `llm_input`                               | プロバイダーへの入力：システムプロンプト、プロンプト、履歴                                                              |
| `llm_output`                              | プロバイダーからの出力、使用量、および利用可能な場合は解決済みの `contextTokenBudget`                                     |

**ツール**

| Hook                       | 目的                                                                 |
| -------------------------- | -------------------------------------------------------------------- |
| **`before_tool_call`**     | ツールのパラメーターを書き換える、実行をブロックする、または承認を要求する |
| `after_tool_call`          | ツールの結果、エラー、実行時間を監視する                             |
| `resolve_exec_env`         | Plugin が所有する環境変数を `exec` に提供する                        |
| **`tool_result_persist`**  | ツール結果から生成されたアシスタントメッセージを書き換える           |
| **`before_message_write`** | 処理中のメッセージ書き込みを検査またはブロックする（まれ）           |

**メッセージと配信**

| Hook                            | 目的                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------- |
| **`inbound_claim`**             | エージェントへのルーティング前に受信メッセージを引き受ける（合成応答）       |
| **`channel_pairing_requested`** | 新しく作成された DM ペアリングリクエストを監視する                           |
| `message_received`              | 受信内容、送信者、スレッド、メタデータを監視する                             |
| **`message_sending`**           | 送信内容を書き換える、または配信をキャンセルする                             |
| **`reply_payload_sending`**     | 配信前に正規化された応答ペイロードを変更またはキャンセルする                 |
| `message_sent`                  | 送信配信の成功または失敗を監視する                                           |
| **`before_dispatch`**           | チャネルへの引き渡し前に送信ディスパッチを検査または書き換える               |
| **`reply_dispatch`**            | 最終的な応答ディスパッチパイプラインに参加する                               |

**セッションと Compaction**

| Hook                                     | 目的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | セッションのライフサイクル境界を追跡する。`reason` は `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart`、`unknown` のいずれか。`shutdown`/`restart` は、アクティブなセッションがある状態でプロセスが停止または再起動すると Gateway のシャットダウンファイナライザーから発火するため、Plugin（メモリ、トランスクリプトストア）は再起動をまたいでゴースト行を開いたままにせず、終了処理を行える。低速な Plugin が SIGTERM/SIGINT をブロックできないよう、ファイナライザーの実行時間には上限が設けられている。 |
| `before_compaction` / `after_compaction` | Compaction サイクルを監視または注釈する                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `before_reset`                           | セッションリセットイベント（`/reset`、プログラムによるリセット）を監視する                                                                                                                                                                                                                                                                                                                                                                                                              |

**サブエージェント**

- `subagent_spawned` / `subagent_ended` - サブエージェントの起動と完了を監視する。
- `subagent_delivery_target` - コアセッションのバインディングからルートを投影できない場合に、完了を配信するための互換性 Hook。
- `subagent_spawning` - 非推奨の互換性 Hook。現在、コアは `subagent_spawned` が発火する前に、チャネルのセッションバインディングアダプターを介して `thread: true` のサブエージェントバインディングを準備する。
- `subagent_spawned` には、OpenClaw が起動前に子セッションのネイティブモデルを解決した場合、`resolvedModel` と `resolvedProvider` が含まれる。
- `subagent_ended` は、`targetSessionKey`（識別子 - `subagent_spawned.childSessionKey` と一致）、`targetKind`（`"subagent"` または `"acp"`）、`reason`、任意の `outcome`（`"ok"`、`"error"`、`"timeout"`、`"killed"`、`"reset"`、`"deleted"` のいずれか）、任意の `error`、`runId`、`endedAt`、`accountId`、`sendFarewell` を持つ。`agentId` または `childSessionKey` は含まれ**ない**。対応する `subagent_spawned` イベントとの関連付けには `targetSessionKey` を使用する。

**ライフサイクル**

| フック                             | 目的                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Gateway とともに Plugin 所有のサービスを開始または停止する                                                 |
| `deactivate`                     | `gateway_stop` の非推奨の互換エイリアス。新しい Plugin では `gateway_stop` を使用する                 |
| `cron_reconciled`                | 起動または再読み込み後に、Gateway の完全な Cron 状態と照合する                            |
| `cron_changed`                   | Gateway が所有する Cron のライフサイクル変更（追加、更新、削除、開始、完了、スケジュール設定）を監視する |
| **`before_install`**             | 読み込まれた Plugin ランタイムから、ステージングされた Skills または Plugin のインストール素材を検査する                         |

### チャンネルのペアリングリクエスト

未ペアリングの DM 送信者が保留中のペアリングリクエストを作成した後、Plugin がオペレーターに通知するか、監査記録を書き込む必要がある場合は、`channel_pairing_requested` を使用します。このフックはリクエストの作成時にディスパッチされます。フックハンドラーが低速または失敗しても、ペアリング応答のチャンネル配信は遅延しません。

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `新しい ${event.channel} ペアリングリクエスト（送信者: ${event.senderId}）: ${event.code}`,
  });
});
```

このフックは監視専用です。ペアリング応答を承認、拒否、抑制、または書き換えることはありません。ペイロードには、チャンネル、省略可能な `accountId`、チャンネルスコープの `senderId`、ペアリング `code`、およびチャンネルメタデータが含まれます。ペアリングコードは有効な単回使用の承認資格情報として扱い、信頼できるオペレーターの送信先にのみ配信してください。`metadata` は、送信者が提供した信頼できない識別情報テキストとして扱ってください。このフックには、受信メッセージ本文やメディアは含まれません。

## デバッグ用ランタイムフック

エージェントターンのプロバイダーまたはモデルを切り替えるには、`before_model_resolve` を使用します。これはモデル解決前に実行されます。`llm_output` は、モデル試行によってアシスタント出力が生成された後にのみ実行されます。

有効なセッションモデルを確認するには、ランタイム登録を調べてから、`openclaw sessions` または Gateway のセッション／ステータス画面を使用します。プロバイダーのペイロードをデバッグするには、`--raw-stream` と `--raw-stream-path <path>` を指定して Gateway を起動し、生のモデルストリームイベントを jsonl ファイルに書き込みます。

## ツール呼び出しポリシー

`before_tool_call` は以下を受け取ります。

- `event.toolName`
- `event.params`
- 省略可能な `event.toolKind` と `event.toolInputKind`。意図的に同じ名前を共有するツールを識別する、ホストを正とする判別子です。たとえば、外側のコードモードの `exec` 呼び出しは `toolKind: "code_mode_exec"` を使用し、入力言語が既知の場合は `toolInputKind: "javascript" | "typescript"` を含みます
- 省略可能な `event.derivedPaths`。`apply_patch` などの既知のツールエンベロープについて、ホストがベストエフォートで導出した対象パスのヒントです。これらのパスは不完全であったり、ツールが実際に変更する範囲を過大に近似したりする場合があります（たとえば、不正または部分的な入力の場合）
- 省略可能な `event.runId`
- 省略可能な `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.toolKind`、`ctx.toolInputKind`、および診断用の `ctx.trace` などのコンテキストフィールド

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
    /** @deprecated 未解決の承認は常に拒否されます。 */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

型付きライフサイクルフックのガード動作:

- `block: true` は終端となり、優先度の低いハンドラーをスキップします。
- `block: false` は決定なしとして扱われます。
- `params` は実行時のツールパラメーターを書き換えます。
- `requireApproval` はエージェント実行を一時停止し、Plugin の承認機能を通じてユーザーに確認します。`/approve` では、exec と Plugin の両方の承認を許可できます。Codex app-server の report-mode ネイティブ `PreToolUse` リレーでは、対応する app-server の承認リクエストに委ねられます。[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#hook-boundaries)を参照してください。
- 優先度の高いフックが承認を要求した後でも、優先度の低い `block: true` によってブロックされる可能性があります。
- `onResolution` は、解決済みの決定 `allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled` を受け取ります。

承認のルーティング、決定時の動作、および任意のツールや exec 承認の代わりに `requireApproval` を使用する条件については、[Plugin の権限リクエスト](/ja-JP/plugins/plugin-permission-requests)を参照してください。

ホストレベルのポリシーを必要とする Plugin は、`api.registerTrustedToolPolicy(...)` を使用して信頼済みツールポリシーを登録できます。これらは通常の `before_tool_call` フックおよび通常のフック決定より前に実行されます。バンドルされた信頼済みポリシーが最初に実行され、インストール済み Plugin の信頼済みポリシーが Plugin の読み込み順で続き、その後に通常の `before_tool_call` フックが実行されます。バンドルされた Plugin は既存の信頼済みポリシーパスを維持します。インストール済み Plugin は明示的に有効化され、すべてのポリシー ID を `contracts.trustedToolPolicies` で宣言する必要があります。未宣言の ID は登録前に拒否されます。ポリシー ID は登録元の Plugin をスコープとするため、異なる Plugin が同じローカル ID を再利用できます。この階層は、ワークスペースポリシー、予算の適用、予約済みワークフローの安全性など、ホストが信頼するゲートにのみ使用してください。

### Exec 環境フック

`resolve_exec_env` を使用すると、コマンド実行前に Plugin が `exec` ツール呼び出しへ環境変数を提供できます。以下を受け取ります。

- `event.sessionKey`
- `event.toolName`。現在は常に `"exec"`
- `event.host`。`"gateway"`、`"sandbox"`、または `"node"` のいずれか
- `ctx.agentId`、`ctx.sessionKey`、`ctx.messageProvider`、`ctx.channelId` などのコンテキストフィールド

exec 環境へマージする `Record<string, string>` を返します。ハンドラーは優先度順に実行され、同じキーについては後の結果が前の結果を上書きします。

フック出力は、マージ前にホストの exec 環境キーのポリシーでフィルタリングされます。`PATH` は常に破棄されます（コマンド解決と安全なバイナリのチェックがこれに依存するためです）。無効なキー、および `LD_*`、`DYLD_*`、`NODE_OPTIONS`、プロキシ変数（`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY`）、TLS 上書き変数（`NODE_TLS_REJECT_UNAUTHORIZED`、`SSL_CERT_FILE` など）の危険なホスト上書きキーは破棄されます。フィルタリングされた Plugin 環境は Gateway の承認／監査メタデータに含まれ、Node ホストの実行リクエストへ転送されます。

### ツール結果の永続化

ツール結果には、UI レンダリング、診断、メディアルーティング、または Plugin 所有のメタデータ用の構造化された `details` を含めることができます。`details` はプロンプト内容ではなく、ランタイムメタデータとして扱ってください。

- OpenClaw はプロバイダーへの再送および Compaction の入力前に `toolResult.details` を削除し、メタデータがモデルコンテキストに含まれないようにします。
- 永続化されたセッションエントリには、上限内の `details` のみが保持されます。サイズ超過の details は簡潔な要約に置き換えられ、`persistedDetailsTruncated: true` が設定されます。
- `tool_result_persist` と `before_message_write` は、最終的な永続化の上限が適用される前に実行されます。返す `details` は小さく保ち、プロンプトに関連するテキストを `details` のみに配置しないでください。モデルから参照可能なツール出力は `content` に配置してください。

## プロンプトとモデルのフック

新しい Plugin には、フェーズ固有のフックを使用してください。

- `before_model_resolve`: 現在のプロンプトと添付ファイルのメタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在のプロンプト、準備済みのセッションメッセージ、およびこのセッション用に取り出された正確に 1 回だけのキュー済み挿入を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在のプロンプトとセッションメッセージを受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: Heartbeat ターンでのみ実行され、`prependContext` または `appendContext` を返します。ユーザーが開始したターンを変更せずに現在の状態を要約する必要があるバックグラウンドモニターを想定しています。

`before_agent_start` は互換性のために残されています。Plugin が従来の複合フェーズに依存しないよう、上記の明示的なフックを使用してください。

`before_agent_run` はプロンプト構築後、プロンプト内の画像読み込みや `llm_input` の監視を含む、モデルへのあらゆる入力より前に実行されます。現在のユーザー入力を `prompt` として受け取り、読み込まれたセッション履歴を `messages` として、さらに有効なシステムプロンプトを受け取ります。モデルがプロンプトを読み取る前に実行を停止するには、`{ outcome: "block", reason, message? }` を返します。`reason` は内部用、`message` はユーザー向けの代替文です。サポートされる結果は `pass` と `block` のみです。未対応の決定形式は安全側に倒して拒否されます。

実行がブロックされた場合、OpenClaw は代替テキストのみを `message.content` に保存し、あわせてブロック元の Plugin ID やタイムスタンプなどの機密性のないブロックメタデータを保存します。元のユーザーテキストはトランスクリプトにも将来のコンテキストにも保持されません。内部ブロック理由は機密情報として扱われ、トランスクリプト、履歴、ブロードキャスト、ログ、診断ペイロードから除外されます。可観測性には、ブロック元の ID、結果、タイムスタンプ、安全なカテゴリなど、サニタイズ済みのフィールドを使用してください。

OpenClaw が有効な実行を識別できる場合、`before_agent_start` と `agent_end` には `event.runId` が含まれます。同じ値は `ctx.runId` にもあります。Cron によって駆動される実行では、エージェントターンのコンテキストに `ctx.jobId`（起点となった Cron ジョブ ID）も公開されるため、フックはメトリクス、副作用、または状態を特定のスケジュール済みジョブにスコープできます。`ctx.jobId` は `before_tool_call` のツールコンテキストには含まれません。

チャンネルを起点とする実行では、`ctx.channel` と `ctx.messageProvider` は `discord` や `telegram` などのプロバイダー画面を識別し、`ctx.channelId` は OpenClaw がセッションキーまたは配信メタデータから導出できる場合の会話対象識別子です。

送信者の識別情報を利用できる場合、エージェントフックのコンテキストには以下も含まれます。

- `ctx.senderId` - チャンネルスコープの送信者 ID（例: Feishu の `open_id`、Discord のユーザー ID）。既知の送信者メタデータを持つユーザーメッセージを起点として実行される場合に設定されます。
- `ctx.chatId` - トランスポート固有の会話識別子（例: Feishu の `chat_id`、Telegram の `chat_id`）。起点となるチャンネルがネイティブな会話 ID を提供する場合に設定されます。
- `ctx.channelContext.sender.id` - `ctx.senderId` と同じ送信者 ID。Plugin がチャンネル固有のフィールドで拡張できる、チャンネル所有のオブジェクト内にあります。
- `ctx.channelContext.chat.id` - `ctx.chatId` と同じ会話 ID。Plugin がチャンネル固有のフィールドで拡張できる、チャンネル所有のオブジェクト内にあります。

コアが定義するのは、ネストされた `id` フィールドのみです。受信ヘルパーを介して、より豊富な送信者またはチャットのメタデータを渡すチャンネル Plugin は、`openclaw/plugin-sdk/channel-inbound` の `PluginHookChannelSenderContext` または `PluginHookChannelChatContext` を拡張できます。

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

チャンネル Plugin は、受信 SDK ヘルパーを介してこれらのフィールドを渡します。

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

これらのフィールドは省略可能であり、システムを起点とする実行（Heartbeat、Cron、exec イベント）には存在しません。

`ctx.senderExternalId` は、古い Plugin 向けに非推奨のソース互換フィールドとして残されています。コアはこれを設定しません。新しいチャンネル固有の送信者識別情報は、モジュール拡張を通じて `ctx.channelContext.sender` の下に配置してください。

`agent_end` は監視用フックです。Gateway と永続的なハーネスのパスでは、ターン後に
待機せずに実行されます。一方、短命なワンショット CLI パスでは、信頼されたプラグインが
終了時の可観測性情報をフラッシュしたり状態を取得したりできるよう、プロセスのクリーンアップ前に
フックの Promise を待機します。フックランナーは 30 秒のタイムアウトを適用するため、
停止したプラグインや埋め込みエンドポイントによってフックの Promise が永続的に
保留されることはありません。タイムアウトはログに記録され、OpenClaw は処理を続行します。
プラグイン側でも独自の中止シグナルを使用しない限り、プラグインが所有するネットワーク処理は
キャンセルされません。

生のプロンプト、履歴、応答、ヘッダー、リクエスト本文、プロバイダーのリクエスト ID を
受け取るべきでないプロバイダー呼び出しのテレメトリには、`model_call_started` と
`model_call_ended` を使用します。これらのフックには、`runId`、`callId`、`provider`、
`model`、任意の `api`/`transport`、終了時の `durationMs`/`outcome`、および OpenClaw が
範囲を限定したプロバイダーのリクエスト ID ハッシュを導出できる場合の
`upstreamRequestIdHash` など、安定したメタデータが含まれます。ランタイムが
コンテキストウィンドウのメタデータを解決済みの場合、フックイベントとコンテキストには、
モデル、設定、エージェントの上限を適用した後の有効なトークン予算である
`contextTokenBudget` に加え、より低い上限が適用された場合の `contextWindowSource` と
`contextWindowReferenceTokens` も含まれます。

`before_agent_finalize` は、ハーネスが自然な最終アシスタント回答を受け入れようとするときに
のみ実行されます。これは `/stop` によるキャンセルパスではなく、ユーザーがターンを中止した
場合には実行されません。確定前にもう一度モデルを実行するようハーネスに要求するには
`{ action: "revise", reason }` を、強制的に確定するには `{ action:
"finalize", reason? }` を返します。処理を続行する場合は結果を省略します。
ハンドラーのデフォルト予算は 15s です。タイムアウト時、OpenClaw は失敗をログに記録し、
元の最終回答で処理を続行します。
Codex ネイティブの `Stop` フックは、OpenClaw の
`before_agent_finalize` 判定としてこのフックに中継されます。

`action: "revise"` を返すとき、プラグインは `retry` メタデータを含めることで、
追加のモデル実行を回数制限付きかつ再実行安全にできます。

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` は、ハーネスに送信される修正理由に追加されます。
`idempotencyKey` により、ホストは同等の確定判定をまたいで同じプラグイン要求の
再試行回数を数えられます。`maxAttempts` は、自然な最終回答で続行する前にホストが許可する
追加実行の回数を制限します。

生の会話フック（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、
`before_agent_finalize`、`agent_end`、または `before_agent_run`）を必要とする
非同梱プラグインは、次を設定する必要があります。

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

プロンプトを変更するフックと、次のターンへの永続的な注入は、プラグインごとに
`plugins.entries.<id>.hooks.allowPromptInjection=false` で無効化できます。

### セッション拡張と次ターンへの注入

ワークフロープラグインは、`api.session.state.registerSessionExtension(...)` を使用して
小さな JSON 互換のセッション状態を永続化し、Gateway の `sessions.pluginPatch` メソッドを
通じて更新できます。セッション行は、登録された拡張状態を `pluginExtensions` を介して
投影します。これにより、Control UI やその他のクライアントは、プラグイン内部の仕組みを
知らなくてもプラグイン所有の状態を表示できます。`api.registerSessionExtension(...)` も
引き続き動作しますが、`api.session.state` 名前空間を優先するため非推奨です。

プラグインが、次のモデルターンに厳密に一度だけ到達する永続的なコンテキストを必要とする場合は、
`api.session.workflow.enqueueNextTurnInjection(...)` を使用します（トップレベルの
`api.enqueueNextTurnInjection(...)` は、同じ動作を持つ非推奨のエイリアスです）。
OpenClaw はプロンプトフックの前にキュー内の注入を取り出し、期限切れの注入を破棄し、
プラグインごとに `idempotencyKey` で重複排除します。これは、承認後の再開、ポリシーの要約、
バックグラウンドモニターの差分、コマンドの継続など、次のターンでモデルから見える必要があるが、
恒久的なシステムプロンプトテキストにはすべきでない情報に適した接続点です。

クリーンアップのセマンティクスは契約の一部です。セッション拡張のクリーンアップと
ランタイムライフサイクルのクリーンアップコールバックは、`reset`、`delete`、`disable`、
または `restart` を受け取ります。ホストは、reset/delete/disable の場合、所有元プラグインの
永続的なセッション拡張状態と保留中の次ターン注入を削除します。restart の場合は永続的な
セッション状態を維持しつつ、クリーンアップコールバックによって、古いランタイム世代の
スケジューラージョブ、実行コンテキスト、その他の帯域外リソースをプラグインが解放できます。

## メッセージフック

チャネルレベルのルーティングと配信ポリシーには、メッセージフックを使用します。

- `message_received`: 受信コンテンツ、送信者、`threadId`、`messageId`、`senderId`、
  任意の実行/セッション相関情報、およびメタデータを監視します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `reply_payload_sending`: 正規化された `ReplyPayload` オブジェクト
  （`presentation`、`delivery`、メディア参照、テキストを含む）を書き換えるか、
  `{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を監視します。

音声のみの TTS 応答では、チャネルペイロードに表示可能なテキストやキャプションがなくても、
`content` に非表示の読み上げトランスクリプトが含まれる場合があります。その `content` を
書き換えても、フックから見えるトランスクリプトだけが更新され、メディアキャプションとしては
表示されません。

`reply_payload_sending` イベントには、ベストエフォートのライブなターン単位の
モデル/使用量/コンテキストスナップショットである `usageState` が含まれる場合があります。
永続的な配信、復旧された再実行、および実行との正確な相関がない応答では省略されます。

メッセージフックのコンテキストは、利用可能な場合に安定した相関フィールドを公開します。
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、`ctx.callDepth` です。受信時および
`before_dispatch` のコンテキストでは、チャネルに可視性フィルター済みの引用メッセージデータが
ある場合、応答メタデータも公開されます。`replyToId`、`replyToIdFull`、`replyToBody`、
`replyToSender`、`replyToIsQuote` です。レガシーメタデータを読む前に、これらの
第一級フィールドを優先してください。

チャネル固有のメタデータを使用する前に、型付きの `threadId` と `replyToId` フィールドを
優先してください。

判定ルール:

- `cancel: true` を指定した `message_sending` は最終判定です。
- `cancel: false` を指定した `message_sending` は判定なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、
  より優先度の低いフックへ渡されます。
- `reply_payload_sending` は、ペイロードの正規化後かつチャネル配信前に実行されます。
  これには、発信元チャネルへ戻るようルーティングされた応答も含まれます。
  ハンドラーは順次実行され、各ハンドラーは優先度の高いハンドラーが生成した最新のペイロードを
  受け取ります。
- `reply_payload_sending` ペイロードは、`trustedLocalMedia` などのランタイムの
  信頼マーカーを公開しません。プラグインはペイロードの形状を編集できますが、
  ローカルメディアへの信頼を付与することはできません。
- `message_sending` は、キャンセル時に `cancelReason` とサイズ制限付きの `metadata` を
  返せます。新しいメッセージライフサイクル API は、これを理由
  `cancelled_by_message_sending_hook` の抑制された配信結果として公開します。
  レガシーの直接配信は、互換性のため引き続き空の結果配列を返します。
- `message_sent` は監視専用です。ハンドラーの失敗はログに記録されますが、
  配信結果は変更されません。

## インストールフック

オペレーター所有の許可/ブロック判定には `security.installPolicy` を使用します。
このポリシーは OpenClaw の設定から実行され、CLI のインストールおよび更新パスを対象とし、
有効化されているのに利用できない場合はフェイルクローズします。

`before_install` はプラグインランタイムのライフサイクルフックです。Gateway を介した
インストールフローなど、プラグインフックがすでに読み込まれている OpenClaw プロセス内でのみ、
`security.installPolicy` の後に実行されます。プラグイン所有の監視、警告、互換性チェックには
有用ですが、インストールにおける主要なエンタープライズまたはホストのセキュリティ境界では
ありません。`builtinScan` フィールドは互換性のためイベントペイロードに残りますが、
OpenClaw はインストール時の危険なコードに対する組み込みブロックを実行しなくなったため、
空の `ok` 結果となります。追加の検出結果または `{ block: true, blockReason }` を返すと、
そのプロセス内でインストールを停止できます。

`block: true` は最終判定です。`block: false` は判定なしとして扱われます。ハンドラーの失敗時は、
フェイルクローズでインストールをブロックします。

## Gateway のライフサイクル

一般的なプラグインサービスを開始するには `gateway_start` を使用し、長時間実行される
リソースをクリーンアップするには `gateway_stop` を使用します。`gateway_start` の実行時には
Cron スケジューラーがまだ読み込み中の場合があるため、外部 Cron 投影のベースラインシグナルとして
使用しないでください。

プラグイン所有のランタイムサービスでは、内部の `gateway:startup` フックに依存しないでください。

`cron_reconciled` は、Gateway の Cron スケジューラーとその終了時ウォッチャーが
永続状態を調整した後に発火します。初回起動時と、設定再読み込み中のスケジューラー置換時の
両方で発火します。イベントは `reason`（`startup` または `reload`）と、有効な `enabled` 状態を
報告します。Cron が無効でも `enabled: false` として発行されるため、外部投影は古い起動予定を
消去できます。調整を完了した正確なスケジューラーインスタンスには `ctx.getCron?.()` を
使用してください。後続の再読み込みによって、そのコールバックの対象が変更されることは
ありません。`ctx.abortSignal` は同じスケジューラースナップショットに属します。Gateway は、
新しいスケジューラーの準備が整うか、シャットダウンが開始されるとすぐにこれを中止します。
すべての永続的な副作用にこのシグナルを渡し、中止後はそのスナップショットを受け入れないでください。
これはスケジューラーのライフサイクルシグナルであり、プラグイン有効化のシグナルではありません。
プラグインのみのホットリロードでは再発行されません。新たに有効化されたコンシューマーは、
次回のスケジューラー置換時または Gateway 起動時に最初のベースラインを受け取ります。

他の監視フックと同様に、`gateway_start` と `cron_reconciled` のコールバックは重複して
実行される場合があります。両方のハンドラーがプラグイン初期化を共有する場合は、
コールバック順序に依存せず、プラグインローカルの準備完了 Promise で調整してください。

`cron_changed` は、Gateway 所有の Cron ライフサイクルイベントに対して発火し、
`added`、`updated`、`removed`、`started`、`finished`、`scheduled` の各理由を網羅する
型付きイベントペイロードを持ちます。イベントには、`PluginHookGatewayCronJob`
スナップショット（存在する場合の `state.nextRunAtMs`、`state.lastRunStatus`、
`state.lastError` を含む）と、`not-requested` | `delivered` | `not-delivered` | `unknown` の
`PluginHookGatewayCronDeliveryStatus` が含まれます。削除イベントはコミット後に発火します。
永続的な削除が成功した後にのみ発火し、削除済みジョブのスナップショットも引き続き含むため、
外部スケジューラーは状態を調整できます。

`scheduled` イベントはコミット後に発火します。成功した永続書き込みによって既存ジョブの
有効な `nextRunAtMs` が変更された後にのみ発火し、そのジョブの明示的な `added`、`updated`、
`removed` ライフサイクルイベントは除外されます。トップレベルの `event.nextRunAtMs` は、
コミット済みの次回起動時刻です。存在しない場合、そのジョブには次回起動予定がありません。
これらのイベントは順序付きの差分ログではなく、調整のヒントとして扱ってください。
これらをまとめて処理可能なヒントとして使用し、`cron_reconciled` が最後に取得した
スケジューラーを再読み込みしてください。`cron_changed` のコンテキストからスケジューラーを
採用しないでください。実行期限の判定と実行に関する信頼できる情報源は OpenClaw のままにします。

### 安全な外部 Cron 投影

Cron イベントの差分を転送する代わりに、完全な起動スナップショットを投影します。
外部アダプターの `replaceAll` 操作はアトミックかつ冪等でなければならず、ホストが
スナップショットを永続的に受理した後にのみ完了しなければなりません。また、渡された
中止シグナルにも従う必要があります。永続的な受理前にシグナルが中止された場合、
アダプターはそのスナップショットを受理してはなりません。

このパターンでは、最新状態を処理するワーカーを常に 1 つだけ実行中に保ちます。
スケジューラーインスタンスを採用するのは `cron_reconciled` のみです。`cron_changed` は、
そのワーカーに信頼できるインスタンスの再読み込みを要求するだけなので、遅れて届いたヒントが
古いスケジューラーを復元することはありません。新しいリビジョンは、古いスナップショットが
受理される前に、進行中のホスト処理を中止します。

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("cron reconciliation did not expose a scheduler");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

`cron_reconciled` が `enabled: false` を報告すると、同じパスが
`replaceAll([])` を呼び出し、古い外部ウェイクを消去します。この例の
再試行とバックオフはプロセスローカルであり、ランタイムアダプターの障害を一時的なものとして扱います。再試行できない設定は
登録前に検証してください。OpenClaw は Plugin フックの効果に対する
アウトボックスを提供しません。永続的な受理の前にプロセスが終了した場合、
次回の Gateway 起動時に、新しい信頼できる `cron_reconciled` スナップショットが発行されます。
`gateway_stop` は処理中のホスト作業を中止し、ワーカーが完了するまで待ってから
アダプターを閉じます。

## 今後の非推奨化

フックに隣接する一部のサーフェスは非推奨ですが、引き続きサポートされています。
次のメジャーリリースまでに移行してください。

- `inbound_claim` および `message_received` ハンドラー内の**プレーンテキストのチャンネルエンベロープ**。
  フラットなエンベロープテキストを解析する代わりに、`BodyForAgent` と構造化されたユーザーコンテキストブロックを
  読み取ってください。詳しくは
  [プレーンテキストのチャンネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations)
  を参照してください。
- **`before_agent_start`** は互換性のために残されています。新しい Plugin では、統合された
  フェーズの代わりに `before_model_resolve` と `before_prompt_build` を使用してください。
- **`subagent_spawning`** は古い Plugin との互換性のために残されていますが、
  新しい Plugin はここからスレッドルーティングを返さないでください。コアは
  `subagent_spawned` が発火する前に、チャンネルセッションバインディングアダプターを通じて
  `thread: true` のサブエージェントバインディングを準備します。
- **`deactivate`** は、2026-08-16 より後まで、非推奨のクリーンアップ互換エイリアスとして残されます。
  新しい Plugin では `gateway_stop` を使用してください。
- **`before_tool_call` の `onResolution`** は、自由形式の `string` の代わりに、
  型付きの `PluginApprovalResolution` ユニオン（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`）を使用するようになりました。
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** は、
  トップレベルの互換エイリアスとして残されています。新しい Plugin では、
  `api.session.state.registerSessionExtension(...)` と
  `api.session.workflow.enqueueNextTurnInjection(...)` を使用してください。

完全な一覧（メモリ機能の登録、プロバイダーの思考プロファイル、
外部認証プロバイダー、プロバイダー検出型、タスクランタイムアクセサー、
および `command-auth` → `command-status` への名称変更）については、
[Plugin SDK の移行 → 現在の非推奨項目](/ja-JP/plugins/sdk-migration#active-deprecations)
を参照してください。

## 関連項目

- [Plugin SDK の移行](/ja-JP/plugins/sdk-migration) - 現在の非推奨項目と削除予定
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
- [Plugin のエントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部フック](/ja-JP/automation/hooks)
- [Plugin アーキテクチャの内部構造](/ja-JP/plugins/architecture-internals)
