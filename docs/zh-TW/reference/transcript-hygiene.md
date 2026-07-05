---
read_when:
    - 你正在偵錯與逐字稿形狀相關的提供者請求拒絕
    - 你正在變更轉錄清理或工具呼叫修復邏輯
    - 你正在調查各提供者之間的工具呼叫 ID 不相符問題
summary: 參考：特定提供者的逐字稿清理與修復規則
title: 逐字稿整理
x-i18n:
    generated_at: "2026-07-05T11:46:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 會在執行前（建構模型上下文）對對話紀錄套用**提供者特定修正**。這些大多是為了滿足嚴格提供者要求而使用的**記憶體內**調整。另一個獨立的工作階段檔案修復階段也可能在載入工作階段前重寫已儲存的 JSONL，但只限於格式錯誤的行，或無效作為持久記錄的已持久化回合。
已傳遞的助理回覆會保留在磁碟上；提供者特定的助理預填移除只會在建構對外 payload 時發生。

修復發生時，原始檔案會先寫入一個暫時的同層 `*.bak-<pid>-<ts>` 檔案，再進行原子替換；替換成功後會移除該備份。只有在清理本身失敗時才會保留備份，並回報該路徑。

範圍包括：

- 僅限執行階段的提示上下文不進入使用者可見的對話紀錄回合
- 工具呼叫 id 清理
- 工具呼叫輸入驗證
- 工具結果配對修復
- 回合驗證 / 排序
- 思考簽章清理
- Thinking 簽章清理
- 圖片 payload 清理
- 提供者重播前的空白文字區塊清理
- 提供者重播前的不完整僅推理長度回合清理
- 使用者輸入來源標記（用於跨工作階段路由的提示）
- Bedrock Converse 重播的空助理錯誤回合修復

如果需要對話紀錄儲存細節，請參閱
[工作階段管理深入說明](/zh-TW/reference/session-management-compaction)。

---

## 全域規則：執行階段上下文不是使用者對話紀錄

執行階段 / 系統上下文可以加入某個回合的模型提示，但它不是終端使用者撰寫的內容。OpenClaw 會為閘道回覆、排入佇列的 followup、ACP、命令列介面，以及嵌入式 OpenClaw 執行，保留一個獨立的對話紀錄可見提示本文。已儲存的可見使用者回合會使用該對話紀錄本文，而不是經執行階段擴充的提示。

對於已持久化執行階段包裝的舊版工作階段，閘道歷史表面會先套用顯示投影，再將訊息回傳給 WebChat、終端介面、REST 或 SSE 用戶端。

---

## 執行位置

所有對話紀錄衛生處理都集中在嵌入式 runner：

- 政策選擇：`src/agents/transcript-policy.ts`
  （`resolveTranscriptPolicy`，以 `provider`、`modelApi` 和 `modelId` 為鍵）
- 清理 / 修復套用：`src/agents/embedded-agent-runner/replay-history.ts` 中的
  `sanitizeSessionHistory`

與對話紀錄衛生處理分開，工作階段檔案會在載入前修復（如有需要）：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 從 `src/agents/embedded-agent-runner/run/attempt.ts` 和
  `src/agents/embedded-agent-runner/compact.ts` 呼叫

---

## 全域規則：圖片清理

圖片 payload 一律會清理，以避免因大小限制而遭提供者端拒絕（縮小 / 重新壓縮過大的 base64 圖片）。這也有助於控制支援視覺模型的圖片驅動 token 壓力：較低的最大尺寸會降低 token 用量，較高的尺寸會保留細節。

實作：

- `src/agents/embedded-agent-helpers/images.ts` 中的
  `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 圖片最大邊長可透過 `agents.defaults.imageMaxDimensionPx` 設定
  （預設：`1200`）
- 此階段走訪重播內容時，會移除空白文字區塊。
  變成空的助理回合會從重播副本中丟棄；變成空的使用者和工具結果回合會收到非空的省略內容佔位符。

---

## 全域規則：格式錯誤的工具呼叫

同時缺少 `input` 和 `arguments` 的助理工具呼叫區塊，會在建構模型上下文前被丟棄。這可防止部分持久化的工具呼叫（例如在速率限制失敗後）造成提供者拒絕。

實作：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 套用於 `sanitizeSessionHistory`
  （`src/agents/embedded-agent-runner/replay-history.ts`）

---

## 全域規則：不完整的僅推理回合

如果助理回合因觸及提供者輸出限制而只含 thinking 或 redacted-thinking 內容，該回合會從記憶體內重播副本中省略。這類回合包含不完整的提供者狀態，並可能攜帶部分 thinking 簽章。

空的 length 回合維持不變，含有可見文字、工具呼叫或未知內容區塊的 length 回合也是如此。已儲存的對話紀錄不會被重寫。

實作：`src/agents/embedded-agent-runner/replay-history.ts` 中的 `normalizeAssistantReplayContent`

---

## 全域規則：跨工作階段輸入來源

當 agent 透過 `sessions_send` 將提示送入另一個工作階段（包括 agent 對 agent 的回覆 / announce 步驟）時，OpenClaw 會以 `message.provenance.kind = "inter_session"` 持久化所建立的使用者回合。

OpenClaw 也會在同一回合的路由提示文字前加上 `[Inter-session message] ... isUser=false` 標記，讓作用中的模型呼叫能將外部工作階段輸出與外部終端使用者指令區分開來。此標記會在可用時包含來源工作階段、通道和工具。為了提供者相容性，對話紀錄仍使用 `role: "user"`，但可見文字和來源中繼資料都會將該回合標記為跨工作階段資料。

在重建上下文期間，OpenClaw 會將相同標記套用到較舊、只含來源中繼資料的已持久化跨工作階段使用者回合。

---

## 提供者矩陣（目前行為）

**OpenAI / OpenAI Codex**

- 僅圖片清理。
- 對 OpenAI Responses/Codex 對話紀錄，丟棄孤立的推理簽章（沒有後續內容區塊的獨立推理項目），並在模型路由切換後丟棄可重播的 OpenAI 推理。
- 保留可重播的 OpenAI Responses 推理項目 payload，包括加密的空摘要項目，讓手動 / WebSocket 重播能保留必要的 `rs_*` 狀態，並與助理輸出項目配對。
- 原生 ChatGPT Codex Responses 會依照 Codex wire parity 重播先前的 Responses 推理 / 訊息 / 函式 payload，不帶先前項目 ID，同時保留工作階段 `prompt_cache_key`。
- OpenAI Responses 系列重播會保留標準 `call_*|fc_*` 同模型推理配對，但會在 pi-ai payload 轉換前，決定性地正規化格式錯誤或過長的 `call_id` / function-call 項目 id。
- 工具結果配對修復可能會移動真正匹配的輸出，並為缺少工具呼叫的情況合成 Codex 風格的 `aborted` 輸出。
- 不做回合驗證或重新排序；不移除 thought 簽章。

**OpenAI 相容 Chat Completions**

- 歷史助理 thinking/reasoning 區塊會在重播前移除，讓本機和代理風格的 OpenAI 相容伺服器不會收到先前回合的推理欄位，例如 `reasoning` 或 `reasoning_content`。
- 目前同一回合的工具呼叫延續，會保留附著在工具呼叫上的助理推理區塊，直到工具結果已重播。
- 具有 `reasoning: true` 的自訂 / 自行託管模型項目會保留重播的推理中繼資料。
- 當提供者擁有的例外情況需要重播推理中繼資料作為其 wire protocol 要求時，可以選擇退出此行為。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具呼叫 id 清理：嚴格英數字元。
- 工具結果配對修復與合成工具結果。
- 回合驗證（Gemini 風格的回合交替）。
- Google 回合排序修正（如果歷史以助理開始，則前置一個極小的使用者 bootstrap）。
- Antigravity Claude：正規化 thinking 簽章；丟棄未簽署的 thinking 區塊。

**Anthropic / Minimax（Anthropic 相容）**

- 工具結果配對修復與合成工具結果。
- 回合驗證（合併連續使用者回合以滿足嚴格交替）。
- 啟用 thinking 時，尾端助理預填回合會從對外 Anthropic Messages payload 中移除，包括 Cloudflare AI 閘道路由。
- 工作階段已壓縮時，壓縮前的助理 thinking 簽章會在提供者重播前移除。Thinking 簽章在生成時會以密碼學方式綁定到對話前綴；壓縮後前綴會改變（摘要內容取代原始內容），因此重播原始簽章會導致 Anthropic 以「Invalid signature in thinking block」拒絕請求。Thinking 文字會以未簽署區塊保留，接著由下方規則處理。
- 缺少、空值或空白重播簽章的 thinking 區塊，會在提供者轉換前移除。如果這使助理回合變空，OpenClaw 會保留回合形狀，並放入非空的省略推理文字。
- 必須移除的舊版僅 thinking 助理回合會替換為非空的省略推理文字，讓提供者 adapter 不會丟棄重播回合。

**Amazon Bedrock（Converse API）**

- 空的助理串流錯誤回合會在重播前修復為非空的 fallback 文字區塊。Bedrock Converse 會拒絕 `content: []` 的助理訊息，因此含有 `stopReason:
"error"` 且內容為空的已持久化助理回合，也會在載入前於磁碟上修復。
- 只有空白文字區塊的助理串流錯誤回合會從記憶體內重播副本中丟棄，而不是重播無效的空白區塊。
- 工作階段已壓縮時，壓縮前的助理 thinking 簽章會在 Converse 重播前移除，原因與上方 Anthropic 相同。
- 缺少、空值或空白重播簽章的 Claude thinking 區塊，會在 Converse 重播前移除。如果這使助理回合變空，OpenClaw 會保留回合形狀，並放入非空的省略推理文字。
- 必須移除的舊版僅 thinking 助理回合會替換為非空的省略推理文字，讓 Converse 重播保留嚴格回合形狀。
- 重播會過濾 OpenClaw delivery-mirror 與閘道注入的助理回合。
- 圖片清理會透過全域規則套用。

**Mistral（包括基於 model-id 的偵測）**

- 工具呼叫 id 清理：strict9（英數字元，長度 9）。

**OpenRouter Gemini**

- Thought 簽章清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 啟用 reasoning 時，尾端助理預填回合會從已驗證的 OpenRouter OpenAI 相容 Anthropic 模型 payload 中移除，與直接 Anthropic 和 Cloudflare Anthropic 重播行為一致。

**其他所有項目**

- 僅圖片清理。

---

## 歷史行為（2026.1.22 前）

在 2026.1.22 發布前，OpenClaw 套用了多層對話紀錄衛生處理：

- 一個 **transcript-sanitize extension** 會在每次上下文建構時執行，並且可以：
  - 修復工具使用 / 結果配對。
  - 清理工具呼叫 id（包括保留 `_`/`-` 的非嚴格模式）。
- Runner 也會執行提供者特定清理，造成工作重複。
- 額外的 mutation 發生在提供者政策之外，包括在持久化前從助理文字中移除 `<final>` 標籤、丟棄空的助理錯誤回合，以及在工具呼叫後修剪助理內容。

這種複雜性導致跨提供者回歸（特別是 `openai-responses` `call_id|fc_id` 配對）。2026.1.22 清理移除了該 extension，將邏輯集中到 runner，並讓 OpenAI 除了圖片清理之外保持**不觸碰**。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
