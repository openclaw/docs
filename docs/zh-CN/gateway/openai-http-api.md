---
read_when:
    - 集成需要 OpenAI Chat Completions 的工具
summary: 从 Gateway 网关公开一个兼容 OpenAI 的 /v1/chat/completions HTTP 端点
title: OpenAI 聊天补全
x-i18n:
    generated_at: "2026-06-27T02:04:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 网关可以提供一个小型的、兼容 OpenAI 的 Chat Completions 端点。

该端点**默认禁用**。请先在配置中启用它。

- `POST /v1/chat/completions`
- 与 Gateway 网关使用相同端口（WS + HTTP 复用）：`http://<gateway-host>:<port>/v1/chat/completions`

启用 Gateway 网关的兼容 OpenAI 的 HTTP 表面后，它还会提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底层，请求会作为普通 Gateway 网关智能体运行来执行（与 `openclaw agent` 相同的代码路径），因此路由/权限/配置与你的 Gateway 网关一致。

## 身份验证

使用 Gateway 网关身份验证配置。

常见 HTTP 身份验证路径：

- 共享密钥身份验证（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 带可信身份的 HTTP 身份验证（`gateway.auth.mode="trusted-proxy"`）：
  通过已配置的身份感知代理路由，并让它注入所需的身份标头
- 私有入口开放身份验证（`gateway.auth.mode="none"`）：
  不需要身份验证标头

说明：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 当 `gateway.auth.mode="trusted-proxy"` 时，HTTP 请求必须来自已配置的可信代理来源；同主机 loopback 代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 绕过代理的内部同主机调用方可以使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 作为本地直连回退。任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 标头证据都会让请求改走可信代理路径。
- 如果配置了 `gateway.auth.rateLimit` 且身份验证失败次数过多，该端点会返回带有 `Retry-After` 的 `429`。

## 安全边界（重要）

将该端点视为 Gateway 网关实例的**完整操作者访问**表面。

- 这里的 HTTP bearer 身份验证不是狭义的按用户作用域模型。
- 该端点的有效 Gateway 网关令牌/密码应被视为所有者/操作者凭据。
- 请求会通过与可信操作者操作相同的控制平面智能体路径运行。
- 该端点没有单独的非所有者/按用户工具边界；一旦调用方在这里通过 Gateway 网关身份验证，OpenClaw 就会将该调用方视为此 Gateway 网关的可信操作者。
- 对于共享密钥身份验证模式（`token` 和 `password`），即使调用方发送了范围更窄的 `x-openclaw-scopes` 标头，该端点也会恢复正常的完整操作者默认值。
- 带可信身份的 HTTP 模式（例如可信代理身份验证或 `gateway.auth.mode="none"`）会在存在 `x-openclaw-scopes` 时遵循它，否则回退到正常的操作者默认作用域集合。
- 如果目标智能体策略允许敏感工具，该端点可以使用它们。
- 只将该端点保留在 loopback/tailnet/私有入口上；不要将它直接暴露到公共互联网。

身份验证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享 Gateway 网关操作者密钥
  - 忽略范围更窄的 `x-openclaw-scopes`
  - 恢复完整的默认操作者作用域集合：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 将此端点上的聊天轮次视为所有者发送方轮次
- 带可信身份的 HTTP 模式（例如可信代理身份验证，或私有入口上的 `gateway.auth.mode="none"`）
  - 对某个外部可信身份或部署边界进行身份验证
  - 当标头存在时遵循 `x-openclaw-scopes`
  - 当标头不存在时回退到正常的操作者默认作用域集合
  - 仅当调用方显式缩小作用域且省略 `operator.admin` 时，才会失去所有者语义
  - 对 `x-openclaw-model` 等所有者级请求控制，需要 `operator.admin`

参见 [安全](/zh-CN/gateway/security) 和 [远程访问](/zh-CN/gateway/remote)。

## 何时使用此端点

当你要将工具或可信应用侧后端与现有 Gateway 网关集成，并且可以安全持有 Gateway 网关操作者凭据时，请使用 `/v1/chat/completions`。

- 当你的集成只是同一个 Gateway 网关的另一个操作者/客户端表面时，优先使用它，而不是添加新的内置渠道。
- 对于直接连接到远程 Gateway 网关的原生移动客户端，优先使用 [WebChat](/zh-CN/web/webchat) 或 [Gateway 协议](/zh-CN/gateway/protocol)，并实现已配对设备的 bootstrap/设备令牌流程，这样设备就不需要共享 HTTP 令牌/密码。
- 当你要集成一个有自己的用户、房间、webhook 投递或出站传输的外部消息网络时，请改为构建渠道插件。参见 [Building plugins](/zh-CN/plugins/building-plugins)。

## 智能体优先的模型契约

OpenClaw 将 OpenAI `model` 字段视为**智能体目标**，而不是原始提供商模型 ID。

- `model: "openclaw"` 路由到已配置的默认智能体。
- `model: "openclaw/default"` 也路由到已配置的默认智能体。
- `model: "openclaw/<agentId>"` 路由到特定智能体。

可选请求标头：

- `x-openclaw-model: <provider/model-or-bare-id>` 覆盖所选智能体的后端模型。共享密钥 bearer 调用方可以使用此标头。带身份的调用方，例如带 `x-openclaw-scopes` 的可信代理或私有无身份验证入口请求，需要 `operator.admin`；仅写入调用方会得到 `403 missing scope: operator.admin`。
- `x-openclaw-agent-id: <agentId>` 仍作为兼容性覆盖受支持。
- `x-openclaw-session-key: <sessionKey>` 显式控制会话路由。该值不得使用保留的内部会话命名空间，例如 `subagent:`、`cron:` 或 `acp:`；这些请求会以 `400 invalid_request_error` 被拒绝。
- `x-openclaw-message-channel: <channel>` 为感知渠道的提示和策略设置合成入口渠道上下文。

仍接受的兼容别名：

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

如果请求包含 OpenAI `user` 字符串，Gateway 网关会从中派生稳定的会话键，因此重复调用可以共享同一个智能体会话。

对于自定义应用，最安全的默认做法是为每个对话线程复用相同的 `user` 值。除非你明确希望多个对话或设备共享一个 OpenClaw 会话，否则请避免使用账号级标识符。仅当你需要在多个客户端或线程之间进行显式路由控制时才使用 `x-openclaw-session-key`，并选择应用拥有的键，且不要以保留的内部命名空间开头，例如 `subagent:`、`cron:` 或 `acp:`。

## 为什么这个表面很重要

这是面向自托管前端和工具的最高杠杆兼容性集合：

- 大多数 Open WebUI、LobeChat 和 LibreChat 设置期望 `/v1/models`。
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
    它列出顶层智能体目标，而不是后端提供商模型，也不是子智能体。

    子智能体仍是内部执行拓扑。它们不会作为伪模型出现。

  </Accordion>
  <Accordion title="为什么包含 `openclaw/default`？">
    `openclaw/default` 是已配置默认智能体的稳定别名。

    这意味着即使真实默认智能体 ID 在环境之间发生变化，客户端也可以继续使用一个可预测的 ID。

  </Accordion>
  <Accordion title="如何覆盖后端模型？">
    使用 `x-openclaw-model`。这是所有者级覆盖：它适用于 Gateway 网关共享密钥 bearer 令牌/密码路径，并且在可信代理身份验证等带身份的 HTTP 路径上需要 `operator.admin`。

    示例：
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    如果省略它，所选智能体会使用其正常配置的模型选择运行。

  </Accordion>
  <Accordion title="嵌入如何适配此契约？">
    `/v1/embeddings` 使用相同的智能体目标 `model` ID。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    当你需要特定嵌入模型时，从共享密钥调用方或带有 `operator.admin` 的带身份调用方在 `x-openclaw-model` 中发送它。
    如果没有该标头，请求会传递到所选智能体的正常嵌入设置。

  </Accordion>
</AccordionGroup>

## 流式传输（SSE）

设置 `stream: true` 以接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行都是 `data: <json>`
- 流以 `data: [DONE]` 结束

## 聊天工具契约

`/v1/chat/completions` 支持与常见 OpenAI Chat 客户端兼容的函数工具子集。

### 支持的请求字段

- `tools`：`{ "type": "function", "function": { ... } }` 数组
- `tool_choice`：`"auto"`、`"none"`、`"required"`，或 `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` 后续轮次
- `messages[*].tool_call_id` 用于将工具结果绑定回先前的工具调用
- `max_completion_tokens`：数字；每次调用的总补全 token 上限（包含推理 token）。当前 OpenAI Chat Completions 字段名；当同时发送 `max_completion_tokens` 和 `max_tokens` 时优先使用。
- `max_tokens`：数字；为向后兼容而接受的旧版别名。当同时存在 `max_completion_tokens` 时会被忽略。
- `temperature`：数字；尽力而为的采样温度，通过智能体流参数渠道转发到上游提供商。
- `top_p`：数字；尽力而为的 nucleus 采样，通过智能体流参数渠道转发到上游提供商。
- `frequency_penalty`：数字；尽力而为的频率惩罚，通过智能体流参数渠道转发到上游提供商。验证范围：-2.0 到 2.0。超出范围的值会返回 `400 invalid_request_error`。
- `presence_penalty`：数字；尽力而为的存在惩罚，通过智能体流参数渠道转发到上游提供商。验证范围：-2.0 到 2.0。超出范围的值会返回 `400 invalid_request_error`。
- `seed`：数字（整数）；尽力而为的 seed，通过智能体流参数渠道转发到上游提供商。非整数值会返回 `400 invalid_request_error`。
- `stop`：字符串或最多 4 个字符串的数组；尽力而为的 stop 序列，通过智能体流参数渠道转发到上游提供商。超过 4 个序列或包含非字符串/空条目时会返回 `400 invalid_request_error`。

设置任一 token 上限字段时，该值会通过智能体 stream-param 渠道转发给上游提供商。发送给上游提供商的实际线路字段名由提供商传输层选择：OpenAI 系端点使用 `max_completion_tokens`，仅接受旧名称的提供商（例如 Mistral 和 Chutes）使用 `max_tokens`。采样字段（`temperature`、`top_p`、`frequency_penalty`、`presence_penalty`、`seed`）遵循同一个 stream-param 渠道；基于 ChatGPT 的 Codex Responses 后端会在服务器端剥离这些字段，因为它使用固定采样。`stop` 也走 stream-param 渠道，并映射到传输层的 stop 字段（Chat Completions 后端为 `stop`，Anthropic 为 `stop_sequences`）；OpenAI Responses API 没有 stop 参数，因此 `stop` 不会应用到基于 Responses 的模型。

### 不支持的变体

对于不支持的工具变体，端点会返回 `400 invalid_request_error`，包括：

- 非数组 `tools`
- 非函数工具条目
- 缺少 `tool.function.name`
- `tool_choice` 变体，例如 `allowed_tools` 和 `custom`
- 与提供的 `tools` 不匹配的 `tool_choice.function.name` 值

对于 `tool_choice: "required"` 和固定到函数的 `tool_choice`，端点会收窄暴露的客户端函数工具集，指示运行时在响应前调用客户端工具，并在智能体响应未包含匹配的结构化客户端工具调用时返回错误。此契约适用于调用方提供的 HTTP `tools` 列表，而不是每个 OpenClaw 内部智能体工具。

### 非流式工具响应形状

当智能体决定调用工具时，响应使用：

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` 条目包含：
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments`（JSON 字符串）

工具调用前的助手说明会在 `choices[0].message.content` 中返回（可能为空）。

### 流式工具响应形状

当 `stream: true` 时，工具调用会作为增量 SSE 分块发出：

- 初始助手角色增量
- 可选的助手说明增量
- 一个或多个携带工具身份和参数片段的 `delta.tool_calls` 分块
- 带有 `finish_reason: "tool_calls"` 的最终分块
- `data: [DONE]`

如果 `stream_options.include_usage=true`，会在 `[DONE]` 前发出一个尾随的用量分块。

### 工具后续循环

收到 `tool_calls` 后，客户端应执行请求的函数，并发送包含以下内容的后续请求：

- 之前的助手工具调用消息
- 一个或多个带匹配 `tool_call_id` 的 `role: "tool"` 消息

这允许 Gateway 网关智能体运行继续同一个推理循环，并生成最终助手回答。

## Open WebUI 快速设置

对于基本的 Open WebUI 连接：

- 基础 URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的基础 URL：`http://host.docker.internal:18789/v1`
- API key：你的 Gateway 网关 bearer token
- 模型：`openclaw/default`

预期行为：

- `GET /v1/models` 应列出 `openclaw/default`
- Open WebUI 应使用 `openclaw/default` 作为聊天模型 ID
- 如果你希望该智能体使用特定后端提供商/模型，请设置智能体的常规默认模型，或从共享密钥调用方、或带身份且拥有 `operator.admin` 的调用方发送 `x-openclaw-model`

快速冒烟测试：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果返回 `openclaw/default`，大多数 Open WebUI 设置都可以使用相同的基础 URL 和 token 连接。

## 示例

为一个应用会话提供稳定会话：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

在该会话的后续调用中复用相同的 `user` 值，以继续同一个智能体会话。

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

说明：

- `/v1/models` 返回 OpenClaw 智能体目标，而不是原始提供商目录。
- `openclaw/default` 始终存在，因此一个稳定 ID 可跨环境工作。
- 后端提供商/模型覆盖应放在 `x-openclaw-model` 中，而不是 OpenAI `model` 字段中。在带身份的 HTTP 认证路径上，此标头需要 `operator.admin`。
- `/v1/embeddings` 支持 `input` 为字符串或字符串数组。

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference)
- [OpenAI](/zh-CN/providers/openai)
