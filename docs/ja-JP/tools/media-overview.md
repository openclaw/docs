---
read_when:
    - OpenClaw のメディア機能の概要を探す
    - 構成するメディアプロバイダーの選択
    - 非同期メディア生成の仕組みを理解する
sidebarTitle: Media overview
summary: 画像、動画、音楽、音声、メディア理解機能の概要
title: メディアの概要
x-i18n:
    generated_at: "2026-06-27T13:14:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw は画像、動画、音楽を生成し、受信メディア
（画像、音声、動画）を理解し、テキスト読み上げで返信を音声として読み上げます。すべての
メディア機能はツール駆動です。エージェントは会話に基づいていつ使うかを判断し、
各ツールは少なくとも 1 つのバックエンドプロバイダーが設定されている場合にのみ表示されます。

ライブ音声は、ワンショットのメディアツール
パスではなく Talk セッション契約を使います。Talk には 3 つのモードがあります。プロバイダーネイティブの `realtime`、ローカルまたはストリーミングの
`stt-tts`、観測専用の音声キャプチャ用 `transcription` です。これらのモードは、
テレフォニー、ミーティング、ブラウザーリアルタイム、ネイティブのプッシュトゥトーククライアントと、
プロバイダーカタログ、イベントエンベロープ、キャンセルセマンティクスを共有します。

## 機能

<CardGroup cols={2}>
  <Card title="Image generation" href="/ja-JP/tools/image-generation" icon="image">
    テキストプロンプトまたは参照画像から、
    `image_generate` 経由で画像を作成および編集します。チャットセッションでは非同期です — バックグラウンドで実行され、
    準備ができると結果を投稿します。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    `video_generate` 経由で、テキストから動画、画像から動画、動画から動画を生成します。
    非同期です — バックグラウンドで実行され、準備ができると結果を投稿します。
  </Card>
  <Card title="Music generation" href="/ja-JP/tools/music-generation" icon="music">
    `music_generate` 経由で音楽または音声トラックを生成します。チャット
    セッションでは、共有のメディア生成タスクライフサイクル上で非同期に実行されます。
  </Card>
  <Card title="Text-to-speech" href="/ja-JP/tools/tts" icon="microphone">
    `tts` ツールと
    `messages.tts` 設定を使って、送信返信を音声に変換します。同期です。
  </Card>
  <Card title="Media understanding" href="/ja-JP/nodes/media-understanding" icon="eye">
    Vision 対応モデル
    プロバイダーと専用のメディア理解 Plugin を使って、受信画像、音声、動画を要約します。
  </Card>
  <Card title="Speech-to-text" href="/ja-JP/nodes/audio" icon="ear-listen">
    バッチ STT または Voice Call
    ストリーミング STT プロバイダーを通じて、受信音声メッセージを文字起こしします。
  </Card>
</CardGroup>

## プロバイダー機能マトリクス

| プロバイダー          | 画像 | 動画 | 音楽 | TTS | STT | リアルタイム音声 | メディア理解 |
| ----------------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba           |       |   ✓   |       |     |     |                |                     |
| BytePlus          |       |   ✓   |       |     |     |                |                     |
| ComfyUI           |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| DeepInfra         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Deepgram          |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs        |       |       |       |  ✓  |  ✓  |                |                     |
| fal               |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Google            |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium           |       |       |       |  ✓  |     |                |                     |
| Local CLI         |       |       |       |  ✓  |     |                |                     |
| Microsoft         |       |       |       |  ✓  |     |                |                     |
| Microsoft Foundry |   ✓   |       |       |     |     |                |                     |
| MiniMax           |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral           |       |       |       |     |  ✓  |                |                     |
| OpenAI            |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter        |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |                |          ✓          |
| Qwen              |       |   ✓   |       |     |     |                |                     |
| Runway            |       |   ✓   |       |     |     |                |                     |
| SenseAudio        |       |       |       |     |  ✓  |                |                     |
| Together          |       |   ✓   |       |     |     |                |                     |
| Vydra             |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI               |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo       |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
メディア理解は、プロバイダー設定に登録された任意の Vision 対応または音声対応モデルを使います。上のマトリクスは、専用の
メディア理解サポートを持つプロバイダーを示しています。ほとんどのマルチモーダル LLM プロバイダー（Anthropic、Google、
OpenAI など）も、アクティブな
返信モデルとして設定されている場合、受信メディアを理解できます。
</Note>

## 非同期と同期

| 機能     | モード         | 理由                                                                                                  |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 画像          | 非同期 | プロバイダー処理はチャットターンより長く続く場合があります。生成された添付ファイルは共有の完了パスを使います。   |
| テキスト読み上げ | 同期  | プロバイダーの応答は数秒で返ります。返信音声に添付されます。                                   |
| 動画          | 非同期 | プロバイダー処理には 30 秒から数分かかります。遅いキューは設定済みのタイムアウトまで実行される場合があります。 |
| 音楽          | 非同期 | 動画と同じプロバイダー処理特性です。                                                    |

非同期ツールでは、OpenClaw はリクエストをプロバイダーへ送信し、タスク
ID を即座に返し、タスク台帳でジョブを追跡します。ジョブの実行中も、エージェントは他のメッセージへの応答を続けます。プロバイダーが完了すると、
OpenClaw は生成されたメディアパスとともにエージェントを起動し、
セッションの通常の可視返信モードを通じてユーザーに伝えられるようにします。設定されている場合は最終返信の自動配信、
セッションがメッセージツールを必要とする場合は `message(action="send")` です。要求元セッションが非アクティブであるか、そのアクティブな起動に失敗し、
生成されたメディアの一部が完了返信にまだ含まれていない場合、
OpenClaw は不足しているメディアのみを含む冪等な直接フォールバックを送信します。完了返信ですでに配信済みのメディアは再投稿されません。

## 音声認識と Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、OpenRouter、SenseAudio、xAI は、設定されている場合、
いずれもバッチ `tools.media.audio` パスを通じて受信音声を文字起こしできます。
メンションゲーティングやコマンド
解析のためにボイスメモを事前確認するチャンネル Plugin は、受信コンテキスト上で文字起こし済み添付ファイルをマークするため、共有の
メディア理解パスは同じ音声に対して 2 回目の
STT 呼び出しを行わず、そのトランスクリプトを再利用します。

Deepgram、ElevenLabs、Mistral、OpenAI、xAI は Voice Call
ストリーミング STT プロバイダーも登録するため、録音の完了を待たずにライブ電話音声を選択された
ベンダーへ転送できます。

ライブのユーザー会話では、[Talk モード](/ja-JP/nodes/talk)を優先してください。バッチ音声
添付ファイルはメディアパス上に残ります。ブラウザーリアルタイム、ネイティブのプッシュトゥトーク、
テレフォニー、ミーティング音声では、Talk イベントと、Gateway から返されるセッションスコープの
カタログを使う必要があります。

## プロバイダーマッピング（ベンダーが各サーフェスにどう分かれるか）

<AccordionGroup>
  <Accordion title="Google">
    画像、動画、音楽、バッチ TTS、バックエンドのリアルタイム音声、
    メディア理解サーフェス。
  </Accordion>
  <Accordion title="OpenAI">
    画像、動画、バッチ TTS、バッチ STT、Voice Call ストリーミング STT、バックエンドの
    リアルタイム音声、メモリ埋め込みサーフェス。
  </Accordion>
  <Accordion title="DeepInfra">
    チャット/モデルルーティング、画像生成/編集、テキストから動画、バッチ TTS、
    バッチ STT、画像メディア理解、メモリ埋め込みサーフェス。
    DeepInfra ネイティブのリランキング/分類/物体検出モデルは、OpenClaw がそれらの
    カテゴリ専用のプロバイダー契約を持つまで登録されません。
  </Accordion>
  <Accordion title="xAI">
    画像、動画、検索、コード実行、バッチ TTS、バッチ STT、Voice
    Call ストリーミング STT。xAI Realtime 音声は上流の機能ですが、
    共有リアルタイム音声契約がそれを表現できるようになるまで、
    OpenClaw には登録されません。
  </Accordion>
</AccordionGroup>

## 関連

- [画像生成](/ja-JP/tools/image-generation)
- [動画生成](/ja-JP/tools/video-generation)
- [音楽生成](/ja-JP/tools/music-generation)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [音声ノード](/ja-JP/nodes/audio)
- [Talk モード](/ja-JP/nodes/talk)
