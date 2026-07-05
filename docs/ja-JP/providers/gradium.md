---
read_when:
    - テキスト読み上げには Gradium が必要です
    - Gradium API キー、音声、またはディレクティブトークン設定が必要です
summary: OpenClaw で Gradium のテキスト読み上げを使用する
title: Gradium
x-i18n:
    generated_at: "2026-07-05T11:40:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eee8cbdeeb1cbc24bca20036c475a656e7aeab222699ae05931f07d2a635bbc6
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) は OpenClaw のテキスト読み上げプロバイダーです。標準の音声応答（WAV）、音声メモ互換の Opus 出力、電話サーフェス向けの 8 kHz u-law 音声をレンダリングします。

| プロパティ      | 値                                |
| ------------- | ------------------------------------ |
| プロバイダー ID   | `gradium`                            |
| 認証          | `GRADIUM_API_KEY` または config `apiKey` |
| ベース URL      | `https://api.gradium.ai`（デフォルト）   |
| デフォルト音声 | `Emma` (`YTpq7expH9539ERJ`)          |

## Plugin をインストール

Gradium は公式の外部 Plugin です。インストールしてから Gateway を再起動します。

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## セットアップ

Gradium API キーを作成し、環境変数または config キーで公開します。config は環境変数より優先されます。

<Tabs>
  <Tab title="環境変数">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config キー">
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

## Config

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

| キー                                             | 型   | 説明                                                                       |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | 解決済みの API キー。`${ENV}` と secret refs をサポートします。                              |
| `messages.tts.providers.gradium.baseUrl`        | string | API オリジンの上書き。末尾のスラッシュは削除されます。デフォルトは `https://api.gradium.ai`。 |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ディレクティブによる上書きがない場合に使われるデフォルト音声 ID。                      |

出力形式はターゲットサーフェスによって自動的に選択され（[出力](#output) を参照）、`openclaw.json` では設定できません。

## 音声

| 名前               | 音声 ID           |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **（デフォルト）** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### メッセージごとの音声上書き

有効な音声ポリシーが音声の上書きを許可している場合、ディレクティブトークンでインラインに音声を切り替えます（以下はいずれも同等で、すべてプロバイダー固有の音声 ID を受け取ります）。

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

音声ポリシーが音声の上書きを無効にしている場合、ディレクティブは消費されますが無視されます。

## 出力

出力形式はターゲットサーフェスによって選択されます。このプロバイダーは他の形式を合成しません。

| ターゲット         | 形式      | ファイル拡張子 | サンプルレート | 音声互換フラグ |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| 標準音声 | `wav`       | `.wav`   | プロバイダー    | なし                    |
| 音声メモ     | `opus`      | `.opus`  | プロバイダー    | あり                   |
| 電話      | `ulaw_8000` | n/a      | 8 kHz       | n/a                   |

## 自動選択順

設定済みの TTS プロバイダーの中で、Gradium の自動選択順は `30` です。`messages.tts.provider` が固定されていない場合に OpenClaw が有効なプロバイダーを選択する方法については、[テキスト読み上げ](/ja-JP/tools/tts) を参照してください。

## 関連

- [テキスト読み上げ](/ja-JP/tools/tts)
- [メディア概要](/ja-JP/tools/media-overview)
