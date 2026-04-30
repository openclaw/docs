---
read_when:
    - 調整思考、快速模式或詳細指令的解析或預設值
summary: /think、/fast、/verbose、/trace 的指令語法，以及推理可見性
title: 思考層級
x-i18n:
    generated_at: "2026-04-30T03:47:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9fabead8d2f58fc5bce3bf8b281ad9d52da2cd02ba2777bc1597359537b7705
    source_path: tools/thinking.md
    workflow: 16
---

## 功能說明

- 任何傳入本文中的內嵌指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 層級（別名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal →「think」
  - low →「think hard」
  - medium →「think harder」
  - high →「ultrathink」（最大預算）
  - xhigh →「ultrathink+」（GPT-5.2+ 和 Codex 模型，加上 Anthropic Claude Opus 4.7 effort）
  - adaptive → 由提供者管理的自適應思考（支援 Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7，以及 Google Gemini 動態思考）
  - max → 提供者最大推理（Anthropic Claude Opus 4.7；Ollama 會將此對應到其最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 會對應到 `xhigh`。
  - `highest` 會對應到 `high`。
- 提供者注意事項：
  - 思考選單和選擇器由提供者設定檔驅動。提供者 Plugin 會宣告所選模型的確切層級集合，包括像二元 `on` 這類標籤。
  - 只有支援它們的提供者/模型設定檔才會顯示 `adaptive`、`xhigh` 和 `max`。針對不支援層級輸入的指令會被拒絕，並附上該模型的有效選項。
  - 現有已儲存的不支援層級會依提供者設定檔排名重新對應。在非自適應模型上，`adaptive` 會退回到 `medium`，而 `xhigh` 和 `max` 會退回到所選模型支援的最大非 off 層級。
  - Anthropic Claude 4.6 模型在未設定明確思考層級時，預設為 `adaptive`。
  - Anthropic Claude Opus 4.7 不會預設為自適應思考。除非你明確設定思考層級，否則其 API effort 預設值仍由提供者擁有。
  - Anthropic Claude Opus 4.7 會將 `/think xhigh` 對應到自適應思考加上 `output_config.effort: "xhigh"`，因為 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 effort 設定。
  - Anthropic Claude Opus 4.7 也公開 `/think max`；它會對應到相同的提供者擁有最大 effort 路徑。
  - Ollama 具備思考能力的模型會公開 `/think low|medium|high|max`；`max` 會對應到原生 `think: "high"`，因為 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字串。
  - OpenAI GPT 模型會透過模型特定的 Responses API effort 支援對應 `/think`。只有目標模型支援時，`/think off` 才會傳送 `reasoning.effort: "none"`；否則 OpenClaw 會省略停用推理的 payload，而不是傳送不支援的值。
  - 自訂 OpenAI 相容目錄項目可以透過將 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 設為包含 `"xhigh"`，選擇加入 `/think xhigh`。這會使用相同的 compat 中繼資料來對應傳出的 OpenAI 推理 effort payload，因此選單、工作階段驗證、代理 CLI 和 `llm-task` 都會與傳輸行為一致。
  - 過時設定的 OpenRouter Hunter Alpha 參照會略過代理推理注入，因為該已停用路由可能會透過推理欄位傳回最終答案文字。
  - Google Gemini 會將 `/think adaptive` 對應到 Gemini 提供者擁有的動態思考。Gemini 3 請求會省略固定的 `thinkingLevel`，而 Gemini 2.5 請求會傳送 `thinkingBudget: -1`；固定層級仍會對應到該模型系列最接近的 Gemini `thinkingLevel` 或預算。
  - Anthropic 相容串流路徑上的 MiniMax（`minimax/*`）預設為 `thinking: { type: "disabled" }`，除非你在模型參數或請求參數中明確設定思考。這可避免 MiniMax 非原生 Anthropic 串流格式外洩 `reasoning_content` 增量。
  - Z.AI（`zai/*`）只支援二元思考（`on`/`off`）。任何非 `off` 層級都會被視為 `on`（對應到 `low`）。
  - Moonshot（`moonshot/*`）會將 `/think off` 對應到 `thinking: { type: "disabled" }`，並將任何非 `off` 層級對應到 `thinking: { type: "enabled" }`。啟用思考時，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 會將不相容的值正規化為 `auto`。

## 解析順序

1. 訊息上的內嵌指令（只套用於該訊息）。
2. 工作階段覆寫（透過傳送只有指令的訊息設定）。
3. 每代理預設值（設定中的 `agents.list[].thinkingDefault`）。
4. 全域預設值（設定中的 `agents.defaults.thinkingDefault`）。
5. 備援：可用時使用提供者宣告的預設值；否則具備推理能力的模型會解析為 `medium` 或該模型最接近的支援非 `off` 層級，而非推理模型會維持 `off`。

## 設定工作階段預設值

- 傳送一則**只有**指令的訊息（允許空白），例如 `/think:medium` 或 `/t high`。
- 該設定會保留於目前工作階段（預設依傳送者區分）；可由 `/think:off` 或工作階段閒置重設清除。
- 會傳送確認回覆（`Thinking level set to high.` / `Thinking disabled.`）。如果層級無效（例如 `/thinking big`），命令會被拒絕並附上提示，且工作階段狀態不會變更。
- 傳送沒有引數的 `/think`（或 `/think:`）即可查看目前思考層級。

## 依代理套用

- **嵌入式 Pi**：解析後的層級會傳遞給同處理程序的 Pi 代理執行階段。

## 快速模式（/fast）

- 層級：`on|off`。
- 只有指令的訊息會切換工作階段快速模式覆寫，並回覆 `Fast mode enabled.` / `Fast mode disabled.`。
- 傳送沒有模式的 `/fast`（或 `/fast status`）即可查看目前有效的快速模式狀態。
- OpenClaw 會依此順序解析快速模式：
  1. 內嵌/只有指令的 `/fast on|off`
  2. 工作階段覆寫
  3. 每代理預設值（`agents.list[].fastModeDefault`）
  4. 每模型設定：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 備援：`off`
- 對於 `openai/*`，快速模式會在支援的 Responses 請求上傳送 `service_tier=priority`，對應到 OpenAI 優先處理。
- 對於 `openai-codex/*`，快速模式會在 Codex Responses 上傳送相同的 `service_tier=priority` 旗標。OpenClaw 會在兩種驗證路徑之間保留一個共用的 `/fast` 切換。
- 對於直接公開的 `anthropic/*` 請求，包括傳送到 `api.anthropic.com` 的 OAuth 驗證流量，快速模式會對應到 Anthropic 服務層級：`/fast on` 設定 `service_tier=auto`，`/fast off` 設定 `service_tier=standard_only`。
- 對於 Anthropic 相容路徑上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）會將 `MiniMax-M2.7` 重寫為 `MiniMax-M2.7-highspeed`。
- 明確的 Anthropic `serviceTier` / `service_tier` 模型參數會在兩者都設定時覆寫快速模式預設值。OpenClaw 仍會對非 Anthropic 代理基底 URL 略過 Anthropic 服務層級注入。
- `/status` 只會在啟用快速模式時顯示 `Fast`。

## 詳細指令（/verbose 或 /v）

- 層級：`on`（最小）| `full` | `off`（預設）。
- 只有指令的訊息會切換工作階段詳細記錄，並回覆 `Verbose logging enabled.` / `Verbose logging disabled.`；無效層級會回傳提示而不變更狀態。
- `/verbose off` 會儲存明確的工作階段覆寫；可透過 Sessions UI 選擇 `inherit` 來清除。
- 內嵌指令只影響該訊息；其他情況會套用工作階段/全域預設值。
- 傳送沒有引數的 `/verbose`（或 `/verbose:`）即可查看目前詳細層級。
- 詳細模式開啟時，會發出結構化工具結果的代理（Pi、其他 JSON 代理）會將每次工具呼叫作為自己的僅中繼資料訊息送回，可用時前綴為 `<emoji> <tool-name>: <arg>`（路徑/命令）。這些工具摘要會在每個工具啟動後立即傳送（獨立氣泡），而不是作為串流增量。
- 工具失敗摘要在一般模式中仍可見，但原始錯誤詳細資料後綴會隱藏，除非詳細層級為 `on` 或 `full`。
- 當詳細層級為 `full` 時，工具輸出也會在完成後轉送（獨立氣泡，截斷至安全長度）。如果你在執行期間切換 `/verbose on|full|off`，後續工具氣泡會遵守新設定。

## Plugin 追蹤指令（/trace）

- 層級：`on` | `off`（預設）。
- 只有指令的訊息會切換工作階段 Plugin 追蹤輸出，並回覆 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 內嵌指令只影響該訊息；其他情況會套用工作階段/全域預設值。
- 傳送沒有引數的 `/trace`（或 `/trace:`）即可查看目前追蹤層級。
- `/trace` 比 `/verbose` 更窄：它只會公開 Plugin 擁有的追蹤/偵錯行，例如 Active Memory 偵錯摘要。
- 追蹤行可能出現在 `/status` 中，以及正常助理回覆之後的後續診斷訊息中。

## 推理可見性（/reasoning）

- 層級：`on|off|stream`。
- 只有指令的訊息會切換是否在回覆中顯示思考區塊。
- 啟用時，推理會作為**獨立訊息**傳送，前綴為 `Reasoning:`。
- `stream`（僅 Telegram）：在回覆產生時將推理串流到 Telegram 草稿氣泡，然後傳送不含推理的最終答案。
- 別名：`/reason`。
- 傳送沒有引數的 `/reasoning`（或 `/reasoning:`）即可查看目前推理層級。
- 解析順序：內嵌指令，接著是工作階段覆寫，接著是每代理預設值（`agents.list[].reasoningDefault`），最後是備援（`off`）。

格式錯誤的本機模型推理標籤會以保守方式處理。封閉的 `<think>...</think>` 區塊會在一般回覆中維持隱藏，已可見文字之後未封閉的推理也會隱藏。如果回覆完全包在單一未封閉的開頭標籤中，且否則會以空文字傳遞，OpenClaw 會移除格式錯誤的開頭標籤並傳遞剩餘文字。

## 相關

- 提權模式文件位於 [提權模式](/zh-TW/tools/elevated)。

## Heartbeat

- Heartbeat 探測本文是已設定的 Heartbeat 提示（預設：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 訊息中的內嵌指令會照常套用（但請避免從 Heartbeat 變更工作階段預設值）。
- Heartbeat 傳遞預設只傳送最終 payload。若也要傳送獨立的 `Reasoning:` 訊息（可用時），請設定 `agents.defaults.heartbeat.includeReasoning: true` 或每代理 `agents.list[].heartbeat.includeReasoning: true`。

## 網頁聊天 UI

- 網頁聊天思考選擇器會在頁面載入時，從傳入工作階段儲存區/設定映照工作階段已儲存的層級。
- 選擇另一個層級會立即透過 `sessions.patch` 寫入工作階段覆寫；它不會等待下一次傳送，也不是一次性的 `thinkingOnce` 覆寫。
- 第一個選項一律是 `Default (<resolved level>)`，其中解析後的預設值來自作用中工作階段模型的提供者思考設定檔，加上 `/status` 和 `session_status` 使用的相同備援邏輯。
- 選擇器使用 Gateway 工作階段列/預設值傳回的 `thinkingLevels`，並保留 `thinkingOptions` 作為舊版標籤清單。瀏覽器 UI 不會保留自己的提供者正規表示式清單；Plugin 擁有模型特定的層級集合。
- `/think:<level>` 仍可運作，並會更新相同儲存的工作階段層級，因此聊天指令和選擇器會保持同步。

## 提供者設定檔

- 提供者 Plugin 可以公開 `resolveThinkingProfile(ctx)`，以定義模型支援的層級和預設值。
- 代理 Claude 模型的提供者 Plugin 應重用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，讓直接 Anthropic 目錄和代理目錄保持一致。
- 每個設定檔層級都有一個已儲存的標準 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），並且可以包含顯示用的 `label`。二元提供者使用 `{ id: "low", label: "on" }`。
- 需要驗證明確思考覆寫的工具 Plugin 應使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加上 `api.runtime.agent.normalizeThinkingLevel(...)`；它們不應維護自己的提供者/模型層級清單。
- 可存取已設定自訂模型中繼資料的工具 Plugin 可以將 `catalog` 傳入 `resolveThinkingPolicy`，讓 `compat.supportedReasoningEfforts` 的選用設定反映在 Plugin 端驗證中。
- 已發布的舊版掛鉤（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）會保留為相容性轉接器，但新的自訂層級集合應使用 `resolveThinkingProfile`。
- Gateway 列和預設值會公開 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，讓 ACP/聊天用戶端呈現與執行階段驗證所使用的相同設定檔 id 和標籤。
