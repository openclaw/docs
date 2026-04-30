---
read_when:
    - グループチャットの動作またはメンションによるゲート制御の変更
sidebarTitle: Groups
summary: 各サーフェスにおけるグループチャットの動作 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: グループ
x-i18n:
    generated_at: "2026-04-30T04:58:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo の各サーフェスでグループチャットを一貫して扱います。

## 初心者向けイントロ（2 分）

OpenClaw は自分のメッセージングアカウント上に「存在」します。別の WhatsApp ボットユーザーはありません。**あなた**がグループにいる場合、OpenClaw はそのグループを確認し、そこで応答できます。

デフォルトの動作:

- グループは制限されます（`groupPolicy: "allowlist"`）。
- 明示的にメンションゲートを無効にしない限り、返信にはメンションが必要です。
- グループ/チャンネル内の通常の最終返信は、デフォルトで非公開です。表示されるルーム出力には `message` ツールを使用します。

言い換えると、許可リストに登録された送信者は、OpenClaw をメンションすることで起動できます。

<Note>
**要約**

- **ダイレクトメッセージアクセス**は `*.allowFrom` で制御します。
- **グループアクセス**は `*.groupPolicy` + 許可リスト（`*.groups`、`*.groupAllowFrom`）で制御します。
- **返信のトリガー**はメンションゲート（`requireMention`、`/activation`）で制御します。

</Note>

簡単な流れ（グループメッセージに起きること）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 表示される返信

グループ/チャンネルのルームでは、OpenClaw はデフォルトで `messages.groupChat.visibleReplies: "message_tool"` を使用します。
つまり、エージェントはターンを処理し、メモリ/セッション状態を更新できますが、通常の最終回答はルームに自動投稿されません。表示される形で発言するには、エージェントは `message(action=send)` を使用します。

ダイレクトチャットやその他のソースターンでは、`messages.visibleReplies: "message_tool"` を使用して、同じツール専用の表示返信動作をグローバルに適用します。`messages.groupChat.visibleReplies` は、グループ/チャンネルのルーム向けの、より具体的な上書きとして残ります。

これは、ほとんどの潜伏モードのターンでモデルに `NO_REPLY` と答えさせる古いパターンを置き換えます。ツール専用モードでは、表示上何もしないことは、単にメッセージツールを呼び出さないことを意味します。

エージェントがツール専用モードで作業している間も、入力中インジケーターは送信されます。これらのターンでは、エージェントがメッセージツールを呼び出すかどうかを決める前に通常のアシスタントメッセージテキストが存在しない場合があるため、デフォルトのグループ入力中モードは "message" から "instant" に引き上げられます。明示的な入力中モード設定は引き続き優先されます。

グループ/チャンネルのルームで従来の自動最終返信を復元するには:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

すべてのソースチャットで表示出力にメッセージツールの使用を必須にするには:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンド対応のその他のサーフェス）は `visibleReplies: "message_tool"` をバイパスし、チャンネルネイティブのコマンド UI が期待する応答を受け取れるよう、常に表示される形で返信します。これは検証済みのネイティブコマンドターンにのみ適用されます。テキスト入力された `/...` コマンドや通常のチャットターンは、引き続き設定済みのグループデフォルトに従います。

## コンテキストの可視性と許可リスト

グループの安全性には、2 つの異なる制御が関わります。

- **トリガー承認**: エージェントをトリガーできる人（`groupPolicy`、`groups`、`groupAllowFrom`、チャンネル固有の許可リスト）。
- **コンテキストの可視性**: モデルに注入される補助コンテキスト（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は通常のチャット動作を優先し、コンテキストをほぼ受信時のまま維持します。つまり許可リストは主に、誰がアクションをトリガーできるかを決めるものであり、すべての引用や履歴スニペットに対する普遍的な秘匿境界ではありません。

<AccordionGroup>
  <Accordion title="現在の動作はチャンネル固有です">
    - 一部のチャンネルでは、特定の経路ですでに補助コンテキストに送信者ベースのフィルタリングを適用しています（例: Slack スレッドのシード、Matrix の返信/スレッド検索）。
    - その他のチャンネルでは、引用/返信/転送コンテキストを受信時のまま渡します。

  </Accordion>
  <Accordion title="強化の方向性（計画中）">
    - `contextVisibility: "all"`（デフォルト）は、現在の受信時のままの動作を維持します。
    - `contextVisibility: "allowlist"` は、補助コンテキストを許可リストに登録された送信者に絞り込みます。
    - `contextVisibility: "allowlist_quote"` は `allowlist` に加えて、明示的な引用/返信の例外を 1 つ許可します。

    この強化モデルがチャンネル全体で一貫して実装されるまでは、サーフェスごとの差異を想定してください。

  </Accordion>
</AccordionGroup>

![グループメッセージの流れ](/images/groups-flow.svg)

目的別の設定...

| 目標                                         | 設定する内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可するが @mentions にのみ返信する | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効にする                    | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                               | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）         |
| グループ内で自分だけがトリガーできる                  | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使用します（ルーム/チャンネルは `agent:<agentId>:<channel>:channel:<id>` を使用します）。
- Telegram フォーラムトピックでは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` を追加します。
- ダイレクトチャットはメインセッションを使用します（設定されている場合は送信者ごと）。
- グループセッションでは Heartbeat はスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人ダイレクトメッセージ + 公開グループ（単一エージェント）

はい。「個人」トラフィックが**ダイレクトメッセージ**で、「公開」トラフィックが**グループ**であれば、これはうまく機能します。

理由: 単一エージェントモードでは、ダイレクトメッセージは通常 **メイン**セッションキー（`agent:main:main`）に入りますが、グループは常に**非メイン**セッションキー（`agent:main:<channel>:group:<id>`）を使用します。`mode: "non-main"` でサンドボックス化を有効にすると、それらのグループセッションは設定済みのサンドボックスバックエンドで実行され、メインのダイレクトメッセージセッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。

これにより、1 つのエージェントの「頭脳」（共有ワークスペース + メモリ）を持ちながら、2 つの実行姿勢を使えます。

- **ダイレクトメッセージ**: フルツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

<Note>
本当に分離されたワークスペース/ペルソナが必要な場合（「個人」と「公開」を絶対に混在させてはならない場合）は、2 つ目のエージェント + バインディングを使用してください。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。
</Note>

<Tabs>
  <Tab title="ダイレクトメッセージはホスト上、グループはサンドボックス化">
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
  <Tab title="グループには許可リストに登録されたフォルダーのみを見せる">
    「ホストアクセスなし」ではなく「グループはフォルダー X だけを見られる」ようにしたい場合は、`workspaceAccess: "none"` を維持し、許可リストに登録されたパスだけをサンドボックスにマウントします。

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

- UI ラベルは、利用可能な場合は `displayName` を使用し、`<channel>:<token>` として整形します。
- `#room` はルーム/チャンネル用に予約されています。グループチャットは `g-<slug>` を使用します（小文字、スペース -> `-`、`#@+._-` は保持）。

## グループポリシー

チャンネルごとにグループ/ルームメッセージの処理方法を制御します。

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
| `"open"`      | グループは許可リストをバイパスします。メンションゲートは引き続き適用されます。      |
| `"disabled"`  | すべてのグループメッセージを完全にブロックします。                           |
| `"allowlist"` | 設定済みの許可リストに一致するグループ/ルームのみを許可します。 |

<AccordionGroup>
  <Accordion title="チャンネルごとのメモ">
    - `groupPolicy` はメンションゲート（@mentions を要求するもの）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使用します（フォールバック: 明示的な `allowFrom`）。
    - ダイレクトメッセージのペアリング承認（`*-allowFrom` ストアエントリ）は、ダイレクトメッセージアクセスにのみ適用されます。グループ送信者の承認は、グループ許可リストに対して明示的に行われます。
    - Discord: 許可リストは `channels.discord.guilds.<id>.channels` を使用します。
    - Slack: 許可リストは `channels.slack.channels` を使用します。
    - Matrix: 許可リストは `channels.matrix.groups` を使用します。ルーム ID またはエイリアスを推奨します。参加済みルーム名の検索はベストエフォートであり、解決できない名前は実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用します。ルームごとの `users` 許可リストもサポートされています。
    - グループダイレクトメッセージは別に制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram 許可リストは、ユーザー ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字小文字を区別しません。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
    - 実行時の安全性: プロバイダーブロックが完全に存在しない場合（`channels.<provider>` がない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承するのではなく、フェイルクローズモード（通常は `allowlist`）にフォールバックします。

  </Accordion>
</AccordionGroup>

簡単なメンタルモデル（グループメッセージの評価順序）:

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="グループ許可リスト">
    グループ許可リスト（`*.groups`、`*.groupAllowFrom`、チャンネル固有の許可リスト）。
  </Step>
  <Step title="メンションゲート">
    メンションゲート（`requireMention`、`/activation`）。
  </Step>
</Steps>

## メンションゲート（デフォルト）

グループメッセージには、グループごとに上書きしない限りメンションが必要です。デフォルトはサブシステムごとに `*.groups."*"` 配下にあります。

ボットメッセージへの返信は、そのチャンネルが返信メタデータに対応している場合、暗黙のメンションとして扱われます。ボットメッセージの引用も、引用メタデータを公開するチャンネルでは暗黙のメンションとして扱われる場合があります。現在の組み込み対象には Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUser が含まれます。

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

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` は大文字と小文字を区別しない安全な正規表現パターンです。無効なパターンや安全でないネストした繰り返し形式は無視されます。
    - 明示的なメンションを提供するサーフェスは引き続き通過します。パターンはフォールバックです。
    - エージェントごとの上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に便利です）。
    - メンションゲーティングは、メンション検出が可能な場合（ネイティブメンションまたは `mentionPatterns` が設定されている場合）にのみ適用されます。
    - グループチャットのプロンプトコンテキストは、解決済みのサイレント返信指示を毎ターン保持します。ワークスペースファイルで `NO_REPLY` の仕組みを重複させるべきではありません。
    - サイレント返信が許可されているグループでは、空のままのターンや推論のみのモデルターンは `NO_REPLY` と同等のサイレントとして扱われます。ダイレクトチャットでは、ダイレクトでのサイレント返信が明示的に許可されている場合にのみ同じ扱いになります。それ以外では、空の返信は失敗したエージェントターンのままです。
    - Discord のデフォルトは `channels.discord.guilds."*"` にあります（ギルド/チャンネルごとに上書き可能）。
    - グループ履歴コンテキストはチャンネル全体で一貫してラップされ、**保留中のみ**（メンションゲーティングによりスキップされたメッセージ）です。グローバルデフォルトには `messages.groupChat.historyLimit` を使用し、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ/チャンネルのツール制限（任意）

一部のチャンネル設定では、**特定のグループ/ルーム/チャンネル内**で利用可能なツールを制限できます。

- `tools`: グループ全体のツールを許可/拒否します。
- `toolsBySender`: グループ内の送信者ごとの上書きです。明示的なキープレフィックスを使用します: `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。従来のプレフィックスなしキーも引き続き受け付けられ、`id:` としてのみ照合されます。

解決順序（最も具体的なものが優先）:

<Steps>
  <Step title="Group toolsBySender">
    グループ/チャンネルの `toolsBySender` 照合。
  </Step>
  <Step title="Group tools">
    グループ/チャンネルの `tools`。
  </Step>
  <Step title="Default toolsBySender">
    デフォルト（`"*"`）の `toolsBySender` 照合。
  </Step>
  <Step title="Default tools">
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
グループ/チャンネルのツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます（拒否が引き続き優先されます）。一部のチャンネルでは、ルーム/チャンネルに異なるネストを使用します（例: Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、そのキーはグループ許可リストとして機能します。すべてのグループを許可しつつデフォルトのメンション動作を設定するには `"*"` を使用します。

<Warning>
よくある混同: DM ペアリング承認はグループ認可と同じではありません。DM ペアリングをサポートするチャンネルでは、ペアリングストアが解除するのは DM のみです。グループコマンドには、`groupAllowFrom` やそのチャンネルのドキュメント化された設定フォールバックなど、設定許可リストによる明示的なグループ送信者認可が引き続き必要です。
</Warning>

一般的な意図（コピー/貼り付け）:

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

グループ所有者はグループごとの有効化を切り替えられます:

- `/activation mention`
- `/activation always`

所有者は `channels.whatsapp.allowFrom`（未設定の場合はボット自身の E.164）によって決定されます。コマンドを単独のメッセージとして送信します。他のサーフェスは現在 `/activation` を無視します。

## コンテキストフィールド

グループ受信ペイロードは次を設定します:

- `ChatType=group`
- `GroupSubject`（既知の場合）
- `GroupMembers`（既知の場合）
- `WasMentioned`（メンションゲーティング結果）
- Telegram フォーラムトピックには `MessageThreadId` と `IsForum` も含まれます。

チャンネル固有の注記:

- BlueBubbles は、`GroupMembers` を入力する前に、名前のない macOS グループ参加者をローカルの連絡先データベースから任意で補強できます。これはデフォルトではオフで、通常のグループゲーティングに通過した後にのみ実行されます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターンでグループ紹介が含まれます。これは、モデルに対して人間のように応答すること、Markdown テーブルを避けること、空行を最小限にして通常のチャット間隔に従うこと、リテラルの `\n` シーケンスを入力しないことを促します。チャンネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンス付きの信頼されないメタデータとしてレンダリングされます。

## iMessage 固有事項

- ルーティングまたは許可リスト登録では `chat_id:<id>` を推奨します。
- チャット一覧: `imsg chats --limit 20`。
- グループ返信は常に同じ `chat_id` に戻ります。

## WhatsApp システムプロンプト

グループとダイレクトのプロンプト解決、ワイルドカード動作、アカウント上書きセマンティクスを含む、正式な WhatsApp システムプロンプト規則については [WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp 固有事項

WhatsApp のみの動作（履歴注入、メンション処理の詳細）については [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
