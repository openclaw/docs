---
read_when:
    - グループチャットの動作やメンションゲーティングの変更
sidebarTitle: Groups
summary: 各サーフェスにおけるグループチャットの動作（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）
title: グループ
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:23:38Z"
  model: gpt-5.4
  provider: openai
  source_hash: 837055b3cd044ebe3ef9aefe29e36f6471f48025d32169c43b9c5b04a8ac639c
  source_path: channels/groups.md
  workflow: 15
---

OpenClawは、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zaloといった各サーフェスで、グループチャットを一貫して扱います。

## 初心者向けイントロ（2分）

OpenClawは、あなた自身のメッセージングアカウント上で「動作」します。別個のWhatsApp botユーザーは存在しません。**あなた**がグループに参加していれば、OpenClawはそのグループを確認し、そこで応答できます。

デフォルトの動作:

- グループは制限されています（`groupPolicy: "allowlist"`）。
- 明示的にメンションゲーティングを無効にしない限り、返信にはメンションが必要です。

つまり、許可リストに含まれる送信者は、OpenClawにメンションすることでトリガーできます。

<Note>
**要点**

**DMアクセス** は `*.allowFrom` で制御されます。**グループアクセス** は `*.groupPolicy` + 許可リスト（`*.groups`, `*.groupAllowFrom`）で制御されます。**返信トリガー** はメンションゲーティング（`requireMention`, `/activation`）で制御されます。
</Note>

クイックフロー（グループメッセージに対して起こること）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> context only として保存
otherwise -> reply
```

## コンテキスト可視性と許可リスト

グループの安全性には、2種類の異なる制御が関わります。

- **トリガー認可**: 誰がエージェントをトリガーできるか（`groupPolicy`, `groups`, `groupAllowFrom`, チャネル固有の許可リスト）。
- **コンテキスト可視性**: どの補足コンテキストがモデルに注入されるか（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClawは通常のチャット動作を優先し、コンテキストをほぼ受信時のまま保持します。つまり、許可リストは主に「誰がアクションをトリガーできるか」を決めるものであり、引用や履歴内のあらゆる断片に対する普遍的な秘匿境界ではありません。

<AccordionGroup>
  <Accordion title="現在の動作はチャネルごとに異なります">
    - 一部のチャネルでは、特定の経路において補足コンテキストに送信者ベースのフィルタリングがすでに適用されています（たとえばSlackのスレッドシード、Matrixの返信/スレッド参照）。
    - 他のチャネルでは、引用/返信/転送コンテキストは受信時のまま渡されます。

  </Accordion>
  <Accordion title="ハードニングの方向性（予定）">
    - `contextVisibility: "all"`（デフォルト）は、現在の受信時そのままの動作を維持します。
    - `contextVisibility: "allowlist"` は、補足コンテキストを許可リストに含まれる送信者に限定してフィルタリングします。
    - `contextVisibility: "allowlist_quote"` は `allowlist` に加えて、明示的な1件の引用/返信例外を認めます。

    このハードニングモデルが各チャネルで一貫して実装されるまでは、サーフェスごとの違いがあると考えてください。

  </Accordion>
</AccordionGroup>

![グループメッセージフロー](/images/groups-flow.svg)

やりたいことが次の場合...

| 目的 | 設定内容 |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可するが、`@mentions` のときだけ返信する | `groups: { "*": { requireMention: true } }` |
| すべてのグループ返信を無効にする | `groupPolicy: "disabled"` |
| 特定のグループのみ | `groups: { "<group-id>": { ... } }`（`"*"` キーなし） |
| グループ内でトリガーできるのを自分だけにする | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使用します（ルーム/チャネルは `agent:<agentId>:<channel>:channel:<id>` を使用）。
- Telegram forum topics は、各トピックが独自のセッションを持つように、グループIDに `:topic:<threadId>` を追加します。
- ダイレクトチャットはメインセッションを使用します（または設定されている場合は送信者ごと）。
- Heartbeatはグループセッションではスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人DM + 公開グループ（単一エージェント）

はい、これは「個人」トラフィックが**DM**で、「公開」トラフィックが**グループ**である場合にうまく機能します。

理由: 単一エージェントモードでは、DMは通常 **main** セッションキー（`agent:main:main`）に入り、グループは常に **non-main** セッションキー（`agent:main:<channel>:group:<id>`）を使用します。`mode: "non-main"` でサンドボックス化を有効にすると、それらのグループセッションは設定されたサンドボックスバックエンドで実行され、一方でメインのDMセッションはホスト上に残ります。明示的に選択しない場合、Dockerがデフォルトのバックエンドです。

これにより、1つのエージェント「脳」（共有ワークスペース + メモリ）を維持しながら、2つの実行姿勢を持てます。

- **DM**: フルツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

<Note>
本当に別々のワークスペース/ペルソナ（「個人」と「公開」を絶対に混在させてはならない）が必要な場合は、2つ目のエージェント + bindings を使用してください。[Multi-Agent Routing](/ja-JP/concepts/multi-agent)を参照してください。
</Note>

<Tabs>
  <Tab title="DMはホスト、グループはサンドボックス">
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
  <Tab title="グループには許可リストにあるフォルダーだけを見せる">
    「ホストアクセスなし」ではなく「グループはフォルダーXだけ見られる」にしたい場合は、`workspaceAccess: "none"` を維持し、許可リストにあるパスだけをサンドボックスにマウントします。

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

- 設定キーとデフォルト: [Gateway configuration](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- ツールがブロックされる理由のデバッグ: [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
- bind mount の詳細: [Sandboxing](/ja-JP/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UIラベルは、利用可能な場合は `displayName` を使用し、`<channel>:<token>` 形式で表示されます。
- `#room` はルーム/チャネル用に予約されています。グループチャットでは `g-<slug>` を使用します（小文字、スペースは `-` に変換、`#@+._-` は維持）。

## グループポリシー

チャネルごとに、グループ/ルームメッセージの扱い方を制御します。

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

| ポリシー | 動作 |
| ------------- | ------------------------------------------------------------ |
| `"open"` | グループは許可リストをバイパスします。メンションゲーティングは引き続き適用されます。 |
| `"disabled"` | すべてのグループメッセージを完全にブロックします。 |
| `"allowlist"` | 設定された許可リストに一致するグループ/ルームのみ許可します。 |

<AccordionGroup>
  <Accordion title="チャネルごとの注意事項">
    - `groupPolicy` はメンションゲーティング（@mentions を必要とするもの）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使用します（フォールバック: 明示的な `allowFrom`）。
    - DMペアリング承認（`*-allowFrom` の保存エントリ）はDMアクセスのみに適用されます。グループ送信者の認可は、明示的なグループ許可リストのままです。
    - Discord: 許可リストは `channels.discord.guilds.<id>.channels` を使用します。
    - Slack: 許可リストは `channels.slack.channels` を使用します。
    - Matrix: 許可リストは `channels.matrix.groups` を使用します。ルームIDまたはエイリアスを推奨します。参加済みルーム名の参照はベストエフォートであり、解決できない名前は実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用してください。ルームごとの `users` 許可リストにも対応しています。
    - グループDMは別途制御されます（`channels.discord.dm.*`, `channels.slack.dm.*`）。
    - Telegramの許可リストは、ユーザーID（`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字小文字を区別しません。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
    - 実行時の安全性: プロバイダーブロックが完全に欠けている場合（`channels.<provider>` が存在しない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承するのではなく、フェイルクローズドモード（通常は `allowlist`）にフォールバックします。

  </Accordion>
</AccordionGroup>

クイックメンタルモデル（グループメッセージの評価順序）:

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="グループ許可リスト">
    グループ許可リスト（`*.groups`, `*.groupAllowFrom`, チャネル固有の許可リスト）。
  </Step>
  <Step title="メンションゲーティング">
    メンションゲーティング（`requireMention`, `/activation`）。
  </Step>
</Steps>

## メンションゲーティング（デフォルト）

グループメッセージには、グループごとに上書きしない限りメンションが必要です。デフォルトは各サブシステムの `*.groups."*"` にあります。

チャネルが返信メタデータをサポートしている場合、botメッセージへの返信は暗黙のメンションとして扱われます。チャネルが引用メタデータを公開している場合、botメッセージの引用も暗黙のメンションとして扱われることがあります。現在の組み込み対象には、Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUser が含まれます。

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
    - `mentionPatterns` は大文字小文字を区別しない安全なregexパターンです。無効なパターンや、安全でないネストされた繰り返し形式は無視されます。
    - 明示的なメンションを提供するサーフェスでは、それらが引き続き通ります。パターンはフォールバックです。
    - エージェントごとの上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントが1つのグループを共有する場合に便利です）。
    - メンションゲーティングは、メンション検出が可能な場合にのみ適用されます（ネイティブメンション、または `mentionPatterns` が設定されている場合）。
    - サイレント返信が許可されているグループでは、きれいな空応答または推論のみのモデルターンはサイレントとして扱われ、`NO_REPLY` と同等です。ダイレクトチャットでは、空の返信は引き続き失敗したエージェントターンとして扱われます。
    - Discordのデフォルトは `channels.discord.guilds."*"` にあります（guild/channel ごとに上書き可能）。
    - グループ履歴コンテキストは、チャネル間で統一的にラップされ、**pending-only**（メンションゲーティングによってスキップされたメッセージのみ）です。グローバルデフォルトには `messages.groupChat.historyLimit` を使用し、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定してください。

  </Accordion>
</AccordionGroup>

## グループ/チャネルツール制限（任意）

一部のチャネル設定では、**特定のグループ/ルーム/チャネル内** で利用できるツールを制限できます。

- `tools`: グループ全体に対するツールの許可/拒否。
- `toolsBySender`: グループ内の送信者ごとの上書き。明示的なキープレフィックスを使用します: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, および `"*"` ワイルドカード。従来のプレフィックスなしキーも引き続き受け付けられ、`id:` としてのみ一致します。

解決順序（最も具体的なものが優先）:

<Steps>
  <Step title="グループの toolsBySender">
    グループ/チャネルの `toolsBySender` 一致。
  </Step>
  <Step title="グループの tools">
    グループ/チャネルの `tools`。
  </Step>
  <Step title="デフォルトの toolsBySender">
    デフォルト（`"*"`）の `toolsBySender` 一致。
  </Step>
  <Step title="デフォルトの tools">
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
グループ/チャネルのツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます（deny が引き続き優先されます）。一部のチャネルでは、ルーム/チャネルに異なるネスト構造を使用します（例: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`）。
</Note>

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、そのキーはグループ許可リストとして機能します。すべてのグループを許可しつつ、デフォルトのメンション動作を設定したい場合は `"*"` を使用します。

<Warning>
よくある混同: DMペアリング承認はグループ認可と同じではありません。DMペアリングをサポートするチャネルでは、ペアリングストアはDMのみを有効にします。グループコマンドでは引き続き、`groupAllowFrom` や、そのチャネルで文書化されている設定フォールバックなど、設定許可リストからの明示的なグループ送信者認可が必要です。
</Warning>

よくある意図（コピー&ペースト）:

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
  <Tab title="オーナーのみトリガー可能（WhatsApp）">
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

## Activation（owner-only）

グループオーナーは、グループごとのアクティベーションを切り替えられます。

- `/activation mention`
- `/activation always`

オーナーは `channels.whatsapp.allowFrom` によって決まります（未設定の場合はbot自身のE.164）。コマンドは単独のメッセージとして送信してください。他のサーフェスでは現在 `/activation` は無視されます。

## コンテキストフィールド

グループ受信ペイロードでは、次が設定されます。

- `ChatType=group`
- `GroupSubject`（わかる場合）
- `GroupMembers`（わかる場合）
- `WasMentioned`（メンションゲーティングの結果）
- Telegram forum topics では、`MessageThreadId` と `IsForum` も含まれます。

チャネル固有の注意事項:

- BlueBubbles は、`GroupMembers` を設定する前に、名前のないmacOSグループ参加者をローカルのContactsデータベースから任意で補完できます。これはデフォルトでオフであり、通常のグループゲーティングを通過した後にのみ実行されます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターンでグループ用イントロが含まれます。これは、モデルに対して人間のように応答すること、Markdownテーブルを避けること、空行を最小限にして通常のチャットのスペーシングに従うこと、そして文字どおりの `\n` シーケンスを入力しないことを促します。チャネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンス付きの信頼されていないメタデータとしてレンダリングされます。

## iMessage 固有事項

- ルーティングまたは許可リストでは `chat_id:<id>` を優先してください。
- チャット一覧: `imsg chats --limit 20`
- グループ返信は常に同じ `chat_id` に返されます。

## WhatsApp システムプロンプト

グループおよびダイレクトのプロンプト解決、ワイルドカード動作、アカウント上書きセマンティクスを含む、正規のWhatsAppシステムプロンプトルールについては [WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp 固有事項

WhatsApp専用の動作（履歴注入、メンション処理の詳細）については [Group messages](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [Broadcast groups](/ja-JP/channels/broadcast-groups)
- [Channel routing](/ja-JP/channels/channel-routing)
- [Group messages](/ja-JP/channels/group-messages)
- [Pairing](/ja-JP/channels/pairing)
