---
read_when:
    - グループチャットの動作またはメンションゲートの変更
    - mentionPatterns を特定のグループ会話にスコープする
sidebarTitle: Groups
summary: 各サーフェスでのグループチャットの動作 (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: グループ
x-i18n:
    generated_at: "2026-07-05T11:02:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 28df65cd1b9b682ae72ea8697597a6481b85ee2689479237a2d1896483386907
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、QQBot、Signal、Slack、Telegram、WhatsApp、Zalo など、グループ対応チャンネル全体で同じグループルールを適用します。

エージェントが明示的に可視メッセージを送信しない限り、静かなコンテキストだけを提供する常時オンのルームについては、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

## 初心者向け概要 (2 分)

OpenClaw は自分のメッセージングアカウント上に「常駐」します。独立した WhatsApp ボットユーザーはありません。**あなた**がグループに参加していれば、OpenClaw はそのグループを参照し、そこで応答できます。

デフォルトの動作:

- グループは制限されます (`groupPolicy: "allowlist"`)。グループ送信者は許可リストに入るまでブロックされます。
- グループでメンションゲートを無効にしない限り、返信にはメンションが必要です。
- 最終返信テキストは自動的にルームへ投稿されます (`visibleReplies: "automatic"`)。

つまり: 許可リストに入った送信者は、OpenClaw をメンションすることで起動できます。

<Note>
**要約**

- **DM アクセス**は `*.allowFrom` で制御されます。
- **グループアクセス**は `*.groupPolicy` + 許可リスト (`*.groups`, `*.groupAllowFrom`) で制御されます。
- **返信の起動**はメンションゲート (`requireMention`, `/activation`) で制御されます。

</Note>

クイックフロー (グループメッセージに何が起こるか):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## 可視返信

通常のグループ/チャンネルリクエストでは、OpenClaw のデフォルトは `messages.groupChat.visibleReplies: "automatic"` です。最終アシスタントテキストは、可視返信としてルームに投稿されます。

共有ルームで、エージェントが `message(action=send)` を呼び出して発話タイミングを決められるようにする場合は、`messages.groupChat.visibleReplies: "message_tool"` を使用します。これはツールを確実に使えるモデル (たとえば GPT 5.5) で最も効果的です。モデルがツールを使い忘れて実質的な最終テキストを返した場合、OpenClaw はそれをルームへ投稿せず非公開のまま保持します。

ツールのみの配信に確実に従わないモデルやランタイムには `"automatic"` を使用します。通常の最終テキストはルームへ直接投稿され、エージェントは最終テキストに同梱できないファイル、画像、その他の添付ファイルについては引き続き `message(action=send)` を呼び出せます。

アクティブなツールポリシーでメッセージツールが利用できない場合、OpenClaw はレスポンスを黙って抑制するのではなく、自動可視返信にフォールバックします。`openclaw doctor` はこの不一致について警告します。

ダイレクトチャットやその他のソースイベントでは、`messages.visibleReplies: "message_tool"` が同じツールのみの動作をグローバルに適用します。`messages.groupChat.visibleReplies` は、グループ/チャンネルルーム向けのより具体的な上書きとして残ります。内部 WebChat の直接ターンは、Pi と Codex が同じ可視返信契約を受け取れるように、デフォルトで自動の最終返信配信になります。

ツールのみモードは、ほとんどの潜伏モードのターンでモデルに `NO_REPLY` と答えさせる古いパターンを置き換えます。ツールのみモードでは、プロンプトは `NO_REPLY` 契約を定義しません。可視の動作を何もしないことは、単にメッセージツールを呼び出さないことを意味します。

Plugin が所有する会話バインディングは例外です。Plugin がスレッドをバインドして受信ターンを引き受けると、その Plugin が返す返信が可視のバインディングレスポンスになります。`message(action=send)` は不要です。その返信は Plugin ランタイムの出力であり、非公開のモデル最終テキストではありません。

入力インジケーターは、直接のグループリクエストでは引き続き送信されます。アンビエントの常時オンルームイベントは、有効な場合でも、エージェントがメッセージツールを呼び出さない限り厳密かつ静かに保たれます。

セッションはデフォルトで冗長なツール/進捗サマリーを抑制します。デバッグ中に現在のセッションで表示するには `/verbose on` (または `/verbose full`) を使用し、最終返信のみの動作に戻すには `/verbose off` を使用します。冗長状態はセッション単位で、ダイレクトチャット、グループ、チャンネル、フォーラムトピックで同じように動作します。

メンションされていない常時オンのグループ雑談をユーザーリクエストではなく静かなルームコンテキストとして送信するには、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を使用します。

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

デフォルトは `unmentionedInbound: "user_request"` です。メンションされたメッセージ、コマンド、中止リクエスト、DM はユーザーリクエストのままです。

グループ/チャンネルリクエストで可視出力がメッセージツールを通ることを必須にするには:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

すべてのソースチャットで必須にするには:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Gateway は、ファイル保存後に再起動なしで `messages` 設定変更を取り込みます。再起動が必要なのは、設定リロードが無効 (`gateway.reload.mode: "off"`) の場合だけです。

コマンドターンは `visibleReplies: "message_tool"` を迂回し、常に可視で返信します。ネイティブスラッシュコマンド (Discord、Telegram、およびネイティブコマンド対応のその他のサーフェス) と承認済みテキスト `/...` コマンドは、どちらもレスポンスをソースチャットへ投稿します。グループ内の未承認テキスト `/...` ターンはメッセージツールのみのままです。通常のチャットターンは設定されたデフォルトに従います。

## コンテキストの可視性と許可リスト

グループの安全性には 2 つの異なる制御が関係します。

- **起動の承認**: 誰がエージェントを起動できるか (`groupPolicy`, `groups`, `groupAllowFrom`, チャンネル固有の許可リスト)。
- **コンテキストの可視性**: どの補足コンテキストをモデルに注入するか (返信/引用テキスト、スレッド履歴、転送メタデータ)。

デフォルトでは、OpenClaw は受信したコンテキストをそのまま保持します。許可リストが決めるのは誰がアクションを起動できるかであり、モデルが見る引用や履歴スニペットではありません。補足コンテキストもフィルターするには、`contextVisibility` を設定します。

| モード              | 動作                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (デフォルト) | 受信した補足コンテキストをそのまま保持します。                                   |
| `"allowlist"`       | 許可リストに入った送信者からの履歴/スレッド/引用/転送コンテキストのみ注入します。 |
| `"allowlist_quote"` | `allowlist` に加えて、任意の送信者から明示的に引用/返信されたメッセージを保持します。 |

チャンネル単位 (`channels.<channel>.contextVisibility`)、アカウント単位 (`channels.<channel>.accounts.<accountId>.contextVisibility`)、またはグローバル (`channels.defaults.contextVisibility`) に設定します。補足コンテキストを取得するチャンネル (Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp) は、受信コンテキストを構築するときにこのポリシーを適用します。不明なポリシーの組み合わせはフェイルクローズし、コンテキストを省略します。

![グループメッセージフロー](/images/groups-flow.svg)

目的別設定:

| 目的                                             | 設定内容                                                   |
| ------------------------------------------------ | ---------------------------------------------------------- |
| すべてのグループを許可するが @メンション時のみ返信 | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効化                     | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                               | `groups: { "<group-id>": { ... } }` (`"*"` キーなし)       |
| グループ内であなただけが起動できる               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| 信頼済み送信者セットをチャンネル間で再利用       | `groupAllowFrom: ["accessGroup:operators"]`                |

再利用可能な送信者許可リストについては、[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使用します (ルーム/チャンネルは `agent:<agentId>:<channel>:channel:<id>` を使用します)。
- Telegram フォーラムトピックは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` を追加します。
- ダイレクトチャットはメインセッションを使用します (または `session.dmScope` が設定されている場合は送信者ごとのセッション)。
- Heartbeat は設定された Heartbeat セッションで実行されます (デフォルト: エージェントのメインセッション)。グループセッションは独自の Heartbeat を実行しません。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人 DM + 公開グループ (単一エージェント)

はい。「個人」トラフィックが **DM** で、「公開」トラフィックが **グループ** なら、これはうまく機能します。

理由: 単一エージェントモードでは、DM は通常 **メイン** セッションキー (`agent:main:main`) に入り、グループは常に **非メイン** セッションキー (`agent:main:<channel>:group:<id>`) を使用します。`mode: "non-main"` でサンドボックス化を有効にすると、それらのグループセッションは設定されたサンドボックスバックエンドで実行され、メイン DM セッションはホスト上に残ります。バックエンドを選ばない場合、Docker がデフォルトです。

これにより、1 つのエージェント「頭脳」(共有ワークスペース + メモリ) で、2 つの実行姿勢を持てます。

- **DM**: フルツール (ホスト)
- **グループ**: サンドボックス + 制限付きツール

<Note>
本当に分離されたワークスペース/ペルソナ (「個人」と「公開」が決して混ざってはならない) が必要な場合は、2 つ目のエージェント + バインディングを使用してください。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。
</Note>

<Tabs>
  <Tab title="DM はホスト上、グループはサンドボックス化">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="グループには許可リストに入ったフォルダーだけを見せる">
    「グループはフォルダー X だけを見られる」ようにしたい場合、「ホストアクセスなし」の代わりに `workspaceAccess: "none"` を維持し、許可リストに入ったパスだけをサンドボックスにマウントします。

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:mode
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

関連:

- 設定キーとデフォルト: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- ツールがブロックされる理由のデバッグ: [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
- バインドマウントの詳細: [サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UI ラベルは、利用可能な場合 `displayName` を使用し、`<channel>:<token>` としてフォーマットされます。
- `#room` はルーム/チャンネル用に予約されています。グループチャットは `g-<slug>` (小文字、スペース -> `-`、`#@+._-` は保持) を使用します。非常に長い不透明な ID は、完全なルート ID を UI に漏らす代わりに、安定したトークンへ短縮されます。

## グループポリシー

チャンネルごとにグループ/ルームメッセージの処理方法を制御します:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (setup resolves @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| ポリシー      | 動作                                                         |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | グループは許可リストをバイパスします。メンションゲーティングは引き続き適用されます。 |
| `"disabled"`  | すべてのグループメッセージを完全にブロックします。           |
| `"allowlist"` | 設定された許可リストに一致するグループ/ルームのみを許可します。 |

<AccordionGroup>
  <Accordion title="チャンネル別の注記">
    - `groupPolicy` はメンションゲーティング（@メンションを要求するもの）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使用します（フォールバック: 明示的な `allowFrom`）。
    - Signal: `groupAllowFrom` は、受信した Signal グループ ID または送信者の電話番号/UUID のいずれにも一致できます。
    - DM ペアリング承認（`*-allowFrom` ストアエントリ）は DM アクセスにのみ適用されます。グループ送信者の承認は、グループ許可リストに対して明示的なままです。
    - Discord: 許可リストは `channels.discord.guilds.<id>.channels` を使用します。
    - Slack: 許可リストは `channels.slack.channels` を使用します。
    - Matrix: 許可リストは `channels.matrix.groups` を使用します。ルーム ID（`!room:server`）またはエイリアス（`#alias:server`）を使用します。ルーム名キーは `channels.matrix.dangerouslyAllowNameMatching: true` の場合にのみ一致し、解決できないエントリはランタイムで無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用します。ルーム単位の `users` 許可リストもサポートされています。
    - グループ DM は別個に制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`: `groupEnabled`、`groupChannels`）。
    - Telegram: 送信者許可リストは数値ユーザー ID のみを受け入れます（`"123456789"`。`telegram:`/`tg:` プレフィックスは大文字小文字を区別せずに削除されます）。`@username` エントリはランタイムで一致せず、警告をログに記録します。セットアップは `@username` を ID に解決します。負のチャット ID は送信者許可リストではなく `channels.telegram.groups` に属します。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
    - ランタイムの安全性: プロバイダーブロックが完全に欠落している場合（`channels.<provider>` が存在しない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承する代わりに `allowlist` にフェイルクローズし、Gateway はアカウントごとに一度だけフォールバックをログに記録します。

  </Accordion>
</AccordionGroup>

グループメッセージの簡単なメンタルモデル（評価順）:

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="グループ許可リスト">
    グループ許可リスト（`*.groups`、`*.groupAllowFrom`、チャンネル固有の許可リスト）。
  </Step>
  <Step title="メンションゲーティング">
    メンションゲーティング（`requireMention`、`/activation`）。
  </Step>
</Steps>

## メンションゲーティング（デフォルト）

グループメッセージは、グループごとに上書きされない限りメンションを要求します。デフォルトはサブシステムごとに `*.groups."*"` の下にあります。

チャンネルが返信メタデータを公開している場合、ボットメッセージへの返信は暗黙のメンションとして扱われます。引用メタデータを公開しているチャンネルでは、ボットメッセージの引用もメンションとして扱われることがあります。現在の組み込みケース: Discord、Microsoft Teams、QQBot、Slack、Telegram、WhatsApp、Zalo personal。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

## 設定済みメンションパターンのスコープ指定

設定済みの `mentionPatterns` は正規表現のフォールバックトリガーです。プラットフォームがネイティブのボットメンションを公開しない場合、または `openclaw:` のようなプレーンテキストをメンションとして扱う必要がある場合に使用します。ネイティブのプラットフォームメンションは別です。Discord、Slack、Telegram、Matrix、または別のチャンネルが、そのメッセージでボットが明示的にメンションされたことを証明できる場合、設定済みの正規表現パターンが拒否される場所でも、そのネイティブメンションは引き続きトリガーします。

デフォルトでは、設定済みメンションパターンは、チャンネルがプロバイダーと会話の情報をメンション検出に渡すすべての場所で適用されます。広範なパターンがすべてのグループでエージェントを起動しないようにするには、`channels.<channel>.mentionPatterns` を使ってチャンネルごとにスコープを指定します。

正規表現メンションパターンをチャンネルでデフォルト無効にし、特定のルームだけ `allowIn` で有効にする場合は、`mode: "deny"` を使用します。

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

正規表現メンションパターンを広範に適用し、ノイズの多いルームで `denyIn` によって無効にする場合は、デフォルトの `mode: "allow"` を使用します（または `mode` を省略します）。

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

ポリシー解決:

| フィールド      | 効果                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 会話 ID が `denyIn` に含まれていない限り、正規表現メンションパターンは有効です。これがデフォルトです。                |
| `mode: "deny"`  | 会話 ID が `allowIn` に含まれていない限り、正規表現メンションパターンは無効です。                                    |
| `allowIn`       | 拒否モードで正規表現メンションパターンが有効になる会話 ID。                                                          |
| `denyIn`        | 正規表現メンションパターンが無効になる会話 ID。同じ ID が両方に含まれる場合、`denyIn` が `allowIn` より優先されます。 |

現在サポートされているスコープ付き正規表現ポリシー:

| チャンネル | `allowIn` / `denyIn` で使用される ID                         |
| ---------- | ------------------------------------------------------------ |
| Discord    | Discord チャンネル ID。                                      |
| Matrix     | Matrix ルーム ID。                                           |
| Slack      | Slack チャンネル ID。                                        |
| Telegram   | グループチャット ID、またはフォーラムトピック用の `chatId:topic:threadId`。 |
| WhatsApp   | `123@g.us` などの WhatsApp 会話 ID。                         |

アカウントレベルのチャンネル設定では、そのチャンネルが複数アカウントをサポートしている場合、同じポリシーを `channels.<channel>.accounts.<accountId>.mentionPatterns` の下に設定できます。アカウントポリシーは、そのアカウントに対してトップレベルのチャンネルポリシーより優先されます。

<AccordionGroup>
  <Accordion title="メンションゲーティングの注記">
    - `mentionPatterns` は大文字小文字を区別しない安全な正規表現パターンです。無効なパターンと安全でないネストされた繰り返し形式は無視されます（警告付き）。
    - パターンの優先順位: `agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に便利）が `messages.groupChat.mentionPatterns` を上書きします。どちらも設定されていない場合、パターンはエージェントの識別名/絵文字から派生します。
    - メンションゲーティングは、メンション検出が可能な場合（ネイティブメンションまたは `mentionPatterns` が設定されている場合）にのみ強制されます。
    - グループまたは送信者を許可リストに登録しても、メンションゲーティングは無効になりません。すべてのメッセージでトリガーする必要がある場合は、そのグループの `requireMention` を `false` に設定します。
    - 自動グループチャットプロンプトコンテキストは、解決済みのサイレント返信指示を毎ターン運びます。ワークスペースファイルで `NO_REPLY` の仕組みを重複させないでください。
    - 自動サイレント返信が許可されているグループでは、クリーンな空のモデルターンまたは推論のみのモデルターンを、`NO_REPLY` と同等のサイレントとして扱います。ダイレクトチャットは `NO_REPLY` ガイダンスを受け取らず、メッセージツールのみのグループ返信は `message(action=send)` を呼び出さないことで静かなままになります。
    - 常時オンの周辺グループ会話は、デフォルトでユーザーリクエストのセマンティクスを使用します。静かなコンテキストとして送信するには、代わりに `messages.groupChat.unmentionedInbound: "room_event"` を設定します。セットアップ例については [周辺ルームイベント](/ja-JP/channels/ambient-room-events) を参照してください。
    - ルームイベントは偽のユーザーリクエストとして保存されず、メッセージツールを使わないルームイベントからの非公開アシスタントテキストはチャット履歴として再生されません。
    - Discord のデフォルトは `channels.discord.guilds."*"` にあります（ギルド/チャンネルごとに上書き可能）。
    - グループ履歴コンテキストはチャンネル間で一様にラップされます。メンションゲート付きグループは保留中のスキップ済みメッセージを保持します。常時オンのグループも、チャンネルがサポートしている場合は最近処理されたルームメッセージを保持することがあります。グローバルデフォルトには `messages.groupChat.historyLimit` を使用し、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ/チャンネルのツール制限（任意）

一部のチャンネル設定では、**特定のグループ/ルーム/チャンネル内**で利用可能なツールを制限できます。

- `tools`: グループ全体のツールを許可/拒否します（`allow`、`alsoAllow`、`deny`。拒否が優先）。
- `toolsBySender`: グループ内の送信者ごとの上書き。明示的なキープレフィックスを使用します: `channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。チャンネル ID は正規の OpenClaw チャンネル ID を使用します。`teams` などのエイリアスは `msteams` に正規化されます。従来のプレフィックスなしキーも引き続き受け入れられますが、`id:` としてのみ照合され、非推奨警告をログに記録します。

解決順序（最も具体的なものが優先）:

<Steps>
  <Step title="グループ toolsBySender">
    グループ/チャンネルの `toolsBySender` 一致。
  </Step>
  <Step title="グループ tools">
    グループ/チャンネルの `tools`。
  </Step>
  <Step title="デフォルト toolsBySender">
    デフォルト（`"*"`）の `toolsBySender` 一致。
  </Step>
  <Step title="デフォルト tools">
    デフォルト（`"*"`）の `tools`。
  </Step>
</Steps>

例（Telegram）:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
グループ/チャンネルのツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます（拒否は引き続き優先されます）。一部のチャンネルでは、ルーム/チャンネルに異なるネストを使用します（例: Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、キーはグループ許可リストとして機能します。デフォルトのメンション動作を設定したまますべてのグループを許可するには、`"*"` を使用します。

<Warning>
よくある混同: DM ペアリング承認はグループ認可と同じではありません。DM ペアリングをサポートするチャンネルでは、ペアリングストアが解除するのは DM のみです。グループコマンドには、`groupAllowFrom` などの設定許可リスト、またはそのチャンネルで文書化された設定フォールバックによる、明示的なグループ送信者認可が引き続き必要です。
</Warning>

一般的な意図 (コピーして貼り付け):

<Tabs>
  <Tab title="すべてのグループ返信を無効化">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="特定のグループのみ許可 (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="すべてのグループを許可するがメンションを必須にする">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="所有者のみのトリガー (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## 有効化 (所有者のみ)

グループ所有者は、単独のメッセージでグループごとの有効化を切り替えられます:

- `/activation mention`
- `/activation always`

`/activation` はコアの所有者制限付きコマンドで、グループチャットにのみ適用されます。所有者とは、送信者がチャンネルの `allowFrom` / `commands.ownerAllowFrom` と一致することを意味します (許可リストが設定されていない場合、アカウント自身の ID が所有者として扱われます)。保存されたモードは、それを参照するチャンネル (Google Chat、QQBot、Telegram、WhatsApp) でそのグループの `requireMention` を上書きし、グループのシステムプロンプトのイントロはすべての場所で有効なモードを反映します。

## コンテキストフィールド

グループの受信ペイロードは次を設定します:

- `ChatType=group`
- `GroupSubject` (既知の場合)
- `GroupMembers` (既知の場合)
- `WasMentioned` (メンションゲートの結果)
- Telegram フォーラムトピックには `MessageThreadId` と `IsForum` も含まれます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターン (および `/activation` の変更後) にグループのイントロが含まれます。これは、モデルに人間のように応答し、空行を最小限にし、通常のチャット間隔に従い、リテラルの `\n` シーケンスを入力しないよう促します。Telegram 以外のグループでは Markdown テーブルも非推奨です。Telegram のリッチテキストガイダンスは Telegram チャンネルプロンプトから来ます。チャンネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンス付きの信頼されていないメタデータとしてレンダリングされます。

## iMessage 固有事項

- ルーティングまたは許可リスト設定では `chat_id:<id>` を優先してください。
- チャットの一覧表示: `imsg chats --limit 20`。
- グループ返信は常に同じ `chat_id` に返されます。

## WhatsApp システムプロンプト

グループとダイレクトのプロンプト解決、ワイルドカードの動作、アカウントの上書きセマンティクスを含む、正規の WhatsApp システムプロンプトルールについては [WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp 固有事項

WhatsApp のみの動作 (履歴注入、メンション処理の詳細) については [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
