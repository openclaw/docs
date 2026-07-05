---
read_when:
    - 你想要 OpenCode 托管的模型访问
    - 你想在 Zen 和 Go 目录之间选择
summary: 将 OpenCode Zen 和 Go 目录与 OpenClaw 搭配使用
title: OpenCode
x-i18n:
    generated_at: "2026-07-05T11:36:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode 在 OpenClaw 中公开两个托管目录：

| 目录 | 前缀              | 运行时提供商 |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

两个目录共享同一个 OpenCode API key（`OPENCODE_API_KEY`，别名
`OPENCODE_ZEN_API_KEY`）。OpenClaw 将运行时提供商 ID 保持拆分，以确保
上游按模型路由保持正确，但新手引导和文档会将它们视为
一个 OpenCode 设置。

## 入门指南

<Tabs>
  <Tab title="Zen 目录">
    **最适合：** 精选的 OpenCode 多模型代理（Claude、GPT、Gemini、GLM、
    DeepSeek、Kimi、MiniMax、Qwen）。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        或者直接传入 key：

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="将 Zen 模型设为默认值">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go 目录">
    **最适合：** OpenCode 托管的 Kimi、GLM、MiniMax、Qwen 和 DeepSeek 系列。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        或者直接传入 key：

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="将 Go 模型设为默认值">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 配置示例

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 内置目录

### Zen

| 属性         | 值                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------- |
| 运行时提供商 | `opencode`                                                                                    |
| 示例模型   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

运行 `openclaw models list --provider opencode` 查看完整的当前列表，其中
还包含免费层级条目，例如 `opencode/big-pickle` 和
`opencode/deepseek-v4-flash-free`。

### Go

| 属性         | 值                                                                       |
| ---------------- | ------------------------------------------------------------------------ |
| 运行时提供商 | `opencode-go`                                                            |
| 示例模型   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

请参阅 [OpenCode Go](/zh-CN/providers/opencode-go) 获取完整的 Go 模型表。

## 高级配置

<AccordionGroup>
  <Accordion title="API key 别名">
    `OPENCODE_ZEN_API_KEY` 也可作为 `OPENCODE_API_KEY` 的别名使用。
  </Accordion>

  <Accordion title="共享凭证">
    在设置期间输入一个 OpenCode key 会为两个运行时
    提供商存储凭证。你无需分别引导设置每个目录。
  </Accordion>

  <Accordion title="获取 API key">
    创建 OpenCode 账户并在
    [opencode.ai/auth](https://opencode.ai/auth) 生成 API key。计费和目录
    可用性通过 OpenCode 仪表板管理。
  </Accordion>

  <Accordion title="Gemini 重放行为">
    由 Gemini 支持的 OpenCode ref 会保留在 proxy-Gemini 路径上，因此 OpenClaw 会在那里保留
    Gemini thought-signature 清理，而不会启用原生 Gemini
    重放验证或 bootstrap 重写。
  </Accordion>

  <Accordion title="非 Gemini 重放行为">
    非 Gemini OpenCode ref 会保留最小化的 OpenAI 兼容重放策略。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/zh-CN/providers/opencode-go" icon="server">
    完整的 Go 目录参考。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型 ref 和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
