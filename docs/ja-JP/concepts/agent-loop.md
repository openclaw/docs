---
read_when:
    - エージェントループまたはライフサイクルイベントの正確なウォークスルーが必要な場合
    - セッションのキューイング、トランスクリプト書き込み、またはセッション書き込みロックの動作を変更しています
summary: エージェントループのライフサイクル、ストリーム、および待機セマンティクス
title: エージェントループ
x-i18n:
    generated_at: "2026-05-02T04:53:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

エージェント型ループは、エージェントの完全な「実際の」実行です: 取り込み → コンテキスト組み立て → モデル推論 →
ツール実行 → ストリーミング返信 → 永続化。これは、セッション状態の整合性を保ちながら、メッセージを
アクションと最終返信に変換する信頼できる経路です。

OpenClaw では、ループはセッションごとに単一でシリアライズされた実行であり、モデルが思考し、
ツールを呼び出し、出力をストリーミングする間にライフサイクルイベントとストリームイベントを発行します。
このドキュメントでは、その本物のループがエンドツーエンドでどのように結線されているかを説明します。

## エントリポイント

- Gateway RPC: `agent` と `agent.wait`。
- CLI: `agent` コマンド。

## 仕組み（概要）

1. `agent` RPC はパラメーターを検証し、セッション（sessionKey/sessionId）を解決し、セッションメタデータを永続化し、`{ runId, acceptedAt }` を即座に返します。
2. `agentCommand` はエージェントを実行します:
   - モデル + thinking/verbose/trace のデフォルトを解決する
   - Skills スナップショットを読み込む
   - `runEmbeddedPiAgent`（pi-agent-core ランタイム）を呼び出す
   - 埋め込みループが発行しない場合は **lifecycle end/error** を発行する
3. `runEmbeddedPiAgent`:
   - セッションごと + グローバルキューによって実行をシリアライズする
   - モデル + 認証プロファイルを解決し、pi セッションを構築する
   - pi イベントを購読し、assistant/tool デルタをストリーミングする
   - タイムアウトを強制する -> 超過した場合は実行を中止する
   - Codex app-server ターンでは、terminal イベントの前に app-server 進行状況を生成しなくなった受理済みターンを中止する
   - ペイロード + 使用量メタデータを返す
4. `subscribeEmbeddedPiSession` は pi-agent-core イベントを OpenClaw `agent` ストリームに橋渡しします:
   - ツールイベント => `stream: "tool"`
   - assistant デルタ => `stream: "assistant"`
   - ライフサイクルイベント => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` は `waitForAgentRun` を使用します:
   - `runId` の **lifecycle end/error** を待機する
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返す

## キューイング + 並行処理

- 実行はセッションキーごと（セッションレーン）にシリアライズされ、任意でグローバルレーンも通ります。
- これによりツール/セッションの競合を防ぎ、セッション履歴の整合性を保ちます。
- メッセージングチャネルは、このレーンシステムに渡すキューモード（collect/steer/followup）を選択できます。
  [コマンドキュー](/ja-JP/concepts/queue) を参照してください。
- トランスクリプトの書き込みも、セッションファイル上のセッション書き込みロックで保護されます。このロックは
  プロセス認識かつファイルベースなので、プロセス内キューを迂回する書き込み元や、
  別プロセスからの書き込み元を検出します。
- セッション書き込みロックはデフォルトでは再入不可です。ヘルパーが 1 つの論理的な書き込み元を保ちながら
  同じロックの取得を意図的にネストする場合は、`allowReentrant: true` で明示的にオプトインする必要があります。

## セッション + ワークスペース準備

- ワークスペースが解決され、作成されます。サンドボックス化された実行は、サンドボックスワークスペースルートにリダイレクトされることがあります。
- Skills が読み込まれ（またはスナップショットから再利用され）、env とプロンプトに注入されます。
- ブートストラップ/コンテキストファイルが解決され、システムプロンプトレポートに注入されます。
- セッション書き込みロックが取得され、`SessionManager` がストリーミング前に開かれて準備されます。以後の
  トランスクリプトの書き換え、Compaction、切り詰めの経路は、トランスクリプトファイルを開く、または
  変更する前に同じロックを取得する必要があります。

## プロンプト組み立て + システムプロンプト

- システムプロンプトは、OpenClaw のベースプロンプト、Skills プロンプト、ブートストラップコンテキスト、実行ごとのオーバーライドから構築されます。
- モデル固有の制限と Compaction 予約トークンが強制されます。
- モデルが見る内容については、[システムプロンプト](/ja-JP/concepts/system-prompt) を参照してください。

## フックポイント（介入できる場所）

OpenClaw には 2 つのフックシステムがあります:

- **内部フック**（Gateway フック）: コマンドとライフサイクルイベント用のイベント駆動スクリプト。
- **Plugin フック**: エージェント/ツールのライフサイクルおよび Gateway パイプライン内の拡張ポイント。

### 内部フック（Gateway フック）

- **`agent:bootstrap`**: システムプロンプトが確定する前に、ブートストラップファイルの構築中に実行されます。
  これを使用して、ブートストラップコンテキストファイルを追加/削除します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、その他のコマンドイベント（Hooks ドキュメントを参照）。

セットアップと例については、[Hooks](/ja-JP/automation/hooks) を参照してください。

### Plugin フック（エージェント + Gateway ライフサイクル）

これらはエージェントループまたは Gateway パイプライン内で実行されます:

- **`before_model_resolve`**: セッション前（`messages` なし）に実行され、モデル解決前にプロバイダー/モデルを決定論的にオーバーライドします。
- **`before_prompt_build`**: セッション読み込み後（`messages` あり）に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターンごとの動的テキストには `prependContext` を使用し、システムプロンプト空間に置くべき安定したガイダンスにはシステムコンテキストフィールドを使用してください。
- **`before_agent_start`**: どちらのフェーズでも実行される可能性があるレガシー互換フックです。上記の明示的なフックを優先してください。
- **`before_agent_reply`**: インラインアクションの後、LLM 呼び出しの前に実行され、Plugin がターンを引き受けて合成返信を返す、またはターンを完全に無音化できます。
- **`agent_end`**: 完了後の最終メッセージリストと実行メタデータを検査します。
- **`before_compaction` / `after_compaction`**: Compaction サイクルを監視または注釈付けします。
- **`before_tool_call` / `after_tool_call`**: ツールのパラメーター/結果に介入します。
- **`before_install`**: 組み込みスキャンの検出結果を検査し、任意で skill または Plugin のインストールをブロックします。
- **`tool_result_persist`**: OpenClaw 所有のセッショントランスクリプトに書き込まれる前に、ツール結果を同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージフック。
- **`session_start` / `session_end`**: セッションライフサイクル境界。
- **`gateway_start` / `gateway_stop`**: Gateway ライフサイクルイベント。

送信/ツールガードのフック判定ルール:

- `before_tool_call`: `{ block: true }` は terminal であり、低優先度のハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は terminal であり、低優先度のハンドラーを停止します。
- `before_install`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は terminal であり、低優先度のハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、以前のキャンセルを解除しません。

フック API と登録の詳細については、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

ハーネスはこれらのフックを異なる形で適用する場合があります。Codex app-server ハーネスは、
ドキュメント化されたミラー対象サーフェスの互換性契約として OpenClaw Plugin フックを維持し、
Codex ネイティブフックは別個の低レベル Codex メカニズムのままです。

## ストリーミング + 部分返信

- assistant デルタは pi-agent-core からストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングは、`text_end` または `message_end` のいずれかで部分返信を発行できます。
- 推論ストリーミングは、別個のストリームとして、またはブロック返信として発行できます。
- チャンク化とブロック返信の挙動については、[ストリーミング](/ja-JP/concepts/streaming) を参照してください。

## ツール実行 + メッセージングツール

- ツールの start/update/end イベントは `tool` ストリームで発行されます。
- ツール結果は、ログ記録/発行の前にサイズと画像ペイロードについてサニタイズされます。
- メッセージングツールの送信は、assistant の重複確認を抑制するために追跡されます。

## 返信の整形 + 抑制

- 最終ペイロードは次から組み立てられます:
  - assistant テキスト（および任意の推論）
  - インラインツール要約（verbose + 許可時）
  - モデルエラー時の assistant エラーテキスト
- 厳密な無音トークン `NO_REPLY` / `no_reply` は送信
  ペイロードからフィルタリングされます。
- メッセージングツールの重複は最終ペイロードリストから削除されます。
- レンダリング可能なペイロードが残っておらず、ツールがエラーになった場合は、フォールバックのツールエラー返信が発行されます
  （メッセージングツールがすでにユーザーに見える返信を送信している場合を除く）。

## Compaction + 再試行

- 自動 Compaction は `compaction` ストリームイベントを発行し、再試行をトリガーする場合があります。
- 再試行時には、重複出力を避けるため、メモリ内バッファーとツール要約がリセットされます。
- Compaction パイプラインについては、[Compaction](/ja-JP/concepts/compaction) を参照してください。

## イベントストリーム（現在）

- `lifecycle`: `subscribeEmbeddedPiSession` によって発行される（および `agentCommand` によってフォールバックとして発行される）
- `assistant`: pi-agent-core からストリーミングされるデルタ
- `tool`: pi-agent-core からストリーミングされるツールイベント

## チャットチャネル処理

- assistant デルタはチャット `delta` メッセージにバッファリングされます。
- チャット `final` は **lifecycle end/error** で発行されます。

## タイムアウト

- `agent.wait` のデフォルト: 30 秒（待機のみ）。`timeoutMs` パラメーターでオーバーライドします。
- エージェントランタイム: `agents.defaults.timeoutSeconds` のデフォルトは 172800 秒（48 時間）。`runEmbeddedPiAgent` の中止タイマーで強制されます。
- Cron ランタイム: 分離されたエージェントターンの `timeoutSeconds` は cron が所有します。スケジューラーは実行開始時にそのタイマーを開始し、設定済みの期限で基礎となる実行を中止し、その後、タイムアウトを記録する前に境界付きクリーンアップを実行するため、古い子セッションがレーンを詰まらせ続けることはありません。
- セッション活性診断: 診断が有効な場合、`diagnostics.stuckSessionWarnMs` は、観測された返信、ツール、ステータス、ブロック、または ACP 進行状況がない長時間の `processing` セッションを分類します。アクティブな埋め込み実行、モデル呼び出し、ツール呼び出しは `session.long_running` として報告されます。最近の進行がないアクティブな作業は `session.stalled` として報告されます。`session.stuck` は、アクティブな作業がない古いセッション管理情報のために予約されており、その経路だけが影響を受けたセッションレーンを解放して、キューに入った起動作業を排出できるようにします。繰り返される `session.stuck` 診断は、セッションが変化しない間バックオフします。
- モデルアイドルタイムアウト: OpenClaw は、アイドルウィンドウ内に応答チャンクが到着しない場合、モデルリクエストを中止します。`models.providers.<id>.timeoutSeconds` は、遅いローカル/セルフホストプロバイダー向けにこのアイドルウォッチドッグを延長します。それ以外の場合、OpenClaw は `agents.defaults.timeoutSeconds` が設定されていればそれを使用し、デフォルトで 120 秒を上限とします。明示的なモデルまたはエージェントタイムアウトがない Cron トリガー実行では、アイドルウォッチドッグが無効化され、Cron の外側タイムアウトに依存します。
- プロバイダー HTTP リクエストタイムアウト: `models.providers.<id>.timeoutSeconds` は、そのプロバイダーのモデル HTTP fetch に適用されます。これには、接続、ヘッダー、本文、SDK リクエストタイムアウト、保護された fetch 全体の中止処理、モデルストリームアイドルウォッチドッグが含まれます。エージェントランタイム全体のタイムアウトを引き上げる前に、Ollama などの遅いローカル/セルフホストプロバイダーにこれを使用してください。

## 早期終了が起こり得る場所

- エージェントタイムアウト（中止）
- AbortSignal（キャンセル）
- Gateway 切断または RPC タイムアウト
- `agent.wait` タイムアウト（待機のみ、エージェントは停止しない）

## 関連

- [ツール](/ja-JP/tools) — 利用可能なエージェントツール
- [Hooks](/ja-JP/automation/hooks) — エージェントライフサイクルイベントでトリガーされるイベント駆動スクリプト
- [Compaction](/ja-JP/concepts/compaction) — 長い会話がどのように要約されるか
- [Exec 承認](/ja-JP/tools/exec-approvals) — シェルコマンド用の承認ゲート
- [Thinking](/ja-JP/tools/thinking) — thinking/reasoning レベル設定
