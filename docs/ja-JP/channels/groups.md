---
read_when:
    - グループチャットの動作またはメンションゲート制御の変更
sidebarTitle: Groups
summary: 各サーフェスでのグループチャットの動作 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: グループ
x-i18n:
    generated_at: "2026-05-11T20:20:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo の各サーフェスでグループチャットを一貫して扱います。

## 初心者向け入門（2 分）

OpenClaw は自分自身のメッセージングアカウント上で「動作」します。別個の WhatsApp ボットユーザーはありません。**あなた**がグループに参加している場合、OpenClaw はそのグループを認識し、そこで応答できます。

デフォルトの動作:

- グループは制限されます（`groupPolicy: "allowlist"`）。
- 明示的にメンションゲートを無効にしない限り、返信にはメンションが必要です。
- グループ/チャンネルでの通常の最終返信は、デフォルトでは非公開です。ルーム内で見える出力には `message` ツールを使います。

つまり、許可リストに入った送信者は、OpenClaw にメンションすることで OpenClaw を起動できます。

<Note>
**要約**

- **DM アクセス**は `*.allowFrom` で制御されます。
- **グループアクセス**は `*.groupPolicy` + 許可リスト（`*.groups`、`*.groupAllowFrom`）で制御されます。
- **返信のトリガー**はメンションゲート（`requireMention`、`/activation`）で制御されます。

</Note>

クイックフロー（グループメッセージに何が起こるか）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 表示される返信

グループ/チャンネルのルームでは、OpenClaw のデフォルトは `messages.groupChat.visibleReplies: "message_tool"` です。
`openclaw doctor --fix` は、これを省略している設定済みチャンネルの設定にこのデフォルトを書き込みます。
つまり、エージェントはターンを処理し、メモリ/セッション状態を更新できますが、通常の最終回答はルームへ自動的には投稿されません。見える形で発言するには、エージェントは `message(action=send)` を使います。

このデフォルトは、ツールを確実に呼び出すモデル/ランタイムに依存します。ログに assistant テキストが表示されているのに `didSendViaMessagingTool: false` の場合、モデルはメッセージツールを呼び出す代わりに非公開で回答しています。これは Discord/Slack/Telegram の送信失敗ではありません。グループ/チャンネルセッションにはツール呼び出しの信頼性が高いモデルを使うか、`messages.groupChat.visibleReplies: "automatic"` を設定して、従来の表示される最終返信を復元してください。

アクティブなツールポリシーでメッセージツールが利用できない場合、OpenClaw は応答を黙って抑制するのではなく、自動の表示返信にフォールバックします。
`openclaw doctor` はこの不一致について警告します。

直接チャットとその他すべてのソースターンでは、`messages.visibleReplies: "message_tool"` を使うと、同じツール専用の表示返信動作をグローバルに適用できます。ハーネスも、これを未設定時のデフォルトとして選択できます。Codex ハーネスは Codex モードの直接チャットでこれを行います。`messages.groupChat.visibleReplies` は、グループ/チャンネルのルーム向けの、より具体的な上書きとして残ります。

これは、ほとんどの待機モードのターンでモデルに `NO_REPLY` と回答させる古いパターンを置き換えます。ツール専用モードでは、見える出力を何もしないとは、単にメッセージツールを呼び出さないことを意味します。

ツール専用モードでも、エージェントの作業中は入力中インジケーターが送信されます。これらのターンでは、エージェントがメッセージツールを呼び出すかどうかを決める前に通常の assistant メッセージテキストが存在しない可能性があるため、デフォルトのグループ入力モードは "message" から "instant" にアップグレードされます。明示的な入力モード設定は引き続き優先されます。

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

Gateway は、ファイルが保存された後に `messages` 設定をホットリロードします。デプロイでファイル監視または設定リロードが無効になっている場合にのみ再起動してください。

すべてのソースチャットで、表示される出力をメッセージツール経由に要求するには:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンド対応のその他サーフェス）は `visibleReplies: "message_tool"` をバイパスし、チャンネルネイティブのコマンド UI が期待する応答を受け取れるよう、常に見える形で返信します。これは検証済みのネイティブコマンドターンにのみ適用されます。テキスト入力された `/...` コマンドと通常のチャットターンは、引き続き設定されたグループデフォルトに従います。

## コンテキストの可視性と許可リスト

グループの安全性には、2 つの異なる制御が関係します。

- **トリガー認可**: 誰がエージェントをトリガーできるか（`groupPolicy`、`groups`、`groupAllowFrom`、チャンネル固有の許可リスト）。
- **コンテキストの可視性**: モデルに注入される補足コンテキスト（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は通常のチャット動作を優先し、コンテキストをほぼ受信時のまま保持します。つまり、許可リストは主に誰がアクションをトリガーできるかを決めるものであり、引用や履歴スニペットすべてに対する普遍的な秘匿境界ではありません。

<AccordionGroup>
  <Accordion title="現在の動作はチャンネルごとに異なります">
    - 一部のチャンネルでは、特定のパスで補足コンテキストに送信者ベースのフィルタリングをすでに適用しています（例: Slack スレッドシード、Matrix の返信/スレッド検索）。
    - その他のチャンネルでは、引用/返信/転送コンテキストを受信時のまま渡しています。

  </Accordion>
  <Accordion title="強化の方向性（予定）">
    - `contextVisibility: "all"`（デフォルト）は、現在の受信時そのままの動作を維持します。
    - `contextVisibility: "allowlist"` は、補足コンテキストを許可リストに入った送信者に絞り込みます。
    - `contextVisibility: "allowlist_quote"` は、`allowlist` に 1 つの明示的な引用/返信例外を加えたものです。

    この強化モデルがチャンネル全体で一貫して実装されるまでは、サーフェスごとの差異があることを想定してください。

  </Accordion>
</AccordionGroup>

![グループメッセージフロー](/images/groups-flow.svg)

目的別の設定...

| 目的                                         | 設定する内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可するが @メンション時のみ返信 | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効化                    | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                              | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）         |
| グループ内で自分だけがトリガーできる              | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| チャンネル全体で 1 つの信頼済み送信者セットを再利用 | `groupAllowFrom: ["accessGroup:operators"]`                |

再利用可能な送信者許可リストについては、[アクセスグループ](/ja-JP/channels/access-groups) を参照してください。

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使います（ルーム/チャンネルは `agent:<agentId>:<channel>:channel:<id>` を使います）。
- Telegram フォーラムトピックは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` を追加します。
- 直接チャットはメインセッション（または設定されている場合は送信者ごと）を使います。
- Heartbeats はグループセッションではスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人 DM + 公開グループ（単一エージェント）

はい。「個人」トラフィックが **DM** で、「公開」トラフィックが **グループ** であれば、これはうまく機能します。

理由: 単一エージェントモードでは、DM は通常 **メイン** セッションキー（`agent:main:main`）に到達します。一方、グループは常に **非メイン** セッションキー（`agent:main:<channel>:group:<id>`）を使います。`mode: "non-main"` でサンドボックス化を有効にすると、それらのグループセッションは設定されたサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選ばない場合、Docker がデフォルトのバックエンドです。

これにより、1 つのエージェント「頭脳」（共有ワークスペース + メモリ）を持ちながら、2 つの実行態勢を使えます。

- **DM**: すべてのツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

<Note>
本当に別々のワークスペース/ペルソナ（「個人」と「公開」が決して混ざってはいけない）が必要な場合は、2 つ目のエージェント + バインディングを使ってください。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent) を参照してください。
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
    「ホストアクセスなし」ではなく「グループはフォルダー X だけを見られる」にしたい場合は、`workspaceAccess: "none"` のままにし、許可リストに入ったパスだけをサンドボックスへマウントします。

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

- UI ラベルは、利用可能な場合 `displayName` を使い、`<channel>:<token>` として整形されます。
- `#room` はルーム/チャンネル用に予約されています。グループチャットは `g-<slug>`（小文字、スペース -> `-`、`#@+._-` を保持）を使います。

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
| `"allowlist"` | 設定された許可リストに一致するグループ/ルームだけを許可します。 |

<AccordionGroup>
  <Accordion title="チャンネル別の注意事項">
    - `groupPolicy` はメンションゲート（@メンションが必要）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使用します（フォールバック: 明示的な `allowFrom`）。
    - Signal: `groupAllowFrom` は、受信した Signal グループ ID または送信者の電話番号/UUID のどちらにも一致できます。
    - DM ペアリング承認（`*-allowFrom` ストアエントリ）は DM アクセスにのみ適用されます。グループ送信者の認可は、グループ allowlist に対して明示的なままです。
    - Discord: allowlist は `channels.discord.guilds.<id>.channels` を使用します。
    - Slack: allowlist は `channels.slack.channels` を使用します。
    - Matrix: allowlist は `channels.matrix.groups` を使用します。ルーム ID またはエイリアスを推奨します。参加済みルーム名の検索はベストエフォートで、解決できない名前は実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用します。ルームごとの `users` allowlist もサポートされています。
    - グループ DM は別個に制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram allowlist は、ユーザー ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字と小文字を区別しません。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ allowlist が空の場合、グループメッセージはブロックされます。
    - 実行時の安全性: プロバイダーブロックが完全に欠落している場合（`channels.<provider>` が存在しない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承するのではなく、フェイルクローズモード（通常は `allowlist`）にフォールバックします。

  </Accordion>
</AccordionGroup>

簡単なメンタルモデル（グループメッセージの評価順）:

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="グループ allowlist">
    グループ allowlist（`*.groups`、`*.groupAllowFrom`、チャンネル固有の allowlist）。
  </Step>
  <Step title="メンションゲート">
    メンションゲート（`requireMention`、`/activation`）。
  </Step>
</Steps>

## メンションゲート（デフォルト）

グループメッセージは、グループごとに上書きされていない限りメンションが必要です。デフォルトはサブシステムごとに `*.groups."*"` の下にあります。

チャンネルが返信メタデータをサポートしている場合、ボットメッセージへの返信は暗黙的なメンションとして扱われます。引用メタデータを公開するチャンネルでは、ボットメッセージの引用も暗黙的なメンションとして扱われる場合があります。現在の組み込みケースには、Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUser が含まれます。

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
  <Accordion title="メンションゲートの注意事項">
    - `mentionPatterns` は大文字と小文字を区別しない安全な正規表現パターンです。無効なパターンや安全でないネストされた繰り返し形式は無視されます。
    - 明示的なメンションを提供するサーフェスは引き続き通過します。パターンはフォールバックです。
    - エージェントごとの上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に便利です）。
    - メンションゲートは、メンション検出が可能な場合（ネイティブメンションまたは `mentionPatterns` が設定されている場合）にのみ適用されます。
    - グループまたは送信者を allowlist に追加しても、メンションゲートは無効になりません。すべてのメッセージでトリガーする必要がある場合は、そのグループの `requireMention` を `false` に設定します。
    - グループチャットのプロンプトコンテキストは、解決済みのサイレント返信指示を毎ターン保持します。ワークスペースファイルで `NO_REPLY` の仕組みを重複させるべきではありません。
    - サイレント返信が許可されているグループでは、きれいな空のモデルターンや推論のみのモデルターンは `NO_REPLY` と同等のサイレントとして扱われます。直接チャットでも、直接サイレント返信が明示的に許可されている場合にのみ同じ動作になります。それ以外の場合、空の返信は失敗したエージェントターンのままです。
    - Discord のデフォルトは `channels.discord.guilds."*"` にあります（ギルド/チャンネルごとに上書き可能）。
    - グループ履歴コンテキストはチャンネル全体で一貫してラップされます。メンションゲートされたグループは、保留中のスキップされたメッセージを保持します。常時オンのグループも、チャンネルがサポートしている場合、最近処理されたルームメッセージを保持することがあります。グローバルデフォルトには `messages.groupChat.historyLimit` を使用し、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ/チャンネルのツール制限（任意）

一部のチャンネル設定では、**特定のグループ/ルーム/チャンネル内**で利用できるツールを制限できます。

- `tools`: グループ全体のツールを許可/拒否します。
- `toolsBySender`: グループ内の送信者ごとの上書きです。明示的なキープレフィックスを使用します: `channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。チャンネル ID は正規の OpenClaw チャンネル ID を使用します。`teams` などのエイリアスは `msteams` に正規化されます。従来のプレフィックスなしキーも引き続き受け入れられ、`id:` としてのみ照合されます。

解決順序（最も具体的なものが優先）:

<Steps>
  <Step title="グループ toolsBySender">
    グループ/チャンネルの `toolsBySender` 照合。
  </Step>
  <Step title="グループ tools">
    グループ/チャンネルの `tools`。
  </Step>
  <Step title="デフォルト toolsBySender">
    デフォルト（`"*"`）の `toolsBySender` 照合。
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

## グループ allowlist

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、キーはグループ allowlist として機能します。デフォルトのメンション動作を設定しつつ、すべてのグループを許可するには `"*"` を使用します。

<Warning>
よくある混同: DM ペアリング承認はグループ認可と同じではありません。DM ペアリングをサポートするチャンネルでは、ペアリングストアがアンロックするのは DM のみです。グループコマンドには引き続き、`groupAllowFrom` やそのチャンネルで文書化された設定フォールバックなど、設定 allowlist からの明示的なグループ送信者認可が必要です。
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
  <Tab title="オーナーのみのトリガー（WhatsApp）">
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

## アクティベーション（オーナーのみ）

グループオーナーは、グループごとのアクティベーションを切り替えられます。

- `/activation mention`
- `/activation always`

オーナーは `channels.whatsapp.allowFrom`（未設定の場合はボット自身の E.164）によって決定されます。コマンドは単独のメッセージとして送信します。他のサーフェスは現在 `/activation` を無視します。

## コンテキストフィールド

グループ受信ペイロードは次を設定します。

- `ChatType=group`
- `GroupSubject`（既知の場合）
- `GroupMembers`（既知の場合）
- `WasMentioned`（メンションゲートの結果）
- Telegram フォーラムトピックには `MessageThreadId` と `IsForum` も含まれます。

エージェントシステムプロンプトには、新しいグループセッションの最初のターンにグループイントロが含まれます。これは、モデルに人間のように応答し、Markdown テーブルを避け、空行を最小限にし通常のチャット間隔に従い、リテラルの `\n` シーケンスを入力しないよう促します。チャンネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンス付きの信頼されないメタデータとしてレンダリングされます。

## iMessage 固有事項

- ルーティングまたは allowlist では `chat_id:<id>` を推奨します。
- チャット一覧: `imsg chats --limit 20`。
- グループ返信は常に同じ `chat_id` に返されます。

## WhatsApp システムプロンプト

グループおよび直接プロンプトの解決、ワイルドカード動作、アカウント上書きセマンティクスを含む、正規の WhatsApp システムプロンプトルールについては [WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp 固有事項

WhatsApp のみの動作（履歴注入、メンション処理の詳細）については [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
