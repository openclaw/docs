---
read_when:
    - 你想让 OpenClaw 对接本地 vLLM 服务器运行
    - 你想要使用自己的模型提供 OpenAI 兼容的 /v1 端点
summary: 使用 vLLM 运行 OpenClaw（兼容 OpenAI 的本地服务器）
title: vLLM
x-i18n:
    generated_at: "2026-07-05T11:39:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM 通过 **OpenAI 兼容**的 HTTP API 提供开源模型（以及一些自定义模型）。OpenClaw 使用 `openai-completions` API 连接，并且在你通过 `VLLM_API_KEY` 选择启用时，可以**自动发现**模型。

| 属性             | 值                                         |
| ---------------- | ------------------------------------------ |
| 提供商 ID        | `vllm`                                     |
| API              | `openai-completions`（OpenAI 兼容）        |
| 凭证             | `VLLM_API_KEY` 环境变量                    |
| 默认 base URL    | `http://127.0.0.1:8000/v1`                 |
| 流式传输用量     | 支持（`stream_options.include_usage`）     |

## 入门指南

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    你的 base URL 必须公开 `/v1` 端点（`/v1/models`、`/v1/chat/completions`）。vLLM 通常运行在：

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    如果你的服务器不强制执行凭证校验，任何非空值都可以使用：

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

<Tip>
对于非交互式设置（CI、脚本），直接传入 base URL、密钥和模型：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## 模型发现（隐式提供商）

当设置了 `VLLM_API_KEY`（或存在凭证配置文件）且未定义 `models.providers.vllm` 时，OpenClaw 会查询 `GET http://127.0.0.1:8000/v1/models`，并将返回的 ID 转换为模型条目。

<Note>
如果你显式设置了 `models.providers.vllm`，OpenClaw 只会使用你声明的模型。将 `"vllm/*": {}` 添加到 `agents.defaults.models`，让 OpenClaw 也查询该已配置提供商的 `/models` 端点，并包含所有公布的 vLLM 模型。
</Note>

## 显式配置

当 vLLM 运行在不同主机或端口、你想固定 `contextWindow`/`maxTokens`、你的服务器需要真实 API 密钥，或你连接到受信任的 loopback、LAN 或 Tailscale 端点时，请显式配置：

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

若要在不列出每个模型的情况下保持提供商动态，请向可见模型目录添加通配符：

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    vLLM 被视为代理风格的 OpenAI 兼容 `/v1` 后端，而不是原生 OpenAI 端点：

    | 行为                                    | 是否应用                         |
    | --------------------------------------- | -------------------------------- |
    | 原生 OpenAI 请求整形                    | 否                               |
    | `service_tier`                          | 不发送                           |
    | Responses `store`                       | 不发送                           |
    | 提示缓存提示                            | 不发送                           |
    | OpenAI reasoning 兼容载荷整形           | 不应用                           |
    | 隐藏的 OpenClaw 归因标头                | 不会注入到自定义 base URL        |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    对于 Qwen 模型，当服务器需要 Qwen chat-template kwargs 时，请在模型行上设置 `compat.thinkingFormat: "qwen-chat-template"`。这些模型公开二元 `/think` 配置（`off`、`on`），因为 Qwen chat-template thinking 是开/关标志，而不是 OpenAI 风格的 effort 阶梯。

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw 将 `/think off` 映射为：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    非 `off` 的 thinking 级别会发送 `enable_thinking: true`。如果你的端点需要 DashScope 风格的顶层标志，请改用 `compat.thinkingFormat: "qwen"`，以便在请求根级别发送 `enable_thinking`。

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    对于关闭 thinking 的 `vllm/nemotron-3-*` 模型，内置插件会发送：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    若要自定义这些值，请在模型参数下设置 `chat_template_kwargs`。如果你还设置了 `params.extra_body.chat_template_kwargs`，该值会优先，因为 `extra_body` 是最后的请求体覆盖项。

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

  <Accordion title="Qwen tool calls appear as text">
    首先确认 vLLM 启动时使用了适合该模型的正确工具调用解析器和聊天模板。vLLM 文档中，Qwen2.5 模型使用 `hermes`，Qwen3-Coder 模型使用 `qwen3_xml`。

    症状：Skills/工具从不运行，助手打印原始 JSON/XML，例如 `{"name":"read","arguments":...}`，或者当 OpenClaw 发送 `tool_choice: "auto"` 时，vLLM 返回空的 `tool_calls` 数组。

    某些 Qwen/vLLM 组合只有在请求使用 `tool_choice: "required"` 时才返回结构化工具调用。使用 `params.extra_body` 按模型强制设置：

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

    将模型 ID 替换为 `openclaw models list --provider vllm` 中的确切 ID，或者从 CLI 应用相同覆盖：

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    这是一个选择启用的变通方案：它会强制每个带工具的轮次都进行工具调用，因此只应在专用模型条目中使用，并且该行为需要是可接受的。不要将它设置为所有 vLLM 模型的全局默认值，也不要将它与会把任意助手文本转换为可执行工具调用的代理配对使用。

  </Accordion>

  <Accordion title="Custom base URL">
    如果你的 vLLM 服务器运行在非默认主机或端口，请在显式提供商配置中设置 `baseUrl`：

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
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

## 故障排查

<AccordionGroup>
  <Accordion title="Slow first response or remote server timeout">
    对于大型本地模型、远程 LAN 主机或 tailnet 链路，请设置提供商作用域的请求超时：

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` 仅适用于 vLLM 模型 HTTP 请求：连接建立、响应标头、正文流式传输，以及总的 guarded-fetch 中止。它还会把此提供商的 LLM 空闲/流式传输 watchdog 上限提高到隐式的约 120 秒默认值以上。优先使用它，而不是增加 `agents.defaults.timeoutSeconds`，后者控制整个智能体运行。

  </Accordion>

  <Accordion title="Server not reachable">
    检查 vLLM 服务器是否正在运行且可访问：

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    如果看到连接错误，请验证主机、端口，以及 vLLM 是否以 OpenAI 兼容服务器模式启动。对于 loopback、LAN 和 Tailscale 端点上的受保护模型请求，OpenClaw 信任精确配置的 `models.providers.vllm.baseUrl` 来源。元数据/link-local 来源在没有显式选择启用时仍会被阻止。仅当 vLLM 请求必须访问另一个私有来源时，才设置 `models.providers.vllm.request.allowPrivateNetwork: true`；或者设置为 `false` 以退出精确来源信任。

  </Accordion>

  <Accordion title="Auth errors on requests">
    如果请求因凭证错误失败，请设置与你的服务器配置匹配的真实 `VLLM_API_KEY`，或者在 `models.providers.vllm` 下显式配置该提供商。

    <Tip>
    如果你的 vLLM 服务器不强制执行凭证校验，`VLLM_API_KEY` 的任何非空值都可作为 OpenClaw 的选择启用信号。
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    自动发现要求设置 `VLLM_API_KEY`。如果你已定义 `models.providers.vllm`，OpenClaw 只会使用你声明的模型，除非 `agents.defaults.models` 包含 `"vllm/*": {}`。
  </Accordion>

  <Accordion title="Tools render as raw text">
    如果 Qwen 模型打印 JSON/XML 工具语法，而不是执行 skill：

    - 使用该模型对应的正确解析器/模板启动 vLLM。
    - 使用 `openclaw models list --provider vllm` 确认确切模型 ID。
    - 仅当 `tool_choice: "auto"` 仍返回空工具调用或纯文本工具调用时，才添加专用的按模型 `params.extra_body.tool_choice: "required"` 覆盖。

  </Accordion>
</AccordionGroup>

<Warning>
更多帮助：[故障排查](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="OpenAI" href="/zh-CN/providers/openai" icon="bolt">
    原生 OpenAI provider 和 OpenAI 兼容路由行为。
  </Card>
  <Card title="OAuth and auth" href="/zh-CN/gateway/authentication" icon="key">
    凭证详细信息和凭据复用规则。
  </Card>
  <Card title="Troubleshooting" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及其解决方法。
  </Card>
</CardGroup>
