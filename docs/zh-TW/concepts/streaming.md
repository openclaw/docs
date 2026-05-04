---
read_when:
    - 說明串流或分塊在通道上的運作方式
    - 變更區塊串流或頻道分塊行為
    - 偵錯重複／過早的區塊回覆或頻道預覽串流
summary: 串流 + 分塊行為（區塊回覆、頻道預覽串流、模式對應）
title: 串流與分塊
x-i18n:
    generated_at: "2026-05-04T07:04:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有兩個分開的串流層：

- **區塊串流（頻道）：**在助理撰寫時發出已完成的**區塊**。這些是一般頻道訊息（不是 token delta）。
- **預覽串流（Telegram/Discord/Slack）：**在生成期間更新暫時的**預覽訊息**。

目前頻道訊息**沒有真正的 token-delta 串流**。預覽串流是以訊息為基礎（傳送 + 編輯/附加）。

## 區塊串流（頻道訊息）

區塊串流會在助理輸出可用時，以較粗粒度的區塊傳送。

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
- `chunker`：`EmbeddedBlockChunker`，套用最小/最大界限 + 中斷偏好。
- `channel send`：實際送出的訊息（區塊回覆）。

**控制項：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（預設關閉）。
- 頻道覆寫：`*.blockStreaming`（以及個別帳號變體），可針對每個頻道強制 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（傳送前合併已串流區塊）。
- 頻道硬性上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 頻道分塊模式：`*.chunkMode`（預設 `length`，`newline` 會先依空白行（段落邊界）分割，再依長度分塊）。
- Discord 軟性上限：`channels.discord.maxLinesPerMessage`（預設 17），會分割過高的回覆以避免 UI 裁切。

**邊界語意：**

- `text_end`：只要分塊器發出就串流區塊；在每個 `text_end` 清空。
- `message_end`：等到助理訊息完成後，再清空緩衝輸出。

如果緩衝文字超過 `maxChars`，`message_end` 仍會使用分塊器，因此可能在結尾發出多個分塊。

### 以區塊串流傳送媒體

`MEDIA:` 指令是一般傳送中繼資料。當區塊串流提前傳送媒體區塊時，OpenClaw 會記住該回合的傳送。如果最終助理承載重複相同媒體 URL，最終傳送會移除重複媒體，而不是再次傳送附件。

完全重複的最終承載會被抑制。如果最終承載在已串流的媒體周圍加入不同文字，OpenClaw 仍會傳送新文字，同時維持媒體只傳送一次。這可防止在 Telegram 等頻道上出現重複語音備註或檔案，當 agent 在串流期間發出 `MEDIA:`，而提供者也在完成回覆中包含它時尤其如此。

## 分塊演算法（低/高界限）

區塊分塊由 `EmbeddedBlockChunker` 實作：

- **低界限：**除非強制，否則在緩衝區 >= `minChars` 前不發出。
- **高界限：**偏好在 `maxChars` 前分割；若強制，則在 `maxChars` 分割。
- **中斷偏好：**`paragraph` → `newline` → `sentence` → `whitespace` → 硬性中斷。
- **程式碼圍欄：**絕不在圍欄內分割；當在 `maxChars` 強制分割時，會關閉並重新開啟圍欄，以保持 Markdown 有效。

`maxChars` 會被限制在頻道的 `textChunkLimit` 內，因此無法超過每個頻道的上限。

## 合併（合併已串流區塊）

啟用區塊串流時，OpenClaw 可以在送出前**合併連續的區塊分塊**。這會減少「單行洗版」，同時仍提供漸進式輸出。

- 合併會等待**閒置間隔**（`idleMs`）後再清空。
- 緩衝區受 `maxChars` 限制，超過時會清空。
- `minChars` 會防止細小片段在累積足夠文字前送出（最終清空一律會送出剩餘文字）。
- 連接字串會從 `blockStreamingChunk.breakPreference` 推導而來（`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → 空格）。
- 可透過 `*.blockStreamingCoalesce` 使用頻道覆寫（包含個別帳號設定）。
- 除非覆寫，Signal/Slack/Discord 的預設合併 `minChars` 會提高到 1500。

## 區塊之間的擬人節奏

啟用區塊串流時，你可以在區塊回覆之間（第一個區塊之後）加入**隨機化暫停**。這會讓多泡泡回應感覺更自然。

- 設定：`agents.defaults.humanDelay`（可透過 `agents.list[].humanDelay` 針對每個 agent 覆寫）。
- 模式：`off`（預設）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 只套用到**區塊回覆**，不套用到最終回覆或工具摘要。

##「串流分塊或全部內容」

這會對應到：

- **串流分塊：**`blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（邊生成邊發出）。非 Telegram 頻道也需要 `*.blockStreaming: true`。
- **在結尾串流全部內容：**`blockStreamingBreak: "message_end"`（清空一次；若很長，可能是多個分塊）。
- **無區塊串流：**`blockStreamingDefault: "off"`（只有最終回覆）。

**頻道備註：**除非明確將 `*.blockStreaming` 設為 `true`，否則區塊串流**關閉**。頻道可以在沒有區塊回覆的情況下串流即時預覽（`channels.<channel>.streaming`）。

設定位置提醒：`blockStreaming*` 預設值位於 `agents.defaults` 底下，而不是根設定。

## 預覽串流模式

標準鍵：`channels.<channel>.streaming`

模式：

- `off`：停用預覽串流。
- `partial`：單一預覽，會以最新文字取代。
- `block`：預覽以分塊/附加步驟更新。
- `progress`：生成期間顯示進度/狀態預覽，完成時顯示最終答案。

`streaming.mode: "block"` 是適用於 Discord 和 Telegram 等可編輯頻道的預覽串流模式。它不會在那些頻道啟用頻道區塊傳送。若要一般區塊回覆，請使用 `streaming.block.enabled` 或舊版 `blockStreaming` 頻道鍵。Microsoft Teams 是例外：它沒有草稿預覽區塊傳輸，因此 `streaming.mode: "block"` 會對應到 Teams 區塊傳送，而不是原生 partial/progress 串流。

### 頻道對應

| 頻道       | `off` | `partial` | `block` | `progress`       |
| ---------- | ----- | --------- | ------- | ---------------- |
| Telegram   | ✅    | ✅        | ✅      | 可編輯進度草稿   |
| Discord    | ✅    | ✅        | ✅      | 可編輯進度草稿   |
| Slack      | ✅    | ✅        | ✅      | ✅               |
| Mattermost | ✅    | ✅        | ✅      | ✅               |
| MS Teams   | ✅    | ✅        | ✅      | 原生進度串流     |

僅 Slack：

- 當 `channels.slack.streaming.mode="partial"` 時，`channels.slack.streaming.nativeTransport` 會切換 Slack 原生串流 API 呼叫（預設：`true`）。
- Slack 原生串流和 Slack 助理執行緒狀態需要回覆執行緒目標。頂層私訊不會顯示該執行緒樣式預覽，但仍可使用 Slack 草稿預覽貼文與編輯。

舊版鍵遷移：

- Telegram：舊版 `streamMode` 和純量/布林 `streaming` 值會由 doctor/config 相容性路徑偵測並遷移到 `streaming.mode`。
- Discord：`streamMode` + 布林 `streaming` 會自動遷移到 `streaming` 列舉。
- Slack：`streamMode` 會自動遷移到 `streaming.mode`；布林 `streaming` 會自動遷移到 `streaming.mode` 加上 `streaming.nativeTransport`；舊版 `nativeStreaming` 會自動遷移到 `streaming.nativeTransport`。

### 執行階段行為

Telegram：

- 使用 `sendMessage` + `editMessageText`，在私訊和群組/主題中更新預覽。
- 當預覽已可見約一分鐘時，會傳送新的最終訊息，而不是就地編輯，然後清理預覽，讓 Telegram 的時間戳反映回覆完成時間。
- 明確啟用 Telegram 區塊串流時會略過預覽串流（以避免雙重串流）。
- `/reasoning stream` 可以將推理寫入暫時預覽，並在最終傳送後刪除。

Discord：

- 使用傳送 + 編輯預覽訊息。
- `block` 模式使用草稿分塊（`draftChunk`）。
- 明確啟用 Discord 區塊串流時會略過預覽串流。
- 最終媒體、錯誤和明確回覆承載會取消擱置的預覽，而不清空新的草稿，然後使用一般傳送。

Slack：

- 可用時，`partial` 可以使用 Slack 原生串流（`chat.startStream`/`append`/`stop`）。
- `block` 使用附加樣式草稿預覽。
- `progress` 使用狀態預覽文字，然後顯示最終答案。
- 沒有回覆執行緒的頂層私訊會使用草稿預覽貼文與編輯，而不是 Slack 原生串流。
- 原生和草稿預覽串流會抑制該回合的區塊回覆，因此 Slack 回覆只會由一條傳送路徑串流。
- 最終媒體/錯誤承載和進度最終內容不會建立一次性草稿訊息；只有能編輯預覽的文字/區塊最終內容會清空擱置的草稿文字。

Mattermost：

- 將思考、工具活動和部分回覆文字串流到單一草稿預覽貼文中，並在最終答案可安全傳送時就地完成。
- 如果預覽貼文已被刪除，或在完成時因其他原因不可用，則退回傳送新的最終貼文。
- 最終媒體/錯誤承載會在一般傳送前取消擱置的預覽更新，而不是清空暫時預覽貼文。

Matrix：

- 當最終文字可重用預覽事件時，草稿預覽會就地完成。
- 僅媒體、錯誤和回覆目標不符的最終內容會在一般傳送前取消擱置的預覽更新；已可見的過時預覽會被撤回。

### 工具進度預覽更新

預覽串流也可以包含**工具進度**更新，也就是像「正在搜尋網頁」、「正在讀取檔案」或「正在呼叫工具」這類短狀態列；這些會在工具執行時顯示於同一則預覽訊息中，早於最終回覆。這能讓多步驟工具回合在第一個思考預覽和最終答案之間保持視覺上的動態，而不是靜默等待。

支援的介面：

- 當預覽串流啟用時，**Discord**、**Slack**、**Telegram** 和 **Matrix** 預設會將工具進度串流到即時預覽編輯中。Microsoft Teams 在個人聊天中使用其原生進度串流。
- Telegram 自 `v2026.4.22` 起已隨工具進度預覽更新啟用而發布；保持啟用可維持該已發布行為。
- **Mattermost** 已將工具活動整合到其單一草稿預覽貼文中（見上文）。
- 工具進度編輯會遵循作用中的預覽串流模式；當預覽串流為 `off`，或區塊串流已接管訊息時會略過。在 Telegram 上，`streaming.mode: "off"` 是僅最終內容：一般進度閒聊也會被抑制，而不是以獨立狀態訊息傳送；同時核准提示、媒體承載和錯誤仍會正常路由。
- 若要保留預覽串流但隱藏工具進度列，請將該頻道的 `streaming.preview.toolProgress` 設為 `false`。若要在隱藏命令/執行文字的同時保持工具進度列可見，請將 `streaming.preview.commandText` 設為 `"status"`，或將 `streaming.progress.commandText` 設為 `"status"`；預設值是 `"raw"`，以保留已發布行為。此政策由使用 OpenClaw 精簡進度渲染器的草稿/進度頻道共用，包括 Discord、Matrix、Microsoft Teams、Mattermost、Slack 草稿預覽和 Telegram。若要完全停用預覽編輯，請將 `streaming.mode` 設為 `off`。
- Telegram 選取引用回覆是例外：當 `replyToMode` 不是 `"off"` 且存在選取的引用文字時，OpenClaw 會略過該回合的答案預覽串流，因此工具進度預覽列無法渲染。沒有選取引用文字的目前訊息回覆仍會保留預覽串流。詳情請參閱 [Telegram 頻道文件](/zh-TW/channels/telegram)。

讓進度行保持可見，但隱藏原始 command/exec 文字：

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

在另一個精簡進度頻道鍵下使用相同結構，例如 `channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost`，或 Slack 草稿預覽。對於進度草稿模式，請將相同政策放在 `streaming.progress` 下：

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

- [進度草稿](/zh-TW/concepts/progress-drafts) — 在長回合期間更新的可見進行中訊息
- [訊息](/zh-TW/concepts/messages) — 訊息生命週期與傳送
- [重試](/zh-TW/concepts/retry) — 傳送失敗時的重試行為
- [頻道](/zh-TW/channels) — 各頻道的串流支援
