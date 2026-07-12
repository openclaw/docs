---
read_when:
    - 診斷驗證設定檔輪替、冷卻或模型備援行為
    - 更新驗證設定檔或模型的容錯移轉規則
    - 瞭解工作階段模型覆寫如何與備援重試互動
sidebarTitle: Model failover
summary: OpenClaw 如何輪替驗證設定檔並在不同模型間進行備援切換
title: 模型容錯移轉
x-i18n:
    generated_at: "2026-07-11T21:15:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 分兩個階段處理失敗：

1. 在目前提供者內進行**驗證設定檔輪替**。
2. **模型備援**至 `agents.defaults.model.fallbacks` 中的下一個模型。

## 執行階段流程

<Steps>
  <Step title="解析工作階段狀態">
    解析使用中的工作階段模型與驗證設定檔偏好。
  </Step>
  <Step title="建立候選鏈">
    根據目前的模型選擇，以及該選擇來源的備援原則，建立模型候選鏈。已設定的預設值、排程工作的主要模型，以及自動選取的備援模型可以使用已設定的備援；使用者明確選取的工作階段模型則採嚴格模式。
  </Step>
  <Step title="嘗試目前的提供者">
    依照驗證設定檔輪替／冷卻規則嘗試目前的提供者。
  </Step>
  <Step title="遇到符合容錯移轉條件的錯誤時前進">
    如果該提供者因符合容錯移轉條件的錯誤而用盡所有選項，則移至下一個模型候選項目。
  </Step>
  <Step title="保存備援覆寫">
    在重試開始前保存所選的備援覆寫，讓其他工作階段讀取端看到執行器即將使用的相同提供者／模型。保存的模型覆寫會標記為 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="失敗時僅進行有限回復">
    如果備援候選項目失敗，僅在備援所擁有的工作階段覆寫欄位仍與該失敗候選項目相符時，回復這些欄位。
  </Step>
  <Step title="全部用盡時擲出 FallbackSummaryError">
    如果所有候選項目都失敗，則擲出 `FallbackSummaryError`，其中包含每次嘗試的詳細資料，以及已知情況下最早的冷卻到期時間。
  </Step>
</Steps>

此設計刻意比「儲存並還原整個工作階段」更為限縮。回覆執行器只會保存其為備援所擁有的模型選擇欄位：`providerOverride`、`modelOverride`、`modelOverrideSource`、`authProfileOverride`、`authProfileOverrideSource`、`authProfileOverrideCompactionCount`。這可防止失敗的備援重試覆寫較新的無關工作階段變更，例如手動執行 `/model` 變更，或在嘗試執行期間發生的工作階段輪替更新。

## 選擇來源原則

選擇來源會控制是否允許使用備援鏈：

- **已設定的預設值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **代理程式主要模型**：`agents.list[].model` 採嚴格模式，除非該代理程式的模型物件包含自己的 `fallbacks`。使用 `fallbacks: []` 可明確指定嚴格行為，或使用非空清單讓該代理程式啟用模型備援。
- **自動備援覆寫**：執行階段備援會在重試前寫入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"`，以及所選的來源模型。此覆寫會持續沿著已設定的備援鏈前進，而不會在每則訊息中探測主要模型；但 OpenClaw 每 5 分鐘會探測一次已設定的來源模型（無法設定），並在其恢復後清除覆寫。`/new`、`/reset` 與 `sessions.reset` 也會清除自動來源的覆寫。未明確設定 `heartbeat.model` 的心跳偵測執行，會在其來源不再符合目前已設定的預設值時清除直接的自動覆寫。
- **使用者工作階段覆寫**：`/model`、模型選擇器、`session_status(model=...)` 與 `sessions.patch` 會寫入 `modelOverrideSource: "user"`。這是精確的工作階段選擇。如果所選提供者／模型在產生回覆前失敗，OpenClaw 會回報失敗，而不會改由無關的已設定備援模型回答。
- **舊版工作階段覆寫**：較舊的工作階段項目可能具有 `modelOverride`，但沒有 `modelOverrideSource`。OpenClaw 會將其視為使用者覆寫，避免明確的舊選擇在未告知的情況下轉換為備援行為。
- **排程承載資料模型**：排程工作的 `payload.model`／`--model` 是工作主要模型，而非使用者工作階段覆寫。除非工作提供 `payload.fallbacks`，否則它會使用已設定的備援；`payload.fallbacks: []` 會讓排程執行採嚴格模式。

OpenClaw 會依工作階段與主要模型記住最近的主要模型探測，避免在每一輪都重試失敗的主要模型。工作階段轉移至備援時會傳送可見通知，返回所選主要模型時也會傳送另一則通知；在每一輪固定使用備援時不會重複通知。

## 驗證失敗略過快取

依預設，每一個新回合都會維持現有的備援重試行為：OpenClaw 會再次重試每個已設定的備援候選項目，包括最近因 `auth` 或 `auth_permanent` 而失敗的非主要候選項目。

若要選擇啟用並抑制重複的驗證失敗，請使用：

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

啟用後，非主要備援候選項目發生驗證類別失敗時，OpenClaw 會記錄一個位於記憶體中、限定於工作階段的略過標記，其索引鍵由工作階段 ID、提供者和模型組成。主要候選項目絕不會被略過，因此使用者明確選取模型時仍會顯示真正的驗證錯誤。此快取僅限目前程序，並會在閘道重新啟動時清除。

此值是以毫秒為單位的存留時間。設為 `0` 或未設定時會停用快取。正值會限制在 1 秒至 10 分鐘之間。

## 使用者可見的備援通知

工作階段轉移至自動選取的備援時，OpenClaw 會在相同的回覆介面中傳送狀態通知：

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

後續探測成功且工作階段返回所選主要模型時，OpenClaw 會傳送：

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

這些通知是操作訊息，而非助理內容。每次狀態變更只會傳送一次，包括可行時僅有副作用而無回覆內容的回合，但固定使用備援的回合不會重複傳送。其傳送會略過一般的來源回覆抑制、不會占用討論串型頻道中的第一個助理回覆位置，且不會納入文字轉語音與承諾擷取。

## 驗證儲存空間（金鑰與 OAuth）

OpenClaw 對 API 金鑰與 OAuth 權杖都使用**驗證設定檔**。

- 機密資料與執行階段驗證路由狀態位於 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。
- `auth.profiles`／`auth.order` 設定**僅包含中繼資料與路由**（不含機密資料）。
- 僅供舊版匯入的 OAuth 檔案：`~/.openclaw/credentials/oauth.json`（首次使用時匯入每個代理程式的驗證儲存區）。
- 舊版 `auth-profiles.json`、`auth-state.json` 與每個代理程式的 `auth.json` 檔案會由 `openclaw doctor --fix` 匯入。

更多詳細資料：[OAuth](/zh-TW/concepts/oauth)

憑證類型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（部分提供者另有 `projectId`／`enterpriseUrl`）
- `type: "token"` → 靜態持有人權杖，可選擇設定到期時間；OpenClaw 不會重新整理它（用於 `aws-sdk` 與其他憑證鏈驗證模式）

## 設定檔 ID

OAuth 登入會建立不同的設定檔，讓多個帳號可以共存。

- 預設：無法取得電子郵件時使用 `provider:default`。
- 具有電子郵件的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

設定檔位於每個代理程式的 `openclaw-agent.sqlite` 驗證設定檔儲存區中。

## 輪替順序

當提供者有多個設定檔時，OpenClaw 會依下列方式選擇順序：

<Steps>
  <Step title="明確設定">
    `auth.order[provider]`（如果已設定）。
  </Step>
  <Step title="已設定的設定檔">
    依提供者篩選的 `auth.profiles`。
  </Step>
  <Step title="已儲存的設定檔">
    該提供者在每個代理程式 SQLite 中的驗證設定檔項目。
  </Step>
</Steps>

如果未設定明確順序，OpenClaw 會使用循環輪替順序：

- **主要索引鍵：**設定檔類型（**依序為 OAuth、靜態權杖、API 金鑰**）。
- **次要索引鍵：**`usageStats.lastUsed`（每種類型中最舊的優先）。
- **處於冷卻／停用狀態的設定檔**會移至末尾，並依最快到期者排序。

### 工作階段黏著性（有利於快取）

OpenClaw 會**將所選驗證設定檔固定至各工作階段**，以維持提供者快取的熱度。它**不會**在每個請求中輪替。固定的設定檔會重複使用，直到：

- 工作階段重設（`/new`／`/reset`）
- 壓縮完成（壓縮計數增加）
- 設定檔處於冷卻／停用狀態

透過 `/model …@<profileId>` 手動選取會為該工作階段設定**使用者覆寫**，且在新工作階段開始前不會自動輪替。

<Note>
自動固定的設定檔（由工作階段路由器選取）會被視為一種**偏好**：OpenClaw 會先嘗試它們，但遇到速率限制／逾時時可能輪替至其他設定檔。原始設定檔再次可用後，新的執行可以再次優先使用它，而不會變更所選模型或執行階段。使用者固定的設定檔會維持鎖定；如果該設定檔失敗且已設定模型備援，OpenClaw 會移至下一個模型，而不是切換設定檔。
</Note>

### OpenAI Codex 訂閱加上 API 金鑰備援

對 OpenAI 代理程式模型而言，驗證與執行階段彼此分離。`openai/gpt-*` 會繼續使用 Codex 執行框架，而驗證則可在 Codex 訂閱設定檔與 OpenAI API 金鑰備援之間輪替。

使用 `auth.order.openai` 設定面向使用者的順序：

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

ChatGPT／Codex OAuth 設定檔與 OpenAI API 金鑰設定檔都使用 `openai:*`。當訂閱達到 Codex 使用量限制時，如果 Codex 提供確切的重設時間，OpenClaw 會記錄該時間、嘗試下一個依序排列的驗證設定檔，並讓執行持續留在 Codex 執行框架內。重設時間過後，訂閱設定檔會再次符合使用資格，下一次自動選擇即可返回該設定檔。

只有在您想強制該工作階段使用特定帳號／金鑰時，才使用使用者固定的設定檔。使用者固定的設定檔刻意採嚴格模式，不會在未告知的情況下跳至其他設定檔。

## 冷卻

當設定檔因驗證／速率限制錯誤（或看似速率限制的逾時）而失敗時，OpenClaw 會將其標記為冷卻狀態，並移至下一個設定檔。

<AccordionGroup>
  <Accordion title="哪些情況會歸入速率限制／逾時類別">
    該速率限制類別比單純的 `429` 更廣：它也包括提供者訊息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及週期性的使用量時段限制，例如 `weekly limit reached` 或 `monthly limit exhausted`。

    格式／無效請求錯誤通常屬於終止性錯誤，因為使用相同承載資料重試仍會以相同方式失敗，因此 OpenClaw 會顯示這些錯誤，而不是輪替驗證設定檔。已知的重試修復路徑可以明確選擇啟用：例如，Cloud Code Assist 工具呼叫 ID 驗證失敗會經過清理，並透過 `allowFormatRetry` 原則重試一次。與 OpenAI 相容的停止原因錯誤，例如 `Unhandled stop reason: error`、`stop reason: error` 與 `reason: error`，會被分類為逾時／容錯移轉訊號。

    當來源符合已知的暫時性模式時，一般伺服器文字也可能歸入該逾時類別。例如，單獨的模型執行階段串流包裝器訊息 `An unknown error occurred` 對所有提供者都會被視為符合容錯移轉條件，因為當提供者串流以 `stopReason: "aborted"` 或 `stopReason: "error"` 結束且未提供具體詳細資料時，共用模型執行階段會發出此訊息。包含暫時性伺服器文字的 JSON `api_error` 承載資料，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也會被視為符合容錯移轉條件的逾時。

    OpenRouter 特有的一般上游文字，例如單獨的 `Provider returned error`，只有在提供者內容確實為 OpenRouter 時才會被視為逾時。一般內部備援文字，例如 `LLM request failed with an unknown error.`，仍採保守處理，本身不會觸發容錯移轉。

  </Accordion>
  <Accordion title="SDK Retry-After 上限">
    某些提供者 SDK 可能會先依照很長的 `Retry-After` 時間暫停，之後才將控制權交還給 OpenClaw。對於 Anthropic 和 OpenAI 等以 Stainless 為基礎的 SDK，OpenClaw 預設將 SDK 內部的 `retry-after-ms` / `retry-after` 等待時間限制為 60 秒，並立即回報需要更長等待時間但可重試的回應，讓此容錯移轉路徑得以執行。可使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 調整或停用此上限；請參閱[重試行為](/zh-TW/concepts/retry)。
  </Accordion>
  <Accordion title="模型範圍的冷卻期">
    速率限制冷卻期也可以限定於模型範圍：

    - 當已知失敗的模型 ID 時，OpenClaw 會針對速率限制失敗記錄 `cooldownModel`。
    - 當冷卻期限定於其他模型時，仍可嘗試相同提供者的同層級模型。
    - 計費／停用期間仍會跨模型封鎖整個設定檔。

  </Accordion>
</AccordionGroup>

一般（非計費、非永久驗證）冷卻期會依設定檔近期的錯誤次數增加：

- 第 1 次失敗：30 秒
- 第 2 次失敗：1 分鐘
- 第 3 次以上失敗：5 分鐘（上限）

設定檔的失敗時間窗經過後，計數器便會重設（`auth.cooldowns.failureWindowHours`，預設為 24）。

狀態會儲存在每個代理程式的 SQLite 驗證狀態中，位於 `usageStats` 下：

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

## 因計費而停用

計費／額度失敗（例如「額度不足」／「額度餘額過低」）會被視為需要進行容錯移轉，但通常並非暫時性問題。OpenClaw 不會採用短暫冷卻期，而會將設定檔標記為**已停用**（使用較長的退避時間），並輪替至下一個設定檔／提供者。

<Note>
並非每個看似計費問題的回應都是 `402`，也並非每個 HTTP `402` 都會歸入此處。即使提供者改為傳回 `401` 或 `403`，OpenClaw 仍會將明確的計費文字歸入計費類別，但提供者特定的比對器仍僅限於其所屬提供者（例如 OpenRouter 的 `403 Key limit exceeded`）。

同時，當訊息看似可重試時，暫時性的 `402` 用量時間窗，以及組織／工作區支出上限錯誤，會被分類為 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`）。這些錯誤會繼續使用短暫冷卻／容錯移轉路徑，而非長時間的計費停用路徑。
</Note>

高度確定的永久驗證失敗（已撤銷／停用的金鑰、已停用的工作區）會進入類似的停用類別，但復原時間會比計費問題短得多，因為某些提供者在事件期間可能會暫時回傳看似驗證失敗的承載資料。

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

預設值（`auth.cooldowns.*`）：

| 鍵                            | 預設值 | 用途                                                                         |
| ----------------------------- | ------ | ---------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5      | 基本計費退避時間，每次計費失敗後加倍                                           |
| `billingMaxHours`             | 24     | 計費退避時間上限                                                               |
| `authPermanentBackoffMinutes` | 10     | 高度確定的永久驗證失敗之基本退避時間                                           |
| `authPermanentMaxMinutes`     | 60     | 該退避時間的上限                                                               |
| `failureWindowHours`          | 24     | 若此時間窗內未發生失敗，則重設失敗計數器                                       |
| `overloadedProfileRotations`  | 1      | 過載時，在進行模型後備切換前允許的相同提供者設定檔輪替次數                     |
| `overloadedBackoffMs`         | 0      | 過載輪替重試前的固定延遲                                                       |
| `rateLimitedProfileRotations` | 1      | 遇到速率限制時，在進行模型後備切換前允許的相同提供者設定檔輪替次數             |

過載和速率限制錯誤的處理比計費冷卻期更積極：OpenClaw 預設允許重試一次相同提供者的驗證設定檔，接著不等待便切換至下一個已設定的後備模型。

## 模型後備切換

如果某個提供者的所有設定檔都失敗，OpenClaw 會移至 `agents.defaults.model.fallbacks` 中的下一個模型。這適用於驗證失敗、速率限制，以及已用盡設定檔輪替的逾時（其他錯誤不會推進後備切換）。對於未提供足夠詳細資訊的提供者錯誤，後備狀態仍會使用精確標籤：`empty_response` 表示提供者未傳回可用的訊息或狀態，`no_error_details` 表示提供者明確傳回 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始預覽，但尚無任何分類器與之相符。

`ModelNotReadyException` 等提供者忙碌訊號會歸入過載類別，並遵循與速率限制相同的「輪替一次後再進行後備切換」政策（請參閱上方的預設值表格）。

當執行是從已設定的預設主要模型、排程作業的主要模型、具有明確後備模型的代理程式主要模型，或自動選取的後備覆寫開始時，OpenClaw 可以依序走訪相符的已設定後備鏈。未明確設定後備模型的代理程式主要模型，以及使用者明確選取的模型（例如 `/model ollama/qwen3.5:27b`、模型選擇器、`sessions.patch`，或單次命令列介面提供者／模型覆寫）會採用嚴格模式：若該提供者／模型無法連線，或在產生回覆前失敗，OpenClaw 會回報失敗，而不會改用不相關的後備模型回答。

### 候選鏈規則

OpenClaw 會根據目前要求的 `provider/model` 加上已設定的後備模型來建立候選清單。

<AccordionGroup>
  <Accordion title="規則">
    - 要求的模型一律排在第一位。
    - 明確設定的後備模型會去除重複項目，但不會依模型允許清單篩選。它們會被視為操作人員的明確意圖。
    - 如果目前的執行已使用相同提供者系列中的某個已設定後備模型，OpenClaw 會繼續使用完整的已設定鏈。
    - 若未提供明確的後備覆寫，即使要求的模型使用不同的提供者，也會先嘗試已設定的後備模型，再嘗試已設定的主要模型。
    - 若未向後備執行器提供明確的後備覆寫，已設定的主要模型會附加至末尾，使先前的候選模型全數用盡後，該鏈可以回到一般預設模型。
    - 當呼叫端提供 `fallbacksOverride` 時，執行器只會使用要求的模型及該覆寫清單。空清單會停用模型後備切換，並防止已設定的主要模型被附加為隱藏的重試目標。

  </Accordion>
</AccordionGroup>

### 哪些錯誤會推進後備切換

<Tabs>
  <Tab title="下列情況會繼續">
    - 驗證失敗
    - 速率限制和冷卻期用盡
    - 過載／提供者忙碌錯誤
    - 具有逾時特徵的容錯移轉錯誤
    - 因計費而停用
    - `LiveSessionModelSwitchError`；此錯誤會正規化為容錯移轉路徑，避免過時的持久化模型造成外層重試迴圈
    - 仍有剩餘候選模型時的其他未辨識錯誤

  </Tab>
  <Tab title="下列情況不會繼續">
    - 不具有逾時／容錯移轉特徵的明確中止
    - 應留在壓縮／重試邏輯中的內容超出限制錯誤（例如 `request_too_large`、`input token count exceeds the maximum number of input tokens`、`input exceeds the maximum number of tokens`、`input too long for the model` 或 `ollama error: context length exceeded`）
    - 已無候選模型時的最終未知錯誤
    - Claude Fable 5 安全拒絕；使用直接 API 金鑰的要求會改由提供者層級處理，透過 Anthropic 的伺服器端後備切換至 `claude-opus-4-8`（請參閱 [Anthropic](/zh-TW/providers/anthropic#safety-refusal-fallback-claude-fable-5)）

  </Tab>
</Tabs>

### 略過冷卻期與探測行為

當某個提供者的所有驗證設定檔都已進入冷卻期時，OpenClaw 不會自動永遠略過該提供者，而是針對每個候選模型分別決定：

<AccordionGroup>
  <Accordion title="每個候選模型的決策">
    - 持續性的驗證失敗會立即略過整個提供者。
    - 因計費而停用時通常會略過，但仍可依節流限制探測主要候選模型，讓系統無須重新啟動即可復原。
    - 接近冷卻期結束時，可以依每個提供者的節流限制探測主要候選模型。
    - 當失敗看似暫時性（`rate_limit`、`overloaded` 或未知）時，即使處於冷卻期，仍可嘗試相同提供者的同層級後備模型。若速率限制限定於模型範圍，而同層級模型可能仍能立即復原，這點尤其重要。
    - 每次後備執行中，每個提供者最多只能進行一次暫時性冷卻探測，避免單一提供者阻礙跨提供者的後備切換。

  </Accordion>
</AccordionGroup>

## 工作階段覆寫與即時模型切換

工作階段模型變更屬於共用狀態。作用中的執行器、`/model` 命令、壓縮／工作階段更新，以及即時工作階段協調，都會讀取或寫入同一工作階段項目的部分內容。

這表示後備重試必須與即時模型切換協調：

- 只有由使用者明確觸發的模型變更才會標記待處理的即時切換，包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系統驅動的模型變更（例如後備輪替、心跳偵測覆寫或壓縮）絕不會自行標記待處理的即時切換。
- 使用者驅動的模型覆寫會被視為後備政策中的精確選取，因此無法連線至所選提供者時會直接顯示失敗，而不會被 `agents.defaults.model.fallbacks` 掩蓋。
- 開始後備重試前，回覆執行器會將選取的後備覆寫欄位持久化至工作階段項目。
- 自動後備覆寫會在後續回合中維持選取狀態，讓 OpenClaw 不會在每則訊息中探測已知有問題的主要模型。OpenClaw 會定期再次探測已設定的原始模型，並在其復原後清除自動覆寫；`/new`、`/reset` 和 `sessions.reset` 會立即清除自動產生的覆寫。
- 每次狀態變更時，使用者回覆會各通知一次後備切換，以及後備狀態清除後的復原。持續使用後備模型的回合不會重複通知。
- `/status` 會顯示選取的模型；若後備狀態不同，也會顯示作用中的後備模型及原因。
- 即時工作階段協調會優先採用持久化的工作階段覆寫，而非過時的執行階段模型欄位。
- 如果即時切換錯誤指向作用中後備鏈裡較後面的候選模型，OpenClaw 會直接跳至該選取模型，而不會先走訪不相關的候選模型。
- 如果後備嘗試失敗，執行器只會回復其寫入的覆寫欄位，且僅在這些欄位仍與該失敗候選模型相符時才會回復。

這可防止典型的競爭狀況：

<Steps>
  <Step title="主要模型失敗">
    選取的主要模型失敗。
  </Step>
  <Step title="在記憶體中選取後備模型">
    在記憶體中選取後備候選模型。
  </Step>
  <Step title="工作階段儲存區仍記錄舊的主要模型">
    工作階段儲存區仍反映舊的主要模型。
  </Step>
  <Step title="即時協調讀取過時狀態">
    即時工作階段協調讀取過時的工作階段狀態。
  </Step>
  <Step title="重試被切回舊模型">
    後備嘗試開始前，重試被切回舊模型。
  </Step>
</Steps>

持久化的後備覆寫會消除此時間窗，而精確限定的回復操作則會保留較新的手動或執行階段工作階段變更。

## 可觀測性與失敗摘要

`runWithModelFallback(...)` 會記錄每次嘗試的詳細資料，用於日誌和面向使用者的冷卻期訊息：

- 嘗試的供應商/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 及類似的容錯移轉原因）
- 選用的狀態/代碼
- 人類可讀的錯誤摘要

當候選項目失敗、遭到略過，或後續容錯移轉成功時，結構化的 `model_fallback_decision` 記錄也會包含扁平的 `fallbackStep*` 欄位。這些欄位會明確標示所嘗試的轉換（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），讓記錄與診斷匯出器即使在最終容錯移轉也失敗時，仍能重建主要失敗原因。

當所有候選項目都失敗時，OpenClaw 會擲出 `FallbackSummaryError`。外層回覆執行器可利用此錯誤建構更具體的訊息，例如「所有模型目前都受到速率限制」，並在已知時納入最早的冷卻到期時間。

該冷卻摘要會識別模型：

- 對於所嘗試的供應商/模型鏈，會忽略無關且僅限特定模型的速率限制
- 如果剩餘的封鎖是相符且僅限特定模型的速率限制，OpenClaw 會回報仍在封鎖該模型的最後一個相符到期時間

## 相關設定

請參閱[閘道設定](/zh-TW/gateway/configuration)，了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

請參閱[模型](/zh-TW/concepts/models)，了解更廣泛的模型選擇與容錯移轉概覽。
