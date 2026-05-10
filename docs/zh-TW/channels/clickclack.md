---
read_when:
    - 將 OpenClaw 連接到 ClickClack 工作區
    - 測試 ClickClack 機器人身分
summary: ClickClack bot-token 頻道設定與目標語法
title: 喀噠喀噠
x-i18n:
    generated_at: "2026-05-10T19:20:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4860b5f0a40d38af99bec0b8187f723a30c9b4b78d2d1de50ba8a97954baeb
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 透過第一級 ClickClack 機器人權杖，將 OpenClaw 連接到自行託管的 ClickClack 工作區。

當你想讓 OpenClaw 代理程式以 ClickClack 機器人使用者的身分出現時，請使用此功能。ClickClack 支援獨立服務機器人與使用者擁有的機器人；使用者擁有的機器人會保留 `owner_user_id`，且只會取得你授予的權杖範圍。

## 快速設定

在 ClickClack 中建立機器人權杖：

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

若是使用者擁有的機器人，請加入 `--owner <user_id>`。

設定 OpenClaw：

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
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

接著執行：

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

## 多個機器人

每個帳號都會開啟自己的 ClickClack 即時連線，並使用自己的機器人權杖。

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
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` 會直接使用 `api.runtime.llm.complete` 來產生簡短的機器人回覆。
當帳號設定了 `agentId` 時，OpenClaw 需要明確的
`plugins.entries.clickclack.llm.allowAgentIdOverride` 信任位元，讓 Plugin
可以為該機器人代理程式執行 completions。如果你只使用預設
代理程式路由，請將其保持關閉。

## 目標

- `channel:<name-or-id>` 會傳送到工作區頻道。未加前綴的目標預設為 `channel:`。
- `dm:<user_id>` 會建立或重複使用與該使用者的直接對話。
- `thread:<message_id>` 會在現有討論串中回覆。

範例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 權限

ClickClack 權杖範圍由 ClickClack API 強制執行。

- `bot:read`：讀取工作區、頻道、訊息、討論串、DM、即時與個人檔案資料。
- `bot:write`：包含 `bot:read`，再加上頻道訊息、討論串回覆、DM 與上傳。
- `bot:admin`：包含 `bot:write`，再加上頻道建立。

OpenClaw 在一般代理程式聊天中只需要 `bot:write`。

## 疑難排解

- `ClickClack is not configured`：設定 `channels.clickclack.token` 或 `CLICKCLACK_BOT_TOKEN`。
- `workspace not found`：將 `workspace` 設為 ClickClack 傳回的工作區 ID 或 slug。
- 沒有收到傳入回覆：確認權杖具備即時讀取存取權，且機器人沒有回覆自己的訊息。
- 頻道傳送失敗：確認機器人是該工作區的成員，且具備 `bot:write`。
