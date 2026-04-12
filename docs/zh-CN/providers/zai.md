---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要一个简单的 `ZAI_API_KEY` 设置
summary: 使用 Z.AI（GLM 模型）与 OpenClaw 配合使用
title: Z.AI
x-i18n:
    generated_at: "2026-04-12T11:08:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 972b467dab141c8c5126ac776b7cb6b21815c27da511b3f34e12bd9e9ac953b7
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API 密钥
进行身份验证。在 Z.AI 控制台中创建你的 API 密钥。OpenClaw 使用 `zai` 提供商
和 Z.AI API 密钥。

- 提供商：`zai`
- 凭证：`ZAI_API_KEY`
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
    **最适合：** 想要强制使用特定 Coding Plan 或通用 API 接口的用户。

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

## 内置 GLM 目录

OpenClaw 目前为内置 `zai` 提供商预置了以下内容：

| Model ref            | 说明     |
| -------------------- | -------- |
| `zai/glm-5.1`        | 默认模型 |
| `zai/glm-5`          |          |
| `zai/glm-5-turbo`    |          |
| `zai/glm-5v-turbo`   |          |
| `zai/glm-4.7`        |          |
| `zai/glm-4.7-flash`  |          |
| `zai/glm-4.7-flashx` |          |
| `zai/glm-4.6`        |          |
| `zai/glm-4.6v`       |          |
| `zai/glm-4.5`        |          |
| `zai/glm-4.5-air`    |          |
| `zai/glm-4.5-flash`  |          |
| `zai/glm-4.5v`       |          |

<Tip>
GLM 模型可用 `zai/<model>` 的形式使用（例如：`zai/glm-5`）。默认内置模型引用是 `zai/glm-5.1`。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="前向解析未知的 GLM-5 模型">
    未知的 `glm-5*` id 仍会在内置提供商路径上执行前向解析：
    当该 id 符合当前 GLM-5 系列的形态时，
    系统会基于 `glm-4.7` 模板合成提供商自有元数据。
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

  <Accordion title="图像理解">
    内置 Z.AI 插件已注册图像理解能力。

    | Property      | Value       |
    | ------------- | ----------- |
    | 模型          | `glm-4.6v`  |

    图像理解会根据已配置的 Z.AI 凭证自动解析——
    无需额外配置。

  </Accordion>

  <Accordion title="凭证详情">
    - Z.AI 使用你的 API 密钥进行 Bearer 身份验证。
    - `zai-api-key` 新手引导选项会根据密钥前缀自动检测匹配的 Z.AI 端点。
    - 当你想强制使用特定 API 接口时，请使用显式区域选项（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="GLM 模型家族" href="/zh-CN/providers/glm" icon="microchip">
    GLM 的模型家族概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
</CardGroup>
