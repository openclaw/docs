---
read_when:
    - 你想用一个 API 密钥访问许多 LLM
    - 你想在 OpenClaw 中通过 OpenRouter 运行模型
summary: 在 OpenClaw 中使用 OpenRouter 的统一 API 访问许多模型
title: OpenRouter
x-i18n:
    generated_at: "2026-04-05T10:06:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dd354ba060bcb47724c89ae17c8e2af8caecac4bd996fcddb584716c1840b87
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter 提供了一个**统一 API**，可通过单个端点和 API 密钥将请求路由到许多模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

## CLI 设置

```bash
openclaw onboard --auth-choice openrouter-api-key
```

## 配置片段

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## 说明

- 模型引用格式为 `openrouter/<provider>/<model>`。
- 新手引导默认使用 `openrouter/auto`。稍后可通过
  `openclaw models set openrouter/<provider>/<model>` 切换到具体模型。
- 如需更多模型/提供商选项，请参见 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
- OpenRouter 在底层使用你的 API 密钥作为 Bearer token。
- 对于真实的 OpenRouter 请求（`https://openrouter.ai/api/v1`），OpenClaw 还会
  添加 OpenRouter 文档中说明的应用归因请求头：
  `HTTP-Referer: https://openclaw.ai`、`X-OpenRouter-Title: OpenClaw` 和
  `X-OpenRouter-Categories: cli-agent`。
- 在已验证的 OpenRouter 路由上，Anthropic 模型引用还会保留
  OpenRouter 专用的 Anthropic `cache_control` 标记，这是 OpenClaw 为了
  更好地复用 system/developer prompt 区块上的提示词缓存而使用的。
- 如果你将 OpenRouter 提供商重定向到其他代理/base URL，OpenClaw
  不会注入这些 OpenRouter 专用请求头或 Anthropic 缓存标记。
- OpenRouter 仍通过代理式的 OpenAI 兼容路径运行，因此
  原生 OpenAI 专有的请求整形能力，例如 `serviceTier`、Responses `store`、
  OpenAI reasoning-compat 负载和提示词缓存提示，都不会被转发。
- 由 Gemini 支持的 OpenRouter 引用会保留在 proxy-Gemini 路径上：OpenClaw 会在该路径中保留
  Gemini thought-signature 清理，但不会启用原生 Gemini
  重放校验或 bootstrap 重写。
- 在受支持的非 `auto` 路由上，OpenClaw 会将所选的思考级别映射为
  OpenRouter 代理 reasoning 负载。不受支持的模型提示以及
  `openrouter/auto` 会跳过该 reasoning 注入。
- 如果你在模型参数下传入 OpenRouter 提供商路由，OpenClaw 会在共享流包装器运行之前
  将其作为 OpenRouter 路由元数据进行转发。
