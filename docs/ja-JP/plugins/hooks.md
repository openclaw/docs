---
read_when:
    - before_tool_call、before_agent_reply、メッセージフック、またはライフサイクルフックを必要とするPluginを構築している
    - Plugin からのツール呼び出しをブロック、書き換え、または承認必須にする必要がある
    - 内部フックとPluginフックのどちらを使うかを判断している
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、Gateway のライフサイクルイベントをインターセプトする'
title: Plugin フック
x-i18n:
    generated_at: "2026-07-05T11:38:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7526c109b1fe07d36cda945d64577c374539f6ccf3f2ba0a99796939aba6dd9a
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin フックは、OpenClaw plugins のインプロセス拡張ポイントです。agent runs、tool calls、message flow、session lifecycle、subagent
routing、installs、または Gateway startup を検査または変更します。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、または `gateway:startup` などのコマンドや Gateway events に反応する、operator-installed の小さな
`HOOK.md` script には、代わりに [internal hooks](/ja-JP/automation/hooks) を使用します。

## クイックスタート

plugin entry から `api.on(...)` で型付き hooks を登録します。

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

handlers は `priority` の降順で順番に実行されます。同じ priority の handlers は登録順を維持します。

`api.on(name, handler, opts?)` は次を受け付けます。

| オプション | 効果 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority` | 順序付け。高いほど先に実行されます。 |
| `timeoutMs` | hook ごとの予算。設定すると、runner は設定済みの model timeout でブロックする代わりに、予算後にその handler を中断して次へ進みます。runner のデフォルトの hook ごとの timeout を使うには省略します。 |

operators は plugin code にパッチを当てずに hook budgets を設定できます。

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

`hooks.timeouts.<hookName>` は `hooks.timeoutMs` を上書きし、これは
plugin-authored の `api.on(..., { timeoutMs })` 値を上書きします。各値は
600000 ms までの正の整数である必要があります。遅いことが分かっている
hooks には hook ごとの overrides を優先し、1 つの plugin が全体で長い予算を得ないようにします。

各 hook は `event.context.pluginConfig`、つまりその handler を登録した
plugin の解決済み config を受け取ります。OpenClaw は、他の plugins が見る共有 event object を変更せず、handler ごとにそれを注入します。

## Hook カタログ

Hooks は拡張する surface ごとにグループ化されています。**太字**の名前は decision
result（block、cancel、override、または require approval）を受け付けます。それ以外は観察のみです。

**Agent turn**

| Hook | 目的 |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve` | session messages が読み込まれる前に provider または model を上書きします |
| `agent_turn_prepare` | queued plugin turn injections を消費し、prompt hooks の前に同一 turn の context を追加します |
| `before_prompt_build` | model call の前に dynamic context または system-prompt text を追加します |
| `before_agent_start` | 互換性専用の結合フェーズです。上の 2 つの hooks を優先します |
| **`before_agent_run`** | model submission の前に final prompt と session messages を検査します。run を block できます |
| **`before_agent_reply`** | synthetic reply または silence で model turn を short-circuit します |
| **`before_agent_finalize`** | natural final answer を検査し、model pass をもう 1 回要求します |
| `agent_end` | final messages、success state、run duration を観察します |
| `heartbeat_prompt_contribution` | background monitor と lifecycle plugins 向けに heartbeat-only context を追加します |

**Conversation observation**

| Hook | 目的 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | Sanitized provider/model call metadata: timing、outcome、bounded request-id hashes。prompt または response content は含みません。 |
| `llm_input` | Provider input: system prompt、prompt、history |
| `llm_output` | Provider output、usage、および利用可能な場合は解決済みの `contextTokenBudget` |

**Tools**

| Hook | 目的 |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`** | tool params を書き換える、execution を block する、または approval を要求します |
| `after_tool_call` | tool results、errors、duration を観察します |
| `resolve_exec_env` | plugin-owned environment variables を `exec` に提供します |
| **`tool_result_persist`** | tool result から生成された assistant message を書き換えます |
| **`before_message_write`** | 進行中の message write を検査または block します（まれ） |

**Messages and delivery**

| Hook | 目的 |
| --------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`** | agent routing の前に inbound message を claim します（synthetic replies） |
| `message_received` | inbound content、sender、thread、metadata を観察します |
| **`message_sending`** | outbound content を書き換える、または delivery を cancel します |
| **`reply_payload_sending`** | delivery 前に normalized reply payloads を変更または cancel します |
| `message_sent` | outbound delivery の success または failure を観察します |
| **`before_dispatch`** | channel handoff 前に outbound dispatch を検査または書き換えます |
| **`reply_dispatch`** | final reply-dispatch pipeline に参加します |

**Sessions and compaction**

| Hook | 目的 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end` | session lifecycle boundaries を追跡します。`reason` は `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart`、または `unknown` のいずれかです。`shutdown`/`restart` は、active sessions がある状態で process が停止または再起動したときに Gateway shutdown finalizer から発火するため、plugins（memory、transcript stores）は restart をまたいで開いたままにする代わりに ghost rows を finalize できます。finalizer は bounded なので、遅い plugin が SIGTERM/SIGINT を block することはできません。 |
| `before_compaction` / `after_compaction` | compaction cycles を観察または注釈付けします |
| `before_reset` | session-reset events（`/reset`、programmatic resets）を観察します |

**Subagents**

- `subagent_spawned` / `subagent_ended` - subagent の launch と completion を観察します。
- `subagent_delivery_target` - core session binding が route を project できない場合の completion delivery 用の compatibility hook。
- `subagent_spawning` - 非推奨の compatibility hook。Core は現在、`subagent_spawned` が発火する前に channel session-binding adapters を通じて `thread: true` subagent bindings を準備します。
- `subagent_spawned` には、OpenClaw が launch 前に child session の native model を解決済みの場合、`resolvedModel` と `resolvedProvider` が含まれます。
- `subagent_ended` は `targetSessionKey`（identity - `subagent_spawned.childSessionKey` と一致）、`targetKind`（`"subagent"` または `"acp"`）、`reason`、任意の `outcome`（`"ok"`、`"error"`、`"timeout"`、`"killed"`、`"reset"`、または `"deleted"`）、任意の `error`、`runId`、`endedAt`、`accountId`、`sendFarewell` を保持します。`agentId` または `childSessionKey` は含みません。一致する `subagent_spawned` event と関連付けるには `targetSessionKey` を使用します。

**Lifecycle**

| Hook | 目的 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Gateway とともに plugin-owned services を開始または停止します |
| `deactivate` | `gateway_stop` の非推奨の compatibility alias です。新しい plugins では `gateway_stop` を使用します |
| `cron_changed` | Gateway-owned cron lifecycle changes（added、updated、removed、started、finished、scheduled）を観察します |
| **`before_install`** | loaded plugin runtime から staged skill または plugin install material を検査します |

## Debug runtime hooks

agent turn の provider または model を切り替えるには `before_model_resolve` を使用します。これは
model resolution の前に実行されます。`llm_output` は model attempt が
assistant output を生成した後にのみ実行されます。

effective session model の証明には、runtime registrations を検査してから、
`openclaw sessions` または Gateway session/status surfaces を使用します。
provider payloads を debug するには、`--raw-stream` と
`--raw-stream-path <path>` で Gateway を起動し、raw model stream events を jsonl file に書き込みます。

## Tool call policy

`before_tool_call` は次を受け取ります。

- `event.toolName`
- `event.params`
- 省略可能な `event.toolKind` と `event.toolInputKind`。意図的に同じ名前を共有するツール向けの、ホスト権威の判別子。たとえば、外側のコードモード `exec` 呼び出しは `toolKind: "code_mode_exec"` を使用し、入力言語が既知の場合は `toolInputKind: "javascript" | "typescript"` を含めます
- 省略可能な `event.derivedPaths`。`apply_patch` などの既知のツールエンベロープ向けに、ホストがベストエフォートで導出した対象パスのヒント。これらのパスは、ツールが実際に触れる対象に対して不完全または過大近似になる場合があります（たとえば、不正な形式または部分的な入力の場合）
- 省略可能な `event.runId`
- 省略可能な `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.toolKind`、`ctx.toolInputKind`、および診断用 `ctx.trace` などのコンテキストフィールド

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

型付きライフサイクルフックのガード動作:

- `block: true` は終端であり、優先度の低いハンドラーをスキップします。
- `block: false` は決定なしとして扱われます。
- `params` は実行用のツールパラメーターを書き換えます。
- `requireApproval` はエージェント実行を一時停止し、Plugin 承認を通じてユーザーに確認します。`/approve` は exec 承認と Plugin 承認の両方を承認できます。Codex app-server report-mode のネイティブ `PreToolUse` リレーでは、これは対応する app-server 承認リクエストに委譲されます。[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#hook-boundaries)を参照してください。
- 優先度の高いフックが承認をリクエストした後でも、優先度の低い `block: true` がブロックできます。
- `onResolution` は解決済みの決定 `allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled` を受け取ります。

承認ルーティング、決定動作、および任意ツールや exec 承認ではなく `requireApproval` を使用するタイミングについては、[Plugin 権限リクエスト](/ja-JP/plugins/plugin-permission-requests)を参照してください。

ホストレベルのポリシーが必要な Plugin は、`api.registerTrustedToolPolicy(...)` で信頼済みツールポリシーを登録できます。これらは通常の `before_tool_call` フックより前、かつ通常のフック決定より前に実行されます。バンドルされた信頼済みポリシーが最初に実行され、インストール済み Plugin の信頼済みポリシーが Plugin 読み込み順で次に実行され、通常の `before_tool_call` フックはその後に実行されます。バンドルされた Plugin は既存の信頼済みポリシーパスを維持します。インストール済み Plugin は明示的に有効化され、`contracts.trustedToolPolicies` ですべてのポリシー ID を宣言する必要があります。未宣言の ID は登録前に拒否されます。ポリシー ID は登録元 Plugin にスコープされるため、異なる Plugin が同じローカル ID を再利用できます。この階層は、ワークスペースポリシー、予算適用、予約済みワークフロー安全性など、ホストに信頼されたゲートにのみ使用してください。

### Exec 環境フック

`resolve_exec_env` は、コマンド実行前に Plugin が `exec` ツール呼び出しへ環境変数を提供できるようにします。これは次を受け取ります。

- `event.sessionKey`
- `event.toolName`。現在は常に `"exec"`
- `event.host`。`"gateway"`、`"sandbox"`、または `"node"` のいずれか
- `ctx.agentId`、`ctx.sessionKey`、`ctx.messageProvider`、`ctx.channelId` などのコンテキストフィールド

exec 環境へマージするには `Record<string, string>` を返します。ハンドラーは優先度順に実行され、同じキーについては後の結果が前の結果を上書きします。

フック出力は、マージ前にホストの exec 環境キー ポリシーでフィルターされます。`PATH` は常に削除されます（コマンド解決と safe-bin チェックがそれに依存するため）。無効なキー、および `LD_*`、`DYLD_*`、`NODE_OPTIONS`、プロキシ変数（`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY`）、TLS 上書き変数（`NODE_TLS_REJECT_UNAUTHORIZED`、`SSL_CERT_FILE` など）の危険なホスト上書きキーは削除されます。フィルター済みの Plugin env は Gateway 承認/監査メタデータに含まれ、node ホスト実行リクエストに転送されます。

### ツール結果の永続化

ツール結果には、UI レンダリング、診断、メディア ルーティング、または Plugin 所有メタデータ向けの構造化 `details` を含めることができます。`details` はプロンプト内容ではなく、ランタイムメタデータとして扱ってください。

- OpenClaw はプロバイダー再生および Compaction 入力の前に `toolResult.details` を取り除くため、メタデータがモデル コンテキストになりません。
- 永続化されたセッションエントリは、境界付きの `details` のみを保持します。過大な details はコンパクトな要約と `persistedDetailsTruncated: true` に置き換えられます。
- `tool_result_persist` と `before_message_write` は、最終的な永続化上限の前に実行されます。返す `details` は小さく保ち、プロンプト関連テキストを `details` だけに置かないでください。モデルから見えるツール出力は `content` に入れてください。

## プロンプトとモデルのフック

新しい Plugin ではフェーズ固有のフックを使用してください。

- `before_model_resolve`: 現在のプロンプトと添付ファイルのメタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在のプロンプト、準備済みセッションメッセージ、およびこのセッション用にドレインされた厳密に一度だけのキュー済み注入を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在のプロンプトとセッションメッセージを受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: Heartbeat ターンでのみ実行され、`prependContext` または `appendContext` を返します。ユーザー起点のターンを変更せずに現在状態を要約する必要があるバックグラウンドモニターを想定しています。

`before_agent_start` は互換性のために残っています。Plugin がレガシーな結合フェーズに依存しないよう、上記の明示的なフックを優先してください。

`before_agent_run` は、プロンプト構築後、プロンプトローカル画像読み込みや `llm_input` 観測を含むモデル入力の前に実行されます。現在のユーザー入力を `prompt` として受け取り、読み込み済みセッション履歴を `messages` で、アクティブなシステムプロンプトも受け取ります。モデルがプロンプトを読む前に実行を停止するには、`{ outcome: "block", reason, message? }` を返します。`reason` は内部用で、`message` はユーザー向けの置換です。サポートされる結果は `pass` と `block` のみであり、サポートされない決定形状はフェイルクローズします。

実行がブロックされると、OpenClaw は置換テキストのみを `message.content` に保存し、ブロックした Plugin ID やタイムスタンプなどの非機密ブロックメタデータを加えます。元のユーザーテキストはトランスクリプトや将来のコンテキストに保持されません。内部ブロック理由は機密として扱われ、トランスクリプト、履歴、ブロードキャスト、ログ、診断ペイロードから除外されます。可観測性には、ブロッカー ID、結果、タイムスタンプ、安全なカテゴリなどのサニタイズ済みフィールドを使用してください。

OpenClaw がアクティブな実行を識別できる場合、`before_agent_start` と `agent_end` には `event.runId` が含まれます。同じ値は `ctx.runId` にもあります。Cron 駆動の実行では、エージェントターン コンテキスト上に `ctx.jobId`（発生元の cron ジョブ ID）も公開されるため、フックはメトリクス、副作用、または状態を特定のスケジュール済みジョブにスコープできます。`ctx.jobId` は `before_tool_call` ツール コンテキストの一部ではありません。

チャンネル起点の実行では、`ctx.channel` と `ctx.messageProvider` が `discord` や `telegram` などのプロバイダーサーフェスを識別し、`ctx.channelId` は OpenClaw がセッションキーまたは配信メタデータから導出できる場合の会話対象識別子です。

送信者 ID が利用可能な場合、エージェントフック コンテキストには次も含まれます。

- `ctx.senderId` - チャンネルスコープの送信者 ID（例: Feishu `open_id`、Discord ユーザー ID）。既知の送信者メタデータを持つユーザーメッセージから実行が発生した場合に設定されます。
- `ctx.chatId` - トランスポートネイティブの会話識別子（例: Feishu `chat_id`、Telegram `chat_id`）。発生元チャンネルがネイティブ会話 ID を提供する場合に設定されます。
- `ctx.channelContext.sender.id` - `ctx.senderId` と同じ送信者 ID。Plugin がチャンネル固有フィールドで拡張できる、チャンネル所有オブジェクトの下にあります。
- `ctx.channelContext.chat.id` - `ctx.chatId` と同じ会話 ID。Plugin がチャンネル固有フィールドで拡張できる、チャンネル所有オブジェクトの下にあります。

コアはネストされた `id` フィールドのみを定義します。インバウンドヘルパーを通じてより豊富な送信者またはチャット メタデータを渡すチャンネル Plugin は、`openclaw/plugin-sdk/channel-inbound` の `PluginHookChannelSenderContext` または `PluginHookChannelChatContext` を拡張できます。

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

チャンネル Plugin は、インバウンド SDK ヘルパーを通じてそれらのフィールドを渡します。

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

これらのフィールドは省略可能で、システム起点の実行（heartbeat、cron、exec-event）では存在しません。

`ctx.senderExternalId` は、古い Plugin 向けの非推奨ソース互換性フィールドとして残ります。コアはこれを設定しません。新しいチャンネル固有の送信者 ID は、モジュール拡張を通じて `ctx.channelContext.sender` の下に置く必要があります。

`agent_end` は観測フックです。Gateway と永続ハーネスのパスはターン後に fire-and-forget で実行します。一方、短命のワンショット CLI パスは、信頼済み Plugin がターミナル可観測性をフラッシュしたり状態をキャプチャしたりできるよう、プロセスのクリーンアップ前にフックの promise を待ちます。フックランナーは 30 秒のタイムアウトを適用するため、停止した Plugin や埋め込みエンドポイントがフック promise を永久に保留のままにすることはできません。タイムアウトはログに記録され、OpenClaw は続行します。Plugin も独自の abort signal を使用していない限り、Plugin 所有のネットワーク作業はキャンセルされません。

生のプロンプト、履歴、レスポンス、ヘッダー、リクエスト本文、プロバイダー リクエスト ID を受け取るべきではないプロバイダー呼び出しテレメトリには、`model_call_started` と `model_call_ended` を使用してください。これらのフックには、`runId`、`callId`、`provider`、`model`、省略可能な `api`/`transport`、終端の `durationMs`/`outcome`、および OpenClaw が境界付きプロバイダー リクエスト ID ハッシュを導出できる場合の `upstreamRequestIdHash` などの安定したメタデータが含まれます。ランタイムがコンテキストウィンドウ メタデータを解決した場合、フックイベントとコンテキストには、モデル/設定/エージェントの上限適用後の有効トークン予算である `contextTokenBudget` に加え、より低い上限が適用された場合の `contextWindowSource` と `contextWindowReferenceTokens` も含まれます。

`before_agent_finalize` は、ハーネスが自然な最終アシスタント回答を受け入れようとしている場合にのみ実行されます。これは `/stop` キャンセルパスではなく、ユーザーがターンを中止した場合には実行されません。最終化前にもう一度モデルパスをハーネスに要求するには `{ action: "revise", reason }` を返し、最終化を強制するには `{ action: "finalize", reason? }` を返し、続行するには結果を省略します。Codex ネイティブ `Stop` フックは、OpenClaw `before_agent_finalize` 決定としてこのフックにリレーされます。

`action: "revise"` を返す場合、Plugin は追加モデルパスを境界付きかつ再生安全にするため、`retry` メタデータを含めることができます。

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` はハーネスに送信される修正理由に追加されます。`idempotencyKey` により、ホストは同等の finalize 決定にまたがって同じ Plugin リクエストの再試行回数を数えられます。`maxAttempts` は、自然な最終回答で続行する前にホストが許可する追加パス数を制限します。

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

プロンプト変更フックと永続的な次ターン注入は、Plugin ごとに `plugins.entries.<id>.hooks.allowPromptInjection=false` で無効化できます。

### セッション拡張と次ターン注入

ワークフロープラグインは、`api.session.state.registerSessionExtension(...)` を使って小さな JSON 互換のセッション状態を永続化し、Gateway の `sessions.pluginPatch` メソッドを通じて更新できます。セッション行は登録済みの拡張状態を `pluginExtensions` 経由で投影し、Control UI や他のクライアントがプラグイン内部を知らなくても、プラグイン所有のステータスをレンダリングできるようにします。`api.registerSessionExtension(...)` は引き続き動作しますが、`api.session.state` 名前空間が推奨され、これは非推奨です。

プラグインが、永続的なコンテキストを次のモデルターンに正確に一度だけ到達させる必要がある場合は、`api.session.workflow.enqueueNextTurnInjection(...)` を使用します（トップレベルの `api.enqueueNextTurnInjection(...)` は同じ動作を持つ非推奨エイリアスです）。OpenClaw はプロンプトフックの前にキュー済み注入を排出し、期限切れの注入を破棄し、プラグインごとに `idempotencyKey` で重複排除します。これは、承認の再開、ポリシー要約、バックグラウンドモニターの差分、次ターンでモデルに見えるべきだが永続的なシステムプロンプト文にはすべきでないコマンド継続に適した境界です。

クリーンアップのセマンティクスは契約の一部です。セッション拡張クリーンアップとランタイムライフサイクルクリーンアップのコールバックは、`reset`、`delete`、`disable`、または `restart` を受け取ります。ホストは reset/delete/disable では、所有プラグインの永続セッション拡張状態と保留中の次ターン注入を削除します。restart では永続セッション状態を保持しつつ、クリーンアップコールバックによってプラグインが古いランタイム世代のスケジューラージョブ、実行コンテキスト、その他の帯域外リソースを解放できるようにします。

## メッセージフック

チャネルレベルのルーティングと配信ポリシーには、メッセージフックを使用します。

- `message_received`: 受信コンテンツ、送信者、`threadId`、`messageId`、`senderId`、任意の実行/セッション相関、およびメタデータを監視します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `reply_payload_sending`: 正規化済みの `ReplyPayload` オブジェクト（`presentation`、`delivery`、メディア参照、テキストを含む）を書き換えるか、`{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を監視します。

音声のみの TTS 返信では、チャネルペイロードに表示テキストやキャプションがない場合でも、`content` に非表示の読み上げトランスクリプトが含まれることがあります。その `content` を書き換えると、フックから見えるトランスクリプトだけが更新されます。メディアキャプションとしてはレンダリングされません。

`reply_payload_sending` イベントには、ベストエフォートのライブのターン単位モデル/使用量/コンテキストスナップショットである `usageState` が含まれる場合があります。永続配信、復旧されたリプレイ、正確な実行相関がない返信では省略されます。

メッセージフックのコンテキストは、利用可能な場合に安定した相関フィールドを公開します: `ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、`ctx.callDepth`。受信コンテキストと `before_dispatch` コンテキストは、チャネルに可視性フィルター済みの引用メッセージデータがある場合、返信メタデータも公開します: `replyToId`、`replyToIdFull`、`replyToBody`、`replyToSender`、`replyToIsQuote`。レガシーメタデータを読む前に、これらのファーストクラスフィールドを優先してください。

チャネル固有のメタデータを使用する前に、型付きの `threadId` と `replyToId` フィールドを優先してください。

判定ルール:

- `cancel: true` を伴う `message_sending` は終端です。
- `cancel: false` を伴う `message_sending` は判定なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、低優先度のフックへ続きます。
- `reply_payload_sending` は、ペイロード正規化後、チャネル配信前に実行されます。発信元チャネルに戻るようルーティングされた返信も含まれます。ハンドラーは順番に実行され、各ハンドラーは高優先度ハンドラーが生成した最新のペイロードを見ます。
- `reply_payload_sending` ペイロードは、`trustedLocalMedia` などのランタイム信頼マーカーを公開しません。プラグインはペイロード形状を編集できますが、ローカルメディア信頼を付与することはできません。
- `message_sending` は、キャンセルとともに `cancelReason` と境界付きの `metadata` を返せます。新しいメッセージライフサイクル API は、これを理由 `cancelled_by_message_sending_hook` の抑制済み配信結果として公開します。レガシーの直接配信は互換性のため、空の結果配列を返し続けます。
- `message_sent` は監視専用です。ハンドラーの失敗はログに記録され、配信結果は変更されません。

## インストールフック

オペレーター所有の許可/ブロック判定には `security.installPolicy` を使用します。このポリシーは OpenClaw 設定から実行され、CLI のインストールおよび更新パスを対象にし、有効化されているが利用できない場合はフェイルクローズします。

`before_install` はプラグインランタイムのライフサイクルフックです。Gateway に支えられたインストールフローなど、プラグインフックがすでに読み込まれている OpenClaw プロセス内でのみ、`security.installPolicy` の後に実行されます。これはプラグイン所有の監視、警告、互換性チェックに有用ですが、インストールにおける主要なエンタープライズまたはホストのセキュリティ境界ではありません。`builtinScan` フィールドは互換性のためイベントペイロードに残っていますが、OpenClaw はインストール時の危険コードブロックを組み込みで実行しなくなったため、これは空の `ok` 結果です。そのプロセス内でインストールを停止するには、追加の検出結果または `{ block: true, blockReason }` を返します。

`block: true` は終端です。`block: false` は判定なしとして扱われます。ハンドラーの失敗はインストールをフェイルクローズでブロックします。

## Gateway ライフサイクル

Gateway 所有の状態を必要とするプラグインサービスには `gateway_start` を使用します。コンテキストは、cron の検査と更新のために `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を公開します。長時間実行リソースのクリーンアップには `gateway_stop` を使用します。

プラグイン所有のランタイムサービスで、内部の `gateway:startup` フックに依存しないでください。

`cron_changed` は、Gateway 所有の cron ライフサイクルイベントに対して発火し、`added`、`updated`、`removed`、`started`、`finished`、`scheduled` の理由をカバーする型付きイベントペイロードを持ちます。イベントは、`PluginHookGatewayCronJob` スナップショット（存在する場合は `state.nextRunAtMs`、`state.lastRunStatus`、`state.lastError` を含む）に加えて、`not-requested` | `delivered` | `not-delivered` | `unknown` の `PluginHookGatewayCronDeliveryStatus` を運びます。削除イベントでも削除されたジョブスナップショットを運ぶため、外部スケジューラーは状態を突き合わせられます。外部ウェイクスケジューラーを同期するときは、ランタイムコンテキストの `ctx.getCron?.()` と `ctx.config` を使用し、期限チェックと実行の信頼できる情報源として OpenClaw を維持してください。

## 近日中の非推奨化

いくつかのフック隣接サーフェスは非推奨ですが、まだサポートされています。次のメジャーリリースまでに移行してください。

- **`inbound_claim` と `message_received` ハンドラー内のプレーンテキストのチャネルエンベロープ**。平坦なエンベロープテキストを解析する代わりに、`BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。[プレーンテキストのチャネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。
- **`before_agent_start`** は互換性のため残っています。新しいプラグインは、結合されたフェーズの代わりに `before_model_resolve` と `before_prompt_build` を使用してください。
- **`subagent_spawning`** は古いプラグインとの互換性のため残っていますが、新しいプラグインはここからスレッドルーティングを返すべきではありません。Core は `subagent_spawned` が発火する前に、チャネルのセッションバインディングアダプターを通じて `thread: true` サブエージェントバインディングを準備します。
- **`deactivate`** は、2026-08-16 より後まで、非推奨のクリーンアップ互換エイリアスとして残ります。新しいプラグインは `gateway_stop` を使用してください。
- **`before_tool_call` の `onResolution`** は、自由形式の `string` ではなく、型付きの `PluginApprovalResolution` ユニオン（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`）を使用するようになりました。
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** は、トップレベルの互換エイリアスとして残ります。新しいプラグインは `api.session.state.registerSessionExtension(...)` と `api.session.workflow.enqueueNextTurnInjection(...)` を使用してください。

完全な一覧（メモリ機能登録、プロバイダー思考プロファイル、外部認証プロバイダー、プロバイダー探索型、タスクランタイムアクセサー、`command-auth` → `command-status` の名前変更）については、[Plugin SDK 移行 → 有効な非推奨項目](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK 移行](/ja-JP/plugins/sdk-migration) - 有効な非推奨項目と削除タイムライン
- [プラグインの構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [プラグインエントリーポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部フック](/ja-JP/automation/hooks)
- [プラグインアーキテクチャの内部](/ja-JP/plugins/architecture-internals)
