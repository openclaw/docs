---
read_when:
    - 說明通道上的串流或分塊處理運作方式
    - 變更區塊串流或頻道分塊行為
    - 偵錯重複/過早的區塊回覆或頻道預覽串流
summary: 串流 + 分塊行為（區塊回覆、頻道預覽串流、模式對應）
title: 串流與分塊
x-i18n:
    generated_at: "2026-05-06T02:47:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b682b3148ae0fa453aa48054115d16cb28f18bc30037b48c68779f27f5e390d
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有兩個獨立的串流層：

- **區塊串流（頻道）：** 在助理寫入時送出已完成的 **區塊**。這些是一般頻道訊息（不是權杖增量）。
- **預覽串流（Telegram/Discord/Slack）：** 在生成期間更新暫時的 **預覽訊息**。

目前頻道訊息沒有 **真正的權杖增量串流**。預覽串流是以訊息為基礎（傳送 + 編輯/附加）。

## 區塊串流（頻道訊息）

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

- `text_delta/events`：模型串流事件（對非串流模型可能較稀疏）。
- `chunker`：`EmbeddedBlockChunker` 套用最小/最大界限 + 中斷偏好。
- `channel send`：實際傳出的訊息（區塊回覆）。

**控制項：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（預設關閉）。
- 頻道覆寫：`*.blockStreaming`（以及每帳號變體）可針對每個頻道強制 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（傳送前合併串流區塊）。
- 頻道硬性上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 頻道分塊模式：`*.chunkMode`（預設 `length`，`newline` 會先依空白行（段落邊界）分割，再依長度分塊）。
- Discord 軟性上限：`channels.discord.maxLinesPerMessage`（預設 17）會分割過高的回覆以避免 UI 裁切。

**邊界語意：**

- `text_end`：只要分塊器送出就串流區塊；在每個 `text_end` 清空。
- `message_end`：等到助理訊息完成後，再清空緩衝輸出。

如果緩衝文字超過 `maxChars`，`message_end` 仍會使用分塊器，因此可能在結尾送出多個分塊。

### 搭配區塊串流的媒體傳遞

`MEDIA:` 指令是一般傳遞中繼資料。當區塊串流提早傳送媒體區塊時，OpenClaw 會記住該回合的這次傳遞。如果最終助理承載內容重複相同媒體 URL，最終傳遞會移除重複媒體，而不是再次傳送附件。

完全重複的最終承載內容會被抑制。如果最終承載內容在已串流的媒體周圍加入不同文字，OpenClaw 仍會傳送新文字，同時維持媒體只傳遞一次。這可避免在 Telegram 等頻道中，agent 在串流期間送出 `MEDIA:` 且 provider 也在完成回覆中包含它時，產生重複語音訊息或檔案。

## 分塊演算法（低/高界限）

區塊分塊由 `EmbeddedBlockChunker` 實作：

- **低界限：** 緩衝區達到 `minChars` 前不要送出（除非強制）。
- **高界限：** 偏好在 `maxChars` 之前分割；若被強制，則在 `maxChars` 分割。
- **中斷偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬性中斷。
- **程式碼圍欄：** 永遠不要在圍欄內分割；在 `maxChars` 強制分割時，會關閉 + 重新開啟圍欄，以保持 Markdown 有效。

`maxChars` 會被限制到頻道的 `textChunkLimit`，因此不能超過每個頻道的上限。

## 合併（合併串流區塊）

啟用區塊串流時，OpenClaw 可以在傳送前 **合併連續的區塊分塊**。這可減少「單行洗版」，同時仍提供漸進式輸出。

- 合併會等待 **閒置間隔**（`idleMs`）後再清空。
- 緩衝區受 `maxChars` 限制，超過時會清空。
- `minChars` 會避免太小的片段在累積足夠文字前送出（最終清空一定會送出剩餘文字）。
- 連接符號衍生自 `blockStreamingChunk.breakPreference`
  （`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → 空格）。
- 可透過 `*.blockStreamingCoalesce` 使用頻道覆寫（包含每帳號設定）。
- 除非覆寫，Signal/Slack/Discord 的預設合併 `minChars` 會提高到 1500。

## 區塊之間的人性化節奏

啟用區塊串流時，你可以在區塊回覆之間（第一個區塊之後）加入 **隨機暫停**。這讓多泡泡回應感覺更自然。

- 設定：`agents.defaults.humanDelay`（可透過 `agents.list[].humanDelay` 依 agent 覆寫）。
- 模式：`off`（預設）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 僅套用於 **區塊回覆**，不套用於最終回覆或工具摘要。

##「串流分塊或全部內容」

這會對應到：

- **串流分塊：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（邊產生邊送出）。非 Telegram 頻道也需要 `*.blockStreaming: true`。
- **在結尾串流全部內容：** `blockStreamingBreak: "message_end"`（一次清空；若非常長，可能是多個分塊）。
- **沒有區塊串流：** `blockStreamingDefault: "off"`（只有最終回覆）。

**頻道注意事項：** 除非明確將 `*.blockStreaming` 設為 `true`，否則區塊串流是 **關閉** 的。頻道可以串流即時預覽（`channels.<channel>.streaming`），而不使用區塊回覆。

設定位置提醒：`blockStreaming*` 預設值位於 `agents.defaults` 底下，不在根設定。

## 預覽串流模式

標準鍵：`channels.<channel>.streaming`

模式：

- `off`：停用預覽串流。
- `partial`：單一預覽，會被最新文字取代。
- `block`：預覽以分塊/附加步驟更新。
- `progress`：生成期間顯示進度/狀態預覽，完成時顯示最終答案。

`streaming.mode: "block"` 是適用於 Discord 和 Telegram 等可編輯頻道的預覽串流模式。它不會在那裡啟用頻道區塊傳遞。當你需要一般區塊回覆時，請使用 `streaming.block.enabled` 或舊版 `blockStreaming` 頻道鍵。Microsoft Teams 是例外：它沒有草稿預覽區塊傳輸，因此 `streaming.mode: "block"` 會對應到 Teams 區塊傳遞，而不是原生 partial/progress 串流。

### 頻道對應

| 頻道       | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | 可編輯進度草稿 |
| Discord    | ✅    | ✅        | ✅      | 可編輯進度草稿 |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | 原生進度串流  |

僅 Slack：

- 當 `channels.slack.streaming.mode="partial"` 時，`channels.slack.streaming.nativeTransport` 會切換 Slack 原生串流 API 呼叫（預設：`true`）。
- Slack 原生串流和 Slack 助理執行緒狀態需要回覆執行緒目標。頂層 DM 不會顯示該執行緒樣式預覽，但仍可使用 Slack 草稿預覽貼文和編輯。

舊版鍵遷移：

- Telegram：舊版 `streamMode` 和純量/布林 `streaming` 值會由 doctor/config 相容性路徑偵測並遷移到 `streaming.mode`。
- Discord：`streamMode` + 布林 `streaming` 會自動遷移到 `streaming` enum。
- Slack：`streamMode` 會自動遷移到 `streaming.mode`；布林 `streaming` 會自動遷移到 `streaming.mode` 加上 `streaming.nativeTransport`；舊版 `nativeStreaming` 會自動遷移到 `streaming.nativeTransport`。

### 執行階段行為

Telegram：

- 在 DM 和群組/主題中使用 `sendMessage` + `editMessageText` 預覽更新。
- 當預覽已可見約一分鐘時，會傳送新的最終訊息，而不是就地編輯，接著清理預覽，讓 Telegram 的時間戳反映回覆完成時間。
- 明確啟用 Telegram 區塊串流時，會略過預覽串流（避免雙重串流）。
- `/reasoning stream` 可以將推理寫入暫時預覽，並在最終傳遞後刪除。

Discord：

- 使用傳送 + 編輯預覽訊息。
- `block` 模式使用草稿分塊（`draftChunk`）。
- 明確啟用 Discord 區塊串流時，會略過預覽串流。
- 最終媒體、錯誤和明確回覆承載內容會取消待處理預覽，而不清空新的草稿，接著使用一般傳遞。

Slack：

- 可用時，`partial` 可以使用 Slack 原生串流（`chat.startStream`/`append`/`stop`）。
- `block` 使用附加樣式的草稿預覽。
- `progress` 使用狀態預覽文字，接著顯示最終答案。
- 沒有回覆執行緒的頂層 DM 會使用草稿預覽貼文和編輯，而不是 Slack 原生串流。
- 原生和草稿預覽串流會抑制該回合的區塊回覆，因此 Slack 回覆只會由一條傳遞路徑串流。
- 最終媒體/錯誤承載內容和進度最終內容不會建立一次性草稿訊息；只有能編輯預覽的文字/區塊最終內容會清空待處理草稿文字。

Mattermost：

- 將思考、工具活動和部分回覆文字串流到單一草稿預覽貼文，當最終答案可安全傳送時就地完成。
- 如果預覽貼文已被刪除或在完成時不可用，則退回為傳送新的最終貼文。
- 最終媒體/錯誤承載內容會在一般傳遞前取消待處理預覽更新，而不是清空暫時預覽貼文。

Matrix：

- 當最終文字可以重用預覽事件時，草稿預覽會就地完成。
- 僅媒體、錯誤和回覆目標不符的最終內容會在一般傳遞前取消待處理預覽更新；已可見的過時預覽會被撤回。

### 工具進度預覽更新

預覽串流也可以包含 **工具進度** 更新，也就是像「正在搜尋網頁」、「正在讀取檔案」或「正在呼叫工具」這類短狀態列，會在工具執行期間出現在同一則預覽訊息中，早於最終回覆。這能讓多步驟工具回合在第一個思考預覽和最終答案之間保持視覺上的動態，而不是一片沉默。

支援的介面：

- 預覽串流啟用時，**Discord**、**Slack**、**Telegram** 和 **Matrix** 預設會將工具進度串流到即時預覽編輯中。Microsoft Teams 會在個人聊天中使用其原生進度串流。
- Telegram 自 `v2026.4.22` 起已啟用工具進度預覽更新；保持啟用可保留該已發布行為。
- **Mattermost** 已經將工具活動折疊進其單一草稿預覽貼文（見上方）。
- 工具進度編輯會遵循作用中的預覽串流模式；當預覽串流為 `off`，或區塊串流已接管訊息時，會略過這些編輯。在 Telegram 上，`streaming.mode: "off"` 是僅最終內容：一般進度閒聊也會被抑制，而不是作為獨立狀態訊息傳遞，但核准提示、媒體承載內容和錯誤仍會正常路由。
- 若要保留預覽串流但隱藏工具進度列，請將該頻道的 `streaming.preview.toolProgress` 設為 `false`。若要在隱藏命令/執行文字的同時保持工具進度列可見，請將 `streaming.preview.commandText` 設為 `"status"`，或將 `streaming.progress.commandText` 設為 `"status"`；預設為 `"raw"`，以保留已發布行為。這項政策由使用 OpenClaw 精簡進度呈現器的草稿/進度頻道共用，包括 Discord、Matrix、Microsoft Teams、Mattermost、Slack 草稿預覽和 Telegram。若要完全停用預覽編輯，請將 `streaming.mode` 設為 `off`。
- Telegram 選取引用回覆是例外：當 `replyToMode` 不是 `"off"` 且存在選取的引用文字時，OpenClaw 會略過該回合的答案預覽串流，因此工具進度預覽列無法呈現。沒有選取引用文字的目前訊息回覆仍會保留預覽串流。詳細資訊請參閱 [Telegram 頻道文件](/zh-TW/channels/telegram)。

保持進度行可見，但隱藏原始命令/執行文字：

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

在另一個精簡進度頻道鍵下使用相同結構，例如 `channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost`，或 Slack 草稿預覽。對於進度草稿模式，將相同政策放在 `streaming.progress` 下：

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

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 以共享預覽、編輯、串流和完成設計為目標
- [進度草稿](/zh-TW/concepts/progress-drafts) — 在長回合期間更新的可見進行中訊息
- [訊息](/zh-TW/concepts/messages) — 訊息生命週期與傳遞
- [重試](/zh-TW/concepts/retry) — 傳遞失敗時的重試行為
- [頻道](/zh-TW/channels) — 各頻道的串流支援
