---
read_when:
    - 您想在 OpenClaw 中使用 ElevenLabs 文字轉語音
    - 你想要使用 ElevenLabs Scribe 為音訊附件進行語音轉文字
    - 你想要為語音通話使用 ElevenLabs 即時轉錄
summary: 搭配 OpenClaw 使用 ElevenLabs 語音、Scribe STT 和即時轉錄
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-30T03:30:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw 使用 ElevenLabs 進行文字轉語音、透過 Scribe
v2 進行批次語音轉文字，以及透過 Scribe v2 Realtime 進行語音通話串流 STT。

| 能力                     | OpenClaw 介面                                  | 預設值                   |
| ------------------------ | --------------------------------------------- | ------------------------ |
| 文字轉語音               | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| 批次語音轉文字           | `tools.media.audio`                           | `scribe_v2`              |
| 串流語音轉文字           | 語音通話 `streaming.provider: "elevenlabs"`   | `scribe_v2_realtime`     |

## 驗證

在環境中設定 `ELEVENLABS_API_KEY`。也接受 `XI_API_KEY`，以便與現有的 ElevenLabs 工具相容。

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

將 `modelId` 設為 `eleven_v3` 即可使用 ElevenLabs v3 TTS。OpenClaw 會保留
`eleven_multilingual_v2` 作為現有安裝的預設值。

## 語音轉文字

針對傳入的音訊附件和短錄音語音片段使用 Scribe v2：

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

OpenClaw 會將 multipart 音訊傳送到 ElevenLabs `/v1/speech-to-text`，並使用
`model_id: "scribe_v2"`。若存在語言提示，會對應到 `language_code`。

## 語音通話串流 STT

隨附的 `elevenlabs` Plugin 會為語音通話串流轉錄註冊 Scribe v2 Realtime。

| 設定             | 設定路徑                                                                  | 預設值                                            |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API 金鑰        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | 後援為 `ELEVENLABS_API_KEY` / `XI_API_KEY`        |
| 模型             | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| 音訊格式         | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| 取樣率           | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| 提交策略         | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| 語言             | `...elevenlabs.languageCode`                                              | （未設定）                                        |

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
語音通話會以 8 kHz G.711 u-law 接收 Twilio 媒體。ElevenLabs 即時提供者預設為
`ulaw_8000`，因此電話語音框架可以不經轉碼直接轉送。
</Note>

## 相關

- [文字轉語音](/zh-TW/tools/tts)
- [模型選擇](/zh-TW/concepts/model-providers)
