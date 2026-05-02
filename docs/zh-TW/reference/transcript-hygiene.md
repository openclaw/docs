---
read_when:
    - 你正在偵錯與對話紀錄結構相關的提供者請求遭拒問題
    - 你正在變更對話記錄清理或工具呼叫修復邏輯
    - 你正在調查不同提供者之間的工具呼叫 ID 不相符問題
summary: 參考：供應商特定的對話記錄清理與修復規則
title: 對話紀錄整理
x-i18n:
    generated_at: "2026-05-02T21:04:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 會在執行前（建構模型情境時）對逐字稿套用**供應商特定修正**。其中大多數是為了滿足嚴格供應商需求而使用的**記憶體內**調整。另有一個獨立的工作階段檔案修復流程，也可能會在載入工作階段前重寫已儲存的 JSONL，方式可能是刪除格式錯誤的 JSONL 行，或修復語法有效但已知會在重播期間遭供應商拒絕的已持久化回合。發生修復時，原始檔案會備份在工作階段檔案旁邊。

範圍包括：

- 僅限執行階段的提示情境不進入使用者可見的逐字稿回合
- 工具呼叫 ID 清理
- 工具呼叫輸入驗證
- 工具結果配對修復
- 回合驗證／排序
- 思考簽章清理
- 思維簽章清理
- 圖像酬載清理
- 供應商重播前的空白文字區塊清理
- 使用者輸入來源標記（用於跨工作階段路由提示）
- Bedrock Converse 重播的空助理錯誤回合修復

如果需要逐字稿儲存詳細資訊，請參閱：

- [工作階段管理深入解析](/zh-TW/reference/session-management-compaction)

---

## 全域規則：執行階段情境不是使用者逐字稿

執行階段／系統情境可以加入某個回合的模型提示，但它不是終端使用者撰寫的內容。OpenClaw 會為 Gateway 回覆、已排入佇列的後續訊息、ACP、CLI，以及嵌入式 Pi 執行維護獨立的逐字稿面向提示本文。已儲存的可見使用者回合會使用該逐字稿本文，而不是執行階段增補後的提示。

對於已經持久化執行階段包裝的舊版工作階段，Gateway 歷史記錄介面會在將訊息傳回 WebChat、TUI、REST 或 SSE 用戶端前套用顯示投影。

---

## 執行位置

所有逐字稿衛生處理都集中在嵌入式執行器中：

- 政策選擇：`src/agents/transcript-policy.ts`
- 清理／修復套用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

該政策使用 `provider`、`modelApi` 和 `modelId` 決定要套用的處理。

與逐字稿衛生處理分開，工作階段檔案會在載入前視需要修復：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 從 `run/attempt.ts` 和 `compact.ts`（嵌入式執行器）呼叫

---

## 全域規則：圖像清理

圖像酬載一律會清理，以避免因大小限制而遭供應商端拒絕（縮小／重新壓縮過大的 base64 圖像）。

這也有助於控制支援視覺模型的圖像驅動權杖壓力。較低的最大尺寸通常會降低權杖用量；較高的尺寸會保留細節。

實作：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大圖像邊長可透過 `agents.defaults.imageMaxDimensionPx` 設定（預設：`1200`）。
- 此流程遍歷重播內容時會移除空白文字區塊。變成空的助理回合會從重播副本中刪除；變成空的使用者和工具結果回合會收到非空的已省略內容預留位置。

---

## 全域規則：格式錯誤的工具呼叫

缺少 `input` 和 `arguments` 兩者的助理工具呼叫區塊，會在建構模型情境前刪除。這可避免因部分持久化的工具呼叫（例如在速率限制失敗之後）而遭供應商拒絕。

實作：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 套用於 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全域規則：跨工作階段輸入來源

當代理透過 `sessions_send` 將提示傳送到另一個工作階段（包括代理對代理的回覆／公告步驟）時，OpenClaw 會將建立的使用者回合持久化並包含：

- `message.provenance.kind = "inter_session"`

OpenClaw 也會在已路由提示文字前加上同一回合的 `[Inter-session message ... isUser=false]` 標記，讓目前作用中的模型呼叫能區分外來工作階段輸出與外部終端使用者指令。此標記會在可用時包含來源工作階段、通道和工具。為了供應商相容性，逐字稿仍會使用 `role: "user"`，但可見文字和來源中繼資料都會將該回合標記為跨工作階段資料。

在重建情境期間，OpenClaw 會對較舊的已持久化跨工作階段使用者回合套用相同標記，這些回合只有來源中繼資料。

---

## 供應商矩陣（目前行為）

**OpenAI / OpenAI Codex**

- 僅圖像清理。
- 對 OpenAI Responses/Codex 逐字稿刪除孤立推理簽章（沒有後續內容區塊的獨立推理項目），並在模型路由切換後刪除可重播的 OpenAI 推理。
- 保留可重播的 OpenAI Responses 推理項目酬載，包括加密的空摘要項目，使手動／WebSocket 重播能將必要的 `rs_*` 狀態與助理輸出項目配對。
- 不清理工具呼叫 ID。
- 工具結果配對修復可能會移動實際相符輸出，並為缺少的工具呼叫合成 Codex 風格的 `aborted` 輸出。
- 不驗證或重新排序回合。
- 缺少的 OpenAI Responses 系列工具輸出會合成為 `aborted`，以符合 Codex 重播正規化。
- 不剝除思考簽章。

**OpenAI 相容的 Gemma 4**

- 歷史助理思維／推理區塊會在重播前剝除，使本機 OpenAI 相容 Gemma 4 伺服器不會收到先前回合的推理內容。
- 目前同一回合的工具呼叫延續會保留附加到工具呼叫的助理推理區塊，直到工具結果已重播。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具呼叫 ID 清理：嚴格英數字元。
- 工具結果配對修復與合成工具結果。
- 回合驗證（Gemini 風格的回合交替）。
- Google 回合排序修正（如果歷史記錄以助理開始，則前置極小的使用者啟動項）。
- Antigravity Claude：正規化思維簽章；刪除未簽署的思維區塊。

**Anthropic / Minimax（Anthropic 相容）**

- 工具結果配對修復與合成工具結果。
- 回合驗證（合併連續使用者回合以滿足嚴格交替）。
- 啟用思維時，會從外送的 Anthropic Messages 酬載剝除尾端助理預填回合，包括 Cloudflare AI Gateway 路由。
- 缺少、空白或空白重播簽章的思維區塊會在供應商轉換前剝除。如果這讓助理回合變空，OpenClaw 會以非空的已省略推理文字保留回合形狀。
- 必須剝除的較舊純思維助理回合會以非空的已省略推理文字取代，使供應商配接器不會刪除重播回合。

**Amazon Bedrock（Converse API）**

- 空的助理串流錯誤回合會在重播前修復為非空的備援文字區塊。Bedrock Converse 會拒絕含有 `content: []` 的助理訊息，因此含有 `stopReason: "error"` 且內容為空的已持久化助理回合，也會在載入前於磁碟上修復。
- 只包含空白文字區塊的助理串流錯誤回合會從記憶體內重播副本中刪除，而不是重播無效的空白區塊。
- 缺少、空白或空白重播簽章的 Claude 思維區塊會在 Converse 重播前剝除。如果這讓助理回合變空，OpenClaw 會以非空的已省略推理文字保留回合形狀。
- 必須剝除的較舊純思維助理回合會以非空的已省略推理文字取代，使 Converse 重播保留嚴格回合形狀。
- 重播會過濾 OpenClaw 傳遞鏡像與 Gateway 注入的助理回合。
- 圖像清理會透過全域規則套用。

**Mistral（包括基於模型 ID 的偵測）**

- 工具呼叫 ID 清理：strict9（長度 9 的英數字元）。

**OpenRouter Gemini**

- 思考簽章清理：剝除非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 啟用推理時，會從已驗證的 OpenRouter OpenAI 相容 Anthropic 模型酬載剝除尾端助理預填回合，與直接 Anthropic 和 Cloudflare Anthropic 重播行為一致。

**其他所有項目**

- 僅圖像清理。

---

## 歷史行為（2026.1.22 之前）

在 2026.1.22 發行版之前，OpenClaw 套用了多層逐字稿衛生處理：

- 一個**逐字稿清理 Plugin** 會在每次情境建構時執行，並且可以：
  - 修復工具使用／結果配對。
  - 清理工具呼叫 ID（包括會保留 `_`/`-` 的非嚴格模式）。
- 執行器也會執行供應商特定清理，造成工作重複。
- 其他突變發生在供應商政策之外，包括：
  - 在持久化前從助理文字剝除 `<final>` 標籤。
  - 刪除空的助理錯誤回合。
  - 在工具呼叫後修剪助理內容。

這種複雜性導致跨供應商迴歸（特別是 `openai-responses` 的 `call_id|fc_id` 配對）。2026.1.22 清理移除了擴充功能，將邏輯集中到執行器中，並讓 OpenAI 除圖像清理外維持**不觸碰**。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
