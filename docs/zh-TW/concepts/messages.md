---
read_when:
    - 說明傳入訊息如何變成回覆
    - 釐清工作階段、佇列模式或串流行為
    - 記錄推理可見性與使用上的影響
summary: 訊息流程、工作階段、佇列處理和推理可見性
title: 訊息
x-i18n:
    generated_at: "2026-05-04T07:03:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15242e21fd17a9f2013561003e108d197204d834caf51bbcdc53ffb3f118b14f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw 透過工作階段解析、佇列、串流、工具執行與推理可見性的管線處理入站訊息。本頁說明從入站訊息到回覆的路徑。

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

完整結構描述請參閱[設定](/zh-TW/gateway/configuration)。

## 入站去重

頻道可能會在重新連線後重新投遞相同訊息。OpenClaw 會保留一個以頻道/帳戶/對等端/工作階段/訊息 ID 為鍵的短期快取，因此重複投遞不會觸發另一個 agent 執行。

## 入站防抖

來自**同一寄件者**的快速連續訊息可透過 `messages.inbound` 批次合併為單一 agent 輪次。防抖範圍限定於每個頻道 + 對話，並使用最新訊息進行回覆串接/ID。

設定（全域預設 + 各頻道覆寫）：

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

- 防抖適用於**純文字**訊息；媒體/附件會立即清空緩衝。
- 控制命令會繞過防抖，因此仍會保持獨立 — **除非**頻道明確選擇加入同一寄件者 DM 合併（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-TW/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），此時 DM 命令會在防抖視窗內等待，讓分段傳送的承載內容可加入同一個 agent 輪次。

## 工作階段與裝置

工作階段由 Gateway 擁有，而不是由用戶端擁有。

- 直接聊天會收斂到 agent 主要工作階段鍵。
- 群組/頻道會取得自己的工作階段鍵。
- 工作階段儲存與逐字稿位於 Gateway 主機上。

多個裝置/頻道可以對應到同一個工作階段，但歷史記錄不會完整同步回每個用戶端。建議：長對話使用一個主要裝置，以避免上下文分歧。Control UI 和 TUI 永遠顯示由 Gateway 支援的工作階段逐字稿，因此它們是事實來源。

詳情：[工作階段管理](/zh-TW/concepts/session)。

## 工具結果中繼資料

工具結果 `content` 是模型可見的結果。工具結果 `details` 是供 UI 呈現、診斷、媒體投遞與 Plugin 使用的執行階段中繼資料。

OpenClaw 明確維持此邊界：

- `toolResult.details` 會在供應商重播與 Compaction 輸入前被移除。
- 持久化的工作階段逐字稿只保留受限的 `details`；過大的中繼資料會替換為標記 `persistedDetailsTruncated: true` 的精簡摘要。
- Plugin 和工具應將模型必須讀取的文字放在 `content` 中，而不只是放在 `details` 中。

## 入站內文與歷史上下文

OpenClaw 會區分**提示內文**與**命令內文**：

- `BodyForAgent`：目前訊息中主要面向模型的文字。頻道 Plugin 應讓它聚焦於寄件者目前承載提示的文字。
- `Body`：舊版提示後援。這可能包含頻道信封與選用的歷史包裝，但目前的頻道在 `BodyForAgent` 可用時，不應依賴它作為主要模型輸入。
- `CommandBody`：用於指令/命令解析的原始使用者文字。
- `RawBody`：`CommandBody` 的舊版別名（保留以維持相容性）。

當頻道提供歷史記錄時，會使用共用包裝：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

對於**非直接聊天**（群組/頻道/聊天室），**目前訊息內文**會加上寄件者標籤前綴（與歷史項目使用相同樣式）。這會讓即時訊息與佇列/歷史訊息在 agent 提示中保持一致。

歷史緩衝區是**僅待處理**：它們包含未觸發執行的群組訊息（例如受提及門檻控管的訊息），並**排除**已在工作階段逐字稿中的訊息。

指令剝離只套用於**目前訊息**區段，因此歷史記錄會保持完整。包裝歷史記錄的頻道應將 `CommandBody`（或 `RawBody`）設為原始訊息文字，並讓 `Body` 保持為合併後的提示。結構化歷史、回覆、轉寄與頻道中繼資料會在提示組裝期間呈現為使用者角色的不受信任上下文區塊。
歷史緩衝區可透過 `messages.groupChat.historyLimit`（全域預設）以及各頻道覆寫（例如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`）設定（設為 `0` 可停用）。

## 佇列與後續訊息

如果已有執行正在進行，入站訊息可以排入佇列、導入目前執行，或收集為後續輪次。

- 透過 `messages.queue`（以及 `messages.queue.byChannel`）設定。
- 預設模式是 `steer`，當導向退回為佇列後續投遞時，會有 500ms 的後續防抖。
- 模式：`steer`、`followup`、`collect`、`steer-backlog`、`interrupt`，以及舊版一次一個的 `queue` 模式。

詳情：[命令佇列](/zh-TW/concepts/queue)與[導向佇列](/zh-TW/concepts/queue-steering)。

## 頻道執行所有權

頻道 Plugin 可在訊息進入工作階段佇列前保留順序、防抖輸入，並套用傳輸背壓。它們不應對 agent 輪次本身施加個別逾時。一旦訊息路由到工作階段，長時間執行的工作就會由工作階段、工具與執行階段生命週期管理，因此所有頻道都能一致地回報並從緩慢輪次中復原。

## 串流、分塊與批次處理

區塊串流會在模型產生文字區塊時傳送部分回覆。
分塊會遵守頻道文字限制，並避免切開圍欄程式碼。

主要設定：

- `agents.defaults.blockStreamingDefault`（`on|off`，預設關閉）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基於閒置的批次處理）
- `agents.defaults.humanDelay`（區塊回覆之間的類人停頓）
- 頻道覆寫：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 頻道需要明確設定 `*.blockStreaming: true`）

詳情：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 推理可見性與 Token

OpenClaw 可以顯示或隱藏模型推理：

- `/reasoning on|off|stream` 控制可見性。
- 模型產生的推理內容仍會計入 Token 用量。
- Telegram 支援將推理串流到暫時草稿氣泡，該氣泡會在最終投遞後刪除；若要持久化推理輸出，請使用 `/reasoning on`。

詳情：[思考 + 推理指令](/zh-TW/tools/thinking)與 [Token 使用量](/zh-TW/reference/token-use)。

## 前綴、串接與回覆

出站訊息格式集中於 `messages`：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前綴串接），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前綴）
- 透過 `replyToMode` 與各頻道預設值進行回覆串接

詳情：[設定](/zh-TW/gateway/config-agents#messages)與頻道文件。

## 靜默回覆

精確的靜默 Token `NO_REPLY` / `no_reply` 表示「不要投遞使用者可見的回覆」。
當某個輪次也有待處理的工具媒體（例如產生的 TTS 音訊）時，OpenClaw 會移除靜默文字，但仍會投遞媒體附件。
OpenClaw 會依對話類型解析該行為：

- 直接對話預設不允許靜默，並將單獨的靜默回覆改寫為簡短可見的後援回覆。
- 群組/頻道預設允許靜默。
- 內部協調預設允許靜默。

OpenClaw 也會將靜默回覆用於發生在非直接聊天中任何助理回覆之前的內部執行器失敗，因此群組/頻道不會看到 Gateway 錯誤樣板文字。直接聊天預設會顯示精簡的失敗文案；原始執行器詳情只會在 `/verbose` 為 `on` 或 `full` 時顯示。

預設值位於 `agents.defaults.silentReply` 和 `agents.defaults.silentReplyRewrite` 下；`surfaces.<id>.silentReply` 和 `surfaces.<id>.silentReplyRewrite` 可依介面覆寫它們。

當父工作階段有一個或多個待處理的已產生子 agent 執行時，單獨的靜默回覆會在所有介面上被丟棄，而不是被改寫，因此父工作階段會保持安靜，直到子完成事件投遞真正的回覆。

## 相關

- [串流](/zh-TW/concepts/streaming) — 即時訊息投遞
- [重試](/zh-TW/concepts/retry) — 訊息投遞重試行為
- [佇列](/zh-TW/concepts/queue) — 訊息處理佇列
- [頻道](/zh-TW/channels) — 訊息平台整合
