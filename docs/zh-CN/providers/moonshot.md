---
read_when:
    - 你想要配置 Moonshot K2（Moonshot Open Platform）还是 Kimi Coding
    - 你需要了解各自独立的端点、密钥和模型引用
    - 你需要任一提供商的可复制粘贴配置
summary: 配置 Moonshot K2 与 Kimi Coding（独立的提供商和密钥）
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-11T20:53:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot 提供具有 OpenAI 兼容端点的 Kimi API。对于 Moonshot Open Platform，将默认模型设置为 `moonshot/kimi-k2.6`；对于 Kimi Coding，则设置为 `kimi/kimi-for-coding`。

<Warning>
Moonshot 和 Kimi Coding 是**不同的提供商**，各自作为独立的外部插件发布。两者的密钥不可互换、端点不同，模型引用也不同（`moonshot/...` 与 `kimi/...`）。
</Warning>

## 内置模型目录

[//]: # "moonshot-kimi-k2-ids:start"

| 模型引用                          | 名称                   | 推理     | 输入       | 上下文  | 最大输出 |
| --------------------------------- | ---------------------- | -------- | ---------- | ------- | -------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | 否       | 文本、图像 | 262,144 | 262,144  |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | 始终开启 | 文本、图像 | 262,144 | 262,144  |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | 否       | 文本、图像 | 262,144 | 262,144  |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | 是       | 文本       | 262,144 | 262,144  |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | 是       | 文本       | 262,144 | 262,144  |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | 否       | 文本       | 256,000 | 16,384   |

[//]: # "moonshot-kimi-k2-ids:end"

目录成本估算采用 Moonshot 公布的按量付费价格：Kimi K2.7 Code 的缓存命中价格为 $0.19/MTok，输入为 $0.95/MTok，输出为 $4.00/MTok；Kimi K2.6 的缓存命中价格为 $0.16/MTok，输入为 $0.95/MTok，输出为 $4.00/MTok；Kimi K2.5 的缓存命中价格为 $0.10/MTok，输入为 $0.60/MTok，输出为 $3.00/MTok。除非你在配置中覆盖，否则其他目录条目保留零成本占位值。

Kimi K2.7 Code 始终使用原生思考。OpenClaw 仅为此模型公开 `on` 思考状态，并按照 Moonshot 的要求省略出站的 `thinking` 和 `reasoning_effort` 字段。它还会省略采样覆盖项（`temperature`、`top_p`、`n`、`presence_penalty`、`frequency_penalty`），因为 K2.7 将这些参数固定为提供商默认值。Kimi K2.6 仍是新手引导的默认模型。

## 入门指南

Moonshot 和 Kimi Coding 都是外部插件——请在新手引导前安装其中一个。

<Tabs>
  <Tab title="Moonshot API">
    **最适合：**通过 Moonshot Open Platform 使用 Kimi K2 模型。

    <Steps>
      <Step title="安装插件">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="选择端点区域">
        | 身份验证选项           | 端点                           | 区域 |
        | ---------------------- | ------------------------------ | ---- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 国际 |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中国 |
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        或者使用中国端点：

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="运行实时冒烟测试">
        如果你想在不影响正常会话的情况下验证模型访问权限和成本跟踪，请使用隔离的状态目录：

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 响应应报告 `provider: "moonshot"` 和 `model: "kimi-k2.6"`。当 Moonshot 返回用量元数据时，智能体转录条目会在 `usage.cost` 下存储标准化的 token 用量和预估成本。
      </Step>
    </Steps>

    ### 配置示例

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **最适合：**通过 Kimi Coding 端点处理以代码为重点的任务。

    <Note>
    Kimi Coding 使用与 Moonshot（`moonshot/...`）不同的 API 密钥和提供商前缀（`kimi/...`）。稳定的模型引用为 `kimi/kimi-for-coding`；旧版引用 `kimi/kimi-code` 和 `kimi/k2p5` 仍会被接受，并标准化为该模型 ID。
    </Note>

    <Steps>
      <Step title="安装插件">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### 配置示例

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi Web 搜索

Moonshot 插件还会将 **Kimi** 注册为由 Moonshot Web 搜索支持的 `web_search` 提供商。

<Steps>
  <Step title="运行交互式 Web 搜索设置">
    ```bash
    openclaw configure --section web
    ```

    在 Web 搜索部分选择 **Kimi**，以存储 `plugins.entries.moonshot.config.webSearch.*`。

  </Step>
  <Step title="配置 Web 搜索区域和模型">
    交互式设置会提示配置：

    | 设置            | 选项                                                                             |
    | --------------- | -------------------------------------------------------------------------------- |
    | API 区域        | `https://api.moonshot.ai/v1`（国际）或 `https://api.moonshot.cn/v1`（中国）      |
    | Web 搜索模型    | 默认为 `kimi-k2.6`                                                               |

  </Step>
</Steps>

配置位于 `plugins.entries.moonshot.config.webSearch` 下：

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="原生思考模式">
    Kimi K2.7 Code 始终使用原生思考。Moonshot 要求客户端为此模型省略 `thinking` 字段，因此 OpenClaw 仅公开 `on`，并忽略过时的 `off` 设置。K2.7 还固定了 `temperature`、`top_p`、`n`、`presence_penalty` 和 `frequency_penalty`；OpenClaw 会省略为这些字段配置的覆盖值。

    其他 Moonshot Kimi 模型支持二元原生思考：

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    通过 `agents.defaults.models.<provider/model>.params` 按模型进行配置：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw 会为这些模型映射运行时 `/think` 级别：

    | `/think` 级别       | Moonshot 行为              |
    | ------------------- | -------------------------- |
    | `/think off`        | `thinking.type=disabled`   |
    | 任意非 off 级别     | `thinking.type=enabled`    |

    <Warning>
    启用 Moonshot 思考时，`tool_choice` 必须为 `auto` 或 `none`。固定的工具选择（`type: "tool"` 或 `type: "function"`）会改为强制将思考设回 `disabled`，从而确保所请求的工具仍可运行；而 `tool_choice: "required"` 会改为标准化成 `auto`。这适用于除 Kimi K2.7 Code 之外的所有 Moonshot 模型；该模型的思考模式无法禁用，因此其 `tool_choice` 在不兼容时会标准化为 `auto`。
    </Warning>

    Kimi K2.6 还接受可选的 `thinking.keep` 字段，用于控制多轮对话中 `reasoning_content` 的保留方式。将其设为 `"all"` 可跨轮次保留完整推理；省略该字段（或将其保留为 `null`）则使用服务器默认策略。OpenClaw 仅会为 `moonshot/kimi-k2.6` 转发 `thinking.keep`，并会从其他模型的请求中移除该字段。Kimi K2.7 Code 默认保留完整的推理历史记录，而 OpenClaw 会省略整个 `thinking` 字段。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Tool call id sanitization">
    Moonshot Kimi 提供的原生 tool_call id 采用 `functions.<name>:<index>` 格式。OpenClaw 会保留每个 Kimi 原生 id 的首次出现，并将之后的重复项重写为确定性的 OpenAI 风格 `call_*` id。对应的工具结果会使用相同的 id 重新映射，因此既能确保重放时 id 唯一，也不会移除 Kimi 首次出现的原生 id。此行为已集成到内置 Moonshot 提供商中，并非用户可配置的设置。
  </Accordion>

  <Accordion title="Streaming usage compatibility">
    Moonshot 原生端点（`https://api.moonshot.ai/v1` 和
    `https://api.moonshot.cn/v1`）声明支持流式用量兼容性。
    OpenClaw 根据端点主机而非提供商 id 判断此能力，因此，指向同一 Moonshot
    原生主机的自定义提供商 id 也会继承相同的流式用量行为。

    使用目录中的 K2.6 定价时，包含输入、输出和缓存读取 token 的流式用量
    还会转换为本地估算的美元成本，供 `/status`、`/usage full`、
    `/usage cost` 以及基于记录文本的会话核算使用。

  </Accordion>

  <Accordion title="Endpoint and model ref reference">
    | 提供商     | 模型引用前缀     | 端点                           | 身份验证环境变量      |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding 端点               | `KIMI_API_KEY`      |
    | Web 搜索   | 不适用           | 与 Moonshot API 区域相同       | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY` |

    - Kimi Web 搜索使用 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，默认端点为 `https://api.moonshot.ai/v1`，模型为 `kimi-k2.6`。
    - 如有需要，可在 `models.providers` 中覆盖定价和上下文元数据。
    - 如果 Moonshot 为某个模型公布了不同的上下文限制，请相应调整 `contextWindow`。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Web search" href="/zh-CN/tools/web" icon="magnifying-glass">
    配置包括 Kimi 在内的 Web 搜索提供商。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference" icon="gear">
    提供商、模型和插件的完整配置架构。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API key 管理和文档。
  </Card>
</CardGroup>
