---
read_when:
    - 說明串流或分塊在通道上的運作方式
    - 變更區塊串流或頻道分塊行為
    - 偵錯重複/過早的區塊回覆或頻道預覽串流
summary: 串流 + 分塊行為（區塊回覆、頻道預覽串流、模式對應）
title: 串流與分塊
x-i18n:
    generated_at: "2026-07-05T11:16:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18298e3b24137e48cfa7b46e49c467785b49f2d1f0784ac7cb5696452843c948
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有兩個彼此獨立的串流層，而目前對頻道訊息**沒有真正的 token-delta 串流**：

- **區塊串流（頻道）：**在助理撰寫時送出完成的**區塊**。這些是一般頻道訊息，不是 token delta。
- **預覽串流（Telegram/Discord/Slack/Matrix/Mattermost/MS Teams）：**
  產生內容時更新暫時的**預覽訊息**（傳送 + 編輯/附加）。

## 區塊串流（頻道訊息）

區塊串流會在助理輸出可用時，以較粗略的片段傳送。

```text
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

- `text_delta/events`：模型串流事件（非串流模型可能較稀疏）。
- `chunker`：`EmbeddedBlockChunker` 套用最小/最大界限 + 斷點偏好。
- `channel send`：實際送出的訊息（區塊回覆）。

**控制項**（除非另有註明，皆位於 `agents.defaults` 底下）：

| 鍵                                                           | 值 / 形狀                                                               | 預設值     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }`（傳送前合併串流區塊）               | -          |
| `*.blockStreaming`（頻道覆寫）                               | `true` / `false`，強制每個頻道（及每個帳號）的區塊串流                 | -          |
| `*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`） | 數字，硬性上限                                                          | 4000       |
| `*.chunkMode`                                                | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | 數字，軟性行數上限，會拆分過高的回覆以避免 UI 裁切                    | 17         |

`chunkMode: "newline"` 會先依空白行（段落邊界）拆分，而不是每個換行；文字超過限制後才退回依長度切塊。

`blockStreamingBreak` 的**邊界語意**：

- `text_end`：只要 chunker 送出就串流區塊；在每個 `text_end` 時 flush。
- `message_end`：等助理訊息完成後，再 flush 已緩衝的輸出。如果緩衝文字超過 `maxChars`，仍會使用 chunker，因此可在最後送出多個片段。

### 使用區塊串流傳送媒體

串流媒體必須使用結構化 payload 欄位，例如 `mediaUrl` 或 `mediaUrls`；串流文字不會被解析為附件命令。當區塊串流提早傳送媒體時，OpenClaw 會記住該回合的這次傳送。如果最終助理 payload 重複相同的媒體 URL，最終傳送會移除重複媒體，而不是再次傳送附件。

完全重複的最終 payload 會被抑制。如果最終 payload 在已串流的媒體周圍加入不同文字，OpenClaw 仍會傳送新文字，同時保持媒體只傳送一次。這可避免在 Telegram 等頻道上重複語音備忘或檔案。

## 切塊演算法（低/高界限）

區塊切塊由 `EmbeddedBlockChunker` 實作：

- **低界限：**在 buffer >= `minChars` 前不要送出（除非強制）。
- **高界限：**偏好在 `maxChars` 前拆分；若強制，則在 `maxChars` 拆分。
- **斷點偏好鏈：**`paragraph` -> `newline` -> `sentence` ->
  空白字元 -> 硬性斷點。
- **程式碼圍欄：**絕不在圍欄內拆分；在 `maxChars` 強制拆分時，會關閉並重新開啟圍欄，以保持 Markdown 有效。

`maxChars` 會被限制在頻道的 `textChunkLimit` 內，因此無法超過每個頻道的上限。

## 合併（合併串流區塊）

啟用區塊串流時，OpenClaw 可以在傳送前**合併連續的區塊片段**，減少單行洗版，同時仍提供漸進式輸出。

- 合併會等待**閒置間隔**（`idleMs`）後才 flush。
- 緩衝區會受 `maxChars` 限制，超過時會 flush。
- `minChars` 會防止太小的片段在累積足夠文字前傳送（最終 flush 一律會傳送剩餘文字）。
- 連接字串衍生自 `blockStreamingChunk.breakPreference`：`paragraph` ->
  `\n\n`、`newline` -> `\n`、`sentence` -> 空格。
- 可透過 `*.blockStreamingCoalesce` 使用頻道覆寫（包含每帳號設定）。
- Discord、Signal 和 Slack 預設合併為 `{ minChars: 1500, idleMs: 1000 }`，除非被覆寫。

## 區塊之間的擬人化節奏

啟用區塊串流時，在第一個區塊之後，於區塊回覆之間加入**隨機暫停**，讓多訊息泡泡回覆感覺更自然。

| `agents.defaults.humanDelay.mode` | 行為                    |
| --------------------------------- | ----------------------- |
| `off`（預設）                     | 不暫停                  |
| `natural`                         | 800-2500ms 隨機暫停     |
| `custom`                          | `minMs`/`maxMs`         |

可透過 `agents.list[].humanDelay` 針對每個代理覆寫。僅套用於**區塊回覆**，不套用於最終回覆或工具摘要。

## 「串流片段或全部內容」

- **串流片段：**`blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  （邊產生邊送出）。非 Telegram 頻道也需要 `*.blockStreaming: true`。
- **最後串流全部內容：**`blockStreamingBreak: "message_end"`（一次 flush；若非常長，可能分成多個片段）。
- **不使用區塊串流：**`blockStreamingDefault: "off"`（僅最終回覆）。

除非明確將 `*.blockStreaming` 設為 `true`，否則區塊串流為**關閉**。頻道可以在沒有區塊回覆的情況下串流即時預覽（`channels.<channel>.streaming`）。`blockStreaming*` 預設值位於 `agents.defaults` 底下，而不是設定根層。

## 預覽串流模式

標準鍵：`channels.<channel>.streaming`（巢狀 `{ mode, ... }`；頂層布林值是舊版別名）。

| 模式       | 行為                                                                  |
| ---------- | --------------------------------------------------------------------- |
| `off`      | 停用預覽串流                                                          |
| `partial`  | 單一預覽會被最新文字取代                                              |
| `block`    | 預覽以切塊/附加步驟更新                                               |
| `progress` | 產生期間顯示進度/狀態預覽，完成時傳送最終答案                         |

`streaming.mode: "block"` 是適用於 Discord 和 Telegram 等可編輯頻道的預覽串流模式；它本身不會啟用那些頻道的區塊傳送。一般區塊回覆請使用 `streaming.block.enabled`（或舊版 `blockStreaming` 頻道鍵）。Microsoft Teams 是例外：它沒有草稿預覽區塊傳輸，因此 `streaming.mode:
"block"` 會完全停用原生串流，回覆會改以一般區塊傳送落地，而不是原生 partial/progress 串流。

### 頻道對應

| 頻道       | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | 是    | 是        | 是      | 可編輯進度草稿      |
| Discord    | 是    | 是        | 是      | 可編輯進度草稿      |
| Slack      | 是    | 是        | 是      | 是                  |
| Mattermost | 是    | 是        | 是      | 是                  |
| MS Teams   | 是    | 是        | 是      | 原生進度串流        |

預覽片段設定（`streaming.preview.chunk.*`，例如位於 `channels.discord.streaming` 或 `channels.telegram.streaming` 底下）預設為 `minChars: 200`、`maxChars: 800`（受頻道 `textChunkLimit` 限制），以及 `breakPreference: "paragraph"`。

僅 Slack：

- `channels.slack.streaming.nativeTransport` 會在 `channels.slack.streaming.mode="partial"` 時切換 Slack 原生串流 API 呼叫（`chat.startStream`/`chat.appendStream`/`chat.stopStream`）（預設：`true`）。
- Slack 原生串流和 Slack 助理執行緒狀態需要回覆執行緒目標。頂層 DM 不會顯示該執行緒樣式預覽，但仍可使用 Slack 草稿預覽貼文和編輯。

### 舊版鍵遷移

| 頻道     | 舊版鍵                                                      | 狀態                                                                                                                                                         |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Telegram | `streamMode`、純量/布林值 `streaming`                       | 由 doctor/設定相容性路徑偵測並遷移至 `streaming.mode`                                                                                                       |
| Discord  | `streamMode`、布林值 `streaming`                            | `streaming` enum 的執行階段別名；執行 `openclaw doctor --fix` 以重寫已保存的設定                                                                             |
| Slack    | `streamMode`；布林值 `streaming`；舊版 `nativeStreaming`    | `streaming.mode` 的執行階段別名（以及布林值/舊版形式對應的 `streaming.nativeTransport`）；執行 `openclaw doctor --fix` 以重寫已保存的設定                    |

## 執行階段行為

### Telegram

- 在 DM 和群組/主題中使用 `sendMessage` + `editMessageText` 預覽更新；最終文字會就地編輯作用中的預覽。Telegram 暫時性 30 秒「輸入中」草稿（`sendMessageDraft`）不會用於答案串流。
- 短的初始預覽仍會為了推播通知 UX 而 debounce，但會在有界延遲後具體化，讓作用中的執行不會在視覺上保持靜默。
- 長最終結果會重用預覽訊息作為第一個片段，並只傳送剩餘片段。
- `block` 模式會在 `streaming.preview.chunk.maxChars` 將預覽輪替成新訊息（預設 800，受 Telegram 的 4096 編輯限制約束）；其他模式會將單一預覽增長到最多 4096 個字元。
- `progress` 模式會將工具進度保留在可編輯狀態草稿中；當答案串流作用中但尚無可用工具行時，會具體化狀態標籤；完成時清除草稿，並透過一般傳送送出最終答案。
- 如果在完成文字確認前最終編輯失敗，OpenClaw 會使用一般最終傳送並清理過期預覽。
- 當 Telegram 區塊串流被明確啟用時，會略過預覽串流，以避免雙重串流。
- `/reasoning stream` 可將推理寫入暫時性預覽，並在最終傳送後刪除。
- Telegram 選取引文回覆是例外：當 `replyToMode` 不是 `"off"` 且存在選取的引文文字時，OpenClaw 會略過該回合的答案預覽串流（最終答案必須透過原生引文回覆路徑），因此工具進度預覽行無法呈現。沒有選取引文文字的目前訊息回覆仍會保留預覽串流。詳情請參閱
  [Telegram 頻道文件](/zh-TW/channels/telegram)。

### Discord

- 使用傳送 + 編輯預覽訊息。
- `block` 模式使用草稿分塊（`draftChunk`）。
- 當 Discord 區塊串流已明確啟用時，會略過預覽串流。
- 最終媒體、錯誤與明確回覆承載資料會取消待處理的預覽，
  不會清出新的草稿，然後使用一般傳遞。

### Slack

- `partial` 可在可用時使用 Slack 原生串流（`chat.startStream`/`append`/`stop`）。
- `block` 使用附加式草稿預覽。
- `progress` 使用狀態預覽文字，然後是最終答案。
- 沒有回覆執行緒的頂層私訊會使用草稿預覽貼文與編輯，
  而不是 Slack 原生串流。
- 原生與草稿預覽串流會抑制該回合的區塊回覆，因此
  Slack 回覆只會由一條傳遞路徑串流。
- 最終媒體/錯誤承載資料與進度最終訊息不會建立一次性草稿
  訊息；只有能編輯預覽的文字/區塊最終訊息會清出待處理的
  草稿文字。

### Mattermost

- 將思考、工具活動與部分回覆文字串流到單一草稿
  預覽貼文，並在最終答案可安全傳送時就地完成。
- 如果預覽貼文已被刪除或在完成時無法使用，則退回傳送新的最終貼文。
- 最終媒體/錯誤承載資料會在一般傳遞前取消待處理的預覽更新，
  而不是清出臨時預覽貼文。

### Matrix

- 當最終文字可以重用預覽事件時，草稿預覽會就地完成。
- 僅媒體、錯誤與回覆目標不符的最終訊息會在一般傳遞前
  取消待處理的預覽更新；已可見的過期預覽會被撤回。

## 工具進度預覽更新

預覽串流也可以包含**工具進度**更新：像是「正在搜尋網路」、「正在讀取檔案」
或「正在呼叫工具」這類短狀態行，會在工具執行時出現在同一則
預覽訊息中，早於最終回覆。在 Codex app-server 模式中，Codex
前言/ commentary 訊息使用同一條預覽路徑，因此簡短的「我正在檢查...」
進度備註可以串流到可編輯草稿中，而不會成為最終答案的一部分。
這能讓多步驟工具回合在第一個思考預覽與最終答案之間保持視覺上的進行狀態，
而不是沉默等待。

長時間執行的工具可能會在返回前發出具型別的進度。例如，
`web_fetch` 會在開始時啟動五秒計時器：如果擷取仍在
等待中，預覽會顯示 `Fetching page content...`；如果擷取在那之前完成或
被取消，則不會發出進度行。後續的最終工具
結果仍會正常傳遞給模型。

支援的表面：

- **Discord**、**Slack**、**Telegram** 與 **Matrix** 會在預覽
  串流啟用時，預設將工具進度與 Codex 前言更新串流到即時預覽編輯中。
  Microsoft Teams 在個人聊天中使用其原生進度串流。
- Telegram 自 `v2026.4.22` 起已隨附啟用工具進度預覽更新；
  保持啟用可保留該已發布行為。
- **Mattermost** 已將工具活動折疊進其單一草稿預覽貼文
  （見上文）。
- 工具進度編輯會遵循作用中的預覽串流模式；當預覽串流為 `off`
  或區塊串流已接管訊息時，會略過這些編輯。在 Telegram 上，
  `streaming.mode: "off"` 是僅最終訊息模式：一般進度閒聊也會被抑制，
  而不是作為獨立狀態訊息傳遞；核准提示、媒體承載資料與錯誤仍會
  正常路由。
- 若要保留預覽串流但隱藏工具進度行，請將該通道的
  `streaming.preview.toolProgress` 設為 `false`（預設為
  `true`）。若要讓工具進度行保持可見但隱藏命令/執行文字，
  請將 `streaming.preview.commandText` 設為 `"status"`，或將
  `streaming.progress.commandText` 設為 `"status"`；預設值為 `"raw"`，
  以保留已發布行為。此政策由使用 OpenClaw 精簡進度算繪器的
  草稿/進度通道共用，包括 Discord、Matrix、
  Microsoft Teams、Mattermost、Slack 草稿預覽與 Telegram。若要完全停用
  預覽編輯，請將 `streaming.mode` 設為 `off`。

## 進度草稿算繪

進度模式草稿（`streaming.progress.*`）可按通道設定界限與組態：

| 鍵                                | 預設值        | 行為                                                           |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | 保留在草稿標籤下方的最大精簡進度行數                          |
| `streaming.progress.maxLineChars` | `120`         | 截斷前每個精簡行的最大字元數（感知詞邊界）                    |
| `streaming.progress.label`        | `"auto"`      | 草稿標題；自訂字串，或 `false` 以隱藏                         |
| `streaming.progress.labels`       | 內建池        | `label: "auto"` 時使用的候選標籤                              |

### Commentary 進度通道

除了工具進度之外，精簡進度算繪器還可以在草稿中呈現另一條通道：

- **`streaming.progress.commentary`** - 算繪模型在工具前的
  **commentary**（簡短的「我會檢查... 然後...」敘述），並在進度草稿中
  與工具行交錯顯示。

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

讓進度行保持可見，但隱藏原始命令/執行文字：

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

在另一個精簡進度通道鍵下使用相同形狀，例如
`channels.discord`、`channels.matrix`、`channels.msteams`、
`channels.mattermost`，或 Slack 草稿預覽。對於進度草稿模式，請將
相同政策放在 `streaming.progress` 下：

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## 相關

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 目標共用預覽、編輯、串流與完成設計
- [進度草稿](/zh-TW/concepts/progress-drafts) - 在長回合期間更新的可見進行中訊息
- [訊息](/zh-TW/concepts/messages) - 訊息生命週期與傳遞
- [重試](/zh-TW/concepts/retry) - 傳遞失敗時的重試行為
- [通道](/zh-TW/channels) - 各通道的串流支援
