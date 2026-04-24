---
read_when:
    - プロバイダーの再試行動作またはデフォルトを更新する場合
    - プロバイダー送信エラーまたはレート制限をデバッグしている場合
summary: 送信プロバイダー呼び出しの再試行ポリシー
title: 再試行ポリシー
x-i18n:
    generated_at: "2026-04-24T04:54:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 15
---

## 目標

- 複数ステップのフロー単位ではなく、HTTPリクエスト単位で再試行する。
- 現在のステップのみを再試行して順序を維持する。
- 非冪等な操作の重複を避ける。

## デフォルト

- 試行回数: 3
- 最大遅延上限: 30000 ms
- ジッター: 0.1（10パーセント）
- プロバイダー別デフォルト:
  - Telegramの最小遅延: 400 ms
  - Discordの最小遅延: 500 ms

## 動作

### モデルプロバイダー

- OpenClawは、通常の短い再試行はプロバイダーSDKに処理させます。
- AnthropicやOpenAIのようなStainlessベースのSDKでは、再試行可能なレスポンス
  （`408`、`409`、`429`、および`5xx`）に`retry-after-ms`または
  `retry-after`が含まれることがあります。その待機時間が60秒を超える場合、
  OpenClawは`x-should-retry: false`を注入し、SDKがエラーを即座に表面化できるようにして、
  モデルフェイルオーバーが別のauthプロファイルまたはフォールバックモデルへローテーションできるようにします。
- 上限を上書きするには`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`を使用します。
  `0`、`false`、`off`、`none`、または`disabled`に設定すると、SDKが長い
  `Retry-After`スリープを内部で尊重するようになります。

### Discord

- レート制限エラー（HTTP 429）のときだけ再試行します。
- 利用可能な場合はDiscordの`retry_after`を使用し、なければ指数バックオフを使用します。

### Telegram

- 一時的エラー（429、timeout、connect/reset/closed、temporarily unavailable）で再試行します。
- 利用可能な場合は`retry_after`を使用し、なければ指数バックオフを使用します。
- Markdown解析エラーは再試行されず、プレーンテキストへフォールバックします。

## 設定

`~/.openclaw/openclaw.json`でプロバイダーごとに再試行ポリシーを設定します。

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

## 注意

- 再試行はリクエスト単位で適用されます（メッセージ送信、メディアアップロード、リアクション、poll、sticker）。
- 複合フローでは、完了済みステップは再試行されません。

## 関連

- [Model failover](/ja-JP/concepts/model-failover)
- [Command queue](/ja-JP/concepts/queue)
