---
read_when:
    - 送信返信に Azure Speech 合成を使用したい
    - Azure Speech からネイティブの Ogg Opus ボイスノート出力が必要です
summary: OpenClaw の返信向け Azure AI Speech テキスト読み上げ
title: Azure Speech
x-i18n:
    generated_at: "2026-07-05T11:43:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech は、バンドルされた Azure AI Speech のテキスト読み上げプロバイダーです。OpenClaw は
SSML を使って Azure Speech REST API を直接呼び出し、標準の返信向けに MP3、
ボイスノート向けにネイティブ Ogg/Opus、Voice Call などの電話チャネル向けに
8 kHz mulaw を合成します。リクエストは、プロバイダー所有の出力形式を
`X-Microsoft-OutputFormat` ヘッダーで送信します。

| 詳細                    | 値                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| プロバイダー ID         | `azure-speech` (エイリアス: `azure`)                                                                           |
| Web サイト              | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| ドキュメント            | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| 認証                    | `AZURE_SPEECH_KEY` と `AZURE_SPEECH_REGION`                                                                    |
| デフォルト音声          | `en-US-JennyNeural`                                                                                            |
| デフォルトファイル出力  | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| デフォルトボイスノートファイル | `ogg-24khz-16bit-mono-opus`                                                                              |

## はじめに

<Steps>
  <Step title="Azure Speech リソースを作成する">
    Azure ポータルで Speech リソースを作成します。
    Resource Management > Keys and Endpoint から **KEY 1** をコピーし、
    `eastus` などのリソースの場所をコピーします。

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
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="メッセージを送信する">
    接続済みの任意のチャネルから返信を送信します。OpenClaw は Azure Speech で音声を合成し、
    標準音声には MP3 を配信し、チャネルがボイスノートを想定している場合は
    Ogg/Opus を配信します。
  </Step>
</Steps>

## 設定オプション

すべてのオプションは `messages.tts.providers["azure-speech"]` の下にあります。

| オプション              | 説明                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | Azure Speech リソースキー。`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY`、または `SPEECH_KEY` にフォールバックします。 |
| `region`                | Azure Speech リソースリージョン。`AZURE_SPEECH_REGION` または `SPEECH_REGION` にフォールバックします。 |
| `endpoint`              | 任意の Azure Speech エンドポイント上書き。`AZURE_SPEECH_ENDPOINT` にフォールバックします。             |
| `baseUrl`               | 任意の Azure Speech ベース URL 上書き。                                                               |
| `voice`                 | Azure 音声の ShortName (デフォルト `en-US-JennyNeural`)。レガシーエイリアス: `voiceId`。               |
| `lang`                  | SSML 言語コード (デフォルト `en-US`)。                                                                |
| `outputFormat`          | 音声ファイル出力形式 (デフォルト `audio-24khz-48kbitrate-mono-mp3`)。                                 |
| `voiceNoteOutputFormat` | ボイスノート出力形式 (デフォルト `ogg-24khz-16bit-mono-opus`)。                                       |
| `timeoutMs`             | ミリ秒単位のリクエストタイムアウト上書き。グローバルな `messages.tts.timeoutMs` にフォールバックします。 |

`apiKey` が設定され、さらに `region`、`endpoint`、または `baseUrl` のいずれかが設定されると、
このプロバイダーは設定済みと見なされます。環境変数は、未設定の設定キーに対するフォールバックとしてのみ確認されます。

## 注記

<AccordionGroup>
  <Accordion title="認証">
    Azure Speech は Azure OpenAI キーではなく、Speech リソースキーを使用します。キーは
    `Ocp-Apim-Subscription-Key` として送信されます。`endpoint` または `baseUrl` を
    指定しない限り、OpenClaw は `region` から
    `https://<region>.tts.speech.microsoft.com` を導出します。
  </Accordion>
  <Accordion title="音声名">
    Azure Speech 音声の `ShortName` 値を使用します。例:
    `en-US-JennyNeural`。バンドルされたプロバイダーは同じ Speech リソースを通じて
    音声を一覧表示でき、非推奨、廃止済み、または無効としてマークされた音声を除外します。
  </Accordion>
  <Accordion title="音声出力">
    Azure は `audio-24khz-48kbitrate-mono-mp3`、
    `ogg-24khz-16bit-mono-opus`、`riff-24khz-16bit-mono-pcm` などの出力形式を受け付けます。OpenClaw は
    `voice-note` ターゲット向けに Ogg/Opus をリクエストするため、チャネルは追加の MP3 変換なしで
    ネイティブのボイスバブルを送信できます。また、電話ターゲット向けには
    `raw-8khz-8bit-mono-mulaw` を強制します。
  </Accordion>
  <Accordion title="エイリアス">
    既存の設定向けに `azure` はプロバイダーエイリアスとして受け付けられますが、新しい設定では
    Azure OpenAI モデルプロバイダーとの混同を避けるために `azure-speech` を使用してください。
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
    バンドルされたすべての OpenClaw プロバイダー。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とデバッグ手順。
  </Card>
</CardGroup>
