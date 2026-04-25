---
read_when:
    - 你希望为外发回复使用 Inworld 语音合成
    - 你需要来自 Inworld 的 PCM 电话语音或 OGG_OPUS 语音便笺输出
summary: 用于 OpenClaw 回复的 Inworld 流式文本转语音
title: Inworld
x-i18n:
    generated_at: "2026-04-25T21:40:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld 是一个流式文本转语音（TTS）提供商。在 OpenClaw 中，它会为外发回复合成音频（默认是 MP3，语音便笺使用 OGG_OPUS），并为 Voice Call 等电话语音渠道合成 PCM 音频。

OpenClaw 会向 Inworld 的流式 TTS 端点发送请求，将返回的 base64 音频分块拼接为一个单独的缓冲区，然后将结果交给标准的回复音频处理管线。

| 详情 | 值 |
| ------------- | ----------------------------------------------------------- |
| 网站 | [inworld.ai](https://inworld.ai) |
| 文档 | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts) |
| 认证 | `INWORLD_API_KEY`（HTTP Basic，来自控制台的 Base64 凭证） |
| 默认语音 | `Sarah` |
| 默认模型 | `inworld-tts-1.5-max` |

## 入门指南

<Steps>
  <Step title="设置你的 API 密钥">
    从你的 Inworld 控制台复制凭证（Workspace > API Keys），并将其设置为环境变量。该值会原样作为 HTTP Basic 凭证发送，因此不要再次对它进行 Base64 编码，也不要将其转换为 bearer token。

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="在 messages.tts 中选择 Inworld">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="发送一条消息">
    通过任何已连接的渠道发送回复。OpenClaw 会使用 Inworld 合成音频，并将其作为 MP3 发送（如果渠道需要语音便笺，则发送为 OGG_OPUS）。
  </Step>
</Steps>

## 配置选项

| 选项 | 路径 | 说明 |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey` | `messages.tts.providers.inworld.apiKey` | Base64 控制台凭证。未设置时回退到 `INWORLD_API_KEY`。 |
| `baseUrl` | `messages.tts.providers.inworld.baseUrl` | 覆盖 Inworld API 基础 URL（默认 `https://api.inworld.ai`）。 |
| `voiceId` | `messages.tts.providers.inworld.voiceId` | 语音标识符（默认 `Sarah`）。 |
| `modelId` | `messages.tts.providers.inworld.modelId` | TTS 模型 id（默认 `inworld-tts-1.5-max`）。 |
| `temperature` | `messages.tts.providers.inworld.temperature` | 采样温度 `0..2`（可选）。 |

## 说明

<AccordionGroup>
  <Accordion title="身份验证">
    Inworld 使用 HTTP Basic 认证，并采用单个经过 Base64 编码的凭证字符串。请从 Inworld 控制台原样复制它。提供商会将其作为 `Authorization: Basic <apiKey>` 发送，不会进行任何额外编码，因此不要自行对它进行 Base64 编码，也不要传入 bearer 风格的 token。相同说明见 [TTS 认证说明](/zh-CN/tools/tts#inworld-primary)。
  </Accordion>
  <Accordion title="模型">
    支持的模型 id：`inworld-tts-1.5-max`（默认）、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音频输出">
    回复默认使用 MP3。当渠道目标为 `voice-note` 时，OpenClaw 会请求 Inworld 返回 `OGG_OPUS`，这样音频会以原生语音气泡的形式播放。电话语音合成则使用 22050 Hz 的原始 `PCM` 以供电话桥接使用。
  </Accordion>
  <Accordion title="自定义端点">
    使用 `messages.tts.providers.inworld.baseUrl` 覆盖 API 主机。发送请求前会去掉末尾斜杠。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="文本转语音" href="/zh-CN/tools/tts" icon="waveform-lines">
    TTS 概览、提供商以及 `messages.tts` 配置。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    包括 `messages.tts` 设置在内的完整配置参考。
  </Card>
  <Card title="提供商" href="/zh-CN/providers" icon="grid">
    所有内置的 OpenClaw 提供商。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
</CardGroup>
