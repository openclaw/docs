---
read_when:
    - 您想從外部系統觸發或驅動 TaskFlow
    - 你正在設定隨附的 Webhook Plugin
summary: 'Webhook Plugin: 經身分驗證的 TaskFlow 入口，用於受信任的外部自動化'
title: Webhooks Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
---

Webhooks Plugin 會新增已驗證的 HTTP 路由，將外部自動化綁定到 OpenClaw TaskFlow。

當你想讓 Zapier、n8n、CI 作業或內部服務等受信任系統建立並驅動受管理的 TaskFlow，而不想先撰寫自訂 Plugin 時，請使用它。

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
- `sessionKey`：必要，擁有已綁定 TaskFlow 的 session
- `secret`：必要，共用密鑰或 SecretRef
- `controllerId`：選用，供已建立受管理流程使用的 controller id
- `description`：選用，操作員註記

支援的 `secret` 輸入：

- 純文字字串
- SecretRef，搭配 `source: "env" | "file" | "exec"`

如果由密鑰支援的路由在啟動時無法解析其密鑰，Plugin 會略過該路由並記錄警告，而不是暴露損壞的 endpoint。

## 安全模型

每個路由都會被信任，可使用其設定的 `sessionKey` 的 TaskFlow 權限執行操作。

這表示該路由可以檢查並變更該 session 擁有的 TaskFlow，因此你應該：

- 為每個路由使用強式且唯一的密鑰
- 優先使用密鑰參照，而不是內嵌純文字密鑰
- 將路由綁定到符合工作流程的最小範圍 session
- 只暴露你需要的特定 Webhook 路徑

Plugin 會套用：

- 共用密鑰驗證
- 請求 body 大小與逾時防護
- 固定視窗速率限制
- 進行中請求限制
- 透過 `api.runtime.tasks.managedFlows.bindSession(...)` 進行的 owner 綁定 TaskFlow 存取

## 請求格式

傳送 `POST` 請求並包含：

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

Plugin 目前接受下列 JSON `action` 值：

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

在既有受管理 TaskFlow 內建立受管理的子任務。

允許的 runtime 為：

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

成功的回應會傳回：

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

遭拒絕的請求會傳回：

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin 會刻意從 Webhook 回應中清除 owner/session metadata。

## 相關文件

- [Plugin runtime SDK](/zh-TW/plugins/sdk-runtime)
- [Hooks 與 Webhook 概觀](/zh-TW/automation/hooks)
- [CLI Webhook](/zh-TW/cli/webhooks)
