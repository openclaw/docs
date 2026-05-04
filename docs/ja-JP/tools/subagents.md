---
read_when:
    - エージェント経由でバックグラウンド作業または並列作業を行いたい場合
    - sessions_spawn またはサブエージェントツールポリシーを変更しています
    - スレッドに紐づくサブエージェントセッションを実装またはトラブルシューティングしている
sidebarTitle: Sub-agents
summary: 結果を依頼者のチャットへ通知する、分離されたバックグラウンドエージェント実行を起動します
title: サブエージェント
x-i18n:
    generated_at: "2026-05-04T07:04:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65d60bf6813d667b7311aa28109d4bd6be012a16e638c64cfff130831db88cd8
    source_path: tools/subagents.md
    workflow: 16
---

サブエージェントは、既存のエージェント実行から生成されるバックグラウンドのエージェント実行です。
それらは独自のセッション（`agent:<agentId>:subagent:<uuid>`）で実行され、
完了すると、その結果をリクエスト元のチャットチャネルへ**通知**します。
各サブエージェント実行は
[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

主な目標:

- メイン実行をブロックせずに、「調査 / 長時間タスク / 遅いツール」の作業を並列化する。
- サブエージェントをデフォルトで分離したままにする（セッション分離 + 任意のサンドボックス化）。
- ツール面を誤用しにくく保つ: サブエージェントはデフォルトではセッションツールを取得しない。
- オーケストレーターパターン向けに、設定可能なネスト深度をサポートする。

<Note>
**コストに関する注意:** 各サブエージェントは、デフォルトで独自のコンテキストとトークン使用量を持ちます。重いタスクや反復的なタスクでは、サブエージェントにより安価なモデルを設定し、メインエージェントは高品質なモデルのままにしてください。`agents.defaults.subagents.model` またはエージェントごとの上書きで設定します。子がリクエスト元の現在のトランスクリプトを本当に必要とする場合、エージェントはその 1 回の生成で `context: "fork"` をリクエストできます。スレッドに紐づくサブエージェントセッションは、現在の会話をフォローアップスレッドへ分岐するため、デフォルトで `context: "fork"` になります。
</Note>

## スラッシュコマンド

**現在のセッション**のサブエージェント実行を確認または制御するには、`/subagents` を使用します。

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

現在のリクエスト元セッションのアクティブな実行を誘導するには、トップレベルの [`/steer <message>`](/ja-JP/tools/steer) を使用します。対象が子実行の場合は、`/subagents steer <id|#> <message>` を使用します。

`/subagents info` は実行メタデータ（ステータス、タイムスタンプ、セッション ID、トランスクリプトパス、クリーンアップ）を表示します。境界付きで安全性フィルター済みの想起ビューには `sessions_history` を使用し、生の完全なトランスクリプトが必要な場合はディスク上のトランスクリプトパスを確認してください。

### スレッド紐づけ制御

これらのコマンドは、永続的なスレッド紐づけをサポートするチャネルで機能します。下の[スレッド対応チャネル](#thread-supporting-channels)を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成時の動作

`/subagents spawn` は、バックグラウンドのサブエージェントを（内部リレーではなく）ユーザーコマンドとして開始し、実行が完了したときにリクエスト元チャットへ最後の完了更新を 1 回送信します。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - spawn コマンドは非ブロッキングで、実行 ID を即座に返します。
    - 完了時に、サブエージェントは要約/結果メッセージをリクエスト元のチャットチャネルへ通知します。
    - 完了はプッシュベースです。生成後は、完了を待つためだけに `/subagents list`、`sessions_list`、`sessions_history` をループでポーリングしないでください。ステータス確認は、デバッグや介入が必要な場合にオンデマンドでのみ行ってください。
    - 完了時に、OpenClaw は通知クリーンアップフローが続行される前に、そのサブエージェントセッションが開いた追跡対象のブラウザータブ/プロセスをベストエフォートで閉じます。

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw はまず、安定した冪等性キーを使って直接 `agent` 配信を試行します。
    - リクエスト元エージェントの完了ターンが失敗する、可視出力を生成しない、またはキャプチャされた子の結果の明らかに不完全な接頭部分を返す場合、OpenClaw はキャプチャされた子の結果から直接完了配信するフォールバックを行います。
    - 直接配信を使用できない場合は、キュールーティングへフォールバックします。
    - キュールーティングもまだ利用できない場合、最終的に諦める前に、通知は短い指数バックオフで再試行されます。
    - 完了配信は、解決済みのリクエスト元ルートを維持します。スレッド紐づけまたは会話紐づけの完了ルートが利用可能な場合はそれらが優先されます。完了の起点がチャネルしか提供しない場合、OpenClaw はリクエスト元セッションの解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足している対象/アカウントを補完し、直接配信が引き続き機能するようにします。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    リクエスト元セッションへの完了ハンドオフは、ランタイム生成の内部コンテキスト（ユーザーが作成したテキストではありません）であり、以下を含みます。

    - `Result` — 最新の可視 `assistant` 返信テキスト。なければ、サニタイズ済みの最新 tool/toolResult テキスト。終了済みの失敗実行では、キャプチャされた返信テキストは再利用されません。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - コンパクトなランタイム/トークン統計。
    - リクエスト元エージェントに、通常のアシスタントの声で書き直す（生の内部メタデータを転送しない）よう指示する配信指示。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` と `--thinking` は、その特定の実行のデフォルトを上書きします。
    - 完了後に詳細と出力を調べるには `info`/`log` を使用します。
    - `/subagents spawn` はワンショットモード（`mode: "run"`）です。永続的なスレッド紐付けセッションには、`thread: true` と `mode: "session"` を指定して `sessions_spawn` を使用します。
    - ACP ハーネスセッション（Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx）では、ツールがそのランタイムを通知している場合に `runtime: "acp"` を指定して `sessions_spawn` を使用します。完了やエージェント間ループをデバッグする場合は、[ACP 配信モデル](/ja-JP/tools/acp-agents#delivery-model) を参照してください。`codex` plugin が有効な場合、ユーザーが明示的に ACP/acpx を求めない限り、Codex のチャット/スレッド制御では ACP より `/codex ...` を優先してください。
    - OpenClaw は、ACP が有効で、リクエスターがサンドボックス化されておらず、`acpx` などのバックエンド plugin が読み込まれるまで、`runtime: "acp"` を非表示にします。`runtime: "acp"` は外部 ACP ハーネス ID、または `runtime.type="acp"` を持つ `agents.list[]` エントリを想定します。`agents_list` の通常の OpenClaw 設定エージェントには、デフォルトのサブエージェントランタイムを使用します。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブサブエージェントは、呼び出し元が現在のトランスクリプトのフォークを明示的に要求しない限り、分離された状態で開始します。

| モード       | 使用する場面                                                                                                                         | 動作                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規調査、独立した実装、時間のかかるツール作業、またはタスク本文で説明できるもの                           | クリーンな子トランスクリプトを作成します。これがデフォルトで、トークン使用量を抑えます。  |
| `fork`     | 現在の会話、以前のツール結果、またはリクエスターのトランスクリプトにすでに存在する細かな指示に依存する作業 | 子が開始する前に、リクエスターのトランスクリプトを子セッションへ分岐します。 |

`fork` は控えめに使用してください。これはコンテキスト依存の委任のためのものであり、明確なタスクプロンプトを書くことの代替ではありません。

## ツール: `sessions_spawn`

グローバル `subagent` レーンで `deliver: false` のサブエージェント実行を開始し、その後アナウンス手順を実行して、アナウンスの返信をリクエスターのチャットチャネルに投稿します。

利用可否は、呼び出し元の実効ツールポリシーによって異なります。`coding` と `full` プロファイルは、デフォルトで `sessions_spawn` を公開します。`messaging` プロファイルは公開しません。作業を委任すべきエージェントには、`tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]` を追加するか、`tools.profile: "coding"` を使用します。チャネル/グループ、プロバイダー、サンドボックス、エージェントごとの許可/拒否ポリシーによって、プロファイル段階の後でもツールが削除されることがあります。同じセッションから `/tools` を使用して、実効ツール一覧を確認してください。

**デフォルト:**

- **モデル:** `agents.defaults.subagents.model`（またはエージェントごとの `agents.list[].subagents.model`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` は引き続き優先されます。
- **Thinking:** `agents.defaults.subagents.thinking`（またはエージェントごとの `agents.list[].subagents.thinking`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` は引き続き優先されます。
- **実行タイムアウト:** `sessions_spawn.runTimeoutSeconds` が省略された場合、OpenClaw は設定されていれば `agents.defaults.subagents.runTimeoutSeconds` を使用します。それ以外の場合は `0`（タイムアウトなし）にフォールバックします。

### ツールパラメーター

<ParamField path="task" type="string" required>
  サブエージェントのタスク説明。
</ParamField>
<ParamField path="label" type="string">
  任意の人間が読めるラベル。
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` で許可されている場合、別のエージェント ID の下でスポーンします。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` は、外部 ACP ハーネス（`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx）と、`runtime.type` が `acp` の `agents.list[]` エントリ専用です。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP 専用。`runtime: "acp"` の場合に既存の ACP ハーネスセッションを再開します。ネイティブサブエージェントのスポーンでは無視されます。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP 専用。`runtime: "acp"` の場合に ACP 実行出力を親セッションにストリーミングします。ネイティブサブエージェントのスポーンでは省略します。
</ParamField>
<ParamField path="model" type="string">
  サブエージェントのモデルを上書きします。無効な値はスキップされ、サブエージェントはデフォルトモデルで実行され、ツール結果に警告が表示されます。
</ParamField>
<ParamField path="thinking" type="string">
  サブエージェント実行の thinking レベルを上書きします。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  設定されている場合は `agents.defaults.subagents.runTimeoutSeconds` がデフォルトになり、それ以外の場合は `0` です。設定すると、サブエージェント実行は N 秒後に中止されます。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェントセッションにチャネルスレッド紐付けを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略されている場合、デフォルトは `session` になります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` はアナウンス直後にアーカイブします（リネームによりトランスクリプトは保持されます）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、対象の子ランタイムがサンドボックス化されていない限りスポーンを拒否します。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` は、リクエスターの現在のトランスクリプトを子セッションへ分岐します。ネイティブサブエージェント専用です。スレッド紐付けスポーンはデフォルトで `fork`、非スレッドスポーンはデフォルトで `isolated` になります。
</ParamField>

<Warning>
`sessions_spawn` は、チャネル配信パラメーター（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、スポーンされた実行から `message`/`sessions_send` を使用します。
</Warning>

## スレッド紐付けセッション

チャネルでスレッド紐付けが有効な場合、サブエージェントはスレッドに紐付いたままでいられるため、そのスレッド内の後続ユーザーメッセージは同じサブエージェントセッションにルーティングされ続けます。

### スレッド対応チャネル

**Discord** は現在唯一の対応チャネルです。永続的なスレッド紐付けサブエージェントセッション（`thread: true` を指定した `sessions_spawn`）、手動スレッド制御（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）、およびアダプターキー `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`、`channels.discord.threadBindings.spawnSessions` をサポートします。

### クイックフロー

<Steps>
  <Step title="Spawn">
    `sessions_spawn` を `thread: true`（および任意で `mode: "session"`）付きで使用します。
  </Step>
  <Step title="Bind">
    OpenClaw はアクティブなチャネル内で、そのセッションターゲットにスレッドを作成またはバインドします。
  </Step>
  <Step title="Route follow-ups">
    そのスレッド内の返信とフォローアップメッセージは、バインドされたセッションにルーティングされます。
  </Step>
  <Step title="Inspect timeouts">
    `/session idle` を使用して、非アクティブ時の自動アンフォーカスを確認/更新し、
    `/session max-age` でハード上限を制御します。
  </Step>
  <Step title="Detach">
    `/unfocus` を使用して手動で切り離します。
  </Step>
</Steps>

### 手動制御

| コマンド           | 効果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッドをサブエージェント/セッションターゲットにバインドします（または作成します） |
| `/unfocus`         | 現在バインドされているスレッドのバインドを削除します                  |
| `/agents`          | アクティブな実行とバインド状態（`thread:<id>` または `unbound`）を一覧表示します |
| `/session idle`    | アイドル時の自動アンフォーカスを確認/更新します（フォーカス中のバインド済みスレッドのみ） |
| `/session max-age` | ハード上限を確認/更新します（フォーカス中のバインド済みスレッドのみ） |

### 設定スイッチ

- **グローバル既定値:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **チャネルのオーバーライドとスポーン時の自動バインドキー** はアダプター固有です。上記の [スレッド対応チャネル](#thread-supporting-channels) を参照してください。

現在のアダプター詳細については、[設定リファレンス](/ja-JP/gateway/configuration-reference) と
[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

### 許可リスト

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  明示的な `agentId`（`["*"]` は任意を許可）でターゲットにできるエージェント ID の一覧です。既定値: リクエスターエージェントのみ。一覧を設定し、それでもリクエスターが `agentId` で自分自身をスポーンできるようにしたい場合は、リクエスター ID を一覧に含めます。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  リクエスターエージェントが独自の `subagents.allowAgents` を設定していない場合に使用される、既定のターゲットエージェント許可リストです。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します）。エージェント単位のオーバーライド: `agents.list[].subagents.requireAgentId`.
</ParamField>

リクエスターセッションがサンドボックス化されている場合、`sessions_spawn` は
サンドボックスなしで実行されるターゲットを拒否します。

### 検出

`sessions_spawn` に現在許可されているエージェント ID を確認するには、`agents_list` を使用します。レスポンスには、一覧に含まれる各エージェントの有効な
モデルと埋め込みランタイムメタデータが含まれるため、呼び出し元は PI、Codex
アプリサーバー、その他の設定済みネイティブランタイムを区別できます。

### 自動アーカイブ

- サブエージェントセッションは、`agents.defaults.subagents.archiveAfterMinutes`（既定値 `60`）の後に自動的にアーカイブされます。
- アーカイブは `sessions.delete` を使用し、トランスクリプトを `*.deleted.<timestamp>` にリネームします（同じフォルダー）。
- `cleanup: "delete"` は announce の直後にアーカイブします（リネームによってトランスクリプトは保持されます）。
- 自動アーカイブはベストエフォートです。Gateway が再起動すると保留中のタイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブしません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは depth-1 と depth-2 のセッションに同様に適用されます。
- ブラウザーのクリーンアップはアーカイブのクリーンアップとは別です。追跡されているブラウザータブ/プロセスは、トランスクリプト/セッションレコードが保持される場合でも、実行終了時にベストエフォートで閉じられます。

## ネストされたサブエージェント

既定では、サブエージェントは自分自身のサブエージェントをスポーンできません
（`maxSpawnDepth: 1`）。1 レベルのネストを有効にするには `maxSpawnDepth: 2` を設定します — **オーケストレーターパターン**: メイン → オーケストレーターサブエージェント →
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

| 深さ | セッションキーの形式                         | 役割                                          | スポーン可能か                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | メインエージェント                            | 常に可能                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | サブエージェント（深さ 2 が許可されている場合はオーケストレーター） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（リーフワーカー）        | 不可                         |

### announce チェーン

結果はチェーンを上方向に戻ります。

1. depth-2 ワーカーが完了 → 親（depth-1 オーケストレーター）に announce します。
2. depth-1 オーケストレーターが announce を受け取り、結果を統合して完了 → メインに announce します。
3. メインエージェントが announce を受け取り、ユーザーに配信します。

各レベルは、直接の子からの announce のみを確認します。

<Note>
**運用ガイダンス:** 子の作業は一度だけ開始し、`sessions_list`、
`sessions_history`、`/subagents list`、または `exec` の sleep コマンドの周りにポーリングループを構築するのではなく、完了イベントを待ちます。
`sessions_list` と `/subagents list` は、子セッションの関係を
ライブ作業に集中させます。ライブの子は接続されたまま、終了した子は短い最近のウィンドウ内で表示されたままになり、古いストア専用の子リンクは鮮度ウィンドウ後に無視されます。これにより、再起動後に古い `spawnedBy` /
`parentSessionKey` メタデータがゴーストの子を復活させることを防ぎます。最終回答を送信した後に子の完了イベントが到着した場合、正しいフォローアップは正確なサイレントトークン
`NO_REPLY` / `no_reply` です。
</Note>

### 深さごとのツールポリシー

- 役割と制御スコープはスポーン時にセッションメタデータへ書き込まれます。これにより、フラットまたは復元されたセッションキーが誤ってオーケストレーター権限を取り戻すことを防ぎます。
- **深さ 1（`maxSpawnDepth >= 2` の場合のオーケストレーター）:** 子を管理できるように、`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。その他のセッション/システムツールは拒否されたままです。
- **深さ 1（`maxSpawnDepth == 1` の場合のリーフ）:** セッションツールはありません（現在の既定動作）。
- **深さ 2（リーフワーカー）:** セッションツールはありません — `sessions_spawn` は深さ 2 では常に拒否されます。それ以上の子をスポーンすることはできません。

### エージェント単位のスポーン上限

各エージェントセッション（任意の深さ）は、同時に最大 `maxChildrenPerAgent`
（既定値 `5`）個のアクティブな子を持つことができます。これにより、単一のオーケストレーターからの制御不能なファンアウトを防ぎます。

### カスケード停止

depth-1 オーケストレーターを停止すると、そのすべての depth-2
の子が自動的に停止します。

- メインチャットで `/stop` を実行すると、すべての depth-1 エージェントが停止し、その depth-2 の子へカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子へカスケードします。
- `/subagents kill all` はリクエスターのすべてのサブエージェントを停止し、カスケードします。

## 認証

サブエージェントの認証はセッションタイプではなく **エージェント ID** によって解決されます。

- サブエージェントセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- 認証ストアはそのエージェントの `agentDir` から読み込まれます。
- メインエージェントの認証プロファイルは **フォールバック** としてマージされます。競合時にはエージェントプロファイルがメインプロファイルを上書きします。

マージは加算的であるため、メインプロファイルは常にフォールバックとして利用できます。エージェント単位で完全に分離された認証はまだサポートされていません。

## Announce

サブエージェントは announce ステップを介して報告します。

- announce ステップは（リクエスターセッションではなく）サブエージェントセッション内で実行されます。
- サブエージェントが正確に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新のアシスタントテキストが正確なサイレントトークン `NO_REPLY` / `no_reply` の場合、それ以前に表示される進捗があっても announce 出力は抑制されます。

配信はリクエスターの深さによって異なります。

- トップレベルのリクエスターセッションは、外部配信（`deliver=true`）付きのフォローアップ `agent` 呼び出しを使用します。
- ネストされたリクエスターサブエージェントセッションは、内部フォローアップ注入（`deliver=false`）を受け取り、オーケストレーターが子の結果をセッション内で統合できるようにします。
- ネストされたリクエスターサブエージェントセッションが存在しない場合、OpenClaw は利用可能であればそのセッションのリクエスターにフォールバックします。

トップレベルのリクエスターセッションでは、完了モードの直接配信はまず
バインド済みの会話/スレッドルートとフックのオーバーライドを解決し、その後
リクエスターセッションに保存されたルートから不足しているチャネルターゲットフィールドを埋めます。
これにより、完了元がチャネルのみを識別する場合でも、完了が正しいチャット/トピックに保持されます。

ネストされた完了の所見を構築するとき、子の完了集約は現在のリクエスター実行にスコープされるため、以前の実行の古い子出力が現在の announce に漏れ込むことを防ぎます。announce の返信は、チャネルアダプターで利用可能な場合、スレッド/トピックのルーティングを保持します。

### Announce コンテキスト

Announce コンテキストは、安定した内部イベントブロックに正規化されます。

| フィールド     | ソース                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| ソース         | `subagent` または `cron`                                                                                      |
| セッション ID  | 子セッションキー/ID                                                                                           |
| タイプ         | announce タイプ + タスクラベル                                                                                |
| ステータス     | ランタイム結果（`success`、`error`、`timeout`、または `unknown`）から派生 — モデルテキストからは推定**しません** |
| 結果コンテンツ | 最新の表示可能なアシスタントテキスト。なければ、サニタイズされた最新のツール/toolResult テキスト              |
| フォローアップ | いつ返信し、いつサイレントのままでいるかを説明する指示                                                       |

端末の失敗した実行は、キャプチャされた返信テキストを再生せずに
失敗ステータスを報告します。タイムアウト時に子がツール呼び出しまでしか進んでいない場合、announce は生のツール出力を再生する代わりに、その履歴を短い部分進捗サマリーに折りたたむことができます。

### 統計行

Announce ペイロードには、末尾に統計行が含まれます（折り返されている場合でも）。

- ランタイム（例: `runtime 5m12s`）。
- トークン使用量（入力/出力/合計）。
- モデル価格が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- メインエージェントが `sessions_history` で履歴を取得したり、ディスク上のファイルを調べたりできるようにするための、`sessionKey`、`sessionId`、トランスクリプトパス。

内部メタデータはオーケストレーション専用です。ユーザー向けの返信は通常のアシスタントの声に書き直すべきです。

### `sessions_history` を推奨する理由

`sessions_history` はより安全なオーケストレーション経路です。

- アシスタントのリコールは最初に正規化されます。thinking タグが削除され、`<relevant-memories>` / `<relevant_memories>` の足場が削除され、プレーンテキストのツール呼び出し XML ペイロードブロック（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`）が、正常に閉じていない切り詰められたペイロードを含めて削除され、ダウングレードされたツール呼び出し/結果の足場と履歴コンテキストマーカーが削除され、漏えいしたモデル制御トークン（`<|assistant|>`、その他の ASCII `<|...|>`、全角 `<｜...｜>`）が削除され、不正な MiniMax ツール呼び出し XML が削除されます。
- 認証情報/トークンのようなテキストはリダクトされます。
- 長いブロックは切り詰められることがあります。
- 非常に大きな履歴では、古い行を削除したり、過大な行を `[sessions_history omitted: message too large]` に置き換えたりできます。
- バイト単位で完全なトランスクリプトが必要な場合は、ディスク上の生トランスクリプト検査がフォールバックです。

## ツールポリシー

サブエージェントは、まず親または対象エージェントと同じプロファイルおよびツールポリシーパイプラインを使用します。その後、OpenClaw がサブエージェント制限レイヤーを適用します。

制限的な `tools.profile` がない場合、サブエージェントは**セッションツールを除くすべてのツール**とシステムツールを取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` はここでも境界付きでサニタイズされた想起ビューのままです。生のトランスクリプトダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーターサブエージェントは、子を管理できるように `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` も追加で受け取ります。

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

`tools.subagents.tools.allow` は最終的な許可専用フィルターです。すでに解決済みのツールセットを狭めることはできますが、`tools.profile` によって削除されたツールを**追加し直す**ことはできません。たとえば、`tools.profile: "coding"` には `web_search`/`web_fetch` が含まれますが、`browser` ツールは含まれません。coding プロファイルのサブエージェントにブラウザー自動化を使わせるには、プロファイル段階で browser を追加します。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

1 つのエージェントだけにブラウザー自動化を与える場合は、エージェント単位の `agents.list[].tools.alsoAllow: ["browser"]` を使用します。

## 並行処理

サブエージェントは専用のインプロセスキューレーンを使用します。

- **レーン名:** `subagent`
- **並行数:** `agents.defaults.subagents.maxConcurrent`（既定値 `8`）

## ライブネスと復旧

OpenClaw は、`endedAt` が存在しないことを、サブエージェントがまだ生存している恒久的な証拠として扱いません。stale-run ウィンドウより古い未終了の実行は、`/subagents list`、ステータス要約、子孫の完了ゲート、セッション単位の並行処理チェックで active/pending として数えられなくなります。

Gateway の再起動後、古い未終了の復元済み実行は、その子セッションが `abortedLastRun: true` とマークされていない限り、削除されます。これらの再起動で中断された子セッションは、サブエージェントの孤立復旧フローを通じて復旧可能なままです。このフローは、中断マーカーをクリアする前に合成 resume メッセージを送信します。

自動再起動復旧は子セッションごとに制限されます。同じサブエージェントの子が rapid re-wedge ウィンドウ内で繰り返し孤立復旧として受け入れられた場合、OpenClaw はそのセッションに復旧 tombstone を永続化し、以後の再起動では自動 resume を停止します。タスクレコードを調整するには `openclaw tasks maintenance --apply` を実行し、tombstone 付きセッションの古い中断復旧フラグをクリアするには `openclaw doctor --fix` を実行します。

<Note>
サブエージェントの spawn が Gateway `PAIRING_REQUIRED` / `scope-upgrade` で失敗する場合は、ペアリング状態を編集する前に RPC 呼び出し元を確認してください。内部の `sessions_spawn` 調整は、直接 local loopback の共有トークン/パスワード認証を介して `client.id: "gateway-client"`、`client.mode: "backend"` として接続する必要があります。このパスは CLI のペアリング済みデバイススコープベースラインに依存しません。リモート呼び出し元、明示的な `deviceIdentity`、明示的なデバイストークンパス、browser/node クライアントでは、スコープアップグレードに通常のデバイス承認が引き続き必要です。
</Note>

## 停止

- リクエスターのチャットで `/stop` を送信すると、リクエスターセッションが中断され、そこから spawn されたアクティブなサブエージェント実行がすべて停止し、ネストされた子にもカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子にもカスケードします。

## 制限事項

- サブエージェントの通知は**ベストエフォート**です。Gateway が再起動すると、保留中の「announce back」作業は失われます。
- サブエージェントは引き続き同じ Gateway プロセスリソースを共有します。`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常にノンブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントコンテキストは `AGENTS.md` + `TOOLS.md` のみを注入します（`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は含みません）。
- 最大ネスト深さは 5 です（`maxSpawnDepth` の範囲: 1–5）。ほとんどのユースケースでは深さ 2 が推奨されます。
- `maxChildrenPerAgent` はセッションごとのアクティブな子の上限を設定します（既定値 `5`、範囲 `1–20`）。

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents)
- [エージェント送信](/ja-JP/tools/agent-send)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
