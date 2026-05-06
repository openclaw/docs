---
read_when:
    - 說明權杖使用量、費用或上下文視窗
    - 偵錯上下文增長或 Compaction 行為
summary: OpenClaw 如何建構提示詞上下文並回報詞元使用量與成本
title: 詞元使用量與費用
x-i18n:
    generated_at: "2026-05-06T09:19:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51c0fc6bdfb32edc1908d0a25ddbc0e90d745ef38fede02fbeca612ca1a5f59e
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw 追蹤的是 **詞元**，不是字元。詞元依模型而異，但大多數
OpenAI 風格模型在英文文字中平均約每個詞元 4 個字元。

## 系統提示如何建立

OpenClaw 會在每次執行時組裝自己的系統提示。它包含：

- 工具清單 + 簡短描述
- Skills 清單（僅中繼資料；指示會依需求使用 `read` 載入）。
  精簡 Skills 區塊受 `skills.limits.maxSkillsPromptChars` 限制，
  並可在每個代理程式透過
  `agents.list[].skillsLimits.maxSkillsPromptChars` 選擇性覆寫。
- 自我更新指示
- 工作區 + 啟動檔案（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 在新建時，加上存在時的 `MEMORY.md`）。小寫根目錄 `memory.md` 不會注入；它是與 `MEMORY.md` 搭配時，供 `openclaw doctor --fix` 使用的舊版修復輸入。大型檔案會由 `agents.defaults.bootstrapMaxChars` 截斷（預設：12000），而總啟動注入量會受 `agents.defaults.bootstrapTotalMaxChars` 限制（預設：60000）。`memory/*.md` 每日檔案不是一般啟動提示的一部分；在一般回合中，它們仍可透過記憶體工具依需求使用，但重設/啟動模型執行可為第一個回合前置一次性的啟動情境區塊，其中包含近期每日記憶。單純聊天 `/new` 和 `/reset` 命令會在不呼叫模型的情況下被確認。啟動前導由 `agents.defaults.startupContext` 控制。
- 時間（UTC + 使用者時區）
- 回覆標籤 + Heartbeat 行為
- 執行階段中繼資料（主機/作業系統/模型/思考）

完整拆解請參閱[系統提示](/zh-TW/concepts/system-prompt)。

## 什麼會計入情境視窗

模型收到的所有內容都會計入情境限制：

- 系統提示（上方列出的所有區段）
- 對話歷史（使用者 + 助理訊息）
- 工具呼叫和工具結果
- 附件/逐字稿（圖片、音訊、檔案）
- Compaction 摘要和修剪成品
- 供應商包裝或安全標頭（不可見，但仍會計入）

某些執行階段負載較高的表面有自己的明確上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

每個代理程式的覆寫位於 `agents.list[].contextLimits` 下。這些旋鈕
用於受限的執行階段摘錄和注入的執行階段所擁有區塊。它們
與啟動限制、啟動情境限制和 Skills 提示
限制分開。

對於圖片，OpenClaw 會在供應商呼叫前縮小逐字稿/工具圖片承載。
使用 `agents.defaults.imageMaxDimensionPx`（預設：`1200`）來調整：

- 較低的值通常會減少視覺詞元用量和承載大小。
- 較高的值會為 OCR/UI 密集截圖保留更多視覺細節。

若要取得實用拆解（依注入檔案、工具、Skills 和系統提示大小），請使用 `/context list` 或 `/context detail`。請參閱[情境](/zh-TW/concepts/context)。

## 如何查看目前詞元用量

在聊天中使用這些命令：

- `/status` → **表情符號豐富的狀態卡片**，包含工作階段模型、情境用量、
  上次回應輸入/輸出詞元，以及**估計成本**（僅 API 金鑰）。
- `/usage off|tokens|full` → 將**每次回應用量頁尾**附加到每個回覆。
  - 依工作階段保存（儲存為 `responseUsage`）。
  - OAuth 驗證會**隱藏成本**（僅顯示詞元）。
- `/usage cost` → 從 OpenClaw 工作階段日誌顯示本機成本摘要。

其他表面：

- **TUI/Web TUI：** 支援 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 會顯示
  標準化的供應商配額視窗（`X% left`，不是每次回應成本）。
  目前的用量視窗供應商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

用量表面會在顯示前標準化常見的供應商原生欄位別名。
對於 OpenAI 家族 Responses 流量，這同時包含 `input_tokens` /
`output_tokens` 和 `prompt_tokens` / `completion_tokens`，因此傳輸特定的
欄位名稱不會改變 `/status`、`/usage` 或工作階段摘要。
Gemini CLI JSON 用量也會被標準化：回覆文字來自 `response`，且
`stats.cached` 會對應到 `cacheRead`，並在 CLI 省略明確 `stats.input` 欄位時使用
`stats.input_tokens - stats.cached`。
對於原生 OpenAI 家族 Responses 流量，WebSocket/SSE 用量別名會以
相同方式標準化，且當 `total_tokens` 缺失或為 `0` 時，總數會回退到標準化輸入 + 輸出。
當目前工作階段快照稀疏時，`/status` 和 `session_status` 也可以
從最近的逐字稿用量日誌復原詞元/快取計數器和作用中的執行階段模型標籤。
現有的非零即時值仍優先於逐字稿回退值，且在已儲存總數缺失或較小時，
較大的提示導向逐字稿總數可以勝出。
供應商配額視窗的用量驗證在可用時來自供應商特定鉤子；
否則 OpenClaw 會回退到從驗證設定檔、環境或設定中比對 OAuth/API 金鑰憑證。
助理逐字稿項目會保存相同的標準化用量形狀，包括
在作用中模型已設定價格且供應商回傳用量中繼資料時的 `usage.cost`。
這讓 `/usage cost` 和以逐字稿為依據的工作階段狀態，即使在即時執行階段狀態消失後，
仍有穩定來源。

OpenClaw 會將供應商用量計算與目前情境
快照分開。供應商 `usage.total` 可包含快取輸入、輸出和多次
工具迴圈模型呼叫，因此它對成本和遙測很有用，但可能高估
即時情境視窗。情境顯示和診斷會使用最新提示
快照（`promptTokens`，或沒有提示快照時的最後一次模型呼叫）作為
`context.used`。

## 成本估算（顯示時）

成本會依你的模型價格設定估算：

```
models.providers.<provider>.models[].cost
```

這些是 `input`、`output`、`cacheRead` 和
`cacheWrite` 的**每 100 萬詞元美元價格**。如果缺少價格，OpenClaw 只會顯示詞元。OAuth 權杖
絕不顯示美元成本。

在旁掛程式和通道到達 Gateway 就緒路徑後，OpenClaw 會為尚未
已有本機價格的已設定模型參照啟動
選用背景價格啟動程序。該啟動程序會擷取遠端 OpenRouter 和 LiteLLM
價格目錄。在離線或受限網路上，設定 `models.pricing.enabled: false` 可略過這些目錄
擷取；明確的
`models.providers.*.models[].cost` 項目會繼續驅動本機成本
估算。

## 快取 TTL 和修剪影響

供應商提示快取只會在快取 TTL 視窗內套用。OpenClaw 可以
選擇性執行**快取 TTL 修剪**：它會在快取 TTL
到期後修剪工作階段，然後重設快取視窗，讓後續請求可以重用
新快取的情境，而不是重新快取完整歷史。當工作階段閒置超過 TTL 時，這能降低
快取寫入成本。

請在 [Gateway 設定](/zh-TW/gateway/configuration)中設定它，並在
[工作階段修剪](/zh-TW/concepts/session-pruning)中查看行為細節。

Heartbeat 可以讓快取在閒置間隔中保持**溫熱**。如果你的模型快取 TTL
是 `1h`，將 Heartbeat 間隔設定為略低於該值（例如 `55m`）可以避免
重新快取完整提示，降低快取寫入成本。

在多代理程式設定中，你可以保留一個共享模型設定，並透過
`agents.list[].params.cacheRetention` 依代理程式調整快取行為。

完整的逐項旋鈕指南請參閱[提示快取](/zh-TW/reference/prompt-caching)。

對於 Anthropic API 價格，快取讀取明顯比輸入
詞元便宜，而快取寫入會以較高倍數計費。最新費率和 TTL 倍數請參閱 Anthropic 的
提示快取價格：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 範例：使用 Heartbeat 保持 1h 快取溫熱

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

### 範例：使用每個代理程式快取策略的混合流量

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

`agents.list[].params` 會合併到所選模型的 `params` 之上，因此你可以
只覆寫 `cacheRetention`，並繼承其他模型預設值而不變。

### 範例：啟用 Anthropic 1M 情境 beta 標頭

Anthropic 的 1M 情境視窗目前受 beta 閘控。OpenClaw 可以在支援的 Opus
或 Sonnet 模型上啟用 `context1m` 時注入
必要的 `anthropic-beta` 值。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

這會對應到 Anthropic 的 `context-1m-2025-08-07` beta 標頭。

這只會在該模型項目上設定 `context1m: true` 時套用。

需求：憑證必須符合長情境用量資格。否則，
Anthropic 會對該請求回應供應商端速率限制錯誤。

如果你使用 OAuth/訂閱權杖（`sk-ant-oat-*`）驗證 Anthropic，
OpenClaw 會略過 `context-1m-*` beta 標頭，因為 Anthropic 目前
會以 HTTP 401 拒絕該組合。

## 降低詞元壓力的提示

- 使用 `/compact` 摘要長工作階段。
- 在你的工作流程中修剪大型工具輸出。
- 對截圖密集的工作階段降低 `agents.defaults.imageMaxDimensionPx`。
- 保持技能描述簡短（技能清單會注入提示）。
- 對冗長、探索性工作偏好使用較小模型。

確切的技能清單開銷公式請參閱 [Skills](/zh-TW/tools/skills)。

## 相關

- [API 用量和成本](/zh-TW/reference/api-usage-costs)
- [提示快取](/zh-TW/reference/prompt-caching)
- [用量追蹤](/zh-TW/concepts/usage-tracking)
