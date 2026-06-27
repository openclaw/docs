---
read_when:
    - メディアパイプラインまたは添付ファイルの変更
summary: 送信、Gateway、エージェント返信のための画像とメディア処理ルール
title: 画像とメディアのサポート
x-i18n:
    generated_at: "2026-06-27T11:53:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeee181cae2798b7d0f5dbe0331c6b09612755b4d796d98baaeaf6989955def5
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp チャンネルは **Baileys Web** 経由で動作します。このドキュメントでは、送信、Gateway、エージェント返信に関する現在のメディア処理ルールをまとめます。

## 目標

- `openclaw message send --media` で任意のキャプション付きメディアを送信する。
- Web 受信箱からの自動返信で、テキストと一緒にメディアを含められるようにする。
- 種類ごとの制限を妥当で予測可能に保つ。

## CLI サーフェス

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` は任意。メディアのみの送信ではキャプションを空にできます。
  - `--dry-run` は解決済みペイロードを出力します。`--json` は `{ channel, to, messageId, mediaUrl, caption }` を出力します。

## WhatsApp Web チャンネルの動作

- 入力: ローカルファイルパス **または** HTTP(S) URL。
- フロー: Buffer に読み込み、メディア種別を検出し、正しいペイロードを構築します。
  - **画像:** JPEG にリサイズおよび再圧縮し（最大辺 2048px）、`channels.whatsapp.mediaMaxMb`（デフォルト: 50 MB）を目標にします。
  - **音声/ボイス/動画:** 16 MB までパススルーします。音声はボイスノート（`ptt: true`）として送信されます。
  - **ドキュメント:** その他すべて。100 MB まで。利用可能な場合はファイル名を保持します。
- WhatsApp の GIF 風再生: モバイルクライアントでインラインループされるように、`gifPlayback: true`（CLI: `--gif-playback`）付きで MP4 を送信します。
- MIME 検出はマジックバイト、ヘッダー、ファイル拡張子の順に優先します。
- キャプションは `--message` または `reply.text` から取得します。空のキャプションも許可されます。
- ログ: 非 verbose では `↩️`/`✅` を表示します。verbose ではサイズとソースパス/URL を含めます。

## 自動返信パイプライン

- `getReplyFromConfig` は `{ text?, mediaUrl?, mediaUrls? }` を返します。
- メディアが存在する場合、Web 送信側は `openclaw message send` と同じパイプラインを使用してローカルパスまたは URL を解決します。
- 複数のメディア項目が指定された場合は、順番に送信されます。

## 受信メディアからコマンドへ

- 受信した Web メッセージにメディアが含まれる場合、OpenClaw は一時ファイルにダウンロードし、テンプレート変数を公開します。
  - 受信メディア用の `{{MediaUrl}}` 疑似 URL。
  - コマンド実行前に書き込まれるローカル一時パス `{{MediaPath}}`。
- セッションごとの Docker サンドボックスが有効な場合、受信メディアはサンドボックスワークスペースにコピーされ、`MediaPath`/`MediaUrl` は `media/inbound/<filename>` のような相対パスに書き換えられます。
- メディア理解（`tools.media.*` または共有の `tools.media.models` で設定されている場合）はテンプレート処理の前に実行され、`Body` に `[Image]`、`[Audio]`、`[Video]` ブロックを挿入できます。
  - 音声は `{{Transcript}}` を設定し、コマンド解析に文字起こしを使用するため、スラッシュコマンドは引き続き動作します。
  - 動画と画像の説明は、コマンド解析用にキャプションテキストを保持します。
  - 有効なプライマリ画像モデルがすでにネイティブでビジョンをサポートしている場合、OpenClaw は `[Image]` 要約ブロックをスキップし、代わりに元の画像をモデルに渡します。
- デフォルトでは、最初に一致した画像/音声/動画添付ファイルのみが処理されます。複数の添付ファイルを処理するには、`tools.media.<cap>.attachments` を設定します。

## 制限とエラー

**送信上限（WhatsApp Web 送信）**

- 画像: 再圧縮後に `channels.whatsapp.mediaMaxMb`（デフォルト: 50 MB）まで。
- 音声/ボイス/動画: 16 MB 上限。ドキュメント: 100 MB 上限。
- 大きすぎる、または読み取れないメディア → ログに明確なエラーを出力し、返信はスキップされます。

**メディア理解の上限（文字起こし/説明）**

- 画像のデフォルト: 10 MB（`tools.media.image.maxBytes`）。
- 音声のデフォルト: 20 MB（`tools.media.audio.maxBytes`）。
- 動画のデフォルト: 50 MB（`tools.media.video.maxBytes`）。
- 大きすぎるメディアは理解処理をスキップしますが、返信は元の本文のまま続行されます。

## テストに関するメモ

- 画像/音声/ドキュメントの場合について、送信フローと返信フローをカバーする。
- 画像の再圧縮（サイズ上限）と音声のボイスノートフラグを検証する。
- 複数メディアの返信が順次送信として展開されることを確認する。

## 関連

- [カメラキャプチャ](/ja-JP/nodes/camera)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [音声とボイスノート](/ja-JP/nodes/audio)
