---
read_when:
    - 音声添付ファイルに Deepgram の speech-to-text を使いたい場合
    - Voice Call で Deepgram のストリーミング文字起こしを使いたい場合
    - Deepgram のクイック設定例が必要な場合
summary: 受信ボイスノート向けの Deepgram 文字起こし
title: Deepgram
x-i18n:
    generated_at: "2026-04-25T13:56:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Deepgram は speech-to-text API です。OpenClaw では、
`tools.media.audio` を通じた受信音声/ボイスノートの文字起こし、および
`plugins.entries.voice-call.config.streaming` を通じた Voice Call のストリーミング STT に使用されます。

バッチ文字起こしでは、OpenClaw は完全な音声ファイルを Deepgram にアップロードし、
文字起こし結果を返信パイプラインに注入します（`{{Transcript}}` +
`[Audio]` block）。Voice Call のストリーミングでは、OpenClaw は live な G.711
u-law frame を Deepgram の WebSocket `listen` endpoint へ転送し、Deepgram が返す partial または
final transcript を発行します。

| Detail        | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Website       | [deepgram.com](https://deepgram.com)                       |
| Docs          | [developers.deepgram.com](https://developers.deepgram.com) |
| Auth          | `DEEPGRAM_API_KEY`                                         |
| Default model | `nova-3`                                                   |

## はじめに

<Steps>
  <Step title="API key を設定する">
    Deepgram API key を環境変数に追加します。

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="音声 provider を有効化する">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ボイスノートを送る">
    接続済みの任意の channel から音声メッセージを送ってください。OpenClaw は
    Deepgram 経由でそれを文字起こしし、その transcript を返信パイプラインに注入します。
  </Step>
</Steps>

## 設定オプション

| Option            | Path                                                         | Description                           |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Deepgram model id（デフォルト: `nova-3`） |
| `language`        | `tools.media.audio.models[].language`                        | 言語ヒント（任意）                    |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | 言語検出を有効化（任意）              |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | 句読点付与を有効化（任意）            |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | スマート整形を有効化（任意）          |

<Tabs>
  <Tab title="言語ヒントあり">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Deepgram オプションあり">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Voice Call ストリーミング STT

バンドル済みの `deepgram` Plugin は、Voice Call Plugin 向けの realtime transcription provider も登録します。

| Setting         | Config path                                                             | Default                          |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | `DEEPGRAM_API_KEY` にフォールバック |
| Model           | `...deepgram.model`                                                     | `nova-3`                         |
| Language        | `...deepgram.language`                                                  | （未設定）                       |
| Encoding        | `...deepgram.encoding`                                                  | `mulaw`                          |
| Sample rate     | `...deepgram.sampleRate`                                                | `8000`                           |
| Endpointing     | `...deepgram.endpointingMs`                                             | `800`                            |
| Interim results | `...deepgram.interimResults`                                            | `true`                           |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
Voice Call は、8 kHz G.711 u-law の電話音声を受信します。Deepgram
streaming provider のデフォルトは `encoding: "mulaw"` と `sampleRate: 8000` なので、
Twilio の media frame をそのまま直接転送できます。
</Note>

## 注意

<AccordionGroup>
  <Accordion title="認証">
    認証は標準の provider auth 順序に従います。最も簡単なのは `DEEPGRAM_API_KEY` を使う方法です。
  </Accordion>
  <Accordion title="Proxy とカスタム endpoint">
    proxy を使用する場合は、`tools.media.audio.baseUrl` と
    `tools.media.audio.headers` で endpoint または header を上書きします。
  </Accordion>
  <Accordion title="出力動作">
    出力は他の provider と同じ音声ルールに従います（size cap、timeout、
    transcript injection）。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Media tools" href="/ja-JP/tools/media-overview" icon="photo-film">
    音声、画像、および動画処理パイプラインの概要。
  </Card>
  <Card title="Configuration" href="/ja-JP/gateway/configuration" icon="gear">
    media tool 設定を含む完全な設定リファレンス。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的な問題とデバッグ手順。
  </Card>
  <Card title="FAQ" href="/ja-JP/help/faq" icon="circle-question">
    OpenClaw セットアップに関するよくある質問。
  </Card>
</CardGroup>
