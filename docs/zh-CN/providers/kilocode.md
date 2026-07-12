---
read_when:
    - 你希望使用一个 API key 访问多个大语言模型
    - 你想在 OpenClaw 中通过 Kilo Gateway 运行模型
summary: 使用 Kilo Gateway 的统一 API 在 OpenClaw 中访问多种模型
title: Kilo Gateway 网关
x-i18n:
    generated_at: "2026-07-11T20:52:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway 通过单个 OpenAI 兼容端点和 API key，将请求路由到多个模型。

| 属性 | 值                                 |
| ---- | ---------------------------------- |
| 提供商 | `kilocode`                         |
| 身份验证 | `KILOCODE_API_KEY`                 |
| API | OpenAI 兼容                        |
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

## 默认模型和目录

默认模型是 `kilocode/kilo/auto`，这是由提供商管理的智能路由模型。OpenClaw 不会
发布其任务到上游模型的映射；`kilo/auto` 背后的路由由 Kilo Gateway 管理。

启动时，OpenClaw 会查询 `GET https://api.kilo.ai/api/gateway/models`，并将发现的模型
合并到静态回退目录之前。静态回退目录仅包含 `kilocode/kilo/auto`（`Kilo Auto`、
`input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`、`maxTokens: 128000`）。

Gateway 网关上的任何模型都可以通过 `kilocode/<upstream-id>` 寻址（例如
`kilocode/anthropic/claude-sonnet-4`、`kilocode/openai/gpt-5.5`）。运行 `/models kilocode` 或
`openclaw models list --provider kilocode` 可查看发现的完整列表。

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
    Kilo Gateway 与 OpenRouter 兼容，因此它使用代理风格的 OpenAI 兼容请求
    路径，而不是原生 OpenAI 请求格式（不含 `store`，也不含 OpenAI 推理强度载荷）。

    - 由 Gemini 支持的 Kilo 引用仍使用代理 Gemini 路径：OpenClaw 会在该路径中清理 Gemini 思维
      签名，但不会启用原生 Gemini 重放验证或引导重写。
    - 请求使用根据你的 API key 构建的 Bearer 令牌。

  </Accordion>

  <Accordion title="流包装器和推理">
    Kilo 流包装器会添加 `X-KILOCODE-FEATURE` 请求标头（默认为 `openclaw`，
    可通过 `KILOCODE_FEATURE` 环境变量覆盖），并为支持推理强度的
    模型规范化相应载荷。

    <Warning>
    `kilocode/kilo/auto` 和 `x-ai/*` 引用会跳过推理强度注入。如果你需要推理支持，
    请使用具体的模型引用，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="故障排查">
    - 如果启动时模型发现失败，OpenClaw 会回退到包含 `kilocode/kilo/auto` 的静态目录。
    - 确认你的 API key 有效，并且你的 Kilo 账户已启用所需模型。
    - 当 Gateway 网关作为守护进程运行时，请确保该进程可使用 `KILOCODE_API_KEY`（例如将其放在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 提供）。

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
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 控制面板、API key 和账户管理。
  </Card>
</CardGroup>
