---
read_when:
    - グループチャットの動作またはメンションゲーティングの変更
sidebarTitle: Groups
summary: 各サーフェスでのグループチャット動作 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: グループ
x-i18n:
    generated_at: "2026-05-03T21:27:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fd4fcaa8335f1dc4b4b1a719d6654ab0c10530f74284269ed6205dd5f87c116
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo の各サーフェスでグループチャットを一貫して扱います。

## 初心者向けイントロ（2分）

OpenClaw は自分のメッセージングアカウント上に「存在」します。独立した WhatsApp bot ユーザーはありません。**あなた**がグループに参加していれば、OpenClaw はそのグループを確認し、そこで応答できます。

デフォルトの動作:

- グループは制限されます（`groupPolicy: "allowlist"`）。
- mention gating を明示的に無効にしない限り、返信にはメンションが必要です。
- グループ/チャンネルでの通常の最終返信は、デフォルトでは非公開です。ルームに表示される出力には `message` ツールを使います。

つまり、allowlist に登録された送信者は、OpenClaw にメンションすることで起動できます。

<Note>
**要約**

- **DM アクセス**は `*.allowFrom` で制御されます。
- **グループアクセス**は `*.groupPolicy` + allowlist（`*.groups`、`*.groupAllowFrom`）で制御されます。
- **返信のトリガー**は mention gating（`requireMention`、`/activation`）で制御されます。

</Note>

クイックフロー（グループメッセージに何が起きるか）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 表示される返信

グループ/チャンネルのルームでは、OpenClaw のデフォルトは `messages.groupChat.visibleReplies: "message_tool"` です。
`openclaw doctor --fix` は、これを省略している設定済みチャンネル設定にこのデフォルトを書き込みます。
つまり、エージェントは引き続きターンを処理してメモリ/セッション状態を更新できますが、通常の最終回答は自動的にはルームに投稿されません。表示される形で発言するには、エージェントは `message(action=send)` を使います。

有効なツールポリシーの下で message ツールが利用できない場合、OpenClaw は応答を黙って抑制するのではなく、自動の表示返信にフォールバックします。
`openclaw doctor` はこの不一致について警告します。

ダイレクトチャットやその他のソースターンでは、同じツール専用の表示返信動作をグローバルに適用するために `messages.visibleReplies: "message_tool"` を使います。ハーネスも、未設定時のデフォルトとしてこれを選択できます。Codex ハーネスは、Codex モードのダイレクトチャットでこれを行います。`messages.groupChat.visibleReplies` は、グループ/チャンネルのルーム向けのより具体的なオーバーライドとして残ります。

これは、ほとんどの lurk モードのターンでモデルに `NO_REPLY` と答えさせる古いパターンを置き換えます。ツール専用モードでは、表示される処理を何もしないことは、単に message ツールを呼び出さないことを意味します。

ツール専用モードでエージェントが作業している間も、入力中インジケーターは送信されます。これらのターンでは、エージェントが message ツールを呼び出すかどうかを決める前に通常のアシスタントメッセージテキストが存在しない可能性があるため、デフォルトのグループ入力中モードは "message" から "instant" にアップグレードされます。明示的な入力中モード設定がある場合は、引き続きそれが優先されます。

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

Gateway はファイル保存後に `messages` 設定をホットリロードします。ファイル監視または設定リロードがデプロイで無効になっている場合のみ、再起動してください。

すべてのソースチャットで表示出力を message ツール経由にするには:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンド対応のその他のサーフェス）は `visibleReplies: "message_tool"` を迂回し、チャンネルネイティブのコマンド UI が期待する応答を受け取れるよう常に表示返信します。これは検証済みのネイティブコマンドターンにのみ適用されます。テキスト入力された `/...` コマンドや通常のチャットターンは、引き続き設定されたグループデフォルトに従います。

## コンテキストの可視性と allowlist

グループの安全性には、2種類の異なる制御が関係します。

- **トリガー認可**: 誰がエージェントを起動できるか（`groupPolicy`、`groups`、`groupAllowFrom`、チャンネル固有の allowlist）。
- **コンテキストの可視性**: モデルに注入される補足コンテキスト（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は通常のチャット動作を優先し、コンテキストをほぼ受信したまま保持します。つまり、allowlist は主に誰がアクションを起動できるかを決めるものであり、すべての引用や履歴スニペットに対する普遍的な秘匿境界ではありません。

<AccordionGroup>
  <Accordion title="現在の動作はチャンネル固有です">
    - 一部のチャンネルでは、特定のパスで補足コンテキストに送信者ベースのフィルタリングをすでに適用しています（たとえば Slack スレッドのシード、Matrix の返信/スレッド検索）。
    - その他のチャンネルでは、引用/返信/転送コンテキストを受信したまま渡します。

  </Accordion>
  <Accordion title="強化の方向性（計画中）">
    - `contextVisibility: "all"`（デフォルト）は、現在の受信したままの動作を維持します。
    - `contextVisibility: "allowlist"` は、補足コンテキストを allowlist に登録された送信者に絞り込みます。
    - `contextVisibility: "allowlist_quote"` は `allowlist` に加えて、1つの明示的な引用/返信の例外を許可します。

    この強化モデルがチャンネル全体で一貫して実装されるまでは、サーフェスごとの差異があるものと考えてください。

  </Accordion>
</AccordionGroup>

![グループメッセージフロー](/images/groups-flow.svg)

目的別の設定:

| 目的                                         | 設定する内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可し、@メンション時のみ返信する | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効にする             | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                           | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）      |
| グループ内で自分だけが起動できる             | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| チャンネル間で1つの信頼済み送信者セットを再利用する | `groupAllowFrom: ["accessGroup:operators"]`                |

再利用可能な送信者 allowlist については、[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使います（ルーム/チャンネルは `agent:<agentId>:<channel>:channel:<id>` を使います）。
- Telegram フォーラムトピックは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` を追加します。
- ダイレクトチャットはメインセッション（または設定されている場合は送信者ごと）を使います。
- グループセッションでは Heartbeat はスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人 DM + 公開グループ（単一エージェント）

はい。「個人」トラフィックが **DM** で、「公開」トラフィックが **グループ** であれば、これはうまく機能します。

理由: 単一エージェントモードでは、DM は通常 **メイン** セッションキー（`agent:main:main`）に入り、グループは常に **非メイン** セッションキー（`agent:main:<channel>:group:<id>`）を使います。`mode: "non-main"` でサンドボックスを有効にすると、これらのグループセッションは設定されたサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。

これにより、1つのエージェントの「脳」（共有ワークスペース + メモリ）を持ちながら、2つの実行姿勢を使えます。

- **DM**: フルツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

<Note>
本当に分離されたワークスペース/ペルソナ（「個人」と「公開」を絶対に混在させてはならない）が必要な場合は、2つ目のエージェント + バインディングを使ってください。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。
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
  <Tab title="グループには allowlist に登録されたフォルダーのみを表示">
    「ホストアクセスなし」ではなく「グループはフォルダー X だけを見られる」ようにしたい場合は、`workspaceAccess: "none"` を維持し、allowlist に登録したパスだけをサンドボックスにマウントします。

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
- ツールがブロックされた理由のデバッグ: [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
- バインドマウントの詳細: [サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UI ラベルは、利用可能な場合は `displayName` を使い、`<channel>:<token>` としてフォーマットされます。
- `#room` はルーム/チャンネル用に予約されています。グループチャットは `g-<slug>` を使います（小文字、スペース -> `-`、`#@+._-` は保持）。

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

| ポリシー      | 動作                                                         |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | グループは allowlist を迂回します。mention gating は引き続き適用されます。 |
| `"disabled"`  | すべてのグループメッセージを完全にブロックします。           |
| `"allowlist"` | 設定された allowlist に一致するグループ/ルームのみを許可します。 |

<AccordionGroup>
  <Accordion title="チャンネルごとの注記">
    - `groupPolicy` は mention gating（@メンションを要求するもの）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使います（フォールバック: 明示的な `allowFrom`）。
    - Signal: `groupAllowFrom` は、受信した Signal グループ ID または送信者の電話番号/UUID のいずれかに一致できます。
    - DM ペアリング承認（`*-allowFrom` ストアエントリ）は DM アクセスにのみ適用されます。グループ送信者の認可は、グループ allowlist に対して明示的なままです。
    - Discord: allowlist は `channels.discord.guilds.<id>.channels` を使います。
    - Slack: allowlist は `channels.slack.channels` を使います。
    - Matrix: allowlist は `channels.matrix.groups` を使います。ルーム ID またはエイリアスを推奨します。参加済みルーム名の検索はベストエフォートで、解決できない名前は実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使います。ルームごとの `users` allowlist もサポートされています。
    - グループ DM は別個に制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram allowlist は、ユーザー ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字小文字を区別しません。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ allowlist が空の場合、グループメッセージはブロックされます。
    - 実行時の安全性: プロバイダーブロックが完全に欠落している場合（`channels.<provider>` が存在しない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承するのではなく、fail-closed モード（通常は `allowlist`）にフォールバックします。

  </Accordion>
</AccordionGroup>

簡単なメンタルモデル（グループメッセージの評価順）:

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="グループ許可リスト">
    グループ許可リスト（`*.groups`、`*.groupAllowFrom`、チャネル固有の許可リスト）。
  </Step>
  <Step title="メンション制御">
    メンション制御（`requireMention`、`/activation`）。
  </Step>
</Steps>

## メンション制御（デフォルト）

グループメッセージは、グループごとに上書きされていない限りメンションを必要とします。デフォルトは各サブシステムの `*.groups."*"` にあります。

ボットメッセージへの返信は、チャネルが返信メタデータをサポートしている場合、暗黙のメンションとして扱われます。ボットメッセージの引用も、引用メタデータを公開するチャネルでは暗黙のメンションとして扱われる場合があります。現在の組み込みケースには、Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUser が含まれます。

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
  <Accordion title="メンション制御の注意事項">
    - `mentionPatterns` は大文字小文字を区別しない安全な正規表現パターンです。不正なパターンや、安全でないネストされた繰り返し形式は無視されます。
    - 明示的なメンションを提供するサーフェスは引き続き通過します。パターンはフォールバックです。
    - エージェントごとの上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に便利です）。
    - メンション制御は、メンション検出が可能な場合（ネイティブメンション、または `mentionPatterns` が設定されている場合）にのみ適用されます。
    - グループまたは送信者を許可リストに入れても、メンション制御は無効になりません。すべてのメッセージでトリガーする必要がある場合は、そのグループの `requireMention` を `false` に設定してください。
    - グループチャットのプロンプトコンテキストには、解決済みのサイレント返信指示が毎ターン含まれます。ワークスペースファイルで `NO_REPLY` の仕組みを重複させるべきではありません。
    - サイレント返信が許可されているグループでは、クリーンな空のモデルターン、または推論のみのモデルターンを、`NO_REPLY` と同等のサイレントとして扱います。ダイレクトチャットでも、ダイレクトのサイレント返信が明示的に許可されている場合にのみ同じ扱いになります。それ以外の場合、空の返信は失敗したエージェントターンのままです。
    - Discord のデフォルトは `channels.discord.guilds."*"` にあります（ギルド/チャネルごとに上書き可能）。
    - グループ履歴コンテキストはチャネル間で統一的にラップされ、**保留中のみ**（メンション制御によってスキップされたメッセージ）です。グローバルデフォルトには `messages.groupChat.historyLimit` を使用し、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効化するには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ/チャネルのツール制限（任意）

一部のチャネル設定では、**特定のグループ/ルーム/チャネル内**で利用できるツールを制限できます。

- `tools`: グループ全体のツールを許可/拒否します。
- `toolsBySender`: グループ内の送信者ごとの上書きです。明示的なキープレフィックスを使用してください: `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。従来のプレフィックスなしキーも引き続き受け入れられ、`id:` としてのみ照合されます。

解決順（最も具体的なものが優先）:

<Steps>
  <Step title="グループ toolsBySender">
    グループ/チャネルの `toolsBySender` の一致。
  </Step>
  <Step title="グループ tools">
    グループ/チャネルの `tools`。
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
グループ/チャネルのツール制限は、グローバル/エージェントのツールポリシーに追加して適用されます（拒否は引き続き優先されます）。一部のチャネルでは、ルーム/チャネルに異なるネストを使用します（例: Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、キーはグループ許可リストとして機能します。デフォルトのメンション動作を設定しつつ、すべてのグループを許可するには `"*"` を使用します。

<Warning>
よくある混同: DM ペアリング承認はグループ承認と同じではありません。DM ペアリングをサポートするチャネルでは、ペアリングストアが有効化するのは DM のみです。グループコマンドには、`groupAllowFrom` やそのチャネル向けに文書化された設定フォールバックなど、設定の許可リストによる明示的なグループ送信者承認が引き続き必要です。
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

## Activation（所有者のみ）

グループ所有者は、グループごとの Activation を切り替えられます。

- `/activation mention`
- `/activation always`

所有者は `channels.whatsapp.allowFrom`（未設定の場合はボット自身の E.164）によって決定されます。コマンドは単独のメッセージとして送信してください。他のサーフェスは現在 `/activation` を無視します。

## コンテキストフィールド

グループの受信ペイロードは次を設定します。

- `ChatType=group`
- `GroupSubject`（既知の場合）
- `GroupMembers`（既知の場合）
- `WasMentioned`（メンション制御の結果）
- Telegram のフォーラムトピックには、`MessageThreadId` と `IsForum` も含まれます。

チャネル固有の注意事項:

- BlueBubbles は、`GroupMembers` を設定する前に、名前のない macOS グループ参加者をローカルの連絡先データベースから任意で補完できます。これはデフォルトでオフであり、通常のグループ制御を通過した後にのみ実行されます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターンでグループ導入が含まれます。モデルに、人間のように応答し、Markdown テーブルを避け、空行を最小限にし通常のチャット間隔に従い、リテラルの `\n` シーケンスを入力しないよう促します。チャネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンスされた信頼されていないメタデータとしてレンダリングされます。

## iMessage 固有事項

- ルーティングまたは許可リストでは `chat_id:<id>` を優先してください。
- チャット一覧: `imsg chats --limit 20`。
- グループ返信は常に同じ `chat_id` に戻ります。

## WhatsApp システムプロンプト

グループおよびダイレクトのプロンプト解決、ワイルドカード動作、アカウント上書きセマンティクスを含む、正規の WhatsApp システムプロンプトルールについては、[WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp 固有事項

WhatsApp のみの動作（履歴挿入、メンション処理の詳細）については、[グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
