---
read_when:
    - OpenClaw のリッチな応答をレンダリングする Matrix クライアントの構築
    - com.openclaw.presentation のイベント内容をデバッグする
summary: OpenClaw 対応クライアント向けの Matrix MessagePresentation メタデータ
title: マトリックス表示メタデータ
x-i18n:
    generated_at: "2026-05-10T19:22:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw は、送信する Matrix `m.room.message` イベントに、正規化された `MessagePresentation` メタデータを `com.openclaw.presentation` の下で付加できます。

標準の Matrix クライアントは、引き続きプレーンテキストの `body` をレンダリングします。OpenClaw 対応クライアントは、構造化メタデータを読み取り、ボタン、セレクト、コンテキスト行、区切り線などのネイティブ UI をレンダリングできます。

## イベント内容

メタデータは Matrix イベント内容に保存されます。

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
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

`version` は Matrix プレゼンテーションメタデータのスキーマバージョンです。`type` は OpenClaw 対応クライアント向けの安定した判別子です。クライアントは、不明な `type` 値、安全に解釈できない不明なバージョン、不明なブロックタイプを無視する必要があります。

## フォールバック動作

OpenClaw は常に、読み取り可能なプレーンテキストフォールバックを `body` にレンダリングします。構造化メタデータは追加的なものであり、基本的な Matrix 相互運用性に必須であってはなりません。

サポートされていないクライアントは、引き続きフォールバックテキストを表示する必要があります。OpenClaw 対応クライアントは、表示には構造化メタデータを優先しつつ、コピー、検索、通知、アクセシビリティのためにフォールバックテキストを保持できます。

## サポートされるブロック

Matrix 送信アダプターは、次のサポートを通知します。

- `buttons`
- `select`
- `context`
- `divider`

クライアントは、これらのブロックをベストエフォートのプレゼンテーションヒントとして扱う必要があります。不明なフィールドや不明なブロックタイプは、メッセージ全体のレンダリング失敗を引き起こすのではなく、無視する必要があります。

## インタラクション

このメタデータは Matrix コールバックセマンティクスを追加しません。ボタンとセレクトオプションの値はフォールバックインタラクションペイロードであり、通常はスラッシュコマンドまたはテキストコマンドです。インタラクションをサポートしたい Matrix クライアントは、選択された値を通常のメッセージとしてルームに送り返すことができます。

たとえば、値が `/model deepseek/deepseek-chat` のボタンは、その値を同じルーム内の暗号化された Matrix テキストメッセージとして送信することで処理できます。

## 承認メタデータとの関係

`com.openclaw.presentation` は、一般的なリッチメッセージプレゼンテーション用です。

承認プロンプトは専用の `com.openclaw.approval` メタデータを使用します。承認には、安全性に関わる状態、判断、exec/Plugin の詳細が含まれるためです。同じイベントに両方のメタデータキーが存在する場合、クライアントは専用の承認レンダラーを優先する必要があります。

## メディアメッセージ

返信に複数のメディア URL が含まれる場合、OpenClaw はメディア URL ごとに 1 つの Matrix イベントを送信します。プレゼンテーションメタデータは最初のメディアイベントにのみ付加されるため、クライアントには安定した構造化ペイロードが 1 つだけ提供され、重複するレンダラーを避けられます。

プレゼンテーションメタデータはコンパクトに保ってください。ユーザーに表示される大きなテキストは `body` に残し、通常の Matrix テキスト分割パスを使用する必要があります。
