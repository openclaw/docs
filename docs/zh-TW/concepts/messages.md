---
read_when:
    - 說明傳入訊息如何轉化為回覆
    - 釐清工作階段、佇列模式或串流行為
    - 記錄推理可見性及其使用影響
summary: 訊息流程、工作階段、佇列處理與推理可見性
title: 訊息
x-i18n:
    generated_at: "2026-07-12T14:28:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 16f0dc387a8825a91568dcd5a44f8bdc54b8d69d78f851760dfc2efa1eb151e7
    source_path: concepts/messages.md
    workflow: 16
---

輸入訊息會依序經過路由、去重／防抖、代理程式執行及輸出傳遞：

```text
輸入訊息
  -> 路由／繫結 -> 工作階段金鑰
  -> 去重 + 防抖
  -> 佇列（若已有執行正在進行）
  -> 代理程式執行（串流 + 工具）
  -> 輸出回覆（頻道限制 + 分塊）
```

主要設定介面：

- `messages.*`：用於前綴、佇列處理、輸入防抖及群組行為。
- `agents.defaults.*`：用於區塊串流、分塊及靜默回覆的預設值。
- 頻道覆寫（`channels.telegram.*`、`channels.whatsapp.*` 等）：用於各頻道的上限及串流開關。

完整結構定義請參閱[設定](/zh-TW/gateway/configuration)。

## 輸入去重

頻道可能會在重新連線後再次傳遞相同訊息。OpenClaw 會保留一個記憶體內快取，索引鍵由代理程式範圍、頻道路由（頻道 + 對象 + 帳號 + 討論串）及訊息 ID 組成，因此再次傳遞的訊息不會觸發第二次代理程式執行。快取項目會在 20 分鐘後，或追蹤到 5000 個項目時到期，以先發生者為準。

## 輸入防抖

來自同一傳送者、快速連續送出的文字訊息，可透過 `messages.inbound` 批次合併為一次代理程式回合。防抖範圍以每個頻道 + 對話區分，並使用最新訊息的回覆討論串／ID。

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- 防抖僅適用於純文字訊息；媒體／附件會立即送出。
- 控制命令（停止／中止／狀態等）會略過防抖，以便立即分派。
- 預設為停用：`messages.inbound.debounceMs` 沒有內建預設值，因此只有在你設定後（全域或按頻道）才會啟用防抖。
- iMessage 的 `coalesceSameSenderDms` 選用功能是唯一例外：它會暫存來自同一傳送者的所有私訊文字（包括命令），等待足夠時間，讓 Apple 將命令 + URL 分開傳送的內容合併為同一回合。無論此設定為何，群組聊天一律會立即分派。

## 工作階段與裝置

工作階段由閘道擁有，而非用戶端。

- 直接聊天會合併至代理程式的主要工作階段金鑰。
- 群組／頻道會有各自的工作階段金鑰。
- 工作階段儲存區與對話記錄位於閘道主機上。

多個裝置／頻道可以對應至同一個工作階段，但歷史記錄不會完整同步回每個用戶端。長時間對話請使用一個主要裝置，以避免內容脈絡產生分歧。控制介面與終端介面一律顯示由閘道支援的工作階段對話記錄，因此應以其為準。

詳細資訊：[工作階段管理](/zh-TW/concepts/session)。

## 提示詞內文與歷史內容脈絡

頻道外掛會在傳入的內容脈絡中填入數個文字欄位，以下依優先順序由高至低排列：

| 欄位              | 用途                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `BodyForAgent`    | 目前回合提供給模型的文字。未設定時，會依序回退至 `CommandBody`／`RawBody`／`Body`。                           |
| `BodyForCommands` | 用於解析指示詞／命令的乾淨文字。未設定時，會依序回退至 `CommandBody`／`RawBody`／`Body`。                     |
| `CommandBody`     | 舊版中介內文；建議使用 `BodyForCommands`。                                                                    |
| `RawBody`         | 已棄用的 `CommandBody` 別名。                                                                                 |
| `Body`            | 舊版提示詞內文；可能包含頻道封裝與歷史記錄包裝。                                                              |

當頻道提供歷史記錄時，會使用以下內容包覆：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

對於非直接聊天（群組／頻道／聊天室），目前訊息的本文會加上傳送者標籤作為前綴，格式與歷史記錄項目所使用的樣式一致。指令移除僅套用於目前訊息區段，因此歷史記錄會保持完整。包覆歷史記錄的頻道應將 `BodyForCommands`（或舊版的 `CommandBody`／`RawBody`）設為原始訊息文字，並讓 `Body` 保留為合併後的提示詞。

歷史緩衝區僅包含待處理內容：其中包括未觸發執行的群組訊息（例如受提及條件限制的訊息），但不包括已存在於工作階段逐字稿中的訊息。在提示詞組裝期間，結構化歷史記錄、回覆、轉寄內容與頻道中繼資料會呈現為不受信任的使用者角色脈絡區塊。

使用 `messages.groupChat.historyLimit`（全域預設值）設定歷史記錄大小，或使用各頻道的覆寫設定，例如 `channels.slack.historyLimit` 和 `channels.telegram.accounts.<id>.historyLimit`（設為 `0` 可停用）。

## 工具結果中繼資料

工具結果的 `content` 是模型可見的結果；`details` 則是用於使用者介面呈現、診斷、媒體傳遞與外掛的執行階段中繼資料。

- `toolResult.details` 會在供應商重播前及壓縮輸入前移除。
- 持久化的工作階段逐字稿只保留大小受限的 `details`；過大的中繼資料會替換為標有 `persistedDetailsTruncated: true` 的精簡摘要。
- 外掛和工具應將模型必須讀取的文字放在 `content` 中，而不應只放在 `details` 中。

## 佇列與後續訊息

當執行已在進行中時，傳入訊息預設會導入該執行。`messages.queue` 控制其模式：

| 模式              | 行為                                                |
| ----------------- | --------------------------------------------------- |
| `steer`（預設）   | 將新提示注入進行中的執行。                          |
| `followup`        | 在進行中的執行完成後處理該訊息。                    |
| `collect`         | 將相容的訊息批次合併至後續的一個輪次。              |
| `interrupt`       | 中止進行中的執行，然後啟動最新的提示。              |

預設值：`messages.queue.debounceMs` 為 500ms（同樣適用於 steer、followup 和 collect 批次處理）、`messages.queue.cap` 為 20 則佇列訊息，而 `messages.queue.drop` 為 `summarize`（也可使用 `old` 和 `new`）。透過 `messages.queue.byChannel` 和 `messages.queue.debounceMsByChannel` 設定各頻道的覆寫值。

詳細資訊：[命令佇列](/zh-TW/concepts/queue)和[導向佇列](/zh-TW/concepts/queue-steering)。

## 頻道執行所有權

頻道外掛可在訊息進入工作階段佇列前維持順序、對輸入進行防彈跳處理，並施加傳輸反壓。它們不應針對代理程式輪次本身另外設定逾時。訊息路由至工作階段後，長時間執行工作的管理應由工作階段、工具和執行階段生命週期負責，讓所有頻道都能以一致方式回報緩慢輪次並從中復原。

## 串流、分塊與批次處理

區塊串流會在模型產生文字區塊時傳送部分回覆；分塊會遵守頻道文字限制，並避免拆分圍欄程式碼。

- `agents.defaults.blockStreamingDefault`（`on|off`，預設為 `off`）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（以閒置時間為基礎的批次處理）
- `agents.defaults.humanDelay`（區塊回覆之間模擬真人的暫停）
- 頻道覆寫：具有巢狀串流設定的頻道（Telegram、Discord、Slack、iMessage、Microsoft Teams）使用 `*.streaming.block.enabled` 和 `*.streaming.block.coalesce`；沒有巢狀串流設定的頻道使用扁平的 `*.blockStreaming` / `*.blockStreamingCoalesce`。所有頻道（包括 Telegram）的區塊串流預設皆為關閉，除非明確啟用。

詳細資訊：[串流與分塊](/zh-TW/concepts/streaming)。

## 推理可見性與權杖

- `/reasoning on|off|stream` 控制可見性。
- 模型產生推理內容時，該內容仍會計入權杖用量。
- Telegram 支援將串流推理顯示於暫時性的草稿泡泡中，並在最終內容送達後刪除；使用 `/reasoning on` 可保留推理輸出。

詳細資訊：[思考與推理指令](/zh-TW/tools/thinking)和[權杖用量](/zh-TW/reference/token-use)。

## 前綴、討論串與回覆

- 傳出前綴的套用層級：`messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。WhatsApp 另有用於傳入前綴的 `channels.whatsapp.messagePrefix`。
- 透過 `replyToMode` 和各頻道預設值設定回覆討論串。

詳細資訊：[設定](/zh-TW/gateway/config-agents#messages)和頻道文件。

## 靜默回覆

靜默權杖 `NO_REPLY`（不區分大小寫，因此 `no_reply` 也符合）表示「不要傳送使用者可見的回覆」。當某個輪次另有待處理的工具媒體（例如產生的 TTS 音訊）時，OpenClaw 會移除靜默文字，但仍會傳送媒體附件。

靜默原則會依對話類型決定：

- 直接對話永遠不會收到 `NO_REPLY` 提示指引。如果直接執行意外只傳回靜默權杖，OpenClaw 會將其隱藏，而不會改寫或傳送。
- 群組／頻道預設允許靜默。在 `message_tool` 可見回覆模式中，靜默表示模型不會呼叫 `message(action=send)`。
- 內部協調流程預設允許靜默。

預設值位於 `agents.defaults.silentReply`；`surfaces.<id>.silentReply` 可依介面覆寫群組／內部原則。

OpenClaw 也會在非直接聊天中，針對一般內部執行器失敗使用靜默回覆，因此群組／頻道不會看到閘道錯誤的制式訊息。具有使用者可見復原說明的已分類失敗（例如缺少驗證、速率限制或過載通知）仍可傳送。直接聊天預設會顯示精簡的失敗說明；只有啟用 `/verbose full` 時才會顯示原始執行器詳細資訊。

所有介面都會捨棄單獨出現的靜默回覆，因此父工作階段會保持安靜，而不會將哨兵文字改寫成備援閒聊。

## 相關資訊

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 持久傳送與接收的目標設計
- [串流](/zh-TW/concepts/streaming) - 即時訊息傳送
- [重試](/zh-TW/concepts/retry) - 訊息傳送重試行為
- [佇列](/zh-TW/concepts/queue) - 訊息處理佇列
- [頻道](/zh-TW/channels) - 訊息平台整合
