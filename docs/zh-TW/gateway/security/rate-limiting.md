---
read_when:
    - 用戶端看到 `rate limit exceeded for <method>`、`AUTH_RATE_LIMITED` 或鎖定錯誤
    - 你想要調整 `gateway.auth.rateLimit`
    - 你正在思考暴露於外部的閘道所需的暴力破解防護措施
    - 你需要知道哪些閘道介面受到流量限制，以及其限制為何
summary: 所有閘道速率限制的參考資料：驗證前鎖定、瀏覽器與網路鉤子節流、控制平面寫入保護機制、ACP 工作階段上限，以及重新啟動冷卻時間
title: 速率限制
x-i18n:
    generated_at: "2026-07-19T13:48:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7aa37b65347610bedfb1db8f661e7ba75ef3cdfed0ba73c4ce53d80acace1e48
    source_path: gateway/security/rate-limiting.md
    workflow: 16
---

閘道會強制執行數個彼此獨立的速率限制。它們保護不同的
邊界、依不同的身分作為索引鍵，並以不同的錯誤格式回報失敗。
本頁是所有這些限制的參考文件。

概覽：

| 介面                                | 限制（預設）                     | 索引依據                         | 可設定                   |
| ----------------------------------- | -------------------------------- | -------------------------------- | ------------------------ |
| 認證失敗（權杖／密碼／裝置）        | 60 秒內失敗 10 次，鎖定 5 分鐘   | IP + 認證資訊範圍                | `gateway.auth.rateLimit` |
| 瀏覽器來源的 WS 認證失敗            | 相同，回送位址**不**豁免         | IP，或來自回送位址的頁面來源     | `gateway.auth.rateLimit` |
| 網路鉤子（`/hooks`）認證失敗 | 60 秒內失敗 20 次，鎖定 60 秒    | IP                               | 否                       |
| 控制平面寫入 RPC                     | 每個方法 60 秒內 30 個請求       | 方法 + 裝置 + IP                 | 否                       |
| ACP 工作階段建立                     | 10 秒內 120 個工作階段            | 轉譯器執行個體                   | 內部                     |
| 閘道重新啟動週期                     | 重新啟動之間有 30 秒冷卻時間     | 程序                             | 否                       |

## 認證嘗試（認證前）

在處理任何請求之前，會依每個用戶端 IP 限制失敗的認證嘗試。
這是暴露於外部的閘道用來防範暴力破解的保護機制。

- 只有_錯誤的_認證資訊會計數。缺少認證資訊（從未
  傳送權杖的用戶端）和成功的認證都不會耗用配額；成功認證會重設
  該 IP 的計數器。
- 預設值：每 60 秒可失敗 10 次，之後該 IP 會被鎖定 5 分鐘。
- 回送位址（`127.0.0.1` / `::1`）預設豁免，因此本機命令列介面工作階段
  不會遭到鎖定。
- 計數器依認證資訊類別劃分範圍，因此針對某個介面的洪水攻擊
  不會排擠其他介面。範圍包括共用的閘道權杖／密碼、裝置權杖、
  節點配對、已配對節點的重新核准、裝置啟動權杖，以及 watchOS
  挑戰簽發。

鎖定期間，連線嘗試會失敗並回傳：

```json
{
  "code": "INVALID_REQUEST",
  "message": "unauthorized: too many failed authentication attempts (retry later)",
  "retryable": true,
  "retryAfterMs": 297000,
  "details": {
    "code": "AUTH_RATE_LIMITED",
    "authReason": "rate_limited",
    "recommendedNextStep": "wait_then_retry"
  }
}
```

鎖定期間，來自其他 IP（包括回送位址）的嘗試不受影響。

可在 `openclaw.json` 的 `gateway.auth.rateLimit` 下調整：

```json
{
  "gateway": {
    "auth": {
      "rateLimit": {
        "maxAttempts": 10,
        "windowMs": 60000,
        "lockoutMs": 300000,
        "exemptLoopback": true
      }
    }
  }
}
```

閘道日誌中重複出現 `AUTH_RATE_LIMITED` 項目，表示有人正在
猜測認證資訊；請參閱[暴露處置手冊](/zh-TW/gateway/security/exposure-runbook)。

### 瀏覽器來源連線

帶有瀏覽器 `Origin` 標頭的 WebSocket 連線會使用相同的
限制，但回送位址豁免**一律關閉**——本機瀏覽器中的惡意頁面仍是
不受信任的用戶端，因此 localhost 在此路徑不享有豁免。當這類連線
_來自_回送位址時，其失敗會依正規化後的頁面來源（例如
`browser-origin:https://evil.example`）作為索引鍵，而非共用的回送 IP，
因此每個來源都有自己的配額區；若來自非回送位址，索引鍵
仍為用戶端 IP。此行為不可設定。

### 網路鉤子

HTTP `/hooks` 輸入端有自己的失敗限制器：每個用戶端 IP
在 60 秒內認證失敗 20 次後，會鎖定 60 秒。回送位址不豁免。
網路鉤子認證成功會重設計數器。遭限流的請求會收到純 HTTP
`429 Too Many Requests`，並帶有 `Retry-After` 標頭（秒）。
限制為固定值；若合法整合觸發此限制，應修正其認證資訊，而不是
更頻繁地重試。

## 控制平面寫入（認證後的後備防護）

寫入端管理 RPC（`config.apply`、`config.patch`、`plugins.install`、
`plugins.setEnabled`、`plugins.uninstall`、`update.run`、`worktrees.*`、
`gateway.restart.request`，……）在授權**之後**還會受到額外的速率限制：
每個 `deviceId+clientIp`、每個方法在 60 秒內可發出 30 個請求。

這不是安全邊界——呼叫端已持有 `operator.admin`——而是一道
後備防護，用來限制失控的用戶端或代理程式迴圈反覆轟炸高成本操作。
互動式使用不會觸及此限制；每個方法都有自己的配額區，因此切換
外掛不會耗用設定寫入的配額。

超出限制時，請求會失敗並回傳可重試的錯誤：

```json
{
  "code": "UNAVAILABLE",
  "message": "rate limit exceeded for config.patch; retry after 35s",
  "retryable": true,
  "retryAfterMs": 34539,
  "details": { "method": "config.patch", "limit": "30 per 60s" }
}
```

用戶端應遵循 `retryAfterMs`。此限制為固定值（不可設定）；
配額區會自行到期，並由閘道維護作業清除。

## ACP 工作階段建立

ACP 轉譯器會將每個轉譯器執行個體建立工作階段的速率限制為：
每 10 秒最多 120 個新工作階段。超出限制時，請求會失敗，且錯誤
訊息會包含等待時間（此路徑沒有結構化的 `retryAfterMs`
欄位）：

```
ACP 工作階段建立速率超出 <method> 的限制；請在 <n> 秒後重試。
```

這會限制不斷循環建立工作階段的失控用戶端；一般 IDE 和
代理程式的使用量遠低於此限制。

## 重新啟動冷卻時間

閘道重新啟動請求會先合併，接著強制執行重新啟動週期之間 30 秒的
冷卻時間。在冷卻期間提出的重新啟動請求不會遭拒，而是排定在
冷卻時間結束後執行。這與上方的控制平面限制器彼此獨立：
`gateway.restart.request` 會耗用一個控制平面配額名額，_而且_
由此產生的重新啟動也會遵守冷卻時間。

## 營運注意事項

- 所有限制器皆位於記憶體中，且以每個程序為單位；多個閘道不會
  共用狀態。替換閘道程序會清除由閘道擁有的計數器（認證鎖定、
  網路鉤子節流、控制平面配額區）。重新啟動冷卻時間刻意在程序內
  的重新啟動週期中持續存在——這正是它所限制的項目——且僅會隨
  程序重設。ACP 工作階段上限屬於其轉譯器執行個體，會在該執行個體
  重新建立時重設，而不會在閘道重新啟動時重設。
- 配額區對應表有大小上限（硬性項目上限加上定期清除），因此
  唯一索引鍵洪水攻擊無法讓記憶體無限制成長。
- 當用戶端位於反向 Proxy 後方時，有效 IP 是解析後的用戶端 IP；
  如需了解 Proxy 標頭在影響有效 IP 前如何進行驗證，請參閱
  [受信任 Proxy 認證](/zh-TW/gateway/trusted-proxy-auth)。
- 各介面的重試訊號有所不同：閘道 RPC 限制器會回傳
  `retryable: true` 加上 `retryAfterMs`，網路鉤子輸入端使用
  HTTP 429 與 `Retry-After` 標頭，而 ACP 則將等待時間嵌入
  錯誤訊息中。無論哪種情況，都應按指示的時間退避，而不是
  立即重試。
