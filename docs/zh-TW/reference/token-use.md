---
read_when:
    - 說明權杖用量、費用或上下文視窗
    - 偵錯上下文增長或壓縮行為
summary: OpenClaw 如何建構提示詞上下文並回報權杖用量與成本
title: Token 使用量與費用
x-i18n:
    generated_at: "2026-07-05T11:43:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw 追蹤的是 **token**，不是字元。token 依模型而異，但大多數
OpenAI 風格的模型在英文文字中平均約每個 token 4 個字元。

## 系統提示如何建立

OpenClaw 會在每次執行時組裝自己的系統提示。它包含：

- 工具清單 + 簡短描述
- Skills 清單（僅中繼資料；指令會依需求以 `read` 載入）。原生
  Codex 回合會取得精簡 Skills 區塊，作為回合範圍的協作
  開發者指令；其他執行框架則會在一般提示介面中取得它。
  受 `skills.limits.maxSkillsPromptChars` 限制，並可在
  `agents.list[].skillsLimits.maxSkillsPromptChars` 設定選用的每代理
  覆寫值。
- 自我更新指令
- 工作區 + 啟動檔案（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、
  `IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`（新增時），以及
  `MEMORY.md`（存在時））。大型注入檔案會由
  `agents.defaults.bootstrapMaxChars` 截斷（預設值：`20000`）；啟動注入總量
  受 `agents.defaults.bootstrapTotalMaxChars` 限制（預設值：
  `60000`）。
  - 當該工作區可使用記憶工具時，原生 Codex 回合不會貼上原始
    `MEMORY.md`；它們改為在回合範圍的協作開發者指令中取得一個小型記憶指標，
    並依需求使用記憶工具。如果工具已停用、記憶搜尋不可用，或作用中的工作區
    不同於代理記憶工作區，`MEMORY.md` 會退回一般的有界回合脈絡路徑。
  - 小寫根目錄 `memory.md` 永遠不會被注入。它是
    `openclaw doctor --fix` 的舊版修復輸入，會被遷移到 `MEMORY.md`。
  - `memory/*.md` 每日檔案不是一般啟動提示的一部分；
    它們在一般回合中透過記憶工具按需使用。重設/啟動
    模型執行可以在第一個回合前置一次性的啟動脈絡區塊，包含近期
    每日記憶，由 `agents.defaults.startupContext` 控制。純聊天 `/new`
    和 `/reset` 會在不叫用模型的情況下被確認。
  - 壓縮後的 `AGENTS.md` 摘錄是分開的，且需要明確
    選擇啟用 `agents.defaults.compaction.postCompactionSections`。
- 時間（UTC + 使用者時區）
- 回覆標籤 + 心跳偵測行為
- 執行階段中繼資料（主機/作業系統/模型/思考）

完整拆解請參閱[系統提示](/zh-TW/concepts/system-prompt)。

記錄憑證或驗證片段時，請使用
[機密預留位置慣例](/zh-TW/reference/secret-placeholder-conventions)，以避免僅文件變更觸發
機密掃描器誤報。

## 脈絡視窗中計入哪些內容

模型收到的所有內容都會計入脈絡限制：

- 系統提示（上述所有區段）
- 對話歷史（使用者 + 助理訊息）
- 工具呼叫與工具結果
- 附件/逐字稿（圖片、音訊、檔案）
- 壓縮摘要與修剪成品
- 提供者包裝或安全標頭（不可見，但仍會計入）

執行階段較重的介面在 `agents.defaults.contextLimits` 下有自己的明確上限
（每代理覆寫值位於 `agents.list[].contextLimits`）：

| 鍵                       | 用途                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | `memory_get` 在截斷前回傳的最大字元數。                                  |
| `memoryGetDefaultLines`  | 當請求省略 `lines` 時，`memory_get` 的預設行視窗。                       |
| `toolResultMaxChars`     | 單一即時工具結果的進階上限（最高 `1000000` 字元）。                      |
| `postCompactionMaxChars` | 壓縮後重新整理期間從 `AGENTS.md` 保留的最大字元數。                      |

這些是有界的執行階段摘錄與執行階段擁有的注入區塊，
與啟動限制、啟動脈絡限制和 Skills 提示限制分開。

`toolResultMaxChars` 預設未設定，因此 OpenClaw 會從有效模型脈絡視窗推導即時
工具結果上限：低於 100K token 時為 `16000` 字元，100K+ token 時為
`32000` 字元，200K+ token 時為 `64000` 字元。
即使設定了更大的明確上限，執行階段脈絡占比防護仍會將單一工具結果限制為
脈絡視窗的 30%。

對於圖片，OpenClaw 會在提供者呼叫前縮小逐字稿/工具圖片承載。
使用 `agents.defaults.imageMaxDimensionPx`（預設值：`1200`）調整：

- 較低值會減少視覺 token 使用量與承載大小。
- 較高值會為 OCR/UI 密集的螢幕截圖保留更多視覺細節。

若要取得實用拆解（按每個注入檔案、工具、Skills 和系統提示大小），請使用
`/context list` 或 `/context detail`。請參閱
[脈絡](/zh-TW/concepts/context)。

## 如何查看目前 token 使用量

在聊天中：

- `/status` -> 含有表情符號的狀態卡，顯示工作階段模型、脈絡使用量、
  上次回應的輸入/輸出 token，以及當作用中模型已設定本機價格時的估算成本。
- `/usage off|tokens|full` -> 將每次回應的使用量頁尾附加到每個
  回覆。每個工作階段持久保存（儲存為 `responseUsage`）。
  - `/usage reset`（別名：`inherit`、`clear`、`default`）會清除
    工作階段覆寫值，使其重新繼承設定的預設值。
  - `/usage tokens` 顯示回合 token/快取詳細資料。
  - `/usage full` 顯示精簡的模型/脈絡/成本詳細資料；只有當 OpenClaw
    具有使用量中繼資料且作用中模型具有本機價格時，才會顯示估算成本。
    自訂 `messages.usageTemplate` 版面配置可包含 token/快取欄位。
- `/usage cost` -> 來自 OpenClaw 工作階段記錄的本機成本摘要。

其他介面：

- **終端介面/Web 終端介面：** 支援 `/status` 和 `/usage`。
- **命令列介面：** `openclaw status --usage` 和 `openclaw channels list` 會顯示
  正規化的提供者配額視窗（`剩餘 X%`，不是每次回應成本）。
  目前的使用量視窗提供者：Claude (Anthropic)、ClawRouter、Copilot
  (GitHub)、DeepSeek、Gemini (Google Gemini CLI)、MiniMax、OpenAI、Xiaomi、
  Xiaomi Token Plan 和 z.ai。

使用量介面會在顯示前正規化常見的提供者原生欄位別名。對於 OpenAI 家族
Responses 流量，這同時包含 `input_tokens`/`output_tokens` 和
`prompt_tokens`/`completion_tokens`，因此傳輸特定欄位名稱不會改變
`/status`、`/usage` 或工作階段摘要。Gemini CLI 使用量也會被正規化：
預設 `stream-json` 解析器會讀取助理 `message` 事件，而 `stats.cached`
會映射到 `cacheRead`；當 CLI 省略明確的 `stats.input` 欄位時，會使用
`stats.input_tokens - stats.cached`。舊版 JSON 覆寫仍會從 `response`
讀取回覆文字。

對於原生 OpenAI 家族 Responses 流量，WebSocket/SSE 使用量別名也會以相同方式
正規化，且當 `total_tokens` 缺失或為 `0` 時，總數會退回使用正規化輸入 + 輸出。

當目前工作階段快照稀疏時，`/status` 和 `session_status`
可以從最新的逐字稿使用量記錄中復原 token/快取計數器與作用中執行階段模型標籤。
既有非零即時值仍優先於逐字稿退回值；當儲存的總數缺失或較小時，較大的提示導向
逐字稿總數可以勝出。

提供者配額視窗的使用量驗證會先來自提供者特定掛鉤；如果提供者沒有掛鉤（或掛鉤
無法解析 token），OpenClaw 會退回比對來自驗證設定檔、環境變數或設定的
OAuth/API 金鑰憑證。

助理逐字稿項目會持久保存相同的正規化使用量形狀，
包括當作用中模型已設定價格且提供者回傳使用量中繼資料時的 `usage.cost`。
這讓 `/usage cost` 和以逐字稿為基礎的工作階段狀態，即使在即時
執行階段狀態消失後，仍有穩定來源。

OpenClaw 會將提供者使用量計量與目前脈絡快照分開。提供者 `usage.total`
可能包含已快取輸入、輸出，以及多次工具迴圈模型呼叫，因此它對成本與遙測很有用，
但可能高估即時脈絡視窗。脈絡顯示與診斷會使用最新提示快照
（`promptTokens`，或在沒有提示快照時使用最後一次模型呼叫）作為 `context.used`。

## 成本估算（顯示時）

成本會從你的模型價格設定估算：

```text
models.providers.<provider>.models[].cost
```

這些是 `input`、`output`、`cacheRead` 和
`cacheWrite` 的 **每 100 萬 token 美元**。如果缺少價格，`/usage full`
會省略成本；當你需要在每個回覆中顯示 token/快取詳細資料時，請使用
`/usage tokens` 或自訂 `messages.usageTemplate`。成本顯示不限於 API 金鑰
驗證：非 API 金鑰提供者（例如 `aws-sdk`）也可以在其設定的模型項目包含本機價格，
且提供者回傳使用量中繼資料時顯示估算成本。

在 sidecar 和頻道到達 Gateway 就緒路徑後，OpenClaw 會為尚未具有本機價格的
已設定模型參照啟動選用的背景價格啟動程序。該啟動程序會擷取遠端 OpenRouter 和
LiteLLM 價格目錄。在離線或受限網路上，請設定 `models.pricing.enabled: false`
以略過這些目錄擷取；明確的 `models.providers.*.models[].cost` 項目仍會驅動
本機成本估算。

## 快取 TTL 與修剪影響

提供者提示快取只會在快取 TTL 視窗內套用。OpenClaw
可以選擇執行 **cache-ttl 修剪**：它會在快取 TTL 過期後修剪工作階段，
然後重設快取視窗，讓後續請求重複使用新快取的脈絡，而不是重新快取完整歷史。
這會在工作階段閒置超過 TTL 時降低快取寫入成本。

請在 [Gateway 設定](/zh-TW/gateway/configuration) 中設定，並在
[工作階段修剪](/zh-TW/concepts/session-pruning) 查看行為詳細資料。

心跳偵測可以跨越閒置間隔讓快取保持 **暖機**。如果你的模型快取
TTL 是 `1h`，將心跳偵測間隔設定為略低於該值（例如 `55m`）可避免
重新快取完整提示，降低快取寫入成本。

在多代理設定中，你可以保留一個共享模型設定，並使用
`agents.list[].params.cacheRetention` 按代理調整快取行為。

完整逐項旋鈕指南請參閱[提示快取](/zh-TW/reference/prompt-caching)。

對於 Anthropic API 價格，快取讀取比輸入 token 便宜很多，而快取寫入會以較高倍數計費。
最新費率與 TTL 倍數請參閱 Anthropic 的提示快取價格：
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

### 範例：採用每代理快取策略的混合流量

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` 會合併到所選模型的 `params` 之上，因此你可以只覆寫
`cacheRetention`，並讓其他模型預設值保持不變。

### Anthropic 1M 脈絡

OpenClaw 會以 Anthropic 的 1M 脈絡視窗來設定支援 GA 的 Claude 4.x 模型，
例如 Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6。你不需要為這些模型設定
`params.context1m: true`。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

較舊的設定可以保留 `context1m: true`，但 OpenClaw 不再因為此設定傳送
Anthropic 已退役的 `context-1m-2025-08-07` beta 標頭，也不會將不支援的較舊
Claude 模型擴展到 1M。

要求：憑證必須符合長上下文使用資格。若不符合，
Anthropic 會針對該請求回應供應商端的速率限制錯誤。

如果你使用 OAuth/訂閱權杖
(`sk-ant-oat-*`) 驗證 Anthropic，OpenClaw 會保留 OAuth 所需的 Anthropic beta
標頭，同時在較舊設定中若仍存在已退役的 `context-1m-*` beta，會將其移除。

## 降低 token 壓力的提示

- 使用 `/compact` 摘要長工作階段。
- 在你的工作流程中修剪大型工具輸出。
- 針對大量截圖的工作階段，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 Skills 描述簡短（Skills 清單會注入到提示中）。
- 對於冗長、探索性的工作，優先使用較小型模型。

請參閱 [Skills](/zh-TW/tools/skills) 了解精確的 Skills 清單額外負擔公式。

## 相關內容

- [API 使用量與成本](/zh-TW/reference/api-usage-costs)
- [提示快取](/zh-TW/reference/prompt-caching)
- [使用量追蹤](/zh-TW/concepts/usage-tracking)
