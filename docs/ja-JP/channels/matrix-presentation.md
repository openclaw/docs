---
read_when:
    - OpenClaw のリッチレスポンスをレンダリングする Matrix クライアントの構築
    - com.openclaw.presentation イベント内容のデバッグ
summary: OpenClaw 対応クライアント向けの Matrix MessagePresentation メタデータ
title: Matrix プレゼンテーションメタデータ
x-i18n:
    generated_at: "2026-07-11T22:01:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw は、正規化された `MessagePresentation` メタデータを、送信する Matrix の `m.room.message` イベントに `com.openclaw.presentation` コンテンツキーで付加します。

標準の Matrix クライアントは、引き続きプレーンテキストの `body` をレンダリングします。OpenClaw 対応クライアントは構造化メタデータを読み取り、ボタン、選択コントロール、コンテキスト行、区切り線などのネイティブ UI をレンダリングできます。

## イベントの内容

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

- `version` はメタデータスキーマのバージョンです。現在のバージョンは `1` です。`type` は安定した判別子で、常に `"message.presentation"` です。Matrix アダプターが出力するペイロードは、このバージョンと型に完全に一致するものだけです。同様にクライアントも、安全に解釈できない未知のバージョン、未知の `type` 値、未知のブロック型を無視する必要があります。
- `title` と `tone`（`info`、`success`、`warning`、`danger`、`neutral`）は任意のヒントです。
- ボタンと選択肢には、従来の文字列 `value` に加えて、型付きの `action`（`{ "type": "command", "command": "/..." }` または `{ "type": "callback", "value": "..." }`）を含められます。両方が存在する場合は `action` を優先してください。

## フォールバック動作

OpenClaw は、常に読み取り可能なプレーンテキストのフォールバックを `body` にレンダリングします。構造化メタデータは付加的なものであり、Matrix の基本的な相互運用性のために必須としてはなりません。

フォールバックのレンダリング規則：

- `title`、`text`、`context` の内容はプレーンな行としてレンダリングされます。
- `command` アクションを持つボタンは、コマンドをコピー可能な状態に保つため、``label: `/command` `` としてレンダリングされます。`callback` アクションを持つボタン、または従来の `value` のみを持つボタンは、不透明なコールバック値を非公開に保つため、ラベルだけをレンダリングします。無効なボタンも常にラベルだけをレンダリングします。URL ボタンとウェブアプリボタンは `label: URL` としてレンダリングされます。
- 選択ブロックは、プレースホルダー（または `Options:`）を見出しとして、その後にラベルだけの選択肢の行をレンダリングします。
- 区切り線だけのプレゼンテーションなど、何もレンダリングされない場合、本文は `---` にフォールバックします。

未対応のクライアントでは、引き続きフォールバックテキストが表示されます。OpenClaw 対応クライアントは、表示には構造化メタデータを優先しつつ、コピー、検索、通知、アクセシビリティのためにフォールバックを保持できます。

## 対応ブロック

Matrix 送信アダプターは、以下をネイティブ対応として提示します。

- `buttons`
- `select`
- `context`
- `divider`

`text` ブロックは、フォールバック本文を通じて常に対応されます。すべてのブロックをベストエフォートのプレゼンテーション用ヒントとして扱い、メッセージ全体を失敗させるのではなく、未知のフィールドやブロック型を無視してください。

## 操作

このメタデータは、Matrix のコールバックセマンティクスを追加するものではありません。ボタンと選択肢の値はフォールバック用の操作ペイロードであり、通常はスラッシュコマンドまたはテキストコマンドです。操作に対応する Matrix クライアントは、コントロールの値（`action.command`、次に `action.value`、最後に `value`）を解決し、通常のメッセージとしてルームに送り返します。

たとえば、値が `/model deepseek/deepseek-chat` のボタンは、同じルームでその値を暗号化された Matrix テキストメッセージとして送信することで処理できます。

## 承認メタデータとの関係

`com.openclaw.presentation` は、汎用的なリッチメッセージのプレゼンテーションに使用します。

承認プロンプトでは、安全性に関わる状態、判断、実行や Plugin の詳細を扱うため、専用の `com.openclaw.approval` メタデータを使用します。同じイベントに両方のメタデータキーが存在する場合、クライアントは専用の承認レンダラーを優先する必要があります。

## メディアメッセージ

返信に複数のメディア URL が含まれる場合、OpenClaw はメディア URL ごとに Matrix イベントを 1 件送信します。クライアントが重複したレンダラーなしで安定した構造化ペイロードを 1 つ受け取れるように、キャプションテキストとプレゼンテーションメタデータは最初のイベントにだけ付加されます。長いテキストが複数のイベントに分割される場合にも同じ規則が適用され、メタデータは最初のイベントだけに付加されます。

プレゼンテーションメタデータはコンパクトに保ってください。ユーザーに表示する長いテキストは `body` に格納し、通常の Matrix テキスト分割経路を使用する必要があります。
