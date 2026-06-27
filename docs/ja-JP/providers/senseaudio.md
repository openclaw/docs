---
read_when:
    - 音声添付ファイルに SenseAudio の音声テキスト変換を使用したい場合
    - SenseAudio APIキーの環境変数、または音声設定パスが必要です
summary: 受信音声メモ向け SenseAudio バッチ音声テキスト変換
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T09:08:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SenseAudio は OpenClaw の共有 `tools.media.audio` パイプラインを通じて、受信音声とボイスノート添付ファイルを文字起こしできます。OpenClaw はマルチパート音声を OpenAI 互換の文字起こしエンドポイントに投稿し、返されたテキストを `{{Transcript}}` と `[Audio]` ブロックとして注入します。

| プロパティ   | 値                                               |
| ------------- | ------------------------------------------------ |
| プロバイダー ID | `senseaudio`                                     |
| Plugin        | 同梱, `enabledByDefault: true`                   |
| コントラクト | `mediaUnderstandingProviders` (音声)             |
| 認証環境変数 | `SENSEAUDIO_API_KEY`                             |
| デフォルトモデル | `senseaudio-asr-pro-1.5-260319`                  |
| デフォルト URL | `https://api.senseaudio.cn/v1`                   |
| Webサイト    | [senseaudio.cn](https://senseaudio.cn)           |
| ドキュメント | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

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
    接続済みの任意のチャネルを通じて音声メッセージを送信します。OpenClaw は音声を
    SenseAudio にアップロードし、返信パイプラインで文字起こしを使用します。
  </Step>
</Steps>

## オプション

| オプション | パス                                  | 説明                                |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR モデル ID            |
| `language` | `tools.media.audio.models[].language` | 任意の言語ヒント                    |
| `prompt`   | `tools.media.audio.prompt`            | 任意の文字起こしプロンプト          |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | OpenAI 互換のベースを上書きする     |
| `headers`  | `tools.media.audio.request.headers`   | 追加リクエストヘッダー              |

<Note>
OpenClaw では SenseAudio はバッチ STT のみです。Voice Call のリアルタイム文字起こしは
ストリーミング STT 対応のプロバイダーを引き続き使用します。
</Note>

## 関連

- [メディア理解 (音声)](/ja-JP/nodes/audio)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
