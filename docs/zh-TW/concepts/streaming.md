---
read_when:
    - 說明串流或分塊在頻道上的運作方式
    - 變更區塊串流或頻道分塊行為
    - 偵錯重複／過早的區塊回覆或頻道預覽串流
summary: 串流 + 分塊行為（區塊回覆、頻道預覽串流、模式對應）
title: 串流與分塊
x-i18n:
    generated_at: "2026-06-27T19:14:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有兩個獨立的串流層：

- **區塊串流（通道）：** 在助理撰寫時發出已完成的 **blocks**。這些是一般通道訊息（不是 token delta）。
- **預覽串流（Telegram/Discord/Slack）：** 在生成期間更新暫時的 **預覽訊息**。

目前通道訊息沒有 **真正的 token-delta 串流**。預覽串流是以訊息為基礎（傳送 + 編輯/附加）。

## 區塊串流（通道訊息）

區塊串流會在助理輸出可用時，以較粗略的區塊傳送。

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
- `chunker`：`EmbeddedBlockChunker` 套用最小/最大界線 + 斷點偏好。
- `channel send`：實際送出的訊息（區塊回覆）。

**控制項：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（預設關閉）。
- 通道覆寫：`*.blockStreaming`（以及每個帳號的變體）可強制每個通道為 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（傳送前合併已串流的區塊）。
- 通道硬性上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 通道分塊模式：`*.chunkMode`（預設為 `length`，`newline` 會在依長度分塊前，先依空白行（段落邊界）分割）。
- Discord 軟性上限：`channels.discord.maxLinesPerMessage`（預設 17）會分割過高的回覆，以避免介面裁切。

**邊界語意：**

- `text_end`：chunker 一發出就串流區塊；每次 `text_end` 都 flush。
- `message_end`：等到助理訊息完成，再 flush 緩衝的輸出。

如果緩衝文字超過 `maxChars`，`message_end` 仍會使用 chunker，因此最後可能發出多個區塊。

### 搭配區塊串流傳遞媒體

串流媒體必須使用結構化 payload 欄位，例如 `mediaUrl` 或
`mediaUrls`；串流文字不會被解析為附件命令。當區塊
串流提早傳送媒體時，OpenClaw 會記住該回合已完成的傳遞。如果
最終助理 payload 重複相同的媒體 URL，最終傳遞會
移除重複媒體，而不是再次傳送附件。

完全重複的最終 payload 會被抑制。如果最終 payload 在已經
串流過的媒體周圍加入不同文字，OpenClaw 仍會傳送
新文字，同時保持媒體只傳遞一次。這可防止 Telegram 等
通道出現重複的語音記事或檔案。

## 分塊演算法（低/高界線）

區塊分塊由 `EmbeddedBlockChunker` 實作：

- **低界線：** 緩衝區 >= `minChars` 前不要發出（除非強制）。
- **高界線：** 偏好在 `maxChars` 前分割；若為強制，則在 `maxChars` 分割。
- **斷點偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬斷點。
- **程式碼圍欄：** 絕不在圍欄內分割；在 `maxChars` 強制分割時，會關閉 + 重新開啟圍欄，以保持 Markdown 有效。

`maxChars` 會被限制在通道的 `textChunkLimit`，因此不能超過每個通道的上限。

## 合併（合併已串流區塊）

啟用區塊串流時，OpenClaw 可以在傳送前**合併連續的區塊分塊**。這會減少「單行洗版」，同時仍提供漸進式輸出。

- 合併會等待 **閒置間隔**（`idleMs`）後再 flush。
- 緩衝區受 `maxChars` 限制，超過時會 flush。
- `minChars` 會避免太小的片段在累積足夠文字前送出
  （最終 flush 一律會送出剩餘文字）。
- 連接字元會從 `blockStreamingChunk.breakPreference` 衍生
  （`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → 空格）。
- 可透過 `*.blockStreamingCoalesce` 使用通道覆寫（包含每個帳號的設定）。
- 除非覆寫，Signal/Slack/Discord 的預設合併 `minChars` 會提高到 1500。

## 區塊之間的人類化節奏

啟用區塊串流時，你可以在區塊回覆之間（第一個區塊之後）加入**隨機暫停**。這會讓多泡泡回應感覺更自然。

- 設定：`agents.defaults.humanDelay`（可透過 `agents.list[].humanDelay` 依助理覆寫）。
- 模式：`off`（預設）、`natural`（800-2500ms）、`custom`（`minMs`/`maxMs`）。
- 只套用於**區塊回覆**，不套用於最終回覆或工具摘要。

##「串流分塊或全部內容」

這會對應到：

- **串流分塊：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（邊生成邊發出）。非 Telegram 通道也需要 `*.blockStreaming: true`。
- **最後串流全部內容：** `blockStreamingBreak: "message_end"`（一次 flush；若非常長，可能是多個區塊）。
- **無區塊串流：** `blockStreamingDefault: "off"`（只有最終回覆）。

**通道注意事項：** 除非明確將
`*.blockStreaming` 設為 `true`，否則區塊串流為**關閉**。通道可以串流即時預覽
（`channels.<channel>.streaming`），而不產生區塊回覆。

設定位置提醒：`blockStreaming*` 預設值位於
`agents.defaults` 底下，而不是根設定。

## 預覽串流模式

標準鍵：`channels.<channel>.streaming`

模式：

- `off`：停用預覽串流。
- `partial`：單一預覽，會以最新文字取代。
- `block`：預覽以分塊/附加步驟更新。
- `progress`：生成期間顯示進度/狀態預覽，完成時給出最終答案。

`streaming.mode: "block"` 是適用於 Discord 和 Telegram 等
可編輯通道的預覽串流模式。它不會在那裡啟用通道區塊傳遞。
若你想要一般區塊回覆，請使用 `streaming.block.enabled` 或舊版
`blockStreaming` 通道鍵。Microsoft Teams 是例外：它沒有
草稿預覽區塊傳輸，因此 `streaming.mode: "block"` 會對應到 Teams 區塊
傳遞，而不是原生 partial/progress 串流。

### 通道對應

| 通道    | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | 可編輯進度草稿 |
| Discord    | ✅    | ✅        | ✅      | 可編輯進度草稿 |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | 原生進度串流  |

僅限 Slack：

- `channels.slack.streaming.nativeTransport` 會在 `channels.slack.streaming.mode="partial"` 時切換 Slack 原生串流 API 呼叫（預設：`true`）。
- Slack 原生串流和 Slack 助理執行緒狀態需要回覆執行緒目標。頂層私訊不會顯示那種執行緒樣式預覽，但仍可使用 Slack 草稿預覽貼文和編輯。

舊版鍵遷移：

- Telegram：舊版 `streamMode` 和純量/布林 `streaming` 值會由 doctor/config 相容路徑偵測並遷移到 `streaming.mode`。
- Discord：`streamMode` + 布林 `streaming` 仍是 `streaming` enum 的執行階段別名；執行 `openclaw doctor --fix` 以重寫已保存的設定。
- Slack：`streamMode` 仍是 `streaming.mode` 的執行階段別名；布林 `streaming` 仍是 `streaming.mode` 加 `streaming.nativeTransport` 的執行階段別名；舊版 `nativeStreaming` 仍是 `streaming.nativeTransport` 的執行階段別名。執行 `openclaw doctor --fix` 以重寫已保存的設定。

### 執行階段行為

Telegram：

- 使用 `sendMessage` + `editMessageText` 在私訊和群組/主題中更新預覽。
- 短初始預覽仍會為了推播通知使用者體驗而 debounce，但 Telegram 現在會在有界延遲後將其實體化，因此作用中的執行不會一直在視覺上保持沉默。
- 最終文字會就地編輯作用中的預覽；較長的最終內容會重用該訊息作為第一個區塊，且只傳送剩餘區塊。
- `block` 模式會在 `streaming.preview.chunk.maxChars`（預設 800，受 Telegram 的 4096 編輯限制約束）將預覽輪換成新訊息；其他模式會將單一預覽增長到最多 4096 個字元。
- `progress` 模式會將工具進度保留在可編輯狀態草稿中，當答案串流作用中但尚無工具行可用時，會實體化狀態標籤，在完成時清除該草稿，並透過一般傳遞傳送最終答案。
- 如果最終編輯在完成文字確認前失敗，OpenClaw 會使用一般最終傳遞並清理過時的預覽。
- 明確啟用 Telegram 區塊串流時，會略過預覽串流（以避免雙重串流）。
- `/reasoning stream` 可以將推理寫入暫時預覽，並在最終傳遞後刪除。

Discord：

- 使用傳送 + 編輯預覽訊息。
- `block` 模式使用草稿分塊（`draftChunk`）。
- 明確啟用 Discord 區塊串流時，會略過預覽串流。
- 最終媒體、錯誤和明確回覆 payload 會取消待處理預覽而不 flush 新草稿，然後使用一般傳遞。

Slack：

- 可用時，`partial` 可使用 Slack 原生串流（`chat.startStream`/`append`/`stop`）。
- `block` 使用附加樣式草稿預覽。
- `progress` 使用狀態預覽文字，然後是最終答案。
- 沒有回覆執行緒的頂層私訊會使用草稿預覽貼文和編輯，而不是 Slack 原生串流。
- 原生和草稿預覽串流會抑制該回合的區塊回覆，因此 Slack 回覆只會由一條傳遞路徑串流。
- 最終媒體/錯誤 payload 和進度最終內容不會建立一次性草稿訊息；只有可編輯預覽的文字/區塊最終內容才會 flush 待處理草稿文字。

Mattermost：

- 將思考、工具活動和部分回覆文字串流到單一草稿預覽貼文中，並在最終答案可安全傳送時就地完成。
- 如果預覽貼文已被刪除或在完成時無法使用，則退回為傳送新的最終貼文。
- 最終媒體/錯誤 payload 會在一般傳遞前取消待處理預覽更新，而不是 flush 暫時預覽貼文。

Matrix：

- 當最終文字可重用預覽事件時，草稿預覽會就地完成。
- 僅媒體、錯誤和回覆目標不符的最終內容會在一般傳遞前取消待處理預覽更新；已可見的過時預覽會被撤回。

### 工具進度預覽更新

預覽串流也可以包含**工具進度**更新，也就是像「搜尋網頁」、「讀取檔案」或「呼叫工具」這類短狀態行；這些狀態行會在工具執行期間、最終回覆之前，出現在同一則預覽訊息中。在 Codex app-server 模式中，Codex preamble/commentary 訊息會使用相同的預覽路徑，因此像「我正在檢查...」這樣的短進度備註可以串流到可編輯草稿中，而不會成為最終答案的一部分。這會讓多步驟工具回合在第一個思考預覽和最終答案之間保持視覺上的活躍，而不是沉默。

長時間執行的工具可能會在回傳前發出型別化進度。例如，
`web_fetch` 會在啟動時設置五秒計時器：如果擷取仍在
等待中，預覽可以顯示 `Fetching page content...`；如果擷取在
那之前完成或取消，就不會發出進度行。後續的最終工具
結果仍會正常傳遞給模型。

支援的介面：

- **Discord**、**Slack**、**Telegram** 和 **Matrix** 在預覽串流啟用時，預設會將工具進度與 Codex 前言更新串流到即時預覽編輯中。Microsoft Teams 在個人聊天中使用其原生進度串流。
- Telegram 自 `v2026.4.22` 起已隨附啟用工具進度預覽更新；保持啟用可保留該已發布行為。
- **Mattermost** 已將工具活動折疊進其單一草稿預覽貼文中（見上文）。
- 工具進度編輯會遵循作用中的預覽串流模式；當預覽串流為 `off`，或區塊串流已接管訊息時，會略過這些編輯。在 Telegram 上，`streaming.mode: "off"` 是僅最終結果模式：一般進度閒聊也會被抑制，而不是作為獨立狀態訊息送出；核准提示、媒體酬載和錯誤仍會正常路由。
- 若要保留預覽串流但隱藏工具進度列，請將該通道的 `streaming.preview.toolProgress` 設為 `false`。若要在隱藏命令/執行文字的同時保持工具進度列可見，請將 `streaming.preview.commandText` 設為 `"status"`，或將 `streaming.progress.commandText` 設為 `"status"`；預設值為 `"raw"`，以保留已發布行為。此政策由使用 OpenClaw 精簡進度轉譯器的草稿/進度通道共用，包括 Discord、Matrix、Microsoft Teams、Mattermost、Slack 草稿預覽和 Telegram。若要完全停用預覽編輯，請將 `streaming.mode` 設為 `off`。
- Telegram 選取引用回覆是例外：當 `replyToMode` 不是 `"off"` 且存在選取的引用文字時，OpenClaw 會略過該回合的答案預覽串流，因此工具進度預覽列無法轉譯。沒有選取引用文字的目前訊息回覆仍會保留預覽串流。詳情請參閱 [Telegram 通道文件](/zh-TW/channels/telegram)。

保持進度列可見，但隱藏原始命令/執行文字：

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

在另一個精簡進度通道鍵下使用相同形狀，例如 `channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost`，或 Slack 草稿預覽。對於進度草稿模式，請將相同政策放在 `streaming.progress` 下：

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

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 目標共用預覽、編輯、串流與最終化設計
- [進度草稿](/zh-TW/concepts/progress-drafts) - 會在長回合期間更新的可見進行中工作訊息
- [訊息](/zh-TW/concepts/messages) - 訊息生命週期與傳遞
- [重試](/zh-TW/concepts/retry) - 傳遞失敗時的重試行為
- [通道](/zh-TW/channels) - 各通道串流支援
