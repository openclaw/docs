---
read_when:
    - OpenClawでElevenLabsのテキスト読み上げを使いたい場合
    - 音声添付ファイルに ElevenLabs Scribe の音声テキスト変換を使いたい
    - Voice Call または Google Meet で ElevenLabs リアルタイム文字起こしを使いたい
summary: OpenClaw で ElevenLabs 音声、Scribe STT、リアルタイム文字起こしを使用する
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-27T12:42:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw は、テキスト読み上げに ElevenLabs、Scribe
v2 によるバッチ音声テキスト変換、Scribe v2 Realtime によるストリーミング STT を使用します。

| 機能                     | OpenClaw サーフェス                                                   | デフォルト               |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| テキスト読み上げ         | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| バッチ音声テキスト変換   | `tools.media.audio`                                                  | `scribe_v2`              |
| ストリーミング音声テキスト変換 | Voice Call ストリーミングまたは Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## 認証

環境に `ELEVENLABS_API_KEY` を設定します。既存の ElevenLabs ツールとの互換性のため、
`XI_API_KEY` も受け付けます。

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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

ElevenLabs v3 TTS を使用するには、`modelId` を `eleven_v3` に設定します。OpenClaw は既存のインストール向けに
`eleven_multilingual_v2` をデフォルトとして維持します。

ElevenLabs が選択された `voice.tts`/`messages.tts` プロバイダーの場合、Discord 音声チャンネルは ElevenLabs のストリーミング TTS エンドポイントを使用します。再生は、OpenClaw が最初に音声ファイル全体をダウンロードして書き込むのを待つのではなく、返された音声ストリームから開始されます。`latencyTier` は、それを受け付けるモデルでは ElevenLabs の
`optimize_streaming_latency` クエリパラメーターにマッピングされます。OpenClaw は、それを拒否する `eleven_v3` ではそのパラメーターを省略します。

## 音声テキスト変換

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

OpenClaw は、`model_id: "scribe_v2"` を指定して、multipart 音声を ElevenLabs `/v1/speech-to-text` に送信します。言語ヒントがある場合は `language_code` にマッピングされます。

## ストリーミング STT

バンドルされた `elevenlabs` Plugin は、Voice Call と Google Meet エージェントモードのストリーミング文字起こし向けに Scribe v2 Realtime を登録します。

| 設定            | 設定パス                                                                 | デフォルト                                      |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API キー        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` にフォールバック |
| モデル          | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| 音声形式        | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| サンプルレート  | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| コミット戦略    | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| 言語            | `...elevenlabs.languageCode`                                              | （未設定）                                        |

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
Voice Call は Twilio メディアを 8 kHz G.711 u-law として受信します。ElevenLabs リアルタイムプロバイダーのデフォルトは `ulaw_8000` なので、電話フレームはトランスコードせずに転送できます。
</Note>

Google Meet エージェントモードでは、
`plugins.entries.google-meet.config.realtime.transcriptionProvider` を
`"elevenlabs"` に設定し、同じプロバイダーブロックを
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` の下に構成します。

## 関連

- [テキスト読み上げ](/ja-JP/tools/tts)
- [Google Meet](/ja-JP/plugins/google-meet)
- [モデル選択](/ja-JP/concepts/model-providers)
