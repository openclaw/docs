---
read_when:
    - 音声添付ファイルに SenseAudio の音声テキスト変換を使用したい
    - SenseAudio API キーの環境変数または音声設定パスが必要です
summary: 受信した音声メモ向けの SenseAudio バッチ音声テキスト変換
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T05:17:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 775d27439d8f1598c6639df936f8a80f105ced9b915e98f7ff73d9049ac1b6a2
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio は、OpenClaw の共有 `tools.media.audio` パイプラインを通じて、受信した音声およびボイスノート添付ファイルを文字起こしできます。OpenClaw はマルチパート音声を OpenAI 互換の文字起こしエンドポイントに送信し、返されたテキストを `{{Transcript}}` と `[Audio]` ブロックとして挿入します。

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
  <Step title="ボイスノートを送信する">
    接続済みの任意のチャンネルから音声メッセージを送信します。OpenClaw は
    音声を SenseAudio にアップロードし、返信パイプラインで文字起こしを使用します。
  </Step>
</Steps>

## オプション

| オプション     | パス                                  | 説明                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR モデル ID             |
| `language` | `tools.media.audio.models[].language` | 省略可能な言語ヒント              |
| `prompt`   | `tools.media.audio.prompt`            | 省略可能な文字起こしプロンプト       |
| `baseUrl`  | `tools.media.audio.baseUrl` またはモデル  | OpenAI 互換ベースを上書き |
| `headers`  | `tools.media.audio.request.headers`   | 追加のリクエストヘッダー               |

<Note>
SenseAudio は OpenClaw ではバッチ STT のみに対応しています。音声通話のリアルタイム文字起こしは、
ストリーミング STT 対応のプロバイダーを引き続き使用します。
</Note>
