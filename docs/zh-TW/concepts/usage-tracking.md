---
read_when:
    - 你正在串接供應商用量／配額介面
    - 你需要說明使用量追蹤行為或驗證要求
summary: 使用量追蹤介面與憑證需求
title: 使用量追蹤
x-i18n:
    generated_at: "2026-07-05T11:16:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 680240a1a8aa9f4d440de87f62ebfe96ac136375f8b35ca3cc44524846b36ccf
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 這是什麼

- 直接從各供應商的用量端點拉取供應商用量/配額。沒有估算成本；只有供應商回報的配額時段、餘額或帳戶狀態摘要。
- 人類可讀的配額時段輸出會正規化為 `X% left`，即使供應商回報的是已消耗配額、剩餘配額，或只有原始計數。沒有可重設配額時段的供應商會改為顯示供應商摘要文字（例如餘額）。
- 工作階段層級的 `/status` 和 `session_status` 工具，會在即時工作階段快照缺少 token/模型資料時，回退使用工作階段的轉錄記錄。該回退會補齊缺少的 token/快取計數器、可復原使用中的執行階段模型標籤，並在工作階段中繼資料缺少或較小時（`totalTokensFresh !== true`、零，或低於從轉錄推導出的值），偏好較大的面向提示詞總數。非零即時值一律優先於回退。

## 顯示位置

- 聊天中的 `/status`：包含工作階段 token 和估算成本（僅限 API 金鑰模型）的狀態卡。供應商用量會在可用時針對**目前模型供應商**顯示，格式為正規化的 `X% left` 時段或供應商摘要文字。
- 聊天中的 `/usage off|tokens|full`：每次回應的用量頁尾。
- 聊天中的 `/usage cost`：從 OpenClaw 工作階段記錄彙總的本機成本摘要。
- 命令列介面：`openclaw status --usage` 會列印完整的逐供應商用量/配額明細。
- 命令列介面：`openclaw models status` 會列出 OAuth/token 驗證設定檔，並在有用量時段摘要的每個供應商旁顯示摘要。
- macOS 選單列：當供應商用量快照可用時，Context 下方會出現根層級的「Usage」區段。請參閱[選單列](/zh-TW/platforms/mac/menu-bar)。

`openclaw channels list` 不再列印供應商用量；它會改為指引使用者前往 `openclaw status` 或 `openclaw models list`。

## 預設用量頁尾模式

`/usage off|tokens|full` 會設定工作階段的頁尾，並為該工作階段記住設定。`messages.responseUsage` 會為尚未選擇模式的工作階段植入該模式，因此不必每次輸入 `/usage`，也能預設開啟頁尾。

為每個頻道設定一個模式，或使用含有 `default` 回退的逐頻道對應表：

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

接受的值：`"off"`、`"tokens"`、`"full"`，以及舊版別名 `"on"`（視為 `"tokens"`）。

### 三種不同的工作階段狀態

工作階段的 `responseUsage` 欄位有三種可表示狀態，每種都有不同語意：

| 狀態 | 儲存值 | 生效模式 |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未設定 / 繼承** | `undefined`（不存在） | 先落到 `messages.responseUsage` 設定預設值，再落到 `off`。 |
| **明確關閉** | `"off"`（已儲存） | 一律關閉，非關閉的設定預設值無法重新啟用頁尾。 |
| **明確開啟** | `"tokens"` 或 `"full"`（已儲存） | 無論設定預設值為何，都使用該模式。 |

### 優先順序

生效模式 = 工作階段覆寫 → 頻道設定項目 → `default` → `off`。

明確的 `/usage off` 會以字面值 `"off"` **持久化**到工作階段中，不等同於「未設定」。一旦使用者明確停用頁尾，非關閉的 `messages.responseUsage` 預設值就無法再把頁尾開回來。

### 重設與關閉

- `/usage off` 會強制關閉頁尾並持久化該選擇。已設定的非關閉預設值無法覆寫它。
- `/usage reset`（別名：`default`、`inherit`、`inherited`、`clear`、`unpin`）會清除工作階段覆寫。接著工作階段會**繼承**生效的設定預設值（`messages.responseUsage`）。如果未設定預設值，頁尾會維持關閉。
- 完整的工作階段重設（`/reset` 或 `/new`）或工作階段輪替會**保留**明確的用量模式偏好，讓使用者的顯示選擇在工作階段輪替後仍然保留。只有 `/usage reset`（及其別名）會清除覆寫。

### 切換行為

不帶引數的 `/usage` 會循環：off → tokens → full → off。循環的起點是目前**生效**模式（未設定時由工作階段覆寫落到設定預設值），因此循環一律符合使用者目前在頁尾看到的內容。

### 設定

沒有設定時會維持先前行為（頁尾關閉，直到使用 `/usage`）。使用 `/usage reset` 可清除工作階段覆寫，並重新繼承已設定的預設值。

## 自訂 `/usage full` 頁尾

`/usage tokens` 一律呈現純文字 `Usage: X in / Y out` 行（可用時加上快取和估算成本後綴）。只有 `/usage full` 會呈現下方描述的較豐富頁尾。

`/usage full` 會在欄位可用時顯示內建精簡頁尾，包含模型、推理、快速/慢速、情境視窗和成本。內建頁尾不需要範本檔案。

`messages.usageTemplate` 僅供進階自訂版面使用。此值是 JSON 檔案路徑（支援 `~`）或內嵌物件，且有效時會取代內建頁尾。檔案路徑會被監看，並在變更時即時重新載入。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

缺少或空白範本會安靜地回退到內建頁尾。無法讀取或無效的已設定範本（錯誤 JSON，或形狀沒有可呈現的輸出片段）也會回退到內建頁尾，並發出操作員警告。

從內建形狀開始自訂範本，然後編輯想變更的部分：

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

### 形狀

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

每個介面都是有序的**片段**清單；引擎會呈現每個片段、丟棄空片段，並用 `sep` 串接保留下來的片段。沒有項目的介面會使用 `output.default`。

### 合約路徑

片段會透過點路徑從逐回合合約讀取值。不存在的值為空（因此 `when` 防護或 `|fallback` 可保持片段乾淨）。

| 路徑                                                                                | 含義                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | 通道 id（`discord`/`telegram`/等等）                                                               |
| `agentId` / `chat_type`                                                             | 所屬 agent id / 聊天介面種類                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | model id / 顯示名稱 / 提供者 id                                                                |
| `model.actual`, `model.resolved_ref`                                                | 該回合實際使用的提供者/model 參照                                                        |
| `model.requested`                                                                   | 要求的提供者/model 參照（備援前）                                                       |
| `model.reasoning`                                                                   | effort（`off` 到 `xhigh`）                                                                       |
| `model.is_fallback` / `model.is_override`                                           | bool：已使用備援 / model 已釘選                                                                   |
| `model.override_source` / `model.auth_mode`                                         | 覆寫來源標籤 / 憑證模式（`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`） |
| `state.fast_mode`                                                                   | bool：快速與慢速                                                                                   |
| `state.compactions`                                                                 | 工作階段的壓縮次數                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | 視窗預算 / 已占用 token / 0-100 已使用                                                         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | 回合彙總                                                                                       |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | 該回合的 cache-read 與 cache-write token                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | token 顯示防護條件                                                                                 |
| `usage.cache_hit_pct`                                                               | cache-read 占總 prompt token 的比例                                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 僅最終 model 呼叫（也有 `cache_read_tokens`, `cache_write_tokens`, `total_tokens`）           |
| `cost.turn_usd` / `cost.available`                                                  | 預估回合成本 / 成本表是否已解析                                                  |
| `timing.duration_ms`                                                                | 回合實際耗時                                                                             |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | agent 身分名稱 / emoji / 頭像                                                                 |
| `session.id`                                                                        | 工作階段 id                                                                                           |

（提供者 rate-limit 視窗**不**在此合約中；目前沒有陣列值路徑，因此 `each` 片段沒有可迭代的內容。）

### 動詞

將值由左至右通過動詞；非動詞片段是備援值。

| 動詞            | 效果                                | 範例                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 精簡計數                         | `272000 -> 272k`                  |
| `fixed:N`       | N 位小數（預設 2）                | `0.0377`                          |
| `dur`           | 秒數轉為持續時間                   | `14820 -> 4h07m`                  |
| `pct`           | 附加 `%`                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 將已使用轉為剩餘             |
| `alias:TABLE`   | 在 `aliases` 中查找；未列出則原樣輸出 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 以 0-100 的值產生 W 格 glyph 長條   | `[⣿⣿⠐⠐⠐]`（`meter:1` = 一個 glyph） |

### 片段形式

- `{ "text": "📚 {context.max_tokens|num}" }`：字面值 + 插值。
- `{ "when": "<path>", "text": "..." }`：僅在路徑為 truthy 時呈現。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：將值轉成 glyph（`_default` case 涵蓋未匹配的值）。
- `{ "each": "<array-path>", "item": "{label}" }`：迭代陣列值路徑（目前沒有合約路徑是陣列）。

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

會呈現例如 `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`。

## 提供者 + 憑證

當無法解析可用的提供者用量驗證時，用量會隱藏。提供者
會供應自己的用量擷取邏輯；當該邏輯不可用時，OpenClaw 會退回
比對來自驗證設定檔、環境變數或設定中的 OAuth/API 金鑰憑證。

- **Anthropic (Claude)**：驗證設定檔中的 OAuth token。如果 OAuth token 缺少
  `user:profile` scope，則在有設定時退回 `claude.ai` 網頁工作階段（`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY`，或 `CLAUDE_WEB_COOKIE` 中的 `sessionKey=` cookie）。
- **ClawRouter**：API 金鑰（`CLAWROUTER_API_KEY`）。在已設定預算時顯示每月預算視窗，
  否則顯示請求/token/成本摘要。
- **DeepSeek**：透過 env/config/auth store 的 API 金鑰（`DEEPSEEK_API_KEY`）。
  顯示提供者回報的帳戶餘額文字，而不是剩餘百分比
  配額視窗。
- **GitHub Copilot**：驗證設定檔中的 OAuth token。
- **Gemini CLI**：驗證設定檔中的 OAuth token。
- **MiniMax**：API 金鑰或 MiniMax OAuth 驗證設定檔。OpenClaw 將
  `minimax`, `minimax-cn`, 和 `minimax-portal` 視為相同的 MiniMax 配額
  介面，存在已儲存的 MiniMax OAuth 時優先使用，否則退回
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, 或 `MINIMAX_API_KEY`。
  用量輪詢會在已設定時從 `models.providers.minimax-portal.baseUrl`
  或 `models.providers.minimax.baseUrl` 推導 Coding Plan 主機，否則使用
  MiniMax CN 主機。
  MiniMax 的原始 `usage_percent` / `usagePercent` 欄位表示**剩餘**
  配額，因此 OpenClaw 會先將其反轉再顯示；存在以計數為基礎的欄位時
  會優先使用。
  - 視窗標籤會在存在時來自提供者的 hours/minutes 欄位，接著
    退回 `start_time` / `end_time` 範圍。
  - 如果 coding-plan 端點回傳 `model_remains`，OpenClaw 會偏好
    chat-model 項目，在沒有明確
    `window_hours` / `window_minutes` 欄位時從 timestamp 推導視窗標籤，並在方案標籤中包含 model
    名稱。
- **OpenAI (Codex/ChatGPT plan)**：驗證設定檔中的 OAuth token（存在帳戶 id 時會送出 `ChatGPT-Account-Id`
  header）。不追蹤僅使用 API 金鑰的 OpenAI 用量。
- **Xiaomi MiMo**：兩個獨立的用量介面。隨用隨付使用 API 金鑰
  （`XIAOMI_API_KEY`）；Token Plan 使用另一個獨立金鑰（`XIAOMI_TOKEN_PLAN_API_KEY`）。
  兩者目前都不回報配額視窗。
- **z.ai**：透過 env/config/auth store 的 API 金鑰（`ZAI_API_KEY` 或 `Z_AI_API_KEY`）。

## 相關

- [Token 使用量與成本](/zh-TW/reference/token-use)
- [API 用量與成本](/zh-TW/reference/api-usage-costs)
- [Prompt 快取](/zh-TW/reference/prompt-caching)
- [選單列](/zh-TW/platforms/mac/menu-bar)
