---
read_when:
    - 构建无法使用 Gateway 网关 WebSocket RPC 客户端的主机工具
    - 将 Gateway 网关管理自动化置于私有可信入口后暴露
    - 审计 Gateway 网关方法的 HTTP 访问安全模型
summary: 通过内置且可选启用的 `admin-http-rpc` 插件公开选定的 Gateway 网关控制平面方法
title: Admin HTTP RPC 插件
x-i18n:
    generated_at: "2026-06-27T02:34:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

内置的 `admin-http-rpc` 插件通过 HTTP 暴露选定的 Gateway 网关控制平面方法，用于无法使用常规 Gateway 网关 WebSocket RPC 客户端的受信任主机自动化。

该插件随 OpenClaw 提供，但默认关闭。禁用时，不会注册该路由。启用后会添加：

- `POST /api/v1/admin/rpc`
- 与 Gateway 网关相同的监听器：`http://<gateway-host>:<port>/api/v1/admin/rpc`

只应为私有主机工具、tailnet 自动化或受信任的内部入口启用它。不要将此路由直接暴露到公共互联网。

## 启用前

Admin HTTP RPC 是完整的操作员控制平面入口。任何通过 Gateway 网关 HTTP 凭证验证的调用方，都可以调用本页允许列表中的方法。

仅在以下条件全部成立时使用它：

- 调用方可信，可操作 Gateway 网关。
- 调用方无法使用 WebSocket RPC 客户端。
- 路由只可通过 loopback、tailnet 或私有已认证入口访问。
- 你已审查允许的方法，且它们与你计划运行的自动化匹配。

对于可以保持 Gateway 网关 WebSocket 连接打开的 OpenClaw 客户端和交互式工具，请使用 WebSocket RPC 路径。

## 启用

启用内置插件：

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="配置">
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

路由会在插件启动期间注册。更改插件配置后，请重启 Gateway 网关。

不再需要 HTTP 入口时，请禁用它：

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

插件禁用时，该路由返回 `404`，因为它未注册。

## 身份验证

插件路由使用 Gateway 网关 HTTP 凭证验证。

常见身份验证路径：

- 共享密钥身份验证（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
- 携带受信任身份的 HTTP 身份验证（`gateway.auth.mode="trusted-proxy"`）：通过已配置的身份感知代理路由，并让它注入所需的身份标头
- 私有入口开放身份验证（`gateway.auth.mode="none"`）：不需要身份验证标头

## 安全模型

将此插件视为完整的 Gateway 网关操作员入口。

- 启用该插件会有意在 `/api/v1/admin/rpc` 提供对允许列表中 admin RPC 方法的访问。
- 插件声明保留的 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 清单契约，使其通过 Gateway 网关认证的 HTTP 路由可以在进程内分发控制平面方法。
- 共享密钥 bearer 身份验证证明持有 Gateway 网关操作员密钥。
- 对于 `token` 和 `password` 身份验证，更窄的 `x-openclaw-scopes` 标头会被忽略，并恢复常规完整操作员默认值。
- 携带受信任身份的 HTTP 模式会在存在 `x-openclaw-scopes` 时遵循它。
- `gateway.auth.mode="none"` 表示如果启用该插件，此路由未经过身份验证。仅在你完全信任的私有入口后使用。
- 插件路由身份验证通过后，请求会通过与 WebSocket RPC 相同的 Gateway 网关方法处理程序和范围检查进行分发。
- 将此路由保留在 loopback、tailnet 或私有受信任入口上。不要将其直接暴露到公共互联网。
- 插件清单契约不是沙箱。它们防止意外使用保留的 SDK helper；受信任插件仍在 Gateway 网关进程中运行。

当调用方跨越信任边界时，请使用独立的网关。

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

- `id`（字符串，可选）：复制到响应中。省略时会生成 UUID。
- `method`（字符串，必需）：允许的 Gateway 网关方法名称。
- `params`（任意类型，可选）：方法特定参数。

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

HTTP 状态会尽可能遵循 Gateway 网关错误。例如，`INVALID_REQUEST` 返回 `400`，`UNAVAILABLE` 返回 `503`。

## 允许的方法

- 设备发现：`commands.list`
  返回此插件允许的 HTTP RPC 方法名称。
- Gateway 网关：`health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- 配置：`config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- 渠道：`channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web：`web.login.start`, `web.login.wait`
- 模型：`models.list`, `models.authStatus`
- 智能体：`agents.list`, `agents.create`, `agents.update`, `agents.delete`
- 审批：`exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron：`cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- 设备：`device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- 节点：`node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- 任务：`tasks.list`, `tasks.get`, `tasks.cancel`
- 诊断：`doctor.memory.status`, `update.status`

其他 Gateway 网关方法会被阻止，直到有意添加为止。

## WebSocket 对比

常规 Gateway 网关 WebSocket RPC 路径仍然是 OpenClaw 客户端的首选控制平面 API。仅将 admin HTTP RPC 用于需要请求/响应 HTTP 入口的主机工具。

没有受信任设备身份的共享令牌 WebSocket 客户端无法在连接期间自行声明 admin 范围。Admin HTTP RPC 有意遵循现有的受信任 HTTP 操作员模型：启用插件时，共享密钥 bearer 身份验证会被视为对此 admin 入口的完整操作员访问权限。

## 故障排除

`404 Not Found`

: 插件已禁用、启用后 Gateway 网关尚未重启，或请求发往了不同的 Gateway 网关进程。

`401 Unauthorized`

: 请求未满足 Gateway 网关 HTTP 身份验证。检查 bearer 令牌或 trusted-proxy 身份标头。

`400 INVALID_REQUEST`

: 请求正文不是有效 JSON、缺少 `method` 字段，或方法不在插件允许列表中。

`503 UNAVAILABLE`

: Gateway 网关方法处理程序不可用。检查 Gateway 网关日志，并在 Gateway 网关完成启动后重试。

## 相关

- [操作员范围](/zh-CN/gateway/operator-scopes)
- [Gateway 网关安全](/zh-CN/gateway/security)
- [远程访问](/zh-CN/gateway/remote)
- [插件清单](/zh-CN/plugins/manifest#contracts)
- [SDK 子路径](/zh-CN/plugins/sdk-subpaths)
