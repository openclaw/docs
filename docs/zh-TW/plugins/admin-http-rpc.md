---
read_when:
    - 建置無法使用閘道 WebSocket RPC 用戶端的主機工具
    - 透過受信任的私人入口公開閘道管理自動化功能
    - 稽核透過 HTTP 存取閘道方法的安全性模型
summary: 透過內建且需選擇啟用的 admin-http-rpc 外掛，公開選定的閘道控制平面方法
title: 管理員 HTTP RPC 外掛
x-i18n:
    generated_at: "2026-07-12T14:39:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

隨附的 `admin-http-rpc` 外掛會透過 HTTP 公開一組允許清單中的閘道控制平面方法，供無法持續開啟閘道 WebSocket 連線的受信任主機自動化工具使用。

此外掛隨 OpenClaw 一併提供，但預設為停用；停用時不會註冊此路由。啟用後，它會在與閘道相同的監聽器上新增 `POST /api/v1/admin/rpc`（`http://<gateway-host>:<port>/api/v1/admin/rpc`）。

僅可為私人主機工具、tailnet 自動化或受信任的內部入口啟用此外掛。絕不可將此路由直接公開至公用網際網路。

## 啟用前須知

管理 HTTP RPC 是完整的操作員控制平面介面：任何通過閘道 HTTP 驗證的呼叫端，都能叫用下列允許清單中的方法。僅在符合以下所有條件時啟用：

- 呼叫端受信任，可操作閘道。
- 呼叫端無法使用 WebSocket RPC 用戶端。
- 此路由只能透過回送介面、tailnet 或經驗證的私人入口存取。
- 你已檢閱允許的方法，且這些方法符合你計畫執行的自動化作業。

對於可持續開啟閘道 WebSocket 連線的 OpenClaw 用戶端與互動式工具，請改用 WebSocket RPC。

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

不再需要此 HTTP 介面時，請將其停用：

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## 驗證路由

使用 `health` 作為最小且安全的請求：

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

成功回應會包含 `ok: true`：

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

停用此外掛時，由於路由未註冊，因此會傳回 `404`。

## 驗證

此外掛路由使用閘道 HTTP 驗證。

常見的驗證方式：

- 共用祕密驗證（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
- 攜帶受信任身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：透過已設定的身分感知 Proxy 路由，並由其注入必要的身分標頭
- 私人入口開放驗證（`gateway.auth.mode="none"`）：不需要驗證標頭

## 安全性模型

請將此外掛視為完整的閘道操作員介面。

- 啟用此外掛會刻意在 `/api/v1/admin/rpc` 提供允許清單中的管理 RPC 方法。
- 此外掛宣告保留的 `contracts.gatewayMethodDispatch: ["authenticated-request"]` manifest 合約，讓其通過閘道驗證的 HTTP 路由可在程序內分派控制平面方法。這不是沙箱：此合約可防止意外使用保留的 SDK 輔助函式，但受信任的外掛仍會在閘道程序中執行。
- 共用祕密 Bearer 驗證（`token`/`password` 模式）會證明呼叫端持有閘道操作員祕密；此路徑會忽略範圍較窄的 `x-openclaw-scopes` 標頭，並恢復一般的完整操作員預設權限。
- 攜帶受信任身分的 HTTP 驗證（`trusted-proxy` 模式）會在提供 `x-openclaw-scopes` 時予以採用。
- 如果啟用此外掛，`gateway.auth.mode="none"` 表示此路由未經驗證。僅可在你完全信任的私人入口後方使用此模式。
- 此外掛路由通過驗證後，請求會透過與 WebSocket RPC 相同的閘道方法處理常式與範圍檢查進行分派。
- 在已準備的暫停租約期間，此路由仍可存取。有限制的請求驗證與本機 `commands.list` 探索回應仍然可用。在分派至閘道的方法中，僅有 `gateway.suspend.prepare`、`gateway.suspend.status` 和 `gateway.suspend.resume` 可在停止接收請求時執行；其他允許清單中的方法會傳回一般可重試的閘道 `UNAVAILABLE` 回應。
- 請將此路由限制於回送介面、tailnet 或受信任的私人入口。請勿將其直接公開至公用網際網路。當呼叫端跨越信任邊界時，請使用不同的閘道。

## 請求

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

預設請求本文大小上限為 1 MB。

## 回應

成功回應使用閘道 RPC 格式：

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

閘道方法錯誤使用：

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
- 任務：`tasks.list`、`tasks.get`、`tasks.cancel`
- 診斷：`doctor.memory.status`、`update.status`

其他閘道方法會保持封鎖，直到有意將其加入為止。

## WebSocket 比較

一般的閘道 WebSocket RPC 路徑仍是 OpenClaw 用戶端的首選控制平面 API。僅限需要請求／回應式 HTTP 介面的主機工具使用管理 HTTP RPC。

沒有受信任裝置身分的共用 Token WebSocket 用戶端，無法在連線時自行宣告管理範圍。管理 HTTP RPC 刻意遵循既有的受信任 HTTP 操作員模型：啟用此外掛後，共用祕密 Bearer 驗證會被視為此管理介面的完整操作員存取權。

## 疑難排解

`404 Not Found`

: 此外掛已停用、閘道在啟用此外掛後尚未重新啟動，或請求送往了不同的閘道程序。

`401 Unauthorized`

: 請求未通過閘道 HTTP 驗證。請檢查 Bearer Token 或 trusted-proxy 身分標頭。

`405 Method Not Allowed`

: 請求使用了 `POST` 以外的方法。

`413 Payload Too Large`

: 請求本文超過 1 MB 上限。

`400 INVALID_REQUEST`

: 請求本文不是有效的 JSON、缺少 `method` 欄位、方法不在此外掛的允許清單中，或暫停恢復 ID 與使用中的租約不符。

`503 UNAVAILABLE`

: 閘道方法正在啟動、受到速率限制、已暫停，或正在等待競爭中的暫停／恢復作業。若有 `error.details`，請加以檢查，並在重試前遵循 `error.retryAfterMs`。

## 相關內容

- [操作員範圍](/zh-TW/gateway/operator-scopes)
- [閘道安全性](/zh-TW/gateway/security)
- [遠端存取](/zh-TW/gateway/remote)
- [外掛 manifest](/zh-TW/plugins/manifest#contracts-reference)
- [SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
