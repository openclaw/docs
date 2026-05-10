---
read_when:
    - 提案されている公開 OpenClaw アプリ SDK を実装しています
    - アプリ SDK のドラフト名前空間、イベント、結果、アーティファクト、承認、またはセキュリティ契約が必要です
    - Gateway プロトコルリソースを高レベルの OpenClaw App SDK ラッパーと比較しています
sidebarTitle: App SDK API design
summary: 公開 OpenClaw アプリ SDK API、イベント分類体系、アーティファクト、承認、パッケージ構造のリファレンス設計
title: OpenClaw App SDK API の設計
x-i18n:
    generated_at: "2026-05-10T19:51:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eab11a5dfb85465e7d6da971fba779baaef06fd333eb53a39b53d7150e85b72
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

このページは、公開
[OpenClaw App SDK](/ja-JP/concepts/openclaw-sdk) の詳細な API リファレンス設計です。これは意図的に
[Plugin SDK](/ja-JP/plugins/sdk-overview) とは分けられています。

<Note>
  `@openclaw/sdk` は Gateway と通信するための外部アプリ/クライアントパッケージです。
  `openclaw/plugin-sdk/*` はインプロセスのプラグイン作成契約です。
  エージェントを実行するだけのアプリから Plugin SDK のサブパスをインポートしないでください。
</Note>

公開アプリ SDK は 2 つのレイヤーで構築する必要があります。

1. 低レベルの生成済み Gateway クライアント。
2. `OpenClaw`、`Agent`、`Session`、`Run`、
   `Task`、`Artifact`、`Approval`、`Environment` オブジェクトを備えた高レベルで使いやすいラッパー。

## 名前空間設計

低レベルの名前空間は Gateway リソースに厳密に従う必要があります。

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

oc.tasks.list({ status: "running" });
oc.tasks.get(taskId);
oc.tasks.cancel(taskId, { reason });
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

## イベント契約

公開 SDK は、バージョン付きで再生可能な正規化イベントを公開する必要があります。

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

`id` は再生カーソルです。利用側は
`events({ after: id })` で再接続し、保持期間が許す場合は見逃したイベントを受け取れる必要があります。

推奨される正規化イベントファミリー:

| イベント              | 意味                                                        |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | 実行が受け付けられた。                                    |
| `run.queued`          | 実行がセッションレーン、ランタイム、または環境を待っている。 |
| `run.started`         | ランタイムが実行を開始した。                              |
| `run.completed`       | 実行が正常に完了した。                                    |
| `run.failed`          | 実行がエラーで終了した。                                  |
| `run.cancelled`       | 実行がキャンセルされた。                                  |
| `run.timed_out`       | 実行がタイムアウトを超過した。                            |
| `assistant.delta`     | アシスタントのテキスト差分。                              |
| `assistant.message`   | 完全なアシスタントメッセージまたは置換。                  |
| `thinking.delta`      | ポリシーで公開が許可される場合の推論または計画の差分。    |
| `tool.call.started`   | ツール呼び出しが開始された。                              |
| `tool.call.delta`     | ツール呼び出しが進行状況または部分出力をストリームした。  |
| `tool.call.completed` | ツール呼び出しが正常に返された。                          |
| `tool.call.failed`    | ツール呼び出しが失敗した。                                |
| `approval.requested`  | 実行またはツールに承認が必要。                            |
| `approval.resolved`   | 承認が許可、拒否、期限切れ、またはキャンセルされた。      |
| `question.requested`  | ランタイムがユーザーまたはホストアプリに入力を求めている。 |
| `question.answered`   | ホストアプリが回答を提供した。                            |
| `artifact.created`    | 新しい成果物が利用可能になった。                          |
| `artifact.updated`    | 既存の成果物が変更された。                                |
| `session.created`     | セッションが作成された。                                  |
| `session.updated`     | セッションのメタデータが変更された。                      |
| `session.compacted`   | セッションの Compaction が発生した。                       |
| `task.updated`        | バックグラウンドタスクの状態が変更された。                |
| `git.branch`          | ランタイムがブランチ状態を観測または変更した。            |
| `git.diff`            | ランタイムが diff を生成または変更した。                   |
| `git.pr`              | ランタイムがプルリクエストを作成、更新、またはリンクした。 |

ランタイムネイティブのペイロードは `raw` から利用可能にする必要がありますが、通常の UI でアプリが `raw` を解析する必要があってはなりません。

## 結果契約

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

結果は平凡で安定している必要があります。タイムスタンプ値は Gateway の形状を保持するため、現在のライフサイクルに基づく実行は通常エポックミリ秒の数値を報告しますが、アダプターはまだ ISO 文字列を公開する場合があります。リッチな UI、ツールトレース、ランタイムネイティブの詳細は、イベントと成果物に属します。

`accepted` は非終端の待機結果です。これは、実行がライフサイクルの終了/エラーを生成する前に Gateway の待機期限が切れたことを意味します。`timed_out` として扱ってはなりません。`timed_out` は、実行が自身のランタイムタイムアウトを超過した場合に予約されています。

## 承認と質問

コーディングエージェントは安全境界を頻繁にまたぐため、承認はファーストクラスでなければなりません。

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

承認イベントは次を含む必要があります。

- 承認 ID
- 実行 ID とセッション ID
- リクエスト種別
- 要求されたアクションの概要
- ツール名または環境アクション
- リスクレベル
- 利用可能な判断
- 有効期限
- 判断を再利用できるかどうか

質問は承認とは別です。質問はユーザーまたはホストアプリに情報を求めます。承認はアクションを実行する許可を求めます。

## ToolSpace モデル

アプリは、プラグイン内部をインポートせずにツールサーフェスを理解する必要があります。

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK は次を公開する必要があります。

- 正規化されたツールメタデータ
- ソース: OpenClaw、MCP、プラグイン、チャンネル、ランタイム、またはアプリ
- スキーマ概要
- 承認ポリシー
- ランタイム互換性
- ツールが非表示、読み取り専用、書き込み可能、またはホスト対応かどうか

SDK 経由のツール呼び出しは明示的でスコープ付きである必要があります。ほとんどのアプリは任意のツールを直接呼び出すのではなく、エージェントを実行するべきです。

## 成果物モデル

成果物はファイル以外もカバーする必要があります。

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

成果物アクセスは、すべての成果物が通常のローカルファイルであると仮定せずに、墨消し、保持、ダウンロード URL をサポートする必要があります。

## セキュリティモデル

アプリ SDK は権限について明示的でなければなりません。

推奨されるトークンスコープ:

| スコープ            | 許可する内容                                          |
| ------------------- | ----------------------------------------------------- |
| `agent.read`        | エージェントの一覧表示と検査。                       |
| `agent.run`         | 実行の開始。                                         |
| `session.read`      | セッションメタデータとメッセージの読み取り。         |
| `session.write`     | セッションの作成、送信、フォーク、Compaction、中止。 |
| `task.read`         | バックグラウンドタスク状態の読み取り。               |
| `task.write`        | タスク通知ポリシーのキャンセルまたは変更。           |
| `approval.respond`  | リクエストの承認または拒否。                         |
| `tools.invoke`      | 公開されたツールの直接呼び出し。                     |
| `artifacts.read`    | 成果物の一覧表示とダウンロード。                     |
| `environment.write` | 管理対象環境の作成または破棄。                       |
| `admin`             | 管理操作。                                           |

デフォルト:

- デフォルトではシークレットを転送しない
- 環境変数の無制限のパススルーをしない
- シークレット値ではなくシークレット参照
- 明示的なサンドボックスとネットワークポリシー
- 明示的なリモート環境保持
- ポリシーが別の扱いを証明しない限り、ホスト実行には承認
- 呼び出し元がより強い診断スコープを持たない限り、raw ランタイムイベントは Gateway を離れる前に墨消しされる

## 管理対象環境プロバイダー

管理対象エージェントは環境プロバイダーとして実装する必要があります。

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

最初の実装はホスト型 SaaS である必要はありません。既存の Node ホスト、一時的なワークスペース、CI 形式のランナー、または Testbox 形式の環境を対象にできます。重要な契約は次のとおりです。

1. ワークスペースを準備する
2. 安全な環境とシークレットをバインドする
3. 実行を開始する
4. イベントをストリームする
5. 成果物を収集する
6. ポリシーに従ってクリーンアップまたは保持する

これが安定すれば、ホスト型クラウドサービスは同じプロバイダー契約を実装できます。

## パッケージ構造

推奨パッケージ:

| パッケージ              | 目的                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | 公開高レベル SDK と生成済み低レベル Gateway クライアント。    |
| `@openclaw/sdk-react`   | ダッシュボードとアプリビルダー向けのオプション React フック。 |
| `@openclaw/sdk-testing` | アプリ統合用のテストヘルパーと偽 Gateway サーバー。           |

リポジトリにはすでにプラグイン向けの `openclaw/plugin-sdk/*` があります。プラグイン作成者とアプリ開発者の混乱を避けるため、その名前空間は分離したままにしてください。

## 生成クライアント戦略

低レベルクライアントは、バージョン付き Gateway プロトコルスキーマから生成し、その後、手書きの使いやすいクラスでラップする必要があります。

レイヤリング:

1. Gateway スキーマの信頼できる唯一の情報源。
2. 生成された低レベル TypeScript クライアント。
3. 外部入力とイベントペイロード用のランタイムバリデーター。
4. 高レベルの `OpenClaw`、`Agent`、`Session`、`Run`、`Task`、`Artifact`
   ラッパー。
5. クックブック例と統合テスト。

利点:

- プロトコルのずれが見える
- テストで生成されたメソッドを Gateway エクスポートと比較できる
- App SDK は Plugin SDK 内部から独立したままになる
- 低レベルの利用者は引き続きプロトコル全体にアクセスできる
- 高レベルの利用者は小さなプロダクト API を利用できる

## 関連

- [OpenClaw App SDK](/ja-JP/concepts/openclaw-sdk)
- [Gateway RPC リファレンス](/ja-JP/reference/rpc)
- [Agent ループ](/ja-JP/concepts/agent-loop)
- [Agent ランタイム](/ja-JP/concepts/agent-runtimes)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [ACP エージェント](/ja-JP/tools/acp-agents)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
