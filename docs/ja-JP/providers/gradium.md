---
read_when:
    - テキスト読み上げには Gradium が必要です
    - Gradium APIキー、音声、またはディレクティブトークンの設定が必要です
summary: OpenClaw で Gradium テキスト読み上げを使用する
title: Gradium
x-i18n:
    generated_at: "2026-06-27T12:43:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) は OpenClaw のテキスト読み上げプロバイダーです。この Plugin は通常の音声返信（WAV）、音声メモ互換の Opus 出力、電話サーフェス向けの 8 kHz u-law 音声をレンダリングできます。

| プロパティ      | 値                                |
| ------------- | ------------------------------------ |
| プロバイダー id   | `gradium`                            |
| 認証          | `GRADIUM_API_KEY` または設定 `apiKey` |
| ベース URL      | `https://api.gradium.ai`（デフォルト）   |
| デフォルト音声 | `Emma`（`YTpq7expH9539ERJ`）          |

## Plugin をインストールする

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## セットアップ

Gradium API キーを作成し、環境変数または設定キーのいずれかで OpenClaw に公開します。

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

Plugin はまず解決済みの `apiKey` を確認し、見つからない場合は `GRADIUM_API_KEY` 環境変数にフォールバックします。

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

| キー                                             | 型   | 説明                                                                                   |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | 解決済み API キー。`${ENV}` とシークレット参照をサポートします。                                          |
| `messages.tts.providers.gradium.baseUrl`        | string | API オリジンを上書きします。末尾のスラッシュは削除されます。デフォルトは `https://api.gradium.ai` です。 |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ディレクティブによる上書きがない場合に使われるデフォルト音声 id。                                  |

出力音声形式は、対象サーフェスに基づいてランタイムが自動的に選択し、`openclaw.json` からは設定できません。下の [出力](#output) を参照してください。

## 音声

| 名前      | 音声 ID           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

デフォルト音声: Emma。

### メッセージ単位の音声上書き

有効な音声ポリシーが音声の上書きを許可している場合、ディレクティブトークンを使ってインラインで音声を切り替えられます。プロバイダー固有の音声 id には `speakerVoiceId` を使います。

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

音声ポリシーで音声の上書きが無効になっている場合、ディレクティブは消費されますが無視されます。

## 出力

ランタイムは対象サーフェスから出力形式を選択します。現在、このプロバイダーは他の形式を合成しません。

| 対象         | 形式      | ファイル拡張子 | サンプルレート | 音声互換フラグ |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| 標準音声 | `wav`       | `.wav`   | プロバイダー    | いいえ                    |
| 音声メモ     | `opus`      | `.opus`  | プロバイダー    | はい                   |
| 電話      | `ulaw_8000` | 該当なし      | 8 kHz       | 該当なし                   |

## 自動選択順

設定済み TTS プロバイダーの中で、Gradium の自動選択順は `30` です。`messages.tts.provider` が固定されていない場合に OpenClaw が有効なプロバイダーを選ぶ方法については、[テキスト読み上げ](/ja-JP/tools/tts) を参照してください。

## 関連

- [テキスト読み上げ](/ja-JP/tools/tts)
- [メディア概要](/ja-JP/tools/media-overview)
