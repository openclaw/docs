---
read_when:
    - Heartbeatの頻度またはメッセージングの調整
    - スケジュールされたタスクで Heartbeat と Cron のどちらを使うかを決める
sidebarTitle: Heartbeat
summary: Heartbeatのポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T20:47:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat と cron の違い** それぞれをいつ使うべきかについては、[自動化とタスク](/ja-JP/automation)を参照してください。
</Note>

Heartbeat は、注意が必要なことをモデルが必要に応じて提示できるように、メインセッションで**定期的なエージェントターン**を実行します。通知を大量に送ることはありません。

Heartbeat はスケジュールされたメインセッションのターンです。[background task](/ja-JP/automation/tasks) レコードは作成**しません**。タスクレコードは、切り離された作業（ACP 実行、サブエージェント、分離された cron ジョブ）用です。

トラブルシューティング: [スケジュール済みタスク](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート（初心者向け）

<Steps>
  <Step title="実行間隔を選ぶ">
    Heartbeat は有効のままにします（デフォルトは `30m`。Anthropic OAuth/トークン認証の場合は Claude CLI の再利用を含めて `1h`）または独自の間隔を設定します。
  </Step>
  <Step title="HEARTBEAT.md を追加する（任意）">
    エージェントのワークスペースに、小さな `HEARTBEAT.md` チェックリストまたは `tasks:` ブロックを作成します。
  </Step>
  <Step title="Heartbeat メッセージの送信先を決める">
    `target: "none"` がデフォルトです。最後の連絡先にルーティングするには `target: "last"` を設定します。
  </Step>
  <Step title="任意の調整">
    - 透明性のために、Heartbeat の推論配信を有効にします。
    - Heartbeat の実行で `HEARTBEAT.md` だけが必要な場合は、軽量なブートストラップコンテキストを使用します。
    - Heartbeat ごとに完全な会話履歴を送らないよう、分離セッションを有効にします。
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

- 間隔: `30m`（検出された認証モードが Anthropic OAuth/トークン認証の場合は Claude CLI の再利用を含めて `1h`）。`agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` を設定します。無効にするには `0m` を使用します。
- プロンプト本文（`agents.defaults.heartbeat.prompt` で設定可能）: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat プロンプトは、ユーザーメッセージとして**そのまま**送信されます。システムプロンプトには、デフォルトエージェントで Heartbeat が有効な場合にのみ "Heartbeat" セクションが含まれ、その実行は内部的にフラグ付けされます。
- `0m` で Heartbeat が無効化されている場合、通常の実行でもブートストラップコンテキストから `HEARTBEAT.md` が省略されるため、モデルは Heartbeat 専用の指示を参照しません。
- アクティブ時間帯（`heartbeat.activeHours`）は、設定されたタイムゾーンで確認されます。時間枠外では、時間枠内の次の tick まで Heartbeat はスキップされます。
- cron 作業がアクティブまたはキュー済みの間、Heartbeat は自動的に延期されます。追加のビジーなレーン（サブエージェントまたはネストされたコマンド作業）でも延期するには `heartbeat.skipWhenBusy: true` を設定します。これは、ローカル Ollama やその他の制約のある単一ランタイムホストで有用です。

## Heartbeat プロンプトの用途

デフォルトのプロンプトは意図的に広めに設定されています。

- **バックグラウンドタスク**: "Consider outstanding tasks" は、エージェントにフォローアップ（受信箱、カレンダー、リマインダー、キュー済み作業）を確認し、緊急のものがあれば提示するよう促します。
- **人への確認**: "Checkup sometimes on your human during day time" は、ときどき軽い "anything you need?" メッセージを促しますが、設定済みのローカルタイムゾーンを使うことで夜間の迷惑通知を避けます（[タイムゾーン](/ja-JP/concepts/timezone)を参照）。

Heartbeat は完了した [background tasks](/ja-JP/automation/tasks) に反応できますが、Heartbeat 実行自体はタスクレコードを作成しません。

Heartbeat に非常に具体的なこと（例: "check Gmail PubSub stats" や "verify gateway health"）をさせたい場合は、`agents.defaults.heartbeat.prompt`（または `agents.list[].heartbeat.prompt`）をカスタム本文（そのまま送信されます）に設定します。

## 応答契約

- 注意が必要なものがなければ、**`HEARTBEAT_OK`** と返信します。
- ツールを利用できる Heartbeat 実行では、表示される更新が不要な場合に `notify: false` で `heartbeat_respond` を呼び出すことも、アラート用に `notify: true` と `notificationText` を指定することもできます。構造化されたツール応答が存在する場合は、テキストのフォールバックより優先されます。
- Heartbeat 実行中、返信の**先頭または末尾**に `HEARTBEAT_OK` が現れると、OpenClaw はそれを ack として扱います。このトークンは取り除かれ、残りの内容が **≤ `ackMaxChars`**（デフォルト: 300）の場合、その返信は破棄されます。
- `HEARTBEAT_OK` が返信の**途中**に現れた場合、特別扱いはされません。
- アラートの場合は、`HEARTBEAT_OK` を含め**ないでください**。アラート本文のみを返します。

Heartbeat 以外では、メッセージの先頭または末尾にある意図しない `HEARTBEAT_OK` は取り除かれてログに記録されます。`HEARTBEAT_OK` だけのメッセージは破棄されます。

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

- `agents.defaults.heartbeat` はグローバルな Heartbeat の動作を設定します。
- `agents.list[].heartbeat` はその上にマージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、Heartbeat を実行するのは**それらのエージェントのみ**です。
- `channels.defaults.heartbeat` はすべてのチャンネルの表示デフォルトを設定します。
- `channels.<channel>.heartbeat` はチャンネルのデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（複数アカウントのチャンネル）は、チャンネルごとの設定を上書きします。

### エージェントごとの Heartbeat

`agents.list[]` エントリのいずれかに `heartbeat` ブロックが含まれる場合、Heartbeat を実行するのは**それらのエージェントのみ**です。エージェントごとのブロックは `agents.defaults.heartbeat` の上にマージされます（共有デフォルトを一度設定し、エージェントごとに上書きできます）。

例: 2 つのエージェントのうち、2 番目のエージェントだけが Heartbeat を実行します。

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

特定のタイムゾーンの営業時間に Heartbeat を制限します。

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

この時間枠外（米国東部時間の午前 9 時前または午後 10 時後）では、Heartbeat はスキップされます。時間枠内の次のスケジュール tick は通常どおり実行されます。

### 24 時間 365 日の設定

Heartbeat を一日中実行したい場合は、次のいずれかのパターンを使用します。

- `activeHours` を完全に省略します（時間枠の制限なし。これがデフォルトの動作です）。
- 終日の時間枠を設定します: `activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
同じ `start` 時刻と `end` 時刻（例: `08:00` から `08:00`）を設定しないでください。これは幅 0 の時間枠として扱われるため、Heartbeat は常にスキップされます。
</Warning>

### 複数アカウントの例

Telegram のような複数アカウントのチャンネルで特定のアカウントを対象にするには、`accountId` を使用します。

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
  Heartbeat の間隔（期間文字列。デフォルト単位 = 分）。
</ParamField>
<ParamField path="model" type="string">
  Heartbeat 実行用の任意のモデル上書き（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  有効にすると、利用可能な場合に別個の `Reasoning:` メッセージも配信します（`/reasoning on` と同じ形式）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true の場合、Heartbeat 実行は軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルからは `HEARTBEAT.md` だけを保持します。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true の場合、各 Heartbeat は過去の会話履歴のない新しいセッションで実行されます。cron `sessionTarget: "isolated"` と同じ分離パターンを使用します。Heartbeat ごとのトークンコストを大幅に削減します。最大限に節約するには `lightContext: true` と組み合わせます。配信ルーティングには引き続きメインセッションのコンテキストが使用されます。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  true の場合、Heartbeat 実行は追加のビジーなレーン（サブエージェントまたはネストされたコマンド作業）で延期されます。cron レーンはこのフラグがなくても常に Heartbeat を延期するため、ローカルモデルホストが cron と Heartbeat プロンプトを同時に実行することはありません。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 実行用の任意のセッションキー。

- `main`（デフォルト）: エージェントのメインセッション。
- 明示的なセッションキー（`openclaw sessions --json` または [セッション CLI](/ja-JP/cli/sessions) からコピー）。
- セッションキーの形式: [セッション](/ja-JP/concepts/session) と [グループ](/ja-JP/channels/groups) を参照してください。

</ParamField>
<ParamField path="target" type="string">
- `last`: 最後に使用した外部チャンネルへ配信します。
- 明示的なチャンネル: 設定済みの任意のチャンネルまたは plugin id。例: `discord`、`matrix`、`telegram`、`whatsapp`。
- `none`（デフォルト）: Heartbeat は実行しますが、外部には**配信しません**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  直接/DM 配信の動作を制御します。`allow`: 直接/DM の Heartbeat 配信を許可します。`block`: 直接/DM 配信を抑制します（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  任意の受信者上書き（チャンネル固有の ID。例: WhatsApp の E.164 または Telegram チャット ID）。Telegram のトピック/スレッドでは、`<chatId>:topic:<messageThreadId>` を使用します。

</ParamField>
<ParamField path="accountId" type="string">
  複数アカウントのチャンネル用の任意のアカウント ID。`target: "last"` の場合、解決された最後のチャンネルがアカウントに対応していれば、そのアカウント ID が適用されます。それ以外の場合は無視されます。アカウント ID が解決されたチャンネルに設定済みのアカウントと一致しない場合、配信はスキップされます。

</ParamField>
<ParamField path="prompt" type="string">
  デフォルトのプロンプト本文を上書きします（マージされません）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  配信前に `HEARTBEAT_OK` の後へ許可される最大文字数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true の場合、Heartbeat実行中のツールエラー警告ペイロードを抑制します。

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat実行を時間帯に制限します。`start` (HH:MM、含む。日の開始には `00:00` を使用)、`end` (HH:MM、含まない。日の終了には `24:00` を使用可能)、および任意の `timezone` を持つオブジェクトです。

- 省略または `"user"`: 設定されていれば `agents.defaults.userTimezone` を使用し、そうでなければホストシステムのタイムゾーンへフォールバックします。
- `"local"`: 常にホストシステムのタイムゾーンを使用します。
- 任意の IANA 識別子 (例: `America/New_York`): 直接使用されます。無効な場合は、上記の `"user"` の動作へフォールバックします。
- アクティブウィンドウでは、`start` と `end` が同じであってはなりません。同じ値は幅ゼロとして扱われます (常にウィンドウ外)。
- アクティブウィンドウ外では、ウィンドウ内の次のティックまで Heartbeat はスキップされます。

</ParamField>

## 配信の動作

<AccordionGroup>
  <Accordion title="セッションとターゲットのルーティング">
    - Heartbeatは、デフォルトでエージェントのメインセッション (`agent:<id>:<mainKey>`) で実行されます。`session.scope = "global"` の場合は `global` で実行されます。特定のチャネルセッション (Discord/WhatsApp/など) に上書きするには `session` を設定します。
    - `session` は実行コンテキストのみに影響します。配信は `target` と `to` によって制御されます。
    - 特定のチャネル/受信者へ配信するには、`target` + `to` を設定します。`target: "last"` の場合、配信はそのセッションの最後の外部チャネルを使用します。
    - Heartbeat配信では、デフォルトで直接/DM ターゲットが許可されます。Heartbeatターンは引き続き実行しつつ、直接ターゲットへの送信を抑制するには `directPolicy: "block"` を設定します。
    - メインキュー、ターゲットセッションレーン、cron レーン、またはアクティブな cron ジョブがビジーの場合、Heartbeatはスキップされ、後で再試行されます。
    - `skipWhenBusy: true` の場合、サブエージェントおよびネストされたレーンも Heartbeat実行を延期します。
    - `target` が外部宛先に解決されない場合でも、実行自体は行われますが、送信メッセージは送られません。

  </Accordion>
  <Accordion title="可視性とスキップ動作">
    - `showOk`、`showAlerts`、`useIndicator` がすべて無効な場合、実行は最初から `reason=alerts-disabled` としてスキップされます。
    - アラート配信のみが無効な場合でも、OpenClaw は Heartbeatを実行し、期限タスクのタイムスタンプを更新し、セッションのアイドルタイムスタンプを復元し、外向きのアラートペイロードを抑制できます。
    - 解決された Heartbeatターゲットが入力中表示に対応している場合、OpenClaw は Heartbeat実行がアクティブな間、入力中を表示します。これは Heartbeatがチャット出力を送信するのと同じターゲットを使用し、`typingMode: "never"` によって無効化されます。

  </Accordion>
  <Accordion title="セッションのライフサイクルと監査">
    - Heartbeatのみの返信は、セッションを維持しません。Heartbeatメタデータはセッション行を更新する場合がありますが、アイドル期限切れは最後の実際のユーザー/チャネルメッセージの `lastInteractionAt` を使用し、日次期限切れは `sessionStartedAt` を使用します。
    - Control UI と WebChat の履歴では、Heartbeatプロンプトと OK のみの確認応答は非表示になります。基礎となるセッショントランスクリプトには、監査/リプレイ用にそれらのターンが引き続き含まれる場合があります。
    - 切り離された[バックグラウンドタスク](/ja-JP/automation/tasks)は、メインセッションが何かにすばやく気付く必要がある場合に、システムイベントをキューへ追加し、Heartbeatを起動できます。その起動によって、Heartbeat実行がバックグラウンドタスクになるわけではありません。

  </Accordion>
</AccordionGroup>

## 可視性の制御

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

### 各フラグの動作

- `showOk`: モデルが OK のみの返信を返したときに、`HEARTBEAT_OK` 確認応答を送信します。
- `showAlerts`: モデルが OK ではない返信を返したときに、アラート内容を送信します。
- `useIndicator`: UI ステータスサーフェス用のインジケーターイベントを発行します。

**3 つすべて** が false の場合、OpenClaw は Heartbeat実行を完全にスキップします (モデル呼び出しなし)。

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

### よくあるパターン

| 目的                                     | 設定                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| デフォルトの動作 (OK は無音、アラートはオン) | _(設定不要)_                                                                             |
| 完全に無音 (メッセージなし、インジケーターなし) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| インジケーターのみ (メッセージなし)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1 つのチャネルでのみ OK を表示                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (任意)

ワークスペースに `HEARTBEAT.md` ファイルが存在する場合、デフォルトプロンプトはエージェントにそれを読むよう指示します。これは「Heartbeatチェックリスト」と考えてください。小さく、安定していて、30 分ごとに含めても安全なものです。

通常の実行では、`HEARTBEAT.md` はデフォルトエージェントで Heartbeatガイダンスが有効な場合にのみ注入されます。`0m` で Heartbeat cadence を無効にするか、`includeSystemPromptSection: false` を設定すると、通常のブートストラップコンテキストから省略されます。

`HEARTBEAT.md` が存在していても実質的に空 (空行と `# Heading` のような Markdown ヘッダーのみ) の場合、OpenClaw は API 呼び出しを節約するために Heartbeat実行をスキップします。そのスキップは `reason=empty-heartbeat-file` として報告されます。ファイルがない場合でも Heartbeatは実行され、モデルが何をするかを判断します。

プロンプトの肥大化を避けるため、小さく保ってください (短いチェックリストまたはリマインダー)。

`HEARTBEAT.md` の例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` ブロック

`HEARTBEAT.md` は、Heartbeat自体の中で間隔ベースのチェックを行うための小さな構造化 `tasks:` ブロックにも対応しています。

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
    - OpenClaw は `tasks:` ブロックを解析し、各タスクをそれぞれの `interval` に照らしてチェックします。
    - そのティックで期限が来ているタスクのみが Heartbeatプロンプトに含まれます。
    - 期限が来ているタスクがない場合、無駄なモデル呼び出しを避けるため、Heartbeatは完全にスキップされます (`reason=no-tasks-due`)。
    - `HEARTBEAT.md` 内のタスク以外の内容は保持され、期限タスクリストの後に追加コンテキストとして付加されます。
    - タスクの最終実行タイムスタンプはセッション状態 (`heartbeatTaskState`) に保存されるため、通常の再起動後も間隔は維持されます。
    - タスクのタイムスタンプは、Heartbeat実行が通常の返信パスを完了した後にのみ進められます。スキップされた `empty-heartbeat-file` / `no-tasks-due` 実行では、タスクは完了としてマークされません。

  </Accordion>
</AccordionGroup>

タスクモードは、1 つの Heartbeatファイルに複数の定期チェックを保持し、毎ティックすべてに対してコストを払いたくない場合に便利です。

### エージェントは HEARTBEAT.md を更新できますか?

はい — 依頼すればできます。

`HEARTBEAT.md` はエージェントワークスペース内の通常のファイルなので、通常のチャットでエージェントに次のように伝えられます。

- 「毎日のカレンダーチェックを追加するように `HEARTBEAT.md` を更新して。」
- 「`HEARTBEAT.md` をもっと短くし、受信トレイのフォローアップに集中するよう書き直して。」

これを能動的に行いたい場合は、Heartbeatプロンプトに次のような明示的な行を含めることもできます: 「チェックリストが古くなったら、より良いものに `HEARTBEAT.md` を更新してください。」

<Warning>
`HEARTBEAT.md` にシークレット (API キー、電話番号、プライベートトークン) を入れないでください。これはプロンプトコンテキストの一部になります。
</Warning>

## 手動起動 (オンデマンド)

次のコマンドで、システムイベントをキューに追加し、即時 Heartbeatをトリガーできます。

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

複数のエージェントで `heartbeat` が設定されている場合、手動起動はそれら各エージェントの Heartbeatを即時実行します。

次のスケジュール済みティックまで待つには `--mode next-heartbeat` を使用します。

## 推論の配信 (任意)

デフォルトでは、Heartbeatは最終的な「回答」ペイロードのみを配信します。

透明性が必要な場合は、次を有効にします。

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、Heartbeatは `Reasoning:` というプレフィックス付きの別メッセージも配信します (`/reasoning on` と同じ形)。これは、エージェントが複数のセッション/codex を管理しており、なぜあなたに通知することにしたのかを確認したい場合に便利です。ただし、望む以上に内部詳細が漏れる可能性もあります。グループチャットではオフのままにすることを推奨します。

## コスト意識

Heartbeatは完全なエージェントターンを実行します。間隔が短いほど、より多くのトークンを消費します。コストを削減するには:

- 完全な会話履歴の送信を避けるために `isolatedSession: true` を使用します (実行あたり約 100K トークンから約 2-5K へ)。
- ブートストラップファイルを `HEARTBEAT.md` のみに制限するために `lightContext: true` を使用します。
- より安価な `model` を設定します (例: `ollama/llama3.2:1b`)。
- `HEARTBEAT.md` を小さく保ちます。
- 内部状態の更新だけが必要な場合は `target: "none"` を使用します。

## Heartbeat後のコンテキストオーバーフロー

以前の Heartbeatによって既存セッションが、たとえば 32k ウィンドウを持つ Ollama モデルのような小さなローカルモデル上に残され、次のメインセッションターンでコンテキストオーバーフローが報告された場合は、セッションのランタイムモデルを設定済みのプライマリモデルに戻してください。OpenClaw のリセットメッセージは、最後のランタイムモデルが設定済みの `heartbeat.model` と一致する場合にこれを明示します。

現在の Heartbeatは、実行完了後に共有セッションの既存ランタイムモデルを保持します。それでも、Heartbeatを新しいセッションで実行するために `isolatedSession: true` を使用したり、最小のプロンプトにするために `lightContext: true` と組み合わせたり、共有セッションに十分な大きさのコンテキストウィンドウを持つ Heartbeatモデルを選んだりできます。

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 切り離された作業がどのように追跡されるか
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーンが Heartbeatスケジュールに与える影響
- [トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting) — 自動化の問題のデバッグ
