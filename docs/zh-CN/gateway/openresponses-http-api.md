---
read_when:
    - 集成支持 OpenResponses API 的客户端
    - 你需要基于条目的输入、客户端工具调用或 SSE 事件
summary: 从 Gateway 网关暴露一个与 OpenResponses 兼容的 /v1/responses HTTP 端点
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-28T11:53:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 网关可以提供兼容 OpenResponses 的 `POST /v1/responses` 端点。

此端点**默认禁用**。请先在配置中启用它。

- `POST /v1/responses`
- 与 Gateway 网关相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/responses`

在底层，请求会作为普通 Gateway 网关智能体运行来执行（与
`openclaw agent` 相同的代码路径），因此路由/权限/配置与你的 Gateway 网关一致。

## 身份验证、安全和路由

运行行为与 [OpenAI 聊天补全](/zh-CN/gateway/openai-http-api)一致：

- 使用匹配的 Gateway 网关 HTTP 认证路径：
  - 共享密钥认证（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
  - 可信代理认证（`gateway.auth.mode="trusted-proxy"`）：来自已配置可信代理来源的身份感知代理标头；同主机 loopback 代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`
  - 私有入口开放认证（`gateway.auth.mode="none"`）：无认证标头
- 将该端点视为对 Gateway 网关实例的完整操作员访问权限
- 对于共享密钥认证模式（`token` 和 `password`），忽略范围更窄的 bearer 声明型 `x-openclaw-scopes` 值，并恢复正常的完整操作员默认值
- 对于带可信身份的 HTTP 模式（例如可信代理认证或 `gateway.auth.mode="none"`），当存在 `x-openclaw-scopes` 时遵循它，否则回退到正常的操作员默认作用域集合
- 使用 `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"` 或 `x-openclaw-agent-id` 选择智能体
- 当你想覆盖所选智能体的后端模型时，使用 `x-openclaw-model`
- 使用 `x-openclaw-session-key` 进行显式会话路由
- 当你想要非默认的合成入口渠道上下文时，使用 `x-openclaw-message-channel`

认证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享的 Gateway 网关操作员密钥
  - 忽略范围更窄的 `x-openclaw-scopes`
  - 恢复完整的默认操作员作用域集合：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 将此端点上的聊天轮次视为所有者发送方轮次
- 带可信身份的 HTTP 模式（例如可信代理认证，或私有入口上的 `gateway.auth.mode="none"`）
  - 当标头存在时遵循 `x-openclaw-scopes`
  - 当标头缺失时回退到正常的操作员默认作用域集合
  - 只有在调用方显式缩小作用域并省略 `operator.admin` 时，才会失去所有者语义

使用 `gateway.http.endpoints.responses.enabled` 启用或禁用此端点。

同一兼容性表面还包括：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

关于智能体目标模型、`openclaw/default`、嵌入透传以及后端模型覆盖如何配合工作的权威说明，请参阅 [OpenAI 聊天补全](/zh-CN/gateway/openai-http-api#agent-first-model-contract)和[模型列表与智能体路由](/zh-CN/gateway/openai-http-api#model-list-and-agent-routing)。

## 会话行为

默认情况下，该端点**每个请求都是无状态的**（每次调用都会生成新的会话键）。

如果请求包含 OpenResponses `user` 字符串，Gateway 网关会从中派生稳定的会话键，
因此重复调用可以共享一个智能体会话。

## 请求形态（支持）

请求遵循基于条目的 OpenResponses API。当前支持：

- `input`：字符串或条目对象数组。
- `instructions`：合并到系统提示词中。
- `tools`：客户端工具定义（函数工具）。
- `tool_choice`：过滤或要求客户端工具。
- `stream`：启用 SSE 流式传输。
- `max_output_tokens`：尽力而为的输出限制（取决于提供商）。
- `user`：稳定的会话路由。

接受但**当前会忽略**：

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

支持：

- `previous_response_id`：当请求保持在同一智能体/用户/请求会话作用域内时，OpenClaw 会复用更早的响应会话。

## 条目（输入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 会追加到系统提示词中。
- 最近的 `user` 或 `function_call_output` 条目会成为“当前消息”。
- 更早的用户/助手消息会作为上下文历史包含进来。

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

出于 schema 兼容性而接受，但在构建提示词时会忽略。

## 工具（客户端函数工具）

使用 `tools: [{ type: "function", function: { name, description?, parameters? } }]` 提供工具。

如果智能体决定调用工具，响应会返回一个 `function_call` 输出条目。
然后你发送一个带有 `function_call_output` 的后续请求来继续该轮次。

## 图像（`input_image`）

支持 base64 或 URL 来源：

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

允许的 MIME 类型（当前）：`image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。
最大大小（当前）：10MB。

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

最大大小（当前）：5MB。

当前行为：

- 文件内容会被解码并添加到**系统提示词**，而不是用户消息中，
  因此它保持临时性（不会持久化到会话历史中）。
- 解码后的文件文本在添加前会被包装为**不受信任的外部内容**，
  因此文件字节会被视为数据，而不是可信指令。
- 注入的块使用显式边界标记，例如
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`，并包含一行
  `Source: External` 元数据。
- 此文件输入路径有意省略较长的 `SECURITY NOTICE:` 横幅，以
  保留提示词预算；边界标记和元数据仍会保留。
- PDF 会先解析文本。如果找到的文本很少，前几页会被
  栅格化为图像并传递给模型，注入的文件块会使用
  占位符 `[PDF content rendered to images]`。

PDF 解析由内置的 `document-extract` 插件提供，该插件使用
对 Node 友好的 `pdfjs-dist` legacy 构建（无 worker）。现代 PDF.js 构建
需要浏览器 worker/DOM 全局对象，因此 Gateway 网关中不使用它。

URL 获取默认值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每个请求中基于 URL 的 `input_file` + `input_image` 部分总数）
- 请求受保护（DNS 解析、私有 IP 阻止、重定向上限、超时）。
- 每种输入类型都支持可选主机名允许列表（`files.urlAllowlist`、`images.urlAllowlist`）。
  - 精确主机：`"cdn.example.com"`
  - 通配符子域：`"*.assets.example.com"`（不匹配顶级域）
  - 空的或省略的允许列表表示没有主机名允许列表限制。
- 要完全禁用基于 URL 的获取，请设置 `files.allowUrl: false` 和/或 `images.allowUrl: false`。

## 文件 + 图像限制（配置）

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

- `maxBodyBytes`：20MB
- `maxUrlParts`：8
- `files.maxBytes`：5MB
- `files.maxChars`：200k
- `files.maxRedirects`：3
- `files.timeoutMs`：10s
- `files.pdf.maxPages`：4
- `files.pdf.maxPixels`：4,000,000
- `files.pdf.minTextChars`：200
- `images.maxBytes`：10MB
- `images.maxRedirects`：3
- `images.timeoutMs`：10s
- HEIC/HEIF `input_image` 来源会被接受，并在交付给提供商前规范化为 JPEG。

安全注意事项：

- URL 允许列表会在获取前以及重定向跳转时强制执行。
- 将某个主机名加入允许列表不会绕过私有/内部 IP 阻止。
- 对于暴露到互联网的 Gateway 网关，除应用层保护外，还应应用网络出口控制。
  参阅[安全](/zh-CN/gateway/security)。

## 流式传输（SSE）

设置 `stream: true` 以接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行都是 `event: <type>` 和 `data: <json>`
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

## 使用情况

当底层提供商报告 token 计数时，会填充 `usage`。
OpenClaw 会在这些计数器到达下游 Status/会话表面之前，
规范化常见的 OpenAI 风格别名，包括 `input_tokens` / `output_tokens`
和 `prompt_tokens` / `completion_tokens`。

## 错误

错误使用如下 JSON 对象：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常见情况：

- `401` 缺少/无效认证
- `400` 请求正文无效
- `405` 方法错误

## 示例

非流式传输：

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

流式传输：

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

## 相关

- [OpenAI 聊天补全](/zh-CN/gateway/openai-http-api)
- [OpenAI](/zh-CN/providers/openai)
