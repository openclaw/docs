---
read_when:
    - 无需运行完整的智能体轮次即可调用工具
    - 构建需要强制执行工具策略的自动化流程
summary: 通过 Gateway 网关 HTTP 端点直接调用单个工具
title: 工具调用 API
x-i18n:
    generated_at: "2026-07-11T20:33:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 网关公开了一个 HTTP 端点，用于直接调用单个工具。该端点始终启用，并使用 Gateway 网关身份验证和工具策略。与 OpenAI 兼容的 `/v1/*` 接口一样，共享密钥 Bearer 身份验证会被视为对整个 Gateway 网关的可信操作员访问权限。

- `POST /tools/invoke`
- 与 Gateway 网关使用相同端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/tools/invoke`
- 默认请求正文大小上限：2 MB

## 身份验证

使用 Gateway 网关身份验证配置。

常见的 HTTP 身份验证路径：

- 共享密钥身份验证（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
- 携带可信身份的 HTTP 身份验证（`gateway.auth.mode="trusted-proxy"`）：通过已配置的身份感知代理进行路由，并由其注入所需的身份标头
- 私有入口开放式身份验证（`gateway.auth.mode="none"`）：无需身份验证标头

注意：

- `mode="token"` 使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- `mode="password"` 使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- `mode="trusted-proxy"` 要求 HTTP 请求来自已配置的可信代理源；同一主机上的环回代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 绕过代理的同一主机内部调用方可使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 作为本地直接回退方式。如果存在任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 标头证据，请求将继续沿可信代理路径处理。
- 如果配置了 `gateway.auth.rateLimit`，且身份验证失败次数过多，该端点将返回 `429`，并附带 `Retry-After`。

## 安全边界（重要）

请将此端点视为对该 Gateway 网关实例具有**完整操作员访问权限**的接口。

- 此处的 HTTP Bearer 身份验证并非一种狭义的按用户划分权限范围的模型。
- 此端点的有效 Gateway 网关令牌/密码应被视为所有者/操作员凭据。
- 对于共享密钥身份验证模式（`token` 和 `password`），即使调用方发送范围更窄的 `x-openclaw-scopes` 标头，该端点也会恢复常规的完整操作员默认权限。
- 共享密钥身份验证还会将对此端点的直接工具调用视为所有者发送方轮次。
- 携带可信身份的 HTTP 模式（可信代理身份验证，或私有入口上的 `gateway.auth.mode="none"`）会在存在 `x-openclaw-scopes` 时遵循其设置，否则回退到常规的操作员默认权限范围集。
- 仅允许通过环回地址、tailnet 或私有入口访问此端点；不要将其直接暴露在公共互联网上。

身份验证矩阵：

| 身份验证模式                                                                            | 行为                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` 或 `password` + `Authorization: Bearer ...`                                     | 证明调用方持有共享的 Gateway 网关操作员密钥。忽略范围更窄的 `x-openclaw-scopes`。恢复完整的默认操作员权限范围集：`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。将直接工具调用视为所有者发送方轮次。 |
| 携带可信身份的 HTTP（可信代理身份验证，或私有入口上的 `mode="none"`）                   | 对外层可信身份或部署边界进行身份验证。存在 `x-openclaw-scopes` 时遵循其设置。该标头不存在时，回退到常规的操作员默认权限范围集。只有当调用方显式缩小权限范围并省略 `operator.admin` 时，才会失去所有者语义。                                                               |

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

- `tool` / `name`（字符串，必填）：要调用的工具名称。如果两者都发送，则 `name` 优先。
- `action`（字符串，可选）：如果工具架构支持 `action` 属性，且 `args` 尚未设置该属性，则合并到 `args.action` 中。
- `args`（对象，可选）：工具专用参数。
- `sessionKey`（字符串，可选）：目标会话键。如果省略或为 `"main"`，Gateway 网关将使用已配置的主会话键（遵循 `session.mainKey` 和默认智能体；在全局会话作用域中则使用 `global`）。
- `agentId`（字符串，可选）：解析该智能体的会话键。如果它与已显式指定且映射到其他智能体的 `sessionKey` 冲突，则返回 `400` 错误。
- `idempotencyKey`（字符串，可选）：用于为本次调用派生稳定的工具调用 ID。
- `dryRun`（布尔值，可选）：保留供将来使用；目前会被忽略。

## 策略和路由行为

工具可用性通过 Gateway 网关智能体使用的同一策略链进行筛选：

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 群组策略（如果会话键映射到群组或渠道）
- 子智能体策略（使用子智能体会话键调用时）

如果策略不允许使用某个工具，该端点将返回 **404**。

重要边界说明：

- Exec 审批是操作员防护机制，并不是此 HTTP 端点的独立授权边界。如果通过 Gateway 网关身份验证和工具策略可以访问某个工具，`/tools/invoke` 不会额外添加逐次调用审批提示。
- 如果可以通过此端点访问 `exec`，请将其视为可修改系统的 shell 接口。拒绝 `write`、`edit`、`apply_patch` 或 HTTP 文件系统写入工具，并不会使 shell 执行变为只读。
- 不要与不可信的调用方共享 Gateway 网关 Bearer 凭据。如果需要跨信任边界进行隔离，请运行独立的 Gateway 网关（最好使用不同的操作系统用户或主机）。

即使会话策略允许使用某个工具，Gateway 网关 HTTP 默认也会应用硬性拒绝列表：

| 工具             | 原因                                                      |
| ---------------- | --------------------------------------------------------- |
| `exec`           | 直接执行命令（RCE 接口）                                  |
| `spawn`          | 创建任意子进程（RCE 接口）                                |
| `shell`          | 执行 shell 命令（RCE 接口）                               |
| `fs_write`       | 任意修改主机上的文件                                      |
| `fs_delete`      | 任意删除主机上的文件                                      |
| `fs_move`        | 任意移动主机上的文件或为其重命名                          |
| `apply_patch`    | 应用补丁可能会重写任意文件                                |
| `sessions_spawn` | 会话编排；远程生成智能体属于 RCE                          |
| `sessions_send`  | 跨会话注入消息                                            |
| `cron`           | 持久化自动化控制平面                                      |
| `gateway`        | Gateway 网关控制平面；防止通过 HTTP 重新配置              |
| `nodes`          | 节点命令中继可以访问已配对主机上的 `system.run`           |

`cron`、`gateway` 和 `nodes` 也仅限所有者使用：即使不在此默认拒绝列表中，非所有者调用方也无法通过此接口调用它们。

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

`gateway.tools.allow` 是暴露范围覆盖项，而不是权限范围升级。在携带身份的 HTTP 模式下，即使 `cron`、`gateway` 和 `nodes` 列在 `gateway.tools.allow` 中，没有所有者/管理员身份（`operator.admin`）的调用方仍无法使用它们。共享密钥 Bearer 身份验证仍遵循上述完整可信操作员规则。

为了帮助群组策略解析上下文，你可以选择设置：

- `x-openclaw-message-channel: <channel>`（示例：`slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（存在多个账户时）
- `x-openclaw-message-to: <target>`（消息工具策略的递送目标）
- `x-openclaw-thread-id: <threadId>`（消息工具策略的线程上下文）

## 响应

| 状态   | 含义                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------- |
| `200`  | `{ ok: true, result }`                                                                         |
| `400`  | `{ ok: false, error: { type, message } }`（无效请求或工具输入错误）                             |
| `401`  | 未授权                                                                                         |
| `403`  | `{ ok: false, error: { type, message, requiresApproval? } }`（工具调用被策略阻止）              |
| `404`  | 工具不可用（未找到或未列入允许列表）                                                           |
| `405`  | 不允许使用该方法                                                                               |
| `408`  | 读取请求正文超时                                                                               |
| `413`  | 请求正文超过最大有效负载大小                                                                   |
| `429`  | 身份验证受到速率限制（已设置 `Retry-After`）                                                   |
| `500`  | `{ ok: false, error: { type, message } }`（意外的工具执行错误；消息已净化）                     |

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
