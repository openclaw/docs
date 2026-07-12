---
read_when:
    - 設定長時間執行的聊天回合所顯示的進度更新
    - 在部分、區塊與進度串流模式之間進行選擇
    - 說明 OpenClaw 如何在工作進行期間更新同一則頻道訊息
    - 疑難排解進度草稿、獨立進度訊息或完成階段的備援方案
summary: 進度草稿：代理程式執行期間持續更新的一則可見進行中訊息
title: 進度草稿
x-i18n:
    generated_at: "2026-07-12T21:23:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4f937a61dfa360ac1d6c67e1a05e5ac698af563f2b58624d6de4e69a7f904cdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

進度草稿會在代理程式工作時，將一則頻道訊息轉換成即時狀態列，而不是堆疊多則暫時性的「仍在處理」回覆。設定
`channels.<channel>.streaming.mode: "progress"` 後，OpenClaw 會在實際工作開始時建立訊息，並在代理程式讀取、規劃、呼叫工具或等待核准時編輯訊息，最後再將它轉換成最終答案。

```text
執行 Shell...
📖 來自 docs/concepts/progress-drafts.md
🔎 網頁搜尋：搜尋 "discord edit message"
🛠️ Bash：執行測試
```

<Note>
  當 `channels.discord.streaming` 未設定時，Discord 已預設使用
  `streaming.mode: "progress"`，因此不需任何設定便會顯示進度草稿。其他所有頻道的預設值皆為 `partial`
  或 `off`；如需各頻道完整的預設值表格，請參閱[串流與分塊](/zh-TW/concepts/streaming#channel-mapping)。
</Note>

## 快速開始

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

此處的預設行為是：延遲 5 秒後開始（若發生第二個工作事件則立即開始）、在進行有用的工作時顯示精簡的進度列，並在該輪對話中抑制較舊的獨立進度訊息。原始工具列草稿會使用自動產生的單字標籤；旁白式狀態則會省略這個重複的標題，除非你明確設定標題。

本頁說明進度草稿的使用體驗及其設定選項。如需完整的串流模式矩陣、各頻道的執行階段注意事項，以及舊版鍵值的遷移方式，請參閱[串流與分塊](/zh-TW/concepts/streaming)。

## 使用者看到的內容

| 部分           | 用途                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| 標籤          | 選用的起始／狀態列，例如 `Working` 或 `Shelling`。                     |
| 進度列 | 使用與 `/verbose` 相同的工具圖示與詳細資訊格式器，顯示精簡的執行更新。 |

對於原始工具進度，標籤會在代理程式開始有意義的工作且持續忙碌超過初始延遲後顯示；若第二個工作事件發生，則會立即顯示。標籤位於持續更新的進度列清單頂端，因此出現足夠多的具體工作列後，它便會捲出畫面。旁白式進度只會顯示代理程式以自然語言描述的狀態，除非明確設定了標籤。只有純文字的回覆絕不會顯示進度草稿；只有實際工作更新才會出現進度列，例如 `🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"` 或 `✍️ Write: to /tmp/file`。

當頻道能夠安全地這麼做時，最終答案會直接取代原位置的草稿；否則，OpenClaw 會透過一般傳送流程送出最終答案，並清除草稿或停止更新草稿（請參閱[完成處理](#finalization)）。

## 選擇模式

`channels.<channel>.streaming.mode` 控制處理期間的可見行為：

| 模式       | 最適合                         | 聊天中顯示的內容                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 安靜的頻道                   | 僅顯示最終答案。                            |
| `partial`  | 觀看答案文字逐步顯示      | 編輯一則草稿以顯示最新的答案文字。     |
| `block`    | 較大的答案預覽區塊     | 以較大的區塊更新或附加至一則預覽。 |
| `progress` | 大量使用工具或長時間執行的對話輪次 | 一則狀態草稿，接著顯示最終答案。          |

當使用者更關心「正在發生什麼事」，而不是逐一權杖觀看答案文字串流時，請選擇 `progress`；當答案文字本身就是進度訊號時，請選擇 `partial`；如需較大的預覽區塊，請選擇 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍屬於預覽串流，而非一般的區塊回覆傳送方式——後者請使用 `streaming.block.enabled`。

## 設定標籤

進度標籤位於 `channels.<channel>.streaming.progress` 下。原始工具列的預設標籤為 `"auto"`，會從 OpenClaw 內建的單字標籤集選取。旁白式進度會隱藏這個隱含標籤；若你也想在旁白上方顯示標籤，請明確設定
`label: "auto"`：

```text
工作中、執行 Shell、快速移動、揮動螯鉗、夾取、蛻殼、冒泡、隨潮流動、
築礁、破殼、篩選、鹽漬、鸚鵡螺巡航、磷蝦活動、藤壺附著、
龍蝦活動、潮池探索、珍珠形成、彈動、浮出水面
```

使用固定標籤：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "調查中",
        },
      },
    },
  },
}
```

使用你自己的標籤集（當 `label: "auto"` 時，仍會隨機／依種子選取）：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["檢查中", "讀取中", "測試中", "即將完成"],
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

進度列來自實際的執行事件：工具啟動、項目更新、工作計畫、核准、命令輸出、修補摘要，以及類似的代理程式活動。此功能預設啟用（`progress.toolProgress`，預設值為 `true`）。

工具也可以在單次呼叫仍在執行期間發出具型別的進度。這可讓耗時的擷取或搜尋在工具傳回最終結果前，先更新可見的草稿。進度更新是一個部分工具結果，包含空的模型內容與明確的公開頻道中繼資料：

```json
{
  "content": [],
  "progress": {
    "text": "正在擷取頁面內容...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw 在頻道進度使用者介面中只會呈現 `progress.text`。一般工具結果稍後仍會以 `content`／`details` 的形式送達，且只有該部分會傳回給模型。

為工具新增進度時，請發出簡短、通用的訊息，並延遲到操作的待處理時間已長到足以讓訊息發揮作用時才顯示。`web_fetch` 正是使用 5 秒延遲來實作此行為：

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "正在擷取頁面內容...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

快速呼叫不會顯示進度列；長時間呼叫在仍待處理時會顯示進度列；
已取消的呼叫會先清除計時器，避免過時的進度資訊出現。進度文字是公開的 UI 側通道，因此絕不可包含祕密、原始引數、擷取的內容、命令輸出或頁面文字。

### 詳細資訊模式

OpenClaw 對進度草稿與 `/verbose` 使用相同的格式化程式：

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` 是預設值，會使用簡潔的標籤，使草稿保持穩定。
`"raw"` 會在底層命令可用時附加該命令，這在偵錯時很有用，
但在聊天中會產生較多干擾。例如，`node --check /tmp/app.js` 呼叫
在不同模式下會以不同方式呈現：

| 模式      | 進度列                                                   |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### 命令／執行文字

`streaming.progress.commandText`（預設為 `"raw"`）控制 exec/bash 進度行旁顯示的命令詳細程度，且不受上述詳細模式影響。將其設為 `"status"`，即可在保留工具進度行可見的同時，完全隱藏命令文字：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### 評述通道

`streaming.progress.commentary`（預設為 `false`）會在草稿中，將模型於工具呼叫前的評述／前言敘述（💬，例如「我會先檢查……，接著……」）與工具行交錯顯示。請參閱[串流與分塊](/zh-TW/concepts/streaming#commentary-progress-lane)，瞭解各通道共用的設定結構。

### 狀態敘述

當代理程式可解析到工具模型時——明確設定的
[`utilityModel`](/zh-TW/gateway/config-agents#utilitymodel)，或主要供應商宣告的小型模型預設值（OpenAI → `gpt-5.6-luna`、
Anthropic → `claude-haiku-4-5`）——進度草稿會以簡短的白話敘述取代持續更新的工具行，說明代理程式正在執行的工作。此敘述由成本較低的模型撰寫，並隨工作進展持續更新：

```text
正在更新設定中的預設模型，接著重新啟動閘道以套用變更。一次代理程式清單呼叫失敗，目前正在重試。
```

敘述功能預設為啟用（`streaming.progress.narration`，預設為 `true`），且絕不會退回使用主要模型：只有在明確設定 `utilityModel`，或供應商為代理程式的主要供應商宣告預設值時才會執行。設定 `utilityModel: ""` 可完全停用工具模型路由。工具行會繼續在下方累積，並在敘述停止時重新顯示；只有通過一般活動閘門，且敘述文字確實發生變更後，才會編輯草稿，從而避免在快速回合中閃爍，並減少繁忙通道中的編輯頻率。若要保留原始工具行，請停用此功能：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

旁白輸入受到限制且已編輯：公用程式模型會接收傳入的請求文字，以及草稿將呈現的相同精簡、已編輯工具摘要——絕不會收到原始命令輸出或工具結果。使用
`commandText: "status"` 時，旁白輸入也會省略 exec/bash 命令文字，
與草稿顯示的內容一致。

### 行數限制

限制保持可見的行數（預設為 8）：

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

進度行會自動壓縮，以減少編輯草稿時聊天泡泡的版面重排，
而且 OpenClaw 會截短過長的行，讓重複編輯草稿時不會在每次更新後
以不同方式換行。每行的預設字元預算為 120 個字元；
一般文字會在單字邊界截斷，而路徑或原始命令等較長的詳細資訊
則會以中間省略號縮短，讓後綴保持可見。

調整每行的字元預算：

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

### 豐富呈現（Slack）

Slack 可將進度行呈現為結構化的 Block Kit 欄位，而非
純文字：

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

豐富呈現一律會在 Block Kit 欄位之外，同時傳送相同的純文字本文，
因此無法呈現較豐富格式的用戶端仍會顯示精簡的
進度文字。

### 隱藏工具／任務行

保留單一進度草稿，但隱藏工具與任務行：

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

使用 `toolProgress: false` 時，OpenClaw 仍會在該輪對話中抑制舊版的獨立
工具進度訊息——在最終回答出現前，頻道在視覺上會保持安靜；
若有設定標籤，則標籤除外。

## 頻道行為

| 頻道            | 進度傳輸方式                           | 備註                                                                                                                                                                  |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 傳送一則訊息，然後編輯該訊息。         | 預設使用 `progress` 模式；最終回答會附帶 `-#` 活動回執，且回答送達後會刪除狀態草稿。                                                                                   |
| Matrix          | 傳送一個事件，然後編輯該事件。         | 帳號層級的串流設定會控制帳號層級的草稿。                                                                                                                              |
| Microsoft Teams | 在個人聊天中使用原生 Teams 串流。      | `streaming.mode: "block"` 會改為對應至 Teams 區塊傳遞。                                                                                                               |
| Slack           | 原生串流或可編輯的草稿貼文。           | 需要回覆討論串目標；沒有目標的頂層私訊仍會收到草稿預覽貼文及其編輯更新。                                                                                              |
| Telegram        | 傳送一則訊息，然後編輯該訊息。         | 如果進度草稿與回答之間出現另一則訊息，草稿會重新發布在該訊息下方（先發布新草稿，再刪除舊草稿），而不會讓用戶端的捲動位置突然跳動。                                      |
| Mattermost      | 可編輯的草稿貼文。                     | `block` 模式會在已完成文字貼文與工具活動貼文之間輪替；其他模式則會將工具活動整合至同一則草稿樣式貼文中。                                                               |

不支援安全編輯的頻道會改用輸入指示器或僅傳遞
最終回答。請參閱[串流與分塊](/zh-TW/concepts/streaming)，瞭解各頻道
完整的執行階段行為細節。

## 最終處理

最終回答準備完成後，OpenClaw 會嘗試保持聊天畫面整潔：

- 在 Discord 的 `progress` 模式下，最終答案會以新訊息傳送，
  並在後方附上一小段 `-#` 活動回條（例如
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`）；該答案送達後，
  狀態草稿便會刪除。繁忙的頻道不會在回覆上方留下孤立的工具
  記錄；若最終結果為錯誤，則會保留草稿，作為該次失敗互動的可見
  記錄。
- 如果草稿可以安全地轉為最終答案（`partial`/`block` 模式），
  OpenClaw 會直接就地編輯草稿。
- 如果頻道使用原生進度串流，當原生傳輸接受最終文字時，OpenClaw 會結束該
  串流。
- 否則（包含媒體、核准提示、明確的回覆目標、分塊過多，
  或編輯／傳送失敗），OpenClaw 會透過一般頻道傳遞路徑傳送最終答案，
  而不會覆寫草稿。

此備援機制是刻意設計的：傳送一則全新的最終回覆，總比遺失文字、將回覆放入錯誤的討論串，或使用頻道無法安全呈現的承載資料覆寫草稿更好。

## 疑難排解

**我只看到最終答案。**

請檢查處理該訊息的帳號或頻道，其 `channels.<channel>.streaming.mode` 是否為 `progress`。當頻道無法安全地編輯正確的訊息時，某些群組或引用回覆路徑會停用該次對話的草稿預覽。

**我看得到標籤，但沒有工具進度行。**

檢查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 會保留
單一草稿行為，但隱藏工具與任務進度行。

**我看到的是新的最終訊息，而不是編輯後的草稿。**

這是[完成處理](#finalization)中所述的安全後援機制。媒體回覆、長篇回答、
明確的回覆目標、舊的 Telegram 草稿、缺少 Slack 討論串目標、已刪除的
預覽訊息，或原生串流完成處理失敗時，都可能發生這種情況。

**我仍然看到獨立的進度訊息。**

只要草稿處於啟用狀態，進度模式就會隱藏預設的獨立工具進度訊息。如果仍然
出現獨立訊息，請確認該輪對話實際使用的是 `progress` 模式，而不是
`streaming.mode: "off"`，也不是無法為該訊息建立草稿的頻道路徑。

**Microsoft Teams 的行為與 Discord 或 Telegram 不同。**

Microsoft Teams 在個人聊天中使用原生串流，而不是通用的傳送後編輯預覽
傳輸方式，並將 `streaming.mode: "block"` 對應至 Teams 區塊傳送，因為
它不像 Discord 和 Telegram 一樣具有草稿預覽區塊模式。

## 相關內容

- [串流與分塊](/zh-TW/concepts/streaming)
- [訊息](/zh-TW/concepts/messages)
- [頻道設定](/zh-TW/gateway/config-channels)
- [Discord](/zh-TW/channels/discord)
- [Matrix](/zh-TW/channels/matrix)
- [Microsoft Teams](/zh-TW/channels/msteams)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
- [Mattermost](/zh-TW/channels/mattermost)
