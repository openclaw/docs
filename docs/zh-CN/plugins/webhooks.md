---
read_when:
    - 你想从外部系统触发或驱动 TaskFlows
    - 你正在配置内置的 webhooks 插件
summary: Webhooks 插件：面向受信任外部自动化的已认证 TaskFlow 接入入口
title: 网络钩子插件
x-i18n:
    generated_at: "2026-04-28T12:00:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhooks（插件）

Webhooks 插件会添加已认证的 HTTP 路由，将外部自动化绑定到 OpenClaw 任务流。

当你希望 Zapier、n8n、CI 作业或内部服务等受信任系统创建并驱动托管任务流，而不想先编写自定义插件时，请使用它。

## 运行位置

Webhooks 插件在 Gateway 网关进程内运行。

如果你的 Gateway 网关运行在另一台机器上，请在该 Gateway 网关主机上安装并配置此插件，然后重启 Gateway 网关。

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

- `enabled`：可选，默认为 `true`
- `path`：可选，默认为 `/plugins/webhooks/<routeId>`
- `sessionKey`：必填，拥有绑定任务流的会话
- `secret`：必填，共享密钥或 SecretRef
- `controllerId`：可选，为已创建的托管流程指定控制器 ID
- `description`：可选，操作员备注

支持的 `secret` 输入：

- 明文字符串
- 带有 `source: "env" | "file" | "exec"` 的 SecretRef

如果由密钥支持的路由在启动时无法解析其密钥，插件会跳过该路由并记录警告，而不是暴露损坏的端点。

## 安全模型

每条路由都被信任，可使用其配置的 `sessionKey` 的任务流权限执行操作。

这意味着该路由可以检查和变更该会话拥有的任务流，因此你应该：

- 为每条路由使用强且唯一的密钥
- 优先使用密钥引用，而不是内联明文密钥
- 将路由绑定到符合工作流要求的最小范围会话
- 只暴露你需要的特定 webhook 路径

该插件会应用：

- 共享密钥认证
- 请求体大小和超时保护
- 固定窗口速率限制
- 进行中请求限制
- 通过 `api.runtime.tasks.managedFlows.bindSession(...)` 提供绑定所有者的任务流访问

## 请求格式

发送 `POST` 请求，并包含：

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` 或 `x-openclaw-webhook-secret: <secret>`

示例：

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## 支持的操作

该插件当前接受这些 JSON `action` 值：

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

为路由绑定的会话创建托管任务流。

示例：

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

在现有托管任务流中创建托管子任务。

允许的运行时是：

- `subagent`
- `acp`

示例：

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

成功响应会返回：

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

被拒绝的请求会返回：

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

该插件会有意从 webhook 响应中清除所有者/会话元数据。

## 相关文档

- [插件运行时 SDK](/zh-CN/plugins/sdk-runtime)
- [钩子和 webhook 概览](/zh-CN/automation/hooks)
- [CLI webhooks](/zh-CN/cli/webhooks)
