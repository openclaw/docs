---
read_when:
    - 你想为外发回复使用 Inworld 语音合成
    - 你需要来自 Inworld 的 PCM 电话语音或 OGG_OPUS 语音备注输出
summary: 用于 OpenClaw 回复的 Inworld 流式文本转语音
title: Inworld
x-i18n:
    generated_at: "2026-06-27T03:05:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld 是一个流式文本转语音（TTS）提供商。在 OpenClaw 中，它会合成出站回复音频（默认 MP3，语音便签使用 OGG_OPUS），并为 Voice Call 等电话渠道合成 PCM 音频。

OpenClaw 会向 Inworld 的流式 TTS 端点发起请求，将返回的 base64 音频块拼接成单个缓冲区，并把结果交给标准回复音频流水线。

| 属性          | 值                                                              |
| ------------- | --------------------------------------------------------------- |
| 提供商 id     | `inworld`                                                       |
| 插件          | 官方外部软件包                                                  |
| 契约          | `speechProviders`（仅 TTS）                                    |
| 认证环境变量  | `INWORLD_API_KEY`（HTTP Basic，Base64 控制台凭据）              |
| 基础 URL      | `https://api.inworld.ai`                                        |
| 默认语音      | `Sarah`                                                         |
| 默认模型      | `inworld-tts-1.5-max`                                           |
| 输出          | MP3（默认）、OGG_OPUS（语音便签）、PCM 22050 Hz（电话）         |
| 网站          | [inworld.ai](https://inworld.ai)                                |
| 文档          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="设置你的 API 密钥">
    从你的 Inworld 控制台（Workspace > API Keys）复制凭据，并将其设置为环境变量。该值会作为 HTTP Basic 凭据原样发送，因此不要再次对它进行 Base64 编码，也不要将它转换为 bearer 令牌。

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
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="发送消息">
    通过任何已连接的渠道发送回复。OpenClaw 会使用 Inworld 合成音频，并以 MP3 形式发送（如果渠道期望语音便签，则使用 OGG_OPUS）。
  </Step>
</Steps>

## 配置选项

| 选项             | 路径                                            | 描述                                                              |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Base64 控制台凭据。回退到 `INWORLD_API_KEY`。                     |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | 覆盖 Inworld API 基础 URL（默认 `https://api.inworld.ai`）。       |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | 语音标识符（默认 `Sarah`）。                                      |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | TTS 模型 id（默认 `inworld-tts-1.5-max`）。                       |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | 采样温度 `0..2`（可选）。                                         |

## 说明

<AccordionGroup>
  <Accordion title="身份认证">
    Inworld 使用 HTTP Basic 认证，并采用单个 Base64 编码的凭据字符串。请从 Inworld 控制台原样复制。提供商会将它作为 `Authorization: Basic <apiKey>` 发送，不会再做任何编码，因此不要自行对它进行 Base64 编码，也不要传入 bearer 风格的令牌。相同提示见 [TTS 认证说明](/zh-CN/tools/tts#inworld-primary)。
  </Accordion>
  <Accordion title="模型">
    支持的模型 id：`inworld-tts-1.5-max`（默认）、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音频输出">
    回复默认使用 MP3。当渠道目标是 `voice-note` 时，OpenClaw 会请求 Inworld 输出 `OGG_OPUS`，使音频以原生语音气泡形式播放。电话合成使用 22050 Hz 的原始 `PCM` 来供给电话桥接。
  </Accordion>
  <Accordion title="自定义端点">
    使用 `messages.tts.providers.inworld.baseUrl` 覆盖 API 主机。发送请求前会移除尾随斜杠。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="文本转语音" href="/zh-CN/tools/tts" icon="waveform-lines">
    TTS 概览、提供商和 `messages.tts` 配置。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    包含 `messages.tts` 设置的完整配置参考。
  </Card>
  <Card title="提供商" href="/zh-CN/providers" icon="grid">
    所有受支持的 OpenClaw 提供商。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
</CardGroup>
