---
read_when:
    - 你想从自己的 GPU 机器提供模型服务
    - 你正在接入 LM Studio 或 OpenAI 兼容代理
    - 你需要最安全的本地模型指导
summary: 在本地大语言模型上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-05-02T21:49:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

本地模型是可行的。它们也提高了对硬件、上下文大小和提示注入防御的要求 — 小型或激进量化的显卡会截断上下文并削弱安全性。本页是面向高端本地堆栈和自定义 OpenAI 兼容本地服务器的主观指南。要获得阻力最低的新手引导，请从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 以及 `openclaw onboard` 开始。

## 硬件下限

目标要高：为了获得舒适的 Agent loop，建议使用 **≥2 台满配 Mac Studio 或等效 GPU 设备（约 $30k+）**。单块 **24 GB** GPU 只适合较轻量的提示，并且延迟更高。始终运行**你能承载的最大/全尺寸变体**；小型或重度量化的检查点会提高提示注入风险（参见 [安全](/zh-CN/gateway/security)）。

## 选择后端

| 后端                                                 | 适用场景                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/zh-CN/providers/lmstudio)                     | 首次本地设置、GUI 加载器、原生 Responses API                               |
| [Ollama](/zh-CN/providers/ollama)                          | CLI 工作流、模型库、免维护的 systemd 服务                                   |
| MLX / vLLM / SGLang                                  | 使用 OpenAI 兼容 HTTP 端点进行高吞吐自托管服务                              |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | 你在前面代理另一个模型 API，并需要让 OpenClaw 将其视为 OpenAI               |

当后端支持时使用 Responses API（`api: "openai-responses"`）（LM Studio 支持）。否则坚持使用 Chat Completions（`api: "openai-completions"`）。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 用户：**官方 Ollama Linux 安装器会启用一个带有 `Restart=always` 的 systemd 服务。在 WSL2 GPU 设置中，自动启动可能会在启动期间重新加载上次的模型并占用宿主机内存。如果你的 WSL2 VM 在启用 Ollama 后反复重启，请参见 [WSL2 崩溃循环](/zh-CN/providers/ollama#wsl2-crash-loop-repeated-reboots)。
</Warning>

## 推荐：LM Studio + 大型本地模型（Responses API）

当前最佳本地堆栈。在 LM Studio 中加载大型模型（例如全尺寸 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理与最终文本分离。

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

- 安装 LM Studio：[https://lmstudio.ai](https://lmstudio.ai)
- 在 LM Studio 中，下载**可用的最大模型构建**（避免“小型”/重度量化变体），启动服务器，确认 `http://127.0.0.1:1234/v1/models` 会列出它。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型已加载；冷加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，坚持使用 Responses API，这样只会发送最终文本。

即使运行本地模型，也保持托管模型已配置；使用 `models.mode: "merge"`，让回退保持可用。

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

### 本地优先，并保留托管安全网

交换主模型和回退的顺序；保留相同的 providers 块和 `models.mode: "merge"`，这样当本地机器不可用时，你可以回退到 Sonnet 或 Opus。

### 区域托管/数据路由

- 托管的 MiniMax/Kimi/GLM 变体也存在于 OpenRouter 上，并提供区域固定端点（例如美国托管）。在那里选择区域变体，以便在继续使用 `models.mode: "merge"` 作为 Anthropic/OpenAI 回退的同时，将流量保留在你选择的司法管辖区内。
- 纯本地仍然是最强的隐私路径；当你需要提供商功能但又想控制数据流时，托管区域路由是折中方案。

## 其他 OpenAI 兼容本地代理

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或自定义 Gateway 网关都可以工作，只要它们公开 OpenAI 风格的 `/v1/chat/completions` 端点即可。除非后端明确记录支持 `/v1/responses`，否则使用 Chat Completions 适配器。将上面的 provider 块替换为你的端点和模型 ID：

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

如果在带有 `baseUrl` 的自定义 provider 上省略 `api`，OpenClaw 默认使用 `openai-completions`。诸如 `127.0.0.1` 的 loopback 端点会自动受信任；LAN、tailnet 和私有 DNS 端点仍然需要 `request.allowPrivateNetwork: true`。

`models.providers.<id>.models[].id` 值是 provider 本地的。不要在其中包含 provider 前缀。例如，使用 `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 启动的 MLX 服务器应该使用这个目录 ID 和模型引用：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本地或代理的视觉模型上设置 `input: ["text", "image"]`，让图像附件被注入到智能体轮次中。交互式自定义 provider 新手引导会推断常见视觉模型 ID，并且只询问未知名称。非交互式新手引导使用相同推断；对于未知视觉 ID 使用 `--custom-image-input`，或者当外观看似已知的模型在你的端点后面实际仅支持文本时，使用 `--custom-text-input`。

保持 `models.mode: "merge"`，让托管模型作为回退保持可用。在提高 `agents.defaults.timeoutSeconds` 之前，先为较慢的本地或远程模型服务器使用 `models.providers.<id>.timeoutSeconds`。provider 超时只适用于模型 HTTP 请求，包括连接、标头、正文流式传输，以及受保护 fetch 的总中止时间。

<Note>
对于自定义 OpenAI 兼容 provider，当 `baseUrl` 解析到 loopback、私有 LAN、`.local` 或裸主机名时，允许持久化一个非秘密的本地标记，例如 `apiKey: "ollama-local"`。OpenClaw 会将其视为有效的本地凭证，而不是报告缺少密钥。对任何接受公共主机名的 provider，请使用真实值。
</Note>

本地/代理 `/v1` 后端的行为说明：

- OpenClaw 将这些视为代理风格的 OpenAI 兼容路由，而不是原生 OpenAI 端点
- 此处不适用仅原生 OpenAI 的请求整形：没有 `service_tier`，没有 Responses `store`，没有 OpenAI 推理兼容载荷整形，也没有提示缓存提示
- 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）不会注入到这些自定义代理 URL 上

更严格的 OpenAI 兼容后端的兼容性说明：

- 一些服务器在 Chat Completions 上只接受字符串 `messages[].content`，不接受结构化 content-part 数组。请为这些端点设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 一些本地模型会以文本形式发出独立的括号包裹工具请求，例如 `[tool_name]` 后跟 JSON 和 `[END_TOOL_REQUEST]`。只有当名称与该轮次中已注册的工具完全匹配时，OpenClaw 才会将其提升为真实工具调用；否则，该块会被视为不受支持的文本，并从用户可见回复中隐藏。
- 如果模型发出看似工具调用的 JSON、XML 或 ReAct 风格文本，但 provider 没有发出结构化调用，OpenClaw 会将其保留为文本，并在可用时记录一条警告，其中包含运行 ID、provider/模型、检测到的模式以及工具名称。应将其视为 provider/模型工具调用不兼容，而不是已完成的工具运行。
- 如果工具作为 assistant 文本出现而不是运行，例如原始 JSON、XML、ReAct 语法，或 provider 响应中的空 `tool_calls` 数组，请先确认服务器正在使用支持工具调用的 chat template/parser。对于 OpenAI 兼容 Chat Completions 后端，如果其 parser 只有在强制使用工具时才工作，请设置按模型的请求覆盖，而不是依赖文本解析：

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

  仅在每个正常轮次都应调用工具的模型/会话中使用此设置。它会覆盖 OpenClaw 默认代理值 `tool_choice: "auto"`。请将 `local/my-local-model` 替换为 `openclaw models list` 显示的确切 provider/模型引用。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 如果自定义 OpenAI 兼容模型接受内置档案之外的 OpenAI 推理力度，请在模型 compat 块中声明它们。在这里添加 `"xhigh"` 会让 `/think xhigh`、会话选择器、Gateway 网关验证和 `llm-task` 验证为该已配置的 provider/模型引用公开该级别：

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

## 更小或更严格的后端

如果模型加载干净，但完整智能体轮次行为异常，请自上而下排查 — 先确认传输，再缩小范围。

1. **确认本地模型本身会响应。** 不使用工具，不带智能体上下文：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **确认 Gateway 网关路由。** 只发送提供的提示词 —— 跳过转录、AGENTS 引导、上下文引擎组装、工具和内置 MCP 服务器，但仍会验证 Gateway 网关路由、身份验证和提供商选择：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **尝试精简模式。** 如果两个探测都通过，但真实智能体回合因格式错误的工具调用或过大的提示词而失败，请启用 `agents.defaults.experimental.localModelLean: true`。它会移除三个最重的默认工具（`browser`、`cron`、`message`），让提示词形态更小且不那么脆弱。完整说明、适用场景以及如何确认它已开启，请参阅[实验性功能 → 本地模型精简模式](/zh-CN/concepts/experimental-features#local-model-lean-mode)。

4. **作为最后手段，完全禁用工具。** 如果精简模式还不够，请为该模型条目设置 `models.providers.<provider>.models[].compat.supportsTools: false`。随后该智能体会在该模型上不使用工具调用。

5. **再往后，瓶颈就在上游。** 如果在精简模式和 `supportsTools: false` 之后，后端仍然只在较大的 OpenClaw 运行中失败，剩余问题通常是上游模型或服务器容量 —— 上下文窗口、GPU 内存、kv-cache 驱逐，或者后端缺陷。到这一步，问题就不在 OpenClaw 的传输层了。

## 故障排除

- Gateway 网关能连到代理吗？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型是否已卸载？重新加载；冷启动是常见的“卡住”原因。
- 本地服务器提示 `terminated`、`ECONNRESET`，或在回合中途关闭流？
  OpenClaw 会在诊断信息中记录低基数的 `model.call.error.failureKind`，以及
  OpenClaw 进程的 RSS/堆快照。对于 LM Studio/Ollama
  内存压力，请将该时间戳与服务器日志或 macOS 崩溃 /
  jetsam 日志进行匹配，以确认模型服务器是否被杀掉。
- OpenClaw 会根据检测到的模型窗口推导上下文窗口预检阈值，或者在 `agents.defaults.contextTokens` 降低有效窗口时，根据未封顶的模型窗口推导阈值。低于 20% 时会发出警告，并设置 **8k** 下限。硬阻断使用 10% 阈值，并设置 **4k** 下限，且会封顶到有效上下文窗口，因此过大的模型元数据不会拒绝原本有效的用户上限。如果你触发该预检，请提高服务器/模型上下文限制，或选择更大的模型。
- 出现上下文错误？降低 `contextWindow`，或提高你的服务器限制。
- OpenAI 兼容服务器返回 `messages[].content ... expected a string`？
  在该模型条目上添加 `compat.requiresStringContent: true`。
- 直接的微型 `/v1/chat/completions` 调用可用，但 `openclaw infer model run --local`
  在 Gemma 或其他本地模型上失败？先检查提供商 URL、模型引用、身份验证
  标记和服务器日志；本地 `model run` 不包含智能体工具。
  如果本地 `model run` 成功但更大的智能体回合失败，请用 `localModelLean` 或 `compat.supportsTools: false` 减少智能体
  工具表面。
- 工具调用显示为原始 JSON/XML/ReAct 文本，或提供商返回
  空的 `tool_calls` 数组？不要添加会盲目把助手
  文本转换为工具执行的代理。先修复服务器聊天模板/解析器。如果
  模型只有在强制使用工具时才工作，请添加上面的按模型
  `params.extra_body.tool_choice: "required"` 覆盖，并且只在预计每个回合都会有工具调用的会话中使用该模型
  条目。
- 安全性：本地模型会跳过提供商侧过滤；保持智能体范围收窄，并开启压缩，以限制提示词注入的影响半径。

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference)
- [模型故障转移](/zh-CN/concepts/model-failover)
