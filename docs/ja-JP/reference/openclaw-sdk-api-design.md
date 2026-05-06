---
read_when:
    - 提案されている公開 OpenClaw アプリ SDK を実装しています
    - アプリ SDK のドラフト名前空間、イベント、結果、アーティファクト、承認、またはセキュリティ契約が必要です
    - Gateway プロトコルリソースを、高レベルの OpenClaw App SDK ラッパーと比較しています
sidebarTitle: App SDK API design
summary: OpenClaw App SDK の公開 API、イベント分類、アーティファクト、承認、パッケージ構造に関する参照設計
title: OpenClaw アプリ SDK API の設計
x-i18n:
    generated_at: "2026-05-06T05:18:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca2d98914ab83c1752211489f9966ee62da13f7435781356548c0646f5739195
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

このページは、公開 [OpenClaw アプリ SDK](/ja-JP/concepts/openclaw-sdk) の詳細な API リファレンス設計です。これは意図的に [Plugin SDK](/ja-JP/plugins/sdk-overview) とは分けられています。

<Note>
  `@openclaw/sdk` は Gateway と通信するための外部アプリ/クライアントパッケージです。`openclaw/plugin-sdk/*` はプロセス内の Plugin 作成コントラクトです。エージェントを実行するだけのアプリから Plugin SDK のサブパスをインポートしないでください。
</Note>

公開アプリ SDK は 2 つのレイヤーで構築する必要があります。

1. 低レベルの生成済み Gateway クライアント。
2. `OpenClaw`、`Agent`、`Session`、`Run`、`Task`、`Artifact`、`Approval`、`Environment` オブジェクトを備えた、高レベルで扱いやすいラッパー。

## 名前空間設計

低レベルの名前空間は、Gateway リソースにできるだけ近づける必要があります。

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId);
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

高レベルのラッパーは、一般的なフローを快適にするオブジェクトを返す必要があります。

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## イベントコントラクト

公開 SDK は、バージョン付きで再生可能な正規化済みイベントを公開する必要があります。

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
  raw?: unknown;
};
```

`id` は再生カーソルです。コンシューマーは `events({ after: id })` で再接続し、保持期間が許す場合は取り逃がしたイベントを受信できる必要があります。

推奨される正規化済みイベントファミリー:

| イベント              | 意味                                                        |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run が受け付けられました。                                  |
| `run.queued`          | Run がセッションレーン、ランタイム、または環境を待っています。 |
| `run.started`         | ランタイムが実行を開始しました。                            |
| `run.completed`       | Run が正常に終了しました。                                  |
| `run.failed`          | Run がエラーで終了しました。                                |
| `run.cancelled`       | Run がキャンセルされました。                                |
| `run.timed_out`       | Run がタイムアウトを超過しました。                          |
| `assistant.delta`     | アシスタントのテキスト差分。                                |
| `assistant.message`   | 完全なアシスタントメッセージ、または置換。                  |
| `thinking.delta`      | ポリシーで公開が許可されている場合の推論または計画の差分。 |
| `tool.call.started`   | ツール呼び出しが開始されました。                            |
| `tool.call.delta`     | ツール呼び出しが進捗または部分出力をストリーミングしました。 |
| `tool.call.completed` | ツール呼び出しが正常に返りました。                          |
| `tool.call.failed`    | ツール呼び出しに失敗しました。                              |
| `approval.requested`  | Run またはツールに承認が必要です。                          |
| `approval.resolved`   | 承認が許可、拒否、期限切れ、またはキャンセルされました。    |
| `question.requested`  | ランタイムがユーザーまたはホストアプリに入力を求めています。 |
| `question.answered`   | ホストアプリが回答を提供しました。                          |
| `artifact.created`    | 新しいアーティファクトが利用可能です。                      |
| `artifact.updated`    | 既存のアーティファクトが変更されました。                    |
| `session.created`     | セッションが作成されました。                                |
| `session.updated`     | セッションメタデータが変更されました。                      |
| `session.compacted`   | セッションの Compaction が発生しました。                    |
| `task.updated`        | バックグラウンドタスクの状態が変更されました。              |
| `git.branch`          | ランタイムがブランチ状態を観測または変更しました。          |
| `git.diff`            | ランタイムが diff を生成または変更しました。                |
| `git.pr`              | ランタイムがプルリクエストを開く、更新する、またはリンクしました。 |

ランタイムネイティブのペイロードは `raw` から利用できる必要がありますが、通常の UI でアプリが `raw` を解析する必要はありません。

## 結果コントラクト

`Run.wait()` は安定した結果エンベロープを返す必要があります。

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

結果は平凡で安定している必要があります。タイムスタンプ値は Gateway の形状を保持するため、現在のライフサイクルに基づく Run は通常エポックミリ秒の数値を報告しますが、アダプターは引き続き ISO 文字列を表面化する場合があります。リッチな UI、ツールトレース、ランタイムネイティブの詳細は、イベントとアーティファクトに属します。

`accepted` は非終端の待機結果です。これは、Run がライフサイクルの終了/エラーを生成する前に Gateway の待機期限が切れたことを意味します。`timed_out` として扱ってはいけません。`timed_out` は、Run が自身のランタイムタイムアウトを超過した場合に予約されています。

## 承認と質問

コーディングエージェントは安全境界を頻繁に越えるため、承認は第一級の概念である必要があります。

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

承認イベントには以下を含める必要があります。

- 承認 ID
- Run ID とセッション ID
- リクエスト種別
- 要求されたアクションの概要
- ツール名または環境アクション
- リスクレベル
- 利用可能な判断
- 有効期限
- 判断を再利用できるかどうか

質問は承認とは別です。質問は、ユーザーまたはホストアプリに情報を求めます。承認は、アクションを実行する許可を求めます。

## ToolSpace モデル

アプリは、Plugin の内部実装をインポートせずにツールサーフェスを理解する必要があります。

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK は以下を公開する必要があります。

- 正規化済みツールメタデータ
- ソース: OpenClaw、MCP、Plugin、チャネル、ランタイム、またはアプリ
- スキーマ概要
- 承認ポリシー
- ランタイム互換性
- ツールが非表示、読み取り専用、書き込み可能、またはホスト可能かどうか

SDK 経由のツール呼び出しは、明示的でスコープ設定されている必要があります。ほとんどのアプリは、任意のツールを直接呼び出すのではなく、エージェントを実行するべきです。

## アーティファクトモデル

アーティファクトはファイル以外も対象にする必要があります。

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

一般的な例:

- ファイル編集と生成ファイル
- パッチバンドル
- VCS diff
- スクリーンショットとメディア出力
- ログとトレースバンドル
- プルリクエストリンク
- ランタイム軌跡
- 管理対象環境のワークスペーススナップショット

アーティファクトアクセスは、すべてのアーティファクトが通常のローカルファイルであると仮定せずに、墨消し、保持、ダウンロード URL をサポートする必要があります。

## セキュリティモデル

アプリ SDK は権限について明示的である必要があります。

推奨されるトークンスコープ:

| スコープ            | 許可すること                                          |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | エージェントの一覧表示と検査。                       |
| `agent.run`         | Run の開始。                                         |
| `session.read`      | セッションメタデータとメッセージの読み取り。         |
| `session.write`     | セッションの作成、送信、フォーク、コンパクト化、中止。 |
| `task.read`         | バックグラウンドタスク状態の読み取り。               |
| `task.write`        | タスク通知ポリシーのキャンセルまたは変更。           |
| `approval.respond`  | リクエストの承認または拒否。                         |
| `tools.invoke`      | 公開されたツールの直接呼び出し。                     |
| `artifacts.read`    | アーティファクトの一覧表示とダウンロード。           |
| `environment.write` | 管理対象環境の作成または破棄。                       |
| `admin`             | 管理操作。                                           |

デフォルト:

- デフォルトではシークレットを転送しない
- 環境変数の無制限なパススルーをしない
- シークレット値ではなくシークレット参照を使用する
- 明示的なサンドボックスとネットワークポリシー
- 明示的なリモート環境の保持
- ポリシーが別の扱いを証明しない限り、ホスト実行には承認が必要
- 呼び出し元がより強い診断スコープを持つ場合を除き、raw ランタイムイベントは Gateway を離れる前に墨消しされる

## 管理対象環境プロバイダー

管理対象エージェントは、環境プロバイダーとして実装する必要があります。

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

最初の実装は、ホスト型 SaaS である必要はありません。既存の Node ホスト、一時ワークスペース、CI 形式のランナー、または Testbox 形式の環境を対象にできます。重要なコントラクトは以下です。

1. ワークスペースを準備する
2. 安全な環境とシークレットをバインドする
3. Run を開始する
4. イベントをストリーミングする
5. アーティファクトを収集する
6. ポリシーに従ってクリーンアップまたは保持する

これが安定すれば、ホスト型クラウドサービスは同じプロバイダーコントラクトを実装できます。

## パッケージ構造

推奨パッケージ:

| パッケージ            | 目的                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | 公開高レベル SDK と生成済み低レベル Gateway クライアント。    |
| `@openclaw/sdk-react`   | ダッシュボードとアプリビルダー向けの任意の React フック。     |
| `@openclaw/sdk-testing` | アプリ統合向けのテストヘルパーとフェイク Gateway サーバー。  |

このリポジトリには、Plugin 用の `openclaw/plugin-sdk/*` がすでにあります。Plugin 作者とアプリ開発者の混同を避けるため、その名前空間は分けておいてください。

## 生成済みクライアント戦略

低レベルクライアントは、バージョン付き Gateway プロトコルスキーマから生成し、その後、手書きの扱いやすいクラスでラップする必要があります。

レイヤー構成:

1. Gateway スキーマの信頼できる唯一の情報源。
2. 生成された低レベルの TypeScript クライアント。
3. 外部入力とイベントペイロード用のランタイムバリデーター。
4. 高レベルの `OpenClaw`、`Agent`、`Session`、`Run`、`Task`、`Artifact`
   ラッパー。
5. クックブックの例と統合テスト。

メリット:

- プロトコルのずれが見えるようになる
- テストで、生成されたメソッドを Gateway のエクスポートと比較できる
- App SDK は Plugin SDK の内部から独立したままになる
- 低レベルのコンシューマーもプロトコル全体にアクセスできる
- 高レベルのコンシューマーは小さなプロダクト API を利用できる

## 関連ドキュメント

- [OpenClaw App SDK](/ja-JP/concepts/openclaw-sdk)
- [Gateway RPC リファレンス](/ja-JP/reference/rpc)
- [Agent ループ](/ja-JP/concepts/agent-loop)
- [Agent ランタイム](/ja-JP/concepts/agent-runtimes)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [ACP agents](/ja-JP/tools/acp-agents)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
