---
read_when:
    - 你希望在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要进行简单的 `ZAI_API_KEY` 设置
summary: 在 OpenClaw 中使用 Z.AI（GLM 模型）
title: Z.AI
x-i18n:
    generated_at: "2026-07-11T20:54:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API key 进行身份验证。请在 Z.AI 控制台中创建你的 API key。
OpenClaw 通过 `zai` 提供商使用 Z.AI API key。

| 属性     | 值                                           |
| -------- | -------------------------------------------- |
| 提供商   | `zai`                                        |
| 软件包   | `@openclaw/zai-provider`                     |
| 身份验证 | `ZAI_API_KEY`（旧版别名：`Z_AI_API_KEY`）   |
| API      | Z.AI Chat Completions（Bearer 身份验证）     |

## GLM 模型

GLM 是一个模型系列，而不是独立的提供商。在 OpenClaw 中，GLM 模型使用
`zai/glm-5.2` 之类的引用：提供商为 `zai`，模型 ID 为 `glm-5.2`。

## 入门指南

首先安装提供商插件：

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="自动检测端点">
    **最适合：**大多数用户。OpenClaw 会使用你的 API key 探测受支持的 Z.AI 端点，并自动应用正确的基础 URL。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="验证模型已列出">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="明确指定区域端点">
    **最适合：**希望强制使用特定 Coding Plan 或通用 API 接口的用户。

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
      <Step title="验证模型已列出">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### 端点

| 新手引导选项        | 基础 URL                                      | 默认模型      |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` 会通过针对每个端点的 chat-completions API 探测你的密钥，自动检测这四个端点之一。它会先检查通用端点（`zai-global`，
然后是 `zai-cn`），再检查 Coding Plan 端点（`zai-coding-global`，然后是
`zai-coding-cn`），并在第一个接受请求的端点处停止。如果你的密钥在两类端点上都能使用，请通过明确指定 `--auth-choice` 来强制使用 Coding Plan 端点。

## 配置示例

<Tip>
`zai-api-key` 允许 OpenClaw 根据密钥检测匹配的 Z.AI 端点，并自动应用正确的基础 URL。如果你希望强制使用特定 Coding Plan 或通用 API 接口，请使用明确的区域选项。
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

`zai` 提供商插件在插件清单中随附其目录，因此只读列表无需加载提供商运行时，即可显示已知的 GLM 条目：

```bash
openclaw models list --all --provider zai
```

清单支持的目录目前包括：

| 模型引用             | 备注                            |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan 默认模型；1M 上下文 |
| `zai/glm-5.1`        | 通用 API 默认模型               |
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
GLM 模型以 `zai/<model>` 的形式提供（例如：`zai/glm-5`）。
</Tip>

<Note>
Coding Plan 设置默认使用 `zai/glm-5.2`；通用 API 设置则继续使用
`zai/glm-5.1`。在 Coding Plan 端点上，如果密钥或套餐未提供 GLM-5.2，自动检测会依次回退到
`glm-5.1` 和 `glm-4.7`。GLM 版本和可用性可能发生变化；请运行 `openclaw models list --all --provider zai`
查看你所安装版本已知的目录。
</Note>

## 思考级别

<Tabs>
  <Tab title="GLM-5.2">
    完整范围：`off`、`low`、`high`、`max`（默认为 `off`）。OpenClaw 通过请求负载中的 `reasoning_effort`，
    将 `low` 和 `high` 映射到 Z.AI 的 `high` 推理强度，并将 `max` 映射到 Z.AI 的
    `max` 强度。
  </Tab>
  <Tab title="其他 GLM 模型">
    仅支持二元切换：`off` 和 `low`（在选择器中显示为 `on`），默认为
    `off`。将思考设置为 `off` 会发送 `thinking: { type: "disabled" }`；
    任何其他级别都不会修改请求负载（将应用 Z.AI 自身的默认推理行为）。
  </Tab>
</Tabs>

将思考设置为 `off` 可避免响应在显示可见文本之前，将输出预算消耗在
`reasoning_content` 上。

## 高级配置

<AccordionGroup>
  <Accordion title="前向解析未知的 GLM-5 模型">
    当 ID 符合当前 GLM-5 系列的格式时，未知的 `glm-5*` ID 仍会在提供商路径上进行前向解析，方法是根据 `glm-4.7` 模板合成由提供商所有的元数据。
  </Accordion>

  <Accordion title="工具调用流式传输">
    Z.AI 工具调用流式传输默认启用 `tool_stream`。若要将其禁用：

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

  <Accordion title="保留思考内容">
    保留思考内容是可选功能，因为 Z.AI 要求重放完整的历史
    `reasoning_content`，这会增加提示词 token 数量。可按模型启用：

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

    启用并开启思考后，OpenClaw 会发送
    `thinking: { type: "enabled", clear_thinking: false }`，并为同一份 OpenAI 兼容对话记录重放之前的
    `reasoning_content`。蛇形命名的 `preserve_thinking` 参数键也可用作别名。

    高级用户仍可通过 `params.extra_body.thinking` 覆盖确切的提供商负载。

  </Accordion>

  <Accordion title="图像理解">
    Z.AI 插件会注册图像理解功能。

    | 属性          | 值          |
    | ------------- | ----------- |
    | 模型          | `glm-4.6v`  |

    图像理解会根据已配置的 Z.AI 身份验证信息自动解析，无需额外配置。

  </Accordion>

  <Accordion title="身份验证详情">
    - Z.AI 使用你的 API key 进行 Bearer 身份验证。
    - `zai-api-key` 新手引导选项会使用你的密钥探测受支持的端点，从而自动检测匹配的 Z.AI 端点。
    - 如果你希望强制使用特定 API 接口，请使用明确的区域选项（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。
    - 旧版环境变量 `Z_AI_API_KEY` 仍然受支持；如果未设置 `ZAI_API_KEY`，OpenClaw 会在启动时将其复制到 `ZAI_API_KEY`。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置架构，包括提供商和模型设置。
  </Card>
</CardGroup>
