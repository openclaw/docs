---
read_when:
    - 你想在 OpenClaw 中使用 ElevenLabs 文字轉語音功能
    - 你想要使用 ElevenLabs Scribe 將音訊附件轉為文字
    - 你想要使用 ElevenLabs 為語音通話或 Google Meet 進行即時轉錄
summary: 搭配 OpenClaw 使用 ElevenLabs 語音、Scribe 語音轉文字及即時轉錄
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-22T10:45:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c570aab5fd3ca00e8ded8e3daa143cb199334d507461800ec0b6c1ab0b65c59
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw 使用 ElevenLabs 進行文字轉語音、透過 Scribe
v2 進行批次語音轉文字，以及透過 Scribe v2 Realtime 進行串流 STT。此內建外掛預設
為啟用；不需要 `plugins install` 步驟。

| 功能                     | OpenClaw 介面                                                         | 預設值                   |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| 文字轉語音               | `tts` / `talk`                                                       | `eleven_multilingual_v2` |
| 批次語音轉文字           | `tools.media.audio`                                                  | `scribe_v2`              |
| 串流語音轉文字           | Voice Call 串流或 Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## 驗證

在環境中設定 `ELEVENLABS_API_KEY`。為了相容於現有的 ElevenLabs 工具，
也接受 `XI_API_KEY`。

```bash
export ELEVENLABS_API_KEY="..."
```

## 文字轉語音

```json5
{
  tts: {
    providers: {
      elevenlabs: {
        apiKey: "${ELEVENLABS_API_KEY}",
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

將 `modelId` 設為 `eleven_v3`，即可使用 ElevenLabs v3 TTS。OpenClaw 針對
現有安裝仍以 `eleven_multilingual_v2` 為預設值。

當選取 ElevenLabs 作為 `voice.tts`/`tts` 提供者時，Discord 語音頻道會使用 ElevenLabs
的串流 TTS 端點：播放會直接從回傳的音訊串流開始，而不會先等待 OpenClaw
下載整個音訊檔案。對於接受此參數的模型，`latencyTier` 會對應至 ElevenLabs 的
`optimize_streaming_latency` 查詢參數；對於會拒絕此參數的
`eleven_v3`，OpenClaw 則會省略該參數。

## 語音轉文字

針對傳入的音訊附件和簡短錄製語音片段使用 Scribe v2：

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

OpenClaw 會將多部分音訊傳送至 ElevenLabs `/v1/speech-to-text`，並使用
`model_id: "scribe_v2"`。若有語言提示，則會對應至 `language_code`。

## 串流 STT

內建的 `elevenlabs` 外掛會註冊 Scribe v2 Realtime，供 Voice Call 和
Google Meet 代理程式模式的串流轉錄使用。

| 設定            | 設定路徑                                                                  | 預設值                                            |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API 金鑰        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | 後援使用 `ELEVENLABS_API_KEY` / `XI_API_KEY` |
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
Voice Call 會接收 Twilio 媒體的 8 kHz G.711 u-law 音訊。ElevenLabs 即時
提供者預設使用 `ulaw_8000`，因此無須轉碼即可轉送
電話通訊音訊影格。
</Note>

對於 Google Meet 代理程式模式，請將
`plugins.entries.google-meet.config.realtime.transcriptionProvider` 設為
`"elevenlabs"`，並在
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` 下設定相同的提供者區塊。

## 相關內容

- [文字轉語音](/zh-TW/tools/tts)
- [Google Meet](/zh-TW/plugins/google-meet)
- [模型選擇](/zh-TW/concepts/model-providers)
