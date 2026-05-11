---
read_when:
    - エージェント経由でバックグラウンド作業または並列作業を行いたい
    - sessions_spawn またはサブエージェントツールポリシーを変更しています
    - スレッドに紐付いたサブエージェントセッションを実装またはトラブルシューティングしている
sidebarTitle: Sub-agents
summary: リクエスト元のチャットに結果を通知する、分離されたバックグラウンドエージェント実行を起動する
title: サブエージェント
x-i18n:
    generated_at: "2026-05-11T20:39:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

サブエージェントは、既存のエージェント実行から生成されるバックグラウンドのエージェント実行です。
それぞれ独自のセッション（`agent:<agentId>:subagent:<uuid>`）で実行され、
完了すると結果を要求元のチャットチャネルへ**通知**します。
各サブエージェント実行は
[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

主な目標:

- メイン実行をブロックせずに「調査 / 長いタスク / 遅いツール」の作業を並列化する。
- デフォルトでサブエージェントを分離する（セッション分離 + 任意のサンドボックス化）。
- ツールサーフェスを誤用しにくく保つ: サブエージェントにはデフォルトでセッションツールが与えられません。
- オーケストレーターパターン向けに、設定可能なネスト深度をサポートする。

<Note>
**コストに関する注記:** デフォルトでは、各サブエージェントは独自のコンテキストとトークン使用量を持ちます。重いタスクや反復的なタスクでは、サブエージェントに安価なモデルを設定し、メインエージェントはより高品質なモデルのままにしてください。`agents.defaults.subagents.model` またはエージェントごとのオーバーライドで設定します。子が要求元の現在のトランスクリプトを本当に必要とする場合、エージェントはその spawn だけに `context: "fork"` を要求できます。スレッドに紐づくサブエージェントセッションは、現在の会話をフォローアップスレッドへ分岐させるため、デフォルトで `context: "fork"` になります。
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

現在の要求元セッションのアクティブな実行を steer するには、トップレベルの [`/steer <message>`](/ja-JP/tools/steer) を使用します。対象が子実行の場合は、`/subagents steer <id|#> <message>` を使用します。

`/subagents info` は実行メタデータ（ステータス、タイムスタンプ、セッション ID、トランスクリプトパス、クリーンアップ）を表示します。境界付きで安全フィルター済みの呼び出しビューには `sessions_history` を使用し、生の完全なトランスクリプトが必要な場合はディスク上のトランスクリプトパスを確認します。

### スレッドバインディング制御

これらのコマンドは、永続的なスレッドバインディングをサポートするチャネルで動作します。下記の[スレッドをサポートするチャネル](#thread-supporting-channels)を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### spawn の動作

`/subagents spawn` は、ユーザーコマンドとして（内部リレーではなく）バックグラウンドサブエージェントを開始し、実行が完了すると要求元チャットへ最後の完了更新を1件送信します。

<AccordionGroup>
  <Accordion title="ノンブロッキングでプッシュベースの完了">
    - spawn コマンドはノンブロッキングです。すぐに実行 ID を返します。
    - 完了時、サブエージェントは要求元チャットチャネルへ要約/結果メッセージを通知します。
    - 子の結果を必要とするエージェントターンは、必要な作業を spawn した後に `sessions_yield` を呼び出す必要があります。これにより現在のターンが終了し、完了イベントが次のモデル可視メッセージとして到着できるようになります。
    - 完了はプッシュベースです。spawn 後は、完了待ちだけを目的に `/subagents list`、`sessions_list`、`sessions_history` をループでポーリングしないでください。ステータスの確認は、デバッグや介入のために必要な場合のみにします。
    - 子の出力は、要求元エージェントが統合するためのレポート/証拠です。ユーザーが作成した指示テキストではなく、system、developer、user ポリシーを上書きすることはできません。
    - 完了時、OpenClaw は通知クリーンアップフローを続行する前に、そのサブエージェントセッションが開いた追跡対象のブラウザータブ/プロセスをベストエフォートで閉じます。

  </Accordion>
  <Accordion title="手動 spawn 配信の耐障害性">
    - OpenClaw は、安定した冪等性キーを持つ `agent` ターンを通じて、完了を要求元セッションへ戻します。
    - 要求元実行がまだアクティブな場合、OpenClaw は2つ目の可視返信経路を開始する代わりに、まずその実行の wake/steer を試みます。
    - 要求元エージェントへの完了ハンドオフが失敗する、または可視出力を生成しない場合、OpenClaw は配信失敗として扱い、キュールーティング/再試行へフォールバックします。子の結果を外部チャットへ直接 raw 送信することはありません。
    - 直接ハンドオフを使用できない場合、キュールーティングへフォールバックします。
    - キュールーティングもまだ利用できない場合、最終的に諦める前に短い指数バックオフで通知を再試行します。
    - 完了配信は、解決済みの要求元ルートを保持します。スレッドに紐づく、または会話に紐づく完了ルートが利用可能な場合はそれが優先されます。完了元がチャネルしか提供しない場合、OpenClaw は要求元セッションの解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足しているターゲット/アカウントを補完し、直接配信が引き続き動作するようにします。

  </Accordion>
  <Accordion title="完了ハンドオフメタデータ">
    要求元セッションへの完了ハンドオフは、ランタイムで生成される内部コンテキスト（ユーザーが作成したテキストではありません）であり、次を含みます:

    - `Result` — 最新の可視 `assistant` 返信テキスト。それがなければ、サニタイズされた最新の tool/toolResult テキスト。終端で失敗した実行では、キャプチャ済み返信テキストを再利用しません。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - コンパクトなランタイム/トークン統計。
    - 要求元エージェントに、通常のアシスタントの声で書き直すよう指示する配信指示（生の内部メタデータを転送しない）。

  </Accordion>
  <Accordion title="モードと ACP ランタイム">
    - `--model` と `--thinking` は、その特定の実行についてデフォルトをオーバーライドします。
    - 完了後に詳細と出力を確認するには、`info`/`log` を使用します。
    - `/subagents spawn` はワンショットモード（`mode: "run"`）です。永続的なスレッドバインドセッションには、`thread: true` と `mode: "session"` を指定して `sessions_spawn` を使用します。
    - ACP ハーネスセッション（Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx）では、ツールがそのランタイムを公開している場合に `runtime: "acp"` を指定して `sessions_spawn` を使用します。完了やエージェント間ループをデバッグする場合は、[ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model)を参照してください。`codex` Plugin が有効な場合、Codex のチャット/スレッド制御では、ユーザーが明示的に ACP/acpx を要求しない限り、ACP より `/codex ...` を優先する必要があります。
    - OpenClaw は、ACP が有効で、要求元がサンドボックス化されておらず、`acpx` などのバックエンド Plugin がロードされるまで、`runtime: "acp"` を非表示にします。`runtime: "acp"` は、外部 ACP ハーネス ID、または `runtime.type="acp"` を持つ `agents.list[]` エントリを想定します。`agents_list` の通常の OpenClaw 設定エージェントには、デフォルトのサブエージェントランタイムを使用します。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブサブエージェントは、呼び出し元が現在のトランスクリプトの fork を明示的に要求しない限り、分離された状態で開始します。

| モード       | 使用する場面                                                                                                                         | 動作                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規調査、独立した実装、遅いツール作業、またはタスクテキストで簡潔に説明できるもの                           | クリーンな子トランスクリプトを作成します。これがデフォルトで、トークン使用量を低く抑えます。  |
| `fork`     | 現在の会話、以前のツール結果、または要求元トランスクリプト内にすでに存在する繊細な指示に依存する作業 | 子が開始する前に、要求元トランスクリプトを子セッションへ分岐します。 |

`fork` は控えめに使用してください。これはコンテキスト依存の委任のためのものであり、明確なタスクプロンプトを書くことの代替ではありません。

## ツール: `sessions_spawn`

グローバルな `subagent` レーンで `deliver: false` を指定してサブエージェント実行を開始し、その後通知ステップを実行して、要求元チャットチャネルへ通知返信を投稿します。

利用可否は、呼び出し元の有効なツールポリシーに依存します。`coding` および `full` プロファイルは、デフォルトで `sessions_spawn` を公開します。`messaging` プロファイルは公開しません。作業を委任する必要があるエージェントには、`tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]` を追加するか、`tools.profile: "coding"` を使用してください。チャネル/グループ、プロバイダー、サンドボックス、エージェントごとの許可/拒否ポリシーは、プロファイル段階の後でもツールを削除できます。同じセッションから `/tools` を使用して、有効なツールリストを確認してください。

**デフォルト:**

- **モデル:** `agents.defaults.subagents.model`（またはエージェントごとの `agents.list[].subagents.model`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` はそれでも優先されます。
- **Thinking:** `agents.defaults.subagents.thinking`（またはエージェントごとの `agents.list[].subagents.thinking`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` はそれでも優先されます。
- **実行タイムアウト:** `sessions_spawn.runTimeoutSeconds` が省略された場合、設定されていれば OpenClaw は `agents.defaults.subagents.runTimeoutSeconds` を使用します。それ以外の場合は `0`（タイムアウトなし）へフォールバックします。

### 委任プロンプトモード

`agents.defaults.subagents.delegationMode` はプロンプトガイダンスのみを制御します。ツールポリシーを変更したり、委任を強制したりするものではありません。

- `suggest`（デフォルト）: より大きい作業や遅い作業にはサブエージェントを使用するよう促す標準のプロンプトを維持します。
- `prefer`: メインエージェントに、応答性を保ち、直接返信より複雑なものは `sessions_spawn` を通じて委任するよう伝えます。

エージェントごとのオーバーライドには `agents.list[].subagents.delegationMode` を使用します。

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
  後で `subagents` のターゲット指定に使う任意の安定したハンドル。`[a-z][a-z0-9_]{0,63}` に一致する必要があり、`last` や `all` などの予約済みターゲットは使用できません。コーディネーターが複数の子を生成した後で、特定の子を誘導、停止、識別する必要がある場合に使用することを推奨します。
</ParamField>
<ParamField path="label" type="string">
  任意の人間が読めるラベル。
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` で許可されている場合、別のエージェント ID の下に生成します。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` は、外部 ACP ハーネス（`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx）と、`runtime.type` が `acp` の `agents.list[]` エントリ専用です。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP のみ。`runtime: "acp"` の場合に既存の ACP ハーネスセッションを再開します。ネイティブ サブエージェントの生成では無視されます。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP のみ。`runtime: "acp"` の場合に ACP 実行出力を親セッションへストリーミングします。ネイティブ サブエージェントの生成では省略します。
</ParamField>
<ParamField path="model" type="string">
  サブエージェントのモデルを上書きします。無効な値はスキップされ、ツール結果に警告を出したうえで、サブエージェントはデフォルトモデルで実行されます。
</ParamField>
<ParamField path="thinking" type="string">
  サブエージェント実行の思考レベルを上書きします。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  設定されている場合は `agents.defaults.subagents.runTimeoutSeconds` がデフォルトになり、それ以外は `0` になります。設定すると、サブエージェントの実行は N 秒後に中止されます。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェントセッションに対してチャンネルスレッドのバインドを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略された場合、デフォルトは `session` になります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` はアナウンス直後にアーカイブします（リネームによりトランスクリプトは引き続き保持されます）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、ターゲットの子ランタイムがサンドボックス化されていない限り生成を拒否します。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` は、要求元の現在のトランスクリプトを子セッションへ分岐します。ネイティブ サブエージェントのみ。スレッドバインド付き生成はデフォルトで `fork`、非スレッド生成はデフォルトで `isolated` です。
</ParamField>

<Warning>
`sessions_spawn` はチャンネル配信パラメータ（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、生成された実行から
`message`/`sessions_send` を使用してください。
</Warning>

### タスク名とターゲット指定

`taskName` はオーケストレーション用にモデルへ見せるハンドルであり、セッションキーではありません。
コーディネーターが後でその子を誘導または停止する必要がある場合に、`review_subagents`、
`linux_validation`、`docs_update` などの安定した子名として使用します。

ターゲット解決では、完全一致の `taskName` と曖昧でないプレフィックスを受け付けます。
照合は、番号付き `/subagents` ターゲットで使われるものと同じアクティブ/直近のターゲットウィンドウにスコープされるため、古い完了済みの子によって再利用されたハンドルが曖昧になることはありません。2 つのアクティブまたは直近の子が同じ
`taskName` を共有している場合、ターゲットは曖昧です。代わりにリストインデックス、セッションキー、または実行 ID を使用してください。

予約済みターゲットの `last` と `all` は、すでに制御上の意味を持つため、有効な `taskName` 値ではありません。

## ツール: `sessions_yield`

現在のモデルターンを終了し、主にサブエージェント完了イベントであるランタイムイベントが次のメッセージとして届くのを待ちます。要求元がそれらの完了を受け取るまで最終回答を生成できない場合、必要な子作業を生成した後に使用します。

`sessions_yield` は待機のプリミティブです。子の完了を検出するためだけに、`subagents`、`sessions_list`、`sessions_history`、シェルの
`sleep`、プロセスポーリングに対するポーリングループで置き換えないでください。

セッションの有効なツールリストに含まれている場合にのみ `sessions_yield` を使用してください。一部の最小またはカスタムツールプロファイルでは、`sessions_yield` を公開せずに `sessions_spawn` と
`subagents` を公開する場合があります。その場合、完了を待つためだけにポーリングループを作らないでください。

アクティブな子が存在する場合、OpenClaw は通常のターンにコンパクトなランタイム生成の
`Active Subagents` プロンプトブロックを挿入します。これにより要求元は、ポーリングせずに現在の子セッション、実行 ID、ステータス、ラベル、タスク、`taskName` エイリアスを確認できます。そのブロック内のタスクおよびラベルフィールドは、命令ではなくデータとして引用されます。これは、ユーザー/モデルが提供した生成引数に由来する可能性があるためです。

## ツール: `subagents`

要求元セッションが所有する生成済みサブエージェント実行を一覧表示、誘導、または停止します。現在の要求元にスコープされます。子は自分が制御する子だけを参照/制御できます。

オンデマンドのステータス、デバッグ、誘導、停止には `subagents` を使用します。
完了イベントを待つには `sessions_yield` を使用します。

## スレッドバインド付きセッション

チャンネルでスレッドバインドが有効な場合、サブエージェントはスレッドにバインドされたままになり、そのスレッド内の後続のユーザーメッセージを同じサブエージェントセッションへルーティングし続けることができます。

### スレッド対応チャンネル

**Discord** は現在唯一の対応チャンネルです。永続的なスレッドバインド付きサブエージェントセッション（`thread: true` を指定した `sessions_spawn`）、手動スレッド制御（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`）、およびアダプターキー
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours`、
`channels.discord.threadBindings.spawnSessions` をサポートします。

### クイックフロー

<Steps>
  <Step title="生成">
    `thread: true`（および任意で `mode: "session"`）を指定して `sessions_spawn`。
  </Step>
  <Step title="バインド">
    OpenClaw は、アクティブなチャンネルでそのセッションターゲットに対してスレッドを作成またはバインドします。
  </Step>
  <Step title="後続メッセージのルーティング">
    そのスレッド内の返信と後続メッセージは、バインドされたセッションへルーティングされます。
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

| コマンド           | 効果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッドをサブエージェント/セッションターゲットにバインドします（または作成します） |
| `/unfocus`         | 現在バインドされているスレッドのバインドを削除します                  |
| `/agents`          | アクティブな実行とバインド状態（`thread:<id>` または `unbound`）を一覧表示します |
| `/session idle`    | アイドル時の自動フォーカス解除を確認/更新します（フォーカスされたバインド済みスレッドのみ） |
| `/session max-age` | ハード上限を確認/更新します（フォーカスされたバインド済みスレッドのみ） |

### 構成スイッチ

- **グローバルデフォルト:** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **チャンネル上書きと生成時の自動バインドキー** はアダプター固有です。上記の [スレッド対応チャンネル](#thread-supporting-channels) を参照してください。

現在のアダプター詳細については、[構成リファレンス](/ja-JP/gateway/configuration-reference) と
[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

### 許可リスト

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  明示的な `agentId` でターゲット指定できるエージェント ID のリスト（`["*"]` は任意を許可）。デフォルト: 要求元エージェントのみ。リストを設定し、要求元が `agentId` で自身を生成できるようにしたい場合は、要求元 ID をリストに含めてください。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  要求元エージェントが独自の `subagents.allowAgents` を設定していない場合に使用される、デフォルトのターゲットエージェント許可リスト。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します）。エージェントごとの上書き: `agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway の `agent` アナウンス配信試行に対する呼び出しごとのタイムアウト。値は正の整数ミリ秒で、プラットフォームで安全なタイマー最大値にクランプされます。一時的な再試行により、合計のアナウンス待機時間が設定された 1 回分のタイムアウトより長くなる場合があります。
</ParamField>

要求元セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス外で実行されるターゲットを拒否します。

### 検出

現在 `sessions_spawn` に許可されているエージェント ID を確認するには `agents_list` を使用します。レスポンスには、リストされた各エージェントの有効なモデルと埋め込みランタイムメタデータが含まれるため、呼び出し元は PI、Codex アプリサーバー、その他の設定済みネイティブランタイムを区別できます。

### 自動アーカイブ

- サブエージェントセッションは `agents.defaults.subagents.archiveAfterMinutes`（デフォルト `60`）後に自動的にアーカイブされます。
- アーカイブは `sessions.delete` を使用し、トランスクリプトを `*.deleted.<timestamp>`（同じフォルダー）にリネームします。
- `cleanup: "delete"` はアナウンス直後にアーカイブします（リネームによりトランスクリプトは引き続き保持されます）。
- 自動アーカイブはベストエフォートです。Gateway が再起動すると、保留中のタイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブを行いません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは深さ 1 と深さ 2 のセッションに等しく適用されます。
- ブラウザーのクリーンアップはアーカイブのクリーンアップとは別です。追跡されているブラウザータブ/プロセスは、トランスクリプト/セッションレコードが保持される場合でも、実行終了時にベストエフォートで閉じられます。

## ネストされたサブエージェント

デフォルトでは、サブエージェントは独自のサブエージェントを生成できません
（`maxSpawnDepth: 1`）。1 レベルのネスト、つまり **オーケストレーターパターン** を有効にするには、`maxSpawnDepth: 2` を設定します: メイン → オーケストレーター サブエージェント →
ワーカー サブサブエージェント。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
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

結果はチェーンをさかのぼって戻ります。

1. 深さ 2 のワーカーが終了 → 親（深さ 1 のオーケストレーター）へアナウンスします。
2. 深さ 1 のオーケストレーターがアナウンスを受け取り、結果を合成して終了 → メインへアナウンスします。
3. メインエージェントがアナウンスを受け取り、ユーザーへ配信します。

各レベルは、直接の子からのアナウンスのみを確認します。

<Note>
**運用ガイダンス:** `sessions_list`、`sessions_history`、`/subagents list`、または `exec` の sleep コマンドを中心にポーリングループを構築するのではなく、子作業は一度開始し、完了イベントを待機します。
`sessions_list` と `/subagents list` は、子セッション関係を進行中の作業に集中させます。稼働中の子は接続されたままになり、終了した子は短い直近ウィンドウ内では表示されたままになり、古いストア上だけの子リンクは鮮度ウィンドウを過ぎると無視されます。これにより、再起動後に古い `spawnedBy` /
`parentSessionKey` メタデータが幽霊のような子を復活させることを防ぎます。すでに最終回答を送信した後に子の完了イベントが届いた場合、正しいフォローアップは完全に無言のトークン `NO_REPLY` / `no_reply` です。
</Note>

### 深さごとのツールポリシー

- ロールと制御スコープはスポーン時にセッションメタデータへ書き込まれます。これにより、フラットな、または復元されたセッションキーが誤ってオーケストレーター権限を取り戻すことを防ぎます。
- **深さ 1（`maxSpawnDepth >= 2` の場合のオーケストレーター）:** 子を管理できるように、`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。その他のセッション/システムツールは引き続き拒否されます。
- **深さ 1（`maxSpawnDepth == 1` の場合のリーフ）:** セッションツールなし（現在のデフォルト動作）。
- **深さ 2（リーフワーカー）:** セッションツールなし。`sessions_spawn` は深さ 2 では常に拒否されます。さらに子をスポーンすることはできません。

### エージェントごとのスポーン制限

各エージェントセッション（どの深さでも）は、同時に最大 `maxChildrenPerAgent`
（デフォルト `5`）個までのアクティブな子を持てます。これにより、単一のオーケストレーターからの制御不能なファンアウトを防ぎます。

### カスケード停止

深さ 1 のオーケストレーターを停止すると、その深さ 2 の子もすべて自動的に停止します。

- メインチャットの `/stop` は、すべての深さ 1 エージェントを停止し、その深さ 2 の子へカスケードします。
- `/subagents kill <id>` は、特定のサブエージェントを停止し、その子へカスケードします。
- `/subagents kill all` は、リクエスターのすべてのサブエージェントを停止し、カスケードします。

## 認証

サブエージェントの認証は、セッション種別ではなく **エージェント ID** によって解決されます。

- サブエージェントのセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- 認証ストアはそのエージェントの `agentDir` から読み込まれます。
- メインエージェントの認証プロファイルは **フォールバック** としてマージされます。競合時はエージェントプロファイルがメインプロファイルを上書きします。

マージは追加的なので、メインプロファイルは常にフォールバックとして利用できます。エージェントごとに完全に分離された認証はまだサポートされていません。

## アナウンス

サブエージェントはアナウンスステップを通じて報告します。

- アナウンスステップは、リクエスターセッションではなくサブエージェントセッション内で実行されます。
- サブエージェントが正確に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新のアシスタントテキストが完全に無言のトークン `NO_REPLY` / `no_reply` である場合、以前に可視の進捗があってもアナウンス出力は抑制されます。

配送はリクエスターの深さに依存します。

- トップレベルのリクエスターセッションは、外部配送（`deliver=true`）付きのフォローアップ `agent` 呼び出しを使用します。
- ネストされたリクエスターのサブエージェントセッションは、内部フォローアップ注入（`deliver=false`）を受け取り、オーケストレーターがセッション内で子の結果を合成できるようにします。
- ネストされたリクエスターのサブエージェントセッションがなくなっている場合、利用可能であれば OpenClaw はそのセッションのリクエスターへフォールバックします。

トップレベルのリクエスターセッションでは、完了モードの直接配送はまず、バインド済みの会話/スレッドルートとフック上書きを解決し、その後、リクエスターセッションに保存されたルートから欠けているチャネルターゲットフィールドを埋めます。これにより、完了元がチャネルだけを識別している場合でも、完了は正しいチャット/トピックに保持されます。

ネストされた完了の検出結果を構築する際、子の完了集約は現在のリクエスター実行にスコープされ、以前の実行の古い子出力が現在のアナウンスに漏れ込むのを防ぎます。アナウンス返信は、チャネルアダプターで利用可能な場合、スレッド/トピックのルーティングを保持します。

### アナウンスコンテキスト

アナウンスコンテキストは、安定した内部イベントブロックへ正規化されます。

| フィールド       | ソース                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| ソース         | `subagent` または `cron`                                                                                          |
| セッション ID    | 子セッションキー/ID                                                                                          |
| 種別           | アナウンス種別 + タスクラベル                                                                                    |
| ステータス         | 実行時の結果（`success`、`error`、`timeout`、または `unknown`）から導出。モデルテキストから推測**しません** |
| 結果内容 | 最新の可視アシスタントテキスト。それ以外の場合は、サニタイズ済みの最新ツール/ツール結果テキスト                                |
| フォローアップ      | 返信する場合と沈黙を保つ場合を説明する指示                                                           |

終端失敗実行は、キャプチャした返信テキストを再生せずに失敗ステータスを報告します。タイムアウト時に、子がツール呼び出しまでしか進めなかった場合、アナウンスは未加工のツール出力を再生する代わりに、その履歴を短い部分進捗サマリーへ畳み込めます。

### 統計行

アナウンスペイロードには、末尾に統計行が含まれます（折り返される場合でも）。

- 実行時間（例: `runtime 5m12s`）。
- トークン使用量（入力/出力/合計）。
- モデル料金が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- メインエージェントが `sessions_history` で履歴を取得したり、ディスク上のファイルを検査したりできるようにするための `sessionKey`、`sessionId`、およびトランスクリプトパス。

内部メタデータはオーケストレーション専用です。ユーザー向けの返信は通常のアシスタントの声に書き換えるべきです。

### `sessions_history` を推奨する理由

`sessions_history` は、より安全なオーケストレーション経路です。

- アシスタントのリコールは最初に正規化されます。思考タグが取り除かれ、`<relevant-memories>` / `<relevant_memories>` の足場が取り除かれ、プレーンテキストのツール呼び出し XML ペイロードブロック（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`）が、きれいに閉じられていない切り詰められたペイロードを含めて取り除かれます。また、格下げされたツール呼び出し/結果の足場と履歴コンテキストマーカー、漏洩したモデル制御トークン（`<|assistant|>`、その他の ASCII `<|...|>`、全角 `<｜...｜>`）、不正な MiniMax ツール呼び出し XML も取り除かれます。
- 認証情報/トークンらしきテキストはリダクトされます。
- 長いブロックは切り詰められる場合があります。
- 非常に大きな履歴では、古い行が削除されたり、過大な行が `[sessions_history omitted: message too large]` に置き換えられたりする場合があります。
- 完全にバイト単位で一致するトランスクリプト全体が必要な場合、未加工のディスク上トランスクリプト検査がフォールバックです。

## ツールポリシー

サブエージェントは、まず親またはターゲットエージェントと同じプロファイルおよびツールポリシーパイプラインを使用します。その後、OpenClaw がサブエージェント制限レイヤーを適用します。

制限的な `tools.profile` がない場合、サブエージェントは**セッションツール**とシステムツールを除くすべてのツールを取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

ここでも `sessions_history` は境界付けられ、サニタイズされたリコールビューのままです。未加工のトランスクリプトダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーターサブエージェントは、子を管理できるように追加で `sessions_spawn`、`subagents`、`sessions_list`、および `sessions_history` を受け取ります。

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

`tools.subagents.tools.allow` は最終的な許可のみフィルターです。すでに解決済みのツールセットを狭めることはできますが、`tools.profile` によって削除されたツールを**戻して追加**することはできません。たとえば、`tools.profile: "coding"` には `web_search`/`web_fetch` が含まれますが、`browser` ツールは含まれません。coding プロファイルのサブエージェントがブラウザー自動化を使用できるようにするには、プロファイル段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

ブラウザー自動化を 1 つのエージェントだけに付与したい場合は、エージェントごとの `agents.list[].tools.alsoAllow: ["browser"]` を使用します。

## 並行実行

サブエージェントは専用のプロセス内キューレーンを使用します。

- **レーン名:** `subagent`
- **並行数:** `agents.defaults.subagents.maxConcurrent`（デフォルト `8`）

## 生存性と復旧

OpenClaw は、`endedAt` がないことをサブエージェントがまだ生存している恒久的な証拠として扱いません。古い実行ウィンドウよりも古い未終了実行は、`/subagents list`、ステータスサマリー、子孫完了ゲート、およびセッションごとの並行数チェックでアクティブ/保留としてカウントされなくなります。

Gateway 再起動後、古い未終了の復元実行は、その子セッションに `abortedLastRun: true` が付けられていない限りプルーニングされます。これらの再起動で中断された子セッションは、サブエージェント孤児復旧フローを通じて復旧可能なままで、そこでは中断マーカーをクリアする前に合成再開メッセージが送信されます。

自動再起動復旧は子セッションごとに境界付けられます。同じサブエージェントの子が、高速な再ウェッジウィンドウ内で孤児復旧として繰り返し受け入れられた場合、OpenClaw はそのセッションに復旧トゥームストーンを永続化し、以降の再起動で自動再開しなくなります。タスクレコードを整合させるには `openclaw tasks maintenance --apply` を実行し、トゥームストーン化されたセッションの古い中断復旧フラグをクリアするには `openclaw doctor --fix` を実行します。

<Note>
サブエージェントのスポーンが Gateway `PAIRING_REQUIRED` /
`scope-upgrade` で失敗する場合は、ペアリング状態を編集する前に RPC 呼び出し元を確認してください。内部の `sessions_spawn` 調整は、直接 loopback の共有トークン/パスワード認証を介して、`client.id: "gateway-client"` かつ `client.mode: "backend"` として接続する必要があります。この経路は CLI のペア済みデバイススコープ基準には依存しません。リモート呼び出し元、明示的な `deviceIdentity`、明示的なデバイストークン経路、およびブラウザー/node クライアントでは、スコープアップグレードに通常のデバイス承認が引き続き必要です。
</Note>

## 停止

- リクエスターチャットで `/stop` を送信すると、リクエスターセッションが中断され、そこからスポーンされたアクティブなサブエージェント実行がすべて停止され、ネストされた子へカスケードします。
- `/subagents kill <id>` は、特定のサブエージェントを停止し、その子へカスケードします。

## 制限事項

- サブエージェントのアナウンスは**ベストエフォート**です。Gateway が再起動した場合、保留中の「アナウンスバック」作業は失われます。
- サブエージェントは引き続き同じ Gateway プロセスリソースを共有します。`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントコンテキストは `AGENTS.md`、`TOOLS.md`、`SOUL.md`、`IDENTITY.md`、および `USER.md` のみを注入します（`MEMORY.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は含みません）。
- 最大ネスト深さは 5 です（`maxSpawnDepth` の範囲: 1–5）。ほとんどのユースケースでは深さ 2 が推奨されます。
- `maxChildrenPerAgent` はセッションごとのアクティブな子数を上限設定します（デフォルト `5`、範囲 `1–20`）。

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents)
- [エージェント送信](/ja-JP/tools/agent-send)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
