---
read_when:
    - 在多個訊息頻道中設定相同的允許清單
    - 共用私訊與群組傳送者存取規則
    - 檢視訊息頻道存取控制
summary: 訊息頻道可重複使用的傳送者允許清單
title: 存取群組
x-i18n:
    generated_at: "2026-07-11T21:07:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

存取群組是具名的傳送者清單，您只需在 `accessGroups` 下定義一次，即可在頻道允許清單中使用 `accessGroup:<name>` 參照。

當相同人員應獲准使用多個訊息頻道，或同一組受信任人員應同時適用於私訊與群組傳送者授權時，請使用存取群組。

群組本身不授予任何權限。只有允許清單欄位參照它時才會生效。

## 靜態訊息傳送者群組

靜態傳送者群組使用 `type: "message.senders"`。`members` 以訊息頻道 ID 作為鍵，另加 `"*"`，用於每個頻道共用的項目：

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

| 鍵                         | 含義                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `"*"`                      | 對每個參照該群組的訊息頻道檢查的共用項目。                 |
| `discord`, `telegram`, ... | 僅供該頻道進行允許清單比對時檢查的項目。                   |

項目會依目標頻道的一般 `allowFrom` 規則進行比對。OpenClaw 不會在頻道之間轉換傳送者 ID：如果 Alice 同時有 Telegram ID 和 Discord ID，請將這兩個 ID 分別列在對應的頻道鍵下。

## 從允許清單參照群組

在訊息頻道路徑支援傳送者允許清單的任何位置，使用 `accessGroup:<name>` 參照群組。

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

您可以混用群組與直接項目：

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

## 支援的訊息頻道路徑

存取群組可用於共用的訊息頻道授權路徑：

- 私訊傳送者允許清單，例如 `channels.<channel>.allowFrom`
- 群組傳送者允許清單，例如 `channels.<channel>.groupAllowFrom`
- 使用相同傳送者比對規則的頻道專屬個別聊天室傳送者允許清單（例如 Google Chat 的 `groups.<space>.users`）
- 重複使用訊息頻道傳送者允許清單的命令授權路徑

頻道是否支援此功能，取決於該頻道是否接入共用的 OpenClaw 傳送者授權輔助函式。目前隨附的支援包括 ClickClack、Discord、Feishu、Google Chat、iMessage、IRC、LINE、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Signal、Slack、SMS、Telegram、WhatsApp、Zalo 和 Zalo Personal。靜態 `message.senders` 群組不限定頻道，因此新的訊息頻道只要使用共用的外掛 SDK 傳入輔助函式，而非自訂允許清單展開機制，即可支援這類群組。

## Discord 頻道受眾

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

`discord.channelAudience` 表示「允許目前能檢視頻道伺服器中此頻道的 Discord 私訊傳送者」。OpenClaw 會在授權時透過 Discord 解析傳送者，並套用 Discord 的 `ViewChannel` 權限規則。`membership` 為選填，預設為 `canViewChannel`。

當某個 Discord 頻道已是團隊的權威資料來源（例如 `#maintainers` 或 `#on-call`）時，請使用此功能。

要求與失敗行為：

- 機器人需要具備該伺服器與頻道的存取權。
- 機器人需要 Discord Developer Portal 的 **Server Members Intent**。
- 當 Discord 傳回 `Missing Access`、無法將傳送者解析為伺服器成員，或頻道屬於其他伺服器時，存取群組會採取拒絕存取的安全預設。

更多 Discord 專屬範例：[Discord 存取控制](/zh-TW/channels/discord#access-control-and-routing)

## 外掛診斷

外掛作者可以檢查結構化的存取群組狀態，而不必將其展開回扁平的允許清單：

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

結果會回報已參照、已比對、缺少、不支援及失敗的群組。請將其用於診斷或一致性測試。只有仍預期扁平 `allowFrom` 陣列的相容性路徑才應使用 `expandAllowFromWithAccessGroups(...)`。

## 安全性注意事項

- 存取群組是允許清單的別名，不是角色。它們本身不會建立擁有者、核准配對要求或授予工具權限。
- `dmPolicy: "open"` 仍要求有效的私訊允許清單中包含 `"*"`。參照存取群組不等同於公開存取。
- 缺少群組名稱時會採取拒絕存取的安全預設。如果 `allowFrom` 包含 `accessGroup:operators`，但不存在 `accessGroups.operators`，該項目不會授權任何人。
- 維持頻道 ID 穩定。當頻道同時支援數字／使用者 ID 與顯示名稱時，應優先使用前者。

## 疑難排解

如果某位傳送者應該符合條件，卻遭到封鎖：

1. 確認允許清單欄位包含完全相符的 `accessGroup:<name>` 參照。
2. 確認 `accessGroups.<name>.type` 正確。
3. 確認傳送者 ID 列在相符的頻道鍵或 `"*"` 下。
4. 確認該項目使用該頻道的一般允許清單語法。
5. 對於 Discord 頻道受眾，請確認機器人可以看到該伺服器頻道，且已啟用 Server Members Intent。

編輯存取控制設定後，請執行 `openclaw doctor`。它可以在執行階段之前找出許多無效的允許清單與政策組合。
