---
read_when:
    - 你想从自己的 GPU 主机提供模型服务
    - 你正在连接 LM Studio 或兼容 OpenAI 的代理服务
    - 你需要最安全的本地模型指南
summary: 在本地 LLM 上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-07-11T20:33:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

本地模型可以运行，但它们对硬件、上下文大小和提示注入防御提出了更高要求：小型或激进量化的模型会截断上下文，并跳过提供商侧的安全过滤器。本页介绍高端本地技术栈和自定义 OpenAI 兼容服务器。要选择最省事的路径，请从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 以及 `openclaw onboard` 开始。

对于仅应在选定模型需要时启动的本地服务器，请参阅[本地模型服务](/zh-CN/gateway/local-model-services)。

## 硬件最低要求

为了获得流畅的 Agent loop，建议使用 **2 台以上满配 Mac Studio 或同等规格的 GPU 设备（约 3 万美元以上）**。单块 **24 GB** GPU 只能以较高延迟处理较轻量的提示。始终运行**你能够托管的最大型／完整尺寸变体**——小型或高度量化的检查点会增加提示注入风险（请参阅[安全性](/zh-CN/gateway/security)）。

## 选择后端

| 后端                                                 | 适用场景                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| [ds4](/zh-CN/providers/ds4)                                | 在 macOS Metal 上运行本地 DeepSeek V4 Flash，并使用 OpenAI 兼容的工具调用     |
| [LM Studio](/zh-CN/providers/lmstudio)                     | 首次进行本地设置、使用 GUI 加载器以及原生 Responses API                       |
| LiteLLM / OAI-proxy / 自定义 OpenAI 兼容代理         | 你为另一个模型 API 提供前置代理，并需要 OpenClaw 将其视为 OpenAI              |
| MLX / vLLM / SGLang                                  | 通过 OpenAI 兼容 HTTP 端点提供高吞吐量的自托管服务                            |
| [Ollama](/zh-CN/providers/ollama)                          | CLI 工作流、模型库以及无需人工管理的 systemd 服务                             |

后端支持时，请使用 `api: "openai-responses"`（LM Studio 支持）。否则，请使用 `api: "openai-completions"`。如果具有 `baseUrl` 的自定义提供商省略了 `api`，OpenClaw 将默认使用 `openai-completions`。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA：**官方 Ollama Linux 安装程序会启用一个设置了 `Restart=always` 的 systemd 服务。在 WSL2 GPU 环境中，自动启动可能会在引导期间重新加载上次使用的模型并持续占用主机内存，从而导致虚拟机反复重启。请参阅 [WSL2 崩溃循环](/zh-CN/providers/ollama#troubleshooting)。
</Warning>

## LM Studio + 大型本地模型（Responses API）

这是目前最佳的本地技术栈。在 LM Studio 中加载大型模型（完整尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认地址为 `http://127.0.0.1:1234`），并使用 Responses API 将推理过程与最终文本分离。

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
- 下载**可用的最大型模型构建**（避免“小型”／高度量化的变体），启动服务器，并确认 `http://127.0.0.1:1234/v1/models` 列出了该模型。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型处于已加载状态；冷加载会增加启动延迟。
- 如果你的 LM Studio 构建有所不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，请坚持使用 Responses API，以便只发送最终文本。
- 保持 `models.mode: "merge"`，让托管模型继续可用作回退选项。

### 混合配置：托管模型作为主模型，本地模型作为回退

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

若要优先使用本地模型，并以托管模型作为安全保障，请交换 `primary`/`fallbacks` 的顺序，同时保持相同的 `providers` 块和 `models.mode: "merge"`。

### 区域托管／数据路由

OpenRouter 上也提供托管的 MiniMax/Kimi/GLM 变体，并带有区域固定端点（例如托管在美国的端点）。选择区域变体，可以在保留 `models.mode: "merge"` 以使用 Anthropic/OpenAI 回退的同时，让流量保留在你选择的司法管辖区内。纯本地仍然是隐私保护最强的路径；如果你需要提供商功能，但又希望控制数据流向，托管式区域路由则是折中选择。

## 其他 OpenAI 兼容本地代理

只要 MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或任意自定义 Gateway 网关公开 OpenAI 风格的 `/v1/chat/completions` 端点，就可以使用。除非后端明确说明支持 `/v1/responses`，否则请使用 `openai-completions`。

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

对于受保护的模型请求，自定义／本地提供商条目会信任其精确配置的 `baseUrl` 源，包括环回地址、局域网、tailnet 和私有 DNS 主机。无论如何配置，元数据／链路本地源始终会被阻止。对其他私有源的请求仍需设置 `models.providers.<id>.request.allowPrivateNetwork: true`；将该信任标志设置为 `false` 可选择退出精确源信任。

`models.providers.<id>.models[].id` 是提供商本地 ID——不要包含提供商前缀。对于使用 `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 启动的 MLX 服务器：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本地或代理的视觉模型上设置 `input: ["text", "image"]`，以便将图片附件注入智能体轮次。交互式自定义提供商新手引导会推断常见的视觉模型 ID，并且只会询问无法识别的名称；非交互式新手引导使用相同的推断机制，可通过 `--custom-image-input` / `--custom-text-input` 覆盖推断结果。

对于速度较慢的本地／远程模型服务器，请先使用 `models.providers.<id>.timeoutSeconds`，再考虑增大 `agents.defaults.timeoutSeconds`。提供商超时仅涵盖模型 HTTP 请求的连接、响应头、响应体流式传输以及受保护 fetch 的整体中止时间——如果智能体／运行超时时间更短，也需要增大该值，因为提供商超时无法延长整个运行时间。

<Note>
对于自定义 OpenAI 兼容提供商，当 `baseUrl` 解析到环回地址、私有局域网、`.local` 或不带域的主机名时，可以使用非机密的本地标记，例如 `apiKey: "ollama-local"`——OpenClaw 会将其视为有效的本地凭证，而不会报告缺少密钥。对于任何接受公共主机名的提供商，请使用真实值。
</Note>

本地／代理 `/v1` 后端的行为说明：

- OpenClaw 将这些路由视为代理式 OpenAI 兼容路由，而不是原生 OpenAI 端点。
- 仅适用于原生 OpenAI 的请求塑形不会生效：不会设置 `service_tier`，不会设置 Responses `store`，不会应用 OpenAI 推理兼容载荷塑形，也不会添加提示缓存提示。
- 自定义代理 URL 不会注入隐藏的 OpenClaw 归属标头（`originator`、`version`、`User-Agent`）。

针对限制更严格的 OpenAI 兼容后端的兼容性覆盖设置：

- **仅字符串内容**：某些服务器只接受字符串形式的 `messages[].content`，不接受结构化内容部分数组。请设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- **严格的消息键名**：如果服务器拒绝包含 `role`/`content` 以外键名的消息条目，请设置 `compat.strictMessageKeys: true`。
- **方括号工具文本**：某些本地模型会以文本形式输出独立的方括号工具请求，例如 `[tool_name]` 后跟 JSON 和 `[END_TOOL_REQUEST]`。只有当名称与该轮次已注册工具的名称完全匹配时，OpenClaw 才会将其提升为真实工具调用；否则，它会作为隐藏且不受支持的文本保留。
- **看起来像工具调用的非结构化文本**：如果模型输出看起来像工具调用、但并非结构化调用的 JSON/XML/ReAct 风格文本，OpenClaw 会将其保留为文本，并记录一条警告；警告中包含运行 ID、提供商／模型、检测到的模式，以及可用时的工具名称。这属于提供商／模型不兼容，并不表示工具运行已完成。
- **强制使用工具**：如果工具以助手文本形式出现（原始 JSON/XML/ReAct，或空的 `tool_calls` 数组），请先确认服务器的聊天模板／解析器支持工具调用。如果解析器仅在强制使用工具时才有效，请按模型覆盖代理的默认值 `tool_choice: "auto"`：

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

  仅在每个正常轮次都应调用工具的情况下使用此设置。请将 `local/my-local-model` 替换为 `openclaw models list` 中的准确引用，或通过 CLI 进行设置：

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **额外的推理强度**：如果自定义 OpenAI 兼容模型接受内置配置之外的 OpenAI 推理强度，请在模型的兼容性块中声明它们。添加 `"xhigh"` 后，该模型引用便可在 `/think xhigh`、会话选择器、Gateway 网关验证和 `llm-task` 验证中使用它：

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

## 更小型或限制更严格的后端

如果模型能够正常加载，但完整的智能体轮次行为异常，请从上到下进行排查：先确认传输，再逐步缩小问题范围。

1. **确认本地模型能够响应**——不使用工具，也不提供智能体上下文：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **确认 Gateway 网关路由**——仅发送提示词，跳过对话记录、AGENTS 引导、上下文引擎组装、工具和内置 MCP 服务器，但仍会测试 Gateway 网关路由、身份验证和提供商选择：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. 如果两个探测都通过，但实际智能体轮次仍因工具调用格式错误或提示词过大而失败，请**尝试精简模式**：设置 `agents.defaults.experimental.localModelLean: true`。除非明确需要，否则它会移除重量级浏览器、定时任务、消息、媒体生成、语音和 PDF 工具，并默认将较大的工具目录置于结构化工具搜索控制之后，同时保持 `exec` 直接可见。有关详细信息以及如何确认其已启用，请参阅[实验性功能 -> 本地模型精简模式](/zh-CN/concepts/experimental-features#local-model-lean-mode)。

4. **最后手段是完全禁用工具**：为该模型设置 `models.providers.<provider>.models[].compat.supportsTools: false`，之后智能体运行时不会调用工具。

5. **再往后，瓶颈就在上游。** 如果启用精简模式并设置 `supportsTools: false` 后，后端仍然只在较大的 OpenClaw 运行中失败，剩余问题通常出在模型或服务器本身——上下文窗口、GPU 内存、kv-cache 淘汰或后端缺陷——而非 OpenClaw 的传输层。

## 故障排查

- **Gateway 网关无法访问代理？** `curl http://127.0.0.1:1234/v1/models`。
- **LM Studio 模型已卸载？** 重新加载；冷启动是常见的“卡住”原因。
- **本地服务器报告 `terminated`、`ECONNRESET`，或在轮次中途关闭数据流？** OpenClaw 会在诊断信息中记录低基数的 `model.call.error.failureKind`，以及 OpenClaw 进程的 RSS/堆快照。对于 LM Studio/Ollama 的内存压力，请将该时间戳与服务器日志或 macOS 崩溃/jetsam 日志进行比对，以确认模型服务器是否被终止。
- **上下文错误？** OpenClaw 会根据检测到的模型窗口推导上下文窗口预检阈值（如果 `agents.defaults.contextTokens` 将其调低，则使用受限后的窗口）：低于 20% 时发出警告，最低阈值为 **8k**；低于 10% 时硬性阻止，最低阈值为 **4k**（阈值会限制在有效上下文窗口内，以免过大的模型元数据错误拒绝有效的用户上限）。请降低 `contextWindow`，或提高服务器/模型的上下文限制。
- **出现 `messages[].content ... expected a string`？** 在该模型条目中添加 `compat.requiresStringContent: true`。
- **出现 `validation.keys`，或“消息条目仅允许 `role` 和 `content`”？** 在该模型条目中添加 `compat.strictMessageKeys: true`。
- **直接调用 `/v1/chat/completions` 有效，但在 Gemma 或其他本地模型上执行 `openclaw infer model run --local` 失败？** 请先检查提供商 URL、模型引用、身份验证标记和服务器日志——`model run` 会完全跳过智能体工具。如果 `model run` 成功，但更大的智能体轮次失败，请使用 `localModelLean` 或 `compat.supportsTools: false` 缩减工具范围。
- **工具调用显示为原始 JSON/XML/ReAct 文本，或提供商返回空的 `tool_calls` 数组？** 不要添加一个盲目地将助手文本转换为工具执行的代理——请先修复服务器的聊天模板/解析器。如果模型仅在强制使用工具时有效，请添加上文的 `params.extra_body.tool_choice: "required"` 覆盖项，并且仅将该模型条目用于预期每个轮次都调用工具的会话。
- **安全性**：本地模型会跳过提供商侧的过滤器。请保持智能体职责范围狭窄，并启用压缩，以限制提示词注入的影响范围。

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [模型故障转移](/zh-CN/concepts/model-failover)
