---
read_when:
    - メディアパイプラインまたは添付ファイルの変更
summary: 送信、Gateway、エージェント応答における画像とメディアの処理ルール
title: 画像とメディアのサポート
x-i18n:
    generated_at: "2026-07-11T22:22:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp チャネルは Baileys Web 上で動作します。このページでは、送信、Gateway、エージェントの返信におけるメディア処理ルールについて説明します。

## 目標

- `openclaw message send --media` を使用して、任意のキャプション付きでメディアを送信する。
- Web 受信トレイからの自動返信で、テキストとともにメディアを含められるようにする。
- 種類ごとの制限を妥当かつ予測可能に保つ。

## CLI インターフェース

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — メディア（画像／音声／動画／ドキュメント）を添付します。ローカルパスまたは URL を指定できます。省略可能です。メディアのみを送信する場合、キャプションは空にできます。
- `--gif-playback` — 動画メディアを GIF 再生として扱います（WhatsApp のみ）。
- `--force-document` — チャネルによる圧縮を避けるため、メディアをドキュメントとして送信します（Telegram、WhatsApp）。画像、GIF、動画に適用されます。
- `--reply-to <id>`、`--thread-id <id>`、`--pin`、`--silent` — テキストのみの送信と共通の配信／スレッドオプションです。
- `--dry-run` — 解決済みのペイロードを出力し、送信をスキップします。
- `--json` — 結果を JSON として出力します：`{ action, channel, dryRun, handledBy, messageId?, payload }`（`payload` には、メディア参照を含むチャネル固有の送信結果が格納されます）。

## WhatsApp Web チャネルの動作

- 入力：ローカルファイルパス**または** HTTP(S) URL。
- フロー：バッファーに読み込み、メディアの種類を検出してから、種類ごとに送信ペイロードを構築します。
  - **画像：** 最適化して `channels.whatsapp.mediaMaxMb`（デフォルト 50MB）未満に収めます。不透明な画像は JPEG に再圧縮されます（デフォルトの辺長候補は 2048px から始まり、サイズ制限を繰り返し超過するたびに小さくなります）。透明部分のある画像は PNG のまま保持されます。ソースがすでにサイズと辺長の制限内に収まる適切な JPEG／PNG／WebP である場合、再圧縮せず元のバイト列をそのまま保持します。アニメーション GIF は再エンコードせず、サイズのみを確認します。
  - **音声／ボイス：** すでにネイティブのボイス音声（`.ogg`／`.opus`、または `audio/ogg`／`audio/opus`）でない限り、送信前に `ffmpeg` で Opus/OGG（48kHz モノラル、64kbps、最大 20 分）へトランスコードし、ボイスノート（`ptt: true`）として送信します。
  - **動画：** 16MB までは変換せずそのまま渡します。
  - **ドキュメント：** その他すべてを最大 100MB まで扱い、利用可能な場合はファイル名を保持します。
- WhatsApp の GIF 形式再生：`gifPlayback: true`（CLI：`--gif-playback`）を指定して MP4 を送信すると、モバイルクライアントでインラインループ再生されます。
- MIME 検出では、マジックバイトによる判定、ファイル拡張子、レスポンスヘッダーの順に優先します。汎用的なコンテナとして判定された形式（`application/octet-stream`、`zip`）が、より具体的な拡張子のマッピング（たとえば XLSX と ZIP）を上書きすることはありません。
- キャプションには `--message` または `reply.text` を使用します。空のキャプションも許可されます。
- ログ：非詳細モードでは `↩️`／`✅` を表示し、詳細モードではサイズとソースのパス／URL も表示します。

<Note>
上記の音声／動画の 16MB とドキュメントの 100MB という値は、明示的なバイト上限が渡されない場合に使用される、種類別の共通メディアデフォルト値です。WhatsApp 送信では `channels.whatsapp.mediaMaxMb`（デフォルト 50MB）から明示的な上限が設定され、そのアカウントではすべての種類に一律で適用されます。
</Note>

## 自動返信パイプライン

- `getReplyFromConfig` は、`text?`、`mediaUrl?`、`mediaUrls?` などのフィールドを持つ返信ペイロード（またはペイロードの配列）を返します。
- メディアが存在する場合、Web 送信側は `openclaw message send` と同じパイプラインを使用してローカルパスまたは URL を解決します。
- 複数のメディア項目が指定されている場合は、順番に送信されます。

## 受信メディアからコマンドへの変換

- 受信した Web メッセージにメディアが含まれる場合、OpenClaw はそれを一時ファイルへダウンロードし、次のテンプレート変数を公開します。
  - `{{MediaUrl}}` — 受信メディアの疑似 URL。
  - `{{MediaPath}}` — コマンド実行前に書き込まれるローカル一時パス。
- セッション単位の Docker サンドボックスが有効な場合、受信メディアはサンドボックスのワークスペースへコピーされ、`MediaPath`／`MediaUrl` は `media/inbound/<filename>` のようなサンドボックス相対パスに書き換えられます。
- メディア理解（`tools.media.*` または共有の `tools.media.models` で設定）はテンプレート処理の前に実行され、`Body` に `[Image]`、`[Audio]`、`[Video]` ブロックを挿入できます。
  - 音声では `{{Transcript}}` を設定し、コマンド解析に文字起こしを使用するため、スラッシュコマンドも引き続き機能します。
  - 動画と画像の説明では、コマンド解析用にキャプションテキストが保持されます。
  - アクティブなプライマリモデルがすでにネイティブで画像認識をサポートしている場合、OpenClaw は `[Image]` 要約ブロックを省略し、代わりに元の画像をモデルへ渡します。
- デフォルトでは、最初に一致した画像／音声／動画の添付ファイルだけが処理されます。複数の添付ファイルを処理するには、`tools.media.<capability>.attachments` を設定します。

## 制限とエラー

**送信上限（WhatsApp Web 送信）**

- 画像：最適化後、最大 `channels.whatsapp.mediaMaxMb`（デフォルト 50MB）。
- 音声／動画：上限 16MB（共通デフォルト。WhatsApp 経由で送信する場合は `mediaMaxMb` によって上書きされます）。
- ドキュメント：上限 100MB（共通デフォルト。WhatsApp 経由で送信する場合は `mediaMaxMb` によって上書きされます）。
- サイズ超過または読み取り不能なメディアの場合、ログに明確なエラーが出力され、返信はスキップされます。

**メディア理解の上限（文字起こし／説明生成）**

- 画像のデフォルト：10MB（`tools.media.image.maxBytes`）。
- 音声のデフォルト：20MB（`tools.media.audio.maxBytes`）。
- 動画のデフォルト：50MB（`tools.media.video.maxBytes`）。
- サイズ超過のメディアでは理解処理がスキップされますが、元の本文を使用して返信は引き続き実行されます。

## テストに関する注意事項

- 画像／音声／ドキュメントについて、送信と返信のフローを網羅します。
- 画像最適化後のサイズ上限と、音声のボイスノートフラグを検証します。
- 複数メディアの返信が順次送信として展開されることを確認します。

## 関連項目

- [カメラ撮影](/ja-JP/nodes/camera)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [音声とボイスノート](/ja-JP/nodes/audio)
