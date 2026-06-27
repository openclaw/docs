---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要一个简单的 ZAI_API_KEY 设置
summary: 使用 Z.AI（GLM 模型）搭配 OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T03:12:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API key 进行认证。请在 Z.AI 控制台中创建你的 API key。OpenClaw 使用 `zai` 提供商和 Z.AI API key。

| 属性 | 值                                           |
| -------- | -------------------------------------------- |
| 提供商 | `zai`                                        |
| 包  | `@openclaw/zai-provider`                     |
| 认证     | `ZAI_API_KEY`（旧版别名：`Z_AI_API_KEY`） |
| API      | Z.AI Chat Completions（Bearer 认证）          |

## GLM 模型

GLM 是一个模型家族，不是单独的提供商。在 OpenClaw 中，GLM 模型使用类似 `zai/glm-5.2` 的引用：提供商 `zai`，模型 ID `glm-5.2`。

## 入门指南

先安装提供商插件：

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **最适合：** 大多数用户。OpenClaw 会使用你的 API key 探测受支持的 Z.AI 端点，并自动应用正确的 base URL。

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
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
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 配置示例

<Tip>
`zai-api-key` 让 OpenClaw 根据 key 检测匹配的 Z.AI 端点，并自动应用正确的 base URL。当你想要强制使用特定 Coding Plan 或通用 API 表面时，请使用明确的区域选项。
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## 内置目录

`zai` 提供商插件会在插件清单中随附其目录，因此只读列表可以在不加载提供商运行时的情况下显示已知的 GLM 行：

```bash
openclaw models list --all --provider zai
```

基于清单的目录目前包括：

| 模型引用            | 说明                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan 默认值；1M 上下文 |
| `zai/glm-5.1`        | 通用 API 默认值             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
GLM 模型可通过 `zai/<model>` 使用（示例：`zai/glm-5`）。
</Tip>

<Tip>
GLM-5.2 支持 `off`、`low`、`high` 和 `max` 思考级别。OpenClaw 将 `low` 和 `high` 映射到 Z.AI 高推理强度，并将 `max` 映射到最大强度。
</Tip>

<Note>
Coding Plan 设置默认使用 `zai/glm-5.2`；通用 API 设置保留 `zai/glm-5.1`。当所选计划未提供 GLM-5.2 时，端点自动检测会回退到 `glm-5.1` 或 `glm-4.7`。GLM 版本和可用性可能会变化；运行 `openclaw models list --all --provider zai` 查看你的已安装版本已知的目录。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    未知的 `glm-5*` ID 仍会在提供商路径上向前解析：当 ID 匹配当前 GLM-5 家族形态时，会从 `glm-4.7` 模板合成提供商拥有的元数据。
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
    Z.AI 思考遵循 OpenClaw 的 `/think` 控制。关闭思考时，OpenClaw 会发送 `thinking: { type: "disabled" }`，以避免响应在可见文本之前将输出预算花在 `reasoning_content` 上。

    保留思考是可选开启的，因为 Z.AI 要求重放完整的历史 `reasoning_content`，这会增加提示词 token。按模型启用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    启用后且思考开启时，OpenClaw 会发送 `thinking: { type: "enabled", clear_thinking: false }`，并为同一个 OpenAI 兼容转录重放先前的 `reasoning_content`。

    高级用户仍然可以使用 `params.extra_body.thinking` 覆盖确切的提供商载荷。

  </Accordion>

  <Accordion title="Image understanding">
    Z.AI 插件注册了图像理解能力。

    | 属性      | 值       |
    | ------------- | ----------- |
    | 模型         | `glm-4.6v`  |

    图像理解会从配置的 Z.AI 认证自动解析，不需要额外配置。

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI 使用你的 API key 进行 Bearer 认证。
    - `zai-api-key` 新手引导选项会使用你的 key 探测受支持的端点，从而自动检测匹配的 Z.AI 端点。
    - 当你想要强制使用特定 API 表面时，请使用明确的区域选项（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。
    - 旧版环境变量 `Z_AI_API_KEY` 仍被接受；如果未设置 `ZAI_API_KEY`，OpenClaw 会在启动时将其复制到 `ZAI_API_KEY`。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置架构，包括提供商和模型设置。
  </Card>
</CardGroup>
