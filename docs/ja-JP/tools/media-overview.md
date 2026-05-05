---
read_when:
    - OpenClawのメディア機能の概要を探している
    - 構成するメディアプロバイダーの決定
    - 非同期メディア生成の仕組みを理解する
sidebarTitle: Media overview
summary: 画像、動画、音楽、音声、メディア理解機能の概要
title: メディアの概要
x-i18n:
    generated_at: "2026-05-05T06:16:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw は画像、動画、音楽を生成し、受信メディア
（画像、音声、動画）を理解し、テキスト読み上げで返信を音声として話します。すべての
メディア機能はツール駆動です。エージェントは会話に基づいてそれらをいつ使うかを判断し、
各ツールは少なくとも 1 つの裏側のプロバイダーが設定されている場合にのみ表示されます。

## 機能

<CardGroup cols={2}>
  <Card title="Image generation" href="/ja-JP/tools/image-generation" icon="image">
    テキストプロンプトまたは参照画像から `image_generate` 経由で画像を作成・編集します。
    同期 - 返信と同時にインラインで完了します。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    `video_generate` 経由でテキストから動画、画像から動画、動画から動画を生成します。
    非同期 - バックグラウンドで実行され、準備できたら結果を投稿します。
  </Card>
  <Card title="Music generation" href="/ja-JP/tools/music-generation" icon="music">
    `music_generate` 経由で音楽またはオーディオトラックを生成します。共有プロバイダーでは非同期です。
    ComfyUI ワークフローパスは同期的に実行されます。
  </Card>
  <Card title="Text-to-speech" href="/ja-JP/tools/tts" icon="microphone">
    `tts` ツールと `messages.tts` 設定を使って、送信返信を音声オーディオに変換します。
    同期です。
  </Card>
  <Card title="Media understanding" href="/ja-JP/nodes/media-understanding" icon="eye">
    視覚対応モデルプロバイダーと専用のメディア理解 Plugin を使用して、
    受信画像、音声、動画を要約します。
  </Card>
  <Card title="Speech-to-text" href="/ja-JP/nodes/audio" icon="ear-listen">
    バッチ STT または Voice Call ストリーミング STT プロバイダーを通じて、
    受信音声メッセージを書き起こします。
  </Card>
</CardGroup>

## プロバイダー機能マトリックス

| プロバイダー    | 画像 | 動画 | 音楽 | TTS | STT | リアルタイム音声 | メディア理解 |
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
メディア理解は、プロバイダー設定に登録されている任意の視覚対応または音声対応モデルを使用します。
上のマトリックスは、専用のメディア理解サポートを備えたプロバイダーを示しています。
ほとんどのマルチモーダル LLM プロバイダー（Anthropic、Google、OpenAI など）も、
アクティブな返信モデルとして設定されていれば受信メディアを理解できます。
</Note>

## 非同期と同期

| 機能      | モード         | 理由                                                                                                  |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 画像           | 同期  | プロバイダーの応答は数秒で返り、返信と同時にインラインで完了します。                                   |
| テキスト読み上げ  | 同期  | プロバイダーの応答は数秒で返り、返信音声に添付されます。                                   |
| 動画           | 非同期 | プロバイダー処理には 30 秒から数分かかります。遅いキューは設定されたタイムアウトまで実行されることがあります。 |
| 音楽（共有）  | 非同期 | 動画と同じプロバイダー処理特性です。                                                    |
| 音楽（ComfyUI） | 同期  | ローカルワークフローは、設定済みの ComfyUI サーバーに対してインラインで実行されます。                                    |

非同期ツールでは、OpenClaw はリクエストをプロバイダーに送信し、タスク
ID をすぐに返して、タスク台帳でジョブを追跡します。ジョブの実行中も、
エージェントは他のメッセージへの応答を続けます。プロバイダーが完了すると、
OpenClaw は生成されたメディアパスでエージェントを起動し、ユーザーに伝えられるようにします。
また、送信元配信ポリシーで必要な場合は、メッセージツールを通じて結果を中継します。
メッセージツール専用のグループ/チャンネルルートでは、OpenClaw は
メッセージツールによる配信証拠がないことを完了試行の失敗として扱い、
生成されたメディアのフォールバックを元のチャンネルへ直接送信します。

## 音声テキスト変換と Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、SenseAudio、xAI はすべて、
設定されている場合、バッチ `tools.media.audio` パスを通じて受信音声を書き起こせます。
メンションゲートまたはコマンド解析のために音声メモを事前チェックするチャンネル Plugin は、
受信コンテキスト上で書き起こし済み添付ファイルをマークします。そのため、共有の
メディア理解パスは同じ音声に対して 2 回目の STT 呼び出しを行わずに、その文字起こしを再利用します。

Deepgram、ElevenLabs、Mistral、OpenAI、xAI は Voice Call
ストリーミング STT プロバイダーも登録するため、ライブ電話音声は録音完了を待たずに
選択されたベンダーへ転送できます。

## プロバイダーマッピング（ベンダーがサーフェス間でどのように分かれるか）

<AccordionGroup>
  <Accordion title="Google">
    画像、動画、音楽、バッチ TTS、バックエンドのリアルタイム音声、および
    メディア理解サーフェス。
  </Accordion>
  <Accordion title="OpenAI">
    画像、動画、バッチ TTS、バッチ STT、Voice Call ストリーミング STT、バックエンドの
    リアルタイム音声、およびメモリ埋め込みサーフェス。
  </Accordion>
  <Accordion title="DeepInfra">
    チャット/モデルルーティング、画像生成/編集、テキストから動画、バッチ TTS、
    バッチ STT、画像メディア理解、およびメモリ埋め込みサーフェス。
    DeepInfra ネイティブの再ランキング/分類/オブジェクト検出モデルは、OpenClaw がこれらの
    カテゴリー専用のプロバイダー契約を持つまで登録されません。
  </Accordion>
  <Accordion title="xAI">
    画像、動画、検索、コード実行、バッチ TTS、バッチ STT、Voice
    Call ストリーミング STT。xAI Realtime 音声はアップストリームの機能ですが、
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
