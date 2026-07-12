---
read_when:
    - 你想在 OpenClaw 中使用 Mistral 模型
    - 你想为语音通话使用 Voxtral 实时转写
    - 你需要 Mistral API key 新手引导和模型引用
summary: 在 OpenClaw 中使用 Mistral 模型和 Voxtral 转录
title: Mistral
x-i18n:
    generated_at: "2026-07-11T20:52:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

内置的 `mistral` 插件注册了四项契约：聊天补全、媒体理解（Voxtral 批量转录）、用于 Voice Call 的实时 STT（Voxtral Realtime），以及记忆嵌入（`mistral-embed`）。

| 属性             | 值                                          |
| ---------------- | ------------------------------------------- |
| 提供商 ID        | `mistral`                                   |
| 插件             | 内置，默认启用                              |
| 身份验证环境变量 | `MISTRAL_API_KEY`                           |
| 新手引导标志     | `--auth-choice mistral-api-key`             |
| 直接 CLI 标志    | `--mistral-api-key <key>`                   |
| API              | OpenAI 兼容（`openai-completions`）         |
| 基础 URL         | `https://api.mistral.ai/v1`                 |
| 默认模型         | `mistral/mistral-large-latest`              |
| 嵌入模型         | `mistral-embed`                             |
| Voxtral 批处理   | `voxtral-mini-latest`（音频转录）           |
| Voxtral 实时处理 | `voxtral-mini-transcribe-realtime-2602`     |

## 入门指南

<Steps>
  <Step title="Get your API key">
    在 [Mistral Console](https://console.mistral.ai/) 中创建 API key。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    或者直接传入密钥：

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 内置 LLM 目录

| 模型引用                         | 输入         | 上下文  | 最大输出 | 说明                                                   |
| -------------------------------- | ------------ | ------- | -------- | ------------------------------------------------------ |
| `mistral/mistral-large-latest`   | 文本、图像   | 262,144 | 16,384   | 默认模型                                               |
| `mistral/mistral-medium-2508`    | 文本、图像   | 262,144 | 8,192    | Mistral Medium 3.1                                     |
| `mistral/mistral-medium-3-5`     | 文本、图像   | 262,144 | 8,192    | Mistral Medium 3.5；可调节推理                         |
| `mistral/mistral-small-latest`   | 文本、图像   | 262,144 | 16,384   | 最新版 Mistral Small 4；可调节 `reasoning_effort`      |
| `mistral/mistral-small-2603`     | 文本、图像   | 262,144 | 16,384   | 固定版本的 Mistral Small 4；可调节 `reasoning_effort`  |
| `mistral/pixtral-large-latest`   | 文本、图像   | 128,000 | 32,768   | Pixtral                                                |
| `mistral/codestral-latest`       | 文本         | 256,000 | 4,096    | 编程                                                   |
| `mistral/devstral-medium-latest` | 文本         | 262,144 | 32,768   | Devstral 2                                             |
| `mistral/magistral-small`        | 文本         | 128,000 | 40,000   | 已启用推理                                             |

更改配置前，请先浏览内置目录中的条目：

```bash
openclaw models list --all --provider mistral --plain
```

无需启动 Gateway 网关即可对模型进行冒烟测试：

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## 音频转录（Voxtral）

通过媒体理解流水线使用 Voxtral 进行批量音频转录：

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

内置的 `mistral` 插件将 Voxtral Realtime 注册为 Voice Call 流式 STT 提供商。

| 设置     | 配置路径                                                               | 默认值                                  |
| -------- | ---------------------------------------------------------------------- | --------------------------------------- |
| API key  | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | 回退到 `MISTRAL_API_KEY`                |
| 模型     | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| 编码     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| 采样率   | `...mistral.sampleRate`                                                | `8000`                                  |
| 目标延迟 | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw 默认将 Mistral 实时 STT 配置为 8 kHz 的 `pcm_mulaw`，因此 Voice Call 可以直接转发 Twilio 媒体帧。仅当你的上游流已经是原始 PCM 时，才使用 `encoding: "pcm_s16le"` 和匹配的 `sampleRate`。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="Adjustable reasoning">
    `mistral/mistral-small-latest`、`mistral/mistral-small-2603` 和 `mistral/mistral-medium-3-5` 支持通过 `reasoning_effort` 在 Chat Completions API 上使用[可调节推理](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable)（`none` 最大限度减少输出中的额外思考；`high` 会在最终回答前呈现完整的思考轨迹）。

    OpenClaw 将会话的**思考**级别映射到 Mistral API：

    | OpenClaw 思考级别                                                 | Mistral `reasoning_effort` |
    | ----------------------------------------------------------------- | -------------------------- |
    | **关闭** / **最少**                                               | `none`                     |
    | **低** / **中** / **高** / **极高** / **自适应** / **最大**      | `high`                     |

    <Warning>
    避免将 Medium 3.5 推理模式与 `temperature: 0` 结合使用；据报告，Mistral HTTP API 会拒绝 `reasoning_effort="high"` 与 `temperature: 0` 的组合并返回 400 响应。在设置较低温度之前，请不要设置温度，或将思考级别设为关闭/最少，使 OpenClaw 发送 `reasoning_effort: "none"`。
    </Warning>

    Medium 3.5 推理的模型范围配置示例：

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
    其他内置 Mistral 目录模型不使用此参数。如果你需要 Mistral 原生的推理优先行为，请继续使用 `magistral-*` 模型。
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
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

  <Accordion title="Auth and base URL">
    - Mistral 身份验证使用 `MISTRAL_API_KEY`（Bearer 请求头）。
    - 提供商基础 URL 默认为 `https://api.mistral.ai/v1`，并接受标准的 OpenAI 兼容聊天补全请求结构。
    - 新手引导的默认模型是 `mistral/mistral-large-latest`。
    - 仅当 Mistral 明确发布了你所需的区域端点时，才在 `models.providers.mistral.baseUrl` 下覆盖基础 URL。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Media understanding" href="/zh-CN/nodes/media-understanding" icon="microphone">
    音频转录设置和提供商选择。
  </Card>
</CardGroup>
