---
read_when:
    - 調整 thinking、fast-mode 或 verbose 指令的解析或預設值
summary: /think、/fast、/verbose、/trace 的指令語法和推理可見性
title: 思考層級
x-i18n:
    generated_at: "2026-05-05T01:50:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2282c9eccda4693680bbfbfc42de508021f4472b00d40a1a8c1bc19a4516012
    source_path: tools/thinking.md
    workflow: 16
---

## 功能

- 任何傳入本文中的行內指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 等級（別名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal →「think」
  - low →「think hard」
  - medium →「think harder」
  - high →「ultrathink」（最大預算）
  - xhigh →「ultrathink+」（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 供應商管理的 adaptive thinking（支援 Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7，以及 Google Gemini dynamic thinking）
  - max → 供應商最大 reasoning（Anthropic Claude Opus 4.7；Ollama 會將此對應到其最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 會對應到 `xhigh`。
  - `highest` 會對應到 `high`。
- 供應商注意事項：
  - Thinking 選單和選取器由供應商設定檔驅動。供應商 plugins 會宣告所選模型的確切等級集合，包括像 binary `on` 這樣的標籤。
  - 只有支援的供應商/模型設定檔才會顯示 `adaptive`、`xhigh` 和 `max`。對不支援等級輸入的指令會被拒絕，並顯示該模型的有效選項。
  - 現有已儲存的不支援等級會依供應商設定檔排名重新對應。`adaptive` 在非 adaptive 模型上會退回到 `medium`，而 `xhigh` 和 `max` 會退回到所選模型支援的最大非 off 等級。
  - 未設定明確 thinking 等級時，Anthropic Claude 4.6 模型預設為 `adaptive`。
  - Anthropic Claude Opus 4.7 不會預設為 adaptive thinking。除非你明確設定 thinking 等級，否則其 API effort 預設值仍由供應商擁有。
  - Anthropic Claude Opus 4.7 會將 `/think xhigh` 對應到 adaptive thinking 加上 `output_config.effort: "xhigh"`，因為 `/think` 是 thinking 指令，而 `xhigh` 是 Opus 4.7 的 effort 設定。
  - Anthropic Claude Opus 4.7 也公開 `/think max`；它會對應到同一條供應商擁有的 max effort 路徑。
  - 直接 DeepSeek V4 模型公開 `/think xhigh|max`；兩者都會對應到 DeepSeek `reasoning_effort: "max"`，而較低的非 off 等級會對應到 `high`。
  - 由 OpenRouter 路由的 DeepSeek V4 模型公開 `/think xhigh`，並傳送 OpenRouter 支援的 `reasoning_effort` 值。已儲存的 `max` 覆寫會退回到 `xhigh`。
  - Ollama 支援 thinking 的模型公開 `/think low|medium|high|max`；`max` 會對應到原生 `think: "high"`，因為 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字串。
  - OpenAI GPT 模型會透過模型特定的 Responses API effort 支援對應 `/think`。只有當目標模型支援時，`/think off` 才會傳送 `reasoning.effort: "none"`；否則 OpenClaw 會省略停用的 reasoning payload，而不是傳送不支援的值。
  - 自訂 OpenAI 相容目錄項目可以將 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 設定為包含 `"xhigh"`，以選擇加入 `/think xhigh`。這會使用同一份對應輸出 OpenAI reasoning effort payload 的相容性中繼資料，因此選單、工作階段驗證、agent CLI 和 `llm-task` 會與傳輸行為一致。
  - 過期設定的 OpenRouter Hunter Alpha refs 會略過 proxy reasoning 注入，因為該已停用路由可能會透過 reasoning 欄位傳回最終回答文字。
  - Google Gemini 會將 `/think adaptive` 對應到 Gemini 供應商擁有的 dynamic thinking。Gemini 3 請求會省略固定的 `thinkingLevel`，而 Gemini 2.5 請求會傳送 `thinkingBudget: -1`；固定等級仍會對應到該模型家族最接近的 Gemini `thinkingLevel` 或預算。
  - Anthropic 相容串流路徑上的 MiniMax (`minimax/*`) 預設為 `thinking: { type: "disabled" }`，除非你在模型參數或請求參數中明確設定 thinking。這會避免 MiniMax 非原生 Anthropic 串流格式洩漏 `reasoning_content` deltas。
  - Z.AI (`zai/*`) 只支援 binary thinking（`on`/`off`）。任何非 `off` 等級都會視為 `on`（對應到 `low`）。
  - Moonshot (`moonshot/*`) 會將 `/think off` 對應到 `thinking: { type: "disabled" }`，並將任何非 `off` 等級對應到 `thinking: { type: "enabled" }`。啟用 thinking 時，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 會將不相容的值正規化為 `auto`。

## 解析順序

1. 訊息上的行內指令（僅套用於該訊息）。
2. 工作階段覆寫（透過傳送只有指令的訊息設定）。
3. 每個 agent 的預設值（config 中的 `agents.list[].thinkingDefault`）。
4. 全域預設值（config 中的 `agents.defaults.thinkingDefault`）。
5. 後援：可用時使用供應商宣告的預設值；否則具 reasoning 能力的模型會解析為 `medium` 或該模型最接近的受支援非 `off` 等級，而非 reasoning 模型會維持 `off`。

## 設定工作階段預設值

- 傳送一則**只有**指令的訊息（允許空白），例如 `/think:medium` 或 `/t high`。
- 該設定會固定於目前工作階段（預設按傳送者）；由 `/think:off` 或工作階段閒置重設清除。
- 會送出確認回覆（`Thinking level set to high.` / `Thinking disabled.`）。如果等級無效（例如 `/thinking big`），該命令會被拒絕並附上提示，且工作階段狀態保持不變。
- 傳送沒有引數的 `/think`（或 `/think:`）可查看目前 thinking 等級。

## 依 agent 套用

- **內嵌式 Pi**：已解析的等級會傳遞到程序內 Pi agent 執行階段。
- **Claude CLI 後端**：使用 `claude-cli` 時，非 off 等級會作為 `--effort` 傳遞給 Claude Code；請參閱 [CLI 後端](/zh-TW/gateway/cli-backends)。

## 快速模式（/fast）

- 等級：`on|off`。
- 只有指令的訊息會切換工作階段快速模式覆寫，並回覆 `Fast mode enabled.` / `Fast mode disabled.`。
- 傳送沒有模式的 `/fast`（或 `/fast status`）可查看目前有效的快速模式狀態。
- OpenClaw 會依下列順序解析快速模式：
  1. 行內/只有指令的 `/fast on|off`
  2. 工作階段覆寫
  3. 每個 agent 的預設值（`agents.list[].fastModeDefault`）
  4. 每個模型設定：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 後援：`off`
- 對於 `openai/*`，快速模式會在支援的 Responses 請求上傳送 `service_tier=priority`，對應到 OpenAI priority processing。
- 對於 `openai-codex/*`，快速模式會在 Codex Responses 上傳送相同的 `service_tier=priority` 旗標。OpenClaw 會在兩條 auth 路徑之間保留一個共用的 `/fast` 切換。
- 對於直接公開的 `anthropic/*` 請求，包括傳送到 `api.anthropic.com` 的 OAuth 驗證流量，快速模式會對應到 Anthropic service tiers：`/fast on` 設定 `service_tier=auto`，`/fast off` 設定 `service_tier=standard_only`。
- 對於 Anthropic 相容路徑上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）會將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。
- 同時設定時，明確的 Anthropic `serviceTier` / `service_tier` 模型參數會覆寫快速模式預設值。OpenClaw 仍會對非 Anthropic proxy base URL 略過 Anthropic service-tier 注入。
- `/status` 只會在快速模式啟用時顯示 `Fast`。

## 詳細指令（/verbose 或 /v）

- 等級：`on`（minimal）| `full` | `off`（預設）。
- 只有指令的訊息會切換工作階段詳細模式並回覆 `Verbose logging enabled.` / `Verbose logging disabled.`；無效等級會傳回提示，且不會變更狀態。
- `/verbose off` 會儲存明確的工作階段覆寫；透過 Sessions UI 選擇 `inherit` 可清除它。
- 行內指令只會影響該訊息；否則會套用工作階段/全域預設值。
- 傳送沒有引數的 `/verbose`（或 `/verbose:`）可查看目前詳細等級。
- 開啟詳細模式時，會發出結構化工具結果的 agents（Pi、其他 JSON agents）會將每個工具呼叫作為自己的 metadata-only 訊息送回，可用時前綴為 `<emoji> <tool-name>: <arg>`。這些工具摘要會在每個工具一開始時立即送出（分開的泡泡），而不是作為 streaming deltas。
- 工具失敗摘要在一般模式下仍然可見，但原始錯誤詳細資料後綴會被隱藏，除非 verbose 是 `on` 或 `full`。
- 當 verbose 為 `full` 時，工具輸出也會在完成後轉送（分開的泡泡，截斷到安全長度）。如果你在執行期間切換 `/verbose on|full|off`，後續工具泡泡會遵循新設定。
- `agents.defaults.toolProgressDetail` 控制 `/verbose` 工具摘要和進度草稿工具行的形態。使用 `"explain"`（預設）可取得精簡的人類標籤，例如 `🛠️ Exec: checking JS syntax`；當你也想附加原始命令/詳細資料以供偵錯時，使用 `"raw"`。每個 agent 的 `agents.list[].toolProgressDetail` 會覆寫預設值。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin trace 指令（/trace）

- 等級：`on` | `off`（預設）。
- 只有指令的訊息會切換工作階段 Plugin trace 輸出，並回覆 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 行內指令只會影響該訊息；否則會套用工作階段/全域預設值。
- 傳送沒有引數的 `/trace`（或 `/trace:`）可查看目前 trace 等級。
- `/trace` 比 `/verbose` 更窄：它只會公開 Plugin 擁有的 trace/debug 行，例如 Active Memory debug 摘要。
- Trace 行可以出現在 `/status` 中，也可以在一般 assistant 回覆後作為後續診斷訊息出現。

## Reasoning 可見性（/reasoning）

- 等級：`on|off|stream`。
- 只有指令的訊息會切換是否在回覆中顯示 thinking blocks。
- 啟用時，reasoning 會作為**分開的訊息**送出，前綴為 `Reasoning:`。
- `stream`（僅 Telegram）：在產生回覆期間，將 reasoning 串流到 Telegram 草稿泡泡中，然後傳送不含 reasoning 的最終回答。
- 別名：`/reason`。
- 傳送沒有引數的 `/reasoning`（或 `/reasoning:`）可查看目前 reasoning 等級。
- 解析順序：行內指令，然後工作階段覆寫，然後每個 agent 的預設值（`agents.list[].reasoningDefault`），最後是後援（`off`）。

格式錯誤的本機模型 reasoning 標籤會以保守方式處理。封閉的 `<think>...</think>` 區塊在一般回覆中會保持隱藏，而已可見文字之後未封閉的 reasoning 也會被隱藏。如果回覆完全包在單一未封閉開頭標籤中，且否則會以空文字傳遞，OpenClaw 會移除格式錯誤的開頭標籤並傳遞剩餘文字。

## 相關

- Elevated mode 文件位於 [Elevated mode](/zh-TW/tools/elevated)。

## Heartbeats

- Heartbeat 探測本文是已設定的 Heartbeat 提示（預設：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 訊息中的行內指令照常套用（但避免從 Heartbeats 變更工作階段預設值）。
- Heartbeat 傳遞預設只會傳送最終 payload。若也要傳送分開的 `Reasoning:` 訊息（可用時），請設定 `agents.defaults.heartbeat.includeReasoning: true` 或每個 agent 的 `agents.list[].heartbeat.includeReasoning: true`。

## 網頁聊天 UI

- 網頁聊天 thinking 選取器會在頁面載入時，鏡像來自傳入工作階段 store/config 的工作階段已儲存等級。
- 選擇另一個等級會立即透過 `sessions.patch` 寫入工作階段覆寫；它不會等待下一次傳送，也不是一次性的 `thinkingOnce` 覆寫。
- 第一個選項永遠是 `Default (<resolved level>)`，其中已解析的預設值來自作用中工作階段模型的供應商 thinking 設定檔，加上 `/status` 和 `session_status` 使用的相同後援邏輯。
- 選取器使用 gateway 工作階段列/預設值傳回的 `thinkingLevels`，並保留 `thinkingOptions` 作為舊版標籤清單。瀏覽器 UI 不會保留自己的供應商 regex 清單；plugins 擁有模型特定的等級集合。
- `/think:<level>` 仍然有效，並會更新同一個已儲存的工作階段等級，因此聊天指令和選取器會保持同步。

## 供應商設定檔

- Provider Plugin 可以公開 `resolveThinkingProfile(ctx)` 來定義模型支援的層級與預設值。
- 代理 Claude 模型的 Provider Plugin 應重複使用來自 `openclaw/plugin-sdk/provider-model-shared` 的 `resolveClaudeThinkingProfile(modelId)`，讓直接 Anthropic 與代理目錄保持一致。
- 每個設定檔層級都有儲存的標準 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），並且可以包含顯示用的 `label`。二元 Provider 使用 `{ id: "low", label: "on" }`。
- 需要驗證明確思考覆寫的 Tool Plugin 應使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加上 `api.runtime.agent.normalizeThinkingLevel(...)`；它們不應維護自己的 Provider/模型層級清單。
- 可存取已設定自訂模型中繼資料的 Tool Plugin 可以將 `catalog` 傳入 `resolveThinkingPolicy`，讓 `compat.supportedReasoningEfforts` 的選擇加入反映在 Plugin 端驗證中。
- 已發布的舊版 hooks（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）會保留作為相容性轉接器，但新的自訂層級集合應使用 `resolveThinkingProfile`。
- Gateway 列/預設值會公開 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，讓 ACP/聊天用戶端呈現與執行階段驗證所用相同的設定檔 id 和標籤。
