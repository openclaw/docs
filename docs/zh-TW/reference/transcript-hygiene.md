---
read_when:
    - 你正在偵錯與對話紀錄結構相關的提供者請求遭拒問題
    - 您正在變更對話記錄清理或工具呼叫修復邏輯
    - 你正在調查跨提供者的工具呼叫識別碼不相符問題
summary: 參考：供應商特定的對話記錄清理與修復規則
title: 對話記錄整理
x-i18n:
    generated_at: "2026-05-03T21:42:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 會在執行前（建構模型上下文時）對轉錄套用**供應商專屬修正**。其中大多數是為了滿足嚴格供應商要求而使用的**記憶體內**調整。另有一個獨立的工作階段檔案修復流程，也可能在載入工作階段前重寫已儲存的 JSONL，但只限於格式錯誤的行或無效持久記錄的已持久化回合。已傳遞的助理回覆會保留在磁碟上；供應商專屬的助理預填內容剝除只會在建構外送承載資料時發生。發生修復時，原始檔案會在工作階段檔案旁一併備份。

範圍包括：

- 僅執行期使用的提示上下文不會進入使用者可見的轉錄回合
- 工具呼叫 id 淨化
- 工具呼叫輸入驗證
- 工具結果配對修復
- 回合驗證 / 排序
- 思考簽章清理
- Thinking 簽章清理
- 圖片承載資料淨化
- 在供應商重播前清理空白文字區塊
- 使用者輸入來源標記（用於跨工作階段路由的提示）
- Bedrock Converse 重播的空助理錯誤回合修復

如果你需要轉錄儲存詳細資訊，請參閱：

- [工作階段管理深入說明](/zh-TW/reference/session-management-compaction)

---

## 全域規則：執行期上下文不是使用者轉錄

執行期/系統上下文可以加入某個回合的模型提示，但它不是
終端使用者撰寫的內容。OpenClaw 會為 Gateway 回覆、排入佇列的後續訊息、ACP、CLI，以及嵌入式 Pi
執行保留一份獨立的面向轉錄提示本文。已儲存的可見使用者回合會使用該轉錄本文，而不是
加入執行期內容的提示。

對於已經持久化執行期包裝的舊版工作階段，Gateway 歷史
介面會先套用顯示投影，再將訊息回傳給 WebChat、
TUI、REST 或 SSE 用戶端。

---

## 執行位置

所有轉錄衛生處理都集中在嵌入式執行器中：

- 政策選擇：`src/agents/transcript-policy.ts`
- 淨化/修復套用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

此政策會使用 `provider`、`modelApi` 和 `modelId` 來決定要套用的項目。

與轉錄衛生處理分開的是，工作階段檔案會在載入前視需要修復：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 從 `run/attempt.ts` 和 `compact.ts`（嵌入式執行器）呼叫

---

## 全域規則：圖片淨化

圖片承載資料一律會被淨化，以避免因大小
限制導致供應商端拒絕（縮小/重新壓縮過大的 base64 圖片）。

這也有助於控制支援視覺模型中圖片造成的 token 壓力。
較低的最大尺寸通常會減少 token 用量；較高的尺寸則保留細節。

實作：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大圖片邊長可透過 `agents.defaults.imageMaxDimensionPx` 設定（預設：`1200`）。
- 此流程走訪重播內容時會移除空白文字區塊。變成空的助理
  回合會從重播副本中丟棄；變成空的使用者與工具結果
  回合會收到非空的省略內容預留位置。

---

## 全域規則：格式錯誤的工具呼叫

缺少 `input` 和 `arguments` 的助理工具呼叫區塊會在建構
模型上下文前被丟棄。這可防止部分
持久化工具呼叫造成供應商拒絕（例如，在速率限制失敗之後）。

實作：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 在 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory` 套用

---

## 全域規則：跨工作階段輸入來源

當代理透過 `sessions_send` 將提示送入另一個工作階段時（包括
代理到代理的回覆/公告步驟），OpenClaw 會將建立的使用者回合持久化為：

- `message.provenance.kind = "inter_session"`

OpenClaw 也會在路由後的提示文字前，加上同一回合的 `[Inter-session message ... isUser=false]`
標記，讓目前作用中的模型呼叫可以區分
外來工作階段輸出與外部終端使用者指令。此標記在可用時會包含
來源工作階段、頻道與工具。為了供應商相容性，轉錄仍使用
`role: "user"`，但可見文字與來源中繼資料都會將該回合標記為跨工作階段資料。

在重建上下文期間，OpenClaw 會對較舊且只具有來源中繼資料的已持久化
跨工作階段使用者回合套用同樣的標記。

---

## 供應商矩陣（目前行為）

**OpenAI / OpenAI Codex**

- 僅圖片淨化。
- 對 OpenAI Responses/Codex 轉錄丟棄孤立的推理簽章（沒有後續內容區塊的獨立推理項目），並在模型路由切換後丟棄可重播的 OpenAI 推理。
- 保留可重播的 OpenAI Responses 推理項目承載資料，包括加密的空摘要項目，讓手動/WebSocket 重播能將必要的 `rs_*` 狀態與助理輸出項目配對。
- 不進行工具呼叫 id 淨化。
- 工具結果配對修復可能會移動真正相符的輸出，並為遺失的工具呼叫合成 Codex 風格的 `aborted` 輸出。
- 不進行回合驗證或重新排序。
- 遺失的 OpenAI Responses 系列工具輸出會被合成為 `aborted`，以符合 Codex 重播正規化。
- 不剝除思考簽章。

**OpenAI 相容 Gemma 4**

- 歷史助理 thinking/reasoning 區塊會在重播前被剝除，因此本機
  OpenAI 相容 Gemma 4 伺服器不會收到前一回合的推理內容。
- 目前同一回合的工具呼叫延續會保留附加在工具呼叫上的助理推理區塊，
  直到工具結果已被重播。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具呼叫 id 淨化：嚴格英數字元。
- 工具結果配對修復與合成工具結果。
- 回合驗證（Gemini 風格的回合交替）。
- Google 回合排序修正（若歷史以助理開頭，則前置一個極小的使用者 bootstrap）。
- Antigravity Claude：正規化 thinking 簽章；丟棄未簽署的 thinking 區塊。

**Anthropic / Minimax（Anthropic 相容）**

- 工具結果配對修復與合成工具結果。
- 回合驗證（合併連續使用者回合以滿足嚴格交替）。
- 啟用 thinking 時，尾端的助理預填回合會從外送 Anthropic Messages
  承載資料中剝除，包括 Cloudflare AI Gateway 路由。
- 缺少、空白或空字串重播簽章的 Thinking 區塊會在
  供應商轉換前被剝除。如果這讓助理回合變空，OpenClaw 會以非空的省略推理文字
  保留回合形狀。
- 較舊且必須剝除的純 thinking 助理回合會被取代為
  非空的省略推理文字，讓供應商配接器不會丟棄重播
  回合。

**Amazon Bedrock（Converse API）**

- 空的助理串流錯誤回合會在重播前修復為非空的備援文字區塊。
  Bedrock Converse 會拒絕含有 `content: []` 的助理訊息，因此
  具有 `stopReason: "error"` 且內容為空的已持久化助理回合也會
  在載入前於磁碟上修復。
- 只包含空白文字區塊的助理串流錯誤回合會
  從記憶體內重播副本中丟棄，而不是重播無效的空白區塊。
- 缺少、空白或空字串重播簽章的 Claude thinking 區塊會
  在 Converse 重播前被剝除。如果這讓助理回合變空，OpenClaw
  會以非空的省略推理文字保留回合形狀。
- 較舊且必須剝除的純 thinking 助理回合會被取代為
  非空的省略推理文字，讓 Converse 重播保留嚴格的回合形狀。
- 重播會過濾 OpenClaw 傳遞鏡像與 Gateway 注入的助理回合。
- 圖片淨化會依全域規則套用。

**Mistral（包括基於 model-id 的偵測）**

- 工具呼叫 id 淨化：strict9（長度 9 的英數字元）。

**OpenRouter Gemini**

- 思考簽章清理：剝除非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 啟用 reasoning 時，尾端助理預填回合會從已驗證的 OpenRouter
  OpenAI 相容 Anthropic 模型承載資料中剝除，與
  直接 Anthropic 和 Cloudflare Anthropic 重播行為一致。

**其他所有項目**

- 僅圖片淨化。

---

## 歷史行為（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 會套用多層轉錄衛生處理：

- 一個**轉錄淨化 Plugin**會在每次上下文建構時執行，並且可以：
  - 修復工具使用/結果配對。
  - 淨化工具呼叫 id（包括保留 `_`/`-` 的非嚴格模式）。
- 執行器也會執行供應商專屬淨化，造成重複工作。
- 額外的變更也會在供應商政策之外發生，包括：
  - 在持久化前從助理文字剝除 `<final>` 標籤。
  - 丟棄空的助理錯誤回合。
  - 在工具呼叫後修剪助理內容。

這種複雜性造成跨供應商回歸（尤其是 `openai-responses`
`call_id|fc_id` 配對）。2026.1.22 清理移除了 extension，將
邏輯集中到執行器，並讓 OpenAI 除圖片淨化外保持**不碰觸**。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
