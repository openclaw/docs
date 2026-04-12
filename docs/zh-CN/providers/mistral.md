---
read_when:
    - 你想在 OpenClaw 中使用 Mistral 模型
    - 你需要 Mistral API 密钥新手引导和模型引用
summary: 使用 Mistral 模型和 Voxtral 转录功能搭配 OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-12T10:33:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0474f55587909ce9bbdd47b881262edbeb1b07eb3ed52de1090a8ec4d260c97b
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw 同时支持将 Mistral 用于文本/图像模型路由（`mistral/...`）以及在媒体理解中通过 Voxtral 进行音频转录。
Mistral 也可用于记忆嵌入（`memorySearch.provider = "mistral"`）。

- 提供商：`mistral`
- 凭证：`MISTRAL_API_KEY`
- API：Mistral Chat Completions（`https://api.mistral.ai/v1`）

## 入门指南

<Steps>
  <Step title="获取你的 API 密钥">
    在 [Mistral Console](https://console.mistral.ai/) 中创建一个 API 密钥。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    或者直接传入密钥：

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="设置默认模型">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 内置 LLM 目录

OpenClaw 当前内置了以下 Mistral 目录：

| 模型引用                         | 输入        | 上下文   | 最大输出   | 说明                                                             |
| -------------------------------- | ----------- | -------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | 文本、图像  | 262,144  | 16,384     | 默认模型                                                         |
| `mistral/mistral-medium-2508`    | 文本、图像  | 262,144  | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | 文本、图像  | 128,000  | 16,384     | Mistral Small 4；可通过 API `reasoning_effort` 调整推理强度      |
| `mistral/pixtral-large-latest`   | 文本、图像  | 128,000  | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | 文本        | 256,000  | 4,096      | 编码                                                             |
| `mistral/devstral-medium-latest` | 文本        | 262,144  | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | 文本        | 128,000  | 40,000     | 启用推理                                                         |

## 音频转录（Voxtral）

通过媒体理解流水线使用 Voxtral 进行音频转录。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
媒体转录路径使用 `/v1/audio/transcriptions`。Mistral 的默认音频模型是 `voxtral-mini-latest`。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="可调推理（mistral-small-latest）">
    `mistral/mistral-small-latest` 对应 Mistral Small 4，并支持通过 Chat Completions API 的 `reasoning_effort` 使用[可调推理](https://docs.mistral.ai/capabilities/reasoning/adjustable)（`none` 会尽量减少输出中的额外思考；`high` 会在最终答案之前展示完整的思考轨迹）。

    OpenClaw 会将会话 **thinking** 级别映射到 Mistral 的 API：

    | OpenClaw thinking 级别                          | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** | `high`             |

    <Note>
    其他内置的 Mistral 目录模型不会使用此参数。如果你想要 Mistral 原生的以推理优先为核心的行为，请继续使用 `magistral-*` 模型。
    </Note>

  </Accordion>

  <Accordion title="记忆嵌入">
    Mistral 可通过 `/v1/embeddings` 提供记忆嵌入（默认模型：`mistral-embed`）。

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="凭证和基础 URL">
    - Mistral 凭证使用 `MISTRAL_API_KEY`。
    - 提供商基础 URL 默认为 `https://api.mistral.ai/v1`。
    - 新手引导默认模型是 `mistral/mistral-large-latest`。
    - Z.AI 使用 Bearer 凭证和你的 API 密钥。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="媒体理解" href="/tools/media-understanding" icon="microphone">
    音频转录设置和提供商选择。
  </Card>
</CardGroup>
