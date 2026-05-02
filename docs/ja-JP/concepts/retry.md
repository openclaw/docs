---
read_when:
    - プロバイダーの再試行動作またはデフォルトの更新
    - プロバイダーの送信エラーまたはレート制限のデバッグ
summary: アウトバウンドのプロバイダー呼び出しのリトライポリシー
title: 再試行ポリシー
x-i18n:
    generated_at: "2026-05-02T04:53:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
---

## 目標

- 複数ステップのフローごとではなく、HTTP リクエストごとに再試行する。
- 現在のステップのみを再試行して順序を保持する。
- 非冪等操作の重複を避ける。

## デフォルト

- 試行回数: 3
- 最大遅延上限: 30000 ms
- ジッター: 0.1 (10 パーセント)
- プロバイダーのデフォルト:
  - Telegram 最小遅延: 400 ms
  - Discord 最小遅延: 500 ms

## 動作

### モデルプロバイダー

- OpenClaw は、通常の短い再試行をプロバイダー SDK に処理させる。
- Anthropic や OpenAI などの Stainless ベースの SDK では、再試行可能なレスポンス
  (`408`、`409`、`429`、および `5xx`) に `retry-after-ms` または
  `retry-after` が含まれることがある。その待機時間が 60 秒を超える場合、OpenClaw は
  `x-should-retry: false` を注入し、SDK が即座にエラーを表面化して、モデル
  フェイルオーバーが別の認証プロファイルまたはフォールバックモデルに切り替えられるようにする。
- 上限は `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` で上書きする。
  `0`、`false`、`off`、`none`、または `disabled` に設定すると、SDK が長い
  `Retry-After` スリープを内部で尊重する。

### Discord

- レート制限エラー (HTTP 429)、リクエストタイムアウト、HTTP 5xx レスポンス、
  および DNS ルックアップ失敗、接続リセット、ソケットクローズ、fetch 失敗などの一時的なトランスポート障害で再試行する。
- 利用可能な場合は Discord の `retry_after` を使用し、それ以外の場合は指数バックオフを使用する。

### Telegram

- 一時的なエラー (429、タイムアウト、接続/リセット/クローズ、一時的に利用不可) で再試行する。
- 利用可能な場合は `retry_after` を使用し、それ以外の場合は指数バックオフを使用する。
- Markdown 解析エラーは再試行されず、プレーンテキストにフォールバックする。

## 設定

プロバイダーごとの再試行ポリシーを `~/.openclaw/openclaw.json` に設定する:

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

- 再試行はリクエストごと (メッセージ送信、メディアアップロード、リアクション、投票、ステッカー) に適用される。
- 複合フローでは、完了済みのステップは再試行されない。

## 関連

- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
- [コマンドキュー](/ja-JP/concepts/queue)
