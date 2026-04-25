---
read_when:
    - Control UI で assistant の出力レンダリングを変更する
    - '`[embed ...]`、`MEDIA:`、reply、または音声プレゼンテーションディレクティブをデバッグしている'
summary: 埋め込み、メディア、音声ヒント、返信のためのリッチ出力ショートコードプロトコル
title: リッチ出力プロトコル
x-i18n:
    generated_at: "2026-04-25T18:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e01037a8cb80c9de36effd4642701dcc86131a2b8fb236d61c687845e64189
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

assistant の出力には、小さな配信/レンダリングディレクティブのセットを含めることができます。

- 添付ファイル配信のための `MEDIA:`
- 音声プレゼンテーションヒントのための `[[audio_as_voice]]`
- 返信メタデータのための `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI のリッチレンダリングのための `[embed ...]`

これらのディレクティブは別々です。`MEDIA:` と reply/voice タグは配信メタデータのままであり、`[embed ...]` は Web 専用のリッチレンダリングパスです。
信頼されたツール結果メディアは、配信前に同じ `MEDIA:` / `[[audio_as_voice]]` パーサーを使用するため、テキストのツール出力でも音声添付をボイスノートとしてマークできます。

ブロックストリーミングが有効な場合、`MEDIA:` は 1 ターンの単一配信メタデータのままです。同じメディア URL がストリームされたブロックで送信され、最終 assistant payload にも繰り返されている場合、OpenClaw は添付ファイルを 1 回だけ配信し、最終 payload から重複を削除します。

## `[embed ...]`

`[embed ...]` は、Control UI 向けの唯一のエージェント対面リッチレンダリング構文です。

自己終了の例:

```text
[embed ref="cv_123" title="Status" /]
```

ルール:

- `[view ...]` は新しい出力ではもはや有効ではありません。
- embed shortcode は assistant メッセージ画面でのみレンダリングされます。
- URL を持つ embed のみがレンダリングされます。`ref="..."` または `url="..."` を使用してください。
- ブロック形式のインライン HTML embed shortcode はレンダリングされません。
- Web UI は表示テキストから shortcode を取り除き、embed をインラインでレンダリングします。
- `MEDIA:` は embed の別名ではないため、リッチ embed レンダリングには使用しないでください。

## 保存されるレンダリング形状

正規化/保存される assistant content block は、構造化された `canvas` アイテムです。

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

- [RPC adapters](/ja-JP/reference/rpc)
- [Typebox](/ja-JP/concepts/typebox)
