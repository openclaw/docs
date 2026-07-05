---
read_when:
    - OpenClaw のリッチレスポンスをレンダリングする Matrix クライアントの構築
    - com.openclaw.presentation イベント内容のデバッグ
summary: OpenClaw 対応クライアント向けの Matrix MessagePresentation メタデータ
title: Matrix プレゼンテーションメタデータ
x-i18n:
    generated_at: "2026-07-05T11:03:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw は、送信される Matrix `m.room.message` イベントの `com.openclaw.presentation` コンテンツキーに、正規化された `MessagePresentation` メタデータを付加します。

標準の Matrix クライアントはプレーンテキストの `body` をレンダリングし続けます。OpenClaw 対応クライアントは構造化メタデータを読み取り、ボタン、セレクト、コンテキスト行、区切り線などのネイティブ UI をレンダリングできます。

## イベント内容

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

- `version` はメタデータスキーマのバージョンです。現在のバージョンは `1` です。`type` は安定した判別子で、常に `"message.presentation"` です。Matrix アダプターは、このバージョンと型に完全一致するペイロードのみを出力します。クライアントも同様に、安全に解釈できない未知のバージョン、未知の `type` 値、未知のブロック型を無視するべきです。
- `title` と `tone`（`info`、`success`、`warning`、`danger`、`neutral`）は任意のヒントです。
- ボタンとセレクトオプションは、従来の文字列 `value` と並行して、型付きの `action`（`{ "type": "command", "command": "/..." }` または `{ "type": "callback", "value": "..." }`）を持てます。両方が存在する場合は `action` を優先してください。

## フォールバック動作

OpenClaw は常に、読み取り可能なプレーンテキストのフォールバックを `body` にレンダリングします。構造化メタデータは追加的なものであり、基本的な Matrix 相互運用性のために必須にしてはいけません。

フォールバックのレンダリングルール:

- `title`、`text`、`context` の内容はプレーンな行としてレンダリングされます。
- `command` アクションを持つボタンは ``label: `/command` `` としてレンダリングされ、コマンドをコピー可能なままにします。`callback` アクションを持つボタン、または従来の `value` のみを持つボタンは、不透明なコールバック値を非公開のままにするためラベルのみでレンダリングされます。無効なボタンは常にラベルのみです。URL ボタンと Web アプリボタンは `label: URL` としてレンダリングされます。
- セレクトブロックは、プレースホルダー（または `Options:`）を見出しとしてレンダリングし、その後にラベルのみのオプション行をレンダリングします。
- 何もレンダリングされない場合、たとえば区切り線のみのプレゼンテーションでは、本文は `---` にフォールバックします。

非対応クライアントはフォールバックテキストを表示し続けます。OpenClaw 対応クライアントは、表示には構造化メタデータを優先しつつ、コピー、検索、通知、アクセシビリティのためにフォールバックを保持できます。

## サポートされるブロック

Matrix 送信アダプターは、次のネイティブサポートを宣言します。

- `buttons`
- `select`
- `context`
- `divider`

`text` ブロックは、フォールバック本文を通じて常にサポートされます。すべてのブロックをベストエフォートのプレゼンテーションヒントとして扱ってください。メッセージ全体を失敗させるのではなく、未知のフィールドやブロック型は無視してください。

## インタラクション

このメタデータは Matrix のコールバックセマンティクスを追加しません。ボタンとセレクトの値はフォールバック用のインタラクションペイロードであり、通常はスラッシュコマンドまたはテキストコマンドです。インタラクションをサポートしたい Matrix クライアントは、コントロール値（`action.command`、次に `action.value`、次に `value`）を解決し、それを通常のメッセージとしてルームに送り返します。

たとえば、値 `/model deepseek/deepseek-chat` を持つボタンは、同じルーム内でその値を暗号化された Matrix テキストメッセージとして送信することで処理できます。

## 承認メタデータとの関係

`com.openclaw.presentation` は、一般的なリッチメッセージプレゼンテーションのためのものです。

承認プロンプトでは専用の `com.openclaw.approval` メタデータを使用します。承認には、安全性に関わる状態、判断、exec/Plugin の詳細が含まれるためです。同じイベントに両方のメタデータキーが存在する場合、クライアントは専用の承認レンダラーを優先するべきです。

## メディアメッセージ

返信に複数のメディア URL が含まれる場合、OpenClaw はメディア URL ごとに 1 つの Matrix イベントを送信します。キャプションテキストとプレゼンテーションメタデータは最初のイベントにのみ付加されるため、クライアントは重複したレンダラーなしで安定した 1 つの構造化ペイロードを取得できます。長いテキストが複数のイベントに分割される場合も同じルールが適用されます。メタデータは最初のイベントにのみ載ります。

プレゼンテーションメタデータはコンパクトに保ってください。ユーザーに表示される大きなテキストは `body` に残し、通常の Matrix テキスト分割経路を使用するべきです。
