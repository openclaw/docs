---
read_when:
    - 你想從外部系統觸發或驅動 TaskFlow
    - 你正在設定內建的網路鉤子外掛
summary: 網路鉤子外掛：供受信任外部自動化使用、具身分驗證的 TaskFlow 輸入端點
title: 網路鉤子外掛
x-i18n:
    generated_at: "2026-07-19T13:59:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77e455450d6183635c76a1e8002feeb287deb4ff242dbd555ef9d0f2b21ce5f6
    source_path: plugins/webhooks.md
    workflow: 16
---

Webhooks 外掛會新增經過驗證的 HTTP 路由，讓受信任的外部
系統（Zapier、n8n、CI 工作、內部服務）能透過 HTTP 建立並驅動
受管理的 OpenClaw TaskFlow，而無須撰寫自訂外掛。

此外掛在閘道程序內執行。若為遠端閘道，請在該主機上安裝並
設定此外掛，然後重新啟動閘道。此外掛出貨時未設定任何路由，
因此在新增至少一條路由之前，不會執行任何操作。

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

| 欄位           | 必要 | 預設值                        | 備註                                          |
| -------------- | -------- | ----------------------------- | --------------------------------------------- |
| `enabled`      | 否       | `true`                        |                                               |
| `path`         | 否       | `/plugins/webhooks/<routeId>` | 在所有路由中必須是唯一的。                    |
| `sessionKey`   | 是      | -                             | 擁有繫結 TaskFlow 的工作階段。                 |
| `secret`       | 是      | -                             | 純文字字串或 SecretRef（見下文）。             |
| `controllerId` | 否       | `webhooks/<routeId>`          | 作為預設的 `create_flow` 控制器。 |
| `description`  | 否       | -                             | 僅供操作人員備註。                              |

`secret` 接受純文字字串或 SecretRef：`{ source: "env" | "file" | "exec", provider: "default", id: "..." }`。

SecretRef 會解析至閘道的啟動組態快照中。當某條路由的
密鑰無法解析時，閘道會繼續執行，而該路由仍會保持註冊但處於
冷狀態：請求會收到一般驗證失敗（`401`）。
其他路由仍可使用。修正 SecretRef 來源，然後重新載入或重新啟動
閘道，以啟用新快照。絕不會在公開請求路徑上解析 SecretRef 值。

## 安全模型

每條路由都具有其所設定之 `sessionKey` 的 TaskFlow 權限：它
可以檢查和變更該工作階段所擁有的任何 TaskFlow。TaskFlow 存取
一律透過 `api.runtime.tasks.managedFlows.bindSession(...)` 進行，因此
路由絕不可能在其繫結工作階段之外執行操作。若要限制影響範圍：

- 每條路由使用一個高強度且唯一的密鑰。
- 優先使用 SecretRef，而非內嵌的純文字密鑰。
- 將路由繫結至符合工作流程需求的最小範圍工作階段。
- 僅公開所需的特定網路鉤子路徑。

每個路徑的請求處理順序：先檢查 HTTP 方法（僅限 `POST`）和
`Content-Type: application/json`，接著執行固定時間窗速率限制（每個路徑+用戶端 IP
金鑰在每個 60 秒時間窗內最多 120 個請求，最多追蹤 4,096 個
金鑰），然後執行進行中請求限制（每個金鑰最多 8 個並行請求，最多
追蹤 4,096 個金鑰），接著進行共用密鑰驗證，最後在 15 秒內讀取
最大 256 KB 的 JSON 本文。未通過較早檢查的請求絕不會進入
後續步驟。

## 請求格式

傳送包含 `Content-Type: application/json`，以及
`Authorization: Bearer <secret>` 或 `x-openclaw-webhook-secret: <secret>` 其中之一的 `POST` 請求：

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"檢閱傳入佇列"}'
```

## 支援的動作

| 動作               | 用途                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | 為路由的工作階段建立受管理的 TaskFlow。                            |
| `get_flow`         | 依 ID 擷取一個 TaskFlow。                                          |
| `list_flows`       | 列出路由工作階段的 TaskFlow。                                      |
| `find_latest_flow` | 擷取最近更新的 TaskFlow。                                          |
| `resolve_flow`     | 透過不透明權杖解析 TaskFlow。                                      |
| `get_task_summary` | 擷取 TaskFlow 的工作摘要。                                         |
| `set_waiting`      | 將 TaskFlow 標記為等待中，並可選擇提供狀態／等待資料。              |
| `resume_flow`      | 繼續執行等待中／遭封鎖的 TaskFlow。                                |
| `finish_flow`      | 將 TaskFlow 標記為已完成。                                         |
| `fail_flow`        | 將 TaskFlow 標記為失敗。                                           |
| `request_cancel`   | 要求協同取消。                                                       |
| `cancel_flow`      | 取消 TaskFlow（若子項目仍在運作，可能傳回 `202`）。 |
| `run_task`         | 在現有 TaskFlow 中建立受管理的子工作。                              |

變更動作（`set_waiting`、`resume_flow`、`finish_flow`、`fail_flow`、
`request_cancel`）需要 `flowId` 和 `expectedRevision` 以進行樂觀
並行控制；過期的修訂版會傳回 `409 revision_conflict`。

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "檢閱傳入佇列",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

允許的 `runtime` 值：`subagent`、`acp`。`startedAt`、`lastEventAt` 和
`progressSummary` 僅在 `status` 為 `"running"` 時有效；若搭配
任何其他狀態傳送，則會傳回 `400 invalid_request`。

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "檢查下一批訊息"
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
  "error": "找不到 TaskFlow。",
  "result": {}
}
```

流程和工作檢視絕不包含擁有者／工作階段中繼資料，因此回應不會
洩漏路由所繫結的 `sessionKey`。`code` 值包括 `not_found`、
`not_managed`、`revision_conflict`、`persist_failed`、`cancel_requested`、
`cancel_pending`、`terminal`、`invalid_request`、`request_rejected`，以及
當變更因上述具名程式碼未涵蓋的原因遭拒時，動作特定的後備程式碼
（`mutation_rejected`、`create_rejected`、
`task_not_created`、`cancel_rejected`）。

## 相關內容

- [鉤子](/zh-TW/automation/hooks) - 內部事件驅動鉤子與此 HTTP 型 TaskFlow 橋接器的比較
- [閘道網路鉤子（`hooks.*` 組態）](/zh-TW/automation/cron-jobs#webhooks) - 獨立的通用閘道 HTTP 端點功能；與此外掛的路由不同
- [外掛執行階段 SDK](/zh-TW/plugins/sdk-runtime)
- [命令列介面網路鉤子](/zh-TW/cli/webhooks)
