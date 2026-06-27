---
read_when:
    - グループチャットの動作またはメンションゲートの変更
    - mentionPatterns を特定のグループ会話にスコープする
sidebarTitle: Groups
summary: 各サーフェスでのグループチャットの動作 (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: グループ
x-i18n:
    generated_at: "2026-06-27T10:34:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は各サーフェスのグループチャットを一貫して扱います: Discord、iMessage、Matrix、Microsoft Teams、QQBot、Signal、Slack、Telegram、WhatsApp、Zalo。

エージェントが明示的に表示メッセージを送信しない限り静かなコンテキストを提供する常時稼働ルームについては、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

## 初心者向け概要（2分）

OpenClaw は自分のメッセージングアカウント上に「存在」します。別個の WhatsApp ボットユーザーはありません。**あなた**がグループにいる場合、OpenClaw はそのグループを認識し、そこで応答できます。

デフォルトの動作:

- グループは制限されます（`groupPolicy: "allowlist"`）。
- メンションゲーティングを明示的に無効化しない限り、返信にはメンションが必要です。
- グループ/チャンネルでの表示返信は、デフォルトで `message` ツールを使用します。

つまり、許可リストに登録された送信者は、OpenClaw にメンションすることで OpenClaw をトリガーできます。

<Note>
**要約**

- **DM アクセス**は `*.allowFrom` で制御されます。
- **グループアクセス**は `*.groupPolicy` + 許可リスト（`*.groups`、`*.groupAllowFrom`）で制御されます。
- **返信のトリガー**はメンションゲーティング（`requireMention`、`/activation`）で制御されます。

</Note>

クイックフロー（グループメッセージで何が起きるか）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## 表示返信

通常のグループ/チャンネルリクエストでは、OpenClaw はデフォルトで `messages.groupChat.visibleReplies: "automatic"` を使用します。ルームを message-tool-only 出力にオプトインしない限り、最終的なアシスタントテキストはレガシーの表示返信パスを通じて投稿されます。

共有ルームで、エージェントが `message(action=send)` を呼び出して発言タイミングを決められるようにする場合は、`messages.groupChat.visibleReplies: "message_tool"` を使用します。これは GPT 5.5 のような最新世代でツール信頼性の高いモデルに支えられたグループルームで最も効果的です。モデルがそのツールを呼び損ね、内容のある最終テキストを返した場合、OpenClaw はその最終テキストをルームに投稿せず非公開のままにします。

ツールのみの配信を安定して理解できない弱いモデルやランタイムには `"automatic"` を使用します。automatic モードでは、エージェントの最終アシスタントテキストが表示ソース返信パスになるため、`message(action=send)` を一貫して呼び出せないモデルでも通常どおり回答できます。

automatic モードでは、通常のテキスト最終返信はルームに直接投稿されます。表示返信にファイル、画像、その他の添付が必要な場合、エージェントは最終テキスト返信に無理に通そうとする代わりに、その添付に `message(action=send)` を使用できます。

アクティブなツールポリシーで message ツールが利用できない場合、OpenClaw は応答を黙って抑制するのではなく、automatic の表示返信にフォールバックします。`openclaw doctor` はこの不一致について警告します。

ダイレクトチャットやその他のソースイベントでは、同じツールのみの表示返信動作をグローバルに適用するために `messages.visibleReplies: "message_tool"` を使用します。内部 WebChat のダイレクトターンは、Pi と Codex が同じ表示返信契約を受け取れるように、デフォルトで automatic の最終返信配信になります。表示出力に意図的に `message(action=send)` を要求するには、`messages.visibleReplies: "message_tool"` を設定します。`messages.groupChat.visibleReplies` は、グループ/チャンネルルーム向けのより具体的な上書きとして残ります。

これは、ほとんどの待機モードのターンでモデルに `NO_REPLY` と回答させる古いパターンを置き換えます。ツールのみモードでは、プロンプトは `NO_REPLY` 契約を定義しません。表示上何もしないことは、単に message ツールを呼び出さないことを意味します。

Plugin が所有する会話バインディングは例外です。Plugin がスレッドをバインドして受信ターンを引き受けると、Plugin が返す返信が表示バインディング応答になります。`message(action=send)` は不要です。その返信は Plugin ランタイム出力であり、非公開のモデル最終テキストではありません。

入力中インジケーターは、ダイレクトなグループリクエストでは引き続き送信されます。アンビエント常時稼働ルームイベントは、有効化されている場合でも、エージェントが message ツールを呼び出さない限り厳密かつ静かなままです。

セッションはデフォルトで冗長なツール/進行状況サマリーを抑制します。デバッグ中に現在のセッションでそれらのサマリーを表示するには `/verbose on` を使用し、最終返信のみの動作に戻すには `/verbose off` を使用します。同じ verbose 状態は、ダイレクトチャット、グループ、チャンネル、フォーラムトピック全体に適用されます。

メンションされていない常時稼働グループの会話をユーザーリクエストではなく静かなルームコンテキストとして送信するには、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を使用します。

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

デフォルトは `unmentionedInbound: "user_request"` です。

メンションされたメッセージ、コマンド、中止リクエスト、DM はユーザーリクエストのままです。

グループ/チャンネルリクエストで表示出力を message ツール経由にするには:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Gateway は、ファイルが保存された後に `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効化されている場合のみ再起動してください。

すべてのソースチャットで表示出力を message ツール経由にするには:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンド対応のあるその他のサーフェス）は `visibleReplies: "message_tool"` を迂回し、チャンネルネイティブのコマンド UI が期待する応答を得られるよう常に表示で返信します。これは検証済みのネイティブコマンドターンにのみ適用されます。テキスト入力された `/...` コマンドや通常のチャットターンは、引き続き設定済みのグループデフォルトに従います。

## コンテキスト可視性と許可リスト

グループの安全性には、2つの異なる制御が関係します。

- **トリガー認可**: 誰がエージェントをトリガーできるか（`groupPolicy`、`groups`、`groupAllowFrom`、チャンネル固有の許可リスト）。
- **コンテキスト可視性**: どの補足コンテキストがモデルに注入されるか（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は通常のチャット動作を優先し、コンテキストをほぼ受信したまま保持します。つまり、許可リストは主に誰がアクションをトリガーできるかを決めるものであり、すべての引用や履歴スニペットに対する汎用の編集境界ではありません。

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - 一部のチャンネルでは、特定のパスで補足コンテキストに対して送信者ベースのフィルタリングをすでに適用しています（たとえば Slack スレッドシード、Matrix 返信/スレッド検索）。
    - その他のチャンネルでは、引用/返信/転送コンテキストを受信したまま渡します。

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"`（デフォルト）は、現在の受信時のままの動作を維持します。
    - `contextVisibility: "allowlist"` は、補足コンテキストを許可リストに登録された送信者にフィルタリングします。
    - `contextVisibility: "allowlist_quote"` は `allowlist` に加えて、明示的な引用/返信例外を1つ許可します。

    この強化モデルがチャンネル全体で一貫して実装されるまでは、サーフェスごとの差異を想定してください。

  </Accordion>
</AccordionGroup>

![グループメッセージフロー](/images/groups-flow.svg)

目的別設定:

| 目的                                         | 設定する内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可するが @メンション時のみ返信 | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効化                    | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                             | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）         |
| グループ内で自分だけがトリガーできる             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| チャンネル間で1つの信頼済み送信者セットを再利用する | `groupAllowFrom: ["accessGroup:operators"]`                |

再利用可能な送信者許可リストについては、[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使用します（ルーム/チャンネルは `agent:<agentId>:<channel>:channel:<id>` を使用します）。
- Telegram フォーラムトピックは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` を追加します。
- ダイレクトチャットはメインセッション（または設定されている場合は送信者ごと）を使用します。
- Heartbeat はグループセッションではスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人 DM + 公開グループ（単一エージェント）

はい。「個人」トラフィックが **DM** で、「公開」トラフィックが **グループ** であれば、これはうまく機能します。

理由: 単一エージェントモードでは、DM は通常 **main** セッションキー（`agent:main:main`）に到達します。一方、グループは常に **非 main** セッションキー（`agent:main:<channel>:group:<id>`）を使用します。`mode: "non-main"` でサンドボックス化を有効にすると、それらのグループセッションは設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。

これにより、1つのエージェント「頭脳」（共有ワークスペース + メモリ）でありながら、2つの実行姿勢を持てます。

- **DM**: フルツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

<Note>
本当に分離されたワークスペース/ペルソナ（「個人」と「公開」が決して混ざってはいけない）が必要な場合は、2つ目のエージェント + バインディングを使用してください。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
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
  <Tab title="Groups see only an allowlisted folder">
    「グループはフォルダー X だけを見られる」にしたい場合、「ホストアクセスなし」の代わりに `workspaceAccess: "none"` を維持し、許可リストに登録されたパスだけをサンドボックスにマウントします。

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
- ツールがブロックされる理由のデバッグ: [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
- バインドマウントの詳細: [サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UI ラベルは、利用可能な場合 `displayName` を使用し、`<channel>:<token>` としてフォーマットされます。
- `#room` はルーム/チャンネル用に予約されています。グループチャットは `g-<slug>`（小文字、スペース -> `-`、`#@+._-` は維持）を使用します。

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
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
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

| ポリシー        | 動作                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | グループは許可リストをバイパスします。メンションゲーティングは引き続き適用されます。      |
| `"disabled"`  | すべてのグループメッセージを完全にブロックします。                           |
| `"allowlist"` | 設定された許可リストに一致するグループ/ルームのみを許可します。 |

<AccordionGroup>
  <Accordion title="チャネル別の注記">
    - `groupPolicy` はメンションゲーティング（@メンションが必要）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使用します（フォールバック: 明示的な `allowFrom`）。
    - Signal: `groupAllowFrom` は、受信した Signal グループ ID または送信者の電話番号/UUID のどちらにも一致できます。
    - DM ペアリング承認（`*-allowFrom` ストアエントリ）は DM アクセスにのみ適用されます。グループ送信者の認可は、グループ許可リストに対して明示的なままです。
    - Discord: 許可リストは `channels.discord.guilds.<id>.channels` を使用します。
    - Slack: 許可リストは `channels.slack.channels` を使用します。
    - Matrix: 許可リストは `channels.matrix.groups` を使用します。ルーム ID またはエイリアスを推奨します。参加済みルーム名の検索はベストエフォートで、解決できない名前はランタイムで無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用します。ルーム別の `users` 許可リストもサポートされています。
    - グループ DM は別途制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram 許可リストは、ユーザー ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字小文字を区別しません。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
    - ランタイムの安全性: プロバイダーブロックが完全に存在しない場合（`channels.<provider>` がない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承するのではなく、フェイルクローズモード（通常は `allowlist`）にフォールバックします。

  </Accordion>
</AccordionGroup>

簡単なメンタルモデル（グループメッセージの評価順序）:

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="グループ許可リスト">
    グループ許可リスト（`*.groups`、`*.groupAllowFrom`、チャネル固有の許可リスト）。
  </Step>
  <Step title="メンションゲーティング">
    メンションゲーティング（`requireMention`、`/activation`）。
  </Step>
</Steps>

## メンションゲーティング（デフォルト）

グループメッセージは、グループごとに上書きされない限りメンションが必要です。デフォルトはサブシステムごとに `*.groups."*"` の下にあります。

チャネルが返信メタデータをサポートしている場合、ボットメッセージへの返信は暗黙のメンションとして扱われます。引用メタデータを公開するチャネルでは、ボットメッセージの引用も暗黙のメンションとして扱われることがあります。現在の組み込みケースには、Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUser が含まれます。

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

## 設定済みメンションパターンのスコープ

設定済みの `mentionPatterns` は正規表現のフォールバックトリガーです。
プラットフォームがネイティブのボットメンションを公開しない場合、または
`openclaw:` のようなプレーンテキストをメンションとして扱いたい場合に使用します。
ネイティブのプラットフォームメンションは別です。Discord、Slack、Telegram、Matrix、
または別のチャネルが、メッセージでボットが明示的にメンションされたことを証明できる場合、
設定済み正規表現パターンが拒否されていても、そのネイティブメンションは引き続きトリガーされます。

デフォルトでは、設定済みメンションパターンは、そのチャネルがプロバイダーと会話の事実を
メンション検出に渡すすべての場所に適用されます。広範なパターンでエージェントが
すべてのグループで起動しないようにするには、`channels.<channel>.mentionPatterns` で
チャネルごとにスコープします。

正規表現メンションパターンをチャネルでデフォルト無効にし、
`allowIn` で特定のルームをオプトインする場合は `mode: "deny"` を使用します。

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

正規表現メンションパターンを広く適用し、ノイズの多いルームで `denyIn` によって
無効にする場合は、デフォルトの `mode: "allow"`（または `mode` の省略）を使用します。

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

| フィールド           | 効果                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 会話 ID が `denyIn` に含まれていない限り、正規表現メンションパターンは有効です。これがデフォルトです。                    |
| `mode: "deny"`  | 会話 ID が `allowIn` に含まれていない限り、正規表現メンションパターンは無効です。                                       |
| `allowIn`       | 拒否モードで正規表現メンションパターンが有効になる会話 ID。                                               |
| `denyIn`        | 正規表現メンションパターンが無効になる会話 ID。同じ ID が両方に含まれる場合、`denyIn` が `allowIn` より優先されます。 |

現在サポートされているスコープ付き正規表現ポリシー:

| チャネル  | `allowIn` / `denyIn` で使用される ID                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord チャネル ID。                                         |
| Matrix   | Matrix ルーム ID。                                             |
| Slack    | Slack チャネル ID。                                           |
| Telegram | グループチャット ID、またはフォーラムトピックの場合は `chatId:topic:threadId`。 |
| WhatsApp | `123@g.us` などの WhatsApp 会話 ID。                |

そのチャネルが複数アカウントをサポートする場合、アカウントレベルのチャネル設定では
`channels.<channel>.accounts.<accountId>.mentionPatterns` の下に同じポリシーを設定できます。
アカウントポリシーは、そのアカウントについてトップレベルのチャネルポリシーより優先されます。

<AccordionGroup>
  <Accordion title="メンションゲーティングの注記">
    - `mentionPatterns` は大文字小文字を区別しない安全な正規表現パターンです。無効なパターンと安全でないネストされた繰り返し形式は無視されます。
    - 明示的なメンションを提供するサーフェスは引き続き通過します。設定済み正規表現パターンはフォールバックです。
    - `channels.<channel>.mentionPatterns.mode: "deny"` は、そのチャネルで設定済みメンションパターンをデフォルト無効にします。選択した会話は `allowIn` で再度オプトインします。
    - `channels.<channel>.mentionPatterns.denyIn` は、特定の会話 ID で設定済みメンションパターンを無効にしますが、ネイティブプラットフォームの @メンションは引き続き通過します。
    - エージェントごとの上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に便利です）。
    - メンションゲーティングは、メンション検出が可能な場合（ネイティブメンション、または `mentionPatterns` が設定されている場合）にのみ強制されます。
    - グループまたは送信者を許可リストに入れても、メンションゲーティングは無効になりません。すべてのメッセージでトリガーする必要がある場合は、そのグループの `requireMention` を `false` に設定します。
    - 自動グループチャットプロンプトコンテキストは、解決済みのサイレント返信指示を毎ターン運びます。ワークスペースファイルで `NO_REPLY` の仕組みを重複させるべきではありません。
    - 自動サイレント返信が許可されているグループでは、クリーンな空のモデルターンまたは推論のみのモデルターンを `NO_REPLY` と同等のサイレントとして扱います。ダイレクトチャットでは `NO_REPLY` ガイダンスを受け取ることはなく、メッセージツールのみのグループ返信は `message(action=send)` を呼び出さないことで静かなままになります。
    - 常時オンの周辺グループ会話は、デフォルトでユーザーリクエストのセマンティクスを使用します。代わりに静かなコンテキストとして送信するには、`messages.groupChat.unmentionedInbound: "room_event"` を設定します。設定例については [周辺ルームイベント](/ja-JP/channels/ambient-room-events) を参照してください。
    - ルームイベントは偽のユーザーリクエストとして保存されず、メッセージツールなしのルームイベントからの非公開アシスタントテキストはチャット履歴として再生されません。
    - Discord のデフォルトは `channels.discord.guilds."*"` にあります（ギルド/チャネルごとに上書き可能）。
    - グループ履歴コンテキストはチャネル全体で一様にラップされます。メンションゲートされたグループは、保留中のスキップされたメッセージを保持します。常時オンのグループも、チャネルがサポートしている場合は最近処理されたルームメッセージを保持することがあります。グローバルデフォルトには `messages.groupChat.historyLimit` を、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ/チャネルのツール制限（任意）

一部のチャネル設定では、**特定のグループ/ルーム/チャネル内**で利用できるツールを制限できます。

- `tools`: グループ全体に対してツールを許可/拒否します。
- `toolsBySender`: グループ内で送信者ごとに上書きします。明示的なキープレフィックスを使用します: `channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。チャネル ID は正規の OpenClaw チャネル ID を使用します。`teams` などのエイリアスは `msteams` に正規化されます。レガシーのプレフィックスなしキーも引き続き受け入れられ、`id:` としてのみ一致します。

解決順序（最も具体的なものが優先）:

<Steps>
  <Step title="グループ toolsBySender">
    グループ/チャネルの `toolsBySender` 一致。
  </Step>
  <Step title="グループ tools">
    グループ/チャネルの `tools`。
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
グループ/チャネルのツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます（拒否は引き続き優先されます）。一部のチャネルは、ルーム/チャネルに異なるネストを使用します（例: Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、キーはグループ許可リストとして機能します。デフォルトのメンション動作を設定しながらすべてのグループを許可するには、`"*"` を使用します。

<Warning>
よくある混同: DM ペアリング承認はグループ認可と同じではありません。DM ペアリングをサポートするチャネルでは、ペアリングストアが解除するのは DM のみです。グループコマンドには、`groupAllowFrom` などの設定許可リスト、またはそのチャネルで文書化された設定フォールバックによる明示的なグループ送信者認可が引き続き必要です。
</Warning>

一般的な意図（コピー/ペースト）:

<Tabs>
  <Tab title="Disable all group replies">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Allow only specific groups (WhatsApp)">
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
  <Tab title="Allow all groups but require mention">
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
  <Tab title="Owner-only triggers (WhatsApp)">
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

## 有効化（所有者のみ）

グループ所有者はグループごとの有効化を切り替えられます。

- `/activation mention`
- `/activation always`

所有者は `channels.whatsapp.allowFrom`（未設定の場合はボット自身の E.164）によって決まります。コマンドは単独のメッセージとして送信してください。他のサーフェスは現在 `/activation` を無視します。

## コンテキストフィールド

グループ受信ペイロードは次を設定します。

- `ChatType=group`
- `GroupSubject`（既知の場合）
- `GroupMembers`（既知の場合）
- `WasMentioned`（メンションゲートの結果）
- Telegram フォーラムトピックには `MessageThreadId` と `IsForum` も含まれます。

エージェントシステムプロンプトには、新しいグループセッションの最初のターンでグループ紹介が含まれます。これはモデルに、人間のように応答し、空行を最小限にし、通常のチャット間隔に従い、リテラルの `\n` シーケンスを入力しないよう促します。Telegram 以外のグループでは Markdown テーブルも推奨されません。Telegram のリッチテキストガイダンスは Telegram チャネルプロンプトから来ます。チャネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンスされた信頼できないメタデータとしてレンダリングされます。

## iMessage 固有事項

- ルーティングまたは許可リスト登録では `chat_id:<id>` を優先してください。
- チャット一覧: `imsg chats --limit 20`。
- グループ返信は常に同じ `chat_id` に返されます。

## WhatsApp システムプロンプト

グループおよび直接プロンプトの解決、ワイルドカード動作、アカウントオーバーライドのセマンティクスを含む、正準の WhatsApp システムプロンプトルールについては [WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp 固有事項

WhatsApp 専用の動作（履歴注入、メンション処理の詳細）については [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
