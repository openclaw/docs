---
read_when:
    - WebChatアクセスのデバッグまたは設定
summary: ループバック WebChat の静的ホストとチャット UI 向けの Gateway WS 使用法
title: Webチャット
x-i18n:
    generated_at: "2026-05-03T05:04:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

ステータス: macOS/iOS SwiftUI チャット UI は Gateway WebSocket と直接通信します。

## 概要

- Gateway 用のネイティブチャット UI です（埋め込みブラウザーもローカル静的サーバーも使用しません）。
- 他のチャネルと同じセッションおよびルーティングルールを使用します。
- 決定的なルーティング: 返信は常に WebChat に戻ります。

## クイックスタート

1. Gateway を起動します。
2. WebChat UI（macOS/iOS アプリ）またはコントロール UI のチャットタブを開きます。
3. 有効な Gateway 認証パスが設定されていることを確認します（デフォルトは共有シークレットで、
   ループバック上でも同様です）。

## 仕組み（動作）

- UI は Gateway WebSocket に接続し、`chat.history`、`chat.send`、`chat.inject` を使用します。
- `chat.history` は安定性のために制限されます。Gateway は長いテキストフィールドを切り詰めたり、重いメタデータを省略したり、サイズが大きすぎるエントリを `[chat.history omitted: message too large]` に置き換えたりすることがあります。
- `chat.history` は、最新の追記専用セッションファイルではアクティブなトランスクリプトブランチに従うため、放棄された書き換えブランチや置き換え済みのプロンプトコピーは WebChat に表示されません。
- Compaction エントリは、明示的な圧縮済み履歴の区切りとして表示されます。この区切りは、以前のターンがチェックポイントに保持されていることを説明し、セッションのチェックポイントコントロールへリンクします。そこでは、権限が許可している場合、オペレーターがブランチを作成したり、Compaction 前のビューを復元したりできます。
- コントロール UI は `chat.history` から返された基盤の Gateway `sessionId` を記憶し、後続の `chat.send` 呼び出しに含めます。そのため、ユーザーがセッションを開始またはリセットしない限り、再接続やページ更新後も同じ保存済み会話が継続されます。
- コントロール UI は、新しい `chat.send` 実行 ID を生成する前に、同じセッション、メッセージ、添付ファイルに対する送信中の重複送信を結合します。Gateway は同じ冪等性キーを再利用する繰り返しリクエストを引き続き重複排除します。
- `chat.history` は表示用にも正規化されます。ランタイム専用の OpenClaw コンテキスト、
  受信エンベロープラッパー、`[[reply_to_*]]` や `[[audio_as_voice]]` などのインライン配信ディレクティブタグ、プレーンテキストのツール呼び出し XML
  ペイロード（`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏えいした ASCII/全角モデル制御トークンは表示テキストから削除され、
  表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` のみである assistant エントリは省略されます。
- 推論フラグ付きの返信ペイロード（`isReasoning: true`）は、WebChat の assistant コンテンツ、トランスクリプト再生テキスト、音声コンテンツブロックから除外されるため、思考専用ペイロードが表示される assistant メッセージや再生可能な音声として表面化することはありません。
- `chat.inject` は assistant ノートをトランスクリプトに直接追加し、UI にブロードキャストします（エージェント実行はありません）。
- 中止された実行では、部分的な assistant 出力が UI に表示されたままになることがあります。
- Gateway は、バッファ済み出力が存在する場合、中止された部分的な assistant テキストをトランスクリプト履歴に永続化し、それらのエントリに中止メタデータを付けます。
- 履歴は常に Gateway から取得されます（ローカルファイル監視は行いません）。
- Gateway に到達できない場合、WebChat は読み取り専用になります。

## コントロール UI エージェントツールパネル

- コントロール UI の `/agents` ツールパネルには、2 つの個別ビューがあります。
  - **現在利用可能** は `tools.effective(sessionKey=...)` を使用し、現在の
    セッションが実行時に実際に使用できるものを表示します。これにはコア、Plugin、チャネル所有のツールが含まれます。
  - **ツール設定** は `tools.catalog` を使用し、プロファイル、オーバーライド、
    カタログセマンティクスに焦点を合わせ続けます。
- ランタイム可用性はセッション単位です。同じエージェントでセッションを切り替えると、
  **現在利用可能** リストが変わることがあります。
- 設定エディターはランタイム可用性を意味しません。有効なアクセスは引き続きポリシー
  優先順位（`allow`/`deny`、エージェント単位およびプロバイダー/チャネルのオーバーライド）に従います。

## リモート利用

- リモートモードは、Gateway WebSocket を SSH/Tailscale 経由でトンネルします。
- 別個の WebChat サーバーを実行する必要はありません。

## 設定リファレンス（WebChat）

完全な設定: [設定](/ja-JP/gateway/configuration)

WebChat オプション:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` レスポンス内のテキストフィールドの最大文字数。トランスクリプトエントリがこの制限を超えると、Gateway は長いテキストフィールドを切り詰め、サイズが大きすぎるメッセージをプレースホルダーに置き換えることがあります。リクエスト単位の `maxChars` をクライアントから送信して、単一の `chat.history` 呼び出しについてこのデフォルトを上書きすることもできます。

関連するグローバルオプション:

- `gateway.port`, `gateway.bind`: WebSocket ホスト/ポート。
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  共有シークレット WebSocket 認証。
- `gateway.auth.allowTailscale`: 有効にすると、ブラウザーのコントロール UI チャットタブは Tailscale
  Serve ID ヘッダーを使用できます。
- `gateway.auth.mode: "trusted-proxy"`: ID 認識の **非ループバック** プロキシソースの背後にあるブラウザークライアント向けのリバースプロキシ認証（[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth) を参照）。
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: リモート Gateway ターゲット。
- `session.*`: セッションストレージとメインキーのデフォルト。

## 関連

- [コントロール UI](/ja-JP/web/control-ui)
- [ダッシュボード](/ja-JP/web/dashboard)
