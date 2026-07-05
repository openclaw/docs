---
read_when:
    - 將 OpenClaw 連接到 ClickClack 工作區
    - 測試 ClickClack Bot 身分
summary: ClickClack bot-token 通道設定與目標語法
title: ClickClack
x-i18n:
    generated_at: "2026-07-05T11:01:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f268ab4ec96226a890aa1be7ccd1f05c9c92656aa5347864b1c74026dea9098
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 透過一級支援的 ClickClack bot token，將 OpenClaw 連接到自託管的 ClickClack 工作區。

當你希望 OpenClaw 代理以 ClickClack bot 使用者身分出現時，請使用此功能。ClickClack 支援獨立服務 bot 和使用者擁有的 bot；使用者擁有的 bot 會保留 `owner_user_id`，且只接收你授予的 token scope。

## 快速設定

在 ClickClack 伺服器上建立 bot token：

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

若是使用者擁有的 bot，請加入 `--owner <user_id>`。

設定 OpenClaw：

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

然後執行：

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

只有在 `baseUrl`、`token` 和 `workspace` 都已設定時，帳號才會被視為已設定。`workspace` 接受工作區 ID（`wsp_...`）、slug 或名稱；閘道會在啟動時將其解析為 ID。

### 帳號設定鍵

| 鍵                      | 預設值              | 備註                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 無（必要）          | ClickClack 伺服器 URL。                                                                 |
| `token`                 | 無（必要）          | 純字串或 secret ref（`source: "env" \| "file" \| "exec"`）。                            |
| `workspace`             | 無（必要）          | 工作區 ID、slug 或名稱。                                                                |
| `replyMode`             | `"agent"`           | `"agent"` 執行完整代理管線；`"model"` 傳送簡短的直接模型補全。                          |
| `defaultTo`             | `"channel:general"` | 當輸出路徑未提供目標時使用的目標。                                                      |
| `allowFrom`             | `["*"]`             | 入站 DM 和頻道訊息的使用者 ID allowlist。                                               |
| `botUserId`             | 自動偵測            | 啟動時從 bot token 身分解析。                                                           |
| `agentId`               | 路由預設值          | 將此帳號的入站訊息固定到單一代理。                                                      |
| `toolsAllow`            | 無                  | 此帳號的代理回覆可使用的工具 allowlist。                                                |
| `model`, `systemPrompt` | 無                  | 供 `replyMode: "model"` 補全使用。                                                      |
| `reconnectMs`           | `1500`              | 即時重新連線延遲（100 到 60000）。                                                      |

如果 `plugins.allow` 是非空的限制清單，在頻道設定中明確選取
ClickClack，或執行 `openclaw plugins enable clickclack`，
會將 `clickclack` 附加到該清單。Onboarding 安裝使用相同的
明確選取行為。這些路徑不會覆寫 `plugins.deny` 或全域
`plugins.enabled: false` 設定。直接執行
`openclaw plugins install @openclaw/clickclack` 會遵循一般
外掛安裝政策，也會在既有 allowlist 中記錄 ClickClack。

## 多個 bot

每個帳號都會開啟自己的 ClickClack 即時連線，並使用自己的 bot token。

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## 回覆模式

- `replyMode: "agent"`（預設）會透過一般代理管線分派入站訊息，包括工作階段記錄和工具政策。
- `replyMode: "model"` 會跳過代理管線，並使用外掛執行階段的 `llm.complete` 進行簡短的直接 bot 回覆（可選擇由 `model` 和 `systemPrompt` 塑形）。

模型模式會針對解析出的 bot 代理 ID 執行補全，這需要明確的
`plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信任
位元：

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

如果你只使用預設的 `agent` 回覆模式，請保持信任位元關閉；此模式
不需要它。

## 目標

- `channel:<name-or-id>` 傳送到工作區頻道。裸目標預設為 `channel:`。
- `dm:<user_id>` 會建立或重用與該使用者的直接對話。
- `thread:<message_id>` 會在以該訊息為根的討論串中回覆。

明確的輸出目標也可以帶有 `clickclack:` 或 `cc:` provider 前綴。

範例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 權限

ClickClack token scope 由 ClickClack API 強制執行。

- `bot:read`：讀取工作區、頻道、訊息、討論串、DM、即時和個人資料資料。
- `bot:write`：`bot:read` 加上頻道訊息、討論串回覆、DM 和上傳。
- `bot:admin`：`bot:write` 加上頻道建立。

OpenClaw 在一般代理聊天中只需要 `bot:write`。

## 疑難排解

- `ClickClack is not configured for account "<id>"`：為該帳號設定 `baseUrl`、`token`（例如透過 `CLICKCLACK_BOT_TOKEN`）和 `workspace`。
- `ClickClack workspace not found: <value>`：將 `workspace` 設為 ClickClack 傳回的工作區 ID、slug 或名稱。
- 沒有入站回覆：確認 token 具有即時讀取存取權，並注意 bot 會忽略自己的訊息和其他 bot 的訊息。
- 頻道傳送失敗：確認 bot 是該工作區的成員，且具有 `bot:write`。
