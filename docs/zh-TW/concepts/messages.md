---
read_when:
    - 說明傳入訊息如何轉換為回覆
    - 釐清工作階段、排隊模式或串流行為
    - 說明推理可見度與使用影響
summary: 訊息流程、工作階段、佇列處理與推理可見性
title: 訊息
x-i18n:
    generated_at: "2026-04-30T16:27:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw 透過由工作階段解析、佇列、串流、工具執行與推理可見性組成的管線處理傳入訊息。本頁說明從傳入訊息到回覆的路徑。

## 訊息流程（高層次）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要旋鈕位於設定中：

- `messages.*` 用於前綴、佇列與群組行為。
- `agents.defaults.*` 用於區塊串流與分塊預設值。
- 通道覆寫（`channels.whatsapp.*`、`channels.telegram.*` 等）用於上限與串流切換。

完整結構描述請參閱[設定](/zh-TW/gateway/configuration)。

## 傳入訊息去重

通道可能會在重新連線後重新傳送同一則訊息。OpenClaw 會保留一個
短期快取，依通道/帳號/對等方/工作階段/訊息 ID 建立鍵值，讓重複
傳送不會觸發另一個代理程式執行。

## 傳入訊息防抖

來自**同一寄件者**的快速連續訊息，可透過 `messages.inbound` 批次合併成單一
代理程式回合。防抖範圍限於每個通道 + 對話，並使用最新訊息作為回覆串接/ID。

設定（全域預設值 + 每通道覆寫）：

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

- 防抖套用於**純文字**訊息；媒體/附件會立即清空等待中的批次。
- 控制命令會略過防抖，以維持獨立處理；**但**若通道明確選擇加入同寄件者私訊合併（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-TW/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），私訊命令會在防抖視窗內等待，讓分段傳送的酬載能加入同一個代理程式回合。

## 工作階段與裝置

工作階段由 Gateway 擁有，而不是由用戶端擁有。

- 直接聊天會收斂到代理程式主工作階段鍵。
- 群組/通道會取得各自的工作階段鍵。
- 工作階段儲存區與逐字稿位於 Gateway 主機上。

多個裝置/通道可以對應到同一個工作階段，但歷史記錄不會完整
同步回每個用戶端。建議：長對話使用一個主要裝置，
以避免脈絡分歧。Control UI 與 TUI 一律顯示
Gateway 支援的工作階段逐字稿，因此它們是事實來源。

詳細資訊：[工作階段管理](/zh-TW/concepts/session)。

## 工具結果中繼資料

工具結果的 `content` 是模型可見的結果。工具結果的 `details` 是
用於 UI 呈現、診斷、媒體傳送與 Plugin 的執行階段中繼資料。

OpenClaw 會明確維持這個邊界：

- `toolResult.details` 會在提供者重播與 Compaction 輸入前被移除。
- 已持久化的工作階段逐字稿只保留有界限的 `details`；過大的中繼資料
  會以標記為 `persistedDetailsTruncated: true` 的精簡摘要取代。
- Plugin 與工具應將模型必須讀取的文字放在 `content` 中，而不是只放在
  `details` 中。

## 傳入本文與歷史脈絡

OpenClaw 會區分**提示本文**與**命令本文**：

- `BodyForAgent`：目前訊息中面向主要模型的文字。通道
  Plugin 應讓它聚焦於寄件者目前承載提示的文字。
- `Body`：舊版提示備援。這可能包含通道信封與
  選用的歷史包裝，但目前通道不應在 `BodyForAgent` 可用時，
  依賴它作為主要模型輸入。
- `CommandBody`：用於指令/命令解析的原始使用者文字。
- `RawBody`：`CommandBody` 的舊版別名（保留以維持相容性）。

當通道提供歷史記錄時，會使用共用包裝：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

對於**非直接聊天**（群組/通道/聊天室），**目前訊息本文**會加上
寄件者標籤前綴（與歷史項目使用相同樣式）。這讓即時與佇列/歷史
訊息在代理程式提示中保持一致。

歷史緩衝區是**僅限待處理**：它們包含未觸發執行的群組訊息
（例如受提及閘控的訊息），並**排除**已在工作階段逐字稿中的訊息。

指令移除只套用於**目前訊息**區段，因此歷史會保持完整。
包裝歷史的通道應將 `CommandBody`（或 `RawBody`）設為原始訊息文字，
並讓 `Body` 保持為合併後的提示。結構化歷史、回覆、轉寄與通道中繼資料
會在提示組裝期間呈現為使用者角色的不受信任脈絡區塊。
歷史緩衝區可透過 `messages.groupChat.historyLimit`（全域
預設值）與每通道覆寫設定，例如 `channels.slack.historyLimit` 或
`channels.telegram.accounts.<id>.historyLimit`（設為 `0` 可停用）。

## 佇列與後續處理

如果已有執行處於作用中，傳入訊息可以被排入佇列、導向目前執行，
或收集到後續回合。

- 透過 `messages.queue`（以及 `messages.queue.byChannel`）設定。
- 預設模式為 `steer`，當導向回退到佇列後續傳送時，
  會有 500ms 的後續防抖。
- 模式：`steer`、`followup`、`collect`、`steer-backlog`、`interrupt`，
  以及舊版一次一個的 `queue` 模式。

詳細資訊：[命令佇列](/zh-TW/concepts/queue)與[導向佇列](/zh-TW/concepts/queue-steering)。

## 通道執行所有權

通道 Plugin 可在訊息進入工作階段佇列前保留順序、對輸入套用防抖，
並套用傳輸背壓。它們不應在代理程式回合本身周圍施加
個別逾時。一旦訊息被路由到
工作階段，長時間執行的工作會由工作階段、工具與執行階段
生命週期控管，讓所有通道都能一致回報慢速回合並從中復原。

## 串流、分塊與批次處理

區塊串流會在模型產生文字區塊時傳送部分回覆。
分塊會遵守通道文字限制，並避免切開圍欄式程式碼。

主要設定：

- `agents.defaults.blockStreamingDefault`（`on|off`，預設關閉）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基於閒置的批次處理）
- `agents.defaults.humanDelay`（區塊回覆之間的類真人暫停）
- 通道覆寫：`*.blockStreaming` 與 `*.blockStreamingCoalesce`（非 Telegram 通道需要明確設定 `*.blockStreaming: true`）

詳細資訊：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 推理可見性與權杖

OpenClaw 可以揭露或隱藏模型推理：

- `/reasoning on|off|stream` 控制可見性。
- 當模型產生推理內容時，仍會計入權杖使用量。
- Telegram 支援將推理串流到草稿泡泡中。

詳細資訊：[思考 + 推理指令](/zh-TW/tools/thinking)與[權杖使用量](/zh-TW/reference/token-use)。

## 前綴、串接與回覆

傳出訊息格式集中在 `messages` 中：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 與 `channels.<channel>.accounts.<id>.responsePrefix`（傳出前綴串接），以及 `channels.whatsapp.messagePrefix`（WhatsApp 傳入前綴）
- 透過 `replyToMode` 與每通道預設值進行回覆串接

詳細資訊：[設定](/zh-TW/gateway/config-agents#messages)與通道文件。

## 靜默回覆

精確的靜默權杖 `NO_REPLY` / `no_reply` 表示「不要傳送使用者可見的回覆」。
當回合也有待處理的工具媒體時，例如產生的 TTS 音訊，OpenClaw
會移除靜默文字，但仍會傳送媒體附件。
OpenClaw 會依對話類型解析該行為：

- 直接對話預設不允許靜默，並會將單獨的靜默
  回覆改寫為簡短的可見備援。
- 群組/通道預設允許靜默。
- 內部編排預設允許靜默。

OpenClaw 也會將靜默回覆用於在非直接聊天中、任何助理回覆之前發生的
內部執行器失敗，因此群組/通道不會看到
Gateway 錯誤樣板文字。直接聊天預設會顯示精簡的失敗文案；
只有當 `/verbose` 為 `on` 或 `full` 時，才會顯示原始執行器詳細資訊。

預設值位於 `agents.defaults.silentReply` 與
`agents.defaults.silentReplyRewrite`；`surfaces.<id>.silentReply` 與
`surfaces.<id>.silentReplyRewrite` 可以依表面覆寫它們。

當父工作階段有一個或多個待處理的已產生子代理程式執行時，單獨的
靜默回覆會在所有表面上被捨棄，而不是被改寫，因此
父工作階段會保持安靜，直到子項完成事件傳送真正的回覆。

## 相關

- [串流](/zh-TW/concepts/streaming) — 即時訊息傳送
- [重試](/zh-TW/concepts/retry) — 訊息傳送重試行為
- [佇列](/zh-TW/concepts/queue) — 訊息處理佇列
- [通道](/zh-TW/channels) — 訊息平台整合
