---
read_when:
    - バックグラウンドまたは並列の作業をエージェント経由で行いたい場合
    - sessions_spawn またはサブエージェントツールポリシーを変更している
    - スレッドに紐づいたサブエージェントセッションを実装またはトラブルシューティングしている
sidebarTitle: Sub-agents
summary: 依頼元のチャットに結果を通知する、隔離されたバックグラウンドエージェント実行を起動する
title: サブエージェント
x-i18n:
    generated_at: "2026-04-30T05:39:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

サブエージェントは、既存のエージェント実行から生成されるバックグラウンドのエージェント実行です。
それぞれ独自のセッション (`agent:<agentId>:subagent:<uuid>`) で実行され、
完了すると結果をリクエスト元のチャットチャンネルに**通知**します。
各サブエージェント実行は
[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

主な目標:

- メイン実行をブロックせずに「調査 / 長時間タスク / 遅いツール」の作業を並列化する。
- サブエージェントをデフォルトで分離する (セッション分離 + 任意のサンドボックス化)。
- ツールサーフェスを誤用しにくく保つ: サブエージェントはデフォルトでセッションツールを取得しない。
- オーケストレーターのパターン向けに、設定可能なネスト深度をサポートする。

<Note>
**コストに関する注意:** デフォルトでは、各サブエージェントは独自のコンテキストとトークン使用量を持ちます。
重いタスクや反復的なタスクでは、サブエージェントにより安価なモデルを設定し、
メインエージェントはより高品質なモデルのままにします。
`agents.defaults.subagents.model` またはエージェントごとの上書きで設定します。
子がリクエスト元の現在のトランスクリプトを本当に必要とする場合、エージェントはその生成に対して
`context: "fork"` をリクエストできます。
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

`/subagents info` は実行メタデータ (ステータス、タイムスタンプ、セッション ID、
トランスクリプトパス、クリーンアップ) を表示します。境界付きで安全フィルター済みの想起ビューには
`sessions_history` を使用します。生の完全なトランスクリプトが必要な場合は、ディスク上のトランスクリプトパスを確認します。

### スレッドバインディング制御

これらのコマンドは、永続的なスレッドバインディングをサポートするチャンネルで動作します。
下の[スレッド対応チャンネル](#thread-supporting-channels)を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成時の動作

`/subagents spawn` は、内部リレーではなくユーザーコマンドとしてバックグラウンドのサブエージェントを開始し、
実行が完了すると、最後の完了更新をリクエスト元のチャットに送信します。

<AccordionGroup>
  <Accordion title="非ブロッキング、プッシュベースの完了">
    - 生成コマンドは非ブロッキングです。実行 ID をただちに返します。
    - 完了時、サブエージェントは要約/結果メッセージをリクエスト元のチャットチャンネルに通知します。
    - 完了はプッシュベースです。生成後は、完了待ちだけを目的として `/subagents list`、`sessions_list`、または `sessions_history` をループでポーリングしないでください。ステータスはデバッグまたは介入のために必要なときだけ確認します。
    - 完了時、OpenClaw は通知のクリーンアップフローを続行する前に、そのサブエージェントセッションによって開かれた追跡対象のブラウザータブ/プロセスをベストエフォートで閉じます。

  </Accordion>
  <Accordion title="手動生成の配信耐性">
    - OpenClaw はまず、安定した冪等性キーを使って直接 `agent` 配信を試みます。
    - 直接配信に失敗した場合は、キュールーティングにフォールバックします。
    - キュールーティングも利用できない場合、最終的に諦める前に、通知は短い指数バックオフで再試行されます。
    - 完了配信は解決済みのリクエスト元ルートを保持します。利用可能な場合は、スレッドバインドまたは会話バインドの完了ルートが優先されます。完了元がチャンネルのみを提供する場合、OpenClaw はリクエスト元セッションの解決済みルート (`lastChannel` / `lastTo` / `lastAccountId`) から不足しているターゲット/アカウントを補完し、直接配信が引き続き動作するようにします。

  </Accordion>
  <Accordion title="完了ハンドオフメタデータ">
    リクエスト元セッションへの完了ハンドオフは、実行時に生成される内部コンテキスト (ユーザーが作成したテキストではない) であり、次を含みます:

    - `Result` — 最新の表示可能な `assistant` 返信テキスト。それがない場合は、サニタイズ済みの最新 tool/toolResult テキスト。終端的に失敗した実行では、取得済みの返信テキストを再利用しません。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - コンパクトな実行時/トークン統計。
    - リクエスト元エージェントに、通常のアシスタント音声で書き直すよう指示する配信命令 (生の内部メタデータを転送しない)。

  </Accordion>
  <Accordion title="モードと ACP ランタイム">
    - `--model` と `--thinking` は、その特定の実行についてデフォルトを上書きします。
    - 完了後の詳細と出力を確認するには、`info`/`log` を使用します。
    - `/subagents spawn` はワンショットモード (`mode: "run"`) です。永続的なスレッドバインドセッションには、`thread: true` および `mode: "session"` で `sessions_spawn` を使用します。
    - ACP ハーネスセッション (Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx) では、ツールがそのランタイムを告知している場合、`runtime: "acp"` で `sessions_spawn` を使用します。完了またはエージェント間ループをデバッグする場合は、[ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model)を参照してください。`codex` plugin が有効な場合、ユーザーが ACP/acpx を明示的に要求しない限り、Codex のチャット/スレッド制御は ACP よりも `/codex ...` を優先する必要があります。
    - OpenClaw は、ACP が有効であり、リクエスト元がサンドボックス化されておらず、`acpx` などのバックエンド plugin が読み込まれるまで、`runtime: "acp"` を非表示にします。`runtime: "acp"` は外部 ACP ハーネス ID、または `runtime.type="acp"` を持つ `agents.list[]` エントリを想定します。`agents_list` の通常の OpenClaw 設定エージェントには、デフォルトのサブエージェントランタイムを使用します。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブサブエージェントは、呼び出し元が現在のトランスクリプトの fork を明示的に要求しない限り、分離された状態で開始します。

| モード       | 使用する場面                                                                                                                         | 動作                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規調査、独立した実装、遅いツール作業、またはタスクテキストで説明できるあらゆるもの                           | クリーンな子トランスクリプトを作成します。これがデフォルトで、トークン使用量を低く保ちます。  |
| `fork`     | 現在の会話、以前のツール結果、またはリクエスト元トランスクリプトにすでに存在する細かな指示に依存する作業 | 子の開始前に、リクエスト元トランスクリプトを子セッションに分岐します。 |

`fork` は慎重に使用してください。これはコンテキストに依存する委任のためのものであり、
明確なタスクプロンプトを書くことの代替ではありません。

## ツール: `sessions_spawn`

グローバルな `subagent` レーンで `deliver: false` によりサブエージェント実行を開始し、
その後、通知ステップを実行して通知返信をリクエスト元のチャットチャンネルに投稿します。

利用可否は、呼び出し元の有効なツールポリシーによって異なります。`coding` および
`full` プロファイルは、デフォルトで `sessions_spawn` を公開します。`messaging` プロファイルは
公開しません。作業を委任する必要があるエージェントには、`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` を追加するか、`tools.profile: "coding"` を使用します。
チャンネル/グループ、プロバイダー、サンドボックス、エージェントごとの許可/拒否ポリシーは、
プロファイル段階の後でもツールを削除できます。同じセッションから `/tools` を使用して、
有効なツールリストを確認してください。

**デフォルト:**

- **モデル:** `agents.defaults.subagents.model` (またはエージェントごとの `agents.list[].subagents.model`) を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` はそれでも優先されます。
- **Thinking:** `agents.defaults.subagents.thinking` (またはエージェントごとの `agents.list[].subagents.thinking`) を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` はそれでも優先されます。
- **実行タイムアウト:** `sessions_spawn.runTimeoutSeconds` が省略された場合、OpenClaw は設定されていれば `agents.defaults.subagents.runTimeoutSeconds` を使用します。それ以外の場合は `0` (タイムアウトなし) にフォールバックします。

### ツールパラメーター

<ParamField path="task" type="string" required>
  サブエージェントのタスク説明。
</ParamField>
<ParamField path="label" type="string">
  任意の人間が読めるラベル。
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` で許可されている場合、別のエージェント ID の下で生成します。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` は外部 ACP ハーネス (`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx) と、`runtime.type` が `acp` の `agents.list[]` エントリ専用です。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP のみ。`runtime: "acp"` の場合に既存の ACP ハーネスセッションを再開します。ネイティブサブエージェント生成では無視されます。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP のみ。`runtime: "acp"` の場合、ACP 実行出力を親セッションにストリーミングします。ネイティブサブエージェント生成では省略します。
</ParamField>
<ParamField path="model" type="string">
  サブエージェントモデルを上書きします。無効な値はスキップされ、サブエージェントはデフォルトモデルで実行され、ツール結果に警告が表示されます。
</ParamField>
<ParamField path="thinking" type="string">
  サブエージェント実行の thinking レベルを上書きします。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  設定されている場合は `agents.defaults.subagents.runTimeoutSeconds` がデフォルトになり、それ以外の場合は `0` になります。設定すると、サブエージェント実行は N 秒後に中止されます。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェントセッションのチャンネルスレッドバインディングをリクエストします。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略された場合、デフォルトは `session` になります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` は通知直後にアーカイブします (名前変更によりトランスクリプトは引き続き保持します)。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、対象の子ランタイムがサンドボックス化されていない限り生成を拒否します。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` はリクエスト元の現在のトランスクリプトを子セッションに分岐します。ネイティブサブエージェントのみ。子が現在のトランスクリプトを必要とする場合にのみ `fork` を使用します。
</ParamField>

<Warning>
`sessions_spawn` はチャンネル配信用パラメーター (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) を受け付けません。配信には、生成された実行から
`message`/`sessions_send` を使用します。
</Warning>

## スレッドバインドセッション

チャンネルでスレッドバインディングが有効になっている場合、サブエージェントはスレッドにバインドされたままになり、
そのスレッド内の後続ユーザーメッセージが同じサブエージェントセッションにルーティングされ続けます。

### スレッド対応チャンネル

**Discord** は現在唯一の対応チャンネルです。永続的なスレッドバインドのサブエージェントセッション (`sessions_spawn` と
`thread: true`)、手動スレッド制御 (`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`)、およびアダプターキー
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, and
`channels.discord.threadBindings.spawnSubagentSessions` をサポートします。

### クイックフロー

<Steps>
  <Step title="生成">
    `thread: true` (および必要に応じて `mode: "session"`) で `sessions_spawn`。
  </Step>
  <Step title="バインド">
    OpenClaw は、アクティブチャンネル内のそのセッションターゲットにスレッドを作成またはバインドします。
  </Step>
  <Step title="後続メッセージのルーティング">
    そのスレッド内の返信と後続メッセージは、バインドされたセッションにルーティングされます。
  </Step>
  <Step title="タイムアウトの確認">
    `/session idle` を使用して非アクティブ時の自動フォーカス解除を確認/更新し、
    `/session max-age` を使用してハード上限を制御します。
  </Step>
  <Step title="切り離し">
    手動で切り離すには `/unfocus` を使用します。
  </Step>
</Steps>

### 手動制御

| コマンド            | 効果                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッドをサブエージェント/セッションターゲットにバインドする（または作成する） |
| `/unfocus`         | 現在バインドされているスレッドのバインドを削除する                       |
| `/agents`          | アクティブな実行とバインド状態（`thread:<id>` または `unbound`）を一覧表示する       |
| `/session idle`    | アイドル時の自動フォーカス解除を確認/更新する（フォーカス中のバインド済みスレッドのみ）         |
| `/session max-age` | ハード上限を確認/更新する（フォーカス中のバインド済みスレッドのみ）                  |

### 設定スイッチ

- **グローバルデフォルト:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **チャンネルオーバーライドとスポーン自動バインドキー** はアダプター固有です。上記の [スレッド対応チャンネル](#thread-supporting-channels) を参照してください。

現在のアダプター詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference) と
[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

### 許可リスト

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  明示的な `agentId` でターゲットにできるエージェント id の一覧です（`["*"]` は任意を許可）。デフォルト: リクエスト元エージェントのみ。一覧を設定し、リクエスト元にも `agentId` で自身をスポーンさせたい場合は、リクエスト元 id を一覧に含めてください。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  リクエスト元エージェントが独自の `subagents.allowAgents` を設定していない場合に使用される、デフォルトのターゲットエージェント許可リストです。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制）。エージェント単位のオーバーライド: `agents.list[].subagents.requireAgentId`.
</ParamField>

リクエスト元セッションがサンドボックス化されている場合、`sessions_spawn` は
サンドボックス外で実行されるターゲットを拒否します。

### 検出

`sessions_spawn` で現在許可されているエージェント id を確認するには `agents_list` を使用します。
レスポンスには、列挙された各エージェントの有効なモデルと埋め込みランタイムメタデータが含まれるため、呼び出し元は PI、Codex
アプリサーバー、その他の設定済みネイティブランタイムを区別できます。

### 自動アーカイブ

- サブエージェントセッションは `agents.defaults.subagents.archiveAfterMinutes`（デフォルト `60`）の後に自動的にアーカイブされます。
- アーカイブは `sessions.delete` を使用し、トランスクリプト名を `*.deleted.<timestamp>` に変更します（同じフォルダー）。
- `cleanup: "delete"` は通知直後にアーカイブします（それでもリネームによりトランスクリプトは保持されます）。
- 自動アーカイブはベストエフォートです。Gateway が再起動すると保留中のタイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブしません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは深さ 1 と深さ 2 のセッションに同じように適用されます。
- ブラウザーのクリーンアップはアーカイブのクリーンアップとは別です。追跡されているブラウザータブ/プロセスは、トランスクリプト/セッションレコードが保持される場合でも、実行終了時にベストエフォートで閉じられます。

## ネストされたサブエージェント

デフォルトでは、サブエージェントは自身のサブエージェントをスポーンできません
（`maxSpawnDepth: 1`）。`maxSpawnDepth: 2` を設定すると、1 レベルの
ネスト、つまり **オーケストレーターパターン** を有効にできます: メイン → オーケストレーターサブエージェント →
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

### 通知チェーン

結果はチェーンを上方向に流れます:

1. 深さ 2 のワーカーが完了 → 親（深さ 1 のオーケストレーター）に通知します。
2. 深さ 1 のオーケストレーターが通知を受け取り、結果を統合して完了 → メインに通知します。
3. メインエージェントが通知を受け取り、ユーザーに届けます。

各レベルは直接の子からの通知だけを見ます。

<Note>
**運用ガイダンス:** `sessions_list`、
`sessions_history`、`/subagents list`、または `exec` のスリープコマンドを中心にポーリングループを作るのではなく、子の作業を一度開始して完了イベントを待ってください。
`sessions_list` と `/subagents list` は、子セッション関係を
ライブ作業に集中させます。ライブの子は関連付けられたままになり、終了した子は短い最近ウィンドウの間だけ
表示され、古いストアのみの子リンクは
鮮度ウィンドウ後に無視されます。これにより、再起動後に古い `spawnedBy` /
`parentSessionKey` メタデータがゴーストの子を復活させることを防ぎます。
最終回答を送信した後に子の完了イベントが到着した場合、正しいフォローアップは厳密なサイレントトークン
`NO_REPLY` / `no_reply` です。
</Note>

### 深さ別ツールポリシー

- ロールと制御範囲はスポーン時にセッションメタデータへ書き込まれます。これにより、フラット化または復元されたセッションキーが誤ってオーケストレーター権限を取り戻すことを防ぎます。
- **深さ 1（オーケストレーター、`maxSpawnDepth >= 2` の場合）:** 子を管理できるように、`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。その他のセッション/システムツールは引き続き拒否されます。
- **深さ 1（リーフ、`maxSpawnDepth == 1` の場合）:** セッションツールはありません（現在のデフォルト動作）。
- **深さ 2（リーフワーカー）:** セッションツールはありません。`sessions_spawn` は深さ 2 では常に拒否されます。さらに子をスポーンすることはできません。

### エージェント単位のスポーン上限

各エージェントセッション（任意の深さ）は、同時に最大 `maxChildrenPerAgent`
（デフォルト `5`）個のアクティブな子を持てます。これにより、単一のオーケストレーターからの暴走的なファンアウトを防ぎます。

### カスケード停止

深さ 1 のオーケストレーターを停止すると、そのすべての深さ 2 の
子も自動的に停止します:

- メインチャットでの `/stop` はすべての深さ 1 エージェントを停止し、それらの深さ 2 の子へカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子へカスケードします。
- `/subagents kill all` はリクエスト元のすべてのサブエージェントを停止し、カスケードします。

## 認証

サブエージェントの認証は、セッションタイプではなく **エージェント id** によって解決されます:

- サブエージェントセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- 認証ストアはそのエージェントの `agentDir` から読み込まれます。
- メインエージェントの認証プロファイルは **フォールバック** としてマージされます。競合時はエージェントプロファイルがメインプロファイルを上書きします。

マージは追加的なので、メインプロファイルは常に
フォールバックとして利用できます。エージェント単位で完全に分離された認証はまだサポートされていません。

## 通知

サブエージェントは通知ステップで報告します:

- 通知ステップはサブエージェントセッション内で実行されます（リクエスト元セッションではありません）。
- サブエージェントが厳密に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新のアシスタントテキストが厳密なサイレントトークン `NO_REPLY` / `no_reply` の場合、以前に表示された進捗があっても通知出力は抑制されます。

配信はリクエスト元の深さによって異なります:

- トップレベルのリクエスト元セッションは、外部配信（`deliver=true`）付きの後続 `agent` 呼び出しを使用します。
- ネストされたリクエスト元サブエージェントセッションは内部フォローアップ注入（`deliver=false`）を受け取り、オーケストレーターが子の結果をセッション内で統合できるようにします。
- ネストされたリクエスト元サブエージェントセッションがなくなっている場合、OpenClaw は利用可能であればそのセッションのリクエスト元へフォールバックします。

トップレベルのリクエスト元セッションでは、完了モードの直接配信はまず
バインドされた会話/スレッドルートとフックオーバーライドを解決し、その後
不足しているチャンネルターゲットフィールドを、リクエスト元セッションに保存されたルートから補完します。
これにより、完了の発生元がチャンネルだけを識別している場合でも、完了が正しいチャット/トピックに保たれます。

ネストされた完了所見を構築するとき、子完了の集約は現在のリクエスト元実行にスコープされ、
以前の実行の古い子出力が現在の通知へ漏れ込むのを防ぎます。通知返信は、
チャンネルアダプターで利用可能な場合、スレッド/トピックルーティングを保持します。

### 通知コンテキスト

通知コンテキストは、安定した内部イベントブロックに正規化されます:

| フィールド          | ソース                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| ソース         | `subagent` または `cron`                                                                                          |
| セッション id    | 子セッションのキー/id                                                                                          |
| タイプ           | 通知タイプ + タスクラベル                                                                                    |
| ステータス         | ランタイム結果（`success`、`error`、`timeout`、または `unknown`）から導出 — モデルテキストから推測**しません** |
| 結果内容 | 最新の表示可能なアシスタントテキスト、なければサニタイズ済みの最新ツール/toolResult テキスト                                |
| フォローアップ      | 返信する場合と沈黙を維持する場合を説明する指示                                                           |

終了済みの失敗実行は、キャプチャされた
返信テキストを再生せずに失敗ステータスを報告します。タイムアウト時、子がツール呼び出しまでしか進んでいなかった場合、通知は
生のツール出力を再生する代わりに、その履歴を短い部分進捗サマリーに折りたたむことができます。

### 統計行

通知ペイロードには末尾に統計行が含まれます（折り返される場合でも）:

- ランタイム（例: `runtime 5m12s`）。
- トークン使用量（入力/出力/合計）。
- モデル価格が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- メインエージェントが `sessions_history` で履歴を取得したり、ディスク上のファイルを確認したりできるようにするための、`sessionKey`、`sessionId`、トランスクリプトパス。

内部メタデータはオーケストレーション専用です。ユーザー向けの返信は
通常のアシスタントの声に書き直す必要があります。

### `sessions_history` を優先する理由

`sessions_history` はより安全なオーケストレーション経路です:

- アシスタントの想起は先に正規化されます: thinking タグを除去、`<relevant-memories>` / `<relevant_memories>` スキャフォールディングを除去、プレーンテキストのツール呼び出し XML ペイロードブロック（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`）を除去（きれいに閉じない切り詰められたペイロードを含む）、ダウングレードされたツール呼び出し/結果スキャフォールディングと履歴コンテキストマーカーを除去、漏洩したモデル制御トークン（`<|assistant|>`、その他の ASCII `<|...|>`、全角 `<｜...｜>`）を除去、不正な MiniMax ツール呼び出し XML を除去します。
- 認証情報/トークンらしいテキストは墨消しされます。
- 長いブロックは切り詰められることがあります。
- 非常に大きな履歴では、古い行が削除されたり、過大な行が `[sessions_history omitted: message too large]` に置き換えられたりすることがあります。
- バイト単位で完全なトランスクリプトが必要な場合、ディスク上の生トランスクリプトの確認がフォールバックです。

## ツールポリシー

サブエージェントはまず、親またはターゲットエージェントと同じプロファイルおよびツールポリシーのパイプラインを使用します。
その後、OpenClaw がサブエージェント制限レイヤーを適用します。

制限的な `tools.profile` がない場合、サブエージェントは **セッションツールとシステムツールを除くすべてのツール** を取得します:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

ここでも `sessions_history` は、境界付きでサニタイズ済みの想起ビューのままです。
生のトランスクリプトダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーターサブエージェントはさらに
子を管理できるように、`sessions_spawn`、`subagents`、`sessions_list`、および
`sessions_history` を受け取ります。

### 設定によるオーバーライド

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

`tools.subagents.tools.allow` は最終的な allow-only フィルターです。すでに解決済みのツールセットを絞り込めますが、`tools.profile` によって削除されたツールを**追加し直す**ことはできません。たとえば、`tools.profile: "coding"` には `web_search`/`web_fetch` は含まれますが、`browser` ツールは含まれません。coding プロファイルのサブエージェントがブラウザー自動化を使えるようにするには、プロファイル段階で browser を追加します。

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

サブエージェントは専用のプロセス内キューレーンを使用します。

- **レーン名:** `subagent`
- **並行実行数:** `agents.defaults.subagents.maxConcurrent` (デフォルトは `8`)

## 生存確認と復旧

OpenClaw は、`endedAt` がないことをサブエージェントがまだ生存している永続的な証拠として扱いません。stale-run ウィンドウより古い未終了の実行は、`/subagents list`、ステータス概要、子孫の完了ゲート、およびセッションごとの並行実行チェックで active/pending としてカウントされなくなります。

Gateway の再起動後、復元された古い未終了の実行は、その子セッションが `abortedLastRun: true` としてマークされていない限り整理されます。これらの再起動により中断された子セッションは、サブエージェントの孤立復旧フローを通じて引き続き復旧可能です。このフローは、中断マーカーをクリアする前に合成 resume メッセージを送信します。

<Note>
サブエージェントの spawn が Gateway の `PAIRING_REQUIRED` / `scope-upgrade` で失敗する場合は、ペアリング状態を編集する前に RPC 呼び出し元を確認してください。内部の `sessions_spawn` 調整は、直接 loopback の共有トークン/パスワード認証を介し、`client.id: "gateway-client"` および `client.mode: "backend"` として接続する必要があります。この経路は CLI のペア済みデバイススコープのベースラインに依存しません。リモート呼び出し元、明示的な `deviceIdentity`、明示的なデバイストークン経路、および browser/node クライアントでは、スコープアップグレードに通常のデバイス承認が引き続き必要です。
</Note>

## 停止

- リクエスターのチャットで `/stop` を送信すると、リクエスターセッションが中断され、そこから spawn された active なサブエージェント実行も停止し、ネストされた子にもカスケードされます。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子にもカスケードします。

## 制限事項

- サブエージェントの announce は**ベストエフォート**です。gateway が再起動すると、保留中の「announce back」作業は失われます。
- サブエージェントは引き続き同じ gateway プロセスのリソースを共有します。`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントのコンテキストは `AGENTS.md` + `TOOLS.md` のみを注入します (`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` はありません)。
- 最大ネスト深度は 5 です (`maxSpawnDepth` の範囲: 1–5)。ほとんどのユースケースでは深度 2 が推奨されます。
- `maxChildrenPerAgent` はセッションごとの active な子の数を制限します (デフォルトは `5`、範囲は `1–20`)。

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents)
- [エージェント送信](/ja-JP/tools/agent-send)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
