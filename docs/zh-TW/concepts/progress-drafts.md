---
read_when:
    - 設定長時間執行的聊天回合可見進度更新
    - 選擇 partial、block 與 progress 串流模式
    - 說明 OpenClaw 如何在工作進行期間更新一則頻道訊息
    - 疑難排解進度草稿、獨立進度訊息或完成後備機制
summary: 進度草稿：代理程式執行期間會更新的一則可見進行中訊息
title: 進度草稿
x-i18n:
    generated_at: "2026-06-27T19:14:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

進度草稿讓長時間執行的代理回合在聊天中顯得仍在進行，而不會把對話變成一疊暫時性的狀態回覆。

啟用進度草稿後，OpenClaw 只會在該回合證明自己正在做實際工作之後，建立一則可見的進行中工作訊息；當代理讀取、規劃、呼叫工具或等待核准時更新它；並在頻道能安全處理時，將該草稿轉成最終答案。

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

當你希望在工具密集的工作期間只顯示一則整潔的狀態訊息，並在回合完成時顯示最終答案時，請使用進度草稿。

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

這通常就足夠了。OpenClaw 會選擇一個自動的單字標籤，等到工作至少持續五秒或發出第二個工作事件時，加入精簡的進度列來呈現有用工作，並在該回合中抑制重複的獨立進度閒談。

## 使用者會看到什麼

進度草稿有兩個部分：

| 部分 | 用途 |
| -------------- | ------------------------------------------------------------------------------------- |
| 標籤 | 簡短的起始／狀態列，例如 `Working` 或 `Shelling`。 |
| 進度列 | 使用與詳細輸出相同工具圖示和細節格式化器的精簡執行更新。 |

標籤會在代理開始有意義的工作後，且保持忙碌五秒或發出第二個工作事件時出現。它是滾動進度列清單的一部分，因此一旦出現足夠具體的工作內容，起始狀態就會捲出可見範圍。純文字回覆不會顯示進度草稿。只有當代理發出有用的工作更新時，才會加入進度列，例如 `🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"`，或 `✍️ Write: to /tmp/file`。
預設情況下，它們使用與 `/verbose` 相同的精簡說明模式；若正在除錯，且也希望附加原始命令／細節，請設定 `agents.defaults.toolProgressDetail: "raw"`。
最終答案會在可行時取代草稿；否則 OpenClaw 會正常傳送最終答案，並依照頻道的傳輸方式清理或停止更新草稿。

## 選擇模式

`channels.<channel>.streaming.mode` 控制可見的進行中行為：

| 模式 | 最適合 | 聊天中會出現什麼 |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off` | 安靜的頻道 | 只有最終答案。 |
| `partial` | 觀看答案文字逐步出現 | 一則草稿會以最新答案文字編輯。 |
| `block` | 較大的答案預覽區塊 | 一則預覽會以較大的區塊更新或附加。 |
| `progress` | 工具密集或長時間執行的回合 | 一則狀態草稿，接著是最終答案。 |

當使用者更關心「正在發生什麼」而不是逐字元觀看答案文字串流時，請選擇 `progress`。

當答案本身就是進度訊號時，請選擇 `partial`。

當你希望用較大的文字區塊更新草稿預覽時，請選擇 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍然是預覽串流，而不是一般區塊傳送。當你需要一般區塊回覆時，請使用 `streaming.block.enabled` 或舊版 `blockStreaming`。

## 設定標籤

進度標籤位於 `channels.<channel>.streaming.progress` 底下。

預設標籤是 `auto`，會從 OpenClaw 內建的單字標籤池中選擇：

```text
Working
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

隱藏標籤並只顯示進度列：

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

在進度模式中，進度列預設為啟用。它們來自實際的執行事件：工具開始、項目更新、任務計畫、核准、命令輸出、修補摘要，以及類似的代理活動。

工具也可以在單一工具呼叫仍在執行時發出型別化進度。這就是緩慢的擷取或搜尋能在工具回傳最終結果之前更新可見草稿的方式。進度更新是一個部分工具結果，具有空的模型內容和明確的公開頻道中繼資料：

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw 只會在頻道進度使用者介面中呈現 `progress.text`。一般工具結果稍後仍會以 `content` 和 `details` 抵達，而且只有這個部分會回傳給模型。

為工具加入進度時，請使用簡短、通用的訊息，並延遲到操作已等待足夠久、顯示出來才有用時再發出：

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

這個模式表示快速呼叫不會顯示進度列，長時間呼叫會在仍等待時顯示一列，而取消的呼叫會在過期進度出現前清除計時器。進度文字是公開的使用者介面旁路頻道，因此不得包含秘密、原始引數、擷取內容、命令輸出或頁面文字。

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

`"explain"` 是預設值，會用像 `🛠️ check JS syntax for /tmp/app.js` 這樣的精簡標籤讓草稿保持穩定。`"raw"` 會在可用時附加底層命令／細節，這在除錯時很有用，但在聊天中會更吵雜。

例如，同一個命令會依細節模式而以不同方式顯示：

| 模式 | 進度列 |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js` |
| `raw` | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

限制保留可見的列數：

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

進度列會自動壓縮，以減少草稿編輯時聊天泡泡的重新排版。

OpenClaw 預設會截斷過長的進度列，避免重複草稿編輯在每次更新時都以不同方式換行。預設每列預算為 120 個字元。一般文字會在單字邊界截斷，而路徑或原始命令等較長細節則會以中間省略號縮短，讓結尾仍保持可見。

調整每列預算：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

Slack 可以將進度列呈現為結構化的 Block Kit 欄位，而不是單一文字本文：

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

豐富呈現會保留相同的純文字備援，因此不支援較豐富形狀的頻道和用戶端仍可顯示精簡進度文字。

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

使用 `toolProgress: false` 時，OpenClaw 仍會為該回合抑制較舊的獨立工具進度訊息。除了已設定的標籤之外，頻道會維持視覺上的安靜，直到最終答案出現。

## 頻道行為

每個頻道都會使用其支援的最乾淨傳輸方式：

| 頻道 | 進度傳輸 | 備註 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord | 傳送一則訊息，然後編輯它。 | 最終文字在能放入一則安全預覽訊息時會就地編輯。 |
| Matrix | 傳送一個事件，然後編輯它。 | 帳號層級的串流設定控制帳號層級的草稿。 |
| Microsoft Teams | 個人聊天中的原生 Teams 串流。 | `streaming.mode: "block"` 對應到 Teams 區塊傳送。 |
| Slack | 原生串流或可編輯草稿貼文。 | 執行緒可用性會影響是否能使用原生串流。 |
| Telegram | 傳送一則訊息，然後編輯它。 | 較舊的可見草稿可能會被取代，讓最終時間戳保持有用。 |
| Mattermost | 可編輯草稿貼文。 | 工具活動會合併到同一則草稿樣式貼文中。 |

沒有安全編輯支援的頻道通常會退回到輸入指示器或僅最終傳送。

## 完成

當最終答案準備好時，OpenClaw 會嘗試保持聊天乾淨：

- 如果草稿可以安全地變成最終答案，OpenClaw 會就地編輯它。
- 如果頻道使用原生進度串流，OpenClaw 會在原生傳輸接受最終文字時完成該串流。
- 如果最終答案包含媒體、核准提示、明確回覆目標、過多區塊，或編輯／傳送失敗，OpenClaw 會透過一般頻道傳送路徑傳送最終答案。

備援路徑是有意設計的。傳送新的最終答案，比遺失文字、錯誤串接回覆，或以頻道無法安全表示的酬載覆寫草稿更好。

## 疑難排解

**我只看到最終答案。**

請檢查處理該訊息的帳號或頻道是否已將 `channels.<channel>.streaming.mode` 設為 `progress`。當頻道無法安全編輯正確訊息時，某些群組或引用回覆路徑可能會在該回合停用草稿預覽。

**我看到標籤，但沒有工具列。**

請檢查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 會保留單一草稿行為，但隱藏工具和任務進度列。

**我看到新的最終訊息，而不是編輯過的草稿。**

這是安全備援。媒體回覆、長答案、明確回覆目標、舊的 Telegram 草稿、缺少 Slack 執行緒目標、已刪除的預覽訊息，或原生串流完成失敗時，都可能發生這種情況。

**我仍然看到獨立的進度訊息。**

當草稿啟用時，進度模式會抑制預設的獨立工具進度訊息。如果仍然出現獨立訊息，請確認該回合實際上使用的是進度模式，而不是 `streaming.mode: "off"`，或某個無法為該訊息建立草稿的頻道路徑。

**Teams 的行為與 Discord 或 Telegram 不同。**

Microsoft Teams 在個人聊天中使用原生串流，而不是通用的傳送並編輯預覽傳輸。Teams 也會將 `streaming.mode: "block"` 視為 Teams 區塊傳遞，因為它沒有 Discord 和 Telegram 所使用的相同草稿預覽區塊模式。

## 相關

- [串流與分塊](/zh-TW/concepts/streaming)
- [訊息](/zh-TW/concepts/messages)
- [頻道設定](/zh-TW/gateway/config-channels)
- [Discord](/zh-TW/channels/discord)
- [Matrix](/zh-TW/channels/matrix)
- [Microsoft Teams](/zh-TW/channels/msteams)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
