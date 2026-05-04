---
read_when:
    - WebChat アクセスのデバッグまたは設定
summary: チャット UI 向けの Loopback WebChat 静的ホストと Gateway WS の使用方法
title: ウェブチャット
x-i18n:
    generated_at: "2026-05-04T05:03:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

ステータス: macOS/iOS SwiftUI チャット UI は Gateway WebSocket と直接通信します。

## 概要

- Gateway 用のネイティブチャット UI（埋め込みブラウザもローカル静的サーバーも不要）。
- 他のチャンネルと同じセッションおよびルーティングルールを使用します。
- 決定的なルーティング: 返信は常に WebChat に戻ります。

## クイックスタート

1. Gateway を起動します。
2. WebChat UI（macOS/iOS アプリ）または Control UI のチャットタブを開きます。
3. 有効な Gateway 認証パスが構成されていることを確認します（デフォルトは shared-secret、
   loopback 上でも同様です）。

## 仕組み（動作）

- UI は Gateway WebSocket に接続し、`chat.history`、`chat.send`、`chat.inject` を使用します。
- `chat.history` は安定性のために制限されます。Gateway は長いテキストフィールドを切り詰め、重いメタデータを省略し、サイズが大きすぎるエントリを `[chat.history omitted: message too large]` に置き換える場合があります。
- `chat.history` は、モダンな追記専用セッションファイルではアクティブなトランスクリプトブランチに従うため、破棄された書き換えブランチや置き換え済みのプロンプトコピーは WebChat に表示されません。
- Compaction エントリは、明示的な圧縮済み履歴の区切りとして表示されます。この区切りは、以前のターンがチェックポイントに保持されていることを説明し、Sessions のチェックポイントコントロールへリンクします。権限が許可する場合、オペレーターはそこでブランチ作成や Compaction 前のビューの復元を行えます。
- Control UI は `chat.history` が返す裏側の Gateway `sessionId` を記憶し、後続の `chat.send` 呼び出しに含めます。そのため、ユーザーがセッションを開始またはリセットしない限り、再接続やページ更新後も同じ保存済み会話が継続されます。
- Control UI は、新しい `chat.send` 実行 ID を生成する前に、同じセッション、メッセージ、添付ファイルに対する処理中の重複送信を結合します。Gateway は、同じ冪等性キーを再利用する繰り返しリクエストも引き続き重複排除します。
- ワークスペース起動ファイルと保留中の `BOOTSTRAP.md` 指示は、WebChat のユーザーメッセージにコピーされるのではなく、エージェントシステムプロンプトの Project Context を通じて供給されます。Bootstrap の切り詰めでは、簡潔なシステムプロンプト回復通知のみが追加されます。詳細な件数や設定ノブは診断サーフェスに残ります。
- `chat.history` は表示向けにも正規化されます。ランタイム専用の OpenClaw コンテキスト、
  受信エンベロープラッパー、`[[reply_to_*]]` や `[[audio_as_voice]]` などのインライン配信ディレクティブタグ、プレーンテキストのツール呼び出し XML
  ペイロード（`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、ならびに
  漏出した ASCII/全角のモデル制御トークンは表示テキストから取り除かれ、
  表示テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` のみであるアシスタントエントリは省略されます。
- 推論フラグ付きの返信ペイロード（`isReasoning: true`）は、WebChat のアシスタントコンテンツ、トランスクリプト再生テキスト、音声コンテンツブロックから除外されます。そのため、思考専用ペイロードが表示可能なアシスタントメッセージや再生可能な音声として表面化することはありません。
- `chat.inject` は、アシスタントメモをトランスクリプトへ直接追加し、UI にブロードキャストします（エージェント実行なし）。
- 中止された実行では、部分的なアシスタント出力が UI に表示されたままになる場合があります。
- Gateway は、バッファ済み出力が存在する場合、中止された部分的なアシスタントテキストをトランスクリプト履歴に永続化し、それらのエントリに中止メタデータを付与します。
- 履歴は常に Gateway から取得されます（ローカルファイル監視はありません）。
- Gateway に到達できない場合、WebChat は読み取り専用になります。

### トランスクリプトと配信モデル

WebChat には 2 つの独立したデータパスがあります。

- セッション JSONL ファイルは、永続的なモデル/ランタイムトランスクリプトです。通常のエージェント実行では、Pi がセッションマネージャーを通じて、モデルから見える `user`、`assistant`、`toolResult` メッセージを永続化します。WebChat は任意の配信、ステータス、ヘルパーテキストをそのトランスクリプトに書き込みません。
- Gateway の `ReplyPayload` イベントはライブ配信プロジェクションです。これらは WebChat/チャンネル表示、ブロックストリーミング、ディレクティブタグ、メディア埋め込み、TTS/音声フラグ、UI フォールバック動作向けに正規化される場合があります。これら自体は正規のセッションログではありません。
- WebChat は、Gateway が通常の Pi アシスタントターン外の表示メッセージを所有する場合にのみ、アシスタントトランスクリプトエントリを注入します。対象は `chat.inject`、非エージェントコマンドの返信、中止された部分出力、WebChat 管理のメディアトランスクリプト補足です。
- `chat.history` は保存済みセッショントランスクリプトを読み取り、WebChat 表示プロジェクションを適用します。実行中にライブのアシスタントテキストが表示されるが履歴の再読み込み後に消える場合は、まず生の JSONL にアシスタントテキストが含まれているかを確認し、次に `chat.history` プロジェクションがそれを取り除いたかを確認し、その次に Control UI の楽観的テールマージがローカル配信状態を永続化済みスナップショットで置き換えたかを確認します。

通常のエージェント実行の最終回答は、Pi がアシスタントの `message_end` を書き込むため、永続的であるべきです。配信済みの最終ペイロードをトランスクリプトにミラーするフォールバックは、Pi がすでに書き込んだアシスタントターンの重複をまず避ける必要があります。

## Control UI エージェントツールパネル

- Control UI の `/agents` ツールパネルには、2 つの独立したビューがあります。
  - **今すぐ利用可能** は `tools.effective(sessionKey=...)` を使用し、現在の
    セッションがランタイムで実際に使用できるものを表示します。core、plugin、チャンネル所有のツールが含まれます。
  - **ツール設定** は `tools.catalog` を使用し、プロファイル、上書き、カタログセマンティクスに集中します。
- ランタイム可用性はセッションスコープです。同じエージェントでセッションを切り替えると、
  **今すぐ利用可能** リストが変わる場合があります。
- 設定エディターはランタイム可用性を意味しません。有効なアクセスは引き続きポリシーの優先順位
  （`allow`/`deny`、エージェント単位およびプロバイダー/チャンネルの上書き）に従います。

## リモート利用

- リモートモードは、Gateway WebSocket を SSH/Tailscale 経由でトンネルします。
- 別個の WebChat サーバーを実行する必要はありません。

## 設定リファレンス（WebChat）

完全な設定: [設定](/ja-JP/gateway/configuration)

WebChat オプション:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` 応答内のテキストフィールドの最大文字数。トランスクリプトエントリがこの制限を超えると、Gateway は長いテキストフィールドを切り詰め、サイズが大きすぎるメッセージをプレースホルダーに置き換える場合があります。クライアントはリクエスト単位の `maxChars` を送信して、単一の `chat.history` 呼び出しに対してこのデフォルトを上書きすることもできます。

関連するグローバルオプション:

- `gateway.port`, `gateway.bind`: WebSocket ホスト/ポート。
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket 認証。
- `gateway.auth.allowTailscale`: 有効な場合、ブラウザの Control UI チャットタブは Tailscale
  Serve ID ヘッダーを使用できます。
- `gateway.auth.mode: "trusted-proxy"`: ID 対応の **非 loopback** プロキシソース背後にあるブラウザクライアント向けのリバースプロキシ認証（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: リモート Gateway ターゲット。
- `session.*`: セッションストレージとメインキーのデフォルト。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [Dashboard](/ja-JP/web/dashboard)
