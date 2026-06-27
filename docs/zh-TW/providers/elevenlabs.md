---
read_when:
    - 你想在 OpenClaw 中使用 ElevenLabs 文字轉語音
    - 你想要為音訊附件使用 ElevenLabs Scribe 語音轉文字
    - 你想要針對語音通話或 Google Meet 使用 ElevenLabs 即時轉錄
summary: 搭配 OpenClaw 使用 ElevenLabs 語音、Scribe STT 與即時轉錄
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-27T19:53:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw 使用 ElevenLabs 進行文字轉語音、透過 Scribe
v2 進行批次語音轉文字，並透過 Scribe v2 Realtime 進行串流 STT。

| 功能                     | OpenClaw 介面                                                         | 預設值                   |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| 文字轉語音               | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| 批次語音轉文字           | `tools.media.audio`                                                  | `scribe_v2`              |
| 串流語音轉文字           | 語音通話串流或 Google Meet `realtime.transcriptionProvider`          | `scribe_v2_realtime`     |

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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

將 `modelId` 設為 `eleven_v3` 可使用 ElevenLabs v3 TTS。OpenClaw 保留
`eleven_multilingual_v2` 作為既有安裝的預設值。

當 ElevenLabs 是選定的 `voice.tts`/`messages.tts` 提供者時，Discord 語音頻道會使用 ElevenLabs 的串流 TTS 端點。播放會從回傳的音訊串流開始，而不是先等待 OpenClaw 下載並寫入整個音訊檔。對於接受該參數的模型，`latencyTier` 會對應到 ElevenLabs 的
`optimize_streaming_latency` 查詢參數；OpenClaw 會對 `eleven_v3` 省略該參數，因為該模型會拒絕它。

## 語音轉文字

將 Scribe v2 用於傳入的音訊附件和短錄音語音片段：

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

OpenClaw 會將 multipart 音訊傳送到 ElevenLabs `/v1/speech-to-text`，並帶上
`model_id: "scribe_v2"`。存在語言提示時，會對應到 `language_code`。

## 串流 STT

內建的 `elevenlabs` 外掛會為語音通話和 Google Meet agent 模式串流轉錄註冊 Scribe v2 Realtime。

| 設定           | 設定路徑                                                                  | 預設值                                            |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API 金鑰       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | 退回使用 `ELEVENLABS_API_KEY` / `XI_API_KEY`      |
| 模型           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| 音訊格式       | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| 取樣率         | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| 提交策略       | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| 語言           | `...elevenlabs.languageCode`                                              | （未設定）                                        |

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
語音通話會以 8 kHz G.711 u-law 接收 Twilio 媒體。ElevenLabs 即時提供者預設為 `ulaw_8000`，因此電話音訊影格可以不經轉碼直接轉送。
</Note>

對於 Google Meet agent 模式，將
`plugins.entries.google-meet.config.realtime.transcriptionProvider` 設為
`"elevenlabs"`，並在
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` 下設定相同的提供者區塊。

## 相關

- [文字轉語音](/zh-TW/tools/tts)
- [Google Meet](/zh-TW/plugins/google-meet)
- [模型選擇](/zh-TW/concepts/model-providers)
