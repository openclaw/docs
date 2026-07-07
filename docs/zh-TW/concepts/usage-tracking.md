---
read_when:
    - 你正在串接供應商用量／配額介面
    - 你需要說明使用量追蹤行為或驗證要求
summary: 使用量追蹤介面與憑證需求
title: 使用情況追蹤
x-i18n:
    generated_at: "2026-07-06T21:48:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e50a48efec908acacf3b9fa31113a4a56553ae07c806d04e4b20aa7bf88b0b5
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 這是什麼

- 直接從各提供者的使用量端點擷取提供者使用量/配額。不估算提供者帳單；只顯示提供者回報的方案名稱、配額視窗、餘額、花費、預算、每日成本歷史、token/模型歸因，或帳戶狀態摘要。
- 人類可讀的配額視窗輸出會正規化為 `X% left`，即使提供者回報的是已用配額、剩餘配額，或只有原始計數也是如此。沒有可重設配額視窗的提供者，會改為顯示提供者摘要文字（例如餘額）。
- 工作階段層級的 `/status` 和 `session_status` 工具，在即時工作階段快照缺少 token/模型資料時，會回退使用工作階段的逐字記錄日誌。該回退會補齊缺少的 token/快取計數器，可以還原使用中的執行階段模型標籤，並且在工作階段中繼資料缺失或較小時（`totalTokensFresh !== true`、零，或低於從逐字記錄推導出的值），偏好較大的提示導向總量。非零即時值一律優先於回退值。

## 顯示位置

- 聊天中的 `/status`：包含工作階段 token 和估算成本（僅限 API 金鑰模型）的狀態卡。提供者使用量會在可用時，針對**目前模型提供者**顯示，格式為正規化的 `X% left` 視窗或提供者摘要文字。
- 聊天中的 `/usage off|tokens|full`：每次回應的使用量頁尾。
- 聊天中的 `/usage cost`：從 OpenClaw 工作階段日誌彙總的本機成本摘要。
- 命令列介面：`openclaw status --usage` 會列印完整的逐提供者使用量/配額明細。
- 命令列介面：`openclaw models status` 會列出 OAuth/token 驗證設定檔，並在每個有使用量視窗的提供者旁顯示使用量視窗摘要。
- Control UI：**Usage** 會在 OpenClaw 從工作階段推導出的 token 和估算成本分析上方，顯示提供者方案與帳單卡。Anthropic 和 OpenAI Admin API 憑證會加入提供者回報的今日、7 日與 30 日花費、每日趨勢、token 總量、熱門模型和成本類別。
- macOS 選單列：當提供者使用量快照可用時，根層級的「Usage」區段會出現在 Context 下方。請參閱 [選單列](/zh-TW/platforms/mac/menu-bar)。

`openclaw channels list` 不再列印提供者使用量；它會改為指引用戶前往 `openclaw status` 或 `openclaw models list`。

## Anthropic 和 OpenAI 成本歷史

訂閱配額與 API 帳單是不同的提供者介面：

- Anthropic 訂閱/設定憑證會繼續顯示 Claude 配額視窗和選用的額外使用量預算。設定 `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY`，即可改為顯示組織 Usage 和 Cost API 歷史。以 `sk-ant-admin` 開頭的 Anthropic 提供者憑證會自動偵測。
- OpenAI ChatGPT/Codex OAuth 會繼續顯示方案、配額視窗和點數餘額。設定 `OPENAI_ADMIN_KEY`，即可改為顯示組織成本與 completions 使用量歷史；也可選擇設定 `OPENAI_PROJECT_ID`，將範圍限定到單一專案。OpenClaw 絕不會將來自 `OPENAI_API_KEY`、提供者設定或驗證設定檔的推論憑證傳送到組織 API，因為這些金鑰可能屬於自訂端點。

管理員憑證優先，因為它們提供實際的組織帳單。OpenClaw 不會將這些提供者回報的總量與其本機工作階段估算合併；這兩個區段刻意回答不同問題。

## 預設使用量頁尾模式

`/usage off|tokens|full` 會設定工作階段的頁尾，並為該工作階段記住。`messages.responseUsage` 會為尚未選擇模式的工作階段植入該模式，因此頁尾可以預設開啟，而不必每次都輸入 `/usage`。

為每個頻道設定一個模式，或設定每頻道對應表並搭配 `default` 回退：

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

| 狀態               | 儲存值                    | 有效模式                                                        |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未設定 / 繼承** | `undefined`（不存在）            | 會落到 `messages.responseUsage` 設定預設值，然後是 `off`。 |
| **明確關閉**    | `"off"`（已儲存）                | 一律關閉，非 off 的設定預設值無法重新啟用頁尾。     |
| **明確開啟**     | `"tokens"` 或 `"full"`（已儲存） | 該模式，不受設定預設值影響。                              |

### 優先順序

有效模式 = 工作階段覆寫 → 頻道設定項目 → `default` → `off`。

明確的 `/usage off` 會以字面值 `"off"` **持久儲存**在工作階段中，與「未設定」不同。非 off 的 `messages.responseUsage` 預設值，無法在使用者已明確停用後重新開啟頁尾。

### 重設與關閉

- `/usage off` 會強制關閉頁尾並持久儲存該選擇。已設定的非 off 預設值無法覆寫此選擇。
- `/usage reset`（別名：`default`、`inherit`、`inherited`、`clear`、`unpin`）會清除工作階段覆寫。接著工作階段會**繼承**有效的設定預設值（`messages.responseUsage`）。如果未設定預設值，頁尾會保持關閉。
- 完整工作階段重設（`/reset` 或 `/new`）或工作階段輪替會**保留**明確的使用量模式偏好，讓使用者的顯示選擇在工作階段輪替後仍然存在。只有 `/usage reset`（及其別名）會清除覆寫。

### 切換行為

不帶引數的 `/usage` 會循環：off → tokens → full → off。循環的起點是**有效**的目前模式（工作階段覆寫在未設定時會落到設定預設值），因此循環一律符合使用者目前在頁尾看到的內容。

### 設定

沒有設定時會維持先前行為（頁尾關閉直到使用 `/usage`）。使用 `/usage reset` 清除工作階段覆寫，並重新繼承已設定的預設值。

## 自訂 `/usage full` 頁尾

`/usage tokens` 一律會呈現純文字 `Usage: X in / Y out` 行（可用時加上快取和估算成本後綴）。只有 `/usage full` 會呈現下述更豐富的頁尾。

`/usage full` 會顯示內建的精簡頁尾，包含模型、推理、快速/慢速、上下文視窗，以及在可用時的成本。內建頁尾不需要模板檔案。

`messages.usageTemplate` 只適用於進階自訂版面。值是 JSON 檔案路徑（支援 `~`）或內嵌物件，且有效時會取代內建頁尾。檔案路徑會被監看，並在變更時即時重新載入。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

缺少或空白的模板會安靜地回退到內建頁尾。無法讀取或無效的已設定模板（JSON 錯誤，或形狀沒有可呈現的輸出片段）也會回退到內建頁尾，並發出操作員警告。

從內建形狀開始建立自訂模板，然後編輯想變更的部分：

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

每個介面都是**片段**的有序清單；引擎會呈現每個片段、丟棄空值，並用 `sep` 串接保留下來的片段。沒有項目的介面會使用 `output.default`。

### 契約路徑

片段會透過點路徑從每回合契約讀取值。不存在的值會是空的（因此 `when` 保護條件或 `|fallback` 可讓片段保持乾淨）。

| Path                                                                                | 意義                                                                                                 |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | 通道 ID（`discord`/`telegram`/等等）                                                                 |
| `agentId` / `chat_type`                                                             | 所屬代理 ID / 聊天介面種類                                                                           |
| `model.id` / `model.display_name` / `model.provider`                                | 模型 ID / 顯示名稱 / 供應商 ID                                                                       |
| `model.actual`, `model.resolved_ref`                                                | 此回合實際使用的供應商/模型參照                                                                      |
| `model.requested`                                                                   | 請求的供應商/模型參照（回退前）                                                                      |
| `model.reasoning`                                                                   | effort（`off` 到 `xhigh`）                                                                           |
| `model.is_fallback` / `model.is_override`                                           | 布林值：已使用回退 / 模型已固定                                                                      |
| `model.override_source` / `model.auth_mode`                                         | 覆寫來源標籤 / 憑證模式（`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`）                |
| `state.fast_mode`                                                                   | 布林值：快速相對於慢速                                                                               |
| `state.compactions`                                                                 | 工作階段的壓縮次數                                                                                   |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | 視窗預算 / 已佔用 token / 已使用 0-100                                                               |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | 回合彙總                                                                                             |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | 此回合的快取讀取與快取寫入 token                                                                     |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | token 顯示防護                                                                                       |
| `usage.cache_hit_pct`                                                               | 快取讀取佔總 prompt token 的比例                                                                     |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 僅最終模型呼叫（也包含 `cache_read_tokens`, `cache_write_tokens`, `total_tokens`）                   |
| `cost.turn_usd` / `cost.available`                                                  | 預估回合成本 / 成本表是否已解析                                                                      |
| `timing.duration_ms`                                                                | 牆鐘回合持續時間                                                                                     |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | 代理身分名稱 / emoji / 頭像                                                                          |
| `session.id`                                                                        | 工作階段 ID                                                                                          |

（供應商速率限制視窗**不**在此合約中；目前沒有陣列值路徑，因此 `each` 片段沒有可迭代的內容。）

### 動詞

將值由左至右通過動詞管線；非動詞片段是回退值。

| 動詞            | 效果                                  | 範例                              |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 緊湊計數                              | `272000 -> 272k`                  |
| `fixed:N`       | N 位小數（預設 2）                    | `0.0377`                          |
| `dur`           | 秒數轉持續時間                        | `14820 -> 4h07m`                  |
| `pct`           | 附加 `%`                              | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 用於已使用轉剩餘                  |
| `alias:TABLE`   | 在 `aliases` 中查找，未列出則原樣輸出 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 在 0-100 值上顯示 W 格字形條          | `[⣿⣿⠐⠐⠐]`（`meter:1` = 一個字形） |

### 片段形式

- `{ "text": "📚 {context.max_tokens|num}" }`：字面值 + 插值。
- `{ "when": "<path>", "text": "..." }`：僅在路徑為 truthy 時轉譯。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：值轉字形（`_default` case 涵蓋未匹配值）。
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

轉譯結果例如 `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`。

## 供應商 + 憑證

當無法解析可用的供應商用量驗證時，系統會隱藏用量。OpenClaw
會自動探索已啟用、宣告 `contracts.usageProviders` 並同時實作
`resolveUsageAuth` 與 `fetchUsageSnapshot` 的供應商外掛；沒有獨立的核心供應商允許清單。靜態
合約會在不匯入每個供應商外掛的情況下，讓探索保持在限定範圍內。每個
外掛擁有自己的上游端點與回應對應。共用快照會讓方案名稱、配額視窗、餘額、花費與預算
對命令列介面、應用程式與 Control UI 消費者保持供應商中立。

- **Anthropic (Claude)**：驗證設定檔中的 OAuth token。如果 OAuth token 缺少
  `user:profile` scope，設定時會回退到 `claude.ai` 網頁工作階段（`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY`，或 `CLAUDE_WEB_COOKIE` 中的 `sessionKey=` cookie）。
  當 Anthropic 回報時，會包含模型範圍限制與已啟用的額外用量每月花費/預算。
  明確的 Anthropic Admin API 金鑰，或自動偵測到的 `sk-ant-admin...` 供應商設定檔，
  則會改為顯示 30 天組織成本與 Messages API 歷史記錄。
- **ClawRouter**：API 金鑰（`CLAWROUTER_API_KEY`）。設定時會顯示每月預算視窗
  與型別化 USD 預算；否則顯示彙總花費與請求/token/成本摘要。
- **DeepSeek**：透過 env/config/auth store 的 API 金鑰（`DEEPSEEK_API_KEY`）。
  顯示每個供應商回報的貨幣餘額。
- **GitHub Copilot**：驗證設定檔中的 OAuth token。
- **Gemini 命令列介面**：驗證設定檔中的 OAuth token。
- **MiniMax**：API 金鑰或 MiniMax OAuth 驗證設定檔。OpenClaw 將
  `minimax`、`minimax-cn` 與 `minimax-portal` 視為同一個 MiniMax 配額
  介面，存在時優先使用已儲存的 MiniMax OAuth，否則回退到
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  用量輪詢會在已設定時，從 `models.providers.minimax-portal.baseUrl`
  或 `models.providers.minimax.baseUrl` 推導 Coding Plan host，否則使用
  MiniMax CN host。
  MiniMax 的原始 `usage_percent` / `usagePercent` 欄位表示**剩餘**
  配額，因此 OpenClaw 會在顯示前將它們反轉；存在時以計數型欄位優先。
  - 視窗標籤會在存在時來自供應商的小時/分鐘欄位，然後
    回退到 `start_time` / `end_time` 範圍。
  - 如果 coding-plan 端點回傳 `model_remains`，OpenClaw 會優先使用
    chat-model 項目，在明確的 `window_hours` / `window_minutes` 欄位不存在時
    從時間戳推導視窗標籤，並在方案標籤中包含模型名稱。
- **OpenAI（Codex/ChatGPT 方案）**：驗證設定檔中的 OAuth token（存在 account id 時會傳送
  `ChatGPT-Account-Id` header）。顯示 ChatGPT 方案、可重設的
  Codex 視窗，以及回報時的 credit 餘額。Credit 仍是供應商
  credit；OpenClaw 不會將它們標示為美元。當金鑰具備 Usage
  Dashboard 存取權時，`OPENAI_ADMIN_KEY` 會加入 30 天組織成本與 completions-usage 歷史記錄。
  推論憑證絕不會轉送至組織 API。
- **OpenRouter**：API 金鑰或 OAuth 支援的 API 金鑰（`OPENROUTER_API_KEY` 或驗證
  設定檔）。結合 account credits 端點與 key quota 端點，
  因此當憑證可存取時，會顯示帳戶餘額/花費、金鑰預算，以及每日/每週/每月用量。
  任一端點都可以獨立豐富快照。
- **Venice**：透過 env/config/auth store 的 API 金鑰（`VENICE_API_KEY`）。回報時會顯示 USD 與
  DIEM 餘額，以及 DIEM epoch allocation 用量。
- **Xiaomi MiMo**：兩個獨立的用量介面。Pay-as-you-go 使用 API 金鑰
  （`XIAOMI_API_KEY`）；Token Plan 使用另一個金鑰（`XIAOMI_TOKEN_PLAN_API_KEY`）。
  目前兩者都不回報配額視窗。
- **z.ai**：透過 env/config/auth store 的 API 金鑰（`ZAI_API_KEY` 或 `Z_AI_API_KEY`）。

## 相關

- [Token 使用量與成本](/zh-TW/reference/token-use)
- [API 用量與成本](/zh-TW/reference/api-usage-costs)
- [Prompt 快取](/zh-TW/reference/prompt-caching)
- [選單列](/zh-TW/platforms/mac/menu-bar)
