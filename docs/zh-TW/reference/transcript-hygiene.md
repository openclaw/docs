---
read_when:
    - 你正在偵錯與對話記錄結構相關的提供者請求遭拒問題
    - 你正在變更對話記錄清理或工具呼叫修復邏輯
    - 你正在調查跨供應商的工具呼叫 ID 不一致問題
summary: 參考：特定提供者的對話記錄清理與修復規則
title: 對話紀錄整理
x-i18n:
    generated_at: "2026-04-30T03:39:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 會在執行前（建立模型上下文時）對對話紀錄套用**供應商特定修正**。其中大多數是用來滿足嚴格供應商要求的**記憶體內**調整。另一個獨立的工作階段檔案修復流程也可能在載入工作階段前重寫已儲存的 JSONL，方式可能是捨棄格式錯誤的 JSONL 行，或修復語法有效但已知會在重播期間遭
供應商拒絕的已持久化回合。發生修復時，原始檔案會備份在工作階段檔案旁邊。

範圍包括：

- 僅供執行階段使用的提示上下文不進入使用者可見的對話紀錄回合
- 工具呼叫 ID 清理
- 工具呼叫輸入驗證
- 工具結果配對修復
- 回合驗證 / 排序
- 思考簽名清理
- thinking 簽名清理
- 圖片酬載清理
- 供應商重播前的空白文字區塊清理
- 使用者輸入來源標記（用於跨工作階段路由提示）
- Bedrock Converse 重播的空白 assistant 錯誤回合修復

如果你需要對話紀錄儲存細節，請參閱：

- [工作階段管理深入解析](/zh-TW/reference/session-management-compaction)

---

## 全域規則：執行階段上下文不是使用者對話紀錄

執行階段/系統上下文可以加入某個回合的模型提示中，但它不是
終端使用者撰寫的內容。OpenClaw 會為 Gateway 回覆、佇列後續訊息、ACP、CLI，以及嵌入式 Pi
執行保留一個獨立的對話紀錄面向提示本文。已儲存的可見使用者回合會使用該對話紀錄本文，而不是
執行階段增強後的提示。

對於已持久化執行階段包裝器的舊版工作階段，Gateway 歷史紀錄
介面會在將訊息傳回 WebChat、
TUI、REST 或 SSE 用戶端前套用顯示投影。

---

## 執行位置

所有對話紀錄整理都集中在嵌入式 runner 中：

- 策略選擇：`src/agents/transcript-policy.ts`
- 清理/修復套用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

該策略會使用 `provider`、`modelApi` 和 `modelId` 來決定要套用哪些處理。

與對話紀錄整理分開，工作階段檔案會在載入前修復（如有需要）：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 從 `run/attempt.ts` 和 `compact.ts`（嵌入式 runner）呼叫

---

## 全域規則：圖片清理

圖片酬載一律會清理，以避免因大小
限制（縮小/重新壓縮過大的 base64 圖片）而遭供應商端拒絕。

這也有助於控制支援視覺模型的圖片驅動 token 壓力。
較低的最大尺寸通常會降低 token 使用量；較高的尺寸會保留細節。

實作：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大圖片邊長可透過 `agents.defaults.imageMaxDimensionPx` 設定（預設：`1200`）。
- 此流程在走訪重播內容時會移除空白文字區塊。變成空白的 assistant
  回合會從重播副本中捨棄；變成空白的使用者和工具結果
  回合會收到一個非空的已省略內容預留文字。

---

## 全域規則：格式錯誤的工具呼叫

同時缺少 `input` 和 `arguments` 的 assistant 工具呼叫區塊會在
建立模型上下文前遭捨棄。這可避免因部分
持久化的工具呼叫（例如在速率限制失敗後）造成供應商拒絕。

實作：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 在 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory` 套用

---

## 全域規則：跨工作階段輸入來源

當 agent 透過 `sessions_send` 將提示傳送到另一個工作階段（包括
agent 對 agent 的回覆/公告步驟）時，OpenClaw 會使用下列內容持久化建立的使用者回合：

- `message.provenance.kind = "inter_session"`

OpenClaw 也會在同一回合的路由提示文字前加上 `[Inter-session message ... isUser=false]`
標記，讓作用中的模型呼叫能夠區分外部工作階段輸出與外部終端使用者指令。
此標記會在可用時包含來源工作階段、頻道和工具。為了供應商相容性，對話紀錄仍使用
`role: "user"`，但可見文字和來源
中繼資料都會將該回合標示為跨工作階段資料。

重建上下文期間，OpenClaw 會將相同標記套用到只有來源中繼資料的較舊已持久化
跨工作階段使用者回合。

---

## 供應商矩陣（目前行為）

**OpenAI / OpenAI Codex**

- 僅圖片清理。
- 對 OpenAI Responses/Codex 對話紀錄捨棄孤立的推理簽名（沒有後續內容區塊的獨立推理項目），並在模型路由切換後捨棄可重播的 OpenAI 推理。
- 保留可重播的 OpenAI Responses 推理項目酬載，包括加密的空摘要項目，讓手動/WebSocket 重播保留必要的 `rs_*` 狀態並與 assistant 輸出項目配對。
- 不清理工具呼叫 ID。
- 工具結果配對修復可能會移動真正相符的輸出，並為缺少的工具呼叫合成 Codex 風格的 `aborted` 輸出。
- 不進行回合驗證或重新排序。
- 缺少的 OpenAI Responses 系列工具輸出會合成為 `aborted`，以符合 Codex 重播正規化。
- 不移除 thought 簽名。

**OpenAI 相容 Gemma 4**

- 歷史 assistant thinking/reasoning 區塊會在重播前移除，讓本機
  OpenAI 相容 Gemma 4 伺服器不會收到先前回合的推理內容。
- 目前同一回合的工具呼叫接續會保留附加到工具呼叫的 assistant 推理區塊，
  直到工具結果已重播為止。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具呼叫 ID 清理：嚴格英數字。
- 工具結果配對修復與合成工具結果。
- 回合驗證（Gemini 風格的回合交替）。
- Google 回合排序修正（如果歷史紀錄以 assistant 開始，會前置一個極小的使用者啟動訊息）。
- Antigravity Claude：正規化 thinking 簽名；捨棄未簽名的 thinking 區塊。

**Anthropic / Minimax（Anthropic 相容）**

- 工具結果配對修復與合成工具結果。
- 回合驗證（合併連續使用者回合以滿足嚴格交替）。
- 啟用 thinking 時，尾端 assistant 預填回合會從傳出的 Anthropic Messages
  酬載中移除，包括 Cloudflare AI Gateway 路由。
- 缺少、空白或只有空白重播簽名的 thinking 區塊會在
  供應商轉換前移除。如果這會使 assistant 回合變空，OpenClaw 會使用非空的已省略推理文字
  保留回合形狀。
- 必須移除的較舊 thinking-only assistant 回合會替換為
  非空的已省略推理文字，讓供應商轉接器不會捨棄該重播
  回合。

**Amazon Bedrock（Converse API）**

- 空白的 assistant 串流錯誤回合會在重播前修復為非空的後備文字區塊。
  Bedrock Converse 會拒絕含有 `content: []` 的 assistant 訊息，因此
  已持久化且 `stopReason: "error"` 並包含空內容的 assistant 回合也會
  在載入前於磁碟上修復。
- 只包含空白文字區塊的 assistant 串流錯誤回合會從記憶體內重播副本中捨棄，
  而不是重播無效的空白區塊。
- 缺少、空白或只有空白重播簽名的 Claude thinking 區塊會
  在 Converse 重播前移除。如果這會使 assistant 回合變空，OpenClaw
  會使用非空的已省略推理文字保留回合形狀。
- 必須移除的較舊 thinking-only assistant 回合會替換為
  非空的已省略推理文字，讓 Converse 重播保留嚴格回合形狀。
- 重播會篩除 OpenClaw delivery-mirror 和 Gateway 注入的 assistant 回合。
- 圖片清理依全域規則套用。

**Mistral（包括基於模型 ID 的偵測）**

- 工具呼叫 ID 清理：strict9（長度 9 的英數字）。

**OpenRouter Gemini**

- thought 簽名清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有供應商**

- 僅圖片清理。

---

## 歷史行為（2026.1.22 以前）

在 2026.1.22 發行前，OpenClaw 會套用多層對話紀錄整理：

- 一個 **transcript-sanitize Plugin** 會在每次上下文建構時執行，並且能夠：
  - 修復工具使用/結果配對。
  - 清理工具呼叫 ID（包括保留 `_`/`-` 的非嚴格模式）。
- runner 也會執行供應商特定清理，造成重複工作。
- 供應商策略之外還會發生其他變更，包括：
  - 在持久化前從 assistant 文字中移除 `<final>` 標籤。
  - 捨棄空白的 assistant 錯誤回合。
  - 在工具呼叫後裁剪 assistant 內容。

這種複雜性造成跨供應商回歸（尤其是 `openai-responses`
`call_id|fc_id` 配對）。2026.1.22 清理移除了該 Plugin、將邏輯集中到 runner，
並讓 OpenAI 除了圖片清理之外保持**不變更**。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段剪枝](/zh-TW/concepts/session-pruning)
