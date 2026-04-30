---
read_when:
    - Control UI でアシスタント出力のレンダリングを変更する
    - '`[embed ...]`、`MEDIA:`、reply、または音声提示ディレクティブのデバッグ'
summary: 埋め込み、メディア、音声ヒント、返信のためのリッチ出力ショートコードプロトコル
title: リッチ出力プロトコル
x-i18n:
    generated_at: "2026-04-30T05:33:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

アシスタント出力には、小さな delivery/render ディレクティブのセットを含めることができます。

- 添付ファイル配信用の `MEDIA:`
- 音声表示ヒント用の `[[audio_as_voice]]`
- 返信メタデータ用の `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI のリッチレンダリング用の `[embed ...]`

リモート `MEDIA:` 添付ファイルは公開 `https:` URL である必要があります。プレーンな `http:`、
ループバック、リンクローカル、プライベート、内部ホスト名は添付ファイル
ディレクティブとして無視されます。サーバー側のメディア取得処理は、引き続き独自のネットワークガードを適用します。

プレーンな Markdown 画像構文は、デフォルトではテキストのままです。Markdown 画像返信を意図的に
メディア添付ファイルへマップするチャンネルは、送信
アダプターでオプトインします。Telegram はこれを行うため、`![alt](url)` は引き続きメディア返信になり得ます。

これらのディレクティブは別個のものです。`MEDIA:` と返信/音声タグは配信メタデータのままです。`[embed ...]` は Web 専用のリッチレンダリングパスです。
信頼済みツール結果のメディアは配信前に同じ `MEDIA:` / `[[audio_as_voice]]` パーサーを使うため、テキスト形式のツール出力でも音声添付ファイルをボイスメモとしてマークできます。

ブロックストリーミングが有効な場合、`MEDIA:` は 1 ターンにつき単一配信のメタデータのままです。同じメディア URL がストリーミングされたブロック内で送信され、最終
アシスタントペイロードで繰り返された場合、OpenClaw は添付ファイルを一度だけ配信し、重複を最終ペイロードから取り除きます。

## `[embed ...]`

`[embed ...]` は Control UI 向けにエージェントが扱う唯一のリッチレンダリング構文です。

自己終了形式の例:

```text
[embed ref="cv_123" title="Status" /]
```

ルール:

- `[view ...]` は新しい出力では無効です。
- Embed ショートコードはアシスタントメッセージサーフェスでのみレンダリングされます。
- URL に基づく embed のみがレンダリングされます。`ref="..."` または `url="..."` を使用してください。
- ブロック形式のインライン HTML embed ショートコードはレンダリングされません。
- Web UI は表示テキストからショートコードを取り除き、embed をインラインでレンダリングします。
- `MEDIA:` は embed のエイリアスではなく、リッチ embed レンダリングに使用すべきではありません。

## 保存されるレンダリング形式

正規化/保存されたアシスタントコンテンツブロックは、構造化された `canvas` 項目です。

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

保存/レンダリングされたリッチブロックは、この `canvas` 形状を直接使用します。`present_view` は認識されません。

## 関連情報

- [RPC アダプター](/ja-JP/reference/rpc)
- [Typebox](/ja-JP/concepts/typebox)
