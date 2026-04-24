---
read_when:
    - WebChat アクセスをデバッグする、または設定する場合
summary: チャット UI 向けの local loopback WebChat 静的ホストと Gateway WS の使い方
title: WebChat
x-i18n:
    generated_at: "2026-04-24T05:28:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

ステータス: macOS/iOS SwiftUI チャット UI は、Gateway WebSocket と直接通信します。

## これは何か

- gateway 用のネイティブチャット UI（埋め込みブラウザーやローカル静的サーバーなし）。
- 他のチャネルと同じセッションおよびルーティングルールを使います。
- 決定的ルーティング: 返信は常に WebChat に戻ります。

## クイックスタート

1. gateway を起動する。
2. WebChat UI（macOS/iOS app）または Control UI の chat タブを開く。
3. 有効な gateway auth パスが設定されていることを確認する（loopback 上でも、デフォルトでは shared-secret）。

## 仕組み（動作）

- UI は Gateway WebSocket に接続し、`chat.history`、`chat.send`、`chat.inject` を使います。
- `chat.history` は安定性のために制限されています: Gateway は長いテキストフィールドを切り詰めたり、重いメタデータを省略したり、サイズ超過のエントリーを `[chat.history omitted: message too large]` に置き換えたりすることがあります。
- `chat.history` は表示用にも正規化されます: `[[reply_to_*]]` や `[[audio_as_voice]]` のようなインライン配信 directive タグ、プレーンテキストの tool-call XML ペイロード
  （`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`、および切り詰められた tool-call ブロックを含む）、および
  漏れた ASCII/全角の model control token は可視テキストから取り除かれ、可視テキスト全体が正確な silent
  token `NO_REPLY` / `no_reply` だけである assistant エントリーは省略されます。
- `chat.inject` は assistant note を transcript に直接追加し、それを UI にブロードキャストします（agent 実行なし）。
- 中断された実行では、部分的な assistant 出力が UI に表示されたままになることがあります。
- Gateway は、バッファされた出力が存在する場合、中断された部分 assistant テキストを transcript 履歴に永続化し、それらのエントリーに abort メタデータを付けます。
- 履歴は常に gateway から取得されます（ローカルファイル監視なし）。
- gateway に到達できない場合、WebChat は読み取り専用です。

## Control UI agents tools パネル

- Control UI の `/agents` Tools パネルには 2 つの別々のビューがあります:
  - **Available Right Now** は `tools.effective(sessionKey=...)` を使い、現在の
    セッションがランタイムで実際に使えるものを表示します。core、plugin、channel 所有 tools を含みます。
  - **Tool Configuration** は `tools.catalog` を使い、profiles、overrides、および
    catalog セマンティクスに焦点を保ちます。
- ランタイム可用性はセッションスコープです。同じ agent 上でセッションを切り替えると、
  **Available Right Now** リストが変わることがあります。
- config editor はランタイム可用性を意味しません。実効アクセスは引き続きポリシー
  優先順位（`allow`/`deny`、エージェントごと、および provider/channel ごとの overrides）に従います。

## リモート利用

- リモートモードでは、gateway WebSocket を SSH/Tailscale 経由でトンネルします。
- 別の WebChat サーバーを実行する必要はありません。

## Config リファレンス（WebChat）

完全な設定: [Configuration](/ja-JP/gateway/configuration)

WebChat オプション:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` 応答内のテキストフィールドの最大文字数。transcript エントリーがこの制限を超えると、Gateway は長いテキストフィールドを切り詰め、サイズ超過メッセージをプレースホルダーに置き換えることがあります。クライアントは、このデフォルトを単一の `chat.history` 呼び出しに対して上書きするために、リクエストごとの `maxChars` を送ることもできます。

関連するグローバルオプション:

- `gateway.port`, `gateway.bind`: WebSocket host/port。
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket auth。
- `gateway.auth.allowTailscale`: ブラウザー Control UI の chat タブは、有効時に Tailscale
  Serve の identity header を使えます。
- `gateway.auth.mode: "trusted-proxy"`: identity-aware な **non-loopback** proxy ソースの背後にあるブラウザークライアント向けの reverse-proxy auth（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: リモート gateway target。
- `session.*`: セッション保存と main key のデフォルト。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [Dashboard](/ja-JP/web/dashboard)
