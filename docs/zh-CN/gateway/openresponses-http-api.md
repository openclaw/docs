---
read_when:
    - 集成使用 OpenResponses API 的客户端
    - 你想要基于 item 的输入、客户端工具调用或 SSE 事件
summary: 从 Gateway 网关公开与 OpenResponses 兼容的 `/v1/responses` HTTP 端点
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-24T04:02:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73f2e075b78e5153633af17c3f59cace4516e5aaa88952d643cfafb9d0df8022
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# OpenResponses API（HTTP）

OpenClaw 的 Gateway 网关可以提供一个与 OpenResponses 兼容的 `POST /v1/responses` 端点。

该端点**默认禁用**。请先在配置中启用它。

- `POST /v1/responses`
- 与 Gateway 网关相同的端口（WS + HTTP 复用）：`http://<gateway-host>:<port>/v1/responses`

在底层，请求会作为普通的 Gateway 网关智能体运行来执行（与
`openclaw agent` 使用相同的代码路径），因此路由 / 权限 / 配置会与你的 Gateway 网关保持一致。

## 认证、安全性与路由

其运行行为与 [OpenAI Chat Completions](/zh-CN/gateway/openai-http-api) 一致：

- 使用匹配的 Gateway 网关 HTTP 认证路径：
  - 共享密钥认证（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
  - trusted-proxy 认证（`gateway.auth.mode="trusted-proxy"`）：来自已配置的非 loopback trusted proxy 源的身份感知代理头
  - 私有入口开放认证（`gateway.auth.mode="none"`）：无需认证头
- 将该端点视为该 Gateway 网关实例的完整 operator 访问权限
- 对于共享密钥认证模式（`token` 和 `password`），忽略更窄的 bearer 声明的 `x-openclaw-scopes` 值，并恢复正常的完整 operator 默认值
- 对于携带可信身份的 HTTP 模式（例如 trusted proxy 认证或 `gateway.auth.mode="none"`），若存在 `x-openclaw-scopes` 则遵循其值，否则回退到正常的 operator 默认 scope 集合
- 使用 `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"` 或 `x-openclaw-agent-id` 选择智能体
- 当你想覆盖所选智能体的后端模型时，使用 `x-openclaw-model`
- 当你想显式进行会话路由时，使用 `x-openclaw-session-key`
- 当你想使用非默认的合成入口渠道上下文时，使用 `x-openclaw-message-channel`

认证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享 Gateway 网关 operator 密钥
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整的默认 operator scope 集合：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 将该端点上的聊天轮次视为 owner-sender 轮次
- 携带可信身份的 HTTP 模式（例如 trusted proxy 认证，或私有入口上的 `gateway.auth.mode="none"`）
  - 当头存在时遵循 `x-openclaw-scopes`
  - 当头缺失时回退到正常的 operator 默认 scope 集合
  - 仅当调用方显式缩小 scopes 且省略 `operator.admin` 时，才失去 owner 语义

使用 `gateway.http.endpoints.responses.enabled` 启用或禁用该端点。

相同的兼容性表面还包括：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

关于智能体目标模型、`openclaw/default`、embeddings 透传以及后端模型覆盖如何组合在一起的规范说明，请参见 [OpenAI Chat Completions](/zh-CN/gateway/openai-http-api#agent-first-model-contract) 和 [Model list and agent routing](/zh-CN/gateway/openai-http-api#model-list-and-agent-routing)。

## 会话行为

默认情况下，该端点对每个请求都是**无状态的**（每次调用都会生成一个新的会话键）。

如果请求包含 OpenResponses 的 `user` 字符串，Gateway 网关会从中派生一个稳定的会话键，
从而让重复调用可以共享同一个智能体会话。

## 请求结构（支持的部分）

请求遵循使用基于 item 输入的 OpenResponses API。当前支持：

- `input`：字符串或 item 对象数组。
- `instructions`：合并到系统提示中。
- `tools`：客户端工具定义（function tools）。
- `tool_choice`：筛选或强制要求客户端工具。
- `stream`：启用 SSE 流式传输。
- `max_output_tokens`：尽力而为的输出限制（取决于提供商）。
- `user`：稳定会话路由。

接受但**当前会忽略**：

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

支持：

- `previous_response_id`：当请求保持在相同的智能体 / 用户 / 请求的会话范围内时，OpenClaw 会复用先前响应的会话。

## Items（输入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 会追加到系统提示中。
- 最新的 `user` 或 `function_call_output` item 会成为“当前消息”。
- 更早的 user / assistant 消息会作为历史记录纳入上下文。

### `function_call_output`（基于轮次的工具）

将工具结果发送回模型：

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 和 `item_reference`

为保持 schema 兼容性而接受，但在构建提示时会被忽略。

## 工具（客户端函数工具）

通过 `tools: [{ type: "function", function: { name, description?, parameters? } }]` 提供工具。

如果智能体决定调用某个工具，响应会返回一个 `function_call` 输出 item。
然后你可以发送一个带有 `function_call_output` 的后续请求来继续这一轮。

## 图片（`input_image`）

支持 base64 或 URL 来源：

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

允许的 MIME 类型（当前）：`image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。
最大大小（当前）：10 MB。

## 文件（`input_file`）

支持 base64 或 URL 来源：

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

允许的 MIME 类型（当前）：`text/plain`、`text/markdown`、`text/html`、`text/csv`、
`application/json`、`application/pdf`。

最大大小（当前）：5 MB。

当前行为：

- 文件内容会被解码并添加到**系统提示**中，而不是用户消息中，
  因此它保持为临时内容（不会持久化到会话历史中）。
- 解码后的文件文本在添加前会被包装为**不受信任的外部内容**，
  因此文件字节会被视为数据，而不是可信指令。
- 注入的块使用显式边界标记，例如
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`，并包含
  一行 `Source: External` 元数据。
- 该文件输入路径有意省略较长的 `SECURITY NOTICE:` 横幅，以
  保留提示预算；边界标记和元数据仍会保留。
- PDF 会先解析为文本。如果找到的文本很少，则会将前几页
  光栅化为图片并传递给模型，而注入的文件块会使用
  占位符 `[PDF content rendered to images]`。

PDF 解析使用适用于 Node 的 `pdfjs-dist` legacy 构建（无 worker）。现代
PDF.js 构建依赖浏览器 workers / DOM 全局对象，因此不会在 Gateway 网关中使用。

URL 抓取默认值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每个请求中基于 URL 的 `input_file` + `input_image` 部分总数）
- 请求受到保护（DNS 解析、私有 IP 阻止、重定向上限、超时）。
- 每种输入类型都支持可选的主机名允许列表（`files.urlAllowlist`、`images.urlAllowlist`）。
  - 精确主机：`"cdn.example.com"`
  - 通配子域名：`"*.assets.example.com"`（不匹配 apex）
  - 空的或省略的允许列表表示没有主机名允许列表限制。
- 要完全禁用基于 URL 的抓取，请设置 `files.allowUrl: false` 和 / 或 `images.allowUrl: false`。

## 文件 + 图片限制（配置）

可以在 `gateway.http.endpoints.responses` 下调整默认值：

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

省略时的默认值：

- `maxBodyBytes`：20 MB
- `maxUrlParts`：8
- `files.maxBytes`：5 MB
- `files.maxChars`：200k
- `files.maxRedirects`：3
- `files.timeoutMs`：10 秒
- `files.pdf.maxPages`：4
- `files.pdf.maxPixels`：4,000,000
- `files.pdf.minTextChars`：200
- `images.maxBytes`：10 MB
- `images.maxRedirects`：3
- `images.timeoutMs`：10 秒
- HEIC/HEIF `input_image` 来源会被接受，并在交付给提供商前标准化为 JPEG。

安全说明：

- URL 允许列表会在抓取前和每次重定向跳转时强制执行。
- 将主机名加入允许列表并不会绕过对私有 / 内部 IP 的阻止。
- 对于暴露在互联网中的 Gateway 网关，除应用层保护外，还应应用网络出口控制。
  参见 [Security](/zh-CN/gateway/security)。

## 流式传输（SSE）

设置 `stream: true` 以接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行格式为 `event: <type>` 和 `data: <json>`
- 流以 `data: [DONE]` 结束

当前发出的事件类型：

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed`（发生错误时）

## 用量

当底层提供商报告 token 计数时，会填充 `usage`。
OpenClaw 会在这些计数器到达下游状态 / 会话表面之前，标准化常见的
OpenAI 风格别名，包括 `input_tokens` / `output_tokens`
以及 `prompt_tokens` / `completion_tokens`。

## 错误

错误使用如下 JSON 对象：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常见情况：

- `401` 缺少 / 无效认证
- `400` 无效请求体
- `405` 错误的请求方法

## 示例

非流式：

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

流式：

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## 相关内容

- [OpenAI chat completions](/zh-CN/gateway/openai-http-api)
- [OpenAI](/zh-CN/providers/openai)
