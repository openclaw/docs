---
read_when:
    - 送信返信に Azure Speech 合成を使いたい
    - Azure Speech からネイティブの Ogg Opus ボイスメモ出力が必要です
summary: OpenClaw の返信向け Azure AI Speech テキスト読み上げ
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T12:39:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech は Azure AI Speech のテキスト読み上げプロバイダーです。OpenClaw では、送信返信音声をデフォルトで MP3、音声メモ用にはネイティブ Ogg/Opus、Voice Call などの電話チャネル用には 8 kHz mulaw 音声として合成します。

OpenClaw は SSML で Azure Speech REST API を直接使用し、プロバイダー所有の出力形式を `X-Microsoft-OutputFormat` で送信します。

| 詳細                    | 値                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Web サイト              | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| ドキュメント            | [Speech REST テキスト読み上げ](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| 認証                    | `AZURE_SPEECH_KEY` と `AZURE_SPEECH_REGION`                                                                    |
| デフォルト音声          | `en-US-JennyNeural`                                                                                            |
| デフォルトファイル出力  | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| デフォルト音声メモファイル | `ogg-24khz-16bit-mono-opus`                                                                                    |

## はじめに

<Steps>
  <Step title="Azure Speech リソースを作成する">
    Azure ポータルで Speech リソースを作成します。Resource Management > Keys and Endpoint から **KEY 1** をコピーし、`eastus` などのリソースの場所をコピーします。

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="messages.tts で Azure Speech を選択する">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="メッセージを送信する">
    接続済みの任意のチャネルから返信を送信します。OpenClaw は Azure Speech で音声を合成し、標準音声には MP3、チャネルが音声メモを想定している場合は Ogg/Opus を配信します。
  </Step>
</Steps>

## 設定オプション

| オプション              | パス                                                        | 説明                                                                                                  |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Azure Speech リソースキー。`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY`、または `SPEECH_KEY` にフォールバックします。 |
| `region`                | `messages.tts.providers.azure-speech.region`                | Azure Speech リソースのリージョン。`AZURE_SPEECH_REGION` または `SPEECH_REGION` にフォールバックします。 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | 任意の Azure Speech エンドポイント/ベース URL オーバーライド。                                       |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | 任意の Azure Speech ベース URL オーバーライド。                                                       |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | Azure 音声 ShortName（デフォルト `en-US-JennyNeural`）。レガシーエイリアス: `voice`。                |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | SSML 言語コード（デフォルト `en-US`）。                                                              |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | 音声ファイル出力形式（デフォルト `audio-24khz-48kbitrate-mono-mp3`）。                               |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | 音声メモ出力形式（デフォルト `ogg-24khz-16bit-mono-opus`）。                                         |

## 注記

<AccordionGroup>
  <Accordion title="認証">
    Azure Speech は Azure OpenAI キーではなく、Speech リソースキーを使用します。キーは `Ocp-Apim-Subscription-Key` として送信されます。`endpoint` または `baseUrl` を指定しない限り、OpenClaw は `region` から `https://<region>.tts.speech.microsoft.com` を導出します。
  </Accordion>
  <Accordion title="音声名">
    Azure Speech 音声の `ShortName` 値を使用します。例: `en-US-JennyNeural`。バンドルされたプロバイダーは同じ Speech リソースを通じて音声を一覧表示でき、deprecated または retired とマークされた音声をフィルターします。
  </Accordion>
  <Accordion title="音声出力">
    Azure は `audio-24khz-48kbitrate-mono-mp3`、`ogg-24khz-16bit-mono-opus`、`riff-24khz-16bit-mono-pcm` などの出力形式を受け付けます。OpenClaw は `voice-note` ターゲットに対して Ogg/Opus を要求するため、チャネルは追加の MP3 変換なしでネイティブ音声バブルを送信できます。
  </Accordion>
  <Accordion title="エイリアス">
    `azure` は既存の PR とユーザー設定向けのプロバイダーエイリアスとして受け付けられますが、新しい設定では Azure OpenAI モデルプロバイダーとの混同を避けるために `azure-speech` を使用してください。
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
    バンドルされているすべての OpenClaw プロバイダー。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とデバッグ手順。
  </Card>
</CardGroup>
