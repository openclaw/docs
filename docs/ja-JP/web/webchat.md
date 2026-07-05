---
read_when:
    - WebChat アクセスのデバッグまたは設定
summary: チャット UI 向けの Loopback WebChat 静的ホストと Gateway WS の使用方法
title: Webチャット
x-i18n:
    generated_at: "2026-07-05T11:59:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d01c8e4f6962a836e9c7337bcb9ce03b90cace69e079a2c84c38108afe7c017
    source_path: web/webchat.md
    workflow: 16
---

Status: macOS/iOS SwiftUI チャット UI は Gateway WebSocket と直接通信します。埋め込みブラウザーも、ローカル静的サーバーもありません。

## 概要

- Gateway 用のネイティブチャット UI。
- 他のチャネルと同じセッションおよびルーティングルールを使用します。
- 決定的ルーティング: 返信は常に WebChat に戻ります。
- 履歴は常に Gateway から取得されます（ローカルファイル監視はありません）。Gateway に到達できない場合、WebChat は読み取り専用になります。

## クイックスタート

1. Gateway を起動します。
2. WebChat UI（macOS/iOS アプリ）または Control UI のチャットタブを開きます。
3. 有効な Gateway 認証パスが構成されていることを確認します（デフォルトは shared-secret。loopback 上でも同様です）。

## 仕組み

- UI は Gateway WebSocket に接続し、`chat.history`、`chat.send`、`chat.inject`、`chat.message.get` RPC メソッドを使用します。
- `chat.history` は安定性のために上限があります。Gateway は長いテキストフィールドを切り詰め、重いメタデータを省略し、サイズ超過のエントリを `[chat.history omitted: message too large]` に置き換える場合があります。API クライアントはリクエストごとの `maxChars` を送信して、1 回の呼び出しについてデフォルト上限を上書きできます。
- 表示可能なアシスタントメッセージが `chat.history` で切り詰められた場合、Control UI はサイドリーダーを開き、デフォルトの履歴ペイロードを増やさずに、`chat.message.get` を通じて表示正規化済みの完全なエントリをオンデマンドで取得できます。`chat.message.get` は `chat.history` と同じトランスクリプトブランチと表示ルールを使用しますが、`messageId` で 1 つのエントリを対象にし、完全なコンテンツを返せなくなっている場合は正直な利用不可理由を返します。
- `chat.history` は追記専用セッションファイルのアクティブなトランスクリプトブランチに従うため、破棄された書き換えブランチや置き換え済みのプロンプトコピーは WebChat にレンダリングされません。
- Compaction エントリは「圧縮済み履歴」の区切りとしてレンダリングされ、圧縮済みトランスクリプトがチェックポイントとして保持されていることを説明し、権限で許可されている場合はセッションチェックポイントを開く（ブランチまたは復元）アクションを提供します。
- Control UI は `chat.history` が返した背後の Gateway `sessionId` を記憶し、後続の `chat.send` 呼び出しに含めます。そのため、ユーザーがセッションを開始またはリセットしない限り、再接続やページ更新後も同じ保存済み会話が継続されます。
- `chat.send` は冪等性キーを取ります（Control UI は run id を使用します）。Gateway は同じキーを再利用する繰り返しリクエストを重複排除するため、同じセッション/メッセージ/添付ファイルに対する再試行または重複した実行中の送信が 2 つ目の run を作成することはありません。
- ワークスペース起動ファイルと保留中の `BOOTSTRAP.md` 指示は、WebChat のユーザーメッセージにコピーされるのではなく、エージェントシステムプロンプトの `# Project Context` セクションを通じて提供されます。bootstrap コンテンツが切り詰められた場合、システムプロンプトには短い「Bootstrap Context Notice」が代わりに入ります。詳細な件数や構成ノブは診断サーフェスに残ります。
- `chat.history` の表示正規化では、実行時専用の OpenClaw コンテキスト、受信エンベロープラッパー、`[[reply_to_current]]`、`[[reply_to:<id>]]`、`[[audio_as_voice]]` などのインライン配信ディレクティブタグ、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`。切り詰められたブロックを含む）、漏えいした ASCII/全角のモデル制御トークンが除去されます。表示テキスト全体がサイレントトークン `NO_REPLY` のみであるアシスタントエントリ（大文字小文字を区別しない）は省略されます。
- reasoning フラグ付き返信ペイロード（`isReasoning: true`）は WebChat のアシスタントコンテンツ、トランスクリプト再生テキスト、音声コンテンツブロックから除外されるため、思考専用ペイロードが表示可能なアシスタントメッセージや再生可能な音声として表面化することはありません。
- `chat.inject` はアシスタントノートをトランスクリプトに直接追記し、UI にブロードキャストします（エージェント run はありません）。
- 中止された run では、部分的なアシスタント出力が UI に表示されたままになる場合があります。Gateway はバッファ済み出力が存在する場合、その部分テキストをトランスクリプト履歴に永続化し、中止メタデータでエントリをマークします。

### トランスクリプトと配信モデル

WebChat には 2 つの別々のデータパスがあります。

- セッション JSONL ファイルは、永続的なモデル/ランタイムトランスクリプトです。通常のエージェント run では、埋め込み OpenClaw ランタイムがセッションマネージャーを通じて、モデルに見える `user`、`assistant`、`toolResult` メッセージを永続化します。WebChat は任意の配信、ステータス、ヘルパーテキストをそのトランスクリプトに書き込みません。
- Gateway `ReplyPayload` イベントはライブ配信プロジェクションです。WebChat/チャネル表示、ブロックストリーミング、ディレクティブタグ、メディア埋め込み、TTS/音声フラグ、UI フォールバック動作向けに正規化されます。それ自体は正規のセッションログではありません。
- `tools.message` を通じて表示可能な返信を必要とするハーネスは、引き続き WebChat を現在の run の内部ソース返信シンクとして使用します。そのアクティブな WebChat run からのターゲットなし `message.send` は同じチャットに投影され、セッショントランスクリプトにミラーされます。WebChat は再利用可能な送信チャネルにはならず、`lastChannel` を継承することもありません。
- WebChat がアシスタントトランスクリプトエントリを注入するのは、Gateway が通常の埋め込みエージェントターン外で表示済みメッセージを所有する場合のみです。`chat.inject`、非エージェントコマンド返信、中止された部分出力、WebChat 管理のメディアトランスクリプト補足が該当します。
- run 中にライブのアシスタントテキストが表示されたのに履歴再読み込み後に消える場合は、順に確認してください。生の JSONL にアシスタントテキストが含まれるか、`chat.history` 表示プロジェクションがそれを除去したか、Control UI の楽観的 tail マージがローカル配信状態を永続化済みスナップショットで置き換えたかです。

通常のエージェント run の最終回答は、埋め込みランタイムがアシスタント `message_end` を書き込むため、永続的であるべきです。配信済みの最終ペイロードをトランスクリプトにミラーするフォールバックは、まず埋め込みランタイムがすでに書き込んだアシスタントターンを重複させないようにする必要があります。

## Control UI エージェントツールパネル

- Control UI `/agents` Tools パネルには `tools.effective(sessionKey=...)` に支えられた「現在利用可能」ビューがあります。これは現在のセッションのツールインベントリについて、サーバーから派生した読み取り専用プロジェクションで、コア、Plugin、チャネル所有、すでに検出済みの MCP サーバーツールを含みます。
- 別個の構成編集ビュー（`tools.catalog` に支えられます）が、プロファイル、エージェントごとの上書き、カタログセマンティクスを扱います。
- ランタイム可用性はセッションスコープです。同じエージェントでセッションを切り替えると、「現在利用可能」リストが変わる場合があります。構成済みの MCP サーバーが前回の検出以降に接続または変更されていない場合、パネルは読み取りパスから MCP トランスポートを暗黙的に開始するのではなく、通知を表示します。
- 構成エディターはランタイム可用性を意味しません。有効なアクセスは引き続きポリシー優先順位（`allow`/`deny`、エージェントごとおよびプロバイダー/チャネルの上書き）に従います。

## リモート使用

- リモートモードは Gateway WebSocket を SSH/Tailscale 経由でトンネルします。
- 別個の WebChat サーバーを実行する必要はありません。

## 構成リファレンス（WebChat）

完全な構成: [構成](/ja-JP/gateway/configuration)

WebChat には永続化された構成セクションはありません。Gateway は組み込みの `chat.history` 表示上限を使用します。API クライアントはリクエストごとの `maxChars` を送信して、1 回の呼び出しについてそれを上書きできます。レガシーの `channels.webchat` および `gateway.webchat` 構成は廃止されています。削除するには `openclaw doctor --fix` を実行してください。

関連するグローバルオプション:

- `gateway.port`, `gateway.bind`: WebSocket のホスト/ポート。
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket 認証。
- `gateway.auth.allowTailscale`: 有効な場合、ブラウザーの Control UI チャットタブは Tailscale
  Serve identity ヘッダーを使用できます。
- `gateway.auth.mode: "trusted-proxy"`: identity-aware な **非 loopback** プロキシソースの背後にあるブラウザークライアント向けのリバースプロキシ認証（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: リモート Gateway ターゲット。
- `session.*`: セッションストレージとメインキーのデフォルト。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [Dashboard](/ja-JP/web/dashboard)
