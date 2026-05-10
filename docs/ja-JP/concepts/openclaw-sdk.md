---
read_when:
    - OpenClaw と通信する外部アプリ、スクリプト、ダッシュボード、CI ジョブ、または IDE 拡張機能を構築している
    - App SDK と Plugin SDK のどちらを選ぶか
    - Gateway のエージェント実行、セッション、イベント、承認、モデル、またはツールと連携している
sidebarTitle: App SDK
summary: 外部アプリ、スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能向けの公開 OpenClaw App SDK
title: OpenClaw アプリ SDK
x-i18n:
    generated_at: "2026-05-10T19:32:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc339e9f29dd1297353d85827dbac207311a9633e1ab6cc47dace80a72259356
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK**は、OpenClawプロセスの外部にあるアプリ向けの公開クライアントAPIです。スクリプト、ダッシュボード、CIジョブ、IDE拡張、その他の外部アプリがGatewayへ接続し、agent runを開始し、イベントをストリームし、結果を待機し、作業をキャンセルし、Gatewayリソースを検査したい場合は`@openclaw/sdk`を使用します。

<Note>
  App SDKは[Plugin SDK](/ja-JP/plugins/sdk-overview)とは異なります。
  `@openclaw/sdk`はOpenClawの外部からGatewayと通信します。
  `openclaw/plugin-sdk/*`は、OpenClaw内部で実行され、プロバイダー、チャンネル、ツール、フック、信頼済みランタイムを登録するPlugin専用です。
</Note>

## 現在提供されているもの

`@openclaw/sdk`には次が含まれています。

| サーフェス                | 状態    | 機能                                                                              |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | 準備完了 | メインのクライアントエントリポイント。transport、接続、リクエスト、イベントを所有します。 |
| `GatewayClientTransport`  | 準備完了 | Gatewayクライアントに支えられたWebSocket transport。                              |
| `oc.agents`               | 準備完了 | agentハンドルを一覧表示、作成、更新、削除、取得します。                          |
| `Agent.run()`             | 準備完了 | Gatewayの`agent` runを開始し、`Run`を返します。                                  |
| `oc.runs`                 | 準備完了 | runを作成、取得、待機、キャンセル、ストリームします。                            |
| `Run.events()`            | 準備完了 | 高速なrun向けのリプレイ付きで、runごとの正規化済みイベントをストリームします。   |
| `Run.wait()`              | 準備完了 | `agent.wait`を呼び出し、安定した`RunResult`を返します。                          |
| `Run.cancel()`            | 準備完了 | run idで`sessions.abort`を呼び出し、利用可能な場合はsession keyも使用します。     |
| `oc.sessions`             | 準備完了 | sessionハンドルを作成、解決、送信、パッチ、compact、取得します。                 |
| `Session.send()`          | 準備完了 | `sessions.send`を呼び出し、`Run`を返します。                                     |
| `oc.tasks`                | 準備完了 | Gateway task台帳のエントリを一覧表示、読み取り、キャンセルします。               |
| `oc.models`               | 準備完了 | `models.list`と現在の`models.authStatus`ステータスRPCを呼び出します。            |
| `oc.tools`                | 準備完了 | ポリシーパイプラインを通じてGatewayツールを一覧表示、スコープ設定、呼び出します。 |
| `oc.artifacts`            | 準備完了 | Gateway transcript artifactを一覧表示、取得、ダウンロードします。                |
| `oc.approvals`            | 準備完了 | Gateway approval RPCを通じてexec approvalを一覧表示、解決します。                |
| `oc.environments`         | 一部対応 | Gateway-localおよびnode environment候補を一覧表示します。create/deleteは未接続です。 |
| `oc.rawEvents()`          | 準備完了 | 高度なコンシューマー向けに生のGatewayイベントを公開します。                      |
| `normalizeGatewayEvent()` | 準備完了 | 生のGatewayイベントを安定したSDKイベント形状に変換します。                       |

SDKは、これらのサーフェスで使用されるコア型もエクスポートします。
`AgentRunParams`、`RunResult`、`RunStatus`、`OpenClawEvent`、
`OpenClawEventType`、`GatewayEvent`、`OpenClawTransport`、
`GatewayRequestOptions`、`SessionCreateParams`、`SessionSendParams`、
`ArtifactSummary`、`ArtifactQuery`、`ArtifactsListResult`、
`ArtifactsGetResult`、`ArtifactsDownloadResult`、
`TaskSummary`、`TaskStatus`、`TasksListParams`、`TasksListResult`、
`TasksGetResult`、`TasksCancelResult`、`RuntimeSelection`、
`EnvironmentSelection`、`WorkspaceSelection`、`ApprovalMode`、および関連する
結果型です。

## Gatewayへ接続する

明示的なGateway URLでクライアントを作成するか、テストや組み込みアプリランタイム向けにカスタムtransportを注入します。

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })`は`url`と同等です。`gateway: "auto"`オプションはコンストラクターで受け付けられますが、自動Gateway discoveryはまだ独立したSDK機能ではありません。アプリがGatewayの検出方法をまだ知らない場合は`url`を渡してください。

テストでは、`OpenClawTransport`を実装するオブジェクトを渡します。

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

## agentを実行する

アプリがagentハンドルを必要とする場合は`oc.agents.get(id)`を使用し、その後`agent.run()`を呼び出します。

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

`openai/gpt-5.5`のようなプロバイダー修飾付きmodel refは、Gatewayの`provider`および`model`オーバーライドに分割されます。`timeoutMs`はSDK内ではミリ秒のままで、`agent` RPC向けにGateway timeout秒へ変換されます。

`run.wait()`はGatewayの`agent.wait` RPCを使用します。runがまだアクティブな間にwait期限が切れた場合、run自体がタイムアウトしたかのように見せかけるのではなく、`status: "accepted"`を返します。ランタイムタイムアウト、中止されたrun、キャンセルされたrunは、`timed_out`または`cancelled`に正規化されます。

## sessionを作成して再利用する

アプリが永続的なtranscript状態を必要とする場合はsessionを使用します。

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()`は`sessions.send`を呼び出し、`Run`を返します。sessionハンドルは次もサポートします。

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## イベントをストリームする

SDKは生のGatewayイベントを安定した`OpenClawEvent`エンベロープに正規化します。

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

一般的なイベントタイプには次が含まれます。

| イベントタイプ        | 元のGatewayイベント                         |
| --------------------- | ------------------------------------------- |
| `run.started`         | `agent`ライフサイクル開始                   |
| `run.completed`       | `agent`ライフサイクル終了                   |
| `run.failed`          | `agent`ライフサイクルエラー                 |
| `run.cancelled`       | 中止/キャンセルされたライフサイクル終了     |
| `run.timed_out`       | タイムアウトによるライフサイクル終了        |
| `assistant.delta`     | Assistantストリーミング差分                 |
| `assistant.message`   | Assistantメッセージ                         |
| `thinking.delta`      | 思考またはplanストリーム                    |
| `tool.call.started`   | ツール/item/command開始                     |
| `tool.call.delta`     | ツール/item/command更新                     |
| `tool.call.completed` | ツール/item/command完了                     |
| `tool.call.failed`    | ツール/item/command失敗またはブロック状態   |
| `approval.requested`  | ExecまたはPlugin approval request           |
| `approval.resolved`   | ExecまたはPlugin approval resolution        |
| `session.created`     | `sessions.changed`作成                      |
| `session.updated`     | `sessions.changed`更新                      |
| `session.compacted`   | `sessions.changed` compaction               |
| `task.updated`        | Task更新イベント                            |
| `artifact.updated`    | Patchストリームイベント                     |
| `raw`                 | まだ安定したSDKマッピングがない任意のイベント |

`Run.events()`はイベントを1つのrun idに絞り込み、高速なrun向けにすでに見たイベントをリプレイします。つまり、ドキュメント化された次のフローは安全です。

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

アプリ全体のストリームには`oc.events()`を使用します。生のGatewayフレームには`oc.rawEvents()`を使用します。

## モデル、ツール、artifact、approval

モデルヘルパーは現在のGatewayメソッドに対応します。

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

ツールヘルパーは、Gatewayカタログ、有効なツールビュー、直接のGatewayツール呼び出しを公開します。`oc.tools.invoke()`は、ポリシーまたはapproval拒否でthrowするのではなく、型付きエンベロープを返します。

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

artifactヘルパーは、session、run、またはtaskコンテキスト向けのGateway artifact projectionを公開します。各呼び出しには、明示的な`sessionKey`、`runId`、または`taskId`スコープが1つ必要です。

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

approvalヘルパーはexec approval RPCを使用します。

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

taskヘルパーは、`openclaw tasks`も支える永続的なtask台帳を使用します。

```typescript
const tasks = await oc.tasks.list({ status: "running", sessionKey: "agent:main:main" });
const task = await oc.tasks.get(tasks.tasks[0].id);
await oc.tasks.cancel(task.task.id, { reason: "user stopped task" });
```

environmentヘルパーは、読み取り専用のGateway-localおよびnode discoveryを公開します。

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## 現在明示的に未対応のもの

SDKには目指しているプロダクトモデル向けの名前が含まれていますが、Gateway RPCが存在するかのように暗黙的に振る舞うことはありません。これらの呼び出しは現在、明示的なunsupported errorをthrowします。

```typescript
await oc.environments.create({});
await oc.environments.delete("environment-id");
```

runごとの`workspace`、`runtime`、`environment`、`approvals`フィールドは将来の形状として型付けされていますが、現在のGatewayは`agent` RPC上でこれらのオーバーライドをサポートしていません。呼び出し元がそれらを渡した場合、SDKはrunを送信する前にthrowするため、デフォルトのworkspace、runtime、environment、approval動作で作業が誤って実行されることはありません。

## App SDKとPlugin SDK

コードがOpenClawの外部にある場合はApp SDKを使用します。

- agent runを開始または監視するNodeスクリプト
- Gatewayを呼び出すCIジョブ
- ダッシュボードと管理パネル
- IDE拡張
- channel pluginになる必要がない外部ブリッジ
- 偽または実際のGateway transportを使うintegration test

コードがOpenClaw内部で実行される場合はPlugin SDKを使用します。

- provider plugin
- channel plugin
- ツールまたはライフサイクルフック
- agent harness plugin
- 信頼済みランタイムヘルパー

App SDKコードは`@openclaw/sdk`からimportする必要があります。Pluginコードは、ドキュメント化された`openclaw/plugin-sdk/*`サブパスからimportする必要があります。2つの契約を混在させないでください。

## 関連

- [OpenClaw App SDK API 設計](/ja-JP/reference/openclaw-sdk-api-design)
- [Gateway RPC リファレンス](/ja-JP/reference/rpc)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [セッション](/ja-JP/concepts/session)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [ACP エージェント](/ja-JP/tools/acp-agents)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
