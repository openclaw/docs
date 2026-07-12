---
read_when:
    - 你想在 OpenClaw 中使用 ElevenLabs 文字轉語音功能
    - 您想要使用 ElevenLabs Scribe 將音訊附件轉換為文字
    - 您想要為語音通話或 Google Meet 使用 ElevenLabs 即時轉錄功能
summary: 搭配 OpenClaw 使用 ElevenLabs 語音、Scribe 語音轉文字及即時轉錄
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-11T21:44:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw 使用 ElevenLabs 進行文字轉語音、透過 Scribe v2 進行批次語音轉文字，以及透過 Scribe v2 Realtime 進行串流語音轉文字。此「外掛」已隨附並預設啟用；無須執行 `plugins install` 步驟。

| 功能             | OpenClaw 介面                                                        | 預設值                   |
| ---------------- | -------------------------------------------------------------------- | ------------------------ |
| 文字轉語音       | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| 批次語音轉文字   | `tools.media.audio`                                                  | `scribe_v2`              |
| 串流語音轉文字   | Voice Call 串流或 Google Meet `realtime.transcriptionProvider`       | `scribe_v2_realtime`     |

## 驗證

在環境中設定 `ELEVENLABS_API_KEY`。為了與現有的 ElevenLabs 工具相容，也接受 `XI_API_KEY`。

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

將 `modelId` 設為 `eleven_v3` 即可使用 ElevenLabs v3 文字轉語音。為了支援現有安裝，OpenClaw 仍以 `eleven_multilingual_v2` 為預設值。

當 ElevenLabs 是所選的 `voice.tts`/`messages.tts` 提供者時，Discord 語音頻道會使用 ElevenLabs 的串流文字轉語音端點：播放會直接從傳回的音訊串流開始，而不會先等待 OpenClaw 下載完整音訊檔案。對於支援此參數的模型，`latencyTier` 會對應至 ElevenLabs 的 `optimize_streaming_latency` 查詢參數；OpenClaw 不會為會拒絕此參數的 `eleven_v3` 傳送該參數。

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

OpenClaw 會將多部分音訊傳送至 ElevenLabs `/v1/speech-to-text`，並指定 `model_id: "scribe_v2"`。如果有語言提示，則會對應至 `language_code`。

## 串流語音轉文字

隨附的 `elevenlabs`「外掛」會為 Voice Call 和 Google Meet 代理程式模式的串流轉錄註冊 Scribe v2 Realtime。

| 設定         | 設定路徑                                                                  | 預設值                                        |
| ------------ | ------------------------------------------------------------------------- | --------------------------------------------- |
| API 金鑰     | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | 回退至 `ELEVENLABS_API_KEY` / `XI_API_KEY`    |
| 模型         | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                          |
| 音訊格式     | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                   |
| 取樣率       | `...elevenlabs.sampleRate`                                                | `8000`                                        |
| 提交策略     | `...elevenlabs.commitStrategy`                                            | `vad`                                         |
| 語言         | `...elevenlabs.languageCode`                                              | （未設定）                                    |

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
Voice Call 會接收 Twilio 傳送的 8 kHz G.711 μ-law 媒體。ElevenLabs 即時提供者預設使用 `ulaw_8000`，因此電話語音訊框架無須轉碼即可轉送。
</Note>

對於 Google Meet 代理程式模式，請將 `plugins.entries.google-meet.config.realtime.transcriptionProvider` 設為 `"elevenlabs"`，並在 `plugins.entries.google-meet.config.realtime.providers.elevenlabs` 下設定相同的提供者區塊。

## 相關內容

- [文字轉語音](/zh-TW/tools/tts)
- [Google Meet](/zh-TW/plugins/google-meet)
- [模型選擇](/zh-TW/concepts/model-providers)
