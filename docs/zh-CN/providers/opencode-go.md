---
read_when:
    - 你想要 OpenCode Go 目录
    - 你需要 Go 托管模型的运行时模型引用
summary: 使用 OpenCode Go 目录和共享的 OpenCode 设置
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-11T20:53:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go 是 [OpenCode](/zh-CN/providers/opencode) 中的 Go 目录。它与 Zen 目录共享 `OPENCODE_API_KEY` 凭据，但保留独立的运行时提供商 ID（`opencode-go`），以确保上游按模型路由保持正确。

| 属性           | 值                                                 |
| -------------- | -------------------------------------------------- |
| 运行时提供商   | `opencode-go`                                      |
| 身份验证       | `OPENCODE_API_KEY`（别名：`OPENCODE_ZEN_API_KEY`） |
| 上级设置       | [OpenCode](/zh-CN/providers/opencode)                    |

## 入门指南

<Tabs>
  <Tab title="交互式">
    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-go
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

  <Tab title="非交互式">
    <Steps>
      <Step title="直接传入密钥">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## 内置目录

运行 `openclaw models list --provider opencode-go` 查看当前模型列表。
内置条目：

| 模型引用                        | 名称              | 上下文    | 最大输出   | 图像输入 |
| ------------------------------- | ----------------- | --------- | ---------- | -------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K       | 否       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K       | 否       |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768     | 否       |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768     | 否       |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072    | 否       |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144   | 32,768     | 否       |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536     | 是       |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536     | 是       |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144    | 是       |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000    | 是       |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000    | 否       |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536     | 否       |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072    | 否       |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072    | 否       |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536     | 是       |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536     | 是       |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536     | 否       |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536     | 是       |

## 高级配置

<AccordionGroup>
  <Accordion title="路由行为">
    OpenClaw 会自动路由任何 `opencode-go/...` 模型引用。无需额外的提供商配置。
  </Accordion>

  <Accordion title="运行时引用约定">
    运行时引用保持明确：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`。这样可确保上游按模型路由在两个目录中都保持正确。
  </Accordion>

  <Accordion title="共享凭据">
    一个 `OPENCODE_API_KEY` 可同时用于 Zen 和 Go 目录。在设置期间输入该密钥，会为两个运行时提供商存储凭据。
  </Accordion>
</AccordionGroup>

<Tip>
有关共享新手引导概览以及完整的 Zen + Go 目录参考，请参阅 [OpenCode](/zh-CN/providers/opencode)。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="OpenCode（上级）" href="/zh-CN/providers/opencode" icon="server">
    共享新手引导、目录概览和高级说明。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
</CardGroup>
