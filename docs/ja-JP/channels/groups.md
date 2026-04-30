---
read_when:
    - グループチャットの動作またはメンションゲーティングの変更
sidebarTitle: Groups
summary: 各サーフェスにおけるグループチャットの動作 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: グループ
x-i18n:
    generated_at: "2026-04-30T16:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo の各サーフェスでグループチャットを一貫して扱います。

## 初心者向け概要（2 分）

OpenClaw は自分のメッセージングアカウント上に「存在」します。別個の WhatsApp ボットユーザーはありません。**あなた** がグループにいる場合、OpenClaw はそのグループを認識し、そこで応答できます。

デフォルトの動作:

- グループは制限されます（`groupPolicy: "allowlist"`）。
- 明示的にメンションゲートを無効化しない限り、返信にはメンションが必要です。
- グループ/チャンネルでの通常の最終返信は、デフォルトでは非公開です。ルームに表示される出力には `message` ツールを使用します。

つまり、許可リストに含まれる送信者は、OpenClaw にメンションすることで OpenClaw をトリガーできます。

<Note>
**要約**

- **DM アクセス** は `*.allowFrom` で制御されます。
- **グループアクセス** は `*.groupPolicy` + 許可リスト（`*.groups`、`*.groupAllowFrom`）で制御されます。
- **返信のトリガー** はメンションゲート（`requireMention`、`/activation`）で制御されます。

</Note>

クイックフロー（グループメッセージに何が起きるか）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 表示される返信

グループ/チャンネルルームでは、OpenClaw のデフォルトは `messages.groupChat.visibleReplies: "message_tool"` です。
つまり、エージェントはそのターンを引き続き処理し、メモリ/セッション状態を更新できますが、通常の最終回答はルームに自動投稿されません。表示される形で発言するには、エージェントは `message(action=send)` を使用します。

直接チャットやその他のソースターンで同じツール専用の表示返信動作をグローバルに適用するには、`messages.visibleReplies: "message_tool"` を使用します。`messages.groupChat.visibleReplies` は、グループ/チャンネルルーム向けのより具体的なオーバーライドのままです。

これは、ほとんどの潜伏モードのターンでモデルに `NO_REPLY` と答えさせる古いパターンを置き換えます。ツール専用モードでは、表示上何もしないとは、単に message ツールを呼び出さないことを意味します。

ツール専用モードでエージェントが作業している間も、入力中インジケーターは送信されます。これらのターンでは、エージェントが message ツールを呼び出すかどうかを決める前に通常のアシスタントメッセージテキストが存在しない可能性があるため、デフォルトのグループ入力中モードは "message" から "instant" にアップグレードされます。明示的な入力中モード設定がある場合は、引き続きそちらが優先されます。

グループ/チャンネルルームで従来の自動最終返信に戻すには:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

ファイルが保存されると、Gateway は `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効になっている場合のみ再起動してください。

すべてのソースチャットで、表示される出力を message ツール経由にするには:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンド対応のその他のサーフェス）は `visibleReplies: "message_tool"` をバイパスし、チャンネルネイティブのコマンド UI が期待する応答を得られるように、常に表示される形で返信します。これは検証済みのネイティブコマンドターンにのみ適用されます。テキストとして入力された `/...` コマンドや通常のチャットターンは、引き続き設定済みのグループデフォルトに従います。

## コンテキストの可視性と許可リスト

グループの安全性には 2 つの異なる制御が関係します。

- **トリガー承認**: 誰がエージェントをトリガーできるか（`groupPolicy`、`groups`、`groupAllowFrom`、チャンネル固有の許可リスト）。
- **コンテキストの可視性**: どの補足コンテキストをモデルに注入するか（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は通常のチャット動作を優先し、受信したコンテキストをほぼそのまま保持します。つまり、許可リストは主に誰がアクションをトリガーできるかを決めるものであり、引用や履歴スニペットすべてに対する普遍的な編集境界ではありません。

<AccordionGroup>
  <Accordion title="現在の動作はチャンネル固有です">
    - 一部のチャンネルでは、特定の経路で補足コンテキストに対して送信者ベースのフィルタリングをすでに適用しています（例: Slack スレッドのシード、Matrix の返信/スレッド検索）。
    - 他のチャンネルでは、引用/返信/転送コンテキストを受信したまま渡します。

  </Accordion>
  <Accordion title="強化の方向性（計画中）">
    - `contextVisibility: "all"`（デフォルト）は、現在の受信どおりの動作を維持します。
    - `contextVisibility: "allowlist"` は、補足コンテキストを許可リスト内の送信者にフィルタリングします。
    - `contextVisibility: "allowlist_quote"` は `allowlist` に、明示的な引用/返信の例外を 1 つ加えたものです。

    この強化モデルがチャンネル全体で一貫して実装されるまでは、サーフェスごとの差異があるものとして扱ってください。

  </Accordion>
</AccordionGroup>

![グループメッセージフロー](/images/groups-flow.svg)

やりたいこと...

| 目的                                         | 設定する内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可するが @メンション時のみ返信する | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効化する                    | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                              | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）         |
| グループで自分だけがトリガーできる                  | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使用します（ルーム/チャンネルは `agent:<agentId>:<channel>:channel:<id>` を使用します）。
- Telegram のフォーラムトピックでは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` を追加します。
- 直接チャットはメインセッションを使用します（設定されている場合は送信者ごとのセッション）。
- Heartbeat はグループセッションではスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人 DM + 公開グループ（単一エージェント）

はい。「個人」トラフィックが **DM** で、「公開」トラフィックが **グループ** なら、この構成はうまく機能します。

理由: 単一エージェントモードでは、DM は通常 **メイン** セッションキー（`agent:main:main`）に入り、グループは常に **非メイン** セッションキー（`agent:main:<channel>:group:<id>`）を使用します。`mode: "non-main"` でサンドボックス化を有効にすると、それらのグループセッションは設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。

これにより、1 つのエージェント「頭脳」（共有ワークスペース + メモリ）で、2 つの実行姿勢を持てます。

- **DM**: 完全なツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

<Note>
本当に分離されたワークスペース/ペルソナ（「個人」と「公開」が絶対に混ざってはいけない）が必要な場合は、2 つ目のエージェント + バインディングを使用してください。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。
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
  <Tab title="グループには許可リスト内のフォルダーだけを見せる">
    「ホストアクセスなし」ではなく「グループはフォルダー X だけを見られる」ようにしたい場合は、`workspaceAccess: "none"` を維持し、許可リストに含めたパスだけをサンドボックスにマウントします。

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
- `#room` はルーム/チャンネル用に予約されています。グループチャットは `g-<slug>` を使用します（小文字、スペース -> `-`、`#@+._-` を保持）。

## グループポリシー

チャンネルごとに、グループ/ルームメッセージの処理方法を制御します。

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
    - `groupPolicy` はメンションゲート（@メンションを要求するもの）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使用します（フォールバック: 明示的な `allowFrom`）。
    - Signal: `groupAllowFrom` は、受信 Signal グループ ID または送信者の電話番号/UUID のどちらにも一致できます。
    - DM ペアリング承認（`*-allowFrom` ストアエントリ）は DM アクセスにのみ適用されます。グループ送信者の承認は、グループ許可リストで明示的に行われます。
    - Discord: 許可リストは `channels.discord.guilds.<id>.channels` を使用します。
    - Slack: 許可リストは `channels.slack.channels` を使用します。
    - Matrix: 許可リストは `channels.matrix.groups` を使用します。ルーム ID またはエイリアスを推奨します。参加済みルーム名の検索はベストエフォートで、解決できない名前はランタイムで無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用します。ルームごとの `users` 許可リストもサポートされています。
    - グループ DM は別に制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram の許可リストは、ユーザー ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字小文字を区別しません。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
    - ランタイム安全性: プロバイダーブロックが完全に存在しない場合（`channels.<provider>` がない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承するのではなく、フェイルクローズモード（通常は `allowlist`）にフォールバックします。

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

グループメッセージは、グループごとに上書きされない限りメンションを必要とします。デフォルトは各サブシステムの `*.groups."*"` 配下にあります。

ボットメッセージへの返信は、チャンネルが返信メタデータに対応している場合、暗黙的なメンションとして扱われます。ボットメッセージの引用も、引用メタデータを公開するチャンネルでは暗黙的なメンションとして扱われる場合があります。現在の組み込みケースには、Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUser が含まれます。

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
    - `mentionPatterns` は大文字小文字を区別しない安全な正規表現パターンです。無効なパターンと安全でないネストした反復形式は無視されます。
    - 明示的なメンションを提供するサーフェスは引き続き通過します。パターンはフォールバックです。
    - エージェントごとのオーバーライド: `agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に便利です）。
    - メンションゲーティングは、メンション検出が可能な場合（ネイティブメンションまたは `mentionPatterns` が設定されている場合）にのみ適用されます。
    - グループまたは送信者を許可リストに入れても、メンションゲーティングは無効になりません。すべてのメッセージでトリガーする必要がある場合は、そのグループの `requireMention` を `false` に設定します。
    - グループチャットのプロンプトコンテキストは、解決済みのサイレント返信指示を毎ターン保持します。ワークスペースファイルで `NO_REPLY` の仕組みを重複させるべきではありません。
    - サイレント返信が許可されているグループでは、クリーンな空のモデルターンまたは推論のみのモデルターンは、`NO_REPLY` と同等のサイレントとして扱われます。ダイレクトチャットでは、ダイレクトのサイレント返信が明示的に許可されている場合のみ同じ扱いになります。それ以外の場合、空の返信は失敗したエージェントターンのままです。
    - Discord のデフォルトは `channels.discord.guilds."*"` にあります（ギルド/チャンネルごとにオーバーライド可能）。
    - グループ履歴コンテキストはチャンネルをまたいで一貫してラップされ、**保留中のみ**です（メンションゲーティングによってスキップされたメッセージ）。グローバルデフォルトには `messages.groupChat.historyLimit` を使用し、オーバーライドには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ/チャンネルのツール制限（任意）

一部のチャンネル設定では、**特定のグループ/ルーム/チャンネル内**で利用できるツールを制限できます。

- `tools`: グループ全体でツールを許可/拒否します。
- `toolsBySender`: グループ内の送信者ごとのオーバーライドです。明示的なキープレフィックスを使用します: `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。従来のプレフィックスなしキーも引き続き受け付けられ、`id:` としてのみ照合されます。

解決順序（最も具体的なものが優先されます）:

<Steps>
  <Step title="グループ toolsBySender">
    グループ/チャンネルの `toolsBySender` の一致。
  </Step>
  <Step title="グループ tools">
    グループ/チャンネルの `tools`。
  </Step>
  <Step title="デフォルト toolsBySender">
    デフォルト（`"*"`）の `toolsBySender` の一致。
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
グループ/チャンネルのツール制限は、グローバル/エージェントのツールポリシーに追加して適用されます（拒否は引き続き優先されます）。一部のチャンネルでは、ルーム/チャンネルに異なるネストを使用します（例: Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、キーはグループ許可リストとして機能します。デフォルトのメンション動作を設定しつつすべてのグループを許可するには、`"*"` を使用します。

<Warning>
よくある混同: DM ペアリング承認はグループ認可と同じではありません。DM ペアリングに対応するチャンネルでは、ペアリングストアが解除するのは DM のみです。グループコマンドには、`groupAllowFrom` やそのチャンネルのドキュメント化された設定フォールバックなど、設定許可リストによる明示的なグループ送信者認可が引き続き必要です。
</Warning>

一般的な意図（コピー/貼り付け）:

<Tabs>
  <Tab title="すべてのグループ返信を無効にする">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="特定のグループのみ許可する（WhatsApp）">
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
  <Tab title="所有者のみのトリガー（WhatsApp）">
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

グループ所有者は、グループごとの有効化を切り替えられます。

- `/activation mention`
- `/activation always`

所有者は `channels.whatsapp.allowFrom`（未設定の場合はボット自身の E.164）によって決定されます。コマンドは単独のメッセージとして送信します。他のサーフェスは現在 `/activation` を無視します。

## コンテキストフィールド

グループの受信ペイロードは次を設定します。

- `ChatType=group`
- `GroupSubject`（既知の場合）
- `GroupMembers`（既知の場合）
- `WasMentioned`（メンションゲーティング結果）
- Telegram フォーラムトピックには `MessageThreadId` と `IsForum` も含まれます。

チャンネル固有のメモ:

- BlueBubbles は、`GroupMembers` を設定する前に、名前のない macOS グループ参加者をローカルの連絡先データベースから任意で補強できます。これはデフォルトでオフであり、通常のグループゲーティングに通過した後にのみ実行されます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターンでグループの導入が含まれます。これにより、モデルに対して、人間のように応答すること、Markdown テーブルを避けること、空行を最小限にして通常のチャット間隔に従うこと、リテラルの `\n` シーケンスを入力しないことを思い出させます。チャンネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンス付きの信頼されていないメタデータとしてレンダリングされます。

## iMessage の詳細

- ルーティングまたは許可リスト登録には `chat_id:<id>` を優先します。
- チャット一覧: `imsg chats --limit 20`。
- グループ返信は常に同じ `chat_id` に戻ります。

## WhatsApp システムプロンプト

グループとダイレクトのプロンプト解決、ワイルドカード動作、アカウントオーバーライドのセマンティクスを含む、標準的な WhatsApp システムプロンプトルールについては [WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp の詳細

WhatsApp のみの動作（履歴注入、メンション処理の詳細）については、[グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
