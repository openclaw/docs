---
read_when:
    - 跨多個訊息頻道設定相同的允許清單
    - 分享私訊與群組寄件者存取規則
    - 審查訊息頻道存取控制
summary: 訊息通道的可重複使用寄件者允許清單
title: 存取群組
x-i18n:
    generated_at: "2026-07-05T11:01:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

存取群組是你在 `accessGroups` 下定義一次的命名傳送者清單，並可透過 `accessGroup:<name>` 從通道允許清單參照。

當同一批人應該被允許使用多個訊息通道，或同一組受信任的人應該同時適用於私訊和群組傳送者授權時，請使用它們。

群組本身不授予任何權限。只有在允許清單欄位參照它時才有作用。

## 靜態訊息傳送者群組

靜態傳送者群組使用 `type: "message.senders"`。`members` 以訊息通道 ID 為鍵，並使用 `"*"` 表示每個通道共用的項目：

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

| 鍵                         | 意義                                                                        |
| -------------------------- | --------------------------------------------------------------------------- |
| `"*"`                      | 會針對每個參照該群組的訊息通道檢查的共用項目。                            |
| `discord`, `telegram`, ... | 只會針對該通道的允許清單比對檢查的項目。                                  |

項目會依目的通道的一般 `allowFrom` 規則進行比對。OpenClaw 不會在通道之間轉譯傳送者 ID：如果 Alice 有 Telegram ID 和 Discord ID，請在對應的通道鍵下列出兩個 ID。

## 從允許清單參照群組

在訊息通道路徑支援傳送者允許清單的任何地方，都可以用 `accessGroup:<name>` 參照群組。

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

群組傳送者允許清單範例：

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
      groups: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

你可以混用群組和直接項目：

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

存取群組可在共用訊息通道授權路徑中使用：

- 私訊傳送者允許清單，例如 `channels.<channel>.allowFrom`
- 群組傳送者允許清單，例如 `channels.<channel>.groupAllowFrom`
- 使用相同傳送者比對規則的通道專屬逐聊天室傳送者允許清單（例如 Google Chat `groups.<space>.users`）
- 重用訊息通道傳送者允許清單的命令授權路徑

通道支援取決於該通道是否接入共用的 OpenClaw 傳送者授權輔助工具。目前內建支援包含 ClickClack、Discord、Feishu、Google Chat、iMessage、IRC、LINE、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Signal、Slack、SMS、Telegram、WhatsApp、Zalo 和 Zalo Personal。靜態 `message.senders` 群組與通道無關，因此新的訊息通道只要使用共用的外掛 SDK 入口輔助工具，而不是自訂允許清單展開，就能取得這些群組。

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

`discord.channelAudience` 表示「允許目前可以檢視此公會通道的 Discord 私訊傳送者」。OpenClaw 會在授權時透過 Discord 解析傳送者，並套用 Discord `ViewChannel` 權限規則。`membership` 是選用項，預設為 `canViewChannel`。

當 Discord 通道已經是團隊的事實來源時使用，例如 `#maintainers` 或 `#on-call`。

需求和失敗行為：

- 機器人需要具備存取該公會和通道的權限。
- 機器人需要 Discord Developer Portal 的**伺服器成員意圖**。
- 當 Discord 回傳 `Missing Access`、傳送者無法解析為公會成員，或通道屬於另一個公會時，存取群組會失敗關閉。

更多 Discord 專屬範例：[Discord 存取控制](/zh-TW/channels/discord#access-control-and-routing)

## 外掛診斷

外掛作者可以檢查結構化的存取群組狀態，而不必將其展開回扁平允許清單：

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

結果會報告已參照、已比對、遺失、不支援和失敗的群組。請將它用於診斷或符合性測試。只有在相容性路徑仍預期扁平 `allowFrom` 陣列時，才使用 `expandAllowFromWithAccessGroups(...)`。

## 安全性注意事項

- 存取群組是允許清單別名，不是角色。它們本身不會建立擁有者、核准配對請求，或授予工具權限。
- `dmPolicy: "open"` 仍需要有效的私訊允許清單中有 `"*"`。參照存取群組不等同於公開存取。
- 遺失的群組名稱會失敗關閉。如果 `allowFrom` 包含 `accessGroup:operators`，而 `accessGroups.operators` 不存在，該項目不會授權任何人。
- 保持通道 ID 穩定。當通道同時支援數字/使用者 ID 和顯示名稱時，優先使用數字/使用者 ID。

## 疑難排解

如果傳送者應該符合但被封鎖：

1. 確認允許清單欄位包含確切的 `accessGroup:<name>` 參照。
2. 確認 `accessGroups.<name>.type` 正確。
3. 確認傳送者 ID 已列在相符的通道鍵下，或列在 `"*"` 下。
4. 確認該項目使用該通道的一般允許清單語法。
5. 對於 Discord 通道受眾，確認機器人可以看到該公會通道，且已啟用伺服器成員意圖。

編輯存取控制設定後，請執行 `openclaw doctor`。它會在執行階段前找出許多無效的允許清單和政策組合。
