---
read_when:
    - 你想在 OpenClaw 中使用 ElevenLabs 文本转语音
    - 你想为音频附件使用 ElevenLabs Scribe 语音转文本
    - 你想为语音通话或 Google Meet 使用 ElevenLabs 实时转录
summary: 通过 OpenClaw 使用 ElevenLabs 语音、Scribe STT 和实时转录
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-05T11:37:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw 使用 ElevenLabs 进行文本转语音，使用 Scribe
v2 进行批量语音转文本，并使用 Scribe v2 Realtime 进行流式 STT。该插件已内置并默认启用；不需要执行 `plugins install` 步骤。

| 能力                     | OpenClaw 暴露面                                                       | 默认值                   |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| 文本转语音               | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| 批量语音转文本           | `tools.media.audio`                                                  | `scribe_v2`              |
| 流式语音转文本           | Voice Call 流式传输或 Google Meet `realtime.transcriptionProvider`   | `scribe_v2_realtime`     |

## 身份验证

在环境中设置 `ELEVENLABS_API_KEY`。也接受 `XI_API_KEY`，以兼容现有的 ElevenLabs 工具。

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

将 `modelId` 设置为 `eleven_v3` 以使用 ElevenLabs v3 TTS。OpenClaw 将
`eleven_multilingual_v2` 保留为现有安装的默认值。

当 ElevenLabs 是所选的 `voice.tts`/`messages.tts` 提供商时，Discord 语音频道会使用 ElevenLabs 的流式 TTS 端点：播放会从返回的音频流开始，而不是先等待 OpenClaw 下载完整音频文件。对于接受该参数的模型，`latencyTier` 会映射到 ElevenLabs 的 `optimize_streaming_latency`
查询参数；OpenClaw 会为 `eleven_v3` 省略该参数，因为它会拒绝该参数。

## 语音转文本

对传入的音频附件和较短的录制语音片段使用 Scribe v2：

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

OpenClaw 会将 multipart 音频发送到 ElevenLabs `/v1/speech-to-text`，并带上
`model_id: "scribe_v2"`。存在语言提示时，它们会映射到 `language_code`。

## 流式 STT

内置的 `elevenlabs` 插件会为 Voice Call 和 Google Meet Agent 模式流式转录注册 Scribe v2 Realtime。

| 设置            | 配置路径                                                                  | 默认值                                            |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | 回退到 `ELEVENLABS_API_KEY` / `XI_API_KEY`        |
| 模型            | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| 音频格式        | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| 采样率          | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| 提交策略        | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| 语言            | `...elevenlabs.languageCode`                                              | （未设置）                                        |

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
Voice Call 会接收 Twilio 媒体作为 8 kHz G.711 u-law。ElevenLabs realtime
提供商默认使用 `ulaw_8000`，因此电话语音帧可以无需转码直接转发。
</Note>

对于 Google Meet Agent 模式，将
`plugins.entries.google-meet.config.realtime.transcriptionProvider` 设置为
`"elevenlabs"`，并在
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` 下配置相同的提供商块。

## 相关内容

- [文本转语音](/zh-CN/tools/tts)
- [Google Meet](/zh-CN/plugins/google-meet)
- [模型选择](/zh-CN/concepts/model-providers)
