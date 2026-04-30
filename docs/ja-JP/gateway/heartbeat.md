---
read_when:
    - Heartbeat の間隔またはメッセージングを調整する
    - スケジュールされたタスクで Heartbeat と Cron のどちらを使うかを決める
sidebarTitle: Heartbeat
summary: Heartbeat のポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-04-30T05:13:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bafae7cafb9163015a112c074d36ab070c71d1d7ba1c7c0834e6720521f4275
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat と Cron の違いは？** それぞれをいつ使うべきかの指針は、[自動化とタスク](/ja-JP/automation)を参照してください。
</Note>

Heartbeat はメインセッション内で **定期的なエージェントターン** を実行し、注意が必要なものをモデルがあなたに大量通知せずに表面化できるようにします。

Heartbeat はスケジュールされたメインセッションのターンです。[バックグラウンドタスク](/ja-JP/automation/tasks) レコードは作成**しません**。タスクレコードは、切り離された作業（ACP 実行、サブエージェント、分離された Cron ジョブ）用です。

トラブルシューティング: [スケジュール済みタスク](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート（初心者）

<Steps>
  <Step title="頻度を選ぶ">
    Heartbeat を有効のままにします（デフォルトは `30m`、または Claude CLI 再利用を含む Anthropic OAuth/トークン認証では `1h`）。必要に応じて独自の頻度を設定できます。
  </Step>
  <Step title="HEARTBEAT.md を追加する（任意）">
    エージェントワークスペースに小さな `HEARTBEAT.md` チェックリスト、または `tasks:` ブロックを作成します。
  </Step>
  <Step title="Heartbeat メッセージの送信先を決める">
    `target: "none"` がデフォルトです。最後の連絡先へルーティングするには `target: "last"` を設定します。
  </Step>
  <Step title="任意の調整">
    - 透明性のために Heartbeat 推論の配信を有効にします。
    - Heartbeat 実行に `HEARTBEAT.md` だけが必要な場合は、軽量なブートストラップコンテキストを使用します。
    - 各 Heartbeat で完全な会話履歴を送信しないように、分離セッションを有効にします。
    - Heartbeat をアクティブ時間帯（ローカル時刻）に制限します。

  </Step>
</Steps>

設定例:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## デフォルト

- 間隔: `30m`（Claude CLI 再利用を含む Anthropic OAuth/トークン認証が検出された認証モードの場合は `1h`）。`agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` を設定します。無効にするには `0m` を使用します。
- プロンプト本文（`agents.defaults.heartbeat.prompt` で設定可能）: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat プロンプトは、ユーザーメッセージとして**そのまま**送信されます。システムプロンプトには、デフォルトエージェントで Heartbeat が有効な場合にのみ「Heartbeat」セクションが含まれ、実行には内部的にフラグが付けられます。
- Heartbeat が `0m` で無効化されている場合、通常の実行でもブートストラップコンテキストから `HEARTBEAT.md` が除外されるため、モデルは Heartbeat 専用の指示を見ません。
- アクティブ時間帯（`heartbeat.activeHours`）は、設定されたタイムゾーンで確認されます。時間枠外では、Heartbeat は時間枠内の次のティックまでスキップされます。
- Heartbeat は Cron 作業がアクティブまたはキュー内にある間、自動的に延期されます。追加のビジーなレーン（サブエージェントまたはネストされたコマンド作業）でも延期するには `heartbeat.skipWhenBusy: true` を設定します。これはローカル Ollama やその他の制約のある単一ランタイムホストで便利です。

## Heartbeat プロンプトの用途

デフォルトのプロンプトは意図的に広めです。

- **バックグラウンドタスク**: 「Consider outstanding tasks」は、エージェントにフォローアップ（受信箱、カレンダー、リマインダー、キュー内の作業）を確認し、緊急のものを表面化するよう促します。
- **人間へのチェックイン**: 「Checkup sometimes on your human during day time」は、ときどき軽い「何か必要ですか？」というメッセージを促しますが、設定されたローカルタイムゾーン（[タイムゾーン](/ja-JP/concepts/timezone)を参照）を使うことで夜間の大量通知を避けます。

Heartbeat は完了した[バックグラウンドタスク](/ja-JP/automation/tasks)に反応できますが、Heartbeat 実行自体はタスクレコードを作成しません。

Heartbeat に非常に具体的なこと（例: 「Gmail PubSub 統計を確認する」や「Gateway の健全性を検証する」）をさせたい場合は、`agents.defaults.heartbeat.prompt`（または `agents.list[].heartbeat.prompt`）をカスタム本文（そのまま送信）に設定します。

## 応答契約

- 注意が必要なものがない場合は、**`HEARTBEAT_OK`** で返信します。
- Heartbeat 実行中、OpenClaw は返信の**先頭または末尾**に `HEARTBEAT_OK` が現れた場合、それを ack として扱います。このトークンは削除され、残りの内容が **≤ `ackMaxChars`**（デフォルト: 300）の場合、返信は破棄されます。
- `HEARTBEAT_OK` が返信の**途中**に現れた場合、特別扱いされません。
- アラートの場合、`HEARTBEAT_OK` を含め**ない**でください。アラート本文のみを返します。

Heartbeat 外では、メッセージの先頭または末尾に紛れ込んだ `HEARTBEAT_OK` は削除され、ログに記録されます。`HEARTBEAT_OK` だけのメッセージは破棄されます。

## 設定

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### スコープと優先順位

- `agents.defaults.heartbeat` はグローバルな Heartbeat 動作を設定します。
- `agents.list[].heartbeat` はその上にマージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、**それらのエージェントのみ**が Heartbeat を実行します。
- `channels.defaults.heartbeat` はすべてのチャンネルの可視性デフォルトを設定します。
- `channels.<channel>.heartbeat` はチャンネルデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（マルチアカウントチャンネル）は、チャンネルごとの設定を上書きします。

### エージェントごとのHeartbeat

`agents.list[]` のいずれかのエントリに `heartbeat` ブロックが含まれている場合、**それらのエージェントだけ**がHeartbeatを実行します。エージェントごとのブロックは `agents.defaults.heartbeat` の上にマージされます（そのため、共有デフォルトを一度設定し、エージェントごとに上書きできます）。

例: 2つのエージェントのうち、2つ目のエージェントだけがHeartbeatを実行します。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### アクティブ時間帯の例

特定のタイムゾーンの営業時間にHeartbeatを制限します。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

この時間枠の外（東部時間の午前9時前または午後10時後）では、Heartbeatはスキップされます。時間枠内の次のスケジュール済みティックは通常どおり実行されます。

### 24時間365日のセットアップ

Heartbeatを終日実行したい場合は、次のいずれかのパターンを使用します。

- `activeHours` を完全に省略します（時間枠の制限なし。これがデフォルトの動作です）。
- 終日の時間枠を設定します: `activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
同じ `start` と `end` 時刻（たとえば `08:00` から `08:00`）を設定しないでください。これは幅ゼロの時間枠として扱われるため、Heartbeatは常にスキップされます。
</Warning>

### 複数アカウントの例

Telegram のような複数アカウント対応チャンネルで特定のアカウントを対象にするには、`accountId` を使用します。

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### フィールドメモ

<ParamField path="every" type="string">
  Heartbeat間隔（期間文字列。デフォルト単位 = 分）。
</ParamField>
<ParamField path="model" type="string">
  Heartbeat実行用の任意のモデル上書き（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  有効にすると、利用可能な場合は別個の `Reasoning:` メッセージも配信します（`/reasoning on` と同じ形式）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true の場合、Heartbeat実行では軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` だけを保持します。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true の場合、各Heartbeatは過去の会話履歴がない新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンを使用します。Heartbeatごとのトークンコストを大幅に削減します。最大限に節約するには `lightContext: true` と組み合わせます。配信ルーティングには引き続きメインセッションのコンテキストが使用されます。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  true の場合、Heartbeat実行は追加のビジーレーン（サブエージェントまたはネストされたコマンド作業）で延期されます。Cron レーンでは、このフラグがなくても常にHeartbeatが延期されるため、local-model ホストは Cron とHeartbeatのプロンプトを同時に実行しません。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat実行用の任意のセッションキー。

- `main`（デフォルト）: エージェントのメインセッション。
- 明示的なセッションキー（`openclaw sessions --json` または [セッション CLI](/ja-JP/cli/sessions) からコピー）。
- セッションキー形式: [セッション](/ja-JP/concepts/session) と [グループ](/ja-JP/channels/groups) を参照してください。

</ParamField>
<ParamField path="target" type="string">
- `last`: 最後に使用された外部チャンネルに配信します。
- 明示的なチャンネル: 構成済みの任意のチャンネルまたは plugin id。たとえば `discord`、`matrix`、`telegram`、`whatsapp`。
- `none`（デフォルト）: Heartbeatを実行しますが、外部には**配信しません**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  直接/DM配信の動作を制御します。`allow`: 直接/DMでのHeartbeat配信を許可します。`block`: 直接/DMでの配信を抑制します（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  任意の受信者上書き（チャンネル固有の id。例: WhatsApp の E.164、または Telegram チャット id）。Telegram のトピック/スレッドでは、`<chatId>:topic:<messageThreadId>` を使用します。

</ParamField>
<ParamField path="accountId" type="string">
  複数アカウント対応チャンネル用の任意のアカウント id。`target: "last"` の場合、アカウント id は、解決された最後のチャンネルがアカウントをサポートしていればそこに適用されます。そうでない場合は無視されます。アカウント id が解決されたチャンネルの構成済みアカウントと一致しない場合、配信はスキップされます。

</ParamField>
<ParamField path="prompt" type="string">
  デフォルトのプロンプト本文を上書きします（マージされません）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  配信前に `HEARTBEAT_OK` の後に許可される最大文字数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat 実行を時間帯に制限します。`start`（HH:MM、含む。日の始まりには `00:00` を使用）、`end`（HH:MM、含まない。日の終わりには `24:00` を使用可能）、任意の `timezone` を持つオブジェクトです。

- 省略、または `"user"`: `agents.defaults.userTimezone` が設定されていればそれを使用し、そうでなければホストシステムのタイムゾーンにフォールバックします。
- `"local"`: 常にホストシステムのタイムゾーンを使用します。
- 任意の IANA 識別子（例: `America/New_York`）: 直接使用されます。無効な場合は、上記の `"user"` の動作にフォールバックします。
- アクティブウィンドウでは、`start` と `end` は同じであってはなりません。同じ値は幅ゼロ（常にウィンドウ外）として扱われます。
- アクティブウィンドウ外では、ウィンドウ内の次の tick まで Heartbeat はスキップされます。

</ParamField>

## 配信の動作

<AccordionGroup>
  <Accordion title="セッションとターゲットのルーティング">
    - Heartbeat はデフォルトでエージェントのメインセッション（`agent:<id>:<mainKey>`）で実行されます。`session.scope = "global"` の場合は `global` で実行されます。特定のチャネルセッション（Discord/WhatsApp など）に上書きするには `session` を設定します。
    - `session` は実行コンテキストにのみ影響します。配信は `target` と `to` によって制御されます。
    - 特定のチャネル/受信者に配信するには、`target` + `to` を設定します。`target: "last"` の場合、配信はそのセッションの最後の外部チャネルを使用します。
    - Heartbeat 配信では、デフォルトで直接/DM ターゲットが許可されます。Heartbeat ターンは引き続き実行しながら直接ターゲットへの送信を抑制するには、`directPolicy: "block"` を設定します。
    - メインキュー、ターゲットセッションレーン、Cron レーン、またはアクティブな Cron ジョブがビジーの場合、Heartbeat はスキップされ、後で再試行されます。
    - `skipWhenBusy: true` の場合、サブエージェントとネストされたレーンも Heartbeat 実行を延期します。
    - `target` が外部宛先に解決されない場合でも、実行は行われますが、送信メッセージは送られません。

  </Accordion>
  <Accordion title="可視性とスキップ動作">
    - `showOk`、`showAlerts`、`useIndicator` がすべて無効な場合、実行は最初に `reason=alerts-disabled` としてスキップされます。
    - アラート配信だけが無効な場合でも、OpenClaw は Heartbeat を実行し、期限タスクのタイムスタンプを更新し、セッションのアイドルタイムスタンプを復元し、外向きのアラートペイロードを抑制できます。
    - 解決された Heartbeat ターゲットが入力中表示をサポートしている場合、OpenClaw は Heartbeat 実行がアクティブな間、入力中を表示します。これは Heartbeat がチャット出力を送信するのと同じターゲットを使用し、`typingMode: "never"` によって無効化されます。

  </Accordion>
  <Accordion title="セッションのライフサイクルと監査">
    - Heartbeat のみの返信は、セッションを存続させ**ません**。Heartbeat メタデータがセッション行を更新する場合はありますが、アイドル期限切れは最後の実ユーザー/チャネルメッセージの `lastInteractionAt` を使用し、日次の期限切れは `sessionStartedAt` を使用します。
    - Control UI と WebChat 履歴は、Heartbeat プロンプトと OK のみの確認応答を非表示にします。基盤となるセッショントランスクリプトには、監査/リプレイ用にそれらのターンが引き続き含まれる場合があります。
    - 分離された [バックグラウンドタスク](/ja-JP/automation/tasks) は、メインセッションが何かにすばやく気づく必要がある場合に、システムイベントをキューに入れて Heartbeat を起動できます。その起動によって Heartbeat 実行がバックグラウンドタスクになるわけではありません。

  </Accordion>
</AccordionGroup>

## 可視性コントロール

デフォルトでは、アラート内容は配信される一方で、`HEARTBEAT_OK` 確認応答は抑制されます。これはチャネルごと、またはアカウントごとに調整できます。

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

優先順位: アカウントごと → チャネルごと → チャネルのデフォルト → 組み込みのデフォルト。

### 各フラグの役割

- `showOk`: モデルが OK のみの返信を返したときに、`HEARTBEAT_OK` 確認応答を送信します。
- `showAlerts`: モデルが OK 以外の返信を返したときに、アラート内容を送信します。
- `useIndicator`: UI ステータスサーフェス向けのインジケーターイベントを発行します。

**3 つすべて**が false の場合、OpenClaw は Heartbeat 実行を完全にスキップします（モデル呼び出しなし）。

### チャネルごととアカウントごとの例

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### 一般的なパターン

| 目的                                     | 設定                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| デフォルトの動作（OK は無音、アラートは有効） | _(設定不要)_                                                                             |
| 完全に無音（メッセージなし、インジケーターなし） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| インジケーターのみ（メッセージなし）     | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1 つのチャネルだけで OK を表示           | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（任意）

ワークスペースに `HEARTBEAT.md` ファイルが存在する場合、デフォルトのプロンプトはエージェントにそれを読むよう指示します。これは「Heartbeat チェックリスト」と考えてください。小さく、安定していて、30 分ごとに含めても安全なものです。

通常の実行では、`HEARTBEAT.md` はデフォルトエージェントで Heartbeat ガイダンスが有効な場合にのみ注入されます。`0m` で Heartbeat の周期を無効にするか、`includeSystemPromptSection: false` を設定すると、通常のブートストラップコンテキストから除外されます。

`HEARTBEAT.md` が存在しても実質的に空（空行と `# Heading` のような Markdown 見出しのみ）の場合、OpenClaw は API 呼び出しを節約するために Heartbeat 実行をスキップします。そのスキップは `reason=empty-heartbeat-file` として報告されます。ファイルがない場合でも Heartbeat は実行され、モデルが何をするかを決定します。

プロンプトの肥大化を避けるため、小さく保ってください（短いチェックリストやリマインダー）。

`HEARTBEAT.md` の例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` ブロック

`HEARTBEAT.md` は、Heartbeat 自体の中で間隔ベースのチェックを行うための小さな構造化 `tasks:` ブロックもサポートします。

例:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="動作">
    - OpenClaw は `tasks:` ブロックを解析し、各タスクをそれぞれの `interval` と照合します。
    - その tick で期限が来ているタスクだけが Heartbeat プロンプトに含まれます。
    - 期限のタスクがない場合、無駄なモデル呼び出しを避けるため、Heartbeat は完全にスキップされます（`reason=no-tasks-due`）。
    - `HEARTBEAT.md` 内のタスク以外の内容は保持され、期限タスクリストの後に追加コンテキストとして付加されます。
    - タスクの最終実行タイムスタンプはセッション状態（`heartbeatTaskState`）に保存されるため、通常の再起動後も間隔は維持されます。
    - タスクのタイムスタンプは、Heartbeat 実行が通常の返信パスを完了した後にのみ進められます。スキップされた `empty-heartbeat-file` / `no-tasks-due` 実行では、タスクは完了としてマークされません。

  </Accordion>
</AccordionGroup>

タスクモードは、1 つの Heartbeat ファイルに複数の定期チェックを保持し、毎 tick すべてにコストを払いたくない場合に便利です。

### エージェントは HEARTBEAT.md を更新できますか？

はい。そう依頼すれば更新できます。

`HEARTBEAT.md` はエージェントワークスペース内の通常のファイルなので、通常のチャットでエージェントに次のように伝えられます。

- 「`HEARTBEAT.md` を更新して、日次のカレンダーチェックを追加してください。」
- 「`HEARTBEAT.md` を短くして、受信箱のフォローアップに集中するよう書き直してください。」

これを能動的に行わせたい場合は、Heartbeat プロンプトに次のような明示的な行を含めることもできます: 「チェックリストが古くなったら、よりよい内容で HEARTBEAT.md を更新してください。」

<Warning>
`HEARTBEAT.md` にはシークレット（API キー、電話番号、プライベートトークン）を入れないでください。プロンプトコンテキストの一部になります。
</Warning>

## 手動起動（オンデマンド）

次のコマンドでシステムイベントをキューに入れ、即時 Heartbeat をトリガーできます。

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

複数のエージェントに `heartbeat` が設定されている場合、手動起動はそれら各エージェントの Heartbeat をただちに実行します。

次にスケジュールされた tick まで待つには、`--mode next-heartbeat` を使用します。

## Reasoning の配信（任意）

デフォルトでは、Heartbeat は最終的な「回答」ペイロードだけを配信します。

透明性が必要な場合は、次を有効にします。

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、Heartbeat は `Reasoning:` というプレフィックスが付いた別メッセージも配信します（`/reasoning on` と同じ形）。これは、エージェントが複数のセッション/codex を管理していて、なぜ通知すると判断したのかを確認したい場合に便利です。ただし、望む以上に内部詳細が漏れる可能性もあります。グループチャットではオフのままにすることを推奨します。

## コスト意識

Heartbeat は完全なエージェントターンを実行します。間隔を短くすると、より多くのトークンを消費します。コストを削減するには:

- 完全な会話履歴を送信しないように `isolatedSession: true` を使用します（実行あたり約 100K トークンから約 2-5K へ）。
- ブートストラップファイルを `HEARTBEAT.md` のみに制限するには `lightContext: true` を使用します。
- より安価な `model`（例: `ollama/llama3.2:1b`）を設定します。
- `HEARTBEAT.md` を小さく保ちます。
- 内部状態の更新だけが必要な場合は、`target: "none"` を使用します。

## Heartbeat 後のコンテキストオーバーフロー

Heartbeat が、たとえば 32k ウィンドウの Ollama モデルのような小さいローカルモデルを使用し、その次のメインセッションターンでコンテキストオーバーフローが報告される場合は、前回の Heartbeat がセッションを Heartbeat モデルのままにしていないか確認してください。最後のランタイムモデルが設定済みの `heartbeat.model` と一致する場合、OpenClaw のリセットメッセージはその点を明示します。

Heartbeat を新しいセッションで実行するには `isolatedSession: true` を使用し、最小のプロンプトにするには `lightContext: true` と組み合わせます。または、共有セッションに十分な大きさのコンテキストウィンドウを持つ Heartbeat モデルを選択してください。

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 分離された作業の追跡方法
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーンが Heartbeat スケジュールに与える影響
- [トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting) — 自動化の問題のデバッグ方法
