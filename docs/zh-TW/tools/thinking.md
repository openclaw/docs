---
read_when:
    - 調整思考、快速模式或詳細指令的解析或預設值
summary: 用於 /think、/fast、/verbose、/trace 與推理可見性的指令語法
title: 思考層級
x-i18n:
    generated_at: "2026-04-30T16:30:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## 功能說明

- 任何傳入本文中的行內指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 層級（別名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”（最大預算）
  - xhigh → “ultrathink+”（GPT-5.2+ 與 Codex 模型，加上 Anthropic Claude Opus 4.7 effort）
  - adaptive → 提供者管理的自適應思考（支援 Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7，以及 Google Gemini 動態思考）
  - max → 提供者最大推理（Anthropic Claude Opus 4.7；Ollama 會將此對應到其最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 對應到 `xhigh`。
  - `highest` 對應到 `high`。
- 提供者注意事項：
  - 思考選單與選擇器由提供者設定檔驅動。提供者 Plugin 會宣告所選模型的確切層級集合，包括二元 `on` 這類標籤。
  - `adaptive`、`xhigh` 和 `max` 只會針對支援它們的提供者/模型設定檔顯示。不支援層級的輸入指令會被拒絕，並回覆該模型的有效選項。
  - 既有儲存的不支援層級會依提供者設定檔排名重新對應。在非自適應模型上，`adaptive` 會回退到 `medium`，而 `xhigh` 和 `max` 會回退到所選模型支援的最大非 off 層級。
  - 未設定明確思考層級時，Anthropic Claude 4.6 模型預設為 `adaptive`。
  - Anthropic Claude Opus 4.7 不預設使用自適應思考。除非你明確設定思考層級，否則其 API effort 預設值仍由提供者擁有。
  - Anthropic Claude Opus 4.7 會將 `/think xhigh` 對應到自適應思考加上 `output_config.effort: "xhigh"`，因為 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的 effort 設定。
  - Anthropic Claude Opus 4.7 也公開 `/think max`；它會對應到相同的提供者自有最大 effort 路徑。
  - DeepSeek V4 模型公開 `/think xhigh|max`；兩者都會對應到 DeepSeek `reasoning_effort: "max"`，較低的非 off 層級則對應到 `high`。
  - 具備思考能力的 Ollama 模型公開 `/think low|medium|high|max`；`max` 會對應到原生 `think: "high"`，因為 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字串。
  - OpenAI GPT 模型會透過模型特定的 Responses API effort 支援來對應 `/think`。只有目標模型支援時，`/think off` 才會傳送 `reasoning.effort: "none"`；否則 OpenClaw 會省略停用推理的 payload，而不是傳送不支援的值。
  - 自訂 OpenAI 相容目錄項目可以透過設定 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 包含 `"xhigh"`，選擇加入 `/think xhigh`。這會使用相同的 compat 中繼資料來對應傳出的 OpenAI 推理 effort payload，因此選單、工作階段驗證、代理 CLI 和 `llm-task` 都會與傳輸行為一致。
  - 過時設定的 OpenRouter Hunter Alpha 參照會略過代理推理注入，因為該已退役路由可能透過推理欄位回傳最終答案文字。
  - Google Gemini 會將 `/think adaptive` 對應到 Gemini 的提供者自有動態思考。Gemini 3 請求會省略固定的 `thinkingLevel`，而 Gemini 2.5 請求會傳送 `thinkingBudget: -1`；固定層級仍會對應到該模型系列最接近的 Gemini `thinkingLevel` 或預算。
  - Anthropic 相容串流路徑上的 MiniMax（`minimax/*`）預設為 `thinking: { type: "disabled" }`，除非你在模型參數或請求參數中明確設定思考。這可避免 MiniMax 非原生 Anthropic 串流格式洩漏 `reasoning_content` delta。
  - Z.AI（`zai/*`）只支援二元思考（`on`/`off`）。任何非 `off` 層級都會被視為 `on`（對應到 `low`）。
  - Moonshot（`moonshot/*`）會將 `/think off` 對應到 `thinking: { type: "disabled" }`，並將任何非 `off` 層級對應到 `thinking: { type: "enabled" }`。啟用思考時，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 會將不相容的值標準化為 `auto`。

## 解析順序

1. 訊息上的行內指令（只套用於該訊息）。
2. 工作階段覆寫（透過傳送僅含指令的訊息設定）。
3. 個別代理預設值（設定中的 `agents.list[].thinkingDefault`）。
4. 全域預設值（設定中的 `agents.defaults.thinkingDefault`）。
5. 回退：有提供者宣告的預設值時使用它；否則具備推理能力的模型會解析為 `medium` 或該模型最接近且支援的非 `off` 層級，而非推理模型維持 `off`。

## 設定工作階段預設值

- 傳送**只有**指令的訊息（允許空白），例如 `/think:medium` 或 `/t high`。
- 這會固定用於目前工作階段（預設按傳送者區分）；可由 `/think:off` 或工作階段閒置重設清除。
- 系統會傳送確認回覆（`Thinking level set to high.` / `Thinking disabled.`）。如果層級無效（例如 `/thinking big`），指令會被拒絕並附上提示，工作階段狀態維持不變。
- 傳送不帶引數的 `/think`（或 `/think:`）即可查看目前思考層級。

## 依代理套用

- **嵌入式 Pi**：解析後的層級會傳遞給處理程序內的 Pi 代理執行階段。

## 快速模式（/fast）

- 層級：`on|off`。
- 僅含指令的訊息會切換工作階段快速模式覆寫，並回覆 `Fast mode enabled.` / `Fast mode disabled.`。
- 傳送不帶模式的 `/fast`（或 `/fast status`）即可查看目前有效的快速模式狀態。
- OpenClaw 會依此順序解析快速模式：
  1. 行內/僅指令 `/fast on|off`
  2. 工作階段覆寫
  3. 個別代理預設值（`agents.list[].fastModeDefault`）
  4. 個別模型設定：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 對於 `openai/*`，快速模式會在支援的 Responses 請求上傳送 `service_tier=priority`，對應到 OpenAI 優先處理。
- 對於 `openai-codex/*`，快速模式會在 Codex Responses 上傳送相同的 `service_tier=priority` 旗標。OpenClaw 會在兩種驗證路徑間保留一個共用的 `/fast` 切換。
- 對於直接公開的 `anthropic/*` 請求，包括傳送到 `api.anthropic.com` 的 OAuth 驗證流量，快速模式會對應到 Anthropic 服務層級：`/fast on` 設定 `service_tier=auto`，`/fast off` 設定 `service_tier=standard_only`。
- 對於 Anthropic 相容路徑上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）會將 `MiniMax-M2.7` 重寫為 `MiniMax-M2.7-highspeed`。
- 同時設定時，明確的 Anthropic `serviceTier` / `service_tier` 模型參數會覆寫快速模式預設值。OpenClaw 仍會對非 Anthropic 代理 base URL 略過 Anthropic 服務層級注入。
- `/status` 只有在啟用快速模式時才會顯示 `Fast`。

## 詳細指令（/verbose 或 /v）

- 層級：`on`（最小）| `full` | `off`（預設）。
- 僅含指令的訊息會切換工作階段詳細模式，並回覆 `Verbose logging enabled.` / `Verbose logging disabled.`；無效層級會回傳提示且不變更狀態。
- `/verbose off` 會儲存明確的工作階段覆寫；可在 Sessions UI 中選擇 `inherit` 來清除。
- 行內指令只影響該訊息；否則會套用工作階段/全域預設值。
- 傳送不帶引數的 `/verbose`（或 `/verbose:`）即可查看目前詳細層級。
- 啟用詳細模式時，會發出結構化工具結果的代理（Pi、其他 JSON 代理）會將每次工具呼叫作為自己的僅中繼資料訊息傳回，可用時前綴為 `<emoji> <tool-name>: <arg>`（路徑/指令）。這些工具摘要會在每個工具開始時立即傳送（分開的氣泡），而不是作為串流 delta。
- 工具失敗摘要在一般模式中仍會顯示，但原始錯誤詳細資料後綴會隱藏，除非詳細模式為 `on` 或 `full`。
- 當詳細模式為 `full` 時，工具輸出也會在完成後轉送（分開的氣泡，截斷到安全長度）。如果你在執行期間切換 `/verbose on|full|off`，後續工具氣泡會遵循新設定。

## Plugin 追蹤指令（/trace）

- 層級：`on` | `off`（預設）。
- 僅含指令的訊息會切換工作階段 Plugin 追蹤輸出，並回覆 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 行內指令只影響該訊息；否則會套用工作階段/全域預設值。
- 傳送不帶引數的 `/trace`（或 `/trace:`）即可查看目前追蹤層級。
- `/trace` 比 `/verbose` 範圍更窄：它只公開 Plugin 擁有的追蹤/偵錯行，例如 Active Memory 偵錯摘要。
- 追蹤行可能出現在 `/status` 中，也可能在一般助理回覆後作為後續診斷訊息出現。

## 推理可見性（/reasoning）

- 層級：`on|off|stream`。
- 僅含指令的訊息會切換是否在回覆中顯示思考區塊。
- 啟用時，推理會作為**獨立訊息**傳送，並以前綴 `Reasoning:` 開頭。
- `stream`（僅 Telegram）：在產生回覆時將推理串流到 Telegram 草稿氣泡，然後傳送不含推理的最終答案。
- 別名：`/reason`。
- 傳送不帶引數的 `/reasoning`（或 `/reasoning:`）即可查看目前推理層級。
- 解析順序：行內指令，接著工作階段覆寫，接著個別代理預設值（`agents.list[].reasoningDefault`），最後回退（`off`）。

格式不正確的本機模型推理標籤會保守處理。封閉的 `<think>...</think>` 區塊會在一般回覆中維持隱藏，已可見文字後未封閉的推理也會隱藏。如果回覆完整包在單一未封閉開啟標籤中，且原本會作為空文字傳送，OpenClaw 會移除格式不正確的開啟標籤並傳送剩餘文字。

## 相關內容

- Elevated mode 文件位於 [Elevated mode](/zh-TW/tools/elevated)。

## Heartbeats

- Heartbeat 探測本文是設定的 Heartbeat 提示（預設：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 訊息中的行內指令會照常套用（但請避免從 Heartbeat 變更工作階段預設值）。
- Heartbeat 傳遞預設只傳送最終 payload。若也要傳送獨立的 `Reasoning:` 訊息（可用時），請設定 `agents.defaults.heartbeat.includeReasoning: true` 或個別代理的 `agents.list[].heartbeat.includeReasoning: true`。

## 網頁聊天 UI

- 網頁聊天思考選擇器會在頁面載入時，從傳入工作階段儲存區/設定映照工作階段已儲存的層級。
- 選擇另一個層級會立即透過 `sessions.patch` 寫入工作階段覆寫；它不會等待下一次傳送，也不是一次性的 `thinkingOnce` 覆寫。
- 第一個選項一律是 `Default (<resolved level>)`，其中解析後的預設值來自作用中工作階段模型的提供者思考設定檔，加上 `/status` 與 `session_status` 使用的相同回退邏輯。
- 選擇器使用 Gateway 工作階段列/預設值回傳的 `thinkingLevels`，並將 `thinkingOptions` 保留為舊版標籤清單。瀏覽器 UI 不會保留自己的提供者 regex 清單；模型特定層級集合由 Plugin 擁有。
- `/think:<level>` 仍可運作並更新相同的已儲存工作階段層級，因此聊天指令與選擇器會保持同步。

## 提供者設定檔

- 提供者 Plugin 可以公開 `resolveThinkingProfile(ctx)`，用來定義模型支援的層級與預設值。
- 代理 Claude 模型的提供者 Plugin 應重用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，讓直接 Anthropic 與代理目錄保持一致。
- 每個設定檔層級都有儲存的標準 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），也可以包含顯示用的 `label`。二元提供者使用 `{ id: "low", label: "on" }`。
- 需要驗證明確思考覆寫的工具 Plugin 應使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 搭配 `api.runtime.agent.normalizeThinkingLevel(...)`；它們不應維護自己的提供者/模型層級清單。
- 可存取已設定自訂模型中繼資料的工具 Plugin，可以將 `catalog` 傳入 `resolveThinkingPolicy`，讓 `compat.supportedReasoningEfforts` 選擇加入項目反映在 Plugin 端驗證中。
- 已發布的舊版 hook（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）會保留作為相容性配接器，但新的自訂層級集合應使用 `resolveThinkingProfile`。
- Gateway 列/defaults 會公開 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，讓 ACP/聊天用戶端呈現與執行階段驗證所用相同的設定檔 ID 與標籤。
