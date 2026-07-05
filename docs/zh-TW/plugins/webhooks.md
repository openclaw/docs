---
read_when:
    - 你想要從外部系統觸發或驅動 TaskFlow
    - 你正在設定隨附的網路鉤子外掛
summary: 網路鉤子外掛：用於受信任外部自動化的已驗證 TaskFlow 入口
title: 網路鉤子外掛
x-i18n:
    generated_at: "2026-07-05T11:34:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

網路鉤子外掛會新增已驗證的 HTTP 路由，讓受信任的外部
系統（Zapier、n8n、CI 工作、內部服務）可以透過 HTTP 建立並驅動
受管理的 OpenClaw TaskFlow，而不必撰寫自訂外掛。

此外掛在閘道程序內執行。若是遠端閘道，請在該主機上安裝並
設定它，然後重新啟動閘道。它出貨時沒有設定任何路由，因此在你新增至少一個路由之前，它不會執行任何操作。

## 設定路由

在 `plugins.entries.webhooks.config` 下設定 config：

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
| `path`         | 否   | `/plugins/webhooks/<routeId>` | 在所有路由中必須是唯一的。                  |
| `sessionKey`   | 是   | -                             | 擁有繫結 TaskFlow 的工作階段。              |
| `secret`       | 是   | -                             | 純文字字串或 SecretRef（見下方）。          |
| `controllerId` | 否   | `webhooks/<routeId>`          | 用作預設 `create_flow` 控制器。             |
| `description`  | 否   | -                             | 僅供操作員備註。                            |

`secret` 接受純文字字串或 SecretRef：`{ source: "env" | "file" | "exec", provider: "default", id: "..." }`。

無論其 secret 目前是否可解析，每個已設定的路由都會在啟動時註冊。無法解析的 secret 不會停用或略過該
路由；對它的請求會在 secret 可被解析前驗證失敗（`401`）。SecretRef 值會在每個請求時重新解析，因此輪換
底層 secret（環境變數、檔案或 exec 輸出）不需要重新啟動
閘道即可生效。

## 安全模型

每個路由都以其設定的 `sessionKey` 的 TaskFlow 權限行動：它
可以檢查和變更該工作階段擁有的任何 TaskFlow。TaskFlow 存取
一律透過 `api.runtime.tasks.managedFlows.bindSession(...)`，因此
路由絕不可能在其繫結的工作階段之外行動。若要限制影響範圍：

- 為每個路由使用強度高且唯一的 secret。
- 優先使用 SecretRef，而不是行內純文字 secret。
- 將路由繫結到符合工作流程的最小工作階段。
- 只公開你需要的特定網路鉤子路徑。

每個路徑的請求處理順序：HTTP 方法（僅限 `POST`）和
`Content-Type: application/json` 檢查，接著是固定視窗速率限制（每個 path+client-IP key 在每 60 秒視窗內 120
個請求，最多追蹤 4,096 個 key），接著是進行中請求限制（每個 key 8 個並行請求，最多追蹤 4,096 個 key），接著是共用 secret 驗證，然後讀取 256 KB /
15 秒的 JSON 主體。未通過前面檢查的請求永遠不會到達
後續檢查。

## 請求格式

傳送 `POST` 請求，使用 `Content-Type: application/json`，並包含
`Authorization: Bearer <secret>` 或 `x-openclaw-webhook-secret: <secret>`：

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## 支援的動作

| 動作               | 用途                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | 為路由的工作階段建立受管理的 TaskFlow。                           |
| `get_flow`         | 依 id 擷取一個 TaskFlow。                                          |
| `list_flows`       | 列出路由工作階段的 TaskFlow。                                      |
| `find_latest_flow` | 擷取最近更新的 TaskFlow。                                          |
| `resolve_flow`     | 透過不透明 token 解析 TaskFlow。                                   |
| `get_task_summary` | 擷取 TaskFlow 的任務摘要。                                         |
| `set_waiting`      | 將 TaskFlow 標記為等待，可選擇附帶狀態/等待資料。                 |
| `resume_flow`      | 恢復等待中/受阻的 TaskFlow。                                       |
| `finish_flow`      | 將 TaskFlow 標記為完成。                                           |
| `fail_flow`        | 將 TaskFlow 標記為失敗。                                           |
| `request_cancel`   | 請求協作式取消。                                                   |
| `cancel_flow`      | 取消 TaskFlow（若子項仍在作用中，可能回傳 `202`）。                |
| `run_task`         | 在現有 TaskFlow 內建立受管理的子任務。                             |

變更型動作（`set_waiting`、`resume_flow`、`finish_flow`、`fail_flow`、
`request_cancel`）需要 `flowId` 和 `expectedRevision` 以進行樂觀
並行控制；過期的 revision 會回傳 `409 revision_conflict`。

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

允許的 `runtime` 值：`subagent`、`acp`。`startedAt`、`lastEventAt` 和
`progressSummary` 只有在 `status` 為 `"running"` 時才有效；若搭配任何其他狀態傳送，會回傳 `400 invalid_request`。

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## 回應形狀

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

流程與任務檢視絕不包含擁有者/工作階段中繼資料，因此回應不會
洩漏路由繫結的 `sessionKey`。`code` 值包含 `not_found`、
`not_managed`、`revision_conflict`、`persist_failed`、`cancel_requested`、
`cancel_pending`、`terminal`、`invalid_request`、`request_rejected`，以及
在變更因上述具名代碼未涵蓋的原因遭拒時使用的動作特定備援代碼（`mutation_rejected`、`create_rejected`、
`task_not_created`、`cancel_rejected`）。

## 相關

- [Hooks](/zh-TW/automation/hooks) - 內部事件驅動 hook 與此基於 HTTP 的 TaskFlow bridge 的差異
- [閘道網路鉤子（`hooks.*` config）](/zh-TW/automation/cron-jobs#webhooks) - 獨立的通用閘道 HTTP 端點功能；不同於此外掛的路由
- [外掛 runtime SDK](/zh-TW/plugins/sdk-runtime)
- [命令列介面網路鉤子](/zh-TW/cli/webhooks)
