---
read_when:
    - 你想在 OpenClaw 中使用 ElevenLabs 文本转语音】【。
    - 你想将 ElevenLabs Scribe 语音转文本用于音频附件】【。
    - 你想将 ElevenLabs 实时转录用于 Voice Call
summary: 在 OpenClaw 中使用 ElevenLabs 语音、Scribe STT 和实时转录
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T03:42:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw 将 ElevenLabs 用于文本转语音、使用 Scribe
v2 进行批量语音转文本，以及通过 Scribe v2 Realtime 进行 Voice Call 流式 STT。

| 能力 | OpenClaw 接口 | 默认值 |
| ------------------------ | --------------------------------------------- | ------------------------ |
| 文本转语音 | `messages.tts` / `talk` | `eleven_multilingual_v2` |
| 批量语音转文本 | `tools.media.audio` | `scribe_v2` |
| 流式语音转文本 | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime` |

## 认证

在环境中设置 `ELEVENLABS_API_KEY`。为了与现有 ElevenLabs 工具兼容，
也接受 `XI_API_KEY`。

```bash
export ELEVENLABS_API_KEY="..."
```

## 文本转语音

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

## 语音转文本

对入站音频附件和较短的录制语音片段使用 Scribe v2：

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw 会将 multipart 音频发送到 ElevenLabs `/v1/speech-to-text`，并附带
`model_id: "scribe_v2"`。如果存在语言提示，则会映射到 `language_code`。

## Voice Call 流式 STT

内置 `elevenlabs` 插件为 Voice Call
流式转录注册了 Scribe v2 Realtime。

| 设置 | 配置路径 | 默认值 |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API key | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | 回退到 `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| 模型 | `...elevenlabs.modelId` | `scribe_v2_realtime` |
| 音频格式 | `...elevenlabs.audioFormat` | `ulaw_8000` |
| 采样率 | `...elevenlabs.sampleRate` | `8000` |
| 提交策略 | `...elevenlabs.commitStrategy` | `vad` |
| 语言 | `...elevenlabs.languageCode` | （未设置） |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
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
Voice Call 接收来自 Twilio 的 8 kHz G.711 u-law 媒体。ElevenLabs 实时
提供商默认使用 `ulaw_8000`，因此电话音频帧可以直接转发，
无需转码。
</Note>

## 相关内容

- [文本转语音](/zh-CN/tools/tts)
- [模型选择](/zh-CN/concepts/model-providers)
