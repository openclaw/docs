---
read_when:
    - 音声添付ファイルに SenseAudio の音声文字変換を使いたい
    - SenseAudio API キーの環境変数または音声設定パスが必要です
summary: 受信音声メモ向け SenseAudio バッチ音声テキスト変換
title: SenseAudio
x-i18n:
    generated_at: "2026-07-05T11:41:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio は、OpenClaw の共有 `tools.media.audio` パイプラインを通じて、受信した音声とボイスメモの添付ファイルを文字起こしします。OpenClaw はマルチパート音声を OpenAI 互換の文字起こしエンドポイントに投稿し、返されたテキストを `{{Transcript}}` と `[Audio]` ブロックとして挿入します。

| プロパティ      | 値                                            |
| ------------- | ------------------------------------------------ |
| プロバイダー ID   | `senseaudio`                                     |
| Plugin        | バンドル済み、`enabledByDefault: true`                |
| コントラクト      | `mediaUnderstandingProviders` (音声)            |
| 認証環境変数  | `SENSEAUDIO_API_KEY`                             |
| デフォルトモデル | `senseaudio-asr-pro-1.5-260319`                  |
| デフォルト URL   | `https://api.senseaudio.cn/v1`                   |
| Web サイト       | [senseaudio.cn](https://senseaudio.cn)           |
| ドキュメント          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="音声プロバイダーを有効にする">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ボイスメモを送信する">
    接続済みの任意のチャネルを通じて音声メッセージを送信します。OpenClaw は音声を
    SenseAudio にアップロードし、返信パイプラインで文字起こしを使用します。
  </Step>
</Steps>

## オプション

| オプション     | パス                                  | 説明                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR モデル ID             |
| `language` | `tools.media.audio.models[].language` | 任意の言語ヒント              |
| `prompt`   | `tools.media.audio.prompt`            | 任意の文字起こしプロンプト       |
| `baseUrl`  | `tools.media.audio.baseUrl` またはモデル  | OpenAI 互換ベースを上書きする |
| `headers`  | `tools.media.audio.request.headers`   | 追加のリクエストヘッダー               |

<Note>
SenseAudio は OpenClaw ではバッチ STT のみに対応しています。Voice Call のリアルタイム文字起こしは、
引き続きストリーミング STT 対応プロバイダーを使用します。
</Note>

## 関連

- [メディア理解 (音声)](/ja-JP/nodes/audio)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
