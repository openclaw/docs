---
read_when:
    - 在多個訊息通道中設定相同的允許清單
    - 分享私人訊息與群組寄件者存取規則
    - 檢閱訊息通道存取控制
summary: 訊息通道的可重複使用傳送者允許清單
title: 存取群組
x-i18n:
    generated_at: "2026-05-10T19:21:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
    postprocess_version: locale-links-v1
---

存取群組是具名的傳送者清單，你只需定義一次，並可透過 `accessGroup:<name>` 從通道允許清單參照。

當同一批人應該被允許使用多個訊息通道，或同一組受信任成員應同時套用於 DM 與群組傳送者授權時，請使用它們。

存取群組本身不會授予存取權。只有在允許清單欄位參照群組時，群組才有作用。

## 靜態訊息傳送者群組

靜態傳送者群組使用 `type: "message.senders"`。

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

成員清單以訊息通道 id 作為鍵：

| 鍵         | 意義                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | 檢查每個參照該群組的訊息通道時共用的項目。                              |
| `discord`  | 僅在 Discord 允許清單比對時檢查的項目。                                  |
| `telegram` | 僅在 Telegram 允許清單比對時檢查的項目。                                 |
| `whatsapp` | 僅在 WhatsApp 允許清單比對時檢查的項目。                                 |

項目會使用目標通道的一般 `allowFrom` 規則進行比對。OpenClaw 不會在通道之間轉換傳送者 id。如果 Alice 同時有 Telegram id 和 Discord id，請將兩個 id 分別列在適當的鍵下。

## 從允許清單參照群組

在訊息通道路徑支援傳送者允許清單的任何位置，使用 `accessGroup:<name>` 參照群組。

DM 允許清單範例：

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

存取群組可用於共用的訊息通道授權路徑，包括：

- DM 傳送者允許清單，例如 `channels.<channel>.allowFrom`
- 群組傳送者允許清單，例如 `channels.<channel>.groupAllowFrom`
- 使用相同傳送者比對規則的通道特定各聊天室傳送者允許清單
- 重用訊息通道傳送者允許清單的命令授權路徑

通道支援取決於該通道是否透過共用的 OpenClaw 傳送者授權輔助工具接線。目前內建支援包括 Discord、Feishu、Google Chat、iMessage、LINE、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQBot、Signal、WhatsApp、Zalo 和 Zalo Personal。靜態 `message.senders` 群組設計為與通道無關，因此新的訊息通道應透過使用共用的 plugin SDK 輔助工具來支援它們，而不是自訂允許清單展開。

## Plugin 診斷

Plugin 作者可以檢查結構化存取群組狀態，而不必將其展開回扁平允許清單：

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

結果會回報已參照、已比對、遺失、不支援和失敗的群組。當你需要診斷或符合性測試時，請使用這個方法。只有在相容性路徑仍預期扁平 `allowFrom` 陣列時，才使用 `expandAllowFromWithAccessGroups(...)`。

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

`discord.channelAudience` 的意思是「允許目前可以檢視此 guild 通道的 Discord DM 傳送者」。OpenClaw 會在授權時透過 Discord 解析傳送者，並套用 Discord `ViewChannel` 權限規則。

當 Discord 通道已經是團隊的事實來源時，例如 `#maintainers` 或 `#on-call`，請使用這個方法。

需求與失敗行為：

- bot 需要能夠存取 guild 和通道。
- bot 需要 Discord Developer Portal **Server Members Intent**。
- 當 Discord 傳回 `Missing Access`、傳送者無法解析為 guild 成員，或通道屬於另一個 guild 時，存取群組會封閉失敗。

更多 Discord 專屬範例：[Discord 存取控制](/zh-TW/channels/discord#access-control-and-routing)

## 安全性注意事項

- 存取群組是允許清單別名，而不是角色。它們本身不會建立擁有者、核准配對請求，或授予工具權限。
- `dmPolicy: "open"` 仍需要有效的 DM 允許清單中包含 `"*"`。參照存取群組不等同於公開存取。
- 遺失的群組名稱會封閉失敗。如果 `allowFrom` 包含 `accessGroup:operators` 而 `accessGroups.operators` 不存在，該項目不會授權任何人。
- 保持通道 id 穩定。當通道同時支援數字／使用者 id 和顯示名稱時，偏好使用前者。

## 疑難排解

如果傳送者應該比對但被封鎖：

1. 確認允許清單欄位包含精確的 `accessGroup:<name>` 參照。
2. 確認 `accessGroups.<name>.type` 正確。
3. 確認傳送者 id 已列在相符的通道鍵下，或列在 `"*"` 下。
4. 確認該項目使用該通道的一般允許清單語法。
5. 對於 Discord 通道受眾，確認 bot 可以看到 guild 通道，且已啟用 Server Members Intent。

編輯存取控制設定後，執行 `openclaw doctor`。它會在執行階段之前捕捉許多無效的允許清單與政策組合。
