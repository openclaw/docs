---
read_when:
    - 設定常駐群組或頻道聊天室
    - 你希望代理程式監看聊天室對話，但不要自動發布最終文字
    - 偵錯沒有可見聊天室訊息時的輸入狀態與權杖用量
sidebarTitle: Ambient room events
summary: 讓支援的群組聊天室提供安靜的上下文，除非代理程式使用訊息工具傳送訊息
title: 環境房間事件
x-i18n:
    generated_at: "2026-07-11T21:07:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

環境房間事件讓 OpenClaw 能將群組或頻道中未提及代理程式的閒聊，作為安靜的上下文處理。代理程式可以更新記憶與工作階段狀態，但除非代理程式明確呼叫 `message` 工具，否則房間會保持靜默。

對於常駐運作的群組聊天，請搭配使用 `messages.groupChat.unmentionedInbound: "room_event"` 與 `messages.groupChat.visibleReplies: "message_tool"`。代理程式會持續聆聽、自行判斷何時回覆有幫助，且不再需要以回答 `NO_REPLY` 的舊式提示詞模式運作。

目前支援：Discord 伺服器頻道、Slack 頻道與私人頻道、Slack 多人私訊，以及 Telegram 群組或超級群組。其他群組頻道會維持其現有的群組行為，除非其頻道頁面註明支援環境房間事件。

## 建議設定

設定全域群組聊天行為：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

接著停用該房間的提及限制，使房間常駐運作。該房間仍必須通過其一般的 `groupPolicy`、房間允許清單及傳送者允許清單。

儲存設定後，閘道會熱套用 `messages` 設定。只有在停用檔案監看或設定重新載入時（`gateway.reload.mode: "off"`），才需要重新啟動。

## 行為變更

使用 `messages.groupChat.unmentionedInbound: "room_event"` 時：

- 允許的群組或頻道中未提及代理程式的訊息會成為安靜的房間事件
- 提及代理程式的訊息仍會作為使用者請求
- 文字控制命令與原生命令仍會作為使用者請求
- 中止或停止請求仍會作為使用者請求
- 私訊仍會作為使用者請求

房間事件採用嚴格的可見傳遞模式。助理的最終文字會保持私密。代理程式必須呼叫 `message(action=send)`，才能在房間中發文。

對於房間事件，輸入中狀態及生命週期狀態反應會維持停用。唯一明確的收訖確認例外是 `messages.ackReactionScope: "all"`，此設定會傳送所設定的確認反應；若房間必須完全保持靜默，請使用範圍更窄的設定或 `"off"`。

## Discord 範例

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

如果只有一個頻道需要採用環境模式，請使用 Discord 的個別頻道設定。在 `groupPolicy: "allowlist"` 下，列出頻道即代表允許該頻道（`enabled: false` 會停用該項目）：

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Slack 範例

Slack 頻道允許清單以 ID 為優先。請使用 `C12345678` 之類的頻道 ID，而非 `#channel-name`。在 `channels.slack.channels` 下列出頻道即代表允許該頻道（`enabled: false` 會停用該項目）：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram 範例

對於 Telegram 群組，機器人必須能看見一般群組訊息。若設定 `requireMention: false`，請停用 BotFather 的隱私模式，或使用其他能將完整群組流量傳遞給機器人的 Telegram 設定。

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Telegram 群組 ID 通常是負數，例如 `-1001234567890`。請從 `openclaw logs --follow` 讀取 `chat.id`、將群組訊息轉寄給 ID 查詢機器人，或檢查 Bot API 的 `getUpdates`。

## 代理程式專屬政策

當多個代理程式共用同一個房間，但只有其中一個應將未提及代理程式的閒聊視為環境上下文時，請使用代理程式覆寫設定：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

代理程式專屬的 `agents.list[].groupChat.unmentionedInbound` 值會覆寫該代理程式的 `messages.groupChat.unmentionedInbound`。

## 可見回覆模式

對於一般群組或頻道使用者請求，`messages.groupChat.visibleReplies` 預設為 `"automatic"`。如果助理的最終文字應在未明確呼叫訊息工具的情況下直接顯示，請保留此預設值。

對於常駐運作的環境房間，仍建議使用 `messages.groupChat.visibleReplies: "message_tool"`，尤其是搭配 GPT-5.6 Sol 等新一代、能可靠使用工具的模型。這可讓代理程式透過呼叫訊息工具來決定何時發言。如果模型未呼叫工具便傳回最終文字，OpenClaw 會將該最終文字保持私密，並記錄已抑制傳遞的中繼資料。

即使其他群組請求使用自動回覆，房間事件仍會維持嚴格模式。未提及代理程式的環境房間事件一律需要使用 `message(action=send)`，才能產生可見輸出。

## 歷史記錄

`messages.groupChat.historyLimit` 設定全域群組歷史記錄的預設值（未設定時為 50；必須是正整數）。頻道可透過 `channels.<channel>.historyLimit` 覆寫此值，部分頻道也支援各帳號的歷史記錄上限。將頻道層級的 `historyLimit` 設為 `0`，即可停用該頻道的群組歷史上下文。

支援房間事件的頻道會保留最近的環境房間訊息作為上下文。Telegram 會為每個群組維持由 `historyLimit` 限制的常駐滾動視窗；使用者請求回合會選取機器人最後一次已記錄回覆之後的項目，而房間事件回合則會接收完整的近期視窗，讓模型能看見自己最近的發文。已淘汰的 Telegram `includeGroupHistoryContext` 模式鍵會由 `openclaw doctor --fix` 移除。

## 疑難排解

如果房間顯示輸入中狀態或權杖用量，但沒有可見訊息：

1. 確認頻道允許清單與傳送者允許清單皆允許該房間。
2. 確認已在預期的房間層級設定 `requireMention: false`。
3. 檢查 `messages.groupChat.unmentionedInbound` 或代理程式覆寫設定是否為 `"room_event"`。
4. 檢查記錄中是否有已抑制的最終承載資料中繼資料或 `didSendViaMessagingTool: false`。
5. 對於一般群組請求，若希望自動發佈最終回覆，請保留或還原 `messages.groupChat.visibleReplies: "automatic"`。對於使用 `message_tool` 的環境房間，請使用能可靠呼叫工具的模型或執行環境。

如果 Telegram 環境房間完全沒有觸發，請檢查 BotFather 的隱私模式，並確認閘道正在接收一般群組訊息。

如果 Slack 環境房間沒有觸發，請確認頻道鍵是 Slack 頻道 ID，且應用程式具備該房間類型所需的歷史記錄權限範圍：`channels:history`（公開）、`groups:history`（私人）或 `mpim:history`（多人私訊）。

## 相關內容

- [群組](/zh-TW/channels/groups)
- [Discord](/zh-TW/channels/discord)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [頻道設定參考](/zh-TW/gateway/config-channels)
