---
read_when:
    - 你想让 OpenClaw 连接到本地 vLLM 服务器运行
    - 你希望使用与 OpenAI 兼容的 `/v1` 端点以及你自己的模型
summary: 使用 vLLM（与 OpenAI 兼容的本地服务器）运行 OpenClaw
title: vLLM
x-i18n:
    generated_at: "2026-04-27T09:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94609d49afd6490cb79564699e208666280e6913c40e9a01ff5925e253711aa2
    source_path: providers/vllm.md
    workflow: 15
---

vLLM 可以通过 **与 OpenAI 兼容的** HTTP API 提供开源模型（以及一些自定义模型）。OpenClaw 使用 `openai-completions` API 连接到 vLLM。

当你通过 `VLLM_API_KEY` 选择启用，且未定义显式的 `models.providers.vllm` 条目时，OpenClaw 还可以从 vLLM **自动发现** 可用模型（如果你的服务器不强制认证，任意值都可用）。

OpenClaw 将 `vllm` 视为支持流式用量统计的本地 OpenAI-compatible 提供商，因此状态/上下文令牌计数可以根据 `stream_options.include_usage` 响应进行更新。

| 属性 | 值 |
| ---------------- | ---------------------------------------- |
| 提供商 ID | `vllm` |
| API | `openai-completions`（与 OpenAI 兼容） |
| 认证 | `VLLM_API_KEY` 环境变量 |
| 默认 base URL | `http://127.0.0.1:8000/v1` |

## 入门指南

<Steps>
  <Step title="使用与 OpenAI 兼容的服务器启动 vLLM">
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
  <Step title="选择模型">
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

在以下情况下使用显式配置：

- vLLM 运行在不同的主机或端口上
- 你想固定 `contextWindow` 或 `maxTokens` 值
- 你的服务器需要真实的 API 密钥（或者你想控制请求头）
- 你要连接到受信任的回环、本地局域网或 Tailscale vLLM 端点

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // 可选：为较慢的本地模型延长连接/响应头/响应体/请求超时
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
    vLLM 被视为代理式的、与 OpenAI 兼容的 `/v1` 后端，而不是原生
    OpenAI 端点。这意味着：

    | 行为 | 是否应用？ |
    |----------|----------|
    | 原生 OpenAI 请求整形 | 否 |
    | `service_tier` | 不发送 |
    | 响应 `store` | 不发送 |
    | 提示缓存提示 | 不发送 |
    | OpenAI reasoning 兼容负载整形 | 不应用 |
    | 隐藏的 OpenClaw 归属请求头 | 不会注入到自定义 base URL |

  </Accordion>

  <Accordion title="Nemotron 3 thinking 控制">
    vLLM/Nemotron 3 可以使用聊天模板 kwargs 来控制是将推理作为隐藏推理返回，还是作为可见答案文本返回。当 OpenClaw 会话
    在关闭 thinking 的情况下使用 `vllm/nemotron-3-*` 时，OpenClaw 会发送：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    要自定义这些值，请在模型参数下设置 `chat_template_kwargs`。
    如果你还设置了 `params.extra_body.chat_template_kwargs`，该值会拥有
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
    首先请确认 vLLM 在启动时为该模型使用了正确的工具调用解析器和聊天模板。例如，vLLM 文档对 Qwen2.5
    模型使用 `hermes`，对 Qwen3-Coder 模型使用 `qwen3_xml`。

    症状：

    - Skills 或工具始终不会运行
    - 助手打印原始 JSON/XML，例如 `{"name":"read","arguments":...}`
    - 当 OpenClaw 发送
      `tool_choice: "auto"` 时，vLLM 返回空的 `tool_calls` 数组

    某些 Qwen/vLLM 组合仅在请求使用 `tool_choice: "required"` 时返回结构化工具调用。对于这些模型条目，请使用 `params.extra_body` 强制设置
    与 OpenAI 兼容的请求字段：

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

    将 `Qwen-Qwen2.5-Coder-32B-Instruct` 替换为以下命令返回的精确 ID：

    ```bash
    openclaw models list --provider vllm
    ```

    你也可以通过 CLI 应用相同的覆盖：

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    这是一个需显式启用的兼容性变通方案。它会让每个带工具的模型轮次
    都要求进行工具调用，因此只应将其用于这种行为可接受的专用本地模型条目。
    不要将其作为所有
    vLLM 模型的全局默认设置，也不要使用会盲目将任意
    助手文本转换为可执行工具调用的代理。

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
    对于大型本地模型、远程局域网主机或 tailnet 链路，请设置
    提供商级请求超时：

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
    连接建立、响应头、响应体流式传输，以及受保护获取的总中止时间。
    优先使用这个，而不是增加
    `agents.defaults.timeoutSeconds`，后者控制的是整个智能体运行。

  </Accordion>

  <Accordion title="无法连接到服务器">
    检查 vLLM 服务器是否正在运行且可访问：

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    如果你看到连接错误，请验证主机、端口，以及 vLLM 是否以与 OpenAI 兼容的服务器模式启动。
    对于显式的回环、本地局域网或 Tailscale 端点，还要设置
    `models.providers.vllm.request.allowPrivateNetwork: true`；除非提供商被
    显式信任，否则提供商请求默认会阻止私有网络 URL。

  </Accordion>

  <Accordion title="请求出现认证错误">
    如果请求因认证错误而失败，请设置与你的服务器配置匹配的真实 `VLLM_API_KEY`，或在 `models.providers.vllm` 下显式配置该提供商。

    <Tip>
    如果你的 vLLM 服务器不强制认证，那么任意非空的 `VLLM_API_KEY` 值都可以作为 OpenClaw 的显式启用信号。
    </Tip>

  </Accordion>

  <Accordion title="未发现任何模型">
    自动发现要求设置 `VLLM_API_KEY`，**并且**不存在显式的 `models.providers.vllm` 配置项。如果你已手动定义该提供商，OpenClaw 会跳过发现，只使用你声明的模型。
  </Accordion>

  <Accordion title="工具显示为原始文本">
    如果 Qwen 模型打印 JSON/XML 工具语法而不是执行某个 Skill，
    请查看上方“高级配置”中的 Qwen 指南。通常的修复方法是：

    - 使用适用于该模型的正确解析器/模板启动 vLLM
    - 使用 `openclaw models list --provider vllm` 确认精确模型 ID
    - 只有在 `tool_choice: "auto"` 仍返回空或纯文本
      工具调用时，才添加专用的按模型 `params.extra_body.tool_choice: "required"`
      覆盖项

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
    原生 OpenAI provider 和与 OpenAI 兼容的路由行为。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭证复用规则。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及其解决方法。
  </Card>
</CardGroup>
