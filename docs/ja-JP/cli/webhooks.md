---
read_when:
    - Gmail Pub/Sub イベントを OpenClaw に接続したい
    - 完全なフラグ一覧とデフォルト値が必要です
summary: '`openclaw webhooks` のCLIリファレンス（Gmail Pub/Sub のセットアップとランナー）'
title: Webhook
x-i18n:
    generated_at: "2026-07-05T11:14:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook ヘルパーと統合。現在、このサーフェスは、同梱の `gog` ウォッチャー上に構築された Gmail Pub/Sub フローに限定されています。

## サブコマンド

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| サブコマンド  | 説明                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `gmail setup` | 1回限りのウィザード: Gmail watch、Pub/Sub トピック/サブスクリプション、OpenClaw フック配信。 |
| `gmail run`   | `gog watch serve` と watch 自動更新ループをフォアグラウンドで実行します。                      |

<Note>
Gateway は、`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている（`gmail setup` によって設定される）場合、起動時に `gog gmail watch serve` も自動起動します。`gmail run` は同じロジックをフォアグラウンドで実行するもので、デバッグ時や Gateway ウォッチャーが無効な場合に便利です。自動起動の詳細と `OPENCLAW_SKIP_GMAIL_WATCHER` オプトアウトについては、[Gmail Pub/Sub 統合](/ja-JP/automation/cron-jobs#gmail-pubsub-integration)を参照してください。
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

不足している場合は `gcloud` と `gog` をインストールし、`gcloud` を認証し、Pub/Sub トピックとサブスクリプションを作成し、Gmail watch を開始し、`hooks.enabled=true` 付きで `hooks.gmail` 設定を書き込みます。`Next: openclaw webhooks gmail run` を出力します。

### 必須

| フラグ              | 説明                         |
| ------------------- | ---------------------------- |
| `--account <email>` | 監視する Gmail アカウント。 |

### Pub/Sub オプション

| フラグ                  | デフォルト             | 説明                                                                                                                               |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (なし)                 | GCP プロジェクト ID（OAuth クライアントの所有者）。トピック自身のプロジェクト ID、次に `gog` 認証情報から解決されたプロジェクトにフォールバックします。 |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub トピック名。                                                                                                               |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub サブスクリプション名。                                                                                                     |
| `--label <label>`       | `INBOX`                | 監視する Gmail ラベル。                                                                                                            |
| `--push-endpoint <url>` | (なし)                 | 明示的な Pub/Sub プッシュエンドポイント。Tailscale を上書きします。                                                                |

### OpenClaw 配信オプション

| フラグ                 | デフォルト                                   | 説明                         |
| ---------------------- | -------------------------------------------- | ---------------------------- |
| `--hook-url <url>`     | `hooks.path` と Gateway ポートから構築       | OpenClaw webhook URL。       |
| `--hook-token <token>` | `hooks.token`、または生成されたトークン      | OpenClaw webhook トークン。  |
| `--push-token <token>` | 生成されたトークン                           | `gog watch serve` に転送されるプッシュトークン。 |

### `gog watch serve` オプション

| フラグ                | デフォルト      | 説明                                                                                                                                       |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` のバインドホスト。                                                                                                       |
| `--port <port>`       | `8788`          | `gog watch serve` のポート。                                                                                                               |
| `--path <path>`       | `/gmail-pubsub` | `gog watch serve` のパス。明示的なターゲットなしで Tailscale が有効な場合、Tailscale はプロキシ前にパスを取り除くため、`/` に強制されます。 |
| `--include-body`      | `true`          | メール本文スニペットを含めます。これをオフにする CLI フラグはありません。代わりに設定で `hooks.gmail.includeBody: false` を設定してください。 |
| `--max-bytes <n>`     | `20000`         | 本文スニペットあたりの最大バイト数。                                                                                                      |
| `--renew-minutes <n>` | `720` (12時間)  | N分ごとに Gmail watch を更新します。                                                                                                      |

### Tailscale 公開

| フラグ                    | デフォルト | 説明                                                               |
| ------------------------- | ---------- | ------------------------------------------------------------------ |
| `--tailscale <mode>`      | `funnel`   | tailscale 経由でプッシュエンドポイントを公開: `funnel`、`serve`、または `off`。 |
| `--tailscale-path <path>` | (なし)     | tailscale serve/funnel のパス。                                    |
| `--tailscale-target <t>`  | (なし)     | Tailscale serve/funnel ターゲット（ポート、`host:port`、または URL）。 |

### 出力

| フラグ   | 説明                                         |
| -------- | -------------------------------------------- |
| `--json` | テキストの代わりに機械可読な要約を出力します。 |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

`gog watch serve` と watch 自動更新ループをフォアグラウンドで実行し、`gog watch serve` が予期せず終了した場合は 2秒の遅延後に再起動します。

`run` は、次を除き、`setup` と同じ Pub/Sub、OpenClaw 配信、`gog watch serve`、Tailscale フラグを受け付けます。

- `--account` は `run` では**任意**です。`hooks.gmail.account` にフォールバックします。
- `run` は `--project`、`--push-endpoint`、`--json` を受け付けません。
- すべてのフラグは、対応する `hooks.gmail.*` 設定値（`setup` によって書き込まれる）にフォールバックし、次に `setup` が使用する同じ組み込みデフォルトにフォールバックします。ただし例外が1つあります。フラグも `hooks.gmail.tailscale.mode` も設定されていない場合、`--tailscale` は `run` では `funnel` ではなく `off` がデフォルトです。

| カテゴリ          | フラグ                                                                           |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw 配信     | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
`run` では、`--topic` の値は短いトピック名だけではなく、完全な Pub/Sub トピックパス（`projects/.../topics/...`）です。
</Note>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Webhook 自動化](/ja-JP/automation/cron-jobs)
- [Gmail Pub/Sub 統合](/ja-JP/automation/cron-jobs#gmail-pubsub-integration)
