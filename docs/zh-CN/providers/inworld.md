---
read_when:
    - 你希望对出站回复使用 Inworld 语音合成
    - 你需要 Inworld 输出 PCM 电话音频或 OGG_OPUS 语音便笺
summary: 用于 OpenClaw 回复的 Inworld 流式文本转语音
title: Inworld
x-i18n:
    generated_at: "2026-07-11T20:52:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld 是一个流式文本转语音（TTS）提供商。在 OpenClaw 中，它可以合成出站回复音频（默认为 MP3，语音消息使用 OGG_OPUS），还可为 Voice Call 等电话渠道合成原始 PCM 音频。

OpenClaw 向 Inworld 的流式 TTS 端点发送 POST 请求，将返回的 Base64 音频分块拼接成单个缓冲区，然后把结果交给标准回复音频管道。

| 属性          | 值                                                              |
| ------------- | --------------------------------------------------------------- |
| 提供商 ID     | `inworld`                                                       |
| 插件          | 官方外部软件包（`@openclaw/inworld-speech`）                    |
| 契约          | `speechProviders`（仅限 TTS）                                   |
| 身份验证环境变量 | `INWORLD_API_KEY`（HTTP Basic、Base64 控制面板凭据）          |
| 基础 URL      | `https://api.inworld.ai`                                        |
| 默认语音      | `Sarah`                                                         |
| 默认模型      | `inworld-tts-1.5-max`                                           |
| 输出          | MP3（默认）、OGG_OPUS（语音消息）、22050 Hz PCM（电话）         |
| 网站          | [inworld.ai](https://inworld.ai)                                |
| 文档          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## 安装插件

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="设置 API 密钥">
    从 Inworld 控制面板（Workspace > API Keys）复制凭据，并将其设置为环境变量。该值会原样作为 HTTP Basic 凭据发送，因此不要再次对其进行 Base64 编码，也不要将其转换为 Bearer 令牌。

    ```bash
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
    通过任意已连接的渠道发送回复。OpenClaw 使用 Inworld 合成音频，并以 MP3 格式发送；当渠道需要语音消息时，则以 OGG_OPUS 格式发送。
  </Step>
</Steps>

## 配置选项

| 选项          | 路径                                         | 说明                                                                  |
| ------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 控制面板凭据。未设置时回退到 `INWORLD_API_KEY`。                |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | 覆盖 Inworld API 基础 URL（默认为 `https://api.inworld.ai`）。        |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 语音标识符（默认为 `Sarah`）。旧版别名：`speakerVoiceId`。             |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS 模型 ID（默认为 `inworld-tts-1.5-max`）。                          |
| `temperature` | `messages.tts.providers.inworld.temperature` | 采样温度，范围为大于 `0` 且不超过 `2`（可选）。                       |

## 注意事项

<AccordionGroup>
  <Accordion title="身份验证">
    Inworld 使用 HTTP Basic 身份验证，并采用单个 Base64 编码的凭据字符串。请从 Inworld 控制面板原样复制该字符串。提供商会将其作为 `Authorization: Basic <apiKey>` 发送，不会进行任何进一步编码，因此不要自行对其进行 Base64 编码，也不要传入 Bearer 风格的令牌。相同注意事项请参阅 [TTS 身份验证说明](/zh-CN/tools/tts#inworld-primary)。
  </Accordion>
  <Accordion title="模型">
    支持的模型 ID：`inworld-tts-1.5-max`（默认）、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音频输出">
    回复默认使用 MP3。当渠道目标为 `voice-note` 时，OpenClaw 会向 Inworld 请求 `OGG_OPUS`，使音频以原生语音气泡形式播放。电话合成使用 22050 Hz 的原始 `PCM`，并将其传入电话桥接层。
  </Accordion>
  <Accordion title="自定义端点">
    使用 `messages.tts.providers.inworld.baseUrl` 覆盖 API 主机。发送请求前会移除末尾的斜杠。
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
    OpenClaw 支持的所有提供商。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
</CardGroup>
