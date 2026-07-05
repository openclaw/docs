---
read_when:
    - 調整思考、快速模式或詳細指令解析或預設值
summary: /think、/fast、/verbose、/trace 的指令語法與推理可見性
title: 思考層級
x-i18n:
    generated_at: "2026-07-05T11:48:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11723a45d9b38c8eb32ca837dd2fa64eb737ca711e6d35f8a628dbc75ad10edc
    source_path: tools/thinking.md
    workflow: 16
---

## 功能

- 任何傳入正文中的行內指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 等級（別名）：`off | minimal | low | medium | high | xhigh | adaptive | max`，大致對應 Anthropic 經典的 "think" < "think hard" < "think harder" < "ultrathink" 魔法詞階梯：
  - minimal ~ "think"
  - low ~ "think hard"
  - medium ~ "think harder"
  - high ~ "ultrathink"（最大預算）
  - xhigh ~ "ultrathink+"（GPT-5.2+ 和 Codex 模型，加上 Anthropic Claude Opus 4.7+ effort）
  - adaptive → 由提供者管理的自適應思考（支援 Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7+，以及 Google Gemini 動態思考）
  - max → 提供者最大推理（Anthropic Claude Opus 4.7+；Ollama 會將此對應到其最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 對應到 `xhigh`。
  - `highest` 對應到 `high`。
- 提供者注意事項：
  - 思考選單與選擇器由提供者設定檔驅動。提供者外掛會宣告所選模型的確切等級集合，包括像二元 `on` 這類標籤。
  - `adaptive`、`xhigh` 和 `max` 只會針對支援它們的提供者/模型設定檔顯示。對不支援等級輸入的型別化指令會被拒絕，並回傳該模型的有效選項。
  - 既有儲存的不支援等級會依提供者設定檔排名重新對應。`adaptive` 在非自適應模型上會退回到 `medium`，而 `xhigh` 和 `max` 會退回到所選模型支援的最大非 off 等級。
  - Anthropic Claude 4.6 模型在未明確設定思考等級時，預設為 `adaptive`。
  - Anthropic Claude Opus 4.8 和 Opus 4.7 會保持思考關閉，除非你明確設定思考等級。啟用自適應思考後，Opus 4.8 的提供者自有 effort 預設值是 `high`。
  - Anthropic Claude Opus 4.7+ 會將 `/think xhigh` 對應到自適應思考加上 `output_config.effort: "xhigh"`，因為 `/think` 是思考指令，而 `xhigh` 是 Opus 的 effort 設定。
  - Anthropic Claude Opus 4.7+ 也公開 `/think max`；它對應到相同的提供者自有最大 effort 路徑。
  - 直接 DeepSeek V4 模型公開 `/think xhigh|max`；兩者都會對應到 DeepSeek `reasoning_effort: "max"`，而較低的非 off 等級會對應到 `high`。
  - 透過 OpenRouter 路由的 DeepSeek V4 模型公開 `/think xhigh`，並送出 OpenRouter 支援的 `reasoning.effort` 值，而不是 DeepSeek 原生頂層 `reasoning_effort`。較低的非 off 等級會對應到 `high`，而儲存的 `max` 覆寫會退回到 `xhigh`。
  - 具備思考能力的 Ollama 模型公開 `/think low|medium|high|max`；`max` 會對應到原生 `think: "high"`，因為 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字串。
  - OpenAI GPT 模型會透過模型特定的 Responses API effort 支援對應 `/think`。`/think off` 只有在目標模型支援時才會送出 `reasoning.effort: "none"`；否則 OpenClaw 會省略已停用的推理酬載，而不是送出不支援的值。
  - 自訂 OpenAI 相容目錄項目可以透過將 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 設為包含 `"xhigh"`，選擇加入 `/think xhigh`。這會使用同一組對應輸出 OpenAI 推理 effort 酬載的相容性中繼資料，因此選單、工作階段驗證、代理命令列介面，以及 `llm-task` 會與傳輸行為一致。
  - 過時設定的 OpenRouter Hunter Alpha refs 會略過代理推理注入，因為該已退役路由可能透過推理欄位回傳最終答案文字。
  - Google Gemini 會將 `/think adaptive` 對應到 Gemini 的提供者自有動態思考。Gemini 3 請求會省略固定的 `thinkingLevel`，而 Gemini 2.5 請求會送出 `thinkingBudget: -1`；固定等級仍會對應到該模型家族最接近的 Gemini `thinkingLevel` 或預算。
  - Anthropic 相容串流路徑上的 MiniMax M2.x (`minimax/MiniMax-M2*`) 預設為 `thinking: { type: "disabled" }`，除非你在模型參數或請求參數中明確設定思考。這會避免 M2.x 非原生 Anthropic 串流格式外洩 `reasoning_content` 增量。MiniMax-M3（以及 M3.x）不受此限制：M3 會輸出正確的 Anthropic 思考區塊，並在停用思考時回傳空內容，因此 OpenClaw 會讓 M3 保持在提供者省略/自適應思考路徑。
  - Z.AI (`zai/*`) 對大多數 GLM 模型是二元（`on`/`off`）。GLM-5.2 是例外：它公開 `/think off|low|high|max`，將 `low` 和 `high` 對應到 Z.AI `reasoning_effort: "high"`，並將 `max` 對應到 `reasoning_effort: "max"`。
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) 永遠會思考。其設定檔只公開 `on`，且 OpenClaw 會依 Moonshot 要求省略輸出的 `thinking` 欄位。其他 `moonshot/*` 模型會將 `/think off` 對應到 `thinking: { type: "disabled" }`，並將任何非 `off` 等級對應到 `thinking: { type: "enabled" }`。啟用思考時，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 會將不相容的值正規化為 `auto`。

## 解析順序

1. 訊息上的行內指令（只套用於該訊息）。
2. 工作階段覆寫（透過傳送只有指令的訊息設定）。
3. 每個代理的預設值（設定中的 `agents.list[].thinkingDefault`）。
4. 全域預設值（設定中的 `agents.defaults.thinkingDefault`）。
5. 後援：可用時採用提供者宣告的預設值；否則具備推理能力的模型會解析為 `medium` 或該模型最接近的支援非 `off` 等級，而非推理模型會保持 `off`。

## 設定工作階段預設值

- 傳送**只有**指令的訊息（允許空白），例如 `/think:medium` 或 `/t high`。
- 這會固定套用於目前工作階段（預設依傳送者區分）。使用 `/think default` 清除工作階段覆寫並繼承已設定/提供者預設值；別名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- `/think off` 會儲存明確的 off 覆寫。它會停用思考，直到你變更或清除工作階段覆寫。
- 會送出確認回覆（`Thinking level set to high.` / `Thinking disabled.`）。如果等級無效（例如 `/thinking big`），命令會被拒絕並提供提示，且工作階段狀態保持不變。
- 傳送沒有參數的 `/think`（或 `/think:`）即可查看目前思考等級。

## 依代理套用

- **嵌入式 OpenClaw**：解析後的等級會傳遞給程序內 OpenClaw 代理執行階段。
- **Claude 命令列介面後端**：使用 `claude-cli` 時，非 off 等級會作為 `--effort` 傳遞給 Claude Code；請參閱[命令列介面後端](/zh-TW/gateway/cli-backends)。

## 快速模式 (/fast)

- 等級：`auto|on|off|default`。
- 只有指令的訊息會切換工作階段快速模式覆寫，並回覆 `Fast mode set to auto.`、`Fast mode enabled.` 或 `Fast mode disabled.`。使用 `/fast default` 清除工作階段覆寫並繼承已設定的預設值；別名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- 傳送沒有模式的 `/fast`（或 `/fast status`）即可查看目前有效的快速模式狀態。
- OpenClaw 會依此順序解析快速模式：
  1. 行內/只有指令的 `/fast auto|on|off` 覆寫（`/fast default` 會清除此層）
  2. 工作階段覆寫
  3. 每個代理的預設值（`agents.list[].fastModeDefault`）
  4. 每個模型設定：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 後援：`off`
- `auto` 會將工作階段/設定模式保留為 auto，但會獨立解析每次新的模型呼叫。在自動截止時間前開始的呼叫會啟用快速模式；較晚的重試、後援、工具結果或接續呼叫會在停用快速模式的狀態下開始。截止時間預設為 60 秒；在作用中模型上設定 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 即可變更。
- 對於 `openai/*`，快速模式會透過在支援的 Responses 請求上送出 `service_tier=priority`，對應到 OpenAI 優先處理。
- 對於 Codex 支援的 `openai/*` / `openai-codex/*` 模型，快速模式會在 Codex Responses 上送出相同的 `service_tier=priority` 旗標。原生 Codex app-server 回合只會在 `turn/start` 或執行緒開始/續接時接收 tier，因此 `auto` 無法重新分級已在執行中的 app-server 回合；它會套用到 OpenClaw 開始的下一個模型回合。
- 對於直接公開的 `anthropic/*` 請求，包括傳送到 `api.anthropic.com` 的 OAuth 驗證流量，快速模式會對應到 Anthropic 服務層級：`/fast on` 設定 `service_tier=auto`，`/fast off` 設定 `service_tier=standard_only`。
- 對於 Anthropic 相容路徑上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）會將 `MiniMax-M2.7` 重寫為 `MiniMax-M2.7-highspeed`。
- 明確的 Anthropic `serviceTier` / `service_tier` 模型參數會在兩者皆設定時覆寫快速模式預設值。OpenClaw 仍會對非 Anthropic 代理基礎 URL 略過 Anthropic 服務層級注入。
- `/status` 會在啟用快速模式時顯示 `Fast`，並在設定模式為 auto 時顯示 `Fast:auto`。

## 詳細指令 (/verbose 或 /v)

- 等級：`on`（最小）| `full` | `off`（預設）。
- 只有指令的訊息會切換工作階段詳細模式，並回覆 `Verbose logging enabled.` / `Verbose logging disabled.`；無效等級會回傳提示且不變更狀態。
- `/verbose off` 會儲存明確的工作階段覆寫；可在 Sessions UI 中選擇 `inherit` 來清除。
- 已授權的外部頻道傳送者可以持久化工作階段詳細模式覆寫。內部閘道/webchat 用戶端需要 `operator.admin` 才能持久化。
- 行內指令只影響該訊息；否則套用工作階段/全域預設值。
- 傳送沒有參數的 `/verbose`（或 `/verbose:`）即可查看目前詳細等級。
- 啟用詳細模式時，會輸出結構化工具結果的代理會將每個工具呼叫作為自己的僅中繼資料訊息傳回，並在可用時加上 `<emoji> <tool-name>: <arg>` 前綴。這些工具摘要會在每個工具啟動後立即送出（獨立訊息泡泡），而不是作為串流增量。
- 工具失敗摘要在一般模式中仍可見，但原始錯誤詳細資訊後綴會被隱藏，除非詳細模式為 `full`。
- 當詳細模式為 `full` 時，工具輸出也會在完成後轉發（獨立訊息泡泡，截斷到安全長度）。如果你在執行期間切換 `/verbose on|full|off`，後續工具泡泡會遵循新設定。
- `agents.defaults.toolProgressDetail` 控制 `/verbose` 工具摘要與進度草稿工具行的形狀。使用 `"explain"`（預設）取得精簡的人類可讀標籤，例如 `🛠️ Exec: checking JS syntax`；當你也想附加原始命令/詳細資訊以便偵錯時，使用 `"raw"`。每個代理的 `agents.list[].toolProgressDetail` 會覆寫預設值。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## 外掛追蹤指令 (/trace)

- 等級：`on` | `off`（預設）。
- 只有指令的訊息會切換工作階段外掛追蹤輸出，並回覆 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 行內指令只影響該訊息；否則套用工作階段/全域預設值。
- 傳送沒有參數的 `/trace`（或 `/trace:`）即可查看目前追蹤等級。
- `/trace` 比 `/verbose` 更窄：它只公開外掛擁有的追蹤/偵錯行，例如主動記憶偵錯摘要。
- 追蹤行可以出現在 `/status` 中，也可以在一般助理回覆後作為後續診斷訊息出現。

## 推理可見性 (/reasoning)

- 等級：`on|off|stream`。
- 只有指令的訊息會切換回覆中是否顯示思考區塊。
- 啟用時，推理會作為**獨立訊息**傳送，並加上 `Thinking` 前綴。
- `stream`：當作用中頻道支援推理預覽時，在回覆產生期間串流推理，然後傳送不含推理的最終答案。
- 別名：`/reason`。
- 傳送沒有參數的 `/reasoning`（或 `/reasoning:`）即可查看目前推理等級。
- 解析順序：行內指令，然後工作階段覆寫，然後每個代理的預設值（`agents.list[].reasoningDefault`），然後全域預設值（`agents.defaults.reasoningDefault`），最後後援（`off`）。

格式錯誤的本機模型推理標籤會以保守方式處理。封閉的 `<think>...</think>` 區塊在一般回覆中會保持隱藏，且在已可見文字之後未封閉的推理內容也會被隱藏。如果回覆完全包在單一未封閉的開頭標籤中，否則會以空文字送出，OpenClaw 會移除格式錯誤的開頭標籤並送出剩餘文字。

## 相關

- 提權模式文件位於 [提權模式](/zh-TW/tools/elevated)。

## 心跳偵測

- 心跳偵測探測本文是設定的心跳偵測提示詞（預設：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳偵測訊息中的行內指令會照常套用（但避免從心跳偵測變更工作階段預設值）。
- 心跳偵測傳遞預設只送出最終承載內容。若也要傳送獨立的 `Thinking` 訊息（可用時），請設定 `agents.defaults.heartbeat.includeReasoning: true` 或個別代理的 `agents.list[].heartbeat.includeReasoning: true`。

## 網頁聊天 UI

- 網頁聊天的思考選擇器會在頁面載入時，反映入站工作階段儲存區／設定中保存的工作階段層級。
- 選擇另一個層級會立即透過 `sessions.patch` 寫入工作階段覆寫；它不會等到下一次傳送，也不是一次性的 `thinkingOnce` 覆寫。
- 第一個選項一律是清除覆寫的選擇。它會顯示 `Inherited: <resolved level>`，包含繼承的思考已停用時的 `Inherited: Off`。
- 明確的選擇器選項會使用其直接層級標籤，同時保留供應商標籤（例如供應商標示的 `max` 選項會顯示 `Maximum`）。
- 選擇器使用閘道工作階段列／預設值回傳的 `thinkingLevels`，並保留 `thinkingOptions` 作為舊版標籤清單。瀏覽器 UI 不保留自己的供應商 regex 清單；外掛擁有特定模型的層級集合。
- `/think:<level>` 仍可運作，並會更新同一個已儲存的工作階段層級，因此聊天指令和選擇器會保持同步。

## 供應商設定檔

- 供應商外掛可以公開 `resolveThinkingProfile(ctx)`，以定義模型支援的層級和預設值。
- 代理 Claude 模型的供應商外掛應重用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，讓直接 Anthropic 目錄和代理目錄保持一致。
- 每個設定檔層級都有儲存的標準 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），且可以包含顯示用的 `label`。二元供應商使用 `{ id: "low", label: "on" }`。
- 設定檔掛鉤在可用時會收到合併後的目錄事實，包括 `reasoning`、`compat.thinkingFormat` 和 `compat.supportedReasoningEfforts`。只有在設定的請求合約支援相符承載內容時，才使用這些事實公開二元或自訂設定檔。
- 需要驗證明確思考覆寫的工具外掛，應使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加上 `api.runtime.agent.normalizeThinkingLevel(...)`；它們不應保留自己的供應商／模型層級清單。
- 可存取已設定自訂模型中繼資料的工具外掛，可以將 `catalog` 傳入 `resolveThinkingPolicy`，讓 `compat.supportedReasoningEfforts` 的選擇加入反映在外掛端驗證中。
- 已發布的舊版掛鉤（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍保留作為相容性配接器，但新的自訂層級集合應使用 `resolveThinkingProfile`。
- 閘道列／預設值會公開 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，讓 ACP／聊天用戶端呈現與執行階段驗證所用相同的設定檔 ID 和標籤。
