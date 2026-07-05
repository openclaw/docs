---
read_when:
    - 設定常駐群組或頻道聊天室
    - 你希望代理程式監看聊天室對話，但不要自動發布最終文字
    - 偵錯輸入狀態與權杖使用量，且沒有可見的聊天室訊息
sidebarTitle: Ambient room events
summary: 讓受支援的群組聊天室提供安靜的上下文，除非代理程式使用訊息工具傳送。
title: 環境房間事件
x-i18n:
    generated_at: "2026-07-05T11:01:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1ac64dfa6d1af4e30397819ef1b94cd0fb0b838025dbb1129e685782f8679c1
    source_path: channels/ambient-room-events.md
    workflow: 16
---

環境房間事件讓 OpenClaw 將未提及的群組或頻道閒聊當作安靜的上下文處理。代理可以更新記憶與工作階段狀態，但除非代理明確呼叫 `message` 工具，否則房間會保持靜默。

對於持續啟用的群組聊天，請將 `messages.groupChat.unmentionedInbound: "room_event"` 與 `messages.groupChat.visibleReplies: "message_tool"` 搭配使用。代理會聆聽、判斷何時回覆有幫助，並且不再需要舊式回答 `NO_REPLY` 的提示模式。

目前支援：Discord 公會頻道、Slack 頻道與私人頻道、Slack 多人私訊，以及 Telegram 群組或超級群組。其他群組頻道會維持既有的群組行為，除非其頻道頁面說明支援環境房間事件。

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

接著停用該房間的提及閘控，讓房間持續啟用。房間仍必須通過其一般的 `groupPolicy`、房間允許清單，以及傳送者允許清單。

儲存設定後，閘道會熱套用 `messages` 設定。只有在檔案監看或設定重新載入停用時才需要重新啟動（`gateway.reload.mode: "off"`）。

## 變更內容

使用 `messages.groupChat.unmentionedInbound: "room_event"` 時：

- 未提及且允許的群組或頻道訊息會成為安靜的房間事件
- 提及的訊息仍會是使用者請求
- 文字控制命令與原生命令仍會是使用者請求
- 中止或停止請求仍會是使用者請求
- 直接訊息仍會是使用者請求

房間事件使用嚴格的可見傳遞。最終助理文字是私密的。代理必須呼叫 `message(action=send)` 才能在房間中發文。

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

當只有一個頻道應該是環境模式時，請使用個別頻道的 Discord 設定。在 `groupPolicy: "allowlist"` 下，列出該頻道就是允許它（`enabled: false` 會停用項目）：

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

Slack 頻道允許清單以 ID 優先。請使用像 `C12345678` 這樣的頻道 ID，而不是 `#channel-name`。在 `channels.slack.channels` 下列出該頻道就是允許它（`enabled: false` 會停用項目）：

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

對於 Telegram 群組，機器人必須能夠看到一般群組訊息。如果 `requireMention: false`，請停用 BotFather 隱私模式，或使用另一種會將完整群組流量傳遞給機器人的 Telegram 設定。

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

## 代理專屬政策

當多個代理共用同一個房間，但只有一個代理應該將未提及的閒聊視為環境上下文時，請使用代理覆寫：

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

`messages.groupChat.visibleReplies` 對一般群組／頻道使用者請求預設為 `"automatic"`。當最終助理文字應該在不需要明確訊息工具呼叫的情況下可見地發出時，請保留該預設值。

對於持續啟用的環境房間，仍建議使用 `messages.groupChat.visibleReplies: "message_tool"`，尤其是搭配像 GPT 5.5 這類最新世代、工具可靠的模型。它讓代理透過呼叫訊息工具來決定何時發言。如果模型在未呼叫工具的情況下回傳最終文字，OpenClaw 會將該最終文字保持私密，並記錄被抑制傳遞的中繼資料。

即使其他群組請求使用自動回覆，房間事件仍會保持嚴格。未提及的環境房間事件一律需要 `message(action=send)` 才會產生可見輸出。

## 歷史記錄

`messages.groupChat.historyLimit` 會設定全域群組歷史記錄預設值（未設定時為 50；必須是正整數）。頻道可以使用 `channels.<channel>.historyLimit` 覆寫它，部分頻道也支援個別帳號的歷史記錄限制。將頻道層級的 `historyLimit: 0` 設定為停用該頻道的群組歷史上下文。

支援房間事件的頻道會保留近期環境房間訊息作為上下文。Telegram 會保留一個依 `historyLimit` 限制的持續啟用、按群組滾動視窗；使用者請求回合會選取機器人最後一次記錄回覆之後的項目，而房間事件回合會接收完整的近期視窗，讓模型能看到自己最近的發文。已淘汰的 Telegram `includeGroupHistoryContext` 模式鍵會由 `openclaw doctor --fix` 移除。

## 疑難排解

如果房間顯示正在輸入或權杖用量，但沒有可見訊息：

1. 確認房間已由頻道允許清單與傳送者允許清單允許。
2. 確認 `requireMention: false` 已設定在你預期的房間層級。
3. 檢查 `messages.groupChat.unmentionedInbound` 或代理覆寫是否為 `"room_event"`。
4. 檢查日誌中是否有被抑制的最終酬載中繼資料，或 `didSendViaMessagingTool: false`。
5. 對於一般群組請求，如果你希望自動張貼最終回覆，請保留或還原 `messages.groupChat.visibleReplies: "automatic"`。對於使用 `message_tool` 的環境房間，請使用能可靠呼叫工具的模型／執行階段。

如果 Telegram 環境房間完全沒有觸發，請檢查 BotFather 隱私模式，並確認閘道正在接收一般群組訊息。

如果 Slack 環境房間沒有觸發，請確認頻道鍵是 Slack 頻道 ID，且應用程式具有該房間類型的歷史記錄範圍：`channels:history`（公開）、`groups:history`（私人）或 `mpim:history`（多人私訊）。

## 相關

- [群組](/zh-TW/channels/groups)
- [Discord](/zh-TW/channels/discord)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [頻道設定參考](/zh-TW/gateway/config-channels)
