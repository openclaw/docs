---
read_when:
    - エージェントループまたはライフサイクルイベントの正確な説明が必要です
    - セッションキューイング、トランスクリプト書き込み、またはセッション書き込みロックの挙動を変更しています
summary: エージェントループのライフサイクル、ストリーム、待機セマンティクス
title: エージェントループ
x-i18n:
    generated_at: "2026-04-24T04:52:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# エージェントループ（OpenClaw）

エージェントループは、エージェントの完全な「本物の」実行です: 受け付け → コンテキスト組み立て → モデル推論 →
ツール実行 → ストリーミング返信 → 永続化。これは、セッション状態の一貫性を保ちながら、
メッセージをアクションと最終返信に変換するための正式な経路です。

OpenClaw では、ループはセッションごとに 1 つの直列化された実行であり、モデルが考え、
ツールを呼び出し、出力をストリーミングする中で、ライフサイクルイベントとストリームイベントを発行します。このドキュメントでは、
その本物のループがエンドツーエンドでどのように接続されているかを説明します。

## エントリーポイント

- Gateway RPC: `agent` と `agent.wait`
- CLI: `agent` コマンド

## 仕組み（高レベル）

1. `agent` RPC はパラメーターを検証し、セッション（sessionKey/sessionId）を解決し、セッションメタデータを永続化し、即座に `{ runId, acceptedAt }` を返します。
2. `agentCommand` がエージェントを実行します:
   - モデル + thinking/verbose/trace のデフォルトを解決する
   - Skills スナップショットを読み込む
   - `runEmbeddedPiAgent`（pi-agent-core ランタイム）を呼び出す
   - 埋め込みループが発行しなかった場合は **lifecycle end/error** を発行する
3. `runEmbeddedPiAgent`:
   - セッション単位 + グローバルキューを通じて実行を直列化する
   - モデル + auth profile を解決し、pi セッションを構築する
   - pi イベントを購読し、assistant/tool の差分をストリーミングする
   - タイムアウトを強制し、超過時は実行を abort する
   - ペイロード + 使用状況メタデータを返す
4. `subscribeEmbeddedPiSession` は、pi-agent-core イベントを OpenClaw の `agent` ストリームへ橋渡しします:
   - ツールイベント => `stream: "tool"`
   - assistant 差分 => `stream: "assistant"`
   - ライフサイクルイベント => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` は `waitForAgentRun` を使用します:
   - `runId` に対する **lifecycle end/error** を待機する
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返す

## キューイング + 並行性

- 実行は、セッションキーごと（セッションレーン）に直列化され、必要に応じてグローバルレーンも通ります。
- これによりツール/セッションの競合を防ぎ、セッション履歴の一貫性を保ちます。
- メッセージングチャンネルは、このレーンシステムに流し込まれるキューモード（collect/steer/followup）を選択できます。
  詳しくは [Command Queue](/ja-JP/concepts/queue) を参照してください。
- トランスクリプト書き込みも、セッションファイル上のセッション書き込みロックで保護されます。このロックは
  プロセス認識型かつファイルベースなので、プロセス内キューを迂回する書き込みや、別プロセスからの書き込みも
  捕捉できます。
- セッション書き込みロックは、デフォルトでは再入不可です。1 つの論理ライターを維持したまま
  同じロックの取得をネストさせるヘルパーは、`allowReentrant: true` で明示的にオプトインする必要があります。

## セッション + ワークスペース準備

- ワークスペースは解決されて作成されます。サンドボックス実行では、サンドボックスワークスペースルートにリダイレクトされる場合があります。
- Skills が読み込まれ（またはスナップショットから再利用され）、env とプロンプトに注入されます。
- bootstrap/context ファイルが解決され、system prompt レポートに注入されます。
- セッション書き込みロックが取得され、`SessionManager` はストリーミング前に開かれて準備されます。後続の
  トランスクリプト書き換え、Compaction、または切り詰め経路は、トランスクリプトファイルを開く前または変更する前に、
  同じロックを取得しなければなりません。

## プロンプト組み立て + system prompt

- system prompt は、OpenClaw のベースプロンプト、Skills プロンプト、bootstrap コンテキスト、実行ごとの上書きから構築されます。
- モデル固有の制限と Compaction 予約トークンが適用されます。
- モデルが何を見るかについては、[System prompt](/ja-JP/concepts/system-prompt) を参照してください。

## フックポイント（介入できる場所）

OpenClaw には 2 種類のフックシステムがあります。

- **内部フック**（Gateway フック）: コマンドとライフサイクルイベントのためのイベント駆動スクリプト
- **Plugin フック**: エージェント/ツールのライフサイクルと Gateway パイプライン内の拡張ポイント

### 内部フック（Gateway フック）

- **`agent:bootstrap`**: system prompt が確定する前に bootstrap ファイルを構築している間に実行されます。
  これを使って bootstrap コンテキストファイルを追加/削除します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、その他のコマンドイベント（詳細は Hooks ドキュメントを参照）

セットアップと例については、[Hooks](/ja-JP/automation/hooks) を参照してください。

### Plugin フック（agent + gateway lifecycle）

これらはエージェントループまたは Gateway パイプライン内で実行されます。

- **`before_model_resolve`**: モデル解決前にセッション前（`messages` なし）で実行され、provider/model を決定論的に上書きします。
- **`before_prompt_build`**: セッション読み込み後（`messages` あり）に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターンごとの動的テキストには `prependContext` を、system prompt 空間に置くべき安定したガイダンスには system-context フィールドを使用してください。
- **`before_agent_start`**: レガシー互換フックで、どちらのフェーズでも実行される可能性があります。明示的な上記フックを優先してください。
- **`before_agent_reply`**: インラインアクション後、LLM 呼び出し前に実行され、Plugin がターンを引き受けて合成返信を返したり、そのターンを完全に無音化したりできます。
- **`agent_end`**: 完了後に最終メッセージ一覧と実行メタデータを確認します。
- **`before_compaction` / `after_compaction`**: Compaction サイクルを観察または注釈付けします。
- **`before_tool_call` / `after_tool_call`**: ツールのパラメーター/結果に介入します。
- **`before_install`**: 内蔵スキャン結果を確認し、必要に応じて skill または Plugin のインストールをブロックします。
- **`tool_result_persist`**: OpenClaw 所有のセッショントランスクリプトに書き込まれる前に、ツール結果を同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージフック。
- **`session_start` / `session_end`**: セッションライフサイクル境界。
- **`gateway_start` / `gateway_stop`**: Gateway ライフサイクルイベント。

送信/ツールガード向けのフック判定ルール:

- `before_tool_call`: `{ block: true }` は終端であり、低優先度ハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `before_install`: `{ block: true }` は終端であり、低優先度ハンドラーを停止します。
- `before_install`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `message_sending`: `{ cancel: true }` は終端であり、低優先度ハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、以前の cancel を解除しません。

フック API と登録の詳細については、[Plugin フック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。

ハーネスによって、これらのフックの適応方法は異なる場合があります。Codex app-server ハーネスは、
文書化されたミラー対象サーフェスの互換契約として OpenClaw Plugin フックを維持しますが、
Codex ネイティブフックは別の低レベルな Codex メカニズムのままです。

## ストリーミング + 部分返信

- assistant 差分は pi-agent-core からストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングは、`text_end` または `message_end` で部分返信を発行できます。
- Reasoning ストリーミングは、別ストリームとして、またはブロック返信として発行できます。
- チャンク化とブロック返信の動作については、[Streaming](/ja-JP/concepts/streaming) を参照してください。

## ツール実行 + メッセージングツール

- ツールの start/update/end イベントは `tool` ストリームで発行されます。
- ツール結果は、ログ/発行前にサイズと画像ペイロードに対してサニタイズされます。
- メッセージングツールの送信は追跡され、assistant による重複確認を抑制します。

## 返信整形 + 抑制

- 最終ペイロードは次から組み立てられます:
  - assistant テキスト（および任意の reasoning）
  - インラインツール要約（verbose + 許可時）
  - モデルエラー時の assistant エラーテキスト
- 完全一致の silent token `NO_REPLY` / `no_reply` は、送信ペイロードから
  フィルタされます。
- メッセージングツールの重複は、最終ペイロード一覧から削除されます。
- 描画可能な最終ペイロードが残らず、かつツールがエラーになった場合は、フォールバックのツールエラー返信が発行されます
  （ただし、メッセージングツールがすでにユーザー可視の返信を送っている場合を除く）。

## Compaction + リトライ

- 自動 Compaction は `compaction` ストリームイベントを発行し、リトライを引き起こす場合があります。
- リトライ時には、重複出力を避けるため、インメモリバッファとツール要約がリセットされます。
- Compaction パイプラインについては、[Compaction](/ja-JP/concepts/compaction) を参照してください。

## イベントストリーム（現時点）

- `lifecycle`: `subscribeEmbeddedPiSession` によって発行されます（およびフォールバックとして `agentCommand` からも発行）
- `assistant`: pi-agent-core からのストリーミング差分
- `tool`: pi-agent-core からのストリーミングツールイベント

## チャットチャンネル処理

- assistant 差分はチャットの `delta` メッセージにバッファされます。
- チャットの `final` は **lifecycle end/error** で発行されます。

## タイムアウト

- `agent.wait` のデフォルト: 30 秒（待機のみ）。`timeoutMs` パラメーターで上書きします。
- エージェントランタイム: `agents.defaults.timeoutSeconds` のデフォルトは 172800 秒（48 時間）。`runEmbeddedPiAgent` の abort タイマーで強制されます。
- LLM アイドルタイムアウト: `agents.defaults.llm.idleTimeoutSeconds` は、アイドルウィンドウ内に応答チャンクが到着しない場合にモデルリクエストを abort します。低速なローカルモデルや reasoning/tool-call プロバイダーでは明示的に設定してください。無効化するには 0 に設定します。未設定の場合、OpenClaw は `agents.defaults.timeoutSeconds` が設定されていればそれを使い、そうでなければ 120 秒を使用します。明示的な LLM またはエージェントタイムアウトがない Cron トリガー実行では、アイドルウォッチドッグは無効化され、Cron の外側タイムアウトに依存します。

## 途中で早期終了する可能性がある場所

- エージェントタイムアウト（abort）
- AbortSignal（cancel）
- Gateway 切断または RPC タイムアウト
- `agent.wait` タイムアウト（待機のみで、エージェントは停止しない）

## 関連

- [ツール](/ja-JP/tools) — 利用可能なエージェントツール
- [Hooks](/ja-JP/automation/hooks) — エージェントライフサイクルイベントでトリガーされるイベント駆動スクリプト
- [Compaction](/ja-JP/concepts/compaction) — 長い会話がどのように要約されるか
- [Exec 承認](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Thinking](/ja-JP/tools/thinking) — thinking/reasoning レベル設定
