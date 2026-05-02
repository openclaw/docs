---
read_when:
    - エージェントループまたはライフサイクルイベントの正確なウォークスルーが必要な場合
    - セッションのキュー処理、トランスクリプトの書き込み、またはセッション書き込みロックの動作を変更する場合
summary: エージェントループのライフサイクル、ストリーム、待機セマンティクス
title: エージェントループ
x-i18n:
    generated_at: "2026-05-02T20:45:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

エージェントループは、エージェントの完全な「実」実行です: 取り込み → コンテキスト組み立て → モデル推論 →
ツール実行 → ストリーミング返信 → 永続化。これはメッセージをアクションと最終返信に変換しつつ、
セッション状態の一貫性を保つ正式な経路です。

OpenClaw では、ループはセッションごとに1つの直列化された実行であり、モデルが思考し、ツールを呼び出し、
出力をストリーミングする間にライフサイクルイベントとストリームイベントを発行します。このドキュメントでは、その本物のループが
エンドツーエンドでどのように配線されているかを説明します。

## エントリーポイント

- Gateway RPC: `agent` と `agent.wait`。
- CLI: `agent` コマンド。

## 仕組み（高レベル）

1. `agent` RPC はパラメーターを検証し、セッション（sessionKey/sessionId）を解決し、セッションメタデータを永続化し、`{ runId, acceptedAt }` を即座に返します。
2. `agentCommand` がエージェントを実行します:
   - モデル + thinking/verbose/trace のデフォルトを解決
   - Skills スナップショットを読み込み
   - `runEmbeddedPiAgent`（pi-agent-core ランタイム）を呼び出し
   - 埋め込みループが発行しない場合は **ライフサイクル end/error** を発行
3. `runEmbeddedPiAgent`:
   - セッションごと + グローバルキューで実行を直列化
   - モデル + 認証プロファイルを解決し、pi セッションを構築
   - pi イベントを購読し、assistant/tool デルタをストリーミング
   - タイムアウトを強制 -> 超過した場合は実行を中止
   - Codex app-server ターンでは、終端イベントの前に app-server 進行状況の生成が停止した受け入れ済みターンを中止
   - ペイロード + 使用量メタデータを返却
4. `subscribeEmbeddedPiSession` は pi-agent-core イベントを OpenClaw `agent` ストリームへ橋渡しします:
   - ツールイベント => `stream: "tool"`
   - assistant デルタ => `stream: "assistant"`
   - ライフサイクルイベント => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` は `waitForAgentRun` を使用します:
   - `runId` の **ライフサイクル end/error** を待機
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返却

## キューイング + 並行性

- 実行はセッションキーごと（セッションレーン）に直列化され、任意でグローバルレーンも通ります。
- これによりツール/セッションの競合を防ぎ、セッション履歴の一貫性を保ちます。
- メッセージングチャネルは、このレーンシステムに供給するキューモード（collect/steer/followup）を選択できます。
  [コマンドキュー](/ja-JP/concepts/queue)を参照してください。
- トランスクリプト書き込みも、セッションファイル上のセッション書き込みロックで保護されます。このロックは
  プロセスを認識し、ファイルベースであるため、プロセス内キューを迂回する書き込みや
  別プロセスからの書き込みを捕捉します。セッショントランスクリプトの書き込み側は、セッションを busy と報告する前に
  最大 `session.writeLock.acquireTimeoutMs` まで待機します。デフォルトは `60000` ms です。
- セッション書き込みロックはデフォルトでは非再入可能です。ヘルパーが、1つの論理的な書き込み側を維持しながら
  同じロックの取得を意図的にネストする場合は、
  `allowReentrant: true` で明示的にオプトインする必要があります。

## セッション + ワークスペースの準備

- ワークスペースが解決され作成されます。サンドボックス化された実行は、サンドボックスワークスペースルートへリダイレクトされる場合があります。
- Skills が読み込まれ（またはスナップショットから再利用され）、env とプロンプトに注入されます。
- Bootstrap/コンテキストファイルが解決され、システムプロンプトレポートに注入されます。
- セッション書き込みロックが取得されます。`SessionManager` はストリーミング前に開かれ、準備されます。以降の
  トランスクリプト再書き込み、Compaction、切り詰めの経路は、トランスクリプトファイルを開く、または
  変更する前に同じロックを取得する必要があります。

## プロンプト組み立て + システムプロンプト

- システムプロンプトは、OpenClaw のベースプロンプト、Skills プロンプト、Bootstrap コンテキスト、実行ごとのオーバーライドから構築されます。
- モデル固有の制限と Compaction 予約トークンが強制されます。
- モデルが見る内容については、[システムプロンプト](/ja-JP/concepts/system-prompt)を参照してください。

## フックポイント（介入できる場所）

OpenClaw には2つのフックシステムがあります:

- **内部フック**（Gateway フック）: コマンドとライフサイクルイベント向けのイベント駆動スクリプト。
- **Plugin フック**: エージェント/ツールのライフサイクルと Gateway パイプライン内の拡張ポイント。

### 内部フック（Gateway フック）

- **`agent:bootstrap`**: システムプロンプトが確定される前に、Bootstrap ファイルを構築している間に実行されます。
  これを使用して Bootstrap コンテキストファイルを追加/削除します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、その他のコマンドイベント（Hooks ドキュメントを参照）。

セットアップと例については、[Hooks](/ja-JP/automation/hooks)を参照してください。

### Plugin フック（エージェント + Gateway ライフサイクル）

これらはエージェントループまたは Gateway パイプライン内で実行されます:

- **`before_model_resolve`**: モデル解決前にプロバイダー/モデルを決定論的にオーバーライドするため、セッション前（`messages` なし）に実行されます。
- **`before_prompt_build`**: セッション読み込み後（`messages` あり）に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターンごとの動的テキストには `prependContext` を使用し、システムプロンプト空間に置くべき安定したガイダンスにはシステムコンテキストフィールドを使用します。
- **`before_agent_start`**: どちらのフェーズでも実行される可能性があるレガシー互換フックです。上記の明示的なフックを推奨します。
- **`before_agent_reply`**: インラインアクションの後、LLM 呼び出しの前に実行され、Plugin がターンを引き受けて合成返信を返す、またはターンを完全に無音化できます。
- **`agent_end`**: 完了後に最終メッセージリストと実行メタデータを検査します。
- **`before_compaction` / `after_compaction`**: Compaction サイクルを監視または注釈付けします。
- **`before_tool_call` / `after_tool_call`**: ツールパラメーター/結果をインターセプトします。
- **`before_install`**: 組み込みのスキャン結果を検査し、任意で Skill または Plugin のインストールをブロックします。
- **`tool_result_persist`**: ツール結果が OpenClaw 所有のセッショントランスクリプトへ書き込まれる前に、同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージのフック。
- **`session_start` / `session_end`**: セッションライフサイクルの境界。
- **`gateway_start` / `gateway_stop`**: Gateway ライフサイクルイベント。

送信/ツールガードのフック判定ルール:

- `before_tool_call`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_install`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端であり、優先度の低いハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、以前のキャンセルを解除しません。

フック API と登録の詳細については、[Plugin フック](/ja-JP/plugins/hooks)を参照してください。

ハーネスはこれらのフックを異なる形で適応する場合があります。Codex app-server ハーネスは、
ドキュメント化されたミラーサーフェスの互換性契約として OpenClaw Plugin フックを維持しますが、
Codex ネイティブフックは別の低レベルな Codex メカニズムのままです。

## ストリーミング + 部分返信

- assistant デルタは pi-agent-core からストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングは、`text_end` または `message_end` で部分返信を発行できます。
- 推論ストリーミングは、別ストリームとして、またはブロック返信として発行できます。
- チャンク化とブロック返信の動作については、[ストリーミング](/ja-JP/concepts/streaming)を参照してください。

## ツール実行 + メッセージングツール

- ツールの start/update/end イベントは `tool` ストリームで発行されます。
- ツール結果は、ログ記録/発行前にサイズと画像ペイロードについてサニタイズされます。
- メッセージングツールの送信は、重複した assistant 確認を抑制するために追跡されます。

## 返信整形 + 抑制

- 最終ペイロードは以下から組み立てられます:
  - assistant テキスト（および任意の推論）
  - インラインツール要約（verbose + 許可されている場合）
  - モデルエラー時の assistant エラーテキスト
- 正確な無音トークン `NO_REPLY` / `no_reply` は、送信
  ペイロードからフィルタリングされます。
- メッセージングツールの重複は最終ペイロードリストから削除されます。
- レンダリング可能なペイロードが残らず、ツールがエラーになった場合は、フォールバックのツールエラー返信が発行されます
  （メッセージングツールがすでにユーザーに見える返信を送信していない限り）。

## Compaction + リトライ

- 自動 Compaction は `compaction` ストリームイベントを発行し、リトライをトリガーする場合があります。
- リトライ時には、重複出力を避けるため、メモリ内バッファーとツール要約がリセットされます。
- Compaction パイプラインについては、[Compaction](/ja-JP/concepts/compaction)を参照してください。

## イベントストリーム（現在）

- `lifecycle`: `subscribeEmbeddedPiSession` によって発行されます（および `agentCommand` によるフォールバックとして）
- `assistant`: pi-agent-core からのストリーミングされたデルタ
- `tool`: pi-agent-core からのストリーミングされたツールイベント

## チャットチャネル処理

- assistant デルタはチャット `delta` メッセージへバッファリングされます。
- **ライフサイクル end/error** でチャット `final` が発行されます。

## タイムアウト

- `agent.wait` のデフォルト: 30s（待機のみ）。`timeoutMs` パラメーターで上書きします。
- エージェントランタイム: `agents.defaults.timeoutSeconds` のデフォルトは 172800s（48時間）です。`runEmbeddedPiAgent` の中止タイマーで強制されます。
- Cron ランタイム: 分離されたエージェントターンの `timeoutSeconds` は cron が所有します。スケジューラーは実行開始時にそのタイマーを開始し、設定された期限で基盤の実行を中止した後、期限付きのクリーンアップを実行してからタイムアウトを記録します。これにより古い子セッションがレーンを詰まらせ続けることを防ぎます。
- セッション生存性診断: 診断が有効な場合、`diagnostics.stuckSessionWarnMs` は、観測された返信、ツール、ステータス、ブロック、または ACP 進行状況がない長時間の `processing` セッションを分類します。アクティブな埋め込み実行、モデル呼び出し、ツール呼び出しは `session.long_running` として報告されます。最近の進行状況がないアクティブな作業は `session.stalled` として報告されます。`session.stuck` はアクティブな作業がない古いセッションのブックキーピング用に予約され、その経路だけが影響を受けるセッションレーンを解放し、キューにある起動作業を流せるようにします。繰り返される `session.stuck` 診断は、セッションが変化しない間バックオフします。
- モデルアイドルタイムアウト: OpenClaw は、アイドルウィンドウ内にレスポンスチャンクが到着しない場合、モデルリクエストを中止します。`models.providers.<id>.timeoutSeconds` は、低速なローカル/セルフホストプロバイダー向けにこのアイドルウォッチドッグを延長します。それ以外の場合、OpenClaw は設定されていれば `agents.defaults.timeoutSeconds` を使用し、デフォルトで 120s を上限とします。明示的なモデルまたはエージェントタイムアウトがない Cron トリガーの実行では、アイドルウォッチドッグを無効にし、Cron の外側タイムアウトに依存します。
- プロバイダー HTTP リクエストタイムアウト: `models.providers.<id>.timeoutSeconds` は、そのプロバイダーのモデル HTTP fetch に適用されます。これには接続、ヘッダー、本文、SDK リクエストタイムアウト、総合的な guarded-fetch 中止処理、モデルストリームのアイドルウォッチドッグが含まれます。エージェントランタイム全体のタイムアウトを引き上げる前に、Ollama などの低速なローカル/セルフホストプロバイダーにはこれを使用してください。

## 早期終了が起こり得る場所

- エージェントタイムアウト（中止）
- AbortSignal（キャンセル）
- Gateway 切断または RPC タイムアウト
- `agent.wait` タイムアウト（待機のみで、エージェントは停止しません）

## 関連

- [ツール](/ja-JP/tools) — 利用可能なエージェントツール
- [Hooks](/ja-JP/automation/hooks) — エージェントライフサイクルイベントによってトリガーされるイベント駆動スクリプト
- [Compaction](/ja-JP/concepts/compaction) — 長い会話がどのように要約されるか
- [実行承認](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Thinking](/ja-JP/tools/thinking) — thinking/reasoning レベル設定
