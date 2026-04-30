---
read_when:
    - 說明權杖使用量、成本或上下文視窗
    - 偵錯上下文成長或 Compaction 行為
summary: OpenClaw 如何建構提示詞脈絡並回報詞元使用量與成本
title: 權杖使用量與費用
x-i18n:
    generated_at: "2026-04-30T03:39:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# Token 使用量與成本

OpenClaw 追蹤的是 **Token**，不是字元。Token 會因模型而異，但大多數
OpenAI 風格模型對英文文字平均約為每個 Token 4 個字元。

## 系統提示詞如何建構

OpenClaw 會在每次執行時組合自己的系統提示詞。其中包含：

- 工具清單 + 簡短說明
- Skills 清單（僅中繼資料；指示會依需求透過 `read` 載入）。
  精簡的 Skills 區塊受 `skills.limits.maxSkillsPromptChars` 限制，
  並可在
  `agents.list[].skillsLimits.maxSkillsPromptChars`
  設定選用的個別代理覆寫。
- 自我更新指示
- 工作區 + 啟動檔案（新的 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`，以及存在時的 `MEMORY.md`）。小寫根目錄 `memory.md` 不會被注入；它是在與 `MEMORY.md` 搭配時供 `openclaw doctor --fix` 使用的舊版修復輸入。大型檔案會由 `agents.defaults.bootstrapMaxChars` 截斷（預設：12000），且啟動注入總量受 `agents.defaults.bootstrapTotalMaxChars` 限制（預設：60000）。`memory/*.md` 每日檔案不屬於一般啟動提示詞；在一般回合中仍可透過記憶工具按需使用，但重設/啟動模型執行可為該第一回合前置一次性的啟動脈絡區塊，其中包含近期每日記憶。單純聊天 `/new` 與 `/reset` 指令會被確認，但不會叫用模型。啟動前置內容由 `agents.defaults.startupContext` 控制。
- 時間（UTC + 使用者時區）
- 回覆標籤 + Heartbeat 行為
- 執行階段中繼資料（主機/作業系統/模型/思考）

完整拆解請見 [系統提示詞](/zh-TW/concepts/system-prompt)。

## 脈絡視窗中會計入哪些內容

模型收到的所有內容都會計入脈絡限制：

- 系統提示詞（上方列出的所有區段）
- 對話歷史（使用者 + 助理訊息）
- 工具呼叫與工具結果
- 附件/轉錄（圖片、音訊、檔案）
- Compaction 摘要與修剪成品
- 供應商包裝或安全標頭（不可見，但仍會計入）

某些執行階段較重的表面有自己的明確上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

個別代理覆寫位於 `agents.list[].contextLimits` 下。這些旋鈕用於
有界的執行階段摘錄與注入的執行階段擁有區塊。它們與啟動限制、
啟動脈絡限制，以及 Skills 提示詞限制是分開的。

對於圖片，OpenClaw 會在供應商呼叫前縮小轉錄/工具圖片承載。
使用 `agents.defaults.imageMaxDimensionPx`（預設：`1200`）來調整：

- 較低的值通常會降低視覺 Token 使用量與承載大小。
- 較高的值會為 OCR/UI 密集的螢幕截圖保留更多視覺細節。

若要查看實用拆解（依注入檔案、工具、Skills 與系統提示詞大小），請使用 `/context list` 或 `/context detail`。請見 [脈絡](/zh-TW/concepts/context)。

## 如何查看目前 Token 使用量

在聊天中使用這些指令：

- `/status` → **含豐富表情符號的狀態卡**，顯示工作階段模型、脈絡使用量、
  上次回應的輸入/輸出 Token，以及**估計成本**（僅 API 金鑰）。
- `/usage off|tokens|full` → 將**每次回應的使用量頁尾**附加到每個回覆。
  - 依工作階段保留（儲存為 `responseUsage`）。
  - OAuth 驗證**隱藏成本**（僅 Token）。
- `/usage cost` → 從 OpenClaw 工作階段記錄顯示本機成本摘要。

其他表面：

- **TUI/Web TUI：** 支援 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 與 `openclaw channels list` 會顯示
  正規化的供應商配額視窗（`X% left`，不是每次回應成本）。
  目前使用量視窗供應商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 與 z.ai。

使用量表面會先正規化常見的供應商原生欄位別名，再顯示。
對於 OpenAI 家族 Responses 流量，這包含 `input_tokens` /
`output_tokens` 與 `prompt_tokens` / `completion_tokens`，因此傳輸特定
欄位名稱不會改變 `/status`、`/usage` 或工作階段摘要。
Gemini CLI JSON 使用量也會被正規化：回覆文字來自 `response`，且
`stats.cached` 會對應到 `cacheRead`，並在 CLI 省略明確 `stats.input` 欄位時使用
`stats.input_tokens - stats.cached`。
對於原生 OpenAI 家族 Responses 流量，WebSocket/SSE 使用量別名會以
相同方式正規化，且當 `total_tokens` 缺失或為 `0` 時，總量會退回為正規化後的輸入 + 輸出。
當目前工作階段快照稀疏時，`/status` 與 `session_status` 也可以
從最近的轉錄使用量記錄復原 Token/快取計數器與作用中的執行階段模型標籤。
既有的非零即時值仍優先於轉錄備援值，且當儲存總量缺失或較小時，
較大的提示詞導向轉錄總量可以勝出。
供應商配額視窗的使用量驗證會在可用時來自供應商特定掛鉤；
否則 OpenClaw 會退回比對來自驗證設定檔、環境或設定的 OAuth/API 金鑰認證。
助理轉錄項目會保留相同的正規化使用量形狀，包括在作用中模型已設定定價且供應商
回傳使用量中繼資料時的 `usage.cost`。這讓 `/usage cost` 與以轉錄為基礎的工作階段
狀態，即使在即時執行階段狀態消失後仍有穩定來源。

OpenClaw 會將供應商使用量計算與目前脈絡快照分開處理。供應商 `usage.total` 可包含快取輸入、
輸出，以及多次工具迴圈模型呼叫，因此對成本與遙測很有用，但可能高估
即時脈絡視窗。脈絡顯示與診斷會使用最新提示詞快照
（`promptTokens`，或在沒有提示詞快照時使用最後一次模型呼叫）作為 `context.used`。

## 成本估算（顯示時）

成本會依你的模型定價設定估算：

```
models.providers.<provider>.models[].cost
```

這些是 `input`、`output`、`cacheRead` 與
`cacheWrite` 的**每 100 萬 Token 美元價格**。如果缺少定價，OpenClaw 只會顯示 Token。OAuth Token
永遠不會顯示美元成本。

Gateway 啟動時也會對尚未有本機定價的已設定模型參照，執行選用的背景定價啟動程序。該啟動程序
會擷取遠端 OpenRouter 與 LiteLLM 定價目錄。在離線或受限網路上，設定
`models.pricing.enabled: false` 可略過這些啟動目錄擷取；明確的
`models.providers.*.models[].cost` 項目會繼續驅動本機成本估算。

## 快取 TTL 與修剪影響

供應商提示詞快取只會在快取 TTL 視窗內套用。OpenClaw 可
選擇執行**快取 TTL 修剪**：它會在快取 TTL 過期後修剪工作階段，
接著重設快取視窗，讓後續請求可重複使用新快取的脈絡，而不必重新快取完整歷史。
當工作階段閒置超過 TTL 時，這會讓快取寫入成本較低。

請在 [Gateway 設定](/zh-TW/gateway/configuration) 中設定，並在
[工作階段修剪](/zh-TW/concepts/session-pruning) 查看行為細節。

Heartbeat 可在閒置間隔之間讓快取保持**溫熱**。如果你的模型快取 TTL
是 `1h`，將 Heartbeat 間隔設在略低於該值（例如 `55m`）可避免
重新快取完整提示詞，降低快取寫入成本。

在多代理設定中，你可以保留一個共用模型設定，並使用
`agents.list[].params.cacheRetention` 依代理調整快取行為。

完整的逐項旋鈕指南請見 [提示詞快取](/zh-TW/reference/prompt-caching)。

對於 Anthropic API 定價，快取讀取明顯比輸入
Token 便宜，而快取寫入會以較高倍率計費。最新費率與 TTL 倍率請見 Anthropic 的
提示詞快取定價：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 範例：使用 Heartbeat 讓 1 小時快取保持溫熱

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

### 範例：使用個別代理快取策略的混合流量

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

`agents.list[].params` 會合併在所選模型的 `params` 之上，因此你可以
只覆寫 `cacheRetention`，並原樣繼承其他模型預設值。

### 範例：啟用 Anthropic 1M 脈絡 beta 標頭

Anthropic 的 1M 脈絡視窗目前受 beta 門控。OpenClaw 可在支援的 Opus
或 Sonnet 模型上啟用 `context1m` 時，注入所需的
`anthropic-beta` 值。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

這會對應到 Anthropic 的 `context-1m-2025-08-07` beta 標頭。

這只會在該模型項目設定 `context1m: true` 時套用。

需求：該認證必須具備長脈絡使用資格。若否，
Anthropic 會針對該請求回應供應商端的速率限制錯誤。

如果你使用 OAuth/訂閱 Token（`sk-ant-oat-*`）驗證 Anthropic，
OpenClaw 會略過 `context-1m-*` beta 標頭，因為 Anthropic 目前
會以 HTTP 401 拒絕該組合。

## 降低 Token 壓力的提示

- 使用 `/compact` 摘要長工作階段。
- 在你的工作流程中修剪大型工具輸出。
- 對螢幕截圖密集的工作階段降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 Skills 說明簡短（Skills 清單會被注入提示詞）。
- 對冗長、探索性工作優先使用較小模型。

精確的 Skills 清單負擔公式請見 [Skills](/zh-TW/tools/skills)。

## 相關

- [API 使用量與成本](/zh-TW/reference/api-usage-costs)
- [提示詞快取](/zh-TW/reference/prompt-caching)
- [使用量追蹤](/zh-TW/concepts/usage-tracking)
