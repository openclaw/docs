---
read_when:
    - 集成期望使用 OpenAI Chat Completions 的工具
summary: 从 Gateway 网关暴露兼容 OpenAI 的 `/v1/chat/completions` HTTP 端点
title: OpenAI chat completions
x-i18n:
    generated_at: "2026-04-24T04:02:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55f581d56edbc23a8e8a6f8f1c5960db46042991abb3ee4436f477abafde2926
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions（HTTP）

OpenClaw 的 Gateway 网关可以提供一个小型的、兼容 OpenAI 的 Chat Completions 端点。

此端点**默认禁用**。请先在配置中启用它。

- `POST /v1/chat/completions`
- 与 Gateway 网关相同端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/chat/completions`

当启用 Gateway 网关的 OpenAI 兼容 HTTP 表面时，它还会提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底层，请求会作为普通的 Gateway 网关智能体运行来执行（与 `openclaw agent` 使用相同代码路径），因此路由/权限/配置与你的 Gateway 网关保持一致。

## 身份验证

使用 Gateway 网关身份验证配置。

常见的 HTTP 身份验证路径：

- 共享密钥身份验证（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 受信任的携带身份 HTTP 身份验证（`gateway.auth.mode="trusted-proxy"`）：
  通过已配置的身份感知代理进行路由，并让其注入所需的
  身份标头
- 私有入口开放身份验证（`gateway.auth.mode="none"`）：
  不需要身份验证标头

说明：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 当 `gateway.auth.mode="trusted-proxy"` 时，HTTP 请求必须来自已配置的
  非 loopback 受信任代理源；同主机的 loopback 代理不满足此模式。
- 如果配置了 `gateway.auth.rateLimit` 且发生了过多身份验证失败，端点会返回 `429` 并附带 `Retry-After`。

## 安全边界（重要）

请将此端点视为 gateway 实例的**完整 operator 访问**表面。

- 此处的 HTTP bearer 身份验证不是狭义的按用户作用域模型。
- 对此端点有效的 Gateway 网关 token/password 应被视为 owner/operator 凭据。
- 请求会通过与受信任 operator 操作相同的控制平面智能体路径运行。
- 此端点没有单独的非 owner/按用户工具边界；一旦调用方在此通过 Gateway 网关身份验证，OpenClaw 就会将该调用方视为此 gateway 的受信任 operator。
- 对于共享密钥身份验证模式（`token` 和 `password`），即使调用方发送了更窄的 `x-openclaw-scopes` 标头，此端点也会恢复正常的完整 operator 默认值。
- 受信任的携带身份 HTTP 模式（例如 trusted proxy auth 或 `gateway.auth.mode="none"`）在存在 `x-openclaw-scopes` 时会遵循它，否则会回退到正常的 operator 默认作用域集。
- 如果目标智能体策略允许敏感工具，此端点可以使用它们。
- 请仅在 loopback/tailnet/私有入口上保留此端点；不要直接将其暴露到公共互联网。

身份验证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享 gateway operator 密钥
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整的默认 operator 作用域集：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 将此端点上的聊天回合视为 owner-sender 回合
- 受信任的携带身份 HTTP 模式（例如 trusted proxy auth，或私有入口上的 `gateway.auth.mode="none"`）
  - 对某种外层受信任身份或部署边界进行身份验证
  - 当标头存在时遵循 `x-openclaw-scopes`
  - 当标头缺失时回退到正常的 operator 默认作用域集
  - 仅当调用方显式收窄 scopes 且省略 `operator.admin` 时才失去 owner 语义

请参阅 [Security](/zh-CN/gateway/security) 和 [Remote access](/zh-CN/gateway/remote)。

## 以智能体优先的模型契约

OpenClaw 将 OpenAI `model` 字段视为**智能体目标**，而不是原始 provider 模型 id。

- `model: "openclaw"` 会路由到已配置的默认智能体。
- `model: "openclaw/default"` 也会路由到已配置的默认智能体。
- `model: "openclaw/<agentId>"` 会路由到特定智能体。

可选请求标头：

- `x-openclaw-model: <provider/model-or-bare-id>` 会覆盖所选智能体的后端模型。
- `x-openclaw-agent-id: <agentId>` 仍支持作为兼容性覆盖。
- `x-openclaw-session-key: <sessionKey>` 完全控制会话路由。
- `x-openclaw-message-channel: <channel>` 为具备渠道感知能力的提示和策略设置合成入口渠道上下文。

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

默认情况下，此端点是**每个请求无状态**的（每次调用都会生成一个新的会话键）。

如果请求包含 OpenAI `user` 字符串，Gateway 网关会基于它派生出稳定的会话键，因此重复调用可以共享同一个智能体会话。

## 为什么这个表面很重要

这是对自托管前端和工具最有价值的一组兼容能力：

- 大多数 Open WebUI、LobeChat 和 LibreChat 配置都期望 `/v1/models`。
- 许多 RAG 系统期望 `/v1/embeddings`。
- 现有 OpenAI 聊天客户端通常可以从 `/v1/chat/completions` 开始。
- 更偏向智能体原生的客户端越来越倾向于使用 `/v1/responses`。

## 模型列表和智能体路由

<AccordionGroup>
  <Accordion title="`/v1/models` 返回什么？">
    OpenClaw 智能体目标列表。

    返回的 id 为 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>` 条目。
    直接将它们用作 OpenAI `model` 值即可。

  </Accordion>
  <Accordion title="`/v1/models` 列出的是智能体还是子智能体？">
    它列出的是顶层智能体目标，而不是后端 provider 模型，也不是子智能体。

    子智能体仍然属于内部执行拓扑。它们不会作为伪模型出现。

  </Accordion>
  <Accordion title="为什么包含 `openclaw/default`？">
    `openclaw/default` 是已配置默认智能体的稳定别名。

    这意味着即使不同环境之间真实的默认智能体 id 发生变化，客户端也可以持续使用同一个可预测 id。

  </Accordion>
  <Accordion title="如何覆盖后端模型？">
    使用 `x-openclaw-model`。

    示例：
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    如果省略它，所选智能体会按其正常配置的模型选择运行。

  </Accordion>
  <Accordion title="embeddings 如何适配这一契约？">
    `/v1/embeddings` 使用相同的智能体目标 `model` id。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    当你需要特定 embedding 模型时，请通过 `x-openclaw-model` 发送。
    如果没有该标头，请求会传递到所选智能体的正常 embedding 设置。

  </Accordion>
</AccordionGroup>

## 流式传输（SSE）

设置 `stream: true` 以接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行都是 `data: <json>`
- 流以 `data: [DONE]` 结束

## Open WebUI 快速设置

对于基础的 Open WebUI 连接：

- Base URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的 Base URL：`http://host.docker.internal:18789/v1`
- API key：你的 Gateway 网关 bearer token
- Model：`openclaw/default`

预期行为：

- `GET /v1/models` 应列出 `openclaw/default`
- Open WebUI 应使用 `openclaw/default` 作为聊天模型 id
- 如果你希望该智能体使用特定后端 provider/model，请设置该智能体的常规模型默认值，或发送 `x-openclaw-model`

快速 smoke：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果返回 `openclaw/default`，大多数 Open WebUI 配置都可以使用相同的 Base URL 和 token 进行连接。

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

- `/v1/models` 返回的是 OpenClaw 智能体目标，而不是原始 provider 目录。
- `openclaw/default` 始终存在，因此一个稳定 id 即可跨环境使用。
- 后端 provider/model 覆盖应放在 `x-openclaw-model` 中，而不是 OpenAI `model` 字段中。
- `/v1/embeddings` 支持将 `input` 作为字符串或字符串数组。

## 相关内容

- [Configuration reference](/zh-CN/gateway/configuration-reference)
- [OpenAI](/zh-CN/providers/openai)
