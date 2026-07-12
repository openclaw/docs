---
read_when:
    - 你希望在没有本地 Ollama 服务器的情况下使用托管的 Ollama 模型
    - 你需要 ollama-cloud 提供商 ID、密钥或端点
summary: 直接通过 OpenClaw 使用 Ollama Cloud
title: Ollama 云服务
x-i18n:
    generated_at: "2026-07-11T20:53:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud 是 Ollama 托管的模型 API。`ollama-cloud` 提供商通过 Ollama 原生的 `/api/chat` API 直接调用 `https://ollama.com`，无需本地 Ollama 服务器，也无需将本地 Ollama 应用登录到云端模式。请使用 `ollama-cloud/kimi-k2.6` 这样的模型引用。

OpenClaw 将 `ollama-cloud` 注册为独立的提供商 ID，避免仅限云端的凭据、实时目录发现和模型选择与本地 `ollama` 主机混在一起。有关本地 Ollama、云端与本地混合路由、嵌入以及自定义主机的详细信息，请参阅 [Ollama](/zh-CN/providers/ollama)。

## 设置

在 [ollama.com/settings/keys](https://ollama.com/settings/keys) 创建 Ollama Cloud API 密钥，然后运行：

```bash
openclaw onboard --auth-choice ollama-cloud
```

或者设置：

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

非交互式新手引导支持直接传入密钥：

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

新手引导会将默认模型设置为 `ollama-cloud/kimi-k2.5:cloud`。

## 默认值

- 提供商：`ollama-cloud`
- 基础 URL：`https://ollama.com`
- 环境变量：`OLLAMA_API_KEY`
- API 风格：Ollama 原生 `/api/chat`
- 新手引导默认模型：`ollama-cloud/kimi-k2.5:cloud`

## 何时选择 Ollama Cloud

- 你希望使用托管的 Ollama 模型，而无需在本地运行 `ollama serve`。
- 你希望使用与 OpenClaw 本地 Ollama 相同的原生 Ollama 聊天 API 结构，但将其指向 `https://ollama.com`。
- 你希望通过简单的云端路径使用 Ollama 托管目录中已有的模型。
- 你不需要拉取本地模型、控制本地 GPU 或进行仅限局域网的推理。

如果你希望通过已登录的 Ollama 主机实现仅限本地或云端与本地混合路由，请改用 [Ollama](/zh-CN/providers/ollama)。如果你需要 `/v1/chat/completions` 语义或提供商特有的 OpenAI 风格功能，请改用兼容 OpenAI 的提供商。

## Models

此提供商需要 API 密钥；没有密钥时，它将保持未启用状态。配置密钥后，OpenClaw 会从托管目录中实时发现 Ollama Cloud 模型：

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

实时目录中的托管 ID 包括 `deepseek-v4-flash`、`glm-5`、`gpt-oss:20b`、`kimi-k2.6` 和 `minimax-m2.7`。当实时发现未返回任何内容时，OpenClaw 会回退到内置条目 `kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud` 和 `glm-5.2:cloud`。

模型 ID 是云端目录 ID，而不是本地拉取名称。如果某个模型名称可用于本地 Ollama 主机，但未出现在托管目录中，请改用 `ollama` 提供商并连接该本地主机。

## 实时测试

如需对 Ollama Cloud API 密钥进行冒烟测试，请将 Ollama 实时测试指向托管端点，并从当前目录中选择一个模型：

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

云端冒烟测试会运行文本、原生流式传输和 Web 搜索；设置 `OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` 可跳过 Web 搜索。对于 `https://ollama.com`，测试默认跳过嵌入，因为 Ollama Cloud API 密钥可能无权访问 `/api/embed`；可设置 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` 强制运行嵌入测试。

## 故障排查

- 出现 `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY` 错误：请提供有效的云端 API 密钥。`ollama-local` 本地标记仅适用于本地或私有 Ollama 主机。
- 出现未知模型错误：运行 `openclaw models list --provider ollama-cloud`，并准确复制托管模型 ID。
- 自定义 Ollama 主机出现工具调用或原始 JSON 问题：检查是否误用了兼容 OpenAI 的 `/v1` URL。Ollama 路由应使用原生基础 URL，且不能带有 `/v1` 后缀。

## 相关内容

- [Ollama](/zh-CN/providers/ollama)
- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)
