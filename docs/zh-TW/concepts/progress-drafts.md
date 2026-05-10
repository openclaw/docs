---
read_when:
    - 設定長時間執行的聊天回合的可見進度更新
    - 在 partial、block 和 progress 串流模式之間選擇
    - 說明 OpenClaw 如何在工作進行期間更新一則頻道訊息
    - 疑難排解進度草稿、獨立進度訊息或最終化備援
summary: 進度草稿：一則可見的進行中訊息，會在代理程式執行期間更新
title: 推進草稿
x-i18n:
    generated_at: "2026-05-10T19:33:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d84027a412a2c62ea9a5698d015c7aeb8a7f27d9db79112bb2c1c10f97ebd88
    source_path: concepts/progress-drafts.md
    workflow: 16
---

進度草稿讓長時間執行的代理程式輪次在聊天中顯得有動態，而不會把對話變成一疊暫時狀態回覆。

啟用進度草稿時，OpenClaw 只會在該輪次證明正在執行實際工作後，建立一則可見的進行中訊息；在代理程式閱讀、規劃、呼叫工具或等待核准時更新它；並在頻道能安全處理時，把該草稿轉成最終答案。

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

當你希望在工具密集的工作期間只顯示一則整潔的狀態訊息，並在輪次完成時顯示最終答案時，請使用進度草稿。

## 快速開始

使用 `streaming.mode: "progress"` 逐頻道啟用進度草稿：

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

這通常就足夠了。OpenClaw 會選擇自動的一字標籤，等到工作持續至少五秒或發出第二個工作事件後，在有用工作發生時加入精簡的進度行，並抑制該輪次中重複的獨立進度閒聊。

## 使用者會看到什麼

進度草稿有兩個部分：

| 部分 | 用途 |
| -------------- | ------------------------------------------------------------------------------------- |
| 標籤 | 簡短的起始／狀態行，例如 `Thinking...` 或 `Shelling...`。 |
| 進度行 | 使用與詳細輸出相同工具圖示和細節格式化器的精簡執行更新。 |

標籤會在代理程式開始有意義的工作，且持續忙碌五秒或發出第二個工作事件後出現。它是滾動進度行清單的一部分，因此一旦出現足夠具體的工作，起始狀態就會捲走。純文字回覆不會顯示進度草稿。只有在代理程式發出有用的工作更新時，才會加入進度行，例如 `🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"` 或 `✍️ Write: to /tmp/file`。
預設情況下，它們使用與 `/verbose` 相同的精簡說明模式；除錯時若也想附加原始命令／細節，請設定 `agents.defaults.toolProgressDetail: "raw"`。
在可行時，最終答案會取代草稿；否則 OpenClaw 會正常傳送最終答案，並依照頻道的傳輸方式清理草稿或停止更新草稿。

## 選擇模式

`channels.<channel>.streaming.mode` 控制可見的進行中行為：

| 模式 | 最適合 | 聊天中會出現什麼 |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off` | 安靜的頻道 | 只有最終答案。 |
| `partial` | 觀看答案文字出現 | 一則草稿會以最新答案文字編輯。 |
| `block` | 較大的答案預覽區塊 | 一則預覽會以較大的區塊更新或附加。 |
| `progress` | 工具密集或長時間執行的輪次 | 一則狀態草稿，接著是最終答案。 |

當使用者更在意「正在發生什麼」，而不是逐 token 觀看答案文字串流時，請選擇 `progress`。

當答案本身就是進度訊號時，請選擇 `partial`。

當你想以較大的文字區塊更新草稿預覽時，請選擇 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍是預覽串流，而不是一般的區塊傳遞。若要使用一般區塊回覆，請使用 `streaming.block.enabled` 或舊版 `blockStreaming`。

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

在進度模式中，進度行預設啟用。它們來自真實執行事件：工具開始、項目更新、任務計畫、核准、命令輸出、修補摘要，以及類似的代理程式活動。

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

`"explain"` 是預設值，會用像 `🛠️ check JS syntax for /tmp/app.js` 這樣的簡潔標籤讓草稿保持穩定。`"raw"` 會在可用時附加底層命令／細節，這在除錯時很有用，但在聊天中會更吵雜。

例如，同一個命令會依細節模式不同而顯示不同：

| 模式 | 進度行 |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js` |
| `raw` | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

進度行會自動壓縮，以在編輯草稿時減少聊天泡泡的版面重排。

OpenClaw 預設會截斷過長的進度行，讓重複的草稿編輯不會在每次更新時以不同方式換行。前綴會保持可讀，而路徑或原始命令等長細節會用省略號縮短。

Slack 可以將進度行轉譯為結構化的 Block Kit 欄位，而不是單一文字本文：

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

豐富轉譯會保留相同的純文字備援，因此不支援較豐富格式的頻道和用戶端仍可顯示精簡進度文字。

保留單一進度草稿，但隱藏工具和任務行：

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

使用 `toolProgress: false` 時，OpenClaw 仍會抑制該輪次較舊的獨立工具進度訊息。除非設定了標籤，否則頻道會在最終答案前保持視覺上的安靜。

## 頻道行為

每個頻道都會使用它支援的最乾淨傳輸方式：

| 頻道 | 進度傳輸方式 | 備註 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord | 傳送一則訊息，然後編輯它。 | 當最終文字能放入一則安全預覽訊息時，就會就地編輯。 |
| Matrix | 傳送一個事件，然後編輯它。 | 帳戶層級串流設定會控制帳戶層級草稿。 |
| Microsoft Teams | 個人聊天中的原生 Teams 串流。 | `streaming.mode: "block"` 會對應到 Teams 區塊傳遞。 |
| Slack | 原生串流或可編輯草稿貼文。 | 對話串可用性會影響是否能使用原生串流。 |
| Telegram | 傳送一則訊息，然後編輯它。 | 較舊的可見草稿可能會被替換，讓最終時間戳保持有用。 |
| Mattermost | 可編輯草稿貼文。 | 工具活動會折疊到同一則草稿樣式貼文中。 |

沒有安全編輯支援的頻道通常會退回輸入指示器或僅傳遞最終答案。

## 完成處理

當最終答案準備好時，OpenClaw 會嘗試讓聊天保持乾淨：

- 如果草稿能安全地變成最終答案，OpenClaw 會就地編輯它。
- 如果頻道使用原生進度串流，OpenClaw 會在原生傳輸接受最終文字時完成該串流。
- 如果最終答案包含媒體、核准提示、明確回覆目標、太多區塊，或編輯／傳送失敗，OpenClaw 會透過一般頻道傳遞路徑傳送最終答案。

備援路徑是刻意設計的。傳送新的最終答案，勝過遺失文字、錯誤串接回覆，或以頻道無法安全表示的酬載覆寫草稿。

## 疑難排解

**我只看到最終答案。**

確認處理訊息的帳戶或頻道已將 `channels.<channel>.streaming.mode` 設為 `progress`。當頻道無法安全編輯正確訊息時，某些群組或引用回覆路徑可能會在該輪次停用草稿預覽。

**我看到標籤，但沒有工具行。**

檢查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 會保留單一草稿行為，但隱藏工具和任務進度行。

**我看到新的最終訊息，而不是已編輯的草稿。**

這是安全備援。媒體回覆、長答案、明確回覆目標、舊 Telegram 草稿、缺少 Slack 對話串目標、已刪除的預覽訊息，或原生串流完成失敗時，都可能發生這種情況。

**我仍然看到獨立進度訊息。**

當草稿處於作用中時，進度模式會抑制預設的獨立工具進度訊息。如果仍出現獨立訊息，請確認該輪次實際上正在使用進度模式，而不是 `streaming.mode: "off"`，也不是無法為該訊息建立草稿的頻道路徑。

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
