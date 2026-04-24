---
read_when:
    - 你想通过 LM Studio 使用开源模型运行 OpenClaw
    - 你想设置并配置 LM Studio
summary: 使用 LM Studio 运行 OpenClaw
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T03:43:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio 是一款友好且功能强大的应用，可在你自己的硬件上运行开放权重模型。它支持运行 llama.cpp（GGUF）或 MLX 模型（Apple Silicon）。可使用 GUI 安装包，也可使用无头守护进程（`llmster`）。有关产品和设置文档，请参见 [lmstudio.ai](https://lmstudio.ai/)。

## 快速开始

1. 安装 LM Studio（桌面版）或 `llmster`（无头版），然后启动本地服务器：

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. 启动服务器

请确保你要么启动桌面应用，要么使用以下命令运行守护进程：

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

如果你使用的是应用版，请确保已启用 JIT，以获得更流畅的体验。了解更多信息，请参见 [LM Studio JIT and TTL guide](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)。

3. OpenClaw 需要一个 LM Studio token 值。请设置 `LM_API_TOKEN`：

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

如果 LM Studio 认证已禁用，可以使用任意非空 token 值：

```bash
export LM_API_TOKEN="placeholder-key"
```

有关 LM Studio 认证设置的详细信息，请参见 [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)。

4. 运行新手引导并选择 `LM Studio`：

```bash
openclaw onboard
```

5. 在新手引导中，使用 `Default model` 提示来选择你的 LM Studio 模型。

你也可以稍后设置或更改它：

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 模型键采用 `author/model-name` 格式（例如 `qwen/qwen3.5-9b`）。OpenClaw
模型引用会在前面加上提供商名称：`lmstudio/qwen/qwen3.5-9b`。你可以通过运行
`curl http://localhost:1234/api/v1/models` 并查看 `key` 字段来找到模型的精确键名。

## 非交互式新手引导

当你希望通过脚本化方式完成设置时（CI、配置供应、远程引导），请使用非交互式新手引导：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

或者，使用 API key 指定 base URL 或模型：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` 接受 LM Studio 返回的模型键（例如 `qwen/qwen3.5-9b`），不包含
`lmstudio/` 提供商前缀。

非交互式新手引导要求提供 `--lmstudio-api-key`（或环境变量中的 `LM_API_TOKEN`）。
对于不要求认证的 LM Studio 服务器，任意非空 token 值都可以使用。

出于兼容性考虑，仍然支持 `--custom-api-key`，但对于 LM Studio，更推荐使用 `--lmstudio-api-key`。

这会写入 `models.providers.lmstudio`，将默认模型设置为
`lmstudio/<custom-model-id>`，并写入 `lmstudio:default` auth profile。

交互式设置可以提示你输入一个可选的首选加载上下文长度，并会将其应用到保存到配置中的已发现 LM Studio 模型。

## 配置

### 流式用量兼容性

LM Studio 与流式用量兼容。当它没有输出 OpenAI 形状的
`usage` 对象时，OpenClaw 会从 llama.cpp 风格的
`timings.prompt_n` / `timings.predicted_n` 元数据中恢复 token 计数。

相同行为也适用于以下 OpenAI 兼容的本地后端：

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### 显式配置

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 故障排除

### 未检测到 LM Studio

请确保 LM Studio 正在运行，并且你已设置 `LM_API_TOKEN`（对于无认证服务器，任意非空 token 值都可使用）：

```bash
# 通过桌面应用启动，或使用无头方式：
lms server start --port 1234
```

验证 API 是否可访问：

```bash
curl http://localhost:1234/api/v1/models
```

### 认证错误（HTTP 401）

如果设置过程中报告 HTTP 401，请验证你的 API key：

- 检查 `LM_API_TOKEN` 是否与 LM Studio 中配置的 key 一致。
- 有关 LM Studio 认证设置的详细信息，请参见 [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)。
- 如果你的服务器不要求认证，请为 `LM_API_TOKEN` 使用任意非空 token 值。

### 即时模型加载

LM Studio 支持即时（JIT）模型加载，即在首次请求时加载模型。请确保启用了此功能，以避免出现“Model not loaded”错误。

## 相关内容

- [模型选择](/zh-CN/concepts/model-providers)
- [Ollama](/zh-CN/providers/ollama)
- [本地模型](/zh-CN/gateway/local-models)
