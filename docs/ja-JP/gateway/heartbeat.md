---
read_when:
    - Heartbeat の頻度またはメッセージングを調整する
    - スケジュールされたタスクで Heartbeat と Cron のどちらを使うかを判断する
sidebarTitle: Heartbeat
summary: Heartbeat のポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-06-27T11:29:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat と Cron の違い** それぞれをいつ使うべきかのガイダンスは [Automation](/ja-JP/automation) を参照してください。
</Note>

Heartbeat はメインセッションで**定期的なエージェントターン**を実行し、注意が必要なことをモデルが過剰に通知せずに知らせられるようにします。

Heartbeat はスケジュールされたメインセッションのターンです。つまり、[background task](/ja-JP/automation/tasks) レコードは作成**しません**。タスクレコードは、切り離された作業（ACP 実行、サブエージェント、分離された Cron ジョブ）のためのものです。

トラブルシューティング: [Scheduled Tasks](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート（初心者向け）

<Steps>
  <Step title="頻度を選ぶ">
    Heartbeat を有効のままにします（デフォルトは `30m`、または Claude CLI の再利用を含む Anthropic OAuth/token 認証では `1h`）か、独自の頻度を設定します。
  </Step>
  <Step title="HEARTBEAT.md を追加する（任意）">
    エージェントワークスペースに小さな `HEARTBEAT.md` チェックリストまたは `tasks:` ブロックを作成します。
  </Step>
  <Step title="Heartbeat メッセージの送信先を決める">
    `target: "none"` がデフォルトです。最後の連絡先にルーティングするには `target: "last"` を設定します。
  </Step>
  <Step title="任意の調整">
    - 透明性のために Heartbeat の reasoning 配信を有効にします。
    - Heartbeat 実行に `HEARTBEAT.md` だけが必要な場合は、軽量なブートストラップコンテキストを使用します。
    - Heartbeat ごとに会話履歴全体を送信しないように、分離セッションを有効にします。
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
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## デフォルト

- 間隔: `30m`（Claude CLI の再利用を含め、検出された認証モードが Anthropic OAuth/token 認証の場合は `1h`）。`agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` を設定します。無効にするには `0m` を使用します。
- プロンプト本文（`agents.defaults.heartbeat.prompt` で設定可能）: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- タイムアウト: 未設定の Heartbeat ターンは、`agents.defaults.timeoutSeconds` が設定されている場合はそれを使用します。それ以外の場合は、Heartbeat の頻度を使用し、上限は 600 秒です。より長い Heartbeat 作業には、`agents.defaults.heartbeat.timeoutSeconds` またはエージェントごとの `agents.list[].heartbeat.timeoutSeconds` を設定します。
- Heartbeat プロンプトはユーザーメッセージとして**そのまま**送信されます。システムプロンプトには、デフォルトエージェントで Heartbeat が有効な場合のみ「Heartbeat」セクションが含まれ、実行は内部的にフラグ付けされます。
- `0m` で Heartbeat が無効になっている場合、通常の実行でもブートストラップコンテキストから `HEARTBEAT.md` が省略されるため、モデルには Heartbeat 専用の指示が見えません。
- アクティブ時間（`heartbeat.activeHours`）は、設定されたタイムゾーンで確認されます。時間枠外では、時間枠内の次の tick まで Heartbeat はスキップされます。
- Heartbeat は Cron 作業がアクティブまたはキューに入っている間、自動的に延期されます。`heartbeat.skipWhenBusy: true` を設定すると、そのエージェント自身のセッションキー付きサブエージェントまたはネストされたコマンドレーンでもエージェントを延期します。兄弟エージェントは、別のエージェントのサブエージェント作業が進行中であるだけでは停止しなくなりました。

## Heartbeat プロンプトの用途

デフォルトプロンプトは意図的に広く設定されています。

- **バックグラウンドタスク**: 「未処理のタスクを検討する」は、エージェントにフォローアップ（受信箱、カレンダー、リマインダー、キュー済み作業）を確認し、緊急のものを知らせるよう促します。
- **人間へのチェックイン**: 「日中に人間へときどきチェックインする」は、軽い「何か必要ですか？」というメッセージを時折送るよう促しますが、設定済みのローカルタイムゾーン（[Timezone](/ja-JP/concepts/timezone) を参照）を使って夜間の過剰通知を避けます。

Heartbeat は完了した [background tasks](/ja-JP/automation/tasks) に反応できますが、Heartbeat 実行自体はタスクレコードを作成しません。

Heartbeat に非常に具体的なこと（例: 「Gmail PubSub の統計を確認する」または「Gateway のヘルスを検証する」）をさせたい場合は、`agents.defaults.heartbeat.prompt`（または `agents.list[].heartbeat.prompt`）をカスタム本文に設定します（そのまま送信されます）。

## 応答契約

- 注意が必要なものがない場合は、**`HEARTBEAT_OK`** と返信します。
- ツール対応の Heartbeat 実行では、表示される更新が不要な場合は `notify: false` で `heartbeat_respond` を呼び出すか、アラートには `notify: true` と `notificationText` を指定できます。存在する場合、構造化ツール応答がテキストのフォールバックより優先されます。
- Heartbeat 実行中、OpenClaw は `HEARTBEAT_OK` が返信の**先頭または末尾**に現れる場合、それを ack として扱います。このトークンは削除され、残りの内容が **≤ `ackMaxChars`**（デフォルト: 300）の場合、返信は破棄されます。
- `HEARTBEAT_OK` が返信の**途中**に現れる場合、特別扱いされません。
- アラートの場合は、`HEARTBEAT_OK` を含め**ないでください**。アラート本文だけを返します。

Heartbeat 以外では、メッセージの先頭/末尾にある不要な `HEARTBEAT_OK` は削除され、ログに記録されます。`HEARTBEAT_OK` だけのメッセージは破棄されます。

## 設定

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
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
- `agents.list[].heartbeat` はその上にマージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、**それらのエージェントだけ**が Heartbeat を実行します。
- `channels.defaults.heartbeat` はすべてのチャンネルの可視性デフォルトを設定します。
- `channels.<channel>.heartbeat` はチャンネルのデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（マルチアカウントチャンネル）はチャンネルごとの設定を上書きします。

### エージェントごとの Heartbeat

いずれかの `agents.list[]` エントリに `heartbeat` ブロックが含まれる場合、**それらのエージェントだけ**が Heartbeat を実行します。エージェントごとのブロックは `agents.defaults.heartbeat` の上にマージされます（共有デフォルトを一度設定し、エージェントごとに上書きできます）。

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

特定のタイムゾーンで Heartbeat を営業時間に制限します。

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

この時間枠外（東部時間の午前 9 時前または午後 10 時後）では、Heartbeat はスキップされます。時間枠内の次のスケジュール済み tick は通常どおり実行されます。

### 24/7 セットアップ

Heartbeat を終日実行したい場合は、次のいずれかのパターンを使用します。

- `activeHours` を完全に省略します（時間枠制限なし。これがデフォルトの動作です）。
- 終日ウィンドウを設定します: `activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
同じ `start` 時刻と `end` 時刻を設定しないでください（例: `08:00` から `08:00`）。これは幅ゼロの時間枠として扱われるため、Heartbeat は常にスキップされます。
</Warning>

### マルチアカウントの例

Telegram のようなマルチアカウントチャンネルで特定のアカウントを対象にするには、`accountId` を使用します。

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
  Heartbeat 間隔（duration 文字列。デフォルト単位 = 分）。
</ParamField>
<ParamField path="model" type="string">
  Heartbeat 実行用の任意のモデル上書き（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  有効にすると、利用可能な場合に別個の `Thinking` メッセージも配信します（`/reasoning on` と同じ形式）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true の場合、Heartbeat 実行は軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` のみを保持します。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true の場合、各 Heartbeat は事前の会話履歴なしで新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンを使用します。Heartbeat ごとのトークンコストを大幅に削減します。最大限に節約するには `lightContext: true` と組み合わせます。配信ルーティングは引き続きメインセッションのコンテキストを使用します。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  true の場合、Heartbeat 実行はそのエージェントの追加のビジーレーン、つまり自身のセッションキー付きサブエージェントまたはネストされたコマンド作業で延期されます。このフラグがなくても Cron レーンは常に Heartbeat を延期するため、ローカルモデルホストが Cron と Heartbeat のプロンプトを同時に実行することはありません。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 実行用の任意のセッションキー。

- `main`（デフォルト）: エージェントのメインセッション。
- 明示的なセッションキー（`openclaw sessions --json` または [sessions CLI](/ja-JP/cli/sessions) からコピー）。
- セッションキー形式: [Sessions](/ja-JP/concepts/session) と [Groups](/ja-JP/channels/groups) を参照してください。

</ParamField>
<ParamField path="target" type="string">
- `last`: 最後に使用された外部チャンネルに配信します。
- 明示的なチャンネル: 設定済みチャンネルまたは Plugin ID。例: `discord`、`matrix`、`telegram`、`whatsapp`。
- `none`（デフォルト）: Heartbeat を実行しますが、外部には**配信しません**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  direct/DM 配信の動作を制御します。`allow`: direct/DM の Heartbeat 配信を許可します。`block`: direct/DM 配信を抑制します（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  任意の受信者上書き（チャンネル固有 ID。例: WhatsApp の E.164 または Telegram chat id）。Telegram の topic/thread には `<chatId>:topic:<messageThreadId>` を使用します。

</ParamField>
<ParamField path="accountId" type="string">
  複数アカウントのチャンネル向けの任意のアカウント ID。`target: "last"` の場合、そのアカウント ID は、解決された直近のチャンネルがアカウントに対応していれば適用されます。それ以外の場合は無視されます。アカウント ID が解決されたチャンネルに設定済みのアカウントと一致しない場合、配信はスキップされます。

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
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Heartbeat エージェントターンが中止されるまでに許可される最大秒数。未設定のままにすると、設定されている場合は `agents.defaults.timeoutSeconds` を使用し、それ以外の場合は最大 600 秒に制限された Heartbeat 間隔を使用します。

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat 実行を時間帯に制限します。`start`（HH:MM、包含。日の始まりには `00:00` を使用）、`end`（HH:MM、排他。日の終わりには `24:00` が使用可能）、任意の `timezone` を持つオブジェクトです。

- 省略、または `"user"`: 設定されていれば `agents.defaults.userTimezone` を使用し、それ以外の場合はホストシステムのタイムゾーンにフォールバックします。
- `"local"`: 常にホストシステムのタイムゾーンを使用します。
- 任意の IANA 識別子（例: `America/New_York`）: 直接使用されます。無効な場合は上記の `"user"` の挙動にフォールバックします。
- アクティブウィンドウでは `start` と `end` が同一であってはなりません。同一の値は幅ゼロ（常にウィンドウ外）として扱われます。
- アクティブウィンドウ外では、Heartbeat はウィンドウ内の次の tick までスキップされます。

</ParamField>

## 配信の挙動

<AccordionGroup>
  <Accordion title="セッションとターゲットルーティング">
    - Heartbeat はデフォルトでエージェントのメインセッション（`agent:<id>:<mainKey>`）で実行され、`session.scope = "global"` の場合は `global` で実行されます。特定のチャンネルセッション（Discord/WhatsApp など）に上書きするには `session` を設定します。
    - `session` は実行コンテキストにのみ影響します。配信は `target` と `to` によって制御されます。
    - 特定のチャンネル/受信者に配信するには、`target` + `to` を設定します。`target: "last"` の場合、配信はそのセッションの直近の外部チャンネルを使用します。
    - Heartbeat 配信では、デフォルトで直接/DM ターゲットが許可されます。Heartbeat ターンは実行したまま直接ターゲットへの送信を抑制するには、`directPolicy: "block"` を設定します。
    - メインキュー、ターゲットセッションレーン、cron レーン、またはアクティブな cron ジョブがビジーの場合、Heartbeat はスキップされ、後で再試行されます。
    - `skipWhenBusy: true` の場合、このエージェントのセッションキー付きサブエージェントとネストされたレーンも Heartbeat 実行を延期します。他のエージェントのビジーなレーンは、このエージェントを延期しません。
    - `target` が外部送信先に解決されない場合でも、実行は行われますが、送信メッセージは送られません。

  </Accordion>
  <Accordion title="表示とスキップの挙動">
    - `showOk`、`showAlerts`、`useIndicator` がすべて無効な場合、実行は最初に `reason=alerts-disabled` としてスキップされます。
    - アラート配信だけが無効な場合でも、OpenClaw は Heartbeat を実行し、期限付きタスクのタイムスタンプを更新し、セッションのアイドルタイムスタンプを復元し、外向きのアラートペイロードを抑制できます。
    - 解決された Heartbeat ターゲットが typing に対応している場合、OpenClaw は Heartbeat 実行がアクティブな間 typing を表示します。これは Heartbeat がチャット出力を送信するのと同じターゲットを使用し、`typingMode: "never"` によって無効化されます。

  </Accordion>
  <Accordion title="セッションライフサイクルと監査">
    - Heartbeat のみの返信はセッションを維持しません。Heartbeat メタデータはセッション行を更新する場合がありますが、アイドル期限切れには直近の実ユーザー/チャンネルメッセージの `lastInteractionAt` が使用され、日次の期限切れには `sessionStartedAt` が使用されます。
    - Control UI と WebChat の履歴は、Heartbeat プロンプトと OK のみの確認応答を非表示にします。基になるセッション transcript には、監査/再生のためにそれらのターンが引き続き含まれる場合があります。
    - 切り離された [バックグラウンドタスク](/ja-JP/automation/tasks) は、メインセッションが何かにすばやく気付くべき場合に、システムイベントをキューに入れて Heartbeat を起動できます。その起動によって Heartbeat 実行がバックグラウンドタスクになるわけではありません。

  </Accordion>
</AccordionGroup>

## 表示制御

デフォルトでは、アラート内容は配信される一方で、`HEARTBEAT_OK` 確認応答は抑制されます。これはチャンネル単位またはアカウント単位で調整できます。

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

優先順位: アカウント単位 → チャンネル単位 → チャンネルデフォルト → 組み込みデフォルト。

### 各フラグの動作

- `showOk`: モデルが OK のみの返信を返したときに、`HEARTBEAT_OK` 確認応答を送信します。
- `showAlerts`: モデルが OK 以外の返信を返したときに、アラート内容を送信します。
- `useIndicator`: UI ステータスサーフェス向けにインジケーターイベントを発行します。

**3 つすべて**が false の場合、OpenClaw は Heartbeat 実行全体をスキップします（モデル呼び出しなし）。

### チャンネル単位とアカウント単位の例

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
| デフォルトの挙動（OK は無音、アラートは有効） | _（設定不要）_                                                                           |
| 完全に無音（メッセージなし、インジケーターなし） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| インジケーターのみ（メッセージなし）     | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1 つのチャンネルだけで OK を表示         | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（任意）

ワークスペースに `HEARTBEAT.md` ファイルが存在する場合、デフォルトプロンプトはエージェントにそれを読むよう指示します。これは自分の「Heartbeat チェックリスト」と考えてください。小さく、安定していて、30 分ごとに考慮しても安全なものです。

通常実行では、`HEARTBEAT.md` はデフォルトエージェントで Heartbeat ガイダンスが有効な場合にのみ注入されます。`0m` で Heartbeat 間隔を無効にするか、`includeSystemPromptSection: false` を設定すると、通常の bootstrap コンテキストから省略されます。

ネイティブ Codex ハーネスでは、`HEARTBEAT.md` の内容はターンに注入されません。ファイルが存在し、空白以外の内容がある場合、Heartbeat のコラボレーションモード指示は Codex にそのファイルを示し、続行前に読むよう伝えます。

`HEARTBEAT.md` が存在するものの実質的に空（空行のみ、Markdown/HTML コメント、`# Heading` のような Markdown 見出し、フェンスマーカー、または空のチェックリストの雛形）である場合、OpenClaw は API 呼び出しを節約するため Heartbeat 実行をスキップします。そのスキップは `reason=empty-heartbeat-file` として報告されます。ファイルがない場合でも、Heartbeat は実行され、モデルが何をするかを判断します。

プロンプトの肥大化を避けるため、小さく保ってください（短いチェックリストやリマインダー）。

`HEARTBEAT.md` の例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` ブロック

`HEARTBEAT.md` は、Heartbeat 自体の中で間隔ベースのチェックを行うための小さな構造化 `tasks:` ブロックにも対応しています。

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
    - OpenClaw は `tasks:` ブロックを解析し、各タスクをそれぞれの `interval` に照らして確認します。
    - その tick で**期限が来ている**タスクだけが Heartbeat プロンプトに含まれます。
    - 期限が来ているタスクがない場合、無駄なモデル呼び出しを避けるため Heartbeat は完全にスキップされます（`reason=no-tasks-due`）。
    - `HEARTBEAT.md` 内のタスク以外の内容は保持され、期限付きタスクリストの後に追加コンテキストとして追加されます。
    - タスクの最終実行タイムスタンプはセッション状態（`heartbeatTaskState`）に保存されるため、通常の再起動後も間隔は維持されます。
    - タスクのタイムスタンプは、Heartbeat 実行が通常の返信パスを完了した後にのみ進められます。スキップされた `empty-heartbeat-file` / `no-tasks-due` 実行では、タスクは完了としてマークされません。

  </Accordion>
</AccordionGroup>

タスクモードは、1 つの Heartbeat ファイルに複数の定期チェックを保持しつつ、毎 tick すべてにコストを払いたくない場合に便利です。

### エージェントは HEARTBEAT.md を更新できますか？

はい。依頼すれば可能です。

`HEARTBEAT.md` はエージェントワークスペース内の通常のファイルにすぎないため、通常のチャットでエージェントに次のように伝えられます。

- 「`HEARTBEAT.md` を更新して、毎日のカレンダーチェックを追加して。」
- 「`HEARTBEAT.md` を短くして、受信トレイのフォローアップに集中するよう書き直して。」

これを能動的に行わせたい場合は、Heartbeat プロンプトに次のような明示的な行を含めることもできます。「チェックリストが古くなったら、より良いものに `HEARTBEAT.md` を更新してください。」

<Warning>
`HEARTBEAT.md` に秘密情報（API キー、電話番号、プライベートトークン）を入れないでください。これはプロンプトコンテキストの一部になります。
</Warning>

## 手動起動（オンデマンド）

次のコマンドでシステムイベントをキューに入れ、即時 Heartbeat をトリガーできます。

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

複数のエージェントに `heartbeat` が設定されている場合、手動起動はそれら各エージェントの Heartbeat を即時実行します。

次のスケジュール済み tick まで待つには、`--mode next-heartbeat` を使用します。

## Reasoning 配信（任意）

デフォルトでは、Heartbeat は最終的な「回答」ペイロードのみを配信します。

透明性が必要な場合は、次を有効にします。

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、Heartbeat は `Thinking` で始まる別メッセージも配信します（`/reasoning on` と同じ形）。これは、エージェントが複数のセッション/codex を管理していて、なぜあなたに ping すると判断したのかを見たい場合に便利です。ただし、望む以上に内部の詳細が漏れる可能性もあります。グループチャットでは無効のままにしておくことを推奨します。

## コスト意識

Heartbeat は完全なエージェントターンを実行します。間隔が短いほど多くの token を消費します。コストを削減するには:

- 完全な会話履歴の送信を避けるため、`isolatedSession: true` を使用します（1 回あたり約 100K token から約 2〜5K に削減）。
- bootstrap ファイルを `HEARTBEAT.md` のみに制限するため、`lightContext: true` を使用します。
- より安価な `model`（例: `ollama/llama3.2:1b`）を設定します。
- `HEARTBEAT.md` を小さく保ちます。
- 内部状態の更新だけが必要な場合は、`target: "none"` を使用します。

## Heartbeat 後のコンテキストオーバーフロー

Heartbeat が以前、既存のセッションをより小さいローカルモデル、たとえば 32k ウィンドウの Ollama モデルに残し、次のメインセッションターンでコンテキストオーバーフローが報告された場合、セッションのランタイムモデルを設定済みのプライマリモデルにリセットしてください。直近のランタイムモデルが設定済みの `heartbeat.model` と一致する場合、OpenClaw のリセットメッセージはこれを明示します。

現在の Heartbeat は、実行完了後に共有セッションの既存ランタイムモデルを保持します。それでも、`isolatedSession: true` を使用して Heartbeat を新しいセッションで実行したり、最小のプロンプトにするために `lightContext: true` と組み合わせたり、共有セッションに十分なコンテキストウィンドウを持つ Heartbeat モデルを選択したりできます。

## 関連

- [自動化](/ja-JP/automation) — すべての自動化メカニズムの一覧
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 切り離された作業がどのように追跡されるか
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーンが Heartbeat スケジューリングにどのように影響するか
- [トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting) — 自動化の問題のデバッグ
