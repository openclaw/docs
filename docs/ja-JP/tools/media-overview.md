---
read_when:
    - メディア機能の概要を探しています
    - 設定するメディアプロバイダーを決める
    - 非同期メディア生成の仕組みを理解する
summary: メディア生成、理解、音声機能の統合ランディングページ
title: メディアの概要
x-i18n:
    generated_at: "2026-04-24T05:25:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469fb173ac3853011b8cd4f89f3ab97dd7d14e12e4e1d7d87e84de05d025a593
    source_path: tools/media-overview.md
    workflow: 15
---

# メディア生成と理解

OpenClawは画像、動画、音楽を生成し、受信したメディア（画像、音声、動画）を理解し、テキスト読み上げで返答を音声化できます。すべてのメディア機能はツール駆動です。エージェントは会話に基づいてそれらを使うタイミングを判断し、各ツールは少なくとも1つの対応プロバイダーが設定されている場合にのみ表示されます。

## 機能一覧

| 機能                 | ツール           | プロバイダー                                                                                 | 動作内容                                                |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 画像生成             | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | テキストプロンプトまたは参照から画像を作成または編集します |
| 動画生成             | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | テキスト、画像、または既存の動画から動画を作成します    |
| 音楽生成             | `music_generate` | ComfyUI, Google, MiniMax                                                                     | テキストプロンプトから音楽または音声トラックを作成します |
| テキスト読み上げ（TTS） | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | 送信する返答を音声に変換します                          |
| メディア理解         | （自動）         | 任意の視覚対応または音声対応のモデルプロバイダーに加え、CLIフォールバック                     | 受信した画像、音声、動画を要約します                    |

## プロバイダー機能マトリクス

この表は、プラットフォーム全体で各プロバイダーがどのメディア機能をサポートしているかを示しています。

| Provider   | 画像 | 動画 | 音楽 | TTS | STT / 文字起こし | メディア理解 |
| ---------- | ---- | ---- | ---- | --- | ---------------- | ------------ |
| Alibaba    |      | Yes  |      |     |                  |              |
| BytePlus   |      | Yes  |      |     |                  |              |
| ComfyUI    | Yes  | Yes  | Yes  |     |                  |              |
| Deepgram   |      |      |      |     | Yes              |              |
| ElevenLabs |      |      |      | Yes | Yes              |              |
| fal        | Yes  | Yes  |      |     |                  |              |
| Google     | Yes  | Yes  | Yes  |     |                  | Yes          |
| Microsoft  |      |      |      | Yes |                  |              |
| MiniMax    | Yes  | Yes  | Yes  | Yes |                  |              |
| Mistral    |      |      |      |     | Yes              |              |
| OpenAI     | Yes  | Yes  |      | Yes | Yes              | Yes          |
| Qwen       |      | Yes  |      |     |                  |              |
| Runway     |      | Yes  |      |     |                  |              |
| Together   |      | Yes  |      |     |                  |              |
| Vydra      | Yes  | Yes  |      |     |                  |              |
| xAI        | Yes  | Yes  |      | Yes | Yes              | Yes          |

<Note>
メディア理解では、プロバイダー設定に登録されている任意の視覚対応または音声対応モデルを使用します。上の表では専用のメディア理解サポートがあるプロバイダーを示していますが、マルチモーダルモデルを持つほとんどのLLMプロバイダー（Anthropic、Google、OpenAIなど）も、アクティブな返答モデルとして設定されていれば受信メディアを理解できます。
</Note>

## 非同期生成の仕組み

動画生成と音楽生成は、プロバイダー側の処理に通常30秒から数分かかるため、バックグラウンドタスクとして実行されます。エージェントが`video_generate`または`music_generate`を呼び出すと、OpenClawはリクエストをプロバイダーに送信し、すぐにタスクIDを返し、そのジョブをタスク台帳で追跡します。ジョブの実行中も、エージェントは他のメッセージへの応答を続けます。プロバイダーで処理が完了すると、OpenClawはエージェントを再開し、完成したメディアを元のチャネルに投稿できるようにします。画像生成とTTSは同期処理で、返答中にその場で完了します。

Deepgram、ElevenLabs、Mistral、OpenAI、xAIは、設定されている場合、バッチ`tools.media.audio`パスを通じて受信音声を文字起こしできます。Deepgram、ElevenLabs、Mistral、OpenAI、xAIは、Voice CallストリーミングSTTプロバイダーも登録するため、ライブの電話音声を、録音完了を待たずに選択したベンダーへ転送できます。

OpenAIは、OpenClawの画像、動画、バッチTTS、バッチSTT、Voice CallストリーミングSTT、リアルタイム音声、メモリ埋め込みの各サーフェスに対応します。xAIは現在、OpenClawの画像、動画、検索、コード実行、バッチTTS、バッチSTT、Voice CallストリーミングSTTの各サーフェスに対応しています。xAI Realtime voiceは上流の機能ですが、共有のリアルタイム音声コントラクトで表現できるようになるまでは、OpenClawには登録されません。

## クイックリンク

- [画像生成](/ja-JP/tools/image-generation) -- 画像の生成と編集
- [動画生成](/ja-JP/tools/video-generation) -- テキストから動画、画像から動画、動画から動画
- [音楽生成](/ja-JP/tools/music-generation) -- 音楽と音声トラックの作成
- [テキスト読み上げ](/ja-JP/tools/tts) -- 返答を音声に変換
- [メディア理解](/ja-JP/nodes/media-understanding) -- 受信した画像、音声、動画の理解

## 関連

- [画像生成](/ja-JP/tools/image-generation)
- [動画生成](/ja-JP/tools/video-generation)
- [音楽生成](/ja-JP/tools/music-generation)
- [テキスト読み上げ](/ja-JP/tools/tts)
