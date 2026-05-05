---
read_when:
    - OpenClawのメディア機能の概要を探す
    - 設定するメディアプロバイダーを決める
    - 非同期メディア生成の仕組みを理解する
sidebarTitle: Media overview
summary: 画像、動画、音楽、音声、メディア理解機能の概要
title: メディア概要
x-i18n:
    generated_at: "2026-05-05T01:50:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd6b93fd79897001d24f3ba5a5c8cb9bd17281116fad17262a6389214db7059
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw は画像、動画、音楽を生成し、受信メディア
（画像、音声、動画）を理解し、テキスト読み上げで返信を音声として読み上げます。すべての
メディア機能はツール駆動です。エージェントは会話に基づいて使用タイミングを判断し、
各ツールは少なくとも1つの対応プロバイダーが設定されている場合にのみ表示されます。

## 機能

<CardGroup cols={2}>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    テキストプロンプトまたは参照画像から、
    `image_generate` で画像を作成・編集します。同期処理 — 返信内で完了します。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    `video_generate` で、テキストから動画、画像から動画、動画から動画を生成します。
    非同期処理 — バックグラウンドで実行され、準備ができたら結果を投稿します。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    `music_generate` で音楽または音声トラックを生成します。共有
    プロバイダーでは非同期です。ComfyUI ワークフローパスは同期的に実行されます。
  </Card>
  <Card title="テキスト読み上げ" href="/ja-JP/tools/tts" icon="microphone">
    `tts` ツールと
    `messages.tts` 設定により、送信返信を音声に変換します。同期処理です。
  </Card>
  <Card title="メディア理解" href="/ja-JP/nodes/media-understanding" icon="eye">
    ビジョン対応モデルプロバイダーと専用のメディア理解 Plugin を使って、
    受信画像、音声、動画を要約します。
  </Card>
  <Card title="音声テキスト変換" href="/ja-JP/nodes/audio" icon="ear-listen">
    バッチ STT または Voice Call
    ストリーミング STT プロバイダーを通じて、受信ボイスメッセージを書き起こします。
  </Card>
</CardGroup>

## プロバイダー機能マトリクス

| プロバイダー | 画像 | 動画 | 音楽 | TTS | STT | リアルタイム音声 | メディア理解 |
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
| OpenRouter  |   ✓   |   ✓   |       |  ✓  |     |                |          ✓          |
| Qwen        |       |   ✓   |       |     |     |                |                     |
| Runway      |       |   ✓   |       |     |     |                |                     |
| SenseAudio  |       |       |       |     |  ✓  |                |                     |
| Together    |       |   ✓   |       |     |     |                |                     |
| Vydra       |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
メディア理解は、プロバイダー設定に登録されたビジョン対応または音声対応モデルを使用します。
上のマトリクスは専用のメディア理解サポートがあるプロバイダーを示しています。ほとんどの
マルチモーダル LLM プロバイダー（Anthropic、Google、
OpenAI など）も、有効な返信モデルとして設定されている場合は受信メディアを理解できます。
</Note>

## 非同期と同期

| 機能 | モード | 理由 |
| --------------- | ------------ | ------------------------------------------------------------------ |
| 画像 | 同期 | プロバイダーの応答は数秒で返り、返信内で完了します。 |
| テキスト読み上げ | 同期 | プロバイダーの応答は数秒で返り、返信音声に添付されます。 |
| 動画 | 非同期 | プロバイダー処理に30秒から数分かかります。 |
| 音楽（共有） | 非同期 | 動画と同じプロバイダー処理特性です。 |
| 音楽（ComfyUI） | 同期 | ローカルワークフローが、設定済みの ComfyUI サーバーに対して返信内で実行されます。 |

非同期ツールでは、OpenClaw はリクエストをプロバイダーに送信し、タスク
ID を即座に返し、タスク台帳でジョブを追跡します。エージェントは
ジョブの実行中も他のメッセージへの返信を続けます。プロバイダーが完了すると、
OpenClaw は生成されたメディアパスとともにエージェントを起動し、エージェントが
ユーザーに通知し、ソース配信ポリシーで必要な場合はメッセージツールを通じて
結果を中継できるようにします。

## 音声テキスト変換と Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、SenseAudio、xAI はすべて、
設定されている場合、バッチ `tools.media.audio` パスを通じて受信音声を書き起こせます。
メンション制御やコマンド解析のためにボイスノートを事前チェックするチャネル Plugin は、
受信コンテキストで書き起こし済み添付ファイルをマークするため、共有の
メディア理解パスは同じ音声に対して2回目の STT 呼び出しを行わずにその文字起こしを再利用します。

Deepgram、ElevenLabs、Mistral、OpenAI、xAI は Voice Call
ストリーミング STT プロバイダーも登録するため、完了した録音を待たずに
ライブ電話音声を選択したベンダーへ転送できます。

## プロバイダーマッピング（ベンダーがサーフェス間でどのように分かれるか）

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
    DeepInfra ネイティブの再ランキング/分類/物体検出モデルは、OpenClaw が
    これらのカテゴリ専用のプロバイダー契約を持つまで登録されません。
  </Accordion>
  <Accordion title="xAI">
    画像、動画、検索、コード実行、バッチ TTS、バッチ STT、Voice
    Call ストリーミング STT。xAI Realtime 音声は上流の機能ですが、
    共有リアルタイム音声契約で表現できるようになるまで OpenClaw には登録されません。
  </Accordion>
</AccordionGroup>

## 関連

- [画像生成](/ja-JP/tools/image-generation)
- [動画生成](/ja-JP/tools/video-generation)
- [音楽生成](/ja-JP/tools/music-generation)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [音声ノード](/ja-JP/nodes/audio)
