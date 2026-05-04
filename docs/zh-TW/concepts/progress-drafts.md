---
read_when:
    - 為長時間執行的聊天回合設定可見進度更新
    - 在部分、區塊與進度串流模式之間選擇
    - 說明 OpenClaw 如何在工作進行中更新單一頻道訊息
    - 疑難排解進度草稿、獨立進度訊息或最終化備援
summary: 進度草稿：一則可見的進行中訊息，會在代理執行期間更新
title: 進度草稿
x-i18n:
    generated_at: "2026-05-04T02:23:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

進度草稿讓長時間執行的代理回合在聊天中顯得有動靜，而不會把對話變成一疊暫時性的狀態回覆。

啟用進度草稿時，OpenClaw 只會在回合證明自己正在做實際工作後，建立一則可見的進行中訊息；代理讀取、規劃、呼叫工具或等待核准時會更新它，然後在頻道可以安全處理時，將該草稿轉為最終回答。

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

當你想在工具密集的工作期間顯示一則整潔的狀態訊息，並在回合完成後顯示最終回答時，請使用進度草稿。

## 快速開始

使用 `streaming.mode: "progress"` 為每個頻道啟用進度草稿：

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

這通常就夠了。OpenClaw 會選擇自動的一字標籤，等到工作持續至少五秒或發出第二個工作事件時，加入精簡的進度列來呈現有用工作的進行，並抑制該回合中重複的獨立進度雜訊。

## 使用者會看到什麼

進度草稿有兩個部分：

| 部分 | 目的 |
| -------------- | --------------------------------------------------------------------------- |
| 標籤 | 簡短標題，例如 `Thinking...` 或 `Shelling...`。 |
| 進度列 | 使用與詳細輸出相同工具標籤和圖示的精簡執行更新。 |

標籤會在代理開始有意義的工作後出現，並且必須已忙碌五秒或發出第二個工作事件。純文字回覆不會顯示進度草稿。只有在代理發出有用的工作更新時才會加入進度列，例如 `🛠️ Exec`、`🔎 Web Search` 或 `✍️ Write: to /tmp/file`。
預設情況下，它們會使用與 `/verbose` 相同的精簡說明模式；除錯時如果也想附加原始命令/詳細資料，請設定 `agents.defaults.toolProgressDetail: "raw"`。
可行時，最終回答會取代草稿；否則 OpenClaw 會正常傳送最終回答，並依頻道的傳輸方式清理草稿或停止更新草稿。

## 選擇模式

`channels.<channel>.streaming.mode` 控制可見的進行中行為：

| 模式 | 最適合 | 聊天中會出現什麼 |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off` | 安靜的頻道 | 只有最終回答。 |
| `partial` | 觀看回答文字出現 | 一則草稿，會編輯為最新的回答文字。 |
| `block` | 較大的回答預覽區塊 | 一則預覽，以較大的區塊更新或附加。 |
| `progress` | 工具密集或長時間執行的回合 | 一則狀態草稿，接著是最終回答。 |

當使用者更在意「正在發生什麼」而不是逐 token 觀看回答文字串流時，請選擇 `progress`。

當回答本身就是進度訊號時，請選擇 `partial`。

當你想以較大的文字區塊更新草稿預覽時，請選擇 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍是預覽串流，而不是一般的區塊傳遞。當你想要一般區塊回覆時，請使用 `streaming.block.enabled` 或舊版 `blockStreaming`。

## 設定標籤

進度標籤位於 `channels.<channel>.streaming.progress`。

預設標籤是 `auto`，會從 OpenClaw 內建的單字加省略號標籤池中選擇：

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
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

進度模式預設會啟用進度列。它們來自真實的執行事件：工具啟動、項目更新、任務計畫、核准、命令輸出、修補摘要，以及類似的代理活動。

OpenClaw 對進度草稿和 `/verbose` 使用相同格式化器：

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` 是預設值，會用像 `🛠️ Exec: check JS syntax for /tmp/app.js` 這樣的簡潔標籤讓草稿保持穩定。`"raw"` 會在可用時附加底層命令/詳細資料，除錯時很有用，但在聊天中會更吵雜。

例如，同一個命令會依詳細模式不同而顯示不同內容：

| 模式 | 進度列 |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js` |
| `raw` | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

限制保持可見的行數：

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

保留單一進度草稿，但隱藏工具和任務列：

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

使用 `toolProgress: false` 時，OpenClaw 仍會抑制該回合中較舊的獨立工具進度訊息。頻道會在視覺上保持安靜直到最終回答為止；如果設定了標籤，則標籤除外。

## 頻道行為

每個頻道都會使用它支援的最乾淨傳輸方式：

| 頻道 | 進度傳輸 | 備註 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord | 傳送一則訊息，然後編輯它。 | 最終文字若能放入一則安全預覽訊息，就會原地編輯。 |
| Matrix | 傳送一個事件，然後編輯它。 | 帳號層級的串流設定控制帳號層級的草稿。 |
| Microsoft Teams | 個人聊天中的原生 Teams 串流。 | `streaming.mode: "block"` 對應到 Teams 區塊傳遞。 |
| Slack | 原生串流或可編輯草稿貼文。 | 執行緒可用性會影響是否能使用原生串流。 |
| Telegram | 傳送一則訊息，然後編輯它。 | 較舊的可見草稿可能會被取代，讓最終時間戳保持有用。 |
| Mattermost | 可編輯草稿貼文。 | 工具活動會摺入同一則草稿樣式貼文中。 |

沒有安全編輯支援的頻道通常會退回到輸入指示器或只傳遞最終回答。

## 完成

最終回答就緒時，OpenClaw 會嘗試保持聊天乾淨：

- 如果草稿可以安全成為最終回答，OpenClaw 會原地編輯它。
- 如果頻道使用原生進度串流，OpenClaw 會在原生傳輸接受最終文字時完成該串流。
- 如果最終回答包含媒體、核准提示、明確回覆目標、過多區塊，或編輯/傳送失敗，OpenClaw 會透過一般頻道傳遞路徑傳送最終回答。

後備路徑是刻意設計的。傳送新的最終回答，比遺失文字、把回覆串錯，或用頻道無法安全表示的內容覆寫草稿更好。

## 疑難排解

**我只看到最終回答。**

檢查 `channels.<channel>.streaming.mode` 是否已針對處理訊息的帳號或頻道設定為 `progress`。當頻道無法安全編輯正確訊息時，某些群組或引用回覆路徑可能會在該回合停用草稿預覽。

**我看到標籤，但沒有工具列。**

檢查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 會保留單一草稿行為，但隱藏工具和任務進度列。

**我看到新的最終訊息，而不是被編輯的草稿。**

那是安全後備。它可能發生於媒體回覆、較長回答、明確回覆目標、舊 Telegram 草稿、缺少 Slack 執行緒目標、已刪除的預覽訊息，或原生串流完成失敗。

**我仍然看到獨立的進度訊息。**

當草稿作用中時，進度模式會抑制預設的獨立工具進度訊息。如果獨立訊息仍然出現，請確認該回合實際使用的是進度模式，而不是 `streaming.mode: "off"`，也不是無法為該訊息建立草稿的頻道路徑。

**Teams 的行為與 Discord 或 Telegram 不同。**

Microsoft Teams 在個人聊天中使用原生串流，而不是通用的傳送並編輯預覽傳輸。Teams 也會把 `streaming.mode: "block"` 視為 Teams 區塊傳遞，因為它沒有 Discord 和 Telegram 使用的相同草稿預覽區塊模式。

## 相關

- [串流與分塊](/zh-TW/concepts/streaming)
- [訊息](/zh-TW/concepts/messages)
- [頻道設定](/zh-TW/gateway/config-channels)
- [Discord](/zh-TW/channels/discord)
- [Matrix](/zh-TW/channels/matrix)
- [Microsoft Teams](/zh-TW/channels/msteams)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
