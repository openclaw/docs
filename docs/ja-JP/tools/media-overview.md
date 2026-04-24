---
read_when:
    - メディア機能の概要をお探しですか
    - 設定するメディアプロバイダーを決める】【。final
    - 非同期メディア生成の仕組みを理解する
summary: メディア生成、理解、音声機能のための統合ランディングページ
title: メディア概要
x-i18n:
    generated_at: "2026-04-24T09:51:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39848c6104ebd4feeb37b233b70f3312fa076b535c3b3780336729eb9fdfa4e6
    source_path: tools/media-overview.md
    workflow: 15
---

# メディア生成と理解

OpenClawは画像、動画、音楽を生成し、受信したメディア（画像、音声、動画）を理解し、text-to-speechで返信を音声として読み上げます。すべてのメディア機能はツール駆動です。エージェントは会話に応じてそれらを使うタイミングを判断し、各ツールは対応するプロバイダーが少なくとも1つ設定されている場合にのみ表示されます。

## 機能一覧

| 機能                 | ツール           | プロバイダー                                                                                  | できること                                              |
| -------------------- | ---------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 画像生成             | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                             | テキストプロンプトや参照画像から画像を作成または編集します |
| 動画生成             | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | テキスト、画像、既存の動画から動画を作成します          |
| 音楽生成             | `music_generate` | ComfyUI, Google, MiniMax                                                                      | テキストプロンプトから音楽や音声トラックを作成します    |
| Text-to-speech (TTS) | `tts`            | ElevenLabs, Google, Microsoft, MiniMax, OpenAI, xAI                                           | 送信する返信を音声に変換します                          |
| メディア理解         | （自動）         | 任意の視覚対応または音声対応モデルプロバイダーに加え、CLIフォールバック                        | 受信した画像、音声、動画を要約します                    |

## プロバイダー機能マトリクス

この表は、各プロバイダーがプラットフォーム全体でどのメディア機能に対応しているかを示しています。

| Provider   | Image | Video | Music | TTS | STT / Transcription | Realtime Voice | Media Understanding |
| ---------- | ----- | ----- | ----- | --- | ------------------- | -------------- | ------------------- |
| Alibaba    |       | Yes   |       |     |                     |                |                     |
| BytePlus   |       | Yes   |       |     |                     |                |                     |
| ComfyUI    | Yes   | Yes   | Yes   |     |                     |                |                     |
| Deepgram   |       |       |       |     | Yes                 |                |                     |
| ElevenLabs |       |       |       | Yes | Yes                 |                |                     |
| fal        | Yes   | Yes   |       |     |                     |                |                     |
| Google     | Yes   | Yes   | Yes   | Yes |                     | Yes            | Yes                 |
| Microsoft  |       |       |       | Yes |                     |                |                     |
| MiniMax    | Yes   | Yes   | Yes   | Yes |                     |                |                     |
| Mistral    |       |       |       |     | Yes                 |                |                     |
| OpenAI     | Yes   | Yes   |       | Yes | Yes                 | Yes            | Yes                 |
| Qwen       |       | Yes   |       |     |                     |                |                     |
| Runway     |       | Yes   |       |     |                     |                |                     |
| Together   |       | Yes   |       |     |                     |                |                     |
| Vydra      | Yes   | Yes   |       |     |                     |                |                     |
| xAI        | Yes   | Yes   |       | Yes | Yes                 |                | Yes                 |

<Note>
メディア理解では、プロバイダー設定に登録されている任意の視覚対応モデルまたは音声対応モデルを使用します。上の表では、専用のメディア理解サポートがあるプロバイダーを示しています。マルチモーダルモデルを備えたほとんどのLLMプロバイダー（Anthropic、Google、OpenAIなど）も、アクティブな返信モデルとして設定されていれば受信メディアを理解できます。
</Note>

## 非同期生成の仕組み

動画生成と音楽生成はバックグラウンドタスクとして実行されます。これは、プロバイダー側の処理に通常30秒から数分かかるためです。エージェントが`video_generate`または`music_generate`を呼び出すと、OpenClawはリクエストをプロバイダーに送信し、すぐにタスクIDを返して、task ledgerでジョブを追跡します。ジョブの実行中も、エージェントはほかのメッセージへの応答を続けます。プロバイダーが完了すると、OpenClawはエージェントを再開し、完成したメディアを元のチャネルに投稿できるようにします。画像生成とTTSは同期的で、返信内でそのまま完了します。

Deepgram、ElevenLabs、Mistral、OpenAI、xAIは、設定されている場合、いずれもバッチ`tools.media.audio`パスを通じて受信音声を文字起こしできます。Deepgram、ElevenLabs、Mistral、OpenAI、xAIは、Voice CallストリーミングSTTプロバイダーも登録するため、ライブの通話音声を、録音の完了を待たずに選択したベンダーへ転送できます。

Googleは、OpenClawの画像、動画、音楽、バッチTTS、バックエンドRealtime Voice、メディア理解の各サーフェスに対応します。OpenAIは、OpenClawの画像、動画、バッチTTS、バッチSTT、Voice CallストリーミングSTT、バックエンドRealtime Voice、メモリ埋め込みの各サーフェスに対応します。xAIは現在、OpenClawの画像、動画、検索、コード実行、バッチTTS、バッチSTT、Voice CallストリーミングSTTの各サーフェスに対応しています。xAI Realtime voiceは上流の機能ですが、共有Realtime Voice契約でそれを表現できるようになるまでは、OpenClawには登録されません。

## クイックリンク

- [画像生成](/ja-JP/tools/image-generation) -- 画像の生成と編集
- [動画生成](/ja-JP/tools/video-generation) -- テキストから動画、画像から動画、動画から動画
- [音楽生成](/ja-JP/tools/music-generation) -- 音楽と音声トラックの作成
- [Text-to-Speech](/ja-JP/tools/tts) -- 返信を音声に変換
- [メディア理解](/ja-JP/nodes/media-understanding) -- 受信した画像、音声、動画の理解

## 関連

- [画像生成](/ja-JP/tools/image-generation)
- [動画生成](/ja-JP/tools/video-generation)
- [音楽生成](/ja-JP/tools/music-generation)
- [Text-to-speech](/ja-JP/tools/tts)
