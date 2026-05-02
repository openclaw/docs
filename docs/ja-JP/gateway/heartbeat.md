---
read_when:
    - Heartbeat の頻度またはメッセージングの調整
    - スケジュールされたタスクで Heartbeat と Cron のどちらを使うかを決める
sidebarTitle: Heartbeat
summary: Heartbeat のポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T04:55:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8198c74e2712c7ed9d34c41bad7c4e9be62043e8755cb4c9a60649222e04e37
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat と cron?** それぞれをいつ使うべきかの指針は [自動化とタスク](/ja-JP/automation) を参照してください。
</Note>

Heartbeat はメインセッションで**定期的なエージェントターン**を実行し、モデルが注意を要するものを、あなたにスパムすることなく提示できるようにします。

Heartbeat はスケジュールされたメインセッションのターンです。[バックグラウンドタスク](/ja-JP/automation/tasks) レコードは作成**しません**。タスクレコードは、切り離された作業（ACP 実行、サブエージェント、分離された cron ジョブ）のためのものです。

トラブルシューティング: [スケジュール済みタスク](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート（初心者）

<Steps>
  <Step title="間隔を選ぶ">
    Heartbeat を有効のままにする（デフォルトは `30m`、または Claude CLI の再利用を含む Anthropic OAuth/token 認証では `1h`）か、独自の間隔を設定します。
  </Step>
  <Step title="HEARTBEAT.md を追加する（任意）">
    エージェントのワークスペースに小さな `HEARTBEAT.md` チェックリストまたは `tasks:` ブロックを作成します。
  </Step>
  <Step title="Heartbeat メッセージの送信先を決める">
    `target: "none"` がデフォルトです。最後の連絡先へルーティングするには `target: "last"` を設定します。
  </Step>
  <Step title="任意の調整">
    - 透明性のため、Heartbeat の推論配信を有効にします。
    - Heartbeat の実行に `HEARTBEAT.md` だけが必要な場合は、軽量なブートストラップコンテキストを使用します。
    - Heartbeat ごとに会話履歴全体を送信しないように、分離セッションを有効にします。
    - Heartbeat をアクティブ時間帯（現地時刻）に制限します。

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

- 間隔: `30m`（Claude CLI の再利用を含め、検出された認証モードが Anthropic OAuth/token 認証の場合は `1h`）。`agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` を設定します。無効にするには `0m` を使用します。
- プロンプト本文（`agents.defaults.heartbeat.prompt` で設定可能）: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat プロンプトは、ユーザーメッセージとして**そのまま**送信されます。システムプロンプトに「Heartbeat」セクションが含まれるのは、デフォルトエージェントで Heartbeat が有効で、かつ実行に内部フラグが付けられている場合だけです。
- Heartbeat が `0m` で無効化されている場合、通常の実行でもブートストラップコンテキストから `HEARTBEAT.md` が省略されるため、モデルは Heartbeat 専用の指示を見ません。
- アクティブ時間帯（`heartbeat.activeHours`）は、設定されたタイムゾーンで確認されます。時間帯の外では、その時間帯内の次の tick まで Heartbeat はスキップされます。
- cron 作業がアクティブまたはキューにある間、Heartbeat は自動的に延期されます。追加のビジーなレーン（サブエージェントまたはネストしたコマンド作業）でも延期するには `heartbeat.skipWhenBusy: true` を設定します。これはローカルの Ollama や、その他の制約のある単一ランタイムホストで便利です。

## Heartbeat プロンプトの用途

デフォルトプロンプトは意図的に広めです。

- **バックグラウンドタスク**: 「Consider outstanding tasks」は、エージェントにフォローアップ（受信箱、カレンダー、リマインダー、キュー済み作業）を確認させ、緊急のものを提示させるための促しです。
- **人間へのチェックイン**: 「Checkup sometimes on your human during day time」は、ときどき軽量な「必要なことはありますか？」メッセージを促しますが、設定済みのローカルタイムゾーン（[タイムゾーン](/ja-JP/concepts/timezone)を参照）を使用することで夜間のスパムを避けます。

Heartbeat は完了した[バックグラウンドタスク](/ja-JP/automation/tasks)に反応できますが、Heartbeat 実行自体はタスクレコードを作成しません。

Heartbeat に非常に具体的なこと（例: 「Gmail PubSub 統計を確認する」や「Gateway のヘルスを検証する」）をさせたい場合は、`agents.defaults.heartbeat.prompt`（または `agents.list[].heartbeat.prompt`）をカスタム本文（そのまま送信されます）に設定します。

## 応答契約

- 注意が必要なものがない場合は、**`HEARTBEAT_OK`** と返信します。
- ツールを利用できる Heartbeat 実行では、可視更新なしの場合に `notify: false` で `heartbeat_respond` を呼ぶか、アラートの場合に `notify: true` と `notificationText` を指定できます。存在する場合、構造化されたツール応答がテキストのフォールバックより優先されます。
- Heartbeat 実行中、OpenClaw は `HEARTBEAT_OK` が返信の**先頭または末尾**に現れる場合、それを ack として扱います。このトークンは削除され、残りの内容が **≤ `ackMaxChars`**（デフォルト: 300）の場合、返信は破棄されます。
- `HEARTBEAT_OK` が返信の**途中**に現れる場合、特別扱いされません。
- アラートでは、`HEARTBEAT_OK` を含め**ないでください**。アラート本文だけを返します。

Heartbeat 以外では、メッセージの先頭/末尾にある余分な `HEARTBEAT_OK` は削除されてログ記録されます。`HEARTBEAT_OK` だけのメッセージは破棄されます。

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
- `agents.list[].heartbeat` はその上にマージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、Heartbeat を実行するのは**それらのエージェントだけ**です。
- `channels.defaults.heartbeat` はすべてのチャンネルの表示デフォルトを設定します。
- `channels.<channel>.heartbeat` はチャンネルのデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（複数アカウントチャンネル）は、チャンネルごとの設定を上書きします。

### エージェントごとの Heartbeat

いずれかの `agents.list[]` エントリに `heartbeat` ブロックが含まれる場合、Heartbeat を実行するのは**それらのエージェントだけ**です。エージェントごとのブロックは `agents.defaults.heartbeat` の上にマージされます（共有デフォルトを一度設定し、エージェントごとに上書きできます）。

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

この時間帯の外（東部時間の午前 9 時前または午後 10 時後）では、Heartbeat はスキップされます。時間帯内の次にスケジュールされた tick は通常どおり実行されます。

### 24/7 セットアップ

Heartbeat を終日実行したい場合は、次のいずれかのパターンを使用します。

- `activeHours` を完全に省略します（時間帯制限なし。これがデフォルト動作です）。
- 終日の時間帯を設定します: `activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
同じ `start` 時刻と `end` 時刻（例: `08:00` から `08:00`）を設定しないでください。これは幅ゼロの時間帯として扱われるため、Heartbeat は常にスキップされます。
</Warning>

### 複数アカウントの例

Telegram のような複数アカウントチャンネルで特定のアカウントを対象にするには、`accountId` を使用します。

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
  true の場合、Heartbeat 実行は軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` だけを保持します。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true の場合、各 Heartbeat は過去の会話履歴なしの新しいセッションで実行されます。cron の `sessionTarget: "isolated"` と同じ分離パターンを使用します。Heartbeat ごとのトークンコストを大幅に削減します。最大限節約するには `lightContext: true` と組み合わせます。配信ルーティングには引き続きメインセッションのコンテキストが使用されます。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  true の場合、Heartbeat 実行は追加のビジーなレーン（サブエージェントまたはネストしたコマンド作業）で延期されます。cron レーンは、このフラグがなくても常に Heartbeat を延期するため、ローカルモデルホストは cron と Heartbeat プロンプトを同時に実行しません。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 実行用の任意のセッションキー。

- `main`（デフォルト）: エージェントのメインセッション。
- 明示的なセッションキー（`openclaw sessions --json` または [sessions CLI](/ja-JP/cli/sessions) からコピー）。
- セッションキー形式: [セッション](/ja-JP/concepts/session) と [グループ](/ja-JP/channels/groups) を参照してください。

</ParamField>
<ParamField path="target" type="string">
- `last`: 最後に使用された外部チャンネルへ配信します。
- 明示的なチャンネル: 設定済みの任意のチャンネルまたは Plugin id。例: `discord`、`matrix`、`telegram`、`whatsapp`。
- `none`（デフォルト）: Heartbeat を実行しますが、外部には**配信しません**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  direct/DM 配信動作を制御します。`allow`: direct/DM の Heartbeat 配信を許可します。`block`: direct/DM 配信を抑制します（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  任意の受信者上書き（チャンネル固有の id。例: WhatsApp の E.164 または Telegram の chat id）。Telegram のトピック/スレッドでは、`<chatId>:topic:<messageThreadId>` を使用します。

</ParamField>
<ParamField path="accountId" type="string">
  複数アカウントチャンネル用の任意のアカウント id。`target: "last"` の場合、解決された最後のチャンネルがアカウントをサポートしていれば、そのアカウント id が適用されます。そうでなければ無視されます。アカウント id が解決されたチャンネルの設定済みアカウントと一致しない場合、配信はスキップされます。

</ParamField>
<ParamField path="prompt" type="string">
  デフォルトのプロンプト本文を上書きします（マージされません）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  `HEARTBEAT_OK` の後、配信前に許可される最大文字数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat 実行を時間枠に制限します。`start` (HH:MM、含む。日始めには `00:00` を使用)、`end` (HH:MM、含まない。日終わりには `24:00` を使用可能)、任意の `timezone` を含むオブジェクトです。

- 省略、または `"user"`: 設定されていれば `agents.defaults.userTimezone` を使用し、それ以外の場合はホストシステムのタイムゾーンにフォールバックします。
- `"local"`: 常にホストシステムのタイムゾーンを使用します。
- 任意の IANA 識別子 (例: `America/New_York`): 直接使用されます。無効な場合は、上記の `"user"` の動作にフォールバックします。
- アクティブウィンドウでは、`start` と `end` が同じであってはなりません。同じ値は幅ゼロ (常にウィンドウ外) として扱われます。
- アクティブウィンドウ外では、ウィンドウ内の次の tick まで Heartbeat はスキップされます。

</ParamField>

## 配信動作

<AccordionGroup>
  <Accordion title="セッションとターゲットのルーティング">
    - Heartbeat はデフォルトでエージェントのメインセッション (`agent:<id>:<mainKey>`) で実行されます。`session.scope = "global"` の場合は `global` で実行されます。特定のチャネルセッション (Discord/WhatsApp など) に上書きするには `session` を設定します。
    - `session` は実行コンテキストにのみ影響します。配信は `target` と `to` によって制御されます。
    - 特定のチャネル/受信者へ配信するには、`target` + `to` を設定します。`target: "last"` では、そのセッションの最後の外部チャネルを使用して配信します。
    - Heartbeat 配信では、デフォルトで直接/DM ターゲットが許可されます。Heartbeat ターンは実行したまま、直接ターゲットへの送信を抑制するには `directPolicy: "block"` を設定します。
    - メインキュー、ターゲットセッションレーン、Cron レーン、またはアクティブな Cron ジョブがビジーの場合、Heartbeat はスキップされ、後で再試行されます。
    - `skipWhenBusy: true` の場合、サブエージェントおよびネストされたレーンも Heartbeat 実行を延期します。
    - `target` が外部宛先に解決されない場合でも実行は行われますが、送信メッセージは送られません。

  </Accordion>
  <Accordion title="可視性とスキップ動作">
    - `showOk`、`showAlerts`、`useIndicator` がすべて無効な場合、実行は `reason=alerts-disabled` として事前にスキップされます。
    - アラート配信だけが無効な場合でも、OpenClaw は Heartbeat を実行し、期限タスクのタイムスタンプを更新し、セッションのアイドルタイムスタンプを復元し、外向きのアラートペイロードを抑制できます。
    - 解決された Heartbeat ターゲットがタイピング表示に対応している場合、OpenClaw は Heartbeat 実行中にタイピングを表示します。これは Heartbeat がチャット出力を送信するのと同じターゲットを使用し、`typingMode: "never"` によって無効化されます。

  </Accordion>
  <Accordion title="セッションライフサイクルと監査">
    - Heartbeat のみの返信は、セッションを維持しません。Heartbeat メタデータによってセッション行が更新されることはありますが、アイドル期限切れには最後の実ユーザー/チャネルメッセージの `lastInteractionAt` が使用され、日次期限切れには `sessionStartedAt` が使用されます。
    - Control UI と WebChat の履歴では、Heartbeat プロンプトと OK のみの確認応答は非表示になります。基盤となるセッショントランスクリプトには、監査/再生のためにそれらのターンがまだ含まれる場合があります。
    - 分離された [バックグラウンドタスク](/ja-JP/automation/tasks) は、メインセッションが何かをすばやく認識すべきときに、システムイベントをキューに入れて Heartbeat を起動できます。その起動によって、Heartbeat 実行がバックグラウンドタスクになるわけではありません。

  </Accordion>
</AccordionGroup>

## 可視性コントロール

デフォルトでは、`HEARTBEAT_OK` 確認応答は抑制され、アラート内容は配信されます。チャネルごと、またはアカウントごとに調整できます。

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

- `showOk`: モデルが OK のみの返信を返したときに、`HEARTBEAT_OK` 確認応答を送信します。
- `showAlerts`: モデルが OK 以外の返信を返したときに、アラート内容を送信します。
- `useIndicator`: UI ステータス面向けのインジケーターイベントを発行します。

**3 つすべて** が false の場合、OpenClaw は Heartbeat 実行を完全にスキップします (モデル呼び出しなし)。

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

### 一般的なパターン

| 目的                                     | 設定                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| デフォルト動作 (OK は非表示、アラートは有効) | _(設定不要)_                                                                             |
| 完全にサイレント (メッセージなし、インジケーターなし) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| インジケーターのみ (メッセージなし)       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1 つのチャネルでのみ OK を表示            | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (任意)

ワークスペースに `HEARTBEAT.md` ファイルが存在する場合、デフォルトプロンプトはエージェントにそれを読むよう指示します。これは「Heartbeat チェックリスト」と考えてください。小さく、安定していて、30 分ごとに含めても安全なものです。

通常実行では、`HEARTBEAT.md` はデフォルトエージェントで Heartbeat ガイダンスが有効な場合にのみ注入されます。`0m` で Heartbeat ケイデンスを無効にするか、`includeSystemPromptSection: false` を設定すると、通常のブートストラップコンテキストから省略されます。

`HEARTBEAT.md` が存在していても実質的に空 (空行と `# Heading` のような Markdown ヘッダーのみ) の場合、OpenClaw は API 呼び出しを節約するため Heartbeat 実行をスキップします。そのスキップは `reason=empty-heartbeat-file` として報告されます。ファイルが存在しない場合でも Heartbeat は実行され、モデルが何をするか判断します。

プロンプトの肥大化を避けるため、小さく保ってください (短いチェックリストやリマインダー)。

`HEARTBEAT.md` の例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` ブロック

`HEARTBEAT.md` は、Heartbeat 自体の内部で interval ベースのチェックを行うための小さな構造化 `tasks:` ブロックにも対応しています。

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
    - 期限の来ているタスクがない場合、無駄なモデル呼び出しを避けるため Heartbeat は完全にスキップされます (`reason=no-tasks-due`)。
    - `HEARTBEAT.md` 内のタスク以外の内容は保持され、期限タスクリストの後に追加コンテキストとして付加されます。
    - タスクの最終実行タイムスタンプはセッション状態 (`heartbeatTaskState`) に保存されるため、通常の再起動後も interval は維持されます。
    - タスクのタイムスタンプは、Heartbeat 実行が通常の返信パスを完了した後にのみ進められます。スキップされた `empty-heartbeat-file` / `no-tasks-due` 実行では、タスクは完了済みとしてマークされません。

  </Accordion>
</AccordionGroup>

タスクモードは、1 つの Heartbeat ファイルに複数の定期チェックを保持しつつ、毎 tick ですべてにコストを払いたくない場合に便利です。

### エージェントは HEARTBEAT.md を更新できますか？

はい。依頼すれば可能です。

`HEARTBEAT.md` はエージェントワークスペース内の通常ファイルにすぎないため、通常のチャットでエージェントに次のように伝えられます。

- 「`HEARTBEAT.md` を更新して、日次のカレンダーチェックを追加して。」
- 「`HEARTBEAT.md` を、より短く、受信箱のフォローアップに集中するよう書き直して。」

これを能動的に行わせたい場合は、Heartbeat プロンプトに明示的な行を含めることもできます。例: 「チェックリストが古くなったら、より良いものに HEARTBEAT.md を更新してください。」

<Warning>
`HEARTBEAT.md` にシークレット (API キー、電話番号、プライベートトークン) を入れないでください。プロンプトコンテキストの一部になります。
</Warning>

## 手動起動 (オンデマンド)

次のコマンドでシステムイベントをキューに入れ、即時 Heartbeat をトリガーできます。

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

複数のエージェントで `heartbeat` が設定されている場合、手動起動はそれらの各エージェントの Heartbeat をただちに実行します。

次のスケジュール済み tick まで待つには、`--mode next-heartbeat` を使用します。

## 推論の配信 (任意)

デフォルトでは、Heartbeat は最終的な「回答」ペイロードのみを配信します。

透明性が必要な場合は、次を有効にします。

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、Heartbeat は `Reasoning:` で始まる別のメッセージも配信します (`/reasoning on` と同じ形)。これは、エージェントが複数のセッション/codex を管理していて、なぜ ping すると判断したのか確認したい場合に便利です。ただし、望む以上の内部詳細が漏れる可能性もあります。グループチャットでは無効のままにすることを推奨します。

## コスト意識

Heartbeat は完全なエージェントターンを実行します。interval が短いほど、より多くのトークンを消費します。コストを削減するには、次の方法があります。

- 完全な会話履歴を送らないようにするには、`isolatedSession: true` を使用します (実行ごとに約 100K トークンから約 2-5K へ)。
- ブートストラップファイルを `HEARTBEAT.md` のみに制限するには、`lightContext: true` を使用します。
- より安価な `model` を設定します (例: `ollama/llama3.2:1b`)。
- `HEARTBEAT.md` を小さく保ちます。
- 内部状態の更新だけが必要な場合は、`target: "none"` を使用します。

## Heartbeat 後のコンテキストオーバーフロー

Heartbeat が小さなローカルモデル、たとえば 32k ウィンドウの Ollama モデルを使用していて、次のメインセッションターンでコンテキストオーバーフローが報告される場合、直前の Heartbeat がセッションを Heartbeat モデルのままにしていないか確認してください。最後のランタイムモデルが設定済みの `heartbeat.model` と一致する場合、OpenClaw のリセットメッセージはそのことを明示します。

Heartbeat を新しいセッションで実行するには `isolatedSession: true` を使用し、最小のプロンプトにするには `lightContext: true` と組み合わせるか、共有セッションに十分な大きさのコンテキストウィンドウを持つ Heartbeat モデルを選択してください。

## 関連

- [Automation とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 分離された作業の追跡方法
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーンが Heartbeat スケジュールに与える影響
- [トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting) — 自動化の問題をデバッグする方法
