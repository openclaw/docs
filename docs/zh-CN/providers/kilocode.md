---
read_when:
    - 你想为许多 LLM 使用单个 API key
    - 你想在 OpenClaw 中通过 Kilo Gateway 运行模型
summary: 使用 Kilo Gateway 网关的统一 API 在 OpenClaw 中访问多种模型
title: Kilo Gateway 网关
x-i18n:
    generated_at: "2026-07-05T11:38:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway 网关将请求路由到单个 OpenAI 兼容端点和 API key 后面的多个模型。

| 属性 | 值                              |
| -------- | ---------------------------------- |
| 提供商 | `kilocode`                         |
| 凭证     | `KILOCODE_API_KEY`                 |
| API      | OpenAI 兼容                  |
| 基础 URL | `https://api.kilo.ai/api/gateway/` |

## 安装插件

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## 设置

<Steps>
  <Step title="创建账户">
    前往 [app.kilo.ai](https://app.kilo.ai)，登录或创建账户，然后生成 API key。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    或者直接设置环境变量：

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

## 默认模型和目录

默认模型是 `kilocode/kilo/auto`，这是一个由提供商拥有的智能路由模型。OpenClaw 不会
为它发布任务到上游模型的映射；`kilo/auto` 后面的路由由 Kilo Gateway 网关拥有。

启动时，OpenClaw 会查询 `GET https://api.kilo.ai/api/gateway/models`，并将发现的模型合并到
静态回退目录之前。静态回退仅包含 `kilocode/kilo/auto`（`Kilo Auto`、
`input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`、`maxTokens: 128000`）。

Gateway 网关上的任何模型都可以用 `kilocode/<upstream-id>` 寻址（例如
`kilocode/anthropic/claude-sonnet-4`、`kilocode/openai/gpt-5.5`）。运行 `/models kilocode` 或
`openclaw models list --provider kilocode` 查看完整的已发现列表。

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

## 行为说明

<AccordionGroup>
  <Accordion title="传输和兼容性">
    Kilo Gateway 网关兼容 OpenRouter，因此它使用代理风格的 OpenAI 兼容请求
    路径，而不是原生 OpenAI 请求整形（没有 `store`，没有 OpenAI reasoning-effort 载荷）。

    - 基于 Gemini 的 Kilo 引用会保留在代理 Gemini 路径上：OpenClaw 会在那里清理 Gemini thought
      signatures，但不会启用原生 Gemini 重放验证或 bootstrap 重写。
    - 请求使用由你的 API key 构建的 Bearer token。

  </Accordion>

  <Accordion title="流包装器和推理">
    Kilo 流包装器会添加 `X-KILOCODE-FEATURE` 请求头（默认 `openclaw`，
    可用 `KILOCODE_FEATURE` 环境变量覆盖），并为支持它的模型规范化 reasoning-effort 载荷。

    <Warning>
    `kilocode/kilo/auto` 和 `x-ai/*` 引用会跳过 reasoning-effort 注入。如果你需要推理支持，
    请使用具体模型引用，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="故障排查">
    - 如果启动时模型发现失败，OpenClaw 会回退到包含 `kilocode/kilo/auto` 的静态目录。
    - 确认你的 API key 有效，并且你的 Kilo 账户已启用所需模型。
    - 当 Gateway 网关作为守护进程运行时，确保该进程可以使用 `KILOCODE_API_KEY`（例如在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

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
    Kilo Gateway 网关仪表板、API keys 和账户管理。
  </Card>
</CardGroup>
