---
read_when:
    - エージェントが Web チャット内にインタラクティブな結果を表示するようにしたい場合
    - show_widget の入力、セキュリティ、または保持に関する契約が必要です
sidebarTitle: Show widget
summary: Web チャット内に自己完結型の SVG または HTML ウィジェットをインライン表示する
title: ウィジェットを表示
x-i18n:
    generated_at: "2026-07-12T14:53:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` は、自己完結型の SVG または HTML フラグメントを Control UI のチャットトランスクリプト内にインラインでレンダリングします。バンドルされた Canvas Plugin がこのツールを所有し、各結果を同一オリジンの Canvas ドキュメントとしてホストします。

このツールは、呼び出し元の Gateway クライアントが `inline-widgets` 機能を宣言している場合にのみ使用できます。Control UI はこの機能を自動的に宣言します。Telegram や WhatsApp などのチャンネル実行では `show_widget` を使用できません。

機能情報は、組み込み、Codex app-server、および CLI ベースのモデルバックエンドへ伝達されます。付与ベースで認証された MCP 呼び出し元と、直接 HTTP でツールを呼び出す呼び出し元は、クライアント機能を宣言しないため、引き続きフェイルクローズになります。

## ツールを使用する

エージェントは、必須の文字列を 2 つ指定します。

<ParamField path="title" type="string" required>
  インラインプレビューおよびホストされたドキュメントのタイトルに表示される短いタイトル。
</ParamField>

<ParamField path="widget_code" type="string" required>
  自己完結型の SVG または HTML フラグメント。前後の空白を除去した後の入力が `<svg` で始まる場合は SVG モードでレンダリングされ、それ以外のすべての入力は HTML フラグメントとして扱われます。最大長: 262,144 文字。
</ParamField>

ツールの結果には Canvas プレビューハンドルが含まれるため、Web チャットはツール呼び出しからウィジェットを直接レンダリングし、履歴の再読み込み後にも復元します。プレビューをレンダリングしないトランスクリプトにも、ホストされた Canvas パスは表示されます。

## セキュリティとストレージ

ウィジェットドキュメントには制限の厳しい Content Security Policy が適用されます。インラインのスタイルとスクリプトは許可され、画像では `data:` URL を使用できますが、外部フェッチとリソースの読み込みはブロックされます。すべてのマークアップ、スタイル、スクリプト、画像データを `widget_code` 内に含めてください。

Control UI のグローバル埋め込みモードが `trusted` の場合でも、iframe では常に `allow-same-origin` が省略されるため、ウィジェットのスクリプトは親アプリケーションのオリジンを読み取れません。また、Canvas ホストは `Content-Security-Policy: sandbox allow-scripts` レスポンスヘッダーを付けてウィジェットドキュメントを配信するため、ホストされた URL を直接開いた場合でも、ウィジェットは Control UI のオリジンではなく不透明なオリジンで実行されます。ブラウザーのサンドボックス化では、スクリプトが自身の iframe をナビゲートすることまでは防げません。その分離されたフレーム内で実行しても問題のないウィジェットコードのみをレンダリングしてください。

iframe は [`gateway.controlUi.embedSandbox`](/ja-JP/web/control-ui#hosted-embeds) にも従います。デフォルトの `scripts` ティアでは、オリジンの分離を維持しながらインタラクティブなウィジェットをサポートします。

Canvas が保持するウィジェットは、セッションごとに最大 32 個です。セッションを利用できない場合は、エージェントごとに最大 32 個です。さらにウィジェットを作成すると、そのスコープ内で最も古いドキュメントが削除されます。

## 関連項目

- [Control UI のホスト型埋め込み](/ja-JP/web/control-ui#hosted-embeds)
- [Canvas Plugin](/ja-JP/plugins/reference/canvas)
- [Gateway プロトコルのクライアント機能](/ja-JP/gateway/protocol#client-capabilities)
