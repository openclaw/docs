---
read_when:
    - 你正在串接供應商用量／配額介面
    - 你需要說明用量追蹤行為或驗證要求
summary: 用量追蹤介面與認證資訊需求
title: 用量追蹤
x-i18n:
    generated_at: "2026-07-12T14:26:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 這是什麼

- 直接從各供應商的用量端點擷取供應商用量／配額。不會估算供應商帳單；僅顯示供應商回報的方案名稱、配額期間、餘額、支出、預算、每日成本記錄、權杖／模型歸屬資訊或帳戶狀態摘要。
- 人類可讀的配額期間輸出會正規化為 `X% left`，即使供應商回報的是已用配額、剩餘配額或僅有原始計數。沒有可重設配額期間的供應商則會顯示供應商摘要文字（例如餘額）。
- 當即時工作階段快照缺少權杖／模型資料時，工作階段層級的 `/status` 和 `session_status` 工具會改用該工作階段的逐字記錄日誌。此備援會補齊缺少的權杖／快取計數、可復原作用中的執行階段模型標籤，並且在工作階段中繼資料缺失或較小時（`totalTokensFresh !== true`、為零，或低於從逐字記錄推導出的值），優先採用較大的提示導向總數。非零的即時值一律優先於備援值。

## 顯示位置

- 聊天中的 `/status`：顯示工作階段權杖和預估成本的狀態卡（僅限 API 金鑰模型）。如有可用資料，會顯示**目前模型供應商**的用量，格式為正規化的 `X% left` 配額期間或供應商摘要文字。
- 聊天中的 `/usage off|tokens|full`：每則回應的用量頁尾。
- 聊天中的 `/usage cost`：從 OpenClaw 工作階段日誌彙總的本機成本摘要。
- 命令列介面：`openclaw status --usage` 會列印各供應商完整的用量／配額明細。
- 命令列介面：`openclaw models status` 會列出 OAuth／權杖驗證設定檔，並在每個具有用量期間資訊的供應商旁顯示其摘要。
- 控制介面：**用量**會在 OpenClaw 從工作階段推導出的權杖與預估成本分析上方，顯示供應商方案和帳單卡片。Anthropic 和 OpenAI Admin API 認證資訊還會加入供應商回報的今日、7 天與 30 天支出、每日趨勢、權杖總數、熱門模型及成本類別。
- 控制介面：聊天撰寫器的情境環形指示器彈出視窗會顯示訂閱制供應商的**方案用量**，包括各期間的進度列（5 小時、每週、模型範圍）、重設時間、已知的供應商方案（例如 `Max (20x)`）以及額外用量點數。透過方案計費的工作階段會隱藏每權杖美元估算；依 API 計費的工作階段則保留 `Est. cost` 和依類型分類的成本明細。Claude Code 命令列介面（`claude-cli`）設定會重複使用相同的 Anthropic 訂閱用量。
- macOS 選單列：當供應商用量快照可用時，會在 Context 下方顯示根層級的「Usage」區段。請參閱[選單列](/zh-TW/platforms/mac/menu-bar)。

`openclaw channels list` 不再顯示供應商用量；而是引導使用者改用 `openclaw status` 或 `openclaw models list`。

## Anthropic 與 OpenAI 費用記錄

訂閱配額與 API 計費是不同的供應商介面：

- Anthropic 訂閱／設定認證資訊會繼續顯示 Claude 配額週期與選用的額外用量預算。設定 `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY`，即可改為顯示組織的 Usage and Cost API 記錄。系統會自動偵測以 `sk-ant-admin` 開頭的 Anthropic 供應商認證資訊。
- OpenAI ChatGPT/Codex OAuth 會繼續顯示方案、配額週期與點數餘額。設定 `OPENAI_ADMIN_KEY`，即可改為顯示組織的費用與完成項目用量記錄；也可選擇設定 `OPENAI_PROJECT_ID`，將範圍限定至單一專案。OpenClaw 絕不會將來自 `OPENAI_API_KEY`、供應商設定或驗證設定檔的推論認證資訊傳送至組織 API，因為這些金鑰可能屬於自訂端點。

管理員認證資訊具有優先權，因為它們能提供實際的組織計費資料。OpenClaw 不會將這些由供應商回報的總計與本機工作階段估算合併；這兩個區段是刻意用來回答不同的問題。

## 預設用量頁尾模式

`/usage off|tokens|full` 會設定工作階段的頁尾，並在該工作階段中記住此設定。`messages.responseUsage` 會為尚未選擇模式的工作階段設定初始模式，因此可以預設開啟頁尾，而不必每次都輸入 `/usage`。

為所有頻道設定單一模式，或使用包含 `default` 後援值的個別頻道對應表：

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // 或：{ "default": "off", "discord": "full" }
  },
}
```

接受的值：`"off"`、`"tokens"`、`"full"`，以及舊版別名 `"on"`（視為 `"tokens"`）。

### 三種不同的工作階段狀態

工作階段的 `responseUsage` 欄位可表示三種狀態，每種狀態具有不同的語意：

| 狀態                | 儲存值                          | 有效模式                                                              |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未設定／繼承**    | `undefined`（不存在）           | 依序採用 `messages.responseUsage` 設定的預設值，最後為 `off`。        |
| **明確關閉**        | `"off"`（已儲存）               | 一律關閉；非關閉的設定預設值無法重新啟用頁尾。                        |
| **明確開啟**        | `"tokens"` 或 `"full"`（已儲存） | 無論設定預設值為何，都使用該模式。                                    |

### 優先順序

有效模式 = 工作階段覆寫 → 頻道設定項目 → `default` → `off`。

明確執行 `/usage off` 時，系統會在工作階段中將其**持久儲存**為常值 `"off"`，這與「未設定」不同。使用者明確停用頁尾後，非 off 的 `messages.responseUsage` 預設值無法重新開啟頁尾。

### 重設與關閉的差異

- `/usage off` 會強制關閉頁尾並持久儲存此選擇。已設定的非 off 預設值無法覆寫此選擇。
- `/usage reset`（別名：`default`、`inherit`、`inherited`、`clear`、`unpin`）會清除工作階段覆寫值。接著，工作階段會**繼承**有效的設定預設值（`messages.responseUsage`）。如果未設定預設值，頁尾會維持關閉。
- 完整重設工作階段（`/reset` 或 `/new`）或工作階段輪替會**保留**明確設定的用量模式偏好，讓使用者的顯示選擇在工作階段輪替後仍然有效。只有 `/usage reset`（及其別名）會清除覆寫值。

### 切換行為

不帶引數的 `/usage` 會依序循環切換：off → tokens → full → off。循環的起點是目前的**有效**模式（若未設定工作階段覆寫值，則沿用設定預設值），因此循環切換一律與使用者目前在頁尾看到的內容一致。

### 設定

未提供設定時，會維持原有行為（頁尾保持關閉，直到執行 `/usage`）。使用 `/usage reset` 可清除工作階段覆寫值，並重新繼承已設定的預設值。

## 自訂 `/usage full` 頁尾

`/usage tokens` 一律會顯示純文字的 `Usage: X in / Y out` 行（若有相關資訊，也會加上快取與預估費用後綴）。只有 `/usage full` 會顯示下述資訊更豐富的頁尾。

`/usage full` 會顯示內建的精簡頁尾，並在相關欄位可用時包含模型、推理、快速／慢速、上下文視窗及費用。不需要範本檔案即可使用內建頁尾。

`messages.usageTemplate` 僅供進階自訂版面配置使用。其值可以是
JSON 檔案路徑（支援 `~`）或行內物件；有效時會取代內建頁尾。
系統會監看檔案路徑，並在內容變更時即時重新載入。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

缺少或空白的範本會直接回退至內建頁尾，不會顯示警告。無法讀取
或設定無效的範本（JSON 格式錯誤，或其結構不含可呈現的輸出
片段）也會回退至內建頁尾，並向操作人員發出警告。

請從內建結構開始建立自訂範本，再編輯你想變更的部分：

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### 結構

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [/* pieces */], // fallback for any surface
    "surfaces": {
      "discord": [/* pieces */],
      "telegram": [/* pieces */],
    },
  },
}
```

每個介面都是由**片段**組成的有序清單；引擎會呈現每個片段、捨棄
空白片段，並使用 `sep` 串接保留下來的片段。沒有對應項目的介面會使用
`output.default`。

### 合約路徑

片段會透過點號路徑從每回合合約讀取值。不存在的值會視為
空值（因此可使用 `when` 防護條件或 `|fallback` 保持片段整潔）。

| 路徑                                                                                | 含義                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | 頻道 ID（`discord`/`telegram`/等）                                                               |
| `agentId` / `chat_type`                                                             | 所屬代理程式 ID / 聊天介面類型                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | 模型 ID / 顯示名稱 / 提供者 ID                                                                |
| `model.actual`, `model.resolved_ref`                                                | 此回合實際使用的提供者/模型參照                                                        |
| `model.requested`                                                                   | 請求的提供者/模型參照（回退前）                                                       |
| `model.reasoning`                                                                   | 推理強度（`off` 至 `xhigh`）                                                                       |
| `model.is_fallback` / `model.is_override`                                           | 布林值：已使用回退 / 已固定模型                                                                   |
| `model.override_source` / `model.auth_mode`                                         | 覆寫來源標籤 / 認證資訊模式（`oauth`、`api-key`、`token`、`mixed`、`aws-sdk`、`unknown`） |
| `state.fast_mode`                                                                   | 布林值：快速與慢速                                                                                   |
| `state.compactions`                                                                 | 工作階段的壓縮次數                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | 視窗額度 / 已佔用的權杖數 / 已使用 0-100                                                         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | 回合彙總                                                                                       |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | 此回合的快取讀取與快取寫入權杖數                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | 權杖顯示防護條件                                                                                 |
| `usage.cache_hit_pct`                                                               | 快取讀取占提示詞權杖總數的比例                                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 僅限最後一次模型呼叫（另有 `cache_read_tokens`、`cache_write_tokens`、`total_tokens`）           |
| `cost.turn_usd` / `cost.available`                                                  | 預估回合成本 / 是否成功解析成本表                                                  |
| `timing.duration_ms`                                                                | 回合實際經過時間                                                                             |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | 代理程式身分名稱 / 表情符號 / 頭像                                                                 |
| `session.id`                                                                        | 工作階段 ID                                                                                           |

（提供者速率限制視窗**不在**此合約中；目前沒有陣列值路徑，因此 `each` 片段沒有可迭代的內容。）

### 動詞

將值由左至右依序通過各動詞；非動詞區段為回退值。

| 動詞            | 效果                                | 範例                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 縮寫計數                         | `272000 -> 272k`                  |
| `fixed:N`       | N 位小數（預設為 2）                | `0.0377`                          |
| `dur`           | 將秒數轉換為時間長度                   | `14820 -> 4h07m`                  |
| `pct`           | 附加 `%`                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 將已用量轉為剩餘量             |
| `alias:TABLE`   | 在 `aliases` 中查找，未列出則原樣輸出 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 在 0-100 的值上繪製 W 格字符條   | `[⣿⣿⠐⠐⠐]`（`meter:1` = 一個字符） |

### 片段形式

- `{ "text": "📚 {context.max_tokens|num}" }`：常值 + 插值。
- `{ "when": "<path>", "text": "..." }`：僅在路徑值為真時轉譯。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：將值對應至字符（`_default` 案例涵蓋未匹配的值）。
- `{ "each": "<array-path>", "item": "{label}" }`：迭代陣列值路徑（目前合約中沒有陣列路徑）。

### 範例

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

例如會轉譯為 `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`。

## 提供者 + 認證資訊

當無法解析出可用的提供者用量驗證資訊時，會隱藏用量。OpenClaw
會自動探索已啟用、宣告 `contracts.usageProviders`，且同時實作
`resolveUsageAuth` 與 `fetchUsageSnapshot` 的提供者外掛；
核心沒有個別的提供者允許清單。靜態合約可在不匯入每個提供者外掛的情況下，
限制探索範圍。每個外掛各自負責其上游端點與回應對應。共用快照會讓方案名稱、
配額視窗、餘額、支出與預算保持提供者中立，供命令列介面、應用程式和 Control UI 使用。

- **Anthropic（Claude）**：驗證設定檔中的 OAuth 權杖。如果 OAuth 權杖缺少
  `user:profile` 範圍，則在有設定時回退至 `claude.ai` 網頁工作階段（`CLAUDE_AI_SESSION_KEY`、
  `CLAUDE_WEB_SESSION_KEY`，或 `CLAUDE_WEB_COOKIE` 中的 `sessionKey=` Cookie）。
  當 Anthropic 回報時，會包含模型範圍限制，以及已啟用的額外用量每月支出/預算。
  明確設定的 Anthropic Admin API 金鑰，或自動偵測到的 `sk-ant-admin...`
  提供者設定檔，則會顯示 30 天組織成本與 Messages API 歷史記錄。
- **ClawRouter**：API 金鑰（`CLAWROUTER_API_KEY`）。設定後會顯示每月預算視窗
  及具型別的 USD 預算；否則會顯示彙總支出，以及請求/權杖/成本摘要。
- **DeepSeek**：透過環境變數/設定/驗證儲存區提供 API 金鑰（`DEEPSEEK_API_KEY`）。
  顯示提供者回報的每種貨幣餘額。
- **GitHub Copilot**：驗證設定檔中的 OAuth 權杖。
- **Gemini CLI**：驗證設定檔中的 OAuth 權杖。
- **MiniMax**：API 金鑰或 MiniMax OAuth 驗證設定檔。OpenClaw 會將
  `minimax`、`minimax-cn` 和 `minimax-portal` 視為同一個 MiniMax 配額介面，
  若有儲存的 MiniMax OAuth 則優先使用，否則回退至
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  用量輪詢會在有設定時，從 `models.providers.minimax-portal.baseUrl`
  或 `models.providers.minimax.baseUrl` 推導 Coding Plan 主機，否則使用
  MiniMax CN 主機。
  MiniMax 的原始 `usage_percent` / `usagePercent` 欄位代表**剩餘**
  配額，因此 OpenClaw 會在顯示前將其反轉；若有基於計數的欄位，則優先使用。
  - 若有提供者的小時/分鐘欄位，視窗標籤會取自這些欄位，否則
    回退至 `start_time` / `end_time` 的時間跨度。
  - 如果 Coding Plan 端點傳回 `model_remains`，OpenClaw 會優先採用
    聊天模型項目；若沒有明確的 `window_hours` / `window_minutes` 欄位，
    則從時間戳記推導視窗標籤，並在方案標籤中包含模型名稱。
- **OpenAI（Codex/ChatGPT 方案）**：驗證設定檔中的 OAuth 權杖（若有帳戶 ID，
  則傳送 `ChatGPT-Account-Id` 標頭）。顯示 ChatGPT 方案、可重設的
  Codex 視窗，以及提供者回報的點數餘額。點數仍是提供者點數；
  OpenClaw 不會將其標示為美元。`OPENAI_ADMIN_KEY` 會在金鑰具有 Usage
  Dashboard 存取權時，加入 30 天組織成本與補全用量歷史記錄。
  推論認證資訊絕不會轉送至組織 API。
- **OpenRouter**：API 金鑰或由 OAuth 支援的 API 金鑰（`OPENROUTER_API_KEY`
  或驗證設定檔）。結合帳戶點數端點與金鑰配額端點，因此當認證資訊可存取時，
  會顯示帳戶餘額/支出、金鑰預算，以及每日/每週/每月用量。
  任一端點都可獨立豐富快照。
- **Venice**：透過環境變數/設定/驗證儲存區提供 API 金鑰（`VENICE_API_KEY`）。
  顯示 USD 和 DIEM 餘額，以及提供者回報的 DIEM epoch 配額用量。
- **Xiaomi MiMo**：兩個獨立的用量介面。隨用隨付使用 API 金鑰
  （`XIAOMI_API_KEY`）；Token Plan 使用另一組金鑰（`XIAOMI_TOKEN_PLAN_API_KEY`）。
  兩者目前皆不回報配額視窗。
- **z.ai**：透過環境變數/設定/驗證儲存區提供 API 金鑰（`ZAI_API_KEY` 或 `Z_AI_API_KEY`）。

## 相關內容

- [權杖使用量與成本](/zh-TW/reference/token-use)
- [API 使用量與成本](/zh-TW/reference/api-usage-costs)
- [提示詞快取](/zh-TW/reference/prompt-caching)
- [選單列](/zh-TW/platforms/mac/menu-bar)
