---
read_when:
    - 說明傳入訊息如何變成回覆
    - 釐清工作階段、佇列模式或串流行為
    - 記錄推理可見度與使用量影響
summary: 訊息流程、工作階段、佇列處理與推理可見性
title: 訊息
x-i18n:
    generated_at: "2026-06-27T19:12:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw 透過工作階段解析、佇列、串流、工具執行與推理可見性的管線處理傳入訊息。本頁說明從傳入訊息到回覆的路徑。

## 訊息流程（高層次）

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
- 頻道覆寫（`channels.whatsapp.*`、`channels.telegram.*` 等）用於上限與串流切換。

完整結構描述請參閱[設定](/zh-TW/gateway/configuration)。

## 傳入去重

頻道可能會在重新連線後重新傳遞同一則訊息。OpenClaw 會保留一個
短期快取，以頻道/帳號/對等端/工作階段/訊息 ID 作為鍵，避免重複
傳遞觸發另一個代理執行。

## 傳入防抖

來自**同一寄件者**的快速連續訊息可透過 `messages.inbound` 批次合併為單一
代理回合。防抖範圍限定於每個頻道 + 對話，
並使用最新訊息進行回覆串接/ID。

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

注意：

- 防抖適用於**純文字**訊息；媒體/附件會立即送出。
- 控制命令會略過防抖，因此會保持獨立。明確選擇加入同寄件者 DM 合併的頻道，可以將 DM 命令保留在防抖視窗內，讓分次傳送的負載可併入同一個代理回合。

## 工作階段與裝置

工作階段由閘道擁有，而不是由用戶端擁有。

- 直接聊天會收斂到代理主工作階段鍵。
- 群組/頻道會取得自己的工作階段鍵。
- 工作階段儲存與逐字稿位於閘道主機上。

多個裝置/頻道可以對應到同一個工作階段，但歷史記錄不會完整
同步回每個用戶端。建議：長對話使用一個主要裝置，
以避免脈絡分歧。控制 UI 與 終端介面 一律顯示
閘道支援的工作階段逐字稿，因此它們是真實來源。

詳細資訊：[工作階段管理](/zh-TW/concepts/session)。

## 工具結果中繼資料

工具結果 `content` 是模型可見的結果。工具結果 `details` 是
用於 UI 呈現、診斷、媒體傳遞與外掛的執行階段中繼資料。

OpenClaw 會明確維持該邊界：

- `toolResult.details` 會在提供者重播與壓縮輸入前被移除。
- 持久化的工作階段逐字稿只保留有界的 `details`；過大的中繼資料
  會以標記為 `persistedDetailsTruncated: true` 的精簡摘要取代。
- 外掛與工具應將模型必須閱讀的文字放在 `content`，而不是只放在
  `details`。

## 傳入本文與歷史脈絡

OpenClaw 會分離**提示本文**與**命令本文**：

- `BodyForAgent`：目前訊息中主要面向模型的文字。頻道
  外掛應讓此欄位聚焦於寄件者目前承載提示的文字。
- `Body`：舊版提示備援。這可能包含頻道信封與
  選用的歷史包裝，但目前頻道在 `BodyForAgent` 可用時，不應將它作為
  主要模型輸入。
- `CommandBody`：用於指示/命令解析的原始使用者文字。
- `RawBody`：`CommandBody` 的舊版別名（保留以相容）。

當頻道提供歷史記錄時，會使用共用包裝：

- `[自你上次回覆後的聊天訊息 - 供脈絡使用]`
- `[目前訊息 - 回覆這則]`

對於**非直接聊天**（群組/頻道/聊天室），**目前訊息本文**會加上
寄件者標籤前綴（與歷史項目使用相同樣式）。這可讓即時與佇列/歷史
訊息在代理提示中保持一致。

歷史緩衝區是**僅待處理**：它們包含_未_
觸發執行的群組訊息（例如受提及閘控的訊息），並**排除**
已在工作階段逐字稿中的訊息。

指示剝除只套用於**目前訊息**區段，因此歷史記錄
會保持完整。包裝歷史記錄的頻道應將 `CommandBody`（或
`RawBody`）設為原始訊息文字，並讓 `Body` 成為合併提示。
結構化歷史、回覆、轉寄與頻道中繼資料會在提示組裝期間
呈現為使用者角色的不受信任脈絡區塊。
歷史緩衝區可透過 `messages.groupChat.historyLimit`（全域
預設）與每頻道覆寫（例如 `channels.slack.historyLimit` 或
`channels.telegram.accounts.<id>.historyLimit`）設定（設為 `0` 可停用）。

## 佇列與後續訊息

如果已有執行正在進行，傳入訊息預設會被導向目前執行。
`messages.queue` 會選擇作用中執行期間的訊息是導向、排入稍後、
收集成稍後的一個回合，或中斷作用中執行。

- 透過 `messages.queue`（以及 `messages.queue.byChannel`）設定。
- 預設模式為 `steer`，Codex 導向批次與後續/收集佇列
  使用 500ms 防抖。
- 模式：`steer`、`followup`、`collect` 與 `interrupt`。

詳細資訊：[命令佇列](/zh-TW/concepts/queue)與[導向佇列](/zh-TW/concepts/queue-steering)。

## 頻道執行所有權

頻道外掛可在訊息進入工作階段佇列前保留順序、對輸入防抖，並套用傳輸
背壓。它們不應在代理回合本身外加
個別逾時。一旦訊息被路由到工作階段，
長時間執行的工作會由工作階段、工具與執行階段
生命週期控管，讓所有頻道能一致地回報並從緩慢回合中復原。

## 串流、分塊與批次

區塊串流會在模型產生文字區塊時傳送部分回覆。
分塊會遵守頻道文字限制，並避免切分圍欄程式碼。

關鍵設定：

- `agents.defaults.blockStreamingDefault`（`on|off`，預設關閉）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基於閒置的批次處理）
- `agents.defaults.humanDelay`（區塊回覆之間類似人類的暫停）
- 頻道覆寫：`*.blockStreaming` 與 `*.blockStreamingCoalesce`（非 Telegram 頻道需要明確設定 `*.blockStreaming: true`）

詳細資訊：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 推理可見性與權杖

OpenClaw 可以顯示或隱藏模型推理：

- `/reasoning on|off|stream` 控制可見性。
- 模型產生推理內容時，該內容仍會計入權杖用量。
- Telegram 支援將推理串流到暫時草稿泡泡，並在最終傳遞後刪除；若要持久保留推理輸出，請使用 `/reasoning on`。

詳細資訊：[思考 + 推理指示](/zh-TW/tools/thinking)與[權杖使用](/zh-TW/reference/token-use)。

## 前綴、串接與回覆

傳出訊息格式集中在 `messages`：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 與 `channels.<channel>.accounts.<id>.responsePrefix`（傳出前綴串接），以及 `channels.whatsapp.messagePrefix`（WhatsApp 傳入前綴）
- 透過 `replyToMode` 與每頻道預設值進行回覆串接

詳細資訊：[設定](/zh-TW/gateway/config-agents#messages)與頻道文件。

## 靜默回覆

精確的靜默權杖 `NO_REPLY` / `no_reply` 表示「不要傳遞使用者可見的回覆」。
當某個回合也有待處理的工具媒體（例如產生的 TTS 音訊）時，OpenClaw
會移除靜默文字，但仍會傳遞媒體附件。
OpenClaw 會依對話類型解析該行為：

- 直接對話永遠不會收到 `NO_REPLY` 提示指引。如果直接
  執行意外回傳裸靜默權杖，OpenClaw 會抑制它，而不是
  改寫或傳遞它。
- 群組/頻道預設只允許自動群組回覆靜默。
  在 `message_tool` 可見回覆模式中，靜默表示模型不會呼叫
  `message(action=send)`。
- 內部編排預設允許靜默。

OpenClaw 也會在非直接聊天中，將靜默回覆用於通用內部執行器失敗，
因此群組/頻道不會看到閘道錯誤樣板文字。
具有面向使用者復原文案的分類失敗，例如缺少驗證、
速率限制或過載通知，仍可被傳遞。直接聊天預設顯示
精簡的失敗文案；只有啟用 `/verbose full` 時，才會顯示原始執行器詳細資訊。

預設值位於 `agents.defaults.silentReply` 下；`surfaces.<id>.silentReply`
可依介面覆寫群組/內部政策。

裸靜默回覆會在所有介面上被丟棄，因此父工作階段會保持安靜，
而不是將哨兵文字改寫成備援閒聊。

## 相關

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor) - 目標持久傳送與接收設計
- [串流](/zh-TW/concepts/streaming) — 即時訊息傳遞
- [重試](/zh-TW/concepts/retry) — 訊息傳遞重試行為
- [佇列](/zh-TW/concepts/queue) — 訊息處理佇列
- [頻道](/zh-TW/channels) — 訊息平台整合
