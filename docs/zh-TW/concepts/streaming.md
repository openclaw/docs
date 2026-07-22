---
read_when:
    - 說明串流或分塊在頻道上的運作方式
    - 變更區塊串流或頻道分塊行為
    - 偵錯重複／過早的區塊回覆或頻道預覽串流問題
summary: 串流與分塊行為（區塊回覆、頻道預覽串流、模式對應）
title: 串流與分塊
x-i18n:
    generated_at: "2026-07-22T10:31:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a498f2e490ae6f2ecdebba92f0b992f2e16d212eae6a437eb3a0ef8a59354e13
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有兩個獨立的串流層，而目前傳送至頻道訊息時，**沒有真正的
token 差異串流**：

- **區塊串流（頻道）：**隨助理撰寫內容，傳送已完成的**區塊**。
  這些是一般的頻道訊息，而非 token 差異。
- **預覽串流（Telegram/Discord/Slack/Matrix/Mattermost/MS Teams）：**
  在生成期間更新暫時的**預覽訊息**（傳送 + 編輯/附加）。

## Control UI 啟動狀態

在 `chat.send` 確認有執行中的工作後，閘道可以在助理文字或工具活動可見前，
傳送具型別的概略啟動狀態。Control UI 會在工作中指示器旁顯示此狀態，並包含
工作區準備、環境佈建、上下文準備及模型啟動等階段。

第一個助理差異或工具啟動後，會永久取代該次執行的啟動狀態。當工具正在等待操作員
採取動作時，核准狀態具有優先權。工作樹建立和初始雲端分派會發生在聊天執行存在之前，
因此其執行前 RPC 進度不會顯示為執行啟動狀態；只有在執行中的工作重新佈建已回收的
工作程序時，環境佈建才會顯示於此。

## 區塊串流（頻道訊息）

區塊串流會在助理輸出可用時，以概略區塊傳送輸出。

```text
模型輸出
  └─ text_delta/事件
       ├─ (blockStreamingBreak=text_end)
       │    └─ 分塊器隨緩衝區增長而傳送區塊
       └─ (blockStreamingBreak=message_end)
            └─ 分塊器在 message_end 時排清
                   └─ 頻道傳送（區塊回覆）
```

- `text_delta/events`：模型串流事件（對非串流模型而言可能較稀疏）。
- `chunker`：`EmbeddedBlockChunker` 會套用最小值/最大值界限與換行偏好。
- `channel send`：實際傳出的訊息（區塊回覆）。

**控制項**（除非另有註明，否則皆位於 `agents.defaults` 下）：

| 鍵                                                           | 值／形態                                                                | 預設值     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }`（傳送前合併串流區塊） | -          |
| `*.streaming.block.enabled`（頻道覆寫）               | `true` / `false`，強制各頻道（及各帳號）使用區塊串流  | -          |
| `*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`） | 數字，硬性上限                                                          | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | 數字，用於拆分過長回覆以避免 UI 裁切的軟性行數上限                     | 17         |

`streaming.chunkMode: "newline"` 會先依空白行（段落邊界）拆分，
而不是依每個換行拆分；只有文字超過限制後，才會改用長度分塊。

隨附頻道會將這些覆寫寫成
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`。扁平形式的
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` 在所有隨附頻道中都屬於
舊版寫法：`openclaw doctor --fix` 會將其遷移至巢狀形態，而頻道結構描述會拒絕這些寫法。
仍使用扁平寫法的外部 SDK 外掛設定，會透過已淘汰的
備援機制（並發出執行階段警告）繼續運作，直到下一個發布週期為止。

`blockStreamingBreak` 的**邊界語意**：

- `text_end`：分塊器一傳送區塊便立即串流；每遇到 `text_end` 時排清。
- `message_end`：等待助理訊息完成，然後排清已緩衝的
  輸出。若緩衝文字超過 `maxChars`，仍會使用分塊器，因此
  可在結束時傳送多個區塊。

### 使用區塊串流傳送媒體

串流媒體必須使用 `mediaUrl` 或
`mediaUrls` 等結構化承載資料欄位；系統不會將串流文字剖析為附件命令。當區塊
串流提前傳送媒體時，OpenClaw 會記住該回合的傳送情況。若
最終助理承載資料重複相同的媒體 URL，最終傳送會移除
重複媒體，而不會再次傳送附件。

完全重複的最終承載資料會被抑制。若最終承載資料在已串流的媒體周圍新增
不同文字，OpenClaw 仍會傳送新文字，同時確保媒體只傳送一次。
這可避免在 Telegram 等頻道上出現重複的語音
訊息或檔案。

## 分塊演算法（低／高界限）

區塊分塊由 `EmbeddedBlockChunker` 實作：

- **低界限：**緩衝區 >= `minChars` 前不傳送（除非強制）。
- **高界限：**優先在 `maxChars` 前拆分；若強制，則在 `maxChars` 處拆分。
- **換行偏好順序：**`paragraph` -> `newline` -> `sentence` ->
  空白字元 -> 強制斷行。
- **程式碼圍欄：**絕不在圍欄內拆分；在 `maxChars` 處強制拆分時，會關閉
  並重新開啟圍欄，以保持 Markdown 有效。

`maxChars` 會限制在頻道的 `textChunkLimit` 以內，因此無法超過
各頻道上限。

## 合併（合併串流區塊）

啟用區塊串流時，OpenClaw 可以在傳送前**合併連續的區塊
分段**，以減少單行訊息洗版，同時仍提供
漸進式輸出。

- 合併會等待**閒置間隔**（`idleMs`）後才排清。
- 緩衝區上限為 `maxChars`，超過後即排清。
- `minChars` 會在累積足夠文字前防止傳送過小的片段
  （最終排清一律會傳送剩餘文字）。
- 連接符取決於 `blockStreamingChunk.breakPreference`：`paragraph` ->
  `\n\n`、`newline` -> `\n`、`sentence` -> 空格。
- 可透過 `*.streaming.block.coalesce` 設定頻道覆寫（包括
  各帳號設定）。
- 除非另有覆寫，Discord、Signal 和 Slack 預設會合併至 `{ minChars: 1500, idleMs: 1000 }`。

## 區塊間的類人節奏

啟用區塊串流時，從第一個區塊之後開始，在區塊
回覆之間加入**隨機暫停**，讓多訊息泡泡回覆感覺更自然。

| `agents.defaults.humanDelay.mode` | 行為                    |
| --------------------------------- | ----------------------- |
| `off`（預設）                   | 不暫停                  |
| `natural`                         | 隨機暫停 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

可透過 `agents.entries.*.humanDelay` 針對各代理程式覆寫。僅套用於**區塊
回覆**，不套用於最終回覆或工具摘要。

## 「串流分段或全部內容」

- **串流分段：**`blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  （隨生成隨傳送）。非 Telegram 頻道還需要
  `*.streaming.block.enabled: true`。
- **結束時串流全部內容：**`blockStreamingBreak: "message_end"`（排清
  一次；若內容很長，可能分成多個區塊）。
- **不使用區塊串流：**`blockStreamingDefault: "off"`（僅傳送最終回覆）。

除非明確將 `*.streaming.block.enabled` 設為
`true`，否則區塊串流為**關閉**（例外：QQ Bot 沒有 `streaming.block` 鍵，
且除非 `channels.qqbot.streaming.mode` 為 `"off"`，否則會串流
區塊回覆）。頻道可在不使用區塊
回覆的情況下串流即時預覽（`channels.<channel>.streaming.mode`）。`blockStreaming*` 預設值位於 `agents.defaults` 下，而非
設定根層級。

## 預覽串流模式

標準鍵：`channels.<channel>.streaming`（巢狀的 `{ mode, ... }`；舊版
頂層布林值／字串寫法會由 `openclaw doctor --fix` 重寫）。

| 模式       | 行為                                                                  |
| ---------- | --------------------------------------------------------------------- |
| `off`      | 停用預覽串流                                                          |
| `partial`  | 以最新文字取代單一預覽                                                |
| `block`    | 以分塊／附加步驟更新預覽                                              |
| `progress` | 生成期間顯示進度／狀態預覽，完成時顯示最終答案                        |

`streaming.mode: "block"` 是供 Discord 和 Telegram 等支援編輯的
頻道使用的預覽串流模式；它本身不會在這些頻道啟用
頻道區塊傳送。一般區塊回覆請使用 `streaming.block.enabled`。
Microsoft Teams 是
例外：它沒有草稿預覽區塊傳輸，因此 `streaming.mode:
"block"` 會完全停用原生串流，
而回覆會以一般區塊傳送方式送達，而不是使用原生的部分／進度串流。Mattermost 也
有所不同：在 `block` 模式下，它會在已完成文字與
工具活動區塊之間輪替預覽，因此較早的區塊會保留為不同貼文，
而不會在單一可編輯草稿中被覆寫。

### 頻道對應

| 頻道       | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | 是    | 是        | 是      | 可編輯的進度草稿        |
| Discord    | 是    | 是        | 是      | 可編輯的進度草稿        |
| Slack      | 是    | 是        | 是      | 是                      |
| Mattermost | 是    | 是        | 是      | 是                      |
| MS Teams   | 是    | 是        | 是      | 原生進度串流            |

預覽分塊設定（`streaming.preview.chunk.*`，例如位於
`channels.discord.streaming` 或 `channels.telegram.streaming` 下）的預設值為
`minChars: 200`、`maxChars: 800`（限制在頻道的 `textChunkLimit` 以內）和
`breakPreference: "paragraph"`。

僅限 Slack：

- `channels.slack.streaming.nativeTransport` 會在
  `channels.slack.streaming.mode="partial"` 時切換 Slack 原生串流 API
  呼叫（`chat.startStream`/`chat.appendStream`/`chat.stopStream`）（預設值：`true`）。
- Slack 原生串流和 Slack 助理討論串狀態需要回覆
  討論串目標。頂層私訊不會顯示該討論串樣式預覽，但仍可
  使用 Slack 草稿預覽貼文和編輯。

### 舊版鍵遷移

| 頻道     | 舊版鍵值                                                    | 狀態                                                                                                                                                 |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`、純量／布林值 `streaming`                    | 由 `openclaw doctor --fix` 改寫為 `streaming.mode`；執行階段不會讀取                                                                        |
| Discord  | `streamMode`、布林值 `streaming`                           | 由 `openclaw doctor --fix` 改寫為 `streaming.mode`；執行階段不會讀取                                                                        |
| Slack    | `streamMode`；布林值 `streaming`；舊版 `nativeStreaming` | 由 `openclaw doctor --fix` 改寫為 `streaming.mode`（布林值／舊版形式則改寫為 `streaming.nativeTransport`）；執行階段不會讀取         |
| Matrix   | 純量／布林值 `streaming`                                  | 由 `openclaw doctor --fix` 改寫為 `streaming.mode`（包括 Matrix 的 `"quiet"` 模式）；執行階段不會讀取                                    |
| Feishu   | 布林值 `streaming`                                         | 由 `openclaw doctor --fix` 改寫為 `streaming.mode`；執行階段不會讀取                                                                        |
| QQ Bot   | 布林值 `streaming`；`streaming.c2cStreamApi`               | 由 `openclaw doctor --fix` 改寫為 `streaming.mode`（布林值／`c2cStreamApi` 形式則改寫為 `streaming.nativeTransport`）；執行階段不會讀取 |

## 執行階段行為

### Telegram

- 在私訊和群組／主題中使用 `sendMessage` + `editMessageText` 預覽更新；
  最終文字會直接就地編輯使用中的預覽。Telegram
  的 30 秒暫時性「輸入中」草稿（`sendMessageDraft`）不會用於
  回覆串流。
- 簡短的初始預覽仍會為推播通知使用者體驗進行防彈跳處理，但會在
  有限延遲後具體顯示，讓進行中的執行不會在視覺上一直保持靜默。
- 較長的最終回覆會將預覽訊息重複用於第一個區塊，並只傳送
  其餘區塊。
- `block` 模式會在
  `streaming.preview.chunk.maxChars` 時將預覽輪替為新訊息（預設為 800，上限為 Telegram 的 4096
  編輯限制）；其他模式則會將單一預覽擴增至最多 4096 個字元。
- `progress` 模式會將工具進度保留在可編輯的狀態草稿中；
  當回覆串流作用中但尚無可用工具行時，會具體顯示狀態標籤；
  完成時清除草稿，並透過一般傳遞方式傳送最終回覆。
- 如果在確認完整文字前最終編輯失敗，OpenClaw 會使用
  一般最終傳遞方式，並清除過時的預覽。
- 明確啟用 Telegram 區塊串流時，會略過預覽串流，
  以避免重複串流。
- `/reasoning stream` 可將推理內容寫入暫時性預覽，
  並在最終傳遞後刪除。
- Telegram 的選取引文回覆屬於例外情況：當 `replyToMode` 不是
  `"off"` 且存在選取的引文文字時，OpenClaw 會略過該回合的回覆預覽
  串流（最終回覆必須經由原生引文回覆
  路徑），因此無法顯示工具進度預覽行。若回覆目前訊息時
  沒有選取引文文字，仍會保留預覽串流。詳情請參閱
  [Telegram 頻道文件](/zh-TW/channels/telegram)。

### Discord

- 使用傳送 + 編輯預覽訊息。
- `block` 模式使用草稿分塊（`draftChunk`）。
- 明確啟用 Discord 區塊串流時，會略過預覽串流。
- `progress` 模式會在最終回覆附加一小段 `-#` 活動收據（思考／工具呼叫
  次數與經過時間），並在該回覆傳遞後刪除狀態草稿，
  讓繁忙的頻道不會在回覆上方留下孤立的工具記錄。
  錯誤最終回覆則會保留草稿，作為該次失敗回合的記錄。
- 最終媒體、錯誤和明確回覆承載內容會取消待處理的預覽，
  而不送出新的草稿，之後改用一般傳遞方式。

### Slack

- `partial` 可在支援時使用 Slack 原生串流（`chat.startStream`/`append`/`stop`）。
- `block` 使用附加式草稿預覽。
- `progress` 先使用狀態預覽文字，再傳送最終回覆。
- 沒有回覆討論串的頂層私訊會使用草稿預覽貼文和編輯，
  而非 Slack 原生串流。
- 原生和草稿預覽串流會抑制該回合的區塊回覆，因此
  Slack 回覆只會透過一條傳遞路徑串流。
- 最終媒體／錯誤承載內容和進度最終回覆不會建立用完即丟的草稿
  訊息；只有能編輯預覽的文字／區塊最終回覆才會送出待處理的
  草稿文字。

### Mattermost

- 在 `partial` 模式中，會將思考內容和部分回覆文字串流到單一草稿
  預覽貼文，並在最終回覆可安全傳送時就地完成。
- 在 `progress` 模式中，會將思考內容和工具活動串流到單一狀態
  預覽，並在最終回覆可安全傳送時就地完成。
- 在 `block` 模式中，會在已完成文字與工具活動貼文之間輪替；
  平行與連續的工具更新共用目前的工具活動貼文。
- 如果預覽貼文已刪除，或在完成時因其他原因無法使用，
  則會改為傳送新的最終貼文。
- 最終媒體／錯誤承載內容會在一般傳遞前取消待處理的預覽更新，
  而非送出暫時性預覽貼文。

### Matrix

- 當最終文字可重複使用預覽事件時，草稿預覽會就地完成。
- 僅含媒體、錯誤和回覆目標不符的最終回覆，會在一般傳遞前
  取消待處理的預覽更新；已顯示的過時預覽則會予以遮蔽。

## 工具進度預覽更新

預覽串流也可以包含**工具進度**更新：工具執行期間，
在相同預覽訊息中、最終回覆之前出現的簡短狀態行，
例如「正在搜尋網路」、「正在讀取檔案」或「正在呼叫工具」。
在 Codex 應用程式伺服器模式中，Codex 前導／評論訊息會使用相同的
預覽路徑，因此簡短的「我正在檢查……」進度說明可串流到
可編輯草稿中，而不會成為最終回覆的一部分。這能讓
多步驟工具回合在第一次思考預覽與最終回覆之間持續呈現動態，
而不會在視覺上保持靜默。

長時間執行的工具可能會在傳回前發出具型別的進度。例如，
`web_fetch` 啟動時會設定五秒計時器：若擷取作業仍在
等待中，預覽會顯示 `Fetching page content...`；若擷取在此之前完成或
取消，則不會發出進度行。之後的最終工具
結果仍會正常傳遞給模型。

支援的介面：

- 當預覽串流作用中時，**Discord**、**Slack**、**Telegram** 和 **Matrix** 預設會將工具進度與
  Codex 前導更新串流到即時預覽編輯中。Microsoft Teams 則在
  個人聊天中使用其原生進度串流。
- Telegram 自 `v2026.4.22` 起，已隨附啟用工具進度預覽更新；
  保持啟用可維持該已發布行為。
- **Mattermost** 在 `partial` 和
  `progress` 模式中，會將工具活動整合到單一預覽貼文；在 `block`
  模式中，則會在文字區塊之間使用單一工具活動貼文（見上文）。
- 工具進度編輯會遵循作用中的預覽串流模式；當預覽串流為
  `off`，或區塊串流已接管訊息時，便會略過這些編輯。在 Telegram 上，
  `streaming.mode: "off"` 僅用於最終回覆：一般進度訊息也會受到抑制，
  而非以獨立狀態訊息傳遞；核准提示、媒體承載內容和錯誤則仍會
  正常路由。
- 若要保留預覽串流但隱藏工具進度行，請將該頻道的
  `streaming.preview.toolProgress` 設為 `false`（預設為
  `true`）。若要保持工具進度行可見，但隱藏命令／執行文字，
  請將 `streaming.preview.commandText` 設為 `"status"`，或將
  `streaming.progress.commandText` 設為 `"status"`；預設為 `"raw"`，
  以維持已發布行為。使用 OpenClaw 精簡進度轉譯器的草稿／進度頻道
  會共用此原則，包括 Discord、Matrix、
  Microsoft Teams、Mattermost、Slack 草稿預覽和 Telegram。若要完全停用
  預覽編輯，請將 `streaming.mode` 設為 `off`。

## 進度草稿轉譯

進度模式草稿（`streaming.progress.*`）有大小限制，且可按
頻道設定：

| 鍵值                              | 預設值        | 行為                                                           |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | 草稿標籤下方保留的精簡進度行數上限                             |
| `streaming.progress.maxLineChars` | `120`         | 每個精簡行在截斷前的字元數上限（會考量單字邊界）               |
| `streaming.progress.label`        | `"auto"`      | 草稿標題；可使用自訂字串，或使用 `false` 隱藏標題   |
| `streaming.progress.labels`       | 內建集區      | 當 `label: "auto"` 時使用的候選標籤                         |

### 評論進度通道

除了工具進度之外，精簡進度轉譯器還能在草稿中顯示另一個
通道：

- **`streaming.progress.commentary`** - 顯示模型在使用工具前的
  **評論**（簡短的「我會先檢查……接著……」敘述），並與
  工具行交錯顯示於進度草稿中。在 Discord 和 Telegram 的進度模式下，
  即使關閉這個選用通道，相同的前導內容仍會提供狀態標題；
  其他頻道則維持其既有的進度行為。請參閱
  [進度草稿](/zh-TW/concepts/progress-drafts#status-headline)。

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

可在其他精簡進度頻道鍵值下使用相同結構，例如
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

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 以共用預覽、編輯、串流和完成設計為目標
- [進度草稿](/zh-TW/concepts/progress-drafts) - 在長回合期間持續更新的可見工作進度訊息
- [訊息](/zh-TW/concepts/messages) - 訊息生命週期與傳遞
- [重試](/zh-TW/concepts/retry) - 傳遞失敗時的重試行為
- [頻道](/zh-TW/channels) - 各頻道的串流支援
