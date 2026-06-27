---
read_when:
    - 將 OpenClaw 連接到 ClickClack 工作區
    - 測試 ClickClack 機器人身分
summary: ClickClack 機器人權杖頻道設定與目標語法
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T18:54:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 透過第一級 ClickClack bot 權杖，將 OpenClaw 連接到自架的 ClickClack 工作區。

當你希望 OpenClaw 代理以 ClickClack bot 使用者身分出現時，請使用此功能。ClickClack 支援獨立服務 bot 與使用者擁有的 bot；使用者擁有的 bot 會保留 `owner_user_id`，並且只取得你授予的權杖範圍。

## 快速設定

在 ClickClack 中建立 bot 權杖：

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

若要建立使用者擁有的 bot，請加上 `--owner <user_id>`。

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

如果 `plugins.allow` 是非空的限制清單，在頻道設定中明確選取
ClickClack，或執行 `openclaw plugins enable clickclack`，
會將 `clickclack` 附加到該清單。入門安裝會使用相同的
明確選取行為。這些路徑不會覆寫 `plugins.deny` 或
全域 `plugins.enabled: false` 設定。直接執行
`openclaw plugins install @openclaw/clickclack` 會遵循一般
外掛安裝政策，並且也會將 ClickClack 記錄到既有的允許清單中。

## 多個 bot

每個帳戶都會開啟自己的 ClickClack 即時連線，並使用自己的 bot 權杖。

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

`replyMode: "model"` 會直接使用 `api.runtime.llm.complete` 產生簡短 bot 回覆。
當帳戶設定 `agentId` 時，OpenClaw 會要求明確的
`plugins.entries.clickclack.llm.allowAgentIdOverride` 信任位元，讓外掛
可以為該 bot 代理執行補全。如果你只使用預設代理路由，請保持關閉。

## 目標

- `channel:<name-or-id>` 傳送到工作區頻道。未加前綴的目標預設為 `channel:`。
- `dm:<user_id>` 建立或重用與該使用者的直接對話。
- `thread:<message_id>` 在既有討論串中回覆。

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

OpenClaw 在一般代理聊天中只需要 `bot:write`。

## 疑難排解

- `ClickClack is not configured`：設定 `channels.clickclack.token` 或 `CLICKCLACK_BOT_TOKEN`。
- `workspace not found`：將 `workspace` 設為 ClickClack 傳回的工作區 ID 或 slug。
- 沒有收到傳入回覆：確認權杖具有即時讀取存取權，且 bot 沒有回覆自己的訊息。
- 頻道傳送失敗：確認 bot 是工作區成員，且具有 `bot:write`。
