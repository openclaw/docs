---
read_when:
    - 集成使用 OpenResponses API 的客户端
    - 你需要基于 item 的输入、客户端工具调用或 SSE 事件
summary: 从 Gateway 网关公开一个与 OpenResponses 兼容的 `/v1/responses` HTTP 端点
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-25T00:41:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

OpenClaw 的 Gateway 网关可以提供一个与 OpenResponses 兼容的 `POST /v1/responses` 端点。

此端点**默认禁用**。请先在配置中启用它。

- `POST /v1/responses`
- 与 Gateway 网关相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/responses`

在底层，请求会作为一次普通的 Gateway 网关智能体运行来执行（与
`openclaw agent` 使用相同的代码路径），因此路由/权限/配置会与你的 Gateway 网关保持一致。

## 认证、安全性与路由

操作行为与 [OpenAI Chat Completions](/zh-CN/gateway/openai-http-api) 一致：

- 使用匹配的 Gateway 网关 HTTP 认证路径：
  - 共享密钥认证（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
  - 受信任代理认证（`gateway.auth.mode="trusted-proxy"`）：来自已配置的非 loopback 受信任代理源的身份感知代理头
  - 私有入口开放认证（`gateway.auth.mode="none"`）：无需认证头
- 将该端点视为对网关实例的完整操作员访问权限
- 对于共享密钥认证模式（`token` 和 `password`），忽略更窄的 bearer 声明 `x-openclaw-scopes` 值，并恢复正常的完整操作员默认值
- 对于受信任且携带身份的 HTTP 模式（例如受信任代理认证，或私有入口上的 `gateway.auth.mode="none"`），若存在 `x-openclaw-scopes` 则予以遵循，否则回退到正常的操作员默认作用域集合
- 使用 `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"` 或 `x-openclaw-agent-id` 选择智能体
- 当你想覆盖所选智能体的后端模型时，使用 `x-openclaw-model`
- 使用 `x-openclaw-session-key` 进行显式会话路由
- 当你想要非默认的合成入口渠道上下文时，使用 `x-openclaw-message-channel`

认证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享 Gateway 网关操作员密钥
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整的默认操作员作用域集合：
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 将此端点上的聊天轮次视为 owner-sender 轮次
- 受信任且携带身份的 HTTP 模式（例如受信任代理认证，或私有入口上的 `gateway.auth.mode="none"`）
  - 当请求头存在时遵循 `x-openclaw-scopes`
  - 当请求头缺失时回退到正常的默认操作员作用域集合
  - 只有在调用方显式收窄作用域且省略 `operator.admin` 时，才会失去 owner 语义

使用 `gateway.http.endpoints.responses.enabled` 启用或禁用此端点。

相同的兼容性表面还包括：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

关于面向智能体的模型、`openclaw/default`、embeddings 透传以及后端模型覆盖如何配合工作的规范说明，请参见 [OpenAI Chat Completions](/zh-CN/gateway/openai-http-api#agent-first-model-contract) 和 [模型列表与智能体路由](/zh-CN/gateway/openai-http-api#model-list-and-agent-routing)。

## 会话行为

默认情况下，此端点对每个请求都是**无状态的**（每次调用都会生成一个新的会话键）。

如果请求包含 OpenResponses 的 `user` 字符串，Gateway 网关会从中派生出一个稳定的会话键，
这样重复调用就可以共享同一个智能体会话。

## 请求形状（支持）

请求遵循使用基于 item 输入的 OpenResponses API。当前支持：

- `input`：字符串或 item 对象数组。
- `instructions`：合并到系统提示词中。
- `tools`：客户端工具定义（function 工具）。
- `tool_choice`：过滤或强制使用客户端工具。
- `stream`：启用 SSE 流式传输。
- `max_output_tokens`：尽力限制输出长度（取决于提供商）。
- `user`：稳定会话路由。

可接受但**当前会忽略**：

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

支持：

- `previous_response_id`：当请求保持在同一个智能体/用户/请求会话作用域内时，OpenClaw 会复用先前响应的会话。

## Items（输入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 会附加到系统提示词中。
- 最近的 `user` 或 `function_call_output` item 会成为“当前消息”。
- 更早的 user/assistant 消息会作为历史记录纳入上下文。

### `function_call_output`（基于轮次的工具）

将工具结果返回给模型：

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 和 `item_reference`

为保持 schema 兼容性而接受，但在构建提示词时会被忽略。

## 工具（客户端 function 工具）

使用 `tools: [{ type: "function", function: { name, description?, parameters? } }]` 提供工具。

如果智能体决定调用某个工具，响应会返回一个 `function_call` 输出 item。
然后你发送一个带有 `function_call_output` 的后续请求，以继续该轮对话。

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

- 文件内容会被解码并添加到**系统提示词**中，而不是用户消息中，
  因此它保持为临时内容（不会持久化到会话历史中）。
- 解码后的文件文本在添加前会被包装为**不受信任的外部内容**，
  因此文件字节会被视为数据，而不是受信任的指令。
- 注入的块会使用明确的边界标记，例如
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`，并包含一行
  `Source: External` 元数据。
- 此文件输入路径会刻意省略冗长的 `SECURITY NOTICE:` 横幅，
  以保留提示词预算；边界标记和元数据仍会保留。
- PDF 会先解析文本。如果检测到的文本很少，则会将前几页
  栅格化为图片并传递给模型，此时注入的文件块会使用占位符
  `[PDF content rendered to images]`。

PDF 解析由内置的 `document-extract` 插件提供，它使用
适用于 Node 的 `pdfjs-dist` legacy 构建（不使用 worker）。现代的 PDF.js 构建
依赖浏览器 worker/DOM 全局对象，因此不会在 Gateway 网关中使用。

URL 抓取默认值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每个请求中基于 URL 的 `input_file` + `input_image` 部分总数）
- 请求会受到保护（DNS 解析、私有 IP 阻止、重定向上限、超时）。
- 每种输入类型都支持可选的主机名 allowlist（`files.urlAllowlist`、`images.urlAllowlist`）。
  - 精确主机：`"cdn.example.com"`
  - 通配子域名：`"*.assets.example.com"`（不匹配 apex）
  - 空 allowlist 或省略 allowlist 表示不限制主机名 allowlist。
- 若要完全禁用基于 URL 的抓取，请设置 `files.allowUrl: false` 和/或 `images.allowUrl: false`。

## 文件与图片限制（配置）

默认值可在 `gateway.http.endpoints.responses` 下调整：

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
- HEIC/HEIF `input_image` 来源会被接受，并在传递给提供商之前规范化为 JPEG。

安全说明：

- URL allowlist 会在抓取前以及每次重定向跳转时强制执行。
- 将某个主机名加入 allowlist 并不会绕过对私有/内部 IP 的阻止。
- 对于暴露在互联网中的网关，除了应用层保护外，还应实施网络出口控制。
  参见 [安全性](/zh-CN/gateway/security)。

## 流式传输（SSE）

设置 `stream: true` 以接收服务器发送事件（SSE）：

- `Content-Type: text/event-stream`
- 每一行事件格式为 `event: <type>` 和 `data: <json>`
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
- `response.failed`（出错时）

## 用量

当底层提供商报告 token 计数时，`usage` 会被填充。
在这些计数进入下游状态/会话表面之前，OpenClaw 会规范化常见的 OpenAI 风格别名，
包括 `input_tokens` / `output_tokens`
以及 `prompt_tokens` / `completion_tokens`。

## 错误

错误使用如下 JSON 对象：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常见情况：

- `401` 缺少认证或认证无效
- `400` 请求体无效
- `405` 方法错误

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
