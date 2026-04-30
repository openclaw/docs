---
read_when:
    - 你想要從外部系統觸發或驅動 TaskFlow
    - 你正在設定隨附的 Webhook Plugin
summary: Webhook Plugin：用於受信任外部自動化的已驗證 TaskFlow 入口
title: Webhook Plugin
x-i18n:
    generated_at: "2026-04-30T03:28:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhook（Plugin）

Webhooks Plugin 會新增經過驗證的 HTTP 路由，將外部自動化綁定到 OpenClaw TaskFlows。

當你想讓受信任的系統（例如 Zapier、n8n、CI 工作，或內部服務）建立並驅動受管理的 TaskFlows，而不必先撰寫自訂 Plugin 時，請使用它。

## 執行位置

Webhooks Plugin 會在 Gateway 程序內執行。

如果你的 Gateway 在另一台機器上執行，請在該 Gateway 主機上安裝並設定 Plugin，然後重新啟動 Gateway。

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

- `enabled`：選用，預設為 `true`
- `path`：選用，預設為 `/plugins/webhooks/<routeId>`
- `sessionKey`：必要，擁有綁定 TaskFlows 的 session
- `secret`：必要，共用密鑰或 SecretRef
- `controllerId`：選用，為建立的受管理流程指定 controller id
- `description`：選用，操作者備註

支援的 `secret` 輸入：

- 純字串
- SecretRef，搭配 `source: "env" | "file" | "exec"`

如果由密鑰支援的路由在啟動時無法解析其密鑰，Plugin 會略過該路由並記錄警告，而不是暴露損壞的端點。

## 安全模型

每個路由都被信任，可使用其設定的 `sessionKey` 的 TaskFlow 權限執行操作。

這表示該路由可以檢查並變更該 session 擁有的 TaskFlows，因此你應該：

- 為每個路由使用強而唯一的密鑰
- 優先使用密鑰參照，而不是內嵌純文字密鑰
- 將路由綁定到符合工作流程的最小範圍 session
- 只暴露你需要的特定 Webhook 路徑

Plugin 會套用：

- 共用密鑰驗證
- 請求主體大小與逾時防護
- 固定時間窗速率限制
- 進行中請求限制
- 透過 `api.runtime.tasks.managedFlows.bindSession(...)` 進行受擁有者限制的 TaskFlow 存取

## 請求格式

傳送 `POST` 請求，並包含：

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` 或 `x-openclaw-webhook-secret: <secret>`

範例：

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## 支援的動作

Plugin 目前接受這些 JSON `action` 值：

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

為路由綁定的 session 建立受管理的 TaskFlow。

範例：

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

在現有受管理的 TaskFlow 內建立受管理的子任務。

允許的執行階段為：

- `subagent`
- `acp`

範例：

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

成功回應會傳回：

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

遭拒的請求會傳回：

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin 會刻意從 Webhook 回應中清除擁有者/session 中繼資料。

## 相關文件

- [Plugin runtime SDK](/zh-TW/plugins/sdk-runtime)
- [Hooks 與 Webhook 概覽](/zh-TW/automation/hooks)
- [CLI Webhook](/zh-TW/cli/webhooks)
