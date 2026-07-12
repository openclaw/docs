---
read_when:
    - 你想将 Chutes 与 OpenClaw 搭配使用
    - 你需要 OAuth 或 API key 设置路径
    - 你想要默认模型、别名或发现行为
summary: Chutes 设置（OAuth 或 API 密钥、模型发现、别名）
title: Chutes
x-i18n:
    generated_at: "2026-07-11T20:52:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) 通过兼容 OpenAI 的 API 提供开源模型目录。OpenClaw 同时支持浏览器 OAuth 和 API 密钥身份验证。

| 属性             | 值                                                      |
| ---------------- | ------------------------------------------------------- |
| 提供商           | `chutes`                                                |
| 插件             | 官方外部软件包（`@openclaw/chutes-provider`）           |
| API              | 兼容 OpenAI                                             |
| 基础 URL         | `https://llm.chutes.ai/v1`                              |
| 身份验证         | OAuth 或 API 密钥（见下文）                             |
| 运行时环境变量   | `CHUTES_API_KEY`、`CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` 可直接提供已获取的 OAuth 访问令牌（例如在 CI 中），从而绕过下方的交互式浏览器流程。

## 安装插件

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## 入门指南

两种方式都会将默认模型设置为 `chutes/zai-org/GLM-4.7-TEE`，并注册 Chutes 模型目录。

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="运行 OAuth 新手引导流程">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw 会在本地启动浏览器流程；在远程或无头主机上，则会显示 URL，并要求粘贴重定向结果。OAuth 令牌会通过 OpenClaw 身份验证配置文件自动刷新。
      </Step>
    </Steps>
  </Tab>
  <Tab title="API 密钥">
    <Steps>
      <Step title="获取 API 密钥">
        在 [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys) 创建密钥。
      </Step>
      <Step title="运行 API 密钥新手引导流程">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 发现行为

当 Chutes 身份验证可用时，OpenClaw 会使用相应凭据查询 `GET /v1/models`，使用发现的模型，并按凭据缓存 5 分钟。对于已过期或未获授权的密钥（HTTP 401），OpenClaw 会在不提供凭据的情况下重试一次。如果发现操作仍未返回任何记录、执行失败或返回任何其他非 2xx 状态，则会回退到内置静态目录（API 密钥和 OAuth 发现均使用同一路径）。如果启动时发现失败，将自动使用静态目录。

## 默认别名

OpenClaw 为 Chutes 模型目录注册了三个便捷别名：

| 别名            | 目标模型                                              |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 内置入门目录

内置回退目录包含 47 个模型。以下是当前模型引用的部分代表性示例：

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
  <Accordion title="OAuth 覆盖设置">
    使用可选环境变量自定义 OAuth 流程：

    | 变量 | 用途 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth 客户端 ID（未设置时会提示输入） |
    | `CHUTES_CLIENT_SECRET` | OAuth 客户端密钥 |
    | `CHUTES_OAUTH_REDIRECT_URI` | 重定向 URI（默认为 `http://127.0.0.1:1456/oauth-callback`） |
    | `CHUTES_OAUTH_SCOPES` | 以空格分隔的权限范围（默认为 `openid profile chutes:invoke`） |

    有关重定向应用的要求和帮助，请参阅 [Chutes OAuth 文档](https://chutes.ai/docs/sign-in-with-chutes/overview)。

  </Accordion>

  <Accordion title="注意事项">
    - Chutes 模型注册为 `chutes/<model-id>`。
    - Chutes 在流式传输期间不报告令牌用量（`supportsUsageInStreaming: false`）；流式传输完成后仍会显示用量总计。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商规则、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的配置架构，包括提供商设置。
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes 控制面板和 API 文档。
  </Card>
  <Card title="Chutes API 密钥" href="https://chutes.ai/settings/api-keys" icon="key">
    创建和管理 Chutes API 密钥。
  </Card>
</CardGroup>
