---
read_when:
    - 你想使用托管的 Ollama 模型，而不使用本地 Ollama 服务器
    - 你需要 `ollama-cloud` 提供商 ID、密钥或端点
summary: 直接将 Ollama Cloud 与 OpenClaw 配合使用
title: Ollama 云
x-i18n:
    generated_at: "2026-07-05T11:38:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud 是 Ollama 的托管模型 API。`ollama-cloud` 提供商会通过 Ollama 原生 `/api/chat` API，直接在 `https://ollama.com` 调用它，不需要本地 Ollama 服务器，也不需要本地 Ollama 应用登录云模式。使用类似 `ollama-cloud/kimi-k2.6` 的模型引用。

OpenClaw 将 `ollama-cloud` 注册为自己的提供商 ID，这样仅云端凭证、实时目录发现和模型选择就不会与本地 `ollama` 主机混在一起。对于本地 Ollama、云端加本地混合路由、嵌入和自定义主机详情，请参见 [Ollama](/zh-CN/providers/ollama)。

## 设置

在 [ollama.com/settings/keys](https://ollama.com/settings/keys) 创建 Ollama Cloud API key，然后运行：

```bash
openclaw onboard --auth-choice ollama-cloud
```

或者设置：

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

非交互式新手引导可以直接接收该 key：

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

- 你想使用托管的 Ollama 模型，而不在本地运行 `ollama serve`。
- 你想使用 OpenClaw 为本地 Ollama 使用的同一种原生 Ollama 聊天 API 形状，但指向 `https://ollama.com`。
- 你想为已经在 Ollama 托管目录中的模型提供一条简单的云端路径。
- 你不需要本地模型拉取、本地 GPU 控制或仅 LAN 推理。

当你想通过已登录的 Ollama 主机进行仅本地或云端加本地路由时，请改用 [Ollama](/zh-CN/providers/ollama)。当你需要 `/v1/chat/completions` 语义或提供商特定的 OpenAI 风格功能时，请改用兼容 OpenAI 的提供商。

## Models

该提供商需要 API key；没有 key 时它会保持未激活。提供 key 后，OpenClaw 会从托管目录实时发现 Ollama Cloud 模型：

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

实时目录中的托管 ID 包括 `deepseek-v4-flash`、`glm-5`、`gpt-oss:20b`、`kimi-k2.6` 和 `minimax-m2.7`。当实时发现没有返回任何内容时，OpenClaw 会回退到内置行 `kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud` 和 `glm-5.2:cloud`。

模型 ID 是云端目录 ID，不是本地拉取名称。如果某个模型名称可在本地 Ollama 主机中工作，但托管目录中不存在，请改用带有该本地主机的 `ollama` 提供商。

## 实时测试

对于 Ollama Cloud API key 烟雾测试，请将 Ollama 实时测试指向托管端点，并从你当前的目录中选择一个模型：

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

云端烟雾测试会运行文本、原生流式传输和 Web 搜索；设置 `OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` 可跳过 Web 搜索。对于 `https://ollama.com`，它默认跳过嵌入，因为 Ollama Cloud API key 可能未授权 `/api/embed`；可用 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` 强制启用。

## 故障排查

- `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY` 错误：提供真实的云端 API key。本地 `ollama-local` 标记仅适用于本地或私有 Ollama 主机。
- 未知模型错误：运行 `openclaw models list --provider ollama-cloud`，并准确复制托管模型 ID。
- 自定义 Ollama 主机上的工具调用或原始 JSON 问题：检查你是否意外使用了兼容 OpenAI 的 `/v1` URL。Ollama 路由应使用不带 `/v1` 后缀的原生基础 URL。

## 相关内容

- [Ollama](/zh-CN/providers/ollama)
- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)
