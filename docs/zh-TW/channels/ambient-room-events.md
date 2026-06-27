---
read_when:
    - 設定常駐群組或頻道聊天室
    - 你希望代理監看聊天室對話，但不要自動發布最終文字
    - 偵錯沒有可見房間訊息時的輸入與權杖用量
sidebarTitle: Ambient room events
summary: 讓支援的群組聊天室提供靜默脈絡，除非代理程式使用訊息工具傳送。
title: 環境聊天室事件
x-i18n:
    generated_at: "2026-06-27T18:54:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

環境房間事件讓 OpenClaw 將未提及的群組或頻道對話作為安靜脈絡處理。代理可以更新記憶與工作階段狀態，但除非代理明確呼叫 `message` 工具，否則房間會保持靜默。

對於永遠開啟的群組聊天，這是建議模式：將 `messages.groupChat.unmentionedInbound: "room_event"` 與 `messages.groupChat.visibleReplies: "message_tool"` 搭配使用。當代理應該聆聽、判斷何時回覆有幫助，並避免過去回覆 `NO_REPLY` 的提示模式時，請使用此模式。

目前支援：Discord 伺服器頻道、Slack 頻道與私人頻道、Slack 多人私訊，以及 Telegram 群組或超級群組。其他群組頻道會保留既有群組行為，除非其頻道頁面說明支援環境房間事件。

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

接著針對該房間停用提及門檻，將房間本身設定為永遠開啟。該頻道仍必須通過其一般 `groupPolicy`、房間允許清單與傳送者允許清單。

儲存設定後，閘道會熱重載 `messages` 設定。只有在檔案監看或設定重載停用時才需要重新啟動。

## 變更內容

使用 `messages.groupChat.unmentionedInbound: "room_event"` 時：

- 未提及但允許的群組或頻道訊息會成為安靜房間事件
- 已提及的訊息仍是使用者請求
- 文字命令與原生命令仍是使用者請求
- 中止或停止請求仍是使用者請求
- 直接訊息仍是使用者請求

房間事件使用嚴格的可見傳遞。最終助理文字是私密的。代理必須呼叫 `message(action=send)` 才會在房間中張貼。

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

當只有一個頻道應作為環境頻道時，請使用每頻道的 Discord 設定：

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

Slack 頻道允許清單以 ID 優先。請使用像 `C12345678` 這樣的頻道 ID，而不是 `#channel-name`。

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

對於 Telegram 群組，機器人必須能看見一般群組訊息。如果 `requireMention: false`，請停用 BotFather 隱私模式，或使用另一種會將完整群組流量傳遞給機器人的 Telegram 設定。

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

Telegram 群組 ID 通常是像 `-1001234567890` 這樣的負數。請從 `openclaw logs --follow` 讀取 `chat.id`、將群組訊息轉寄給 ID 輔助機器人，或檢查 Bot API `getUpdates`。

## 代理特定政策

當多個代理共用同一個房間，但只有其中一個應將未提及對話視為環境脈絡時，請使用代理覆寫：

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

代理特定的 `agents.list[].groupChat.unmentionedInbound` 值會覆寫該代理的 `messages.groupChat.unmentionedInbound`。

## 可見回覆模式

對於一般群組/頻道使用者請求，`messages.groupChat.visibleReplies` 預設為 `"automatic"`。當你希望最終助理文字不需要明確的訊息工具呼叫就可見張貼時，請保留該預設值。

對於環境永遠開啟房間，仍建議使用 `messages.groupChat.visibleReplies: "message_tool"`，特別是搭配最新世代、可靠使用工具的模型，例如 GPT 5.5。它讓代理透過呼叫訊息工具來決定何時發言。如果模型回傳最終文字但未呼叫工具，OpenClaw 會將該最終文字保持為私密，並記錄被抑制的傳遞中繼資料。

即使其他群組請求使用自動回覆，房間事件仍保持嚴格。未提及的環境房間事件仍需要 `message(action=send)` 才會產生可見輸出。

## 歷史記錄

`messages.groupChat.historyLimit` 控制全域群組歷史記錄預設值。頻道可以使用 `channels.<channel>.historyLimit` 覆寫它，部分頻道也支援每帳號歷史記錄限制。

設定 `historyLimit: 0` 可停用群組歷史脈絡。

支援房間事件的頻道會保留近期環境房間訊息作為脈絡。Discord 會保留房間事件歷史記錄，直到可見的 Discord 傳送成功為止，因此安靜脈絡不會在訊息工具傳遞前遺失。

## 疑難排解

如果房間顯示正在輸入或 token 使用量，但沒有可見訊息：

1. 確認房間已由頻道允許清單與傳送者允許清單允許。
2. 確認 `requireMention: false` 已設定在你預期的房間層級。
3. 檢查 `messages.groupChat.unmentionedInbound` 或代理覆寫是否為 `"room_event"`。
4. 檢查記錄中是否有被抑制的最終 payload 中繼資料或 `didSendViaMessagingTool: false`。
5. 對於一般群組請求，如果你希望最終回覆自動張貼，請保留或還原 `messages.groupChat.visibleReplies: "automatic"`。對於使用 `message_tool` 的環境房間，請使用能可靠呼叫工具的模型/執行階段。

如果 Telegram 環境房間完全沒有觸發，請檢查 BotFather 隱私模式，並確認閘道正在接收一般群組訊息。

如果 Slack 環境房間沒有觸發，請確認頻道鍵是 Slack 頻道 ID，且該應用程式具備該房間類型所需的 `channels:history` 或 `groups:history` 範圍。

## 相關

- [群組](/zh-TW/channels/groups)
- [Discord](/zh-TW/channels/discord)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [頻道設定參考](/zh-TW/gateway/config-channels)
