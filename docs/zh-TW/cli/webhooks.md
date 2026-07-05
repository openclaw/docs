---
read_when:
    - 你想要將 Gmail Pub/Sub 事件接入 OpenClaw
    - 你需要完整的旗標清單與預設值
summary: '`openclaw webhooks` 的命令列介面參考（Gmail Pub/Sub 設定與執行器）'
title: 網路鉤子
x-i18n:
    generated_at: "2026-07-05T11:11:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

網路鉤子輔助工具與整合。目前此介面範圍限於建立在內建 `gog` 監看器上的 Gmail Pub/Sub 流程。

## 子命令

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| 子命令        | 說明                                                                                  |
| ------------- | ------------------------------------------------------------------------------------- |
| `gmail setup` | 一次性精靈：Gmail 監看、Pub/Sub 主題/訂閱，以及 OpenClaw 鉤子傳遞。                  |
| `gmail run`   | 在前景執行 `gog watch serve` 加上監看自動續約迴圈。                                  |

<Note>
一旦設定了 `hooks.enabled=true` 和 `hooks.gmail.account`（由 `gmail setup` 設定），閘道也會在啟動時自動啟動 `gog gmail watch serve`。`gmail run` 是在前景執行相同邏輯，適用於除錯或閘道監看器停用時。請參閱 [Gmail Pub/Sub 整合](/zh-TW/automation/cron-jobs#gmail-pubsub-integration)，了解自動啟動詳細資訊與 `OPENCLAW_SKIP_GMAIL_WATCHER` 退出選項。
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

如果缺少 `gcloud` 和 `gog`，則安裝它們；驗證 `gcloud`；建立 Pub/Sub 主題和訂閱；啟動 Gmail 監看；並寫入 `hooks.gmail` 設定與 `hooks.enabled=true`。列印 `Next: openclaw webhooks gmail run`。

### 必填

| 旗標                | 說明                  |
| ------------------- | --------------------- |
| `--account <email>` | 要監看的 Gmail 帳戶。 |

### Pub/Sub 選項

| 旗標                    | 預設值                 | 說明                                                                                                                               |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | （無）                 | GCP 專案 ID（OAuth 用戶端擁有者）。會退回使用主題自己的專案 ID，再退回使用從 `gog` 憑證解析出的專案。                             |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub 主題名稱。                                                                                                                 |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub 訂閱名稱。                                                                                                                 |
| `--label <label>`       | `INBOX`                | 要監看的 Gmail 標籤。                                                                                                              |
| `--push-endpoint <url>` | （無）                 | 明確的 Pub/Sub 推送端點。覆寫 Tailscale。                                                                                          |

### OpenClaw 傳遞選項

| 旗標                   | 預設值                                       | 說明                 |
| ---------------------- | -------------------------------------------- | -------------------- |
| `--hook-url <url>`     | 從 `hooks.path` 和閘道連接埠建構             | OpenClaw 網路鉤子 URL。 |
| `--hook-token <token>` | `hooks.token`，或產生的權杖                  | OpenClaw 網路鉤子權杖。 |
| `--push-token <token>` | 產生的權杖                                   | 轉送給 `gog watch serve` 的推送權杖。 |

### `gog watch serve` 選項

| 旗標                  | 預設值          | 說明                                                                                                                                             |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` 綁定主機。                                                                                                                     |
| `--port <port>`       | `8788`          | `gog watch serve` 連接埠。                                                                                                                       |
| `--path <path>`       | `/gmail-pubsub` | `gog watch serve` 路徑。當啟用 Tailscale 且未提供明確目標時，會強制為 `/`，因為 Tailscale 會在代理前移除路徑。                                  |
| `--include-body`      | `true`          | 包含電子郵件內文片段。沒有可關閉此功能的命令列介面旗標；請改在設定中設為 `hooks.gmail.includeBody: false`。                                     |
| `--max-bytes <n>`     | `20000`         | 每個內文片段的最大位元組數。                                                                                                                     |
| `--renew-minutes <n>` | `720`（12h）    | 每 N 分鐘續約 Gmail 監看。                                                                                                                       |

### Tailscale 暴露

| 旗標                      | 預設值   | 說明                                                              |
| ------------------------- | -------- | ----------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | 透過 tailscale 暴露推送端點：`funnel`、`serve` 或 `off`。          |
| `--tailscale-path <path>` | （無）   | tailscale serve/funnel 的路徑。                                   |
| `--tailscale-target <t>`  | （無）   | Tailscale serve/funnel 目標（連接埠、`host:port` 或 URL）。        |

### 輸出

| 旗標     | 說明                                     |
| -------- | ---------------------------------------- |
| `--json` | 列印機器可讀摘要，而不是文字。           |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

在前景執行 `gog watch serve` 加上監看自動續約迴圈；如果 `gog watch serve` 意外結束，會在 2 秒延遲後重新啟動。

`run` 接受與 `setup` 相同的 Pub/Sub、OpenClaw 傳遞、`gog watch serve` 和 Tailscale 旗標，但以下除外：

- `--account` 在 `run` 上是**選用**；它會退回使用 `hooks.gmail.account`。
- `run` **不**接受 `--project`、`--push-endpoint` 或 `--json`。
- 每個旗標都會退回使用相符的 `hooks.gmail.*` 設定值（由 `setup` 寫入），再退回使用 `setup` 所用的相同內建預設值，但有一個例外：當旗標和 `hooks.gmail.tailscale.mode` 都未設定時，`--tailscale` 在 `run` 上預設為 `off`（不是 `funnel`）。

| 類別              | 旗標                                                                             |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`、`--topic`、`--subscription`、`--label`                               |
| OpenClaw 傳遞     | `--hook-url`、`--hook-token`、`--push-token`                                      |
| `gog watch serve` | `--bind`、`--port`、`--path`、`--include-body`、`--max-bytes`、`--renew-minutes` |
| Tailscale         | `--tailscale`、`--tailscale-path`、`--tailscale-target`                           |

<Note>
對於 `run`，`--topic` 值是完整的 Pub/Sub 主題路徑（`projects/.../topics/...`），不只是短主題名稱。
</Note>

## 相關

- [命令列介面參考](/zh-TW/cli)
- [網路鉤子自動化](/zh-TW/automation/cron-jobs)
- [Gmail Pub/Sub 整合](/zh-TW/automation/cron-jobs#gmail-pubsub-integration)
