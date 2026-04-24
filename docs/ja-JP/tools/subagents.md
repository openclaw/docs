---
read_when:
    - エージェント経由でバックグラウンド/並列作業をしたい場合
    - '`sessions_spawn`またはsub-agentツールポリシーを変更している場合'
    - スレッドに紐づくsubagentセッションを実装またはトラブルシューティングしている場合
summary: 'Sub-agent: 結果を依頼元チャットへ通知する隔離されたエージェント実行の起動'
title: Sub-agent
x-i18n:
    generated_at: "2026-04-24T05:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

Sub-agentは、既存のエージェント実行から起動されるバックグラウンドのエージェント実行です。これらは独自のセッション（`agent:<agentId>:subagent:<uuid>`）で実行され、完了すると、その結果を依頼元チャットチャネルへ**通知**します。各sub-agent実行は[background task](/ja-JP/automation/tasks)として追跡されます。

## スラッシュコマンド

**現在のセッション**のsub-agent実行を確認または制御するには`/subagents`を使います。

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

スレッドバインディング制御:

これらのコマンドは、永続的なスレッドバインディングをサポートするチャネルで動作します。以下の**スレッド対応チャネル**を参照してください。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info`は、実行メタデータ（status、timestamp、session id、transcript path、cleanup）を表示します。
制限付きで安全性フィルター済みの再確認ビューには`sessions_history`を使ってください。生の完全transcriptが必要な場合は、ディスク上のtranscript pathを確認してください。

### 起動動作

`/subagents spawn`は、内部リレーではなくユーザーコマンドとしてバックグラウンドsub-agentを開始し、実行完了時に依頼元チャットへ最終的な完了更新を1件送信します。

- spawnコマンドはnon-blockingです。run idを即座に返します。
- 完了時、sub-agentは依頼元チャットチャネルへ要約/結果メッセージを通知します。
- 完了通知はpushベースです。起動後は、完了待ちのためだけに`/subagents list`、
  `sessions_list`、または`sessions_history`をループでポーリングしないでください。
  status確認は、デバッグや介入が必要なときにだけオンデマンドで行ってください。
- 完了時、OpenClawは、そのsub-agentセッションが開いた追跡対象のbrowser tab/processを、通知cleanupフロー継続前にbest-effortで閉じます。
- 手動spawnでは、配信は耐障害性があります:
  - OpenClawは、安定したidempotency keyを使って最初に直接`agent`配信を試みます。
  - 直接配信が失敗した場合、queue routingへフォールバックします。
  - queue routingも利用できない場合、通知は最終的に断念する前に短い指数バックオフで再試行されます。
- 完了配信は、解決済み依頼元ルートを保持します:
  - 利用可能な場合、thread-boundまたはconversation-boundの完了ルートが優先されます
  - 完了元がchannelしか提供しない場合、OpenClawは依頼元セッションの解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足するtarget/accountを補完するため、直接配信が引き続き機能します
- 依頼元セッションへの完了handoffは、ランタイム生成の内部コンテキスト（ユーザー作成テキストではない）で、次を含みます:
  - `Result`（最新の可視`assistant`返信テキスト。なければサニタイズ済みの最新`tool`/`toolResult`テキスト。終端failed実行では、キャプチャ済み返信テキストを再利用しません）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - コンパクトなruntime/token統計
  - 依頼元エージェントに対して、生の内部メタデータを転送せず通常のassistant voiceで書き直すよう指示するdelivery instruction
- `--model`と`--thinking`は、その特定の実行に対してデフォルトを上書きします。
- 完了後の詳細と出力確認には`info`/`log`を使ってください。
- `/subagents spawn`はone-shotモード（`mode: "run"`）です。永続的なスレッドバインドセッションには、`thread: true`および`mode: "session"`付きの`sessions_spawn`を使ってください。
- ACP harness session（Codex、Claude Code、Gemini CLI）には、`runtime: "acp"`付きの`sessions_spawn`を使い、[ACP Agents](/ja-JP/tools/acp-agents)、特に完了通知やagent-to-agent loopをデバッグするときの[ACP delivery model](/ja-JP/tools/acp-agents#delivery-model)を参照してください。

主な目的:

- 「調査 / 長時間タスク / 遅いツール」の作業を、メイン実行をブロックせず並列化する。
- sub-agentをデフォルトで隔離状態に保つ（セッション分離 + 任意のsandbox化）。
- ツールインターフェースを誤用しにくく保つ: sub-agentはデフォルトではsession toolを取得しません。
- orchestrator pattern向けに設定可能なネスト深度をサポートする。

コストに関する注意: 各sub-agentは、デフォルトで**独自の**コンテキストとtoken使用量を持ちます。重いまたは反復的なタスクでは、sub-agentに安価なモデルを設定し、メインエージェントはより高品質なモデルのままにしてください。これは`agents.defaults.subagents.model`またはagentごとの上書きで設定できます。子が本当に依頼元の現在のtranscriptを必要とする場合は、そのspawnで`context: "fork"`を要求できます。

## ツール

`sessions_spawn`を使います。

- sub-agent実行を開始する（`deliver: false`、global lane: `subagent`）
- その後通知ステップを実行し、通知返信を依頼元チャットチャネルへ投稿する
- デフォルトモデル: `agents.defaults.subagents.model`（またはagentごとの`agents.list[].subagents.model`）を設定していない限り呼び出し元を継承します。明示的な`sessions_spawn.model`がある場合はそれが優先されます。
- デフォルトthinking: `agents.defaults.subagents.thinking`（またはagentごとの`agents.list[].subagents.thinking`）を設定していない限り呼び出し元を継承します。明示的な`sessions_spawn.thinking`がある場合はそれが優先されます。
- デフォルト実行タイムアウト: `sessions_spawn.runTimeoutSeconds`が省略された場合、OpenClawは設定されていれば`agents.defaults.subagents.runTimeoutSeconds`を使い、そうでなければ`0`（タイムアウトなし）へフォールバックします。

ツールパラメーター:

- `task`（必須）
- `label?`（任意）
- `agentId?`（任意。許可されている場合、別のagent idの下でspawn）
- `model?`（任意。sub-agentモデルを上書きします。無効な値はスキップされ、sub-agentはデフォルトモデルで実行され、ツール結果に警告が出ます）
- `thinking?`（任意。sub-agent実行のthinking levelを上書き）
- `runTimeoutSeconds?`（設定されていれば`agents.defaults.subagents.runTimeoutSeconds`がデフォルト、そうでなければ`0`。設定時、sub-agent実行はN秒後に中断されます）
- `thread?`（デフォルト`false`。`true`の場合、このsub-agentセッションに対してチャネルスレッドバインディングを要求）
- `mode?`（`run|session`）
  - デフォルトは`run`
  - `thread: true`かつ`mode`省略時、デフォルトは`session`になります
  - `mode: "session"`には`thread: true`が必要です
- `cleanup?`（`delete|keep`、デフォルト`keep`）
- `sandbox?`（`inherit|require`、デフォルト`inherit`。`require`は、対象子runtimeがsandbox化されていない場合、spawnを拒否します）
- `context?`（`isolated|fork`、デフォルト`isolated`。native sub-agentのみ）
  - `isolated`はクリーンな子transcriptを作成し、デフォルトです。
  - `fork`は依頼元の現在のtranscriptを子セッションへ分岐し、子が同じ会話コンテキストで開始できるようにします。
  - `fork`は、子が現在のtranscriptを必要とする場合にのみ使ってください。スコープを絞った作業では`context`を省略してください。
- `sessions_spawn`はチャネル配信パラメーター（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、spawn済み実行から`message`/`sessions_send`を使ってください。

## スレッドバインドセッション

チャネルでスレッドバインディングが有効な場合、sub-agentはスレッドにバインドされたままになり、そのスレッド内の後続ユーザーメッセージは同じsub-agentセッションへルーティングされ続けます。

### スレッド対応チャネル

- Discord（現在サポートされている唯一のチャネル）: 永続的なスレッドバインドsubagentセッション（`thread: true`付き`sessions_spawn`）、手動スレッド制御（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）、およびアダプターキー`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`、`channels.discord.threadBindings.spawnSubagentSessions`をサポートします。

クイックフロー:

1. `thread: true`（および必要に応じて`mode: "session"`）を指定して`sessions_spawn`で起動する。
2. OpenClawが、アクティブチャネル内でそのセッション対象にスレッドを作成またはバインドする。
3. そのスレッド内の返信と後続メッセージは、バインドされたセッションへルーティングされる。
4. 非アクティブ時の自動unfocus確認/更新には`/session idle`を、ハード上限の制御には`/session max-age`を使う。
5. 手動で切り離すには`/unfocus`を使う。

手動制御:

- `/focus <target>`は、現在のスレッドをsub-agent/session対象へバインドします（または作成します）。
- `/unfocus`は、現在バインドされているスレッドのバインディングを削除します。
- `/agents`は、アクティブな実行とバインディング状態（`thread:<id>`または`unbound`）を一覧表示します。
- `/session idle`と`/session max-age`は、フォーカス済みのバインドスレッドでのみ動作します。

設定スイッチ:

- グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- チャネル上書きおよびspawn自動バインドキーはアダプター固有です。上記の**スレッド対応チャネル**を参照してください。

現在のアダプター詳細は[Configuration Reference](/ja-JP/gateway/configuration-reference)および[Slash commands](/ja-JP/tools/slash-commands)を参照してください。

Allowlist:

- `agents.list[].subagents.allowAgents`: `agentId`経由で対象にできるagent idの一覧（任意のagentを許可するには`["*"]`）。デフォルト: 依頼元agentのみ。
- `agents.defaults.subagents.allowAgents`: 依頼元agentが独自の`subagents.allowAgents`を設定していない場合に使われる、デフォルトの対象agent allowlist。
- Sandbox継承ガード: 依頼元セッションがsandbox化されている場合、`sessions_spawn`はsandbox化されていない対象実行を拒否します。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: trueの場合、`agentId`を省略した`sessions_spawn`呼び出しをブロックします（明示的なprofile選択を強制）。デフォルトはfalse。

検出:

- `sessions_spawn`で現在どのagent idが許可されているかを確認するには`agents_list`を使ってください。

自動アーカイブ:

- sub-agentセッションは、`agents.defaults.subagents.archiveAfterMinutes`後に自動的にアーカイブされます（デフォルト: 60）。
- アーカイブは`sessions.delete`を使い、transcriptを`*.deleted.<timestamp>`へリネームします（同じフォルダー内）。
- `cleanup: "delete"`は、通知直後に即時アーカイブします（それでもtranscriptはリネームにより保持されます）。
- 自動アーカイブはbest-effortです。保留中タイマーはgateway再起動時に失われます。
- `runTimeoutSeconds`は自動アーカイブしません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブはdepth-1とdepth-2セッションに等しく適用されます。
- browser cleanupはarchive cleanupとは別です: 追跡対象browser tab/processは、transcript/session recordが保持される場合でも、実行終了時にbest-effortで閉じられます。

## ネストしたSub-agent

デフォルトでは、sub-agentは自分自身のsub-agentをspawnできません（`maxSpawnDepth: 1`）。`maxSpawnDepth: 2`を設定すると1段のネストを有効にでき、**orchestrator pattern**が可能になります: main → orchestrator sub-agent → worker sub-sub-agent。

### 有効化方法

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // sub-agentが子をspawnできるようにする（デフォルト: 1）
        maxChildrenPerAgent: 5, // agentセッションあたりの最大アクティブ子数（デフォルト: 5）
        maxConcurrent: 8, // global concurrency lane cap（デフォルト: 8）
        runTimeoutSeconds: 900, // sessions_spawn省略時のデフォルトタイムアウト（0 = タイムアウトなし）
      },
    },
  },
}
```

### 深度レベル

| 深度 | セッションキー形状 | 役割 | spawn可能か |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | メインagent                                    | 常に可能                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent（深度2が許可されている場合はorchestrator） | `maxSpawnDepth >= 2`の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent（leaf worker）                   | 不可                        |

### 通知チェーン

結果はチェーンを遡って流れます。

1. depth-2 workerが完了 → 親（depth-1 orchestrator）へ通知
2. depth-1 orchestratorが通知を受信し、結果を統合して完了 → mainへ通知
3. main agentが通知を受信し、ユーザーへ配信

各レベルは、自身の直接の子からの通知だけを確認します。

運用ガイダンス:

- 子作業は一度だけ開始し、`sessions_list`、`sessions_history`、`/subagents list`、または
  `exec`のsleepコマンドを使ったポーリングループを組むのではなく、完了イベントを待ってください。
- 最終回答をすでに送信した後で子の完了イベントが到着した場合、正しい後続動作は、正確に無言トークン`NO_REPLY` / `no_reply`です。

### 深度ごとのツールポリシー

- 役割と制御範囲は、spawn時にセッションメタデータへ書き込まれます。これにより、フラット化または復元されたセッションキーが誤ってorchestrator権限を取り戻すことを防ぎます。
- **深度1（orchestrator、`maxSpawnDepth >= 2`の場合）**: `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`を取得し、子を管理できます。その他のsession/systemツールは引き続き拒否されます。
- **深度1（leaf、`maxSpawnDepth == 1`の場合）**: sessionツールなし（現在のデフォルト動作）。
- **深度2（leaf worker）**: sessionツールなし — `sessions_spawn`は深度2では常に拒否されます。これ以上の子はspawnできません。

### エージェントごとのspawn上限

各agentセッション（任意の深度）は、同時に最大`maxChildrenPerAgent`（デフォルト: 5）個のアクティブな子までしか持てません。これにより、単一orchestratorからの暴走fan-outを防ぎます。

### カスケード停止

深度1のorchestratorを停止すると、その深度2の子もすべて自動的に停止します。

- メインチャットで`/stop`を実行すると、すべての深度1 agentが停止し、その深度2の子にもカスケードします。
- `/subagents kill <id>`は、特定のsub-agentを停止し、その子にもカスケードします。
- `/subagents kill all`は、依頼元のすべてのsub-agentを停止し、カスケードします。

## 認証

sub-agent認証は、セッション種別ではなく**agent id**で解決されます。

- sub-agentセッションキーは`agent:<agentId>:subagent:<uuid>`です。
- auth storeは、そのagentの`agentDir`から読み込まれます。
- メインagentのauth profileは**フォールバック**としてマージされます。競合時はagent profileがmain profileを上書きします。

注意: このマージは加算的なので、main profileは常にフォールバックとして利用可能です。agentごとの完全に分離された認証はまだサポートされていません。

## 通知

sub-agentは、通知ステップを通じて結果を返します。

- 通知ステップは、依頼元セッションではなくsub-agentセッション内で実行されます。
- sub-agentが正確に`ANNOUNCE_SKIP`と返信した場合、何も投稿されません。
- 最新のassistantテキストが正確に無言トークン`NO_REPLY` / `no_reply`である場合、
  以前に可視の進捗が存在していても通知出力は抑制されます。
- それ以外の場合、配信は依頼元の深度に依存します:
  - 最上位の依頼元セッションは、外部配信付きのフォローアップ`agent`呼び出しを使います（`deliver=true`）
  - ネストされた依頼元subagentセッションは、内部フォローアップ注入を受け取ります（`deliver=false`）。これによりorchestratorがセッション内で子結果を統合できます
  - ネストされた依頼元subagentセッションが失われている場合、OpenClawは利用可能ならそのセッションの依頼元へフォールバックします
- 最上位の依頼元セッションでは、completion-mode直接配信はまず任意のバインド済みconversation/thread routeとhook overrideを解決し、その後、依頼元セッションの保存済みrouteから不足するchannel-target fieldを補完します。これにより、完了元がchannelしか識別しない場合でも、完了通知を正しいchat/topicに維持できます。
- ネストした完了検出を構築するとき、子の完了集約は現在の依頼元実行に限定されるため、古い過去実行の子出力が現在の通知に漏れることを防ぎます。
- 通知返信は、channel adapterで利用可能な場合、thread/topic routingを保持します。
- 通知コンテキストは、安定した内部イベントブロックへ正規化されます:
  - source（`subagent`または`cron`）
  - 子session key/id
  - 通知種別 + タスクラベル
  - ランタイム結果から導出されるstatus行（`success`、`error`、`timeout`、または`unknown`）
  - 最新の可視assistantテキストから選ばれた結果内容。なければサニタイズ済みの最新tool/toolResultテキスト。終端failed実行では、キャプチャ済み返信テキストを再生せず失敗statusを報告します
  - いつ返信し、いつ無言でいるべきかを記述するフォローアップ指示
- `Status`はモデル出力から推定されません。ランタイム結果シグナルから取得されます。
- タイムアウト時、子がtool呼び出しまでしか進んでいない場合、通知は生のtool出力を再生する代わりに、その履歴を短い部分進捗サマリーへ要約できることがあります。

通知payloadには、末尾に統計行が含まれます（ラップされている場合でも）。

- Runtime（例: `runtime 5m12s`）
- Token使用量（input/output/total）
- モデル価格設定が構成されている場合の推定コスト（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId`、およびtranscript path（メインagentが`sessions_history`で履歴を取得したり、ディスク上のファイルを確認したりできるようにするため）
- 内部メタデータはオーケストレーション専用です。ユーザー向け返信は通常のassistant voiceで書き直すべきです。

`sessions_history`は、より安全なオーケストレーション経路です。

- assistant再確認は最初に正規化されます:
  - thinkingタグは削除されます
  - `<relevant-memories>` / `<relevant_memories>` scaffoldブロックは削除されます
  - `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、および
    `<function_calls>...</function_calls>`のようなプレーンテキストtool-call XML payloadブロックは削除されます。きれいに閉じない切り詰められた
    payloadも含みます
  - 格下げされたtool-call/result scaffoldおよびhistorical-context markerは削除されます
  - `<|assistant|>`、その他のASCII
    `<|...|>`トークン、および全角の`<｜...｜>`バリアントのような漏洩したmodel control tokenは削除されます
  - 不正なMiniMax tool-call XMLは削除されます
- 資格情報/tokenらしいテキストはredactされます
- 長いブロックは切り詰められることがあります
- 非常に大きな履歴では、古い行が削除されたり、過大な行が
  `[sessions_history omitted: message too large]`に置き換えられたりすることがあります
- 生の完全なbyte-for-byte transcriptが必要な場合は、ディスク上のtranscript確認がフォールバックです

## ツールポリシー（sub-agentツール）

デフォルトでは、sub-agentは**sessionツール**とsystemツールを除く**すべてのツール**を取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

ここでも`sessions_history`は制限付きでサニタイズ済みの再確認ビューのままです。生のtranscript dumpではありません。

`maxSpawnDepth >= 2`の場合、深度1のorchestrator sub-agentはさらに`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`を取得し、子を管理できます。

設定で上書きします。

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

## 並行性

sub-agentは専用のin-process queue laneを使います。

- レーン名: `subagent`
- 並行数: `agents.defaults.subagents.maxConcurrent`（デフォルト`8`）

## 停止

- 依頼元チャットで`/stop`を送信すると、依頼元セッションが中断され、そこからspawnされたアクティブなsub-agent実行も停止し、ネストした子へカスケードします。
- `/subagents kill <id>`は、特定のsub-agentを停止し、その子へカスケードします。

## 制限事項

- sub-agent通知は**best-effort**です。gatewayが再起動すると、保留中の「通知して戻る」作業は失われます。
- sub-agentは依然として同じgateway processリソースを共有します。`maxConcurrent`は安全弁として扱ってください。
- `sessions_spawn`は常にnon-blockingです。即座に`{ status: "accepted", runId, childSessionKey }`を返します。
- sub-agentコンテキストは`AGENTS.md` + `TOOLS.md`のみを注入します（`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`は含まれません）。
- 最大ネスト深度は5です（`maxSpawnDepth`範囲: 1–5）。ほとんどのユースケースでは深度2が推奨されます。
- `maxChildrenPerAgent`は、セッションごとのアクティブな子数を制限します（デフォルト: 5、範囲: 1–20）。

## 関連

- [ACP agents](/ja-JP/tools/acp-agents)
- [Multi-agent sandbox tools](/ja-JP/tools/multi-agent-sandbox-tools)
- [Agent send](/ja-JP/tools/agent-send)
