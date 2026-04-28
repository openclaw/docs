---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要一个简单的 `ZAI_API_KEY` 设置
summary: 在 OpenClaw 中使用 Z.AI（GLM 模型）
title: Z.AI
x-i18n:
    generated_at: "2026-04-26T03:53:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API 密钥进行身份验证。请在 Z.AI 控制台中创建你的 API 密钥。OpenClaw 使用 `zai` 提供商和 Z.AI API 密钥。

- 提供商：`zai`
- 身份验证：`ZAI_API_KEY`
- API：Z.AI Chat Completions（Bearer 身份验证）

## 入门指南

<Tabs>
  <Tab title="自动检测端点">
    **最适合：** 大多数用户。OpenClaw 会根据密钥检测匹配的 Z.AI 端点，并自动应用正确的基础 URL。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="显式区域端点">
    **最适合：** 想要强制使用特定 Coding Plan 或通用 API 界面的用户。

    <Steps>
      <Step title="选择正确的新手引导选项">
        ```bash
        # Coding Plan Global（推荐给 Coding Plan 用户）
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN（中国区域）
        openclaw onboard --auth-choice zai-coding-cn

        # 通用 API
        openclaw onboard --auth-choice zai-global

        # 通用 API CN（中国区域）
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 内置目录

OpenClaw 当前为内置的 `zai` 提供商预置了：

| 模型引用 | 说明 |
| -------------------- | ------------- |
| `zai/glm-5.1`        | 默认模型 |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
GLM 模型可用作 `zai/<model>`（例如：`zai/glm-5`）。默认内置模型引用为 `zai/glm-5.1`。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="前向解析未知的 GLM-5 模型">
    未知的 `glm-5*` ID 在匹配当前 GLM-5 系列形态时，仍会在内置提供商路径上通过从 `glm-4.7` 模板合成提供商自有元数据来进行前向解析。
  </Accordion>

  <Accordion title="工具调用流式传输">
    默认启用 `tool_stream` 用于 Z.AI 工具调用流式传输。要禁用它：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Thinking 和保留 Thinking">
    Z.AI 的 Thinking 遵循 OpenClaw 的 `/think` 控制。在关闭 Thinking 时，OpenClaw 会发送 `thinking: { type: "disabled" }`，以避免响应在可见文本之前把输出预算花在 `reasoning_content` 上。

    保留 Thinking 是可选启用的，因为 Z.AI 要求重放完整的历史 `reasoning_content`，这会增加提示词 token。请按模型启用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    启用后且 Thinking 打开时，OpenClaw 会发送
    `thinking: { type: "enabled", clear_thinking: false }`，并为同一个兼容 OpenAI 的转录重放先前的 `reasoning_content`。

    高级用户仍然可以通过 `params.extra_body.thinking` 覆盖精确的提供商负载。

  </Accordion>

  <Accordion title="图像理解">
    内置的 Z.AI 插件注册了图像理解能力。

    | 属性 | 值 |
    | ------------- | ----------- |
    | 模型 | `glm-4.6v`  |

    图像理解会根据已配置的 Z.AI 身份验证自动解析——不需要额外配置。

  </Accordion>

  <Accordion title="身份验证详情">
    - Z.AI 使用你的 API 密钥进行 Bearer 身份验证。
    - `zai-api-key` 新手引导选项会根据密钥前缀自动检测匹配的 Z.AI 端点。
    - 当你想强制使用特定 API 界面时，请使用显式区域选项（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="GLM 模型家族" href="/zh-CN/providers/glm" icon="microchip">
    GLM 的模型家族概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
</CardGroup>
