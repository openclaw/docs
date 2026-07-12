---
read_when:
    - 你需要访问 OpenCode 托管的模型
    - 你想在 Zen 和 Go 目录之间做出选择
summary: 在 OpenClaw 中使用 OpenCode Zen 和 Go 目录
title: OpenCode
x-i18n:
    generated_at: "2026-07-11T20:52:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode 在 OpenClaw 中提供两个托管目录：

| 目录    | 前缀              | 运行时提供商 |
| ------- | ----------------- | ------------ |
| **Zen** | `opencode/...`    | `opencode`   |
| **Go**  | `opencode-go/...` | `opencode-go` |

两个目录共用一个 OpenCode API key（`OPENCODE_API_KEY`，别名为
`OPENCODE_ZEN_API_KEY`）。OpenClaw 将运行时提供商 ID 分开，以确保上游按模型路由保持正确，但新手引导和文档将它们视为同一个 OpenCode 设置。

## 入门指南

<Tabs>
  <Tab title="Zen 目录">
    **最适合：**精选的 OpenCode 多模型代理（Claude、GPT、Gemini、GLM、
    DeepSeek、Kimi、MiniMax、Qwen）。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        或直接传入密钥：

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="将 Zen 模型设为默认模型">
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
    **最适合：**由 OpenCode 托管的 Kimi、GLM、MiniMax、Qwen 和 DeepSeek 模型阵容。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        或直接传入密钥：

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="将 Go 模型设为默认模型">
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

| 属性       | 值                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------- |
| 运行时提供商 | `opencode`                                                                                    |
| 示例模型   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

运行 `openclaw models list --provider opencode` 可查看当前完整列表，其中还包括
`opencode/big-pickle` 和 `opencode/deepseek-v4-flash-free` 等免费套餐条目。

### Go

| 属性       | 值                                                                       |
| ---------- | ------------------------------------------------------------------------ |
| 运行时提供商 | `opencode-go`                                                            |
| 示例模型   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

有关完整的 Go 模型表，请参阅 [OpenCode Go](/zh-CN/providers/opencode-go)。

## 高级配置

<AccordionGroup>
  <Accordion title="API key 别名">
    `OPENCODE_ZEN_API_KEY` 也可作为 `OPENCODE_API_KEY` 的别名使用。
  </Accordion>

  <Accordion title="共享凭据">
    在设置期间输入一个 OpenCode 密钥，会同时存储两个运行时提供商的凭据。
    你无需分别对每个目录执行新手引导。
  </Accordion>

  <Accordion title="获取 API key">
    创建 OpenCode 账户并在
    [opencode.ai/auth](https://opencode.ai/auth) 生成 API key。计费和目录
    可用性通过 OpenCode 控制面板管理。
  </Accordion>

  <Accordion title="Gemini 重放行为">
    基于 Gemini 的 OpenCode 引用继续使用代理 Gemini 路径，因此 OpenClaw 会在该路径上保留
    Gemini 思维签名清理，但不会启用原生 Gemini 重放验证或引导重写。
  </Accordion>

  <Accordion title="非 Gemini 重放行为">
    非 Gemini 的 OpenCode 引用继续使用最精简的 OpenAI 兼容重放策略。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/zh-CN/providers/opencode-go" icon="server">
    完整的 Go 目录参考。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
