---
read_when:
    - 為長時間執行的聊天回合設定可見的進度更新
    - 在部分、區塊和進度串流模式之間選擇
    - 說明 OpenClaw 如何在工作進行中更新一則頻道訊息
    - 疑難排解進度草稿、獨立進度訊息或最終化備援
summary: 進度草稿：一則可見的進行中訊息，會在代理程式執行時更新
title: 進度草稿
x-i18n:
    generated_at: "2026-05-06T09:08:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b55c016dd7c8f719237d0cf2481e8259c99ac6dc9320c637eaea23c097e910
    source_path: concepts/progress-drafts.md
    workflow: 16
---

進度草稿讓長時間執行的代理程式回合在聊天中看起來有動態，而不會把對話變成一疊暫時狀態回覆。

啟用進度草稿時，OpenClaw 只會在回合證明自己正在執行實際工作後，建立一則可見的進行中訊息；在代理程式讀取、規劃、呼叫工具或等待核准時更新它；然後在通道能安全執行時，將該草稿轉換成最終答案。

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

當你希望在大量使用工具的工作期間只顯示一則整潔的狀態訊息，並在回合完成時顯示最終答案時，請使用進度草稿。

## 快速開始

使用 `streaming.mode: "progress"` 逐通道啟用進度草稿：

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

通常這樣就足夠了。OpenClaw 會挑選一個自動的一字標籤，等到工作至少持續五秒或發出第二個工作事件後，在有實用工作發生時加入精簡的進度行，並在該回合抑制重複的獨立進度閒聊。

## 使用者會看到什麼

進度草稿有兩個部分：

| 部分           | 用途                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| 標籤          | 簡短標題，例如 `Thinking...` 或 `Shelling...`。                       |
| 進度行 | 使用與詳細輸出相同工具標籤和圖示的精簡執行更新。 |

標籤會在代理程式開始有意義的工作，且持續忙碌五秒或發出第二個工作事件後出現。只有純文字的回覆不會顯示進度草稿。進度行只會在代理程式發出實用工作更新時加入，例如 `🛠️ Exec`、`🔎 Web Search` 或 `✍️ Write: to /tmp/file`。
預設情況下，它們使用與 `/verbose` 相同的精簡說明模式；偵錯時若也想附加原始命令/詳細資訊，請設定 `agents.defaults.toolProgressDetail: "raw"`。
最終答案會在可行時取代草稿；否則 OpenClaw 會正常傳送最終答案，並依照通道的傳輸方式清理草稿或停止更新草稿。

## 選擇模式

`channels.<channel>.streaming.mode` 控制可見的進行中行為：

| 模式       | 最適合                         | 聊天中會出現什麼                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 安靜的通道                   | 只有最終答案。                            |
| `partial`  | 觀看答案文字逐步出現      | 一則草稿會以最新答案文字編輯更新。     |
| `block`    | 較大的答案預覽區塊     | 一則預覽會以較大的區塊更新或附加。 |
| `progress` | 大量使用工具或長時間執行的回合 | 一則狀態草稿，接著是最終答案。          |

當使用者比起逐 token 觀看答案文字串流，更在意「正在發生什麼」時，請選擇 `progress`。

當答案本身就是進度訊號時，請選擇 `partial`。

當你想要以較大的文字區塊更新草稿預覽時，請選擇 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍是預覽串流，而不是一般區塊傳遞。當你想要一般區塊回覆時，請使用 `streaming.block.enabled` 或舊版 `blockStreaming`。

## 設定標籤

進度標籤位於 `channels.<channel>.streaming.progress` 之下。

預設標籤是 `auto`，會從 OpenClaw 內建的單字加省略號標籤集選擇：

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

使用你自己的自動標籤集：

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

在進度模式中，進度行預設為啟用。它們來自真實的執行事件：工具啟動、項目更新、工作計畫、核准、命令輸出、修補摘要，以及類似的代理程式活動。

OpenClaw 對進度草稿和 `/verbose` 使用相同的格式化器：

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` 是預設值，會使用像 `🛠️ Exec: check JS syntax for /tmp/app.js` 這樣的精簡標籤，讓草稿保持穩定。`"raw"` 會在可用時附加底層命令/詳細資訊，這在偵錯時很有用，但在聊天中較吵雜。

例如，同一個命令會依詳細程度模式而有不同顯示：

| 模式      | 進度行                                                        |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

在編輯草稿時，進度行會自動壓縮，以減少聊天泡泡的重排。

OpenClaw 預設會截斷過長的進度行，讓重複的草稿編輯不會在每次更新時以不同方式換行。前綴會保持可讀，路徑或原始命令等長詳細資訊會用省略號縮短。

Slack 可以將進度行呈現為結構化的 Block Kit 欄位，而不是單一文字內文：

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

豐富呈現會保留相同的純文字備援，因此不支援較豐富形式的通道和用戶端仍可顯示精簡進度文字。

保留單一進度草稿，但隱藏工具與工作行：

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

使用 `toolProgress: false` 時，OpenClaw 仍會在該回合抑制較舊的獨立工具進度訊息。除非已設定標籤，否則通道會在最終答案前保持視覺上的安靜。

## 通道行為

每個通道都會使用它支援的最乾淨傳輸方式：

| 通道         | 進度傳輸                     | 備註                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | 傳送一則訊息，然後編輯它。        | 當最終文字適合放入一則安全預覽訊息時，會就地編輯。      |
| Matrix          | 傳送一個事件，然後編輯它。          | 帳號層級串流設定會控制帳號層級草稿。         |
| Microsoft Teams | 個人聊天中的原生 Teams 串流。 | `streaming.mode: "block"` 會對應到 Teams 區塊傳遞。               |
| Slack           | 原生串流或可編輯草稿貼文。  | 執行緒可用性會影響能否使用原生串流。     |
| Telegram        | 傳送一則訊息，然後編輯它。        | 較舊的可見草稿可能會被取代，讓最終時間戳記保持有用。 |
| Mattermost      | 可編輯草稿貼文。                   | 工具活動會折疊到同一則草稿式貼文中。               |

沒有安全編輯支援的通道通常會退回使用輸入中指示器或只傳遞最終答案。

## 完成

當最終答案準備好時，OpenClaw 會嘗試保持聊天乾淨：

- 如果草稿可以安全地變成最終答案，OpenClaw 會就地編輯它。
- 如果通道使用原生進度串流，OpenClaw 會在原生傳輸接受最終文字時完成該串流。
- 如果最終答案包含媒體、核准提示、明確回覆目標、過多區塊，或編輯/傳送失敗，OpenClaw 會透過一般通道傳遞路徑傳送最終答案。

備援路徑是刻意設計的。傳送一則新的最終答案，勝過遺失文字、把回覆放錯執行緒，或用通道無法安全表示的承載覆寫草稿。

## 疑難排解

**我只看到最終答案。**

檢查處理該訊息的帳號或通道是否已將 `channels.<channel>.streaming.mode` 設為 `progress`。當通道無法安全編輯正確訊息時，某些群組或引用回覆路徑可能會在該回合停用草稿預覽。

**我看到標籤，但沒有工具行。**

檢查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 會保留單一草稿行為，但隱藏工具與工作進度行。

**我看到新的最終訊息，而不是已編輯的草稿。**

這是安全備援。媒體回覆、長答案、明確回覆目標、舊的 Telegram 草稿、缺少 Slack 執行緒目標、已刪除的預覽訊息，或原生串流完成失敗時，都可能發生這種情況。

**我仍然看到獨立的進度訊息。**

當草稿處於作用中時，進度模式會抑制預設的獨立工具進度訊息。如果獨立訊息仍然出現，請確認該回合確實使用進度模式，而不是 `streaming.mode: "off"`，也不是無法為該訊息建立草稿的通道路徑。

**Teams 的行為與 Discord 或 Telegram 不同。**

Microsoft Teams 在個人聊天中使用原生串流，而不是通用的傳送再編輯預覽傳輸。Teams 也會將 `streaming.mode: "block"` 視為 Teams 區塊傳遞，因為它沒有 Discord 和 Telegram 所使用的相同草稿預覽區塊模式。

## 相關

- [串流與分塊](/zh-TW/concepts/streaming)
- [訊息](/zh-TW/concepts/messages)
- [通道設定](/zh-TW/gateway/config-channels)
- [Discord](/zh-TW/channels/discord)
- [Matrix](/zh-TW/channels/matrix)
- [Microsoft Teams](/zh-TW/channels/msteams)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
