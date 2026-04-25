---
read_when:
    - 你想要使用 OpenCode 托管的模型访问权限
    - 你想在 Zen 和 Go 目录之间进行选择
summary: 使用 OpenClaw 搭配 OpenCode Zen 和 Go 目录
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T04:09:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode 在 OpenClaw 中提供两个托管目录：

| 目录 | 前缀            | 运行时提供商 |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

这两个目录使用同一个 OpenCode API 密钥。OpenClaw 会将运行时提供商 id 分开保留，
以确保上游按模型进行的路由保持正确，但新手引导和文档会将它们视为同一个 OpenCode 设置。

## 入门指南

<Tabs>
  <Tab title="Zen 目录">
    **最适合：** 精选的 OpenCode 多模型代理（Claude、GPT、Gemini）。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        或者直接传入密钥：

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="将 Zen 模型设为默认值">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go 目录">
    **最适合：** OpenCode 托管的 Kimi、GLM 和 MiniMax 阵容。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        或者直接传入密钥：

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="将 Go 模型设为默认值">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="验证模型可用">
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

| 属性 | 值 |
| ---------------- | ----------------------------------------------------------------------- |
| 运行时提供商 | `opencode`                                                              |
| 示例模型 | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| 属性 | 值 |
| ---------------- | ------------------------------------------------------------------------ |
| 运行时提供商 | `opencode-go`                                                            |
| 示例模型 | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## 高级配置

<AccordionGroup>
  <Accordion title="API 密钥别名">
    `OPENCODE_ZEN_API_KEY` 也支持作为 `OPENCODE_API_KEY` 的别名。
  </Accordion>

  <Accordion title="共享凭证">
    在设置期间输入一个 OpenCode 密钥后，会为两个运行时提供商都存储凭证。你不需要分别为每个目录进行新手引导。
  </Accordion>

  <Accordion title="计费和控制台">
    你需要登录 OpenCode，添加计费信息，并复制你的 API 密钥。计费和目录可用性都在 OpenCode 控制台中管理。
  </Accordion>

  <Accordion title="Gemini 重放行为">
    由 Gemini 支持的 OpenCode 引用会继续走代理 Gemini 路径，因此 OpenClaw 会在该路径上保留 Gemini thought-signature 清理，而不会启用原生 Gemini 重放验证或 bootstrap 重写。
  </Accordion>

  <Accordion title="非 Gemini 重放行为">
    非 Gemini 的 OpenCode 引用会保留最小化的 OpenAI 兼容重放策略。
  </Accordion>
</AccordionGroup>

<Tip>
在设置期间输入一个 OpenCode 密钥后，会为 Zen 和 Go 两个运行时提供商都存储凭证，因此你只需要完成一次新手引导。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
