---
read_when:
    - 你正在偵錯與對話記錄格式相關的供應商請求遭拒問題
    - 你正在變更逐字稿清理或工具呼叫修復邏輯
    - 你正在調查不同供應商之間的工具呼叫 ID 不一致問題
summary: 參考：供應商特定的對話記錄清理與修復規則
title: 對話記錄整潔性
x-i18n:
    generated_at: "2026-07-11T21:47:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 會在執行前（建構模型上下文時）對逐字稿套用**供應商特定修正**。其中大多數是為符合供應商嚴格要求而進行的**記憶體內**調整。另有獨立的工作階段檔案修復流程，可能會在載入工作階段之前重寫已儲存的 JSONL，但僅限格式錯誤的行，或不適合作為有效持久記錄的已保存對話輪次。已傳送的助理回覆會保留在磁碟上；移除供應商特定的助理預填內容，只會在建構外送承載資料時進行。

進行修復時，系統會先將原始檔案寫入暫時性的同層 `*.bak-<pid>-<ts>` 檔案，再以不可分割方式取代原檔；取代成功後便會移除備份。只有在清理本身失敗時才會保留備份，並回報其路徑。

範圍包括：

- 避免僅供執行階段使用的提示詞上下文進入使用者可見的逐字稿對話輪次
- 工具呼叫識別碼清理
- 工具呼叫輸入驗證
- 工具結果配對修復
- 對話輪次驗證／排序
- 思維簽章清理
- 思考簽章清理
- 圖片承載資料清理
- 供應商重播前的空白文字區塊清理
- 供應商重播前，清理僅含未完整推理且因長度限制終止的對話輪次
- 使用者輸入來源標記（用於跨工作階段路由的提示詞）
- 修復供 Bedrock Converse 重播的空白助理錯誤對話輪次

如需逐字稿儲存的詳細資訊，請參閱
[工作階段管理深入解析](/zh-TW/reference/session-management-compaction)。

---

## 全域規則：執行階段上下文不是使用者逐字稿

執行階段／系統上下文可以加入某個對話輪次的模型提示詞，但它不是終端使用者撰寫的內容。OpenClaw 會為閘道回覆、排入佇列的後續訊息、ACP、命令列介面及嵌入式 OpenClaw 執行保留獨立的逐字稿提示詞本文。已儲存且可見的使用者對話輪次會使用該逐字稿本文，而非經執行階段資訊擴充的提示詞。

對於已保存執行階段包裝內容的舊版工作階段，閘道歷史記錄介面會先套用顯示投影，再將訊息傳回 WebChat、終端介面、REST 或 SSE 用戶端。

---

## 執行位置

所有逐字稿整理作業都集中於嵌入式執行器：

- 政策選擇：`src/agents/transcript-policy.ts`
  （`resolveTranscriptPolicy`，以 `provider`、`modelApi` 和 `modelId` 為鍵）
- 套用清理／修復：`src/agents/embedded-agent-runner/replay-history.ts` 中的
  `sanitizeSessionHistory`

工作階段檔案修復獨立於逐字稿整理，會在載入前視需要執行：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 由 `src/agents/embedded-agent-runner/run/attempt.ts` 和
  `src/agents/embedded-agent-runner/compact.ts` 呼叫

---

## 全域規則：圖片清理

系統一律會清理圖片承載資料，以避免超出大小限制而遭供應商拒絕（縮小／重新壓縮過大的 base64 圖片）。這也有助於控制具視覺能力模型因圖片產生的權杖壓力：較小的最大尺寸可減少權杖用量，較大的尺寸則可保留細節。

實作：

- `src/agents/embedded-agent-helpers/images.ts` 中的
  `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 圖片邊長上限可透過 `agents.defaults.imageMaxDimensionPx` 設定
  （預設值：`1200`）
- 此流程巡覽重播內容時，也會移除空白文字區塊。
  因此變成空白的助理對話輪次會從重播副本中移除；變成空白的使用者及工具結果對話輪次，則會收到非空白的內容省略預留文字。

---

## 全域規則：格式錯誤的工具呼叫

在建構模型上下文前，會移除同時缺少 `input` 和 `arguments` 的助理工具呼叫區塊。這可防止部分保存的工具呼叫遭供應商拒絕（例如發生速率限制錯誤之後）。

實作：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 套用於 `sanitizeSessionHistory`
  （`src/agents/embedded-agent-runner/replay-history.ts`）

---

## 全域規則：僅含未完整推理的對話輪次

如果助理對話輪次達到供應商輸出限制，且僅含思考或經遮蔽的思考內容，則會從記憶體內重播副本中省略。這類對話輪次包含未完整的供應商狀態，並可能帶有不完整的思考簽章。

空白且因長度限制終止的對話輪次會維持不變；含有可見文字、工具呼叫或未知內容區塊且因長度限制終止的對話輪次亦同。系統不會重寫已儲存的逐字稿。

實作：`src/agents/embedded-agent-runner/replay-history.ts` 中的
`normalizeAssistantReplayContent`

---

## 全域規則：跨工作階段輸入來源

當代理透過 `sessions_send` 將提示詞傳送至另一個工作階段時（包括代理對代理的回覆／公告步驟），OpenClaw 會以 `message.provenance.kind = "inter_session"` 保存建立的使用者對話輪次。

OpenClaw 也會在路由後的提示詞文字前，加上同一對話輪次的 `[Inter-session message] ... isUser=false` 標記，讓目前的模型呼叫可以區分其他工作階段的輸出與外部終端使用者指令。若可取得，此標記會包含來源工作階段、頻道及工具。為了與供應商相容，逐字稿仍使用 `role: "user"`，但可見文字與來源中繼資料都會將該對話輪次標示為跨工作階段資料。

重建上下文時，OpenClaw 會對僅含來源中繼資料的舊版已保存跨工作階段使用者對話輪次套用相同標記。

---

## 供應商矩陣（目前行為）

**OpenAI／OpenAI Codex**

- 僅清理圖片。
- 對 OpenAI Responses/Codex 逐字稿移除孤立的推理簽章（後方沒有內容區塊的獨立推理項目），並在模型路由切換後移除可重播的 OpenAI 推理。
- 保留可重播的 OpenAI Responses 推理項目承載資料，包括已加密且摘要為空的項目，使手動／WebSocket 重播時，必要的 `rs_*` 狀態仍能與助理輸出項目配對。
- 原生 ChatGPT Codex Responses 會依循 Codex 線路協定的一致性要求，在不包含先前項目識別碼的情況下重播先前的 Responses 推理／訊息／函式承載資料，同時保留工作階段的 `prompt_cache_key`。
- OpenAI Responses 系列重播會保留標準的 `call_*|fc_*` 同模型推理配對，但會在轉換為 pi-ai 承載資料前，以確定性方式正規化格式錯誤或過長的 `call_id`／函式呼叫項目識別碼。
- 工具結果配對修復可能會移動實際相符的輸出，並為缺少結果的工具呼叫合成 Codex 風格的 `aborted` 輸出。
- 不驗證或重新排序對話輪次；不移除思維簽章。

**相容 OpenAI 的 Chat Completions**

- 重播前會移除歷史助理思考／推理區塊，避免本機及代理式的 OpenAI 相容伺服器收到先前對話輪次的推理欄位，例如 `reasoning` 或 `reasoning_content`。
- 目前同一對話輪次中的工具呼叫接續內容，會讓助理推理區塊保持附加於工具呼叫，直到工具結果完成重播。
- 設有 `reasoning: true` 的自訂／自行託管模型項目會保留重播的推理中繼資料。
- 若供應商的線路協定要求重播推理中繼資料，供應商擁有的例外可以選擇退出此行為。

**Google（Generative AI／Gemini CLI／Antigravity）**

- 工具呼叫識別碼清理：嚴格限制為英數字元。
- 工具結果配對修復及合成工具結果。
- 對話輪次驗證（Gemini 風格的對話輪次交替）。
- Google 對話輪次排序修正（若歷史記錄以助理開頭，則在前方加入極短的使用者啟動訊息）。
- Antigravity Claude：正規化思考簽章；移除未簽署的思考區塊。

**Anthropic／Minimax（相容 Anthropic）**

- 工具結果配對修復及合成工具結果。
- 對話輪次驗證（合併連續的使用者對話輪次，以符合嚴格的交替要求）。
- 啟用思考時，會從外送的 Anthropic Messages 承載資料中移除尾端助理預填對話輪次，包括 Cloudflare AI 閘道路由。
- 如果工作階段已完成壓縮，則會在供應商重播前移除壓縮前的助理思考簽章。思考簽章會在產生時以密碼學方式繫結至對話前綴；壓縮後，該前綴會改變（摘要內容取代原始內容），因此重播原始簽章會導致 Anthropic 以 "Invalid signature in thinking block" 拒絕要求。思考文字會保留為未簽署區塊，再由下方規則處理。
- 重播簽章缺失、空白或僅含空白字元的思考區塊，會在轉換為供應商格式前移除。若因此使助理對話輪次變成空白，OpenClaw 會以非空白的推理省略文字維持對話輪次結構。
- 必須移除的舊版僅含思考的助理對話輪次，會以非空白的推理省略文字取代，避免供應商轉接器捨棄該重播對話輪次。

**Amazon Bedrock（Converse API）**

- 重播前，會將空白的助理串流錯誤對話輪次修復為非空白的備援文字區塊。Bedrock Converse 會拒絕 `content: []` 的助理訊息，因此，含有 `stopReason:
"error"` 且內容為空的已保存助理對話輪次，也會在載入前於磁碟上修復。
- 僅含空白文字區塊的助理串流錯誤對話輪次，會從記憶體內重播副本中移除，而不是重播無效的空白區塊。
- 如果工作階段已完成壓縮，則會在 Converse 重播前移除壓縮前的助理思考簽章，原因與上述 Anthropic 相同。
- 重播簽章缺失、空白或僅含空白字元的 Claude 思考區塊，會在 Converse 重播前移除。若因此使助理對話輪次變成空白，OpenClaw 會以非空白的推理省略文字維持對話輪次結構。
- 必須移除的舊版僅含思考的助理對話輪次，會以非空白的推理省略文字取代，使 Converse 重播維持嚴格的對話輪次結構。
- 重播會篩除 OpenClaw 傳送鏡像與閘道注入的助理對話輪次。
- 依全域規則套用圖片清理。

**Mistral（包括依模型識別碼偵測）**

- 工具呼叫識別碼清理：strict9（英數字元，長度為 9）。

**OpenRouter Gemini**

- 思維簽章清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 啟用推理時，會從經驗證的 OpenRouter OpenAI 相容 Anthropic 模型承載資料中移除尾端助理預填對話輪次，以符合直接 Anthropic 及 Cloudflare Anthropic 的重播行為。

**其他所有供應商**

- 僅清理圖片。

---

## 歷史行為（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 會套用多層逐字稿整理：

- 每次建構上下文時，都會執行一個**逐字稿清理擴充功能**，其可執行：
  - 修復工具使用／結果配對。
  - 清理工具呼叫識別碼（包括保留 `_`／`-` 的非嚴格模式）。
- 執行器也會進行供應商特定的清理，因而產生重複作業。
- 其他變更則發生在供應商政策之外，包括在保存前從助理文字中移除 `<final>` 標籤、捨棄空白的助理錯誤對話輪次，以及裁切工具呼叫後的助理內容。

這種複雜性造成了跨供應商迴歸問題（尤其是 `openai-responses` 的 `call_id|fc_id` 配對）。2026.1.22 的清理移除了該擴充功能，將邏輯集中至執行器，並讓 OpenAI 除圖片清理外**完全不做修改**。

## 相關內容

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
