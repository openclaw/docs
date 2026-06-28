---
read_when:
    - 您想將 Gmail Pub/Sub 事件串接到 OpenClaw
    - 你需要完整的旗標清單和預設值
summary: '`openclaw webhooks` 的 CLI 參考 (Gmail Pub/Sub 設定與執行器)'
title: Webhook
x-i18n:
    generated_at: "2026-05-10T19:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw webhooks`

Webhook 輔助程式與整合。目前此介面範圍限於 Gmail Pub/Sub 流程，這些流程會與內建的 `gog` 監看器整合。

## 子命令

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| 子命令        | 說明                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| `gmail setup` | 設定 Gmail watch、Pub/Sub topic/subscription，以及 OpenClaw Webhook 傳遞目標。 |
| `gmail run`   | 執行 `gog watch serve` 加上 watch 自動續期迴圈。                                        |

## `webhooks gmail setup`

設定 Gmail watch、Pub/Sub，以及 OpenClaw Webhook 傳遞。

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### 必填

| 旗標                | 說明             |
| ------------------- | ----------------------- |
| `--account <email>` | 要監看的 Gmail 帳戶。 |

### Pub/Sub 選項

| 旗標                    | 預設值                | 說明                                          |
| ----------------------- | ---------------------- | ---------------------------------------------------- |
| `--project <id>`        | （無）                 | GCP 專案 ID（OAuth 用戶端擁有者）。             |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub topic 名稱。                                  |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub subscription 名稱。                           |
| `--label <label>`       | `INBOX`                | 要監看的 Gmail label。                                |
| `--push-endpoint <url>` | （無）                 | 明確的 Pub/Sub push endpoint。會覆寫 Tailscale。 |

### OpenClaw 傳遞選項

| 旗標                   | 預設值 | 說明                                |
| ---------------------- | ------- | ------------------------------------------ |
| `--hook-url <url>`     | （無）  | OpenClaw Webhook URL。                      |
| `--hook-token <token>` | （無）  | OpenClaw Webhook token。                    |
| `--push-token <token>` | （無）  | 轉送給 `gog watch serve` 的 push token。 |

### `gog watch serve` 選項

| 旗標                  | 預設值         | 說明                                                       |
| --------------------- | --------------- | ----------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` 綁定主機。                                      |
| `--port <port>`       | `8788`          | `gog watch serve` 連接埠。                                           |
| `--path <path>`       | `/gmail-pubsub` | `gog watch serve` 路徑。                                           |
| `--include-body`      | `true`          | 包含電子郵件本文片段。傳入 `--no-include-body` 可停用。 |
| `--max-bytes <n>`     | `20000`         | 每個本文片段的最大位元組數。                                       |
| `--renew-minutes <n>` | `720`（12 小時）     | 每 N 分鐘續期 Gmail watch。                                |

### Tailscale 暴露

| 旗標                      | 預設值  | 說明                                                      |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | 透過 tailscale 暴露 push endpoint：`funnel`、`serve` 或 `off`。 |
| `--tailscale-path <path>` | （無）   | tailscale serve/funnel 的路徑。                                 |
| `--tailscale-target <t>`  | （無）   | Tailscale serve/funnel 目標（連接埠、`host:port` 或 URL）。       |

### 輸出

| 旗標     | 說明                                       |
| -------- | ------------------------------------------------- |
| `--json` | 列印機器可讀摘要，而不是文字。 |

## `webhooks gmail run`

在前景執行 `gog watch serve` 加上 watch 自動續期迴圈。

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` 接受與 `setup` 相同的 `gog watch serve`、OpenClaw 傳遞、Pub/Sub 和 Tailscale 旗標，但下列除外：

- `--account` 在 `run` 上是**選用**（會回退到已設定的帳戶）。
- `run` **不**接受 `--project`、`--push-endpoint` 或 `--json`。
- `run` 旗標沒有內建預設值；缺少的值會回退到 `setup` 寫入的值。

| 分類          | 旗標                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`、`--topic`、`--subscription`、`--label`                              |
| OpenClaw 傳遞 | `--hook-url`、`--hook-token`、`--push-token`                                     |
| `gog watch serve` | `--bind`、`--port`、`--path`、`--include-body`、`--max-bytes`、`--renew-minutes` |
| Tailscale         | `--tailscale`、`--tailscale-path`、`--tailscale-target`                          |

<Note>
對於 `run`，`--topic` 值是完整的 Pub/Sub topic 路徑（`projects/.../topics/...`），而不只是簡短的 topic 名稱。
</Note>

## 端對端流程

請參閱 [Gmail Pub/Sub 整合](/zh-TW/automation/cron-jobs#gmail-pubsub-integration)，了解與這些 CLI 命令搭配使用的 GCP 專案、OAuth 和 Gateway 端設定。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Webhook 自動化](/zh-TW/automation/cron-jobs)
- [Gmail Pub/Sub](/zh-TW/automation/cron-jobs#gmail-pubsub-integration)
