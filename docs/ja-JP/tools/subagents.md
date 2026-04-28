---
read_when:
    - agent を使ってバックグラウンド処理や並列処理を行いたい場合
    - sessions_spawn またはサブエージェントの tool policy を変更している場合
    - スレッドに紐づくサブエージェントセッションを実装またはトラブルシューティングしている場合
sidebarTitle: Sub-agents
summary: 結果を要求元チャットに通知して返す、分離されたバックグラウンド agent 実行を起動する
title: サブエージェント
x-i18n:
    generated_at: "2026-04-26T11:42:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

サブエージェントは、既存の agent 実行から起動されるバックグラウンド agent 実行です。  
それらは独自の session（`agent:<agentId>:subagent:<uuid>`）で動作し、完了すると、結果を要求元チャットチャネルへ **通知** して返します。各サブエージェント実行は [background task](/ja-JP/automation/tasks) として追跡されます。

主な目的:

- 「調査 / 長時間タスク / 遅い tool」作業を並列化し、メイン実行をブロックしない
- デフォルトでサブエージェントを分離して保つ（session 分離 + 任意の sandbox 化）
- tool サーフェスを誤用しにくく保つ: サブエージェントはデフォルトでは session tools を持たない
- オーケストレーターパターン向けに、設定可能なネスト深度をサポートする

<Note>
**コストに関する注意:** 各サブエージェントは、デフォルトで独自のコンテキストと token 使用量を持ちます。重いタスクや反復タスクでは、サブエージェントにはより安価な model を設定し、メイン agent は高品質 model のままにしてください。`agents.defaults.subagents.model` または agent ごとの override で設定します。子が本当に要求元の現在 transcript を必要とする場合、その 1 回の spawn で `context: "fork"` を要求できます。
</Note>

## Slash コマンド

**現在の session** のサブエージェント実行を確認または制御するには `/subagents` を使います:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` は実行メタデータ（status、timestamps、session id、transcript path、cleanup）を表示します。制限付きで安全性フィルター済みの想起ビューには `sessions_history` を使ってください。生の完全 transcript が必要な場合は、ディスク上の transcript path を確認してください。

### スレッドバインディング制御

これらのコマンドは、永続的なスレッドバインディングをサポートするチャネルで動作します。下記の [スレッド対応チャネル](#スレッド対応チャネル) を参照してください。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Spawn の挙動

`/subagents spawn` は、バックグラウンドサブエージェントをユーザーコマンドとして開始し（内部 relay ではない）、実行完了時に 1 回だけ最終完了更新を要求元チャットへ送信します。

<AccordionGroup>
  <Accordion title="非ブロッキングでプッシュベースの完了">
    - spawn コマンドは非ブロッキングです。run id を即座に返します。
    - 完了時、サブエージェントは要求元チャットチャネルへ summary/result メッセージを通知します。
    - 完了はプッシュベースです。spawn 後は、完了待ちのためだけに `/subagents list`、`sessions_list`、`sessions_history` をループでポーリングしないでください。status の確認は、デバッグや介入が必要なときにだけ行ってください。
    - 完了時、OpenClaw はそのサブエージェント session が開いた追跡済み browser tab/process を、通知 cleanup フローが続行する前にベストエフォートで閉じます。

  </Accordion>
  <Accordion title="手動 spawn の配信耐性">
    - OpenClaw はまず安定した idempotency key 付きで直接 `agent` 配信を試みます。
    - 直接配信に失敗した場合は、queue routing にフォールバックします。
    - queue routing も利用できない場合、通知は短い指数バックオフで再試行され、その後最終的に断念します。
    - 完了配信では、解決済みの要求元ルートを維持します。利用可能な場合は、thread-bound または conversation-bound の完了ルートが優先されます。完了 origin が channel しか提供しない場合、OpenClaw は要求元 session の解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足している target/account を補うため、直接配信が引き続き機能します。

  </Accordion>
  <Accordion title="完了ハンドオフメタデータ">
    要求元 session への完了ハンドオフは、ランタイム生成の内部コンテキストであり、ユーザー作成テキストではありません。内容は次のとおりです。

    - `Result` — 最新の可視 `assistant` reply text。なければサニタイズ済みの最新 tool/toolResult text。終端 failed 実行ではキャプチャ済み reply text を再利用しません。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`
    - コンパクトな runtime/token 統計
    - 要求元 agent に対し、生の内部メタデータを転送するのではなく、通常の assistant の口調で書き換えるよう指示する delivery instruction

  </Accordion>
  <Accordion title="モードと ACP runtime">
    - `--model` と `--thinking` は、その特定実行のデフォルトを override します。
    - 完了後の詳細や出力確認には `info` / `log` を使ってください。
    - `/subagents spawn` は one-shot モード（`mode: "run"`）です。永続的な thread-bound session には、`thread: true` と `mode: "session"` を付けた `sessions_spawn` を使ってください。
    - ACP ハーネス session（Claude Code、Gemini CLI、OpenCode、または明示的な Codex ACP/acpx）では、tool がその runtime を公開している場合に `runtime: "acp"` を付けた `sessions_spawn` を使ってください。完了や agent-to-agent ループのデバッグ時は [ACP delivery model](/ja-JP/tools/acp-agents#delivery-model) を参照してください。`codex` Plugin が有効な場合、Codex の chat/thread 制御では、ユーザーが明示的に ACP/acpx を要求しない限り、ACP より `/codex ...` を優先すべきです。
    - OpenClaw は、ACP が有効で、要求元が sandbox 化されておらず、`acpx` のような backend Plugin がロードされている場合にのみ `runtime: "acp"` を表示します。`runtime: "acp"` は外部 ACP ハーネス id、または `runtime.type="acp"` を持つ `agents.list[]` エントリを想定しています。`agents_list` の通常の OpenClaw config agent にはデフォルトのサブエージェント runtime を使用してください。

  </Accordion>
</AccordionGroup>

## コンテキストモード

ネイティブサブエージェントは、呼び出し元が現在の transcript の fork を明示的に要求しない限り、分離された状態で開始されます。

| モード | 使用する場面 | 挙動 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新規調査、独立実装、遅い tool 作業、または task text で十分に指示できるもの | クリーンな子 transcript を作成します。これがデフォルトで、token 使用量も抑えられます。 |
| `fork` | 現在の会話、過去の tool result、または要求元 transcript にすでに存在する微妙な指示に依存する作業 | 子開始前に、要求元 transcript を子 session へ分岐します。 |

`fork` は控えめに使ってください。これはコンテキスト依存の委譲用であり、明確な task prompt を書く代替ではありません。

## Tool: `sessions_spawn`

グローバル `subagent` レーン上で `deliver: false` のサブエージェント実行を開始し、その後通知ステップを実行して、通知 reply を要求元チャットチャネルへ投稿します。

**デフォルト:**

- **Model:** `agents.defaults.subagents.model`（または agent ごとの `agents.list[].subagents.model`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` はそれより優先されます。
- **Thinking:** `agents.defaults.subagents.thinking`（または agent ごとの `agents.list[].subagents.thinking`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` はそれより優先されます。
- **実行タイムアウト:** `sessions_spawn.runTimeoutSeconds` が省略された場合、OpenClaw は設定されていれば `agents.defaults.subagents.runTimeoutSeconds` を使い、それ以外では `0`（タイムアウトなし）にフォールバックします。

### Tool パラメータ

<ParamField path="task" type="string" required>
  サブエージェントの task 説明。
</ParamField>
<ParamField path="label" type="string">
  任意の人間向けラベル。
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` により許可されている場合、別の agent id 配下で spawn します。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` は外部 ACP ハーネス（`claude`、`droid`、`gemini`、`opencode`、または明示的に要求された Codex ACP/acpx）と、`runtime.type` が `acp` の `agents.list[]` エントリ専用です。
</ParamField>
<ParamField path="model" type="string">
  サブエージェント model を override します。無効な値はスキップされ、サブエージェントはデフォルト model で実行されます。その際、tool result に警告が含まれます。
</ParamField>
<ParamField path="thinking" type="string">
  サブエージェント実行の thinking level を override します。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  設定されていればデフォルトは `agents.defaults.subagents.runTimeoutSeconds`、それ以外では `0`。設定した場合、サブエージェント実行は N 秒後に中断されます。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` の場合、このサブエージェント session にチャネルのスレッドバインディングを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` で `mode` が省略された場合、デフォルトは `session` になります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` は通知直後にアーカイブします（rename により transcript 自体は保持されます）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` は、対象の子 runtime が sandbox 化されていない限り spawn を拒否します。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` は要求元の現在 transcript を子 session に分岐します。ネイティブサブエージェント専用です。子が現在 transcript を必要とする場合にだけ使ってください。
</ParamField>

<Warning>
`sessions_spawn` は channel-delivery パラメータ（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、spawn された実行からの `message` / `sessions_send` を使ってください。
</Warning>

## スレッドに紐づく session

チャネルでスレッドバインディングが有効な場合、サブエージェントはスレッドに結び付いたままにでき、そのスレッド内の後続ユーザーメッセージは同じサブエージェント session へルーティングされ続けます。

### スレッド対応チャネル

**Discord** のみが現在対応しています。永続的な thread-bound subagent session（`thread: true` の `sessions_spawn`）、手動スレッド制御（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）、およびアダプターキー `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`、`channels.discord.threadBindings.spawnSubagentSessions` をサポートします。

### クイックフロー

<Steps>
  <Step title="Spawn">
    `thread: true`（必要に応じて `mode: "session"`）付きで `sessions_spawn` を実行します。
  </Step>
  <Step title="Bind">
    OpenClaw がアクティブチャネル内で、その session target 用のスレッドを作成または bind します。
  </Step>
  <Step title="フォローアップをルーティング">
    そのスレッド内の reply や follow-up メッセージは、bind された session にルーティングされます。
  </Step>
  <Step title="タイムアウトを確認">
    非アクティブ時の自動 unfocus を確認/更新するには `/session idle` を使い、ハード上限を制御するには `/session max-age` を使います。
  </Step>
  <Step title="Detach">
    手動で detach するには `/unfocus` を使います。
  </Step>
</Steps>

### 手動制御

| Command | 効果 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 現在のスレッドをサブエージェント/session target に bind する（または作成する） |
| `/unfocus`         | 現在 bind されているスレッドの binding を解除する |
| `/agents`          | アクティブ実行と binding 状態（`thread:<id>` または `unbound`）を一覧表示する |
| `/session idle`    | アイドル時の自動 unfocus を確認/更新する（focus 中の bind 済みスレッドのみ） |
| `/session max-age` | ハード上限を確認/更新する（focus 中の bind 済みスレッドのみ） |

### Config スイッチ

- **グローバルデフォルト:** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- **チャネル override と spawn 自動 bind キー** はアダプター固有です。上記の [スレッド対応チャネル](#スレッド対応チャネル) を参照してください。

現在のアダプター詳細については [Configuration reference](/ja-JP/gateway/configuration-reference) と [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  `agentId` 経由で対象にできる agent id の一覧（`["*"]` は任意を許可）。デフォルト: 要求元 agent のみ。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  要求元 agent が独自の `subagents.allowAgents` を設定していない場合に使われる、デフォルトの対象 agent allowlist。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的な profile 選択を強制）。agent ごとの override: `agents.list[].subagents.requireAgentId`。
</ParamField>

要求元 session が sandbox 化されている場合、`sessions_spawn` は、sandbox 化されずに実行される target を拒否します。

### Discovery

現在 `sessions_spawn` で許可されている agent id を確認するには `agents_list` を使ってください。レスポンスには、列挙された各 agent の実効 model と組み込み runtime メタデータが含まれるため、呼び出し元は Pi、Codex app-server、その他の設定済みネイティブ runtime を区別できます。

### 自動アーカイブ

- サブエージェント session は `agents.defaults.subagents.archiveAfterMinutes`（デフォルト `60`）後に自動アーカイブされます。
- アーカイブは `sessions.delete` を使用し、transcript を `*.deleted.<timestamp>` に rename します（同じフォルダー内）。
- `cleanup: "delete"` は通知直後に即座にアーカイブします（rename によって transcript 自体は保持されます）。
- 自動アーカイブはベストエフォートです。保留中の timer は gateway 再起動時に失われます。
- `runTimeoutSeconds` は自動アーカイブしません。実行を止めるだけです。session は自動アーカイブまで残ります。
- 自動アーカイブは depth-1 と depth-2 の session に同様に適用されます。
- browser cleanup はアーカイブ cleanup とは別です。追跡された browser tab/process は、transcript/session レコードが保持されていても、実行完了時にベストエフォートで閉じられます。

## ネストしたサブエージェント

デフォルトでは、サブエージェントは自分自身のサブエージェントを spawn できません（`maxSpawnDepth: 1`）。  
`maxSpawnDepth: 2` を設定すると、1 レベルのネスト、すなわち **オーケストレーターパターン** が有効になります: main → orchestrator sub-agent → worker sub-sub-agents。

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

| Depth | Session key 形式 | 役割 | Spawn 可能か |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | メイン agent | 常に可能 |
| 1     | `agent:<id>:subagent:<uuid>`                 | サブエージェント（depth 2 が許可されている場合は orchestrator） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（leaf worker） | 不可 |

### 通知チェーン

結果はチェーンをさかのぼって戻ります。

1. depth-2 worker が完了 → 親（depth-1 orchestrator）に通知
2. depth-1 orchestrator が通知を受け取り、結果を合成して完了 → main に通知
3. main agent が通知を受け取り、ユーザーへ配信

各レベルが見るのは、自分の直下の子からの通知だけです。

<Note>
**運用上の指針:** 子作業は一度開始したら、`sessions_list`、`sessions_history`、`/subagents list`、`exec` の sleep コマンドを使ったポーリングループを組むのではなく、完了イベントを待ってください。`sessions_list` と `/subagents list` は、子 session 関係を live な作業に集中させます。live な子は接続されたまま、終了済みの子は短い最近ウィンドウの間だけ可視のままになり、古い store-only の子リンクは freshness window を過ぎると無視されます。これにより、再起動後に古い `spawnedBy` / `parentSessionKey` メタデータが ghost child を復活させるのを防ぎます。最終回答をすでに送信した後に子の完了イベントが到着した場合、正しい follow-up は厳密に silent token `NO_REPLY` / `no_reply` です。
</Note>

### 深さごとの tool policy

- role と control scope は spawn 時に session metadata に書き込まれます。これにより、平坦化または復元された session key が誤って orchestrator 権限を取り戻すのを防ぎます。
- **Depth 1（orchestrator、`maxSpawnDepth >= 2` の場合）:** `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得し、自身の子を管理できます。他の session/system tools は引き続き拒否されます。
- **Depth 1（leaf、`maxSpawnDepth == 1` の場合）:** session tools なし（現在のデフォルト動作）。
- **Depth 2（leaf worker）:** session tools なし。depth 2 では `sessions_spawn` は常に拒否されます。これ以上子を spawn できません。

### agent ごとの spawn 上限

各 agent session（どの深さでも）は、同時に最大 `maxChildrenPerAgent`（デフォルト `5`）個の active child しか持てません。これにより、単一 orchestrator からの暴走 fan-out を防ぎます。

### Cascade stop

depth-1 orchestrator を停止すると、その depth-2 子も自動的に停止します。

- メインチャットでの `/stop` は、すべての depth-1 agent を停止し、その depth-2 子へ cascade します。
- `/subagents kill <id>` は、特定のサブエージェントを停止し、その子へ cascade します。
- `/subagents kill all` は、要求元のすべてのサブエージェントを停止し、cascade します。

## 認証

サブエージェント認証は、session type ではなく **agent id** で解決されます。

- サブエージェント session key は `agent:<agentId>:subagent:<uuid>` です。
- auth store はその agent の `agentDir` から読み込まれます。
- main agent の auth profile は **フォールバック** としてマージされます。競合時は agent profile が main profile を上書きします。

このマージは追加型であるため、main profile は常にフォールバックとして利用可能です。agent ごとに完全に分離された auth はまだサポートされていません。

## 通知

サブエージェントは通知ステップを通じて結果を返します。

- 通知ステップは要求元 session ではなく、サブエージェント session 内で実行されます。
- サブエージェントが正確に `ANNOUNCE_SKIP` と返した場合、何も投稿されません。
- 最新の assistant text が厳密に silent token `NO_REPLY` / `no_reply` の場合、以前に可視の進捗があっても通知出力は抑制されます。

配信は要求元の深さに依存します。

- 最上位の要求元 session では、外部配信付き follow-up `agent` 呼び出し（`deliver=true`）が使われます。
- ネストした要求元 subagent session では、orchestrator が session 内で子結果を合成できるよう、内部 follow-up injection（`deliver=false`）を受け取ります。
- ネストした要求元 subagent session が消えている場合、OpenClaw は利用可能であればその session の要求元にフォールバックします。

最上位要求元 session では、完了モードの直接配信はまず任意の bind 済み conversation/thread ルートと hook override を解決し、その後、要求元 session の保存済みルートから不足する channel-target フィールドを補います。これにより、完了 origin が channel しか識別しない場合でも、完了は正しい chat/topic に残ります。

子完了の集約は、ネストした完了検出を構築する際に現在の要求元実行へスコープされるため、古い prior-run の子出力が現在の通知に漏れ込むのを防ぎます。通知 reply は、チャネルアダプターで利用可能な場合、thread/topic ルーティングを保持します。

### 通知コンテキスト

通知コンテキストは、安定した内部イベントブロックへ正規化されます。

| Field | Source |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source | `subagent` または `cron` |
| Session ids | 子 session key/id |
| Type | 通知種別 + task label |
| Status | ランタイム結果から導出（`success`、`error`、`timeout`、`unknown`） — **model text から推測しない** |
| Result content | 最新の可視 assistant text。なければサニタイズ済みの最新 tool/toolResult text |
| Follow-up | 返信すべきか沈黙すべきかを記述する instruction |

終端 failed 実行は、キャプチャされた reply text を再生せずに失敗ステータスを報告します。タイムアウト時に子が tool call までしか進んでいない場合、通知は生の tool 出力を再生する代わりに、その履歴を短い partial-progress summary に要約できます。

### Stats 行

通知ペイロードには末尾に stats 行が含まれます（ラップされていても）。

- Runtime（例: `runtime 5m12s`）。
- Token 使用量（input/output/total）。
- model 価格が設定されている場合の推定コスト（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId`、transcript path。メイン agent が `sessions_history` で履歴を取得したり、ディスク上のファイルを確認したりできるようにするためです。

内部メタデータはオーケストレーション専用です。ユーザー向け reply は通常の assistant の口調で書き直すべきです。

### なぜ `sessions_history` を優先するのか

`sessions_history` はより安全なオーケストレーション経路です。

- assistant の想起はまず正規化されます: thinking tag の除去、`<relevant-memories>` / `<relevant_memories>` の scaffolding 除去、プレーンテキストの tool-call XML ペイロードブロック（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`）の除去（きれいに閉じない切り詰められたペイロードも含む）、降格された tool-call/result scaffolding と historical-context marker の除去、リークした model control token（`<|assistant|>`、その他の ASCII `<|...|>`、全角 `<｜...｜>`）の除去、不正な MiniMax tool-call XML の除去。
- 認証情報/token に見えるテキストは redacted されます。
- 長いブロックは切り詰められることがあります。
- 非常に大きい履歴では古い行が落とされたり、巨大すぎる 1 行が `[sessions_history omitted: message too large]` に置き換えられたりします。
- バイト単位で完全な transcript が必要な場合は、生のオンディスク transcript 確認がフォールバックです。

## Tool policy

サブエージェントは、まず親または target agent と同じ profile と tool-policy pipeline を使います。その後、OpenClaw がサブエージェント制限レイヤーを適用します。

制限的な `tools.profile` がない場合、サブエージェントは **session tools** と system tools を除くすべての tools を取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

ここでも `sessions_history` は境界付きでサニタイズ済みの想起ビューであり、生の transcript dump ではありません。

`maxSpawnDepth >= 2` の場合、depth-1 orchestrator サブエージェントは、自身の子を管理できるように `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を追加で受け取ります。

### Config による override

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

`tools.subagents.tools.allow` は最終的な allow-only フィルターです。これはすでに解決済みの tool set を狭めることはできますが、`tools.profile` によって削除された tool を **戻すことはできません**。たとえば、`tools.profile: "coding"` には `web_search`/`web_fetch` は含まれますが、`browser` tool は含まれません。coding-profile のサブエージェントに browser 自動化を使わせるには、profile 段階で browser を追加してください。

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

1 つの agent にだけ browser 自動化を与えたい場合は、agent ごとの `agents.list[].tools.alsoAllow: ["browser"]` を使ってください。

## 同時実行性

サブエージェントは専用の in-process queue lane を使用します。

- **レーン名:** `subagent`
- **同時実行数:** `agents.defaults.subagents.maxConcurrent`（デフォルト `8`）

## Liveness と回復

OpenClaw は、`endedAt` が存在しないことを、サブエージェントがまだ生きている恒久的な証拠とは見なしません。stale-run ウィンドウより古い未終了実行は、`/subagents list`、status summary、descendant completion gating、session ごとの同時実行チェックにおいて、active/pending として数えられなくなります。

gateway 再起動後、古い未終了の復元済み実行は、その子 session が `abortedLastRun: true` とマークされていない限り削除されます。そうした restart-aborted な子 session は、aborted マーカーをクリアする前に合成 resume メッセージを送るサブエージェント orphan recovery フローを通じて回復可能なままです。

<Note>
サブエージェント spawn が Gateway `PAIRING_REQUIRED` / `scope-upgrade` で失敗する場合、pairing 状態を編集する前に RPC 呼び出し元を確認してください。内部の `sessions_spawn` 協調は、直接 loopback の共有 token/password auth 上で、`client.id: "gateway-client"` と `client.mode: "backend"` で接続すべきです。このパスは CLI の paired-device scope baseline に依存しません。リモート呼び出し元、明示的な `deviceIdentity`、明示的な device-token パス、browser/node クライアントは、引き続き scope upgrade に通常の device approval が必要です。
</Note>

## 停止

- 要求元チャットで `/stop` を送ると、要求元 session が中断され、そこから spawn された active なサブエージェント実行も停止し、ネストした子へ cascade します。
- `/subagents kill <id>` は、特定のサブエージェントを停止し、その子へ cascade します。

## 制限事項

- サブエージェント通知は **ベストエフォート** です。gateway が再起動すると、保留中の「通知して返す」作業は失われます。
- サブエージェントは同じ gateway プロセス資源を共有するため、`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです: すぐに `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントコンテキストでは `AGENTS.md` + `TOOLS.md` のみが注入されます（`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は含まれません）。
- 最大ネスト深度は 5 です（`maxSpawnDepth` の範囲: 1–5）。ほとんどの用途では depth 2 を推奨します。
- `maxChildrenPerAgent` は session ごとの active child 数を制限します（デフォルト `5`、範囲 `1–20`）。

## 関連

- [ACP agents](/ja-JP/tools/acp-agents)
- [Agent send](/ja-JP/tools/agent-send)
- [Background tasks](/ja-JP/automation/tasks)
- [Multi-agent sandbox tools](/ja-JP/tools/multi-agent-sandbox-tools)
