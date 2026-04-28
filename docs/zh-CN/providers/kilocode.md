---
read_when:
    - 你想为多个 LLM 使用一个 API 密钥
    - 你想在 OpenClaw 中通过 Kilo Gateway 网关运行模型
summary: 使用 Kilo Gateway 网关的统一 API 在 OpenClaw 中访问多个模型
title: Kilocode
x-i18n:
    generated_at: "2026-04-28T12:01:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway 网关

Kilo Gateway 网关提供一个**统一 API**，可通过单个端点和 API 密钥将请求路由到多个模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换基础 URL 即可使用。

| 属性 | 值                              |
| -------- | ---------------------------------- |
| 提供商 | `kilocode`                         |
| 认证     | `KILOCODE_API_KEY`                 |
| API      | 兼容 OpenAI                  |
| 基础 URL | `https://api.kilo.ai/api/gateway/` |

## 入门指南

<Steps>
  <Step title="创建账号">
    前往 [app.kilo.ai](https://app.kilo.ai)，登录或创建账号，然后导航到 API Keys 并生成一个新密钥。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    或直接设置环境变量：

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## 默认模型

默认模型是 `kilocode/kilo/auto`，这是由 Kilo Gateway 网关管理的提供商自有智能路由模型。

<Note>
OpenClaw 将 `kilocode/kilo/auto` 视为稳定的默认引用，但不会为该路由发布基于来源的任务到上游模型映射。`kilocode/kilo/auto` 背后的确切上游路由由 Kilo Gateway 网关拥有，而不是硬编码在 OpenClaw 中。
</Note>

## 内置目录

OpenClaw 会在启动时从 Kilo Gateway 网关动态发现可用模型。使用 `/models kilocode` 查看你的账号可用的完整模型列表。

Gateway 网关上可用的任何模型都可以使用 `kilocode/` 前缀：

| 模型引用                              | 备注                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | 默认 - 智能路由            |
| `kilocode/anthropic/claude-sonnet-4`   | 通过 Kilo 使用 Anthropic                 |
| `kilocode/openai/gpt-5.5`              | 通过 Kilo 使用 OpenAI                    |
| `kilocode/google/gemini-3-pro-preview` | 通过 Kilo 使用 Google                    |
| ...以及更多                       | 使用 `/models kilocode` 列出全部 |

<Tip>
启动时，OpenClaw 会查询 `GET https://api.kilo.ai/api/gateway/models`，并将发现的模型合并到静态备用目录之前。内置备用目录始终包含 `kilocode/kilo/auto`（`Kilo Auto`），其配置为 `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000` 和 `maxTokens: 128000`。
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
  <Accordion title="传输协议和兼容性">
    Kilo Gateway 网关在源码中记录为兼容 OpenRouter，因此它会走代理式 OpenAI 兼容路径，而不是原生 OpenAI 请求成形。

    - 基于 Gemini 的 Kilo 引用会保留在代理 Gemini 路径上，因此 OpenClaw 会在那里保留 Gemini 思维签名清理，而不会启用原生 Gemini 重放验证或引导重写。
    - Kilo Gateway 网关在底层使用带有你的 API 密钥的 Bearer 令牌。

  </Accordion>

  <Accordion title="流包装器和推理">
    Kilo 的共享流包装器会添加提供商应用标头，并为受支持的具体模型引用规范化代理推理载荷。

    <Warning>
    `kilocode/kilo/auto` 和其他不支持代理推理的提示会跳过推理注入。如果你需要推理支持，请使用具体模型引用，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="故障排除">
    - 如果启动时模型发现失败，OpenClaw 会回退到包含 `kilocode/kilo/auto` 的内置静态目录。
    - 确认你的 API 密钥有效，并且你的 Kilo 账号已启用所需模型。
    - 当 Gateway 网关以守护进程运行时，请确保该进程可以使用 `KILOCODE_API_KEY`（例如在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置参考。
  </Card>
  <Card title="Kilo Gateway 网关" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 网关仪表板、API 密钥和账号管理。
  </Card>
</CardGroup>
