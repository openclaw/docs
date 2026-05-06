---
read_when:
    - メディアパイプラインまたは添付ファイルの変更
summary: send、Gateway、エージェント返信における画像とメディアの処理ルール
title: 画像とメディアのサポート
x-i18n:
    generated_at: "2026-05-06T05:11:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# 画像とメディアのサポート (2025-12-05)

WhatsApp チャネルは **Baileys Web** 経由で動作します。このドキュメントでは、送信、Gateway、エージェント返信に関する現在のメディア処理ルールをまとめます。

## 目標

- `openclaw message send --media` で任意のキャプション付きメディアを送信する。
- Web 受信箱からの自動返信で、テキストと一緒にメディアを含められるようにする。
- 種類ごとの制限を妥当で予測しやすいものに保つ。

## CLI サーフェス

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` は任意。メディアのみの送信ではキャプションを空にできる。
  - `--dry-run` は解決済みペイロードを出力する。`--json` は `{ channel, to, messageId, mediaUrl, caption }` を出力する。

## WhatsApp Web チャネルの動作

- 入力: ローカルファイルパス **または** HTTP(S) URL。
- フロー: Buffer に読み込み、メディア種別を検出し、正しいペイロードを組み立てる:
  - **画像:** `channels.whatsapp.mediaMaxMb` (デフォルト: 50 MB) を目標に、JPEG へリサイズと再圧縮を行う (最大辺 2048px)。
  - **音声/ボイス/動画:** 16 MB までパススルー。音声はボイスノート (`ptt: true`) として送信される。
  - **ドキュメント:** その他すべて。100 MB まで。利用可能な場合はファイル名を保持する。
- WhatsApp の GIF 風再生: MP4 を `gifPlayback: true` (CLI: `--gif-playback`) で送信し、モバイルクライアントでインラインループさせる。
- MIME 検出はマジックバイト、次にヘッダー、次にファイル拡張子の順に優先する。
- キャプションは `--message` または `reply.text` から取得する。空のキャプションも許可される。
- ログ: 非詳細表示では `↩️`/`✅` を表示する。詳細表示ではサイズと送信元のパス/URL を含める。

## 自動返信パイプライン

- `getReplyFromConfig` は `{ text?, mediaUrl?, mediaUrls? }` を返す。
- メディアが存在する場合、Web 送信側は `openclaw message send` と同じパイプラインを使ってローカルパスまたは URL を解決する。
- 複数のメディアエントリが指定された場合は順番に送信される。

## コマンドへの受信メディア (Pi)

- 受信した Web メッセージにメディアが含まれる場合、OpenClaw は一時ファイルへダウンロードし、テンプレート変数を公開する:
  - 受信メディア用の `{{MediaUrl}}` 疑似 URL。
  - コマンド実行前に書き込まれるローカル一時パス `{{MediaPath}}`。
- セッションごとの Docker サンドボックスが有効な場合、受信メディアはサンドボックスワークスペースへコピーされ、`MediaPath`/`MediaUrl` は `media/inbound/<filename>` のような相対パスに書き換えられる。
- メディア理解 (`tools.media.*` または共有 `tools.media.models` で設定されている場合) はテンプレート処理の前に実行され、`Body` に `[Image]`、`[Audio]`、`[Video]` ブロックを挿入できる。
  - 音声は `{{Transcript}}` を設定し、コマンド解析に文字起こしを使うため、スラッシュコマンドは引き続き動作する。
  - 動画と画像の説明は、コマンド解析のためにキャプションテキストを保持する。
  - 有効な主要画像モデルがすでにネイティブでビジョンに対応している場合、OpenClaw は `[Image]` 要約ブロックを省略し、代わりに元の画像をモデルへ渡す。
- デフォルトでは、最初に一致する画像/音声/動画添付のみが処理される。複数の添付を処理するには `tools.media.<cap>.attachments` を設定する。

## 制限とエラー

**送信上限 (WhatsApp web 送信)**

- 画像: 再圧縮後に `channels.whatsapp.mediaMaxMb` (デフォルト: 50 MB) まで。
- 音声/ボイス/動画: 16 MB 上限。ドキュメント: 100 MB 上限。
- サイズ超過または読み取り不能なメディア → ログに明確なエラーを出し、返信はスキップされる。

**メディア理解の上限 (文字起こし/説明)**

- 画像のデフォルト: 10 MB (`tools.media.image.maxBytes`)。
- 音声のデフォルト: 20 MB (`tools.media.audio.maxBytes`)。
- 動画のデフォルト: 50 MB (`tools.media.video.maxBytes`)。
- サイズ超過のメディアでは理解処理をスキップするが、返信は元の本文でそのまま送信される。

## テストに関する注記

- 画像/音声/ドキュメントのケースについて、送信フローと返信フローをカバーする。
- 画像の再圧縮 (サイズ上限) と音声のボイスノートフラグを検証する。
- 複数メディアの返信が順次送信として展開されることを確認する。

## 関連

- [カメラキャプチャ](/ja-JP/nodes/camera)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [音声とボイスノート](/ja-JP/nodes/audio)
