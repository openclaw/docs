---
read_when:
    - テキスト読み上げに Gradium を使用したい場合
    - Gradium API キー、音声、またはディレクティブトークンの設定が必要です
summary: OpenClaw で Gradium テキスト読み上げを使用する
title: Gradium
x-i18n:
    generated_at: "2026-07-12T14:51:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) は、OpenClaw 向けのテキスト読み上げプロバイダーです。標準の音声応答（WAV）、ボイスメモ互換の Opus 出力、および電話通信向けサーフェス用の 8 kHz u-law 音声を生成します。

| プロパティ      | 値                                   |
| ------------- | ------------------------------------ |
| プロバイダー ID | `gradium`                            |
| 認証           | `GRADIUM_API_KEY` または設定の `apiKey` |
| ベース URL     | `https://api.gradium.ai`（デフォルト）   |
| デフォルト音声  | `Emma`（`YTpq7expH9539ERJ`）          |

## Plugin のインストール

Gradium は公式の外部 Plugin です。インストールしてから Gateway を再起動します。

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## セットアップ

Gradium API キーを作成し、環境変数または設定キーで指定します。設定は環境変数より優先されます。

<Tabs>
  <Tab title="環境変数">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="設定キー">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## 設定

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| キー                                            | 型      | 説明                                                                                                          |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | 解決済みの API キー。`${ENV}` とシークレット参照に対応します。                                                        |
| `messages.tts.providers.gradium.baseUrl`        | string | `api.gradium.ai` 上の HTTPS Gradium API URL。末尾のスラッシュは削除されます。デフォルトは `https://api.gradium.ai` です。 |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ディレクティブによる上書きがない場合に使用されるデフォルトの音声 ID。                                                   |

出力形式は対象サーフェスに応じて自動的に選択され（[出力](#output)を参照）、`openclaw.json` では設定できません。

## 音声

| 名前                  | 音声 ID             |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **（デフォルト）** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### メッセージごとの音声の上書き

有効な音声ポリシーで音声の上書きが許可されている場合、ディレクティブトークンを使用してインラインで音声を切り替えます（以下はいずれも同等で、すべてプロバイダー固有の音声 ID を受け取ります）。

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

音声ポリシーで音声の上書きが無効になっている場合、ディレクティブは処理されますが無視されます。

## 出力

出力形式は対象サーフェスに応じて選択されます。プロバイダーは他の形式を合成しません。

| 対象           | 形式         | ファイル拡張子 | サンプルレート | 音声互換フラグ |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| 標準音声        | `wav`       | `.wav`   | プロバイダー   | いいえ          |
| ボイスメモ      | `opus`      | `.opus`  | プロバイダー   | はい            |
| 電話通信        | `ulaw_8000` | 該当なし  | 8 kHz       | 該当なし         |

## 自動選択順序

設定済みの TTS プロバイダーのうち、Gradium の自動選択順序は `30` です。`messages.tts.provider` が固定されていない場合に OpenClaw が有効なプロバイダーを選択する方法については、[テキスト読み上げ](/ja-JP/tools/tts)を参照してください。

## 関連項目

- [テキスト読み上げ](/ja-JP/tools/tts)
- [メディアの概要](/ja-JP/tools/media-overview)
