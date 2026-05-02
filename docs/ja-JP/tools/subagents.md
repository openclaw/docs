---
read_when:
    - エージェント経由でバックグラウンドまたは並列の作業を行いたい場合
    - sessions_spawn またはサブエージェントツールポリシーを変更しています
    - スレッドに紐づいたサブエージェントセッションを実装またはトラブルシューティングする場合
sidebarTitle: Sub-agents
summary: 分離されたバックグラウンドエージェント実行を起動し、結果を依頼元チャットに通知する
title: サブエージェント
x-i18n:
    generated_at: "2026-05-02T21:09:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e964df543bd19435daf94f2c85a34b9d32e07662405d2eac7635935f1e7bf64
    source_path: tools/subagents.md
    workflow: 16
---

サブエージェントは、既存のエージェント実行から生成されるバックグラウンドのエージェント実行です。
それぞれ独自のセッション (`agent:<agentId>:subagent:<uuid>`) で実行され、
完了すると、結果を要求元チャットチャネルへ**通知**します。
各サブエージェント実行は
[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

主な目標:

- メイン実行をブロックせずに「調査 / 長時間タスク / 遅いツール」の作業を並列化する。
- デフォルトでサブエージェントを分離する (セッション分離 + 任意のサンドボックス化)。
- ツールの利用面を誤用しにくく保つ: サブエージェントにはデフォルトでセッションツールを与えない。
- オーケストレーターパターン向けに、設定可能なネスト深度をサポートする。

<Note>
**コストに関する注意:** 各サブエージェントはデフォルトで独自のコンテキストとトークン使用量を持ちます。
重いタスクや反復的なタスクでは、サブエージェントに安価なモデルを設定し、
メインエージェントは高品質なモデルのままにしてください。設定は
`agents.defaults.subagents.model` またはエージェントごとのオーバーライドで行います。子が
    要求元の現在のトランスクリプトを本当に必要とする場合、エージェントはその 1 回の生成で
    `context: "fork"` を要求できます。スレッドバインドされたサブエージェントセッションは、
    現在の会話をフォローアップスレッドへ分岐するため、デフォルトで
    `context: "fork"` になります。
</Note>

## スラッシュコマンド

**現在のセッション**のサブエージェント実行を確認または制御するには、`/subagents` を使います:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` は実行メタデータ (状態、タイムスタンプ、セッション ID、
トランスクリプトパス、クリーンアップ) を表示します。範囲が限定され、
安全性フィルター済みの想起ビューには `sessions_history` を使います。生の完全な
トランスクリプトが必要な場合は、ディスク上のトランスクリプトパスを調べてください。

### スレッドバインディング制御

これらのコマンドは、永続的なスレッドバインディングをサポートするチャネルで動作します。
下の[スレッド対応チャネル](#thread-supporting-channels)を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成時の動作

`/subagents spawn` は、バックグラウンドのサブエージェントをユーザーコマンドとして開始し
(内部リレーではありません)、実行が完了すると最後の完了更新を 1 つ要求元チャットへ送信します。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - 生成コマンドは非ブロッキングです。実行 ID をすぐに返します。
    - 完了時に、サブエージェントは要約/結果メッセージを要求元チャットチャネルへ通知します。
    - 完了はプッシュベースです。生成後は、完了を待つだけの目的で `/subagents list`、`sessions_list`、`sessions_history` をループでポーリングしないでください。状態の確認は、デバッグや介入が必要なときにオンデマンドで行ってください。
    - 完了時、OpenClaw は通知クリーンアップフローを続行する前に、そのサブエージェントセッションが開いた追跡対象のブラウザータブ/プロセスをベストエフォートで閉じます。

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw はまず、安定した冪等性キーを使って直接 `agent` 配信を試みます。
    - 直接配信が失敗した場合は、キュールーティングにフォールバックします。
    - キュールーティングもまだ利用できない場合、通知は最終的に諦める前に短い指数バックオフで再試行されます。
    - 完了配信は解決済みの要求元ルートを保持します。利用可能な場合は、スレッドバインドまたは会話バインドの完了ルートが優先されます。完了の発生元がチャネルしか提供しない場合、OpenClaw は要求元セッションの解決済みルート (`lastChannel` / `lastTo` / `lastAccountId`) から不足しているターゲット/アカウントを補完するため、直接配信は引き続き動作します。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    要求元セッションへの完了ハンドオフは、ランタイム生成の
    内部コンテキスト (ユーザーが作成したテキストではありません) で、以下を含みます:

    - `Result` — 最新の表示可能な `assistant` 返信テキスト。なければ、サニタイズ済みの最新 tool/toolResult テキスト。最終状態が失敗の実行では、取得済み返信テキストを再利用しません。
    - `Status` — 正常に完了 / 失敗 / タイムアウト / 不明。
    - コンパクトなランタイム/トークン統計。
    - 要求元エージェントに、内部メタデータをそのまま転送するのではなく、通常のアシスタントの文体で書き直すよう伝える配信指示。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` と `--thinking` は、その特定の実行に対してデフォルトをオーバーライドします。
    - 完了後に詳細と出力を確認するには、`info`/`log` を使います。
    - `/subagents spawn` は一回限りのモード (`mode: "run"`) です。永続的なスレッドバインドセッションには、`thread: true` と `mode: "session"` を指定して `sessions_spawn` を使います。
    - ACP ハーネスセッション (Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx) では、ツールがそのランタイムを広告している場合に `runtime: "acp"` を指定して `sessions_spawn` を使います。完了やエージェント間ループをデバッグする場合は、[ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model)を参照してください。`codex` Plugin が有効な場合、ユーザーが明示的に ACP/acpx を求めていない限り、Codex のチャット/スレッド制御は ACP より `/codex ...` を優先してください。
    - OpenClaw は、ACP が有効で、要求元がサンドボックス化されておらず、`acpx` などのバックエンド Plugin が読み込まれるまで、`runtime: "acp"` を隠します。`runtime: "acp"` は外部 ACP ハーネス ID、または `runtime.type="acp"` を持つ `agents.list[]` エントリーを想定します。`agents_list` 由来の通常の OpenClaw 設定エージェントには、デフォルトのサブエージェントランタイムを使ってください。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブサブエージェントは、呼び出し元が現在のトランスクリプトのフォークを明示的に求めない限り、分離された状態で開始します。

| モード       | 使用する場面                                                                                                                         | 動作                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新しい調査、独立した実装、遅いツール作業、またはタスク本文で要点を伝えられるもの                           | クリーンな子トランスクリプトを作成します。これがデフォルトで、トークン使用量を抑えます。  |
| `fork`     | 現在の会話、以前のツール結果、または要求元トランスクリプトにすでに含まれている微妙な指示に依存する作業 | 子が開始する前に、要求元トランスクリプトを子セッションへ分岐します。 |

`fork` は控えめに使ってください。これはコンテキストに敏感な委任のためのものであり、
明確なタスクプロンプトを書く代わりではありません。

## ツール: `sessions_spawn`

グローバル `subagent` レーンで `deliver: false` のサブエージェント実行を開始し、
その後に通知ステップを実行して、通知返信を要求元チャットチャネルへ投稿します。

利用可否は、呼び出し元の有効なツールポリシーによって決まります。`coding` と
`full` プロファイルは、デフォルトで `sessions_spawn` を公開します。`messaging` プロファイルは
公開しません。作業を委任する必要があるエージェントには、
`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` を追加するか、`tools.profile: "coding"` を使ってください。
チャネル/グループ、プロバイダー、サンドボックス、エージェントごとの許可/拒否ポリシーにより、
プロファイル段階の後でもツールが削除される場合があります。同じセッションから `/tools` を使って、
有効なツール一覧を確認してください。

**デフォルト:**

- **モデル:** `agents.defaults.subagents.model` (またはエージェントごとの `agents.list[].subagents.model`) を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` は引き続き優先されます。
- **思考:** `agents.defaults.subagents.thinking` (またはエージェントごとの `agents.list[].subagents.thinking`) を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` は引き続き優先されます。
- **実行タイムアウト:** `sessions_spawn.runTimeoutSeconds` が省略された場合、設定されていれば OpenClaw は `agents.defaults.subagents.runTimeoutSeconds` を使います。それ以外の場合は `0` (タイムアウトなし) にフォールバックします。

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
  `acp` は、外部 ACP ハーネス (`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx) と、`runtime.type` が `acp` の `agents.list[]` エントリー専用です。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP のみ。`runtime: "acp"` の場合に既存の ACP ハーネスセッションを再開します。ネイティブサブエージェントの生成では無視されます。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP のみ。`runtime: "acp"` の場合に、ACP 実行出力を親セッションへストリーミングします。ネイティブサブエージェントの生成では省略してください。
</ParamField>
<ParamField path="model" type="string">
  サブエージェントモデルをオーバーライドします。無効な値はスキップされ、サブエージェントはデフォルトモデルで実行され、ツール結果に警告が表示されます。
</ParamField>
<ParamField path="thinking" type="string">
  サブエージェント実行の思考レベルをオーバーライドします。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  設定されている場合は `agents.defaults.subagents.runTimeoutSeconds` がデフォルトになり、それ以外の場合は `0` になります。設定すると、サブエージェント実行は N 秒後に中止されます。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェントセッションにチャネルのスレッドバインディングを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略された場合、デフォルトは `session` になります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` は通知直後にアーカイブします (トランスクリプトはリネームによって引き続き保持されます)。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、対象の子ランタイムがサンドボックス化されていない限り生成を拒否します。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` は要求元の現在のトランスクリプトを子セッションへ分岐します。ネイティブサブエージェントのみ。スレッドバインド生成のデフォルトは `fork`、非スレッド生成のデフォルトは `isolated` です。
</ParamField>

<Warning>
`sessions_spawn` はチャネル配信用パラメーター (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) を受け付けません。
配信には、生成された実行から `message`/`sessions_send` を使ってください。
</Warning>

## スレッドバインドセッション

チャネルでスレッドバインディングが有効な場合、サブエージェントはスレッドにバインドされたままになれるため、
そのスレッド内のフォローアップユーザーメッセージは同じサブエージェントセッションへルーティングされ続けます。

### スレッド対応チャネル

**Discord** は現在唯一のサポート対象チャネルです。永続的なスレッドバインドサブエージェントセッション
(`thread: true` を指定した `sessions_spawn`)、手動のスレッド制御 (`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`)、およびアダプターキー
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, and
`channels.discord.threadBindings.spawnSessions`
をサポートします。

### クイックフロー

<Steps>
  <Step title="Spawn">
    `thread: true` (必要に応じて `mode: "session"` も) を指定して `sessions_spawn`。
  </Step>
  <Step title="Bind">
    OpenClaw は、アクティブチャネルでそのセッションターゲットに対してスレッドを作成またはバインドします。
  </Step>
  <Step title="Route follow-ups">
    そのスレッド内の返信とフォローアップメッセージは、バインド済みセッションへルーティングされます。
  </Step>
  <Step title="Inspect timeouts">
    非アクティブ時の自動アンフォーカスを確認/更新するには `/session idle` を使い、
    ハード上限を制御するには `/session max-age` を使います。
  </Step>
  <Step title="Detach">
    手動で切り離すには `/unfocus` を使います。
  </Step>
</Steps>

### 手動制御

| コマンド           | 効果                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッドをサブエージェント/セッションターゲットにバインドする（または作成する） |
| `/unfocus`         | 現在のバインド済みスレッドのバインドを削除する                              |
| `/agents`          | アクティブな実行とバインド状態（`thread:<id>` または `unbound`）を一覧表示する |
| `/session idle`    | アイドル時の自動フォーカス解除を確認/更新する（フォーカス中のバインド済みスレッドのみ） |
| `/session max-age` | ハード上限を確認/更新する（フォーカス中のバインド済みスレッドのみ）           |

### 設定スイッチ

- **グローバルデフォルト:** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **チャネルの上書きと生成時の自動バインドキー** はアダプター固有です。上記の [スレッド対応チャネル](#thread-supporting-channels) を参照してください。

現在のアダプターの詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference) と
[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

### 許可リスト

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  明示的な `agentId` 経由でターゲットにできるエージェント ID の一覧（`["*"]` は任意を許可）。デフォルト: リクエスターエージェントのみ。一覧を設定し、なおかつリクエスターが `agentId` で自身を生成できるようにしたい場合は、リクエスター ID を一覧に含めてください。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  リクエスターエージェントが独自の `subagents.allowAgents` を設定していない場合に使われるデフォルトのターゲットエージェント許可リスト。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックする（明示的なプロファイル選択を強制）。エージェントごとの上書き: `agents.list[].subagents.requireAgentId`。
</ParamField>

リクエスターセッションがサンドボックス化されている場合、`sessions_spawn` は
サンドボックスなしで実行されるターゲットを拒否します。

### 検出

`sessions_spawn` に現在許可されているエージェント ID を確認するには、`agents_list` を使用します。レスポンスには、一覧に含まれる各エージェントの有効な
モデルと埋め込みランタイムメタデータが含まれるため、呼び出し側は Pi、Codex
アプリサーバー、その他の設定済みネイティブランタイムを区別できます。

### 自動アーカイブ

- サブエージェントセッションは `agents.defaults.subagents.archiveAfterMinutes` 後に自動的にアーカイブされます（デフォルト `60`）。
- アーカイブは `sessions.delete` を使用し、トランスクリプトを `*.deleted.<timestamp>` に名前変更します（同じフォルダー）。
- `cleanup: "delete"` はアナウンス直後にアーカイブします（名前変更によりトランスクリプトは保持します）。
- 自動アーカイブはベストエフォートです。Gateway が再起動すると、保留中のタイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブしません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは深さ 1 と深さ 2 のセッションに同じように適用されます。
- ブラウザーのクリーンアップはアーカイブのクリーンアップとは別です。トラッキングされたブラウザーのタブ/プロセスは、トランスクリプト/セッション記録が保持される場合でも、実行終了時にベストエフォートで閉じられます。

## ネストされたサブエージェント

デフォルトでは、サブエージェントは独自のサブエージェントを生成できません
（`maxSpawnDepth: 1`）。1 レベルのネストを有効にするには `maxSpawnDepth: 2` を設定します。これは **オーケストレーターパターン** です: メイン → オーケストレーターサブエージェント →
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

| 深さ | セッションキーの形状                         | 役割                                          | 生成可能か                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | メインエージェント                            | 常に可能                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | サブエージェント（深さ 2 が許可される場合はオーケストレーター） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（リーフワーカー）        | 不可                         |

### アナウンスチェーン

結果はチェーンを上方向に流れます。

1. 深さ 2 のワーカーが終了 → 親（深さ 1 のオーケストレーター）にアナウンスします。
2. 深さ 1 のオーケストレーターがアナウンスを受け取り、結果を合成して終了 → メインにアナウンスします。
3. メインエージェントがアナウンスを受け取り、ユーザーに配信します。

各レベルは、直接の子からのアナウンスだけを認識します。

<Note>
**運用ガイダンス:** `sessions_list`、
`sessions_history`、`/subagents list`、または `exec` の sleep コマンドの周囲にポーリングループを構築するのではなく、子の作業を一度開始して完了
イベントを待機してください。
`sessions_list` と `/subagents list` は、子セッションの関係を
ライブ作業に集中させます。ライブの子は接続されたまま、終了した子は
短い最近ウィンドウの間だけ表示され、古いストアのみの子リンクは
鮮度ウィンドウ後に無視されます。これにより、再起動後に古い `spawnedBy` /
`parentSessionKey` メタデータが幽霊の子を復活させることを防ぎます。すでに
最終回答を送信した後に子の完了イベントが届いた場合、正しいフォローアップは正確なサイレントトークン
`NO_REPLY` / `no_reply` です。
</Note>

### 深さ別ツールポリシー

- 役割と制御スコープは生成時にセッションメタデータへ書き込まれます。これにより、フラットなセッションキーや復元されたセッションキーが誤ってオーケストレーター権限を取り戻すことを防ぎます。
- **深さ 1（`maxSpawnDepth >= 2` の場合のオーケストレーター）:** 子を管理できるように `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。その他のセッション/システムツールは拒否されたままです。
- **深さ 1（`maxSpawnDepth == 1` の場合のリーフ）:** セッションツールはありません（現在のデフォルト動作）。
- **深さ 2（リーフワーカー）:** セッションツールはありません。深さ 2 では `sessions_spawn` は常に拒否されます。さらに子を生成することはできません。

### エージェントごとの生成制限

各エージェントセッション（任意の深さ）は、同時に最大 `maxChildrenPerAgent`
（デフォルト `5`）個のアクティブな子を持てます。これにより、単一のオーケストレーターからの制御不能なファンアウトを防ぎます。

### カスケード停止

深さ 1 のオーケストレーターを停止すると、そのすべての深さ 2 の
子も自動的に停止します。

- メインチャットの `/stop` はすべての深さ 1 エージェントを停止し、それらの深さ 2 の子にカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子にカスケードします。
- `/subagents kill all` はリクエスターのすべてのサブエージェントを停止し、カスケードします。

## 認証

サブエージェントの認証は、セッションタイプではなく **エージェント ID** によって解決されます。

- サブエージェントのセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- 認証ストアはそのエージェントの `agentDir` から読み込まれます。
- メインエージェントの認証プロファイルは **フォールバック** としてマージされます。競合時はエージェントプロファイルがメインプロファイルを上書きします。

マージは追加式なので、メインプロファイルは常にフォールバックとして利用できます。エージェントごとの完全に分離された認証はまだサポートされていません。

## アナウンス

サブエージェントはアナウンスステップ経由で報告します。

- アナウンスステップは、リクエスターセッションではなくサブエージェントセッション内で実行されます。
- サブエージェントが正確に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新のアシスタントテキストが正確なサイレントトークン `NO_REPLY` / `no_reply` の場合、以前に表示可能な進捗が存在していてもアナウンス出力は抑制されます。

配信はリクエスターの深さによって異なります。

- トップレベルのリクエスターセッションは、外部配信（`deliver=true`）を伴う後続の `agent` 呼び出しを使用します。
- ネストされたリクエスターサブエージェントセッションは、内部のフォローアップ注入（`deliver=false`）を受け取るため、オーケストレーターは子の結果をセッション内で合成できます。
- ネストされたリクエスターサブエージェントセッションが存在しない場合、OpenClaw は利用可能であればそのセッションのリクエスターにフォールバックします。

トップレベルのリクエスターセッションでは、完了モードの直接配信はまず
バインド済みの会話/スレッドルートとフック上書きを解決し、その後
不足しているチャネルターゲットフィールドをリクエスターセッションの保存済みルートから埋めます。
これにより、完了の発生元がチャネルだけを識別している場合でも、完了が正しいチャット/トピックに保たれます。

ネストされた完了結果を構築するとき、子の完了集約は現在のリクエスター実行にスコープされるため、古い以前の実行の子
出力が現在のアナウンスに漏れることを防ぎます。アナウンス返信は、
チャネルアダプターで利用可能な場合、スレッド/トピックのルーティングを保持します。

### アナウンスコンテキスト

アナウンスコンテキストは、安定した内部イベントブロックに正規化されます。

| フィールド     | ソース                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| ソース         | `subagent` または `cron`                                                                                      |
| セッション ID  | 子セッションキー/ID                                                                                          |
| 種類           | アナウンス種別 + タスクラベル                                                                                 |
| ステータス     | ランタイム結果（`success`、`error`、`timeout`、または `unknown`）から派生。モデルテキストからは推測されません |
| 結果内容       | 最新の表示可能なアシスタントテキスト。なければサニタイズ済みの最新ツール/`toolResult` テキスト                |
| フォローアップ | 返信すべき場合と沈黙すべき場合を説明する指示                                                                 |

終端で失敗した実行は、キャプチャされた返信テキストを再生せずに
失敗ステータスを報告します。タイムアウト時に子がツール呼び出しまでしか到達していない場合、アナウンスは
生のツール出力を再生する代わりに、その履歴を短い部分進捗サマリーへ圧縮できます。

### 統計行

アナウンスペイロードには末尾に統計行が含まれます（折り返されている場合でも）。

- ランタイム（例: `runtime 5m12s`）。
- トークン使用量（入力/出力/合計）。
- モデル価格が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- メインエージェントが `sessions_history` 経由で履歴を取得するかディスク上のファイルを調査できるようにするための、`sessionKey`、`sessionId`、およびトランスクリプトパス。

内部メタデータはオーケストレーション専用です。ユーザー向けの返信は通常のアシスタントの声に書き換えるべきです。

### `sessions_history` を推奨する理由

`sessions_history` はより安全なオーケストレーション経路です。

- アシスタントのリコールが最初に正規化されます。thinking タグは除去されます。`<relevant-memories>` / `<relevant_memories>` の足場は除去されます。プレーンテキストのツール呼び出し XML ペイロードブロック（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`）は、きれいに閉じていない切り詰められたペイロードも含めて除去されます。格下げされたツール呼び出し/結果の足場と履歴コンテキストマーカーは除去されます。漏出したモデル制御トークン（`<|assistant|>`、その他の ASCII `<|...|>`、全角 `<｜...｜>`）は除去されます。不正な MiniMax ツール呼び出し XML は除去されます。
- 認証情報/トークンのようなテキストは墨消しされます。
- 長いブロックは切り詰められることがあります。
- 非常に大きい履歴では、古い行を落とすか、過大な行を `[sessions_history omitted: message too large]` に置き換えることがあります。
- バイト単位で完全なトランスクリプトが必要な場合は、ディスク上の生トランスクリプトの調査がフォールバックです。

## ツールポリシー

サブエージェントは、まず親またはターゲットエージェントと同じプロファイルとツールポリシーパイプラインを使用します。その後、OpenClaw がサブエージェント制限レイヤーを適用します。

制限的な `tools.profile` がない場合、サブエージェントは **セッションツール** とシステムツールを除くすべてのツールを取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` はここでも、境界付きでサニタイズされたリコールビューのままです。
生のトランスクリプトダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーターサブエージェントは、子を管理できるように
`sessions_spawn`、`subagents`、`sessions_list`、および
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

`tools.subagents.tools.allow` は最終的な許可専用フィルターです。すでに解決済みのツールセットを絞り込めますが、`tools.profile` によって削除されたツールを**追加し直す**ことはできません。たとえば、`tools.profile: "coding"` には `web_search`/`web_fetch` が含まれますが、`browser` ツールは含まれません。coding プロファイルのサブエージェントにブラウザー自動化を使わせるには、プロファイル段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

1 つのエージェントだけにブラウザー自動化を付与する場合は、エージェントごとの `agents.list[].tools.alsoAllow: ["browser"]` を使います。

## 並行性

サブエージェントは、専用のプロセス内キューレーンを使います。

- **レーン名:** `subagent`
- **並行数:** `agents.defaults.subagents.maxConcurrent` (デフォルトは `8`)

## 生存性と回復

OpenClaw は、`endedAt` がないことを、サブエージェントがまだ生存している永続的な証拠として扱いません。stale-run ウィンドウより古い未終了の実行は、`/subagents list`、ステータス要約、子孫完了ゲート、セッションごとの並行性チェックで active/pending としてカウントされなくなります。

Gateway の再起動後、復元された古い未終了の実行は、その子セッションが `abortedLastRun: true` としてマークされていない限り枝刈りされます。これらの再起動で中断された子セッションは、サブエージェントの孤立回復フローを通じて回復可能なままです。このフローは、中断マーカーをクリアする前に合成 resume メッセージを送信します。

自動再起動回復は子セッションごとに制限されます。同じサブエージェントの子が rapid re-wedge ウィンドウ内で繰り返し孤立回復に受理された場合、OpenClaw はそのセッションに回復 tombstone を永続化し、以後の再起動では自動 resume を停止します。タスクレコードを調整するには `openclaw tasks maintenance --apply` を実行し、tombstone 付きセッション上の古い中断回復フラグをクリアするには `openclaw doctor --fix` を実行します。

<Note>
サブエージェントの spawn が Gateway `PAIRING_REQUIRED` / `scope-upgrade` で失敗する場合は、ペアリング状態を編集する前に RPC 呼び出し元を確認してください。内部の `sessions_spawn` 調整は、直接のループバック共有トークン/パスワード認証を介して `client.id: "gateway-client"`、`client.mode: "backend"` として接続する必要があります。この経路は CLI のペアリング済みデバイス scope ベースラインに依存しません。リモート呼び出し元、明示的な `deviceIdentity`、明示的なデバイストークン経路、browser/node クライアントでは、scope アップグレードに通常のデバイス承認が引き続き必要です。
</Note>

## 停止

- リクエスターのチャットで `/stop` を送信すると、リクエスターセッションが中断され、そこから spawn された active なサブエージェント実行が停止し、ネストされた子にもカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子にもカスケードします。

## 制限

- サブエージェントのアナウンスは**ベストエフォート**です。gateway が再起動すると、保留中の「announce back」作業は失われます。
- サブエージェントは引き続き同じ gateway プロセスのリソースを共有します。`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントのコンテキストには `AGENTS.md` + `TOOLS.md` のみが注入されます (`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は含まれません)。
- 最大ネスト深度は 5 です (`maxSpawnDepth` の範囲: 1–5)。ほとんどのユースケースでは深度 2 が推奨されます。
- `maxChildrenPerAgent` はセッションごとの active な子の上限を設定します (デフォルトは `5`、範囲は `1–20`)。

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents)
- [エージェント送信](/ja-JP/tools/agent-send)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [マルチエージェント サンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
