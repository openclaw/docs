---
read_when:
    - 你需要 OpenCode 托管的模型访问
    - 你想在 Zen 和 Go 目录之间做选择
summary: 将 OpenCode Zen 和 Go 目录与 OpenClaw 搭配使用
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:44:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode 在 OpenClaw 中公开两个托管目录：

| 目录 | 前缀              | 运行时提供商 |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

两个目录使用同一个 OpenCode API key。OpenClaw 会将运行时提供商 id
分开，以保持上游按模型路由的正确性，但新手引导和文档会把它们视为
同一个 OpenCode 设置。

## 入门指南

<Tabs>
  <Tab title="Zen 目录">
    **最适合：** 精选的 OpenCode 多模型代理（Claude、GPT、Gemini、GLM）。

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
    **最适合：** OpenCode 托管的 Kimi、GLM 和 MiniMax 系列。

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

| 属性             | 值                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------- |
| 运行时提供商 | `opencode`                                                                                    |
| 示例模型         | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| 属性             | 值                                                                       |
| ---------------- | ------------------------------------------------------------------------ |
| 运行时提供商 | `opencode-go`                                                            |
| 示例模型         | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## 高级配置

<AccordionGroup>
  <Accordion title="API key 别名">
    `OPENCODE_ZEN_API_KEY` 也支持作为 `OPENCODE_API_KEY` 的别名。
  </Accordion>

  <Accordion title="共享凭证">
    在设置期间输入一个 OpenCode key 会为两个运行时
    提供商存储凭证。你无需分别对每个目录执行新手引导。
  </Accordion>

  <Accordion title="账单和仪表盘">
    你需要登录 OpenCode，添加账单详细信息，并复制你的 API key。账单
    和目录可用性在 OpenCode 仪表盘中管理。
  </Accordion>

  <Accordion title="Gemini 重放行为">
    由 Gemini 支持的 OpenCode 引用会保留在 proxy-Gemini 路径上，因此 OpenClaw 会在
    该处保留 Gemini 思维签名清理，而不会启用原生 Gemini
    重放验证或引导重写。
  </Accordion>

  <Accordion title="非 Gemini 重放行为">
    非 Gemini OpenCode 引用保留最小化的 OpenAI 兼容重放策略。
  </Accordion>
</AccordionGroup>

<Tip>
在设置期间输入一个 OpenCode key 会为 Zen 和
Go 运行时提供商存储凭证，因此你只需要执行一次新手引导。
</Tip>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
