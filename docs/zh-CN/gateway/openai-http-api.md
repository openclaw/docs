---
read_when:
    - 集成需要 OpenAI Chat Completions 的工具
summary: 通过 Gateway 网关公开一个 OpenAI 兼容的 /v1/chat/completions HTTP 端点
title: OpenAI 聊天补全
x-i18n:
    generated_at: "2026-04-28T11:52:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 网关可以提供一个小型的、兼容 OpenAI 的 Chat Completions 端点。

此端点**默认禁用**。请先在配置中启用。

- `POST /v1/chat/completions`
- 与 Gateway 网关相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/chat/completions`

启用 Gateway 网关的兼容 OpenAI 的 HTTP 接口后，它还会提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底层，请求会作为普通 Gateway 网关智能体运行来执行（与 `openclaw agent` 相同的代码路径），因此路由、权限和配置都与你的 Gateway 网关一致。

## 身份验证

使用 Gateway 网关身份验证配置。

常见 HTTP 身份验证路径：

- 共享密钥身份验证（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 携带受信任身份的 HTTP 身份验证（`gateway.auth.mode="trusted-proxy"`）：
  通过已配置的可感知身份的代理路由，并让它注入
  所需的身份标头
- 私有入口开放身份验证（`gateway.auth.mode="none"`）：
  不需要身份验证标头

注意：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 当 `gateway.auth.mode="trusted-proxy"` 时，HTTP 请求必须来自
  已配置的受信任代理来源；同主机 local loopback 代理需要显式设置
  `gateway.auth.trustedProxy.allowLoopback = true`。
- 如果配置了 `gateway.auth.rateLimit` 且身份验证失败次数过多，端点会返回带有 `Retry-After` 的 `429`。

## 安全边界（重要）

将此端点视为该 Gateway 网关实例的**完整操作员访问**接口。

- 这里的 HTTP bearer 身份验证不是狭义的按用户作用域模型。
- 此端点的有效 Gateway 网关令牌/密码应被视为所有者/操作员凭据。
- 请求会通过与受信任操作员操作相同的控制平面智能体路径运行。
- 此端点没有单独的非所有者/按用户工具边界；一旦调用方通过这里的 Gateway 网关身份验证，OpenClaw 就会将该调用方视为此 Gateway 网关的受信任操作员。
- 对于共享密钥身份验证模式（`token` 和 `password`），即使调用方发送了范围更窄的 `x-openclaw-scopes` 标头，端点也会恢复正常的完整操作员默认值。
- 携带受信任身份的 HTTP 模式（例如受信任代理身份验证或 `gateway.auth.mode="none"`）会在存在 `x-openclaw-scopes` 时遵循它，否则回退到正常的操作员默认作用域集。
- 如果目标智能体策略允许敏感工具，此端点就可以使用它们。
- 仅将此端点保留在 loopback/tailnet/私有入口上；不要直接暴露到公共互联网。

身份验证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享的 Gateway 网关操作员密钥
  - 忽略范围更窄的 `x-openclaw-scopes`
  - 恢复完整的默认操作员作用域集：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 将此端点上的聊天轮次视为所有者发送者轮次
- 携带受信任身份的 HTTP 模式（例如受信任代理身份验证，或私有入口上的 `gateway.auth.mode="none"`）
  - 验证某种外部受信任身份或部署边界
  - 当存在该标头时遵循 `x-openclaw-scopes`
  - 当该标头不存在时回退到正常的操作员默认作用域集
  - 仅当调用方显式缩小作用域并省略 `operator.admin` 时，才会失去所有者语义

参见 [安全](/zh-CN/gateway/security) 和 [远程访问](/zh-CN/gateway/remote)。

## 智能体优先的模型契约

OpenClaw 将 OpenAI `model` 字段视为**智能体目标**，而不是原始提供商模型 ID。

- `model: "openclaw"` 路由到已配置的默认智能体。
- `model: "openclaw/default"` 也路由到已配置的默认智能体。
- `model: "openclaw/<agentId>"` 路由到特定智能体。

可选请求标头：

- `x-openclaw-model: <provider/model-or-bare-id>` 覆盖所选智能体的后端模型。
- `x-openclaw-agent-id: <agentId>` 作为兼容性覆盖仍受支持。
- `x-openclaw-session-key: <sessionKey>` 完全控制会话路由。
- `x-openclaw-message-channel: <channel>` 为感知渠道的提示词和策略设置合成入口渠道上下文。

仍接受的兼容性别名：

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## 启用端点

将 `gateway.http.endpoints.chatCompletions.enabled` 设置为 `true`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## 禁用端点

将 `gateway.http.endpoints.chatCompletions.enabled` 设置为 `false`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## 会话行为

默认情况下，该端点**每个请求都是无状态的**（每次调用都会生成新的会话键）。

如果请求包含 OpenAI `user` 字符串，Gateway 网关会从中派生稳定的会话键，因此重复调用可以共享一个智能体会话。

## 为什么这个接口重要

这是面向自托管前端和工具的最高杠杆兼容性集合：

- 大多数 Open WebUI、LobeChat 和 LibreChat 设置都期望 `/v1/models`。
- 许多 RAG 系统期望 `/v1/embeddings`。
- 现有 OpenAI 聊天客户端通常可以从 `/v1/chat/completions` 开始。
- 更多原生智能体客户端越来越偏好 `/v1/responses`。

## 模型列表和智能体路由

<AccordionGroup>
  <Accordion title="`/v1/models` 返回什么？">
    一个 OpenClaw 智能体目标列表。

    返回的 ID 是 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>` 条目。
    直接将它们用作 OpenAI `model` 值。

  </Accordion>
  <Accordion title="`/v1/models` 列出的是智能体还是子智能体？">
    它列出顶层智能体目标，而不是后端提供商模型，也不是子智能体。

    子智能体仍然是内部执行拓扑。它们不会作为伪模型出现。

  </Accordion>
  <Accordion title="为什么包含 `openclaw/default`？">
    `openclaw/default` 是已配置默认智能体的稳定别名。

    这意味着即使真实默认智能体 ID 在不同环境之间发生变化，客户端也可以继续使用一个可预测的 ID。

  </Accordion>
  <Accordion title="如何覆盖后端模型？">
    使用 `x-openclaw-model`。

    示例：
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    如果省略它，所选智能体会使用其正常配置的模型选择来运行。

  </Accordion>
  <Accordion title="嵌入如何适配这个契约？">
    `/v1/embeddings` 使用相同的智能体目标 `model` ID。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    当你需要特定嵌入模型时，请通过 `x-openclaw-model` 发送它。
    如果没有该标头，请求会传递到所选智能体的正常嵌入设置。

  </Accordion>
</AccordionGroup>

## 流式传输（SSE）

设置 `stream: true` 以接收服务器发送事件（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行都是 `data: <json>`
- 流以 `data: [DONE]` 结束

## Open WebUI 快速设置

对于基础 Open WebUI 连接：

- Base URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的 Base URL：`http://host.docker.internal:18789/v1`
- API key：你的 Gateway 网关 bearer 令牌
- Model：`openclaw/default`

预期行为：

- `GET /v1/models` 应列出 `openclaw/default`
- Open WebUI 应使用 `openclaw/default` 作为聊天模型 ID
- 如果你想为该智能体使用特定后端提供商/模型，请设置该智能体的正常默认模型或发送 `x-openclaw-model`

快速冒烟测试：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果它返回 `openclaw/default`，大多数 Open WebUI 设置都可以使用相同的 Base URL 和令牌连接。

## 示例

非流式传输：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

流式传输：

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

列出模型：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

获取一个模型：

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

创建嵌入：

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

注意：

- `/v1/models` 返回 OpenClaw 智能体目标，而不是原始提供商目录。
- `openclaw/default` 始终存在，因此一个稳定 ID 可以跨环境工作。
- 后端提供商/模型覆盖应放在 `x-openclaw-model` 中，而不是 OpenAI `model` 字段中。
- `/v1/embeddings` 支持将 `input` 作为字符串或字符串数组。

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference)
- [OpenAI](/zh-CN/providers/openai)
