---
read_when:
    - 你希望用一个 API 密钥访问多种 LLM
    - 你想在 OpenClaw 中通过 Kilo Gateway 网关运行模型
summary: 使用 Kilo Gateway 网关的统一 API 在 OpenClaw 中访问多种模型
title: Kilocode
x-i18n:
    generated_at: "2026-04-23T19:26:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c0fa1c4949a76a353f76c47010510b75a6da6dc6d5b993f8e1f5e9b6fef53ce
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway 提供一个**统一 API**，可通过单一端点和 API 密钥将请求路由到多个模型。
它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

| 属性 | 值 |
| -------- | ---------------------------------- |
| 提供商 | `kilocode` |
| 凭证 | `KILOCODE_API_KEY` |
| API | 兼容 OpenAI |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## 入门指南

<Steps>
  <Step title="创建账户">
    前往 [app.kilo.ai](https://app.kilo.ai)，登录或创建账户，然后进入 API Keys 页面生成一个新密钥。
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
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## 默认模型

默认模型是 `kilocode/kilo/auto`，这是一个由提供商维护的智能路由模型，由 Kilo Gateway 管理。

<Note>
OpenClaw 将 `kilocode/kilo/auto` 视为稳定的默认引用，但不会发布该路由从任务到上游模型的源支持映射。`kilocode/kilo/auto` 背后的确切上游路由由 Kilo Gateway 负责，而不是在 OpenClaw 中硬编码。
</Note>

## 可用模型

OpenClaw 会在启动时从 Kilo Gateway 动态发现可用模型。使用
`/models kilocode` 可查看你的账户可用的完整模型列表。

Gateway 网关上任何可用模型都可以使用 `kilocode/` 前缀：

| 模型引用 | 说明 |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto` | 默认 — 智能路由 |
| `kilocode/anthropic/claude-sonnet-4` | 通过 Kilo 使用 Anthropic |
| `kilocode/openai/gpt-5.5` | 通过 Kilo 使用 OpenAI |
| `kilocode/google/gemini-3-pro-preview` | 通过 Kilo 使用 Google |
| ……以及更多 | 使用 `/models kilocode` 列出全部 |

<Tip>
启动时，OpenClaw 会查询 `GET https://api.kilo.ai/api/gateway/models`，并将发现的模型合并到静态回退目录之前。内置回退目录始终包含 `kilocode/kilo/auto`（`Kilo Auto`），其配置为 `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000` 和 `maxTokens: 128000`。
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
  <Accordion title="传输与兼容性">
    源代码中将 Kilo Gateway 记录为兼容 OpenRouter，因此它会保留在代理式的 OpenAI 兼容路径上，而不是使用原生 OpenAI 请求整形。

    - 由 Gemini 支持的 Kilo 引用会保留在 proxy-Gemini 路径上，因此 OpenClaw 会在那里继续执行 Gemini thought-signature 清理，而不会启用原生 Gemini 重放校验或 bootstrap 重写。
    - Kilo Gateway 在底层使用带有你的 API 密钥的 Bearer token。

  </Accordion>

  <Accordion title="流包装器与 reasoning">
    Kilo 的共享流包装器会添加提供商应用头，并为受支持的具体模型引用规范化代理 reasoning 负载。

    <Warning>
    `kilocode/kilo/auto` 以及其他不支持代理 reasoning 的提示会跳过 reasoning 注入。如果你需要 reasoning 支持，请使用具体模型引用，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="故障排除">
    - 如果启动时模型发现失败，OpenClaw 会回退到包含 `kilocode/kilo/auto` 的内置静态目录。
    - 请确认你的 API 密钥有效，并且你的 Kilo 账户已启用所需模型。
    - 当 Gateway 网关以守护进程方式运行时，请确保 `KILOCODE_API_KEY` 对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和回退行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration" icon="gear">
    OpenClaw 完整配置参考。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 控制台、API 密钥和账户管理。
  </Card>
</CardGroup>
