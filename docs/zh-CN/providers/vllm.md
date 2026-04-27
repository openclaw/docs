---
read_when:
    - 你想让 OpenClaw 连接到本地 vLLM 服务器运行
    - 你想使用自己的模型并通过兼容 OpenAI 的 `/v1` 端点提供服务
summary: 使用 vLLM（兼容 OpenAI 的本地服务器）运行 OpenClaw
title: vLLM
x-i18n:
    generated_at: "2026-04-27T12:56:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 15
---

vLLM 可以通过**兼容 OpenAI** 的 HTTP API 提供开源模型（以及一些自定义模型）。OpenClaw 通过 `openai-completions` API 连接到 vLLM。

当你选择启用 `VLLM_API_KEY`（如果你的服务器不强制鉴权，任意值都可以），并且没有定义显式的 `models.providers.vllm` 条目时，OpenClaw 还可以**自动发现** vLLM 上可用的模型。

OpenClaw 将 `vllm` 视为一个本地的兼容 OpenAI 提供商，支持流式 usage 统计，因此 Status / 上下文 token 计数可以根据 `stream_options.include_usage` 的响应进行更新。

| 属性 | 值 |
| ---------------- | ---------------------------------------- |
| 提供商 ID | `vllm` |
| API | `openai-completions`（兼容 OpenAI） |
| 鉴权 | `VLLM_API_KEY` 环境变量 |
| 默认 base URL | `http://127.0.0.1:8000/v1` |

## 入门指南

<Steps>
  <Step title="使用兼容 OpenAI 的服务器启动 vLLM">
    你的 base URL 应暴露 `/v1` 端点（例如 `/v1/models`、`/v1/chat/completions`）。vLLM 通常运行在：

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="设置 API key 环境变量">
    如果你的服务器不强制鉴权，任意值都可以：

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="选择一个模型">
    替换为你的某个 vLLM 模型 ID：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## 模型发现（隐式 provider）

当设置了 `VLLM_API_KEY`（或存在 auth profile），并且你**没有**定义 `models.providers.vllm` 时，OpenClaw 会查询：

```
GET http://127.0.0.1:8000/v1/models
```

并将返回的 ID 转换为模型条目。

<Note>
如果你显式设置了 `models.providers.vllm`，则会跳过自动发现，你必须手动定义模型。
</Note>

## 显式配置（手动模型）

以下情况请使用显式配置：

- vLLM 运行在不同的主机或端口上
- 你想固定 `contextWindow` 或 `maxTokens` 的值
- 你的服务器需要真实 API key（或者你想控制请求头）
- 你连接的是受信任的 loopback、LAN 或 Tailscale vLLM 端点

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // 可选：为较慢的本地模型延长连接 / 响应头 / 响应体 / 请求超时
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="代理式行为">
    vLLM 被视为一种代理风格的兼容 OpenAI `/v1` 后端，而不是原生
    OpenAI 端点。这意味着：

    | 行为 | 是否应用？ |
    |----------|----------|
    | 原生 OpenAI 请求整形 | 否 |
    | `service_tier` | 不发送 |
    | Responses `store` | 不发送 |
    | 提示缓存提示 | 不发送 |
    | OpenAI 推理兼容载荷整形 | 不应用 |
    | 隐藏的 OpenClaw 归因请求头 | 不会注入到自定义 base URL 上 |

  </Accordion>

  <Accordion title="Qwen 思考控制">
    对于通过 vLLM 提供的 Qwen 模型，当服务器期望使用 Qwen chat-template kwargs 时，
    请在模型条目上设置
    `params.qwenThinkingFormat: "chat-template"`。OpenClaw 会将 `/think off` 映射为：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    非 `off` 的思考级别会发送 `enable_thinking: true`。如果你的端点
    期望的是 DashScope 风格的顶层标志，请使用
    `params.qwenThinkingFormat: "top-level"`，这样会在请求根部发送
    `enable_thinking`。也接受蛇形命名的 `params.qwen_thinking_format`。

  </Accordion>

  <Accordion title="Nemotron 3 思考控制">
    vLLM / Nemotron 3 可以使用 chat-template kwargs 来控制推理是作为隐藏推理返回，
    还是作为可见答案文本返回。当 OpenClaw 会话
    使用 `vllm/nemotron-3-*` 且关闭思考时，内置的 vLLM 插件会发送：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    如需自定义这些值，请在模型参数下设置 `chat_template_kwargs`。
    如果你同时设置了 `params.extra_body.chat_template_kwargs`，则该值拥有
    最终优先级，因为 `extra_body` 是最后应用的请求体覆盖项。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Qwen 工具调用显示为文本">
    首先请确保 vLLM 启动时为该模型使用了正确的工具调用 parser 和 chat
    template。例如，vLLM 文档建议对 Qwen2.5
    模型使用 `hermes`，对 Qwen3-Coder 模型使用 `qwen3_xml`。

    症状包括：

    - Skills 或工具从未执行
    - assistant 打印原始 JSON / XML，例如 `{"name":"read","arguments":...}`
    - 当 OpenClaw 发送 `tool_choice: "auto"` 时，vLLM 返回空的
      `tool_calls` 数组

    一些 Qwen / vLLM 组合只有在请求使用 `tool_choice: "required"` 时才返回
    结构化工具调用。对于这些模型条目，请通过 `params.extra_body`
    强制设置兼容 OpenAI 的请求字段：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
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

    将 `Qwen-Qwen2.5-Coder-32B-Instruct` 替换为以下命令返回的精确 id：

    ```bash
    openclaw models list --provider vllm
    ```

    你也可以通过 CLI 应用同样的覆盖：

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    这是一个需要显式启用的兼容性变通方案。它会让带工具的每个模型轮次
    都必须调用工具，因此只应在一个专用的本地模型条目上使用，并且你能接受这种行为。
    不要把它作为所有 vLLM 模型的全局默认值，也不要使用一个盲目把任意
    assistant 文本转换为可执行工具调用的代理。

  </Accordion>

  <Accordion title="自定义 base URL">
    如果你的 vLLM 服务器运行在非默认主机或端口上，请在显式 provider 配置中设置 `baseUrl`：

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="首次响应很慢或远程服务器超时">
    对于大型本地模型、远程 LAN 主机或 tailnet 链路，请设置 provider 级请求超时：

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` 仅适用于 vLLM 模型 HTTP 请求，包括
    连接建立、响应头、响应体流式传输以及整个
    guarded-fetch 的中止。应优先调整它，而不是提高
    `agents.defaults.timeoutSeconds`，后者控制的是整个智能体运行。

  </Accordion>

  <Accordion title="服务器无法访问">
    检查 vLLM 服务器是否正在运行且可访问：

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    如果你看到连接错误，请确认主机、端口，以及 vLLM 是否以兼容 OpenAI 的服务器模式启动。
    对于显式的 loopback、LAN 或 Tailscale 端点，还请设置
    `models.providers.vllm.request.allowPrivateNetwork: true`；除非该 provider
    被显式信任，否则 provider 请求默认会阻止私有网络 URL。

  </Accordion>

  <Accordion title="请求出现鉴权错误">
    如果请求因鉴权错误失败，请设置与你服务器配置匹配的真实 `VLLM_API_KEY`，或在 `models.providers.vllm` 下显式配置该 provider。

    <Tip>
    如果你的 vLLM 服务器不强制鉴权，任何非空的 `VLLM_API_KEY` 值都可以作为 OpenClaw 的显式启用信号。
    </Tip>

  </Accordion>

  <Accordion title="未发现任何模型">
    自动发现要求同时满足：已设置 `VLLM_API_KEY`，并且**没有**显式的 `models.providers.vllm` 配置条目。如果你已手动定义该 provider，OpenClaw 会跳过发现，仅使用你声明的模型。
  </Accordion>

  <Accordion title="工具被渲染为原始文本">
    如果 Qwen 模型打印的是 JSON / XML 工具语法，而不是执行某个 Skill，
    请查看上面“高级配置”中的 Qwen 指南。常见修复方式是：

    - 用适合该模型的正确 parser / template 启动 vLLM
    - 用 `openclaw models list --provider vllm` 确认精确模型 id
    - 仅在 `tool_choice: "auto"` 仍返回空或纯文本工具调用时，才为特定模型添加专用的 `params.extra_body.tool_choice: "required"` 覆盖

  </Accordion>
</AccordionGroup>

<Warning>
更多帮助： [故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="OpenAI" href="/zh-CN/providers/openai" icon="bolt">
    原生 OpenAI provider 和兼容 OpenAI 路由行为。
  </Card>
  <Card title="OAuth 和鉴权" href="/zh-CN/gateway/authentication" icon="key">
    鉴权细节和凭证复用规则。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及其解决方法。
  </Card>
</CardGroup>
