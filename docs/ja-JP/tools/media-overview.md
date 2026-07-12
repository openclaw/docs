---
read_when:
    - OpenClaw のメディア機能の概要を確認する
    - 設定するメディアプロバイダーの選択
    - 非同期メディア生成の仕組みを理解する
sidebarTitle: Media overview
summary: 画像、動画、音楽、音声、メディア理解機能の概要
title: メディアの概要
x-i18n:
    generated_at: "2026-07-11T22:46:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw は画像、動画、音楽を生成し、受信メディア
（画像、音声、動画）を理解し、テキスト読み上げによって返信を音声で読み上げます。すべての
メディア機能はツール駆動です。会話に基づいてエージェントが使用時期を判断し、
各ツールは対応するプロバイダーが少なくとも1つ設定されている場合にのみ表示されます。

ライブ音声では、単発のメディアツール経路ではなく Talk セッション契約を使用します。
Talk には、プロバイダーネイティブの `realtime`、ローカルまたはストリーミングの
`stt-tts`、観察専用の音声キャプチャ用 `transcription` という3つのモードがあります。これらのモードは、
プロバイダーカタログ、イベントエンベロープ、キャンセルのセマンティクスを、
電話、会議、ブラウザーのリアルタイム機能、ネイティブのプッシュトゥトーククライアントと共有します。

## 機能

<CardGroup cols={2}>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    `image_generate` を使用して、テキストプロンプトまたは参照画像から画像を作成、編集します。
    チャットセッションでは非同期です。バックグラウンドで実行され、
    準備が整うと結果を投稿します。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    `video_generate` によるテキストから動画、画像から動画、動画から動画への生成。
    非同期でバックグラウンド実行され、準備が整うと結果を投稿します。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    `music_generate` を使用して音楽または音声トラックを生成します。チャット
    セッションでは、共有メディア生成タスクのライフサイクル上で非同期に動作します。
  </Card>
  <Card title="テキスト読み上げ" href="/ja-JP/tools/tts" icon="microphone">
    `tts` ツールと `messages.tts` 設定を使用して、
    送信する返信を音声に変換します。同期処理です。
  </Card>
  <Card title="メディア理解" href="/ja-JP/nodes/media-understanding" icon="eye">
    視覚対応モデルプロバイダーと専用のメディア理解プラグインを使用して、
    受信した画像、音声、動画を要約します。
  </Card>
  <Card title="音声テキスト変換" href="/ja-JP/nodes/audio" icon="ear-listen">
    バッチ STT または Voice Call のストリーミング STT プロバイダーを通じて、
    受信した音声メッセージを文字起こしします。
  </Card>
</CardGroup>

## プロバイダー機能マトリクス

<Note>
この表は、専用のメディア生成、TTS、STT プラグインを対象としています。多くの
チャットモデルプロバイダー（Anthropic、Google、OpenAI など）も、
返信モデルを通じて受信メディアを理解します。プロバイダーの完全な一覧については、
[メディア理解](/ja-JP/nodes/media-understanding#provider-support-matrix)を参照してください。
</Note>

| プロバイダー          | 画像 | 動画 | 音楽 | TTS | STT | リアルタイム音声 | メディア理解 |
| ----------------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba           |       |   ✓   |       |     |     |                |                     |
| Azure Speech      |       |       |       |  ✓  |     |                |                     |
| BytePlus          |       |   ✓   |       |     |     |                |                     |
| ComfyUI           |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Deepgram          |       |       |       |     |  ✓  |                |                     |
| DeepInfra         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| ElevenLabs        |       |       |       |  ✓  |  ✓  |                |                     |
| fal               |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Google            |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |       ✓        |          ✓          |
| Gradium           |       |       |       |  ✓  |     |                |                     |
| Inworld           |       |       |       |  ✓  |     |                |                     |
| LiteLLM           |   ✓   |       |       |     |     |                |                     |
| ローカル CLI         |       |       |       |  ✓  |     |                |                     |
| Microsoft         |       |       |       |  ✓  |     |                |                     |
| Microsoft Foundry |   ✓   |       |       |     |     |                |                     |
| MiniMax           |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral           |       |       |       |     |  ✓  |                |                     |
| OpenAI            |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter        |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |                |          ✓          |
| PixVerse          |       |   ✓   |       |     |     |                |                     |
| Qwen              |       |   ✓   |       |     |     |                |          ✓          |
| Runway            |       |   ✓   |       |     |     |                |                     |
| SenseAudio        |       |       |       |     |  ✓  |                |                     |
| Together          |       |   ✓   |       |     |     |                |                     |
| Volcengine        |       |       |       |  ✓  |     |                |                     |
| Vydra             |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI               |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo       |       |       |       |  ✓  |     |                |                     |

<Note>
ここでの**リアルタイム音声**とは、プロバイダーネイティブの双方向リアルタイム機能（Talk の
`realtime` モード。例: Gemini Live や OpenAI Realtime API）を指します。現時点で登録しているのは
Google と OpenAI のみです。Deepgram、ElevenLabs、Mistral、OpenAI、xAI は、
Voice Call のストリーミング STT（単方向の音声テキスト変換）を別途登録しています。以下の
[音声テキスト変換と Voice Call](#speech-to-text-and-voice-call)を参照してください。
xAI のリアルタイム音声はアップストリームの機能ですが、共有リアルタイム音声契約で
表現できるようになるまでは OpenClaw に登録されません。
</Note>

## 非同期と同期

| 機能             | モード | 理由                                                                                                         |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| 画像             | 非同期 | プロバイダーの処理がチャットターンより長く続く場合があり、生成された添付ファイルは共有完了経路を使用します。 |
| テキスト読み上げ | 同期   | プロバイダーの応答は数秒で返され、返信音声に添付されます。                                                   |
| 動画             | 非同期 | プロバイダーの処理には30秒から数分かかり、遅いキューは設定されたタイムアウトまで実行される場合があります。  |
| 音楽             | 非同期 | プロバイダー処理の特性は動画と同じです。                                                                     |

非同期ツールでは、OpenClaw がリクエストをプロバイダーに送信し、タスク
ID を即座に返して、タスク台帳でジョブを追跡します。ジョブの実行中も、エージェントは
他のメッセージへの応答を続けます。プロバイダーの処理が完了すると、
OpenClaw は生成されたメディアのパスとともにエージェントを起動し、セッションの通常の可視返信モードで
ユーザーに通知できるようにします。設定されている場合は最終返信を自動配信し、セッションで
メッセージツールが必要な場合は `message(action="send")` を使用します。リクエスト元のセッションが非アクティブ、
またはアクティブな起動に失敗し、生成されたメディアの一部が完了返信からまだ欠落している場合、
OpenClaw は欠落しているメディアだけを含む冪等な直接フォールバックを送信します。完了返信ですでに
配信されたメディアが再度投稿されることはありません。

## 音声テキスト変換と Voice Call

Deepgram、DeepInfra、ElevenLabs、Google、Groq、Mistral、OpenAI、OpenRouter、
SenseAudio、xAI はすべて、設定されている場合、バッチ
`tools.media.audio` 経路を通じて受信音声を文字起こしできます。メンション判定またはコマンド解析のために
音声メモを事前確認するチャンネルプラグインは、受信コンテキスト上で文字起こし済みの
添付ファイルとしてマークします。そのため、共有メディア理解処理は、同じ音声に対して
2回目の STT 呼び出しを行わず、その文字起こしを再利用します。

Deepgram、ElevenLabs、Mistral、OpenAI、xAI は、Voice Call の
ストリーミング STT プロバイダーも登録します。そのため、録音の完了を待たずに、
ライブの電話音声を選択したベンダーへ転送できます。

ライブのユーザー会話では、[Talk モード](/ja-JP/nodes/talk)を優先してください。バッチ音声の
添付ファイルはメディア経路を使用し続けます。ブラウザーのリアルタイム機能、ネイティブのプッシュトゥトーク、
電話、会議の音声には、Talk イベントと Gateway が返すセッションスコープの
カタログを使用してください。

## プロバイダーの対応関係（各ベンダーの機能領域）

<AccordionGroup>
  <Accordion title="Google">
    画像、動画、音楽、バッチ TTS、バッチ STT、バックエンドのリアルタイム音声、
    メディア理解の各機能領域。
  </Accordion>
  <Accordion title="OpenAI">
    画像、動画、バッチ TTS、バッチ STT、Voice Call のストリーミング STT、バックエンドの
    リアルタイム音声、メモリ埋め込みの各機能領域。
  </Accordion>
  <Accordion title="DeepInfra">
    チャット／モデルルーティング、画像の生成／編集、テキストから動画への生成、バッチ TTS、
    バッチ STT、画像メディア理解、メモリ埋め込みの各機能領域。
    DeepInfra は、再ランキング、分類、物体検出などの
    ネイティブモデル種別も公開していますが、OpenClaw にはこれらの
    カテゴリに対応するプロバイダー契約がまだないため、このプラグインでは登録しません。
  </Accordion>
  <Accordion title="xAI">
    画像、動画、検索、コード実行、バッチ TTS、バッチ STT、Voice
    Call のストリーミング STT。xAI のリアルタイム音声はアップストリームの機能ですが、
    共有リアルタイム音声契約で表現できるようになるまでは、
    OpenClaw に登録されません。
  </Accordion>
</AccordionGroup>

## 関連項目

- [画像生成](/ja-JP/tools/image-generation)
- [動画生成](/ja-JP/tools/video-generation)
- [音楽生成](/ja-JP/tools/music-generation)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [音声 Node](/ja-JP/nodes/audio)
- [Talk モード](/ja-JP/nodes/talk)
