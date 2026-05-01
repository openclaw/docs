---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要一个简单的 ZAI_API_KEY 设置
summary: 在 OpenClaw 中使用 Z.AI（GLM 模型）
title: Z.AI
x-i18n:
    generated_at: "2026-05-01T13:14:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API key 进行身份验证。请在 Z.AI 控制台创建你的 API key。OpenClaw 使用带有 Z.AI API key 的 `zai` provider。

- 提供商：`zai`
- 身份验证：`ZAI_API_KEY`
- API：Z.AI Chat Completions（Bearer 身份验证）

## 入门指南

<Tabs>
  <Tab title="自动检测端点">
    **最适合：** 大多数用户。OpenClaw 会根据密钥检测匹配的 Z.AI 端点，并自动应用正确的 base URL。

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
      <Step title="验证模型已列出">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="显式区域端点">
    **最适合：** 想要强制使用特定 Coding Plan 或通用 API 表面的用户。

    <Steps>
      <Step title="选择正确的新手引导选项">
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
      <Step title="设置默认模型">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="验证模型已列出">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 内置目录

OpenClaw 会在插件清单中随附内置的 `zai` provider 目录，因此只读列表可以在不加载提供商运行时的情况下显示已知的 GLM 行：

```bash
openclaw models list --all --provider zai
```

基于清单的目录当前包含：

| 模型引用             | 备注         |
| -------------------- | ------------ |
| `zai/glm-5.1`        | 默认模型     |
| `zai/glm-5`          |              |
| `zai/glm-5-turbo`    |              |
| `zai/glm-5v-turbo`   |              |
| `zai/glm-4.7`        |              |
| `zai/glm-4.7-flash`  |              |
| `zai/glm-4.7-flashx` |              |
| `zai/glm-4.6`        |              |
| `zai/glm-4.6v`       |              |
| `zai/glm-4.5`        |              |
| `zai/glm-4.5-air`    |              |
| `zai/glm-4.5-flash`  |              |
| `zai/glm-4.5v`       |              |

<Tip>
GLM 模型可作为 `zai/<model>` 使用（示例：`zai/glm-5`）。默认内置模型引用是 `zai/glm-5.1`。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="向前解析未知 GLM-5 模型">
    未知的 `glm-5*` ID 仍会在内置提供商路径上向前解析：当 ID 匹配当前 GLM-5 系列形态时，会从 `glm-4.7` 模板合成提供商拥有的元数据。
  </Accordion>

  <Accordion title="工具调用流式传输">
    Z.AI 工具调用流式传输默认启用 `tool_stream`。若要禁用它：

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

  <Accordion title="思考和保留思考">
    Z.AI 思考遵循 OpenClaw 的 `/think` 控制。关闭思考时，OpenClaw 会发送 `thinking: { type: "disabled" }`，以避免响应在可见文本之前将输出预算消耗在 `reasoning_content` 上。

    保留思考是选择启用的，因为 Z.AI 要求重放完整的历史 `reasoning_content`，这会增加提示词 token。请按模型启用：

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

    启用后且思考处于开启状态时，OpenClaw 会发送 `thinking: { type: "enabled", clear_thinking: false }`，并为同一个 OpenAI 兼容对话记录重放先前的 `reasoning_content`。

    高级用户仍可使用 `params.extra_body.thinking` 覆盖确切的提供商载荷。

  </Accordion>

  <Accordion title="图像理解">
    内置的 Z.AI 插件会注册图像理解。

    | 属性          | 值          |
    | ------------- | ----------- |
    | 模型          | `glm-4.6v`  |

    图像理解会从已配置的 Z.AI 身份验证自动解析，无需额外配置。

  </Accordion>

  <Accordion title="身份验证详情">
    - Z.AI 使用你的 API key 进行 Bearer 身份验证。
    - `zai-api-key` 新手引导选项会根据密钥前缀自动检测匹配的 Z.AI 端点。
    - 当你想要强制使用特定 API 表面时，请使用显式区域选项（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="GLM 模型系列" href="/zh-CN/providers/glm" icon="microchip">
    GLM 的模型系列概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
</CardGroup>
