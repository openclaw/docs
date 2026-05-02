---
read_when:
    - 你想通过 LM Studio 使用开源模型运行 OpenClaw
    - 你想设置并配置 LM Studio
summary: 使用 LM Studio 运行 OpenClaw
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T21:58:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 814117ecbdc52cf67e921d0f0d67c4219f8bdc15fb8cf34b983cda775cba9b9e
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio 是一款友好且强大的应用，可在你自己的硬件上运行开放权重模型。它可以运行 llama.cpp (GGUF) 或 MLX 模型 (Apple Silicon)。提供 GUI 软件包或无头守护进程 (`llmster`)。产品和设置文档请参阅 [lmstudio.ai](https://lmstudio.ai/)。

## 快速开始

1. 安装 LM Studio（桌面版）或 `llmster`（无头版），然后启动本地服务器：

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. 启动服务器

确保你已启动桌面应用，或使用以下命令运行守护进程：

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

如果你使用的是应用，请确保已启用 JIT，以获得流畅体验。请在 [LM Studio JIT 和 TTL 指南](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)中了解更多。

3. 如果启用了 LM Studio 认证，请设置 `LM_API_TOKEN`：

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

如果禁用了 LM Studio 认证，你可以在交互式 OpenClaw 设置期间将 API key 留空。

有关 LM Studio 认证设置详情，请参阅 [LM Studio 认证](https://lmstudio.ai/docs/developer/core/authentication)。

4. 运行新手引导并选择 `LM Studio`：

```bash
openclaw onboard
```

5. 在新手引导中，使用 `Default model` 提示选择你的 LM Studio 模型。

你也可以稍后设置或更改它：

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 模型键采用 `author/model-name` 格式（例如 `qwen/qwen3.5-9b`）。OpenClaw
模型引用会在前面加上提供商名称：`lmstudio/qwen/qwen3.5-9b`。你可以通过运行 `curl http://localhost:1234/api/v1/models` 并查看 `key` 字段来找到
模型的确切键。

## 非交互式新手引导

当你想编写设置脚本（CI、预配、远程引导）时，请使用非交互式新手引导：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

或者指定基础 URL、模型和可选 API key：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` 接收 LM Studio 返回的模型键（例如 `qwen/qwen3.5-9b`），不包含
`lmstudio/` 提供商前缀。

对于启用认证的 LM Studio 服务器，请传入 `--lmstudio-api-key` 或设置 `LM_API_TOKEN`。
对于未启用认证的 LM Studio 服务器，请省略该键；OpenClaw 会存储一个本地非机密标记。

`--custom-api-key` 仍受支持以保持兼容性，但对于 LM Studio，首选 `--lmstudio-api-key`。

这会写入 `models.providers.lmstudio`，并将默认模型设置为
`lmstudio/<custom-model-id>`。当你提供 API key 时，设置还会写入
`lmstudio:default` 认证配置文件。

交互式设置可以提示输入可选的首选加载上下文长度，并将其应用到保存进配置的已发现 LM Studio 模型。
LM Studio 插件配置会信任已配置的 LM Studio 端点用于模型请求，包括 loopback、LAN 和 tailnet 主机。你可以通过设置 `models.providers.lmstudio.request.allowPrivateNetwork: false` 来退出。

## 配置

### 流式 usage 兼容性

LM Studio 兼容流式 usage。当它未发出 OpenAI 形态的
`usage` 对象时，OpenClaw 会改为从 llama.cpp 风格的
`timings.prompt_n` / `timings.predicted_n` 元数据中恢复令牌计数。

相同的流式 usage 行为也适用于这些 OpenAI 兼容的本地后端：

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### 思考兼容性

当 LM Studio 的 `/api/v1/models` 发现报告模型特定的推理
选项时，OpenClaw 会在模型兼容性元数据中公开匹配的 OpenAI 兼容 `reasoning_effort`
值。当前 LM Studio 构建可以公布二进制
UI 选项，例如 `allowed_options: ["off", "on"]`，但在
`/v1/chat/completions` 上拒绝这些值；OpenClaw 会在发送请求前将该二进制发现形态规范化为
`none`、`minimal`、`low`、`medium`、`high` 和 `xhigh`。
包含 `off`/`on` 推理映射的较旧已保存 LM Studio 配置会在目录加载时
以同样方式规范化。

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

确保 LM Studio 正在运行。如果启用了认证，也请设置 `LM_API_TOKEN`：

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

验证 API 可访问：

```bash
curl http://localhost:1234/api/v1/models
```

### 认证错误 (HTTP 401)

如果设置报告 HTTP 401，请验证你的 API key：

- 检查 `LM_API_TOKEN` 是否匹配 LM Studio 中配置的键。
- 有关 LM Studio 认证设置详情，请参阅 [LM Studio 认证](https://lmstudio.ai/docs/developer/core/authentication)。
- 如果你的服务器不要求认证，请在设置期间将键留空。

### 即时模型加载

LM Studio 支持即时 (JIT) 模型加载，即模型会在首次请求时加载。OpenClaw 默认通过 LM Studio 的原生加载端点预加载模型，这在禁用 JIT 时很有帮助。若要让 LM Studio 的 JIT、空闲 TTL 和自动驱逐行为接管模型生命周期，请禁用 OpenClaw 的预加载步骤：

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### LAN 或 tailnet LM Studio 主机

使用 LM Studio 主机的可达地址，保留 `/v1`，并确保 LM Studio 在该机器上绑定到 loopback 之外的地址：

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

与通用 OpenAI 兼容提供商不同，`lmstudio` 会自动信任其配置的本地/私有端点，用于受保护的模型请求。自定义 loopback 提供商 ID（例如 `localhost` 或 `127.0.0.1`）也会自动受信任；对于 LAN、tailnet 或私有 DNS 自定义提供商 ID，请显式设置 `models.providers.<id>.request.allowPrivateNetwork: true`。

## 相关内容

- [模型选择](/zh-CN/concepts/model-providers)
- [Ollama](/zh-CN/providers/ollama)
- [本地模型](/zh-CN/gateway/local-models)
