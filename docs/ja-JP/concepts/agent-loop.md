---
read_when:
    - エージェントループまたはライフサイクルイベントの正確なウォークスルーが必要な場合
    - セッションのキューイング、トランスクリプト書き込み、またはセッション書き込みロックの動作を変更する場合
summary: エージェントループのライフサイクル、ストリーム、待機セマンティクス
title: エージェントループ
x-i18n:
    generated_at: "2026-04-30T05:06:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

エージェントループは、エージェントの完全な「実際の」実行です: 取り込み → コンテキスト組み立て → モデル推論 →
ツール実行 → ストリーミング返信 → 永続化。これは、セッション状態の一貫性を保ちながら、メッセージを
アクションと最終返信に変換する正規の経路です。

OpenClaw では、ループはセッションごとに1つの直列化された実行であり、モデルが思考し、ツールを呼び出し、
出力をストリーミングする間にライフサイクルイベントとストリームイベントを発行します。このドキュメントでは、その本物のループが
エンドツーエンドでどのように接続されているかを説明します。

## エントリーポイント

- Gateway RPC: `agent` と `agent.wait`。
- CLI: `agent` コマンド。

## 動作の概要

1. `agent` RPC はパラメータを検証し、セッション (sessionKey/sessionId) を解決し、セッションメタデータを永続化して、`{ runId, acceptedAt }` をすぐに返します。
2. `agentCommand` はエージェントを実行します:
   - モデル + thinking/verbose/trace のデフォルトを解決
   - Skills スナップショットを読み込み
   - `runEmbeddedPiAgent` (pi-agent-core ランタイム) を呼び出し
   - 組み込みループが発行しない場合は **lifecycle end/error** を発行
3. `runEmbeddedPiAgent`:
   - セッション単位 + グローバルキューによって実行を直列化
   - モデル + 認証プロファイルを解決し、pi セッションを構築
   - pi イベントを購読し、アシスタント/ツールの差分をストリーミング
   - タイムアウトを強制 -> 超過した場合は実行を中止
   - ペイロード + 使用量メタデータを返却
4. `subscribeEmbeddedPiSession` は pi-agent-core イベントを OpenClaw `agent` ストリームに橋渡しします:
   - ツールイベント => `stream: "tool"`
   - アシスタント差分 => `stream: "assistant"`
   - ライフサイクルイベント => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` は `waitForAgentRun` を使用します:
   - `runId` の **lifecycle end/error** を待機
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返却

## キューイング + 並行性

- 実行はセッションキーごと (セッションレーン)、および任意でグローバルレーン経由で直列化されます。
- これにより、ツール/セッションの競合を防ぎ、セッション履歴の一貫性を保ちます。
- メッセージングチャネルは、このレーンシステムに入力するキューモード (collect/steer/followup) を選択できます。
  [Command Queue](/ja-JP/concepts/queue) を参照してください。
- トランスクリプト書き込みも、セッションファイル上のセッション書き込みロックによって保護されます。このロックは
  プロセスを認識し、ファイルベースであるため、インプロセスキューを迂回する書き込みや
  別プロセスからの書き込みも捕捉します。
- セッション書き込みロックは、デフォルトでは再入不可です。ヘルパーが1つの論理的な書き込み元を保ちながら
  同じロックの取得を意図的にネストする場合は、明示的に
  `allowReentrant: true` でオプトインする必要があります。

## セッション + ワークスペースの準備

- ワークスペースが解決され作成されます。サンドボックス化された実行では、サンドボックスワークスペースルートにリダイレクトされる場合があります。
- Skills が読み込まれ (またはスナップショットから再利用され)、env とプロンプトに注入されます。
- ブートストラップ/コンテキストファイルが解決され、システムプロンプトレポートに注入されます。
- セッション書き込みロックが取得されます。ストリーミング前に `SessionManager` が開かれ準備されます。以降の
  トランスクリプトの再書き込み、Compaction、切り詰めの経路では、トランスクリプトファイルを開く前、または
  変更する前に同じロックを取得する必要があります。

## プロンプト組み立て + システムプロンプト

- システムプロンプトは、OpenClaw のベースプロンプト、Skills プロンプト、ブートストラップコンテキスト、実行単位のオーバーライドから構築されます。
- モデル固有の制限と Compaction 予約トークンが強制されます。
- モデルが見る内容については [System prompt](/ja-JP/concepts/system-prompt) を参照してください。

## フックポイント (介入できる場所)

OpenClaw には2つのフックシステムがあります:

- **内部フック** (Gateway フック): コマンドとライフサイクルイベント用のイベント駆動スクリプト。
- **Plugin フック**: エージェント/ツールのライフサイクルと Gateway パイプライン内の拡張ポイント。

### 内部フック (Gateway フック)

- **`agent:bootstrap`**: システムプロンプトが確定される前にブートストラップファイルを構築している間に実行されます。
  ブートストラップコンテキストファイルを追加/削除するために使用します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、その他のコマンドイベント (Hooks ドキュメントを参照)。

設定と例については [Hooks](/ja-JP/automation/hooks) を参照してください。

### Plugin フック (エージェント + Gateway ライフサイクル)

これらはエージェントループまたは Gateway パイプライン内で実行されます:

- **`before_model_resolve`**: セッション前 (`messages` なし) に実行され、モデル解決前にプロバイダー/モデルを決定論的にオーバーライドします。
- **`before_prompt_build`**: セッション読み込み後 (`messages` あり) に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターン単位の動的テキストには `prependContext` を使用し、システムプロンプト領域に置くべき安定したガイダンスにはシステムコンテキストフィールドを使用します。
- **`before_agent_start`**: どちらのフェーズでも実行される可能性があるレガシー互換フックです。上記の明示的なフックを優先してください。
- **`before_agent_reply`**: インラインアクション後、LLM 呼び出し前に実行され、Plugin がターンを引き受けて合成返信を返す、またはターン全体を無音化できます。
- **`agent_end`**: 完了後に最終メッセージリストと実行メタデータを調査します。
- **`before_compaction` / `after_compaction`**: Compaction サイクルを観察または注釈付けします。
- **`before_tool_call` / `after_tool_call`**: ツールのパラメータ/結果に介入します。
- **`before_install`**: 組み込みスキャン結果を調査し、任意で Skills または Plugin のインストールをブロックします。
- **`tool_result_persist`**: ツール結果が OpenClaw 所有のセッショントランスクリプトに書き込まれる前に、同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージフック。
- **`session_start` / `session_end`**: セッションライフサイクル境界。
- **`gateway_start` / `gateway_stop`**: Gateway ライフサイクルイベント。

送信/ツールガードのフック判定ルール:

- `before_tool_call`: `{ block: true }` は終端であり、より低い優先度のハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端であり、より低い優先度のハンドラーを停止します。
- `before_install`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端であり、より低い優先度のハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、以前のキャンセルを解除しません。

フック API と登録の詳細については [Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

ハーネスはこれらのフックを異なる形で適応する場合があります。Codex app-server ハーネスは、ドキュメント化されたミラー
サーフェスの互換性契約として OpenClaw Plugin フックを維持します。一方で Codex ネイティブフックは、
別の低レベル Codex 機構のままです。

## ストリーミング + 部分返信

- アシスタント差分は pi-agent-core からストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングは、`text_end` または `message_end` で部分返信を発行できます。
- 推論ストリーミングは、別個のストリームとして、またはブロック返信として発行できます。
- チャンク化とブロック返信の動作については [Streaming](/ja-JP/concepts/streaming) を参照してください。

## ツール実行 + メッセージングツール

- ツール開始/更新/終了イベントは `tool` ストリームで発行されます。
- ツール結果は、ログ記録/発行の前にサイズと画像ペイロードについてサニタイズされます。
- メッセージングツール送信は、重複したアシスタント確認を抑制するために追跡されます。

## 返信の整形 + 抑制

- 最終ペイロードは次から組み立てられます:
  - アシスタントテキスト (および任意の推論)
  - インラインツール要約 (verbose + 許可されている場合)
  - モデルエラー時のアシスタントエラーテキスト
- 正確な無音トークン `NO_REPLY` / `no_reply` は、送信
  ペイロードから除外されます。
- メッセージングツールの重複は最終ペイロードリストから削除されます。
- レンダリング可能なペイロードが残らず、ツールでエラーが発生した場合は、フォールバックのツールエラー返信が発行されます
  (メッセージングツールがすでにユーザーに見える返信を送信している場合を除く)。

## Compaction + リトライ

- 自動 Compaction は `compaction` ストリームイベントを発行し、リトライをトリガーする場合があります。
- リトライ時には、重複出力を避けるため、インメモリバッファとツール要約がリセットされます。
- Compaction パイプラインについては [Compaction](/ja-JP/concepts/compaction) を参照してください。

## イベントストリーム (現在)

- `lifecycle`: `subscribeEmbeddedPiSession` によって発行されます (`agentCommand` によるフォールバックもあります)
- `assistant`: pi-agent-core からのストリーミング差分
- `tool`: pi-agent-core からのストリーミングツールイベント

## チャットチャネル処理

- アシスタント差分はチャット `delta` メッセージにバッファされます。
- チャット `final` は **lifecycle end/error** で発行されます。

## タイムアウト

- `agent.wait` デフォルト: 30秒 (待機のみ)。`timeoutMs` パラメータで上書きします。
- エージェントランタイム: `agents.defaults.timeoutSeconds` のデフォルトは 172800秒 (48時間)。`runEmbeddedPiAgent` の中止タイマーで強制されます。
- Cron ランタイム: 分離されたエージェントターン `timeoutSeconds` は cron が所有します。スケジューラーは実行開始時にそのタイマーを開始し、設定された期限で基盤の実行を中止し、その後、タイムアウトを記録する前に有界クリーンアップを実行します。これにより、古い子セッションがレーンを詰まらせ続けることを防ぎます。
- 停滞セッションの回復: diagnostics が有効な場合、`diagnostics.stuckSessionWarnMs` は長時間 `processing` のセッションを検出します。アクティブな組み込み実行、アクティブな返信操作、アクティブなセッションレーンタスクはデフォルトで警告のみです。diagnostics がそのセッションにアクティブな作業がないことを示す場合、watchdog は影響を受けたセッションレーンを解放し、キューに入った起動作業を排出できるようにします。
- モデルアイドルタイムアウト: アイドルウィンドウ内にレスポンスチャンクが到着しない場合、OpenClaw はモデルリクエストを中止します。`models.providers.<id>.timeoutSeconds` は、遅いローカル/セルフホストプロバイダー向けにこのアイドル watchdog を延長します。それ以外の場合、OpenClaw は設定されていれば `agents.defaults.timeoutSeconds` を使用し、デフォルトでは最大 120秒に制限します。明示的なモデルまたはエージェントタイムアウトがない Cron トリガー実行では、アイドル watchdog が無効になり、cron の外側のタイムアウトに依存します。
- プロバイダー HTTP リクエストタイムアウト: `models.providers.<id>.timeoutSeconds` は、そのプロバイダーのモデル HTTP fetch に適用されます。これには接続、ヘッダー、本文、SDK リクエストタイムアウト、合計 guarded-fetch 中止処理、モデルストリームアイドル watchdog が含まれます。エージェントランタイム全体のタイムアウトを引き上げる前に、Ollama などの遅いローカル/セルフホストプロバイダーにこれを使用してください。

## 早期終了する可能性がある場所

- エージェントタイムアウト (中止)
- AbortSignal (キャンセル)
- Gateway 切断または RPC タイムアウト
- `agent.wait` タイムアウト (待機のみ、エージェントは停止しない)

## 関連

- [Tools](/ja-JP/tools) — 利用可能なエージェントツール
- [Hooks](/ja-JP/automation/hooks) — エージェントライフサイクルイベントによってトリガーされるイベント駆動スクリプト
- [Compaction](/ja-JP/concepts/compaction) — 長い会話が要約される仕組み
- [Exec Approvals](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Thinking](/ja-JP/tools/thinking) — thinking/reasoning レベル設定
