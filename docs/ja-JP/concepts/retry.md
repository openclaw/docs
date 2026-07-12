---
read_when:
    - プロバイダーの再試行動作またはデフォルト値の更新
    - プロバイダーの送信エラーやレート制限のデバッグ
summary: アウトバウンドプロバイダー呼び出しの再試行ポリシー
title: 再試行ポリシー
x-i18n:
    generated_at: "2026-07-11T22:13:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## 目標

- 複数ステップのフロー単位ではなく、HTTP リクエスト単位で再試行する。
- 現在のステップのみを再試行して、順序を維持する。
- 非べき等な操作の重複を回避する。

## デフォルト

| 設定               | デフォルト |
| ------------------ | ---------- |
| 試行回数           | 3          |
| 最大遅延の上限     | 30000 ms   |
| ジッター           | 0.1 (10%)  |
| Telegram の最小遅延 | 400 ms     |
| Discord の最小遅延  | 500 ms     |

## 動作

### モデルプロバイダー

- OpenClaw は、通常の短時間の再試行をプロバイダー SDK に処理させます。
- Anthropic や OpenAI などの Stainless ベースの SDK では、再試行可能なレスポンス（`408`、`409`、`429`、`5xx`）に `retry-after-ms` または `retry-after` が含まれる場合があります。その待機時間が 60 秒を超える場合、OpenClaw は `x-should-retry: false` を注入し、SDK がエラーを即座に返すようにします。これにより、モデルのフェイルオーバーは別の認証プロファイルまたはフォールバックモデルへ切り替えられます。
- 上限を変更するには、`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` を使用します。`0`、`false`、`off`、`none`、または `disabled` に設定すると、SDK は長い `Retry-After` の待機を内部で処理します。

### Discord

- レート制限エラー（HTTP 429）、リクエストのタイムアウト、HTTP 5xx レスポンス、および DNS ルックアップ失敗、接続リセット、ソケット切断、フェッチ失敗などの一時的な通信障害が発生した場合に再試行します。
- 利用可能な場合は Discord の `retry_after` を使用し、それ以外の場合は指数バックオフを使用します。

### Telegram

- 一時的なエラー（429、タイムアウト、接続失敗、接続リセット、接続切断、一時的な利用不可）が発生した場合に再試行します。
- 利用可能な場合は `retry_after` を使用し、それ以外の場合は指数バックオフを使用します。
- HTML/Markdown の解析エラーは再試行せず、最初の試行でプレーンテキストにフォールバックします。

## 設定

`~/.openclaw/openclaw.json` でプロバイダーごとに再試行ポリシーを設定します。

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## 注記

- 再試行はリクエスト単位（メッセージ送信、メディアのアップロード、リアクション、投票、ステッカー）で適用されます。
- 複合フローでは、完了済みのステップを再試行しません。

## 関連項目

- [モデルのフェイルオーバー](/ja-JP/concepts/model-failover)
- [コマンドキュー](/ja-JP/concepts/queue)
