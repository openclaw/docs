---
read_when:
    - 你正在偵錯與逐字稿結構相關的供應商請求遭拒問題
    - 你正在變更對話記錄清理或工具呼叫修復邏輯
    - 你正在調查不同供應商之間的工具呼叫 ID 不相符問題
summary: 參考：供應商專屬的逐字稿清理與修復規則
title: 對話記錄整理規範
x-i18n:
    generated_at: "2026-07-19T14:07:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b64deba757d0eb3fd2cd177b6b16f4e071abbf8965a05ac087dddf086fdc920
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 會在執行前（建構模型上下文時）對對話記錄套用**供應商特定修正**。其中大多數是為符合嚴格的供應商要求而進行的**記憶體內**調整。另一個工作階段檔案修復流程也可能在載入工作階段前重寫已儲存的 JSONL，但僅限格式錯誤的行，或不適合作為持久記錄的已保存對話輪次。已傳送的助理回覆會保留在磁碟上；移除供應商特定助理預填內容的操作只會在建構傳出酬載時進行。

進行修復時，原始檔案會先寫入暫時性的
`*.bak-<pid>-<ts>` 同層檔案，再進行不可部分完成的取代；取代成功後便會移除該檔案。只有在清理本身失敗時才會保留備份，並在此情況下回報其路徑。

範圍包括：

- 僅限執行階段的提示詞上下文不會進入使用者可見的對話輪次
- 工具呼叫 ID 清理
- 工具呼叫輸入驗證
- 工具結果配對修復
- 對話輪次驗證／排序
- 思考簽章清理
- 推理簽章清理
- 圖片酬載清理
- 供應商重播前的空白文字區塊清理
- 供應商重播前清理不完整且僅含推理、因長度限制中止的對話輪次
- 使用者輸入來源標記（用於跨工作階段路由的提示詞）
- 修復供 Bedrock Converse 重播的空白助理錯誤輪次

如需對話記錄儲存的詳細資訊，請參閱
[工作階段管理深入解析](/zh-TW/reference/session-management-compaction)。

---

## 全域規則：執行階段上下文不是使用者對話記錄

執行階段／系統上下文可加入某個對話輪次的模型提示詞，但它不是終端使用者撰寫的內容。OpenClaw 會為閘道回覆、佇列中的後續訊息、ACP、命令列介面和嵌入式 OpenClaw 執行保留獨立、面向對話記錄的提示詞主體。儲存的可見使用者輪次會使用該對話記錄主體，而非經執行階段資訊擴充的提示詞。

對於已保存執行階段包裝內容的舊版工作階段，閘道歷程介面會先套用顯示投影，再將訊息傳回 WebChat、終端介面、REST 或 SSE 用戶端。

---

## 執行位置

所有對話記錄整理都集中於嵌入式執行器：

- 原則選擇：`src/agents/transcript-policy.ts`
  （`resolveTranscriptPolicy`，以 `provider`、`modelApi` 和 `modelId` 為索引鍵）
- 清理／修復套用：`sanitizeSessionHistory`，位於
  `src/agents/embedded-agent-runner/replay-history.ts`

工作階段檔案的修復獨立於對話記錄整理，並會在載入前視需要執行：

- `repairSessionFileIfNeeded`，位於 `src/agents/session-file-repair.ts`
- 由 `src/agents/embedded-agent-runner/run/attempt.ts` 和
  `src/agents/embedded-agent-runner/compact.ts` 呼叫

---

## 全域規則：圖片清理

圖片酬載一律會經過清理，以避免因大小限制而遭供應商拒絕（縮小／重新壓縮過大的 base64 圖片）。這也有助於控制具視覺能力模型因圖片造成的權杖壓力：較低的最大尺寸可減少權杖用量，較高的尺寸則可保留細節。

實作：

- `sanitizeSessionMessagesImages`，位於
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages`，位於 `src/agents/tool-images.ts`
- 圖片邊長上限可透過 `agents.defaults.imageMaxDimensionPx` 設定
  （預設值：`1200`）
- 此流程巡覽重播內容時會移除空白文字區塊。
  因此變成空白的助理輪次會從重播副本中移除；變成空白的使用者輪次和工具結果輪次則會加入非空白的內容省略預留文字。

---

## 全域規則：格式錯誤的工具呼叫

在建構模型上下文前，會捨棄同時缺少 `input` 和 `arguments` 的助理工具呼叫區塊。這可避免因僅保存一部分的工具呼叫而遭供應商拒絕（例如在速率限制失敗後）。

實作：

- `sanitizeToolCallInputs`，位於 `src/agents/session-transcript-repair.ts`
- 套用於 `sanitizeSessionHistory`
  （`src/agents/embedded-agent-runner/replay-history.ts`）

---

## 全域規則：工具結果配對

在重寫供應商特定的呼叫 ID 前，工具結果會與每個助理輪次中的工具呼叫出現項目配對。供應商產生的 ID 可能在後續輪次中重複，因此與重複呼叫相鄰的結果會保留給該次出現項目。只有在恰好有一個尚未解析的出現項目可擁有錯置結果時，才會移動該結果；有歧義的額外結果會被捨棄，缺少結果的出現項目則會收到合成的錯誤結果。

實作：`sanitizeToolUseResultPairing`，位於
`src/agents/session-transcript-repair.ts`

---

## 全域規則：不完整且僅含推理的輪次

若助理輪次觸及供應商輸出限制，且僅包含推理或經遮蔽的推理內容，該輪次會從記憶體內的重播副本中省略。這類輪次含有不完整的供應商狀態，且可能帶有部分推理簽章。

空白且因長度限制中止的輪次會維持不變；包含可見文字、工具呼叫或未知內容區塊且因長度限制中止的輪次也是如此。已儲存的對話記錄不會被重寫。

實作：`normalizeAssistantReplayContent`，位於
`src/agents/embedded-agent-runner/replay-history.ts`

---

## 全域規則：跨工作階段輸入來源

當代理程式透過 `sessions_send` 將提示詞傳送至另一個工作階段時（包括代理程式對代理程式的回覆／公告步驟），OpenClaw 會使用 `message.provenance.kind = "inter_session"` 保存所建立的使用者輪次。

OpenClaw 也會在路由後的提示詞文字前，加上同一輪次的 `[Inter-session message] ... isUser=false`
標記，讓目前的模型呼叫能夠區分其他工作階段的輸出與外部終端使用者指示。若相關資訊可用，此標記會包含來源工作階段、頻道和工具。為了與供應商相容，對話記錄仍會使用 `role: "user"`，但可見文字和來源中繼資料都會將該輪次標示為跨工作階段資料。

重建上下文時，OpenClaw 會對僅有來源中繼資料的舊版已保存跨工作階段使用者輪次套用相同標記。

---

## 供應商矩陣（目前行為）

**OpenAI / OpenAI Codex**

- 僅執行圖片清理。
- 針對 OpenAI Responses/Codex 對話記錄，捨棄孤立的推理簽章（後方沒有內容區塊的獨立推理項目），並在模型路由切換後捨棄可重播的 OpenAI 推理。
- 保留可重播的 OpenAI Responses 推理項目酬載，包括經加密且摘要為空的項目，使手動／WebSocket 重播能讓必要的
  `rs_*` 狀態與助理輸出項目保持配對。
- 原生 ChatGPT Codex Responses 會遵循 Codex 線路協定的一致性，在保留工作階段 `prompt_cache_key` 的同時，重播先前不含原始項目 ID 的 Responses 推理／訊息／函式酬載。
- OpenAI Responses 系列重播會保留標準的 `call_*|fc_*`
  同模型推理配對，但會在轉換為 pi-ai 酬載前，以確定性方式正規化格式錯誤或過長的 `call_id`/函式呼叫項目 ID。
- 工具結果配對修復可能會移動實際配對的輸出，並為缺少結果的工具呼叫合成 Codex 樣式的 `aborted` 輸出。
- 不驗證或重新排序輪次；不移除思考簽章。

**OpenAI 相容的 Chat Completions**

- 重播前會移除歷史助理推理／思考區塊，避免本機和代理型 OpenAI 相容伺服器收到先前輪次的推理欄位，例如 `reasoning` 或 `reasoning_content`。
- 目前同一輪次的工具呼叫接續內容會讓助理推理區塊保持附加於工具呼叫，直到工具結果完成重播。
- 具有 `reasoning: true` 的自訂／自行託管模型項目會保留重播的推理中繼資料。
- 當其線路協定需要重播推理中繼資料時，供應商所屬的例外可選擇停用此行為。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具呼叫 ID 清理：嚴格限用英數字元。
- 工具結果配對修復和合成工具結果。
- 對話輪次驗證（Gemini 樣式的輪次交替）。
- Google 輪次排序修正（若歷程以助理開頭，則在前方加上一小段使用者啟動內容）。
- Antigravity Claude：正規化推理簽章；捨棄未簽署的推理區塊。

**Anthropic / Minimax（Anthropic 相容）**

- 工具結果配對修復和合成工具結果。
- 對話輪次驗證（合併連續的使用者輪次，以符合嚴格的交替要求）。
- 啟用推理時，會從傳出的 Anthropic Messages 酬載中移除尾端的助理預填輪次，包括 Cloudflare AI 閘道路由。
- 工作階段經過壓縮後，會在供應商重播前移除壓縮前的助理推理簽章。推理簽章在產生時會以密碼學方式綁定至對話前綴；壓縮後前綴會改變（摘要內容取代原始內容），因此重播原始簽章會導致 Anthropic 以 "Invalid signature in thinking block" 拒絕要求。推理文字會以未簽署區塊的形式保留，接著由下方規則處理。
- 重播簽章缺失、空白或僅含空白字元的推理區塊會在轉換至供應商格式前移除。如果這使助理輪次變成空白，OpenClaw 會使用非空白的推理省略文字來維持輪次結構。
- 必須移除的舊版僅含推理助理輪次會替換為非空白的推理省略文字，避免供應商轉接器捨棄該重播輪次。

**Amazon Bedrock（Converse API）**

- 空白的助理串流錯誤輪次會在重播前修復為非空白的後備文字區塊。Bedrock Converse 會拒絕具有 `content: []` 的助理訊息，因此具有 `stopReason:
"error"` 且內容為空的已保存助理輪次，也會在載入前於磁碟上修復。
- 僅含空白文字區塊的助理串流錯誤輪次會從記憶體內的重播副本中捨棄，而不重播無效的空白區塊。
- 工作階段經過壓縮後，會在 Converse 重播前移除壓縮前的助理推理簽章，原因與上述 Anthropic 相同。
- 重播簽章缺失、空白或僅含空白字元的 Claude 推理區塊會在 Converse 重播前移除。如果這使助理輪次變成空白，OpenClaw 會使用非空白的推理省略文字來維持輪次結構。
- 必須移除的舊版僅含推理助理輪次會替換為非空白的推理省略文字，使 Converse 重播維持嚴格的輪次結構。
- 重播會篩除 OpenClaw 傳送鏡像和閘道注入的助理輪次。
- 透過全域規則套用圖片清理。

**Mistral（包括依模型 ID 偵測）**

- 工具呼叫 ID 清理：strict9（英數字元，長度 9）。

**OpenRouter Gemini**

- 思考簽章清理：移除非 base64 的 `thought_signature` 值
  （保留 base64）。

**OpenRouter Anthropic**

- 啟用推理時，會從已驗證的 OpenRouter OpenAI 相容 Anthropic 模型酬載中移除尾端的助理預填輪次，使其符合直接 Anthropic 和 Cloudflare Anthropic 的重播行為。

**其他所有項目**

- 僅執行圖片清理。

---

## 歷史行為（2026.1.22 之前）

在 2026.1.22 版本發布前，OpenClaw 會套用多層對話記錄整理：

- 一個 **transcript-sanitize 外掛**會在每次建立內容脈絡時執行，並可：
  - 修復工具使用／結果的配對。
  - 清理工具呼叫 ID（包括保留
    `_`/`-` 的非嚴格模式）。
- 執行器也會執行供應商專屬的清理，因而
  重複處理相同工作。
- 供應商政策之外還會發生其他變更，包括
  在持久化之前從助理文字中移除 `<final>` 標籤、捨棄
  空白的助理錯誤輪次，以及截除工具
  呼叫之後的助理內容。

這種複雜性導致跨供應商的功能退步（尤其是
`openai-responses` `call_id|fc_id` 配對）。2026.1.22 的清理移除了
此外掛、將邏輯集中至執行器，並使 OpenAI 除了影像清理之外
**完全不修改**內容。

## 相關內容

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
