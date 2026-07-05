---
read_when:
    - 你想在 OpenClaw 中使用 Mistral 模型
    - 你想为语音通话使用 Voxtral 实时转录
    - 你需要 Mistral API 密钥新手引导和模型引用
summary: 将 Mistral 模型和 Voxtral 转录与 OpenClaw 搭配使用
title: Mistral
x-i18n:
    generated_at: "2026-07-05T11:36:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20c970c8bcff4a0da0dd6a27d5957c384d0a34363c40871d3e56b567e7d6213a
    source_path: providers/mistral.md
    workflow: 16
---

内置 `mistral` 插件注册四个契约：聊天补全、媒体理解（Voxtral 批量转录）、Voice Call 实时 STT（Voxtral Realtime）和记忆嵌入（`mistral-embed`）。

| 属性             | 值                                          |
| ---------------- | ------------------------------------------- |
| 提供商 ID        | `mistral`                                   |
| 插件             | 内置，默认启用                              |
| 认证环境变量     | `MISTRAL_API_KEY`                           |
| 新手引导标志     | `--auth-choice mistral-api-key`             |
| 直接 CLI 标志    | `--mistral-api-key <key>`                   |
| API              | OpenAI 兼容（`openai-completions`）         |
| 基础 URL         | `https://api.mistral.ai/v1`                 |
| 默认模型         | `mistral/mistral-large-latest`              |
| 嵌入模型         | `mistral-embed`                             |
| Voxtral 批处理   | `voxtral-mini-latest`（音频转录）           |
| Voxtral 实时     | `voxtral-mini-transcribe-realtime-2602`     |

## 入门指南

<Steps>
  <Step title="获取你的 API 密钥">
    在 [Mistral Console](https://console.mistral.ai/) 中创建 API 密钥。
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
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 内置 LLM 目录

| 模型引用                         | 输入        | 上下文  | 最大输出   | 说明                                                             |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | 文本，图像  | 262,144 | 16,384     | 默认模型                                                         |
| `mistral/mistral-medium-2508`    | 文本，图像  | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | 文本，图像  | 262,144 | 8,192      | Mistral Medium 3.5；可调推理                                     |
| `mistral/mistral-small-latest`   | 文本，图像  | 128,000 | 16,384     | Mistral Small 4；通过 API `reasoning_effort` 可调推理            |
| `mistral/pixtral-large-latest`   | 文本，图像  | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | 文本        | 256,000 | 4,096      | 编码                                                             |
| `mistral/devstral-medium-latest` | 文本        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | 文本        | 128,000 | 40,000     | 已启用推理                                                       |

更改配置前，浏览内置目录行：

```bash
openclaw models list --all --provider mistral --plain
```

无需启动 Gateway 网关即可对模型做冒烟测试：

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## 音频转录（Voxtral）

通过媒体理解管线使用 Voxtral 进行批量音频转录：

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

内置 `mistral` 插件将 Voxtral Realtime 注册为 Voice Call 流式 STT 提供商。

| 设置         | 配置路径                                                               | 默认值                                  |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API 密钥     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | 回退到 `MISTRAL_API_KEY`                |
| 模型         | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| 编码         | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| 采样率       | `...mistral.sampleRate`                                                | `8000`                                  |
| 目标延迟     | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw 默认将 Mistral 实时 STT 设为 8 kHz 的 `pcm_mulaw`，这样 Voice Call 可以直接转发 Twilio 媒体帧。仅当你的上游流已经是原始 PCM 时，才使用 `encoding: "pcm_s16le"` 和匹配的 `sampleRate`。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="可调推理">
    `mistral/mistral-small-latest` 和 `mistral/mistral-medium-3-5` 在 Chat Completions API 上通过 `reasoning_effort` 支持[可调推理](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable)（`none` 会尽量减少输出中的额外思考；`high` 会在最终答案前显示完整思考轨迹）。

    OpenClaw 将会话 **thinking** 级别映射到 Mistral 的 API：

    | OpenClaw thinking 级别                                             | Mistral `reasoning_effort` |
    | ----------------------------------------------------------------------- | --------------------------- |
    | **off** / **minimal**                                                 | `none`                      |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`                       |

    <Warning>
    避免将 Medium 3.5 推理模式与 `temperature: 0` 组合使用；据报告，Mistral HTTP API 会拒绝 `reasoning_effort="high"` 加 `temperature: 0`，并返回 400 响应。保持 temperature 未设置，或关闭 thinking/设为 minimal，让 OpenClaw 在你设置低 temperature 前发送 `reasoning_effort: "none"`。
    </Warning>

    Medium 3.5 推理的模型级配置示例：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    其他内置 Mistral 目录模型不使用此参数。当你需要 Mistral 原生的推理优先行为时，请继续使用 `magistral-*` 模型。
    </Note>

  </Accordion>

  <Accordion title="记忆嵌入">
    Mistral 可以通过 `/v1/embeddings` 提供记忆嵌入（默认模型：`mistral-embed`）：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="认证和基础 URL">
    - Mistral 认证使用 `MISTRAL_API_KEY`（Bearer 标头）。
    - 提供商基础 URL 默认为 `https://api.mistral.ai/v1`，并接受标准 OpenAI 兼容的聊天补全请求形状。
    - 新手引导默认模型是 `mistral/mistral-large-latest`。
    - 仅当 Mistral 明确发布了你需要的区域端点时，才在 `models.providers.mistral.baseUrl` 下覆盖基础 URL。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="媒体理解" href="/zh-CN/nodes/media-understanding" icon="microphone">
    音频转录设置和提供商选择。
  </Card>
</CardGroup>
