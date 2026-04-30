---
read_when:
    - 說明傳入訊息如何變成回覆
    - 釐清工作階段、佇列模式或串流行為
    - 記錄推理可見性與使用上的影響
summary: 訊息流程、工作階段、佇列處理與推理可見性
title: 訊息
x-i18n:
    generated_at: "2026-04-30T03:00:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw 透過一條包含工作階段解析、佇列、串流、工具執行與推理可見性的管線處理傳入訊息。本頁說明從傳入訊息到回覆的路徑。

## 訊息流程（高階）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

關鍵調整項位於設定中：

- `messages.*` 用於前綴、佇列與群組行為。
- `agents.defaults.*` 用於區塊串流與分塊預設值。
- Channel 覆寫（`channels.whatsapp.*`、`channels.telegram.*` 等）用於上限與串流切換。

完整結構請參閱[設定](/zh-TW/gateway/configuration)。

## 傳入去重

Channel 可能會在重新連線後重新投遞相同訊息。OpenClaw 會保留一個
短期快取，以 channel/account/peer/session/message id 作為鍵，避免重複
投遞觸發另一個 agent 執行。

## 傳入防抖

來自**同一寄件者**的快速連續訊息，可透過 `messages.inbound` 批次合併為單一
agent 回合。防抖範圍限定在每個 channel + 對話，
並使用最新訊息作為回覆串接/ID。

設定（全域預設 + 各 channel 覆寫）：

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

- 防抖適用於**純文字**訊息；媒體/附件會立即送出。
- 控制命令會略過防抖，因此會保持獨立處理，**除非**某個 channel 明確選擇加入同寄件者 DM 合併（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-TW/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），此時 DM 命令會在防抖視窗內等待，讓拆分傳送的負載可以加入同一個 agent 回合。

## 工作階段與裝置

工作階段由 Gateway 擁有，而不是由用戶端擁有。

- 直接聊天會收斂到 agent 主要工作階段鍵。
- 群組/channel 會取得自己的工作階段鍵。
- 工作階段儲存與逐字稿位於 Gateway 主機上。

多個裝置/channel 可以對應到同一個工作階段，但歷史記錄不會完整
同步回每個用戶端。建議：長對話使用一個主要裝置，
以避免脈絡分歧。Control UI 與 TUI 永遠顯示
Gateway 支援的工作階段逐字稿，因此它們是事實來源。

詳細資訊：[工作階段管理](/zh-TW/concepts/session)。

## 工具結果中繼資料

工具結果的 `content` 是模型可見的結果。工具結果的 `details` 是
用於 UI 呈現、診斷、媒體投遞與 Plugin 的執行階段中繼資料。

OpenClaw 明確維持這個邊界：

- `toolResult.details` 會在供應商重播與 Compaction 輸入前被移除。
- 持久化工作階段逐字稿只保留受限的 `details`；過大的中繼資料
  會被替換成標記為 `persistedDetailsTruncated: true` 的精簡摘要。
- Plugin 與工具應將模型必須讀取的文字放在 `content`，而不只
  放在 `details`。

## 傳入本文與歷史脈絡

OpenClaw 會區分**提示本文**與**命令本文**：

- `Body`：傳送給 agent 的提示文字。這可能包含 channel 信封與
  選用的歷史包裝。
- `CommandBody`：用於指令/命令解析的原始使用者文字。
- `RawBody`：`CommandBody` 的舊版別名（為相容性保留）。

當 channel 提供歷史時，會使用共用包裝：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

對於**非直接聊天**（群組/channel/房間），**目前訊息本文**會加上
寄件者標籤前綴（與歷史項目使用相同樣式）。這能讓即時與佇列/歷史
訊息在 agent 提示中保持一致。

歷史緩衝區是**僅待處理**：它們包含未觸發執行的群組訊息
（例如受提及限制的訊息），並**排除**已在工作階段逐字稿中的訊息。

指令剝離只套用於**目前訊息**區段，因此歷史會保持完整。
包裝歷史的 channel 應將 `CommandBody`（或 `RawBody`）設定為原始訊息文字，
並讓 `Body` 保持為合併後的提示。歷史緩衝區可透過
`messages.groupChat.historyLimit`（全域預設）與各 channel 覆寫設定，
例如 `channels.slack.historyLimit` 或
`channels.telegram.accounts.<id>.historyLimit`（設定為 `0` 可停用）。

## 佇列與後續處理

如果已有執行正在進行，傳入訊息可以被排入佇列、導向目前執行，
或收集到後續回合中。

- 透過 `messages.queue`（以及 `messages.queue.byChannel`）設定。
- 預設模式為 `steer`，當導向退回到佇列後續投遞時，
  會有 500ms 的後續防抖。
- 模式：`steer`、`followup`、`collect`、`steer-backlog`、`interrupt`，
  以及舊版一次一個的 `queue` 模式。

詳細資訊：[命令佇列](/zh-TW/concepts/queue)與[導向佇列](/zh-TW/concepts/queue-steering)。

## Channel 執行擁有權

Channel Plugin 可以在訊息進入工作階段佇列前保留順序、對輸入進行防抖，
並套用傳輸背壓。它們不應在 agent 回合本身周圍施加
獨立逾時。一旦訊息被路由到工作階段，長時間執行的工作會由工作階段、工具與執行階段
生命週期管理，使所有 channel 都能一致地回報並從緩慢回合復原。

## 串流、分塊與批次處理

區塊串流會在模型產生文字區塊時傳送部分回覆。
分塊會遵守 channel 文字限制，並避免拆開圍欄程式碼。

關鍵設定：

- `agents.defaults.blockStreamingDefault`（`on|off`，預設關閉）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（以閒置為基礎的批次處理）
- `agents.defaults.humanDelay`（區塊回覆之間類似人類的暫停）
- Channel 覆寫：`*.blockStreaming` 與 `*.blockStreamingCoalesce`（非 Telegram channel 需要明確設定 `*.blockStreaming: true`）

詳細資訊：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 推理可見性與權杖

OpenClaw 可以公開或隱藏模型推理：

- `/reasoning on|off|stream` 控制可見性。
- 當模型產生推理內容時，它仍會計入權杖用量。
- Telegram 支援將推理串流到草稿氣泡中。

詳細資訊：[思考 + 推理指令](/zh-TW/tools/thinking)與[權杖使用量](/zh-TW/reference/token-use)。

## 前綴、串接與回覆

傳出訊息格式集中在 `messages` 中：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 與 `channels.<channel>.accounts.<id>.responsePrefix`（傳出前綴串接），以及 `channels.whatsapp.messagePrefix`（WhatsApp 傳入前綴）
- 透過 `replyToMode` 與各 channel 預設值進行回覆串接

詳細資訊：[設定](/zh-TW/gateway/config-agents#messages)與 channel 文件。

## 靜默回覆

精確的靜默權杖 `NO_REPLY` / `no_reply` 表示「不要投遞使用者可見的回覆」。
當某個回合同時有待處理的工具媒體（例如產生的 TTS 音訊）時，OpenClaw
會移除靜默文字，但仍會投遞媒體附件。
OpenClaw 會依對話類型解析該行為：

- 直接對話預設不允許靜默，並會將單獨的靜默
  回覆改寫為簡短的可見備援回覆。
- 群組/channel 預設允許靜默。
- 內部編排預設允許靜默。

OpenClaw 也會針對非直接聊天中、任何助理回覆之前發生的內部執行器失敗使用靜默回覆，
因此群組/channel 不會看到
Gateway 錯誤樣板文字。直接聊天預設會顯示精簡的失敗文案；
只有當 `/verbose` 為 `on` 或 `full` 時，才會顯示原始執行器詳細資訊。

預設值位於 `agents.defaults.silentReply` 與
`agents.defaults.silentReplyRewrite`；`surfaces.<id>.silentReply` 與
`surfaces.<id>.silentReplyRewrite` 可以針對每個介面覆寫它們。

當父工作階段有一個或多個待處理的已生成子 agent 執行時，單獨的
靜默回覆會在所有介面上被丟棄而不是被改寫，因此
父工作階段會保持安靜，直到子項完成事件投遞真正的回覆。

## 相關

- [串流](/zh-TW/concepts/streaming) — 即時訊息投遞
- [重試](/zh-TW/concepts/retry) — 訊息投遞重試行為
- [佇列](/zh-TW/concepts/queue) — 訊息處理佇列
- [Channel](/zh-TW/channels) — 傳訊平台整合
