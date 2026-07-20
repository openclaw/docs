---
read_when:
    - 診斷驗證設定檔輪替、冷卻或模型備援行為
    - 更新認證設定檔或模型的容錯移轉規則
    - 瞭解工作階段模型覆寫如何與備援重試互動
sidebarTitle: Model failover
summary: OpenClaw 如何輪替驗證設定檔並在不同模型間進行備援切換
title: 模型容錯移轉
x-i18n:
    generated_at: "2026-07-20T00:47:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e520ed160969b57bd50c2ed647ff7c0e60ec19ab983db226241b6301dafb503d
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 分兩個階段處理失敗：

1. 目前供應商內的**認證設定檔輪替**。
2. **模型後援**至 `agents.defaults.model.fallbacks` 中的下一個模型。

## 執行階段流程

<Steps>
  <Step title="解析工作階段狀態">
    解析作用中的工作階段模型與認證設定檔偏好。
  </Step>
  <Step title="建立候選鏈">
    根據目前的模型選擇，以及該選擇來源的後援政策，建立模型候選鏈。已設定的預設值、排程工作的主要模型，以及自動選取的後援模型都可使用已設定的後援；明確的使用者工作階段選擇則採嚴格模式。
  </Step>
  <Step title="嘗試目前的供應商">
    依照認證設定檔輪替／冷卻規則嘗試目前的供應商。
  </Step>
  <Step title="發生值得容錯移轉的錯誤時前進">
    如果該供應商因值得容錯移轉的錯誤而耗盡可用選項，則移至下一個模型候選項目。
  </Step>
  <Step title="目前輪次使用後援">
    執行成功的後援候選項目，但不變更工作階段所選取的供應商／模型。
  </Step>
  <Step title="安全地重試純過載耗盡">
    如果每個候選項目都只因供應商過載而失敗，且尚未開始執行工具或輸出助理內容，則以指數退避重試完整的輪次本機候選鏈，最多 10 次。30 秒後會傳送一次狀態通知，避免讓使用者在沒有任何訊息的情況下持續等待。
  </Step>
  <Step title="耗盡時擲出 FallbackSummaryError">
    如果每個候選項目都失敗，則擲出包含各次嘗試詳細資料的 `FallbackSummaryError`；若已知最早的冷卻結束時間，也會一併包含。
  </Step>
</Steps>

後援執行僅限目前輪次。回覆執行器只會保存後援通知狀態，讓 `/status` 與轉換通知能區分所選模型和實際回答的模型；它不會將後援模型保存為下一輪的模型選擇。

## 選擇來源政策

選擇來源會控制是否允許使用後援鏈：

- **已設定的預設值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **代理程式主要模型**：`agents.list[].model` 採嚴格模式，除非該代理程式的模型物件包含自己的 `fallbacks`。使用 `fallbacks: []` 明確指定嚴格行為，或使用非空白清單讓該代理程式選擇加入模型後援。
- **執行階段後援**：後援候選項目僅套用於目前輪次。下一輪會再次從所選的主要模型開始。OpenClaw 仍會辨識先前儲存的 `modelOverrideSource: "auto"` 項目，每 5 分鐘探測其已設定的來源，並在來源恢復後清除這些項目。`/new`、`/reset` 和 `sessions.reset` 也會清除這些項目。
- **使用者工作階段覆寫**：`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會寫入 `modelOverrideSource: "user"`。這是精確的工作階段選擇。如果所選供應商／模型在產生回覆前失敗，OpenClaw 會回報失敗，而不會改用不相關的已設定後援來回答。
- **舊版工作階段覆寫**：較舊的工作階段項目可能有 `modelOverride`，但沒有 `modelOverrideSource`。OpenClaw 會將這些項目視為使用者覆寫，避免明確的舊選擇遭到無提示地轉換為後援行為。
- **排程承載資料模型**：排程工作的 `payload.model`／`--model` 是工作的主要模型，而非使用者工作階段覆寫。除非工作提供 `payload.fallbacks`，否則會使用已設定的後援；`payload.fallbacks: []` 會讓排程執行採嚴格模式。

當一輪移至後援模型時，OpenClaw 會傳送可見通知；後續輪次在所選主要模型上成功時，則會傳送另一則通知。保存的通知狀態可避免連續輪次使用相同的所選／作用中模型組合時重複通知，而模型選擇本身維持不變。

## 認證失敗略過快取

依預設，每個新輪次都會維持既有的後援重試行為：OpenClaw 會再次重試每個已設定的後援候選項目，包括最近因 `auth` 或 `auth_permanent` 而失敗的非主要候選項目。

若要選擇啟用並抑制重複的認證失敗，請設定：

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

啟用後，如果非主要後援候選項目發生認證類別失敗，OpenClaw 會記錄一個位於記憶體中、工作階段範圍的略過標記，並以工作階段 ID、供應商及模型作為索引鍵。主要候選項目永遠不會被略過，因此明確的使用者模型選擇仍會顯示實際的認證錯誤。此快取僅限目前處理程序，並會在閘道重新啟動時清除。

此值是以毫秒為單位的 TTL。`0` 或未設定會停用快取。正值會限制在 1 秒至 10 分鐘之間。

## 使用者可見的後援通知

當工作階段移至自動選取的後援時，OpenClaw 會在相同的回覆介面傳送狀態通知：

```text
↪️ 模型後援：<fallback>（已選取 <primary>；<reason>）
```

當後續探測成功，且工作階段返回所選的主要模型時，OpenClaw 會傳送：

```text
↪️ 模型後援已清除：<primary>（先前為 <fallback>）
```

這些通知是操作訊息，而非助理內容。每次狀態變更只會傳送一次，在可行時也包括只有副作用的輪次，但重複的輪次本機後援轉換不會重複傳送。傳送程序會略過一般的來源回覆抑制機制、不會占用討論串頻道的第一個助理回覆位置，且不會納入文字轉語音與承諾擷取。

## 認證儲存空間（金鑰 + OAuth）

OpenClaw 對 API 金鑰和 OAuth 權杖都使用**認證設定檔**。

- 密鑰與執行階段認證路由狀態位於 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。
- 設定 `auth.profiles`／`auth.order` **僅包含中繼資料與路由**（不含密鑰）。
- 僅供舊版匯入的 OAuth 檔案：`~/.openclaw/credentials/oauth.json`（第一次使用時匯入各代理程式的認證儲存區）。
- 舊版 `auth-profiles.json`、`auth-state.json` 和各代理程式的 `auth.json` 檔案會由 `openclaw doctor --fix` 匯入。

更多詳細資訊：[OAuth](/zh-TW/concepts/oauth)

認證資訊類型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（部分供應商另有 `projectId`/`enterpriseUrl`）
- `type: "token"` → 靜態持有人型權杖，可選擇設定到期時間；OpenClaw 不會重新整理它（用於 `aws-sdk` 和其他認證資訊鏈認證模式）

## 設定檔 ID

OAuth 登入會建立不同的設定檔，讓多個帳戶可以共存。

- 預設值：沒有可用的電子郵件時使用 `provider:default`。
- 具有電子郵件的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

設定檔位於各代理程式的 `openclaw-agent.sqlite` 認證設定檔儲存區中。

## 輪替順序

當供應商有多個設定檔時，OpenClaw 會依照下列方式選擇順序：

<Steps>
  <Step title="明確設定">
    `auth.order[provider]`（若已設定）。
  </Step>
  <Step title="已設定的設定檔">
    依供應商篩選的 `auth.profiles`。
  </Step>
  <Step title="已儲存的設定檔">
    該供應商在各代理程式 SQLite 中的認證設定檔項目。
  </Step>
</Steps>

如果未設定明確順序，OpenClaw 會使用循環輪替順序：

- **主要索引鍵：**設定檔類型（**OAuth，接著是靜態權杖，再來是 API 金鑰**）。
- **OAuth 的次要索引鍵：**目前具有可用存取權杖的設定檔，排在
  存取權杖已過期的設定檔之前。過期的 OAuth 設定檔仍符合使用資格，因此
  當沒有可用的同類設定檔時，執行階段可以重新整理它們。
- **下一個索引鍵：**`usageStats.lastUsed`（各類型／狀態層級內，最舊者優先）。
- **處於冷卻／停用狀態的設定檔**會移至末尾，並依最早到期時間排序。

### 工作階段黏著性（有利於快取）

OpenClaw 會**為每個工作階段固定所選的認證設定檔**，讓供應商快取保持熱狀態。它**不會**在每個要求中輪替。固定的設定檔會重複使用，直到：

- 工作階段被重設（`/new`／`/reset`）
- 壓縮完成（壓縮計數遞增）
- 設定檔處於冷卻／停用狀態

透過 `/model …@<profileId>` 手動選擇會為該工作階段設定**使用者覆寫**，且在新工作階段開始前不會自動輪替。

<Note>
由工作階段路由器選取的自動固定設定檔會被視為一項**偏好**：系統會先嘗試它們，但 OpenClaw 可能會在遇到速率限制／逾時時輪替至其他設定檔。原始設定檔再次可用時，新的執行可以再次優先使用它，而不會變更所選模型或執行階段。使用者固定的設定檔會持續鎖定該設定檔；如果該設定檔失敗且已設定模型後援，OpenClaw 會移至下一個模型，而非切換設定檔。
</Note>

### OpenAI Codex 訂閱與 API 金鑰備援

對於 OpenAI 代理程式模型，認證與執行階段是分開的。`openai/gpt-*` 會維持使用 Codex 控制框架，而認證可以在 Codex 訂閱設定檔與 OpenAI API 金鑰備援之間輪替。

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

ChatGPT/Codex OAuth 設定檔和 OpenAI API 金鑰設定檔都使用 `openai:*`。當訂閱達到 Codex 使用量限制時，如果 Codex 提供了確切的重設時間，OpenClaw 會記錄該時間、嘗試下一個依序排列的認證設定檔，並讓執行持續留在 Codex 控制框架內。重設時間經過後，訂閱設定檔會再次符合使用資格，下一次自動選擇即可返回該設定檔。

只有在你想強制該工作階段使用單一帳戶／金鑰時，才使用使用者固定的設定檔。使用者固定的設定檔刻意採取嚴格模式，不會無提示地跳至其他設定檔。

## 冷卻

當設定檔因認證／速率限制錯誤（或看似速率限制的逾時）而失敗時，OpenClaw 會將其標記為冷卻狀態，並移至下一個設定檔。

<AccordionGroup>
  <Accordion title="哪些情況會歸入速率限制／逾時類別">
    該速率限制類別的範圍比單純的 `429` 更廣：它也包括 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted` 等供應商訊息，以及 `weekly limit reached` 或 `monthly limit exhausted` 等週期性使用量視窗限制。

    格式／無效要求錯誤通常是終止錯誤，因為重試相同承載資料仍會以相同方式失敗，所以 OpenClaw 會顯示這些錯誤，而不會輪替認證設定檔。已知的重試修復路徑可以明確選擇啟用：例如，Cloud Code Assist 工具呼叫 ID 驗證失敗會經過清理，並透過 `allowFormatRetry` 政策重試一次。與 OpenAI 相容的停止原因錯誤，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，會歸類為逾時／容錯移轉訊號。

    當來源符合已知的暫時性模式時，一般伺服器文字也可能歸入該逾時類別。例如，單獨出現的模型執行階段串流包裝函式訊息 `An unknown error occurred` 對所有供應商都會視為值得容錯移轉，因為當供應商串流以 `stopReason: "aborted"` 或 `stopReason: "error"` 結束且沒有具體詳細資料時，共用模型執行階段會發出此訊息。含有 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error` 等暫時性伺服器文字的 JSON `api_error` 承載資料，也會被視為值得容錯移轉的逾時。

    OpenRouter 特有的一般上游文字，例如單獨出現的 `Provider returned error`，只有在供應商情境確實是 OpenRouter 時才會視為逾時。`LLM request failed with an unknown error.` 等一般內部後援文字會維持保守處理，不會自行觸發容錯移轉。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    否則，某些供應商 SDK 可能會在將控制權交還給 OpenClaw 前，於較長的 `Retry-After` 時間範圍內休眠。對於 Anthropic 和 OpenAI 等以 Stainless 為基礎的 SDK，OpenClaw 預設將 SDK 內部的 `retry-after-ms` / `retry-after` 等待時間限制為 60 秒，並立即回報需要更長時間後才能重試的回應，讓此容錯移轉路徑得以執行。可使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 調整或停用此上限；請參閱[重試行為](/zh-TW/concepts/retry)。
  </Accordion>
  <Accordion title="模型範圍的冷卻期">
    速率限制冷卻期也可以模型為範圍：

    - 當已知失敗的模型 ID 時，OpenClaw 會針對速率限制失敗記錄 `cooldownModel`。
    - 當冷卻期的範圍是不同模型時，仍可嘗試同一供應商的同系列模型。
    - 計費／停用時段仍會跨模型封鎖整個設定檔。

  </Accordion>
</AccordionGroup>

一般（非計費、非永久驗證）冷卻期會依設定檔最近的錯誤次數增加：

- 第 1 次失敗：30 秒
- 第 2 次失敗：1 分鐘
- 第 3 次以上失敗：5 分鐘（上限）

設定檔內建的失敗時間範圍結束後，計數器便會重設。

狀態儲存在每個代理程式的 SQLite 驗證狀態中，位於 `usageStats`：

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

計費／額度失敗（例如「額度不足」／「額度餘額過低」）會被視為值得進行容錯移轉，但通常並非暫時性問題。OpenClaw 不會採用短暫冷卻期，而是將設定檔標記為**已停用**（並使用較長的退避時間），再輪替至下一個設定檔／供應商。

<Note>
並非每個看似計費問題的回應都是 `402`，也不是每個 HTTP `402` 都會歸入此處。即使供應商改為傳回 `401` 或 `403`，OpenClaw 仍會將明確的計費文字保留在計費處理路徑中，但供應商特定的比對器仍只適用於其所屬供應商（例如 OpenRouter `403 Key limit exceeded`）。

另一方面，當訊息看似可重試時，暫時性的 `402` 使用時段與組織／工作區支出限制錯誤會分類為 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`）。這些錯誤會留在短暫冷卻／容錯移轉路徑，而不會進入長時間的計費停用路徑。
</Note>

高度確定的永久驗證失敗（已撤銷／停用的金鑰、已停用的工作區）會進入類似的停用處理路徑，但恢復時間比計費問題短得多，因為某些供應商在事故期間可能會暫時傳回看似驗證問題的承載資料。

狀態儲存在每個代理程式的 SQLite 驗證狀態中：

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

過載與速率限制錯誤的處理比計費冷卻期更積極：OpenClaw 預設允許重試同一供應商的驗證設定檔一次，接著不等待便切換至下一個已設定的模型備援。

## 模型備援

如果某供應商的所有設定檔都失敗，OpenClaw 會移至 `agents.defaults.model.fallbacks` 中的下一個模型。這適用於驗證失敗、速率限制，以及已用盡設定檔輪替的逾時（其他錯誤不會推進備援）。若供應商錯誤未提供足夠的詳細資訊，備援狀態仍會精確標記：`empty_response` 表示供應商未傳回可用的訊息或狀態，`no_error_details` 表示供應商明確傳回 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始預覽，但目前尚無分類器與其相符。

`ModelNotReadyException` 等供應商忙碌訊號會歸入過載類別，並採用與速率限制相同的「輪替一次後再備援」政策（請參閱上方的預設值表格）。

如果整條候選鏈只因過載失敗而用盡，回覆執行器會在同一回合中重試該鏈最多 10 次。只有在工具執行或助理輸出開始前，才允許重試整個回合，以避免在已進行可觀察的工作後發生過載時，造成重複變更或訊息。退避時間從 2.5 秒開始，並倍增至 30 秒上限。當該回合已等待 30 秒後，OpenClaw 會傳送一次暫時性狀態通知：`The AI service is temporarily overloaded. I’m still retrying; this may take a few minutes.` 重試及任何勝出的備援都僅適用於該回合；一般的暫時性伺服器錯誤仍採用其獨立的一次重試政策。

當執行從已設定的預設主要模型、排程工作主要模型、具有明確備援的代理程式主要模型，或自動選取的備援覆寫開始時，OpenClaw 可依序走訪相符的已設定備援鏈。不具明確備援的代理程式主要模型，以及使用者明確選取的項目（例如 `/model ollama/qwen3.5:27b`、模型選擇器、`sessions.patch`，或單次命令列介面供應商／模型覆寫）均採嚴格模式：如果該供應商／模型無法連線，或在產生回覆前失敗，OpenClaw 會回報失敗，而不會改用不相關的備援來回答。

### 候選鏈規則

OpenClaw 會根據目前要求的 `provider/model` 與已設定的備援建立候選清單。

<AccordionGroup>
  <Accordion title="規則">
    - 要求的模型一律排在第一位。
    - 明確設定的備援會移除重複項目，但不會依模型允許清單篩選。這些項目會被視為操作人員的明確意圖。
    - 如果目前執行已使用同一供應商系列中的已設定備援，OpenClaw 會繼續使用完整的已設定鏈。
    - 未提供明確備援覆寫時，即使要求的模型使用不同供應商，也會先嘗試已設定的備援，再嘗試已設定的主要模型。
    - 未向備援執行器提供明確備援覆寫時，已設定的主要模型會附加至末尾，讓候選鏈在前面的候選項目用盡後，能回到一般預設模型。
    - 當呼叫端提供 `fallbacksOverride` 時，執行器只會使用要求的模型及該覆寫清單。空清單會停用模型備援，並防止將已設定的主要模型附加為隱藏的重試目標。

  </Accordion>
</AccordionGroup>

### 哪些錯誤會推進備援

<Tabs>
  <Tab title="遇到以下情況時繼續">
    - 驗證失敗
    - 速率限制與冷卻期用盡
    - 過載／供應商忙碌錯誤
    - 逾時型容錯移轉錯誤
    - 因計費而停用
    - `LiveSessionModelSwitchError`，此錯誤會正規化為容錯移轉路徑，避免過時的已保存模型造成外層重試迴圈
    - 仍有候選項目時的其他無法辨識錯誤

  </Tab>
  <Tab title="遇到以下情況時不繼續">
    - 不屬於逾時／容錯移轉類型的明確中止
    - 應留在壓縮／重試邏輯內的內容溢位錯誤（例如 `request_too_large`、`input token count exceeds the maximum number of input tokens`、`input exceeds the maximum number of tokens`、`input too long for the model` 或 `ollama error: context length exceeded`）
    - 沒有剩餘候選項目時的最終未知錯誤
    - Claude Fable 5 安全拒絕；直接使用 API 金鑰的要求會改由供應商層級處理，透過 Anthropic 的伺服器端備援切換至 `claude-opus-4-8`（請參閱 [Anthropic](/zh-TW/providers/anthropic#safety-refusal-fallback-claude-fable-5)）

  </Tab>
</Tabs>

### 略過冷卻期與探測行為

當某供應商的所有驗證設定檔都已處於冷卻期時，OpenClaw 不會自動永久略過該供應商，而是針對每個候選項目做出決定：

<AccordionGroup>
  <Accordion title="各候選項目的決策">
    - 持續性的驗證失敗會立即略過整個供應商。
    - 因計費而停用通常會略過，但仍可依節流限制探測主要候選項目，讓系統不需重新啟動即可恢復。
    - 接近冷卻期結束時，可以依各供應商的節流限制探測主要候選項目。
    - 當失敗看似暫時性（`rate_limit`、`overloaded` 或未知）時，即使處於冷卻期，也可嘗試同一供應商的備援同系列模型。當速率限制的範圍僅限於模型，而同系列模型可能立即恢復時，這點尤其重要。
    - 每次備援執行中，每個供應商最多只能進行一次暫時性冷卻探測，避免單一供應商拖延跨供應商備援。

  </Accordion>
</AccordionGroup>

## 工作階段覆寫與即時模型切換

工作階段模型變更屬於共享狀態。作用中的執行器、`/model` 命令、壓縮／工作階段更新，以及即時工作階段協調，都會讀取或寫入同一工作階段項目的部分內容。備援執行不會寫入模型選取欄位，因此在重試期間不會取代較新的手動選取。

即時模型切換遵循以下規則：

- 只有使用者明確觸發的模型變更，才會標記待處理的即時切換。這包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 備援輪替、心跳偵測覆寫或壓縮等系統驅動的模型變更，絕不會自行標記待處理的即時切換。
- 使用者驅動的模型覆寫在備援政策中會被視為精確選取，因此無法連線的已選供應商會直接顯示為失敗，而不會被 `agents.defaults.model.fallbacks` 掩蓋。
- 執行階段備援候選項目僅適用於該回合。下一回合會從目前選取的模型開始，包括在上一個執行期間收到的手動選取。
- 仍支援先前儲存的自動備援覆寫：OpenClaw 會定期探測其已設定的來源，並在來源恢復時清除覆寫；`/new`、`/reset` 和 `sessions.reset` 會立即清除自動來源的覆寫。
- 每次狀態變更時，使用者回覆都會公告一次備援轉換及備援清除後的恢復狀態。若連續多個回合使用相同的已選／作用中模型組合，則不會重複顯示通知。
- `/status` 會顯示已選模型；當備援狀態不同時，還會顯示作用中的備援模型與原因。
- 即時工作階段協調會優先採用已保存的工作階段覆寫，而非過時的執行階段模型欄位。
- 如果即時切換錯誤指向作用中備援鏈內較後面的候選項目，OpenClaw 會直接跳至該已選模型，而不會先走訪不相關的候選項目。

作用中的執行會直接攜帶其選定的候選項目。即時協調只會在明確待處理的使用者切換時變更該候選項目，因此不需要暫時性的備援覆寫或復原。

## 可觀測性與失敗摘要

`runWithModelFallback(...)` 會記錄每次嘗試的詳細資料，供記錄與面向使用者的冷卻訊息使用：

- 嘗試的供應商／模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 及類似的容錯移轉原因）
- 選用的狀態／代碼
- 人類可讀的錯誤摘要

當候選項目失敗、遭略過，或後續備援成功時，結構化 `model_fallback_decision` 記錄也會包含扁平的 `fallbackStep*` 欄位。這些欄位會明確呈現嘗試的轉換（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），讓記錄與診斷匯出工具即使在最終備援也失敗時，仍可重建主要失敗情況。

當每個候選項目都失敗時，OpenClaw 會擲回 `FallbackSummaryError`。外層回覆執行器可藉此建立更明確的訊息，例如「所有模型目前都受到速率限制」，並在已知時納入最快的冷卻期結束時間。

該冷卻摘要會考量模型：

- 對嘗試的供應商/模型鏈而言，不相關的模型範圍速率限制會被忽略
- 如果剩餘的封鎖是相符的模型範圍速率限制，OpenClaw 會回報最後一個仍封鎖該模型的相符到期時間

## 相關設定

請參閱[閘道設定](/zh-TW/gateway/configuration)，了解：

- `auth.profiles` / `auth.order`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

請參閱[模型](/zh-TW/concepts/models)，了解更廣泛的模型選擇與備援概覽。
