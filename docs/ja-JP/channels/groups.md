---
read_when:
    - グループチャットの挙動またはメンション制御を変更する
sidebarTitle: Groups
summary: 各サーフェスでのグループチャットの挙動 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: グループ
x-i18n:
    generated_at: "2026-05-01T05:00:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8580f98ab03c89770688102da776627d8ce18b7bd34c4a687009fd4aabb6213
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo の各サーフェスでグループチャットを一貫して扱います。

## 初心者向けイントロ（2 分）

OpenClaw は自分のメッセージングアカウント上に「存在」します。別の WhatsApp bot ユーザーはありません。**あなた**がグループにいる場合、OpenClaw はそのグループを認識し、そこで応答できます。

デフォルトの動作:

- グループは制限されています（`groupPolicy: "allowlist"`）。
- メンションゲートを明示的に無効にしない限り、返信にはメンションが必要です。
- グループ/チャンネル内の通常の最終返信は、デフォルトで非公開です。ルームに表示される出力には `message` ツールを使います。

つまり、許可リストに登録された送信者は、OpenClaw にメンションすることで OpenClaw をトリガーできます。

<Note>
**要約**

- **DM アクセス**は `*.allowFrom` で制御されます。
- **グループアクセス**は `*.groupPolicy` + 許可リスト（`*.groups`、`*.groupAllowFrom`）で制御されます。
- **返信のトリガー**はメンションゲート（`requireMention`、`/activation`）で制御されます。

</Note>

クイックフロー（グループメッセージに何が起きるか）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 表示返信

グループ/チャンネルルームでは、OpenClaw のデフォルトは `messages.groupChat.visibleReplies: "message_tool"` です。
これは、エージェントがターンを処理し、メモリ/セッション状態を更新できる一方で、通常の最終回答は自動的にはルームに投稿されないことを意味します。表示される形で発言するには、エージェントは `message(action=send)` を使います。

アクティブなツールポリシーの下でメッセージツールを利用できない場合、OpenClaw は応答を黙って抑制するのではなく、自動の表示返信にフォールバックします。
`openclaw doctor` はこの不一致について警告します。

ダイレクトチャットやその他のソースターンに対して同じツールのみの表示返信動作をグローバルに適用するには、`messages.visibleReplies: "message_tool"` を使います。`messages.groupChat.visibleReplies` は、グループ/チャンネルルーム向けのより具体的なオーバーライドとして残ります。

これは、ほとんどの待機モードのターンでモデルに `NO_REPLY` と回答させる古いパターンを置き換えます。ツールのみモードでは、表示されることを何もしないとは、単にメッセージツールを呼び出さないことを意味します。

エージェントがツールのみモードで作業している間も、入力中インジケーターは送信されます。これらのターンでは、エージェントがメッセージツールを呼び出すかどうかを決める前に通常のアシスタントメッセージ本文が存在しない場合があるため、デフォルトのグループ入力モードは "message" から "instant" にアップグレードされます。明示的な入力モード設定は引き続き優先されます。

グループ/チャンネルルームで従来の自動最終返信を復元するには:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway は、ファイル保存後に `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効になっている場合にのみ再起動してください。

すべてのソースチャットで、表示出力をメッセージツール経由にする必要がある場合:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンド対応のその他のサーフェス）は `visibleReplies: "message_tool"` をバイパスし、チャンネルネイティブのコマンド UI が期待する応答を受け取れるように常に表示返信します。これは検証済みのネイティブコマンドターンにのみ適用されます。テキスト入力された `/...` コマンドと通常のチャットターンは、引き続き設定済みのグループデフォルトに従います。

## コンテキストの可視性と許可リスト

グループの安全性には、2 つの異なる制御が関わります。

- **トリガー認可**: エージェントをトリガーできる人（`groupPolicy`、`groups`、`groupAllowFrom`、チャンネル固有の許可リスト）。
- **コンテキストの可視性**: モデルに注入される補足コンテキスト（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は通常のチャット動作を優先し、コンテキストをほぼ受信したまま保持します。つまり、許可リストは主に、すべての引用や履歴スニペットに対する普遍的な墨消し境界ではなく、誰がアクションをトリガーできるかを決定します。

<AccordionGroup>
  <Accordion title="現在の動作はチャンネル固有です">
    - 一部のチャンネルでは、特定のパスで補足コンテキストに対して送信者ベースのフィルタリングをすでに適用しています（たとえば Slack のスレッドシード、Matrix の返信/スレッド検索）。
    - 他のチャンネルでは、引用/返信/転送コンテキストを受信したまま渡しています。

  </Accordion>
  <Accordion title="強化の方向性（予定）">
    - `contextVisibility: "all"`（デフォルト）は、現在の受信時のままの動作を維持します。
    - `contextVisibility: "allowlist"` は、補足コンテキストを許可リスト内の送信者にフィルタリングします。
    - `contextVisibility: "allowlist_quote"` は `allowlist` に加えて、明示的な引用/返信の例外を 1 つ許可します。

    この強化モデルがチャンネル全体で一貫して実装されるまでは、サーフェスごとの差異があることを想定してください。

  </Accordion>
</AccordionGroup>

![グループメッセージフロー](/images/groups-flow.svg)

目的別の設定:

| 目的                                         | 設定する内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可し、@メンション時のみ返信する | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効にする                    | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                              | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）         |
| グループであなただけがトリガーできる                  | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使います（ルーム/チャンネルは `agent:<agentId>:<channel>:channel:<id>` を使います）。
- Telegram フォーラムトピックは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` を追加します。
- ダイレクトチャットはメインセッション（または設定されている場合は送信者ごと）を使います。
- Heartbeat はグループセッションではスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人 DM + 公開グループ（単一エージェント）

はい。「個人」トラフィックが **DM** で、「公開」トラフィックが **グループ** であれば、これはうまく機能します。

理由: 単一エージェントモードでは、DM は通常 **メイン** セッションキー（`agent:main:main`）に入り、グループは常に **非メイン** セッションキー（`agent:main:<channel>:group:<id>`）を使います。`mode: "non-main"` でサンドボックス化を有効にすると、それらのグループセッションは設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトのバックエンドです。

これにより、1 つのエージェントの「頭脳」（共有ワークスペース + メモリ）を持ちながら、2 つの実行姿勢を取れます。

- **DM**: フルツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

<Note>
本当に分離されたワークスペース/ペルソナ（「個人」と「公開」が決して混ざらない必要がある）を必要とする場合は、2 つ目のエージェント + バインディングを使います。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。
</Note>

<Tabs>
  <Tab title="ホスト上の DM、サンドボックス化されたグループ">
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
  <Tab title="グループには許可リストに登録されたフォルダーのみが見える">
    「ホストアクセスなし」ではなく「グループはフォルダー X だけ見える」ようにしたい場合は、`workspaceAccess: "none"` のままにして、許可リストに登録したパスだけをサンドボックスにマウントします。

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

- UI ラベルは、利用可能な場合は `displayName` を使い、`<channel>:<token>` としてフォーマットされます。
- `#room` はルーム/チャンネル用に予約されています。グループチャットは `g-<slug>` を使います（小文字、スペース -> `-`、`#@+._-` は保持）。

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
  <Accordion title="チャンネルごとの注意事項">
    - `groupPolicy` は、メンションゲート（@メンションを必要とするもの）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使います（フォールバック: 明示的な `allowFrom`）。
    - Signal: `groupAllowFrom` は、受信した Signal グループ ID または送信者の電話番号/UUID のどちらにも一致できます。
    - DM ペアリング承認（`*-allowFrom` ストアエントリ）は DM アクセスにのみ適用されます。グループ送信者の認可は、グループ許可リストに対して明示的なままです。
    - Discord: 許可リストは `channels.discord.guilds.<id>.channels` を使います。
    - Slack: 許可リストは `channels.slack.channels` を使います。
    - Matrix: 許可リストは `channels.matrix.groups` を使います。ルーム ID またはエイリアスを推奨します。参加済みルーム名の検索はベストエフォートであり、解決できない名前は実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使います。ルームごとの `users` 許可リストもサポートされています。
    - グループ DM は別途制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram の許可リストは、ユーザー ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字と小文字を区別しません。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
    - 実行時の安全性: provider ブロックが完全に存在しない場合（`channels.<provider>` がない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承するのではなく、フェイルクローズモード（通常は `allowlist`）にフォールバックします。

  </Accordion>
</AccordionGroup>

簡単なメンタルモデル（グループメッセージの評価順）:

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist)。
  </Step>
  <Step title="グループ許可リスト">
    グループ許可リスト (`*.groups`、`*.groupAllowFrom`、チャンネル固有の許可リスト)。
  </Step>
  <Step title="メンションゲーティング">
    メンションゲーティング (`requireMention`、`/activation`)。
  </Step>
</Steps>

## メンションゲーティング (デフォルト)

グループメッセージは、グループごとに上書きされていない限りメンションが必要です。デフォルトは各サブシステムの `*.groups."*"` の下にあります。

ボットメッセージへの返信は、チャンネルが返信メタデータをサポートしている場合、暗黙的なメンションとして扱われます。ボットメッセージの引用も、引用メタデータを公開するチャンネルでは暗黙的なメンションとして扱われる場合があります。現在の組み込みケースには Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUser が含まれます。

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
  <Accordion title="メンションゲーティングのメモ">
    - `mentionPatterns` は大文字小文字を区別しない安全な正規表現パターンです。不正なパターンや安全でない入れ子の繰り返し形式は無視されます。
    - 明示的なメンションを提供するサーフェスは引き続き通過します。パターンはフォールバックです。
    - エージェントごとの上書き: `agents.list[].groupChat.mentionPatterns` (複数のエージェントがグループを共有する場合に便利です)。
    - メンションゲーティングは、メンション検出が可能な場合 (ネイティブメンション、または `mentionPatterns` が設定されている場合) にのみ適用されます。
    - グループまたは送信者を許可リストに追加しても、メンションゲーティングは無効になりません。すべてのメッセージでトリガーする必要がある場合は、そのグループの `requireMention` を `false` に設定してください。
    - グループチャットのプロンプトコンテキストは、各ターンで解決済みのサイレント返信指示を持ちます。ワークスペースファイルで `NO_REPLY` の仕組みを重複させないでください。
    - サイレント返信が許可されているグループでは、クリーンな空のモデルターンまたは推論のみのモデルターンは、`NO_REPLY` と同等のサイレントとして扱われます。ダイレクトチャットでも、ダイレクトのサイレント返信が明示的に許可されている場合にのみ同じ扱いになります。それ以外の場合、空の返信は失敗したエージェントターンのままです。
    - Discord のデフォルトは `channels.discord.guilds."*"` にあります (ギルド/チャンネルごとに上書き可能)。
    - グループ履歴コンテキストはチャンネル全体で一律にラップされ、**保留中のみ** です (メンションゲーティングによりスキップされたメッセージ)。グローバルデフォルトには `messages.groupChat.historyLimit` を使用し、上書きには `channels.<channel>.historyLimit` (または `channels.<channel>.accounts.*.historyLimit`) を使用します。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ/チャンネルのツール制限 (任意)

一部のチャンネル設定では、**特定のグループ/ルーム/チャンネル内** で利用できるツールを制限できます。

- `tools`: グループ全体のツールを許可/拒否します。
- `toolsBySender`: グループ内の送信者ごとの上書きです。明示的なキープレフィックスを使用します: `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。従来のプレフィックスなしキーも引き続き受け付けられ、`id:` としてのみ照合されます。

解決順序 (最も具体的なものが優先):

<Steps>
  <Step title="グループ toolsBySender">
    グループ/チャンネルの `toolsBySender` 照合。
  </Step>
  <Step title="グループ tools">
    グループ/チャンネルの `tools`。
  </Step>
  <Step title="デフォルト toolsBySender">
    デフォルト (`"*"`) の `toolsBySender` 照合。
  </Step>
  <Step title="デフォルト tools">
    デフォルト (`"*"`) の `tools`。
  </Step>
</Steps>

例 (Telegram):

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
グループ/チャンネルのツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます (拒否は引き続き優先されます)。一部のチャンネルでは、ルーム/チャンネルに異なるネストを使用します (例: Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`)。
</Note>

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、キーはグループ許可リストとして機能します。デフォルトのメンション動作を設定しながらすべてのグループを許可するには、`"*"` を使用します。

<Warning>
よくある混同: DM ペアリング承認はグループ認可と同じではありません。DM ペアリングをサポートするチャンネルでは、ペアリングストアが解除するのは DM のみです。グループコマンドには、`groupAllowFrom` やそのチャンネルで文書化された設定フォールバックなど、設定許可リストによる明示的なグループ送信者認可が引き続き必要です。
</Warning>

一般的な目的 (コピー/貼り付け):

<Tabs>
  <Tab title="すべてのグループ返信を無効にする">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="特定のグループのみ許可する (WhatsApp)">
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
  <Tab title="オーナーのみのトリガー (WhatsApp)">
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

## 有効化 (オーナーのみ)

グループオーナーは、グループごとの有効化を切り替えられます。

- `/activation mention`
- `/activation always`

オーナーは `channels.whatsapp.allowFrom` (未設定の場合はボット自身の E.164) によって決定されます。コマンドは単独のメッセージとして送信してください。現在、他のサーフェスは `/activation` を無視します。

## コンテキストフィールド

グループの受信ペイロードは次を設定します。

- `ChatType=group`
- `GroupSubject` (既知の場合)
- `GroupMembers` (既知の場合)
- `WasMentioned` (メンションゲーティングの結果)
- Telegram フォーラムトピックには `MessageThreadId` と `IsForum` も含まれます。

チャンネル固有のメモ:

- BlueBubbles は、`GroupMembers` に入力する前に、名前のない macOS グループ参加者をローカルの連絡先データベースから任意で補強できます。これはデフォルトではオフで、通常のグループゲーティングが通過した後にのみ実行されます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターンでグループのイントロが含まれます。これはモデルに、人間のように応答し、Markdown テーブルを避け、空行を最小限にして通常のチャットの間隔に従い、リテラルの `\n` シーケンスを入力しないよう促します。チャンネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンス付きの信頼されていないメタデータとしてレンダリングされます。

## iMessage の詳細

- ルーティングまたは許可リスト追加では `chat_id:<id>` を優先してください。
- チャット一覧: `imsg chats --limit 20`。
- グループ返信は常に同じ `chat_id` に戻ります。

## WhatsApp システムプロンプト

グループおよびダイレクトプロンプトの解決、ワイルドカード動作、アカウント上書きセマンティクスを含む、正規の WhatsApp システムプロンプトルールについては [WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp の詳細

WhatsApp のみの動作 (履歴注入、メンション処理の詳細) については [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
