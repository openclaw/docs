---
read_when:
    - 你想使用本地 vLLM 服务器运行 OpenClaw
    - 你想要使用自己的模型提供 OpenAI 兼容的 /v1 端点
summary: 使用 vLLM 运行 OpenClaw（兼容 OpenAI 的本地服务器）
title: vLLM
x-i18n:
    generated_at: "2026-05-13T05:33:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b58fc0694fa9629ae87b6958d1ab39e484d468e6f92346f39f55316dbc09a04
    source_path: providers/vllm.md
    workflow: 16
---

vLLM 可以通过 **OpenAI 兼容** HTTP API 提供开源（以及一些自定义）模型。OpenClaw 使用 `openai-completions` API 连接到 vLLM。

当你选择启用 `VLLM_API_KEY` 时，OpenClaw 也可以从 vLLM **自动发现**可用模型（如果你的服务器不强制执行认证，则任意值都可以）。当你还配置了自定义 vLLM 基础 URL 时，在 `agents.defaults.models` 中使用 `vllm/*` 可保持发现动态化。

OpenClaw 将 `vllm` 视为支持流式使用量统计的本地 OpenAI 兼容提供商，因此状态/上下文 token 计数可以通过 `stream_options.include_usage` 响应更新。

| 属性             | 值                                       |
| ---------------- | ---------------------------------------- |
| 提供商 ID        | `vllm`                                   |
| API              | `openai-completions`（OpenAI 兼容）      |
| 凭证             | `VLLM_API_KEY` 环境变量                  |
| 默认基础 URL     | `http://127.0.0.1:8000/v1`               |

## 入门指南

<Steps>
  <Step title="启动带 OpenAI 兼容服务器的 vLLM">
    你的基础 URL 应公开 `/v1` 端点（例如 `/v1/models`、`/v1/chat/completions`）。vLLM 通常运行在：

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="设置 API key 环境变量">
    如果你的服务器不强制执行认证，则任意值都可以：

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
如果你显式设置了 `models.providers.vllm`，OpenClaw 默认使用你声明的模型。当你希望 OpenClaw 查询该已配置提供商的 `/models` 端点并包含所有公布的 vLLM 模型时，请将 `"vllm/*": {}` 添加到 `agents.defaults.models`。
</Note>

## 显式配置（手动模型）

在以下情况使用显式配置：

- vLLM 运行在不同的主机或端口
- 你想固定 `contextWindow` 或 `maxTokens` 值
- 你的服务器需要真实的 API key（或你想控制请求头）
- 你连接到受信任的 loopback、LAN 或 Tailscale vLLM 端点

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
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

若要让此提供商保持动态，而无需手动列出每个模型，请向可见模型目录添加提供商通配符：

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
  <Accordion title="代理式行为">
    vLLM 被视为代理式 OpenAI 兼容 `/v1` 后端，而不是原生 OpenAI 端点。这意味着：

    | 行为 | 是否应用？ |
    |----------|----------|
    | 原生 OpenAI 请求塑形 | 否 |
    | `service_tier` | 不发送 |
    | Responses `store` | 不发送 |
    | Prompt-cache 提示 | 不发送 |
    | OpenAI 推理兼容载荷塑形 | 不应用 |
    | 隐藏 OpenClaw 归因请求头 | 不注入到自定义基础 URL |

  </Accordion>

  <Accordion title="Qwen thinking 控制">
    对于通过 vLLM 提供的 Qwen 模型，当服务器期望 Qwen chat-template kwargs 时，请在模型条目上设置 `params.qwenThinkingFormat: "chat-template"`。OpenClaw 会将 `/think off` 映射为：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    非 `off` thinking 级别会发送 `enable_thinking: true`。如果你的端点改为期望 DashScope 风格的顶层标志，请使用 `params.qwenThinkingFormat: "top-level"` 在请求根部发送 `enable_thinking`。也接受 snake-case `params.qwen_thinking_format`。

  </Accordion>

  <Accordion title="Nemotron 3 thinking 控制">
    vLLM/Nemotron 3 可以使用 chat-template kwargs 控制推理是作为隐藏推理返回，还是作为可见答案文本返回。当 OpenClaw 会话在关闭 thinking 时使用 `vllm/nemotron-3-*`，内置 vLLM 插件会发送：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    若要自定义这些值，请在模型 params 下设置 `chat_template_kwargs`。如果你也设置了 `params.extra_body.chat_template_kwargs`，该值具有最终优先级，因为 `extra_body` 是最后的请求体覆盖项。

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

  <Accordion title="Qwen tool calls 显示为文本">
    首先确保 vLLM 已使用适合该模型的正确 tool-call 解析器和 chat template 启动。例如，vLLM 文档说明 Qwen2.5 模型使用 `hermes`，Qwen3-Coder 模型使用 `qwen3_xml`。

    症状：

    - skills 或工具从不运行
    - assistant 打印原始 JSON/XML，例如 `{"name":"read","arguments":...}`
    - 当 OpenClaw 发送 `tool_choice: "auto"` 时，vLLM 返回空的 `tool_calls` 数组

    某些 Qwen/vLLM 组合仅在请求使用 `tool_choice: "required"` 时返回结构化 tool calls。对于这些模型条目，请使用 `params.extra_body` 强制设置 OpenAI 兼容请求字段：

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

    将 `Qwen-Qwen2.5-Coder-32B-Instruct` 替换为以下命令返回的确切 ID：

    ```bash
    openclaw models list --provider vllm
    ```

    你也可以从 CLI 应用相同覆盖：

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    这是一个需要选择启用的兼容性规避方案。它会让带工具的每个模型轮次都需要一次 tool call，因此只应在专用本地模型条目上使用，前提是该行为可以接受。不要将它用作所有 vLLM 模型的全局默认值，也不要使用会盲目将任意 assistant 文本转换为可执行 tool calls 的代理。

  </Accordion>

  <Accordion title="自定义基础 URL">
    如果你的 vLLM 服务器运行在非默认主机或端口，请在显式提供商配置中设置 `baseUrl`：

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
    对于大型本地模型、远程 LAN 主机或 tailnet 链接，请设置提供商级请求超时：

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

    `timeoutSeconds` 仅适用于 vLLM 模型 HTTP 请求，包括连接建立、响应头、响应体流式传输以及总 guarded-fetch 中止。请优先使用它，再考虑增加 `agents.defaults.timeoutSeconds`，后者控制整个 agent 运行。

  </Accordion>

  <Accordion title="无法访问服务器">
    检查 vLLM 服务器是否正在运行且可访问：

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    如果你看到连接错误，请验证主机、端口，以及 vLLM 是否以 OpenAI 兼容服务器模式启动。
    对于显式 loopback、LAN 或 Tailscale 端点，还要设置 `models.providers.vllm.request.allowPrivateNetwork: true`；除非显式信任该提供商，否则提供商请求默认会阻止私有网络 URL。

  </Accordion>

  <Accordion title="请求出现认证错误">
    如果请求因认证错误失败，请设置与你服务器配置匹配的真实 `VLLM_API_KEY`，或在 `models.providers.vllm` 下显式配置提供商。

    <Tip>
    如果你的 vLLM 服务器不强制执行认证，`VLLM_API_KEY` 的任何非空值都可作为 OpenClaw 的选择启用信号。
    </Tip>

  </Accordion>

  <Accordion title="未发现模型">
    自动发现要求设置 `VLLM_API_KEY`。如果你已定义 `models.providers.vllm`，除非 `agents.defaults.models` 包含 `"vllm/*": {}`，否则 OpenClaw 只使用你声明的模型。
  </Accordion>

  <Accordion title="工具渲染为原始文本">
    如果 Qwen 模型打印 JSON/XML 工具语法，而不是执行 skill，请查看上方高级配置中的 Qwen 指南。通常的修复方法是：

    - 使用该模型的正确解析器/模板启动 vLLM
    - 使用 `openclaw models list --provider vllm` 确认确切模型 ID
    - 仅当 `tool_choice: "auto"` 仍返回空的或纯文本 tool calls 时，才添加专用的按模型 `params.extra_body.tool_choice: "required"` 覆盖

  </Accordion>
</AccordionGroup>

<Warning>
更多帮助：[故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Warning>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="OpenAI" href="/zh-CN/providers/openai" icon="bolt">
    原生 OpenAI provider 和 OpenAI 兼容路由行为。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证详情和凭据复用规则。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及其解决方法。
  </Card>
</CardGroup>
