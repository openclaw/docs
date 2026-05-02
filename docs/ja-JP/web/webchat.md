---
read_when:
    - WebChat へのアクセスのデバッグまたは設定
summary: Loopback WebChat の静的ホストとチャット UI 用の Gateway WS の使用方法
title: Webチャット
x-i18n:
    generated_at: "2026-05-02T21:10:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

Status: macOS/iOS SwiftUI チャット UI は Gateway WebSocket と直接通信します。

## 概要

- Gateway 用のネイティブチャット UI です（埋め込みブラウザーもローカル静的サーバーも使用しません）。
- 他のチャンネルと同じセッションおよびルーティングルールを使用します。
- 決定的ルーティング: 返信は常に WebChat に戻ります。

## クイックスタート

1. Gateway を起動します。
2. WebChat UI（macOS/iOS アプリ）または Control UI のチャットタブを開きます。
3. 有効な Gateway 認証パスが設定されていることを確認します（デフォルトは共有シークレットで、
   loopback 上でも同様です）。

## 仕組み（動作）

- UI は Gateway WebSocket に接続し、`chat.history`、`chat.send`、`chat.inject` を使用します。
- `chat.history` は安定性のために制限されます。Gateway は長いテキストフィールドを切り詰め、重いメタデータを省略し、サイズが大きすぎるエントリを `[chat.history omitted: message too large]` に置き換える場合があります。
- `chat.history` は、現代的な追記専用セッションファイルではアクティブなトランスクリプトブランチに従うため、放棄された書き換えブランチや置き換え済みのプロンプトコピーは WebChat に表示されません。
- Control UI は `chat.history` から返された基盤 Gateway の `sessionId` を記憶し、後続の `chat.send` 呼び出しに含めます。そのため、ユーザーがセッションを開始またはリセットしない限り、再接続やページ更新後も同じ保存済み会話が継続されます。
- Control UI は、新しい `chat.send` 実行 ID を生成する前に、同じセッション、メッセージ、添付ファイルに対する処理中の重複送信をまとめます。Gateway は同じ冪等性キーを再利用する反復リクエストも引き続き重複排除します。
- `chat.history` は表示用にも正規化されます。ランタイム専用の OpenClaw コンテキスト、
  受信エンベロープラッパー、`[[reply_to_*]]` や `[[audio_as_voice]]` などのインライン配信ディレクティブタグ、プレーンテキストのツール呼び出し XML
  ペイロード（`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、ならびに
  漏えいした ASCII/全角モデル制御トークンは表示テキストから削除され、
  表示テキスト全体が厳密なサイレントトークン `NO_REPLY` / `no_reply` だけである assistant エントリは省略されます。
- 推論フラグ付きの返信ペイロード（`isReasoning: true`）は、WebChat assistant コンテンツ、トランスクリプト再生テキスト、音声コンテンツブロックから除外されるため、思考専用ペイロードが表示可能な assistant メッセージや再生可能な音声として表面化することはありません。
- `chat.inject` は assistant ノートをトランスクリプトに直接追加し、UI にブロードキャストします（エージェント実行はありません）。
- 中断された実行では、部分的な assistant 出力が UI に表示されたままになる場合があります。
- Gateway はバッファ済み出力が存在する場合、中断された部分的な assistant テキストをトランスクリプト履歴に永続化し、それらのエントリに中断メタデータを付けます。
- 履歴は常に Gateway から取得されます（ローカルファイル監視はありません）。
- Gateway に到達できない場合、WebChat は読み取り専用になります。

## Control UI エージェントツールパネル

- Control UI の `/agents` ツールパネルには 2 つの別々のビューがあります。
  - **現在利用可能** は `tools.effective(sessionKey=...)` を使用し、現在の
    セッションがランタイムで実際に使用できるものを表示します。これには core、Plugin、チャンネル所有のツールが含まれます。
  - **ツール構成** は `tools.catalog` を使用し、プロファイル、オーバーライド、
    カタログセマンティクスに焦点を当てます。
- ランタイム可用性はセッションスコープです。同じエージェントでセッションを切り替えると、
  **現在利用可能** リストが変わる場合があります。
- 構成エディターはランタイム可用性を意味しません。有効なアクセス権は引き続きポリシーの
  優先順位（`allow`/`deny`、エージェントごとおよびプロバイダー/チャンネルのオーバーライド）に従います。

## リモート使用

- リモートモードでは、Gateway WebSocket を SSH/Tailscale 経由でトンネルします。
- 別の WebChat サーバーを実行する必要はありません。

## 構成リファレンス（WebChat）

完全な構成: [構成](/ja-JP/gateway/configuration)

WebChat オプション:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` レスポンス内のテキストフィールドの最大文字数。トランスクリプトエントリがこの上限を超えた場合、Gateway は長いテキストフィールドを切り詰め、サイズが大きすぎるメッセージをプレースホルダーに置き換える場合があります。クライアントはリクエスト単位の `maxChars` を送信して、単一の `chat.history` 呼び出しについてこのデフォルトを上書きすることもできます。

関連するグローバルオプション:

- `gateway.port`、`gateway.bind`: WebSocket ホスト/ポート。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`:
  共有シークレット WebSocket 認証。
- `gateway.auth.allowTailscale`: 有効な場合、ブラウザーの Control UI チャットタブは Tailscale
  Serve ID ヘッダーを使用できます。
- `gateway.auth.mode: "trusted-proxy"`: ID 対応の **非 loopback** プロキシソース背後にあるブラウザークライアント向けのリバースプロキシ認証（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`: リモート Gateway ターゲット。
- `session.*`: セッションストレージとメインキーのデフォルト。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [Dashboard](/ja-JP/web/dashboard)
