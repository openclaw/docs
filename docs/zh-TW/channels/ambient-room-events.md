---
read_when:
    - 設定常駐群組或頻道路ーム
    - 你想讓代理監看聊天室對話，而不要自動發布最終文字
    - 偵錯沒有可見聊天室訊息時的輸入與權杖用量
sidebarTitle: Ambient room events
summary: 讓支援的群組聊天室提供安靜脈絡，除非代理使用訊息工具傳送
title: 環境房間事件
x-i18n:
    generated_at: "2026-07-06T10:46:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 66177ae942c20026b5aaf007ebbd115373f15aceff585952471abb7721115469
    source_path: channels/ambient-room-events.md
    workflow: 16
---

環境房間事件讓 OpenClaw 能將未提及的群組或頻道閒聊作為安靜的情境處理。代理程式可以更新記憶與工作階段狀態，但除非代理程式明確呼叫 `message` 工具，否則房間會保持沉默。

對於永遠開啟的群組聊天，請將 `messages.groupChat.unmentionedInbound: "room_event"` 與 `messages.groupChat.visibleReplies: "message_tool"` 搭配使用。代理程式會聆聽、判斷何時回覆有用，而且不再需要舊式提示詞模式中回答 `NO_REPLY`。

目前支援：Discord 公會頻道、Slack 頻道與私人頻道、Slack 多人私訊，以及 Telegram 群組或超級群組。其他群組頻道會保留既有的群組行為，除非其頻道頁面表示支援環境房間事件。

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

接著停用該房間的提及閘門，讓房間永遠開啟。房間仍必須通過其一般的 `groupPolicy`、房間允許清單與寄件者允許清單。

儲存設定後，閘道會熱套用 `messages` 設定。只有在檔案監看或設定重新載入已停用 (`gateway.reload.mode: "off"`) 時才需要重新啟動。

## 變更內容

使用 `messages.groupChat.unmentionedInbound: "room_event"` 時：

- 未提及且允許的群組或頻道訊息會成為安靜的房間事件
- 提及的訊息仍是使用者請求
- 文字控制命令與原生命令仍是使用者請求
- 中止或停止請求仍是使用者請求
- 直接訊息仍是使用者請求

房間事件使用嚴格的可見傳遞。最終助理文字是私密的。代理程式必須呼叫 `message(action=send)` 才會張貼到房間中。

房間事件會抑制輸入中與生命週期狀態反應。唯一明確的收件例外是 `messages.ackReactionScope: "all"`，它會傳送已設定的確認反應；當房間必須完全保持沉默時，請使用任何較窄的範圍或 `"off"`。

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

當只有一個頻道應為環境模式時，請使用每頻道 Discord 設定。在 `groupPolicy: "allowlist"` 下，列出頻道就是允許它 (`enabled: false` 會停用一個項目)：

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

Slack 頻道允許清單以 ID 優先。請使用像 `C12345678` 這樣的頻道 ID，而不是 `#channel-name`。在 `channels.slack.channels` 下列出頻道就是允許它 (`enabled: false` 會停用一個項目)：

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

Telegram 群組 ID 通常是負數，例如 `-1001234567890`。請從 `openclaw logs --follow` 讀取 `chat.id`、將群組訊息轉寄給 ID 輔助機器人，或檢查 Bot API `getUpdates`。

## 代理程式專屬政策

當多個代理程式共用同一個房間，但只有一個應將未提及的閒聊視為環境情境時，請使用代理程式覆寫：

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

對於一般群組/頻道使用者請求，`messages.groupChat.visibleReplies` 預設為 `"automatic"`。當最終助理文字應在沒有明確訊息工具呼叫的情況下可見地張貼時，請保留該預設值。

對於永遠開啟的環境房間，仍建議使用 `messages.groupChat.visibleReplies: "message_tool"`，特別是搭配最新世代、工具可靠的模型，例如 GPT 5.5。它讓代理程式能透過呼叫訊息工具來決定何時發言。如果模型回傳最終文字但未呼叫工具，OpenClaw 會將該最終文字保持為私密，並記錄已抑制傳遞的中繼資料。

即使其他群組請求使用自動回覆，房間事件仍會保持嚴格。未提及的環境房間事件一律需要 `message(action=send)` 才會產生可見輸出。

## 歷史記錄

`messages.groupChat.historyLimit` 會設定全域群組歷史記錄預設值 (未設定時為 50；必須是正整數)。頻道可以用 `channels.<channel>.historyLimit` 覆寫它，而有些頻道也支援每帳號歷史記錄限制。將頻道層級的 `historyLimit: 0` 設為停用該頻道的群組歷史記錄情境。

支援房間事件的頻道會保留近期環境房間訊息作為情境。Telegram 會保留一個由 `historyLimit` 限制的永遠開啟每群組滾動視窗；使用者請求回合會選取機器人最後記錄回覆之後的項目，而房間事件回合會收到完整的近期視窗，讓模型能看見自己的近期貼文。已淘汰的 Telegram `includeGroupHistoryContext` 模式鍵會由 `openclaw doctor --fix` 移除。

## 疑難排解

如果房間顯示輸入中或權杖用量，但沒有可見訊息：

1. 確認房間已由頻道允許清單與寄件者允許清單允許。
2. 確認已在你預期的房間層級設定 `requireMention: false`。
3. 檢查 `messages.groupChat.unmentionedInbound` 或代理程式覆寫是否為 `"room_event"`。
4. 檢查日誌中是否有已抑制最終酬載中繼資料或 `didSendViaMessagingTool: false`。
5. 對於一般群組請求，如果你想要自動張貼最終回覆，請保留或還原 `messages.groupChat.visibleReplies: "automatic"`。對於使用 `message_tool` 的環境房間，請使用能可靠呼叫工具的模型/執行階段。

如果 Telegram 環境房間完全沒有觸發，請檢查 BotFather 隱私模式，並確認閘道正在接收一般群組訊息。

如果 Slack 環境房間沒有觸發，請確認頻道鍵是 Slack 頻道 ID，且應用程式具有該房間類型的歷史記錄範圍：`channels:history` (公開)、`groups:history` (私人)，或 `mpim:history` (多人私訊)。

## 相關

- [群組](/zh-TW/channels/groups)
- [Discord](/zh-TW/channels/discord)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [頻道設定參考](/zh-TW/gateway/config-channels)
