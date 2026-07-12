---
read_when:
    - 外部システムからTaskFlowをトリガーまたは駆動したい場合
    - バンドルされたWebhook Pluginを設定しています
summary: Webhooks Plugin：信頼できる外部自動化向けの認証済み TaskFlow 受信口
title: Webhook Plugin
x-i18n:
    generated_at: "2026-07-11T22:35:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Webhooks Plugin は、認証済みの HTTP ルートを追加し、信頼された外部システム
（Zapier、n8n、CI ジョブ、内部サービス）がカスタム Plugin を作成することなく、
HTTP 経由で管理対象の OpenClaw TaskFlow を作成および操作できるようにします。

この Plugin は Gateway プロセス内で実行されます。リモート Gateway の場合は、
そのホストにインストールして設定し、Gateway を再起動してください。初期状態では
ルートが設定されていないため、少なくとも 1 つのルートを追加するまでは何も動作しません。

## ルートを設定する

`plugins.entries.webhooks.config` 配下に設定します。

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

ルートのフィールド：

| フィールド     | 必須   | デフォルト                    | 備考                                          |
| -------------- | ------ | ----------------------------- | --------------------------------------------- |
| `enabled`      | いいえ | `true`                        |                                               |
| `path`         | いいえ | `/plugins/webhooks/<routeId>` | ルート間で一意である必要があります。          |
| `sessionKey`   | はい   | -                             | バインドされた TaskFlow を所有するセッション。 |
| `secret`       | はい   | -                             | プレーン文字列または SecretRef（後述）。      |
| `controllerId` | いいえ | `webhooks/<routeId>`          | デフォルトの `create_flow` コントローラーとして使用されます。 |
| `description`  | いいえ | -                             | オペレーター向けのメモのみ。                  |

`secret` には、プレーン文字列または SecretRef を指定できます：`{ source: "env" | "file" | "exec", provider: "default", id: "..." }`。

設定された各ルートは、シークレットを現在解決できるかどうかに関係なく、起動時に登録されます。
解決できないシークレットによってルートが無効化またはスキップされることはありません。
シークレットを解決できるようになるまで、そのルートへのリクエストは認証に失敗します（`401`）。
SecretRef の値はリクエストごとに再解決されるため、基になるシークレット
（環境変数、ファイル、または exec の出力）をローテーションすると、
Gateway を再起動せずに反映されます。

## セキュリティモデル

各ルートは、設定された `sessionKey` の TaskFlow 権限で動作します。つまり、
そのセッションが所有する任意の TaskFlow を確認および変更できます。TaskFlow へのアクセスは
常に `api.runtime.tasks.managedFlows.bindSession(...)` を経由するため、ルートが
バインドされたセッションの外部で動作することはありません。影響範囲を限定するには：

- ルートごとに強力で一意なシークレットを使用します。
- インラインの平文シークレットより SecretRef を優先します。
- ワークフローに適合する最小範囲のセッションにルートをバインドします。
- 必要な特定の Webhook パスのみを公開します。

各パスのリクエスト処理順序は次のとおりです。HTTP メソッド（`POST` のみ）と
`Content-Type: application/json` の確認、固定ウィンドウ方式のレート制限
（パスとクライアント IP のキーごとに 60 秒間で 120 リクエスト、追跡するキーは最大 4,096 個）、
処理中リクエスト数の制限（キーごとに同時 8 リクエスト、追跡するキーは最大 4,096 個）、
共有シークレット認証、最後に 256 KB／15 秒を上限とする JSON 本文の読み取りです。
前段の確認に失敗したリクエストは、後続の処理には到達しません。

## リクエスト形式

`Content-Type: application/json` と、
`Authorization: Bearer <secret>` または `x-openclaw-webhook-secret: <secret>` の
いずれかを指定して `POST` リクエストを送信します。

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## サポートされるアクション

| アクション         | 目的                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | ルートのセッション用に管理対象の TaskFlow を作成します。           |
| `get_flow`         | ID を指定して 1 つの TaskFlow を取得します。                        |
| `list_flows`       | ルートのセッションの TaskFlow を一覧表示します。                    |
| `find_latest_flow` | 最も最近更新された TaskFlow を取得します。                          |
| `resolve_flow`     | 不透明トークンを使用して TaskFlow を解決します。                    |
| `get_task_summary` | TaskFlow のタスク概要を取得します。                                 |
| `set_waiting`      | 任意の状態／待機データを指定して TaskFlow を待機中にします。        |
| `resume_flow`      | 待機中またはブロック中の TaskFlow を再開します。                    |
| `finish_flow`      | TaskFlow を完了済みにします。                                       |
| `fail_flow`        | TaskFlow を失敗状態にします。                                       |
| `request_cancel`   | 協調的なキャンセルを要求します。                                    |
| `cancel_flow`      | TaskFlow をキャンセルします（子がまだアクティブな場合は `202` を返すことがあります）。 |
| `run_task`         | 既存の TaskFlow 内に管理対象の子タスクを作成します。                 |

変更アクション（`set_waiting`、`resume_flow`、`finish_flow`、`fail_flow`、
`request_cancel`）では、楽観的同時実行制御のために `flowId` と `expectedRevision` が
必要です。古いリビジョンを指定すると `409 revision_conflict` が返されます。

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

許可される `runtime` の値は `subagent`、`acp` です。`startedAt`、`lastEventAt`、
`progressSummary` は、`status` が `"running"` の場合にのみ有効です。それ以外の
ステータスで送信すると `400 invalid_request` が返されます。

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## レスポンス形式

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

フローおよびタスクのビューには所有者／セッションのメタデータが含まれないため、
レスポンスからルートにバインドされた `sessionKey` が漏れることはありません。
`code` の値には、`not_found`、`not_managed`、`revision_conflict`、
`persist_failed`、`cancel_requested`、`cancel_pending`、`terminal`、
`invalid_request`、`request_rejected` が含まれます。また、上記の名前付きコードで
扱われない理由により変更が拒否された場合は、アクション固有のフォールバックコード
（`mutation_rejected`、`create_rejected`、`task_not_created`、`cancel_rejected`）
が使用されます。

## 関連項目

- [フック](/ja-JP/automation/hooks) - 内部のイベント駆動型フックと、この HTTP ベースの TaskFlow ブリッジとの違い
- [Gateway Webhook（`hooks.*` 設定）](/ja-JP/automation/cron-jobs#webhooks) - 独立した汎用 Gateway HTTP エンドポイント機能。この Plugin のルートとは異なります
- [Plugin ランタイム SDK](/ja-JP/plugins/sdk-runtime)
- [CLI Webhook](/ja-JP/cli/webhooks)
