---
read_when:
    - 在多個訊息頻道中設定相同的允許清單
    - 分享私訊與群組傳送者存取規則
    - 檢閱訊息通道存取控制
summary: 訊息通道的可重用寄件者允許清單
title: 存取群組
x-i18n:
    generated_at: "2026-05-02T02:44:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

存取群組是你定義一次、並在通道允許清單中以 `accessGroup:<name>` 參照的具名寄件者清單。

當同一批人應該被允許使用多個訊息通道，或一組受信任的名單應同時套用到私訊和群組寄件者授權時，請使用存取群組。

存取群組本身不會授予存取權。只有在允許清單欄位參照某個群組時，該群組才有作用。

## 靜態訊息寄件者群組

靜態寄件者群組使用 `type: "message.senders"`。

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

成員清單會依訊息通道識別碼作為鍵：

| 鍵         | 意義                                                                 |
| ---------- | -------------------------------------------------------------------- |
| `"*"`      | 對每個參照此群組的訊息通道檢查的共用項目。                           |
| `discord`  | 僅針對 Discord 允許清單比對檢查的項目。                              |
| `telegram` | 僅針對 Telegram 允許清單比對檢查的項目。                             |
| `whatsapp` | 僅針對 WhatsApp 允許清單比對檢查的項目。                             |

項目會使用目的地通道的一般 `allowFrom` 規則進行比對。OpenClaw 不會在通道之間轉換寄件者識別碼。如果 Alice 同時有 Telegram 識別碼和 Discord 識別碼，請將兩個識別碼都列在對應的鍵下。

## 從允許清單參照群組

在訊息通道路徑支援寄件者允許清單的任何位置，使用 `accessGroup:<name>` 參照群組。

私訊允許清單範例：

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

群組寄件者允許清單範例：

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

你可以混合使用群組和直接項目：

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## 支援的訊息通道路徑

存取群組可用於共用訊息通道授權路徑，包括：

- 私訊寄件者允許清單，例如 `channels.<channel>.allowFrom`
- 群組寄件者允許清單，例如 `channels.<channel>.groupAllowFrom`
- 使用相同寄件者比對規則的通道專屬逐聊天室寄件者允許清單
- 重用訊息通道寄件者允許清單的命令授權路徑

通道支援取決於該通道是否透過共用的 OpenClaw 寄件者授權輔助工具接線。目前內建支援包括 Discord、Google Chat、Nostr、WhatsApp、Zalo 和 Zalo Personal。靜態 `message.senders` 群組設計為不依賴通道，因此新的訊息通道應透過使用共用 Plugin SDK 輔助工具來支援它們，而不是自訂允許清單展開。

## Discord 通道受眾

Discord 也支援動態存取群組類型：

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` 表示「允許目前可以檢視此公會通道的 Discord 私訊寄件者」。OpenClaw 會在授權時透過 Discord 解析寄件者，並套用 Discord `ViewChannel` 權限規則。

當 Discord 通道已經是團隊的真實來源時使用此功能，例如 `#maintainers` 或 `#on-call`。

需求與失敗行為：

- 機器人需要具備公會和通道的存取權。
- 機器人需要 Discord Developer Portal **Server Members Intent**。
- 當 Discord 回傳 `Missing Access`、無法將寄件者解析為公會成員，或通道屬於另一個公會時，存取群組會失敗並關閉授權。

更多 Discord 專屬範例：[Discord 存取控制](/zh-TW/channels/discord#access-control-and-routing)

## 安全性注意事項

- 存取群組是允許清單別名，不是角色。它們本身不會建立擁有者、核准配對請求或授予工具權限。
- `dmPolicy: "open"` 仍需要有效私訊允許清單中有 `"*"`。參照存取群組不等同於公開存取。
- 缺少的群組名稱會失敗並關閉授權。如果 `allowFrom` 包含 `accessGroup:operators`，但 `accessGroups.operators` 不存在，該項目不會授權任何人。
- 保持通道識別碼穩定。當通道同時支援數字／使用者識別碼和顯示名稱時，優先使用數字／使用者識別碼。

## 疑難排解

如果某個寄件者應該相符但被封鎖：

1. 確認允許清單欄位包含精確的 `accessGroup:<name>` 參照。
2. 確認 `accessGroups.<name>.type` 正確。
3. 確認寄件者識別碼列在相符的通道鍵下，或列在 `"*"` 下。
4. 確認該項目使用該通道的一般允許清單語法。
5. 對於 Discord 通道受眾，確認機器人可以看到公會通道，並已啟用 Server Members Intent。

編輯存取控制設定後，請執行 `openclaw doctor`。它會在執行階段前捕捉許多無效的允許清單與政策組合。
