---
read_when:
    - 你想在 OpenClaw 中使用 Chutes
    - 你需要 OAuth 或 API 密钥设置路径
    - 你想了解默认模型、别名或发现行为
summary: Chutes 设置（OAuth 或 API 密钥、模型发现、别名）
title: Chutes
x-i18n:
    generated_at: "2026-04-12T10:26:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07c52b1d1d2792412e6daabc92df5310434b3520116d9e0fd2ad26bfa5297e1c
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) 通过与 OpenAI 兼容的 API 提供开源模型目录。OpenClaw 支持内置 `chutes` 提供商的浏览器 OAuth 和直接 API 密钥认证。

| 属性 | 值 |
| -------- | ---------------------------- |
| 提供商 | `chutes` |
| API | 与 OpenAI 兼容 |
| Base URL | `https://llm.chutes.ai/v1` |
| 认证 | OAuth 或 API 密钥（见下文） |

## 入门指南

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="运行 OAuth 新手引导流程">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw 会在本地启动浏览器流程，或者在远程 / 无头主机上显示 URL + 粘贴重定向地址的流程。OAuth 令牌会通过 OpenClaw 认证配置文件自动刷新。
      </Step>
      <Step title="验证默认模型">
        完成新手引导后，默认模型会设置为
        `chutes/zai-org/GLM-4.7-TEE`，并注册内置的 Chutes 目录。
      </Step>
    </Steps>
  </Tab>
  <Tab title="API 密钥">
    <Steps>
      <Step title="获取 API 密钥">
        在
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
        创建一个密钥。
      </Step>
      <Step title="运行 API 密钥新手引导流程">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="验证默认模型">
        完成新手引导后，默认模型会设置为
        `chutes/zai-org/GLM-4.7-TEE`，并注册内置的 Chutes 目录。
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
两种认证路径都会注册内置的 Chutes 目录，并将默认模型设置为
`chutes/zai-org/GLM-4.7-TEE`。运行时环境变量：`CHUTES_API_KEY`、
`CHUTES_OAUTH_TOKEN`。
</Note>

## 发现行为

当 Chutes 认证可用时，OpenClaw 会使用该凭证查询 Chutes 目录，并使用发现到的模型。如果发现失败，OpenClaw 会回退到内置的静态目录，以确保新手引导和启动仍然可用。

## 默认别名

OpenClaw 为内置的 Chutes 目录注册了三个便捷别名：

| 别名 | 目标模型 |
| --------------- | ----------------------------------------------------- |
| `chutes-fast` | `chutes/zai-org/GLM-4.7-FP8` |
| `chutes-pro` | `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 内置起始目录

内置的回退目录包含当前的 Chutes 引用：

| 模型引用 |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE` |
| `chutes/zai-org/GLM-5-TEE` |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE` |
| `chutes/moonshotai/Kimi-K2.5-TEE` |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE` |
| `chutes/openai/gpt-oss-120b-TEE` |

## 配置示例

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth 覆盖项">
    你可以使用可选环境变量自定义 OAuth 流程：

    | 变量 | 用途 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | 自定义 OAuth 客户端 ID |
    | `CHUTES_CLIENT_SECRET` | 自定义 OAuth 客户端密钥 |
    | `CHUTES_OAUTH_REDIRECT_URI` | 自定义重定向 URI |
    | `CHUTES_OAUTH_SCOPES` | 自定义 OAuth 作用域 |

    有关重定向应用要求和帮助，请参阅 [Chutes OAuth 文档](https://chutes.ai/docs/sign-in-with-chutes/overview)。

  </Accordion>

  <Accordion title="说明">
    - API 密钥和 OAuth 发现都使用相同的 `chutes` 提供商 id。
    - Chutes 模型会注册为 `chutes/<model-id>`。
    - 如果启动时发现失败，会自动使用内置静态目录。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商规则、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的配置 schema，包括提供商设置。
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes 控制台和 API 文档。
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    创建和管理 Chutes API 密钥。
  </Card>
</CardGroup>
