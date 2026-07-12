---
read_when:
    - 建置無法使用閘道 WebSocket RPC 用戶端的主機工具
    - 透過受信任的私人入口公開閘道管理自動化功能
    - 稽核透過 HTTP 存取閘道方法的安全模型
summary: 透過內建且需選擇啟用的 admin-http-rpc 外掛，公開選定的閘道控制平面方法
title: 管理 HTTP RPC 外掛
x-i18n:
    generated_at: "2026-07-11T21:32:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

隨附的 `admin-http-rpc` 外掛會透過 HTTP 公開一組允許清單中的閘道控制層方法，供無法保持閘道 WebSocket 連線開啟的受信任主機自動化工具使用。

此外掛隨 OpenClaw 提供，但預設為停用；停用時不會註冊路由。啟用後，它會在與閘道相同的接聽器上新增 `POST /api/v1/admin/rpc`（`http://<gateway-host>:<port>/api/v1/admin/rpc`）。

僅限私人主機工具、tailnet 自動化或受信任的內部入口啟用。此外，絕不可將此路由直接公開至公用網際網路。

## 啟用前注意事項

管理員 HTTP RPC 是完整的操作員控制層介面：任何通過閘道 HTTP 驗證的呼叫端，都能叫用下列允許清單中的方法。僅當以下所有條件都成立時，才啟用它：

- 呼叫端受信任，可操作閘道。
- 呼叫端無法使用 WebSocket RPC 用戶端。
- 此路由只能透過 local loopback、tailnet 或已驗證的私人入口存取。
- 你已檢閱允許的方法，且這些方法符合你計畫執行的自動化作業。

對於可保持閘道 WebSocket 連線開啟的 OpenClaw 用戶端與互動式工具，請改用 WebSocket RPC。

## 啟用

啟用隨附的外掛：

<Tabs>
  <Tab title="命令列介面">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="設定">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

此路由會在外掛啟動期間註冊，因此變更外掛設定後，請重新啟動閘道。

不再需要 HTTP 介面時，請將其停用：

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## 驗證路由

使用 `health` 作為最精簡且安全的要求：

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

成功的回應會包含 `ok: true`：

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

外掛停用時，由於路由未註冊，因此會傳回 `404`。

## 驗證

此外掛路由使用閘道 HTTP 驗證。

常見的驗證方式：

- 共用密鑰驗證（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
- 攜帶受信任身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：透過已設定且可識別身分的 Proxy 路由，並由其注入必要的身分標頭
- 私人入口的開放式驗證（`gateway.auth.mode="none"`）：不需要驗證標頭

## 安全性模型

請將此外掛視為完整的閘道操作員介面。

- 啟用此外掛即表示刻意在 `/api/v1/admin/rpc` 提供允許清單中的管理員 RPC 方法存取權。
- 此外掛宣告保留的 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 資訊清單契約，讓其經閘道驗證的 HTTP 路由能在程序內分派控制層方法。這不是沙箱：此契約可防止誤用保留的 SDK 輔助工具，但受信任的外掛仍會在閘道程序中執行。
- 共用密鑰持有人驗證（`token`/`password` 模式）可證明呼叫端持有閘道操作員密鑰；此路徑會忽略權限較窄的 `x-openclaw-scopes` 標頭，並還原一般的完整操作員預設權限。
- 攜帶受信任身分的 HTTP 驗證（`trusted-proxy` 模式）會在 `x-openclaw-scopes` 存在時遵循其設定。
- 若啟用此外掛，`gateway.auth.mode="none"` 表示此路由未經驗證。僅可在你完全信任的私人入口之後使用此設定。
- 外掛路由通過驗證後，要求會透過與 WebSocket RPC 相同的閘道方法處理常式及範圍檢查進行分派。
- 在已準備的暫停租約期間，此路由仍可存取。有限制的要求驗證與本機 `commands.list` 探索回應仍然可用。在分派至閘道的方法中，當接納功能關閉時，只有 `gateway.suspend.prepare`、`gateway.suspend.status` 和 `gateway.suspend.resume` 可以執行；其他允許清單中的方法會傳回一般可重試的閘道 `UNAVAILABLE` 回應。
- 請將此路由限制在 local loopback、tailnet 或受信任的私人入口上。請勿將其直接公開至公用網際網路。當呼叫端跨越信任邊界時，請使用不同的閘道。

## 要求

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

欄位：

- `id`（字串，選填）：複製至回應中。省略時會產生 UUID。
- `method`（字串，必填）：允許的閘道方法名稱。
- `params`（任意型別，選填）：方法專用的參數。

預設的要求本文大小上限為 1 MB。

## 回應

成功回應會使用閘道 RPC 格式：

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

閘道方法錯誤會使用：

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

HTTP 狀態會依循錯誤代碼：

| 錯誤代碼                   | HTTP 狀態 |
| -------------------------- | --------- |
| `INVALID_REQUEST`          | 400       |
| `APPROVAL_NOT_FOUND`       | 404       |
| `NOT_LINKED`, `NOT_PAIRED` | 409       |
| `UNAVAILABLE`              | 503       |
| `AGENT_TIMEOUT`            | 504       |
| 任何其他代碼               | 500       |

## 允許的方法

- 探索：`commands.list`
  傳回此外掛允許的 HTTP RPC 方法名稱。
- 閘道：`health`、`status`、`logs.tail`、`usage.status`、`usage.cost`、`gateway.restart.request`、`gateway.suspend.prepare`、`gateway.suspend.status`、`gateway.suspend.resume`
- 設定：`config.get`、`config.schema`、`config.schema.lookup`、`config.set`、`config.patch`、`config.apply`
- 頻道：`channels.status`、`channels.start`、`channels.stop`、`channels.logout`
- 網頁：`web.login.start`、`web.login.wait`
- 模型：`models.list`、`models.authStatus`
- 代理程式：`agents.list`、`agents.create`、`agents.update`、`agents.delete`
- 核准：`exec.approvals.get`、`exec.approvals.set`、`exec.approvals.node.get`、`exec.approvals.node.set`
- 排程：`cron.status`、`cron.list`、`cron.get`、`cron.runs`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`
- 裝置：`device.pair.list`、`device.pair.approve`、`device.pair.reject`、`device.pair.remove`
- 節點：`node.list`、`node.describe`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.rename`
- 工作：`tasks.list`、`tasks.get`、`tasks.cancel`
- 診斷：`doctor.memory.status`、`update.status`

其他閘道方法會遭封鎖，直到刻意將其加入為止。

## WebSocket 比較

對 OpenClaw 用戶端而言，一般的閘道 WebSocket RPC 路徑仍是建議使用的控制層 API。只有需要要求／回應 HTTP 介面的主機工具才應使用管理員 HTTP RPC。

沒有受信任裝置身分的共用權杖 WebSocket 用戶端，無法在連線時自行宣告管理員範圍。管理員 HTTP RPC 刻意遵循既有的受信任 HTTP 操作員模型：啟用此外掛後，共用密鑰持有人驗證會被視為擁有此管理員介面的完整操作員存取權。

## 疑難排解

`404 Not Found`

: 外掛已停用、閘道在啟用後尚未重新啟動，或要求被傳送至其他閘道程序。

`401 Unauthorized`

: 要求未通過閘道 HTTP 驗證。請檢查持有人權杖或 trusted-proxy 身分標頭。

`405 Method Not Allowed`

: 要求使用了 `POST` 以外的方法。

`413 Payload Too Large`

: 要求本文超過 1 MB 限制。

`400 INVALID_REQUEST`

: 要求本文不是有效的 JSON、缺少 `method` 欄位、方法不在外掛允許清單中，或暫停恢復 ID 與有效租約不符。

`503 UNAVAILABLE`

: 閘道方法正在啟動、受到速率限制、處於暫停狀態，或正在等待另一個互相衝突的暫停／恢復作業。若有 `error.details`，請檢查其內容，並在重試前遵循 `error.retryAfterMs`。

## 相關內容

- [操作員範圍](/zh-TW/gateway/operator-scopes)
- [閘道安全性](/zh-TW/gateway/security)
- [遠端存取](/zh-TW/gateway/remote)
- [外掛資訊清單](/zh-TW/plugins/manifest#contracts-reference)
- [SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
