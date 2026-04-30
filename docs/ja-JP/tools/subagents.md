---
read_when:
    - エージェント経由でバックグラウンド作業または並列作業を行いたい
    - sessions_spawn またはサブエージェントのツールポリシーを変更しています
    - スレッドに紐づくサブエージェントセッションを実装またはトラブルシューティングしている
sidebarTitle: Sub-agents
summary: 分離されたバックグラウンドエージェント実行を起動し、結果をリクエスト元のチャットに通知します
title: サブエージェント
x-i18n:
    generated_at: "2026-04-30T16:30:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

サブエージェントは、既存のエージェント実行から生成されるバックグラウンドのエージェント実行です。
それぞれ独自のセッション（`agent:<agentId>:subagent:<uuid>`）で実行され、
完了すると、その結果をリクエスト元のチャット
チャンネルへ**通知**します。各サブエージェント実行は
[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

主な目標:

- メイン実行をブロックせずに「調査 / 長時間タスク / 遅いツール」の作業を並列化する。
- サブエージェントをデフォルトで分離した状態に保つ（セッション分離 + 任意のサンドボックス化）。
- ツールサーフェスを誤用しにくく保つ: サブエージェントはデフォルトではセッションツールを取得しません。
- オーケストレーターパターン向けに、設定可能なネスト深度をサポートする。

<Note>
**コストに関する注記:** 各サブエージェントはデフォルトで独自のコンテキストとトークン使用量を持ちます。重いタスクや反復的なタスクでは、サブエージェントに安価なモデルを設定し、メインエージェントは高品質なモデルのままにします。`agents.defaults.subagents.model`、またはエージェントごとのオーバーライドで設定します。子がリクエスト元の現在のトランスクリプトを本当に必要とする場合、エージェントはその生成時だけ `context: "fork"` を要求できます。
</Note>

## スラッシュコマンド

**現在のセッション**のサブエージェント実行を確認または制御するには、`/subagents` を使用します:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` は実行メタデータ（ステータス、タイムスタンプ、セッション ID、
トランスクリプトパス、クリーンアップ）を表示します。範囲を限定し、
安全性でフィルタリングされた想起ビューには `sessions_history` を使用します。
未加工の完全なトランスクリプトが必要な場合は、ディスク上のトランスクリプトパスを確認します。

### スレッドバインディング制御

これらのコマンドは、永続的なスレッドバインディングをサポートするチャンネルで動作します。
下記の[スレッド対応チャンネル](#thread-supporting-channels)を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成時の動作

`/subagents spawn` は、内部リレーではなくユーザーコマンドとしてバックグラウンドのサブエージェントを開始し、実行が完了すると最終的な完了更新を 1 回、リクエスト元のチャットに送信します。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - 生成コマンドはノンブロッキングです。実行 ID をすぐに返します。
    - 完了時に、サブエージェントはリクエスト元のチャットチャンネルへ要約/結果メッセージを通知します。
    - 完了はプッシュベースです。生成後は、完了を待つためだけに `/subagents list`、`sessions_list`、または `sessions_history` をループでポーリングしないでください。デバッグや介入のため必要なときだけステータスを確認します。
    - 完了時に、通知のクリーンアップフローが続行する前に、OpenClaw はそのサブエージェントセッションが開いた追跡対象のブラウザータブ/プロセスをベストエフォートで閉じます。

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw はまず、安定した冪等性キーを使って直接 `agent` 配信を試みます。
    - 直接配信に失敗した場合は、キュールーティングへフォールバックします。
    - キュールーティングもまだ利用できない場合、最終的に諦める前に、短い指数バックオフで通知を再試行します。
    - 完了配信は、解決済みのリクエスト元ルートを保持します。スレッドバインドまたは会話バインドの完了ルートが利用可能な場合はそれが優先されます。完了元がチャンネルだけを提供する場合、OpenClaw はリクエスト元セッションの解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足しているターゲット/アカウントを補完し、直接配信が引き続き機能するようにします。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    リクエスト元セッションへの完了ハンドオフは、ランタイムで生成される内部コンテキスト（ユーザー作成テキストではない）であり、次を含みます:

    - `Result` — 最新の可視 `assistant` 返信テキスト。それがなければ、サニタイズされた最新のツール/ツール結果テキスト。終了済みの失敗実行では、キャプチャされた返信テキストを再利用しません。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - コンパクトなランタイム/トークン統計。
    - リクエスト元エージェントに、未加工の内部メタデータをそのまま転送せず、通常のアシスタントの声で書き換えるよう指示する配信命令。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` と `--thinking` は、その特定の実行についてデフォルトをオーバーライドします。
    - 完了後に詳細と出力を確認するには、`info`/`log` を使用します。
    - `/subagents spawn` はワンショットモード（`mode: "run"`）です。永続的なスレッドバインドセッションには、`thread: true` および `mode: "session"` で `sessions_spawn` を使用します。
    - ACP ハーネスセッション（Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx）では、ツールがそのランタイムを広告している場合、`runtime: "acp"` で `sessions_spawn` を使用します。完了やエージェント間ループをデバッグするときは、[ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model)を参照してください。`codex` Plugin が有効な場合、ユーザーが明示的に ACP/acpx を求めない限り、Codex のチャット/スレッド制御では ACP より `/codex ...` を優先する必要があります。
    - OpenClaw は、ACP が有効で、リクエスト元がサンドボックス化されておらず、`acpx` などのバックエンド Plugin が読み込まれるまで、`runtime: "acp"` を非表示にします。`runtime: "acp"` は、外部 ACP ハーネス ID、または `runtime.type="acp"` を持つ `agents.list[]` エントリを想定します。`agents_list` の通常の OpenClaw 設定エージェントには、デフォルトのサブエージェントランタイムを使用します。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブサブエージェントは、呼び出し元が現在のトランスクリプトのフォークを明示的に要求しない限り、分離された状態で開始します。

| モード       | 使用する場面                                                                                                                         | 動作                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規調査、独立した実装、遅いツール作業、またはタスクテキストで説明できるもの                           | クリーンな子トランスクリプトを作成します。これがデフォルトで、トークン使用量を低く保ちます。  |
| `fork`     | 現在の会話、以前のツール結果、またはリクエスト元トランスクリプトにすでに存在する微妙な指示に依存する作業 | 子が開始する前に、リクエスト元トランスクリプトを子セッションへ分岐します。 |

`fork` は控えめに使用してください。これはコンテキストに依存する委任のためのものであり、明確なタスクプロンプトを書くことの代替ではありません。

## ツール: `sessions_spawn`

グローバルな `subagent` レーンで `deliver: false` のサブエージェント実行を開始し、
その後、通知ステップを実行して、通知返信をリクエスト元のチャットチャンネルへ投稿します。

利用可否は、呼び出し元の有効なツールポリシーによって決まります。`coding` および
`full` プロファイルはデフォルトで `sessions_spawn` を公開します。`messaging` プロファイルは公開しません。作業を委任する必要があるエージェントには、
`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` を追加するか、`tools.profile: "coding"` を使用します。
チャンネル/グループ、プロバイダー、サンドボックス、エージェントごとの許可/拒否ポリシーは、
プロファイル段階の後でもツールを削除できます。同じセッションから `/tools` を使用して、
有効なツール一覧を確認します。

**デフォルト:**

- **モデル:** `agents.defaults.subagents.model`（またはエージェントごとの `agents.list[].subagents.model`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` は引き続き優先されます。
- **Thinking:** `agents.defaults.subagents.thinking`（またはエージェントごとの `agents.list[].subagents.thinking`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` は引き続き優先されます。
- **実行タイムアウト:** `sessions_spawn.runTimeoutSeconds` が省略されている場合、OpenClaw は設定されていれば `agents.defaults.subagents.runTimeoutSeconds` を使用します。それ以外の場合は `0`（タイムアウトなし）へフォールバックします。

### ツールパラメーター

<ParamField path="task" type="string" required>
  サブエージェントのタスク説明。
</ParamField>
<ParamField path="label" type="string">
  任意の人間が読めるラベル。
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` によって許可されている場合、別のエージェント ID の下で生成します。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` は、外部 ACP ハーネス（`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx）および `runtime.type` が `acp` の `agents.list[]` エントリ専用です。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP 専用。`runtime: "acp"` の場合に既存の ACP ハーネスセッションを再開します。ネイティブサブエージェント生成では無視されます。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP 専用。`runtime: "acp"` の場合に ACP 実行出力を親セッションへストリームします。ネイティブサブエージェント生成では省略します。
</ParamField>
<ParamField path="model" type="string">
  サブエージェントモデルをオーバーライドします。無効な値はスキップされ、サブエージェントはデフォルトモデルで実行され、ツール結果に警告が表示されます。
</ParamField>
<ParamField path="thinking" type="string">
  サブエージェント実行の Thinking レベルをオーバーライドします。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  設定されていれば `agents.defaults.subagents.runTimeoutSeconds` がデフォルトになり、それ以外の場合は `0` になります。設定すると、サブエージェント実行は N 秒後に中止されます。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェントセッションにチャンネルスレッドバインディングを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略されている場合、デフォルトは `session` になります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` は通知直後にアーカイブします（リネームによってトランスクリプトは引き続き保持します）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、ターゲットの子ランタイムがサンドボックス化されていない限り生成を拒否します。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` はリクエスト元の現在のトランスクリプトを子セッションへ分岐します。ネイティブサブエージェント専用です。子が現在のトランスクリプトを必要とする場合にのみ `fork` を使用します。
</ParamField>

<Warning>
`sessions_spawn` は、チャンネル配信パラメーター（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、生成された実行から
`message`/`sessions_send` を使用します。
</Warning>

## スレッドバインドセッション

チャンネルでスレッドバインディングが有効な場合、サブエージェントはスレッドにバインドされたままになり、そのスレッド内の後続のユーザーメッセージを同じサブエージェントセッションへルーティングし続けられます。

### スレッド対応チャンネル

現在サポートされているチャンネルは **Discord** のみです。永続的なスレッドバインドサブエージェントセッション（`thread: true` を指定した `sessions_spawn`）、手動スレッド制御（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`）、およびアダプターキー
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours`、
`channels.discord.threadBindings.spawnSubagentSessions` をサポートします。

### クイックフロー

<Steps>
  <Step title="Spawn">
    `thread: true`（任意で `mode: "session"`）を指定して `sessions_spawn`。
  </Step>
  <Step title="Bind">
    OpenClaw は、アクティブなチャンネルでそのセッションターゲットにスレッドを作成またはバインドします。
  </Step>
  <Step title="Route follow-ups">
    そのスレッド内の返信と後続メッセージは、バインドされたセッションへルーティングされます。
  </Step>
  <Step title="Inspect timeouts">
    非アクティブ時の自動フォーカス解除を確認/更新するには `/session idle` を使用し、
    ハード上限を制御するには `/session max-age` を使用します。
  </Step>
  <Step title="Detach">
    手動で切り離すには `/unfocus` を使用します。
  </Step>
</Steps>

### 手動制御

| コマンド            | 効果                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッドをサブエージェント/セッションターゲットにバインドする（または作成する） |
| `/unfocus`         | 現在バインドされているスレッドのバインドを削除する                       |
| `/agents`          | アクティブな実行とバインド状態（`thread:<id>` または `unbound`）を一覧表示する       |
| `/session idle`    | アイドル時の自動フォーカス解除を確認/更新する（フォーカス済みのバインドされたスレッドのみ）         |
| `/session max-age` | ハード上限を確認/更新する（フォーカス済みのバインドされたスレッドのみ）                  |

### 設定スイッチ

- **グローバルデフォルト:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **チャネルの上書きとスポーン時の自動バインドキー** はアダプター固有です。上の [スレッド対応チャネル](#thread-supporting-channels) を参照してください。

現在のアダプターの詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference) と
[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

### 許可リスト

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  明示的な `agentId` でターゲットにできるエージェント ID の一覧です（`["*"]` は任意を許可します）。デフォルト: リクエスト元エージェントのみ。リストを設定し、それでもリクエスト元が `agentId` で自身をスポーンできるようにしたい場合は、リクエスト元 ID をリストに含めてください。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  リクエスト元エージェントが独自の `subagents.allowAgents` を設定していない場合に使われる、デフォルトのターゲットエージェント許可リストです。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します）。エージェントごとの上書き: `agents.list[].subagents.requireAgentId`.
</ParamField>

リクエスト元セッションがサンドボックス化されている場合、`sessions_spawn` は
サンドボックスなしで実行されるターゲットを拒否します。

### 検出

`sessions_spawn` で現在許可されているエージェント ID を確認するには、`agents_list` を使います。レスポンスには、一覧にある各エージェントの有効な
モデルと埋め込みランタイムメタデータが含まれるため、呼び出し元は Pi、Codex
app-server、その他の設定済みネイティブランタイムを区別できます。

### 自動アーカイブ

- サブエージェントセッションは、`agents.defaults.subagents.archiveAfterMinutes`（デフォルト `60`）の後に自動的にアーカイブされます。
- アーカイブは `sessions.delete` を使い、トランスクリプトの名前を `*.deleted.<timestamp>` に変更します（同じフォルダー）。
- `cleanup: "delete"` はアナウンス直後にアーカイブします（名前変更によりトランスクリプトは保持されます）。
- 自動アーカイブはベストエフォートです。Gateway が再起動すると、保留中のタイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブしません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは深さ 1 と深さ 2 のセッションに同じように適用されます。
- ブラウザーのクリーンアップはアーカイブのクリーンアップとは別です。トランスクリプト/セッションレコードが保持される場合でも、追跡対象のブラウザータブ/プロセスは実行終了時にベストエフォートで閉じられます。

## ネストされたサブエージェント

デフォルトでは、サブエージェントは自身のサブエージェントをスポーンできません
（`maxSpawnDepth: 1`）。ネストを 1 レベル有効にするには `maxSpawnDepth: 2` を設定します — **オーケストレーターパターン**: main → オーケストレーターサブエージェント →
ワーカーサブサブエージェント。

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

| 深さ | セッションキーの形状                            | ロール                                          | スポーン可能か                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | メインエージェント                                    | 常に可能                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | サブエージェント（深さ 2 が許可されている場合はオーケストレーター） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（リーフワーカー）                   | 不可                        |

### アナウンスチェーン

結果はチェーンをさかのぼって流れます。

1. 深さ 2 のワーカーが完了 → 親（深さ 1 のオーケストレーター）にアナウンスします。
2. 深さ 1 のオーケストレーターがアナウンスを受け取り、結果を統合して完了 → main にアナウンスします。
3. メインエージェントがアナウンスを受け取り、ユーザーに届けます。

各レベルは、直接の子からのアナウンスだけを参照します。

<Note>
**運用ガイダンス:** `sessions_list`,
`sessions_history`, `/subagents list`, または `exec` の sleep コマンドの周りにポーリングループを作るのではなく、子の作業を一度開始し、完了イベントを待ってください。
`sessions_list` と `/subagents list` は、子セッションの関係を
ライブ作業に集中させます。ライブの子は接続されたまま、終了した子は短い最近のウィンドウ中は
表示されたままになり、古いストア専用の子リンクは
新鮮さのウィンドウ後に無視されます。これにより、古い `spawnedBy` /
`parentSessionKey` メタデータが、再起動後にゴースト子を復活させることを防ぎます。最終回答をすでに送信した後に子の完了イベントが届いた場合、正しいフォローアップは厳密なサイレントトークン
`NO_REPLY` / `no_reply` です。
</Note>

### 深さごとのツールポリシー

- ロールと制御スコープはスポーン時にセッションメタデータへ書き込まれます。これにより、フラットなセッションキーや復元されたセッションキーが誤ってオーケストレーター権限を取り戻すことを防ぎます。
- **深さ 1（オーケストレーター、`maxSpawnDepth >= 2` の場合）:** 子を管理できるように、`sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` を取得します。他のセッション/システムツールは拒否されたままです。
- **深さ 1（リーフ、`maxSpawnDepth == 1` の場合）:** セッションツールはありません（現在のデフォルト動作）。
- **深さ 2（リーフワーカー）:** セッションツールはありません — `sessions_spawn` は深さ 2 では常に拒否されます。さらに子をスポーンすることはできません。

### エージェントごとのスポーン制限

各エージェントセッション（任意の深さ）は、一度に最大 `maxChildrenPerAgent`
（デフォルト `5`）個のアクティブな子を持てます。これにより、単一のオーケストレーターからの制御不能なファンアウトを防ぎます。

### カスケード停止

深さ 1 のオーケストレーターを停止すると、そのすべての深さ 2 の
子も自動的に停止します。

- メインチャットでの `/stop` は、すべての深さ 1 エージェントを停止し、その深さ 2 の子にカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子にカスケードします。
- `/subagents kill all` はリクエスト元のすべてのサブエージェントを停止し、カスケードします。

## 認証

サブエージェントの認証は、セッションタイプではなく **エージェント ID** によって解決されます。

- サブエージェントのセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- 認証ストアはそのエージェントの `agentDir` から読み込まれます。
- メインエージェントの認証プロファイルは **フォールバック** としてマージされます。競合時はエージェントプロファイルがメインプロファイルを上書きします。

マージは追加的なので、メインプロファイルは常に
フォールバックとして利用できます。エージェントごとに完全に分離された認証は、まだサポートされていません。

## アナウンス

サブエージェントはアナウンスステップを通じて報告します。

- アナウンスステップは、リクエスト元セッションではなくサブエージェントセッション内で実行されます。
- サブエージェントが厳密に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新のアシスタントテキストが厳密なサイレントトークン `NO_REPLY` / `no_reply` である場合、それ以前に可視の進行状況が存在していても、アナウンス出力は抑制されます。

配信はリクエスト元の深さに依存します。

- トップレベルのリクエスト元セッションは、外部配信（`deliver=true`）付きのフォローアップ `agent` 呼び出しを使います。
- ネストされたリクエスト元サブエージェントセッションは、内部フォローアップ注入（`deliver=false`）を受け取るため、オーケストレーターはセッション内で子の結果を統合できます。
- ネストされたリクエスト元サブエージェントセッションが存在しない場合、OpenClaw は利用可能であればそのセッションのリクエスト元にフォールバックします。

トップレベルのリクエスト元セッションでは、完了モードの直接配信はまず
バインドされた会話/スレッドのルートとフック上書きを解決し、その後
リクエスト元セッションに保存されたルートから不足しているチャネルターゲットフィールドを補完します。
これにより、完了元がチャネルだけを識別している場合でも、正しいチャット/トピックに完了を維持できます。

ネストされた完了結果を構築するとき、子の完了集約は現在のリクエスト元実行にスコープされるため、古い前回実行の子出力が現在のアナウンスに漏れるのを防ぎます。アナウンス返信は、チャネルアダプターで利用可能な場合、スレッド/トピックのルーティングを保持します。

### アナウンスコンテキスト

アナウンスコンテキストは、安定した内部イベントブロックに正規化されます。

| フィールド          | ソース                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| ソース         | `subagent` または `cron`                                                                                          |
| セッション ID    | 子セッションのキー/ID                                                                                          |
| タイプ           | アナウンスタイプ + タスクラベル                                                                                    |
| ステータス         | ランタイム結果（`success`, `error`, `timeout`, または `unknown`）から導出 — モデルテキストから推測**しません** |
| 結果コンテンツ | 最新の可視アシスタントテキスト、それ以外の場合はサニタイズされた最新の tool/toolResult テキスト                                |
| フォローアップ      | 返信する場合と沈黙を保つ場合を説明する指示                                                           |

終端で失敗した実行は、キャプチャされた
返信テキストを再生せずに失敗ステータスを報告します。タイムアウト時、子がツール呼び出しまでしか進んでいない場合、アナウンスは
生のツール出力を再生する代わりに、その履歴を短い部分進捗サマリーへまとめられます。

### 統計行

アナウンスペイロードには最後に統計行が含まれます（折り返されている場合でも）。

- ランタイム（例: `runtime 5m12s`）。
- トークン使用量（入力/出力/合計）。
- モデル価格が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- メインエージェントが `sessions_history` で履歴を取得するか、ディスク上のファイルを確認できるように、`sessionKey`, `sessionId`, およびトランスクリプトパス。

内部メタデータはオーケストレーション専用です。ユーザー向けの返信は
通常のアシスタントの声に書き直す必要があります。

### `sessions_history` を優先する理由

`sessions_history` はより安全なオーケストレーション経路です。

- アシスタントのリコールは先に正規化されます。thinking タグは削除され、`<relevant-memories>` / `<relevant_memories>` の足場は削除され、プレーンテキストのツール呼び出し XML ペイロードブロック（`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`）は、正常に閉じない切り詰められたペイロードも含めて削除され、ダウングレードされたツール呼び出し/結果の足場と履歴コンテキストマーカーは削除され、漏えいしたモデル制御トークン（`<|assistant|>`, その他の ASCII `<|...|>`, 全角 `<｜...｜>`）は削除され、不正な MiniMax ツール呼び出し XML は削除されます。
- 認証情報/トークンらしいテキストは墨消しされます。
- 長いブロックは切り詰められることがあります。
- 非常に大きな履歴では、古い行を削除したり、過大な行を `[sessions_history omitted: message too large]` に置き換えたりできます。
- 完全なバイト単位のトランスクリプトが必要な場合、ディスク上の生トランスクリプト検査がフォールバックです。

## ツールポリシー

サブエージェントは、まず親またはターゲットエージェントと同じプロファイルおよびツールポリシーパイプラインを使います。その後、OpenClaw がサブエージェント制限レイヤーを適用します。

制限的な `tools.profile` がない場合、サブエージェントは
セッションツールとシステムツールを**除くすべてのツール**を取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

ここでも `sessions_history` は、境界付きでサニタイズされたリコールビューのままです —
生のトランスクリプトダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーターサブエージェントはさらに
`children` を管理できるように `sessions_spawn`, `subagents`, `sessions_list`, および
`sessions_history` を受け取ります。

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

`tools.subagents.tools.allow` は最終的な allow のみのフィルターです。
すでに解決済みのツールセットを絞り込むことはできますが、
`tools.profile` によって削除されたツールを**追加し直す**ことはできません。
たとえば、`tools.profile: "coding"` には `web_search`/`web_fetch` は含まれますが、
`browser` ツールは含まれません。coding プロファイルのサブエージェントで
ブラウザー自動化を使えるようにするには、プロファイル段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

1 つのエージェントだけにブラウザー自動化を与える場合は、
エージェントごとの `agents.list[].tools.alsoAllow: ["browser"]` を使います。

## 同時実行

サブエージェントは専用のプロセス内キューレーンを使います。

- **レーン名:** `subagent`
- **同時実行数:** `agents.defaults.subagents.maxConcurrent` (デフォルトは `8`)

## 生存性と復旧

OpenClaw は、`endedAt` がないことを、サブエージェントがまだ稼働中である恒久的な証拠として扱いません。
stale-run ウィンドウより古い未終了の実行は、`/subagents list`、ステータス概要、
子孫完了ゲート、およびセッションごとの同時実行チェックで active/pending として数えられなくなります。

Gateway の再起動後、復元された stale な未終了実行は、その子セッションが
`abortedLastRun: true` としてマークされていない限り prune されます。これらの
再起動により中断された子セッションは、サブエージェントの孤立復旧フローを通じて復旧可能なままになり、
そのフローは中断マーカーをクリアする前に合成 resume メッセージを送信します。

自動再起動復旧は子セッションごとに制限されます。同じサブエージェントの子が
rapid re-wedge ウィンドウ内で繰り返し孤立復旧に受け入れられた場合、OpenClaw はその
セッションに復旧 tombstone を永続化し、以後の再起動では自動 resume を停止します。
タスクレコードを整合させるには `openclaw tasks maintenance --apply` を実行し、tombstone 化されたセッション上の stale な中断復旧フラグをクリアするには
`openclaw doctor --fix` を実行します。

<Note>
サブエージェントの spawn が Gateway `PAIRING_REQUIRED` /
`scope-upgrade` で失敗する場合は、ペアリング状態を編集する前に RPC 呼び出し元を確認してください。
内部の `sessions_spawn` 調整は、直接の
loopback 共有トークン/パスワード認証を介して
`client.id: "gateway-client"`、`client.mode: "backend"` として接続する必要があります。
その経路は CLI のペアリング済みデバイススコープのベースラインに依存しません。
リモート呼び出し元、明示的な `deviceIdentity`、明示的なデバイストークン経路、
ブラウザー/node クライアントには、スコープアップグレードのための通常のデバイス承認が引き続き必要です。
</Note>

## 停止

- リクエスターのチャットで `/stop` を送信すると、リクエスターセッションが中断され、そこから spawn された active なサブエージェント実行も停止され、ネストされた子へ cascade します。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子へ cascade します。

## 制限

- サブエージェント announce は**ベストエフォート**です。Gateway が再起動すると、保留中の「announce back」作業は失われます。
- サブエージェントは同じ Gateway プロセスのリソースを引き続き共有します。`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントコンテキストは `AGENTS.md` + `TOOLS.md` のみを注入します (`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は注入しません)。
- 最大ネスト深度は 5 です (`maxSpawnDepth` の範囲: 1–5)。ほとんどのユースケースでは深度 2 が推奨されます。
- `maxChildrenPerAgent` はセッションごとの active な子の数を制限します (デフォルトは `5`、範囲は `1–20`)。

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents)
- [エージェント送信](/ja-JP/tools/agent-send)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
