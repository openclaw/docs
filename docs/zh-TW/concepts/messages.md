---
read_when:
    - 說明傳入訊息如何變成回覆
    - 釐清工作階段、佇列模式或串流行為
    - 記錄推理可見性及其使用影響
summary: 訊息流程、工作階段、佇列處理與推理可見性
title: 訊息
x-i18n:
    generated_at: "2026-05-10T19:31:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 053ff7b2ecca07e99057aed2f9ba199a6c1a07f15e865915045d25d128db984b
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw 透過一條包含會話解析、佇列處理、串流、工具執行與推理可見性的管線處理傳入訊息。本頁說明從傳入訊息到回覆的路徑。

## 訊息流程（高層級）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要調整項位於設定中：

- `messages.*` 用於前綴、佇列處理與群組行為。
- `agents.defaults.*` 用於區塊串流與分塊預設值。
- 通道覆寫（`channels.whatsapp.*`、`channels.telegram.*` 等）用於上限與串流切換。

完整結構請參閱[設定](/zh-TW/gateway/configuration)。

## 傳入去重

通道可能會在重新連線後重新遞送相同訊息。OpenClaw 會保留一個短效快取，以通道/帳號/對等端/會話/訊息 ID 作為鍵，避免重複遞送觸發另一個代理執行。

## 傳入防抖

來自**同一寄件者**的快速連續訊息，可透過 `messages.inbound` 批次合併成單一代理回合。防抖範圍限定於每個通道 + 對話，並使用最新訊息作為回覆串接/ID。

設定（全域預設 + 每通道覆寫）：

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

注意：

- 防抖套用於**純文字**訊息；媒體/附件會立即排出。
- 控制命令會略過防抖，因此仍會維持獨立。明確選擇啟用同寄件者私訊合併的通道，可以讓私訊命令保留在防抖視窗內，讓分段傳送的承載內容加入同一個代理回合。

## 會話與裝置

會話由 Gateway 擁有，而不是由用戶端擁有。

- 直接聊天會收斂為代理主會話鍵。
- 群組/通道會取得自己的會話鍵。
- 會話儲存區與轉錄記錄位於 Gateway 主機上。

多個裝置/通道可以對應到同一個會話，但歷史記錄不會完整同步回每個用戶端。建議：長對話請使用一個主要裝置，以避免情境分歧。控制 UI 與 TUI 一律顯示 Gateway 支援的會話轉錄記錄，因此它們是真實來源。

詳細資料：[會話管理](/zh-TW/concepts/session)。

## 工具結果中繼資料

工具結果的 `content` 是模型可見的結果。工具結果的 `details` 是用於 UI 轉譯、診斷、媒體遞送與 Plugin 的執行階段中繼資料。

OpenClaw 明確維持這個邊界：

- `toolResult.details` 會在提供者重播與 Compaction 輸入之前移除。
- 持久化的會話轉錄記錄只保留有界的 `details`；過大的中繼資料會替換為標記 `persistedDetailsTruncated: true` 的精簡摘要。
- Plugin 與工具應將模型必須讀取的文字放在 `content`，而不是只放在 `details`。

## 傳入本文與歷史情境

OpenClaw 會區分**提示本文**與**命令本文**：

- `BodyForAgent`：目前訊息面向主要模型的文字。通道 Plugin 應讓它聚焦於寄件者目前帶有提示的文字。
- `Body`：舊版提示備援。這可能包含通道信封與選用的歷史包裝，但在 `BodyForAgent` 可用時，目前通道不應仰賴它作為主要模型輸入。
- `CommandBody`：用於指令/命令剖析的原始使用者文字。
- `RawBody`：`CommandBody` 的舊版別名（保留以維持相容性）。

當通道提供歷史記錄時，會使用共用包裝：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

對於**非直接聊天**（群組/通道/聊天室），**目前訊息本文**會加上寄件者標籤前綴（與歷史項目使用相同樣式）。這會讓代理提示中的即時訊息與佇列/歷史訊息保持一致。

歷史緩衝區是**僅限待處理**：它們包含未觸發執行的群組訊息（例如受提及門檻限制的訊息），並**排除**已在會話轉錄記錄中的訊息。

指令移除只套用於**目前訊息**區段，因此歷史記錄會保持完整。包裝歷史記錄的通道應將 `CommandBody`（或 `RawBody`）設為原始訊息文字，並讓 `Body` 保持為合併後的提示。結構化歷史、回覆、轉寄與通道中繼資料會在提示組裝期間轉譯為使用者角色的不受信任情境區塊。
歷史緩衝區可透過 `messages.groupChat.historyLimit`（全域預設）和每通道覆寫來設定，例如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`（設為 `0` 可停用）。

## 佇列處理與後續回合

如果已有執行正在進行，傳入訊息可以排入佇列、導向目前執行，或收集到後續回合。

- 透過 `messages.queue`（以及 `messages.queue.byChannel`）設定。
- 預設模式是 `steer`，當導向退回到排入佇列的後續遞送時，會有 500ms 的後續防抖。
- 模式：`steer`、`followup`、`collect`、`steer-backlog`、`interrupt`，以及舊版一次一個的 `queue` 模式。

詳細資料：[命令佇列](/zh-TW/concepts/queue)與[導向佇列](/zh-TW/concepts/queue-steering)。

## 通道執行擁有權

通道 Plugin 可以在訊息進入會話佇列之前維持排序、對輸入進行防抖，並套用傳輸反壓。它們不應在代理回合本身周圍施加獨立逾時。一旦訊息被路由到會話，長時間執行的工作會由會話、工具與執行階段生命週期治理，讓所有通道能一致地回報並從緩慢回合中復原。

## 串流、分塊與批次處理

區塊串流會在模型產生文字區塊時傳送部分回覆。分塊會遵守通道文字限制，並避免切分圍欄程式碼。

主要設定：

- `agents.defaults.blockStreamingDefault`（`on|off`，預設關閉）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（以閒置為基礎的批次處理）
- `agents.defaults.humanDelay`（區塊回覆之間類似真人的暫停）
- 通道覆寫：`*.blockStreaming` 與 `*.blockStreamingCoalesce`（非 Telegram 通道需要明確設定 `*.blockStreaming: true`）

詳細資料：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 推理可見性與權杖

OpenClaw 可以公開或隱藏模型推理：

- `/reasoning on|off|stream` 控制可見性。
- 當模型產生推理內容時，它仍會計入權杖使用量。
- Telegram 支援將推理串流到暫時草稿泡泡中，並在最終遞送後刪除；若要持久推理輸出，請使用 `/reasoning on`。

詳細資料：[思考 + 推理指令](/zh-TW/tools/thinking)與[權杖使用量](/zh-TW/reference/token-use)。

## 前綴、串接與回覆

傳出訊息格式集中在 `messages`：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（傳出前綴串接），加上 `channels.whatsapp.messagePrefix`（WhatsApp 傳入前綴）
- 透過 `replyToMode` 與每通道預設值進行回覆串接

詳細資料：[設定](/zh-TW/gateway/config-agents#messages)與通道文件。

## 靜默回覆

精確的靜默權杖 `NO_REPLY` / `no_reply` 表示「不要遞送使用者可見的回覆」。
當某個回合同時有待處理的工具媒體，例如產生的 TTS 音訊，OpenClaw 會移除靜默文字，但仍會遞送媒體附件。
OpenClaw 會依對話類型解析該行為：

- 直接對話預設不允許靜默，並將單獨的靜默回覆改寫為簡短可見的備援。
- 群組/通道預設允許靜默。
- 內部編排預設允許靜默。

OpenClaw 也會將靜默回覆用於發生在非直接聊天中任何助理回覆之前的內部執行器失敗，因此群組/通道不會看到 Gateway 錯誤樣板文字。直接聊天預設會顯示精簡失敗文案；只有在 `/verbose` 為 `on` 或 `full` 時，才會顯示原始執行器詳細資料。

預設值位於 `agents.defaults.silentReply` 與 `agents.defaults.silentReplyRewrite` 下；`surfaces.<id>.silentReply` 與 `surfaces.<id>.silentReplyRewrite` 可以依介面覆寫它們。

當父會話有一個或多個待處理的已衍生子代理執行時，單獨的靜默回覆會在所有介面上被丟棄，而不是被改寫，因此父會話會保持安靜，直到子完成事件遞送真正的回覆。

## 相關

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 目標持久化傳送與接收設計
- [串流](/zh-TW/concepts/streaming) — 即時訊息遞送
- [重試](/zh-TW/concepts/retry) — 訊息遞送重試行為
- [佇列](/zh-TW/concepts/queue) — 訊息處理佇列
- [通道](/zh-TW/channels) — 訊息平台整合
