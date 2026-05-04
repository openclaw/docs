---
read_when:
    - グループチャットの動作またはメンションゲーティングの変更
sidebarTitle: Groups
summary: 各サーフェスにおけるグループチャットの動作 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: グループ
x-i18n:
    generated_at: "2026-05-04T02:21:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: dea506c011a5d8f6155b2f56aacb236482cb8c5b7457001cb2171fd45932443d
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo の各サーフェスで、グループチャットを一貫して扱います。

## 初心者向けイントロ（2 分）

OpenClaw は、自分のメッセージングアカウント上に「存在」します。別個の WhatsApp ボットユーザーはありません。**あなた**がグループに参加していれば、OpenClaw はそのグループを認識し、そこで応答できます。

デフォルトの動作:

- グループは制限されます（`groupPolicy: "allowlist"`）。
- 明示的にメンションゲートを無効化しない限り、返信にはメンションが必要です。
- グループ/チャンネルでの通常の最終返信は、デフォルトでは非公開です。ルームに見える出力には `message` ツールを使います。

つまり、許可リストに登録された送信者は、OpenClaw にメンションすることでトリガーできます。

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

## 見える返信

グループ/チャンネルルームでは、OpenClaw のデフォルトは `messages.groupChat.visibleReplies: "message_tool"` です。
`openclaw doctor --fix` は、これを省略している設定済みチャンネル設定にこのデフォルトを書き込みます。
つまり、エージェントは引き続きターンを処理し、メモリ/セッション状態を更新できますが、通常の最終回答はルームに自動投稿されません。見える形で発言するには、エージェントが `message(action=send)` を使います。

このデフォルトは、ツールを確実に呼び出すモデル/ランタイムに依存します。ログにアシスタントテキストが表示されているのに `didSendViaMessagingTool: false` の場合、モデルはメッセージツールを呼び出さず、非公開で回答しています。これは Discord/Slack/Telegram の送信失敗ではありません。グループ/チャンネルセッションにはツール呼び出しが信頼できるモデルを使うか、`messages.groupChat.visibleReplies: "automatic"` を設定して、従来の見える最終返信を復元してください。

アクティブなツールポリシーでメッセージツールが利用できない場合、OpenClaw は応答を黙って抑制するのではなく、自動の見える返信にフォールバックします。
`openclaw doctor` はこの不一致について警告します。

ダイレクトチャットおよびその他の送信元ターンでは、`messages.visibleReplies: "message_tool"` を使って、同じツール専用の見える返信動作をグローバルに適用します。ハーネスもこれを未設定時のデフォルトとして選べます。Codex ハーネスは、Codex モードのダイレクトチャットでこれを行います。`messages.groupChat.visibleReplies` は、グループ/チャンネルルーム向けのより具体的なオーバーライドとして残ります。

これは、ほとんどの潜伏モードのターンでモデルに `NO_REPLY` と回答させる古いパターンを置き換えます。ツール専用モードでは、見える動作を何もしないことは、単にメッセージツールを呼び出さないことを意味します。

エージェントがツール専用モードで作業している間も、入力中インジケーターは送信されます。これらのターンでは、エージェントがメッセージツールを呼び出すかどうかを決める前に通常のアシスタントメッセージテキストが一切存在しない可能性があるため、デフォルトのグループ入力中モードは "message" から "instant" にアップグレードされます。明示的な入力中モード設定は引き続き優先されます。

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

Gateway はファイル保存後に `messages` 設定をホットリロードします。再起動が必要なのは、デプロイでファイル監視または設定リロードが無効になっている場合だけです。

すべての送信元チャットで、見える出力にメッセージツールの経由を必須にするには:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンド対応のその他のサーフェス）は `visibleReplies: "message_tool"` をバイパスし、チャンネルネイティブのコマンド UI が期待する応答を受け取れるよう、常に見える形で返信します。これは検証済みのネイティブコマンドターンにのみ適用されます。テキスト入力された `/...` コマンドと通常のチャットターンは、引き続き設定済みのグループデフォルトに従います。

## コンテキストの可視性と許可リスト

グループの安全性には、2 つの異なる制御が関係します。

- **トリガー認可**: 誰がエージェントをトリガーできるか（`groupPolicy`、`groups`、`groupAllowFrom`、チャンネル固有の許可リスト）。
- **コンテキストの可視性**: どの補足コンテキストがモデルに注入されるか（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は通常のチャット動作を優先し、コンテキストをほぼ受信時のまま保ちます。つまり、許可リストは主に誰がアクションをトリガーできるかを決めるものであり、引用や履歴のあらゆるスニペットに対する普遍的な墨消し境界ではありません。

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - 一部のチャンネルでは、特定のパスで補足コンテキストに対して送信者ベースのフィルタリングがすでに適用されています（たとえば Slack のスレッドシード、Matrix の返信/スレッド検索）。
    - 他のチャンネルでは、引用/返信/転送コンテキストを受信時のまま渡しています。

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"`（デフォルト）は、現在の受信時のままの動作を維持します。
    - `contextVisibility: "allowlist"` は、補足コンテキストを許可リストに登録された送信者に絞り込みます。
    - `contextVisibility: "allowlist_quote"` は `allowlist` に、1 つの明示的な引用/返信例外を加えたものです。

    この強化モデルがチャンネル全体で一貫して実装されるまでは、サーフェスごとの差異があると考えてください。

  </Accordion>
</AccordionGroup>

![グループメッセージフロー](/images/groups-flow.svg)

目的別の設定:

| 目的                                         | 設定する内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可するが @メンションでのみ返信する | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効化する                    | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                              | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）         |
| グループでトリガーできるのを自分だけにする              | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| チャンネル間で 1 つの信頼済み送信者セットを再利用する | `groupAllowFrom: ["accessGroup:operators"]`                |

再利用可能な送信者許可リストについては、[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使います（ルーム/チャンネルは `agent:<agentId>:<channel>:channel:<id>` を使います）。
- Telegram フォーラムトピックはグループ ID に `:topic:<threadId>` を追加するため、各トピックが独自のセッションを持ちます。
- ダイレクトチャットはメインセッションを使います（設定されている場合は送信者ごと）。
- Heartbeat はグループセッションではスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人 DM + 公開グループ（単一エージェント）

はい。この構成は、「個人」トラフィックが **DM** で、「公開」トラフィックが **グループ** の場合にうまく機能します。

理由: 単一エージェントモードでは、DM は通常 **main** セッションキー（`agent:main:main`）に到達します。一方、グループは常に **non-main** セッションキー（`agent:main:<channel>:group:<id>`）を使います。`mode: "non-main"` でサンドボックス化を有効にすると、それらのグループセッションは設定されたサンドボックスバックエンド内で実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。

これにより、1 つのエージェント「頭脳」（共有ワークスペース + メモリ）で、2 つの実行姿勢を持てます。

- **DM**: フルツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

<Note>
本当に分離されたワークスペース/ペルソナが必要な場合（「個人」と「公開」を決して混在させてはならない場合）は、2 つ目のエージェント + バインディングを使ってください。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。
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
    「グループはホストにアクセスできない」ではなく「グループはフォルダー X のみ見える」にしたい場合は、`workspaceAccess: "none"` を維持し、許可リストに登録されたパスだけをサンドボックスへマウントしてください。

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

関連情報:

- 設定キーとデフォルト: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- ツールがブロックされる理由のデバッグ: [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
- バインドマウントの詳細: [サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UI ラベルは、利用可能な場合 `displayName` を使い、`<channel>:<token>` としてフォーマットされます。
- `#room` はルーム/チャンネル用に予約されています。グループチャットは `g-<slug>`（小文字、スペース -> `-`、`#@+._-` は保持）を使います。

## グループポリシー

チャンネルごとに、グループ/ルームメッセージの扱いを制御します。

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
  <Accordion title="Per-channel notes">
    - `groupPolicy` はメンションゲート（@mentions が必要）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使用します（フォールバック: 明示的な `allowFrom`）。
    - Signal: `groupAllowFrom` は、受信した Signal グループ ID または送信者の電話番号/UUID のどちらにも一致できます。
    - DM ペアリング承認（`*-allowFrom` ストアエントリ）は DM アクセスのみに適用されます。グループ送信者の認可は、グループ許可リストに明示されたままです。
    - Discord: 許可リストは `channels.discord.guilds.<id>.channels` を使用します。
    - Slack: 許可リストは `channels.slack.channels` を使用します。
    - Matrix: 許可リストは `channels.matrix.groups` を使用します。ルーム ID またはエイリアスを推奨します。参加済みルーム名のルックアップはベストエフォートであり、解決できない名前は実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用します。ルーム単位の `users` 許可リストもサポートされています。
    - グループ DM は別に制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram の許可リストは、ユーザー ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字小文字を区別しません。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
    - 実行時の安全性: プロバイダーブロックが完全に欠落している場合（`channels.<provider>` が存在しない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承する代わりに、フェイルクローズモード（通常は `allowlist`）へフォールバックします。

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

グループメッセージには、グループ単位で上書きされない限りメンションが必要です。デフォルトは各サブシステムの `*.groups."*"` 配下にあります。

チャンネルが返信メタデータをサポートしている場合、ボットメッセージへの返信は暗黙のメンションとして扱われます。引用メタデータを公開するチャンネルでは、ボットメッセージの引用も暗黙のメンションとして扱われる場合があります。現在の組み込みケースには Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUser が含まれます。

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
    - `mentionPatterns` は大文字小文字を区別しない安全な正規表現パターンです。無効なパターンや安全でないネストされた繰り返し形式は無視されます。
    - 明示的なメンションを提供するサーフェスはそのまま通過します。パターンはフォールバックです。
    - エージェント単位の上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に便利です）。
    - メンションゲートは、メンション検出が可能な場合（ネイティブメンション、または `mentionPatterns` が設定されている場合）にのみ適用されます。
    - グループまたは送信者を許可リストに入れても、メンションゲートは無効になりません。すべてのメッセージで起動する必要がある場合は、そのグループの `requireMention` を `false` に設定します。
    - グループチャットのプロンプトコンテキストは、解決済みのサイレント返信指示を毎ターン保持します。ワークスペースファイルで `NO_REPLY` の仕組みを重複させるべきではありません。
    - サイレント返信が許可されているグループでは、空のモデルターン、または推論のみのモデルターンを `NO_REPLY` と同等のサイレントとして扱います。直接チャットでも、直接のサイレント返信が明示的に許可されている場合のみ同じ扱いになります。それ以外の場合、空の返信は失敗したエージェントターンのままです。
    - Discord のデフォルトは `channels.discord.guilds."*"` にあります（ギルド/チャンネル単位で上書き可能）。
    - グループ履歴コンテキストはチャンネル全体で一律にラップされ、**保留中のみ**（メンションゲートによってスキップされたメッセージ）です。グローバルデフォルトには `messages.groupChat.historyLimit` を使用し、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ/チャンネルのツール制限（任意）

一部のチャンネル設定では、**特定のグループ/ルーム/チャンネル内**で利用できるツールを制限できます。

- `tools`: グループ全体のツールを許可/拒否します。
- `toolsBySender`: グループ内の送信者単位の上書きです。明示的なキープレフィックスを使用します: `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。従来のプレフィックスなしキーも引き続き受け付けられ、`id:` としてのみ照合されます。

解決順序（最も具体的なものが優先）:

<Steps>
  <Step title="グループ toolsBySender">
    グループ/チャンネルの `toolsBySender` の一致。
  </Step>
  <Step title="グループツール">
    グループ/チャンネルの `tools`。
  </Step>
  <Step title="デフォルト toolsBySender">
    デフォルト（`"*"`）の `toolsBySender` の一致。
  </Step>
  <Step title="デフォルトツール">
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
グループ/チャンネルのツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます（deny は引き続き優先されます）。一部のチャンネルでは、ルーム/チャンネルに異なるネストを使用します（例: Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、キーはグループ許可リストとして機能します。すべてのグループを許可しつつデフォルトのメンション動作を設定するには `"*"` を使用します。

<Warning>
よくある混同: DM ペアリング承認はグループ認可と同じではありません。DM ペアリングをサポートするチャンネルでは、ペアリングストアが解除するのは DM のみです。グループコマンドには、`groupAllowFrom` やそのチャンネルで文書化された設定フォールバックなど、設定許可リストによる明示的なグループ送信者認可が引き続き必要です。
</Warning>

一般的な意図（コピー/貼り付け）:

<Tabs>
  <Tab title="すべてのグループ返信を無効化">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="特定のグループのみ許可（WhatsApp）">
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
  <Tab title="すべてのグループを許可しつつメンションを必須にする">
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

## Activation（所有者のみ）

グループ所有者はグループ単位の activation を切り替えられます。

- `/activation mention`
- `/activation always`

所有者は `channels.whatsapp.allowFrom`（未設定の場合はボット自身の E.164）によって決まります。コマンドは単独のメッセージとして送信します。現在、他のサーフェスは `/activation` を無視します。

## コンテキストフィールド

グループ受信ペイロードは次を設定します。

- `ChatType=group`
- `GroupSubject`（既知の場合）
- `GroupMembers`（既知の場合）
- `WasMentioned`（メンションゲートの結果）
- Telegram フォーラムトピックには `MessageThreadId` と `IsForum` も含まれます。

チャンネル固有の注記:

- BlueBubbles は、`GroupMembers` を設定する前に、名前のない macOS グループ参加者をローカルの連絡先データベースから任意で補強できます。これはデフォルトでオフであり、通常のグループゲートを通過した後にのみ実行されます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターンでグループ導入が含まれます。これは、モデルに人間のように応答すること、Markdown テーブルを避けること、空行を最小限にして通常のチャット間隔に従うこと、リテラルの `\n` シーケンスを入力しないことを促します。チャンネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンスされた信頼できないメタデータとしてレンダリングされます。

## iMessage 固有事項

- ルーティングまたは許可リスト設定では `chat_id:<id>` を推奨します。
- チャット一覧: `imsg chats --limit 20`。
- グループ返信は常に同じ `chat_id` に返されます。

## WhatsApp システムプロンプト

グループおよび直接プロンプトの解決、ワイルドカード動作、アカウント上書きセマンティクスを含む、正準の WhatsApp システムプロンプト規則については [WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp 固有事項

WhatsApp のみの動作（履歴注入、メンション処理の詳細）については [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
