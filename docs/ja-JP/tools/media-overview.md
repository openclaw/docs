---
read_when:
    - OpenClaw のメディア機能の概要を探す
    - 設定するメディアプロバイダーの選択
    - 非同期メディア生成の仕組みを理解する
sidebarTitle: Media overview
summary: 画像、動画、音楽、音声、メディア理解機能の概要
title: メディア概要
x-i18n:
    generated_at: "2026-07-05T11:51:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw は画像、動画、音楽を生成し、受信メディア
（画像、音声、動画）を理解し、テキスト読み上げで返信を音声として発話します。すべての
メディア機能はツール駆動です。エージェントは会話に基づいて使用タイミングを判断し、
各ツールは少なくとも 1 つの裏側のプロバイダーが設定されている場合にのみ表示されます。

ライブ音声は、ワンショットのメディアツール
パスではなく Talk セッション契約を使用します。Talk には 3 つのモードがあります。プロバイダーネイティブの `realtime`、ローカルまたはストリーミングの
`stt-tts`、観察専用の音声キャプチャ向け `transcription` です。これらのモードは、
テレフォニー、会議、ブラウザーリアルタイム、ネイティブのプッシュツートーククライアントと、
プロバイダーカタログ、イベントエンベロープ、キャンセルのセマンティクスを共有します。

## 機能

<CardGroup cols={2}>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    テキストプロンプトまたは参照画像から
    `image_generate` 経由で画像を作成・編集します。チャットセッションでは非同期です。バックグラウンドで実行され、
    準備ができると結果を投稿します。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    `video_generate` 経由でテキストから動画、画像から動画、動画から動画を生成します。
    非同期です。バックグラウンドで実行され、準備ができると結果を投稿します。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    `music_generate` 経由で音楽または音声トラックを生成します。チャット
    セッションでは、共有メディア生成タスクライフサイクル上で非同期に実行されます。
  </Card>
  <Card title="テキスト読み上げ" href="/ja-JP/tools/tts" icon="microphone">
    `tts` ツールと
    `messages.tts` 設定を使用して、送信返信を音声に変換します。同期です。
  </Card>
  <Card title="メディア理解" href="/ja-JP/nodes/media-understanding" icon="eye">
    ビジョン対応モデル
    プロバイダーと専用のメディア理解プラグインを使用して、受信画像、音声、動画を要約します。
  </Card>
  <Card title="音声テキスト変換" href="/ja-JP/nodes/audio" icon="ear-listen">
    バッチ STT または Voice Call
    ストリーミング STT プロバイダーを通じて、受信音声メッセージを文字起こしします。
  </Card>
</CardGroup>

## プロバイダー機能マトリクス

<Note>
この表は、専用のメディア生成、TTS、STT プラグインを対象にしています。多くの
チャットモデルプロバイダー（Anthropic、Google、OpenAI など）も、返信モデルを通じて
受信メディアを理解します。完全なプロバイダー一覧は
[メディア理解](/ja-JP/nodes/media-understanding#provider-support-matrix)を参照してください。
</Note>

| プロバイダー      | 画像 | 動画 | 音楽 | TTS | STT | リアルタイム音声 | メディア理解 |
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
| Local CLI         |       |       |       |  ✓  |     |                |                     |
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
ここでの**リアルタイム音声**とは、プロバイダーネイティブの双方向リアルタイム（Talk
`realtime` モード、例: Gemini Live または OpenAI Realtime API）を意味します。現在登録しているのは Google
と OpenAI のみです。Deepgram、ElevenLabs、Mistral、OpenAI、xAI は、
Voice Call ストリーミング STT（一方向の音声からテキスト）も別途登録しています。以下の
[音声テキスト変換と Voice Call](#speech-to-text-and-voice-call)を参照してください。
xAI Realtime voice は上流の機能ですが、共有リアルタイム音声契約で表現できるようになるまでは
OpenClaw には登録されません。
</Note>

## 非同期と同期

| 機能           | モード       | 理由                                                                                                  |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 画像           | 非同期       | プロバイダー処理がチャットターンを超えて継続することがあります。生成された添付ファイルは共有完了パスを使用します。 |
| テキスト読み上げ | 同期         | プロバイダーの応答は数秒で返り、返信音声に添付されます。                                   |
| 動画           | 非同期       | プロバイダー処理には 30 秒から数分かかります。遅いキューは設定されたタイムアウトまで実行されることがあります。 |
| 音楽           | 非同期       | 動画と同じプロバイダー処理特性です。                                                    |

非同期ツールでは、OpenClaw はリクエストをプロバイダーに送信し、タスク
ID を即座に返して、タスク台帳でジョブを追跡します。ジョブの実行中も、エージェントは
他のメッセージへの応答を続けます。プロバイダーが完了すると、
OpenClaw は生成されたメディアパスとともにエージェントを起動し、
セッションの通常の可視返信モードを通じてユーザーに伝えられるようにします。設定されている場合は自動の最終返信
配信、セッションがメッセージツールを必要とする場合は `message(action="send")` です。リクエスト元セッションが非アクティブ、またはそのアクティブ wake
が失敗し、生成されたメディアの一部が完了返信にまだ含まれていない場合、
OpenClaw は不足しているメディアのみを含む冪等な直接フォールバックを送信します。完了返信ですでに配信されたメディアは
再投稿されません。

## 音声テキスト変換と Voice Call

Deepgram、DeepInfra、ElevenLabs、Google、Groq、Mistral、OpenAI、OpenRouter、
SenseAudio、xAI はすべて、設定されている場合にバッチ
`tools.media.audio` パスを通じて受信音声を文字起こしできます。メンションゲートまたはコマンド解析のために
ボイスノートを事前確認するチャンネルプラグインは、文字起こし済みの
添付ファイルを受信コンテキストにマークするため、共有メディア理解パスは
同じ音声に対して 2 回目の STT 呼び出しを行わずにそのトランスクリプトを再利用します。

Deepgram、ElevenLabs、Mistral、OpenAI、xAI は Voice Call
ストリーミング STT プロバイダーも登録しているため、ライブ電話音声は録音完了を待たずに、選択された
ベンダーへ転送できます。

ライブのユーザー会話には、[Talk モード](/ja-JP/nodes/talk)を優先してください。バッチ音声
添付ファイルはメディアパスに残ります。ブラウザーリアルタイム、ネイティブのプッシュツートーク、
テレフォニー、会議音声は、Talk イベントと Gateway から返されるセッションスコープの
カタログを使用する必要があります。

## プロバイダーマッピング（ベンダーがサーフェス間でどう分かれるか）

<AccordionGroup>
  <Accordion title="Google">
    画像、動画、音楽、バッチ TTS、バッチ STT、バックエンドリアルタイム音声、
    メディア理解サーフェス。
  </Accordion>
  <Accordion title="OpenAI">
    画像、動画、バッチ TTS、バッチ STT、Voice Call ストリーミング STT、バックエンド
    リアルタイム音声、メモリ埋め込みサーフェス。
  </Accordion>
  <Accordion title="DeepInfra">
    チャット/モデルルーティング、画像生成/編集、テキストから動画、バッチ TTS、
    バッチ STT、画像メディア理解、メモリ埋め込みサーフェス。
    DeepInfra は、再ランキング、分類、物体検出、その他のネイティブモデルタイプも公開していますが、
    OpenClaw にはこれらの
    カテゴリ向けのプロバイダー契約がまだないため、このプラグインはそれらを登録しません。
  </Accordion>
  <Accordion title="xAI">
    画像、動画、検索、コード実行、バッチ TTS、バッチ STT、Voice
    Call ストリーミング STT。xAI Realtime voice は上流の機能ですが、
    共有リアルタイム音声契約で表現できるようになるまでは
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
