---
read_when:
    - Inworld 音声合成を送信返信に使用したい
    - Inworld から PCM テレフォニーまたは OGG_OPUS ボイスメモ出力が必要です
summary: OpenClaw の返信向け Inworld ストリーミングテキスト読み上げ
title: Inworld
x-i18n:
    generated_at: "2026-07-05T11:44:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld はストリーミングのテキスト読み上げ (TTS) プロバイダーです。OpenClaw では、送信返信音声 (デフォルトは MP3、ボイスノートでは OGG_OPUS) と、Voice Call などの電話チャンネル向けの生 PCM 音声を合成します。

OpenClaw は Inworld のストリーミング TTS エンドポイントに投稿し、返された base64 音声チャンクを 1 つのバッファーに連結して、その結果を標準の返信音声パイプラインに渡します。

| プロパティ      | 値                                                           |
| ------------- | --------------------------------------------------------------- |
| プロバイダー ID   | `inworld`                                                       |
| Plugin        | 公式外部パッケージ (`@openclaw/inworld-speech`)          |
| コントラクト      | `speechProviders` (TTS のみ)                                    |
| 認証環境変数  | `INWORLD_API_KEY` (HTTP Basic、Base64 ダッシュボード認証情報)     |
| ベース URL      | `https://api.inworld.ai`                                        |
| デフォルト音声 | `Sarah`                                                         |
| デフォルトモデル | `inworld-tts-1.5-max`                                           |
| 出力        | MP3 (デフォルト)、OGG_OPUS (ボイスノート)、PCM 22050 Hz (電話) |
| Web サイト       | [inworld.ai](https://inworld.ai)                                |
| ドキュメント          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Pluginをインストール

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="API キーを設定する">
    Inworld ダッシュボード (Workspace > API Keys) から認証情報をコピーし、環境変数として設定します。この値は HTTP Basic 認証情報としてそのまま送信されるため、再度 Base64 エンコードしたり、ベアラートークンに変換したりしないでください。

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
    接続済みチャンネルから返信を送信します。OpenClaw は Inworld で音声を合成し、MP3 として配信します (チャンネルがボイスノートを想定している場合は OGG_OPUS)。
  </Step>
</Steps>

## 設定オプション

| オプション        | パス                                         | 説明                                                         |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 ダッシュボード認証情報。`INWORLD_API_KEY` にフォールバックします。       |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Inworld API ベース URL を上書きします (デフォルト `https://api.inworld.ai`)。   |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 音声識別子 (デフォルト `Sarah`)。レガシーエイリアス: `speakerVoiceId`。 |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS モデル ID (デフォルト `inworld-tts-1.5-max`)。                       |
| `temperature` | `messages.tts.providers.inworld.temperature` | サンプリング温度、`0` (排他) から `2` (任意)。            |

## 注意事項

<AccordionGroup>
  <Accordion title="認証">
    Inworld は、単一の Base64 エンコード済み認証情報文字列を使った HTTP Basic 認証を使用します。Inworld ダッシュボードからそのままコピーしてください。プロバイダーは追加のエンコードなしで `Authorization: Basic <apiKey>` として送信するため、自分で Base64 エンコードせず、ベアラー形式のトークンも渡さないでください。同じ注意事項については [TTS 認証メモ](/ja-JP/tools/tts#inworld-primary) を参照してください。
  </Accordion>
  <Accordion title="モデル">
    サポートされるモデル ID: `inworld-tts-1.5-max` (デフォルト)、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音声出力">
    返信はデフォルトで MP3 を使用します。チャンネルターゲットが `voice-note` の場合、OpenClaw は音声がネイティブの音声吹き出しとして再生されるよう、Inworld に `OGG_OPUS` を要求します。電話合成では、電話ブリッジに渡すために 22050 Hz の生 `PCM` を使用します。
  </Accordion>
  <Accordion title="カスタムエンドポイント">
    `messages.tts.providers.inworld.baseUrl` で API ホストを上書きします。リクエスト送信前に末尾のスラッシュは削除されます。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="テキスト読み上げ" href="/ja-JP/tools/tts" icon="waveform-lines">
    TTS の概要、プロバイダー、`messages.tts` 設定。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    `messages.tts` 設定を含む完全な設定リファレンス。
  </Card>
  <Card title="プロバイダー" href="/ja-JP/providers" icon="grid">
    サポートされているすべての OpenClaw プロバイダー。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とデバッグ手順。
  </Card>
</CardGroup>
