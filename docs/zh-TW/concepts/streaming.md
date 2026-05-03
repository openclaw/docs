---
read_when:
    - 說明串流或分塊在通道上的運作方式
    - 變更區塊串流或頻道分塊行為
    - 偵錯重複/過早的區塊回覆或通道預覽串流
summary: 串流與分塊行為（區塊回覆、頻道預覽串流、模式對應）
title: 串流與分塊
x-i18n:
    generated_at: "2026-05-03T21:31:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有兩個獨立的串流層：

- **區塊串流（頻道）：** 在助理寫入時發出完成的 **區塊**。這些是一般頻道訊息（不是 token delta）。
- **預覽串流（Telegram/Discord/Slack）：** 產生期間更新暫時的 **預覽訊息**。

目前沒有對頻道訊息的 **真正 token-delta 串流**。預覽串流是以訊息為基礎（傳送 + 編輯/附加）。

## 區塊串流（頻道訊息）

區塊串流會在助理輸出可用時，以較粗的分段傳送。

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

- `text_delta/events`：模型串流事件（非串流模型可能很稀疏）。
- `chunker`：`EmbeddedBlockChunker` 會套用最小/最大界限 + 斷點偏好。
- `channel send`：實際對外訊息（區塊回覆）。

**控制項：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（預設 off）。
- 頻道覆寫：`*.blockStreaming`（以及個別帳號變體）可針對每個頻道強制 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（傳送前合併已串流的區塊）。
- 頻道硬性上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 頻道分段模式：`*.chunkMode`（預設 `length`，`newline` 會先依空白行（段落邊界）切分，再依長度分段）。
- Discord 軟性上限：`channels.discord.maxLinesPerMessage`（預設 17）會切分過高的回覆，以避免 UI 裁切。

**邊界語意：**

- `text_end`：chunker 一發出就串流區塊；每次 `text_end` 都 flush。
- `message_end`：等到助理訊息完成後，再 flush 緩衝輸出。

如果緩衝文字超過 `maxChars`，`message_end` 仍會使用 chunker，因此最後可能發出多個分段。

### 搭配區塊串流的媒體傳遞

`MEDIA:` 指令是一般傳遞中繼資料。當區塊串流提早傳送媒體區塊時，OpenClaw 會記住該回合已傳遞過。如果最後的助理 payload 重複相同媒體 URL，最終傳遞會移除重複媒體，而不是再次傳送附件。

完全重複的最終 payload 會被抑制。如果最終 payload 在已串流的媒體周圍加入不同文字，OpenClaw 仍會傳送新文字，同時維持媒體只傳遞一次。這可避免在 Telegram 等頻道上，當 agent 在串流期間發出 `MEDIA:` 且 provider 也在完成回覆中包含它時，出現重複語音訊息或檔案。

## 分段演算法（低/高界限）

區塊分段由 `EmbeddedBlockChunker` 實作：

- **低界限：** 在 buffer >= `minChars` 之前不要發出（除非被強制）。
- **高界限：** 偏好在 `maxChars` 前切分；若被強制，則在 `maxChars` 切分。
- **斷點偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬斷點。
- **程式碼圍欄：** 絕不在圍欄內切分；當被強制在 `maxChars` 切分時，會關閉 + 重新開啟圍欄，以維持 Markdown 有效。

`maxChars` 會被限制在頻道 `textChunkLimit` 以內，因此你無法超過各頻道上限。

## 合併（合併已串流區塊）

啟用區塊串流時，OpenClaw 可以在送出前 **合併連續的區塊分段**。這會減少「單行洗版」，同時仍提供漸進式輸出。

- 合併會等待 **閒置間隔**（`idleMs`）後再 flush。
- Buffer 受 `maxChars` 限制，若超過就會 flush。
- `minChars` 會避免太小的片段在累積足夠文字前送出（最終 flush 一律會送出剩餘文字）。
- 連接字元會由 `blockStreamingChunk.breakPreference` 推導
  （`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → 空格）。
- 可透過 `*.blockStreamingCoalesce` 使用頻道覆寫（包含個別帳號設定）。
- 除非覆寫，Signal/Slack/Discord 的預設合併 `minChars` 會提高到 1500。

## 區塊之間的類真人節奏

啟用區塊串流時，你可以在區塊回覆之間（第一個區塊之後）加入 **隨機暫停**。這會讓多氣泡回應感覺更自然。

- 設定：`agents.defaults.humanDelay`（可透過 `agents.list[].humanDelay` 逐 agent 覆寫）。
- 模式：`off`（預設）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 只套用到 **區塊回覆**，不套用到最終回覆或工具摘要。

##「串流分段或全部內容」

這會對應到：

- **串流分段：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（邊產生邊發出）。非 Telegram 頻道也需要 `*.blockStreaming: true`。
- **最後串流全部內容：** `blockStreamingBreak: "message_end"`（一次 flush；若非常長，可能有多個分段）。
- **不使用區塊串流：** `blockStreamingDefault: "off"`（只有最終回覆）。

**頻道注意事項：** 除非明確將 `*.blockStreaming` 設為 `true`，否則區塊串流為 **off**。頻道可以串流即時預覽（`channels.<channel>.streaming`），而不使用區塊回覆。

設定位置提醒：`blockStreaming*` 預設值位於 `agents.defaults` 下，不在根設定。

## 預覽串流模式

標準鍵：`channels.<channel>.streaming`

模式：

- `off`：停用預覽串流。
- `partial`：單一預覽，會被最新文字取代。
- `block`：以分段/附加步驟更新預覽。
- `progress`：產生期間顯示進度/狀態預覽，完成時顯示最終答案。

`streaming.mode: "block"` 是適用於 Discord 和 Telegram 等可編輯頻道的預覽串流模式。它不會在那些頻道啟用頻道區塊傳遞。當你想要一般區塊回覆時，請使用 `streaming.block.enabled` 或舊版 `blockStreaming` 頻道鍵。Microsoft Teams 是例外：它沒有草稿預覽區塊傳輸，因此 `streaming.mode: "block"` 會對應到 Teams 區塊傳遞，而不是原生 partial/progress 串流。

### 頻道對應

| 頻道       | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | 可編輯進度草稿    |
| Discord    | ✅    | ✅        | ✅      | 可編輯進度草稿    |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |
| MS Teams   | ✅    | ✅        | ✅      | 原生進度串流      |

僅限 Slack：

- `channels.slack.streaming.nativeTransport` 會在 `channels.slack.streaming.mode="partial"` 時切換 Slack 原生串流 API 呼叫（預設：`true`）。
- Slack 原生串流和 Slack 助理執行緒狀態需要回覆執行緒目標。頂層 DM 不會顯示那種執行緒式預覽，但仍可使用 Slack 草稿預覽貼文與編輯。

舊版鍵遷移：

- Telegram：doctor/config 相容性路徑會偵測舊版 `streamMode` 和純量/布林 `streaming` 值，並遷移到 `streaming.mode`。
- Discord：`streamMode` + 布林 `streaming` 會自動遷移到 `streaming` enum。
- Slack：`streamMode` 會自動遷移到 `streaming.mode`；布林 `streaming` 會自動遷移到 `streaming.mode` 加 `streaming.nativeTransport`；舊版 `nativeStreaming` 會自動遷移到 `streaming.nativeTransport`。

### 執行階段行為

Telegram：

- 在 DM 和群組/topics 中使用 `sendMessage` + `editMessageText` 預覽更新。
- 當預覽已顯示約一分鐘時，會傳送新的最終訊息，而不是就地編輯，然後清理預覽，讓 Telegram 的時間戳反映回覆完成時間。
- 當 Telegram 區塊串流明確啟用時，會略過預覽串流（避免雙重串流）。
- `/reasoning stream` 可以將 reasoning 寫入預覽。

Discord：

- 使用傳送 + 編輯預覽訊息。
- `block` 模式使用草稿分段（`draftChunk`）。
- 當 Discord 區塊串流明確啟用時，會略過預覽串流。
- 最終媒體、錯誤和明確回覆 payload 會取消待處理預覽而不 flush 新草稿，然後使用一般傳遞。

Slack：

- `partial` 可在可用時使用 Slack 原生串流（`chat.startStream`/`append`/`stop`）。
- `block` 使用附加式草稿預覽。
- `progress` 使用狀態預覽文字，然後顯示最終答案。
- 沒有回覆執行緒的頂層 DM 會使用草稿預覽貼文和編輯，而不是 Slack 原生串流。
- 原生與草稿預覽串流會抑制該回合的區塊回覆，因此 Slack 回覆只會由一條傳遞路徑串流。
- 最終媒體/錯誤 payload 和進度最終訊息不會建立一次性草稿訊息；只有能編輯預覽的文字/區塊最終訊息才會 flush 待處理草稿文字。

Mattermost：

- 將思考、工具活動和部分回覆文字串流到單一草稿預覽貼文中，並在最終答案可安全傳送時就地完成。
- 如果預覽貼文已被刪除，或在完成時無法使用，則退回傳送新的最終貼文。
- 最終媒體/錯誤 payload 會在一般傳遞前取消待處理預覽更新，而不是 flush 暫時預覽貼文。

Matrix：

- 當最終文字可以重用預覽事件時，草稿預覽會就地完成。
- 僅媒體、錯誤和回覆目標不符的最終訊息會在一般傳遞前取消待處理預覽更新；已可見的過期預覽會被 redact。

### 工具進度預覽更新

預覽串流也可以包含 **工具進度** 更新，也就是像「正在搜尋網頁」、「正在讀取檔案」或「正在呼叫工具」這樣的短狀態行，會在工具執行時顯示在同一則預覽訊息中，早於最終回覆。這讓多步驟工具回合在第一個思考預覽與最終答案之間仍保持視覺上的活動狀態，而不是靜默無聲。

支援介面：

- **Discord**、**Slack**、**Telegram** 和 **Matrix** 預設會在預覽串流啟用時，將工具進度串流到即時預覽編輯中。Microsoft Teams 在個人聊天中使用其原生進度串流。
- Telegram 自 `v2026.4.22` 起已隨附啟用工具進度預覽更新；保持啟用可保留已發布行為。
- **Mattermost** 已將工具活動折疊進其單一草稿預覽貼文（見上文）。
- 工具進度編輯會遵循作用中的預覽串流模式；當預覽串流為 `off`，或區塊串流已接管訊息時，會略過。 在 Telegram 上，`streaming.mode: "off"` 是僅最終訊息：一般進度閒聊也會被抑制，而不是以獨立狀態訊息傳遞；核准提示、媒體 payload 和錯誤仍會正常路由。
- 若要保留預覽串流但隱藏工具進度行，請將該頻道的 `streaming.preview.toolProgress` 設為 `false`。若要完全停用預覽編輯，請將 `streaming.mode` 設為 `off`。
- Telegram 選取引用回覆是例外：當 `replyToMode` 不是 `"off"` 且存在選取引用文字時，OpenClaw 會略過該回合的答案預覽串流，因此工具進度預覽行無法呈現。沒有選取引用文字的目前訊息回覆仍會保留預覽串流。詳情請參閱 [Telegram 頻道文件](/zh-TW/channels/telegram)。

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

- [進度草稿](/zh-TW/concepts/progress-drafts) — 在長回合期間更新的可見進行中訊息
- [訊息](/zh-TW/concepts/messages) — 訊息生命週期與傳遞
- [重試](/zh-TW/concepts/retry) — 傳遞失敗時的重試行為
- [頻道](/zh-TW/channels) — 各頻道串流支援
