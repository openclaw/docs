---
read_when:
    - OpenClaw と通信する外部アプリ、スクリプト、ダッシュボード、CIジョブ、またはIDE拡張機能を構築している
    - App SDKとPlugin SDKのどちらを選ぶべきかを検討している
    - Gateway のエージェント実行、セッション、イベント、承認、モデル、またはツールと連携する場合
sidebarTitle: App SDK
summary: 外部アプリ、スクリプト、ダッシュボード、CIジョブ、IDE拡張機能向けの公開 OpenClaw App SDK
title: OpenClaw アプリ SDK
x-i18n:
    generated_at: "2026-05-01T05:00:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e531e985ca82026b230b03f8df5ab908d66e2b608e09c46af2ec060b9def0c24
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** は、OpenClaw プロセス外のアプリ向けの公開クライアント API です。スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能、またはその他の外部アプリが Gateway に接続し、エージェント実行を開始し、イベントをストリームし、結果を待機し、作業をキャンセルし、Gateway リソースを調査する場合は `@openclaw/sdk` を使用します。

<Note>
  App SDK は [Plugin SDK](/ja-JP/plugins/sdk-overview) とは異なります。
  `@openclaw/sdk` は OpenClaw の外部から Gateway と通信します。
  `openclaw/plugin-sdk/*` は、OpenClaw 内で実行され、プロバイダー、チャネル、ツール、フック、または信頼済みランタイムを登録する Plugin 専用です。
</Note>

## 現在提供されているもの

`@openclaw/sdk` には次が含まれています。

| サーフェス                | 状態    | 機能                                                                         |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | 準備完了 | メインのクライアントエントリポイント。トランスポート、接続、リクエスト、イベントを所有します。 |
| `GatewayClientTransport`  | 準備完了 | Gateway クライアントを基盤にした WebSocket トランスポート。                  |
| `oc.agents`               | 準備完了 | エージェントハンドルの一覧表示、作成、更新、削除、取得を行います。          |
| `Agent.run()`             | 準備完了 | Gateway `agent` 実行を開始し、`Run` を返します。                             |
| `oc.runs`                 | 準備完了 | 実行の作成、取得、待機、キャンセル、ストリームを行います。                  |
| `Run.events()`            | 準備完了 | 高速な実行向けのリプレイ付きで、実行ごとに正規化されたイベントをストリームします。 |
| `Run.wait()`              | 準備完了 | `agent.wait` を呼び出し、安定した `RunResult` を返します。                   |
| `Run.cancel()`            | 準備完了 | 実行 ID により `sessions.abort` を呼び出し、利用可能な場合はセッションキーも使います。 |
| `oc.sessions`             | 準備完了 | セッションハンドルの作成、解決、送信、パッチ、Compaction、取得を行います。  |
| `Session.send()`          | 準備完了 | `sessions.send` を呼び出し、`Run` を返します。                               |
| `oc.models`               | 準備完了 | `models.list` と現在の `models.authStatus` ステータス RPC を呼び出します。   |
| `oc.tools`                | 一部対応 | ツールカタログと有効なツールを一覧表示します。直接のツール呼び出しは接続されていません。 |
| `oc.artifacts`            | 準備完了 | Gateway トランスクリプトアーティファクトの一覧表示、取得、ダウンロードを行います。 |
| `oc.approvals`            | 準備完了 | Gateway 承認 RPC を通じて exec 承認を一覧表示および解決します。              |
| `oc.rawEvents()`          | 準備完了 | 高度なコンシューマー向けに生の Gateway イベントを公開します。               |
| `normalizeGatewayEvent()` | 準備完了 | 生の Gateway イベントを安定した SDK イベント形状に変換します。               |

SDK は、これらのサーフェスで使用される中核型もエクスポートします。
`AgentRunParams`、`RunResult`、`RunStatus`、`OpenClawEvent`、
`OpenClawEventType`、`GatewayEvent`、`OpenClawTransport`、
`GatewayRequestOptions`、`SessionCreateParams`、`SessionSendParams`、
`ArtifactSummary`、`ArtifactQuery`、`ArtifactsListResult`、
`ArtifactsGetResult`、`ArtifactsDownloadResult`、`RuntimeSelection`、
`EnvironmentSelection`、`WorkspaceSelection`、`ApprovalMode`、および関連する結果型です。

## Gateway に接続する

明示的な Gateway URL でクライアントを作成するか、テストや組み込みアプリランタイム向けにカスタムトランスポートを注入します。

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` は `url` と同等です。`gateway: "auto"` オプションはコンストラクターで受け付けられますが、自動 Gateway 検出はまだ独立した SDK 機能ではありません。アプリが Gateway の検出方法をまだ知らない場合は `url` を渡してください。

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

## エージェントを実行する

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

`openai/gpt-5.5` のようなプロバイダー修飾付きモデル参照は、Gateway の `provider` と `model` のオーバーライドに分割されます。`timeoutMs` は SDK 内ではミリ秒のままで、`agent` RPC 向けに Gateway のタイムアウト秒数へ変換されます。

`run.wait()` は Gateway の `agent.wait` RPC を使用します。実行がまだアクティブな間に待機期限が切れた場合、実行自体がタイムアウトしたかのように装うのではなく、`status: "accepted"` を返します。ランタイムのタイムアウト、中止された実行、キャンセルされた実行は、`timed_out` または `cancelled` に正規化されます。

## セッションを作成して再利用する

アプリが永続的なトランスクリプト状態を必要とする場合はセッションを使用します。

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` は `sessions.send` を呼び出し、`Run` を返します。セッションハンドルは次もサポートします。

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## イベントをストリームする

SDK は生の Gateway イベントを安定した `OpenClawEvent` エンベロープに正規化します。

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

| イベント型            | ソース Gateway イベント                    |
| --------------------- | ------------------------------------------- |
| `run.started`         | `agent` ライフサイクル開始                 |
| `run.completed`       | `agent` ライフサイクル終了                 |
| `run.failed`          | `agent` ライフサイクルエラー               |
| `run.cancelled`       | 中止またはキャンセルされたライフサイクル終了 |
| `run.timed_out`       | タイムアウトによるライフサイクル終了       |
| `assistant.delta`     | アシスタントのストリーミング差分           |
| `assistant.message`   | アシスタントメッセージ                     |
| `thinking.delta`      | 思考またはプランのストリーム               |
| `tool.call.started`   | ツール、項目、コマンドの開始               |
| `tool.call.delta`     | ツール、項目、コマンドの更新               |
| `tool.call.completed` | ツール、項目、コマンドの完了               |
| `tool.call.failed`    | ツール、項目、コマンドの失敗またはブロック状態 |
| `approval.requested`  | exec または Plugin 承認リクエスト          |
| `approval.resolved`   | exec または Plugin 承認の解決              |
| `session.created`     | `sessions.changed` 作成                    |
| `session.updated`     | `sessions.changed` 更新                    |
| `session.compacted`   | `sessions.changed` Compaction              |
| `task.updated`        | タスク更新イベント                         |
| `artifact.updated`    | パッチストリームイベント                   |
| `raw`                 | まだ安定した SDK マッピングがない任意のイベント |

`Run.events()` はイベントを 1 つの実行 ID に絞り込み、高速な実行のために既に確認済みのイベントをリプレイします。つまり、ドキュメント化された次のフローは安全です。

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

アプリ全体のストリームには `oc.events()` を使用します。生の Gateway フレームには `oc.rawEvents()` を使用します。

## モデル、ツール、アーティファクト、承認

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

アーティファクトヘルパーは、セッション、実行、またはタスクコンテキスト向けの Gateway アーティファクト投影を公開します。各呼び出しには、明示的な `sessionKey`、`runId`、または `taskId` スコープのいずれか 1 つが必要です。

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

承認ヘルパーは exec 承認 RPC を使用します。

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## 現在明示的にサポートされていないもの

SDK には今後目指すプロダクトモデル用の名前が含まれていますが、Gateway RPC が存在するかのように暗黙的に装うことはありません。現在、これらの呼び出しは明示的な未サポートエラーをスローします。

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

実行ごとの `workspace`、`runtime`、`environment`、`approvals` フィールドは将来の形状として型付けされていますが、現在の Gateway は `agent` RPC でこれらのオーバーライドをサポートしていません。呼び出し元がそれらを渡した場合、作業がデフォルトのワークスペース、ランタイム、環境、または承認動作で誤って実行されないよう、SDK は実行を送信する前にスローします。

## App SDK と Plugin SDK

コードが OpenClaw の外部にある場合は App SDK を使用します。

- エージェント実行を開始または監視する Node スクリプト
- Gateway を呼び出す CI ジョブ
- ダッシュボードと管理パネル
- IDE 拡張機能
- チャネル Plugin になる必要がない外部ブリッジ
- 偽または実際の Gateway トランスポートを使う統合テスト

コードが OpenClaw 内で実行される場合は Plugin SDK を使用します。

- プロバイダー Plugin
- チャネル Plugin
- ツールまたはライフサイクルフック
- エージェントハーネス Plugin
- 信頼済みランタイムヘルパー

App SDK コードは `@openclaw/sdk` からインポートする必要があります。Plugin コードは、ドキュメント化された `openclaw/plugin-sdk/*` サブパスからインポートする必要があります。この 2 つのコントラクトを混在させないでください。

## 関連ドキュメント

- [OpenClaw App SDK API 設計](/ja-JP/reference/openclaw-sdk-api-design)
- [Gateway RPC リファレンス](/ja-JP/reference/rpc)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [セッション](/ja-JP/concepts/session)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [ACP エージェント](/ja-JP/tools/acp-agents)
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
