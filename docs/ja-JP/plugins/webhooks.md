---
read_when:
    - 外部システムから TaskFlow をトリガーまたは駆動したい
    - バンドルされた webhooks Plugin を設定しています
summary: 'Webhook Plugin: 信頼済み外部自動化のための認証済み TaskFlow 入口'
title: Webhooks プラグイン
x-i18n:
    generated_at: "2026-07-05T11:38:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

The Webhooks Plugin は、信頼済みの外部システム（Zapier、n8n、CI ジョブ、内部サービス）がカスタム Plugin を書かずに、HTTP 経由でマネージド OpenClaw TaskFlows を作成して操作できるようにする認証付き HTTP ルートを追加します。

この Plugin は Gateway プロセス内で実行されます。リモート Gateway の場合は、そのホストにインストールして設定し、その後 Gateway を再起動します。初期状態ではルートが設定されていないため、少なくとも 1 つのルートを追加するまでは何もしません。

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

ルートのフィールド:

| フィールド     | 必須 | デフォルト                  | 備考                                          |
| -------------- | ---- | --------------------------- | --------------------------------------------- |
| `enabled`      | no   | `true`                      |                                               |
| `path`         | no   | `/plugins/webhooks/<routeId>` | ルート間で一意である必要があります。          |
| `sessionKey`   | yes  | -                           | バインドされた TaskFlows を所有するセッション。 |
| `secret`       | yes  | -                           | プレーン文字列または SecretRef（下記）。       |
| `controllerId` | no   | `webhooks/<routeId>`        | デフォルトの `create_flow` コントローラーとして使用されます。 |
| `description`  | no   | -                           | オペレーター向けメモのみ。                    |

`secret` はプレーン文字列または SecretRef を受け付けます: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`。

設定されたすべてのルートは、その secret が現在解決できるかどうかに関係なく起動時に登録されます。解決できない secret によってルートが無効化またはスキップされることはありません。そのルートへのリクエストは、secret が解決できるようになるまで認証に失敗します（`401`）。SecretRef の値はリクエストごとに再解決されるため、基になる secret（環境変数、ファイル、または exec の出力）をローテーションしても Gateway の再起動なしに反映されます。

## セキュリティモデル

各ルートは、設定された `sessionKey` の TaskFlow 権限で動作します。つまり、そのセッションが所有する任意の TaskFlow を検査および変更できます。TaskFlow へのアクセスは常に `api.runtime.tasks.managedFlows.bindSession(...)` を経由するため、ルートがバインドされたセッションの外で動作することはありません。影響範囲を限定するには:

- ルートごとに強力で一意の secret を使用します。
- インラインの平文 secret よりも SecretRef を優先します。
- ワークフローに合う最も狭いセッションにルートをバインドします。
- 必要な特定の Webhook パスだけを公開します。

各パスのリクエスト処理順序: HTTP メソッド（`POST` のみ）と `Content-Type: application/json` のチェック、次に固定ウィンドウのレート制限（path+client-IP キーごとに 60 秒ウィンドウあたり 120 リクエスト、追跡キーは最大 4,096）、次に処理中リクエスト制限（キーごとに同時 8 リクエスト、追跡キーは最大 4,096）、次に共有 secret 認証、次に 256 KB / 15 秒の JSON ボディ読み取り。早い段階のチェックに失敗したリクエストは、後続の処理には到達しません。

## リクエスト形式

`Content-Type: application/json` と、`Authorization: Bearer <secret>` または `x-openclaw-webhook-secret: <secret>` のいずれかを付けて `POST` リクエストを送信します。

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## サポートされるアクション

| アクション         | 目的                                                            |
| ------------------ | --------------------------------------------------------------- |
| `create_flow`      | ルートのセッション用にマネージド TaskFlow を作成します。        |
| `get_flow`         | id で 1 つの TaskFlow を取得します。                            |
| `list_flows`       | ルートのセッションの TaskFlows を一覧表示します。               |
| `find_latest_flow` | 直近に更新された TaskFlow を取得します。                        |
| `resolve_flow`     | 不透明トークンで TaskFlow を解決します。                        |
| `get_task_summary` | TaskFlow のタスク概要を取得します。                             |
| `set_waiting`      | 任意の state/wait データ付きで TaskFlow を待機中にします。      |
| `resume_flow`      | 待機中またはブロック中の TaskFlow を再開します。                |
| `finish_flow`      | TaskFlow を完了としてマークします。                             |
| `fail_flow`        | TaskFlow を失敗としてマークします。                             |
| `request_cancel`   | 協調的キャンセルをリクエストします。                            |
| `cancel_flow`      | TaskFlow をキャンセルします（子がまだアクティブな場合は `202` を返すことがあります）。 |
| `run_task`         | 既存の TaskFlow 内にマネージド子タスクを作成します。            |

変更を行うアクション（`set_waiting`、`resume_flow`、`finish_flow`、`fail_flow`、`request_cancel`）では、楽観的同時実行制御のために `flowId` と `expectedRevision` が必要です。古いリビジョンは `409 revision_conflict` を返します。

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

許可される `runtime` 値: `subagent`、`acp`。`startedAt`、`lastEventAt`、`progressSummary` は `status` が `"running"` の場合にのみ有効です。他の status と一緒に送信すると `400 invalid_request` が返されます。

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## レスポンス形状

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

Flow ビューとタスクビューに owner/session メタデータが含まれることはないため、レスポンスからルートにバインドされた `sessionKey` が漏れることはありません。`code` 値には、`not_found`、`not_managed`、`revision_conflict`、`persist_failed`、`cancel_requested`、`cancel_pending`、`terminal`、`invalid_request`、`request_rejected`、および上記の名前付きコードではカバーされない理由で変更が拒否された場合のアクション固有のフォールバックコード（`mutation_rejected`、`create_rejected`、`task_not_created`、`cancel_rejected`）が含まれます。

## 関連

- [Hooks](/ja-JP/automation/hooks) - 内部イベント駆動 hooks と、この HTTP ベースの TaskFlow ブリッジの違い
- [Gateway webhooks（`hooks.*` config）](/ja-JP/automation/cron-jobs#webhooks) - 別個の汎用 Gateway HTTP エンドポイント機能。この Plugin のルートとは同じではありません
- [Plugin runtime SDK](/ja-JP/plugins/sdk-runtime)
- [CLI webhooks](/ja-JP/cli/webhooks)
