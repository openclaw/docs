---
read_when:
    - mac WebChat ビューまたは loopback ポートのデバッグ
summary: MacアプリがGateway WebChatを埋め込む方法とデバッグ方法
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-07-06T10:52:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 925751d15450c816fc81b59ac89a190d88ab8b77629b635913e0862ba94af1c0
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS メニューバーアプリは、WebChat UI をネイティブ SwiftUI ビューとして埋め込みます。Gateway に接続し、選択したエージェントのプライマリセッション（`main`、または `session.scope` が `global` の場合は `global`）をデフォルトにし、他のセッション用のセッション切り替えを備えています。

- **ローカルモード**: ローカル Gateway WebSocket に直接接続します。
- **リモートモード**: Gateway 制御ポートを SSH 経由で転送し、そのトンネルをデータプレーンとして使用します。

## 起動とデバッグ

- 手動: Lobster メニュー -> 「チャットを開く」。
- テスト用の自動オープン:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  （`--webchat` はレガシーエイリアスとして受け付けられます。）

- ログ: `./scripts/clawlog.sh`（サブシステム `ai.openclaw`、カテゴリ `WebChatSwiftUI`）。

## 連携の仕組み

- データプレーン: Gateway WS メソッド `chat.history`、`chat.send`、`chat.abort`、`chat.inject`、およびイベント `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` は表示用に正規化されたトランスクリプトを返します。インラインディレクティブタグは表示テキストから取り除かれ、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`、切り詰められたブロックを含む）と漏洩したモデル制御トークンも取り除かれます。完全な `NO_REPLY`/`no_reply` などの純粋なサイレントトークンのアシスタント行は省略され、サイズが大きすぎる行は切り詰められたプレースホルダーに置き換えられる場合があります。
- セッション: 上記のとおりプライマリセッションをデフォルトにします。UI ではセッション間を切り替えられます。
- オンボーディングでは、初回セットアップを分離しておくために専用セッションを使用します。
- オフラインキャッシュ: アプリは Gateway ごとに最近のチャットセッションとトランスクリプトの小さな読み取り専用キャッシュ（`~/Library/Application Support/OpenClaw/chat-cache.sqlite`）を保持します。コールドオープン時には最後に把握していたトランスクリプトをすぐに描画し、Gateway が応答したら更新します。また、切断中でも最近のチャットを閲覧できます（送信は接続が戻るまで無効のままです）。

## セキュリティ面

- リモートモードでは、Gateway WebSocket 制御ポートのみを SSH 経由で転送します。

## 既知の制限

- UI はチャットセッション向けに最適化されており、完全なブラウザーサンドボックスではありません。

## 関連

- [WebChat](/ja-JP/web/webchat)
- [macOS アプリ](/ja-JP/platforms/macos)
