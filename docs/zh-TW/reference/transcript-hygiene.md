---
read_when:
    - 您正在偵錯與對話紀錄結構相關的提供者請求遭拒問題
    - 你正在變更對話記錄清理或工具呼叫修復邏輯
    - 你正在調查跨提供者的工具呼叫 ID 不相符問題
summary: 參考：供應商特定的對話記錄清理與修復規則
title: 對話記錄維護
x-i18n:
    generated_at: "2026-05-10T19:51:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 會在執行前（建立模型上下文）對對話紀錄套用**提供者特定修復**。其中大多數是為了滿足嚴格提供者要求而使用的**記憶體內**調整。另有一個獨立的工作階段檔案修復程序，也可能在載入工作階段前重寫儲存的 JSONL，但只限於格式錯誤的行，或作為持久記錄無效的已保存回合。已交付的助理回覆會保留在磁碟上；提供者特定的助理預填移除只會在建構外送酬載時發生。修復發生時，原始檔案會在工作階段檔案旁備份。

範圍包括：

- 僅限執行階段的提示上下文不進入使用者可見的對話紀錄回合
- 工具呼叫 ID 淨化
- 工具呼叫輸入驗證
- 工具結果配對修復
- 回合驗證 / 排序
- 思維簽章清理
- 思考簽章清理
- 圖片酬載淨化
- 提供者重播前的空白文字區塊清理
- 使用者輸入來源標記（用於跨工作階段路由提示）
- Bedrock Converse 重播的空助理錯誤回合修復

如果你需要對話紀錄儲存詳細資訊，請參閱：

- [工作階段管理深入說明](/zh-TW/reference/session-management-compaction)

---

## 全域規則：執行階段上下文不是使用者對話紀錄

執行階段/系統上下文可以新增到某個回合的模型提示中，但它不是
終端使用者撰寫的內容。OpenClaw 會為 Gateway 回覆、佇列中的後續訊息、ACP、CLI，以及嵌入式 Pi
執行，保留一個獨立的對話紀錄用提示正文。儲存的可見使用者回合會使用該對話紀錄正文，而不是
加入執行階段資訊的提示。

對於已保存執行階段包裝的舊版工作階段，Gateway 歷史記錄
介面會先套用顯示投影，再將訊息傳回給 WebChat、
TUI、REST 或 SSE 用戶端。

---

## 這在哪裡執行

所有對話紀錄衛生處理都集中在嵌入式執行器中：

- 策略選擇：`src/agents/transcript-policy.ts`
- 淨化/修復套用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

此策略會使用 `provider`、`modelApi` 和 `modelId` 來決定要套用哪些處理。

與對話紀錄衛生處理分開，工作階段檔案會在載入前視需要修復：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 從 `run/attempt.ts` 和 `compact.ts`（嵌入式執行器）呼叫

---

## 全域規則：圖片淨化

圖片酬載一律會被淨化，以避免因大小限制而遭提供者端拒絕
（縮小/重新壓縮過大的 base64 圖片）。

這也有助於控制具備視覺能力模型因圖片造成的 token 壓力。
較低的最大尺寸通常會降低 token 使用量；較高的尺寸則會保留細節。

實作：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 圖片最大邊長可透過 `agents.defaults.imageMaxDimensionPx` 設定（預設：`1200`）。
- 此程序走訪重播內容時會移除空白文字區塊。變成空的助理
  回合會從重播副本中移除；變成空的使用者與工具結果
  回合則會收到非空的省略內容預留文字。

---

## 全域規則：格式錯誤的工具呼叫

缺少 `input` 和 `arguments` 的助理工具呼叫區塊，會在建立模型上下文前被移除。這可避免提供者因部分保存的
工具呼叫而拒絕請求（例如，在速率限制失敗後）。

實作：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 套用於 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全域規則：跨工作階段輸入來源

當代理透過 `sessions_send` 將提示傳送到另一個工作階段（包括
代理對代理的回覆/公告步驟）時，OpenClaw 會保存所建立的使用者回合，並包含：

- `message.provenance.kind = "inter_session"`

OpenClaw 也會在路由後的提示文字前，加上同一回合的 `[Inter-session message ... isUser=false]`
標記，讓目前的模型呼叫能區分
外部工作階段輸出與外部終端使用者指令。可用時，此標記會包含
來源工作階段、頻道與工具。為了提供者相容性，對話紀錄仍使用
`role: "user"`，但可見文字與來源中繼資料都會將該回合標記為跨工作階段資料。

在重建上下文期間，OpenClaw 會對較舊且只有來源中繼資料的已保存
跨工作階段使用者回合，套用相同標記。

---

## 提供者矩陣（目前行為）

**OpenAI / OpenAI Codex**

- 僅圖片淨化。
- 對 OpenAI Responses/Codex 對話紀錄，移除孤立的推理簽章（沒有後續內容區塊的獨立推理項目），並在模型路由切換後移除可重播的 OpenAI 推理。
- 保留可重播的 OpenAI Responses 推理項目酬載，包括加密的空摘要項目，讓手動/WebSocket 重播能保留必要的 `rs_*` 狀態，並與助理輸出項目配對。
- 原生 ChatGPT Codex Responses 會遵循 Codex 線路一致性，在不帶先前項目 ID 的情況下重播先前的 Responses 推理/訊息/函式酬載，同時保留工作階段 `prompt_cache_key`。
- 不進行工具呼叫 ID 淨化。
- 工具結果配對修復可能會移動真正相符的輸出，並為遺失的工具呼叫合成 Codex 風格的 `aborted` 輸出。
- 不進行回合驗證或重新排序。
- 遺失的 OpenAI Responses 系列工具輸出會被合成為 `aborted`，以符合 Codex 重播正規化。
- 不移除思維簽章。

**OpenAI 相容 Chat Completions**

- 歷史助理思考/推理區塊會在重播前被移除，讓
  本機與代理風格的 OpenAI 相容伺服器不會收到先前回合的
  推理欄位，例如 `reasoning` 或 `reasoning_content`。
- 目前同一回合的工具呼叫延續會保留附加在工具呼叫上的助理推理區塊，
  直到工具結果已被重播。
- 當提供者擁有的例外情況因其線路通訊協定需要重播
  推理中繼資料時，可以選擇退出此處理。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具呼叫 ID 淨化：嚴格英數字元。
- 工具結果配對修復與合成工具結果。
- 回合驗證（Gemini 風格的回合交替）。
- Google 回合排序修正（如果歷史記錄以助理開頭，則前置一個極小的使用者啟動回合）。
- Antigravity Claude：正規化思考簽章；移除未簽署的思考區塊。

**Anthropic / Minimax（Anthropic 相容）**

- 工具結果配對修復與合成工具結果。
- 回合驗證（合併連續使用者回合，以滿足嚴格交替要求）。
- 啟用思考時，外送 Anthropic Messages
  酬載會移除尾端助理預填回合，包括 Cloudflare AI Gateway 路由。
- 缺少、為空或空白重播簽章的思考區塊，會在提供者轉換前被移除。如果這使助理回合變空，OpenClaw 會以非空的省略推理文字保留
  回合形狀。
- 較舊且必須被移除的純思考助理回合，會被替換為
  非空的省略推理文字，讓提供者配接器不會丟棄重播
  回合。

**Amazon Bedrock（Converse API）**

- 空的助理串流錯誤回合會在重播前修復為非空的後援文字區塊。
  Bedrock Converse 會拒絕 `content: []` 的助理訊息，因此
  已保存且具有 `stopReason: "error"` 與空內容的助理回合，也會
  在載入前於磁碟上修復。
- 只包含空白文字區塊的助理串流錯誤回合，會從記憶體內重播副本中移除，
  而不是重播無效的空白區塊。
- 缺少、為空或空白重播簽章的 Claude 思考區塊，會在 Converse 重播前被移除。如果這使助理回合變空，OpenClaw
  會以非空的省略推理文字保留回合形狀。
- 較舊且必須被移除的純思考助理回合，會被替換為
  非空的省略推理文字，讓 Converse 重播保留嚴格的回合形狀。
- 重播會篩除 OpenClaw 交付鏡像與 Gateway 注入的助理回合。
- 圖片淨化會透過全域規則套用。

**Mistral（包括基於模型 ID 的偵測）**

- 工具呼叫 ID 淨化：strict9（英數字元長度 9）。

**OpenRouter Gemini**

- 思維簽章清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 啟用推理時，已驗證的 OpenRouter
  OpenAI 相容 Anthropic 模型酬載會移除尾端助理預填回合，與
  直接 Anthropic 和 Cloudflare Anthropic 重播行為相符。

**其他所有項目**

- 僅圖片淨化。

---

## 歷史行為（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 會套用多層對話紀錄衛生處理：

- **對話紀錄淨化延伸功能**會在每次上下文建立時執行，並且可以：
  - 修復工具使用/結果配對。
  - 淨化工具呼叫 ID（包括保留 `_`/`-` 的非嚴格模式）。
- 執行器也會執行提供者特定淨化，造成工作重複。
- 其他變更發生在提供者策略之外，包括：
  - 在持久化前從助理文字中移除 `<final>` 標籤。
  - 丟棄空的助理錯誤回合。
  - 在工具呼叫後修剪助理內容。

這種複雜度造成跨提供者回歸（特別是 `openai-responses`
`call_id|fc_id` 配對）。2026.1.22 清理移除了該延伸功能，將
邏輯集中到執行器中，並讓 OpenAI 在圖片淨化之外保持**不碰觸**。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
