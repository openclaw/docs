---
read_when:
    - プロバイダーの再試行動作またはデフォルトを更新する
    - プロバイダー送信エラーまたはレート制限のデバッグ
summary: 送信プロバイダー呼び出しのリトライポリシー
title: 再試行ポリシー
x-i18n:
    generated_at: "2026-07-05T11:20:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## 目標

- 複数ステップのフロー単位ではなく、HTTP リクエスト単位で再試行する。
- 現在のステップのみを再試行して順序を保持する。
- 冪等でない操作の重複を避ける。

## デフォルト

| 設定               | デフォルト |
| ------------------ | --------- |
| 試行回数           | 3         |
| 最大遅延上限       | 30000 ms  |
| ジッター           | 0.1 (10%) |
| Telegram 最小遅延 | 400 ms    |
| Discord 最小遅延  | 500 ms    |

## 動作

### モデルプロバイダー

- OpenClaw は、通常の短い再試行の処理をプロバイダー SDK に任せる。
- Anthropic や OpenAI などの Stainless ベースの SDK では、再試行可能なレスポンス (`408`、`409`、`429`、`5xx`) に `retry-after-ms` または `retry-after` が含まれる場合がある。その待機時間が 60 秒を超える場合、OpenClaw は `x-should-retry: false` を注入し、SDK が即座にエラーを表面化できるようにして、モデルフェイルオーバーが別の認証プロファイルまたはフォールバックモデルへ切り替えられるようにする。
- 上限は `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` で上書きする。SDK が長い `Retry-After` のスリープを内部で尊重できるようにするには、`0`、`false`、`off`、`none`、または `disabled` に設定する。

### Discord

- レート制限エラー (HTTP 429)、リクエストタイムアウト、HTTP 5xx レスポンス、DNS ルックアップ失敗、接続リセット、ソケットクローズ、fetch 失敗などの一時的なトランスポート障害で再試行する。
- 利用可能な場合は Discord の `retry_after` を使用し、それ以外の場合は指数バックオフを使用する。

### Telegram

- 一時的なエラー (429、タイムアウト、接続/リセット/クローズ、一時的に利用不可) で再試行する。
- 利用可能な場合は `retry_after` を使用し、それ以外の場合は指数バックオフを使用する。
- HTML/Markdown の解析エラーは再試行されない。最初の試行でプレーンテキストにフォールバックする。

## 設定

`~/.openclaw/openclaw.json` でプロバイダーごとの再試行ポリシーを設定する:

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

- 再試行はリクエスト単位 (メッセージ送信、メディアアップロード、リアクション、投票、ステッカー) で適用される。
- 複合フローでは、完了済みのステップは再試行しない。

## 関連

- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
- [コマンドキュー](/ja-JP/concepts/queue)
