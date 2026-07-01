---
read_when:
    - 說明權杖使用量、成本或上下文視窗
    - 除錯上下文增長或壓縮行為
summary: OpenClaw 如何建構提示詞上下文並回報權杖用量與成本
title: 權杖使用量與費用
x-i18n:
    generated_at: "2026-07-01T18:07:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw 追蹤的是**權杖**，不是字元。權杖會因模型而異，但大多數
OpenAI 風格模型在英文文字中平均約每個權杖 4 個字元。

## 系統提示如何建構

OpenClaw 會在每次執行時組裝自己的系統提示。其中包含：

- 工具清單 + 簡短說明
- Skills 清單（僅中繼資料；指示會依需求透過 `read` 載入）。
  原生 Codex 回合會收到精簡 Skills 區塊，作為回合範圍的
  協作開發者指示；其他執行框架會在一般
  提示表面收到它。它受 `skills.limits.maxSkillsPromptChars` 限制，
  並可在 `agents.list[].skillsLimits.maxSkillsPromptChars` 設定選用的每個代理覆寫。
- 自我更新指示
- 工作區 + 啟動檔案（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`（新增時），以及存在時的 `MEMORY.md`）。當該工作區可用記憶工具時，原生 Codex 回合不會從設定的代理工作區貼上原始 `MEMORY.md`；它們會在回合範圍的協作開發者指示中包含一個小型記憶指標，並依需求使用記憶工具。如果工具停用、記憶搜尋不可用，或作用中工作區不同於代理記憶工作區，`MEMORY.md` 會使用一般的有界回合上下文路徑。小寫根目錄 `memory.md` 不會被注入；當它與 `MEMORY.md` 配對時，是 `openclaw doctor --fix` 的舊版修復輸入。大型注入檔案會由 `agents.defaults.bootstrapMaxChars` 截斷（預設：20000），且啟動注入總量由 `agents.defaults.bootstrapTotalMaxChars` 設上限（預設：60000）。`memory/*.md` 每日檔案不是一般啟動提示的一部分；它們在一般回合中仍可透過記憶工具依需求取得，但重設/啟動模型執行可為第一個回合前置一次性的啟動上下文區塊，其中包含近期每日記憶。純聊天 `/new` 與 `/reset` 指令會在不叫用模型的情況下確認。啟動前奏由 `agents.defaults.startupContext` 控制。壓縮後的 AGENTS.md 摘錄是分開的，且需要明確選擇加入 `agents.defaults.compaction.postCompactionSections`。
- 時間（UTC + 使用者時區）
- 回覆標籤 + 心跳偵測行為
- 執行階段中繼資料（主機/作業系統/模型/思考）

完整拆解請參閱[系統提示](/zh-TW/concepts/system-prompt)。

記錄憑證或驗證片段時，請使用
[祕密預留位置慣例](/zh-TW/reference/secret-placeholder-conventions)，以
避免僅文件變更中出現祕密掃描器誤判。

## 上下文視窗中計入哪些內容

模型收到的所有內容都會計入上下文限制：

- 系統提示（上述所有區段）
- 對話歷史（使用者 + 助理訊息）
- 工具呼叫與工具結果
- 附件/逐字稿（圖片、音訊、檔案）
- 壓縮摘要與修剪產物
- 供應商包裝器或安全標頭（不可見，但仍會計入）

某些執行階段負載較重的表面有自己的明確上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

每個代理的覆寫位於 `agents.list[].contextLimits` 下。這些旋鈕
用於有界執行階段摘錄與執行階段擁有的注入區塊。它們
獨立於啟動限制、啟動上下文限制與 Skills 提示
限制。

`toolResultMaxChars` 是進階上限（最高 `1000000` 個字元）。未設定時，OpenClaw 會從有效模型上下文視窗選擇
即時工具結果上限：低於 100K 權杖時為 `16000` 字元，
100K+ 權杖時為 `32000` 字元，200K+ 權杖時為 `64000` 字元，
且仍受執行階段上下文占比防護限制。

對於圖片，OpenClaw 會在供應商呼叫前縮小逐字稿/工具圖片承載。
使用 `agents.defaults.imageMaxDimensionPx`（預設：`1200`）調整：

- 較低的值通常會降低視覺權杖用量與承載大小。
- 較高的值會保留更多視覺細節，適合 OCR/UI 密集的螢幕截圖。

若要取得實用拆解（依注入檔案、工具、Skills 與系統提示大小），請使用 `/context list` 或 `/context detail`。請參閱[上下文](/zh-TW/concepts/context)。

## 如何查看目前權杖用量

在聊天中使用這些指令：

- `/status` → **表情符號豐富的狀態卡**，包含工作階段模型、上下文用量、
  上次回應的輸入/輸出權杖，以及在作用中模型已設定本機價格時的**預估成本**。
- `/usage off|tokens|full` → 將**每次回應的用量頁尾**附加到每則回覆。
  - 每個工作階段持久保存（儲存為 `responseUsage`）。
  - `/usage reset`（別名：`inherit`、`clear`、`default`）— 清除工作階段
    覆寫，讓工作階段重新繼承設定的預設值。
  - `/usage tokens` 顯示回合權杖/快取詳細資料。
  - `/usage full` 顯示精簡模型/上下文/成本詳細資料；只有在 OpenClaw 具備作用中模型的用量中繼資料與本機價格時，
    才會顯示預估成本。
    自訂 `messages.usageTemplate` 版面可包含權杖/快取欄位。
- `/usage cost` → 從 OpenClaw 工作階段記錄顯示本機成本摘要。

其他表面：

- **終端介面/Web 終端介面：**支援 `/status` + `/usage`。
- **命令列介面：**`openclaw status --usage` 與 `openclaw channels list` 顯示
  正規化的供應商配額視窗（`X% left`，不是每次回應成本）。
  目前的用量視窗供應商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 與 z.ai。

用量表面會在顯示前正規化常見的供應商原生欄位別名。
對於 OpenAI 系列 Responses 流量，這包含 `input_tokens` /
`output_tokens` 與 `prompt_tokens` / `completion_tokens`，因此傳輸特定的
欄位名稱不會改變 `/status`、`/usage` 或工作階段摘要。
Gemini CLI 用量也會正規化：預設的 `stream-json` 剖析器會讀取
助理 `message` 事件，而 `stats.cached` 會對應至 `cacheRead`，並在
命令列介面省略明確的 `stats.input` 欄位時使用
`stats.input_tokens - stats.cached`。舊版 JSON 覆寫仍會從
`response` 讀取回覆文字。
對於原生 OpenAI 系列 Responses 流量，WebSocket/SSE 用量別名會
以相同方式正規化，且當 `total_tokens` 遺失或為 `0` 時，
總量會回退為正規化輸入 + 輸出。
當目前工作階段快照稀疏時，`/status` 與 `session_status` 也能
從最近的逐字稿用量記錄復原權杖/快取計數器與作用中執行階段模型標籤。
現有的非零即時值仍優先於逐字稿回退值，而當儲存總量遺失或較小時，
較大的提示導向逐字稿總量可以勝出。
供應商配額視窗的用量驗證在可用時來自供應商特定鉤子；
否則 OpenClaw 會回退為從驗證設定檔、環境或設定中
比對 OAuth/API 金鑰憑證。
助理逐字稿項目會持久保存相同的正規化用量形狀，包括
當作用中模型已設定價格且供應商回傳用量中繼資料時的
`usage.cost`。這讓 `/usage cost` 與逐字稿支援的工作階段
狀態即使在即時執行階段狀態消失後，仍有穩定來源。

OpenClaw 會將供應商用量計算與目前上下文快照分開。
供應商 `usage.total` 可包含快取輸入、輸出，以及多次
工具迴圈模型呼叫，因此它對成本與遙測很有用，但可能高估
即時上下文視窗。上下文顯示與診斷會使用最新提示
快照（`promptTokens`，或在沒有提示快照時使用最後一次模型呼叫）
作為 `context.used`。

## 成本估算（顯示時）

成本會從你的模型價格設定估算：

```
models.providers.<provider>.models[].cost
```

這些是 `input`、`output`、`cacheRead` 與
`cacheWrite` 的**每 1M 權杖美元價格**。如果缺少價格，`/usage full` 會省略成本；當你需要在每則
回覆中顯示權杖/快取詳細資料時，請使用 `/usage tokens`
或自訂 `messages.usageTemplate`。成本顯示不限於 API 金鑰驗證：非 API 金鑰供應商（例如
`aws-sdk`）在其設定的模型項目包含
本機價格且供應商回傳用量中繼資料時，也可顯示預估成本。

在 sidecar 與頻道到達閘道就緒路徑後，OpenClaw 會為尚未
具備本機價格的已設定模型參照啟動選用的背景價格啟動程序。
該啟動程序會擷取遠端 OpenRouter 與 LiteLLM 價格目錄。
在離線或受限網路上，將 `models.pricing.enabled: false` 設定為略過這些目錄
擷取；明確的
`models.providers.*.models[].cost` 項目會繼續驅動本機成本
估算。

## 快取 TTL 與修剪影響

供應商提示快取只適用於快取 TTL 視窗內。OpenClaw 可
選擇性執行**快取 TTL 修剪**：它會在快取 TTL
過期後修剪工作階段，然後重設快取視窗，讓後續請求可重複使用
新快取的上下文，而不是重新快取完整歷史。這會在工作階段閒置超過 TTL 時，
讓快取寫入成本維持較低。

在[閘道設定](/zh-TW/gateway/configuration)中設定，並在
[工作階段修剪](/zh-TW/concepts/session-pruning)中查看
行為詳細資料。

心跳偵測可在閒置間隔中保持快取**溫熱**。如果你的模型快取 TTL
是 `1h`，將心跳偵測間隔設定為略低於該值（例如 `55m`）可避免
重新快取完整提示，降低快取寫入成本。

在多代理設定中，你可以保留一個共用模型設定，並使用
`agents.list[].params.cacheRetention` 依代理調整快取行為。

如需完整逐項旋鈕指南，請參閱[提示快取](/zh-TW/reference/prompt-caching)。

關於 Anthropic API 價格，快取讀取明顯比輸入
權杖便宜，而快取寫入會以較高倍數計費。最新費率與 TTL 倍數請參閱 Anthropic 的
提示快取價格：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 範例：用心跳偵測保持 1h 快取溫熱

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

### 範例：使用每代理快取策略的混合流量

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

### Anthropic 1M 上下文

OpenClaw 會將具備 GA 能力的 Claude 4.x 模型（例如 Opus 4.8、Opus 4.7、Opus 4.6 與
Sonnet 4.6）設定為 Anthropic 的 1M 上下文視窗。這些模型不需要
`params.context1m: true`。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

較舊的設定可以保留 `context1m: true`，但 OpenClaw 不再針對此設定傳送
Anthropic 已退役的 `context-1m-2025-08-07` beta 標頭，也
不會將不支援的較舊 Claude 模型擴展至 1M。

需求：憑證必須符合長上下文用量資格。若否，
Anthropic 會針對該請求回應供應商端速率限制錯誤。

如果你使用 OAuth/訂閱權杖（`sk-ant-oat-*`）驗證 Anthropic，
OpenClaw 會保留 OAuth 所需的 Anthropic beta 標頭，同時移除
較舊設定中仍存在的已退役 `context-1m-*` beta。

## 降低權杖壓力的提示

- 使用 `/compact` 來摘要冗長的工作階段。
- 在工作流程中修剪大型工具輸出。
- 對截圖密集的工作階段降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 skill 描述簡短（skill 清單會注入到提示中）。
- 對冗長、探索性的工作偏好使用較小的模型。

請參閱 [Skills](/zh-TW/tools/skills) 以了解精確的 skill 清單開銷公式。

## 相關

- [API 使用量與費用](/zh-TW/reference/api-usage-costs)
- [提示快取](/zh-TW/reference/prompt-caching)
- [使用量追蹤](/zh-TW/concepts/usage-tracking)
