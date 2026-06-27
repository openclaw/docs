---
read_when:
    - 診斷 auth profile 輪換、冷卻或模型 fallback 行為
    - 更新驗證設定檔或模型的容錯移轉規則
    - 了解工作階段模型覆寫如何與備援重試互動
sidebarTitle: Model failover
summary: OpenClaw 如何輪替驗證設定檔並在模型之間回退
title: 模型容錯移轉
x-i18n:
    generated_at: "2026-06-27T19:12:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 會分兩個階段處理失敗：

1. 目前提供者內的**驗證設定檔輪替**。
2. **模型備援**至 `agents.defaults.model.fallbacks` 中的下一個模型。

本文件說明執行階段規則，以及支撐這些規則的資料。

## 執行階段流程

對於一般文字執行，OpenClaw 會依此順序評估候選項目：

<Steps>
  <Step title="解析工作階段狀態">
    解析作用中的工作階段模型與驗證設定檔偏好。
  </Step>
  <Step title="建立候選鏈">
    從目前的模型選擇，以及該選擇來源的備援政策建立模型候選鏈。已設定的預設值、排程工作主要模型，以及自動選取的備援模型可以使用已設定的備援；明確的使用者工作階段選擇則是嚴格的。
  </Step>
  <Step title="嘗試目前提供者">
    使用驗證設定檔輪替/冷卻規則嘗試目前提供者。
  </Step>
  <Step title="在值得故障轉移的錯誤上前進">
    如果該提供者因值得故障轉移的錯誤而耗盡，則移至下一個模型候選項目。
  </Step>
  <Step title="保存備援覆寫">
    在重試開始前保存所選的備援覆寫，讓其他工作階段讀取者看到執行器即將使用的相同提供者/模型。保存的模型覆寫會標記為 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="失敗時窄幅回復">
    如果備援候選項目失敗，只有在備援擁有的工作階段覆寫欄位仍符合該失敗候選項目時，才回復那些欄位。
  </Step>
  <Step title="耗盡時擲出 FallbackSummaryError">
    如果每個候選項目都失敗，則擲出含有各次嘗試詳細資訊的 `FallbackSummaryError`，並在已知時包含最早的冷卻到期時間。
  </Step>
</Steps>

這刻意比「儲存並還原整個工作階段」更窄。回覆執行器只會保存它為備援所擁有的模型選擇欄位：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

這可防止失敗的備援重試覆寫較新的無關工作階段變更，例如嘗試執行期間發生的手動 `/model` 變更或工作階段輪替更新。

## 選擇來源政策

OpenClaw 會區分所選的提供者/模型，以及它被選取的原因。該來源會控制是否允許使用備援鏈：

- **已設定的預設值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **代理主要模型**：`agents.list[].model` 是嚴格的，除非該代理模型物件包含自己的 `fallbacks`。使用 `fallbacks: []` 可明確表示嚴格行為，或提供非空清單讓該代理加入模型備援。
- **自動備援覆寫**：執行階段備援會在重試前寫入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"`，以及所選的來源模型。該自動覆寫可以繼續沿著已設定的備援鏈前進，而不必在每則訊息都探測主要模型，但 OpenClaw 會定期再次探測已設定的來源，並在它復原時清除自動覆寫。`/new`、`/reset` 和 `sessions.reset` 也會清除自動來源的覆寫。沒有明確 `heartbeat.model` 的心跳偵測執行，會在其來源不再符合目前已設定的預設值時清除直接的自動覆寫。
- **使用者工作階段覆寫**：`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會寫入 `modelOverrideSource: "user"`。這是精確的工作階段選擇。如果所選的提供者/模型在產生回覆前失敗，OpenClaw 會回報失敗，而不是從無關的已設定備援回答。
- **舊版工作階段覆寫**：較舊的工作階段項目可能有 `modelOverride`，但沒有 `modelOverrideSource`。OpenClaw 會將它們視為使用者覆寫，因此明確的舊選擇不會被靜默轉換為備援行為。
- **排程承載模型**：排程工作 `payload.model` / `--model` 是工作主要模型，不是使用者工作階段覆寫。它會使用已設定的備援，除非該工作提供 `payload.fallbacks`；`payload.fallbacks: []` 會讓排程執行保持嚴格。

自動備援的主要模型探測間隔是五分鐘，且不可設定。OpenClaw 會依工作階段和主要模型記住最近探測，因此失敗的主要模型不會在每個回合都重試。當工作階段移至備援時，OpenClaw 會傳送可見通知；當它返回所選的主要模型時，也會再傳送另一則通知；它不會在每個黏著備援回合重複通知。

## 驗證失敗跳過快取

預設情況下，每個新回合都會保留既有的備援重試行為：OpenClaw
會再次嘗試每個已設定的備援候選項目，包括最近因 `auth` 或
`auth_permanent` 失敗的非主要候選項目。

偏好抑制這些重複驗證失敗的操作員可以用以下方式選擇加入：

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

啟用後，OpenClaw 會在非主要備援候選項目發生驗證類失敗後，記錄一個記憶體內、以工作階段為範圍的跳過標記。該標記以工作階段 ID、提供者和模型為鍵。主要候選項目永遠不會被跳過，因此明確的使用者模型選擇仍會呈現真實的驗證錯誤。快取是程序本機的，並會在閘道重新啟動時清除。

該值是以毫秒為單位的 TTL。`0` 或未設定值會停用快取。正值會被限制在 1 秒到 10 分鐘之間。

## 使用者可見的備援通知

當工作階段移至自動選取的備援時，OpenClaw 會在相同回覆表面傳送狀態通知：

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

當稍後的探測成功且工作階段返回所選的主要模型時，OpenClaw 會傳送：

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

這些通知是操作性訊息，不是助理內容。它們會在每次狀態變更時傳遞一次，包括可行時僅有副作用的回合，但黏著備援回合不會重複傳送。傳遞會略過一般的來源回覆抑制，通知不會消耗執行緒式頻道的第一個助理回覆槽，且會排除於文字轉語音和承諾擷取之外。

## 驗證儲存（金鑰 + OAuth）

OpenClaw 對 API 金鑰和 OAuth 權杖都使用**驗證設定檔**。

- 秘密和執行階段驗證路由狀態位於 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。
- 設定 `auth.profiles` / `auth.order` **僅為中繼資料 + 路由**（不含秘密）。
- 舊版僅匯入 OAuth 檔案：`~/.openclaw/credentials/oauth.json`（首次使用時匯入每個代理的驗證儲存）。
- 舊版 `auth-profiles.json`、`auth-state.json` 和每個代理的 `auth.json` 檔案會由 `openclaw doctor --fix` 匯入。

更多詳細資訊：[OAuth](/zh-TW/concepts/oauth)

憑證類型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供者另有 `projectId`/`enterpriseUrl`）

## 設定檔 ID

OAuth 登入會建立不同的設定檔，讓多個帳號可以共存。

- 預設：沒有電子郵件可用時為 `provider:default`。
- 有電子郵件的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

設定檔位於每個代理的 `openclaw-agent.sqlite` 驗證設定檔儲存中。

## 輪替順序

當提供者有多個設定檔時，OpenClaw 會像這樣選擇順序：

<Steps>
  <Step title="明確設定">
    `auth.order[provider]`（如果已設定）。
  </Step>
  <Step title="已設定的設定檔">
    依提供者篩選的 `auth.profiles`。
  </Step>
  <Step title="已儲存的設定檔">
    該提供者的每個代理 SQLite 驗證設定檔項目。
  </Step>
</Steps>

如果未設定明確順序，OpenClaw 會使用輪詢順序：

- **主要鍵：**設定檔類型（**OAuth 優先於 API 金鑰**）。
- **次要鍵：**`usageStats.lastUsed`（每種類型內最舊者優先）。
- **冷卻/停用的設定檔**會移至最後，並依最早到期時間排序。

### 工作階段黏著性（快取友善）

OpenClaw 會**依工作階段釘選所選的驗證設定檔**，以保持提供者快取暖機。它**不會**在每個請求都輪替。釘選的設定檔會重複使用，直到：

- 工作階段被重設（`/new` / `/reset`）
- 壓縮完成（壓縮計數遞增）
- 設定檔處於冷卻/停用狀態

透過 `/model …@<profileId>` 手動選擇，會為該工作階段設定**使用者覆寫**，且在新工作階段開始前不會自動輪替。

<Note>
自動釘選的設定檔（由工作階段路由器選取）會被視為**偏好**：它們會先被嘗試，但 OpenClaw 可能會在速率限制/逾時時輪替至另一個設定檔。當原始設定檔再次可用時，新的執行可以再次偏好它，而不改變所選的模型或執行階段。使用者釘選的設定檔會鎖定在該設定檔；如果它失敗且已設定模型備援，OpenClaw 會移至下一個模型，而不是切換設定檔。
</Note>

### OpenAI Codex 訂閱加上 API 金鑰備份

對於 OpenAI 代理模型，驗證和執行階段是分開的。`openai/gpt-*` 會留在
Codex 執行架構上，而驗證可以在 Codex 訂閱設定檔和
OpenAI API 金鑰備份之間輪替。

使用 `auth.order.openai` 設定使用者可見的順序：

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

對 ChatGPT/Codex OAuth 設定檔和 OpenAI API 金鑰
設定檔都使用 `openai:*`。當訂閱達到 Codex 使用限制時，
OpenClaw 會在 Codex 提供重設時間時記錄確切時間，嘗試下一個
已排序的驗證設定檔，並讓該執行保持在 Codex 執行架構內。重設
時間過後，訂閱設定檔會再次符合資格，下一次自動
選擇就可以返回該設定檔。

只有在你想為該工作階段強制使用某個帳號/金鑰時，才使用使用者釘選設定檔。使用者釘選設定檔刻意保持嚴格，不會靜默跳至另一個設定檔。

## 冷卻

當設定檔因驗證/速率限制錯誤（或看起來像速率限制的逾時）而失敗時，OpenClaw 會將它標記為冷卻，並移至下一個設定檔。

<AccordionGroup>
  <Accordion title="會落入速率限制 / 逾時分組的內容">
    該速率限制分組比單純的 `429` 更廣：它也包含提供者訊息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及週期性使用視窗限制，例如 `weekly/monthly limit reached`。

    格式/無效請求錯誤通常是終止性的，因為重試相同承載會以相同方式失敗，所以 OpenClaw 會呈現這些錯誤，而不是輪替驗證設定檔。已知的重試修復路徑可以明確選擇加入：例如 Cloud Code Assist 工具呼叫 ID 驗證失敗會被清理，並透過 `allowFormatRetry` 政策重試一次。OpenAI 相容的停止原因錯誤，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，會被分類為逾時/故障轉移訊號。

    當來源符合已知的暫時性模式時，一般伺服器文字也可能落入該逾時分組。例如，裸模型執行階段串流包裝器訊息 `An unknown error occurred` 會對每個提供者都被視為值得故障轉移，因為共享模型執行階段會在提供者串流以 `stopReason: "aborted"` 或 `stopReason: "error"` 結束且沒有具體詳細資訊時發出它。帶有暫時性伺服器文字的 JSON `api_error` 承載，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也會被視為值得故障轉移的逾時。

    OpenRouter 專屬的一般上游文字，例如裸露的 `Provider returned error`，只有在提供者脈絡實際上是 OpenRouter 時才會被視為逾時。一般內部備援文字，例如 `LLM request failed with an unknown error.`，會保持保守，且本身不會觸發故障轉移。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    否則，有些提供者 SDK 可能會先等待一段很長的 `Retry-After` 時間窗，才把控制權交還給 OpenClaw。對 Anthropic 和 OpenAI 這類以 Stainless 為基礎的 SDK，OpenClaw 預設會將 SDK 內部的 `retry-after-ms` / `retry-after` 等待上限設為 60 秒，並立即浮現更長的可重試回應，讓這條容錯移轉路徑能夠執行。可用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 調整或停用此上限；請參閱[重試行為](/zh-TW/concepts/retry)。
  </Accordion>
  <Accordion title="模型範圍冷卻">
    速率限制冷卻也可以限定在模型範圍：

    - 當失敗的模型 ID 已知時，OpenClaw 會針對速率限制失敗記錄 `cooldownModel`。
    - 如果冷卻限定在不同模型，同一提供者上的同層模型仍可嘗試。
    - 帳單/停用時間窗仍會跨模型封鎖整個設定檔。

  </Accordion>
</AccordionGroup>

冷卻使用指數退避：

- 1 分鐘
- 5 分鐘
- 25 分鐘
- 1 小時（上限）

狀態會儲存在每個代理程式的 SQLite 驗證狀態中的 `usageStats` 下：

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

帳單/額度失敗（例如「額度不足」/「信用餘額過低」）會被視為值得容錯移轉，但通常不是暫時性的。OpenClaw 不會使用短冷卻，而是將設定檔標記為**已停用**（搭配較長的退避），並輪換到下一個設定檔/提供者。

<Note>
不是每個看起來像帳單的回應都是 `402`，也不是每個 HTTP `402` 都會落到這裡。即使提供者改回傳 `401` 或 `403`，OpenClaw 仍會將明確的帳單文字保留在帳單路徑中，但提供者專屬的比對器仍會限定在擁有它們的提供者範圍內（例如 OpenRouter `403 Key limit exceeded`）。

同時，暫時性的 `402` 使用時間窗，以及組織/工作區支出限制錯誤，若訊息看起來可重試（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow`，或 `organization spending limit exceeded`），會被分類為 `rate_limit`。這些會留在短冷卻/容錯移轉路徑，而不是長帳單停用路徑。
</Note>

狀態會儲存在每個代理程式的 SQLite 驗證狀態中：

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

- 帳單退避從 **5 小時**開始，每次帳單失敗後加倍，並以 **24 小時**為上限。
- 如果設定檔已經 **24 小時**沒有失敗，退避計數器會重設（可設定）。
- 過載重試允許在模型備援前進行 **1 次同提供者設定檔輪換**。
- 過載重試預設使用 **0 毫秒退避**。

## 模型備援

如果某個提供者的所有設定檔都失敗，OpenClaw 會移至 `agents.defaults.model.fallbacks` 中的下一個模型。這適用於驗證失敗、速率限制，以及已耗盡設定檔輪換的逾時（其他錯誤不會推進備援）。未揭露足夠細節的提供者錯誤，仍會在備援狀態中精確標記：`empty_response` 表示提供者沒有回傳可用的訊息或狀態，`no_error_details` 表示提供者明確回傳 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始預覽，但尚未有分類器符合它。

過載與速率限制錯誤的處理會比帳單冷卻更積極。預設情況下，OpenClaw 允許一次同提供者驗證設定檔重試，然後不等待就切換到下一個已設定的模型備援。像 `ModelNotReadyException` 這類提供者忙碌訊號會落入該過載分類。可用 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 調整此行為。

當執行從已設定的預設主要模型、排程工作主要模型、具有明確備援的代理程式主要模型，或自動選取的備援覆寫開始時，OpenClaw 可以沿著相符的已設定備援鏈前進。沒有明確備援的代理程式主要模型，以及明確的使用者選擇（例如 `/model ollama/qwen3.5:27b`、模型選擇器、`sessions.patch`，或一次性的命令列介面提供者/模型覆寫）都是嚴格的：如果該提供者/模型無法連線，或在產生回覆前失敗，OpenClaw 會回報失敗，而不是從不相關的備援回答。

### 候選鏈規則

OpenClaw 會從目前請求的 `provider/model` 加上已設定的備援建立候選清單。

<AccordionGroup>
  <Accordion title="規則">
    - 請求的模型永遠排第一。
    - 明確設定的備援會去重，但不會被模型允許清單過濾。它們會被視為明確的操作者意圖。
    - 如果目前執行已在同一提供者家族中的已設定備援上，OpenClaw 會繼續使用完整的已設定鏈。
    - 未提供明確的備援覆寫時，即使請求的模型使用不同提供者，也會先嘗試已設定的備援，再嘗試已設定的主要模型。
    - 未向備援執行器提供明確的備援覆寫時，已設定的主要模型會附加在末尾，讓鏈在較早候選用盡後可以回到正常預設值。
    - 當呼叫端提供 `fallbacksOverride` 時，執行器會只使用請求的模型加上該覆寫清單。空清單會停用模型備援，並防止已設定的主要模型被附加為隱藏重試目標。

  </Accordion>
</AccordionGroup>

### 哪些錯誤會推進備援

<Tabs>
  <Tab title="會繼續">
    - 驗證失敗
    - 速率限制與冷卻耗盡
    - 過載/提供者忙碌錯誤
    - 逾時形態的容錯移轉錯誤
    - 帳單停用
    - `LiveSessionModelSwitchError`，它會正規化為容錯移轉路徑，使過期的持久化模型不會建立外層重試迴圈
    - 仍有剩餘候選時的其他未辨識錯誤

  </Tab>
  <Tab title="不會繼續">
    - 非逾時/容錯移轉形態的明確中止
    - 應留在壓縮/重試邏輯內的上下文溢出錯誤（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`，或 `ollama error: context length exceeded`）
    - 沒有剩餘候選時的最終未知錯誤

  </Tab>
</Tabs>

### 冷卻略過與探測行為

當某個提供者的每個驗證設定檔都已在冷卻中時，OpenClaw 不會自動永遠略過該提供者。它會逐一針對候選做出決策：

<AccordionGroup>
  <Accordion title="逐候選決策">
    - 持續性驗證失敗會立即略過整個提供者。
    - 帳單停用通常會略過，但主要候選仍可在節流下探測，以便不需重新啟動即可恢復。
    - 主要候選可在冷卻即將到期時探測，並套用每個提供者的節流。
    - 當失敗看起來是暫時性的（`rate_limit`、`overloaded` 或未知）時，即使有冷卻，也可以嘗試同提供者的備援同層模型。當速率限制限定在模型範圍，而同層模型可能仍可立即恢復時，這尤其相關。
    - 暫時性冷卻探測在每次備援執行中限制為每個提供者一次，避免單一提供者拖慢跨提供者備援。

  </Accordion>
</AccordionGroup>

## 工作階段覆寫與即時模型切換

工作階段模型變更是共享狀態。作用中的執行器、`/model` 命令、壓縮/工作階段更新，以及即時工作階段協調，都會讀取或寫入同一個工作階段項目的部分內容。

這表示備援重試必須與即時模型切換協調：

- 只有明確由使用者驅動的模型變更會標記待處理的即時切換。這包含 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系統驅動的模型變更，例如備援輪換、心跳偵測覆寫或壓縮，本身永遠不會標記待處理的即時切換。
- 使用者驅動的模型覆寫會被視為備援政策的精確選擇，因此無法連線的已選提供者會浮現為失敗，而不是被 `agents.defaults.model.fallbacks` 遮蔽。
- 在備援重試開始前，回覆執行器會將選定的備援覆寫欄位持久化到工作階段項目。
- 自動備援覆寫會在後續回合中保持選取，使 OpenClaw 不會在每則訊息都探測已知不良的主要模型。OpenClaw 會定期再次探測已設定的來源，並在其恢復時清除自動覆寫；`/new`、`/reset` 和 `sessions.reset` 會立即清除自動來源的覆寫。
- 使用者回覆會在每次狀態變更時宣告一次備援轉換與備援清除後的恢復。黏著備援回合不會重複通知。
- `/status` 會顯示選定的模型；當備援狀態不同時，也會顯示作用中的備援模型與原因。
- 即時工作階段協調會優先使用持久化的工作階段覆寫，而不是過期的執行階段模型欄位。
- 如果即時切換錯誤指向作用中備援鏈中的較後候選，OpenClaw 會直接跳到該選定模型，而不是先走過不相關的候選。
- 如果備援嘗試失敗，執行器只會回復它寫入的覆寫欄位，而且只有在那些欄位仍符合該失敗候選時才會回復。

這能防止典型競態：

<Steps>
  <Step title="主要模型失敗">
    選定的主要模型失敗。
  </Step>
  <Step title="在記憶體中選定備援">
    備援候選在記憶體中被選定。
  </Step>
  <Step title="工作階段儲存仍顯示舊主要模型">
    工作階段儲存仍反映舊的主要模型。
  </Step>
  <Step title="即時協調讀取過期狀態">
    即時工作階段協調讀取過期的工作階段狀態。
  </Step>
  <Step title="重試被切回">
    在備援嘗試開始前，重試被切回舊模型。
  </Step>
</Steps>

持久化的備援覆寫會關閉這個時間窗，而狹窄的回復會保持較新的手動或執行階段工作階段變更完整。

## 可觀測性與失敗摘要

`runWithModelFallback(...)` 會記錄每次嘗試的詳細資料，供日誌和面向使用者的冷卻訊息使用：

- 嘗試的提供者/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`，以及類似的容錯移轉原因）
- 選用的狀態/代碼
- 人類可讀的錯誤摘要

結構化的 `model_fallback_decision` 日誌也會在候選失敗、被略過，或較後備援成功時包含扁平的 `fallbackStep*` 欄位。這些欄位會明確呈現嘗試的轉換（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），使日誌與診斷匯出器即使在最終備援也失敗時，仍能重建主要失敗。

當每個候選都失敗時，OpenClaw 會拋出 `FallbackSummaryError`。外層回覆執行器可用它建立更具體的訊息，例如「所有模型都暫時受到速率限制」，並在已知時包含最早的冷卻到期時間。

該冷卻摘要具備模型感知能力：

- 與嘗試的提供者/模型鏈無關的模型範圍速率限制會被忽略
- 如果剩餘封鎖是相符的模型範圍速率限制，OpenClaw 會回報仍封鎖該模型的最後一個相符到期時間

## 相關設定

請參閱[閘道設定](/zh-TW/gateway/configuration)以了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

請參閱[模型](/zh-TW/concepts/models)，了解更廣泛的模型選擇與備援概覽。
