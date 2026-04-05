---
read_when:
    - 你想用一个 API 密钥访问多个 LLM
    - 你想在 OpenClaw 中通过 Kilo Gateway 运行模型
summary: 使用 Kilo Gateway 的统一 API 在 OpenClaw 中访问多种模型
title: Kilo Gateway
x-i18n:
    generated_at: "2026-04-05T08:42:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 857266967b4a7553d501990631df2bae0f849d061521dc9f34e29687ecb94884
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway 提供一个**统一 API**，可通过单个端点和 API 密钥将请求路由到多个模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换基础 URL 即可使用。

## 获取 API 密钥

1. 前往 [app.kilo.ai](https://app.kilo.ai)
2. 登录或创建账户
3. 导航到 API Keys 并生成一个新密钥

## CLI 设置

```bash
openclaw onboard --auth-choice kilocode-api-key
```

或者设置环境变量：

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## 配置片段

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## 默认模型

默认模型是 `kilocode/kilo/auto`，这是一个由提供商拥有的智能路由模型，由 Kilo Gateway 管理。

OpenClaw 将 `kilocode/kilo/auto` 视为稳定的默认引用，但不会为该路由发布基于源码支持的“任务到上游模型”的映射。

## 可用模型

OpenClaw 会在启动时从 Kilo Gateway 动态发现可用模型。使用 `/models kilocode` 可查看你的账户可用的完整模型列表。

Gateway 网关上任何可用模型都可以通过 `kilocode/` 前缀使用：

```
kilocode/kilo/auto              （默认 - 智能路由）
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.4
kilocode/google/gemini-3-pro-preview
...以及更多
```

## 说明

- 模型引用格式为 `kilocode/<model-id>`（例如 `kilocode/anthropic/claude-sonnet-4`）。
- 默认模型：`kilocode/kilo/auto`
- 基础 URL：`https://api.kilo.ai/api/gateway/`
- 内置后备目录始终包含 `kilocode/kilo/auto`（`Kilo Auto`），其配置为 `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000` 和 `maxTokens: 128000`
- 启动时，OpenClaw 会尝试请求 `GET https://api.kilo.ai/api/gateway/models`，并将发现的模型合并到静态后备目录之前
- `kilocode/kilo/auto` 背后的精确上游路由由 Kilo Gateway 管理，不会在 OpenClaw 中硬编码
- 源码文档将 Kilo Gateway 说明为与 OpenRouter 兼容，因此它会保留在代理风格的 OpenAI 兼容路径上，而不是使用原生 OpenAI 请求整形
- 由 Gemini 支持的 Kilo 引用会保留在代理 Gemini 路径上，因此 OpenClaw 会继续在那里进行 Gemini thought-signature 清理，而不会启用原生 Gemini 重放验证或 bootstrap 重写。
- Kilo 的共享流包装器会添加提供商应用头，并为受支持的具体模型引用规范化代理推理载荷。`kilocode/kilo/auto` 以及其他不支持代理推理的提示会跳过该推理注入。
- 如需更多模型/提供商选项，请参阅 [/concepts/model-providers](/concepts/model-providers)。
- Kilo Gateway 在底层使用带有你的 API 密钥的 Bearer token。
