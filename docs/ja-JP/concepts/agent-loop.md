---
read_when:
    - エージェントループまたはライフサイクルイベントの正確なウォークスルーが必要な場合
    - セッションのキューイング、トランスクリプトの書き込み、またはセッション書き込みロックの動作を変更している
summary: エージェントループのライフサイクル、ストリーム、待機セマンティクス
title: エージェントループ
x-i18n:
    generated_at: "2026-05-05T04:49:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

エージェントループは、エージェントの完全な「実際の」実行です。取り込み → コンテキスト組み立て → モデル推論 →
ツール実行 → ストリーミング返信 → 永続化。これは、セッション状態の整合性を保ちながら、メッセージを
アクションと最終返信に変換する権威的な経路です。

OpenClaw では、ループはセッションごとに 1 つずつ直列化された実行であり、モデルが思考し、ツールを呼び出し、出力をストリーミングするにつれて、
ライフサイクルイベントとストリームイベントを発行します。このドキュメントでは、その本物のループがエンドツーエンドでどのように配線されているかを
説明します。

## エントリポイント

- Gateway RPC: `agent` と `agent.wait`。
- CLI: `agent` コマンド。

## 仕組み（高レベル）

1. `agent` RPC はパラメータを検証し、セッション（sessionKey/sessionId）を解決し、セッションメタデータを永続化し、`{ runId, acceptedAt }` を即座に返します。
2. `agentCommand` はエージェントを実行します:
   - モデル + thinking/verbose/trace のデフォルトを解決
   - Skills スナップショットを読み込み
   - `runEmbeddedPiAgent`（pi-agent-core ランタイム）を呼び出し
   - 埋め込みループが発行しない場合、**ライフサイクル end/error** を発行
3. `runEmbeddedPiAgent`:
   - セッションごと + グローバルキューによって実行を直列化
   - モデル + 認証プロファイルを解決し、pi セッションを構築
   - pi イベントを購読し、アシスタント/ツールの差分をストリーミング
   - タイムアウトを強制 -> 超過した場合は実行を中止
   - Codex app-server ターンでは、受け付けられたターンが終端イベントの前に app-server 進行状況を生成しなくなった場合に中止
   - ペイロード + 使用量メタデータを返す
4. `subscribeEmbeddedPiSession` は pi-agent-core イベントを OpenClaw `agent` ストリームにブリッジします:
   - ツールイベント => `stream: "tool"`
   - アシスタント差分 => `stream: "assistant"`
   - ライフサイクルイベント => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` は `waitForAgentRun` を使用します:
   - `runId` の **ライフサイクル end/error** を待機
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返す

## キューイング + 並行性

- 実行はセッションキーごと（セッションレーン）に直列化され、任意でグローバルレーンも通ります。
- これによりツール/セッションの競合を防ぎ、セッション履歴の整合性を保ちます。
- メッセージングチャネルは、このレーンシステムに投入されるキューモード（collect/steer/followup）を選択できます。
  [コマンドキュー](/ja-JP/concepts/queue)を参照してください。
- トランスクリプト書き込みも、セッションファイル上のセッション書き込みロックで保護されます。このロックは
  プロセスを認識し、ファイルベースであるため、インプロセスキューを迂回する書き込み元や
  別プロセスからの書き込み元を検出できます。セッショントランスクリプトの書き込み元は、
  セッションを busy として報告する前に、最大 `session.writeLock.acquireTimeoutMs` まで待機します。
  デフォルトは `60000` ms です。
- セッション書き込みロックはデフォルトで再入不可です。1 つの論理的な書き込み元を維持しながら
  同じロックの取得をヘルパーが意図的にネストする場合は、
  `allowReentrant: true` で明示的にオプトインする必要があります。

## セッション + ワークスペースの準備

- ワークスペースが解決され作成されます。サンドボックス化された実行では、サンドボックスワークスペースルートにリダイレクトされる場合があります。
- Skills が読み込まれ（またはスナップショットから再利用され）、env とプロンプトに注入されます。
- ブートストラップ/コンテキストファイルが解決され、システムプロンプトレポートに注入されます。
- セッション書き込みロックが取得されます。ストリーミングの前に `SessionManager` が開かれ、準備されます。後続の
  トランスクリプト書き換え、Compaction、切り詰めパスは、トランスクリプトファイルを開く、または
  変更する前に同じロックを取得する必要があります。

## プロンプト組み立て + システムプロンプト

- システムプロンプトは、OpenClaw のベースプロンプト、Skills プロンプト、ブートストラップコンテキスト、実行ごとの上書きから構築されます。
- モデル固有の制限と Compaction 予約トークンが強制されます。
- モデルに見える内容については、[システムプロンプト](/ja-JP/concepts/system-prompt)を参照してください。

## フックポイント（介入できる場所）

OpenClaw には 2 つのフックシステムがあります:

- **内部フック**（Gateway フック）: コマンドとライフサイクルイベント用のイベント駆動スクリプト。
- **Plugin フック**: エージェント/ツールのライフサイクルと Gateway パイプライン内の拡張ポイント。

### 内部フック（Gateway フック）

- **`agent:bootstrap`**: システムプロンプトが確定される前に、ブートストラップファイルの構築中に実行されます。
  これを使用して、ブートストラップコンテキストファイルを追加/削除します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、その他のコマンドイベント（Hooks ドキュメントを参照）。

セットアップと例については、[Hooks](/ja-JP/automation/hooks)を参照してください。

### Plugin フック（エージェント + Gateway ライフサイクル）

これらはエージェントループまたは Gateway パイプライン内で実行されます:

- **`before_model_resolve`**: セッション前（`messages` なし）に実行され、モデル解決前に provider/model を決定的に上書きします。
- **`before_prompt_build`**: セッション読み込み後（`messages` あり）に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターンごとの動的テキストには `prependContext` を使用し、システムプロンプト空間に置くべき安定したガイダンスには system-context フィールドを使用します。
- **`before_agent_start`**: どちらのフェーズでも実行される可能性があるレガシー互換フックです。上記の明示的なフックを優先してください。
- **`before_agent_reply`**: インラインアクションの後、LLM 呼び出しの前に実行され、Plugin がターンを要求して合成返信を返す、またはターンを完全に無音化できます。
- **`agent_end`**: 完了後に最終メッセージリストと実行メタデータを検査します。
- **`before_compaction` / `after_compaction`**: Compaction サイクルを監視または注釈付けします。
- **`before_tool_call` / `after_tool_call`**: ツールのパラメータ/結果をインターセプトします。
- **`before_install`**: 組み込みスキャンの検出結果を検査し、任意で skill または Plugin のインストールをブロックします。
- **`tool_result_persist`**: OpenClaw 所有のセッショントランスクリプトに書き込まれる前に、ツール結果を同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージフック。
- **`session_start` / `session_end`**: セッションライフサイクル境界。
- **`gateway_start` / `gateway_stop`**: Gateway ライフサイクルイベント。

送信/ツールガードのフック判定ルール:

- `before_tool_call`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_install`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端であり、優先度の低いハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、以前のキャンセルを解除しません。

フック API と登録の詳細については、[Plugin フック](/ja-JP/plugins/hooks)を参照してください。

ハーネスはこれらのフックを異なる形で適応する場合があります。Codex app-server ハーネスは、文書化されたミラー済み
サーフェスの互換性契約として OpenClaw Plugin フックを維持し、
Codex ネイティブフックは別個の低レベル Codex メカニズムのままです。

## ストリーミング + 部分返信

- アシスタント差分は pi-agent-core からストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングは、`text_end` または `message_end` のどちらかで部分返信を発行できます。
- 推論ストリーミングは、別のストリームとして、またはブロック返信として発行できます。
- チャンク化とブロック返信の動作については、[ストリーミング](/ja-JP/concepts/streaming)を参照してください。

## ツール実行 + メッセージングツール

- ツール start/update/end イベントは `tool` ストリーム上で発行されます。
- ツール結果は、ログ出力/発行の前にサイズと画像ペイロードについてサニタイズされます。
- メッセージングツールによる送信は、重複するアシスタント確認を抑制するために追跡されます。

## 返信整形 + 抑制

- 最終ペイロードは以下から組み立てられます:
  - アシスタントテキスト（および任意の推論）
  - インラインツール要約（verbose + 許可されている場合）
  - モデルエラー時のアシスタントエラーテキスト
- 正確なサイレントトークン `NO_REPLY` / `no_reply` は送信
  ペイロードからフィルタリングされます。
- メッセージングツールの重複は、最終ペイロードリストから削除されます。
- レンダリング可能なペイロードが残っておらず、ツールがエラーになった場合は、フォールバックのツールエラー返信が発行されます
  （メッセージングツールがすでにユーザーに見える返信を送信している場合を除く）。

## Compaction + リトライ

- 自動 Compaction は `compaction` ストリームイベントを発行し、リトライをトリガーできます。
- リトライ時には、重複出力を避けるためにインメモリバッファとツール要約がリセットされます。
- Compaction パイプラインについては、[Compaction](/ja-JP/concepts/compaction)を参照してください。

## イベントストリーム（現在）

- `lifecycle`: `subscribeEmbeddedPiSession` によって発行されます（`agentCommand` によるフォールバックとしても発行）
- `assistant`: pi-agent-core からのストリーミング差分
- `tool`: pi-agent-core からのストリーミングツールイベント

## チャットチャネル処理

- アシスタント差分はチャット `delta` メッセージにバッファリングされます。
- **ライフサイクル end/error** でチャット `final` が発行されます。

## タイムアウト

- `agent.wait` デフォルト: 30 秒（待機のみ）。`timeoutMs` パラメータで上書きします。
- エージェントランタイム: `agents.defaults.timeoutSeconds` のデフォルトは 172800 秒（48 時間）。`runEmbeddedPiAgent` の中止タイマーで強制されます。
- Cron ランタイム: 分離されたエージェントターンの `timeoutSeconds` は cron が所有します。スケジューラーは実行開始時にそのタイマーを開始し、設定された期限で基盤となる実行を中止し、その後、古い子セッションがレーンを詰まらせ続けないように、タイムアウトを記録する前に有界クリーンアップを実行します。
- セッション生存診断: 診断が有効な場合、`diagnostics.stuckSessionWarnMs` は、観測された返信、ツール、ステータス、ブロック、ACP 進行状況がない長時間の `processing` セッションを分類します。アクティブな埋め込み実行、モデル呼び出し、ツール呼び出しは `session.long_running` として報告されます。最近の進行状況がないアクティブ作業は `session.stalled` として報告されます。`session.stuck` はアクティブな作業がない古いセッション簿記用に予約されています。古いセッション簿記は影響を受けたセッションレーンを即座に解放します。停止した埋め込み実行は `diagnostics.stuckSessionAbortMs`（デフォルト: 少なくとも 10 分、かつ警告しきい値の 5 倍）の後にのみ abort-drain されるため、単に遅いだけの実行を打ち切ることなく、キューされた作業を再開できます。復旧は構造化された requested/completed の結果を発行し、同じ processing 世代がまだ現在のものである場合にのみ、診断状態は idle としてマークされます。繰り返される `session.stuck` 診断は、セッションが変更されない間はバックオフします。
- モデルアイドルタイムアウト: OpenClaw は、アイドルウィンドウの前に応答チャンクが到着しない場合、モデルリクエストを中止します。`models.providers.<id>.timeoutSeconds` は、遅いローカル/セルフホスト provider 用にこのアイドルウォッチドッグを延長します。それ以外の場合、OpenClaw は設定されていれば `agents.defaults.timeoutSeconds` を使用し、デフォルトで 120 秒を上限とします。明示的なモデルまたはエージェントタイムアウトがない Cron トリガー実行では、アイドルウォッチドッグを無効にし、Cron の外側タイムアウトに依存します。
- provider HTTP リクエストタイムアウト: `models.providers.<id>.timeoutSeconds` は、その provider のモデル HTTP fetch に適用されます。これには接続、ヘッダー、ボディ、SDK リクエストタイムアウト、全体の guarded-fetch 中止処理、モデルストリームアイドルウォッチドッグが含まれます。エージェントランタイム全体のタイムアウトを引き上げる前に、Ollama などの遅いローカル/セルフホスト provider にはこれを使用してください。

## 早期終了が起こり得る場所

- エージェントタイムアウト（中止）
- AbortSignal（キャンセル）
- Gateway 切断または RPC タイムアウト
- `agent.wait` タイムアウト（待機のみ、エージェントは停止しない）

## 関連

- [ツール](/ja-JP/tools) — 利用可能なエージェントツール
- [Hooks](/ja-JP/automation/hooks) — エージェントライフサイクルイベントによってトリガーされるイベント駆動スクリプト
- [Compaction](/ja-JP/concepts/compaction) — 長い会話を要約する方法
- [Exec 承認](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Thinking](/ja-JP/tools/thinking) — thinking/reasoning レベル設定
