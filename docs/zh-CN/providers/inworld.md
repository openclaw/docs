---
read_when:
    - 你想为出站回复使用 Inworld 语音合成
    - 你需要来自 Inworld 的 PCM 电话音频或 OGG_OPUS 语音便笺输出
summary: 用于 OpenClaw 回复的 Inworld 流式文本转语音
title: Inworld
x-i18n:
    generated_at: "2026-05-06T00:38:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld 是一个流式文本转语音（TTS）提供商。在 OpenClaw 中，它会合成出站回复音频（默认 MP3，语音留言使用 OGG_OPUS），并为 Voice Call 等电话渠道合成 PCM 音频。

OpenClaw 会向 Inworld 的流式 TTS 端点发送请求，将返回的 base64 音频分块拼接成单个缓冲区，然后把结果交给标准回复音频流水线。

| 属性 | 值 |
| ------------- | --------------------------------------------------------------- |
| 提供商 id | `inworld` |
| 插件 | 内置，`enabledByDefault: true` |
| 契约 | `speechProviders`（仅 TTS） |
| 认证环境变量 | `INWORLD_API_KEY`（HTTP Basic，Base64 控制台凭据） |
| 基础 URL | `https://api.inworld.ai` |
| 默认语音 | `Sarah` |
| 默认模型 | `inworld-tts-1.5-max` |
| 输出 | MP3（默认）、OGG_OPUS（语音留言）、PCM 22050 Hz（电话） |
| 网站 | [inworld.ai](https://inworld.ai) |
| 文档 | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts) |

## 入门指南

<Steps>
  <Step title="设置你的 API key">
    从你的 Inworld 控制台（Workspace > API Keys）复制凭据，
    并将其设置为环境变量。该值会作为 HTTP Basic
    凭据原样发送，所以不要再次对它进行 Base64 编码，也不要将其转换为 bearer
    token。

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
  <Step title="发送消息">
    通过任何已连接的渠道发送回复。OpenClaw 会使用 Inworld
    合成音频，并以 MP3 交付（如果渠道需要语音留言，则使用 OGG_OPUS）。
  </Step>
</Steps>

## 配置选项

| 选项 | 路径 | 描述 |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey` | `messages.tts.providers.inworld.apiKey` | Base64 控制台凭据。回退到 `INWORLD_API_KEY`。 |
| `baseUrl` | `messages.tts.providers.inworld.baseUrl` | 覆盖 Inworld API 基础 URL（默认 `https://api.inworld.ai`）。 |
| `voiceId` | `messages.tts.providers.inworld.voiceId` | 语音标识符（默认 `Sarah`）。 |
| `modelId` | `messages.tts.providers.inworld.modelId` | TTS 模型 id（默认 `inworld-tts-1.5-max`）。 |
| `temperature` | `messages.tts.providers.inworld.temperature` | 采样温度 `0..2`（可选）。 |

## 备注

<AccordionGroup>
  <Accordion title="认证">
    Inworld 使用 HTTP Basic 认证，凭据是一个 Base64 编码的字符串。
    从 Inworld 控制台原样复制它。该提供商会将其作为 `Authorization: Basic <apiKey>`
    发送，不会进行任何进一步编码，所以不要自行对它进行 Base64 编码，也不要传入 bearer 风格的 token。
    同样的提示见 [TTS 认证备注](/zh-CN/tools/tts#inworld-primary)。
  </Accordion>
  <Accordion title="模型">
    支持的模型 id：`inworld-tts-1.5-max`（默认）、
    `inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音频输出">
    回复默认使用 MP3。当渠道目标是 `voice-note` 时，
    OpenClaw 会向 Inworld 请求 `OGG_OPUS`，使音频以原生语音气泡形式播放。
    电话合成使用 22050 Hz 的原始 `PCM`，用于输入电话桥接。
  </Accordion>
  <Accordion title="自定义端点">
    使用 `messages.tts.providers.inworld.baseUrl` 覆盖 API 主机。
    发送请求前会去掉末尾斜杠。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="文本转语音" href="/zh-CN/tools/tts" icon="waveform-lines">
    TTS 概览、提供商和 `messages.tts` 配置。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考，包括 `messages.tts` 设置。
  </Card>
  <Card title="提供商" href="/zh-CN/providers" icon="grid">
    所有内置 OpenClaw 提供商。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
</CardGroup>
