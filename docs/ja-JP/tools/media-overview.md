---
read_when:
    - OpenClaw のメディア機能の概要を探している
    - どのメディアプロバイダーを設定するかを決める
    - 非同期メディア生成の仕組みを理解する
sidebarTitle: Media overview
summary: 画像、動画、音楽、音声、メディア理解機能の概要
title: メディアの概要
x-i18n:
    generated_at: "2026-05-12T08:46:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7ca89d058467968ee140cb3318fe8a1fb96d09fe7c59982efce36eb9b714591
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw は画像、動画、音楽を生成し、受信メディア
（画像、音声、動画）を理解し、テキスト読み上げで返信を音声として読み上げます。すべての
メディア機能はツール駆動です。エージェントは会話に基づいて使用タイミングを判断し、
各ツールは少なくとも 1 つのバックエンド
provider が設定されている場合にのみ表示されます。

ライブ音声は、単発のメディアツール
パスではなく Talk セッション契約を使用します。Talk には 3 つのモードがあります。provider ネイティブの `realtime`、ローカルまたはストリーミングの
`stt-tts`、観察専用の音声キャプチャ向けの `transcription` です。これらのモードは、
telephony、会議、ブラウザリアルタイム、ネイティブのプッシュトゥトーククライアントと
provider カタログ、イベントエンベロープ、キャンセルセマンティクスを共有します。

## 機能

<CardGroup cols={2}>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    テキストプロンプトまたは参照画像から
    `image_generate` 経由で画像を作成および編集します。同期式 — 返信内でインラインに完了します。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    `video_generate` 経由でテキストから動画、画像から動画、動画から動画を生成します。
    非同期 — バックグラウンドで実行され、準備ができたら結果を投稿します。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    `music_generate` 経由で音楽またはオーディオトラックを生成します。共有
    provider では非同期です。ComfyUI ワークフローパスは同期的に実行されます。
  </Card>
  <Card title="テキスト読み上げ" href="/ja-JP/tools/tts" icon="microphone">
    `tts` ツールと
    `messages.tts` 設定を使って、送信返信を音声オーディオに変換します。同期式です。
  </Card>
  <Card title="メディア理解" href="/ja-JP/nodes/media-understanding" icon="eye">
    vision 対応モデル
    provider と専用のメディア理解 Plugin を使用して、受信画像、音声、動画を要約します。
  </Card>
  <Card title="音声テキスト化" href="/ja-JP/nodes/audio" icon="ear-listen">
    バッチ STT または Voice Call
    ストリーミング STT provider を通じて、受信ボイスメッセージを文字起こしします。
  </Card>
</CardGroup>

## Provider 機能マトリクス

| Provider    | 画像 | 動画 | 音楽 | TTS | STT | リアルタイム音声 | メディア理解 |
| ----------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba     |       |   ✓   |       |     |     |                |                     |
| BytePlus    |       |   ✓   |       |     |     |                |                     |
| ComfyUI     |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| DeepInfra   |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Deepgram    |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs  |       |       |       |  ✓  |  ✓  |                |                     |
| fal         |   ✓   |   ✓   |       |     |     |                |                     |
| Google      |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium     |       |       |       |  ✓  |     |                |                     |
| Local CLI   |       |       |       |  ✓  |     |                |                     |
| Microsoft   |       |       |       |  ✓  |     |                |                     |
| MiniMax     |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral     |       |       |       |     |  ✓  |                |                     |
| OpenAI      |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter  |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Qwen        |       |   ✓   |       |     |     |                |                     |
| Runway      |       |   ✓   |       |     |     |                |                     |
| SenseAudio  |       |       |       |     |  ✓  |                |                     |
| Together    |       |   ✓   |       |     |     |                |                     |
| Vydra       |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
メディア理解は、provider 設定に登録されている任意の vision 対応または音声対応モデルを使用します。
上のマトリクスには専用の
メディア理解サポートを備えた provider を示しています。ほとんどのマルチモーダル LLM provider（Anthropic、Google、
OpenAI など）も、アクティブな
返信モデルとして設定されている場合、受信メディアを理解できます。
</Note>

## 非同期と同期

| 機能      | モード         | 理由                                                                                                  |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 画像           | 同期式  | Provider のレスポンスは数秒で返り、返信内でインラインに完了します。                                   |
| テキスト読み上げ  | 同期式  | Provider のレスポンスは数秒で返り、返信オーディオに添付されます。                                   |
| 動画           | 非同期 | Provider の処理には 30 秒から数分かかります。遅いキューは設定されたタイムアウトまで実行されることがあります。 |
| 音楽（共有）  | 非同期 | 動画と同じ provider 処理特性です。                                                    |
| 音楽（ComfyUI） | 同期式  | ローカルワークフローは、設定された ComfyUI サーバーに対してインラインで実行されます。                                    |

非同期ツールでは、OpenClaw はリクエストを provider に送信し、ただちにタスク
id を返して、タスク台帳でジョブを追跡します。エージェントは
ジョブの実行中も他のメッセージへの応答を続けます。provider が完了すると、
OpenClaw は生成されたメディアパスとともにエージェントを起動し、エージェントが
ユーザーに知らせ、ソース配信ポリシーで必要な場合は
メッセージツールを通じて結果を中継できるようにします。メッセージツール専用のグループ/チャンネルルートでは、OpenClaw は
メッセージツールの配信証拠が欠けていることを完了試行の失敗として扱い、
生成メディアのフォールバックを元のチャンネルに直接送信します。

## 音声テキスト化と Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、OpenRouter、SenseAudio、xAI はすべて、設定されている場合、
バッチ `tools.media.audio` パスを通じて受信音声を文字起こしできます。
メンションゲーティングまたはコマンド
解析のためにボイスノートをプリフライトするチャンネル Plugin は、受信コンテキスト上に文字起こし済み添付ファイルをマークするため、共有
メディア理解パスは同じ音声に対して 2 回目の
STT 呼び出しを行わず、その transcript を再利用します。

Deepgram、ElevenLabs、Mistral、OpenAI、xAI は Voice Call
ストリーミング STT provider も登録するため、ライブ電話音声を、完了した録音を待たずに選択された
vendor へ転送できます。

ライブのユーザー会話では、[Talk モード](/ja-JP/nodes/talk)を優先してください。バッチ音声
添付ファイルはメディアパスに留まります。ブラウザリアルタイム、ネイティブのプッシュトゥトーク、
telephony、会議音声は、Talk イベントと Gateway から返されるセッションスコープの
カタログを使用する必要があります。

## Provider マッピング（vendor がサーフェス間でどのように分かれるか）

<AccordionGroup>
  <Accordion title="Google">
    画像、動画、音楽、バッチ TTS、バックエンドリアルタイム音声、
    メディア理解サーフェス。
  </Accordion>
  <Accordion title="OpenAI">
    画像、動画、バッチ TTS、バッチ STT、Voice Call ストリーミング STT、バックエンド
    リアルタイム音声、メモリ埋め込みサーフェス。
  </Accordion>
  <Accordion title="DeepInfra">
    チャット/モデルルーティング、画像生成/編集、テキストから動画、バッチ TTS、
    バッチ STT、画像メディア理解、メモリ埋め込みサーフェス。
    DeepInfra ネイティブのリランク/分類/物体検出モデルは、OpenClaw がそれらの
    カテゴリ専用の provider 契約を持つまで登録されません。
  </Accordion>
  <Accordion title="xAI">
    画像、動画、検索、コード実行、バッチ TTS、バッチ STT、Voice
    Call ストリーミング STT。xAI Realtime 音声はアップストリーム機能ですが、
    共有リアルタイム音声契約がそれを表現できるようになるまで
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
