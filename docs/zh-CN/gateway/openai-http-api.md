---
read_when:
    - 集成预期使用 OpenAI Chat Completions 的工具
summary: 从 Gateway 网关公开一个 OpenAI 兼容的 /v1/chat/completions HTTP 端点
title: OpenAI 聊天补全
x-i18n:
    generated_at: "2026-05-12T15:43:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 网关可以提供一个小型的 OpenAI 兼容聊天补全端点。

此端点**默认禁用**。请先在配置中启用它。

- `POST /v1/chat/completions`
- 与 Gateway 网关相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/chat/completions`

启用 Gateway 网关的 OpenAI 兼容 HTTP 表面后，它还会提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底层，请求会作为普通 Gateway 网关智能体运行来执行（与 `openclaw agent` 相同的代码路径），因此路由/权限/配置与你的 Gateway 网关一致。

## 认证

使用 Gateway 网关认证配置。

常见 HTTP 认证路径：

- 共享密钥认证（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 带可信身份的 HTTP 认证（`gateway.auth.mode="trusted-proxy"`）：
  通过已配置的身份感知代理进行路由，并让它注入
  所需的身份标头
- 私有入口开放认证（`gateway.auth.mode="none"`）：
  不需要认证标头

注意：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 当 `gateway.auth.mode="trusted-proxy"` 时，HTTP 请求必须来自
  已配置的可信代理来源；同主机回环代理需要显式设置
  `gateway.auth.trustedProxy.allowLoopback = true`。
- 如果配置了 `gateway.auth.rateLimit` 且认证失败次数过多，端点会返回带 `Retry-After` 的 `429`。

## 安全边界（重要）

将此端点视为该 Gateway 网关实例的**完整操作员访问**表面。

- 这里的 HTTP bearer 认证不是窄范围的按用户作用域模型。
- 此端点的有效 Gateway 网关令牌/密码应被视为所有者/操作员凭证。
- 请求会通过与可信操作员操作相同的控制平面智能体路径运行。
- 此端点没有单独的非所有者/按用户工具边界；调用者一旦通过这里的 Gateway 网关认证，OpenClaw 就会将该调用者视为此 Gateway 网关的可信操作员。
- 对于共享密钥认证模式（`token` 和 `password`），即使调用者发送更窄的 `x-openclaw-scopes` 标头，端点也会恢复正常的完整操作员默认值。
- 带可信身份的 HTTP 模式（例如可信代理认证或 `gateway.auth.mode="none"`）会在存在 `x-openclaw-scopes` 时遵循它，否则回退到正常的操作员默认作用域集合。
- 如果目标智能体策略允许敏感工具，此端点可以使用它们。
- 仅将此端点保持在回环/tailnet/私有入口上；不要将其直接暴露到公共互联网。

认证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享 Gateway 网关操作员密钥
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整的默认操作员作用域集合：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 将此端点上的聊天轮次视为所有者发送方轮次
- 带可信身份的 HTTP 模式（例如可信代理认证，或私有入口上的 `gateway.auth.mode="none"`）
  - 认证某个外层可信身份或部署边界
  - 当标头存在时遵循 `x-openclaw-scopes`
  - 当标头缺失时回退到正常的操作员默认作用域集合
  - 仅当调用者显式缩窄作用域并省略 `operator.admin` 时，才会失去所有者语义

参见 [安全](/zh-CN/gateway/security) 和 [远程访问](/zh-CN/gateway/remote)。

## 智能体优先的模型契约

OpenClaw 将 OpenAI `model` 字段视为**智能体目标**，而不是原始提供商模型 ID。

- `model: "openclaw"` 路由到已配置的默认智能体。
- `model: "openclaw/default"` 也路由到已配置的默认智能体。
- `model: "openclaw/<agentId>"` 路由到特定智能体。

可选请求标头：

- `x-openclaw-model: <provider/model-or-bare-id>` 覆盖所选智能体的后端模型。
- `x-openclaw-agent-id: <agentId>` 仍作为兼容性覆盖受支持。
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

默认情况下，此端点**每个请求无状态**（每次调用都会生成新的会话键）。

如果请求包含 OpenAI `user` 字符串，Gateway 网关会从中派生稳定的会话键，因此重复调用可以共享一个智能体会话。

## 此表面的重要性

这是面向自托管前端和工具的最高杠杆兼容性集合：

- 大多数 Open WebUI、LobeChat 和 LibreChat 设置都期望 `/v1/models`。
- 许多 RAG 系统期望 `/v1/embeddings`。
- 现有 OpenAI 聊天客户端通常可以从 `/v1/chat/completions` 开始。
- 更多智能体原生客户端越来越偏好 `/v1/responses`。

## 模型列表和智能体路由

<AccordionGroup>
  <Accordion title="`/v1/models` 返回什么？">
    一个 OpenClaw 智能体目标列表。

    返回的 ID 是 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>` 条目。
    直接将它们用作 OpenAI `model` 值。

  </Accordion>
  <Accordion title="`/v1/models` 列出智能体还是子智能体？">
    它列出顶层智能体目标，不列出后端提供商模型，也不列出子智能体。

    子智能体仍然是内部执行拓扑。它们不会作为伪模型出现。

  </Accordion>
  <Accordion title="为什么包含 `openclaw/default`？">
    `openclaw/default` 是已配置默认智能体的稳定别名。

    这意味着即使真实的默认智能体 ID 在不同环境之间发生变化，客户端也可以继续使用一个可预测的 ID。

  </Accordion>
  <Accordion title="如何覆盖后端模型？">
    使用 `x-openclaw-model`。

    示例：
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    如果省略它，所选智能体会使用其正常配置的模型选择运行。

  </Accordion>
  <Accordion title="嵌入如何适配此契约？">
    `/v1/embeddings` 使用相同的智能体目标 `model` ID。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    当你需要特定嵌入模型时，在 `x-openclaw-model` 中发送它。
    如果没有该标头，请求会传递到所选智能体的正常嵌入设置。

  </Accordion>
</AccordionGroup>

## 流式传输（SSE）

设置 `stream: true` 以接收服务器发送事件（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行都是 `data: <json>`
- 流以 `data: [DONE]` 结束

## 聊天工具契约

`/v1/chat/completions` 支持与常见 OpenAI Chat 客户端兼容的函数工具子集。

### 支持的请求字段

- `tools`：`{ "type": "function", "function": { ... } }` 的数组
- `tool_choice`：`"auto"`、`"none"`
- `messages[*].role: "tool"` 后续轮次
- `messages[*].tool_call_id`，用于将工具结果绑定回先前的工具调用
- `max_completion_tokens`：数字；每次调用的总补全令牌上限（包括推理令牌）。当前 OpenAI Chat Completions 字段名；当同时发送 `max_completion_tokens` 和 `max_tokens` 时优先使用。
- `max_tokens`：数字；为向后兼容而接受的旧版别名。当同时存在 `max_completion_tokens` 时会被忽略。

当任一字段被设置时，该值会通过智能体流参数通道转发给上游提供商。发送给上游提供商的实际线路字段名由提供商传输层选择：OpenAI 系端点使用 `max_completion_tokens`，仅接受旧版名称的提供商（如 Mistral 和 Chutes）使用 `max_tokens`。

### 不支持的变体

对于不支持的工具变体，端点返回 `400 invalid_request_error`，包括：

- 非数组 `tools`
- 非函数工具条目
- 缺失 `tool.function.name`
- `tool_choice` 变体，例如 `allowed_tools` 和 `custom`
- `tool_choice: "required"`（运行时尚未强制执行；硬性强制实现后将支持）
- `tool_choice: { "type": "function", "function": { "name": "..." } }`（理由同 `required`）
- 与提供的 `tools` 不匹配的 `tool_choice.function.name` 值

### 非流式工具响应形状

当智能体决定调用工具时，响应使用：

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` 条目包含：
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments`（JSON 字符串）

工具调用前的助手评论会在 `choices[0].message.content` 中返回（可能为空）。

### 流式工具响应形状

当 `stream: true` 时，工具调用会作为增量 SSE 分块发出：

- 初始助手角色 delta
- 可选的助手评论 delta
- 一个或多个携带工具身份和参数片段的 `delta.tool_calls` 分块
- 带有 `finish_reason: "tool_calls"` 的最终分块
- `data: [DONE]`

如果 `stream_options.include_usage=true`，会在 `[DONE]` 前发出尾随用量分块。

### 工具后续循环

收到 `tool_calls` 后，客户端应执行请求的函数，并发送包含以下内容的后续请求：

- 先前的助手工具调用消息
- 一个或多个带匹配 `tool_call_id` 的 `role: "tool"` 消息

这允许 Gateway 网关智能体运行继续相同的推理循环，并生成最终助手答案。

## Open WebUI 快速设置

对于基础 Open WebUI 连接：

- Base URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的 Base URL：`http://host.docker.internal:18789/v1`
- API key：你的 Gateway 网关 bearer 令牌
- Model：`openclaw/default`

预期行为：

- `GET /v1/models` 应列出 `openclaw/default`
- Open WebUI 应使用 `openclaw/default` 作为聊天模型 ID
- 如果你想为该智能体指定特定后端提供商/模型，请设置智能体的正常默认模型，或发送 `x-openclaw-model`

快速冒烟测试：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果它返回 `openclaw/default`，大多数 Open WebUI 设置都可以使用相同的 Base URL 和令牌连接。

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
- `openclaw/default` 始终存在，因此一个稳定标识符可跨环境使用。
- 后端提供商/模型覆盖应放在 `x-openclaw-model` 中，而不是 OpenAI 的 `model` 字段。
- `/v1/embeddings` 支持将 `input` 设为字符串或字符串数组。

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [OpenAI](/zh-CN/providers/openai)
