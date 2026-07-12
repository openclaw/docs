---
read_when:
    - OpenClaw で ElevenLabs のテキスト読み上げを使用したい場合
    - 音声添付ファイルに ElevenLabs Scribe の音声テキスト変換を使用したい場合
    - Voice Call または Google Meet で ElevenLabs のリアルタイム文字起こしを利用したい場合
summary: OpenClaw で ElevenLabs の音声、Scribe STT、リアルタイム文字起こしを使用する
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-11T22:36:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw は、テキスト読み上げ、Scribe v2 によるバッチ音声テキスト変換、
および Scribe v2 Realtime によるストリーミング音声テキスト変換に ElevenLabs を使用します。この Plugin は同梱され、
デフォルトで有効になっているため、`plugins install` の手順は不要です。

| 機能                             | OpenClaw の提供機能                                                  | デフォルト               |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------ |
| テキスト読み上げ                 | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| バッチ音声テキスト変換           | `tools.media.audio`                                                  | `scribe_v2`              |
| ストリーミング音声テキスト変換   | Voice Call ストリーミングまたは Google Meet の `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## 認証

環境に `ELEVENLABS_API_KEY` を設定します。既存の ElevenLabs ツールとの
互換性のため、`XI_API_KEY` も使用できます。

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

ElevenLabs v3 TTS を使用するには、`modelId` を `eleven_v3` に設定します。OpenClaw は既存のインストール環境向けに、
引き続き `eleven_multilingual_v2` をデフォルトとして使用します。

ElevenLabs が選択された `voice.tts`/`messages.tts` プロバイダーである場合、Discord のボイスチャンネルは ElevenLabs のストリーミング TTS エンドポイントを使用します。OpenClaw が音声ファイル全体を先にダウンロードするのを待たずに、
返された音声ストリームから再生を開始します。`latencyTier` は、対応するモデルでは ElevenLabs の `optimize_streaming_latency`
クエリパラメーターに対応します。OpenClaw は、このパラメーターを受け付けない
`eleven_v3` では省略します。

## 音声テキスト変換

受信した音声添付ファイルや短い録音音声には Scribe v2 を使用します。

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

OpenClaw は `model_id: "scribe_v2"` を指定し、マルチパート形式の音声を ElevenLabs の `/v1/speech-to-text` に送信します。
言語のヒントがある場合は、`language_code` に対応付けられます。

## ストリーミング音声テキスト変換

同梱の `elevenlabs` Plugin は、Voice Call および
Google Meet のエージェントモードでのストリーミング文字起こし用に Scribe v2 Realtime を登録します。

| 設定             | 設定パス                                                                  | デフォルト                                           |
| ---------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| API キー         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` にフォールバック |
| モデル           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                                 |
| 音声形式         | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                          |
| サンプルレート   | `...elevenlabs.sampleRate`                                                | `8000`                                               |
| コミット方式     | `...elevenlabs.commitStrategy`                                            | `vad`                                                |
| 言語             | `...elevenlabs.languageCode`                                              | （未設定）                                           |

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
Voice Call は Twilio メディアを 8 kHz G.711 μ-law 形式で受信します。ElevenLabs のリアルタイム
プロバイダーのデフォルトは `ulaw_8000` であるため、電話音声フレームをトランスコードせずに
転送できます。
</Note>

Google Meet のエージェントモードでは、
`plugins.entries.google-meet.config.realtime.transcriptionProvider` を
`"elevenlabs"` に設定し、同じプロバイダーブロックを
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` に設定します。

## 関連項目

- [テキスト読み上げ](/ja-JP/tools/tts)
- [Google Meet](/ja-JP/plugins/google-meet)
- [モデルの選択](/ja-JP/concepts/model-providers)
