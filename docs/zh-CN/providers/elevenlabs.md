---
read_when:
    - 你想在 OpenClaw 中使用 ElevenLabs 文本转语音
    - 你想在音频附件中使用 ElevenLabs Scribe 语音转文本
    - 你想在 Voice Call 中使用 ElevenLabs 实时转录
summary: 使用 ElevenLabs 语音、Scribe STT 和 OpenClaw 实现实时转录
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T02:13:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

OpenClaw 使用 ElevenLabs 提供文本转语音、基于 Scribe v2 的批量语音转文本，以及基于 Scribe v2 Realtime 的 Voice Call 流式 STT。

| 能力 | OpenClaw 界面 | 默认值 |
| ------------------------ | --------------------------------------------- | ------------------------ |
| 文本转语音 | `messages.tts` / `talk` | `eleven_multilingual_v2` |
| 批量语音转文本 | `tools.media.audio` | `scribe_v2` |
| 流式语音转文本 | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime` |

## 身份验证

在环境中设置 `ELEVENLABS_API_KEY`。为兼容现有的 ElevenLabs 工具链，也接受 `XI_API_KEY`。

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

OpenClaw 会将多部分音频发送到 ElevenLabs 的 `/v1/speech-to-text`，并使用 `model_id: "scribe_v2"`。如果存在语言提示，则会映射到 `language_code`。

## Voice Call 流式 STT

内置的 `elevenlabs` 插件会为 Voice Call 流式转录注册 Scribe v2 Realtime。

| 设置 | 配置路径 | 默认值 |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API 密钥 | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | 回退到 `ELEVENLABS_API_KEY` / `XI_API_KEY` |
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
Voice Call 接收来自 Twilio 的 8 kHz G.711 u-law 媒体。ElevenLabs 实时提供商默认使用 `ulaw_8000`，因此可以在不转码的情况下直接转发电话音频帧。
</Note>
