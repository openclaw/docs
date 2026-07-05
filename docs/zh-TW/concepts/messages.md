---
read_when:
    - 說明傳入訊息如何變成回覆
    - 釐清工作階段、佇列模式或串流行為
    - 記錄推理可見性與使用影響
summary: 訊息流程、工作階段、佇列處理與推理可見性
title: 訊息
x-i18n:
    generated_at: "2026-07-05T11:14:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92146d8fe08aedfea3ae01b653a303da626651b33b39d6beb22ef867e13eef2f
    source_path: concepts/messages.md
    workflow: 16
---

傳入訊息會經過路由、去重／防抖、代理執行，以及傳出傳遞：

```text
Inbound message
  -> routing/bindings -> session key
  -> dedupe + debounce
  -> queue (if a run is already active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要設定介面：

- `messages.*` 用於前綴、排隊、傳入防抖，以及群組行為。
- `agents.defaults.*` 用於區塊串流、分塊，以及靜默回覆預設值。
- 通道覆寫（`channels.telegram.*`、`channels.whatsapp.*` 等）用於各通道上限與串流切換。

完整結構描述請參閱[設定](/zh-TW/gateway/configuration)。

## 傳入去重

通道可能會在重新連線後重新傳遞同一則訊息。OpenClaw 會保留一個記憶體內快取，以代理範圍、通道路由（通道 + 對等端 + 帳號 + 執行緒）和訊息 ID 為鍵，因此重新傳遞的訊息不會觸發第二次代理執行。快取項目會在 20 分鐘後，或追蹤到 5000 個項目時過期，以先發生者為準。

## 傳入防抖

來自同一寄件者的快速連續文字訊息，可以透過 `messages.inbound` 批次合併成一次代理回合。防抖的範圍是每個通道 + 對話，並使用最新訊息作為回覆執行緒／ID。

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

- 防抖適用於純文字訊息；媒體／附件會立即清空緩衝。
- 控制命令（stop/abort/status 等）會略過防抖，因此會立即派送。
- 預設停用：`messages.inbound.debounceMs` 沒有內建預設值，因此只有在你設定後（全域或每通道），防抖才會啟用。
- iMessage 的 `coalesceSameSenderDms` 選用設定是唯一例外：它會保留所有同寄件者 DM 文字（包含命令）足夠久，讓 Apple 的命令 + URL 分開傳送能以同一回合抵達。不論此設定為何，群組聊天一律立即派送。

## 工作階段與裝置

工作階段由閘道擁有，而不是由用戶端擁有。

- 直接聊天會收合到代理的主要工作階段鍵。
- 群組／通道會取得自己的工作階段鍵。
- 工作階段儲存區與文字記錄位於閘道主機上。

多個裝置／通道可以對應到同一個工作階段，但歷史記錄不會完整同步回每個用戶端。長時間對話請使用一個主要裝置，以避免脈絡分歧。控制 UI 與終端介面一律顯示由閘道支援的工作階段文字記錄，因此它們是事實來源。

詳細資訊：[工作階段管理](/zh-TW/concepts/session)。

## 提示本文與歷史脈絡

通道外掛會在傳入脈絡上填入數個文字欄位，優先順序由高到低如下：

| 欄位              | 用途                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | 目前回合面向模型的文字。未設定時會退回到 `CommandBody` / `RawBody` / `Body`。                         |
| `BodyForCommands` | 用於指令／命令剖析的乾淨文字。未設定時會退回到 `CommandBody` / `RawBody` / `Body`。                   |
| `CommandBody`     | 舊版中介本文；優先使用 `BodyForCommands`。                                                            |
| `RawBody`         | `CommandBody` 的已棄用別名。                                                                          |
| `Body`            | 舊版提示本文；可能包含通道信封與歷史包裝。                                                            |

當通道提供歷史記錄時，會用以下內容包裝：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

對於非直接聊天（群組／通道／房間），目前訊息本文會加上寄件者標籤作為前綴，與歷史項目使用的樣式一致。指令剝除只會套用到目前訊息區段，因此歷史記錄會保持完整。包裝歷史記錄的通道應將 `BodyForCommands`（或舊版 `CommandBody` / `RawBody`）設為原始訊息文字，並將 `Body` 保留為合併後的提示。

歷史緩衝區僅包含待處理內容：它們包含未觸發執行的群組訊息（例如受提及門檻限制的訊息），並排除已在工作階段文字記錄中的訊息。結構化歷史、回覆、轉寄，以及通道中繼資料會在提示組裝期間呈現為不受信任的使用者角色脈絡區塊。

使用 `messages.groupChat.historyLimit`（全域預設值）或每通道覆寫（例如 `channels.slack.historyLimit` 與 `channels.telegram.accounts.<id>.historyLimit`）設定歷史大小（設為 `0` 可停用）。

## 工具結果中繼資料

工具結果 `content` 是模型可見的結果；`details` 是用於 UI 呈現、診斷、媒體傳遞與外掛的執行階段中繼資料。

- `toolResult.details` 會在供應商重播前，以及壓縮輸入前被剝除。
- 持久化的工作階段文字記錄只會保留有界限的 `details`；過大的中繼資料會以標記為 `persistedDetailsTruncated: true` 的精簡摘要取代。
- 外掛與工具應將模型必須閱讀的文字放在 `content`，而不是只放在 `details`。

## 排隊與後續訊息

當已有執行處於作用中時，傳入訊息預設會導向其中。`messages.queue` 控制模式：

| 模式              | 行為                                                |
| ----------------- | --------------------------------------------------- |
| `steer`（預設）   | 將新提示注入作用中的執行。                          |
| `followup`        | 在作用中的執行完成後執行該訊息。                    |
| `collect`         | 將相容訊息批次合併成稍後的一個回合。                |
| `interrupt`       | 中止作用中的執行，然後啟動最新提示。                |

預設值：`messages.queue.debounceMs` 為 500ms（同樣適用於 steer、followup 與 collect 批次處理）、`messages.queue.cap` 為 20 則已排隊訊息，而 `messages.queue.drop` 為 `summarize`（也可使用 `old` 與 `new`）。透過 `messages.queue.byChannel` 與 `messages.queue.debounceMsByChannel` 設定每通道覆寫。

詳細資訊：[命令佇列](/zh-TW/concepts/queue)與[導向佇列](/zh-TW/concepts/queue-steering)。

## 通道執行所有權

通道外掛可在訊息進入工作階段佇列前保留順序、對輸入防抖，並套用傳輸背壓。它們不應對代理回合本身施加個別逾時。一旦訊息路由到工作階段，工作階段、工具與執行階段生命週期會管理長時間執行的工作，讓所有通道能一致地回報並從緩慢回合中復原。

## 串流、分塊與批次處理

區塊串流會在模型產生文字區塊時傳送部分回覆；分塊會遵守通道文字限制，並避免分割圍欄程式碼。

- `agents.defaults.blockStreamingDefault`（`on|off`，預設 `off`）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（以閒置為基礎的批次處理）
- `agents.defaults.humanDelay`（區塊回覆之間類似人類的暫停）
- 通道覆寫：`*.blockStreaming` 與 `*.blockStreamingCoalesce`（除非每個通道上的 `*.blockStreaming` 明確設為 `true`，否則區塊串流為關閉，包含 Telegram）。

詳細資訊：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 推理可見性與權杖

- `/reasoning on|off|stream` 控制可見性。
- 當模型產生推理內容時，推理內容仍會計入權杖使用量。
- Telegram 支援將推理串流到暫時草稿泡泡中，並在最終傳遞後刪除；使用 `/reasoning on` 可取得持久化推理輸出。

詳細資訊：[思考 + 推理指令](/zh-TW/tools/thinking)與[權杖使用](/zh-TW/reference/token-use)。

## 前綴、執行緒與回覆

- 傳出前綴串接：`messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。WhatsApp 也有 `channels.whatsapp.messagePrefix` 作為傳入前綴。
- 透過 `replyToMode` 與每通道預設值進行回覆執行緒處理。

詳細資訊：[設定](/zh-TW/gateway/config-agents#messages)與通道文件。

## 靜默回覆

靜默權杖 `NO_REPLY`（不區分大小寫，因此 `no_reply` 也會相符）表示「不要傳遞使用者可見的回覆」。當某個回合同時有待處理的工具媒體，例如產生的 TTS 音訊時，OpenClaw 會剝除靜默文字，但仍會傳遞媒體附件。

靜默策略依對話類型解析：

- 直接對話永遠不會收到 `NO_REPLY` 提示指引。如果直接執行意外傳回單獨的靜默權杖，OpenClaw 會抑制它，而不是改寫或傳遞它。
- 群組／通道預設允許靜默。在 `message_tool` 可見回覆模式中，靜默表示模型不會呼叫 `message(action=send)`。
- 內部編排預設允許靜默。

預設值位於 `agents.defaults.silentReply` 底下；`surfaces.<id>.silentReply` 可依介面覆寫群組／內部策略。

OpenClaw 也會在非直接聊天中，針對一般內部執行器失敗使用靜默回覆，因此群組／通道不會看到閘道錯誤樣板文字。具有使用者可見復原文案的已分類失敗，例如缺少驗證、速率限制或過載通知，仍可傳遞。直接聊天預設顯示精簡失敗文案；只有啟用 `/verbose full` 時才會顯示原始執行器詳細資料。

單獨的靜默回覆會在所有介面上遭到丟棄，因此父工作階段會保持安靜，而不是將哨兵文字改寫成備援閒聊。

## 相關

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 目標為持久傳送與接收設計
- [串流](/zh-TW/concepts/streaming) - 即時訊息傳遞
- [重試](/zh-TW/concepts/retry) - 訊息傳遞重試行為
- [佇列](/zh-TW/concepts/queue) - 訊息處理佇列
- [通道](/zh-TW/channels) - 訊息平台整合
