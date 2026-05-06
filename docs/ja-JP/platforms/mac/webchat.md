---
read_when:
    - mac の WebChat ビューまたはループバックポートのデバッグ
summary: macアプリがGateway WebChatを埋め込む仕組みとデバッグ方法
title: Webチャット (macOS)
x-i18n:
    generated_at: "2026-05-06T05:12:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b53eda688ff8786da4a4a615927a640090a1ecc71af8c08469c3a3c98a32af41
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS メニューバーアプリは、WebChat UI をネイティブの SwiftUI ビューとして組み込んでいます。これは Gateway に接続し、選択したエージェントの **メインセッション** をデフォルトで使用します（他のセッション用のセッション切り替え機能付き）。

- **ローカルモード**: ローカルの Gateway WebSocket に直接接続します。
- **リモートモード**: Gateway の制御ポートを SSH 経由で転送し、そのトンネルをデータプレーンとして使用します。

## 起動とデバッグ

- 手動: Lobster メニュー → 「チャットを開く」。
- テスト用に自動で開く:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- ログ: `./scripts/clawlog.sh`（サブシステム `ai.openclaw`、カテゴリ `WebChatSwiftUI`）。

## 接続の仕組み

- データプレーン: Gateway WS メソッド `chat.history`、`chat.send`、`chat.abort`、
  `chat.inject` と、イベント `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` は、表示用に正規化されたトランスクリプト行を返します。インラインディレクティブ
  タグは表示テキストから取り除かれ、プレーンテキストのツール呼び出し XML ペイロード
  （`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）と、
  漏出した ASCII/全角のモデル制御トークンは取り除かれます。正確に `NO_REPLY` / `no_reply` のような、
  サイレントトークンだけのアシスタント行は
  省略され、過大な行はプレースホルダーに置き換えられる場合があります。
- セッション: プライマリセッション（`main`、またはスコープがグローバルの場合は `global`）がデフォルトです。UI ではセッションを切り替えられます。
- オンボーディングでは、初回セットアップを分離しておくために専用セッションを使用します。

## セキュリティ面

- リモートモードでは、Gateway WebSocket 制御ポートだけを SSH 経由で転送します。

## 既知の制限事項

- UI はチャットセッション向けに最適化されています（完全なブラウザーサンドボックスではありません）。

## 関連

- [WebChat](/ja-JP/web/webchat)
- [macOS アプリ](/ja-JP/platforms/macos)
