---
read_when:
    - 你想用一个 API 密钥访问多种 LLM
    - 你想在 OpenClaw 中通过 Kilo Gateway 运行模型
summary: 使用 Kilo Gateway 的统一 API 在 OpenClaw 中访问多种模型
title: Kilocode
x-i18n:
    generated_at: "2026-04-23T23:02:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway 提供一个**统一 API**，可通过单一端点和 API 密钥将请求路由到多种模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换基础 URL 即可使用。

| 属性 | 值                                 |
| ---- | ---------------------------------- |
| 提供商 | `kilocode`                       |
| 认证 | `KILOCODE_API_KEY`                 |
| API  | 兼容 OpenAI                        |
| 基础 URL | `https://api.kilo.ai/api/gateway/` |

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

默认模型是 `kilocode/kilo/auto`，这是一个由 Kilo Gateway 管理、由 provider 拥有的智能路由模型。

<Note>
OpenClaw 将 `kilocode/kilo/auto` 视为稳定的默认引用，但不会为该路由发布基于源的任务到上游模型映射。`kilocode/kilo/auto` 背后的确切上游路由由 Kilo Gateway 决定，而不是由 OpenClaw 硬编码。
</Note>

## 内置目录

OpenClaw 会在启动时从 Kilo Gateway 动态发现可用模型。使用
`/models kilocode` 可查看你的账户可用的完整模型列表。

Gateway 网关上可用的任何模型都可以通过 `kilocode/` 前缀来使用：

| 模型引用                              | 说明                               |
| ------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                  | 默认 — 智能路由                    |
| `kilocode/anthropic/claude-sonnet-4`  | 通过 Kilo 使用 Anthropic           |
| `kilocode/openai/gpt-5.5`             | 通过 Kilo 使用 OpenAI              |
| `kilocode/google/gemini-3-pro-preview`| 通过 Kilo 使用 Google              |
| ...以及更多                           | 使用 `/models kilocode` 列出全部   |

<Tip>
在启动时，OpenClaw 会查询 `GET https://api.kilo.ai/api/gateway/models`，并将已发现模型合并到静态回退目录之前。内置回退始终包含 `kilocode/kilo/auto`（`Kilo Auto`），其配置为 `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000` 和 `maxTokens: 128000`。
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
  <Accordion title="传输和兼容性">
    Kilo Gateway 在源代码中被记录为兼容 OpenRouter，因此它会保留在代理式 OpenAI 兼容路径上，而不是使用原生 OpenAI 请求整形。

    - 基于 Gemini 的 Kilo 引用会保留在代理 Gemini 路径上，因此 OpenClaw 会继续在该路径中保留 Gemini thought-signature 清理，而不会启用原生 Gemini 重放验证或引导重写。
    - Kilo Gateway 底层会使用你的 API 密钥作为 Bearer token。

  </Accordion>

  <Accordion title="流包装器和推理">
    Kilo 的共享流包装器会添加 provider app header，并为受支持的具体模型引用规范化代理推理负载。

    <Warning>
    `kilocode/kilo/auto` 和其他不支持代理推理的提示会跳过推理注入。如果你需要推理支持，请使用具体模型引用，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="故障排除">
    - 如果启动时模型发现失败，OpenClaw 会回退到内置的静态目录，其中包含 `kilocode/kilo/auto`。
    - 确认你的 API 密钥有效，并且你的 Kilo 账户已启用所需模型。
    - 当 Gateway 网关以守护进程运行时，请确保 `KILOCODE_API_KEY` 对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供）。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置参考。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 控制台、API 密钥和账户管理。
  </Card>
</CardGroup>
