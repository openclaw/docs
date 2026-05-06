---
read_when:
    - メディアパイプラインまたは添付ファイルの変更
summary: send、Gateway、エージェントの返信における画像とメディアの処理ルール
title: 画像とメディアのサポート
x-i18n:
    generated_at: "2026-05-06T17:58:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 069140a3ad3bade166d4576ead604b4675006a01e546672872379ce83291471c
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp チャネルは **Baileys Web** 経由で動作します。このドキュメントでは、送信、Gateway、エージェント返信に関する現在のメディア処理ルールをまとめます。

## 目標

- `openclaw message send --media` で任意のキャプション付きメディアを送信する。
- Web 受信箱からの自動返信で、テキストと一緒にメディアを含められるようにする。
- 種類ごとの制限を妥当かつ予測しやすい状態に保つ。

## CLI サーフェス

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` は任意。メディアのみの送信ではキャプションを空にできます。
  - `--dry-run` は解決済みペイロードを出力します。`--json` は `{ channel, to, messageId, mediaUrl, caption }` を出力します。

## WhatsApp Web チャネルの動作

- 入力: ローカルファイルパス **または** HTTP(S) URL。
- フロー: Buffer に読み込み、メディア種別を検出し、正しいペイロードを構築します。
  - **画像:** `channels.whatsapp.mediaMaxMb`（デフォルト: 50 MB）を目標に、JPEG へリサイズおよび再圧縮します（最大辺 2048px）。
  - **音声/ボイス/動画:** 16 MB までパススルーします。音声はボイスメモ（`ptt: true`）として送信されます。
  - **ドキュメント:** その他すべて。100 MB まで。利用可能な場合はファイル名を保持します。
- WhatsApp の GIF 風再生: `gifPlayback: true`（CLI: `--gif-playback`）付きの MP4 を送信し、モバイルクライアントでインラインループ再生させます。
- MIME 検出は、マジックバイト、ヘッダー、ファイル拡張子の順に優先します。
- キャプションは `--message` または `reply.text` から取得します。空のキャプションも許可されます。
- ログ: 非 verbose では `↩️`/`✅` を表示します。verbose ではサイズと送信元パス/URL も含めます。

## 自動返信パイプライン

- `getReplyFromConfig` は `{ text?, mediaUrl?, mediaUrls? }` を返します。
- メディアが存在する場合、Web 送信側は `openclaw message send` と同じパイプラインを使ってローカルパスまたは URL を解決します。
- 複数のメディア項目が指定された場合は、順番に送信されます。

## コマンドへの受信メディア（Pi）

- 受信 Web メッセージにメディアが含まれる場合、OpenClaw は一時ファイルへダウンロードし、テンプレート変数を公開します。
  - 受信メディア用の擬似 URL `{{MediaUrl}}`。
  - コマンド実行前に書き込まれるローカル一時パス `{{MediaPath}}`。
- セッション単位の Docker サンドボックスが有効な場合、受信メディアはサンドボックスのワークスペースへコピーされ、`MediaPath`/`MediaUrl` は `media/inbound/<filename>` のような相対パスへ書き換えられます。
- メディア理解（`tools.media.*` または共有の `tools.media.models` で設定されている場合）はテンプレート処理の前に実行され、`[Image]`、`[Audio]`、`[Video]` ブロックを `Body` に挿入できます。
  - 音声は `{{Transcript}}` を設定し、コマンド解析に文字起こしを使用するため、スラッシュコマンドは引き続き動作します。
  - 動画と画像の説明は、コマンド解析用にキャプションテキストを保持します。
  - 有効なプライマリ画像モデルがすでにネイティブでビジョンに対応している場合、OpenClaw は `[Image]` 要約ブロックを省略し、代わりに元の画像をモデルへ渡します。
- デフォルトでは、最初に一致した画像/音声/動画添付ファイルのみが処理されます。複数の添付ファイルを処理するには、`tools.media.<cap>.attachments` を設定します。

## 制限とエラー

**送信上限（WhatsApp Web 送信）**

- 画像: 再圧縮後、`channels.whatsapp.mediaMaxMb`（デフォルト: 50 MB）まで。
- 音声/ボイス/動画: 16 MB 上限。ドキュメント: 100 MB 上限。
- サイズ超過または読み取り不能なメディア → ログに明確なエラーを出し、返信はスキップされます。

**メディア理解の上限（文字起こし/説明）**

- 画像のデフォルト: 10 MB（`tools.media.image.maxBytes`）。
- 音声のデフォルト: 20 MB（`tools.media.audio.maxBytes`）。
- 動画のデフォルト: 50 MB（`tools.media.video.maxBytes`）。
- サイズ超過のメディアは理解処理をスキップしますが、返信は元の本文で引き続き送信されます。

## テストに関するメモ

- 画像/音声/ドキュメントのケースについて、送信フローと返信フローをカバーする。
- 画像の再圧縮（サイズ上限）と音声のボイスメモフラグを検証する。
- 複数メディア返信が順番に送信されることを確認する。

## 関連

- [カメラキャプチャ](/ja-JP/nodes/camera)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [音声とボイスメモ](/ja-JP/nodes/audio)
