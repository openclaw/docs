---
read_when:
    - 你正在接上提供者用量／配額介面
    - 你需要說明使用量追蹤行為或驗證需求
summary: 使用量追蹤介面與憑證需求
title: 使用量追蹤
x-i18n:
    generated_at: "2026-07-01T18:06:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 這是什麼

- 直接從提供者的使用量端點擷取提供者使用量/配額。
- 沒有估算成本；只有提供者回報的配額時窗或帳戶狀態
  摘要。
- 人類可讀的配額時窗狀態輸出會正規化為 `X% left`，即使
  上游 API 回報的是已消耗配額、剩餘配額，或只有原始
  計數。沒有可重設配額時窗的提供者，則可改為顯示提供者摘要
  文字，例如餘額。
- 工作階段層級的 `/status` 與 `session_status` 可在即時工作階段快照資訊稀疏時，退回使用最新的
  transcript 使用量項目。該
  後援會補齊缺少的 token/cache 計數器、可還原作用中的執行階段
  模型標籤，並在工作階段
  metadata 缺少或較小時偏好較大的 prompt 導向總量。現有非零的即時值仍會優先。

## 顯示位置

- 聊天中的 `/status`：含豐富 emoji 的狀態卡，包含工作階段 tokens + 估算成本（僅 API 金鑰）。可用時，提供者使用量會針對**目前模型提供者**顯示為正規化的 `X% left` 時窗或提供者摘要文字。
- 聊天中的 `/usage off|tokens|full`：每次回應的使用量頁尾。
- 聊天中的 `/usage cost`：從 OpenClaw 工作階段日誌彙總的本機成本摘要。
- 命令列介面：`openclaw status --usage` 會列印完整的逐提供者明細。
- 命令列介面：`openclaw channels list` 會在提供者設定旁列印相同的使用量快照（使用 `--no-usage` 跳過）。
- macOS 選單列：Context 下方的「使用量」區段（僅在可用時）。

## 預設使用量頁尾模式

`/usage off|tokens|full` 會為工作階段設定頁尾，並在該
工作階段中記住。`messages.responseUsage` 會為尚未
選擇模式的工作階段植入該模式，因此頁尾可預設開啟，而不必每次都輸入 `/usage`。

為每個頻道設定一種模式，或使用含 `default` 後援的逐頻道對應表：

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### 三種不同的工作階段狀態

工作階段的 `responseUsage` 欄位有三種可表示狀態，每種都有
不同語意：

| 狀態                | 儲存值                         | 有效模式                                                              |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未設定 / 繼承**   | `undefined`（不存在）           | 會落到 `messages.responseUsage` 設定預設值，接著是 `off`。            |
| **明確關閉**        | `"off"`（已儲存）               | 一律關閉 — 非 off 的設定預設值無法重新啟用頁尾。                     |
| **明確開啟**        | `"tokens"` 或 `"full"`（已儲存） | 該模式，不受設定預設值影響。                                         |

### 優先順序

有效模式 = 工作階段覆寫 → 頻道設定項目 → `default` → `off`。

明確的 `/usage off` 會以字面值 `"off"` **持久化**到
工作階段中，並不等同於「未設定」。這表示非 off 的 `messages.responseUsage`
預設值無法在使用者明確停用後重新開啟頁尾。

### 重設與關閉

- `/usage off` — 強制關閉頁尾並持久化該選擇。已設定的
  非 off 預設值無法覆寫此選擇。
- `/usage reset`（別名：`inherit`、`clear`、`default`）— 清除工作階段
  覆寫。工作階段接著會**繼承**有效設定預設值
  （`messages.responseUsage`）。若未設定預設值，頁尾會關閉
  （與先前相同）。用它來「回到預設值」，而不明確
  開啟頁尾。
- 完整工作階段重設（`/reset` 或 `/new`）或工作階段輪替會**保留**
  明確的使用量模式偏好，讓使用者的顯示選擇在
  工作階段輪替後仍然保留。只有 `/usage reset`（及其別名）會實際清除
  覆寫。

### 切換行為

沒有參數的 `/usage` 會循環：off → tokens → full → off。循環的起點
是目前的**有效**模式（工作階段覆寫未設定時會落到
設定預設值），因此循環永遠會與使用者在頁尾看到的內容一致。

### 設定

沒有設定時會維持先前行為（頁尾關閉，直到使用 `/usage`）。使用
`/usage reset` 清除工作階段覆寫，並重新繼承已設定的預設值。

## 自訂 `/usage full` 頁尾

`/usage full` 會顯示內建的精簡頁尾，包含模型、reasoning、快速/慢速、
context window，以及可用時的成本。Token 與 cache 欄位
仍可供自訂模板使用。不需要模板檔案。

`messages.usageTemplate` 僅供進階自訂版面使用。其值是
JSON 檔案路徑（支援 `~`）或 inline object，且會在有效時取代內建
頁尾：

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

缺少或空白的模板會靜默退回內建頁尾。無法讀取
或無效的已設定模板也會退回內建頁尾，並發出
operator 警告。

從內建形狀開始建立自訂模板，再編輯想要
變更的部分：

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
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
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
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
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

每個 surface 都是**片段**的有序清單；引擎會渲染每個片段、丟棄
空值，並使用 `sep` 串接保留下來的片段。沒有項目的 surface 會使用
`output.default`。

### 合約路徑

片段會透過 dot-path 從每回合合約讀取值。不存在的值會是
空值（因此 `when` guard 或 `|fallback` 可讓片段保持乾淨）。

| 路徑                                                                                | 意義                                   |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | 頻道 id（`discord`/`telegram`/等等）   |
| `model.provider` / `model.display_name`                                             | 提供者 id / 模型 id                    |
| `model.reasoning`                                                                   | effort（`off` 到 `xhigh`）             |
| `model.is_fallback` / `model.is_override`                                           | bool：已使用後援 / 已釘選模型         |
| `state.fast_mode`                                                                   | bool：快速 vs 慢速                     |
| `context.max_tokens` / `context.pct_used`                                           | 時窗預算 / 已使用 0-100                |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | 回合彙總                               |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | token 顯示 guard 與 cache 百分比       |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 僅最後一次模型呼叫                     |
| `cost.turn_usd`                                                                     | 估算回合成本                           |
| `identity.name` / `identity.emoji`                                                  | agent 名稱 / 選擇的 emoji              |

（提供者速率限制時窗**不**在此合約中。）

### 動詞

將值透過動詞由左至右以 pipe 傳遞；非動詞區段是後援值。

| 動詞            | 效果                                  | 範例                              |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 精簡計數                              | `272000 -> 272k`                  |
| `fixed:N`       | N 位小數（預設 2）                    | `0.0377`                          |
| `dur`           | 秒數轉 duration                       | `14820 -> 4h07m`                  |
| `pct`           | 附加 `%`                              | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 用於已使用轉剩餘                  |
| `alias:TABLE`   | 在 `aliases` 中查找，未列出則回顯     | `medium -> 🌗`                    |
| `meter:W:SCALE` | 在 0-100 值上顯示 W 格 glyph 長條     | `[⣿⣿⠐⠐⠐]`（`meter:1` = 一個 glyph） |

### 片段形式

- `{ "text": "📚 {context.max_tokens|num}" }`：literal + interpolation。
- `{ "when": "<path>", "text": "..." }`：僅在 path 為 truthy 時渲染。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：值對應到 glyph。
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

會渲染例如 `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`。

## 提供者 + 憑證

- **Anthropic (Claude)**：驗證設定檔中的 OAuth 權杖。
- **GitHub Copilot**：驗證設定檔中的 OAuth 權杖。
- **Gemini 命令列介面**：驗證設定檔中的 OAuth 權杖。
  - JSON 用量會回退到 `stats`；`stats.cached` 會正規化為
    `cacheRead`。
- **OpenAI Codex**：驗證設定檔中的 OAuth 權杖（存在時使用 accountId）。
- **MiniMax**：API 金鑰或 MiniMax OAuth 驗證設定檔。OpenClaw 會將
  `minimax`、`minimax-cn` 和 `minimax-portal` 視為相同的 MiniMax 配額
  介面，存在時優先使用儲存的 MiniMax OAuth，否則回退到
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  用量輪詢會在已設定時從 `models.providers.minimax-portal.baseUrl`
  或 `models.providers.minimax.baseUrl` 推導 Coding Plan 主機，否則使用
  MiniMax CN 主機。
  MiniMax 的原始 `usage_percent` / `usagePercent` 欄位代表**剩餘**
  配額，因此 OpenClaw 會在顯示前反轉它們；存在時以計數型欄位為準。
  - Coding-plan 視窗標籤會在存在時來自供應商的小時/分鐘欄位，
    然後回退到 `start_time` / `end_time` 時間範圍。
  - 如果 coding-plan 端點傳回 `model_remains`，OpenClaw 會優先使用
    chat-model 項目，在缺少明確的 `window_hours` / `window_minutes` 欄位時
    從時間戳推導視窗標籤，並在方案標籤中包含模型名稱。
- **Xiaomi MiMo**：透過 env/config/auth store 使用 API 金鑰（`XIAOMI_API_KEY`）。
- **z.ai**：透過 env/config/auth store 使用 API 金鑰。
- **DeepSeek**：透過 env/config/auth store 使用 API 金鑰（`DEEPSEEK_API_KEY`）。
  OpenClaw 會呼叫 DeepSeek 的餘額端點，並將供應商回報的
  餘額顯示為文字，而不是剩餘百分比配額視窗。

當無法解析可用的供應商用量驗證時，會隱藏用量。供應商
可以提供外掛專用的用量驗證邏輯；否則 OpenClaw 會回退到
驗證設定檔、環境變數或設定中相符的 OAuth/API-key 認證。

## 相關

- [Token 使用量與成本](/zh-TW/reference/token-use)
- [API 使用量與成本](/zh-TW/reference/api-usage-costs)
- [提示快取](/zh-TW/reference/prompt-caching)
