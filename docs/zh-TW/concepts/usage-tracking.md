---
read_when:
    - 您正在串接供應商用量／配額介面
    - 你需要說明使用量追蹤行為或身分驗證要求
summary: 用量追蹤介面與憑證需求
title: 用量追蹤
x-i18n:
    generated_at: "2026-07-11T21:18:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 這是什麼

- 直接從各提供者的用量端點擷取用量／配額。不估算提供者帳單；僅顯示提供者回報的方案名稱、配額時段、餘額、支出、預算、每日成本歷史記錄、權杖／模型歸屬或帳戶狀態摘要。
- 易於閱讀的配額時段輸出會正規化為 `剩餘 X%`，即使提供者回報的是已用配額、剩餘配額或僅有原始計數。沒有可重設配額時段的提供者則改為顯示提供者摘要文字（例如餘額）。
- 當即時工作階段快照缺少權杖／模型資料時，工作階段層級的 `/status` 和 `session_status` 工具會改用該工作階段的逐字記錄日誌。此備援會補齊缺少的權杖／快取計數、可復原目前執行階段的模型標籤，並在工作階段中繼資料缺失或數值較小時（`totalTokensFresh !== true`、為零，或低於從逐字記錄推導出的值），優先採用較大的提示詞導向總數。非零的即時值一律優先於備援值。

## 顯示位置

- 聊天中的 `/status`：顯示含工作階段權杖數與估算成本的狀態卡（僅限 API 金鑰模型）。若可取得，會顯示**目前模型提供者**的用量，格式為正規化的 `剩餘 X%` 時段或提供者摘要文字。
- 聊天中的 `/usage off|tokens|full`：每則回應的用量頁尾。
- 聊天中的 `/usage cost`：從 OpenClaw 工作階段日誌彙整的本機成本摘要。
- 命令列介面：`openclaw status --usage` 會列印各提供者完整的用量／配額明細。
- 命令列介面：`openclaw models status` 會列出 OAuth／權杖驗證設定檔，並在每個具有用量時段的提供者旁顯示摘要。
- 控制介面：**用量**會在 OpenClaw 根據工作階段推導的權杖與估算成本分析上方，顯示提供者方案及帳務卡片。Anthropic 和 OpenAI Admin API 憑證會額外加入提供者回報的今日、7 天與 30 天支出、每日趨勢、權杖總數、熱門模型及成本類別。
- 控制介面：聊天撰寫器的上下文環形彈出視窗會顯示訂閱提供者的**方案用量**——各時段進度列（5 小時、每週、模型限定），包含重設時間、已知的提供者方案（例如 `Max (20x)`）及額外用量點數。透過方案計費的工作階段會隱藏每權杖美元估算；以 API 計費的工作階段則保留 `估算成本` 與按類型分類的成本明細。Claude Code 命令列介面（`claude-cli`）設定會沿用相同的 Anthropic 訂閱用量。
- macOS 選單列：當可取得提供者用量快照時，會在「上下文」下方顯示根層級的「用量」區段。請參閱[選單列](/zh-TW/platforms/mac/menu-bar)。

`openclaw channels list` 不再列印提供者用量；它會改為引導使用者使用 `openclaw status` 或 `openclaw models list`。

## Anthropic 與 OpenAI 成本歷史記錄

訂閱配額與 API 帳務是不同的提供者介面：

- Anthropic 訂閱／設定憑證會繼續顯示 Claude 配額時段及選用的額外用量預算。設定 `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY`，即可改為顯示組織的用量與成本 API 歷史記錄。系統會自動偵測以 `sk-ant-admin` 開頭的 Anthropic 提供者憑證。
- OpenAI ChatGPT／Codex OAuth 會繼續顯示方案、配額時段及點數餘額。設定 `OPENAI_ADMIN_KEY`，即可改為顯示組織成本與完成項目用量歷史記錄；也可選擇設定 `OPENAI_PROJECT_ID`，將範圍限定為單一專案。OpenClaw 絕不會將 `OPENAI_API_KEY`、提供者設定或驗證設定檔中的推論憑證傳送至組織 API，因為這些金鑰可能屬於自訂端點。

管理員憑證具有優先權，因為它們提供實際的組織帳務資料。OpenClaw 不會將這些由提供者回報的總數與本機工作階段估算合併；兩個區段刻意回答不同的問題。

## 預設用量頁尾模式

`/usage off|tokens|full` 會設定工作階段的頁尾，並在該工作階段中記住此設定。對尚未選擇模式的工作階段，`messages.responseUsage` 會提供初始模式，因此不必每次輸入 `/usage`，也能預設開啟頁尾。

可為所有頻道設定同一模式，或使用含 `default` 備援值的個別頻道對應表：

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // 或：{ "default": "off", "discord": "full" }
  },
}
```

可接受的值：`"off"`、`"tokens"`、`"full"`，以及舊版別名 `"on"`（視同 `"tokens"`）。

### 三種不同的工作階段狀態

工作階段的 `responseUsage` 欄位可表示三種狀態，每種狀態具有不同語意：

| 狀態                  | 儲存值                          | 生效模式                                                              |
| --------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未設定／繼承**      | `undefined`（不存在）           | 依序沿用 `messages.responseUsage` 設定預設值，再沿用 `off`。           |
| **明確關閉**          | `"off"`（已儲存）               | 永遠關閉；非關閉的設定預設值無法重新啟用頁尾。                        |
| **明確開啟**          | `"tokens"` 或 `"full"`（已儲存） | 無論設定預設值為何，皆使用該模式。                                    |

### 優先順序

生效模式 = 工作階段覆寫 → 頻道設定項目 → `default` → `off`。

明確執行 `/usage off` 時，會在工作階段中將字面值 `"off"` **持久儲存**，這與「未設定」不同。使用者明確停用頁尾後，非關閉的 `messages.responseUsage` 預設值無法重新開啟頁尾。

### 重設與關閉的差異

- `/usage off` 會強制關閉頁尾並持久儲存此選擇。已設定的非關閉預設值無法覆寫此選擇。
- `/usage reset`（別名：`default`、`inherit`、`inherited`、`clear`、`unpin`）會清除工作階段覆寫。之後工作階段會**繼承**生效的設定預設值（`messages.responseUsage`）。若未設定預設值，頁尾會維持關閉。
- 完整工作階段重設（`/reset` 或 `/new`）或工作階段輪替會**保留**明確的用量模式偏好，讓使用者的顯示選擇在工作階段輪替後仍然有效。只有 `/usage reset`（及其別名）會清除覆寫。

### 切換行為

不帶引數的 `/usage` 會依序循環：關閉 → 權杖 → 完整 → 關閉。循環的起點是**目前生效的**模式（未設定工作階段覆寫時會沿用設定預設值），因此循環始終與使用者目前在頁尾看到的內容一致。

### 設定

未提供設定時，會維持先前行為（頁尾保持關閉，直到執行 `/usage`）。使用 `/usage reset` 可清除工作階段覆寫，並重新繼承已設定的預設值。

## 自訂 `/usage full` 頁尾

`/usage tokens` 一律呈現純文字 `用量：輸入 X／輸出 Y` 行（若有資料，還會附加快取與估算成本後綴）。只有 `/usage full` 會呈現下述較豐富的頁尾。

`/usage full` 會顯示內建的精簡頁尾；若可取得相關欄位，會包含模型、推理、快速／慢速、上下文視窗及成本。內建頁尾不需要範本檔案。

`messages.usageTemplate` 僅供進階自訂版面使用。其值可以是 JSON 檔案路徑（支援 `~`）或行內物件，且有效時會取代內建頁尾。檔案路徑會受到監看，並在內容變更時即時重新載入。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

範本缺失或為空時，會直接且不提示地改用內建頁尾。無法讀取或無效的已設定範本（JSON 錯誤，或結構中沒有可呈現的輸出片段）也會改用內建頁尾，並發出操作人員警告。

請從內建結構開始建立自訂範本，再編輯想要變更的部分：

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
  "scales": { "<name>": "由低至高的字形" }, // 字串（每個字元 1 個字形）或陣列
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // 串接保留下來的片段
    "default": [/* 片段 */], // 任何介面的備援值
    "surfaces": {
      "discord": [/* 片段 */],
      "telegram": [/* 片段 */],
    },
  },
}
```

每個介面都是一份依序排列的**片段**清單；引擎會呈現每個片段、移除空值，並使用 `sep` 串接保留下來的片段。沒有對應項目的介面會使用 `output.default`。

### 合約路徑

片段會透過點號路徑讀取每輪合約中的值。不存在的值會視為空值（因此 `when` 防護條件或 `|fallback` 能使片段保持整潔）。

| 路徑                                                                                | 意義                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | 頻道 ID（`discord`/`telegram`/等）                                                               |
| `agentId` / `chat_type`                                                             | 所屬代理程式 ID／聊天介面類型                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | 模型 ID／顯示名稱／供應商 ID                                                                |
| `model.actual`, `model.resolved_ref`                                                | 此輪實際使用的供應商／模型參照                                                        |
| `model.requested`                                                                   | 要求的供應商／模型參照（回退前）                                                       |
| `model.reasoning`                                                                   | 推理強度（從 `off` 到 `xhigh`）                                                                       |
| `model.is_fallback` / `model.is_override`                                           | 布林值：是否使用回退／是否固定模型                                                                   |
| `model.override_source` / `model.auth_mode`                                         | 覆寫來源標籤／憑證模式（`oauth`、`api-key`、`token`、`mixed`、`aws-sdk`、`unknown`） |
| `state.fast_mode`                                                                   | 布林值：快速或慢速                                                                                   |
| `state.compactions`                                                                 | 工作階段的壓縮次數                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | 視窗額度／已占用權杖數／已使用百分比（0–100）                                                         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | 此輪彙總                                                                                       |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | 此輪的快取讀取與快取寫入權杖數                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | 權杖顯示防護條件                                                                                 |
| `usage.cache_hit_pct`                                                               | 快取讀取占提示詞權杖總數的比例                                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 僅限最後一次模型呼叫（另有 `cache_read_tokens`、`cache_write_tokens`、`total_tokens`）           |
| `cost.turn_usd` / `cost.available`                                                  | 此輪預估成本／是否成功解析成本表                                                  |
| `timing.duration_ms`                                                                | 此輪的實際經過時間                                                                             |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | 代理程式身分名稱／表情符號／頭像                                                                 |
| `session.id`                                                                        | 工作階段 ID                                                                                           |

（供應商的速率限制視窗**不在**此合約中；目前沒有值為陣列的路徑，因此 `each` 區塊沒有可迭代的內容。）

### 動詞

依照由左至右的順序，透過動詞管線處理值；非動詞區段則為回退值。

| 動詞            | 效果                                | 範例                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 縮寫計數                         | `272000 -> 272k`                  |
| `fixed:N`       | N 位小數（預設為 2）                | `0.0377`                          |
| `dur`           | 將秒數轉換為持續時間                   | `14820 -> 4h07m`                  |
| `pct`           | 附加 `%`                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 將已使用量轉為剩餘量             |
| `alias:TABLE`   | 在 `aliases` 中查找，未列出則原樣輸出 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 以 0–100 的值產生 W 格的字形量表   | `[⣿⣿⠐⠐⠐]`（`meter:1` = 一個字形） |

### 區塊形式

- `{ "text": "📚 {context.max_tokens|num}" }`：常值文字 + 插值。
- `{ "when": "<path>", "text": "..." }`：僅在路徑值為真時呈現。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：將值對應至字形（`_default` 案例涵蓋未匹配的值）。
- `{ "each": "<array-path>", "item": "{label}" }`：迭代值為陣列的路徑（目前合約中沒有任何路徑是陣列）。

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

例如會呈現為 `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`。

## 供應商與憑證

若無法解析出可用的供應商用量驗證，用量資訊將會隱藏。OpenClaw
會自動探索已啟用且宣告
`contracts.usageProviders`，並同時實作 `resolveUsageAuth` 與
`fetchUsageSnapshot` 的供應商外掛；核心沒有獨立的供應商允許清單。靜態
合約能在不匯入所有供應商外掛的情況下限定探索範圍。各個
外掛自行負責其上游端點與回應對應。共用快照讓方案名稱、配額視窗、
餘額、支出與預算對命令列介面、應用程式及控制介面的取用者保持供應商中立。

- **Anthropic（Claude）**：驗證設定檔中的 OAuth 權杖。若 OAuth 權杖缺少
  `user:profile` 權限範圍，則在已設定時回退至 `claude.ai` 網頁工作階段（`CLAUDE_AI_SESSION_KEY`、
  `CLAUDE_WEB_SESSION_KEY`，或 `CLAUDE_WEB_COOKIE` 中的 `sessionKey=` Cookie）。
  當 Anthropic 回報時，會包含模型範圍限制以及已啟用之額外用量的每月支出／預算。
  改用明確的 Anthropic Admin API 金鑰，或自動偵測到的
  `sk-ant-admin...` 供應商設定檔時，則顯示組織 30 天成本及 Messages API 歷程記錄。
- **ClawRouter**：API 金鑰（`CLAWROUTER_API_KEY`）。設定後會顯示每月預算視窗
  與具型別的美元預算；否則顯示彙總支出，以及請求／權杖／成本摘要。
- **DeepSeek**：透過環境變數／設定／驗證儲存區提供 API 金鑰（`DEEPSEEK_API_KEY`）。
  顯示供應商回報的各幣別餘額。
- **GitHub Copilot**：驗證設定檔中的 OAuth 權杖。
- **Gemini CLI**：驗證設定檔中的 OAuth 權杖。
- **MiniMax**：API 金鑰或 MiniMax OAuth 驗證設定檔。OpenClaw 將
  `minimax`、`minimax-cn` 與 `minimax-portal` 視為相同的 MiniMax 配額
  介面；若存在已儲存的 MiniMax OAuth，會優先使用，否則依序回退至
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  用量輪詢會在已設定時，從 `models.providers.minimax-portal.baseUrl`
  或 `models.providers.minimax.baseUrl` 推導 Coding Plan 主機，否則使用
  MiniMax 中國主機。
  MiniMax 的原始 `usage_percent`／`usagePercent` 欄位表示**剩餘**
  配額，因此 OpenClaw 會先將其反轉再顯示；若存在基於計數的欄位，則以其為準。
  - 視窗標籤會在存在時取自供應商的小時／分鐘欄位，否則
    回退至 `start_time`／`end_time` 的時間跨度。
  - 若程式設計方案端點傳回 `model_remains`，OpenClaw 會優先使用
    聊天模型項目；若缺少明確的 `window_hours`／`window_minutes` 欄位，
    則從時間戳記推導視窗標籤，並在方案標籤中包含模型名稱。
- **OpenAI（Codex／ChatGPT 方案）**：驗證設定檔中的 OAuth 權杖（若存在帳戶 ID，
  則傳送 `ChatGPT-Account-Id` 標頭）。顯示 ChatGPT 方案、可重設的
  Codex 視窗，以及供應商回報的點數餘額。點數仍為供應商
  點數；OpenClaw 不會將其標示為美元。`OPENAI_ADMIN_KEY` 會在金鑰具有 Usage
  Dashboard 存取權時，加入組織 30 天成本及補全用量歷程記錄。推論憑證絕不會轉送至組織 API。
- **OpenRouter**：API 金鑰或由 OAuth 支援的 API 金鑰（`OPENROUTER_API_KEY` 或驗證
  設定檔）。結合帳戶點數端點與金鑰配額端點，因此當憑證可存取這些資訊時，
  會顯示帳戶餘額／支出、金鑰預算，以及每日／每週／每月用量。
  任一端點都能獨立補充快照資訊。
- **Venice**：透過環境變數／設定／驗證儲存區提供 API 金鑰（`VENICE_API_KEY`）。顯示美元與
  DIEM 餘額，以及供應商回報的 DIEM 紀元配額用量。
- **Xiaomi MiMo**：兩個獨立的用量介面。隨用隨付使用 API 金鑰
  （`XIAOMI_API_KEY`）；Token Plan 使用另一組金鑰（`XIAOMI_TOKEN_PLAN_API_KEY`）。
  兩者目前皆不回報配額視窗。
- **z.ai**：透過環境變數／設定／驗證儲存區提供 API 金鑰（`ZAI_API_KEY` 或 `Z_AI_API_KEY`）。

## 相關內容

- [權杖用量與成本](/zh-TW/reference/token-use)
- [API 用量與成本](/zh-TW/reference/api-usage-costs)
- [提示詞快取](/zh-TW/reference/prompt-caching)
- [選單列](/zh-TW/platforms/mac/menu-bar)
