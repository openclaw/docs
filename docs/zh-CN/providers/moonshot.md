---
read_when:
    - 你想了解 Moonshot K2（Moonshot Open Platform）与 Kimi Coding 的设置对比
    - 你需要了解各自独立的端点、密钥和模型引用
    - 你需要任一提供商的可复制/粘贴配置
summary: 配置 Moonshot K2 与 Kimi Coding（单独的提供商和密钥）
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:47:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot 提供具有 OpenAI 兼容端点的 Kimi API。配置
provider，并将默认模型设置为 `moonshot/kimi-k2.6`，或通过
`kimi/kimi-for-coding` 使用 Kimi Coding。

<Warning>
Moonshot 和 Kimi Coding 是**不同的提供商**。密钥不可互换，端点不同，模型引用也不同（`moonshot/...` 与 `kimi/...`）。
</Warning>

## 内置模型目录

[//]: # "moonshot-kimi-k2-ids:start"

| 模型引用                          | 名称                   | 推理 | 输入        | 上下文  | 最大输出   |
| --------------------------------- | ---------------------- | ---- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | 否   | 文本，图像  | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | 否   | 文本，图像  | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | 是   | 文本        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | 是   | 文本        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | 否   | 文本        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

当前由 Moonshot 托管的 K2 模型的内置成本估算使用 Moonshot
发布的按量付费费率：Kimi K2.6 为缓存命中 $0.16/MTok、
输入 $0.95/MTok、输出 $4.00/MTok；Kimi K2.5 为缓存命中 $0.10/MTok、
输入 $0.60/MTok、输出 $3.00/MTok。其他旧版目录条目会保留
零成本占位符，除非你在配置中覆盖它们。

## 入门指南

选择你的提供商并按照设置步骤操作。

<Tabs>
  <Tab title="Moonshot API">
    **最适合：** 通过 Moonshot Open Platform 使用 Kimi K2 模型。

    <Steps>
      <Step title="Choose your endpoint region">
        | 凭证选择               | 端点                           | 地区          |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 国际版        |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中国          |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        或者使用中国端点：

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        当你想验证模型访问和成本跟踪，同时不影响你的常规会话时，
        使用隔离的状态目录：

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 响应应报告 `provider: "moonshot"` 和
        `model: "kimi-k2.6"`。当 Moonshot 返回使用量元数据时，
        assistant 转录条目会在 `usage.cost` 下存储规范化的
        token 使用量以及估算成本。
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
    **最适合：** 通过 Kimi Coding 端点执行以代码为中心的任务。

    <Note>
    Kimi Coding 使用不同于 Moonshot（`moonshot/...`）的 API 密钥和提供商前缀（`kimi/...`）。稳定的 API 模型引用是 `kimi/kimi-for-coding`；旧版引用 `kimi/kimi-code` 和 `kimi/k2p5` 仍可接受，并会规范化为该 API 模型 ID。
    </Note>

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
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

OpenClaw 还将 **Kimi** 作为 `web_search` 提供商随附提供，由 Moonshot Web 搜索支持。

<Steps>
  <Step title="运行交互式 Web 搜索设置">
    ```bash
    openclaw configure --section web
    ```

    在 Web 搜索部分选择 **Kimi**，以存储
    `plugins.entries.moonshot.config.webSearch.*`。

  </Step>
  <Step title="配置 Web 搜索区域和模型">
    交互式设置会提示：

    | 设置                | 选项                                                                 |
    | ------------------- | -------------------------------------------------------------------- |
    | API 区域            | `https://api.moonshot.ai/v1`（国际版）或 `https://api.moonshot.cn/v1`（中国） |
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
  <Accordion title="原生思考模式">
    Moonshot Kimi 支持二进制原生思考：

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    通过 `agents.defaults.models.<provider/model>.params` 按模型配置：

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

    OpenClaw 还会为 Moonshot 映射运行时 `/think` 级别：

    | `/think` 级别       | Moonshot 行为          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | 任何非 off 级别    | `thinking.type=enabled`    |

    <Warning>
    启用 Moonshot 思考时，`tool_choice` 必须为 `auto` 或 `none`。为保持兼容性，OpenClaw 会将不兼容的 `tool_choice` 值规范化为 `auto`。
    </Warning>

    Kimi K2.6 还接受可选的 `thinking.keep` 字段，用于控制
    `reasoning_content` 的多轮保留。将其设置为 `"all"` 可在轮次之间保留完整
    推理；省略它（或将其保留为 `null`）则使用服务器
    默认策略。OpenClaw 只会为
    `moonshot/kimi-k2.6` 转发 `thinking.keep`，并会从其他模型中移除它。

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
    Moonshot Kimi 提供的 tool_call ID 形如 `functions.<name>:<index>`。OpenClaw 会原样保留它们，因此多轮工具调用可以继续正常工作。

    若要在自定义 OpenAI 兼容提供商上强制严格清理，请设置 `sanitizeToolCallIds: true`：

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="流式用量兼容性">
    原生 Moonshot 端点（`https://api.moonshot.ai/v1` 和
    `https://api.moonshot.cn/v1`）会在共享的
    `openai-completions` 传输协议上声明流式用量兼容性。OpenClaw 会基于端点
    能力启用该行为，因此面向相同原生
    Moonshot 主机的兼容自定义提供商 ID 会继承相同的流式用量行为。

    使用内置 K2.6 定价时，包含输入、输出
    和缓存读取 token 的流式用量也会转换为本地估算的美元费用，用于
    `/status`、`/usage full`、`/usage cost`，以及基于转录记录的会话
    计费。

  </Accordion>

  <Accordion title="Endpoint and model ref reference">
    | 提供商   | 模型引用前缀 | 端点                      | 认证环境变量        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding 端点          | `KIMI_API_KEY`      |
    | Web 搜索 | N/A              | 与 Moonshot API 区域相同   | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY` |

    - Kimi Web 搜索使用 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，并默认使用 `https://api.moonshot.ai/v1` 和模型 `kimi-k2.6`。
    - 如有需要，可在 `models.providers` 中覆盖定价和上下文元数据。
    - 如果 Moonshot 为某个模型发布了不同的上下文限制，请相应调整 `contextWindow`。

  </Accordion>
</AccordionGroup>

## 相关

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
    Moonshot API 密钥管理和文档。
  </Card>
</CardGroup>
