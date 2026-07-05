---
read_when:
    - mac WebChat ビューまたは loopback ポートのデバッグ
summary: Mac アプリが Gateway WebChat を埋め込む仕組みと、そのデバッグ方法
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-05T11:30:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24fe8b868fa2a7e2205bd13d32332bae903d3050073ea93f798649ccbaa478f9
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS メニューバーアプリは、WebChat UI をネイティブの SwiftUI ビューとして埋め込みます。Gateway に接続し、選択されたエージェントのプライマリセッション（`main`、または `session.scope` が `global` の場合は `global`）をデフォルトにし、他のセッション用のセッション切り替えを備えています。

- **ローカルモード**: ローカル Gateway WebSocket に直接接続します。
- **リモートモード**: Gateway コントロールポートを SSH 経由で転送し、そのトンネルをデータプレーンとして使用します。

## 起動とデバッグ

- 手動: Lobster メニュー -> 「チャットを開く」。
- テスト用の自動オープン:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  （`--webchat` はレガシーエイリアスとして受け付けられます。）

- ログ: `./scripts/clawlog.sh`（サブシステム `ai.openclaw`、カテゴリ `WebChatSwiftUI`）。

## 配線の仕組み

- データプレーン: Gateway WS メソッド `chat.history`、`chat.send`、`chat.abort`、`chat.inject`、およびイベント `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` は、表示用に正規化されたトランスクリプトを返します。インラインディレクティブタグは表示テキストから削除され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`、切り詰められたブロックを含む）と漏洩したモデル制御トークンは削除され、正確な `NO_REPLY`/`no_reply` のような純粋なサイレントトークンのアシスタント行は省略され、サイズが大きすぎる行は切り詰め済みプレースホルダーに置き換えられる場合があります。
- セッション: 上記のとおりプライマリセッションをデフォルトにします。UI ではセッション間を切り替えられます。
- オンボーディングでは、初回セットアップを分離するために専用セッションを使用します。

## セキュリティサーフェス

- リモートモードでは、Gateway WebSocket コントロールポートのみを SSH 経由で転送します。

## 既知の制限

- UI はチャットセッション向けに最適化されており、完全なブラウザーサンドボックスではありません。

## 関連

- [WebChat](/ja-JP/web/webchat)
- [macOS アプリ](/ja-JP/platforms/macos)
