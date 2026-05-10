---
read_when:
    - 診斷身分驗證設定檔輪替、冷卻時間或模型備援行為
    - 更新驗證設定檔或模型的容錯移轉規則
    - 了解工作階段模型覆寫如何與備援重試互動
sidebarTitle: Model failover
summary: OpenClaw 如何輪替驗證設定檔並在不同模型之間回退
title: 模型容錯移轉
x-i18n:
    generated_at: "2026-05-10T19:31:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 會分兩個階段處理失敗：

1. 在目前供應商內進行**驗證設定檔輪替**。
2. **模型備援**到 `agents.defaults.model.fallbacks` 中的下一個模型。

本文件說明執行階段規則，以及支撐這些規則的資料。

## 執行階段流程

對於一般文字執行，OpenClaw 會依照以下順序評估候選項目：

<Steps>
  <Step title="解析工作階段狀態">
    解析作用中的工作階段模型與驗證設定檔偏好。
  </Step>
  <Step title="建立候選鏈">
    從目前的模型選擇，以及該選擇來源的備援政策建立模型候選鏈。已設定的預設值、cron 工作主要模型，以及自動選取的備援模型可以使用已設定的備援；明確的使用者工作階段選擇則是嚴格的。
  </Step>
  <Step title="嘗試目前供應商">
    依照驗證設定檔輪替／冷卻規則嘗試目前供應商。
  </Step>
  <Step title="在值得切換備援的錯誤上前進">
    如果該供應商已用盡，且錯誤值得切換備援，則移到下一個模型候選項目。
  </Step>
  <Step title="保留備援覆寫">
    在重試開始前保留選定的備援覆寫，讓其他工作階段讀取者看見執行器即將使用的相同供應商／模型。保留的模型覆寫會標記為 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="失敗時窄範圍回復">
    如果備援候選項目失敗，只有在備援所擁有的工作階段覆寫欄位仍符合該失敗候選項目時，才回復那些欄位。
  </Step>
  <Step title="用盡時拋出 FallbackSummaryError">
    如果每個候選項目都失敗，拋出含有每次嘗試詳細資料的 `FallbackSummaryError`，並在已知時附上最早的冷卻到期時間。
  </Step>
</Steps>

這刻意比「儲存並還原整個工作階段」更窄。回覆執行器只保留它為備援所擁有的模型選擇欄位：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

這可防止失敗的備援重試覆寫較新的無關工作階段變更，例如在嘗試執行時發生的手動 `/model` 變更或工作階段輪替更新。

## 選擇來源政策

OpenClaw 會區分選定的供應商／模型，以及它被選定的原因。該來源會控制是否允許備援鏈：

- **已設定的預設值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **代理主要模型**：`agents.list[].model` 是嚴格的，除非該代理模型物件包含自己的 `fallbacks`。使用 `fallbacks: []` 可明確表示嚴格行為，或提供非空清單讓該代理加入模型備援。
- **自動備援覆寫**：執行階段備援會在重試前寫入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"`，以及選定的來源模型。該自動覆寫可以繼續沿著已設定的備援鏈前進，並會由 `/new`、`/reset` 和 `sessions.reset` 清除。沒有明確 `heartbeat.model` 的 Heartbeat 執行，也會在其來源不再符合目前已設定的預設值時清除直接自動覆寫。
- **使用者工作階段覆寫**：`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會寫入 `modelOverrideSource: "user"`。這是精確的工作階段選擇。如果選定的供應商／模型在產生回覆前失敗，OpenClaw 會回報失敗，而不是從無關的已設定備援回答。
- **舊版工作階段覆寫**：較舊的工作階段項目可能有 `modelOverride`，但沒有 `modelOverrideSource`。OpenClaw 會將這些視為使用者覆寫，因此明確的舊選擇不會被靜默轉換成備援行為。
- **Cron 酬載模型**：cron 工作的 `payload.model` / `--model` 是工作主要模型，不是使用者工作階段覆寫。除非工作提供 `payload.fallbacks`，否則它會使用已設定的備援；`payload.fallbacks: []` 會讓 cron 執行採用嚴格模式。

## 驗證儲存（金鑰 + OAuth）

OpenClaw 會同時對 API 金鑰與 OAuth 權杖使用**驗證設定檔**。

- 密鑰位於 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（舊版：`~/.openclaw/agent/auth-profiles.json`）。
- 執行階段驗證路由狀態位於 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 設定 `auth.profiles` / `auth.order` **只包含中繼資料 + 路由**（不含密鑰）。
- 僅供舊版匯入的 OAuth 檔案：`~/.openclaw/credentials/oauth.json`（首次使用時匯入 `auth-profiles.json`）。

更多詳細資料：[OAuth](/zh-TW/concepts/oauth)

憑證類型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（部分供應商另有 `projectId`/`enterpriseUrl`）

## 設定檔 ID

OAuth 登入會建立不同的設定檔，讓多個帳號可以共存。

- 預設：沒有可用電子郵件時為 `provider:default`。
- 有電子郵件的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

設定檔位於 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 輪替順序

當供應商有多個設定檔時，OpenClaw 會像這樣選擇順序：

<Steps>
  <Step title="明確設定">
    `auth.order[provider]`（如果已設定）。
  </Step>
  <Step title="已設定的設定檔">
    依供應商篩選後的 `auth.profiles`。
  </Step>
  <Step title="已儲存的設定檔">
    `auth-profiles.json` 中該供應商的項目。
  </Step>
</Steps>

如果未設定明確順序，OpenClaw 會使用輪詢順序：

- **主要鍵：**設定檔類型（**OAuth 優先於 API 金鑰**）。
- **次要鍵：**`usageStats.lastUsed`（每種類型內最舊的優先）。
- **冷卻／停用的設定檔**會移到最後，依最早到期時間排序。

### 工作階段黏著性（快取友善）

OpenClaw 會**依工作階段釘選選定的驗證設定檔**，以保持供應商快取熱度。它**不會**在每次請求時輪替。釘選的設定檔會重複使用，直到：

- 工作階段被重設（`/new` / `/reset`）
- Compaction 完成（Compaction 計數遞增）
- 設定檔處於冷卻／停用狀態

透過 `/model …@<profileId>` 手動選擇會為該工作階段設定**使用者覆寫**，並且在新工作階段開始前不會自動輪替。

<Note>
自動釘選的設定檔（由工作階段路由器選定）會被視為**偏好**：它們會優先嘗試，但 OpenClaw 可能會在速率限制／逾時時輪替到另一個設定檔。使用者釘選的設定檔會鎖定在該設定檔；如果它失敗且已設定模型備援，OpenClaw 會移到下一個模型，而不是切換設定檔。
</Note>

### 為什麼 OAuth 可能「看起來遺失」

如果你對同一個供應商同時有 OAuth 設定檔和 API 金鑰設定檔，除非已釘選，否則輪詢可能會在訊息之間切換它們。若要強制使用單一設定檔：

- 使用 `auth.order[provider] = ["provider:profileId"]` 釘選，或
- 透過 `/model …` 使用帶有設定檔覆寫的每工作階段覆寫（當你的 UI／聊天介面支援時）。

## 冷卻

當設定檔因驗證／速率限制錯誤而失敗（或看起來像速率限制的逾時）時，OpenClaw 會將其標記為冷卻，並移到下一個設定檔。

<AccordionGroup>
  <Accordion title="會落入速率限制／逾時分類的內容">
    該速率限制分類比單純的 `429` 更廣：它也包含供應商訊息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及週期性使用時段限制，例如 `weekly/monthly limit reached`。

    格式／無效請求錯誤通常是終止性的，因為重試相同酬載會以相同方式失敗，所以 OpenClaw 會呈現它們，而不是輪替驗證設定檔。已知的重試修復路徑可以明確加入：例如 Cloud Code Assist 工具呼叫 ID 驗證失敗會經過清理，並透過 `allowFormatRetry` 政策重試一次。OpenAI 相容的停止原因錯誤，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，會被歸類為逾時／備援切換訊號。

    當來源符合已知的暫時性模式時，通用伺服器文字也可能落入該逾時分類。例如，裸露的 pi-ai 串流包裝器訊息 `An unknown error occurred` 會被視為每個供應商都值得切換備援，因為 pi-ai 在供應商串流以 `stopReason: "aborted"` 或 `stopReason: "error"` 結束且沒有具體詳細資料時會發出它。含有暫時性伺服器文字的 JSON `api_error` 酬載，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也會被視為值得切換備援的逾時。

    OpenRouter 專屬的通用上游文字，例如裸露的 `Provider returned error`，只有在供應商脈絡實際上是 OpenRouter 時才會被視為逾時。通用內部備援文字，例如 `LLM request failed with an unknown error.`，會保持保守，本身不會觸發備援切換。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    有些供應商 SDK 可能會在將控制權交還給 OpenClaw 前，先休眠一段很長的 `Retry-After` 時窗。對於以 Stainless 為基礎的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 預設會將 SDK 內部的 `retry-after-ms` / `retry-after` 等待限制在 60 秒，並立即呈現較長的可重試回應，讓此備援切換路徑能夠執行。使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 調整或停用此上限；請參閱[重試行為](/zh-TW/concepts/retry)。
  </Accordion>
  <Accordion title="模型範圍冷卻">
    速率限制冷卻也可以限定在模型範圍內：

    - 當失敗的模型 ID 已知時，OpenClaw 會為速率限制失敗記錄 `cooldownModel`。
    - 當冷卻限定在不同模型時，同一供應商上的同級模型仍可嘗試。
    - 帳務／停用時窗仍會跨模型阻擋整個設定檔。

  </Accordion>
</AccordionGroup>

冷卻使用指數退避：

- 1 分鐘
- 5 分鐘
- 25 分鐘
- 1 小時（上限）

狀態會儲存在 `auth-state.json` 的 `usageStats` 下：

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

## 帳務停用

帳務／額度失敗（例如 "insufficient credits" / "credit balance too low"）會被視為值得切換備援，但它們通常不是暫時性的。OpenClaw 不會使用短冷卻，而是將設定檔標記為**停用**（搭配較長的退避），並輪替到下一個設定檔／供應商。

<Note>
並非每個看似帳務的回應都是 `402`，也不是每個 HTTP `402` 都落在這裡。即使供應商改回傳 `401` 或 `403`，OpenClaw 也會把明確的帳務文字保留在帳務路徑中，但供應商專屬的比對器仍限定在擁有它們的供應商範圍內（例如 OpenRouter `403 Key limit exceeded`）。

同時，當訊息看起來可重試時，暫時性的 `402` 使用時段與組織／工作區支出限制錯誤會被歸類為 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`）。這些會留在短冷卻／備援切換路徑，而不是長帳務停用路徑。
</Note>

狀態會儲存在 `auth-state.json`：

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

- 帳務退避從 **5 小時**開始，每次帳務失敗加倍，並以 **24 小時**為上限。
- 如果設定檔已有 **24 小時**未失敗，退避計數器會重設（可設定）。
- 過載重試在模型備援前允許 **1 次同供應商設定檔輪替**。
- 過載重試預設使用 **0 毫秒退避**。

## 模型備援

如果某個提供者的所有設定檔都失敗，OpenClaw 會移至 `agents.defaults.model.fallbacks` 中的下一個模型。這適用於驗證失敗、速率限制，以及已耗盡設定檔輪替的逾時（其他錯誤不會推進 fallback）。未公開足夠詳細資訊的提供者錯誤，仍會在 fallback 狀態中精確標記：`empty_response` 表示提供者未傳回可用的訊息或狀態，`no_error_details` 表示提供者明確傳回 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始預覽，但尚未有任何分類器符合它。

過載和速率限制錯誤會比計費冷卻更積極地處理。預設情況下，OpenClaw 允許一次相同提供者的驗證設定檔重試，接著會切換到下一個已設定的模型 fallback，而不會等待。像 `ModelNotReadyException` 這類提供者忙碌訊號會落入該過載類別。可透過 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 調整此行為。

當一次執行從已設定的預設主要模型、cron 作業主要模型、帶有明確 fallback 的代理主要模型，或自動選取的 fallback 覆寫開始時，OpenClaw 可以走訪相符的已設定 fallback 鏈。不帶明確 fallback 的代理主要模型，以及明確的使用者選取（例如 `/model ollama/qwen3.5:27b`、模型選擇器、`sessions.patch`，或一次性的 CLI 提供者/模型覆寫）都是嚴格的：如果該提供者/模型無法連線或在產生回覆前失敗，OpenClaw 會回報失敗，而不是從不相關的 fallback 回答。

### 候選鏈規則

OpenClaw 會從目前要求的 `provider/model` 加上已設定的 fallback 建立候選清單。

<AccordionGroup>
  <Accordion title="規則">
    - 要求的模型永遠排在第一。
    - 明確設定的 fallback 會去重，但不會依模型允許清單篩選。它們會被視為明確的操作員意圖。
    - 如果目前執行已位於同一提供者家族中的已設定 fallback，OpenClaw 會繼續使用完整的已設定鏈。
    - 如果目前執行所用的提供者與設定不同，且該目前模型尚未屬於已設定的 fallback 鏈，OpenClaw 不會附加來自另一個提供者的不相關已設定 fallback。
    - 當 fallback runner 未收到明確的 fallback 覆寫時，已設定的主要模型會附加在末尾，使該鏈能在較早候選耗盡後回到一般預設值。
    - 當呼叫端提供 `fallbacksOverride` 時，runner 會精確使用要求的模型加上該覆寫清單。空清單會停用模型 fallback，並防止已設定的主要模型被附加為隱藏的重試目標。

  </Accordion>
</AccordionGroup>

### 哪些錯誤會推進 fallback

<Tabs>
  <Tab title="會繼續處理">
    - 驗證失敗
    - 速率限制和冷卻耗盡
    - 過載/提供者忙碌錯誤
    - 逾時形式的容錯移轉錯誤
    - 計費停用
    - `LiveSessionModelSwitchError`，它會被正規化為容錯移轉路徑，因此過時的已持久化模型不會建立外層重試迴圈
    - 當仍有剩餘候選時的其他未識別錯誤

  </Tab>
  <Tab title="不會繼續處理">
    - 非逾時/容錯移轉形式的明確中止
    - 應保留在 compaction/重試邏輯內的上下文溢位錯誤（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`，或 `ollama error: context length exceeded`）
    - 沒有剩餘候選時的最終未知錯誤

  </Tab>
</Tabs>

### 冷卻略過與探測行為

當某個提供者的每個驗證設定檔都已在冷卻中時，OpenClaw 不會自動永遠略過該提供者。它會針對每個候選做出決策：

<AccordionGroup>
  <Accordion title="逐候選決策">
    - 持續性驗證失敗會立即略過整個提供者。
    - 計費停用通常會略過，但主要候選仍可依節流進行探測，因此不需重新啟動也有可能復原。
    - 主要候選可在接近冷卻到期時進行探測，並套用每個提供者的節流。
    - 當失敗看起來是暫時性的（`rate_limit`、`overloaded` 或未知）時，即使處於冷卻中，也可以嘗試相同提供者的 fallback 同層模型。當速率限制以模型為範圍，而同層模型可能仍可立即復原時，這尤其相關。
    - 暫時性冷卻探測限制為每個提供者在每次 fallback 執行中一次，因此單一提供者不會阻塞跨提供者 fallback。

  </Accordion>
</AccordionGroup>

## 工作階段覆寫和即時模型切換

工作階段模型變更是共享狀態。作用中的 runner、`/model` 命令、compaction/工作階段更新，以及即時工作階段協調，都會讀取或寫入同一個工作階段項目的部分內容。

這表示 fallback 重試必須與即時模型切換協調：

- 只有明確由使用者驅動的模型變更會標記待處理的即時切換。這包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系統驅動的模型變更，例如 fallback 輪替、heartbeat 覆寫或 compaction，本身絕不會標記待處理的即時切換。
- 使用者驅動的模型覆寫會被視為 fallback 原則的精確選取，因此無法連線的已選提供者會顯示為失敗，而不會被 `agents.defaults.model.fallbacks` 遮蔽。
- 在 fallback 重試開始前，回覆 runner 會將選取的 fallback 覆寫欄位持久化到工作階段項目。
- 自動 fallback 覆寫會在後續回合保持選取，因此 OpenClaw 不會在每則訊息都探測已知不良的主要模型。`/new`、`/reset` 和 `sessions.reset` 會清除自動來源的覆寫，並將工作階段回復為已設定的預設值。
- `/status` 會顯示選取的模型，且當 fallback 狀態不同時，會顯示作用中的 fallback 模型與原因。
- 即時工作階段協調會優先使用已持久化的工作階段覆寫，而不是過時的執行階段模型欄位。
- 如果即時切換錯誤指向作用中 fallback 鏈中的較後候選，OpenClaw 會直接跳至該已選模型，而不是先走訪不相關的候選。
- 如果 fallback 嘗試失敗，runner 只會回復它寫入的覆寫欄位，且只有在那些欄位仍與該失敗候選相符時才會回復。

這可防止典型競態：

<Steps>
  <Step title="主要模型失敗">
    選取的主要模型失敗。
  </Step>
  <Step title="在記憶體中選擇 fallback">
    在記憶體中選擇 fallback 候選。
  </Step>
  <Step title="工作階段儲存仍顯示舊主要模型">
    工作階段儲存仍反映舊主要模型。
  </Step>
  <Step title="即時協調讀取過時狀態">
    即時工作階段協調讀取過時的工作階段狀態。
  </Step>
  <Step title="重試被拉回">
    重試在 fallback 嘗試開始前被拉回舊模型。
  </Step>
</Steps>

已持久化的 fallback 覆寫會關閉該時間窗口，而狹窄的回復會保留較新的手動或執行階段工作階段變更。

## 可觀測性與失敗摘要

`runWithModelFallback(...)` 會記錄每次嘗試的詳細資料，供日誌和面向使用者的冷卻訊息使用：

- 嘗試的提供者/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`，以及類似的容錯移轉原因）
- 選用的狀態/代碼
- 人類可讀的錯誤摘要

結構化 `model_fallback_decision` 日誌在候選失敗、被略過，或較後的 fallback 成功時，也會包含扁平的 `fallbackStep*` 欄位。這些欄位會明確呈現嘗試的轉換（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），因此即使終端 fallback 也失敗，日誌和診斷匯出器仍可重建主要失敗。

當每個候選都失敗時，OpenClaw 會擲出 `FallbackSummaryError`。外層回覆 runner 可使用它建立更具體的訊息，例如「所有模型都暫時受到速率限制」，並在已知時包含最早的冷卻到期時間。

該冷卻摘要具備模型感知能力：

- 不相關的模型範圍速率限制會針對嘗試的提供者/模型鏈被忽略
- 如果剩餘阻塞是相符的模型範圍速率限制，OpenClaw 會回報仍阻塞該模型的最後一個相符到期時間

## 相關設定

請參閱 [Gateway 設定](/zh-TW/gateway/configuration) 了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

請參閱 [模型](/zh-TW/concepts/models) 了解更廣泛的模型選取和 fallback 概觀。
