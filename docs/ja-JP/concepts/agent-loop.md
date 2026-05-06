---
read_when:
    - エージェントループまたはライフサイクルイベントの正確なウォークスルーが必要な場合
    - セッションのキューイング、トランスクリプトの書き込み、またはセッションの書き込みロック動作を変更している
summary: エージェントループのライフサイクル、ストリーム、待機セマンティクス
title: エージェントループ
x-i18n:
    generated_at: "2026-05-06T04:59:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

エージェント的ループは、エージェントの完全な「実際の」実行です。受け付け → コンテキスト組み立て → モデル推論 →
ツール実行 → ストリーミング返信 → 永続化。これは、セッション状態の一貫性を保ちながら、メッセージを
アクションと最終返信に変換する権威あるパスです。

OpenClaw では、ループはセッションごとに 1 つの直列化された実行であり、モデルが思考し、ツールを呼び出し、
出力をストリーミングする間にライフサイクルイベントとストリームイベントを発行します。このドキュメントでは、その本物のループが
エンドツーエンドでどのように配線されているかを説明します。

## エントリポイント

- Gateway RPC: `agent` と `agent.wait`。
- CLI: `agent` コマンド。

## 仕組み（概要）

1. `agent` RPC はパラメーターを検証し、セッション（sessionKey/sessionId）を解決し、セッションメタデータを永続化し、すぐに `{ runId, acceptedAt }` を返します。
2. `agentCommand` がエージェントを実行します。
   - モデル + thinking/verbose/trace のデフォルトを解決します
   - Skills スナップショットを読み込みます
   - `runEmbeddedPiAgent`（pi-agent-core ランタイム）を呼び出します
   - 埋め込みループが発行しない場合に **lifecycle end/error** を発行します
3. `runEmbeddedPiAgent`:
   - セッションごと + グローバルキューで実行を直列化します
   - モデル + 認証プロファイルを解決し、Pi セッションを構築します
   - Pi イベントを購読し、アシスタント/ツールのデルタをストリーミングします
   - タイムアウトを適用します -> 超過した場合は実行を中止します
   - Codex app-server ターンでは、受理済みのターンが終端イベントの前に app-server 進捗を生成しなくなった場合に中止します
   - ペイロード + 使用量メタデータを返します
4. `subscribeEmbeddedPiSession` は pi-agent-core イベントを OpenClaw `agent` ストリームに橋渡しします。
   - ツールイベント => `stream: "tool"`
   - アシスタントデルタ => `stream: "assistant"`
   - ライフサイクルイベント => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` は `waitForAgentRun` を使用します。
   - `runId` の **lifecycle end/error** を待機します
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返します

## キューイング + 並行実行

- 実行はセッションキーごと（セッションレーン）に直列化され、任意でグローバルレーンも通ります。
- これによりツール/セッションの競合を防ぎ、セッション履歴の一貫性を保ちます。
- メッセージングチャネルは、このレーンシステムに供給するキューモード（collect/steer/followup）を選択できます。
  [Command Queue](/ja-JP/concepts/queue) を参照してください。
- トランスクリプト書き込みも、セッションファイル上のセッション書き込みロックで保護されます。このロックは
  プロセスを認識し、ファイルベースであるため、プロセス内キューを迂回するライターや
  別プロセスから来るライターを捕捉します。セッショントランスクリプトライターは、セッションをビジーとして報告する前に
  最大 `session.writeLock.acquireTimeoutMs` まで待機します。デフォルトは `60000` ms です。
- セッション書き込みロックはデフォルトで再入不可です。ヘルパーが同じロックの取得を意図的にネストし、
  1 つの論理ライターを維持する場合は、
  `allowReentrant: true` で明示的にオプトインする必要があります。

## セッション + ワークスペースの準備

- ワークスペースが解決され作成されます。サンドボックス化された実行はサンドボックスワークスペースルートにリダイレクトされる場合があります。
- Skills が読み込まれ（またはスナップショットから再利用され）、env とプロンプトに注入されます。
- ブートストラップ/コンテキストファイルが解決され、システムプロンプトレポートに注入されます。
- セッション書き込みロックが取得されます。`SessionManager` はストリーミング前に開かれ、準備されます。その後の
  トランスクリプトの再書き込み、Compaction、切り詰めのパスは、トランスクリプトファイルを開く前または
  変更する前に、同じロックを取得する必要があります。

## プロンプト組み立て + システムプロンプト

- システムプロンプトは、OpenClaw のベースプロンプト、Skills プロンプト、ブートストラップコンテキスト、実行ごとの上書きから構築されます。
- モデル固有の上限と Compaction 予約トークンが適用されます。
- モデルが見る内容については [System prompt](/ja-JP/concepts/system-prompt) を参照してください。

## フックポイント（介入できる場所）

OpenClaw には 2 つのフックシステムがあります。

- **内部フック**（Gateway フック）: コマンドとライフサイクルイベント用のイベント駆動スクリプト。
- **Plugin フック**: エージェント/ツールのライフサイクルと Gateway パイプライン内の拡張ポイント。

### 内部フック（Gateway フック）

- **`agent:bootstrap`**: システムプロンプトが確定される前に、ブートストラップファイルの構築中に実行されます。
  これを使用してブートストラップコンテキストファイルを追加/削除します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、その他のコマンドイベント（Hooks ドキュメントを参照）。

セットアップと例については [Hooks](/ja-JP/automation/hooks) を参照してください。

### Plugin フック（エージェント + Gateway ライフサイクル）

これらはエージェントループまたは Gateway パイプライン内で実行されます。

- **`before_model_resolve`**: モデル解決前に provider/model を決定論的に上書きするため、セッション前（`messages` なし）に実行されます。
- **`before_prompt_build`**: セッション読み込み後（`messages` あり）に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターンごとの動的テキストには `prependContext` を使用し、システムプロンプト空間に置くべき安定したガイダンスにはシステムコンテキストフィールドを使用します。
- **`before_agent_start`**: どちらのフェーズでも実行される可能性があるレガシー互換フックです。上記の明示的なフックを優先してください。
- **`before_agent_reply`**: インラインアクション後、LLM 呼び出し前に実行され、Plugin がターンを引き受けて合成返信を返すか、ターンを完全にサイレントにできます。
- **`agent_end`**: 完了後の最終メッセージリストと実行メタデータを検査します。
- **`before_compaction` / `after_compaction`**: Compaction サイクルを監視または注釈します。
- **`before_tool_call` / `after_tool_call`**: ツールのパラメーター/結果に介入します。
- **`before_install`**: 組み込みスキャンの検出結果を検査し、任意で skill または Plugin のインストールをブロックします。
- **`tool_result_persist`**: ツール結果が OpenClaw 所有のセッショントランスクリプトに書き込まれる前に同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージフック。
- **`session_start` / `session_end`**: セッションライフサイクル境界。
- **`gateway_start` / `gateway_stop`**: Gateway ライフサイクルイベント。

送信/ツールガードのフック判定ルール:

- `before_tool_call`: `{ block: true }` は終端であり、低優先度のハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端であり、低優先度のハンドラーを停止します。
- `before_install`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端であり、低優先度のハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、以前のキャンセルを解除しません。

フック API と登録の詳細については [Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

ハーネスはこれらのフックを別の方法で適応する場合があります。Codex app-server ハーネスは、
ドキュメント化されたミラー対象サーフェスの互換性契約として OpenClaw Plugin フックを維持しますが、
Codex ネイティブフックは別個の低レベル Codex メカニズムのままです。

## ストリーミング + 部分返信

- アシスタントデルタは pi-agent-core からストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングは、`text_end` または `message_end` のいずれかで部分返信を発行できます。
- 推論ストリーミングは、別個のストリームとして、またはブロック返信として発行できます。
- チャンク化とブロック返信の挙動については [Streaming](/ja-JP/concepts/streaming) を参照してください。

## ツール実行 + メッセージングツール

- ツールの開始/更新/終了イベントは `tool` ストリームで発行されます。
- ツール結果は、ログ記録/発行の前にサイズと画像ペイロードについてサニタイズされます。
- メッセージングツールの送信は、重複するアシスタント確認を抑制するために追跡されます。

## 返信の整形 + 抑制

- 最終ペイロードは次から組み立てられます。
  - アシスタントテキスト（および任意の推論）
  - インラインツール要約（verbose + 許可されている場合）
  - モデルエラー時のアシスタントエラーテキスト
- 厳密なサイレントトークン `NO_REPLY` / `no_reply` は送信
  ペイロードからフィルタリングされます。
- メッセージングツールの重複は最終ペイロードリストから削除されます。
- レンダリング可能なペイロードが残っておらず、ツールがエラーになった場合は、フォールバックのツールエラー返信が発行されます
  （メッセージングツールがすでにユーザーに見える返信を送信している場合を除きます）。

## Compaction + リトライ

- 自動 Compaction は `compaction` ストリームイベントを発行し、リトライをトリガーできます。
- リトライ時には、重複出力を避けるためにインメモリバッファとツール要約がリセットされます。
- Compaction パイプラインについては [Compaction](/ja-JP/concepts/compaction) を参照してください。

## イベントストリーム（現在）

- `lifecycle`: `subscribeEmbeddedPiSession` によって発行されます（また `agentCommand` によるフォールバックとしても発行されます）
- `assistant`: pi-agent-core からのストリーミングデルタ
- `tool`: pi-agent-core からのストリーミングツールイベント

## チャットチャネル処理

- アシスタントデルタはチャット `delta` メッセージにバッファリングされます。
- **lifecycle end/error** でチャット `final` が発行されます。

## タイムアウト

- `agent.wait` のデフォルト: 30s（待機のみ）。`timeoutMs` パラメーターで上書きします。
- エージェントランタイム: `agents.defaults.timeoutSeconds` のデフォルトは 172800s（48 時間）です。`runEmbeddedPiAgent` の中止タイマーで適用されます。
- Cron ランタイム: 分離されたエージェントターンの `timeoutSeconds` は cron が所有します。スケジューラーは実行開始時にそのタイマーを開始し、設定された期限で基礎となる実行を中止し、その後、古い子セッションがレーンを詰まらせ続けないように、タイムアウトを記録する前に境界付きクリーンアップを実行します。
- セッション生存性診断: 診断が有効な場合、`diagnostics.stuckSessionWarnMs` は、観測された返信、ツール、ステータス、ブロック、または ACP 進捗がない長時間の `processing` セッションを分類します。アクティブな埋め込み実行、モデル呼び出し、ツール呼び出しは `session.long_running` として報告されます。最近の進捗がないアクティブ作業は `session.stalled` として報告されます。`session.stuck` は、アクティブ作業がない古いセッション bookkeeping 用に予約されています。古いセッション bookkeeping は影響を受けるセッションレーンを即座に解放します。停止した埋め込み実行は `diagnostics.stuckSessionAbortMs`（デフォルト: 少なくとも 10 分かつ警告しきい値の 5 倍）後にのみ abort-drain されるため、単に遅い実行を打ち切ることなくキュー済み作業を再開できます。復旧は構造化された requested/completed 結果を発行し、診断状態は同じ処理世代がまだ現在である場合にのみ idle としてマークされます。繰り返しの `session.stuck` 診断は、セッションが変更されない間バックオフします。
- モデルアイドルタイムアウト: OpenClaw は、アイドルウィンドウ前にレスポンスチャンクが到着しない場合、モデルリクエストを中止します。`models.providers.<id>.timeoutSeconds` は、遅いローカル/セルフホスト provider 向けにこのアイドルウォッチドッグを延長します。それ以外の場合、OpenClaw は設定されていれば `agents.defaults.timeoutSeconds` を使用し、デフォルトでは最大 120s に制限されます。明示的なモデルまたはエージェントタイムアウトがない Cron トリガー実行は、アイドルウォッチドッグを無効化し、cron の外側タイムアウトに依存します。
- Provider HTTP リクエストタイムアウト: `models.providers.<id>.timeoutSeconds` は、その provider のモデル HTTP fetch に適用されます。これには connect、headers、body、SDK リクエストタイムアウト、総合的な guarded-fetch 中止処理、モデルストリームアイドルウォッチドッグが含まれます。エージェントランタイム全体のタイムアウトを引き上げる前に、Ollama などの遅いローカル/セルフホスト provider にはこれを使用してください。

## 早期終了し得る場所

- エージェントタイムアウト（中止）
- AbortSignal（キャンセル）
- Gateway 切断または RPC タイムアウト
- `agent.wait` タイムアウト（待機のみ、エージェントは停止しません）

## 関連

- [Tools](/ja-JP/tools) — 利用可能なエージェントツール
- [Hooks](/ja-JP/automation/hooks) — エージェントライフサイクルイベントによってトリガーされるイベント駆動スクリプト
- [Compaction](/ja-JP/concepts/compaction) — 長い会話を要約する方法
- [Exec Approvals](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Thinking](/ja-JP/tools/thinking) — thinking/reasoning レベル設定
