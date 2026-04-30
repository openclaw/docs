---
read_when:
    - 診斷驗證設定檔輪替、冷卻時間或模型備援行為
    - 更新身分驗證設定檔或模型的容錯移轉規則
    - 了解工作階段模型覆寫如何與備援重試互動
sidebarTitle: Model failover
summary: OpenClaw 如何輪替驗證設定檔並在模型之間備援切換
title: 模型容錯移轉
x-i18n:
    generated_at: "2026-04-30T03:00:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 分兩個階段處理失敗：

1. 在目前提供者內進行**驗證設定檔輪替**。
2. **模型備援**到 `agents.defaults.model.fallbacks` 中的下一個模型。

這份文件說明執行階段規則，以及支撐這些規則的資料。

## 執行階段流程

對於一般文字執行，OpenClaw 會依照以下順序評估候選項：

<Steps>
  <Step title="解析工作階段狀態">
    解析作用中的工作階段模型與驗證設定檔偏好。
  </Step>
  <Step title="建立候選鏈">
    依據目前的模型選取，以及該選取來源的備援政策，建立模型候選鏈。已設定的預設值、Cron 工作主要模型，以及自動選取的備援模型，可以使用已設定的備援；明確的使用者工作階段選取則是嚴格的。
  </Step>
  <Step title="嘗試目前提供者">
    使用驗證設定檔輪替/冷卻規則嘗試目前提供者。
  </Step>
  <Step title="遇到可觸發容錯移轉的錯誤時前進">
    如果該提供者因可觸發容錯移轉的錯誤而耗盡，則移至下一個模型候選項。
  </Step>
  <Step title="持久化備援覆寫">
    在重試開始前持久化選定的備援覆寫，讓其他工作階段讀取者看到執行器即將使用的相同提供者/模型。持久化的模型覆寫會標記為 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="失敗時精準回復">
    如果備援候選項失敗，僅在備援所擁有的工作階段覆寫欄位仍與該失敗候選項相符時，回復這些欄位。
  </Step>
  <Step title="耗盡時拋出 FallbackSummaryError">
    如果每個候選項都失敗，則拋出包含每次嘗試詳細資訊的 `FallbackSummaryError`，並在已知時包含最早的冷卻到期時間。
  </Step>
</Steps>

這刻意比「儲存並還原整個工作階段」更窄。回覆執行器只會持久化它為備援所擁有的模型選取欄位：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

這可避免失敗的備援重試覆寫較新的無關工作階段變更，例如手動 `/model` 變更，或在嘗試執行期間發生的工作階段輪替更新。

## 選取來源政策

OpenClaw 會區分選定的提供者/模型，以及其被選取的原因。該來源會控制是否允許備援鏈：

- **已設定的預設值**：`agents.defaults.model.primary` 會使用 `agents.defaults.model.fallbacks`。
- **代理主要模型**：`agents.list[].model` 是嚴格的，除非該代理模型物件包含自己的 `fallbacks`。使用 `fallbacks: []` 可明確指定嚴格行為，或提供非空清單讓該代理選擇加入模型備援。
- **自動備援覆寫**：執行階段備援會在重試前寫入 `providerOverride`、`modelOverride` 和 `modelOverrideSource: "auto"`。該自動覆寫可以繼續沿著已設定的備援鏈前進，並由 `/new`、`/reset` 和 `sessions.reset` 清除。
- **使用者工作階段覆寫**：`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會寫入 `modelOverrideSource: "user"`。這是精確的工作階段選取。如果選定的提供者/模型在產生回覆前失敗，OpenClaw 會回報失敗，而不是從無關的已設定備援回答。
- **舊版工作階段覆寫**：較舊的工作階段項目可能有 `modelOverride`，但沒有 `modelOverrideSource`。OpenClaw 會將這些視為使用者覆寫，因此明確的舊選取不會被默默轉換成備援行為。
- **Cron 承載模型**：Cron 工作的 `payload.model` / `--model` 是工作主要模型，不是使用者工作階段覆寫。除非該工作提供 `payload.fallbacks`，否則會使用已設定的備援；`payload.fallbacks: []` 會讓 Cron 執行採用嚴格模式。

## 驗證儲存（金鑰 + OAuth）

OpenClaw 會針對 API 金鑰和 OAuth 權杖使用**驗證設定檔**。

- 機密存放在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（舊版：`~/.openclaw/agent/auth-profiles.json`）。
- 執行階段驗證路由狀態存放在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 設定 `auth.profiles` / `auth.order` **僅為中繼資料 + 路由**（不含機密）。
- 舊版僅匯入 OAuth 檔案：`~/.openclaw/credentials/oauth.json`（首次使用時匯入至 `auth-profiles.json`）。

更多細節：[OAuth](/zh-TW/concepts/oauth)

認證類型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（部分提供者另有 `projectId`/`enterpriseUrl`）

## 設定檔 ID

OAuth 登入會建立不同的設定檔，讓多個帳號可以共存。

- 預設：沒有可用電子郵件時為 `provider:default`。
- 有電子郵件的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

設定檔位於 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 底下。

## 輪替順序

當某個提供者有多個設定檔時，OpenClaw 會依照以下方式選擇順序：

<Steps>
  <Step title="明確設定">
    `auth.order[provider]`（如果已設定）。
  </Step>
  <Step title="已設定的設定檔">
    依提供者篩選的 `auth.profiles`。
  </Step>
  <Step title="已儲存的設定檔">
    `auth-profiles.json` 中該提供者的項目。
  </Step>
</Steps>

如果沒有設定明確順序，OpenClaw 會使用循環順序：

- **主要鍵：**設定檔類型（**OAuth 優先於 API 金鑰**）。
- **次要鍵：**`usageStats.lastUsed`（各類型內最舊的優先）。
- **冷卻/停用的設定檔**會移至最後，並依最早到期時間排序。

### 工作階段黏著性（快取友善）

OpenClaw 會**將選定的驗證設定檔固定到每個工作階段**，以保持提供者快取熱度。它**不會**在每次請求時輪替。固定的設定檔會重複使用，直到：

- 工作階段被重設（`/new` / `/reset`）
- Compaction 完成（Compaction 計數增加）
- 設定檔處於冷卻/停用狀態

透過 `/model …@<profileId>` 手動選取會為該工作階段設定**使用者覆寫**，在新工作階段開始前不會自動輪替。

<Note>
自動固定的設定檔（由工作階段路由器選取）會被視為**偏好**：會先嘗試它們，但 OpenClaw 可能會在速率限制/逾時時輪替到其他設定檔。使用者固定的設定檔會鎖定在該設定檔；如果它失敗且已設定模型備援，OpenClaw 會移至下一個模型，而不是切換設定檔。
</Note>

### 為什麼 OAuth 可能「看起來遺失」

如果同一個提供者同時有 OAuth 設定檔和 API 金鑰設定檔，除非已固定，否則循環可能會在不同訊息間切換它們。若要強制使用單一設定檔：

- 使用 `auth.order[provider] = ["provider:profileId"]` 固定，或
- 透過 `/model …` 搭配設定檔覆寫使用每個工作階段覆寫（當你的 UI/聊天介面支援時）。

## 冷卻

當設定檔因驗證/速率限制錯誤（或看起來像速率限制的逾時）而失敗時，OpenClaw 會將它標記為冷卻，並移至下一個設定檔。

<AccordionGroup>
  <Accordion title="會落入速率限制 / 逾時分類的內容">
    該速率限制分類比單純的 `429` 更廣：它也包含提供者訊息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及週期性使用量視窗限制，例如 `weekly/monthly limit reached`。

    格式/無效請求錯誤（例如 Cloud Code Assist 工具呼叫 ID 驗證失敗）會被視為可觸發容錯移轉，並使用相同冷卻。OpenAI 相容的停止原因錯誤，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，會分類為逾時/容錯移轉訊號。

    當來源符合已知暫時性模式時，一般伺服器文字也可能落入該逾時分類。例如，裸露的 pi-ai 串流包裝器訊息 `An unknown error occurred` 會對每個提供者視為可觸發容錯移轉，因為 pi-ai 在提供者串流以 `stopReason: "aborted"` 或 `stopReason: "error"` 結束且沒有具體細節時會發出它。含有暫時性伺服器文字的 JSON `api_error` 承載，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也會被視為可觸發容錯移轉的逾時。

    OpenRouter 專屬的一般上游文字，例如裸露的 `Provider returned error`，只有在提供者脈絡實際上是 OpenRouter 時才會被視為逾時。一般內部備援文字，例如 `LLM request failed with an unknown error.`，會保持保守，本身不會觸發容錯移轉。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    某些提供者 SDK 可能會在將控制權交還給 OpenClaw 前，為很長的 `Retry-After` 視窗進入睡眠。對於 Anthropic 和 OpenAI 等以 Stainless 為基礎的 SDK，OpenClaw 預設會將 SDK 內部的 `retry-after-ms` / `retry-after` 等待限制在 60 秒，並立即浮現更長的可重試回應，讓此容錯移轉路徑可以執行。使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 調整或停用上限；請參閱[重試行為](/zh-TW/concepts/retry)。
  </Accordion>
  <Accordion title="模型範圍冷卻">
    速率限制冷卻也可以限定在模型範圍內：

    - 當失敗的模型 ID 已知時，OpenClaw 會為速率限制失敗記錄 `cooldownModel`。
    - 當冷卻限定在不同模型時，同一提供者上的同層模型仍可被嘗試。
    - 帳單/停用視窗仍會跨模型封鎖整個設定檔。

  </Accordion>
</AccordionGroup>

冷卻使用指數退避：

- 1 分鐘
- 5 分鐘
- 25 分鐘
- 1 小時（上限）

狀態會儲存在 `auth-state.json` 的 `usageStats` 底下：

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

帳單/點數失敗（例如「點數不足」/「點數餘額過低」）會被視為可觸發容錯移轉，但通常不是暫時性的。OpenClaw 不會使用短冷卻，而是將設定檔標記為**停用**（搭配較長退避），並輪替到下一個設定檔/提供者。

<Note>
不是每個看起來像帳單的回應都是 `402`，也不是每個 HTTP `402` 都會落在這裡。即使提供者改回傳 `401` 或 `403`，OpenClaw 仍會將明確的帳單文字保留在帳單路徑中，但提供者專屬比對器仍限定在擁有它們的提供者範圍內（例如 OpenRouter `403 Key limit exceeded`）。

同時，當訊息看起來可重試時，暫時性 `402` 使用量視窗與組織/工作區花費限制錯誤會被分類為 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow`，或 `organization spending limit exceeded`）。這些會留在短冷卻/容錯移轉路徑，而不是長帳單停用路徑。
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

- 帳單退避從 **5 小時**開始，並在每次帳單失敗後加倍，上限為 **24 小時**。
- 如果設定檔已 **24 小時**沒有失敗，退避計數器會重設（可設定）。
- 過載重試允許在模型備援前進行 **1 次同提供者設定檔輪替**。
- 過載重試預設使用 **0 毫秒退避**。

## 模型備援

如果某個提供者的所有設定檔都失敗，OpenClaw 會移至 `agents.defaults.model.fallbacks` 中的下一個模型。這適用於已耗盡設定檔輪替的驗證失敗、速率限制和逾時（其他錯誤不會推進備援）。未暴露足夠細節的提供者錯誤，仍會在備援狀態中被精確標記：`empty_response` 表示提供者未回傳可用訊息或狀態，`no_error_details` 表示提供者明確回傳 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始預覽，但尚無分類器符合它。

過載與速率限制錯誤會比帳單冷卻更積極地處理。預設情況下，OpenClaw 允許一次相同提供者的驗證設定檔重試，然後不等待就切換到下一個已設定的模型備援。像 `ModelNotReadyException` 這類提供者忙碌訊號會落在該過載類別中。可使用 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 調整此行為。

當執行從已設定的預設主要模型、cron 工作主要模型、具有明確備援的代理主要模型，或自動選取的備援覆寫開始時，OpenClaw 可以沿著相符的已設定備援鏈前進。沒有明確備援的代理主要模型，以及明確的使用者選擇（例如 `/model ollama/qwen3.5:27b`、模型選擇器、`sessions.patch`，或一次性的 CLI 提供者/模型覆寫）都是嚴格的：如果該提供者/模型無法連線，或在產生回覆前失敗，OpenClaw 會回報失敗，而不是從不相關的備援回答。

### 候選鏈規則

OpenClaw 會從目前要求的 `provider/model` 加上已設定的備援建立候選清單。

<AccordionGroup>
  <Accordion title="規則">
    - 要求的模型永遠排第一。
    - 明確設定的備援會去重，但不會依模型允許清單過濾。它們會被視為明確的操作員意圖。
    - 如果目前執行已在同一提供者家族中的已設定備援上，OpenClaw 會繼續使用完整的已設定鏈。
    - 如果目前執行位於與設定不同的提供者，且目前模型尚未是已設定備援鏈的一部分，OpenClaw 不會附加來自其他提供者的不相關已設定備援。
    - 當沒有向備援執行器提供明確的備援覆寫時，已設定的主要模型會附加在最後，讓鏈在前面的候選耗盡後能回到正常預設。
    - 當呼叫端提供 `fallbacksOverride` 時，執行器會精確使用要求的模型加上該覆寫清單。空清單會停用模型備援，並防止已設定的主要模型被附加為隱藏重試目標。

  </Accordion>
</AccordionGroup>

### 哪些錯誤會推進備援

<Tabs>
  <Tab title="會繼續">
    - 驗證失敗
    - 速率限制與冷卻耗盡
    - 過載/提供者忙碌錯誤
    - 形似逾時的容錯移轉錯誤
    - 帳單停用
    - `LiveSessionModelSwitchError`，它會被正規化為容錯移轉路徑，避免過期的持久化模型建立外層重試迴圈
    - 當仍有剩餘候選時的其他無法識別錯誤

  </Tab>
  <Tab title="不會繼續">
    - 非逾時/容錯移轉形態的明確中止
    - 應保留在 Compaction/重試邏輯內的內容溢出錯誤（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`，或 `ollama error: context length exceeded`）
    - 沒有候選剩餘時的最終未知錯誤

  </Tab>
</Tabs>

### 冷卻略過與探測行為

當某個提供者的每個驗證設定檔都已處於冷卻中時，OpenClaw 不會自動永遠略過該提供者。它會針對每個候選做出決策：

<AccordionGroup>
  <Accordion title="逐候選決策">
    - 持續性驗證失敗會立即略過整個提供者。
    - 帳單停用通常會略過，但主要候選仍可在節流下被探測，讓恢復可在不重新啟動的情況下發生。
    - 主要候選可能會在接近冷卻到期時被探測，並套用每個提供者的節流。
    - 當失敗看起來是暫時性（`rate_limit`、`overloaded` 或未知）時，即使處於冷卻中，也可以嘗試相同提供者的備援同層模型。當速率限制是模型範圍，而同層模型可能仍可立即恢復時，這尤其相關。
    - 暫時性冷卻探測限制為每個提供者在每次備援執行中一次，避免單一提供者拖延跨提供者備援。

  </Accordion>
</AccordionGroup>

## 工作階段覆寫與即時模型切換

工作階段模型變更是共享狀態。作用中的執行器、`/model` 命令、Compaction/工作階段更新，以及即時工作階段協調，都會讀取或寫入同一個工作階段項目的一部分。

這表示備援重試必須與即時模型切換協調：

- 只有明確由使用者驅動的模型變更會標記待處理的即時切換。這包含 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系統驅動的模型變更，例如備援輪替、Heartbeat 覆寫或 Compaction，本身絕不會標記待處理的即時切換。
- 使用者驅動的模型覆寫會被視為備援政策的精確選擇，因此無法連線的已選提供者會浮現為失敗，而不是被 `agents.defaults.model.fallbacks` 掩蓋。
- 在備援重試開始前，回覆執行器會將選取的備援覆寫欄位持久化到工作階段項目。
- 自動備援覆寫會在後續回合保持選取狀態，讓 OpenClaw 不會在每則訊息都探測已知故障的主要模型。`/new`、`/reset` 和 `sessions.reset` 會清除自動來源的覆寫，並將工作階段返回已設定的預設值。
- `/status` 會顯示選取的模型，且當備援狀態不同時，顯示作用中的備援模型與原因。
- 即時工作階段協調會優先使用持久化的工作階段覆寫，而不是過期的執行階段模型欄位。
- 如果即時切換錯誤指向作用中備援鏈中的較後候選，OpenClaw 會直接跳到該選取模型，而不是先走訪不相關候選。
- 如果備援嘗試失敗，執行器只會回復它寫入的覆寫欄位，而且只有當它們仍符合該失敗候選時才會回復。

這可防止典型競態：

<Steps>
  <Step title="主要模型失敗">
    選取的主要模型失敗。
  </Step>
  <Step title="在記憶體中選擇備援">
    在記憶體中選擇備援候選。
  </Step>
  <Step title="工作階段儲存仍顯示舊主要模型">
    工作階段儲存仍反映舊主要模型。
  </Step>
  <Step title="即時協調讀取過期狀態">
    即時工作階段協調讀取過期的工作階段狀態。
  </Step>
  <Step title="重試被拉回">
    在備援嘗試開始前，重試被拉回舊模型。
  </Step>
</Steps>

持久化的備援覆寫會關閉這個時間窗，而狹窄的回復會保留較新的手動或執行階段工作階段變更。

## 可觀測性與失敗摘要

`runWithModelFallback(...)` 會記錄每次嘗試的詳細資料，以供日誌和面向使用者的冷卻訊息使用：

- 已嘗試的提供者/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`，以及類似的容錯移轉原因）
- 選用的狀態/代碼
- 人類可讀的錯誤摘要

結構化 `model_fallback_decision` 日誌也會在候選失敗、被略過或較後備援成功時包含扁平的 `fallbackStep*` 欄位。這些欄位會明確呈現嘗試的轉換（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），讓日誌與診斷匯出器即使在終端備援也失敗時，仍能重建主要失敗。

當每個候選都失敗時，OpenClaw 會拋出 `FallbackSummaryError`。外層回覆執行器可以使用它來建立更具體的訊息，例如「所有模型都暫時受到速率限制」，並在已知時包含最早的冷卻到期時間。

該冷卻摘要具備模型感知能力：

- 對已嘗試的提供者/模型鏈而言不相關的模型範圍速率限制會被忽略
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

請參閱[模型](/zh-TW/concepts/models)，了解更廣泛的模型選擇與備援概觀。
