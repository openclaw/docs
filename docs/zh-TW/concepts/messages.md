---
read_when:
    - 說明傳入訊息如何轉化為回覆
    - 釐清工作階段、佇列模式或串流行為
    - 記錄推理可見性與使用影響
summary: 訊息流程、工作階段、佇列處理與推理可見性
title: 訊息
x-i18n:
    generated_at: "2026-07-20T00:47:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 843b9defdd56f55b8cb43c366f247a740cf851fb86bbef66a422cf8efdebe059
    source_path: concepts/messages.md
    workflow: 16
---

輸入訊息會依序經過路由、去重／防彈跳、代理程式執行，以及輸出傳遞：

```text
輸入訊息
  -> 路由／繫結 -> 工作階段金鑰
  -> 去重 + 防彈跳
  -> 佇列（若已有執行正在進行）
  -> 代理程式執行（串流 + 工具）
  -> 輸出回覆（頻道限制 + 分塊）
```

主要設定介面：

- `messages.*`：用於前綴、排隊、輸入防彈跳和群組行為。
- `agents.defaults.*`：用於區塊串流、分塊和靜默回覆預設值。
- 頻道覆寫（`channels.telegram.*`、`channels.whatsapp.*` 等）：用於各頻道的上限和串流切換設定。

完整結構描述請參閱[設定](/zh-TW/gateway/configuration)。

## 輸入去重

頻道可能會在重新連線後再次傳遞相同訊息。OpenClaw 會保留一個記憶體內快取，以代理程式範圍、頻道路由（頻道 + 對端 + 帳號 + 討論串）和訊息 ID 作為索引鍵，因此重新傳遞的訊息不會觸發第二次代理程式執行。快取項目會在 20 分鐘後，或追蹤的項目達到 5000 筆時到期，以先發生者為準。

## 輸入防彈跳

來自同一傳送者的快速連續文字訊息，可透過 `messages.inbound` 批次合併為單次代理程式回合。防彈跳以頻道 + 對話為範圍，並使用最新訊息進行回覆討論串關聯／ID 設定。

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

- 防彈跳僅套用於純文字訊息；媒體／附件會立即送出。
- 控制命令（停止／中止／狀態等）會略過防彈跳，以便立即分派。
- 預設停用：`messages.inbound.debounceMs` 沒有內建預設值，因此只有在你設定後（全域或各頻道）才會啟用防彈跳。
- iMessage 的 `coalesceSameSenderDms` 選用設定是唯一例外：它會暫存同一傳送者的所有私訊文字（包括命令），等待足夠時間，讓 Apple 將命令 + URL 拆開傳送的內容能以單一回合抵達。無論此設定為何，群組聊天一律立即分派。

## 工作階段與裝置

工作階段由閘道擁有，而非用戶端。

- 直接聊天會合併至代理程式的主要工作階段金鑰。
- 群組／頻道各自取得專屬工作階段金鑰。
- 工作階段儲存區和文字記錄位於閘道主機上。

多個裝置／頻道可對應至同一工作階段，但歷史記錄不會完整同步回每個用戶端。長時間對話請使用單一主要裝置，以免脈絡分歧。控制介面和終端介面一律顯示由閘道支援的工作階段文字記錄，因此它們是唯一可信來源。

詳細資訊：[工作階段管理](/zh-TW/concepts/session)。

## 提示詞本文與歷史脈絡

頻道外掛會在輸入脈絡中填入數個文字欄位，以下依優先順序由高至低排列：

| 欄位              | 用途                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `BodyForAgent`    | 當前回合中模型可見的文字。未設定時會退回使用 `CommandBody` / `RawBody` / `Body`。        |
| `BodyForCommands` | 用於剖析指令／命令的乾淨文字。未設定時會退回使用 `CommandBody` / `RawBody` / `Body`。 |
| `CommandBody`     | 舊版中介本文；建議使用 `BodyForCommands`。                                                         |
| `RawBody`         | `CommandBody` 的已棄用別名。                                                                         |
| `Body`            | 舊版提示詞本文；可能包含頻道封套和歷史記錄包裝。                                     |

頻道提供歷史記錄時，會使用以下內容包裝：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

對於非直接聊天（群組／頻道／聊天室），當前訊息本文會加上傳送者標籤作為前綴，與歷史記錄項目使用的樣式一致。移除指令僅套用於當前訊息區段，因此歷史記錄會保持完整。包裝歷史記錄的頻道應將 `BodyForCommands`（或舊版 `CommandBody` / `RawBody`）設為原始訊息文字，並將合併後的提示詞保留在 `Body` 中。

歷史記錄緩衝區只包含待處理內容：其中包括未觸發執行的群組訊息（例如受提及條件限制的訊息），但不包括工作階段文字記錄中已有的訊息。在組裝提示詞時，結構化歷史記錄、回覆、轉寄內容及頻道中繼資料會呈現為不受信任的使用者角色脈絡區塊。

使用 `messages.groupChat.historyLimit`（全域預設值）或各頻道覆寫（例如 `channels.slack.historyLimit` 和 `channels.telegram.accounts.<id>.historyLimit`）設定歷史記錄大小（將 `0` 設為停用）。

## 工具結果中繼資料

工具結果的 `content` 是模型可見的結果；`details` 則是用於介面呈現、診斷、媒體傳遞和外掛的執行階段中繼資料。

- `toolResult.details` 會在重新傳送給供應商之前，以及作為壓縮輸入之前移除。
- 持久保存的工作階段文字記錄只會保留有界限的 `details`；過大的中繼資料會替換為標示 `persistedDetailsTruncated: true` 的精簡摘要。
- 外掛和工具應將模型必須讀取的文字放入 `content`，而不是只放在 `details` 中。

## 排隊與後續訊息

當已有執行正在進行時，輸入訊息預設會導向該次執行。`messages.queue` 控制模式：

| 模式              | 行為                                                |
| ----------------- | --------------------------------------------------- |
| `steer`（預設） | 將新提示詞注入進行中的執行。                        |
| `followup`        | 在進行中的執行完成後處理訊息。                      |
| `collect`         | 將相容訊息批次合併至稍後的單一回合。                |
| `interrupt`       | 中止進行中的執行，然後啟動最新的提示詞。            |

佇列針對導向、後續訊息和收集批次處理，使用內建的 500ms 防彈跳。`messages.queue.cap` 預設最多排入 20 則訊息，而 `messages.queue.drop` 預設為 `summarize`（也可使用 `old` 和 `new`）。透過 `messages.queue.byChannel` 和 `messages.queue.debounceMsByChannel` 設定各頻道覆寫。

詳細資訊：[命令佇列](/zh-TW/concepts/queue)和[導向佇列](/zh-TW/concepts/queue-steering)。

## 頻道執行的擁有權

頻道外掛可在訊息進入工作階段佇列前維持順序、對輸入進行防彈跳，以及套用傳輸反向壓力。它們不應在代理程式回合本身外圍另行施加逾時。訊息路由至工作階段後，長時間執行工作的管理會交由工作階段、工具和執行階段生命週期負責，讓所有頻道都能以一致方式回報緩慢回合並從中復原。

## 串流、分塊與批次處理

區塊串流會在模型產生文字區塊時傳送部分回覆；分塊會遵守頻道文字限制，並避免分割圍欄程式碼。

- `agents.defaults.blockStreamingDefault`（`on|off`，預設為 `off`）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（以閒置時間為準的批次處理）
- `agents.defaults.humanDelay`（區塊回覆之間模擬真人的停頓）
- 頻道覆寫：內建頻道使用 `*.streaming.block.enabled` 和 `*.streaming.block.coalesce`；過時的扁平索引鍵由 `openclaw doctor --fix` 遷移。除非明確啟用，否則所有頻道（包括 Telegram）的區塊串流皆為關閉。QQ Bot 是例外：它沒有 `streaming.block` 索引鍵，且除非 `channels.qqbot.streaming.mode` 為 `"off"`，否則會以串流方式傳送區塊回覆。

詳細資訊：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 推理可見性與權杖

- `/reasoning on|off|stream` 控制可見性。
- 模型產生的推理內容仍會計入權杖用量。
- Telegram 支援將推理內容以串流方式傳送至暫時的草稿氣泡，並在最終內容送達後刪除；若要持久輸出推理內容，請使用 `/reasoning on`。

詳細資訊：[思考 + 推理指令](/zh-TW/tools/thinking)和[權杖用量](/zh-TW/reference/token-use)。

## 前綴、討論串與回覆

- 輸出前綴串接順序：`messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。WhatsApp 另有用於輸入前綴的 `channels.whatsapp.messagePrefix`。
- 透過 `replyToMode` 和各頻道預設值進行回覆討論串關聯。

詳細資訊：[設定](/zh-TW/gateway/config-agents#messages)和頻道文件。

## 靜默回覆

靜默權杖 `NO_REPLY`（不區分大小寫，因此 `no_reply` 也會相符）表示「不要傳遞使用者可見的回覆」。當回合中還有待處理的工具媒體（例如產生的 TTS 音訊）時，OpenClaw 會移除靜默文字，但仍會傳遞媒體附件。

靜默政策依對話類型決定：

- 直接對話絕不會收到 `NO_REPLY` 提示詞指引。如果直接執行意外傳回單獨的靜默權杖，OpenClaw 會予以抑制，而不會重寫或傳遞。
- 群組／頻道預設允許靜默。在 `message_tool` 可見回覆模式中，靜默表示模型不會呼叫 `message(action=send)`。
- 內部協調流程預設允許靜默。

預設值位於 `agents.defaults.silentReply` 下；`surfaces.<id>.silentReply` 可依各介面覆寫群組／內部政策。

OpenClaw 也會在非直接聊天中，針對一般內部執行器失敗使用靜默回覆，因此群組／頻道不會看到閘道錯誤的制式文字。已分類且附有使用者可見復原說明的失敗（例如缺少驗證、速率限制或過載通知）仍可傳遞。直接聊天預設會顯示精簡的失敗說明；只有啟用 `/verbose full` 時，才會顯示原始執行器詳細資訊。

所有介面都會捨棄單獨的靜默回覆，因此父工作階段會保持安靜，而不會將哨兵文字重寫成備援閒聊內容。

## 相關內容

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 目標為耐久的傳送與接收設計
- [串流](/zh-TW/concepts/streaming) - 即時訊息傳遞
- [重試](/zh-TW/concepts/retry) - 訊息傳遞重試行為
- [佇列](/zh-TW/concepts/queue) - 訊息處理佇列
- [頻道](/zh-TW/channels) - 訊息平台整合
