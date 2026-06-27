---
read_when:
    - 說明權杖用量、成本或脈絡視窗
    - 偵錯脈絡增長或壓縮行為
summary: OpenClaw 如何建立提示上下文並回報 Token 用量與成本
title: Token 使用量與成本
x-i18n:
    generated_at: "2026-06-27T20:02:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw 追蹤的是 **token**，不是字元。Token 依模型而異，但大多數
OpenAI 風格的模型在英文文字中平均約為每個 token 4 個字元。

## 系統提示如何建構

OpenClaw 會在每次執行時組裝自己的系統提示。它包含：

- 工具清單 + 簡短說明
- Skills 清單（僅中繼資料；指示會依需要以 `read` 載入）。
  原生 Codex 回合會以回合範圍的協作開發者指示接收精簡 Skills 區塊；
  其他 harness 則會在一般提示表面中接收。它受
  `skills.limits.maxSkillsPromptChars` 限制，並可在
  `agents.list[].skillsLimits.maxSkillsPromptChars` 進行選用的個別 agent 覆寫。
- 自我更新指示
- 工作區 + bootstrap 檔案（新建時的 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`，以及存在時的 `MEMORY.md`）。當該工作區可使用記憶工具時，原生 Codex 回合不會從設定的 agent 工作區貼上原始 `MEMORY.md`；它們會在回合範圍的協作開發者指示中包含一小段記憶指標，並依需要使用記憶工具。如果工具已停用、記憶搜尋不可用，或作用中的工作區與 agent 記憶工作區不同，`MEMORY.md` 會使用一般有界回合脈絡路徑。小寫根目錄 `memory.md` 不會被注入；它是在與 `MEMORY.md` 搭配時供 `openclaw doctor --fix` 使用的舊版修復輸入。大型注入檔案會由 `agents.defaults.bootstrapMaxChars` 截斷（預設：20000），而 bootstrap 注入總量由 `agents.defaults.bootstrapTotalMaxChars` 封頂（預設：60000）。`memory/*.md` 每日檔案不是一般 bootstrap 提示的一部分；它們在普通回合中仍透過記憶工具依需要取得，但 reset/startup 模型執行可以為第一個回合前置一個一次性的 startup-context 區塊，其中包含近期每日記憶。裸聊天 `/new` 和 `/reset` 命令會在不呼叫模型的情況下被確認。啟動前置內容由 `agents.defaults.startupContext` 控制。壓縮後的 AGENTS.md 摘錄是獨立的，且需要明確以 `agents.defaults.compaction.postCompactionSections` 選擇啟用。
- 時間（UTC + 使用者時區）
- 回覆標籤 + 心跳偵測行為
- 執行階段中繼資料（主機/作業系統/模型/thinking）

請參閱 [系統提示](/zh-TW/concepts/system-prompt)中的完整拆解。

撰寫憑證或驗證片段文件時，請使用
[秘密預留位置慣例](/zh-TW/reference/secret-placeholder-conventions)，以避免僅文件變更觸發秘密掃描器誤判。

## 什麼會計入脈絡視窗

模型接收的所有內容都會計入脈絡限制：

- 系統提示（上方列出的所有區段）
- 對話歷史（使用者 + assistant 訊息）
- 工具呼叫與工具結果
- 附件/逐字稿（圖片、音訊、檔案）
- 壓縮摘要與修剪產物
- 供應商包裝或安全標頭（不可見，但仍會被計入）

某些執行階段較重的表面有自己的明確上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

個別 agent 覆寫位於 `agents.list[].contextLimits` 之下。這些旋鈕用於有界執行階段摘錄與注入的執行階段所擁有區塊。它們與 bootstrap 限制、startup-context 限制和 Skills 提示限制是分開的。

`toolResultMaxChars` 是進階上限（最高 `1000000` 個字元）。當它未設定時，OpenClaw 會從有效模型脈絡視窗選擇即時工具結果上限：低於 100K token 時為 `16000` 個字元，100K+ token 時為 `32000` 個字元，200K+ token 時為 `64000` 個字元，並且仍受執行階段脈絡占比保護限制。

對於圖片，OpenClaw 會在供應商呼叫前縮小逐字稿/工具圖片 payload。
使用 `agents.defaults.imageMaxDimensionPx`（預設：`1200`）來調整：

- 較低的值通常會降低視覺 token 使用量與 payload 大小。
- 較高的值會為 OCR/UI 密集的截圖保留更多視覺細節。

若要取得實用拆解（依注入檔案、工具、Skills 和系統提示大小），請使用 `/context list` 或 `/context detail`。請參閱[脈絡](/zh-TW/concepts/context)。

## 如何查看目前 token 使用量

在聊天中使用這些命令：

- `/status` → **含豐富 emoji 的狀態卡**，顯示工作階段模型、脈絡使用量、
  上次回應的輸入/輸出 token，以及在作用中模型已設定本機定價時的**估計成本**。
- `/usage off|tokens|full` → 將**每次回應用量頁尾**附加到每個回覆。
  - 依工作階段保存（儲存為 `responseUsage`）。
  - `/usage reset`（別名：`inherit`、`clear`、`default`）— 清除工作階段覆寫，
    讓工作階段重新繼承已設定的預設值。
  - `/usage full` 只有在 OpenClaw 具備用量中繼資料，且作用中模型有本機定價時才會顯示估計成本。否則只會顯示 token。
- `/usage cost` → 從 OpenClaw 工作階段日誌顯示本機成本摘要。

其他表面：

- **終端介面/Web 終端介面：** 支援 `/status` + `/usage`。
- **命令列介面：** `openclaw status --usage` 和 `openclaw channels list` 會顯示
  正規化的供應商配額視窗（`X% left`，不是每次回應成本）。
  目前的用量視窗供應商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

用量表面會在顯示前正規化常見的供應商原生欄位別名。
對於 OpenAI 系列 Responses 流量，這包含 `input_tokens` /
`output_tokens` 與 `prompt_tokens` / `completion_tokens`，因此傳輸特定的欄位名稱不會改變 `/status`、`/usage` 或工作階段摘要。
Gemini CLI 用量也會被正規化：預設 `stream-json` parser 會讀取
assistant `message` 事件，而 `stats.cached` 會對應到 `cacheRead`；當命令列介面省略明確的 `stats.input` 欄位時，會使用
`stats.input_tokens - stats.cached`。舊版 JSON 覆寫仍會從 `response` 讀取回覆文字。
對於原生 OpenAI 系列 Responses 流量，WebSocket/SSE 用量別名會以相同方式正規化，且在 `total_tokens` 缺失或為 `0` 時，總量會回退為正規化後的輸入 + 輸出。
當目前工作階段快照稀疏時，`/status` 和 `session_status` 也可以從最近的逐字稿用量日誌恢復 token/cache 計數器與作用中執行階段模型標籤。既有的非零即時值仍優先於逐字稿回退值，而在已儲存總量缺失或較小時，較大的 prompt-oriented 逐字稿總量可以勝出。
供應商配額視窗的用量驗證在可用時來自供應商特定 hook；否則 OpenClaw 會回退到從 auth profiles、env 或 config 比對 OAuth/API-key 憑證。
Assistant 逐字稿項目會保存相同的正規化用量形狀，包括在作用中模型已設定定價且供應商回傳用量中繼資料時的 `usage.cost`。這為 `/usage cost` 和以逐字稿支援的工作階段狀態提供穩定來源，即使即時執行階段狀態已消失也一樣。

OpenClaw 會將供應商用量計算與目前脈絡快照分開。供應商 `usage.total` 可以包含快取輸入、輸出，以及多次工具迴圈模型呼叫，因此它對成本與遙測很有用，但可能高估即時脈絡視窗。脈絡顯示與診斷會使用最新提示快照（`promptTokens`，或在沒有提示快照時使用最後一次模型呼叫）作為 `context.used`。

## 成本估算（顯示時）

成本會從你的模型定價設定估算：

```
models.providers.<provider>.models[].cost
```

這些是 `input`、`output`、`cacheRead` 和
`cacheWrite` 的**每 1M token 美元價格**。如果缺少定價，OpenClaw 只會顯示 token。成本顯示不限於 API-key 驗證：像 `aws-sdk` 這類非 API-key 供應商，只要其設定的模型項目包含本機定價，且供應商回傳用量中繼資料，也可以顯示估計成本。

在 sidecars 和 channels 到達閘道 ready 路徑後，OpenClaw 會為尚未具備本機定價的已設定模型 refs 啟動選用的背景定價 bootstrap。該 bootstrap 會擷取遠端 OpenRouter 和 LiteLLM 定價目錄。在離線或受限網路上，設定 `models.pricing.enabled: false` 可略過這些目錄擷取；明確的
`models.providers.*.models[].cost` 項目會繼續驅動本機成本估算。

## 快取 TTL 與修剪影響

供應商提示快取只會在快取 TTL 視窗內套用。OpenClaw 可選擇執行**cache-ttl 修剪**：它會在快取 TTL 過期後修剪工作階段，然後重設快取視窗，讓後續請求可以重複使用新快取的脈絡，而不是重新快取完整歷史。當工作階段閒置超過 TTL 時，這能降低快取寫入成本。

請在[閘道設定](/zh-TW/gateway/configuration)中設定，並在[工作階段修剪](/zh-TW/concepts/session-pruning)查看行為細節。

心跳偵測可以在閒置間隔中保持快取**溫熱**。如果你的模型快取 TTL 是 `1h`，將心跳偵測間隔設定為略低於該值（例如 `55m`）可以避免重新快取完整提示，降低快取寫入成本。

在多 agent 設定中，你可以保留一個共用模型設定，並使用 `agents.list[].params.cacheRetention` 依 agent 調整快取行為。

完整的逐項旋鈕指南請參閱[提示快取](/zh-TW/reference/prompt-caching)。

對於 Anthropic API 定價，快取讀取明顯比輸入 token 便宜，而快取寫入則以較高倍率計費。最新費率與 TTL 倍率請參閱 Anthropic 的提示快取定價：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 範例：透過心跳偵測保持 1h 快取溫熱

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

### 範例：使用個別 agent 快取策略的混合流量

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

`agents.list[].params` 會合併到所選模型的 `params` 之上，因此你可以只覆寫 `cacheRetention`，並原樣繼承其他模型預設值。

### Anthropic 1M 脈絡

OpenClaw 會以 Anthropic 的 1M 脈絡視窗，為具備 GA 能力的 Claude 4.x 模型設定大小，例如 Opus 4.8、Opus 4.7、Opus 4.6 和
Sonnet 4.6。這些模型不需要
`params.context1m: true`。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

較舊的設定可以保留 `context1m: true`，但 OpenClaw 不再針對此設定傳送 Anthropic 已退役的 `context-1m-2025-08-07` beta 標頭，也不會將不支援的較舊 Claude 模型擴展到 1M。

需求：該憑證必須具備長脈絡使用資格。否則，Anthropic 會對該請求回應供應商端速率限制錯誤。

如果你使用 OAuth/subscription token（`sk-ant-oat-*`）驗證 Anthropic，
OpenClaw 會保留 OAuth 所需的 Anthropic beta 標頭，同時移除舊設定中若仍存在的已退役 `context-1m-*` beta。

## 降低 token 壓力的提示

- 使用 `/compact` 來摘要長工作階段。
- 在你的工作流程中修剪大型工具輸出。
- 對截圖密集的工作階段降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 skill 說明簡短（skill 清單會被注入到提示中）。
- 對冗長、探索性的工作優先使用較小模型。

請參閱 [Skills](/zh-TW/tools/skills) 以取得精確的 skill 清單開銷公式。

## 相關

- [API 使用量與成本](/zh-TW/reference/api-usage-costs)
- [提示詞快取](/zh-TW/reference/prompt-caching)
- [使用量追蹤](/zh-TW/concepts/usage-tracking)
