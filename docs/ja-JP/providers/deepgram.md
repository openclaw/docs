---
read_when:
    - 音声添付ファイルに対してDeepgramの音声認識を使いたい場合
    - Voice Call向けにDeepgramのストリーミング文字起こしを使いたい場合
    - Deepgramの簡単なconfig例が必要な場合
summary: 受信ボイスノートのDeepgram文字起こし
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T14:07:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram（音声文字起こし）

Deepgramは音声認識APIです。OpenClawでは、`tools.media.audio` を通じた受信
音声/ボイスノートの文字起こしと、`plugins.entries.voice-call.config.streaming` を通じたVoice Callの
ストリーミングSTTに使用されます。

バッチ文字起こしでは、OpenClawは完全な音声ファイルをDeepgramへアップロードし、
文字起こし結果を返信パイプラインへ注入します（`{{Transcript}}` +
`[Audio]` ブロック）。Voice Callのストリーミングでは、OpenClawはライブのG.711
u-lawフレームをDeepgramのWebSocket `listen` エンドポイントへ転送し、Deepgramが返した
部分または最終文字起こしを出力します。

| Detail        | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Website       | [deepgram.com](https://deepgram.com)                       |
| Docs          | [developers.deepgram.com](https://developers.deepgram.com) |
| Auth          | `DEEPGRAM_API_KEY`                                         |
| Default model | `nova-3`                                                   |

## はじめに

<Steps>
  <Step title="APIキーを設定する">
    Deepgram APIキーを環境変数へ追加します:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="音声プロバイダーを有効にする">
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
    接続済みチャンネルのいずれかを通じて音声メッセージを送信します。OpenClawが
    Deepgram経由で文字起こしし、その結果を返信パイプラインへ注入します。
  </Step>
</Steps>

## 設定オプション

| Option            | Path                                                         | 説明                                      |
| ----------------- | ------------------------------------------------------------ | ----------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Deepgramモデルid（デフォルト: `nova-3`）  |
| `language`        | `tools.media.audio.models[].language`                        | 言語ヒント（任意）                        |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | 言語検出を有効化（任意）                  |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | 句読点付与を有効化（任意）                |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | スマート整形を有効化（任意）              |

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
  <Tab title="Deepgramオプション付き">
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

## Voice CallストリーミングSTT

バンドル済みの `deepgram` Pluginは、Voice Call Plugin向けのリアルタイム文字起こしプロバイダーも登録します。

| Setting         | Config path                                                             | Default                          |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | `DEEPGRAM_API_KEY` へフォールバック |
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
Voice Callは、電話音声を8 kHz G.711 u-lawとして受信します。Deepgramの
ストリーミングプロバイダーはデフォルトで `encoding: "mulaw"` と `sampleRate: 8000` を使うため、
Twilioのメディアフレームをそのまま転送できます。
</Note>

## 注意

<AccordionGroup>
  <Accordion title="認証">
    認証は標準のプロバイダー認証順序に従います。もっとも簡単なのは `DEEPGRAM_API_KEY` です。
  </Accordion>
  <Accordion title="プロキシとカスタムエンドポイント">
    プロキシ利用時は、`tools.media.audio.baseUrl` と
    `tools.media.audio.headers` でエンドポイントやヘッダーを上書きできます。
  </Accordion>
  <Accordion title="出力動作">
    出力は他のプロバイダーと同じ音声ルールに従います（サイズ上限、タイムアウト、
    文字起こし注入）。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Media tools" href="/ja-JP/tools/media-overview" icon="photo-film">
    音声、画像、動画の処理パイプライン概要。
  </Card>
  <Card title="Configuration" href="/ja-JP/gateway/configuration" icon="gear">
    メディアツール設定を含む完全なconfigリファレンス。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とデバッグ手順。
  </Card>
  <Card title="FAQ" href="/ja-JP/help/faq" icon="circle-question">
    OpenClaw設定に関するよくある質問。
  </Card>
</CardGroup>
