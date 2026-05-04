---
read_when:
    - 設定長時間執行聊天回合的可見進度更新
    - 在 partial、block 與 progress 串流模式之間選擇
    - 說明 OpenClaw 如何在工作進行中更新一則頻道訊息
    - 疑難排解進度草稿、獨立進度訊息或最終化備援
summary: 進度草稿：在代理程式執行時更新的一則可見進行中訊息
title: 進度草稿
x-i18n:
    generated_at: "2026-05-04T07:03:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: f78c07866cd7f613012a80a40413e5866c1dd2edd477088f9fc141347f5f3788
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Progress drafts 讓長時間執行的 agent 回合在聊天中顯得有動態，而不會把對話變成一疊暫時性的狀態回覆。

啟用 progress drafts 時，OpenClaw 只會在該回合證明正在進行實際工作後建立一則可見的進行中訊息，並在 agent 讀取、規劃、呼叫工具或等待核准時更新它；當頻道能安全處理時，最後會把該草稿轉成最終答案。

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

當你希望在工具密集的工作期間顯示一則整潔的狀態訊息，並在回合完成時顯示最終答案時，請使用 progress drafts。

## 快速開始

使用 `streaming.mode: "progress"` 為每個頻道啟用 progress drafts：

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

這通常就足夠了。OpenClaw 會自動挑選一個單字標籤，等到工作持續至少五秒或發出第二個工作事件後，加入精簡的進度行來呈現有用工作，並抑制該回合中重複的獨立進度閒聊訊息。

## 使用者會看到什麼

progress draft 有兩個部分：

| 部分 | 目的 |
| -------------- | --------------------------------------------------------------------------- |
| 標籤 | 簡短標題，例如 `Thinking...` 或 `Shelling...`。 |
| 進度行 | 使用與詳細輸出相同的工具標籤和圖示來呈現精簡的執行更新。 |

標籤會在 agent 開始有意義的工作後出現，並且必須持續忙碌五秒或發出第二個工作事件。純文字回覆不會顯示 progress draft。只有當 agent 發出有用的工作更新時，才會加入進度行，例如 `🛠️ Exec`、`🔎 Web Search` 或 `✍️ Write: to /tmp/file`。預設情況下，它們會使用與 `/verbose` 相同的精簡說明模式；若正在除錯且也想附加原始命令或詳細資料，請設定 `agents.defaults.toolProgressDetail: "raw"`。
在可行時，最終答案會取代草稿；否則 OpenClaw 會正常傳送最終答案，並依照頻道傳輸方式清理草稿或停止更新草稿。

## 選擇模式

`channels.<channel>.streaming.mode` 會控制可見的進行中行為：

| 模式 | 最適合 | 聊天中會出現什麼 |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off` | 安靜頻道 | 只顯示最終答案。 |
| `partial` | 觀看答案文字逐步出現 | 一則草稿會用最新答案文字編輯更新。 |
| `block` | 較大的答案預覽片段 | 一則預覽會以較大的片段更新或附加。 |
| `progress` | 工具密集或長時間執行的回合 | 一則狀態草稿，接著顯示最終答案。 |

當使用者更在意「正在發生什麼」，而不是逐 token 觀看答案文字串流時，請選擇 `progress`。

當答案本身就是進度訊號時，請選擇 `partial`。

當你想用較大的文字片段更新草稿預覽時，請選擇 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍是預覽串流，不是一般的區塊傳遞。當你想要一般區塊回覆時，請使用 `streaming.block.enabled` 或舊版 `blockStreaming`。

## 設定標籤

進度標籤位於 `channels.<channel>.streaming.progress` 之下。

預設標籤是 `auto`，會從 OpenClaw 內建的「單字加省略號」標籤池中選擇：

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

隱藏標籤，只顯示進度行：

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

## 控制進度行

在 progress 模式中，進度行預設啟用。它們來自真實的執行事件：工具開始、項目更新、工作計畫、核准、命令輸出、修補摘要，以及類似的 agent 活動。

OpenClaw 會針對 progress drafts 和 `/verbose` 使用相同的格式化器：

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` 是預設值，會使用像 `🛠️ Exec: check JS syntax for /tmp/app.js` 這樣的精簡標籤讓草稿保持穩定。`"raw"` 會在可用時附加底層命令或詳細資料，除錯時很有用，但在聊天中會比較吵雜。

例如，相同命令會依詳細程度模式顯示不同內容：

| 模式 | 進度行 |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js` |
| `raw` | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

限制保留可見的行數：

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

進度行會自動壓縮，以在草稿被編輯時減少聊天氣泡重排。

OpenClaw 預設會截斷過長的進度行，避免重複編輯草稿時每次更新都以不同方式換行。前綴會維持可讀，而像路徑或原始命令這類長詳細資料會以省略號縮短。

Slack 可以將進度行呈現為結構化的 Block Kit 欄位，而不是單一文字本文：

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

豐富呈現會保留相同的純文字備援，因此不支援較豐富形狀的頻道和用戶端仍能顯示精簡進度文字。

保留單一 progress draft，但隱藏工具和工作行：

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

使用 `toolProgress: false` 時，OpenClaw 仍會抑制該回合較舊的獨立工具進度訊息。除非已設定標籤，否則頻道會在視覺上保持安靜，直到最終答案出現。

## 頻道行為

每個頻道會使用其支援的最乾淨傳輸方式：

| 頻道 | 進度傳輸 | 備註 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord | 傳送一則訊息，然後編輯它。 | 當最終文字能放入一則安全預覽訊息時，會就地編輯。 |
| Matrix | 傳送一個事件，然後編輯它。 | 帳號層級串流設定會控制帳號層級草稿。 |
| Microsoft Teams | 個人聊天中的原生 Teams 串流。 | `streaming.mode: "block"` 會對應到 Teams 區塊傳遞。 |
| Slack | 原生串流或可編輯草稿貼文。 | 執行緒可用性會影響能否使用原生串流。 |
| Telegram | 傳送一則訊息，然後編輯它。 | 較舊的可見草稿可能會被取代，使最終時間戳保持有用。 |
| Mattermost | 可編輯草稿貼文。 | 工具活動會折疊到相同草稿樣式的貼文中。 |

沒有安全編輯支援的頻道通常會退回輸入指示器或僅傳遞最終答案。

## 完成

當最終答案準備好時，OpenClaw 會嘗試讓聊天保持乾淨：

- 如果草稿能安全變成最終答案，OpenClaw 會就地編輯它。
- 如果頻道使用原生進度串流，OpenClaw 會在原生傳輸接受最終文字時完成該串流。
- 如果最終答案包含媒體、核准提示、明確回覆目標、過多片段，或編輯/傳送失敗，OpenClaw 會透過一般頻道傳遞路徑傳送最終答案。

備援路徑是刻意設計的。傳送一則新的最終答案，勝過遺失文字、將回覆串到錯誤執行緒，或用頻道無法安全表示的承載內容覆寫草稿。

## 疑難排解

**我只看到最終答案。**

請檢查處理訊息的帳號或頻道是否已將 `channels.<channel>.streaming.mode` 設為 `progress`。當頻道無法安全編輯正確訊息時，某些群組或引用回覆路徑可能會停用該回合的草稿預覽。

**我看到標籤，但沒有工具行。**

請檢查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 會保留單一草稿行為，但隱藏工具和工作進度行。

**我看到新的最終訊息，而不是編輯後的草稿。**

這是安全備援。媒體回覆、長答案、明確回覆目標、舊 Telegram 草稿、缺少 Slack 執行緒目標、已刪除的預覽訊息，或原生串流完成失敗時，都可能發生這種情況。

**我仍然看到獨立的進度訊息。**

當草稿啟用時，progress 模式會抑制預設的獨立工具進度訊息。如果仍出現獨立訊息，請確認該回合實際上使用的是 progress 模式，而不是 `streaming.mode: "off"`，也不是無法為該訊息建立草稿的頻道路徑。

**Teams 的行為與 Discord 或 Telegram 不同。**

Microsoft Teams 在個人聊天中使用原生串流，而不是通用的傳送後編輯預覽傳輸。Teams 也會將 `streaming.mode: "block"` 視為 Teams 區塊傳遞，因為它沒有 Discord 和 Telegram 使用的相同草稿預覽區塊模式。

## 相關

- [串流與分塊](/zh-TW/concepts/streaming)
- [訊息](/zh-TW/concepts/messages)
- [頻道設定](/zh-TW/gateway/config-channels)
- [Discord](/zh-TW/channels/discord)
- [Matrix](/zh-TW/channels/matrix)
- [Microsoft Teams](/zh-TW/channels/msteams)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
