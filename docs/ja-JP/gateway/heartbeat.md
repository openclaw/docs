---
read_when:
    - Heartbeat の頻度やメッセージングの調整
    - スケジュールされたタスクで Heartbeat と Cron のどちらを使うかを決める
sidebarTitle: Heartbeat
summary: Heartbeat ポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat と Cron の違いは？** それぞれをいつ使うかの指針は [自動化](/ja-JP/automation) を参照してください。
</Note>

Heartbeat はメインセッションで**定期的なエージェントターン**を実行し、モデルが注意を要するものを、通知を乱発せずに表面化できるようにします。

Heartbeat はスケジュールされたメインセッションのターンです。[バックグラウンドタスク](/ja-JP/automation/tasks) レコードは作成**しません**。タスクレコードは、切り離された作業（ACP 実行、サブエージェント、分離された Cron ジョブ）用です。

トラブルシューティング: [スケジュール済みタスク](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート（初心者向け）

<Steps>
  <Step title="頻度を選ぶ">
    Heartbeat は有効のままにします（デフォルトは `30m`、または Claude CLI の再利用を含む Anthropic OAuth/トークン認証では `1h`）。または独自の頻度を設定します。
  </Step>
  <Step title="HEARTBEAT.md を追加する（任意）">
    エージェントワークスペースに小さな `HEARTBEAT.md` チェックリストまたは `tasks:` ブロックを作成します。
  </Step>
  <Step title="Heartbeat メッセージの送信先を決める">
    `target: "none"` がデフォルトです。最後の連絡先にルーティングするには `target: "last"` を設定します。
  </Step>
  <Step title="任意の調整">
    - 透明性のために Heartbeat 推論の配信を有効にします。
    - Heartbeat 実行に `HEARTBEAT.md` だけが必要な場合は、軽量なブートストラップコンテキストを使用します。
    - Heartbeat ごとに完全な会話履歴を送信しないよう、分離セッションを有効にします。
    - Heartbeat をアクティブ時間（ローカル時刻）に制限します。

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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## デフォルト

- 間隔: `30m`（Claude CLI の再利用を含め、Anthropic OAuth/トークン認証が検出された認証モードの場合は `1h`）。`agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` を設定します。無効にするには `0m` を使用します。
- プロンプト本文（`agents.defaults.heartbeat.prompt` で設定可能）: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat プロンプトはユーザーメッセージとして**そのまま**送信されます。システムプロンプトには、デフォルトエージェントで Heartbeat が有効な場合にのみ「Heartbeat」セクションが含まれ、実行は内部的にフラグ付けされます。
- Heartbeat が `0m` で無効化されている場合、通常の実行でもブートストラップコンテキストから `HEARTBEAT.md` が省略されるため、モデルは Heartbeat 専用の指示を見ません。
- アクティブ時間（`heartbeat.activeHours`）は、設定されたタイムゾーンで確認されます。時間枠外では、Heartbeat は時間枠内の次のティックまでスキップされます。
- Cron 作業がアクティブまたはキューに入っている間、Heartbeat は自動的に延期されます。`heartbeat.skipWhenBusy: true` を設定すると、そのエージェント自身のセッションキー付きサブエージェントまたはネストされたコマンドレーンでも延期されます。別のエージェントでサブエージェント作業が進行中という理由だけでは、兄弟エージェントは一時停止されなくなりました。

## Heartbeat プロンプトの用途

デフォルトプロンプトは意図的に広めになっています。

- **バックグラウンドタスク**: 「Consider outstanding tasks」は、エージェントにフォローアップ（受信箱、カレンダー、リマインダー、キューに入った作業）を確認し、緊急のものを表面化するよう促します。
- **人間へのチェックイン**: 「Checkup sometimes on your human during day time」は、ときどき軽い「必要なことはありますか？」メッセージを促しますが、設定されたローカルタイムゾーン（[タイムゾーン](/ja-JP/concepts/timezone) を参照）を使うことで夜間の通知乱発を避けます。

Heartbeat は完了した[バックグラウンドタスク](/ja-JP/automation/tasks) に反応できますが、Heartbeat 実行そのものはタスクレコードを作成しません。

Heartbeat に非常に具体的なこと（例: 「Gmail PubSub 統計を確認する」または「Gateway の健全性を検証する」）をさせたい場合は、`agents.defaults.heartbeat.prompt`（または `agents.list[].heartbeat.prompt`）をカスタム本文に設定します（そのまま送信されます）。

## 応答契約

- 注意を要するものがない場合は、**`HEARTBEAT_OK`** と返信します。
- ツール対応の Heartbeat 実行では、表示更新なしの場合に `notify: false` で `heartbeat_respond` を呼び出すか、アラートの場合に `notify: true` と `notificationText` を指定できます。存在する場合、構造化されたツール応答がテキストフォールバックより優先されます。
- Heartbeat 実行中、OpenClaw は返信の**先頭または末尾**に `HEARTBEAT_OK` がある場合、それを確認応答として扱います。このトークンは削除され、残りの内容が **≤ `ackMaxChars`**（デフォルト: 300）の場合、返信は破棄されます。
- `HEARTBEAT_OK` が返信の**途中**に出現した場合、特別には扱われません。
- アラートでは **`HEARTBEAT_OK` を含めないでください**。アラート本文のみを返します。

Heartbeat 以外では、メッセージの先頭/末尾にある余分な `HEARTBEAT_OK` は削除されてログに記録されます。`HEARTBEAT_OK` だけのメッセージは破棄されます。

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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
- `agents.list[].heartbeat` はその上にマージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、Heartbeat を実行するのは**そのエージェントのみ**です。
- `channels.defaults.heartbeat` はすべてのチャネルの可視性デフォルトを設定します。
- `channels.<channel>.heartbeat` はチャネルデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（マルチアカウントチャネル）は、チャネルごとの設定を上書きします。

### エージェントごとの Heartbeat

いずれかの `agents.list[]` エントリに `heartbeat` ブロックが含まれる場合、Heartbeat を実行するのは**そのエージェントのみ**です。エージェントごとのブロックは `agents.defaults.heartbeat` の上にマージされます（共有デフォルトを一度設定し、エージェントごとに上書きできます）。

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

### アクティブ時間の例

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

Heartbeat を一日中実行したい場合は、次のいずれかのパターンを使用します。

- `activeHours` を完全に省略します（時間枠の制限なし。これがデフォルト動作です）。
- 終日ウィンドウを設定します: `activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
同じ `start` 時刻と `end` 時刻を設定しないでください（例: `08:00` から `08:00`）。これは幅ゼロの時間枠として扱われるため、Heartbeat は常にスキップされます。
</Warning>

### マルチアカウントの例

Telegram のようなマルチアカウントチャネルで特定のアカウントを対象にするには、`accountId` を使用します。

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
  有効にすると、利用可能な場合に個別の `Reasoning:` メッセージも配信します（`/reasoning on` と同じ形）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true の場合、Heartbeat 実行は軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` のみを保持します。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true の場合、各 Heartbeat は以前の会話履歴なしの新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンを使用します。Heartbeat ごとのトークンコストを大幅に削減します。最大限に節約するには `lightContext: true` と組み合わせます。配信ルーティングには引き続きメインセッションコンテキストが使用されます。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  true の場合、Heartbeat 実行はそのエージェントの追加のビジーレーン、つまり自身のセッションキー付きサブエージェントまたはネストされたコマンド作業で延期されます。Cron レーンはこのフラグがなくても常に Heartbeat を延期するため、ローカルモデルホストは Cron と Heartbeat プロンプトを同時に実行しません。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 実行用の任意のセッションキー。

- `main`（デフォルト）: エージェントのメインセッション。
- 明示的なセッションキー（`openclaw sessions --json` または [sessions CLI](/ja-JP/cli/sessions) からコピー）。
- セッションキーの形式: [セッション](/ja-JP/concepts/session) と [グループ](/ja-JP/channels/groups) を参照してください。

</ParamField>
<ParamField path="target" type="string">
- `last`: 最後に使用した外部チャネルに配信します。
- 明示的なチャネル: 設定済みの任意のチャネルまたは Plugin id。例: `discord`、`matrix`、`telegram`、`whatsapp`。
- `none`（デフォルト）: Heartbeat を実行しますが、外部には**配信しません**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  直接/DM 配信動作を制御します。`allow`: 直接/DM の Heartbeat 配信を許可します。`block`: 直接/DM 配信を抑制します（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  任意の受信者上書き（チャネル固有の id。例: WhatsApp の E.164、または Telegram の chat id）。Telegram の topic/thread では、`<chatId>:topic:<messageThreadId>` を使用します。

</ParamField>
<ParamField path="accountId" type="string">
  マルチアカウントチャネル用の任意の account id。`target: "last"` の場合、account id は解決された最後のチャネルがアカウントをサポートしていれば適用されます。それ以外の場合は無視されます。account id が解決されたチャネルに設定済みのアカウントと一致しない場合、配信はスキップされます。

</ParamField>
<ParamField path="prompt" type="string">
  デフォルトのプロンプト本文を上書きします（マージされません）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  配信前に `HEARTBEAT_OK` の後で許可される最大文字数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat の実行を時間枠に制限します。`start`（HH:MM、含む。1日の開始には `00:00` を使用）、`end`（HH:MM、含まない。1日の終わりには `24:00` を使用可能）、任意の `timezone` を持つオブジェクトです。

- 省略、または `"user"`: `agents.defaults.userTimezone` が設定されている場合はそれを使用し、それ以外の場合はホストシステムのタイムゾーンにフォールバックします。
- `"local"`: 常にホストシステムのタイムゾーンを使用します。
- 任意の IANA 識別子（例: `America/New_York`）: 直接使用されます。無効な場合は上記の `"user"` の動作にフォールバックします。
- 有効な時間枠では、`start` と `end` が同じであってはなりません。同じ値は幅ゼロ（常に時間枠外）として扱われます。
- 有効な時間枠の外では、Heartbeat は時間枠内の次の tick までスキップされます。

</ParamField>

## 配信の動作

<AccordionGroup>
  <Accordion title="セッションとターゲットのルーティング">
    - Heartbeat はデフォルトでエージェントのメインセッション（`agent:<id>:<mainKey>`）で実行され、`session.scope = "global"` の場合は `global` で実行されます。特定のチャンネルセッション（Discord/WhatsApp など）に上書きするには `session` を設定します。
    - `session` は実行コンテキストにのみ影響します。配信は `target` と `to` によって制御されます。
    - 特定のチャンネル/受信者に配信するには、`target` + `to` を設定します。`target: "last"` の場合、そのセッションの最後の外部チャンネルを使って配信します。
    - Heartbeat の配信はデフォルトで直接/DM ターゲットを許可します。Heartbeat ターンは実行したまま直接ターゲットへの送信を抑制するには、`directPolicy: "block"` を設定します。
    - メインキュー、ターゲットセッションレーン、Cron レーン、またはアクティブな Cron ジョブがビジーの場合、Heartbeat はスキップされ、後で再試行されます。
    - `skipWhenBusy: true` の場合、このエージェントのセッションキー付きサブエージェントとネストされたレーンも Heartbeat 実行を延期します。他のエージェントのビジーなレーンは、このエージェントを延期しません。
    - `target` が外部の宛先に解決されない場合でも、実行は行われますが、外向きのメッセージは送信されません。

  </Accordion>
  <Accordion title="表示とスキップの動作">
    - `showOk`、`showAlerts`、`useIndicator` がすべて無効な場合、実行は最初に `reason=alerts-disabled` としてスキップされます。
    - アラート配信だけが無効な場合でも、OpenClaw は Heartbeat を実行し、期限付きタスクのタイムスタンプを更新し、セッションのアイドルタイムスタンプを復元し、外向きのアラートペイロードを抑制できます。
    - 解決された Heartbeat ターゲットが typing をサポートしている場合、OpenClaw は Heartbeat 実行がアクティブな間 typing を表示します。これは Heartbeat がチャット出力の送信先にするのと同じターゲットを使用し、`typingMode: "never"` によって無効化されます。

  </Accordion>
  <Accordion title="セッションのライフサイクルと監査">
    - Heartbeat のみの返信は、セッションを維持しません。Heartbeat メタデータがセッション行を更新する場合はありますが、アイドル期限切れは最後の実ユーザー/チャンネルメッセージの `lastInteractionAt` を使用し、日次の期限切れは `sessionStartedAt` を使用します。
    - コントロール UI と WebChat 履歴は、Heartbeat プロンプトと OK のみの確認応答を非表示にします。基盤となるセッショントランスクリプトには、監査/リプレイ用にそれらのターンが残る場合があります。
    - 分離された[バックグラウンドタスク](/ja-JP/automation/tasks)は、メインセッションが何かを素早く認識する必要があるときに、システムイベントをキューに入れて Heartbeat を起動できます。その起動によって Heartbeat 実行がバックグラウンドタスクになるわけではありません。

  </Accordion>
</AccordionGroup>

## 表示制御

デフォルトでは、アラート内容は配信される一方、`HEARTBEAT_OK` の確認応答は抑制されます。これはチャンネルごと、またはアカウントごとに調整できます。

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

優先順位: アカウントごと → チャンネルごと → チャンネルのデフォルト → 組み込みのデフォルト。

### 各フラグの役割

- `showOk`: モデルが OK のみの返信を返したときに、`HEARTBEAT_OK` の確認応答を送信します。
- `showAlerts`: モデルが OK 以外の返信を返したときに、アラート内容を送信します。
- `useIndicator`: UI ステータス面向けのインジケーターイベントを発行します。

**3つすべて**が false の場合、OpenClaw は Heartbeat 実行を完全にスキップします（モデル呼び出しなし）。

### チャンネルごととアカウントごとの例

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

| 目的                                     | 設定                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| デフォルトの動作（OK は無音、アラートはオン） | _(設定不要)_                                                                     |
| 完全に無音（メッセージなし、インジケーターなし） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| インジケーターのみ（メッセージなし）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1つのチャンネルだけで OK を表示                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（任意）

ワークスペースに `HEARTBEAT.md` ファイルが存在する場合、デフォルトのプロンプトはエージェントにそれを読むよう指示します。これは「Heartbeat チェックリスト」と考えてください。小さく、安定していて、30分ごとに含めても安全なものです。

通常の実行では、`HEARTBEAT.md` はデフォルトエージェントで Heartbeat ガイダンスが有効な場合にのみ注入されます。`0m` で Heartbeat cadence を無効にするか、`includeSystemPromptSection: false` を設定すると、通常のブートストラップコンテキストから省略されます。

`HEARTBEAT.md` が存在していても実質的に空（空行と `# Heading` のような Markdown 見出しだけ）の場合、OpenClaw は API 呼び出しを節約するために Heartbeat 実行をスキップします。そのスキップは `reason=empty-heartbeat-file` として報告されます。ファイルがない場合でも Heartbeat は実行され、モデルが何をするかを決めます。

プロンプトの肥大化を避けるため、小さく保ってください（短いチェックリストやリマインダー）。

`HEARTBEAT.md` の例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` ブロック

`HEARTBEAT.md` は、Heartbeat 自体の中で interval ベースの確認を行うための小さな構造化 `tasks:` ブロックもサポートします。

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
    - その tick で**期限が来ている**タスクだけが Heartbeat プロンプトに含まれます。
    - 期限が来ているタスクがない場合、無駄なモデル呼び出しを避けるため、Heartbeat は完全にスキップされます（`reason=no-tasks-due`）。
    - `HEARTBEAT.md` 内のタスク以外の内容は保持され、期限付きタスク一覧の後に追加コンテキストとして付加されます。
    - タスクの最終実行タイムスタンプはセッション状態（`heartbeatTaskState`）に保存されるため、通常の再起動後も interval は維持されます。
    - タスクのタイムスタンプは、Heartbeat 実行が通常の返信経路を完了した後にのみ進められます。スキップされた `empty-heartbeat-file` / `no-tasks-due` 実行では、タスクは完了としてマークされません。

  </Accordion>
</AccordionGroup>

タスクモードは、1つの Heartbeat ファイルに複数の定期チェックを持たせつつ、毎 tick すべてにコストを払いたくない場合に便利です。

### エージェントは HEARTBEAT.md を更新できますか？

はい。依頼すれば可能です。

`HEARTBEAT.md` はエージェントワークスペース内の通常のファイルにすぎないため、通常のチャットでエージェントに次のように伝えられます。

- 「毎日のカレンダー確認を追加するように `HEARTBEAT.md` を更新して。」
- 「`HEARTBEAT.md` を、より短く inbox のフォローアップに集中した内容に書き直して。」

これをプロアクティブに行わせたい場合は、Heartbeat プロンプトに次のような明示的な行を含めることもできます。「チェックリストが古くなったら、よりよいものにして HEARTBEAT.md を更新してください。」

<Warning>
`HEARTBEAT.md` にシークレット（API キー、電話番号、プライベートトークン）を入れないでください。これはプロンプトコンテキストの一部になります。
</Warning>

## 手動起動（オンデマンド）

次のコマンドでシステムイベントをキューに入れ、即時 Heartbeat をトリガーできます。

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

複数のエージェントで `heartbeat` が設定されている場合、手動起動はそれらの各エージェントの Heartbeat を即座に実行します。

次のスケジュール済み tick まで待つには、`--mode next-heartbeat` を使用します。

## 推論の配信（任意）

デフォルトでは、Heartbeat は最終的な「回答」ペイロードだけを配信します。

透明性が必要な場合は、次を有効にします。

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、Heartbeat は `Reasoning:` というプレフィックス付きの別メッセージも配信します（`/reasoning on` と同じ形）。これは、エージェントが複数のセッション/codex を管理していて、なぜ ping すると判断したのかを確認したい場合に役立ちます。ただし、望む以上に内部の詳細が漏れる可能性もあります。グループチャットではオフのままにすることを推奨します。

## コスト意識

Heartbeat は完全なエージェントターンを実行します。短い interval はより多くのトークンを消費します。コストを下げるには:

- `isolatedSession: true` を使用して、完全な会話履歴の送信を避けます（約100K トークンから実行ごとに約2-5K へ）。
- `lightContext: true` を使用して、ブートストラップファイルを `HEARTBEAT.md` だけに制限します。
- より安価な `model`（例: `ollama/llama3.2:1b`）を設定します。
- `HEARTBEAT.md` を小さく保ちます。
- 内部状態の更新だけが必要な場合は、`target: "none"` を使用します。

## Heartbeat 後のコンテキストオーバーフロー

Heartbeat によって既存のセッションが以前に小さなローカルモデル、たとえば 32k ウィンドウの Ollama モデルのままになり、次のメインセッションターンでコンテキストオーバーフローが報告された場合は、セッションのランタイムモデルを設定済みのプライマリモデルに戻してください。最後のランタイムモデルが設定済みの `heartbeat.model` と一致する場合、OpenClaw のリセットメッセージはこの点を明示します。

現在の Heartbeat は、実行完了後に共有セッションの既存のランタイムモデルを保持します。Heartbeat を新しいセッションで実行するために `isolatedSession: true` を引き続き使用できます。最小のプロンプトにするには `lightContext: true` と組み合わせるか、共有セッションに十分な大きさのコンテキストウィンドウを持つ Heartbeat モデルを選択してください。

## 関連

- [Automation](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 分離された作業がどのように追跡されるか
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーンが Heartbeat スケジュールに与える影響
- [トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting) — 自動化の問題をデバッグする方法
