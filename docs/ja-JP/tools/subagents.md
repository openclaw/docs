---
read_when:
    - エージェント経由でバックグラウンド作業または並列作業を行いたい
    - sessions_spawn またはサブエージェントツールポリシーを変更している
    - スレッドに紐づいたサブエージェントセッションを実装またはトラブルシューティングしている
sidebarTitle: Sub-agents
summary: 結果をリクエスト元のチャットに通知する、分離されたバックグラウンドのエージェント実行を生成する
title: サブエージェント
x-i18n:
    generated_at: "2026-07-05T11:56:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 937ff806dc0dc5f5de5e80b03835131d66c37762cd2be215b17d622720183379
    source_path: tools/subagents.md
    workflow: 16
---

サブエージェントは、既存のエージェント実行から生成されるバックグラウンドのエージェント実行です。
各サブエージェントは独自のセッション（`agent:<agentId>:subagent:<uuid>`）で実行され、
完了すると、その結果をリクエスト元のチャットチャネルへ**通知**します。
すべてのサブエージェント実行は[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

目標:

- メイン実行をブロックせずに、調査、長時間タスク、遅いツール作業を並列化する。
- サブエージェントをデフォルトで分離する（セッション分離、任意のサンドボックス化）。
- ツール面を誤用しにくくする: サブエージェントにはデフォルトでセッションツールやメッセージツールを与えない。
- オーケストレーターパターン向けに設定可能なネスト深度をサポートする。

<Note>
**コストに関する注意:** デフォルトでは、各サブエージェントは独自のコンテキストとトークン使用量を持ちます。重いタスクや反復的なタスクでは、サブエージェントにより安価なモデルを設定し、`agents.defaults.subagents.model` またはエージェントごとのオーバーライドを使ってメインエージェントは高品質なモデルのままにしてください。子エージェントがリクエスト元の現在のトランスクリプトを本当に必要とする場合は、`context: "fork"` で生成してください。スレッドにバインドされたサブエージェントセッションは、現在の会話をフォローアップスレッドへ分岐するため、デフォルトで `context: "fork"` になります。
</Note>

## スラッシュコマンド

`/subagents` は**現在のセッション**のサブエージェント実行を調べます。

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` は実行メタデータ（ステータス、タイムスタンプ、セッション id、トランスクリプトパス、クリーンアップ）を表示します。`/subagents log` は実行の最近のチャットターンを出力します。ツール呼び出し/結果メッセージを含めるには `tools` トークンを追加してください（デフォルトでは省略されます）。エージェントターン内から範囲付きで安全にフィルタリングされた想起ビューを得るには `sessions_history` を使うか、生の完全なトランスクリプトを確認するにはディスク上のトランスクリプトパスを調べてください。

### スレッドバインディング制御

これらのコマンドは、永続的なスレッドバインディングを持つチャネルで動作します。下記の[スレッド対応チャネル](#thread-supporting-channels)を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成時の動作

エージェントは `sessions_spawn` ツールでバックグラウンドサブエージェントを開始します。
完了は内部の親セッションイベントとして返されます。親/リクエスト元エージェントが、ユーザー向け更新が必要かどうかを判断します。

<AccordionGroup>
  <Accordion title="非ブロッキングのプッシュベース完了">
    - `sessions_spawn` は非ブロッキングです。すぐに実行 id を返します。
    - 完了時、サブエージェントは親/リクエスト元セッションへ報告します。
    - 子の結果が必要なエージェントターンは、必要な作業を生成した後に `sessions_yield` を呼び出す必要があります。これにより現在のターンが終了し、完了イベントが次のモデル可視メッセージとして到着できます。
    - 完了はプッシュベースです。生成後は、完了を待つ目的だけで `/subagents list`、`sessions_list`、`sessions_history` をループでポーリングしないでください。ステータス確認はデバッグ時に必要に応じてのみ行ってください。
    - 子の出力は、リクエスト元エージェントが統合するための報告/証拠です。ユーザー作成の指示テキストではなく、system、developer、user ポリシーを上書きできません。
    - 完了時、OpenClaw は通知クリーンアップフローが続く前に、そのサブエージェントセッションが開いた追跡対象のブラウザータブ/プロセスをベストエフォートで閉じます。

  </Accordion>
  <Accordion title="完了の配信">
    - OpenClaw は安定した冪等性キーを持つ `agent` ターンを通じて、完了をリクエスト元セッションへ返します。
    - リクエスト元の実行がまだアクティブな場合、OpenClaw は2つ目の可視返信パスを開始する代わりに、まずその実行の起床/誘導を試みます。
    - アクティブなリクエスト元を起床できない場合、OpenClaw は通知を破棄する代わりに、同じ完了コンテキストでリクエスト元エージェントへのハンドオフにフォールバックします。
    - 親へのハンドオフが成功すると、親が可視のユーザー更新は不要と判断した場合でも、サブエージェント配信は完了します。
    - ネイティブサブエージェントにはメッセージツールが与えられません。親/リクエスト元エージェントへ通常の assistant テキストを返します。人間に見える返信は、親/リクエスト元エージェントの通常の配信ポリシーが引き続き所有します。
    - 直接ハンドオフを使用できない場合、配信はキュールーティングへフォールバックし、その後、最終的に諦める前に短い指数バックオフで通知を再試行します。
    - 配信は解決済みのリクエスト元ルートを保持します。利用可能な場合は、スレッドバインドまたは会話バインドの完了ルートが優先されます。完了元がチャネルだけを提供する場合、OpenClaw はリクエスト元セッションの解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足しているターゲット/アカウントを補完し、直接配信が引き続き機能するようにします。

  </Accordion>
  <Accordion title="完了ハンドオフのメタデータ">
    リクエスト元セッションへの完了ハンドオフは、ランタイム生成の内部コンテキスト（ユーザー作成テキストではありません）であり、次を含みます。

    - `Result` — 子からの最新の可視 `assistant` 返信テキスト。Tool/toolResult 出力は子の結果へ昇格されません。終端失敗した実行は、キャプチャ済み返信テキストを再利用しません。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - コンパクトなランタイム/トークン統計。
    - 元のタスクが完了したかどうかを判断する前に、リクエスト元エージェントへ結果を検証するよう伝えるレビュー指示。
    - 子の結果に追加対応が残る場合に、タスクを継続するかフォローアップを記録するようリクエスト元エージェントへ伝えるフォローアップガイダンス。
    - 追加対応がないパス向けの最終更新指示。生の内部メタデータを転送せず、通常の assistant の声で書かれます。

  </Accordion>
  <Accordion title="モードと ACP ランタイム">
    - `--model` と `--thinking` は、その特定の実行のデフォルトをオーバーライドします。
    - 完了後に詳細と出力を調べるには `info`/`log` を使います。
    - 永続的なスレッドバインドセッションでは、`thread: true` と `mode: "session"` を指定して `sessions_spawn` を使います。
    - リクエスト元チャネルがスレッドバインディングをサポートしない場合、不可能なスレッドバインドの組み合わせを再試行するのではなく、`mode: "run"` を使います。
    - ACP ハーネスセッション（Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx）では、ツールがそのランタイムを公開している場合に `runtime: "acp"` を指定して `sessions_spawn` を使います。完了やエージェント間ループをデバッグする場合は、[ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model)を参照してください。`codex` Plugin が有効な場合、ユーザーが明示的に ACP/acpx を求めない限り、Codex のチャット/スレッド制御では ACP より `/codex ...` を優先してください。
    - OpenClaw は、ACP が有効で、リクエスト元がサンドボックス化されておらず、`acpx` などのバックエンド Plugin が読み込まれるまで、`runtime: "acp"` を非表示にします。`runtime: "acp"` は外部 ACP ハーネス id、または `runtime.type="acp"` を持つ `agents.list[]` エントリを想定します。`agents_list` 由来の通常の OpenClaw 設定エージェントには、デフォルトのサブエージェントランタイムを使ってください。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブサブエージェントは、呼び出し元が現在のトランスクリプトをフォークするよう明示的に求めない限り、分離された状態で開始します。

| モード       | 使用する場面                                                                                                                         | 動作                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規調査、独立した実装、遅いツール作業、またはタスクテキストで簡潔に説明できるもの                           | クリーンな子トランスクリプトを作成します。これがデフォルトで、トークン使用量を低く保ちます。  |
| `fork`     | 現在の会話、以前のツール結果、またはリクエスト元トランスクリプトにすでに存在する微妙な指示に依存する作業 | 子が開始する前に、リクエスト元トランスクリプトを子セッションへ分岐します。 |

`fork` は控えめに使ってください。これはコンテキスト依存の委任用であり、明確なタスクプロンプトを書くことの代替ではありません。

## ツール: `sessions_spawn`

グローバルな `subagent` レーンで `deliver: false` のサブエージェント実行を開始し、その後通知ステップを実行して、通知返信をリクエスト元チャットチャネルへ投稿します。

利用可否は、呼び出し元の有効なツールポリシーに依存します。組み込みの `coding` プロファイルには `sessions_spawn` が含まれます。`messaging` と `minimal` には含まれません。`full` はすべてのツールを許可します。より狭いプロファイル上でも作業を委任する必要があるエージェントには、`tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` を追加するか、`tools.profile: "coding"` を使ってください。
チャネル/グループ、プロバイダー、サンドボックス、エージェントごとの許可/拒否ポリシーは、プロファイル段階の後でもツールを削除できます。有効なツール一覧を確認するには、同じセッションから `/tools` を使ってください。

**デフォルト:**

- **モデル:** ネイティブサブエージェントは、`agents.defaults.subagents.model`（またはエージェントごとの `agents.list[].subagents.model`）を設定しない限り、呼び出し元を継承します。ACP ランタイムの生成では、設定済みのサブエージェントモデルが存在する場合は同じものを使います。存在しない場合、ACP ハーネスは自身のデフォルトを保持します。明示的な `sessions_spawn.model` は引き続き優先されます。
- **Thinking:** ネイティブサブエージェントは、`agents.defaults.subagents.thinking`（またはエージェントごとの `agents.list[].subagents.thinking`）を設定しない限り、呼び出し元を継承します。ACP ランタイムの生成では、選択されたモデルに対して `agents.defaults.models["provider/model"].params.thinking` も適用されます。明示的な `sessions_spawn.thinking` は引き続き優先されます。
- **実行タイムアウト:** `agents.defaults.subagents.runTimeoutSeconds` が設定されている場合、OpenClaw はそれを使います。それ以外の場合は `0`（タイムアウトなし）にフォールバックします。`sessions_spawn` は呼び出しごとのタイムアウトオーバーライドを受け付けません。
- **タスク配信:** ネイティブサブエージェントは、最初の可視 `[Subagent Task]` メッセージで委任タスクを受け取ります。サブエージェントの system プロンプトはランタイムルールとルーティングコンテキストを保持し、タスクの隠し複製は保持しません。

受け入れられたネイティブサブエージェント生成は、解決済みの子モデルメタデータをツール結果に含めます。`resolvedModel` には適用されたモデル ref が含まれ、ref にプレフィックスがある場合は `resolvedProvider` にプロバイダープレフィックスが含まれます。

### 委任プロンプトモード

`agents.defaults.subagents.delegationMode` はプロンプトガイダンスのみを制御します。ツールポリシーを変更したり、委任を強制したりはしません。

- `suggest`（デフォルト）: より大きい作業や遅い作業にサブエージェントを使うよう促す標準のプロンプト誘導を維持します。
- `prefer`: 直接返信より手間のかかるものは `sessions_spawn` を通じて委任し、メインエージェントは応答性を保つよう伝えます。

エージェントごとのオーバーライド: `agents.list[].subagents.delegationMode`。

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
  後続のステータス出力で特定の子を識別するための任意の安定したハンドル。`[a-z][a-z0-9_-]{0,63}` に一致する必要があり、`last` や `all` などの予約済みターゲットは使用できません。
</ParamField>
<ParamField path="label" type="string">
  任意の人間が読めるラベル。
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` で許可されている場合、別の設定済みエージェント id の下で生成します。
</ParamField>
<ParamField path="cwd" type="string">
  子実行用の任意のタスク作業ディレクトリ。ネイティブサブエージェントは引き続きターゲットエージェントワークスペースからブートストラップファイルを読み込みます。`cwd` は、ランタイムツールと CLI ハーネスが委任された作業を行う場所だけを変更します。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` は外部 ACP ハーネス（`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx）と、`runtime.type` が `acp` である `agents.list[]` エントリ専用です。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP 専用。`runtime: "acp"` の場合に既存の ACP ハーネスセッションを再開します。ネイティブサブエージェントの生成では無視されます。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP 専用。`runtime: "acp"` の場合に ACP 実行出力を親セッションへストリーミングします。ネイティブサブエージェントの生成では省略します。
</ParamField>
<ParamField path="model" type="string">
  サブエージェントモデルを上書きします。無効な値はスキップされ、サブエージェントはデフォルトモデルで実行され、ツール結果に警告が表示されます。
</ParamField>
<ParamField path="thinking" type="string">
  サブエージェント実行の思考レベルを上書きします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェントセッションにチャネルスレッドバインディングを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略された場合、デフォルトは `session` になります。`mode: "session"` には `thread: true` が必要です。
  要求元チャネルでスレッドバインディングを使用できない場合は、代わりに `mode: "run"` を使用してください。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` はアナウンス直後にセッションをアーカイブします（リネームによりトランスクリプトは引き続き保持します）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、ターゲットの子ランタイムがサンドボックス化されていない限り生成を拒否します。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` は要求元の現在のトランスクリプトを子セッションへ分岐します。ネイティブサブエージェント専用です。スレッドバインドされた生成はデフォルトで `fork`、非スレッド生成はデフォルトで `isolated` です。
</ParamField>

<Warning>
`sessions_spawn` はチャネル配信パラメータ（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。ネイティブサブエージェントは
最新のアシスタントターンを要求元へ報告します。外部配信は
親/要求元エージェント側に残ります。
</Warning>

### タスク名とターゲット指定

`taskName` はオーケストレーション用のモデル向けハンドルであり、セッションキーではありません。
コーディネーターが後でその子を調査する必要がある場合に、`review_subagents`、
`linux_validation`、`docs_update` などの安定した子名として使用します。

ターゲット解決は、完全な `taskName` 一致と曖昧でない
プレフィックスを受け付けます。照合は、番号付き `/subagents` ターゲットで使用される
同じアクティブ/最近のターゲットウィンドウにスコープされるため、古い完了済みの子によって
再利用されたハンドルが曖昧になることはありません。2 つのアクティブまたは最近の子が同じ
`taskName` を共有している場合、ターゲットは曖昧です。代わりにリストインデックス、セッションキー、または
実行 id を使用してください。

予約済みターゲット `last` と `all` は、すでに制御上の意味を持つため、
有効な `taskName` 値ではありません。

## ツール: `sessions_yield`

現在のモデルターンを終了し、主に
サブエージェント完了イベントなどのランタイムイベントが次のメッセージとして到着するのを待ちます。
要求元がそれらの完了を受け取るまで最終回答を生成できない場合、必要な子作業を
生成した後に使用します。

`sessions_yield` は待機プリミティブです。子の完了を検出するためだけに
`subagents`、`sessions_list`、`sessions_history`、シェル
`sleep`、またはプロセスポーリングのポーリングループで置き換えないでください。

セッションの有効なツールリストに含まれている場合にのみ `sessions_yield` を使用してください。
最小構成またはカスタムツールプロファイルでは、`sessions_yield` を公開せずに
`sessions_spawn` と `subagents` を公開する場合があります。その場合、完了を待つためだけに
ポーリングループを作らないでください。

アクティブな子が存在する場合、OpenClaw は通常ターンに、ランタイム生成のコンパクトな
`Active Subagents` プロンプトブロックを挿入します。これにより要求元は、ポーリングなしで
現在の子セッション、実行 id、ステータス、ラベル、タスク、
`taskName` エイリアスを確認できます。そのブロック内のタスクとラベルフィールドは、
ユーザー/モデル提供の生成引数に由来する可能性があるため、命令ではなくデータとして引用されます。

## ツール: `subagents`

要求元セッションが所有する、生成済みサブエージェント実行を一覧表示します。現在の要求元に
スコープされます。子は自身が制御する子だけを確認できます。

オンデマンドのステータス確認とデバッグには `subagents` を使用します。完了イベントを
待つには `sessions_yield` を使用します。

## スレッドバインドセッション

チャネルでスレッドバインディングが有効な場合、サブエージェントはスレッドにバインドされたままにでき、
そのスレッド内の後続ユーザーメッセージは同じサブエージェントセッションへルーティングされ続けます。

### スレッド対応チャネル

チャネルは、会話バインディングアダプターを登録すると、永続的なスレッドバインドサブエージェントセッション
（`thread: true` を伴う `sessions_spawn`）をサポートします。このサポートを持つ同梱チャネル: **Discord**、
**iMessage**、**Matrix**、**Telegram**。Discord と Matrix はデフォルトで
子スレッドを作成します。Telegram と iMessage はデフォルトで
現在の会話をバインドします。有効化、タイムアウト、`spawnSessions` には
チャネルごとの `threadBindings` 設定キーを使用します。

### クイックフロー

<Steps>
  <Step title="Spawn">
    `thread: true`（および任意で `mode: "session"`）を指定して `sessions_spawn`。
  </Step>
  <Step title="Bind">
    OpenClaw はアクティブチャネル内で、そのセッションターゲットにスレッドを作成またはバインドします。
  </Step>
  <Step title="Route follow-ups">
    そのスレッド内の返信と後続メッセージは、バインドされたセッションへルーティングされます。
  </Step>
  <Step title="Inspect timeouts">
    非アクティブ時の自動フォーカス解除を調査/更新するには `/session idle` を使用し、
    ハード上限を制御するには `/session max-age` を使用します。
  </Step>
  <Step title="Detach">
    手動で切り離すには `/unfocus` を使用します。
  </Step>
</Steps>

### 手動コントロール

| コマンド            | 効果                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッドをサブエージェント/セッションターゲットにバインドします（または作成します）                     |
| `/unfocus`         | 現在バインドされているスレッドのバインディングを削除します                                           |
| `/agents`          | アクティブな実行とバインディング状態（`binding:<id>`、`unbound`、または `bindings unavailable`）を一覧表示します |
| `/session idle`    | アイドル時の自動フォーカス解除を調査/更新します（フォーカスされたバインドスレッドのみ）                             |
| `/session max-age` | ハード上限を調査/更新します（フォーカスされたバインドスレッドのみ）                                      |

### 設定スイッチ

- **グローバルデフォルト:** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **チャネル上書きと生成時の自動バインドキー** はアダプター固有です。上記の [スレッド対応チャネル](#thread-supporting-channels) を参照してください。

現在のアダプター詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference) と
[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

### 許可リスト

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  明示的な `agentId` 経由でターゲットにできる設定済みエージェント id のリスト（`["*"]` は任意の設定済みターゲットを許可します）。デフォルト: 要求元エージェントのみ。リストを設定し、それでも要求元が `agentId` で自身を生成できるようにしたい場合は、要求元 id をリストに含めてください。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  要求元エージェントが独自の `subagents.allowAgents` を設定していない場合に使用される、デフォルトの設定済みターゲットエージェント許可リスト。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します）。エージェントごとの上書き: `agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway の `agent` アナウンス配信試行に対する呼び出しごとのタイムアウト。値は正の整数ミリ秒で、プラットフォームで安全なタイマー最大値にクランプされます。一時的な再試行により、アナウンス待機の合計が設定済みタイムアウト 1 回分より長くなる場合があります。
</ParamField>

要求元セッションがサンドボックス化されている場合、`sessions_spawn` は
サンドボックスなしで実行されるターゲットを拒否します。

### 検出

`sessions_spawn` で現在許可されているエージェント id を確認するには
`agents_list` を使用します。レスポンスには、一覧に含まれる各エージェントの有効な
モデルと埋め込みランタイムメタデータが含まれるため、呼び出し元は OpenClaw、Codex
app-server、その他の設定済みネイティブランタイムを区別できます。

`allowAgents` エントリは `agents.list[]` 内の設定済みエージェント id を指す必要があります。
`["*"]` は任意の設定済みターゲットエージェントと要求元を意味します。エージェント設定が
削除されてもその id が `allowAgents` に残っている場合、`sessions_spawn` はその id を拒否し、
`agents_list` はそれを省略します。古い許可リストエントリをクリーンアップするには
`openclaw doctor --fix` を実行するか、デフォルトを継承しながらターゲットを
生成可能なままにする必要がある場合は、最小限の `agents.list[]` エントリを追加してください。

### 自動アーカイブ

- サブエージェントセッションは、`agents.defaults.subagents.archiveAfterMinutes` 後に自動的にアーカイブされます（デフォルト `60`）。
- アーカイブは `sessions.delete` を使用し、トランスクリプトを `*.deleted.<timestamp>` にリネームします（同じフォルダー）。
- `cleanup: "delete"` はアナウンス直後にアーカイブします（リネームによりトランスクリプトは引き続き保持します）。
- 自動アーカイブはベストエフォートです。Gateway が再起動すると保留中のタイマーは失われます。
- 設定済み実行タイムアウトは自動アーカイブを行いません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは深さ 1 と深さ 2 のセッションに同様に適用されます。
- ブラウザのクリーンアップはアーカイブのクリーンアップとは別です。トランスクリプト/セッションレコードを保持する場合でも、追跡対象のブラウザタブ/プロセスは実行終了時にベストエフォートで閉じられます。

## ネストされたサブエージェント

デフォルトでは、サブエージェントは自身のサブエージェントを生成できません
（`maxSpawnDepth: 1`）。1 レベルのネストを有効にするには `maxSpawnDepth: 2` を設定します。
これは **オーケストレーターパターン** です: main → オーケストレーターサブエージェント →
ワーカーサブサブエージェント。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1, range 1-5)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5, range 1-20)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### 深さレベル

| 深さ | セッションキーの形状                         | 役割                                                | spawn 可能か                  |
| ----- | -------------------------------------------- | --------------------------------------------------- | ----------------------------- |
| 0     | `agent:<id>:main`                            | メインエージェント                                  | 常に可能                      |
| 1     | `agent:<id>:subagent:<uuid>`                 | サブエージェント（深さ 2 が許可されている場合はオーケストレーター） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（リーフワーカー）              | 不可                          |

### announce チェーン

結果はチェーンをさかのぼって戻ります。

1. 深さ 2 のワーカーが終了 → 親（深さ 1 のオーケストレーター）へ announce します。
2. 深さ 1 のオーケストレーターが announce を受け取り、結果を統合して終了 → メインへ announce します。
3. メインエージェントが announce を受け取り、ユーザーへ届けます。

各レベルは、直接の子からの announce だけを参照します。

<Note>
**運用ガイダンス:** `sessions_list`、
`sessions_history`、`/subagents list`、または `exec` の sleep コマンドを
中心にポーリングループを組むのではなく、子の作業は一度だけ開始し、
完了イベントを待ってください。`sessions_list` と `/subagents list` は、
子セッションの関係を進行中の作業に集中させます。進行中の子は接続されたままになり、
終了した子は短い直近ウィンドウの間は表示され、古いストア内だけの子リンクは
鮮度ウィンドウの後に無視されます。これにより、再起動後に古い `spawnedBy` /
`parentSessionKey` メタデータがゴーストの子を復活させるのを防ぎます。
最終回答をすでに送信した後に子の完了イベントが届いた場合、正しいフォローアップは
厳密なサイレントトークン `NO_REPLY` / `no_reply` です。
</Note>

### 深さ別のツールポリシー

- 役割と制御スコープは spawn 時にセッションメタデータへ書き込まれます。これにより、フラット化または復元されたセッションキーが誤ってオーケストレーター権限を取り戻すことを防ぎます。
- **深さ 1（オーケストレーター、`maxSpawnDepth >= 2` の場合）:** 子を spawn し、その状態を確認できるように、`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。その他のセッション/システムツールは拒否されたままです。
- **深さ 1（リーフ、`maxSpawnDepth == 1` の場合）:** セッションツールはありません（現在のデフォルト動作）。
- **深さ 2（リーフワーカー）:** セッションツールはありません。`sessions_spawn` は深さ 2 では常に拒否されます。それ以上の子は spawn できません。

### エージェントごとの spawn 制限

各エージェントセッション（任意の深さ）は、同時に最大 `maxChildrenPerAgent`
（デフォルト `5`）個までアクティブな子を持てます。これにより、単一の
オーケストレーターからの制御不能なファンアウトを防ぎます。

### カスケード停止

深さ 1 のオーケストレーターを停止すると、その深さ 2 の子もすべて自動的に停止します。

- メインチャットでの `/stop` は、すべての深さ 1 エージェントを停止し、その深さ 2 の子へカスケードします。

## 認証

サブエージェントの認証は、セッション種別ではなく **エージェント ID** によって解決されます。

- サブエージェントのセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- 認証ストアはそのエージェントの `agentDir` から読み込まれます。
- メインエージェントの認証プロファイルは **フォールバック** としてマージされます。競合時はエージェントプロファイルがメインプロファイルを上書きします。

マージは追加的であるため、メインプロファイルは常にフォールバックとして利用できます。
エージェントごとに完全に分離された認証は、まだサポートされていません。

## Announce

サブエージェントは announce ステップを介して報告します。

- announce ステップは、リクエスターセッションではなくサブエージェントセッション内で実行されます。
- サブエージェントが厳密に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新のアシスタントテキストが厳密なサイレントトークン `NO_REPLY` / `no_reply` の場合、以前に可視の進捗が存在していても announce 出力は抑制されます。

配信はリクエスターの深さに依存します。

- トップレベルのリクエスターセッションは、外部配信（`deliver=true`）付きのフォローアップ `agent` 呼び出しを使用します。
- ネストされたリクエスターのサブエージェントセッションは、内部フォローアップ注入（`deliver=false`）を受け取り、オーケストレーターがセッション内で子の結果を統合できるようにします。
- ネストされたリクエスターのサブエージェントセッションがなくなっている場合、OpenClaw は利用可能であればそのセッションのリクエスターへフォールバックします。

トップレベルのリクエスターセッションでは、完了モードの直接配信はまず
バインドされた会話/スレッドルートとフック上書きを解決し、その後、欠けている
チャネルターゲットフィールドをリクエスターセッションに保存されたルートから埋めます。
これにより、完了元がチャネルだけを識別している場合でも、完了が正しいチャット/トピックに留まります。

ネストされた完了所見を構築する際、子の完了集約は現在のリクエスター実行にスコープされ、
過去の実行に由来する古い子出力が現在の announce に漏れ込むのを防ぎます。
announce 返信は、チャネルアダプターで利用可能な場合、スレッド/トピックルーティングを保持します。

### announce コンテキスト

announce コンテキストは、安定した内部イベントブロックへ正規化されます。

| フィールド | ソース                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| ソース         | `subagent` または `cron`                                                                                 |
| セッション ID  | 子セッションキー/ID                                                                                     |
| 種別           | announce 種別 + タスクラベル                                                                            |
| ステータス     | ランタイム結果（`ok`、`error`、`timeout`、または `unknown`）から導出。モデルテキストからの推測では**ありません** |
| 結果内容       | 子からの最新の可視アシスタントテキスト                                                                  |
| フォローアップ | 返信する場合と沈黙を維持する場合を説明する指示                                                          |

終了時に失敗した実行は、キャプチャされた返信テキストを再生せずに失敗ステータスを報告します。
tool/toolResult 出力は、子の結果テキストへ昇格されません。

### 統計行

announce ペイロードには、末尾に統計行が含まれます（折り返されている場合も同様）。

- ランタイム（例: `runtime 5m12s`）。
- トークン使用量（入力/出力/合計）。
- モデル価格が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- メインエージェントが `sessions_history` で履歴を取得するか、ディスク上のファイルを検査できるようにするための、`sessionKey`、`sessionId`、トランスクリプトパス。

内部メタデータはオーケストレーション専用です。ユーザー向け返信は、
通常のアシスタントの声に書き換えるべきです。

### `sessions_history` を推奨する理由

`sessions_history` は、エージェントターン内から子のトランスクリプトを読むための、
より安全なオーケストレーション経路です。

- 汎用ログのリダクションが無効な場合でも、認証情報/トークンのようなテキストをリダクトします。
- 長いテキストブロックを切り詰め（ブロックごとに 4000 文字）、思考シグネチャ、推論リプレイペイロード、インライン画像データを削除します。
- 80 KB のレスポンス上限を適用します。上限を超える行は `[sessions_history omitted: message too large]` に置き換えられます。
- 存在する場合は `nextOffset` を使用して、古いトランスクリプトウィンドウへ逆方向にページングします。
- `sessions_history` は、メッセージテキストから推論タグ、`<relevant-memories>` の足場、またはツール呼び出し XML を削除**しません**。これは、生のトランスクリプト形状に近い構造化コンテンツブロックを、リダクトおよびサイズ制限したうえで返します。`/subagents log` は、構造化ブロックではなくプレーンなチャット行をレンダリングするため、より重い prose サニタイザー（推論タグ、メモリの足場、ツール呼び出し XML を削除）を適用します。
- 完全なバイト単位一致のトランスクリプトが必要な場合は、ディスク上の生トランスクリプト検査がフォールバックです。

## ツールポリシー

サブエージェントは、まず親または対象エージェントと同じプロファイルおよび
ツールポリシーパイプラインを使用します。その後、OpenClaw がサブエージェント制限レイヤーを適用します。

サブエージェントは、深さや役割にかかわらず、常に `gateway`、`agents_list`、
`session_status`、`cron` を失います（システムレベル/対話型ツール、または
メインエージェントが調整すべきツール）。リーフサブエージェント（デフォルトの深さ 1
動作、および深さ 2 では常に）は、さらに `subagents`、`sessions_list`、
`sessions_history`、`sessions_spawn` を失います。サブエージェントは `message`
ツールを取得することはありません。これはこの拒否リストでフィルタリングされるのではなく、
spawn 時に無効化されます。また、`sessions_send` は拒否されたままなので、
サブエージェントは announce チェーンを通じてのみ通信します。

`sessions_history` はここでも、境界付けられ、サニタイズされたリコールビューのままです。
生のトランスクリプトダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーターサブエージェントは、
子を管理できるように `sessions_spawn`、`subagents`、`sessions_list`、
`sessions_history` も受け取ります。

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

`tools.subagents.tools.allow` は最終的な allow-only フィルターです。
すでに解決済みのツールセットを狭めることはできますが、`tools.profile` によって
削除されたツールを**戻して追加**することはできません。たとえば、
`tools.profile: "coding"` には `web_search`/`web_fetch` が含まれますが、
`browser` ツールは含まれません。coding プロファイルのサブエージェントに
ブラウザー自動化を使用させるには、プロファイル段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

1 つのエージェントだけにブラウザー自動化を付与する場合は、
エージェントごとの `agents.list[].tools.alsoAllow: ["browser"]` を使用します。

## 並行性

サブエージェントは、専用のプロセス内キューレーンを使用します。

- **レーン名:** `subagent`
- **並行数:** `agents.defaults.subagents.maxConcurrent`（デフォルト `8`）

## 生存性とリカバリー

OpenClaw は、`endedAt` がないことを、サブエージェントがまだ生きているという
永続的な証拠として扱いません。古い実行ウィンドウ（2 時間、または設定された実行タイムアウトに
短い猶予期間を加えたもののうち、長い方）より古い未終了実行は、`/subagents list`、
ステータスサマリー、子孫の完了ゲーティング、セッションごとの並行性チェックで、
アクティブ/保留中として数えられなくなります。

gateway 再起動後、古い未終了の復元実行は、その子セッションが
`abortedLastRun: true` とマークされていない限りプルーニングされます。
これらの再起動で中止された子セッションは、サブエージェントの孤立リカバリーフローを通じて
復旧可能なままになります。このフローは、中止マーカーをクリアする前に合成 resume
メッセージを送信します。

自動再起動リカバリーは、子セッションごとに境界付けられています。同じサブエージェントの子が、
急速な再 wedge ウィンドウ内で繰り返し孤立リカバリーに受け入れられた場合、
OpenClaw はそのセッションにリカバリートゥームストーンを永続化し、以降の再起動では
自動再開を停止します。タスクレコードを整合させるには
`openclaw tasks maintenance --apply` を実行し、トゥームストーン化されたセッションの
古い中止リカバリーフラグをクリアするには `openclaw doctor --fix` を実行します。

<Note>
サブエージェントの spawn が Gateway の `PAIRING_REQUIRED` /
`scope-upgrade` で失敗する場合は、ペアリング状態を編集する前に RPC 呼び出し元を確認してください。
内部の `sessions_spawn` 調整は、呼び出し元がすでに gateway リクエストコンテキスト内で
実行されている場合、プロセス内でディスパッチされます。そのため、loopback WebSocket を開かず、
CLI のペアリング済みデバイススコープのベースラインにも依存しません。gateway プロセス外の
呼び出し元は、直接 loopback の共有トークン/パスワード認証上で、`client.id: "gateway-client"`、
`client.mode: "backend"` として WebSocket フォールバックを引き続き使用します。
リモート呼び出し元、明示的な `deviceIdentity`、明示的なデバイストークン経路、
およびブラウザー/node クライアントは、スコープアップグレードに通常のデバイス承認を引き続き必要とします。
</Note>

## 停止

- リクエスターチャットで `/stop` を送信すると、リクエスターセッションが中止され、そこから spawn されたアクティブなサブエージェント実行が停止し、ネストされた子へカスケードします。

## 制限事項

- サブエージェントのアナウンスは**ベストエフォート**です。Gateway が再起動すると、保留中の「アナウンスバック」作業は失われます。
- サブエージェントは引き続き同じ Gateway プロセスのリソースを共有します。`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。`{ status: "accepted", runId, childSessionKey }` を即座に返します。
- サブエージェントのコンテキストは `AGENTS.md` と `TOOLS.md` のみを注入します（`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は含みません）。Codex ネイティブのサブエージェントも同じ境界に従います。`TOOLS.md` は継承された Codex スレッド指示内に残り、親専用のペルソナ、アイデンティティ、ユーザーファイルはターンスコープの共同作業指示として注入されるため、子はそれらを複製しません。
- 最大ネスト深度は 5 です（`maxSpawnDepth` の範囲: 1-5）。ほとんどのユースケースでは深度 2 を推奨します。
- `maxChildrenPerAgent` はセッションごとのアクティブな子の数を制限します（デフォルト `5`、範囲 `1-20`）。

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents)
- [Agent 送信](/ja-JP/tools/agent-send)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
