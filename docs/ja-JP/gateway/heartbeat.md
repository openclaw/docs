---
read_when:
    - Heartbeatの間隔またはメッセージングの調整
    - スケジュールされたタスクで Heartbeat と Cron のどちらを使用するかの判断
sidebarTitle: Heartbeat
summary: Heartbeatのポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-07-11T22:12:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat と Cron のどちらを使うべきか？** それぞれを使用する場面については、[自動化](/ja-JP/automation)を参照してください。
</Note>

Heartbeat はメインセッションで**定期的なエージェントターン**を実行し、注意が必要な事項をモデルが過剰な通知なしで提示できるようにします。

Heartbeat はスケジュールされたメインセッションのターンであり、[バックグラウンドタスク](/ja-JP/automation/tasks)のレコードは作成**しません**。タスクレコードは、切り離された作業（ACP の実行、サブエージェント、分離された Cron ジョブ）用です。

トラブルシューティング：[スケジュールされたタスク](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート（初心者向け）

<Steps>
  <Step title="実行間隔を選択">
    Heartbeat を有効のままにする（デフォルトは `30m`。Claude CLI の再利用を含む Anthropic OAuth/トークン認証が設定されている場合は `1h`）か、独自の実行間隔を設定します。
  </Step>
  <Step title="HEARTBEAT.md を追加（任意）">
    エージェントのワークスペースに、簡単な `HEARTBEAT.md` チェックリストまたは `tasks:` ブロックを作成します。
  </Step>
  <Step title="Heartbeat メッセージの送信先を決定">
    デフォルトは `target: "none"` です。最後の連絡先にルーティングするには、`target: "last"` を設定します。
  </Step>
  <Step title="任意の調整">
    - 透明性を確保するため、Heartbeat の推論配信を有効にします。
    - Heartbeat の実行に `HEARTBEAT.md` だけが必要な場合は、軽量なブートストラップコンテキストを使用します。
    - Heartbeat ごとに会話履歴全体を送信しないよう、分離セッションを有効にします。
    - Heartbeat を稼働時間帯（現地時刻）に制限します。

  </Step>
</Steps>

設定例：

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

- 間隔：`30m`。Anthropic プロバイダーのデフォルトを適用すると、解決された認証モードが OAuth/トークン（Claude CLI の再利用を含む）の場合は `1h` に引き上げられますが、これは `heartbeat.every` が未設定の場合に限られます。`agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` を設定してください。無効にするには `0m` を使用します。
- プロンプト本文（`agents.defaults.heartbeat.prompt` で設定可能）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- タイムアウト：Heartbeat ターンで未設定の場合、`agents.defaults.timeoutSeconds` が設定されていればその値を使用します。それ以外の場合は、Heartbeat の実行間隔を使用し、上限を 600 秒とします。より長い Heartbeat 作業には、`agents.defaults.heartbeat.timeoutSeconds` またはエージェントごとの `agents.list[].heartbeat.timeoutSeconds` を設定します。
- Heartbeat プロンプトは、ユーザーメッセージとして**そのまま**送信されます。システムプロンプトに「Heartbeat」セクションが含まれるのは、デフォルトエージェントで Heartbeat が有効になっており（かつ `includeSystemPromptSection` が `false` ではない）、実行に内部フラグが設定されている場合だけです。
- `0m` で Heartbeat を無効にすると、通常の実行でもブートストラップコンテキストから `HEARTBEAT.md` が除外されるため、モデルは Heartbeat 専用の指示を参照しません。
- 稼働時間帯（`heartbeat.activeHours`）は、設定されたタイムゾーンで確認されます。時間帯の範囲外では、範囲内の次の実行時刻まで Heartbeat がスキップされます。
- Cron 作業が実行中またはキューに入っている間、Heartbeat は自動的に延期されます。エージェント自身のセッションキーに紐づくサブエージェントまたはネストされたコマンドレーンでも延期するには、`heartbeat.skipWhenBusy: true` を設定します。別のエージェントでサブエージェント作業が進行中というだけでは、兄弟エージェントは一時停止しなくなりました。

## Heartbeat プロンプトの用途

デフォルトのプロンプトは、意図的に幅広い内容になっています。

- **バックグラウンドタスク**：「未完了のタスクを検討する」という指示により、エージェントはフォローアップ項目（受信トレイ、カレンダー、リマインダー、キュー内の作業）を確認し、緊急の事項を提示します。
- **ユーザーへの確認**：「日中、ときどきユーザーの様子を確認する」という指示により、時折、簡潔な「何か必要ですか？」というメッセージを送ります。一方、設定された現地タイムゾーンを使用することで、夜間の過剰な通知を避けます（[タイムゾーン](/ja-JP/concepts/timezone)を参照）。

Heartbeat は完了した[バックグラウンドタスク](/ja-JP/automation/tasks)に反応できますが、Heartbeat の実行自体はタスクレコードを作成しません。

Heartbeat に非常に具体的な処理（例：「Gmail PubSub の統計情報を確認する」や「Gateway の稼働状態を検証する」）を実行させる場合は、`agents.defaults.heartbeat.prompt`（または `agents.list[].heartbeat.prompt`）にカスタム本文を設定します（そのまま送信されます）。

## 応答規約

- 注意が必要な事項がない場合は、**`HEARTBEAT_OK`** と応答します。
- Heartbeat の実行では、代わりに `heartbeat_respond` を呼び出せます。表示される更新が不要な場合は `notify: false`、アラートを送信する場合は `notify: true` と `notificationText` を指定します。構造化されたツール応答が存在する場合は、テキストのフォールバックより優先されます。
- Heartbeat の実行中、OpenClaw は応答の**先頭または末尾**にある `HEARTBEAT_OK` を確認応答として扱います。このトークンは削除され、残りの内容が **`ackMaxChars` 以下**（デフォルト：300）の場合、応答は破棄されます。
- `HEARTBEAT_OK` が応答の**途中**にある場合、特別な扱いは行われません。
- アラートの場合は、`HEARTBEAT_OK` を含めては**いけません**。アラート本文だけを返します。

Heartbeat 以外では、メッセージの先頭または末尾に意図せず含まれた `HEARTBEAT_OK` は削除され、ログに記録されます。`HEARTBEAT_OK` だけのメッセージは破棄されます。

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

### 適用範囲と優先順位

- `agents.defaults.heartbeat` は、Heartbeat のグローバルな動作を設定します。
- `agents.list[].heartbeat` は、その上にマージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、Heartbeat を実行するのは**それらのエージェントだけ**です。
- `channels.defaults.heartbeat` は、すべてのチャンネルの表示に関するデフォルトを設定します。
- `channels.<channel>.heartbeat` は、チャンネルのデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（複数アカウント対応チャンネル）は、チャンネルごとの設定を上書きします。

### エージェントごとの Heartbeat

いずれかの `agents.list[]` エントリに `heartbeat` ブロックが含まれる場合、Heartbeat を実行するのは**それらのエージェントだけ**です。エージェントごとのブロックは `agents.defaults.heartbeat` の上にマージされます（共有のデフォルトを一度設定し、エージェントごとに上書きできます）。

例：2 つのエージェントのうち、2 番目のエージェントだけが Heartbeat を実行します。

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

### 稼働時間帯の例

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

この時間帯の範囲外（米国東部時間の午前 9 時より前、または午後 10 時より後）では、Heartbeat がスキップされます。範囲内の次の予定時刻には、通常どおり実行されます。

### 24 時間 365 日の設定

Heartbeat を終日実行する場合は、次のいずれかのパターンを使用します。

- `activeHours` を完全に省略します（時間帯の制限なし。これがデフォルトの動作です）。
- 終日の時間帯を設定します：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
`start` と `end` に同じ時刻を設定しないでください（例：`08:00` から `08:00`）。これは幅がゼロの時間帯として扱われるため、Heartbeat は常にスキップされます。
</Warning>

### 複数アカウントの例

Telegram などの複数アカウント対応チャンネルで特定のアカウントを対象にするには、`accountId` を使用します。

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

### フィールドの説明

<ParamField path="every" type="string">
  Heartbeat の間隔（期間を表す文字列。デフォルトの単位は分）。
</ParamField>
<ParamField path="model" type="string">
  Heartbeat の実行に使用するモデルの任意の上書き（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  有効にすると、利用可能な場合に個別の `Thinking` メッセージも配信します（`/reasoning on` と同じ形式）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  `true` の場合、Heartbeat の実行では軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` だけを保持します。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  `true` の場合、各 Heartbeat は以前の会話履歴がない新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンを使用します。Heartbeat ごとのトークンコストを大幅に削減します。最大限に節約するには、`lightContext: true` と組み合わせてください。配信のルーティングには引き続きメインセッションのコンテキストが使用されます。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  `true` の場合、そのエージェントに属する追加のビジーレーン、つまり自身のセッションキーに紐づくサブエージェントまたはネストされたコマンド作業があると、Heartbeat の実行を延期します。Cron レーンでは、このフラグがなくても常に Heartbeat が延期されるため、ローカルモデルのホストで Cron と Heartbeat のプロンプトが同時に実行されることはありません。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat の実行に使用する任意のセッションキー。

- `main`（デフォルト）：エージェントのメインセッション。
- 明示的なセッションキー（`openclaw sessions --json` または[セッション CLI](/ja-JP/cli/sessions)からコピー）。
- セッションキーの形式については、[セッション](/ja-JP/concepts/session)と[グループ](/ja-JP/channels/groups)を参照してください。

</ParamField>
<ParamField path="target" type="string">
- `last`：最後に使用した外部チャンネルへ配信します。
- 明示的なチャンネル：設定済みの任意のチャンネルまたは Plugin ID。例：`discord`、`matrix`、`telegram`、`whatsapp`。
- `none`（デフォルト）：Heartbeat を実行しますが、外部には**配信しません**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  ダイレクトメッセージ/DM の配信動作を制御します。`allow`：ダイレクトメッセージ/DM への Heartbeat 配信を許可します。`block`：ダイレクトメッセージ/DM への配信を抑止します（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  省略可能な受信者の上書き（チャネル固有の ID。例: WhatsApp の E.164、Telegram のチャット ID）。Telegram のトピック/スレッドでは、`<chatId>:topic:<messageThreadId>` を使用します。

</ParamField>
<ParamField path="accountId" type="string">
  複数アカウント対応チャネル向けの省略可能なアカウント ID。`target: "last"` の場合、解決された最後のチャネルがアカウントをサポートしていれば、そのアカウント ID が適用されます。それ以外の場合は無視されます。アカウント ID が、解決されたチャネルに設定済みのアカウントと一致しない場合、配信はスキップされます。

</ParamField>
<ParamField path="prompt" type="string">
  デフォルトのプロンプト本文を上書きします（マージはしません）。

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  デフォルトエージェントのシステムプロンプトにある `## Heartbeats` セクションを挿入するかどうか。`false` に設定すると、Heartbeat の実行時動作（間隔、配信、HEARTBEAT.md）を維持しながら、エージェントのシステムプロンプトから Heartbeat の指示を省略します。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  配信前に `HEARTBEAT_OK` の後ろに許可される最大文字数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Heartbeat のエージェントターンが中止されるまでに許可される最大秒数。未設定の場合、`agents.defaults.timeoutSeconds` が設定されていればそれを使用し、それ以外の場合は最大 600 秒に制限された Heartbeat 間隔を使用します。

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat の実行を時間帯で制限します。`start`（HH:MM、境界を含む。日の開始には `00:00` を使用）、`end`（HH:MM、境界を含まない。日の終了には `24:00` を使用可能）、省略可能な `timezone` を持つオブジェクトです。

- 省略または `"user"`: `agents.defaults.userTimezone` が設定されていればそれを使用し、それ以外の場合はホストシステムのタイムゾーンにフォールバックします。
- `"local"`: 常にホストシステムのタイムゾーンを使用します。
- 任意の IANA 識別子（例: `America/New_York`）: 直接使用します。無効な場合は、上記の `"user"` の動作にフォールバックします。
- 有効時間帯では `start` と `end` を同じ値にできません。同じ値は幅ゼロ（常に時間帯の外）として扱われます。
- 有効時間帯の外では、時間帯内の次のティックまで Heartbeat はスキップされます。

</ParamField>

## 配信動作

<AccordionGroup>
  <Accordion title="セッションとターゲットのルーティング">
    - Heartbeat はデフォルトでエージェントのメインセッション（`agent:<id>:<mainKey>`）で実行されます。`session.scope = "global"` の場合は `global` です。特定のチャネルセッション（Discord/WhatsApp など）に上書きするには、`session` を設定します。
    - `session` は実行コンテキストにのみ影響します。配信は `target` と `to` で制御されます。
    - 特定のチャネル/受信者に配信するには、`target` + `to` を設定します。`target: "last"` の場合、そのセッションで最後に使用された外部チャネルに配信します。
    - Heartbeat の配信では、デフォルトで直接送信/DM ターゲットが許可されます。Heartbeat ターンは実行しつつ、直接ターゲットへの送信を抑制するには、`directPolicy: "block"` を設定します。
    - メインキュー、ターゲットセッションのレーン、Cron レーン、または実行中の Cron ジョブがビジー状態の場合、Heartbeat はスキップされ、後で再試行されます。
    - `skipWhenBusy: true` の場合、このエージェントのセッションキーに紐づくサブエージェントとネストされたレーンでも、Heartbeat の実行が延期されます。他のエージェントのビジー状態のレーンによって、このエージェントが延期されることはありません。
    - `target` を解決しても外部の送信先がない場合、実行自体は行われますが、外部へのメッセージは送信されません。

  </Accordion>
  <Accordion title="表示とスキップの動作">
    - `showOk`、`showAlerts`、`useIndicator` がすべて無効な場合、実行は開始前に `reason=alerts-disabled` としてスキップされます。
    - アラート配信のみが無効な場合でも、OpenClaw は Heartbeat を実行し、期限を迎えたタスクのタイムスタンプを更新し、セッションのアイドルタイムスタンプを復元したうえで、外向けのアラートペイロードを抑制できます。
    - 解決された Heartbeat ターゲットが入力中表示をサポートしている場合、OpenClaw は Heartbeat の実行中に入力中であることを表示します。これは Heartbeat がチャット出力を送信するのと同じターゲットを使用し、`typingMode: "never"` で無効になります。

  </Accordion>
  <Accordion title="セッションのライフサイクルと監査">
    - Heartbeat のみの応答は、セッションを存続させることは**ありません**。Heartbeat のメタデータによってセッション行が更新される場合がありますが、アイドル期限切れには最後の実際のユーザー/チャネルメッセージの `lastInteractionAt` が使用され、日次の期限切れには `sessionStartedAt` が使用されます。
    - Control UI と WebChat の履歴では、Heartbeat のプロンプトと OK のみの確認応答は非表示になります。基盤となるセッショントランスクリプトには、監査/再生用としてそれらのターンが含まれる場合があります。
    - 切り離された[バックグラウンドタスク](/ja-JP/automation/tasks)は、メインセッションに何かをすぐ通知する必要がある場合、システムイベントをキューに追加して Heartbeat を起動できます。この起動によって、Heartbeat の実行自体がバックグラウンドタスクになるわけではありません。

  </Accordion>
</AccordionGroup>

## 表示制御

デフォルトでは、アラート内容が配信される一方で、`HEARTBEAT_OK` の確認応答は抑制されます。これはチャネル単位またはアカウント単位で調整できます。

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK を非表示（デフォルト）
      showAlerts: true # アラートメッセージを表示（デフォルト）
      useIndicator: true # インジケーターイベントを発行（デフォルト）
  telegram:
    heartbeat:
      showOk: true # Telegram で OK の確認応答を表示
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # このアカウントへのアラート配信を抑制
```

優先順位: アカウント単位 → チャネル単位 → チャネルのデフォルト → 組み込みのデフォルト。

### 各フラグの動作

- `showOk`: モデルが OK のみの応答を返した場合、`HEARTBEAT_OK` の確認応答を送信します。
- `showAlerts`: モデルが OK ではない応答を返した場合、アラート内容を送信します。
- `useIndicator`: UI のステータス表示向けにインジケーターイベントを発行します。

**3 つすべて**が false の場合、OpenClaw は Heartbeat の実行を完全にスキップします（モデル呼び出しは行いません）。

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
      showOk: true # すべての Slack アカウント
    accounts:
      ops:
        heartbeat:
          showAlerts: false # ops アカウントのアラートのみを抑制
  telegram:
    heartbeat:
      showOk: true
```

### 一般的なパターン

| 目的                                     | 設定                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| デフォルトの動作（OK は非表示、アラートは有効） | _（設定不要）_                                                                     |
| 完全に非表示（メッセージもインジケーターもなし） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| インジケーターのみ（メッセージなし）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1 つのチャネルのみで OK を表示                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（省略可能）

ワークスペースに `HEARTBEAT.md` ファイルが存在する場合、デフォルトのプロンプトはエージェントにそのファイルを読むよう指示します。これは「Heartbeat チェックリスト」として考えてください。30 分ごとに確認しても安全な、小さく安定した内容にします。

通常の実行では、`HEARTBEAT.md` はデフォルトエージェントで Heartbeat のガイダンスが有効な場合にのみ挿入されます。Heartbeat の間隔を `0m` で無効にするか、`includeSystemPromptSection: false` を設定すると、通常のブートストラップコンテキストから省略されます。

ネイティブ Codex ハーネスでは、`HEARTBEAT.md` の内容は他のブートストラップファイルのようにターンへ挿入されません。ファイルが存在し、空白以外の内容がある場合、Heartbeat のコラボレーションモードに関する注記が Codex にそのファイルを示し、続行前に読むよう指示します。

`HEARTBEAT.md` が存在していても実質的に空の場合（空行、Markdown/HTML コメント、`# 見出し` のような Markdown 見出し、フェンスマーカー、空のチェックリスト項目のみ）、OpenClaw は API 呼び出しを節約するため、Heartbeat の実行をスキップします。このスキップは `reason=empty-heartbeat-file` として報告されます。ファイルが存在しない場合でも Heartbeat は実行され、モデルが何をするかを判断します。

プロンプトの肥大化を避けるため、内容はごく小さく（短いチェックリストやリマインダー）保ってください。

`HEARTBEAT.md` の例:

```md
# Heartbeat チェックリスト

- 簡単に確認: 受信トレイに緊急のものはあるか？
- 日中で、ほかに保留中のものがなければ、簡単な状況確認を行う。
- タスクがブロックされている場合は、_不足しているもの_を書き留め、次回 Peter に確認する。
```

### `tasks:` ブロック

`HEARTBEAT.md` は、Heartbeat 内で間隔ベースのチェックを行うための、小さな構造化 `tasks:` ブロックにも対応しています。

例:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "緊急の未読メールを確認し、時間的制約のあるものにフラグを付ける。"
- name: calendar-scan
  interval: 2h
  prompt: "準備やフォローアップが必要な今後の会議を確認する。"

# 追加の指示

- アラートは短く保つ。
- 期限を迎えたすべてのタスクを確認した後、注意が必要なものがなければ HEARTBEAT_OK と応答する。
```

<AccordionGroup>
  <Accordion title="動作">
    - OpenClaw は `tasks:` ブロックを解析し、各タスクをそれぞれの `interval` と照合します。
    - そのティックで**期限を迎えた**タスクのみが Heartbeat のプロンプトに含まれます。
    - 期限を迎えたタスクがない場合、無駄なモデル呼び出しを避けるため、Heartbeat は完全にスキップされます（`reason=no-tasks-due`）。
    - `HEARTBEAT.md` 内のタスク以外の内容は保持され、期限を迎えたタスクの一覧の後に追加コンテキストとして付加されます。
    - タスクの最終実行タイムスタンプはセッション状態（`heartbeatTaskState`）に保存されるため、通常の再起動後も間隔が維持されます。
    - タスクのタイムスタンプは、Heartbeat の実行が通常の応答経路を完了した後にのみ進められます。スキップされた `empty-heartbeat-file` / `no-tasks-due` の実行では、タスクは完了として記録されません。

  </Accordion>
</AccordionGroup>

タスクモードは、毎回すべてのチェックにコストをかけずに、1 つの Heartbeat ファイルへ複数の定期チェックをまとめたい場合に便利です。

### エージェントは HEARTBEAT.md を更新できますか？

はい。更新するよう依頼すれば可能です。

`HEARTBEAT.md` はエージェントのワークスペースにある通常のファイルなので、通常のチャットでエージェントに次のように指示できます。

- 「`HEARTBEAT.md` を更新して、毎日のカレンダーチェックを追加してください。」
- 「`HEARTBEAT.md` を、より短く、受信トレイのフォローアップに重点を置いた内容に書き換えてください。」

これを自発的に行わせたい場合は、Heartbeat のプロンプトに「チェックリストが古くなった場合は、HEARTBEAT.md をより適切な内容に更新する。」のような明示的な一文を含めることもできます。

<Warning>
`HEARTBEAT.md` にシークレット（API キー、電話番号、非公開トークン）を入れないでください。プロンプトコンテキストの一部になります。
</Warning>

## 手動起動（オンデマンド）

`openclaw system event` を使用してシステムイベントをキューに追加し、必要に応じて即時 Heartbeat をトリガーします。

```bash
openclaw system event --text "緊急のフォローアップを確認する" --mode now
```

| フラグ                         | 説明                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `--text <text>`              | システムイベントのテキスト（必須）。                                                                    |
| `--mode <mode>`              | `now` は即時 Heartbeat を実行し、`next-heartbeat`（デフォルト）は次のスケジュール済みティックまで待機します。 |
| `--session-key <sessionKey>` | イベントの対象を特定のセッションにします。デフォルトはエージェントのメインセッションです。                         |
| `--json`                     | JSON を出力します。                                                                                 |

`--session-key` が指定されておらず、複数のエージェントに `heartbeat` が設定されている場合、`--mode now` はそれら各エージェントの Heartbeat を即時実行します。

同じ CLI グループにある関連する Heartbeat 制御:

```bash
openclaw system heartbeat last     # 最後の Heartbeat イベントを表示
openclaw system heartbeat enable   # Heartbeat を有効化
openclaw system heartbeat disable  # Heartbeat を無効化
```

## 推論の配信（省略可能）

デフォルトでは、Heartbeat は最終的な「回答」ペイロードのみを配信します。

処理内容を可視化する場合は、次を有効にします。

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、Heartbeat は接頭辞 `Thinking` が付いた別のメッセージも配信します（形式は `/reasoning on` と同じです）。これは、エージェントが複数のセッションや codex を管理していて、なぜ通知を送ると判断したのかを確認したい場合に役立ちます。ただし、必要以上に内部の詳細が漏れる可能性もあります。グループチャットでは無効のままにすることを推奨します。

## コストへの配慮

Heartbeat はエージェントの完全なターンを実行します。間隔を短くすると、より多くのトークンを消費します。コストを削減するには、次のようにします。

- 会話履歴全体を送信しないようにするには、`isolatedSession: true` を使用します（実行ごとに約 100K トークンから約 2〜5K トークンまで削減）。
- ブートストラップファイルを `HEARTBEAT.md` のみに制限するには、`lightContext: true` を使用します。
- より低コストの `model` を設定します（例: `ollama/llama3.2:1b`）。
- `HEARTBEAT.md` を小さく保ちます。
- 内部状態の更新だけが必要な場合は、`target: "none"` を使用します。

## Heartbeat 後のコンテキスト超過

Heartbeat の実行完了後も、共有セッションでは既存のランタイムモデルが維持されます。そのため、Heartbeat によってセッションがより小さなローカルモデル（たとえば、32k のコンテキストウィンドウを持つ Ollama モデル）に切り替えられると、次のメインセッションのターンでもそのモデルが使用される場合があります。その次のターンでコンテキスト超過が報告され、セッションの直近のランタイムモデルが設定済みの `heartbeat.model` と一致する場合、OpenClaw の復旧メッセージは Heartbeat モデルの持ち越しが原因である可能性を示し、修正方法を提案します。

これを回避するには、`isolatedSession: true` を使用して新しいセッションで Heartbeat を実行します（プロンプトを最小限にするには、必要に応じて `lightContext: true` と組み合わせます）。または、共有セッションに十分な大きさのコンテキストウィンドウを持つ Heartbeat モデルを選択します。

## 関連項目

- [自動化](/ja-JP/automation) - すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) - 切り離された処理を追跡する方法
- [タイムゾーン](/ja-JP/concepts/timezone) - タイムゾーンが Heartbeat のスケジュールに与える影響
- [トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting) - 自動化の問題をデバッグする方法
