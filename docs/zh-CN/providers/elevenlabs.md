---
read_when:
    - 你想在 OpenClaw 中使用 ElevenLabs 文本转语音
    - 你想要 ElevenLabs Scribe 为音频附件提供语音转文本
    - 你想为语音通话或 Google Meet 使用 ElevenLabs 实时转录
summary: 将 ElevenLabs 语音、Scribe STT 和实时转录与 OpenClaw 搭配使用
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-27T03:03:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw 使用 ElevenLabs 进行文本转语音，使用 Scribe
v2 进行批量语音转文本，并使用 Scribe v2 Realtime 进行流式语音转文本。

| 能力               | OpenClaw 接口                                                     | 默认值                  |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| 文本转语音           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| 批量语音转文本     | `tools.media.audio`                                                  | `scribe_v2`              |
| 流式语音转文本 | 语音通话流式传输或 Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## 身份验证

在环境中设置 `ELEVENLABS_API_KEY`。为了兼容现有 ElevenLabs 工具，也接受 `XI_API_KEY`。

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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

将 `modelId` 设置为 `eleven_v3` 以使用 ElevenLabs v3 文本转语音。OpenClaw 保留
`eleven_multilingual_v2` 作为现有安装的默认值。

当 ElevenLabs 是所选的 `voice.tts`/`messages.tts` 提供商时，Discord 语音频道会使用 ElevenLabs 的流式 TTS 端点。播放会从返回的音频流开始，而不是先等待 OpenClaw 下载并写入整个音频文件。对于接受该参数的模型，`latencyTier` 会映射到 ElevenLabs 的
`optimize_streaming_latency` 查询参数；对于会拒绝该参数的 `eleven_v3`，OpenClaw 会省略它。

## 语音转文本

将 Scribe v2 用于入站音频附件和短录音语音片段：

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

OpenClaw 会将多部分音频发送到 ElevenLabs `/v1/speech-to-text`，并带上
`model_id: "scribe_v2"`。存在语言提示时，会映射到 `language_code`。

## 流式语音转文本

内置的 `elevenlabs` 插件为语音通话和 Google Meet Agent 模式流式转录注册 Scribe v2 Realtime。

| 设置         | 配置路径                                                               | 默认值                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API 密钥         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | 回退到 `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| 模型           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| 音频格式    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| 采样率     | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| 提交策略 | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| 语言        | `...elevenlabs.languageCode`                                              | （未设置）                                           |

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
语音通话接收的 Twilio 媒体是 8 kHz G.711 u-law。ElevenLabs 实时提供商默认使用 `ulaw_8000`，因此电话帧可以不经转码直接转发。
</Note>

对于 Google Meet Agent 模式，将
`plugins.entries.google-meet.config.realtime.transcriptionProvider` 设置为
`"elevenlabs"`，并在
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` 下配置相同的提供商块。

## 相关内容

- [文本转语音](/zh-CN/tools/tts)
- [Google Meet](/zh-CN/plugins/google-meet)
- [模型选择](/zh-CN/concepts/model-providers)
