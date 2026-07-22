---
read_when:
    - 說明傳入訊息如何轉化為回覆
    - 釐清工作階段、佇列模式或串流行為
    - 記錄推理可見性與使用量影響
summary: 訊息流程、工作階段、佇列處理與推理可見性
title: 訊息
x-i18n:
    generated_at: "2026-07-22T10:31:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21911abcd96a778a491aafb35cee6875b75d0d57d2eb45e122fe8b1552fd75ae
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

- `messages.*`：前綴、排隊、輸入防抖及群組行為。
- `agents.defaults.*`：區塊串流、分塊及靜默回覆預設值。
- 頻道覆寫（`channels.telegram.*`、`channels.whatsapp.*` 等）：各頻道的上限及串流切換設定。

完整結構描述請參閱[設定](/zh-TW/gateway/configuration)。

## 輸入去重

頻道可能在重新連線後再次傳遞同一則訊息。OpenClaw 會保留一個記憶體內快取，其索引鍵由代理程式範圍、頻道路由（頻道 + 對端 + 帳號 + 討論串）及訊息 ID 組成，因此重新傳遞的訊息不會觸發第二次代理程式執行。快取項目會在 20 分鐘後或追蹤項目達到 5000 筆時到期，以先發生者為準。

## 輸入防抖

來自同一傳送者、快速連續傳送的文字訊息，可透過 `messages.inbound` 批次合併成一次代理程式輪次。防抖範圍依頻道 + 對話劃分，並使用最新訊息進行回覆討論串關聯及 ID 處理。

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

- 防抖僅套用於純文字訊息；媒體／附件會立即送出。
- 控制命令（停止／中止／狀態等）會略過防抖，以便立即分派。
- 預設停用：`messages.inbound.debounceMs` 沒有內建預設值，因此只有在你設定後（全域或各頻道）才會啟用防抖。
- iMessage 的 `coalesceSameSenderDms` 選擇性啟用是唯一例外：它會暫存來自同一傳送者的所有私訊文字（包括命令），保留足夠時間，讓 Apple 將命令與 URL 分開傳送的訊息合併為同一輪次。無論此設定為何，群組聊天一律立即分派。

## 工作階段與裝置

工作階段由閘道擁有，而非用戶端。

- 直接聊天會合併至代理程式的主要工作階段金鑰。
- 群組／頻道會取得各自的工作階段金鑰。
- 工作階段儲存區及逐字稿位於閘道主機上。

多個裝置／頻道可以對應到同一個工作階段，但歷程不會完整同步回每個用戶端。長時間對話請使用單一主要裝置，以免內容脈絡分歧。控制介面及終端介面一律顯示由閘道支援的工作階段逐字稿，因此它們是唯一可信來源。

詳細資訊：[工作階段管理](/zh-TW/concepts/session)。

## 提示詞主體與歷程內容脈絡

頻道外掛會在輸入內容脈絡中填入數個文字欄位，以下依優先順序由高至低排列：

| 欄位             | 用途                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | 本輪次提供給模型的文字。未設定時，會回退至 `CommandBody`／`RawBody`／`Body`。        |
| `BodyForCommands` | 用於剖析指示詞／命令的乾淨文字。未設定時，會回退至 `CommandBody`／`RawBody`／`Body`。 |
| `CommandBody`     | 舊版中介主體；建議使用 `BodyForCommands`。                                                         |
| `RawBody`         | `CommandBody` 已棄用的別名。                                                                         |
| `Body`            | 舊版提示詞主體；可能包含頻道封套及歷程包裝。                                     |

頻道提供歷程時，會使用以下內容包裝：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

對於非直接聊天（群組／頻道／聊天室），目前訊息主體會加上傳送者標籤作為前綴，其樣式與歷程項目相符。移除指示詞只會套用於目前訊息區段，因此歷程會保持完整。包裝歷程的頻道應將 `BodyForCommands`（或舊版的 `CommandBody`／`RawBody`）設為原始訊息文字，並將 `Body` 保留為合併後的提示詞。

歷程緩衝區僅包含待處理內容：其中包括未觸發執行的群組訊息（例如受提及條件限制的訊息），並排除已在工作階段逐字稿中的訊息。提示詞組裝期間，結構化歷程、回覆、轉寄及頻道中繼資料會呈現為不受信任的使用者角色內容脈絡區塊。

請使用 `messages.groupChat.historyLimit`（全域預設值）或各頻道覆寫（例如 `channels.slack.historyLimit` 及 `channels.telegram.accounts.<id>.historyLimit`）設定歷程大小（將 `0` 設為停用）。

## 工具結果中繼資料

工具結果的 `content` 是模型可見的結果；`details` 則是用於介面呈現、診斷、媒體傳遞及外掛的執行階段中繼資料。

- `toolResult.details` 會在提供者重播及輸入壓縮前移除。
- 持久保存的工作階段逐字稿只會保留有界限的 `details`；過大的中繼資料會替換為標有 `persistedDetailsTruncated: true` 的精簡摘要。
- 外掛及工具應將模型必須讀取的文字放入 `content`，而不應僅放入 `details`。

## 排隊與後續處理

已有執行正在進行時，輸入訊息預設會導向該執行。`messages.queue` 控制模式：

| 模式              | 行為                                            |
| ----------------- | --------------------------------------------------- |
| `steer`（預設） | 將新提示詞注入目前執行。          |
| `followup`        | 在目前執行完成後執行該訊息。      |
| `collect`         | 將相容訊息批次合併至後續單一輪次。      |
| `interrupt`       | 中止目前執行，然後啟動最新的提示詞。 |

佇列針對導向、後續處理及收集批次合併，使用內建的 500ms 防抖。`messages.queue.cap` 的預設值為 20 則排隊訊息，而 `messages.queue.drop` 的預設值為 `summarize`（亦可使用 `old` 及 `new`）。可透過 `messages.queue.byChannel` 及 `messages.queue.debounceMsByChannel` 設定各頻道覆寫。

詳細資訊：[命令佇列](/zh-TW/concepts/queue)及[導向佇列](/zh-TW/concepts/queue-steering)。

## 頻道執行擁有權

頻道外掛可在訊息進入工作階段佇列前維持順序、對輸入進行防抖，並施加傳輸背壓。它們不應針對代理程式輪次本身另行設定逾時。訊息路由至工作階段後，會由工作階段、工具及執行階段生命週期管理長時間執行的工作，使所有頻道都能一致地回報慢速輪次，並從中復原。

## 串流、分塊及批次合併

區塊串流會隨模型產生文字區塊而傳送部分回覆；分塊會遵循頻道文字限制，並避免拆分圍欄程式碼。

- `agents.defaults.blockStreamingDefault`（`on|off`，預設為 `off`）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（依閒置狀態進行批次合併）
- `agents.defaults.humanDelay`（區塊回覆之間類似真人的停頓）
- 頻道覆寫：內建頻道使用 `*.streaming.block.enabled` 及 `*.streaming.block.coalesce`；`openclaw doctor --fix` 會遷移過時的扁平金鑰。除非明確啟用，否則所有頻道（包括 Telegram）的區塊串流皆為關閉。QQ Bot 是例外：它沒有 `streaming.block` 金鑰，且除非 `channels.qqbot.streaming.mode` 為 `"off"`，否則會串流區塊回覆。

詳細資訊：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 推理可見性與 Token

- `/reasoning on|off|stream` 控制可見性。
- 模型產生推理內容時，該內容仍會計入 Token 用量。
- Telegram 支援將推理內容串流至暫存的草稿泡泡，並在最終傳遞後刪除；若要持久輸出推理內容，請使用 `/reasoning on`。

詳細資訊：[思考 + 推理指示詞](/zh-TW/tools/thinking)及 [Token 用量](/zh-TW/reference/token-use)。

## 前綴、討論串與回覆

- 輸出前綴位於 `channels.<channel>.responsePrefix` 及 `channels.<channel>.accounts.<id>.responsePrefix`。帳號值優先。當已設定的頻道區塊未設定這些標準欄位時，Doctor 會將全域回退值複製到其中；`messages.responsePrefix` 仍作為隱含及自訂頻道的回退值。
- 透過 `replyToMode` 及各頻道預設值進行回覆討論串關聯。

詳細資訊：[設定](/zh-TW/gateway/config-agents#messages)及頻道文件。

## 靜默回覆

靜默 Token `NO_REPLY`（不區分大小寫，因此 `no_reply` 亦相符）表示「不要傳遞使用者可見的回覆」。若某輪次另有待處理的工具媒體（例如產生的 TTS 音訊），OpenClaw 會移除靜默文字，但仍會傳遞媒體附件。

靜默政策依對話類型決定：

- 直接對話絕不會收到 `NO_REPLY` 提示詞指引。如果直接執行意外傳回單獨的靜默 Token，OpenClaw 會將其抑制，而非改寫或傳遞。
- 群組／頻道預設允許靜默。在 `message_tool` 可見回覆模式中，靜默表示模型不會呼叫 `message(action=send)`。
- 內部協調預設允許靜默。

預設值位於 `agents.defaults.silentReply` 下；`surfaces.<id>.silentReply` 可依介面覆寫群組／內部政策。

OpenClaw 也會在非直接聊天中，針對一般內部執行器失敗使用靜默回覆，因此群組／頻道不會看到閘道錯誤制式文字。具有使用者可見復原說明的已分類失敗（例如缺少驗證、速率限制或過載通知）仍可傳遞。直接聊天預設顯示精簡的失敗說明；只有啟用 `/verbose full` 時，才會顯示原始執行器詳細資料。

所有介面都會捨棄單獨的靜默回覆，因此父工作階段會保持安靜，而不會將哨兵文字改寫為回退閒聊。

## 相關內容

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 持久傳送與接收設計的目標
- [串流](/zh-TW/concepts/streaming) - 即時訊息傳遞
- [重試](/zh-TW/concepts/retry) - 訊息傳遞重試行為
- [佇列](/zh-TW/concepts/queue) - 訊息處理佇列
- [頻道](/zh-TW/channels) - 訊息平台整合
