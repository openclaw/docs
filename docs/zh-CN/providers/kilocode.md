---
read_when:
    - 你想为多个大语言模型使用一个 API 密钥
    - 你想在 OpenClaw 中通过 Kilo Gateway 网关运行模型
summary: 使用 Kilo Gateway 网关的统一 API 在 OpenClaw 中访问多种模型
title: Kilo Gateway 网关
x-i18n:
    generated_at: "2026-05-06T16:17:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway 提供一个**统一 API**，可将请求通过单个端点和 API key 路由到许多模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换 base URL 即可工作。

| 属性 | 值                              |
| -------- | ---------------------------------- |
| 提供商 | `kilocode`                         |
| 凭证     | `KILOCODE_API_KEY`                 |
| API      | 兼容 OpenAI                  |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## 入门指南

<Steps>
  <Step title="创建账户">
    前往 [app.kilo.ai](https://app.kilo.ai)，登录或创建账户，然后导航到 API Keys 并生成一个新 key。
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

默认模型是 `kilocode/kilo/auto`，这是由 Kilo Gateway 管理、提供商拥有的智能路由模型。

<Note>
OpenClaw 将 `kilocode/kilo/auto` 视为稳定的默认 ref，但不会为该路由发布有来源支持的任务到上游模型映射。`kilocode/kilo/auto` 背后的确切上游路由由 Kilo Gateway 拥有，并未在 OpenClaw 中硬编码。
</Note>

## 内置目录

OpenClaw 会在启动时从 Kilo Gateway 动态发现可用模型。使用 `/models kilocode` 查看你的账户可用模型完整列表。

Gateway 网关上任何可用模型都可以配合 `kilocode/` 前缀使用：

| 模型 ref                              | 备注                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | 默认 — 智能路由            |
| `kilocode/anthropic/claude-sonnet-4`   | 通过 Kilo 使用 Anthropic                 |
| `kilocode/openai/gpt-5.5`              | 通过 Kilo 使用 OpenAI                    |
| `kilocode/google/gemini-3-pro-preview` | 通过 Kilo 使用 Google                    |
| ...以及更多                       | 使用 `/models kilocode` 列出全部 |

<Tip>
启动时，OpenClaw 会查询 `GET https://api.kilo.ai/api/gateway/models`，并将发现的模型合并到静态回退目录之前。内置回退始终包含 `kilocode/kilo/auto`（`Kilo Auto`），并带有 `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000` 和 `maxTokens: 128000`。
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
    Kilo Gateway 在源码中记录为兼容 OpenRouter，因此它会保持在代理风格的 OpenAI 兼容路径上，而不是使用原生 OpenAI 请求整形。

    - 基于 Gemini 的 Kilo refs 会保持在 proxy-Gemini 路径上，因此 OpenClaw 会在那里保留 Gemini 思考签名清理，而不会启用原生 Gemini 重放验证或 bootstrap 重写。
    - Kilo Gateway 在底层使用 Bearer token 和你的 API key。

  </Accordion>

  <Accordion title="流包装器和推理">
    Kilo 的共享流包装器会添加提供商应用 header，并为受支持的具体模型 refs 规范化代理推理 payload。

    <Warning>
    `kilocode/kilo/auto` 和其他不支持代理推理的 hints 会跳过推理注入。如果你需要推理支持，请使用具体模型 ref，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="故障排除">
    - 如果模型发现启动时失败，OpenClaw 会回退到包含 `kilocode/kilo/auto` 的内置静态目录。
    - 确认你的 API key 有效，并且你的 Kilo 账户已启用所需模型。
    - 当 Gateway 网关作为守护进程运行时，确保 `KILOCODE_API_KEY` 对该进程可用（例如在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型 refs 和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置参考。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 控制面板、API keys 和账户管理。
  </Card>
</CardGroup>
