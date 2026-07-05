---
read_when:
    - 你想从外部系统触发或驱动 TaskFlows
    - 你正在配置内置的 Webhooks 插件
summary: Webhooks 插件：面向受信任外部自动化的已认证 TaskFlow 入口
title: Webhooks 插件
x-i18n:
    generated_at: "2026-07-05T11:35:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Webhooks 插件会添加经过身份验证的 HTTP 路由，让受信任的外部系统（Zapier、n8n、CI 任务、内部服务）可以通过 HTTP 创建并驱动托管式 OpenClaw TaskFlows，而无需编写自定义插件。

该插件在 Gateway 网关进程内运行。对于远程 Gateway 网关，请在该主机上安装并配置它，然后重启 Gateway 网关。它默认不配置任何路由，因此在你至少添加一个路由之前不会执行任何操作。

## 配置路由

在 `plugins.entries.webhooks.config` 下设置配置：

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

路由字段：

| 字段           | 必需 | 默认值                        | 说明                                          |
| -------------- | ---- | ----------------------------- | --------------------------------------------- |
| `enabled`      | 否   | `true`                        |                                               |
| `path`         | 否   | `/plugins/webhooks/<routeId>` | 必须在所有路由中唯一。                        |
| `sessionKey`   | 是   | -                             | 拥有绑定 TaskFlows 的会话。                   |
| `secret`       | 是   | -                             | 明文字符串或 SecretRef（见下文）。            |
| `controllerId` | 否   | `webhooks/<routeId>`          | 用作默认的 `create_flow` 控制器。             |
| `description`  | 否   | -                             | 仅作为操作员备注。                            |

`secret` 接受明文字符串或 SecretRef：`{ source: "env" | "file" | "exec", provider: "default", id: "..." }`。

每个已配置的路由都会在启动时注册，无论其 secret 当前是否可解析。无法解析的 secret 不会禁用或跳过该路由；发往该路由的请求会认证失败（`401`），直到 secret 可以被解析。SecretRef 值会在每个请求中重新解析，因此轮换底层 secret（环境变量、文件或 exec 输出）无需重启 Gateway 网关即可生效。

## 安全模型

每个路由都以其配置的 `sessionKey` 对应的 TaskFlow 权限运行：它可以检查和变更该会话拥有的任何 TaskFlow。TaskFlow 访问始终通过 `api.runtime.tasks.managedFlows.bindSession(...)`，因此路由永远不能越过其绑定会话执行操作。若要限制影响范围：

- 为每个路由使用强且唯一的 secret。
- 优先使用 SecretRef，而不是内联明文 secret。
- 将路由绑定到适合该工作流的最小会话范围。
- 仅暴露你需要的特定 webhook 路径。

每个路径的请求处理顺序为：HTTP 方法（仅 `POST`）和 `Content-Type: application/json` 检查，然后是固定窗口速率限制（每个路径 + 客户端 IP 键每 60 秒窗口 120 个请求，最多跟踪 4,096 个键），然后是进行中请求限制（每个键 8 个并发请求，最多跟踪 4,096 个键），然后是共享 secret 认证，最后读取 256 KB / 15 秒限制的 JSON 请求体。未通过较早检查的请求永远不会到达后续步骤。

## 请求格式

发送 `POST` 请求，设置 `Content-Type: application/json`，并使用 `Authorization: Bearer <secret>` 或 `x-openclaw-webhook-secret: <secret>`：

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## 支持的操作

| 操作               | 用途                                                              |
| ------------------ | ----------------------------------------------------------------- |
| `create_flow`      | 为路由的会话创建一个托管 TaskFlow。                              |
| `get_flow`         | 按 id 获取一个 TaskFlow。                                         |
| `list_flows`       | 列出路由会话的 TaskFlow。                                        |
| `find_latest_flow` | 获取最近更新的 TaskFlow。                                        |
| `resolve_flow`     | 通过不透明令牌解析一个 TaskFlow。                                |
| `get_task_summary` | 获取 TaskFlow 的任务摘要。                                       |
| `set_waiting`      | 将 TaskFlow 标记为等待，可带可选状态/等待数据。                  |
| `resume_flow`      | 恢复等待中/阻塞的 TaskFlow。                                     |
| `finish_flow`      | 将 TaskFlow 标记为已完成。                                       |
| `fail_flow`        | 将 TaskFlow 标记为失败。                                         |
| `request_cancel`   | 请求协作式取消。                                                 |
| `cancel_flow`      | 取消 TaskFlow（如果子项仍处于活动状态，可能返回 `202`）。        |
| `run_task`         | 在现有 TaskFlow 内创建一个托管子任务。                           |

变更类操作（`set_waiting`、`resume_flow`、`finish_flow`、`fail_flow`、
`request_cancel`）需要 `flowId` 和 `expectedRevision` 以进行乐观并发控制；过期的修订版本会返回 `409 revision_conflict`。

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

允许的 `runtime` 值：`subagent`、`acp`。`startedAt`、`lastEventAt` 和
`progressSummary` 仅在 `status` 为 `"running"` 时有效；在任何其他状态下发送它们会返回 `400 invalid_request`。

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## 响应结构

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

Flow 和任务视图绝不会包含所有者/会话元数据，因此响应无法泄露路由绑定的 `sessionKey`。`code` 值包括 `not_found`、`not_managed`、`revision_conflict`、`persist_failed`、`cancel_requested`、`cancel_pending`、`terminal`、`invalid_request`、`request_rejected`，以及当某个变更因上述具名代码未覆盖的原因被拒绝时使用的特定于操作的回退代码（`mutation_rejected`、`create_rejected`、`task_not_created`、`cancel_rejected`）。

## 相关

- [Hooks](/zh-CN/automation/hooks) - 内部事件驱动钩子，与这个基于 HTTP 的 TaskFlow 桥接不同
- [Gateway webhooks（`hooks.*` 配置）](/zh-CN/automation/cron-jobs#webhooks) - 单独的通用 Gateway 网关 HTTP 端点功能；不同于此插件的路由
- [插件运行时 SDK](/zh-CN/plugins/sdk-runtime)
- [CLI webhooks](/zh-CN/cli/webhooks)
