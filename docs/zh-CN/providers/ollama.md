---
read_when:
    - 你想通过 Ollama 使用云端或本地模型运行 OpenClaw
    - 你需要 Ollama 的设置和配置指南
summary: 通过 Ollama 运行 OpenClaw（云端和本地模型）
title: Ollama
x-i18n:
    generated_at: "2026-04-05T10:06:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 337b8ec3a7756e591e6d6f82e8ad13417f0f20c394ec540e8fc5756e0fc13c29
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama 是一个本地 LLM 运行时，可让你轻松在自己的机器上运行开源模型。OpenClaw 与 Ollama 的原生 API（`/api/chat`）集成，支持流式传输和工具调用，并且当你选择启用 `OLLAMA_API_KEY`（或认证配置文件）且未定义显式的 `models.providers.ollama` 条目时，它还能自动发现本地 Ollama 模型。

<Warning>
**远程 Ollama 用户**：不要在 OpenClaw 中使用 `/v1` 的 OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，而且模型可能会把原始工具 JSON 当作纯文本输出。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不要加 `/v1`）。
</Warning>

## 快速开始

### 新手引导（推荐）

设置 Ollama 的最快方式是通过新手引导：

```bash
openclaw onboard
```

从 provider 列表中选择 **Ollama**。新手引导将会：

1. 询问你的 Ollama 基础 URL，也就是你的实例可访问的地址（默认值为 `http://127.0.0.1:11434`）。
2. 让你选择 **Cloud + Local**（云端模型和本地模型）或 **Local**（仅本地模型）。
3. 如果你选择 **Cloud + Local** 且尚未登录 ollama.com，则打开浏览器登录流程。
4. 发现可用模型并建议默认值。
5. 如果所选模型在本地不可用，则自动拉取该模型。

也支持非交互模式：

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

你也可以选择指定自定义基础 URL 或模型：

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### 手动设置

1. 安装 Ollama：[https://ollama.com/download](https://ollama.com/download)

2. 如果你想使用本地推理，请先拉取一个本地模型：

```bash
ollama pull glm-4.7-flash
# or
ollama pull gpt-oss:20b
# or
ollama pull llama3.3
```

3. 如果你也想使用云端模型，请先登录：

```bash
ollama signin
```

4. 运行新手引导并选择 `Ollama`：

```bash
openclaw onboard
```

- `Local`：仅本地模型
- `Cloud + Local`：本地模型加云端模型
- `kimi-k2.5:cloud`、`minimax-m2.5:cloud` 和 `glm-5:cloud` 等云端模型**不**需要在本地执行 `ollama pull`

OpenClaw 当前建议：

- 本地默认模型：`glm-4.7-flash`
- 云端默认模型：`kimi-k2.5:cloud`、`minimax-m2.5:cloud`、`glm-5:cloud`

5. 如果你更喜欢手动设置，也可以直接为 OpenClaw 启用 Ollama（任意值都可以；Ollama 不需要真实密钥）：

```bash
# Set environment variable
export OLLAMA_API_KEY="ollama-local"

# Or configure in your config file
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. 查看或切换模型：

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. 或在配置中设置默认值：

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## 模型发现（隐式 provider）

当你设置 `OLLAMA_API_KEY`（或认证配置文件）并且**没有**定义 `models.providers.ollama` 时，OpenClaw 会从 `http://127.0.0.1:11434` 的本地 Ollama 实例中发现模型：

- 查询 `/api/tags`
- 尽力使用 `/api/show` 查询来读取 `contextWindow`（如果可用）
- 使用模型名称启发式（`r1`、`reasoning`、`think`）标记 `reasoning`
- 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大 token 上限
- 将所有成本设为 `0`

这样可以避免手动录入模型条目，同时让目录与本地 Ollama 实例保持一致。

要查看有哪些可用模型：

```bash
ollama list
openclaw models list
```

要添加新模型，只需使用 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型会被自动发现并可立即使用。

如果你显式设置了 `models.providers.ollama`，则会跳过自动发现，你必须手动定义模型（见下文）。

## 配置

### 基本设置（隐式发现）

启用 Ollama 的最简单方式是通过环境变量：

```bash
export OLLAMA_API_KEY="ollama-local"
```

### 显式设置（手动模型）

在以下情况下使用显式配置：

- Ollama 运行在其他主机或端口上。
- 你想强制指定特定的上下文窗口或模型列表。
- 你希望完全手动定义模型。

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

如果设置了 `OLLAMA_API_KEY`，你可以在 provider 条目中省略 `apiKey`，OpenClaw 会在可用性检查时自动补齐。

### 自定义基础 URL（显式配置）

如果 Ollama 运行在不同的主机或端口上（显式配置会禁用自动发现，因此你需要手动定义模型）：

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
        api: "ollama", // Set explicitly to guarantee native tool-calling behavior
      },
    },
  },
}
```

<Warning>
不要在 URL 中添加 `/v1`。`/v1` 路径使用 OpenAI 兼容模式，在这种模式下工具调用不可靠。请使用不带路径后缀的基础 Ollama URL。
</Warning>

### 模型选择

配置完成后，你的所有 Ollama 模型都可用：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## 云端模型

云端模型可让你在本地模型之外，还能运行云托管模型（例如 `kimi-k2.5:cloud`、`minimax-m2.5:cloud`、`glm-5:cloud`）。

要使用云端模型，请在设置期间选择 **Cloud + Local** 模式。向导会检查你是否已登录，并在需要时打开浏览器登录流程。如果无法验证认证状态，向导会回退到本地模型默认值。

你也可以直接在 [ollama.com/signin](https://ollama.com/signin) 登录。

## Ollama Web 搜索

OpenClaw 还支持 **Ollama Web 搜索**，它是一个内置的 `web_search`
provider。

- 它会使用你配置的 Ollama 主机（如果设置了 `models.providers.ollama.baseUrl`，
  则使用该值，否则使用 `http://127.0.0.1:11434`）。
- 它不需要密钥。
- 它要求 Ollama 正在运行，并且你已通过 `ollama signin` 登录。

在 `openclaw onboard` 或
`openclaw configure --section web` 期间选择 **Ollama Web 搜索**，或者设置：

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

有关完整设置和行为细节，请参阅 [Ollama Web 搜索](/tools/ollama-search)。

## 高级

### 推理模型

OpenClaw 默认会将名称中包含 `deepseek-r1`、`reasoning` 或 `think` 的模型视为具备推理能力的模型：

```bash
ollama pull deepseek-r1:32b
```

### 模型成本

Ollama 是免费的，并且在本地运行，因此所有模型成本都设为 $0。

### 流式传输配置

OpenClaw 的 Ollama 集成默认使用**原生 Ollama API**（`/api/chat`），它完全支持同时进行流式传输和工具调用。无需任何特殊配置。

#### 旧版 OpenAI 兼容模式

<Warning>
**在 OpenAI 兼容模式下，工具调用不可靠。** 只有当你需要为某个仅支持 OpenAI 格式的代理使用 OpenAI 格式，并且不依赖原生工具调用行为时，才应使用此模式。
</Warning>

如果你确实需要改用 OpenAI 兼容端点（例如位于只支持 OpenAI 格式的代理之后），请显式设置 `api: "openai-completions"`：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // default: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

此模式可能不支持同时进行流式传输和工具调用。你可能需要在模型配置中通过 `params: { streaming: false }` 禁用流式传输。

当 Ollama 使用 `api: "openai-completions"` 时，OpenClaw 默认会注入 `options.num_ctx`，以避免 Ollama 静默回退到 4096 的上下文窗口。如果你的代理或上游服务会拒绝未知的 `options` 字段，请禁用此行为：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### 上下文窗口

对于自动发现的模型，OpenClaw 会优先使用 Ollama 报告的上下文窗口；如果不可用，则回退到 OpenClaw 使用的默认 Ollama 上下文窗口。你可以在显式 provider 配置中覆盖 `contextWindow` 和 `maxTokens`。

## 故障排除

### 未检测到 Ollama

请确保 Ollama 正在运行，并且你已设置 `OLLAMA_API_KEY`（或认证配置文件），同时你**没有**定义显式的 `models.providers.ollama` 条目：

```bash
ollama serve
```

并确保 API 可访问：

```bash
curl http://localhost:11434/api/tags
```

### 没有可用模型

如果你的模型未列出，请执行以下任一操作：

- 在本地拉取该模型，或
- 在 `models.providers.ollama` 中显式定义该模型。

要添加模型：

```bash
ollama list  # See what's installed
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Or another model
```

### 连接被拒绝

请检查 Ollama 是否运行在正确端口上：

```bash
# Check if Ollama is running
ps aux | grep ollama

# Or restart Ollama
ollama serve
```

## 另请参阅

- [模型提供商](/zh-CN/concepts/model-providers) - 所有 provider 的概览
- [模型选择](/zh-CN/concepts/models) - 如何选择模型
- [配置](/zh-CN/gateway/configuration) - 完整配置参考
