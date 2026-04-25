---
read_when:
    - エージェントを介してバックグラウンド/並列作業を行いたい場合
    - '`sessions_spawn` または sub-agent ツールポリシーを変更している場合'
    - スレッドに束縛された subagent セッションを実装またはトラブルシュートしている場合
summary: 'Sub-agent: 結果をリクエスターのチャットへ通知して返す、分離されたエージェント実行の起動'
title: Sub-agent
x-i18n:
    generated_at: "2026-04-25T18:22:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70195000c4326baba38a9a096dc8d6db178f754f345ad05d122902ee1216ab1c
    source_path: tools/subagents.md
    workflow: 15
---

Sub-agent は、既存のエージェント実行から起動されるバックグラウンドのエージェント実行です。独自のセッション（`agent:<agentId>:subagent:<uuid>`）で実行され、完了すると、その結果をリクエスターのチャットチャネルへ **通知** して返します。各 sub-agent 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

## スラッシュコマンド

現在のセッションの sub-agent 実行を確認または制御するには `/subagents` を使用します:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

スレッド束縛の制御:

これらのコマンドは、永続的なスレッド束縛をサポートするチャネルで機能します。下の **スレッド対応チャネル** を参照してください。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` は、実行メタデータ（ステータス、タイムスタンプ、セッション id、transcript パス、クリーンアップ）を表示します。
`sessions_history` は、境界付きで安全性フィルタ済みのリコール表示に使用してください。生の完全 transcript が必要な場合は、ディスク上の
transcript パスを確認してください。

### 起動動作

`/subagents spawn` は、内部リレーではなくユーザーコマンドとしてバックグラウンド sub-agent を開始し、実行完了時にリクエスターのチャットへ最終完了更新を 1 件送信します。

- spawn コマンドは非ブロッキングで、ただちに実行 id を返します。
- 完了時、sub-agent はリクエスターのチャットチャネルへサマリー/結果メッセージを通知します。
- 完了配信は push ベースです。起動後は、完了を待つためだけに
  `/subagents list`、`sessions_list`、または `sessions_history` をループでポーリングしないでください。
  ステータス確認は、デバッグや介入が必要なときにだけオンデマンドで行ってください。
- 完了時、OpenClaw は、その sub-agent セッションが開いた追跡対象ブラウザタブ/プロセスを、通知クリーンアップフローが続行する前にベストエフォートで閉じます。
- 手動 spawn では、配信は回復性があります:
  - OpenClaw はまず安定した冪等性キー付きで直接の `agent` 配信を試みます。
  - 直接配信が失敗した場合、キュールーティングへフォールバックします。
  - キュールーティングもまだ利用できない場合、通知は最終的にあきらめる前に短い指数バックオフで再試行されます。
- 完了配信は、解決済みのリクエスタールートを維持します:
  - 利用可能な場合、スレッド束縛または会話束縛の完了ルートが優先されます
  - 完了元がチャネルしか提供しない場合、OpenClaw はリクエスターセッションの解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足している target/account を補完するため、直接配信は引き続き機能します
- リクエスターセッションへの完了ハンドオフは、ランタイム生成の内部コンテキスト（ユーザー作成テキストではない）であり、以下を含みます:
  - `Result`（最新の可視 `assistant` 返信テキスト。なければサニタイズ済みの最新 `tool`/`toolResult` テキスト。終端失敗した実行ではキャプチャ済み返信テキストを再利用しません）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - コンパクトなランタイム/トークン統計
  - リクエスターエージェントに対して、通常の assistant 音声で書き直すよう指示する配信命令（生の内部メタデータを転送しない）
- `--model` と `--thinking` は、その特定の実行に対するデフォルトを上書きします。
- 完了後の詳細と出力を確認するには `info`/`log` を使用します。
- `/subagents spawn` はワンショットモード（`mode: "run"`）です。永続的なスレッド束縛セッションには、`thread: true` と `mode: "session"` を付けた `sessions_spawn` を使用してください。
- ACP harness セッション（Codex、Claude Code、Gemini CLI）には、`runtime: "acp"` を付けた `sessions_spawn` を使用し、完了や agent-to-agent ループをデバッグする場合は [ACP Agents](/ja-JP/tools/acp-agents)、特に [ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model) を参照してください。

主な目標:

- メイン実行をブロックせずに、「調査 / 長時間タスク / 遅いツール」作業を並列化する。
- sub-agent をデフォルトで分離状態に保つ（セッション分離 + 任意の sandbox 化）。
- ツール面を誤用しにくく保つ。sub-agent にはデフォルトでセッションツールは付与されません。
- オーケストレーターパターン向けに設定可能なネスト深度をサポートする。

コストに関する注意: 各 sub-agent はデフォルトで **独自の** コンテキストとトークン使用量を持ちます。重いタスクや
反復的なタスクでは、sub-agent にはより安価なモデルを設定し、メインエージェントは
高品質なモデルのままにしてください。これは `agents.defaults.subagents.model` またはエージェント単位の
オーバーライドで設定できます。子が本当にリクエスターの現在の transcript を必要とする場合、その起動時だけ
`context: "fork"` を要求できます。

## コンテキストモード

ネイティブ sub-agent は、呼び出し元が明示的に現在の
transcript の fork を要求しない限り、分離状態で開始されます。

| モード | 使用する場面 | 動作 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規の調査、独立した実装、遅いツール作業、またはタスクテキストで簡潔に指示できるもの | クリーンな子 transcript を作成します。これがデフォルトで、トークン使用量を低く保ちます。 |
| `fork` | 現在の会話、以前のツール結果、またはリクエスター transcript 内にすでにある細かな指示に依存する作業 | 子の開始前に、リクエスター transcript を子セッションへ分岐します。 |

`fork` は控えめに使用してください。これはコンテキスト依存の委譲用であり、
明確なタスクプロンプトを書く代替ではありません。

## ツール

`sessions_spawn` を使用します:

- sub-agent 実行を開始します（`deliver: false`、グローバルレーン: `subagent`）
- その後、通知ステップを実行し、通知返信をリクエスターのチャットチャネルへ投稿します
- デフォルトモデル: `agents.defaults.subagents.model`（またはエージェント単位の `agents.list[].subagents.model`）を設定していない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` がある場合はそれが優先されます。
- デフォルト thinking: `agents.defaults.subagents.thinking`（またはエージェント単位の `agents.list[].subagents.thinking`）を設定していない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` がある場合はそれが優先されます。
- デフォルト実行タイムアウト: `sessions_spawn.runTimeoutSeconds` が省略された場合、OpenClaw は設定されていれば `agents.defaults.subagents.runTimeoutSeconds` を使用し、そうでなければ `0`（タイムアウトなし）にフォールバックします。

ツールパラメータ:

- `task`（必須）
- `label?`（任意）
- `agentId?`（任意。許可されていれば別のエージェント id 配下で起動）
- `model?`（任意。sub-agent モデルを上書きします。無効な値はスキップされ、sub-agent はデフォルトモデルで実行され、警告がツール結果に表示されます）
- `thinking?`（任意。sub-agent 実行の thinking レベルを上書き）
- `runTimeoutSeconds?`（設定されていれば `agents.defaults.subagents.runTimeoutSeconds` がデフォルトで、そうでなければ `0`。設定時、sub-agent 実行は N 秒後に中止されます）
- `thread?`（デフォルト `false`。`true` の場合、この sub-agent セッションに対してチャネルスレッド束縛を要求）
- `mode?`（`run|session`）
  - デフォルトは `run`
  - `thread: true` で `mode` が省略された場合、デフォルトは `session` になります
  - `mode: "session"` には `thread: true` が必要です
- `cleanup?`（`delete|keep`、デフォルト `keep`）
- `sandbox?`（`inherit|require`、デフォルト `inherit`。`require` は、対象の子ランタイムが sandbox 化されていない限り起動を拒否します）
- `context?`（`isolated|fork`、デフォルト `isolated`。ネイティブ sub-agent のみ）
  - `isolated` はクリーンな子 transcript を作成し、これがデフォルトです。
  - `fork` はリクエスターの現在の transcript を子セッションへ分岐し、子が同じ会話コンテキストで開始できるようにします。
  - `fork` は、子が現在の transcript を必要とする場合にのみ使用してください。スコープが限定された作業では、`context` を省略してください。
- `sessions_spawn` はチャネル配信パラメータ（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、起動された実行から `message`/`sessions_send` を使用してください。

## スレッド束縛セッション

チャネルでスレッド束縛が有効な場合、sub-agent はスレッドに束縛されたままにでき、そのスレッド内の後続ユーザーメッセージは同じ sub-agent セッションへルーティングされ続けます。

### スレッド対応チャネル

- Discord（現在サポートされている唯一のチャネル）: 永続的なスレッド束縛 subagent セッション（`thread: true` を付けた `sessions_spawn`）、手動スレッド制御（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）、およびアダプターキー `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`、`channels.discord.threadBindings.spawnSubagentSessions` をサポートします。

簡単な流れ:

1. `thread: true`（必要なら `mode: "session"` も）を付けて `sessions_spawn` で起動します。
2. OpenClaw が、アクティブチャネル内のそのセッションターゲットにスレッドを作成または束縛します。
3. そのスレッド内の返信と後続メッセージは、束縛されたセッションへルーティングされます。
4. 非アクティブ時の自動 unfocus を確認/更新するには `/session idle` を、ハード上限を制御するには `/session max-age` を使用します。
5. 手動で切り離すには `/unfocus` を使用します。

手動制御:

- `/focus <target>` は、現在のスレッドを sub-agent/session ターゲットへ束縛します（または作成します）。
- `/unfocus` は、現在束縛されているスレッドの束縛を解除します。
- `/agents` は、アクティブな実行と束縛状態（`thread:<id>` または `unbound`）を一覧表示します。
- `/session idle` と `/session max-age` は、フォーカスされた束縛スレッドでのみ機能します。

設定スイッチ:

- グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- チャネルオーバーライドと spawn 自動束縛キーはアダプター固有です。上の **スレッド対応チャネル** を参照してください。

現在のアダプター詳細については [設定リファレンス](/ja-JP/gateway/configuration-reference) と [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

allowlist:

- `agents.list[].subagents.allowAgents`: `agentId` 経由でターゲットにできるエージェント id のリスト（任意を許可するには `["*"]`）。デフォルト: リクエスターエージェントのみ。
- `agents.defaults.subagents.allowAgents`: リクエスターエージェントが独自の `subagents.allowAgents` を設定していない場合に使われる、デフォルトのターゲットエージェント allowlist。
- sandbox 継承ガード: リクエスターセッションが sandbox 化されている場合、`sessions_spawn` は sandbox 化されないターゲットを拒否します。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制）。デフォルト: false。

検出:

- 現在 `sessions_spawn` に許可されているエージェント id を確認するには `agents_list` を使用します。

自動アーカイブ:

- sub-agent セッションは `agents.defaults.subagents.archiveAfterMinutes` 後に自動的にアーカイブされます（デフォルト: 60）。
- アーカイブは `sessions.delete` を使用し、transcript を `*.deleted.<timestamp>` にリネームします（同じフォルダー）。
- `cleanup: "delete"` は通知直後に即時アーカイブします（それでも transcript はリネームにより保持されます）。
- 自動アーカイブはベストエフォートであり、gateway が再起動すると保留中タイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブしません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは深さ 1 と深さ 2 のセッションに同様に適用されます。
- ブラウザクリーンアップはアーカイブクリーンアップとは別です。追跡対象ブラウザタブ/プロセスは、transcript/セッション記録が保持される場合でも、実行完了時にベストエフォートで閉じられます。

## ネストされた sub-agent

デフォルトでは、sub-agent は独自の sub-agent を起動できません（`maxSpawnDepth: 1`）。`maxSpawnDepth: 2` を設定すると 1 段階のネストを有効にでき、**オーケストレーターパターン** を可能にします: main → オーケストレーター sub-agent → ワーカー sub-sub-agent。

### 有効化方法

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 子を起動できるようにする（デフォルト: 1）
        maxChildrenPerAgent: 5, // エージェントセッションごとのアクティブな子の最大数（デフォルト: 5）
        maxConcurrent: 8, // グローバル同時実行レーン上限（デフォルト: 8）
        runTimeoutSeconds: 900, // 省略時の sessions_spawn のデフォルトタイムアウト（0 = タイムアウトなし）
      },
    },
  },
}
```

### 深さレベル

| 深さ | セッションキー形状 | 役割 | 起動できるか |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0 | `agent:<id>:main` | メインエージェント | 常に可能 |
| 1 | `agent:<id>:subagent:<uuid>` | Sub-agent（深さ 2 が許可されている場合はオーケストレーター） | `maxSpawnDepth >= 2` の場合のみ |
| 2 | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | sub-sub-agent（末端ワーカー） | 不可 |

### 通知チェーン

結果はチェーンを上って戻ります:

1. 深さ 2 のワーカーが完了 → 親（深さ 1 のオーケストレーター）へ通知
2. 深さ 1 のオーケストレーターが通知を受信し、結果を統合して完了 → main へ通知
3. メインエージェントが通知を受信し、ユーザーへ配信

各レベルは、自身の直接の子からの通知のみを確認します。

運用ガイダンス:

- 子の作業は一度開始したら、`sessions_list`、`sessions_history`、`/subagents list`、または
  `exec` の sleep コマンドの周囲にポーリングループを組むのではなく、完了イベントを待ってください。
- `sessions_list` と `/subagents list` は、子セッション関係をライブ作業に集中させます:
  ライブな子は紐付いたまま、終了済みの子は短い直近ウィンドウの間だけ表示され、
  store のみにある古い子リンクは鮮度ウィンドウ経過後に無視されます。これにより、古い `spawnedBy` / `parentSessionKey` メタデータが再起動後にゴーストの子を復活させるのを防ぎます。
- 最終回答をすでに送信した後に子の完了イベントが届いた場合、
  正しいフォローアップは、完全一致の無音トークン `NO_REPLY` / `no_reply` です。

### 深さごとのツールポリシー

- 役割と制御スコープは起動時にセッションメタデータへ書き込まれます。これにより、フラット化または復元されたセッションキーが誤ってオーケストレーター権限を再取得するのを防ぎます。
- **深さ 1（オーケストレーター、`maxSpawnDepth >= 2` の場合）**: 自身の子を管理できるよう、`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。その他の session/system ツールは引き続き拒否されます。
- **深さ 1（リーフ、`maxSpawnDepth == 1` の場合）**: session ツールなし（現在のデフォルト動作）。
- **深さ 2（リーフワーカー）**: session ツールなし — 深さ 2 では `sessions_spawn` は常に拒否されます。これ以上の子は起動できません。

### エージェントごとの起動上限

各エージェントセッション（どの深さでも）は、一度に最大 `maxChildrenPerAgent`（デフォルト: 5）個のアクティブな子を持てます。これにより、単一オーケストレーターからの暴走的なファンアウトを防ぎます。

### カスケード停止

深さ 1 のオーケストレーターを停止すると、その深さ 2 の子も自動的にすべて停止します:

- メインチャットで `/stop` を実行すると、すべての深さ 1 エージェントが停止し、その深さ 2 の子へもカスケードします。
- `/subagents kill <id>` は特定の sub-agent を停止し、その子へもカスケードします。
- `/subagents kill all` は、リクエスターのすべての sub-agent を停止し、カスケードします。

## 認証

sub-agent の認証は、セッション種別ではなく **エージェント id** で解決されます:

- sub-agent セッションキーは `agent:<agentId>:subagent:<uuid>` です。
- auth ストアは、そのエージェントの `agentDir` から読み込まれます。
- メインエージェントの auth profile は **フォールバック** としてマージされます。競合時はエージェント profile がメイン profile を上書きします。

注意: このマージは追加的なので、メイン profile は常にフォールバックとして利用可能です。エージェントごとに完全に分離された認証は、まだサポートされていません。

## 通知

sub-agent は通知ステップを介して結果を返します:

- 通知ステップは、リクエスターセッションではなく sub-agent セッション内で実行されます。
- sub-agent が正確に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新の assistant テキストが完全一致の無音トークン `NO_REPLY` / `no_reply` の場合、
  以前に可視の進捗が存在していても通知出力は抑制されます。
- それ以外では、配信はリクエスターの深さに依存します:
  - トップレベルのリクエスターセッションでは、外部配信付きの追従 `agent` 呼び出し（`deliver=true`）を使用します
  - ネストされたリクエスター subagent セッションでは、オーケストレーターがセッション内で子結果を統合できるよう、内部追従注入（`deliver=false`）を受け取ります
  - ネストされたリクエスター subagent セッションが消失している場合、OpenClaw は可能であればそのセッションのリクエスターへフォールバックします
- トップレベルのリクエスターセッションでは、完了モードの直接配信はまず束縛された会話/スレッドルートとフックオーバーライドを解決し、その後リクエスターセッションの保存済みルートから不足するチャネルターゲットフィールドを補完します。これにより、完了元がチャネルしか識別しない場合でも、完了は正しいチャット/トピックに維持されます。
- ネストされた完了検出を構築する際の子完了集約は、現在のリクエスター実行にスコープされるため、古い実行の子出力が現在の通知へ漏れるのを防ぎます。
- 通知返信は、チャネルアダプターで利用可能な場合、スレッド/トピックルーティングを保持します。
- 通知コンテキストは、安定した内部イベントブロックに正規化されます:
  - ソース（`subagent` または `cron`）
  - 子セッションキー/id
  - 通知種別 + タスクラベル
  - ランタイム結果から導かれたステータス行（`success`、`error`、`timeout`、または `unknown`）
  - 最新の可視 assistant テキストから選ばれた結果内容。なければサニタイズ済みの最新 `tool`/`toolResult` テキスト。終端失敗した実行は、キャプチャ済み返信テキストを再生せず失敗ステータスを報告します
  - 返信すべきか無言でいるべきかを説明する追従命令
- `Status` はモデル出力から推測されるものではなく、ランタイム結果シグナルから取得されます。
- タイムアウト時、子がツール呼び出しまでしか進んでいない場合、通知は生のツール出力を再生する代わりに、その履歴を短い部分進捗サマリーへ要約することがあります。

通知ペイロードには、末尾に統計行が含まれます（ラップされている場合でも）:

- Runtime（例: `runtime 5m12s`）
- トークン使用量（input/output/total）
- モデル価格設定が構成されている場合の推定コスト（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId`、transcript パス（メインエージェントが `sessions_history` で履歴を取得したり、ディスク上のファイルを確認したりできるようにするため）
- 内部メタデータはオーケストレーション専用です。ユーザー向け返信は通常の assistant 音声で書き直すべきです。

`sessions_history` は、より安全なオーケストレーションパスです:

- assistant のリコールは最初に正規化されます:
  - thinking タグは除去されます
  - `<relevant-memories>` / `<relevant_memories>` の足場ブロックは除去されます
  - `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、および
    `<function_calls>...</function_calls>` のようなプレーンテキストのツール呼び出し XML ペイロードブロックは、きれいに閉じていない切り詰められた
    ペイロードも含めて除去されます
  - 格下げされたツール呼び出し/結果の足場と historical-context マーカーは除去されます
  - `<|assistant|>` のような漏洩したモデル制御トークン、その他の ASCII
    `<|...|>` トークン、および全角の `<｜...｜>` 変種は除去されます
  - 不正な MiniMax ツール呼び出し XML は除去されます
- 認証情報/トークンらしきテキストはマスクされます
- 長いブロックは切り詰められることがあります
- 非常に大きな履歴では、古い行が落とされたり、過大な行が
  `[sessions_history omitted: message too large]` に置き換えられたりすることがあります
- 完全なバイト単位の transcript が必要な場合のフォールバックは、生のディスク上 transcript の確認です

## ツールポリシー（sub-agent ツール）

sub-agent は、まず親または対象
エージェントと同じ profile およびツールポリシーパイプラインを使用します。その後、
OpenClaw は sub-agent 制限レイヤーを適用します。

制限的な `tools.profile` がない場合、sub-agent は **session
ツール** と system ツールを除くすべてのツールを取得します:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

ここでも `sessions_history` は境界付きでサニタイズ済みのリコール表示であり、
生の transcript ダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーター sub-agent は、自身の子を管理できるよう、さらに `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。

設定による上書き:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` は最終的な allow-only フィルターです。これは
すでに解決済みのツールセットを狭めることはできますが、
`tools.profile` によって除去されたツールを戻すことはできません。たとえば、
`tools.profile: "coding"` には `web_search`/`web_fetch` が含まれますが、
`browser` ツールは含まれません。coding profile の
sub-agent にブラウザ自動化を使わせるには、profile 段階で browser を追加します:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

1 つのエージェントだけにブラウザ自動化を与えるには、エージェント単位の `agents.list[].tools.alsoAllow: ["browser"]` を使用してください。

## 同時実行

sub-agent は専用のインプロセスキューレーンを使用します:

- レーン名: `subagent`
- 同時実行数: `agents.defaults.subagents.maxConcurrent`（デフォルト `8`）

## 生存性と復旧

OpenClaw は、`endedAt` がないことを sub-agent
がまだ生存している恒久的な証拠とはみなしません。stale-run ウィンドウより古い
未終了実行は、`/subagents list`、ステータスサマリー、子孫完了
ゲーティング、およびセッション単位の同時実行チェックで、アクティブ/保留として数えられなくなります。

gateway の再起動後、古い未終了の復元実行は、その
子セッションに `abortedLastRun: true` が付いていない限りプルーニングされます。それらの再起動中断子
セッションは sub-agent 孤児復旧フローを通じて復旧可能なままで、このフローは
中断マーカーを消去する前に合成された再開メッセージを送信します。

## 停止

- リクエスターのチャットで `/stop` を送信すると、リクエスターセッションを中止し、そこから起動されたアクティブな sub-agent 実行を停止し、ネストされた子へカスケードします。
- `/subagents kill <id>` は特定の sub-agent を停止し、その子へもカスケードします。

## 制限事項

- Sub-agent 通知は **ベストエフォート** です。gateway が再起動すると、保留中の「通知返送」作業は失われます。
- sub-agent は依然として同じ gateway プロセス資源を共有します。`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- sub-agent コンテキストが注入するのは `AGENTS.md` + `TOOLS.md` のみです（`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は含みません）。
- 最大ネスト深度は 5 です（`maxSpawnDepth` 範囲: 1–5）。ほとんどの用途では深さ 2 を推奨します。
- `maxChildrenPerAgent` はセッションごとのアクティブな子数を制限します（デフォルト: 5、範囲: 1–20）。

## 関連

- [ACP agents](/ja-JP/tools/acp-agents)
- [マルチエージェント sandbox ツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [Agent send](/ja-JP/tools/agent-send)
