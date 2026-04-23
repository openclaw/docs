---
read_when:
    - 集成那些需要 OpenAI Chat Completions 的工具
summary: 从 Gateway 网关公开一个兼容 OpenAI 的 `/v1/chat/completions` HTTP 端点
title: OpenAI Chat Completions
x-i18n:
    generated_at: "2026-04-23T19:24:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36f09a82d96bbbc78ba325572dda1524857a534629398582a0bfc007f427b61c
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions（HTTP）

OpenClaw 的 Gateway 网关可以提供一个小型的、兼容 OpenAI 的 Chat Completions 端点。

该端点**默认禁用**。请先在配置中启用它。

- `POST /v1/chat/completions`
- 与 Gateway 网关相同的端口（WS + HTTP 复用）：`http://<gateway-host>:<port>/v1/chat/completions`

当启用 Gateway 网关兼容 OpenAI 的 HTTP 接口后，它还会提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底层，请求会作为一次普通的 Gateway 智能体运行来执行（与 `openclaw agent` 使用相同代码路径），因此路由/权限/配置都与你的 Gateway 网关保持一致。

## 身份验证

使用 Gateway 网关的身份验证配置。

常见的 HTTP 身份验证路径：

- 共享密钥身份验证（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 受信任的携带身份信息的 HTTP 身份验证（`gateway.auth.mode="trusted-proxy"`）：
  通过已配置的身份感知代理进行路由，并让它注入所需的身份标头
- 私有入口开放身份验证（`gateway.auth.mode="none"`）：
  不需要身份验证标头

说明：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 当 `gateway.auth.mode="trusted-proxy"` 时，HTTP 请求必须来自已配置的非 loopback 受信任代理来源；同主机 loopback 代理不满足该模式要求。
- 如果已配置 `gateway.auth.rateLimit` 且身份验证失败次数过多，端点会返回 `429` 并附带 `Retry-After`。

## 安全边界（重要）

请将此端点视为该 Gateway 网关实例的**完整操作员访问**接口。

- 这里的 HTTP bearer 身份验证不是一个狭义的按用户划分的作用域模型。
- 该端点的有效 Gateway 网关 token/password 应被视为所有者/操作员凭证。
- 请求会通过与受信任操作员操作相同的控制平面智能体路径运行。
- 此端点上没有单独的非所有者/按用户划分的工具边界；一旦调用方通过了这里的 Gateway 网关身份验证，OpenClaw 就会将该调用方视为此 Gateway 网关的受信任操作员。
- 对于共享密钥身份验证模式（`token` 和 `password`），即使调用方发送了更窄的 `x-openclaw-scopes` 标头，该端点也会恢复正常的完整操作员默认设置。
- 对于受信任的携带身份信息的 HTTP 模式（例如 trusted proxy 身份验证或 `gateway.auth.mode="none"`），存在 `x-openclaw-scopes` 时会遵循它，否则会回退到正常的操作员默认作用域集合。
- 如果目标智能体策略允许敏感工具，此端点也可以使用它们。
- 请仅在 loopback/tailnet/私有入口上使用此端点；不要将其直接暴露到公共互联网。

身份验证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享 Gateway 网关操作员密钥
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整的默认操作员作用域集合：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 将该端点上的聊天轮次视为所有者发送者轮次
- 受信任的携带身份信息的 HTTP 模式（例如 trusted proxy 身份验证，或私有入口上的 `gateway.auth.mode="none"`）
  - 对某种外层受信任身份或部署边界进行身份验证
  - 当标头存在时遵循 `x-openclaw-scopes`
  - 当标头缺失时回退到正常的操作员默认作用域集合
  - 仅当调用方显式收窄作用域并省略 `operator.admin` 时，才会失去所有者语义

参见 [安全性](/zh-CN/gateway/security) 和 [远程访问](/zh-CN/gateway/remote)。

## 智能体优先的模型契约

OpenClaw 将 OpenAI `model` 字段视为**智能体目标**，而不是原始提供商模型 id。

- `model: "openclaw"` 会路由到已配置的默认智能体。
- `model: "openclaw/default"` 也会路由到已配置的默认智能体。
- `model: "openclaw/<agentId>"` 会路由到特定智能体。

可选请求标头：

- `x-openclaw-model: <provider/model-or-bare-id>` 会覆盖所选智能体的后端模型。
- `x-openclaw-agent-id: <agentId>` 仍作为兼容性覆盖项受支持。
- `x-openclaw-session-key: <sessionKey>` 可完全控制会话路由。
- `x-openclaw-message-channel: <channel>` 会为感知渠道的提示词和策略设置合成入口渠道上下文。

仍然接受的兼容别名：

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

默认情况下，此端点对每个请求都是**无状态的**（每次调用都会生成一个新的会话键）。

如果请求包含 OpenAI `user` 字符串，Gateway 网关会基于它派生出一个稳定的会话键，因此重复调用可以共享同一个智能体会话。

## 为什么这个接口很重要

这是对自托管前端和工具最有价值的一组兼容接口：

- 大多数 Open WebUI、LobeChat 和 LibreChat 配置都需要 `/v1/models`。
- 许多 RAG 系统需要 `/v1/embeddings`。
- 现有的 OpenAI 聊天客户端通常可以从 `/v1/chat/completions` 开始接入。
- 更偏向智能体原生的客户端则越来越倾向于使用 `/v1/responses`。

## 模型列表与智能体路由

<AccordionGroup>
  <Accordion title="`/v1/models` 返回什么？">
    一个 OpenClaw 智能体目标列表。

    返回的 id 包括 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>` 条目。
    直接将它们用作 OpenAI `model` 值即可。

  </Accordion>
  <Accordion title="`/v1/models` 列出的是智能体还是子智能体？">
    它列出的是顶层智能体目标，不是后端提供商模型，也不是子智能体。

    子智能体仍然属于内部执行拓扑。它们不会作为伪模型出现。

  </Accordion>
  <Accordion title="为什么包含 `openclaw/default`？">
    `openclaw/default` 是已配置默认智能体的稳定别名。

    这意味着即使不同环境中的真实默认智能体 id 发生变化，客户端仍可持续使用同一个可预测 id。

  </Accordion>
  <Accordion title="如何覆盖后端模型？">
    使用 `x-openclaw-model`。

    示例：
    `x-openclaw-model: openai/gpt-5.5`
    `x-openclaw-model: gpt-5.5`

    如果省略它，所选智能体会按其正常配置的模型选择运行。

  </Accordion>
  <Accordion title="embeddings 如何适配这个契约？">
    `/v1/embeddings` 使用相同的智能体目标 `model` id。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    当你需要特定的嵌入模型时，请在 `x-openclaw-model` 中发送它。
    如果没有该标头，请求会透传到所选智能体的常规嵌入配置。

  </Accordion>
</AccordionGroup>

## 流式传输（SSE）

设置 `stream: true` 以接收服务器发送事件（SSE）：

- `Content-Type: text/event-stream`
- 每一行事件都是 `data: <json>`
- 流以 `data: [DONE]` 结束

## Open WebUI 快速设置

进行基本的 Open WebUI 连接时：

- 基础 URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的基础 URL：`http://host.docker.internal:18789/v1`
- API 密钥：你的 Gateway 网关 bearer token
- 模型：`openclaw/default`

预期行为：

- `GET /v1/models` 应列出 `openclaw/default`
- Open WebUI 应使用 `openclaw/default` 作为聊天模型 id
- 如果你想为该智能体指定特定后端提供商/模型，请设置该智能体的常规默认模型，或发送 `x-openclaw-model`

快速冒烟测试：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果返回了 `openclaw/default`，大多数 Open WebUI 配置都可以使用相同的基础 URL 和 token 进行连接。

## 示例

非流式：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

流式：

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.5' \
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

获取单个模型：

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

创建 embeddings：

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

说明：

- `/v1/models` 返回的是 OpenClaw 智能体目标，而不是原始提供商目录。
- `openclaw/default` 始终存在，因此同一个稳定 id 可在不同环境中使用。
- 后端提供商/模型覆盖项应放在 `x-openclaw-model` 中，而不是 OpenAI `model` 字段中。
- `/v1/embeddings` 支持将 `input` 作为字符串或字符串数组。
