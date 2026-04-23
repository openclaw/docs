---
read_when:
    - Control UI で assistant 出力のレンダリングを変更する
    - '`[embed ...]`、`MEDIA:`、reply、または audio 表示ディレクティブのデバッグ'
summary: 埋め込み、メディア、音声ヒント、および返信のためのリッチ出力 shortcode プロトコル
title: リッチ出力プロトコル
x-i18n:
    generated_at: "2026-04-23T14:09:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# リッチ出力プロトコル

assistant の出力には、小さな配信/レンダリング用ディレクティブのセットを含めることができます:

- 添付ファイル配信用の `MEDIA:`
- 音声表示ヒント用の `[[audio_as_voice]]`
- 返信メタデータ用の `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI のリッチレンダリング用の `[embed ...]`

これらのディレクティブは別物です。`MEDIA:` と reply/voice タグは引き続き配信メタデータであり、`[embed ...]` は Web 専用のリッチレンダリング経路です。

## `[embed ...]`

`[embed ...]` は、Control UI 用のエージェント向けリッチレンダリング構文として唯一のものです。

自己終了形式の例:

```text
[embed ref="cv_123" title="Status" /]
```

ルール:

- `[view ...]` は新しい出力ではもはや有効ではありません。
- embed shortcode は assistant メッセージ画面でのみレンダリングされます。
- URL バックの embed のみがレンダリングされます。`ref="..."` または `url="..."` を使用してください。
- ブロック形式のインライン HTML embed shortcode はレンダリングされません。
- Web UI は表示テキストから shortcode を取り除き、embed をインラインでレンダリングします。
- `MEDIA:` は embed の alias ではなく、リッチ embed レンダリングに使うべきではありません。

## 保存されるレンダリング形式

正規化/保存される assistant content block は、構造化された `canvas` アイテムです:

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

保存/レンダリングされるリッチ block は、この `canvas` 形式を直接使用します。`present_view` は認識されません。
