---
read_when:
    - 調整思考、快速模式或詳細指令的解析方式或預設值
summary: /think、/fast、/verbose、/trace 與推理可見性的指令語法
title: 思考層級
x-i18n:
    generated_at: "2026-07-11T21:55:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## 功能說明

- 在任何傳入訊息正文中使用行內指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 層級（別名）：`off | minimal | low | medium | high | xhigh | adaptive | max | ultra`，大致對應 Anthropic 經典的「think」<「think hard」<「think harder」<「ultrathink」魔法詞階梯：
  - minimal ~「think」
  - low ~「think hard」
  - medium ~「think harder」
  - high ~「ultrathink」（最大預算）
  - xhigh ~「ultrathink+」（GPT-5.2+ 與 Codex 模型，以及 Anthropic Claude Opus 4.7+ 的投入程度）
  - adaptive → 由供應商管理的自適應思考（Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7+，以及 Google Gemini 動態思考支援）
  - max → 供應商的最大推理程度（Anthropic Claude Opus 4.7+；Ollama 會將其對應至原生 `think` 的最高投入程度）
  - ultra → 供應商的最大推理程度，並在所選模型／執行階段支援時主動協調子代理程式
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 會對應至 `xhigh`。
  - `highest` 會對應至 `high`。
- 供應商注意事項：
  - 思考選單與選擇器由供應商設定檔驅動。供應商外掛會宣告所選模型的確切層級集合，包括二元 `on` 等標籤。
  - 只有支援這些層級的供應商／模型／執行階段設定檔才會顯示 `adaptive`、`xhigh`、`max` 和 `ultra`。若輸入不支援的層級指令，系統會拒絕並列出該模型的有效選項。
  - 已儲存但不受支援的層級，會依供應商設定檔的排序重新對應。在不支援自適應思考的模型上，`adaptive` 會退回 `medium`；`xhigh` 和 `max` 則會退回所選模型支援的最大非 `off` 層級。
  - 未明確設定思考層級時，Anthropic Claude 4.6 模型預設使用 `adaptive`。
  - 除非您明確設定思考層級，否則 Anthropic Claude Opus 4.8 和 Opus 4.7 會保持關閉思考。啟用自適應思考後，Opus 4.8 由供應商管理的預設投入程度為 `high`。
  - Anthropic Claude Opus 4.7+ 會將 `/think xhigh` 對應至自適應思考加上 `output_config.effort: "xhigh"`，因為 `/think` 是思考指令，而 `xhigh` 是 Opus 的投入程度設定。
  - Anthropic Claude Opus 4.7+ 也提供 `/think max`；它會對應至相同的供應商管理最大投入程度路徑。
  - 直接使用的 DeepSeek V4 模型提供 `/think xhigh|max`；兩者都會對應至 DeepSeek 的 `reasoning_effort: "max"`，較低的非 `off` 層級則對應至 `high`。
  - 經由 OpenRouter 路由的 DeepSeek V4 模型提供 `/think xhigh`，並傳送 OpenRouter 支援的 `reasoning.effort` 值，而不是 DeepSeek 原生的頂層 `reasoning_effort`。較低的非 `off` 層級會對應至 `high`，已儲存的 `max` 覆寫值則會退回 `xhigh`。
  - 支援思考的 Ollama 模型提供 `/think low|medium|high|max`；`max` 會對應至原生 `think: "high"`，因為 Ollama 的原生 API 接受 `low`、`medium` 和 `high` 投入程度字串。
  - OpenAI GPT 模型會依各模型對 Responses API 投入程度的支援情況對應 `/think`。只有目標模型支援時，`/think off` 才會傳送 `reasoning.effort: "none"`；否則 OpenClaw 會省略已停用的推理承載資料，而不傳送不支援的值。
  - GPT-5.6 Sol 和 Terra 透過 Codex 執行階段提供原生 `/think ultra`。GPT-5.6 Luna 提供至 `max` 的各層級，因為其 Codex 目錄未宣告 Ultra。
  - 內嵌的 OpenClaw 執行階段為 GPT-5.6 Sol、Terra 和 Luna 提供邏輯上的 `/think ultra`。它會傳送供應商最大投入程度，並加入僅限該次執行的主動子代理程式協調指引。
  - 自訂的 OpenAI 相容目錄項目可將 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 設為包含 `"xhigh"`，以選擇啟用 `/think xhigh`。這會使用同一組相容性中繼資料來對應傳出的 OpenAI 推理投入程度承載資料，因此選單、工作階段驗證、代理程式命令列介面和 `llm-task` 的行為會與傳輸層一致。
  - 過時的已設定 OpenRouter Hunter Alpha 參照會略過代理推理注入，因為該已停用路由可能透過推理欄位傳回最終答案文字。
  - Google Gemini 會將 `/think adaptive` 對應至 Gemini 由供應商管理的動態思考。Gemini 3 請求會省略固定的 `thinkingLevel`，而 Gemini 2.5 請求會傳送 `thinkingBudget: -1`；固定層級仍會對應至該模型系列最接近的 Gemini `thinkingLevel` 或預算。
  - 在 Anthropic 相容串流路徑上，MiniMax M2.x（`minimax/MiniMax-M2*`）預設使用 `thinking: { type: "disabled" }`，除非您在模型參數或請求參數中明確設定思考。這可避免 M2.x 非原生 Anthropic 串流格式洩漏 `reasoning_content` 增量。MiniMax-M3（及 M3.x）不受此限制：M3 會產生正確的 Anthropic 思考區塊，並在停用思考時傳回空內容，因此 OpenClaw 會讓 M3 繼續使用供應商的省略／自適應思考路徑。
  - 對大多數 GLM 模型而言，Z.AI（`zai/*`）是二元模式（`on`／`off`）。GLM-5.2 是例外：它提供 `/think off|low|high|max`，將 `low` 和 `high` 對應至 Z.AI 的 `reasoning_effort: "high"`，並將 `max` 對應至 `reasoning_effort: "max"`。
  - Moonshot Kimi K2.7 Code（`moonshot/kimi-k2.7-code`）永遠會思考。其設定檔只提供 `on`，而 OpenClaw 會依 Moonshot 的要求省略傳出的 `thinking` 欄位。其他 `moonshot/*` 模型會將 `/think off` 對應至 `thinking: { type: "disabled" }`，並將任何非 `off` 層級對應至 `thinking: { type: "enabled" }`。啟用思考時，Moonshot 的 `tool_choice` 只接受 `auto|none`；OpenClaw 會將不相容的值正規化為 `auto`。

## 解析順序

1. 訊息中的行內指令（只套用至該則訊息）。
2. 工作階段覆寫（透過傳送僅含指令的訊息設定）。
3. 每個代理程式的預設值（設定中的 `agents.list[].thinkingDefault`）。
4. 全域預設值（設定中的 `agents.defaults.thinkingDefault`）。
5. 備援：若供應商有宣告預設值，則使用該值；否則，具備推理能力的模型會解析為 `medium` 或該模型支援且最接近的非 `off` 層級，不具推理能力的模型則維持 `off`。

## 設定工作階段預設值

- 傳送一則**只包含**指令的訊息（允許空白字元），例如 `/think:medium` 或 `/t high`。
- 該設定會持續套用於目前的工作階段（預設依傳送者區分）。使用 `/think default` 可清除工作階段覆寫，並繼承已設定的／供應商預設值；別名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- `/think off` 會儲存明確的關閉覆寫。它會停用思考，直到您變更或清除工作階段覆寫為止。
- 系統會傳送確認回覆（`Thinking level set to high.`／`Thinking disabled.`）。若層級無效（例如 `/thinking big`），系統會拒絕該命令並提供提示，且工作階段狀態不會改變。
- 傳送不含引數的 `/think`（或 `/think:`），即可查看目前的思考層級。

## 代理程式套用方式

- **內嵌 OpenClaw**：解析後的層級會傳遞至程序內的 OpenClaw 代理程式執行階段。
- **Claude 命令列介面後端**：使用 `claude-cli` 時，具體的非關閉層級會以 `--effort` 傳遞至 Claude Code；`adaptive` 會移除已設定的投入程度旗標，並將實際投入程度交由 Claude Code 的環境、設定與模型預設值決定。請參閱[命令列介面後端](/zh-TW/gateway/cli-backends)。

## 快速模式（/fast）

- 層級：`auto|on|off|default`。
- 僅含指令的訊息會切換工作階段的快速模式覆寫，並回覆 `Fast mode set to auto.`、`Fast mode enabled.` 或 `Fast mode disabled.`。使用 `/fast default` 可清除工作階段覆寫並繼承已設定的預設值；別名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- 傳送不含模式的 `/fast`（或 `/fast status`），即可查看目前實際生效的快速模式狀態。
- OpenClaw 會依下列順序解析快速模式：
  1. 行內／僅含指令的 `/fast auto|on|off` 覆寫（`/fast default` 會清除此層）
  2. 工作階段覆寫
  3. 每個代理程式的預設值（`agents.list[].fastModeDefault`）
  4. 每個模型的設定：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 備援：`off`
- `auto` 會將工作階段／設定模式維持為自動，但每次新的模型呼叫都會獨立解析。在自動截止時間前開始的呼叫會啟用快速模式；之後開始的重試、備援、工具結果或接續呼叫則會停用快速模式。截止時間預設為 60 秒；若要變更，請在作用中模型上設定 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`。
- 對於 `openai/*`，快速模式會在支援的 Responses 請求中傳送 `service_tier=priority`，以對應至 OpenAI 優先處理。
- 對於以 Codex 為後端的 `openai/*`／`openai-codex/*` 模型，快速模式會在 Codex Responses 上傳送相同的 `service_tier=priority` 旗標。原生 Codex 應用程式伺服器回合只會在 `turn/start` 或執行緒開始／恢復時接收該層級，因此 `auto` 無法重新設定已在執行中的應用程式伺服器回合層級；它會套用至 OpenClaw 啟動的下一個模型回合。
- 對於直接傳送至公用 `anthropic/*` 的請求，包括傳送至 `api.anthropic.com` 且透過 OAuth 驗證的流量，快速模式會對應至 Anthropic 服務層級：`/fast on` 設定 `service_tier=auto`，`/fast off` 設定 `service_tier=standard_only`。
- 對於 Anthropic 相容路徑上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）會將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。
- 同時設定時，明確的 Anthropic `serviceTier`／`service_tier` 模型參數會覆寫快速模式預設值。對於非 Anthropic 代理基底 URL，OpenClaw 仍會略過 Anthropic 服務層級注入。
- 啟用快速模式時，`/status` 會顯示 `Fast`；設定模式為自動時則顯示 `Fast:auto`。

## 詳細輸出指令（/verbose 或 /v）

- 層級：`on`（最少）| `full` | `off`（預設）。
- 僅含指令的訊息會切換工作階段的詳細輸出，並回覆 `Verbose logging enabled.`／`Verbose logging disabled.`；無效層級會傳回提示，但不會變更狀態。
- `/verbose off` 會儲存明確的工作階段覆寫；可在工作階段介面中選擇 `inherit` 來清除。
- 經授權的外部頻道傳送者可以保存工作階段的詳細輸出覆寫。內部閘道／網頁聊天用戶端需要 `operator.admin` 才能保存該設定。
- 行內指令只影響該則訊息；其他情況則套用工作階段／全域預設值。
- 傳送不含引數的 `/verbose`（或 `/verbose:`），即可查看目前的詳細輸出層級。
- 啟用詳細輸出時，會產生結構化工具結果的代理程式會將每次工具呼叫各自傳回為一則僅含中繼資料的訊息；若有可用資訊，會以 `<emoji> <tool-name>: <arg>` 作為前綴。這些工具摘要會在各工具啟動後立即傳送（各自獨立的訊息泡泡），而不是以串流增量傳送。
- 工具失敗摘要在一般模式下仍然可見，但除非詳細輸出設為 `full`，否則原始錯誤詳細資訊的後綴會被隱藏。
- 當詳細輸出設為 `full` 時，工具輸出也會在完成後轉送（獨立的訊息泡泡，並截斷至安全長度）。若在執行期間切換 `/verbose on|full|off`，後續工具訊息泡泡會遵循新的設定。
- `agents.defaults.toolProgressDetail` 控制 `/verbose` 工具摘要與進度草稿工具行的呈現形式。使用 `"explain"`（預設）可顯示精簡的人類可讀標籤，例如 `🛠️ Exec: checking JS syntax`；若除錯時還需要附加原始命令／詳細資訊，請使用 `"raw"`。每個代理程式的 `agents.list[].toolProgressDetail` 會覆寫預設值。
  - `explain`：`🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`：`🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## 外掛追蹤指令（/trace）

- 層級：`on` | `off`（預設）。
- 僅含指令的訊息會切換工作階段的外掛追蹤輸出，並回覆 `Plugin trace enabled.`／`Plugin trace disabled.`。
- 行內指令只影響該則訊息；其他情況則套用工作階段／全域預設值。
- 傳送不含引數的 `/trace`（或 `/trace:`），即可查看目前的追蹤層級。
- `/trace` 的範圍比 `/verbose` 更窄：它只會顯示由外掛擁有的追蹤／除錯行，例如主動記憶的除錯摘要。
- 追蹤行可能會出現在 `/status` 中，也可能在一般助理回覆後以後續診斷訊息顯示。

## 推理可見性（/reasoning）

- 等級：`on|off|stream`。
- 僅含指令的訊息會切換回覆中是否顯示思考區塊。
- 啟用後，推理內容會以**獨立訊息**傳送，並加上 `Thinking` 前綴。
- `stream`：當作用中的頻道支援推理預覽時，會在產生回覆期間串流推理內容，之後再傳送不含推理內容的最終答案。
- 別名：`/reason`。
- 傳送不含引數的 `/reasoning`（或 `/reasoning:`），即可查看目前的推理等級。
- 解析順序：行內指令、工作階段覆寫、各代理程式預設值（`agents.list[].reasoningDefault`）、全域預設值（`agents.defaults.reasoningDefault`），最後是備援值（`off`）。

格式錯誤的本機模型推理標籤會以保守方式處理。完整閉合的 `<think>...</think>` 區塊在一般回覆中會保持隱藏；若已出現可見文字，其後未閉合的推理內容也會隱藏。若回覆完全包在單一未閉合的起始標籤中，且原本會因文字為空而無法傳送，OpenClaw 會移除格式錯誤的起始標籤，並傳送剩餘文字。

## 相關內容

- 提升模式的文件請參閱[提升模式](/zh-TW/tools/elevated)。

## 心跳偵測

- 心跳偵測探查的本文是已設定的心跳偵測提示詞（預設值：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳偵測訊息中的行內指令會照常套用（但請避免透過心跳偵測變更工作階段預設值）。
- 心跳偵測預設只傳送最終承載內容。若也要傳送獨立的 `Thinking` 訊息（可用時），請設定 `agents.defaults.heartbeat.includeReasoning: true`，或針對各代理程式設定 `agents.list[].heartbeat.includeReasoning: true`。

## 網頁聊天介面

- 頁面載入時，網頁聊天的思考選擇器會反映傳入工作階段儲存區或設定中保存的工作階段等級。
- 選取其他等級時，會立即透過 `sessions.patch` 寫入工作階段覆寫；它不會等待下一次傳送，也不是一次性的 `thinkingOnce` 覆寫。
- 若在模型、推理或速度選擇器的變更仍在套用時傳送訊息，系統會等待所有待處理的選擇器修補完成；若變更失敗，訊息會保持未傳送狀態，以供檢查。
- 第一個選項一律是清除覆寫選項。它會顯示 `Inherited: <resolved level>`；繼承的思考功能停用時，則顯示 `Inherited: Off`。
- 明確選取的選擇器選項會使用其直接等級標籤，同時保留提供者標籤（若有），例如提供者為 `max` 選項標示的 `Maximum`。
- 選擇器使用閘道工作階段資料列或預設值傳回的 `thinkingLevels`，並保留 `thinkingOptions` 作為舊版標籤清單。瀏覽器介面不會維護自己的提供者規則運算式清單；各外掛負責模型專屬的等級集合。
- `/think:<level>` 仍然有效，並會更新相同的已儲存工作階段等級，因此聊天指令與選擇器會保持同步。

## 提供者設定檔

- 提供者外掛可以公開 `resolveThinkingProfile(ctx)`，以定義模型支援的等級與預設值。
- 代理 Claude 模型的提供者外掛應重複使用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，以確保直接使用 Anthropic 與代理目錄保持一致。
- 每個設定檔等級都有已儲存的標準 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、`max` 或 `ultra`），並可包含顯示用的 `label`。二元提供者使用 `{ id: "low", label: "on" }`。
- 設定檔掛鉤會在可用時接收合併後的目錄資訊，包括 `reasoning`、`compat.thinkingFormat` 與 `compat.supportedReasoningEfforts`。只有在已設定的請求合約支援對應的承載內容時，才應使用這些資訊公開二元或自訂設定檔。
- 需要驗證明確思考覆寫的工具外掛，應使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` 搭配 `api.runtime.agent.normalizeThinkingLevel(...)`；不應自行維護提供者或模型的等級清單。若工具擁有執行路徑（例如固定採用內嵌方式的執行），請傳入 `agentRuntime`。
- 可存取已設定自訂模型中繼資料的工具外掛，可以將 `catalog` 傳入 `resolveThinkingPolicy`，讓 `compat.supportedReasoningEfforts` 的選擇啟用設定反映在外掛端驗證中。
- 已發布的舊版掛鉤（`supportsXHighThinking`、`isBinaryThinking` 與 `resolveDefaultThinkingLevel`）會繼續作為相容性配接器保留，但新的自訂等級集合應使用 `resolveThinkingProfile`。
- 閘道資料列或預設值會公開 `thinkingLevels`、`thinkingOptions` 與 `thinkingDefault`，讓 ACP／聊天用戶端呈現與執行階段驗證所用內容相同的設定檔 ID 與標籤。
