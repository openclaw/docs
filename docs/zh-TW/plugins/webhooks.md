---
read_when:
    - 您想從外部系統觸發或驅動 TaskFlow。
    - 您正在設定內建的網路鉤子外掛
summary: 網路鉤子外掛：供受信任外部自動化使用的 TaskFlow 驗證式傳入介面
title: 網路鉤子外掛
x-i18n:
    generated_at: "2026-07-11T21:43:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Webhooks 外掛會新增經過驗證的 HTTP 路由，讓受信任的外部系統（Zapier、n8n、CI 工作、內部服務）可透過 HTTP 建立及驅動受管理的 OpenClaw TaskFlow，而無須編寫自訂外掛。

此外掛在閘道程序內執行。若使用遠端閘道，請在該主機上安裝並設定外掛，然後重新啟動閘道。外掛預設不會設定任何路由，因此在新增至少一條路由之前不會執行任何操作。

## 設定路由

在 `plugins.entries.webhooks.config` 下設定組態：

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

路由欄位：

| 欄位           | 必填 | 預設值                        | 備註                                          |
| -------------- | ---- | ----------------------------- | --------------------------------------------- |
| `enabled`      | 否   | `true`                        |                                               |
| `path`         | 否   | `/plugins/webhooks/<routeId>` | 在所有路由中必須是唯一的。                    |
| `sessionKey`   | 是   | -                             | 擁有繫結 TaskFlow 的工作階段。                |
| `secret`       | 是   | -                             | 純文字字串或 SecretRef（見下文）。            |
| `controllerId` | 否   | `webhooks/<routeId>`          | 作為預設的 `create_flow` 控制器。             |
| `description`  | 否   | -                             | 僅供操作人員備註。                            |

`secret` 接受純文字字串或 SecretRef：`{ source: "env" | "file" | "exec", provider: "default", id: "..." }`。

每條已設定的路由都會在啟動時註冊，無論當下是否能解析其密鑰。無法解析的密鑰不會停用或略過路由；對該路由的請求會驗證失敗（`401`），直到密鑰可解析為止。每次收到請求時都會重新解析 SecretRef 值，因此輪替底層密鑰（環境變數、檔案或 exec 輸出）時，無須重新啟動閘道即可生效。

## 安全性模型

每條路由都具有其所設定 `sessionKey` 的 TaskFlow 權限：它可以檢查及修改該工作階段所擁有的任何 TaskFlow。TaskFlow 存取一律透過 `api.runtime.tasks.managedFlows.bindSession(...)`，因此路由絕不可能在其繫結工作階段之外執行操作。若要限制影響範圍：

- 每條路由使用高強度且唯一的密鑰。
- 優先使用 SecretRef，而非內嵌的純文字密鑰。
- 將路由繫結至符合工作流程需求的最小範圍工作階段。
- 僅公開所需的特定網路鉤子路徑。

每個路徑的請求處理順序為：先檢查 HTTP 方法（僅限 `POST`）與 `Content-Type: application/json`，接著進行固定時間窗速率限制（每個路徑與用戶端 IP 組合鍵在每 60 秒時間窗內最多 120 個請求，最多追蹤 4,096 個鍵），再進行處理中請求限制（每個鍵最多同時處理 8 個請求，最多追蹤 4,096 個鍵），然後進行共用密鑰驗證，最後讀取上限為 256 KB、逾時為 15 秒的 JSON 本文。未通過較早檢查的請求絕不會進入後續步驟。

## 請求格式

傳送具備 `Content-Type: application/json`，以及 `Authorization: Bearer <secret>` 或 `x-openclaw-webhook-secret: <secret>` 的 `POST` 請求：

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## 支援的動作

| 動作               | 用途                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | 為路由的工作階段建立受管理的 TaskFlow。                            |
| `get_flow`         | 依識別碼擷取單一 TaskFlow。                                        |
| `list_flows`       | 列出路由工作階段的 TaskFlow。                                      |
| `find_latest_flow` | 擷取最近更新的 TaskFlow。                                          |
| `resolve_flow`     | 使用不透明權杖解析 TaskFlow。                                      |
| `get_task_summary` | 擷取 TaskFlow 的任務摘要。                                         |
| `set_waiting`      | 將 TaskFlow 標記為等待中，並可選擇性附加狀態／等待資料。           |
| `resume_flow`      | 繼續執行等待中／受阻的 TaskFlow。                                  |
| `finish_flow`      | 將 TaskFlow 標記為已完成。                                         |
| `fail_flow`        | 將 TaskFlow 標記為失敗。                                           |
| `request_cancel`   | 請求協同取消。                                                     |
| `cancel_flow`      | 取消 TaskFlow（若子項仍在執行中，可能傳回 `202`）。                |
| `run_task`         | 在現有 TaskFlow 中建立受管理的子任務。                             |

修改動作（`set_waiting`、`resume_flow`、`finish_flow`、`fail_flow`、`request_cancel`）需要提供 `flowId` 和 `expectedRevision` 以進行樂觀並行控制；過期的修訂版本會傳回 `409 revision_conflict`。

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

允許的 `runtime` 值：`subagent`、`acp`。`startedAt`、`lastEventAt` 和 `progressSummary` 僅在 `status` 為 `"running"` 時有效；若搭配任何其他狀態傳送，會傳回 `400 invalid_request`。

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## 回應格式

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

流程與任務檢視絕不包含擁有者／工作階段中繼資料，因此回應不會洩漏路由所繫結的 `sessionKey`。`code` 值包括 `not_found`、`not_managed`、`revision_conflict`、`persist_failed`、`cancel_requested`、`cancel_pending`、`terminal`、`invalid_request`、`request_rejected`，以及在修改因上述具名代碼未涵蓋的原因遭拒時所使用的動作特定備援代碼（`mutation_rejected`、`create_rejected`、`task_not_created`、`cancel_rejected`）。

## 相關內容

- [Hooks](/zh-TW/automation/hooks)－內部事件驅動掛鉤與此 HTTP 型 TaskFlow 橋接器的比較
- [閘道網路鉤子（`hooks.*` 組態）](/zh-TW/automation/cron-jobs#webhooks)－獨立的通用閘道 HTTP 端點功能；與此外掛的路由不同
- [外掛執行階段 SDK](/zh-TW/plugins/sdk-runtime)
- [命令列介面網路鉤子](/zh-TW/cli/webhooks)
