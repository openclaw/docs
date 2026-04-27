---
read_when:
    - 你想从你自己的 GPU 主机提供模型服务
    - 你正在接入 LM Studio 或兼容 OpenAI 的代理
    - 你需要最安全的本地模型使用指南
summary: 在本地 LLM 上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-04-27T22:06:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6d16948f66e8ad5b11c82939f711ad7db9edeea565c77b293227612f7ab43b6
    source_path: gateway/local-models.md
    workflow: 15
---

本地部署是可行的，但 OpenClaw 需要“大上下文窗口 + 强提示注入防护”。小显存卡会截断上下文，并削弱安全性。尽量拉高配置：**至少 2 台满配 Mac Studio，或同等级 GPU 设备（约 3 万美元以上）**。单张 **24 GB** GPU 仅适用于较轻量的提示词场景，而且延迟更高。使用**你能运行的最大 / 完整尺寸模型变体**；强量化或“small”检查点会提高提示注入风险（参见 [Security](/zh-CN/gateway/security)）。

如果你想要最低摩擦的本地部署方式，先从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 加 `openclaw onboard` 开始。本页是面向更高端本地栈和自定义兼容 OpenAI 本地服务器的偏好型指南。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 用户：** 官方 Ollama Linux 安装器会启用一个带有 `Restart=always` 的 systemd 服务。在 WSL2 GPU 配置中，自动启动可能会在系统启动时重新加载上次使用的模型，并占用宿主机内存。如果你在启用 Ollama 后遇到 WSL2 虚拟机反复重启，请参见 [WSL2 崩溃循环](/zh-CN/providers/ollama#wsl2-crash-loop-repeated-reboots)。
</Warning>

## 推荐：LM Studio + 大型本地模型（Responses API）

这是目前最佳的本地栈。先在 LM Studio 中加载一个大型模型（例如完整尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），然后使用 Responses API，将推理过程与最终文本分离。

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

**设置检查清单**

- 安装 LM Studio： [https://lmstudio.ai](https://lmstudio.ai)
- 在 LM Studio 中，下载**可用的最大模型构建**（避免 “small”/重度量化变体），启动服务器，并确认 `http://127.0.0.1:1234/v1/models` 能列出该模型。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型处于已加载状态；冷启动加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，坚持使用 Responses API，这样只会发送最终文本。

即使在本地运行，也建议保留托管模型配置；使用 `models.mode: "merge"`，这样回退模型仍然可用。

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

### 本地优先，托管兜底

交换主模型和回退模型的顺序；保留相同的 providers 块和 `models.mode: "merge"`，这样当本地主机不可用时，你仍可回退到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管的 MiniMax/Kimi/GLM 变体也可通过 OpenRouter 获取，并提供区域固定端点（例如托管在美国）。你可以在那边选择区域变体，把流量限制在所选司法辖区内，同时继续使用 `models.mode: "merge"` 以保留 Anthropic/OpenAI 回退能力。
- 纯本地仍然是隐私性最强的路径；当你需要提供商功能但又想控制数据流向时，托管的区域路由是折中方案。

## 其他兼容 OpenAI 的本地代理

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或自定义 Gateway 网关都可以使用，只要它们暴露兼容 OpenAI 风格的 `/v1/chat/completions` 端点。除非后端明确文档说明支持 `/v1/responses`，否则请使用 Chat Completions 适配器。将上面的 provider 块替换为你的端点和模型 ID：

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

如果在带有 `baseUrl` 的自定义提供商上省略 `api`，OpenClaw 默认使用 `openai-completions`。像 `127.0.0.1` 这样的 loopback 端点会被自动信任；但 LAN、tailnet 和私有 DNS 端点仍然需要设置 `request.allowPrivateNetwork: true`。

`models.providers.<id>.models[].id` 的值是提供商本地值。不要在这里包含提供商前缀。例如，使用 `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 启动的 MLX 服务器，应使用以下 catalog id 和模型引用：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

保留 `models.mode: "merge"`，这样托管模型仍可作为回退使用。
对于较慢的本地或远程模型服务器，应优先使用 `models.providers.<id>.timeoutSeconds`，再考虑提高 `agents.defaults.timeoutSeconds`。provider 超时仅适用于模型 HTTP 请求，包括连接、响应头、流式响应体，以及整个 guarded-fetch 的中止控制。

<Note>
对于自定义兼容 OpenAI 的提供商，当 `baseUrl` 解析到 loopback、私有 LAN、`.local` 或裸主机名时，持久化一个非机密的本地标记（例如 `apiKey: "ollama-local"`）是允许的。OpenClaw 会将其视为有效的本地凭证，而不是报告缺失 key。对于接受公共主机名的任何提供商，请使用真实值。
</Note>

关于本地 / 代理 `/v1` 后端的行为说明：

- OpenClaw 会将这些视为代理风格的兼容 OpenAI 路由，而不是原生 OpenAI 端点
- 原生 OpenAI 专用的请求整形在这里不适用：没有 `service_tier`、没有 Responses `store`、没有 OpenAI reasoning-compat payload shaping，也没有 prompt-cache 提示
- 在这些自定义代理 URL 上，不会注入隐藏的 OpenClaw attribution headers（`originator`、`version`、`User-Agent`）

对于更严格的兼容 OpenAI 后端，兼容性说明如下：

- 某些服务器在 Chat Completions 中只接受字符串形式的 `messages[].content`，不接受结构化内容片段数组。对于这些端点，设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 某些本地模型会以文本形式输出独立的方括号工具请求，例如 `[tool_name]`，后接 JSON，再接 `[END_TOOL_REQUEST]`。只有当该名称与当前轮次已注册工具中的某个工具**完全匹配**时，OpenClaw 才会将其提升为真实工具调用；否则，该块会被视为不受支持的文本，并从面向用户的回复中隐藏。
- 如果模型输出看起来像工具调用的 JSON、XML 或 ReAct 风格文本，但 provider 并未发出结构化调用，OpenClaw 会将其保留为文本，并在日志中记录警告，其中包含运行 id、provider/model、检测到的模式，以及可用时的工具名称。应将这视为 provider/model 的工具调用不兼容，而不是已完成的工具运行。
- 如果工具以 assistant 文本形式出现而没有真正运行，例如原始 JSON、XML、ReAct 语法，或 provider 响应中出现空的 `tool_calls` 数组，请先确认服务器使用的是支持工具调用的 chat template/parser。对于那些只有在强制启用工具使用时其 parser 才能正常工作的兼容 OpenAI Chat Completions 后端，应设置按模型粒度的请求覆盖，而不是依赖文本解析：

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

  仅在每个普通轮次都应调用工具的模型 / 会话中使用此设置。
  它会覆盖 OpenClaw 默认的代理值 `tool_choice: "auto"`。
  将 `local/my-local-model` 替换为
  `openclaw models list` 显示的精确 provider/model 引用。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 某些较小或更严格的本地后端在面对 OpenClaw 完整的智能体运行时提示结构时会不稳定，尤其是在包含工具 schema 时。请先使用精简的本地探针验证 provider 路径：

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  如果这一步成功，但正常的 OpenClaw 智能体轮次失败，先尝试
  `agents.defaults.experimental.localModelLean: true`，以移除像 `browser`、`cron` 和 `message` 这样的重量级默认工具；这是一个实验性标志，不是稳定的默认模式设置。参见
  [Experimental Features](/zh-CN/concepts/experimental-features)。如果仍然失败，再尝试
  `models.providers.<provider>.models[].compat.supportsTools: false`。

- 如果后端仅在更大型的 OpenClaw 运行中仍然失败，剩余问题通常是上游模型 / 服务器容量不足或后端 bug，而不是 OpenClaw 的传输层问题。

## 故障排除

- Gateway 网关能连到代理吗？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型被卸载了？重新加载；冷启动是常见的“卡住”原因。
- 本地服务器显示 `terminated`、`ECONNRESET`，或者在轮次进行中途关闭流？
  OpenClaw 会在诊断信息中记录低基数的 `model.call.error.failureKind`，以及
  OpenClaw 进程的 RSS/heap 快照。对于 LM Studio/Ollama 的内存压力问题，
  将该时间戳与服务器日志或 macOS 崩溃 / jetsam 日志对照，以确认模型服务器是否被系统杀掉。
- 当检测到的上下文窗口低于 **32k** 时，OpenClaw 会发出警告；低于 **16k** 时会直接阻止运行。如果你触发了这个预检，请提高服务器 / 模型的上下文限制，或选择更大的模型。
- 上下文错误？降低 `contextWindow` 或提高你的服务器限制。
- 兼容 OpenAI 的服务器返回 `messages[].content ... expected a string`？
  在该模型条目上添加 `compat.requiresStringContent: true`。
- 直接调用微型 `/v1/chat/completions` 可以工作，但 `openclaw infer model run --local`
  在 Gemma 或其他本地模型上失败？先检查 provider URL、模型引用、认证标记和服务器日志；本地 `model run` 不包含智能体工具。
  如果本地 `model run` 成功，但更大的智能体轮次失败，请使用 `localModelLean` 或 `compat.supportsTools: false` 来缩减智能体工具暴露面。
- 工具调用以原始 JSON/XML/ReAct 文本形式出现，或者 provider 返回空的 `tool_calls` 数组？
  不要添加一个盲目把 assistant 文本转换为工具执行的代理。先修复服务器的 chat template/parser。
  如果模型只有在强制启用工具使用时才能正常工作，请添加上面的按模型粒度覆盖
  `params.extra_body.tool_choice: "required"`，并且仅在每轮都预期会调用工具的会话中使用该模型条目。
- 安全性：本地模型会跳过提供商侧过滤；请保持智能体能力边界尽量收窄，并开启 compaction，以限制提示注入的影响范围。

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [模型故障切换](/zh-CN/concepts/model-failover)
