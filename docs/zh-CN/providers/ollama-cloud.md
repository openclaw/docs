---
read_when:
    - 你想在没有本地 Ollama 服务器的情况下使用托管的 Ollama 模型
    - 你需要 ollama-cloud 提供商 ID、密钥或端点
summary: 直接在 OpenClaw 中使用 Ollama Cloud
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T03:07:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud 是 Ollama 的托管模型 API。它让 OpenClaw 可以直接调用 Ollama 托管的模型，而无需安装本地 Ollama 服务器，也无需将本地 Ollama 应用登录到云端模式。使用提供商 ID `ollama-cloud` 和类似 `ollama-cloud/kimi-k2.6` 的模型引用。

本页适用于直接的云端专用路由。该提供商使用 Ollama 原生的 `/api/chat` 风格，而不是 OpenAI 兼容的 `/v1` 路由。OpenClaw 将其注册为单独的提供商 ID，因此云端专用凭证、实时目录发现和模型选择不会与本地 `ollama` 主机混用。

当你需要云端专用路由时，请使用本页。有关本地 Ollama、云端加本地的混合路由、嵌入以及自定义主机详情，请参阅 [Ollama](/zh-CN/providers/ollama)。

## 设置

在 [ollama.com/settings/keys](https://ollama.com/settings/keys) 创建 Ollama Cloud API key，然后运行：

```bash
openclaw onboard --auth-choice ollama-cloud
```

或者设置：

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## 默认值

- 提供商：`ollama-cloud`
- 基础 URL：`https://ollama.com`
- 环境变量：`OLLAMA_API_KEY`
- API 风格：Ollama 原生 `/api/chat`
- 示例模型：`ollama-cloud/kimi-k2.6`

## 何时选择 Ollama Cloud

- 你想使用托管的 Ollama 模型，而不在本地运行 `ollama serve`。
- 你想使用 OpenClaw 用于本地 Ollama 的相同原生 Ollama 聊天 API 形状，但指向 `https://ollama.com`。
- 你想为已在 Ollama 托管目录中的模型使用简单的云端路径。
- 你不需要本地模型拉取、本地 GPU 控制或仅限局域网的推理。

当你想通过已登录的 Ollama 主机进行仅本地或云端加本地路由时，请改用 [Ollama](/zh-CN/providers/ollama)。当你需要 `/v1/chat/completions` 语义或提供商特定的 OpenAI 风格功能时，请改用 OpenAI 兼容提供商。

## Models

OpenClaw 会从实时托管目录中发现 Ollama Cloud 模型。常见可用的托管 ID 包括：

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

使用你当前托管目录中的模型 ID：

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

模型 ID 是云端目录 ID，不是本地拉取名称。如果某个模型名称可在本地 Ollama 主机中使用，但不在托管目录中，请改用 `ollama` 提供商并指向该本地主机。

## 实时测试

对于 Ollama Cloud API key 冒烟测试，请将 Ollama 实时测试指向托管端点，并从当前目录中选择一个模型：

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

云端冒烟测试会运行文本、原生流式传输和 Web 搜索。对于 `https://ollama.com`，它默认跳过嵌入，因为 Ollama Cloud API key 可能未授权 `/api/embed`。

## 故障排除

- `Set OLLAMA_API_KEY` 错误：提供真实的云端 API key。本地 `ollama-local` 标记仅用于本地或私有 Ollama 主机。
- 未知模型错误：运行 `openclaw models list --provider ollama-cloud`，并精确复制托管模型 ID。
- 自定义 Ollama 主机上的工具调用或原始 JSON 问题：检查你是否意外使用了 OpenAI 兼容的 `/v1` URL。Ollama 路由应使用没有 `/v1` 后缀的原生基础 URL。

## 相关

- [Ollama](/zh-CN/providers/ollama)
- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)
