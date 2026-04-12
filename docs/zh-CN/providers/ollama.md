---
read_when:
    - 你想通过 Ollama 使用云端或本地模型运行 OpenClaw
    - 你需要 Ollama 的设置和配置指南
summary: 使用 Ollama 运行 OpenClaw（云端和本地模型）
title: Ollama
x-i18n:
    generated_at: "2026-04-12T11:08:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec796241b884ca16ec7077df4f3f1910e2850487bb3ea94f8fdb37c77e02b219
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama 是一个本地 LLM 运行时，让你可以轻松在自己的机器上运行开源模型。OpenClaw 集成了 Ollama 的原生 API（`/api/chat`），支持流式传输和工具调用，并且当你通过 `OLLAMA_API_KEY`（或认证配置）启用时，且未显式定义 `models.providers.ollama` 条目，它可以自动发现本地 Ollama 模型。

<Warning>
**远程 Ollama 用户**：不要在 OpenClaw 中使用 `/v1` 的 OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，模型还可能将原始工具 JSON 作为纯文本输出。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不要带 `/v1`）。
</Warning>

## 入门指南

选择你偏好的设置方法和模式。

<Tabs>
  <Tab title="新手引导（推荐）">
    **最适合：** 以最快路径完成可用的 Ollama 设置，并自动发现模型。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        ```

        从提供商列表中选择 **Ollama**。
      </Step>
      <Step title="选择你的模式">
        - **Cloud + Local** — 同时使用云端托管模型和本地模型
        - **Local** — 仅使用本地模型

        如果你选择 **Cloud + Local**，但尚未登录 ollama.com，新手引导会打开浏览器登录流程。
      </Step>
      <Step title="选择模型">
        新手引导会发现可用模型并推荐默认选项。如果所选模型尚未在本地可用，它会自动拉取该模型。
      </Step>
      <Step title="验证模型是否可用">
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

    你也可以选择性指定自定义 base URL 或模型：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手动设置">
    **最适合：** 完全控制安装、模型拉取和配置。

    <Steps>
      <Step title="安装 Ollama">
        从 [ollama.com/download](https://ollama.com/download) 下载。
      </Step>
      <Step title="拉取本地模型">
        ```bash
        ollama pull gemma4
        # 或
        ollama pull gpt-oss:20b
        # 或
        ollama pull llama3.3
        ```
      </Step>
      <Step title="登录以使用云端模型（可选）">
        如果你也想使用云端模型：

        ```bash
        ollama signin
        ```
      </Step>
      <Step title="为 OpenClaw 启用 Ollama">
        为 API 密钥设置任意值即可（Ollama 不需要真实密钥）：

        ```bash
        # 设置环境变量
        export OLLAMA_API_KEY="ollama-local"

        # 或在你的配置文件中设置
        openclaw config set models.providers.ollama.apiKey "ollama-local"
        ```
      </Step>
      <Step title="查看并设置你的模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或者在配置中设置默认值：

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

## 云端模型

<Tabs>
  <Tab title="Cloud + Local">
    云端模型让你可以将云端托管模型与本地模型一起使用。示例包括 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud` —— 这些**不**需要本地执行 `ollama pull`。

    在设置期间选择 **Cloud + Local** 模式。向导会检查你是否已登录，并在需要时打开浏览器登录流程。如果无法验证认证状态，向导会回退到本地模型默认值。

    你也可以直接在 [ollama.com/signin](https://ollama.com/signin) 登录。

    OpenClaw 当前推荐以下云端默认模型：`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`。

  </Tab>

  <Tab title="仅本地">
    在仅本地模式下，OpenClaw 会从本地 Ollama 实例发现模型。不需要登录云端。

    OpenClaw 当前推荐 `gemma4` 作为本地默认模型。

  </Tab>
</Tabs>

## 模型发现（隐式 provider）

当你设置了 `OLLAMA_API_KEY`（或认证配置），并且**没有**定义 `models.providers.ollama` 时，OpenClaw 会从 `http://127.0.0.1:11434` 上的本地 Ollama 实例发现模型。

| 行为 | 详情 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询 | 查询 `/api/tags` |
| 能力检测 | 使用尽力而为的 `/api/show` 查询来读取 `contextWindow` 并检测能力（包括视觉） |
| 视觉模型 | 对于 `/api/show` 报告具有 `vision` 能力的模型，会将其标记为支持图像（`input: ["text", "image"]`），因此 OpenClaw 会自动将图像注入到提示中 |
| 推理检测 | 使用模型名称启发式规则（`r1`、`reasoning`、`think`）标记 `reasoning` |
| token 限制 | 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大 token 上限 |
| 成本 | 将所有成本设置为 `0` |

这样可以避免手动填写模型条目，同时使目录与本地 Ollama 实例保持一致。

```bash
# 查看有哪些可用模型
ollama list
openclaw models list
```

要添加新模型，只需通过 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型会被自动发现并可立即使用。

<Note>
如果你显式设置了 `models.providers.ollama`，则会跳过自动发现，你必须手动定义模型。请参阅下方的显式配置部分。
</Note>

## 配置

<Tabs>
  <Tab title="基础（隐式发现）">
    启用 Ollama 的最简单方式是使用环境变量：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果已设置 `OLLAMA_API_KEY`，你可以在 provider 条目中省略 `apiKey`，OpenClaw 会自动填充它以进行可用性检查。
    </Tip>

  </Tab>

  <Tab title="显式（手动模型）">
    当 Ollama 运行在其他主机或端口上、你希望强制指定特定上下文窗口或模型列表，或者你希望完全手动定义模型时，请使用显式配置。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            apiKey: "ollama-local",
            api: "ollama",
            models: [
              {
                id: "gpt-oss:20b",
                name: "GPT-OSS 20B",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 8192,
                maxTokens: 8192 * 10
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
            baseUrl: "http://ollama-host:11434", // 不要带 /v1 - 使用原生 Ollama API URL
            api: "ollama", // 显式设置以确保使用原生工具调用行为
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

## Ollama Web 搜索

OpenClaw 支持 **Ollama Web 搜索**，它作为内置的 `web_search` 提供商提供。

| 属性 | 详情 |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| 主机 | 使用你配置的 Ollama 主机（设置了 `models.providers.ollama.baseUrl` 时使用其值，否则为 `http://127.0.0.1:11434`） |
| 认证 | 无需密钥 |
| 要求 | Ollama 必须正在运行，并且已通过 `ollama signin` 登录 |

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
有关完整设置和行为细节，请参阅 [Ollama Web 搜索](/zh-CN/tools/ollama-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="旧版 OpenAI 兼容模式">
    <Warning>
    **在 OpenAI 兼容模式下，工具调用并不可靠。** 仅当你需要为代理使用 OpenAI 格式，且不依赖原生工具调用行为时，才使用此模式。
    </Warning>

    如果你需要改用 OpenAI 兼容端点（例如在仅支持 OpenAI 格式的代理之后），请显式设置 `api: "openai-completions"`：

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

    此模式可能不支持同时进行流式传输和工具调用。你可能需要在模型配置中使用 `params: { streaming: false }` 禁用流式传输。

    当 Ollama 使用 `api: "openai-completions"` 时，OpenClaw 默认会注入 `options.num_ctx`，这样 Ollama 就不会悄悄回退到 4096 的上下文窗口。如果你的代理或上游拒绝未知的 `options` 字段，请禁用此行为：

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
    对于自动发现的模型，OpenClaw 会在可用时使用 Ollama 报告的上下文窗口，否则会回退到 OpenClaw 使用的默认 Ollama 上下文窗口。

    你可以在显式 provider 配置中覆盖 `contextWindow` 和 `maxTokens`：

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
    默认情况下，OpenClaw 会将名称包含 `deepseek-r1`、`reasoning` 或 `think` 的模型视为具备推理能力。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    不需要额外配置——OpenClaw 会自动标记它们。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 可免费使用并在本地运行，因此所有模型成本都设置为 $0。这同时适用于自动发现和手动定义的模型。
  </Accordion>

  <Accordion title="记忆嵌入">
    内置的 Ollama 插件为
    [记忆搜索](/zh-CN/concepts/memory)
    注册了一个记忆嵌入提供商。它使用已配置的 Ollama base URL
    和 API 密钥。

    | 属性 | 值 |
    | ------------- | ------------------- |
    | 默认模型 | `nomic-embed-text` |
    | 自动拉取 | 是——如果嵌入模型尚未在本地存在，将自动拉取 |

    要将 Ollama 选为记忆搜索的嵌入提供商：

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
    OpenClaw 的 Ollama 集成默认使用**原生 Ollama API**（`/api/chat`），可同时完整支持流式传输和工具调用。不需要特殊配置。

    <Tip>
    如果你需要使用 OpenAI 兼容端点，请参阅上方“旧版 OpenAI 兼容模式”部分。在该模式下，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="未检测到 Ollama">
    请确认 Ollama 正在运行，并且你已设置 `OLLAMA_API_KEY`（或认证配置），且你**没有**定义显式的 `models.providers.ollama` 条目：

    ```bash
    ollama serve
    ```

    验证 API 是否可访问：

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="没有可用模型">
    如果你的模型未列出，请在本地拉取该模型，或在 `models.providers.ollama` 中显式定义它。

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
    由 Ollama 提供支持的 Web 搜索的完整设置和行为细节。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
