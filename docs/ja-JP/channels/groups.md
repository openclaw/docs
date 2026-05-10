---
read_when:
    - グループチャットの動作またはメンションゲーティングを変更する
sidebarTitle: Groups
summary: 各サーフェスでのグループチャットの挙動 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: グループ
x-i18n:
    generated_at: "2026-05-10T19:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a040df975829cd35f45577522ea2813fd98fd8babbb42663e502cedde088d89
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo の各サーフェスでグループチャットを一貫して扱います。

## 初心者向け概要（2 分）

OpenClaw はユーザー自身のメッセージングアカウント上に「常駐」します。別個の WhatsApp ボットユーザーはありません。**あなた**がグループにいる場合、OpenClaw はそのグループを確認し、そこで応答できます。

デフォルト動作:

- グループは制限されます（`groupPolicy: "allowlist"`）。
- メンションゲートを明示的に無効化しない限り、返信にはメンションが必要です。
- グループ/チャンネル内の通常の最終返信は、デフォルトでプライベートです。表示されるルーム出力には `message` ツールを使用します。

つまり、許可リストに含まれる送信者は、メンションすることで OpenClaw を起動できます。

<Note>
**要約**

- **DM アクセス**は `*.allowFrom` で制御されます。
- **グループアクセス**は `*.groupPolicy` + 許可リスト（`*.groups`、`*.groupAllowFrom`）で制御されます。
- **返信のトリガー**はメンションゲート（`requireMention`、`/activation`）で制御されます。

</Note>

簡単な流れ（グループメッセージに起こること）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 表示される返信

グループ/チャンネルルームでは、OpenClaw はデフォルトで `messages.groupChat.visibleReplies: "message_tool"` を使用します。
`openclaw doctor --fix` は、これを省略している構成済みチャンネル設定にこのデフォルトを書き込みます。
つまり、エージェントは引き続きターンを処理し、メモリ/セッション状態を更新できますが、通常の最終回答はルームへ自動投稿されません。表示される形で発言するには、エージェントは `message(action=send)` を使用します。

このデフォルトは、ツールを確実に呼び出すモデル/ランタイムに依存します。ログに
アシスタントテキストが表示されている一方で `didSendViaMessagingTool: false` の場合、モデルは
メッセージツールを呼び出す代わりにプライベートに回答しています。これは
Discord/Slack/Telegram の送信失敗ではありません。グループ/チャンネルセッションには
ツール呼び出しが信頼できるモデルを使用するか、
`messages.groupChat.visibleReplies: "automatic"` を設定して、従来の表示される
最終返信を復元してください。

アクティブなツールポリシーでメッセージツールが利用できない場合、OpenClaw は
応答を黙って抑制するのではなく、自動の表示される返信へフォールバックします。
`openclaw doctor` はこの不一致について警告します。

直接チャットやその他のソースターンでは、`messages.visibleReplies: "message_tool"` を使用すると、同じツール専用の表示返信動作をグローバルに適用できます。ハーネスも、これを未設定時のデフォルトとして選択できます。Codex ハーネスは Codex モードの直接チャットでこれを行います。`messages.groupChat.visibleReplies` は、グループ/チャンネルルーム向けのより具体的なオーバーライドとして残ります。

これは、ほとんどの待機モードのターンでモデルに `NO_REPLY` と答えさせる古いパターンを置き換えます。ツール専用モードでは、表示上何もしないことは、単にメッセージツールを呼び出さないことを意味します。

ツール専用モードでエージェントが作業している間も、入力中インジケーターは送信されます。これらのターンでは、エージェントがメッセージツールを呼び出すかどうかを決める前に通常のアシスタントメッセージテキストが一切存在しない可能性があるため、デフォルトのグループ入力モードは "message" から "instant" にアップグレードされます。明示的な入力モード設定は引き続き優先されます。

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

Gateway は、ファイル保存後に `messages` 設定をホットリロードします。再起動が必要なのは、
デプロイでファイル監視または設定リロードが無効になっている場合のみです。

すべてのソースチャットで、表示される出力にメッセージツール経由を必須にするには:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンド対応を持つその他のサーフェス）は `visibleReplies: "message_tool"` をバイパスし、チャンネルネイティブのコマンド UI が期待する応答を受け取れるよう、常に表示される形で返信します。これは検証済みのネイティブコマンドターンにのみ適用されます。テキスト入力された `/...` コマンドや通常のチャットターンは、引き続き設定されたグループデフォルトに従います。

## コンテキストの可視性と許可リスト

グループの安全性には、2 つの異なる制御が関わります。

- **トリガー認可**: エージェントをトリガーできる人（`groupPolicy`、`groups`、`groupAllowFrom`、チャンネル固有の許可リスト）。
- **コンテキストの可視性**: モデルへ注入される補足コンテキスト（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は通常のチャット動作を優先し、コンテキストをおおむね受信したまま維持します。つまり、許可リストは主に誰がアクションをトリガーできるかを決めるものであり、引用や履歴スニペットすべてに対する普遍的な墨消し境界ではありません。

<AccordionGroup>
  <Accordion title="現在の動作はチャンネル固有です">
    - 一部のチャンネルは、特定の経路ですでに補足コンテキストに対して送信者ベースのフィルタリングを適用しています（例: Slack スレッドシード、Matrix の返信/スレッド検索）。
    - その他のチャンネルは、引用/返信/転送コンテキストを受信したまま渡します。

  </Accordion>
  <Accordion title="強化の方向性（計画中）">
    - `contextVisibility: "all"`（デフォルト）は、現在の受信時そのままの動作を維持します。
    - `contextVisibility: "allowlist"` は、補足コンテキストを許可リストに含まれる送信者に絞り込みます。
    - `contextVisibility: "allowlist_quote"` は、`allowlist` に 1 つの明示的な引用/返信例外を加えたものです。

    この強化モデルがチャンネル全体で一貫して実装されるまでは、サーフェスごとの差異を想定してください。

  </Accordion>
</AccordionGroup>

![グループメッセージフロー](/images/groups-flow.svg)

目的別設定:

| 目的                                         | 設定する内容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可し、@メンション時のみ返信する | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効化する                    | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                         | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）         |
| グループ内で自分だけがトリガーできる               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| チャンネル間で 1 つの信頼済み送信者セットを再利用する | `groupAllowFrom: ["accessGroup:operators"]`                |

再利用可能な送信者許可リストについては、[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使用します（ルーム/チャンネルは `agent:<agentId>:<channel>:channel:<id>` を使用します）。
- Telegram フォーラムトピックは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` を追加します。
- 直接チャットはメインセッションを使用します（設定されている場合は送信者ごと）。
- グループセッションでは Heartbeat はスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人 DM + 公開グループ（単一エージェント）

はい。「個人」トラフィックが **DM** で、「公開」トラフィックが **グループ** の場合、これはうまく機能します。

理由: 単一エージェントモードでは、DM は通常 **main** セッションキー（`agent:main:main`）に入り、一方でグループは常に **非 main** セッションキー（`agent:main:<channel>:group:<id>`）を使用します。`mode: "non-main"` でサンドボックス化を有効にすると、それらのグループセッションは設定されたサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。

これにより、1 つのエージェント「頭脳」（共有ワークスペース + メモリ）で、2 つの実行態勢を持てます。

- **DM**: フルツール（ホスト）
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
  <Tab title="グループには許可リスト済みフォルダーのみを見せる">
    「ホストアクセスなし」ではなく「グループはフォルダー X だけを見られる」ようにしたい場合は、`workspaceAccess: "none"` を維持し、許可リスト済みパスだけをサンドボックスにマウントします。

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

- UI ラベルは、利用可能な場合 `displayName` を使用し、`<channel>:<token>` として整形されます。
- `#room` はルーム/チャンネル用に予約されています。グループチャットは `g-<slug>` を使用します（小文字、スペース -> `-`、`#@+._-` は保持）。

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
| `"allowlist"` | 設定された許可リストに一致するグループ/ルームのみ許可します。 |

<AccordionGroup>
  <Accordion title="チャンネル別の注意事項">
    - `groupPolicy` はメンションゲーティング（@mentions が必要）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使用します（フォールバック: 明示的な `allowFrom`）。
    - Signal: `groupAllowFrom` は、受信した Signal グループ ID または送信者の電話番号/UUID のどちらにも一致できます。
    - DM ペアリング承認（`*-allowFrom` ストアエントリ）は DM アクセスにのみ適用されます。グループ送信者の承認は、グループ許可リストで明示したままです。
    - Discord: 許可リストは `channels.discord.guilds.<id>.channels` を使用します。
    - Slack: 許可リストは `channels.slack.channels` を使用します。
    - Matrix: 許可リストは `channels.matrix.groups` を使用します。ルーム ID またはエイリアスを推奨します。参加済みルーム名のルックアップはベストエフォートで、解決できない名前はランタイムで無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用します。ルームごとの `users` 許可リストもサポートされています。
    - グループ DM は別個に制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram 許可リストは、ユーザー ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字と小文字を区別しません。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
    - ランタイム安全性: プロバイダーブロックが完全に存在しない場合（`channels.<provider>` がない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承せず、フェイルクローズモード（通常は `allowlist`）にフォールバックします。

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
  <Step title="メンションゲーティング">
    メンションゲーティング（`requireMention`、`/activation`）。
  </Step>
</Steps>

## メンションゲーティング（デフォルト）

グループメッセージは、グループごとに上書きされない限りメンションが必要です。デフォルトは各サブシステムの `*.groups."*"` にあります。

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
  <Accordion title="メンションゲーティングの注意事項">
    - `mentionPatterns` は大文字と小文字を区別しない安全な正規表現パターンです。無効なパターンや安全でない入れ子反復形式は無視されます。
    - 明示的なメンションを提供するサーフェスは引き続き通過します。パターンはフォールバックです。
    - エージェントごとの上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に便利です）。
    - メンションゲーティングは、メンション検出が可能な場合（ネイティブメンションまたは `mentionPatterns` が設定されている場合）にのみ強制されます。
    - グループまたは送信者を許可リストに入れても、メンションゲーティングは無効になりません。すべてのメッセージをトリガーしたい場合は、そのグループの `requireMention` を `false` に設定します。
    - グループチャットのプロンプトコンテキストは、解決済みのサイレント返信指示を毎ターン保持します。ワークスペースファイルで `NO_REPLY` の仕組みを重複させないでください。
    - サイレント返信が許可されているグループでは、クリーンな空のモデルターンまたは推論のみのモデルターンを、`NO_REPLY` と同等のサイレントとして扱います。ダイレクトチャットでは、ダイレクトのサイレント返信が明示的に許可されている場合にのみ同じ扱いになります。それ以外の場合、空の返信は失敗したエージェントターンのままです。
    - Discord のデフォルトは `channels.discord.guilds."*"` にあります（ギルド/チャンネルごとに上書き可能）。
    - グループ履歴コンテキストはチャンネル全体で一貫してラップされます。メンションゲート付きグループは保留中のスキップされたメッセージを保持します。常時オンのグループも、チャンネルがサポートしている場合は最近処理されたルームメッセージを保持することがあります。グローバルデフォルトには `messages.groupChat.historyLimit` を、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ/チャンネルのツール制限（任意）

一部のチャンネル設定では、**特定のグループ/ルーム/チャンネル内**で利用できるツールを制限できます。

- `tools`: グループ全体のツールを許可/拒否します。
- `toolsBySender`: グループ内の送信者ごとの上書きです。明示的なキープレフィックスを使用します: `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。従来のプレフィックスなしキーも引き続き受け入れられ、`id:` としてのみ一致します。

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

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、キーはグループ許可リストとして機能します。すべてのグループを許可しつつデフォルトのメンション動作も設定するには `"*"` を使用します。

<Warning>
よくある混同: DM ペアリング承認はグループ承認とは異なります。DM ペアリングをサポートするチャンネルでは、ペアリングストアが解除するのは DM のみです。グループコマンドには、`groupAllowFrom` やそのチャンネルで文書化された設定フォールバックなど、設定の許可リストによる明示的なグループ送信者承認が引き続き必要です。
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

グループ所有者は、グループごとのアクティベーションを切り替えられます。

- `/activation mention`
- `/activation always`

所有者は `channels.whatsapp.allowFrom`（未設定の場合はボット自身の E.164）によって決まります。コマンドは単独のメッセージとして送信します。他のサーフェスは現在 `/activation` を無視します。

## コンテキストフィールド

グループ受信ペイロードは次を設定します。

- `ChatType=group`
- `GroupSubject`（既知の場合）
- `GroupMembers`（既知の場合）
- `WasMentioned`（メンションゲーティングの結果）
- Telegram フォーラムトピックには `MessageThreadId` と `IsForum` も含まれます。

エージェントシステムプロンプトには、新しいグループセッションの最初のターンにグループの導入が含まれます。これは、モデルに人間のように応答すること、Markdown テーブルを避けること、空行を最小限にして通常のチャット間隔に従うこと、リテラルの `\n` シーケンスを入力しないことを促します。チャンネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンス付きの信頼されていないメタデータとしてレンダリングされます。

## iMessage 固有事項

- ルーティングまたは許可リスト化では `chat_id:<id>` を推奨します。
- チャットを一覧表示: `imsg chats --limit 20`。
- グループ返信は常に同じ `chat_id` に戻されます。

## WhatsApp システムプロンプト

グループおよびダイレクトのプロンプト解決、ワイルドカード動作、アカウント上書きセマンティクスを含む、標準の WhatsApp システムプロンプトルールについては [WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp 固有事項

WhatsApp のみの動作（履歴注入、メンション処理の詳細）については [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
