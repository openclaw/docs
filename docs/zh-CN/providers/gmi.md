---
read_when:
    - 你想使用 GMI Cloud 模型运行 OpenClaw
    - 你需要 GMI 提供商 ID、密钥或端点
summary: 在 OpenClaw 中使用 GMI Cloud 的 OpenAI 兼容 API
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T03:04:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud 是一个托管推理平台，通过 OpenAI 兼容 API 提供前沿和开放权重模型。在 OpenClaw 中，它是一个官方外部提供商插件，这意味着你只需安装一次，用提供商 ID `gmi` 选择它，通过常规模型凭证存储凭据，并使用类似 `gmi/google/gemini-3.1-flash-lite` 的模型引用。

当你希望用一个 API key 访问多个托管模型系列时，可以使用 GMI，包括 GMI 目录公开的 Google、Anthropic、OpenAI、DeepSeek、Moonshot 和 Z.AI 路由。它适合作为模型回退的次要提供商、用于比较不同供应商的托管路由，或在 GMI 比你的主提供商更早提供某个模型时使用。

此提供商使用 OpenAI 兼容的聊天语义。OpenClaw 负责提供商 ID、凭证配置、别名、模型目录种子和基础 URL；GMI 负责实时模型可用性、计费、速率限制以及任何提供商侧路由策略。

## 设置

安装插件，重启 Gateway 网关，然后在 GMI Cloud 中创建 API key：

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

然后运行：

```bash
openclaw onboard --auth-choice gmi-api-key
```

或设置：

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## 默认值

- 提供商：`gmi`
- 别名：`gmi-cloud`、`gmicloud`
- 基础 URL：`https://api.gmi-serving.com/v1`
- 环境变量：`GMI_API_KEY`
- 默认模型：`gmi/google/gemini-3.1-flash-lite`

## 何时选择 GMI

- 你想要托管的 OpenAI 兼容端点，而不是本地模型服务器。
- 你想通过一个提供商账户尝试多个商业和开放权重模型系列。
- 你想要一个与 OpenRouter、DeepInfra、Together 或直接供应商 API 具有不同上游路由的回退提供商。
- 你需要 GMI 特定的模型 ID、定价或账户控制。

当你需要供应商原生功能，而 GMI 未通过其 OpenAI 兼容路由公开这些功能时，请改用直接供应商提供商。当数据本地性或本地 GPU 控制比托管便利性更重要时，请选择 Ollama、LM Studio、vLLM 或 SGLang 等本地提供商。

## Models

插件目录会种子化常见可用的 GMI Cloud 路由 ID，包括：

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

该目录是种子，并不承诺每个账户都能随时调用每个模型。使用 OpenClaw 的模型列表命令查看已配置提供商在你的环境中报告的内容：

```bash
openclaw models list --provider gmi
```

## 故障排除

- `401` 或 `403`：检查运行 OpenClaw 的进程是否已设置 `GMI_API_KEY`，或重新运行新手引导，将密钥存储到提供商凭证配置中。
- 未知模型错误：确认该模型存在于你的 GMI 账户中，并使用 `openclaw models list --provider gmi` 显示的完整 `gmi/<route-id>` 引用。
- 间歇性提供商错误：尝试不同的 GMI 路由，或将 GMI 配置为回退，而不是唯一的主模型提供商。

## 相关

- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)
