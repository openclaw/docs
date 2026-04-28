---
read_when:
    - 外部システムから TaskFlow をトリガーまたは駆動したい場合
    - バンドル済み Webhooks Plugin を設定している場合
summary: 'Webhooks Plugin: 信頼された外部自動化向けの認証付き TaskFlow 入口'
title: Webhooks Plugin
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T05:13:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks（Plugin）

Webhooks Plugin は、外部
自動化を OpenClaw TaskFlow にバインドする認証付き HTTP route を追加します。

Zapier、n8n、CI ジョブ、内部サービスのような信頼されたシステムから、
まずカスタム Plugin を書かずに managed TaskFlow を作成・駆動したい場合に使ってください。

## どこで動作するか

Webhooks Plugin は Gateway プロセス内で動作します。

Gateway が別マシンで動いている場合は、その Gateway ホスト上で Plugin をインストール・設定し、
その後 Gateway を再起動してください。

## route を設定する

`plugins.entries.webhooks.config` 配下に config を設定します:

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

route フィールド:

- `enabled`: 任意。デフォルトは `true`
- `path`: 任意。デフォルトは `/plugins/webhooks/<routeId>`
- `sessionKey`: バインドされた TaskFlow を所有する必須セッション
- `secret`: 必須の共有シークレットまたは SecretRef
- `controllerId`: 作成される managed flow 用の任意の controller id
- `description`: 任意のオペレーター注記

サポートされる `secret` 入力:

- 平文文字列
- `source: "env" | "file" | "exec"` を持つ SecretRef

シークレットに支えられた route が起動時に secret を解決できない場合、その壊れた endpoint を公開する代わりに、
Plugin はその route をスキップして警告をログに記録します。

## セキュリティモデル

各 route は、設定された
`sessionKey` の TaskFlow 権限で動作するものとして信頼されます。

つまり、その route はそのセッションが所有する TaskFlow を調査・変更できるため、
次を行うべきです。

- route ごとに強力で一意な secret を使う
- インライン平文 secret よりも secret reference を優先する
- route はワークフローに合った最も狭いセッションにバインドする
- 必要な特定の webhook path のみを公開する

Plugin が適用するもの:

- 共有シークレット認証
- リクエストボディのサイズとタイムアウトのガード
- 固定ウィンドウレート制限
- 実行中リクエスト数の制限
- `api.runtime.taskFlow.bindSession(...)` を通じた owner-bound TaskFlow アクセス

## リクエスト形式

次を付けて `POST` リクエストを送ってください。

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` または `x-openclaw-webhook-secret: <secret>`

例:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## サポートされるアクション

Plugin は現在、次の JSON `action` 値を受け付けます。

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

route にバインドされたセッション用の managed TaskFlow を作成します。

例:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

既存の managed TaskFlow 内に managed child task を作成します。

許可される runtime:

- `subagent`
- `acp`

例:

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

成功レスポンス:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

拒否されたリクエスト:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin は意図的に owner/session metadata を webhook レスポンスからスクラブします。

## 関連ドキュメント

- [Plugin runtime SDK](/ja-JP/plugins/sdk-runtime)
- [Hooks and webhooks overview](/ja-JP/automation/hooks)
- [CLI webhooks](/ja-JP/cli/webhooks)
