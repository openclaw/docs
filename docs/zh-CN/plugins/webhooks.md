---
read_when:
    - 你希望从外部系统触发或驱动 TaskFlow 流程
    - 你正在配置内置的 Webhooks 插件
summary: Webhooks 插件：面向可信外部自动化、经过身份验证的 TaskFlow 入口
title: Webhooks 插件
x-i18n:
    generated_at: "2026-07-11T20:51:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Webhooks 插件添加了经过身份验证的 HTTP 路由，使受信任的外部系统（Zapier、n8n、CI 作业、内部服务）无需编写自定义插件，即可通过 HTTP 创建和驱动托管式 OpenClaw TaskFlow。

该插件在 Gateway 网关进程内运行。对于远程 Gateway 网关，请在该主机上安装并配置插件，然后重启 Gateway 网关。插件默认未配置任何路由，因此在添加至少一条路由之前不会执行任何操作。

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
| `path`         | 否   | `/plugins/webhooks/<routeId>` | 在所有路由中必须唯一。                        |
| `sessionKey`   | 是   | -                             | 拥有绑定 TaskFlow 的会话。                    |
| `secret`       | 是   | -                             | 纯字符串或 SecretRef（见下文）。              |
| `controllerId` | 否   | `webhooks/<routeId>`          | 用作默认的 `create_flow` 控制器。             |
| `description`  | 否   | -                             | 仅供操作员备注。                              |

`secret` 接受纯字符串或 SecretRef：`{ source: "env" | "file" | "exec", provider: "default", id: "..." }`。

无论密钥当前能否解析，每条已配置的路由都会在启动时注册。无法解析的密钥不会禁用或跳过该路由——在密钥可解析之前，对该路由的请求将无法通过身份验证（`401`）。每次请求都会重新解析 SecretRef 值，因此轮换底层密钥（环境变量、文件或 exec 输出）无需重启 Gateway 网关即可生效。

## 安全模型

每条路由都拥有其所配置 `sessionKey` 的 TaskFlow 权限：它可以检查和修改该会话拥有的任何 TaskFlow。TaskFlow 访问始终通过 `api.runtime.tasks.managedFlows.bindSession(...)` 进行，因此路由绝不能在其绑定会话之外执行操作。为限制影响范围：

- 为每条路由使用强度高且唯一的密钥。
- 优先使用 SecretRef，而非内联明文密钥。
- 将路由绑定到能够满足工作流需求的最小范围会话。
- 仅公开你需要的特定 Webhook 路径。

每个路径的请求处理顺序如下：先检查 HTTP 方法（仅限 `POST`）和 `Content-Type: application/json`，然后执行固定窗口速率限制（每个路径与客户端 IP 组合键在每个 60 秒窗口内最多 120 个请求，最多跟踪 4,096 个键），接着执行进行中请求限制（每个键最多 8 个并发请求，最多跟踪 4,096 个键），然后进行共享密钥身份验证，最后读取大小上限为 256 KB、超时为 15 秒的 JSON 正文。未通过较早检查的请求绝不会进入后续步骤。

## 请求格式

发送带有 `Content-Type: application/json` 以及 `Authorization: Bearer <secret>` 或 `x-openclaw-webhook-secret: <secret>` 的 `POST` 请求：

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## 支持的操作

| 操作               | 用途                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `create_flow`      | 为路由的会话创建托管式 TaskFlow。                                    |
| `get_flow`         | 按 ID 获取一个 TaskFlow。                                            |
| `list_flows`       | 列出路由会话的 TaskFlow。                                            |
| `find_latest_flow` | 获取最近更新的 TaskFlow。                                            |
| `resolve_flow`     | 通过不透明令牌解析 TaskFlow。                                        |
| `get_task_summary` | 获取 TaskFlow 的任务摘要。                                           |
| `set_waiting`      | 将 TaskFlow 标记为等待状态，并可选择提供状态或等待数据。              |
| `resume_flow`      | 恢复等待中或被阻塞的 TaskFlow。                                      |
| `finish_flow`      | 将 TaskFlow 标记为已完成。                                           |
| `fail_flow`        | 将 TaskFlow 标记为失败。                                             |
| `request_cancel`   | 请求协作式取消。                                                     |
| `cancel_flow`      | 取消 TaskFlow（如果子项仍处于活动状态，可能返回 `202`）。             |
| `run_task`         | 在现有 TaskFlow 内创建托管式子任务。                                 |

修改操作（`set_waiting`、`resume_flow`、`finish_flow`、`fail_flow`、`request_cancel`）需要提供 `flowId` 和 `expectedRevision` 以实现乐观并发控制；过期的修订版本将返回 `409 revision_conflict`。

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

允许的 `runtime` 值：`subagent`、`acp`。`startedAt`、`lastEventAt` 和 `progressSummary` 仅在 `status` 为 `"running"` 时有效；在任何其他状态下发送这些字段都会返回 `400 invalid_request`。

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

流程和任务视图绝不会包含所有者或会话元数据，因此响应不会泄露路由绑定的 `sessionKey`。`code` 值包括 `not_found`、`not_managed`、`revision_conflict`、`persist_failed`、`cancel_requested`、`cancel_pending`、`terminal`、`invalid_request`、`request_rejected`；当修改因上述具名代码未涵盖的原因被拒绝时，还会使用特定于操作的回退代码（`mutation_rejected`、`create_rejected`、`task_not_created`、`cancel_rejected`）。

## 相关内容

- [Hooks](/zh-CN/automation/hooks)——内部事件驱动钩子与此基于 HTTP 的 TaskFlow 桥接器的对比
- [Gateway 网关 Webhook（`hooks.*` 配置）](/zh-CN/automation/cron-jobs#webhooks)——独立的通用 Gateway 网关 HTTP 端点功能；与此插件的路由不同
- [插件运行时 SDK](/zh-CN/plugins/sdk-runtime)
- [CLI Webhook](/zh-CN/cli/webhooks)
