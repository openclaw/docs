---
read_when:
    - 你想从自己的 GPU 主机提供模型
    - 你正在接入 LM Studio 或 OpenAI 兼容代理
    - 你需要最安全的本地模型指南
summary: 在本地 LLM 上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-06-27T02:03:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

本地模型可行。它们也提高了对硬件、上下文大小和提示注入防护的要求：小型或激进量化的显卡会截断上下文并削弱安全性。本页是面向高端本地栈和自定义 OpenAI 兼容本地服务器的主观指南。要获得最低阻力的新手引导，请从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 以及 `openclaw onboard` 开始。

对于只应在选定模型需要时启动的本地服务器，请参阅
[本地模型服务](/zh-CN/gateway/local-model-services)。

## 硬件下限

目标要高：**≥2 台配置拉满的 Mac Studio 或同等 GPU 设备（约 $30k+）**，才能获得舒适的 Agent loop。单块 **24 GB** GPU 只适用于更轻量的提示，并且延迟更高。始终运行**你能托管的最大 / 全尺寸变体**；小型或重度量化的检查点会增加提示注入风险（见 [安全](/zh-CN/gateway/security)）。

## 选择后端

| 后端                                                 | 适用场景                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/zh-CN/providers/ds4)                                | 在 macOS Metal 上运行本地 DeepSeek V4 Flash，并支持 OpenAI 兼容的工具调用   |
| [LM Studio](/zh-CN/providers/lmstudio)                     | 首次本地设置、GUI 加载器、原生 Responses API                                |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | 你在前端代理另一个模型 API，并需要 OpenClaw 将其视为 OpenAI                 |
| MLX / vLLM / SGLang                                  | 使用 OpenAI 兼容 HTTP 端点进行高吞吐自托管服务                              |
| [Ollama](/zh-CN/providers/ollama)                          | CLI 工作流、模型库、免维护 systemd 服务                                     |

后端支持时使用 Responses API（`api: "openai-responses"`）（LM Studio 支持）。否则坚持使用 Chat Completions（`api: "openai-completions"`）。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 用户：** 官方 Ollama Linux 安装程序会启用带有 `Restart=always` 的 systemd 服务。在 WSL2 GPU 设置上，自动启动可能会在启动期间重新加载上一个模型并占用主机内存。如果你的 WSL2 VM 在启用 Ollama 后反复重启，请参阅 [WSL2 崩溃循环](/zh-CN/providers/ollama#wsl2-crash-loop-repeated-reboots)。
</Warning>

## 推荐：LM Studio + 大型本地模型（Responses API）

当前最佳本地栈。在 LM Studio 中加载一个大型模型（例如全尺寸 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理与最终文本分开。

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

即使在运行本地模型时，也要保留托管模型配置；使用 `models.mode: "merge"`，确保回退仍然可用。

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

### 本地优先，托管安全网

交换主模型和回退顺序；保留相同的 providers 块和 `models.mode: "merge"`，这样当本地机器不可用时，你可以回退到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管的 MiniMax/Kimi/GLM 变体也存在于 OpenRouter 上，并提供区域固定端点（例如美国托管）。在那里选择区域变体，在继续使用 `models.mode: "merge"` 作为 Anthropic/OpenAI 回退的同时，让流量留在你选择的司法辖区内。
- 仅本地仍然是最强的隐私路径；当你需要提供商功能但又想控制数据流时，托管区域路由是折中方案。

## 其他 OpenAI 兼容本地代理

如果 MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或自定义
Gateway 网关暴露了 OpenAI 风格的 `/v1/chat/completions`
端点，就可以使用。除非后端明确记录支持 `/v1/responses`，否则使用 Chat Completions 适配器。将上面的提供商块替换为你的
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

如果在带有 `baseUrl` 的自定义提供商上省略 `api`，OpenClaw 默认使用
`openai-completions`。自定义/本地提供商条目会信任其精确配置的
`baseUrl` 来源来发出受保护的模型请求，包括回环、LAN、tailnet
和私有 DNS 主机。对其他私有来源的请求仍需要
`request.allowPrivateNetwork: true`；元数据/链路本地来源在没有明确选择启用时仍会被阻止。将其设为 `false` 可退出精确来源信任。

`models.providers.<id>.models[].id` 值是提供商本地的。不要
在其中包含提供商前缀。例如，使用
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 启动的 MLX 服务器应使用以下
目录 ID 和模型引用：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本地或代理的视觉模型上设置 `input: ["text", "image"]`，这样图像
附件会被注入到 agent 轮次中。交互式自定义提供商
新手引导会推断常见视觉模型 ID，并且只询问未知名称。
非交互式新手引导使用相同的推断；对未知视觉 ID 使用 `--custom-image-input`，
或当一个看起来像已知模型的模型在你的端点后面其实仅支持文本时使用 `--custom-text-input`。

保留 `models.mode: "merge"`，这样托管模型仍可作为回退。
在提升 `agents.defaults.timeoutSeconds` 之前，先对较慢的本地或远程模型
服务器使用 `models.providers.<id>.timeoutSeconds`。提供商超时
只适用于模型 HTTP 请求，包括连接、标头、正文流式传输
以及总的受保护 fetch 中止。如果 agent 或运行超时更低，也要提升
该上限，因为提供商超时无法延长整个 agent 运行。

<Note>
对于自定义 OpenAI 兼容提供商，当 `baseUrl` 解析到回环、私有 LAN、`.local` 或裸主机名时，持久化一个非密钥的本地标记（例如 `apiKey: "ollama-local"`）是可接受的。OpenClaw 会将其视为有效的本地凭证，而不是报告缺少密钥。对任何接受公共主机名的提供商，请使用真实值。
</Note>

本地/代理 `/v1` 后端的行为说明：

- OpenClaw 将这些视为代理风格的 OpenAI 兼容路由，而不是原生
  OpenAI 端点
- 这里不会应用仅限原生 OpenAI 的请求整形：没有
  `service_tier`，没有 Responses `store`，没有 OpenAI 推理兼容载荷
  整形，也没有提示缓存提示
- 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）
  不会注入到这些自定义代理 URL 上

更严格 OpenAI 兼容后端的兼容性说明：

- 某些服务器在 Chat Completions 上只接受字符串 `messages[].content`，不接受
  结构化的内容部分数组。请为这些端点设置
  `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 某些本地模型会以文本形式发出独立的方括号工具请求，例如
  `[tool_name]` 后跟 JSON 和 `[END_TOOL_REQUEST]`。只有当名称与该轮次中注册的
  工具完全匹配时，OpenClaw 才会将这些提升为真实工具调用；否则该块会被视为不受支持的文本，并从用户可见回复中隐藏。
- 如果模型发出看起来像工具调用的 JSON、XML 或 ReAct 风格文本，
  但提供商没有发出结构化调用，OpenClaw 会将其保留为
  文本，并记录警告，其中包含运行 ID、提供商/模型、检测到的模式，以及
  可用时的工具名称。应将其视为提供商/模型的工具调用
  不兼容，而不是已完成的工具运行。
- 如果工具以 assistant 文本而不是运行形式出现，例如原始 JSON、
  XML、ReAct 语法，或提供商响应中为空的 `tool_calls` 数组，
  请先确认服务器正在使用支持工具调用的聊天模板/解析器。对于
  只有在强制使用工具时解析器才工作的 OpenAI 兼容 Chat Completions 后端，请设置按模型的请求覆盖，而不是依赖文本
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

  仅在每个普通轮次都应调用工具的模型/会话中使用此配置。
  它会覆盖 OpenClaw 的默认代理值 `tool_choice: "auto"`。
  将 `local/my-local-model` 替换为
  `openclaw models list` 显示的精确提供商/模型引用。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 如果自定义 OpenAI 兼容模型接受内置配置文件之外的 OpenAI 推理力度，
  请在模型 compat 块上声明它们。在这里添加 `"xhigh"`
  会让 `/think xhigh`、会话选择器、Gateway 网关验证和 `llm-task`
  验证为该已配置的提供商/模型引用暴露该级别：

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

如果模型能正常加载，但完整智能体轮次行为异常，请自上而下排查 —— 先确认传输，再缩小范围。

1. **确认本地模型本身会响应。** 无工具，无智能体上下文：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **确认 Gateway 网关路由。** 只发送提供的提示词 —— 跳过转录、AGENTS 引导、context-engine 组装、工具和内置 MCP 服务器，但仍会执行 Gateway 网关路由、认证和提供商选择：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **尝试精简模式。** 如果两个探针都通过，但真实智能体轮次因工具调用格式错误或提示过大而失败，请启用 `agents.defaults.experimental.localModelLean: true`。它会移除三个最重的默认工具（`browser`、`cron`、`message`），并默认将更大的工具目录放到结构化工具搜索控件之后，但必须保留直接 `message` 交付语义的运行除外。完整说明、适用场景以及如何确认已开启，请参阅[实验性功能 → 本地模型精简模式](/zh-CN/concepts/experimental-features#local-model-lean-mode)。

4. **将完全禁用工具作为最后手段。** 如果精简模式仍不够，请为该模型条目设置 `models.providers.<provider>.models[].compat.supportsTools: false`。随后智能体将在该模型上不使用工具调用运行。

5. **再往后，瓶颈就在上游。** 如果在精简模式和 `supportsTools: false` 之后，后端仍然只在较大的 OpenClaw 运行中失败，剩下的问题通常是上游模型或服务器容量：上下文窗口、GPU 内存、kv-cache 淘汰，或后端 bug。到这一步，它就不是 OpenClaw 传输层的问题了。

## 故障排除

- Gateway 网关能访问代理吗？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型是否已卸载？请重新加载；冷启动是常见的“卡住”原因。
- 本地服务器报告 `terminated`、`ECONNRESET`，或在轮次中途关闭流？
  OpenClaw 会在诊断中记录低基数的 `model.call.error.failureKind`，以及
  OpenClaw 进程的 RSS/堆快照。对于 LM Studio/Ollama 的内存压力，
  请将该时间戳与服务器日志或 macOS 崩溃 /
  jetsam 日志匹配，以确认模型服务器是否被终止。
- OpenClaw 会根据检测到的模型窗口，或在 `agents.defaults.contextTokens` 降低有效窗口时根据未封顶的模型窗口，推导上下文窗口预检阈值。低于 20% 时会发出警告，并设置 **8k** 下限。硬阻断使用 10% 阈值，并设置 **4k** 下限，且封顶到有效上下文窗口，因此过大的模型元数据不会拒绝原本有效的用户上限。如果触发该预检，请提高服务器/模型上下文限制，或选择更大的模型。
- 上下文错误？降低 `contextWindow`，或提高你的服务器限制。
- OpenAI 兼容服务器返回 `messages[].content ... expected a string`？
  在该模型条目上添加 `compat.requiresStringContent: true`。
- OpenAI 兼容服务器返回 `validation.keys`，或提示消息条目只允许 `role` 和 `content`？
  在该模型条目上添加 `compat.strictMessageKeys: true`。
- 直接的小型 `/v1/chat/completions` 调用可用，但 `openclaw infer model run --local`
  在 Gemma 或其他本地模型上失败？请先检查提供商 URL、模型引用、认证
  标记和服务器日志；本地 `model run` 不包含智能体工具。
  如果本地 `model run` 成功，但更大的智能体轮次失败，请使用 `localModelLean`
  或 `compat.supportsTools: false` 缩减智能体
  工具表面。
- 工具调用以原始 JSON/XML/ReAct 文本形式出现，或提供商返回
  空的 `tool_calls` 数组？不要添加会盲目把助手
  文本转换为工具执行的代理。先修复服务器聊天模板/解析器。如果
  模型只有在强制使用工具时才可用，请添加上面的按模型
  `params.extra_body.tool_choice: "required"` 覆盖，并且只在每轮都预期会有工具调用的会话中使用该模型
  条目。
- 安全：本地模型会跳过提供商侧过滤；保持智能体范围收窄并开启压缩，以限制提示注入的影响范围。

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference)
- [模型故障转移](/zh-CN/concepts/model-failover)
