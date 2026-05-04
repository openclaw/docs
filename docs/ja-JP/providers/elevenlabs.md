---
read_when:
    - OpenClawでElevenLabsのテキスト読み上げを使いたい
    - 音声添付ファイルに ElevenLabs Scribe の音声テキスト変換を使いたい
    - 音声通話または Google Meet で ElevenLabs のリアルタイム文字起こしを使用したい場合
summary: OpenClawでElevenLabs音声、Scribe STT、リアルタイム文字起こしを使う
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T07:04:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw は、テキスト読み上げに ElevenLabs、Scribe
v2 によるバッチ音声テキスト化、Scribe v2 Realtime によるストリーミング STT を使用します。

| 機能                       | OpenClaw のサーフェス                                                | デフォルト               |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| テキスト読み上げ           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| バッチ音声テキスト化       | `tools.media.audio`                                                  | `scribe_v2`              |
| ストリーミング音声テキスト化 | Voice Call ストリーミングまたは Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## 認証

環境で `ELEVENLABS_API_KEY` を設定します。既存の ElevenLabs ツールとの互換性のため、
`XI_API_KEY` も受け付けられます。

```bash
export ELEVENLABS_API_KEY="..."
```

## テキスト読み上げ

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

ElevenLabs v3 TTS を使用するには、`modelId` を `eleven_v3` に設定します。OpenClaw は既存のインストール向けに、
`eleven_multilingual_v2` をデフォルトのままにします。

## 音声テキスト化

受信音声添付ファイルと短い録音音声セグメントには Scribe v2 を使用します。

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

OpenClaw は、`model_id: "scribe_v2"` を指定してマルチパート音声を ElevenLabs `/v1/speech-to-text` に送信します。言語ヒントがある場合は `language_code` にマッピングされます。

## ストリーミング STT

同梱の `elevenlabs` Plugin は、Voice Call と
Google Meet エージェントモードのストリーミング文字起こし向けに Scribe v2 Realtime を登録します。

| 設定              | 設定パス                                                                  | デフォルト                                        |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API キー         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` にフォールバック |
| モデル           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| 音声形式          | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| サンプルレート     | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| コミット戦略       | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| 言語              | `...elevenlabs.languageCode`                                              | (未設定)                                           |

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
Voice Call は Twilio メディアを 8 kHz G.711 u-law として受信します。ElevenLabs リアルタイムプロバイダーのデフォルトは `ulaw_8000` のため、電話フレームはトランスコードなしで転送できます。
</Note>

Google Meet エージェントモードでは、
`plugins.entries.google-meet.config.realtime.transcriptionProvider` を
`"elevenlabs"` に設定し、同じプロバイダーブロックを
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` の下に設定します。

## 関連

- [テキスト読み上げ](/ja-JP/tools/tts)
- [Google Meet](/ja-JP/plugins/google-meet)
- [モデル選択](/ja-JP/concepts/model-providers)
