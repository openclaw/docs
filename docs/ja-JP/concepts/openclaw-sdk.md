---
read_when:
    - OpenClaw と通信する外部アプリ、スクリプト、ダッシュボード、CI ジョブ、または IDE 拡張機能を構築している場合
    - App SDKとPlugin SDKのどちらを選ぶか
    - Gateway エージェントの実行、セッション、イベント、承認、モデル、またはツールと統合している
sidebarTitle: App SDK
summary: 外部アプリ、スクリプト、ダッシュボード、CIジョブ、IDE拡張機能向けの公開 OpenClaw アプリ SDK
title: OpenClaw アプリ SDK
x-i18n:
    generated_at: "2026-04-30T05:09:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** は、OpenClaw プロセスの外部にあるアプリ向けの公開クライアント API です。スクリプト、ダッシュボード、CI ジョブ、IDE 拡張、またはその他の外部アプリが Gateway へ接続し、エージェント実行を開始し、イベントをストリーミングし、結果を待機し、作業をキャンセルし、Gateway リソースを調べる場合は `@openclaw/sdk` を使用します。

<Note>
  App SDK は [Plugin SDK](/ja-JP/plugins/sdk-overview) とは異なります。
  `@openclaw/sdk` は OpenClaw の外部から Gateway と通信します。
  `openclaw/plugin-sdk/*` は、OpenClaw 内で実行され、プロバイダー、チャネル、ツール、フック、または信頼済みランタイムを登録する Plugin 専用です。
</Note>

## 現在同梱されているもの

`@openclaw/sdk` には次が含まれます。

| サーフェス                | 状態       | 役割                                                                         |
| ------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | 利用可能   | メインのクライアントエントリーポイント。トランスポート、接続、リクエスト、イベントを所有します。 |
| `GatewayClientTransport`  | 利用可能   | Gateway クライアントに支えられた WebSocket トランスポート。                  |
| `oc.agents`               | 利用可能   | エージェントハンドルの一覧表示、作成、更新、削除、取得を行います。           |
| `Agent.run()`             | 利用可能   | Gateway の `agent` 実行を開始し、`Run` を返します。                          |
| `oc.runs`                 | 利用可能   | 実行の作成、取得、待機、キャンセル、ストリーミングを行います。               |
| `Run.events()`            | 利用可能   | 高速な実行向けのリプレイ付きで、実行単位の正規化済みイベントをストリーミングします。 |
| `Run.wait()`              | 利用可能   | `agent.wait` を呼び出し、安定した `RunResult` を返します。                   |
| `Run.cancel()`            | 利用可能   | 実行 ID により `sessions.abort` を呼び出し、利用可能な場合はセッションキーも使います。 |
| `oc.sessions`             | 利用可能   | セッションハンドルの作成、解決、送信、パッチ適用、圧縮、取得を行います。     |
| `Session.send()`          | 利用可能   | `sessions.send` を呼び出し、`Run` を返します。                               |
| `oc.models`               | 利用可能   | `models.list` と現在の `models.authStatus` 状態 RPC を呼び出します。          |
| `oc.tools`                | 一部対応   | ツールカタログと有効なツールを一覧表示します。直接のツール呼び出しは未接続です。 |
| `oc.approvals`            | 利用可能   | Gateway の承認 RPC を通じて exec 承認の一覧表示と解決を行います。             |
| `oc.rawEvents()`          | 利用可能   | 高度な利用者向けに生の Gateway イベントを公開します。                        |
| `normalizeGatewayEvent()` | 利用可能   | 生の Gateway イベントを安定した SDK イベント形状へ変換します。               |

SDK は、これらのサーフェスで使われる中核型もエクスポートします。
`AgentRunParams`、`RunResult`、`RunStatus`、`OpenClawEvent`、
`OpenClawEventType`、`GatewayEvent`、`OpenClawTransport`、
`GatewayRequestOptions`、`SessionCreateParams`、`SessionSendParams`、
`RuntimeSelection`、`EnvironmentSelection`、`WorkspaceSelection`、
`ApprovalMode`、および関連する結果型です。

## Gateway への接続

明示的な Gateway URL でクライアントを作成するか、テストや埋め込みアプリランタイム向けにカスタムトランスポートを注入します。

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` は `url` と同等です。コンストラクターは `gateway: "auto"` オプションを受け付けますが、自動 Gateway 検出はまだ独立した SDK 機能ではありません。アプリが Gateway を検出する方法をすでに把握していない場合は `url` を渡してください。

テストでは、`OpenClawTransport` を実装するオブジェクトを渡します。

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## エージェントの実行

アプリがエージェントハンドルを必要とする場合は `oc.agents.get(id)` を使用し、その後 `agent.run()` を呼び出します。

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

`openai/gpt-5.5` のようなプロバイダー修飾モデル参照は、Gateway の `provider` と `model` のオーバーライドに分割されます。SDK 内の `timeoutMs` はミリ秒のままで、`agent` RPC 向けに Gateway のタイムアウト秒数へ変換されます。

`run.wait()` は Gateway の `agent.wait` RPC を使用します。実行がまだアクティブな間に待機期限が切れた場合、実行自体がタイムアウトしたように見せかけるのではなく、`status: "accepted"` を返します。ランタイムのタイムアウト、中止された実行、キャンセルされた実行は、`timed_out` または `cancelled` に正規化されます。

## セッションの作成と再利用

アプリが永続的なトランスクリプト状態を必要とする場合は、セッションを使用します。

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` は `sessions.send` を呼び出し、`Run` を返します。セッションハンドルは次にも対応しています。

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## イベントのストリーミング

SDK は、生の Gateway イベントを安定した `OpenClawEvent` エンベロープへ正規化します。

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: GatewayEvent;
};
```

一般的なイベント型は次のとおりです。

| イベント型            | 元の Gateway イベント                       |
| --------------------- | ------------------------------------------- |
| `run.started`         | `agent` ライフサイクル開始                  |
| `run.completed`       | `agent` ライフサイクル終了                  |
| `run.failed`          | `agent` ライフサイクルエラー                |
| `run.cancelled`       | 中止/キャンセルされたライフサイクル終了     |
| `run.timed_out`       | タイムアウトのライフサイクル終了            |
| `assistant.delta`     | アシスタントのストリーミング差分            |
| `assistant.message`   | アシスタントメッセージ                      |
| `thinking.delta`      | 思考またはプランのストリーム                |
| `tool.call.started`   | ツール/項目/コマンドの開始                  |
| `tool.call.delta`     | ツール/項目/コマンドの更新                  |
| `tool.call.completed` | ツール/項目/コマンドの完了                  |
| `tool.call.failed`    | ツール/項目/コマンドの失敗またはブロック状態 |
| `approval.requested`  | exec または Plugin 承認リクエスト           |
| `approval.resolved`   | exec または Plugin 承認の解決               |
| `session.created`     | `sessions.changed` の作成                   |
| `session.updated`     | `sessions.changed` の更新                   |
| `session.compacted`   | `sessions.changed` の圧縮                   |
| `task.updated`        | タスク更新イベント                          |
| `artifact.updated`    | パッチストリームイベント                    |
| `raw`                 | まだ安定した SDK マッピングがない任意のイベント |

`Run.events()` はイベントを 1 つの実行 ID に絞り込み、高速な実行向けに、すでに確認済みのイベントをリプレイします。つまり、記載されている次のフローは安全です。

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

アプリ全体のストリームには `oc.events()` を使用します。生の Gateway フレームには `oc.rawEvents()` を使用します。

## モデル、ツール、承認

モデルヘルパーは現在の Gateway メソッドに対応します。

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

ツールヘルパーは Gateway カタログと有効なツールビューを公開します。

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

承認ヘルパーは exec 承認 RPC を使用します。

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## 現時点で明示的に非対応

SDK には目指すプロダクトモデルの名前が含まれていますが、Gateway RPC が存在するかのように黙って振る舞うことはありません。現在、次の呼び出しは明示的な非対応エラーを投げます。

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

実行単位の `workspace`、`runtime`、`environment`、`approvals` フィールドは将来の形状として型付けされていますが、現在の Gateway は `agent` RPC でこれらのオーバーライドをサポートしていません。呼び出し元がこれらを渡した場合、SDK は実行を送信する前に例外を投げます。これにより、デフォルトのワークスペース、ランタイム、環境、または承認の挙動で作業が誤って実行されることを防ぎます。

## App SDK と Plugin SDK の違い

コードが OpenClaw の外部にある場合は App SDK を使用します。

- エージェント実行を開始または監視する Node スクリプト
- Gateway を呼び出す CI ジョブ
- ダッシュボードと管理パネル
- IDE 拡張
- チャネル Plugin になる必要がない外部ブリッジ
- 偽または実際の Gateway トランスポートを使う統合テスト

コードが OpenClaw 内で実行される場合は Plugin SDK を使用します。

- プロバイダー Plugin
- チャネル Plugin
- ツールまたはライフサイクルフック
- エージェントハーネス Plugin
- 信頼済みランタイムヘルパー

App SDK コードは `@openclaw/sdk` からインポートする必要があります。Plugin コードは、ドキュメント化された `openclaw/plugin-sdk/*` サブパスからインポートする必要があります。この 2 つの契約を混在させないでください。

## 関連ドキュメント

- [OpenClaw App SDK API 設計](/ja-JP/reference/openclaw-sdk-api-design)
- [Gateway RPC リファレンス](/ja-JP/reference/rpc)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [セッション](/ja-JP/concepts/session)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [ACP エージェント](/ja-JP/tools/acp-agents)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
