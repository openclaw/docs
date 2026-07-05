---
read_when:
    - 构建无法使用 Gateway 网关 WebSocket RPC 客户端的主机工具
    - 通过私有受信任入口暴露 Gateway 网关管理自动化
    - 审计对 Gateway 网关方法的 HTTP 访问安全模型
summary: 通过内置、可选启用的 admin-http-rpc 插件暴露选定的 Gateway 网关控制平面方法
title: 管理 HTTP RPC 插件
x-i18n:
    generated_at: "2026-07-05T11:28:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 075135d2248acc859e60a72639350e16ed43785e9a353396fd47c3b02a4b0f5a
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

内置的 `admin-http-rpc` 插件通过 HTTP 暴露一组允许列表中的 Gateway 网关控制平面方法，用于无法保持 Gateway 网关 WebSocket 连接打开的受信主机自动化。

它随 OpenClaw 一起发布，但默认禁用；禁用时不会注册该路由。启用后，它会在与 Gateway 网关相同的监听器上添加 `POST /api/v1/admin/rpc`（`http://<gateway-host>:<port>/api/v1/admin/rpc`）。

仅为私有主机工具、tailnet 自动化或受信内部入口启用它。绝不要将此路由直接暴露到公网。

## 启用前

Admin HTTP RPC 是完整的操作员控制平面表面：任何通过 Gateway 网关 HTTP 身份验证的调用方都可以调用下面允许列表中的方法。仅在以下全部条件都成立时启用它：

- 调用方受信任，可以操作 Gateway 网关。
- 调用方无法使用 WebSocket RPC 客户端。
- 该路由仅可通过 loopback、tailnet 或私有的已认证入口访问。
- 你已审查允许的方法，并确认它们与你计划运行的自动化匹配。

对于能够保持 Gateway 网关 WebSocket 连接打开的 OpenClaw 客户端和交互式工具，请改用 WebSocket RPC。

## 启用

启用内置插件：

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
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

该路由会在插件启动期间注册，因此更改插件配置后请重启 Gateway 网关。

当你不再需要 HTTP 表面时，将其禁用：

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## 验证路由

使用 `health` 作为最小的安全请求：

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

成功响应包含 `ok: true`：

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

插件禁用时，该路由会返回 `404`，因为它未注册。

## 身份验证

插件路由使用 Gateway 网关 HTTP 身份验证。

常见身份验证路径：

- 共享密钥身份验证（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
- 带受信身份的 HTTP 身份验证（`gateway.auth.mode="trusted-proxy"`）：通过已配置的身份感知代理路由，并让它注入所需的身份标头
- 私有入口开放身份验证（`gateway.auth.mode="none"`）：不需要身份验证标头

## 安全模型

将此插件视为完整的 Gateway 网关操作员表面。

- 启用插件会有意在 `/api/v1/admin/rpc` 提供对允许列表中管理 RPC 方法的访问。
- 该插件声明保留的 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 清单契约，这使其通过 Gateway 网关认证的 HTTP 路由能够在进程内调度控制平面方法。这不是沙箱：该契约会防止意外使用保留的 SDK helper，但受信插件仍在 Gateway 网关进程中运行。
- 共享密钥 bearer 身份验证（`token`/`password` 模式）证明持有 Gateway 网关操作员密钥；此路径会忽略更窄的 `x-openclaw-scopes` 标头，并恢复正常的完整操作员默认权限。
- 带受信身份的 HTTP 身份验证（`trusted-proxy` 模式）会在存在 `x-openclaw-scopes` 时遵循它。
- `gateway.auth.mode="none"` 表示如果插件已启用，此路由无需身份验证。仅在你完全信任的私有入口后使用它。
- 插件路由身份验证通过后，请求会通过与 WebSocket RPC 相同的 Gateway 网关方法处理器和权限范围检查进行调度。
- 将此路由保持在 loopback、tailnet 或私有受信入口上。不要将它直接暴露到公网。当调用方跨越信任边界时，请使用单独的 Gateway 网关。

## 请求

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

字段：

- `id`（字符串，可选）：复制到响应中。省略时会生成一个 UUID。
- `method`（字符串，必需）：允许的 Gateway 网关方法名称。
- `params`（任意类型，可选）：特定于方法的参数。

默认最大请求正文大小为 1 MB。

## 响应

成功响应使用 Gateway 网关 RPC 形状：

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway 网关方法错误使用：

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

HTTP 状态遵循错误代码：

| 错误代码                   | HTTP 状态   |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| 任何其他代码               | 500         |

## 允许的方法

- 设备发现：`commands.list`
  返回此插件允许的 HTTP RPC 方法名称。
- Gateway 网关：`health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- 配置：`config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- 渠道：`channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- Web：`web.login.start`, `web.login.wait`
- 模型：`models.list`, `models.authStatus`
- 智能体：`agents.list`, `agents.create`, `agents.update`, `agents.delete`
- 审批：`exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron：`cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- 设备：`device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- 节点：`node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- 任务：`tasks.list`, `tasks.get`, `tasks.cancel`
- 诊断：`doctor.memory.status`, `update.status`

其他 Gateway 网关方法会被阻止，直到它们被有意添加。

## WebSocket 对比

常规 Gateway 网关 WebSocket RPC 路径仍是 OpenClaw 客户端首选的控制平面 API。仅将 Admin HTTP RPC 用于需要请求/响应 HTTP 表面的主机工具。

没有受信设备身份的共享令牌 WebSocket 客户端无法在连接期间自行声明管理员权限范围。Admin HTTP RPC 刻意遵循现有的受信 HTTP 操作员模型：启用插件后，共享密钥 bearer 身份验证会在此管理表面被视为完整操作员访问权限。

## 故障排查

`404 Not Found`

: 插件已禁用，Gateway 网关启用后尚未重启，或者请求被发送到了另一个 Gateway 网关进程。

`401 Unauthorized`

: 请求未满足 Gateway 网关 HTTP 身份验证。检查 bearer 令牌或 trusted-proxy 身份标头。

`405 Method Not Allowed`

: 请求使用了 `POST` 以外的方法。

`413 Payload Too Large`

: 请求正文超过了 1 MB 限制。

`400 INVALID_REQUEST`

: 请求正文不是有效 JSON，缺少 `method` 字段，或者该方法不在插件允许列表中。

`503 UNAVAILABLE`

: Gateway 网关方法处理器不可用。检查 Gateway 网关日志，并在 Gateway 网关完成启动后重试。

## 相关

- [操作员权限范围](/zh-CN/gateway/operator-scopes)
- [Gateway 网关安全](/zh-CN/gateway/security)
- [远程访问](/zh-CN/gateway/remote)
- [插件清单](/zh-CN/plugins/manifest#contracts-reference)
- [SDK 子路径](/zh-CN/plugins/sdk-subpaths)
