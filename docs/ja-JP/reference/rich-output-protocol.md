---
read_when:
    - Control UIでのassistant出力レンダリングを変更する
    - '`[embed ...]`、`MEDIA:`、reply、または音声プレゼンテーションdirectiveをデバッグする'
summary: 埋め込み、メディア、音声ヒント、返信のためのリッチ出力ショートコードプロトコル
title: リッチ出力プロトコル
x-i18n:
    generated_at: "2026-04-24T05:18:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

assistantの出力には、小さな配信/レンダリングdirectiveセットを含めることができます:

- 添付ファイル配信用の `MEDIA:`
- 音声プレゼンテーションヒント用の `[[audio_as_voice]]`
- 返信メタデータ用の `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UIのリッチレンダリング用の `[embed ...]`

これらのdirectiveは別物です。`MEDIA:` と reply/voiceタグは引き続き配信メタデータであり、`[embed ...]` はWeb専用のリッチレンダリング経路です。

## `[embed ...]`

`[embed ...]` は、Control UI向けの唯一のagent-facingリッチレンダリング構文です。

自己完結型の例:

```text
[embed ref="cv_123" title="Status" /]
```

ルール:

- `[view ...]` は、新しい出力ではもはや有効ではありません。
- Embed shortcodeはassistantメッセージサーフェス内でのみレンダリングされます。
- URLバックエンドのembedのみがレンダリングされます。`ref="..."` または `url="..."` を使ってください。
- ブロック形式のインラインHTML embed shortcodeはレンダリングされません。
- Web UIは可視テキストからshortcodeを取り除き、embedをインラインでレンダリングします。
- `MEDIA:` はembedのaliasではなく、リッチembedレンダリングには使うべきではありません。

## 保存されるレンダリング形状

正規化/保存されるassistant content blockは、構造化された `canvas` itemです:

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

保存/レンダリングされるリッチブロックは、この `canvas` 形状を直接使います。`present_view` は認識されません。

## 関連

- [RPC adapters](/ja-JP/reference/rpc)
- [Typebox](/ja-JP/concepts/typebox)
