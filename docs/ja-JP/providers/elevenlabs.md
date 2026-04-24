---
read_when:
    - |-
      OpenClawでElevenLabs text-to-speechを使いたい中央値との差 to=functions.read in commentary  天天中彩票qq
      {"path":"docs/providers/elevenlabs.md","offset":1,"limit":300}
    - 音声添付ファイルに ElevenLabs Scribe speech-to-text を使いたい
    - Voice Callに ElevenLabs realtime transcription を使いたい
summary: ElevenLabs音声、Scribe STT、リアルタイム文字起こしをOpenClawで使う
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T05:14:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClawは、text-to-speech、Scribe
v2によるバッチspeech-to-text、Scribe v2 RealtimeによるVoice CallストリーミングSTTにElevenLabsを使います。

| Capability | OpenClawサーフェス | デフォルト |
| ------------------------ | --------------------------------------------- | ------------------------ |
| Text-to-speech | `messages.tts` / `talk` | `eleven_multilingual_v2` |
| バッチspeech-to-text | `tools.media.audio` | `scribe_v2` |
| ストリーミングspeech-to-text | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime` |

## 認証

環境変数に `ELEVENLABS_API_KEY` を設定します。既存のElevenLabsツールとの互換性のため、
`XI_API_KEY` も受け付けます。

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-to-speech

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

## Speech-to-text

受信音声添付ファイルや短い録音音声セグメントには、Scribe v2を使います:

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

OpenClawは、マルチパート音声を ElevenLabs の `/v1/speech-to-text` に
`model_id: "scribe_v2"` 付きで送信します。言語ヒントが存在する場合は
`language_code` にマッピングされます。

## Voice CallストリーミングSTT

バンドル済みの `elevenlabs` Pluginは、Voice Call
ストリーミング文字起こし用にScribe v2 Realtimeを登録します。

| 設定 | 設定パス | デフォルト |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API key | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` にフォールバック |
| モデル | `...elevenlabs.modelId` | `scribe_v2_realtime` |
| 音声フォーマット | `...elevenlabs.audioFormat` | `ulaw_8000` |
| サンプルレート | `...elevenlabs.sampleRate` | `8000` |
| Commit戦略 | `...elevenlabs.commitStrategy` | `vad` |
| 言語 | `...elevenlabs.languageCode` | （未設定） |

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
Voice Callは、Twilioメディアを8 kHz G.711 u-lawで受信します。ElevenLabs realtime
providerはデフォルトで `ulaw_8000` を使うため、電話音声フレームは
トランスコードなしで転送できます。
</Note>

## 関連

- [Text-to-speech](/ja-JP/tools/tts)
- [モデル選択](/ja-JP/concepts/model-providers)
