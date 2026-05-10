---
read_when:
    - 調整 thinking、fast-mode 或 verbose 指令解析或預設值
summary: /think、/fast、/verbose、/trace 的指令語法，以及推理可見性
title: 思考層級
x-i18n:
    generated_at: "2026-05-10T19:54:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## 功能

- 在任何傳入本文中使用行內指令：`/t <level>`、`/think:<level>`，或 `/thinking <level>`。
- 等級（別名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal →「think」
  - low →「think hard」
  - medium →「think harder」
  - high →「ultrathink」（最大預算）
  - xhigh →「ultrathink+」（GPT-5.2+ 與 Codex 模型，加上 Anthropic Claude Opus 4.7 effort）
  - adaptive → 供應商管理的自適應思考（支援 Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7，以及 Google Gemini 動態思考）
  - max → 供應商最大推理（Anthropic Claude Opus 4.7；Ollama 會將它對應到其最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 對應到 `xhigh`。
  - `highest` 對應到 `high`。
- 供應商注意事項：
  - 思考選單與選擇器由供應商設定檔驅動。供應商 Plugin 會宣告所選模型的確切等級集，包括二元 `on` 等標籤。
  - 只有支援它們的供應商/模型設定檔才會顯示 `adaptive`、`xhigh` 和 `max`。對不支援等級輸入的指令會被拒絕，並顯示該模型的有效選項。
  - 既有儲存的不支援等級會依供應商設定檔排名重新對應。在非自適應模型上，`adaptive` 會退回到 `medium`，而 `xhigh` 和 `max` 會退回到所選模型支援的最大非 off 等級。
  - Anthropic Claude 4.6 模型在未明確設定思考等級時，預設為 `adaptive`。
  - Anthropic Claude Opus 4.7 不會預設為自適應思考。除非你明確設定思考等級，否則其 API effort 預設值仍由供應商擁有。
  - Anthropic Claude Opus 4.7 會將 `/think xhigh` 對應到自適應思考加上 `output_config.effort: "xhigh"`，因為 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的 effort 設定。
  - Anthropic Claude Opus 4.7 也公開 `/think max`；它會對應到相同的供應商擁有最大 effort 路徑。
  - 直接 DeepSeek V4 模型會公開 `/think xhigh|max`；兩者都對應到 DeepSeek `reasoning_effort: "max"`，而較低的非 off 等級則對應到 `high`。
  - 經 OpenRouter 路由的 DeepSeek V4 模型會公開 `/think xhigh`，並傳送 OpenRouter 支援的 `reasoning_effort` 值。儲存的 `max` 覆寫會退回到 `xhigh`。
  - Ollama 支援思考的模型會公開 `/think low|medium|high|max`；`max` 會對應到原生 `think: "high"`，因為 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字串。
  - OpenAI GPT 模型會透過模型特定的 Responses API effort 支援來對應 `/think`。只有在目標模型支援時，`/think off` 才會傳送 `reasoning.effort: "none"`；否則 OpenClaw 會省略已停用的推理 payload，而不是傳送不支援的值。
  - 自訂 OpenAI 相容目錄項目可透過將 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 設為包含 `"xhigh"`，選擇加入 `/think xhigh`。這會使用相同的相容性中繼資料來對應傳出的 OpenAI 推理 effort payload，因此選單、工作階段驗證、agent CLI 和 `llm-task` 會與傳輸行為一致。
  - 過時的已設定 OpenRouter Hunter Alpha refs 會略過代理推理注入，因為該已退役路由可能透過推理欄位傳回最終答案文字。
  - Google Gemini 會將 `/think adaptive` 對應到 Gemini 的供應商擁有動態思考。Gemini 3 請求會省略固定的 `thinkingLevel`，而 Gemini 2.5 請求會傳送 `thinkingBudget: -1`；固定等級仍會對應到該模型系列最接近的 Gemini `thinkingLevel` 或預算。
  - Anthropic 相容串流路徑上的 MiniMax (`minimax/*`) 預設為 `thinking: { type: "disabled" }`，除非你在模型參數或請求參數中明確設定思考。這可避免從 MiniMax 的非原生 Anthropic 串流格式洩漏 `reasoning_content` 增量。
  - Z.AI (`zai/*`) 僅支援二元思考（`on`/`off`）。任何非 `off` 等級都會被視為 `on`（對應到 `low`）。
  - Moonshot (`moonshot/*`) 會將 `/think off` 對應到 `thinking: { type: "disabled" }`，並將任何非 `off` 等級對應到 `thinking: { type: "enabled" }`。啟用思考時，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 會將不相容的值正規化為 `auto`。

## 解析順序

1. 訊息上的行內指令（僅套用到該訊息）。
2. 工作階段覆寫（透過傳送只有指令的訊息來設定）。
3. 每個 agent 的預設值（設定中的 `agents.list[].thinkingDefault`）。
4. 全域預設值（設定中的 `agents.defaults.thinkingDefault`）。
5. 後援：可用時使用供應商宣告的預設值；否則具推理能力的模型會解析為 `medium` 或該模型最接近且支援的非 `off` 等級，而非推理模型則維持 `off`。

## 設定工作階段預設值

- 傳送**只有**指令的訊息（允許空白），例如 `/think:medium` 或 `/t high`。
- 這會固定在目前工作階段（預設依傳送者區分）。使用 `/think default` 清除工作階段覆寫，並繼承已設定/供應商預設值；別名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- `/think off` 會儲存明確的 off 覆寫。它會停用思考，直到你變更或清除工作階段覆寫。
- 會傳送確認回覆（`Thinking level set to high.` / `Thinking disabled.`）。如果等級無效（例如 `/thinking big`），指令會被拒絕並提供提示，工作階段狀態保持不變。
- 傳送沒有引數的 `/think`（或 `/think:`）以查看目前的思考等級。

## 依 agent 套用

- **嵌入式 Pi**：解析後的等級會傳遞到處理序內 Pi agent 執行階段。
- **Claude CLI 後端**：使用 `claude-cli` 時，非 off 等級會以 `--effort` 傳遞給 Claude Code；請參閱 [CLI 後端](/zh-TW/gateway/cli-backends)。

## 快速模式（/fast）

- 等級：`on|off|default`。
- 只有指令的訊息會切換工作階段快速模式覆寫，並回覆 `Fast mode enabled.` / `Fast mode disabled.`。使用 `/fast default` 清除工作階段覆寫，並繼承已設定的預設值；別名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- 傳送沒有模式的 `/fast`（或 `/fast status`）以查看目前有效的快速模式狀態。
- OpenClaw 會依以下順序解析快速模式：
  1. 行內/只有指令的 `/fast on|off` 覆寫（`/fast default` 會清除此層）
  2. 工作階段覆寫
  3. 每個 agent 的預設值（`agents.list[].fastModeDefault`）
  4. 每個模型設定：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 後援：`off`
- 對於 `openai/*`，快速模式會在支援的 Responses 請求上傳送 `service_tier=priority`，對應到 OpenAI 優先處理。
- 對於 `openai-codex/*`，快速模式會在 Codex Responses 上傳送相同的 `service_tier=priority` 旗標。OpenClaw 會在兩個驗證路徑之間保留一個共用的 `/fast` 切換。
- 對於直接公開的 `anthropic/*` 請求，包括傳送到 `api.anthropic.com` 的 OAuth 驗證流量，快速模式會對應到 Anthropic service tiers：`/fast on` 會設定 `service_tier=auto`，`/fast off` 會設定 `service_tier=standard_only`。
- 對於 Anthropic 相容路徑上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）會將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。
- 同時設定兩者時，明確的 Anthropic `serviceTier` / `service_tier` 模型參數會覆寫快速模式預設值。OpenClaw 仍會對非 Anthropic 代理基底 URL 略過 Anthropic service-tier 注入。
- `/status` 只有在啟用快速模式時才會顯示 `Fast`。

## 詳細指令（/verbose 或 /v）

- 等級：`on`（最小）| `full` | `off`（預設）。
- 只有指令的訊息會切換工作階段詳細記錄，並回覆 `Verbose logging enabled.` / `Verbose logging disabled.`；無效等級會傳回提示且不變更狀態。
- `/verbose off` 會儲存明確的工作階段覆寫；可在 Sessions UI 中選擇 `inherit` 來清除它。
- 行內指令只會影響該訊息；否則會套用工作階段/全域預設值。
- 傳送沒有引數的 `/verbose`（或 `/verbose:`）以查看目前的詳細等級。
- 啟用詳細模式時，會發出結構化工具結果的 agents（Pi、其他 JSON agents）會把每個工具呼叫作為各自的僅中繼資料訊息傳回；可用時前綴為 `<emoji> <tool-name>: <arg>`。這些工具摘要會在每個工具啟動時立即傳送（獨立對話泡泡），而不是作為串流增量。
- 工具失敗摘要在一般模式下仍會顯示，但原始錯誤詳細資料尾碼會被隱藏，除非 detailed 為 `on` 或 `full`。
- 當 detailed 為 `full` 時，工具輸出也會在完成後轉送（獨立對話泡泡，截斷到安全長度）。如果你在執行期間切換 `/verbose on|full|off`，後續工具對話泡泡會遵循新設定。
- `agents.defaults.toolProgressDetail` 控制 `/verbose` 工具摘要與進度草稿工具行的形狀。使用 `"explain"`（預設）取得精簡的人類可讀標籤，例如 `🛠️ Exec: checking JS syntax`；若你也想附加原始命令/詳細資料以便除錯，請使用 `"raw"`。每個 agent 的 `agents.list[].toolProgressDetail` 會覆寫預設值。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin 追蹤指令（/trace）

- 等級：`on` | `off`（預設）。
- 只有指令的訊息會切換工作階段 Plugin 追蹤輸出，並回覆 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 行內指令只會影響該訊息；否則會套用工作階段/全域預設值。
- 傳送沒有引數的 `/trace`（或 `/trace:`）以查看目前的追蹤等級。
- `/trace` 比 `/verbose` 範圍更窄：它只公開 Plugin 擁有的追蹤/除錯行，例如 Active Memory 除錯摘要。
- 追蹤行可能出現在 `/status` 中，也可能在一般助理回覆後作為後續診斷訊息出現。

## 推理可見性（/reasoning）

- 等級：`on|off|stream`。
- 只有指令的訊息會切換回覆中是否顯示思考區塊。
- 啟用時，推理會作為**獨立訊息**傳送，前綴為 `Reasoning:`。
- `stream`（僅 Telegram）：在回覆產生時將推理串流到 Telegram 草稿對話泡泡，然後傳送不含推理的最終答案。
- 別名：`/reason`。
- 傳送沒有引數的 `/reasoning`（或 `/reasoning:`）以查看目前的推理等級。
- 解析順序：行內指令，接著工作階段覆寫，接著每個 agent 的預設值（`agents.list[].reasoningDefault`），接著全域預設值（`agents.defaults.reasoningDefault`），最後是後援（`off`）。

格式錯誤的本機模型推理標籤會以保守方式處理。封閉的 `<think>...</think>` 區塊會在一般回覆中保持隱藏，且已可見文字之後未封閉的推理也會隱藏。如果回覆完全包在單一未封閉的起始標籤中，且否則會以空文字送出，OpenClaw 會移除格式錯誤的起始標籤並送出剩餘文字。

## 相關

- 提升模式文件位於 [提升模式](/zh-TW/tools/elevated)。

## Heartbeats

- Heartbeat 探測本文是已設定的 Heartbeat 提示（預設：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 訊息中的行內指令會照常套用（但避免從 Heartbeat 變更工作階段預設值）。
- Heartbeat 傳遞預設只傳送最終 payload。若也要傳送獨立的 `Reasoning:` 訊息（可用時），請設定 `agents.defaults.heartbeat.includeReasoning: true` 或每個 agent 的 `agents.list[].heartbeat.includeReasoning: true`。

## 網頁聊天 UI

- 網頁聊天的思考選擇器會在頁面載入時，從傳入工作階段儲存區/設定中對應工作階段已儲存的層級。
- 選擇另一個層級會立即透過 `sessions.patch` 寫入工作階段覆寫；它不會等到下一次傳送，也不是一次性的 `thinkingOnce` 覆寫。
- 第一個選項永遠是清除覆寫的選項。當工作階段繼承非關閉的有效預設值時，它會顯示 `Inherited: <resolved level>`；當繼承的思考停用時，則顯示 `Off`。
- 明確的選擇器選項會標示為覆寫，同時在有提供者標籤時保留提供者標籤（例如提供者標示為 `max` 的選項會顯示 `Override: maximum`）。
- 選擇器使用 Gateway 工作階段列/預設值傳回的 `thinkingLevels`，並保留 `thinkingOptions` 作為舊版標籤清單。瀏覽器使用者介面不會保留自己的提供者正規表示式清單；Plugin 擁有模型專屬的層級集。
- `/think:<level>` 仍可運作，並會更新相同的已儲存工作階段層級，因此聊天指令和選擇器會保持同步。

## 提供者設定檔

- 提供者 Plugin 可以公開 `resolveThinkingProfile(ctx)`，用來定義模型支援的層級和預設值。
- 代理 Claude 模型的提供者 Plugin 應重用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，讓直接 Anthropic 和代理目錄保持一致。
- 每個設定檔層級都有已儲存的標準 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），並且可以包含顯示用 `label`。二元提供者使用 `{ id: "low", label: "on" }`。
- 需要驗證明確思考覆寫的工具 Plugin 應使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 搭配 `api.runtime.agent.normalizeThinkingLevel(...)`；不應保留自己的提供者/模型層級清單。
- 可存取已設定自訂模型中繼資料的工具 Plugin 可以將 `catalog` 傳入 `resolveThinkingPolicy`，讓 `compat.supportedReasoningEfforts` 選用項目反映在 Plugin 端驗證中。
- 已發布的舊版鉤子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍作為相容性配接器保留，但新的自訂層級集應使用 `resolveThinkingProfile`。
- Gateway 列/預設值會公開 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，讓 ACP/聊天用戶端呈現與執行階段驗證相同的設定檔 id 和標籤。
