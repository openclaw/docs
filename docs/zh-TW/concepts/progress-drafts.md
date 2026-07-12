---
read_when:
    - 設定長時間執行的聊天回合所顯示的進度更新
    - 在 partial、block 與 progress 串流模式之間選擇
    - 說明 OpenClaw 如何在工作進行期間更新同一則頻道訊息
    - 疑難排解進度草稿、獨立進度訊息或最終處理備援方案
summary: 進度草稿：代理程式執行期間持續更新的一則可見工作進度訊息
title: 進度草稿
x-i18n:
    generated_at: "2026-07-12T14:26:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a7d2e60768718922b3d00c72817ff8e342a1e37c6d9a43eef30972412ad9a49
    source_path: concepts/progress-drafts.md
    workflow: 16
---

進度草稿會將一則頻道訊息轉變為即時狀態列，讓代理程式工作時不再堆疊多則暫時性的「仍在處理中」回覆。設定
`channels.<channel>.streaming.mode: "progress"` 後，OpenClaw 會在實際工作開始時建立訊息，並隨代理程式讀取、規劃、呼叫工具或等待核准而編輯訊息，最後再將其轉為最終答案。

```text
執行 Shell...
📖 讀取 docs/concepts/progress-drafts.md
🔎 網頁搜尋：搜尋 "discord edit message"
🛠️ Bash：執行測試
```

<Note>
  當 `channels.discord.streaming` 未設定時，Discord 已預設使用
  `streaming.mode: "progress"`，因此無須任何設定即可在 Discord 顯示進度草稿。其他所有頻道預設為 `partial`
  或 `off`；如需完整的各頻道預設值表格，請參閱[串流與分塊](/zh-TW/concepts/streaming#channel-mapping)。
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

以下是預設行為：自動產生一個單字的標籤、延遲 5 秒後開始
（若發生第二個工作事件則立即開始）、在進行實質工作時顯示精簡的進度行，並在該輪對話中隱藏舊式的獨立進度訊息。

本頁說明進度草稿體驗及其設定選項。如需完整的串流模式矩陣、各頻道執行階段注意事項及舊版設定鍵遷移資訊，請參閱[串流與分塊](/zh-TW/concepts/streaming)。

## 使用者會看到什麼

| 部分           | 用途                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| 標籤          | 簡短的起始／狀態行，例如 `Working` 或 `Shelling`。                        |
| 進度行 | 精簡的執行更新，使用與 `/verbose` 相同的工具圖示和詳細資訊格式化工具。 |

標籤會在代理程式開始進行實質工作，並持續忙碌超過初始延遲時間時出現；若立即觸發第二個工作事件，也會出現標籤。它位於持續更新的進度行清單頂端，因此當具體工作行累積到一定數量後，就會隨捲動而移出畫面。只有純文字的回覆絕不會顯示進度草稿；只有實際工作更新才會顯示一行，例如 `🛠️ Bash: run tests`、
`🔎 Web Search: for "discord edit message"` 或 `✍️ Write: to /tmp/file`。

當頻道能安全地執行此操作時，最終答案會直接取代原位置的草稿；否則，OpenClaw 會透過一般傳送機制傳送最終答案，並清除草稿或停止更新草稿（請參閱[最終處理](#finalization)）。

## 選擇模式

`channels.<channel>.streaming.mode` 控制處理期間的可見行為：

| 模式       | 最適合                         | 聊天中顯示的內容                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 安靜的頻道                   | 僅顯示最終答案。                            |
| `partial`  | 觀察答案文字逐步出現      | 編輯一則草稿，使其顯示最新的答案文字。     |
| `block`    | 較大的答案預覽區塊     | 以較大區塊更新或附加一則預覽。 |
| `progress` | 大量使用工具或長時間執行的對話輪次 | 一則狀態草稿，接著顯示最終答案。          |

當使用者比起逐一詞元觀看答案文字串流，更關心「目前正在發生什麼」時，請選擇 `progress`；當答案文字本身就是進度訊號時，請選擇 `partial`；若需要較大的預覽區塊，則選擇 `block`。在 Discord 和
Telegram 上，`streaming.mode: "block"` 仍是預覽串流，而不是一般的區塊回覆傳送方式——如需後者，請使用 `streaming.block.enabled`。

## 設定標籤

進度標籤位於 `channels.<channel>.streaming.progress`。預設的 `label` 是 `"auto"`，會從 OpenClaw 內建的單字標籤集區中選取：

```text
處理中、執行 Shell 中、疾行中、揮爪中、夾取中、蛻殼中、冒泡中、隨潮中、
礁作業中、破殼中、篩選中、鹽漬中、鸚鵡螺巡航中、磷蝦作業中、藤壺附著中、
龍蝦作業中、潮池探索中、採珠中、啪響中、浮出水面中
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

使用你自己的標籤集區（當 `label: "auto"` 時，仍會隨機或依種子選取）：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["檢查中", "讀取中", "測試中", "完成中"],
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

進度行來自實際的執行事件：工具啟動、項目更新、任務計畫、核准、命令輸出、修補摘要，以及類似的代理程式活動。此功能預設啟用（`progress.toolProgress`，預設值為 `true`）。

工具也能在單次呼叫仍在執行時發出具型別的進度。這讓耗時的擷取或搜尋能在工具傳回最終結果前，更新可見的草稿。進度更新是部分工具結果，包含空的模型內容與明確的公開頻道中繼資料：

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

OpenClaw 在頻道進度使用者介面中只會呈現 `progress.text`。一般工具結果稍後仍會以 `content`/`details` 的形式送達，而且只有這部分會傳回給模型。

為工具新增進度時，請發出簡短、通用的訊息，並延遲至作業處於等待狀態的時間已足以讓訊息發揮作用後再顯示。`web_fetch` 正是採用 5 秒延遲來執行此操作：

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

快速呼叫不會顯示進度行；長時間呼叫在仍待處理時會顯示一行；
已取消的呼叫會先清除計時器，以免出現過時的進度。進度文字
是公開的 UI 側通道，因此絕不能包含秘密、原始引數、
擷取的內容、命令輸出或頁面文字。

### 詳細資訊模式

OpenClaw 對進度草稿和 `/verbose` 使用相同的格式化工具：

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // 說明 | 原始
    },
  },
}
```

`"explain"` 是預設值，會使用簡潔標籤以維持草稿穩定。
`"raw"` 會在可用時附加底層命令，這在偵錯時很有用，
但會讓聊天內容更雜亂。例如，`node --check /tmp/app.js` 呼叫
在不同模式下會以不同方式呈現：

| 模式      | 進度列                                                   |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### 命令／執行文字

`streaming.progress.commandText`（預設為 `"raw"`）控制在 exec/bash 進度行旁顯示多少命令詳細資訊，且不受上述詳細資訊模式影響。將它設為 `"status"`，可在保留工具進度行可見的同時，完全隱藏命令文字：

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

`streaming.progress.commentary`（預設為 `false`）會在草稿中，將模型於工具執行前的評述／前言敘述（💬，例如「我會先檢查……，然後……」）與工具訊息行交錯顯示。請參閱[串流與分塊](/zh-TW/concepts/streaming#commentary-progress-lane)，以瞭解各通道共用的設定結構。

### 敘述式狀態

當代理程式可使用工具模型時——明確設定的 [`utilityModel`](/zh-TW/gateway/config-agents#utilitymodel)，或主要供應商宣告的預設小型模型（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）——進度草稿會以簡短的純文字敘述取代持續更新的工具訊息行。這段敘述由較便宜的模型撰寫，說明代理程式正在進行的工作，並隨工作進展持續更新：

```text
執行中

正在更新設定中的預設模型，接著重新啟動閘道以套用變更。一次代理程式清單呼叫失敗，正在重試。
```

敘述功能預設為開啟（`streaming.progress.narration`，預設為 `true`），且絕不會退回使用主要模型：只有在明確設定 `utilityModel`，或代理程式的主要供應商已宣告預設模型時才會執行。設定 `utilityModel: ""` 可完全停用工具模型路由。工具訊息行仍會在下方持續累積，若敘述停止便會重新顯示；此外，只有當敘述文字確實變更時才會編輯草稿，這也能減少繁忙通道中的頻繁編輯。若要保留原始工具訊息行，請停用此功能：

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

旁白輸入受到限制並經過遮蔽：效用模型會接收傳入的要求文字，以及草稿會呈現的相同精簡遮蔽工具摘要，絕不會收到原始命令輸出或工具結果。使用
`commandText: "status"` 時，旁白輸入也會省略 exec/bash 命令文字，與草稿顯示的內容一致。

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

編輯草稿時，進度行會自動壓縮，以減少聊天泡泡重新排版；OpenClaw 也會截短過長的行，避免反覆編輯草稿時每次更新的換行方式都不同。每行預設上限為 120 個字元；一般文字會在單字邊界截斷，而路徑或原始命令等較長的詳細資訊，則會使用中間省略號縮短，以保留可見的後綴。

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

Slack 可將進度行呈現為結構化的 Block Kit 欄位，而非純文字：

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

豐富呈現一律會在 Block Kit 欄位之外，同時傳送相同的純文字本文，因此無法呈現較豐富格式的用戶端仍會顯示精簡的進度文字。

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

使用 `toolProgress: false` 時，OpenClaw 仍會在該輪對話中抑制舊版獨立工具進度訊息；除了已設定的標籤外，頻道在最終答案出現前都會保持視覺上的安靜。

## 頻道行為

| 頻道            | 進度傳輸方式                           | 備註                                                                                                                                                                        |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 傳送一則訊息，然後編輯它。             | 預設使用 `progress` 模式；最終答案會附帶 `-#` 活動回執，且答案送達後會刪除狀態草稿。                                                                                        |
| Matrix          | 傳送一個事件，然後編輯它。             | 帳號層級的串流設定控制帳號層級的草稿。                                                                                                                                      |
| Microsoft Teams | 在個人聊天中使用 Teams 原生串流。      | `streaming.mode: "block"` 會改為對應至 Teams 區塊傳遞。                                                                                                                     |
| Slack           | 原生串流或可編輯的草稿貼文。           | 需要回覆討論串目標；沒有目標的頂層私訊仍會收到草稿預覽貼文及其編輯更新。                                                                                                    |
| Telegram        | 傳送一則訊息，然後編輯它。             | 如果在進度草稿與答案之間送達另一則訊息，草稿會重新發布到該訊息下方（先發布新草稿，再刪除舊草稿），而不會讓用戶端的捲動位置突然跳動。                                         |
| Mattermost      | 可編輯的草稿貼文。                     | `block` 模式會在已完成文字與工具活動貼文之間輪替；其他模式則會將工具活動整合到同一則草稿樣式的貼文中。                                                                      |

不支援安全編輯的頻道會改用輸入中指示器或
僅傳遞最終答案。請參閱[串流與分塊](/zh-TW/concepts/streaming)，瞭解各頻道
完整的執行階段行為細節。

## 完成處理

最終答案準備就緒時，OpenClaw 會嘗試保持聊天內容整潔：

- 在 Discord 的 `progress` 模式中，最終答案會以新訊息傳送，
  並在後方附上簡短的 `-#` 活動回條（例如
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`）；答案送達後，
  狀態草稿便會刪除。忙碌的頻道不會在回覆上方留下孤立的工具
  記錄；若最終結果為錯誤，則會保留草稿，作為該次失敗互動的可見
  記錄。
- 如果草稿可以安全地直接成為最終答案（`partial`/`block` 模式），
  OpenClaw 會直接編輯該草稿。
- 如果頻道使用原生進度串流，當原生傳輸接受最終文字時，OpenClaw 會完成該
  串流。
- 否則（包含媒體、核准提示、明確的回覆目標、分段過多，
  或編輯／傳送失敗），OpenClaw 會透過一般頻道傳遞路徑傳送最終答案，
  而不會覆寫草稿。

此備援機制是刻意設計的：傳送全新的最終回覆，勝過遺失文字、將回覆錯接到其他討論串，或以頻道無法安全呈現的承載資料覆寫草稿。

## 疑難排解

**我只看到最終回答。**

請確認處理該訊息的帳號或頻道，其 `channels.<channel>.streaming.mode` 設為 `progress`。當頻道無法安全地編輯正確的訊息時，某些群組或引用回覆路徑會停用該回合的草稿預覽。

**我看得到標籤，但沒有工具進度行。**

檢查 `streaming.progress.toolProgress`。如果設為 `false`，OpenClaw 會保留
單一草稿行為，但隱藏工具與任務進度行。

**我看到的是全新的最終訊息，而不是經過編輯的草稿。**

這是[最終處理](#finalization)中所述的安全備援機制。媒體回覆、長篇回答、明確的回覆目標、舊的 Telegram
草稿、缺少 Slack 討論串目標、已刪除的預覽訊息，或原生串流最終處理失敗時，
都可能發生這種情況。

**我仍然看到獨立的進度訊息。**

草稿啟用時，進度模式會抑制預設的獨立工具進度訊息。如果仍然出現獨立訊息，
請確認該回合實際使用的是 `progress` 模式，而不是 `streaming.mode: "off"`，
也不是無法為該訊息建立草稿的頻道路徑。

**Microsoft Teams 的行為與 Discord 或 Telegram 不同。**

Microsoft Teams 在個人聊天中使用原生串流，而非通用的傳送後編輯預覽傳輸機制，
並將 `streaming.mode: "block"` 對應至 Teams 區塊傳送，因為它不像 Discord 和
Telegram 一樣具有草稿預覽區塊模式。

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
