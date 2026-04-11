---
x-i18n:
    generated_at: "2026-04-11T15:15:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a8884fc2c304bf96d4675f0c1d1ff781d6dc1ae8c49d92ce08040c9c7709035
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# リッチ出力プロトコル

アシスタントの出力には、小規模な配信/表示ディレクティブを含めることができます。

- 添付ファイル配信用の `MEDIA:`
- 音声提示ヒント用の `[[audio_as_voice]]`
- 返信メタデータ用の `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI のリッチレンダリング用の `[embed ...]`

これらのディレクティブはそれぞれ別物です。`MEDIA:` と reply/voice タグは引き続き配信メタデータであり、`[embed ...]` は web 専用のリッチレンダーパスです。

## `[embed ...]`

`[embed ...]` は、Control UI 向けのエージェント用リッチレンダリング構文として唯一のものです。

自己終了形式の例:

```text
[embed ref="cv_123" title="Status" /]
```

ルール:

- 新しい出力では `[view ...]` はもはや有効ではありません。
- embed ショートコードは、アシスタントメッセージの表示領域でのみレンダリングされます。
- レンダリングされるのは URL を持つ embed のみです。`ref="..."` または `url="..."` を使用してください。
- ブロック形式のインライン HTML embed ショートコードはレンダリングされません。
- web UI は表示テキストからショートコードを取り除き、インラインで embed をレンダリングします。
- `MEDIA:` は embed の別名ではなく、リッチ embed レンダリングには使用できません。

## 保存されるレンダリング形状

正規化/保存されるアシスタントの content block は、構造化された `canvas` アイテムです。

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
