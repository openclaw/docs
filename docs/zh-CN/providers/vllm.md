---
read_when:
    - 你想让 OpenClaw 连接本地 vLLM 服务器运行
    - 你想使用自己的模型并提供兼容 OpenAI 的 `/v1` 端点
summary: 使用 vLLM（兼容 OpenAI 的本地服务器）运行 OpenClaw
title: vLLM
x-i18n:
    generated_at: "2026-04-27T11:01:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a4a31ec0c3b1da4ebf811759b0b6a52f02cb248282e312f02095b1c0bdb39e5
    source_path: providers/vllm.md
    workflow: 15
---

vLLM 可以通过 **兼容 OpenAI 的** HTTP API 提供开源模型（以及部分自定义模型）。OpenClaw 使用 `openai-completions` API 连接到 vLLM。

当你选择启用 `VLLM_API_KEY`（如果你的服务器不强制认证，任意值都可用），并且没有定义显式的 `models.providers.vllm` 条目时，OpenClaw 还可以从 vLLM **自动发现**可用模型。

OpenClaw 将 `vllm` 视为一个本地的、兼容 OpenAI 的提供商，并支持
流式 usage 统计，因此状态/上下文令牌计数可以根据
`stream_options.include_usage` 响应更新。

| 属性         | 值                                    |
| ---------------- | ---------------------------------------- |
| 提供商 ID      | `vllm`                                   |
| API              | `openai-completions`（兼容 OpenAI） |
| 认证             | `VLLM_API_KEY` 环境变量      |
| 默认 base URL | `http://127.0.0.1:8000/v1`               |

## 入门指南

<Steps>
  <Step title="使用兼容 OpenAI 的服务器启动 vLLM">
    你的 base URL 应暴露 `/v1` 端点（例如 `/v1/models`、`/v1/chat/completions`）。vLLM 通常运行在：

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="设置 API 密钥环境变量">
    如果你的服务器不强制认证，任意值都可用：

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
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## 模型发现（隐式提供商）

当设置了 `VLLM_API_KEY`（或存在认证配置文件），并且你**没有**定义 `models.providers.vllm` 时，OpenClaw 会查询：

```
GET http://127.0.0.1:8000/v1/models
```

并将返回的 ID 转换为模型条目。

<Note>
如果你显式设置了 `models.providers.vllm`，则会跳过自动发现，你必须手动定义模型。
</Note>

## 显式配置（手动模型）

在以下情况下请使用显式配置：

- vLLM 运行在不同的主机或端口上
- 你想固定 `contextWindow` 或 `maxTokens` 值
- 你的服务器需要真实的 API 密钥（或者你想控制请求头）
- 你要连接到受信任的 loopback、LAN 或 Tailscale vLLM 端点

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // 可选：为较慢的本地模型延长连接/请求头/响应体/请求超时时间
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
    vLLM 被视为代理式的兼容 OpenAI `/v1` 后端，而不是原生
    OpenAI 端点。这意味着：

    | 行为 | 是否应用？ |
    |----------|----------|
    | 原生 OpenAI 请求整形 | 否 |
    | `service_tier` | 不发送 |
    | 响应 `store` | 不发送 |
    | 提示缓存提示 | 不发送 |
    | OpenAI reasoning 兼容载荷整形 | 不应用 |
    | 隐藏的 OpenClaw 归因请求头 | 在自定义 base URL 上不注入 |

  </Accordion>

  <Accordion title="Qwen thinking 控制">
    对于通过 vLLM 提供的 Qwen 模型，当服务器
    期望使用 Qwen chat-template kwargs 时，请在模型条目上设置
    `params.qwenThinkingFormat: "chat-template"`。OpenClaw 会将 `/think off` 映射为：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    非 `off` 的 thinking 级别会发送 `enable_thinking: true`。如果你的端点
    期望的是 DashScope 风格的顶层标志，请改用
    `params.qwenThinkingFormat: "top-level"`，以便在
    请求根级发送 `enable_thinking`。同时也接受蛇形命名的 `params.qwen_thinking_format`。

  </Accordion>

  <Accordion title="Nemotron 3 thinking 控制">
    vLLM/Nemotron 3 可以使用 chat-template kwargs 来控制是否将 reasoning
    作为隐藏 reasoning 或可见答案文本返回。当 OpenClaw 会话
    使用 `vllm/nemotron-3-*` 且 thinking 关闭时，OpenClaw 会发送：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    如需自定义这些值，请在模型 params 下设置 `chat_template_kwargs`。
    如果你还设置了 `params.extra_body.chat_template_kwargs`，该值将具有
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
    首先请确认 vLLM 启动时为该模型使用了正确的工具调用解析器和 chat
    template。例如，vLLM 文档建议对 Qwen2.5
    模型使用 `hermes`，对 Qwen3-Coder 模型使用 `qwen3_xml`。

    症状包括：

    - Skills 或工具从不运行
    - 智能体输出原始 JSON/XML，例如 `{"name":"read","arguments":...}`
    - 当 OpenClaw 发送
      `tool_choice: "auto"` 时，vLLM 返回空的 `tool_calls` 数组

    某些 Qwen/vLLM 组合只有在
    请求使用 `tool_choice: "required"` 时才会返回结构化工具调用。对于这些模型条目，请通过 `params.extra_body`
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

    请将 `Qwen-Qwen2.5-Coder-32B-Instruct` 替换为以下命令返回的精确 id：

    ```bash
    openclaw models list --provider vllm
    ```

    你也可以通过 CLI 应用同样的覆盖：

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    这是一个可选启用的兼容性变通方案。它会让每一轮带工具的模型调用
    都必须进行一次工具调用，因此只应在该行为可接受的专用本地模型条目上使用。
    不要将其作为所有
    vLLM 模型的全局默认值，也不要使用会盲目将任意
    智能体文本转换为可执行工具调用的代理。

  </Accordion>

  <Accordion title="自定义 base URL">
    如果你的 vLLM 服务器运行在非默认主机或端口上，请在显式提供商配置中设置 `baseUrl`：

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
  <Accordion title="首次响应缓慢或远程服务器超时">
    对于大型本地模型、远程 LAN 主机或 tailnet 链路，请设置
    提供商作用域的请求超时：

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
    建立连接、响应头、响应体流式传输以及总的
    guarded-fetch 中止。应优先调整它，而不是增加
    `agents.defaults.timeoutSeconds`，后者控制整个智能体运行。

  </Accordion>

  <Accordion title="无法连接到服务器">
    检查 vLLM 服务器是否正在运行且可访问：

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    如果你看到连接错误，请确认主机、端口，以及 vLLM 是否以兼容 OpenAI 的服务器模式启动。
    对于显式的 loopback、LAN 或 Tailscale 端点，还需要设置
    `models.providers.vllm.request.allowPrivateNetwork: true`；默认情况下，提供商
    请求会阻止私有网络 URL，除非该提供商
    被显式标记为受信任。

  </Accordion>

  <Accordion title="请求出现认证错误">
    如果请求因认证错误而失败，请设置与你服务器配置匹配的真实 `VLLM_API_KEY`，或在 `models.providers.vllm` 下显式配置该提供商。

    <Tip>
    如果你的 vLLM 服务器不强制认证，任何非空的 `VLLM_API_KEY` 值都可作为 OpenClaw 的启用信号。
    </Tip>

  </Accordion>

  <Accordion title="未发现任何模型">
    自动发现要求设置 `VLLM_API_KEY`，**并且**没有显式的 `models.providers.vllm` 配置项。如果你已手动定义该提供商，OpenClaw 会跳过发现，只使用你声明的模型。
  </Accordion>

  <Accordion title="工具被渲染为原始文本">
    如果某个 Qwen 模型输出 JSON/XML 工具语法而不是执行 Skills，
    请查看上方“高级配置”中的 Qwen 指引。通常的解决方法是：

    - 使用适合该模型的正确 parser/template 启动 vLLM
    - 通过 `openclaw models list --provider vllm` 确认精确模型 id
    - 仅在 `tool_choice: "auto"` 仍返回空结果或纯文本
      工具调用时，才为该模型添加专用的 `params.extra_body.tool_choice: "required"`
      覆盖

  </Accordion>
</AccordionGroup>

<Warning>
更多帮助： [故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="OpenAI" href="/zh-CN/providers/openai" icon="bolt">
    原生 OpenAI provider 和兼容 OpenAI 的路由行为。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭证复用规则。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及其解决方法。
  </Card>
</CardGroup>
