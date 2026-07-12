---
read_when:
    - 你想让 OpenClaw 使用本地 vLLM 服务器运行
    - 你希望为自己的模型提供与 OpenAI 兼容的 /v1 端点
summary: 使用 vLLM（兼容 OpenAI 的本地服务器）运行 OpenClaw
title: vLLM
x-i18n:
    generated_at: "2026-07-11T20:55:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM 通过**兼容 OpenAI** 的 HTTP API 提供开源模型（以及部分自定义模型）。OpenClaw 使用 `openai-completions` API 进行连接，并可在你通过 `VLLM_API_KEY` 选择启用后**自动发现**模型。

| 属性             | 值                                         |
| ---------------- | ------------------------------------------ |
| 提供商 ID        | `vllm`                                     |
| API              | `openai-completions`（兼容 OpenAI）        |
| 身份验证         | `VLLM_API_KEY` 环境变量                    |
| 默认基础 URL     | `http://127.0.0.1:8000/v1`                 |
| 流式用量信息     | 支持（`stream_options.include_usage`）     |

## 入门指南

<Steps>
  <Step title="使用兼容 OpenAI 的服务器启动 vLLM">
    你的基础 URL 必须公开 `/v1` 端点（`/v1/models`、`/v1/chat/completions`）。vLLM 通常运行于：

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="设置 API 密钥环境变量">
    如果你的服务器不强制进行身份验证，可以使用任意非空值：

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="选择模型">
    将其替换为你的某个 vLLM 模型 ID：

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

<Tip>
对于非交互式设置（CI、脚本），请直接传入基础 URL、密钥和模型：

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

当已设置 `VLLM_API_KEY`（或存在身份验证配置文件），且**未**定义 `models.providers.vllm` 时，OpenClaw 会查询 `GET http://127.0.0.1:8000/v1/models`，并将返回的 ID 转换为模型条目。

<Note>
如果你显式设置了 `models.providers.vllm`，OpenClaw 将仅使用你声明的模型。将 `"vllm/*": {}` 添加到 `agents.defaults.models`，可让 OpenClaw 同时查询该已配置提供商的 `/models` 端点，并包含其公布的所有 vLLM 模型。
</Note>

## 显式配置

当 vLLM 运行在其他主机或端口、你希望固定 `contextWindow`/`maxTokens`、服务器要求真实 API 密钥，或你需要连接到受信任的环回、局域网或 Tailscale 端点时，请进行显式配置：

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

若要保持提供商动态发现能力，而不逐一列出所有模型，请向可见模型目录添加通配符：

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
    vLLM 被视为代理式、兼容 OpenAI 的 `/v1` 后端，而非原生 OpenAI 端点：

    | 行为                                      | 是否应用                         |
    | ----------------------------------------- | -------------------------------- |
    | 原生 OpenAI 请求整形                      | 否                               |
    | `service_tier`                            | 不发送                           |
    | Responses `store`                         | 不发送                           |
    | 提示词缓存提示                            | 不发送                           |
    | OpenAI 推理兼容载荷整形                   | 不应用                           |
    | 隐藏的 OpenClaw 归属标头                  | 不注入自定义基础 URL             |

  </Accordion>

  <Accordion title="Qwen 思考控制">
    对于 Qwen 模型，当服务器要求 Qwen 聊天模板关键字参数时，请在模型条目上设置 `compat.thinkingFormat: "qwen-chat-template"`。这些模型提供二元 `/think` 配置（`off`、`on`），因为 Qwen 聊天模板的思考功能是开关标志，而不是 OpenAI 风格的强度阶梯。

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

    非 `off` 的思考级别会发送 `enable_thinking: true`。如果你的端点要求 DashScope 风格的顶层标志，请改用 `compat.thinkingFormat: "qwen"`，在请求根级别发送 `enable_thinking`。

  </Accordion>

  <Accordion title="Nemotron 3 思考控制">
    对于关闭思考功能的 `vllm/nemotron-3-*` 模型，内置插件会发送：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    若要自定义这些值，请在模型参数下设置 `chat_template_kwargs`。如果你还设置了 `params.extra_body.chat_template_kwargs`，将优先使用该值，因为 `extra_body` 是最后应用的请求正文覆盖项。

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
    首先确认 vLLM 已使用适合该模型的工具调用解析器和聊天模板启动。vLLM 文档为 Qwen2.5 模型指定 `hermes`，为 Qwen3-Coder 模型指定 `qwen3_xml`。

    表现包括：Skills/工具从未运行、助手输出 `{"name":"read","arguments":...}` 等原始 JSON/XML，或 OpenClaw 发送 `tool_choice: "auto"` 时，vLLM 返回空的 `tool_calls` 数组。

    某些 Qwen/vLLM 组合仅在请求使用 `tool_choice: "required"` 时返回结构化工具调用。可通过 `params.extra_body` 为每个模型强制启用：

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

    请将模型 ID 替换为 `openclaw models list --provider vllm` 返回的确切 ID，或通过 CLI 应用相同的覆盖设置：

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    这是一种选择启用的临时解决方案：它会强制每个包含工具的轮次都进行工具调用，因此只能用于允许此行为的专用模型条目。不要将其设为所有 vLLM 模型的全局默认值，也不要将其与会把任意助手文本转换为可执行工具调用的代理配合使用。

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
  <Accordion title="首次响应缓慢或远程服务器超时">
    对于大型本地模型、远程局域网主机或 tailnet 链路，请设置提供商范围的请求超时：

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

    `timeoutSeconds` 仅适用于 vLLM 模型 HTTP 请求：连接建立、响应标头、正文流式传输以及受保护提取操作的总中止时间。它还会将此提供商的 LLM 空闲/流式传输看门狗上限提高到隐式默认值约 120 秒以上。建议使用此设置，而不是增大控制整个智能体运行时间的 `agents.defaults.timeoutSeconds`。

  </Accordion>

  <Accordion title="无法访问服务器">
    检查 vLLM 服务器是否正在运行且可访问：

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    如果出现连接错误，请验证主机、端口，并确认 vLLM 已使用兼容 OpenAI 的服务器模式启动。对于环回、局域网和 Tailscale 端点上的受保护模型请求，OpenClaw 信任已配置的确切 `models.providers.vllm.baseUrl` 来源。如果未显式选择启用，元数据/链路本地来源仍会被阻止。仅当 vLLM 请求必须访问其他私有来源时，才设置 `models.providers.vllm.request.allowPrivateNetwork: true`；若要停用精确来源信任，请设置为 `false`。

  </Accordion>

  <Accordion title="请求出现身份验证错误">
    如果请求因身份验证错误而失败，请设置与服务器配置匹配的真实 `VLLM_API_KEY`，或在 `models.providers.vllm` 下显式配置提供商。

    <Tip>
    如果你的 vLLM 服务器不强制进行身份验证，可以使用任意非空的 `VLLM_API_KEY` 值作为 OpenClaw 的选择启用信号。
    </Tip>

  </Accordion>

  <Accordion title="未发现模型">
    自动发现要求设置 `VLLM_API_KEY`。如果你已定义 `models.providers.vllm`，除非 `agents.defaults.models` 包含 `"vllm/*": {}`，否则 OpenClaw 只使用你声明的模型。
  </Accordion>

  <Accordion title="工具呈现为原始文本">
    如果 Qwen 模型输出 JSON/XML 工具语法而不是执行 Skill：

    - 使用适合该模型的正确解析器/模板启动 vLLM。
    - 使用 `openclaw models list --provider vllm` 确认确切的模型 ID。
    - 仅当 `tool_choice: "auto"` 仍返回空调用或纯文本工具调用时，才添加专用于该模型的 `params.extra_body.tool_choice: "required"` 覆盖设置。

  </Accordion>
</AccordionGroup>

<Warning>
更多帮助：[故障排查](/zh-CN/help/troubleshooting)和[常见问题](/zh-CN/help/faq)。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="OpenAI" href="/zh-CN/providers/openai" icon="bolt">
    原生 OpenAI provider 和兼容 OpenAI 的路由行为。
  </Card>
  <Card title="OAuth 和身份验证" href="/zh-CN/gateway/authentication" icon="key">
    身份验证详情和凭据复用规则。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及其解决方法。
  </Card>
</CardGroup>
