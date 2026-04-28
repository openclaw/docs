---
read_when:
    - 你希望在 OpenClaw 中使用 Mistral 模型
    - 你希望为 Voice Call 使用 Voxtral 实时转录
    - 你需要 Mistral API key 新手引导和模型引用
summary: 在 OpenClaw 中使用 Mistral 模型和 Voxtral 转录
title: Mistral
x-i18n:
    generated_at: "2026-04-23T21:01:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

OpenClaw 支持将 Mistral 同时用于文本/图像模型路由（`mistral/...`）以及
通过 Voxtral 在媒体理解中进行音频转录。  
Mistral 还可用于 Memory 嵌入（`memorySearch.provider = "mistral"`）。

- Provider：`mistral`
- 认证：`MISTRAL_API_KEY`
- API：Mistral Chat Completions（`https://api.mistral.ai/v1`）

## 快速开始

<Steps>
  <Step title="获取你的 API key">
    在 [Mistral Console](https://console.mistral.ai/) 中创建一个 API key。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    或直接传入 key：

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
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 内置 LLM 目录

OpenClaw 当前内置了以下 Mistral 目录：

| 模型引用 | 输入 | 上下文 | 最大输出 | 说明 |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest` | text, image | 262,144 | 16,384 | 默认模型 |
| `mistral/mistral-medium-2508` | text, image | 262,144 | 8,192 | Mistral Medium 3.1 |
| `mistral/mistral-small-latest` | text, image | 128,000 | 16,384 | Mistral Small 4；可通过 API `reasoning_effort` 调整推理强度 |
| `mistral/pixtral-large-latest` | text, image | 128,000 | 32,768 | Pixtral |
| `mistral/codestral-latest` | text | 256,000 | 4,096 | 编码 |
| `mistral/devstral-medium-latest` | text | 262,144 | 32,768 | Devstral 2 |
| `mistral/magistral-small` | text | 128,000 | 40,000 | 启用推理 |

## 音频转录（Voxtral）

通过媒体理解
管线使用 Voxtral 进行批量音频转录。

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

## Voice Call 流式 STT

内置的 `mistral` 插件会将 Voxtral Realtime 注册为 Voice Call 的
流式 STT provider。

| 设置 | 配置路径 | 默认值 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API key | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | 回退到 `MISTRAL_API_KEY` |
| 模型 | `...mistral.model` | `voxtral-mini-transcribe-realtime-2602` |
| 编码 | `...mistral.encoding` | `pcm_mulaw` |
| 采样率 | `...mistral.sampleRate` | `8000` |
| 目标延迟 | `...mistral.targetStreamingDelayMs` | `800` |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw 默认将 Mistral 实时 STT 设置为 8 kHz 的 `pcm_mulaw`，这样 Voice Call
就可以直接转发 Twilio 媒体帧。只有当你的上游流已经是原始 PCM 时，
才使用 `encoding: "pcm_s16le"` 和匹配的 `sampleRate`。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="可调推理（mistral-small-latest）">
    `mistral/mistral-small-latest` 映射到 Mistral Small 4，并通过 `reasoning_effort`（`none` 表示尽量减少输出中的额外 thinking；`high` 表示在最终答案前输出完整 thinking 轨迹），在 Chat Completions API 上支持[可调推理](https://docs.mistral.ai/capabilities/reasoning/adjustable)。

    OpenClaw 会将会话中的 **thinking** 级别映射到 Mistral API：

    | OpenClaw thinking 级别 | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal** | `none` |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high` |

    <Note>
    内置 Mistral 目录中的其他模型不会使用该参数。如果你想使用 Mistral 原生的推理优先行为，请继续使用 `magistral-*` 模型。
    </Note>

  </Accordion>

  <Accordion title="Memory 嵌入">
    Mistral 可以通过 `/v1/embeddings` 提供 Memory 嵌入（默认模型：`mistral-embed`）。

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="认证与 Base URL">
    - Mistral 认证使用 `MISTRAL_API_KEY`。
    - Provider Base URL 默认为 `https://api.mistral.ai/v1`。
    - 新手引导默认模型为 `mistral/mistral-large-latest`。
    - Z.AI 使用携带你的 API key 的 Bearer 认证。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 providers、模型引用和故障转移行为。
  </Card>
  <Card title="媒体理解" href="/zh-CN/nodes/media-understanding" icon="microphone">
    音频转录设置与 provider 选择。
  </Card>
</CardGroup>
