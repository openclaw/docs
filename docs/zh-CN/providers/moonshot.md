---
read_when:
    - 你想要 Moonshot K2（Moonshot Open Platform）还是 Kimi Coding 设置
    - 你需要了解独立的端点、密钥和模型引用
    - 你需要任一提供商的可复制粘贴配置
summary: 配置 Moonshot K2 与 Kimi Coding（独立提供商 + 密钥）
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-05T11:38:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot 提供带有 OpenAI 兼容端点的 Kimi API。对于 Moonshot Open Platform，将默认模型设置为 `moonshot/kimi-k2.6`；对于 Kimi Coding，则设置为 `kimi/kimi-for-coding`。

<Warning>
Moonshot 和 Kimi Coding 是**独立的提供商**，各自作为单独的外部插件发布。密钥不可互换，端点不同，模型引用也不同（`moonshot/...` 与 `kimi/...`）。
</Warning>

## 内置模型目录

[//]: # "moonshot-kimi-k2-ids:start"

| 模型引用                          | 名称                   | 推理     | 输入       | 上下文  | 最大输出   |
| --------------------------------- | ---------------------- | -------- | ---------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | 否       | 文本、图像 | 262,144 | 262,144    |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | 始终开启 | 文本、图像 | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | 否       | 文本、图像 | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | 是       | 文本       | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | 是       | 文本       | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | 否       | 文本       | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

目录成本估算使用 Moonshot 发布的按量付费费率：Kimi K2.7 Code 为 $0.19/MTok 缓存命中、$0.95/MTok 输入、$4.00/MTok 输出；Kimi K2.6 为 $0.16/MTok 缓存命中、$0.95/MTok 输入、$4.00/MTok 输出；Kimi K2.5 为 $0.10/MTok 缓存命中、$0.60/MTok 输入、$3.00/MTok 输出。其他目录条目保留零成本占位值，除非你在配置中覆盖它们。

Kimi K2.7 Code 始终使用原生 thinking。OpenClaw 仅为此模型暴露 `on` thinking 状态，并按 Moonshot 要求省略出站的 `thinking` 和 `reasoning_effort` 字段。它还会省略采样覆盖项（`temperature`、`top_p`、`n`、`presence_penalty`、`frequency_penalty`），这些值在 K2.7 中固定为提供商默认值。Kimi K2.6 仍是新手引导默认值。

## 入门指南

Moonshot 和 Kimi Coding 都是外部插件，请先安装其中一个，再进行新手引导。

<Tabs>
  <Tab title="Moonshot API">
    **最适合：** 通过 Moonshot Open Platform 使用 Kimi K2 模型。

    <Steps>
      <Step title="安装插件">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="选择你的端点区域">
        | 凭证选择               | 端点                           | 区域 |
        | ---------------------- | ------------------------------ | ---- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 国际 |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中国 |
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        或对于中国端点：

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
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="运行实时冒烟测试">
        当你想在不影响正常会话的情况下验证模型访问和成本跟踪时，请使用隔离的状态目录：

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 响应应报告 `provider: "moonshot"` 和 `model: "kimi-k2.6"`。当 Moonshot 返回 usage 元数据时，助手 transcript 条目会在 `usage.cost` 下存储归一化后的 token 用量和估算成本。
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
    **最适合：** 通过 Kimi Coding 端点执行偏代码的任务。

    <Note>
    Kimi Coding 使用不同于 Moonshot（`moonshot/...`）的 API 密钥和提供商前缀（`kimi/...`）。稳定模型引用是 `kimi/kimi-for-coding`；旧版引用 `kimi/kimi-code` 和 `kimi/k2p5` 仍被接受，并会归一化为该模型 ID。
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
      <Step title="验证模型可用">
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

Moonshot 插件还会将 **Kimi** 注册为一个 `web_search` 提供商，由 Moonshot Web 搜索提供支持。

<Steps>
  <Step title="运行交互式 Web 搜索设置">
    ```bash
    openclaw configure --section web
    ```

    在 Web 搜索部分选择 **Kimi**，以存储 `plugins.entries.moonshot.config.webSearch.*`。

  </Step>
  <Step title="配置 Web 搜索区域和模型">
    交互式设置会提示：

    | 设置                | 选项                                                                 |
    | ------------------- | -------------------------------------------------------------------- |
    | API 区域            | `https://api.moonshot.ai/v1`（国际）或 `https://api.moonshot.cn/v1`（中国） |
    | Web 搜索模型        | 默认为 `kimi-k2.6`                                                   |

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
  <Accordion title="原生 thinking 模式">
    Kimi K2.7 Code 始终使用原生 thinking。Moonshot 要求客户端为此模型省略 `thinking` 字段，因此 OpenClaw 仅暴露 `on`，并忽略过时的 `off` 设置。K2.7 还会固定 `temperature`、`top_p`、`n`、`presence_penalty` 和 `frequency_penalty`；OpenClaw 会省略这些字段的已配置覆盖项。

    其他 Moonshot Kimi 模型支持二元原生 thinking：

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    通过 `agents.defaults.models.<provider/model>.params` 按模型配置它：

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
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | 任何非 off 级别      | `thinking.type=enabled`    |

    <Warning>
    当 Moonshot thinking 启用时，`tool_choice` 必须是 `auto` 或 `none`。固定的工具选择（`type: "tool"` 或 `type: "function"`）会改为强制将 thinking 设回 `disabled`，因此请求的工具仍会运行；`tool_choice: "required"` 会改为归一化为 `auto`。这适用于除 Kimi K2.7 Code 之外的每个 Moonshot 模型；Kimi K2.7 Code 的 thinking 模式无法禁用，当不兼容时，它的 `tool_choice` 会归一化为 `auto`。
    </Warning>

    Kimi K2.6 还接受可选的 `thinking.keep` 字段，用于控制
    `reasoning_content` 的多轮保留。将其设为 `"all"` 可在轮次之间保留完整
    推理；省略它（或保留为 `null`）则使用服务器
    默认策略。OpenClaw 仅会为 `moonshot/kimi-k2.6` 转发 `thinking.keep`，
    并会从其他模型中移除它。Kimi K2.7 Code 默认保留完整推理历史，
    而 OpenClaw 会省略整个 `thinking` 字段。

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

  <Accordion title="工具调用 ID 清理">
    Moonshot Kimi 提供形如 `functions.<name>:<index>` 的原生 tool_call ID。OpenClaw 会保留每个原生 Kimi ID 的首次出现，并将后续重复项重写为确定性的 OpenAI 风格 `call_*` ID。匹配的工具结果会用同一 ID 重新映射，因此重放时仍保持唯一，同时不会移除 Kimi 的首个原生 ID。此行为已接入内置 Moonshot 提供商，并且不是用户可配置的设置。
  </Accordion>

  <Accordion title="流式用量兼容性">
    原生 Moonshot 端点（`https://api.moonshot.ai/v1` 和
    `https://api.moonshot.cn/v1`）声明支持流式用量兼容性。
    OpenClaw 根据端点主机判断此行为，而不是根据提供商 ID，因此指向同一原生
    Moonshot 主机的自定义提供商 ID 会继承相同的流式用量行为。

    使用目录中的 K2.6 定价时，包含输入、输出和缓存读取 token 的流式用量
    也会转换为本地估算的美元成本，用于 `/status`、`/usage full`、`/usage cost`
    以及基于转录记录的会话记账。

  </Accordion>

  <Accordion title="端点和模型引用参考">
    | 提供商   | 模型引用前缀 | 端点                      | 凭证环境变量        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding 端点           | `KIMI_API_KEY`      |
    | Web 搜索 | N/A              | 与 Moonshot API 区域相同    | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY` |

    - Kimi Web 搜索使用 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，并默认使用 `https://api.moonshot.ai/v1` 和模型 `kimi-k2.6`。
    - 如有需要，可在 `models.providers` 中覆盖定价和上下文元数据。
    - 如果 Moonshot 为某个模型发布了不同的上下文限制，请相应调整 `contextWindow`。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Web 搜索" href="/zh-CN/tools/web" icon="magnifying-glass">
    配置包括 Kimi 在内的 Web 搜索提供商。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    提供商、模型和插件的完整配置 schema。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API key 管理和文档。
  </Card>
</CardGroup>
