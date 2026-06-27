---
read_when:
    - 你正在接入供應商用量／配額介面
    - 你需要說明使用量追蹤行為或驗證要求
summary: 使用量追蹤介面與憑證需求
title: 使用量追蹤
x-i18n:
    generated_at: "2026-06-27T19:15:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 這是什麼

- 直接從提供者的用量端點拉取提供者用量/配額。
- 不估算成本；只顯示提供者回報的配額時段或帳戶狀態摘要。
- 人類可讀的配額時段狀態輸出會標準化為 `X% left`，即使上游 API 回報的是已用配額、剩餘配額，或只有原始計數。沒有可重設配額時段的提供者，則可以改顯示提供者摘要文字，例如餘額。
- 工作階段層級的 `/status` 和 `session_status` 可在即時工作階段快照資訊稀疏時，回退使用最新的 transcript 用量項目。該回退會補齊缺少的 token/cache 計數器、可復原作用中執行階段模型標籤，並在工作階段中繼資料缺失或較小時，偏好較大的 prompt 導向總量。既有非零的即時值仍優先。

## 顯示位置

- 聊天中的 `/status`：含豐富 emoji 的狀態卡，包含工作階段 token + 估算成本（僅 API 金鑰）。可用時，提供者用量會針對**目前模型提供者**顯示為標準化的 `X% left` 時段或提供者摘要文字。
- 聊天中的 `/usage off|tokens|full`：每則回應的用量頁尾（OAuth 只顯示 token）。
- 聊天中的 `/usage cost`：從 OpenClaw 工作階段記錄彙總的本機成本摘要。
- 命令列介面：`openclaw status --usage` 會列印完整的逐提供者明細。
- 命令列介面：`openclaw channels list` 會在提供者設定旁列印相同的用量快照（使用 `--no-usage` 跳過）。
- macOS 選單列：Context 底下的「Usage」區段（僅在可用時）。

## 預設用量頁尾模式

`/usage off|tokens|full` 會設定工作階段的頁尾，並為該工作階段記住。`messages.responseUsage` 會為尚未選擇模式的工作階段植入該模式，因此不用每次輸入 `/usage`，頁尾也可以預設開啟。

為每個頻道設定一種模式，或使用含 `default` 回退的逐頻道對照：

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### 三種不同的工作階段狀態

工作階段的 `responseUsage` 欄位有三種可表示狀態，每種語意不同：

| 狀態                | 儲存值                          | 有效模式                                                              |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未設定 / 繼承**   | `undefined`（不存在）           | 依序回退到 `messages.responseUsage` 設定預設值，然後是 `off`。        |
| **明確關閉**        | `"off"`（已儲存）               | 一律關閉 — 非 `off` 的設定預設值無法重新啟用頁尾。                   |
| **明確開啟**        | `"tokens"` 或 `"full"`（已儲存） | 該模式，不受設定預設值影響。                                          |

### 優先順序

有效模式 = 工作階段覆寫 → 頻道設定項目 → `default` → `off`。

明確的 `/usage off` 會以字面值 `"off"` **持久化**到工作階段中，並不等同於「未設定」。這表示一旦使用者明確停用頁尾，非 `off` 的 `messages.responseUsage` 預設值也無法把頁尾重新開啟。

### 重設與關閉

- `/usage off` — 強制關閉頁尾並持久化此選擇。已設定的非 `off` 預設值無法覆寫此選擇。
- `/usage reset`（別名：`inherit`、`clear`、`default`）— 清除工作階段覆寫。接著工作階段會**繼承**有效的設定預設值（`messages.responseUsage`）。若未設定預設值，頁尾會關閉（與先前相同）。使用這個指令可「回到預設值」，而不必明確開啟頁尾。
- 完整工作階段重設（`/reset` 或 `/new`）或工作階段 rollover 會**保留**明確的用量模式偏好，因此使用者的顯示選擇可在工作階段 rollover 後繼續存在。只有 `/usage reset`（及其別名）會實際清除覆寫。

### 切換行為

沒有引數的 `/usage` 會循環：off → tokens → full → off。循環的起點是目前的**有效**模式（工作階段覆寫；未設定時則回退到設定預設值），因此循環永遠會與使用者在頁尾看到的內容一致。

### 設定

沒有設定時會維持先前行為（頁尾關閉直到使用 `/usage`）。使用 `/usage reset` 清除工作階段覆寫，並重新繼承已設定的預設值。

## 自訂 `/usage full` 頁尾

`/usage full` 會顯示內建的精簡頁尾，其中包含模型、reasoning、快速/慢速、內容視窗、turn token、cache，以及可用時的成本。不需要 template 檔案。

`messages.usageTemplate` 僅供進階自訂版面使用。值可以是 JSON 檔案路徑（支援 `~`）或 inline 物件；有效時會取代內建頁尾：

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

缺少或空白的 template 會安靜地回退到內建頁尾。無法讀取或無效的已設定 template 也會回退到內建頁尾，並發出操作員警告。

從內建形狀開始建立自訂 template，然後編輯想變更的部分：

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
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
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

每個 surface 都是**片段**的有序清單；引擎會渲染每個片段、丟棄空值，並用 `sep` 連接保留下來的片段。沒有項目的 surface 會使用 `output.default`。

### 合約路徑

片段會透過 dot-path 從每個 turn 的合約讀取值。不存在的值會是空值（因此 `when` guard 或 `|fallback` 可讓片段保持乾淨）。

| 路徑                                                                                | 意義                                   |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | 頻道 id（`discord`/`telegram`/等）     |
| `model.provider` / `model.display_name`                                             | 提供者 id / 模型 id                    |
| `model.reasoning`                                                                   | effort（`off` 到 `xhigh`）             |
| `model.is_fallback` / `model.is_override`                                           | bool：已使用 fallback / 模型已釘選     |
| `state.fast_mode`                                                                   | bool：快速 vs 慢速                     |
| `context.max_tokens` / `context.pct_used`                                           | 視窗預算 / 已使用 0-100                |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | turn 彙總                              |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | token 顯示 guard 與 cache 百分比       |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 僅最終模型呼叫                         |
| `cost.turn_usd`                                                                     | 估算的 turn 成本                       |
| `identity.name` / `identity.emoji`                                                  | agent 名稱 / 選定 emoji                |

（提供者速率限制時段**不**在此合約中。）

### Verb

將值透過 verb 由左至右串接處理；非 verb 片段是 fallback。

| Verb            | 效果                                  | 範例                              |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 精簡計數                              | `272000 -> 272k`                  |
| `fixed:N`       | N 位小數（預設 2）                    | `0.0377`                          |
| `dur`           | 秒數轉持續時間                        | `14820 -> 4h07m`                  |
| `pct`           | 附加 `%`                              | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 用於已用轉剩餘                    |
| `alias:TABLE`   | 在 `aliases` 查找，未列出則原樣回傳   | `medium -> 🌗`                    |
| `meter:W:SCALE` | 在 0-100 值上顯示 W 格 glyph 長條     | `[⣿⣿⠐⠐⠐]`（`meter:1` = 一個 glyph） |

### 片段形式

- `{ "text": "📚 {context.max_tokens|num}" }`：字面值 + 插值。
- `{ "when": "<path>", "text": "..." }`：只有路徑為 truthy 時才渲染。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：值轉 glyph。
- `{ "each": "limits.windows", "item": "{label}" }`：迭代陣列。

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

## 供應商 + 憑證

- **Anthropic (Claude)**：驗證設定檔中的 OAuth 權杖。
- **GitHub Copilot**：驗證設定檔中的 OAuth 權杖。
- **Gemini 命令列介面**：驗證設定檔中的 OAuth 權杖。
  - JSON 用量會回退到 `stats`；`stats.cached` 會正規化為
    `cacheRead`。
- **OpenAI Codex**：驗證設定檔中的 OAuth 權杖（存在時使用 accountId）。
- **MiniMax**：API 金鑰或 MiniMax OAuth 驗證設定檔。OpenClaw 會將
  `minimax`、`minimax-cn` 和 `minimax-portal` 視為相同的 MiniMax 配額
  介面；存在已儲存的 MiniMax OAuth 時會優先使用，否則回退到
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  用量輪詢會在已設定時從 `models.providers.minimax-portal.baseUrl`
  或 `models.providers.minimax.baseUrl` 推導 Coding Plan 主機，否則使用
  MiniMax CN 主機。
  MiniMax 的原始 `usage_percent` / `usagePercent` 欄位表示**剩餘**
  配額，因此 OpenClaw 會先反轉它們再顯示；存在計數型欄位時，以其為準。
  - Coding-plan 視窗標籤會在存在時取自供應商的小時/分鐘欄位，
    然後回退到 `start_time` / `end_time` 的時間範圍。
  - 如果 coding-plan 端點回傳 `model_remains`，OpenClaw 會偏好
    聊天模型項目；在缺少明確的 `window_hours` / `window_minutes`
    欄位時，從時間戳推導視窗標籤，並在方案標籤中包含模型名稱。
- **Xiaomi MiMo**：透過 env/config/auth store（`XIAOMI_API_KEY`）提供 API 金鑰。
- **z.ai**：透過 env/config/auth store 提供 API 金鑰。
- **DeepSeek**：透過 env/config/auth store（`DEEPSEEK_API_KEY`）提供 API 金鑰。
  OpenClaw 會呼叫 DeepSeek 的餘額端點，並將供應商回報的餘額顯示為文字，而不是剩餘百分比配額視窗。

當無法解析出可用的供應商用量驗證資訊時，會隱藏用量。供應商可以提供外掛專屬的用量驗證邏輯；否則 OpenClaw 會回退到驗證設定檔、環境變數或設定中相符的 OAuth/API 金鑰憑證。

## 相關

- [Token 使用量與費用](/zh-TW/reference/token-use)
- [API 使用量與費用](/zh-TW/reference/api-usage-costs)
- [提示快取](/zh-TW/reference/prompt-caching)
