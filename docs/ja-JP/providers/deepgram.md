---
read_when:
    - 音声添付ファイルに Deepgram の音声テキスト変換を使用したい場合
    - Voice Call 用に Deepgram ストリーミング文字起こしを使用したい
    - Deepgram設定の簡単な例が必要です
summary: 受信したボイスメモ向けの Deepgram 文字起こし
title: Deepgram
x-i18n:
    generated_at: "2026-07-05T11:43:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram は音声テキスト変換 API です。OpenClaw は `tools.media.audio` を通じた受信音声/ボイスメモの
文字起こしと、`plugins.entries.voice-call.config.streaming` を通じた Voice Call ストリーミング STT
にこれを使用します。

バッチ文字起こしは完全な音声ファイルを Deepgram にアップロードし、
文字起こし結果を返信パイプライン（`{{Transcript}}` + `[Audio]` ブロック）に注入します。
Voice Call ストリーミングはライブの G.711 u-law フレームを Deepgram の
WebSocket `listen` エンドポイントへ転送し、Deepgram が返すたびに部分/最終文字起こしを出力します。

| 詳細        | 値                                                         |
| ------------- | ---------------------------------------------------------- |
| ウェブサイト       | [deepgram.com](https://deepgram.com)                       |
| ドキュメント          | [developers.deepgram.com](https://developers.deepgram.com) |
| 認証          | `DEEPGRAM_API_KEY`                                         |
| デフォルトモデル | `nova-3`                                                   |

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
    接続済みの任意のチャネルを通じて音声メッセージを送信します。OpenClaw は Deepgram 経由で文字起こしし、
    文字起こし結果を返信パイプラインに注入します。
  </Step>
</Steps>

## 設定オプション

| オプション     | パス                                  | 説明                                  |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Deepgram モデル ID（デフォルト: `nova-3`） |
| `language` | `tools.media.audio.models[].language` | 言語ヒント（任意）              |

`providerOptions.deepgram` は追加のクエリパラメーターを Deepgram `/listen` リクエストへ直接マージするため、
Deepgram がサポートする任意のパラメーター名を使用できます
（例: `detect_language`, `punctuate`, `smart_format`）:

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

バンドルされた `deepgram` Plugin は、Voice Call Plugin 用のリアルタイム文字起こしプロバイダーも登録します。

| 設定         | 設定パス                                                             | デフォルト                          |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| API キー         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | `DEEPGRAM_API_KEY` にフォールバック |
| モデル           | `...deepgram.model`                                                     | `nova-3`                         |
| 言語        | `...deepgram.language`                                                  | （未設定）                          |
| エンコーディング        | `...deepgram.encoding`                                                  | `mulaw`                          |
| サンプルレート     | `...deepgram.sampleRate`                                                | `8000`                           |
| エンドポイント処理     | `...deepgram.endpointingMs`                                             | `800`                            |
| 暫定結果 | `...deepgram.interimResults`                                            | `true`                           |

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
Voice Call は電話音声を 8 kHz G.711 u-law として受信します。Deepgram
ストリーミングプロバイダーはデフォルトで `encoding: "mulaw"` と `sampleRate: 8000` を使用するため、
Twilio メディアフレームを直接転送できます。
</Note>

## メモ

<AccordionGroup>
  <Accordion title="認証">
    認証は標準のプロバイダー認証順序に従います。`DEEPGRAM_API_KEY` が
    最も簡単な方法です。
  </Accordion>
  <Accordion title="プロキシとカスタムエンドポイント">
    プロキシを使用する場合は、`tools.media.audio.baseUrl` と
    `tools.media.audio.headers` でエンドポイントまたはヘッダーを上書きします。
  </Accordion>
  <Accordion title="出力動作">
    出力は他のプロバイダーと同じ音声ルール（サイズ上限、タイムアウト、
    文字起こし注入）に従います。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="メディアツール" href="/ja-JP/tools/media-overview" icon="photo-film">
    音声、画像、動画処理パイプラインの概要。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    メディアツール設定を含む完全な設定リファレンス。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とデバッグ手順。
  </Card>
  <Card title="FAQ" href="/ja-JP/help/faq" icon="circle-question">
    OpenClaw セットアップに関するよくある質問。
  </Card>
</CardGroup>
