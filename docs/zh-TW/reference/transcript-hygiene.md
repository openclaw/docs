---
read_when:
    - 你正在偵錯與對話紀錄結構相關的供應商請求遭拒問題
    - 你正在變更逐字稿清理或工具呼叫修復邏輯
    - 你正在調查各提供者之間的工具呼叫 ID 不一致問題
summary: 參考：供應商特定的轉錄清理與修復規則
title: 逐字稿衛生
x-i18n:
    generated_at: "2026-06-27T20:02:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 會在執行前（建構模型上下文時）對逐字稿套用**提供者特定修正**。其中大多數都是為了滿足嚴格提供者需求而使用的**記憶體內**調整。另一個工作階段檔案修復流程也可能在載入工作階段前重寫已儲存的 JSONL，但僅限於格式錯誤的行，或無效的持久記錄回合。已送達的助理回覆會保留在磁碟上；提供者特定的助理預填內容剝除只會在建構傳出酬載時發生。修復發生時，原始檔案會先寫入暫時性的 `*.bak-<pid>-<ts>` 同層備份，接著進行原子替換，並在替換成功後移除；只有在清理本身失敗時才會保留備份（此時會回報該路徑）。

範圍包括：

- 僅限執行期的提示上下文不進入使用者可見的逐字稿回合
- 工具呼叫 ID 清理
- 工具呼叫輸入驗證
- 工具結果配對修復
- 回合驗證／排序
- 思考簽章清理
- Thinking 簽章清理
- 圖片酬載清理
- 提供者重播前的空白文字區塊清理
- 提供者重播前的不完整純推理長度回合清理
- 使用者輸入來源標記（用於跨工作階段路由的提示）
- Bedrock Converse 重播的空助理錯誤回合修復

如果需要逐字稿儲存細節，請參閱：

- [工作階段管理深入解析](/zh-TW/reference/session-management-compaction)

---

## 全域規則：執行期上下文不是使用者逐字稿

執行期／系統上下文可以加入某個回合的模型提示，但它不是終端使用者撰寫的內容。OpenClaw 會為閘道回覆、排入佇列的 followup、ACP、命令列介面，以及嵌入式 OpenClaw 執行，保留一份獨立的逐字稿面向提示本文。已儲存的可見使用者回合會使用該逐字稿本文，而不是執行期強化後的提示。

對於已經持久化執行期包裝的舊版工作階段，閘道歷史記錄介面會先套用顯示投影，再將訊息回傳給 WebChat、終端介面、REST 或 SSE 用戶端。

---

## 執行位置

所有逐字稿清潔處理都集中在嵌入式 runner：

- 政策選擇：`src/agents/transcript-policy.ts`
- 清理／修復套用：`src/agents/embedded-agent-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

政策會使用 `provider`、`modelApi` 和 `modelId` 來決定要套用哪些處理。

與逐字稿清潔處理分開，工作階段檔案會在載入前依需要修復：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 由 `run/attempt.ts` 和 `compact.ts`（嵌入式 runner）呼叫

---

## 全域規則：圖片清理

圖片酬載一律會被清理，以防止因大小限制而遭提供者端拒絕（縮小／重新壓縮過大的 base64 圖片）。

這也有助於控制具備視覺能力模型因圖片造成的 token 壓力。較低的最大尺寸通常會減少 token 使用量；較高的尺寸會保留細節。

實作：

- `src/agents/embedded-agent-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大圖片邊長可透過 `agents.defaults.imageMaxDimensionPx` 設定（預設：`1200`）。
- 此流程走訪重播內容時會移除空白文字區塊。變成空的助理回合會從重播副本中丟棄；變成空的使用者和工具結果回合會收到非空的省略內容佔位符。

---

## 全域規則：格式錯誤的工具呼叫

缺少 `input` 和 `arguments` 的助理工具呼叫區塊，會在建構模型上下文前被丟棄。這可防止部分持久化的工具呼叫造成提供者拒絕（例如在速率限制失敗後）。

實作：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 在 `src/agents/embedded-agent-runner/replay-history.ts` 的 `sanitizeSessionHistory` 中套用

---

## 全域規則：不完整的純推理回合

只包含 thinking 或 redacted-thinking 內容，且命中提供者輸出限制的助理回合，會從記憶體內的重播副本中省略。這類回合包含不完整的提供者狀態，且可能攜帶部分 thinking 簽章。

空的長度回合維持不變；含有可見文字、工具呼叫或未知內容區塊的長度回合也維持不變。已儲存的逐字稿不會被重寫。

實作：

- `src/agents/embedded-agent-runner/replay-history.ts` 中的 `normalizeAssistantReplayContent`

---

## 全域規則：跨工作階段輸入來源

當代理透過 `sessions_send` 將提示傳送到另一個工作階段時（包括代理對代理的回覆／公告步驟），OpenClaw 會持久化建立出的使用者回合，並包含：

- `message.provenance.kind = "inter_session"`

OpenClaw 也會在路由後的提示文字前，於同一回合加上 `[Inter-session message ... isUser=false]` 標記，讓作用中的模型呼叫能區分外部工作階段輸出與外部終端使用者指令。可用時，此標記會包含來源工作階段、頻道和工具。為了提供者相容性，逐字稿仍使用 `role: "user"`，但可見文字與來源中繼資料都會將該回合標示為跨工作階段資料。

在重建上下文期間，OpenClaw 會把相同標記套用到較舊的已持久化跨工作階段使用者回合，這些回合只有來源中繼資料。

---

## 提供者矩陣（目前行為）

**OpenAI / OpenAI Codex**

- 僅圖片清理。
- 針對 OpenAI Responses/Codex 逐字稿，丟棄孤立的推理簽章（沒有後續內容區塊的獨立推理項目），並在模型路由切換後丟棄可重播的 OpenAI 推理。
- 保留可重播的 OpenAI Responses 推理項目酬載，包括加密的空摘要項目，讓手動／WebSocket 重播能保留與助理輸出項目配對所需的 `rs_*` 狀態。
- 原生 ChatGPT Codex Responses 會重播先前的 Responses 推理／訊息／函式酬載且不帶先前項目 ID，同時保留工作階段 `prompt_cache_key`，以符合 Codex 線路格式一致性。
- OpenAI Responses 系列重播會保留標準的 `call_*|fc_*` 同模型推理配對，但會在轉換成 pi-ai 酬載前，決定性地正規化格式錯誤或過長的 `call_id`／函式呼叫項目 ID。
- 工具結果配對修復可能會移動真實的已匹配輸出，並為缺少工具呼叫的情況合成 Codex 風格的 `aborted` 輸出。
- 不做回合驗證或重新排序。
- 缺少的 OpenAI Responses 系列工具輸出會被合成為 `aborted`，以符合 Codex 重播正規化。
- 不剝除思考簽章。

**OpenAI 相容 Chat Completions**

- 歷史助理 thinking／推理區塊會在重播前被剝除，讓本機與代理風格的 OpenAI 相容伺服器不會收到前序回合的推理欄位，例如 `reasoning` 或 `reasoning_content`。
- 目前同一回合的工具呼叫延續會保留附加在工具呼叫上的助理推理區塊，直到工具結果已重播。
- 具備 `reasoning: true` 的自訂／自架模型項目會保留重播的推理中繼資料。
- 提供者擁有的例外可以在其線路協定需要重播推理中繼資料時選擇退出。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具呼叫 ID 清理：嚴格英數字元。
- 工具結果配對修復與合成工具結果。
- 回合驗證（Gemini 風格的回合交替）。
- Google 回合排序修正（如果歷史記錄以助理開頭，則前置一個很小的使用者啟動訊息）。
- Antigravity Claude：正規化 thinking 簽章；丟棄未簽署的 thinking 區塊。

**Anthropic / Minimax（Anthropic 相容）**

- 工具結果配對修復與合成工具結果。
- 回合驗證（合併連續使用者回合以滿足嚴格交替）。
- 啟用 thinking 時，尾端的助理預填回合會從傳出的 Anthropic Messages 酬載中剝除，包括 Cloudflare AI Gateway 路由。
- 當工作階段已壓縮時，壓縮前的助理 thinking 簽章會在提供者重播前被剝除。Thinking 簽章在生成時會以密碼學方式綁定到對話前綴；壓縮後前綴會改變（摘要內容會由壓縮摘要取代），因此重播原始簽章會導致 Anthropic 以「Invalid signature in thinking block」拒絕請求。Thinking 文字會保留為未簽署區塊，接著由下方規則處理。
- 缺少、空白或空值重播簽章的 thinking 區塊會在提供者轉換前被剝除。如果這讓助理回合變空，OpenClaw 會保留回合形狀並放入非空的省略推理文字。
- 必須剝除的較舊純 thinking 助理回合，會替換為非空的省略推理文字，讓提供者配接器不會丟棄重播回合。

**Amazon Bedrock（Converse API）**

- 空的助理串流錯誤回合會在重播前修復為非空的備援文字區塊。Bedrock Converse 會拒絕含有 `content: []` 的助理訊息，因此含有 `stopReason: "error"` 且內容為空的已持久化助理回合，也會在載入前於磁碟上修復。
- 只包含空白文字區塊的助理串流錯誤回合，會從記憶體內重播副本中丟棄，而不是重播無效的空白區塊。
- 當工作階段已壓縮時，壓縮前的助理 thinking 簽章會在 Converse 重播前被剝除，原因與上述 Anthropic 相同。
- 缺少、空白或空值重播簽章的 Claude thinking 區塊，會在 Converse 重播前被剝除。如果這讓助理回合變空，OpenClaw 會保留回合形狀並放入非空的省略推理文字。
- 必須剝除的較舊純 thinking 助理回合，會替換為非空的省略推理文字，讓 Converse 重播維持嚴格回合形狀。
- 重播會過濾 OpenClaw 送達鏡像與閘道注入的助理回合。
- 圖片清理會透過全域規則套用。

**Mistral（包括基於模型 ID 的偵測）**

- 工具呼叫 ID 清理：strict9（長度 9 的英數字元）。

**OpenRouter Gemini**

- 思考簽章清理：剝除非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 啟用推理時，尾端助理預填回合會從已驗證的 OpenRouter OpenAI 相容 Anthropic 模型酬載中剝除，與直接 Anthropic 和 Cloudflare Anthropic 重播行為一致。

**其他所有項目**

- 僅圖片清理。

---

## 歷史行為（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 會套用多層逐字稿清潔處理：

- **逐字稿清理 extension** 會在每次上下文建構時執行，並可以：
  - 修復工具使用／結果配對。
  - 清理工具呼叫 ID（包括會保留 `_`/`-` 的非嚴格模式）。
- runner 也會執行提供者特定清理，造成工作重複。
- 其他變更會在提供者政策之外發生，包括：
  - 在持久化前從助理文字中剝除 `<final>` 標籤。
  - 丟棄空助理錯誤回合。
  - 在工具呼叫後修剪助理內容。

這種複雜性造成跨提供者迴歸（尤其是 `openai-responses` 的 `call_id|fc_id` 配對）。2026.1.22 清理移除了 extension，將邏輯集中到 runner，並讓 OpenAI 除圖片清理外維持**不觸碰**。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
