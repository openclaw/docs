---
read_when:
    - 调用工具而不运行完整的智能体轮次
    - 构建需要工具策略强制执行的自动化
summary: 通过 Gateway 网关 HTTP 端点直接调用单个工具
title: 工具调用 API
x-i18n:
    generated_at: "2026-07-05T11:21:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 网关公开了一个 HTTP 端点，用于直接调用单个工具。它始终启用，并使用 Gateway 网关凭证以及工具策略。与 OpenAI 兼容的 `/v1/*` 暴露面一样，共享密钥 Bearer 凭证会被视为对整个 Gateway 网关的可信操作员访问权限。

- `POST /tools/invoke`
- 与 Gateway 网关相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/tools/invoke`
- 默认最大请求体大小：2 MB

## 身份验证

使用 Gateway 网关凭证配置。

常见 HTTP 凭证路径：

- 共享密钥凭证（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
- 携带可信身份的 HTTP 凭证（`gateway.auth.mode="trusted-proxy"`）：通过已配置的身份感知代理路由，并让它注入所需的身份标头
- 私有入口开放凭证（`gateway.auth.mode="none"`）：不需要凭证标头

注意事项：

- `mode="token"` 使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- `mode="password"` 使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- `mode="trusted-proxy"` 要求 HTTP 请求来自已配置的可信代理来源；同主机回环代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 绕过代理的内部同主机调用方可以使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 作为本地直接回退。任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 标头证据都会改为让请求保持在可信代理路径上。
- 如果已配置 `gateway.auth.rateLimit` 且发生过多凭证失败，该端点会返回带有 `Retry-After` 的 `429`。

## 安全边界（重要）

将此端点视为 Gateway 网关实例的**完整操作员访问**暴露面。

- 此处的 HTTP Bearer 凭证不是狭义的按用户权限范围模型。
- 此端点的有效 Gateway 网关令牌/密码应被视为所有者/操作员凭据。
- 对于共享密钥凭证模式（`token` 和 `password`），即使调用方发送了更窄的 `x-openclaw-scopes` 标头，该端点也会恢复普通的完整操作员默认值。
- 共享密钥凭证还会将此端点上的直接工具调用视为所有者发送方轮次。
- 携带可信身份的 HTTP 模式（可信代理凭证，或私有入口上的 `gateway.auth.mode="none"`）会在存在 `x-openclaw-scopes` 时遵循它，否则回退到普通的操作员默认权限范围集。
- 仅将此端点保留在回环/Tailscale 网络/私有入口上；不要将它直接暴露到公共互联网。

凭证矩阵：

| 凭证模式                                                                                | 行为                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` 或 `password` + `Authorization: Bearer ...`                                     | 证明持有共享的 Gateway 网关操作员密钥。忽略更窄的 `x-openclaw-scopes`。恢复完整的默认操作员权限范围集：`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。将直接工具调用视为所有者发送方轮次。 |
| 携带可信身份的 HTTP（可信代理凭证，或私有入口上的 `mode="none"`） | 对外层可信身份或部署边界进行身份验证。存在 `x-openclaw-scopes` 时遵循它。缺少该标头时回退到普通的操作员默认权限范围集。仅当调用方显式缩窄权限范围并省略 `operator.admin` 时，才会失去所有者语义。                               |

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

- `tool` / `name`（字符串，必需）：要调用的工具名称。如果两者都发送，`name` 优先。
- `action`（字符串，可选）：如果工具架构支持 `action` 属性且 `args` 尚未设置该属性，则合并到 `args.action`。
- `args`（对象，可选）：工具专用参数。
- `sessionKey`（字符串，可选）：目标会话键。如果省略或为 `"main"`，Gateway 网关会使用已配置的主会话键（遵循 `session.mainKey` 和默认智能体，或全局会话范围中的 `global`）。
- `agentId`（字符串，可选）：为该智能体解析会话键。如果它与已显式设置且已映射到另一个智能体的 `sessionKey` 冲突，则报 `400` 错误。
- `idempotencyKey`（字符串，可选）：用于为本次调用派生稳定的工具调用 ID。
- `dryRun`（布尔值，可选）：保留供将来使用；当前会被忽略。

## 策略 + 路由行为

工具可用性会通过 Gateway 网关智能体使用的同一策略链进行过滤：

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 组策略（如果会话键映射到组或渠道）
- 子智能体策略（使用子智能体会话键调用时）

如果策略不允许某个工具，该端点会返回 **404**。

重要边界说明：

- Exec 审批是操作员防护栏，不是此 HTTP 端点的单独授权边界。如果工具可通过 Gateway 网关凭证 + 工具策略在此处访问，`/tools/invoke` 不会添加额外的逐次调用审批提示。
- 如果 `exec` 可在此处访问，请将它视为可变更的 Shell 暴露面。拒绝 `write`、`edit`、`apply_patch` 或 HTTP 文件系统写入工具，并不会让 Shell 执行变为只读。
- 不要与不可信调用方共享 Gateway 网关 Bearer 凭据。如果你需要在信任边界之间隔离，请运行单独的 Gateway 网关（最好在单独的操作系统用户/主机上）。

Gateway 网关 HTTP 默认还会应用硬性拒绝列表（即使会话策略允许该工具）：

| 工具             | 原因                                                    |
| ---------------- | --------------------------------------------------------- |
| `exec`           | 直接命令执行（RCE 暴露面）                    |
| `spawn`          | 任意子进程创建（RCE 暴露面）            |
| `shell`          | Shell 命令执行（RCE 暴露面）                     |
| `fs_write`       | 主机上的任意文件变更                       |
| `fs_delete`      | 主机上的任意文件删除                       |
| `fs_move`        | 主机上的任意文件移动/重命名                    |
| `apply_patch`    | 补丁应用可以重写任意文件             |
| `sessions_spawn` | 会话编排；远程生成智能体属于 RCE    |
| `sessions_send`  | 跨会话消息注入                           |
| `cron`           | 持久自动化控制平面                       |
| `gateway`        | Gateway 网关控制平面；防止通过 HTTP 重新配置  |
| `nodes`          | 节点命令中继可以触达配对主机上的 `system.run` |

`cron`、`gateway` 和 `nodes` 也仅限所有者使用：即使不在此默认拒绝列表中，非所有者调用方也无法在此暴露面上调用它们。

通过 `gateway.tools` 自定义通用拒绝列表：

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

`gateway.tools.allow` 是暴露覆盖，不是权限范围升级。在携带身份的 HTTP 模式中，即使列在 `gateway.tools.allow` 中，`cron`、`gateway` 和 `nodes` 仍然无法被没有所有者/管理员身份（`operator.admin`）的调用方使用。共享密钥 Bearer 凭证仍遵循上面的完整可信操作员规则。

为帮助组策略解析上下文，你可以选择设置：

- `x-openclaw-message-channel: <channel>`（示例：`slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（存在多个账号时）
- `x-openclaw-message-to: <target>`（消息工具策略的投递目标）
- `x-openclaw-thread-id: <threadId>`（消息工具策略的线程上下文）

## 响应

| 状态 | 含义                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------- |
| `200`  | `{ ok: true, result }`                                                                         |
| `400`  | `{ ok: false, error: { type, message } }`（无效请求或工具输入错误）                |
| `401`  | 未授权                                                                                   |
| `403`  | `{ ok: false, error: { type, message, requiresApproval? } }`（工具调用被策略阻止）     |
| `404`  | 工具不可用（未找到或未列入允许列表）                                              |
| `405`  | 方法不允许                                                                             |
| `408`  | 读取请求体超时                                                                    |
| `413`  | 请求体超过最大载荷大小                                                     |
| `429`  | 凭证受到速率限制（已设置 `Retry-After`）                                                          |
| `500`  | `{ ok: false, error: { type, message } }`（意外的工具执行错误；消息已净化） |

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

- [Gateway 协议](/zh-CN/gateway/protocol)
- [工具和插件](/zh-CN/tools)
