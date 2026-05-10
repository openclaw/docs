---
read_when:
    - 你想在自己的 GPU 机器上提供模型服务
    - 你正在接入 LM Studio 或 OpenAI 兼容代理
    - 你需要最安全的本地模型指导
summary: 在本地大语言模型上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-05-10T19:34:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

本地模型是可行的。它们也会提高对硬件、上下文大小和提示注入防御的要求，小型或激进量化的显卡会截断上下文并削弱安全性。本页是一份偏向高端本地栈和自定义 OpenAI 兼容本地服务器的指导。若要最低摩擦的新手引导，请从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 以及 `openclaw onboard` 开始。

对于只应在所选模型需要时才启动的本地服务器，请参阅
[本地模型服务](/zh-CN/gateway/local-model-services)。

## 硬件下限

目标要高：**≥2 台满配 Mac Studio 或同等 GPU 设备（约 $30k+）**，才能获得舒适的 Agent loop。单张 **24 GB** GPU 只适合较轻的提示，且延迟更高。始终运行**你能托管的最大 / 全尺寸变体**；小型或重度量化的 checkpoint 会提高提示注入风险（参见[安全](/zh-CN/gateway/security)）。

## 选择后端

| 后端                                                 | 适用场景                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/zh-CN/providers/lmstudio)                     | 首次本地设置、GUI 加载器、原生 Responses API                                |
| [Ollama](/zh-CN/providers/ollama)                          | CLI 工作流、模型库、免维护 systemd 服务                                     |
| MLX / vLLM / SGLang                                  | 通过 OpenAI 兼容 HTTP 端点进行高吞吐自托管服务                              |
| LiteLLM / OAI-proxy / 自定义 OpenAI 兼容代理         | 你在前面接入另一个模型 API，并需要 OpenClaw 将其视为 OpenAI                 |

后端支持时使用 Responses API（`api: "openai-responses"`，LM Studio 支持）。否则保持使用 Chat Completions（`api: "openai-completions"`）。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 用户：** 官方 Ollama Linux 安装器会启用带有 `Restart=always` 的 systemd 服务。在 WSL2 GPU 设置中，自动启动可能会在启动期间重新加载上一个模型并占住宿主机内存。如果你的 WSL2 VM 在启用 Ollama 后反复重启，请参阅 [WSL2 崩溃循环](/zh-CN/providers/ollama#wsl2-crash-loop-repeated-reboots)。
</Warning>

## 推荐：LM Studio + 大型本地模型（Responses API）

当前最佳本地栈。在 LM Studio 中加载大型模型（例如全尺寸 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理与最终文本分开。

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
- 在 LM Studio 中下载**可用的最大模型构建**（避免“小型”/重度量化变体），启动服务器，确认 `http://127.0.0.1:1234/v1/models` 列出了它。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型已加载；冷加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow`/`maxTokens`。
- 对 WhatsApp，坚持使用 Responses API，这样只会发送最终文本。

即使在运行本地模型时，也要保留托管模型配置；使用 `models.mode: "merge"`，以便 fallback 仍可用。

### 混合配置：托管主模型，本地 fallback

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

### 本地优先，并带托管安全网

调换主模型和 fallback 顺序；保持相同的 providers 块和 `models.mode: "merge"`，这样当本地机器不可用时，你可以 fallback 到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管的 MiniMax/Kimi/GLM 变体也存在于 OpenRouter 上，并提供区域固定端点（例如美国托管）。在那里选择区域变体，可以在仍通过 `models.mode: "merge"` 使用 Anthropic/OpenAI fallback 的同时，将流量保留在你选择的司法辖区内。
- 仅本地仍是最强的隐私路径；当你需要提供商功能但又希望控制数据流时，托管区域路由是折中方案。

## 其他 OpenAI 兼容本地代理

如果 MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或自定义
Gateway 网关暴露 OpenAI 风格的 `/v1/chat/completions`
端点，它们就可以工作。除非后端明确
记录支持 `/v1/responses`，否则使用 Chat Completions 适配器。将上面的 provider 块替换为你的
端点和模型 ID：

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

如果在带 `baseUrl` 的自定义提供商上省略 `api`，OpenClaw 默认使用
`openai-completions`。`127.0.0.1` 等 loopback 端点会被
自动信任；LAN、tailnet 和私有 DNS 端点仍然需要
`request.allowPrivateNetwork: true`。

`models.providers.<id>.models[].id` 值是提供商本地的。不要
在那里包含提供商前缀。例如，使用
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 启动的 MLX 服务器应使用此
目录 ID 和模型引用：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本地或代理的视觉模型上设置 `input: ["text", "image"]`，这样图像
附件会被注入到智能体轮次中。交互式自定义提供商
新手引导会推断常见视觉模型 ID，并只询问未知名称。
非交互式新手引导使用相同推断；对于未知视觉 ID，使用 `--custom-image-input`，
对于端点后面看起来已知但实际仅文本的模型，使用 `--custom-text-input`。

保持 `models.mode: "merge"`，以便托管模型仍可作为 fallback 使用。
在提升 `agents.defaults.timeoutSeconds` 之前，先为慢速本地或远程模型
服务器使用 `models.providers.<id>.timeoutSeconds`。提供商超时
仅应用于模型 HTTP 请求，包括连接、headers、body 流式传输，
以及总的 guarded-fetch 中止。

<Note>
对于自定义 OpenAI 兼容提供商，当 `baseUrl` 解析到 loopback、私有 LAN、`.local` 或裸主机名时，持久化类似 `apiKey: "ollama-local"` 的非机密本地标记是可接受的。OpenClaw 会将其视为有效的本地凭据，而不是报告缺少 key。对于任何接受公共主机名的提供商，请使用真实值。
</Note>

本地/代理 `/v1` 后端的行为说明：

- OpenClaw 将这些视为代理风格的 OpenAI 兼容路由，而不是原生
  OpenAI 端点
- 原生 OpenAI 专属请求塑形不适用于这里：没有
  `service_tier`，没有 Responses `store`，没有 OpenAI 推理兼容 payload
  塑形，也没有 prompt-cache 提示
- 隐藏的 OpenClaw 归因 headers（`originator`、`version`、`User-Agent`）
  不会注入到这些自定义代理 URL 上

更严格的 OpenAI 兼容后端的兼容性说明：

- 某些服务器在 Chat Completions 上只接受字符串 `messages[].content`，不接受
  结构化 content-part 数组。对于这些端点，请设置
  `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 某些本地模型会以文本形式发出独立的括号工具请求，例如
  `[tool_name]` 后跟 JSON 和 `[END_TOOL_REQUEST]`。只有当名称完全匹配该轮次已注册的
  工具时，OpenClaw 才会将它们提升为真实工具调用；否则该块会被视为不受支持的文本，并从
  用户可见回复中隐藏。
- 如果模型发出看起来像工具调用的 JSON、XML 或 ReAct 风格文本，
  但提供商没有发出结构化调用，OpenClaw 会将其保留为
  文本，并记录一条 warning，其中包含 run id、提供商/模型、检测到的模式，以及
  可用时的工具名称。应将其视为提供商/模型工具调用
  不兼容，而不是已完成的工具运行。
- 如果工具以 assistant 文本形式出现而不是运行，例如原始 JSON、
  XML、ReAct 语法，或提供商响应中的空 `tool_calls` 数组，
  请先确认服务器正在使用支持工具调用的 chat template/parser。对于
  OpenAI 兼容 Chat Completions 后端，如果其 parser 仅在强制工具
  使用时才工作，请设置每模型请求覆盖，而不是依赖文本
  解析：

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

  仅在每个正常轮次都应调用工具的模型/会话中使用此设置。
  它会覆盖 OpenClaw 的默认代理值 `tool_choice: "auto"`。
  将 `local/my-local-model` 替换为
  `openclaw models list` 显示的确切提供商/模型引用。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 如果自定义 OpenAI 兼容模型接受内置 profile 之外的 OpenAI 推理 effort，
  请在模型 compat 块上声明它们。在这里添加 `"xhigh"`
  会让 `/think xhigh`、会话选择器、Gateway 网关验证和 `llm-task`
  验证针对该配置的提供商/模型引用暴露此级别：

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

如果模型加载正常，但完整的智能体轮次行为异常，请自上而下排查：先确认传输，再缩小问题范围。

1. **确认本地模型本身会响应。** 不使用工具，不使用智能体上下文：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **确认 Gateway 网关路由。** 只发送提供的提示词，跳过 transcript、AGENTS bootstrap、context-engine assembly、工具和内置 MCP servers，但仍会验证 Gateway 网关路由、身份验证和提供商选择：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **尝试精简模式。** 如果两个探针都通过，但真实智能体轮次因工具调用格式错误或提示词过大而失败，请启用 `agents.defaults.experimental.localModelLean: true`。它会移除三个最重的默认工具（`browser`、`cron`、`message`），让提示词形态更小、更不脆弱。有关完整说明、适用场景以及如何确认已启用，请参阅[实验性功能 → 本地模型精简模式](/zh-CN/concepts/experimental-features#local-model-lean-mode)。

4. **最后手段是完全禁用工具。** 如果精简模式仍不够，请为该模型条目设置 `models.providers.<provider>.models[].compat.supportsTools: false`。之后，智能体会在该模型上不使用工具调用运行。

5. **再往后，瓶颈就在上游。** 如果启用精简模式并设置 `supportsTools: false` 后，后端仍然只在更大的 OpenClaw 运行中失败，那么剩余问题通常是上游模型或服务器容量：上下文窗口、GPU 内存、kv-cache 驱逐，或后端 bug。到这一步就不是 OpenClaw 的传输层问题了。

## 故障排除

- Gateway 网关能访问代理吗？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型已卸载？重新加载；冷启动是常见的“卡住”原因。
- 本地服务器显示 `terminated`、`ECONNRESET`，或在轮次中途关闭流？
  OpenClaw 会在诊断中记录低基数的 `model.call.error.failureKind`，以及
  OpenClaw 进程的 RSS/堆快照。对于 LM Studio/Ollama 的内存压力，请将该时间戳
  与服务器日志或 macOS crash / jetsam 日志对照，以确认模型服务器是否被终止。
- OpenClaw 会根据检测到的模型窗口推导上下文窗口预检阈值；如果 `agents.defaults.contextTokens` 降低了有效窗口，则会根据未设上限的模型窗口推导。低于 20% 且有 **8k** 下限时会发出警告。硬阻断使用 10% 阈值且有 **4k** 下限，并受有效上下文窗口限制，因此过大的模型元数据不会拒绝原本有效的用户上限。如果你遇到该预检，请提高服务器/模型上下文限制，或选择更大的模型。
- 上下文错误？降低 `contextWindow`，或提高你的服务器限制。
- OpenAI 兼容服务器返回 `messages[].content ... expected a string`？
  在该模型条目上添加 `compat.requiresStringContent: true`。
- OpenAI 兼容服务器返回 `validation.keys`，或提示消息条目只允许 `role` 和 `content`？
  在该模型条目上添加 `compat.strictMessageKeys: true`。
- 直接的小型 `/v1/chat/completions` 调用可用，但 `openclaw infer model run --local`
  在 Gemma 或其他本地模型上失败？先检查提供商 URL、模型引用、身份验证标记和服务器日志；本地 `model run` 不包含智能体工具。
  如果本地 `model run` 成功但更大的智能体轮次失败，请用 `localModelLean` 或 `compat.supportsTools: false` 减少智能体工具面。
- 工具调用显示为原始 JSON/XML/ReAct 文本，或提供商返回空的 `tool_calls` 数组？
  不要添加会盲目把 assistant 文本转换为工具执行的代理。先修复服务器聊天模板/解析器。如果模型只有在强制使用工具时才可用，请添加上面的逐模型
  `params.extra_body.tool_choice: "required"` 覆盖，并且只在每个轮次都预期会调用工具的会话中使用该模型条目。
- 安全：本地模型会跳过提供商侧过滤；保持智能体范围狭窄并开启压缩，以限制提示词注入影响范围。

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [模型故障转移](/zh-CN/concepts/model-failover)
