---
read_when:
    - before_tool_call、before_agent_reply、メッセージフック、またはライフサイクルフックが必要なPluginを構築している
    - Plugin からのツール呼び出しをブロック、書き換え、または承認必須にする必要がある
    - 内部フックと Plugin フックのどちらを使うかを判断している
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、Gateway ライフサイクルイベントをインターセプトする'
title: Plugin フック
x-i18n:
    generated_at: "2026-05-06T17:59:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hooks は、OpenClaw プラグイン向けのプロセス内拡張ポイントです。プラグインが agent run、tool call、message flow、session lifecycle、subagent routing、インストール、または Gateway の起動を検査または変更する必要がある場合に使用します。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` などのコマンドおよび Gateway イベントに対して、operator がインストールする小さな `HOOK.md` スクリプトが必要な場合は、代わりに [internal hooks](/ja-JP/automation/hooks) を使用します。

## クイックスタート

プラグインエントリから `api.on(...)` を使って、型付きの plugin hooks を登録します。

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

Hook handlers は `priority` の降順で逐次実行されます。同じ priority のフックは登録順を維持します。

`api.on(name, handler, opts?)` は次を受け付けます。

- `priority` - ハンドラーの順序（高いものが先に実行されます）。
- `timeoutMs` - 任意のフック単位の予算。設定すると、hook runner はその予算が経過した時点でそのハンドラーを中止し、遅いセットアップや recall 処理が呼び出し元に設定されたモデルの timeout を消費し続ける代わりに、次のハンドラーへ進みます。省略すると、hook runner が汎用的に適用するデフォルトの observation/decision timeout が使用されます。

operator は、プラグインコードにパッチを当てずにフック予算を設定することもできます。

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

`hooks.timeouts.<hookName>` は `hooks.timeoutMs` を上書きし、`hooks.timeoutMs` はプラグイン作成者が指定した `api.on(..., { timeoutMs })` の値を上書きします。設定値はそれぞれ、600000 ミリ秒以下の正の整数でなければなりません。遅いことが分かっているフックにはフック単位の上書きを優先し、1 つのプラグインが全体で長い予算を得ないようにします。

各フックは `event.context.pluginConfig` を受け取ります。これは、そのハンドラーを登録したプラグイン向けに解決された config です。現在のプラグインオプションを必要とするフック判断に使用します。OpenClaw は、他のプラグインから見える共有 event object を変更せずに、ハンドラーごとにこれを注入します。

## フックカタログ

フックは、拡張する surface ごとにグループ化されています。**太字**の名前は decision result（block、cancel、override、または require approval）を受け付けます。それ以外はすべて observation-only です。

**Agent turn**

- `before_model_resolve` - セッションメッセージの読み込み前に provider または model を上書きする
- `agent_turn_prepare` - キュー済みのプラグイン turn injections を消費し、prompt hooks の前に同一 turn の context を追加する
- `before_prompt_build` - モデル呼び出しの前に dynamic context または system-prompt text を追加する
- `before_agent_start` - 互換性のみの複合フェーズ。上記 2 つのフックを優先する
- **`before_agent_run`** - モデル送信前に最終 prompt とセッションメッセージを検査し、必要に応じて run をブロックする
- **`before_agent_reply`** - synthetic reply または silence でモデル turn をショートサーキットする
- **`before_agent_finalize`** - 自然な最終回答を検査し、もう 1 回のモデル pass を要求する
- `agent_end` - 最終メッセージ、成功状態、run duration を観察する
- `heartbeat_prompt_contribution` - バックグラウンド monitor および lifecycle plugins 向けに heartbeat-only context を追加する

**Conversation observation**

- `model_call_started` / `model_call_ended` - prompt または response content を含めずに、サニタイズ済みの provider/model call metadata、timing、outcome、bounded request-id hashes を観察する
- `llm_input` - provider input（system prompt、prompt、history）を観察する
- `llm_output` - provider output を観察する

**Tools**

- **`before_tool_call`** - tool params を書き換える、実行をブロックする、または承認を要求する
- `after_tool_call` - tool results、errors、duration を観察する
- **`tool_result_persist`** - tool result から生成される assistant message を書き換える
- **`before_message_write`** - 進行中の message write を検査またはブロックする（まれ）

**Messages and delivery**

- **`inbound_claim`** - agent routing の前に inbound message を claim する（synthetic replies）
- `message_received` - inbound content、sender、thread、metadata を観察する
- **`message_sending`** - outbound content を書き換える、または delivery をキャンセルする
- `message_sent` - outbound delivery の成功または失敗を観察する
- **`before_dispatch`** - channel handoff の前に outbound dispatch を検査または書き換える
- **`reply_dispatch`** - 最終 reply-dispatch pipeline に参加する

**Sessions and compaction**

- `session_start` / `session_end` - session lifecycle boundaries を追跡する
- `before_compaction` / `after_compaction` - Compaction cycles を観察または注釈する
- `before_reset` - session-reset events（`/reset`、programmatic resets）を観察する

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - subagent routing と completion delivery を調整する

**Lifecycle**

- `gateway_start` / `gateway_stop` - Gateway とともにプラグイン所有のサービスを開始または停止する
- `cron_changed` - gateway-owned cron lifecycle changes（added、updated、removed、started、finished、scheduled）を観察する
- **`before_install`** - skill または plugin install scans を検査し、必要に応じてブロックする

## Tool call policy

`before_tool_call` は次を受け取ります。

- `event.toolName`
- `event.params`
- 任意の `event.runId`
- 任意の `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（cron-driven runs で設定）、および diagnostic `ctx.trace` などの context fields

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

- `block: true` は終端であり、低 priority のハンドラーをスキップします。
- `block: false` は decision なしとして扱われます。
- `params` は実行用の tool parameters を書き換えます。
- `requireApproval` は agent run を一時停止し、plugin approvals を通じてユーザーに確認します。`/approve` コマンドは exec と plugin approvals の両方を承認できます。
- 高 priority のフックが承認を要求した後でも、低 priority の `block: true` はブロックできます。
- `onResolution` は解決済みの approval decision（`allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled`）を受け取ります。

host-level policy が必要な bundled plugins は、`api.registerTrustedToolPolicy(...)` で trusted tool policies を登録できます。これらは通常の `before_tool_call` フックより前、および external plugin decisions より前に実行されます。workspace policy、budget enforcement、reserved workflow safety など、host-trusted gates のみに使用してください。External plugins は通常の `before_tool_call` フックを使用する必要があります。

### Tool result persistence

Tool results には、UI rendering、diagnostics、media routing、または plugin-owned metadata 向けの構造化された `details` を含めることができます。`details` は prompt content ではなく runtime metadata として扱います。

- OpenClaw は provider replay と Compaction input の前に `toolResult.details` を削除し、metadata が model context にならないようにします。
- persisted session entries は bounded `details` のみを保持します。大きすぎる details は compact summary と `persistedDetailsTruncated: true` に置き換えられます。
- `tool_result_persist` と `before_message_write` は最終 persistence cap の前に実行されます。フックは、それでも返す `details` を小さく保ち、prompt に関連する text を `details` だけに置かないようにする必要があります。model-visible tool output は `content` に入れてください。

## Prompt and model hooks

新しいプラグインでは、phase-specific hooks を使用します。

- `before_model_resolve`: 現在の prompt と attachment metadata のみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `agent_turn_prepare`: 現在の prompt、準備済み session messages、この session のために drained された exactly-once queued injections を受け取ります。`prependContext` または `appendContext` を返します。
- `before_prompt_build`: 現在の prompt と session messages を受け取ります。`prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。
- `heartbeat_prompt_contribution`: heartbeat turns のみで実行され、`prependContext` または `appendContext` を返します。これは、user-initiated turns を変更せずに現在の状態を要約する必要がある background monitors 向けです。

`before_agent_start` は互換性のために残っています。プラグインが legacy combined phase に依存しないよう、上記の明示的なフックを優先してください。

`before_agent_run` は、prompt construction 後、prompt-local image loading と `llm_input` observation を含むすべての model input の前に実行されます。現在のユーザー入力を `prompt` として受け取り、読み込まれた session history を `messages` として、active system prompt も受け取ります。モデルが prompt を読む前に run を停止するには、`{ outcome: "block", reason, message? }` を返します。`reason` は内部用で、`message` はユーザー向けの replacement です。サポートされる outcome は `pass` と `block` のみです。サポート外の decision shapes は fail closed します。

run がブロックされると、OpenClaw は `message.content` 内の replacement text と、blocking plugin id や timestamp などの非機密 block metadata のみを保存します。元のユーザー text は transcript や future context に保持されません。内部 block reasons は機密として扱われ、transcript、history、broadcast、log、diagnostics payloads から除外されます。Observability には、blocker id、outcome、timestamp、または safe category などのサニタイズ済み fields を使用する必要があります。

OpenClaw が active run を識別できる場合、`before_agent_start` と `agent_end` には `event.runId` が含まれます。同じ値は `ctx.runId` でも利用できます。Cron-driven runs では `ctx.jobId`（originating cron job id）も公開されるため、plugin hooks は metrics、side effects、または state を特定の scheduled job にスコープできます。

channel-originated runs では、`ctx.messageProvider` は `discord` や `telegram` などの provider surface であり、`ctx.channelId` は OpenClaw が session key または delivery metadata から導出できる場合の conversation target identifier です。

`agent_end` は observation hook であり、turn の後に fire-and-forget で実行されます。hook runner は 30 秒の timeout を適用するため、停止したプラグインや embedding endpoint が hook promise を永遠に pending のままにすることはできません。timeout はログに記録され、OpenClaw は続行します。プラグインも独自の abort signal を使用しない限り、plugin-owned network work はキャンセルされません。

raw prompts、history、responses、headers、request bodies、または provider request IDs を受け取るべきではない provider-call telemetry には、`model_call_started` と `model_call_ended` を使用します。これらのフックには、`runId`、`callId`、`provider`、`model`、任意の `api`/`transport`、terminal `durationMs`/`outcome`、および OpenClaw が bounded provider request-id hash を導出できる場合の `upstreamRequestIdHash` などの stable metadata が含まれます。

`before_agent_finalize` は、harness が自然な最終 assistant answer を受け入れようとしている場合にのみ実行されます。これは `/stop` cancellation path ではなく、ユーザーが turn を中止した場合には実行されません。finalization の前にもう 1 回の model pass を harness に求めるには `{ action: "revise", reason }` を返し、finalization を強制するには `{ action: "finalize", reason? }` を返し、続行するには結果を省略します。Codex native `Stop` hooks は OpenClaw の `before_agent_finalize` decisions としてこのフックに中継されます。

`action: "revise"` を返す場合、プラグインは追加の model pass を bounded かつ replay-safe にするために `retry` metadata を含めることができます。

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` は、ハーネスへ送信されるリビジョン理由に追加されます。
`idempotencyKey` により、ホストは同じPluginリクエストについて、同等の finalize 判断をまたいで再試行回数を数えられます。また、`maxAttempts` は、自然な最終回答へ進む前にホストが許可する追加パス数に上限を設定します。

生の会話フック（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`、または `before_agent_run`）が必要な非バンドルPluginは、次を設定する必要があります。

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

プロンプトを変更するフックと永続的な次ターン注入は、Pluginごとに
`plugins.entries.<id>.hooks.allowPromptInjection=false` で無効にできます。

### セッション拡張と次ターン注入

ワークフローPluginは、`api.registerSessionExtension(...)` で小さな JSON 互換のセッション状態を永続化し、Gateway の `sessions.pluginPatch` メソッドを通じて更新できます。セッション行は登録済みの拡張状態を `pluginExtensions` 経由で投影し、Control UI や他のクライアントがPluginの内部を知らなくてもPlugin所有のステータスをレンダリングできるようにします。

Pluginが次のモデルターンへ永続的なコンテキストを正確に1回だけ届ける必要がある場合は、`api.enqueueNextTurnInjection(...)` を使用します。OpenClaw はプロンプトフックの前にキュー済み注入を排出し、期限切れの注入を破棄し、Pluginごとに `idempotencyKey` で重複排除します。これは、承認再開、ポリシー要約、バックグラウンド監視の差分、次のターンでモデルから見えるべきだが永続的なシステムプロンプトテキストにはすべきでないコマンド継続に適した境界です。

クリーンアップのセマンティクスは契約の一部です。セッション拡張クリーンアップとランタイムライフサイクルのクリーンアップコールバックは、`reset`、`delete`、`disable`、または `restart` を受け取ります。ホストは reset/delete/disable の場合、所有Pluginの永続セッション拡張状態と保留中の次ターン注入を削除します。restart では永続セッション状態を保持しつつ、クリーンアップコールバックによりPluginが古いランタイム世代のスケジューラージョブ、実行コンテキスト、その他の帯域外リソースを解放できます。

## メッセージフック

チャネルレベルのルーティングと配信ポリシーには、メッセージフックを使用します。

- `message_received`: 受信コンテンツ、送信者、`threadId`、`messageId`、`senderId`、任意の実行/セッション相関、メタデータを監視します。
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します。
- `message_sent`: 最終的な成功または失敗を監視します。

音声のみの TTS 返信では、チャネルペイロードに可視テキストやキャプションがない場合でも、`content` に非表示の発話トランスクリプトが含まれることがあります。その `content` を書き換えても、フックから見えるトランスクリプトだけが更新されます。メディアキャプションとしてレンダリングされることはありません。

メッセージフックのコンテキストは、利用可能な場合に安定した相関フィールドを公開します。
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、`ctx.callDepth` です。レガシーメタデータを読む前に、これらの第一級フィールドを優先してください。

チャネル固有のメタデータを使用する前に、型付きの `threadId` と `replyToId` フィールドを優先してください。

判断ルール:

- `cancel: true` を伴う `message_sending` は終端です。
- `cancel: false` を伴う `message_sending` は判断なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、低優先度のフックへ継続します。

## インストールフック

`before_install` は、組み込みの Skills とPluginインストールのスキャン後に実行されます。追加の検出結果、またはインストールを停止するための `{ block: true, blockReason }` を返します。

`block: true` は終端です。`block: false` は判断なしとして扱われます。

## Gateway ライフサイクル

Gateway 所有の状態が必要なPluginサービスには `gateway_start` を使用します。コンテキストは、cron の検査と更新のために `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を公開します。長時間実行されるリソースのクリーンアップには `gateway_stop` を使用します。

Plugin所有のランタイムサービスに対して、内部の `gateway:startup` フックに依存しないでください。

`cron_changed` は、Gateway 所有の cron ライフサイクルイベントで発火し、`added`、`updated`、`removed`、`started`、`finished`、`scheduled` の理由を含む型付きイベントペイロードを持ちます。このイベントは、`PluginHookGatewayCronJob` スナップショット（存在する場合は `state.nextRunAtMs`、`state.lastRunStatus`、`state.lastError` を含む）と、`not-requested` | `delivered` | `not-delivered` | `unknown` の `PluginHookGatewayCronDeliveryStatus` を伝えます。removed イベントにも削除されたジョブのスナップショットが含まれるため、外部スケジューラーは状態を照合できます。外部ウェイクスケジューラーを同期するときはランタイムコンテキストの `ctx.getCron?.()` と `ctx.config` を使用し、期限チェックと実行については OpenClaw を信頼できる情報源として維持してください。

## 今後の非推奨

いくつかのフック隣接サーフェスは非推奨ですが、まだサポートされています。次のメジャーリリース前に移行してください。

- `inbound_claim` と `message_received` ハンドラーの **平文チャネルエンベロープ**。フラットなエンベロープテキストを解析する代わりに、`BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。詳細は
  [平文チャネルエンベロープ → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。
- **`before_agent_start`** は互換性のために残っています。新しいPluginでは、結合フェーズの代わりに `before_model_resolve` と `before_prompt_build` を使用してください。
- **`before_tool_call` の `onResolution`** は、自由形式の `string` ではなく、型付きの `PluginApprovalResolution` union（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`）を使用するようになりました。

完全な一覧（メモリ機能登録、プロバイダー思考プロファイル、外部認証プロバイダー、プロバイダー検出型、タスクランタイムアクセサー、`command-auth` から `command-status` への名称変更）については、
[Plugin SDK 移行 → 有効な非推奨](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK 移行](/ja-JP/plugins/sdk-migration) - 有効な非推奨と削除タイムライン
- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Pluginエントリーポイント](/ja-JP/plugins/sdk-entrypoints)
- [内部フック](/ja-JP/automation/hooks)
- [Pluginアーキテクチャ内部](/ja-JP/plugins/architecture-internals)
