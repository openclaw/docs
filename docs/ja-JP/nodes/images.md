---
read_when:
    - メディアパイプラインまたは添付ファイルの変更
summary: send、Gateway、エージェント返信における画像とメディアの処理ルール
title: 画像とメディアのサポート
x-i18n:
    generated_at: "2026-04-30T05:21:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb07bc638a755be5597e78c07041a52cfc0297b00d70c5adbfe5f3ad8c1a372
    source_path: nodes/images.md
    workflow: 16
---

# 画像とメディアのサポート (2025-12-05)

WhatsApp チャンネルは **Baileys Web** 経由で動作します。このドキュメントでは、送信、Gateway、エージェント返信に関する現在のメディア処理ルールをまとめます。

## 目標

- `openclaw message send --media` で任意のキャプション付きメディアを送信する。
- Web 受信箱からの自動返信で、テキストと一緒にメディアを含められるようにする。
- 種類ごとの制限を妥当で予測しやすく保つ。

## CLI サーフェス

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` は任意。メディアのみの送信ではキャプションを空にできます。
  - `--dry-run` は解決済みペイロードを出力します。`--json` は `{ channel, to, messageId, mediaUrl, caption }` を出力します。

## WhatsApp Web チャンネルの挙動

- 入力: ローカルファイルパス **または** HTTP(S) URL。
- フロー: Buffer に読み込み、メディアの種類を検出し、適切なペイロードを構築します:
  - **画像:** `channels.whatsapp.mediaMaxMb` (デフォルト: 50 MB) を目標に、JPEG へリサイズおよび再圧縮します (最大辺 2048px)。
  - **音声/ボイス/動画:** 16 MB までパススルーします。音声はボイスノート (`ptt: true`) として送信されます。
  - **ドキュメント:** その他すべて。100 MB までで、利用可能な場合はファイル名を保持します。
- WhatsApp の GIF 風再生: MP4 を `gifPlayback: true` (CLI: `--gif-playback`) で送信すると、モバイルクライアントでインラインループ再生されます。
- MIME 検出は、マジックバイト、ヘッダー、ファイル拡張子の順に優先します。
- キャプションは `--message` または `reply.text` から取得されます。空のキャプションも許可されます。
- ログ: 非 verbose では `↩️`/`✅` を表示し、verbose ではサイズとソースパス/URL も含めます。

## 自動返信パイプライン

- `getReplyFromConfig` は `{ text?, mediaUrl?, mediaUrls? }` を返します。
- メディアが存在する場合、Web 送信側は `openclaw message send` と同じパイプラインを使ってローカルパスまたは URL を解決します。
- 複数のメディアエントリが指定されている場合は、順番に送信されます。

## コマンドへの受信メディア (Pi)

- 受信した Web メッセージにメディアが含まれる場合、OpenClaw は一時ファイルへダウンロードし、テンプレート変数を公開します:
  - `{{MediaUrl}}` 受信メディア用の疑似 URL。
  - `{{MediaPath}}` コマンド実行前に書き込まれるローカル一時パス。
- セッション単位の Docker サンドボックスが有効な場合、受信メディアはサンドボックスワークスペースへコピーされ、`MediaPath`/`MediaUrl` は `media/inbound/<filename>` のような相対パスに書き換えられます。
- メディア理解 (`tools.media.*` または共有 `tools.media.models` で設定されている場合) はテンプレート処理の前に実行され、`Body` に `[Image]`、`[Audio]`、`[Video]` ブロックを挿入できます。
  - 音声は `{{Transcript}}` を設定し、スラッシュコマンドが引き続き機能するよう、コマンド解析に文字起こしを使います。
  - 動画と画像の説明は、コマンド解析のためにキャプションテキストを保持します。
  - アクティブなプライマリ画像モデルがすでにネイティブでビジョンに対応している場合、OpenClaw は `[Image]` 要約ブロックをスキップし、代わりに元の画像をモデルへ渡します。
- デフォルトでは、条件に一致する最初の画像/音声/動画添付ファイルのみが処理されます。複数の添付ファイルを処理するには `tools.media.<cap>.attachments` を設定します。

## 制限とエラー

**送信上限 (WhatsApp Web 送信)**

- 画像: 再圧縮後に `channels.whatsapp.mediaMaxMb` (デフォルト: 50 MB) まで。
- 音声/ボイス/動画: 上限 16 MB。ドキュメント: 上限 100 MB。
- サイズ超過または読み取り不能なメディア → ログに明確なエラーを出力し、返信はスキップされます。

**メディア理解の上限 (文字起こし/説明)**

- 画像のデフォルト: 10 MB (`tools.media.image.maxBytes`)。
- 音声のデフォルト: 20 MB (`tools.media.audio.maxBytes`)。
- 動画のデフォルト: 50 MB (`tools.media.video.maxBytes`)。
- サイズ超過メディアでは理解処理をスキップしますが、返信は元の本文でそのまま続行されます。

## テストに関するメモ

- 画像/音声/ドキュメントのケースについて、送信と返信のフローをカバーする。
- 画像の再圧縮 (サイズ境界) と、音声のボイスノートフラグを検証する。
- 複数メディアの返信が順次送信として展開されることを確認する。

## 関連

- [カメラキャプチャ](/ja-JP/nodes/camera)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [音声とボイスノート](/ja-JP/nodes/audio)
