---
read_when:
    - '`before_tool_call`、`before_agent_reply`、message hook、またはlifecycle hookが必要なPluginを構築しています'
    - Pluginからのtool callをブロック、書き換え、または承認必須にする必要があります
    - internal hookとPlugin hookのどちらを使うかを判断しています
summary: 'Plugin hook: agent、tool、message、session、およびGateway lifecycle eventをinterceptする'
title: Plugin hook
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:36:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin hookは、OpenClaw Plugin向けのin-process extension pointです。Pluginがagent run、tool call、message flow、session lifecycle、subagent routing、install、またはGateway起動を検査または変更する必要がある場合に使ってください。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` のようなcommandおよびGateway event向けに、小さなoperatorインストール型 `HOOK.md` scriptを使いたい場合は、代わりに[internal hooks](/ja-JP/automation/hooks)を使ってください。

## クイックスタート

Plugin entryから `api.on(...)` を使って型付きPlugin hookを登録します。

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

hook handlerは、`priority` の降順で順次実行されます。同じpriorityのhookは登録順を維持します。

## Hook catalog

hookは、拡張するsurfaceごとにグループ化されています。**太字**の名前はdecision result（block、cancel、override、または承認要求）を受け付けます。それ以外はすべてobservation専用です。

**agent turn**

- `before_model_resolve` — session messageを読み込む前にproviderまたはmodelをoverrideする
- `before_prompt_build` — model call前に動的contextまたはsystem-prompt textを追加する
- `before_agent_start` — 互換性専用のcombined phase。上の2つのhookを推奨
- **`before_agent_reply`** — model turnをsynthetic replyまたは無音で短絡する
- **`before_agent_finalize`** — 自然な最終回答を検査し、もう1回model passを要求する
- `agent_end` — 最終message、成功状態、run durationを観測する

**会話の観測**

- `model_call_started` / `model_call_ended` — promptやresponse contentなしで、sanitize済みprovider / model call metadata、timing、outcome、および境界付きrequest-id hashを観測する
- `llm_input` — provider input（system prompt、prompt、history）を観測する
- `llm_output` — provider outputを観測する

**tool**

- **`before_tool_call`** — tool paramを書き換える、実行をブロックする、または承認を要求する
- `after_tool_call` — tool result、error、durationを観測する
- **`tool_result_persist`** — tool resultから生成されるassistant messageを書き換える
- **`before_message_write`** — 進行中のmessage writeを検査またはブロックする（まれ）

**messageと配信**

- **`inbound_claim`** — agent routing前にinbound messageをclaimする（synthetic reply）
- `message_received` — inbound content、sender、thread、metadataを観測する
- **`message_sending`** — outbound contentを書き換える、または配信をcancelする
- `message_sent` — outbound配信の成功または失敗を観測する
- **`before_dispatch`** — channel handoff前にoutbound dispatchを検査または書き換える
- **`reply_dispatch`** — 最終reply-dispatch pipelineに参加する

**sessionとCompaction**

- `session_start` / `session_end` — session lifecycle境界を追跡する
- `before_compaction` / `after_compaction` — Compaction cycleを観測または注記する
- `before_reset` — session reset event（`/reset`、プログラム的reset）を観測する

**subagent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — subagent routingとcompletion配信を調整する

**lifecycle**

- `gateway_start` / `gateway_stop` — GatewayとともにPlugin所有serviceを開始または停止する
- **`before_install`** — SkillまたはPlugin install scanを検査し、任意でブロックする

## tool call policy

`before_tool_call` は次を受け取ります。

- `event.toolName`
- `event.params`
- 任意の `event.runId`
- 任意の `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId`（Cron駆動runで設定）、診断用の `ctx.trace` などのcontext field

返せる値:

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

- `block: true` は終端であり、より低いpriorityのhandlerをスキップします。
- `block: false` はdecisionなしとして扱われます。
- `params` は、実行用のtool parameterを書き換えます。
- `requireApproval` はagent runを一時停止し、plugin approvalを通じてユーザーに確認します。
- `/approve` commandは、exec approvalとplugin approvalの両方を承認できます。
- より高いpriorityのhookが承認を要求した後でも、より低いpriorityの `block: true` がブロックできます。
- `onResolution` は、解決済みの承認decision（`allow-once`,
  `allow-always`, `deny`, `timeout`, `cancelled`）を受け取ります。

### tool result persistence

tool resultには、UI rendering、diagnostics、
media routing、またはPlugin所有metadata向けの構造化 `details` を含めることができます。`details` はruntime metadataとして扱い、prompt contentとして扱わないでください。

- OpenClawは、metadataがmodel contextにならないように、provider replayおよびCompaction inputの前に `toolResult.details` を削除します。
- 永続化されたsession entryには、境界付き `details` のみが保持されます。大きすぎるdetailsは、簡潔な要約に置き換えられ、`persistedDetailsTruncated: true` が設定されます。
- `tool_result_persist` と `before_message_write` は、最終的な永続化capの前に実行されます。それでもhookは、返す `details` を小さく保つべきであり、prompt関連textを `details` のみに置くのは避けてください。modelに見せたいtool outputは `content` に置いてください。

## promptとmodel hook

新しいPluginでは、phase固有hookを使ってください。

- `before_model_resolve`: 現在のpromptとattachment metadataのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `before_prompt_build`: 現在のpromptとsession messageを受け取ります。`prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。

`before_agent_start` は互換性のために残されています。Pluginが旧combined phaseに依存しないよう、上記の明示的hookを推奨します。

`before_agent_start` と `agent_end` には、OpenClawがアクティブrunを識別できる場合、`event.runId` が含まれます。同じ値は `ctx.runId` でも利用できます。
Cron駆動runでは `ctx.jobId`（起点となったCron job id）も公開されるため、
Plugin hookはmetric、副作用、またはstateを特定のscheduled
jobに紐付けられます。

raw prompt、history、response、header、request
body、provider request IDを受け取るべきでないprovider-call telemetryには、
`model_call_started` と `model_call_ended` を使ってください。これらのhookには
`runId`、`callId`、`provider`、`model`、任意の `api` / `transport`、
終端の `durationMs` / `outcome`、およびOpenClawが導出できる場合の
`upstreamRequestIdHash` といった安定metadataが含まれます。

`before_agent_finalize` は、harnessが自然な最終assistant回答を受け入れようとする場合にのみ実行されます。これは `/stop` のcancel経路ではなく、ユーザーがturnを中断した場合には実行されません。最終化前にharnessにもう1回model passを要求するには `{ action: "revise", reason }` を返し、最終化を強制するには `{ action:
"finalize", reason? }` を返し、続行するには結果を省略してください。
Codexネイティブの `Stop` hookは、OpenClawの
`before_agent_finalize` decisionとしてこのhookに中継されます。

同梱されていないPluginが `llm_input`, `llm_output`,
`before_agent_finalize`, または `agent_end` を必要とする場合は、次を設定する必要があります。

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

promptを変更するhookは、pluginごとに
`plugins.entries.<id>.hooks.allowPromptInjection=false` で無効化できます。

## message hook

channelレベルのroutingおよび配信policyにはmessage hookを使ってください。

- `message_received`: inbound content、sender、`threadId`, `messageId`,
  `senderId`、任意のrun / session correlation、およびmetadataを観測する
- `message_sending`: `content` を書き換える、または `{ cancel: true }` を返す
- `message_sent`: 最終的な成功または失敗を観測する

audio専用のTTS replyでは、channel payloadに可視text / captionがなくても、`content` に隠れたspoken transcriptが含まれることがあります。この `content` を書き換えても、hook可視のtranscriptが更新されるだけで、media captionとして描画はされません。

message hook contextは、利用可能な場合に安定したcorrelation fieldを公開します:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, `ctx.callDepth`。旧metadataを読む前に、これらのfirst-class fieldを優先してください。

channel固有metadataを使う前に、型付き `threadId` と `replyToId` を優先してください。

decisionルール:

- `message_sending` の `cancel: true` は終端です。
- `message_sending` の `cancel: false` はdecisionなしとして扱われます。
- 書き換えられた `content` は、後続hookが配信をcancelしない限り、より低いpriorityのhookへ渡されます。

## install hook

`before_install` は、SkillおよびPlugin installに対する組み込みscanの後で実行されます。追加のfindingを返すか、installを停止するために `{ block: true, blockReason }` を返してください。

`block: true` は終端です。`block: false` はdecisionなしとして扱われます。

## Gateway lifecycle

Gateway所有stateを必要とするPlugin serviceには `gateway_start` を使ってください。contextは、Cronの検査と更新のために `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()` を公開します。長時間生きるresourceのcleanupには `gateway_stop` を使ってください。

Plugin所有runtime serviceに内部の `gateway:startup` hookを使うことには依存しないでください。

## 今後の非推奨事項

hook近傍のいくつかのsurfaceは非推奨ですが、まだサポートされています。次のmajor releaseまでに移行してください。

- **平文channel envelope** を `inbound_claim` と `message_received`
  handlerで使うこと。フラットなenvelope textを解析する代わりに、`BodyForAgent` と構造化されたuser-context blockを読んでください。
  [Plaintext channel envelopes → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations)を参照してください。
- **`before_agent_start`** は互換性のために残っています。新しいPluginでは、
  combined phaseの代わりに `before_model_resolve` と `before_prompt_build` を使ってください。
- **`before_tool_call` 内の `onResolution`** は、自由形式の `string` ではなく、
  型付き `PluginApprovalResolution` union（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`）を使うようになりました。

完全な一覧 — memory capability登録、provider thinking
profile、external auth provider、provider discovery type、task runtime
accessor、および `command-auth` → `command-status` のrename — については、
[Plugin SDK migration → Active deprecations](/ja-JP/plugins/sdk-migration#active-deprecations)を参照してください。

## 関連

- [Plugin SDK migration](/ja-JP/plugins/sdk-migration) — 現在有効な非推奨事項と削除予定時期
- [Building plugins](/ja-JP/plugins/building-plugins)
- [Plugin SDK overview](/ja-JP/plugins/sdk-overview)
- [Plugin entry points](/ja-JP/plugins/sdk-entrypoints)
- [Internal hooks](/ja-JP/automation/hooks)
- [Plugin architecture internals](/ja-JP/plugins/architecture-internals)
