---
read_when:
    - mac WebChat ビューまたはループバックポートのデバッグ
summary: Mac アプリが Gateway WebChat を埋め込む仕組みと、そのデバッグ方法
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-05-06T09:07:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOSメニューバーアプリは、WebChat UIをネイティブのSwiftUIビューとして埋め込みます。これは
Gatewayに接続し、選択した
エージェントの**メインセッション**をデフォルトにします（他のセッション用のセッション切り替え付き）。

- **ローカルモード**: ローカルのGateway WebSocketに直接接続します。
- **リモートモード**: SSH経由でGateway制御ポートを転送し、その
  トンネルをデータプレーンとして使用します。

## 起動とデバッグ

- 手動: Lobsterメニュー → 「チャットを開く」。
- テスト用の自動オープン:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- ログ: `./scripts/clawlog.sh`（サブシステム `ai.openclaw`、カテゴリ `WebChatSwiftUI`）。

## 仕組み

- データプレーン: Gateway WSメソッド `chat.history`、`chat.send`、`chat.abort`、
  `chat.inject` と、イベント `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` は、表示用に正規化されたトランスクリプト行を返します。インライン指示
  タグは表示テキストから取り除かれ、プレーンテキストのツール呼び出しXMLペイロード
  （`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）と、
  漏出したASCII/全角のモデル制御トークンは取り除かれ、正確に `NO_REPLY` / `no_reply` のような
  純粋なサイレントトークンのアシスタント行は
  省略され、サイズが大きすぎる行はプレースホルダーに置き換えられる場合があります。
- セッション: プライマリセッション（`main`、またはスコープが
  グローバルの場合は `global`）をデフォルトにします。UIではセッションを切り替えられます。
- オンボーディングでは、初回セットアップを分離しておくために専用セッションを使用します。

## セキュリティ面

- リモートモードでは、Gateway WebSocket制御ポートのみをSSH経由で転送します。

## 既知の制限

- UIはチャットセッション向けに最適化されています（完全なブラウザーサンドボックスではありません）。

## 関連

- [WebChat](/ja-JP/web/webchat)
- [macOSアプリ](/ja-JP/platforms/macos)
