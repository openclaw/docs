---
read_when:
    - 你想将 Chutes 与 OpenClaw 搭配使用
    - 你需要 OAuth 或 API 密钥设置路径
    - 你需要默认模型、别名或设备发现行为
summary: Chutes 设置（OAuth 或 API 密钥、模型发现、别名）
title: Chutes
x-i18n:
    generated_at: "2026-07-05T11:35:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) 通过兼容 OpenAI 的 API 暴露开源模型目录。OpenClaw 同时支持浏览器 OAuth 和 API 密钥认证。

| 属性             | 值                                                      |
| ---------------- | ------------------------------------------------------- |
| 提供商           | `chutes`                                                |
| 插件             | 官方外部软件包（`@openclaw/chutes-provider`）           |
| API              | 兼容 OpenAI                                            |
| 基础 URL         | `https://llm.chutes.ai/v1`                              |
| 认证             | OAuth 或 API 密钥（见下文）                             |
| 运行时环境变量   | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` 会直接提供已获取的 OAuth 访问令牌（例如在 CI 中），从而跳过下面的交互式浏览器流程。

## 安装插件

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## 入门指南

两种路径都会将默认模型设为 `chutes/zai-org/GLM-4.7-TEE`，并注册 Chutes 目录。

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run the OAuth onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw 会在本地启动浏览器流程，或在远程/无头主机上显示 URL + 重定向粘贴流程。OAuth 令牌会通过 OpenClaw 认证配置自动刷新。
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get an API key">
        在
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
        创建密钥。
      </Step>
      <Step title="Run the API key onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 发现行为

当 Chutes 认证可用时，OpenClaw 会使用该凭证查询 `GET /v1/models`，并使用发现到的模型；缓存按每个凭证保存 5 分钟。对于已过期/未授权的密钥（HTTP 401），OpenClaw 会不带凭证重试一次。如果发现仍然没有返回任何行、失败，或返回任何其他非 2xx 状态，它会回退到内置静态目录（API 密钥和 OAuth 发现都使用同一路径）。如果启动时发现失败，会自动使用静态目录。

## 默认别名

OpenClaw 为 Chutes 目录注册了三个便捷别名：

| 别名            | 目标模型                                              |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 内置起始目录

内置回退目录包含 47 个模型。当前引用的代表性示例：

| 模型引用                                              |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

运行 `openclaw models list --all --provider chutes` 查看完整列表。

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
  <Accordion title="OAuth overrides">
    使用可选环境变量自定义 OAuth 流程：

    | 变量 | 用途 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth 客户端 id（未设置时会提示输入） |
    | `CHUTES_CLIENT_SECRET` | OAuth 客户端密钥 |
    | `CHUTES_OAUTH_REDIRECT_URI` | 重定向 URI（默认 `http://127.0.0.1:1456/oauth-callback`） |
    | `CHUTES_OAUTH_SCOPES` | 以空格分隔的权限范围（默认 `openid profile chutes:invoke`） |

    有关重定向应用要求和帮助，请参阅 [Chutes OAuth 文档](https://chutes.ai/docs/sign-in-with-chutes/overview)。

  </Accordion>

  <Accordion title="Notes">
    - Chutes 模型注册为 `chutes/<model-id>`。
    - Chutes 在流式传输时不会报告令牌用量（`supportsUsageInStreaming: false`）；流完成后仍会显示用量总计。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商规则、模型引用和故障转移行为。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference" icon="gear">
    包含提供商设置的完整配置架构。
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes 仪表板和 API 文档。
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    创建和管理 Chutes API 密钥。
  </Card>
</CardGroup>
