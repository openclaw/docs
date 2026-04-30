---
read_when:
    - OpenClaw のメディア機能の概要を探している
    - 設定するメディアプロバイダーの選択
    - 非同期メディア生成の仕組みを理解する
sidebarTitle: Media overview
summary: 画像、動画、音楽、音声、メディア理解機能の概要
title: メディアの概要
x-i18n:
    generated_at: "2026-04-30T05:39:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw は画像、動画、音楽を生成し、受信メディア
（画像、音声、動画）を理解し、テキスト読み上げで返信を音声として読み上げます。すべての
メディア機能はツール駆動です。エージェントは会話に基づいてそれらをいつ使うかを判断し、
各ツールは少なくとも 1 つのバックエンドプロバイダーが設定されている場合にのみ表示されます。

## 機能

<CardGroup cols={2}>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    テキストプロンプトまたは参照画像から
    `image_generate` 経由で画像を作成・編集します。同期 — 返信内でインラインに完了します。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    `video_generate` 経由で、テキストから動画、画像から動画、動画から動画を生成します。
    非同期 — バックグラウンドで実行され、準備ができると結果を投稿します。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    `music_generate` 経由で音楽または音声トラックを生成します。共有
    プロバイダーでは非同期です。ComfyUI ワークフローパスは同期実行されます。
  </Card>
  <Card title="テキスト読み上げ" href="/ja-JP/tools/tts" icon="microphone">
    `tts` ツールと `messages.tts` 設定を使って、送信返信を音声に変換します。
    同期です。
  </Card>
  <Card title="メディア理解" href="/ja-JP/nodes/media-understanding" icon="eye">
    視覚対応モデルプロバイダーと専用のメディア理解 Plugin を使用して、
    受信画像、音声、動画を要約します。
  </Card>
  <Card title="音声テキスト変換" href="/ja-JP/nodes/audio" icon="ear-listen">
    バッチ STT または Voice Call ストリーミング STT プロバイダーを通じて、
    受信音声メッセージを文字起こしします。
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
メディア理解は、プロバイダー設定に登録された任意の視覚対応または音声対応モデルを使用します。
上のマトリクスには、専用のメディア理解サポートを持つプロバイダーを記載しています。
ほとんどのマルチモーダル LLM プロバイダー（Anthropic、Google、
OpenAI など）も、アクティブな返信モデルとして設定されている場合は受信メディアを理解できます。
</Note>

## 非同期と同期

| 機能            | モード       | 理由                                                               |
| --------------- | ------------ | ------------------------------------------------------------------ |
| 画像            | 同期         | プロバイダーの応答は数秒で返り、返信内でインラインに完了します。 |
| テキスト読み上げ | 同期         | プロバイダーの応答は数秒で返り、返信音声に添付されます。         |
| 動画            | 非同期       | プロバイダー処理には 30 秒から数分かかります。                    |
| 音楽（共有）    | 非同期       | 動画と同じプロバイダー処理特性です。                              |
| 音楽（ComfyUI） | 同期         | ローカルワークフローが設定済みの ComfyUI サーバーに対してインラインに実行されます。 |

非同期ツールの場合、OpenClaw はリクエストをプロバイダーに送信し、タスク
id を即座に返して、タスク台帳でジョブを追跡します。エージェントは
ジョブの実行中も他のメッセージへの応答を続けます。プロバイダーが完了すると、
OpenClaw はエージェントを起動し、完成したメディアを元のチャネルに投稿できるようにします。

## 音声テキスト変換と Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、SenseAudio、xAI はすべて、
設定されていればバッチ `tools.media.audio` パスを通じて受信音声を文字起こしできます。
メンションゲートやコマンド解析のためにボイスノートを事前確認するチャネル Plugin は、
受信コンテキスト上で文字起こし済み添付ファイルをマークするため、共有
メディア理解パスは同じ音声に対して 2 回目の STT 呼び出しを行わず、そのトランスクリプトを再利用します。

Deepgram、ElevenLabs、Mistral、OpenAI、xAI は Voice Call
ストリーミング STT プロバイダーも登録するため、完了済み録音を待たずにライブ通話音声を選択した
ベンダーへ転送できます。

## プロバイダーマッピング（ベンダーが各サーフェスにどう分かれるか）

<AccordionGroup>
  <Accordion title="Google">
    画像、動画、音楽、バッチ TTS、バックエンドリアルタイム音声、および
    メディア理解サーフェス。
  </Accordion>
  <Accordion title="OpenAI">
    画像、動画、バッチ TTS、バッチ STT、Voice Call ストリーミング STT、バックエンド
    リアルタイム音声、およびメモリエンベディングサーフェス。
  </Accordion>
  <Accordion title="DeepInfra">
    チャット/モデルルーティング、画像生成/編集、テキストから動画、バッチ TTS、
    バッチ STT、画像メディア理解、およびメモリエンベディングサーフェス。
    DeepInfra ネイティブのリランク/分類/物体検出モデルは、OpenClaw がそれらの
    カテゴリ専用のプロバイダー契約を持つまで登録されません。
  </Accordion>
  <Accordion title="xAI">
    画像、動画、検索、コード実行、バッチ TTS、バッチ STT、および Voice
    Call ストリーミング STT。xAI Realtime voice は上流の機能ですが、共有リアルタイム音声契約で
    表現できるようになるまで OpenClaw には登録されません。
  </Accordion>
</AccordionGroup>

## 関連

- [画像生成](/ja-JP/tools/image-generation)
- [動画生成](/ja-JP/tools/video-generation)
- [音楽生成](/ja-JP/tools/music-generation)
- [テキスト読み上げ](/ja-JP/tools/tts)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [音声ノード](/ja-JP/nodes/audio)
