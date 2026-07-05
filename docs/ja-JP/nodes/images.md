---
read_when:
    - メディアパイプラインまたは添付ファイルの変更
summary: 送信、Gateway、エージェント返信における画像とメディアの取り扱いルール
title: 画像とメディアのサポート
x-i18n:
    generated_at: "2026-07-05T11:33:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp チャンネルは Baileys Web 上で動作します。このページでは、送信、Gateway、エージェント返信におけるメディア処理ルールを説明します。

## 目標

- `openclaw message send --media` で任意のキャプション付きメディアを送信する。
- Web 受信箱からの自動返信で、テキストと一緒にメディアを含められるようにする。
- 種類ごとの制限を妥当で予測可能に保つ。

## CLI サーフェス

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — メディア（画像/音声/動画/ドキュメント）を添付します。ローカルパスまたは URL を受け付けます。省略可能です。メディアのみの送信ではキャプションを空にできます。
- `--gif-playback` — 動画メディアを GIF 再生として扱います（WhatsApp のみ）。
- `--force-document` — チャンネルの圧縮を避けるため、メディアをドキュメントとして送信します（Telegram、WhatsApp）。画像、GIF、動画に適用されます。
- `--reply-to <id>`、`--thread-id <id>`、`--pin`、`--silent` — テキストのみの送信と共有される配信/スレッド化オプションです。
- `--dry-run` — 解決されたペイロードを出力し、送信をスキップします。
- `--json` — 結果を JSON として出力します: `{ action, channel, dryRun, handledBy, messageId?, payload }`（`payload` には、メディア参照を含むチャンネル固有の送信結果が入ります）。

## WhatsApp Web チャンネルの動作

- 入力: ローカルファイルパス**または** HTTP(S) URL。
- フロー: バッファに読み込み、メディア種別を検出してから、種別ごとに送信用ペイロードを構築します。
  - **画像:** `channels.whatsapp.mediaMaxMb`（デフォルト 50MB）未満に収まるよう最適化されます。不透明な画像は JPEG に再圧縮されます（デフォルトの辺長ラダーは 2048px から始まり、サイズ超過が続くと段階的に下げます）。透明部分のある画像は PNG のまま維持されます。ソースがすでにサイズと辺長の上限内で許容される JPEG/PNG/WebP である場合は、再圧縮せず元のバイト列を変更せずに保持します。アニメーション GIF は再エンコードせず、サイズ確認のみ行います。
  - **音声/ボイス:** すでにネイティブのボイス音声（`.ogg`/`.opus`、または `audio/ogg`/`audio/opus`）でない限り、送信音声は送信前に `ffmpeg` で Opus/OGG（48kHz モノラル、64kbps、20 分上限）へトランスコードされ、ボイスメモ（`ptt: true`）として送信されます。
  - **動画:** 16MB までパススルーします。
  - **ドキュメント:** その他はすべて 100MB までで、利用可能な場合はファイル名を保持します。
- WhatsApp の GIF 風再生: モバイルクライアントでインラインループさせるため、`gifPlayback: true`（CLI: `--gif-playback`）付きの MP4 を送信します。
- MIME 検出では、スニッフィングしたマジックバイト、ファイル拡張子、レスポンスヘッダーの順に優先します。汎用的にスニッフィングされたコンテナ（`application/octet-stream`、`zip`）が、より具体的な拡張子マッピング（例: XLSX と ZIP）を上書きすることはありません。
- キャプションは `--message` または `reply.text` から取得します。空のキャプションも許可されます。
- ログ: 非 verbose では `↩️`/`✅` を表示します。verbose ではサイズとソースのパス/URL を含めます。

<Note>
上記の 16MB の音声/動画と 100MB のドキュメントの数値は、明示的なバイト上限が渡されない場合に使われる、種類ごとの共有メディアデフォルトです。WhatsApp 送信では `channels.whatsapp.mediaMaxMb`（デフォルト 50MB）から明示的な上限を設定し、そのアカウントでは種類を問わず一律に適用されます。
</Note>

## 自動返信パイプライン

- `getReplyFromConfig` は、`text?`、`mediaUrl?`、`mediaUrls?` などのフィールドを持つ返信ペイロード（またはペイロードの配列）を返します。
- メディアが存在する場合、Web 送信側は `openclaw message send` と同じパイプラインを使用してローカルパスまたは URL を解決します。
- 複数のメディアエントリが指定されている場合は、順番に送信されます。

## 受信メディアからコマンドへ

- 受信 Web メッセージにメディアが含まれる場合、OpenClaw はそれを一時ファイルにダウンロードし、テンプレート変数を公開します。
  - `{{MediaUrl}}` — 受信メディア用の疑似 URL。
  - `{{MediaPath}}` — コマンド実行前に書き込まれるローカル一時パス。
- セッションごとの Docker サンドボックスが有効な場合、受信メディアはサンドボックスワークスペースにコピーされ、`MediaPath`/`MediaUrl` は `media/inbound/<filename>` のようなサンドボックス相対パスに書き換えられます。
- メディア理解（`tools.media.*` または共有 `tools.media.models` で設定）はテンプレート処理の前に実行され、`Body` に `[Image]`、`[Audio]`、`[Video]` ブロックを挿入できます。
  - 音声は `{{Transcript}}` を設定し、スラッシュコマンドが引き続き動作するよう、コマンド解析に文字起こしを使用します。
  - 動画と画像の説明は、コマンド解析用にキャプションテキストがある場合は保持します。
  - アクティブなプライマリモデルがすでにネイティブでビジョンに対応している場合、OpenClaw は `[Image]` 要約ブロックをスキップし、代わりに元の画像をモデルに渡します。
- デフォルトでは、最初に一致した画像/音声/動画添付のみ処理されます。複数の添付を処理するには `tools.media.<capability>.attachments` を設定します。

## 制限とエラー

**送信上限（WhatsApp Web 送信）**

- 画像: 最適化後に `channels.whatsapp.mediaMaxMb`（デフォルト 50MB）まで。
- 音声/動画: 16MB 上限（共有デフォルト。WhatsApp 経由で送信する場合は `mediaMaxMb` により上書きされます）。
- ドキュメント: 100MB 上限（共有デフォルト。WhatsApp 経由で送信する場合は `mediaMaxMb` により上書きされます）。
- サイズ超過または読み取り不能なメディアはログに明確なエラーを出し、その返信はスキップされます。

**メディア理解の上限（文字起こし/説明）**

- 画像のデフォルト: 10MB（`tools.media.image.maxBytes`）。
- 音声のデフォルト: 20MB（`tools.media.audio.maxBytes`）。
- 動画のデフォルト: 50MB（`tools.media.video.maxBytes`）。
- サイズ超過のメディアでは理解処理をスキップしますが、返信は元の本文で引き続き送信されます。

## テストに関するメモ

- 画像/音声/ドキュメントのケースについて、送信フローと返信フローをカバーします。
- 画像最適化後のサイズ境界と、音声のボイスメモフラグを検証します。
- 複数メディアの返信が順次送信として展開されることを確認します。

## 関連

- [カメラキャプチャ](/ja-JP/nodes/camera)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [音声とボイスメモ](/ja-JP/nodes/audio)
