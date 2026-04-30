---
read_when:
    - 說明頻道上串流或分塊的運作方式
    - 變更區塊串流或頻道分塊行為
    - 偵錯重複/過早的區塊回覆或頻道預覽串流
summary: 串流 + 分塊行為（區塊回覆、頻道預覽串流、模式對應）
title: 串流與分塊
x-i18n:
    generated_at: "2026-04-30T03:03:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有兩個獨立的串流層：

- **區塊串流（通道）：** 在助理撰寫時送出已完成的**區塊**。這些是一般通道訊息（不是權杖增量）。
- **預覽串流（Telegram/Discord/Slack）：** 生成期間更新臨時的**預覽訊息**。

目前通道訊息**沒有真正的權杖增量串流**。預覽串流以訊息為基礎（傳送 + 編輯/附加）。

## 區塊串流（通道訊息）

區塊串流會在助理輸出可用時，以較粗粒度的片段傳送。

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

圖例：

- `text_delta/events`：模型串流事件（非串流模型可能較稀疏）。
- `chunker`：`EmbeddedBlockChunker` 套用最小/最大界限 + 斷點偏好。
- `channel send`：實際傳出的訊息（區塊回覆）。

**控制項：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（預設關閉）。
- 通道覆寫：`*.blockStreaming`（以及每個帳號的變體），用來對每個通道強制 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（傳送前合併串流區塊）。
- 通道硬性上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 通道切塊模式：`*.chunkMode`（預設 `length`，`newline` 會先依空白行（段落邊界）分割，再依長度切塊）。
- Discord 軟性上限：`channels.discord.maxLinesPerMessage`（預設 17）會分割過高的回覆以避免 UI 裁切。

**邊界語意：**

- `text_end`：一旦切塊器送出就串流區塊；在每個 `text_end` 清空。
- `message_end`：等到助理訊息完成，再清空緩衝的輸出。

如果緩衝文字超過 `maxChars`，`message_end` 仍會使用切塊器，因此它可以在結尾送出多個切塊。

### 搭配區塊串流的媒體遞送

`MEDIA:` 指令是一般遞送中繼資料。當區塊串流提早傳送媒體區塊時，OpenClaw 會記住該回合的遞送。如果最終助理負載重複相同的媒體 URL，最終遞送會移除重複媒體，而不是再次傳送附件。

完全重複的最終負載會被抑制。如果最終負載在已串流的媒體周圍加入不同文字，OpenClaw 仍會傳送新文字，同時維持媒體只遞送一次。這可避免在 Telegram 等通道中出現重複的語音備註或檔案，尤其是 agent 在串流期間送出 `MEDIA:`，而供應商也在完成的回覆中包含它時。

## 切塊演算法（低/高界限）

區塊切塊由 `EmbeddedBlockChunker` 實作：

- **低界限：** 不會在緩衝區 >= `minChars` 前送出（除非強制）。
- **高界限：** 偏好在 `maxChars` 前分割；如果強制，則在 `maxChars` 分割。
- **斷點偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬斷點。
- **程式碼圍欄：** 絕不在圍欄內分割；當在 `maxChars` 強制分割時，會關閉 + 重新開啟圍欄，以保持 Markdown 有效。

`maxChars` 會限制在通道的 `textChunkLimit`，所以你無法超過每個通道的上限。

## 合併（合併串流區塊）

啟用區塊串流時，OpenClaw 可以在傳送前**合併連續的區塊切塊**。這會減少「單行洗版」，同時仍提供漸進式輸出。

- 合併會等待**閒置間隔**（`idleMs`）後再清空。
- 緩衝區受 `maxChars` 限制，超過時會清空。
- `minChars` 會避免小片段在累積足夠文字前送出（最終清空一律傳送剩餘文字）。
- 連接符由 `blockStreamingChunk.breakPreference` 衍生
  （`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → 空格）。
- 可透過 `*.blockStreamingCoalesce` 使用通道覆寫（包含每個帳號的設定）。
- 除非覆寫，Signal/Slack/Discord 的預設合併 `minChars` 會提高到 1500。

## 區塊之間的人性化節奏

啟用區塊串流時，你可以在區塊回覆之間（第一個區塊之後）加入**隨機化暫停**。這會讓多泡泡回應感覺更自然。

- 設定：`agents.defaults.humanDelay`（可透過 `agents.list[].humanDelay` 對每個 agent 覆寫）。
- 模式：`off`（預設）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 只套用於**區塊回覆**，不套用於最終回覆或工具摘要。

##「串流切塊或全部內容」

這對應到：

- **串流切塊：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（邊生成邊送出）。非 Telegram 通道也需要 `*.blockStreaming: true`。
- **在結尾串流全部內容：** `blockStreamingBreak: "message_end"`（清空一次；如果很長，可能是多個切塊）。
- **不使用區塊串流：** `blockStreamingDefault: "off"`（只有最終回覆）。

**通道注意事項：** 除非明確將 `*.blockStreaming` 設為 `true`，否則區塊串流為**關閉**。通道可以串流即時預覽（`channels.<channel>.streaming`），而不使用區塊回覆。

設定位置提醒：`blockStreaming*` 預設值位於 `agents.defaults` 底下，不在根設定。

## 預覽串流模式

標準鍵：`channels.<channel>.streaming`

模式：

- `off`：停用預覽串流。
- `partial`：單一預覽，會被最新文字取代。
- `block`：以切塊/附加步驟更新預覽。
- `progress`：生成期間的進度/狀態預覽，完成時提供最終答案。

### 通道對應

| 通道       | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | ✅    | ✅        | ✅      | 對應到 `partial`    |
| Discord    | ✅    | ✅        | ✅      | 對應到 `partial`    |
| Slack      | ✅    | ✅        | ✅      | ✅                  |
| Mattermost | ✅    | ✅        | ✅      | ✅                  |

僅 Slack：

- 當 `channels.slack.streaming.mode="partial"` 時，`channels.slack.streaming.nativeTransport` 會切換 Slack 原生串流 API 呼叫（預設：`true`）。
- Slack 原生串流和 Slack 助理討論串狀態需要回覆討論串目標；頂層私訊不會顯示該討論串樣式的預覽。

舊版鍵遷移：

- Telegram：舊版 `streamMode` 和純量/布林 `streaming` 值會被 doctor/config 相容性路徑偵測並遷移到 `streaming.mode`。
- Discord：`streamMode` + 布林 `streaming` 會自動遷移到 `streaming` 列舉。
- Slack：`streamMode` 會自動遷移到 `streaming.mode`；布林 `streaming` 會自動遷移到 `streaming.mode` 加上 `streaming.nativeTransport`；舊版 `nativeStreaming` 會自動遷移到 `streaming.nativeTransport`。

### 執行階段行為

Telegram：

- 在私訊與群組/主題中使用 `sendMessage` + `editMessageText` 預覽更新。
- 當預覽已可見約一分鐘時，會傳送新的最終訊息，而不是就地編輯，接著清理預覽，讓 Telegram 的時間戳反映回覆完成時間。
- 明確啟用 Telegram 區塊串流時會略過預覽串流（避免雙重串流）。
- `/reasoning stream` 可以將推理寫入預覽。

Discord：

- 使用傳送 + 編輯預覽訊息。
- `block` 模式使用草稿切塊（`draftChunk`）。
- 明確啟用 Discord 區塊串流時會略過預覽串流。
- 最終媒體、錯誤和明確回覆負載會取消待處理的預覽，而不清空新的草稿，接著使用一般遞送。

Slack：

- `partial` 可在可用時使用 Slack 原生串流（`chat.startStream`/`append`/`stop`）。
- `block` 使用附加樣式的草稿預覽。
- `progress` 使用狀態預覽文字，然後提供最終答案。
- 原生與草稿預覽串流會抑制該回合的區塊回覆，因此 Slack 回覆只會透過一種遞送路徑串流。
- 最終媒體/錯誤負載與進度最終回覆不會建立拋棄式草稿訊息；只有可編輯預覽的文字/區塊最終回覆會清空待處理的草稿文字。

Mattermost：

- 將思考、工具活動和部分回覆文字串流到單一草稿預覽貼文，並在最終答案可安全傳送時就地完成。
- 如果預覽貼文已被刪除或在完成時無法使用，則退回傳送新的最終貼文。
- 最終媒體/錯誤負載會在一般遞送前取消待處理的預覽更新，而不是清空臨時預覽貼文。

Matrix：

- 當最終文字可以重用預覽事件時，草稿預覽會就地完成。
- 純媒體、錯誤和回覆目標不相符的最終回覆，會在一般遞送前取消待處理的預覽更新；已可見的過期預覽會被撤回。

### 工具進度預覽更新

預覽串流也可以包含**工具進度**更新，即像「正在搜尋網頁」、「正在讀取檔案」或「正在呼叫工具」這樣的短狀態行，會在工具執行期間、最終回覆之前顯示在同一則預覽訊息中。這讓多步驟工具回合在第一個思考預覽與最終答案之間保持視覺上的動態，而不是沉默。

支援的介面：

- **Discord**、**Slack**、**Telegram** 和 **Matrix** 在預覽串流啟用時，預設會將工具進度串流到即時預覽編輯中。
- Telegram 自 `v2026.4.22` 起已推出並啟用工具進度預覽更新；保持啟用可保留該已發布行為。
- **Mattermost** 已將工具活動折疊到其單一草稿預覽貼文中（見上文）。
- 工具進度編輯會遵循作用中的預覽串流模式；當預覽串流為 `off`，或區塊串流已接管訊息時，會略過它們。在 Telegram 上，`streaming.mode: "off"` 是僅最終回覆：一般進度閒聊也會被抑制，而不是作為獨立的「Working...」訊息遞送；核准提示、媒體負載和錯誤仍會正常路由。
- 若要保留預覽串流但隱藏工具進度行，請將該通道的 `streaming.preview.toolProgress` 設為 `false`。若要完全停用預覽編輯，請將 `streaming.mode` 設為 `off`。

範例：

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## 相關

- [訊息](/zh-TW/concepts/messages) — 訊息生命週期與遞送
- [重試](/zh-TW/concepts/retry) — 遞送失敗時的重試行為
- [通道](/zh-TW/channels) — 每個通道的串流支援
