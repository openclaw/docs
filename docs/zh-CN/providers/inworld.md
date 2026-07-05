---
read_when:
    - 你希望将 Inworld 语音合成用于出站回复
    - 你需要来自 Inworld 的 PCM 电话音频或 OGG_OPUS 语音备注输出
summary: 用于 OpenClaw 回复的 Inworld 流式文本转语音
title: Inworld
x-i18n:
    generated_at: "2026-07-05T11:37:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld 是一个流式文本转语音（TTS）提供商。在 OpenClaw 中，它会合成出站回复音频（默认 MP3，语音便笺使用 OGG_OPUS），并为 Voice Call 等电话渠道合成原始 PCM 音频。

OpenClaw 会向 Inworld 的流式 TTS 端点发送请求，将返回的 base64 音频分块拼接成单个缓冲区，然后把结果交给标准回复音频流水线。

| 属性          | 值                                                              |
| ------------- | --------------------------------------------------------------- |
| 提供商 id     | `inworld`                                                       |
| 插件          | 官方外部包（`@openclaw/inworld-speech`）                       |
| 合约          | `speechProviders`（仅 TTS）                                    |
| 凭证环境变量  | `INWORLD_API_KEY`（HTTP Basic，Base64 控制台凭证）             |
| 基础 URL      | `https://api.inworld.ai`                                        |
| 默认语音      | `Sarah`                                                         |
| 默认模型      | `inworld-tts-1.5-max`                                           |
| 输出          | MP3（默认）、OGG_OPUS（语音便笺）、PCM 22050 Hz（电话）        |
| 网站          | [inworld.ai](https://inworld.ai)                                |
| 文档          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## 安装插件

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="设置你的 API key">
    从你的 Inworld 控制台（Workspace > API Keys）复制凭证，并将其设置为环境变量。该值会作为 HTTP Basic 凭证原样发送，因此不要再次对它进行 Base64 编码，也不要将它转换为 bearer token。

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
    通过任意已连接渠道发送回复。OpenClaw 会使用 Inworld 合成音频，并以 MP3 交付（如果渠道需要语音便笺，则使用 OGG_OPUS）。
  </Step>
</Steps>

## 配置选项

| 选项          | 路径                                         | 描述                                                                |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 控制台凭证。回退到 `INWORLD_API_KEY`。                      |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | 覆盖 Inworld API 基础 URL（默认 `https://api.inworld.ai`）。        |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 语音标识符（默认 `Sarah`）。旧别名：`speakerVoiceId`。             |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS 模型 id（默认 `inworld-tts-1.5-max`）。                        |
| `temperature` | `messages.tts.providers.inworld.temperature` | 采样温度，`0`（不含）到 `2`（可选）。                              |

## 说明

<AccordionGroup>
  <Accordion title="认证">
    Inworld 使用 HTTP Basic 认证，并采用单个 Base64 编码的凭证字符串。请从 Inworld 控制台原样复制它。该提供商会以 `Authorization: Basic <apiKey>` 形式发送它，不会进行任何进一步编码，因此不要自行对它进行 Base64 编码，也不要传入 bearer 风格的 token。相同提示见 [TTS 认证说明](/zh-CN/tools/tts#inworld-primary)。
  </Accordion>
  <Accordion title="模型">
    支持的模型 id：`inworld-tts-1.5-max`（默认）、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音频输出">
    回复默认使用 MP3。当渠道目标为 `voice-note` 时，OpenClaw 会向 Inworld 请求 `OGG_OPUS`，这样音频会作为原生语音气泡播放。电话合成使用 22050 Hz 的原始 `PCM` 来供给电话桥接。
  </Accordion>
  <Accordion title="自定义端点">
    使用 `messages.tts.providers.inworld.baseUrl` 覆盖 API 主机。发送请求前会剥离尾随斜杠。
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
    所有受支持的 OpenClaw 提供商。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
</CardGroup>
