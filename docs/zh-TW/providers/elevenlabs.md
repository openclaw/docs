---
read_when:
    - 你想在 OpenClaw 中使用 ElevenLabs 文字轉語音
    - 你想要使用 ElevenLabs Scribe 為音訊附件進行語音轉文字
    - 你想要為語音通話或 Google Meet 使用 ElevenLabs 即時轉錄
summary: 搭配 OpenClaw 使用 ElevenLabs 語音、Scribe STT 和即時轉錄
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T07:05:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw 使用 ElevenLabs 進行文字轉語音、使用 Scribe
v2 進行批次語音轉文字，並使用 Scribe v2 Realtime 進行串流 STT。

| 功能                     | OpenClaw 介面                                                          | 預設值                   |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| 文字轉語音               | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| 批次語音轉文字           | `tools.media.audio`                                                  | `scribe_v2`              |
| 串流語音轉文字           | Voice Call 串流或 Google Meet `realtime.transcriptionProvider`        | `scribe_v2_realtime`     |

## 驗證

在環境中設定 `ELEVENLABS_API_KEY`。也接受 `XI_API_KEY`，以相容既有的
ElevenLabs 工具。

```bash
export ELEVENLABS_API_KEY="..."
```

## 文字轉語音

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

將 `modelId` 設為 `eleven_v3` 即可使用 ElevenLabs v3 TTS。OpenClaw 仍將
`eleven_multilingual_v2` 保留為既有安裝的預設值。

## 語音轉文字

對傳入的音訊附件和短錄音語音片段使用 Scribe v2：

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

OpenClaw 會將 multipart 音訊傳送至 ElevenLabs `/v1/speech-to-text`，並帶上
`model_id: "scribe_v2"`。語言提示存在時會對應到 `language_code`。

## 串流 STT

內建的 `elevenlabs` plugin 會為 Voice Call 和
Google Meet agent 模式的串流轉錄註冊 Scribe v2 Realtime。

| 設定            | 設定路徑                                                                  | 預設值                                            |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API 金鑰        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | 回退至 `ELEVENLABS_API_KEY` / `XI_API_KEY`        |
| 模型            | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| 音訊格式        | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| 取樣率          | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| 提交策略        | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| 語言            | `...elevenlabs.languageCode`                                              | （未設定）                                        |

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
Voice Call 會以 8 kHz G.711 u-law 接收 Twilio 媒體。ElevenLabs 即時
provider 預設為 `ulaw_8000`，因此電話語音框架可以不經轉碼直接轉送。
</Note>

若要使用 Google Meet agent 模式，請將
`plugins.entries.google-meet.config.realtime.transcriptionProvider` 設為
`"elevenlabs"`，並在
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` 下設定相同的 provider 區塊。

## 相關

- [文字轉語音](/zh-TW/tools/tts)
- [Google Meet](/zh-TW/plugins/google-meet)
- [模型選擇](/zh-TW/concepts/model-providers)
