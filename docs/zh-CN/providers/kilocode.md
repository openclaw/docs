---
read_when:
    - 你想用一个 API 密钥访问多个 LLM
    - 你想在 OpenClaw 中通过 Kilo Gateway 网关运行模型
summary: 使用 Kilo Gateway 网关的统一 API 在 OpenClaw 中访问多种模型
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T03:05:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway 网关提供一个**统一 API**，可通过单一端点和 API key 将请求路由到多个模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换基础 URL 即可工作。

| 属性 | 值                                 |
| -------- | ---------------------------------- |
| 提供商 | `kilocode`                         |
| 凭证     | `KILOCODE_API_KEY`                 |
| API      | 与 OpenAI 兼容                  |
| 基础 URL | `https://api.kilo.ai/api/gateway/` |

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="Create an account">
    前往 [app.kilo.ai](https://app.kilo.ai)，登录或创建账号，然后导航到 API Keys 并生成一个新密钥。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    或者直接设置环境变量：

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## 默认模型

默认模型是 `kilocode/kilo/auto`，这是由 Kilo Gateway 网关管理、提供商拥有的智能路由模型。

<Note>
OpenClaw 将 `kilocode/kilo/auto` 视为稳定的默认引用，但不会为该路由发布有来源依据的任务到上游模型映射。`kilocode/kilo/auto` 背后的确切上游路由归 Kilo Gateway 网关所有，而不是硬编码在 OpenClaw 中。
</Note>

## 内置目录

OpenClaw 会在启动时从 Kilo Gateway 网关动态发现可用模型。使用 `/models kilocode` 查看你的账号可用的完整模型列表。

网关上可用的任何模型都可以使用 `kilocode/` 前缀：

| 模型引用                                 | 说明                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | 默认 — 智能路由            |
| `kilocode/anthropic/claude-sonnet-4`     | 通过 Kilo 使用 Anthropic                 |
| `kilocode/openai/gpt-5.5`                | 通过 Kilo 使用 OpenAI                    |
| `kilocode/google/gemini-3.1-pro-preview` | 通过 Kilo 使用 Google                    |
| ……以及更多                         | 使用 `/models kilocode` 列出全部 |

<Tip>
启动时，OpenClaw 会查询 `GET https://api.kilo.ai/api/gateway/models`，并将发现的模型合并到静态回退目录之前。静态回退始终包含 `kilocode/kilo/auto`（`Kilo Auto`），并带有 `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000` 和 `maxTokens: 128000`。
</Tip>

## 配置示例

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Kilo Gateway 网关在源码中记录为与 OpenRouter 兼容，因此它保留在代理式 OpenAI 兼容路径上，而不是使用原生 OpenAI 请求整形。

    - 由 Gemini 支持的 Kilo 引用保留在代理 Gemini 路径上，因此 OpenClaw 会在那里保留 Gemini 思考签名清理，而不会启用原生 Gemini 重放验证或引导重写。
    - Kilo Gateway 网关在底层使用带有你的 API key 的 Bearer token。

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    Kilo 的共享流包装器会添加提供商应用标头，并为受支持的具体模型引用规范化代理推理负载。

    <Warning>
    `kilocode/kilo/auto` 和其他不支持代理推理的提示会跳过推理注入。如果你需要推理支持，请使用具体模型引用，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - 如果启动时模型发现失败，OpenClaw 会回退到包含 `kilocode/kilo/auto` 的静态目录。
    - 确认你的 API key 有效，并且你的 Kilo 账号已启用所需模型。
    - 当 Gateway 网关作为守护进程运行时，确保 `KILOCODE_API_KEY` 对该进程可用（例如位于 `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供）。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置参考。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 网关仪表板、API key 和账号管理。
  </Card>
</CardGroup>
