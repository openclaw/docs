---
read_when:
    - Heartbeatの頻度またはメッセージの調整
    - スケジュールタスクにHeartbeatとCronのどちらを使うかの判断
sidebarTitle: Heartbeat
summary: Heartbeatポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:29:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeatとcronのどちらを使うべきですか？** 使い分けの指針については [Automation & Tasks](/ja-JP/automation) を参照してください。
</Note>

Heartbeatは、**定期的なagentターン** をmain sessionで実行し、注意が必要なことがあればスパムせずにmodelが表面化できるようにします。

Heartbeatはスケジュールされたmain-sessionターンであり、[background task](/ja-JP/automation/tasks) レコードは**作成しません**。taskレコードは、切り離された作業（ACP実行、subagent、分離されたcronジョブ）用です。

トラブルシューティング: [Scheduled Tasks](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート（初級者向け）

<Steps>
  <Step title="頻度を決める">
    Heartbeatを有効のままにします（デフォルトは `30m`、Anthropic OAuth/token認証時は `1h`。Claude CLI再利用を含みます）か、自分の頻度を設定します。
  </Step>
  <Step title="HEARTBEAT.mdを追加する（任意）">
    agent workspaceに小さな `HEARTBEAT.md` チェックリストまたは `tasks:` ブロックを作成します。
  </Step>
  <Step title="Heartbeatメッセージの送信先を決める">
    デフォルトは `target: "none"` です。最後の連絡先にルーティングするには `target: "last"` を設定します。
  </Step>
  <Step title="任意の調整">
    - 透明性のためにHeartbeat推論配信を有効化します。
    - Heartbeat実行で `HEARTBEAT.md` しか必要ない場合は軽量bootstrap contextを使います。
    - 各Heartbeatで完全な会話履歴を送らないようにするには分離sessionを有効化します。
    - Heartbeatをアクティブな時間帯（ローカル時刻）に制限します。

  </Step>
</Steps>

設定例:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先への明示的な配信（デフォルトは "none"）
        directPolicy: "allow", // デフォルト: direct/DMターゲットを許可。抑制するには "block" に設定
        lightContext: true, // 任意: bootstrap fileからHEARTBEAT.mdだけを注入
        isolatedSession: true, // 任意: 実行ごとに新しいsession（会話履歴なし）
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 任意: 別の `Reasoning:` メッセージも送信
      },
    },
  },
}
```

## デフォルト

- 間隔: `30m`（またはAnthropic OAuth/token認証が検出された認証モードの場合は `1h`。Claude CLI再利用を含みます）。`agents.defaults.heartbeat.every` またはagentごとの `agents.list[].heartbeat.every` を設定してください。無効化するには `0m` を使います。
- プロンプト本文（`agents.defaults.heartbeat.prompt` で設定可能）: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeatプロンプトはユーザーメッセージとして**そのまま**送信されます。システムプロンプトに「Heartbeat」sectionが含まれるのは、デフォルトagentでHeartbeatが有効になっていて、かつその実行が内部的にフラグ付けされている場合だけです。
- `0m` でHeartbeatを無効化すると、通常実行でも `HEARTBEAT.md` はbootstrap contextから省略されるため、modelはHeartbeat専用instructionを見ません。
- アクティブ時間帯（`heartbeat.activeHours`）は設定されたtimezoneでチェックされます。ウィンドウ外ではHeartbeatはスキップされ、次にウィンドウ内に入ったtickで実行されます。

## Heartbeatプロンプトの目的

デフォルトプロンプトは意図的に広めです:

- **Background task**: 「未処理タスクを検討する」は、agentにfollow-up（inbox、calendar、reminder、キュー済み作業）を見直し、緊急なものを表面化するよう促します。
- **人への確認**: 「日中にときどき人間を気にかける」は、軽い「何か必要ですか？」メッセージを時折送ることを促しますが、設定されたローカルtimezoneを使うことで夜間のスパムを避けます（[Timezone](/ja-JP/concepts/timezone) を参照）。

Heartbeatは完了した [background tasks](/ja-JP/automation/tasks) に反応できますが、Heartbeat実行自体はtaskレコードを作りません。

Heartbeatに非常に具体的なこと（たとえば「Gmail PubSub statsを確認する」や「gateway healthを検証する」）をさせたい場合は、`agents.defaults.heartbeat.prompt`（または `agents.list[].heartbeat.prompt`）をカスタム本文（そのまま送信）に設定してください。

## 応答契約

- 注意が必要なことがなければ、**`HEARTBEAT_OK`** で応答します。
- Heartbeat実行中、OpenClawは返信の**先頭または末尾**に `HEARTBEAT_OK` が現れた場合、それをackとして扱います。トークンは取り除かれ、残りの内容が **≤ `ackMaxChars`**（デフォルト: 300）なら返信は破棄されます。
- `HEARTBEAT_OK` が返信の**途中**に現れた場合は、特別扱いされません。
- アラートの場合、**`HEARTBEAT_OK` を含めないでください**。アラート本文だけを返してください。

Heartbeat外では、メッセージ先頭/末尾の余分な `HEARTBEAT_OK` は除去されてログに記録されます。メッセージが `HEARTBEAT_OK` だけなら破棄されます。

## 設定

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // デフォルト: 30m（0mで無効化）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // デフォルト: false（利用可能なら別の Reasoning: メッセージを配信）
        lightContext: false, // デフォルト: false。true の場合、workspace bootstrap fileからHEARTBEAT.mdだけを保持
        isolatedSession: false, // デフォルト: false。true の場合、各Heartbeatを新しいsession（会話履歴なし）で実行
        target: "last", // デフォルト: none | 選択肢: last | none | <channel id>（coreまたはPlugin、例: "bluebubbles"）
        to: "+15551234567", // 任意のチャンネル固有上書き
        accountId: "ops-bot", // 任意の複数アカウントチャンネルID
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK の後に許可される最大文字数
      },
    },
  },
}
```

### スコープと優先順位

- `agents.defaults.heartbeat` はグローバルなHeartbeat動作を設定します。
- `agents.list[].heartbeat` はその上にマージされます。いずれかのagentに `heartbeat` ブロックがある場合、Heartbeatを実行するのは**そのagentたちだけ**です。
- `channels.defaults.heartbeat` はすべてのチャンネルの可視性デフォルトを設定します。
- `channels.<channel>.heartbeat` はチャンネルデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（複数アカウントチャンネル）はチャンネルごとの設定を上書きします。

### agentごとのHeartbeat

いずれかの `agents.list[]` エントリーに `heartbeat` ブロックが含まれている場合、Heartbeatを実行するのは**そのagentたちだけ**です。agentごとのブロックは `agents.defaults.heartbeat` の上にマージされます（共有デフォルトを1回設定し、agentごとに上書きできます）。

例: 2つのagentがあり、2つ目のagentだけがHeartbeatを実行します。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先への明示的な配信（デフォルトは "none"）
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

特定timezoneの営業時間内にHeartbeatを制限します:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先への明示的な配信（デフォルトは "none"）
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 任意。設定されていれば userTimezone、なければ host timezone を使用
        },
      },
    },
  },
}
```

このウィンドウ外（米国東部時間の午前9時前または午後10時後）ではHeartbeatはスキップされます。次にウィンドウ内に入ったスケジュールtickで通常どおり実行されます。

### 24時間365日構成

Heartbeatを終日実行したい場合は、次のいずれかのパターンを使ってください:

- `activeHours` を完全に省略する（時間ウィンドウ制限なし。これがデフォルト動作です）。
- 終日ウィンドウを設定する: `activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
同じ `start` と `end` 時刻（たとえば `08:00` から `08:00`）は設定しないでください。これは幅0のウィンドウとして扱われるため、Heartbeatは常にスキップされます。
</Warning>

### 複数アカウントの例

Telegramのような複数アカウントチャンネルで特定アカウントを対象にするには `accountId` を使います:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 任意: 特定topic/threadへルーティング
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
  Heartbeat間隔（duration文字列。デフォルト単位 = 分）。
</ParamField>
<ParamField path="model" type="string">
  Heartbeat実行用の任意のmodel上書き（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  有効にすると、利用可能な場合に別の `Reasoning:` メッセージも配信します（`/reasoning on` と同じ形式）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true の場合、Heartbeat実行は軽量bootstrap contextを使い、workspace bootstrap fileから `HEARTBEAT.md` だけを保持します。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true の場合、各Heartbeatは過去の会話履歴がない新しいsessionで実行されます。cronの `sessionTarget: "isolated"` と同じ分離パターンを使用します。Heartbeatごとのtokenコストを大幅に削減します。最大限に節約するには `lightContext: true` と組み合わせてください。配信ルーティングは引き続きmain session contextを使います。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat実行用の任意のsessionキー。

  - `main`（デフォルト）: agent main session。
  - 明示的なsessionキー（`openclaw sessions --json` または [sessions CLI](/ja-JP/cli/sessions) から取得）。
  - sessionキー形式: [Sessions](/ja-JP/concepts/session) と [Groups](/ja-JP/channels/groups) を参照。

</ParamField>
<ParamField path="target" type="string">
  - `last`: 最後に使った外部チャンネルへ配信。
  - 明示的なチャンネル: 設定済みの任意のチャンネルまたはPlugin id。たとえば `discord`、`matrix`、`telegram`、`whatsapp`。
  - `none`（デフォルト）: Heartbeatは実行しますが、外部には**配信しません**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  direct/DM配信動作を制御します。`allow`: direct/DM Heartbeat配信を許可。`block`: direct/DM配信を抑制（`reason=dm-blocked`）。
</ParamField>
<ParamField path="to" type="string">
  任意の受信者上書き（チャンネル固有ID。例: WhatsAppのE.164やTelegram chat id）。Telegramのtopic/threadでは `<chatId>:topic:<messageThreadId>` を使います。
</ParamField>
<ParamField path="accountId" type="string">
  複数アカウントチャンネル向けの任意のaccount id。`target: "last"` の場合、このaccount idはaccount対応している解決済みlast channelに適用され、それ以外では無視されます。account idが解決済みチャンネルの設定済みaccountと一致しない場合、配信はスキップされます。
</ParamField>
<ParamField path="prompt" type="string">
  デフォルトのプロンプト本文を上書きします（マージはされません）。
</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  配信前に `HEARTBEAT_OK` の後に許可される最大文字数。
</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true の場合、Heartbeat実行中のtool error warning payloadを抑制します。
</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat実行を時間ウィンドウに制限します。`start`（HH:MM、含む。1日の開始には `00:00` を使用）、`end`（HH:MM、含まない。1日の終了には `24:00` を使用可能）、任意の `timezone` を持つオブジェクト。

  - 省略または `"user"`: `agents.defaults.userTimezone` が設定されていればそれを使い、なければhost systemのtimezoneにフォールバックします。
  - `"local"`: 常にhost systemのtimezoneを使います。
  - 任意のIANA識別子（例: `America/New_York`）: それを直接使います。無効な場合は上記の `"user"` 動作にフォールバックします。
  - `start` と `end` は、アクティブなウィンドウにするには同じであってはいけません。同じ値は幅0として扱われます（常にウィンドウ外）。
  - アクティブウィンドウ外では、Heartbeatは次にウィンドウ内に入るtickまでスキップされます。

</ParamField>

## 配信動作

<AccordionGroup>
  <Accordion title="sessionとターゲットのルーティング">
    - Heartbeatはデフォルトでagentのmain session（`agent:<id>:<mainKey>`）で実行され、`session.scope = "global"` の場合は `global` になります。特定のチャンネルsession（Discord/WhatsAppなど）へ上書きするには `session` を設定します。
    - `session` は実行コンテキストにのみ影響し、配信は `target` と `to` によって制御されます。
    - 特定のチャンネル/受信者へ配信するには、`target` + `to` を設定します。`target: "last"` の場合、配信にはそのsessionの最後の外部チャンネルが使われます。
    - Heartbeat配信はデフォルトでdirect/DMターゲットを許可します。directターゲットへの送信を抑制しつつHeartbeatターン自体は実行するには `directPolicy: "block"` を設定します。
    - main queueがビジーの場合、Heartbeatはスキップされ、後で再試行されます。
    - `target` が外部宛先なしに解決された場合でも、実行自体は行われますが送信メッセージは送られません。

  </Accordion>
  <Accordion title="可視性とスキップ動作">
    - `showOk`、`showAlerts`、`useIndicator` がすべて無効な場合、実行は事前に `reason=alerts-disabled` でスキップされます。
    - アラート配信だけが無効な場合でも、OpenClawはHeartbeatを実行し、due-task timestampを更新し、session idle timestampを復元し、外向きアラートpayloadを抑制できます。
    - 解決されたHeartbeatターゲットが入力中表示をサポートしている場合、Heartbeat実行中はOpenClawが入力中表示を出します。これはHeartbeatがチャット出力を送るのと同じターゲットを使い、`typingMode: "never"` で無効化されます。

  </Accordion>
  <Accordion title="sessionライフサイクルと監査">
    - Heartbeat専用の返信は**sessionを存続させません**。Heartbeat metadataがsession rowを更新することはありますが、idle expiryは最後の実ユーザー/チャンネルメッセージの `lastInteractionAt` を使い、daily expiryは `sessionStartedAt` を使います。
    - Control UIとWebChat履歴では、HeartbeatプロンプトとOKのみのacknowledgmentは非表示になります。基礎のsession transcriptには、監査/再生のためにそれらのターンが残ることがあります。
    - 切り離された [background tasks](/ja-JP/automation/tasks) は、system eventをキューし、main sessionが何かにすぐ気づくべき場合にHeartbeatを起こせます。このwakeによってHeartbeat実行がbackground taskになるわけではありません。

  </Accordion>
</AccordionGroup>

## 可視性の制御

デフォルトでは、`HEARTBEAT_OK` acknowledgmentは抑制され、アラート内容だけが配信されます。これはチャンネルごと、またはアカウントごとに調整できます:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OKを隠す（デフォルト）
      showAlerts: true # アラートメッセージを表示（デフォルト）
      useIndicator: true # インジケーターイベントを出す（デフォルト）
  telegram:
    heartbeat:
      showOk: true # TelegramではOK acknowledgmentを表示
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # このアカウントではアラート配信を抑制
```

優先順位: accountごと → channelごと → channel defaults → 組み込みデフォルト。

### 各フラグの意味

- `showOk`: modelがOKのみの返信を返したとき、`HEARTBEAT_OK` acknowledgmentを送信します。
- `showAlerts`: modelがOK以外の返信を返したとき、アラート内容を送信します。
- `useIndicator`: UI status surface向けのindicator eventを出します。

**3つすべて** がfalseの場合、OpenClawはHeartbeat実行を完全にスキップします（model呼び出しなし）。

### channelごととaccountごとの例

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # すべてのSlackアカウント
    accounts:
      ops:
        heartbeat:
          showAlerts: false # opsアカウントだけアラートを抑制
  telegram:
    heartbeat:
      showOk: true
```

### よくあるパターン

| 目的                                     | 設定                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| デフォルト動作（OKは無言、アラートは配信） | _(設定不要)_                                                                              |
| 完全に無音（メッセージなし、indicatorなし） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| indicatorのみ（メッセージなし）          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1つのチャンネルでだけOKを表示            | `channels.telegram.heartbeat: { showOk: true }`                                           |

## HEARTBEAT.md（任意）

workspaceに `HEARTBEAT.md` fileが存在する場合、デフォルトプロンプトはagentにそれを読むよう指示します。これは「heartbeat checklist」のようなものだと考えてください。小さく、安定していて、30分ごとに含めても安全な内容です。

通常実行では、`HEARTBEAT.md` が注入されるのは、デフォルトagentでheartbeat guidanceが有効な場合だけです。`0m` でHeartbeat頻度を無効化するか、`includeSystemPromptSection: false` を設定すると、通常のbootstrap contextから省かれます。

`HEARTBEAT.md` が存在しても実質的に空（空行と `# Heading` のようなmarkdown見出しだけ）なら、OpenClawはAPI呼び出し節約のためHeartbeat実行をスキップします。そのスキップは `reason=empty-heartbeat-file` として報告されます。fileが存在しない場合、Heartbeatは引き続き実行され、何をするかはmodelが判断します。

プロンプト膨張を避けるため、小さく保ってください（短いチェックリストやreminder）。

`HEARTBEAT.md` の例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` ブロック

`HEARTBEAT.md` は、小さな構造化 `tasks:` ブロックもサポートしており、Heartbeat内部で間隔ベースのチェックを行えます。

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
    - OpenClawは `tasks:` ブロックを解析し、各taskをそれぞれの `interval` に照らして確認します。
    - そのtickで**期限が来ている** taskだけがHeartbeatプロンプトに含まれます。
    - dueなtaskが1つもなければ、無駄なmodel呼び出しを避けるためHeartbeatは完全にスキップされます（`reason=no-tasks-due`）。
    - `HEARTBEAT.md` 内のtask以外の内容は保持され、due-task一覧の後に追加コンテキストとして追記されます。
    - taskの最終実行timestampはsession state（`heartbeatTaskState`）に保存されるため、通常の再起動をまたいでもintervalが維持されます。
    - task timestampは、Heartbeat実行が通常の返信経路を完了した後にだけ進められます。`empty-heartbeat-file` / `no-tasks-due` でスキップされた実行では、task完了扱いになりません。

  </Accordion>
</AccordionGroup>

task modeは、複数の定期チェックを1つのHeartbeat fileにまとめたいが、毎tickそれら全部のコストは払いたくない場合に便利です。

### agentはHEARTBEAT.mdを更新できますか？

はい。そうするよう依頼すれば可能です。

`HEARTBEAT.md` はagent workspace内の普通のfileなので、通常のチャットで次のようにagentへ指示できます:

- 「`HEARTBEAT.md` を更新して、毎日のcalendar checkを追加して。」
- 「`HEARTBEAT.md` を、より短く、inbox follow-upに集中した内容へ書き直して。」

これを能動的に行わせたい場合は、heartbeat promptに次のような明示的な行を入れることもできます: 「チェックリストが古くなったら、より良いものに `HEARTBEAT.md` を更新すること。」

<Warning>
secret（API key、電話番号、private token）を `HEARTBEAT.md` に書かないでください。これはプロンプトコンテキストの一部になります。
</Warning>

## 手動wake（オンデマンド）

system eventをキューし、即座にHeartbeatを起こすには:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

複数のagentで `heartbeat` が設定されている場合、手動wakeはそれら各agentのHeartbeatを即座に実行します。

次のスケジュールtickまで待つには `--mode next-heartbeat` を使ってください。

## 推論配信（任意）

デフォルトでは、Heartbeatは最終的な「answer」payloadだけを配信します。

透明性が欲しい場合は、次を有効にします:

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、Heartbeatは別の `Reasoning:` 接頭辞付きメッセージも配信します（`/reasoning on` と同じ形）。agentが複数session/codexを管理していて、なぜ通知してきたのかを見たい場合には便利ですが、望まない内部詳細まで漏れることもあります。グループチャットではオフのままにしておくことを推奨します。

## コスト意識

Heartbeatは完全なagentターンを実行します。間隔を短くするとtoken消費が増えます。コストを減らすには:

- `isolatedSession: true` を使い、完全な会話履歴を送らないようにする（1実行あたり約100K tokenから約2〜5Kへ削減）。
- `lightContext: true` を使い、bootstrap fileを `HEARTBEAT.md` だけに制限する。
- より安価な `model` を設定する（例: `ollama/llama3.2:1b`）。
- `HEARTBEAT.md` を小さく保つ。
- 内部状態更新だけが必要なら `target: "none"` を使う。

## 関連

- [Automation & Tasks](/ja-JP/automation) — すべての自動化機構の概要
- [Background Tasks](/ja-JP/automation/tasks) — 切り離された作業がどう追跡されるか
- [Timezone](/ja-JP/concepts/timezone) — timezoneがHeartbeatスケジューリングに与える影響
- [Troubleshooting](/ja-JP/automation/cron-jobs#troubleshooting) — 自動化の問題をデバッグする方法
