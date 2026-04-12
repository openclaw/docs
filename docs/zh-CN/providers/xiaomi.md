---
read_when:
    - 你想在 OpenClaw 中使用 Xiaomi MiMo 模型
    - 你需要设置 `XIAOMI_API_KEY`
summary: 使用 Xiaomi MiMo 模型与 OpenClaw 配合使用
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-12T10:30:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd5a526764c796da7e1fff61301bc2ec618e1cf3857894ba2ef4b6dd9c4dc339
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo 是 **MiMo** 模型的 API 平台。OpenClaw 使用 Xiaomi 的 OpenAI 兼容端点，并通过 API 密钥进行身份验证。

| 属性 | 值 |
| -------- | ------------------------------- |
| 提供商 | `xiaomi` |
| 认证 | `XIAOMI_API_KEY` |
| API | OpenAI 兼容 |
| Base URL | `https://api.xiaomimimo.com/v1` |

## 入门指南

<Steps>
  <Step title="获取 API 密钥">
    在 [Xiaomi MiMo 控制台](https://platform.xiaomimimo.com/#/console/api-keys) 中创建一个 API 密钥。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    或直接传入密钥：

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## 可用模型

| 模型引用 | 输入 | 上下文 | 最大输出 | 推理 | 说明 |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | text | 262,144 | 8,192 | 否 | 默认模型 |
| `xiaomi/mimo-v2-pro` | text | 1,048,576 | 32,000 | 是 | 大上下文 |
| `xiaomi/mimo-v2-omni` | text, image | 262,144 | 32,000 | 是 | 多模态 |

<Tip>
默认模型引用是 `xiaomi/mimo-v2-flash`。当设置了 `XIAOMI_API_KEY` 或存在认证配置文件时，系统会自动注入该提供商。
</Tip>

## 配置示例

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="自动注入行为">
    当你的环境中设置了 `XIAOMI_API_KEY` 或存在认证配置文件时，系统会自动注入 `xiaomi` 提供商。除非你想覆盖模型元数据或 Base URL，否则无需手动配置该提供商。
  </Accordion>

  <Accordion title="模型详情">
    - **mimo-v2-flash** — 轻量且快速，适合通用文本任务。不支持推理。
    - **mimo-v2-pro** — 支持推理，并提供 100 万 token 上下文窗口，适用于长文档工作负载。
    - **mimo-v2-omni** — 支持推理的多模态模型，同时接受文本和图像输入。

    <Note>
    所有模型都使用 `xiaomi/` 前缀（例如 `xiaomi/mimo-v2-pro`）。
    </Note>

  </Accordion>

  <Accordion title="故障排除">
    - 如果模型未显示，请确认 `XIAOMI_API_KEY` 已设置且有效。
    - 当 Gateway 网关 以守护进程方式运行时，请确保该密钥对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供）。

    <Warning>
    仅在你的交互式 shell 中设置的密钥对由守护进程管理的 Gateway 网关 进程不可见。请使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置来确保持续可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用以及故障切换行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration" icon="gear">
    完整的 OpenClaw 配置参考。
  </Card>
  <Card title="Xiaomi MiMo 控制台" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 仪表板和 API 密钥管理。
  </Card>
</CardGroup>
