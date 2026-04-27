---
read_when:
    - 你想从你自己的 GPU 机器提供模型服务
    - 你正在接入 LM Studio 或兼容 OpenAI 的代理
    - 你需要最安全的本地模型使用指南
summary: 在本地 LLM 上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-04-27T10:58:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0961710c9784eac0611e8c6277bafe7afc24b563584b782255a100cbdc49fe75
    source_path: gateway/local-models.md
    workflow: 15
---

本地部署是可行的，但 OpenClaw 需要大上下文窗口以及强大的提示注入防护能力。小显卡会截断上下文，并削弱安全性。建议高配：**至少 2 台拉满配置的 Mac Studio 或同等级 GPU 机器（约 3 万美元以上）**。单张 **24 GB** GPU 仅适用于较轻量的提示，且延迟更高。请使用**你能运行的最大 / 完整尺寸模型变体**；高度量化或“小型”检查点会提高提示注入风险（见 [安全](/zh-CN/gateway/security)）。

如果你想要最低摩擦的本地配置，请从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 和 `openclaw onboard` 开始。本页是面向更高端本地堆栈以及自定义 OpenAI 兼容本地服务器的意见型指南。

## 推荐：LM Studio + 大型本地模型（Responses API）

这是当前最好的本地堆栈。在 LM Studio 中加载一个大型模型（例如完整尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理过程与最终文本分离。

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
- 在 LM Studio 中，下载**可用的最大模型构建**（避免使用“小型”/高度量化变体），启动服务器，并确认 `http://127.0.0.1:1234/v1/models` 列出了该模型。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型处于已加载状态；冷加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，请坚持使用 Responses API，这样只会发送最终文本。

即使在本地运行，也请保留托管模型配置；使用 `models.mode: "merge"`，这样回退模型仍然可用。

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

交换主模型和回退模型的顺序；保留相同的 provider 配置块和 `models.mode: "merge"`，这样在本地机器宕机时，你仍然可以回退到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管版 MiniMax/Kimi/GLM 变体也可以通过 OpenRouter 的区域固定端点提供（例如美国托管）。你可以在那里选择区域变体，以便将流量保留在你选择的司法辖区内，同时仍然使用 `models.mode: "merge"` 来保留 Anthropic/OpenAI 回退能力。
- 完全本地部署仍然是隐私性最强的路径；当你需要提供商功能但又想控制数据流向时，区域托管路由是折中方案。

## 其他 OpenAI 兼容的本地代理

只要 vLLM、LiteLLM、OAI-proxy 或自定义网关暴露的是 OpenAI 风格的 `/v1` 端点，就可以工作。将上面的 provider 配置块替换为你的端点和模型 ID：

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
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

保留 `models.mode: "merge"`，这样托管模型仍然可作为回退。
对于较慢的本地或远程模型服务器，请先使用 `models.providers.<id>.timeoutSeconds`，再考虑提高 `agents.defaults.timeoutSeconds`。provider 超时仅适用于模型 HTTP 请求，包括连接、请求头、响应体流式传输以及整个受保护抓取的中止。

<Note>
对于自定义 OpenAI 兼容 provider，当 `baseUrl` 解析到 loopback、私有局域网、`.local` 或裸主机名时，可以持久化一个非机密的本地标记，例如 `apiKey: "ollama-local"`。OpenClaw 会将其视为有效的本地凭证，而不会报告缺少密钥。对于接受公网主机名的任何 provider，请使用真实值。
</Note>

关于本地/代理 `/v1` 后端的行为说明：

- OpenClaw 将这些视为代理风格的 OpenAI 兼容路由，而不是原生 OpenAI 端点
- 这里不会应用仅限原生 OpenAI 的请求整形：没有 `service_tier`、没有 Responses `store`、没有 OpenAI 推理兼容负载整形，也没有提示缓存提示
- 不会在这些自定义代理 URL 上注入隐藏的 OpenClaw 归因请求头（`originator`、`version`、`User-Agent`）

关于更严格的 OpenAI 兼容后端的兼容性说明：

- 有些服务器在 Chat Completions 中只接受字符串形式的 `messages[].content`，不接受结构化内容部件数组。对于这些端点，请设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 有些本地模型会以文本形式发出独立的方括号工具请求，例如 `[tool_name]` 后跟 JSON 和 `[END_TOOL_REQUEST]`。只有当名称与当前回合已注册的工具完全匹配时，OpenClaw 才会将其提升为真实工具调用；否则，该区块会被视为不受支持的文本，并从用户可见回复中隐藏。
- 如果模型输出看起来像工具调用的 JSON、XML 或 ReAct 风格文本，但 provider 并未发出结构化调用，OpenClaw 会将其保留为文本，并在日志中记录警告，其中包含运行 ID、provider/model、检测到的模式以及可用时的工具名称。请将其视为 provider/model 的工具调用兼容性问题，而不是已完成的工具运行。
- 如果工具以助手文本的形式出现而不是被执行，例如原始 JSON、XML、ReAct 语法，或 provider 响应中的空 `tool_calls` 数组，请先确认服务器正在使用支持工具调用的聊天模板/解析器。对于那些只有在强制使用工具时解析器才有效的 OpenAI 兼容 Chat Completions 后端，请设置按模型的请求覆盖，而不要依赖文本解析：

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

  仅在每个普通回合都应调用工具的模型/会话中使用此设置。
  这会覆盖 OpenClaw 默认的代理值 `tool_choice: "auto"`。
  请将 `local/my-local-model` 替换为 `openclaw models list`
  所显示的准确 provider/model 引用。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 一些更小或更严格的本地后端在面对 OpenClaw 完整的智能体运行时提示形状时并不稳定，尤其是在包含工具 schema 时。如果后端可以处理很小的直接 `/v1/chat/completions` 调用，却无法处理正常的 OpenClaw 智能体回合，请先尝试
  `agents.defaults.experimental.localModelLean: true`，以去掉像 `browser`、`cron` 和 `message` 这样较重的默认工具；这是一个实验性标志，而不是稳定的默认模式设置。参见
  [实验性功能](/zh-CN/concepts/experimental-features)。如果仍然失败，再尝试
  `models.providers.<provider>.models[].compat.supportsTools: false`。
- 如果后端仍然只在更大的 OpenClaw 运行中失败，剩余问题通常是上游模型/服务器容量不足或后端 bug，而不是 OpenClaw 的传输层问题。

## 故障排除

- Gateway 网关能访问代理吗？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型未加载？重新加载；冷启动是常见的“卡住”原因。
- 本地服务器显示 `terminated`、`ECONNRESET`，或者在回合中途关闭流？
  OpenClaw 会在诊断中记录低基数的 `model.call.error.failureKind`，以及 OpenClaw 进程的 RSS/heap 快照。对于 LM Studio/Ollama 的内存压力问题，请将该时间戳与服务器日志或 macOS 崩溃 / jetsam 日志进行比对，以确认模型服务器是否被杀死。
- 当检测到的上下文窗口低于 **32k** 时，OpenClaw 会发出警告；低于 **16k** 时会直接阻止。如果你触发了该预检，请提高服务器/模型的上下文限制，或选择更大的模型。
- 上下文报错？降低 `contextWindow` 或提高你的服务器限制。
- OpenAI 兼容服务器返回 `messages[].content ... expected a string`？
  在该模型条目上添加 `compat.requiresStringContent: true`。
- 很小的直接 `/v1/chat/completions` 调用可以工作，但 `openclaw infer model run`
  在 Gemma 或其他本地模型上失败？
  先用 `compat.supportsTools: false` 禁用工具 schema，然后重新测试。如果服务器仍然只在更大的 OpenClaw 提示下崩溃，请将其视为上游服务器/模型限制。
- 工具调用显示为原始 JSON/XML/ReAct 文本，或者 provider 返回空的 `tool_calls` 数组？
  不要添加那种会盲目把助手文本转换成工具执行的代理。请先修复服务器的聊天模板/解析器。如果模型只有在强制工具使用时才能工作，请添加上面的按模型
  `params.extra_body.tool_choice: "required"` 覆盖，并且只在预期每一回合都要调用工具的会话中使用该模型条目。
- 安全性：本地模型会跳过 provider 侧过滤；请保持智能体范围收窄，并开启压缩，以限制提示注入的影响范围。

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [模型故障切换](/zh-CN/concepts/model-failover)
