---
read_when:
    - Heartbeat の頻度またはメッセージ内容を調整する
    - スケジュールされたタスクで Heartbeat と Cron のどちらを選ぶか
sidebarTitle: Heartbeat
summary: Heartbeat のポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-05-10T19:35:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c4a4076ff4c7a88b47a9bb4daff56b3075173e79409a991ac564ad6ab305a9d
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat と cron の違いは？** それぞれをいつ使うべきかについては、[自動化とタスク](/ja-JP/automation)を参照してください。
</Note>

Heartbeat はメインセッションで**定期的なエージェントターン**を実行し、モデルが注意を要するものを、通知を大量送信せずに浮かび上がらせられるようにします。

Heartbeat はスケジュールされたメインセッションのターンです。[バックグラウンドタスク](/ja-JP/automation/tasks)レコードは作成**しません**。タスクレコードは、切り離された作業（ACP 実行、サブエージェント、分離された cron ジョブ）用です。

トラブルシューティング: [スケジュールされたタスク](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート（初心者向け）

<Steps>
  <Step title="Pick a cadence">
    Heartbeat は有効のままにします（デフォルトは `30m`、または Anthropic OAuth/トークン認証では Claude CLI の再利用を含めて `1h`）。または独自の頻度を設定します。
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    エージェントワークスペースに小さな `HEARTBEAT.md` チェックリスト、または `tasks:` ブロックを作成します。
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` がデフォルトです。最後の連絡先へルーティングするには `target: "last"` を設定します。
  </Step>
  <Step title="Optional tuning">
    - 透明性のために Heartbeat 推論の配信を有効にします。
    - Heartbeat 実行に `HEARTBEAT.md` だけが必要な場合は、軽量なブートストラップコンテキストを使用します。
    - Heartbeat ごとに会話履歴全体を送信しないように、分離セッションを有効にします。
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

- 間隔: `30m`（検出された認証モードが Anthropic OAuth/トークン認証の場合は、Claude CLI の再利用を含めて `1h`）。`agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` を設定します。無効化するには `0m` を使用します。
- プロンプト本文（`agents.defaults.heartbeat.prompt` で設定可能）: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat プロンプトは、ユーザーメッセージとして**そのまま**送信されます。システムプロンプトには、デフォルトエージェントで Heartbeat が有効な場合にのみ「Heartbeat」セクションが含まれ、実行は内部的にフラグ付けされます。
- Heartbeat が `0m` で無効化されている場合、通常の実行でもブートストラップコンテキストから `HEARTBEAT.md` が省略されるため、モデルは Heartbeat 専用の指示を見ません。
- アクティブ時間帯（`heartbeat.activeHours`）は、設定されたタイムゾーンで確認されます。時間枠外では、時間枠内の次のティックまで Heartbeat はスキップされます。
- cron 作業がアクティブまたはキューに入っている間、Heartbeat は自動的に延期されます。追加のビジーレーン（サブエージェントまたはネストされたコマンド作業）でも延期するには、`heartbeat.skipWhenBusy: true` を設定します。これは、ローカル Ollama やその他の制約のある単一ランタイムホストで役立ちます。

## Heartbeat プロンプトの目的

デフォルトプロンプトは意図的に広めに設定されています。

- **バックグラウンドタスク**: 「Consider outstanding tasks」は、エージェントにフォローアップ（受信箱、カレンダー、リマインダー、キューに入った作業）を確認し、緊急のものを浮かび上がらせるよう促します。
- **人間への確認**: 「Checkup sometimes on your human during day time」は、時々軽い「何か必要ですか？」メッセージを促しますが、設定済みのローカルタイムゾーンを使うことで夜間のスパムを避けます（[タイムゾーン](/ja-JP/concepts/timezone)を参照）。

Heartbeat は完了した[バックグラウンドタスク](/ja-JP/automation/tasks)に反応できますが、Heartbeat 実行自体はタスクレコードを作成しません。

Heartbeat に非常に具体的なこと（例: 「Gmail PubSub の統計を確認する」または「Gateway の健全性を検証する」）をさせたい場合は、`agents.defaults.heartbeat.prompt`（または `agents.list[].heartbeat.prompt`）をカスタム本文（そのまま送信）に設定します。

## レスポンス契約

- 注意が必要なものがない場合は、**`HEARTBEAT_OK`** と返信します。
- ツール対応の Heartbeat 実行では、表示更新なしの場合は `notify: false` で `heartbeat_respond` を呼び出すことも、アラートの場合は `notify: true` と `notificationText` を指定することもできます。構造化ツールレスポンスがある場合は、テキストフォールバックより優先されます。
- Heartbeat 実行中、返信の**先頭または末尾**に `HEARTBEAT_OK` が現れると、OpenClaw はそれを ack として扱います。このトークンは取り除かれ、残りの内容が **≤ `ackMaxChars`**（デフォルト: 300）の場合、返信は破棄されます。
- 返信の**途中**に `HEARTBEAT_OK` が現れた場合、特別には扱われません。
- アラートでは、`HEARTBEAT_OK` を含め**ない**でください。アラート本文だけを返します。

Heartbeat 以外では、メッセージの先頭/末尾にある意図しない `HEARTBEAT_OK` は取り除かれてログに記録されます。`HEARTBEAT_OK` だけのメッセージは破棄されます。

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
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
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
- `agents.list[].heartbeat` はその上にマージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、**それらのエージェントだけ**が Heartbeat を実行します。
- `channels.defaults.heartbeat` はすべてのチャネルの可視性デフォルトを設定します。
- `channels.<channel>.heartbeat` はチャネルデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（複数アカウントチャネル）はチャネルごとの設定を上書きします。

### エージェントごとの Heartbeat

`agents.list[]` のいずれかのエントリに `heartbeat` ブロックが含まれる場合、**それらのエージェントだけ**が Heartbeat を実行します。エージェントごとのブロックは `agents.defaults.heartbeat` の上にマージされます（共有デフォルトを一度設定し、エージェントごとに上書きできます）。

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

この時間枠外（東部時間の午前 9 時前または午後 10 時後）では、Heartbeat はスキップされます。時間枠内の次のスケジュール済みティックは通常どおり実行されます。

### 24 時間 365 日の設定

Heartbeat を終日実行したい場合は、次のいずれかのパターンを使用します。

- `activeHours` を完全に省略します（時間枠制限なし。これがデフォルト動作です）。
- 終日ウィンドウを設定します: `activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
同じ `start` 時刻と `end` 時刻を設定しないでください（たとえば `08:00` から `08:00`）。これは幅 0 の時間枠として扱われるため、Heartbeat は常にスキップされます。
</Warning>

### 複数アカウントの例

Telegram のような複数アカウントチャネルで特定のアカウントを対象にするには、`accountId` を使用します。

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

### フィールド注記

<ParamField path="every" type="string">
  Heartbeat の間隔（期間文字列。デフォルト単位 = 分）。
</ParamField>
<ParamField path="model" type="string">
  Heartbeat 実行のオプションのモデル上書き（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  有効にすると、利用可能な場合は別個の `Reasoning:` メッセージも配信します（`/reasoning on` と同じ形）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true の場合、Heartbeat 実行は軽量なブートストラップコンテキストを使用し、ワークスペースブートストラップファイルから `HEARTBEAT.md` だけを保持します。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true の場合、各 Heartbeat は以前の会話履歴なしの新しいセッションで実行されます。cron の `sessionTarget: "isolated"` と同じ分離パターンを使用します。Heartbeat ごとのトークンコストを大幅に削減します。最大限節約するには `lightContext: true` と組み合わせます。配信ルーティングは引き続きメインセッションコンテキストを使用します。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  true の場合、Heartbeat 実行は追加のビジーレーン、つまりサブエージェントまたはネストされたコマンド作業で延期されます。cron レーンはこのフラグがなくても常に Heartbeat を延期するため、ローカルモデルホストが cron と Heartbeat プロンプトを同時に実行することはありません。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 実行のオプションのセッションキー。

- `main`（デフォルト）: エージェントのメインセッション。
- 明示的なセッションキー（`openclaw sessions --json` または [sessions CLI](/ja-JP/cli/sessions) からコピー）。
- セッションキー形式: [セッション](/ja-JP/concepts/session) と [グループ](/ja-JP/channels/groups) を参照してください。

</ParamField>
<ParamField path="target" type="string">
- `last`: 最後に使用した外部チャネルへ配信します。
- 明示的なチャネル: 設定済みの任意のチャネルまたは Plugin ID。たとえば `discord`、`matrix`、`telegram`、`whatsapp`。
- `none`（デフォルト）: Heartbeat を実行しますが、外部へは**配信しません**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  ダイレクト/DM 配信の動作を制御します。`allow`: ダイレクト/DM の Heartbeat 配信を許可します。`block`: ダイレクト/DM 配信を抑制します（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  オプションの受信者上書き（チャネル固有 ID。例: WhatsApp の E.164、または Telegram チャット ID）。Telegram のトピック/スレッドでは、`<chatId>:topic:<messageThreadId>` を使用します。

</ParamField>
<ParamField path="accountId" type="string">
  複数アカウントチャネル用のオプションのアカウント ID。`target: "last"` の場合、アカウント ID は、解決された最後のチャネルがアカウントをサポートしていれば適用されます。そうでなければ無視されます。アカウント ID が解決されたチャネルの設定済みアカウントと一致しない場合、配信はスキップされます。

</ParamField>
<ParamField path="prompt" type="string">
  デフォルトのプロンプト本文を上書きします（マージされません）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  配信前に `HEARTBEAT_OK` の後に許可される最大文字数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true の場合、heartbeat 実行中のツールエラー警告ペイロードを抑制する。

</ParamField>
<ParamField path="activeHours" type="object">
  heartbeat の実行を時間枠に制限する。`start`（HH:MM、包含。日の始まりには `00:00` を使用）、`end`（HH:MM、排他。日の終わりには `24:00` を使用可能）、および任意の `timezone` を持つオブジェクト。

- 省略または `"user"`: 設定されていれば `agents.defaults.userTimezone` を使用し、そうでなければホストシステムのタイムゾーンにフォールバックする。
- `"local"`: 常にホストシステムのタイムゾーンを使用する。
- 任意の IANA 識別子（例: `America/New_York`）: 直接使用される。無効な場合は、上記の `"user"` の挙動にフォールバックする。
- 有効な時間枠では、`start` と `end` は等しくてはならない。等しい値は幅 0（常に時間枠外）として扱われる。
- 有効な時間枠外では、時間枠内の次の tick まで heartbeats はスキップされる。

</ParamField>

## 配信の挙動

<AccordionGroup>
  <Accordion title="セッションとターゲットのルーティング">
    - Heartbeats はデフォルトでエージェントのメインセッション（`agent:<id>:<mainKey>`）で実行され、`session.scope = "global"` の場合は `global` で実行される。特定のチャネルセッション（Discord/WhatsApp など）に上書きするには `session` を設定する。
    - `session` は実行コンテキストにのみ影響する。配信は `target` と `to` によって制御される。
    - 特定のチャネル/受信者に配信するには、`target` + `to` を設定する。`target: "last"` では、そのセッションの最後の外部チャネルを使って配信される。
    - Heartbeat 配信では、デフォルトで direct/DM ターゲットが許可される。heartbeat turn は実行したまま direct ターゲットへの送信を抑制するには、`directPolicy: "block"` を設定する。
    - メインキュー、ターゲットセッション lane、cron lane、またはアクティブな cron ジョブがビジーの場合、heartbeat はスキップされ、後で再試行される。
    - `skipWhenBusy: true` の場合、サブエージェントとネストされた lanes も heartbeat 実行を延期する。
    - `target` が外部宛先に解決されない場合でも、実行は行われるが、送信メッセージは送られない。

  </Accordion>
  <Accordion title="可視性とスキップの挙動">
    - `showOk`、`showAlerts`、`useIndicator` がすべて無効な場合、実行は最初から `reason=alerts-disabled` としてスキップされる。
    - アラート配信だけが無効な場合でも、OpenClaw は heartbeat を実行し、期限付きタスクのタイムスタンプを更新し、セッションのアイドルタイムスタンプを復元し、外向きのアラートペイロードを抑制できる。
    - 解決された heartbeat ターゲットが typing をサポートしている場合、OpenClaw は heartbeat 実行中に typing を表示する。これは heartbeat がチャット出力を送信するのと同じターゲットを使用し、`typingMode: "never"` によって無効化される。

  </Accordion>
  <Accordion title="セッションのライフサイクルと監査">
    - Heartbeat のみの返信は、セッションを存続させ**ない**。Heartbeat メタデータはセッション行を更新することがあるが、アイドル期限切れには最後の実ユーザー/チャネルメッセージの `lastInteractionAt` が使用され、日次の期限切れには `sessionStartedAt` が使用される。
    - Control UI と WebChat 履歴では、heartbeat プロンプトと OK のみの確認応答は非表示になる。基礎となるセッション transcript には、監査/再生のためにそれらの turn が残る場合がある。
    - 切り離された[バックグラウンドタスク](/ja-JP/automation/tasks)は、メインセッションが何かをすばやく認識すべきときに、システムイベントをキューに入れて heartbeat を起動できる。その起動によって heartbeat 実行がバックグラウンドタスクになるわけではない。

  </Accordion>
</AccordionGroup>

## 可視性コントロール

デフォルトでは、アラート内容が配信される一方で、`HEARTBEAT_OK` 確認応答は抑制される。これはチャネル単位またはアカウント単位で調整できる。

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

優先順位: アカウント単位 → チャネル単位 → チャネルデフォルト → 組み込みデフォルト。

### 各フラグの動作

- `showOk`: モデルが OK のみの返信を返したときに、`HEARTBEAT_OK` 確認応答を送信する。
- `showAlerts`: モデルが OK 以外の返信を返したときに、アラート内容を送信する。
- `useIndicator`: UI ステータスサーフェス用の indicator イベントを発行する。

**3 つすべて**が false の場合、OpenClaw は heartbeat 実行を完全にスキップする（モデル呼び出しなし）。

### チャネル単位とアカウント単位の例

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
| デフォルトの挙動（OK は無音、アラートは有効） | _(設定不要)_                                                                             |
| 完全に無音（メッセージなし、indicator なし） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Indicator のみ（メッセージなし）          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1 つのチャネルでのみ OK                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（任意）

ワークスペースに `HEARTBEAT.md` ファイルが存在する場合、デフォルトプロンプトはエージェントにそれを読むよう指示する。これは「heartbeat チェックリスト」と考えるとよい。小さく、安定していて、30 分ごとに含めても安全なものにする。

通常の実行では、デフォルトエージェントで heartbeat ガイダンスが有効な場合にのみ `HEARTBEAT.md` が注入される。`0m` で heartbeat cadence を無効にするか、`includeSystemPromptSection: false` を設定すると、通常の bootstrap コンテキストから省略される。

`HEARTBEAT.md` が存在するが実質的に空（空行と `# Heading` のような markdown ヘッダーのみ）の場合、OpenClaw は API 呼び出しを節約するため heartbeat 実行をスキップする。そのスキップは `reason=empty-heartbeat-file` として報告される。ファイルがない場合でも heartbeat は実行され、モデルが何をするかを判断する。

プロンプト肥大化を避けるため、小さく保つ（短いチェックリストまたはリマインダー）。

`HEARTBEAT.md` の例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` ブロック

`HEARTBEAT.md` は、heartbeat 自体の中で間隔ベースのチェックを行うための、小さな構造化された `tasks:` ブロックもサポートしている。

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
  <Accordion title="挙動">
    - OpenClaw は `tasks:` ブロックを解析し、各タスクをそれぞれの `interval` と照合する。
    - その tick で**期限が来ている**タスクだけが heartbeat プロンプトに含まれる。
    - 期限が来ているタスクがない場合、無駄なモデル呼び出しを避けるため heartbeat は完全にスキップされる（`reason=no-tasks-due`）。
    - `HEARTBEAT.md` 内のタスク以外の内容は保持され、期限付きタスクリストの後に追加コンテキストとして付加される。
    - タスクの最終実行タイムスタンプはセッション状態（`heartbeatTaskState`）に保存されるため、通常の再起動後も interval は維持される。
    - タスクのタイムスタンプは、heartbeat 実行が通常の返信経路を完了した後にのみ進められる。スキップされた `empty-heartbeat-file` / `no-tasks-due` 実行では、タスクは完了としてマークされない。

  </Accordion>
</AccordionGroup>

タスクモードは、1 つの heartbeat ファイルに複数の定期チェックを持たせつつ、毎 tick すべてにコストを払いたくない場合に便利である。

### エージェントは HEARTBEAT.md を更新できるか？

できる。依頼すればよい。

`HEARTBEAT.md` はエージェントワークスペース内の通常のファイルなので、通常のチャットでエージェントに次のように指示できる。

- "`HEARTBEAT.md` を更新して、日次のカレンダーチェックを追加して。"
- "`HEARTBEAT.md` を短くして、inbox のフォローアップに集中するよう書き直して。"

これを能動的に行わせたい場合は、heartbeat プロンプトに次のような明示的な行を含めることもできる: 「チェックリストが古くなったら、よりよいものに HEARTBEAT.md を更新する。」

<Warning>
`HEARTBEAT.md` にシークレット（API キー、電話番号、プライベートトークン）を入れないこと。これはプロンプトコンテキストの一部になる。
</Warning>

## 手動起動（オンデマンド）

次のコマンドでシステムイベントをキューに入れ、即時 heartbeat をトリガーできる。

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

複数のエージェントに `heartbeat` が設定されている場合、手動起動はそれらの各エージェントの heartbeat を即時実行する。

次にスケジュールされた tick まで待つには、`--mode next-heartbeat` を使用する。

## Reasoning 配信（任意）

デフォルトでは、heartbeats は最終的な「回答」ペイロードだけを配信する。

透明性が必要な場合は、次を有効にする。

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、heartbeats は `Reasoning:` という接頭辞付きの別メッセージも配信する（`/reasoning on` と同じ形）。これは、エージェントが複数のセッション/codexes を管理しており、なぜあなたに ping すると判断したのかを確認したい場合に便利だが、望む以上に内部詳細が漏れる可能性もある。グループチャットではオフのままにしておくことを推奨する。

## コスト意識

Heartbeats は完全なエージェント turn を実行する。短い interval ほど多くのトークンを消費する。コストを下げるには:

- 完全な会話履歴を送信しないように `isolatedSession: true` を使用する（1 実行あたり約 100K トークンから約 2-5K へ）。
- bootstrap ファイルを `HEARTBEAT.md` のみに制限するために `lightContext: true` を使用する。
- より安価な `model` を設定する（例: `ollama/llama3.2:1b`）。
- `HEARTBEAT.md` を小さく保つ。
- 内部状態の更新だけが必要な場合は、`target: "none"` を使用する。

## Heartbeat 後のコンテキスト overflow

heartbeat が以前に既存セッションをより小さなローカルモデル、たとえば 32k window の Ollama モデルに残し、次のメインセッション turn がコンテキスト overflow を報告した場合、セッション runtime model を設定済みの primary model に戻す。OpenClaw のリセットメッセージは、最後の runtime model が設定済みの `heartbeat.model` と一致するときにこれを明示する。

現在の heartbeats は、実行完了後に共有セッションの既存 runtime model を保持する。それでも `isolatedSession: true` を使って新しいセッションで heartbeats を実行したり、最小のプロンプトにするために `lightContext: true` と組み合わせたり、共有セッションに十分な大きさのコンテキスト window を持つ heartbeat model を選択したりできる。

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 切り離された作業がどのように追跡されるか
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーンが heartbeat スケジューリングにどう影響するか
- [トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting) — 自動化の問題をデバッグする方法
