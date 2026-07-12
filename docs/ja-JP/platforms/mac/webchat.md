---
read_when:
    - macOS の WebChat ビューまたはループバックポートのデバッグ
summary: macアプリがGateway WebChatを組み込む仕組みと、そのデバッグ方法
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-07-11T22:24:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS メニューバーアプリは、WebChat UI をネイティブの SwiftUI ビューとして組み込んでいます。Gateway に接続し、選択したエージェントのプライマリセッション（`main`、または `session.scope` が `global` の場合は `global`）をデフォルトで使用します。

完全なチャットウィンドウは、ネイティブの分割ビューです。

- **セッションサイドバー**: 検索可能なセッション一覧で、ピン留め済みと最近使用したセクション、未読インジケーター、ピン留め／ピン留め解除、セッションキーのコピー、削除を行うコンテキストメニューを備えています。ツールバーボタン（または Cmd-N）を使用すると、`sessions.create` によって実際の新規セッションが作成されます。
- **ウィンドウツールバー**: コンテキスト使用量リング（トークン数とセッションコスト、およびコンパクト化アクション）、思考レベル選択、モデル選択、セッション操作メニュー（新規セッション、更新、セッションキーのコピー、トランスクリプトのエクスポート、コンパクト化、履歴の消去）を備えています。
- **トランスクリプトと入力欄**: アシスタントのメッセージはアバター付きのプレーンテキストとして、ユーザーのメッセージはアクセントカラーの吹き出しとして表示されます。`/` を入力すると、`commands.list` に基づくスラッシュコマンドのオートコンプリートが開き、矢印キー／Tab／Return／Escape で操作できます。メッセージを右クリックするとコピーできます。

メニューバーから開く固定式クイックチャットパネルでは、インライン選択を備えたコンパクトな単一列レイアウトが維持されます。

- **ローカルモード**: ローカルの Gateway WebSocket に直接接続します。
- **リモートモード**: SSH 経由で Gateway の制御ポートを転送し、そのトンネルをデータプレーンとして使用します。

## 起動とデバッグ

- 手動: Lobster メニュー -> "Open Chat"。
- テスト用の自動起動:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  （`--webchat` はレガシーエイリアスとして受け付けられます。）

- ログ: `./scripts/clawlog.sh`（サブシステム `ai.openclaw`、カテゴリ `WebChatSwiftUI`）。

## 接続構成

- データプレーン: Gateway WS メソッド `chat.history`、`chat.send`、`chat.abort`、`chat.inject`、およびイベント `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` は表示用に正規化されたトランスクリプトを返します。インラインのディレクティブタグは表示テキストから除去され、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`。途中で切れたブロックを含む）と漏出したモデル制御トークンも除去されます。完全に `NO_REPLY`／`no_reply` のみであるような無応答トークンだけのアシスタント行は省略され、サイズが大きすぎる行は省略を示すプレースホルダーに置き換えられる場合があります。
- セッション: 前述のプライマリセッションをデフォルトで使用します。UI ではセッションを切り替えられます。
- オンボーディングでは、初回実行時のセットアップを分離するために専用セッションを使用します。
- オフラインキャッシュ: アプリは Gateway ごとに最近のチャットセッションとトランスクリプトの小規模な読み取り専用キャッシュ（`~/Library/Application Support/OpenClaw/chat-cache.sqlite`）を保持します。コールド起動時には最後に確認されたトランスクリプトを即座に表示し、Gateway が応答すると更新します。また、切断中も最近のチャットを閲覧できます（接続が復旧するまで送信は無効のままです）。

## セキュリティ範囲

- リモートモードでは、SSH 経由で Gateway WebSocket の制御ポートのみを転送します。

## 既知の制限事項

- UI はチャットセッション向けに最適化されており、完全なブラウザサンドボックスではありません。

## 関連項目

- [WebChat](/ja-JP/web/webchat)
- [macOS アプリ](/ja-JP/platforms/macos)
