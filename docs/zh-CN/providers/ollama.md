---
read_when:
    - 你想通过 Ollama 使用云端或本地模型运行 OpenClaw
    - 你需要 Ollama 的设置和配置指南
    - 你想使用 Ollama 视觉模型进行图像理解
summary: 使用 Ollama 运行 OpenClaw（云端和本地模型）
title: Ollama
x-i18n:
    generated_at: "2026-04-21T21:37:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32623b6523f22930a5987fb22d2074f1e9bb274cc01ae1ad1837825cc04ec179
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw 集成了 Ollama 的原生 API（`/api/chat`），可用于托管云模型和本地/自托管的 Ollama 服务器。你可以通过三种模式使用 Ollama：通过可访问的 Ollama 主机使用 `云端 + 本地`，针对 `https://ollama.com` 使用 `仅云端`，或针对可访问的 Ollama 主机使用 `仅本地`。

<Warning>
**远程 Ollama 用户**：不要在 OpenClaw 中使用 `/v1` 的 OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，模型还可能把原始工具 JSON 作为纯文本输出。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不要加 `/v1`）。
</Warning>

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

        从提供商列表中选择 **Ollama**。
      </Step>
      <Step title="选择你的模式">
        - **云端 + 本地** — 本地 Ollama 主机，加上通过该主机路由的云模型
        - **仅云端** — 通过 `https://ollama.com` 使用托管的 Ollama 模型
        - **仅本地** — 仅使用本地模型
      </Step>
      <Step title="选择模型">
        `仅云端` 会提示输入 `OLLAMA_API_KEY`，并推荐托管云端默认模型。`云端 + 本地` 和 `仅本地` 会要求提供 Ollama 基础 URL，发现可用模型，并在所选本地模型尚不可用时自动拉取。`云端 + 本地` 还会检查该 Ollama 主机是否已登录以启用云访问。
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

    你也可以选择性指定自定义基础 URL 或模型：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手动设置">
    **最适合：** 完全掌控云端或本地设置。

    <Steps>
      <Step title="选择云端或本地">
        - **云端 + 本地**：安装 Ollama，使用 `ollama signin` 登录，并通过该主机路由云请求
        - **仅云端**：使用带有 `OLLAMA_API_KEY` 的 `https://ollama.com`
        - **仅本地**：从 [ollama.com/download](https://ollama.com/download) 安装 Ollama
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
        对于 `仅云端`，请使用你真实的 `OLLAMA_API_KEY`。对于基于主机的设置，任意占位值都可以：

        ```bash
        # 云端
        export OLLAMA_API_KEY="your-ollama-api-key"

        # 仅本地
        export OLLAMA_API_KEY="ollama-local"

        # 或在你的配置文件中设置
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="检查并设置你的模型">
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
  <Tab title="云端 + 本地">
    `云端 + 本地` 会把可访问的 Ollama 主机作为本地模型和云模型的统一控制点。这是 Ollama 偏好的混合使用流程。

    在设置期间使用 **云端 + 本地**。OpenClaw 会提示输入 Ollama 基础 URL，从该主机发现本地模型，并检查该主机是否已通过 `ollama signin` 登录以启用云访问。当主机已登录时，OpenClaw 还会推荐托管云端默认模型，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`。

    如果主机尚未登录，OpenClaw 会保持为仅本地设置，直到你运行 `ollama signin`。

  </Tab>

  <Tab title="仅云端">
    `仅云端` 通过 Ollama 的托管 API `https://ollama.com` 运行。

    在设置期间使用 **仅云端**。OpenClaw 会提示输入 `OLLAMA_API_KEY`，设置 `baseUrl: "https://ollama.com"`，并填充托管云模型列表。此路径**不**需要本地 Ollama 服务器，也不需要 `ollama signin`。

    在 `openclaw onboard` 期间显示的云模型列表会通过 `https://ollama.com/api/tags` 实时填充，最多显示 500 条，因此选择器反映的是当前托管目录，而不是静态预设。如果设置时 `ollama.com` 无法访问或未返回任何模型，OpenClaw 会回退到之前的硬编码推荐项，以便新手引导仍能完成。

  </Tab>

  <Tab title="仅本地">
    在仅本地模式下，OpenClaw 会从已配置的 Ollama 实例发现模型。此路径适用于本地或自托管的 Ollama 服务器。

    OpenClaw 当前推荐 `gemma4` 作为本地默认模型。

  </Tab>
</Tabs>

## 模型发现（隐式提供商）

当你设置了 `OLLAMA_API_KEY`（或认证配置文件），并且**没有**定义 `models.providers.ollama` 时，OpenClaw 会从位于 `http://127.0.0.1:11434` 的本地 Ollama 实例发现模型。

| 行为 | 说明 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询 | 查询 `/api/tags` |
| 能力检测 | 使用尽力而为的 `/api/show` 查询来读取 `contextWindow` 并检测能力（包括视觉） |
| 视觉模型 | 对于 `/api/show` 报告了 `vision` 能力的模型，会标记为支持图像（`input: ["text", "image"]`），因此 OpenClaw 会自动将图像注入提示词 |
| 推理检测 | 使用模型名称启发式（`r1`、`reasoning`、`think`）标记 `reasoning` |
| Token 限制 | 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大 token 上限 |
| 成本 | 所有成本均设为 `0` |

这样可以避免手动录入模型，同时让模型目录与本地 Ollama 实例保持一致。

```bash
# 查看有哪些可用模型
ollama list
openclaw models list
```

要添加新模型，只需使用 Ollama 拉取即可：

```bash
ollama pull mistral
```

新模型会被自动发现并可立即使用。

<Note>
如果你显式设置了 `models.providers.ollama`，自动发现将被跳过，你必须手动定义模型。参见下方的显式配置部分。
</Note>

## 视觉与图像描述

内置的 Ollama 插件会将 Ollama 注册为支持图像的媒体理解提供商。这使 OpenClaw 能够将显式的图像描述请求以及已配置的图像模型默认值，路由到本地或托管的 Ollama 视觉模型。

对于本地视觉模型，请拉取一个支持图像的模型：

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

然后使用 infer CLI 进行验证：

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` 必须是完整的 `<provider/model>` 引用。设置后，`openclaw infer image describe` 会直接运行该模型，而不会因为模型支持原生视觉而跳过描述。

要让 Ollama 成为传入媒体的默认图像理解模型，请配置 `agents.defaults.imageModel`：

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

如果你手动定义了 `models.providers.ollama.models`，请为视觉模型标记图像输入支持：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 会拒绝未标记为支持图像的模型所发起的图像描述请求。在隐式发现模式下，当 `/api/show` 报告视觉能力时，OpenClaw 会从 Ollama 中读取此信息。

## 配置

<Tabs>
  <Tab title="基础（隐式发现）">
    最简单的仅本地启用方式是通过环境变量：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果设置了 `OLLAMA_API_KEY`，你可以在提供商条目中省略 `apiKey`，OpenClaw 会在可用性检查时自动填入。
    </Tip>

  </Tab>

  <Tab title="显式（手动模型）">
    当你需要托管云设置、Ollama 运行在其他主机/端口、想强制指定特定上下文窗口或模型列表，或者需要完全手动定义模型时，请使用显式配置。

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

  <Tab title="自定义基础 URL">
    如果 Ollama 运行在不同的主机或端口上（显式配置会禁用自动发现，因此你需要手动定义模型）：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // 不要加 /v1 - 使用原生 Ollama API URL
            api: "ollama", // 显式设置以确保原生工具调用行为
          },
        },
      },
    }
    ```

    <Warning>
    不要在 URL 中添加 `/v1`。`/v1` 路径使用 OpenAI 兼容模式，而该模式下工具调用并不可靠。请使用不带路径后缀的 Ollama 基础 URL。
    </Warning>

  </Tab>
</Tabs>

### 模型选择

配置完成后，你的所有 Ollama 模型都会可用：

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

## Ollama Web 搜索

OpenClaw 支持将 **Ollama Web 搜索** 作为内置的 `web_search` 提供商。

| 属性 | 说明 |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| 主机 | 使用你已配置的 Ollama 主机（设置了 `models.providers.ollama.baseUrl` 时使用该值，否则使用 `http://127.0.0.1:11434`） |
| 认证 | 无需密钥 |
| 要求 | Ollama 必须正在运行，并已通过 `ollama signin` 登录 |

在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Ollama Web 搜索**，或者设置：

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
有关完整的设置和行为细节，请参见 [Ollama Web 搜索](/zh-CN/tools/ollama-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="旧版 OpenAI 兼容模式">
    <Warning>
    **在 OpenAI 兼容模式下，工具调用并不可靠。** 仅当你需要通过代理使用 OpenAI 格式，且不依赖原生工具调用行为时，才应使用此模式。
    </Warning>

    如果你需要改用 OpenAI 兼容端点（例如位于只支持 OpenAI 格式的代理之后），请显式设置 `api: "openai-completions"`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // 默认值：true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    此模式可能无法同时支持流式传输和工具调用。你可能需要在模型配置中使用 `params: { streaming: false }` 来禁用流式传输。

    当 Ollama 使用 `api: "openai-completions"` 时，OpenClaw 默认会注入 `options.num_ctx`，以避免 Ollama 悄悄回退到 4096 的上下文窗口。如果你的代理/上游会拒绝未知的 `options` 字段，请禁用此行为：

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
    对于自动发现的模型，OpenClaw 会在可用时使用 Ollama 报告的上下文窗口；否则会回退到 OpenClaw 使用的默认 Ollama 上下文窗口。

    你可以在显式提供商配置中覆盖 `contextWindow` 和 `maxTokens`：

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
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 默认会将名称中包含 `deepseek-r1`、`reasoning` 或 `think` 的模型视为支持推理的模型。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    不需要额外配置——OpenClaw 会自动标记它们。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 是免费的，并且可在本地运行，因此所有模型成本都设置为 $0。这同时适用于自动发现和手动定义的模型。
  </Accordion>

  <Accordion title="内存嵌入">
    内置的 Ollama 插件为
    [memory search](/zh-CN/concepts/memory) 注册了一个内存嵌入提供商。它使用已配置的 Ollama 基础 URL
    和 API 密钥。

    | 属性 | 值 |
    | ------------- | ------------------- |
    | 默认模型 | `nomic-embed-text` |
    | 自动拉取 | 是——如果本地不存在，该嵌入模型会被自动拉取 |

    要将 Ollama 选为 memory search 的嵌入提供商：

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
    OpenClaw 的 Ollama 集成默认使用 **原生 Ollama API**（`/api/chat`），它完全支持同时进行流式传输和工具调用。不需要任何特殊配置。

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
    如果列表中没有你的模型，请在本地拉取该模型，或者在 `models.providers.ollama` 中显式定义它。

    ```bash
    ollama list  # 查看已安装的模型
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 或其他模型
    ```

  </Accordion>

  <Accordion title="连接被拒绝">
    检查 Ollama 是否在正确的端口上运行：

    ```bash
    # 检查 Ollama 是否正在运行
    ps aux | grep ollama

    # 或重启 Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障切换行为的概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="Ollama Web 搜索" href="/zh-CN/tools/ollama-search" icon="magnifying-glass">
    由 Ollama 驱动的 web search 的完整设置和行为细节。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
