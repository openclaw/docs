---
read_when:
    - 提案されている公開 OpenClaw アプリ SDK を実装しています
    - アプリ SDK のドラフト名前空間、イベント、結果、アーティファクト、承認、またはセキュリティコントラクトが必要な場合
    - Gateway プロトコルのリソースを、高レベルの OpenClaw App SDK ラッパーと比較しています
sidebarTitle: App SDK API design
summary: 公開 OpenClaw App SDK API、イベント分類体系、アーティファクト、承認、パッケージ構造のリファレンス設計
title: OpenClaw アプリ SDK API の設計
x-i18n:
    generated_at: "2026-04-30T05:33:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

このページは、公開
[OpenClaw App SDK](/ja-JP/concepts/openclaw-sdk) の詳細な API リファレンス設計です。意図的に
[Plugin SDK](/ja-JP/plugins/sdk-overview) とは分離されています。

<Note>
  `@openclaw/sdk` は Gateway と通信するための外部アプリ/クライアントパッケージです。`openclaw/plugin-sdk/*` はインプロセスの Plugin オーサリング契約です。
  エージェントを実行するだけでよいアプリから Plugin SDK のサブパスをインポートしないでください。
</Note>

公開アプリ SDK は、次の 2 層で構築する必要があります。

1. 低レベルの生成 Gateway クライアント。
2. `OpenClaw`、`Agent`、`Session`、`Run`、
   `Task`、`Artifact`、`Approval`、`Environment` オブジェクトを備えた、高レベルで使いやすいラッパー。

## 名前空間設計

低レベルの名前空間は Gateway リソースに密接に沿う必要があります。

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
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

高レベルラッパーは、一般的なフローを快適にするオブジェクトを返す必要があります。

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

`id` は再生カーソルです。コンシューマーは
`events({ after: id })` で再接続し、保持期間が許す場合は取りこぼしたイベントを受信できる必要があります。

推奨される正規化イベントファミリー:

| イベント              | 意味                                                        |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run が受理された。                                         |
| `run.queued`          | Run がセッションレーン、ランタイム、または環境を待っている。 |
| `run.started`         | ランタイムが実行を開始した。                               |
| `run.completed`       | Run が正常に終了した。                                     |
| `run.failed`          | Run がエラーで終了した。                                   |
| `run.cancelled`       | Run がキャンセルされた。                                   |
| `run.timed_out`       | Run がタイムアウトを超過した。                             |
| `assistant.delta`     | アシスタントのテキスト差分。                               |
| `assistant.message`   | 完全なアシスタントメッセージまたは置換。                   |
| `thinking.delta`      | ポリシーで公開が許可されている場合の推論または計画の差分。 |
| `tool.call.started`   | ツール呼び出しが開始された。                               |
| `tool.call.delta`     | ツール呼び出しが進行状況または部分出力をストリーミングした。 |
| `tool.call.completed` | ツール呼び出しが正常に返った。                             |
| `tool.call.failed`    | ツール呼び出しが失敗した。                                 |
| `approval.requested`  | Run またはツールが承認を必要としている。                   |
| `approval.resolved`   | 承認が許可、拒否、期限切れ、またはキャンセルされた。       |
| `question.requested`  | ランタイムがユーザーまたはホストアプリに入力を求めている。 |
| `question.answered`   | ホストアプリが回答を提供した。                             |
| `artifact.created`    | 新しいアーティファクトが利用可能になった。                 |
| `artifact.updated`    | 既存のアーティファクトが変更された。                       |
| `session.created`     | セッションが作成された。                                   |
| `session.updated`     | セッションのメタデータが変更された。                       |
| `session.compacted`   | セッション Compaction が発生した。                         |
| `task.updated`        | バックグラウンドタスクの状態が変更された。                 |
| `git.branch`          | ランタイムがブランチ状態を観測または変更した。             |
| `git.diff`            | ランタイムが diff を生成または変更した。                   |
| `git.pr`              | ランタイムがプルリクエストを開いた、更新した、またはリンクした。 |

ランタイムネイティブのペイロードは `raw` から利用できる必要がありますが、通常の UI でアプリが `raw` を解析する必要があってはいけません。

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

結果は単純で安定している必要があります。タイムスタンプ値は Gateway の形状を保持するため、現在のライフサイクルに基づく Run は通常エポックミリ秒の数値を報告しますが、アダプターは引き続き ISO 文字列を表面化する場合があります。リッチな UI、ツールトレース、ランタイムネイティブの詳細はイベントとアーティファクトに属します。

`accepted` は非終端の wait 結果です。これは、Run がライフサイクルの終了/エラーを生成する前に Gateway の wait 期限が切れたことを意味します。`timed_out` として扱ってはいけません。`timed_out` は、Run が自身のランタイムタイムアウトを超過した場合のために予約されています。

## 承認と質問

コーディングエージェントは常に安全境界を越えるため、承認は第一級の存在でなければなりません。

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

承認イベントには次を含める必要があります。

- 承認 ID
- Run ID とセッション ID
- リクエスト種別
- 要求されたアクションの要約
- ツール名または環境アクション
- リスクレベル
- 利用可能な判断
- 有効期限
- 判断を再利用できるかどうか

質問は承認とは別です。質問はユーザーまたはホストアプリに情報を求めます。承認はアクションを実行する許可を求めます。

## ToolSpace モデル

アプリは Plugin 内部をインポートせずにツールサーフェスを理解する必要があります。

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK は次を公開する必要があります。

- 正規化されたツールメタデータ
- ソース: OpenClaw、MCP、Plugin、チャネル、ランタイム、またはアプリ
- スキーマ要約
- 承認ポリシー
- ランタイム互換性
- ツールが hidden、readonly、write capable、host capable のいずれであるか

SDK を通じたツール呼び出しは、明示的でスコープ指定されている必要があります。ほとんどのアプリは、任意のツールを直接呼び出すのではなく、エージェントを実行するべきです。

## アーティファクトモデル

アーティファクトはファイル以外も扱う必要があります。

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
- 管理環境ワークスペーススナップショット

アーティファクトアクセスは、すべてのアーティファクトが通常のローカルファイルであると仮定せず、リダクション、保持、ダウンロード URL をサポートする必要があります。

## セキュリティモデル

アプリ SDK は権限について明示的でなければなりません。

推奨されるトークンスコープ:

| スコープ            | 許可内容                                            |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | エージェントの一覧表示と検査。                     |
| `agent.run`         | Run の開始。                                        |
| `session.read`      | セッションメタデータとメッセージの読み取り。       |
| `session.write`     | セッションの作成、送信、フォーク、Compaction、停止。 |
| `task.read`         | バックグラウンドタスク状態の読み取り。             |
| `task.write`        | タスク通知ポリシーのキャンセルまたは変更。         |
| `approval.respond`  | リクエストの承認または拒否。                       |
| `tools.invoke`      | 公開されたツールの直接呼び出し。                   |
| `artifacts.read`    | アーティファクトの一覧表示とダウンロード。         |
| `environment.write` | 管理環境の作成または破棄。                         |
| `admin`             | 管理操作。                                          |

デフォルト:

- デフォルトではシークレットを転送しない
- 無制限の環境変数パススルーを行わない
- シークレット値ではなくシークレット参照
- 明示的なサンドボックスとネットワークポリシー
- 明示的なリモート環境保持
- ポリシーで別途証明されない限り、ホスト実行には承認を要求
- 呼び出し元がより強い診断スコープを持たない限り、生のランタイムイベントは Gateway を出る前にリダクションされる

## 管理環境プロバイダー

管理エージェントは環境プロバイダーとして実装する必要があります。

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

最初の実装はホスト型 SaaS である必要はありません。既存の Node ホスト、一時ワークスペース、CI 風ランナー、または Testbox 風環境を対象にできます。重要な契約は次のとおりです。

1. ワークスペースを準備する
2. 安全な環境とシークレットをバインドする
3. Run を開始する
4. イベントをストリーミングする
5. アーティファクトを収集する
6. ポリシーに従ってクリーンアップまたは保持する

これが安定したら、ホスト型クラウドサービスは同じプロバイダー契約を実装できます。

## パッケージ構造

推奨パッケージ:

| パッケージ              | 目的                                                            |
| ----------------------- | --------------------------------------------------------------- |
| `@openclaw/sdk`         | 公開高レベル SDK と生成された低レベル Gateway クライアント。    |
| `@openclaw/sdk-react`   | ダッシュボードとアプリビルダー向けの任意の React フック。       |
| `@openclaw/sdk-testing` | アプリ統合向けのテストヘルパーとフェイク Gateway サーバー。     |

このリポジトリには Plugin 用の `openclaw/plugin-sdk/*` がすでにあります。Plugin 作者とアプリ開発者を混同しないよう、その名前空間は分離したままにしてください。

## 生成クライアント戦略

低レベルクライアントは、バージョン管理された Gateway プロトコル
スキーマから生成し、その後、手書きの使いやすいクラスでラップする必要があります。

レイヤー構成:

1. Gateway スキーマを信頼できる唯一の情報源にする。
2. 生成された低レベル TypeScript クライアント。
3. 外部入力とイベントペイロード用のランタイムバリデーター。
4. 高レベルの `OpenClaw`、`Agent`、`Session`、`Run`、`Task`、`Artifact`
   ラッパー。
5. クックブック例と統合テスト。

利点:

- プロトコルのドリフトが見える
- テストで生成されたメソッドと Gateway エクスポートを比較できる
- アプリ SDK が Plugin SDK 内部から独立したままになる
- 低レベル利用者は引き続きプロトコル全体にアクセスできる
- 高レベル利用者は小さな製品 API を利用できる

## 関連ドキュメント

- [OpenClaw アプリ SDK](/ja-JP/concepts/openclaw-sdk)
- [Gateway RPC リファレンス](/ja-JP/reference/rpc)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [ACP エージェント](/ja-JP/tools/acp-agents)
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
