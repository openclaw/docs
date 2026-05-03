---
read_when:
    - 設定長時間執行聊天回合的可見進度更新
    - 在部分、區塊與進度串流模式之間選擇
    - 說明 OpenClaw 如何在工作進行中更新一則頻道訊息
    - 疑難排解進度草稿、獨立進度訊息或完成處理備援
summary: 進度草稿：代理執行期間會更新的一則可見進行中訊息
title: 進度草稿
x-i18n:
    generated_at: "2026-05-03T21:31:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

進度草稿讓長時間執行的代理回合在聊天中顯得有動態，而不會把對話變成一疊暫時性的狀態回覆。

啟用進度草稿時，OpenClaw 會建立一則可見的進行中訊息，在代理讀取、規劃、呼叫工具或等待核准時更新它，然後在頻道可以安全處理時，將該草稿轉換成最終答案。

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

當你希望在大量使用工具的工作期間顯示一則整潔的狀態訊息，並在回合完成時顯示最終答案，請使用進度草稿。

## 快速開始

使用 `streaming.mode: "progress"` 針對每個頻道啟用進度草稿：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

這通常就足夠了。OpenClaw 會自動選擇一個單字標籤，在有實用工作進行時加入精簡的進度列，並在該回合抑制重複的獨立進度閒聊訊息。

## 使用者會看到什麼

進度草稿有兩個部分：

| 部分           | 用途                                                           |
| -------------- | ----------------------------------------------------------------- |
| 標籤          | 簡短標題，例如 `Thinking` 或 `Shelling`。                   |
| 進度列 | 精簡的執行更新，例如工具呼叫、任務步驟或核准。 |

代理開始回覆時，標籤會立即出現。只有在代理發出有用的工作更新時，才會加入進度列。最終答案會在可行時取代草稿；否則 OpenClaw 會正常傳送最終答案，並依照頻道的傳輸方式清理或停止更新草稿。

## 選擇模式

`channels.<channel>.streaming.mode` 控制可見的進行中行為：

| 模式       | 最適合                         | 聊天中會出現什麼                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 安靜的頻道                   | 只有最終答案。                            |
| `partial`  | 觀看答案文字逐步出現      | 一則草稿，會以最新答案文字編輯。     |
| `block`    | 較大的答案預覽區塊     | 一則預覽，會以較大的區塊更新或附加。 |
| `progress` | 大量使用工具或長時間執行的回合 | 一則狀態草稿，接著是最終答案。          |

當使用者更在意「正在發生什麼」，而不是逐 token 觀看答案文字串流時，請選擇 `progress`。

當答案本身就是進度訊號時，請選擇 `partial`。

當你想要以較大的文字區塊更新草稿預覽時，請選擇 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍然是預覽串流，而不是一般區塊傳送。當你想要一般區塊回覆時，請使用 `streaming.block.enabled` 或舊版 `blockStreaming`。

## 設定標籤

進度標籤位於 `channels.<channel>.streaming.progress` 之下。

預設標籤是 `auto`，會從 OpenClaw 內建的單字標籤池中選擇：

```text
Thinking
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
```

使用固定標籤：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

使用你自己的自動標籤池：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

隱藏標籤，只顯示進度列：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## 控制進度列

在進度模式中，進度列預設為啟用。它們來自真實的執行事件：工具啟動、項目更新、任務計畫、核准、命令輸出、修補摘要，以及類似的代理活動。

限制保持可見的列數：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

保留單一進度草稿，但隱藏工具與任務列：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

使用 `toolProgress: false` 時，OpenClaw 仍會在該回合抑制較舊的獨立工具進度訊息。除了已設定的標籤之外，頻道在視覺上會保持安靜，直到最終答案出現。

## 頻道行為

每個頻道都會使用其支援的最乾淨傳輸方式：

| 頻道         | 進度傳輸方式                     | 備註                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | 傳送一則訊息，然後編輯它。        | 最終文字在符合一則安全預覽訊息時會就地編輯。      |
| Matrix          | 傳送一個事件，然後編輯它。          | 帳號層級串流設定會控制帳號層級草稿。         |
| Microsoft Teams | 個人聊天中的原生 Teams 串流。 | `streaming.mode: "block"` 會對應到 Teams 區塊傳送。               |
| Slack           | 原生串流或可編輯草稿貼文。  | 對話串可用性會影響是否可使用原生串流。     |
| Telegram        | 傳送一則訊息，然後編輯它。        | 較舊的可見草稿可能會被取代，讓最終時間戳保持實用。 |
| Mattermost      | 可編輯草稿貼文。                   | 工具活動會合併到同一則草稿樣式貼文中。               |

沒有安全編輯支援的頻道通常會退回到輸入指示器或僅傳送最終答案。

## 完成處理

最終答案準備好時，OpenClaw 會嘗試保持聊天整潔：

- 如果草稿可以安全地成為最終答案，OpenClaw 會就地編輯它。
- 如果頻道使用原生進度串流，OpenClaw 會在原生傳輸接受最終文字時完成該串流。
- 如果最終答案包含媒體、核准提示、明確的回覆目標、太多區塊，或編輯／傳送失敗，OpenClaw 會透過一般頻道傳送路徑傳送最終答案。

退回路徑是有意設計的。傳送一則新的最終答案，比遺失文字、把回覆串錯，或用頻道無法安全表示的酬載覆寫草稿更好。

## 疑難排解

**我只看到最終答案。**

確認 `channels.<channel>.streaming.mode` 已針對處理該訊息的帳號或頻道設為 `progress`。某些群組或引用回覆路徑可能會在頻道無法安全編輯正確訊息時，停用該回合的草稿預覽。

**我看到標籤，但沒有工具列。**

檢查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 會保留單一草稿行為，但隱藏工具與任務進度列。

**我看到一則新的最終訊息，而不是已編輯的草稿。**

這是安全退回機制。媒體回覆、長答案、明確回覆目標、舊的 Telegram 草稿、遺失的 Slack 對話串目標、已刪除的預覽訊息，或原生串流完成失敗時，都可能發生這種情況。

**我仍然看到獨立的進度訊息。**

當草稿處於作用中時，進度模式會抑制預設的獨立工具進度訊息。如果仍出現獨立訊息，請確認該回合實際上正在使用進度模式，而不是 `streaming.mode: "off"`，也不是無法為該訊息建立草稿的頻道路徑。

**Teams 的行為與 Discord 或 Telegram 不同。**

Microsoft Teams 在個人聊天中使用原生串流，而不是通用的傳送並編輯預覽傳輸。Teams 也會將 `streaming.mode: "block"` 視為 Teams 區塊傳送，因為它沒有 Discord 和 Telegram 使用的相同草稿預覽區塊模式。

## 相關

- [串流與分塊](/zh-TW/concepts/streaming)
- [訊息](/zh-TW/concepts/messages)
- [頻道設定](/zh-TW/gateway/config-channels)
- [Discord](/zh-TW/channels/discord)
- [Matrix](/zh-TW/channels/matrix)
- [Microsoft Teams](/zh-TW/channels/msteams)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
