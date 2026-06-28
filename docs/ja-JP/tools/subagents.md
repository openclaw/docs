---
read_when:
    - エージェント経由でバックグラウンド作業または並列作業を行いたい場合
    - sessions_spawn またはサブエージェントツールポリシーを変更しています
    - スレッドに紐付いたサブエージェントセッションを実装またはトラブルシューティングしている
sidebarTitle: Sub-agents
summary: リクエスト元のチャットに結果を通知する、分離されたバックグラウンドエージェント実行を生成する
title: サブエージェント
x-i18n:
    generated_at: "2026-06-28T00:13:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agents は、既存のエージェント実行から生成されるバックグラウンドのエージェント実行です。
それぞれ独自のセッション (`agent:<agentId>:subagent:<uuid>`) で実行され、
完了すると、その結果を依頼元のチャットチャネルに**通知**します。
各 sub-agent 実行は
[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

主な目標:

- メイン実行をブロックせずに「調査 / 長いタスク / 遅いツール」の作業を並列化する。
- デフォルトで sub-agents を分離する (セッション分離 + 任意のサンドボックス化)。
- ツールサーフェスを誤用しにくくする: sub-agents はデフォルトではセッションツールを取得しません。
- オーケストレーターのパターン向けに、設定可能なネスト深度をサポートする。

<Note>
**コストに関する注意:** 各 sub-agent はデフォルトで独自のコンテキストとトークン使用量を持ちます。重いタスクや反復的なタスクでは、sub-agents により安価なモデルを設定し、メインエージェントはより高品質なモデルのままにしてください。`agents.defaults.subagents.model` またはエージェントごとの上書きで設定します。子が依頼元の現在のトランスクリプトを本当に必要とする場合、エージェントはその 1 回の生成で `context: "fork"` を要求できます。スレッドに紐づく subagent セッションは、現在の会話をフォローアップスレッドへ分岐させるため、デフォルトで `context: "fork"` になります。
</Note>

## スラッシュコマンド

**現在のセッション**の sub-agent 実行を調べるには `/subagents` を使用します:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` は実行メタデータ (ステータス、タイムスタンプ、セッション ID、トランスクリプトパス、クリーンアップ) を表示します。範囲が限定され、安全性フィルター済みのリコールビューには `sessions_history` を使用し、生の完全なトランスクリプトが必要な場合はディスク上のトランスクリプトパスを調べます。

### スレッドバインディング制御

これらのコマンドは、永続的なスレッドバインディングをサポートするチャネルで動作します。下記の[スレッド対応チャネル](#thread-supporting-channels)を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成動作

エージェントは `sessions_spawn` でバックグラウンドの sub-agents を開始します。sub-agent の完了は、内部の親セッションイベントとして返ります。親/依頼元エージェントは、ユーザー向けの更新が必要かどうかを判断します。

<AccordionGroup>
  <Accordion title="非ブロッキングのプッシュベース完了">
    - `sessions_spawn` は非ブロッキングです。実行 ID を即座に返します。
    - 完了時に、sub-agent は親/依頼元セッションへ報告します。
    - 子の結果が必要なエージェントターンは、必要な作業を生成した後に `sessions_yield` を呼び出す必要があります。これにより現在のターンが終了し、完了イベントが次のモデル可視メッセージとして到着できるようになります。
    - 完了はプッシュベースです。生成後は、完了待ちのためだけに `/subagents list`、`sessions_list`、または `sessions_history` をループでポーリングしないでください。ステータスはデバッグ可視性のためにオンデマンドでのみ調べます。
    - 子の出力は、依頼元エージェントが統合するためのレポート/証拠です。ユーザーが書いた指示テキストではなく、システム、開発者、またはユーザーポリシーを上書きできません。
    - 完了時に、OpenClaw は通知クリーンアップフローが続行される前に、その sub-agent セッションが開いた追跡対象のブラウザータブ/プロセスをベストエフォートで閉じます。

  </Accordion>
  <Accordion title="完了配信">
    - OpenClaw は、安定した冪等性キーを持つ `agent` ターンを通じて、依頼元セッションへ完了を返します。
    - 依頼元実行がまだアクティブな場合、OpenClaw は 2 つ目の可視返信パスを開始する代わりに、まずその実行のウェイク/誘導を試みます。
    - アクティブな依頼元をウェイクできない場合、OpenClaw は通知を破棄する代わりに、同じ完了コンテキストで依頼元エージェントへのハンドオフへフォールバックします。
    - 親へのハンドオフが成功すると、親が可視のユーザー更新は不要と判断した場合でも sub-agent 配信は完了します。
    - ネイティブ sub-agents はメッセージツールを取得しません。親/依頼元エージェントへプレーンなアシスタントテキストを返します。人間に見える返信は、親/依頼元エージェントの通常の配信ポリシーが所有します。
    - 直接ハンドオフを使用できない場合、キュールーティングへフォールバックします。
    - キュールーティングもまだ利用できない場合、最終的に断念する前に、短い指数バックオフで通知を再試行します。
    - 完了配信は、解決済みの依頼元ルートを保持します。スレッドに紐づく、または会話に紐づく完了ルートが利用可能な場合はそれが優先されます。完了元がチャネルのみを提供する場合、OpenClaw は依頼元セッションの解決済みルート (`lastChannel` / `lastTo` / `lastAccountId`) から不足しているターゲット/アカウントを補完するため、直接配信が引き続き機能します。

  </Accordion>
  <Accordion title="完了ハンドオフメタデータ">
    依頼元セッションへの完了ハンドオフは、ランタイムで生成される内部コンテキスト (ユーザーが書いたテキストではありません) で、次を含みます:

    - `Result` — 子からの最新の可視 `assistant` 返信テキスト。Tool/toolResult の出力は子の結果へ昇格されません。終端失敗した実行は、キャプチャされた返信テキストを再利用しません。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - コンパクトなランタイム/トークン統計。
    - 元のタスクが完了したかどうかを判断する前に、依頼元エージェントへ結果を検証するよう伝えるレビュー指示。
    - 子の結果に追加の作業が残る場合、依頼元エージェントにタスクを続行するかフォローアップを記録するよう伝えるフォローアップガイダンス。
    - 追加アクションがないパス向けの最終更新指示。生の内部メタデータを転送せず、通常のアシスタントの声で書かれます。

  </Accordion>
  <Accordion title="モードと ACP ランタイム">
    - `--model` と `--thinking` は、その特定の実行のデフォルトを上書きします。
    - 完了後に詳細と出力を調べるには `info`/`log` を使用します。
    - 永続的なスレッドに紐づくセッションでは、`thread: true` と `mode: "session"` を指定して `sessions_spawn` を使用します。
    - 依頼元チャネルがスレッドバインディングをサポートしない場合、不可能なスレッドバインディングの組み合わせを再試行する代わりに `mode: "run"` を使用します。
    - ACP ハーネスセッション (Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx) では、ツールがそのランタイムを公開している場合、`runtime: "acp"` を指定して `sessions_spawn` を使用します。完了やエージェント間ループをデバッグする場合は、[ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model)を参照してください。`codex` Plugin が有効な場合、ユーザーが明示的に ACP/acpx を求めない限り、Codex のチャット/スレッド制御は ACP より `/codex ...` を優先する必要があります。
    - OpenClaw は、ACP が有効で、依頼元がサンドボックス化されておらず、`acpx` などのバックエンド Plugin が読み込まれるまで `runtime: "acp"` を隠します。`runtime: "acp"` は外部 ACP ハーネス ID、または `runtime.type="acp"` を持つ `agents.list[]` エントリを期待します。`agents_list` からの通常の OpenClaw 設定エージェントには、デフォルトの sub-agent ランタイムを使用してください。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブ sub-agents は、呼び出し元が現在のトランスクリプトの fork を明示的に要求しない限り、分離された状態で開始します。

| モード       | 使用する場面                                                                                                                         | 動作                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規調査、独立した実装、遅いツール作業、またはタスクテキストで簡潔に説明できるもの                           | クリーンな子トランスクリプトを作成します。これがデフォルトで、トークン使用量を低く保ちます。  |
| `fork`     | 現在の会話、以前のツール結果、または依頼元トランスクリプトにすでに存在する細かな指示に依存する作業 | 子が開始する前に、依頼元トランスクリプトを子セッションへ分岐します。 |

`fork` は控えめに使用してください。これはコンテキストに依存する委任のためのものであり、明確なタスクプロンプトを書くことの代替ではありません。

## ツール: `sessions_spawn`

グローバル `subagent` レーンで `deliver: false` の sub-agent 実行を開始し、その後通知ステップを実行して、通知返信を依頼元チャットチャネルへ投稿します。

利用可否は、呼び出し元の有効なツールポリシーに依存します。`coding` と `full` プロファイルは、デフォルトで `sessions_spawn` を公開します。`messaging` プロファイルは公開しません。作業を委任する必要があるエージェントには、`tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]` を追加するか、`tools.profile: "coding"` を使用します。チャネル/グループ、プロバイダー、サンドボックス、エージェントごとの許可/拒否ポリシーは、プロファイル段階の後でもツールを削除できます。同じセッションから `/tools` を使用して、有効なツール一覧を確認します。

**デフォルト:**

- **モデル:** `agents.defaults.subagents.model` (またはエージェントごとの `agents.list[].subagents.model`) を設定しない限り、ネイティブ sub-agents は呼び出し元を継承します。ACP ランタイムの生成は、設定済みの subagent モデルが存在する場合は同じモデルを使用します。それ以外の場合、ACP ハーネスは独自のデフォルトを保持します。明示的な `sessions_spawn.model` は引き続き優先されます。
- **Thinking:** `agents.defaults.subagents.thinking` (またはエージェントごとの `agents.list[].subagents.thinking`) を設定しない限り、ネイティブ sub-agents は呼び出し元を継承します。ACP ランタイムの生成では、選択されたモデルに対して `agents.defaults.models["provider/model"].params.thinking` も適用されます。明示的な `sessions_spawn.thinking` は引き続き優先されます。
- **実行タイムアウト:** `agents.defaults.subagents.runTimeoutSeconds` が設定されている場合、OpenClaw はそれを使用します。それ以外の場合は `0` (タイムアウトなし) にフォールバックします。`sessions_spawn` は呼び出しごとのタイムアウト上書きを受け付けません。
- **タスク配信:** ネイティブ sub-agents は、最初の可視 `[Subagent Task]` メッセージで委任されたタスクを受け取ります。sub-agent のシステムプロンプトは、タスクの隠れた重複ではなく、ランタイムルールとルーティングコンテキストを保持します。

受け入れられたネイティブ sub-agent 生成は、ツール結果に解決済みの子モデルメタデータを含みます。`resolvedModel` には適用されたモデル参照が含まれ、`resolvedProvider` には参照にプロバイダープレフィックスがある場合にそのプレフィックスが含まれます。

### 委任プロンプトモード

`agents.defaults.subagents.delegationMode` はプロンプトガイダンスのみを制御します。ツールポリシーを変更したり、委任を強制したりしません。

- `suggest` (デフォルト): より大きい、または遅い作業に sub-agents を使用する標準のプロンプト誘導を維持します。
- `prefer`: メインエージェントに、応答性を保ち、直接返信より複雑なものはすべて `sessions_spawn` を通じて委任するよう伝えます。

エージェントごとの上書きには `agents.list[].subagents.delegationMode` を使用します。

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

### ツールパラメータ

<ParamField path="task" type="string" required>
  サブエージェントのタスク説明。
</ParamField>
<ParamField path="taskName" type="string">
  後続のステータス出力で特定の子を識別するための、省略可能な安定ハンドル。`[a-z][a-z0-9_-]{0,63}` に一致する必要があり、`last` や `all` などの予約済みターゲットは使用できない。
</ParamField>
<ParamField path="label" type="string">
  省略可能な人間が読めるラベル。
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` で許可されている場合、別の設定済みエージェント ID の下でスポーンする。
</ParamField>
<ParamField path="cwd" type="string">
  子実行用の省略可能なタスク作業ディレクトリ。ネイティブサブエージェントは引き続きターゲットエージェントのワークスペースからブートストラップファイルを読み込む。`cwd` はランタイムツールと CLI ハーネスが委任された作業を行う場所だけを変更する。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` は外部 ACP ハーネス（`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx）と、`runtime.type` が `acp` の `agents.list[]` エントリ専用。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP 専用。`runtime: "acp"` の場合に既存の ACP ハーネスセッションを再開する。ネイティブサブエージェントのスポーンでは無視される。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP 専用。`runtime: "acp"` の場合に ACP 実行出力を親セッションへストリームする。ネイティブサブエージェントのスポーンでは省略する。
</ParamField>
<ParamField path="model" type="string">
  サブエージェントのモデルを上書きする。無効な値はスキップされ、サブエージェントはデフォルトモデルで実行され、ツール結果に警告が表示される。
</ParamField>
<ParamField path="thinking" type="string">
  サブエージェント実行の思考レベルを上書きする。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェントセッションに対してチャネルスレッドバインドを要求する。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略された場合、デフォルトは `session` になる。`mode: "session"` には `thread: true` が必要。
  要求元チャネルでスレッドバインドを利用できない場合は、代わりに `mode: "run"` を使用する。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` は通知直後にアーカイブする（リネームによりトランスクリプトは引き続き保持される）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、ターゲット子ランタイムがサンドボックス化されていない限りスポーンを拒否する。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` は要求元の現在のトランスクリプトを子セッションへ分岐する。ネイティブサブエージェント専用。スレッドバインドされたスポーンのデフォルトは `fork`、非スレッドスポーンのデフォルトは `isolated`。
</ParamField>

<Warning>
`sessions_spawn` はチャネル配信パラメータ（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けない。ネイティブサブエージェントは
最新のアシスタントターンを要求元に報告する。外部配信は
親/要求元エージェントに残る。
</Warning>

### タスク名とターゲティング

`taskName` はオーケストレーション用のモデル向けハンドルであり、セッションキーではない。
コーディネーターが後でその子を調査する必要がある場合に、`review_subagents`、
`linux_validation`、`docs_update` などの安定した子名として使用する。

ターゲット解決は、正確な `taskName` 一致と曖昧でない
プレフィックスを受け付ける。照合は番号付き `/subagents` ターゲットで使用されるものと同じ
アクティブ/最近のターゲットウィンドウにスコープされるため、古い完了済みの子が
再利用されたハンドルを曖昧にすることはない。2 つのアクティブまたは最近の子が同じ
`taskName` を共有している場合、ターゲットは曖昧になる。代わりにリストインデックス、セッションキー、または
実行 ID を使用する。

予約済みターゲット `last` と `all` は、すでに制御上の意味を持つため、
有効な `taskName` 値ではない。

## ツール: `sessions_yield`

現在のモデルターンを終了し、ランタイムイベント、主に
サブエージェント完了イベントが次のメッセージとして到着するのを待つ。要求元がこれらの完了を受け取るまで
最終回答を生成できない場合、必要な子作業をスポーンした後に使用する。

`sessions_yield` は待機プリミティブ。子の完了を検出するためだけに、`subagents`、
`sessions_list`、`sessions_history`、シェルの
`sleep`、またはプロセスポーリングのポーリングループで置き換えない。

セッションの有効なツールリストに含まれている場合にのみ `sessions_yield` を使用する。
一部の最小またはカスタムツールプロファイルでは、`sessions_yield` を公開せずに `sessions_spawn` と
`subagents` を公開することがある。その場合、完了を待つためだけに
ポーリングループを作らない。

アクティブな子が存在する場合、OpenClaw はコンパクトなランタイム生成の
`Active Subagents` プロンプトブロックを通常のターンに挿入し、要求元がポーリングなしで
現在の子セッション、実行 ID、ステータス、ラベル、タスク、
`taskName` エイリアスを確認できるようにする。その
ブロック内のタスクフィールドとラベルフィールドは命令ではなくデータとして引用される。ユーザー/モデル提供のスポーン引数に由来する可能性があるため。

## ツール: `subagents`

要求元セッションが所有するスポーン済みサブエージェント実行を一覧表示する。これは
現在の要求元にスコープされる。子は自分が制御する子だけを確認できる。

オンデマンドのステータス確認とデバッグには `subagents` を使用する。完了イベントを
待つには `sessions_yield` を使用する。

## スレッドバインドセッション

チャネルでスレッドバインドが有効になっている場合、サブエージェントはスレッドにバインドされたままになり、
そのスレッド内の後続ユーザーメッセージを同じサブエージェントセッションへルーティングし続けられる。

### スレッド対応チャネル

セッションバインドアダプターを持つ任意のチャネルは、永続的な
スレッドバインドサブエージェントセッション（`thread: true` を指定した `sessions_spawn`）をサポートできる。
バンドル済みアダプターには現在、Discord スレッド、Matrix スレッド、
Telegram フォーラムトピック、Feishu の現在の会話バインドが含まれる。
有効化、タイムアウト、`spawnSessions` には、チャネルごとの `threadBindings` 設定キーを使用する。

### クイックフロー

<Steps>
  <Step title="Spawn">
    `thread: true`（および必要に応じて `mode: "session"`）で `sessions_spawn`。
  </Step>
  <Step title="Bind">
    OpenClaw はアクティブチャネルでそのセッションターゲットにスレッドを作成またはバインドする。
  </Step>
  <Step title="Route follow-ups">
    そのスレッド内の返信と後続メッセージは、バインドされたセッションへルーティングされる。
  </Step>
  <Step title="Inspect timeouts">
    `/session idle` を使用して非アクティブ時の自動アンフォーカスを確認/更新し、
    `/session max-age` を使用してハード上限を制御する。
  </Step>
  <Step title="Detach">
    手動で切り離すには `/unfocus` を使用する。
  </Step>
</Steps>

### 手動制御

| コマンド            | 効果                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッド（または新規作成したもの）をサブエージェント/セッションターゲットにバインドする |
| `/unfocus`         | 現在バインドされているスレッドのバインドを削除する                       |
| `/agents`          | アクティブな実行とバインド状態（`thread:<id>` または `unbound`）を一覧表示する       |
| `/session idle`    | アイドル時の自動アンフォーカスを確認/更新する（フォーカス中のバインド済みスレッドのみ）         |
| `/session max-age` | ハード上限を確認/更新する（フォーカス中のバインド済みスレッドのみ）                  |

### 設定スイッチ

- **グローバルデフォルト:** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **チャネル上書きとスポーン自動バインドキー** はアダプター固有。上記の [スレッド対応チャネル](#thread-supporting-channels) を参照。

現在のアダプター詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference) と
[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照。

### 許可リスト

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  明示的な `agentId` でターゲットにできる設定済みエージェント ID のリスト（`["*"]` は任意の設定済みターゲットを許可する）。デフォルト: 要求元エージェントのみ。リストを設定し、引き続き要求元が `agentId` で自分自身をスポーンできるようにしたい場合は、要求元 ID をリストに含める。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  要求元エージェントが独自の `subagents.allowAgents` を設定していない場合に使用される、デフォルトの設定済みターゲットエージェント許可リスト。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックする（明示的なプロファイル選択を強制する）。エージェントごとの上書き: `agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway `agent` 通知配信試行ごとのタイムアウト。値は正の整数ミリ秒で、プラットフォーム安全なタイマー最大値に丸められる。一時的な再試行により、通知の合計待機時間が設定済みの 1 回のタイムアウトより長くなることがある。
</ParamField>

要求元セッションがサンドボックス化されている場合、`sessions_spawn` は
サンドボックス化されずに実行されるターゲットを拒否する。

### 検出

現在 `sessions_spawn` に許可されているエージェント ID を確認するには `agents_list` を使用する。
応答には、一覧表示された各エージェントの有効な
モデルと埋め込みランタイムメタデータが含まれるため、呼び出し元は OpenClaw、Codex
app-server、およびその他の設定済みネイティブランタイムを区別できる。

`allowAgents` エントリは `agents.list[]` 内の設定済みエージェント ID を指す必要がある。
`["*"]` は、任意の設定済みターゲットエージェントと要求元を意味する。エージェント設定が
削除されてもその ID が `allowAgents` に残っている場合、`sessions_spawn` はその ID を拒否し、
`agents_list` はそれを省略する。古い
許可リストエントリをクリーンアップするには `openclaw doctor --fix` を実行するか、デフォルトを継承しながらターゲットを
スポーン可能なままにする必要がある場合は、最小限の `agents.list[]` エントリを追加する。

### 自動アーカイブ

- サブエージェントセッションは、`agents.defaults.subagents.archiveAfterMinutes`（デフォルト `60`）後に自動的にアーカイブされる。
- アーカイブは `sessions.delete` を使用し、トランスクリプトを `*.deleted.<timestamp>`（同じフォルダー）へリネームする。
- `cleanup: "delete"` は通知直後にアーカイブする（リネームによりトランスクリプトは引き続き保持される）。
- 自動アーカイブはベストエフォート。Gateway が再起動すると保留中のタイマーは失われる。
- 設定済み実行タイムアウトは自動アーカイブしない。実行を停止するだけ。セッションは自動アーカイブまで残る。
- 自動アーカイブは深さ 1 と深さ 2 のセッションに等しく適用される。
- ブラウザーのクリーンアップはアーカイブクリーンアップとは別。追跡対象のブラウザータブ/プロセスは、トランスクリプト/セッションレコードが保持される場合でも、実行完了時にベストエフォートで閉じられる。

## ネストされたサブエージェント

デフォルトでは、サブエージェントは自分自身のサブエージェントをスポーンできない
（`maxSpawnDepth: 1`）。1 レベルの
ネストを有効にするには `maxSpawnDepth: 2` を設定する — **オーケストレーターパターン**: main → オーケストレーターサブエージェント →
ワーカーサブサブエージェント。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### 深さレベル

| 深さ | セッションキーの形                            | ロール                                          | スポーン可能か                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | メインエージェント                                    | 常に可能                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | サブエージェント（深さ 2 が許可されている場合はオーケストレーター） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（リーフワーカー）                   | 不可                        |

### 通知チェーン

結果はチェーンを上流へ戻る:

1. 深さ 2 の worker が完了する → 親（深さ 1 の orchestrator）に通知する。
2. 深さ 1 の orchestrator が通知を受け取り、結果を統合して完了する → main に通知する。
3. Main agent が通知を受け取り、ユーザーに届ける。

各レベルは、直接の子からの通知だけを見る。

<Note>
**運用ガイダンス:** `sessions_list`、
`sessions_history`、`/subagents list`、または `exec` の sleep コマンドを中心に
ポーリングループを組むのではなく、子の作業を一度開始し、完了
イベントを待つ。`sessions_list` と `/subagents list` は子セッション関係を
ライブ作業に集中させる。ライブ中の子は接続されたままになり、終了した子は
短い最近のウィンドウ内で可視のままになり、古い store-only の子リンクは
鮮度ウィンドウ後に無視される。これにより、再起動後に古い `spawnedBy` /
`parentSessionKey` メタデータがゴーストの子を復活させることを防ぐ。
すでに最終回答を送信した後に子の完了イベントが届いた場合、正しいフォローアップは
正確なサイレントトークン `NO_REPLY` / `no_reply` である。
</Note>

### 深さ別のツールポリシー

- ロールと制御スコープは spawn 時にセッションメタデータへ書き込まれる。これにより、フラットまたは復元されたセッションキーが誤って orchestrator 権限を取り戻すことを防ぐ。
- **深さ 1（orchestrator、`maxSpawnDepth >= 2` の場合）:** 子を spawn して状態を確認できるように、`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得する。他の session/system ツールは拒否されたまま。
- **深さ 1（leaf、`maxSpawnDepth == 1` の場合）:** session ツールなし（現在のデフォルト動作）。
- **深さ 2（leaf worker）:** session ツールなし。`sessions_spawn` は深さ 2 では常に拒否される。さらに子を spawn することはできない。

### エージェントごとの spawn 制限

各エージェントセッション（どの深さでも）は、一度に最大 `maxChildrenPerAgent`
（デフォルト `5`）個のアクティブな子を持てる。これにより、単一の orchestrator
からの暴走的な fan-out を防ぐ。

### カスケード停止

深さ 1 の orchestrator を停止すると、その深さ 2 の子もすべて自動的に停止する。

- main チャットでの `/stop` はすべての深さ 1 エージェントを停止し、その深さ 2 の子へカスケードする。

## 認証

サブエージェントの認証は、セッション種別ではなく **agent id** によって解決される。

- サブエージェントのセッションキーは `agent:<agentId>:subagent:<uuid>`。
- auth store はそのエージェントの `agentDir` から読み込まれる。
- main agent の auth profiles は **フォールバック** としてマージされる。競合時は agent profiles が main profiles を上書きする。

マージは加算的なので、main profiles は常にフォールバックとして利用できる。
エージェントごとに完全に分離された auth はまだサポートされていない。

## 通知

サブエージェントは announce ステップで報告する。

- announce ステップは、requester セッションではなくサブエージェントセッション内で実行される。
- サブエージェントが正確に `ANNOUNCE_SKIP` と返信した場合、何も投稿されない。
- 最新の assistant テキストが正確なサイレントトークン `NO_REPLY` / `no_reply` の場合、それ以前に可視の進捗が存在していても announce 出力は抑制される。

配送は requester の深さに依存する。

- トップレベルの requester セッションは、外部配送（`deliver=true`）付きのフォローアップ `agent` 呼び出しを使用する。
- ネストされた requester subagent セッションは、orchestrator が子の結果をセッション内で統合できるように、内部フォローアップ注入（`deliver=false`）を受け取る。
- ネストされた requester subagent セッションがなくなっている場合、OpenClaw は利用可能ならそのセッションの requester にフォールバックする。

トップレベルの requester セッションでは、completion-mode の直接配送はまず
バインド済みの会話/thread route と hook override を解決し、その後
requester セッションに保存された route から不足している channel-target フィールドを埋める。
これにより、completion の起点が channel だけを識別している場合でも、
completion は正しい chat/topic に留まる。

ネストされた completion findings を構築するとき、子の完了集約は現在の requester run に
スコープされ、古い prior-run の子出力が現在の announce に漏れることを防ぐ。
Announce replies は channel adapters で利用可能な場合、thread/topic routing を保持する。

### Announce context

Announce context は安定した内部イベントブロックに正規化される。

| フィールド   | ソース                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| ソース       | `subagent` または `cron`                                                                                      |
| Session ids  | 子のセッションキー/id                                                                                        |
| 種別         | Announce type + task label                                                                                    |
| ステータス   | runtime outcome（`success`、`error`、`timeout`、または `unknown`）から派生 — model text から推測**しない** |
| 結果内容     | 子からの最新の可視 assistant text                                                                            |
| フォローアップ | 返信する場合と沈黙を保つ場合を説明する指示                                                                  |

Terminal failed runs は、キャプチャされた reply text を再生せずに
失敗ステータスを報告する。Tool/toolResult output は child result text に昇格されない。

### Stats line

Announce payloads には末尾に stats line が含まれる（折り返されている場合でも）。

- Runtime（例: `runtime 5m12s`）。
- Token usage（input/output/total）。
- model pricing が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- main agent が `sessions_history` で履歴を取得したり、ディスク上のファイルを確認したりできるように、`sessionKey`、`sessionId`、transcript path。

内部メタデータは orchestration のためだけのものだ。ユーザー向け返信は
通常の assistant の声に書き直すべきである。

### `sessions_history` を推奨する理由

`sessions_history` はより安全な orchestration パスである。

- Assistant recall は最初に正規化される。thinking tags は削除され、`<relevant-memories>` / `<relevant_memories>` scaffolding は削除され、plain-text tool-call XML payload blocks（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`）は、正常に閉じない truncated payloads を含めて削除され、downgraded tool-call/result scaffolding と historical-context markers は削除され、漏れた model control tokens（`<|assistant|>`、他の ASCII `<|...|>`、全角 `<｜...｜>`）は削除され、malformed MiniMax tool-call XML は削除される。
- Credential/token-like text は redacted される。
- 長いブロックは truncate される場合がある。
- 非常に大きい histories では、古い rows が drop されたり、 oversized row が `[sessions_history omitted: message too large]` に置き換えられたりする場合がある。
- older transcript windows を後方にページングするには、存在する場合 `nextOffset` を使用する。
- 完全な byte-for-byte transcript が必要な場合は、生の on-disk transcript inspection がフォールバックになる。

## ツールポリシー

サブエージェントはまず、親または target agent と同じ profile と tool-policy pipeline を使用する。
その後、OpenClaw が sub-agent restriction layer を適用する。

制限的な `tools.profile` がない場合、サブエージェントは
**message tool、session tools、system tools を除くすべてのツール**を取得する。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

ここでも `sessions_history` は bounded, sanitized recall view のままであり、
raw transcript dump ではない。

`maxSpawnDepth >= 2` の場合、深さ 1 の orchestrator sub-agents はさらに
子を管理できるように `sessions_spawn`、`subagents`、`sessions_list`、
`sessions_history` を受け取る。

### config による override

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

`tools.subagents.tools.allow` は最終的な allow-only filter である。これは
すでに解決済みの tool set を狭めることはできるが、`tools.profile` によって
削除されたツールを **追加し直す** ことはできない。たとえば、`tools.profile: "coding"` は
`web_search`/`web_fetch` を含むが、`browser` tool は含まない。
coding-profile のサブエージェントに browser automation を使わせるには、
profile stage で browser を追加する。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

1 つのエージェントだけが browser automation を取得すべき場合は、
per-agent の `agents.list[].tools.alsoAllow: ["browser"]` を使用する。

## 並行性

サブエージェントは専用の in-process queue lane を使用する。

- **Lane name:** `subagent`
- **Concurrency:** `agents.defaults.subagents.maxConcurrent`（デフォルト `8`）

## Liveness と recovery

OpenClaw は `endedAt` が存在しないことを、サブエージェントがまだ生存している
永続的な証拠として扱わない。stale-run window より古い unended runs は、
`/subagents list`、status summaries、descendant completion gating、
per-session concurrency checks で active/pending として数えられなくなる。

Gateway 再起動後、stale unended restored runs は、その子セッションが
`abortedLastRun: true` とマークされていない限り prune される。これらの
restart-aborted child sessions は sub-agent orphan recovery flow を通じて
回復可能なままであり、この flow は aborted marker をクリアする前に
synthetic resume message を送信する。

自動 restart recovery は子セッションごとに bounded される。同じ
サブエージェントの子が rapid re-wedge window 内で繰り返し orphan recovery に
受け入れられた場合、OpenClaw はそのセッションに recovery tombstone を永続化し、
後続の再起動で auto-resume しなくなる。task record を reconcile するには
`openclaw tasks maintenance --apply` を実行し、tombstoned sessions 上の
古い aborted recovery flags をクリアするには `openclaw doctor --fix` を実行する。

<Note>
サブエージェント spawn が Gateway `PAIRING_REQUIRED` /
`scope-upgrade` で失敗する場合、pairing state を編集する前に RPC caller を確認する。
内部の `sessions_spawn` coordination は、caller がすでに gateway request context 内で
実行されている場合、process 内で dispatch されるため、loopback WebSocket を開かず、
CLI の paired-device scope baseline に依存しない。gateway process 外の callers は、
direct loopback shared-token/password auth 上で `client.id: "gateway-client"`、
`client.mode: "backend"` として WebSocket fallback を引き続き使用する。
Remote callers、明示的な `deviceIdentity`、明示的な device-token paths、
browser/node clients は、scope upgrades に通常の device approval が引き続き必要である。
</Note>

## 停止

- requester chat で `/stop` を送信すると requester session が abort され、そこから spawn された active sub-agent runs が停止され、ネストされた子へカスケードする。

## 制限事項

- サブエージェントの announce は **best-effort** である。Gateway が再起動すると、保留中の「announce back」作業は失われる。
- サブエージェントは同じ Gateway process resources を引き続き共有する。`maxConcurrent` は safety valve として扱う。
- `sessions_spawn` は常に non-blocking である。これは `{ status: "accepted", runId, childSessionKey }` を即座に返す。
- サブエージェント context は `AGENTS.md` と `TOOLS.md` だけを注入する（`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は注入しない）。Codex-native subagents も同じ境界に従う。`TOOLS.md` は継承された Codex thread instructions に留まり、parent-only persona、identity、user files は turn-scoped collaboration instructions として注入されるため、子はそれらを複製しない。
- 最大ネスト深さは 5（`maxSpawnDepth` range: 1–5）。ほとんどのユースケースでは深さ 2 が推奨される。
- `maxChildrenPerAgent` はセッションごとの active children を制限する（デフォルト `5`、range `1–20`）。

## 関連

- [ACP agents](/ja-JP/tools/acp-agents)
- [Agent send](/ja-JP/tools/agent-send)
- [Background tasks](/ja-JP/automation/tasks)
- [Multi-agent sandbox tools](/ja-JP/tools/multi-agent-sandbox-tools)
