---
read_when:
    - 你想从自己的 GPU 机器提供模型服务
    - 你正在接入 LM Studio 或兼容 OpenAI 的代理
    - 你需要最安全的本地模型使用指南
summary: 在本地 LLM 上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-04-27T12:52:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b98d2d4b7e6162ca681f5d184ee6e075ea09e5e4b4544e6733c5e6b8ca4cc30
    source_path: gateway/local-models.md
    workflow: 15
---

本地部署是可行的，但 OpenClaw 需要大上下文窗口以及强有力的提示注入防护。小显存卡会截断上下文并削弱安全性。目标应尽量高：**至少 2 台满配 Mac Studio 或同等级 GPU 机器（约 3 万美元以上）**。单张 **24 GB** GPU 只适用于较轻的提示，并且延迟更高。使用**你能运行的最大 / 全尺寸模型变体**；激进量化或“小型”检查点会提高提示注入风险（参见 [Security](/zh-CN/gateway/security)）。

如果你想要摩擦最小的本地方案，从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 加上 `openclaw onboard` 开始。本页是针对更高端本地栈和自定义兼容 OpenAI 的本地服务器的偏好型指南。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 用户：** 官方 Ollama Linux 安装器会启用一个带 `Restart=always` 的 systemd 服务。在 WSL2 GPU 环境中，自动启动可能会在开机时重新加载上一次模型，并锁定宿主机内存。如果你在启用 Ollama 后发现 WSL2 虚拟机反复重启，请参见 [WSL2 crash loop](/zh-CN/providers/ollama#wsl2-crash-loop-repeated-reboots)。
</Warning>

## 推荐：LM Studio + 大型本地模型（Responses API）

这是当前最好的本地栈。先在 LM Studio 中加载一个大型模型（例如完整尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理过程与最终文本分离。

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
- 在 LM Studio 中，下载**可用的最大模型构建**（避免使用“小型” / 重度量化变体），启动服务器，并确认 `http://127.0.0.1:1234/v1/models` 中列出了该模型。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型处于已加载状态；冷启动加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow` / `maxTokens`。
- 对于 WhatsApp，请坚持使用 Responses API，这样只会发送最终文本。

即使在本地运行，也请保留托管模型配置；使用 `models.mode: "merge"`，这样回退模型仍然可用。

### 混合配置：托管模型为主，本地模型为回退

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

交换主模型与回退模型的顺序；保留相同的 provider 配置块和 `models.mode: "merge"`，这样当本地机器不可用时，你仍可以回退到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管版的 MiniMax / Kimi / GLM 变体在 OpenRouter 上也有带区域固定端点的版本（例如托管在美国）。你可以在那里选择区域版本，把流量限制在你选定的司法辖区内，同时仍通过 `models.mode: "merge"` 使用 Anthropic / OpenAI 回退。
- 纯本地仍然是隐私性最强的方案；当你需要提供商功能但又希望控制数据流向时，区域托管路由是折中方案。

## 其他兼容 OpenAI 的本地代理

如果 MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或自定义 Gateway 网关暴露的是兼容 OpenAI 风格的 `/v1/chat/completions` 端点，就可以使用。除非后端明确记录支持 `/v1/responses`，否则请使用 Chat Completions 适配器。将上面的 provider 配置块替换为你的端点和模型 ID：

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

如果在带 `baseUrl` 的自定义 provider 上省略 `api`，OpenClaw 默认使用 `openai-completions`。像 `127.0.0.1` 这样的 loopback 端点会被自动信任；LAN、tailnet 和私有 DNS 端点仍需要设置 `request.allowPrivateNetwork: true`。

`models.providers.<id>.models[].id` 的值是 provider 本地值。不要在其中包含 provider 前缀。例如，用 `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 启动的 MLX 服务器应使用以下目录 ID 和模型引用：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

保留 `models.mode: "merge"`，这样托管模型仍可作为回退使用。对于慢速的本地或远程模型服务器，请优先使用 `models.providers.<id>.timeoutSeconds`，再考虑提高 `agents.defaults.timeoutSeconds`。provider 超时仅适用于模型 HTTP 请求，包括连接、响应头、流式响应体以及整个 guarded-fetch 的中止。

<Note>
对于自定义兼容 OpenAI 的提供商，当 `baseUrl` 解析到 loopback、私有 LAN、`.local` 或裸主机名时，可以持久化一个非敏感的本地标记，例如 `apiKey: "ollama-local"`。OpenClaw 会将其视为有效的本地凭证，而不会报告缺少 key。对于接受公网主机名的提供商，请使用真实值。
</Note>

关于本地 / 代理 `/v1` 后端的行为说明：

- OpenClaw 将这些视为代理风格的兼容 OpenAI 路由，而不是原生 OpenAI 端点
- 仅适用于原生 OpenAI 的请求整形在这里不生效：没有 `service_tier`、没有 Responses `store`、没有 OpenAI 推理兼容载荷整形，也没有提示缓存提示
- 在这些自定义代理 URL 上，不会注入隐藏的 OpenClaw 归因请求头（`originator`、`version`、`User-Agent`）

对于更严格的兼容 OpenAI 后端，兼容性注意事项如下：

- 有些服务器在 Chat Completions 中只接受字符串形式的 `messages[].content`，不接受结构化内容片段数组。对于这些端点，请设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 有些本地模型会以文本形式输出独立的方括号工具请求，例如 `[tool_name]` 后跟 JSON 和 `[END_TOOL_REQUEST]`。只有当该名称与本轮已注册工具完全匹配时，OpenClaw 才会将其提升为真实工具调用；否则，这个块会被视为不受支持的文本，并从用户可见回复中隐藏。
- 如果模型输出了看起来像工具调用的 JSON、XML 或 ReAct 风格文本，但 provider 并未发出结构化调用，OpenClaw 会将其保留为文本，并记录一条警告，其中包含运行 id、provider / model、检测到的模式，以及可用时的工具名称。请将这视为 provider / model 的工具调用不兼容，而不是已完成的工具运行。
- 如果工具以 assistant 文本形式出现而不是被执行，例如原始 JSON、XML、ReAct 语法，或 provider 响应中出现空的 `tool_calls` 数组，请先确认服务器使用的是支持工具调用的 chat template / parser。对于只有在强制使用工具时其 parser 才能正常工作的兼容 OpenAI Chat Completions 后端，请设置每模型请求覆盖，而不要依赖文本解析：

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

  仅在每个正常轮次都应调用工具的模型 / 会话中使用此设置。它会覆盖 OpenClaw 默认的代理值 `tool_choice: "auto"`。将 `local/my-local-model` 替换为 `openclaw models list` 显示的精确 provider / model 引用。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 某些较小或更严格的本地后端在面对 OpenClaw 完整的智能体运行时提示结构时不稳定，尤其是包含工具 schema 时。如果后端对于很小的直接 `/v1/chat/completions` 调用是正常的，但在正常 OpenClaw 智能体轮次中失败，请先尝试 `agents.defaults.experimental.localModelLean: true`，以去掉像 `browser`、`cron` 和 `message` 这样的重量级默认工具；这是实验性标志，不是稳定的默认模式设置。参见 [Experimental Features](/zh-CN/concepts/experimental-features)。如果仍然失败，再尝试 `models.providers.<provider>.models[].compat.supportsTools: false`。
- 如果后端仍然只在较大的 OpenClaw 运行中失败，剩余问题通常是上游模型 / 服务器容量不足，或后端 bug，而不是 OpenClaw 的传输层问题。

## 故障排除

- Gateway 网关能访问代理吗？`curl http://127.0.0.1:1234/v1/models`
- LM Studio 模型未加载？重新加载；冷启动是常见的“卡住”原因。
- 本地服务器显示 `terminated`、`ECONNRESET`，或在轮次中途关闭流？OpenClaw 会在诊断中记录低基数的 `model.call.error.failureKind`，以及 OpenClaw 进程的 RSS / heap 快照。对于 LM Studio / Ollama 的内存压力问题，可将该时间戳与服务器日志或 macOS 崩溃 / jetsam 日志对照，以确认模型服务器是否被系统杀掉。
- 当检测到上下文窗口低于 **32k** 时，OpenClaw 会发出警告；低于 **16k** 时会阻止运行。如果你触发了该 preflight，请提高服务器 / 模型的上下文限制，或选择更大的模型。
- 上下文错误？降低 `contextWindow` 或提高你的服务器限制。
- 兼容 OpenAI 的服务器返回 `messages[].content ... expected a string`？在该模型条目上添加 `compat.requiresStringContent: true`。
- 直接的小型 `/v1/chat/completions` 调用可以正常工作，但 `openclaw infer model run` 在 Gemma 或其他本地模型上失败？先用 `compat.supportsTools: false` 禁用工具 schema，然后重新测试。如果服务器仍然只在较大的 OpenClaw 提示下崩溃，请将其视为上游服务器 / 模型的限制。
- 工具调用显示为原始 JSON / XML / ReAct 文本，或者 provider 返回空的 `tool_calls` 数组？不要添加一个盲目把 assistant 文本转换为工具执行的代理。先修复服务器的 chat template / parser。如果该模型只有在强制使用工具时才能工作，请添加上面的每模型 `params.extra_body.tool_choice: "required"` 覆盖，并且只在预计每轮都需要工具调用的会话中使用该模型条目。
- 安全性：本地模型会跳过提供商侧过滤；请保持智能体范围狭窄，并开启压缩，以限制提示注入的影响范围。

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [模型故障切换](/zh-CN/concepts/model-failover)
