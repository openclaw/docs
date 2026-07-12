---
read_when:
    - 說明頻道上的串流或分塊運作方式
    - 變更區塊串流或頻道分塊行為
    - 偵錯重複／過早的區塊回覆或頻道預覽串流
summary: 串流與分塊行為（區塊回覆、頻道預覽串流、模式對應）
title: 串流與分塊
x-i18n:
    generated_at: "2026-07-12T14:27:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7860a83183459ea3dd05c866118e14bc8469c7adcd074a25b6f4a1174cb1664d
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有兩個彼此獨立的串流層，而且目前傳送到頻道訊息時**沒有真正的
詞元差異串流**：

- **區塊串流（頻道）：**在助理撰寫時送出已完成的**區塊**。這些是一般頻道訊息，不是詞元差異。
- **預覽串流（Telegram/Discord/Slack/Matrix/Mattermost/MS Teams）：**
  在生成期間更新暫時的**預覽訊息**（傳送 + 編輯/附加）。

## 區塊串流（頻道訊息）

區塊串流會在助理輸出可用時，以較大區塊傳送。

```text
模型輸出
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ 區塊器隨緩衝區增長送出區塊
       └─ (blockStreamingBreak=message_end)
            └─ 區塊器在 message_end 時清空
                   └─ 頻道傳送（區塊回覆）
```

- `text_delta/events`：模型串流事件（非串流模型可能較稀疏）。
- `chunker`：套用最小/最大界限與分隔偏好的 `EmbeddedBlockChunker`。
- `channel send`：實際傳出的訊息（區塊回覆）。

**控制項**（除非另有註明，否則皆位於 `agents.defaults` 下）：

| 鍵                                                           | 值／結構                                                                | 預設值     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }`（傳送前合併串流區塊）                | -          |
| `*.blockStreaming`（頻道覆寫）                               | `true` / `false`，強制各頻道（及各帳號）使用區塊串流                     | -          |
| `*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`） | 數字，硬性上限                                                          | 4000       |
| `*.chunkMode`                                                | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | 數字，拆分過長回覆以避免介面裁切的軟性行數上限                          | 17         |

`chunkMode: "newline"` 會依空白行（段落邊界）分割，而不是依每個換行分割；文字超過
限制後，才會改用長度分塊。

具有巢狀 `streaming` 設定的頻道（Telegram、Discord、Slack、iMessage、
Microsoft Teams）會將這些覆寫寫成
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`；沒有巢狀設定的頻道
（例如 Signal、IRC、Google Chat、WhatsApp、Mattermost）則使用扁平的
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` 寫法。
巢狀串流頻道中過時的扁平鍵會由 `openclaw doctor --fix` 遷移，執行階段不會讀取。

`blockStreamingBreak` 的**邊界語意**：

- `text_end`：區塊器送出後立即串流區塊；每次 `text_end` 時清空緩衝區。
- `message_end`：等待助理訊息完成，再清空緩衝的輸出。若緩衝文字超過 `maxChars`，
  仍會使用區塊器，因此結束時可能送出多個區塊。

### 使用區塊串流傳送媒體

串流媒體必須使用 `mediaUrl` 或 `mediaUrls` 等結構化承載資料欄位；串流文字不會被解析為附件命令。
當區塊串流提早傳送媒體時，OpenClaw 會記住該回合的這次傳送。若最終助理承載資料重複相同的媒體
URL，最終傳送會移除重複媒體，而不會再次傳送附件。

完全重複的最終承載資料會被抑制。若最終承載資料在已串流的媒體前後加入不同文字，OpenClaw
仍會傳送新文字，同時確保媒體只傳送一次。這可避免 Telegram 等頻道出現重複的語音訊息或檔案。

## 分塊演算法（下限／上限）

區塊分塊由 `EmbeddedBlockChunker` 實作：

- **下限：**緩衝區達到 `minChars` 前不送出（強制送出時除外）。
- **上限：**優先在 `maxChars` 前分割；若強制分割，則在 `maxChars` 處分割。
- **分隔偏好順序：**`paragraph` -> `newline` -> `sentence` ->
  空白字元 -> 強制分隔。
- **程式碼圍欄：**絕不在圍欄內分割；在 `maxChars` 處強制分割時，會關閉並重新開啟
  圍欄，以保持 Markdown 有效。

`maxChars` 會限制在頻道的 `textChunkLimit` 以內，因此無法超過各頻道的上限。

## 合併（合併串流區塊）

啟用區塊串流後，OpenClaw 可在傳送前**合併連續的區塊片段**，減少單行訊息洗版，
同時仍提供漸進式輸出。

- 合併會等待**閒置間隔**（`idleMs`）後再清空。
- 緩衝區以 `maxChars` 為上限，超過時會清空。
- `minChars` 會避免在累積足夠文字前傳送過小的片段（最終清空一律會傳送剩餘文字）。
- 連接符由 `blockStreamingChunk.breakPreference` 決定：`paragraph` ->
  `\n\n`、`newline` -> `\n`、`sentence` -> 空格。
- 可透過 `*.blockStreamingCoalesce` 設定頻道覆寫（包括各帳號設定）。
- 除非覆寫，Discord、Signal 與 Slack 的預設合併設定為 `{ minChars: 1500, idleMs: 1000 }`。

## 區塊之間仿真人的節奏

啟用區塊串流後，從第一個區塊之後開始，在區塊回覆之間加入**隨機暫停**，
讓多訊息框回覆感覺更自然。

| `agents.defaults.humanDelay.mode` | 行為                    |
| --------------------------------- | ----------------------- |
| `off`（預設）                     | 不暫停                  |
| `natural`                         | 隨機暫停 800-2500ms     |
| `custom`                          | `minMs`/`maxMs`         |

可透過 `agents.list[].humanDelay` 為各代理程式覆寫。僅套用至**區塊回覆**，
不套用至最終回覆或工具摘要。

## 「串流片段或全部內容」

- **串流片段：**`blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  （邊生成邊送出）。非 Telegram 頻道還需要 `*.blockStreaming: true`。
- **結束時串流全部內容：**`blockStreamingBreak: "message_end"`（一次清空；
  若內容很長，可能分成多個片段）。
- **不使用區塊串流：**`blockStreamingDefault: "off"`（僅傳送最終回覆）。

除非將 `*.blockStreaming` 明確設為 `true`，否則區塊串流為**關閉**。
頻道可以在沒有區塊回覆的情況下串流即時預覽（`channels.<channel>.streaming`）。
`blockStreaming*` 預設值位於 `agents.defaults` 下，而非設定根層級。

## 預覽串流模式

標準鍵：`channels.<channel>.streaming`（巢狀 `{ mode, ... }`；舊版頂層布林值／字串寫法
會由 `openclaw doctor --fix` 重寫）。

| 模式       | 行為                                                               |
| ---------- | ------------------------------------------------------------------ |
| `off`      | 停用預覽串流                                                       |
| `partial`  | 以最新文字取代單一預覽                                             |
| `block`    | 以分塊／附加步驟更新預覽                                           |
| `progress` | 生成期間顯示進度／狀態預覽，完成時顯示最終答案                     |

`streaming.mode: "block"` 是適用於 Discord 和 Telegram 等可編輯頻道的預覽串流模式；
它本身不會啟用這些頻道的區塊傳送。一般區塊回覆請使用 `streaming.block.enabled`
（沒有巢狀 `streaming` 設定的頻道則繼續使用扁平的 `blockStreaming` 鍵）。
Microsoft Teams 是例外：它沒有草稿預覽區塊傳輸，因此 `streaming.mode:
"block"` 會完全停用原生串流，回覆將改以一般區塊傳送，而不是原生的部分／進度串流。
Mattermost 也有所不同：在 `block` 模式下，它會在已完成文字與工具活動區塊之間輪替預覽，
因此先前的區塊會以獨立貼文保留可見，而不會在單一可編輯草稿中被覆寫。

### 頻道對應

| 頻道       | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | 是    | 是        | 是      | 可編輯的進度草稿  |
| Discord    | 是    | 是        | 是      | 可編輯的進度草稿  |
| Slack      | 是    | 是        | 是      | 是                |
| Mattermost | 是    | 是        | 是      | 是                |
| MS Teams   | 是    | 是        | 是      | 原生進度串流      |

預覽分塊設定（`streaming.preview.chunk.*`，例如位於
`channels.discord.streaming` 或 `channels.telegram.streaming` 下）預設為
`minChars: 200`、`maxChars: 800`（限制在頻道的 `textChunkLimit` 以內），以及
`breakPreference: "paragraph"`。

僅限 Slack：

- 當 `channels.slack.streaming.mode="partial"` 時，
  `channels.slack.streaming.nativeTransport` 會切換 Slack 原生串流 API
  呼叫（`chat.startStream`/`chat.appendStream`/`chat.stopStream`）（預設：`true`）。
- Slack 原生串流與 Slack 助理討論串狀態需要回覆討論串目標。頂層私人訊息不會顯示該討論串樣式預覽，
  但仍可使用 Slack 草稿預覽貼文與編輯。

### 舊版鍵遷移

| 頻道     | 舊版鍵                                                      | 狀態                                                                                                                                         |
| -------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`、純量／布林值 `streaming`                     | 由 `openclaw doctor --fix` 重寫為 `streaming.mode`；執行階段不會讀取                                                                          |
| Discord  | `streamMode`、布林值 `streaming`                            | 由 `openclaw doctor --fix` 重寫為 `streaming.mode`；執行階段不會讀取                                                                          |
| Slack    | `streamMode`；布林值 `streaming`；舊版 `nativeStreaming`    | 由 `openclaw doctor --fix` 重寫為 `streaming.mode`（布林值／舊版形式另會重寫為 `streaming.nativeTransport`）；執行階段不會讀取                 |

## 執行階段行為

### Telegram

- 在私訊與群組/主題中使用 `sendMessage` + `editMessageText` 更新預覽；最終文字會直接編輯作用中的預覽。Telegram
  的 30 秒短暫「輸入中」草稿（`sendMessageDraft`）不會用於串流回答。
- 簡短的初始預覽仍會進行防彈跳處理，以改善推播通知的使用者體驗，但會在有限延遲後顯示，避免進行中的執行在視覺上一直毫無動靜。
- 較長的最終內容會將預覽訊息重複用於第一個區塊，並只傳送其餘區塊。
- `block` 模式會在達到 `streaming.preview.chunk.maxChars` 時，將預覽輪替為新訊息（預設為 800，上限為 Telegram 的 4096
  字元編輯限制）；其他模式則會讓單一預覽持續增長，最多達 4096 個字元。
- `progress` 模式會將工具進度保留在可編輯的狀態草稿中；當回答串流作用中但尚無可用的工具內容行時，會顯示狀態標籤；完成時會清除草稿，並透過一般傳送流程傳送最終回答。
- 如果在確認完整文字之前，最終編輯失敗，OpenClaw 會使用一般最終傳送流程，並清理過期的預覽。
- 明確啟用 Telegram 區塊串流時，會略過預覽串流，以避免重複串流。
- `/reasoning stream` 可將推理內容寫入暫時性預覽，並在最終傳送後刪除該預覽。
- Telegram 的選取引文回覆屬於例外：當 `replyToMode` 不是
  `"off"` 且存在選取的引文文字時，OpenClaw 會略過該輪的回答預覽串流（最終回答必須經由原生引文回覆路徑傳送），因此無法呈現工具進度預覽行。不含選取引文文字的目前訊息回覆仍會保留預覽串流。詳情請參閱
  [Telegram 頻道文件](/zh-TW/channels/telegram)。

### Discord

- 使用傳送與編輯預覽訊息。
- `block` 模式使用草稿分塊（`draftChunk`）。
- 明確啟用 Discord 區塊串流時，會略過預覽串流。
- `progress` 模式會在最終回答附加一小段 `-#` 活動回條（思考/工具呼叫次數與經過時間），並在該回答傳送後刪除狀態草稿，因此繁忙的頻道不會在回覆上方留下孤立的工具記錄。發生錯誤的最終回答會保留草稿，作為該次失敗執行的記錄。
- 最終媒體、錯誤與明確回覆的承載內容會取消待處理的預覽，而不送出新的草稿，接著改用一般傳送流程。

### Slack

- 在可用時，`partial` 可使用 Slack 原生串流（`chat.startStream`/`append`/`stop`）。
- `block` 使用附加式草稿預覽。
- `progress` 先使用狀態預覽文字，接著顯示最終回答。
- 沒有回覆討論串的頂層私訊會使用草稿預覽貼文與編輯，而非 Slack 原生串流。
- 原生與草稿預覽串流會在該輪停用區塊回覆，因此 Slack 回覆只會經由一條傳送路徑進行串流。
- 最終媒體/錯誤承載內容與進度最終內容不會建立用完即棄的草稿訊息；只有能編輯預覽的文字/區塊最終內容，才會送出待處理的草稿文字。

### Mattermost

- 在 `partial` 模式下，會將思考內容和部分回覆文字串流至單一草稿
  預覽貼文，並在最終答案可安全傳送時就地完成。
- 在 `progress` 模式下，會將思考內容和工具活動串流至單一狀態
  預覽，並在最終答案可安全傳送時就地完成。
- 在 `block` 模式下，會在已完成文字與工具活動貼文之間輪替；
  平行及連續的工具更新會共用目前的工具活動貼文。
- 如果預覽貼文已遭刪除，或在完成時因其他原因無法使用，
  則改為傳送新的最終貼文。
- 最終媒體／錯誤承載資料會在正常傳遞前取消待處理的預覽更新，
  而不是送出暫時的預覽貼文。

### Matrix

- 當最終文字可重複使用預覽事件時，草稿預覽會就地完成。
- 僅含媒體、錯誤及回覆目標不相符的最終結果，會在正常傳遞前取消待處理的預覽
  更新；已顯示但過時的預覽會遭到遮蔽。

## 工具進度預覽更新

預覽串流也可以包含**工具進度**更新：在工具執行期間，會於同一則預覽訊息中顯示「正在搜尋網路」、「正在讀取檔案」或「正在呼叫工具」等簡短狀態行，並出現在最終回覆之前。在 Codex app-server 模式下，Codex 的前言／說明訊息也會使用相同的預覽路徑，因此「我正在檢查……」等簡短進度說明可以串流至可編輯的草稿中，而不會成為最終答案的一部分。這可讓多步驟的工具操作在視覺上保持動態，而不會在首次思考預覽與最終答案之間陷入沉默。

長時間執行的工具可能會在傳回結果前發出具型別的進度訊息。例如，
`web_fetch` 啟動時會設定五秒計時器：如果擷取作業仍在
等待中，預覽會顯示 `Fetching page content...`；如果擷取作業在此之前完成或
遭取消，則不會發出進度行。後續的最終工具
結果仍會照常傳送給模型。

支援的介面：

- **Discord**、**Slack**、**Telegram** 和 **Matrix** 預設會在預覽串流啟用時，將工具進度與
  Codex 前言更新串流至即時預覽編輯中。Microsoft Teams 在
  個人聊天中使用其原生進度串流。
- 自 `v2026.4.22` 起，Telegram 已隨附啟用工具進度預覽更新；
  保持啟用可維持該已發布的行為。
- **Mattermost** 在 `partial` 和 `progress` 模式下，會將工具活動整合至單一預覽貼文中；
  在 `block` 模式下，則會在文字區塊之間使用一則工具活動貼文
  （請參閱上文）。
- 工具進度編輯會遵循目前啟用的預覽串流模式；當預覽串流設為 `off`，
  或區塊串流已接管訊息時，便會略過這些編輯。在 Telegram 上，
  `streaming.mode: "off"` 表示僅傳送最終結果：一般進度訊息也會受到抑制，
  而不會作為獨立狀態訊息傳送；核准提示、媒體承載資料和錯誤仍會
  正常路由。
- 若要保留預覽串流但隱藏工具進度行，請將該頻道的
  `streaming.preview.toolProgress` 設為 `false`（預設為
  `true`）。若要保持工具進度行可見，同時隱藏命令／執行文字，
  請將 `streaming.preview.commandText` 設為 `"status"`，或將
  `streaming.progress.commandText` 設為 `"status"`；預設值為 `"raw"`，
  以維持已發布的行為。此原則由使用 OpenClaw 精簡進度轉譯器的
  草稿／進度頻道共用，包括 Discord、Matrix、Microsoft Teams、
  Mattermost、Slack 草稿預覽和 Telegram。若要完全停用預覽編輯，
  請將 `streaming.mode` 設為 `off`。

## 進度草稿轉譯

進度模式草稿（`streaming.progress.*`）具有界限，且可依頻道進行設定：

| 鍵                                | 預設值        | 行為                                                         |
| --------------------------------- | ------------- | ------------------------------------------------------------ |
| `streaming.progress.maxLines`     | `8`           | 草稿標籤下方保留的精簡進度行數上限                           |
| `streaming.progress.maxLineChars` | `120`         | 每個精簡行在截斷前的字元數上限（會考量單字邊界）             |
| `streaming.progress.label`        | `"auto"`      | 草稿標題；可使用自訂字串，或設為 `false` 以隱藏              |
| `streaming.progress.labels`       | 內建集合      | 當 `label: "auto"` 時使用的候選標籤                           |

### 評述進度區

除了工具進度外，精簡進度轉譯器還可在草稿中顯示另一個區域：

- **`streaming.progress.commentary`** - 在進度草稿中，將模型在使用工具前的
  **評述**（簡短的「我會先檢查……然後……」敘述）與工具行交錯轉譯。

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

保持進度行可見，但隱藏原始命令／執行文字：

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

在其他精簡進度頻道鍵下使用相同結構，例如
`channels.discord`、`channels.matrix`、`channels.msteams`、
`channels.mattermost` 或 Slack 草稿預覽。若使用進度草稿模式，請將
相同原則放在 `streaming.progress` 下：

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

## 相關內容

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 共用預覽、編輯、串流和完成處理的目標設計
- [進度草稿](/zh-TW/concepts/progress-drafts) - 在長時間回合期間持續更新的可見工作進度訊息
- [訊息](/zh-TW/concepts/messages) - 訊息生命週期與傳送
- [重試](/zh-TW/concepts/retry) - 傳送失敗時的重試行為
- [頻道](/zh-TW/channels) - 各頻道的串流支援
