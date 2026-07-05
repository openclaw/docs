---
read_when:
    - 建置無法使用閘道 WebSocket RPC 用戶端的主機工具
    - 透過私有受信任入口公開閘道管理自動化
    - 稽核對閘道方法進行 HTTP 存取的安全模型
summary: 透過隨附且選擇啟用的 admin-http-rpc 外掛公開選定的閘道控制平面方法
title: Admin HTTP RPC 外掛
x-i18n:
    generated_at: "2026-07-05T11:29:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 075135d2248acc859e60a72639350e16ed43785e9a353396fd47c3b02a4b0f5a
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

內建的 `admin-http-rpc` 外掛會透過 HTTP 暴露一組列入允許清單的閘道控制平面方法，供無法保持閘道 WebSocket 連線開啟的受信任主機自動化使用。

它會隨 OpenClaw 一起提供，但預設為停用；停用時，不會註冊此路由。啟用時，它會在與閘道相同的監聽器上新增 `POST /api/v1/admin/rpc`（`http://<gateway-host>:<port>/api/v1/admin/rpc`）。

只應為私有主機工具、tailnet 自動化，或受信任的內部入口啟用它。切勿將此路由直接暴露到公用網際網路。

## 啟用前

Admin HTTP RPC 是完整的操作員控制平面介面：任何通過閘道 HTTP 驗證的呼叫端都可以叫用下方列入允許清單的方法。只有在以下條件全部成立時才啟用它：

- 呼叫端受信任，可以操作閘道。
- 呼叫端無法使用 WebSocket RPC 用戶端。
- 此路由只能透過回送、tailnet，或私有且已驗證的入口存取。
- 你已審查允許的方法，且它們符合你計畫執行的自動化。

對於能保持閘道 WebSocket 連線開啟的 OpenClaw 用戶端和互動式工具，請改用 WebSocket RPC。

## 啟用

啟用內建外掛：

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

路由會在外掛啟動期間註冊，因此變更外掛設定後請重新啟動閘道。

不再需要 HTTP 介面時，請停用它：

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## 驗證路由

使用 `health` 作為最小的安全請求：

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

成功的回應會有 `ok: true`：

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

外掛停用時，此路由會傳回 `404`，因為它未被註冊。

## 驗證

此外掛路由使用閘道 HTTP 驗證。

常見驗證路徑：

- 共用密鑰驗證（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
- 帶有受信任身分的 HTTP 驗證（`gateway.auth.mode="trusted-proxy"`）：透過已設定的身分感知代理路由，並讓它注入必要的身分標頭
- 私有入口開放驗證（`gateway.auth.mode="none"`）：不需要驗證標頭

## 安全模型

請將此外掛視為完整的閘道操作員介面。

- 啟用此外掛會有意在 `/api/v1/admin/rpc` 提供對列入允許清單的管理 RPC 方法的存取權。
- 此外掛宣告保留的 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 資訊清單合約，這讓它已通過閘道驗證的 HTTP 路由能在處理程序內分派控制平面方法。這不是沙箱：此合約會防止意外使用保留的 SDK 輔助工具，但受信任的外掛仍會在閘道處理程序中執行。
- 共用密鑰 bearer 驗證（`token`/`password` 模式）證明持有閘道操作員密鑰；此路徑會忽略較窄的 `x-openclaw-scopes` 標頭，並還原正常的完整操作員預設值。
- 帶有受信任身分的 HTTP 驗證（`trusted-proxy` 模式）會在存在 `x-openclaw-scopes` 時採用它。
- `gateway.auth.mode="none"` 表示如果外掛已啟用，此路由不需要驗證。只應在你完全信任的私有入口後方使用。
- 外掛路由驗證通過後，請求會透過與 WebSocket RPC 相同的閘道方法處理常式和範圍檢查分派。
- 請將此路由保留在回送、tailnet，或私有受信任入口上。不要將它直接暴露到公用網際網路。呼叫端跨越信任邊界時，請使用個別的閘道。

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

- `id`（字串，選用）：複製到回應中。省略時會產生 UUID。
- `method`（字串，必填）：允許的閘道方法名稱。
- `params`（任何，選用）：方法專屬參數。

預設的最大請求本文大小為 1 MB。

## 回應

成功回應使用閘道 RPC 形狀：

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

HTTP 狀態會依錯誤碼而定：

| 錯誤碼                     | HTTP 狀態 |
| -------------------------- | --------- |
| `INVALID_REQUEST`          | 400       |
| `APPROVAL_NOT_FOUND`       | 404       |
| `NOT_LINKED`, `NOT_PAIRED` | 409       |
| `UNAVAILABLE`              | 503       |
| `AGENT_TIMEOUT`            | 504       |
| 任何其他碼                 | 500       |

## 允許的方法

- 探索：`commands.list`
  傳回此外掛允許的 HTTP RPC 方法名稱。
- 閘道：`health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- 設定：`config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- 頻道：`channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- 網頁：`web.login.start`, `web.login.wait`
- 模型：`models.list`, `models.authStatus`
- 代理：`agents.list`, `agents.create`, `agents.update`, `agents.delete`
- 核准：`exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- 排程：`cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- 裝置：`device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- 節點：`node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- 任務：`tasks.list`, `tasks.get`, `tasks.cancel`
- 診斷：`doctor.memory.status`, `update.status`

其他閘道方法會被封鎖，直到它們被有意加入。

## WebSocket 比較

一般閘道 WebSocket RPC 路徑仍是 OpenClaw 用戶端偏好的控制平面 API。只有在主機工具需要請求/回應式 HTTP 介面時，才使用 Admin HTTP RPC。

沒有受信任裝置身分的共用權杖 WebSocket 用戶端，無法在連線時自行宣告管理範圍。Admin HTTP RPC 會刻意沿用既有的受信任 HTTP 操作員模型：外掛啟用時，共用密鑰 bearer 驗證會被視為此管理介面的完整操作員存取權。

## 疑難排解

`404 Not Found`

: 外掛已停用、閘道在啟用後尚未重新啟動，或請求被送到不同的閘道處理程序。

`401 Unauthorized`

: 請求未滿足閘道 HTTP 驗證。請檢查 bearer 權杖或 trusted-proxy 身分標頭。

`405 Method Not Allowed`

: 請求使用了 `POST` 以外的方法。

`413 Payload Too Large`

: 請求本文超過 1 MB 限制。

`400 INVALID_REQUEST`

: 請求本文不是有效的 JSON、缺少 `method` 欄位，或方法不在外掛允許清單中。

`503 UNAVAILABLE`

: 閘道方法處理常式無法使用。請檢查閘道記錄，並在閘道完成啟動後重試。

## 相關

- [操作員範圍](/zh-TW/gateway/operator-scopes)
- [閘道安全性](/zh-TW/gateway/security)
- [遠端存取](/zh-TW/gateway/remote)
- [外掛資訊清單](/zh-TW/plugins/manifest#contracts-reference)
- [SDK 子路徑](/zh-TW/plugins/sdk-subpaths)
