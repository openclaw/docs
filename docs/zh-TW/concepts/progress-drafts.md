---
read_when:
    - 設定長時間執行聊天回合的可見進度更新
    - 在部分、區塊與進度串流模式之間選擇
    - 說明 OpenClaw 如何在工作進行期間更新單一頻道訊息
    - 疑難排解進度草稿、獨立進度訊息或最終完成備援方案
summary: 進度草稿：代理程式執行期間持續更新的一則可見工作進度訊息
title: 進度草稿
x-i18n:
    generated_at: "2026-07-16T11:32:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

進度草稿會將一則頻道訊息轉變為即時狀態列，在代理程式工作期間持續更新，而不是堆疊一連串暫時性的「仍在處理」回覆。設定
`channels.<channel>.streaming.mode: "progress"` 後，OpenClaw 會在實際工作開始時建立該
訊息，並隨著代理程式閱讀、規劃、呼叫工具或等待核准而編輯訊息，最後再將其轉換成最終答案。

```text
處理中...
📖 來源：docs/concepts/progress-drafts.md
🔎 網頁搜尋：搜尋「discord edit message」
🛠️ Bash：執行測試
```

<Note>
  當 `channels.discord.streaming` 未設定時，Discord 已預設使用
  `streaming.mode: "progress"`，因此無須任何設定即可在該處顯示進度草稿。
  其他所有頻道預設使用 `partial` 或 `off`；
  如需完整的各頻道預設值表格，請參閱[串流與分塊](/zh-TW/concepts/streaming#channel-mapping)。
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

以下為此處使用的預設值：開始延遲 5 秒、進行實際工作時顯示精簡的進度列，並在該次回合中抑制較舊的獨立進度訊息。原始工具列草稿會使用自動產生的單字標籤；除非明確設定標題，否則狀態標題會省略這個重複標題。

本頁說明進度草稿的使用體驗與設定選項。如需完整的串流模式矩陣、各頻道執行階段注意事項，以及舊版鍵值的遷移方式，請參閱[串流與分塊](/zh-TW/concepts/streaming)。

## 使用者看到的內容

| 部分     | 用途                                                                                     |
| -------- | ---------------------------------------------------------------------------------------- |
| 狀態標題 | 在 Discord 和 Telegram 上顯示模型的前言；Discord 會加入實用的填充文字。                  |
| 標籤     | 選用的起始／狀態列，例如 `Working`。                                            |
| 進度列   | 使用與 `/verbose` 相同的工具圖示和詳細資料格式器，顯示精簡的執行狀態更新。       |

對於原始工具進度，當代理程式開始進行實際工作，且持續忙碌時間超過初始延遲後，標籤便會出現。
它位於持續更新的進度列清單頂端，因此當具體工作列累積到一定數量時，標籤便會隨之捲出畫面。除非明確設定標籤，否則狀態標題只會顯示代理程式以自然語言描述的狀態。純文字回覆絕不會顯示進度草稿；只有實際工作更新才會顯示一列，例如 `🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"`
或 `✍️ Write: to /tmp/file`。

當頻道能夠安全地就地取代草稿時，最終答案會直接取代草稿；否則 OpenClaw 會透過一般傳送流程送出最終答案，並清除草稿或停止更新草稿（請參閱[完成處理](#finalization)）。

## 選擇模式

`channels.<channel>.streaming.mode` 控制進行中狀態的可見行為：

| 模式                  | 最適合的情境                   | 聊天中顯示的內容                         |
| --------------------- | ------------------------------ | ---------------------------------------- |
| `off`    | 安靜的頻道                     | 僅顯示最終答案。                         |
| `partial`    | 觀看答案文字逐步出現           | 編輯一份草稿，顯示最新的答案文字。       |
| `block`    | 較大的答案預覽區塊             | 以較大區塊更新或附加至一份預覽。         |
| `progress`    | 大量使用工具或長時間執行的回合 | 顯示一份狀態草稿，接著顯示最終答案。     |

當使用者比起逐 Token 觀看答案文字串流，更在意「目前正在進行什麼」時，請選擇 `progress`；當答案文字本身就是進度訊號時，請選擇 `partial`；若要使用較大的預覽區塊，則選擇 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍屬於預覽串流，而非一般的區塊回覆傳送；如需後者，請使用 `streaming.block.enabled`。

## 設定標籤

進度標籤位於 `channels.<channel>.streaming.progress` 下。預設的原始工具列標籤為 `"auto"`，它會使用內建的純文字 `Working` 標籤。狀態標題會隱藏這個隱含標籤；如果也想在狀態標題上方顯示標籤，請明確設定
`label: "auto"`：

```text
處理中
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

使用自訂標籤集（在 `label: "auto"` 時仍會隨機／依種子選取）：

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

進度列來自實際的執行事件：工具啟動、項目更新、任務計畫、核准、命令輸出、修補摘要，以及類似的代理程式活動。它們預設為啟用（`progress.toolProgress`，預設值為 `true`）。

工具也可以在單次呼叫仍在執行時發出具型別的進度。如此一來，速度較慢的擷取或搜尋便能在工具傳回最終結果前更新可見草稿。進度更新是一項部分工具結果，模型內容為空，並包含明確的公開頻道中繼資料：

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

OpenClaw 在頻道進度 UI 中只會呈現 `progress.text`。一般工具結果稍後仍會以 `content`/`details` 的形式送達，而且只有該部分會傳回模型。

為工具加入進度時，請發出簡短、通用的訊息，並延遲到作業已等待足夠長的時間、顯示進度確實有用時再發出。`web_fetch` 正是以 5 秒延遲實現此行為：

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

快速呼叫不會顯示進度列；長時間呼叫會在仍處於等待狀態時顯示一列；已取消的呼叫會清除計時器，避免過時的進度出現。進度文字是公開的 UI 側通道，因此絕不能包含密鑰、原始引數、擷取的內容、命令輸出或頁面文字。

### 詳細資料模式

OpenClaw 對進度草稿和 `/verbose` 使用相同的格式器：

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` 是預設值，會使用精簡標籤保持草稿穩定。
`"raw"` 會在可用時附加底層命令，這對偵錯很有幫助，但會讓聊天內容更顯雜亂。例如，`node --check /tmp/app.js` 呼叫在不同模式下會呈現不同內容：

| 模式                  | 進度列                  |
| --------------------- | ----------------------- |
| `explain`    | `🛠️ check js syntax for /tmp/app.js`      |
| `raw`    | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js`      |

### 命令／exec 文字

`streaming.progress.commandText`（預設值為 `"raw"`）控制 exec/bash 進度列旁顯示多少命令詳細資料，且與上述詳細資料模式無關。將它設為 `"status"`，即可在隱藏所有命令文字的同時，繼續顯示工具進度列：

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

### 評註通道

`streaming.progress.commentary`（預設值為 `false`）會將模型在工具執行前的評註／前言敘述（💬，例如「我會先檢查……接著……」）與工具列交錯顯示於草稿中。如需跨頻道共用的設定結構，請參閱[串流與分塊](/zh-TW/concepts/streaming#commentary-progress-lane)。

啟用評註通道後，前言只會呈現為這些交錯顯示的 💬 列；下方的狀態標題會保持隱藏，讓該通道維持文件所述的結構。

### 狀態標題

在 Discord 和 Telegram 的進度模式中，只要模型提供具型別的工具執行前前言，它就會成為草稿的狀態標題。其他使用進度模式的頻道會維持現有的狀態行為。標題預設為啟用，且不會略過短回合的一般活動門檻；啟用 `streaming.progress.commentary` 則會改由交錯顯示的評註通道處理前言。

在 Discord 上，若代理程式可解析出實用工具模型——明確設定的 [`utilityModel`](/zh-TW/gateway/config-agents#utilitymodel)，或主要供應商宣告的小型模型預設值（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）——當模型未發出前言，或已沉默約 20 秒時，該模型會提供簡短的自然語言填充文字（目前 Telegram 的標題只使用前言）：

```text
正在更新設定中的預設模型，接著重新啟動閘道以套用變更。
一次代理程式清單呼叫失敗，正在重試。
```

實用工具敘述預設為啟用（`streaming.progress.narration`，預設值為
`true`），且絕不會退回使用主要模型：它只會搭配明確設定的
`utilityModel`，或代理程式主要供應商所宣告的預設值執行。設定 `utilityModel: ""` 可完全停用實用工具路由。工具列會繼續在下方累積，若兩個狀態來源都停止，工具列便會重新顯示。草稿編輯仍會等待一般活動門檻和實際文字變更，避免快速回合出現閃爍，並減少繁忙頻道中的編輯頻率。設定 `narration: false` 可只停用實用工具模型的填充文字；模型前言標題仍會保持啟用：

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

敘述輸入會受到範圍限制並經過遮蔽處理：實用工具模型會收到傳入的請求文字，以及草稿原本會呈現的相同精簡遮蔽工具摘要，絕不會收到原始命令輸出或工具結果。使用 `commandText: "status"` 時，敘述輸入也會省略 exec/bash 命令文字，與草稿顯示的內容一致。

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

編輯草稿時，進度列會自動壓縮，以減少聊天氣泡重新排版；OpenClaw 也會截斷過長的內容，避免每次更新草稿時產生不同的換行情形。預設的每行上限為 120 個字元；一般文字會在字詞邊界截斷，而路徑或原始命令等較長的詳細資料則會以中間省略號縮短，讓尾端保持可見。

調整每行上限：

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

Slack 可以將進度列呈現為結構化的 Block Kit 欄位，而非純文字：

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

豐富呈現一律會在 Block Kit 欄位旁一併傳送相同的純文字本文，因此無法呈現較豐富結構的用戶端仍可顯示精簡的進度文字。

### 隱藏工具／任務列

保留單一進度草稿，但隱藏工具列和任務列：

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

使用 `toolProgress: false` 時，OpenClaw 仍會隱藏該回合較舊的獨立
工具進度訊息——頻道在視覺上會維持安靜，直到
最終答案出現；若有設定標籤，則標籤除外。

## 頻道行為

| 頻道            | 進度傳輸方式                           | 備註                                                                                                                                                            |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 傳送一則訊息，然後編輯。               | 預設為 `progress` 模式；最終答案會附帶 `-#` 活動回條，並在答案送達後刪除狀態草稿。                                                        |
| Matrix          | 傳送一個事件，然後編輯。               | 帳號層級的串流設定控制帳號層級的草稿。                                                                                                                        |
| Microsoft Teams | 個人聊天中的原生 Teams 串流。          | `streaming.mode: "block"` 會改為對應至 Teams 區塊傳送。                                                                                                              |
| Slack           | 原生串流或可編輯的草稿貼文。           | 需要回覆討論串目標；沒有該目標的頂層私訊仍會收到草稿預覽貼文及其編輯。                                                                                          |
| Telegram        | 傳送一則訊息，然後編輯。               | 如果在進度草稿與答案之間收到一則訊息，草稿會重新發布在其下方（先發布新草稿，再刪除舊草稿），而不會造成用戶端捲動位置跳動。                                      |
| Mattermost      | 可編輯的草稿貼文。                     | `block` 模式會在已完成文字與工具活動貼文之間輪替；其他模式則會將工具活動整合到同一則草稿式貼文中。                                                  |

不支援安全編輯的頻道會改用輸入中指示器或
僅傳送最終答案。請參閱[串流與分塊](/zh-TW/concepts/streaming)，瞭解各頻道
完整的執行階段行為細節。

## 完成處理

最終答案準備就緒時，OpenClaw 會嘗試保持聊天內容整潔：

- 在 Discord 的 `progress` 模式中，最終答案會以新訊息傳送，
  並附加一小段 `-#` 活動回條（例如
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`），狀態草稿則會在
  該答案送達後刪除。即使頻道訊息繁忙，回覆上方也不會留下無主的工具
  記錄；若最終結果是錯誤，則會保留草稿，作為該失敗回合的可見紀錄。
- 如果草稿可以安全地轉為最終答案（`partial`/`block` 模式），
  OpenClaw 會直接就地編輯。
- 如果頻道使用原生進度串流，OpenClaw 會在
  原生傳輸接受最終文字時完成該串流。
- 否則（媒體、核准提示、明確的回覆目標、分塊過多，
  或編輯／傳送失敗），OpenClaw 會透過一般頻道傳送路徑傳送最終答案，
  而不會覆寫草稿。

此備援行為是刻意設計的：傳送新的最終答案，勝過遺失文字、
將回覆放入錯誤的討論串，或以頻道無法安全呈現的酬載覆寫草稿。

## 疑難排解

**我只看到最終答案。**

請確認處理該訊息的帳號或頻道，其 `channels.<channel>.streaming.mode` 是否為
`progress`。當頻道無法安全編輯正確的訊息時，
某些群組或引用回覆路徑會停用該回合的草稿預覽。

**我看到標籤，但沒有工具進度行。**

請檢查 `streaming.progress.toolProgress`。如果其值為 `false`，OpenClaw 會保留
單一草稿行為，但隱藏工具與任務進度行。

**我看到新的最終訊息，而不是編輯後的草稿。**

這是[完成處理](#finalization)中所述的安全備援。媒體回覆、長篇答案、
明確的回覆目標、過舊的 Telegram 草稿、缺少 Slack 討論串目標、
已刪除的預覽訊息，或原生串流完成處理失敗，都可能觸發此情況。

**我仍然看到獨立的進度訊息。**

草稿生效時，進度模式會隱藏預設的獨立工具進度訊息。如果仍出現獨立訊息，
請確認該回合確實使用 `progress` 模式，而不是
`streaming.mode: "off"`，也不是無法為該訊息建立草稿的頻道路徑。

**Teams 的行為與 Discord 或 Telegram 不同。**

Microsoft Teams 在個人聊天中使用原生串流，而不是通用的
傳送後編輯預覽傳輸方式，並會將 `streaming.mode: "block"` 對應至 Teams
區塊傳送，因為它不像 Discord 與 Telegram 那樣具有草稿預覽區塊模式。

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
