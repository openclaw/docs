---
read_when:
    - 說明權杖用量、費用或上下文視窗
    - 偵錯上下文增長或壓縮行為
summary: OpenClaw 如何建立提示詞上下文並回報權杖用量與成本
title: 權杖用量與費用
x-i18n:
    generated_at: "2026-07-22T10:49:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb5d4980f73c293363ba7784fb52e7331799c327b43f1d8eabb1a18e07a62a13
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw 追蹤的是**權杖**，而不是字元。權杖因模型而異，但對大多數
OpenAI 風格的模型而言，英文文字平均每個權杖約有 4 個字元。

## 系統提示詞的建構方式

OpenClaw 每次執行時都會組合自己的系統提示詞，其中包括：

- 工具清單與簡短說明
- Skills 清單（僅中繼資料；指示會視需要透過 `read` 載入）。原生
  Codex 回合會以回合範圍的協作開發者指示取得精簡的 Skills 區塊；
  其他執行框架則會在一般提示詞介面中取得該區塊。
  其大小受 `skills.limits.maxSkillsPromptChars` 限制，並可透過
  `agents.entries.*.skillsLimits.maxSkillsPromptChars` 為個別代理程式選擇性覆寫。
- 自我更新指示
- 工作區與啟動檔案（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、
  `IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`（新增時），以及
  `MEMORY.md`（存在時））。大型注入檔案會依
  `agents.defaults.bootstrapMaxChars` 截斷（預設：`20000`）；啟動內容的
  注入總量上限由 `agents.defaults.bootstrapTotalMaxChars` 控制（預設：
  `60000`）。
  - 當工作區可使用記憶工具時，原生 Codex 回合不會貼上原始
    `MEMORY.md`；改為在回合範圍的協作開發者指示中取得簡短的記憶指標，
    並視需要使用記憶工具。如果工具已停用、記憶搜尋無法使用，或
    使用中的工作區與代理程式記憶工作區不同，`MEMORY.md`
    會退回一般的有界回合情境路徑。
  - 小寫的根目錄 `memory.md` 永遠不會被注入。它是
    `openclaw doctor --fix` 的舊版修復輸入，後者會將其移轉至 `MEMORY.md`。
  - `memory/*.md` 每日檔案不屬於一般啟動提示詞；
    在普通回合中，仍可視需要透過記憶工具存取。重設／啟動
    模型執行時，可在第一個回合前置一次性的啟動情境區塊，其中包含近期的
    每日記憶，並由
    `agents.defaults.startupContext` 控制。純聊天的 `/new` 和 `/reset`
    會直接確認，不會叫用模型。
  - 壓縮後的 `AGENTS.md` 摘錄必須明確選擇啟用
    `agents.defaults.compaction.postCompactionSections`；外掛可以透過
    `before_prompt_build` 新增其他情境。
- 時間（UTC + 使用者時區）
- 回覆標籤與心跳偵測行為
- 執行階段中繼資料（主機／作業系統／模型／思考）

完整細項請參閱[系統提示詞](/zh-TW/concepts/system-prompt)。

記錄認證資訊或驗證程式碼片段時，請使用
[機密預留位置慣例](/zh-TW/reference/secret-placeholder-conventions)，以避免
僅文件變更造成機密掃描器誤判。

## 情境視窗中包含哪些內容

模型收到的所有內容都會計入情境限制：

- 系統提示詞（上述所有區段）
- 對話記錄（使用者與助理訊息）
- 工具呼叫與工具結果
- 附件／轉錄內容（圖片、音訊、檔案）
- 壓縮摘要與修剪產物
- 供應商包裝層或安全標頭（不可見，但仍會計入）

大量使用執行階段資源的介面，在
`agents.defaults.contextLimits` 下有各自明確的上限（個別代理程式可於
`agents.entries.*.contextLimits` 下覆寫）：

| 鍵                       | 用途                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | `memory_get` 在截斷前可傳回的最大字元數。                          |
| `memoryGetDefaultLines`  | 要求省略 `lines` 時，`memory_get` 的預設行數視窗。           |
| `toolResultMaxChars`     | 單一即時工具結果的進階上限（最多 `1000000` 個字元）。  |
| `postCompactionMaxChars` | 壓縮後重新整理期間從 `AGENTS.md` 保留的最大字元數。 |

這些是有界的執行階段摘錄，以及由執行階段擁有的注入區塊，
與啟動限制、啟動情境限制及 Skills 提示詞限制分開計算。

`toolResultMaxChars` 預設未設定，因此 OpenClaw 會根據有效的
模型情境視窗推導即時工具結果上限：低於 100K 個權杖時為 `16000` 個字元，
達 100K+ 個權杖時為 `32000` 個字元，達 200K+ 個權杖時為 `64000` 個字元。
即使設定了更大的明確上限，執行階段情境占比防護仍會將單一工具結果
限制在情境視窗的 30%。

對於圖片，OpenClaw 會在呼叫供應商前縮小轉錄內容／工具中的圖片承載資料。
可透過 `agents.defaults.imageMaxDimensionPx` 調整（預設：
`1200`）：

- 較低的值會減少視覺權杖用量與承載資料大小。
- 較高的值會為 OCR／大量 UI 的螢幕截圖保留更多視覺細節。

若要查看實用的明細（依各個注入檔案、工具、Skills 與系統
提示詞大小分類），請使用 `/context list` 或 `/context detail`。請參閱
[情境](/zh-TW/concepts/context)。

## 如何查看目前的權杖用量

在聊天中：

- `/status` -> 顯示包含表情符號的狀態卡，其中有工作階段模型、情境用量、
  上次回覆的輸入／輸出權杖數，以及針對使用中模型設定本機定價時的
  預估成本。
- `/usage off|tokens|full` -> 在每則回覆後附加個別回覆的用量頁尾。
  此設定會在個別工作階段中保留（儲存為 `responseUsage`）。
  - `/usage reset`（別名：`inherit`、`clear`、`default`）會清除
    工作階段覆寫，使其重新繼承已設定的預設值。
  - `/usage tokens` 顯示回合的權杖／快取詳細資料。
  - `/usage full` 顯示精簡的模型／情境／成本詳細資料；只有當 OpenClaw
    擁有用量中繼資料及使用中模型的本機定價時，才會顯示預估成本。自訂
    `messages.usageTemplate` 配置可包含權杖／快取欄位。
- `/usage cost` -> 根據 OpenClaw 工作階段記錄顯示本機成本摘要。

其他介面：

- **終端介面／網頁終端介面：**支援 `/status` 和 `/usage`。
- **命令列介面：**`openclaw status --usage` 和 `openclaw channels list` 會顯示
  正規化的供應商配額視窗（`X% left`，不是個別回覆成本）。
  目前支援用量視窗的供應商：Claude (Anthropic)、ClawRouter、Copilot
  (GitHub)、DeepSeek、Gemini (Google Gemini CLI)、MiniMax、OpenAI、Xiaomi、
  Xiaomi Token Plan，以及 z.ai。

用量介面會在顯示前正規化常見的供應商原生欄位別名。對於 OpenAI 系列的
Responses 流量，這同時包括
`input_tokens`/`output_tokens` 和 `prompt_tokens`/`completion_tokens`，因此
各傳輸方式特有的欄位名稱不會改變 `/status`、`/usage` 或工作階段
摘要。Gemini CLI 用量也會正規化：預設的 `stream-json`
剖析器會讀取助理的 `message` 事件，而 `stats.cached` 會對應至
`cacheRead`；當命令列介面省略明確的
`stats.input` 欄位時，則使用 `stats.input_tokens - stats.cached`。舊版 JSON 覆寫仍會從
`response` 讀取回覆文字。

對於原生 OpenAI 系列 Responses 流量，WebSocket／SSE 用量別名會以
相同方式正規化；當 `total_tokens` 遺失或為 `0` 時，
總數會退回使用正規化後的輸入加輸出。

當目前的工作階段快照資料不足時，`/status` 和 `session_status`
可以從最近的轉錄內容用量記錄中復原權杖／快取計數器，以及使用中的執行階段模型標籤。
現有且非零的即時值仍優先於轉錄內容的備援值；而當已儲存的總數
遺失或較小時，以提示詞為主且較大的轉錄內容總數可以優先採用。

供應商配額視窗的用量驗證會先使用供應商專用的鉤子；
如果供應商沒有鉤子（或鉤子未能解析出權杖），OpenClaw 會退回比對來自
驗證設定檔、環境或設定的 OAuth／API 金鑰認證資訊。

助理轉錄項目會保存相同的正規化用量形態，包括在使用中的模型已設定定價且
供應商傳回用量中繼資料時的 `usage.cost`。如此一來，即使即時
執行階段狀態已消失，`/usage cost` 與
由轉錄內容支援的工作階段狀態仍有穩定的資料來源。

OpenClaw 會將供應商用量計算與目前的情境快照分開處理。供應商的
`usage.total` 可能包括已快取的輸入、輸出，以及多次工具迴圈模型呼叫，
因此適合用於成本與遙測，但可能會高估即時情境視窗。情境顯示與診斷會使用
最新的提示詞快照（`promptTokens`；若沒有提示詞快照，則使用最後一次模型呼叫）
來計算 `context.used`。

## 成本估算（顯示時）

成本會根據你的模型定價設定估算：

```text
models.providers.<provider>.models[].cost
```

這些是 `input`、`output`、`cacheRead` 和
`cacheWrite` 的**每 1M 個權杖美元價格**。如果缺少定價，`/usage full`
會省略成本；若每則回覆都需要權杖／快取詳細資料，請使用
`/usage tokens` 或自訂的 `messages.usageTemplate`。成本顯示不限於 API 金鑰
驗證：像 `aws-sdk` 這類非 API 金鑰供應商，只要其已設定的模型項目
包含本機定價，且供應商會傳回用量中繼資料，也可以顯示預估成本。

在附屬程序和頻道進入閘道就緒路徑後，OpenClaw 會針對尚無
本機定價的已設定模型參照，啟動選用的背景定價啟動程序。該程序會擷取遠端 OpenRouter
與 LiteLLM 定價目錄。在離線或受限網路中，請設定 `models.pricing.enabled: false`
以略過這些目錄擷取；明確的
`models.providers.*.models[].cost` 項目仍會用於本機成本估算。

## 快取 TTL 與修剪的影響

供應商提示詞快取只會在快取 TTL 視窗內套用。OpenClaw
可選擇執行**快取 TTL 修剪**：快取 TTL 到期後，它會修剪工作階段，
再重設快取視窗，使後續要求重新使用剛快取的情境，而不是重新快取完整記錄。
當工作階段閒置超過 TTL 時，這能降低快取寫入成本。

請在[閘道設定](/zh-TW/gateway/configuration)中進行設定，並參閱
[工作階段修剪](/zh-TW/concepts/session-pruning)中的行為詳細資料。

心跳偵測可以讓快取在閒置期間保持**暖機**。如果模型快取
TTL 為 `1h`，將心跳偵測間隔設為略低於該值（例如 `55m`），即可
避免重新快取完整提示詞，進而降低快取寫入成本。

在多代理程式設定中，可以保留一份共用模型設定，並透過
`agents.entries.*.params.cacheRetention` 為個別代理程式調整快取行為。

如需每個選項的完整指南，請參閱[提示詞快取](/zh-TW/reference/prompt-caching)。

對於 Anthropic API 定價，快取讀取的費用明顯低於輸入
權杖，而快取寫入則會以較高的倍數計費。如需最新費率與 TTL 倍數，請參閱 Anthropic 的
提示詞快取定價：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 範例：使用心跳偵測讓 1h 快取保持暖機

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### 範例：為混合流量使用個別代理程式的快取策略

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # 多數代理程式的預設基準
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 為深度工作階段保持長效快取暖機
    - id: "alerts"
      params:
        cacheRetention: "none" # 避免為突發通知寫入快取
```

`agents.entries.*.params` 會合併至所選模型的 `params` 之上，因此你
可以只覆寫 `cacheRetention`，並原封不動地繼承其他模型預設值。

### Anthropic 1M 上下文

OpenClaw 會為支援正式環境的 Claude 4.x 模型（例如 Opus 4.8、Opus 4.7、Opus
4.6 和 Sonnet 4.6）配置 Anthropic 的 1M 上下文視窗。這些模型不需要
`params.context1m: true`。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

舊版設定可以保留 `context1m: true`，但 OpenClaw 不再為此設定傳送
Anthropic 已停用的 `context-1m-2025-08-07` Beta 標頭，也不會將不支援的舊版 Claude 模型擴充至 1M。

要求：認證資訊必須符合使用長上下文的資格。否則，
Anthropic 會針對該要求回傳供應商端的速率限制錯誤。

如果你使用 OAuth／訂閱權杖
（`sk-ant-oat-*`）向 Anthropic 驗證身分，OpenClaw 會保留 OAuth 所需的 Anthropic Beta
標頭，同時移除舊版設定中仍存在的已停用 `context-1m-*` Beta。

## 降低權杖壓力的訣竅

- 使用 `/compact` 摘要長工作階段。
- 在工作流程中刪減大型工具輸出。
- 對於包含大量螢幕截圖的工作階段，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持技能說明簡短（技能清單會注入提示中）。
- 進行冗長的探索性工作時，優先使用較小的模型。

確切的技能清單額外負擔計算公式，請參閱 [Skills](/zh-TW/tools/skills)。

## 相關內容

- [API 使用量與費用](/zh-TW/reference/api-usage-costs)
- [提示快取](/zh-TW/reference/prompt-caching)
- [使用量追蹤](/zh-TW/concepts/usage-tracking)
