---
read_when:
    - 你想从自己的 GPU 机器提供模型服务
    - 你正在接入 LM Studio 或 OpenAI 兼容代理
    - 你需要最安全的本地模型指导
summary: 在本地 LLM 上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-04-28T11:52:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4be447ece49ec1b41456db54a223679f4e399b8e9231925fd08d12999af246c9
    source_path: gateway/local-models.md
    workflow: 16
---

本地可行，但 OpenClaw 需要大上下文和强大的提示词注入防护。小显存卡会截断上下文并削弱安全性。目标要高：**≥2 台满配 Mac Studio 或同等级 GPU 设备（约 $30k+）**。单张 **24 GB** GPU 只适合较轻的提示词，且延迟更高。使用你能运行的**最大 / 全尺寸模型变体**；激进量化或“小型”检查点会提高提示词注入风险（见 [安全](/zh-CN/gateway/security)）。

如果你想要阻力最小的本地设置，从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 和 `openclaw onboard` 开始。本页是面向更高端本地栈和自定义 OpenAI 兼容本地服务器的主观指南。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 用户：** 官方 Ollama Linux 安装器会启用一个带 `Restart=always` 的 systemd 服务。在 WSL2 GPU 设置中，自动启动可能会在启动期间重新加载上一个模型并占用主机内存。如果你的 WSL2 VM 在启用 Ollama 后反复重启，请参阅 [WSL2 崩溃循环](/zh-CN/providers/ollama#wsl2-crash-loop-repeated-reboots)。
</Warning>

## 推荐：LM Studio + 大型本地模型（Responses API）

目前最佳的本地栈。在 LM Studio 中加载大型模型（例如全尺寸 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理与最终文本分离。

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**设置清单**

- 安装 LM Studio：[https://lmstudio.ai](https://lmstudio.ai)
- 在 LM Studio 中，下载**可用的最大模型构建**（避免“小型”/重度量化变体），启动服务器，确认 `http://127.0.0.1:1234/v1/models` 会列出它。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型已加载；冷加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，坚持使用 Responses API，这样只会发送最终文本。

即使运行本地模型，也保留托管模型配置；使用 `models.mode: "merge"`，让回退始终可用。

### 混合配置：托管主模型，本地回退

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### 本地优先并保留托管安全网

交换主模型和回退的顺序；保留相同的 providers 块和 `models.mode: "merge"`，这样当本地机器宕机时，你可以回退到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管的 MiniMax/Kimi/GLM 变体也存在于 OpenRouter 上，并提供区域固定端点（例如美国托管）。在那里选择区域变体，以便在仍然通过 `models.mode: "merge"` 使用 Anthropic/OpenAI 回退的同时，把流量保留在你选择的司法辖区内。
- 纯本地仍然是隐私最强的路径；当你需要提供商功能但又想控制数据流时，托管区域路由是折中方案。

## 其他 OpenAI 兼容本地代理

如果 MLX (`mlx_lm.server`)、vLLM、SGLang、LiteLLM、OAI-proxy 或自定义 Gateway 网关公开 OpenAI 风格的 `/v1/chat/completions` 端点，它们就可以工作。除非后端明确记录支持 `/v1/responses`，否则使用 Chat Completions 适配器。将上面的提供商块替换为你的端点和模型 ID：

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

如果在带有 `baseUrl` 的自定义提供商上省略 `api`，OpenClaw 默认使用 `openai-completions`。诸如 `127.0.0.1` 的回环端点会自动受信任；LAN、tailnet 和私有 DNS 端点仍需要 `request.allowPrivateNetwork: true`。

`models.providers.<id>.models[].id` 值是提供商本地的。不要在那里包含提供商前缀。例如，使用 `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 启动的 MLX 服务器应使用此目录 ID 和模型引用：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本地或代理视觉模型上设置 `input: ["text", "image"]`，以便将图像附件注入智能体轮次。交互式自定义提供商新手引导会推断常见视觉模型 ID，并且只询问未知名称。非交互式新手引导使用相同推断；对于未知视觉 ID，使用 `--custom-image-input`，当看起来已知的模型在你的端点后面其实是纯文本时，使用 `--custom-text-input`。

保持 `models.mode: "merge"`，这样托管模型仍可作为回退使用。对于缓慢的本地或远程模型服务器，先使用 `models.providers.<id>.timeoutSeconds`，再提高 `agents.defaults.timeoutSeconds`。提供商超时只适用于模型 HTTP 请求，包括连接、标头、正文流式传输以及受保护 fetch 的总中止时间。

<Note>
对于自定义 OpenAI 兼容提供商，当 `baseUrl` 解析到回环、私有 LAN、`.local` 或裸主机名时，可以持久化一个非密钥本地标记，例如 `apiKey: "ollama-local"`。OpenClaw 会把它当作有效的本地凭证，而不是报告缺少密钥。对于任何接受公共主机名的提供商，请使用真实值。
</Note>

本地/代理 `/v1` 后端的行为说明：

- OpenClaw 将这些视为代理风格的 OpenAI 兼容路由，而不是原生 OpenAI 端点
- 仅原生 OpenAI 的请求整形不会在这里应用：没有 `service_tier`，没有 Responses `store`，没有 OpenAI 推理兼容载荷整形，也没有提示词缓存提示
- 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）不会注入这些自定义代理 URL

更严格 OpenAI 兼容后端的兼容性说明：

- 有些服务器在 Chat Completions 上只接受字符串 `messages[].content`，不接受结构化内容部分数组。对这些端点设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 有些本地模型会以文本形式发出独立的带括号工具请求，例如 `[tool_name]` 后跟 JSON 和 `[END_TOOL_REQUEST]`。只有当名称与该轮次注册的工具完全匹配时，OpenClaw 才会把它们提升为真正的工具调用；否则该块会被视为不受支持的文本，并从用户可见回复中隐藏。
- 如果模型发出看起来像工具调用的 JSON、XML 或 ReAct 风格文本，但提供商没有发出结构化调用，OpenClaw 会将其保留为文本，并在可用时记录一条带有运行 ID、提供商/模型、检测到的模式和工具名称的警告。应将其视为提供商/模型工具调用不兼容，而不是已完成的工具运行。
- 如果工具以助手文本形式出现而不是运行，例如原始 JSON、XML、ReAct 语法，或提供商响应中的空 `tool_calls` 数组，请先确认服务器正在使用支持工具调用的聊天模板/解析器。对于只有在强制使用工具时解析器才工作的 OpenAI 兼容 Chat Completions 后端，请设置按模型的请求覆盖，而不是依赖文本解析：

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  仅在每个正常轮次都应调用工具的模型/会话中使用此设置。它会覆盖 OpenClaw 默认代理值 `tool_choice: "auto"`。将 `local/my-local-model` 替换为 `openclaw models list` 显示的确切提供商/模型引用。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 有些较小或更严格的本地后端在处理 OpenClaw 完整智能体运行时提示词形态时不稳定，尤其是在包含工具架构时。先使用精简本地探测验证提供商路径：

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  要在不使用完整智能体提示词形态的情况下验证 Gateway 网关路由，请改用 Gateway 网关模型探测：

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  本地和 Gateway 网关模型探测都只发送提供的提示词。Gateway 网关探测仍会验证 Gateway 网关路由、身份验证和提供商选择，但它有意跳过先前会话转录、AGENTS/bootstrap 上下文、上下文引擎组装、工具和内置 MCP 服务器。

  如果这一步成功但普通 OpenClaw 智能体轮次失败，请先尝试 `agents.defaults.experimental.localModelLean: true`，以去掉 `browser`、`cron` 和 `message` 等重量级默认工具；这是一个实验性标志，不是稳定的默认模式设置。请参阅 [实验性功能](/zh-CN/concepts/experimental-features)。如果仍然失败，请尝试 `models.providers.<provider>.models[].compat.supportsTools: false`。

- 如果后端仍然只在较大的 OpenClaw 运行中失败，剩余问题通常是上游模型/服务器容量或后端缺陷，而不是 OpenClaw 的传输层。

## 故障排除

- Gateway 网关能访问代理吗？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型被卸载了？重新加载；冷启动是常见的“卡住”原因。
- 本地服务器提示 `terminated`、`ECONNRESET`，或在轮次中途关闭流？
  OpenClaw 会在诊断信息中记录一个低基数的 `model.call.error.failureKind`，以及
  OpenClaw 进程的 RSS/堆快照。对于 LM Studio/Ollama
  内存压力，请将该时间戳与服务器日志或 macOS 崩溃 /
  jetsam 日志进行匹配，以确认模型服务器是否被终止。
- 当检测到的上下文窗口低于 **32k** 时，OpenClaw 会发出警告；低于 **16k** 时会阻止运行。如果你遇到该预检，请提高服务器/模型上下文限制，或选择更大的模型。
- 上下文错误？降低 `contextWindow`，或提高你的服务器限制。
- OpenAI 兼容服务器返回 `messages[].content ... expected a string`？
  在该模型条目上添加 `compat.requiresStringContent: true`。
- 直接的小型 `/v1/chat/completions` 调用可以工作，但 `openclaw infer model run --local`
  在 Gemma 或其他本地模型上失败？先检查提供商 URL、模型引用、身份验证
  标记和服务器日志；本地 `model run` 不包含智能体工具。
  如果本地 `model run` 成功，但更大的智能体轮次失败，请使用
  `localModelLean` 或 `compat.supportsTools: false` 缩减智能体
  工具表面。
- 工具调用显示为原始 JSON/XML/ReAct 文本，或者提供商返回
  空的 `tool_calls` 数组？不要添加会盲目把助手
  文本转换为工具执行的代理。先修复服务器聊天模板/解析器。如果
  模型只有在强制使用工具时才能工作，请添加上面的按模型
  `params.extra_body.tool_choice: "required"` 覆盖，并仅在每轮都预期有工具调用的会话中使用该模型
  条目。
- 安全：本地模型会跳过提供商侧过滤；保持智能体范围收窄并开启压缩，以限制提示注入的影响范围。

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference)
- [模型故障转移](/zh-CN/concepts/model-failover)
