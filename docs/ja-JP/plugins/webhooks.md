---
read_when:
    - 外部システムから TaskFlow をトリガーまたは操作したい場合
    - 同梱の Webhook Plugin を設定しています
summary: 'Webhooks Plugin: 信頼済み外部自動化向けの認証付き TaskFlow 入口'
title: Webhook Plugin
x-i18n:
    generated_at: "2026-04-30T05:29:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhook (Plugin)

Webhooks Plugin は、外部の自動化を OpenClaw TaskFlow に結び付ける認証付き HTTP ルートを追加します。

Zapier、n8n、CI ジョブ、内部サービスなどの信頼済みシステムから、先にカスタム Plugin を書かずに、管理対象の TaskFlow を作成して操作したい場合に使用します。

## 実行場所

Webhooks Plugin は Gateway プロセス内で実行されます。

Gateway が別のマシンで実行されている場合は、その Gateway ホストに Plugin をインストールして設定し、その後 Gateway を再起動します。

## ルートを設定する

`plugins.entries.webhooks.config` の下に config を設定します。

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

ルートフィールド:

- `enabled`: 任意。デフォルトは `true`
- `path`: 任意。デフォルトは `/plugins/webhooks/<routeId>`
- `sessionKey`: バインドされた TaskFlow を所有する必須の session
- `secret`: 必須の共有シークレットまたは SecretRef
- `controllerId`: 作成される管理対象 flow の任意の controller id
- `description`: 任意の運用者向けメモ

サポートされている `secret` 入力:

- プレーン文字列
- `source: "env" | "file" | "exec"` を持つ SecretRef

シークレットに基づくルートが起動時にシークレットを解決できない場合、Plugin は壊れた endpoint を公開する代わりに、そのルートをスキップして警告をログに記録します。

## セキュリティモデル

各ルートは、設定された `sessionKey` の TaskFlow 権限で動作するものとして信頼されます。

つまり、そのルートはその session が所有する TaskFlow を検査および変更できるため、次の対応を行ってください。

- ルートごとに強力で一意のシークレットを使用する
- インラインの平文シークレットよりもシークレット参照を優先する
- ワークフローに適合する最も限定的な session にルートをバインドする
- 必要な特定の Webhook パスのみを公開する

Plugin は次を適用します。

- 共有シークレット認証
- リクエスト本文サイズとタイムアウトのガード
- 固定ウィンドウのレート制限
- 実行中リクエストの制限
- `api.runtime.tasks.managedFlows.bindSession(...)` による所有者にバインドされた TaskFlow アクセス

## リクエスト形式

次を含む `POST` リクエストを送信します。

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` または `x-openclaw-webhook-secret: <secret>`

例:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## サポートされている action

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

ルートにバインドされた session の管理対象 TaskFlow を作成します。

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

既存の管理対象 TaskFlow 内に管理対象の子 task を作成します。

使用可能な runtime は次のとおりです。

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

## レスポンスの形状

成功したレスポンスは次を返します。

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

拒否されたリクエストは次を返します。

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin は、Webhook レスポンスから所有者/session メタデータを意図的に除去します。

## 関連ドキュメント

- [Plugin runtime SDK](/ja-JP/plugins/sdk-runtime)
- [Hook と Webhook の概要](/ja-JP/automation/hooks)
- [CLI Webhook](/ja-JP/cli/webhooks)
