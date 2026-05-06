---
read_when:
    - 說明傳入訊息如何變成回覆
    - 釐清工作階段、佇列模式或串流行為
    - 記錄推理可見性與使用上的影響
summary: 訊息流程、工作階段、佇列處理與推理可見性
title: 訊息
x-i18n:
    generated_at: "2026-05-06T02:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f4861a6d0af11174f8067e9c6d4afb1a8e54f1eb79484d6bbac28dc10b4cf88
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw 透過由工作階段解析、佇列、串流、工具執行與推理可見性組成的管線處理傳入訊息。本頁說明從傳入訊息到回覆的路徑。

## 訊息流程（高階）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要控制項位於設定中：

- `messages.*` 用於前置詞、佇列與群組行為。
- `agents.defaults.*` 用於區塊串流與分段預設值。
- 頻道覆寫（`channels.whatsapp.*`、`channels.telegram.*` 等）用於上限與串流切換。

完整結構請參閱[設定](/zh-TW/gateway/configuration)。

## 傳入去重

頻道可能會在重新連線後重新傳遞同一則訊息。OpenClaw 會保留一個
短生命週期快取，以頻道/帳號/對等端/工作階段/訊息 ID 作為鍵，讓重複
傳遞不會觸發另一個代理程式執行。

## 傳入防抖

來自**同一寄件者**的快速連續訊息，可以透過 `messages.inbound` 批次處理成單一
代理程式回合。防抖範圍限定於每個頻道 + 對話，
並使用最新訊息作為回覆串接/ID。

設定（全域預設值 + 每頻道覆寫）：

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

注意事項：

- 防抖套用於**純文字**訊息；媒體/附件會立即清空緩衝並送出。
- 控制指令會略過防抖，因此保持獨立處理 — **除非**頻道明確選擇加入同寄件者 DM 合併（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-TW/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），此時 DM 指令會在防抖視窗內等待，讓分次傳送的內容可以加入同一個代理程式回合。

## 工作階段與裝置

工作階段由 Gateway 擁有，而不是由用戶端擁有。

- 直接聊天會收斂到代理程式主要工作階段鍵。
- 群組/頻道會取得自己的工作階段鍵。
- 工作階段儲存區與逐字稿位於 Gateway 主機上。

多個裝置/頻道可以對應到同一個工作階段，但歷史記錄不會完整
同步回每個用戶端。建議：長對話使用一個主要裝置，以避免情境分歧。Control UI 與 TUI 一律顯示
由 Gateway 支援的工作階段逐字稿，因此它們是事實來源。

詳細資訊：[工作階段管理](/zh-TW/concepts/session)。

## 工具結果中繼資料

工具結果 `content` 是模型可見的結果。工具結果 `details` 是
用於 UI 轉譯、診斷、媒體傳遞與 Plugin 的執行階段中繼資料。

OpenClaw 明確保留該邊界：

- `toolResult.details` 會在提供者重播與 Compaction 輸入前被移除。
- 持久化的工作階段逐字稿只保留有界限的 `details`；過大的中繼資料
  會被替換為標記 `persistedDetailsTruncated: true` 的精簡摘要。
- Plugin 與工具應將模型必須閱讀的文字放在 `content`，而不是只放在
  `details`。

## 傳入本文與歷史情境

OpenClaw 會區分**提示本文**與**指令本文**：

- `BodyForAgent`：目前訊息中面向主要模型的文字。頻道
  Plugin 應讓這段內容專注於寄件者目前帶有提示的文字。
- `Body`：舊版提示備援。這可能包含頻道信封與
  選用的歷史包裝，但在 `BodyForAgent` 可用時，目前頻道不應依賴它作為
  主要模型輸入。
- `CommandBody`：用於指示/指令剖析的原始使用者文字。
- `RawBody`：`CommandBody` 的舊版別名（為相容性保留）。

當頻道提供歷史記錄時，會使用共用包裝：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

對於**非直接聊天**（群組/頻道/聊天室），**目前訊息本文**會加上
寄件者標籤前置詞（與歷史項目使用相同樣式）。這會讓代理程式提示中的即時訊息與佇列/歷史
訊息保持一致。

歷史緩衝區為**僅限待處理**：它們包含未
觸發執行的群組訊息（例如受提及門檻限制的訊息），並**排除**
已在工作階段逐字稿中的訊息。

指示剝除只套用於**目前訊息**區段，因此歷史
保持完整。包裝歷史記錄的頻道應將 `CommandBody`（或
`RawBody`）設為原始訊息文字，並讓 `Body` 保持為合併後的提示。
結構化歷史、回覆、轉寄與頻道中繼資料會在提示組裝期間轉譯為
使用者角色的不受信任情境區塊。
歷史緩衝區可透過 `messages.groupChat.historyLimit`（全域
預設值）以及 `channels.slack.historyLimit` 或
`channels.telegram.accounts.<id>.historyLimit` 等每頻道覆寫來設定（設為 `0` 可停用）。

## 佇列與後續回合

如果執行已在進行中，傳入訊息可以排入佇列、導向
目前執行，或收集到後續回合中。

- 透過 `messages.queue`（以及 `messages.queue.byChannel`）設定。
- 預設模式為 `steer`，當導向退回為佇列後續傳遞時，會使用 500ms 後續防抖。
- 模式：`steer`、`followup`、`collect`、`steer-backlog`、`interrupt`，以及
  舊版一次一個的 `queue` 模式。

詳細資訊：[指令佇列](/zh-TW/concepts/queue)與[導向佇列](/zh-TW/concepts/queue-steering)。

## 頻道執行所有權

頻道 Plugin 可以在訊息進入工作階段佇列前保留順序、防抖輸入，並套用傳輸
反壓。它們不應對代理程式回合本身施加
獨立逾時。訊息一旦路由到
工作階段，長時間執行的工作就由工作階段、工具與執行階段
生命週期控管，讓所有頻道一致地回報並從緩慢回合中復原。

## 串流、分段與批次處理

區塊串流會在模型產生文字區塊時傳送部分回覆。
分段會遵守頻道文字限制，並避免拆分圍欄程式碼。

主要設定：

- `agents.defaults.blockStreamingDefault` (`on|off`，預設關閉)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce`（以閒置為基礎的批次處理）
- `agents.defaults.humanDelay`（區塊回覆之間類似人類的暫停）
- 頻道覆寫：`*.blockStreaming` 與 `*.blockStreamingCoalesce`（非 Telegram 頻道需要明確設定 `*.blockStreaming: true`）

詳細資訊：[串流 + 分段](/zh-TW/concepts/streaming)。

## 推理可見性與權杖

OpenClaw 可以公開或隱藏模型推理：

- `/reasoning on|off|stream` 控制可見性。
- 模型產生推理內容時，它仍會計入權杖用量。
- Telegram 支援將推理串流到暫時草稿泡泡，並在最終傳遞後刪除；若要保留推理輸出，請使用 `/reasoning on`。

詳細資訊：[思考 + 推理指示](/zh-TW/tools/thinking)與[權杖使用](/zh-TW/reference/token-use)。

## 前置詞、串接與回覆

傳出訊息格式集中於 `messages`：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 與 `channels.<channel>.accounts.<id>.responsePrefix`（傳出前置詞串接），加上 `channels.whatsapp.messagePrefix`（WhatsApp 傳入前置詞）
- 透過 `replyToMode` 與每頻道預設值進行回覆串接

詳細資訊：[設定](/zh-TW/gateway/config-agents#messages)與頻道文件。

## 靜默回覆

精確的靜默權杖 `NO_REPLY` / `no_reply` 代表「不要傳遞使用者可見的回覆」。
當一個回合也有待處理的工具媒體，例如產生的 TTS 音訊時，OpenClaw
會剝除靜默文字，但仍會傳遞媒體附件。
OpenClaw 會依對話類型解析該行為：

- 直接對話預設不允許靜默，並將單獨的靜默
  回覆改寫為簡短的可見備援。
- 群組/頻道預設允許靜默。
- 內部編排預設允許靜默。

OpenClaw 也會將靜默回覆用於在非直接聊天中任何助理回覆前
發生的內部執行器失敗，因此群組/頻道不會看到
Gateway 錯誤樣板文字。直接聊天預設顯示精簡失敗文案；
原始執行器詳細資訊只有在 `/verbose` 為 `on` 或 `full` 時才會顯示。

預設值位於 `agents.defaults.silentReply` 與
`agents.defaults.silentReplyRewrite` 之下；`surfaces.<id>.silentReply` 與
`surfaces.<id>.silentReplyRewrite` 可以依介面覆寫它們。

當父工作階段有一個或多個待處理的已生成子代理程式執行時，單獨的
靜默回覆會在所有介面上被丟棄而不是改寫，讓
父工作階段保持安靜，直到子項完成事件傳遞真正的回覆。

## 相關

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 目標為持久的傳送與接收設計
- [串流](/zh-TW/concepts/streaming) — 即時訊息傳遞
- [重試](/zh-TW/concepts/retry) — 訊息傳遞重試行為
- [佇列](/zh-TW/concepts/queue) — 訊息處理佇列
- [頻道](/zh-TW/channels) — 訊息平台整合
