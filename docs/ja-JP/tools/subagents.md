---
read_when:
    - エージェント経由でバックグラウンド作業または並列作業を行いたい場合
    - sessions_spawn またはサブエージェントツールのポリシーを変更しています
    - スレッドに紐づくサブエージェントセッションを実装またはトラブルシューティングしている
sidebarTitle: Sub-agents
summary: 依頼者のチャットへ結果を通知する、隔離されたバックグラウンドエージェント実行を起動する
title: サブエージェント
x-i18n:
    generated_at: "2026-05-04T05:03:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0df39e06b952def3eb0b296f36c7dc8c0b0a115785d865236a970c5d453fc37
    source_path: tools/subagents.md
    workflow: 16
---

サブエージェントは、既存のエージェント実行から生成されるバックグラウンドのエージェント実行です。
各サブエージェントは独自のセッション (`agent:<agentId>:subagent:<uuid>`) で実行され、
完了すると、その結果をリクエスト元のチャット
チャンネルに**通知**します。各サブエージェント実行は
[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

主な目的:

- メイン実行をブロックせずに「調査 / 長時間タスク / 遅いツール」の作業を並列化する。
- サブエージェントをデフォルトで分離しておく（セッション分離 + 任意のサンドボックス化）。
- ツール面を誤用しにくく保つ: サブエージェントにはデフォルトでセッションツールを与えない。
- オーケストレーターパターン向けに、設定可能なネスト深度をサポートする。

<Note>
**コストに関する注記:** 各サブエージェントはデフォルトで独自のコンテキストとトークン使用量を持ちます。
重いタスクや反復的なタスクでは、サブエージェントに安価なモデルを設定し、
メインエージェントは高品質なモデルのままにしてください。
`agents.defaults.subagents.model` またはエージェントごとの上書きで設定します。子が
    リクエスト元の現在のトランスクリプトを本当に必要とする場合、その生成に限って
    `context: "fork"` を要求できます。スレッドに紐付いたサブエージェントセッションは、
    現在の会話をフォローアップスレッドへ分岐するため、デフォルトで
    `context: "fork"` になります。
</Note>

## スラッシュコマンド

**現在の
セッション**のサブエージェント実行を確認または制御するには、`/subagents` を使用します。

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

現在のリクエスト元セッションのアクティブな実行を誘導するには、トップレベルの [`/steer <message>`](/ja-JP/tools/steer) を使用します。対象が子の実行である場合は、`/subagents steer <id|#> <message>` を使用します。

`/subagents info` は実行メタデータ（ステータス、タイムスタンプ、セッション id、
トランスクリプトパス、クリーンアップ）を表示します。境界付きで
安全性フィルター済みの呼び出しビューには `sessions_history` を使用し、
未加工の完全なトランスクリプトが必要な場合は、ディスク上のトランスクリプトパスを確認します。

### スレッド紐付け制御

これらのコマンドは、永続的なスレッド紐付けをサポートするチャンネルで機能します。
下記の[スレッドをサポートするチャンネル](#thread-supporting-channels)を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成動作

`/subagents spawn` は、内部リレーではなくユーザーコマンドとしてバックグラウンドサブエージェントを開始し、
実行が完了すると、リクエスト元チャットへ最終的な完了更新を 1 件送信します。

<AccordionGroup>
  <Accordion title="非ブロッキングでプッシュ型の完了">
    - 生成コマンドは非ブロッキングで、実行 id を即座に返します。
    - 完了時に、サブエージェントはリクエスト元チャットチャンネルへ要約/結果メッセージを通知します。
    - 完了はプッシュ型です。生成後は、完了を待つためだけに `/subagents list`、`sessions_list`、`sessions_history` をループでポーリングしないでください。デバッグや介入のために必要な場合のみ、オンデマンドでステータスを確認します。
    - 完了時に、OpenClaw は通知のクリーンアップフローが続く前に、そのサブエージェントセッションが開いた追跡対象のブラウザータブ/プロセスをベストエフォートで閉じます。

  </Accordion>
  <Accordion title="手動生成の配信耐性">
    - OpenClaw はまず、安定した冪等性キーで直接 `agent` 配信を試みます。
    - 直接配信に失敗した場合、キュールーティングへフォールバックします。
    - キュールーティングもまだ利用できない場合、最終的に諦める前に、短い指数バックオフで通知を再試行します。
    - 完了配信は、解決済みのリクエスト元ルートを保持します。利用可能な場合は、スレッドに紐付いた完了ルートまたは会話に紐付いた完了ルートが優先されます。完了元がチャンネルのみを提供する場合、OpenClaw はリクエスト元セッションの解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足している対象/アカウントを補完し、直接配信が引き続き機能するようにします。

  </Accordion>
  <Accordion title="完了引き渡しメタデータ">
    リクエスト元セッションへの完了引き渡しは、実行時に生成される
    内部コンテキスト（ユーザーが作成したテキストではありません）で、次を含みます。

    - `Result` — 最新の可視 `assistant` 返信テキスト。それがない場合は、サニタイズ済みの最新ツール/ツール結果テキスト。終端で失敗した実行は、取得済みの返信テキストを再利用しません。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - コンパクトな実行時/トークン統計。
    - リクエスト元エージェントに、未加工の内部メタデータを転送せず、通常のアシスタントの声で書き直すよう伝える配信指示。

  </Accordion>
  <Accordion title="モードと ACP ランタイム">
    - `--model` と `--thinking` は、その特定の実行のデフォルトを上書きします。
    - 完了後に詳細と出力を確認するには、`info`/`log` を使用します。
    - `/subagents spawn` はワンショットモード（`mode: "run"`）です。永続的なスレッド紐付きセッションには、`thread: true` と `mode: "session"` を指定して `sessions_spawn` を使用します。
    - ACP ハーネスセッション（Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx）では、ツールがそのランタイムを公開している場合に `runtime: "acp"` を指定して `sessions_spawn` を使用します。完了やエージェント間ループをデバッグするときは、[ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model)を参照してください。`codex` plugin が有効な場合、Codex のチャット/スレッド制御では、ユーザーが ACP/acpx を明示的に求めない限り、ACP より `/codex ...` を優先してください。
    - OpenClaw は、ACP が有効で、リクエスト元がサンドボックス化されておらず、`acpx` などのバックエンド plugin が読み込まれるまで、`runtime: "acp"` を隠します。`runtime: "acp"` は、外部 ACP ハーネス id、または `runtime.type="acp"` を持つ `agents.list[]` エントリを想定します。`agents_list` の通常の OpenClaw 設定エージェントには、デフォルトのサブエージェントランタイムを使用してください。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブサブエージェントは、呼び出し元が現在のトランスクリプトのフォークを明示的に要求しない限り、分離状態で開始します。

| モード       | 使用する場面                                                                                                                         | 動作                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規調査、独立した実装、遅いツール作業、またはタスク本文で説明できるあらゆる作業                           | クリーンな子トランスクリプトを作成します。これがデフォルトで、トークン使用量を低く保ちます。  |
| `fork`     | 現在の会話、以前のツール結果、またはリクエスト元トランスクリプトにすでに存在する微妙な指示に依存する作業 | 子の開始前に、リクエスト元トランスクリプトを子セッションへ分岐します。 |

`fork` は控えめに使用してください。これはコンテキストに敏感な委任のためのものであり、
明確なタスクプロンプトを書くことの代替ではありません。

## ツール: `sessions_spawn`

グローバルな `subagent` レーンで `deliver: false` のサブエージェント実行を開始し、
その後に通知ステップを実行して、通知返信をリクエスト元チャットチャンネルへ投稿します。

利用可否は、呼び出し元の有効なツールポリシーに依存します。`coding` と
`full` プロファイルは、デフォルトで `sessions_spawn` を公開します。`messaging` プロファイルは
公開しません。作業を委任する必要があるエージェントには、`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` を追加するか、`tools.profile: "coding"` を使用します。
チャンネル/グループ、プロバイダー、サンドボックス、エージェントごとの許可/拒否ポリシーは、
プロファイル段階の後でもツールを削除できます。同じ
セッションから `/tools` を使用して、有効なツール一覧を確認してください。

**デフォルト:**

- **モデル:** `agents.defaults.subagents.model`（またはエージェントごとの `agents.list[].subagents.model`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` がある場合は、そちらが引き続き優先されます。
- **Thinking:** `agents.defaults.subagents.thinking`（またはエージェントごとの `agents.list[].subagents.thinking`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` がある場合は、そちらが引き続き優先されます。
- **実行タイムアウト:** `sessions_spawn.runTimeoutSeconds` が省略された場合、設定されていれば OpenClaw は `agents.defaults.subagents.runTimeoutSeconds` を使用します。そうでなければ `0`（タイムアウトなし）へフォールバックします。

### ツールパラメーター

<ParamField path="task" type="string" required>
  サブエージェントのタスク説明。
</ParamField>
<ParamField path="label" type="string">
  任意の人間が読めるラベル。
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` で許可されている場合、別のエージェント id の下で生成します。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` は外部 ACP ハーネス（`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx）、および `runtime.type` が `acp` の `agents.list[]` エントリ専用です。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP のみ。`runtime: "acp"` の場合に既存の ACP ハーネスセッションを再開します。ネイティブサブエージェント生成では無視されます。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP のみ。`runtime: "acp"` の場合に ACP 実行出力を親セッションへストリーミングします。ネイティブサブエージェント生成では省略します。
</ParamField>
<ParamField path="model" type="string">
  サブエージェントモデルを上書きします。無効な値はスキップされ、サブエージェントはデフォルトモデルで実行され、ツール結果に警告が表示されます。
</ParamField>
<ParamField path="thinking" type="string">
  サブエージェント実行の Thinking レベルを上書きします。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  設定されている場合は `agents.defaults.subagents.runTimeoutSeconds` がデフォルトになり、そうでなければ `0` になります。設定すると、サブエージェント実行は N 秒後に中止されます。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェントセッションにチャンネルスレッド紐付けを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略された場合、デフォルトは `session` になります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` は通知後すぐにアーカイブします（リネームによりトランスクリプトは保持します）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、対象の子ランタイムがサンドボックス化されていない限り生成を拒否します。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` は、リクエスト元の現在のトランスクリプトを子セッションへ分岐します。ネイティブサブエージェントのみ。スレッドに紐付いた生成はデフォルトで `fork`、非スレッド生成はデフォルトで `isolated` です。
</ParamField>

<Warning>
`sessions_spawn` はチャンネル配信パラメーター（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、
生成された実行から `message`/`sessions_send` を使用します。
</Warning>

## スレッド紐付きセッション

チャンネルでスレッド紐付けが有効な場合、サブエージェントはスレッドに紐付いたままでいられるため、
そのスレッド内のフォローアップユーザーメッセージは同じサブエージェントセッションへルーティングされ続けます。

### スレッドをサポートするチャンネル

**Discord** は現在、唯一サポートされているチャンネルです。これは
永続的なスレッド紐付きサブエージェントセッション（`thread: true` を指定した `sessions_spawn`）、
手動スレッド制御（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`）、およびアダプターキー
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours`、および
`channels.discord.threadBindings.spawnSessions` をサポートします。

### クイックフロー

<Steps>
  <Step title="生成">
    `thread: true`（任意で `mode: "session"`）を指定して `sessions_spawn`。
  </Step>
  <Step title="紐付け">
    OpenClaw は、そのセッション対象に対してアクティブなチャンネル内でスレッドを作成または紐付けます。
  </Step>
  <Step title="フォローアップのルーティング">
    そのスレッド内の返信とフォローアップメッセージは、紐付いたセッションへルーティングされます。
  </Step>
  <Step title="タイムアウトの確認">
    非アクティブ時の自動フォーカス解除を確認/更新するには `/session idle` を使用し、
    ハード上限を制御するには `/session max-age` を使用します。
  </Step>
  <Step title="切り離し">
    手動で切り離すには `/unfocus` を使用します。
  </Step>
</Steps>

### 手動制御

| コマンド          | 効果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッドをサブエージェント/セッションターゲットにバインドする（または作成する） |
| `/unfocus`         | 現在バインドされているスレッドのバインドを削除する                    |
| `/agents`          | アクティブな実行とバインド状態（`thread:<id>` または `unbound`）を一覧表示する |
| `/session idle`    | アイドル時の自動アンフォーカスを確認/更新する（フォーカス中のバインド済みスレッドのみ） |
| `/session max-age` | ハード上限を確認/更新する（フォーカス中のバインド済みスレッドのみ）    |

### 設定スイッチ

- **グローバル既定値:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **チャンネルのオーバーライドとスポーン時の自動バインドキー**はアダプター固有です。上記の[スレッド対応チャンネル](#thread-supporting-channels)を参照してください。

現在のアダプター詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference)と
[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

### 許可リスト

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  明示的な `agentId`（`["*"]` は任意を許可）でターゲットにできるエージェント ID の一覧。既定値: リクエスト元エージェントのみ。一覧を設定し、リクエスト元が `agentId` で自身をスポーンできるようにもしたい場合は、リクエスト元 ID を一覧に含めます。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  リクエスト元エージェントが独自の `subagents.allowAgents` を設定していない場合に使われる、既定のターゲットエージェント許可リスト。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します）。エージェントごとのオーバーライド: `agents.list[].subagents.requireAgentId`。
</ParamField>

リクエスト元セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス外で実行されるターゲットを拒否します。

### 検出

`sessions_spawn` で現在許可されているエージェント ID を確認するには、`agents_list` を使用します。レスポンスには、一覧に含まれる各エージェントの有効なモデルと埋め込みランタイムメタデータが含まれるため、呼び出し元は PI、Codex app-server、その他の設定済みネイティブランタイムを区別できます。

### 自動アーカイブ

- サブエージェントセッションは、`agents.defaults.subagents.archiveAfterMinutes`（既定値 `60`）後に自動的にアーカイブされます。
- アーカイブでは `sessions.delete` を使用し、トランスクリプトの名前を `*.deleted.<timestamp>`（同じフォルダー）に変更します。
- `cleanup: "delete"` は announce の直後にアーカイブします（リネームによってトランスクリプトは保持されます）。
- 自動アーカイブはベストエフォートです。Gateway が再起動すると、保留中のタイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブしません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは深さ 1 と深さ 2 のセッションに同じように適用されます。
- ブラウザーのクリーンアップはアーカイブのクリーンアップとは別です。追跡されたブラウザータブ/プロセスは、トランスクリプト/セッションレコードを保持する場合でも、実行終了時にベストエフォートで閉じられます。

## ネストされたサブエージェント

既定では、サブエージェントは自身のサブエージェントをスポーンできません
（`maxSpawnDepth: 1`）。1 レベルのネストを有効にするには `maxSpawnDepth: 2` を設定します。これは**オーケストレーターパターン**です: メイン → オーケストレーターサブエージェント →
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

| 深さ | セッションキーの形状                         | ロール                                        | スポーン可能か                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | メインエージェント                            | 常に可能                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | サブエージェント（深さ 2 が許可されている場合はオーケストレーター） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（リーフワーカー）        | 不可                          |

### Announce チェーン

結果はチェーンをさかのぼって流れます。

1. 深さ 2 のワーカーが完了 → 親（深さ 1 のオーケストレーター）に announce します。
2. 深さ 1 のオーケストレーターが announce を受け取り、結果を合成し、完了 → メインに announce します。
3. メインエージェントが announce を受け取り、ユーザーに届けます。

各レベルは、直接の子からの announce のみを参照します。

<Note>
**運用ガイダンス:** `sessions_list`、
`sessions_history`、`/subagents list`、または `exec` の sleep コマンドを中心にポーリングループを構築するのではなく、子の作業を一度開始して完了イベントを待ちます。
`sessions_list` と `/subagents list` は子セッション関係をライブ作業に集中させます。ライブの子は関連付けられたままになり、終了済みの子は短い recent ウィンドウの間だけ表示され、古いストアのみの子リンクは鮮度ウィンドウ後に無視されます。これにより、再起動後に古い `spawnedBy` /
`parentSessionKey` メタデータがゴーストの子を復活させることを防ぎます。最終回答を送信した後に子の完了イベントが届いた場合、正しいフォローアップは正確なサイレントトークン
`NO_REPLY` / `no_reply` です。
</Note>

### 深さ別ツールポリシー

- ロールと制御スコープはスポーン時にセッションメタデータへ書き込まれます。これにより、フラットなセッションキーや復元されたセッションキーが誤ってオーケストレーター権限を取り戻すことを防ぎます。
- **深さ 1（`maxSpawnDepth >= 2` の場合のオーケストレーター）:** 子を管理できるように、`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。その他のセッション/システムツールは拒否されたままです。
- **深さ 1（`maxSpawnDepth == 1` の場合のリーフ）:** セッションツールなし（現在の既定の動作）。
- **深さ 2（リーフワーカー）:** セッションツールなし。`sessions_spawn` は深さ 2 では常に拒否されます。それ以上の子はスポーンできません。

### エージェントごとのスポーン上限

各エージェントセッション（どの深さでも）は、同時に最大 `maxChildrenPerAgent`
（既定値 `5`）個のアクティブな子を持てます。これにより、単一のオーケストレーターからの制御不能なファンアウトを防ぎます。

### カスケード停止

深さ 1 のオーケストレーターを停止すると、そのすべての深さ 2 の子も自動的に停止します。

- メインチャットの `/stop` はすべての深さ 1 エージェントを停止し、その深さ 2 の子にカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子にカスケードします。
- `/subagents kill all` はリクエスト元のすべてのサブエージェントを停止し、カスケードします。

## 認証

サブエージェントの認証は、セッションタイプではなく**エージェント ID**で解決されます。

- サブエージェントセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- 認証ストアはそのエージェントの `agentDir` から読み込まれます。
- メインエージェントの認証プロファイルは**フォールバック**としてマージされます。競合時はエージェントプロファイルがメインプロファイルをオーバーライドします。

マージは加算的なので、メインプロファイルは常にフォールバックとして利用できます。エージェントごとに完全に分離された認証は、まだサポートされていません。

## Announce

サブエージェントは announce ステップを通じて報告します。

- announce ステップは、リクエスト元セッションではなくサブエージェントセッション内で実行されます。
- サブエージェントが正確に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新のアシスタントテキストが正確なサイレントトークン `NO_REPLY` / `no_reply` の場合、それ以前に表示される進捗が存在していても announce 出力は抑制されます。

配信はリクエスト元の深さによって異なります。

- トップレベルのリクエスト元セッションは、外部配信（`deliver=true`）付きのフォローアップ `agent` 呼び出しを使用します。
- ネストされたリクエスト元サブエージェントセッションは内部フォローアップ注入（`deliver=false`）を受け取るため、オーケストレーターは子の結果をセッション内で合成できます。
- ネストされたリクエスト元サブエージェントセッションが存在しない場合、OpenClaw は利用可能であればそのセッションのリクエスト元にフォールバックします。

トップレベルのリクエスト元セッションでは、完了モードの直接配信はまず、バインドされた会話/スレッドルートとフックオーバーライドを解決し、その後、リクエスト元セッションに保存されたルートから不足しているチャンネルターゲットフィールドを埋めます。これにより、完了の発信元がチャンネルのみを識別している場合でも、完了は正しいチャット/トピックに留まります。

ネストされた完了結果を構築するとき、子の完了集約は現在のリクエスト元実行にスコープされ、古い以前の実行の子出力が現在の announce に漏れ込むことを防ぎます。announce 返信は、チャンネルアダプターで利用可能な場合、スレッド/トピックルーティングを保持します。

### Announce コンテキスト

Announce コンテキストは安定した内部イベントブロックに正規化されます。

| フィールド     | ソース                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| ソース         | `subagent` または `cron`                                                                                      |
| セッション ID  | 子セッションキー/id                                                                                          |
| タイプ         | Announce タイプ + タスクラベル                                                                                |
| ステータス     | ランタイム結果（`success`、`error`、`timeout`、または `unknown`）から派生。モデルテキストからは推測**されません** |
| 結果コンテンツ | 最新の表示可能なアシスタントテキスト。それがなければサニタイズ済みの最新 tool/toolResult テキスト            |
| フォローアップ | 返信する場合と沈黙を保つ場合を説明する指示                                                                    |

終端で失敗した実行は、キャプチャされた返信テキストを再生せずに失敗ステータスを報告します。タイムアウト時に子がツール呼び出しまでしか進まなかった場合、announce は生のツール出力を再生する代わりに、その履歴を短い部分進捗サマリーへ圧縮できます。

### 統計行

Announce ペイロードには末尾に統計行が含まれます（折り返されている場合でも）。

- ランタイム（例: `runtime 5m12s`）。
- トークン使用量（入力/出力/合計）。
- モデル価格が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId`、およびトランスクリプトパス。メインエージェントが `sessions_history` で履歴を取得したり、ディスク上のファイルを検査したりできます。

内部メタデータはオーケストレーション専用です。ユーザー向けの返信は通常のアシスタントの声に書き直す必要があります。

### `sessions_history` を推奨する理由

`sessions_history` はより安全なオーケストレーション経路です。

- アシスタントの recall は最初に正規化されます。thinking タグを除去し、`<relevant-memories>` / `<relevant_memories>` の足場を除去し、プレーンテキストのツール呼び出し XML ペイロードブロック（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`）を、正しく閉じていない切り詰められたペイロードも含めて除去し、ダウングレードされたツール呼び出し/結果の足場と履歴コンテキストマーカーを除去し、漏洩したモデル制御トークン（`<|assistant|>`、その他の ASCII `<|...|>`、全角 `<｜...｜>`）を除去し、不正な MiniMax ツール呼び出し XML を除去します。
- 認証情報/トークンのようなテキストはリダクトされます。
- 長いブロックは切り詰められる場合があります。
- 非常に大きな履歴では、古い行が削除されたり、サイズが過大な行が `[sessions_history omitted: message too large]` に置き換えられたりする場合があります。
- 完全なバイト単位のトランスクリプトが必要な場合、ディスク上の生トランスクリプト検査がフォールバックです。

## ツールポリシー

サブエージェントはまず、親またはターゲットエージェントと同じプロファイルとツールポリシーパイプラインを使用します。その後、OpenClaw がサブエージェント制限レイヤーを適用します。

制限的な `tools.profile` がない場合、サブエージェントは**セッションツール**とシステムツールを除くすべてのツールを取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

ここでも `sessions_history` は、境界のあるサニタイズ済み recall ビューのままです。生のトランスクリプトダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーターサブエージェントは、子を管理できるように `sessions_spawn`、`subagents`、`sessions_list`、および
`sessions_history` も受け取ります。

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

`tools.subagents.tools.allow` は最終的な許可専用フィルターです。すでに解決済みのツールセットを絞り込むことはできますが、`tools.profile` によって削除されたツールを**追加し直す**ことはできません。たとえば、`tools.profile: "coding"` には `web_search`/`web_fetch` が含まれますが、`browser` ツールは含まれません。coding プロファイルのサブエージェントでブラウザ自動化を使えるようにするには、プロファイル段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

1 つのエージェントだけにブラウザ自動化を許可する場合は、エージェントごとの `agents.list[].tools.alsoAllow: ["browser"]` を使用します。

## 並行実行

サブエージェントは専用のインプロセスキューレーンを使用します。

- **レーン名:** `subagent`
- **並行数:** `agents.defaults.subagents.maxConcurrent` (デフォルト `8`)

## 生存確認と復旧

OpenClaw は `endedAt` が存在しないことを、サブエージェントがまだ生きている恒久的な証拠として扱いません。stale-run ウィンドウより古い未終了の実行は、`/subagents list`、ステータス要約、子孫完了ゲート、およびセッションごとの並行実行チェックで active/pending としてカウントされなくなります。

Gateway 再起動後、古くなった未終了の復元済み実行は、その子セッションが `abortedLastRun: true` としてマークされていない限り剪定されます。これらの再起動により中断された子セッションは、サブエージェントの孤立復旧フローを通じて復旧可能なままです。このフローは、中断マーカーをクリアする前に合成 resume メッセージを送信します。

自動再起動復旧は子セッションごとに制限されます。同じサブエージェントの子が rapid re-wedge ウィンドウ内で繰り返し孤立復旧に受け入れられた場合、OpenClaw はそのセッションに復旧 tombstone を永続化し、以降の再起動で自動再開を停止します。タスクレコードを整合させるには `openclaw tasks maintenance --apply` を実行し、tombstone 化されたセッション上の古い中断済み復旧フラグをクリアするには `openclaw doctor --fix` を実行します。

<Note>
サブエージェントの spawn が Gateway `PAIRING_REQUIRED` / `scope-upgrade` で失敗する場合は、ペアリング状態を編集する前に RPC 呼び出し元を確認してください。内部の `sessions_spawn` 調整は、直接 loopback の共有トークン/パスワード認証を介して、`client.id: "gateway-client"` と `client.mode: "backend"` で接続する必要があります。この経路は、CLI のペアリング済みデバイスのスコープベースラインには依存しません。リモート呼び出し元、明示的な `deviceIdentity`、明示的なデバイストークン経路、およびブラウザ/node クライアントでは、スコープアップグレードに通常のデバイス承認が引き続き必要です。
</Note>

## 停止

- リクエスターのチャットで `/stop` を送信すると、リクエスターセッションが中断され、そこから spawn されたアクティブなサブエージェント実行がすべて停止され、ネストされた子にもカスケードされます。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子にもカスケードします。

## 制限事項

- サブエージェントの announce は**ベストエフォート**です。Gateway が再起動すると、保留中の「announce back」作業は失われます。
- サブエージェントは同じ Gateway プロセスリソースを引き続き共有します。`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントコンテキストは `AGENTS.md` + `TOOLS.md` のみを注入します (`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は注入しません)。
- 最大ネスト深度は 5 です (`maxSpawnDepth` の範囲: 1–5)。ほとんどのユースケースでは深度 2 を推奨します。
- `maxChildrenPerAgent` はセッションごとのアクティブな子の数を制限します (デフォルト `5`、範囲 `1–20`)。

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents)
- [エージェント送信](/ja-JP/tools/agent-send)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
