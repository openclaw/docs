---
read_when:
    - Control UI でのアシスタント出力レンダリングの変更
    - '`[embed ...]`、構造化メディア、返信、または音声プレゼンテーションディレクティブのデバッグ'
summary: 'Rich outputプロトコル: 構造化メディア、埋め込み、音声ヒント、返信'
title: リッチ出力プロトコル
x-i18n:
    generated_at: "2026-07-05T11:48:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Assistant の出力は、いくつかの専用チャンネルを通じて配信/レンダリング指示を運びます。

- 添付ファイル配信用の構造化された `mediaUrl` / `mediaUrls` フィールド。
- 音声表示ヒント用の `[[audio_as_voice]]`。
- 返信メタデータ用の `[[reply_to_current]]` / `[[reply_to:<id>]]`。
- Control UI のリッチレンダリング用の `[embed ...]`。

構造化メディアフィールドと `[[...]]` タグは配信メタデータです。`[embed ...]` は別個の Web 専用リッチレンダリング経路であり、メディアの別名ではありません。

## メディア添付

リモート添付ファイルは公開 `https:` URL である必要があります。`http:`、ループバック、リンクローカル、プライベート、内部ホスト名は添付ファイル指示として拒否されます。サーバー側のメディア取得処理は、それに加えて独自のネットワークガードを適用します。

ローカル添付ファイルは、絶対パス、ワークスペース相対パス、またはホーム相対の `~/` パスを受け付けます。配信前には引き続き、エージェントのファイル読み取りポリシーとメディアタイプチェックを通過します。

<Warning>
ツール、Plugin、ストリーミングブロック、ブラウザー出力、メッセージアクションから添付ファイル用のテキストコマンドを出力しないでください。代わりに構造化メディアフィールドを使用します。

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

レガシーな最終返信テキストは互換性のために引き続き正規化される場合がありますが、これは一般的な Plugin/ツールプロトコルではありません。
</Warning>

プレーンな Markdown 画像構文 (`![alt](url)`) はデフォルトではテキストのままです。Markdown 画像をメディア返信として扱いたいチャンネルは、送信アダプターでオプトインします。Telegram はこれを行うため、`![alt](url)` はメディア添付になります。

ブロックストリーミングが有効な場合、メディアは構造化ペイロードフィールドに載せる必要があります。同じメディア URL がストリーミングブロック内に現れ、最終 assistant ペイロードにも再び現れた場合、OpenClaw はそれを 1 回だけ配信し、最終ペイロードから重複を取り除きます。

## `[embed ...]`

`[embed ...]` は Control UI 向けの、エージェントが使う唯一のリッチレンダリング構文です。自己終了の例:

```text
[embed ref="cv_123" title="Status" /]
```

ルール:

- `[view ...]` は新しい出力では無効です。
- Embed ショートコードは assistant メッセージサーフェスでのみレンダリングされます。
- URL に裏付けられた embed のみレンダリングされます。`ref="..."` または `url="..."` を使用してください。
- ブロック形式のインライン HTML embed ショートコードはレンダリングされません。
- Web UI は表示テキストからショートコードを取り除き、embed をインラインでレンダリングします。

## 保存されるレンダリング形状

正規化/保存された assistant コンテンツブロックは、構造化された `canvas` アイテムです。

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

`present_view` は認識されません。保存/レンダリングされるリッチブロックは常にこの `canvas` 形状を使用します。

## 関連

- [RPC アダプター](/ja-JP/reference/rpc)
- [Typebox](/ja-JP/concepts/typebox)
