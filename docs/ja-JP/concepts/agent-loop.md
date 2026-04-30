---
read_when:
    - エージェントループまたはライフサイクルイベントの正確なウォークスルーが必要
    - セッションのキュー処理、トランスクリプトの書き込み、またはセッション書き込みロックの動作を変更している
summary: エージェントループのライフサイクル、ストリーム、待機セマンティクス
title: エージェントループ
x-i18n:
    generated_at: "2026-04-30T18:38:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

エージェントループは、エージェントの完全な「実際の」実行です。取り込み → コンテキスト組み立て → モデル推論 →
ツール実行 → ストリーミング返信 → 永続化。これは、セッション状態の一貫性を保ちながら、メッセージを
アクションと最終返信に変換する権威あるパスです。

OpenClaw では、ループはセッションごとに単一でシリアライズされた実行であり、モデルが考え、ツールを呼び出し、
出力をストリーミングする間にライフサイクルイベントとストリームイベントを発行します。このドキュメントでは、その本物のループが
エンドツーエンドでどのように接続されているかを説明します。

## エントリポイント

- Gateway RPC: `agent` と `agent.wait`。
- CLI: `agent` コマンド。

## 仕組み（概要）

1. `agent` RPC はパラメータを検証し、セッション（sessionKey/sessionId）を解決し、セッションメタデータを永続化し、`{ runId, acceptedAt }` を即座に返します。
2. `agentCommand` がエージェントを実行します。
   - モデル + thinking/verbose/trace のデフォルトを解決する
   - Skills スナップショットを読み込む
   - `runEmbeddedPiAgent`（pi-agent-core ランタイム）を呼び出す
   - 埋め込みループが発行しない場合は **ライフサイクル end/error** を発行する
3. `runEmbeddedPiAgent`:
   - セッションごと + グローバルキューで実行をシリアライズする
   - モデル + 認証プロファイルを解決し、pi セッションを構築する
   - pi イベントを購読し、assistant/tool デルタをストリーミングする
   - タイムアウトを適用し、超過した場合は実行を中止する
   - Codex app-server ターンでは、終端イベントの前に app-server 進捗の生成が止まった承認済みターンを中止する
   - ペイロード + 使用量メタデータを返す
4. `subscribeEmbeddedPiSession` は pi-agent-core イベントを OpenClaw `agent` ストリームに橋渡しします。
   - ツールイベント => `stream: "tool"`
   - assistant デルタ => `stream: "assistant"`
   - ライフサイクルイベント => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` は `waitForAgentRun` を使用します。
   - `runId` の **ライフサイクル end/error** を待機する
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返す

## キューイング + 並行性

- 実行はセッションキーごと（セッションレーン）にシリアライズされ、任意でグローバルレーンも通ります。
- これにより、ツール/セッションの競合を防ぎ、セッション履歴の一貫性を保ちます。
- メッセージングチャンネルは、このレーンシステムに入力するキューモード（collect/steer/followup）を選択できます。
  [コマンドキュー](/ja-JP/concepts/queue)を参照してください。
- トランスクリプト書き込みも、セッションファイル上のセッション書き込みロックで保護されます。このロックは
  プロセスを認識し、ファイルベースであるため、プロセス内キューを迂回する書き込み元や
  別プロセスからの書き込み元も検出します。
- セッション書き込みロックはデフォルトで再入不可です。ヘルパーが 1 つの論理的な書き込み元を維持しながら、
  同じロックの取得を意図的にネストする場合は、
  `allowReentrant: true` で明示的にオプトインする必要があります。

## セッション + ワークスペース準備

- ワークスペースが解決され作成されます。サンドボックス化された実行では、サンドボックスのワークスペースルートにリダイレクトされる場合があります。
- Skills が読み込まれ（またはスナップショットから再利用され）、env とプロンプトに注入されます。
- ブートストラップ/コンテキストファイルが解決され、システムプロンプトレポートに注入されます。
- セッション書き込みロックが取得されます。ストリーミング前に `SessionManager` が開かれ、準備されます。以降の
  トランスクリプトの再書き込み、Compaction、切り詰めのパスは、トランスクリプトファイルを開くまたは
  変更する前に同じロックを取得する必要があります。

## プロンプト組み立て + システムプロンプト

- システムプロンプトは、OpenClaw のベースプロンプト、Skills プロンプト、ブートストラップコンテキスト、実行ごとのオーバーライドから構築されます。
- モデル固有の制限と Compaction 予約トークンが適用されます。
- モデルが見る内容については、[システムプロンプト](/ja-JP/concepts/system-prompt)を参照してください。

## フックポイント（介入できる場所）

OpenClaw には 2 つのフックシステムがあります。

- **内部フック**（Gateway フック）: コマンドとライフサイクルイベント用のイベント駆動スクリプト。
- **Plugin フック**: エージェント/ツールライフサイクルと Gateway パイプライン内の拡張ポイント。

### 内部フック（Gateway フック）

- **`agent:bootstrap`**: システムプロンプトが確定される前に、ブートストラップファイルを構築している間に実行されます。
  これを使用してブートストラップコンテキストファイルを追加/削除します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、その他のコマンドイベント（Hooks ドキュメントを参照）。

セットアップと例については、[Hooks](/ja-JP/automation/hooks)を参照してください。

### Plugin フック（エージェント + Gateway ライフサイクル）

これらはエージェントループまたは Gateway パイプライン内で実行されます。

- **`before_model_resolve`**: モデル解決前に、provider/model を決定論的に上書きするため、セッション前（`messages` なし）に実行されます。
- **`before_prompt_build`**: セッション読み込み後（`messages` あり）に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターンごとの動的テキストには `prependContext` を使用し、システムプロンプト空間に置くべき安定したガイダンスにはシステムコンテキストフィールドを使用します。
- **`before_agent_start`**: どちらのフェーズでも実行される可能性があるレガシー互換フックです。上記の明示的なフックを優先してください。
- **`before_agent_reply`**: インラインアクション後、LLM 呼び出し前に実行され、Plugin がターンを引き受けて合成返信を返すか、ターンを完全に無音化できます。
- **`agent_end`**: 完了後に最終メッセージリストと実行メタデータを検査します。
- **`before_compaction` / `after_compaction`**: Compaction サイクルを観察または注釈付けします。
- **`before_tool_call` / `after_tool_call`**: ツールパラメータ/結果に介入します。
- **`before_install`**: 組み込みスキャンの検出結果を検査し、任意で skill または Plugin のインストールをブロックします。
- **`tool_result_persist`**: OpenClaw 所有のセッショントランスクリプトに書き込まれる前に、ツール結果を同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージフック。
- **`session_start` / `session_end`**: セッションライフサイクル境界。
- **`gateway_start` / `gateway_stop`**: Gateway ライフサイクルイベント。

送信/ツールガードのフック判定ルール:

- `before_tool_call`: `{ block: true }` は終端であり、低優先度のハンドラを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端であり、低優先度のハンドラを停止します。
- `before_install`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端であり、低優先度のハンドラを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、以前のキャンセルを解除しません。

フック API と登録の詳細については、[Plugin フック](/ja-JP/plugins/hooks)を参照してください。

ハーネスはこれらのフックを異なる形で適用する場合があります。Codex app-server ハーネスは、
ドキュメント化されたミラーサーフェスの互換性契約として OpenClaw Plugin フックを維持しますが、
Codex ネイティブフックは別個の低レベル Codex メカニズムのままです。

## ストリーミング + 部分返信

- assistant デルタは pi-agent-core からストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングは、`text_end` または `message_end` で部分返信を発行できます。
- 推論ストリーミングは、別個のストリームとして、またはブロック返信として発行できます。
- チャンク化とブロック返信の動作については、[ストリーミング](/ja-JP/concepts/streaming)を参照してください。

## ツール実行 + メッセージングツール

- ツールの start/update/end イベントは `tool` ストリームで発行されます。
- ツール結果は、ログ記録/発行の前にサイズと画像ペイロードについてサニタイズされます。
- メッセージングツールの送信は、assistant の重複確認を抑制するために追跡されます。

## 返信整形 + 抑制

- 最終ペイロードは以下から組み立てられます。
  - assistant テキスト（および任意の推論）
  - インラインツール要約（verbose + 許可されている場合）
  - モデルエラー時の assistant エラーテキスト
- 厳密な無音トークン `NO_REPLY` / `no_reply` は送信
  ペイロードからフィルタリングされます。
- メッセージングツールの重複は最終ペイロードリストから削除されます。
- レンダリング可能なペイロードが残っておらず、ツールでエラーが発生した場合は、フォールバックのツールエラー返信が発行されます
  （メッセージングツールがすでにユーザーに見える返信を送信している場合を除く）。

## Compaction + 再試行

- 自動 Compaction は `compaction` ストリームイベントを発行し、再試行をトリガーできます。
- 再試行時には、重複出力を避けるためにインメモリバッファとツール要約がリセットされます。
- Compaction パイプラインについては、[Compaction](/ja-JP/concepts/compaction)を参照してください。

## イベントストリーム（現在）

- `lifecycle`: `subscribeEmbeddedPiSession` によって発行されます（`agentCommand` によるフォールバックとしても発行されます）
- `assistant`: pi-agent-core からのストリーミングデルタ
- `tool`: pi-agent-core からのストリーミングツールイベント

## チャットチャンネル処理

- assistant デルタはチャット `delta` メッセージにバッファリングされます。
- チャット `final` は **ライフサイクル end/error** で発行されます。

## タイムアウト

- `agent.wait` のデフォルト: 30 秒（待機のみ）。`timeoutMs` パラメータで上書きできます。
- エージェントランタイム: `agents.defaults.timeoutSeconds` のデフォルトは 172800 秒（48 時間）です。`runEmbeddedPiAgent` の中止タイマーで適用されます。
- Cron ランタイム: 分離されたエージェントターンの `timeoutSeconds` は cron が所有します。スケジューラは実行開始時にそのタイマーを開始し、設定された期限で基盤の実行を中止し、その後、古い子セッションがレーンを詰まらせ続けないよう、タイムアウトを記録する前に有界のクリーンアップを実行します。
- スタックセッションの回復: 診断が有効な場合、`diagnostics.stuckSessionWarnMs` は長時間の `processing` セッションを検出します。アクティブな埋め込み実行、アクティブな返信操作、アクティブなセッションレーンタスクはデフォルトで警告のみのままです。診断でそのセッションにアクティブな作業がないことが示された場合、watchdog は影響を受けたセッションレーンを解放し、キューに入った起動作業が流れるようにします。
- モデルアイドルタイムアウト: OpenClaw は、アイドルウィンドウの前にレスポンスチャンクが到着しない場合、モデルリクエストを中止します。`models.providers.<id>.timeoutSeconds` は、低速なローカル/セルフホスト provider 向けにこのアイドル watchdog を延長します。それ以外の場合、OpenClaw は設定されていれば `agents.defaults.timeoutSeconds` を使用し、デフォルトで 120 秒を上限とします。明示的なモデルまたはエージェントタイムアウトがない Cron トリガーの実行では、アイドル watchdog を無効にし、Cron の外側のタイムアウトに依存します。
- Provider HTTP リクエストタイムアウト: `models.providers.<id>.timeoutSeconds` は、その provider のモデル HTTP fetch に適用されます。これには connect、headers、body、SDK request timeout、total guarded-fetch abort handling、model stream idle watchdog が含まれます。エージェントランタイム全体のタイムアウトを引き上げる前に、Ollama などの低速なローカル/セルフホスト provider にこれを使用してください。

## 早期終了する可能性がある場所

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
