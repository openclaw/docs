---
read_when:
    - 在不运行完整智能体轮次的情况下调用工具
    - 构建需要强制执行工具策略的自动化
summary: 通过 Gateway 网关 HTTP 端点直接调用单个工具
title: 工具调用 API
x-i18n:
    generated_at: "2026-05-06T03:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 网关提供了一个简单的 HTTP 端点，用于直接调用单个工具。它始终启用，并使用 Gateway 网关认证和工具策略。与 OpenAI 兼容的 `/v1/*` 接口面一样，共享密钥 bearer 认证会被视为对整个 Gateway 网关的受信任操作者访问。

- `POST /tools/invoke`
- 与 Gateway 网关相同的端口（WS + HTTP 复用）：`http://<gateway-host>:<port>/tools/invoke`

默认最大载荷大小为 2 MB。

## 认证

使用 Gateway 网关认证配置。

常见 HTTP 认证路径：

- 共享密钥认证（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 携带受信任身份的 HTTP 认证（`gateway.auth.mode="trusted-proxy"`）：
  通过已配置的身份感知代理路由，并让它注入所需的身份头
- 私有入口开放认证（`gateway.auth.mode="none"`）：
  不需要认证头

注意：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 当 `gateway.auth.mode="trusted-proxy"` 时，HTTP 请求必须来自已配置的受信任代理来源；同主机 loopback 代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 如果配置了 `gateway.auth.rateLimit`，并且发生过多认证失败，该端点会返回 `429`，并带有 `Retry-After`。

## 安全边界（重要）

将此端点视为该 Gateway 网关实例的**完整操作者访问**接口面。

- 这里的 HTTP bearer 认证不是狭义的按用户范围模型。
- 此端点的有效 Gateway 网关 token/password 应被视为所有者/操作者凭据。
- 对于共享密钥认证模式（`token` 和 `password`），即使调用方发送更窄的 `x-openclaw-scopes` 头，该端点也会恢复正常的完整操作者默认值。
- 共享密钥认证还会将此端点上的直接工具调用视为所有者发送者轮次。
- 携带受信任身份的 HTTP 模式（例如受信任代理认证，或私有入口上的 `gateway.auth.mode="none"`）会在存在 `x-openclaw-scopes` 时遵循它，否则回退到正常的操作者默认范围集。
- 仅将此端点保留在 loopback/tailnet/私有入口上；不要直接暴露到公网。

认证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享的 Gateway 网关操作者密钥
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整的默认操作者范围集：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 将此端点上的直接工具调用视为所有者发送者轮次
- 携带受信任身份的 HTTP 模式（例如受信任代理认证，或私有入口上的 `gateway.auth.mode="none"`）
  - 认证某个外部受信任身份或部署边界
  - 当头存在时遵循 `x-openclaw-scopes`
  - 当头缺失时回退到正常的操作者默认范围集
  - 只有在调用方显式缩小范围并省略 `operator.admin` 时，才会失去所有者语义

## 请求体

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
- `args`（对象，可选）：工具专用参数。
- `sessionKey`（字符串，可选）：目标会话键。如果省略或为 `"main"`，Gateway 网关会使用已配置的主会话键（遵循 `session.mainKey` 和默认 agent，或全局范围内的 `global`）。
- `dryRun`（布尔值，可选）：为未来用途保留；当前会被忽略。

## 策略 + 路由行为

工具可用性会通过 Gateway 网关 agent 使用的同一策略链过滤：

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 组策略（如果会话键映射到某个组或渠道）
- 子 agent 策略（使用子 agent 会话键调用时）

如果某个工具未被策略允许，该端点会返回 **404**。

重要边界注意事项：

- Exec 审批是操作者防护栏，而不是此 HTTP 端点的单独授权边界。如果某个工具可通过 Gateway 网关认证 + 工具策略在这里访问，`/tools/invoke` 不会添加额外的逐调用审批提示。
- 不要与不受信任的调用方共享 Gateway 网关 bearer 凭据。如果你需要跨信任边界隔离，请运行单独的 Gateway 网关（并且最好使用单独的 OS 用户/主机）。

Gateway 网关 HTTP 默认还会应用硬拒绝列表（即使会话策略允许该工具）：

- `exec` - 直接命令执行（RCE 接口面）
- `spawn` - 任意子进程创建（RCE 接口面）
- `shell` - shell 命令执行（RCE 接口面）
- `fs_write` - 在主机上进行任意文件变更
- `fs_delete` - 在主机上删除任意文件
- `fs_move` - 在主机上移动/重命名任意文件
- `apply_patch` - 应用补丁可能重写任意文件
- `sessions_spawn` - 会话编排；远程生成 agent 属于 RCE
- `sessions_send` - 跨会话消息注入
- `cron` - 持久自动化控制平面
- `gateway` - Gateway 网关控制平面；防止通过 HTTP 重新配置
- `nodes` - 节点命令中继可以到达已配对主机上的 system.run
- `whatsapp_login` - 需要终端二维码扫描的交互式设置；在 HTTP 上会挂起

你可以通过 `gateway.tools` 自定义此拒绝列表：

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

为了帮助组策略解析上下文，你可以选择设置：

- `x-openclaw-message-channel: <channel>`（示例：`slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（存在多个账号时）

## 响应

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`（无效请求或工具输入错误）
- `401` → 未授权
- `429` → 认证被限速（已设置 `Retry-After`）
- `404` → 工具不可用（未找到或不在允许列表中）
- `405` → 方法不允许
- `500` → `{ ok: false, error: { type, message } }`（意外的工具执行错误；消息已清理）

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

## 相关内容

- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [工具和插件](/zh-CN/tools)
