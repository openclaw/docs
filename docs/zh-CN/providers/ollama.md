---
read_when:
    - 你想通过 Ollama 使用云端或本地模型来运行 OpenClaw
    - 你需要 Ollama 的设置和配置指南
    - 你想使用 Ollama 视觉模型来进行图像理解
summary: 使用 Ollama（云端和本地模型）运行 OpenClaw
title: Ollama
x-i18n:
    generated_at: "2026-04-27T04:34:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: afb9ecca376bb6522eacb195e6c0c590029e3deb9e2f673505008cdc86883800
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw 与 Ollama 的原生 API（`/api/chat`）集成，可用于托管云模型以及本地/自托管的 Ollama 服务器。你可以通过三种模式使用 Ollama：通过可访问的 Ollama 主机实现的 `Cloud + Local`、指向 `https://ollama.com` 的 `Cloud only`，或指向可访问 Ollama 主机的 `Local only`。

<Warning>
**远程 Ollama 用户**：不要在 OpenClaw 中使用 `/v1` OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，模型还可能将原始工具 JSON 作为纯文本输出。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不要带 `/v1`）。
</Warning>

Ollama provider 配置使用 `baseUrl` 作为规范键名。OpenClaw 也接受 `baseURL`，以兼容 OpenAI SDK 风格的示例，但新配置应优先使用 `baseUrl`。

## 认证规则

<AccordionGroup>
  <Accordion title="本地和局域网主机">
    本地和局域网 Ollama 主机不需要真实的 bearer token。OpenClaw 仅对 loopback、私有网络、`.local` 和裸主机名的 Ollama base URL 使用本地 `ollama-local` 标记。
  </Accordion>
  <Accordion title="远程和 Ollama Cloud 主机">
    远程公网主机和 Ollama Cloud（`https://ollama.com`）需要通过 `OLLAMA_API_KEY`、认证配置文件或 provider 的 `apiKey` 提供真实凭证。
  </Accordion>
  <Accordion title="自定义 provider id">
    将 `api: "ollama"` 设为自定义 provider id 时，遵循相同规则。例如，指向私有局域网 Ollama 主机的 `ollama-remote` provider 可以使用 `apiKey: "ollama-local"`，子智能体会通过 Ollama provider hook 解析该标记，而不是将其视为缺失凭证。
  </Accordion>
  <Accordion title="Memory 嵌入作用域">
    当 Ollama 用于 Memory 嵌入时，bearer 认证会限定在声明它的主机范围内：

    - provider 级密钥只会发送到该 provider 的 Ollama 主机。
    - `agents.*.memorySearch.remote.apiKey` 只会发送到它的远程嵌入主机。
    - 纯 `OLLAMA_API_KEY` 环境变量值会被视为 Ollama Cloud 约定，默认不会发送到本地或自托管主机。

  </Accordion>
</AccordionGroup>

## 入门指南

选择你偏好的设置方法和模式。

<Tabs>
  <Tab title="新手引导（推荐）">
    **最适合：** 以最快路径完成可用的 Ollama 云端或本地设置。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        ```

        从 provider 列表中选择 **Ollama**。
      </Step>
      <Step title="选择你的模式">
        - **Cloud + Local** — 本地 Ollama 主机加上通过该主机路由的云模型
        - **Cloud only** — 通过 `https://ollama.com` 使用托管 Ollama 模型
        - **Local only** — 仅使用本地模型
      </Step>
      <Step title="选择模型">
        `Cloud only` 会提示输入 `OLLAMA_API_KEY`，并推荐托管云默认模型。`Cloud + Local` 和 `Local only` 会要求提供 Ollama base URL、发现可用模型，并在所选本地模型尚不可用时自动拉取。`Cloud + Local` 还会检查该 Ollama 主机是否已登录以启用云访问。
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### 非交互模式

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    你也可以指定自定义 base URL 或模型：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手动设置">
    **最适合：** 完全控制云端或本地设置。

    <Steps>
      <Step title="选择云端或本地">
        - **Cloud + Local**：安装 Ollama，使用 `ollama signin` 登录，并通过该主机路由云请求
        - **Cloud only**：配合 `OLLAMA_API_KEY` 使用 `https://ollama.com`
        - **Local only**：从 [ollama.com/download](https://ollama.com/download) 安装 Ollama
      </Step>
      <Step title="拉取本地模型（仅本地）">
        ```bash
        ollama pull gemma4
        # 或
        ollama pull gpt-oss:20b
        # 或
        ollama pull llama3.3
        ```
      </Step>
      <Step title="为 OpenClaw 启用 Ollama">
        对于 `Cloud only`，使用你真实的 `OLLAMA_API_KEY`。对于基于主机的设置，任意占位值都可以：

        ```bash
        # 云端
        export OLLAMA_API_KEY="your-ollama-api-key"

        # 仅本地
        export OLLAMA_API_KEY="ollama-local"

        # 或在你的配置文件中配置
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="查看并设置你的模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或在配置中设置默认值：

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 云模型

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` 使用可访问的 Ollama 主机作为本地模型和云模型的统一控制点。这是 Ollama 推荐的混合流程。

    在设置期间使用 **Cloud + Local**。OpenClaw 会提示输入 Ollama base URL，从该主机发现本地模型，并检查该主机是否已通过 `ollama signin` 登录以启用云访问。当主机已登录时，OpenClaw 还会推荐托管云默认模型，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`。

    如果主机尚未登录，OpenClaw 会将设置保持为仅本地模式，直到你运行 `ollama signin`。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` 通过 Ollama 的托管 API `https://ollama.com` 运行。

    在设置期间使用 **Cloud only**。OpenClaw 会提示输入 `OLLAMA_API_KEY`，设置 `baseUrl: "https://ollama.com"`，并初始化托管云模型列表。此路径**不**需要本地 Ollama 服务器或 `ollama signin`。

    `openclaw onboard` 中显示的云模型列表会通过 `https://ollama.com/api/tags` 实时获取，最多 500 项，因此选择器反映的是当前托管目录，而不是静态种子数据。如果设置时 `ollama.com` 不可访问或未返回模型，OpenClaw 会回退到之前的硬编码建议，以确保新手引导仍可完成。

  </Tab>

  <Tab title="Local only">
    在仅本地模式下，OpenClaw 会从已配置的 Ollama 实例中发现模型。此路径适用于本地或自托管的 Ollama 服务器。

    OpenClaw 当前推荐 `gemma4` 作为本地默认模型。

  </Tab>
</Tabs>

## 模型发现（隐式 provider）

当你设置了 `OLLAMA_API_KEY`（或认证配置文件）且**未**定义 `models.providers.ollama` 时，OpenClaw 会从位于 `http://127.0.0.1:11434` 的本地 Ollama 实例发现模型。

| 行为 | 详情 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询 | 查询 `/api/tags` |
| 能力检测 | 使用尽力而为的 `/api/show` 查找，以读取 `contextWindow`、展开后的 `num_ctx` Modelfile 参数，以及包括 vision/tools 在内的能力 |
| 视觉模型 | `/api/show` 报告具有 `vision` 能力的模型会被标记为支持图像（`input: ["text", "image"]`），因此 OpenClaw 会自动将图像注入提示词 |
| 推理检测 | 通过模型名称启发式（`r1`、`reasoning`、`think`）标记 `reasoning` |
| token 限制 | 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大 token 上限 |
| 成本 | 将所有成本设置为 `0` |

这样可以避免手动填写模型条目，同时让目录与本地 Ollama 实例保持一致。

```bash
# 查看有哪些模型可用
ollama list
openclaw models list
```

要添加新模型，只需使用 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型会被自动发现并可立即使用。

<Note>
如果你显式设置了 `models.providers.ollama`，则会跳过自动发现，你必须手动定义模型。请参见下方的显式配置部分。
</Note>

## 视觉与图像描述

内置的 Ollama 插件会将 Ollama 注册为支持图像的媒体理解 provider。这样 OpenClaw 就能通过本地或托管的 Ollama 视觉模型来路由显式图像描述请求，以及已配置的默认图像模型。

对于本地视觉功能，请拉取支持图像的模型：

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

然后使用 infer CLI 验证：

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` 必须是完整的 `<provider/model>` 引用。设置后，`openclaw infer image describe` 会直接运行该模型，而不会因为该模型支持原生视觉而跳过描述。

要让 Ollama 成为入站媒体的默认图像理解模型，请配置 `agents.defaults.imageModel`：

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

如果你手动定义 `models.providers.ollama.models`，请将视觉模型标记为支持图像输入：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

对于未标记为支持图像的模型，OpenClaw 会拒绝图像描述请求。使用隐式发现时，如果 `/api/show` 报告了 vision 能力，OpenClaw 会从 Ollama 中读取该信息。

## 配置

<Tabs>
  <Tab title="基础（隐式发现）">
    最简单的仅本地启用方式是通过环境变量：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果设置了 `OLLAMA_API_KEY`，你可以在 provider 条目中省略 `apiKey`，OpenClaw 会为可用性检查自动填充它。
    </Tip>

  </Tab>

  <Tab title="显式（手动模型）">
    当你需要托管云设置、Ollama 运行在其他主机/端口上、你想强制指定特定上下文窗口或模型列表，或你希望完全手动定义模型时，请使用显式配置。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="自定义 base URL">
    如果 Ollama 运行在不同的主机或端口上（显式配置会禁用自动发现，因此你需要手动定义模型）：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // 不要加 /v1 - 使用原生 Ollama API URL
            api: "ollama", // 显式设置以确保原生工具调用行为
            timeoutSeconds: 300, // 可选：为冷启动的本地模型提供更长的连接和流式传输时间
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // 可选：让模型在多轮之间保持已加载状态
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    不要在 URL 中添加 `/v1`。`/v1` 路径使用 OpenAI 兼容模式，在该模式下工具调用并不可靠。请使用不带路径后缀的 Ollama 基础 URL。
    </Warning>

  </Tab>
</Tabs>

### 模型选择

配置完成后，你的所有 Ollama 模型都可用：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

也支持自定义 Ollama provider id。当模型引用使用活动
provider 前缀时，例如 `ollama-spark/qwen3:32b`，OpenClaw 在调用 Ollama 前只会去掉该
前缀，因此服务器接收到的是 `qwen3:32b`。

对于较慢的本地模型，优先考虑使用 provider 级请求调优，而不是提高
整个智能体运行时超时时间：

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` 适用于模型 HTTP 请求，包括连接建立、
响应头、请求体流式传输，以及整体受保护获取的中止。`params.keep_alive`
会在原生 `/api/chat` 请求中作为顶层 `keep_alive` 转发给 Ollama；
当首轮加载时间是瓶颈时，可按模型进行设置。

## Ollama Web 搜索

OpenClaw 支持 **Ollama Web 搜索**，作为内置的 `web_search` provider。

| 属性 | 详情 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主机 | 使用你已配置的 Ollama 主机（若设置了 `models.providers.ollama.baseUrl` 则使用它，否则使用 `http://127.0.0.1:11434`）；`https://ollama.com` 直接使用托管 API |
| 认证 | 对已登录的本地 Ollama 主机无需密钥；对于直接访问 `https://ollama.com` 的搜索或受保护主机，使用 `OLLAMA_API_KEY` 或已配置的 provider 认证 |
| 要求 | 本地/自托管主机必须正在运行并已通过 `ollama signin` 登录；直接使用托管搜索则需要 `baseUrl: "https://ollama.com"` 加上真实的 Ollama API key |

在 `openclaw onboard` 或 `openclaw configure --section web` 中选择 **Ollama Web 搜索**，或设置：

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
有关完整设置和行为细节，请参见 [Ollama Web 搜索](/zh-CN/tools/ollama-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="旧版 OpenAI 兼容模式">
    <Warning>
    **在 OpenAI 兼容模式下，工具调用并不可靠。** 仅当你需要为代理使用 OpenAI 格式，且不依赖原生工具调用行为时，才应使用此模式。
    </Warning>

    如果你需要改用 OpenAI 兼容端点（例如在仅支持 OpenAI 格式的代理后面），请显式设置 `api: "openai-completions"`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // 默认：true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    此模式可能不支持同时使用流式传输和工具调用。你可能需要在模型配置中使用 `params: { streaming: false }` 禁用流式传输。

    当 Ollama 搭配 `api: "openai-completions"` 使用时，OpenClaw 默认会注入 `options.num_ctx`，以避免 Ollama 静默回退到 4096 的上下文窗口。如果你的代理/上游拒绝未知的 `options` 字段，请禁用此行为：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="上下文窗口">
    对于自动发现的模型，只要 Ollama 可提供相关信息，OpenClaw 就会使用 Ollama 报告的上下文窗口，包括来自自定义 Modelfile 的更大 `PARAMETER num_ctx` 值。否则，它会回退到 OpenClaw 使用的默认 Ollama 上下文窗口。

    你可以在显式 provider 配置中覆盖 `contextWindow` 和 `maxTokens`。若要在不重建 Modelfile 的情况下限制 Ollama 的单次请求运行时上下文，请设置 `params.num_ctx`；OpenClaw 会在原生 Ollama 和 OpenAI 兼容 Ollama 适配器中都将其作为 `options.num_ctx` 发送。无效值、零、负数以及非有限值会被忽略，并回退到 `contextWindow`。

    原生 Ollama 模型条目也支持在 `params` 下配置常见的 Ollama 运行时选项，包括 `temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread` 和 `use_mmap`。OpenClaw 只会转发 Ollama 请求键，因此像 `streaming` 这样的 OpenClaw 运行时参数不会泄露给 Ollama。使用 `params.think` 或 `params.thinking` 可发送顶层 Ollama `think`；对 Qwen 风格思考模型，`false` 会禁用 API 级思考。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    按模型配置的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也同样有效。如果两者都已配置，则显式 provider 模型条目优先于智能体默认值。

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 默认将名称中包含 `deepseek-r1`、`reasoning` 或 `think` 等字样的模型视为支持推理的模型。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    不需要额外配置。OpenClaw 会自动标记它们。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 是免费的，并且在本地运行，因此所有模型成本都设为 $0。这同时适用于自动发现和手动定义的模型。
  </Accordion>

  <Accordion title="Memory 嵌入">
    内置的 Ollama 插件为
    [memory search](/zh-CN/concepts/memory) 注册了一个 Memory 嵌入 provider。它使用已配置的 Ollama base URL
    和 API key，调用 Ollama 当前的 `/api/embed` 端点，并在可能时
    将多个 memory 块批量合并到一个 `input` 请求中。

    | 属性 | 值 |
    | ------------- | ------------------- |
    | 默认模型 | `nomic-embed-text` |
    | 自动拉取 | 是 — 如果嵌入模型在本地不存在，会自动拉取 |

    要选择 Ollama 作为 memory search 的嵌入 provider：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="流式传输配置">
    OpenClaw 的 Ollama 集成默认使用**原生 Ollama API**（`/api/chat`），它完全支持同时进行流式传输和工具调用。不需要特殊配置。

    对于原生 `/api/chat` 请求，OpenClaw 还会直接将思考控制转发给 Ollama：`/think off` 和 `openclaw agent --thinking off` 会发送顶层 `think: false`，而 `/think low|medium|high` 会发送对应的顶层 `think` 强度字符串。`/think max` 会映射到 Ollama 原生最高强度，即 `think: "high"`。

    <Tip>
    如果你需要使用 OpenAI 兼容端点，请参见上方的“旧版 OpenAI 兼容模式”部分。在该模式下，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="未检测到 Ollama">
    请确保 Ollama 正在运行，并且你已设置 `OLLAMA_API_KEY`（或认证配置文件），同时你**没有**定义显式的 `models.providers.ollama` 条目：

    ```bash
    ollama serve
    ```

    验证 API 是否可访问：

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="没有可用模型">
    如果列表中没有你的模型，请在本地拉取该模型，或在 `models.providers.ollama` 中显式定义它。

    ```bash
    ollama list  # 查看已安装内容
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 或其他模型
    ```

  </Accordion>

  <Accordion title="连接被拒绝">
    检查 Ollama 是否运行在正确的端口上：

    ```bash
    # 检查 Ollama 是否正在运行
    ps aux | grep ollama

    # 或重启 Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="冷启动本地模型超时">
    大型本地模型在开始流式传输前，首次加载可能需要较长时间。请将超时设置限制在 Ollama provider 范围内，并可选地要求 Ollama 在多轮之间保持模型已加载：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    如果主机本身接受连接很慢，`timeoutSeconds` 也会为该 provider 延长受保护的 Undici 连接超时。

  </Accordion>
</AccordionGroup>

<Note>
更多帮助： [故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    所有 provider、模型引用和故障切换行为概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="Ollama Web 搜索" href="/zh-CN/tools/ollama-search" icon="magnifying-glass">
    关于 Ollama 驱动网页搜索的完整设置和行为细节。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
