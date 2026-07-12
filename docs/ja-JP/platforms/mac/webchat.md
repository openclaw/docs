---
read_when:
    - Mac の WebChat ビューまたはループバックポートのデバッグ
summary: Mac アプリが Gateway WebChat を埋め込む仕組みと、そのデバッグ方法
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-07-12T14:36:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOSメニューバーアプリは、WebChat UIをネイティブのSwiftUIビューとして組み込んでいます。Gatewayに接続し、選択したエージェントのプライマリセッション（`main`、または`session.scope`が`global`の場合は`global`）をデフォルトで使用します。

完全なチャットウィンドウは、ネイティブの分割ビューです。

- **セッションサイドバー**: ピン留め済みセクションと最近のセクション、未読インジケーター、ピン留め／ピン留め解除、セッションキーのコピー、削除を行うコンテキストメニューを備えた、検索可能なセッション一覧です。ツールバーボタン（またはCmd-N）を使用すると、`sessions.create`によって実際の新規セッションが作成されます。
- **ウィンドウツールバー**: コンテキスト使用量リング（トークン数とセッションコスト、コンパクトなアクション付き）、思考レベル選択、モデル選択、セッションアクションメニュー（新規セッション、更新、セッションキーのコピー、トランスクリプトのエクスポート、コンパクト化、履歴の消去）があります。
- **トランスクリプトとコンポーザー**: アシスタントのメッセージはアバター付きのプレーンテキストとして、ユーザーのメッセージはアクセントカラーの吹き出しとして表示されます。`/`を入力すると、`commands.list`を使用したスラッシュコマンドのオートコンプリートが開き、矢印キー／Tab／Return／Escapeで操作できます。メッセージを右クリックするとコピーできます。

メニューバーから表示するアンカー付きクイックチャットパネルでは、インライン選択を備えたコンパクトな1列レイアウトが維持されます。

- **ローカルモード**: ローカルのGateway WebSocketに直接接続します。
- **リモートモード**: Gatewayの制御ポートをSSH経由で転送し、そのトンネルをデータプレーンとして使用します。

## 起動とデバッグ

- 手動: Lobsterメニュー -> "Open Chat"。
- テスト用の自動表示:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  （`--webchat`はレガシーエイリアスとして使用できます。）

- ログ: `./scripts/clawlog.sh`（サブシステム`ai.openclaw`、カテゴリ`WebChatSwiftUI`）。

## 接続の仕組み

- データプレーン: Gateway WSメソッド`chat.history`、`chat.send`、`chat.abort`、`chat.inject`と、イベント`chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history`は、表示用に正規化されたトランスクリプトを返します。インラインのディレクティブタグは表示テキストから除去され、プレーンテキストのツール呼び出しXMLペイロード（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`。途中で切れたブロックを含む）と漏出したモデル制御トークンも除去されます。正確に`NO_REPLY`／`no_reply`のみを含む行など、サイレントトークンだけのアシスタント行は省略され、サイズが大きすぎる行は切り詰めを示すプレースホルダーに置き換えられる場合があります。
- セッション: 上記のプライマリセッションがデフォルトです。UIではセッションを切り替えられます。
- オンボーディングでは、初回セットアップを分離しておくために専用セッションを使用します。
- オフラインキャッシュ: アプリは、Gatewayごとに最近のチャットセッションとトランスクリプトの小規模な読み取り専用キャッシュ（`~/Library/Application Support/OpenClaw/chat-cache.sqlite`）を保持します。コールド起動時には最後に確認されたトランスクリプトを即座に表示し、Gatewayが応答すると更新します。また、切断中も最近のチャットを閲覧できます（接続が復旧するまで送信は無効のままです）。

## セキュリティ対象範囲

- リモートモードでは、Gateway WebSocketの制御ポートのみをSSH経由で転送します。

## 既知の制限事項

- UIはチャットセッション向けに最適化されており、完全なブラウザーサンドボックスではありません。

## 関連項目

- [WebChat](/ja-JP/web/webchat)
- [macOSアプリ](/ja-JP/platforms/macos)
