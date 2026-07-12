---
read_when:
    - 音声添付ファイルに Deepgram の音声テキスト変換を使用したい場合
    - Voice CallでDeepgramのストリーミング文字起こしを使用する場合
    - Deepgram の簡単な設定例が必要です
summary: 受信した音声メモの Deepgram による文字起こし
title: Deepgram
x-i18n:
    generated_at: "2026-07-11T22:35:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram は音声テキスト変換 API です。OpenClaw は、`tools.media.audio` による受信音声/ボイスメモの文字起こしと、`plugins.entries.voice-call.config.streaming` による Voice Call のストリーミング音声テキスト変換に使用します。

バッチ文字起こしでは、音声ファイル全体を Deepgram にアップロードし、文字起こし結果を応答パイプライン（`{{Transcript}}` + `[Audio]` ブロック）に挿入します。Voice Call ストリーミングでは、ライブの G.711 u-law フレームを Deepgram の WebSocket `listen` エンドポイント経由で転送し、Deepgram から返される途中および最終の文字起こし結果を出力します。

| 詳細          | 値                                                         |
| ------------- | ---------------------------------------------------------- |
| ウェブサイト  | [deepgram.com](https://deepgram.com)                       |
| ドキュメント  | [developers.deepgram.com](https://developers.deepgram.com) |
| 認証          | `DEEPGRAM_API_KEY`                                         |
| 既定のモデル  | `nova-3`                                                   |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    ```bash
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
  <Step title="ボイスメモを送信する">
    接続済みの任意のチャンネルから音声メッセージを送信します。OpenClaw が Deepgram を介して文字起こしし、その結果を応答パイプラインに挿入します。
  </Step>
</Steps>

## 設定オプション

| オプション | パス                                  | 説明                                      |
| ---------- | ------------------------------------- | ----------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Deepgram のモデル ID（既定値: `nova-3`）  |
| `language` | `tools.media.audio.models[].language` | 言語のヒント（任意）                      |

`providerOptions.deepgram` は追加のクエリパラメーターを Deepgram の `/listen` リクエストに直接マージするため、Deepgram がサポートする任意のパラメーター名を使用できます（例: `detect_language`、`punctuate`、`smart_format`）。

<Tabs>
  <Tab title="言語のヒントを指定する場合">
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
  <Tab title="Deepgram のオプションを指定する場合">
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

## Voice Call のストリーミング音声テキスト変換

同梱の `deepgram` Plugin は、Voice Call Plugin 用のリアルタイム文字起こしプロバイダーも登録します。

| 設定             | 設定パス                                                                | 既定値                             |
| ---------------- | ----------------------------------------------------------------------- | ---------------------------------- |
| API キー         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | `DEEPGRAM_API_KEY` にフォールバック |
| モデル           | `...deepgram.model`                                                     | `nova-3`                           |
| 言語             | `...deepgram.language`                                                  | （未設定）                         |
| エンコーディング | `...deepgram.encoding`                                                  | `mulaw`                            |
| サンプルレート   | `...deepgram.sampleRate`                                                | `8000`                             |
| 発話終了判定     | `...deepgram.endpointingMs`                                             | `800`                              |
| 途中結果         | `...deepgram.interimResults`                                            | `true`                             |

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
Voice Call は、電話音声を 8 kHz G.711 u-law として受信します。Deepgram のストリーミングプロバイダーの既定値は `encoding: "mulaw"` および `sampleRate: 8000` であるため、Twilio のメディアフレームを直接転送できます。
</Note>

## 注意事項

<AccordionGroup>
  <Accordion title="認証">
    認証は標準のプロバイダー認証順序に従います。最も簡単な方法は `DEEPGRAM_API_KEY` です。
  </Accordion>
  <Accordion title="プロキシとカスタムエンドポイント">
    プロキシを使用する場合は、`tools.media.audio.baseUrl` と `tools.media.audio.headers` でエンドポイントまたはヘッダーを上書きします。
  </Accordion>
  <Accordion title="出力動作">
    出力は、他のプロバイダーと同じ音声処理規則（サイズ上限、タイムアウト、文字起こし結果の挿入）に従います。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="メディアツール" href="/ja-JP/tools/media-overview" icon="photo-film">
    音声、画像、動画の処理パイプラインの概要です。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    メディアツールの設定を含む完全な設定リファレンスです。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とデバッグ手順です。
  </Card>
  <Card title="よくある質問" href="/ja-JP/help/faq" icon="circle-question">
    OpenClaw のセットアップに関するよくある質問です。
  </Card>
</CardGroup>
