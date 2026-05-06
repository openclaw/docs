---
read_when:
    - 說明傳入訊息如何成為回覆
    - 釐清工作階段、排隊模式或串流行為
    - 說明推理可見性與使用影響
summary: 訊息流程、工作階段、佇列處理與推理可見性
title: 訊息
x-i18n:
    generated_at: "2026-05-06T09:06:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1cb21bb1ecfb90c91f5117c76378248f846ace16401c226986ab3cca40a3e33
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

主要調整項位於設定中：

- `messages.*` 用於前綴、佇列與群組行為。
- `agents.defaults.*` 用於區塊串流與分塊預設值。
- 頻道覆寫（`channels.whatsapp.*`、`channels.telegram.*` 等）用於上限與串流切換。

完整結構請參閱[設定](/zh-TW/gateway/configuration)。

## 傳入訊息去重

頻道在重新連線後可能會重新投遞相同訊息。OpenClaw 會保留一個短期快取，依 channel/account/peer/session/message id 作為鍵，避免重複投遞觸發另一個代理程式執行。

## 傳入訊息防抖

來自**同一寄件者**的快速連續訊息，可以透過 `messages.inbound` 批次合併成單一代理程式回合。防抖範圍限定於每個頻道 + 對話，並使用最新訊息進行回覆串接/ID。

設定（全域預設 + 每頻道覆寫）：

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

- 防抖套用於**純文字**訊息；媒體/附件會立即刷新。
- 控制指令會略過防抖，因此會保持獨立處理，**除非**某個頻道明確選擇啟用同一寄件者 DM 合併（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-TW/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），此時 DM 指令會在防抖視窗內等待，讓分段傳送的負載可加入同一個代理程式回合。

## 工作階段與裝置

工作階段由 Gateway 擁有，而不是由用戶端擁有。

- 直接聊天會摺疊到代理程式主要工作階段鍵。
- 群組/頻道會取得各自的工作階段鍵。
- 工作階段儲存區與逐字稿位於 Gateway 主機上。

多個裝置/頻道可以對應到同一個工作階段，但歷史記錄不會完整同步回每個用戶端。建議：長對話使用一個主要裝置，以避免情境分歧。Control UI 和 TUI 永遠顯示由 Gateway 支援的工作階段逐字稿，因此它們是事實來源。

詳細資訊：[工作階段管理](/zh-TW/concepts/session)。

## 工具結果中繼資料

工具結果 `content` 是模型可見的結果。工具結果 `details` 是用於 UI 轉譯、診斷、媒體投遞與 plugins 的執行階段中繼資料。

OpenClaw 會明確維持該邊界：

- `toolResult.details` 會在提供者重播與 Compaction 輸入之前被移除。
- 持久化的工作階段逐字稿只保留有界限的 `details`；過大的中繼資料會替換為標記 `persistedDetailsTruncated: true` 的精簡摘要。
- Plugins 和工具應將模型必須閱讀的文字放在 `content` 中，而不只放在 `details` 中。

## 傳入本文與歷史情境

OpenClaw 會區分**提示本文**與**指令本文**：

- `BodyForAgent`：目前訊息中主要面向模型的文字。頻道 plugins 應讓它專注於寄件者目前承載提示的文字。
- `Body`：舊版提示備援。這可能包含頻道信封與選用的歷史包裝，但目前頻道在 `BodyForAgent` 可用時，不應依賴它作為主要模型輸入。
- `CommandBody`：用於指示/指令解析的原始使用者文字。
- `RawBody`：`CommandBody` 的舊版別名（保留以維持相容性）。

當頻道提供歷史記錄時，會使用共用包裝：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

對於**非直接聊天**（群組/頻道/聊天室），**目前訊息本文**會加上寄件者標籤作為前綴（與歷史項目使用相同樣式）。這讓即時訊息與佇列/歷史訊息在代理程式提示中保持一致。

歷史緩衝區是**僅限待處理**：它們包含未觸發執行的群組訊息（例如受提及閘控的訊息），並**排除**已在工作階段逐字稿中的訊息。

指示剝除只套用於**目前訊息**區段，因此歷史記錄會保持完整。包裝歷史記錄的頻道應將 `CommandBody`（或 `RawBody`）設為原始訊息文字，並將 `Body` 保持為合併後的提示。結構化歷史、回覆、轉寄與頻道中繼資料會在提示組裝期間轉譯為使用者角色的不受信任情境區塊。
歷史緩衝區可透過 `messages.groupChat.historyLimit`（全域預設）與每頻道覆寫（如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`）設定（設為 `0` 可停用）。

## 佇列與後續回合

如果已有執行處於作用中，傳入訊息可被排入佇列、導向目前執行，或收集到後續回合。

- 透過 `messages.queue`（以及 `messages.queue.byChannel`）設定。
- 預設模式為 `steer`，當導向回退為佇列後續投遞時，會有 500ms 的後續防抖。
- 模式：`steer`、`followup`、`collect`、`steer-backlog`、`interrupt`，以及舊版一次一個的 `queue` 模式。

詳細資訊：[指令佇列](/zh-TW/concepts/queue)和[導向佇列](/zh-TW/concepts/queue-steering)。

## 頻道執行所有權

頻道 plugins 可以在訊息進入工作階段佇列之前保留順序、防抖輸入，並套用傳輸反壓。它們不應對代理程式回合本身施加單獨的逾時。一旦訊息被路由到工作階段，長時間執行的工作就由工作階段、工具與執行階段生命週期控管，讓所有頻道都能一致地回報並從緩慢回合中復原。

## 串流、分塊與批次處理

區塊串流會在模型產生文字區塊時傳送部分回覆。
分塊會遵守頻道文字限制，並避免拆分 fenced code。

主要設定：

- `agents.defaults.blockStreamingDefault`（`on|off`，預設關閉）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（以閒置為基礎的批次處理）
- `agents.defaults.humanDelay`（區塊回覆之間類似真人的暫停）
- 頻道覆寫：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 頻道需要明確設定 `*.blockStreaming: true`）

詳細資訊：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 推理可見性與權杖

OpenClaw 可以顯示或隱藏模型推理：

- `/reasoning on|off|stream` 控制可見性。
- 推理內容由模型產生時，仍會計入權杖用量。
- Telegram 支援將推理串流到暫時的草稿泡泡，最終投遞後會刪除；使用 `/reasoning on` 取得持久推理輸出。

詳細資訊：[思考 + 推理指示](/zh-TW/tools/thinking)和[權杖使用](/zh-TW/reference/token-use)。

## 前綴、串接與回覆

傳出訊息格式集中在 `messages` 中：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（傳出前綴串接），以及 `channels.whatsapp.messagePrefix`（WhatsApp 傳入前綴）
- 透過 `replyToMode` 與每頻道預設值進行回覆串接

詳細資訊：[設定](/zh-TW/gateway/config-agents#messages)和頻道文件。

## 靜默回覆

精確的靜默權杖 `NO_REPLY` / `no_reply` 表示「不要投遞使用者可見的回覆」。
當某個回合也有待處理工具媒體（例如產生的 TTS 音訊）時，OpenClaw 會剝除靜默文字，但仍會投遞媒體附件。
OpenClaw 會依對話類型解析該行為：

- 直接對話預設不允許靜默，並會將單獨的靜默回覆改寫為簡短可見的備援。
- 群組/頻道預設允許靜默。
- 內部編排預設允許靜默。

OpenClaw 也會針對在非直接聊天中、任何助理回覆之前發生的內部執行器失敗使用靜默回覆，因此群組/頻道不會看到 Gateway 錯誤樣板文字。直接聊天預設顯示精簡的失敗文案；只有在 `/verbose` 為 `on` 或 `full` 時，才會顯示原始執行器詳細資訊。

預設值位於 `agents.defaults.silentReply` 和 `agents.defaults.silentReplyRewrite` 下；`surfaces.<id>.silentReply` 和 `surfaces.<id>.silentReplyRewrite` 可以依表面覆寫它們。

當父工作階段有一個或多個待處理的已產生子代理程式執行時，單獨的靜默回覆會在所有表面上被丟棄而不是改寫，讓父工作階段保持安靜，直到子項完成事件投遞真正的回覆。

## 相關

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 目標為持久的傳送與接收設計
- [串流](/zh-TW/concepts/streaming) — 即時訊息投遞
- [重試](/zh-TW/concepts/retry) — 訊息投遞重試行為
- [佇列](/zh-TW/concepts/queue) — 訊息處理佇列
- [頻道](/zh-TW/channels) — 訊息平台整合
