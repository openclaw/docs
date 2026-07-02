---
read_when:
    - 設定常駐群組或頻道聊天室
    - 你希望代理監看聊天室對話，但不要自動發布最終文字
    - 偵錯沒有可見聊天室訊息時的輸入與權杖用量
sidebarTitle: Ambient room events
summary: 讓支援的群組聊天室提供安靜的上下文，除非代理使用訊息工具傳送
title: 房間環境事件
x-i18n:
    generated_at: "2026-07-02T17:30:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

環境式聊天室事件讓 OpenClaw 能將未提及它的群組或頻道閒聊作為安靜脈絡處理。代理可以更新記憶與工作階段狀態，但聊天室會保持靜默，除非代理明確呼叫 `message` 工具。

對於常駐群組聊天，這是建議模式：將 `messages.groupChat.unmentionedInbound: "room_event"` 與 `messages.groupChat.visibleReplies: "message_tool"` 搭配使用。當代理應該聆聽、判斷何時回覆有用，並避免舊式回答 `NO_REPLY` 的提示模式時，請使用它。

目前支援：Discord 伺服器頻道、Slack 頻道與私人頻道、Slack 多人私訊，以及 Telegram 群組或超級群組。其他群組頻道會保留既有群組行為，除非其頻道頁面說明支援環境式聊天室事件。

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

接著停用該聊天室的提及門檻，將聊天室本身設定為常駐。頻道仍必須通過其一般 `groupPolicy`、聊天室允許清單與傳送者允許清單。

儲存設定後，閘道會熱重載 `messages` 設定。只有在檔案監看或設定重載停用時才需要重新啟動。

## 變更內容

使用 `messages.groupChat.unmentionedInbound: "room_event"` 時：

- 未提及它的已允許群組或頻道訊息會變成安靜的聊天室事件
- 提及它的訊息仍是使用者請求
- 文字命令與原生命令仍是使用者請求
- 中止或停止請求仍是使用者請求
- 直接訊息仍是使用者請求

聊天室事件使用嚴格的可見傳遞。最終助理文字是私密的。代理必須呼叫 `message(action=send)` 才能在聊天室中發布。

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

當只有一個頻道應為環境式頻道時，請使用個別頻道的 Discord 設定：

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
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

Slack 頻道允許清單優先使用 ID。請使用像 `C12345678` 這類頻道 ID，而不是 `#channel-name`。

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
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram 範例

對於 Telegram 群組，機器人必須能看到一般群組訊息。如果 `requireMention: false`，請停用 BotFather 隱私模式，或使用另一種會將完整群組流量傳遞給機器人的 Telegram 設定。

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

Telegram 群組 ID 通常是像 `-1001234567890` 這類負數。請從 `openclaw logs --follow` 讀取 `chat.id`、將群組訊息轉寄給 ID 輔助機器人，或檢查 Bot API `getUpdates`。

## 代理專屬政策

當多個代理共用同一個聊天室，但只有其中一個應將未提及它的閒聊視為環境脈絡時，請使用代理覆寫：

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

代理專屬的 `agents.list[].groupChat.unmentionedInbound` 值會覆寫該代理的 `messages.groupChat.unmentionedInbound`。

## 可見回覆模式

對於一般群組/頻道使用者請求，`messages.groupChat.visibleReplies` 預設為 `"automatic"`。當你希望最終助理文字不需要明確呼叫訊息工具也能可見發布時，請保留該預設值。

對於環境式常駐聊天室，仍建議使用 `messages.groupChat.visibleReplies: "message_tool"`，尤其是搭配最新世代、工具可靠的模型，例如 GPT 5.5。它讓代理透過呼叫訊息工具來決定何時發言。如果模型在未呼叫工具的情況下回傳最終文字，OpenClaw 會將該最終文字保留為私密，並記錄已抑制傳遞的中繼資料。

即使其他群組請求使用自動回覆，聊天室事件仍保持嚴格。未提及它的環境式聊天室事件仍需要 `message(action=send)` 才能產生可見輸出。

## 歷史記錄

`messages.groupChat.historyLimit` 控制全域群組歷史記錄預設值。頻道可以使用 `channels.<channel>.historyLimit` 覆寫它，部分頻道也支援個別帳號的歷史記錄限制。

設定 `historyLimit: 0` 可停用群組歷史脈絡。

支援聊天室事件的頻道會保留最近的環境式聊天室訊息作為脈絡。Telegram 會保留一個由 `historyLimit` 限制的常駐每群組滾動視窗；使用者請求回合會選取機器人最後一次記錄回覆之後的項目，而聊天室事件回合會接收完整的最近視窗，讓模型能看到自己最近發布的內容。已淘汰的 Telegram `includeGroupHistoryContext` 模式鍵會由 `openclaw doctor --fix` 移除。

## 疑難排解

如果聊天室顯示正在輸入或有 token 使用量，但沒有可見訊息：

1. 確認聊天室已被頻道允許清單與傳送者允許清單允許。
2. 確認 `requireMention: false` 已設定在你預期的聊天室層級。
3. 檢查 `messages.groupChat.unmentionedInbound` 或代理覆寫是否為 `"room_event"`。
4. 檢查記錄中是否有已抑制的最終承載中繼資料或 `didSendViaMessagingTool: false`。
5. 對於一般群組請求，如果你希望最終回覆自動發布，請保留或還原 `messages.groupChat.visibleReplies: "automatic"`。對於使用 `message_tool` 的環境式聊天室，請使用能可靠呼叫工具的模型/執行階段。

如果 Telegram 環境式聊天室完全沒有觸發，請檢查 BotFather 隱私模式，並確認閘道正在接收一般群組訊息。

如果 Slack 環境式聊天室沒有觸發，請確認頻道鍵是 Slack 頻道 ID，且應用程式具備該聊天室類型所需的 `channels:history` 或 `groups:history` 範圍。

## 相關

- [群組](/zh-TW/channels/groups)
- [Discord](/zh-TW/channels/discord)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [頻道設定參考](/zh-TW/gateway/config-channels)
