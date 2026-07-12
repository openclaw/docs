---
read_when:
    - 送信する返信に Inworld の音声合成を使用したい場合
    - Inworld からの PCM テレフォニーまたは OGG_OPUS ボイスメモ出力が必要です
summary: OpenClawの返信向けInworldストリーミング音声合成
title: Inworld
x-i18n:
    generated_at: "2026-07-11T22:37:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld はストリーミング方式のテキスト読み上げ（TTS）プロバイダーです。OpenClaw では、送信する返信音声（デフォルトは MP3、ボイスメモの場合は OGG_OPUS）と、Voice Call などの電話チャネル向けの未加工 PCM 音声を合成します。

OpenClaw は Inworld のストリーミング TTS エンドポイントにリクエストを送信し、返された Base64 音声チャンクを単一のバッファに連結して、その結果を標準の返信音声パイプラインに渡します。

| プロパティー      | 値                                                           |
| ------------- | --------------------------------------------------------------- |
| プロバイダー ID   | `inworld`                                                       |
| Plugin        | 公式外部パッケージ（`@openclaw/inworld-speech`）          |
| コントラクト      | `speechProviders`（TTS のみ）                                    |
| 認証環境変数  | `INWORLD_API_KEY`（HTTP Basic、Base64 形式のダッシュボード認証情報）     |
| ベース URL      | `https://api.inworld.ai`                                        |
| デフォルト音声 | `Sarah`                                                         |
| デフォルトモデル | `inworld-tts-1.5-max`                                           |
| 出力        | MP3（デフォルト）、OGG_OPUS（ボイスメモ）、PCM 22050 Hz（電話） |
| ウェブサイト       | [inworld.ai](https://inworld.ai)                                |
| ドキュメント          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Plugin をインストールする

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="API キーを設定する">
    Inworld ダッシュボード（Workspace > API Keys）から認証情報をコピーし、環境変数として設定します。この値は HTTP Basic 認証情報としてそのまま送信されるため、再度 Base64 エンコードしたり、Bearer トークンに変換したりしないでください。

    ```bash
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="messages.tts で Inworld を選択する">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="メッセージを送信する">
    接続済みの任意のチャネルから返信を送信します。OpenClaw は Inworld で音声を合成し、MP3 として配信します（チャネルがボイスメモを要求する場合は OGG_OPUS）。
  </Step>
</Steps>

## 設定オプション

| オプション        | パス                                         | 説明                                                         |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 形式のダッシュボード認証情報。`INWORLD_API_KEY` にフォールバックします。       |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Inworld API のベース URL を上書きします（デフォルトは `https://api.inworld.ai`）。   |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 音声識別子（デフォルトは `Sarah`）。レガシーエイリアス：`speakerVoiceId`。 |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS モデル ID（デフォルトは `inworld-tts-1.5-max`）。                       |
| `temperature` | `messages.tts.providers.inworld.temperature` | サンプリング温度。`0` より大きく `2` 以下（任意）。            |

## 注記

<AccordionGroup>
  <Accordion title="認証">
    Inworld は、単一の Base64 エンコード済み認証情報文字列による HTTP Basic 認証を使用します。Inworld ダッシュボードからそのままコピーしてください。プロバイダーは追加のエンコードを行わず、`Authorization: Basic <apiKey>` として送信します。そのため、自分で Base64 エンコードしたり、Bearer 形式のトークンを渡したりしないでください。同じ注意事項については、[TTS 認証の注記](/ja-JP/tools/tts#inworld-primary)を参照してください。
  </Accordion>
  <Accordion title="モデル">
    サポートされているモデル ID：`inworld-tts-1.5-max`（デフォルト）、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音声出力">
    返信ではデフォルトで MP3 を使用します。チャネルの送信先が `voice-note` の場合、OpenClaw は音声がネイティブの音声吹き出しとして再生されるよう、Inworld に `OGG_OPUS` を要求します。電話向けの合成では、電話ブリッジに供給するために 22050 Hz の未加工 `PCM` を使用します。
  </Accordion>
  <Accordion title="カスタムエンドポイント">
    `messages.tts.providers.inworld.baseUrl` で API ホストを上書きします。リクエストを送信する前に、末尾のスラッシュは削除されます。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="テキスト読み上げ" href="/ja-JP/tools/tts" icon="waveform-lines">
    TTS の概要、プロバイダー、および `messages.tts` の設定。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    `messages.tts` の設定を含む完全な設定リファレンス。
  </Card>
  <Card title="プロバイダー" href="/ja-JP/providers" icon="grid">
    OpenClaw がサポートするすべてのプロバイダー。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的な問題とデバッグ手順。
  </Card>
</CardGroup>
