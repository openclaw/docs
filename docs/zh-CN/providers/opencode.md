---
read_when:
    - 你想使用 OpenCode 托管的模型访问方式
    - 你想在 Zen 和 Go 目录之间进行选择
summary: 将 OpenCode Zen 和 Go 目录与 OpenClaw 一起使用
title: OpenCode
x-i18n:
    generated_at: "2026-04-23T19:26:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d958a8b32277cf4e40f086e6f8281826c70a7583823216403bca09108778f3b3
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode 在 OpenClaw 中提供两个托管目录：

| 目录 | 前缀 | 运行时提供商 |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...` | `opencode` |
| **Go** | `opencode-go/...` | `opencode-go` |

这两个目录使用同一个 OpenCode API key。OpenClaw 会将运行时 provider ID 拆分开，
以确保上游的按模型路由保持正确，但新手引导和文档会将它们视为同一个 OpenCode 设置。

## 入门指南

<Tabs>
  <Tab title="Zen 目录">
    **最适合：** 精选的 OpenCode 多模型代理（Claude、GPT、Gemini）。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        或直接传入 key：

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
    **最适合：** OpenCode 托管的 Kimi、GLM 和 MiniMax 产品线。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        或直接传入 key：

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="将 Go 模型设为默认值">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
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

## 目录

### Zen

| 属性 | 值 |
| ---------------- | ----------------------------------------------------------------------- |
| 运行时提供商 | `opencode` |
| 示例模型 | `opencode/claude-opus-4-6`、`opencode/gpt-5.5`、`opencode/gemini-3-pro` |

### Go

| 属性 | 值 |
| ---------------- | ------------------------------------------------------------------------ |
| 运行时提供商 | `opencode-go` |
| 示例模型 | `opencode-go/kimi-k2.5`、`opencode-go/glm-5`、`opencode-go/minimax-m2.5` |

## 高级说明

<AccordionGroup>
  <Accordion title="API key 别名">
    也支持将 `OPENCODE_ZEN_API_KEY` 作为 `OPENCODE_API_KEY` 的别名。
  </Accordion>

  <Accordion title="共享凭证">
    在设置期间输入一个 OpenCode key，会为两个运行时 provider 都存储凭证。
    你不需要分别为每个目录执行新手引导。
  </Accordion>

  <Accordion title="计费与控制台">
    你需要登录 OpenCode、添加计费信息并复制你的 API key。计费
    和目录可用性都在 OpenCode 控制台中管理。
  </Accordion>

  <Accordion title="Gemini 重放行为">
    由 Gemini 支持的 OpenCode 引用会保留在 proxy-Gemini 路径上，因此 OpenClaw 会
    在该路径上继续保留 Gemini thought-signature 清理，而不会启用原生 Gemini
    重放校验或 bootstrap 重写。
  </Accordion>

  <Accordion title="非 Gemini 重放行为">
    非 Gemini 的 OpenCode 引用会保留最小化的 OpenAI 兼容重放策略。
  </Accordion>
</AccordionGroup>

<Tip>
在设置期间输入一个 OpenCode key，会为 Zen 和
Go 两个运行时 provider 都存储凭证，因此你只需要执行一次新手引导。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 provider、模型引用和故障切换行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和 provider 的完整配置参考。
  </Card>
</CardGroup>
