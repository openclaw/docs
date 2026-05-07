---
read_when:
    - エージェント経由でバックグラウンド作業または並列作業を行いたい場合
    - sessions_spawn またはサブエージェントツールポリシーを変更しています
    - スレッドに紐づいたサブエージェントセッションを実装またはトラブルシューティングしている
sidebarTitle: Sub-agents
summary: 結果を依頼元のチャットに通知する、分離されたバックグラウンドエージェント実行を起動する
title: サブエージェント
x-i18n:
    generated_at: "2026-05-07T13:27:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

サブエージェントは、既存のエージェント実行から生成されるバックグラウンドのエージェント実行です。
それぞれ独自のセッション (`agent:<agentId>:subagent:<uuid>`) で実行され、
完了すると結果をリクエスト元のチャットチャネルに**通知**します。各サブエージェント実行は
[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

主な目的:

- メイン実行をブロックせずに「調査 / 長時間タスク / 低速ツール」の作業を並列化する。
- デフォルトでサブエージェントを分離する (セッション分離 + 任意のサンドボックス化)。
- ツール面を誤用しにくく保つ: サブエージェントはデフォルトでセッションツールを取得しません。
- オーケストレーターパターン向けに、設定可能なネスト深度をサポートする。

<Note>
**コストに関する注意:** デフォルトでは、各サブエージェントは独自のコンテキストとトークン使用量を持ちます。重いタスクや反復的なタスクでは、サブエージェントにより安価なモデルを設定し、メインエージェントはより高品質なモデルのままにします。`agents.defaults.subagents.model` またはエージェントごとのオーバーライドで設定します。子がリクエスト元の現在のトランスクリプトを本当に必要とする場合、エージェントはその 1 回の生成で `context: "fork"` を要求できます。スレッドに紐づくサブエージェントセッションは、現在の会話をフォローアップスレッドに分岐させるため、デフォルトで `context: "fork"` になります。
</Note>

## スラッシュコマンド

**現在のセッション**のサブエージェント実行を確認または制御するには `/subagents` を使用します:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

現在のリクエスト元セッションのアクティブな実行を誘導するには、トップレベルの [`/steer <message>`](/ja-JP/tools/steer) を使用します。対象が子実行の場合は `/subagents steer <id|#> <message>` を使用します。

`/subagents info` は実行メタデータ (ステータス、タイムスタンプ、セッション ID、トランスクリプトパス、クリーンアップ) を表示します。範囲付きで安全性フィルタ済みのリコールビューには `sessions_history` を使用します。生の完全なトランスクリプトが必要な場合は、ディスク上のトランスクリプトパスを確認します。

### スレッド紐づけ制御

これらのコマンドは、永続的なスレッド紐づけをサポートするチャネルで動作します。
下記の[スレッド対応チャネル](#thread-supporting-channels)を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成時の動作

`/subagents spawn` はバックグラウンドサブエージェントをユーザーコマンド (内部リレーではない) として開始し、実行が完了すると、リクエスト元チャットに最終完了更新を 1 回送信します。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - 生成コマンドはノンブロッキングです。実行 ID をすぐに返します。
    - 完了時に、サブエージェントは要約/結果メッセージをリクエスト元のチャットチャネルへ通知します。
    - 完了はプッシュベースです。生成後は、完了を待つ目的だけで `/subagents list`、`sessions_list`、または `sessions_history` をループでポーリングしないでください。ステータスの確認は、デバッグまたは介入が必要なときだけオンデマンドで行います。
    - 完了時、OpenClaw は通知クリーンアップフローが続行する前に、そのサブエージェントセッションによって開かれた追跡対象のブラウザータブ/プロセスをベストエフォートで閉じます。

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw は、安定した冪等性キーを持つ `agent` ターンを通じて、完了をリクエスト元セッションに返します。
    - リクエスト元の実行がまだアクティブな場合、OpenClaw は 2 つ目の表示される返信経路を開始する代わりに、まずその実行を起動/誘導しようとします。
    - リクエスト元エージェントへの完了ハンドオフが失敗するか表示可能な出力を生成しない場合、OpenClaw は配信を失敗として扱い、キュールーティング/リトライにフォールバックします。子の結果を外部チャットへ直接 raw 送信することはありません。
    - 直接ハンドオフを使用できない場合は、キュールーティングにフォールバックします。
    - それでもキュールーティングを使用できない場合、最終的に断念する前に、短い指数バックオフで通知をリトライします。
    - 完了配信は、解決済みのリクエスト元ルートを保持します。スレッドに紐づく、または会話に紐づく完了ルートが利用可能な場合はそれが優先されます。完了元がチャネルのみを提供する場合、OpenClaw はリクエスト元セッションの解決済みルート (`lastChannel` / `lastTo` / `lastAccountId`) から不足しているターゲット/アカウントを補完し、直接配信が引き続き動作するようにします。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    リクエスト元セッションへの完了ハンドオフは、ランタイム生成の内部コンテキスト (ユーザーが作成したテキストではない) であり、次を含みます:

    - `Result` — 最新の表示可能な `assistant` 返信テキスト。なければ、サニタイズ済みの最新の tool/toolResult テキスト。終端状態で失敗した実行は、キャプチャ済みの返信テキストを再利用しません。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - コンパクトなランタイム/トークン統計。
    - リクエスト元エージェントに対し、通常のアシスタント音声で書き直す (生の内部メタデータを転送しない) よう伝える配信指示。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` と `--thinking` は、その特定の実行のデフォルトをオーバーライドします。
    - 完了後に詳細と出力を確認するには `info`/`log` を使用します。
    - `/subagents spawn` はワンショットモード (`mode: "run"`) です。永続的なスレッド紐づきセッションには、`thread: true` および `mode: "session"` を指定して `sessions_spawn` を使用します。
    - ACP ハーネスセッション (Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx) では、ツールがそのランタイムを通知している場合に `runtime: "acp"` を指定して `sessions_spawn` を使用します。完了やエージェント間ループをデバッグする場合は、[ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model)を参照してください。`codex` Plugin が有効な場合、ユーザーが ACP/acpx を明示的に求めない限り、Codex のチャット/スレッド制御では ACP より `/codex ...` を優先してください。
    - OpenClaw は、ACP が有効で、リクエスト元がサンドボックス化されておらず、`acpx` などのバックエンド Plugin が読み込まれるまで、`runtime: "acp"` を非表示にします。`runtime: "acp"` は、外部 ACP ハーネス ID、または `runtime.type="acp"` を持つ `agents.list[]` エントリを想定します。`agents_list` の通常の OpenClaw 設定エージェントには、デフォルトのサブエージェントランタイムを使用します。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブサブエージェントは、呼び出し元が現在のトランスクリプトのフォークを明示的に要求しない限り、分離された状態で開始します。

| モード       | 使用する場面                                                                                                                         | 動作                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規調査、独立した実装、低速ツール作業、またはタスクテキストで簡潔に説明できるもの                           | クリーンな子トランスクリプトを作成します。これがデフォルトであり、トークン使用量を低く保ちます。  |
| `fork`     | 現在の会話、過去のツール結果、またはリクエスト元トランスクリプトにすでに存在する微妙な指示に依存する作業 | 子が開始する前に、リクエスト元トランスクリプトを子セッションに分岐します。 |

`fork` は控えめに使用してください。これはコンテキスト依存の委任のためのものであり、明確なタスクプロンプトを書くことの代替ではありません。

## ツール: `sessions_spawn`

グローバルな `subagent` レーンで `deliver: false` のサブエージェント実行を開始し、その後通知ステップを実行して、通知返信をリクエスト元のチャットチャネルに投稿します。

利用可否は、呼び出し元の有効なツールポリシーによって決まります。`coding` および `full` プロファイルは、デフォルトで `sessions_spawn` を公開します。`messaging` プロファイルは公開しません。作業を委任するエージェントには、`tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]` を追加するか、`tools.profile: "coding"` を使用します。チャネル/グループ、プロバイダー、サンドボックス、およびエージェントごとの許可/拒否ポリシーは、プロファイル段階の後でもツールを削除できます。同じセッションから `/tools` を使用して、有効なツール一覧を確認します。

**デフォルト:**

- **モデル:** `agents.defaults.subagents.model` (またはエージェントごとの `agents.list[].subagents.model`) を設定しない限り呼び出し元を継承します。明示的な `sessions_spawn.model` は引き続き優先されます。
- **Thinking:** `agents.defaults.subagents.thinking` (またはエージェントごとの `agents.list[].subagents.thinking`) を設定しない限り呼び出し元を継承します。明示的な `sessions_spawn.thinking` は引き続き優先されます。
- **実行タイムアウト:** `sessions_spawn.runTimeoutSeconds` が省略された場合、設定されていれば OpenClaw は `agents.defaults.subagents.runTimeoutSeconds` を使用します。そうでなければ `0` (タイムアウトなし) にフォールバックします。

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
  `acp` は、外部 ACP ハーネス (`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx) と、`runtime.type` が `acp` である `agents.list[]` エントリ専用です。
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
  設定されている場合は `agents.defaults.subagents.runTimeoutSeconds` がデフォルトになり、それ以外の場合は `0` になります。設定されている場合、サブエージェント実行は N 秒後に中止されます。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェントセッションにチャネルスレッド紐づけを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略された場合、デフォルトは `session` になります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` は通知直後にアーカイブします (リネームによりトランスクリプトは引き続き保持します)。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、対象の子ランタイムがサンドボックス化されていない限り生成を拒否します。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` は、リクエスト元の現在のトランスクリプトを子セッションに分岐します。ネイティブサブエージェントのみ。スレッドに紐づく生成はデフォルトで `fork` になり、非スレッド生成はデフォルトで `isolated` になります。
</ParamField>

<Warning>
`sessions_spawn` はチャネル配信パラメーター (`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`) を受け付けません。配信には、生成された実行から
`message`/`sessions_send` を使用します。
</Warning>

## スレッドに紐づくセッション

チャネルでスレッド紐づけが有効な場合、サブエージェントはスレッドに紐づいたままになれるため、そのスレッド内の後続のユーザーメッセージは同じサブエージェントセッションにルーティングされ続けます。

### スレッド対応チャネル

**Discord** は現在サポートされている唯一のチャネルです。永続的なスレッド紐づきサブエージェントセッション (`thread: true` を指定した `sessions_spawn`)、手動スレッド制御 (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`)、およびアダプターキー
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours`、および
`channels.discord.threadBindings.spawnSessions` をサポートします。

### クイックフロー

<Steps>
  <Step title="生成">
    `thread: true`（任意で `mode: "session"`）を指定して `sessions_spawn`。
  </Step>
  <Step title="バインド">
    OpenClaw は、アクティブなチャンネル内でそのセッションターゲットにスレッドを作成またはバインドします。
  </Step>
  <Step title="フォローアップのルーティング">
    そのスレッド内の返信とフォローアップメッセージは、バインドされたセッションへルーティングされます。
  </Step>
  <Step title="タイムアウトの確認">
    非アクティブ時の自動フォーカス解除を確認/更新するには `/session idle` を使い、
    ハード上限を制御するには `/session max-age` を使います。
  </Step>
  <Step title="デタッチ">
    手動でデタッチするには `/unfocus` を使います。
  </Step>
</Steps>

### 手動制御

| コマンド           | 効果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッド（または新規作成したスレッド）をサブエージェント/セッションターゲットにバインドします |
| `/unfocus`         | 現在バインドされているスレッドのバインドを削除します                  |
| `/agents`          | アクティブな実行とバインド状態（`thread:<id>` または `unbound`）を一覧表示します |
| `/session idle`    | アイドル時の自動フォーカス解除を確認/更新します（フォーカス中のバインド済みスレッドのみ） |
| `/session max-age` | ハード上限を確認/更新します（フォーカス中のバインド済みスレッドのみ） |

### 設定スイッチ

- **グローバルデフォルト:** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **チャンネル上書きと生成時の自動バインドキー**はアダプター固有です。上記の[スレッド対応チャンネル](#thread-supporting-channels)を参照してください。

現在のアダプター詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference)と
[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

### 許可リスト

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  明示的な `agentId` でターゲットにできるエージェント id の一覧（`["*"]` は任意を許可）。デフォルト: リクエスト元エージェントのみ。リストを設定し、リクエスト元自身も `agentId` で生成できるようにしたい場合は、そのリクエスト元 id をリストに含めます。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  リクエスト元エージェントが自身の `subagents.allowAgents` を設定していない場合に使われる、デフォルトのターゲットエージェント許可リスト。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制）。エージェント単位の上書き: `agents.list[].subagents.requireAgentId`。
</ParamField>

リクエスト元セッションがサンドボックス化されている場合、`sessions_spawn` は
サンドボックス外で実行されるターゲットを拒否します。

### 検出

`sessions_spawn` に現在許可されているエージェント id を確認するには
`agents_list` を使います。レスポンスには、一覧にある各エージェントの有効な
モデルと埋め込みランタイムメタデータが含まれるため、呼び出し元は PI、Codex
アプリサーバー、その他の設定済みネイティブランタイムを区別できます。

### 自動アーカイブ

- サブエージェントセッションは `agents.defaults.subagents.archiveAfterMinutes`（デフォルト `60`）後に自動的にアーカイブされます。
- アーカイブは `sessions.delete` を使い、トランスクリプトを `*.deleted.<timestamp>` にリネームします（同じフォルダー）。
- `cleanup: "delete"` はアナウンス直後にアーカイブします（リネームによりトランスクリプトは保持されます）。
- 自動アーカイブはベストエフォートです。Gateway が再起動すると、保留中のタイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブしません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは深さ 1 と深さ 2 のセッションに同じように適用されます。
- ブラウザーのクリーンアップはアーカイブのクリーンアップとは別です。追跡中のブラウザータブ/プロセスは、トランスクリプト/セッションレコードが保持される場合でも、実行終了時にベストエフォートで閉じられます。

## ネストされたサブエージェント

デフォルトでは、サブエージェントは自身のサブエージェントを生成できません
（`maxSpawnDepth: 1`）。1 レベルのネストを有効にするには `maxSpawnDepth: 2` を設定します
— **オーケストレーターパターン**: メイン → オーケストレーターサブエージェント →
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

| 深さ | セッションキーの形状                         | ロール                                        | 生成可能か                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | メインエージェント                            | 常に可能                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | サブエージェント（深さ 2 が許可されている場合はオーケストレーター） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（リーフワーカー）        | 不可                         |

### アナウンスチェーン

結果はチェーンを上方向に流れます。

1. 深さ 2 のワーカーが完了 → 親（深さ 1 のオーケストレーター）へアナウンスします。
2. 深さ 1 のオーケストレーターがアナウンスを受け取り、結果を合成し、完了 → メインへアナウンスします。
3. メインエージェントがアナウンスを受け取り、ユーザーへ配信します。

各レベルは、直接の子からのアナウンスのみを参照します。

<Note>
**運用ガイダンス:** `sessions_list`、
`sessions_history`、`/subagents list`、または `exec` の sleep コマンドを使ったポーリングループを構築するのではなく、子の作業を一度開始し、完了
イベントを待ちます。
`sessions_list` と `/subagents list` は、子セッションの関係を
ライブ作業に集中させます。ライブの子はアタッチされたままになり、終了した子は
短い最近のウィンドウの間だけ表示され、古いストア専用の子リンクは
鮮度ウィンドウ後に無視されます。これにより、再起動後に古い `spawnedBy` /
`parentSessionKey` メタデータがゴースト子を復活させるのを防ぎます。
すでに最終回答を送信した後で子の完了イベントが到着した場合、正しいフォローアップは
正確なサイレントトークン `NO_REPLY` / `no_reply` です。
</Note>

### 深さ別のツールポリシー

- ロールと制御範囲は、生成時にセッションメタデータへ書き込まれます。これにより、フラット化または復元されたセッションキーが誤ってオーケストレーター権限を取り戻すことを防ぎます。
- **深さ 1（オーケストレーター、`maxSpawnDepth >= 2` の場合）:** 子を管理できるように、`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。その他のセッション/システムツールは拒否されたままです。
- **深さ 1（リーフ、`maxSpawnDepth == 1` の場合）:** セッションツールはありません（現在のデフォルト動作）。
- **深さ 2（リーフワーカー）:** セッションツールはありません — 深さ 2 では `sessions_spawn` は常に拒否されます。さらに子を生成することはできません。

### エージェント単位の生成上限

各エージェントセッション（任意の深さ）は、同時に最大 `maxChildrenPerAgent`
（デフォルト `5`）個のアクティブな子を持つことができます。これにより、単一のオーケストレーターからの制御不能なファンアウトを防ぎます。

### カスケード停止

深さ 1 のオーケストレーターを停止すると、その深さ 2 の子もすべて自動的に停止します。

- メインチャットでの `/stop` は、すべての深さ 1 エージェントを停止し、その深さ 2 の子へカスケードします。
- `/subagents kill <id>` は、特定のサブエージェントを停止し、その子へカスケードします。
- `/subagents kill all` は、リクエスト元のすべてのサブエージェントを停止し、カスケードします。

## 認証

サブエージェントの認証は、セッションタイプではなく **エージェント id** によって解決されます。

- サブエージェントセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- 認証ストアはそのエージェントの `agentDir` から読み込まれます。
- メインエージェントの認証プロファイルは **フォールバック** としてマージされます。競合時はエージェントプロファイルがメインプロファイルを上書きします。

マージは追加的なので、メインプロファイルは常にフォールバックとして利用できます。
エージェント単位で完全に分離された認証は、まだサポートされていません。

## アナウンス

サブエージェントはアナウンスステップで報告します。

- アナウンスステップはサブエージェントセッション内で実行されます（リクエスト元セッションではありません）。
- サブエージェントが正確に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新のアシスタントテキストが正確なサイレントトークン `NO_REPLY` / `no_reply` の場合、以前に表示可能な進行状況が存在していても、アナウンス出力は抑制されます。

配信はリクエスト元の深さによって異なります。

- トップレベルのリクエスト元セッションは、外部配信（`deliver=true`）付きのフォローアップ `agent` 呼び出しを使います。
- ネストされたリクエスト元サブエージェントセッションは、内部フォローアップ注入（`deliver=false`）を受け取るため、オーケストレーターはセッション内で子の結果を合成できます。
- ネストされたリクエスト元サブエージェントセッションが存在しない場合、OpenClaw は利用可能であればそのセッションのリクエスト元へフォールバックします。

トップレベルのリクエスト元セッションでは、完了モードの直接配信はまず
バインド済みの会話/スレッドルートとフック上書きを解決し、その後
不足しているチャンネルターゲットフィールドをリクエスト元セッションの保存済みルートから埋めます。
これにより、完了の発生元がチャンネルだけを識別している場合でも、完了は正しいチャット/トピックに維持されます。

ネストされた完了結果を構築するとき、子の完了集約は現在のリクエスト元実行にスコープされるため、過去の実行で古くなった子の出力が現在のアナウンスへ漏れるのを防ぎます。アナウンス返信は、チャンネルアダプターで利用可能な場合、スレッド/トピックルーティングを保持します。

### アナウンスコンテキスト

アナウンスコンテキストは、安定した内部イベントブロックに正規化されます。

| フィールド     | ソース                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| ソース         | `subagent` または `cron`                                                                                      |
| セッション id  | 子セッションキー/id                                                                                          |
| タイプ         | アナウンスタイプ + タスクラベル                                                                               |
| ステータス     | ランタイム結果（`success`、`error`、`timeout`、または `unknown`）から派生 — モデルテキストから推測されるものでは**ありません** |
| 結果コンテンツ | 最新の表示可能なアシスタントテキスト。なければ、サニタイズ済みの最新ツール/toolResult テキスト               |
| フォローアップ | 返信すべき場合とサイレントを維持すべき場合を説明する指示                                                     |

終端状態で失敗した実行は、キャプチャされた返信テキストを再生せずに失敗ステータスを報告します。タイムアウト時、子がツール呼び出しまでしか進んでいない場合、アナウンスは生のツール出力を再生する代わりに、その履歴を短い部分的な進捗要約へ折りたたむことができます。

### 統計行

アナウンスペイロードには、末尾に統計行が含まれます（折り返されている場合でも）。

- ランタイム（例: `runtime 5m12s`）。
- トークン使用量（入力/出力/合計）。
- モデル価格が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- メインエージェントが `sessions_history` で履歴を取得したり、ディスク上のファイルを確認したりできるようにする `sessionKey`、`sessionId`、トランスクリプトパス。

内部メタデータはオーケストレーション専用です。ユーザー向けの返信は通常のアシスタントの声に書き直す必要があります。

### `sessions_history` を優先する理由

`sessions_history` は、より安全なオーケストレーションパスです。

- アシスタントのリコールが最初に正規化されます。thinking タグは除去されます。`<relevant-memories>` / `<relevant_memories>` の足場は除去されます。プレーンテキストのツール呼び出し XML ペイロードブロック（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`）は、正常に閉じない切り詰められたペイロードを含めて除去されます。ダウングレードされたツール呼び出し/結果の足場と履歴コンテキストマーカーは除去されます。漏洩したモデル制御トークン（`<|assistant|>`、その他の ASCII `<|...|>`、全角 `<｜...｜>`）は除去されます。不正な MiniMax ツール呼び出し XML は除去されます。
- 認証情報/トークンのようなテキストはリダクションされます。
- 長いブロックは切り詰められる場合があります。
- 非常に大きな履歴では、古い行を削除したり、過大な行を `[sessions_history omitted: message too large]` に置き換えたりできます。
- 完全なバイト単位のトランスクリプトが必要な場合は、ディスク上の生トランスクリプト検査がフォールバックです。

## ツールポリシー

サブエージェントはまず、親または対象エージェントと同じプロファイルおよびツールポリシーパイプラインを使用します。その後、OpenClaw はサブエージェント制限レイヤーを適用します。

制限的な `tools.profile` がない場合、サブエージェントは**セッションツールを除くすべてのツール**とシステムツールを取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` はここでも、範囲が制限されサニタイズされた想起ビューのままです。生のトランスクリプトのダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーターサブエージェントは追加で `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を受け取り、子を管理できるようになります。

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

`tools.subagents.tools.allow` は最終的な allow-only フィルターです。すでに解決されたツールセットを狭めることはできますが、`tools.profile` によって削除されたツールを**追加し直す**ことはできません。たとえば、`tools.profile: "coding"` には `web_search`/`web_fetch` が含まれますが、`browser` ツールは含まれません。coding プロファイルのサブエージェントにブラウザー自動化を使わせるには、プロファイル段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

1 つのエージェントだけにブラウザー自動化を付与する場合は、エージェントごとの `agents.list[].tools.alsoAllow: ["browser"]` を使用します。

## 並行処理

サブエージェントは専用のインプロセスキューレーンを使用します。

- **レーン名:** `subagent`
- **並行数:** `agents.defaults.subagents.maxConcurrent`（デフォルト `8`）

## 生存確認と復旧

OpenClaw は、`endedAt` がないことをサブエージェントがまだ生存している恒久的な証拠とは扱いません。stale-run ウィンドウより古い未終了の実行は、`/subagents list`、ステータス概要、子孫の完了ゲート、セッションごとの並行数チェックで active/pending として数えられなくなります。

Gateway の再起動後、復元された古い未終了実行は、その子セッションが `abortedLastRun: true` とマークされていない限り削除されます。これらの再起動により中断された子セッションは、サブエージェントの孤立復旧フローを通じて復旧可能なままです。このフローは、中断マーカーをクリアする前に合成 resume メッセージを送信します。

自動再起動復旧は子セッションごとに制限されます。同じサブエージェントの子が rapid re-wedge ウィンドウ内で繰り返し孤立復旧に受け入れられた場合、OpenClaw はそのセッションに復旧 tombstone を永続化し、以後の再起動で自動再開しなくなります。タスクレコードを調整するには `openclaw tasks maintenance --apply` を実行し、tombstone 済みセッションの古い中断復旧フラグをクリアするには `openclaw doctor --fix` を実行します。

<Note>
サブエージェントの spawn が Gateway `PAIRING_REQUIRED` / `scope-upgrade` で失敗する場合は、ペアリング状態を編集する前に RPC 呼び出し元を確認してください。内部の `sessions_spawn` 調整は、direct loopback の共有トークン/パスワード認証を介して、`client.id: "gateway-client"` かつ `client.mode: "backend"` として接続する必要があります。このパスは CLI のペアリング済みデバイススコープのベースラインに依存しません。リモート呼び出し元、明示的な `deviceIdentity`、明示的なデバイストークンパス、ブラウザー/node クライアントでは、scope upgrade に通常のデバイス承認が引き続き必要です。
</Note>

## 停止

- requester チャットで `/stop` を送信すると、requester セッションが中断され、そこから spawn されたアクティブなサブエージェント実行がすべて停止され、ネストされた子にもカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子にもカスケードします。

## 制限事項

- サブエージェントの announce は**ベストエフォート**です。gateway が再起動すると、保留中の "announce back" 作業は失われます。
- サブエージェントは引き続き同じ gateway プロセスリソースを共有します。`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントコンテキストは `AGENTS.md` + `TOOLS.md` のみを注入します（`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は注入しません）。
- 最大ネスト深度は 5 です（`maxSpawnDepth` の範囲: 1–5）。ほとんどのユースケースでは深度 2 が推奨されます。
- `maxChildrenPerAgent` はセッションごとのアクティブな子の上限を設定します（デフォルト `5`、範囲 `1–20`）。

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents)
- [エージェント送信](/ja-JP/tools/agent-send)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
