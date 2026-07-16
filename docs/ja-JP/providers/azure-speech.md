---
read_when:
    - 送信する返信に Azure Speech の音声合成を使用したい場合
    - Azure Speech からネイティブの Ogg Opus ボイスメモ出力が必要です
summary: OpenClawの返信向けAzure AI Speechテキスト読み上げ変換
title: Azure Speech
x-i18n:
    generated_at: "2026-07-16T12:05:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech は、バンドルされた Azure AI Speech のテキスト読み上げプロバイダーです。OpenClaw は
SSML を使用して Azure Speech REST API を直接呼び出し、標準の返信には MP3、
ボイスメモにはネイティブ Ogg/Opus、Voice Call などのテレフォニーチャネルには
8 kHz mulaw を合成します。リクエストは、プロバイダーが管理する出力形式を
`X-Microsoft-OutputFormat` ヘッダーで送信します。

| 詳細                    | 値                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| プロバイダー ID         | `azure-speech`（エイリアス: `azure`）                                                          |
| ウェブサイト            | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| ドキュメント            | [Speech REST テキスト読み上げ](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| 認証                    | `AZURE_SPEECH_KEY` と `AZURE_SPEECH_REGION`                                                                      |
| デフォルト音声          | `en-US-JennyNeural`                                                                                            |
| デフォルトのファイル出力 | `audio-24khz-48kbitrate-mono-mp3`                                                                                            |
| デフォルトのボイスメモファイル | `ogg-24khz-16bit-mono-opus`                                                                                    |

## はじめに

<Steps>
  <Step title="Azure Speech リソースを作成する">
    Azure ポータルで Speech リソースを作成します。Resource Management > Keys and Endpoint から
    **KEY 1** をコピーし、`eastus` などのリソースの場所をコピーします。

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
    標準オーディオには MP3、チャネルがボイスメモを必要とする場合は Ogg/Opus を配信します。
  </Step>
</Steps>

## 設定オプション

すべてのオプションは `messages.tts.providers["azure-speech"]` の下にあります。

| オプション              | 説明                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`      | Azure Speech リソースキー。`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY`、または `SPEECH_KEY` にフォールバックします。 |
| `region`      | Azure Speech リソースのリージョン。`AZURE_SPEECH_REGION` または `SPEECH_REGION` にフォールバックします。 |
| `endpoint`      | 任意の Azure Speech エンドポイントオーバーライド。信頼済みの `AZURE_SPEECH_ENDPOINT` にフォールバックします。 |
| `baseUrl`      | 任意の Azure Speech ベース URL オーバーライド。                                                        |
| `voice`      | Azure 音声の ShortName（デフォルトは `en-US-JennyNeural`）。レガシーエイリアス: `voiceId`。 |
| `lang`      | SSML 言語コード（デフォルトは `en-US`）。                                                  |
| `outputFormat`      | オーディオファイルの出力形式（デフォルトは `audio-24khz-48kbitrate-mono-mp3`）。                                     |
| `voiceNoteOutputFormat`      | ボイスメモの出力形式（デフォルトは `ogg-24khz-16bit-mono-opus`）。                                             |
| `timeoutMs`      | リクエストタイムアウトのオーバーライド（ミリ秒）。グローバルの `messages.tts.timeoutMs` にフォールバックします。 |

`apiKey` に加えて、`region`、`endpoint`、
または `baseUrl` のいずれかが設定されると、プロバイダーは設定済みとみなされます。
環境変数は、未設定のままの設定キーに対するフォールバックとしてのみ確認されます。
ワークスペースの `.env` ファイルでは `AZURE_SPEECH_ENDPOINT` を設定できません。
エンドポイントのルーティングには、プロセス環境、グローバルランタイムの dotenv、
または明示的な設定を使用してください。

## 注記

<AccordionGroup>
  <Accordion title="認証">
    Azure Speech は Azure OpenAI キーではなく、Speech リソースキーを使用します。
    キーは `Ocp-Apim-Subscription-Key` として送信されます。`endpoint` または
    `baseUrl` を指定しない限り、OpenClaw は `region` から
    `https://<region>.tts.speech.microsoft.com` を導出します。
  </Accordion>
  <Accordion title="音声名">
    Azure Speech 音声の `ShortName` 値を使用します。たとえば
    `en-US-JennyNeural` です。バンドルされたプロバイダーは、同じ Speech リソースを通じて
    音声を一覧表示でき、非推奨、廃止済み、または無効と記された音声を除外します。
  </Accordion>
  <Accordion title="オーディオ出力">
    Azure は `audio-24khz-48kbitrate-mono-mp3`、`ogg-24khz-16bit-mono-opus`、
    `riff-24khz-16bit-mono-pcm` などの出力形式を受け入れます。OpenClaw は
    `voice-note` ターゲットに Ogg/Opus をリクエストするため、チャネルは
    MP3 への追加変換なしでネイティブの音声バブルを送信できます。また、
    テレフォニーターゲットには `raw-8khz-8bit-mono-mulaw` を強制します。
  </Accordion>
  <Accordion title="エイリアス">
    `azure` は既存の設定に対するプロバイダーエイリアスとして使用できますが、
    Azure OpenAI モデルプロバイダーとの混同を避けるため、新しい設定では
    `azure-speech` を使用してください。
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
    バンドルされたすべての OpenClaw プロバイダー。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とデバッグ手順。
  </Card>
</CardGroup>
