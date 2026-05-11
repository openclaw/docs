---
read_when:
    - 診斷驗證設定檔輪替、冷卻期或模型備援行為
    - 更新驗證設定檔或模型的容錯移轉規則
    - 了解工作階段模型覆寫如何與備援重試相互作用
sidebarTitle: Model failover
summary: OpenClaw 如何輪替驗證設定檔並在模型之間備援
title: 模型容錯移轉
x-i18n:
    generated_at: "2026-05-11T20:27:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 分兩個階段處理失敗：

1. 在目前提供者內進行**驗證設定檔輪替**。
2. **模型備援**到 `agents.defaults.model.fallbacks` 中的下一個模型。

本文件說明執行階段規則，以及支撐這些規則的資料。

## 執行階段流程

對於一般文字執行，OpenClaw 會依以下順序評估候選項：

<Steps>
  <Step title="Resolve session state">
    解析作用中工作階段模型與驗證設定檔偏好。
  </Step>
  <Step title="Build candidate chain">
    從目前模型選擇，以及該選擇來源的備援政策建立模型候選鏈。已設定的預設值、Cron 作業主要模型，以及自動選取的備援模型可以使用已設定的備援；明確的使用者工作階段選擇則為嚴格模式。
  </Step>
  <Step title="Try the current provider">
    使用驗證設定檔輪替/冷卻規則嘗試目前提供者。
  </Step>
  <Step title="Advance on failover-worthy errors">
    如果該提供者因值得切換的錯誤而耗盡，移至下一個模型候選項。
  </Step>
  <Step title="Persist fallback override">
    在重試開始前持久化所選備援覆寫，讓其他工作階段讀取者看到執行器即將使用的相同提供者/模型。持久化的模型覆寫會標記為 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="Roll back narrowly on failure">
    如果備援候選項失敗，僅在仍符合該失敗候選項時，回復由備援擁有的工作階段覆寫欄位。
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    如果每個候選項都失敗，擲出包含每次嘗試詳細資訊，以及已知時最早冷卻到期時間的 `FallbackSummaryError`。
  </Step>
</Steps>

這刻意比「儲存並還原整個工作階段」更窄。回覆執行器只會持久化其為備援所擁有的模型選擇欄位：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

這可防止失敗的備援重試覆寫較新的無關工作階段變更，例如嘗試執行期間發生的手動 `/model` 變更或工作階段輪替更新。

## 選擇來源政策

OpenClaw 會區分所選的提供者/模型，以及它為何被選取。該來源控制是否允許備援鏈：

- **已設定的預設值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **代理主要模型**：`agents.list[].model` 預設為嚴格模式，除非該代理模型物件包含自己的 `fallbacks`。使用 `fallbacks: []` 可明確表示嚴格行為，或提供非空清單讓該代理加入模型備援。
- **自動備援覆寫**：執行階段備援會在重試前寫入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"`，以及所選的來源模型。該自動覆寫可以繼續沿著已設定的備援鏈前進，並會由 `/new`、`/reset` 和 `sessions.reset` 清除。沒有明確 `heartbeat.model` 的 Heartbeat 執行，在其來源不再符合目前已設定預設值時，也會清除直接的自動覆寫。
- **使用者工作階段覆寫**：`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會寫入 `modelOverrideSource: "user"`。這是精確的工作階段選擇。如果所選提供者/模型在產生回覆前失敗，OpenClaw 會回報失敗，而不是從不相關的已設定備援回答。
- **舊版工作階段覆寫**：較舊的工作階段項目可能有 `modelOverride`，但沒有 `modelOverrideSource`。OpenClaw 會將這些視為使用者覆寫，因此明確的舊選擇不會被靜默轉換成備援行為。
- **Cron 酬載模型**：Cron 作業的 `payload.model` / `--model` 是作業主要模型，不是使用者工作階段覆寫。除非作業提供 `payload.fallbacks`，否則會使用已設定的備援；`payload.fallbacks: []` 會讓 Cron 執行使用嚴格模式。

## 驗證儲存（金鑰 + OAuth）

OpenClaw 對 API 金鑰與 OAuth 權杖都使用**驗證設定檔**。

- 秘密存放在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（舊版：`~/.openclaw/agent/auth-profiles.json`）。
- 執行階段驗證路由狀態存放在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 設定 `auth.profiles` / `auth.order` 只包含**中繼資料 + 路由**（沒有秘密）。
- 舊版僅匯入 OAuth 檔案：`~/.openclaw/credentials/oauth.json`（首次使用時匯入 `auth-profiles.json`）。

更多詳細資訊：[OAuth](/zh-TW/concepts/oauth)

憑證類型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供者另有 `projectId`/`enterpriseUrl`）

## 設定檔 ID

OAuth 登入會建立不同的設定檔，讓多個帳戶可以共存。

- 預設：沒有可用電子郵件時為 `provider:default`。
- 含電子郵件的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

設定檔存放在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 底下。

## 輪替順序

當提供者有多個設定檔時，OpenClaw 會這樣選擇順序：

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]`（如果已設定）。
  </Step>
  <Step title="Configured profiles">
    依提供者篩選的 `auth.profiles`。
  </Step>
  <Step title="Stored profiles">
    該提供者在 `auth-profiles.json` 中的項目。
  </Step>
</Steps>

如果沒有設定明確順序，OpenClaw 會使用循環順序：

- **主要鍵：**設定檔類型（**OAuth 優先於 API 金鑰**）。
- **次要鍵：**`usageStats.lastUsed`（每種類型內最舊優先）。
- **冷卻/停用的設定檔**會移至最後，並依最早到期時間排序。

### 工作階段黏著性（快取友善）

OpenClaw 會**將所選驗證設定檔固定到每個工作階段**，以保持提供者快取熱度。它**不會**在每個請求輪替。固定的設定檔會重複使用，直到：

- 工作階段被重設（`/new` / `/reset`）
- Compaction 完成（Compaction 計數增加）
- 設定檔處於冷卻/停用狀態

透過 `/model …@<profileId>` 手動選擇會為該工作階段設定**使用者覆寫**，並且在新工作階段開始前不會自動輪替。

<Note>
自動固定的設定檔（由工作階段路由器選取）會被視為**偏好**：會先嘗試它們，但 OpenClaw 可能會在速率限制/逾時時輪替到其他設定檔。當原始設定檔再次可用時，新的執行可以再次偏好它，而不改變所選模型或執行階段。使用者固定的設定檔會鎖定在該設定檔；如果它失敗且已設定模型備援，OpenClaw 會移至下一個模型，而不是切換設定檔。
</Note>

### OpenAI Codex 訂閱加 API 金鑰備援

對 OpenAI 代理模型而言，驗證與執行階段是分開的。`openai/gpt-*` 會留在
Codex harness 上，而驗證可以在 Codex 訂閱設定檔與
OpenAI API 金鑰備援之間輪替。

使用 `auth.order.openai` 設定面向使用者的順序：

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

現有的 Codex 訂閱設定檔可能仍使用舊版
`openai-codex:*` 設定檔 ID。排序後的 API 金鑰備援可以是一般
`openai:*` API 金鑰設定檔。當訂閱達到 Codex 使用限制時，
OpenClaw 會在 Codex 提供確切重設時間時記錄它，嘗試下一個
已排序的驗證設定檔，並讓執行保持在 Codex harness 內。重設
時間過後，訂閱設定檔會再次符合資格，下一次自動
選擇可以回到它。

只有在你想為該工作階段強制使用單一帳戶/金鑰時，才使用使用者固定的設定檔。使用者固定的設定檔刻意採用嚴格模式，不會靜默跳到其他設定檔。

## 冷卻

當設定檔因驗證/速率限制錯誤（或看起來像速率限制的逾時）而失敗時，OpenClaw 會將其標記為冷卻，並移至下一個設定檔。

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    該速率限制區塊比單純的 `429` 更廣：它也包含提供者訊息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及週期性使用視窗限制，例如 `weekly/monthly limit reached`。

    格式/無效請求錯誤通常是終止性的，因為重試相同酬載會以相同方式失敗，因此 OpenClaw 會顯示它們，而不是輪替驗證設定檔。已知的重試修復路徑可以明確加入：例如 Cloud Code Assist 工具呼叫 ID 驗證失敗會被清理，並透過 `allowFormatRetry` 政策重試一次。OpenAI 相容的停止原因錯誤，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，會分類為逾時/切換訊號。

    當來源符合已知暫時性模式時，一般伺服器文字也可能落入該逾時區塊。例如，裸露的 pi-ai 串流包裝器訊息 `An unknown error occurred` 會被視為對每個提供者都值得切換，因為 pi-ai 會在提供者串流以 `stopReason: "aborted"` 或 `stopReason: "error"` 結束且沒有具體詳細資訊時發出它。帶有暫時性伺服器文字的 JSON `api_error` 酬載，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也會被視為值得切換的逾時。

    OpenRouter 特定的一般上游文字，例如裸露的 `Provider returned error`，只有在提供者內容實際上是 OpenRouter 時才會被視為逾時。一般內部備援文字，例如 `LLM request failed with an unknown error.`，會保持保守，本身不會觸發切換。

  </Accordion>
  <Accordion title="SDK retry-after caps">
    某些提供者 SDK 否則可能會在長時間的 `Retry-After` 視窗中休眠，才將控制權交還給 OpenClaw。對 Anthropic 和 OpenAI 等 Stainless 型 SDK，OpenClaw 預設會將 SDK 內部的 `retry-after-ms` / `retry-after` 等待限制在 60 秒，並立即顯示更長的可重試回應，讓這條切換路徑可以執行。使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 調整或停用此限制；請參閱[重試行為](/zh-TW/concepts/retry)。
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    速率限制冷卻也可以限定於模型範圍：

    - 當已知失敗模型 ID 時，OpenClaw 會為速率限制失敗記錄 `cooldownModel`。
    - 當冷卻限定於不同模型時，仍可嘗試同一提供者上的同層模型。
    - 帳單/停用視窗仍會跨模型封鎖整個設定檔。

  </Accordion>
</AccordionGroup>

冷卻使用指數退避：

- 1 分鐘
- 5 分鐘
- 25 分鐘
- 1 小時（上限）

狀態存放在 `auth-state.json` 的 `usageStats` 底下：

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## 帳單停用

帳單/額度失敗（例如「額度不足」/「餘額太低」）會被視為值得切換，但通常不是暫時性的。OpenClaw 不會設定短暫冷卻，而是將該設定檔標記為**停用**（帶有較長的退避），並輪替到下一個設定檔/提供者。

<Note>
不是每個類似帳單的回應都是 `402`，也不是每個 HTTP `402` 都會落在這裡。即使提供者改回傳 `401` 或 `403`，OpenClaw 仍會將明確的帳單文字保留在帳單路徑中，但提供者特定的比對器會維持限定於擁有它們的提供者（例如 OpenRouter `403 Key limit exceeded`）。

同時，臨時的 `402` 使用量視窗與組織/工作區支出限制錯誤，會在訊息看起來可重試時歸類為 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow`，或 `organization spending limit exceeded`）。這些會停留在短冷卻/failover 路徑，而不是長時間計費停用路徑。
</Note>

狀態儲存在 `auth-state.json`：

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

預設值：

- 計費退避從 **5 小時**開始，每次計費失敗後加倍，並以 **24 小時**為上限。
- 如果設定檔已 **24 小時**沒有失敗，退避計數器會重設（可設定）。
- 過載重試允許在模型 fallback 前進行 **1 次同提供者設定檔輪替**。
- 過載重試預設使用 **0 ms 退避**。

## 模型 fallback

如果某個提供者的所有設定檔都失敗，OpenClaw 會移至 `agents.defaults.model.fallbacks` 中的下一個模型。這適用於驗證失敗、速率限制，以及已耗盡設定檔輪替的逾時（其他錯誤不會推進 fallback）。未公開足夠詳細資訊的提供者錯誤，仍會在 fallback 狀態中精確標示：`empty_response` 表示提供者沒有傳回可用訊息或狀態，`no_error_details` 表示提供者明確傳回 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始預覽，但尚未有分類器符合它。

過載與速率限制錯誤會比計費冷卻更積極處理。預設情況下，OpenClaw 允許一次同提供者驗證設定檔重試，然後不等待就切換到下一個已設定的模型 fallback。像 `ModelNotReadyException` 這類提供者忙碌訊號會落入該過載類別。可透過 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 調整此行為。

當執行從已設定的預設主要模型、Cron 工作主要模型、帶有明確 fallback 的代理主要模型，或自動選取的 fallback 覆寫開始時，OpenClaw 可以沿著相符的已設定 fallback 鏈前進。沒有明確 fallback 的代理主要模型，以及明確的使用者選擇（例如 `/model ollama/qwen3.5:27b`、模型選擇器、`sessions.patch`，或一次性的 CLI 提供者/模型覆寫）都是嚴格的：如果該提供者/模型無法連線，或在產生回覆前失敗，OpenClaw 會回報失敗，而不是從不相關的 fallback 回答。

### 候選鏈規則

OpenClaw 會從目前要求的 `provider/model` 加上已設定的 fallback 建立候選清單。

<AccordionGroup>
  <Accordion title="規則">
    - 要求的模型一律排第一。
    - 明確設定的 fallback 會去重，但不會依模型允許清單篩選。它們會被視為明確的操作員意圖。
    - 如果目前執行已位於同一提供者家族中的已設定 fallback，OpenClaw 會繼續使用完整的已設定鏈。
    - 未提供明確 fallback 覆寫時，即使要求的模型使用不同提供者，也會先嘗試已設定的 fallback，再嘗試已設定的主要模型。
    - 未向 fallback 執行器提供明確 fallback 覆寫時，已設定的主要模型會附加在結尾，讓鏈在較早候選耗盡後可以回到一般預設值。
    - 當呼叫端提供 `fallbacksOverride` 時，執行器會精確使用要求的模型加上該覆寫清單。空清單會停用模型 fallback，並防止已設定的主要模型被附加為隱藏重試目標。

  </Accordion>
</AccordionGroup>

### 哪些錯誤會推進 fallback

<Tabs>
  <Tab title="會繼續">
    - 驗證失敗
    - 速率限制與冷卻耗盡
    - 過載/提供者忙碌錯誤
    - 逾時形態的 failover 錯誤
    - 計費停用
    - `LiveSessionModelSwitchError`，會被正規化到 failover 路徑，讓過期的持久化模型不會建立外層重試迴圈
    - 仍有剩餘候選時的其他未識別錯誤

  </Tab>
  <Tab title="不會繼續">
    - 非逾時/failover 形態的明確中止
    - 應留在 Compaction/重試邏輯內的內容溢出錯誤（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`，或 `ollama error: context length exceeded`）
    - 沒有剩餘候選時的最終未知錯誤

  </Tab>
</Tabs>

### 冷卻略過與探測行為

當某個提供者的每個驗證設定檔都已在冷卻中時，OpenClaw 不會自動永遠略過該提供者。它會做出逐候選決策：

<AccordionGroup>
  <Accordion title="逐候選決策">
    - 持續性驗證失敗會立即略過整個提供者。
    - 計費停用通常會略過，但主要候選仍可在節流下被探測，以便不重新啟動也能恢復。
    - 主要候選可在接近冷卻到期時探測，並套用逐提供者節流。
    - 當失敗看起來是暫時性的（`rate_limit`、`overloaded` 或未知）時，即使處於冷卻中，也可以嘗試同提供者 fallback 兄弟模型。當速率限制以模型為範圍，而兄弟模型可能仍可立即恢復時，這特別相關。
    - 暫時性冷卻探測限制為每個提供者在每次 fallback 執行中一次，避免單一提供者阻塞跨提供者 fallback。

  </Accordion>
</AccordionGroup>

## 工作階段覆寫與即時模型切換

工作階段模型變更是共享狀態。作用中的執行器、`/model` 命令、Compaction/工作階段更新，以及即時工作階段協調，都會讀取或寫入同一個工作階段項目的部分內容。

這表示 fallback 重試必須與即時模型切換協調：

- 只有明確由使用者驅動的模型變更會標記待處理的即時切換。這包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系統驅動的模型變更，例如 fallback 輪替、Heartbeat 覆寫或 Compaction，本身永遠不會標記待處理的即時切換。
- 使用者驅動的模型覆寫會被視為 fallback 原則的精確選擇，因此無法連線的已選取提供者會顯示為失敗，而不是被 `agents.defaults.model.fallbacks` 遮蔽。
- 在 fallback 重試開始前，回覆執行器會將選取的 fallback 覆寫欄位持久化到工作階段項目。
- 自動 fallback 覆寫會在後續回合維持選取狀態，因此 OpenClaw 不會在每則訊息都探測已知故障的主要模型。`/new`、`/reset` 和 `sessions.reset` 會清除自動來源的覆寫，並將工作階段返回已設定的預設值。
- `/status` 會顯示選取的模型，且當 fallback 狀態不同時，也會顯示作用中的 fallback 模型與原因。
- 即時工作階段協調會優先採用持久化的工作階段覆寫，而不是過期的執行階段模型欄位。
- 如果即時切換錯誤指向作用中 fallback 鏈中的後續候選，OpenClaw 會直接跳到該選取模型，而不是先走訪不相關的候選。
- 如果 fallback 嘗試失敗，執行器只會回復它寫入的覆寫欄位，且只有在那些欄位仍符合該失敗候選時才會回復。

這會防止典型競爭狀況：

<Steps>
  <Step title="主要模型失敗">
    選取的主要模型失敗。
  </Step>
  <Step title="在記憶體中選擇 fallback">
    fallback 候選在記憶體中被選取。
  </Step>
  <Step title="工作階段儲存區仍顯示舊主要模型">
    工作階段儲存區仍反映舊主要模型。
  </Step>
  <Step title="即時協調讀取過期狀態">
    即時工作階段協調讀取過期的工作階段狀態。
  </Step>
  <Step title="重試被拉回">
    重試在 fallback 嘗試開始前被拉回舊模型。
  </Step>
</Steps>

持久化的 fallback 覆寫會關閉該時間窗，而窄範圍回復會保持較新的手動或執行階段工作階段變更完整。

## 可觀測性與失敗摘要

`runWithModelFallback(...)` 會記錄每次嘗試的詳細資訊，以供記錄檔與面向使用者的冷卻訊息使用：

- 嘗試的提供者/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 與類似的 failover 原因）
- 選用狀態/代碼
- 人類可讀的錯誤摘要

結構化的 `model_fallback_decision` 記錄也會在候選失敗、被略過，或後續 fallback 成功時包含扁平的 `fallbackStep*` 欄位。這些欄位會明確表示已嘗試的轉換（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），讓記錄與診斷匯出器即使在終端 fallback 也失敗時，仍可重建主要模型失敗。

當每個候選都失敗時，OpenClaw 會拋出 `FallbackSummaryError`。外層回覆執行器可用它建立更具體的訊息，例如「所有模型都暫時受到速率限制」，並在已知時包含最早的冷卻到期時間。

該冷卻摘要具備模型感知能力：

- 與嘗試的提供者/模型鏈不相關的模型範圍速率限制會被忽略
- 如果剩餘阻擋是相符的模型範圍速率限制，OpenClaw 會回報仍阻擋該模型的最後相符到期時間

## 相關設定

請參閱 [Gateway 設定](/zh-TW/gateway/configuration)：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

如需更廣泛的模型選擇與 fallback 概覽，請參閱 [模型](/zh-TW/concepts/models)。
