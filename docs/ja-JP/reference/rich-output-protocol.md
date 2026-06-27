---
read_when:
    - Control UI でのアシスタント出力レンダリングの変更
    - '`[embed ...]`、構造化メディア、返信、または音声表示ディレクティブのデバッグ'
summary: 構造化メディア、埋め込み、音声ヒント、返信のためのリッチ出力プロトコル
title: リッチ出力プロトコル
x-i18n:
    generated_at: "2026-06-27T13:00:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Assistant 出力には、配信/レンダリング用ディレクティブの小さなセットを含められます。

- 添付ファイル配信用の構造化された `mediaUrl` / `mediaUrls` フィールド
- 音声表示ヒント用の `[[audio_as_voice]]`
- 返信メタデータ用の `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI のリッチレンダリング用の `[embed ...]`

リモートメディア添付ファイルは公開 `https:` URL である必要があります。プレーンな `http:`、
ループバック、リンクローカル、プライベート、内部ホスト名は添付ファイル
ディレクティブとして無視されます。サーバー側のメディア取得処理は、引き続き独自のネットワークガードを適用します。

ローカルメディア添付ファイルには、絶対パス、ワークスペース相対パス、または
ホーム相対の `~/` パスを使用できます。配信前に、引き続きエージェントのファイル読み取りポリシーと
メディアタイプチェックを通過します。

<Warning>
ツール、plugins、ストリーミングブロック、
ブラウザー出力、またはメッセージアクションから、添付ファイル用のテキストコマンドを出力しないでください。代わりに構造化メディアフィールドを使用してください。

有効なメッセージツールペイロード:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

従来の最終 Assistant 返信テキストは互換性のために正規化される場合がありますが、
これは汎用の plugin/tool プロトコルではありません。
</Warning>

プレーンな Markdown 画像構文は、デフォルトではテキストのままです。Markdown 画像返信をメディア添付ファイルに意図的にマッピングするチャンネルは、送信
アダプターでオプトインします。Telegram はこれを行うため、`![alt](url)` は引き続きメディア返信になれます。

これらのディレクティブは別々のものです。構造化メディアフィールドと返信/音声タグは
配信メタデータです。`[embed ...]` は Web 専用のリッチレンダリングパスです。

ブロックストリーミングが有効な場合、メディアは構造化ペイロード
フィールドで運ぶ必要があります。同じメディア URL がストリーミングされたブロックで送信され、最終 Assistant ペイロードで繰り返された場合、OpenClaw は添付ファイルを 1 回だけ配信し、
最終ペイロードから重複を削除します。

## `[embed ...]`

`[embed ...]` は、Control UI 向けの唯一のエージェント向けリッチレンダリング構文です。

自己終了形式の例:

```text
[embed ref="cv_123" title="Status" /]
```

ルール:

- `[view ...]` は新しい出力では有効ではなくなりました。
- Embed ショートコードは Assistant メッセージサーフェスでのみレンダリングされます。
- URL ベースの Embed のみがレンダリングされます。`ref="..."` または `url="..."` を使用してください。
- ブロック形式のインライン HTML Embed ショートコードはレンダリングされません。
- Web UI は表示テキストからショートコードを取り除き、Embed をインラインでレンダリングします。
- 構造化メディアは Embed のエイリアスではなく、リッチ Embed レンダリングに使用すべきではありません。

## 保存されるレンダリング形状

正規化/保存される Assistant コンテンツブロックは、構造化された `canvas` 項目です。

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

保存/レンダリングされるリッチブロックは、この `canvas` 形状を直接使用します。`present_view` は認識されません。

## 関連

- [RPC アダプター](/ja-JP/reference/rpc)
- [Typebox](/ja-JP/concepts/typebox)
