---
read_when:
    - 你想从自己的 GPU 机器提供模型服务
    - 你正在接入 LM Studio 或 OpenAI 兼容代理
    - 你需要最安全的本地模型指南
summary: 在本地 LLM 上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-07-05T11:19:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 850bbd6db1cf3da8719edec37cc271d9ea36dd5adf3722a555ded0823ec022ea
    source_path: gateway/local-models.md
    workflow: 16
---

本地模型可用，但它们会提高硬件、上下文大小和提示注入防御的要求：小模型或激进量化的模型会截断上下文，并跳过提供商侧安全过滤器。本页介绍更高端的本地栈和自定义 OpenAI 兼容服务器。对于阻力最低的路径，请从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 以及 `openclaw onboard` 开始。

对于只应在所选模型需要时才启动的本地服务器，请参阅[本地模型服务](/zh-CN/gateway/local-model-services)。

## 硬件下限

目标是使用 **2 台以上配置拉满的 Mac Studio 或等效 GPU 设备（约 3 万美元以上）**，以获得舒适的 Agent loop。单块 **24 GB** GPU 只能以更高延迟处理较轻的提示。始终运行**你能托管的最大 / 完整尺寸变体** - 小型或重度量化的检查点会增加提示注入风险（参见[安全](/zh-CN/gateway/security)）。

## 选择后端

| 后端                                                 | 适用场景                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/zh-CN/providers/ds4)                                | 在 macOS Metal 上运行本地 DeepSeek V4 Flash，并支持 OpenAI 兼容工具调用    |
| [LM Studio](/zh-CN/providers/lmstudio)                     | 首次本地设置、GUI 加载器、原生 Responses API                               |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | 你在另一个模型 API 前置代理，并需要 OpenClaw 将其视为 OpenAI               |
| MLX / vLLM / SGLang                                  | 使用 OpenAI 兼容 HTTP 端点进行高吞吐量自托管服务                           |
| [Ollama](/zh-CN/providers/ollama)                          | CLI 工作流、模型库、免维护 systemd 服务                                    |

当后端支持时（LM Studio 支持），使用 `api: "openai-responses"`。否则使用 `api: "openai-completions"`。如果带有 `baseUrl` 的自定义提供商省略了 `api`，OpenClaw 默认使用 `openai-completions`。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA：**官方 Ollama Linux 安装器会启用带有 `Restart=always` 的 systemd 服务。在 WSL2 GPU 设置中，自动启动可能会在启动期间重新加载上一个模型并占住主机内存，导致 VM 反复重启。参见 [WSL2 崩溃循环](/zh-CN/providers/ollama#troubleshooting)。
</Warning>

## LM Studio + 大型本地模型（Responses API）

这是目前最佳的本地栈。在 LM Studio 中加载大型模型（完整尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理与最终文本分离。

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

设置检查清单：

- 安装 LM Studio：[https://lmstudio.ai](https://lmstudio.ai)
- 下载**可用的最大模型构建**（避免“小型”/重度量化变体），启动服务器，确认 `http://127.0.0.1:1234/v1/models` 会列出它。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型已加载；冷加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，坚持使用 Responses API，这样只会发送最终文本。
- 保持 `models.mode: "merge"`，以便托管模型继续可作为回退使用。

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

对于本地优先并带托管安全网的配置，交换 `primary`/`fallbacks` 顺序，并保持相同的 `providers` 块和 `models.mode: "merge"`。

### 区域托管 / 数据路由

托管的 MiniMax/Kimi/GLM 变体也存在于 OpenRouter 上，并带有区域固定端点（例如美国托管）。选择区域变体，以在保持 `models.mode: "merge"` 供 Anthropic/OpenAI 回退使用的同时，将流量保留在你选择的管辖区内。纯本地仍然是最强的隐私路径；当你需要提供商功能但又想控制数据流时，托管区域路由是折中方案。

## 其他 OpenAI 兼容本地代理

如果 MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或任何自定义 Gateway 网关暴露 OpenAI 风格的 `/v1/chat/completions` 端点，它就可以工作。除非后端明确记录支持 `/v1/responses`，否则使用 `openai-completions`。

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

自定义/本地提供商条目会信任其精确配置的 `baseUrl` 来源来处理受保护的模型请求，包括 loopback、LAN、tailnet 和私有 DNS 主机。元数据/link-local 来源始终会被阻止。对其他私有来源的请求仍需要 `models.providers.<id>.request.allowPrivateNetwork: true`；将信任标志设置为 `false` 可选择退出精确来源信任。

`models.providers.<id>.models[].id` 是提供商本地的 - 不要包含提供商前缀。对于使用 `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 启动的 MLX 服务器：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本地或代理的视觉模型上设置 `input: ["text", "image"]`，这样图像附件就会注入到智能体轮次中。交互式自定义提供商新手引导会推断常见视觉模型 ID，并且只询问未知名称；非交互式新手引导使用相同推断，可通过 `--custom-image-input` / `--custom-text-input` 覆盖。

对于较慢的本地/远程模型服务器，请先使用 `models.providers.<id>.timeoutSeconds`，再提高 `agents.defaults.timeoutSeconds`。提供商超时仅覆盖模型 HTTP 请求的连接、标头、正文流式传输和受保护 fetch 的总中止时间 - 如果智能体/运行超时更低，也要提高它，因为提供商超时无法延长整个运行。

<Note>
对于自定义 OpenAI 兼容提供商，当 `baseUrl` 解析到 loopback、私有 LAN、`.local` 或裸主机名时，可接受像 `apiKey: "ollama-local"` 这样的非机密本地标记 - OpenClaw 会将其视为有效的本地凭据，而不是报告缺少密钥。对于任何接受公共主机名的提供商，请使用真实值。
</Note>

本地/代理 `/v1` 后端的行为说明：

- OpenClaw 将这些视为代理风格的 OpenAI 兼容路由，而不是原生 OpenAI 端点。
- 仅原生 OpenAI 的请求整形不会应用：没有 `service_tier`，没有 Responses `store`，没有 OpenAI 推理兼容载荷整形，也没有提示缓存提示。
- 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）不会注入到自定义代理 URL 上。

用于更严格 OpenAI 兼容后端的兼容性覆盖：

- **仅字符串内容**：某些服务器只接受字符串 `messages[].content`，不接受结构化内容部分数组。设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- **严格消息键名**：如果服务器拒绝包含超过 `role`/`content` 的消息条目，请设置 `compat.strictMessageKeys: true`。
- **带方括号的工具文本**：某些本地模型会将独立的带方括号工具请求作为文本发出，例如 `[tool_name]` 后跟 JSON 和 `[END_TOOL_REQUEST]`。只有当名称与该轮次注册的工具完全匹配时，OpenClaw 才会将这些提升为真正的工具调用；否则它会保持为隐藏的、不受支持的文本。
- **看起来像工具调用的非结构化文本**：如果模型发出看起来像工具调用但不是结构化调用的 JSON/XML/ReAct 风格文本，OpenClaw 会将其保留为文本，并在可用时记录一条警告，其中包含运行 ID、提供商/模型、检测到的模式和工具名称。这是提供商/模型不兼容，而不是已完成的工具运行。
- **强制使用工具**：如果工具以助手文本形式出现（原始 JSON/XML/ReAct，或空的 `tool_calls` 数组），请先确认服务器的聊天模板/解析器支持工具调用。如果解析器只有在强制使用工具时才工作，请按模型覆盖默认代理值 `tool_choice: "auto"`：

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

  仅在每个正常轮次都应调用工具的地方使用此设置。将 `local/my-local-model` 替换为 `openclaw models list` 中的精确引用，或通过 CLI 设置：

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **额外推理强度**：如果自定义 OpenAI 兼容模型接受内置配置之外的 OpenAI 推理强度，请在模型的 compat 块中声明它们。添加 `"xhigh"` 会在 `/think xhigh`、会话选择器、Gateway 网关验证和 `llm-task` 验证中为该模型引用暴露它：

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

如果模型能干净加载，但完整智能体轮次行为异常，请自上而下排查：先确认传输，然后缩小问题表面。

1. **确认本地模型有响应** - 无工具、无智能体上下文：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **确认 Gateway 网关路由** - 只发送提示词，跳过转录记录、AGENTS 引导、上下文引擎组装、工具和内置 MCP 服务器，但仍会执行 Gateway 网关路由、凭证和提供商选择：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **如果两个探测都通过，但真实智能体轮次因格式错误的工具调用或过大的提示词而失败，请尝试精简模式**：设置 `agents.defaults.experimental.localModelLean: true`。它会移除三个最重的默认工具（`browser`、`cron`、`message` - 除非某次运行必须保留直接 `message` 投递语义），并默认把更大的工具目录放在结构化 Tool Search 控制之后。有关详情以及如何确认它已开启，请参阅[实验性功能 -> 本地模型精简模式](/zh-CN/concepts/experimental-features#local-model-lean-mode)。

4. **作为最后手段，完全禁用工具**：为该模型设置 `models.providers.<provider>.models[].compat.supportsTools: false` - 随后智能体将不使用工具调用运行。

5. **再往后，瓶颈就在上游。** 如果后端在精简模式和 `supportsTools: false` 之后仍只在较大的 OpenClaw 运行中失败，剩余问题通常出在模型或服务器本身 - 上下文窗口、GPU 内存、KV 缓存淘汰或后端错误 - 而不是 OpenClaw 的传输层。

## 故障排查

- **Gateway 网关无法访问代理？** `curl http://127.0.0.1:1234/v1/models`。
- **LM Studio 模型已卸载？** 重新加载；冷启动是常见的“挂起”原因。
- **本地服务器报告 `terminated`、`ECONNRESET`，或在轮次中途关闭流？** OpenClaw 会在诊断中记录低基数的 `model.call.error.failureKind` 以及 OpenClaw 进程 RSS/堆快照。对于 LM Studio/Ollama 内存压力，请将该时间戳与服务器日志或 macOS 崩溃/jetsam 日志匹配，以确认模型服务器是否被终止。
- **上下文错误？** OpenClaw 会根据检测到的模型窗口（或当 `agents.defaults.contextTokens` 将其降低时的上限窗口）推导上下文窗口预检阈值，低于 20% 时发出警告并设置 **8k** 下限，低于 10% 时硬阻止并设置 **4k** 下限（受有效上下文窗口限制，因此过大的模型元数据不会拒绝有效的用户上限）。降低 `contextWindow`，或提高服务器/模型上下文限制。
- **`messages[].content ... expected a string`？** 在该模型条目上添加 `compat.requiresStringContent: true`。
- **`validation.keys`，或“消息条目只允许 `role` 和 `content`”？** 在该模型条目上添加 `compat.strictMessageKeys: true`。
- **直接 `/v1/chat/completions` 调用可用，但 `openclaw infer model run --local` 在 Gemma 或其他本地模型上失败？** 先检查提供商 URL、模型引用、凭证标记和服务器日志 - `model run` 会完全跳过智能体工具。如果 `model run` 成功但更大的智能体轮次失败，请用 `localModelLean` 或 `compat.supportsTools: false` 缩小工具范围。
- **工具调用显示为原始 JSON/XML/ReAct 文本，或提供商返回空的 `tool_calls` 数组？** 不要添加会盲目把 assistant 文本转换为工具执行的代理 - 请先修复服务器的聊天模板/解析器。如果模型只有在强制使用工具时才可用，请添加上面的 `params.extra_body.tool_choice: "required"` 覆盖项，并且只在预期每轮都有工具调用的会话中使用该模型条目。
- **安全性**：本地模型会跳过提供商侧过滤器。保持智能体范围收窄，并开启压缩，以限制提示词注入的影响范围。

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference)
- [模型故障转移](/zh-CN/concepts/model-failover)
