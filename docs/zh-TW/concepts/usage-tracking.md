---
read_when:
    - 你正在串接供應商用量／配額介面
    - 你需要說明用量追蹤行為或驗證要求
summary: 用量追蹤介面與認證資訊需求
title: 用量追蹤
x-i18n:
    generated_at: "2026-07-19T13:42:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a1bc9aeb95cd80a48ab57a18fcd24894fdd6fb71e10e8bea8bae67a8688b78e
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 功能說明

- 直接從各提供者的用量端點擷取用量／配額。不估算提供者帳單；僅顯示提供者回報的方案名稱、配額週期、餘額、支出、預算、每日成本歷史、權杖／模型歸屬或帳戶狀態摘要。
- 即使提供者回報的是已使用配額、剩餘配額或僅有原始計數，也會將人類可讀的配額週期輸出正規化為 `X% left`。沒有可重設配額週期的提供者則改為顯示提供者摘要文字（例如餘額）。
- 當即時工作階段快照缺少權杖／模型資料時，工作階段層級的 `/status` 和 `session_status` 工具會退回使用該工作階段的逐字記錄日誌。此備援會補齊缺少的權杖／快取計數、可復原作用中執行階段的模型標籤，並在工作階段中繼資料缺失或較小時（`totalTokensFresh !== true`、零或低於從逐字記錄推導出的值），優先採用較大的提示導向總計。非零的即時值一律優先於備援值。

## 顯示位置

- 聊天中的 `/status`：顯示工作階段權杖和估算成本的狀態卡（僅限 API 金鑰模型）。若可取得目前模型提供者的用量，會將其顯示為正規化的 `X% left` 週期或提供者摘要文字。
- 聊天中的 `/usage off|tokens|full`：每則回應的用量頁尾。
- 聊天中的 `/usage cost`：從 OpenClaw 工作階段日誌彙總的本機成本摘要。
- 命令列介面：`openclaw status --usage` 會列印各提供者的完整用量／配額明細。
- 命令列介面：`openclaw models status` 會列出 OAuth／權杖驗證設定檔，並在每個具有用量週期的提供者旁顯示其摘要。
- 控制介面：**用量**會在 OpenClaw 根據工作階段推導的權杖與估算成本分析上方，顯示提供者方案及帳單卡片。Anthropic 和 OpenAI Admin API 認證資訊還會加入提供者回報的今日、7 天及 30 天支出、每日趨勢、權杖總數、熱門模型和成本類別。
- 控制介面：聊天撰寫器的情境環狀指示器彈出視窗會顯示訂閱提供者的**方案用量**，包括各週期進度列（5 小時、每週、模型範圍）、重設時間、已知的提供者方案（例如 `Max (20x)`）以及額外用量額度。透過方案計費的工作階段會隱藏按權杖計算的金額估算；透過 API 計費的工作階段則保留 `Est. cost` 和依類型分類的成本明細。Claude Code 命令列介面（`claude-cli`）設定會重複使用相同的 Anthropic 訂閱用量。
- macOS 選單列：若有可用的提供者用量快照，情境區段下方會顯示根層級的「用量」區段。請參閱[選單列](/zh-TW/platforms/mac/menu-bar)。

`openclaw channels list` 不再列印提供者用量；它會改為引導使用者前往 `openclaw status` 或 `openclaw models list`。

## Anthropic 和 OpenAI 成本歷史

訂閱配額與 API 帳單是不同的提供者介面：

- Anthropic 訂閱／設定認證資訊會繼續顯示 Claude 配額週期及選用的額外用量預算。設定 `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY`，即可改為顯示組織的 Usage and Cost API 歷史。系統會自動偵測以 `sk-ant-admin` 開頭的 Anthropic 提供者認證資訊。
- OpenAI ChatGPT／Codex OAuth 會繼續顯示方案、配額週期和額度餘額。設定 `OPENAI_ADMIN_KEY`，即可改為顯示組織的成本和完成項目用量歷史；也可選擇設定 `OPENAI_PROJECT_ID`，將範圍限制於單一專案。OpenClaw 絕不會將 `OPENAI_API_KEY`、提供者設定或驗證設定檔中的推論認證資訊傳送至組織 API，因為這些金鑰可能屬於自訂端點。

管理員認證資訊具有優先權，因為它們提供實際的組織帳單。OpenClaw 不會將這些由提供者回報的總計與其本機工作階段估算合併；這兩個區段刻意回答不同的問題。

## 預設用量頁尾模式

`/usage off|tokens|full` 會設定工作階段的頁尾，並在該工作階段中記住此設定。`messages.responseUsage` 會為尚未選擇模式的工作階段提供初始模式，因此頁尾可預設開啟，而不必每次都輸入 `/usage`。

可為所有頻道設定單一模式，或使用具有 `default` 備援值的個別頻道對應：

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

工作階段的 `responseUsage` 欄位有三種可表示的狀態，各自具有不同語意：

| 狀態                | 儲存值                          | 生效模式                                                              |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **未設定／繼承** | `undefined`（不存在）            | 依序退回使用 `messages.responseUsage` 設定預設值，再使用 `off`。 |
| **明確關閉**    | `"off"`（已儲存）                | 一律關閉；非關閉的設定預設值無法重新啟用頁尾。     |
| **明確開啟**     | `"tokens"` 或 `"full"`（已儲存） | 無論設定預設值為何，皆使用該模式。                              |

### 優先順序

生效模式 = 工作階段覆寫值 → 頻道設定項目 → `default` → `off`。

明確設定的 `/usage off` 會以常值 `"off"` **持久儲存**於工作階段中，並不等同於「未設定」。使用者明確停用頁尾後，非關閉的 `messages.responseUsage` 預設值無法將其重新開啟。

### 重設與關閉的差異

- `/usage off` 會強制關閉頁尾並持久儲存此選擇。已設定的非關閉預設值無法覆寫此選擇。
- `/usage reset`（別名：`default`、`inherit`、`inherited`、`clear`、`unpin`）會清除工作階段覆寫值。工作階段接著會**繼承**生效的設定預設值（`messages.responseUsage`）。若未設定預設值，頁尾會保持關閉。
- 完整重設工作階段（`/reset` 或 `/new`）或工作階段輪替會**保留**明確的用量模式偏好，讓使用者的顯示選擇在工作階段輪替後仍然有效。只有 `/usage reset`（及其別名）會清除覆寫值。

### 切換行為

不帶引數的 `/usage` 會依序循環：關閉 → 權杖 → 完整 → 關閉。循環起點為目前的**生效**模式（未設定時，工作階段覆寫值會退回使用設定預設值），因此循環一律與使用者目前在頁尾看到的內容一致。

### 設定

未提供設定時，會維持先前的行為（頁尾保持關閉，直到使用 `/usage`）。使用 `/usage reset` 可清除工作階段覆寫值，並重新繼承已設定的預設值。

## 自訂 `/usage full` 頁尾

`/usage tokens` 一律呈現純文字的 `Usage: X in / Y out` 行（若可取得，也會加上快取和估算成本後綴）。只有 `/usage full` 會呈現下述較豐富的頁尾。

`/usage full` 會顯示內建的精簡頁尾；若相關欄位可用，則包含模型、推理、快速／慢速、情境視窗和成本。內建頁尾不需要範本檔案。

`messages.usageTemplate` 僅供進階自訂版面配置使用。其值可以是 JSON 檔案路徑（支援 `~`）或行內物件；若有效，便會取代內建頁尾。系統會監看檔案路徑，並在變更時即時重新載入。

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

缺少或空白的範本會靜默退回使用內建頁尾。無法讀取或無效的已設定範本（JSON 錯誤，或結構中沒有可呈現的輸出片段）也會退回使用內建頁尾，並發出操作員警告。

請從內建結構開始建立自訂範本，再編輯要變更的部分：

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
  "scales": { "<name>": "由低至高的圖符" }, // 字串（每個字元 1 個圖符）或陣列
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // 串接保留下來的片段
    "default": [/* pieces */], // 所有介面的備援值
    "surfaces": {
      "discord": [/* pieces */],
      "telegram": [/* pieces */],
    },
  },
}
```

每個介面都是由**片段**組成的有序清單；引擎會呈現各片段、捨棄空白片段，並使用 `sep` 串接保留下來的片段。沒有項目的介面會使用 `output.default`。

### 合約路徑

片段會透過點路徑從每回合合約讀取值。不存在的值會視為空白（因此使用 `when` 防護條件或 `|fallback` 可讓片段保持整潔）。

| 路徑                                                                                | 意義                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | 頻道 ID（`discord`/`telegram`/等）                                                               |
| `agentId` / `chat_type`                                                             | 所屬代理程式 ID／聊天介面類型                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | 模型 ID／顯示名稱／供應商 ID                                                                |
| `model.actual`, `model.resolved_ref`                                                | 此回合實際使用的供應商／模型參照                                                        |
| `model.requested`                                                                   | 請求的供應商／模型參照（回退前）                                                       |
| `model.reasoning`                                                                   | 推理強度（`off` 至 `xhigh`）                                                                       |
| `model.is_fallback` / `model.is_override`                                           | 布林值：是否使用回退／是否固定模型                                                                   |
| `model.override_source` / `model.auth_mode`                                         | 覆寫來源標籤／認證資訊模式（`oauth`、`api-key`、`token`、`mixed`、`aws-sdk`、`unknown`） |
| `state.fast_mode`                                                                   | 布林值：快速或慢速                                                                                   |
| `state.compactions`                                                                 | 工作階段的壓縮次數                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | 視窗額度／已占用權杖／已使用百分比（0–100）                                                         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | 回合彙總                                                                                       |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | 此回合的快取讀取與快取寫入權杖                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | 權杖顯示防護條件                                                                                 |
| `usage.cache_hit_pct`                                                               | 快取讀取占提示詞權杖總數的比例                                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | 僅限最終模型呼叫（也包含 `cache_read_tokens`、`cache_write_tokens`、`total_tokens`）           |
| `cost.turn_usd` / `cost.available`                                                  | 預估回合成本／是否解析出成本表                                                  |
| `timing.duration_ms`                                                                | 回合實際經過時間                                                                             |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | 代理程式身分名稱／表情符號／頭像                                                                 |
| `session.id`                                                                        | 工作階段 ID                                                                                           |

（供應商速率限制視窗**不**在此合約中；目前沒有陣列值路徑，因此 `each` 區塊沒有可迭代的項目。）

### 動詞

將值由左至右依序傳入動詞；非動詞區段為回退值。

| 動詞            | 效果                                | 範例                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | 簡寫數值                         | `272000 -> 272k`                  |
| `fixed:N`       | N 位小數（`0..100`，預設為 2）      | `0.0377`                          |
| `dur`           | 將秒數轉為持續時間                   | `14820 -> 4h07m`                  |
| `pct`           | 附加 `%`                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | 將已使用量轉為剩餘量             |
| `alias:TABLE`   | 在 `aliases` 中查找；未列出時原樣輸出 | `medium -> 🌗`                    |
| `meter:W:SCALE` | 以 W 格字形長條表示 0–100 的值   | `[⣿⣿⠐⠐⠐]`（`meter:1` = 一個字形） |

`fixed:N` 僅接受 0 至 100 的完整十進位整數。無效的
精確度引數會使該插值結果為空。

`meter:W:SCALE` 僅接受 1 至 100 的完整十進位整數寬度。將寬度留空會使用預設值 5（`meter::braille`）；無效的
寬度會使該插值結果為空。

### 區塊形式

- `{ "text": "📚 {context.max_tokens|num}" }`：常值文字 + 插值。
- `{ "when": "<path>", "text": "..." }`：僅在路徑值為真時呈現。
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`：將值對應至字形（以 `_default` 分支涵蓋未相符的值）。
- `{ "each": "<array-path>", "item": "{label}" }`：迭代陣列值路徑（目前合約中沒有任何陣列路徑）。

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

呈現結果例如 `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`。

## 供應商與認證資訊

無法解析出可用的供應商用量驗證資訊時，會隱藏用量。OpenClaw
會自動探索已啟用、宣告
`contracts.usageProviders` 並同時實作 `resolveUsageAuth` 與
`fetchUsageSnapshot` 的供應商外掛；核心沒有獨立的供應商允許清單。靜態
合約可限制探索範圍，而不必匯入所有供應商外掛。每個
外掛負責自己的上游端點與回應對應。共用
快照以供應商中立的方式保存方案名稱、配額視窗、餘額、支出和預算，
供命令列介面、應用程式與 Control UI 使用。

- **Anthropic（Claude）**：驗證設定檔中的 OAuth 權杖。若 OAuth 權杖缺少
  `user:profile` 範圍，則在已設定時回退至 `claude.ai` 網頁工作階段（`CLAUDE_AI_SESSION_KEY`、
  `CLAUDE_WEB_SESSION_KEY`，或 `CLAUDE_WEB_COOKIE` 中的 `sessionKey=` Cookie）。
  Anthropic 回報時，會納入模型範圍限制，以及已啟用額外用量的每月支出／預算。
  若改用明確的 Anthropic Admin API 金鑰，或自動偵測到的
  `sk-ant-admin...` 供應商設定檔，則會顯示 30 天
  組織成本與 Messages API 歷史記錄。
- **ClawRouter**：API 金鑰（`CLAWROUTER_API_KEY`）。已設定時顯示每月預算視窗
  與具型別的 USD 預算；否則顯示彙總支出，以及
  請求／權杖／成本摘要。
- **DeepSeek**：透過環境變數／設定／驗證儲存區提供 API 金鑰（`DEEPSEEK_API_KEY`）。
  顯示供應商回報的各幣別餘額。
- **GitHub Copilot**：驗證設定檔中的 OAuth 權杖。
- **Gemini CLI**：驗證設定檔中的 OAuth 權杖。
- **MiniMax**：API 金鑰或 MiniMax OAuth 驗證設定檔。OpenClaw 將
  `minimax`、`minimax-cn` 和 `minimax-portal` 視為相同的 MiniMax 配額
  介面；若存在已儲存的 MiniMax OAuth，會優先使用，否則回退至
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  設定時，用量輪詢會從 `models.providers.minimax-portal.baseUrl`
  或 `models.providers.minimax.baseUrl` 推導 Coding Plan 主機；否則使用
  MiniMax 中國主機。
  MiniMax 的原始 `usage_percent`／`usagePercent` 欄位表示**剩餘**
  配額，因此 OpenClaw 會在顯示前將其反轉；若有以計數為基礎的欄位，
  則優先使用。
  - 若供應商提供小時／分鐘欄位，視窗標籤會取自這些欄位，否則
    回退至 `start_time`／`end_time` 時間範圍。
  - 若 Coding Plan 端點回傳 `model_remains`，OpenClaw 會優先採用
    聊天模型項目；若缺少明確的 `window_hours`／`window_minutes` 欄位，
    則從時間戳記推導視窗標籤，並在方案標籤中包含模型名稱。
- **OpenAI（Codex/ChatGPT 方案）**：驗證設定檔中的 OAuth 權杖（若有帳戶 ID，
  則傳送 `ChatGPT-Account-Id` 標頭）。顯示 ChatGPT 方案、可重設的
  Codex 視窗，以及供應商回報時的點數餘額。點數仍是供應商
  點數；OpenClaw 不會將其標示為美元。當金鑰具有 Usage
  Dashboard 存取權時，`OPENAI_ADMIN_KEY` 會加入 30 天組織成本與
  Completions 用量歷史記錄。推論認證資訊絕不會轉送至組織 API。
- **OpenRouter**：API 金鑰或由 OAuth 支援的 API 金鑰（`OPENROUTER_API_KEY` 或驗證
  設定檔）。結合帳戶點數端點與金鑰配額端點，
  因此當認證資訊可存取這些資料時，會顯示帳戶餘額／支出、金鑰預算，
  以及每日／每週／每月用量。任一端點皆可獨立補充快照資料。
- **Venice**：透過環境變數／設定／驗證儲存區提供 API 金鑰（`VENICE_API_KEY`）。顯示 USD 與
  DIEM 餘額，以及供應商回報時的 DIEM epoch 配置用量。
- **Xiaomi MiMo**：兩個獨立的用量介面。隨用隨付使用 API 金鑰
  （`XIAOMI_API_KEY`）；Token Plan 使用另一把獨立金鑰（`XIAOMI_TOKEN_PLAN_API_KEY`）。
  目前兩者都不回報配額視窗。
- **z.ai**：透過環境變數／設定／驗證儲存區提供 API 金鑰（`ZAI_API_KEY` 或 `Z_AI_API_KEY`）。

## 相關內容

- [權杖用量與成本](/zh-TW/reference/token-use)
- [API 用量與成本](/zh-TW/reference/api-usage-costs)
- [提示詞快取](/zh-TW/reference/prompt-caching)
- [選單列](/zh-TW/platforms/mac/menu-bar)
