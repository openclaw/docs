---
read_when:
    - 调用工具而不运行完整的智能体轮次
    - 构建需要工具策略强制执行的自动化
summary: 通过 Gateway 网关 HTTP 端点直接调用单个工具
title: 工具调用 API
x-i18n:
    generated_at: "2026-06-27T02:09:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 网关公开了一个简单的 HTTP 端点，用于直接调用单个工具。它始终启用，并使用 Gateway 网关认证和工具策略。与兼容 OpenAI 的 `/v1/*` 表面一样，共享密钥 bearer 认证会被视为对整个 Gateway 网关的可信操作员访问。

- `POST /tools/invoke`
- 与 Gateway 网关相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/tools/invoke`

默认最大载荷大小为 2 MB。

## 认证

使用 Gateway 网关认证配置。

常见 HTTP 认证路径：

- 共享密钥认证（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 携带可信身份的 HTTP 认证（`gateway.auth.mode="trusted-proxy"`）：
  通过已配置的身份感知代理路由，并让它注入所需的身份标头
- 私有入口开放认证（`gateway.auth.mode="none"`）：
  不需要认证标头

说明：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 当 `gateway.auth.mode="trusted-proxy"` 时，HTTP 请求必须来自已配置的可信代理来源；同主机 loopback 代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 绕过代理的内部同主机调用方可以使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 作为本地直接回退。任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 标头证据都会让请求继续走 trusted-proxy 路径。
- 如果配置了 `gateway.auth.rateLimit` 且认证失败次数过多，该端点会返回 `429`，并带有 `Retry-After`。

## 安全边界（重要）

将此端点视为 Gateway 网关实例的**完整操作员访问**表面。

- 这里的 HTTP bearer 认证不是狭窄的按用户作用域模型。
- 此端点的有效 Gateway 网关令牌/密码应被视为所有者/操作员凭证。
- 对于共享密钥认证模式（`token` 和 `password`），即使调用方发送了更窄的 `x-openclaw-scopes` 标头，该端点也会恢复普通的完整操作员默认值。
- 共享密钥认证还会将此端点上的直接工具调用视为 owner-sender 轮次。
- 携带可信身份的 HTTP 模式（例如可信代理认证，或私有入口上的 `gateway.auth.mode="none"`）会在存在 `x-openclaw-scopes` 时遵守它，否则回退到普通的操作员默认作用域集。
- 仅将此端点保留在 loopback/tailnet/私有入口上；不要直接暴露到公共互联网。

认证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明拥有共享的 Gateway 网关操作员密钥
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整的默认操作员作用域集：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 将此端点上的直接工具调用视为 owner-sender 轮次
- 携带可信身份的 HTTP 模式（例如可信代理认证，或私有入口上的 `gateway.auth.mode="none"`）
  - 认证某个外部可信身份或部署边界
  - 当标头存在时遵守 `x-openclaw-scopes`
  - 当标头不存在时回退到普通的操作员默认作用域集
  - 仅在调用方显式缩小作用域并省略 `operator.admin` 时失去所有者语义

## 请求正文

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

字段：

- `tool`（字符串，必需）：要调用的工具名称。
- `action`（字符串，可选）：如果工具 schema 支持 `action` 且 args 载荷省略了它，则映射到 args 中。
- `args`（对象，可选）：工具特定参数。
- `sessionKey`（字符串，可选）：目标会话键。如果省略或为 `"main"`，Gateway 网关会使用已配置的主会话键（遵守 `session.mainKey` 和默认 Agent，或在全局作用域中使用 `global`）。
- `dryRun`（布尔值，可选）：预留给未来使用；当前会被忽略。

## 策略 + 路由行为

工具可用性会通过 Gateway 网关智能体使用的同一策略链进行过滤：

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 组策略（如果会话键映射到组或渠道）
- 子智能体策略（使用子智能体会话键调用时）

如果某个工具不被策略允许，该端点会返回 **404**。

重要边界说明：

- Exec 审批是操作员防护栏，不是此 HTTP 端点的独立授权边界。如果某个工具可通过 Gateway 网关认证 + 工具策略在这里访问，`/tools/invoke` 不会额外添加逐次调用的审批提示。
- 如果 `exec` 可在这里访问，请将其视为可变更的 shell 表面。拒绝 `write`、`edit`、`apply_patch` 或 HTTP 文件系统写入工具，并不会让 shell 执行变成只读。
- 不要与不可信调用方共享 Gateway 网关 bearer 凭证。如果你需要跨信任边界的隔离，请运行独立的 Gateway 网关（最好也使用独立的 OS 用户/主机）。

Gateway 网关 HTTP 默认还会应用硬性拒绝列表（即使会话策略允许该工具）：

- `exec` - 直接命令执行（RCE 表面）
- `spawn` - 任意子进程创建（RCE 表面）
- `shell` - shell 命令执行（RCE 表面）
- `fs_write` - 主机上的任意文件变更
- `fs_delete` - 主机上的任意文件删除
- `fs_move` - 主机上的任意文件移动/重命名
- `apply_patch` - 补丁应用可重写任意文件
- `sessions_spawn` - 会话编排；远程生成智能体属于 RCE
- `sessions_send` - 跨会话消息注入
- `cron` - 持久自动化控制平面
- `gateway` - Gateway 网关控制平面；防止通过 HTTP 重新配置
- `nodes` - 节点命令中继可触达已配对主机上的 system.run
- `whatsapp_login` - 需要终端 QR 扫描的交互式设置；会在 HTTP 上挂起

你可以通过 `gateway.tools` 自定义此拒绝列表：

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` 是暴露覆盖，不是作用域升级。在携带身份的 HTTP 模式中，即使 `cron`、`gateway` 和 `nodes` 被列在 `gateway.tools.allow` 中，它们仍然不会对没有所有者/管理员身份（`operator.admin`）的调用方可用。共享密钥 bearer 认证仍遵循上面的完整可信操作员规则。

为了帮助组策略解析上下文，你可以选择设置：

- `x-openclaw-message-channel: <channel>`（示例：`slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（存在多个账号时）

## 响应

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`（无效请求或工具输入错误）
- `401` → 未授权
- `429` → 认证受到速率限制（已设置 `Retry-After`）
- `404` → 工具不可用（未找到或不在允许列表中）
- `405` → 方法不允许
- `500` → `{ ok: false, error: { type, message } }`（意外的工具执行错误；消息已净化）

## 示例

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## 相关

- [Gateway protocol](/zh-CN/gateway/protocol)
- [工具和插件](/zh-CN/tools)
