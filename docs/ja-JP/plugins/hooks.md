---
read_when:
    - before_tool_call、before_agent_reply、メッセージフック、またはライフサイクルフックを必要とするPluginを構築している
    - Plugin からのツール呼び出しをブロック、書き換え、または承認必須にする必要があります
    - 内部フックとPluginフックのどちらを使うかを判断している
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、Gateway のライフサイクルイベントをインターセプトする'
title: Plugin フック
x-i18n:
    generated_at: "2026-07-06T10:51:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d26bd590b880b13843e7a4959a10ccaec11a6d986253123386f34f2ac9a74c
    source_path: plugins/hooks.md
    workflow: 16
---

Pluginフックは、OpenClaw Plugin向けのプロセス内拡張ポイントです。エージェント実行、ツール呼び出し、メッセージフロー、セッションライフサイクル、サブエージェントのルーティング、インストール、またはGateway起動を検査または変更します。

コマンドとGatewayイベント（`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup`など）に反応する、オペレーターがインストールした小さな`HOOK.md`スクリプトには、代わりに[内部フック](/ja-JP/automation/hooks)を使用してください。

## クイックスタート

Pluginエントリから`api.on(...)`で型付きフックを登録します。

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

ハンドラーは`priority`の降順で順次実行されます。同じ優先度のハンドラーは登録順を維持します。

`api.on(name, handler, opts?)`は次を受け付けます。

| オプション  | 効果                                                                                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | 順序付け。高いほど先に実行されます。                                                                                                                                                                    |
| `timeoutMs` | フックごとの実行予算。設定すると、ランナーは構成されたモデルタイムアウトでブロックする代わりに、その予算を超えたハンドラーを中止して次へ進みます。省略するとランナーのデフォルトのフックごとのタイムアウトを使用します。 |

オペレーターはPluginコードにパッチを当てずにフック予算を設定できます。

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

`hooks.timeouts.<hookName>`は`hooks.timeoutMs`を上書きし、`hooks.timeoutMs`はPlugin作成者が指定した`api.on(..., { timeoutMs })`値を上書きします。各値は600000 ms以下の正の整数である必要があります。既知の低速フックにはフックごとの上書きを優先し、1つのPluginがあらゆる場所で長い予算を得ないようにしてください。

各フックは、そのハンドラーを登録したPluginの解決済み構成である`event.context.pluginConfig`を受け取ります。OpenClawは、他のPluginが見る共有イベントオブジェクトを変更せずに、ハンドラーごとにこれを注入します。

## フックカタログ

フックは拡張するサーフェスごとにグループ化されています。**太字**の名前は判断結果（ブロック、キャンセル、上書き、または承認要求）を受け付けます。それ以外は観測専用です。

**エージェントターン**

| フック                          | 目的                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | セッションメッセージが読み込まれる前にプロバイダーまたはモデルを上書きする                                  |
| `agent_turn_prepare`            | キューに入ったPluginターン注入を消費し、プロンプトフックの前に同一ターンのコンテキストを追加する      |
| `before_prompt_build`           | モデル呼び出しの前に動的コンテキストまたはシステムプロンプトテキストを追加する                          |
| `before_agent_start`            | 互換性専用の結合フェーズ。上記2つのフックを優先する                            |
| **`before_agent_run`**          | モデル送信前に最終プロンプトとセッションメッセージを検査する。実行をブロックできる |
| **`before_agent_reply`**        | 合成返信または無音でモデルターンを短絡する                           |
| **`before_agent_finalize`**     | 自然な最終回答を検査し、もう1回モデルパスを要求する                         |
| `agent_end`                     | 最終メッセージ、成功状態、実行時間を観測する                                  |
| `heartbeat_prompt_contribution` | バックグラウンドモニターとライフサイクルPlugin向けにHeartbeat専用コンテキストを追加する                  |

**会話観測**

| フック                                      | 目的                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | サニタイズ済みのプロバイダー/モデル呼び出しメタデータ: タイミング、結果、境界付きリクエストIDハッシュ。プロンプトまたはレスポンス内容は含みません。 |
| `llm_input`                               | プロバイダー入力: システムプロンプト、プロンプト、履歴                                                                     |
| `llm_output`                              | プロバイダー出力、使用量、利用可能な場合は解決済みの`contextTokenBudget`                                       |

**ツール**

| フック                     | 目的                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | ツールパラメーターを書き換える、実行をブロックする、または承認を要求する |
| `after_tool_call`          | ツール結果、エラー、実行時間を観測する                |
| `resolve_exec_env`         | Pluginが所有する環境変数を`exec`に提供する   |
| **`tool_result_persist`**  | ツール結果から生成されるアシスタントメッセージを書き換える |
| **`before_message_write`** | 進行中のメッセージ書き込みを検査またはブロックする（まれ）      |

**メッセージと配信**

| フック                          | 目的                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | エージェントルーティング前に受信メッセージを要求する（合成返信） |
| **`channel_pairing_requested`** | 新しく作成されたDMペアリング要求を観測する                         |
| `message_received`              | 受信内容、送信者、スレッド、メタデータを観測する             |
| **`message_sending`**           | 送信内容を書き換える、または配信をキャンセルする                       |
| **`reply_payload_sending`**     | 配信前に正規化済み返信ペイロードを変更またはキャンセルする        |
| `message_sent`                  | 送信配信の成功または失敗を観測する                      |
| **`before_dispatch`**           | チャンネルへの引き渡し前に送信ディスパッチを検査または書き換える    |
| **`reply_dispatch`**            | 最終返信ディスパッチパイプラインに参加する                  |

**セッションとCompaction**

| フック                                   | 目的                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | セッションライフサイクル境界を追跡します。`reason`は`new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart`、または`unknown`のいずれかです。`shutdown`/`restart`は、アクティブなセッションがある状態でプロセスが停止または再起動すると、Gatewayシャットダウンファイナライザーから発火します。これにより、Plugin（メモリ、トランスクリプトストア）は再起動をまたいで開いたままにする代わりに、ゴースト行を確定できます。ファイナライザーには上限があるため、遅いPluginがSIGTERM/SIGINTをブロックできません。 |
| `before_compaction` / `after_compaction` | Compactionサイクルを観測または注釈付けする                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | セッションリセットイベント（`/reset`、プログラムによるリセット）を観測する                                                                                                                                                                                                                                                                                                                                                                                                     |

**サブエージェント**

- `subagent_spawned` / `subagent_ended` - サブエージェントの起動と完了を観測します。
- `subagent_delivery_target` - コアのセッションバインディングでルートを投影できない場合の完了配信用互換フックです。
- `subagent_spawning` - 非推奨の互換フックです。現在、コアは`subagent_spawned`が発火する前に、チャンネルのセッションバインディングアダプターを通じて`thread: true`サブエージェントバインディングを準備します。
- `subagent_spawned`には、OpenClawが起動前に子セッションのネイティブモデルを解決している場合、`resolvedModel`と`resolvedProvider`が含まれます。
- `subagent_ended`は、`targetSessionKey`（ID - `subagent_spawned.childSessionKey`と一致）、`targetKind`（`"subagent"`または`"acp"`）、`reason`、任意の`outcome`（`"ok"`、`"error"`、`"timeout"`、`"killed"`、`"reset"`、または`"deleted"`）、任意の`error`、`runId`、`endedAt`、`accountId`、`sendFarewell`を持ちます。`agentId`または`childSessionKey`は含みません。一致する`subagent_spawned`イベントとの関連付けには`targetSessionKey`を使用してください。

**ライフサイクル**

| フック                           | 目的                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | GatewayとともにPlugin所有サービスを開始または停止する                                                 |
| `deactivate`                     | `gateway_stop`の非推奨互換エイリアス。新しいPluginでは`gateway_stop`を使用する                 |
| `cron_changed`                   | Gateway所有のcronライフサイクル変更（追加、更新、削除、開始、終了、スケジュール）を観測する |
| **`before_install`**             | 読み込まれたPluginランタイムからステージング済みSkillまたはPluginインストール素材を検査する                         |

### チャンネルペアリング要求

Pluginが、未ペアリングのDM送信者が保留中のペアリング要求を作成した後にオペレーターへ通知する、または監査記録を書き込む必要がある場合は、`channel_pairing_requested`を使用します。このフックは要求が作成されたときにディスパッチされます。ペアリング返信のチャンネル配信は、遅いまたは失敗したフックハンドラーによって遅延されません。

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `New ${event.channel} pairing request from ${event.senderId}: ${event.code}`,
  });
});
```

このフックは観測専用です。ペアリング返信を承認、拒否、抑制、または書き換えることはありません。ペイロードには、チャンネル、任意の `accountId`、チャンネルスコープの `senderId`、ペアリング `code`、チャンネルメタデータが含まれます。ペアリングコードは有効な単回使用の承認資格情報として扱い、信頼済みのオペレーター送信先にのみ届けてください。`metadata` は、送信者が提供した信頼できない識別テキストとして扱ってください。このフックには、受信メッセージ本文やメディアは含まれません。

## デバッグランタイムフック

エージェントターンのプロバイダーまたはモデルを切り替えるには `before_model_resolve` を使用します。これはモデル解決の前に実行されます。`llm_output` は、モデル試行がアシスタント出力を生成した後にのみ実行されます。

有効なセッションモデルを証明するには、ランタイム登録を調べてから、`openclaw sessions` または Gateway のセッション/ステータスサーフェスを使用します。プロバイダーペイロードをデバッグするには、`--raw-stream` と `--raw-stream-path <path>` を指定して Gateway を起動し、生のモデルストリームイベントを jsonl ファイルに書き込みます。

## ツール呼び出しポリシー

`before_tool_call` は以下を受け取ります。

- `event.toolName`
- `event.params`
- 任意の `event.toolKind` と `event.toolInputKind`: 意図的に名前を共有するツール向けの、ホストが権威を持つ判別子。たとえば、外側のコードモード `exec` 呼び出しは `toolKind: "code_mode_exec"` を使用し、入力言語が既知の場合は `toolInputKind: "javascript" | "typescript"` を含みます
- 任意の `event.derivedPaths`: `apply_patch` などの既知のツールエンベロープに対してホストがベストエフォートで導出した対象パスのヒント。これらのパスは、ツールが実際に触れる内容に対して不完全または過大近似である場合があります（たとえば、不正な形式または部分的な入力の場合）
- 任意の `event.runId`
- 任意の `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.toolKind`、`ctx.toolInputKind`、診断用の `ctx.trace` などのコンテキストフィールド

以下を返せます。

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

型付きライフサイクルフックのガード動作:

- `block: true` は終端であり、低優先度のハンドラーをスキップします。
- `block: false` は決定なしとして扱われます。
- `params` は実行用のツールパラメーターを書き換えます。
- `requireApproval` はエージェント実行を一時停止し、Plugin 承認を通じてユーザーに確認します。`/approve` は exec と Plugin 承認の両方を承認できます。Codex app-server レポートモードのネイティブ `PreToolUse` リレーでは、これは対応する app-server 承認リクエストに委譲されます。[Codex harness runtime](/ja-JP/plugins/codex-harness-runtime#hook-boundaries) を参照してください。
- 高優先度のフックが承認を要求した後でも、低優先度の `block: true` はブロックできます。
- `onResolution` は解決済みの決定を受け取ります: `allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled`。

承認ルーティング、決定動作、任意ツールや exec 承認の代わりに `requireApproval` を使うタイミングについては、[Plugin permission requests](/ja-JP/plugins/plugin-permission-requests) を参照してください。

ホストレベルのポリシーが必要な Plugin は、`api.registerTrustedToolPolicy(...)` で信頼済みツールポリシーを登録できます。これらは通常の `before_tool_call` フックより前、通常のフック決定より前に実行されます。バンドル済み信頼済みポリシーが最初に実行され、インストール済み Plugin の信頼済みポリシーが Plugin 読み込み順で次に実行され、通常の `before_tool_call` フックはその後に実行されます。バンドル済み Plugin は既存の信頼済みポリシーパスを保持します。インストール済み Plugin は明示的に有効化され、すべてのポリシー ID を `contracts.trustedToolPolicies` で宣言する必要があります。宣言されていない ID は登録前に拒否されます。ポリシー ID は登録元 Plugin にスコープされるため、異なる Plugin が同じローカル ID を再利用できます。この階層は、ワークスペースポリシー、予算適用、予約済みワークフローの安全性など、ホストが信頼するゲートにのみ使用してください。

### Exec 環境フック

`resolve_exec_env` を使うと、Plugin はコマンド実行前に `exec` ツール呼び出しへ環境変数を提供できます。これは以下を受け取ります。

- `event.sessionKey`
- `event.toolName`、現在は常に `"exec"`
- `event.host`、`"gateway"`、`"sandbox"`、または `"node"` のいずれか
- `ctx.agentId`、`ctx.sessionKey`、`ctx.messageProvider`、`ctx.channelId` などのコンテキストフィールド

exec 環境へマージするには `Record<string, string>` を返します。ハンドラーは優先度順に実行され、後続の結果が同じキーの先行結果を上書きします。

フック出力は、マージ前にホストの exec 環境キー ポリシーでフィルターされます。`PATH` は常に削除されます（コマンド解決と safe-bin チェックがこれに依存するため）。無効なキー、および `LD_*`、`DYLD_*`、`NODE_OPTIONS`、プロキシ変数（`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY`）、TLS 上書き変数（`NODE_TLS_REJECT_UNAUTHORIZED`、`SSL_CERT_FILE` など）のような危険なホスト上書きキーは削除されます。フィルター済みの Plugin 環境は Gateway 承認/監査メタデータに含まれ、node ホスト実行リクエストへ転送されます。

### ツール結果の永続化

ツール結果には、UI レンダリング、診断、メディアルーティング、または Plugin 所有メタデータ用の構造化された `details` を含められます。`details` はプロンプト内容ではなく、ランタイムメタデータとして扱ってください。

- OpenClaw は、メタデータがモデルコンテキストにならないように、プロバイダーリプレイと Compaction 入力の前に `toolResult.details` を取り除きます。
- 永続化されたセッションエントリは、制限内の `details` のみを保持します。大きすぎる details はコンパクトな要約と `persistedDetailsTruncated: true` に置き換えられます。
- `tool_result_persist` と `before_message_write` は最終的な永続化上限の前に実行されます。返す `details` は小さく保ち、プロンプトに関連するテキストを `details` のみに置くことは避けてください。モデルに見えるツール出力は `content` に入れてください。

## プロンプトとモデルフック

新しい Plugin にはフェーズ固有のフックを使用してください。

- `before_model_resolve`: 現在のプロンプトと添付メタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在のプロンプト、準備済みセッションメッセージ、このセッション向けに排出された正確に一度だけのキュー済み注入を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在のプロンプトとセッションメッセージを受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: Heartbeat ターンでのみ実行され、`prependContext` または `appendContext` を返します。ユーザー起点のターンを変更せずに現在状態を要約する必要があるバックグラウンドモニター向けです。

`before_agent_start` は互換性のために残っています。Plugin がレガシーな結合フェーズに依存しないよう、上記の明示的なフックを優先してください。

`before_agent_run` は、プロンプト構築後、プロンプトローカル画像読み込みや `llm_input` 観測を含むモデル入力の前に実行されます。現在のユーザー入力を `prompt` として受け取り、読み込み済みセッション履歴を `messages` に、アクティブなシステムプロンプトも受け取ります。モデルがプロンプトを読む前に実行を停止するには `{ outcome: "block", reason, message? }` を返します。`reason` は内部用です。`message` はユーザー向けの置換文です。`pass` と `block` の結果のみがサポートされ、サポートされない決定形状はフェイルクローズします。

実行がブロックされると、OpenClaw は `message.content` の置換テキストと、ブロックした Plugin ID やタイムスタンプなどの非機密ブロックメタデータのみを保存します。元のユーザーテキストはトランスクリプトや将来のコンテキストには保持されません。内部ブロック理由は機密として扱われ、トランスクリプト、履歴、ブロードキャスト、ログ、診断ペイロードから除外されます。可観測性には、ブロッカー ID、結果、タイムスタンプ、安全なカテゴリなどのサニタイズ済みフィールドを使用してください。

`before_agent_start` と `agent_end` には、OpenClaw がアクティブな実行を識別できる場合に `event.runId` が含まれます。同じ値は `ctx.runId` にもあります。Cron 駆動の実行では、フックがメトリクス、副作用、または状態を特定のスケジュール済みジョブにスコープできるように、エージェントターン コンテキストで `ctx.jobId`（元の Cron ジョブ ID）も公開されます。`ctx.jobId` は `before_tool_call` ツールコンテキストの一部ではありません。

チャンネル起点の実行では、`ctx.channel` と `ctx.messageProvider` が `discord` や `telegram` などのプロバイダーサーフェスを識別し、`ctx.channelId` は OpenClaw がセッションキーまたは配信メタデータから導出できる場合の会話対象識別子です。

送信者識別情報が利用可能な場合、エージェントフックコンテキストには以下も含まれます。

- `ctx.senderId` - チャンネルスコープの送信者 ID（例: Feishu `open_id`、Discord ユーザー ID）。実行が既知の送信者メタデータを持つユーザーメッセージに由来する場合に設定されます。
- `ctx.chatId` - トランスポートネイティブの会話識別子（例: Feishu `chat_id`、Telegram `chat_id`）。起点チャンネルがネイティブ会話 ID を提供する場合に設定されます。
- `ctx.channelContext.sender.id` - `ctx.senderId` と同じ送信者 ID。Plugin がチャンネル固有フィールドで拡張できるチャンネル所有オブジェクト配下にあります。
- `ctx.channelContext.chat.id` - `ctx.chatId` と同じ会話 ID。Plugin がチャンネル固有フィールドで拡張できるチャンネル所有オブジェクト配下にあります。

コアが定義するのはネストされた `id` フィールドのみです。受信ヘルパー経由でより豊富な送信者またはチャットメタデータを渡すチャンネル Plugin は、`openclaw/plugin-sdk/channel-inbound` の `PluginHookChannelSenderContext` または `PluginHookChannelChatContext` を拡張できます。

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

チャンネル Plugin は、受信 SDK ヘルパー経由でこれらのフィールドを渡します。

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

これらのフィールドは任意であり、システム起点の実行（heartbeat、cron、exec-event）では存在しません。

`ctx.senderExternalId` は、古い Plugin 向けの非推奨ソース互換性フィールドとして残っています。コアはこれを設定しません。新しいチャンネル固有の送信者識別情報は、モジュール拡張を通じて `ctx.channelContext.sender` 配下に配置してください。

`agent_end` は観測フックです。Gateway と永続ハーネスのパスはターン後に fire-and-forget で実行します。一方、短命な one-shot CLI パスは、信頼済み Plugin がターミナル可観測性をフラッシュしたり状態を取得したりできるように、プロセスクリーンアップ前にフック promise を待ちます。フックランナーは 30 秒のタイムアウトを適用するため、停止した Plugin や埋め込みエンドポイントによってフック promise が永久に保留されることはありません。タイムアウトはログに記録され、OpenClaw は継続します。Plugin が独自の abort signal も使用していない限り、Plugin 所有のネットワーク作業はキャンセルされません。

生のプロンプト、履歴、レスポンス、ヘッダー、リクエスト本文、またはプロバイダーリクエスト ID を受け取るべきでないプロバイダー呼び出しテレメトリには、`model_call_started` と `model_call_ended` を使用してください。これらのフックには、`runId`、`callId`、`provider`、`model`、任意の `api`/`transport`、終端の `durationMs`/`outcome`、OpenClaw が制限付きプロバイダーリクエスト ID ハッシュを導出できる場合の `upstreamRequestIdHash` などの安定したメタデータが含まれます。ランタイムがコンテキストウィンドウメタデータを解決している場合、フックイベントとコンテキストには、モデル/設定/エージェント上限後の有効なトークン予算である `contextTokenBudget` に加えて、より低い上限が適用された場合の `contextWindowSource` と `contextWindowReferenceTokens` も含まれます。

`before_agent_finalize` は、ハーネスが自然な最終アシスタント回答を受け入れようとしている場合にのみ実行されます。これは `/stop` のキャンセル経路ではなく、ユーザーがターンを中断した場合にも実行されません。最終化の前にもう一度モデルパスを行うようハーネスに依頼するには `{ action: "revise", reason }` を返し、最終化を強制するには `{ action:
"finalize", reason? }` を返します。結果を省略すると続行します。Codex ネイティブの `Stop` hooks は、OpenClaw
`before_agent_finalize` の判断としてこの hook に中継されます。

`action: "revise"` を返す場合、plugins は `retry` メタデータを含めて、追加のモデルパスを有界かつリプレイ安全にできます。

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` は、ハーネスに送信される修正理由に追加されます。
`idempotencyKey` により、ホストは同じ Plugin 要求について、同等の finalize 判断をまたいで再試行回数を数えられます。また `maxAttempts` は、自然な最終回答で続行する前にホストが許可する追加パス数を制限します。

未バンドルの plugins が生の会話 hooks（`before_model_resolve`、
`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、
`agent_end`、または `before_agent_run`）を必要とする場合は、次を設定する必要があります。

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

プロンプトを変更する hooks と永続的な次ターン注入は、Plugin ごとに
`plugins.entries.<id>.hooks.allowPromptInjection=false` で無効化できます。

### セッション拡張と次ターン注入

ワークフロー plugins は、`api.session.state.registerSessionExtension(...)` で小さな JSON 互換のセッション状態を永続化し、Gateway `sessions.pluginPatch` メソッドを通じて更新できます。セッション行は登録済みの拡張状態を `pluginExtensions` を通じて投影するため、Control UI や他のクライアントは Plugin 内部を知ることなく、Plugin が所有するステータスをレンダリングできます。
`api.registerSessionExtension(...)` は引き続き動作しますが、`api.session.state` 名前空間の使用が推奨され、これは非推奨です。

Plugin が次のモデルターンに正確に一度だけ届く永続的なコンテキストを必要とする場合は、`api.session.workflow.enqueueNextTurnInjection(...)` を使用します（トップレベルの
`api.enqueueNextTurnInjection(...)` は同じ動作を持つ非推奨のエイリアスです）。OpenClaw はプロンプト hooks の前にキュー済みの注入を排出し、期限切れの注入を破棄し、Plugin ごとに `idempotencyKey` で重複排除します。これは、承認再開、ポリシー要約、バックグラウンド監視の差分、コマンド継続など、次のターンでモデルに見えるべきだが永続的なシステムプロンプト文にはすべきでないものに適した境界です。

クリーンアップのセマンティクスは契約の一部です。セッション拡張クリーンアップとランタイムライフサイクルのクリーンアップコールバックは、`reset`、`delete`、`disable`、または
`restart` を受け取ります。ホストは reset/delete/disable の場合、所有 Plugin の永続的なセッション拡張状態と保留中の次ターン注入を削除します。restart は永続的なセッション状態を保持しつつ、クリーンアップコールバックにより plugins が古いランタイム世代のスケジューラージョブ、実行コンテキスト、その他の帯域外リソースを解放できるようにします。

## メッセージ hooks

チャンネルレベルのルーティングと配信ポリシーにはメッセージ hooks を使用します。

- `message_received`: 受信コンテンツ、送信者、`threadId`、
  `messageId`、`senderId`、任意の実行/セッション相関、メタデータを監視します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `reply_payload_sending`: 正規化済みの `ReplyPayload` オブジェクト
  （`presentation`、`delivery`、メディア参照、テキストを含む）を書き換えるか、
  `{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を監視します。

音声のみの TTS 返信では、チャンネルペイロードに表示テキスト/キャプションがない場合でも、`content` に非表示の読み上げトランスクリプトが含まれることがあります。その `content` を書き換えると、hook から見えるトランスクリプトのみが更新されます。メディアキャプションとしてレンダリングされることはありません。

`reply_payload_sending` イベントには、ベストエフォートのライブなターン単位モデル/使用量/コンテキストスナップショットである `usageState` が含まれる場合があります。永続的な配信、復元されたリプレイ、正確な実行相関のない返信では省略されます。

メッセージ hook コンテキストは、利用可能な場合に安定した相関フィールドを公開します。
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、`ctx.callDepth` です。受信コンテキストと `before_dispatch` コンテキストは、チャンネルに可視性フィルター済みの引用メッセージデータがある場合、返信メタデータも公開します。`replyToId`、`replyToIdFull`、
`replyToBody`、`replyToSender`、`replyToIsQuote` です。従来のメタデータを読む前に、これらの第一級フィールドを優先してください。

チャンネル固有のメタデータを使う前に、型付きの `threadId` と `replyToId` フィールドを優先してください。

判断ルール:

- `cancel: true` を含む `message_sending` は終端です。
- `cancel: false` を含む `message_sending` は判断なしとして扱われます。
- 書き換えられた `content` は、後続の hook が配信をキャンセルしない限り、より低優先度の hooks に進みます。
- `reply_payload_sending` はペイロード正規化後、チャンネル配信前に実行されます。これには発信元チャンネルへ戻る返信も含まれます。
  ハンドラーは順番に実行され、各ハンドラーは高優先度ハンドラーによって生成された最新のペイロードを見ます。
- `reply_payload_sending` のペイロードは、`trustedLocalMedia` のようなランタイム信頼マーカーを公開しません。plugins はペイロード形状を編集できますが、ローカルメディア信頼を付与することはできません。
- `message_sending` は、キャンセル時に `cancelReason` と有界な `metadata` を返せます。新しいメッセージライフサイクル API は、これを理由 `cancelled_by_message_sending_hook` の抑制された配信結果として公開します。従来の直接配信は互換性のために空の結果配列を返し続けます。
- `message_sent` は監視専用です。ハンドラーの失敗はログに記録され、配信結果は変更されません。

## インストール hooks

オペレーター所有の許可/ブロック判断には `security.installPolicy` を使用します。そのポリシーは OpenClaw 設定から実行され、CLI のインストールおよび更新経路を対象とし、有効だが利用できない場合は fail closed します。

`before_install` は Plugin ランタイムライフサイクル hook です。これは `security.installPolicy` の後、Gateway が支援するインストールフローなど、Plugin hooks がすでに読み込まれている OpenClaw プロセス内でのみ実行されます。Plugin が所有する監視、警告、互換性チェックには有用ですが、インストールにおける主要なエンタープライズまたはホストのセキュリティ境界ではありません。`builtinScan` フィールドは互換性のためイベントペイロードに残っていますが、OpenClaw はインストール時の組み込み危険コードブロックを実行しなくなったため、空の `ok` 結果です。そのプロセス内でインストールを停止するには、追加の findings または
`{ block: true, blockReason }` を返します。

`block: true` は終端です。`block: false` は判断なしとして扱われます。ハンドラーの失敗は fail-closed でインストールをブロックします。

## Gateway ライフサイクル

Gateway が所有する状態を必要とする Plugin サービスには `gateway_start` を使用します。コンテキストは Cron の検査と更新のために、`ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を公開します。長時間実行されるリソースをクリーンアップするには `gateway_stop` を使用します。

Plugin 所有のランタイムサービスで内部の `gateway:startup` hook に依存しないでください。

`cron_changed` は、Gateway が所有する Cron ライフサイクルイベントで発火し、`added`、`updated`、`removed`、`started`、`finished`、
`scheduled` の理由を網羅する型付きイベントペイロードを持ちます。イベントは、`PluginHookGatewayCronJob` スナップショット（存在する場合は `state.nextRunAtMs`、`state.lastRunStatus`、`state.lastError` を含む）と、`not-requested` | `delivered` | `not-delivered` | `unknown` の
`PluginHookGatewayCronDeliveryStatus` を運びます。削除イベントでも削除済みジョブのスナップショットを保持するため、外部スケジューラーは状態を調整できます。外部ウェイクスケジューラーを同期するときは、ランタイムコンテキストの `ctx.getCron?.()` と `ctx.config` を使用し、期限チェックと実行については OpenClaw を信頼できる情報源として維持してください。

## 今後の非推奨

いくつかの hook 隣接サーフェスは非推奨ですが、まだサポートされています。次のメジャーリリース前に移行してください。

- `inbound_claim` および `message_received` ハンドラーの **平文チャンネルエンベロープ**。
  フラットなエンベロープテキストを解析する代わりに、`BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。
  [平文チャンネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。
- **`before_agent_start`** は互換性のために残っています。新しい plugins は、結合フェーズの代わりに
  `before_model_resolve` と `before_prompt_build` を使用してください。
- **`subagent_spawning`** は古い plugins との互換性のために残っていますが、新しい plugins はここからスレッドルーティングを返すべきではありません。core は `subagent_spawned` が発火する前に、チャンネルのセッションバインディングアダプターを通じて
  `thread: true` のサブエージェントバインディングを準備します。
- **`deactivate`** は、2026-08-16 以降まで、非推奨のクリーンアップ互換エイリアスとして残ります。新しい plugins は `gateway_stop` を使用してください。
- **`before_tool_call` の `onResolution`** は、自由形式の `string` ではなく、型付きの
  `PluginApprovalResolution` union（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`）を使用するようになりました。
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** は、トップレベルの互換エイリアスとして残っています。新しい plugins は
  `api.session.state.registerSessionExtension(...)` と
  `api.session.workflow.enqueueNextTurnInjection(...)` を使用してください。

完全な一覧（メモリ能力登録、プロバイダー思考プロファイル、外部認証プロバイダー、プロバイダー探索型、タスクランタイムアクセサー、`command-auth` → `command-status` の名称変更）については、
[Plugin SDK 移行 → アクティブな非推奨](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK 移行](/ja-JP/plugins/sdk-migration) - アクティブな非推奨と削除タイムライン
- [plugins の構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部 hooks](/ja-JP/automation/hooks)
- [Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)
