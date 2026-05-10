---
read_when:
    - エージェント経由でバックグラウンド作業または並列作業を行いたい場合
    - sessions_spawn またはサブエージェントツールポリシーを変更しています
    - スレッドに紐づくサブエージェントセッションを実装またはトラブルシューティングしている
sidebarTitle: Sub-agents
summary: 依頼元のチャットに結果を通知する、分離されたバックグラウンドエージェント実行を起動する
title: サブエージェント
x-i18n:
    generated_at: "2026-05-10T19:56:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b4a78b83fda42931ed2a4795e2db611121a30378de149c0478e989029123382
    source_path: tools/subagents.md
    workflow: 16
---

サブエージェントは、既存のエージェント実行から生成されるバックグラウンドのエージェント実行です。
独自のセッション (`agent:<agentId>:subagent:<uuid>`) で実行され、
完了すると、その結果を要求元のチャットチャネルへ**通知**します。
各サブエージェント実行は
[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

主な目標:

- メイン実行をブロックせずに「調査 / 長いタスク / 遅いツール」の作業を並列化する。
- サブエージェントをデフォルトで分離する（セッション分離 + 任意のサンドボックス化）。
- ツール面を誤用しにくく保つ: サブエージェントにはデフォルトでセッションツールを付与しない。
- オーケストレーターのパターン向けに、設定可能なネスト深度をサポートする。

<Note>
**コストに関する注意:** 各サブエージェントはデフォルトで独自のコンテキストとトークン使用量を持ちます。
重いタスクや反復的なタスクでは、サブエージェントにより低コストのモデルを設定し、
メインエージェントはより高品質なモデルのままにしてください。設定は
`agents.defaults.subagents.model` またはエージェントごとのオーバーライドで行います。子が
    要求元の現在のトランスクリプトを本当に必要とする場合、エージェントはその生成だけで
    `context: "fork"` を要求できます。スレッドに紐づくサブエージェントセッションは、
    現在の会話をフォローアップスレッドへ分岐するため、デフォルトで
    `context: "fork"` になります。
</Note>

## スラッシュコマンド

**現在の
セッション**のサブエージェント実行を確認または制御するには `/subagents` を使います。

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

現在の要求元セッションのアクティブな実行を誘導するには、トップレベルの [`/steer <message>`](/ja-JP/tools/steer) を使います。対象が子実行の場合は `/subagents steer <id|#> <message>` を使います。

`/subagents info` は実行メタデータ（ステータス、タイムスタンプ、セッション ID、
トランスクリプトパス、クリーンアップ）を表示します。範囲が制限され、
安全性フィルタ済みの回想ビューには `sessions_history` を使います。
生の完全なトランスクリプトが必要な場合は、ディスク上のトランスクリプトパスを確認してください。

### スレッドバインディング制御

これらのコマンドは、永続的なスレッドバインディングをサポートするチャネルで機能します。
以下の[スレッドをサポートするチャネル](#thread-supporting-channels)を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成時の動作

`/subagents spawn` は、内部リレーではなくユーザーコマンドとしてバックグラウンドのサブエージェントを開始し、
実行が完了すると、要求元のチャットへ最後の完了更新を 1 回送信します。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - 生成コマンドは非ブロッキングです。すぐに実行 ID を返します。
    - 完了時に、サブエージェントは要求元のチャットチャネルへ概要または結果メッセージを通知します。
    - 子の結果を必要とするエージェントターンは、必要な作業を生成したあとで `sessions_yield` を呼び出す必要があります。これにより現在のターンが終了し、完了イベントが次のモデル可視メッセージとして到着できるようになります。
    - 完了はプッシュベースです。生成後は、完了を待つためだけに `/subagents list`、`sessions_list`、または `sessions_history` をループでポーリングしないでください。ステータスの確認は、デバッグまたは介入のためにオンデマンドでのみ行ってください。
    - 子の出力は、要求元エージェントが統合するためのレポートまたは証拠です。これはユーザーが作成した指示文ではなく、システム、開発者、ユーザーポリシーを上書きできません。
    - 完了時、OpenClaw は通知のクリーンアップフローを続行する前に、そのサブエージェントセッションが開いた追跡対象のブラウザータブやプロセスをベストエフォートで閉じます。

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw は、安定した冪等性キーを持つ `agent` ターンを通じて、完了を要求元セッションへ戻します。
    - 要求元の実行がまだアクティブな場合、OpenClaw は 2 つ目の可視返信経路を開始する代わりに、まずその実行のウェイクまたは誘導を試みます。
    - 要求元エージェントへの完了ハンドオフが失敗した場合、または可視出力を生成しない場合、OpenClaw は配信を失敗として扱い、キュールーティングまたは再試行へフォールバックします。子の結果を外部チャットへ直接 raw 送信することはありません。
    - 直接ハンドオフを使用できない場合は、キュールーティングへフォールバックします。
    - キュールーティングもまだ利用できない場合、最終的に諦める前に、短い指数バックオフで通知を再試行します。
    - 完了配信は、解決済みの要求元ルートを保持します。利用可能な場合は、スレッドに紐づく完了ルートまたは会話に紐づく完了ルートが優先されます。完了元がチャネルのみを提供する場合、OpenClaw は要求元セッションの解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足しているターゲットまたはアカウントを補完するため、直接配信は引き続き機能します。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    要求元セッションへの完了ハンドオフは、ランタイムで生成される
    内部コンテキスト（ユーザーが作成したテキストではない）であり、次を含みます。

    - `Result` — 最新の可視 `assistant` 返信テキスト。それがない場合は、サニタイズ済みの最新ツールまたは toolResult テキスト。終端状態で失敗した実行では、キャプチャ済みの返信テキストを再利用しません。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - コンパクトなランタイムおよびトークン統計。
    - 要求元エージェントに、通常のアシスタントの声で書き換えるよう伝える配信指示（生の内部メタデータを転送しない）。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` と `--thinking` は、その特定の実行についてデフォルトをオーバーライドします。
    - 完了後の詳細と出力を確認するには、`info`/`log` を使います。
    - `/subagents spawn` はワンショットモード（`mode: "run"`）です。永続的なスレッド紐づけセッションには、`thread: true` および `mode: "session"` とともに `sessions_spawn` を使います。
    - ACP ハーネスセッション（Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx）では、ツールがそのランタイムを広告している場合、`runtime: "acp"` とともに `sessions_spawn` を使います。完了やエージェント間ループをデバッグするときは、[ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model)を参照してください。`codex` Plugin が有効な場合、ユーザーが明示的に ACP/acpx を求めない限り、Codex チャットまたはスレッド制御は ACP よりも `/codex ...` を優先する必要があります。
    - OpenClaw は、ACP が有効であり、要求元がサンドボックス化されておらず、`acpx` などのバックエンド Plugin が読み込まれている場合まで、`runtime: "acp"` を隠します。`runtime: "acp"` は外部 ACP ハーネス ID、または `runtime.type="acp"` を持つ `agents.list[]` エントリを想定します。`agents_list` の通常の OpenClaw 設定エージェントには、デフォルトのサブエージェントランタイムを使ってください。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブサブエージェントは、呼び出し元が現在のトランスクリプトの fork を明示的に要求しない限り、分離された状態で開始します。

| モード       | 使用する場面                                                                                                                         | 動作                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規調査、独立した実装、遅いツール作業、またはタスク本文で説明できるあらゆる作業                           | クリーンな子トランスクリプトを作成します。これがデフォルトであり、トークン使用量を低く保ちます。  |
| `fork`     | 現在の会話、以前のツール結果、または要求元トランスクリプト内にすでに存在する微妙な指示に依存する作業 | 子が開始する前に、要求元トランスクリプトを子セッションへ分岐します。 |

`fork` は控えめに使ってください。これはコンテキスト依存の委任のためのものであり、
明確なタスクプロンプトを書くことの代替ではありません。

## ツール: `sessions_spawn`

グローバルな `subagent` レーンで `deliver: false` のサブエージェント実行を開始し、
その後に通知ステップを実行して、通知返信を要求元のチャットチャネルへ投稿します。

可用性は、呼び出し元の有効なツールポリシーに依存します。`coding` と
`full` プロファイルは、デフォルトで `sessions_spawn` を公開します。`messaging` プロファイルは
公開しません。作業を委任する必要があるエージェントには、`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` を追加するか、`tools.profile: "coding"` を使ってください。
チャネルまたはグループ、プロバイダー、サンドボックス、エージェントごとの allow/deny ポリシーは、
プロファイル段階の後でもツールを削除できます。同じセッションから `/tools` を使って、有効なツール一覧を確認してください。

**デフォルト:**

- **モデル:** `agents.defaults.subagents.model`（またはエージェントごとの `agents.list[].subagents.model`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` は引き続き優先されます。
- **Thinking:** `agents.defaults.subagents.thinking`（またはエージェントごとの `agents.list[].subagents.thinking`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` は引き続き優先されます。
- **実行タイムアウト:** `sessions_spawn.runTimeoutSeconds` が省略された場合、設定されていれば OpenClaw は `agents.defaults.subagents.runTimeoutSeconds` を使います。それ以外の場合は `0`（タイムアウトなし）へフォールバックします。

### 委任プロンプトモード

`agents.defaults.subagents.delegationMode` はプロンプトガイダンスのみを制御します。ツールポリシーを変更したり、委任を強制したりするものではありません。

- `suggest`（デフォルト）: より大きい作業や遅い作業にサブエージェントを使う標準のプロンプト促しを維持します。
- `prefer`: 直接返信よりも複雑なものは `sessions_spawn` を通じて委任し、メインエージェントが応答性を保つよう指示します。

エージェントごとのオーバーライドには `agents.list[].subagents.delegationMode` を使います。

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### ツールパラメーター

<ParamField path="task" type="string" required>
  サブエージェントのタスク説明。
</ParamField>
<ParamField path="taskName" type="string">
  後で `subagents` の対象指定に使う任意の安定したハンドル。`[a-z][a-z0-9_]{0,63}` に一致する必要があり、`last` や `all` などの予約済みターゲットは使用できません。コーディネーターが複数の子を生成した後に特定の子を誘導、停止、識別する必要がある場合に推奨します。
</ParamField>
<ParamField path="label" type="string">
  任意の人間が読めるラベル。
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` で許可されている場合、別のエージェント ID の下で生成します。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` は外部 ACP ハーネス（`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx）と、`runtime.type` が `acp` の `agents.list[]` エントリ専用です。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP のみ。`runtime: "acp"` の場合に既存の ACP ハーネスセッションを再開します。ネイティブのサブエージェント生成では無視されます。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP のみ。`runtime: "acp"` の場合に ACP 実行出力を親セッションへストリーミングします。ネイティブのサブエージェント生成では省略します。
</ParamField>
<ParamField path="model" type="string">
  サブエージェントのモデルを上書きします。無効な値はスキップされ、ツール結果に警告を出したうえでサブエージェントはデフォルトモデルで実行されます。
</ParamField>
<ParamField path="thinking" type="string">
  サブエージェント実行の思考レベルを上書きします。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  設定されている場合は `agents.defaults.subagents.runTimeoutSeconds` がデフォルトになり、それ以外の場合は `0` になります。設定すると、サブエージェント実行は N 秒後に中止されます。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェントセッションのチャンネルスレッドバインディングを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略されている場合、デフォルトは `session` になります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` はアナウンス直後にアーカイブします（リネームによりトランスクリプトは引き続き保持されます）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、対象の子ランタイムがサンドボックス化されていない限り生成を拒否します。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` はリクエスト元の現在のトランスクリプトを子セッションへ分岐します。ネイティブのサブエージェントのみです。スレッドにバインドされた生成はデフォルトで `fork`、スレッドなしの生成はデフォルトで `isolated` です。
</ParamField>

<Warning>
`sessions_spawn` はチャンネル配信パラメーター（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、生成された実行から
`message`/`sessions_send` を使用してください。
</Warning>

### タスク名と対象指定

`taskName` はオーケストレーション用のモデル向けハンドルであり、セッションキーではありません。
コーディネーターが後でその子を誘導または停止する必要がある場合に、
`review_subagents`、`linux_validation`、`docs_update` などの安定した子名として使用します。

ターゲット解決は、完全一致する `taskName` とあいまいでないプレフィックスを受け付けます。
照合は、番号付き `/subagents` ターゲットで使われるものと同じアクティブまたは直近ターゲットウィンドウにスコープされるため、
古い完了済みの子によって再利用されたハンドルがあいまいになることはありません。同じ
`taskName` を共有するアクティブまたは直近の子が 2 つある場合、ターゲットはあいまいです。代わりにリストインデックス、セッションキー、または
実行 ID を使用してください。

予約済みターゲットの `last` と `all` は、すでに制御上の意味を持つため、有効な `taskName` 値ではありません。

## ツール: `sessions_yield`

現在のモデルターンを終了し、ランタイムイベント、主にサブエージェント完了イベントが次のメッセージとして届くのを待ちます。必要な子作業を生成した後、完了が届くまでリクエスト元が最終回答を生成できない場合に使用します。

`sessions_yield` は待機プリミティブです。子の完了を検出するだけの目的で、`subagents`、`sessions_list`、`sessions_history`、シェルの
`sleep`、またはプロセスポーリングを使ったポーリングループに置き換えないでください。

セッションの有効なツールリストに含まれている場合にのみ `sessions_yield` を使用します。一部の最小またはカスタムツールプロファイルでは、`sessions_yield` を公開せずに `sessions_spawn` と
`subagents` を公開する場合があります。その場合、完了を待つためだけのポーリングループを作らないでください。

アクティブな子が存在する場合、OpenClaw は通常ターンにコンパクトなランタイム生成の
`Active Subagents` プロンプトブロックを挿入し、リクエスト元がポーリングなしで現在の子セッション、実行 ID、ステータス、ラベル、タスク、および
`taskName` エイリアスを確認できるようにします。そのブロック内のタスクフィールドとラベルフィールドは、指示ではなくデータとして引用されます。これは、ユーザーまたはモデルが提供した生成引数に由来する可能性があるためです。

## ツール: `subagents`

リクエスト元セッションが所有する、生成済みサブエージェント実行を一覧表示、誘導、または停止します。現在のリクエスト元にスコープされます。子は自分が制御する子だけを表示または制御できます。

オンデマンドのステータス確認、デバッグ、誘導、停止には `subagents` を使用します。
完了イベントを待つには `sessions_yield` を使用します。

## スレッドにバインドされたセッション

チャンネルでスレッドバインディングが有効な場合、サブエージェントはスレッドにバインドされたままになり、そのスレッド内の後続ユーザーメッセージを同じサブエージェントセッションへルーティングし続けられます。

### スレッド対応チャンネル

**Discord** は現在サポートされている唯一のチャンネルです。永続的なスレッドバインドサブエージェントセッション（`thread: true` を指定した `sessions_spawn`）、手動スレッド制御（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`）、およびアダプターキー
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours`、`channels.discord.threadBindings.spawnSessions` をサポートします。

### 簡単な流れ

<Steps>
  <Step title="生成">
    `thread: true`（任意で `mode: "session"`）を指定して `sessions_spawn` を実行します。
  </Step>
  <Step title="バインド">
    OpenClaw はアクティブチャンネル内で、そのセッションターゲットに対してスレッドを作成またはバインドします。
  </Step>
  <Step title="フォローアップをルーティング">
    そのスレッド内の返信とフォローアップメッセージは、バインドされたセッションへルーティングされます。
  </Step>
  <Step title="タイムアウトを確認">
    非アクティブ時の自動アンフォーカスを確認または更新するには `/session idle` を使用し、
    ハード上限を制御するには `/session max-age` を使用します。
  </Step>
  <Step title="切り離し">
    手動で切り離すには `/unfocus` を使用します。
  </Step>
</Steps>

### 手動制御

| コマンド            | 効果                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッド（または新規作成したスレッド）をサブエージェントまたはセッションターゲットにバインドします |
| `/unfocus`         | 現在バインドされているスレッドのバインディングを削除します                       |
| `/agents`          | アクティブな実行とバインディング状態（`thread:<id>` または `unbound`）を一覧表示します       |
| `/session idle`    | アイドル時の自動アンフォーカスを確認または更新します（フォーカスされたバインド済みスレッドのみ）         |
| `/session max-age` | ハード上限を確認または更新します（フォーカスされたバインド済みスレッドのみ）                  |

### 設定スイッチ

- **グローバルデフォルト:** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **チャンネル上書きと生成時の自動バインドキー** はアダプター固有です。上記の [スレッド対応チャンネル](#thread-supporting-channels) を参照してください。

現在のアダプター詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference) と
[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

### 許可リスト

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  明示的な `agentId` で対象にできるエージェント ID のリスト（`["*"]` は任意のものを許可）。デフォルトはリクエスト元エージェントのみです。リストを設定し、それでもリクエスト元が `agentId` で自身を生成できるようにしたい場合は、リクエスト元 ID をリストに含めてください。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  リクエスト元エージェントが独自の `subagents.allowAgents` を設定していない場合に使用されるデフォルトの対象エージェント許可リスト。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します）。エージェントごとの上書き: `agents.list[].subagents.requireAgentId`。
</ParamField>

リクエスト元セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。

### 検出

`sessions_spawn` に現在許可されているエージェント ID を確認するには `agents_list` を使用します。レスポンスには、一覧に含まれる各エージェントの有効なモデルと埋め込みランタイムメタデータが含まれるため、呼び出し元は PI、Codex
app-server、およびその他の設定済みネイティブランタイムを区別できます。

### 自動アーカイブ

- サブエージェントセッションは、`agents.defaults.subagents.archiveAfterMinutes`（デフォルト `60`）後に自動的にアーカイブされます。
- アーカイブは `sessions.delete` を使用し、トランスクリプトを `*.deleted.<timestamp>`（同じフォルダー）へリネームします。
- `cleanup: "delete"` はアナウンス直後にアーカイブします（リネームによりトランスクリプトは引き続き保持されます）。
- 自動アーカイブはベストエフォートです。Gateway が再起動すると保留中のタイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブを行いません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは depth-1 と depth-2 のセッションに同じように適用されます。
- ブラウザーのクリーンアップはアーカイブクリーンアップとは別です。追跡対象のブラウザータブやプロセスは、トランスクリプトまたはセッションレコードを保持する場合でも、実行終了時にベストエフォートで閉じられます。

## ネストされたサブエージェント

デフォルトでは、サブエージェントは自身のサブエージェントを生成できません
（`maxSpawnDepth: 1`）。1 レベルのネストを有効にするには `maxSpawnDepth: 2` を設定します。つまり、**オーケストレーターパターン**: main → オーケストレーターサブエージェント →
ワーカーサブサブエージェントです。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### 深さレベル

| 深さ | セッションキーの形                            | ロール                                          | 生成可能か                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | メインエージェント                                    | 常に可能                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | サブエージェント（depth 2 が許可されている場合はオーケストレーター） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（リーフワーカー）                   | 不可                        |

### アナウンスチェーン

結果はチェーンを上向きに流れます。

1. depth-2 ワーカーが完了 → 親（depth-1 オーケストレーター）へアナウンスします。
2. depth-1 オーケストレーターがアナウンスを受け取り、結果を合成して完了 → main へアナウンスします。
3. メインエージェントがアナウンスを受け取り、ユーザーへ配信します。

各レベルは直接の子からのアナウンスのみを参照します。

<Note>
**運用ガイダンス:** `sessions_list`、
`sessions_history`、`/subagents list`、または `exec` sleep コマンドの周囲にポーリングループを作るのではなく、子作業を一度開始して完了イベントを待ちます。
`sessions_list` と `/subagents list` は子セッション関係をライブ作業に集中させます。ライブの子はアタッチされたままになり、終了した子は短い直近ウィンドウで表示され続け、古いストア内のみの子リンクは鮮度ウィンドウ後に無視されます。これにより、再起動後に古い `spawnedBy` /
`parentSessionKey` メタデータがゴースト子を復活させることを防ぎます。すでに最終回答を送信した後に子の完了イベントが届いた場合、正しいフォローアップは正確なサイレントトークン
`NO_REPLY` / `no_reply` です。
</Note>

### 深さごとのツールポリシー

- ロールと制御スコープは、生成時にセッションメタデータへ書き込まれます。これにより、フラット化または復元されたセッションキーが誤ってオーケストレーター権限を取り戻すことを防ぎます。
- **深さ 1（オーケストレーター、`maxSpawnDepth >= 2` の場合）:** 子を管理できるように `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。その他のセッション/システムツールは引き続き拒否されます。
- **深さ 1（リーフ、`maxSpawnDepth == 1` の場合）:** セッションツールなし（現在のデフォルト動作）。
- **深さ 2（リーフワーカー）:** セッションツールなし — `sessions_spawn` は深さ 2 では常に拒否されます。これ以上の子は生成できません。

### エージェントごとの生成上限

各エージェントセッション（どの深さでも）は、同時に最大 `maxChildrenPerAgent`
（デフォルト `5`）個のアクティブな子を持てます。これにより、単一のオーケストレーターからの
制御不能なファンアウトを防ぎます。

### カスケード停止

深さ 1 のオーケストレーターを停止すると、その深さ 2 の子もすべて自動的に停止します。

- メインチャットの `/stop` はすべての深さ 1 エージェントを停止し、その深さ 2 の子へカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子へカスケードします。
- `/subagents kill all` は要求者のすべてのサブエージェントを停止し、カスケードします。

## 認証

サブエージェントの認証は、セッション種別ではなく **エージェント ID** によって解決されます。

- サブエージェントのセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- 認証ストアはそのエージェントの `agentDir` から読み込まれます。
- メインエージェントの認証プロファイルは **フォールバック** としてマージされます。競合時はエージェントのプロファイルがメインプロファイルを上書きします。

マージは追加的なため、メインプロファイルは常にフォールバックとして利用できます。
エージェントごとの完全に分離された認証はまだサポートされていません。

## アナウンス

サブエージェントはアナウンスステップを通じて報告します。

- アナウンスステップは、要求者セッションではなくサブエージェントセッション内で実行されます。
- サブエージェントが正確に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新のアシスタントテキストが正確なサイレントークン `NO_REPLY` / `no_reply` の場合、以前に表示可能な進捗があってもアナウンス出力は抑制されます。

配信は要求者の深さに依存します。

- トップレベルの要求者セッションは、外部配信（`deliver=true`）付きの後続 `agent` 呼び出しを使用します。
- ネストされた要求者サブエージェントセッションは、内部後続注入（`deliver=false`）を受け取り、オーケストレーターがセッション内で子の結果を合成できるようにします。
- ネストされた要求者サブエージェントセッションがなくなっている場合、OpenClaw は利用可能であればそのセッションの要求者へフォールバックします。

トップレベルの要求者セッションでは、完了モードの直接配信はまずバインドされた会話/スレッドルートとフック上書きを解決し、その後、要求者セッションに保存されたルートから不足しているチャンネルターゲットフィールドを埋めます。
これにより、完了元がチャンネルのみを識別している場合でも、完了が正しいチャット/トピックに保持されます。

ネストされた完了所見を構築するとき、子完了の集約は現在の要求者実行にスコープされ、古い以前の実行の子出力が現在のアナウンスに漏れることを防ぎます。アナウンス返信は、チャンネルアダプターで利用可能な場合、スレッド/トピックルーティングを保持します。

### アナウンスコンテキスト

アナウンスコンテキストは、安定した内部イベントブロックへ正規化されます。

| フィールド          | ソース                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| ソース         | `subagent` または `cron`                                                                                          |
| セッション ID    | 子セッションキー/ID                                                                                          |
| 種別           | アナウンス種別 + タスクラベル                                                                                    |
| ステータス         | ランタイム結果（`success`、`error`、`timeout`、または `unknown`）から導出 — モデルテキストから推測されるものでは**ありません** |
| 結果コンテンツ | 最新の表示可能なアシスタントテキスト。なければ、サニタイズされた最新のツール/toolResult テキスト                                |
| フォローアップ      | 返信する場合とサイレントのままにする場合を説明する指示                                                           |

失敗で終了した実行は、キャプチャ済み返信テキストを再生せずに失敗ステータスを報告します。
タイムアウト時に子がツール呼び出しまでしか進んでいない場合、アナウンスは生のツール出力を再生する代わりに、その履歴を短い部分進捗サマリーへ折りたためます。

### 統計行

アナウンスペイロードは末尾に統計行を含みます（折り返されている場合でも）。

- 実行時間（例: `runtime 5m12s`）。
- トークン使用量（入力/出力/合計）。
- モデル価格が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- メインエージェントが `sessions_history` で履歴を取得したり、ディスク上のファイルを検査したりできるようにするための、`sessionKey`、`sessionId`、およびトランスクリプトパス。

内部メタデータはオーケストレーション専用です。ユーザー向け返信は通常のアシスタントの声に書き換える必要があります。

### `sessions_history` を推奨する理由

`sessions_history` はより安全なオーケストレーションパスです。

- アシスタントのリコールが最初に正規化されます。thinking タグは除去されます。`<relevant-memories>` / `<relevant_memories>` の足場は除去されます。プレーンテキストのツール呼び出し XML ペイロードブロック（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`）は、きれいに閉じていない切り詰められたペイロードを含めて除去されます。ダウングレードされたツール呼び出し/結果の足場と履歴コンテキストマーカーは除去されます。漏洩したモデル制御トークン（`<|assistant|>`、その他の ASCII `<|...|>`、全角 `<｜...｜>`）は除去されます。壊れた MiniMax ツール呼び出し XML は除去されます。
- 認証情報/トークンに似たテキストはリダクトされます。
- 長いブロックは切り詰められることがあります。
- 非常に大きな履歴では、古い行を削除するか、過大な行を `[sessions_history omitted: message too large]` に置き換えることがあります。
- バイト単位で完全なトランスクリプトが必要な場合は、生のディスク上トランスクリプト検査がフォールバックです。

## ツールポリシー

サブエージェントは、まず親またはターゲットエージェントと同じプロファイルおよびツールポリシーパイプラインを使用します。
その後、OpenClaw がサブエージェント制限レイヤーを適用します。

制限的な `tools.profile` がない場合、サブエージェントは**セッションツール**とシステムツールを除くすべてのツールを取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` はここでも、境界付けられサニタイズされたリコールビューのままです。
生のトランスクリプトダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーターサブエージェントは、子を管理できるように `sessions_spawn`、`subagents`、`sessions_list`、および
`sessions_history` も追加で受け取ります。

### 設定による上書き

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

`tools.subagents.tools.allow` は最終的な許可のみフィルターです。これは既に解決済みのツールセットを絞り込めますが、`tools.profile` によって削除されたツールを**戻して追加**することはできません。
たとえば、`tools.profile: "coding"` には `web_search`/`web_fetch` は含まれますが、`browser` ツールは含まれません。
coding プロファイルのサブエージェントにブラウザー自動化を使わせるには、プロファイル段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

1 つのエージェントだけにブラウザー自動化を付与する場合は、エージェントごとの `agents.list[].tools.alsoAllow: ["browser"]` を使用します。

## 並行実行

サブエージェントは専用のインプロセスキューレーンを使用します。

- **レーン名:** `subagent`
- **並行実行数:** `agents.defaults.subagents.maxConcurrent`（デフォルト `8`）

## 生存性と復旧

OpenClaw は、`endedAt` が存在しないことを、サブエージェントがまだ生存しているという恒久的な証明として扱いません。stale-run ウィンドウより古い未終了の実行は、`/subagents list`、ステータスサマリー、子孫完了ゲート、およびセッションごとの並行実行チェックで、アクティブ/保留としてカウントされなくなります。

Gateway の再起動後、古い未終了の復元済み実行は、子セッションに `abortedLastRun: true` がマークされていない限りプルーニングされます。
これらの再起動で中止された子セッションは、サブエージェント孤児復旧フローを通じて復旧可能なままです。このフローは、中止マーカーをクリアする前に合成 resume メッセージを送信します。

自動再起動復旧は子セッションごとに制限されます。同じサブエージェント子が rapid re-wedge ウィンドウ内で繰り返し孤児復旧に受け入れられる場合、OpenClaw はそのセッションに復旧トゥームストーンを永続化し、以後の再起動で自動再開しなくなります。
タスクレコードを調整するには `openclaw tasks maintenance --apply` を実行し、トゥームストーン化されたセッションの古い中止復旧フラグをクリアするには `openclaw doctor --fix` を実行します。

<Note>
サブエージェント生成が Gateway `PAIRING_REQUIRED` /
`scope-upgrade` で失敗する場合、ペアリング状態を編集する前に RPC 呼び出し元を確認してください。
内部 `sessions_spawn` 調整は、直接
loopback 共有トークン/パスワード認証経由で `client.id: "gateway-client"`、`client.mode: "backend"` として接続する必要があります。このパスは CLI のペアリング済みデバイススコープベースラインに依存しません。リモート呼び出し元、明示的な
`deviceIdentity`、明示的なデバイストークンパス、およびブラウザー/node クライアントは、スコープアップグレードに通常のデバイス承認が引き続き必要です。
</Note>

## 停止

- 要求者チャットで `/stop` を送信すると、要求者セッションが中止され、そこから生成されたアクティブなサブエージェント実行がすべて停止し、ネストされた子へカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子へカスケードします。

## 制限事項

- サブエージェントのアナウンスは**ベストエフォート**です。Gateway が再起動すると、保留中の「announce back」作業は失われます。
- サブエージェントは引き続き同じ Gateway プロセスリソースを共有します。`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常にノンブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントコンテキストは `AGENTS.md`、`TOOLS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md` のみを注入します（`MEMORY.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` はありません）。
- 最大ネスト深さは 5 です（`maxSpawnDepth` の範囲: 1–5）。ほとんどのユースケースでは深さ 2 が推奨されます。
- `maxChildrenPerAgent` はセッションごとのアクティブな子を制限します（デフォルト `5`、範囲 `1–20`）。

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents)
- [エージェント送信](/ja-JP/tools/agent-send)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
