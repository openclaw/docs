---
read_when:
    - エージェントループまたはライフサイクルイベントの正確なウォークスルーが必要です
    - セッションのキューイング、トランスクリプト書き込み、またはセッション書き込みロックの動作を変更している
summary: エージェントループのライフサイクル、ストリーム、待機セマンティクス
title: エージェントループ
x-i18n:
    generated_at: "2026-06-27T11:05:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

エージェント型ループは、エージェントの完全な「実際の」実行です: 受け付け → コンテキスト組み立て → モデル推論 →
ツール実行 → ストリーミング返信 → 永続化。これは、セッション状態の一貫性を保ちながら、メッセージを
アクションと最終返信に変換する権威ある経路です。

OpenClaw では、ループはセッションごとに単一で直列化された実行であり、モデルが思考し、ツールを呼び出し、
出力をストリーミングする間にライフサイクルイベントとストリームイベントを発行します。このドキュメントでは、
その本物のループがエンドツーエンドでどのように配線されているかを説明します。

## エントリーポイント

- Gateway RPC: `agent` と `agent.wait`。
- CLI: `agent` コマンド。

## 仕組み（概要）

1. `agent` RPC がパラメーターを検証し、セッション（sessionKey/sessionId）を解決し、セッションメタデータを永続化して、`{ runId, acceptedAt }` を即座に返します。
2. `agentCommand` がエージェントを実行します:
   - モデル + thinking/verbose/trace のデフォルトを解決する
   - Skills スナップショットを読み込む
   - `runEmbeddedAgent`（OpenClaw エージェントランタイム）を呼び出す
   - 組み込みループが発行しない場合は **ライフサイクル end/error** を発行する
3. `runEmbeddedAgent`:
   - セッション単位 + グローバルキューによって実行を直列化する
   - モデル + 認証プロファイルを解決し、OpenClaw セッションを構築する
   - ランタイムイベントを購読し、assistant/tool デルタをストリーミングする
   - タイムアウトを強制する -> 超過した場合は実行を中止する
   - Codex app-server ターンでは、terminal イベントの前に app-server 進捗の生成が止まった受理済みターンを中止する
   - ペイロード + 使用量メタデータを返す
4. `subscribeEmbeddedAgentSession` がエージェントランタイムイベントを OpenClaw `agent` ストリームへ橋渡しします:
   - ツールイベント => `stream: "tool"`
   - assistant デルタ => `stream: "assistant"`
   - ライフサイクルイベント => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` は `waitForAgentRun` を使用します:
   - `runId` の **ライフサイクル end/error** を待機する
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返す

## キューイング + 並行処理

- 実行はセッションキーごと（セッションレーン）に直列化され、必要に応じてグローバルレーンも通ります。
- これによりツール/セッションの競合を防ぎ、セッション履歴の一貫性を保ちます。
- メッセージングチャンネルは、このレーンシステムに投入されるキューモード（steer/followup/collect/interrupt）を選択できます。
  [Command Queue](/ja-JP/concepts/queue) を参照してください。
- トランスクリプト書き込みも、セッションファイル上のセッション書き込みロックで保護されます。このロックは
  プロセス対応かつファイルベースであるため、プロセス内キューを迂回する書き込み元や、別プロセスから来る
  書き込み元を検出できます。セッショントランスクリプト書き込み元は、セッションをビジーとして報告する前に
  最大 `session.writeLock.acquireTimeoutMs` まで待機します。デフォルトは `60000` ms です。
- セッション書き込みロックはデフォルトで非再入です。ヘルパーが 1 つの論理的な書き込み元を維持したまま
  同じロックの取得を意図的にネストする場合は、`allowReentrant: true` で明示的にオプトインする必要があります。

## セッション + ワークスペース準備

- ワークスペースが解決され作成されます。サンドボックス化された実行は、サンドボックスワークスペースルートへリダイレクトされることがあります。
- Skills が読み込まれ（またはスナップショットから再利用され）、env とプロンプトに注入されます。
- ブートストラップ/コンテキストファイルが解決され、システムプロンプトレポートに注入されます。
- セッション書き込みロックが取得され、ストリーミング前に `SessionManager` が開かれて準備されます。後続の
  トランスクリプト再書き込み、Compaction、切り詰め経路は、トランスクリプトファイルを開いたり変更したりする前に
  同じロックを取得する必要があります。

## プロンプト組み立て + システムプロンプト

- システムプロンプトは、OpenClaw のベースプロンプト、Skills プロンプト、ブートストラップコンテキスト、実行単位のオーバーライドから構築されます。
- モデル固有の制限と Compaction 予約トークンが強制されます。
- モデルが見る内容については [System prompt](/ja-JP/concepts/system-prompt) を参照してください。

## フックポイント（介入できる場所）

OpenClaw には 2 つのフックシステムがあります:

- **内部フック**（Gateway フック）: コマンドとライフサイクルイベント用のイベント駆動スクリプト。
- **Plugin フック**: エージェント/ツールのライフサイクルと Gateway パイプライン内の拡張ポイント。

### 内部フック（Gateway フック）

- **`agent:bootstrap`**: システムプロンプトが確定される前に、ブートストラップファイルの構築中に実行されます。
  これを使用してブートストラップコンテキストファイルを追加/削除します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、その他のコマンドイベント（Hooks ドキュメントを参照）。

設定と例については [Hooks](/ja-JP/automation/hooks) を参照してください。

### Plugin フック（エージェント + Gateway ライフサイクル）

これらはエージェントループまたは Gateway パイプライン内で実行されます:

- **`before_model_resolve`**: セッション前（`messages` なし）に実行され、モデル解決前にプロバイダー/モデルを決定論的にオーバーライドします。
- **`before_prompt_build`**: セッション読み込み後（`messages` あり）に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターンごとの動的テキストには `prependContext` を使用し、システムプロンプト空間に置くべき安定したガイダンスにはシステムコンテキストフィールドを使用します。
- **`before_agent_start`**: どちらのフェーズでも実行される可能性があるレガシー互換フックです。上記の明示的なフックを優先してください。
- **`before_agent_reply`**: インラインアクション後、LLM 呼び出し前に実行され、Plugin がターンを引き受けて合成返信を返したり、ターン全体を無音化したりできます。
- **`agent_end`**: 完了後に最終メッセージリストと実行メタデータを検査します。
- **`before_compaction` / `after_compaction`**: Compaction サイクルを観察または注釈付けします。
- **`before_tool_call` / `after_tool_call`**: ツールパラメーター/結果に介入します。
- **`before_install`**: オペレーターのインストールポリシー実行後、Plugin フックが現在の OpenClaw プロセスに読み込まれている場合に、ステージング済みの skill または Plugin インストール素材を検査します。
- **`tool_result_persist`**: OpenClaw 所有のセッショントランスクリプトに書き込まれる前に、ツール結果を同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージフック。
- **`session_start` / `session_end`**: セッションライフサイクル境界。
- **`gateway_start` / `gateway_stop`**: Gateway ライフサイクルイベント。

送信/ツールガードのフック判定ルール:

- `before_tool_call`: `{ block: true }` は terminal であり、低優先度ハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `before_install`: `{ block: true }` は terminal であり、低優先度ハンドラーを停止します。
- `before_install`: `{ block: false }` は no-op であり、以前の block を解除しません。
- CLI インストールと更新経路を対象にしなければならない、オペレーター所有のインストール許可/ブロック判定には、`before_install` ではなく `security.installPolicy` を使用します。
- `message_sending`: `{ cancel: true }` は terminal であり、低優先度ハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、以前の cancel を解除しません。

フック API と登録の詳細については [Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

ハーネスはこれらのフックを異なる方法で適応する場合があります。Codex app-server ハーネスは、
文書化されたミラーリング対象のサーフェスについては OpenClaw Plugin フックを互換性契約として維持し、
Codex ネイティブフックは別個の低レベル Codex メカニズムのままです。

## ストリーミング + 部分返信

- assistant デルタはエージェントランタイムからストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングは、`text_end` または `message_end` のいずれかで部分返信を発行できます。
- reasoning ストリーミングは、別ストリームとして、またはブロック返信として発行できます。
- チャンク化とブロック返信の動作については [Streaming](/ja-JP/concepts/streaming) を参照してください。

## ツール実行 + メッセージングツール

- ツール start/update/end イベントは `tool` ストリームで発行されます。
- ツール結果は、ログ記録/発行の前にサイズと画像ペイロードについてサニタイズされます。
- メッセージングツール送信は、assistant の重複確認を抑制するために追跡されます。

## 返信整形 + 抑制

- 最終ペイロードは以下から組み立てられます:
  - assistant テキスト（および任意の reasoning）
  - インラインツール要約（verbose + 許可されている場合）
  - モデルエラー時の assistant エラーテキスト
- 正確なサイレントトークン `NO_REPLY` / `no_reply` は、送信
  ペイロードからフィルターされます。
- メッセージングツールの重複は最終ペイロードリストから削除されます。
- レンダリング可能なペイロードが残っておらず、ツールがエラーになった場合は、フォールバックのツールエラー返信が発行されます
  （メッセージングツールがすでにユーザーに見える返信を送信している場合を除く）。

## Compaction + 再試行

- 自動 Compaction は `compaction` ストリームイベントを発行し、再試行をトリガーできます。
- 再試行時には、重複出力を避けるためにメモリ内バッファーとツール要約がリセットされます。
- Compaction パイプラインについては [Compaction](/ja-JP/concepts/compaction) を参照してください。

## イベントストリーム（現在）

- `lifecycle`: `subscribeEmbeddedAgentSession` によって発行されます（また、`agentCommand` によるフォールバックとしても発行されます）
- `assistant`: エージェントランタイムからのストリーミングされたデルタ
- `tool`: エージェントランタイムからのストリーミングされたツールイベント

## チャットチャンネル処理

- assistant デルタはチャット `delta` メッセージへバッファリングされます。
- **ライフサイクル end/error** でチャット `final` が発行されます。

## タイムアウト

- `agent.wait` のデフォルト: 30s（待機のみ）。`timeoutMs` パラメーターでオーバーライドします。
- エージェントランタイム: `agents.defaults.timeoutSeconds` のデフォルトは 172800s（48 時間）です。`runEmbeddedAgent` の中止タイマーで強制されます。
- Cron ランタイム: 隔離されたエージェントターンの `timeoutSeconds` は cron が所有します。スケジューラーは実行開始時にそのタイマーを開始し、設定済みデッドラインで基盤の実行を中止し、その後、古い子セッションがレーンを詰まらせたままにしないよう、タイムアウト記録前に境界付きクリーンアップを実行します。
- セッション生存性診断: 診断が有効な場合、`diagnostics.stuckSessionWarnMs` は、観測された返信、ツール、ステータス、ブロック、ACP 進捗がない長時間の `processing` セッションを分類します。アクティブな組み込み実行、モデル呼び出し、ツール呼び出しは `session.long_running` として報告されます。所有されている無音のモデル呼び出しも、遅いプロバイダーや非ストリーミングプロバイダーが早すぎる段階で停止と報告されないよう、`diagnostics.stuckSessionAbortMs` までは `session.long_running` のままです。最近の進捗がないアクティブ作業は `session.stalled` として報告されます。所有されているモデル呼び出しは中止しきい値以降に `session.stalled` へ切り替わり、所有者のない古いモデル/ツールアクティビティは long-running として隠されません。`session.stuck` は、所有者のない古いモデル/ツールアクティビティを伴うアイドル状態のキュー済みセッションを含む、回復可能な古いセッション簿記のために予約されています。古いセッション簿記は、回復ゲート通過直後に影響を受けるセッションレーンを解放します。停止した組み込み実行は、`diagnostics.stuckSessionAbortMs`（デフォルト: 少なくとも 5 分、かつ警告しきい値の 3 倍）後にのみ中止ドレインされるため、単に遅いだけの実行を打ち切らずにキュー済み作業を再開できます。回復は構造化された requested/completed outcome を発行し、診断状態は同じ processing generation がまだ現在のものである場合にのみ idle とマークされます。繰り返される `session.stuck` 診断は、セッションが変化しない間バックオフします。
- モデルアイドルタイムアウト: OpenClaw は、アイドルウィンドウまでにレスポンスチャンクが到着しない場合、モデルリクエストを中止します。`models.providers.<id>.timeoutSeconds` は遅いローカル/セルフホストプロバイダー向けにこのアイドルウォッチドッグを延長しますが、エージェント実行全体を制御する、より低い `agents.defaults.timeoutSeconds` または実行固有のタイムアウトによって引き続き制限されます。それ以外の場合、OpenClaw は設定されていれば `agents.defaults.timeoutSeconds` を使用し、デフォルトで 120s に制限します。明示的なモデルまたはエージェントタイムアウトがない Cron トリガーのクラウドモデル実行は、同じデフォルトのアイドルウォッチドッグを使用します。明示的な cron 実行タイムアウトがある場合、クラウドモデルストリームの停止は 60s に制限されるため、外側の cron デッドライン前に設定済みモデルフォールバックを実行できます。Cron トリガーのローカルまたはセルフホストモデル実行は、明示的なタイムアウトが設定されていない限り暗黙のウォッチドッグを無効化します。また、明示的な cron 実行タイムアウトはローカル/セルフホストプロバイダーのアイドルウィンドウのままなので、遅いローカルプロバイダーは `models.providers.<id>.timeoutSeconds` を設定する必要があります。
- プロバイダー HTTP リクエストタイムアウト: `models.providers.<id>.timeoutSeconds` は、そのプロバイダーのモデル HTTP fetch に適用されます。これには接続、ヘッダー、ボディ、SDK リクエストタイムアウト、合計 guarded-fetch 中止処理、モデルストリームアイドルウォッチドッグが含まれます。エージェントランタイム全体のタイムアウトを上げる前に、Ollama のような遅いローカル/セルフホストプロバイダーにはこれを使用し、モデルリクエストをより長く実行する必要がある場合は、エージェント/ランタイムタイムアウトを少なくとも同じ長さに保ってください。

## 早期終了が起こりうる場所

- エージェントタイムアウト（中止）
- AbortSignal（キャンセル）
- Gateway 切断または RPC タイムアウト
- `agent.wait` タイムアウト（待機のみ、エージェントは停止しない）

## 関連

- [ツール](/ja-JP/tools) — 利用可能なエージェントツール
- [フック](/ja-JP/automation/hooks) — エージェントのライフサイクルイベントでトリガーされるイベント駆動スクリプト
- [Compaction](/ja-JP/concepts/compaction) — 長い会話がどのように要約されるか
- [実行承認](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [思考](/ja-JP/tools/thinking) — 思考/推論レベルの設定
