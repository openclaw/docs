---
read_when:
    - グループチャットの動作またはメンション制御の変更
sidebarTitle: Groups
summary: 各サーフェスでのグループチャットの動作 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: グループ
x-i18n:
    generated_at: "2026-05-02T04:48:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cc33dbbcf5504cae5caa003b7427d99f5c1a2d7c850dedd5d1f58a2fe44fa04
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo の各サーフェスでグループチャットを一貫して扱います。

## 初心者向けの概要（2分）

OpenClaw は、自分のメッセージングアカウント上に「存在」します。別個の WhatsApp ボットユーザーはありません。**あなた**がグループに入っている場合、OpenClaw はそのグループを見て、そこで応答できます。

デフォルトの動作:

- グループは制限されます（`groupPolicy: "allowlist"`）。
- 明示的にメンションゲートを無効にしない限り、返信にはメンションが必要です。
- グループ/チャンネルでの通常の最終返信は、デフォルトで非公開です。ルームに表示される出力には `message` ツールを使います。

つまり、許可リストに含まれる送信者は、OpenClaw にメンションすることで OpenClaw をトリガーできます。

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

## 表示される返信

グループ/チャンネルのルームでは、OpenClaw はデフォルトで `messages.groupChat.visibleReplies: "message_tool"` を使います。
つまり、エージェントは引き続きターンを処理し、メモリ/セッション状態を更新できますが、通常の最終回答は自動的にはルームに投稿されません。表示される形で発言するには、エージェントが `message(action=send)` を使います。

アクティブなツールポリシーの下で message ツールが利用できない場合、OpenClaw は応答を黙って抑制するのではなく、自動の表示返信にフォールバックします。
`openclaw doctor` はこの不一致について警告します。

直接チャットやその他のソースターンでは、同じツール専用の表示返信動作をグローバルに適用するために `messages.visibleReplies: "message_tool"` を使います。ハーネスもこれを未設定時のデフォルトとして選べます。Codex ハーネスは Codex モードの直接チャットでこれを行います。グループ/チャンネルのルームでは、`messages.groupChat.visibleReplies` が引き続きより具体的なオーバーライドです。

これは、ほとんどの待機モードのターンでモデルに `NO_REPLY` と回答させる古いパターンを置き換えます。ツール専用モードでは、何も表示しないことは単に message ツールを呼び出さないことを意味します。

エージェントがツール専用モードで作業している間も、入力中インジケーターは送信されます。これらのターンでは、エージェントが message ツールを呼び出すかどうかを決める前に通常のアシスタントメッセージ本文が存在しない可能性があるため、デフォルトのグループ入力中モードは "message" から "instant" に引き上げられます。明示的な入力中モード設定は引き続き優先されます。

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

Gateway はファイル保存後に `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効な場合にのみ再起動してください。

すべてのソースチャットで表示出力を message ツール経由にするには:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンドをサポートするその他のサーフェス）は `visibleReplies: "message_tool"` をバイパスし、チャンネルネイティブのコマンド UI が期待する応答を受け取れるように常に表示返信します。これは検証済みのネイティブコマンドターンにのみ適用されます。テキストとして入力された `/...` コマンドや通常のチャットターンは、引き続き設定されたグループデフォルトに従います。

## コンテキストの可視性と許可リスト

グループの安全性には、2つの異なる制御が関係します。

- **トリガー認可**: エージェントをトリガーできる人（`groupPolicy`、`groups`、`groupAllowFrom`、チャンネル固有の許可リスト）。
- **コンテキストの可視性**: モデルに注入される補足コンテキスト（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は通常のチャット動作を優先し、受信したコンテキストをほぼそのまま保持します。つまり、許可リストは主に誰がアクションをトリガーできるかを決めるものであり、引用や履歴スニペットすべてに対する普遍的な墨消し境界ではありません。

<AccordionGroup>
  <Accordion title="現在の動作はチャンネル固有です">
    - 一部のチャンネルでは、特定の経路で補足コンテキストに送信者ベースのフィルタリングをすでに適用しています（例: Slack スレッドのシード、Matrix の返信/スレッド検索）。
    - その他のチャンネルでは、引用/返信/転送コンテキストを受信したまま渡しています。

  </Accordion>
  <Accordion title="強化の方向性（予定）">
    - `contextVisibility: "all"`（デフォルト）は、現在の受信時のままの動作を維持します。
    - `contextVisibility: "allowlist"` は、補足コンテキストを許可リストに含まれる送信者に絞り込みます。
    - `contextVisibility: "allowlist_quote"` は `allowlist` に加えて、明示的な引用/返信の例外を1つ許可します。

    この強化モデルがチャンネル全体で一貫して実装されるまでは、サーフェスごとの差異があるものと考えてください。

  </Accordion>
</AccordionGroup>

![グループメッセージのフロー](/images/groups-flow.svg)

目的別の設定...

| 目的                                         | 設定する内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可するが @メンション時のみ返信する | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効にする                    | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                         | `groups: { "<group-id>": { ... } }` (`"*"` キーなし)         |
| グループであなただけがトリガーできる               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| チャンネル間で1つの信頼済み送信者セットを再利用する | `groupAllowFrom: ["accessGroup:operators"]`                |

再利用可能な送信者許可リストについては、[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使います（ルーム/チャンネルは `agent:<agentId>:<channel>:channel:<id>` を使います）。
- Telegram フォーラムトピックでは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` が追加されます。
- 直接チャットはメインセッション（または設定されている場合は送信者ごと）を使います。
- Heartbeat はグループセッションではスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人用 DM + 公開グループ（単一エージェント）

はい。この構成は、「個人」トラフィックが **DM** で、「公開」トラフィックが **グループ** である場合にうまく機能します。

理由: 単一エージェントモードでは、DM は通常 **メイン** セッションキー（`agent:main:main`）に到達しますが、グループは常に **非メイン** セッションキー（`agent:main:<channel>:group:<id>`）を使います。`mode: "non-main"` でサンドボックス化を有効にすると、これらのグループセッションは設定済みのサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。

これにより、1つのエージェントの「頭脳」（共有ワークスペース + メモリ）を持ちつつ、2つの実行姿勢を使い分けられます。

- **DM**: フルツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

<Note>
本当に分離されたワークスペース/ペルソナ（「個人」と「公開」を決して混在させてはならない）が必要な場合は、2つ目のエージェント + バインディングを使います。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。
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
    「ホストアクセスなし」ではなく「グループはフォルダー X だけ見える」ようにしたい場合は、`workspaceAccess: "none"` を維持し、許可リストに含まれるパスだけをサンドボックスにマウントします。

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

関連項目:

- 設定キーとデフォルト: [Gateway 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- ツールがブロックされる理由のデバッグ: [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
- バインドマウントの詳細: [サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UI ラベルは、利用可能な場合 `displayName` を使い、`<channel>:<token>` として整形されます。
- `#room` はルーム/チャンネル用に予約されています。グループチャットでは `g-<slug>` を使います（小文字、スペース -> `-`、`#@+._-` は維持）。

## グループポリシー

チャンネルごとにグループ/ルームメッセージの扱いを制御します。

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
| `"allowlist"` | 設定済みの許可リストに一致するグループ/ルームのみ許可します。 |

<AccordionGroup>
  <Accordion title="チャンネルごとの注意点">
    - `groupPolicy` はメンションゲート（@メンションを必要とするもの）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使います（フォールバック: 明示的な `allowFrom`）。
    - Signal: `groupAllowFrom` は、受信した Signal グループ ID または送信者の電話番号/UUID のどちらにも一致できます。
    - DM ペアリング承認（`*-allowFrom` ストアエントリ）は DM アクセスにのみ適用されます。グループ送信者の認可はグループ許可リストに対して明示的なままです。
    - Discord: 許可リストは `channels.discord.guilds.<id>.channels` を使います。
    - Slack: 許可リストは `channels.slack.channels` を使います。
    - Matrix: 許可リストは `channels.matrix.groups` を使います。ルーム ID またはエイリアスを推奨します。参加済みルーム名の検索はベストエフォートであり、解決できない名前は実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使います。ルームごとの `users` 許可リストもサポートされています。
    - グループ DM は別途制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram の許可リストは、ユーザー ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字と小文字を区別しません。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
    - 実行時の安全性: プロバイダーブロックが完全に欠落している場合（`channels.<provider>` が存在しない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承するのではなく、フェイルクローズモード（通常は `allowlist`）にフォールバックします。

  </Accordion>
</AccordionGroup>

グループメッセージの簡単なメンタルモデル（評価順序）:

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

グループメッセージは、グループごとに上書きされていない限り、メンションを必要とします。デフォルトはサブシステムごとに `*.groups."*"` の下にあります。

チャネルが返信メタデータをサポートしている場合、ボットメッセージへの返信は暗黙のメンションとして扱われます。引用メタデータを公開するチャネルでは、ボットメッセージの引用も暗黙のメンションとして扱われる場合があります。現在の組み込みケースには Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUser が含まれます。

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
  <Accordion title="メンションゲーティングの注記">
    - `mentionPatterns` は大文字小文字を区別しない安全な正規表現パターンです。無効なパターンや安全でないネストされた反復形式は無視されます。
    - 明示的なメンションを提供するサーフェスは引き続き通過します。パターンはフォールバックです。
    - エージェントごとの上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に便利です）。
    - メンションゲーティングは、メンション検出が可能な場合（ネイティブメンション、または `mentionPatterns` が設定されている場合）にのみ適用されます。
    - グループや送信者を許可リストに追加しても、メンションゲーティングは無効になりません。すべてのメッセージでトリガーする必要がある場合は、そのグループの `requireMention` を `false` に設定してください。
    - グループチャットのプロンプトコンテキストは、解決済みのサイレント返信指示を毎ターン保持します。ワークスペースファイルで `NO_REPLY` の仕組みを重複させるべきではありません。
    - サイレント返信が許可されているグループでは、クリーンな空のモデルターンや推論のみのモデルターンは、`NO_REPLY` と同等のサイレントとして扱われます。直接チャットでも、直接サイレント返信が明示的に許可されている場合のみ同じ動作になります。それ以外の場合、空の返信は失敗したエージェントターンのままです。
    - Discord のデフォルトは `channels.discord.guilds."*"` にあります（ギルド/チャネルごとに上書き可能）。
    - グループ履歴コンテキストはチャネル全体で均一にラップされ、**保留中のみ**（メンションゲーティングのためスキップされたメッセージ）です。グローバルデフォルトには `messages.groupChat.historyLimit` を使用し、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用してください。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ/チャネルのツール制限（任意）

一部のチャネル設定では、**特定のグループ/ルーム/チャネル内**で利用できるツールを制限できます。

- `tools`: グループ全体でツールを許可/拒否します。
- `toolsBySender`: グループ内の送信者ごとの上書きです。明示的なキープレフィックスを使用してください: `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。従来のプレフィックスなしキーも引き続き受け付けられ、`id:` としてのみ一致します。

解決順序（最も具体的なものが優先されます）:

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
グループ/チャネルのツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます（deny は引き続き優先されます）。一部のチャネルでは、ルーム/チャネルに異なるネストを使用します（例: Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、そのキーはグループ許可リストとして機能します。デフォルトのメンション動作を設定しながらすべてのグループを許可するには、`"*"` を使用します。

<Warning>
よくある混同: DM のペアリング承認は、グループ認可と同じではありません。DM ペアリングをサポートするチャネルでは、ペアリングストアがロック解除するのは DM のみです。グループコマンドには、`groupAllowFrom` やそのチャネルのドキュメント化された設定フォールバックなど、設定許可リストによる明示的なグループ送信者認可が引き続き必要です。
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
  <Tab title="すべてのグループを許可するがメンションを要求">
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

## アクティベーション（所有者のみ）

グループ所有者は、グループごとのアクティベーションを切り替えられます。

- `/activation mention`
- `/activation always`

所有者は `channels.whatsapp.allowFrom`（未設定の場合はボット自身の E.164）によって決定されます。コマンドは単独のメッセージとして送信してください。他のサーフェスは現在 `/activation` を無視します。

## コンテキストフィールド

グループの受信ペイロードは次を設定します。

- `ChatType=group`
- `GroupSubject`（既知の場合）
- `GroupMembers`（既知の場合）
- `WasMentioned`（メンションゲーティングの結果）
- Telegram フォーラムトピックには `MessageThreadId` と `IsForum` も含まれます。

チャネル固有の注記:

- BlueBubbles は、`GroupMembers` を設定する前に、名前のない macOS グループ参加者をローカルの連絡先データベースから任意で補完できます。これはデフォルトでオフであり、通常のグループゲーティングを通過した後にのみ実行されます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターンでグループ紹介が含まれます。これは、モデルに対して人間らしく応答すること、Markdown テーブルを避けること、空行を最小限にし通常のチャット間隔に従うこと、リテラルの `\n` シーケンスを入力しないことを促します。チャネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンスされた信頼できないメタデータとしてレンダリングされます。

## iMessage 固有事項

- ルーティングまたは許可リスト化には `chat_id:<id>` を推奨します。
- チャットを一覧表示: `imsg chats --limit 20`。
- グループ返信は常に同じ `chat_id` に戻されます。

## WhatsApp システムプロンプト

グループおよび直接プロンプトの解決、ワイルドカード動作、アカウント上書きのセマンティクスを含む、標準的な WhatsApp システムプロンプトルールについては [WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp 固有事項

WhatsApp のみの動作（履歴注入、メンション処理の詳細）については [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
