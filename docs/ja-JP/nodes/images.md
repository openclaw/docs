---
read_when:
    - メディアパイプラインまたは添付の変更ోదિયાનuser to=functions.read in commentary  天天彩票怎么  天天爱彩票提现json  content{"path":"../AGENTS.md"}/Subthresholdassistant to=functions.read in commentary  ฝ่ายขายออนไลน์  手机天天中彩票 ադարձjson  content{"path":"../AGENTS.md"}  天天爱彩票提现json
summary: 送信、Gateway、エージェント返信における画像とメディア処理ルール
title: 画像とメディアのサポート
x-i18n:
    generated_at: "2026-04-24T05:06:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26fa460f7dcdac9f15c9d79c3c3370adbce526da5cfa9a6825a8ed20b41e0a29
    source_path: nodes/images.md
    workflow: 15
---

# 画像とメディアのサポート（2025-12-05）

WhatsApp チャネルは **Baileys Web** 経由で動作します。このドキュメントでは、送信、Gateway、エージェント返信における現在のメディア処理ルールをまとめます。

## 目標

- `openclaw message send --media` で、任意のキャプション付きメディアを送信する。
- Web inbox からの自動返信に、テキストと一緒にメディアを含められるようにする。
- タイプごとの制限を妥当で予測可能なものに保つ。

## CLI サーフェス

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` は任意。メディアのみ送信する場合、キャプションは空でもよい。
  - `--dry-run` は解決済みペイロードを表示し、`--json` は `{ channel, to, messageId, mediaUrl, caption }` を出力する。

## WhatsApp Web チャネルの動作

- 入力: ローカルファイルパス **または** HTTP(S) URL。
- フロー: Buffer に読み込み、メディア種別を検出し、正しいペイロードを構築する:
  - **画像:** `channels.whatsapp.mediaMaxMb`（デフォルト: 50 MB）を目標に、JPEG にリサイズおよび再圧縮する（最大辺 2048px）。
  - **音声/ボイス/動画:** 16 MB まではそのまま通し、音声はボイスノートとして送信する（`ptt: true`）。
  - **ドキュメント:** それ以外のものは 100 MB まで。利用可能な場合はファイル名を保持する。
- WhatsApp の GIF 風再生: `gifPlayback: true` を付けた MP4 を送信する（CLI: `--gif-playback`）ことで、モバイルクライアントでインラインループ再生する。
- MIME 検出は、まず magic bytes、次にヘッダー、その次にファイル拡張子を優先する。
- キャプションは `--message` または `reply.text` から取得する。空のキャプションも許可される。
- ログ: 非 verbose では `↩️`/`✅` を表示し、verbose ではサイズとソースパス/URL を含める。

## 自動返信パイプライン

- `getReplyFromConfig` は `{ text?, mediaUrl?, mediaUrls? }` を返す。
- メディアが存在する場合、Web 送信側は `openclaw message send` と同じパイプラインを使ってローカルパスまたは URL を解決する。
- 複数のメディアエントリーが指定された場合、それらは順番に送信される。

## コマンドへの受信メディア入力（Pi）

- 受信した Web メッセージにメディアが含まれる場合、OpenClaw はそれを一時ファイルにダウンロードし、テンプレート変数として公開する:
  - `{{MediaUrl}}` 受信メディア用の疑似 URL。
  - `{{MediaPath}}` コマンド実行前に書き込まれるローカル一時パス。
- セッション単位の Docker sandbox が有効な場合、受信メディアは sandbox workspace にコピーされ、`MediaPath`/`MediaUrl` は `media/inbound/<filename>` のような相対パスに書き換えられる。
- メディア理解（`tools.media.*` または共有 `tools.media.models` で設定されている場合）はテンプレート適用前に実行され、`Body` に `[Image]`、`[Audio]`、`[Video]` ブロックを挿入できる。
  - 音声では `{{Transcript}}` が設定され、コマンド解析には transcript が使われるため、スラッシュコマンドも引き続き動作する。
  - 動画と画像の説明は、コマンド解析のためにキャプションテキストを保持する。
  - アクティブなプライマリ画像モデルがすでにネイティブで vision をサポートしている場合、OpenClaw は `[Image]` サマリーブロックを省略し、代わりに元の画像をモデルに渡す。
- デフォルトでは、最初に一致した画像/音声/動画の添付のみが処理される。複数の添付を処理するには `tools.media.<cap>.attachments` を設定する。

## 制限とエラー

**送信時の上限（WhatsApp Web 送信）**

- 画像: 再圧縮後に `channels.whatsapp.mediaMaxMb`（デフォルト: 50 MB）まで。
- 音声/ボイス/動画: 16 MB 上限。ドキュメント: 100 MB 上限。
- サイズ超過または読み取れないメディア → ログに明確なエラーを出し、その返信はスキップされる。

**メディア理解の上限（文字起こし/説明）**

- 画像デフォルト: 10 MB（`tools.media.image.maxBytes`）。
- 音声デフォルト: 20 MB（`tools.media.audio.maxBytes`）。
- 動画デフォルト: 50 MB（`tools.media.video.maxBytes`）。
- サイズ超過のメディアは理解処理をスキップするが、返信自体は元の本文のまま引き続き行われる。

## テストに関する注意

- 画像/音声/ドキュメントケースについて、送信 + 返信フローをカバーする。
- 画像の再圧縮（サイズ制限）と、音声のボイスノートフラグを検証する。
- 複数メディアの返信が順次送信として展開されることを確認する。

## 関連

- [カメラキャプチャ](/ja-JP/nodes/camera)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [音声とボイスノート](/ja-JP/nodes/audio)
