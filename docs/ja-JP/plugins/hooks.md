---
read_when:
    - '`before_tool_call`、`before_agent_reply`、メッセージフック、またはライフサイクルフックを必要とする Plugin を構築している'
    - Plugin からのツール呼び出しをブロック、書き換え、または承認必須にする必要がある
    - 内部フックと Plugin フックのどちらを使うかを判断している
summary: 'Plugin フック: エージェント、ツール、メッセージ、セッション、および Gateway ライフサイクルイベントをインターセプトします'
title: Plugin フック
x-i18n:
    generated_at: "2026-04-25T18:19:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fa7554227cbb5d283e74c16d7e12ef524c494b8bb117a7ff4b37b49daa18af
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin フックは、OpenClaw Plugin 向けのインプロセス拡張ポイントです。Plugin がエージェント実行、ツール呼び出し、メッセージフロー、セッションライフサイクル、サブエージェントルーティング、インストール、または Gateway 起動を検査または変更する必要がある場合に使用します。

`/new`、`/reset`、`/stop`、`agent:bootstrap`、`gateway:startup` などのコマンドや Gateway イベント向けに、オペレーターがインストールする小さな `HOOK.md` スクリプトが必要な場合は、代わりに [internal hooks](/ja-JP/automation/hooks) を使用してください。

## クイックスタート

Plugin エントリから `api.on(...)` で型付き Plugin フックを登録します。

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

フックハンドラーは、`priority` の降順で順番に実行されます。同じ優先度のフックは登録順を維持します。

## フックカタログ

フックは、拡張する対象ごとにグループ化されています。**太字** の名前は決定結果（block、cancel、override、または require approval）を受け付けます。それ以外はすべて監視専用です。

**エージェントターン**

- `before_model_resolve` — セッションメッセージの読み込み前に provider または model を上書き
- `before_prompt_build` — モデル呼び出し前に動的コンテキストまたは system-prompt テキストを追加
- `before_agent_start` — 互換性専用の結合フェーズ。上記 2 つのフックを優先してください
- **`before_agent_reply`** — 合成返信または無応答でモデルターンを短絡
- `agent_end` — 最終メッセージ、成功状態、実行時間を監視

**会話の監視**

- `model_call_started` / `model_call_ended` — prompt や response 内容なしで、サニタイズ済みの provider/model 呼び出しメタデータ、タイミング、結果、および制限された request-id ハッシュを監視
- `llm_input` — provider 入力（system prompt、prompt、履歴）を監視
- `llm_output` — provider 出力を監視

**ツール**

- **`before_tool_call`** — ツールパラメータの書き換え、実行のブロック、または承認必須化
- `after_tool_call` — ツール結果、エラー、実行時間を監視
- **`tool_result_persist`** — ツール結果から生成された assistant メッセージを書き換え
- **`before_message_write`** — 進行中のメッセージ書き込みを検査またはブロック（まれ）

**メッセージと配信**

- **`inbound_claim`** — エージェントルーティング前に受信メッセージを claim（合成返信）
- `message_received` — 受信内容、送信者、スレッド、メタデータを監視
- **`message_sending`** — 送信内容の書き換え、または配信のキャンセル
- `message_sent` — 送信配信の成功または失敗を監視
- **`before_dispatch`** — チャネル引き渡し前に送信 dispatch を検査または書き換え
- **`reply_dispatch`** — 最終返信 dispatch パイプラインに参加

**セッションと Compaction**

- `session_start` / `session_end` — セッションライフサイクル境界を追跡
- `before_compaction` / `after_compaction` — Compaction サイクルを監視または注釈追加
- `before_reset` — セッションリセットイベント（`/reset`、プログラムによるリセット）を監視

**サブエージェント**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — サブエージェントのルーティングと完了配信を調整

**ライフサイクル**

- `gateway_start` / `gateway_stop` — Gateway とともに Plugin 所有サービスを開始または停止
- **`before_install`** — Skill または Plugin のインストールスキャンを検査し、必要に応じてブロック

## ツール呼び出しポリシー

`before_tool_call` は次を受け取ります。

- `event.toolName`
- `event.params`
- 省略可能な `event.runId`
- 省略可能な `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、および診断用の `ctx.trace` などのコンテキストフィールド

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

- `block: true` は終端であり、より低い優先度のハンドラーをスキップします。
- `block: false` は決定なしとして扱われます。
- `params` は実行用のツールパラメータを書き換えます。
- `requireApproval` はエージェント実行を一時停止し、plugin approvals を通じてユーザーに確認します。`/approve` コマンドは exec 承認と plugin 承認の両方を承認できます。
- より高い優先度のフックが承認を要求した後でも、より低い優先度の `block: true` でブロックできます。
- `onResolution` は解決された承認決定 `allow-once`、`allow-always`、`deny`、`timeout`、または `cancelled` を受け取ります。

## プロンプトとモデルのフック

新しい Plugin ではフェーズ固有のフックを使用してください。

- `before_model_resolve`: 現在の prompt と添付メタデータのみを受け取ります。`providerOverride` または `modelOverride` を返します。
- `before_prompt_build`: 現在の prompt とセッションメッセージを受け取ります。`prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を返します。

`before_agent_start` は互換性のために残されています。Plugin がレガシーな結合フェーズに依存しないよう、上記の明示的なフックを優先してください。

`before_agent_start` と `agent_end` には、OpenClaw がアクティブな実行を識別できる場合 `event.runId` が含まれます。同じ値は `ctx.runId` でも利用できます。

生の prompt、履歴、response、ヘッダー、request body、または provider request ID を受け取るべきでない provider 呼び出しテレメトリには、`model_call_started` と `model_call_ended` を使用してください。これらのフックには、`runId`、`callId`、`provider`、`model`、省略可能な `api` / `transport`、最終的な `durationMs` / `outcome`、および OpenClaw が制限された provider request-id ハッシュを導出できる場合の `upstreamRequestIdHash` などの安定したメタデータが含まれます。

バンドルされていない Plugin で `llm_input`、`llm_output`、または `agent_end` が必要な場合は、次を設定する必要があります。

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

prompt を変更するフックは、Plugin ごとに `plugins.entries.<id>.hooks.allowPromptInjection=false` で無効化できます。

## メッセージフック

チャネルレベルのルーティングと配信ポリシーには、メッセージフックを使用してください。

- `message_received`: 受信内容、送信者、`threadId`、`messageId`、`senderId`、省略可能な実行/セッション相関、およびメタデータを監視
- `message_sending`: `content` を書き換えるか、`{ cancel: true }` を返します
- `message_sent`: 最終的な成功または失敗を監視

音声のみの TTS 返信では、チャネル payload に表示テキストや caption がなくても、`content` に非表示の発話文字起こしが含まれる場合があります。その `content` を書き換えると、フックから見える文字起こしだけが更新され、メディア caption としてはレンダリングされません。

メッセージフックのコンテキストは、利用可能な場合に安定した相関フィールドを公開します:
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`、`ctx.callDepth`。レガシーなメタデータを読む前に、まずこれらのファーストクラスフィールドを優先してください。

チャネル固有メタデータを使う前に、型付きの `threadId` と `replyToId` を優先してください。

決定ルール:

- `message_sending` で `cancel: true` は終端です。
- `message_sending` で `cancel: false` は決定なしとして扱われます。
- 書き換えられた `content` は、後続のフックが配信をキャンセルしない限り、より低い優先度のフックへ渡されます。

## インストールフック

`before_install` は、Skill と Plugin のインストールに対する組み込みスキャンの後に実行されます。追加の findings を返すか、`{ block: true, blockReason }` を返してインストールを停止します。

`block: true` は終端です。`block: false` は決定なしとして扱われます。

## Gateway ライフサイクル

Gateway 所有状態が必要な Plugin サービスには `gateway_start` を使用してください。コンテキストは `ctx.config`、`ctx.workspaceDir`、および Cron の検査と更新のための `ctx.getCron?.()` を公開します。長時間動作するリソースのクリーンアップには `gateway_stop` を使用してください。

Plugin 所有のランタイムサービスに対して内部の `gateway:startup` フックに依存しないでください。

## 今後の非推奨項目

フック隣接の一部の対象は非推奨ですが、まだサポートされています。次のメジャーリリース前に移行してください。

- **`inbound_claim` と `message_received` ハンドラー内のプレーンテキストチャネルエンベロープ**。フラットなエンベロープテキストを解析するのではなく、`BodyForAgent` と構造化されたユーザーコンテキストブロックを読んでください。参照: [Plaintext channel envelopes → BodyForAgent](/ja-JP/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** は互換性のために残されています。新しい Plugin では、結合フェーズの代わりに `before_model_resolve` と `before_prompt_build` を使用してください。
- **`before_tool_call` の `onResolution`** は、自由形式の `string` ではなく、型付き `PluginApprovalResolution` ユニオン（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`）を使用するようになりました。

完全な一覧 — メモリ機能登録、provider thinking
profile、external auth providers、provider discovery types、task runtime
accessors、`command-auth` → `command-status` のリネーム — については、
[Plugin SDK migration → Active deprecations](/ja-JP/plugins/sdk-migration#active-deprecations) を参照してください。

## 関連

- [Plugin SDK migration](/ja-JP/plugins/sdk-migration) — 現在の非推奨項目と削除予定時期
- [Building plugins](/ja-JP/plugins/building-plugins)
- [Plugin SDK overview](/ja-JP/plugins/sdk-overview)
- [Plugin entry points](/ja-JP/plugins/sdk-entrypoints)
- [Internal hooks](/ja-JP/automation/hooks)
- [Plugin architecture internals](/ja-JP/plugins/architecture-internals)
