---
read_when:
    - 診斷驗證設定檔輪換、冷卻時間或模型備援行為
    - 更新驗證設定檔或模型的容錯移轉規則
    - 了解工作階段模型覆寫如何與後援重試互動
sidebarTitle: Model failover
summary: OpenClaw 如何輪替驗證設定檔並在模型之間 fallback
title: 模型容錯移轉
x-i18n:
    generated_at: "2026-07-05T11:14:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw 會分兩個階段處理失敗：

1. **Auth profile 輪替**，在目前供應商內進行。
2. **模型備援**，切換到 `agents.defaults.model.fallbacks` 中的下一個模型。

## 執行階段流程

<Steps>
  <Step title="解析工作階段狀態">
    解析作用中的工作階段模型與 auth-profile 偏好設定。
  </Step>
  <Step title="建立候選鏈">
    從目前的模型選擇，以及該選擇來源的備援政策，建立模型候選鏈。已設定的預設值、cron 工作主要模型，以及自動選取的備援模型可以使用已設定的備援；明確的使用者工作階段選擇則是嚴格的。
  </Step>
  <Step title="嘗試目前供應商">
    依照 auth-profile 輪替/冷卻規則嘗試目前供應商。
  </Step>
  <Step title="遇到值得容錯移轉的錯誤時前進">
    如果該供應商因值得容錯移轉的錯誤而耗盡，移至下一個模型候選。
  </Step>
  <Step title="持久化備援覆寫">
    在重試開始前持久化選取的備援覆寫，讓其他工作階段讀取器看到執行器即將使用的相同供應商/模型。持久化的模型覆寫會標記為 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="失敗時狹義回復">
    如果備援候選失敗，只有當備援擁有的工作階段覆寫欄位仍符合該失敗候選時，才回復這些欄位。
  </Step>
  <Step title="耗盡時擲出 FallbackSummaryError">
    如果每個候選都失敗，擲出 `FallbackSummaryError`，其中包含每次嘗試的詳細資訊，以及已知時最早的冷卻到期時間。
  </Step>
</Steps>

這刻意比「儲存並還原整個工作階段」更狹義。回覆執行器只會持久化它為備援所擁有的模型選擇欄位：`providerOverride`、`modelOverride`、`modelOverrideSource`、`authProfileOverride`、`authProfileOverrideSource`、`authProfileOverrideCompactionCount`。這可防止失敗的備援重試覆寫較新的無關工作階段變更，例如手動 `/model` 變更，或嘗試執行期間發生的工作階段輪替更新。

## 選擇來源政策

選擇來源會控制是否允許使用備援鏈：

- **已設定的預設值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **代理主要模型**：`agents.list[].model` 預設為嚴格，除非該代理的模型物件包含自己的 `fallbacks`。使用 `fallbacks: []` 可明確表示嚴格行為，或使用非空清單讓該代理選擇加入模型備援。
- **自動備援覆寫**：執行階段備援會在重試前寫入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"`，以及選取的來源模型。此覆寫會持續沿著已設定的備援鏈前進，而不會在每則訊息都探測主要模型，但 OpenClaw 每 5 分鐘探測一次已設定的來源（不可設定），並在其復原後清除此覆寫。`/new`、`/reset` 和 `sessions.reset` 也會清除自動來源覆寫。在沒有明確 `heartbeat.model` 的情況下執行的心跳偵測，當其來源不再符合目前已設定的預設值時，會清除直接自動覆寫。
- **使用者工作階段覆寫**：`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會寫入 `modelOverrideSource: "user"`。這是精確的工作階段選擇。如果選取的供應商/模型在產生回覆前失敗，OpenClaw 會回報失敗，而不是從無關的已設定備援回答。
- **舊版工作階段覆寫**：較舊的工作階段項目可能有 `modelOverride`，但沒有 `modelOverrideSource`。OpenClaw 會將這些視為使用者覆寫，因此明確的舊選擇不會被靜默轉換成備援行為。
- **Cron 承載模型**：cron 工作的 `payload.model` / `--model` 是工作主要模型，不是使用者工作階段覆寫。除非工作提供 `payload.fallbacks`，否則它會使用已設定的備援；`payload.fallbacks: []` 會讓 cron 執行變為嚴格。

OpenClaw 會依工作階段與主要模型記住最近的主要探測，因此失敗的主要模型不會在每一輪都重試。當工作階段移至備援時，它會傳送可見通知；當它返回選取的主要模型時，會傳送另一則通知；它不會在每個黏著備援輪次都重複通知。

## Auth 失敗略過快取

預設情況下，每個新輪次都會保留既有的備援重試行為：OpenClaw 會再次重試每個已設定的備援候選，包括最近因 `auth` 或 `auth_permanent` 失敗的非主要候選。

使用以下設定選擇加入，以抑制重複的 auth 失敗：

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

啟用後，OpenClaw 會在非主要備援候選發生 auth 類別失敗後，記錄一個記憶體內、工作階段範圍的略過標記，索引鍵由工作階段 ID、供應商和模型組成。主要候選永遠不會被略過，因此明確的使用者模型選擇仍會呈現真實的 auth 錯誤。此快取是程序本機的，會在閘道重新啟動時清除。

此值是以毫秒為單位的 TTL。`0` 或未設定會停用快取。正值會限制在 1 秒到 10 分鐘之間。

## 使用者可見的備援通知

當工作階段移至自動選取的備援時，OpenClaw 會在相同回覆表面傳送狀態通知：

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

當稍後的探測成功，且工作階段返回選取的主要模型時，OpenClaw 會傳送：

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

這些通知是作業訊息，不是助理內容。它們會在每次狀態變更時傳遞一次，包括可行時只有副作用的輪次，但黏著備援輪次不會重複傳送。傳遞會繞過一般來源回覆抑制，不會消耗串接頻道的第一個助理回覆槽，且會排除於文字轉語音和承諾擷取之外。

## Auth 儲存（金鑰 + OAuth）

OpenClaw 對 API 金鑰和 OAuth 權杖都使用 **auth profiles**。

- 機密與執行階段 auth 路由狀態位於 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。
- 設定 `auth.profiles` / `auth.order` **僅為中繼資料 + 路由**（不含機密）。
- 舊版僅匯入 OAuth 檔案：`~/.openclaw/credentials/oauth.json`（首次使用時匯入每個代理的 auth 儲存）。
- 舊版 `auth-profiles.json`、`auth-state.json`，以及每個代理的 `auth.json` 檔案會由 `openclaw doctor --fix` 匯入。

更多細節：[OAuth](/zh-TW/concepts/oauth)

憑證類型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（部分供應商另有 `projectId`/`enterpriseUrl`）
- `type: "token"` → 靜態 bearer 風格權杖，可選擇性到期；OpenClaw 不會重新整理它（用於 `aws-sdk` 和其他憑證鏈 auth 模式）

## Profile ID

OAuth 登入會建立不同的 profile，讓多個帳戶可以共存。

- 預設：沒有可用電子郵件時使用 `provider:default`。
- 具電子郵件的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

Profile 位於每個代理的 `openclaw-agent.sqlite` auth profile 儲存中。

## 輪替順序

當供應商有多個 profile 時，OpenClaw 會依以下方式選擇順序：

<Steps>
  <Step title="明確設定">
    `auth.order[provider]`（若已設定）。
  </Step>
  <Step title="已設定的 profile">
    依供應商篩選的 `auth.profiles`。
  </Step>
  <Step title="已儲存的 profile">
    該供應商在每個代理 SQLite auth profile 中的項目。
  </Step>
</Steps>

如果未設定明確順序，OpenClaw 會使用輪詢順序：

- **主要鍵：** profile 類型（**OAuth，接著靜態權杖，接著 API 金鑰**）。
- **次要鍵：** `usageStats.lastUsed`（每種類型內最舊者優先）。
- **冷卻/停用的 profile** 會移至末尾，依最早到期排序。

### 工作階段黏著性（快取友善）

OpenClaw 會**依工作階段釘選選取的 auth profile**，以維持供應商快取熱度。它**不會**在每個請求都輪替。釘選的 profile 會重複使用，直到：

- 工作階段被重設（`/new` / `/reset`）
- 壓縮完成（壓縮計數遞增）
- profile 處於冷卻/停用狀態

透過 `/model …@<profileId>` 手動選擇會為該工作階段設定**使用者覆寫**，且在新工作階段開始前不會自動輪替。

<Note>
自動釘選的 profile（由工作階段路由器選取）會被視為**偏好設定**：它們會先被嘗試，但 OpenClaw 可能在速率限制/逾時時輪替到另一個 profile。當原始 profile 再次可用時，新的執行可以再次偏好它，而不變更選取的模型或執行階段。使用者釘選的 profile 會鎖定在該 profile；如果它失敗且已設定模型備援，OpenClaw 會移至下一個模型，而不是切換 profile。
</Note>

### OpenAI Codex 訂閱加上 API 金鑰備份

對於 OpenAI 代理模型，auth 與執行階段是分開的。`openai/gpt-*` 會留在 Codex harness 上，而 auth 可以在 Codex 訂閱 profile 與 OpenAI API 金鑰備份之間輪替。

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

對 ChatGPT/Codex OAuth profile 和 OpenAI API 金鑰 profile 都使用 `openai:*`。當訂閱達到 Codex 用量限制時，OpenClaw 會在 Codex 提供精確重設時間時記錄該時間，嘗試下一個已排序的 auth profile，並讓執行留在 Codex harness 內。重設時間過後，訂閱 profile 會再次符合資格，下一次自動選擇即可返回它。

只有在你想為該工作階段強制使用某個帳戶/金鑰時，才使用使用者釘選的 profile。使用者釘選的 profile 會刻意保持嚴格，不會靜默跳到另一個 profile。

## 冷卻

當 profile 因 auth/速率限制錯誤（或看起來像速率限制的逾時）而失敗時，OpenClaw 會將它標記為冷卻，並移至下一個 profile。

<AccordionGroup>
  <Accordion title="哪些會落入速率限制 / 逾時桶">
    該速率限制桶比單純的 `429` 更廣：它也包含供應商訊息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及週期性用量視窗限制，例如 `weekly limit reached` 或 `monthly limit exhausted`。

    格式/無效請求錯誤通常是終止性的，因為重試相同承載會以相同方式失敗，所以 OpenClaw 會呈現這些錯誤，而不是輪替 auth profile。已知的重試修復路徑可以明確選擇加入：例如 Cloud Code Assist 工具呼叫 ID 驗證失敗會經過清理，並透過 `allowFormatRetry` 政策重試一次。OpenAI 相容的停止原因錯誤，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，會分類為逾時/容錯移轉訊號。

    當來源符合已知暫時性模式時，一般伺服器文字也可能落入該逾時桶。例如，裸模型執行階段串流包裝器訊息 `An unknown error occurred` 會對每個供應商視為值得容錯移轉，因為共用模型執行階段在供應商串流以 `stopReason: "aborted"` 或 `stopReason: "error"` 結束且沒有具體細節時會發出它。含有暫時性伺服器文字的 JSON `api_error` 承載，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也會被視為值得容錯移轉的逾時。

    OpenRouter 專屬的一般上游文字，例如裸 `Provider returned error`，只有在供應商脈絡確實是 OpenRouter 時，才會被視為逾時。一般內部備援文字，例如 `LLM request failed with an unknown error.`，會保持保守，本身不會觸發容錯移轉。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    否則，某些提供者 SDK 可能會先休眠一段很長的 `Retry-After` 時窗，才把控制權交還給 OpenClaw。對於 Anthropic 和 OpenAI 等以 Stainless 為基礎的 SDK，OpenClaw 預設會將 SDK 內部的 `retry-after-ms` / `retry-after` 等待時間限制在 60 秒，並立即浮現較長的可重試回應，讓此容錯移轉路徑可以執行。可用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 調整或停用此上限；請參閱[重試行為](/zh-TW/concepts/retry)。
  </Accordion>
  <Accordion title="模型範圍的冷卻">
    速率限制冷卻也可以限定於模型範圍：

    - 當失敗模型 ID 已知時，OpenClaw 會為速率限制失敗記錄 `cooldownModel`。
    - 當冷卻範圍限定於不同模型時，仍可嘗試同一提供者上的同層模型。
    - 帳務/已停用時窗仍會跨模型封鎖整個設定檔。

  </Accordion>
</AccordionGroup>

一般（非帳務、非永久驗證）冷卻會依設定檔近期錯誤次數擴大：

- 第 1 次失敗：30 秒
- 第 2 次失敗：1 分鐘
- 第 3 次以上失敗：5 分鐘（上限）

一旦設定檔的失敗時窗已過（`auth.cooldowns.failureWindowHours`，預設 24），計數器會重設。

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

## 帳務停用

帳務/額度失敗（例如 "insufficient credits" / "credit balance too low"）會被視為值得容錯移轉，但通常不是暫時性的。OpenClaw 不會套用短冷卻，而是將設定檔標記為**已停用**（並使用較長的退避），然後輪轉到下一個設定檔/提供者。

<Note>
並非所有類似帳務的回應都是 `402`，也不是每個 HTTP `402` 都會進入這裡。即使提供者改回傳 `401` 或 `403`，OpenClaw 仍會把明確的帳務文字保留在帳務路徑中，但提供者特定的比對器仍限定於擁有它們的提供者範圍內（例如 OpenRouter `403 Key limit exceeded`）。

同時，暫時性的 `402` 使用時窗與組織/工作區花費限制錯誤，在訊息看起來可重試時（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`），會被分類為 `rate_limit`。這些會留在短冷卻/容錯移轉路徑，而不是長帳務停用路徑。
</Note>

高可信度的永久驗證失敗（已撤銷/停用的金鑰、已停用的工作區）會進入類似的停用路徑，但因為某些提供者在事故期間會暫時浮現看似驗證問題的酬載，所以其恢復時間比帳務短得多。

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

| Key                           | Default | Purpose                                                                     |
| ----------------------------- | ------- | --------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5       | 基礎帳務退避，每次帳務失敗後加倍                                            |
| `billingMaxHours`             | 24      | 帳務退避上限                                                                |
| `authPermanentBackoffMinutes` | 10      | 高可信度永久驗證失敗的基礎退避                                              |
| `authPermanentMaxMinutes`     | 60      | 該退避的上限                                                                |
| `failureWindowHours`          | 24      | 如果此時窗內未發生失敗，失敗計數器會重設                                    |
| `overloadedProfileRotations`  | 1       | 過載時，在模型後援前允許的同提供者設定檔輪轉次數                            |
| `overloadedBackoffMs`         | 0       | 過載輪轉重試前的固定延遲                                                    |
| `rateLimitedProfileRotations` | 1       | 速率限制時，在模型後援前允許的同提供者設定檔輪轉次數                        |

過載與速率限制錯誤會比帳務冷卻更積極地處理：OpenClaw 預設允許一次同提供者驗證設定檔重試，然後不等待就切換到下一個已設定的模型後援。

## 模型後援

如果提供者的所有設定檔都失敗，OpenClaw 會移到 `agents.defaults.model.fallbacks` 中的下一個模型。這適用於驗證失敗、速率限制，以及已耗盡設定檔輪轉的逾時（其他錯誤不會推進後援）。未暴露足夠細節的提供者錯誤，仍會在後援狀態中被精確標示：`empty_response` 表示提供者未回傳可用訊息或狀態，`no_error_details` 表示提供者明確回傳 `Unknown error (no error details in response)`，而 `unclassified` 表示 OpenClaw 保留了原始預覽，但尚無分類器符合。

像 `ModelNotReadyException` 這類提供者忙碌訊號會落入過載類別，並遵循與速率限制相同的一次輪轉後即後援政策（請參閱上方的預設值表）。

當執行從已設定的預設主要模型、排程工作主要模型、具有明確後援的代理程式主要模型，或自動選取的後援覆寫開始時，OpenClaw 可以沿著相符的已設定後援鏈前進。沒有明確後援的代理程式主要模型，以及明確使用者選擇（例如 `/model ollama/qwen3.5:27b`、模型選擇器、`sessions.patch`，或一次性的命令列介面提供者/模型覆寫）則是嚴格的：如果該提供者/模型無法連線或在產生回覆前失敗，OpenClaw 會回報失敗，而不是用不相關的後援回答。

### 候選鏈規則

OpenClaw 會從目前要求的 `provider/model` 加上已設定的後援建立候選清單。

<AccordionGroup>
  <Accordion title="規則">
    - 要求的模型永遠排在第一。
    - 明確設定的後援會去重，但不會依模型允許清單過濾。它們會被視為明確的操作者意圖。
    - 如果目前執行已在同一提供者家族中的已設定後援上，OpenClaw 會繼續使用完整的已設定鏈。
    - 當未提供明確後援覆寫時，即使要求的模型使用不同提供者，也會先嘗試已設定後援，再嘗試已設定主要模型。
    - 當未向後援執行器提供明確後援覆寫時，已設定主要模型會附加在末尾，讓鏈在較早候選項耗盡後能回到一般預設值。
    - 當呼叫端提供 `fallbacksOverride` 時，執行器會精確使用要求的模型加上該覆寫清單。空清單會停用模型後援，並防止已設定主要模型作為隱藏重試目標被附加。

  </Accordion>
</AccordionGroup>

### 哪些錯誤會推進後援

<Tabs>
  <Tab title="會繼續於">
    - 驗證失敗
    - 速率限制與冷卻耗盡
    - 過載/提供者忙碌錯誤
    - 類似逾時的容錯移轉錯誤
    - 帳務停用
    - `LiveSessionModelSwitchError`，會被正規化為容錯移轉路徑，讓陳舊的持久化模型不會造成外層重試迴圈
    - 當仍有剩餘候選項時，其他無法辨識的錯誤

  </Tab>
  <Tab title="不會繼續於">
    - 非逾時/容錯移轉形態的明確中止
    - 應留在壓縮/重試邏輯內的脈絡溢位錯誤（例如 `request_too_large`、`input token count exceeds the maximum number of input tokens`、`input exceeds the maximum number of tokens`、`input too long for the model` 或 `ollama error: context length exceeded`）
    - 沒有候選項剩餘時的最終未知錯誤
    - Claude Fable 5 安全拒絕；直接 API 金鑰要求會改在提供者層級透過 Anthropic 伺服器端後援到 `claude-opus-4-8` 來處理（請參閱 [Anthropic](/zh-TW/providers/anthropic#safety-refusal-fallback-claude-fable-5)）

  </Tab>
</Tabs>

### 冷卻略過與探測行為

當提供者的每個驗證設定檔都已在冷卻中，OpenClaw 不會自動永遠略過該提供者。它會針對每個候選項做決策：

<AccordionGroup>
  <Accordion title="每個候選項的決策">
    - 持久驗證失敗會立即略過整個提供者。
    - 帳務停用通常會略過，但主要候選項仍可在節流下被探測，讓恢復無須重新啟動也能發生。
    - 主要候選項可在接近冷卻到期時被探測，並套用每個提供者的節流。
    - 當失敗看起來是暫時性的（`rate_limit`、`overloaded` 或未知）時，即使處於冷卻中，也可以嘗試同提供者的後援同層模型。當速率限制限定於模型範圍且同層模型可能立即恢復時，這尤其相關。
    - 暫時性冷卻探測在每次後援執行中每個提供者限一次，因此單一提供者不會拖慢跨提供者後援。

  </Accordion>
</AccordionGroup>

## 工作階段覆寫與即時模型切換

工作階段模型變更是共享狀態。作用中的執行器、`/model` 命令、壓縮/工作階段更新，以及即時工作階段調和，都會讀取或寫入同一工作階段項目的部分內容。

這表示後援重試必須與即時模型切換協調：

- 只有明確由使用者驅動的模型變更會標記待處理的即時切換。這包含 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系統驅動的模型變更，例如後援輪轉、心跳偵測覆寫或壓縮，本身絕不會標記待處理的即時切換。
- 使用者驅動的模型覆寫會被視為後援政策的精確選擇，因此無法連線的已選提供者會浮現為失敗，而不是被 `agents.defaults.model.fallbacks` 掩蓋。
- 在後援重試開始前，回覆執行器會將選取的後援覆寫欄位持久化到工作階段項目。
- 自動後援覆寫會在後續輪次保持選取，讓 OpenClaw 不會在每則訊息都探測已知失敗的主要模型。OpenClaw 會定期再次探測已設定來源，並在其恢復時清除自動覆寫；`/new`、`/reset` 和 `sessions.reset` 會立即清除自動來源的覆寫。
- 使用者回覆會在每次狀態變更時宣告一次後援轉換與後援清除恢復。黏著後援輪次不會重複通知。
- `/status` 會顯示選取的模型，且當後援狀態不同時，會顯示作用中的後援模型與原因。
- 即時工作階段調和會優先使用持久化工作階段覆寫，而不是陳舊的執行階段模型欄位。
- 如果即時切換錯誤指向作用中後援鏈中的較後候選項，OpenClaw 會直接跳到該選取模型，而不是先逐一走過不相關的候選項。
- 如果後援嘗試失敗，執行器只會回復它寫入的覆寫欄位，且僅在那些欄位仍符合該失敗候選項時才會回復。

這可避免典型競態：

<Steps>
  <Step title="主要模型失敗">
    選取的主要模型失敗。
  </Step>
  <Step title="在記憶體中選擇後援">
    後援候選項在記憶體中被選定。
  </Step>
  <Step title="工作階段儲存仍顯示舊主要模型">
    工作階段儲存仍反映舊的主要模型。
  </Step>
  <Step title="即時調和讀取陳舊狀態">
    即時工作階段調和讀取陳舊的工作階段狀態。
  </Step>
  <Step title="重試被拉回">
    在後援嘗試開始前，重試被拉回到舊模型。
  </Step>
</Steps>

持久化的後援覆寫會關閉該時窗，而狹窄的回復會保留較新的手動或執行階段工作階段變更。

## 可觀測性與失敗摘要

`runWithModelFallback(...)` 會記錄每次嘗試的詳細資料，供記錄檔與面向使用者的冷卻訊息使用：

- 已嘗試的供應商/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found`，以及類似的容錯移轉原因）
- 選用的狀態/代碼
- 人類可讀的錯誤摘要

結構化的 `model_fallback_decision` 記錄也會在候選項失敗、被略過，或稍後的備援成功時包含扁平的 `fallbackStep*` 欄位。這些欄位會明確表示已嘗試的轉換（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），因此記錄與診斷匯出器即使在最終備援也失敗時，仍可重建主要失敗。

當所有候選項都失敗時，OpenClaw 會拋出 `FallbackSummaryError`。外層回覆執行器可以使用它來建立更具體的訊息，例如「所有模型暫時都受到速率限制」，並在已知時包含最早的冷卻期到期時間。

該冷卻期摘要具備模型感知能力：

- 與已嘗試供應商/模型鏈無關、限定於模型範圍的速率限制會被忽略
- 如果剩餘封鎖是相符且限定於模型範圍的速率限制，OpenClaw 會回報仍封鎖該模型的最後一個相符到期時間

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

請參閱[模型](/zh-TW/concepts/models)，了解更廣泛的模型選擇與備援概觀。
