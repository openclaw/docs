---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要一个简单的 ZAI_API_KEY 设置
summary: 在 OpenClaw 中使用 Z.AI（GLM 模型）
title: Z.AI
x-i18n:
    generated_at: "2026-04-28T12:03:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API key
进行身份认证。请在 Z.AI 控制台中创建你的 API key。OpenClaw 使用 `zai` 提供商
以及 Z.AI API key。

- 提供商：`zai`
- 认证：`ZAI_API_KEY`
- API：Z.AI Chat Completions（Bearer 认证）

## 入门指南

<Tabs>
  <Tab title="Auto-detect endpoint">
    **最适合：** 大多数用户。OpenClaw 会从 key 检测匹配的 Z.AI endpoint，并自动应用正确的 base URL。

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **最适合：** 想要强制使用特定 Coding Plan 或通用 API 表面的用户。

    <Steps>
      <Step title="Pick the right onboarding choice">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 内置目录

OpenClaw 目前为内置的 `zai` 提供商预置：

| 模型引用             | 备注       |
| -------------------- | ---------- |
| `zai/glm-5.1`        | 默认模型   |
| `zai/glm-5`          |            |
| `zai/glm-5-turbo`    |            |
| `zai/glm-5v-turbo`   |            |
| `zai/glm-4.7`        |            |
| `zai/glm-4.7-flash`  |            |
| `zai/glm-4.7-flashx` |            |
| `zai/glm-4.6`        |            |
| `zai/glm-4.6v`       |            |
| `zai/glm-4.5`        |            |
| `zai/glm-4.5-air`    |            |
| `zai/glm-4.5-flash`  |            |
| `zai/glm-4.5v`       |            |

<Tip>
GLM 模型可用作 `zai/<model>`（示例：`zai/glm-5`）。默认内置模型引用是 `zai/glm-5.1`。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    未知的 `glm-5*` id 仍会在内置提供商路径上向前解析：
    当 id 匹配当前 GLM-5 系列形态时，会基于 `glm-4.7` 模板
    合成由提供商拥有的元数据。
  </Accordion>

  <Accordion title="Tool-call streaming">
    Z.AI 工具调用流式传输默认启用 `tool_stream`。要禁用它：

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

  <Accordion title="Thinking and preserved thinking">
    Z.AI thinking 遵循 OpenClaw 的 `/think` 控制。关闭 thinking 时，
    OpenClaw 会发送 `thinking: { type: "disabled" }`，以避免响应在可见文本之前
    将输出预算消耗在 `reasoning_content` 上。

    preserved thinking 是可选启用的，因为 Z.AI 要求回放完整历史
    `reasoning_content`，这会增加 prompt token。按模型启用：

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

    启用后且 thinking 开启时，OpenClaw 会发送
    `thinking: { type: "enabled", clear_thinking: false }`，并为同一个兼容 OpenAI 的 transcript 回放之前的
    `reasoning_content`。

    高级用户仍可通过 `params.extra_body.thinking` 覆盖确切的提供商 payload。

  </Accordion>

  <Accordion title="Image understanding">
    内置 Z.AI 插件会注册图像理解能力。

    | 属性          | 值          |
    | ------------- | ----------- |
    | 模型          | `glm-4.6v`  |

    图像理解会根据配置的 Z.AI 认证自动解析，不需要
    额外配置。

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI 使用你的 API key 进行 Bearer 认证。
    - `zai-api-key` 新手引导选项会根据 key 前缀自动检测匹配的 Z.AI endpoint。
    - 当你想要强制使用特定 API 表面时，请使用显式区域选项（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="GLM model family" href="/zh-CN/providers/glm" icon="microchip">
    GLM 的模型系列概览。
  </Card>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
</CardGroup>
