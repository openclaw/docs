---
read_when:
    - 調整思考、快速模式或詳細指令的解析或預設值
summary: /think、/fast、/verbose、/trace 的指令語法，以及推理可見性
title: 思考層級
x-i18n:
    generated_at: "2026-07-03T09:24:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
    source_path: tools/thinking.md
    workflow: 16
---

## 功能說明

- 在任何傳入本文中的內嵌指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 等級（別名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal →「思考」
  - low →「深度思考」
  - medium →「更深度思考」
  - high →「極限思考」（最大預算）
  - xhigh →「極限思考+」（GPT-5.2+ 與 Codex 模型，加上 Anthropic Claude Opus 4.7+ effort）
  - adaptive → 供應商管理的自適應思考（支援 Claude 4.6 on Anthropic/Bedrock、Anthropic Claude Opus 4.7+，以及 Google Gemini 動態思考）
  - max → 供應商最大推理（Anthropic Claude Opus 4.7+；Ollama 會將此對應到其最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 與 `extra_high` 對應到 `xhigh`。
  - `highest` 對應到 `high`。
- 供應商注意事項：
  - 思考選單與選取器由供應商設定檔驅動。供應商外掛會宣告所選模型的精確等級集合，包括像二元 `on` 這類標籤。
  - `adaptive`、`xhigh` 與 `max` 只會針對支援它們的供應商/模型設定檔顯示。輸入不支援等級的型別化指令會被拒絕，並附上該模型的有效選項。
  - 現有已儲存的不支援等級會依供應商設定檔排名重新對應。`adaptive` 在非自適應模型上會退回 `medium`，而 `xhigh` 與 `max` 會退回所選模型支援的最大非 off 等級。
  - 未設定明確思考等級時，Anthropic Claude 4.6 模型預設為 `adaptive`。
  - 除非你明確設定思考等級，否則 Anthropic Claude Opus 4.8 與 Opus 4.7 會維持關閉思考。啟用自適應思考後，Opus 4.8 的供應商自有 effort 預設值為 `high`。
  - Anthropic Claude Opus 4.7+ 會將 `/think xhigh` 對應到自適應思考加上 `output_config.effort: "xhigh"`，因為 `/think` 是思考指令，而 `xhigh` 是 Opus effort 設定。
  - Anthropic Claude Opus 4.7+ 也公開 `/think max`；它會對應到相同的供應商自有最大 effort 路徑。
  - 直接 DeepSeek V4 模型公開 `/think xhigh|max`；兩者都對應到 DeepSeek `reasoning_effort: "max"`，而較低的非 off 等級會對應到 `high`。
  - 透過 OpenRouter 路由的 DeepSeek V4 模型公開 `/think xhigh`，並傳送 OpenRouter 支援的 `reasoning.effort` 值，而不是 DeepSeek 原生最上層 `reasoning_effort`。較低的非 off 等級會對應到 `high`，已儲存的 `max` 覆寫會退回 `xhigh`。
  - 支援思考的 Ollama 模型公開 `/think low|medium|high|max`；`max` 會對應到原生 `think: "high"`，因為 Ollama 的原生 API 接受 `low`、`medium` 與 `high` effort 字串。
  - OpenAI GPT 模型會依模型特定 Responses API effort 支援對應 `/think`。只有在目標模型支援時，`/think off` 才會傳送 `reasoning.effort: "none"`；否則 OpenClaw 會省略停用的推理 payload，而不是傳送不支援的值。
  - 自訂 OpenAI 相容 catalog 項目可透過將 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 設為包含 `"xhigh"` 來加入 `/think xhigh`。這會使用同一組對應外送 OpenAI 推理 effort payload 的相容性中繼資料，因此選單、工作階段驗證、代理命令列介面與 `llm-task` 都會和傳輸行為一致。
  - 過時的已設定 OpenRouter Hunter Alpha 參照會略過代理推理注入，因為該已停用路由可能透過推理欄位回傳最終答案文字。
  - Google Gemini 會將 `/think adaptive` 對應到 Gemini 的供應商自有動態思考。Gemini 3 請求會省略固定 `thinkingLevel`，而 Gemini 2.5 請求會傳送 `thinkingBudget: -1`；固定等級仍會對應到該模型家族最接近的 Gemini `thinkingLevel` 或預算。
  - Anthropic 相容串流路徑上的 MiniMax M2.x (`minimax/MiniMax-M2*`) 預設為 `thinking: { type: "disabled" }`，除非你在模型參數或請求參數中明確設定思考。這會避免 M2.x 非原生 Anthropic 串流格式洩漏 `reasoning_content` delta。MiniMax-M3（與 M3.x）不受此限制：M3 會發出正確的 Anthropic 思考區塊，且在停用思考時回傳空內容，因此 OpenClaw 會讓 M3 維持在供應商的省略/自適應思考路徑。
  - Z.AI (`zai/*`) 對多數 GLM 模型是二元（`on`/`off`）。GLM-5.2 是例外：它公開 `/think off|low|high|max`，將 `low` 與 `high` 對應到 Z.AI `reasoning_effort: "high"`，並將 `max` 對應到 `reasoning_effort: "max"`。
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) 一律會思考。其設定檔只公開 `on`，且 OpenClaw 會依 Moonshot 要求省略外送 `thinking` 欄位。其他 `moonshot/*` 模型會將 `/think off` 對應到 `thinking: { type: "disabled" }`，並將任何非 `off` 等級對應到 `thinking: { type: "enabled" }`。啟用思考時，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 會將不相容的值正規化為 `auto`。

## 解析順序

1. 訊息上的內嵌指令（只套用於該訊息）。
2. 工作階段覆寫（透過傳送僅含指令的訊息設定）。
3. 每代理預設值（設定中的 `agents.list[].thinkingDefault`）。
4. 全域預設值（設定中的 `agents.defaults.thinkingDefault`）。
5. 後援：有可用值時使用供應商宣告的預設值；否則具推理能力的模型會解析為 `medium` 或該模型最接近的受支援非 `off` 等級，非推理模型則維持 `off`。

## 設定工作階段預設值

- 傳送一則**只有**指令的訊息（允許空白），例如 `/think:medium` 或 `/t high`。
- 這會固定於目前工作階段（預設按傳送者區分）。使用 `/think default` 清除工作階段覆寫，並繼承已設定/供應商預設值；別名包括 `inherit`、`clear`、`reset` 與 `unpin`。
- `/think off` 會儲存明確的 off 覆寫。它會停用思考，直到你變更或清除工作階段覆寫。
- 會傳送確認回覆（`Thinking level set to high.` / `Thinking disabled.`）。如果等級無效（例如 `/thinking big`），命令會被拒絕並附上提示，工作階段狀態維持不變。
- 傳送不含引數的 `/think`（或 `/think:`）以查看目前思考等級。

## 依代理套用

- **嵌入式 OpenClaw**：解析後的等級會傳遞給程序內 OpenClaw 代理 runtime。
- **Claude 命令列介面後端**：使用 `claude-cli` 時，非 off 等級會以 `--effort` 傳遞給 Claude Code；請參閱[命令列介面後端](/zh-TW/gateway/cli-backends)。

## 快速模式（/fast）

- 等級：`auto|on|off|default`。
- 僅含指令的訊息會切換工作階段快速模式覆寫，並回覆 `Fast mode set to auto.`、`Fast mode enabled.` 或 `Fast mode disabled.`。使用 `/fast default` 清除工作階段覆寫，並繼承已設定的預設值；別名包括 `inherit`、`clear`、`reset` 與 `unpin`。
- 傳送不含模式的 `/fast`（或 `/fast status`）以查看目前有效的快速模式狀態。
- OpenClaw 會依下列順序解析快速模式：
  1. 內嵌/僅含指令的 `/fast auto|on|off` 覆寫（`/fast default` 會清除此層）
  2. 工作階段覆寫
  3. 每代理預設值（`agents.list[].fastModeDefault`）
  4. 每模型設定：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 後援：`off`
- `auto` 會讓工作階段/設定模式維持 auto，但每次新的模型呼叫都獨立解析。在自動截止前開始的呼叫會啟用快速模式；之後的重試、後援、工具結果或延續呼叫會以停用快速模式開始。截止預設為 60 秒；在作用中模型上設定 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 可變更它。
- 對於 `openai/*`，快速模式會透過在支援的 Responses 請求上傳送 `service_tier=priority`，對應到 OpenAI 優先處理。
- 對於 Codex 支援的 `openai/*` / `openai-codex/*` 模型，快速模式會在 Codex Responses 上傳送相同的 `service_tier=priority` 旗標。原生 Codex app-server 回合只會在 `turn/start` 或 thread 開始/恢復時收到 tier，因此 `auto` 無法為已在執行中的 app-server 回合重新分配 tier；它會套用到 OpenClaw 啟動的下一個模型回合。
- 對於直接公開的 `anthropic/*` 請求，包括傳送至 `api.anthropic.com` 的 OAuth 驗證流量，快速模式會對應到 Anthropic 服務層級：`/fast on` 設定 `service_tier=auto`，`/fast off` 設定 `service_tier=standard_only`。
- 對於 Anthropic 相容路徑上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）會將 `MiniMax-M2.7` 重寫為 `MiniMax-M2.7-highspeed`。
- 同時設定兩者時，明確的 Anthropic `serviceTier` / `service_tier` 模型參數會覆寫快速模式預設值。OpenClaw 仍會對非 Anthropic 代理 base URL 略過 Anthropic 服務層級注入。
- 啟用快速模式時，`/status` 會顯示 `Fast`；設定模式為 auto 時，會顯示 `Fast:auto`。

## 詳細指令（/verbose 或 /v）

- 等級：`on`（最小）| `full` | `off`（預設）。
- 僅含指令的訊息會切換工作階段詳細模式，並回覆 `Verbose logging enabled.` / `Verbose logging disabled.`；無效等級會回傳提示且不變更狀態。
- `/verbose off` 會儲存明確的工作階段覆寫；可在 Sessions UI 中選擇 `inherit` 來清除。
- 授權的外部頻道傳送者可以保存工作階段詳細模式覆寫。內部閘道/webchat 用戶端需要 `operator.admin` 才能保存。
- 內嵌指令只影響該訊息；其他情況會套用工作階段/全域預設值。
- 傳送不含引數的 `/verbose`（或 `/verbose:`）以查看目前詳細等級。
- 啟用詳細模式時，會發出結構化工具結果的代理會將每個工具呼叫作為自己的僅中繼資料訊息傳回；可用時會加上 `<emoji> <tool-name>: <arg>` 前綴。這些工具摘要會在每個工具啟動後立即傳送（分開的泡泡），而不是串流 delta。
- 工具失敗摘要在一般模式下仍可見，但原始錯誤詳細資料後綴會隱藏，除非詳細模式為 `full`。
- 詳細模式為 `full` 時，工具輸出也會在完成後轉送（分開的泡泡，截斷至安全長度）。如果你在執行中的 run 期間切換 `/verbose on|full|off`，後續工具泡泡會遵循新設定。
- `agents.defaults.toolProgressDetail` 控制 `/verbose` 工具摘要與進度草稿工具行的形式。使用 `"explain"`（預設）取得精簡的人類標籤，例如 `🛠️ Exec: checking JS syntax`；若也想附加原始命令/詳細資料以便偵錯，請使用 `"raw"`。每代理 `agents.list[].toolProgressDetail` 會覆寫預設值。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## 外掛追蹤指令（/trace）

- 等級：`on` | `off`（預設）。
- 僅含指令的訊息會切換工作階段外掛追蹤輸出，並回覆 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 內嵌指令只影響該訊息；其他情況會套用工作階段/全域預設值。
- 傳送不含引數的 `/trace`（或 `/trace:`）以查看目前追蹤等級。
- `/trace` 比 `/verbose` 更窄：它只公開外掛自有的追蹤/偵錯行，例如主動記憶偵錯摘要。
- 追蹤行可能出現在 `/status` 中，也可能在一般助理回覆後作為後續診斷訊息出現。

## 推理可見性（/reasoning）

- 等級：`on|off|stream`。
- 僅含指令的訊息會切換是否在回覆中顯示思考區塊。
- 啟用時，推理會以**獨立訊息**傳送，並加上 `Thinking` 前綴。
- `stream`：當作用中頻道支援推理預覽時，在產生回覆期間串流推理，然後傳送不含推理的最終答案。
- 別名：`/reason`。
- 傳送不含引數的 `/reasoning`（或 `/reasoning:`）以查看目前推理等級。
- 解析順序：內嵌指令，接著是工作階段覆寫，接著是每代理預設值（`agents.list[].reasoningDefault`），接著是全域預設值（`agents.defaults.reasoningDefault`），最後是後援（`off`）。

格式錯誤的本機模型推理標籤會以保守方式處理。封閉的 `<think>...</think>` 區塊在一般回覆中會保持隱藏，而在已可見文字之後未封閉的推理內容也會被隱藏。如果回覆完整包在單一未封閉的開頭標籤中，且否則會以空文字送出，OpenClaw 會移除格式錯誤的開頭標籤並送出剩餘文字。

## 相關

- 提權模式文件位於 [提權模式](/zh-TW/tools/elevated)。

## 心跳偵測

- 心跳偵測探測本文是已設定的心跳偵測提示（預設：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳偵測訊息中的內嵌指令會照常套用（但請避免從心跳偵測變更工作階段預設值）。
- 心跳偵測傳遞預設只送出最終承載。若也要傳送獨立的 `Thinking` 訊息（可用時），請設定 `agents.defaults.heartbeat.includeReasoning: true` 或每個代理的 `agents.list[].heartbeat.includeReasoning: true`。

## 網頁聊天使用者介面

- 網頁聊天思考選擇器會在頁面載入時，鏡像來自入站工作階段儲存區/設定的工作階段已儲存層級。
- 選擇另一個層級會立即透過 `sessions.patch` 寫入工作階段覆寫；它不會等待下一次傳送，也不是一次性的 `thinkingOnce` 覆寫。
- 第一個選項一律是清除覆寫選項。它會顯示 `Inherited: <resolved level>`，包括在繼承的思考已停用時顯示 `Inherited: Off`。
- 明確的選擇器選項會使用其直接層級標籤，同時在存在提供者標籤時保留提供者標籤（例如提供者標記的 `max` 選項顯示為 `Maximum`）。
- 選擇器使用閘道工作階段列/預設值傳回的 `thinkingLevels`，並將 `thinkingOptions` 保留為舊版標籤清單。瀏覽器使用者介面不會保留自己的提供者 regex 清單；外掛擁有模型特定的層級集。
- `/think:<level>` 仍可運作，並會更新相同的已儲存工作階段層級，因此聊天指令和選擇器會保持同步。

## 提供者設定檔

- 提供者外掛可以公開 `resolveThinkingProfile(ctx)`，以定義模型支援的層級和預設值。
- 代理 Claude 模型的提供者外掛應重用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，讓直接 Anthropic 和代理目錄保持一致。
- 每個設定檔層級都有已儲存的標準 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），也可以包含顯示 `label`。二元提供者使用 `{ id: "low", label: "on" }`。
- 設定檔掛鉤會在可用時接收合併後的目錄事實，包括 `reasoning`、`compat.thinkingFormat` 和 `compat.supportedReasoningEfforts`。請使用這些事實，僅在已設定的請求合約支援相符承載時公開二元或自訂設定檔。
- 需要驗證明確思考覆寫的工具外掛，應使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加上 `api.runtime.agent.normalizeThinkingLevel(...)`；它們不應保留自己的提供者/模型層級清單。
- 可存取已設定自訂模型中繼資料的工具外掛，可以將 `catalog` 傳入 `resolveThinkingPolicy`，讓 `compat.supportedReasoningEfforts` 的選擇加入反映在外掛端驗證中。
- 已發布的舊版掛鉤（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）會保留為相容性配接器，但新的自訂層級集應使用 `resolveThinkingProfile`。
- 閘道列/預設值會公開 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，讓 ACP/聊天用戶端呈現與執行階段驗證所用相同的設定檔 id 和標籤。
