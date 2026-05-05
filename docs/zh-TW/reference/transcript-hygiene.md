---
read_when:
    - 你正在偵錯與對話記錄結構相關的提供者請求遭拒問題
    - 你正在變更對話記錄清理或工具呼叫修復邏輯
    - 你正在調查不同提供者之間的工具呼叫 ID 不一致問題
summary: 參考：特定提供者的對話記錄清理與修復規則
title: 對話記錄整理
x-i18n:
    generated_at: "2026-05-05T01:49:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 會在執行前（建構模型上下文時）對逐字記錄套用**特定提供者修正**。其中大多數是**記憶體內**調整，用來滿足嚴格的提供者要求。另一個工作階段檔案修復流程也可能在載入工作階段前重寫已儲存的 JSONL，但只限於格式錯誤的行，或作為持久記錄無效的已保存回合。已傳遞的助理回覆會保留在磁碟上；特定提供者的助理預填內容移除只會在建構對外承載資料時發生。發生修復時，原始檔案會在工作階段檔案旁一併備份。

範圍包含：

- 僅限執行階段的提示上下文不進入使用者可見的逐字記錄回合
- 工具呼叫 ID 清理
- 工具呼叫輸入驗證
- 工具結果配對修復
- 回合驗證／排序
- 思考簽章清理
- Thinking 簽章清理
- 圖片承載資料清理
- 提供者重放前的空白文字區塊清理
- 使用者輸入來源標記（用於跨工作階段路由提示）
- Bedrock Converse 重放的空助理錯誤回合修復

如果你需要逐字記錄儲存詳細資訊，請參閱：

- [工作階段管理深入解析](/zh-TW/reference/session-management-compaction)

---

## 全域規則：執行階段上下文不是使用者逐字記錄

執行階段／系統上下文可以新增到某個回合的模型提示中，但它不是終端使用者撰寫的內容。OpenClaw 會為 Gateway 回覆、佇列中的後續回覆、ACP、CLI，以及嵌入式 Pi 執行，保留獨立的逐字記錄用提示本文。已儲存的可見使用者回合會使用該逐字記錄本文，而不是加入執行階段內容後的提示。

對於已保存執行階段包裝器的舊版工作階段，Gateway 歷史記錄介面在將訊息回傳給 WebChat、TUI、REST 或 SSE 用戶端前，會套用顯示投影。

---

## 執行位置

所有逐字記錄衛生處理都集中在嵌入式執行器中：

- 政策選擇：`src/agents/transcript-policy.ts`
- 清理／修復套用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

此政策會使用 `provider`、`modelApi` 和 `modelId` 來決定要套用哪些處理。

與逐字記錄衛生處理分開，工作階段檔案會在載入前修復（如有需要）：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 從 `run/attempt.ts` 和 `compact.ts`（嵌入式執行器）呼叫

---

## 全域規則：圖片清理

圖片承載資料一律會清理，以避免因大小限制而遭提供者端拒絕（縮小／重新壓縮過大的 base64 圖片）。

這也有助於控制支援視覺模型的圖片驅動 token 壓力。較低的最大尺寸通常會降低 token 使用量；較高的尺寸會保留細節。

實作：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大圖片邊長可透過 `agents.defaults.imageMaxDimensionPx` 設定（預設：`1200`）。
- 此流程走訪重放內容時會移除空白文字區塊。變成空的助理回合會從重放副本中移除；變成空的使用者與工具結果回合會收到非空的已省略內容佔位符。

---

## 全域規則：格式錯誤的工具呼叫

在建構模型上下文前，缺少 `input` 和 `arguments` 兩者的助理工具呼叫區塊會被丟棄。這可避免因部分保存的工具呼叫而遭提供者拒絕（例如，在速率限制失敗後）。

實作：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 在 `src/agents/pi-embedded-runner/replay-history.ts` 的 `sanitizeSessionHistory` 中套用

---

## 全域規則：跨工作階段輸入來源

當某個代理透過 `sessions_send` 將提示傳送到另一個工作階段（包含代理對代理的回覆／公告步驟）時，OpenClaw 會保存所建立的使用者回合，並帶有：

- `message.provenance.kind = "inter_session"`

OpenClaw 也會在路由的提示文字前方加上同一回合的 `[Inter-session message ... isUser=false]` 標記，讓作用中的模型呼叫能區分外部工作階段輸出與外部終端使用者指令。可用時，此標記會包含來源工作階段、通道和工具。為了提供者相容性，逐字記錄仍會使用 `role: "user"`，但可見文字與來源中繼資料都會將該回合標記為跨工作階段資料。

重建上下文期間，OpenClaw 會對較舊、只有來源中繼資料的已保存跨工作階段使用者回合套用相同標記。

---

## 提供者矩陣（目前行為）

**OpenAI / OpenAI Codex**

- 僅進行圖片清理。
- 對 OpenAI Responses/Codex 逐字記錄，丟棄孤立的推理簽章（沒有後續內容區塊的獨立推理項目），並在模型路由切換後丟棄可重放的 OpenAI 推理。
- 保留可重放的 OpenAI Responses 推理項目承載資料，包含加密的空摘要項目，讓手動/WebSocket 重放能保留必要的 `rs_*` 狀態，並與助理輸出項目配對。
- 原生 ChatGPT Codex Responses 會遵循 Codex 線路一致性，重放先前的 Responses 推理／訊息／函式承載資料，但不帶先前項目 ID，同時保留工作階段 `prompt_cache_key`。
- 不進行工具呼叫 ID 清理。
- 工具結果配對修復可能會移動真實且已匹配的輸出，並為缺少的工具呼叫合成 Codex 風格的 `aborted` 輸出。
- 不進行回合驗證或重新排序。
- 缺少的 OpenAI Responses 系列工具輸出會被合成為 `aborted`，以符合 Codex 重放正規化。
- 不移除思考簽章。

**OpenAI 相容 Gemma 4**

- 歷史助理 thinking/reasoning 區塊會在重放前移除，讓本機 OpenAI 相容 Gemma 4 伺服器不會收到先前回合的推理內容。
- 目前同一回合的工具呼叫延續會保留附加到工具呼叫上的助理推理區塊，直到工具結果已被重放。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具呼叫 ID 清理：嚴格英數字。
- 工具結果配對修復與合成工具結果。
- 回合驗證（Gemini 風格的回合交替）。
- Google 回合排序修正（如果歷史記錄以助理開頭，則前置一個很小的使用者啟動訊息）。
- Antigravity Claude：正規化 thinking 簽章；丟棄未簽署的 thinking 區塊。

**Anthropic / Minimax（Anthropic 相容）**

- 工具結果配對修復與合成工具結果。
- 回合驗證（合併連續的使用者回合，以滿足嚴格交替）。
- 啟用 thinking 時，尾端助理預填回合會從對外 Anthropic Messages 承載資料中移除，包含 Cloudflare AI Gateway 路由。
- 缺少、空值或空白重放簽章的 thinking 區塊會在提供者轉換前移除。如果這使助理回合變空，OpenClaw 會用非空的已省略推理文字保留回合形狀。
- 必須移除的較舊 thinking-only 助理回合會以非空的已省略推理文字取代，讓提供者轉接器不會丟棄重放回合。

**Amazon Bedrock（Converse API）**

- 空助理串流錯誤回合會在重放前修復為非空的備援文字區塊。Bedrock Converse 會拒絕 `content: []` 的助理訊息，因此帶有 `stopReason: "error"` 且內容為空的已保存助理回合，也會在載入前於磁碟上修復。
- 只包含空白文字區塊的助理串流錯誤回合會從記憶體內重放副本中丟棄，而不是重放無效的空白區塊。
- 缺少、空值或空白重放簽章的 Claude thinking 區塊會在 Converse 重放前移除。如果這使助理回合變空，OpenClaw 會用非空的已省略推理文字保留回合形狀。
- 必須移除的較舊 thinking-only 助理回合會以非空的已省略推理文字取代，讓 Converse 重放保留嚴格回合形狀。
- 重放會過濾 OpenClaw 傳遞鏡像與 Gateway 注入的助理回合。
- 圖片清理會透過全域規則套用。

**Mistral（包含以 model-id 為基礎的偵測）**

- 工具呼叫 ID 清理：strict9（英數字長度 9）。

**OpenRouter Gemini**

- 思考簽章清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 啟用 reasoning 時，尾端助理預填回合會從已驗證的 OpenRouter OpenAI 相容 Anthropic 模型承載資料中移除，以符合直接 Anthropic 與 Cloudflare Anthropic 重放行為。

**其他所有項目**

- 僅進行圖片清理。

---

## 歷史行為（2026.1.22 前）

在 2026.1.22 版本之前，OpenClaw 會套用多層逐字記錄衛生處理：

- **transcript-sanitize extension** 會在每次上下文建構時執行，並且可以：
  - 修復工具使用／結果配對。
  - 清理工具呼叫 ID（包含會保留 `_`/`-` 的非嚴格模式）。
- 執行器也會執行特定提供者清理，造成重複工作。
- 其他變更發生在提供者政策之外，包含：
  - 在保存前從助理文字移除 `<final>` 標籤。
  - 丟棄空助理錯誤回合。
  - 在工具呼叫後修剪助理內容。

這種複雜性造成跨提供者回歸（特別是 `openai-responses` 的 `call_id|fc_id` 配對）。2026.1.22 清理移除了 extension，將邏輯集中到執行器中，並讓 OpenAI 除了圖片清理之外**不做觸碰**。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
