---
read_when:
    - 說明串流或分塊在頻道上的運作方式
    - 變更區塊串流或通道分塊行為
    - 偵錯重複／過早的區塊回覆或頻道預覽串流
summary: 串流 + 分塊行為（區塊回覆、頻道預覽串流、模式對應）
title: 串流與分塊
x-i18n:
    generated_at: "2026-05-06T09:08:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有兩個分開的串流層：

- **區塊串流（頻道）：**在助理撰寫時發出已完成的**區塊**。這些是一般頻道訊息（不是 token delta）。
- **預覽串流（Telegram/Discord/Slack）：**在生成期間更新臨時的**預覽訊息**。

目前頻道訊息**沒有真正的 token-delta 串流**。預覽串流是以訊息為基礎（傳送 + 編輯/附加）。

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
- `chunker`：套用最小/最大界限 + 中斷偏好的 `EmbeddedBlockChunker`。
- `channel send`：實際送出的訊息（區塊回覆）。

**控制項：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（預設關閉）。
- 頻道覆寫：`*.blockStreaming`（以及個別帳號變體），用於針對每個頻道強制 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（傳送前合併已串流的區塊）。
- 頻道硬性上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 頻道分塊模式：`*.chunkMode`（預設為 `length`，`newline` 會先依空白行（段落邊界）切分，再依長度分塊）。
- Discord 軟性上限：`channels.discord.maxLinesPerMessage`（預設 17）會切分過高的回覆，以避免 UI 裁切。

**邊界語意：**

- `text_end`：chunker 一發出就串流區塊；在每個 `text_end` 清空。
- `message_end`：等到助理訊息完成後，再清空緩衝輸出。

如果緩衝文字超過 `maxChars`，`message_end` 仍會使用 chunker，因此可能在結尾發出多個分塊。

### 搭配區塊串流傳送媒體

`MEDIA:` 指令是一般傳送中繼資料。當區塊串流提前傳送媒體區塊時，OpenClaw 會記住該回合的這次傳送。如果最終助理 payload 重複相同的媒體 URL，最終傳送會移除重複媒體，而不是再次傳送附件。

完全重複的最終 payload 會被抑制。如果最終 payload 在已串流的媒體周圍加入不同文字，OpenClaw 仍會傳送新文字，同時保持媒體只傳送一次。這可避免 Telegram 等頻道上出現重複語音留言或檔案，尤其是 agent 在串流期間發出 `MEDIA:`，且 provider 也在完成回覆中包含它時。

## 分塊演算法（低/高界限）

區塊分塊由 `EmbeddedBlockChunker` 實作：

- **低界限：**在 buffer >= `minChars` 前不發出（除非強制）。
- **高界限：**偏好在 `maxChars` 前切分；如果強制，則在 `maxChars` 切分。
- **中斷偏好：**`paragraph` → `newline` → `sentence` → `whitespace` → 硬中斷。
- **程式碼圍欄：**絕不在圍欄內切分；在 `maxChars` 強制切分時，會關閉 + 重新開啟圍欄，以保持 Markdown 有效。

`maxChars` 會被限制在頻道的 `textChunkLimit`，因此無法超過各頻道上限。

## 合併（合併已串流區塊）

啟用區塊串流時，OpenClaw 可在送出前**合併連續的區塊分塊**。這會減少「單行洗版」，同時仍提供漸進式輸出。

- 合併會等待**閒置間隔**（`idleMs`）後才清空。
- Buffer 會受到 `maxChars` 限制，超過時會清空。
- `minChars` 會避免在累積足夠文字前傳送微小片段（最終清空一律會傳送剩餘文字）。
- 連接符會從 `blockStreamingChunk.breakPreference` 推導
  （`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可透過 `*.blockStreamingCoalesce` 使用頻道覆寫（包含個別帳號設定）。
- 除非覆寫，Signal/Slack/Discord 的預設合併 `minChars` 會提升至 1500。

## 區塊之間的人性化節奏

啟用區塊串流時，你可以在區塊回覆之間（第一個區塊之後）加入**隨機化暫停**。這會讓多氣泡回應感覺更自然。

- 設定：`agents.defaults.humanDelay`（可透過 `agents.list[].humanDelay` 依 agent 覆寫）。
- 模式：`off`（預設）、`natural`（800-2500ms）、`custom`（`minMs`/`maxMs`）。
- 只套用到**區塊回覆**，不套用到最終回覆或工具摘要。

##「串流分塊或全部內容」

這會對應到：

- **串流分塊：**`blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（邊產生邊發出）。非 Telegram 頻道也需要 `*.blockStreaming: true`。
- **在結尾串流全部內容：**`blockStreamingBreak: "message_end"`（清空一次；若非常長，可能有多個分塊）。
- **不使用區塊串流：**`blockStreamingDefault: "off"`（僅最終回覆）。

**頻道注意事項：**除非明確將 `*.blockStreaming` 設為 `true`，否則區塊串流為**關閉**。頻道可以串流即時預覽（`channels.<channel>.streaming`），而不使用區塊回覆。

設定位置提醒：`blockStreaming*` 預設值位於 `agents.defaults` 下，而不是根設定。

## 預覽串流模式

正式鍵：`channels.<channel>.streaming`

模式：

- `off`：停用預覽串流。
- `partial`：單一預覽，會被最新文字取代。
- `block`：預覽以分塊/附加步驟更新。
- `progress`：生成期間顯示進度/狀態預覽，完成時給出最終答案。

`streaming.mode: "block"` 是供 Discord 和 Telegram 等可編輯頻道使用的預覽串流模式。它不會在這些頻道啟用頻道區塊傳送。若你想要一般區塊回覆，請使用 `streaming.block.enabled` 或舊版 `blockStreaming` 頻道鍵。Microsoft Teams 是例外：它沒有草稿預覽區塊傳輸，因此 `streaming.mode: "block"` 會對應到 Teams 區塊傳送，而不是原生 partial/progress 串流。

### 頻道對應

| 頻道       | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | 可編輯的進度草稿        |
| Discord    | ✅    | ✅        | ✅      | 可編輯的進度草稿        |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | 原生進度串流            |

僅限 Slack：

- 當 `channels.slack.streaming.mode="partial"` 時，`channels.slack.streaming.nativeTransport` 會切換 Slack 原生串流 API 呼叫（預設：`true`）。
- Slack 原生串流和 Slack 助理執行緒狀態需要回覆執行緒目標。頂層 DM 不會顯示那種執行緒樣式預覽，但仍可使用 Slack 草稿預覽貼文與編輯。

舊版鍵遷移：

- Telegram：doctor/設定相容性路徑會偵測舊版 `streamMode` 和純量/布林 `streaming` 值，並將其遷移到 `streaming.mode`。
- Discord：`streamMode` + 布林 `streaming` 會自動遷移到 `streaming` 列舉。
- Slack：`streamMode` 會自動遷移到 `streaming.mode`；布林 `streaming` 會自動遷移到 `streaming.mode` 加 `streaming.nativeTransport`；舊版 `nativeStreaming` 會自動遷移到 `streaming.nativeTransport`。

### 執行階段行為

Telegram：

- 在 DM 和群組/主題中使用 `sendMessage` + `editMessageText` 預覽更新。
- 最終文字會就地編輯作用中的預覽；很長的最終內容會重用該訊息作為第一個分塊，並只傳送剩餘分塊。
- `progress` 模式會在可編輯狀態草稿中保留工具進度，完成時清除該草稿，並透過一般傳送送出最終答案。
- 如果在完成文字確認前最終編輯失敗，OpenClaw 會使用一般最終傳送並清理過期預覽。
- 當 Telegram 區塊串流明確啟用時，會略過預覽串流（以避免雙重串流）。
- `/reasoning stream` 可以將 reasoning 寫入暫時性預覽，該預覽會在最終傳送後刪除。

Discord：

- 使用傳送 + 編輯預覽訊息。
- `block` 模式使用草稿分塊（`draftChunk`）。
- 當 Discord 區塊串流明確啟用時，會略過預覽串流。
- 最終媒體、錯誤和明確回覆 payload 會取消待處理預覽，不會清空新的草稿，然後使用一般傳送。

Slack：

- `partial` 可在可用時使用 Slack 原生串流（`chat.startStream`/`append`/`stop`）。
- `block` 使用附加樣式的草稿預覽。
- `progress` 使用狀態預覽文字，然後給出最終答案。
- 沒有回覆執行緒的頂層 DM 會使用草稿預覽貼文與編輯，而不是 Slack 原生串流。
- 原生與草稿預覽串流會抑制該回合的區塊回覆，因此 Slack 回覆只會透過一條傳送路徑串流。
- 最終媒體/錯誤 payload 和進度最終內容不會建立拋棄式草稿訊息；只有可編輯預覽的文字/區塊最終內容會清空待處理草稿文字。

Mattermost：

- 將思考、工具活動和部分回覆文字串流到單一草稿預覽貼文中，並在最終答案可安全傳送時就地完成。
- 如果預覽貼文已被刪除，或在完成時無法使用，則退回傳送新的最終貼文。
- 最終媒體/錯誤 payload 會在一般傳送前取消待處理預覽更新，而不是清空臨時預覽貼文。

Matrix：

- 當最終文字可重用預覽事件時，草稿預覽會就地完成。
- 僅媒體、錯誤和回覆目標不符的最終內容會在一般傳送前取消待處理預覽更新；已可見的過期預覽會被撤回。

### 工具進度預覽更新

預覽串流也可以包含**工具進度**更新，也就是像「正在搜尋網頁」、「正在讀取檔案」或「正在呼叫工具」這類短狀態行。這些狀態會在工具執行期間、最終回覆之前，出現在同一則預覽訊息中。這讓多步驟工具回合在第一個思考預覽與最終答案之間保持視覺上的動態，而不是沉默等待。

支援的介面：

- **Discord**、**Slack**、**Telegram** 和 **Matrix** 預設會在預覽串流啟用時，將工具進度串流到即時預覽編輯中。Microsoft Teams 在個人聊天中使用其原生進度串流。
- Telegram 自 `v2026.4.22` 起已隨附啟用工具進度預覽更新；維持啟用可保留該已發布的行為。
- **Mattermost** 已將工具活動折疊進其單一草稿預覽貼文中（見上文）。
- 工具進度編輯會遵循作用中的預覽串流模式；當預覽串流為 `off`，或區塊串流已接管訊息時，這些編輯會被略過。在 Telegram 上，`streaming.mode: "off"` 是僅最終訊息模式：一般進度閒聊也會被抑制，而不會作為獨立狀態訊息傳送；核准提示、媒體酬載和錯誤仍會正常路由。
- 若要保留預覽串流但隱藏工具進度行，請將該頻道的 `streaming.preview.toolProgress` 設為 `false`。若要在隱藏命令/執行文字的同時保持工具進度行可見，請將 `streaming.preview.commandText` 設為 `"status"`，或將 `streaming.progress.commandText` 設為 `"status"`；預設值為 `"raw"`，以保留已發布的行為。此政策由使用 OpenClaw 精簡進度轉譯器的草稿/進度頻道共用，包括 Discord、Matrix、Microsoft Teams、Mattermost、Slack 草稿預覽和 Telegram。若要完全停用預覽編輯，請將 `streaming.mode` 設為 `off`。
- Telegram 選取引用回覆是例外：當 `replyToMode` 不是 `"off"` 且存在選取的引用文字時，OpenClaw 會在該輪略過答案預覽串流，因此工具進度預覽行無法轉譯。沒有選取引用文字的目前訊息回覆仍會保留預覽串流。詳情請參閱 [Telegram 頻道文件](/zh-TW/channels/telegram)。

保留進度行可見，但隱藏原始命令/執行文字：

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

在其他精簡進度頻道鍵下使用相同結構，例如 `channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost`，或 Slack 草稿預覽。對於進度草稿模式，請將相同政策放在 `streaming.progress` 下：

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

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 目標共用預覽、編輯、串流和完成設計
- [進度草稿](/zh-TW/concepts/progress-drafts) - 會在長輪次期間更新的可見進行中工作訊息
- [訊息](/zh-TW/concepts/messages) - 訊息生命週期與傳遞
- [重試](/zh-TW/concepts/retry) - 傳遞失敗時的重試行為
- [頻道](/zh-TW/channels) - 各頻道的串流支援
