---
read_when:
    - 你正在偵錯與對話記錄格式有關的供應商請求遭拒問題
    - 你正在變更逐字稿清理或工具呼叫修復邏輯
    - 你正在調查不同供應商之間的工具呼叫 ID 不相符問題
summary: 參考：供應商特定的逐字稿清理與修復規則
title: 對話記錄整潔化
x-i18n:
    generated_at: "2026-07-21T09:03:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d978772062cb2a81eb358bb5c62bd1261b433ffdc8acdbaa6679b121fbbf62
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 會在執行前（建立模型上下文時）對逐字稿套用**供應商專屬修正**。其中大多數是為滿足嚴格的供應商要求而進行的**記憶體內**調整。另一個工作階段檔案修復流程也可能在載入工作階段前改寫已儲存的 JSONL，但僅限格式錯誤的行，或不適合作為有效持久記錄的已保存輪次。
已傳送的助理回覆會保留在磁碟上；供應商專屬的助理預填內容移除只會在建構送出承載資料時進行。

進行修復時，原始檔案會先寫入暫時性的
`*.bak-<pid>-<ts>` 同層檔案，然後再以不可分割操作取代；取代成功後便會移除該檔案。只有在清理本身失敗時才會保留備份，並在此情況下回報其路徑。

範圍包括：

- 僅供執行階段使用的提示上下文不會出現在使用者可見的逐字稿輪次中
- 工具呼叫 ID 清理
- 工具呼叫輸入驗證
- 工具結果配對修復
- 輪次驗證／排序
- 思緒簽章清理
- 思考簽章清理
- 圖片承載資料清理
- 供應商重播前的空白文字區塊清理
- 供應商重播前的未完整、僅推理長度輪次清理
- 使用者輸入來源標記（用於跨工作階段路由的提示）
- Bedrock Converse 重播的空白助理錯誤輪次修復

如需逐字稿儲存的詳細資訊，請參閱
[工作階段管理深入解析](/zh-TW/reference/session-management-compaction)。

---

## 全域規則：執行階段上下文不是使用者逐字稿

執行階段／系統上下文可以加入某個輪次的模型提示，但並非終端使用者撰寫的內容。OpenClaw 會為閘道回覆、排入佇列的後續訊息、ACP、命令列介面及嵌入式 OpenClaw 執行保留獨立、面向逐字稿的提示本文。儲存的可見使用者輪次會使用此逐字稿本文，而非經執行階段內容擴充的提示。

對於已保存執行階段包裝內容的舊版工作階段，閘道歷史記錄介面會先套用顯示投影，再將訊息傳回 WebChat、終端介面、REST 或 SSE 用戶端。

---

## 執行位置

所有逐字稿清理作業均集中在嵌入式執行器中：

- 原則選擇：`src/agents/transcript-policy.ts`
  （`resolveTranscriptPolicy`，依 `provider`、`modelApi` 和 `modelId` 作為索引鍵）
- 清理／修復套用：`sanitizeSessionHistory`，位於
  `src/agents/embedded-agent-runner/replay-history.ts`

除逐字稿清理外，工作階段檔案也會在載入前視需要修復：

- `repairSessionFileIfNeeded`，位於 `src/agents/session-file-repair.ts`
- 由 `src/agents/embedded-agent-runner/run/attempt.ts` 和
  `src/agents/embedded-agent-runner/compact.ts` 呼叫

---

## 全域規則：圖片清理

圖片承載資料一律會清理，以免因大小限制而遭供應商端拒絕（縮小／重新壓縮過大的 base64 圖片）。這也有助於控制支援視覺功能之模型因圖片產生的權杖壓力：較低的最大尺寸可減少權杖使用量，較高的尺寸則能保留細節。

實作：

- `sanitizeSessionMessagesImages`，位於
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages`，位於 `src/agents/tool-images.ts`
- 圖片最大邊長可透過 `agents.defaults.imageMaxDimensionPx` 設定
  （預設：`1200`）
- 此流程巡覽重播內容時會移除空白文字區塊。
  因此變成空白的助理輪次會從重播副本中捨棄；變成空白的使用者
  和工具結果輪次則會收到非空白的內容省略預留文字。

---

## 全域規則：格式錯誤的工具呼叫

在建立模型上下文前，會捨棄同時缺少 `input` 和 `arguments` 的助理工具呼叫區塊。這可避免部分保存的工具呼叫遭供應商拒絕（例如在速率限制失敗後）。

實作：

- `sanitizeToolCallInputs`，位於 `src/agents/session-transcript-repair.ts`
- 套用於 `sanitizeSessionHistory`
  （`src/agents/embedded-agent-runner/replay-history.ts`）

---

## 全域規則：工具結果配對

在改寫供應商專屬的呼叫 ID 前，工具結果會與每個助理輪次中的工具呼叫出現項目配對。供應商產生的 ID 可能在後續輪次中重複，因此與重複呼叫相鄰的結果仍會歸屬於該次出現項目。只有在恰好有一個尚未解析的出現項目可擁有錯置結果時，才會移動該結果；有歧義的多餘結果會遭捨棄，而缺少結果的出現項目則會收到合成的錯誤結果。

實作：`sanitizeToolUseResultPairing`，位於
`src/agents/session-transcript-repair.ts`

---

## 全域規則：未完整或無輸出的僅推理輪次

在下列任一事件發生後，若助理輪次僅包含思考或經遮蔽的思考內容，便會從記憶體內的重播副本中省略：

- 供應商輸出限制以未完整的推理狀態結束輪次。
- 無輸出回覆清理移除了該輪次唯一可見的 `NO_REPLY` 文字。

無輸出回覆清理可避免嚴格供應商重建對話時，隱藏推理合併至後續的助理工具使用輪次。

空白的長度輪次會維持不變，包含可見文字、工具呼叫或未知內容區塊的長度輪次亦同。包含工具呼叫或未知內容區塊的無輸出回覆輪次也會維持不變。不會改寫已儲存的逐字稿。

實作：`normalizeAssistantReplayContent`，位於
`src/agents/embedded-agent-runner/replay-history.ts`

---

## 全域規則：跨工作階段輸入來源

當代理程式透過 `sessions_send` 將提示傳送至另一個工作階段時
（包括代理程式對代理程式的回覆／公告步驟），OpenClaw 會使用
`message.provenance.kind = "inter_session"` 保存所建立的使用者輪次。

OpenClaw 也會在路由提示文字前加上同輪次的 `[Inter-session message] ... isUser=false`
標記，讓作用中的模型呼叫能區分其他工作階段的輸出與外部終端使用者指示。可用時，此標記會包含來源工作階段、頻道和工具。為維持供應商相容性，逐字稿仍會使用 `role: "user"`，但可見文字和來源中繼資料都會將該輪次標記為跨工作階段資料。

重建上下文時，OpenClaw 會將相同標記套用至僅有來源中繼資料的舊版已保存跨工作階段使用者輪次。

---

## 供應商矩陣（目前行為）

**OpenAI／OpenAI Codex**

- 僅進行圖片清理。
- 針對 OpenAI Responses／Codex 逐字稿，捨棄孤立的推理簽章（後方沒有內容區塊的獨立推理項目），並在模型路由切換後捨棄可重播的 OpenAI 推理。
- 保留可重播的 OpenAI Responses 推理項目承載資料，包括經加密且摘要為空的項目，使手動／WebSocket 重播能讓所需的
  `rs_*` 狀態與助理輸出項目保持配對。
- 原生 ChatGPT Codex Responses 會透過重播先前不含既有項目 ID 的 Responses 推理／訊息／函式承載資料，同時保留工作階段 `prompt_cache_key`，以遵循 Codex 線路協定的一致性。
- OpenAI Responses 系列重播會保留標準的 `call_*|fc_*`
  同模型推理配對，但會在轉換為 pi-ai 承載資料前，以確定性方式正規化格式錯誤或過長的 `call_id`／函式呼叫項目 ID。
- 工具結果配對修復可能會移動真實的相符輸出，並針對缺少結果的工具呼叫合成 Codex 樣式的 `aborted` 輸出。
- 不進行輪次驗證或重新排序；不移除思緒簽章。

**OpenAI 相容的 Chat Completions**

- 重播前會移除歷史助理思考／推理區塊，因此本機與代理式 OpenAI 相容伺服器不會收到 `reasoning` 或 `reasoning_content` 等先前輪次的推理欄位。
- 目前同輪次的工具呼叫接續內容會讓助理推理區塊附加於工具呼叫，直到工具結果已重播為止。
- 具有 `reasoning: true` 的自訂／自行託管模型項目會保留重播的推理中繼資料。
- 當供應商擁有的線路協定需要重播推理中繼資料時，可透過例外設定選擇不套用此行為。

**Google（Generative AI／Gemini CLI／Antigravity）**

- 工具呼叫 ID 清理：嚴格限制為英數字元。
- 工具結果配對修復及合成工具結果。
- 輪次驗證（Gemini 樣式的輪次交替）。
- Google 輪次排序修正（若歷史記錄以助理開始，則在開頭加入一小段使用者啟動內容）。
- Antigravity Claude：正規化思考簽章；捨棄未簽章的思考區塊。

**Anthropic／Minimax（Anthropic 相容）**

- 工具結果配對修復及合成工具結果。
- 輪次驗證（合併連續的使用者輪次，以符合嚴格交替要求）。
- 啟用思考時，送出的 Anthropic Messages 承載資料會移除尾端的助理預填輪次，包括 Cloudflare AI 閘道路由。
- 工作階段經過壓縮後，會在供應商重播前移除壓縮前的助理思考簽章。思考簽章在產生時會以密碼學方式綁定對話前綴；壓縮後，前綴會改變（摘要內容會取代原始內容），因此重播原始簽章會導致 Anthropic 以 "Invalid signature in thinking block" 拒絕要求。思考文字會保留為未簽章區塊，接著由下方規則處理。
- 在轉換為供應商格式前，會移除缺少重播簽章、簽章為空或空白的思考區塊。若這使助理輪次變空，OpenClaw 會使用非空白的推理省略文字維持輪次結構。
- 必須移除的舊版僅思考助理輪次會以非空白的推理省略文字取代，避免供應商配接器捨棄該重播輪次。

**Amazon Bedrock（Converse API）**

- 重播前，空白的助理串流錯誤輪次會修復為非空白的後備文字區塊。Bedrock Converse 會拒絕含有 `content: []` 的助理訊息，因此具有 `stopReason:
"error"` 且內容為空的已保存助理輪次，也會在載入前於磁碟上修復。
- 若助理串流錯誤輪次僅含空白文字區塊，會從記憶體內的重播副本中捨棄，而非重播無效的空白區塊。
- 工作階段經過壓縮後，會在 Converse 重播前移除壓縮前的助理思考簽章，原因與上述 Anthropic 相同。
- 在 Converse 重播前，會移除缺少重播簽章、簽章為空或空白的 Claude 思考區塊。若這使助理輪次變空，OpenClaw 會使用非空白的推理省略文字維持輪次結構。
- 必須移除的舊版僅思考助理輪次會以非空白的推理省略文字取代，使 Converse 重播維持嚴格的輪次結構。
- 重播會篩除 OpenClaw 傳送鏡像及閘道注入的助理輪次。
- 依全域規則套用圖片清理。

**Mistral（包括依模型 ID 偵測）**

- 工具呼叫 ID 清理：strict9（英數字元，長度為 9）。

**OpenRouter Gemini**

- 思緒簽章清理：移除非 base64 的 `thought_signature` 值
  （保留 base64）。

**OpenRouter Anthropic**

- 啟用推理時，會從經驗證的 OpenRouter OpenAI 相容 Anthropic 模型承載資料中移除尾端助理預填輪次，使其符合直接 Anthropic 與 Cloudflare Anthropic 的重播行為。

**其他所有項目**

- 僅進行圖片清理。

---

## 歷史行為（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 會套用多層逐字稿
清理：

- A **transcript-sanitize 外掛**會在每次建構上下文時執行，並且可以：
  - 修復工具使用與結果的配對。
  - 清理工具呼叫 ID（包括保留
    `_`/`-` 的非嚴格模式）。
- 執行器也會執行供應商特定的清理，因而
  產生重複作業。
- 供應商政策之外還會發生其他變更，包括
  在持久化之前從助理文字中移除 `<final>` 標籤、捨棄
  空白的助理錯誤回合，以及裁切工具
  呼叫之後的助理內容。

這種複雜性造成跨供應商的迴歸問題（尤其是
`openai-responses` `call_id|fc_id` 配對）。2026.1.22 的清理移除了
此外掛、將邏輯集中至執行器，並使 OpenAI 除了圖片清理之外
**完全不修改**內容。

## 相關內容

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
