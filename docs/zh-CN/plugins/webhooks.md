---
read_when:
    - 你想从外部系统触发或驱动 TaskFlows
    - 你正在配置内置的 webhooks 插件
summary: Webhooks 插件：面向受信任外部自动化的经身份验证的 TaskFlow 入口
title: 网络钩子插件
x-i18n:
    generated_at: "2026-05-06T16:12:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Webhooks 插件会添加经过身份验证的 HTTP 路由，用于将外部自动化绑定到 OpenClaw TaskFlows。

当你希望 Zapier、n8n、CI 作业或内部服务等受信任系统创建并驱动托管 TaskFlows，而不想先编写自定义插件时，请使用它。

## 运行位置

Webhooks 插件在 Gateway 网关进程内运行。

如果你的 Gateway 网关运行在另一台机器上，请在该 Gateway 网关主机上安装并配置插件，然后重启 Gateway 网关。

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
- `sessionKey`：必需，拥有已绑定 TaskFlows 的会话
- `secret`：必需，共享密钥或 SecretRef
- `controllerId`：可选，用于已创建托管流程的控制器 ID
- `description`：可选，操作员备注

支持的 `secret` 输入：

- 纯字符串
- SecretRef，带有 `source: "env" | "file" | "exec"`

如果由密钥支持的路由在启动时无法解析其密钥，插件会跳过该路由并记录警告，而不是暴露损坏的端点。

## 安全模型

每个路由都被信任，可以使用其配置的 `sessionKey` 的 TaskFlow 权限执行操作。

这意味着该路由可以检查和变更该会话拥有的 TaskFlows，因此你应该：

- 为每个路由使用强且唯一的密钥
- 优先使用密钥引用，而不是内联明文密钥
- 将路由绑定到符合工作流需求的最小会话
- 只暴露你需要的特定网络钩子路径

插件会应用：

- 共享密钥身份验证
- 请求正文大小和超时保护
- 固定窗口速率限制
- 进行中请求限制
- 通过 `api.runtime.tasks.managedFlows.bindSession(...)` 进行绑定所有者的 TaskFlow 访问

## 请求格式

发送 `POST` 请求，并带上：

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

插件目前接受这些 JSON `action` 值：

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

为路由绑定的会话创建托管 TaskFlow。

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

在现有托管 TaskFlow 内创建托管子任务。

允许的运行时为：

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

## 响应形状

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

插件会有意从网络钩子响应中清除所有者/会话元数据。

## 相关文档

- [插件运行时 SDK](/zh-CN/plugins/sdk-runtime)
- [钩子和网络钩子概览](/zh-CN/automation/hooks)
- [CLI 网络钩子](/zh-CN/cli/webhooks)
