---
read_when:
    - 說明 token 使用量、費用或上下文視窗
    - 偵錯上下文成長或 Compaction 行為
summary: OpenClaw 如何建構提示詞上下文並報告詞元用量與成本
title: 詞元用量與成本
x-i18n:
    generated_at: "2026-05-02T21:03:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# Token 使用量與成本

OpenClaw 追蹤的是 **Token**，不是字元。Token 依模型而異，但多數
OpenAI 風格模型在英文文字中平均約為每個 Token 4 個字元。

## 系統提示如何建立

OpenClaw 會在每次執行時組裝自己的系統提示。它包含：

- 工具清單 + 簡短描述
- Skills 清單（僅中繼資料；指示會依需求透過 `read` 載入）。
  精簡 Skills 區塊受 `skills.limits.maxSkillsPromptChars` 限制，
  並可在每個代理程式以
  `agents.list[].skillsLimits.maxSkillsPromptChars` 選擇性覆寫。
- 自我更新指示
- 工作區 + 啟動檔案（新的 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`，以及存在時的 `MEMORY.md`）。小寫根目錄 `memory.md` 不會被注入；它是與 `MEMORY.md` 搭配時供 `openclaw doctor --fix` 使用的舊版修復輸入。大型檔案會被 `agents.defaults.bootstrapMaxChars` 截斷（預設：12000），且啟動注入總量受 `agents.defaults.bootstrapTotalMaxChars` 限制（預設：60000）。`memory/*.md` 每日檔案不是一般啟動提示的一部分；在普通回合中，它們仍可透過記憶工具依需求使用，但重設/啟動模型執行可以在第一個回合前置一次性啟動情境區塊，其中包含近期每日記憶。純聊天 `/new` 和 `/reset` 命令會被確認，而不會叫用模型。啟動前奏由 `agents.defaults.startupContext` 控制。
- 時間（UTC + 使用者時區）
- 回覆標籤 + Heartbeat 行為
- 執行階段中繼資料（主機/OS/模型/thinking）

完整拆解請見 [系統提示](/zh-TW/concepts/system-prompt)。

## 情境視窗中計入哪些內容

模型收到的所有內容都會計入情境限制：

- 系統提示（上方列出的所有區段）
- 對話歷史（使用者 + 助理訊息）
- 工具呼叫與工具結果
- 附件/逐字稿（圖片、音訊、檔案）
- Compaction 摘要與剪除產物
- 供應商包裝層或安全標頭（不可見，但仍會計入）

某些執行階段負載較重的介面有自己的明確上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

每個代理程式的覆寫位於 `agents.list[].contextLimits` 之下。這些旋鈕用於有界的執行階段摘錄和由執行階段擁有的注入區塊。它們與啟動限制、啟動情境限制和 Skills 提示限制分開。

對於圖片，OpenClaw 會在供應商呼叫前縮小逐字稿/工具圖片酬載。
使用 `agents.defaults.imageMaxDimensionPx`（預設：`1200`）來調整：

- 較低的值通常會降低視覺 Token 使用量與酬載大小。
- 較高的值會為 OCR/UI 密集的螢幕截圖保留更多視覺細節。

若要取得實用拆解（每個注入檔案、工具、Skills 與系統提示大小），請使用 `/context list` 或 `/context detail`。請見 [情境](/zh-TW/concepts/context)。

## 如何查看目前的 Token 使用量

在聊天中使用這些命令：

- `/status` → **包含豐富表情符號的狀態卡**，顯示工作階段模型、情境使用量、
  上次回應的輸入/輸出 Token，以及**估計成本**（僅 API 金鑰）。
- `/usage off|tokens|full` → 將**每次回應的使用量頁尾**附加到每則回覆。
  - 每個工作階段持續有效（儲存為 `responseUsage`）。
  - OAuth 驗證**會隱藏成本**（僅顯示 Token）。
- `/usage cost` → 從 OpenClaw 工作階段記錄顯示本機成本摘要。

其他介面：

- **TUI/Web TUI：** 支援 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 會顯示
  標準化的供應商配額視窗（`X% left`，不是每次回應成本）。
  目前的使用量視窗供應商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

使用量介面會在顯示前標準化常見的供應商原生欄位別名。
對於 OpenAI 家族的 Responses 流量，這包含 `input_tokens` /
`output_tokens` 和 `prompt_tokens` / `completion_tokens`，因此傳輸特定的
欄位名稱不會改變 `/status`、`/usage` 或工作階段摘要。
Gemini CLI JSON 使用量也會被標準化：回覆文字來自 `response`，且
`stats.cached` 會對應至 `cacheRead`，並在 CLI 省略明確的 `stats.input` 欄位時使用 `stats.input_tokens - stats.cached`。
對於原生 OpenAI 家族 Responses 流量，WebSocket/SSE 使用量別名會以相同方式標準化，且當
`total_tokens` 缺失或為 `0` 時，總量會退回使用標準化輸入 + 輸出。
當目前工作階段快照稀疏時，`/status` 和 `session_status` 也可以從最近的逐字稿使用量記錄中
復原 Token/快取計數器和作用中的執行階段模型標籤。既有非零即時值仍會
優先於逐字稿後援值，而較大的提示導向逐字稿總量可在儲存總量缺失或較小時勝出。
供應商配額視窗的使用量驗證在可用時來自供應商特定鉤子；否則 OpenClaw 會退回
從驗證設定檔、環境變數或設定中比對 OAuth/API 金鑰憑證。
助理逐字稿項目會保留相同的標準化使用量形狀，包括
`usage.cost`，前提是作用中模型已設定定價，且供應商傳回使用量中繼資料。這讓 `/usage cost` 和逐字稿支援的工作階段狀態即使在即時執行階段狀態消失後，仍有穩定來源。

OpenClaw 會將供應商使用量計帳與目前情境快照分開。供應商 `usage.total` 可能包含快取輸入、輸出，以及多次工具迴圈模型呼叫，因此它對成本與遙測很有用，但可能高估即時情境視窗。情境顯示與診斷會使用最新提示快照（`promptTokens`，或在沒有提示快照時使用最後一次模型呼叫）作為 `context.used`。

## 成本估算（顯示時）

成本會根據你的模型定價設定估算：

```
models.providers.<provider>.models[].cost
```

這些是 `input`、`output`、`cacheRead` 和
`cacheWrite` 的**每 100 萬 Token 美元價格**。如果缺少定價，OpenClaw 只會顯示 Token。OAuth Token
永遠不會顯示美元成本。

在 sidecar 和通道到達 Gateway 就緒路徑後，OpenClaw 會為已設定但本機尚無定價的模型參照啟動
選用的背景定價啟動程序。該啟動程序會擷取遠端 OpenRouter 和 LiteLLM
定價目錄。將 `models.pricing.enabled: false` 設為跳過離線或受限網路上的目錄
擷取；明確的
`models.providers.*.models[].cost` 項目會繼續驅動本機成本
估算。

## 快取 TTL 與剪除影響

供應商提示快取只會在快取 TTL 視窗內套用。OpenClaw 可以
選擇性執行 **cache-ttl pruning**：它會在快取 TTL
到期後剪除工作階段，然後重設快取視窗，使後續請求可以重複使用
新快取的情境，而不是重新快取完整歷史。這會在工作階段閒置超過 TTL 時降低快取
寫入成本。

請在 [Gateway 設定](/zh-TW/gateway/configuration) 中設定，並在
[工作階段剪除](/zh-TW/concepts/session-pruning) 中查看行為細節。

Heartbeat 可以讓快取在閒置間隔中保持**溫熱**。如果你的模型快取 TTL
是 `1h`，將 Heartbeat 間隔設為略低於它（例如 `55m`）可以避免
重新快取完整提示，進而降低快取寫入成本。

在多代理程式設定中，你可以保留一個共用模型設定，並使用 `agents.list[].params.cacheRetention` 針對每個代理程式調整快取行為。

完整的逐項旋鈕指南請見 [提示快取](/zh-TW/reference/prompt-caching)。

對於 Anthropic API 定價，快取讀取明顯比輸入
Token 便宜，而快取寫入會以較高倍數計費。最新費率與 TTL 倍數請見 Anthropic 的
提示快取定價：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 範例：使用 Heartbeat 讓 1h 快取保持溫熱

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
只覆寫 `cacheRetention`，並原樣繼承其他模型預設值。

### 範例：啟用 Anthropic 1M 情境 beta 標頭

Anthropic 的 1M 情境視窗目前受 beta 管制。當你在支援的 Opus
或 Sonnet 模型上啟用 `context1m` 時，OpenClaw 可以注入
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

要求：憑證必須符合長情境使用資格。若不符合，
Anthropic 會針對該請求回應供應商端速率限制錯誤。

如果你使用 OAuth/訂閱 Token（`sk-ant-oat-*`）驗證 Anthropic，
OpenClaw 會略過 `context-1m-*` beta 標頭，因為 Anthropic 目前
會以 HTTP 401 拒絕該組合。

## 降低 Token 壓力的提示

- 使用 `/compact` 摘要長工作階段。
- 在你的工作流程中修剪大型工具輸出。
- 對螢幕截圖密集的工作階段降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 Skill 描述簡短（Skill 清單會注入提示）。
- 對冗長、探索性的工作優先使用較小模型。

精確的 Skill 清單額外負擔公式請見 [Skills](/zh-TW/tools/skills)。

## 相關

- [API 使用量與成本](/zh-TW/reference/api-usage-costs)
- [提示快取](/zh-TW/reference/prompt-caching)
- [使用量追蹤](/zh-TW/concepts/usage-tracking)
