---
read_when:
    - Heartbeat の周期またはメッセージングの調整
    - スケジュールされたタスクで Heartbeat と Cron のどちらを使うかを判断する
sidebarTitle: Heartbeat
summary: Heartbeat ポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-07-05T11:20:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat と Cron の違いは？** それぞれをいつ使うべきかの指針は、[自動化](/ja-JP/automation)を参照してください。
</Note>

Heartbeat はメインセッションで**定期的なエージェントターン**を実行し、モデルが注意の必要なことを、通知を乱発せずに浮かび上がらせられるようにします。

Heartbeat はスケジュールされたメインセッションのターンです。[background task](/ja-JP/automation/tasks) レコードは作成**しません**。タスクレコードは、切り離された作業（ACP 実行、サブエージェント、分離された Cron ジョブ）用です。

トラブルシューティング: [スケジュール済みタスク](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート（初心者向け）

<Steps>
  <Step title="Pick a cadence">
    Heartbeat を有効のままにします（デフォルトは `30m`、または Claude CLI 再利用を含む Anthropic OAuth/token 認証が構成されている場合は `1h`）。または、独自の周期を設定します。
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    エージェントワークスペースに、小さな `HEARTBEAT.md` チェックリストまたは `tasks:` ブロックを作成します。
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` がデフォルトです。最後の連絡先へルーティングするには `target: "last"` を設定します。
  </Step>
  <Step title="Optional tuning">
    - 透明性のために Heartbeat 推論の配信を有効にします。
    - Heartbeat 実行に `HEARTBEAT.md` だけが必要な場合は、軽量なブートストラップコンテキストを使用します。
    - Heartbeat ごとに完全な会話履歴を送らないように、分離セッションを有効にします。
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

- 間隔: `30m`。Anthropic プロバイダーのデフォルトを適用すると、解決された認証モードが OAuth/token（Claude CLI 再利用を含む）の場合は `1h` に引き上げられますが、これは `heartbeat.every` が未設定の間だけです。`agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` を設定します。無効にするには `0m` を使用します。
- プロンプト本文（`agents.defaults.heartbeat.prompt` で設定可能）: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- タイムアウト: 未設定の Heartbeat ターンは、`agents.defaults.timeoutSeconds` が設定されている場合はそれを使用します。それ以外の場合は、Heartbeat の周期を使用し、上限は 600 秒です。より長い Heartbeat 作業には、`agents.defaults.heartbeat.timeoutSeconds` またはエージェントごとの `agents.list[].heartbeat.timeoutSeconds` を設定します。
- Heartbeat プロンプトは、ユーザーメッセージとして**そのまま**送信されます。システムプロンプトには、デフォルトエージェントで Heartbeat が有効（かつ `includeSystemPromptSection` が `false` ではない）場合にのみ「Heartbeats」セクションが含まれ、実行には内部的にフラグが付けられます。
- Heartbeat が `0m` で無効化されている場合、通常の実行でも `HEARTBEAT.md` はブートストラップコンテキストから省略されるため、モデルは Heartbeat 専用の指示を見ません。
- アクティブ時間（`heartbeat.activeHours`）は、設定されたタイムゾーンで確認されます。ウィンドウ外では、ウィンドウ内の次のティックまで Heartbeat はスキップされます。
- Heartbeat は、Cron 作業がアクティブまたはキューに入っている間、自動的に延期されます。`heartbeat.skipWhenBusy: true` を設定すると、そのエージェント自身のセッションキー付きサブエージェントまたはネストされたコマンドレーンでも延期します。兄弟エージェントは、別のエージェントに進行中のサブエージェント作業があるという理由だけでは、もう一時停止しません。

## Heartbeat プロンプトの用途

デフォルトプロンプトは意図的に広めです。

- **バックグラウンドタスク**: 「未処理のタスクを考慮する」は、エージェントにフォローアップ（受信箱、カレンダー、リマインダー、キュー内の作業）を確認させ、緊急のものを浮かび上がらせるための促しです。
- **人間への確認**: 「日中にときどき人間の様子を確認する」は、軽い「何か必要ですか？」メッセージを時折促しますが、設定されたローカルタイムゾーン（[タイムゾーン](/ja-JP/concepts/timezone)を参照）を使うことで夜間の通知乱発を避けます。

Heartbeat は完了した [background task](/ja-JP/automation/tasks) に反応できますが、Heartbeat 実行自体はタスクレコードを作成しません。

Heartbeat に非常に具体的なこと（例: 「Gmail PubSub 統計を確認する」や「Gateway の健全性を検証する」）をさせたい場合は、`agents.defaults.heartbeat.prompt`（または `agents.list[].heartbeat.prompt`）をカスタム本文に設定します（そのまま送信されます）。

## 応答契約

- 注意が必要なことが何もない場合は、**`HEARTBEAT_OK`** で返信します。
- Heartbeat 実行では、表示される更新が不要な場合に `notify: false` で `heartbeat_respond` を呼び出すか、アラートには `notify: true` と `notificationText` を指定できます。構造化ツール応答が存在する場合は、テキストのフォールバックより優先されます。
- Heartbeat 実行中、OpenClaw は返信の**先頭または末尾**に現れる `HEARTBEAT_OK` を ack として扱います。このトークンは取り除かれ、残りの内容が **≤ `ackMaxChars`**（デフォルト: 300）の場合、返信は破棄されます。
- `HEARTBEAT_OK` が返信の**途中**に現れる場合、特別扱いされません。
- アラートでは、`HEARTBEAT_OK` を含め**ないでください**。アラート本文のみを返します。

Heartbeat 以外では、メッセージの先頭または末尾にある余分な `HEARTBEAT_OK` は取り除かれてログに記録されます。`HEARTBEAT_OK` だけのメッセージは破棄されます。

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
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### スコープと優先順位

- `agents.defaults.heartbeat` はグローバルな Heartbeat 動作を設定します。
- `agents.list[].heartbeat` はその上にマージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、**それらのエージェントだけ**が Heartbeat を実行します。
- `channels.defaults.heartbeat` はすべてのチャンネルの表示デフォルトを設定します。
- `channels.<channel>.heartbeat` はチャンネルデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（マルチアカウントチャンネル）は、チャンネルごとの設定を上書きします。

### エージェントごとの Heartbeat

`agents.list[]` エントリのいずれかに `heartbeat` ブロックが含まれている場合、**それらのエージェントだけ**が Heartbeat を実行します。エージェントごとのブロックは `agents.defaults.heartbeat` の上にマージされます（共有デフォルトを一度設定し、エージェントごとに上書きできます）。

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

このウィンドウ外（東部時間の午前 9 時前または午後 10 時後）では、Heartbeat はスキップされます。ウィンドウ内の次のスケジュール済みティックは通常どおり実行されます。

### 24 時間 365 日のセットアップ

Heartbeat を終日実行したい場合は、次のいずれかのパターンを使用します。

- `activeHours` を完全に省略します（時間ウィンドウ制限なし。これがデフォルトの動作です）。
- 終日ウィンドウを設定します: `activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
同じ `start` と `end` 時刻（たとえば `08:00` から `08:00`）を設定しないでください。これは幅ゼロのウィンドウとして扱われるため、Heartbeat は常にスキップされます。
</Warning>

### マルチアカウントの例

Telegram などのマルチアカウントチャンネルで特定のアカウントを対象にするには、`accountId` を使用します。

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
  有効にすると、利用可能な場合に別個の `Thinking` メッセージも配信します（`/reasoning on` と同じ形）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true の場合、Heartbeat 実行は軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` だけを保持します。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true の場合、各 Heartbeat は過去の会話履歴がない新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンを使用します。Heartbeat ごとのトークンコストを大幅に削減します。最大限の節約には `lightContext: true` と組み合わせます。配信ルーティングは引き続きメインセッションコンテキストを使用します。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  true の場合、Heartbeat 実行はそのエージェントの追加のビジーなレーン、つまり自身のセッションキー付きサブエージェントまたはネストされたコマンド作業で延期されます。Cron レーンはこのフラグがなくても常に Heartbeat を延期するため、ローカルモデルホストは Cron と Heartbeat プロンプトを同時に実行しません。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 実行用の任意のセッションキー。

- `main`（デフォルト）: エージェントのメインセッション。
- 明示的なセッションキー（`openclaw sessions --json` または [sessions CLI](/ja-JP/cli/sessions) からコピー）。
- セッションキー形式: [セッション](/ja-JP/concepts/session) と [グループ](/ja-JP/channels/groups) を参照してください。

</ParamField>
<ParamField path="target" type="string">
- `last`: 最後に使用された外部チャンネルへ配信します。
- 明示的なチャンネル: 構成済みの任意のチャンネルまたは Plugin ID。たとえば `discord`、`matrix`、`telegram`、`whatsapp`。
- `none`（デフォルト）: Heartbeat は実行しますが、外部には**配信しません**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  direct/DM 配信の動作を制御します。`allow`: direct/DM の Heartbeat 配信を許可します。`block`: direct/DM 配信を抑制します（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  任意の受信者上書き指定（チャネル固有の ID。例: WhatsApp の E.164、または Telegram チャット ID）。Telegram のトピック/スレッドでは、`<chatId>:topic:<messageThreadId>` を使用します。

</ParamField>
<ParamField path="accountId" type="string">
  複数アカウント対応チャネル用の任意のアカウント ID。`target: "last"` の場合、解決された最後のチャネルがアカウントをサポートしていれば、そのアカウント ID が適用されます。それ以外の場合は無視されます。アカウント ID が解決されたチャネルの設定済みアカウントと一致しない場合、配信はスキップされます。

</ParamField>
<ParamField path="prompt" type="string">
  デフォルトのプロンプト本文を上書きします（マージされません）。

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  デフォルトエージェントの `## Heartbeats` システムプロンプトセクションを注入するかどうか。`false` に設定すると、heartbeat のランタイム動作（周期、配信、HEARTBEAT.md）は維持しつつ、エージェントのシステムプロンプトから heartbeat 指示を省略します。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  配信前に `HEARTBEAT_OK` の後ろに許可される最大文字数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true の場合、heartbeat 実行中のツールエラー警告ペイロードを抑制します。

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  heartbeat エージェントターンが中止されるまでに許可される最大秒数。未設定の場合、`agents.defaults.timeoutSeconds` が設定されていればそれを使用し、それ以外では heartbeat 周期を最大 600 秒に制限して使用します。

</ParamField>
<ParamField path="activeHours" type="object">
  heartbeat 実行を時間帯に制限します。`start`（HH:MM、包含。日の開始には `00:00` を使用）、`end`（HH:MM、排他。日の終了には `24:00` を使用可能）、任意の `timezone` を持つオブジェクトです。

- 省略、または `"user"`: `agents.defaults.userTimezone` が設定されていればそれを使用し、それ以外ではホストシステムのタイムゾーンにフォールバックします。
- `"local"`: 常にホストシステムのタイムゾーンを使用します。
- 任意の IANA 識別子（例: `America/New_York`）: 直接使用されます。無効な場合は、上記の `"user"` 動作にフォールバックします。
- アクティブウィンドウでは `start` と `end` が同じであってはいけません。同じ値は幅ゼロ（常にウィンドウ外）として扱われます。
- アクティブウィンドウ外では、ウィンドウ内の次の tick まで heartbeat はスキップされます。

</ParamField>

## 配信動作

<AccordionGroup>
  <Accordion title="セッションとターゲットのルーティング">
    - heartbeat はデフォルトでエージェントのメインセッション（`agent:<id>:<mainKey>`）で実行され、`session.scope = "global"` の場合は `global` で実行されます。特定のチャネルセッション（Discord/WhatsApp など）に上書きするには、`session` を設定します。
    - `session` は実行コンテキストにのみ影響します。配信は `target` と `to` で制御されます。
    - 特定のチャネル/受信者に配信するには、`target` + `to` を設定します。`target: "last"` では、そのセッションの最後の外部チャネルを使って配信します。
    - heartbeat 配信では、デフォルトで直接/DM ターゲットが許可されます。heartbeat ターンは実行したまま直接ターゲットへの送信を抑制するには、`directPolicy: "block"` を設定します。
    - メインキュー、ターゲットセッションレーン、cron レーン、またはアクティブな cron ジョブがビジーの場合、heartbeat はスキップされ、後で再試行されます。
    - `skipWhenBusy: true` の場合、このエージェントのセッションキー付きサブエージェントとネストされたレーンも heartbeat 実行を延期します。他のエージェントのビジーなレーンは、このエージェントを延期しません。
    - `target` が外部宛先に解決されない場合でも、実行自体は行われますが、外向きメッセージは送信されません。

  </Accordion>
  <Accordion title="可視性とスキップ動作">
    - `showOk`、`showAlerts`、`useIndicator` がすべて無効な場合、実行は最初から `reason=alerts-disabled` としてスキップされます。
    - アラート配信だけが無効な場合でも、OpenClaw は heartbeat を実行し、期限付きタスクのタイムスタンプを更新し、セッションのアイドルタイムスタンプを復元し、外向きのアラートペイロードを抑制できます。
    - 解決された heartbeat ターゲットが typing をサポートしている場合、OpenClaw は heartbeat 実行がアクティブな間 typing を表示します。これは heartbeat がチャット出力を送信するのと同じターゲットを使用し、`typingMode: "never"` によって無効化されます。

  </Accordion>
  <Accordion title="セッションライフサイクルと監査">
    - heartbeat のみの返信は、セッションを維持**しません**。heartbeat メタデータがセッション行を更新することはありますが、アイドル期限切れには最後の実ユーザー/チャネルメッセージの `lastInteractionAt` が使用され、日次の期限切れには `sessionStartedAt` が使用されます。
    - Control UI と WebChat 履歴は、heartbeat プロンプトと OK のみの確認応答を非表示にします。基礎となるセッショントランスクリプトには、監査/リプレイ用にそれらのターンが含まれる場合があります。
    - 切り離された[バックグラウンドタスク](/ja-JP/automation/tasks)は、メインセッションが何かにすばやく気づくべき場合にシステムイベントをキューに入れ、heartbeat を起こせます。その wake によって heartbeat 実行がバックグラウンドタスクになるわけではありません。

  </Accordion>
</AccordionGroup>

## 可視性コントロール

デフォルトでは、`HEARTBEAT_OK` 確認応答は抑制され、アラート内容は配信されます。これはチャネル単位またはアカウント単位で調整できます。

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
- `showAlerts`: モデルが OK ではない返信を返したときに、アラート内容を送信します。
- `useIndicator`: UI ステータス表示面向けにインジケーターイベントを発行します。

**3 つすべて**が false の場合、OpenClaw は heartbeat 実行全体をスキップします（モデル呼び出しなし）。

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
| デフォルト動作（OK は無音、アラートは有効） | _(設定不要)_                                                                             |
| 完全に無音（メッセージなし、インジケーターなし） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| インジケーターのみ（メッセージなし）     | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1 つのチャネルだけ OK を表示             | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（任意）

ワークスペースに `HEARTBEAT.md` ファイルが存在する場合、デフォルトプロンプトはエージェントにそれを読むよう伝えます。これは「heartbeat チェックリスト」と考えてください。小さく、安定していて、30 分ごとに検討しても安全なものです。

通常の実行では、`HEARTBEAT.md` はデフォルトエージェントで heartbeat ガイダンスが有効な場合にのみ注入されます。`0m` で heartbeat 周期を無効化するか、`includeSystemPromptSection: false` を設定すると、通常のブートストラップコンテキストから省略されます。

ネイティブ Codex ハーネスでは、`HEARTBEAT.md` の内容は他のブートストラップファイルのようにターンへ注入されません。ファイルが存在し、空白以外の内容がある場合、heartbeat のコラボレーションモードノートが Codex にそのファイルを示し、続行前にファイルを読むよう伝えます。

`HEARTBEAT.md` が存在しても実質的に空（空行のみ、Markdown/HTML コメント、`# Heading` のような Markdown 見出し、フェンスマーカー、または空のチェックリストスタブのみ）の場合、OpenClaw は API 呼び出しを節約するため heartbeat 実行をスキップします。そのスキップは `reason=empty-heartbeat-file` として報告されます。ファイルがない場合でも heartbeat は実行され、モデルが何をするかを判断します。

プロンプト肥大化を避けるため、小さく保ってください（短いチェックリストやリマインダー）。

`HEARTBEAT.md` の例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` ブロック

`HEARTBEAT.md` は、heartbeat 自体の中で間隔ベースのチェックを行うための小さな構造化 `tasks:` ブロックもサポートします。

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
    - その tick で**期限が来ている**タスクだけが heartbeat プロンプトに含まれます。
    - 期限が来ているタスクがない場合、無駄なモデル呼び出しを避けるため heartbeat は完全にスキップされます（`reason=no-tasks-due`）。
    - `HEARTBEAT.md` 内のタスク以外の内容は保持され、期限付きタスクリストの後ろに追加コンテキストとして付加されます。
    - タスクの最終実行タイムスタンプはセッション状態（`heartbeatTaskState`）に保存されるため、通常の再起動後も間隔は維持されます。
    - タスクのタイムスタンプは、heartbeat 実行が通常の返信パスを完了した後にのみ進められます。スキップされた `empty-heartbeat-file` / `no-tasks-due` 実行では、タスクは完了としてマークされません。

  </Accordion>
</AccordionGroup>

タスクモードは、毎 tick で全タスク分のコストを払わずに、1 つの heartbeat ファイルに複数の定期チェックを持たせたい場合に便利です。

### エージェントは HEARTBEAT.md を更新できますか？

はい。依頼すれば可能です。

`HEARTBEAT.md` はエージェントワークスペース内の通常のファイルなので、通常のチャットで次のようにエージェントに伝えられます。

- 「`HEARTBEAT.md` を更新して、毎日のカレンダーチェックを追加してください。」
- 「`HEARTBEAT.md` を短く、受信箱のフォローアップに集中した内容へ書き直してください。」

これを能動的に実行させたい場合は、heartbeat プロンプトに次のような明示的な行を含めることもできます。「チェックリストが古くなった場合は、より良いものに HEARTBEAT.md を更新してください。」

<Warning>
`HEARTBEAT.md` にシークレット（API キー、電話番号、プライベートトークン）を入れないでください。プロンプトコンテキストの一部になります。
</Warning>

## 手動 wake（オンデマンド）

システムイベントをキューに入れ、任意で即時 heartbeat をトリガーするには `openclaw system event` を使用します。

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| フラグ                       | 説明                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | システムイベントテキスト（必須）。                                                               |
| `--mode <mode>`              | `now` は即時 heartbeat を実行します。`next-heartbeat`（デフォルト）は次のスケジュール tick を待ちます。 |
| `--session-key <sessionKey>` | イベントの対象を特定のセッションにします。デフォルトはエージェントのメインセッションです。       |
| `--json`                     | JSON を出力します。                                                                              |

`--session-key` が指定されず、複数のエージェントに `heartbeat` が設定されている場合、`--mode now` はそれらのエージェント heartbeat をそれぞれ即時実行します。

同じ CLI グループ内の関連 heartbeat コントロール:

```bash
openclaw system heartbeat last     # show the last heartbeat event
openclaw system heartbeat enable   # enable heartbeats
openclaw system heartbeat disable  # disable heartbeats
```

## Reasoning 配信（任意）

デフォルトでは、Heartbeat は最終的な「answer」ペイロードのみを配信します。

透明性が必要な場合は、次を有効にします。

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、Heartbeat は `Thinking` というプレフィックス付きの別メッセージも配信します（`/reasoning on` と同じ形）。これは、エージェントが複数のセッション/codexを管理していて、なぜpingすると判断したのかを確認したい場合に役立つことがあります。ただし、必要以上に内部の詳細が漏れる可能性もあります。グループチャットではオフのままにすることを推奨します。

## コスト意識

Heartbeat は完全なエージェントターンを実行します。間隔を短くすると、より多くのトークンを消費します。コストを減らすには、次のようにします。

- 完全な会話履歴の送信を避けるために `isolatedSession: true` を使用します（1回の実行あたり約100Kトークンから約2〜5Kに削減）。
- ブートストラップファイルを `HEARTBEAT.md` のみに制限するために `lightContext: true` を使用します。
- より安価な `model` を設定します（例: `ollama/llama3.2:1b`）。
- `HEARTBEAT.md` を小さく保ちます。
- 内部状態の更新だけが必要な場合は、`target: "none"` を使用します。

## Heartbeat 後のコンテキストオーバーフロー

Heartbeat は実行完了後も共有セッションの既存のランタイムモデルを保持するため、セッションをより小さいローカルモデル（たとえば 32k ウィンドウの Ollama モデル）に切り替えた Heartbeat によって、次のメインセッションターンでもそのモデルが残ることがあります。その次のターンでコンテキストオーバーフローが報告され、セッションの最後のランタイムモデルが設定済みの `heartbeat.model` と一致する場合、OpenClaw の復旧メッセージは Heartbeat モデルの混入を原因として示し、修正を提案します。

これを避けるには、`isolatedSession: true` を使用して新しいセッションで Heartbeat を実行する（最小のプロンプトにするには必要に応じて `lightContext: true` と組み合わせる）か、共有セッションに十分な大きさのコンテキストウィンドウを持つ Heartbeat モデルを選択します。

## 関連

- [自動化](/ja-JP/automation) - すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) - 切り離された作業の追跡方法
- [タイムゾーン](/ja-JP/concepts/timezone) - タイムゾーンが Heartbeat のスケジュールに与える影響
- [トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting) - 自動化の問題のデバッグ方法
