---
read_when:
    - WebChat アクセスのデバッグまたは設定
summary: チャット UI 向けのループバック WebChat 静的ホストと Gateway WS の使用方法
title: ウェブチャット
x-i18n:
    generated_at: "2026-04-30T05:41:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 16
---

Status: macOS/iOS SwiftUI チャット UI は Gateway WebSocket と直接通信します。

## 概要

- Gateway 用のネイティブチャット UI（埋め込みブラウザもローカル静的サーバーも不要）。
- 他のチャンネルと同じセッションとルーティングルールを使用します。
- 決定的ルーティング: 返信は常に WebChat に戻ります。

## クイックスタート

1. Gateway を起動します。
2. WebChat UI（macOS/iOS アプリ）または Control UI のチャットタブを開きます。
3. 有効な Gateway 認証パスが設定されていることを確認します（デフォルトは shared-secret、
   loopback 上でも同様）。

## 仕組み（動作）

- UI は Gateway WebSocket に接続し、`chat.history`、`chat.send`、`chat.inject` を使用します。
- `chat.history` は安定性のために制限されています。Gateway は長いテキストフィールドを切り詰めたり、重いメタデータを省略したり、過大なエントリを `[chat.history omitted: message too large]` に置き換えたりする場合があります。
- `chat.history` は、モダンな追記専用セッションファイルではアクティブなトランスクリプトブランチに従うため、破棄された書き換えブランチや置き換え済みのプロンプトコピーは WebChat にレンダリングされません。
- Control UI は、新しい `chat.send` 実行 id を生成する前に、同じセッション、メッセージ、添付ファイルに対する送信中の重複送信を統合します。Gateway は、同じ冪等性キーを再利用する繰り返しリクエストを引き続き重複排除します。
- `chat.history` は表示用にも正規化されます。runtime 専用の OpenClaw コンテキスト、
  受信エンベロープラッパー、`[[reply_to_*]]` や `[[audio_as_voice]]` などのインライン配信ディレクティブタグ、プレーンテキストのツール呼び出し XML
  ペイロード（`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む）、および
  漏出した ASCII/全角のモデル制御トークンは表示テキストから取り除かれ、
  表示テキスト全体が正確なサイレントトークン
  `NO_REPLY` / `no_reply` のみである assistant エントリは省略されます。
- reasoning フラグ付き返信ペイロード（`isReasoning: true`）は、WebChat の assistant コンテンツ、トランスクリプト再生テキスト、音声コンテンツブロックから除外されるため、思考のみのペイロードは表示される assistant メッセージや再生可能な音声として表面化しません。
- `chat.inject` は assistant メモをトランスクリプトに直接追加し、UI にブロードキャストします（エージェント実行はありません）。
- 中止された実行では、部分的な assistant 出力が UI に表示されたままになることがあります。
- Gateway は、バッファ済み出力がある場合、中止された部分的な assistant テキストをトランスクリプト履歴に永続化し、それらのエントリに中止メタデータを付けます。
- 履歴は常に Gateway から取得されます（ローカルファイル監視はありません）。
- Gateway に到達できない場合、WebChat は読み取り専用になります。

## Control UI エージェントツールパネル

- Control UI の `/agents` ツールパネルには 2 つの別々のビューがあります:
  - **現在利用可能** は `tools.effective(sessionKey=...)` を使用し、現在の
    セッションが runtime で実際に使用できるものを表示します。core、Plugin、チャンネル所有のツールを含みます。
  - **ツール設定** は `tools.catalog` を使用し、プロファイル、オーバーライド、
    カタログセマンティクスに焦点を合わせたままにします。
- runtime での可用性はセッションスコープです。同じエージェントでセッションを切り替えると、
  **現在利用可能** リストが変わることがあります。
- 設定エディタは runtime での可用性を意味しません。有効なアクセスは引き続きポリシーの
  優先順位（`allow`/`deny`、エージェント単位およびプロバイダー/チャンネルのオーバーライド）に従います。

## リモート利用

- リモートモードは Gateway WebSocket を SSH/Tailscale 経由でトンネルします。
- 別個の WebChat サーバーを実行する必要はありません。

## 設定リファレンス（WebChat）

完全な設定: [設定](/ja-JP/gateway/configuration)

WebChat オプション:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` レスポンス内のテキストフィールドの最大文字数。トランスクリプトエントリがこの制限を超えると、Gateway は長いテキストフィールドを切り詰め、過大なメッセージをプレースホルダーに置き換える場合があります。リクエスト単位の `maxChars` も、1 回の `chat.history` 呼び出しについてこのデフォルトを上書きするためにクライアントから送信できます。

関連するグローバルオプション:

- `gateway.port`、`gateway.bind`: WebSocket ホスト/ポート。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`:
  shared-secret WebSocket 認証。
- `gateway.auth.allowTailscale`: 有効な場合、ブラウザの Control UI チャットタブは Tailscale
  Serve ID ヘッダーを使用できます。
- `gateway.auth.mode: "trusted-proxy"`: ID を認識する **非 loopback** プロキシソースの背後にあるブラウザクライアント向けのリバースプロキシ認証（[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth) を参照）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`: リモート Gateway ターゲット。
- `session.*`: セッションストレージとメインキーのデフォルト。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [ダッシュボード](/ja-JP/web/dashboard)
