---
read_when:
    - Gmail Pub/Sub イベントを OpenClaw に連携したい場合
    - 完全なフラグ一覧とデフォルト値が必要です
summary: '`openclaw webhooks` の CLI リファレンス (Gmail Pub/Sub のセットアップとランナー)'
title: Webhook
x-i18n:
    generated_at: "2026-05-10T19:30:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook ヘルパーと統合。現在、このサーフェスは、バンドルされている `gog` ウォッチャーと統合する Gmail Pub/Sub フローを対象としています。

## サブコマンド

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| サブコマンド  | 説明                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| `gmail setup` | Gmail watch、Pub/Sub トピック/サブスクリプション、OpenClaw Webhook 配信先を設定します。     |
| `gmail run`   | `gog watch serve` と watch 自動更新ループを実行します。                                      |

## `webhooks gmail setup`

Gmail watch、Pub/Sub、OpenClaw Webhook 配信を設定します。

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### 必須

| フラグ              | 説明                         |
| ------------------- | ---------------------------- |
| `--account <email>` | ウォッチする Gmail アカウント。 |

### Pub/Sub オプション

| フラグ                  | デフォルト             | 説明                                                       |
| ----------------------- | ---------------------- | ---------------------------------------------------------- |
| `--project <id>`        | (なし)                 | GCP プロジェクト ID (OAuth クライアントの所有者)。         |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub トピック名。                                       |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub サブスクリプション名。                             |
| `--label <label>`       | `INBOX`                | ウォッチする Gmail ラベル。                                |
| `--push-endpoint <url>` | (なし)                 | 明示的な Pub/Sub プッシュエンドポイント。Tailscale を上書きします。 |

### OpenClaw 配信オプション

| フラグ                 | デフォルト | 説明                         |
| ---------------------- | ---------- | ---------------------------- |
| `--hook-url <url>`     | (なし)     | OpenClaw Webhook URL。       |
| `--hook-token <token>` | (なし)     | OpenClaw Webhook トークン。  |
| `--push-token <token>` | (なし)     | `gog watch serve` に転送されるプッシュトークン。 |

### `gog watch serve` オプション

| フラグ                | デフォルト    | 説明                                                                |
| --------------------- | ------------- | ------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`   | `gog watch serve` のバインドホスト。                                |
| `--port <port>`       | `8788`        | `gog watch serve` のポート。                                        |
| `--path <path>`       | `/gmail-pubsub` | `gog watch serve` のパス。                                          |
| `--include-body`      | `true`        | メール本文のスニペットを含めます。無効にするには `--no-include-body` を渡します。 |
| `--max-bytes <n>`     | `20000`       | 本文スニペットあたりの最大バイト数。                                |
| `--renew-minutes <n>` | `720` (12h)   | N 分ごとに Gmail watch を更新します。                               |

### Tailscale での公開

| フラグ                    | デフォルト | 説明                                                               |
| ------------------------- | ---------- | ------------------------------------------------------------------ |
| `--tailscale <mode>`      | `funnel`   | tailscale 経由でプッシュエンドポイントを公開します: `funnel`、`serve`、または `off`。 |
| `--tailscale-path <path>` | (なし)     | tailscale serve/funnel のパス。                                    |
| `--tailscale-target <t>`  | (なし)     | Tailscale serve/funnel のターゲット (ポート、`host:port`、または URL)。 |

### 出力

| フラグ   | 説明                                                       |
| -------- | ---------------------------------------------------------- |
| `--json` | テキストの代わりに機械可読な概要を出力します。             |

## `webhooks gmail run`

`gog watch serve` と watch 自動更新ループをフォアグラウンドで実行します。

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` は、`setup` と同じ `gog watch serve`、OpenClaw 配信、Pub/Sub、Tailscale フラグを受け付けます。ただし、次の例外があります。

- `--account` は `run` では**任意**です (設定済みアカウントにフォールバックします)。
- `run` は `--project`、`--push-endpoint`、`--json` を受け付けません。
- `run` フラグには組み込みのデフォルトはありません。不足している値は `setup` によって書き込まれた値にフォールバックします。

| カテゴリ          | フラグ                                                                           |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw 配信     | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
`run` では、`--topic` の値は短いトピック名だけではなく、完全な Pub/Sub トピックパス (`projects/.../topics/...`) です。
</Note>

## エンドツーエンドのフロー

これらの CLI コマンドと組み合わせる GCP プロジェクト、OAuth、Gateway 側のセットアップについては、[Gmail Pub/Sub 統合](/ja-JP/automation/cron-jobs#gmail-pubsub-integration)を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Webhook 自動化](/ja-JP/automation/cron-jobs)
- [Gmail Pub/Sub](/ja-JP/automation/cron-jobs#gmail-pubsub-integration)
