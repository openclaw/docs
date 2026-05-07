---
read_when:
    - エージェントを介してバックグラウンド作業または並列作業を行いたい場合
    - sessions_spawn またはサブエージェントツールポリシーを変更しています
    - スレッドに紐付いたサブエージェントセッションを実装またはトラブルシューティングしている
sidebarTitle: Sub-agents
summary: 結果をリクエスト元のチャットに通知する、分離されたバックグラウンドエージェント実行を起動する
title: サブエージェント
x-i18n:
    generated_at: "2026-05-07T01:54:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 901311ae7766640ff6991f66a63070fddef47d79ef5385d2c1af84be34a5140e
    source_path: tools/subagents.md
    workflow: 16
---

サブエージェントは、既存のエージェント実行から生成されるバックグラウンドのエージェント実行です。
それぞれ独自のセッション（`agent:<agentId>:subagent:<uuid>`）で実行され、
完了すると、その結果をリクエスターのチャットチャネルへ**通知**します。
各サブエージェント実行は
[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

委任の背後にあるセキュリティモデルについては、
[マルチエージェントとサブエージェントの境界](/ja-JP/gateway/security#multi-agent-and-sub-agent-boundaries)を参照してください。
サブエージェントは有用な分離単位およびワークフロー単位ですが、1 つの共有 Gateway 内における敵対的な
マルチテナント認可境界ではありません。

主な目標:

- メイン実行をブロックせずに「調査 / 長いタスク / 遅いツール」作業を並列化する。
- デフォルトでサブエージェントを分離する（セッション分離 + 任意のサンドボックス化）。
- ツール面を誤用しにくく保つ: サブエージェントはデフォルトではセッションツールを取得しません。
- オーケストレーターパターン向けに、設定可能なネスト深度をサポートする。

<Note>
**コストに関する注意:** 各サブエージェントは、デフォルトで独自のコンテキストとトークン使用量を持ちます。
重いタスクや反復的なタスクでは、サブエージェントに安価なモデルを設定し、
メインエージェントはより高品質なモデルのままにしてください。設定は
`agents.defaults.subagents.model` またはエージェントごとの上書きで行います。子が
    リクエスターの現在のトランスクリプトを本当に必要とする場合、エージェントはその 1 回の生成で
    `context: "fork"` をリクエストできます。スレッドに結び付いたサブエージェントセッションは、現在の会話を
    フォローアップスレッドへ分岐するため、デフォルトで `context: "fork"` になります。
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

現在のリクエスターセッションのアクティブな実行を誘導するには、トップレベルの [`/steer <message>`](/ja-JP/tools/steer) を使用します。ターゲットが子実行の場合は、`/subagents steer <id|#> <message>` を使用します。

`/subagents info` は実行メタデータ（ステータス、タイムスタンプ、セッション ID、
トランスクリプトパス、クリーンアップ）を表示します。範囲が制限され、
安全性でフィルターされた呼び出しビューには `sessions_history` を使用し、
未加工の完全なトランスクリプトが必要な場合は、ディスク上のトランスクリプトパスを調べてください。

### スレッド結び付けの制御

これらのコマンドは、永続的なスレッド結び付けをサポートするチャネルで動作します。
下の[スレッド対応チャネル](#thread-supporting-channels)を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成の動作

`/subagents spawn` は、バックグラウンドのサブエージェントを（内部リレーではなく）
ユーザーコマンドとして開始し、実行が完了すると、最後の完了更新を
リクエスターのチャットへ送信します。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - 生成コマンドはノンブロッキングです。実行 ID をただちに返します。
    - 完了時に、サブエージェントは要約/結果メッセージをリクエスターのチャットチャネルへ通知します。
    - 完了はプッシュベースです。生成後は、完了を待つ目的だけで `/subagents list`、`sessions_list`、または `sessions_history` をループでポーリングしないでください。ステータスの確認は、デバッグや介入のために必要な場合にのみ行ってください。
    - 完了時に、OpenClaw は通知クリーンアップフローが続行される前に、そのサブエージェントセッションが開いた追跡対象のブラウザータブ/プロセスをベストエフォートで閉じます。

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw は、安定した冪等性キーを使って、まず直接の `agent` 配信を試みます。
    - リクエスターエージェントの完了ターンが失敗する、表示可能な出力を生成しない、または取得した子の結果の明らかに不完全な接頭辞を返す場合、OpenClaw は取得した子の結果からの直接完了配信にフォールバックします。
    - 直接配信を使用できない場合は、キュールーティングにフォールバックします。
    - キュールーティングもまだ利用できない場合、最終的に断念する前に、短い指数バックオフで通知を再試行します。
    - 完了配信は、解決済みのリクエスタールートを保持します。スレッドに結び付いた、または会話に結び付いた完了ルートが利用可能な場合はそれが優先されます。完了元がチャネルしか提供しない場合でも、OpenClaw はリクエスターセッションの解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足しているターゲット/アカウントを補完するため、直接配信は引き続き機能します。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    リクエスターセッションへの完了ハンドオフは、ランタイム生成の
    内部コンテキスト（ユーザーが作成したテキストではありません）であり、以下を含みます。

    - `Result` — 最新の表示可能な `assistant` 返信テキスト。それがない場合は、サニタイズ済みの最新の tool/toolResult テキスト。終端失敗した実行では、取得済みの返信テキストは再利用されません。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - コンパクトなランタイム/トークン統計。
    - リクエスターエージェントに、未加工の内部メタデータを転送するのではなく、通常のアシスタントの声で書き直すよう伝える配信指示。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` と `--thinking` は、その特定の実行についてデフォルトを上書きします。
    - 完了後に詳細と出力を調べるには、`info`/`log` を使用します。
    - `/subagents spawn` はワンショットモード（`mode: "run"`）です。永続的なスレッド結び付きセッションには、`thread: true` と `mode: "session"` を指定して `sessions_spawn` を使用します。
    - ACP ハーネスセッション（Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx）では、ツールがそのランタイムを通知している場合に `runtime: "acp"` を指定して `sessions_spawn` を使用します。完了やエージェント間ループをデバッグするときは、[ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model)を参照してください。`codex` Plugin が有効な場合、ユーザーが ACP/acpx を明示的に求めない限り、Codex のチャット/スレッド制御では ACP よりも `/codex ...` を優先してください。
    - OpenClaw は、ACP が有効で、リクエスターがサンドボックス化されておらず、`acpx` などのバックエンド Plugin がロードされるまで、`runtime: "acp"` を非表示にします。`runtime: "acp"` は、外部 ACP ハーネス ID、または `runtime.type="acp"` を持つ `agents.list[]` エントリーを想定します。`agents_list` の通常の OpenClaw 設定エージェントには、デフォルトのサブエージェントランタイムを使用してください。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブのサブエージェントは、呼び出し元が現在のトランスクリプトのフォークを明示的に求めない限り、分離された状態で開始します。

| モード       | 使用する場面                                                                                                                         | 動作                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規調査、独立した実装、遅いツール作業、またはタスク文だけで説明できるもの                           | クリーンな子トランスクリプトを作成します。これがデフォルトで、トークン使用量を低く保ちます。  |
| `fork`     | 現在の会話、以前のツール結果、またはリクエスターのトランスクリプトにすでに存在する微妙な指示に依存する作業 | 子が開始される前に、リクエスターのトランスクリプトを子セッションへ分岐します。 |

`fork` は控えめに使用してください。これはコンテキストに敏感な委任のためのものであり、
明確なタスクプロンプトを書くことの代替ではありません。

## ツール: `sessions_spawn`

グローバルな `subagent` レーンで `deliver: false` を指定してサブエージェント実行を開始し、
その後、通知ステップを実行して、通知返信をリクエスターの
チャットチャネルへ投稿します。

利用可否は、呼び出し元の有効なツールポリシーに依存します。`coding` と
`full` プロファイルは、デフォルトで `sessions_spawn` を公開します。`messaging` プロファイルは
公開しません。作業を委任すべきエージェントには、`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` を追加するか、`tools.profile: "coding"` を使用してください。
チャネル/グループ、プロバイダー、サンドボックス、エージェントごとの許可/拒否ポリシーは、
プロファイル段階の後でもツールを削除できます。同じ
セッションから `/tools` を使用して、有効なツールリストを確認してください。

**デフォルト:**

- **モデル:** `agents.defaults.subagents.model`（またはエージェントごとの `agents.list[].subagents.model`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` は引き続き優先されます。
- **Thinking:** `agents.defaults.subagents.thinking`（またはエージェントごとの `agents.list[].subagents.thinking`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` は引き続き優先されます。
- **実行タイムアウト:** `sessions_spawn.runTimeoutSeconds` が省略された場合、OpenClaw は設定されていれば `agents.defaults.subagents.runTimeoutSeconds` を使用します。そうでない場合は `0`（タイムアウトなし）にフォールバックします。

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
  `acp` は、外部 ACP ハーネス（`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx）および `runtime.type` が `acp` である `agents.list[]` エントリー専用です。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP のみ。`runtime: "acp"` の場合に既存の ACP ハーネスセッションを再開します。ネイティブのサブエージェント生成では無視されます。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP のみ。`runtime: "acp"` の場合に ACP 実行出力を親セッションへストリーミングします。ネイティブのサブエージェント生成では省略してください。
</ParamField>
<ParamField path="model" type="string">
  サブエージェントモデルを上書きします。無効な値はスキップされ、ツール結果に警告が表示されたうえで、サブエージェントはデフォルトモデルで実行されます。
</ParamField>
<ParamField path="thinking" type="string">
  サブエージェント実行の thinking レベルを上書きします。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  設定されている場合は `agents.defaults.subagents.runTimeoutSeconds` がデフォルトになり、それ以外の場合は `0` になります。設定された場合、サブエージェント実行は N 秒後に中止されます。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェントセッションに対してチャネルスレッド結び付けを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略された場合、デフォルトは `session` になります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` は通知直後にアーカイブします（名前変更によってトランスクリプトは引き続き保持します）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、ターゲットの子ランタイムがサンドボックス化されていない限り、生成を拒否します。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` は、リクエスターの現在のトランスクリプトを子セッションへ分岐します。ネイティブのサブエージェントのみ。スレッドに結び付いた生成はデフォルトで `fork` になり、スレッドなしの生成はデフォルトで `isolated` になります。
</ParamField>

<Warning>
`sessions_spawn` はチャネル配信用パラメーター（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、
生成された実行から `message`/`sessions_send` を使用してください。
</Warning>

## スレッド結び付きセッション

チャネルでスレッド結び付けが有効な場合、サブエージェントはスレッドに結び付いたままになり、
そのスレッド内のフォローアップユーザーメッセージが同じサブエージェントセッションへルーティングされ続けます。

### スレッド対応チャネル

**Discord** は現在サポートされている唯一のチャネルです。永続的なスレッド結び付きサブエージェントセッション（`thread: true` を指定した `sessions_spawn`）、手動のスレッド制御（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`）、およびアダプターキー
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours`、`channels.discord.threadBindings.spawnSessions` をサポートします。

### クイックフロー

<Steps>
  <Step title="生成">
    `thread: true`（必要に応じて `mode: "session"`）を指定して `sessions_spawn`。
  </Step>
  <Step title="バインド">
    OpenClaw は、アクティブなチャンネルでそのセッションターゲットにスレッドを作成するか、バインドします。
  </Step>
  <Step title="フォローアップのルーティング">
    そのスレッド内の返信とフォローアップメッセージは、バインドされたセッションにルーティングされます。
  </Step>
  <Step title="タイムアウトの確認">
    `/session idle` を使用して非アクティブ時の自動フォーカス解除を確認/更新し、
    `/session max-age` を使用してハード上限を制御します。
  </Step>
  <Step title="デタッチ">
    手動でデタッチするには `/unfocus` を使用します。
  </Step>
</Steps>

### 手動制御

| コマンド            | 効果                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッド（または新規作成したスレッド）をサブエージェント/セッションターゲットにバインドします |
| `/unfocus`         | 現在バインドされているスレッドのバインドを削除します                       |
| `/agents`          | アクティブな実行とバインド状態（`thread:<id>` または `unbound`）を一覧表示します       |
| `/session idle`    | アイドル時の自動フォーカス解除を確認/更新します（フォーカスされたバインド済みスレッドのみ）         |
| `/session max-age` | ハード上限を確認/更新します（フォーカスされたバインド済みスレッドのみ）                  |

### 設定スイッチ

- **グローバルデフォルト:** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **チャンネルオーバーライドと生成時の自動バインドキー** はアダプター固有です。上記の [スレッド対応チャンネル](#thread-supporting-channels) を参照してください。

現在のアダプター詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference) と
[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

### 許可リスト

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  明示的な `agentId`（`["*"]` は任意を許可）でターゲットにできるエージェント ID の一覧。デフォルト: リクエスト元エージェントのみ。一覧を設定し、リクエスト元自身も `agentId` で生成できるようにしたい場合は、リクエスト元 ID を一覧に含めてください。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  リクエスト元エージェントが独自の `subagents.allowAgents` を設定していない場合に使用される、デフォルトのターゲットエージェント許可リスト。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制）。エージェント単位のオーバーライド: `agents.list[].subagents.requireAgentId`。
</ParamField>

リクエスト元セッションがサンドボックス化されている場合、`sessions_spawn` は
サンドボックスなしで実行されるターゲットを拒否します。

### 検出

`sessions_spawn` で現在許可されているエージェント ID を確認するには `agents_list` を使用します。応答には、一覧に含まれる各エージェントの有効な
モデルと埋め込みランタイムメタデータが含まれるため、呼び出し元は PI、Codex
アプリサーバー、その他の設定済みネイティブランタイムを区別できます。

### 自動アーカイブ

- サブエージェントセッションは `agents.defaults.subagents.archiveAfterMinutes`（デフォルト `60`）の後に自動的にアーカイブされます。
- アーカイブは `sessions.delete` を使用し、トランスクリプトを `*.deleted.<timestamp>`（同じフォルダー）にリネームします。
- `cleanup: "delete"` はアナウンス直後にアーカイブします（リネームによりトランスクリプトは保持されます）。
- 自動アーカイブはベストエフォートです。Gateway が再起動すると保留中のタイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブしません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは深さ 1 と深さ 2 のセッションに同じように適用されます。
- ブラウザーのクリーンアップはアーカイブのクリーンアップとは別です。トランスクリプト/セッションレコードが保持される場合でも、追跡中のブラウザータブ/プロセスは実行完了時にベストエフォートで閉じられます。

## ネストされたサブエージェント

デフォルトでは、サブエージェントは自分自身のサブエージェントを生成できません
（`maxSpawnDepth: 1`）。`maxSpawnDepth: 2` を設定すると、1 レベルの
ネスト、つまり **オーケストレーターパターン**（メイン → オーケストレーターサブエージェント →
ワーカーサブサブエージェント）を有効にできます。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // サブエージェントが子を生成できるようにする（デフォルト: 1）
        maxChildrenPerAgent: 5, // エージェントセッションごとの最大アクティブ子数（デフォルト: 5）
        maxConcurrent: 8, // グローバルな同時実行レーン上限（デフォルト: 8）
        runTimeoutSeconds: 900, // 省略時の sessions_spawn のデフォルトタイムアウト（0 = タイムアウトなし）
      },
    },
  },
}
```

### 深さレベル

| 深さ | セッションキーの形状                            | ロール                                          | 生成可能か                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | メインエージェント                                    | 常に可能                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | サブエージェント（深さ 2 が許可されている場合はオーケストレーター） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（リーフワーカー）                   | 不可                        |

### アナウンスチェーン

結果はチェーンを上方向に流れます。

1. 深さ 2 のワーカーが完了 → 親（深さ 1 のオーケストレーター）にアナウンスします。
2. 深さ 1 のオーケストレーターがアナウンスを受け取り、結果を統合して完了 → メインにアナウンスします。
3. メインエージェントがアナウンスを受け取り、ユーザーに届けます。

各レベルは直接の子からのアナウンスのみを見ます。

<Note>
**運用ガイダンス:** `sessions_list`、
`sessions_history`、`/subagents list`、または `exec` の sleep コマンドを中心にポーリングループを構築するのではなく、子の作業を一度開始して完了
イベントを待ってください。
`sessions_list` と `/subagents list` は、子セッションの関係を
ライブ作業に集中させます。ライブの子はアタッチされたままになり、終了した子は
短い最近ウィンドウ内では表示され続け、古いストアのみの子リンクは
鮮度ウィンドウ後に無視されます。これにより、古い `spawnedBy` /
`parentSessionKey` メタデータが再起動後にゴースト子を復活させることを防ぎます。最終回答をすでに送信した後に子の完了イベントが到着した場合、正しいフォローアップは正確なサイレントトークン
`NO_REPLY` / `no_reply` です。
</Note>

### 深さ別のツールポリシー

- ロールと制御スコープは生成時にセッションメタデータへ書き込まれます。これにより、フラット化または復元されたセッションキーが誤ってオーケストレーター権限を取り戻すことを防ぎます。
- **深さ 1（`maxSpawnDepth >= 2` の場合のオーケストレーター）:** 子を管理できるように `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。その他のセッション/システムツールは引き続き拒否されます。
- **深さ 1（`maxSpawnDepth == 1` の場合のリーフ）:** セッションツールなし（現在のデフォルト動作）。
- **深さ 2（リーフワーカー）:** セッションツールなし。深さ 2 では `sessions_spawn` は常に拒否されます。さらに子を生成することはできません。

### エージェント単位の生成上限

各エージェントセッション（任意の深さ）は、同時に最大 `maxChildrenPerAgent`
（デフォルト `5`）個のアクティブな子を持てます。これにより、単一のオーケストレーターからの制御不能なファンアウトを防ぎます。

### カスケード停止

深さ 1 のオーケストレーターを停止すると、そのすべての深さ 2
の子も自動的に停止します。

- メインチャットでの `/stop` は、すべての深さ 1 エージェントを停止し、それらの深さ 2 の子へカスケードします。
- `/subagents kill <id>` は、特定のサブエージェントを停止し、その子へカスケードします。
- `/subagents kill all` は、リクエスト元のすべてのサブエージェントを停止し、カスケードします。

## 認証

サブエージェントの認証は、セッションタイプではなく **エージェント ID** によって解決されます。

- サブエージェントセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- 認証ストアはそのエージェントの `agentDir` からロードされます。
- メインエージェントの認証プロファイルは **フォールバック** としてマージされます。競合時はエージェントプロファイルがメインプロファイルを上書きします。

マージは加算的なため、メインプロファイルは常に
フォールバックとして利用できます。エージェント単位で完全に分離された認証は、まだサポートされていません。

## アナウンス

サブエージェントはアナウンスステップを通じて報告します。

- アナウンスステップはサブエージェントセッション内で実行されます（リクエスト元セッションではありません）。
- サブエージェントが正確に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新のアシスタントテキストが正確なサイレントトークン `NO_REPLY` / `no_reply` の場合、それ以前に可視の進捗が存在していてもアナウンス出力は抑制されます。

配信はリクエスト元の深さによって異なります。

- トップレベルのリクエスト元セッションは、外部配信（`deliver=true`）付きのフォローアップ `agent` 呼び出しを使用します。
- ネストされたリクエスト元サブエージェントセッションは、オーケストレーターがセッション内で子の結果を統合できるように、内部フォローアップ注入（`deliver=false`）を受け取ります。
- ネストされたリクエスト元サブエージェントセッションがなくなっている場合、OpenClaw は可能であればそのセッションのリクエスト元へフォールバックします。

トップレベルのリクエスト元セッションでは、完了モードの直接配信はまず
バインド済みの会話/スレッドルートとフックオーバーライドを解決し、その後
不足しているチャンネルターゲットフィールドをリクエスト元セッションの保存済みルートから埋めます。
これにより、完了元がチャンネルだけを識別している場合でも、完了が正しいチャット/トピックに維持されます。

ネストされた完了結果を構築するとき、子の完了集約は現在のリクエスト元実行にスコープされるため、過去実行の古い子
出力が現在のアナウンスに漏れることを防ぎます。アナウンス返信は、チャンネルアダプターで利用可能な場合、スレッド/トピックのルーティングを保持します。

### アナウンスコンテキスト

アナウンスコンテキストは、安定した内部イベントブロックに正規化されます。

| フィールド          | ソース                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| ソース         | `subagent` または `cron`                                                                                          |
| セッション ID    | 子セッションキー/ID                                                                                          |
| 種類           | アナウンス種別 + タスクラベル                                                                                    |
| ステータス         | ランタイム結果（`success`、`error`、`timeout`、または `unknown`）から派生。モデルテキストからの推測では**ありません** |
| 結果内容 | 最新の可視アシスタントテキスト。なければサニタイズ済みの最新ツール/toolResult テキスト                                |
| フォローアップ      | 返信する場合と沈黙を維持する場合を説明する指示                                                           |

終端で失敗した実行は、キャプチャされた
返信テキストを再生せずに失敗ステータスを報告します。タイムアウト時、子がツール呼び出しまでしか進めなかった場合、アナウンスは
生のツール出力を再生する代わりに、その履歴を短い部分進捗サマリーへ圧縮できます。

### 統計行

アナウンスペイロードの末尾には、（折り返されている場合でも）統計行が含まれます。

- ランタイム（例: `runtime 5m12s`）。
- トークン使用量（入力/出力/合計）。
- モデル価格が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- メインエージェントが `sessions_history` 経由で履歴を取得したり、ディスク上のファイルを確認したりできるようにするための `sessionKey`、`sessionId`、トランスクリプトパス。

内部メタデータはオーケストレーション専用です。ユーザー向けの返信は
通常のアシスタントの口調で書き直す必要があります。

### `sessions_history` を推奨する理由

`sessions_history` はより安全なオーケストレーション経路です。

- アシスタントのリコールは最初に正規化されます。thinking タグは除去されます。`<relevant-memories>` / `<relevant_memories>` の足場は除去されます。プレーンテキストのツール呼び出し XML ペイロードブロック（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`）は、きれいに閉じていない切り詰められたペイロードも含めて除去されます。ダウングレードされたツール呼び出し/結果の足場と履歴コンテキストマーカーは除去されます。漏えいしたモデル制御トークン（`<|assistant|>`、その他の ASCII `<|...|>`、全角 `<｜...｜>`）は除去されます。不正な形式の MiniMax ツール呼び出し XML は除去されます。
- 認証情報/トークンのようなテキストは墨消しされます。
- 長いブロックは切り詰められる場合があります。
- 非常に大きな履歴では、古い行が削除されたり、サイズが大きすぎる行が `[sessions_history omitted: message too large]` に置き換えられたりする場合があります。
- バイト単位で完全なトランスクリプトが必要な場合は、ディスク上の生トランスクリプト検査がフォールバックです。

## ツールポリシー

サブエージェントは、まず親エージェントまたは対象エージェントと同じプロファイルおよびツールポリシーのパイプラインを使用します。その後、OpenClaw はサブエージェント制限レイヤーを適用します。

制限的な `tools.profile` がない場合、サブエージェントは **セッションツール以外のすべてのツール** とシステムツールを取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` はここでも、境界付けられてサニタイズされた想起ビューのままです。生のトランスクリプトダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーターサブエージェントは、子を管理できるように、追加で `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を受け取ります。

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

`tools.subagents.tools.allow` は最終的な allow 専用フィルターです。すでに解決済みのツールセットを狭めることはできますが、`tools.profile` によって削除されたツールを **追加し戻す** ことはできません。たとえば、`tools.profile: "coding"` には `web_search`/`web_fetch` が含まれますが、`browser` ツールは含まれません。coding プロファイルのサブエージェントにブラウザー自動化を使わせるには、プロファイル段階で browser を追加します。

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
- **並行数:** `agents.defaults.subagents.maxConcurrent` (デフォルト `8`)

## 生存性とリカバリー

OpenClaw は、`endedAt` がないことを、サブエージェントがまだ生存している永続的な証拠として扱いません。stale-run ウィンドウより古い未終了の実行は、`/subagents list`、ステータスサマリー、子孫完了ゲート、およびセッションごとの並行実行チェックで、アクティブまたは保留中として数えられなくなります。

Gateway の再起動後、stale な未終了の復元済み実行は、子セッションが `abortedLastRun: true` とマークされていない限り刈り込まれます。これらの再起動で中断された子セッションは、サブエージェント孤立リカバリーフローを通じて引き続き復旧可能です。このフローは、中断マーカーをクリアする前に合成 resume メッセージを送信します。

自動再起動リカバリーは子セッションごとに境界付けられています。同じサブエージェントの子が rapid re-wedge ウィンドウ内で孤立リカバリーとして繰り返し受理された場合、OpenClaw はそのセッションにリカバリー墓標を永続化し、以降の再起動で自動 resume しなくなります。タスクレコードを調整するには `openclaw tasks maintenance --apply` を実行し、墓標付きセッション上の stale な中断リカバリーフラグをクリアするには `openclaw doctor --fix` を実行します。

<Note>
サブエージェントの spawn が Gateway `PAIRING_REQUIRED` / `scope-upgrade` で失敗する場合、ペアリング状態を編集する前に RPC 呼び出し元を確認してください。内部の `sessions_spawn` 調整は、直接 loopback の共有トークン/パスワード認証を介して、`client.id: "gateway-client"` と `client.mode: "backend"` で接続する必要があります。そのパスは CLI のペア済みデバイススコープのベースラインには依存しません。リモート呼び出し元、明示的な `deviceIdentity`、明示的なデバイストークンパス、およびブラウザー/node クライアントは、スコープアップグレードに通常のデバイス承認が引き続き必要です。
</Note>

## 停止

- リクエスターのチャットで `/stop` を送信すると、リクエスターセッションが中断され、そこから spawn されたアクティブなサブエージェント実行が停止し、ネストした子にもカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子にもカスケードします。

## 制限事項

- サブエージェントのアナウンスは **ベストエフォート** です。gateway が再起動すると、保留中の「announce back」作業は失われます。
- サブエージェントは同じ gateway プロセスリソースを引き続き共有します。`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントコンテキストは `AGENTS.md` + `TOOLS.md` のみを注入します (`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は含まれません)。
- 最大ネスト深度は 5 です (`maxSpawnDepth` の範囲: 1–5)。ほとんどのユースケースでは深度 2 を推奨します。
- `maxChildrenPerAgent` はセッションごとのアクティブな子の数を制限します (デフォルト `5`、範囲 `1–20`)。

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents)
- [エージェント送信](/ja-JP/tools/agent-send)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
